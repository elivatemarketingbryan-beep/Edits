# Segment 3 — 12.00 s to 18.00 s (frames 360–539), frame-accurate breakdown

Conventions: frame index `i` = file `f_{i+1:04d}.png`, t = i/30. Positions are px of 720×1280, with % of width (x) or height (y). Durations are given as frames, with ms in brackets (1 f = 33.3 ms). "Ink/opacity" values come from integrating darkness against the local background, which is blur-invariant, so they measure true opacity. Blur σ, y-offset and scaleX come from least-squares fits of each frame against the word's settled frame. Easing names are GSAP approximations fitted to those per-frame curves.

Spoken words: `words.json` (whisper) start times, converted to frames. I also checked onsets against the audio envelope and a low/high-band spectral split. Whisper is within about ±3 f of the acoustic onsets everywhere except "to create it" (dark scene), which is ambiguous.

| word | whisper start (s → f) | acoustic onset est. (f) |
|---|---|---|
| to / create / it. | 12.02→360.6 / 12.22→366.6 / 12.44→373 | voiced 357–364, dip 365–368, voiced 369–373 (ambiguous) |
| Inside, | 12.62→378.6 | **378** (−42 dB at 377 → −14.6 dB at 378) |
| you'll / get | 12.98→389 / 13.10→393 | 389 / 392–393 |
| prompts | 13.22→397 | 397 ("ts" sibilant 404–407) |
| for / all / launch | 13.48→404 / 13.70→411 / 13.80→414 | ~408 / ~413 / ~415 ("ch" 420–423) |
| videos, | 14.04→421 | 424 ("z" 433–435), pause 436–437 |
| product / videos, | 14.56→437 / 14.82→445 | 438 / 447 ("z" 459–461), pause 462–463 |
| demos, | 15.46→464 | 464 ("s" 476–478) |
| mobile / app / walkthroughs, | 16.04→481 / 16.18→485 / 16.48→494 | ~479 / ~488 / 494 (silence 511–513) |
| all / charts, | 17.14→514 / 17.30→519 | 514 / 519 ("ts" 528–530) |
| and / much / more. | 17.76→533 / 17.92→538 / 18.08→542 | ~531 / ~537 / ~544 |

---

## 1. Layer map

Two layouts appear in this segment. **Layout D** ("dark full B-roll", 360–377) is the tail of the previous scene. **Layout L** ("light split", 378–539) starts with a hard cut at 378.

