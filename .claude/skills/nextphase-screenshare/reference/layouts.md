# screenshare — layouts

> **How this file applies to this kit.** It was measured off **REF-A**, a
> screen-share-style explainer on a static white canvas. Everything about the
> **camera travel, the card geometry, the captions, the shadow and the type**
> applies as written. Where it says the canvas is pure white and never moves,
> that describes the `classic` ground. The default for this kit is the
> **played-share variant** in `demo-mix.md`: a live dot ground in your theme
> colours, rebuilt UIs with a scripted cursor, and about 40% of graphics time
> in motion. When the two disagree, `demo-mix.md` wins.

Every scene in this style is one of two grounds plus one of six devices. This
file marks each one **MEASURED** (read off the reference) or **DERIVED**
(invented on top of a measurement, and what it was traded against).

Geometry constants live in `assets/tokens.css`. Nothing here restates a token
value except where the reasoning needs it.

---

## 1 · The ground track — plan this first

MEASURED. Before you build a single comp, write the ground track: for every
second of the video, canvas or camera.

```
00:00–00:06  camera    cold open, no caption
00:06–00:14  canvas    ss-callout  — the number the video is about
00:14–00:22  camera
00:22–00:37  canvas    ss-shot     — the source, marked
...
```

The targets, all measured:

| | value |
|---|---|
| split | **51% canvas / 49% camera** |
| ground changes | **one every 8.9s** (48 in 429s) |
| canvas hold | median **7.1s**, max 25.8s |
| camera hold | median **8.0s**, max 26.5s |

The maxima matter as much as the medians: the reference does allow a 26-second
single-ground stretch, roughly once per section, and it always sits next to a
run of short ones. Uniform 9-second alternation is as wrong as one 40-second
block — it becomes a metronome and the viewer starts predicting it.

**If a chapter cannot reach roughly a 50/50 split, the chapter is the problem,
not the layout.** It means either the script has a long stretch with nothing
real to show (cut it, or find the artefact) or a long stretch where the face
adds nothing (you are reading a list and should be on the canvas).

---

## 2 · The camera ground

MEASURED. Full-bleed, **square corners**, no border, no vignette, no grade
beyond what `look.md` describes, nothing overlaid except the caption.

There is no lower third, no logo bug, no chapter marker, no progress rail and
no subscribe prompt. The frame is the shot and the caption. This is a
screen-share, and a screen-share has no furniture.

DERIVED: when a camera beat runs long (past ~15s), the fix is **not** a push-in
— §4 of `motion-grammar.md` forbids it. The fix is to go to the canvas. A long
camera beat is a signal that you owe the viewer something to look at.

---

## 3 · The canvas ground

MEASURED: ground `#FFFFFF`, content inset `--ss-pad` (96px left, 73px top in
the reference; the token rounds both to 96), and **nothing in the bottom-right
`--ss-cam-keepout` (380×380)** when the camera is parked.

DERIVED: the canvas is not a grid. There is no column system, no baseline
grid, no consistent card size. Each beat is composed for what it is holding —
one big thing, or one thing plus a mark, or two things compared. What keeps it
coherent is that everything shares one radius, one shadow and one type scale,
not that everything lines up.

**One idea per canvas beat.** If two things are on the surface they are being
*compared*; if three are, you have built a slide.

---

## 4 · The six devices

### 4.1 `ss-shot` — a real screenshot on the surface  · DERIVED

The workhorse. A real capture, `--ss-card-radius`, `--ss-card-border`,
`--ss-shadow-card`. Sized to sit left of the camera keep-out and roughly
centred in the space that leaves.

- A **white** UI screenshot needs the border or it has no silhouette on a
  white ground. A dark one does not, but keep it for consistency.
- **Never scale a screenshot below ~55% of its native width.** Below that the
  UI text turns to mush and it stops being evidence. Crop instead — a tight
  crop of the one region you are talking about is better than the whole page
  shrunk, and it is what a person actually does when sharing.
- A screenshot with burned-in text you do not want gets cropped out **in
  ffmpeg**, not with CSS: HyperFrames ignores
  `object-view-box` in the render.

### 4.2 `ss-window` — a capture inside a drawn app window  · MEASURED-ish

