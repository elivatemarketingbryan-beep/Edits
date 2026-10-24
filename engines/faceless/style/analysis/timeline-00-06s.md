# Segment 1 — 0.000 s to 6.000 s (frames 0–179), with continuity to f189 / f200

Reference: `Ref Video For Editing Style.mp4`, 720x1280, 30 fps. Frame N = file `f_{N+1:04d}.png`, time = N/30.
1 frame = 33.3 ms. Every pixel value below is in 720x1280 source pixels, with % of width (W=720) or height (H=1280) in brackets.
Measurements come from Python pixel analysis: thresholded bounding boxes, template matching, per-word ink and Laplacian sharpness curves, and curve fits for easing. Anything I inferred rather than measured is marked **(inferred)**.

Script spoken in this segment:
"Claude can now build full professional motion graphics from scratch, | and somebody just put together a whole library showing exactly how to create the best ones." (sentence 2 continues: "It's called Prompt Motion" from 6.56 s)

Word timings in `words.json` are mostly within ±2 frames. They are wrong in three places, which I corrected from the audio RMS envelope:
- "full" starts about 0.84 s, not 0.68 s.
- "to" starts about 5.40 s, not 5.60 s.
- "create" starts about 5.52 s, not 5.68 s.

The audio shows no music bed and no transition SFX. The 2.78–2.87 s gap sits at −45 to −49 dBFS, and the 6.46–6.54 s gap at −43 dBFS.

---

## 0. TL;DR of the segment's editing grammar

The segment has two "scenes", each a single sentence or clause, joined by a hard cut placed on the breath pause.

| Scene | Frames | Time | Layout |
|---|---|---|---|
| S1 "Hook / title card" | f0–f85 | 0.000–2.833 s | Light textured background, a 2-line headline with the payload phrase in a blue box, a browser-window B-roll card playing the product output, a 1–2 word caption under the card, and the presenter as a cut-out that pops out of a rounded frame at the bottom |
| S2 "Proof / source" | f86–f195 | 2.867–6.500 s | Dark radial background with a full-width browser card showing a tweet. No presenter and no headline. White captions under the card. The scene opens with a camera "settle" zoom-out (1.151→1.0). Text highlights sweep over the tweet as the voice paraphrases it, then the page scrolls to reveal more |
| (next) | f196–f200 | 6.533–6.667 s | 5 frames of solid #fdfdfd white, then the next title builds (outside this segment) |

Nothing on screen is ever static for long:
- An S1 card is never still: either the B-roll inside it is playing, or a light "beam" is circling its border.
- Captions change every 8–23 frames.
- Every scene start carries a motion-settle: a card scale-in in S1, a camera zoom-out in S2.

---

## 1. Layer map

### 1a. Scene S1 (f0–f85), back to front (z-order low → high)

