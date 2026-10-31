#!/usr/bin/env python3
"""
build.py — the persa engine. Turns beats.json into index.html (a HyperFrames composition).

    python3 build.py                      # writes index.html, prints warnings
    npx --yes hyperframes check .         # the gate
    npx --yes hyperframes render . -o out/visual.mp4 -q draft     # or -q delivery for the final

You normally never edit this file. You edit beats.json — the beat map for THIS video — and
re-run it. The style rules live in the skill's reference/ folder; this file only executes them.

INPUTS (all in this folder)
  beats.json             the beat map (see beats.example.json in the skill's template/)
  brand.json             a snapshot of the creator's brand (copied in by new-video.py)
  geometry.json          head top / neck in source pixels (written by cutout.py)
  assets/recording.mp4   the take, 1080x1920 30fps CFR (new-video.py normalises it)
  assets/transcript.json word-level transcript (transcribe.py)
  assets/person.webm     the matte, if the cut-out is on (cutout.py)
  assets/recording-vig.mp4 + assets/person-vig.webm   the same two with the vignette baked in,
                         so the head painted over the type matches the darkened frame exactly

THE LAYER ORDER (z-index in persa-roles.css, never data-track-index):
  camera → surface → camera card → card cut-out → vignette → display type → occluder → window → caption
"""
import json
import pathlib
import subprocess
import sys

D = pathlib.Path(__file__).resolve().parent
W, H, FPS = 1080, 1920, 30
CAP_Y = 1400                                   # 72.9% — the ONE caption line. It never moves.
CARD = dict(left=114, top=1143, w=861, h=777)  # measured off the reference, at 1080x1920
CAM_S = 0.81                                   # the camera must OVERFILL the 861px card
CAM_W, CAM_H = round(W * CAM_S), round(H * CAM_S)
HEAD_ABOVE_CARD = 120                          # the head breaks the card's top edge by this much

warnings = []


def warn(msg):
    warnings.append(msg)


def load(name, default=None):
    p = D / name
    if not p.exists():
        if default is None:
            sys.exit(f"build.py: missing {name}")
        return default
    return json.loads(p.read_text())


def probe_duration(path):
    try:
        out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                              "-of", "csv=p=0", str(path)], capture_output=True, text=True).stdout
        return float(out.strip())
    except Exception:
        return None


spec = load("beats.json")
brand = load("brand.json", {})
geo = load("geometry.json", {})
words = load("assets/transcript.json", [])

GRADE = brand.get("grade", "film") == "film" and (D / "grade-persa.svg").exists()
HAS_CUT = (D / "assets/person.webm").exists() and brand.get("cutout", "quick") != "off"
HAS_VIG = HAS_CUT and (D / "assets/recording-vig.mp4").exists() and (D / "assets/person-vig.webm").exists()
ADV = float(brand.get("display_advance") or 0.50)
FIXES = {int(k): v for k, v in (spec.get("fixes") or {}).items() if str(k).isdigit()}
DUR = float(spec.get("duration") or probe_duration(D / "assets/recording.mp4") or 0)
if DUR <= 0:
    sys.exit("build.py: no duration — set \"duration\" in beats.json")

# ── camera geometry for the card, solved from the measured head top ─────────────────────
head_top = float(geo.get("head_top", 0.372 * H))
cam_left = round(CARD["left"] - (CAM_W - CARD["w"]) / 2 + float(geo.get("card_dx", 0)))
cam_left = max(CARD["left"] + CARD["w"] - CAM_W, min(CARD["left"], cam_left))
cam_top = round(CARD["top"] - HEAD_ABOVE_CARD - head_top * CAM_S)
if cam_top + CAM_H < H:
    warn(f"recording framed low: card camera clamped (head lands {H - CAM_H - (CARD['top'] - HEAD_ABOVE_CARD - head_top * CAM_S):.0f}px higher)")
    cam_top = H - CAM_H


