# sfx/ — the NextPhase sound palette

The audio here is **CreatingWithJerry's paid pack**. It is bundled with this kit for your own use — treat it as licensed to you, not as something to redistribute further. Cue map, level, and the sound-pass workflow live in `../reference/sound-design.md`.

> **Long form uses these in TWO passes:** Pass A is the SFX cue mix (`scripts/mix-sfx.sh`),
> Pass B is the ducked music bed (`scripts/mix-bgm.sh`). The bed is **not** in this folder —
> it is per-video, rights-cleared, and lives at `assets/music/bed.mp3` in the video folder.

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

**Extra voices (for variety — match to the element)**
| file | use when… |
|---|---|
| `futuristic-click.wav` | techy UI: settings row, code chip, toggle |
| `confirm.wav` | a success / checkmark / "it works" |
| `ping.mp3` | a notification / highlight / single alert |
| `beep.wav` | a countdown / timer / numeric beat |
| `keyboard.mp3` | typing / code / terminal |
| `vinyl-rewind.mp3` | a rewind / "back up" / reset |

## `library/` — NOT included
The 9:16 skill's docs referenced a `sfx/library/` of extra variants (PopUp ×6, Click ×10,
Futuristic Click ×10, Woosh ×6, Beep ×7, Riser ×4 …). **It was never part of the shipped
skill and it is not here either.** Only the 14 curated sounds above exist. If a cue file
names anything else, `mix-sfx.sh` fails with `unknown sound` — that is the script working
correctly, not a bug.

Want another voice? Drop CreatingWithJerry's full pack (or any sound) into this folder with
a clear name and it resolves immediately — `mix-sfx.sh` looks up `sfx/<name>.{mp3,wav,aif,aiff}`.

## Reproduce on a fresh machine
Drop the pack back in and re-derive these names (`keyboard` and `beep` are short trims of the
long originals), or point `scripts/mix-sfx.sh` at your own sounds. `scripts/gen-sfx.sh`
regenerates a synthetic 7-sound subset via the ElevenLabs API if you have a key in `.env`.