| z | Layer | Bounding box (settled) | Notes |
|---|---|---|---|
| 0 | **Background**: off-white paper with a cool-blue cast, static film grain, palm-leaf shadow | full frame | Median colours: top-left in shadow #cde0e9; top-right #f2efee; mid-left #dee9ee; mid-right #e9ecec; lower #dbe8ee / #e1ebec. Grain: per-pixel σ ≈ 4 levels. The grain is a static texture (adjacent-frame difference 0.3–0.7). The palm shadow sits top-left, x 0–300, y 0–500, in a blue-grey tint. It may sway ≤ 8 px (strip-match shift −8…+1 px over 85 f). Treat it as effectively static (inferred: a looping shadow overlay) |
| 1 | **Talking-head frame**: rounded rectangle filled with the original room footage (pale sage wall #c4cbbc, door handle) | x 38–680 (5.3–94.4 %), top y 942 (73.6 %), runs off the bottom edge | Corner radius ≈ 25–28 px. Soft dark outer shadow: the background darkens from #d3dfe5 to #a9b4b3 within about 35 px of the edge, i.e. roughly `0 0 40px rgba(0,0,0,.2)`. No zoom or pan: a door-handle template match holds (80,1110) at score 0.999 for f0–f85 |
| 2 | **Presenter cut-out** (segmented person) layered above the frame | Hair top y 740–763 (57.8–59.6 %). Head x ≈ 181–579 as he sways | The head and hair break out of the frame top (y 942) by about 200 px, a "pop-out" effect. The person's own sway is ±35 px in x and +23 px in y. That sway is natural movement, not an editor move |
| 3 | **Headline line 1**: "Claude Can Now Make", Title Case, bold grotesk sans | x 72–649 (10.0–90.1 %), y 143–185 (11.2–14.5 %). Cap/ascender height 42 px ≈ 58 px font | Colour #111316. Word x-ranges: Claude 72–248, Can 265–363, Now 383–496, Make 514–649. No shadow |
| 4 | **Headline highlight box**: solid blue rectangle | x 106–614 (14.7–85.3 %), y 206–293 (16.1–22.9 %); 508x88 px | Colour #0083fc. Radius ≈ 2–3 px. Drop shadow below only: about 10 px of darker #cdd6dd versus #e6e9ec, i.e. roughly `0 4px 10px rgba(0,0,0,.12)`. It is an overflow-hidden container: the text inside is clipped during the wipe |
| 5 | **Box text**: "Motion Graphics", white, bold italic serif | x 119–593, y 226–293 | "Motion" 119–315, "Graphics" 338–593. Same serif as the caption emphasis words (closest free match: Georgia Bold Italic / Libre Baskerville Bold Italic, inferred). The "p" descender reaches the box's bottom edge |
| 6 | **B-roll card**: Safari window mock-up with a live screen recording of prompt-motion.com playing a motion piece | Outer stroke x 77–642 (10.7–89.2 %), y 317–639 (24.8–49.9 %); 565x322. Black video area x 119–595, y 336–634 | Stroke about 2 px blue (core #3b66a7, anti-alias #76a1e2), a white inner line (#edfbff), and a faint blue outer glow (#a5c3fc). Corner radius ≈ 15 px. Chrome: traffic lights, sidebar icon, back chevron, URL pill "prompt-motion.com/stephanlivera-df17…", share / + / tabs icons |
| 6b | **Border beam** on the card stroke | Rides the stroke | Two soft light-blue highlight segments, about 60–80 px long and diametrically opposite, travel clockwise at a constant speed. See event log |
| 7 | **Caption** (1–3 words, centred at x≈360) | Text y 667–731 (52.1–57.1 %). Line widths 120–330 px | Regular words: bold grotesk sans, #0f1214, ascender height 49 px ≈ 66–68 px font. Emphasis words: bold italic serif, flat blue #1683f0 (range #017bcb–#8bc4ff from anti-aliasing). No caption shadow on the light background |

No layer overlaps another, so the caption-versus-presenter z-order can't be observed. The caption bottom (731) sits above the hair top (≥740).

The vertical stack is headline 143 → box 206–293 → (gap 24) → card 317–639 → (gap 28) → caption 667–731 → hair 740+ → frame 942.

### 1b. Scene S2 (f86–f195), back to front

| z | Layer | Bounding box (settled, from f119) | Notes |
|---|---|---|---|
| 0 | **Background**: dark charcoal radial "spotlight" | full frame | Brightest at about (360, 880–920): #575752. Top-centre #383838. Edges #222222–#2d2d2d. Bottom corners #1e1e1e. Slightly warm neutral. The edge brightness drops 42→37 during the zoom-out, so the background is scaled with the scene (inferred) |
| 0b | Unexplained blurred near-black blob at the left edge | x 0–40, y 575–710 | Static from f98. Probably a stray blurred layer behind the card. **Do not replicate** |
| 1 | **B-roll card** (same component as S1): Safari window showing an x.com tweet by p4n @p4nthera_ with an embedded gallery video | Stroke x 44–676 (6.1–93.9 %), y 158–869 (12.3–67.9 %); about 632x711. White content x 49–670, y 162–866 | Same 2 px blue stroke, same corner radius (≈16–18 px), and the same border beam. URL "x.com/p4nthera_/status/2107175720086589…". A static OS cursor at about (538,662) is part of the recording |
| 2 | **Text-highlight overlay** inside the card | Per-line rectangles, 24 px tall | Colour #b4d4f5 (text-selection blue), square corners. Line 1 y 323–346, line 2 y 352–375, line 3 y 382–404 (settled). Probably an editor overlay rather than a real drag-selection, because no cursor sits at the selection end (inferred) |
| 3 | **Caption** | Text y 930–996 (72.7–77.8 %), centred x≈360 | White #eef4fa bold grotesk sans, about the same size as S1 (ascender height 51 px). Soft dark shadow: background darkens 63→35–55 over about 10–15 px under the glyphs, plus a 1–2 px dark rim, roughly `0 2px 8px rgba(0,0,0,.5)`. Emphasis words: bold italic serif in light blue #82bff0 (range #71a7c9–#9fc9fd) |
| — | Talking head | — | **Hidden for the entire scene** |

During f86–f118 the card, the caption (and, inferred, the background) are one group scaled about the frame centre (360,640). Evidence: at f89–f97 the caption shrinks 521→479 px (×1.0877) while the card shrinks 712→654 (×1.0887). Solving for the transform origin from the card's top and bottom gives y ≈ 632–647.

---

## 2. Event log (chronological)

Easing fits are least-squares fits to per-frame measurements. "err" is the mean absolute error of the fit.

| F start | F end | Time (s) | Spoken (words.json; audio-corrected in brackets) | Element | What changes / measured values | Easing (GSAP) | Notes |
|---|---|---|---|---|---|---|---|
| 0 | 0 | 0.000 | "Claude" 0.00 | Whole frame | Only background, talking-head frame and presenter, already at final framing. No headline, card or caption | — | Clean establishing frame. Every overlay starts on f1 |
| 1 | 7 | 0.033–0.233 | Claude | Headline "Claude" | Opacity 0→1; blur ≈ 8–10 px→0 (sharpness 0.01→0.92 of final); rise ≈ 6 px (ink centroid y 173.5→167.7); reads light grey → #111316 because opacity and blur ramp together. Ink: .34/.50/.63/.77/.83/.87/.97 at f1–f7 | ~power2.out, 6–7 f (200–233 ms) | Headline words stagger at their own pace, not to speech |
| 1 | 5 | 0.033–0.167 | Claude | B-roll card fade/blur-in | Video-area luminance 228 (background) → 203 → 168 → 120 → 25, giving opacity ≈ 0 / .13 / .30 / .54 / 1.0 at f1–f5. Heavy blur on f1 (chrome invisible), ≈ 3–4 px on f2, ≈ 1–2 px on f3, sharp by f4 | Opacity accelerates (power2.in-like) over 4 f / 133 ms | |
| 1 | 24 | 0.033–0.800 | Claude … build | B-roll card scale | Scale 0.89→1.0 about the card centre (360,478); the centre never moves. Stroke widths: f4 535, f5 541, f6 547, f7 551, f8 555, f9 557, f10 559, f11 561, f12 563, f15+ 565 | **power4.out, 23 f (767 ms)**, start f1 (err 0.43 px) | No slide, pure scale |
| 1 | 5 | 0.033–0.167 | Claude | Caption "Claude" (group A, laid out as "Claude can", line x 198–523) | **Glitch-in.** f1: ghost at about 20 % grey, heavily blurred. f2: sharp near-black; the word is cut into 3 horizontal slices offset in x: y 668–681 → −4 px, y 682–700 → +4 px, y 701–720 → −8 px, with blue fringes on left edges and red/pink on right edges. f3: same slices at −3/+3/−7 px, about 60 % grey. f4: blurred light grey (a flicker back). f5: clean #0f1214 at x 198–402 | Stepped (no tween), 4 f | Only glitch in the segment. It marks the very first word of the video |
| 3 | 10 | 0.100–0.333 | can 0.16 | Headline "Can" | Same reveal: centroid 174.3→167.2; sharpness .02 (f4) → .83 (f9) | ~power2.out, 7 f | Stagger +2 f after "Claude" |
| 4.8 | 26 | 0.160–0.867 | can | Blue highlight box | Width grows from the left edge (x = 106 fixed): f5 27, f6 145, f7 253, f8 322, f9 371, f10 407, f11 434, f12 455, f13 471, f14 485, f15 494, f16 500, f17 505, f18 507, f19 508 px. Height is constant (206–293) | **expo.out, 22 f (733 ms)**, start f4.8 (err 0.8 %) | A width/clip reveal, not scaleX: the text inside is clipped, never squashed |
| 5 | 85 | 0.167–2.833 | — | Card border beam | Top beam travels L→R along the top stroke: x ≈ 151 (f10), 186 (f15), 224 (f20), 258 (f25), 296 (f30), 366 (f40), 441 (f50), 511 (f60), 586 (f70); it turns the corner around f75. Bottom beam travels R→L: x ≈ 598 (f5) … 134 (f70) | **Linear, ≈ 7.2 px/frame.** About 8.1 s per lap of the 1,774 px perimeter (S2 card: ≈ 11 px/f on a 2,654 px perimeter, the same ~8 s lap) | Constant secondary motion. Implement as two blurred dots on an `offset-path` around the rounded rectangle |
| 5 | 26 | 0.167–0.867 | — | B-roll internal | Black page, orange 12-spoke asterisk (Claude logo) with a ring of text. From f18 the asterisk shrinks to a dot (f25); f26 is near-empty black | Recording content | Not an edit, but the playback offset puts the next "wow" frame on the emphasis word |
| 6 | 8 | 0.200–0.267 | can 0.16 | Caption "can" | Appears blurred mid-grey at x 421–523, near-black by f8 | 3 f blur-fade | +1.2 f after spoken onset |
| 6 | 12 | 0.200–0.400 | now 0.36 | Headline "Now" | Centroid 174.8→167.0 | ~power2.out, 6 f | Stagger +3 f |
| 8 | 15 | 0.267–0.500 | build 0.50 | Headline "Make" | Centroid 175.6→166.7 (rise ≈ 9 px); grey and sharp at f11, black at f15 | ~power2.out, 7 f | Headline uses "Make" while the voice says "build" |
| 9 | 9 | 0.300 | (now 0.36) | Caption | Group A removed; **1 blank frame** | Hard cut | |
| 9 | 13 | 0.300–0.433 | now | Box text "Motion" | White serif, blur→sharp, opacity 0→1, rise ≈ 12 px (centroid 273.9→262.0); sharp at f12 | ~power2.out, 4–5 f | Starts 4 f after the box starts |
| 10 | 13 | 0.333–0.433 | now 0.36 | Caption "now" (group B "now build", line x 221–500) | Blurred grey at f10 (min luminance 139), then 83, 12, 3; top edge 689→685→684→683 (rise ≈ 6 px) | 3–4 f, power2.out | −0.8 f relative to speech |
| 12 | 17 | 0.400–0.567 | build | Box text "Graphics" | At f12 it is clipped by the box's right edge (x 561, mid-"c"); sharp by f15–16; rise ≈ 1–2 px | ~power2.out, 4–5 f | Stagger 3 f after "Motion". The headline is complete at f17 (0.567 s) and stays static until f85 |
| 14 | 16 | 0.467–0.533 | build 0.50 | Caption "build" | x 363–500, blur-fade grey → black | 3 f | −1 f |
| 25 | 25 | 0.833 | ["full" ≈ 0.84] | Caption | Group B removed; **1 blank frame** | Hard cut | |
| 26 | 29 | 0.867–0.967 | full (0.68 → [0.84]) | Caption "full" (group C "full professional", line x 152–571) | Blurred grey (min luminance 137) → 83 → 10 → 0 | 3 f | +0.8 f relative to the audio onset |
| 27 | 29 | 0.900–0.967 | professional 0.96 [≈1.05] | Caption **"professional"** (emphasis) | Bold italic serif #1683f0 at x 250–571, y 667–731. f27: light lavender-blue, blurred. f28: blue, nearly sharp. f29: final | 3 f | Shown **≈ 4 f before** its own onset: the pair arrives almost together (1 f stagger) |
| 27 | 34 | 0.900–1.133 | professional | B-roll internal | Cream disc bursts from the centre (f27). An orange dot grows inside it (f28). The orange circle floods the frame (f30–33) and "CLAUDE" in a wide black display font wipes in (f30–34) | Recording content | The B-roll's "wow" beat lands on the emphasis word |
| 2–3, 27–36 | | | Claude / professional | Presenter | Hands enter the frame bottom-left at f3 and f27–36. Eyes close and the head tilts back at f36–40 | — | Natural gestures on the first word and the first emphasis word |
| 45 | 49 | 1.500–1.633 | motion 1.44 | Caption group D **"motion graphics"** (both words emphasis, line x 152–567) | Group C is replaced in the same frame (no blank). "motion" appears at x 152–329: blurred light blue → full by f47–48 | 3 f | +1.8 f |
| 54 | 60 | 1.800–2.000 | graphics | B-roll internal | "motion designer" serif-italic subtitle writes in under "CLAUDE" | Recording | |
| 56 | 58 | 1.867–1.933 | graphics 1.72 [≈1.76] | Caption **"graphics"** | x 354–567 | 3 f | +3 f |
| 66 | 66 | 2.200 | — | Caption | Last frame of group D | | |
| 67 | 70 | 2.233–2.333 | from 2.16 [≈2.12] | Caption group E "from" (line "from scratch", x 173–545) | Grey blurred → black; top edge 675→672→671→670 (rise 5 px) | 3–4 f | No blank between D and E |
| 69 | 76 | 2.300–2.533 | from scratch | B-roll internal | "CLAUDE" letters fall and collapse into dots (f69–74); diagonal wipe from orange to cream, top-left to bottom-right (f74–76) | Recording | |
| 73 | 80 | 2.433–2.667 | scratch 2.36 | Caption "scratch" | **Horizontal stretch-in.** Width 287 (f73, blurred) → 253 → 237 → 228 → 223 → 219 → 216 → 215 px, so scaleX ≈ 1.33 → 1.18 → 1.10 → 1.06 → 1.04 → 1.02 → 1.0. Left edge pinned at x 330–332; height unchanged. Combined with blur→sharp and grey→black | expo.out ≈ 12 f (400 ms), origin left | The only stretch entrance in the segment (1 of 26 words). Inferred: an occasional variety entrance on the clause-final word |
| 77 | 85 | 2.567–2.833 | scratch, | B-roll internal | Cream page, dots draw a descending curve, then "Six ways to get from A to B." list with coloured dots | Recording | |
| — | — | 2.78–2.87 | (silence, −45 to −49 dBFS) | — | Breath pause | | The cut lands at the end of the pause |
| **86** | 86 | **2.867** | and 2.86 | **SCENE CUT S1→S2** | Hard cut, no flash or blur frame. Headline, box, light card, caption and presenter are all gone. Dark radial background. Tweet card already at full opacity but over-scaled: x 2–717, y 91–899 (scale 1.151). No caption on f86 | Cut | Matches scene-detector hit 2.867 |
| 86 | 122 | 2.867–4.067 | and … together | **Camera zoom-out (whole scene)** | Scale 1.151→1.000 about (360,640). Card width: 716 (f86–87), 714, 712, 708, 702, 692, 682, 672 (f94), 665, 659, 654, 650, 646, 643 (f100), 640, 638, 636, 634, 632 (f105), 631, 630, 628, 626 (f110), 624 (f113), 623, 622 (f119). Motion blur tracks velocity: sharpness drops to 0.67 vertical / 0.82 horizontal at f92–93 and recovers by about f103. Possible slight horizontal ghosting at f92 (inferred) | **cubic-bezier(0.35, 0, 0, 1), 37 f (1.23 s)**, start f85 (err 0.5 %). `CustomEase "0.35,0,0,1"` | A 2–3 frame hold, peak speed at f91–94, then a long settle. The caption rides inside the same transform |
| 87 | 89 | 2.900–2.967 | and 2.86 | Caption group F "and" (line "and somebody") | Luminance 198 → 231 → 254: grey/blurred → white. x 99–228 (scaled) | 3 f | +1.2 f. The first caption word after the cut arrives 1 frame after the cut |
| 89 | 90 | 2.967–3.000 | somebody 2.98 | Caption "somebody" | x 252–622 at f89 (scaled ×1.145). Settled-equivalent y ≈ 934–1002 | 2–3 f | −0.4 f |
| 94 | 104 | 3.133–3.467 | just 3.20 | **Text highlight #1** | #b4d4f5 rectangle grows L→R behind "I built a growing gallery of motion graphics" (tweet line 1, settled x 60–499). Progress .34 (f95), .58, .74, .84, .90, .94, .97, .99 (f102), 1.0 (f104). Continuous: it cuts mid-word (e.g. "graphic|s" at f99) | **power4.out 14 f / expo.out 15 f (≈ 0.5 s)**, start f94 (err 0.6 %) | Runs during the camera settle. The highlighted text paraphrases "somebody just put together" |
| 97 | 97 | 3.233 | — | Caption | Last frame of group F | | |
| 98 | 101 | 3.267–3.367 | just 3.20 | Caption group G "just" (line "just put", x 239–479) | Luminance 202 → 230 → 251 → white | 3 f | +2 f |
| 105 | 105 | 3.500 | put 3.40 | Caption "put" | x 377–479 | ≤2 f | +3 f |
| 106 | 106 | 3.533 | together 3.54 | Caption | **1 blank frame** | Hard cut | |
| 107 | 109 | 3.567–3.633 | together 3.54 | Caption group H "together" | x 227–494, white by f109; top 940→935 (rise ≈ 5 px) | 3 f | +0.8 f. One long word gets its own group |
| 115 | 116 | 3.833–3.867 | a 3.84 | Caption group I "a" (line "a whole library", x 140–582) | "a" at x 140–173. The line is pre-laid out, so "a" sits at the far left, not centred | 2 f | −0.2 f |
| 117 | 118 | 3.900–3.933 | whole 3.96 | Caption "whole" | x 193–377 | 2 f | −1.8 f |
| 117 | 125 | 3.900–4.167 | — | B-roll internal | Gallery tiles in the embedded tweet media animate in ("CLAUDE" orange tile, "EVERY" orange tile) | Recording | |
| 119 | 119 | 3.967 | — | Camera | Zoom fully settled (card 622 px wide) | | |
| 126 | 128 | 4.200–4.267 | library 4.16 | Caption **"library"** (emphasis) | Bold italic serif light blue #82bff0, x 394–582, y 932–997. Enters as a darker steel blue, then brightens; rise ≈ 4 px | 3 f | +1.2 f |
| 138 | 140 | 4.600–4.667 | showing 4.54 | Caption group J "showing" | x 232–488, luminance 204 → 229 → 255 | 3 f | +1.8 f. Groups I→J have no blank |
| 139 | 155 | 4.633–5.167 | showing / exactly | **Text highlight #2** | One continuous run over two lines. Line 2 "each shown next to the prompt or" grows x 240→599: f140 375, f141 485, f142 566, f143 599. Line 3 "skill that made it." grows x 60→241: f144 127, f145 159, f146 181, f147 197, f148 208, f149 220, f150 227, f152 235, f155 241. Total 540 px | **expo.out, 22 f (733 ms)**, start f139.1 (err 0.7 %) | Wraps across lines in reading order like one selection. "showing" ↔ "each shown next to the prompt" |
| 147 | 147 | 4.900 | — | Caption | **1 blank frame** | Hard cut | |
| 148 | 150 | 4.933–5.000 | exactly 4.84 | Caption group K "exactly" | x 252–471 | 3 f | +2.8 f |
| 150 | 163 | 5.000–5.433 | exactly / how | B-roll internal | The embedded gallery video inside the tweet scrolls its own grid (thumbnails shuffle). Tweet text stays fixed | Recording | |
| 158 | 160 | 5.267–5.333 | how 5.28 [≈5.16] | Caption group L "how" (line "how to create", x 152–571) | x 152–281, luminance 203 → 230 → 255 | 3 f | +3 f relative to audio |
| 162 | 164 | 5.400–5.467 | to 5.60 [≈5.40] | Caption "to" | x 298–358 | 2 f | ≈0 f relative to audio |
| 163 | 193 | 5.433–6.433 | to create the best ones | **In-card scroll** | Tweet content scrolls up 220 px under the fixed browser chrome. Reference line "226 so far…" at y 440 (f163) → 432, 414, 386, 359, 337, 320, 306, …, 283 (f172), 274, 267, 260 (f175), 255, 250, 245, 241, 238 (f180), …, 225 (f185), 222, 221, 220 (f190). Reveals "8:26 PM · Oct 5, 2026 · 1.2M Views" and the engagement row, plus more gallery. Vertical motion blur: sharpness falls to 0.44 at f165 and is back near 0.97 by f191 | **cubic-bezier(0.2, 0, 0, 1), 31 f (1.03 s)**, start f162.25 (err 0.4 %). Peak speed ≈ 28 px/f at f166–167 | Starts on "how to create" |
| 165 | 167 | 5.500–5.567 | create 5.68 [≈5.52] | Caption "create" | x 378–571 | 3 f | ≈ −0.5 f relative to audio |
| 173 | 173 | 5.767 | — | Caption | **1 blank frame** | Hard cut | |
| 174 | 176 | 5.800–5.867 | the 5.86 | Caption group M "the" (line "the best ones", x 180–540) | x 180–279 | 3 f | −1.8 f |
| 178 | 180 | 5.933–6.000 | best 6.00 | Caption **"best"** (emphasis) | Light-blue serif italic, x 298–403 | 3 f | −2 f |
| 183 | 185 | 6.100–6.167 | ones 6.16 | Caption **"ones"** (emphasis) | Light-blue serif italic, extends the line to x 540 | 3 f | −1.8 f |
| 195 | 195 | 6.500 | (pause 6.46–6.54) | — | Last S2 frame. Group M stays until the cut | | Continuity |
| 196 | 200 | 6.533–6.667 | It's 6.56 | Next scene | **Solid #fdfdfd white for 5 frames** (σ = 0). The next title then builds: blue box wipe from f201, "It's Called" in the box from f205 | Hard cut | Continuity: the cut again lands on the pause, ≈1 f before the next word |

Never observed in this segment:
- No number pops, editor-driven cursor moves, flashes, whip pans or mask wipes between scenes.
- No chromatic aberration beyond the first-word glitch.
- No background colour changes inside a scene.
- No talking-head reframing (the head is either in its fixed frame or absent).

---

## 3. Caption behaviour

**Grouping:** 13 groups over 26 words. Each group is 1–3 words and at most about 16 characters.

| Group | Frames | Words (emphasis in **bold**) |
|---|---|---|
| A | f1/2–8 | Claude can |
| B | f10–24 | now build |
| C | f26–44 | full **professional** |
| D | f45–66 | **motion graphics** |
| E | f67–85 | from scratch |
| F | f87–97 | and somebody |
| G | f98–105 | just put |
| H | f107–114 | together |
| I | f115–137 | a whole **library** |
| J | f138–146 | showing |
| K | f148–157 | exactly |
| L | f158–172 | how to create |
| M | f174–195 | the **best ones** |

- Group lifetime is 7–23 frames (233–767 ms); the median is about 15 frames.
- Groups break at clause boundaries and pauses (the comma after "scratch").
- A long word (8+ letters, e.g. together / showing / exactly) gets a group to itself.
- An emphasis noun phrase is grouped with its determiner or modifier ("a whole **library**", "the **best ones**", "full **professional**"), or stands alone if it is two emphasis words ("**motion graphics**").

**Layout:**
- The whole group line is laid out and centred first (centre x = 359–362).
- Words then reveal in place. The first word of a 3-word group sits at the far left with empty space to its right ("a" at x 140 on f115).
- Word spacing is about 18–22 px.
- There is no line wrap and never a second caption line.

**Per-word entrance (default):**
- Opacity 0→1, blur about 6–8 px → 0, and a rise of 3–6 px.
- The word reaches full colour in 3 frames (100 ms), roughly power2.out.
- On the light background a word reads grey (luminance ~140) → dark grey → #0f1214.
- On the dark background it reads grey (~200) → light grey → #eef4fa.

**Variants:**
- **Glitch-in** on the very first word of the video (f1–f5): 3 slice offsets of ±3–8 px with RGB fringes, flickering for 4 frames.
- **Horizontal stretch-in** on "scratch" (scaleX 1.33→1, origin left, expo.out about 12 f, with blur).
- Inferred: these variants are spice, used about once per scene.

**Timing relative to speech:**
- Using audio-corrected onsets, each word appears 0 to +3 frames after its spoken onset (median about +1 f).
- Within a fast pair, the second word may appear early: "professional" shows about 4 f before it is spoken, 1 f after "full".
- The words.json-based leads and lags are in the table above. They range from −2 to +4 f, except the three mis-timed whisper words.
- The first caption after a hard cut appears 1 frame after the cut (f87).

**Emphasis selection:** emphasis falls on the payload of each clause:
- the topic noun phrase (**motion graphics**, **library**)
- the value adjective (**professional**)
- the superlative (**best ones**)

Function words, verbs and the subject ("Claude", "somebody") are never emphasised. Emphasis styling swaps the font to bold italic serif and recolours it brand blue: #1683f0 on light, #82bff0 on dark. Size stays about the same; the serif is visually about 1.05× larger.

**Exit:**
- Always a hard cut: the whole group disappears in a single frame.
- Some group changes have one blank frame between them (f9, f25, f106, f147, f173); the others swap directly (f44→45, f66→67, f97→98, f114→115, f137→138, f157→158).
- The blank frames fall where the next word starts a new breath or phrase (inferred).
- A caption never fades or slides out. The last group of a scene dies with the scene cut.

---

## 4. Transition catalogue

| # | Frames | Type | Measured details |
|---|---|---|---|
| T1 | f0→f1 | Build-in over a clean establishing frame | All S1 overlays start at f1. Staggered build: card (f1, 23 f), headline words at offsets 0/+2/+5/+7 f, blue box +3.8 f, box words +8/+11 f, caption f1–5. Headline fully built by f17 (567 ms) |
| T2 | caption groups | Hard cut (0 or 1 blank frame) | 13 swaps. No tween on exit |
| T3 | **f85→f86** | **Hard cut** S1→S2 on a breath pause (gap 2.78–2.87 s; cut at 2.867, 0–1 f before "and") | Followed by a whole-scene **zoom-out settle**: 1.151→1.0 about the frame centre, cubic-bezier(.35,0,0,1), 37 f. Motion blur proportional to speed (sharpness min 0.67 at f92–93). Presenter and headline removed on the cut |
| T4 | f94–104, f139–155 | UI text-highlight sweeps (in-scene) | Continuous L→R wipe in reading order, wrapping across lines. expo.out ~15–22 f. #b4d4f5, 24 px rectangles |
| T5 | f163–193 | In-card vertical scroll (in-scene) | 220 px, cubic-bezier(.2,0,0,1), 31 f, vertical motion blur (sharpness 0.44 at f165). Chrome stays fixed |
| T6 | f195→f196 | Hard cut to 5 frames of blank #fdfdfd, then the next build | Lands on the 6.46–6.54 s pause, about 1 f before "It's". Outside the segment |
| — | card border | Continuous ornament | Two-beam light sweep on the card stroke, linear, about 8 s per lap |

No cross-dissolves, whip pans, flashes or mask wipes are used between scenes in this segment. Energy at scene boundaries comes from the incoming scene's settle motion, not from a transition effect.

---

## 5. Editorial logic and reusable rules

| Observed decision | Why (script) | Reusable rule for any topic |
|---|---|---|
| Opening frame f0 is clean, then everything builds in from f1 | The hook must start on word 1; the face establishes the narrator | **R1.** Frame 0 shows only the background and presenter. All overlays begin on frame 1 with a staggered build that finishes within about 0.6 s |
| Headline "Claude Can Now Make / **Motion Graphics**" (not the spoken words) | The hook sentence claims "X can now do Y" | **R2.** Turn the first sentence into a 4–6 word Title-Case claim. Line 1 holds the subject and verb in bold sans. Line 2 holds the 1–3 word payload noun phrase in white serif italic inside a brand-blue box that wipes from the left (expo.out, 0.73 s). Words stagger about 2–3 f apart with blur-rise-fade. The headline persists for the whole first scene |
| Browser card under the headline playing the actual product output | "build … motion graphics": show the thing itself, live | **R3.** When the script names a product, site, tool or outcome, show it inside a browser/app window card (2 px brand-blue stroke, about 15 px radius, border beam) playing a screen recording. Entrance: scale 0.89→1 (power4.out, 0.77 s) with a 4-frame opacity and blur-in |
| B-roll "wow" frame (burst to orange "CLAUDE") lands on "professional" | Visual payoff on the value word | **R4.** Trim the B-roll start so its most dramatic visual change lands within ±2 f of the first emphasis word |
| Presenter in a bottom pop-out frame during the hook only | The narrator anchors the claim | **R5.** Hook / claim scenes show the presenter pop-out at the bottom (frame top at 73.6 % H, head breaking out to about 58 % H) |
| Emphasis: professional / motion graphics / library / best ones | Payload words of each clause | **R6.** Emphasis goes on the topic noun phrase, the value adjective and superlatives: about 1 emphasis unit per 4–6 spoken words, never verbs or pronouns. Style: bold italic serif in brand blue (saturated on light, pastel on dark) |
| Caption groups of 1–3 words that never wrap | Readability at speech pace (about 3.5 words/s) | **R7.** Chunk captions into 1–3 words, at most about 16 characters, breaking at punctuation and pauses. A word of 8+ letters may stand alone. Pre-lay-out the group, reveal each word in place at its spoken onset (0 to +2 f) with a 3-frame blur-rise-fade, and hard-cut the group out |
| Hard cut to a dark full-screen tweet on "and somebody just put together…" | The script moves from claim to source or proof (a third party made it) | **R8.** When the narration introduces evidence (a post, article, repo, stat or source), cut to a "proof scene": dark radial background, large browser card, white captions, **no presenter, no headline**. Cut on the breath pause, 0–1 f before the next word |
| Proof scene starts over-scaled (1.15) and settles to 1.0 with motion blur | Gives the cut energy without a transition effect | **R9.** Every proof/B-roll scene opens with a camera settle: scale 1.15→1.0 about the frame centre, cubic-bezier(.35,0,0,1), about 1.2 s, with motion blur on the fast frames. Captions ride inside the same transform |
| Highlight sweeps "I built a growing gallery of motion graphics" on "somebody just put together", then "each shown next to the prompt…" on "showing exactly" | The voice paraphrases what is written on screen | **R10.** When the narration paraphrases visible text, sweep a text-selection highlight (#b4d4f5) over that text. Start it on the first paraphrasing word, expo.out 0.5–0.75 s, continuous L→R across line wraps. Highlights accumulate and are never removed within the scene |
| Scroll down the tweet on "how to create the best ones" | The narration turns to "the rest" (more examples, quantity) | **R11.** When the narration implies "there is more" (examples, a library, a list, "the best ones"), scroll the B-roll 200–250 px with cubic-bezier(.2,0,0,1) over about 1 s, adding vertical motion blur, to reveal more content and social proof (views, likes) |
| Border beam always running; B-roll always playing; captions every 8–23 f | Retention: no dead frames | **R12.** Keep at least one moving element at all times (ambient loop plus one event every 0.3–0.8 s). Never hold a fully static frame longer than about 0.5 s |
| Glitch on the first caption word; stretch on "scratch" | Novelty spikes | **R13.** Use at most one special caption entrance per scene: the glitch-in for the very first word of the video, and a stretch-in for a clause-final punch word. Everything else uses the default entrance |
| 5 blank white frames before the next title (f196–200) | Sentence 2 starts a new idea ("It's called…") | **R14.** At a sentence boundary that introduces a new named thing, hard-cut to blank background for about 5 f (167 ms), then build the next title scene (continuity; analysed by the next segment) |

**Determinism and variety (inferred, for the generator):** the grammar above is fixed, and the variable parts are:
- headline wording
- which phrase goes in the box
- B-roll choice and trim
- which special entrance (if any) gets used
- the scene type (claim vs proof) chosen from the script's semantics

Seed those choices from the transcript, e.g. a hash of the scene text, so a given script always renders the same video while different scripts look different.

---

## 6. Talking-head region, and how it maps to the pixel-art sprite

**What the reference does (f0–f85):**
- **Framing:** medium close-up. Head and shoulders sit in a rounded rectangle (x 38–680, top y 942, radius about 26 px, off the bottom edge, soft dark outer shadow) filled with the real room (sage wall #c4cbbc, blurred door).
- **Pop-out:** the segmented person is composited over the frame, so hair and forehead break above the top edge by about 200 px (hair top y 740–763) onto the light textured background.
- **Camera:** completely static (no zoom, pan or punch-in), confirmed by template tracking. All motion is the speaker's own: sway of ±35 px in x and 23 px in y.
- **Gestures:**
  - hands enter bottom-left at f3 ("Claude") and f27–36 ("professional")
  - eyes close and the head tilts back at f36–40, a satisfied "professional" beat
  - wide smile at f78–85 ("scratch")
- **f86 onward:** the presenter is removed entirely for the proof scene. Nothing replaces him; the B-roll card takes the screen.

**Sprite translation:**
- Build the bottom panel as a rounded rectangle at the same geometry: x 38–680 (5.3–94.4 % W), top 73.6 % H, radius 26 px, shadow `0 0 40px rgba(0,0,0,.2)`.
- Fill it with a flat or pixel-art "room" backdrop (e.g. sage #c4cbbc with a dithered wall) so the pop-out reads.
- Place the transparent sprite PNG over the panel, scaled (nearest-neighbour, integer factor) so the sprite's head crosses the panel top. Target the sprite top at about 58 % H and let the body run off the bottom.
- Add an idle bob of 2–4 px on a 1.6–2 s sine loop to replace the human sway. Snap the bob to whole pixels to stay pixel-art faithful.
- Lip-sync: toggle between each pose's closed and open mouth variant (or talk-small/talk-wide) from the voiceover RMS. Use an open threshold of about −20 dBFS, a 2-frame minimum hold, and talk-wide only on peaks above about −12 dBFS.
- Pose changes are hard swaps aligned to caption-group boundaries, never mid-word. The pose-to-beat mapping:

| Beat (frames) | Script | Reference behaviour | Suggested sprite pose |
|---|---|---|---|
| f0 | (pre-roll) | Smiling at camera | **idle-smile** (closed) |
| f1–24 | "Claude can now build" | Starts talking, small hand gesture f3 | **wave** for the first 6–8 f (greeting on the hook's first word), then **idle** with mouth flaps |
| f26–44 | "full **professional**" | Hands up, eyes close, head tilt | **present-left / present-right** (open palm toward the card above). Swap on the emphasis word |
| f45–66 | "**motion graphics**" | Leans and keeps talking | Hold the present pose, or **point-left/right** toward the card |
| f67–85 | "from scratch," | Big smile | **arms-crossed** (confident) or **idle-smile** on the final frames before the cut |
| f86–195 | Proof scene | Presenter absent | **Hide the sprite** (no fade; it leaves on the hard cut) to match the reference |

General sprite rules:
- **thinking** fits questions or "how" setups.
- **surprised** fits stats, numbers and "now/just" news beats.
- **point-left/right** fits whenever a card or highlight is being referenced.
- Use **arms-crossed** for confident clause-endings.
- Use at most 1 pose change per caption group and at least about 8 frames per pose.
