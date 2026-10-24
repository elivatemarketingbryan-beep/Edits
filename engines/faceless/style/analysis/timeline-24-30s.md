# Segment 5 — 24.0 s to 30.0 s (frames 720–896)

The reference file has 897 frames (0–896), so the segment ends at frame 896 (29.87 s). There are no frames after it. Frames 710–719 were checked for continuity.

Frame math: frame index = file number − 1, time = index / 30. 1 frame = 33.3 ms. All pixel values are on the 720×1280 canvas.

## 0. What happens

| Frames | Time | Spoken | Visual mode |
|---|---|---|---|
| (629)–779 | (20.97)–25.97 | "…in that exact style with **the same animations and the same sound effects.**" | **Layout A, the A/B proof cards.** Two stacked 4:3 cards ("original" on top, "Frame by Frame remake" below) sit on a static, blurred dark backdrop. The presenter is not on screen. The media inside the cards swaps once, at frame 724. |
| 780–896 | 26.00–29.87 | "**So go try it yourselves. Just comment motion down below, and I'll DM you the link directly.**" | **Layout B, the full-screen talking head (CTA).** It is a hard cut on the first phoneme of "So". Captions move up onto the chest. A two-line CTA lockup, *comment* + "Motion", lands at frame 827 and stays on screen to the last frame. |

How I measured, and how sure I am:
- Positions come from per-pixel thresholding. Sharpness is OpenCV Laplacian variance. Opacity is estimated from the ratio of peak luminance to its final value. Easing was fitted to the per-frame values.
- Word timings come from two independent faster-whisper runs (`small.en`, which produced `words.json`, and `large-v3-turbo`). Both agree within ±40 ms. I also checked phoneme onsets acoustically, using fricative and burst energy in the 4–10 kHz band against voicing energy in the 100–900 Hz band. "Acoustic onset" in the tables below means that check, accurate to about ±1 frame.
- Anything I inferred rather than measured is marked **(inferred)**.

---

## 1. Layer map

### Layout A: A/B proof cards (frames 720–779). The z-order runs from back to front.

| z | Layer | Bounding box (px) | Bounding box (% W × % H) | Behaviour in this segment |
|---|---|---|---|---|
| 0 | **Backdrop**: a heavily blurred photo, possibly a blurred window or room, darkened | full frame 0–720 × 0–1280 | 100 × 100 | **Fully static**, with a frame-to-frame diff of 0.00. The vertical gradient runs: y 0–40 #020202 → y 100–300 mid-grey #2D2D2D–#3C3C3C, with soft vertical "window-frame" bars → y ≈560–620 black band #0A0A0C → y 700–1280 deep navy #000828 → #050A1A. |
| 1 | **Card 1, "original"** | x 126–593, y 160–511 (467×351, 4:3) | x 17.5–82.4 %, y 12.5–39.9 % | Static. Corner radius about 12 px. Border is 2–3 px blue: outer px (35,90,154) #235A9A, inner (55,110,173) #376EAD. A light-blue rim highlight (91,155,218) #5B9BDA runs along the top edge, and a short light gloss streak sits on the bottom edge near the right corner. The media inside is cover-fit; the UI background is off-white #FBF9F5. |
| 1 | **Card 2, "Frame by Frame remake"** | x 126–593, y 526–877 (467×351) | x 17.5–82.4 %, y 41.1–68.5 % | Same styling as card 1. The gap between the cards is 15 px (1.2 % H). Both cards together are centred at x 359.5, y 518.5 (40.5 % H). |
| 2 | **Media inside each card** (screen recordings) | clipped to the card's inner rect | — | Clip A ("icon orbit") runs to frame 723 and clip B (macOS menu bar → prompt panel) runs 724–779. The two cards play in lockstep because the remake copies the original frame by frame. **The blur is applied to this layer only.** The pills and borders stay sharp: pill Laplacian is constant at 8150–9040 while the media goes 250 → 4. |
| 3 | **Pill "original"** | x 139–227, y 172–204 (88×32) | x 19.3–31.5 %, y 13.4–15.9 % | Static. Fill #1E1E1E, white bold sans text about 15 px, soft drop shadow, inset about 13 px from the card's top-left corner. |
| 3 | **Pill "Frame by Frame remake"** | x 140–367, y 540–571 (227×31) | x 19.4–51.0 %, y 42.2–44.6 % | Static. Fill #0083FC, white bold sans text, soft drop shadow. |
| 4 | **Captions** | centred on x = 360 (measured group centres 359.5–361). Baseline y 993, x-height top y 957, ascender top y 943 | baseline 77.6 % H | Bold sans with x-height 36 px, so the font is about **66–68 px (≈9.3 % W)**. Fill **#E8F0FB** (cool white, measured core (232,240,251)). Emphasis words use a high-contrast bold *serif italic* with x-height 33 px (about the same em size) and a baseline 4 px higher, at y 989. |
| — | Talking head, cursor overlay, highlight rings, number pops, zooms on the frame | — | — | **None in Layout A.** The only cursor is the macOS pointer recorded inside the clips. |

