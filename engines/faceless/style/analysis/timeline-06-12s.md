# Segment 2: 6.0 s to 12.0 s (frames 180 to 359), forensic breakdown

Source: `Ref Video For Editing Style.mp4`, 720x1280 at 30 fps. 1 frame = 33.3 ms. Frame index N = file `f_{N+1:04d}.png`, t = N/30.
For continuity I also measured frames 165 to 179 and 360 to 371.
All positions are in px of 720x1280, with % of width (W) or height (H) in brackets. Colours were sampled from the decoded frames, so H.264 adds about ±3 levels.
Eases come from least-squares fits of GSAP curves to the per-frame measurements. Each fit names its start frame, its duration and its RMS error.
Measurement scripts are in `scratchpad/work/seg2/` (m1-m9, beam, sel, fit2).

The segment contains 4 shots (3 hard cuts, at frames 196, 236 and 323):

| Shot | Frames | Seconds | Layout | Backdrop |
|---|---|---|---|---|
| S1 (began at 86) | ..-195 | ..-6.50 | Full B-roll: browser card showing an X post | Dark grey radial gradient |
| S2 | 196-235 | 6.53-7.83 | "Title reveal": blue label box, product homepage card, product name caption | Flat white #FDFDFD |
| S3 | 236-322 | 7.87-10.73 | Talking head (pop-out) + browser card (blog article) | Light blue-white with leaf shadow and grain |
| S4 (runs to 377) | 323-..| 10.77-.. | Full B-roll: browser card with the prompt text | Very dark warm/brown blur |

Shot lengths in and around the segment are 110 f (S1), 40 f (S2), 87 f (S3) and 55 f (S4). Every cut lands on the first word of a new clause: "It's" at 196, "and" at 236, "each" at 323.

---

## 1. Layer maps

### S1: dark X-post B-roll (frames up to 195)
Bottom to top:

| z | Layer | Box | Notes |
|---|---|---|---|
| 0 | Backdrop | full frame | Static radial grey, about #434343 at the centre (lum 63-71) falling to #2A2A2A at the edges (lum 35-42). A soft black blob on the left edge (x 0-40, y 560-720) reads as a blurred photo element. Frame difference is 0.0, so there is no grain and no motion. |
| 1 | Browser card | x 46-673 (6.4-93.5 %W), y 160-865 (12.5-67.6 %H); 627x705 (87.1 %W x 55.1 %H); centre (360, 513) | macOS Safari chrome with traffic lights, the URL `x.com/p4nthera_/status/…`, a 2 px blue border about #4A8DD2 with a light-blue outer glow (about 4 px, #C0E0FF), and a corner radius of about 14 px. The card is static: its edges do not move by even 1 px between 165 and 195. Its content is a screen recording. The tweet page scrolls up with deceleration (10 px/f at 172 down to 0 at 191, about −60 px in total, roughly power2.out). The embedded gallery video scrolls fast (up to −66 px/f at 179, easing to 0 by 192). |
| 2 | Border beams | on the card border | Two light streaks (border lum about 200 against a base of about 100), each about 120-130 px long, sitting diametrically opposite each other and travelling clockwise. At 186 they sit at right-edge y 230-260 and left-edge y 740-800. At 194 they sit at right-edge y 320-350 and left-edge y 680-710, so they move about 11 px/f. |
| 3 | Caption | centred x≈361, y 930-985 (72.7-77.0 %H) | Bold grotesk in white #F4F8FD with a faint dark drop shadow. Cap/ascender height 51 px, so the font is about 70 px (9.7 %W). The emphasis words "best ones" are bold serif italic in light blue #84BCEC to #8BC0EE. |

### S2: white title reveal (196-235)

| z | Layer | Box (final) | Notes |
|---|---|---|---|
| 0 | Backdrop | full | Flat #FDFDFD with no grain (frame difference 0.0). |
| 1 | Browser card | x 76-643 (10.6-89.3 %W), y 280-733 (21.9-57.3 %H); 567x453; centre (359.5, 506.5) | URL `prompt-motion.com` homepage showing the heading "Prompt Motion", a subtitle, filter chips and thumbnails. 2 px border #4A8DD2, radius 14 px, and a neutral drop shadow under the bottom edge (lum 217 at y 735 fading to 253 by y 765, about 0 10px 30px rgba(0,0,0,.12)). It carries the same two border beams. |
| 1a | UI selection highlight | x 96-272, y 340-367 | macOS text-selection fill #B4D5F4 over the heading "Prompt Motion" inside the screenshot. |
| 2 | Label box | x 202-517 (28.1-71.8 %W), y 160-249 (12.5-19.5 %H); 316x90; centred at x 359.5 | Fill #0082FC, corner radius about 4-5 px, and a blue-tinted soft shadow below it (#AED3EF at y 251, fading out by y 270). It clips its content. |
| 2a | Label text | "It's" at x 216-295; "Called" at x 314-501; y 178-235 | White #F4FBFB bold high-contrast serif italic in Title Case. Glyph height about 55 px, so the font is about 74 px. The left inset is 14 px. Exact face unconfirmed: it looks like Playfair Display / DM Serif Display italic. |
| 3 | Caption | x 134-588 (18.6-81.7 %W), y 775-840 (60.5-65.6 %H) | "Prompt Motion" in near-black #060606, same sans as the other captions, cap height 52 px (M is 774-826), word gap 21 px. It sits 42 px below the card. |

