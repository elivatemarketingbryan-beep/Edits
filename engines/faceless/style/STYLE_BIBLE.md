# STYLE BIBLE: sprite faceless short-form, reproducing the reference edit

**Reference:** `Ref Video For Editing Style.mp4` (720x1280, 30 fps, 897 frames, 29.9 s).

**Production target:** 1080x1920, 30 fps, rendered with HyperFrames (HTML/CSS plus seekable GSAP timelines).

**Sources.** I read all 9 specialist reports in full: `seg1–timeline-24-30s.md`, `typography_layout.md`, `audio_sfx.md`, `motion_curves.md` and `hyperframes_guide.md`. None was missing. Where they disagreed I measured the frames myself (scripts are in `scratchpad/work/bible/`). Appendix A lists every conflict and the value I chose.

**Conventions:**
- `fN` is frame index N, where t = N/30 s and the file is `f_{N+1:04d}.png`. 1 f = 33.3 ms.
- Positions are given **at 1080x1920 first**, with the 720-scale source value in brackets [like this] where it helps. The scale factor is ×1.5 throughout.
- `(inferred)` marks anything that is not directly measured.

---

## 1. The reference in one paragraph

The video is a 30-second, 120-word pitch: 243 wpm, every pause trimmed to 90 ms or less, a dense broadcast-compressed voice at −14 LUFS. Its edit makes sure the eye never waits.

**Cuts.** There are 10 hard cuts and nothing else: no dissolves, no whips, no overshoot. Every cut lands on the first phoneme of a clause, so shots average 3.0 s (1.03–5.83 s). Consecutive shots always switch luminance class (light → dark → white → light → dark → light → face → light → dark → face), which makes each cut snap.

**Inside a shot, something new happens every 0.3–0.9 s:**
- Captions arrive word by word at 4 words/s (1–4 lowercase words per group, laid out once and centred, then revealed in place).
- The B-roll card "echoes" the narration. A selection highlight sweeps the on-screen phrase that is being paraphrased, a ring draws round the UI label just named, a cursor glides to it, a stat flies out of the page, or the page scrolls or pans to "more".
- Two comets circle every browser card's border.

**Camera.** All camera energy comes from one signature move. A dark proof scene starts at 1.15× and settles to 1.0 with a slow-start, long-tail curve, cubic-bezier(.32,.06,0,1) over 1.18 s, plus in-card pans and zooms on cubic-bezier(.2,0,0,1). There is no Ken Burns drift anywhere.

**Typography.** Bold Inter carries the plain words. A blue bold-italic Garamond marks the payload words (professional, library, best ones). Brand names and list heads get an RGB glitch. Numbers, the promise verb and punch words get a horizontal stretch-in.

**Presenter.** The presenter appears only for claims and direct address: a pop-out bust in the light split layout, or full-bleed for "you" sentences. They are hidden for proof, naming and comparison beats.

**Sound.** The sound design is felt rather than heard: a reverse riser into section cuts, a 33 Hz sub-swell under every camera move, a whoosh on graphic fly-ins, and a beatless Em–G–C pad 24 LU under the voice.

**Close.** The video ends on a two-line CTA lockup that flickers on and then holds, silent of captions, to the last frame.

---

## 2. Shot-by-shot timeline of the reference

**Layout codes:**
- **L** = light split: light plate, browser card on top, caption, then a sprite/presenter panel at the bottom.
- **L1** = L plus the hook headline.
- **D** = dark proof: one tall card, zoom-settle, no presenter.
- **W** = white reveal title card.
- **B** = dark navy A/B compare.
- **F** = full-bleed presenter.

**Caption notation:** `|` separates caption groups. `*` = serif emphasis, `#` = blue sans stretch, `(G)` = glitch, `(S)` = black stretch.

**SFX letters:** A = reverse riser, B = sub swell, W = whoosh, T = double tick.

| # | Frames / time | Words (spoken) | Layout | B-roll content | Motion events (measured) | Captions | SFX |
|---|---|---|---|---|---|---|---|
| 1 | f0–85 / 0.000–2.833 | "Claude can now build full professional motion graphics from scratch," | **L1** hook. Light plate, 2-line headline "Claude Can Now Make" / blue box "Motion Graphics", narrow browser card, presenter pop-out panel | Product site playing a motion piece. Its "wow" frame (logo burst → orange "CLAUDE") lands on *professional* (f27) | f0 is a clean frame (no overlays). From f1: card pop (scale .905→1, power3.out 20 f; opacity sine.inOut 5.6 f). Headline words at f1/3/6/8 (stagger 2.33 f). Box wipe from f4.8 (expo.out 21.75 f). Box words at f9 and f12. Headline complete at f17 (567 ms) and static until the cut. Border beams the whole time | `Claude(G) can` \| `now build` \| `full professional*` \| `motion* graphics*` \| `from scratch(S)` (stretch at f73). Blank frames at f9 and f25 | A + W at f0. A at f65, stopping at f83 into the cut |
| 2 | f86–195 / 2.867–6.500 | "and somebody just put together a whole library showing exactly how to create the best ones." | **D** neutral grey radial; tall card; no presenter or headline | Third-party X post with a gallery video | Hard cut onto stage at 1.15× → **zoom-settle** to 1.0 (35.5 f). Sweep #1 at f94–104 (1 line, expo.out 15 f) on "just". Sweep #2 at f139–155 (2 lines, expo.out 22 f) on "showing". In-card scroll at f163–193 (−220 px, cubic(.2,0,0,1), 31 f) on "how to create" | `and somebody` \| `just put` \| `together` \| `a whole library*` \| `showing` \| `exactly` \| `how to create` \| `the best* ones*` | B at f86 (peak f96). B at f146 (peak f156, under the sweep/scroll). A at f175, stopping at f192 into the cut |
| 3 | f196–235 / 6.533–7.833 | "It's called Prompt Motion," | **W** white reveal. Blank #FDFDFD for f196–200, label box "It's Called", card under it | Product homepage | Box wipe from f201 (expo.out 21 f). Card pop from f202. Box words at f205 and f208. Caption "Prompt" at f211 with a big rise (13 px [720]). Selection over the page heading "Prompt Motion" at f212–220 (expo.out 14 f) | `Prompt Motion` (black, title-card rise) | W at f196 (first white frame) |
| 4 | f236–322 / 7.867–10.733 | "and it is over 230 animated videos made with Claude," | **L** split (wide card) + presenter | Blog article whose headline contains "230 real examples" | Hard cut with no motion. "230": caption stretch at f253, ring draw at f254–257 round "230" in the page, stat callout flies out of the ring at f256–273 (odometer f257–271, white pill f264–268), callout exits at f291–296. Sweep at f299–309 over "230 real Claude prompts" (echo of "made with Claude") | `and it` \| `is over 230#` \| `animated* videos` \| `made with` \| `Claude(G)` (f304) | **None** on the cut. W at f254 (stat fly-out) |
| 5 | f323–377 / 10.767–12.567 | "each with the exact prompt used to create it." | **D** warm-brown; tall card | Prompt detail page | Zoom-settle from f323. 3-line selection, f333–360 (one cumulative expo.out 34 f). Ring round the "Opus 5.5" field at f361–365 on "create" | `each with` \| `the exact prompt*` \| `used to` \| `create it` | B at f323 (peak f333). A at f359, stopping at f376 |
| 6 | f378–537 / 12.600–17.900 | "Inside, you'll get prompts for all launch videos, product videos, demos, mobile app walkthroughs, all charts, and much" | **L** split (the card keeps its top, left and right; only its height changes) | Gallery page with filter chips | Cursor fades in already moving (f395) and goes to the "Prompt" chip, ring at f403. Cursor to "Product UI" (f417–429), ring at f423 crossfading with the old one. "demos" stretch. Cursor to "Phone" (f466–478), ring at f477. Content pans −422 px (f497–525, cubic(.2,0,0,1) 28 f) to reveal more chips. Ring on "Charts" at f517. Cursor fades out at f530 | `inside` \| `you'll get` \| `prompts` \| `for all launch(G)` \| `videos` \| `product(G) videos` \| `demos(S)` \| `mobile(G) app` \| `walkthroughs` \| `all charts(S)` \| `and much more*` | B at f488 (peak f498, under the pan). A at f534, stopping at f551 into the cut at f553 |
| 7 | f538–552 / 17.933–18.400 | "more." | L, continued | Carousel moves card A → card B (a post page) | Strip push: 0.733 s cubic(.3,0,0,1), peak 130 px/f [720] at f541, heavy horizontal motion blur. The cut at f553 lands before it settles | `more*` arrives at f540, in the same group | (riser above) |
| 8 | f553–583 / 18.433–19.433 | "Just copy the one you like," | **F** full-bleed face: a hard cut to a ×1.74 tighter crop; no UI | none | Static | `just copy` \| `the one you like` (white, shadow, baseline 71.7 %H) | none (the riser stopped 1 f before the cut) |
| 9 | f584–628 / 19.467–20.933 | "tweak it for your own brand or product," | **L** split, card B | Post page, prompt text | Cut lands **mid-move** on an in-card zoom ×2.0 (scale .497→1, cubic(.2,0,0,1) 34 f, started 4.8 f before the cut). Cursor parks at the end of "my brand colours". Sweep at f603–611 (power3.out 8 f), then cursor up a line, sweep "my product name" at f613–620 | `tweak(S) it` \| `for your own` \| `brand* or product*` | B at f583 (peak f593) |
| 10 | f629–723 / 20.967–24.100 | "and Claude will actually recreate what you want in that exact style with the same" | **B** navy; two stacked 4:3 cards with pills `original` (black) and `Frame by Frame remake` (blue) | Original and remake clips, in sync | Zoom-settle from f629. Card tint-wash clears at f630–644. Pills at f636–638 and f646–648 (10 f stagger). Logo burst in the B-roll lands on "exact" (f695). Media blur-out at f715–723 | `and Claude(G) will` \| `actually` \| `recreate#` (blue sans stretch) \| `what you want` \| `in that exact` \| `style* with` \| `the same` | B at f629 (peak f639) |
| 11 | f724–779 / 24.133–25.967 | "animations and the same sound effects." | B, continued | Second A/B pair | Content hard-cuts inside the fixed cards at f724, then blurs back in over 8 f. Accelerating upward drift (f757–779) plus blur-out (f775–779) before the cut | `the same` \| `animations*` (white serif) \| `and the same` \| `sound* effects*` (white serif) | none on the content swap. A (+3 dB) at f762, stopping at f779 |
| 12 | f780–896 / 26.000–29.867 | "So go try it yourselves. Just comment motion down below, and I'll DM you the link directly." | **F** full-bleed + CTA lockup | none | Hard cut. Captions use a "ghost-fill" entrance and are front-loaded 7–11 f. *comment* cuts in at f818 at scaleX 1.165 and settles to 1 (power3.out 20 f). "Motion" flicker-on at f827–832 with a blue glow. Holds static to f896. Nothing is captioned after the keyword | `so go try` \| `it yourselves` \| *comment* over **"Motion"** | T at f827 (−19 LU). A (+3 dB) at f879, stopping on the last frame |

**Aggregates** (these are the targets the planner reproduces):

| Measure | Value |
|---|---|
| Shot length | Mean 2.99 s, median 2.88 s, range 1.03–5.83 s |
| Shots | 10 |
| Within-scene B-roll swaps | 2 (carousel at f538, content swap at f724) |
| Distinct B-roll assets | 9, about one per 3.3 s |
| Runtime by layout | L 43.8 %, D 18.4 %, B 16.8 %, F 16.5 %, W 4.5 % |
| Presenter on screen | 60.3 % of runtime |
| Caption groups | ≈55, about 1.8 groups/s |
| Speech rate | 4.04 words/s |
| Emphasis | Serif spans 13; glitch 6 (Claude ×3, launch, product, mobile); stretch 6 (scratch, 230, demos, charts, tweak, recreate) |
| SFX | 17 placements: 7 A, 6 B, 3 W, 1 T |

---

## 3. Design tokens

### 3.1 Fonts