def fit(word, cap=290, box=940):
    """Stamp a display size so the word never wraps or leaves the frame. No space before px."""
    n = max(1, len(word))
    return max(60, min(cap, int(box / (ADV * n))))


body, track = [], [10]


def t():
    track[0] += 1
    return track[0]


def add(s):
    body.append(s)


OCCLUDABLE = ("emph", "payoff", "tstack", "cta", "rep2", "mline", "arcwrap", "bub", "annot", "pillrow")


def clip(cls, s, d, inner="", tag="div", extra="", style=""):
    st = f' style="{style}"' if style else ""
    if cls.split()[0] in OCCLUDABLE and "allow-occlusion" not in extra:
        extra += " data-layout-allow-occlusion"   # the head passing in front IS the move
    if tag == "div":
        return (f'  <div class="clip {cls}" data-start="{s:.3f}" data-duration="{d:.3f}" '
                f'data-track-index="{t()}"{extra}{st}>{inner}</div>')
    raise ValueError(tag)


vid_n = [0]


def video(cls, src, s, d, media_start, style="", graded=False):
    vid_n[0] += 1
    g = " graded" if graded and GRADE else ""
    st = f' style="{style}"' if style else ""
    return (f'<video class="clip {cls}{g}" id="v{vid_n[0]}" src="{src}" data-start="{s:.3f}" '
            f'data-duration="{d:.3f}" data-media-start="{media_start:.3f}" data-track-index="{t()}" '
            f'muted playsinline{st}></video>')


def img(cls, src, s, d, style="", graded=False):
    g = " graded" if graded and GRADE else ""
    st = f' style="{style}"' if style else ""
    return (f'  <img class="clip {cls}{g}" src="{src}" data-start="{s:.3f}" data-duration="{d:.3f}" '
            f'data-track-index="{t()}"{st} alt=""/>')


def surface(src, s, d, media_start=0.0, cls="uifull", graded=False):
    if src.lower().endswith((".mp4", ".webm", ".mov")):
        return "  " + video(cls, src, s, d, media_start, graded=graded)
    return img(cls, src, s, d, graded=graded)


def timing(o, s, e):
    at = float(o.get("at", s))
    dur = float(o.get("dur", max(0.3, e - at - 0.10)))
    if at < s - 1e-3 or at + dur > e + 1e-3:
        warn(f"overlay '{o.get('word') or o.get('text') or o.get('src')}' runs outside its beat {s:.2f}-{e:.2f}")
    return at, dur


BIG_TYPE = ("emph", "rep", "payoff", "arc", "mline", "react", "bubble", "mark")