### Layout B: full-screen talking head (frames 780–896)

| z | Layer | Bounding box | % | Behaviour |
|---|---|---|---|---|
| 0 | **Talking-head video**, full bleed | 720×1280 | 100 × 100 | Locked-off and static. I found no digital zoom or pan (eye spacing is identical in frames 781 and 895, and the wall stays put). The presenter's natural movement is head bob ±20 px and tilt ±5°. Framing: hair top at y≈40–60 (3–5 %), hair spans x 107–699 at y 400 (≈83 % W), eyes at y≈430 (33.6 %), mouth at y≈620 (48 %), chin at y≈780 (61 %), black tee #0D1010 from y≈680–830 down to the bottom, and a mic blob at the bottom centre (y≈1240). Wall is pale sage #C5CAB6–#D1D4C9. The source is 25 fps conformed to 30, so **a duplicated frame appears every 6 frames** (785, 791, 797 … 893). This is a judder artefact; do not reproduce it. |
| 1 | **Captions (regular)** | centred x = 360. Baseline y 918, ascender top y 867 | baseline 71.7 % H | Same bold sans and size (x-height 36 px). Fill **#FEFAF5** (warm white). A soft dark shadow darkens the skin and shirt by 10–17 % within about 15 px of the glyphs; my estimate is `0 2px 12px rgba(0,0,0,.35)`. |
| 1 | **CTA lockup, line 1: *comment*** | x 206–515, y 878–936 (final) | x 28.6–71.5 %, y 68.6–73.1 % | Serif italic, x-height 45 px, so about **1.36× the normal caption size** (≈92–95 px). After "Motion" lands, the fill becomes a vertical gradient: #DDDAD3 at the x-height top → #9A9597 at the baseline. |
| 1 | **CTA lockup, line 2: "Motion"** (with curly quotes) | x 186–532, y 928–1001 | x 25.8–73.9 %, y 72.5–78.2 % | Heavy grotesque sans (SF Pro Display or Inter Bold/ExtraBold class), cap height about 67–70 px, so the font is about **95 px (13 % W)**. The fill is a vertical gradient: #E1F0F9 (top) → #A8D7F9 (middle) → #539AFD (bottom). The line overlaps *comment* by about 8 px, so the leading is negative. A thin dark drop shadow sits under the glyphs. |
| 0.5 | **Blue glow under "Motion"** | an ellipse of about x 200–530 × y 1000–1065, centred near x 360 | 28–74 % W, 78–83 % H | Blue excess (B − mean(R,G)) is about 40 just under the baseline and fades to 0 by y≈1065. Implement as a radial ellipse around 340×120 px in #2F5BD0 at about 35 % opacity, or as `text-shadow: 0 14px 40px rgba(40,100,255,.55)`. |

---

## 2. Event log

"Onset" is the acoustic phoneme onset. Positive lag means the caption appears after the sound starts.

