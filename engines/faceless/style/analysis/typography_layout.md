# Reference video: typography, layout and colour system

Source: `Ref Video For Editing Style.mp4`, 720x1280, 30 fps, 897 frames. Frame index `i` means file `f_{i+1:04d}.png`, and time = i/30 s.
Every number here was measured in Python (numpy/OpenCV) on full-resolution frames unless it is marked **(est.)** or **(visual)**.
Positions are given as px at 720x1280, then % of W/H, then the value scaled ×1.5 for a 1080x1920 HyperFrames composition (written `→1080: N`).
Scripts and crops are in `scratchpad/work/typo/` (`py/*.py`, `z_*.png`).

---

## 0. Layout timeline (the backbone everything else hangs on)

| # | Code | Frames | Seconds | Layout | Caption baseline y |
|---|------|--------|---------|--------|--------------------|
| 1 | L1 | 0–85 | 0.00–2.83 | Light split + **headline** (narrow browser card) + face panel | 719 |
| 2 | D1 | 86–195 | 2.87–6.50 | Dark, one tall browser card (scale-in) | 985 |
| 3 | W1 | 196–235 | 6.53–7.83 | Pure-white title card: blue "It's Called" box + browser card | 826 |
| 4 | L2 | 236–322 | 7.87–10.73 | Light split (wide card) + face panel | 724–726 |
| 5 | D2 | 323–377 | 10.77–12.57 | Dark, one tall browser card (scale-in) | 981 |
| 6 | L3 | 378–552 | 12.60–18.40 | Light split (wide card) + face panel | 713–714 |
| 7 | F1 | 553–583 | 18.43–19.43 | Full-bleed face (no UI) | 918 |
| 8 | L4 | 584–628 | 19.47–20.93 | Light split (wide card) + face panel | 714 |
| 9 | B1 | 629–779 | 20.97–25.97 | Dark navy, **two stacked comparison cards** | 994–1000 |
| 10 | F2 | 780–896 | 26.00–29.87 | Full-bleed face + CTA stack, held to the end | 918 (CTA 1000) |

Layout changes are hard cuts on a scene-detector hit. The order is light, dark, white, light, dark, light, face, light, dark, face. The rhythm alternates light and dark about every 2–5 s, and the face goes full-bleed twice, both times in the last 40 % of the video.

---

## 1. Caption system

### 1.1 Fonts (fitted by IoU against rendered candidates)

Method: I binarised each word, rendered candidate fonts with a tracking search from −0.08 to +0.05 em, and compared them by intersection-over-union (IoU) after scaling to the same height. Only fonts installed locally could be rendered.

| Role | Best match (IoU) | Other candidates | Glyphs that decided it |
|---|---|---|---|
| **Regular caption sans** (`walkthroughs`, `product videos`, `prompts`, `inside`) | **Inter** (variable font, opsz 24, wght 650), tracking −0.02 to −0.03 em: mean IoU **0.902**. On `inside` it scores 0.95 | Inter opsz 32 wght 700 (0.892); SF Pro Display Semibold (0.825); Helvetica Neue Bold (0.796) | Double-storey `a` with a straight stem, single-storey `g` with a flat-cut tail, `t` with a slanted cut top, the tall x-height (x/asc = 0.73), and an `r` with a short horizontal arm. Helvetica's curled `a`/`t` terminals and SF's narrower `s` both lose. |
| **Headline sans** ("Claude Can Now Make") | **Inter opsz 24 wght 650, −0.03 em: IoU 0.945** (Claude 0.95, Can 0.95, Now 0.97, Make 0.92) | Inter opsz 28 wght 700 (0.942); Helvetica Neue Bold −0.05 em (0.882); SF Pro Display Bold (0.864) | Same family as the captions. The `C` has horizontal terminals; `M` has vertical sides and its vertex sits on the baseline. |
| **Italic emphasis serif** (`motion graphics`, `professional`, `library`…) | **No local font matched**. Best local IoU was Playfair Display Italic 700–800 at 0.58–0.61, which is poor | **Visual identification:** ITC Garamond **Bold Condensed Italic** (the "Apple Garamond" look; commercial). Closest Google Fonts: **EB Garamond Italic 700/800** and **Cormorant Garamond Bold Italic**, both with the incurved italic `h`. Best measurable free fallback: **Playfair Display Italic 700** at −0.02 em | The italic `h` has a leg that curls inward, so it reads almost like a `b` ("grap**h**ics"). Also: a double-storey `g` with an ear, a teardrop `a`, a fairly condensed set, and moderate contrast. Playfair and DM Serif have an open `h` leg, which is why their IoU stays low. |
| **Highlighted headline** (white text in the blue box: "Motion Graphics", "It's Called") | The same serif as the caption emphasis (white) | as above | Same `h`, `G` and `p` construction as the caption serif. |
| **Number / verb emphasis sans** (`230`, `recreate`) | The caption Inter in blue. `recreate` fits Inter opsz 14 wght 700 at IoU 0.85 | Inter opsz 24 wght 800 (0.81) | Same skeleton as the caption sans. Only the colour and the entrance change. |
| **CTA keyword** (`“Motion”`) | **(visual)** Inter ExtraBold/Black, curly quotes | SF Pro Display Heavy | Same `M`/`t`/`n` construction, heavier stems. |

