# Motion curves of the reference edit (measured)

Source: `Ref Video For Editing Style.mp4`, 720×1280, 30 fps, 897 frames.
Conventions: **k** = 0-based frame index (file `f_{k+1}.png`), t = k/30 s. Pixel values are in the 720×1280 frame (multiply by 1.5 for a 1080×1920 HyperFrames comp). "%W/%H" = percent of 720/1280.
Every ease below was chosen by least-squares fitting the measured per-frame values against GSAP candidates. The fits had free start time, duration and endpoints unless noted. The residual (rmse) is given so the winners can be compared.
Measurement scripts and intermediate JSON: `scratchpad/work/motion/` (`easefit.py`, `bez.py`, `sim.py`, `wordfit.py`, `glitch.py`, `ring.py`, `cursor.py`, `shots_sim.json`, `cursor_384_545.json`).

Methods used: SIFT + RANSAC similarity transforms against a settled reference frame (scale, translation and fixed point). For text, ink-integral opacity (blur-invariant) plus a template fit over opacity, Gaussian σ, scale and dx/dy. Edge 10–90 % rise widths for blur. Template matching for the cursor. Angular-coverage for ring draw-ons. Phase correlation for scrolls.

---

## 0. Headline results

1. **Every shot change is a hard cut.** Consecutive-frame mean |Δ| shows one isolated spike at each detector hit (e.g. 2.2, 0.2, **81.0**, 1.5 at k84–88). There are no dissolves, wipes or whip transitions between shots.
2. **There is one camera move on cuts. It is used on all three cuts into a full-bleed dark B-roll scene (2.867 s, 10.767 s, 20.967 s).** The whole composite (card, caption and background) starts at **scale 1.15 about the exact frame centre (360, 640)**. It settles to 1.0 over **35.5 f = 1.183 s** with **cubic-bezier(0.32, 0.06, 0, 1)**, rmse 0.00023 (≈0.1 px). All three cuts give the same numbers to 3–4 decimals, so this is a preset.
3. Cuts into the light split layout or the full-screen face have **no motion**: no punch-in settle and no drift.
4. **The same custom bezier family carries almost every positional move:**
   - zoom settle: (0.32, 0.06, 0, 1)
   - card push: (0.3, 0, 0, 1)
   - in-screenshot camera pan/zoom: (0.2, 0, 0, 1)
   - cursor: (0.3, 0.03, 0.18, 1)

   These are slow-start, long-tail curves. No standard GSAP ease fits within 10× of their residual.
5. **Element entrances use the GSAP-style out eases:**
   - card pop: power3.out, 0.67 s
   - highlight-box wipe: expo.out, 0.72 s
   - text-selection sweep: expo.out
   - caption word: power2.out, 0.19 s, with +7 px rise and 4 px blur
6. **There is no slow drift or Ken Burns.** Every hold measures scale 1.0000 ± 0.0005 and translation < 0.3 px.
7. Nothing in the edit overshoots. No back or elastic fit ever won, and every measured curve is monotonic.

---

## 1. Opening B-roll card entrance (k0–23)

**Geometry (settled, k20).**
- Card outer border: x 78–642, y 317–638.5. That is w 564 px = **78.3 %W**, h 321.5 px = 25.1 %H, centre (360, 477.8) = (50 %, 37.3 %).
- Inner dark screen: x 118.4–596, y 365.6–635.
- Border is about 2 px, light blue (148, 183, 243) = #94B7F3, corner radius about 12 px. The card has a white browser chrome.

**Transform origin = card centre.** The inner-screen centre moved 498.0 → 500.2 px, which is exactly what scaling about y = 477.8 predicts. There is no translation.

| k | t (s) | scale | opacity (traffic-light R−G) | opacity (template fit) | blur σ (px) | inner-screen grey (lum) |
|---|---|---|---|---|---|---|
| 0 | 0.000 | – | 0 | 0 | – | – |
| 1 | 0.033 | 0.905 | 0.05 | 0.04 | ≈2 | 224 |
| 2 | 0.067 | 0.918 | 0.24 | 0.23 | ≤1 | 199 |
| 3 | 0.100 | 0.932 | 0.50 | 0.47 | 0 | 163 |
| 4 | 0.133 | 0.946 | 0.78 | 0.71 | 0 | 114 |
| 5 | 0.167 | 0.958 | 0.95 | ~1 | 0 | 13 |
| 6 | 0.200 | 0.967 | 1.00 | 1 | 0 | 13 |
| 7 | 0.233 | 0.975 | 1 | | | |
| 8 | 0.267 | 0.981 | | | | |
| 9 | 0.300 | 0.986 | | | | |
| 10 | 0.333 | 0.990 | | | | |
| 12 | 0.400 | 0.995 | | | | |
| 14 | 0.467 | 0.998 | | | | |
| 18 | 0.600 | 0.999 | | | | |
| 23 | 0.767 | 1.000 | | | | |

