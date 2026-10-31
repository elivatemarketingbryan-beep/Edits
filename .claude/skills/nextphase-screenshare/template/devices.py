#!/usr/bin/env python3
"""devices.py — the six screenshare devices, as markup + arrival plan.

Every device returns (html, anims). `anims` are (id, kind, delay, extra)
where the delay is measured from the moment the device becomes visible.
A None delay means "present from the start, no arrival" — that is how a
list or a board carries rows forward from an earlier run.
"""
import math, os, subprocess

V = os.path.dirname(os.path.abspath(__file__))

# An `at` entry is one of three things:
#   a float   arrive at that delay
#   None      already present, carried forward from an earlier run
#   HIDDEN    present in the LAYOUT but invisible, so the block keeps its
#             full height and nothing above it shifts when it later arrives
HIDDEN = False

# image sizes, read once, so marks can be given in the SOURCE image's pixels
_SIZE = {}
def size(name):
    if name not in _SIZE:
        out = subprocess.run(["ffprobe", "-v", "error", "-show_entries",
                              "stream=width,height", "-of", "csv=p=0",
                              f"{V}/assets/broll/{name}"],
                             capture_output=True, text=True).stdout.strip()
        w, h = out.split(",")[:2]
        _SIZE[name] = (int(w), int(h))
    return _SIZE[name]

# ══ device builders ═══════════════════════════════════════════════════════
# Each returns (html, anims). `anims` are (id, kind, delay) with the delay
# measured from the moment the device becomes visible.

def _marks(uid, src, disp_w, marks, y_off=0):
    """Mark layer over a screenshot. Coords are in the SOURCE image's pixels.

    y_off shifts every mark down by a fixed, UNSCALED amount — ss-window draws
    a title bar above the capture, so a mark measured from the image's own top
    lands one bar too high without it."""
    sw, sh = size(src)
    k = disp_w / sw
    html, anims = [], []
    for i, m in enumerate(marks):
        mid = f"{uid}m{i}"
        x, y, w, h = [round(v * k, 1) for v in (m["x"], m["y"], m["w"], m["h"])]
        y += y_off
        acc = m.get("accent", "cost")
        if m["type"] == "hl":
            html.append(f'<div class="ss-hlbox" id="{mid}" '
                        f'style="left:{x}px;top:{y}px;width:{w}px;height:{h}px"></div>')
        elif m["type"] == "rule":
            html.append(f'<div class="ss-rule {acc}" id="{mid}" '
                        f'style="left:{x}px;top:{y+h}px;width:{w}px"></div>')
        elif m["type"] == "circle":
            rx, ry = w / 2 - 4, h / 2 - 4
            per = math.pi * (3 * (rx + ry) - math.sqrt((3 * rx + ry) * (rx + 3 * ry)))
            html.append(
                f'<svg class="ss-circle {acc}" id="{mid}" '
                f'style="left:{x}px;top:{y}px;width:{w}px;height:{h}px" '
                f'viewBox="0 0 {w} {h}"><ellipse cx="{w/2}" cy="{h/2}" '
                f'rx="{rx}" ry="{ry}" stroke-dasharray="{per:.1f}" '
                f'stroke-dashoffset="{per:.1f}"/></svg>')
            anims.append((mid, "draw", m["at"], round(per, 1)))
            continue
        anims.append((mid, "mark", m["at"], None))
    return "".join(html), anims


def shot(uid, src, w, label=None, marks=(), at=None):
    m_html, anims = _marks(uid, src, w, marks)
    cap = f'<div class="ss-shot-cap">{label}</div>' if label else ""
    html = (f'<div class="ss-solo" style="width:100%;height:100%">'
            f'<div class="ss-shot-wrap" id="{uid}" style="width:{w}px">'
            f'<img class="ss-shot" src="assets/broll/{src}" alt="" style="width:{w}px">'
            f'{m_html}{cap}</div></div>')
    return html, anims


WINDOW_BAR = 56          # .ss-window-bar height, from ss.css

