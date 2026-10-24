# Segment 4: 18.0–24.0 s (frames 540–719)

Reference: `Ref Video For Editing Style.mp4`, 720×1280, 30 fps. Frame index *i* is at time *i*/30 s, file `f_{i+1:04d}.png`.
Continuity windows I checked: 530–539 and 720–729.
Measurements come from Python pixel analysis of the full-res PNGs: border detection, per-word ink mass and centroid curves, line-pitch autocorrelation, and cubic-bezier fits. Visual descriptions come from zoomed crops in `scratchpad/work/seg4/`. Anything I estimated rather than measured is marked **(est.)**.

Script in this window (words.json; *f* = s×30):

| word | s | f | | word | s | f | | word | s | f |
|---|---|---|---|---|---|---|---|---|---|---|
| more. | 18.08 | 542.4 | | your | 19.94 | 598.2 | | recreate | 21.62 | 648.6 |
| Just | 18.46 | 553.8 | | own | 20.06 | 601.8 | | what | 22.14 | 664.2 |
| copy | 18.56 | 556.8 | | brand | 20.22 | 606.6 | | you | 22.32 | 669.6 |
| the | 18.78 | 563.4 | | or | 20.48 | 614.4 | | want | 22.46 | 673.8 |
| one | 18.92 | 567.6 | | product, | 20.60 | 618.0 | | in | 22.70 | 681.0 |
| you | 19.02 | 570.6 | | and | 21.04 | 631.2 | | that | 22.88 | 686.4 |
| like, | 19.14 | 574.2 | | Claude | 21.10 | 633.0 | | exact | 23.00 | 690.0 |
| tweak | 19.50 | 585.0 | | will | 21.26 | 637.8 | | style | 23.36 | 700.8 |
| it | 19.64 | 589.2 | | actually | 21.40 | 642.0 | | with | 23.78 | 713.4 |
| for | 19.78 | 593.4 | | | | | | the / same | 23.96 / 24.10 | 718.8 / 723.0 |

Acoustic onsets from the 10 ms RMS envelope of audio.wav differ from words.json in places. Measured examples: "Just" 18.44 (f553), "copy" ≈18.59 (f558), "tweak" burst 19.46–19.47 (f584), "and" 20.99 (f630), "Claude" 21.07 (f632), "what" 22.23 (f667), "you" 22.40 (f672), "style" 23.41 (f702). In the 21–23.5 s stretch, words.json runs about 2–3 frames early compared with the audio.

---

## 0. What happens in these 6 seconds (one-paragraph view)

The segment opens in the **light split layout**: browser card on top, caption in the middle, and a "pop-out" talking head at the bottom.
1. On "and much **more**" the card **carousel-swipes left** to a new page.
2. On "Just copy the one you like," there is a **hard cut to a full-screen face** with white captions.
3. On "tweak it for your own **brand** or **product**," there is a **hard cut back** to the split layout. Inside the card, the page content **zooms in (×1.54, expo.out)** on a prompt paragraph. A **text-selection highlighter** then sweeps across "my brand colours" just before "brand" is spoken, and across "my product name" just before "product".
4. On "and Claude will actually recreate what you want in that exact style" there is a **hard cut to a dark comparison stage**. Two stacked 4:3 video cards, labelled **original** and **Frame by Frame remake**, play in sync over a blurred dark photo. The whole stage settles from scale 1.15 to 1.0. The face disappears entirely. Caption flourishes on this stage:
   - "Claude" gets a **glitch** entrance.
   - "recreate" is a solo **blue bold** word.
   - "style" is a solo **light-blue italic serif** word.

---

## 1. Layer map

Three layout states appear in the window. Coordinates are px of 720×1280, with % of W/H in brackets. z-order is listed bottom to top.

### 1A. LIGHT SPLIT layout (frames 530–552 and 584–628)

