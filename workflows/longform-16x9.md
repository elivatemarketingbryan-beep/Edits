# Workflow: long-form (16:9)

Delivery/technical detail sheet. For the visual design lock, see
`presets/longform-16x9.md`.

## Platforms
YouTube (primary), direct download / client delivery.

## Canvas & timing
- 1920x1080, match source fps
- No hard duration cap — let the content decide.

## Export target
- H.264 (encoder per `lib/common.sh`'s `hf_video_encoder`), yuv420p
- Audio: AAC, **256k minimum**
- Container: mp4

## Filename convention
`outputs/<job>.final.mp4` (set by `finalize.sh`).

## Utility
```bash
workflows/probe-format.sh projects/<job>/outputs/<job>.final.mp4 longform
```
