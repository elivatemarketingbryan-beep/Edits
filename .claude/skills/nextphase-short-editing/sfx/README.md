# sfx/ — the NextPhase sound palette

The audio here is **CreatingWithJerry's paid pack** — kept **local** and **not committed** (see `.gitignore`); only this manifest is tracked, so the repo documents the system without redistributing a paid pack. Cue map, level, and the sound-pass workflow live in `../system/sound-design.md`.

## The palette (this folder)
**Core**
| file | use when… |
|---|---|
| `whoosh.mp3` / `whoosh-2.mp3` | a zoom / a big element flies in (two flavors) |
| `swoosh.wav` | a fast slide / whip between scenes |
| `pop.wav` | something appears (soft) |
| `click.wav` | something appears / UI tap (crisp) |
| `magic-reveal.wav` | the unveil shimmer |
| `riser.wav` | building tension (starts before the beat) |
| `camera-shutter.wav` | a clean cut / snapshot |
| `swell.wav` | a 0.5s rise that lands — a fast riser for a single beat |
| `highlighter.wav` | the marker stroke, under an `article-highlight` sweep |

**Extra voices (for variety — match to the element)**
| file | use when… |
|---|---|
| `futuristic-click.wav` | techy UI: settings row, code chip, toggle |
| `confirm.wav` | a success / checkmark / "it works" |
| `ping.mp3` | a notification / highlight / single alert |
| `beep.wav` | a countdown / timer / numeric beat |
| `keyboard.mp3` | typing / code / terminal |

## Retired
`vinyl-rewind.mp3` was **removed from the palette on 2026-08-07** — do not cue it in new work.
The file is deliberately still on disk: 28 cues across 16 shipped videos reference it, and
`mix-sfx.sh` hard-fails on a missing sound, so deleting it would break every one of those on
re-render. It is retired, not deleted.

## `library/` (local, gitignored)
The full pack — more variants (PopUp ×6, Click ×10, Futuristic Click ×10, Woosh ×6, Beep ×7, Confirmation ×3, Riser ×4, Extras) + cinematic ambiences. Pull & trim any into `sfx/` when you want a new voice.

## Reproduce on a fresh machine
Drop CreatingWithJerry's pack back in and re-derive these names (`keyboard` and `beep` are short trims of the long originals), or point `scripts/mix-sfx.sh` at your own sounds.