def window(uid, title, src, w, label=None, marks=(), at=None):
    m_html, anims = _marks(uid, src, w, marks, y_off=WINDOW_BAR)
    cap = f'<div class="ss-shot-cap">{label}</div>' if label else ""
    html = (f'<div class="ss-solo" style="width:100%;height:100%">'
            f'<div id="{uid}" style="position:relative">'
            f'<div class="ss-window" style="width:{w}px">'
            f'<div class="ss-window-bar"><div class="ss-window-dots">'
            f'<i></i><i></i><i></i></div>'
            f'<div class="ss-window-title">{title}</div></div>'
            f'<img class="ss-window-body" src="assets/broll/{src}" alt="" '
            f'style="width:{w}px"></div>{m_html}{cap}</div></div>')
    return html, anims


def callout(uid, n, label, accent="", unit=""):
    u = f'<span class="unit">{unit}</span>' if unit else ""
    html = (f'<div class="ss-solo" style="width:100%;height:100%">'
            f'<div class="ss-callout" id="{uid}"><span class="n {accent}">{n}{u}</span>'
            f'<span class="lab">{label}</span></div></div>')
    return html, []


def compare(uid, left, right, at_right=None):
    """Two callouts with a hairline between — the only multi-callout layout."""
    ln, ll, la = left
    rn, rl, ra = right
    html = (f'<div class="ss-solo" style="width:100%;height:100%">'
            f'<div class="ss-compare" id="{uid}">'
            f'<div class="ss-callout" id="{uid}L"><span class="n {la}">{ln}</span>'
            f'<span class="lab">{ll}</span></div>'
            f'<div class="rule" id="{uid}R"></div>'
            f'<div class="ss-callout" id="{uid}B"><span class="n {ra}">{rn}</span>'
            f'<span class="lab">{rl}</span></div></div></div>')
    anims = []
    if at_right is not None:
        anims = [(f"{uid}R", "enter", at_right, None),
                 (f"{uid}B", "enter", at_right, None)]
    return html, anims


SVG = {
 "arrow": '<path d="M4 12h16M14 6l6 6-6 6"/>',
 "check": '<path d="M4 13l5 5L20 7"/>',
 "dash":  '<path d="M6 12h12"/>',
 "clock": '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 "coin":  '<circle cx="12" cy="12" r="9"/><path d="M9 9h5a2 2 0 010 4H9h5a2 2 0 010 4H9M12 6v12"/>',
 "brain": '<path d="M12 5a3 3 0 00-3 3 3 3 0 00-1 5.8V17a2 2 0 002 2h2zM12 5a3 3 0 013 3 3 3 0 011 5.8V17a2 2 0 01-2 2h-2z"/>',
 "hand":  '<path d="M8 12V6a1.5 1.5 0 013 0v5M11 11V4.5a1.5 1.5 0 013 0V11M14 11V6.5a1.5 1.5 0 013 0V14a6 6 0 01-6 6h-1a5 5 0 01-5-5v-3a1.5 1.5 0 013 0"/>',
 "mail":  '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
 "bolt":  '<path d="M13 3L5 13h6l-1 8 8-10h-6z"/>',
 "tag":   '<path d="M3 11V5a2 2 0 012-2h6l10 10-8 8z"/><circle cx="7.5" cy="7.5" r="1.4"/>',
 "shield":'<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
 "search":'<circle cx="11" cy="11" r="6"/><path d="M16 16l4 4"/>',
 "slow":  '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
}

def node(uid, icon, title, sub, accent="", hide=False):
    col = {"": "--ss-blue", "win": "--ss-green", "cost": "--ss-red"}[accent]
    h = ' style="opacity:0"' if hide else ''
    return (f'<div class="ss-node" id="{uid}"{h}><div class="tile {accent}">'
            f'<svg viewBox="0 0 24 24" fill="none" stroke="var({col})" '
            f'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
            f'{SVG[icon]}</svg></div>'
            f'<div><div class="t">{title}</div><div class="s">{sub}</div></div></div>')


