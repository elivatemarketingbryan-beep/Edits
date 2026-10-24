# Preset: shortform-9x16

Locked look spec for every 9:16 short-form job. Don't improvise a new
palette or type ramp per job — start here, and if a job genuinely needs
to diverge, change this file (and re-run its `build.py`) rather than
drifting silently in one job's composition CSS.

## Canvas
- 1080 x 1920, 30fps unless the source footage is natively 24/25/60 (match source fps, never resample dialogue-bearing video to a new rate)

## Safe zone (non-negotiable)
- No key visuals (face, captions, graphics) in the top 200px or bottom 300px
- Safe area: y 200–1620
- `shortform-9x16-build.py` renders `build/shortform-9x16/safe-zone-overlay.png` —
  a transparent guide with the excluded bands tinted, for visual QA while
  building parts. Never ship it; it's a build-time reference only.

## Palette
| token | hex | use |
|---|---|---|
| `--bg` | `#0b0b0f` | base background |
| `--fg` | `#f5f5f2` | primary text |
| `--accent` | `#ff5a36` | emphasis, active caption word, callouts |
| `--muted` | `#9a9aa2` | secondary text, timestamps |

## Typography
- Display / hook text: `Inter`, weight 800, tight letter-spacing (-0.02em)
- Body / caption rail: `Inter`, weight 600
- Numerals in stat callouts: tabular-nums

## Motion defaults
- Standard beat-in: 220ms, ease `cubic-bezier(.16,1,.3,1)` (expo-out)
- Standard beat-out: 160ms, ease `cubic-bezier(.7,0,.84,0)` (expo-in)
- Caption word reveal: no more than 90ms stagger between words

## Approved motion components
Reviewed and approved live with the user — use these before hand-
building a similar overlay from scratch:

| Direction | Use for | Template |
|---|---|---|
| Anchor rail | Default running dialogue captions | built into `embedded-captions` (its default "anchor" style) — not a file here |
| Lower-third card | Stat callouts, quotes | `presets/components/lower-third-card.html` |
| Cinematic rise | Hook/emphasis lines, sparingly | `presets/components/cinematic-rise.html` |

Both component files are HyperFrames sub-composition templates — copy
into a job's `hf-graphics/compositions/`, fill in the `__PLACEHOLDER__`
tokens, and wire into `index.html` per `graphics-plan`'s beat sheet.

## Build
```bash
uv run presets/shortform-9x16-build.py
```
Regenerates `presets/build/shortform-9x16/theme.css` and the safe-zone
overlay PNG. Run this after editing this file, not by hand-editing the
generated output.