There is no talking head, no cursor and no number in this shot.

### S3: talking head + blog card (236-322)

| z | Layer | Box | Notes |
|---|---|---|---|
| 0 | Backdrop | full | Light blue-white gradient: about #F3EEED at the top right, #E5F3F9 mid-left, #D9E0E2 near the panel. A blurred palm-leaf shadow sits in the top-left (x 0-260, y 0-170) and is static. Animated film grain makes the mean frame difference 0.35-0.6 every frame. |
| 1 | Browser card | x 46-673 (87.1 %W), y 161-622 (12.6-48.6 %H); 627x461 | URL `prompt-motion.com/blog`. The article screenshot is zoomed about 2x, so its body text runs off both sides ("t was copied 33 times…"). The headline "prompts: what 230 real examples show" sits at y≈310-340 with text about 28 px. The content is completely static (phase correlation between 236 and 322 gives 0.0 px). Two border beams run clockwise at 9 px/f (270 px/s). The top beam's leading edge goes x 86 (242) → 140 (248) → 248 (260) → 354 (272) → 462 (284) → 570 (296) → 650 (305), then turns the corner. |
| 1a | Highlight ring | x 274-355 (38.1-49.3 %W), y 292-357 (22.8-27.9 %H) | Rounded-rect stroke of about 3 px in #138DF1, radius about 8 px, around "230" in the headline. |
| 1b | Counter callout | pill x 238-482 (33.1-66.9 %W), y 432-608 (33.8-47.5 %H); 244x176 | White pill with a 1 px light-grey edge (#E3E3E3) and a soft shadow. Digits "230" are at x 274-451, y 463-537 (glyph height 75 px, so the font is about 103 px) in #0683F5 bold sans. The label "real examples" is at x 267-453, y 562-589, about 27 px semibold in #7B7B7C. It covers the third text line of the card. |
| 1c | UI selection highlight | line 3: x 56-425, y 421-456 | #A9D3F6 over "230 real Claude prompts". |
| 2 | Caption | centred x≈361, y 676-728 (52.8-56.9 %H) | Near-black #08090C. Emphasis: the number "230" in #0C81F0 sans, and "animated" in serif italic #1A86F0. The caption sits 54 px under the card and about 20 px above the hair. |
| 3 | A-roll panel | x 38-681 (5.3-94.6 %W), top y 945 (73.8 %H), bleeds off the bottom | Rounded rect with a corner radius of about 88 px. The left edge measures 126 at y 940, 66 at 965, 46 at 1000 and 42 at 1025. Soft dark halo shadow about 25 px. Inside is the real room (#C5CCBB wall, door handle at x 136-154, y 1132-1151). The handle does not move all scene, so the A-roll has no zoom, push-in or reframe. |
| 4 | Person cutout | hair top y 744-757 (58.1-59.1 %H); head spans about x 200-560; shoulders bleed off the bottom | The segmented person is composited above the panel, so the head breaks out about 190 px (15 %H) over the panel's top edge onto the backdrop. |

### S4: dark warm prompt card (323-377)

| z | Layer | Box (settled) | Notes |
|---|---|---|---|
| 0 | Backdrop | full | Heavily blurred, very dark warm image (#130505 to #1C0A06, with faint grid or bokeh structure). It has grey gradient bands at the top (#494949 at y 60, gone by y≈130) and bottom (#292929 at y 1270). It is static once the zoom settles. |
| 1 | Browser card | x 46-673, y 161-865 (same frame as S1) | URL `prompt-motion.com/stephanlivera-df17a2` showing a prompt detail page (chips, an orange "A stronger version of this prompt" banner, the prompt text in a grey box, Model / Effort rows). |
| 1a | UI selection highlight | prompt lines at y 552-583, 596-625, 636-665 | #AACAEA. |
| 2 | Caption | centred, y 928-980 (72.5-76.6 %H) | White #F4F8FD, as in S1. The emphasis "prompt" is serif italic in light blue #85B9E3. |
| ALL | Scene container | | Layers 0-2, including the caption, scale together from 1.15 to 1.0 about (360, 641). I confirmed this by warping frame 357 by 1.15 about (360, 641): it matches frame 323 with a backdrop error of 1.0 against 7.2 unwarped. |

---

## 2. Event log (chronological)

Spoken words are `words.json` start-end frames. Where the audio envelope disagrees with them by more than 3 frames, that is noted.

| Frames | Time (s) | Spoken | Element | What changes | Measured | Ease (GSAP) | Notes |
|---|---|---|---|---|---|---|---|
| 165-172 | 5.50-5.73 | "how to create" | Caption | Group "how to create" held | x 152-571 | — | Pre-segment. |
| 172-191 | 5.73-6.37 | "the best ones" | S1 card content | Tweet page scrolls up | dy per frame −10, −9, −7, −7, −6, −5, −5, −3.5, −3.5, −3, −3, −2, −2, −1, −1, −1, −1, 0 | ≈power2.out, 20 f | Screen-recorded scroll. The card frame itself never moves. |
| 173 | 5.77 | "create" ends | Caption | Group cleared, 1 blank frame | — | cut | Blank gap between groups. |
| 174-176 | 5.80-5.87 | "the" (175.8) | Caption "the" | Fades in and rises | colour #B8C0C7 → #D9DEE7 → #F3F7FD; top y 934 → 930 | power3.out about 3-4 f | Shown 1.8 f before the word. The group is laid out centred for its final width (the word sits at x 180-280, not at the centre). |
| 175-191 | 5.83-6.37 | | Embedded gallery video in card | Fast vertical scroll | up to −66 px/f (179), decelerating to 0 at 192 | ≈power2.out | Part of the B-roll recording. |
| 178-180 | 5.93-6.00 | "best" (180) | Caption "best" (serif italic, light blue) | Fades in and rises | #7BA2C7 → #8BB5DD → #A2CBF0; y 934 → 931 | about 3 f | 2 f lead. |
| 183-185 | 6.10-6.17 | "ones" (184.8) | Caption "ones" | Fades in | group now x 180-541 (centre 360) | about 2-3 f | 1.8 f lead. |
| 186-194 | 6.20-6.47 | (pause 190-196) | Border beams S1 | Travel clockwise | right beam y 230 → 350, left beam y 770 → 680, about 11 px/f | linear, endless | |
| 195 → 196 | 6.50 → 6.53 | "It's" onset (audio 196) | Whole frame | **Hard cut** to empty white #FDFDFD | every pixel 253 | cut | Lands on the exact audio onset. All S1 layers end on the cut, including the caption. |
| 196-200 | 6.53-6.67 | "It's" | White stage | Blank hold | 5 f = 167 ms | — | A deliberate breath before the build. |
| 201-215 | 6.70-7.17 | "called" | Label box | Width reveal left to right, left edge pinned at x 202, full height from frame 1 | width 16, 90, 158, 201, 232, 254, 271, 284, 294, 302, 308, 312, 314, (215) 316 | **expo.out, 21 f (700 ms)**, start 200.7 (rms 0.016); power4.out 17 f fits almost as well | The box is pre-positioned centred and revealed by width/clip, not scaleX. Its content is clipped at the moving right edge: "Called" is cut off at frame 208. |
| 202-205 | 6.73-6.83 | "called" | S2 card | Opacity 0 → 1 | darkest card pixel 221 → 157 → 91 → 0, so opacity ≈ .12, .37, .64, 1 | about 4 f, power2.in | |
| 202-216 | 6.73-7.20 | | S2 card | Scale up about its centre | width ≈514 → 527 → 535 → 543 → 549 → 553 → 557 → 559 → 563 → … → 567, so scale ≈0.89 → 1.0 (the start of about 0.86 is extrapolated) | **power3.out about 16 f (530 ms)**, start 202.5 (rms 0.020) | Grows from a smaller size, no overshoot. |
| 205-208 | 6.83-6.93 | "called" | Label word "It's" | Blur-in inside the box | blurred at 205, partly sharp at 206 (max R 188), sharp at 208 | about 3 f | Lags the spoken word by 8 f because it waits for the box. |
| 208-212 | 6.93-7.07 | "Prompt" | Label word "Called" | Blur-in, clipped by the growing box | sharp by 211-212 | about 3-4 f | 3-frame (100 ms) stagger after "It's". |
| 211-217 | 7.03-7.23 | "Prompt" (207.6; audible burst about 210) | Caption "Prompt" | Opacity, blur and rise | opacity .39, .66, .79, .91, .94, .98, 1; top y 788 → 782 → 779 → 777 → 776 → 775 (**13 px rise**); about 5 px blur at 211, gone by 214 | opacity power4.out 9 f; y expo.out 12 f | The rise is larger than on every other caption in the segment (2-4 px elsewhere). |
| 212-220 | 7.07-7.33 | "Prompt Motion" | UI selection in S2 card | Selection sweeps over "Prompt Motion" | right edge 163, 206, 234, 247, 259, 265, 269, 271, 272 (start x 96) | **expo.out 14 f (467 ms)**, start 212 (rms 0.010) | Starts 1 f after the caption word. Simulates a mouse drag-select with no cursor drawn. |
| 214-219 | 7.13-7.30 | "Motion" (214.8) | Caption "Motion" | Same entrance as "Prompt" | #9B9B9B → #5D5D5D → #353535 → #1A1A1A → #141414 → #0D0D0D; y 788 → 774 | as above | 0.8 f lead. |
| 216-235 | 7.20-7.83 | (pause 222-231), "and" | S2 hold | Only the border beams move | right beam y 433 → 621, left beam y 591 → 315 | linear | Held 9 f past the end of "Motion". |
| 235 → 236 | 7.83 → 7.87 | "and" (231.6, audio about 232) | Whole frame | **Hard cut** to the S3 layout | card, panel and person fully present at 236; no entrance motion | cut | Cut 4 f after "and" starts, on the clause boundary. |
| 236-240 | 7.87-8.00 | "and" | Caption "and" | Fades in from the cut | #56585B → #232426 → #131516 → #0D0E10 → #090B0D; y 679 → 677 | power3.out about 4 f | |
| 240-242 | 8.00-8.07 | "it" (234.6) | Caption "it" | Fades in | #909295 at 240, full by 242 | about 3 f | Group "and it": x 280-443. |
| 243-247 | 8.10-8.23 | "is" (237; audio about 239) | Caption | **Group swap**: "and it" cut out, "is" fades in | opacity .39, .66, .88, .93, .98; y 679 → 676; blurred at 243 | power2.out to power4.out, 5-8 f, start 242 (rms 0.017) | New group "is over 230" is laid out centred at x 199-525. |
| 249-252 | 8.30-8.40 | "over" (240; audio about 248) | Caption "over" | Fades in | #919496 → #57595C → #282A2C → #121416 | about 4 f | |
| 253-259 | 8.43-8.63 | "230" (247.2; audio loud from 252) | Caption "230" in accent blue | **Stretch-in**: left edge pinned at x 408 while the right edge contracts; blur; ghost double image at 253 | right edge 561 → 547 → 537 → 531 → 529 → 527 → 525 (width 153 → 117, so scaleX ≈1.31 → 1); saturation 106 → 250 → 255 | power3.out about 6 f, transform-origin left | Numbers get this extra horizontal stretch and ghosting; plain words do not. |
| 254-257 | 8.47-8.57 | "230" | Ring in card | **Stroke draw-on** around "230" | 254: right side drawn; 255: bottom; 256: left side; 257: closes along the top | about 4 f (133 ms), ≈linear | Starts at the top-right corner and runs clockwise. Starts 1 f after the caption. |
| 256-273 | 8.53-9.10 | "230" | Counter digits | **Fly-out from the ring**: scale and translate from the ring to the callout position | digit width 72 → 89 → 105 → 115 → 129 → 139 → 145 → 156 → 161 → 166 → 169 → 171 → 173 → 175 → 176 → 177 (scale ≈0.3 → 1); centre x 324 → 338 → 350 → 354 → 358 → 360 → 362; centre y about 368 → 500 | **power3.out 19 f (633 ms)**, start 256 (rms 0.012) | The source is the ring centre (314, 324); the target centre is (362, 500). |
| 257-271 | 8.57-9.03 | "230" | Counter digits | **Odometer roll**: each digit column scrolls vertically with motion blur | legible readings: 087 (258), 080 (259), 104 (261), 116 (262), 117 (263), 228 (264-265), 229 (266-267), 230 (268, still rolling); lands on 230 at about 271 | ease-out | The hundreds column steps 0 → 1 → 2; the ones column spins several cycles. |
| 258-264 | 8.60-8.80 | "230" | Talking head | The real person raises a hand into the lower left of the panel | hand enters x≈45-100, y 1150-1280 | — | Natural gesture on the number. |
| 264-275 | 8.80-9.17 | "230" / "animated" | Counter pill | Background card appears: opacity ramps 264-268, already at about 85 % size, then grows and settles with the digits | pill bottom 570 → 580 → 587 → 593 → 597 → 599 → 601 → 603 → 604 → 605 | expo.out, about 20 f from 261.5 (rms 0.007) | It turns opaque over the article text line underneath. |
| 268-272 | 8.93-9.07 | "animated" (268.8) | Caption | **Group swap**: "is over 230" cut, "animated" (serif italic blue) fades in | max saturation 109 → 165 → 231 → 254; top y 678 → 674; width 291 → 297 (scale .98 → 1) | power3.out about 4 f | New group "animated videos" at x 128-591. |
| 282-286 | 9.40-9.53 | "videos" (283.2) | Caption "videos" | Fades in | #909293 → #5C5F62 → #252729 → #1A1C1E → #0D0F10; y 676 → 673 | about 4 f | |
| 291 | 9.70 | "videos" ("s" still audible to about 297) | Caption | Group cleared, 1 blank frame | — | cut | |
| 291-296 | 9.70-9.87 | "videos" / "made" | Counter callout and ring | **Exit**: opacity drops, blur rises, slight upward drift | digit saturation 255 → 250 → 222 → 153 → 109 → 51 → 32 (opacity ≈1, .98, .85, .54, .35, .09, 0); digits top 460 → 454, bottom 535 → 525; ring pixels 1164 → 1107 → 1001 → 695 → 0 (gone at 294) | about 5-6 f, sine.out | The exit coincides with the next caption group starting. |
| 292-296 | 9.73-9.87 | "made" (297; audio about 299) | Caption "made" | Fades in | #8D9093 → #5E6063 → #27292B → #1A1C1E → #080B0C | about 4 f | Caption leads the audio by about 5-7 f here. |
| 299-309 | 9.97-10.30 | "with" / "Claude" | UI selection, card line 3 | Selection over "230 real Claude prompts" | right edge 195, 287, 343, 375, 395, 407, 415, 421, 423, 425 (start x 56) | **expo.out 14 f**, start 299 (rms 0.006) | Echoes the spoken "made with Claude" with the matching on-screen phrase. |
| 300 | 10.00 | | Global | Subtle tone shift across the whole frame | mean difference about 2 levels in every band | cut? | Probably a cut in the A-roll or backplate; it is imperceptible. |
| 300-302 | 10.00-10.07 | "with" (303.6) | Caption "with" | Fades in | grey to black in about 3 f | about 3 f | |
| 304-309 | 10.13-10.30 | "Claude" (311.4; "k" burst at 312) | Caption | **Group swap with glitch**: "Claude" alone | ink ratio relative to clean: 1.17, .33, 1.15, .84, .45, 1.09, then 1.0 from 310; blue fringe on the left and red on the right, about 6-9 px; horizontal slice jitter about ±6 px; ghost duplicates | 6 f stepped keyframes (no tween) | Clean at 310. Leads the spoken word by about 7 f. |
| 310-322 | 10.33-10.73 | "Claude" | Hold | Beams run; the person talks | — | — | |
| 322 → 323 | 10.73 → 10.77 | "each" (322.8, audio 323) | Whole frame | **Hard cut** to S4, which starts zoomed in | card at 323: x ≈−1 to 721, y 89-899 (scale 1.15) | cut | Exactly on the word onset. |
| 323-358 | 10.77-11.93 | "each … used" | Whole S4 scene (backdrop, card and caption) | **Zoom-out settle** 1.15 → 1.0 about (360, 641) | scale by frame: 1.151, 1.151, 1.146, 1.142, 1.138, 1.129, 1.112, 1.095, …, 1.068 (332), 1.048 (334), 1.037 (336), 1.026 (338), 1.020 (340), 1.014 (342), 1.010 (344), 1.007 (346), 1.004 (349), 1.001 (353), 1.000 (356) | **cubic-bezier(0.35, 0, 0, 1) over 36 f (1.2 s) from 322** (rms 0.009, against 0.020 for the best stock ease). The closest stock ease is expo.out 44 f delayed to 327. | Slow start (2 held frames), fastest at 328-331 (about 0.017 scale per frame), long tail. |
| 323-330 | 10.77-11.00 | "each" | Caption "each" | Appears at full opacity on the cut, then rides the zoom (shrinks and rises) | x 190-358, top y 973 → 958 | (zoom) | |
| 326-330 | 10.87-11.00 | "with" (325.8) | Caption "with" | Fades in | #BABEC6 → #DEE2E8 → #EEF4F8 | about 3 f | Group "each with" at x 190-530. |
| 331 | 11.03 | | Caption | Group cleared, 1 blank frame | | cut | |
| 332-335 | 11.07-11.17 | "the" (330.6) | Caption "the" | Fades in | #B5BDC5 → #D7DDE5 → #F1F6FB | about 3 f | Group "the exact prompt" at x 112-611. |
| 333-360 | 11.10-12.00 | "the exact prompt used" | UI selection over the 3-line prompt | One continuous sweep along the text, line by line | line 1: x→347 (333), →599 (334), full (335); line 2: 203 (335), 375, 517, 628, full (339); line 3: 121 (339), 194, 255, 307, 349, 377, 405, 427, 447, 459, 471, 481, 489, 495, 501, 505, 509, 511, 513, 515, 516 (360) | **expo.out 34 f (1.13 s)** on cumulative text length, start 332 (rms 0.004) | Lines 1-2 go at about 150-290 px/f; line 3 decelerates. |
| 336-338 | 11.20-11.27 | "exact" (333.6) | Caption "exact" | Fades in | #B8BEC6 → #DEE1E8 → #F1F6FB | about 3 f | |
| 343-345 | 11.43-11.50 | "prompt" (344.4) | Caption "prompt" (serif italic light blue) | Fades in and rises | top y 942 → 940 → 938 | about 3 f | 1.4 f lead. |
| 351-353 | 11.70-11.77 | "used" (354) | Caption | **Group swap**: "used" fades in | #BAC1C8 → #DBE0E9 → #F4F7FC; y 933 → 930 | about 3 f | |
| 357-358 | 11.90-11.93 | "to" (360.6) | Caption "to" | Fades in | #B8BEC7 → #DCDFE9 | about 3 f | |
| 359 | 11.97 | | Caption | Group cleared, 1 blank frame | | cut | Then "create" at 360 and "it." at 368 (continuity). |

No cursor is drawn, there is no flash frame, no whip and no cross-dissolve anywhere in 165-371. Every visual-state change is either a hard cut or an in-scene tween.

---

## 3. Caption behaviour

**Groups in this window.** Brackets show the frames on screen.
`[the best ones]` 174-195 · `[It's Called]` (label box, not the caption track) 201-235 · `[Prompt Motion]` 211-235 · `[and it]` 236-242 · `[is over 230]` 243-267 · `[animated videos]` 268-290 · `[made with]` 292-303 · `[Claude]` 304-322 · `[each with]` 323-330 · `[the exact prompt]` 332-350 · `[used to]` 351-358 · `[create it.]` 360-…

**Chunking rules (inferred).**
- Groups hold 1-3 words, usually 2.
- A group breaks at punctuation: "ones." "Motion," "Claude," "it."
- An emphasised term closes its group ("…best ones", "…230", "…prompt") or opens it ("animated …").
- A third-party brand name gets a group of its own ("Claude").
- A scene cut always starts a new group.

**Layout.**
- Each group is laid out centred on x≈361 at its final width, and words reveal in place, so the first word appears off-centre. For example, "the" sits at x 180-280 because "the best ones" will span 180-541.
- The font size is constant across all groups: cap height 51-52 px at 720 W, so the font is about 70-72 px (≈9.8 %W; ≈106 px at 1080 W).
- The word gap is about 21 px (0.3 em).
- One line only.
- Vertical placement is 42-65 px below the bottom edge of the browser card in every layout: 775 in S2, 676 in S3, 928-930 in S1 and S4.

**Colour by backdrop.**
- Light backdrops: near-black #060606 to #090B0D.
- Dark backdrops: white #F4F8FD with a soft dark shadow.
- Accent: #0082FC family on light, light blue #84BCEC to #8BC0EE on dark.

**Word entrance (all plain words).** Each word fades from about 35-40 % opacity on its first frame to 100 % within 3-5 frames. It starts with about 4-6 px gaussian blur that clears in about 3 frames, and rises 2-4 px.
- GSAP: `from {opacity:0, filter:'blur(6px)', y:4} to {opacity:1, blur:0, y:0}, duration ≈0.17-0.2 s, ease 'power3.out'`.
- On the title card S2 the same entrance has a 13 px rise (`y:13`, expo.out 0.4 s).

**Emphasis styles.**

| Kind | Example | Style | Entrance |
|---|---|---|---|
| Evaluative / descriptor word | "best ones", "animated", "prompt" | Bold serif italic, accent colour. Light blue on dark backdrops, saturated #1A86F0 on light ones. | Same blur-fade as plain words. "animated" also scales 0.98 → 1. |
| Number | "230" | Same sans, accent #0A84F5 (no serif) | **Stretch-in** from a left origin (scaleX ≈1.3 → 1) plus blur and a ghost image, about 6 f, power3.out. |
| Third-party brand | "Claude" | Plain sans, black | **Glitch**: 6 stepped frames of RGB split (blue left, red right, 6-9 px), slice jitter and opacity flicker (1, .33, 1, .85, .45, 1), then clean. |
| Product being named | "Prompt Motion" | Plain black sans on the white title card | Bigger rise (13 px). Echoed by the UI selection highlight. |
| Lead-in phrase | "It's called" | Moved out of the caption track into a blue **label box** with white serif italic in Title Case | Box width wipe (expo.out 0.7 s), words blur in staggered by 3 f. |

**Word timing.** Lead (−) or lag (+) in frames, caption appearance minus `words.json` start:
- S1 (the, best, ones): −1.8, −2, −1.8.
- S2 (Prompt, Motion): +3.4, −0.8. The label words "It's" and "Called" lag by +8 and +6 because they wait for the white hold and the box wipe.
- S3 (and, it, is, over, 230, animated, videos, made, with, Claude): +4.4, +5.4, +6, +9, +5.8, −0.8, −1.2, −5, −3.6, −7.4.
- S4 (each, with, the, exact, prompt, used, to, create, it.): +0.2, +0.2, +1.4, +2.4, −1.4, −2.4, −3.6, −6.6, −5.2.

Whisper word starts in this region are off by up to about 0.2 s. Against my audio-envelope onsets ("and" ≈232, "over" ≈248, "230" ≈252, "made" ≈299, "with" ≈304, "Claude" ≈311-312), the "and…230" run lags only +1 to +4 f, while "made with Claude" leads by 4-7 f. The median is about −1 f.

Practical rule: show each word **1-2 frames before** its spoken start. The first word of a new group may lead by up to 5 frames when the previous group's last word is a long one. After a hard cut, the first word starts its fade on the cut frame.

**Exit.** A group never animates out. It is hard-cut, either replaced on the same frame by the next group's first word or followed by a 1-frame blank (at 173, 291, 331 and 359). At scene cuts the caption is removed with the scene.

---

## 4. Transition catalogue

| # | Frames | Duration | Technique | Measured details |
|---|---|---|---|---|
| T1 | 195 → 196 | 1 f | **Hard cut to empty white stage** | From the dark S1 to pure #FDFDFD on every pixel, with no fade and no flash ramp. A 5 f blank hold (196-200) follows. |
| T2 | 201-216 | 15-21 f | **Title build on white** (in-shot) | Label box width wipe from the left: expo.out 21 f. Card opacity 0 → 1 in 4 f. Card scale ≈0.86 → 1: power3.out 16 f, starting 1.5 f after the box. Label words blur in at +4 f and +7 f. |
| T3 | 235 → 236 | 1 f | **Hard cut** into the talking-head layout | Every layer is at rest on the first frame; only the caption fades. |
| T4 | 254-275 | 21 f | **Callout pop-out** (in-shot) | Ring stroke draw-on 4 f, then digits fly out from the ring (power3.out 19 f, scale 0.3 → 1), odometer roll, and the pill background fades in at 264. |
| T5 | 291-296 | 5-6 f | **Callout exit** (in-shot) | Opacity 1 → 0, blur 0 → about 8 px, y −6 to −10 px. sine.out or linear. The ring fades in 3 f. |
| T6 | 322 → 323-358 | cut + 36 f | **Hard cut into a zoomed-in scene, then a zoom-out settle** | The whole S4 composition starts at scale 1.15 (held 2 f) and eases to 1.0 about (360, 641) with cubic-bezier(0.35, 0, 0, 1) over 1.2 s. The caption is inside the zoomed container. The outgoing shot does not zoom (S3 card static 318-322). |
| — | throughout | ∞ | **Border beams** (ambient) | Two diametrically opposite light streaks of about 125 px circle every browser card clockwise at 9-11 px/f, linear. |

None of these occur in 165-371: whip pans, slides, cross-dissolves, flash frames, mask wipes between shots, or chromatic effects outside the "Claude" glitch.

---

## 5. Editorial logic, with reusable rules

| Beat (script) | Visual decision | Why | Reusable rule (any topic) |
|---|---|---|---|
| "…how to create **the best ones**." | Dark B-roll of the source (X post) stays up. "best ones" is in serif italic light blue. | Evaluative claim; the evidence is on screen. | **R1 Value words:** mark the single evaluative or superlative phrase of a clause (best, only, secret, fastest, exact…) with serif bold italic in the accent colour. At most one emphasis span per group. |
| End of sentence, then "**It's called** Prompt Motion" | Hard cut on "It's" to a blank white stage, 5 f hold, a blue label box "It's Called" wipes in at the top, and the product's own homepage card scales in under it. | A naming or reveal moment needs a reset and a clean stage. White is the brightest change from the dark previous shot. | **R2 Reveal card:** on reveal phrases ("it's called", "introducing", "meet", "this is", "the tool is"), cut to white. Put the lead-in phrase in Title Case in an accent label box (expo.out width wipe) and the entity's screenshot below (fade plus 0.86 → 1 power3.out). Show the entity's name as the big black caption under the card. |
| "…**Prompt Motion**" | The name in the screenshot gets selection-highlighted as it is said. | Ties the spoken name to the visible UI. | **R3 On-screen echo:** if spoken words exist as text in the current B-roll, sweep a macOS-style selection (#A9D3F6 / #B4D5F4) over that text, starting within 0-2 f of the caption word. Use expo.out about 0.45 s for one line, and one continuous expo.out about 1.1 s across a multi-line passage. |
| "and it is over **230** animated videos" | Cut back to the talking head with a supporting article card whose headline contains "230". The caption "230" is blue with a stretch-in. A ring draws around "230" in the card, then a counter flies out of the ring, rolls up to 230 with the label "real examples", holds, and exits when the next phrase starts. | Stats are the most persuasive beat. The speaker delivers the claim on camera (credibility) while the card proves it. The ring-to-callout motion draws the eye from the claim to its source. | **R4 Number beat:** a number in the script gets (a) the number caption in the accent colour with a stretch-in, (b) if the number appears in the B-roll, a 4 f ring draw-on around it, and (c) a callout pill launched from that spot (power3.out 0.63 s, scale 0.3 → 1) that odometer-rolls from 0 to the value, with a 1-3 word unit label taken from the noun that follows the number. Hold until the next caption group after the noun phrase starts, then fade and blur out in about 0.18 s. |
| "**animated** videos" | Serif italic accent on "animated" only. | It is the descriptor that differentiates the offering. | R1 again: the adjective that defines the category, not the generic noun. |
| "made with **Claude**," | The matching phrase "230 real Claude prompts" is highlighted in the card. "Claude" appears alone with an RGB-split glitch. | Brand or tool names get a techy, attention-grabbing treatment, and a solo slot makes the name land. | **R5 Brand glitch:** a third-party product, tool or company name gets a solo caption group with a 6-frame glitch entrance. Reserve it for brand names: about 1 per 10 s, never two in a row. |
| "each with **the exact prompt** used to create it." | Hard cut on "each" to a dark warm scene with the actual prompt page, entering with a 1.15 → 1.0 zoom-out settle. The whole prompt is selection-swept while "the exact prompt" is said, with "prompt" in serif italic. | It shows the deliverable itself, the proof of "exact". The zoom-out reads as "pulling back to reveal". | **R6 Detail reveal:** when the script names the specific deliverable or artifact, cut to a full B-roll card of it on a dark backdrop, with a zoom-out settle, and sweep-select its key text. |
| Shot rhythm | Cuts at 196 ("It's"), 236 ("and"), 323 ("each"). Shots run 40-110 f. | Cuts on clause starts keep the edit in step with the speech. | **R7 Cut grid:** cut only on the first word of a sentence or clause (0-5 f after its onset). Aim for 1.3-3.7 s shots and never hold a shot past about 4 s. |
| Backdrop rotation | Dark grey, then white, then light blue with the talking head, then dark brown. | Each cut changes overall brightness, which makes the cut snap. | **R8 Backdrop alternation:** consecutive shots must differ strongly in backdrop luminance (dark ↔ light). Light blue plus grain plus leaf shadow is reserved for talking-head shots; white is reserved for reveal cards; dark neutral or warm blurs are for evidence and detail B-roll. |
| Talking head vs full B-roll | The person appears only for the claim sentence ("and it is over 230 … made with Claude"). Explanation, naming and evidence beats are full B-roll. | The face sells claims; screens explain. | **R9 Face for claims:** show the speaker in assertion or stat sentences (first person, numbers, opinions). Hide them for show-and-tell beats. |
| Ambient motion | Border beams on every card, grain on the light scene, screen-recorded scrolls. Cards never drift or Ken-Burns. | Keeps still screenshots alive without fighting the captions. | **R10 Ambient:** every browser card has two clockwise border beams (≈300 px/s). If a card's content is a static screenshot, it may get one slow decelerating scroll (power2.out) but no frame drift. |

---

## 6. Talking-head region and the pixel-sprite translation

**What the reference does (S3, frames 236-322).**
- Layout: the browser card is on top (y 161-622), the caption sits in the gap (676-728), and the A-roll occupies the bottom 26 % in a rounded panel (x 38-681, top 945, radius about 88 px, soft shadow) that bleeds off the bottom edge.
- The person is segmented and drawn above the panel. The head breaks out about 190 px above the panel top (hair at y≈745-757, 58-59 %H), the face is centred at x≈360, and the shoulders leave the frame at the bottom.
- The panel holds the real room as background (sage-grey wall, door handle).
- Framing is completely static for the whole 2.9 s: no punch-in, zoom or reframe (door handle fixed to ±1 px). The only motion is the person.
- Performance: head tilt with eyes closed on "and it is" (236-250). Straight to camera from "over" (≈250). A hand gesture rises in the lower left on "230" (258-264). Neutral talking delivery through "animated videos made with Claude".
- The talking head is absent from S1, S2 and S4: full B-roll beats have no person at all.
- Framing changes happen only at cuts. S3 is the only talking-head shot in this window. Elsewhere in the video (overview sheet) there are full-screen talking-head shots at about 20.5 s and 27 s, but none in 6-12 s.

**Sprite translation.**
- Panel: build the same rounded panel (radius ≈12 %W, x 5.3-94.6 %W, top 73.8 %H, bleeding off the bottom). Fill it with a pixel-art room backdrop or a soft two-tone gradient (#C5CCBB-like sage), with a 25 px soft shadow.
- Sprite placement: draw the sprite on a layer above the panel, scaled so the head is about 300-360 px wide at 720 W. Place it so the top of the head sits at ≈58 %H, about 190 px above the panel top, and the torso is cut by the frame bottom. Keep the sprite's pixel grid crisp: integer scale, `image-rendering: pixelated`.
- No camera motion on the sprite panel. Give the sprite life with pose swaps on beats plus a 1-2 px idle bob (sine.inOut, about 1.2 s period), which the real footage has naturally.
- Mouth: switch closed and open variants from the voice-over RMS. In this audio speech sits at −9 to −20 dBFS and gaps at −30 to −45 dBFS, so open the mouth above about −22 dBFS, with a minimum hold of 2 frames to avoid flicker. Use talk-wide when RMS is above about −13 dBFS and talk-small between −22 and −13.

| Frames | Spoken | Reference performance | Sprite pose suggestion |
|---|---|---|---|
| 236-250 | "and it is over" | Head tilted, eyes half-closed, casual | `idle` with talk-small mouth flaps; optionally `thinking` for 4-6 f on "and" |
| 250-268 | "230" | Eyes to camera, hand comes up (258-264) | `present-right` with mouth open on "two hundred", then `surprised` for about 6 f as the counter lands (≈270) |
| 268-290 | "animated videos" | Neutral delivery | `idle` with talk-wide on the stressed syllables ("AN-i-mat-ed VID-eos") |
| 291-303 | "made with" | Neutral | `point-left` or `present-left` toward the card text being highlighted (line 3 is left-aligned) |
| 304-322 | "Claude," | Neutral, small nod | `idle-smile` (hold the closed mouth after "Claude," during the 319-322 pause) |
| S1, S2, S4 | B-roll beats | Person absent | Hide the sprite completely, as the reference does. Do not keep a corner sprite. |

**Generalised sprite rules.**
- Numbers and stats: `present-left` or `present-right` (open palm toward the card), followed by `surprised` as the callout lands.
- Naming or product beats while visible: `point-left` or `point-right` toward the highlighted UI text.
- Reflective lead-ins ("and it", "so", "here's the thing"): `thinking`.
- End of a claim or comma pause: `idle-smile` or `arms-crossed` (confident).
- Alternate the side of present and point gestures between consecutive beats so the sprite does not repeat.

---

## Quick spec (HyperFrames / GSAP), all values at 720x1280; multiply by 1.5 for 1080x1920

- Card grid: x 46-673, top 160. In talking-head shots the bottom is 622; in full B-roll shots it is 865. 2 px #4A8DD2 border, radius 14, outer glow #C0E0FF 4 px.
- Border beam: two `conic`/linear-gradient streaks, about 125 px long and peak lum ≈200, orbiting the border at 300 px/s with `ease:'none', repeat:-1`, phase-offset by half the perimeter.
- Caption word: `{opacity:0, filter:'blur(6px)', y:4}` to rest, 0.18 s, `power3.out`. The title-card caption uses y:13, 0.4 s, `expo.out`. Show each word 2 f before its timestamp. Groups hard-cut out.
- Number caption: add `scaleX:1.3, transformOrigin:'left center'`, 0.2 s, `power3.out`.
- Brand glitch: 6 stepped frames with opacity [1, .33, 1, .85, .45, 1], RGB-split ±7 px, slice jitter ±6 px, then clean.
- Label box: width 0 → auto, 0.7 s `expo.out`, `overflow:hidden`. Words blur in staggered by 0.1 s. Fill #0082FC, radius 5, shadow `0 8px 20px rgba(0,130,252,.25)`.
- Title-card card: opacity 0 → 1 over 0.13 s, scale 0.86 → 1 over 0.53 s `power3.out`, starting 0.05 s after the box.
- Ring: SVG rounded rect with stroke 3 px #138DF1, `strokeDashoffset` full → 0 over 0.13 s linear, starting at the top-right corner and running clockwise.
- Counter callout: FLIP from the ring rect to the pill rect, 0.63 s `power3.out`. Odometer columns roll for 0.5 s. Pill background opacity 0 → 1 over 0.13 s at +0.27 s. Exit 0.18 s: opacity 0, blur 8 px, y −8.
- Selection sweep: #A9D3F6 rect width 0 → text width, 0.47 s `expo.out` for one line. Multi-line: drive one cumulative-length tween, 1.13 s `expo.out`.
- Dark-scene entrance: scene root `scale 1.15 → 1`, 1.2 s, `CustomEase "M0,0 C0.35,0 0,1 1,1"`, with a 2-frame hold at 1.15.
