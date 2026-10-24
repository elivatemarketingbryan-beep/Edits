---
name: video-fx
description: Hub for the Claude Video FX pack — 17 motion-graphics effects for vertical talking-head videos (Reels, TikTok, Shorts) rendered locally with Remotion: orbit, couch wall, UI world, frame break, digital zoom, phone mockup, checklist, headline wall, zoom-through cut, chart grow, pull-back reveal, green screen, paper cut, doodle boil, vertigo, cover story, glass type. Use this whenever the user wants effects, motion graphics, overlays or "edits" added to a video and hasn't picked a specific effect, wants several effects in one video, asks what effects are available, or needs the kit installed, checked or fixed, even if they never mention Remotion.
---

# Claude Video FX

Seventeen short-form video effects, each its own skill (`fx-<name>`), all rendered by one local engine. Every effect takes a vertical talking-head clip, reads its transcript, (when needed) cuts the speaker out of the background, and renders a 1080×1920 MP4 with the original audio and word-by-word captions.

```bash
ENGINE="{{FX_ENGINE}}"
```

## The effects

<!-- catalog -->
| # | Effect | Skill | What it does | Cut-out |
|---|---|---|---|---|
| 01 | Orbit | `fx-orbit` | Floating cards orbit around the speaker in 3D, passing behind and in front of them. | yes |
| 02 | Couch Wall | `fx-couch-wall` | A wall of video thumbnails with view counts fills in behind the speaker. | yes |
| 03 | UI World | `fx-ui-world` | A chat-app UI fills the top of the frame: clips drop in, a command types itself, and the speaker pokes out over it. | yes |
| 04 | Frame Break | `fx-frame-break` | The video shrinks into a Reels/TikTok phone frame and the speaker pops out over its edge. | yes |
| 05 | Digital Zoom | `fx-digital-zoom` | Punch-in zooms with zoom blur on the key words. | no |
| 06 | Phone Mockup | `fx-phone-mockup` | A floating iPhone beside the speaker shows an app conversation that types itself out. | yes |
| 07 | Checklist | `fx-checklist` | A frosted-glass checklist card whose steps type in and tick off as they are said. | yes |
| 08 | Headline Wall | `fx-headline-wall` | Headlines, tweets and search cards pin themselves to the wall behind the speaker. | yes |
| 09 | Zoom-Through Cut | `fx-zoom-through-cut` | Transition: rush into the first shot with zoom blur and burst out of the second. | no |
| 10 | Chart Grow | `fx-chart-grow` | A line chart draws itself across the frame behind the speaker and spikes up with a glowing label. | yes |
| 11 | Pull-back Reveal | `fx-pull-back-reveal` | The shot pulls back to reveal it is inside an editor app that is rendering it, with a % counter. | no |
| 12 | Green Screen | `fx-green-screen` | The speaker is cut out and dropped onto a new background (app UI, image or video). | yes |
| 13 | Paper Cut | `fx-paper-cut` | Scrapbook collage: the speaker becomes a paper sticker over scribbles, with ransom-note letters. | yes |
| 14 | Doodle Boil | `fx-doodle-boil` | A hand-drawn outline boils around the speaker while doodles draw themselves on. | yes |
| 15 | Vertigo | `fx-vertigo` | Dolly-zoom: the background zooms while the speaker stays locked in place. | yes |
| 16 | Cover Story | `fx-cover-story` | Magazine cover: a giant serif masthead rises in behind the speaker's head. | yes |
| 17 | Glass Type | `fx-glass-type` | Giant 3D glass letters stand on the wall behind the speaker, refracting the room. | yes |
<!-- /catalog -->

Utility: `captions` (no skill of its own) renders plain footage with the same captions, for the parts of a video between effects.

"Cut-out" effects put graphics *behind* the speaker or move the speaker separately from the room. The first still or render of a range spends extra time cutting the speaker out (about 1s of processing per 9 frames on an Apple-silicon Mac). It is cached **per exact `--start/--end` range**: other effects and re-renders on the same range are fast, but changing the range re-runs it. Settle the range before the first still.

## Picking an effect

| The speaker is… | Reach for |
|---|---|
| naming a single big idea or topic | cover-story, glass-type, digital-zoom |
| listing steps or "all you need to do is…" | checklist, ui-world |
| talking about growth, numbers, results | chart-grow, pull-back-reveal, paper-cut |
| referencing news, buzz, "everyone is saying" | headline-wall, couch-wall |
| showing an app, tool or result on a phone | phone-mockup, frame-break, green-screen |
| at a hook, punchline or turn in the story | vertigo, zoom-through-cut, orbit, doodle-boil |

Use one effect per beat, then let the footage breathe. 2–4 effects in a 30–60s reel is plenty.

## Setup and health