The reference draws a window chrome — a title bar with a centred title and
three traffic-light dots — around content it is *operating*, as opposed to
content it is *reading*. Window measured at x 96..1500, y 73..867; title bar
~56px; the whole thing left-aligned with the camera parked to its right.

DERIVED: use `ss-window` for a tool being driven, and plain `ss-shot` for a
page being cited. Mixing them up is what makes a canvas feel arbitrary.

⚠ **The dots are drawn CSS circles in the neutral ramp, not a traffic-light
red/yellow/green.** Using the real macOS colours puts three saturated hues on
screen that mean nothing, in a palette where colour is strictly functional.

### 4.3 `ss-callout` — one number, one phrase  · MEASURED

`--ss-display-size` (130px), weight 800, tight tracking, centred, with a
`--ss-label-size` label under it in `--ss-slate-500`. One accent on the
number, ink on the label.

This is the only device that is pure typography, and it earns that because a
number is not a screenshot of anything. **Do not use it to set a sentence.**
If the words want to be big, they want to be a caption.

DERIVED: two callouts side by side, with a hairline between them, is the
compare form — a before and an after, a price and a price. That is the only
multi-callout layout.

### 4.4 `ss-board` — a diagram the beat builds  · DERIVED

Nodes (a titled card with an icon tile and a subtitle), connected by 1px
`--ss-slate-300` rules with a `--ss-blue` dot on the live edge.

This is the one device allowed to **build** — nodes arrive one at a time on
`--ss-enter-frames` with a 3-frame stagger — and it builds **after the camera
has parked**, never during the shrink. Once built it is still.

⚠ The icon tile is a **drawn mark**, never an emoji: a rounded tile in a pale
accent tint carrying a CSS glyph or a small inline SVG. `check-screenshare.sh`
fails on any emoji codepoint, and the reference's own use of them is exactly
why the no-emoji rule exists.

### 4.5 `ss-list` — an agenda or a checklist  · MEASURED

Rows of `--ss-body-size` text with a drawn check at the left. The reference
uses it once at the top as a "what this video covers" and greys out the rows
not yet reached — which is a good retention device and worth keeping.

Drawn check: a `--ss-green` circle with a CSS-drawn tick, or an inline SVG
path. Not a `✓` glyph in a coloured span if you can avoid it, and never an
emoji check.

### 4.6 `ss-mark` — the marker layer  · MEASURED

The thing that makes the surface feel *operated*:

| mark | how |
|---|---|
| highlighter | `--ss-amber` block behind the words, `scaleX` from `transform-origin:left`, 6 frames |
| underline | 4px `--ss-accent` rule, same `scaleX` growth |
| circle | a hand-drawn-feel ellipse, SVG stroke, `stroke-dasharray` draw-on |
| arrow | SVG path, draw-on, always pointing at one specific pixel |
| redaction | a `--ss-slate-300` block over a real name or key |

**Mark at least one thing on most shots.** An unmarked screenshot is a slide.

⚠ Marks are the one canvas element that animates *after* the beat has settled,
and they are still one-shot: they draw once over 6 frames and then stop. A
highlighter that pulses is not a marker, it is a banner ad.

⚠ On a dark screenshot the highlighter disappears (it is a multiply blend).
On a dark capture, use the underline or the circle, not the fill.

---

## 5 · Composition patterns  · DERIVED

Four arrangements cover nearly everything. Each is named in
`components/screenshare-system.html`.

| pattern | when |
|---|---|
| **solo** | one `ss-shot` / `ss-window`, left-of-keepout, marked | the default |
| **compare** | two things side by side with a hairline between | a before/after, a price/price |
| **stack** | a small thing above a big thing (a quote card over the source) | when you cite then show |
| **bleed** | one capture running nearly edge to edge, camera parked on top | a full page you are scrolling through |

`bleed` is the only one where canvas content may pass **under** the camera
card. It works because the card's shadow separates them; it fails the moment
the thing under the card is the thing you are talking about.

---

## 6 · What this style does not have

Worth stating, because each one is a habit carried in from other editing
styles and each one reads as a mistake here:

- no stage, no plate, no glow, no gradient backdrop (the live dot ground is
  the only texture, and only on the lower part of the frame)
- no torn paper, no collage, no stop-motion churn
- no film grade, no grain, no bloom, no vignette
- no letterboxed window, no matte-over-type occlusion
- no chapter cards, no transitions with a design of their own — the shrink
  **is** the transition
