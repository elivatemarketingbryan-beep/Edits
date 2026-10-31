# screenshare — motion grammar

> **How this file applies to this kit.** It was measured off **REF-A**, a
> screen-share-style explainer on a static white canvas. Everything about the
> **camera travel, the card geometry, the captions, the shadow and the type**
> applies as written. Where it says the canvas is pure white and never moves,
> that describes the `classic` ground. The default for this kit is the
> **played-share variant** in `demo-mix.md`: a live dot ground in your theme
> colours, rebuilt UIs with a scripted cursor, and about 40% of graphics time
> in motion. When the two disagree, `demo-mix.md` wins.

Read this first. In most styles the motion is the dressing; here it is the
entire idea. There are exactly **three** moves in this style, and two of them
are the same move.

| # | move | frames | where it is allowed |
|---|---|---|---|
| 1 | the camera **shrinks** to the corner | 11 | every camera→canvas change |
| 1b | the camera **grows** back to full | 10 | every canvas→camera change |
| 2 | an element **arrives** on the canvas | 6 | when a canvas beat adds something |
| 3 | the caption **swaps** | 2 | every ~18 frames |

That is the complete list. There is no fourth move. Everything else in the
frame is static, and that is measured, not a preference — see §4.

---

## 1 · The shrink

### 1.1 What was measured

Two full transitions traced frame by frame at 30fps. Non-white bounding box
per frame, camera→canvas:

| frame | w | h | aspect |
|---|---|---|---|
| 0 | 1920 | 1080 | 1.778 |
| 1 | 1912 | 1076 | 1.777 |
| 2 | 1836 | 1040 | 1.765 |
| 3 | 1691 | 977 | 1.731 |
| 4 | 1502 | 893 | 1.682 |
| 5 | 1283 | 781 | 1.643 |
| 6 | 1054 | 671 | 1.571 |
| 7 | 828 | 561 | 1.476 |
| 8 | 623 | 462 | 1.348 |
| … | → 300 | → 300 | → 1.000 |

Three things fall straight out of that table:

**The aspect changes continuously.** 1.778 → 1.000. The box is not being
scaled uniformly — it is being *interpolated*, 1920×1080 → 300×300, with the
video inside it behaving like `object-fit: cover` the whole way. The
normalised progress of the width and the height agree to within 0.01 at every
frame, so it is one eased value driving both.

**It is anchored to its own bottom-right corner.** That corner travels only
from (1920,1080) to (1860,1020) — sixty pixels on each axis, which is exactly
`--ss-cam-right` / `--ss-cam-bottom`. The tile does not fly across the frame.
It collapses into the corner it is already occupying, and then settles off
the edge by its own margin.

**The ease was solved, not guessed.** Progress `(1920-w)/1620` against `t`
over 11 frames, fitted by a grid search over cubic-beziers:

```
t       .09   .18   .27   .36   .45   .55   .64   .73     RMS
meas   .005  .052  .141  .258  .393  .535  .674  .801       —
SOLVED .016  .064  .143  .250  .381  .525  .670  .803   0.0085   <- ship this
p2.inOut .017  .066  .149  .264  .413  .587  .736  .851   0.0352
p3.inOut .003  .024  .081  .192  .376  .624  .808  .919   0.0782
```

→ **`cubic-bezier(.42, 0, .66, 1)`**.

Rendered back through headless Chrome and diffed against the reference trace,
it tracks to a **mean 10.7px of width** across the traced frames and lands
**pixel-exact** at rest (300×300 at x 1560..1859, y 720..1019).
`power2.inOut` is the usable fallback at 37.8px mean — noticeably ahead of the
reference through the middle of the move, but not wrong enough to reject if
you have no CustomEase. `power3.inOut` is much worse; do not reach for it.

In GSAP:

```js
gsap.registerPlugin(CustomEase);
CustomEase.create('ssShrink', 'M0,0 C0.42,0 0.66,1 1,1');
// ... ease: 'ssShrink'      (fallback: 'power2.inOut')
```

Do not use a spring, an overshoot or a `back` ease — there is no bounce
anywhere in this style.

### 1.2 The radius is animated

This is the detail everyone gets wrong. The corner radius measured at four
points during the shrink, against the card width:

| w | 1836 | 1502 | 1054 | 623 | 300 |
|---|---|---|---|---|---|
| measured radius (single-frame read) | 4 | 8 | 17 | 28 | 29 |
| if it scaled with the box | 245 | 200 | 140 | 83 | 40 |
| if it were constant | 40 | 40 | 40 | 40 | 40 |
| **40 × eased progress** (same read) | **1.5** | **7.5** | **15.5** | **23** | **29** |

(That row is the model's prediction put through the *same* single-frame
threshold read as the measurements, which under-reports an antialiased arc by
about 0.72×. The calibrated final radius is **40px** — `reference-log.md` §3.4.)

Only the third model fits. The radius ramps with the eased progress.
Which means:

> **Full-bleed footage has SQUARE corners.** The rounding is what *arriving in
> the corner* looks like. A shot that is already rounded at full bleed has
> thrown the move away before it starts.

### 1.3 How to build it

The box has to change aspect while the content inside stays undistorted, so a
plain `scale()` cannot do it. The general rule is transforms only — and the
honest answer here is that this style needs **one** more property:
`clip-path`. That is deliberate and it is not the rule's failure case. The
rule exists because `top/left/width/height` force layout on every frame and
stutter; `clip-path` is a composited paint property that does not. Nothing
else in the style touches it.