| Frame start–end | Seconds | Spoken (words.json → acoustic onset) | Element | What changes (measured) | Easing (GSAP) | Notes |
|---|---|---|---|---|---|---|
| 704–718 | 23.47–23.93 | "style with" | Caption (continuity) | "style" is serif italic in **light blue #85C1F3**. "with" is added in white sans at 715. | — | Emphasis can be blue-tinted as well as white. |
| 715–723 | 23.83–24.10 | "with" → "the" | Card media (clip A) | **Blur-out.** Laplacian, top card: 200 → 209 → 130 → 112 → 48 → 29 → 11 → 6 → 4. Bottom card: 94 → 4. The source icons also converge on the centre. | power2.in, 8 f / 267 ms | Pills and border stay razor sharp. |
| 719 | 23.97 | "the" (onset 719.1) | Caption | The "style with" group is removed with a hard cut. **1 empty frame.** | cut | — |
| 720–723 | 24.00–24.10 | "the" | Caption word "the", x 218–317 | **Entrance:** peak luminance 192 → 225 → 250 → 250 (≈77 % → 90 % → 100 %). Sharpness 50 → 106 → 169 → 172. Centre y +3.6 → +1.2 → +0.6 → 0 px. | about 3 f, power3.out/expo.out | The word is placed at its **final position in the full group** (left-aligned slot). Lag +1 f. |
| 724 | 24.13 | "same" (s-onset 720.9) | Card media | **Hard cut** from clip A to clip B (menu bar). Mean diff is 115 in both cards in the same frame. | cut | The scene detector also fires at 24.133. |
| 724–727 | 24.13–24.23 | "same" | Caption "same" added (x 330–501) | Same 3-frame blur, gray, then white rise. Group becomes x 218–501, centred at 359.5. | as above | Lag +3 f. |
| 724–732 | 24.13–24.40 | "same animations" | Card media (clip B) | **Blur-in.** Bottom Laplacian 23 → 28 → 47 → 61 → 81 → 106 → 187 → 281 → 647. Top 10 → 220. The content also settles about 3 px upward (bezel y 304 → 301). | power2.out, 8 f | This completes the blur-through. |
| 726–738 | 24.20–24.60 | "animations" | Inside clip B | The macOS cursor moves up to a menu-bar app icon and clicks it (icon highlight at about 736–738). Original card: about (375,405) → (360,300). Remake card: about (358,770) → (362,665). | (source) | This is recorded content, not an overlay. |
| 729 | 24.30 | — | Caption | "the same" is removed, then 1 empty frame. | cut | — |
| 730–733 | 24.33–24.43 | "animations" (onset ≈728) | Caption "animations", serif italic, white, x 206–513 | Same 3-frame blur-in (192 → 225 → 245 luminance, sharpness 51 → 104 → 163). No scale change: bbox width is constant. | about 3 f, power3.out | Single-word emphasis group, lag +2 f. |
| 738–745 | 24.60–24.83 | "and" | Inside clip B | A frosted-glass prompt panel materialises (blur and scale-in from the source app) in both cards. | (source) | — |
| 743 | 24.77 | — | Caption | "animations" is removed, then 1 empty frame. | cut | — |
| 744–746 | 24.80–24.87 | "and" (onset ≈740.7) | Caption "and", x 154–264 | Same 3-frame entrance. | — | Lag +3 f. |
| 745–779 | 24.83–25.97 | → "effects." | Inside clip B | Text is typed character by character: "Tell me about the pyramids\|" in the original and "Make a launch video for my app\|" in the remake. | (source) | — |
| 747–749 | 24.90–24.97 | "the" (onset ≈746.7) | Caption "the" added (x 272–383) | Entrance as above. | — | Lag 0 f. |
| 751–753 | 25.03–25.10 | "same" (s-onset 750.3) | Caption "same" added (x 392–568) | Entrance as above. The group is x 154–568 (414 px = 57.5 % W, the widest group in the segment), centred at 361. | — | Lag +1 f. |
| 756 | 25.20 | — | Caption | "and the same" is removed, then 1 empty frame. | cut | — |
| 757–760 | 25.23–25.33 | "sound" (s-onset 757.8) | Caption "sound", serif italic, x 187–355 | Same entrance. The blur is isotropic: gx/gy ratio is constant at 1.23–1.30. | — | Lead −1 f. |
| 757–779 | 25.23–25.97 | "sound effects." + pause | Card media | **Accelerating upward drift** of the content in both cards. Top bezel y 301 → 300 → 298 → 296 → 293 → 289 → 285 → 279 → 275, bottom 665 → 636. Velocity rises from 0 → 1 → 2 → 3 → 4 px/f. | power2.in / power3.in | The cards themselves do not move. Clip and source cannot be told apart **(inferred: a pre-exit push)**. |
| 764–767 | 25.47–25.57 | "effects" (onset ≈764) | Caption "effects", serif italic, x 368–532 | Same entrance. The group is x 187–532, centred at 359.5. | — | Lag 0 f. The group then holds 17 f through the sentence-end pause. |
| 775–779 | 25.83–25.97 | (pause) | Card media | **Blur-out before the scene cut.** Top Laplacian 483 → 368 → 294 → 167 → 112 → 63, bottom 676 → 56. The white top of each UI bleeds into the menu bar (a hazy look). | power2.in, 5 f | Combined with the accelerating drift. |
| 778–780 | 25.93–26.00 | (pause) | Audio | A 12–20 kHz band rises from −16 dB to 0 dB, plus a tonal cluster around 5 kHz from 25.84 to 26.00, peaking on frame 779–780. | — | **(inferred)** whoosh or transition SFX into the cut. |
| 780 | 26.00 | "So" (s-onset 780.6) | **Hard cut to Layout B** | Backdrop, cards and pills are all replaced by the full-frame talking head. The face is sharp on frame 1, with no flash, zoom or blur (Laplacian 40 and mean luminance 105.7 are stable). | cut | The cut lands within 1 frame of the new sentence's first phoneme. |
| 780 | 26.00 | — | Caption | "sound effects" is **carried over for one frame and re-anchored**: y 940–1006 → 865–930 (up 75 px). Colour shifts to pure white (peak 255). | — | Shows that the caption anchor depends on the layout. |
| 781 | 26.03 | "So" | Caption | Old group removed. "so" appears as a **hairline/outline ghost**: about 3 % of the final bright-pixel count, peak 193, but crisp, not blurred (Laplacian 125). | — | Lag 0 f. Face-mode entrance style (see §3). |
| 782–784 | 26.07–26.13 | "So" | Caption | "so" reaches about 76 % fill at 782 and 100 % at 783. **"go" ghost at 782**, full at 784. Group x 227–391. | about 3 f | "go" acoustic onset is about 789–791, so the caption **leads by about 8 f**. |
| 786–788 | 26.20–26.27 | "So"/"go" | Caption "try" added (x 400–495) | Ghost at 786, 76 % at 787, full at 788. Group x 227–495, centred at 361. | — | "try" t-burst at 795.3, so the caption leads by about 9 f. |
| 790 | 26.33 | "go" | Caption | "so go try" is removed, then 1 empty frame. | cut | — |
| 791–794 | 26.37–26.47 | "go" | Caption "it" (x 170–204) | Ghost at 791, then full. | — | The word sits at the far left of the coming group. Leads its onset (≈802.5) by about 11 f. |
| 795–797 | 26.50–26.57 | "try" | Caption "yourselves" added | Ghost (8 bright px) → 4683 → 6224 px (≈0 → 76 → 100 %). Group x 169–553, centred at 361. | — | Leads by about 9 f. |
| 800–812 | 26.67–27.07 | "it yourselves" | Talking head | An open palm rises at the bottom-left edge (performance gesture). | — | — |
| 796–817 | 26.53–27.23 | through "-selves" (ends ≈820) | Caption | "it yourselves" holds for 22 frames. | — | — |
| 818 | 27.27 | pause, before "Just" (J-onset 822.3) | Caption | "it yourselves" switches to ***comment*** in the **same frame, with no gap**. *comment* is at full opacity from frame 1, sharp, and **horizontally stretched** (w 360 px, x 193–553, height 57 px). | cut-in | "Just" is **never captioned**. *comment* appears 9 f before its own k-burst (826.8). |
| 818–838 | 27.27–27.93 | "Just comment motion" | *comment* | **scaleX settle, 1.165 → 1.0.** Width 360, 351, 344, 339, 334, 331, 327, 324, 321, 320, 318, 316, 315, 314, 313, 312, 311, 310, 310, 310, 309. Height is constant (rows 878–923), so the glyphs narrow horizontally only. Normalised progress 0, .18, .31, .41, .51, .57, .65, .71, .76, .80 … 1.0. | **power3.out, about 20 f / 667 ms** (fit within ±0.04 for the first 10 f) | Origin is about x 283, left of centre. |
| 827 | 27.57 | "comment" | **"Motion"** | Appears as a blurred ghost, about 15–20 % opacity, roughly +12 px low. | — | Leads its m-onset (≈833.7) by about 7 f. |
| 828–832 | 27.60–27.73 | "comment"/"motion" | "Motion" **flicker-on** | Glyph luminance (background 60, final 205): 144 → 122 → 174 → 157 → 201, so opacity ≈ 0.58 → 0.43 → 0.79 → 0.67 → 0.97. That is **on, dip, brighter, dip, full** (two dips). Sharpness 976 → 584 → 1051 → 764 → 1629. Top y 946 → 946 → 940 → 936 → 934 (rise 12 px). | 6 f stepped flicker plus a y rise on power2.out | — |
| 828–832 | — | — | *comment* | Dims **in anti-phase** with the Motion flicker: the bottom row reads 236 → 206 → 229 → 206 → 214 → 156. At 832 it settles into the white → gray gradient (top 221, bottom 156) and finishes the scaleX settle. | stepped | The setup word recedes and the punch word takes focus. |
| 828–873 | 27.60–29.10 | "motion down below, and I'll DM" | Talking head | The presenter's hand enters from the left edge and **points down and right at the caption** (828–860). It then moves toward the camera, pointing at the viewer on "I'll DM you" (864–873). Hands come together at the bottom (874–877) and then drop out of frame. | — | Captions stay **on top** of the hand (top z). |
| 833–896 | 27.77–29.87 | "down below, and I'll DM you the link directly." | CTA lockup | **Completely static until the last frame:** Motion luminance 204.5–204.6, bbox constant, glow constant. The 11 remaining spoken words get **no captions**. There is no exit animation; the video ends on the lockup. | — | 64 frames (2.13 s) of hold. |
| 888–896 | 29.60–29.87 | "directly." and the tail | Audio | Tonal comb in the spectrogram at the very end. | — | **(inferred)** an outro sting or music tail. |

