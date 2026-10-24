# How it works

Every effect is a Remotion composition fed by the same preparation pipeline.

1. **Prepare the clip** (`engine/fx.mjs`, cached in `engine/jobs/<clip>/`)
   - The chosen range is re-encoded to 1080×1920, 30 fps (`source.mp4`).
   - **Transcript:** faster-whisper produces word-level timestamps (`words.json`). Every caption and every `"@word"` timing comes from here.
   - **Cut-out** (effects that need it): Robust Video Matting separates the speaker from the room frame by frame and writes `matte.webm` — the same footage with a transparent background — plus `subject.json` (where the head and body sit) and, for Doodle Boil, `contours.json` (the outline as polygons).
2. **Build the props.** The effect's defaults (`engine/effects/<effect>.json`) are merged with your config. Any image or video path in the config is copied in as an asset. Misheard words are repaired with `fixes`.
3. **Render.** Remotion bundles the React code once (cached), then renders every frame in headless Chrome and encodes H.264 with the original audio.

Layering is what makes the effects feel "real": anything that should sit behind you is drawn between the original footage and the cut-out, so your head and hands pass in front of it. Placement uses `subject.json`, so the graphics adapt to where you sit in frame.

The captions are one shared component (`engine/src/lib/captions.tsx`) with six looks: `pop`, `caps`, `twoTier`, `serif`, `tracked` and `box`. Words appear exactly when they are spoken and group into short phrases; one key word per phrase can be highlighted automatically.
