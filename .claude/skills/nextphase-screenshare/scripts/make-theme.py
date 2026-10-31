#!/usr/bin/env python3
"""make-theme.py — turn your answers (brand/brand.json) into the design tokens.

    python3 scripts/make-theme.py                 # brand/brand.json -> assets/tokens.css + brand/brand.md
    python3 scripts/make-theme.py --check         # just print the contrast report
    python3 scripts/make-theme.py --json '{"ground":"dark","accent":"green"}'   # merge + write

What it does
  1. Picks the ground (bright paper / dark / classic white) and its neutral ramp.
  2. Takes your accent (a preset name or any #hex) and CONTRAST-CHECKS it against
     the ground. Accent type has to read at 3:1 or better (it is only ever used
     large: caption words at 80px, callout numbers at 130px). If it fails, the
     lightness is nudged until it passes, and the report says so — the hue you
     picked is kept.
  3. Keeps the functional colours (win green, cost red, highlighter) honest on
     that ground too, and merges a job into your accent when they collide
     (a green brand colour IS the win colour; it does not get a second green).
  4. Vendors the display font you chose (Google Fonts, open licence) if it is
     not in assets/fonts/ yet.
  5. Writes assets/tokens.css (the ONLY place colours and fonts live) and
     brand/brand.md (what Claude reads at the start of every edit).

Never hand-edit colours in tokens.css — change brand.json and re-run this.
"""
import argparse, colorsys, json, os, re, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
SK = os.path.normpath(os.path.join(HERE, ".."))
BRAND_JSON = os.path.join(SK, "brand", "brand.json")
BRAND_MD = os.path.join(SK, "brand", "brand.md")
TOKENS = os.path.join(SK, "assets", "tokens.css")

DEFAULTS = {
    "filled": False,
    "channel": "", "handle": "", "niche": "", "audience": "",
    "ground": "bright", "accent": "blue", "accent2": None,
    "font": "clean", "research": 1, "tokens": "balanced",
    "captions": True, "sfx": True, "music": False,
    "camera_side": "swap", "language": "en",
}

ACCENTS = {   # base hues; the lightness is solved per ground below
    "orange": "#FF6A13", "green": "#18A058", "blue": "#1F6FEB",
    "purple": "#7C4DFF", "pink": "#F0388C", "red": "#EF3B2D",
    "yellow": "#FFC21A", "teal": "#0FA3A3",
}

GROUNDS = {
    # ground, card, ink, slate700, slate500, slate300, slate100, dot cap, dot, live on?
    "bright":  dict(ground="#F3F1EB", card="#FFFFFF", ink="#1B1B1E",
                    s7="#3F3F46", s5="#71717A", s3="#D4D4D8", s1="#F4F4F5",
                    cap="#8F8C85", dot="#B9B6AE", live=True,
                    win="#188838", cost="#E5372B", hl="#F8E8A0",
                    sh_a=".10", sh_b=".06", sh_c=".13", sh_d=".07"),
    "dark":    dict(ground="#0F1012", card="#18191D", ink="#F2F1EE",
                    s7="#C9CAD0", s5="#8B8D94", s3="#34363C", s1="#1F2025",
                    cap="#6B6E76", dot="#2C2E33", live=True,
                    win="#3DD68C", cost="#FF5A4E", hl="#F8E8A0",
                    sh_a=".45", sh_b=".30", sh_c=".55", sh_d=".35"),
    "classic": dict(ground="#FFFFFF", card="#FFFFFF", ink="#1B1B1E",
                    s7="#3F3F46", s5="#71717A", s3="#D4D4D8", s1="#F4F4F5",
                    cap="#8F8C85", dot="#B9B6AE", live=False,
                    win="#188838", cost="#E5372B", hl="#F8E8A0",
                    sh_a=".10", sh_b=".06", sh_c=".13", sh_d=".07"),
}

FONTS = {   # feel -> (display family, google weights, caption weight, display weight)
    "clean":     ("Inter", "400,500,600,700,800", 700, 800),
    "condensed": ("Barlow Condensed", "500,600,700,800", 700, 800),
    "serif":     ("Fraunces", "400,500,600,700,800", 600, 700),
}


# ── colour maths ─────────────────────────────────────────────────────────────
def hex2rgb(h):
    h = h.lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))


def rgb2hex(r, g, b):
    return "#%02X%02X%02X" % tuple(max(0, min(255, round(v * 255))) for v in (r, g, b))


def lum(h):
    def ch(c):
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = hex2rgb(h)
    return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b)


