# Split Screen Editor

An independent editing folder for an AI agent and a local video renderer. Drop in a video, ask the agent to edit it, and get an MP4 plus the editable project. Animations are original React/SVG code rendered with Remotion. No AI video generation is used.

**Start with [START_HERE.md](START_HERE.md).** Open the extracted folder in a coding-capable ChatGPT/Codex environment and say:

> Read START_HERE.md and AGENTS.md. Edit the video in inputs/ into a finished short. Use the reference corpus for composition principles, create visuals specifically for what I say, and render and review the final MP4.

This is a working **v0.1 editing kit**, not a hosted application or a trained video-editing model. The AI agent makes editorial decisions and writes the animation code. The toolkit provides deterministic media processing, timeline validation, preview, rendering, and technical QA. Uploading files into a regular ChatGPT Project does not itself supply this local runtime; see [runtime options](docs/RUNTIME.md).

## What is included

- Source ingest and normalization, frame contact sheets, audio extraction, optional local transcription, and timestamped transcript import.
- Cut-aware captions: real word timing when provided; honest phrase timing for subtitles.
- Graphics above the presenter, full-screen visuals, or full-screen source footage, selected per beat.
- Topic-specific React/SVG components, plus comparison, steps, diagrams, charts, quotes, image, and typography primitives.
- Per-beat palettes, focal-point cropping, fit/contain, caption placement, and optional local music/effects.
- Remotion Studio, storyboard images, 1080×1920 MP4 exports, and machine-readable QA.
- A five-reel source-linked observation corpus, editorial instructions, review criteria, and a distribution packager.

## Quick technical check

Requires Node.js 22 or later. The pinned dependencies provide FFmpeg/FFprobe; Remotion downloads Chromium on first use. Initial installation needs an internet connection. Optional local transcription also requires Python and faster-whisper.

```sh
npm ci
npm run doctor
npm run demo
npm run demo:render
```

`npm run studio` opens the editable preview. The demo contains original procedural source footage and a quiet test tone. It is a rendering demonstration, not a finished edit of a real speaker.

For your own footage, put it in `inputs/` and use [the start-editing prompt](prompts/START_EDITING.md). The agent follows [the workflow](docs/WORKFLOW.md). A typical first command is:

```sh
npm run editor -- ingest "inputs/my-video.mp4" --job my-first-edit
```

Ingest produces inspection assets and an explicitly unfinished scaffold. The agent must inspect the actual content, create a brief, author a plan, create suitable visuals, generate captions from the real transcript, and review the render. There is no keyword-to-template shortcut that claims to understand arbitrary footage.

## Reference and originality

The initial corpus documents four sampled reels from [Jack Roberts' public profile](https://www.instagram.com/jackroberts___/reels/?hl=en). It records observed layouts and visual purposes with uncertainty, rather than bundling his videos or reproducing his artwork. Read [the research](research/REFERENCE_RESEARCH.md) and [corpus guide](corpus/README.md). Continuous audio review and a larger representative corpus remain future calibration work.

The project is built from scratch. Its custom scene registry is open-ended: the agent can author new visual metaphors for fitness, education, business, cooking, software, or other topics. Quality still depends on source material, editorial judgment, and watching the actual export.

## Share with members

Run `npm run package` to create `dist/Split-Screen-Editor-v0.1.0.zip`. The package uses a curated allowlist, excludes local jobs/uploads/renders/dependencies, and resets edit history. See [sharing](docs/SHARING.md).

Original project source is MIT licensed. Dependencies retain their own licenses. In particular, [Remotion's terms](https://www.remotion.dev/docs/license) depend on the user's usage and organization; this project does not grant a Remotion license. HyperFrames is a possible alternative renderer, but this release implements and tests Remotion only.