---

## 3. Caption behaviour

### 3.1 Groups (maximum 3 words, lowercase, no punctuation)

| # | Group | On screen (frames) | Duration | Word-by-word reveal frames | Style |
|---|---|---|---|---|---|
| G1 (pre) | style with | 704–718 | 15 f | style 704, with 715 | *style* blue serif italic, "with" sans |
| G2 | the same | 720–728 | 9 f / 300 ms | 720, 724 | sans |
| G3 | animations | 730–742 | 13 f / 433 ms | 730 | *serif italic*, white |
| G4 | and the same | 744–755 | 12 f / 400 ms | 744, 747, 751 | sans |
| G5 | sound effects | 757–780 | 24 f / 800 ms | 757, 764 | *serif italic*, white, both words |
| G6 | so go try | 781–789 | 9 f | 781, 782, 786 | sans |
| G7 | it yourselves | 791–817 | 27 f / 900 ms | 791, 795 | sans |
| G8 | *comment* / "Motion" | 818–896 (end) | 79 f / 2.63 s | 818, 827 | CTA lockup (two lines) |

Layout rule (measured on every group): each group is **laid out once as a centred line at its final width**. Each word is then **revealed in its final slot**, so the first word appears left of centre (for example "it" at x 170–204 inside "it yourselves", x 169–553). Words never slide over as the next one arrives.