Drive the whole thing from **one** proxy value so the box, the content scale
and the radius can never drift apart, and so it stays seek-safe under
HyperFrames' paused timeline:

```js
// p: 0 = full bleed, 1 = parked in the corner
const cam = { p: 0 };
const el  = root.querySelector('.ss-cam');
const vid = el.querySelector('video');

function applyCam(p){
  const w = 1920 + (300  - 1920) * p;
  const h = 1080 + (300  - 1080) * p;
  const r = 40 * p;
  const m = 60 * p;                       // the settle off each edge

  // the visible rect, bottom-right anchored
  const right  = m,                 bottom = m;
  const left   = 1920 - w - m,      top    = 1080 - h - m;
  el.style.clipPath =
    `inset(${top}px ${right}px ${bottom}px ${left}px round ${r}px)`;

  // cover: the 16:9 source only ever needs the HEIGHT ratio here, because
  // h/1080 >= w/1920 for the whole range.
  const k  = h / 1080;
  const cx = 1920 - m - w / 2;          // the clip rect's centre
  const cy = 1080 - m - h / 2;
  // ⚠ transform-origin is the element CENTRE, never (cx,cy). CSS composes as
  //   origin + T(S(p - origin)); an origin at the DESTINATION applies the
  //   translate outside the scaled space and the plate leaves the frame
  //   entirely. Scale about the centre, then move the centre to (cx,cy).
  vid.style.transformOrigin = '960px 540px';
  vid.style.transform = `translate(${cx - 960}px, ${cy - 540}px) scale(${k})`;
}

tl.to(cam, {
  p: 1,
  duration: 11 / 30,                       // --ss-shrink-frames
  ease: 'ssShrink',                        // --ss-shrink-ease
  onUpdate: () => applyCam(cam.p),
}, SHRINK_AT);
```

`.ss-cam` is a full-frame `1920×1080` absolutely-positioned element holding
the video at `1920×1080`; the clip does the framing and the transform does the
cover. At `p=0` the clip is the whole frame, `k=1`, and the transform is
identity — genuine full bleed, square corners, no resampling. At `p=1` you get
a 300×300 rect at (1560,720), radius 40, with the source scaled 0.2778 and
centre-cropped: exactly the measured card.

The grow is the same function run `1 → 0` over `--ss-grow-frames`.

> ⚠ **`onUpdate` only, never a CSS transition.** HyperFrames renders by seeking
> a paused timeline. A CSS transition is wall-clock and will render whatever
> state it happens to be in — usually the end state on every frame.

> ⚠ **Pass `immediateRender:false` on any `fromTo` in the chain.** Otherwise GSAP applies a later beat's `from` state at
> creation time and the camera renders parked at frame 0.

### 1.4 Where the canvas content comes from

The canvas underneath is **already built and already still** when the shrink
starts. It does not fade up, slide in or assemble during the move — measured:
the canvas content is fully present within one frame of the shrink beginning.
The shrink reveals it. If the canvas assembles *during* the shrink you get two
competing motions and the move stops reading.

The one exception is a beat that genuinely builds (an `ss-board` diagram
drawing itself node by node). That starts **after** the camera has parked.

---

## 2 · An element arriving

A canvas beat that adds something mid-beat gets 6 frames, `power3.out`,
`opacity 0→1` plus an 18px rise. That is it.

```js
tl.fromTo(el, {opacity:0, y:18}, {
  opacity:1, y:0, duration:6/30, ease:'power3.out', immediateRender:false
}, AT);
```

**18px is the entire travel budget in this style.** Not 60, not "from off
screen", not a scale-up from 0.9. The thing appears roughly where it lives.
And once it has arrived it never moves again — see §4.

Stagger a group at 3 frames. Never stagger more than about five things; past
that it stops being an arrival and becomes an animation.

---

## 3 · The caption swap

**~2 frames, cross-faded.** Measured coverage across a swap ramps through two
to three intermediate values rather than jumping, and the glyph box does not
change size, so it is a fade and not a scale or a slide.

This is a real difference from hard-cut caption styles, which swap on a
single frame.
Here it is measured *not* to. A hard cut in screenshare reads as a dropped
frame against the eased shrink it sits next to.

Median hold between swaps: **18 frames**. See `captions.md`.

---

## 4 · Everything else is still

Mean frame-to-frame difference across **every** canvas frame in the reference,
with the camera card masked out:

```
median 0.158        mean 1.125        p90 2.230
```

The median is the number that matters: half of all canvas frames are
*identical* to the frame before them. The mean and p90 are the arrivals.

So, explicitly forbidden on the canvas:

- a drift, a push-in, a slow zoom or a ken-burns on a screenshot
- a card that floats, breathes, bobs or has a hover state
- a parallax between layers
- a looping shimmer, pulse, glow or gradient sweep
- a cursor that wanders (a cursor that *clicks once* on a real capture is
  fine — it is the recording, not an animation you added)
- a progress rail that fills continuously

`python3 scripts/check-static.py out/seg-NN.mp4` measures this on the render
and fails the segment if the canvas drifts. Run it every time — a 2px-per-
second drift is invisible in a preview and obvious in a finished cut.

### Why the rule is this absolute

In glow-and-drift motion-graphics styles the continuous drift is what makes the frame feel alive.
Carrying that habit here is the most common way a screenshare comp goes
wrong, and it fails in a specific way: a real shared screen **does not
drift**, so the moment the canvas moves the viewer stops reading it as a
screen and starts reading it as a graphic. The illusion is load-bearing and it
is cheap to break.