| Role | Font (Google Fonts) | Settings | Notes |
|---|---|---|---|
| Captions, headline line 1, numbers, verbs, labels | **Inter** (variable: `opsz` 14–32, `wght` 100–900) | `font-variation-settings:"opsz" 28; font-weight:650; letter-spacing:-0.025em` | IoU 0.90–0.95 against the reference glyphs. The 650 weight matters: 600 and 700 both fit worse |
| Serif emphasis, white box text, CTA setup verb | **EB Garamond Italic 800** | `font-style:italic; font-weight:800; letter-spacing:-0.02em` | The reference is ITC Garamond Bold Condensed Italic, which is commercial. EB Garamond has the same in-curled italic `h` and double-storey `g`. Fallback: Playfair Display Italic 700 |
| CTA keyword | **Inter** | `font-weight:850` | Heavy, inside curly quotes |
| Stat digits | Inter 700, `font-variant-numeric: lining-nums tabular-nums` | | |

- Ship these as local woff2. They already exist in `engine/assets/fonts/` as `Inter-Variable.woff2` and `EBGaramond-ExtraBoldItalic.woff2`.
- Size the serif by x-height, not by em. EB Garamond's x-height is 0.423 em, so 113 px gives the reference's 48 px x-height at 1080.

### 3.2 Type scale at 1080x1920

| Token | px | Measured basis [720] |
|---|---|---|
| Caption sans (L, W, F) | **102** | ascender 49.5, x-height 36 |
| Caption sans (D, B) | **105** | ascender 51.2 (+3 %) |
| Caption serif | **113** EB Garamond | x-height 32 |
| Headline line 1 | **86** | cap 41.5 |
| Box serif (headline / label box) | **116** | x-height 34, `M` cap 48 |
| CTA setup verb (*comment*) | **160** serif | x-height 45 (1.36× the caption serif) |
| CTA keyword ("Motion") | **138** Inter 850 | cap block 67–70 |
| Stat digits | **157** | figure height 76 |
| Stat label | **44** Inter 700 | ≈29 |
| Pill label (compare cards) | **27** Inter 700 | ≈15 (raised to clear the `check` 28 px floor; or mark `data-layout-ignore`) |
| URL text in the browser chrome | 20, Inter 600 | 13 (mark `data-layout-ignore`: it is texture) |

### 3.3 `:root` block (ready to paste)

```css
@font-face{font-family:"Inter";src:url("assets/fonts/Inter-Variable.woff2") format("woff2");font-weight:100 900;font-style:normal;}
@font-face{font-family:"EB Garamond";src:url("assets/fonts/EBGaramond-ExtraBoldItalic.woff2") format("woff2");font-weight:800;font-style:italic;}

:root{
  /* ---------- canvas ---------- */
  --W:1080px; --H:1920px; /* 30 fps */

  /* ---------- fonts ---------- */
  --font-sans:"Inter", system-ui, sans-serif;
  --font-serif:"EB Garamond", "Playfair Display", Georgia, serif;
  --sans-wght:650; --sans-opsz:28; --cta-wght:850; --serif-wght:800;

  /* ---------- type scale ---------- */
  --cap-size:102px; --cap-size-dark:105px; --cap-track:-0.025em; --cap-gap:0.30em;
  --serif-size:113px; --serif-track:-0.02em;
  --head-size:86px; --head-track:-0.03em;
  --box-serif-size:116px;
  --cta-setup-size:160px; --cta-key-size:138px;
  --pop-num-size:157px; --pop-label-size:44px; --pill-label-size:27px; --url-size:20px;

  /* ---------- palette: neutrals ---------- */
  --ink:#111214;            /* captions + headline on light/white */
  --ink-dark:#EEF4FB;       /* captions on dark grey/brown/navy */
  --ink-face:#FDFAF5;       /* captions on full-bleed presenter */
  --bg-white:#FDFDFD;       /* W layout + 5-frame blank hold */
  --label-grey:#767676;     /* stat label */
  --pill-dark:#1F1E20;      /* "original" pill */

  /* ---------- palette: accent family (default "Azure" = reference) ---------- */
  --accent:#0083FC;         /* headline/label box fill, "ours" pill */
  --accent-text:#0C82F0;    /* serif emphasis on light (3.12:1 on #E4E8EC; use #0A78E2 if `check` flags contrast) */
  --accent-num:#0582F5;     /* blue sans stretch (numbers) on light */
  --accent-soft:#82C1F5;    /* serif emphasis on dark */
  --accent-bright:#2C99F7;  /* blue sans stretch on navy */
  --emph-white:#E9F2FC;     /* 2nd+ serif span on the navy compare stage */
  --ring:#0F8AF6;           /* UI highlight ring (measured median 15,138,246) */
  --select:#B4D4F5;         /* text-selection sweep */
  --card-border:#2E62A1;    /* browser card stroke core */
  --card-glow:#C4E4FF;      /* 2-3 px outer glow */
  --beam:#94C0F6; --beam-halo:#B4CFF3;
  --cta-key-grad:linear-gradient(180deg,#E1F5FD 0%,#A8D7F9 55%,#539AFD 100%);
  --cta-setup-grad-dim:linear-gradient(180deg,#FFFAF0 0%,#9A9597 100%);
  --cta-glow:rgba(40,100,220,.55);
  --glitch-blue-light:#708EE2; --glitch-red-light:#D2858A;
  --glitch-blue-dark:#448CD6;  --glitch-red-dark:#B95965;

  /* ---------- browser chrome ---------- */
  --chrome:#F3F3F5; --chrome-divider:#E0E0E0; --url-pill:#FDFDFD; --url-ink:#1D1D1F; --chrome-icon:#848285;
  --tl-red:#F66C5B; --tl-yellow:#EDB734; --tl-green:#1EAB42;

  /* ---------- backgrounds ---------- */
  --bg-light:linear-gradient(60deg,#CCDCE6 0%,#DCE4EA 25%,#E4E8EC 45%,#EAEDEF 65%,#F2F0EF 100%);
  --bg-dark-neutral:radial-gradient(75% 55% at 50% 70%,#575752 0%,#3A3A3A 45%,#262626 80%,#1E1E1E 100%);
  --bg-dark-warm:radial-gradient(75% 60% at 50% 55%,#1D0A05 0%,#130505 55%,#0D0402 100%);
  --bg-navy:linear-gradient(180deg,#030303 0%,#2D2D2D 8%,#3C3C3C 20%,#0A0A0C 46%,#000828 56%,#050A1A 100%);
  --grain-sigma:5;          /* static monochrome noise, luminance sigma ~5/255; light plate only; NOT animated */
  --gobo-darken:0.09;       /* leaf-shadow multiply strength (8-10 % darker) */
  --panel-room:#C5CCBB;     /* sprite panel wall (reference wall #C4CBBC-#CDD4C5) */

  /* ---------- grid (1080x1920) ---------- */
  --margin-x:69px;                          /* 6.4 % W */
  --card-x:69px; --card-w:941px; --card-top:240px;
  --card-h-split:695px;   /* L: y 240-935 */
  --card-h-dark:1062px;   /* D: y 240-1302 */
  --card-hook-x:116px; --card-hook-w:847px; --card-hook-top:476px; --card-hook-h:483px;  /* L1 */
  --card-title-x:117px; --card-title-w:845px; --card-title-top:420px; --card-title-h:678px; /* W */
  --cmp-x:189px; --cmp-w:701px; --cmp-h:526px; --cmp-top-a:240px; --cmp-top-b:789px;  /* B, 4:3, gap 23 */
  --panel-x:59px; --panel-w:963px; --panel-top:1407px;   /* sprite panel, bleeds off bottom */
  --head-top-split:1118px;                  /* 58.2 % H: sprite head breaks out ~289 px above panel */
  --headline-baseline:278px; --headline-x:108px;
  --hbox-x:159px; --hbox-top:309px; --hbox-h:131px; --labelbox-top:240px; --labelbox-h:134px;

  /* ---------- caption baselines ---------- */
  --cap-base-L:1071px; --cap-base-L1:1079px; --cap-base-D:1478px; --cap-base-W:1239px;
  --cap-base-F:1377px; --cap-base-B:1491px;
  --cap-max-w:700px;                        /* one line only, <= 65 % W */
  --cta-setup-top:1318px; --cta-key-top:1397px; /* CTA lockup stack (F layout) */

  /* ---------- radii ---------- */
  --r-card:21px; --r-cmp:18px; --r-panel:132px; --r-box:7px; --r-ring:24px; --r-pop:24px;
  --r-url:12px; --r-pill:999px;

  /* ---------- strokes ---------- */
  --card-border-w:3px; --ring-w:6px; --beam-len-deg:8deg;

  /* ---------- shadows ---------- */
  --sh-text-light:none;                                 /* measured halo is negligible */
  --sh-text-dark:0 3px 18px rgba(0,0,0,.35);
  --sh-text-face:0 3px 21px rgba(0,0,0,.45);
  --sh-cta-setup:0 4px 27px rgba(0,0,0,.60);
  --sh-cta-key:0 3px 6px rgba(0,0,0,.55), 0 14px 54px var(--cta-glow);
  --sh-hbox:0 12px 30px rgba(0,110,230,.30);            /* downward only, blue-tinted */
  --sh-card-light:0 15px 45px rgba(20,40,80,.08);
  --sh-card-white:0 18px 54px rgba(20,40,80,.18);
  --sh-card-dark:none;
  --sh-panel:0 0 70px rgba(30,45,60,.42);
  --sh-pop:0 10px 30px rgba(0,0,0,.12);
  --sh-pill:0 3px 9px rgba(0,0,0,.25);
}
```

### 3.4 Component geometry (1080)

**Browser card (Safari style):**
- Outer radius 21. Border 3 px `--card-border`, with an inner 1.5 px `rgba(255,255,255,.8)` highlight and an outer 2–3 px `--card-glow` haze. I measured the core at #295F9B–#4383C9, white inner line #E4FFFF and glow #CFE4F0 [f400].
- Toolbar: 68 px tall, `--chrome` fill, 1.5 px divider `--chrome-divider`, content starts on #FFFFFF.
- Traffic lights: Ø15, pitch 26, first centre 35 px from the left edge and 34 px from the top.
- URL pill: 39 px tall, radius 12, about 520 px wide, centred. It holds a lock icon plus the domain in 20 px Inter 600.
- Share / + / tabs icons sit at the right in `--chrome-icon`.

**Headline box:**
- Padding: 15 px left, 30 px right (room for the italic overhang), 33 px from the box top to the cap top, 25 px from the baseline to the box bottom.
- Gap between the line-1 baseline and the box top: 31 px.
- Gap from the box bottom to the card: 36 px.
- The box width follows its text.

**Highlight ring:**
- Stroke 6 px `--ring`, outer radius 24.
- Padding round the target text: about 20 px horizontally and 30 px vertically (chips: an 8–15 px outset).

**Stat callout pill:**
- 362x264, white #FDFDFD, 1.5 px #E2E2E2 hairline, radius 24, `--sh-pop`.
- Digits in `--accent-num`. The label sits 37 px under the digits, in `--label-grey`.

**Compare-card pills:**
- Inset 20 px from the card's top-left. Height 48 px, horizontal padding 18.
- Baseline/original: `--pill-dark`. Ours/result: `--accent`. White bold text.

**Sprite panel:**
- x 59–1022, top 1407, radius 132 (a continuous "squircle-like" corner: the measured inset is 84/66/52/36/26/18/12/8/6/4/2/0 px at dy 2/6/10/18/26/38/50/62/74/86/102/110 [720]). Bleeds off the bottom edge. `--sh-panel`.

### 3.5 Backgrounds