1. `node "$ENGINE/fx.mjs" doctor` — every line should be ✔.
2. If something is ✖, the fix is printed under it. The full install is the kit's `install.command` (macOS, double-click) or `node install.mjs` from the kit folder; it installs the engine's Node packages, a private Python environment (faster-whisper, onnxruntime, OpenCV), the person-matting model and the headless browser, then copies these skills into `~/.claude/skills`.
3. Requirements: Node 20+, Python 3.9+, ~3 GB free disk. Everything runs locally; no API keys.

## Commands

| Command | What it does |
|---|---|
| `node "$ENGINE/fx.mjs" list` | all effects |
| `node "$ENGINE/fx.mjs" info <effect>` | every option with its default |
| `node "$ENGINE/fx.mjs" words "<video>"` | timestamped transcript of the whole file (`--detail` for every word) |
| `node "$ENGINE/fx.mjs" still <effect> "<video>" --start a --end b --config c.json --at t --out x.png` | one frame, fast |
| `node "$ENGINE/fx.mjs" render <effect> "<video>" --start a --end b --config c.json --out x.mp4` | the MP4 (`--draft` = half-res preview) |
| `node "$ENGINE/fx.mjs" sheet "<render.mp4>" --fps 4` | contact sheet for review, saved as `<render>-sheet.png` (`--from/--to`, `--fps 2` for long clips) |
| `node "$ENGINE/fx.mjs" frame "<render.mp4>" --at 3.2` | one full-size frame, for checking small text |
| `node "$ENGINE/fx.mjs" splice "<base>" --segments "a.mp4@12.5,b.mp4@31" --out final.mp4` | drop rendered effect segments into the full video at their start times. `<base>` is the original video or a whole-file `captions` render. Re-encodes the whole video to high-quality H.264 with the original's first audio track |

Each effect skill documents its own options. All of them share `captions`, `window`, `fixes` and the `"@word"` time references.

## Several effects in one video

1. `words` the whole video and plan which effect goes on which sentence (no overlaps; at least a few seconds of plain footage between effects). Snap each range to speech, ending just before the next sentence's first word.
2. **Captions — pick one setup and use it everywhere.** Every config (each effect and `captions.json`) gets the same `"captions"` block, e.g. `{"style": "pop", "y": 0.74}`, and the same `"fixes"`; defaults differ per effect, so leaving them out makes captions jump at the seams.
   - Captions throughout (usual): render the `captions` effect over the whole file and use that render as the splice **base**; keep captions **on** in every segment.
   - No captions: use the original as the base and set `"enabled": false` in every segment.
3. Render each effect on its own range with `--start/--end` (the render keeps the original timing and audio). For a segment that ends **before** the end of the video, add `"window": [0, <length − 0.4>]`: the effect has fully left by the window end, so make sure the window end still comes after the last word the graphics belong to (extend the range a little if needed). A segment that runs to the end of the video needs no window.
4. `splice` the rendered segments into the base: each segment is placed at its `@start` time (the same number as its `--start`), the base fills the gaps, and the original audio runs underneath the whole thing so there are no audio seams.

```bash
node "$ENGINE/fx.mjs" render captions "talk.mp4" --config "talk - captions.json" --out "talk - Captions.mp4"
node "$ENGINE/fx.mjs" splice "talk - Captions.mp4" \
  --segments "talk - Cover Story.mp4@0,talk - Checklist.mp4@14.2,talk - Chart Grow.mp4@31" \
  --out "talk - edited.mp4"
```

## Rules that keep results clean

- The engine never modifies the source video; configs and renders are new files. Put them next to the user's video (or in the folder they name).
- A moment inside a longer video: render the segment, end its effect with a `window` so it leaves before the seam (see *Several effects in one video*), then `splice` it back and deliver the full video.
- Always look at a still before a full render, and at the contact sheet after it.
- Write content (headlines, checklist items, chart labels, phone messages) from what the speaker actually says. Short beats long: 2–6 words per UI line.
- Fix misheard names before rendering with `"fixes": {"cloud code": "Claude Code"}` in the config; Whisper often mishears product names. Keys are matched against the words as `words` prints them (case and punctuation ignored). `words --vocab "Name, Brand"` re-transcribes with those names expected and replaces the cached transcript for that video, including ranges prepared earlier.
- Audio: renders and splices keep the video's first audio track. If a recording has separate mic and desktop tracks, mix them into one track first.
- Effects are designed for vertical 9:16 footage with one person. Landscape input is centre-cropped to 9:16.
- Outputs default to `engine/out/`; prefer `--out` next to the user's video with a clear name like `"<name> - <Effect>.mp4"`.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `doctor` shows ✖ on Python packages or model | rerun the kit installer |
| "Waiting for root component" timeout | run `node "$ENGINE/fx.mjs" browser`, then render again; the browser must live in `~/.claude-video-fx` |
| graphics in front of the speaker that should be behind | the cut-out failed on this clip (very dark footage or several people); try a different range |
| captions say the wrong word | add `"fixes"`, or re-run `words` with `--vocab "Name, Brand"` |
| render very slow | use `--draft` while iterating; close other heavy apps; keep ranges under ~15s |