### 3.2 Timing relative to speech

| Word | Acoustic onset (f) | First caption frame | Lag (f) |
|---|---|---|---|
| the | 719.1 | 720 | +1 |
| same | 720.9 | 724 | +3 |
| animations | ≈728 | 730 | +2 |
| and | ≈740.7 | 744 | +3 |
| the | ≈746.7 | 747 | 0 |
| same | 750.3 | 751 | +1 |
| sound | 757.8 | 757 | −1 |
| effects | ≈764 | 764 | 0 |
| so | 780.6 | 781 | 0 |
| go | ≈789–791 | 782 | −8 |
| try | 795.3 | 786 | −9 |
| it | ≈802.5 | 791 | −11 |
| yourselves | ≈804 | 795 | −9 |
| Just | 822.3 | — | dropped |
| comment | 826.8 | 818 | −9 |
| motion | ≈833.7 | 827 | −7 |
| down … directly (10 words) | 842–890 | — | not captioned |

- In **Layout A** the captions track speech tightly: mean lag +1.1 f, range −1 to +3.
- In **Layout B** the captions run **7–11 frames early**. Both whisper models and the acoustic check agree on this. "So" is the exception: it is in sync because it sits on the cut.
- My reading is that the CTA captions were front-loaded deliberately so the viewer reads the instruction before hearing it. That is **(inferred)**.
- **Recommendation for our generator:** reveal each word at onset − 1 f in normal scenes. For a CTA sentence, front-load the reveal by about 6–8 f, and put the keyword up early.

### 3.3 Word entrance animations (two variants, both 3 frames)

- **A. "Blur-rise". Used on dark B-roll scenes and measured identically on 8 words.**
  - The first visible frame is at about 77 % opacity, heavily blurred, and 3.5 px low.
  - The next frame is about 90 % opacity, half-blurred, and 1.2 px low.
  - The third frame is 100 %, sharp, and 0.6 px low. The word settles fully on frame 4.
  - The blur is isotropic Gaussian, not motion blur.
  - GSAP estimate: `from {opacity:0, filter:'blur(8px)', y:6}` over 0.13 s (4 f, starting one frame before first visibility) with `expo.out`.
