# screenshare — captions

> **How this file applies to this kit.** It was measured off **REF-A**, a
> screen-share-style explainer on a static white canvas. Everything about the
> **camera travel, the card geometry, the captions, the shadow and the type**
> applies as written. Where it says the canvas is pure white and never moves,
> that describes the `classic` ground. The default for this kit is the
> **played-share variant** in `demo-mix.md`: a live dot ground in your theme
> colours, rebuilt UIs with a scripted cursor, and about 40% of graphics time
> in motion. When the two disagree, `demo-mix.md` wins.

The caption is the only text that survives both grounds. It sits in exactly
the same place on white and on footage, which is what stitches the two halves
of the video into one thing.

---

## 1 · The measurement

54 caption samples, taken off footage frames where white type on an
uncontrolled plate is unambiguous to detect:

| | reading |
|---|---|
| cap-top | **y = 848** — 38 of 54 frames landed on exactly 848, 14 on 849 |
| cap height | **58px** |
| descender | to y = 917 |
| centre | x = 958.5 (i.e. centred, 960) |
| widest measured | 930px |
| hold between swaps | median **18 frames** (0.6s) |
| swap | **~2 frames, cross-faded** |

Cap height 58 against Inter's 0.727 cap ratio gives an **80px face**. That is
`--ss-cap-size`, and `--ss-cap-captop` (78.52%) positions the cap-top, not the
baseline — which matters, because positioning by baseline and positioning by
cap-top differ by 12px here and 12px is visible when the caption is the only
fixed thing in a frame where everything else changes.

---

## 2 · The two treatments

**On the canvas:** `--ss-cap-ink-canvas`, and nothing else. No shadow, no
plate, no box. It is dark type on white; it does not need help.

**On footage:** white, **plus `--ss-cap-shadow`**.

That second one is a deliberate departure from the reference and it is worth
being explicit about why. In the reference, pixels just outside the glyphs
showed at most a 12-unit ramp over 9px, on a plate that happened to be dark
there — which is consistent with little or no shadow. That is a fact about
*that room*, not a property of the style. A real shoot puts a white shirt, a
window or a bright wall behind the caption sooner or later, and a shadowless
white caption disappears silently: the render succeeds, the thumbnail looks
fine, the words are gone.

So this style ships the shadow and gates it:

```
python3 scripts/check-contrast.py out/seg-NN.mp4
```

which measures the mean luma of the band behind the caption on every sampled
frame and fails past `--ss-cap-band-max` (150).

**Fix a failure at the plate, not by thickening the shadow.** Reframe onto a
darker part of the shot, re-grade it, or move the caption off that beat by
going to the canvas. Stacking more shadow on is how a clean style turns into
a YouTube auto-caption.

---

## 3 · Chunking

**2–6 words.** Wider than the one-word caption styles, and that is measured: the widest caption in the reference ran 930px, which is
roughly six short words at 80px.

The rules, in order of how often they get broken:

1. **Break on the sense, not on the width.** The chunk is a phrase a person
   would say in one breath. `scripts/build-captions.py` proposes the chunks
   from word onsets and pauses; read them and fix the ones that split a noun
   phrase.
2. **Never shrink the type to fit.** Past `--ss-cap-max` (1100px) the chunk
   re-chunks. The size is fixed for the whole video — it is one of the two
   things (with the card position) that never changes, and a caption that
   shrinks on the long lines destroys that.
3. **Two lines is allowed, rarely.** A two-line caption pushes the cap-top up
   by one line height; the *last* line stays anchored so the block grows
   upward. Use it for a quote, not for a long sentence you should have split.
4. **Punctuation is allowed here.** The reference uses commas
   and apostrophes inside captions. Terminal periods still read as clutter —
   the swap does that job.
5. **A caption may be absent.** Long camera beats run with no caption at all
   in the reference. Silence on screen is a legitimate choice; wall-to-wall
   captions are a podcast-clip habit, not this style.

---

## 4 · Accent inside a caption

One word in a caption may take an accent, and only when it is doing one of the
four jobs from `tokens.css` §2 — the live thing (`--ss-blue`), the win
(`--ss-green`), the cost (`--ss-red`). Everything else is ink.

Measured: the caption red reads `#FA3D33`, within rounding of the system
`--ss-red` (`#F83828`), so the caption accent and the canvas accent are the
same colour. Do not introduce a caption-only tint.

**One accented word per caption, and not on every caption.** If three captions
in a row have a green word, the green has stopped meaning anything.

---

## 5 · Timing against the transcript

⚠ **`assets/transcript-tight.json` is the only timing source.** The tighten
pass moves every word onset; timing captions against the original transcript
shows up as "the graphics are all slightly early", never as an error.

`scripts/build-captions.py` takes the tight transcript and emits a caption
plan with frame-accurate in/out per chunk, respecting the 18-frame median
hold and the 2-frame fade. It will not emit a chunk shorter than 9 frames —
below that the fade is a larger fraction of the hold than the hold is, and it
reads as a flicker.

---

## 6 · The one thing to check on every render

The caption is in the same place on both grounds, which means it is **in the
frame during the shrink**. Decide per transition whether it should be:

- **held through** — the caption does not change while the camera travels.
  This is the default and it is what makes the move feel like one gesture.
- **cut at the start of the move** — when the line genuinely ends there.

What it must never do is *swap mid-shrink*. Two eased things happening at once
in a style that otherwise has no motion reads as a mistake, and it is the one
caption fault that a static-frame review will not catch.