Recommendation for HyperFrames: Inter (variable, with an opsz axis) for every sans role. For the serif, use **EB Garamond Italic 800** sized by x-height, with Playfair Display Italic 700 as the fallback. If you can license ITC Garamond Std Bold Condensed Italic, it is the closest match.

### 1.2 Metrics (subpixel edge measurements, 50 % coverage)

| Element | Ascender / cap (px) | x-height (px) | Desc. (px) | Font-size equivalent @720 | →1080 |
|---|---|---|---|---|---|
| Caption sans (L/F layouts) | 49.1–49.9 (`l`, `k`, `h`) | 35.3–36.3 | 14 | **68 px** (Inter asc 0.728 em) | **102 px** |
| Caption sans (D/W layouts) | 51.1–51.4 | 37.2–37.6 | 14 | 70 px (about +3 %) | 105 px |
| Caption serif italic (`motion graphics` f60) | ≈47 (`h`, `t`) | ≈32 | ≈16 | Size to x-height 32 px (Playfair It 700: 60 px; EB Garamond: size to match) | x-height 48 px (Playfair ≈ 90 px) |
| Headline sans (f60) | cap 41.5 (N/M: 143.8→185.4), `l` 41.6 | 30.3 (`n`, `a`, `u`: 155→185.4) | – | **57 px** (Inter cap 0.727 em) | **86 px** |
| Headline box serif (f60) | `M` cap 48 (228→276), `h` 52 | 34 (242→276) | 15 | Playfair It 700 ≈ 68 px | ≈ 102 px |
| CTA `“Motion”` (f860) | glyph block 69 px tall (931→1000, quotes included) | – | – | ≈ 90 px (est.) | ≈ 135 px |
| Number pop `230` (f280) | figures 76 px (462→537) | – | – | ≈ 104 px | ≈ 156 px |

- **Weight:** sans 650 (between SemiBold and Bold; 600 and 700 both fit worse). Serif: Bold. CTA: 800–900.
- **Letter-spacing:** captions −0.02 to −0.03 em with opsz 24, or −0.015 em with opsz 32. Headline −0.03 em. Serif about −0.02 em.
- **Word spacing:** natural. For example, headline `Claude`→`Can` gap is 17 px at 57 px (0.30 em).
- **Case:** captions are **lowercase** except proper nouns (`Claude`, `Prompt Motion`). Sentence-initial words are lowercased: "So go try" becomes `so go try`, "Inside" becomes `inside`, "Just copy" becomes `just copy`. **All punctuation is stripped.** The headline uses Title Case.

### 1.3 Colours (eroded glyph cores, median)

| State / context | Hex | Notes |
|---|---|---|
| Caption ink on light layouts | **#111214** | Headline ink is identical (#111214). |
| Caption ink on dark layouts (D1/D2/B1) | **#EEF4FB** | A cool off-white. On navy it measures #E9F2FC. |
| Caption ink on the full-bleed face (F1/F2) | **#FDFAF5** | Effectively white. |
| Serif emphasis on light | **#0C82F0** (range #0C82F0–#1183F0 over 5 words) | No vertical gradient (top and bottom differ by < 3/255). |
| Serif emphasis on dark grey/brown and navy | **#82C1F5** (`library` #81C0F4, `best ones` #82C1F5, `prompt` #84BEEF, `style` #83C2F6) | A lighter tint of the same blue. |
| Serif emphasis, white variant (B1 `animations`, `sound effects`) | **#E9F2FC** | Used for the closing "the same X / the same Y" pair. |
| CTA serif `comment` | Vertical gradient **#FFFAF0 → #D0CAC5** | A white-to-silver gradient. |
| Blue sans emphasis on light (`230`) | **#0582F5** | |
| Blue sans emphasis on navy (`recreate`) | **#2C99F7** | Brighter, for contrast on navy. |
| CTA `“Motion”` | Vertical gradient **#E1F5FD (top) → #64B4F9 (bottom)** | Blue glow underneath (see 1.4). |
| "Dim" grey | **Not a held state.** Greys such as #989A9D are frames 1–2 of the fade-in | See 1.6. |

### 1.4 Stroke, shadow, glow (luminance of rings 2–22 px outside the glyph mask)

- **Light layouts:** no stroke. Black text has a very faint dark halo: luma is 226.8 at 4 px, 230.8 at 6 px and 236.6 at 22 px (bg). That is consistent with `0 2px 10px rgba(0,0,0,.08)` **(est.)** and you can leave it out.
- **Dark layouts:** a subtle shadow. D1: 61.9 at 4 px against 76.3 at 22 px. B1: 10.3 against 15.0. Use about `0 2px 12px rgba(0,0,0,.35)`.
- **Face layouts:** a clear soft shadow. F2: 81.9 at 4 px against 106 at 22 px. F1: 75 against 88. Use `0 2px 14px rgba(0,0,0,.45)`.
- **CTA `comment`:** a strong shadow, 71.9 at 4 px against 111 at 22 px, so about `0 3px 18px rgba(0,0,0,.6)`.
- **CTA `“Motion”`:** a dark shadow plus a **blue glow**. Rows 980–998 under the word read #2C3D5E→#25375D, against #0C1014 shirt further down. The halo extends about 30–40 px below, so use `0 0 36px rgba(40,100,220,.55)` combined with a dark drop shadow.
- None of the text has an outline stroke.