def board(uid, items, col=False, at=(), w=None):
    """items: list of (icon, title, sub, accent). Builds node by node."""
    parts, anims = [], []
    for i, (icon, t, s, acc) in enumerate(items):
        if i:
            eid = f"{uid}e{i}"
            ehide = ' style="opacity:0"' if (i < len(at) and at[i] is HIDDEN) else ''
            parts.append(f'<div class="ss-edge live{" vert" if col else ""}" '
                         f'id="{eid}"{ehide}></div>')
            if i < len(at) and at[i] is not None and at[i] is not HIDDEN:
                anims.append((eid, "enter", at[i], None))
        nid = f"{uid}n{i}"
        hide = i < len(at) and at[i] is HIDDEN
        parts.append(node(nid, icon, t, s, acc, hide=hide))
        if i < len(at) and at[i] is not None and at[i] is not HIDDEN:
            anims.append((nid, "enter", at[i], None))
    cls = "ss-board col" if col else "ss-board"
    wst = f";width:{w}px" if w else ""
    html = (f'<div class="ss-solo" style="width:100%;height:100%">'
            f'<div class="{cls}" id="{uid}" style="max-width:100%{wst}">'
            f'{"".join(parts)}</div></div>')
    return html, anims


def lst(uid, rows, at=(), align="center", big=False):
    """rows: list of (text, state) where state is 'done' | 'todo' | 'num:N'."""
    parts, anims = [], []
    for i, (text, state) in enumerate(rows):
        rid = f"{uid}r{i}"
        if state.startswith("num:"):
            badge = f'<span class="num">{state[4:]}</span>'
            cls = "row"
        elif state == "no":
            # a limit, not a win — a drawn bar in the cost accent, never a
            # crossed-out check and never an emoji
            cls = "row"
            badge = (f'<span class="chk no"><svg viewBox="0 0 24 24">'
                     f'{SVG["dash"]}</svg></span>')
        else:
            cls = "row todo" if state == "todo" else "row"
            badge = (f'<span class="chk"><svg viewBox="0 0 24 24">'
                     f'{SVG["check"]}</svg></span>')
        h = ' style="opacity:0"' if (i < len(at) and at[i] is HIDDEN) else ''
        parts.append(f'<div class="{cls}" id="{rid}"{h}>{badge}{text}</div>')
        if i < len(at) and at[i] is not None and at[i] is not HIDDEN:
            anims.append((rid, "enter", at[i], None))
    just = "flex-start" if align == "left" else "center"
    cls = "ss-list big" if big else "ss-list"
    html = (f'<div class="ss-solo" style="width:100%;height:100%;'
            f'justify-content:{just}">'
            f'<div class="{cls}" id="{uid}">{"".join(parts)}</div></div>')
    return html, anims


def row2(uid, a, b, at_b=None):
    """Two shots side by side with a hairline — the compare pattern."""
    (asrc, aw, alab), (bsrc, bw, blab) = a, b
    html = (f'<div class="ss-row" style="width:100%;height:100%">'
            f'<div class="ss-shot-wrap" id="{uid}A" style="width:{aw}px">'
            f'<img class="ss-shot" src="assets/broll/{asrc}" alt="" style="width:{aw}px">'
            f'<div class="ss-shot-cap">{alab}</div></div>'
            f'<div class="rule" id="{uid}R"></div>'
            f'<div class="ss-shot-wrap" id="{uid}B" style="width:{bw}px">'
            f'<img class="ss-shot" src="assets/broll/{bsrc}" alt="" style="width:{bw}px">'
            f'<div class="ss-shot-cap">{blab}</div></div></div>')
    anims = []
    if at_b is not None:
        anims = [(f"{uid}R", "enter", at_b, None), (f"{uid}B", "enter", at_b, None)]
    return html, anims


def col2(uid, a, b, at_b=None):
    """Two wide shots stacked, the lower one arriving. The compare pattern
    when both artefacts are strips rather than cards."""
    (asrc, aw, alab), (bsrc, bw, blab) = a, b
    html = (f'<div class="ss-stack" style="width:100%;height:100%;'
            f'justify-content:center">'
            f'<div class="ss-shot-wrap" id="{uid}A" style="width:{aw}px">'
            f'<img class="ss-shot" src="assets/broll/{asrc}" alt="" style="width:{aw}px">'
            f'<div class="ss-shot-cap">{alab}</div></div>'
            f'<div class="ss-shot-wrap" id="{uid}B" style="width:{bw}px">'
            f'<img class="ss-shot" src="assets/broll/{bsrc}" alt="" style="width:{bw}px">'
            f'<div class="ss-shot-cap">{blab}</div></div></div>')
    return html, ([] if at_b is None else [(f"{uid}B", "enter", at_b, None)])


