# Workflow: short-form (9:16)

Delivery/technical detail sheet. For the visual design lock (palette,
type, motion), see `presets/shortform-9x16.md` — this file is about
platform and export mechanics, not look.

## Platforms
TikTok, Instagram Reels, YouTube Shorts. All three accept the same
export; don't special-case a build per platform unless the user asks.

## Canvas & timing
- 1080x1920, match source fps
- Typical duration: 15-90s. Flag it to the user if a cut runs past 3
  minutes — that's usually a sign the filler/dead-air pass under-cut.

## Export target
- H.264 (encoder per `lib/common.sh`'s `hf_video_encoder`), yuv420p
- Audio: AAC, **256k minimum** (this pipeline's polish pass already
  targets exactly 256k — never let a platform-specific re-encode step
  drop below it)
- Container: mp4

## Safe zone
No key visuals in the top 200px or bottom 300px of 1080x1920 — restated
from `presets/shortform-9x16.md` because it's also an export-QA gate,
not just a design rule: check the final render, not just the
composition source, since a graphic can drift during animation.

## Filename convention
`outputs/<job>.final.mp4` (set by `finalize.sh` — don't rename by hand,
the `prune.sh` / `finalize.sh` pair expects this exact name).

## Utility
```bash
workflows/probe-format.sh projects/<job>/outputs/<job>.final.mp4 shortform
```
Flags resolution/aspect/audio-bitrate mismatches against this sheet
before you ship.