### 1.5 Position and alignment

- **Horizontally centred as a group.** The whole group's final width is centred on x = 360, and **words then appear in place, left to right, without re-centring**. Example: at f45 `motion` alone spans 160–325 (cx 242). At f57 `motion graphics` spans 152–567 (cx 360). Same pattern for `brand` → `brand or product` (f604–614) and `for your` → `for your own`.
- **Always one line.** The widest groups measured are `the one you like` at 120–600 (480 px, 67 % W), `brand or product` at 124–599, and `product videos` / `Prompt Motion` at 134–588. Lines never exceed about 67 % of the width, which leaves side margins of at least 120 px (16.7 %).
- **Baseline by layout:**
  - Light split: **714** (55.8 %H). L1 sits at 719 and L2 at 724–726. The caption is centred vertically in the gap between the card bottom (623) and the top of the cut-out head (~750), so the caption's vertical centre is about 688.
  - Dark: **985** (77.0 %H). The caption hangs 68–73 px under the card bottom and **rides with the card's scale-in**: in D1 the caption top goes 952→935 between f96 and f114 while the card bottom goes 879→867.
  - White title card: **826** (64.5 %H), 43 px under the card.
  - Full-bleed face: **918** (71.7 %H), across the chest.
  - CTA stack: `comment` occupies 879–929; `“Motion”` occupies 931–1000.
  - At 1080 these become 1071 / 1478 / 1239 / 1377.

### 1.6 Word-state lifecycle (measured per frame)

There is **no "upcoming grey" state**. A word is invisible until it is spoken, then it fades and sharpens in over 4–5 frames. The grey seen in contact sheets is only that ramp.

`build` (L1), coverage = (bg − ink) / (bg − final), with Laplacian sharpness alongside:

