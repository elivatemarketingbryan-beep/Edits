# Preset: longform-16x9

Locked look spec for every 16:9 long-form job.

## Canvas
- 1920 x 1080, match source fps (never resample dialogue-bearing video)

## Safe zone
- No hard pixel lock like short-form, but keep lower-thirds and captions
  clear of the bottom 80px (platform UI overlap) and titles clear of the
  top 60px.

## Palette
| token | hex | use |
|---|---|---|
| `--bg` | `#101013` | base background |
| `--fg` | `#f0f0ee` | primary text |
| `--accent` | `#3fa9ff` | emphasis, lower-third accent |
| `--muted` | `#7d7d86` | secondary text |

## Typography
- Display / titles: `Inter`, weight 700
- Lower-thirds / body: `Inter`, weight 500
- Numerals in stat callouts: tabular-nums

## Motion defaults
- Standard beat-in: 280ms, ease `cubic-bezier(.16,1,.3,1)`
- Standard beat-out: 200ms, ease `cubic-bezier(.7,0,.84,0)`
- Lower-thirds hold minimum 2.5s before out-animation starts

## Build
```bash
uv run presets/longform-16x9-build.py
```
Regenerates `presets/build/longform-16x9/theme.css`.
