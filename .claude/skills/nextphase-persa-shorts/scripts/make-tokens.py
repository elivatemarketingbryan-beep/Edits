#!/usr/bin/env python3
"""
MAKE-TOKENS — turn brand/brand.json into assets/tokens.css.

    python3 scripts/make-tokens.py                 # read brand/brand.json, write assets/tokens.css
    python3 scripts/make-tokens.py --check         # print the contrast table, write nothing
    python3 scripts/make-tokens.py --set look=bright --set accent=green   # edit brand.json, then write

The persa look has THREE accents, each with exactly one job. Mixing up the jobs is what makes
a cut look like a template:

    display     the filled payoff word — hook and CTA only. Never an outline.
    emphasis    the hollow outline word — the "pain" word. Screen-blended, so it must be LIGHT.
    annotation  a claim typed into a UI's own empty space, in pixel type. Needs a dark gutter.

Plus white, which is the neutral emphasis outline and the caption.

Every colour is checked against the ground it will actually sit on (not the ground it looks
good on in a swatch). If a colour fails, it is nudged until it passes, and the script SAYS SO —
silently shipping an unreadable accent is the failure this exists to prevent.

Never hardcode a colour or font in a composition. Import tokens.css and use the variables.
"""
import argparse
import colorsys
import json
import pathlib
import sys

SKILL = pathlib.Path(__file__).resolve().parent.parent
BRAND = SKILL / "brand" / "brand.json"
OUT = SKILL / "assets" / "tokens.css"

# ── named accent sets: (display, emphasis, annotation). "red" is the measured reference look.
ACCENTS = {
    "red":    ("#E12A2B", "#D99A12", "#B9DA31"),
    "orange": ("#FF5B14", "#FFC23D", "#9BE15D"),
    "green":  ("#1FCB5C", "#F2C230", "#6FD8FF"),
    "blue":   ("#2E7BFF", "#FFB020", "#B9DA31"),
    "purple": ("#8F5BFF", "#FFB347", "#6FF0C8"),
    "pink":   ("#FF3D8B", "#FFC23D", "#B9DA31"),
    "yellow": ("#FFC800", "#FF7A2B", "#6FD8FF"),
}

# ── font feels. advance = safe per-uppercase-char width in em, measured in Chrome, used to
#    stamp a display word's font-size so it never wraps or runs off the frame.
FONTS = {
    "poster": {      # the measured persa default: a condensed poster face
        "display": ("Anton", 400, 0.50), "caption": ("Montserrat", 900),
        "ui": "Inter", "marker": "Permanent Marker", "pixel": "Silkscreen",
        "google": "family=Anton&family=Montserrat:wght@700;900&family=Inter:wght@400;500;600;800"
                  "&family=Permanent+Marker&family=Silkscreen:wght@400;700",
    },
    "clean": {       # a modern heavy sans, wider and calmer
        "display": ("Montserrat", 900, 0.80), "caption": ("Inter", 800),
        "ui": "Inter", "marker": "Caveat Brush", "pixel": "Silkscreen",
        "google": "family=Montserrat:wght@700;900&family=Inter:wght@400;500;600;800"
                  "&family=Caveat+Brush&family=Silkscreen:wght@400;700",
    },
    "editorial": {   # a heavy display serif, magazine-cover feel
        "display": ("Playfair Display", 900, 0.78), "caption": ("Montserrat", 900),
        "ui": "Inter", "marker": "Permanent Marker", "pixel": "Silkscreen",
        "google": "family=Playfair+Display:wght@700;900&family=Montserrat:wght@700;900"
                  "&family=Inter:wght@400;500;600;800&family=Permanent+Marker&family=Silkscreen:wght@400;700",
    },
    "rounded": {     # a friendly geometric sans
        "display": ("Poppins", 800, 0.75), "caption": ("Poppins", 800),
        "ui": "Poppins", "marker": "Caveat Brush", "pixel": "Silkscreen",
        "google": "family=Poppins:wght@400;500;600;800&family=Caveat+Brush&family=Silkscreen:wght@400;700",
    },
}

