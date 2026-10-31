# screenshare — reference log

> **How this file applies to this kit.** It was measured off **REF-A**, a
> screen-share-style explainer on a static white canvas. Everything about the
> **camera travel, the card geometry, the captions, the shadow and the type**
> applies as written. Where it says the canvas is pure white and never moves,
> that describes the `classic` ground. The default for this kit is the
> **played-share variant** in `demo-mix.md`: a live dot ground in your theme
> colours, rebuilt UIs with a scripted cursor, and about 40% of graphics time
> in motion. When the two disagree, `demo-mix.md` wins.

How every number in `assets/tokens.css` was obtained, what the raw readings
were, and where each finding is written up. If you want to change a MEASURED
token, this is the file that tells you what you would be overruling.

---

## 1 · The source

| | |
|---|---|
| ref | **REF-A** |
| source | a public long-form YouTube explainer (not redistributed here) |
| format | 1920×1080, 30/1 fps CFR, AV1, **12,877 frames / 429.29s** |
| pulled | `yt-dlp`, best ≤1080p + m4a, merged to mp4 |


**One video, one creator, one room.** Geometry and timing are trustworthy to
the frame because they were traced across many frames and cross-checked.
Anything about the *room* — the exposure, the wall, the lighting — is a
reading of that room and is written up as a target, not a transform.

**The creator's material is theirs.** This skill encodes the technique: the
collapse-to-corner, the two-ground rhythm, the white surface, the functional
palette. Their script, product, screenshots and branding are not in this skill
and `scripts/check-screenshare.sh` fails a render that reintroduces them.

---

## 2 · Method

All measurement done with `ffmpeg`/`ffprobe` and numpy. No eyeballing except
where flagged.

| pass | what it did |
|---|---|
| **contact sheet** | 1 frame / 8s, 6×9 tile — read the vocabulary |
| **ground classification** | whole video scaled to 64×36 raw RGB (89 MB), per-frame corner test → canvas vs camera for all 12,877 frames |
| **card geometry** | full-res frames minutes apart; non-white bbox at two thresholds, then per-row edge maps |
| **corner radius** | 65 same-position frames averaged to kill content noise, then arc inset per row |
| **shrink trace** | 2.2s at 30fps, full res, non-white bbox per frame, two transitions, both directions |
| **caption stats** | 429 bottom-band crops (1920×360 @ y=720) at 1fps; white-mask runs, centred, 25–95px tall |
| **caption timing** | 720 frames at 30fps of a caption band, coverage diff per frame |
| **colour census** | 143 canvas frames at 960×540, camera quadrant masked, saturation>75 binned to 8-bit steps |
| **ink** | same frames, near-neutral pixels with max<90 |
| **audio** | mono 22.05k float, 100ms RMS frames; FFT bands at transition timestamps |

---

## 3 · Raw readings

### 3.1 Ground classification → `layouts.md` §1, `SKILL.md` §2

```
canvas 6605 frames (51.3%)   camera 6272 (48.7%)
48 ground changes in 429.3s  →  one every 8.94s
canvas holds  n=25  median 7.1s  mean 8.8s  max 25.8s
camera holds  n=23  median 8.0s  mean 9.1s  max 26.5s
```

### 3.2 Canvas ground colour → `tokens.css` §1, `look.md` §1

Five points (4 corners + centre) on every sampled canvas frame:
`(255,255,255)` at all five, on all of them. No exceptions.

### 3.3 Camera card → `tokens.css` §3, `SKILL.md` §3

Three frames, minutes apart, per-row edge map at threshold >55:

```
t=209s   x 1560..1859 (w=300)   y 720..1021 (h=302)
t=256s   x 1560..1859 (w=300)   y 720..1021 (h=302)
t=264s   x 1560..1859 (w=300)   y 720..1021 (h=302)
aspect   1.000 / 1.003 / 0.997
```

→ **300×300 square**, right margin 60, bottom margin 60. The 302 on the
vertical is the shadow ramp; the sharp edge is at 1020.

### 3.4 Corner radius → `tokens.css` §3

65 frames with the card in the same position, averaged so the card interior
becomes a flat grey (≈206) against the pure-white ground (253) and the arc
becomes crisp.

⚠ **A first pass read this by eye off a 4× magnified crop and got 37px of arc
run, which was written down as "radius ≈ 36". That was wrong**, because an
arc run read at a threshold is not the same quantity as a CSS radius — the
antialiased tail is under-counted by roughly 0.72×. It is recorded here
because it is exactly the kind of error that survives into a token file.

The number was settled instead by **rendering the token back through headless
Chrome and measuring both images under one criterion** (50% coverage between
the card interior and the ground):