- **B. "Ghost-fill". Used on the full-screen face and measured on 5 words.**
  - The first frame shows only a crisp hairline or outline version of the glyphs, about 3 % of the final filled pixels and about 40 % brightness.
  - The next frame is about 76 % filled. The third frame is fully filled bold. The word rises about 2 px.
  - It is **not** blurred.
  - Implement as a `-webkit-text-stroke` of 1 px with the fill opacity going 0 → 0.75 → 1, or as a variable-font weight tween from 200 to 700 over 3 f with `power2.out` **(inferred mechanism; the look is measured)**.

### 3.4 Emphasis selection and styling

- **Serif italic** (a high-contrast bold italic serif; DM Serif Display Italic or Playfair Display Italic are the closest free matches, **inferred**) is given to the **payload nouns of the claim**: *animations* and *sound effects*. These are the things the product reproduces. Before the segment, *style* got the same treatment in **blue #85C1F3**.
- An emphasis word or phrase always **gets its own group**. It is never mixed with function words.
- Font size matches the sans captions: x-height 33 px against 36 px, with the baseline 4 px higher.
- The **CTA keyword** gets the strongest treatment in the whole segment:
  - It is set in quotes.
  - The font is about 1.4× size, heavy sans, with a white-to-blue (#E1F0F9 → #539AFD) vertical gradient and a blue under-glow.
  - It enters with a 6-frame flicker plus a 12 px rise.
  - It is paired with a serif-italic setup verb (*comment*), which pops in stretched (scaleX 1.165 → 1) and then **recedes**: it shrinks 14 % in width and fades to a white → 60 % gray gradient when the keyword lands.

### 3.5 Exits

- Every regular group exits with a **hard cut** (100 → 0 % in one frame), with no animation. In Layout A, one empty frame follows (719, 729, 743, 756, 790).
- When a layout change coincides with a group change, the old group is held for the cut frame and re-anchored to the new layout's caption line (frame 780).
- The CTA lockup **never exits**. It is the final frame of the video.

---

## 4. Transition catalog

| # | Frames | Between | Technique | Duration | Measured detail |
|---|---|---|---|---|---|
| T1 | 715–732, cut at 724 | Clip A (icon orbit) → clip B (menu bar), inside the static cards | **Blur-through inside a fixed frame.** The media is Gaussian-blurred out, hard-cut, and blurred back in. The card chrome, pills, backdrop and captions do not move. | 8 f out (267 ms) + 8 f in = 16 f / 533 ms | Laplacian goes 200 → 4, cut, then 10–23 → 250–650. The cut frame is synced to a caption word reveal ("same", 724). |
| T2 | 757–780 | Layout A → Layout B | **Accelerating drift and blur-out, then a hard cut.** The media accelerates upward (0 → 4 px/f) from about 757, blurs over the last 5 frames (775–779), and hard-cuts to the full-screen face on the first phoneme of the next sentence. There is no entrance effect on the face. | 23 f drift, 5 f blur, 0 f in | Possible whoosh SFX peaking on the cut frame **(inferred)**. Captions re-anchor from baseline 993 to 918 on the cut frame. |
| T3 | 719, 729, 743, 756, 790 | Caption group → caption group | Hard out, 1 empty frame, then the next group's first-word entrance. | 1 f gap | In Layout B the gap is replaced by the ghost first frame (781) or by nothing (817 → 818). |
| T4 | each word | Word reveal | A: blur-rise, 3 f. B: ghost-fill, 3 f. | 100 ms | §3.3 |
| T5 | 827–833 | Punch-word entrance | Flicker-on (opacity 0.2, 0.58, 0.43, 0.79, 0.67, 1.0) plus a 12 px rise and a blur → sharp. The setup word flickers in anti-phase. | 6 f / 200 ms | §2 |
| T6 | 818–838 | Setup-word entrance | Full-opacity cut-in at scaleX 1.165, settling to 1.0 on power3.out. | 20 f / 667 ms | Height constant. |

---

## 5. Editorial logic, generalised into reusable rules

1. **Claim of equivalence leads to labelled A/B proof cards.**
   - In the reference, "recreate … in that exact style with the same animations and the same sound effects" is shown as two stacked 4:3 cards labelled *original* (black pill) and *Frame by Frame remake* (blue pill), playing in lockstep.
   - **Rule:** when the script asserts that something matches, copies, beats, or turns *before* into *after*, stack the two versions vertically. Use identical card sizes and pill labels (neutral/black for the baseline, accent/blue for "ours"), and play them in sync.
2. **Repeated claim keyword leads to a new example, not a new layout.**
   - The second "same" gets a fresh comparison pair (T1 at frame 724). The cards, labels and backdrop are untouched, and only the media swaps, through a blur-through.
   - **Rule:** in a list of parallel claims, keep the container fixed and swap only its contents on the repeated keyword. Use a 16-frame blur-through centred on the word reveal. Hold each example for at least about 1.8 s (clip B ran 56 f).
3. **Payload nouns get serif italic in their own group.**
   - The function phrases "the same" and "and the same" stay bold sans. *animations* and *sound effects* get serif italic in their own groups.
   - **Rule:** in any sentence, find the 1–2 nouns or adjectives that carry the value proposition. Isolate them as single-concept groups in serif italic (optionally tinted with the accent colour). Keep other groups at 1–3 words in bold sans.
4. **Demonstration ending in direct address leads to a hard cut to a full-screen presenter.**
   - The proof section has no presenter at all. The imperative sentence "So go try it yourselves" cuts to a full-bleed face on its first phoneme, after the B-roll accelerates and blurs out.
   - **Rule:** when the script switches from showing to telling the viewer to act (imperatives such as "go", "try", "comment", "follow", "grab"), end the B-roll with an accelerating blur-out and cut to the full-screen character on the sentence's first phoneme. Put a whoosh on the cut.
5. **Comment-to-get keyword leads to a persistent two-line CTA lockup.**
   - The verb goes on line 1 in serif italic and pops in stretched. The keyword goes on line 2 in quotes, about 1.4× size, accent gradient with glow, and flickers on.
   - The setup word then recedes, and the lockup holds to the end. Everything said after the keyword is left uncaptioned.
   - **Rule:** for any CTA keyword ("comment X", "type X", "search X"), build this lockup. Front-load it about 6–8 frames before the keyword is spoken. Stop all further captions so the keyword is the final frame.
6. **Drop filler words.**
   - "Just" is never captioned; the next content word, *comment*, takes its slot early.
   - **Rule:** do not caption filler such as just, like, um, so-as-a-filler, or actually-as-a-filler, unless it is the only word in a beat.
7. **Each layout has its own caption anchor.**
   - Over B-roll, the baseline is at 77.6 % H, under the cards. On a full-screen presenter, it is at 71.7 % H, on the chest just below the chin.
   - On a layout cut, re-anchor any lingering caption to the new line on the cut frame.
   - **Rule:** captions sit in the empty band below the main visual and never overlap card content or the face. Keep groups under about 60 % W (the widest measured was 57.5 %).
8. **The presenter physically points at the CTA.** The hand points down at the caption for about 1.5 s while "motion down below" is spoken.
   - **Rule:** when a caption is the instruction, the character's gesture points at the caption.

---

## 6. Talking-head region, and how to translate it to the pixel-art sprite

### What the reference does

- **Frames 720–779:** no presenter. The B-roll cards and the blurred navy backdrop own the whole frame, and the voice continues off-screen.
- **Frames 780–896:** a full-bleed, locked-off close-up. The head and shoulders fill about 83 % of the width, with eyes at 33.6 % H and chin at 61 % H. There is no zoom, punch-in or reframing for the whole 3.9 s, and no background treatment: it is the real pale-sage wall (#C5CAB6–#D1D4C9).
- The energy comes from the presenter's own performance:
  - a grin on the cut (780–785)
  - eyes closing for emphasis on "it yourselves" (795–800)
  - an open-palm gesture (800–812)
  - a downward point at the CTA caption (828–860)
  - a point at the viewer on "I'll DM you" (864–873)
  - hands together, then out of frame, then plain talking to the end.
- The bright face scene contrasts with the dark navy proof scene, which signals the mode change.

### Sprite translation

- **During proof or B-roll sections, hide the sprite.** The reference never shows the presenter over the A/B cards.
- **On the CTA cut, show a full-bleed sprite close-up.**
  - Crop the 1254×1254 sprite to head and torso and scale by an integer factor with `image-rendering: pixelated`.
  - Place the head top at about 4 % H, the eyes at about 34 % H, and the chin at about 60 % H. That leaves the torso band at 67–83 % H clear for captions, which is where the reference captions sit, on the shirt.
- **Background:** use a light, neutral, flat or softly blurred plate in the reference wall tones (#C5CAB6–#D1D4C9), plus a slight vignette. Do not reuse the navy B-roll backdrop.
- Add an **idle bob** to imitate the natural ±20 px head movement **(inferred recommendation)**: y ±4 px sine, period about 1.2 s, and rotation ±1°. Never add zooms; the reference has none.
- **Mouth:** alternate the `-talk` and `-neutral` variants of the current pose at syllable rate, driven by the voiceover's RMS (open above a threshold), with frames held 2–4 f. Close the mouth in pauses (for example 27.14–27.40 s here).

| Frames (reference) | Spoken beat | Reference performance | Sprite pose (file in `kyle-sprite-pack/characters/`) |
|---|---|---|---|
| 780–785 | (cut) "So…" | Big grin carried from the previous line | `kyle-idle-smile.png` for the first 4–6 f after the cut |
| 786–799 | "go try" | Talking, eyes close for emphasis | `kyle-wave-talk.png` / `kyle-wave-neutral.png` (inviting "go try") |
| 800–817 | "it yourselves" | Open palm rises toward the viewer | `kyle-present-right-talk.png` / `-neutral` (palm out) |
| 818–827 | (pause) "Just comment" | Neutral, then talking; *comment* caption pops | `kyle-idle-talk-small.png`, then `kyle-idle-talk.png` |
| 828–860 | "motion down below" | **Hand points at the CTA caption** | `kyle-point-right-talk.png` / `-neutral`, with the sprite shifted about 8–10 % W left so the fingertip ends near the left quote of "Motion" at x≈186, y≈930. The sprite has no point-down pose, so the horizontal point aimed at the caption is the closest match. |
| 861–873 | "and I'll DM you" | Points toward the camera, at the viewer | `kyle-present-left-talk.png` or `kyle-idle-talk-wide.png` (addressing "you") |
| 874–896 | "the link directly." + end | Hands drop, plain talking, then a closing smile | `kyle-idle-talk.png` → hold `kyle-idle-smile.png` for the final 6–8 f under the static CTA lockup |

---

## 7. HyperFrames/GSAP specs (from the measurements)

```js
// Layout A word entrance (blur-rise), 4 f tween starting 1 f before onset
tl.fromTo(word, {opacity:0, filter:'blur(8px)', y:6},
               {opacity:1, filter:'blur(0px)', y:0, duration:4/30, ease:'expo.out'}, onset - 1/30);
// Layout B word entrance (ghost-fill), 3 f
tl.fromTo(word, {'--fill':0, y:2}, {'--fill':1, y:0, duration:3/30, ease:'power2.out'}, onset);
// (word: color: rgba(255,250,245,var(--fill)); -webkit-text-stroke:1px rgba(255,255,255,.45))
// Group exit: hard cut
tl.set(group, {autoAlpha:0}, nextGroupStart - 1/30);
// In-card media swap (blur-through, cut on the keyword reveal)
tl.to(mediaA, {filter:'blur(14px)', duration:8/30, ease:'power2.in'}, cutT - 8/30)
  .set(mediaA, {autoAlpha:0}, cutT).set(mediaB, {autoAlpha:1, filter:'blur(14px)'}, cutT)
  .to(mediaB, {filter:'blur(0px)', duration:8/30, ease:'power2.out'}, cutT);
// Pre-cut exit of B-roll (accelerating drift + blur), then hard cut to presenter
tl.to(media, {yPercent:-8, duration:23/30, ease:'power3.in'}, sceneCut - 23/30)
  .to(media, {filter:'blur(12px)', duration:5/30, ease:'power2.in'}, sceneCut - 5/30);
// CTA lockup
tl.fromTo(setupWord, {scaleX:1.165, transformOrigin:'30% 50%'}, {scaleX:1, duration:20/30, ease:'power3.out'}, ctaT);
tl.fromTo(keyword, {y:12, filter:'blur(6px)'}, {y:0, filter:'blur(0px)', duration:6/30, ease:'power2.out'}, ctaT + 9/30);
[0.2,0.58,0.43,0.79,0.67,1].forEach((o,i)=> tl.set(keyword,{opacity:o}, ctaT + (9+i)/30));
tl.set(setupWord, {'--dim':1}, ctaT + 14/30); // switch to white→#9A9597 gradient fill
```

Frame offsets in the CTA block are relative to `ctaT` = the first appearance of the setup word: the keyword appears 9 f later (frame 827 against 818) and the flicker completes 14 f after `ctaT` (frame 832).