def overlays(b, s, e):
    """Display type on a photographic beat. Returns True if anything big was placed.
    Only dict-valued keys are overlays — a title beat's own "pill"/"mark" strings are not."""
    b = {k: v for k, v in b.items() if isinstance(v, dict)}
    big = False
    if "emph" in b:
        o = b["emph"]; at, dur = timing(o, s, e); w = o["word"].upper()
        tone = "e-a" if o.get("tone", "white") == "accent" else "e-w"
        add(clip(f"emph {tone}", at, dur, w, style=f"top:{o.get('top', 300)}px;font-size:{fit(w)}px"))
        big = True
    if "rep" in b:
        o = b["rep"]; at, dur = timing(o, s, e); w = o["word"].upper(); sz = fit(w, cap=230)
        top = o.get("top", 130)
        add(clip("emph e-w", at, dur, w, style=f"top:{top}px;font-size:{sz}px"))
        for k, (dx, dy) in enumerate(((240, 175), (500, 350))):
            st = at + 0.18 * (k + 1)
            add(clip("rep2", st, max(0.2, at + dur - st), w, extra=" data-layout-allow-overlap",
                     style=f"top:{top + dy}px;left:{dx}px;font-size:{sz}px"))
        big = True
    if "payoff" in b:
        o = b["payoff"]; at, dur = timing(o, s, e); w = o["word"].upper()
        add(clip("payoff", at, dur, w, style=f"top:{o.get('top', 300)}px;font-size:{fit(w)}px"))
        big = True
    if "mline" in b:
        o = b["mline"]; at, dur = timing(o, s, e)
        if len(o["text"]) > 22:
            warn(f"marker line '{o['text']}' is {len(o['text'])} chars — it must never wrap; shorten it")
        add(clip("mline", at, dur, o["text"], style=f"top:{o.get('top', 430)}px"))
        big = True
    if "pill" in b:
        o = b["pill"]; at, dur = timing(o, s, e)
        add(clip("pillrow", at, dur, f'<span class="tpill">{o["text"]}</span>', style=f"top:{o.get('top', 300)}px"))
    if "react" in b:
        o = b["react"]; at, dur = timing(o, s, e)
        add(clip("annot areact", at, dur, o["word"].upper(),
                 style=f"left:0px;top:{o.get('top', 560)}px;width:1080px;text-align:center;font-size:78px"))
        big = True
    if "arc" in b:
        o = b["arc"]; at, dur = timing(o, s, e); txt = o["text"]
        pid = f"arcp{t()}"
        svg = (f'<svg class="arcsvg" viewBox="0 0 1080 1000" aria-label="{txt}"><defs>'
               f'<path id="{pid}" d="M 10 360 A 1200 1200 0 0 1 1070 660" fill="none"/></defs>'
               f'<text><textPath href="#{pid}" startOffset="50%" text-anchor="middle">{txt}</textPath></text></svg>')
        add(clip("arcwrap", at, dur, svg))
        big = True
    if "bubble" in b:
        o = b["bubble"]; at, dur = timing(o, s, e)
        svg = ('<svg class="bubsvg" viewBox="0 0 44 30" shape-rendering="crispEdges" aria-hidden="true">'
               '<path d="M2 0 H42 V2 H44 V18 H42 V20 H14 V22 H12 V24 H10 V26 H8 V24 H6 V22 H4 V20 H2 V18 '
               'H0 V2 H2 Z" fill="#ffffff" stroke="#111111" stroke-width="2"/></svg>'
               f'<span class="bubtx">{o["word"].upper()}</span>')
        add(clip("bub", at, dur, svg, style=f"left:{o.get('x', 300)}px;top:{o.get('y', 380)}px"))
        big = True
    if "mark" in b:
        o = b["mark"]; at, dur = timing(o, s, e); x, y, w, h = o.get("box", [190, 300, 700, 375])
        add(img("bigmark", o["src"], at, dur, style=f"left:{x}px;top:{y}px;width:{w}px;height:{h}px"))
        big = True
    return big


def camera_full(s, d, vig):
    src = "assets/recording-vig.mp4" if vig else "assets/recording.mp4"
    add("  " + video("cam", src, s, d, s, graded=True))


def occluder(s, d, vig):
    src = "assets/person-vig.webm" if vig else "assets/person.webm"
    add("  " + video("occ", src, s, d, s, graded=True))


def css_vignette(s, d):
    add(clip("vig", s, d))


def card(s, d):
    inner = video("", "assets/recording.mp4", s, d, s, graded=True,
                  style=f"left:{cam_left - CARD['left']}px;top:{cam_top - CARD['top']}px;"
                        f"width:{CAM_W}px;height:{CAM_H}px")
    add(f'  <div class="camcard" data-layout-allow-overflow>{inner}</div>')
    if HAS_CUT:
        add("  " + video("cardcut", "assets/person.webm", s, d, s, graded=True,
                         style=f"left:{cam_left}px;top:{cam_top}px;width:{CAM_W}px;height:{CAM_H}px"))


# ── validate the beat map ───────────────────────────────────────────────────────────────
beats = spec["beats"]
prev = 0.0
for i, b in enumerate(beats):
    s, e = float(b["start"]), float(b["end"])
    if abs(s - prev) > 0.02:
        warn(f"beat {i} starts at {s:.2f} but the previous one ended at {prev:.2f} — gap or overlap")
    if e <= s:
        sys.exit(f"build.py: beat {i} ends before it starts")
    prev = e
