# AI Employee Lab Tech SFX Library: v0.9.0-beta

Full edition · built 2026-11-04 · 869 MB

**1548 sound effects** for short-form tech, AI and business videos (Reels, TikTok, Shorts), ready for an AI video editor to use.
That is 302 core picks, 1157 extended sounds and 89 cut-ready edits. All files are 48 kHz / 24-bit WAV, trimmed, cleaned and level-measured, and each has a sync point and clip gain in `index.json`.

**What this is.** The sounds come from 11 free, openly licensed packs by the creators credited below. This library adds the curation, the cleanup and cut-ready edits, the index, and the AI-editor integration. You could download the source packs yourself; you would not get the rest.

**Beta status.** The core picks were chosen by an AI review of filenames, the creators' notes and audio measurements. No human has ear-checked them yet, so expect some misses. Report a bad sound by its ID.

## Start here

- `INSTALL.md`: set the library up for your AI video editor in a few minutes. Claude Code users can unzip it straight into `~/.claude/skills/`.
- `audition.html`: open it in Chrome or Safari to browse, filter and play every sound.
- `AGENT_GUIDE.md`: the AI editor's manual (which sound for which moment, placement, levels, density, credits).
- `sfx.py`: a small helper your AI editor runs to find and place sounds. Python 3 only; nothing to install.
- `index-core.json` and `index/by-category/`: compact indexes for agents. `index.json` and `index.csv` hold every field.
- `CATALOG.md`, `CREDITS.md`, `LICENSES/`, `CHANGELOG.md`.

## Licensing in plain words

- **1435 sounds are CC0** (public domain), under `sounds/cc0/`. Use them in any video, client work or ad. No credit needed. Do not claim you made them or register them with Content ID.
- **113 sounds need credit**, under `sounds/credit-required/` (CC BY 4.0 / OGA-BY 4.0). A video that uses one must include its credit line. You may re-share these files. The helper skips them unless you allow them.

## Sources and provenance

| Source | Creator | License | Original format | AI statement | Files |
|---|---|---|---|---|---|
| [Glitch Noises](https://vladislavzh.itch.io/glitch-noises) | Vladislav Zharkov | CC0 1.0 | WAV 48 kHz / 24-bit | Creator states no generative AI was used (bundled Read Me.pdf, page 4). | 1101 |
| [UI Clicky Sound and FX Pack](https://gmorkh.itch.io/uiscp) | Gmorkh | CC BY 4.0 | WAV 44.1 kHz / 32-bit | itch.io page states 'No generative AI was used' (checked 2026-11-04). | 32 |
| [Sci-fi Sounds](https://kenney.nl/assets/sci-fi-sounds) | Kenney | CC0 1.0 | OGG Vorbis (lossy) | No statement; published before AI sound generators were in use. | 39 |
| [Digital Audio](https://kenney.nl/assets/digital-audio) | Kenney | CC0 1.0 | OGG Vorbis (lossy) | No statement; published 2012, before AI sound generators existed. | 19 |
| [Essentials Series (Electromagnetic)](https://nox-sound-design.itch.io/essentials-series-sfx-nox-sound) | Nox Sound Design | CC0 1.0 | WAV 48 kHz / 24-bit | itch.io page tagged 'No generative AI was used'; induction-mic recordings of real devices (2021). | 59 |
| [UI buttons | Sound effects pack + GLITCHES](https://pknm.itch.io/ui-buttons-sound-effects-pack) | kasse | CC BY 4.0 | WAV 44.1 kHz / 16-bit | itch.io page tagged 'No generative AI was used'; recorded March 2020. | 26 |
| [BigSoundBank](https://bigsoundbank.com/) | Joseph Sardin | CC0 1.0 | WAV 48 kHz / 24-bit | Real recordings of real devices by Joseph Sardin (file metadata 2020). | 117 |
| [UI Audio](https://kenney.nl/assets/ui-audio) | Kenney | CC0 1.0 | OGG Vorbis (lossy) | No statement; published before AI sound generators were in use. | 37 |
| [Interface Sounds](https://kenney.nl/assets/interface-sounds) | Kenney | CC0 1.0 | OGG Vorbis (lossy) | No statement; published 2020, before AI sound generators were in use. | 63 |
| [Universal UI Soundpack](https://cyrex-studios.itch.io/universal-ui-soundpack) | Nathan Gibson | CC BY 4.0 | WAV 44.1 kHz / 16-bit | itch.io page tagged 'No generative AI was used'; file metadata shows Logic Pro X, 2021. | 40 |
| [Sci-Fi UI SFX](https://opengameart.org/content/sci-fi-ui-sfx) | Paolo Migliorisi - Urizen Composer | OGA-BY 4.0 | WAV 48 kHz / 24-bit | No statement from the creator; the page describes layered synth sound design (files dated December 2024). | 15 |

No sound here is known to be AI-generated. The AI statement column shows the evidence for each source.

## Known gaps in this beta

- Whooshes & Swishes (transition movement): 10 core picks (target 50)
- Risers & Build-ups: 9 core picks (target 30)
- Impacts, Booms & Sub Drops: 14 core picks (target 35)
- UI Motion, Swipes & Slides: 22 core picks (target 25)
- Typing & Keyboard: 17 core picks (target 25)
- Pops, Blips & Text Appear: 24 core picks (target 35)
- Camera & Photo: 12 core picks (target 15)
- Phone & Device: 0 core picks (target 18)
- Money & Commerce: 0 core picks (target 15)
- Counters, Tickers & Timers: 5 core picks (target 15)
- Sci-Fi Energy, Holograms & Power: 19 core picks (target 25)
- Shimmers, Sparkles & Light Sweeps: 4 core picks (target 18)
- Stingers, Tonal Hits & Logo Stings: 0 core picks (target 20)
- Reverses, Suck-backs & Downlifters: 3 core picks (target 15)
- Tactile Foley: Paper, Pen, Tape & Desk: 4 core picks (target 25)
- Electric Zaps & Sparks: 0 core picks (target 10)
- Reactions, Crowd & Human: 0 core picks (target 12)
- Comedic & Meme Accents: 0 core picks (target 15)

If a moment has no fitting sound, the AI editor is told to leave it silent rather than invent or download one.

## How it was built

1. Sources were cleared license by license. Only CC0 and CC BY-style licenses that allow redistribution were used, and each creator's license notice is kept in `LICENSES/`.
2. Every file was measured (length, onset, loudest point, loudness, brightness, low end), then sorted into 24 categories with names, use cases and quality scores by an AI review, category by category.
3. Audio was converted to 48 kHz / 24-bit. DC and sub-25 Hz rumble were removed, leading silence was trimmed to the first transient, and tails got short equal-power fades. Loops were filtered circularly and crossfaded at the seam. True peak was set to -1 dBTP, and a per-file clip gain was computed from measured loudness.
4. Long risers, booms, whooshes and typing takes got cut-ready edits. These are edits of the same recordings, not new sounds.
5. An automated check confirmed formats, durations, peaks, loop seams, license folders and credit lines against the index.