### Layout D (frames 360–377), bottom to top
| z | layer | bbox px | bbox % | notes |
|---|---|---|---|---|
| 0 | Dark backdrop | full frame | 100% | Heavily blurred, darkened image. It has a gray band at the top (#2a2a2a–#4c4c4c, y<120), a very dark warm-brown body (#100604–#190c08) with a blurred grid/bokeh-blob texture, and a vignette toward the bottom (#232323 at y=1270). Static (diff ≈0). The source image can't be identified; it looks like a blurred dark texture or B-roll. |
| 1 | Browser card | x 46–673, y 160–866 (627×706) | x 6.4–93.5%, y 12.5–67.7% | Same card chrome as Layout L (see below), just taller. Shows the "Claude motion designer showreel" prompt page, with prompt text already selected in blue. Static, no drift. |
| 2 | "Opus 5.5" highlight ring (inside card) | x 158–273, y 792–840 | x 21.9–37.9%, y 61.9–65.6% | Draws on 361–365 (see log), then held. |
| 3 | Caption (white) | "create it" x 237–485, top 929, baseline ≈980 | y 72.6–76.6% | Color #eff4f9. The group is centered on x=360. |
| – | Talking head | none | – | No presenter in this layout. |

### Layout L (frames 378–539), bottom to top
| z | layer | bbox px | bbox % | notes |
|---|---|---|---|---|
| 0 | Background plate | full frame | 100% | Light cool off-white: center #e4e9ec, left edge cooler #c9dde6–#ccdbe7, right warmer #f3f0ef. A soft palm-leaf gobo shadow sits in the upper-left (x 0–330, y 0–300). **Animated film grain** changes every frame (±4–6 levels, colored noise). Low-pass diff over 3 s is only 1–1.5 levels, so the leaf shadow sways very slightly. Never cuts within L. |
| 1 | Presenter card (rounded "window") | x 39–680, top y 938, runs off the bottom edge | x 5.4–94.4%, y 73.3–100% | Corner radius ≈45–50 px. Contents are the original footage background: sage wall #c5ccbb with a door and handle, defocused. Soft dark outer shadow, ≈12–15 px (#a9b0af at the edge fading to the plate). **Static for the whole segment.** A door-handle template stays at (90,1110) with score ≥0.998 from 378 to 538. |
| 2 | Presenter cutout (rotoscoped person) | head ≈ x 210–540; hair top y≈745–750; eyes y≈960–1050; chin ≈1180; shoulders to bottom | head width ≈46%; hair top ≈58.4%; eyes ≈75–82% | The person is alpha-matted, so hair and forehead **break out above the card's top edge** by ≈190 px (pop-out). Locked-off framing with no zoom or pan. The source is 25 fps conformed to 30: every 6th frame is a duplicate (head-region diff ≈0.2 at 384, 390, 396 … 534). |
| 3 | Caption (dark) | 1–3 words, max width observed 464 px; ascender top 662, x-height top 677, baseline 713, descender ≈728 | y 51.7–56.9%; max width 64.5% | Color #111214. Centered on x=360. The bottom of the caption nearly touches the presenter's hair (y≈735–745). |
| 4 | Browser card (B-roll window) | x 46–673, y 160–623 (627×463) | x 6.4–93.5%, y 12.5–48.7% | Safari-style. Corner radius ≈12 px. 2 px blue border (#2a609f–#3877c1, mean ≈#2f6db0) with a faint light-blue outer glow (#c4e4ff 1–2 px outside). Chrome bar y 160–205 (12.5–16.0%), white #fdfdff. Traffic lights at y≈183, x≈69/86/104. URL pill "prompt-motion.com" centered. Content is a white (#fdfdfd) website page. **Top, left and right edges are identical to Layout D; only the bottom edge moves (866 → 623).** |
| 5 | Border shine (2 beams) | on the card border | – | Two diametrically opposite soft light-blue highlights, each ≈55 px long. The border lightens to #99c1f5 with a ≈8 px haze of #b6d0fc. They **orbit clockwise at a constant ≈9 px/frame (270 px/s)**. Perimeter ≈2180 px, so one lap ≈8.1 s, and a beam passes any point every ≈4 s. Measured top-edge beam: x 176–230 at 378, 229–283 at 384, 551–605 at 420. Already in motion at the cut. A contrast-boosted frame 365 suggests the beams run continuously through Layout D (estimate). |
| 6 | UI highlight ring (clipped to the card content) | one at a time per chip, ≈75 px tall, outset ≈8–10 px around the chip (≈3 px gap to the chip's own gray border) | – | Stroke ≈4 px, color #0a8bf5 (#017fec–#1293fe). Rounded rectangle with radius ≈12 px. **Not** pill-shaped, although the chips are pills. Draws on clockwise from the top-left corner. |
| 7 | Cursor (inside card) | ≈15×25 px | 2.1%×2.0% | Black macOS arrow with a white outline. Renders above the ring. |

### Card content (Layout L)
Frame 391: "Filter:" label at x≈65; chips "Prompt" (≈155–287, y 287–343) and "Skill" (302–398). Second row: "Product UI 100" (65–292, y 367–423), "Phone 22" (308–470), "Charts 33" (486–654, cut off by the card edge). A large black video thumbnail runs x 65–590, from y 468 to beyond the bottom. A light thumbnail peeks in at x≥628. Chip text is gray (#656464 core), with the count in lighter gray.

After the pan (frame ≥525): the chip row reads "…Phone 22 (off-left) | Charts 33 | Diagrams 31 | Kinetic type 97". The black thumbnail ends at x=161 and a light-gray thumbnail fills 180–660.

---

## 2. Event log (chronological)

The "spoken" column uses whisper times. "Std entry" means the caption entrance in §3a.

| f start | f end | t (s) | spoken at that moment | element | what changes | measured values | easing (GSAP) | notes |
|---|---|---|---|---|---|---|---|---|
| 351 | 358 | 11.70–11.93 | "used to" | caption (D) | group "used" (351), "to" (357) | white | std entry | context |
| 359 | 359 | 11.97 | "to" | caption (D) | **blank frame** (old group cut) | – | instant | 1-frame gap |
| 360 | 364 | 12.00–12.13 | "to/create" | caption "create" (D, white) | enters at x 237–429 | peak lum 194→224→250 (settled 362) | std entry | Group "create it" centered 237–485 |
| 361 | 365 | 12.03–12.17 | "create" | "Opus 5.5" ring | stroke draw-on, clockwise from top-left | coverage 0.52, 0.75, 0.88, 0.95, 1.00 | power3.out, 5 f (167 ms), starting at 360 | Ring lands 1 f after the caption word; held until the cut |
| 360 | 377 | 12.00–12.57 | "create it" | card, backdrop | static | card diff ≤0.3 | – | No push-in |
| 368 | 371 | 12.27–12.37 | "create/it" | caption "it" (D) | enters x 449–485 | lum 193→225→251 | std entry | |
| **377→378** | – | 12.567→12.600 | **"Inside,"** onset at 378 | **whole frame** | **Hard cut** from Layout D to Layout L | full-frame diff 116.8 (others <3.5) | cut (0 f) | Card top/left/right unchanged; bottom 866→623. Presenter appears instantly. New page in card. |
| 377(hidden)→378 | 382 | 12.60–12.73 | "Inside," | caption "inside" | enters x 272–450 | first visible frame is already the entry's 2nd step (opacity 0.64, peak lum 88) | std entry | The caption tween began at 377 under the dark shot, i.e. 1 f before the cut |
| 378 | 539 | 12.60–17.97 | all | border shine | orbit clockwise | 9 px/f | linear | ambient |
| 378 | 539 | – | all | background grain, gobo | per-frame noise; very slight sway | ±4–6 levels | – | ambient |
| 388 | 388 | 12.93 | gap between words | caption | **blank frame** | – | instant | audio dip −21 dB |
| 389 | 394 | 12.97–13.13 | "you'll" | caption "you'll" | enters x 221–380 | opacity .43/.65/.85/.93/.97/1; y +4/+2/+1/0; σ 2/1/0 | std entry | Group "you'll get" pre-laid-out at 221–499 |
| 395 | 398 | 13.17–13.27 | "get" | cursor | **fades in while already moving** | darkest pixel 235 → 174 → 112 → 16 | ≈linear, 4 f (133 ms) | Enters from the lower right of the chips at (346,440) |
| 395 | 406 | 13.17–13.53 | "get / prompts" | cursor | travels to the "Prompt" chip | tip (346,440)→(334,416)→(316,389)→(298,368)→(283,355)→(272,346)→(264,341)→(258,337)→(253,333)→(250,331)→(247,329)→(246,329); step 27,32,28,20,14,9,7,6,4,4,1 px | power3.out, ≈11 f (367 ms), enters mid-motion | Rests with the tip 25 px right of and 16 px below the chip center |
| 398 | 400 | 13.27–13.33 | "get" (+5 f late) | caption "get" | enters x 400–499 | std | std entry | |
| 401 | 401 | 13.37 | "prompts" | caption | **blank frame** | – | instant | |
| 402 | 407 | 13.40–13.57 | "prompts" | caption "prompts" | enters x 234–488, alone in its group | opacity .43/.64/.84/.92/1 | std entry | |
| 403 | 408 | 13.43–13.60 | "prompts" | Prompt ring | draw-on clockwise from top-left, bbox 147–295 × 276–351 | coverage .43/.66/.845/.92/.965/.99 | power3.out, 6 f (200 ms) | +1 f after the caption word; the cursor is 3 f from rest |
| 404 | 407 | 13.47–13.57 | – | presenter | blink | – | – | natural |
| 412 | 412 | 13.73 | "for" | caption | **blank frame** | – | instant | |
| 413 | 418 | 13.77–13.93 | "for" (+5 f vs acoustic) | caption "for" | enters x 164–250 (group "for all launch", 164–555) | std | std entry | |
| 415 | 416 | 13.83–13.87 | "for/all" | presenter | left hand rises into the bottom-left corner | – | – | gesture beat |
| 417 | 422 | 13.90–14.07 | "all" | caption "all" | enters x 268–332 | std | std entry | |
| 417 | 429 | 13.90–14.30 | "all launch" | cursor | Prompt → Product UI, (246,329)→(220,409) | per-f |Δ|: 2,5,11,16,12,10,8,4,4,4,2,1,1 | power2.inOut, 13 f (433 ms) | Final tip 43 px right of and 16 px below the chip center |
| 421 | 429 | 14.03–14.30 | "launch" | caption "launch" | **glitch entry**, x 350–555 | opacity 1.0, 0.11, 1.0, 0.67, 0.23, 1.0, 1.0, 1.0, 1.0; RGB split on 421 and 423 (pink ghost #cf8890 offset +8 px right, blue fragments #7087cb up-left); slice offsets on the "l"/"h" ascenders 426–428 (dx −3…−4) | stepped (no easing), 9 f (300 ms) | See §3b |
| 422 | 427 | 14.07–14.23 | "launch" | Prompt ring | fades out | saturation sum 1.0, .96, .78, .55, .32, .10 | ≈linear, 6 f (200 ms) | Crossfade with the new ring |
| 423 | 428 | 14.10–14.27 | "launch" | Product UI ring | draw-on, bbox 56–299 × 356–431 | .46/.71/.84/.91/.96/.99 | power3.out, 6 f | +2 f after the caption "launch" |
| 430 | 430 | 14.33 | "videos" | caption | **blank frame** | – | instant | |
| 431 | 436 | 14.37–14.53 | "videos," (+7 f) | caption "videos" | enters x 260–460, alone | std | std entry | |
| 435 | 439 | 14.50–14.63 | "videos," end | presenter | left-hand gesture | – | – | |
| 442 | 448 | 14.73–14.93 | "product" | caption "product" | **glitch entry**, x 127–375 (settles 133–371) | opacity 1.0, 0.10, 0.99, 0.64, 0.23, 1.0, 1.0; RGB on 442 and 444; skew +4.6°, then −6.8°; dx ±4 px | stepped, 7 f (233 ms) | Replaces "videos" directly (no blank). Group "product videos" spans 133–589 |
| 453 | 458 | 15.10–15.27 | "videos," | caption "videos" | enters x 388–589 | std | std entry | |
| 458 | 463 | 15.27–15.43 | "videos," end | presenter | left-hand gesture | – | – | |
| 465 | 472 | 15.50–15.73 | "demos," | caption "demos" | **stretch entry**, settles at x 257–464; left edge pinned at 257 | scaleX 1.34, 1.20, 1.12, 1.06, 1.04, 1.02, 1.02, 1.00; σx 6, 3, 2, 1, 0; σy 4, 2, 1, 1, 0; opacity .42, .74, .84, .93, .99, 1 | expo.out / power3.out, ≈8 f (267 ms), transform-origin left | Replaces "product videos" directly |
| 466 | 478 | 15.53–15.93 | "demos" | cursor | Product UI → Phone, (220,409)→(420,409) | Δx 4, 15, 31, 40, 33, 23, 17, 12, 9, 6, 5, 3, 2; **arcs 18 px downward** mid-path (y 411→427→409) | power2.inOut (peak at ≈30% of duration), 13 f (433 ms) | Natural hand arc |
| 470 | 475 | 15.67–15.83 | "demos" | Product UI ring | fades out | .94, .73, .52, .31, .10, .06 | ≈linear, 6 f | Starts 4 f after the cursor leaves |
| 475 | 483 | 15.83–16.10 | "mobile" (−6 f vs whisper, −4 f vs acoustic) | caption "mobile" | **glitch entry**, settles at x 194–401 | opacity .94, .10, 1.0, .67, .23, 1.0, .97, .98, 1; RGB split (red and blue) on 475, red on 477; **italic-like skew +10°, +15°, +9°, +7°**, then −2°, +5°, +3°, 0; dx −8 → +4 | stepped, 9 f (300 ms) | Replaces "demos" directly. Group "mobile app" spans 194–529 |
| 477 | 482 | 15.90–16.07 | "mobile" | Phone ring | draw-on, bbox 298–479 × 357–431 | .45/.70/.82/.91/.96/.985 | power3.out, 6 f | +2 f after the caption |
| 482 | 483 | 16.07–16.10 | "mobile" | presenter | small hand gesture | – | – | |
| 485 | 490 | 16.17–16.33 | "app" | caption "app" | enters x 413–529 | std | std entry | |
| 489 | 494 | 16.30–16.47 | "walkthroughs," (−5 f) | caption "walkthroughs" | enters x 151–569 (418 px, alone) | std | std entry | Replaces "mobile app" directly |
| 498 | 525 | 16.60–17.50 | "walkthroughs," → "all charts" | **card content pan** (drag-scroll) | page translates left and up; browser chrome and border stay fixed; ring and cursor ride with the content | total Δ ≈ (−429, −44) px. Per-frame dx: −4, −21, −48, −62, ≈−50, −38, −30, −26, −22, −18, −15, −14, −11, −10, −9, −8, −7, −5, −6, −3, −4, −3, −2, −3, −1, −1, −1, 0. Directional motion blur ≈0.3× velocity (edge smear 3, 9, 18, 18 px …) | fast ease-in (≈4 f) then long decay (≈23 f). Approximate with a CustomEase, or a 0.13 s power2.in leg plus a 0.77 s power4.out leg | Reveals "Charts 33 / Diagrams 31 / Kinetic type 97". Peak 62 px/f (1860 px/s) at 501 |
| 498 | 505 | 16.60–16.83 | " | cursor | carried left with the content, (414,408)→(151,385) | – | – | Reads as a drag-to-scroll gesture |
| 505 | 524 | 16.83–17.47 | "all charts" | cursor | re-targets: (151,385)→(194,377) at 512 (overshoot right)→(174,369) at 524 | – | settle with overshoot, ≈19 f | Content is still drifting left 2–3 px/f |
| 509 | 514 | 16.97–17.13 | "walkthroughs" end | presenter | left-hand gesture | – | – | |
| 510 | 515 | 17.00–17.17 | – | Phone ring | scrolls out past the card's left clip (x=55) | – | carried by pan | Never faded; it leaves with the content |
| 514 | 514 | 17.13 | "all" | caption | **blank frame** | – | instant | After silence 511–513 |
| 515 | 520 | 17.17–17.33 | "all" | caption "all" | enters x 222–285 (group "all charts" spans 222–499) | std | std entry | |
| 517 | 524 | 17.23–17.47 | "charts," | caption "charts" | **stretch entry**, settles at x 306–499; left edge pinned at 306 | scaleX 1.34, 1.20, 1.12, 1.06, 1.04, 1.02, 1.02, 1.00; σx 6, 3, 2, 1, 0; σy 4, 2, 1, 1, 0; opacity .42, .75, .85, .93, .99, 1 | same as "demos" | |
| 517 | 520 | 17.23–17.33 | "charts," | Charts ring | draw-on, bbox 56–230 × 318–391 (left side clipped by the card) | .54/.82/.98/1.0 | power3.out, ≈4–5 f | Same frame as the caption word |
| 529 | 533 | 17.63–17.77 | "and" (−4 f) | caption "and" | enters x 131–242 (group "and much more" spans 131–590) | std | std entry | Replaces "all charts" directly |
| 530 | 533 | 17.67–17.77 | "and" | cursor | **fades out in place** at (175,369) | darkest pixel 1 → 29 → 52 → 77 → gone at 534 | ≈linear, 4 f (133 ms) | UI interaction is finished |
| 531 | 535 | 17.70–17.83 | "and much" | presenter | left-hand gesture | – | – | |
| 534 | 538 | 17.80–17.93 | "much" | caption "much" | enters x 265–433 | std | std entry | |
| 538 | 539→ | 17.93–17.97 (→18.4) | "much / more" | **whole browser card** (chrome, border, content) | **carousel swipe left with motion blur**; the next card enters from the right in the following frames | dx −7 (538), −28 (539); 540–545 too blurred to measure (card leaves left, the new card appears at x≈440+ by 541); landing −40, −33, −26, −22, −18, −15, −12 px/f at 546–552 | strong ease-in, then ease-out landing (≈ power3.inOut over ≈0.5 s) | Continues into segment 4; scene-detector hit at 18.433 |
| 540 | 544 | 18.00–18.13 | "more." | caption "more" (continuity) | **emphasis word**: blue serif italic #1b84ef, x 453–590 | blue-pixel count 957, 2492, 2743, 2911, 3001 | 5 f | The style (§3c) belongs to the next segment |

Not observed in this segment: zoom or push-in on any layer, background swap inside Layout L, flashes, number pops, overshoot or bounce on captions or rings.

---

## 3. Caption behaviour

### Groups (exact)
| # | frames | words (rendered) | x-extent | width | break reason (observed) |
|---|---|---|---|---|---|
| D1 | 351–358 | used to | – | – | – |
| D2 | 360–377 | create it | 237–485 | 248 | sentence end; cut out by the hard cut |
| 1 | 378–387 | inside | 272–450 | 178 | pivot word followed by a comma |
| 2 | 389–400 | you'll get | 221–499 | 278 | adding "prompts" would make 553 px, too wide |
| 3 | 402–411 | prompts | 234–488 | 254 | keyword (the clicked UI label) shown alone |
| 4 | 413–429 | for all launch | 164–555 | 391 | adding "videos" would make 612 px, too wide |
| 5 | 431–441 | videos | 260–460 | 200 | comma |
| 6 | 442–464 | product videos | 133–589 | 456 | comma |
| 7 | 465–474 | demos | 257–464 | 207 | comma |
| 8 | 475–488 | mobile app | 194–529 | 335 | adding "walkthroughs" would make 773 px, too wide |
| 9 | 489–513 | walkthroughs | 151–569 | 418 | comma |
| 10 | 515–528 | all charts | 222–499 | 277 | comma |
| 11 | 529–(560+) | and much more | 131–590 | 459 | sentence end |

Rules derived:
- Text is lowercase, with punctuation stripped except apostrophes.
- 1–3 words per group, always on a single line.
- Break at every comma or period.
- Break before a word that would push the group past ≈465 px (**≈64.5% of frame width, ≈7 em at the measured font size**). Observed max is 459–464 px.
- The keyword that triggers a UI action ("prompts") can stand alone.
- Groups are **laid out once, centered on x=360**. Each word fades in at its final slot, with no reflow or re-centering as words are added.
- Word gap is 18–20 px (≈0.3 em).

### Typography
- Heavy neo-grotesk sans, bold (Inter Display Bold or SF Pro Display Bold class).
- From "videos": x-height ≈36–37 px and ascender ≈50 px, which gives a font size of **≈66–68 px at 720 w (≈9.3% of width)**. Tracking is normal to slightly tight.
- Fill is #111214 on the light plate and #eff4f9 on the dark plate.
- No stroke or shadow.
- Placement: in Layout L, the caption's top sits ≈39 px below the card's bottom edge (623→662), baseline at y≈713 (55.7%). In Layout D, top ≈63 px below the card bottom (866→929), baseline ≈980 (76.6%).

### 3a. Standard word entrance ("blur-rise-fade"), used for 15 of 20 word entries in the segment
Measured identically on you'll, prompts, for, all, videos ×2, walkthroughs, all, and, much, plus the D-layout words. Per frame, starting at the first visible frame:

| frame | +0 | +1 | +2 | +3 | +4 | +5 |
|---|---|---|---|---|---|---|
| opacity | 0.43 | 0.65 | 0.85 | 0.93 | 0.97 | 1.00 |
| translateY (px) | +4 | +2 | +1 | 0 | 0 | 0 |
| blur σ (px) | 2 | 1 | 0 | 0 | 0 | 0 |

Total about 6 f (200 ms), with no overshoot. The gray-to-black look comes from opacity combined with blur; the fill color does not change.

GSAP equivalent: `from({opacity:0, y:8, filter:"blur(4px)"}, {duration:0.2, ease:"power2.out"})`, with the first rendered frame landing one frame into the tween.

### 3b. "Glitch" entrance (launch, product, mobile)
Stepped opacity flicker, common to all three:

| step | 0 | 1 | 2 | 3 | 4 | 5+ |
|---|---|---|---|---|---|---|
| opacity | 1.0 | 0.10 | 1.0 | 0.65 | 0.23 | 1.0 |

- On the full-opacity frames 0 and 2 there is an RGB split: a pink/red ghost (#cd8d96 composite) offset **+6…+8 px right** and +1–2 px down, plus small blue blocks (#7087cb) offset up-left.
- Random horizontal slice displacement on ascenders (3–8 px).
- Whole-word horizontal jitter of ±3–8 px.
- Random skewX: product +5°/−7°; mobile up to +15°, which makes it look italic.
- Dim frames 1 and 4 are blurred ghosts (σ≈3).
- Settles to clean by +7…+8 f (233–300 ms).

This looks like a preset: the opacity sequence is identical across all three words.

### 3c. "Stretch" entrance (demos, charts)
Left edge is pinned (transform-origin left center).

| frame | +0 | +1 | +2 | +3 | +4 | +5 | +6 | +7 |
|---|---|---|---|---|---|---|---|---|
| scaleX | 1.34 | 1.20 | 1.12 | 1.06 | 1.04 | 1.02 | 1.02 | 1.00 |
| blur σx / σy (px) | 6/4 | 3/2 | 2/1 | 1/1 | 0 | – | – | – |
| opacity | 0.42 | 0.74 | 0.84 | 0.93 | 0.99 | 1 | 1 | 1 |

No y-motion. Approximate: `from({scaleX:1.5, opacity:0, filter:"blur(8px)"}, {duration:0.27, ease:"power3.out"})`, starting one frame before the first rendered frame.

### 3d. Emphasis-word choice in this segment
There is no color or serif emphasis inside 360–539; the first one, "more", lands at 540.

Instead, **the head word of each list item gets a special entrance**. The rule held 5 of 5 times, but may be coincidental:
- **Glitch** on the first word of a multi-word item: launch (videos), product (videos), mobile (app walkthroughs).
- **Stretch** on a single-noun item: demos, (all) charts.

Repeated or trailing generic words (videos, app, walkthroughs) and function words use the standard entrance.

### Sync relative to speech
- Against whisper starts, the measured lead(−) or lag(+) per word is: create −7, it −5, inside −2, you'll 0, get +5, prompts +5, for +9, all +6, launch +7, videos +10, product +5, videos +8, demos +1, mobile −6, app 0, walkthroughs −5, all +1, charts −2, and −4, much −4, more −2.
- Against acoustic onsets the picture is the same: the mid-list run (get … videos) is **4–7 f late**, and the end of the list is **2–5 f early**.
- Conclusion: the reference's caption track is only loosely synced (about −7…+10 f). The perceived behavior is "a word appears as it is spoken". **For generation, show each word at its spoken onset, 0 to −2 f.**

### Exits
- Groups never animate out. The old group disappears **instantly** on the frame the new group's first word appears.
- In 5 of 10 swaps there is **one empty frame** in between (388, 401, 412, 430, 514; also 359 in Layout D).
- Glitch and stretch entries replace the previous group directly.
- Captions are not otherwise affected by cuts: "inside" was already animating 1 f before the hard cut.

---

## 4. Transition catalog

| # | frames | from → to | technique | duration | measured |
|---|---|---|---|---|---|
| T1 | 377→378 (12.567→12.600) | Layout D (dark, full B-roll card, no presenter) → Layout L (light plate, shorter card, presenter card) | **Hard cut** on the audio onset of "Inside" | 0 f | Full-frame diff 116.8 vs <3.5 around it. Card x/top/border are identical across the cut, so the card acts as the continuity anchor. The border shine keeps its global timeline. No flash, blur or scale. |
| T2 | every group change | caption group → caption group | instant cut-out plus a word entrance (3a/3b/3c) | 0–1 f gap, then 6–9 f entrance | see §3 |
| T3 | 422–428, 470–482 | ring on chip A → ring on chip B | old ring opacity fades (≈linear, 6 f) while the cursor travels; new ring draws its stroke clockwise from the top-left (power3.out, 6 f), synced to the caption word | ≈6 f each, overlapping | coverage tables in the log |
| T4 | 395–398 / 530–533 | cursor appear / disappear | opacity fade (4 f). It appears already moving; it disappears in place. | 133 ms | – |
| T5 | 498–525 | page state A (filters visible) → page state B (Charts/Diagrams/Kinetic chips) | **In-card content pan** (drag/momentum scroll): translate (−429, −44), directional motion blur ≈0.3× per-frame velocity. Chrome, border and card position fixed. | 27 f (900 ms); motion visibly ends ≈512 (~14 f), with a slow tail to 525 | peak 62 px/f at 501 |
| T6 | 538 → (≈553) | card #1 → card #2 | **Horizontal carousel swipe of the whole card** (chrome included), heavy motion blur. The next card enters from the right and decelerates. | ≈15 f; starts at 538 inside this segment | −7, −28 px/f at the start; landing −40 … −12 px/f at 546–552 |

---

## 5. Editorial logic and reusable rules

| beat (frames) | script | visual decision | why | generalized rule |
|---|---|---|---|---|
| 360–377 | "…used to create it" | Full-height B-roll card on a dark blurred plate, no presenter. Draw-on ring around the model field "Opus 5.5" on "create". | Proof moment: the viewer is shown *how* the example was made, so the source UI fills the screen and the presenter is removed. | **Proof / "how it was made" sentence → hide the presenter, enlarge the B-roll card, and ring the specific UI field that answers "with what" on the verb ("create", "built", "used").** |
| 378 | "Inside," | Hard cut to a new layout (light plate, presenter visible) and a new page (catalog/filter view). "inside" is a group on its own. | "Inside" pivots from one example to the catalog contents, i.e. a section change. | **Pivot or section words ("inside", "here's", "now", "so") → hard cut exactly on the word onset to a new layout plus new B-roll; the pivot word is a 1-word caption group.** |
| 378 | (layout) | Card keeps its top/left/right edges and only shortens; the presenter fills the freed bottom. | Keeps the eye anchored on the same window across the cut. | **Keep the B-roll card's top, left and right fixed across layouts; only its height changes (706 px full vs 463 px split).** |
| 395–408 | "you'll get prompts" | A cursor glides in and selects the "Prompt" filter chip. The ring draws when the word "prompts" appears. | The spoken noun literally matches an on-screen label. | **Spoken noun = visible UI label → cursor travels there (≈0.35–0.45 s, power2/3) and a ring draws on within 0–2 f of the caption word.** |
| 413–429 | "for all launch videos" | Cursor moves to "Product UI 100"; ring on "launch" (glitch caption). | Synonym match: launch videos are product-UI videos. | **Use semantic (not literal) matching to pick the UI target for a list item; hit it on the item's head word.** |
| 431–464 | "videos, product videos," | Ring stays on Product UI. Second "videos" gets a plain entrance. | The selection still applies; no new target. | **If the next item maps to the current selection, hold; don't re-click.** |
| 465–482 | "demos, mobile app" | "demos" gets a stretch entrance (no click). Cursor leaves Product UI on "demos" and lands on "Phone 22" for "mobile" (glitch caption). | Each list item needs a fresh visual beat; "demos" has no matching chip, so the caption effect carries the beat. | **Each list item gets a new beat: a UI move if there is a matching target, otherwise only the special caption entrance. Alternate entrance styles to avoid repetition.** |
| 489–525 | "walkthroughs, all charts" | While "walkthroughs" plays, the content drags left and up to reveal more chips. "Charts 33" is then ringed on "charts". | The next target was off-screen, so the pan pre-reveals it ≈0.6 s before it is named. | **If the next mentioned item is off-screen, pan or scroll the B-roll content (motion-blurred, ≈0.9 s, fast start and long decay) during the previous word so the target is visible before its word lands.** |
| 529–539 | "and much more" | Cursor fades out. The card starts a carousel swipe to the next example. "more" becomes the blue serif italic emphasis. | "Much more" means there is more to show: leave this screen and pop the summarizing word. | **List closer ("and much more", "and more", "etc.") → end the UI interaction (cursor fade), swipe to the next B-roll card, and give the closing word the accent style.** |
| 378–539 | throughout | Border shine orbiting, film grain, slight gobo sway. | Keeps long static holds alive with no attention cost. | **Always run ambient loops (border beam 270 px/s, grain, slow shadow sway) on otherwise static frames.** |
| list cadence | – | One visual beat about every 0.35–0.9 s: caption group change, entrance FX, ring, cursor move, pan or swipe. | Retention through constant small novelty. | **Never let more than ≈0.9 s pass without a new visual event during a list.** |

---

## 6. Talking-head region, and how to translate it to the pixel sprite

### What the reference does
- **360–377:** no presenter. Layout D is B-roll only.
- **From 378:** the presenter appears instantly with the hard cut. Placement:
  - Rounded presenter card at x 39–680, top y 938 (73.3%), radius ≈45–50 px, soft outer shadow.
  - The rotoscoped person **pops out above the card** (hair top ≈y 745–750, 58%).
  - The head is ≈46% of frame width, centered at x≈360–380.
  - Inside the card is the original room background (sage wall, door), defocused.
- **Framing:** locked off for the whole segment. No zoom, punch-in, reframe or background change.
- **Natural beats seen:**
  - Blink at 404–407.
  - Left-hand gestures rising into the bottom-left corner on list-item stresses: 415–416 "for", 435–439 "videos", 458–463 "videos", 482–483 "mobile", 509–514 "walkthroughs", 531–535 "and much", 539+ "more".
  - The mouth tracks the audio.

### Sprite translation
- **Placement:** put the sprite inside the same rounded card (x 39–680, top 938). Scale it so the head is ≈46% of frame width and the top of the head breaks above the card edge to y≈745 (pop-out). Use nearest-neighbor scaling and a matching soft card shadow.
- **Card background:** keep it a muted single tone (≈#c5ccbb) or a simple pixel-art room. Leave it static.
- **Mouth:** switch closed/open poses on audio RMS. In this clip, about −20 dB relative peak works as the threshold, since speech runs −11…−17 dB with dips to −30…−43 dB between words. Hold each mouth state at least 2 f (≤15 fps) for a pixel-art feel.
- **Visibility:** hide the sprite whenever the layout is "full B-roll proof" (Layout D). Show it with a hard cut, with no entrance animation, at the pivot word.

| frames | words | suggested pose (from the 20-pose pack) |
|---|---|---|
| 360–377 | "to create it" | hidden (full B-roll) |
| 378–388 | "Inside," | present-right open (or idle-smile) on the cut. Presenter "opens" the section. |
| 389–412 | "you'll get prompts" | idle talk (talk-small / talk-wide by RMS). On "prompts" (cursor click at 403), switch to point-left or present-left aimed toward the card above. |
| 413–441 | "for all launch videos," | idle talk, then present-right at 415 and at 435 (matches the hand beats) |
| 442–464 | "product videos," | present-left at 458–463 |
| 465–474 | "demos," | idle talk (or thinking for one beat) |
| 475–497 | "mobile app walkthroughs," | present-right around 482; talk-wide on "walkthroughs" |
| 498–514 | (pan) "walkthroughs" end | point-left while the content slides left (follows the motion), present-left at 509–514 |
| 515–528 | "all charts," | idle-surprised or present-right on "charts" (reveal payoff) |
| 529–539 | "and much more" | arms-crossed open or present-right with open mouth on "and much", ending idle-smile on "more" as the card swipes |

- **Pose-change cadence:** change pose on each list-item stress, about every 0.6–0.9 s, mirroring the hand-gesture rhythm. Alternate left and right variants so consecutive items never reuse the same gesture.

---

## Reproduction constants (HyperFrames)
- **Canvas:** 720×1280, 30 fps. Scale ×1.5 for 1080×1920.
- **Card (split layout):** left 46, top 160, 627×463, r 12, border 2 px #2f6db0 with a 1–2 px #c4e4ff outer glow. Chrome bar 45 px.
- **Card (full layout):** same, height 706.
- **Presenter card:** left 39, top 938, width 641, r 48, shadow `0 0 14px rgba(70,85,90,.35)` (approximate).
- **Caption:** center x 360, baseline 713 (split) / 980 (full), 66 px bold, #111214 / #eff4f9, max group width 465 px.
- **Ring:** 4 px stroke #0a8bf5, r 12, outset 8–10 px. Draw-on via stroke-dashoffset, clockwise from the top-left, 0.2 s power3.out. Old ring fades over 0.2 s linear.
- **Cursor:** macOS arrow 15×25. Moves 0.37–0.43 s power2.inOut (with a ≈15–20 px perpendicular arc on long moves). Rest point = chip center + (≈0.15–0.2 × chip width, +16 px). Fade in/out 4 f.
- **Border shine:** 2 opposed 55 px light-blue (#99c1f5 with #b6d0fc haze) segments, clockwise, 270 px/s.
- **Plate:** off-white gradient (cool left #c9dde6 → warm right #f3f0ef), upper-left leaf-shadow overlay, animated grain ±5 levels at 30 fps.