```
REFERENCE                          arc runs  h=30  v=31

render  border-radius 28px         arc runs  h=20  v=19
render  border-radius 32px         arc runs  h=23  v=23
render  border-radius 36px         arc runs  h=26  v=26
render  border-radius 40px         arc runs  h=30  v=30   ← match
render  border-radius 44px         arc runs  h=33  v=33
```

→ **radius 40px.** The same render-and-diff pass confirms the card itself
lands pixel-exact: x 1560..1859, y 720..1019, margins 60/60.

### 3.5 Shadow → `tokens.css` §3, `look.md` §2

Outward from the right edge, 65-frame average:

```
x    1858  1862  1866  1870  1876  1882  1888  1894
grey  187   224   231   238   245   250   252   253
```

Hue at the edge: **R 223.7 · G 223.0 · B 221.8** — neutral within a unit.
Falls off over ~20px, never below ~12%.

### 3.6 The shrink → `motion-grammar.md` §1

Camera→canvas, non-white bbox per frame at 30fps:

```
f   0     1     2     3     4     5     6     7     8
w  1920  1912  1836  1691  1502  1283  1054   828   623   → 300
h  1080  1076  1040   977   893   781   671   561   462   → 300
a  1.778 1.777 1.765 1.731 1.682 1.643 1.571 1.476 1.348  → 1.000
```

Normalised progress of w and h agree to within 0.01 at every frame → one
eased value drives both. Bottom-right corner travels (1920,1080)→(1860,1020).

Ease SOLVED against those points by a grid search over cubic-beziers,
t over 11 frames:

```
t        .09   .18   .27   .36   .45   .55   .64   .73     RMS
meas    .005  .052  .141  .258  .393  .535  .674  .801       —
(.42,0,.66,1)
        .016  .064  .143  .250  .381  .525  .670  .803   0.0085
power2.inOut
        .017  .066  .149  .264  .413  .587  .736  .851   0.0352
power3.inOut
        .003  .024  .081  .192  .376  .624  .808  .919   0.0782
```

⚠ An earlier draft of this file asserted that `cubic-bezier(.62,0,.36,1)`
"sits on the measured points a little better" than `power2.inOut`. That was
never tested and it is **false** — it scores RMS 0.0759, worse than the
default. Recorded because an untested claim in a reference file is worse than
no claim.

Verified end to end: the solved ease rendered through headless Chrome tracks
the reference trace to a **mean 10.7px of width** (power2.inOut: 37.8px) and
lands **pixel-exact** at rest — 300×300 at x 1560..1859, y 720..1019.

Reverse (canvas→camera), same trace:

```
w   733   976  1236  1470  1674  1843  1920      → 10 frames
h   472   598   728   853   960  1038  1080
```

Radius during the shrink, inset at the corner. These are single-frame
threshold reads, so they carry the same ~0.72× under-count as §3.4 — the
comparison below puts each candidate model through the same read rather than
comparing a read against a true value:

```
w          1836  1502  1054   623   300
measured      4     8    17    28    29
40 × p      1.5   7.5  15.5    23    29    ← fits
scaled      176   144   101    60    29    ← does not
constant     29    29    29    29    29    ← does not
```

The finding is the *shape*: the radius grows in proportion to the eased
progress, from square at full bleed to the full 40px in the corner.

### 3.7 Canvas stillness → `motion-grammar.md` §4

Mean frame-to-frame difference on the 64×36 stream, camera region masked:

```
canvas   median 0.158   mean 1.125   p90 2.230
camera   median 1.045   mean 1.451   p90 2.531
```

The canvas median is the finding: half of all canvas frames are identical to
their predecessor.

### 3.8 Captions → `captions.md` §1

54 samples on camera frames (white mask, centred, 25–95px tall):

```
cap-top     848 (38 frames) · 849 (14) · 847 (2)
bottom      905 (no descender, 26) · 917/918 (with, 25)
cap height  58px       centre x 958.5      widest 930px
```

Timing, 720 frames at 30fps:

```
11 swaps   transition length 1f×4, 2f×1, 3f×3, 4f×3
hold between swaps: median 17.5f, min 6f, max 101f
coverage across a swap ramps through 2–3 intermediate values,
glyph bbox unchanged  →  a ~2-frame cross-fade, not a cut, not a scale
```

Caption accent red sampled directly: **(250, 61, 51)**.

### 3.9 Colour → `tokens.css` §2, `look.md` §4

Census over canvas frames, camera masked, sat>75:

```
#188838  green   5.63%      #0068D8  blue   3.83%
#F0E098  amber   5.58%      #F83828  red    1.98%
#F8E8A0  amber   3.62%      #28D050  green (bright) 1.82%
```