| f13 | f14 | f15 | f16 | f17 | f18 |
|---|---|---|---|---|---|
| 0 | 0.34 (#989A9D, sharp 6.5) | 0.60 (#656768, 19.9) | 0.80 (40.3) | 0.90 (41.2) | 1.00 (#101214, 44.5) |

The bbox top moves 673→670, so the word rises 3 px.

`Motion` on W1 (f214–221): coverage 0.19, 0.45, 0.71, 0.90, 0.94, 0.98, 0.99. The top moves 789→774 (15 px rise), stepping 15, 8, 5, 3, 2, 1, 0 px.
Other words measured: `prompts` rises 672→668, `together` 940→935, `exactly` 936→933, `actually` 952→946, `inside` 664→662.

**Recipe** for a normal word (at 1080):
- `opacity 0→1` over 4–5 frames (130–170 ms), power1.out.
- `filter: blur(8px→0)` over about 3 frames (100 ms). Sharpness reaches its plateau 2–3 frames after the first visible frame.
- `y: +8px→0` (+6 to +9; up to +22 px on title-card words), **power3.out**, 6–7 frames (≈ 220 ms). The rise reaches about 50 % after the first frame, which is close to power3.out or expo.out.
- **Sync:** the first visible frame lands from −2 to +3 frames of the whisper word start (median ≈ +1 frame). Two outliers, `230` and `recreate`, land +6 and +7 frames late.
- **Exit:** the whole group **hard-cuts out** on the frame the next group's first word appears. Usually there are 0 blank frames, sometimes 1 (f106, f147, f655, f719…). Nothing fades out.

**Emphasis-word variants** of the entrance:
- **Serif emphasis** (`professional` f27–30, `library` f126–129): the same blur/fade/rise. The colour goes from a desaturated #A0B4E7 to #2885F2 over 4 frames. Rise is 4–6 px.
- **Blue sans number/verb** (`230` f253–257, `recreate` f656–660): a **scale-down landing**. Width goes 149→121 px (`230`, scale 1.23→1.0) and 293→261 (`recreate`, 1.12→1.0) over 5 frames, with heavy blur at the start (sharpness 3→25). Use `scale 1.2→1`, `blur 12→0`, power3.out, 170 ms.
- **Brand name glitch** (`Claude`: f1–4, f304–309, f632–638): an **RGB-split glitch for 6–7 frames (≈ 220 ms)**, then plain text. The blue/violet ghost is #708EE2 on light and #448CD6 on dark, about 8 px left and 2 px up. The red/salmon ghost is #D2858A on light and #B95965 on dark, about 4 px right and 3 px down. Horizontal slice jitter doubles letters (`Claude` shows a doubled "uu"). The ghost alternates between frames: on f305 and f633 it is absent (flicker).
- **CTA flicker-on** (`“Motion”` f828–832): brightness alternates on (#9BC9F3), off (#758A9E), on, off, on, then holds from f832. It also rises 10 px (944→934). When it lands, `comment` (alone at f818, 193–553 × 879–936) shrinks to about 0.89× and stacks above it.

### 1.7 Grouping rules (≈ 55 groups in 30 s)

Observed groups, by first-word frame (`*` = serif emphasis, `#` = blue sans, `G` = glitch):
L1: `Claude`G `can`, `now build`, `full professional*`, `motion* graphics*`, `from scratch`.
D1: `and somebody`, `just put`, `together`, `a whole library*`, `showing`, `exactly`, `how to create`, `the best* ones*`.
W1: (box `It's Called`) + `Prompt Motion`.
L2: `and it`, `is over 230#`, `animated* videos`, `made with`, `Claude`G.
D2: `each with`, `the exact prompt*`, `used to`, `create it`.
L3: `inside`, `you'll get`, `prompts`, `for all`, `launch videos`, `product videos`, `demos`, `mobile app`, `walkthroughs`, `all charts`, `and much more*`. The middle L3 group boundaries come from mask-change events and were not each checked visually.
F1: `just copy`, `the one you like`.
L4: `tweak it`, `for your own`, `brand* or product*`.
B1: `and Claude`G `will`, `actually`, `recreate#`, `what you want`, `in that exact`, `style* with`, `the same`, `animations*`(white), `and the same`, `sound* effects*`(white).
F2: `so go try`, `it yourselves`, `comment*` over `“Motion”` (CTA, held from 27.7 s to the end; the rest of the speech is not captioned).

Rules:
- **1–4 words per group** (mean ≈ 2; max 4, `the one you like`).
- Group duration 0.25–0.9 s.
- **Breaks follow phrase boundaries**: never mid-noun-phrase, and articles stay with their noun.
- **A stand-alone key word gets its own group** (`together`, `exactly`, `showing`, `prompts`, `walkthroughs`, `actually`, `recreate`).
- The emphasis word is usually **the last word of the group**.

---

## 2. Emphasis inventory and selection rule

| t (s) | Frame | Word(s) | Style |
|---|---|---|---|
| 0.00 | 1 | Claude | RGB glitch (brand) |
| 0.90 | 27 | professional | serif blue |
| 1.50 | 45 | motion graphics | serif blue |
| 0.16–2.83 | 5–85 | **Headline box "Motion Graphics"** | white serif on blue box |
| 4.20 | 126 | library | serif light-blue (dark) |
| 5.93 | 178 | best ones | serif light-blue |
| 6.70 | 201 | **"It's Called" box** | white serif on blue box |
| 8.43 | 253 | 230 | blue sans + scale landing (+ number pop card) |
| 8.93 | 268 | animated | serif blue |
| 10.13 | 304 | Claude | RGB glitch |
| 11.43 | 343 | prompt | serif light-blue |
| 18.00 | 540 | more | serif blue |
| 20.13 / 20.47 | 604 / 614 | brand / product | serif blue (`or` stays plain sans) |
| 21.07 | 632 | Claude | RGB glitch |
| 21.87 | 656 | recreate | blue sans #2C99F7 + scale landing |
| 23.47 | 704 | style | serif light-blue |
| 24.33 | 730 | animations | serif **white** |
| 25.23 | 757 | sound effects | serif **white** |
| 27.27 | 818 | comment | serif white→silver, heavy shadow |
| 27.60 | 828 | “Motion” | CTA gradient sans + glow + flicker |

**Inferred selection rule:**
1. **Serif italic** marks the payoff noun or adjective phrase: the quality or category of the thing (`professional`, `motion graphics`, `library`, `best ones`, `animated`, `prompt`, `more`, `brand`/`product`, `style`, `animations`, `sound effects`). It is never used on a function word, a pronoun or a verb.
2. **Blue sans with a scale-in landing** marks **numbers** (`230`) and **the single promise verb** (`recreate`).
3. **Glitch** marks the **AI/brand name** (`Claude`), every time it appears.
4. **The setup phrase of a reveal** goes into the **headline box** (`Claude Can Now Make / Motion Graphics`, `It's Called`) and the payoff (`Prompt Motion`) goes in the caption.
5. **The CTA keyword** gets the biggest treatment: a gradient sans in quotes with a glow and flicker. The CTA verb gets the serif.

Density: 14 emphasis events in 30 s (≈ one every 2.1 s), about 1 in 4 groups, and **at most one emphasis style per group**. The colour follows the background: blue #0C82F0 on light, light blue #82C1F5 on dark, white on navy for the final parallel pair.

---

## 3. Headline system

**L1 headline:**
- **Line 1:** "Claude Can Now Make", Inter 650, cap 41.5 px. Ink spans x 72–649 (577 px = 80.1 %W, cx 360.5). Cap top 143.8, baseline **185.4** (14.5 %H). At 1080: baseline 278, x 108–974.
- **Line 2:** a blue highlight box with "Motion Graphics" in the white serif.
  - **Box:** **x 106–614, y 206–293 (509×88 px, 70.7 %W × 6.9 %H)**, centred (cx 360). At 1080: 159–921 × 309–440 (762×131).
  - **Box fill:** **#0083FC**, flat with no gradient (top and bottom are both #0083FC).
  - **Corner radius:** ≈ 5–6 px (the corner inset reaches 0 by row 3), so 8–9 px at 1080.
  - **Text:** ink bbox 116–594 × 224–291. Padding left 10 px, right 20 px (italic overhang), 22 px from box top to cap top, and 17 px from baseline (276) to box bottom; descenders come within 2 px of the bottom edge. Text colour #F9FBFC.
  - **Gap:** line-1 baseline to box top is 21 px.
  - **Box shadow:** downward only. Directly below the box luma is 168, fading to bg (233) over about 20 px, tinted blue (#AED3EF→#F9F9FB below the W1 box). There is no shadow on the top or sides. Use `0 8px 20px rgba(0,110,230,.30)` **(est.)**.

**Word-by-word reveal of line 1** (not tied to speech; a fixed stagger):
- Words first appear at **f1 (Claude), f3.5 (Can), f6 (Now), f8.5 (Make)**, a stagger of about **2.5 frames (83 ms)**.
- Each word: coverage 0.09 → 0.27 → 0.51 → 0.72 → 0.81 → 0.86 → 0.97 over about 7–9 frames (≈ 270 ms). The y-offset goes 12 → 5 → 2 → 1 → 0 px (+12 px at 720, +18 at 1080), which is **expo.out over ~5 frames**. Blur clears in 3 frames.

**Box wipe** (width of the blue fill, left edge fixed at x 106):
- Width per frame from f5 to f19: 27, 145, 253, 322, 371, 407, 434, 455, 472, 485, 494, 500, 505, 507, 508 px.
- Starting at f4.8, this fits **power4.out (quart.out) over 16 frames = 530 ms** almost exactly (predicted .27/.45/.59/.70/.79/.91/.97/.99 against measured .29/.50/.63/.73/.80/.90/.955/.984). power3.out fits worse early on.
- Implement as `scaleX 0→1, transform-origin left` or `clip-path inset(0 100% 0 0 → 0)`.
- The text inside reveals word by word as the box passes: `Motion` appears around f9 and `Graphics` around f12–14, with the same fade/blur entrance.

**Exit:** the headline does not animate out. It holds unchanged until f85 and **leaves with the hard cut to D1 at f86 (2.87 s)**.

**Second instance, W1 "It's Called":**
- Blue box **x 202–518, y 160–249 (317×90)**, centred, top at 12.5 %H. Text bbox 214–500 × 176–232.
- The same #0083FC fill, ≈ 5 px radius and downward blue shadow.
- It appears on a blank white frame: f196–200 are pure #FDFDFD, a 4 px sliver appears at f201, and the box has its full width by f204–205 (a faster wipe, about 4–5 frames). `It's` lands at f205 and `Called` at f208–209. The browser card fades and scales in under it from f202 to f204.
- So the headline box is a reusable "setup" device: **box top at y 160 (W1) or 206 (L1, under a sans line)**.

---

## 4. Layout templates

Common grid: **outer side margin 46 px (6.4 %)** for wide cards; **card top y = 160 (12.5 %H)** in every layout that has no headline above the card. Everything is centred on x = 360.

### 4.1 Light split (L1, L2, L3, L4)

**Background:**
- A diagonal gradient from cool blue-grey at the left/bottom to warm off-white at the top right. Row y 60–140 reads, by x: #CCDCE6 (0), #DCE4EA (160), #EAEDEF (320), #F0EFF0 (480), #F2F0EF (640). The right column x 690–720 reads, by y: #F2EFEF (0–480), #E5EAEB (720), #C5D2D6 (1080, inside the panel shadow). Mean colour #E4E8EC.
- **Static film grain** with a per-channel std of about 5–7 (frame-to-frame diff std is only ≈ 1, so the grain does not animate).
- **Palm-leaf shadows** multiplied over the top-left corner and the right edge at mid-height, cool-tinted, about 8–10 % darker. I confirmed them on a temporal median of 30 frames (`bg_luma_stretch.png`). They are static.

**Browser card:**
- **Wide** (L2–L4): **x 46–673 × y 160–623 (628×464 = 87.2 %W × 36.3 %H)**. At 1080: 69–1010 × 240–935.
- **Narrow** (L1, under the headline): x 77–642 × 317–639 (566×323), which leaves 24 px under the headline box.

**Face panel:**
- A rounded rectangle at **x 39–681 (642 px = 89.2 %W), top y 938 (73.3 %H)**, bleeding off the bottom edge. The same geometry holds in L1–L4.
- **Top corner radius ≈ 88 px** (12.2 %W), fitted from the edge inset: at dy = 12 the inset is 44, at dy = 32 it is 20, at dy = 62 it is 6.
- Contents: the speaker video, whose wall reads #C5CCBD.
- **Panel shadow:** all around with no offset. bg luma 221–233 drops to about 175 at the edge over about 45 px; the colour at the edge is #A9B3BA. Use `0 0 60px rgba(30,45,60,.45)` **(est.)**.
- **Cut-out subject breaks the frame:** the head is rotoscoped and overlaps above the panel top, so the hair top sits at y 748–758, which is **180–190 px above the panel**, just under the caption.
- **Sprite adaptation:** stand the sprite inside the panel with its head crossing above the panel top by about 190 px (285 at 1080).

**Caption:** baseline about 714–726, in the gap between the card and the head.

**Card shadow on light:** subtle. Below the card, luma goes 216 → 233 over 30 px. To the right, only 236 → 240. Use `0 10px 30px rgba(20,40,80,.08)`.

### 4.2 Dark single card (D1, D2)

**Card:**
- Settles at **x 46–673 × y 159–868 (627×709 = 87 %W × 55.4 %H)**, the same left, right and top as the light card but taller.
- **Scale-in:** width goes 717 → 622 from f86 to f115 (scale 1.153 → 1.0 over 29 frames ≈ 0.97 s). Progress: .04 (f88), .30 (f92), .49 (f94), .64 (f96), .79 (f100), .88 (f104), .94 (f108), 1.0 (f115). That is close to **power3.out with a 2-frame hold, ~0.9 s**. D2 repeats it from f323.

**Background:** a dark, heavily blurred, darkened full-frame copy of the screen content, plus a vignette **(inferred)**. Evidence: D1 is neutral grey with a dark blob where the card's black thumbnails would project; D2 is dark brown (#1D0A05 → #0D0402), consistent with the orange video on that page; B1 is navy (#000628) with a grey top band, consistent with the white-and-blue UI being shown.
- Vignette, D1: corners luma 34–40, top-centre 62, mid-centre 61, so the edges are about 40 % darker.
- D1 top band: #2D2D2D at the edges → #464646 at the centre.
- Build it as `filter: blur(60px) brightness(.3)` on a 1.3× copy of the card, plus a `radial-gradient(transparent 40%, rgba(0,0,0,.45))` vignette **(est.)**.

**Caption:** white #EEF4FB, baseline ≈ 985, attached about 68–73 px under the card bottom.

### 4.3 White title card (W1)

- **Background:** pure flat **#FDFDFD** (std 0, no grain).
- **Blue box:** "It's Called" at y 160–249 (see §3).
- **Card:** browser card at **x 78–641 × y 280–732 (563×452)**, 31 px under the box.
  - Shadow: 0 px on top, blue-grey below (#D4DAE7 → #FDFDFD over about 35 px), about 15 px on the right. Use `0 12px 36px rgba(20,40,80,.18)`.
- **Caption:** `Prompt Motion` in black, baseline 826.
- **Card content:** the page's "Prompt Motion" title gets a blue text selection.

### 4.4 Full-bleed face (F1, F2)

- The speaker video fills the frame (zoomed punch-in, no panel, no card).
- **Caption:** white with a soft dark shadow, baseline 918 (71.7 %H).
- **CTA (F2):** `comment` (serif, 879–929) stacked above `“Motion”` (x 187–531, y 931–1000), with a blue glow under it.
- **Sprite adaptation:** the full-bleed version is a large centred sprite on a blurred backdrop.

### 4.5 Dark comparison (B1)

- **Two stacked cards, each x 126–593 (467 px = 64.9 %W)**:
  - Card A: y 160–510 (350 tall).
  - Card B: y 526–877.
  - **Gap 16 px**.
  - At 1080: 189–890; 240–765 and 789–1316.
- **Labels**, inset 13 px from the card's top-left:
  - "original": black pill (#000-ish, white text) at 139–227 × 172–199 (88×27).
  - "Frame by Frame remake": blue pill **#0283FD** at about 139–368 × 538–567.
- **Background:** navy blur (#000628 → #02061F) under a grey top band (#292929–#434343, y 80–560).
- **Caption:** baseline about 994–1000.

### 4.6 Browser card anatomy (Safari-style, measured on f400, card 46–673 × 160–623)

- **Corner radius 14 px** (inset 34 → 0 over rows 159–172; bottom-left 46 → 57 over rows 611–623). At 1080: 21 px.
- **Border:** about **2 px**. The core is **#2E62A1** / #2962A2, with anti-aliasing to #70A4E4 outside and a 1 px light inner highlight (#E2FFFF). At 1080 use 3 px of #2F66AA plus `inset 0 0 0 1px rgba(255,255,255,.8)`.
- **Border beam:** **two diametrically opposite light comets travel clockwise around the border.**
  - Each is **≈ 42–52 px long** (about 7.5–8 % of card width), with a core of #94C0F6 and a halo of #B4CFF3 about 3 px wide on each side.
  - Measured on the top edge: L1 advances 7.3 px/frame and L2 9 px/frame.
  - Both cards complete a loop in **8.1 s**: L1 perimeter 1778 px at 220 px/s, L2 2184 px at 270 px/s. That points to a **constant angular period**, i.e. a rotating `conic-gradient` border mask with `rotate: 360deg / 8s linear infinite`.
  - In f30–72 the top beam moves right while the bottom beam moves left.
- **Toolbar:**
  - y 160–205, so **45 px tall** (68 at 1080). Fill #F3F3F5 / #F4F4F6, with a bottom divider #E0E0E0 at y 204. Content starts at 206 on #FFFFFF.
  - **Traffic lights:** centres (69, 182.7), (86.4, 182.6), (103.7, 182.5). **Diameter 10 px, pitch 17.4 px.** First centre is 23 px from the card's left edge and 22.7 px below its top. Colours **#F66C5B / #EDB734 / #1EAB42** (macOS #FF5F57 / #FEBC2E / #28C840).
  - Sidebar icon about x 137, back chevron about x 163.
  - **URL field:** a white (#FDFDFD) rounded pill at about x 186–532 × y 170–196 (26 px tall, radius about 8). It holds a lock icon and a centred **"prompt-motion.com"** in about 13 px semibold #1D1D1F, with ellipsis for long paths.
  - Share, + and tabs icons at about x 592 / 620 / 648, in grey #848285.

---

## 5. UI callouts inside the cards

**Highlight ring** (hand-drawn marker box), seen on `230` in the page (f254), the `Prompt` filter pill (f404) and `Opus 5.5` (f361):
- **Colour #128BF6 / #1E8CFA.**
- **Stroke 4–5 px** (7 px at 1080).
- **Corner radius ≈ 18–20 px** (27–30 px at 1080).
- **Padding:** about 13 px horizontal and 20 px vertical around the target text. For `230`, the text is at 287–345 × 312–336 and the ring at 274–355 × 292–357.
- Slightly irregular, with a small overshoot tick where the stroke starts.
- **Draw-on:** **3–4 frames (100–130 ms)**. On `230` the right side appears first (f254 bbox 288–355), then the ring closes (f256: 274–355). Opus: f361–364. Use `stroke-dashoffset` with power1.out.
- The ring stays up as long as the card does.

**Cursor:**
- The standard macOS black arrow with a white outline. **The black body measures 15×25 px at 720** (about 23×38 at 1080; about 28×44 with the outline).
- It moves onto the target just before the ring draws (f397–403).

**Text-selection sweep:**
- Fill **#B4D4F5** (range #A9CBED–#B6CDEB), standard macOS selection.
- **Sweeps left to right** across the key phrase. D1 line 1 right edge: 312, 383, 429, 460, 474, 486, 495, 501 px over f96–104, about **270 ms, power3.out**.
- Multi-line selections sweep all lines in parallel (D2 f334–340).

**Number pop** (`230` / `real examples`, f257–298):
- **Card:** white (#FDFDFD) at **x 239–480 × y 431–607 (241×176)**, centred on x 360, with a 1 px #E2E2E2 hairline border and a soft shadow (luma 236 → 250 over about 15 px). Corner radius about 16 px **(est.)**. At 1080: 359–720 × 647–911.
- **Digits `230`:** Inter Bold (est.), figure height **76 px** (font-size ≈ 104, or 156 at 1080), **#0383FA**, spanning x 274–451 × y 462–537.
- **Label:** `real examples` in bold grey **#767676**, x 267–453 × y 562–589 (≈ 29 px font, 44 at 1080), 25 px under the digits.
- **Motion:** an **odometer roll-up**. Digits slide vertically through intermediate values (`1 16`, `2 28`, `229`…) from f257 to f270 (≈ 430 ms) and land on 230.
- **Exit:** it fades and blurs out from f291 to f298.
- It sits over the page directly below the ringed `230`.

---

## 6. Palette and design tokens

### 6.1 Colour palette

| Token | Hex | Where |
|---|---|---|
| ink | #111214 | Captions and headline on light |
| ink-on-dark | #EEF4FB | Captions on dark grey/brown/navy |
| ink-on-face | #FFFFFF (measured #FDFAF5) | Captions on full-bleed face |
| accent / box | #0083FC | Headline box fill; "remake" pill #0283FD |
| accent-text | #0C82F0 | Serif emphasis on light; `230` #0582F5; number-pop digits #0383FA |
| accent-soft | #82C1F5 | Serif emphasis on dark |
| accent-bright | #2C99F7 | Blue sans emphasis on navy (`recreate`) |
| emph-white | #E9F2FC | White serif emphasis on navy |
| cta-grad | #E1F5FD → #64B4F9 | `“Motion”` |
| cta-serif-grad | #FFFAF0 → #D0CAC5 | `comment` |
| cta-glow | ≈ #2C4A8A @ 55 % | Halo under the CTA |
| glitch-blue / red | #708EE2 / #D2858A (light), #448CD6 / #B95965 (dark) | Claude RGB split |
| ring | #128BF6 | Highlight ring |
| selection | #B4D4F5 | Text selection sweep |
| card-border | #2E62A1 | Browser card stroke |
| beam | #94C0F6 (halo #B4CFF3) | Border comet |
| chrome | #F3F3F5 / divider #E0E0E0 / url #FDFDFD / icons #848285 | Browser toolbar |
| tl-red / tl-yellow / tl-green | #F66C5B / #EDB734 / #1EAB42 | Traffic lights |
| label-grey | #767676 | Number pop subtitle |
| bg-light | #CCDCE6 (bottom-left) → #F2F0EF (top-right), mean #E4E8EC | Light layouts |
| panel-shadow | #A9B3BA at the edge | Face panel shadow |
| bg-white | #FDFDFD | Title card |
| bg-dark-grey | #262626 corners → #464646 centre | D1 |
| bg-dark-brown | #1D0A05 → #0D0402 | D2 |
| bg-navy | #000628 → #02061F, top band #2D2D2D–#434343 | B1 |

### 6.2 CSS custom properties (1080×1920, ×1.5 from measured 720 values)

```css
:root{
  /* type */
  --font-sans: "Inter", "SF Pro Display", "Helvetica Neue", sans-serif;      /* opsz 24-28, wght 650 */
  --font-serif: "ITC Garamond Std Bold Condensed Italic", "EB Garamond", "Playfair Display", serif; /* italic 700-800 */
  --cap-size: 102px;            /* x-height 54, ascender 74 */
  --cap-size-dark: 105px;
  --cap-weight: 650;
  --cap-track: -0.025em;
  --serif-xheight: 48px;        /* size the serif to this; Playfair It 700 ~ 90px, EB Garamond larger */
  --serif-track: -0.02em;
  --head-size: 86px;            /* cap 62 */
  --head-track: -0.03em;
  --headbox-serif-size: 102px;  /* cap ~72 */
  --cta-size: 135px;  --cta-weight: 850;
  --pop-num-size: 156px;  --pop-label-size: 44px;

  /* colour */
  --ink:#111214; --ink-dark:#EEF4FB; --ink-face:#FFFFFF;
  --accent:#0083FC; --accent-text:#0C82F0; --accent-soft:#82C1F5; --accent-bright:#2C99F7; --emph-white:#E9F2FC;
  --cta-grad:linear-gradient(180deg,#E1F5FD,#64B4F9);
  --cta-serif-grad:linear-gradient(180deg,#FFFAF0,#D0CAC5);
  --ring:#128BF6; --select:#B4D4F5; --card-border:#2E62A1; --beam:#94C0F6;
  --chrome:#F3F3F5; --chrome-divider:#E0E0E0; --label-grey:#767676;
  --bg-light:linear-gradient(60deg,#CCDCE6 0%,#E4E8EC 45%,#F2F0EF 100%);
  --bg-white:#FDFDFD;

  /* grid (1080x1920) */
  --margin-x: 69px;               /* 6.4% */
  --card-top: 240px;              /* 12.5% */
  --card-wide-w: 941px;           /* x 69-1010 */
  --card-light-h: 695px;          /* y 240-935 */
  --card-dark-h: 1063px;          /* y 240-1302 */
  --card-narrow-w: 849px;         /* L1/W1, x 116-964 */
  --card-radius: 21px; --card-border-w: 3px;
  --toolbar-h: 68px; --tl-d: 15px; --tl-pitch: 26px; --tl-inset-x: 35px;
  --panel-x: 59px; --panel-w: 963px; --panel-top: 1407px; --panel-radius: 132px;
  --head-overlap: 285px;          /* sprite head rises above panel top */
  --headbox-pad: 6px 30px 3px 15px; --headbox-radius: 9px; --headbox-h: 131px;
  --ring-stroke: 7px; --ring-radius: 28px; --ring-pad: 30px 20px;
  --pop-card-w: 362px; --pop-card-h: 264px; --pop-radius: 24px;
  --cursor-h: 44px;
  --beam-len: 75px; --beam-period: 8.1s;

  /* caption baselines */
  --cap-base-light: 1071px; --cap-base-dark: 1478px; --cap-base-white: 1239px; --cap-base-face: 1377px;
  --cap-max-w: 720px;             /* 67% W, one line only */

  /* shadows */
  --shadow-text-light: 0 3px 15px rgba(0,0,0,.08);
  --shadow-text-dark: 0 3px 18px rgba(0,0,0,.35);
  --shadow-text-face: 0 3px 21px rgba(0,0,0,.45);
  --shadow-cta: 0 4px 27px rgba(0,0,0,.6), 0 0 54px rgba(40,100,220,.55);
  --shadow-headbox: 0 12px 30px rgba(0,110,230,.30);
  --shadow-card-light: 0 15px 45px rgba(20,40,80,.08);
  --shadow-card-white: 0 18px 54px rgba(20,40,80,.18);
  --shadow-panel: 0 0 90px rgba(30,45,60,.45);
  --grain-opacity: .05;           /* static noise, std ~5/255 */
}
```

### 6.3 Motion tokens (GSAP)

| Element | from → to | Duration | Ease | Evidence |
|---|---|---|---|---|
| Caption word in | opacity 0, blur 8px, y +8px → 0 | 150 ms (opacity), 220 ms (y) | power1.out / power3.out | `build`, `Motion`, `prompts`… |
| Serif emphasis in | same, colour ramps up from desaturated | 130 ms | power3.out | `professional` f27–30 |
| Number / verb emphasis | scale 1.2, blur 12px → 1, 0 | 170 ms | power3.out | `230` f253–257, `recreate` f656–660 |
| Brand glitch | RGB split ±4–8 px, slice jitter, flicker | 200–230 ms | steps(1) per frame | `Claude` f304–309, f632–638 |
| Group change | hard cut, 0–1 blank frame | 0 | none | every group |
| Headline words | y +18px, blur, opacity; stagger 83 ms | 270 ms | expo.out | f1–12 |
| Headline box wipe | scaleX 0 → 1 (origin left) | 530 ms, delay 160 ms | power4.out | f5–19 |
| Title-card box wipe | same | ≈ 150 ms | power4.out | W1 f201–205 |
| Dark card scale-in | scale 1.15 → 1 | ≈ 900 ms | power3.out | D1 f86–115 |
| Selection sweep | width 0 → 100 % | 270 ms | power3.out | D1 f96–104 |
| Ring draw | dashoffset 100 % → 0 | 100–130 ms | power1.out | f254–257, f361–364 |
| Number odometer | digits roll to final | ≈ 430 ms | power2.out (est.) | f257–270 |
| Border beam | conic rotation 0 → 360° | 8.1 s/loop | linear, repeat −1 | L1/L2 beam tracking |
| CTA keyword | flicker on/off ×2, then on; y +15px → 0 | 170 ms | steps, then power3.out | f828–832 |