# ── the two looks. A persa frame is a photograph, so "dark" and "bright" change the chrome
#    around the type (vignette strength, caption ink, pill labels, preview ground), not a plate.
LOOKS = {
    "dark": {
        "vig_rgb": (12, 9, 8), "vig_a": (0.60, 0.40),
        "cap_ink": "#FFFFFF", "cap_shadow": "drop-shadow(0 4px 14px rgba(0,0,0,.60))",
        "pill_bg": "rgba(15,12,10,.55)", "pill_ink": "#FFFFFF",
        "ground": "#1A1512", "ground_2": "#3A2E26",
    },
    "bright": {
        # the vignette stays as strong as "dark": it is what makes the display type readable at
        # all on a lit room. "bright" changes the caption ink, the pills and the preview ground.
        "vig_rgb": (12, 9, 8), "vig_a": (0.60, 0.40),
        "cap_ink": "#15120F", "cap_shadow": "drop-shadow(0 0 10px rgba(255,255,255,.90)) "
                                            "drop-shadow(0 2px 4px rgba(255,255,255,.80))",
        "pill_bg": "rgba(255,253,248,.86)", "pill_ink": "#15120F",
        "ground": "#E9E2D6", "ground_2": "#B9AE9F",
    },
}

LIT_WALL = (189, 182, 172)          # a typical lit room behind a creator
UI_GUTTER = (18, 18, 18)            # the dark negative space an annotation is typed into
DEFAULTS = {
    "setup_complete": False,
    "creator": {"name": "", "handle": "", "niche": "", "audience": "", "cta_keyword": ""},
    "look": "dark", "accent": "red", "brand_colors": [],
    "font_feel": "poster", "grade": "film",
    "research": 1, "budget": "balanced",
    "sfx": True, "music": False, "music_file": "",
    "cutout": "quick", "videos_dir": "~/persa-shorts",
}


# ── colour maths ────────────────────────────────────────────────────────────────────────
def hex2rgb(h):
    h = h.strip().lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    if len(h) != 6:
        raise ValueError(f"not a hex colour: #{h}")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def rgb2hex(c):
    return "#%02X%02X%02X" % tuple(max(0, min(255, round(v))) for v in c)


def lum(c):
    def ch(v):
        v /= 255
        return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4
    r, g, b = c
    return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b)