By hue family, after dropping content-specific hues (product logos,
photographic skin/wood):

```
blue ~17%   red ~18%   green ~12%   amber ~14%
```

Ink, near-neutral pixels with max<90:

```
#1B1B1E  36.04% of all ink pixels   ← a single dominant value
```

### 3.10 Audio → `sound-design.md` §1

100ms RMS, per-tenth noise floor:

```
p5   -23.0 -23.1 -23.7 -23.3 | -30.0 -38.0 -39.4 -38.7 -33.1 -42.0
min  -42.1 -26.8 -27.7 -26.9 | -58.2 -58.5 -58.0 -58.5 -60.1 -61.4
```

HF (3–9 kHz) at the cut ÷ before the cut, 12 ground changes:

```
0.34  0.66  9.79  0.40  9.55  0.27  0.19  0.25  0.29  0.93  6.35  0.20
```

3 of 12 show a transient; 9 do not.

---

## 4 · Finding → where it is written up

| finding | tokens | written up |
|---|---|---|
| 51/49 split, 8.9s cadence | `--ss-ground-hold` | `SKILL.md` §2, `layouts.md` §1 |
| canvas is `#FFFFFF` | `--ss-canvas` | `look.md` §1 |
| ink `#1B1B1E` | `--ss-ink` | `look.md` §4 |
| four accents, near-even shares | `--ss-blue/green/red/amber` | `look.md` §4, `typography.md` §4 |
| 300×300 square card, 60/60, r40 | `--ss-cam-*` | `SKILL.md` §3 |
| neutral shadow, ~20px, ~12% | `--ss-shadow-*` | `look.md` §2 |
| 11f/10f shrink, solved ease | `--ss-shrink-*` | `motion-grammar.md` §1 |
| radius ramps 0→40 with progress | `--ss-cam-radius` | `motion-grammar.md` §1.2 |
| canvas static at 0.158 | — | `motion-grammar.md` §4 |
| caption cap-top 848, 80px | `--ss-cap-*` | `captions.md` §1 |
| caption 18f hold, 2f fade | `--ss-cap-hold/fade` | `captions.md` §1, `motion-grammar.md` §3 |
| no bed after 40%, no whoosh | — | `sound-design.md` §1 |

---

## 5 · What is DERIVED, and what it was traded against

| decision | why | the trade |
|---|---|---|
| **Inter** as the family | matches the measured 0.727 cap ratio and width; already vendored; renders identically headless | the reference may be SF Pro or Helvetica Now — the metrics the layout depends on are shared, so it does not matter, but it is a guess |
| **a shadow on the footage caption** | the reference shows little or none, but on a plate that happened to be dark | departs from the reference to survive a real shoot; gated by `check-contrast.py` rather than assumed |
| **the slate ramp** | the reference's UI greys fall inside it; the steps are mine | a fifth grey would have matched one screenshot better and nothing else |
| **`--ss-card-radius` 20 / well 12** | keeps the camera the roundest object at 12% | measured only loosely off the drawn window; if a future ref disagrees, change these, not the camera |
| **the six devices** | invented on top of what the reference shows it doing | `ss-board` and `ss-mark` are the most invented; `ss-callout` and `ss-list` are close to measured |
| **`clip-path` in the shrink** | the box changes aspect, so `scale()` alone cannot do it | breaks the transforms-only letter, honours its intent (no layout thrash); documented in `motion-grammar.md` §1.3 |
| **the cover transform's origin** | must be the element CENTRE | an origin at the destination `(cx,cy)` looks right and sends the plate off-frame entirely — CSS composes as `origin + T(S(p-origin))`. Cost a debug cycle; the warning is in the kit and in `motion-grammar.md` §1.3 |
| **the cue sheet** | the reference does not sound its transitions; this kit sounds every layout change (or none, if sfx is off) | the reconciliation is 2 cues, not 12; `sound-design.md` §2 |
| **no emojis** | kit rule | the reference uses them freely in its diagram tiles; drawn marks replace them |

---

## 6 · What was not measured

Honest gaps, so nobody cites this file for something it does not contain:

- **The window chrome** (`ss-window`) was measured once, on one frame, and the
  corner radius reading was polluted by the traffic-light dots. Treat its
  geometry as derived.
- **The exact caption typeface.** See §5.
- **Whether the 2-frame caption swap is a cross-fade or a fast dissolve of the
  whole caption layer.** Coverage ramps and the bbox does not change, which
  rules out a scale or a slide, but not between those two.
- **Element entrance timing on the canvas.** `--ss-enter-frames` (6) and the
  18px rise are derived from the general feel of arrivals, not traced. They
  are the softest numbers in the token file.
- **Anything about a second video by this creator.** One reference only.