if abs(prev - DUR) > 0.05:
    warn(f"beats end at {prev:.2f} but the video is {DUR:.2f}s")

# the demo spine: persa wants one real moving UI on screen for ~15s+
run = best = 0.0
for b in beats:
    moving_ui = b["kind"] == "ui" and str(b.get("src", "")).lower().endswith((".mp4", ".webm", ".mov"))
    run = run + (float(b["end"]) - float(b["start"])) if moving_ui else 0.0
    best = max(best, run)
if best < 15:
    warn(f"longest continuous real-UI recording is {best:.1f}s — persa wants a 15s+ demo spine "
         f"(reference/STYLE.md). Without one it is a talking head with stickers.")

# ── emit ────────────────────────────────────────────────────────────────────────────────
cta_start = None
for i, b in enumerate(beats):
    s, e = float(b["start"]), float(b["end"]); d = e - s; k = b["kind"]
    if k == "face":
        has_type = any(key in b for key in BIG_TYPE)
        vig = HAS_VIG and has_type
        camera_full(s, d, vig)
        if has_type and not vig:
            css_vignette(s, d)
        if overlays(b, s, e) and HAS_CUT:
            occluder(s, d, vig)
    elif k == "title":
        camera_full(s, d, HAS_VIG)
        if not HAS_VIG:
            css_vignette(s, d)
        mark = f'<img class="tmark" src="{b["mark"]}" alt=""/>' if b.get("mark") else ""
        pill = f'<div class="tpill">{b["pill"]}</div>' if b.get("pill") else ""
        line = f'<div class="tline">{b["line"]}</div>' if b.get("line") else ""
        word = b.get("word", "").upper()
        if b.get("line") and len(b["line"]) > 22:
            warn(f"title line '{b['line']}' may wrap — keep it under ~22 chars")
        add(clip("tstack", s, d, f'{pill}{mark}{line}<div class="tword" style="font-size:{fit(word, 260)}px">{word}</div>'))
        overlays(b, s, e)
        if HAS_CUT:
            occluder(s, d, HAS_VIG)
    elif k == "ui":
        add(surface(b["src"], s, d, float(b.get("media_start", 0))))
        if b.get("card", True):
            card(s, d)
        if "annot" in b:
            o = b["annot"]; at, dur = timing(o, s, e)
            add(clip("annot", at, dur, o["text"],
                     style=f"left:{o.get('x', 70)}px;top:{o.get('y', 150)}px;font-size:{o.get('size', 58)}px"))
        if "name" in b:
            o = b["name"]; at, dur = timing(o, s, e)
            add(clip("emph e-w", at, dur, o["word"].upper(), style=f"top:{o.get('top', 130)}px;font-size:150px"))
        if "pill" in b:
            o = b["pill"]; at, dur = timing(o, s, e)
            add(clip("pillrow", at, dur, f'<span class="tpill">{o["text"]}</span>', style=f"top:{o.get('top', 80)}px"))
    elif k == "window":
        camera_full(s, d, False)
        css_vignette(s, d)
        x, y, w, h = b.get("box", [46, 300, 988, 552])
        lead = float(b.get("lead", 0.20))
        if str(b["src"]).lower().endswith((".mp4", ".webm", ".mov")):
            add("  " + video("window", b["src"], s + lead, d - lead, float(b.get("media_start", 0)),
                             style=f"left:{x}px;top:{y}px;width:{w}px;height:{h}px"))
        else:
            add(img("window", b["src"], s + lead, d - lead, style=f"left:{x}px;top:{y}px;width:{w}px;height:{h}px"))
        overlays(b, s, e)
    elif k == "broll":
        add(surface(b["src"], s, d, float(b.get("media_start", 0)), cls="broll", graded=True))
        if "obj" in b:
            o = b["obj"]; x, y, w, h = o["box"]
            add(img("obj", o["src"], s, d, style=f"left:{x}px;top:{y}px;width:{w}px;height:{h}px"))
        if any(key in b for key in BIG_TYPE):
            css_vignette(s, d)
        overlays(b, s, e)
    elif k == "cta":
        cta_start = s
        camera_full(s, d, HAS_VIG)
        if not HAS_VIG:
            css_vignette(s, d)
        kw = (b.get("keyword") or brand.get("creator", {}).get("cta_keyword") or "LINK").upper()
        line = b.get("line", "comment")
        pill = f'<div class="tpill">{b["pill"]}</div>' if b.get("pill") else ""
        ksz = fit(kw + "  ", 250)
        add(clip("cta", s + 0.10, d - 0.10,
                 f'{pill}<div class="ctaline">{line}</div>'
                 f'<div class="tword" style="font-size:{ksz}px">&ldquo;{kw}&rdquo;</div>'))
        arrow_y = 170 + (80 if b.get("pill") else 0) + 82 + 26 + round(ksz * 0.9) + 30
        add(clip("ctaarrow", s + 0.10, d - 0.10, "<i></i>", style=f"top:{arrow_y}px"))
        if HAS_CUT:
            occluder(s, d, HAS_VIG)
    else:
        sys.exit(f"build.py: unknown beat kind '{k}' (face · title · ui · window · broll · cta)")