def contrast(a, b):
    la, lb = lum(a), lum(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


def mix(a, b, t):
    return tuple(a[i] * (1 - t) + b[i] * t for i in range(3))


def lighten_until(c, test, step=0.03, limit=40):
    """Raise HLS lightness until test(rgb) passes. Returns (rgb, changed)."""
    r, g, b = (v / 255 for v in c)
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    for i in range(limit):
        cur = tuple(v * 255 for v in colorsys.hls_to_rgb(h, l, s))
        if test(cur):
            return cur, i > 0
        l = min(0.97, l + step)
    return cur, True


# ── brand file ─────────────────────────────────────────────────────────────────────────
def load_brand():
    data = json.loads(json.dumps(DEFAULTS))
    if BRAND.exists():
        user = json.loads(BRAND.read_text())
        for k, v in user.items():
            if isinstance(v, dict) and isinstance(data.get(k), dict):
                data[k].update(v)
            else:
                data[k] = v
    return data


def apply_sets(brand, sets):
    for s in sets:
        k, _, v = s.partition("=")
        if not v:
            sys.exit(f"--set needs key=value, got {s!r}")
        if v.lower() in ("true", "false"):
            v = v.lower() == "true"
        elif v.isdigit():
            v = int(v)
        elif k == "brand_colors":
            v = [x for x in v.replace(" ", "").split(",") if x]
        node = brand
        parts = k.split(".")
        for p in parts[:-1]:
            node = node.setdefault(p, {})
        node[parts[-1]] = v
    return brand


def pick_accents(brand):
    cols = [c for c in brand.get("brand_colors") or [] if c]
    base = ACCENTS.get(str(brand.get("accent", "red")).lower(), ACCENTS["red"])
    if not cols:
        return [hex2rgb(c) for c in base], "preset " + str(brand.get("accent", "red"))
    rgbs = [hex2rgb(c) for c in cols[:3]]
    d = rgbs[0]
    # missing roles are derived from the first colour: emphasis = a light warm tint of it,
    # annotation = its complement pushed light, so the three stay distinct.
    if len(rgbs) < 2:
        h, l, s = colorsys.rgb_to_hls(*(v / 255 for v in d))
        rgbs.append(tuple(v * 255 for v in colorsys.hls_to_rgb((h + 0.08) % 1, 0.62, min(1, s + 0.1))))
    if len(rgbs) < 3:
        h, l, s = colorsys.rgb_to_hls(*(v / 255 for v in d))
        rgbs.append(tuple(v * 255 for v in colorsys.hls_to_rgb((h + 0.5) % 1, 0.66, 0.75)))
    return rgbs, "brand colours " + ", ".join(cols[:3])


def solve(brand):
    look = LOOKS.get(brand.get("look", "dark"), LOOKS["dark"])
    (disp, emph, annot), source = pick_accents(brand)
    # where the display word sits (~y300 of the 1080px vignette): the vignette over a lit wall
    a_top = look["vig_a"][0] - (look["vig_a"][0] - look["vig_a"][1]) * (300 / 497)
    ground = mix(LIT_WALL, look["vig_rgb"], a_top)
    rows = []

    # the payoff word sits on the DARKENED top of the frame, so it must be LIGHTER than that
    # ground — a dark brand colour can "pass" a contrast ratio by being darker and still vanish
    d2, ch = lighten_until(disp, lambda c: lum(c) > lum(ground) and contrast(c, ground) >= 1.25)
    rows.append(("display (filled payoff word)", disp, d2, contrast(d2, ground), "vignetted lit wall", ch))
    # screen blend only ever LIGHTENS: a dark stroke screened over a photo is invisible
    e2, ch = lighten_until(emph, lambda c: lum(c) >= 0.25)
    rows.append(("emphasis (hollow outline word)", emph, e2, lum(e2), "luminance >= 0.25 (screen)", ch))
    a2, ch = lighten_until(annot, lambda c: contrast(c, UI_GUTTER) >= 7.0)
    rows.append(("annotation (claim in a UI gutter)", annot, a2, contrast(a2, UI_GUTTER), "dark UI gutter #121212", ch))
    return look, (d2, e2, a2), rows, source


def glow(rgb, a1=0.95, a2=0.55, r1=12, r2=46):
    r, g, b = (round(v) for v in rgb)
    return (f"drop-shadow(0 0 {r1}px rgba({r},{g},{b},{a1})) "
            f"drop-shadow(0 0 {r2}px rgba({r},{g},{b},{a2}))")


def css(brand, look, accents):
    d, e, a = accents
    f = FONTS.get(brand.get("font_feel", "poster"), FONTS["poster"])
    dn, dw, adv = f["display"]
    cn, cw = f["caption"]
    vr, vg, vb = look["vig_rgb"]
    v0, v1 = look["vig_a"]
    a_soft = mix(a, (255, 255, 255), 0.18)
    return f"""/* tokens.css — GENERATED by scripts/make-tokens.py from brand/brand.json.
   Do not edit by hand: change brand.json (or run make-tokens.py --set ...) and regenerate.
   Import into EVERY composition. Never hardcode a colour or a font in a build.
   look: {brand.get('look')} · accents: {brand.get('accent')} {brand.get('brand_colors') or ''} · fonts: {brand.get('font_feel')} */
@import url('https://fonts.googleapis.com/css2?{f['google']}&display=block');

:root{{
  /* ── the three accents, one job each ─────────────────────────────────────────────── */
  --display:{rgb2hex(d)};          /* filled payoff word — hook + CTA only, never an outline */
  --emph-accent:{rgb2hex(e)};      /* hollow outline — the pain word */
  --emph-white:#FFFFFF;           /* hollow outline — the neutral word */
  --annot:{rgb2hex(a)};            /* a claim typed into a UI's own empty space */
  --annot-soft:{rgb2hex(a_soft)};       /* the same face, used for a one-word reaction */

  /* the outline word: a whisper of fill (NOT zero — the checker fails an unpainted word),
     a thin stroke, and a wide bloom in the stroke's own hue, screened over the photograph */
  --emph-fill:rgba(255,255,255,.09);
  --emph-stroke:4px;
  --glow-white:{glow((255, 255, 255))};
  --glow-accent:{glow(e)};
  --glow-annot:{glow(a, .85, .45, 10, 30)};
  --display-shadow:drop-shadow(0 8px 30px rgba(0,0,0,.55));

  /* ── the look: {brand.get('look')} ─────────────────────────────────────────────────── */
  /* the vignette darkens the MEDIA under display type (never a band behind text) */
  --vig:linear-gradient(180deg,rgba({vr},{vg},{vb},{v0}) 0%,rgba({vr},{vg},{vb},{v1}) 46%,rgba({vr},{vg},{vb},0) 100%);
  --vig-a0:{v0}; --vig-a1:{v1};
  --cap-ink:{look['cap_ink']};
  --cap-shadow:{look['cap_shadow']};
  --pill-bg:{look['pill_bg']};
  --pill-ink:{look['pill_ink']};
  --ground:{look['ground']};          /* theme preview only — a real cut has no plate */
  --ground-2:{look['ground_2']};

  /* ── type ───────────────────────────────────────────────────────────────────────── */
  --font-display:"{dn}",Impact,"Arial Narrow",sans-serif;
  --display-weight:{dw};
  --display-advance:{adv};         /* em per uppercase char — build.py stamps sizes with it */
  --font-caption:"{cn}",system-ui,sans-serif;
  --caption-weight:{cw};
  --cap-size:96px;
  --font-ui:"{f['ui']}",system-ui,sans-serif;
  --font-marker:"{f['marker']}",cursive;
  --font-pixel:"{f['pixel']}",ui-monospace,monospace;

  /* ── geometry (1080x1920) ───────────────────────────────────────────────────────── */
  --cap-y:1400px;                  /* 72.9% — the ONE caption line. It never moves. */
  --r-pill:999px;
  --r-card:39px;                   /* the camera card: 114,1143 · 861x777 */
  --window-shadow:0 40px 90px rgba(0,0,0,.55),0 8px 24px rgba(0,0,0,.40);
}}
"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true", help="print the contrast table only")
    ap.add_argument("--set", action="append", default=[], metavar="KEY=VALUE",
                    help="edit brand.json first (dot keys ok: creator.handle=@me)")
    ap.add_argument("--out", default=str(OUT))
    a = ap.parse_args()

    brand = load_brand()
    if a.set:
        brand = apply_sets(brand, a.set)
        if not a.check:                      # --check never writes anything
            BRAND.write_text(json.dumps(brand, indent=2) + "\n")
            print(f"updated {BRAND}")

    look, accents, rows, source = solve(brand)
    print(f"accents from {source} · look {brand.get('look')} · fonts {brand.get('font_feel')}")
    print(f"  {'role':36s} {'asked':8s} {'final':8s}  score   against")
    for name, asked, final, score, against, changed in rows:
        flag = "  ADJUSTED" if changed else ""
        print(f"  {name:36s} {rgb2hex(asked):8s} {rgb2hex(final):8s}  {score:5.2f}   {against}{flag}")
    if any(r[5] for r in rows):
        print("  -> one or more colours were lightened so they stay readable. Tell the user which.")
    if a.check:
        return
    pathlib.Path(a.out).write_text(css(brand, look, accents))
    print(f"wrote {a.out}")


if __name__ == "__main__":
    main()