def contrast(a, b):
    la, lb = sorted((lum(a), lum(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)


def hue(h):
    r, g, b = hex2rgb(h)
    return colorsys.rgb_to_hls(r, g, b)[0] * 360


def solve(h, ground, need):
    """Move lightness (hue + saturation kept) until h reads at `need`:1 on ground."""
    if contrast(h, ground) >= need:
        return h, False
    r, g, b = hex2rgb(h)
    H, L, S = colorsys.rgb_to_hls(r, g, b)
    darker = lum(ground) > 0.4
    for i in range(1, 120):
        L2 = L - i * 0.005 if darker else L + i * 0.005
        if not 0 <= L2 <= 1:
            break
        c = rgb2hex(*colorsys.hls_to_rgb(H, L2, S))
        if contrast(c, ground) >= need:
            return c, True
    return ("#000000" if darker else "#FFFFFF"), True


def mix(a, b, t):
    """t of a, (1-t) of b."""
    ra, rb = hex2rgb(a), hex2rgb(b)
    return rgb2hex(*(x * t + y * (1 - t) for x, y in zip(ra, rb)))


# ── build ────────────────────────────────────────────────────────────────────
def resolve(brand):
    notes = []
    gname = brand.get("ground", "bright")
    if gname not in GROUNDS:
        notes.append("unknown ground %r -> using bright" % gname); gname = "bright"
    G = dict(GROUNDS[gname])

    acc_in = str(brand.get("accent") or "blue").strip()
    base = ACCENTS.get(acc_in.lower(), acc_in if re.fullmatch(r"#?[0-9A-Fa-f]{6}", acc_in) else None)
    if base is None:
        notes.append("accent %r is not a preset or a #hex -> using blue" % acc_in)
        base = ACCENTS["blue"]
    if not base.startswith("#"):
        base = "#" + base
    base = base.upper()

    accent, moved = solve(base, G["ground"], 3.0)
    if moved:
        notes.append("accent %s only reads at %.1f:1 on the %s ground; nudged to %s (%.1f:1). "
                     "Same hue, %s." % (base, contrast(base, G["ground"]), gname, accent,
                                       contrast(accent, G["ground"]),
                                       "darker" if lum(G["ground"]) > 0.4 else "lighter"))
    # the accent also has to read on a card (white on bright, near-black on dark)
    accent_card, _ = solve(accent, G["card"], 3.0)

    win, _ = solve(G["win"], G["ground"], 3.0)
    cost, _ = solve(G["cost"], G["ground"], 3.0)
    hu = hue(accent)
    if 90 <= hu <= 165:
        win = accent
        notes.append("your accent is a green, so it also does the WIN job (no second green).")
    if hu >= 345 or hu <= 12:
        cost = accent
        notes.append("your accent is a red, so it also does the COST job. Use it sparingly: "
                     "a red that means 'live' and 'bad' at once has to be read from context.")

    hl = G["hl"]
    a2 = brand.get("accent2")
    if a2 and re.fullmatch(r"#?[0-9A-Fa-f]{6}", str(a2)):
        a2 = ("#" + str(a2).lstrip("#")).upper()
        hl_try = mix(a2, "#FFFFFF", 0.38)
        if contrast("#1B1B1E", hl_try) >= 4.5:
            hl = hl_try
            notes.append("second colour %s becomes the highlighter (%s) under dark ink." % (a2, hl))
        else:
            notes.append("second colour %s is too dark to sit behind ink as a highlighter; "
                         "kept the default highlighter." % a2)
    else:
        a2 = None

    # the dot field picks up a whisper of the accent on its caps
    cap = mix(accent, G["cap"], 0.22)

    feel = str(brand.get("font") or "clean").strip()
    if feel.lower() in FONTS:
        fam, weights, capw, dispw = FONTS[feel.lower()]
    else:
        fam, weights, capw, dispw = feel, "400,500,600,700,800", 700, 800
    return dict(G=G, gname=gname, accent=accent, accent_card=accent_card, accent_in=base,
                win=win, cost=cost, hl=hl, accent2=a2, cap=cap, font=fam,
                font_weights=weights, capw=capw, dispw=dispw, notes=notes)


def ensure_font(fam, weights):
    slug = re.sub(r"[^a-z0-9]+", "", fam.lower())
    if os.path.exists(os.path.join(SK, "assets", "fonts", slug + ".css")):
        return True
    r = subprocess.run([sys.executable, os.path.join(HERE, "fetch-font.py"), fam, weights])
    return r.returncode == 0


TOKENS_CSS = r"""/* NEXTPHASE SCREENSHARE — design tokens.
   GENERATED by scripts/make-theme.py from brand/brand.json on the answers you
   gave at setup. To change a colour or the font, edit brand/brand.json and
   re-run the script. Never hardcode a hex or a font anywhere else.

   theme: ground=__GNAME__  accent=__ACCENT_IN__ -> __ACCENT__  font=__FONT__

   Put class="ss-frame" on every composition root (it carries
   container-type:size, so the cqh sizes below resolve against the frame).
   Everything marked MEASURED was read off reference videos frame by frame;
   reference/reference-log.md has the method. Change a MEASURED number and you
   are changing the style, not tuning it. */

@import url('fonts/fonts.css');   /* vendored: no network during a render */

:root{
  /* == 1 · GROUND + INK =================================================
     The ground is the shared surface everything sits on. On the live
     variant it carries the breathing dot field (section 7). Cards and
     panels sit on it in --ss-canvas with a neutral shadow.                 */
  --ss-ground:        __GROUND__;
  --ss-canvas:        __CARD__;     /* card / panel background             */
  --ss-ink:           __INK__;      /* type on the ground                  */

  /* == 2 · ACCENTS — functional, never decorative =======================
       live   your accent: the thing being shown, a link, the term defined
       win    the good number, the check
       cost   the bad number, the thing being killed
       hl     a highlighter fill behind words; type on it is --ss-hl-ink
     If a word is not doing one of these jobs it is --ss-ink. Two accents
     in one frame is already a lot.                                         */
  --ss-accent:        __ACCENT__;
  --ss-accent-card:   __ACCENT_CARD__;   /* the accent when it sits on a card */
  --ss-live:          var(--ss-accent);
  --ss-win:           __WIN__;
  --ss-cost:          __COST__;
  --ss-hl:            __HL__;
  --ss-hl-ink:        #1B1B1E;
  --ss-accent-2:      __ACCENT2__;
  /* legacy names used by the component kit                                */
  --ss-blue:          var(--ss-live);
  --ss-green:         var(--ss-win);
  --ss-red:           var(--ss-cost);
  --ss-amber:         var(--ss-hl);

  /* neutral ramp for labels, rules and chrome, matched to the ground      */
  --ss-slate-700:     __S7__;
  --ss-slate-500:     __S5__;
  --ss-slate-300:     __S3__;
  --ss-slate-100:     __S1__;

  /* == 3 · THE CAMERA CARD — MEASURED ===================================
     The parked share card is a 300x300 SQUARE, 60px off two edges, radius
     40 (read off three frames minutes apart). It is an object-fit:cover crop
     of the 16:9 camera, so the head reads bigger than in the full frame.  */
  --ss-cam-size:      300px;
  --ss-cam-right:     60px;
  --ss-cam-bottom:    60px;
  --ss-cam-radius:    40px;

  /* MEASURED: the shadow under a floating thing is NEUTRAL (R=G=B at the
     edge). A blue-tinted elevation shadow reads as a design-system demo.  */
  --ss-shadow-card:   0 18px 44px rgba(0,0,0,__SH_A__), 0 2px 8px rgba(0,0,0,__SH_B__);
  --ss-shadow-cam:    0 20px 48px rgba(0,0,0,__SH_C__), 0 3px 10px rgba(0,0,0,__SH_D__);

  /* == 4 · THE TRAVEL — MEASURED ========================================
     Full frame -> corner card in ELEVEN frames, back in ten, on an ease
     SOLVED against the measured widths 1920 1912 1836 1691 1502 1283 1054
     828 623 (cubic-bezier .42,0,.66,1, RMS 0.0085). The radius ramps 0->40
     on the same progress: full-bleed footage has SQUARE corners.          */
  --ss-shrink-frames: 11;
  --ss-grow-frames:   10;
  --ss-shrink-ease:   cubic-bezier(.42, 0, .66, 1);
  --ss-shrink-ease-gsap: power2.inOut;

  /* == 5 · THE CAPTION — MEASURED =======================================
     Centred, cap-top locked at y=848 on every ground, 80px, 2-6 words,
     median hold 18 frames, swaps on a ~2-frame fade (not a hard cut).     */
  --ss-cap-size:      7.41cqh;
  --ss-cap-weight:    __CAPW__;
  --ss-cap-track:     -.02em;
  --ss-cap-captop:    78.52%;
  --ss-cap-max:       1100px;
  --ss-cap-hold:      18;
  --ss-cap-fade:      2;
  --ss-cap-ink-canvas:  var(--ss-ink);
  --ss-cap-ink-footage: #FFFFFF;
  --ss-cap-shadow:      0 2px 18px rgba(0,0,0,.55), 0 1px 3px rgba(0,0,0,.40);
  --ss-cap-band-max:    150;

  /* == 6 · TYPE =========================================================
     One display family (captions, callouts, card titles) and Inter for
     everything small. The mono is for code and prompts only.              */
  --ss-font-display:  '__FONT__', 'Inter', -apple-system, system-ui, sans-serif;
  --ss-font:          'Inter', -apple-system, system-ui, sans-serif;
  --ss-mono:          'JetBrains Mono', ui-monospace, SFMono-Regular, monospace;
  --ss-display-size:  12.0cqh;   /* 130px — the callout number             */
  --ss-display-wt:    __DISPW__;
  --ss-display-track: -.035em;
  --ss-h-size:        4.26cqh;   /* 46px  — a card's own title             */
  --ss-label-size:    2.04cqh;   /* 22px  — a label under a card           */
  --ss-body-size:     2.59cqh;   /* 28px  — body inside a card             */

  /* == 7 · MEDIA ON THE SURFACE ========================================= */
  --ss-card-radius:   20px;
  --ss-card-border:   1px solid var(--ss-slate-300);
  --ss-well-radius:   12px;
  --ss-pad:           96px;
  --ss-cam-keepout:   380px;

  /* == 8 · MOTION =======================================================
     Elements arrive (6-7 frames, sharp, small travel) and then hold so they
     can be read. About 40% of graphics time has something moving: a
     cursor, typing, a menu opening, a page scrolling. Nothing drifts.     */
  --ss-enter-frames:  6;
  --ss-enter-ease:    power3.out;
  --ss-enter-rise:    18px;
  --ss-layout-hold:   8s;        /* a layout change about every 8s         */

  /* == 9 · THE LIVE GROUND — MEASURED technique, your colours ===========
     A dot matrix on a 12px pitch across the lower part of the frame. Each
     column is a bar whose top dot is a bigger, darker cap; dots under it
     grow with depth; bar heights breathe in place (wide flat terraces,
     about 1 row per 0.3s at the fastest, never scrolling sideways).
     build.py draws it every frame as a pure function of time.             */
  --ss-live-on:       __LIVE_ON__;
  --ss-live-cap:      __CAP__;
  --ss-live-dot:      __DOT__;
  --ss-live-pitch:    12;
  --ss-live-top:      41;
}

.ss-frame{
  position:relative; width:1920px; height:1080px; overflow:hidden;
  container-type:size;
  background:var(--ss-ground);
  font-family:var(--ss-font);
  color:var(--ss-ink);
  -webkit-font-smoothing:antialiased;
}
.ss-frame.ss-live{background:var(--ss-ground);}
.ss-liveground{position:absolute;left:0;top:0;width:1920px;height:1080px;z-index:0;}
"""


def write_tokens(t):
    G = t["G"]
    css = TOKENS_CSS
    for k, v in {
        "__GNAME__": t["gname"], "__ACCENT_IN__": t["accent_in"], "__ACCENT__": t["accent"],
        "__ACCENT_CARD__": t["accent_card"], "__FONT__": t["font"],
        "__GROUND__": G["ground"], "__CARD__": G["card"], "__INK__": G["ink"],
        "__WIN__": t["win"], "__COST__": t["cost"], "__HL__": t["hl"],
        "__ACCENT2__": t["accent2"] or t["accent"],
        "__S7__": G["s7"], "__S5__": G["s5"], "__S3__": G["s3"], "__S1__": G["s1"],
        "__SH_A__": G["sh_a"], "__SH_B__": G["sh_b"], "__SH_C__": G["sh_c"], "__SH_D__": G["sh_d"],
        "__CAPW__": str(t["capw"]), "__DISPW__": str(t["dispw"]),
        "__LIVE_ON__": "1" if G["live"] else "0", "__CAP__": t["cap"], "__DOT__": G["dot"],
    }.items():
        css = css.replace(k, v)
    open(TOKENS, "w").write(css)


RESEARCH = {
    0: "0 · I bring everything — use only the files and links the creator gives you. "
       "No web searching. A beat with nothing supplied stays on the camera.",
    1: "1 · Light — verify every number, date, price and claim said on camera, and capture "
       "real screenshots / tall page captures of every site or product named.",
    2: "2 · Deep — everything in Light, plus source real supporting examples (docs pages, "
       "launch posts, good/bad examples, short clips) for every point, and flag any clip whose "
       "rights are unclear before it reaches a render.",
}
TOKENS_MODE = {
    "lean": "lean — read SKILL.md and only the reference files it names for the step; no "
            "subagents; 540p draft previews of one segment at a time; render the full-quality "
            "video once at the end; run only check-screenshare.sh before rendering.",
    "balanced": "balanced — the default. Read the references the step needs, draft previews per "
                "segment, every gate before the final render.",
    "max": "max — read every reference file up front, run sourcing in parallel subagents, "
           "full-resolution preview of every segment, every gate on every render.",
}


def write_md(brand, t):
    G = t["G"]
    side = brand.get("camera_side", "swap")
    lines = [
        "# brand.md — read this at the start of every edit",
        "",
        "GENERATED by `scripts/make-theme.py` from `brand/brand.json`. Edit the JSON and re-run;",
        "don't edit this file by hand.",
        "",
        "STATUS: %s" % ("FILLED" if brand.get("filled") else
                        "UNFILLED — run the setup questions in SKILL.md step 0 first"),
        "",
        "## Who this is for",
        "- Channel: %s %s" % (brand.get("channel") or "(not set)", brand.get("handle") or ""),
        "- Niche: %s" % (brand.get("niche") or "(not set)"),
        "- Audience: %s" % (brand.get("audience") or "(not set)"),
        "- Language: %s" % brand.get("language", "en"),
        "",
        "Use the niche to pick examples, the products you rebuild in played screen shares and",
        "the sites you capture. Write every on-screen word from the transcript, in the",
        "creator's own vocabulary.",
        "",
        "## Look",
        "- Ground: **%s** (`%s`), live dot field %s" % (t["gname"], G["ground"],
                                                      "ON" if G["live"] else "OFF (plain)"),
        "- Accent: `%s` (asked for %s)" % (t["accent"], t["accent_in"]),
        "- Win `%s` · Cost `%s` · Highlighter `%s`" % (t["win"], t["cost"], t["hl"]),
        "- Display font: %s (Inter for small text, JetBrains Mono for code)" % t["font"],
        "",
        "## Edit settings",
        "- Research: %s" % RESEARCH.get(int(brand.get("research", 1)), RESEARCH[1]),
        "- Token budget: %s" % TOKENS_MODE.get(brand.get("tokens", "balanced"), TOKENS_MODE["balanced"]),
        "- Captions: %s" % ("ON" if brand.get("captions", True) else "OFF"),
        "- Sound effects: %s" % ("ON — one quiet transient per layout change, nothing else"
                                 if brand.get("sfx", True) else "OFF — voice only"),
        "- Music: %s" % ("ON — a ducked bed from assets/music/ (the creator supplies it)"
                         if brand.get("music") else "OFF"),
        "- Camera card side: %s" % {"left": "LEFT — the card always sits on the left",
                                     "right": "RIGHT — the card always sits on the right",
                                     "swap": "SWAP — the card changes sides between beats"}.get(side, side),
        "",
    ]
    if t["notes"]:
        lines += ["## Adjustments made at setup"] + ["- " + n for n in t["notes"]] + [""]
    open(BRAND_MD, "w").write("\n".join(lines))


def report(t):
    G = t["G"]
    print("theme: ground=%s  accent=%s  font=%s" % (t["gname"], t["accent"], t["font"]))
    rows = [("ink on ground", G["ink"], G["ground"], 7.0),
            ("accent on ground", t["accent"], G["ground"], 3.0),
            ("accent on card", t["accent_card"], G["card"], 3.0),
            ("win on ground", t["win"], G["ground"], 3.0),
            ("cost on ground", t["cost"], G["ground"], 3.0),
            ("ink on highlighter", "#1B1B1E", t["hl"], 4.5),
            ("label on ground", G["s5"], G["ground"], 3.0)]
    ok = True
    for name, fg, bg, need in rows:
        c = contrast(fg, bg)
        flag = "ok" if c >= need else "LOW"
        ok &= c >= need
        print("  %-20s %s on %s  %5.2f:1  (need %.1f)  %s" % (name, fg, bg, c, need, flag))
    for n in t["notes"]:
        print("  note: " + n)
    return ok


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--json", help="JSON object merged over brand.json before writing")
    a = ap.parse_args()
    brand = dict(DEFAULTS)
    if os.path.exists(BRAND_JSON):
        brand.update(json.load(open(BRAND_JSON)))
    if a.json:
        brand.update(json.loads(a.json))
        json.dump(brand, open(BRAND_JSON, "w"), indent=2)
    t = resolve(brand)
    ok = report(t)
    if a.check:
        sys.exit(0 if ok else 1)
    if not ensure_font(t["font"], t["font_weights"]):
        print("  ! could not fetch %r — falling back to Inter" % t["font"])
        t["font"] = "Inter"
    write_tokens(t)
    write_md(brand, t)
    print("wrote assets/tokens.css and brand/brand.md")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