def stack(uid, top_html, bot_html, at_bot=None):
    html = (f'<div class="ss-stack" style="width:100%;height:100%;'
            f'justify-content:center">{top_html}{bot_html}</div>')
    return html, ([] if at_bot is None else [(f"{uid}B", "enter", at_bot, None)])




# ══ v2 devices — the half ground ══════════════════════════════════════════

HALF_W, HALF_H = 1184, 740          # the UI card's box, exact (see ss.css)


def _fit(src, box_w=HALF_W, box_h=HALF_H, cap=True, max_up=1.0):
    """Largest w x h at the media's own aspect that fits the box.

    Nothing is cropped, and a STILL is never upscaled past max_up — a 320px
    capture blown up to fill 1184px is mush, and mush is worse than small.
    A recording is exempt: it is 1440 wide, so filling the box is a downscale."""
    sw, sh = size(src)
    k = min(box_w / sw, (box_h - (44 if cap else 0)) / sh)
    if not src.endswith(".mp4"):
        k = min(k, max_up)
    return int(round(sw * k)), int(round(sh * k))


def panel(uid, src, label=None, marks=(), ctx=None, box_w=HALF_W, box_h=HALF_H,
          loop=True, speed=1.0):
    """A real capture or a real RECORDING as a card on the surface.

    A .mp4 source becomes a playing clip — the screen actually moves, which is
    real motion rather than something animated on top of a still."""
    w, h = _fit(src, box_w, box_h, cap=bool(label))
    if src.endswith(".mp4"):
        d0 = (ctx or {}).get("d0", 0.0)
        dur = (ctx or {}).get("dur", 4.0)
        ms = (ctx or {}).get("media", 0.0)
        media = ('<video class="clip" id="%sv" src="assets/broll/%s" muted '
                 'data-has-audio="false" data-start="%.4f" data-duration="%.4f" '
                 'data-media-start="%.4f" data-loop="%s" data-track-index="5">'
                 '</video>' % (uid, src, d0, dur, ms, "true" if loop else "false"))
        m_html, anims = "", []
    else:
        media = '<img src="assets/broll/%s" alt="">' % src
        m_html, anims = _marks(uid, src, w, marks)
    cap = '<div class="ss-panel-cap">%s</div>' % label if label else ""
    html = ('<div class="ss-panelwrap" id="%s">'
            '<div class="ss-panel" style="width:%dpx;height:%dpx">%s</div>'
            '%s%s</div>' % (uid, w, h, media, m_html, cap))
    return html, anims


def panelstack(uid, items, ctx=None, at_second=None):
    """Two UI cards stacked inside one half — a cite-then-show beat."""
    parts, anims = [], []
    n = len(items)
    each_h = (HALF_H - 28 * (n - 1)) // n
    for i, (src, lab) in enumerate(items):
        w, h = _fit(src, HALF_W, each_h, cap=bool(lab))
        sid = "%s%s" % (uid, "ABCD"[i])
        media = '<img src="assets/broll/%s" alt="">' % src
        cap = '<div class="ss-panel-cap">%s</div>' % lab if lab else ""
        parts.append('<div class="ss-panelwrap" id="%s">'
                     '<div class="ss-panel" style="width:%dpx;height:%dpx">%s</div>'
                     '%s</div>' % (sid, w, h, media, cap))
        if i == 1 and at_second is not None:
            anims.append((sid, "enter", at_second, None))
    return ('<div class="ss-panelstack" id="%s">%s</div>'
            % (uid, "".join(parts)), anims)


def big(uid, n, label, accent=""):
    """The emphasis number. The one place this cut gets loud."""
    return ('<div class="ss-big" id="%s"><span class="n %s">%s</span>'
            '<span class="lab">%s</span></div>' % (uid, accent, n, label)), []