How these were measured:
- **Blur:** edge 10–90 % width was ≈6 px at k1 against 1.5–3 px when sharp, and sharp from k2. Blur is therefore negligible: at most σ≈2–3 px on the first visible frame.
- **Inner-screen grey:** the screen goes from grey to black and jumps 114 → 13 in one frame at k5. This happens *inside* the screenshot (the embedded clip's own first frames), not in the container. *Speculative:* it is not an editor tween, so reproduce only the container.

**Ease fits.**
- **Scale** (k1–23): **power3.out** rmse 0.0005, start k1.3, D 20 f = **667 ms**, 0.905 → 1. Close alternatives: power4.out 0.0006 (D 23.75 f), power2.out 0.0007 (D 16 f), expo.out 0.0012, back.out(0.8) 0.0014.
- **Opacity:** **sine.inOut** rmse 0.005, start k0.2, D 5.6 f = **187 ms**. Alternatives: power1.inOut 0.0065 (D 6 f), linear 0.020.

```js
gsap.set(card, { transformOrigin: '50% 50%' });
tl.fromTo(card, { opacity: 0, filter: 'blur(3px)' },
                { opacity: 1, filter: 'blur(0px)', duration: 0.19, ease: 'sine.inOut' }, T)
  .fromTo(card, { scale: 0.905 }, { scale: 1, duration: 0.667, ease: 'power3.out' }, T + 0.04);
```

**Same preset at 6.70 s (shot C, card first visible k202).**

| k | scale |
|---|---|
| 203 | 0.919 |
| 204 | 0.933 |
| 205 | 0.946 |
| 206 | 0.958 |
| 207 | 0.967 |
| 208 | 0.975 |
| 209 | 0.982 |
| 210 | 0.987 |
| 211 | 0.991 |
| 215 | 1.000 |

The fixed point is (360, 508), the card centre. This matches the opening curve within 0.001.

---

## 2. Headline highlight-box wipe

Box colour **rgb(2, 131, 250) #0283FA**, square corners. The left edge stays fixed while the width grows, so the box wipes from left to right.

| | Opening "Motion Graphics" | Shot C "It's Called" |
|---|---|---|
| final box | x 106–614 (w 509 = 70.7 %W), y 206–293 (h 88 = 6.9 %H) | x 202–517 (w 316 = 43.9 %W), y 160–249 (h 90) |
| first visible | k5 (0.167 s) | k201 (6.70 s) |

| frame offset | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| opening width px (k5…) | 28 | 146 | 254 | 323 | 372 | 408 | 435 | 456 | 473 | 485 | 495 | 501 | 506 | 508 | 509 |
| normalised, opening | .055 | .287 | .499 | .635 | .731 | .802 | .855 | .896 | .929 | .953 | .972 | .984 | .994 | .998 | 1 |
| normalised, "It's Called" | .051 | .285 | .500 | .636 | .734 | .804 | .858 | .899 | .930 | .956 | .975 | .987 | .997 | 1 | 1 |

The two wipes are identical when normalised, so this is a preset.

**Ease fit** (endpoints fixed):

| ease | rmse | duration | start |
|---|---|---|---|
| **expo.out** | 3.9 px | 21.75 f = **725 ms** | k4.8 (shot C: 2.7 px, 708 ms) |
| power4.out | 4.9 px | 625 ms | |
| power3.out | 6.2 px | | |
| power2.out | 8.6 px | | |
| back.out(0.8) | 12.7 px | | |

The width never exceeds the final value, so there is no overshoot.

**Text inside the box.**
- White (230, 249, 250), italic serif.
- It is clipped by the box rather than squashed, so animate a clip and not scaleX.
- Each word fades and rises in on its own, at k9 ("Motion") and k12 ("Graphics").
- Measured on "Motion":

| frame offset | opacity | dy (px) | blur σ (px) |
|---|---|---|---|
| +1 | .42 | +8 | 2.5 |
| +2 | .69 | +4.1 | 1.5 |
| +3 | .84 | +2.0 | 1 |
| +4 | .95 | +1.3 | 0 |
| +5 | .98 | +0.5 | 0 |
| +6 | 1 | 0 | 0 |

Fits: opacity **power3.out 267 ms** (rmse .006); y **expo.out 342 ms from +22 px** (rmse 0.15 px).

```js
tl.fromTo(box, { clipPath: 'inset(0 100% 0 0)' },
               { clipPath: 'inset(0 0% 0 0)', duration: 0.72, ease: 'expo.out' }, T);
tl.fromTo(boxWord, { opacity: 0, y: 22, filter: 'blur(4px)' },
                   { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.34, ease: 'expo.out' }, Tword);
```

## 3. Headline word stagger (opening title "Claude Can Now Make")

- Colour rgb(18, 20, 23) #121417, bold sans. Text rows y 143–185.
- First visible frames: Claude k1, Can k3, Now k6, Make k8. The box follows at k5, then box words at k9 and k12.
- Mean **stagger is 2.33 f = 78 ms**. The headline is not synced to speech.

Per word ("Make", k8 = first visible):

| frame offset | opacity | dy (px) | blur σ (px) |
|---|---|---|---|
| +0 | .12 | +15.2 | 4 |
| +1 | .33 | +8.0 | 1.5 |
| +2 | .51 | +4.1 | 1 |
| +3 | .67 | +2.1 | 0 |
| +4 | .77 | +1.4 | 0 |
| +5 | .85 | +0.7 | 0 |
| +6 | .91 | 0 | 0 |
| +7 | .98 | | |
| +8 | 1.0 | | |

The other words measure the same: "Can" .12/.34/.51/.67 with dy 15.6/7.3/4.1/2.0. "Claude" and "Now" start one step later in the same curve.

Fits: opacity **power2.out 392 ms** (rmse .006); y **expo.out 358 ms from +29 px** (rmse 0.16 px). The slow opacity reads as grey → black.

```js
tl.fromTo(titleWords, { opacity: 0, y: 29, filter: 'blur(6px)' },
  { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.39, ease: 'power2.out', stagger: 0.078 }, T);
// y ideally on its own tween: duration 0.36, ease 'expo.out'
```

---

## 4. Caption word entrances

**Layout facts.**
- Line layout is computed for the whole page and stays centred. Words are revealed in place, and the line never re-centres.
- At a page change the old page is cut instantly, followed by **one blank frame (33 ms)** (k9, k412, k430). The first word of the next page then enters.
- At a shot cut the current caption is re-drawn for one frame in the new scene's caption style and position (k629 "brand or product", k780 "sound effects").
- Caption y positions, top–baseline:

| layout | y (px) | %H |
|---|---|---|
| light split | 670–720 | 52–56 %H |
| dark B-roll | 931–993 | 73–78 %H (rides the zoom) |
| full face | 868–931 | 68–73 %H |

- Colours:
  - plain dark text: rgb(17, 21, 23) #111517
  - white text on dark scenes: has a soft drop shadow
  - italic emphasis: rgb(3, 128, 224) #0380E0 (serif italic)

### 4a. Plain words (frame offset from the blank or previous frame)

| word (first visible k) | +1 opac / blur / dy | +2 | +3 | +4 | +5 |
|---|---|---|---|---|---|
| "can" (k6) | .51 / 2.0 / +3.3 | .78 / 1.0 / +1.0 | 1.0 (page cut at k9) | | |
| "now" (k10) | .45 / 1.5 / +3.3 | .71 / 1.0 / +1.3 | .91 / 0 / +0.7 | 1.0 | |
| "for" (k413) | .45 / 2.0 / +4.1 | .71 / 1.0 / +1.7 | .91 / 0 / +0.8 | 1.0 | |
| "videos" (k431) | .42 / 2.0 / +4.0 | .65 / 1.0 / +1.6 | .84 / 0 / +0.8 | .93 / 0 / 0 | .97 → 1.0 |
| "professional" (italic blue, k27) | .50 / 4.0 / +3.8 | .70 / 1.0 / +2.0 | .87 / 1.0 / +0.8 | .98 / 0 / +0.2 | 1.0 |

- Scale was fitted for every word and was always 1.000: **captions do not scale-pop**.
- Horizontal offset is under 0.5 px, except −3.8 px on the first frame of the italic word.

Fits on the mean curve:
- **Opacity:** **power2.out D 5.7 f = 190 ms**, starting on the blank frame (rmse .010). Alternatives: circ.out .011, power3.out .011 (240 ms), linear .02+.
- **y:** **power2.out 177 ms from +7.3 px** (rmse 0.14 px). circ.out fits 0.11 px but needs a +0.8 f delay.
- **Blur:** about 4 px → 0 on the same curve (predicted 2.2, 1.1, 0.4 against measured 2, 1, 0).

```js
tl.fromTo(word, { opacity: 0, y: 7, filter: 'blur(4px)' },
                { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.19, ease: 'power2.out' }, wordStart);
// italic emphasis word: same, but blur 8px and duration 0.23
```

### 4b. "Glitch" entrance (used on the brand word "Claude": 0.03 s, 10.13 s, 21.07 s)

Per-frame measurements:
- "ink" is integrated opacity, where 1 = settled word. Values above 1 come from the RGB fringes.
- "bands" is the horizontal displacement in px of 5 horizontal slices (top → bottom), from cross-correlation against the settled word.
- RGB is the R- and B-channel horizontal shift.

| k | ink | bands (px, top→bottom) | RGB split |
|---|---|---|---|
| 1 | 0.12 (faint, double image, σ≈3) | ±10 (noisy) | – |
| 2 | **1.17** | −1, +5, +5, −6, −6 | R −5 / B +5 (10 px apart) |
| 3 | 0.77 | −1, +4, +5, −5, −5 | R −3 / B +3 |
| 4 | 0.25 (light grey, blurred) | +3, +2, +2, +2, +2 | 0 |
| 5 | 1.04 | +2 … +2 | 0 |
| 6–7 | 1.05 | +5 → +2 (slight skew) | 0 |
| 8 | 1.00 | 0 | 0 |

| k (10.13 s) | ink | bands |
|---|---|---|
| 304 | 1.24 | +4, +5, +5, +5, −10 |
| 305 | 0.12 | +1, +3, +3, +4, −5 |
| 306 | 1.21 | −2, +9, +9, +9, +4 |
| 307 | 0.80 | −1, +4, +8, +8, +4 |
| 308 | 0.28 | 0, −7, −7, −7, +4 |
| 309 | 1.12 | 0, −6, −6, −6, +4 |
| 310–311 | 1.03 | ±1 |
| 312 | 1.00 | 0 |

At 21.07 s (dark scene, white text) the ink sequence over k632–642 is .66, **.02**, .70, .64, **.24**, .75, .72, .70, .89, .96, 1.0. In k638–639 the bottom slice is shifted −25 px, and the R/B split is about ±5 px on k632 and k634.

**Signature.**
- Length 7–10 f (233–333 ms).
- Opacity flickers hi/lo roughly [1, 0.1, 1, 0.8, 0.25, 1, 1].
- 2–3 horizontal slices are displaced 4–10 px in alternating directions, with up to 25 px on a single thin slice.
- R/B fringes of ±3–5 px appear on the "hi" frames.
- The settled word is sharp with no blur.

```js
// clones: .g-a (top slice), .g-b (middle), .g-c (bottom) via clip-path inset bands; fringe via text-shadow
const f = 1 / 30, G = gsap.timeline();
[[1, .12, [0, 0, 0], 0], [1, 1, [5, 5, -6], 5], [1, .78, [4, 5, -5], 3], [1, .25, [2, 2, 2], 0],
 [1, 1, [-7, -7, 4], 0], [1, 1, [2, 2, 2], 0], [1, 1, [0, 0, 0], 0]]
.forEach(([_, o, [a, b, c], rgb], i) => {
  G.set(word, { opacity: o, textShadow: rgb ? `${-rgb}px 0 rgba(0,140,255,.85), ${rgb}px 0 rgba(255,60,60,.85)` : 'none' }, i * f)
   .set(sliceA, { x: a }, i * f).set(sliceB, { x: b }, i * f).set(sliceC, { x: c }, i * f);
});
tl.add(G, wordStart);
```

### 4c. CTA (27.27 s →)

**"comment" (white italic serif).**
- Hard cut-in at **k818** at full opacity, and the previous caption is replaced in the same frame.
- It then **scales down from about 1.17 to 1.0**: width 360, 352, 345, 340, 335, 331, 328, 324, 322, 320, 317, 316, 314, 313, 310, 309 px (k818–833).
- Fit: **circ.out 817 ms** (rmse 0.46 px). Alternatives: power4.out 1.27 s 0.73, power3.out 1.03 s 0.78, expo.out 0.79.

**"Motion" (bold sans, quoted, light-blue gradient ≈ rgb(139, 199, 246) #8BC7F6 with a blue glow).**
- Width is constant at 346 px (48 %W), x 186–532, so there is **no scale**.
- The top edge rises 945 → 932 px (13 px) over k828–833.
- Bright-pixel count and glow by frame (glow = mean B−R in a band 0–45 px below the word):

| k | text px | glow (B−R) | state |
|---|---|---|---|
| 827 | 0 (blurred ghost) | 23.7 | blur-in |
| 828 | 4231 | **52.9** | ON + bloom |
| 829 | 40 | 26.3 | OFF |
| 830 | 4869 | 37.3 | ON |
| 831 | 2120 | 27.9 | 50 % |
| 832 | 5793 | 36.5 | ON |
| 833 → 896 | 5980 ± 10 | 34.0 ± 0.3 | steady |

The glow is constant to the end of the video, so there is **no pulse or breathing**. The bloom on the first ON frame is 1.55× the steady glow.

```js
tl.set(comment, { opacity: 1 }, 27.267)
  .fromTo(comment, { scale: 1.17 }, { scale: 1, duration: 0.82, ease: 'circ.out' }, 27.267);
const M = gsap.timeline();
[[0.3, 'blur(6px)', 0.8], [1, 'none', 1.55], [0, 'none', 0.8], [1, 'none', 1.1], [0.5, 'none', 0.8], [1, 'none', 1], [1, 'none', 1]]
  .forEach(([o, flt, glow], i) => M.set(motion, { opacity: o, filter: flt, '--glow': glow }, i / 30));
tl.add(M, 27.567).fromTo(motion, { y: 13 }, { y: 0, duration: 0.2, ease: 'power2.out' }, 27.6);
```

---

## 5. What happens at each detector cut

| t (s) | k | from → to | motion on the cut | measured |
|---|---|---|---|---|
| 2.867 | 86 | light split → dark tweet card | **zoom-out settle** | scale 1.149 → 1.000 about (360, 640); card bbox h 810 → 705 px |
| 6.533 | 196 | dark card → **pure white #FFFFFF for 5 f (167 ms, k196–200)** | then box wipe (k201) + card pop (k202), same presets as the opening | §1, §2 |
| 7.867 | 236 | white title → light split | none (card static at x 46–673, y 158–625 = 87.1 %W; face layer static) | SIFT s = 1.0000 |
| 10.767 | 323 | light split → dark prompt card | **zoom-out settle** (same numbers as k86) | table below |
| 12.600 | 378 | dark → light split | none | card bbox unchanged; chair edges x = 38/680 unchanged |
| 18.433 | 553 | light split → **full-screen face** | none: hard cut to a ×1.74 tighter crop of the face camera | SIFT 552→553 s = 1.736; 584→583 s = 1/0.568 = 1.76; face centre y ≈ 1000 → ≈ 490; ECC scale 0.985 ± 0.002 over k553–564 |
| 19.467 | 584 | full face → light split | card frame static; **content inside is mid-zoom** (§6a) | |
| 20.967 | 629 | light split → dark comparison (two stacked cards) | **zoom-out settle** (same numbers) + label fades | §5b |
| 24.133 | 724 | content cut **inside** the fixed comparison cards | none (s = 1.0000, \|t\| < 0.1 px) | |
| 26.000 | 780 | dark comparison → full face | none | ECC 1.0175 ± 0.002 over k780–791 |

Card-to-card swap inside the light layout, without a detector hit: 17.90–18.40 s (k537–552), §5c.

### 5a. Zoom-out settle (shared by k86, k323, k629)

Whole-frame SIFT for k323 (fixed point (360 ± 1, 640 ± 1) on every frame, 400–1100 inliers):

| +f | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 17 | 19 | 21 | 23 | 25 | 27 | 29 | 31 | 33 | 35 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| scale | 1.1497 | 1.1489 | 1.1468 | 1.1432 | 1.1371 | 1.1273 | 1.1130 | 1.0961 | 1.0808 | 1.0684 | 1.0585 | 1.0502 | 1.0434 | 1.0376 | 1.0326 | 1.0283 | 1.0211 | 1.0156 | 1.0112 | 1.0079 | 1.0053 | 1.0032 | 1.0018 | 1.0008 | 1.0002 | 1.0000 |

- k86 by SIFT gives 1.1497, 1.1469 (+2), 1.1372 (+4), 1.1130 (+6), 1.0810 (+8), 1.0586 (+10), 1.0328 (+14).
- k629 by card bbox gives 1.151, 1.149, 1.145, 1.142, 1.136, 1.127, 1.112, 1.096, 1.082, 1.069, 1.060, …

Both match the k323 table.

Fit comparison (end = 1 fixed):

| ease | rmse | duration | note |
|---|---|---|---|
| **cubic-bezier(0.32, 0.06, 0, 1)** | **0.00023** | 35.5 f (1.183 s) | starts on the cut frame, from 1.1503 |
| cubic-bezier(0.25, 0, 0, 1) | 0.00072 | | |
| cubic-bezier(0.2, 0, 0, 1) | 0.00265 | | |
| critically damped spring | 0.0020 | | |
| power3/4.out | 0.0027 | | needs a 3 f hold first |
| expo.out | 0.0039 | | |
| power1.inOut | 0.0063 | | |

**Motion blur.** The 10–90 % width of the card's top edge (static 3.1 px) by frame offset:

| +f | 0–3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13+ |
|---|---|---|---|---|---|---|---|---|---|---|---|
| width (px) | 3.1–3.3 | 3.7 | 5.3 | **6.6** | **6.6** | 5.8 | 4.8 | 4.6 | 4.2 | 3.5 | ≈3.2 |

The extra blur peaks at about 5.8 px when the edge moves about 8 px per frame. That is a directional blur of roughly 0.75× the per-frame displacement, close to a 270° shutter.

```js
CustomEase.create('settle', 'M0,0 C0.32,0.06 0,1 1,1');
// stage = wrapper containing background + card(s) + captions, origin = frame centre
tl.fromTo(stage, { scale: 1.15, transformOrigin: '50% 50%' },
                 { scale: 1, duration: 1.183, ease: 'settle' }, cutTime);
// optional fake motion blur: filter blur(0→2.5px→0) peaking at +0.2 s
```

### 5b. Comparison layout (20.967 s)

- Two equal cards: **x 128–592 (w 464 = 64.4 %W), h 352 (27.5 %H)**. Top card y 159–511, bottom card y 526–878 (gap 15 px). The pair centre (360, 518.5) sits above the frame centre.
- On the cut both cards are 1.151× (w 534, top y 87). The settle is the zoom above.
- Labels:
  - "original": dark pill rgb(55, 55, 56), fades in k636–639 (4 f, 133 ms).
  - "Frame by Frame remake": blue pill rgb(12, 133, 244) #0C85F4, fades in k646–648 (3 f).
  - Stagger 10 f = 333 ms. These were read visually; the numeric count was confounded by the moving background.

### 5c. Card push swap (17.90 s, k537–552, light layout)

- The old and new cards sit on **one strip 767 px apart** (106.5 %W). The separation was constant: −230/+538 at k541 and −356/+410 at k542.
- The strip translates left by 767 px.

| k | 537 | 538 | 539 | 540 | 541 | 542 | 543 | 544 | 545 | 546 | 547 | 548 | 549 | 550 | 551 | 552 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| strip x (px) | 0 | −7 | −37 | −97 | −230 | −357 | −448 | −515 | −566 | −606 | −639 | −665 | −687 | −705 | −720 | −732 |

- Fit (0 → −767 fixed):

| ease | rmse | duration | start |
|---|---|---|---|
| **cubic-bezier(0.3, 0, 0, 1)** | **3.4 px** | 22 f = **733 ms** | k537 |
| (0.32, 0.06, 0, 1) | 5.3 px | 750 ms | |
| power3.inOut | 45 px | | |
| expo.inOut | 81 px | | |

- Heavy horizontal motion blur on k539–545, peaking around 130 px per frame.
- The cut to the face (k553) lands before the move finishes, with 35 px left.

```js
tl.to(strip, { x: -767, duration: 0.733, ease: CustomEase.create('push', 'M0,0 C0.3,0 0,1 1,1') }, T);
```

---

## 6. Moves inside the screenshot (camera within the card)

All of these move the content group: screenshot, rings, highlights and cursor move together.

### 6a. Zoom into the prompt box (shot H, k584–612)

Content transform relative to k612 (SIFT, 100–1800 inliers, fixed point ≈ (198, 978) screen px):

| k | 587 | 589 | 591 | 593 | 595 | 597 | 599 | 601 | 603 | 605 | 607 | 609 | 611 | 612 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| scale | .781 | .834 | .873 | .903 | .926 | .945 | .960 | .972 | .981 | .988 | .994 | .997 | 1.000 | 1 |
| ty (px) | 214 | 163 | 125 | 95 | 73 | 54 | 39 | 28 | 19 | 12 | 6 | 3 | 0.4 | 0 |

- k584–586 are too motion-blurred for SIFT.
- Fit: **cubic-bezier(0.2, 0, 0, 1)**, rmse 0.0002 (ty 0.20 px), **34 f = 1.133 s**, starting **k579.2, 4.8 f before the cut**. Over the whole move scale goes 0.497 → 1 and ty 475 → 0.
- At the cut the move is 32 % done (scale 0.657, ty +324).
- Alternatives: (0.32, 0.06, 0, 1) 0.0005; circ.out 0.0009; power4.out 0.0016; expo.out 0.0041.
- To reproduce, start the tween 0.16 s before the shot becomes visible.

### 6b. Horizontal pan to "Charts" (shot F, k497–525)

- Tracked from the Phone ring's right edge: 481, 475, 452, 402, 341, 291, 253, 223, 197, 177, 159, 144, 131, 119, 110, 101, 94 px (k497–513).
- Fit: **cubic-bezier(0.2, 0, 0, 1)**, rmse **0.95 px**, start k497, **28 f = 933 ms**, Δx ≈ **−422 px**. Δy is −33 px (ring y 356 → 323).
- A slight scale-down of about 0.97 is possible but not reliable, because motion blur biases SIFT.
- Strong horizontal motion blur on k499–505.

### 6c. Scroll in the tweet card (k163–191, phase correlation)

This is probably the source screen recording's own scroll, not an editor tween.
- Flick 1, k163–173: −268 px, sine.out about 0.3 s (rmse 4.6 px).
- Flick 2, k174–191: −670 px. Velocity peaks at 66 px/f around k179, then the move stops abruptly at k192 while still at 12 px/f.

### 6d. "230" callout (shot D, 8.43–9.80 s)

**Ring draw-on** around "230" in the text (§6e): k253–258.

**Stat block** (big "230" in rgb(13, 134, 243), and "real examples" in grey below) emerges from the ring at **k257**.
- Tracked by the label: width 76 → 183 px (scale 0.415 → 1). Centre (324, 390) → (360.5, 575.5), so it travels **+185 px down and +37 px right**.
- Label width (px) by frame:

| k | 257 | 258 | 259 | 260 | 261 | 262 | 263 | 264 | 265 | 266 | 267 | 268 | 270 | 272 | 275 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| width | 76 | 93 | 109 | 123 | 136 | 148 | 156 | 163 | 168 | 172 | 176 | 177 | 180 | 182 | 183 |

- Label centre y: 390, 423, 456, 483, 506, 524, 538, 548, 556, 561, 565, 569, 573, 574, 575.5.
- **There is no overshoot**: every series is monotonic.
- Fits:
  - scale: power3.out D 23 f (775 ms), rmse .0038; power4.out D 26 f (875 ms) from 0.25, .0045
  - y: power4.out 758 ms, rmse 1.07 px
- Final number bbox: x 274–451, y 462–537 (h 75 px = 5.9 %H). Label: x 269–452, y 567–584.
- **The digits roll like an odometer** from 0 to 230 over k257–270 (433 ms). Each digit column slides vertically with motion blur, and the last digits crawl 228 → 229 → 230 over k265–270, which is an ease-out.
- **White pill background with soft shadow.** Measured by occlusion of the text beneath it:

| k | 263 | 264 | 265 | 266 | 267 | 268 | 270 | 272 |
|---|---|---|---|---|---|---|---|---|
| opacity | 0 | .30 | .59 | .80 | .92 | .94 | .98 | 1 |

  That is power2.out, about 0.2 s.
- **Exit:**
  - pill opacity 0.97 (k289), .95, .82, .67, .50, .30, .15 (k295), so linear, about 7 f (233 ms)
  - number and label move up about 6 px over k291–292, then cut out at k293

```js
tl.fromTo(stat, { scale: 0.25, x: -37, y: -185, transformOrigin: '50% 50%' },
                { scale: 1, x: 0, y: 0, duration: 0.85, ease: 'power4.out' }, T)
  .fromTo(pillBg, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: 'power2.out' }, T + 0.23)
  .to(counter, { val: 230, duration: 0.43, ease: 'power3.out', snap: 'val' }, T)   // render as rolling digit strips
  .to(pillBg, { opacity: 0, duration: 0.23, ease: 'none' }, T + 1.1)
  .set(stat, { opacity: 0 }, T + 1.2);
```

### 6e. UI selection rings (stroke draw-on)

- Colour **rgb(23, 140, 236) #178CEC**, stroke about 3 px.
- Pill or rounded rectangle about 8–14 px larger than the target. The chip rings are 52 px tall; the "230" ring is 80 × 66 px.
- Drawn clockwise from the top-left; at 50 % the top and right sides are present.

| ring | frames (0 → 1) | drawn fraction per frame | best fit |
|---|---|---|---|
| "230" | k253–258 | 0, .47, .75, .88, .98, 1 | circ.out 4.8 f / power3.out 6.9 f (230 ms) |
| "Opus 5.5" | k360–365 | 0, .55, .80, .89, .96, 1 | expo.out 8.8 f / circ.out 5.2 f |
| "Prompt" | k402–405 | 0, .20, .82, 1 | ≈3 f |
| "Product UI" | k422–427 | 0, .08, .64, .88, .98, 1 | power3.out 5 f (167 ms) |
| "Phone" | k476–479 | 0, .16, .83, 1 | ≈3 f |

- **Exit:** opacity fades linearly over 4 f (133 ms) with no un-draw. Measured: Prompt 0.96 / .73 / .47 / .20 / 0 over k422–426; Product UI .98 / .72 / .45 / .20 / 0 over k470–474.
- **The exit overlaps the next ring's draw-on**, which is a crossfade.
- **Sync:** each ring completes as the cursor arrives, starting about 3 f before the cursor stops.

```js
// SVG rect path with pathLength=1
tl.fromTo(ring, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.2, ease: 'power3.out' }, Tarrive - 0.1)
  .to(ring, { opacity: 0, duration: 0.133, ease: 'none' }, Tnext);
```

### 6f. Cursor (template tracked, matching score 0.9–1.0)

| move | frames | from → to | distance | max perpendicular bulge |
|---|---|---|---|---|
| M1 (enters already moving) | k395–406 | (345, 440) → (245.5, 328.5) | 149 px | 12.5 px |
| M2 Prompt → Product UI | k416–429 | (245.5, 328.5) → (220.5, 408.5) | 84 px | 8.2 px (10 %) |
| M3 Product UI → Phone | k465–479 | (220.5, 408.5) → (420.5, 408.5) | 200 px | 18 px (9 %), dips downward |

Progress along the chord for M3: 0, .015, .09, .25, .45, .61, .73, .81, .87, .92, .95, .97, .99, .995, 1.

Fits for M2/M3:

| ease | rmse M2 / M3 | duration |
|---|---|---|
| **cubic-bezier(0.3, 0.03, 0.18, 1)** | **.0045 / .0038** | **13.5 f = 450 ms** |
| (0.32, 0.06, 0, 1) | .016 / .015 | |
| sine.out | .027 | |
| power2.inOut | .032 | |

M1 fits power4.out over 558 ms.

The path is **curved**: a single arc whose peak deviation is about 9–10 % of the travel, near mid-path. Cursor size is about 16 × 24 px, black with a white outline.

```js
CustomEase.create('cursor', 'M0,0 C0.3,0.03 0.18,1 1,1');
tl.to(cursor, { motionPath: { path: [{ x: x0, y: y0 }, { x: midX + nx * 0.09 * L, y: midY + ny * 0.09 * L }, { x: x1, y: y1 }], curviness: 1 },
                duration: 0.45, ease: 'cursor' }, T);
```

### 6g. Text-selection highlight sweeps

Colour **rgb(177, 210, 242) #B1D2F2** (macOS selection blue). It grows left to right with the left edge fixed.

**Tweet, one line, k94–104** (card space, the zoom removed): width 0, 163, 266, 335, 380, 405, 425, 436, 445, 449, 452, 453 px.

| ease | rmse | duration |
|---|---|---|
| **expo.out** | **1.9 px** | **15 f = 500 ms** |
| circ.out | 3.7 px | |
| power4.out | 4.8 px | |

A second sentence was highlighted the same way at k146–152.

**Prompt, three lines, k332–357.** The lines fill one after another as one continuous string of 1585 px. Progress by frame:

| k | 332 | 333 | 334 | 335 | 336 | 337 | 338 | 339 | 340 | 342 | 344 | 346 | 348 | 350 | 352 | 354 | 356 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| progress | 0 | .174 | .327 | .445 | .550 | .637 | .706 | .752 | .797 | .868 | .912 | .943 | .964 | .978 | .987 | .993 | .997 |

| ease | rmse | duration |
|---|---|---|
| **expo.out** | **.0034** | **33.75 f = 1.125 s** |
| circ.out | .013 | |
| power4.out | .014 | |

Duration grows with length but not proportionally: 0.5 s for 453 px, 1.125 s for 1585 px.

---

## 7. Slow drift during holds

| shot | hold measured | result |
|---|---|---|
| A opening (light) | k15–85 vs k84 | s = 1.0000–1.0005, \|t\| < 0.5 px |
| B tweet (dark) | k120–146 (after settle) and k151–191 | s = 1.0000 ± 0.0003 (k120–146 constant at the settled value) |
| C white title | k216–235 | 1.0000 |
| D blog card (light) | k236–321 | 0.9989–1.0011 (noise) |
| E prompt card | k358–373 | 1.0000 |
| I/J comparison | k664–779 | 0.9999–1.0001 |
| face layer in the split layout | all light shots | chair edges at x = 38 and 680 in every sampled frame, so the layer is fixed |
| full face G / K | ECC on the top 520 px | ±2–4 %, non-monotonic (0.992, 0.998, 1.005, 1.043, 1.041 over k815–895), following head motion |

There is no consistent push-in. *Caveat:* the background is blurred, so a deliberate push-in of under 2 % per second cannot be ruled out in the full-face shots.

**Conclusion: the editor uses no Ken Burns or hold drift.** Energy comes from cuts every 1–3 s, the zoom settle, caption and word entrances, and the moves inside each screenshot.

---

## 8. Motion token table (what to reuse)

| token | spec | where it appears |
|---|---|---|
| `cut` | hard cut, 0 f | all 10 shot changes |
| `whiteFlash` | 5 f (167 ms) of #FFFFFF before a title card | 6.53 s |
| `zoomSettle` | whole stage scale **1.15 → 1** about the frame centre, **1.183 s, cubic-bezier(.32,.06,0,1)**, motion blur at +5…+11 f | 3 of 3 cuts into dark full-bleed B-roll |
| `cardPop` | scale **.905 → 1, power3.out 0.667 s** about the card centre, plus opacity 0 → 1 **sine.inOut 0.19 s** (blur ≤3 px on the first frame) | first card of a section (0.03 s, 6.73 s) |
| `boxWipe` | clip left → right, **expo.out 0.72 s**, #0283FA, 88–90 px tall | title highlight boxes |
| `titleWord` | opacity power2.out 0.39 s, y +29 → 0 expo.out 0.36 s, blur 6 → 0 in 3 f, **stagger 78 ms** | headline words |
| `boxWord` | opacity power3.out 0.27 s, y +22 → 0 expo.out 0.34 s, blur 4 → 0 | white italic words inside the box |
| `capWord` | opacity 0 → 1, y +7 → 0, blur 4 → 0, **power2.out 0.19 s**, scale 1 | every caption word |
| `capItalic` | as capWord, blur 8 px, 0.23 s, #0380E0 serif italic | emphasis words |
| `capPage` | old page cut, **1 blank frame**, next page; re-drawn for 1 frame on shot cuts | caption pages |
| `glitchIn` | 7–10 f opacity flicker [1, .1, 1, .8, .25, 1], 2–3 slices ±4–10 px, RGB split ±3–5 px | brand keyword ("Claude") ×3 |
| `ctaSlam` | hard in, scale **1.17 → 1 circ.out 0.82 s** | "comment" |
| `ctaGlowFlicker` | 6 f flicker [blur-in, ON + 1.55× bloom, OFF, ON, 50 %, ON], y +13 → 0, then a steady glow (no pulse) | "Motion" |
| `push` | strip x −767 px (−106.5 %W), **0.733 s cubic-bezier(.3,0,0,1)**, heavy motion blur | card to card in the same layout |
| `camMove` | in-screenshot pan/zoom, **0.93–1.13 s cubic-bezier(.2,0,0,1)**, Δ up to 422 px or ×2 zoom | content inside cards |
| `selSweep` | selection highlight, **expo.out 0.5 s per line**, about 1.1 s for 3 lines, #B1D2F2 | key phrases in screenshots |
| `ringDraw` | stroke draw clockwise **3–7 f (0.1–0.23 s), ≈ power3.out**, #178CEC 3 px; exit opacity 4 f linear, crossfading with the next ring | UI targets |
| `cursor` | **0.45 s cubic-bezier(.3,.03,.18,1)**, arc bulge ≈9 % of distance | cursor moves |
| `statPop` | scale .25 → 1 plus travel ≈190 px, **power4.out 0.85 s**; odometer 0.43 s; pill fade power2.out 0.2 s; exit fade 0.23 s | number callouts |
| `labelFade` | opacity 0 → 1 in 3–4 f, stagger 10 f | comparison labels |
| `drift` | **none** | – |

**Duration clusters:**
- about 0.13–0.2 s: micro moves (text in, ring draw, fades, flickers)
- about 0.45 s: cursor
- about 0.67–0.75 s: element entrances (card pop, box wipe, push)
- about 0.93–1.18 s: camera moves (zoom settle, in-screenshot pan or zoom)

**Ease vocabulary:**
- power2.out and power3.out for small elements
- expo.out for wipes and sweeps
- a slow-start, long-tail cubic-bezier (≈ .3, 0, 0, 1) for anything that moves the camera or a whole card

**Never used:** overshoot (back, elastic), dissolves, slow drift.