| z | layer | bbox | notes |
|---|---|---|---|
| 0 | Background plate | full frame | Warm off-white at top (#f2efee) shading to cool pale blue at the sides (#dde8ef / #e0e8eb). Static film grain (σ≈4 levels; consecutive-frame diff ≈1.0/255). A blurred **palm-leaf gobo shadow** sits in the upper-left (#d1dfe7). It drifts only very slightly (blurred diff ≤1.7/255 over 1.5 s, global shift <0.6 px), so treat it as static or a very slow sway. |
| 1 | Browser-window card (B-roll) | x 46–673, y 158–625 (6.4–93.5 % W, 12.3–48.8 % H), 627×467 ≈ **4:3** | macOS-style window chrome: traffic lights, URL pill "prompt-motion.com/…", chrome #f4f2f5. **~2 px azure border** #2c62a8–#2f669d with 1 px lighter inner and outer lines (#6ba1d8 / #9ac1e0). Soft grey shadow below the card (#dbe1e2 fading out over ~15 px). Corner radius ≈8–10 px (est.). Page content is a screen capture rendered *inside* the window, and it can scroll and zoom independently of the frame (see 584–607). |
| 1b | Cursor + UI focus ring (inside card) | inside card | Black macOS arrow. Blue focus ring around the "Copy" button at 584–586. Text-selection highlight rects #a5caed (604–628). |
| 2 | Caption line (single line) | centred on x = 360. Ascender top ≈660 (51.6 % H), baseline ≈712 (55.6 % H). Max width seen ≈480 px (66.7 % W) | Black #111316. Emphasis words are bold italic serif in #0b82f2. Font size ≈66 px (est. from 51 px ascender). No shadow. |
| 1 | Talking-head panel | x 40–680 (5.6–94.4 % W). Top edge y≈941 (73.5 % H), bleeds off the bottom | Rounded rectangle with **continuous/squircle corner, radius ≈70–75 px**. Contains the *original camera background* (pale sage wall #cdd4c5, door handle). Soft blue-grey outer shadow about 30 px wide (#a9b4bd at the edge, fading to the background). |
| 3 | Person cut-out (matte) | head top y≈743–753 (58–59 % H); x≈151–568 depending on pose | **The person breaks out of the top of the panel by ≈190–200 px (15 % H).** Hair and head above y 941 are matted directly over the background plate, so the panel is not a crop. Static framing, with no zoom measured. |

### 1B. FULL-SCREEN FACE layout (frames 553–583)

| z | layer | bbox | notes |
|---|---|---|---|
| 0 | Camera frame | full bleed 720×1280 | Original room (pale wall, door), shallow depth of field. Hair top ≈y 40 (3 % H). The person is ≈1.5–1.6× larger than in the split layout (eye spacing ≈160 px vs ≈105 px, est.). No B-roll, no plate, no panel. No zoom or push-in was measurable: frames 553/563/573/583 compared visually, and ORB matching was inconclusive because the background is too soft. |
| 1 | Caption line | centred on x = 360. Ascender top 868 (67.8 % H), baseline ≈918 (71.7 % H), descenders to 931 | White #fdfaf9 with a **soft dark drop shadow** (visible as a dark halo in 2× zoom; blur ≈6–8 px, est.). Same font and size as the light layout. **x positions are identical to the light layout**: "just" sits at x 218–331 in both 552 and 553, so only y and colour change. |

### 1C. DARK COMPARISON stage (frames 629–723+)

The whole stage (background, cards and caption) is one group that scales 1.151 → 1.0 about the frame centre (computed origin y≈637). The settled values are:

| z | layer | bbox (settled, from f658) | notes |
|---|---|---|---|
| 0 | Blurred dark photo plate | full frame | Near-black top band (#090909). Mid-grey area (#3e3e3e at y≈300) with dark vertical bars (blurred window mullions, #010309). Below y≈580 it becomes deep navy (#000826 / #061120). Same scale group: at f629 the top band is pushed off-frame, which shows the plate scales too. |
| 1 | Card 1: "original" video | x 128–591 (17.8–82.1 % W), y 161–508 (12.6–39.7 % H), 463×347 ≈ **4:3** | Fill #fbf9f5. **~2 px blue border** #2a69af–#3870af with brighter "light-streak" segments (#90c5ff, e.g. left edge y≈281–320); I saw no motion in these streaks (visual check). Corner radius ≈12 px (est.). |
| 1 | Card 2: "Frame by Frame remake" video | x 128–591, y 528–875 (41.3–68.4 % H) | Same style as card 1. Gap between the cards is 20 px (1.6 % H). |
| 2 | Label pill "original" | x 139–227, y 172–204 (11 px inset from the card corner) | Fill #1f1e20, white bold text ≈15 px, fully rounded. |
| 2 | Label pill "Frame by Frame remake" | x 140–367, y 539–571 | Fill #0282fc, white bold text. |
| 2 | Caption line | centred on x = 360. Ascender top ≈942 (73.6 % H), baseline ≈994 (77.7 % H). ≈67 px below card 2 | Cool white #ecf4fc with a faint soft shadow. Serif emphasis is #81c2f7 / #85c2f2. Verb emphasis is a bold sans in #2d98f5. |
| — | Talking head | **absent** | The face is gone for the whole result/proof beat. |

---

## 2. Chronological event log

"spoken" = the word being heard (acoustic onset where I measured it; otherwise words.json). Ease names are GSAP terms fitted to per-frame data where the "measured" column gives numbers.

| f start | f end | sec | spoken | element | what changes | measured values | ease (est./fit) | notes |
|---|---|---|---|---|---|---|---|---|
| 530 | 537 | 17.67–17.93 | "and much" | Light split, card A (gallery page, "Charts 33" chip selected with blue ring, cursor on chip) | static | card x 46–673, y 158–625 | — | continuity |
| 534 | — | 17.80 | "much" | caption | "much" appended to "and" | — | std word-in | group "and much more" |
| **538** | 547 | 17.93–18.23 | end of "much" / "more" | **Card A** | **carousel exit to the left**, rigid, horizontal motion blur | right edge 667 → 655, 623, 547, 415, 289, 199, 131, 80, 53, 19; gone at 548 | same tween as card B | blur strongest at 540–545 (old card text unreadable). Blur length ≈ half the per-frame displacement (≈180° shutter, est.) |
| 540 | 544 | 18.00–18.13 | "more" (acoustic ≈18.07 = f542) | caption "more" | appended. **Blue bold italic serif** #1083f0. Fade/blur-in with a 5 px rise | ink mass 19 → 50 → 81 → 93 → 100 %; y-centroid 697 → 694 → 693 → 692 → 692 | ≈power2.out, 5 f (167 ms) | appears ~2 f before onset |
| **541** | 552+ | 18.03–18.40 | "more." + pause | **Card B** (post page: "dawood46 @notdwd / Launch video remake comparison / chips Product UI · Photos · Music / Prompt … Customize · Copy / `<inputs>` Ask me for: …") | **enters from the right**, 191 px behind card A (rigid strip, pitch 806 px = 112 % W) | left edge 606 → 480, 384, 316, 262, 224, 190, 160, 138, 120, 106, 94; rest = 46. Progress 0, 1.5, 5.5, 15, 31, 47, 59, 67, 74, 79, 83, 87, 89, 92, 93, **95 %** at 552 | **cubic-bezier(0.31, 0.02, 0.01, 0.95), 21 f (700 ms), t0 = f537** (rmse 0.002). Reads as slow start, whip, long settle | Fastest frame 541–542 (≈130 px/f), which coincides with the "more" onset. Never seen at rest before the cut, but it is at rest when the layout returns at 584 |
| 552 | — | 18.40 | pause before "Just" | caption | **group swap**: "and much more" → "just" (first entrance frame, grey #939799, blurred) | x 217–332, y 667–731 | instant swap, no exit anim | |
| **553** | — | 18.433 | **"Just" onset (18.44)** | **HARD CUT → full-screen face** | card, plate and panel gone; caption re-laid at y 868–931, white with shadow | caption x unchanged (218–331) | 0 f cut | scene detector 18.433 |
| 553 | 556 | 18.43–18.53 | "Just" | face | right hand enters bottom-left, open palm (natural gesture) | — | — | |
| 558 | 560 | 18.60–18.67 | "copy" (acoustic ≈18.59) | caption "copy" | appended; frame 558 is a ghost (low-opacity fill with the shadow showing through) | mass ≈2 → 71 → 100 %; y-centroid 904 → 900 | ≈power2.out, 3 f | line "just copy" = x 218–503, centred at 360 |
| 564 | 566 | 18.80–18.87 | "the" (acoustic 18.79) | caption | **group swap** "just copy" → "the" | "the" x 121–217; mass 2 → 71 → 100 % | 3 f | the final line "the one you like" is pre-laid at x 120–599, so "the" appears at the far left |
| 567 / 570 / 574 | +2 f each | 18.90 / 19.00 / 19.13 | "one" / "you" / "like" | caption | appended one per word, same ghost → solid entrance | "the one you like" 120–599 (479 px = 66.5 % W) | 3 f each | lead/lag −0.6…+0.3 f vs words.json |
| 575 | 583 | 19.17–19.43 | pause after "like," | face, caption | hold; eyes close at 582–583 (natural blink) | — | — | 31 f full-screen total (1.03 s) |
| **584** | — | 19.467 | **"tweak" onset (t-burst 19.46)** | **HARD CUT → light split** (card B at rest, x 46–673) | page content already zooming/scrolling with vertical motion blur. Cursor parked on **"Copy"** button with a **blue focus ring** (ring x≈608–672, y≈445–487) | — | 0 f cut | scene detector 19.467. The ring implies the "copy" click happened during the face insert (inferred) |
| 584 | 588 | 19.47–19.60 | "tweak" | caption "tweak" | **new group; stretch-in**: left edge fixed at x 245, width collapses; grey → black and blur → sharp. No rise | 2–98 % ink width 229 → 208 → 195 → 186 → 181 px (scaleX ≈1.27 → 1.15 → 1.08 → 1.03 → 1.00); darkest px 144 → 15 → 0 | ≈expo.out, 5 f (167 ms), transform-origin left | **Unique to this word in the segment.** Other first-of-group words did not stretch. Possibly meaning-driven ("tweak") (speculative) |
| 584 | ~607 | 19.47–20.23 | "tweak it for your own" | **card B page content** | **zoom-in + scroll** inside a fixed window frame; the browser chrome stays fixed | text line pitch 37 → 40, 42, 45, 46, 48, 48, 50, 51, 51, 52, 53, 53, 54, 54, 55, 55, 55, 56 … 57 px (**scale ×1.54**). The `<inputs>` line moves from y≈400 (f592) to ≈328 (f614). Title width 552 → 584 = ×1.046 | **expo.out, ≈47 f (1.57 s), t0 = f584** (rmse 0.02) | ≥95 % done by f603; motion blur at 584–590 |
| 584 | 587 | 19.47–19.57 | "tweak" | cursor + Copy ring | carried up and right with the zoom; ring leaves the card edge by 586 | cursor ≈(642,487) → (655,463) → (657,442) → (645,437) (est. ±6 px) | — | |
| 589 | 590 | 19.63–19.67 | "it" | caption "it" | appended, grey (only 2 frames shown, never reaches full black) | — | std | **group cut at 591 while "it" is still mid-fade** |
| 591 | — | 19.70 | (between "it" and "for") | caption | **1-frame blank** | — | — | |
| 588 | 600 | 19.60–20.00 | "for your own" | cursor | glides left and down to the end of "my brand colours" | ≈(622,435) → (564,455) → (533,474) → (525,477) (est.) | ≈power2.inOut (est.) | it parks at the *end* of the phrase about to be highlighted |
| 592 | 596 | 19.73–19.87 | "for" | caption | new group "for …" | ink 37 → 61 → 83 → 91 → 100 %; y 695 → 692 → 691 → 690 → 691; darkest px 138 → 78 → 10 → 0; max gradient 26 → 74 → 138 (sharp by the 3rd frame) | ≈power2.out, 4 f | the light-mode "grey → black" is just this opacity ramp on a light background |
| 597 / 601 | +3 f | 19.90 / 20.03 | "your" / "own" | caption | appended | "your": ink 38 → 64 → 84 → 92 → 100 %, y 700 → 698 → 697 → 696 | 4 f | line "for your own" x 166–552 |
| **603** | 611 | 20.10–20.37 | "own" → "brand" (acoustic ≈20.26) | **highlight 1 on "my brand colours"** | selection-blue rect sweeps left → right behind the text; the cursor stays parked at the phrase end | rect x 252 → right edge 367, 437, 475, 495, 507, 515, 519, 521 (f604–613); y 425–461; colour #a5caed | **power3.out, 8 f (267 ms), t0 = f603** | starts ≈3.6 f before the words.json "brand" and ≈5 f before the acoustic onset |
| 604 | — | 20.13 | — | caption | **1-frame blank** | — | — | |
| 605 | 610 | 20.17–20.33 | "brand" | caption "brand" | **new group; blue bold italic serif** #0b82f2, fade/blur-in with a 4 px rise | ink 24 → 55 → 87 → 93 → 96 → 100 %; y 695 → 693 → 692 → 691 | power2.out, 5–6 f (≈180 ms) | the emphasis entrance is ~2 f slower than a regular word |
| 611 | 618 | 20.37–20.60 | "brand or" | cursor | moves up a line to the end of "my product name," | ≈(524,450) → (516,432) → (509,421) → (502,406) → (498,403) (est.) | ≈power2.inOut (est.) | parks again before the sweep |
| 612 | 616 | 20.40–20.53 | "or" | caption "or" | appended, black sans | ink 38 → 64 → 85 → 93 → 100 %; y 695 → 691 | 4 f | 2.4 f before words.json |
| **613** | 620 | 20.43–20.67 | "or" → "product" | **highlight 2 on "my product name"** | same sweep | right edge 344, 415, 451, 471, 485, 491, 495 (f614–620); x from 230; y 380–405 | **power3.out, ~7–8 f, t0 = f613** | |
| 614 | 619 | 20.47–20.63 | "product" (words.json 20.60; strong acoustic onset ≈20.70) | caption "product" | appended, blue italic serif | ink 20 → 52 → 83 → 94 → 100 %; y 696 → 692 | 5 f | appears **4 f (words.json) to ~7 f (acoustic) early**, the earliest lead in the segment. The line "brand or product" is x 123–600 |
| 620 | 628 | 20.67–20.93 | "product," + pause | everything | hold | — | — | 45 f light split total (1.5 s) |
| **629** | — | 20.967 | pause; "and" onset 20.99 | **HARD CUT → dark comparison stage** | caption "brand or product" carried over for 1 frame, re-themed: serif → #85c2f2, "or" → #eef5f9, at stage scale 1.15 | caption x 88–636 (548 px vs 477 = ×1.149) | 0 f cut | scene detector 20.967 |
| **629** | ~658 | 20.97–21.93 | "and Claude will actually" | **whole stage (plate + cards + caption)** | **scale-settle 1.151 → 1.000** about the frame centre. Global motion blur at the fastest frames (634–638) | card width 533, 531, 531, 529, 527, 522, 515, 509, 501, 495, 491, 487, 483, 481, 479, 477, 475, 473, 471, 471, 469, 469, 467 … 463 (f658). Card 1 y 90–489 → 161–508; card 2 y 511–910 → 528–875; caption ascender top 1017 → 942 | **cubic-bezier(0.40, 0.00, 0.04, 0.90), ≈33 f (1.1 s), t0 ≈ f627.5** (rmse 0.007). This is the same "hesitate-whip-settle" family as the carousel | there are 3–4 near-still frames after the cut before the move speeds up |
| 629 | 644 | 20.97–21.47 | "and Claude will" | both cards: **blue-tint wash clears** | the card interior starts as a light steel-blue wash with low-contrast content and clears to the true white | top-card sample #c8d9ec (629–630) → #cfddeb, #d6dfeb, #d9e2ee, #dbe5f0, #dfe8ef, #e7e8f4, #e9ebf4, #eceef4, #eef0f4, #eff2f4, #f4f4f6, #f5f5f7, #f5f5f7 → #f9f9f9 (644) | ≈power1.out / near-linear, 14 f (470 ms) from f630 | the bottom card behaves the same (#c5d8ed → #f9f9f9) |
| 630 | 633 | 21.00–21.10 | "and" | caption | **new group** "and …", cool-white | core colour #b6c0cc → #dee5f0 → #f0f7fe | 3 f | |
| **632** | 640 | 21.07–21.33 | **"Claude"** (acoustic 21.07) | caption "Claude" | **glitch entrance**. 632: bright, hard **RGB split** (red/cyan fringes ≈±6 px) plus horizontal slice offsets. 633: dim grey blurred ghost (~40 % opacity). 634–635: RGB split / sliced again, weakening. 636: blurred and dim. 637–639: sharp but **skewed** (faux-italic, ≈−10°), relaxing. 640: upright and clean | chroma metric \|R−B\| on ink: 40.8 (632), —, 23.7, 22.2, 16.8, 12.0, 13.2, 13.6, 14.9 (baseline ≈13) | stepped (no tween), 8 f (267 ms) | stays white (not recoloured). Only proper noun / brand in the window |
| 636 | 638 | 21.20–21.27 | "Claude" | "original" pill | fade-in (with the slight blur of the stage move) | ghost → solid over 3 f | ≈linear, 3 f | 7 f after the cut |
| 640 | 643 | 21.33–21.43 | "will" | caption "will" | appended | ink 46 → 79 → 99 → 100 %; y 991 → 983 (includes the stage drift) | 3 f | 2 f after the words.json onset (the glitch was still settling) |
| 645 | 648 | 21.50–21.60 | "actually" (acoustic ≈21.47) | caption | **new 1-word group** | core #b6c0cc → #dee5f0 → #f0f7fe; ink 31 → 78 → 98 → 100 % | 3 f | |
| 646 | 648 | 21.53–21.60 | "actually" | "Frame by Frame remake" pill | fade-in, blue #0282fc | ghost → solid over 3 f | 3 f | **staggered +10 f after the "original" pill** |
| 629 | 646 | — | — | card content (video) | both videos play in sync: Manus / "Frame by Frame" hero UI zooms out to reveal a sidebar and cards | — | (content) | B-roll content, not edit animation |
| 655 | — | 21.83 | "re-" | caption | **1-frame blank** | — | — | |
| 656 | 660 | 21.87–22.00 | **"recreate"** (acoustic ≈21.76, stress ≈21.84) | caption "recreate" | **solo group; bold *sans* in saturated blue** #2d98f5. Heavy blur at 656, sharp by 659–660, with a slight width change (360 → 340 → 344 → 347 → 349 px) | peak luminance 126 → 167 → 168 → 172 → 188 | ≈power2.out, 4–5 f | a different emphasis style from the serif one: used for the key *verb* |
| ~660 | ~694 | 22.0–23.13 | "what you want in that" | card content | cursor glides to the app logo in both videos and clicks (690–694); a blue ring pulses around the logo | — | (content) | |
| 666 | — | 22.20 | — | caption | 1-frame blank | — | — | |
| 667 / 672 / 675 | +3 f | 22.23 / 22.40 / 22.50 | "what" / "you" / "want" | caption | group "what you want" (x 133–587); words appended exactly on acoustic onsets | e.g. "what" ink 30 → 73 → 98 → 100 %, y 975 → 973 | 3 f each | |
| 681 / 686 / 694 | +3 f | 22.70 / 22.87 / 23.13 | "in" / "that" / "exact" | caption | new group "in that exact" (x 174–549) | "exact" ink 31 → 70 → 97 → 100 % | 3 f each | "exact" lands 1 frame before the B-roll burst |
| **695** | 700 | 23.17–23.33 | "exact" | card content | **logo burst** in both cards: the logo pops to a large size with 4 coloured tiles flying out (heavy motion blur), then settles into an orbit layout by ≈700 | — | (content) | the B-roll's key moment lines up with "exact": the edit is cut so the proof lands on the word |
| 704 | 706 | 23.47–23.53 | **"style"** (acoustic ≈23.41) | caption | **new group; bold italic serif, light sky blue** #81c2f7 | peak luminance 170 → 196 → 225; y 973 → 971 | 3 f | dark-mode version of the serif emphasis |
| 715 | 717 | 23.83–23.90 | "with" | caption | appended, white | ink 31 → 76 → 100 % | 3 f | |
| 719 | — | 23.97 | — | caption | 1-frame blank | — | — | |
| 720 | 723 | 24.00–24.10 | "the" | caption + card content | new group "the …"; inside the cards the logos shrink toward the centre (content) | — | 3 f | continuity |
| 724 | — | 24.13 | "same" | card content | **hard cut inside both cards** to the next demo (desktop menubar / blue wallpaper). The card frames don't move | — | 0 f | scene detector 24.133; B-roll swap without a layout change |
| 729 / 730 | — | 24.30 / 24.33 | "animations" | caption | 1-frame blank, then "animations" in light-blue italic serif with a blur-in | — | — | continuity |

**SFX:** none can be detected at the cut points. The audio sits at room-tone level (−40 to −47 dBFS) at f553 and f629. At f584, the high-band burst matches the aspirated "t" of "tweak". The swipe at 537–552 overlaps speech, so a soft whoosh can't be ruled out there.

---

## 3. Caption behaviour in this segment

**Groups (as displayed):**

| group | words | first frame → last frame | exit |
|---|---|---|---|
| G1 | and much **more** | 529 → 551 | hard swap at 552 |
| G2 | just copy | 552 → 563 | hard swap at 564 |
| G3 | the one you like | 564 → 583 | removed by the scene cut at 584 |
| G4 | tweak it | 584 → 590 | 1-frame blank (591) |
| G5 | for your own | 592 → 603 | 1-frame blank (604) |
| G6 | **brand** or **product** | 605 → 629 (re-themed on 629) | hard swap at 630 |
| G7 | and Claude will | 630 → 644 | hard swap at 645 |
| G8 | actually | 645 → 654 | 1-frame blank (655) |
| G9 | **recreate** | 656 → 665 | 1-frame blank (666) |
| G10 | what you want | 667 → 680 | hard swap at 681 |
| G11 | in that exact | 681 → 703 | hard swap at 704 |
| G12 | **style** with | 704 → 718 | 1-frame blank (719) |
| (next) | the same / **animations** | 720 → 728 / 730 → … | |

**Layout rule:** each group is one line, centred on x = 360, never wrapped, max ≈480 px (≈2/3 of the width, roughly ≤17 characters). The line is **pre-laid out at its final width**: each word appears in its final slot, left to right. The line never re-centres as words are added. For example, "just" sits at x 218–331 before "copy" exists.

**Word timing:** each word appears on its own (karaoke-additive). Compared with **acoustic onsets** the lead/lag is 0 to +3 frames: "copy" 0, "the" +0.3, "tweak" 0, "what" 0, "you" 0, "style" +1.7, "recreate" ≈+3 after the onset (aligned to the stressed syllable). Compared with words.json the range is −4 to +7 frames, because words.json drifts. Two cases stand out:
- Emphasis noun "product" appeared about 4–7 f **before** it was said, together with its UI highlight.
- "will" appeared 2 f late while the "Claude" glitch was still finishing.

**Rule for our pipeline:** use forced-alignment onsets and show each word **0–1 frame before its onset**. An emphasis word can lead by up to ~4 f when it is paired with a B-roll highlight.

**Group breaks:**
1. Always at punctuation and pauses: "more." | "like," | "product,".
2. Long clauses are split into chunks of 2–4 words: "just copy" | "the one you like"; "tweak it" | "for your own" | "brand or product".
3. **Emphasis words start a new group, or get one to themselves**: "brand or product", "recreate", "style with". The exception is "more", which closes "and much more".
4. Short connective or adverb beats can stand alone: "actually".

**Standard word entrance** (every layout): opacity ≈0.3 → 1, blur ≈5 px → 0, y +4–5 px → 0. It takes 3–4 frames (100–133 ms) with an ease-out curve (≈power2.out): ink mass ≈35 % → 65 % → 85 % → 100 %.
- On the light background this reads as "grey → black" (darkest pixel 138 → 78 → 10 → 0).
- On the face it reads as a "ghost" first frame, because the fill is faint while the shadow shows through.

GSAP sketch: `from(word,{opacity:.3, y:5, filter:'blur(5px)', duration:.12, ease:'power2.out'})`.

**Emphasis styling** (what gets chosen):

| style | where | colour | entrance | chosen for |
|---|---|---|---|---|
| Bold *italic serif* (high-contrast, Playfair/Fraunces-like, est.) at the same size as the sans | light bg | #0b82f2 (azure) | standard but slower: 5–6 f, starts pale and blurred | the payload nouns / "more": the *things* (brand, product) and the list-closer "more" |
| same serif | dark bg | #81c2f7 / #85c2f2 (sky blue) | 3 f | the key noun "style" (and "animations" next) |
| Bold **sans**, coloured | dark bg | #2d98f5 | heavier blur-in, 4–5 f, solo group | the key **verb / outcome**: "recreate" |
| Glitch (RGB split, slice jitter, then skew settling to upright) | dark bg | stays white | 8 f stepped | **product / AI / brand proper noun**: "Claude" |
| Horizontal stretch-in (scaleX ≈1.27 → 1, origin left) | light bg | black | 5 f expo.out | "tweak" only. The first word after the return cut; possibly semantic (speculative) |

Connectors inside an emphasis group ("or") stay in the base colour. When a group crosses a layout cut (629), it is **re-themed instantly**: black → white, azure → sky blue, and it is scaled with the new stage.

**Exits:** there is never an exit animation. The whole group disappears in one frame. Either the next group's first word replaces it in the same frame, or there is a single blank frame. A group can be cut while its last word is still fading in ("it" at 590).

---

## 4. Transition catalogue

| # | frames | type | measured | how to build it (HyperFrames/GSAP) |
|---|---|---|---|---|
| T1 | 537 → 557 (cut at 553 at 95 %) | **Carousel swipe-left** of the B-roll card. The outgoing and incoming cards move as one rigid strip, 191 px apart. Horizontal motion blur scales with velocity | travel 806 px (112 % W) over 21 f / 700 ms; **cubic-bezier(0.31,0.02,0.01,0.95)**; peak ≈130 px/f at f541–542; 50 % at f542.2 | `tl.to(strip,{x:-806,duration:.7,ease:CustomEase('0.31,0.02,0.01,0.95')},onsetOf('more')-0.17)` plus a horizontal blur filter whose stdDeviationX ≈ 0.25×|v| px |
| T2 | 552 → 553 | **Hard cut** light split → full-screen face | 0 f; on the onset of the clause "Just…" | swap layout; captions keep x and move to the face-layout y and colours |
| T3 | 583 → 584 | **Hard cut** face → light split, landing *mid-motion* in the card (zoom already ~10 % along, motion-blurred) | 0 f, on the onset of "tweak" | start the inner zoom tween at the cut frame |
| T3b | 584 → ~607 | **In-card zoom & scroll** of the page content (window chrome fixed) | scale ×1.54, expo.out, ≈1.57 s | `to(page,{scale:1.54, y:…, duration:1.57, ease:'expo.out'})` with the page clipped by the card |
| T4 | 628 → 629 | **Hard cut** light split → dark stage | 0 f, 1 frame before the "and" onset | |
| T4b | 629 → ~658 | **Scale-settle (zoom-out land)** of the whole new stage, with brief motion blur at peak speed | 1.151 → 1.0, ≈33 f / 1.1 s, **cubic-bezier(0.40,0,0.04,0.90)**, origin = frame centre | `fromTo(stage,{scale:1.151},{scale:1,duration:1.1,ease:CustomEase('0.40,0,0.04,0.90')})` |
| T4c | 630 → 644 | **Tint-clear** on the cards: light steel-blue wash #c8d9ec → 0 | 14 f / 470 ms, ≈power1.out | overlay `rgba(…)` on each card, opacity 1 → 0 |
| T4d | 636–638 / 646–648 | **Label pills fade in**, staggered | 3 f each; +7 f and +17 f after the cut | `from(pill,{opacity:0,duration:.1})`, stagger .33 s |
| T5 | 723 → 724 | **Content-only hard cut** inside the cards (B-roll swap, layout frozen) | 0 f, on "same" | swap the video `src` / time inside the persistent card frames |
| Tx | throughout | **Caption group swaps**: hard, 0 or 1 blank frame | — | `set(group,{autoAlpha:0})` at the group end |

House ease signature: the two big moves (T1, T4b) share the **"hesitate, whip, long settle"** cubic-bezier family, roughly (0.3–0.4, 0, 0.0–0.05, 0.9–0.95). They hold for about 3–4 frames, whip through the middle, then glide in over the last 50 % of the duration. In-card camera moves use plain **expo.out**. UI micro-moves (highlights) use **power3.out**, about 8 f long.

---

## 5. Editorial logic, and reusable rules

| script beat | visual decision | why | generalised rule (any topic) |
|---|---|---|---|
| "…all charts, and much **more**." (end of a list) | Card carousel-swipes to a *different* example page. Swipe velocity peaks on "more"; "more" in serif azure | "more" = there are other items, so literally show the next item sliding in | **List-closer ("and more", "etc.", "plus tons of…") → horizontal swipe to a new B-roll card, centred on the closer word; the closer word gets serif emphasis.** |
| "**Just copy** the one you like," (imperative to the viewer, after a full stop) | Cut to a **full-screen face** for exactly the clause (1.03 s); B-roll removed; white captions | direct instruction / CTA-like moment, so make eye contact and give the face full weight | **Imperative or "you"-addressed instruction sentence → full-screen talking head for that clause only, cut in on the clause onset and out on the next clause onset (≈0.8–1.2 s).** |
| "tweak it for your own…" (returning to the subject) | Cut back to the split; the B-roll **zooms in** to the exact part of the UI that will be discussed (the prompt text) | re-anchors the viewer on the artefact and makes the small text legible | **Back on B-roll after a face insert → start an expo.out push-in (×1.3–1.6, ~1.5 s) on the region about to be referenced, beginning on the cut frame.** |
| "…your own **brand** or **product**," | Selection highlight sweeps over "my brand colours", then "my product name", 4–5 f before each word; the cursor parks at the phrase end first; both nouns in serif azure | spoken words match words visible on screen, so point at them, synced | **When a spoken keyword appears (literally or near-literally) in the on-screen UI → highlighter sweep (power3.out, ~8 f) across that UI phrase, starting 3–5 f before the word onset; emphasise the keyword in the caption; pre-position a cursor at the phrase end.** Two parallel nouns get two sequential sweeps. |
| "and **Claude** will actually **recreate** what you want in that exact **style**" (payoff / result claim) | Hard cut to a dark stage with **original vs remake** stacked cards, labelled pills, a scale-settle landing; face removed | a claim of outcome needs proof; before/after on a neutral dark stage reads as "evidence" | **Result / proof claim ("will recreate", "same as", "turns X into Y", "before/after") → change of world: dark stage, two stacked 4:3 media cards (source on top, result below), labelled with pills (neutral dark = original, brand blue = ours), whole stage settles 1.15 → 1.0. Hide the presenter.** |
| "Claude" | Glitch entrance | the AI/tool name, a "tech" beat | **Product, tool or AI proper noun → glitch-in (RGB split + slice jitter + skew settle, ~8 f), base colour.** |
| "actually" | Solo 1-word group | rhythmic beat, adds weight before the key verb | **Intensifier / adverb right before the key verb → its own caption group.** |
| "recreate" | Solo, blue bold sans, blur-in | the core promise verb | **The one key action verb of the sentence → solo group, brand-blue bold sans, stronger blur-in (4–5 f).** |
| "in that **exact**" + logo burst in the B-roll | The B-roll's peak motion (logo burst) is timed to "exact" | the proof's climax lands on the claim word | **Align the B-roll's most dramatic action with the most absolute word of the claim ("exact", "same", "instantly").** |
| "**style** with the same **animations**" | Serif light-blue on the key nouns; card content hard-cuts to the next demo on "same" | nouns that carry the claim get serif emphasis; new evidence on "same" | **Swap the B-roll *content* (not the layout) on repeated-claim words ("same", "also", "again") to show a second proof.** |

Pacing in this window: the layouts last 13 f (end of the previous card), then 31 f face, 45 f split, and ≥95 f dark stage. The cuts sit exactly at pause-ends, on the onset of a clause's first word (−1…0 f). There are no cuts mid-clause. In addition to the cuts, the timeline carries caption micro-events every 3–6 frames and B-roll micro-events (highlights, cursor, content) about every 10–15 frames.

---

## 6. Talking-head behaviour → pixel-sprite translation

**Reference behaviour in the window:**
1. **Split (light), frames ≤552 and 584–628.**
   - Person at ≈0.63× of the full-screen scale, head top at 58–59 % H.
   - The body sits in a rounded panel (x 40–680, top y 941, radius ≈72 px) showing the original room. **The head breaks out above the panel by ~190 px.**
   - Static framing; only natural motion (small head turns, an open-palm gesture at 586–588, a blink at 584).
2. **Full screen, 553–583.**
   - Native camera frame, face large (hair top at y≈40), no panel or plate. No measurable push-in.
   - Hand gesture (open palm) at 553–556.
3. **Hidden, 629 onward.**
   - No presenter during the proof stage; the dark stage carries the beat alone.

**Sprite implementation:**
- **Split layout:**
  - Render the sprite **bust** with nearest-neighbour scaling.
  - Feet and lower torso go behind the bottom edge. The panel is a rounded rect, x 40–680, top 941, radius ≈72, filled with a simple pixel-room backdrop (wall #cdd4c5-ish plus a door detail) or a soft gradient.
  - Draw the sprite **after** the panel and **unclipped**, so its head pokes ~190 px above the panel edge (the "pop-out" signature).
  - Sprite head top ≈ y 745. Sprite width ≈ 400–450 px.
- **Full-screen insert:**
  - Same sprite scaled ×1.5–1.6 and centred, head top ≈ y 40, cropped at the chest.
  - Background = full-bleed room backdrop. Captions white with a soft shadow at baseline y≈918.
- **Lip-sync:** toggle mouth open/closed per frame from the voiceover RMS (open when the 20 ms RMS is above room tone + ~15 dB). Use talk-small / talk-wide on loud syllables.

**Pose per beat:**

| frames | line | suggested pose |
|---|---|---|
| 540–552 | "and much more." | **present-left** (palm toward the card above), mouth open on "more"; settle to idle at 550 |
| 553–557 | "Just copy" (full screen) | **present-right** (open palm toward camera, mirroring the real hand gesture), talk-wide |
| 558–574 | "the one you like," | **idle** talking (talk-small / talk-wide alternating) |
| 575–583 | pause after "like," | **idle smile** |
| 584–590 | "tweak it" | **thinking** (hand to chin) |
| 592–603 | "for your own" | **idle** talking |
| 605–612 | "brand" | **point-left** toward the card highlight, timed with sweep 1 at 603 |
| 613–628 | "or product," | **point-right** (or hold point-left) with sweep 2 at 613; return to idle on the pause |
| 629–723 | "and Claude will actually recreate … exact style with the same…" | **hidden** (faithful to the reference). If a presence cue is ever wanted, use at most a tiny sprite reaction. The reference shows none, so the recommendation is to hide it |

---

## Appendix: uncertainties

- Cursor coordinates (584–628) were estimated by eye from 0.55× crops (±6 px).
- Motion-blur length (≈half the per-frame displacement) is an estimate.
- Font identification (grotesk bold sans, high-contrast bold italic serif) and the ≈66 px size are estimates; size comes from a ≈51 px ascender height.
- Light-plate palm-shadow motion is within noise. I treat it as static or a very slow sway.
- No zoom was detected on the full-screen face, but the soft background made automatic scale estimation unreliable. Any drift is visually under about 3 %.
- The cause of the "tweak" horizontal stretch (semantic flourish vs. a re-entry style) is speculation; the measurement itself is solid.