# ── the caption: one word, its own onset, hard cut, one line. Dropped for the CTA and for any
#    beat with "caps": false (a beat where the picture already says it). ───────────────────
drops = [(float(b["start"]), float(b["end"])) for b in beats if b.get("caps") is False]
drops += [tuple(x) for x in spec.get("cap_drop", [])]
if cta_start is not None:
    drops.append((cta_start, DUR))
n = 0
for wi, w in enumerate(words):
    ws, we = float(w["start"]), float(w["end"])
    if any(a <= ws < b for a, b in drops):
        continue
    text = FIXES.get(wi, w["text"])
    if not str(text).strip():
        continue
    text = str(text).replace("&", "&amp;").replace("<", "&lt;")
    nxt = float(words[wi + 1]["start"]) if wi + 1 < len(words) else we + 0.3
    # on from its onset until it ends or the next word lands — whichever is first. One word on
    # screen at a time, so it never outlives the onset of the next one.
    d = min(we, nxt) - ws if nxt > ws else we - ws
    d = max(1 / FPS, d)
    if len(text) > 13:
        warn(f"caption word {wi} '{text}' is long — check it fits one line at 96px")
    add(f'  <div class="clip cap" data-start="{ws:.3f}" data-duration="{d:.3f}" '
        f'data-track-index="{900 + n % 2}" style="top:{CAP_Y}px">{text}</div>')
    n += 1

grade_svg = (D / "grade-persa.svg").read_text() if GRADE else ""
html = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>{D.name}</title>
<link rel="stylesheet" href="tokens.css"/>
<link rel="stylesheet" href="persa-roles.css"/>
<style>
  /* the grade rides every PHOTOGRAPHIC surface: camera, card, cut-outs, b-roll.
     NEVER a product UI or page shot — recolouring a real product's chrome fabricates it. */
  .graded{{filter:url(#persa-grade)}}
</style>
</head>
<body>
{grade_svg}
<div id="root" data-composition-id="main" data-no-timeline data-start="0" data-duration="{DUR:.3f}"
     data-width="{W}" data-height="{H}" data-fps="{FPS}">
{chr(10).join(body)}
</div>
</body>
</html>
"""
(D / "index.html").write_text(html)
print(f"wrote index.html — {len(beats)} beats, {n} captions, {DUR:.2f}s · grade {'on' if GRADE else 'off'} · "
      f"cut-out {'on' if HAS_CUT else 'off'}{' (vignette baked)' if HAS_VIG else ''}")
for m in warnings:
    print("  WARN", m)
