# House style: where we deliberately differ from the reference

`STYLE_BIBLE.md` is a measurement of one reference edit. We copy its **editing grammar**: pacing, cut rules, caption timing, motion curves, beat logic and sound placement. We do **not** copy its look. The look below is ours, and it always wins over the bible's colour and background values.

## Palette: red

| Token (engine/runtime/engine.css) | Value | Used for |
|---|---|---|
| `--accent` | #E5322B | ring, counter digits, chart and button defaults on built pages |
| `--accent-hi` → `--accent-lo` | #FF5A4A → #C0141C (top to bottom) | caption emphasis words (serif accents, numbers, the promise verb), the headline and label box, the "ours" pill |
| `--accent-soft-hi` → `--accent-soft-lo` | #FFB4A9 → #FF5747 | the same emphasis on dark scenes and over the full-screen character |
| `--select` | #FFD2CC | the text-selection sweep |
| `--beam` | #FF8476 | the comets orbiting card borders |
| `--card-border` | #2A2A2A | browser card outline (neutral, so the red stays an accent) |
| CTA keyword | #FFE6E1 → #FF8A7C → #E5322B, red glow | the "comment X" lockup |

Set `"accent"` in `brand.json` (or a plan) to any hex colour. The build re-derives every token above from it the same way, so a creator can swap red for their brand colour in one line.

## Backgrounds: minimal dot grid

- **Light scenes:** warm off-white #F6F5F3 with a black dot grid (1.8 px dots, 36 px pitch, 15 % opacity) that fades toward the edges. No gradient, no leaf shadow, no film grain.
- **White reveal scenes:** #FDFDFD with the same grid at 60 % strength.
- **Dark scenes:** charcoal, graphite, wine, warm or onyx radial gradients (rotated per video by the seed), a faint white dot grid (7 %), and a vignette. When the card has a photo, a heavily blurred copy of it sits underneath.
- The grid drifts upward by about one cell per scene. You barely notice it, but the frame is never fully static.

## Unchanged from the reference
Fonts and sizes, layouts and positions, every animation curve and duration, caption grouping and timing, scene rules, sprite framing, and the sound design.