- **Light plate (L layouts only).**
  - Gradient: `--bg-light`.
  - Leaf-gobo shadow, multiplied about 9 % darker with a cool tint (#D1DFE7 in the shade). It covers the top-left (x 0–495, y 0–750) and a smaller patch on the right edge at mid-height, blurred 12–20 px. It is static.
  - Static monochrome grain, σ ≈ 5 levels. Measured: high-pass σ 2.3–3.1 [720] with frame-to-frame diff σ 0.7–0.9, so it is **not animated**.
  - Pre-render the plate per video as one PNG (gradient + gobo + grain).
- **White (W):** flat `--bg-white`, no grain. The 5-frame blank hold uses the same colour (measured 253,253,253 with σ 0.01).
- **Dark (D):**
  - Preferred: a full-frame copy of the card's media, `blur(60–90px)`, brightness 0.25–0.35, plus `radial-gradient(transparent 40%, rgba(0,0,0,.45))` as a vignette.
  - The tint family follows the content: neutral grey (#575752 brightest at about 72 %H → #1E1E1E corners), warm brown (#1D0A05 → #0D0402) or navy.
  - Fallback: the `--bg-dark-*` tokens.
  - No grain. It scales with the stage during the zoom-settle.
- **Navy (B):** `--bg-navy`. A blurred window or room photo works if one is available; it is static.
- **Full-bleed presenter (F):** for the sprite, a pixel-art room at the sprite's art scale (wall `--panel-room`, slightly darker lower wall #AEB6A4, a door frame #9AA294) with a soft 6–10 px blur and a 20 % vignette.

---

## 4. Motion tokens

**House rules**, from fits to the per-frame curves:
- Small elements use power2/power3.out.
- Wipes and sweeps use expo.out.
- Anything that moves a camera or a whole card uses a slow-start, long-tail cubic-bezier (≈ .2–.32, 0–.06, 0, 1).
- Nothing overshoots: no back or elastic curve ever won a fit.
- There is no hold drift: every hold measured scale 1.0000 ± 0.0005.
- Shot changes are hard cuts only.

**Duration clusters:**
- 0.10–0.23 s: micro-moves (word in, ring, fades, flickers).
- 0.45 s: cursor.
- 0.67–0.75 s: element entrances (card pop, box wipe, push).
- 0.93–1.18 s: camera moves.

### 4.1 Shared setup (every scene file)

```js
gsap.registerPlugin(CustomEase);                    // vendored: assets/vendor/CustomEase.min.js
const FPS = 30;
const T = f => f / FPS;                              // tween position for frame f
const S = f => (f - 0.5) / FPS;                      // instant set that must be visible ON frame f
CustomEase.create("settle", "M0,0 C0.32,0.06 0,1 1,1");   // stage zoom-settle
CustomEase.create("push",   "M0,0 C0.3,0 0,1 1,1");       // card carousel push
CustomEase.create("cam",    "M0,0 C0.2,0 0,1 1,1");       // in-card pan / zoom / scroll
CustomEase.create("cursor", "M0,0 C0.3,0.03 0.18,1 1,1"); // cursor travel
```

Keep every event time as an **integer frame** in the plan data. Place tweens at `T(f)` and instant swaps at `S(f)`.

### 4.2 Token table

| Token | What | Frames (ms) | Ease | From → to (1080) |
|---|---|---|---|---|
| `CUT` | Shot change | 0 | — | Hard cut, no flash or blur |
| `BLANK_HOLD` | White stage before a W reveal | 5 f (167) | — | #FDFDFD, all layers off |
| `ZOOM_SETTLE` | Whole stage (bg + cards + caption) | 35.5 f (1183) | `settle` | scale 1.15 → 1 about (540, 960); blur 0 → 3 px → 0, peaking at +7 f |
| `CARD_POP` | Card entrance | scale 20 f (667); opacity 5.6 f (187) | scale power3.out; opacity sine.inOut | scale .905 → 1 about the card centre; opacity 0 → 1; blur 4 → 0 px |
| `BOX_WIPE` | Headline/label box reveal | 21.75 f (725) | expo.out | clip from the left; shadow wipes with it |
| `TITLE_WORD` | Headline line-1 word | opacity 11.75 f (392); y 10.75 f (358) | power2.out / expo.out | y +44 → 0, blur 9 → 0, stagger 2.33 f (78 ms) |
| `BOX_WORD` | White serif word inside a box | opacity 8 f (267); y 10.25 f (342) | power3.out / expo.out | y +33 → 0, blur 6 → 0 |
| `CAP_WORD` | Every caption word | 5.7 f (190) | power3.out | opacity 0 → 1, y +10 → 0, blur 6 → 0; starts 1 f before the onset frame |
| `CAP_SERIF` | Serif emphasis word | 7 f (233) | power3.out | as `CAP_WORD` with blur 12; colour ramps from desaturated (#A0B4E7 on light) to the accent over 4 f |
| `CAP_TITLE` | Caption on a W card | opacity 9 f; y 12 f (400) | power4.out / expo.out | y +20 → 0 |
| `STRETCH_IN` | Number, verb, punch word | scaleX 9 f (300); opacity 5 f | power3.out / power2.out | scaleX 1.45 → 1 about the left edge (first visible frame ≈ 1.32), blur 10 → 0 px horizontal / 6 px vertical; starts 1 f before the onset |
| `GLITCH_IN` | Brand or list-head word | 7–9 f (233–300) | stepped (`tl.set` per frame) | see §5.12 |
| `GHOST_FILL` | Caption word on the F layout | 3 f (100) | stepped | shadow 0.7 → 1 → 1, fill 0.08 → 0.76 → 1, y +4 → 0 |
| `CTA_SETUP` | Setup verb (*comment*) | 20 f (667) | power3.out | full opacity on frame 1; scaleX 1.165 → 1 about 30 % 50 % |
| `CTA_KEY` | Keyword ("Motion") | 6 f stepped plus y 6 f (200) | steps + power2.out | opacity [.25 blur 6, 1 + bloom 1.55, .45 blur 3, 1, .6 blur 2, 1]; y +18 → 0 |
| `PUSH` | Card carousel | 22 f (733) | `push` | strip x 0 → −PITCH (PITCH = card width + 270 = 1211 for the wide card) |
| `CAM_MOVE` | In-card pan / zoom / scroll | 28–34 f (933–1133) | `cam` | pan up to 633 px, zoom ×1.5–2.0, scroll 300–375 px |
| `SEL_SWEEP` | Text-selection highlight | 8 f (≤400 px), 15 f (≈680 px), 22 f (2 lines), 34 f (3+ lines) | power3.out for ≤8 f, else expo.out | width 0 → text width, left edge fixed, continuous across line wraps |
| `RING_DRAW` | Ring draw-on, clockwise from top-left | 5 f (167) | power3.out | dashoffset 1 → 0 |
| `RING_FADE` | Old ring exits | 4 f (133) | none (linear) | opacity 1 → 0, overlapping the next ring's draw |
| `CURSOR_MOVE` | Cursor travel | 13.5 f (450) | `cursor` | arc bulge 9 % of the distance, perpendicular |
| `CURSOR_FADE` | Cursor in / out | 4 f (133) | linear | opacity; enters already moving, leaves in place |
| `STAT_POP` | Callout flying out of a ring | 21 f (700) | power3.out | scale .30 → 1 plus translate from the ring centre |
| `ODOMETER` | Digits roll | 13 f (433) | power3.out | 0 → value |
| `POP_PILL_IN` / `POP_OUT` | Callout backing pill / exit | 6 f (200) / 7 f (233) | power2.out / linear | in: opacity 0 → 1 from +7 f; out: opacity → 0, blur 0 → 12, y −9 |
| `LABEL_FADE` | Compare pills | 3–4 f (100–133) | linear | opacity, stagger 10 f |
| `TINT_CLEAR` | Compare-card wash | 14 f (467) | power1.out | #9DBDE6 overlay at 30 % → 0 (may be source content; optional) |
| `MEDIA_BLUR_SWAP` | Content swap inside a fixed frame | 8 + 8 f (533) | power2.in / power2.out | blur 0 → 21 px, cut, 21 → 0 |
| `PRE_CUT_EXIT` | B-roll drift-out before a section cut | drift 23 f; blur 5 f | power3.in / power2.in | media yPercent 0 → −8; blur 0 → 18 px |
| `BEAM` | Border comets | 8.1 s per lap | none | conic angle +360°, two comets 180° apart |
| `SPRITE_BOB` | Idle life | 24 f per step | steps | y 0 ↔ −1 art pixel |

### 4.3 GSAP for each primitive

```js
// ZOOM_SETTLE — stage = wrapper holding bg + card(s) + caption track of a D/B scene
function zoomSettle(tl, stage, cutF, s0 = 1.15, d = 35.5) {
  tl.fromTo(stage, { scale: s0, transformOrigin: "50% 50%" }, { scale: 1, duration: T(d), ease: "settle" }, T(cutF));
  tl.fromTo(stage, { filter: "blur(0px)" }, { filter: "blur(3px)", duration: T(7), ease: "sine.in" }, T(cutF));
  tl.fromTo(stage, { filter: "blur(3px)" }, { filter: "blur(0px)", duration: T(7), ease: "sine.out", immediateRender: false }, T(cutF + 7));
}

// CARD_POP
function cardPop(tl, card, f) {
  tl.fromTo(card, { opacity: 0, filter: "blur(4px)" }, { opacity: 1, filter: "blur(0px)", duration: T(5.6), ease: "sine.inOut" }, T(f));
  tl.fromTo(card, { scale: 0.905, transformOrigin: "50% 50%" }, { scale: 1, duration: T(20), ease: "power3.out" }, T(f + 0.3));
}

// BOX_WIPE — boxFill = inner element (fill + text), boxShadow = sibling div carrying --sh-hbox
function boxWipe(tl, boxFill, boxShadow, f) {
  tl.fromTo(boxFill, { clipPath: "inset(0% 100% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: T(21.75), ease: "expo.out" }, T(f));
  tl.fromTo(boxShadow, { scaleX: 0, transformOrigin: "0% 50%" }, { scaleX: 1, duration: T(21.75), ease: "expo.out" }, T(f));
}

// TITLE_WORD (headline line 1): words = array of spans
function titleWords(tl, words, f) {
  tl.fromTo(words, { opacity: 0, filter: "blur(9px)" }, { opacity: 1, filter: "blur(0px)", duration: T(11.75), ease: "power2.out", stagger: T(2.33) }, T(f));
  tl.fromTo(words, { y: 44 }, { y: 0, duration: T(10.75), ease: "expo.out", stagger: T(2.33) }, T(f));
}
// BOX_WORD
function boxWord(tl, el, f) {
  tl.fromTo(el, { opacity: 0, filter: "blur(6px)" }, { opacity: 1, filter: "blur(0px)", duration: T(8), ease: "power3.out" }, T(f));
  tl.fromTo(el, { y: 33 }, { y: 0, duration: T(10.25), ease: "expo.out" }, T(f));
}

// CAP_WORD / CAP_SERIF — onsetF = Math.round(wordStartSec*30); first visible frame = onsetF (~44 % opacity)
function capWord(tl, el, onsetF, serif = false) {
  const d = serif ? 7 : 5.7, b = serif ? 12 : 6;
  tl.fromTo(el, { opacity: 0, y: 10, filter: `blur(${b}px)` },
               { opacity: 1, y: 0, filter: "blur(0px)", duration: T(d), ease: "power3.out" }, T(onsetF - 1));
}

// STRETCH_IN (numbers, promise verb, punch word) — origin = left edge of the word box
function stretchIn(tl, el, onsetF) {
  tl.fromTo(el, { scaleX: 1.45, transformOrigin: "0% 50%" }, { scaleX: 1, duration: T(9), ease: "power3.out" }, T(onsetF - 1));
  tl.fromTo(el, { opacity: 0, filter: "blur(10px)" }, { opacity: 1, filter: "blur(0px)", duration: T(5), ease: "power2.out" }, T(onsetF - 1));
}

// GHOST_FILL (F layout): word = <span class="w"><span class="sh">text</span><span class="fill">text</span></span>
// .sh = transparent fill + text-shadow var(--sh-text-face); .fill = colour --ink-face
function ghostFill(tl, w, onsetF) {
  const sh = w.querySelector(".sh"), fill = w.querySelector(".fill");
  [[0.7, 0.08, 4], [1, 0.76, 2], [1, 1, 0]].forEach(([a, b, y], i) => {
    tl.set(sh, { opacity: a }, S(onsetF + i)); tl.set(fill, { opacity: b }, S(onsetF + i)); tl.set(w, { y }, S(onsetF + i));
  });
}

// PUSH (carousel): strip holds [cardA, gap, cardB]; per-frame horizontal motion blur via SVG filter
function push(tl, strip, f, pitch = 1211) {
  tl.fromTo(strip, { x: 0 }, { x: -pitch, duration: T(22), ease: "push" }, T(f));
  // generator precomputes v(f) = |x(f)-x(f-1)| and sets <feGaussianBlur stdDeviation="${0.25*v} 0"> at S(f)
}

// CAM_MOVE (pan/zoom/scroll of content INSIDE a card; chrome + border stay fixed; rings/cursor ride along)
function camMove(tl, content, f, from, d = 34) {   // from = {x, y, scale}
  tl.fromTo(content, { ...from, transformOrigin: "0% 0%" }, { x: 0, y: 0, scale: 1, duration: T(d), ease: "cam" }, T(f));
}

// SEL_SWEEP: generator precomputes cumulative width per frame along the text lines (expo.out over D)
// and emits tl.set(lineRect_i, {width}, S(f)) for each frame. Single short line: a tween is fine:
function sweepLine(tl, rect, f, w, d) {
  tl.fromTo(rect, { width: 0 }, { width: w, duration: T(d), ease: d <= 8 ? "power3.out" : "expo.out" }, T(f));
}

// RING_DRAW / RING_FADE — <rect pathLength="1" stroke-dasharray="1" rx="24"> (rect paths run clockwise from top-left)
function ring(tl, r, f) { tl.fromTo(r, { strokeDashoffset: 1, opacity: 1 }, { strokeDashoffset: 0, duration: T(5), ease: "power3.out" }, T(f)); }
function ringFade(tl, r, f) { tl.fromTo(r, { opacity: 1 }, { opacity: 0, duration: T(4), ease: "none" }, T(f)); }

// CURSOR: generator precomputes path p(t)=chord(ease_cursor(t)) + n * 0.09*L * sin(pi*ease_cursor(t)), emits tl.set per frame.
// CURSOR_FADE:
function cursorFade(tl, c, f, dir) { tl.fromTo(c, { opacity: dir > 0 ? 0 : 1 }, { opacity: dir > 0 ? 1 : 0, duration: T(4), ease: "none" }, T(f)); }

// STAT_POP from a ring: dx,dy = ring centre minus pill centre
function statPop(tl, stat, pill, f, dx, dy) {
  tl.fromTo(stat, { scale: 0.30, x: dx, y: dy, transformOrigin: "50% 50%" }, { scale: 1, x: 0, y: 0, duration: T(21), ease: "power3.out" }, T(f));
  tl.fromTo(pill, { opacity: 0 }, { opacity: 1, duration: T(6), ease: "power2.out" }, T(f + 7));
  // ODOMETER: each digit column is a vertical strip 0-9 repeated; tween column y to -(cycles*10+digit)*h over T(13) power3.out from T(f+1)
}
function statOut(tl, stat, f) {
  tl.fromTo(stat, { opacity: 1, filter: "blur(0px)", y: 0 }, { opacity: 0, filter: "blur(12px)", y: -9, duration: T(7), ease: "none" }, T(f));
}

// MEDIA_BLUR_SWAP inside a fixed frame, cutF = the caption-word frame of the repeated keyword
function mediaSwap(tl, a, b, cutF) {
  tl.fromTo(a, { filter: "blur(0px)" }, { filter: "blur(21px)", duration: T(8), ease: "power2.in" }, T(cutF - 8));
  tl.set(a, { opacity: 0 }, S(cutF)); tl.set(b, { opacity: 1 }, S(cutF));
  tl.fromTo(b, { filter: "blur(21px)" }, { filter: "blur(0px)", duration: T(8), ease: "power2.out" }, T(cutF));
}

// PRE_CUT_EXIT (before a cut into F)
function preCutExit(tl, media, cutF) {
  tl.fromTo(media, { yPercent: 0 }, { yPercent: -8, duration: T(23), ease: "power3.in" }, T(cutF - 23));
  tl.fromTo(media, { filter: "blur(0px)" }, { filter: "blur(18px)", duration: T(5), ease: "power2.in" }, T(cutF - 5));
}

// BEAM — border ring masked to the stroke; --a drives a conic-gradient. No repeat:-1 (banned): one linear tween over the scene.
function beam(tl, el, sceneDurSec, phaseDeg) {
  tl.fromTo(el, { "--a": `${phaseDeg}deg` }, { "--a": `${phaseDeg + 360 * sceneDurSec / 8.1}deg`, duration: sceneDurSec, ease: "none" }, 0);
}
```

Beam CSS (one element per card, `inset:-1.5px`, masked to a 3 px ring):

```css
.beam{position:absolute;inset:-1.5px;border-radius:calc(var(--r-card) + 1.5px);padding:3px;
  background:conic-gradient(from var(--a,0deg),
    transparent 0deg, var(--beam-halo) 2deg, var(--beam) 4deg, var(--beam-halo) 6deg, transparent 8deg,
    transparent 180deg, var(--beam-halo) 182deg, var(--beam) 184deg, var(--beam-halo) 186deg, transparent 188deg);
  -webkit-mask:linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite:xor; mask-composite:exclude; filter:blur(1.5px);}
```

The conic sweep gives a **constant angular period**: every card measured 8.1 s per lap whatever its size (220 px/s on the hook card, 270 px/s on the wide card, at 720). Two comets sit 180° apart, both clockwise.

---

## 5. Component catalog

Each entry gives purpose, visual spec, motion spec, SFX pairing and when to use it. All values are at 1080.

### 5.1 BackgroundLight
- **Purpose:** the "presenter world". Used only in L layouts.
- **Visual:** see §3.5. Gradient from cool #CCDCE6 at the bottom-left to warm #F2F0EF at the top-right, plus the leaf gobo and static grain.
- **Motion:** none. Do not animate the grain. The gobo may stay fully static (the measured sway is within noise).
- **SFX:** none.
- **Use:** for every L scene. Never for proof, naming or compare beats.

### 5.2 BackgroundDark (neutral / warm / navy)
- **Purpose:** "evidence world". Used for D and B.
- **Visual:** a blurred, darkened copy of the shown media plus a vignette. A grey top band (#2D2D2D–#4C4C4C over y 0–180) appears when the media has a light header. No grain.
- **Motion:** scales with the stage during `ZOOM_SETTLE`, then holds.
- **SFX:** comes from the scene (see `ZOOM_SETTLE`).
- **Use:** every D and B scene. The tint comes from the media's mean colour: if hue is within ±30° of orange/red → warm; if blue or white UI → navy; otherwise neutral.

### 5.3 BrowserCard
- **Purpose:** the container for all B-roll (pages, recordings, generated explainer pages).
- **Visual:** §3.4. Size by layout:

| Layout | x | y | Size |
|---|---|---|---|
| L1 | 116–963 | 476–959 | 847x483 |
| L | 69–1010 | 240–935 | 941x695 |
| D | 69–1010 | 240–1302 | 941x1062 |
| W | 117–962 | 420–1098 | 845x678 |

- Content is clipped by the card. The chrome and border never move. Content can pan, zoom or scroll inside.
- **Continuity:** across an L↔D cut, top, left and right stay identical and only the height changes. The card is the visual anchor across cuts.
- **Motion:** `CARD_POP` when a card first appears in a scene that has no stage zoom (L1, W). In D it rides `ZOOM_SETTLE`. On a cut into L it simply appears.
- **Shadows:** `--sh-card-light` on L, `--sh-card-white` on W, none on dark.
- **Always** has a **BorderBeam**.

### 5.4 BorderBeam
- **Visual:** two 8° comets (core #94C0F6, halo #B4CFF3, blur 1.5 px), opposite each other, clockwise. Length on the wide card ≈ 75–90 px.
- **Motion:** 8.1 s per lap, linear. The phase is seeded per card and keeps running through cuts when the same card persists.
- **SFX:** none.
- **Use:** every BrowserCard. **Not** on B-layout compare cards: I measured no orbiting beam there (f665–705), only a static rim highlight.

### 5.5 HeadlineReveal + HighlightBoxWipe (hook title)
- **Purpose:** turn the hook sentence into a claim plus its payload.
- **Visual:**
  - Line 1: Title-Case Inter 650, 86 px, `--ink`, centred, baseline 278. At most 80 % W (866 px) and at most 4 words.
  - Line 2: box in `--accent` holding the 1–3 word payload in white EB Garamond Italic 800 at 116 px, Title Case, centred, top 309, height 131, radius 7, `--sh-hbox` downward only. The box width follows the text and is at most 71 % W.
- **Motion:**
  - Starts on frame 1; frame 0 is clean.
  - Line-1 words: `TITLE_WORD` at f1, stagger 2.33 f, so the last word starts about f8.
  - Box: `BOX_WIPE` at f4.8 (use f5).
  - Box words: `BOX_WORD` at about f9 and f12, revealed as the wipe passes them; the text is clipped, never squashed.
  - Fully built by f17 (567 ms). Holds static to the first cut, with no exit; it leaves on the cut.
- **SFX:** riser A plus whoosh W, both at f0.
- **Use:** the first scene of every video.

### 5.6 TitleCardOnWhite (W)
- **Purpose:** naming or reveal ("it's called", "introducing", "meet", "this is").
- **Visual:** flat white. Label box at top 240, height 134, centred, holding the **lead-in phrase** in Title Case white serif ("It's Called"). BrowserCard (W size) showing the named thing. The **name** goes in the caption track, black, at baseline 1239.
- **Motion:**

| Offset | Event |
|---|---|
| +0 to +4 f | `BLANK_HOLD` (5 f of white) |
| +5 | `BOX_WIPE` starts |
| +6 | `CARD_POP` |
| +9, +12 | `BOX_WORD`s |
| name onset | `CAP_TITLE` (y +20, expo.out 0.4 s) |
| name onset + 1 f | `SEL_SWEEP` over the name inside the card |

- **SFX:** whoosh W on the first white frame.
- **Use:** at most once per video, only right after a sentence end.

### 5.7 SpriteStage (split-panel pop-out)
- **Purpose:** the presenter in L layouts.
- **Visual:** the panel (§3.4) is filled with a pixel-art room. The sprite is drawn **above** the panel, unclipped, so the head breaks out above the panel top. Details in §7.
- **Motion:** hard on and off with the cut. No zoom or punch-in. Only pose and mouth swaps plus `SPRITE_BOB`.
- **SFX:** none.

### 5.8 FullBleedInsert (F)
- **Purpose:** direct address or imperative to the viewer, and the CTA.
- **Visual:** a full-frame room plate plus a large sprite (§7). Captions in `--ink-face` with `--sh-text-face`, baseline 1377.
- **Motion:** a hard cut in and a hard cut out. The reference is a cut to a ×1.74 tighter crop with **no** animated punch. Use `GHOST_FILL` for captions.
- **SFX:** riser A ending 1 f before the cut in, if the cut ends a section.
- **Use:** once mid-video, for one "you"/imperative clause (0.8–1.5 s), and as the final CTA scene.

### 5.9 CaptionGroup / CaptionWord
- **Purpose:** the karaoke track, the backbone of retention.
- **Visual:**
  - One line, centred on x 540, at most 700 px wide, 1–4 words (2 typical).
  - Lowercase except proper nouns and acronyms. Punctuation stripped except apostrophes. Numbers as digits.
  - Inter 650 at 102 px (105 on dark). Word gap 0.30 em.
  - Colours: `--ink` on L/W, `--ink-dark` + `--sh-text-dark` on D/B, `--ink-face` + `--sh-text-face` on F.
  - Baseline per layout as in §3.3.
- **Layout:**
  - Lay the **whole group out once** at its final width, centred.
  - Each word **appears in its final slot**, so the first word of a 3-word group sits left of centre. There is never a re-centre or slide.
- **Motion:**
  - `CAP_WORD` per word at its onset.
  - The group exits by a **hard cut** on the frame the next group's first word appears (direct swap), or with **one blank frame** first (rule in §6.4).
  - On a layout cut, a group still on screen is re-drawn in the new layout's position and colours (and inside the stage scale) until the next group appears.
  - No exit animation, ever.
- **SFX:** none, ever.

### 5.10 EmphasisSerif
- **Visual:**
  - EB Garamond Italic 800 at 113 px. Its baseline sits 6 px above the sans baseline.
  - Colour `--accent-text` on light/white and `--accent-soft` on D/B.
  - Exception: on the B stage, the 2nd and later serif spans use `--emph-white`.
  - Connectors inside an emphasis group ("or" in "brand or product") stay plain sans.
- **Motion:** `CAP_SERIF`.
- **Use:** see §6.5.

### 5.11 StretchIn (numbers, promise verb, punch word)
- **Visual:**
  - Numbers: Inter 650 in `--accent-num` (light) or `--accent-bright` (navy).
  - Promise verb: Inter 650 in `--accent-bright`/`--accent-num`, in a solo group.
  - Punch word or list head: plain ink.
- **Motion:** `STRETCH_IN`. The left edge is pinned and the height never changes. I verified this: for "230" the left edge holds at 409–414 and the height at 678–725 while the right edge goes 542 → 522 [720]. "recreate" and "demos" behave the same way.
- **SFX:** none.

### 5.12 GlitchIn
- **Visual:** the word in its normal colour, plus 3 horizontal slice clones (`clip-path: inset()` bands at 0–33 %, 33–66 % and 66–100 % of the line height). RGB fringes come from `text-shadow`: blue/violet to the left (`--glitch-blue-*`) and red/salmon to the right (`--glitch-red-*`).
- **Motion:** stepped. Frame k is the first visible frame (= onset frame, or up to 7 f early for a brand in a solo group).

| k | Opacity | Slice dx top / mid / bot (px) | RGB split (px) | skewX | Blur |
|---|---|---|---|---|---|
| +0 | 1.00 | +8 / +8 / −9 | ±8 | 0 | 0 |
| +1 | 0.10 | 0 / 0 / 0 | 0 | 0 | 4 px |
| +2 | 1.00 | −2 / +12 / +6 | ±6 | +6° | 0 |
| +3 | 0.70 | −1 / +6 / +12 | 0 | −8° | 0 |
| +4 | 0.25 | +3 / +3 / +3 | 0 | 0 | 4 px |
| +5 | 1.00 | 0 / −10 / +6 | 0 | +4° | 0 |
| +6 | 1.00 | +3 / +3 / +3 | 0 | +2° | 0 |
| +7 | 1.00 | clean | 0 | 0 | 0 |

  Seed the slice offsets per instance (sign flips, ±40 % magnitude). Keep the opacity column fixed: it was identical across all 6 reference instances.
- **SFX:** none.
- **Use:**
  - Every brand, product, tool or AI proper noun.
  - The first caption word of the video.
  - The first word of a multi-word list item.

### 5.13 ZoomSettle (scene entrance for D and B)
- **Visual:** a stage wrapper containing background, card(s) and the caption track. Its origin is the frame centre.
- **Motion:** `ZOOM_SETTLE`. Hold frames are built in: the first 3 frames barely move (1.150 → 1.143), peak velocity comes at +5…+8 f, and the tail is long.
- **SFX:** sub swell B starting on the cut frame (it peaks at +10 f, matching the visual peak).
- **Use:** **every** cut into D or B, and never on L, W or F.

### 5.14 CardSwap (carousel PUSH)
- **Visual:** the outgoing and incoming cards ride one strip, with a 270 px gap between cards at 1080. That is 180–190 px at 720, measured from the edges at f541–547; the pitch is 112 % W.
  - The incoming card measured 601–604 px wide [720] mid-slide against 627 at rest. That suggests it starts at about 0.96 and grows on landing **(inferred)**: optionally scale it .96 → 1 on the same ease.
- **Motion:** `PUSH` with per-frame horizontal blur, σx = 0.25 × |velocity| (peak ≈ 49 px at 1080).
- **SFX:** usually inside a riser span (the swipe sits before a section cut). Otherwise a sub swell B starting 10 f before peak velocity (peak velocity is at +4 f, so start the swell at f − 6).
- **Use:** list closers ("and much more", "and more", "etc."), or to swap a B-roll asset within a long L scene (> 4 s).

### 5.15 ZoomInto / Pan / Scroll (CAM_MOVE inside a card)
- **Visual:** the content group (screenshot + rings + highlights + cursor) is transformed. Chrome and border stay fixed. Add directional motion blur proportional to velocity: σ ≈ 0.3 × v.
- **Motion:** `CAM_MOVE`.
  - Zoom: ×1.5–2.0 onto the region about to be referenced (reference: scale .497 → 1, 34 f). When it follows a cut, **start it 5 f before the cut** so the shot lands mid-motion, about 32 % done.
  - Pan: ≤ 633 px, 28 f, revealing an off-screen target before it is named.
  - Scroll: 300–375 px, 31 f, for "there's more" or social proof.
- **SFX:** sub swell B starting 10 f before peak velocity. Skip it when the move begins on a cut that already has a B.
- **Use:** see §6.6.

### 5.16 SelectionSweep (HighlightWipe)
- **Visual:** rectangles in `--select`, square corners, line-height tall (36 px on 2x page text), drawn behind the page text inside the card.
- **Motion:** `SEL_SWEEP`. It wraps across lines in reading order as one selection. Highlights **accumulate** and stay until the scene ends. No cursor is drawn unless one is already present.
- **SFX:** none.
- **Use:** when the narration says or paraphrases text that is visible in the card. Start it 0–5 f before the caption word: 3–5 f early when the keyword is an emphasis word, otherwise 0–1 f.

### 5.17 SelectRing + CursorClick
- **Visual:** ring (§3.4). Cursor: macOS black arrow with a white outline, 23x38 px (34x44 including the outline). It rests 25–43 px right of and 16 px below the target centre.
- **Motion:**
  - The cursor fades in already moving (`CURSOR_FADE` + `CURSOR_MOVE`) and arrives 3 f before the word.
  - `RING_DRAW` starts 0–2 f after the caption word.
  - The previous ring gets `RING_FADE` while the cursor travels.
  - The "click" is implied by the ring only: no press animation, no ripple.
  - The cursor fades out in place when the UI run ends.
- **SFX:** none.
- **Use:** a spoken noun matching a UI label, chip or button (semantic match allowed), or a single word, number or field in the card.

### 5.18 NumberPop (stat callout)
- **Visual:** pill (§3.4) centred at x 540, overlapping the card, with its top about 110 px below the ring's bottom edge. Digits Inter 700 at 157 px in `--accent-num`. Label: the 1–3 word unit noun that follows the number in the script, Inter 700 at 44 px, `--label-grey`.
- **Motion:**
  - `RING_DRAW` round the number in the page.
  - `STAT_POP` flies from the ring centre (+2 f after the ring starts).
  - `ODOMETER` runs 0 → value: the hundreds column steps, the ones column spins 2+ cycles.
  - `POP_PILL_IN` from +7 f.
  - Hold until the next caption group after the noun phrase starts, then `POP_OUT`. The ring fades in 3 f at the same time.
  - With no number in the page, pop it in place: scale .30 → 1 with no travel **(inferred)**.
- **SFX:** whoosh W on the frame the ring starts.
- **Use:** a number plus a noun in a claim. At most one per 10 s.

### 5.19 StackedCompare (the reference's "SideBySideCompare")
- **Visual:**
  - Navy stage. Two 4:3 cards stacked vertically: x 189–890; y 240–765 and 789–1314 (gap 23). Radius 18, border 3 px `--card-border` with a static light rim.
  - Pills inset 20 px: baseline in `--pill-dark` ("original"/"before"/"theirs"), result in `--accent` ("ours"/"after"/"remake").
  - Both cards play the same moment in sync.
  - Caption baseline 1491.
- **Motion:**
  - `ZOOM_SETTLE`.
  - `TINT_CLEAR` on both cards from +1 f.
  - Pills: `LABEL_FADE` at +7 f and +17 f.
  - On a repeated claim keyword ("same", "also", "again"), use `MEDIA_BLUR_SWAP` centred on that word's caption frame. Hold each pair for at least 1.8 s.
  - Before a cut into F, use `PRE_CUT_EXIT`.
- **SFX:** sub swell B on the cut. None on the content swap. A riser into the next section cut.
- **Use:** equivalence, before/after, "turns X into Y", "vs", "same as". At most once per video, at least 3 s long.

### 5.20 CTACommentLockup
- **Visual:** two lines stacked with about −8 px leading (the keyword overlaps the setup's descender zone).
  - Line 1: the setup verb (*comment*) in EB Garamond Italic 800 at 160 px, white, `--sh-cta-setup`, top 1318.
  - Line 2: the keyword in curly quotes, Inter 850 at 138 px, `--cta-key-grad` (via background-clip:text) plus `--sh-cta-key`, top 1397.
  - A blue under-glow ellipse, about 510x180 px centred at (540, 1550), `--cta-glow`.
- **Motion:**

| Offset | Event |
|---|---|
| +0 (ctaF) | `CTA_SETUP`: setup verb cuts in at full opacity, replacing the previous group in the same frame, no blank |
| +9 | `CTA_KEY` starts. The setup verb dims in anti-phase (fill steps 1 / .87 / 1 / .87 / .9) and then settles to `--cta-setup-grad-dim` at +14 |
| +14 → end | Static. No pulse, no exit |

  The bloom on the first ON frame is 1.55× the steady glow.
- **Timing:** ctaF = keyword-verb onset − 9 f. Front-load all CTA-sentence words by 8 f. **Drop** the filler before the verb ("just"). **No captions after the keyword lands.**
- **SFX:** double tick T at +9 f. Final riser A (+3 dB) stopping on the last frame.
- **Use:** any "comment X / type X / search X / follow for X" ending. Without a CTA the video ends on F with plain captions and the final riser.

### 5.21 BlankHold, TintClear, MediaBlurSwap, PreCutExit
These are utility primitives already specified in §4.2 and used by 5.6, 5.19 and §6. None carries its own SFX.

---

## 6. Editorial grammar (deterministic planner rules)

Feed in the processed voiceover (§6.1). Out comes a **beat sheet** (`plan.json`) of integer frames. The generator turns `plan.json` plus a seed into HyperFrames HTML, so the same plan and seed always produce byte-identical renders. Cache `plan.json`; re-renders must read it, not re-plan.

### 6.1 Voice-over preparation (this is half of "snappy")
1. Trim silences longer than 150 ms down to 80 ms (keep 40 ms on each side of speech). Never cut inside a word. The reference keeps no pause longer than 90 ms and no breaths. If the result is still under 3.2 words/s, optionally apply `atempo` up to 1.08 **(inferred)**.
2. High-pass at 80 Hz, apply gentle compression (LRA 2–3 LU), and normalise to **−14 LUFS integrated, −1.0 dBTP** (the reference measured −14.3 / −0.5).
3. Transcribe **after** trimming, to word level `{w,s,e}`. Drop hallucinated words in trailing silence.
4. onsetF(word) = round(s × 30). If whisper drifts, snap onsets to the nearest RMS rise within ±3 f; whisper was off by up to 0.2 s in the reference.

### 6.2 Segmentation and beat classification
- Split into sentences, then clauses: break at `, ; : .`, at conjunctions starting a clause (and, but, so, which) and at trimmed pauses.
- Give each clause **one beat class**, checking the classes in priority order:

| Priority | Beat class | Triggers (lexical / semantic) | Scene template |
|---|---|---|---|
| 1 | **HOOK** | first sentence (or first ≤ 3.0 s) | L1 (headline + narrow card + sprite) |
| 2 | **CTA** | last sentence with comment/type/search/follow/subscribe/save/link/DM | F + CTACommentLockup |
| 3 | **REVEAL** | "it's called", "introducing", "meet", "this is", "called", "named" | W (needs a preceding sentence end) |
| 4 | **COMPARE** | same/identical/recreate/copy/vs/before/after/turns X into Y/compared to/better than | B |
| 5 | **ADDRESS** | sentence starts with an imperative or "you" (copy, try, go, grab, just + verb, you can, you'll) and is not a CTA | F insert (only this clause) |
| 6 | **PROOF** | a third party or evidence is introduced: somebody, someone, a study, researchers, this post/thread/report, according to, just released, look at | D |
| 7 | **DETAIL** | the specific artifact or deliverable: each with, the exact, the actual, here's the, the full, step-by-step | D |
| 8 | **LIST** | ≥ 3 coordinated items ("X, Y, Z, and much more") | L with UI choreography (§6.6) |
| 9 | **PIVOT** | inside, here's, now, so, first, next, then (clause-initial) | hard cut to L with a new B-roll; the pivot word is a 1-word caption group |
| 10 | **CLAIM** | everything else (first person, numbers, opinions, value statements) | L |

### 6.3 Scene scheduling (constraints applied in order)
- **C1. Cuts go only on clause onsets.** cutF = onsetF(first word of the clause), or onsetF − 1 when that frame is still silence. All 10 reference cuts land 0–1 f before the phoneme.
- **C2. Shot length 1.0–6.0 s, target mean 3.0 s (±0.5).**
  - Merge adjacent clauses of the same class while the shot is under 6 s.
  - If one class runs past 6 s, keep the layout and insert a **CardSwap** or **MediaBlurSwap** on a clause boundary.
  - If shots average under 2.4 s, merge CLAIM clauses into their neighbours.
- **C3. Luminance alternation.** Classes are LIGHT (L/L1), DARK (D/B), WHITE (W) and FACE (F). **Two consecutive shots never share a class.** If two adjacent beats map to the same class:
  - L, L → keep one L shot and use a CardSwap between them.
  - D, D → the second becomes B if it qualifies; otherwise merge them.
  - D, B → merge into B.
- **C4. Sprite visibility.** Shown in L/L1/F, hidden in D/W/B. It cuts in and out with no fade. Target 50–65 % of runtime visible (reference 60 %).
- **C5. Proof cadence.** At least one D or B shot per 10 s of runtime. After 8 s without one, promote the next PROOF/DETAIL-like or CLAIM clause that has external evidence to D.
- **C6. ADDRESS insert.** At most 1 per 15 s, excluding the CTA, lasting exactly its clause (0.8–1.5 s). The following shot **must** be L, beginning with a ZoomInto that starts 5 f before the cut.
- **C7. REVEAL.** At most 1 per video. **COMPARE**: at most 1 per video, at least 3 s.
- **C8. Hook and close.** The first shot is always L1 and lasts at least 2.0 s (to the end of the first sentence). If there is a CTA, the last shot is F.
- **Expected mix per 30 s:** about 4 L, 2–3 D, 0–1 W, 0–1 B, 1 F insert and 1 F CTA.

### 6.4 Caption chunking (deterministic)
1. **Tokens.** Lowercase everything except proper nouns, acronyms and the CTA keyword. Strip punctuation but remember where it was. Write numbers as digits.
2. **Greedy grouping**, left to right. Start a new group:
   - (a) after any punctuation;
   - (b) at a scene cut;
   - (c) before an emphasis span, unless the current group is a single determiner, quantifier or intensifier that belongs to it ("a whole **library**", "the **best ones**", "and much **more**", "full **professional**", "is over **230**");
   - (d) when adding the next word would exceed 700 px at the caption size (measure with `fitTextFontSize`/canvas), or exceed 4 words.
3. **Solo groups:**
   - pivot words ("inside");
   - a long content word (8+ letters) that would breach rule (d) (together, exactly, walkthroughs);
   - a pre-verb intensifier/adverb ("actually");
   - the promise verb ("recreate");
   - a brand when it ends a clause ("made with | **Claude**").
4. **Group time.**
   - On screen from its first word's onset until the next group's first word.
   - Minimum 7 f: merge forward if shorter and the width allows. Maximum ≈ 27 f, except the CTA.
   - **Blank frame rule:** insert 1 empty frame before a group when the gap between the previous word's end and this word's start is ≥ 40 ms, or when this group starts a new sentence. Otherwise swap directly. **Never** put a blank before a GLITCH or STRETCH entrance (those replace directly).
5. **Word reveal.** `CAP_WORD` from onsetF − 1, so the word is visible from onsetF.
   - Emphasis words paired with a SelectionSweep or ring may lead by up to 4 f.
   - CTA sentence: all words lead by 8 f, and the lockup by 9 f.
   - The first word after a hard cut starts its tween on the cut frame.
6. **Never caption after the CTA keyword.** In the CTA sentence only, drop "just", "um", "like" and similar fillers.

### 6.5 Emphasis selection (per clause; at most one *style* per group)
Apply in this order. A word takes the first style that matches.

1. **Video's first caption word → GLITCH.**
2. **Brand / product / tool / AI proper noun → GLITCH.**
   - Every occurrence, but at most 1 glitch per 3 s outside lists.
   - If two occurrences are denser than that, only the first in each scene glitches.
3. **Number tokens → STRETCH in accent sans.** If the number quantifies a noun in a CLAIM, also add NumberPop.
4. **The promise verb of a result sentence → STRETCH in accent sans, solo group.** This is the main transformative verb after will/can/lets you (recreate, build, automate, replace…). At most 1 per 10 s.
5. **List items.**
   - The head word of each multi-word item → GLITCH.
   - A single-word item → STRETCH (plain ink).
   - Repeated or trailing generic words (videos, app) stay plain.
   - The list closer ("more", "etc.", "everything") → SERIF.
   - Consecutive special entrances are allowed **only** inside a list.
6. **Payload noun phrase, evaluative adjective or superlative → SERIF.**
   - This is the "what" of the value: the category, quality or deliverable (professional, motion graphics, library, best ones, animated, prompt, brand/product, style, animations, sound effects).
   - Never on function words, pronouns or (non-promise) verbs.
   - Target density: 1 serif span per 4–6 spoken words, at least 1 per sentence.
   - Adjacent emphasis words form one span ("motion graphics", "sound effects").
7. **Punch word → STRETCH (plain ink).**
   - The clause-final word before a comma or full stop in the HOOK ("scratch").
   - The first caption word after an F insert ("tweak").
   - At most 1 per scene.
8. **CTA:** the verb → CTA setup; the object → CTA keyword (in quotes, Title Case).

The headline box (HOOK) and label box (REVEAL) are **not** caption emphasis. Their text comes from §6.7.

### 6.6 B-roll choreography (in-card micro-events)
1. **Asset per shot.** Every L/D/W shot gets one B-roll asset; B gets a pair. Choose by source, in this priority:
   - (i) a real capture (screenshot or scroll recording) of a URL, product, post or document the script names or the user supplies;
   - (ii) a **generated explainer page**: an article-style page, data/stat page, list/filter UI with chips, or table, rendered in neutral house style, whose visible text **contains the narration's keywords verbatim** so that echoes have targets;
   - (iii) user-supplied or AI-generated images/clips placed in the card.

   **Never fabricate** a post, quote, review or record attributed to a real person or organisation. Generated pages carry the creator's own branding or neutral placeholders.
2. **Echo rule.** When a caption word or phrase appears in the card's visible text (literally, or as an obvious paraphrase):
   - phrase of 2+ words → SelectionSweep;
   - single word, number, field or UI label → SelectRing, with a CursorMove first when a cursor is "live" in the scene.

   Start 0–2 f after the caption word, or 3–5 f before it for emphasis words.
3. **Matching rule.** If a spoken noun maps semantically to a UI label, target that label ("launch videos" → "Product UI"). If the next item still maps to the current selection, hold it and do not re-click.
4. **Off-screen rule.** If the next target is off-screen, pan or scroll the content during the **previous** word so the target is visible at least 0.5 s before its word lands.
5. **More rule.** For "there's more", a library, "the best ones" or social proof:
   - D layout → scroll 300–375 px.
   - L layout → pan.
   - At a list closer → CardSwap.
6. **Return rule.** The first L shot after an F insert opens with a ZoomInto (×1.5–2.0) on the region the next clause references, started 5 f before the cut.
7. **Climax rule.** If the B-roll media has a peak moment (burst, reveal, transition), trim it so the peak lands within ±2 f of the clause's most absolute or valuable word (professional, exact, same, instantly).
8. **Cadence.**
   - At least one B-roll micro-event per 1.5 s in any shot with a card.
   - At most one major event (sweep, ring, pop, scroll, pan, zoom, swap) starting per 8 f.
   - With caption swaps included, never let more than 0.9 s pass without a visual change.
   - Ambient beams always run.

### 6.7 Hook and close
- **Hook (L1).**
  - Frame 0 shows only the background, panel and sprite (idle-smile). Everything builds from f1.
  - The headline is a **compression** of the first sentence, not a transcript:
    - line 1 = subject + modal + verb in Title Case, ≤ 4 words, ≤ 866 px ("Claude Can Now Make");
    - box = the 1–3 word payload noun phrase, ≤ 16 characters ("Motion Graphics").
  - The headline verb may differ from the spoken one ("Make" for "build").
  - The card shows the payload itself, playing.
  - Hook SFX: riser A + whoosh W at f0.
  - The first caption word glitches.
- **Close.**
  - With a CTA: CTA beat → F with a riser into the cut (stop 1 f before), PRE_CUT_EXIT on the outgoing B-roll if it is D/B, then the lockup. Hold to the last frame. The final riser stops on the last frame.
  - Without a CTA: the last sentence → F with plain captions and the final riser.

---

## 7. Sprite translation

### 7.1 Asset facts (measured)
- 20 PNGs, 1254x1254, binary alpha. Every pose shares one canvas and registration, so swaps never shift.
- Content bbox (idle): x 410–880, y 88–1185.
- Landmarks:

| Landmark | Canvas position |
|---|---|
| Head top | y 88 |
| Glasses | y ≈ 188–213 |
| Mouth region | x 584–650, y 340–383 |
| Chin | y ≈ 400 |
| Shoulders / shirt | y 413–860 |
| Hands (idle) | y 788–838 |
| Shoes | to y 1185 |
| Face axis | x ≈ 620 |
| Head width | ≈ 300 px |

- Gesture extents: present-left hand x 270–524 and present-right x 780–1039 (both y 520–853); point-left tip x 220 and point-right tip x 1089 (y ≈ 590); wave hand y 385+; thinking hand y 390+.
- Art-pixel size is ≈ 10 canvas px. Colour runs are noisy, so the grid is not perfectly clean.
- "Left" and "right" mean the **viewer's** side.
- Mouth sets:
  - idle: `idle-neutral` (closed), `idle-talk-small`, `idle-talk`, `idle-talk-wide`, `idle-smile`, `idle-surprised`;
  - every other pose: only `<pose>-neutral` (closed) and `<pose>-talk` (open).

### 7.2 Stage per layout (1080; `image-rendering: pixelated` on every sprite `<img>`)

**L1 / L split (pop-out bust)**
- Sprite box 1505x1505 (scale **1.2**, so 1 art px ≈ 12 px) at left −228, top 1012.
- Head top at 1118 (58.2 %H), 289 px above the panel top (reference 285). The face axis lands at x 516.
- All gesture hands stay in frame: point tips at x 36 and 1079 (y ≈ 1720); present hands at y ≈ 1636–1732.
- The frame bottom crops the sprite at canvas y ≈ 756 (mid-torso).
- The panel (§3.4) holds the room. The sprite renders above the panel and is not clipped by it. The caption baseline (1071) sits above the hair (1118).

**F full-bleed**
- Sprite box 3260x3260 (scale **2.6**, 1 art px ≈ 26 px) at left −1072, top −114.
- Head top at 115 (6 %H); mouth ≈ y 822 (43 %H); head width ≈ 785 px (73 % W, reference 83 %).
- The frame bottom sits at canvas y ≈ 782 (hips).
- Gesture hands enter from the frame edges, as the reference's hands did: right-side gestures appear at x ≥ 956, left-side ones at x ≤ 290, at y 1238–1446 (point y ≈ 1420).
- Captions at baseline 1377 sit on the shirt and are drawn above the sprite.

**D / W / B:** sprite hidden. No corner sprite, no picture-in-picture. The reference never shows the presenter over proof.

**No camera motion on the sprite.** There is no punch-in tween, zoom or drift: the reference's face framing was locked. The only "punch-in" is the hard cut L → F (×2.17 scale step, about the reference's ×1.74).

### 7.3 Pose selection
- Poses swap only at caption-group boundaries, at most once per group, and each pose holds at least 8 f.
- After a gesture has been held for 1.5 s, return to idle **(inferred)**.
- Never repeat the same non-idle pose twice in a row. Alternate left and right variants between consecutive gestures.

| Beat / cue (sprite visible) | Pose |
|---|---|
| f0 (pre-roll), any comma pause ≥ 3 f, end of a claim | `idle-smile` (closed) |
| First word of the video | `wave` for 6–8 f, then `idle` |
| Plain talking | `idle` with the 4-level mouth |
| Serif-emphasis value word while a card is above | `present-left` / `present-right` (palm toward the card), alternating |
| A ring, sweep or cursor event in the card | `point-left` if the target centre x < 540, else `point-right` |
| Number / stat | `present-*` on the number, then `idle-surprised` for 6–8 f as NumberPop lands |
| Question, "how", "why", "what if", "tweak", reflective lead-in ("so", "here's the thing") | `thinking` |
| Confident close ("that's it", "every time", end of a list) | `arms-crossed` |
| Pivot word on a cut into L ("inside") | `present-right` |
| ADDRESS insert (F) | `present-right` for the first 6 f (open palm), then `idle` |
| CTA scene | `idle-smile` 4–6 f on the cut → `wave` on "go/try" → `present-*` on "you/yourselves" → `point-left`/`point-right` (seeded side) from keyword lockup +0 to +1.5 s (the hand enters at y ≈ 1420, beside the "Motion" line) → `idle` → `idle-smile` for the final 8 f |

### 7.4 Mouth animation (amplitude-driven)
1. Compute the 10 ms RMS of the processed VO (normalised to −14 LUFS). Each frame's level A = max RMS within that frame's 33 ms, in dBFS.
2. A word gate is open when the frame lies within [s − 1 f, e] of any word. Outside the gate the mouth is **closed**.
3. **Idle**, inside the gate:

| Level A | Mouth |
|---|---|
| < −30 dBFS | `idle-neutral` |
| −30 to −24 | `idle-talk-small` |
| −24 to −16 | `idle-talk` |
| ≥ −16 | `idle-talk-wide` |

4. **Other poses:** `-talk` when A ≥ −27 dBFS, else `-neutral`.
5. **Hysteresis:** close only when A drops 4 dB below the open threshold.
6. **Minimum hold 2 f** (≤ 15 fps mouth, which suits pixel art).
7. Expression overrides: `idle-smile` beats closed during pauses ≥ 3 f in CLAIM scenes; `idle-surprised` for NumberPop.
8. **Implementation:** stack the pose and mouth `<img class="clip">` files used in a scene (all at the same box) and flip opacity with `tl.set(..., S(f))`. Write the frame-0 state in CSS.
   - Precompute every key in the generator.
   - The HF proof of concept classified 180/180 mouth frames correctly with this method.

### 7.5 Idle life
- `SPRITE_BOB` is stepped, not tweened:
  - split: y alternates 0 / −12 px (1 art px);
  - full-bleed: y alternates 0 / −13 px (½ art px);
  - each step lasts 24 f (0.8 s), with the phase seeded.
- Hold the bob (no step) during a gesture's first 8 f so the swap reads cleanly.
- No rotation, no blink (the glasses cover the eyes), no squash.

---

## 8. Sound design

### 8.1 Families (canonical recipes: `style/analysis/sfx_proto/synth_sfx.py`)
The engine already holds 3 takes of each family in `engine/assets/sfx/`: `riser-1..3` (0.64 s), `swell-1..3` (0.94 s), `whoosh-1..3` (0.46 s) and `tick-1..2` (0.20 s). All are 48 kHz stereo, pre-calibrated so they drop in at **0 dB (`data-volume="1"`) against a −14 LUFS voice**.

| Family | Sound | Envelope | Placement (`data-start`) | Δ vs voice |
|---|---|---|---|---|
| **A reverse riser** | 33 Hz sub + 895 Hz ring (+2685 / 4475 Hz partials) + 2–13 kHz air; exponential swell (+40 dB/s), hard stop | attack 565 ms, −20 dB in 35 ms | `(cutF − 19)/30`, so the stop lands 1 f before the cut and the cut frame is dry | −17 LU (−14.5 for the last two: +3 dB, `data-volume="1.41"`) |
| **B sub swell** | 33 + 35.5 Hz beating sub, 45–100 Hz knock, no HF | silent 0.1 s, peak at +0.34 s (10 f), gone by 0.92 s | on a cut into D/B: `cutF/30`. For a mid-shot camera move: `(peakVelocityF − 10)/30` | −14 LU |
| **W whoosh** | 47–62 Hz body + 5.6–7.4 kHz air, rise then fall | air peak at +0.28 s (8 f) | first frame of a graphic fly-in | −13.5 LU |
| **T double tick** | 2 broadband 10 ms ticks, 40 ms apart, ring at 2.2 / 3.2 kHz | 170 ms | the CTA keyword's first frame (lockup +9 f) | −19 LU |

### 8.2 Placement rules
1. **Section cut** (the layout class changes and the old shot is done): riser A into it. In the reference, 5 of 10 cuts.
2. **Cut into D or B** (ZoomSettle), or any big in-shot camera move (scroll, pan, zoom, carousel): sub swell B.
3. **Both apply:** chain A → B across the cut. This "suck-in, whomp" pair is the signature (2.867 s).
4. **Graphic fly-in on a fresh scene** (headline at f0, W label box, NumberPop): whoosh W.
5. **CTA keyword:** tick T, once per video.
6. **Video open:** A + W at f0. **Video end:** A (+3 dB) with its stop on the final frame.
7. **No SFX** for:
   - caption words (≈ 4/s);
   - glitch or stretch entrances;
   - cursor moves and implied clicks;
   - rings and sweeps;
   - odometer ticks beyond the initial W;
   - in-place content swaps;
   - a cut from W into L in mid-phrase.
8. **Density.**
   - Target 0.5–0.6 SFX/s, median gap about 1.7 s, never more than 4.5 s without one.
   - At most 2 overlapping, and only at f0.
   - About 36 % of runtime has an SFX sounding.
9. **Take rotation.** Choose the take with the seeded PRNG and never use the same take twice in a row within a family.
10. **Mono safety.** Use the mono-safe riser. The reference's riser was printed anti-phase and vanishes in a mono fold-down; `reverse_riser_faithful_antiphase.wav` exists only for comparison.

### 8.3 Mix
| Element | Target |
|---|---|
| Voice | −14 LUFS integrated, ≤ −1.0 dBTP, LRA 2–3 LU, dry, centre mono |
| Music bed | −38 to −40 LUFS (23–26 LU under the voice), constant: **no ducking, no fades**. It starts at f0 and stops on the last sample |
| SFX | Calibrated files at `data-volume="1"` (+3 dB = 1.41 for the last two risers) |
| Final check | `npx hyperframes audio renders/out.mp4 --only loudness --json` reads −14 ± 0.5 LUFS integrated with no clipping |

Most SFX energy is below 60 Hz, so on phone speakers only the riser ring and air and the whoosh air are audible. That is intended: the sound should be felt, not noticed.

### 8.4 Music bed
- **Reference:** a beatless, very wide ambient synth pad (sine voices plus a weak 2nd/3rd harmonic, low-passed at 1.8 kHz, ±4 cent L/R detune). Progression **Em – G – C – Em – G – C – Em**, with changes at 6.6, 9.9, 14.3, 16.5, 19.7 and 26.1 s (irregular 2.2–6.4 s segments), and a faint high melody at 0.75–2.25 s.
- **Recipe:** `synth_sfx.py` → `music_bed_reference_timeline.wav` (−41 dBFS RMS per channel ≈ −38.5 LUFS).
- **Generation:**
  - Pick a progression of the form i–III–VI (minor) from the variety set (§9).
  - Place chord changes on scene cuts nearest to every 3–5 s (0.6 s linear crossfades).
  - Keep one sustained chord for the CTA scene.

---

## 9. Variety system

**Principle:** the grammar, tokens, eases, sizes and positions are **fixed**. Variety comes only from seeded choices among on-style alternatives, plus the content itself.

**Seeding:**
- `seed = fnv1a32(normalised transcript text + "|" + channelSalt + "|" + videoIndex)`.
- Every random draw uses `mulberry32(seed ^ fnv1a32(<knob name> + <scene index>))`, so each knob is independent and stable.
- Store the knobs a video used in `history.json` (the last 5 videos) to enforce cross-video rotation.

### 9.1 Per-video knobs (cross-video rule: differ from the previous video; music also from the one before)
| Knob | Allowed values / bounds | Default (reference) |
|---|---|---|
| Leaf gobo pattern | palm, monstera, fern, window-blinds, ficus | palm |
| Gobo placement | top-left + right-mid (ref) / top-right + left-mid (mirrored) | ref |
| Light-plate gradient angle | 50–70° | 60° |
| Plate warm/cool endpoints | ±3 levels per channel | ref |
| Grain seed | any | — |
| Sprite room plate | door-left, door-right, window, shelf, plant (pixel-art, wall `--panel-room` ±4 levels) | door |
| Music progression | Em–G–C, Am–C–F, Dm–F–B♭, Bm–D–G, F♯m–A–D, Cm–E♭–A♭ | Em–G–C |
| ZoomSettle start scale | 1.13–1.17 | 1.15 |
| ZoomSettle duration | 33–38 f | 35.5 f |
| Beam phase per card | 0–360° | — |
| Accent theme | **Fixed per channel, never rotated per video** (brand consistency). Azure is the default. Optional alternates, contrast-checked against #E4E8EC: Violet `#7C3AED`/text `#6D28D9`/soft `#C4B5FD`; Emerald `#059669`/`#047857`/`#6EE7B7`; Ember `#E8590C`/`#C2410C`/`#FFB38A`; Rose `#D6336C`/`#BE185D`/`#F9A8C9`; Teal `#0E7490` (box and text)/`#7DD3E8`. Derive ring, select and beam from the accent hue at the reference's lightness offsets | Azure |

### 9.2 Per-scene knobs (within-video rotation)
| Knob | Rule |
|---|---|
| Layout sequence | Fully determined by §6. Ties (e.g. which CLAIM clause gets promoted to D under C5) are broken by the seeded draw |
| Dark tint | From the media (deterministic); neutral if ambiguous |
| CamMove type | scroll / pan / zoom: never the same type in two consecutive moves |
| Zoom factor | 1.5–2.0; pan distance 300–633 px; scroll 300–375 px |
| SelectionSweep vs ring for ambiguous echoes | Seeded, but a ring after 2 sweeps in a row is forced |
| Cursor arc side | ± seeded; bulge 7–11 % of the distance |
| Glitch slice offsets | Seeded signs and magnitudes (±40 %); opacity sequence fixed |
| Special entrance where both GLITCH and STRETCH are allowed (punch words outside lists) | Alternate. Never the same special entrance in two consecutive groups outside lists. At most 1 special per 2 s outside lists |
| Sprite gesture side | Alternate L/R from a seeded start; obey the target-side rule when a target exists |
| Bob phase | Seeded per scene |
| SFX takes | Seeded, never repeating within a family back-to-back |
| CTA pointing side | Seeded |

### 9.3 Never vary
- Fonts, sizes, weights and tracking.
- Caption positions and the one-line rule.
- Hard cuts.
- Every ease and duration in §4 except the two ZoomSettle bounds above.
- No overshoot, no drift.
- Beam speed (8.1 s per lap).
- SFX levels and mix.
- Presenter visibility per layout.

**Distinctness check.** Build a fingerprint per video: the layout sequence, the sequence of B-roll asset types, the sequence of CamMove types, and the first 12 sprite poses. If its normalised Hamming distance to any of the last 3 videos is below 0.35, re-draw the tie-break knobs with `seed+1` (up to 3 times). Content-driven elements are never changed to force variety.

---

## 10. HyperFrames implementation notes (from `hyperframes_guide.md`, verified unless marked)

### 10.1 Toolchain
- `hyperframes@0.8.185`.
- Node ≥ 22.
- `chrome-headless-shell` (`npx hyperframes browser ensure`).
- FFmpeg **≥ 6 with libx264**. `@ffmpeg-installer/ffmpeg` (4.4) **fails the audio mix**. Ship `ffmpeg-static@5.3.0`, copied into `.hyperframes/bin/ffmpeg`.
- FFprobe from `@ffprobe-installer/ffprobe` (auto-found).
- Set `HYPERFRAMES_NO_TELEMETRY=1` and `HYPERFRAMES_SKIP_SKILLS=1`. Without them, `init` and `skills update` install skills globally.
- Ship the skills project-locally in `.claude/skills/` (`npx skills add … --agent claude-code --copy`, without `-g`).

### 10.2 Composition contract
- Root `index.html` has `#root[data-composition-id][data-duration][data-width=1080][data-height=1920]`. It holds only the background, the scene hosts and `<audio>`.
- Each layer is a sub-composition in `compositions/<id>.html` wrapped in `<template>`.
- The **host id, the scene-root `data-composition-id` and the `window.__timelines` key must be identical**. Otherwise you get a 45 s stall and static frames.
- Register the timeline **last** (after any async font load). The timeline is created with `{paused:true}`.
- **Never** `add()` a scene timeline to the root timeline. **Never** call `play()` or `pause()`.
- Sub-compositions inherit GSAP from the root. Vendor `gsap.min.js` **and `CustomEase.min.js`**; both are already in `engine/assets/vendor/`. Do not use a CDN.
- IDs must be unique across the assembled page, so prefix them (`s07-cap-g3-w2`).
- Asset paths are root-relative, even inside `compositions/`.
- Paint order is CSS `z-index`; `data-track-index` is only a Studio lane.
- **Exactly one** host carries `data-track-kind="captions"`.

### 10.3 Timing and determinism
- **Frame grid:** keep integer frames in the data. Tweens go at `f/30`; instant `set`s go at `(f − 0.5)/30`. Rounding times to 4 decimals made sets fire 1 f late.
- Write frame-0 states in CSS: a `tl.set` at exactly 0 may not render.
- `.clip` elements are visible over `[data-start, data-start + data-duration)`. Use them for caption groups and pose/mouth images instead of exit tweens. Give **every** `<img>` an explicit `data-start` and `data-duration` (otherwise it is treated as a 3 s clip).
- Use `fromTo` everywhere: `from` drifts on seek-back.
- Never tween `display`, `visibility` or `autoAlpha` on a `.clip`.
- Do not put start transforms in CSS `transform` (lint `gsap_css_transform_conflict`). Put them in the tween's `from`.
- **Banned:**
  - `Math.random()` without a seed (use mulberry32);
  - `Date.now()`;
  - rAF or timer clocks;
  - fetches during render;
  - **`repeat:-1`** (the border beam is one finite linear tween over the scene duration).
- Precompute per-frame values in the generator for cursor arcs, multi-line sweeps, odometers, glitches, mouth/pose swaps, bob steps and velocity-driven motion blur, and emit `tl.set`s. This is exact and seek-safe.

### 10.4 Media
- **VO:** `<audio id="vo" src="assets/vo.wav" data-start="0" data-media-start="0" data-duration="<len>" data-volume="1">`. Every `<audio>` needs an `id`. Use `data-media-start` for trims (the mixer reads only that name).
- Clamp the root `data-duration` to the VO length (ffprobe). An overrun renders black.
- **SFX:** one `<audio>` per placement with `data-start` on the frame grid and `data-duration` equal to the file length.
- **Video B-roll:** `<video class="clip" muted playsinline data-media-start>`. Time either the video or its wrapper, not both. Animate wrappers, not the media box. Re-encode with `-g 30` so seeking does not freeze.
- **Blur on footage:** the guide says grades and blur on `<video>` should go through `npx hyperframes media-treatment` rather than CSS filters **[docs]**. So:
  - pre-render the blurred dark backgrounds as images;
  - prefer screenshots (`<img>`) or pre-blurred clips for MediaBlurSwap and PreCutExit;
  - CSS `filter: blur()` on text and images is verified fine.
- **Sprite:** use the same box for every pose. Add `image-rendering:pixelated` and `data-layout-allow-overflow` on the oversize rig (otherwise `check` reports `escaped_container`).

### 10.5 Fonts
- Inter, EB Garamond and Playfair Display resolve by name, but the first compile fetches them from Google Fonts.
- **Ship local woff2 with `@font-face`** in the file that uses them, so renders are offline and deterministic. Any unlisted family fails lint.
- `await document.fonts.load(...)` before measuring text, then register the timeline.
- For stats in a serif, use `font-variant-numeric: lining-nums`. Playfair has old-style digits.

### 10.6 Checks and pitfalls
- `npx hyperframes check --json` must report 0 errors. Expected warnings:
  - `timeline_track_too_dense` on captions;
  - `text_below_floor` for chrome/URL text (mark it `data-layout-ignore`, or use ≥ 28 px);
  - `contrast_aa_failure` if the accent text drops under 3:1 (#0C82F0 on the cool corner #CCDCE6 is 2.73:1; use #0A78E2 there).
- `npx hyperframes snapshot --at <beat midpoints>` and read the PNGs.
- Render with `npx hyperframes render --quality looks --fps 30 --output renders/<slug>.mp4`. Always pass `--output`. Measured: 30 s at 1080x1920 renders in about 26 s on an M3 Pro.
- Verify with ffprobe (`nb_frames` = duration × 30, both streams), with frame-exact extraction (`select=eq(n\,F)`), and with the mouth-crop check.
- `hyperframes transcribe` **rewrites `const script=[…]` / `const TRANSCRIPT=[…]`** in every `.html` under `--dir`. Never use those names, and transcribe into `work/`.
- `preview` needs `--no-open` in agent runs, and the URL needs a `#project/<dir>` hash.
- The project `CLAUDE.md` should override the skills' "preview, then wait for approval" loop: render when the user asks for the video.

---

## Appendix A: conflicts between reports and how I resolved them

| Topic | Claims | Resolution (measured or by best method) |
|---|---|---|
| Sprite/face panel corner radius | 25–28 (seg1), 45–50 (seg3), 70–75 squircle (seg4), 88 (seg2, typography) | **I measured** insets on f30/f300/f450/f600: 84/66/52/36/26/18/12/8/6/4/2/0 px at dy 2…110 [720]. That is a large continuous corner. Use **88 [720] = 132 px** (squircle-like tail) |
| Browser card radius | 8–18 | **I measured** f400: insets 18/10/6/4/2/0 including the glow, so r ≈ 14 [720] → **21 px** |
| Light-plate grain | animated (seg2, seg3) vs static (seg1, seg4, typography) | **I measured** high-pass σ 2.3–3.1 against frame-diff σ 0.7–0.9 → **static** (the diffs were codec noise) |
| Blank frame colour | #FDFDFD (seg1, seg2, typography) vs #FFFFFF (motion_curves) | **I measured** f196–200 = 253,253,253, σ 0.01 → **#FDFDFD** |
| Zoom-settle ease | (.35,0,0,1) 37 f (seg1, seg2); (.40,0,.04,.90) 33 f (seg4); power3.out (typography); (.32,.06,0,1) 35.5 f (motion_curves, SIFT) | **I refit** the SIFT series: (.32,.06,0,1) rmse 0.00030 @ 35.5 f from the cut; (.35,0,0,1) 0.00035; (.40,0,.04,.90) 0.00048; expo.out 0.0027; power3.out 0.0034. **(.32,.06,0,1), 1.183 s** |
| Card pop | power4.out 23 f (seg1); power3.out 16 f (seg2); power3.out 20 f from .905 (motion_curves) | The SIFT series agrees with seg1's widths (.946/.958/.967/.975/.981/.986). **power3.out 20 f from .905** |
| Headline box wipe | power4.out 16 f (typography); expo.out 21–22 f (seg1, seg2, motion_curves). Typography also said the W wipe was a faster 4–5 f | motion_curves rmse: expo.out 3.9 px vs power4.out 4.9. The opening and W wipes normalise identically (seg2 widths 16 → 316 over 15 f). **expo.out 21.75 f for both** |
| Glitch usage | brand "Claude" only (typography, motion_curves) vs also list heads launch/product/mobile (seg3) | **I viewed** f419–430 and f473–484: RGB split, flicker, slice and skew on "launch" and "mobile". **Glitch = brand + list heads + first word** |
| "230" / "recreate" entrance | uniform scale 1.2 → 1 (typography); recreate width growing (seg4) | **I measured** bboxes: 230 left 409–414 fixed, height constant, right 542 → 522; recreate left 237–240 fixed, right 565 → 485. **scaleX stretch about the left edge** for both, same as demos (261 fixed, 498 → 461) |
| CTA "Motion" flicker depth | OFF at 829 (motion_curves, bright-pixel count) vs .43 (seg5, luminance) | **I viewed** f826–834: 829 and 831 are dimmed and blurred, not off. **[.25 blur, 1 + bloom, .45 blur, 1, .6, 1]** |
| *comment* settle | scale circ.out 0.82 s (motion_curves) vs scaleX power3.out 20 f, height constant (seg5) | Height constant (seg5's rows 878–923), so **scaleX**. power3.out 20 f is used; circ.out 0.82 s is an equivalent-looking alternative |
| Carousel pitch | 806 px (seg4) vs 767 px (motion_curves) | **I measured** border segments at f541–552. The edge gap is 180–190 px [720] after blur correction → **card width + 270 px at 1080 (112 % W)**. The incoming card is 601–604 px wide mid-slide (see 5.14) |
| Border beams on compare cards | static streaks (seg4, seg5) | **I measured** border-core luminance on f665–705: no travelling highlight → **no beam on B cards**. Beam confirmed on the L card: the right-edge run moves 180 → 297 px over f430–442 (9.75 px/f) |
| Ring style | stroke 3–5, radius 8–20, colour #128BF6 / #138DF1 / #0a8bf5 / #178CEC, start top-right vs top-left | **I measured** f262/365/410: stroke **4 px [720]**, corner inset 16–18 → r ≈ 16 [720] → **24 px**, median colour (15,138,246) → **#0F8AF6**. Start: top-left clockwise (seg3, motion_curves, by angular coverage) |
| SFX present? | none (seg1, mono `audio.wav`; seg4) vs 17 placements (audio_sfx, stereo M/S) | **I checked** the side channel of `ref_stereo.wav`: 25–45 Hz peaks at f16, 81, 191, 375, 550, 778, 895 (risers) and f96, 156, 333, 498, 593, 639 (swells), plus the 895 Hz ring before each riser stop. **audio_sfx is correct.** The riser is anti-phase, so it cancels in the mono fold-down seg1 analysed |
| Caption entrance | 3 f (seg1, seg4, seg5) to 6 f (seg3); y +4…+8 [720]; blur 4–8 | Ink-integral (blur-invariant) measurements .43/.65/.85/.93/.97/1 (seg3, motion_curves) fit **power3.out 5.7 f from onset−1, y +7 [720] (+10 at 1080), blur 4 [720] (6 at 1080)**. seg5's "77 % on first frame" was peak luminance, which saturates |
| Caption sync | loose −7…+10 (seg3), front-loaded 7–11 in the CTA (seg5), median +1 (seg1, typography) | The pipeline uses forced-alignment onsets: **visible on onsetF**, emphasis-with-echo up to −4 f, CTA −8/−9 f |
| D-layout card "scale-in" | card animation (typography) vs whole-stage zoom (seg1, seg2, motion_curves) | SIFT fixed point at the frame centre, and the background and caption scale too → **whole-stage ZoomSettle** |
| Serif font | Playfair (seg2, seg4), DM Serif (seg5), ITC Garamond Bold Condensed Italic (typography) | Typography's glyph evidence (in-curled `h`) plus the `fonttest/cmp.png` comparison → **EB Garamond Italic 800** |

## Appendix B: files
- Reports: `style/analysis/{seg1..seg5,typography_layout,audio_sfx,motion_curves,hyperframes_guide}.md`
- SFX recipes and validation: `style/analysis/sfx_proto/` (`synth_sfx.py`, `validation.json`, `*.wav`)
- My spot-check scripts and crops: `scratchpad/work/bible/` (`chk1–7.py`, `fit.py`, `sprite_*.py`, `g_launch.png`, `g_mobile.png`, `cta.png`, `face_cap.png`)
- Engine assets already in place: `engine/assets/{fonts,sfx,vendor}`
- Sprite pack: `kyle-sprite-pack/characters/*.png`
