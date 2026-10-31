# screenshare — typography

> **How this file applies to this kit.** It was measured off **REF-A**, a
> screen-share-style explainer on a static white canvas. Everything about the
> **camera travel, the card geometry, the captions, the shadow and the type**
> applies as written. Where it says the canvas is pure white and never moves,
> that describes the `classic` ground. The default for this kit is the
> **played-share variant** in `demo-mix.md`: a live dot ground in your theme
> colours, rebuilt UIs with a scripted cursor, and about 40% of graphics time
> in motion. When the two disagree, `demo-mix.md` wins.

One family. One mono, for code only. No third face, no serif, no display cut.

---

## 1 · The family  · DERIVED from measurement

The reference's caption face is a tight neutral grotesque with a 0.727 cap
ratio and no distinguishing letterforms. **Inter** matches it on cap height,
width and weight distribution, is vendored in this kit, and renders
identically in headless Chrome across machines. `--ss-font` is Inter.

This is a derived call, not a measurement: it is possible the reference is set
in SF Pro or Helvetica Now. It does not matter — all three share the metrics
that the layout depends on, and Inter is the one that will still be there
when this renders on another machine in six months.

**`--ss-mono` (JetBrains Mono) exists for exactly one thing:** code, a prompt,
a terminal, a config value. Not for labels, not for "technical feel", not for
numbers. A number is set in Inter like everything else.

---

## 2 · The scale

| token | px @1080h | job |
|---|---|---|
| `--ss-display-size` | 130 | the `ss-callout` number. One per canvas beat, at most. |
| `--ss-cap-size` | 80 | the caption. Fixed for the whole video, never shrinks. |
| `--ss-h-size` | 46 | a card's own title |
| `--ss-body-size` | 28 | body inside a card, a list row |
| `--ss-label-size` | 22 | a label under a callout, a caption under a shot |

Five sizes. If a beat wants a sixth, it wants a different device.

⚠ **Everything is sized in `cqh` and the root must carry `.ss-frame`.** A
percentage `font-size` resolves against the parent's font-size, not the frame,
and silently renders tiny while the layout still looks plausible. `.ss-frame`
sets `container-type:size`; `check-screenshare.sh` fails a file that uses
`ss-*` classes without it.

⚠ **A web font is measured before it loads.** Any load-time JS that fits text
to a box sizes it against the fallback face and then never re-runs. Do the fit
inside `document.fonts.ready`.

---

## 3 · Weight and tracking

| | weight | tracking |
|---|---|---|
| display | 800 | −.035em |
| caption | 700 | −.02em |
| card title | 600 | 0 |
| body | 400 | 0 |
| label | 500 | +.02em, and **not** uppercase |

The negative tracking on the big sizes is doing real work — at 130px, default
spacing reads loose and amateur. At body sizes, leave it alone; tracking body
text in a UI-like frame is the tell that a designer touched it.

**No uppercase anywhere except an acronym.** No small caps, no letterspaced
all-caps label. (If you chose the condensed or serif display face in
brand.json, it applies to captions, callouts and card titles only; labels
and body stay Inter.)

---

## 4 · Colour of type

| what | colour |
|---|---|
| everything, by default | `--ss-ink` |
| a label, a caption under a shot, a secondary row | `--ss-slate-500` |
| a card's secondary line | `--ss-slate-700` |
| one word doing one of the four jobs | the matching accent |

That is the whole system. Type is never a gradient, never white on a coloured
block you invented, never a tint of the ink for "hierarchy" — the sizes do
hierarchy.

⚠ **Type on `--ss-amber` is `--ss-ink`.** The amber is a highlighter fill; it
is pale on purpose so that ink still reads on it at 4.5:1. Setting the
highlighted word in white, or in an accent, fails both contrast and the point
of a highlighter.

---

## 5 · Numbers

The `ss-callout` is the one place this style gets loud, so get it right:

- **Tabular figures off.** Proportional figures set better at 130px.
- **Keep the unit small.** `200` at display size with `×` at `--ss-h-size`
  reads better than both at 130.
- **The number takes the accent; the label under it does not.** A green number
  over a green label is two things shouting.
- **Never abbreviate what the source spells out.** If the real page says
  50,000,000 the callout says 50,000,000 — and verify the
  figure is current while you are sourcing it, not after.
