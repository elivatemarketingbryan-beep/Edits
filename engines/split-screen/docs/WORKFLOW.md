# From footage to finished edit

The assistant runs this workflow. The CLI handles media and rendering; the assistant supplies the editorial choices and custom graphics. Commands below use a job named `my-video`; replace it with a short unique slug. Run them from the project root.

## 1. Confirm the runtime

```sh
npm ci
node scripts/editor.mjs doctor --browser download
node scripts/editor.mjs help
```

Run `npm ci` when setting up a clean copy, not before every command. Confirm that Node, the browser renderer, FFmpeg, and FFprobe work. Python is optional unless using local transcription. If npm reports blocked install scripts, follow [the runtime guidance](RUNTIME.md#npm-install-scripts); the kit includes specific script approvals for its pinned binary dependencies.

## 2. Ingest and understand

```sh
node scripts/editor.mjs ingest "inputs/my-video.mp4" --job my-video
```

Ingest preserves the original and creates `public/jobs/my-video/source.mp4`, normalized to 30 fps, plus metadata, a contact sheet, a starting plan, and `audio.wav` when the source has audio. It refuses to overwrite an existing job. The template is scaffolding, not a finished editorial decision.

Inspect the source, contact sheet, and metadata. Listen and read the transcript. Identify usable takes, the useful promise, necessary context, natural transitions, and the ending. Save these decisions in `jobs/my-video/brief.md`. See [editorial direction](EDITORIAL.md).

## 3. Obtain a real timed transcript

Use one of these routes. Transcription quality must still be reviewed, especially names, numbers, technical terms, and noisy sections.

**Import an existing transcript:**

```sh
node scripts/editor.mjs transcript "inputs/my-video.srt" --job my-video
```

Supported inputs are SRT, VTT, and timed JSON. JSON timing uses **seconds on the source timeline**:

```json
{"segments":[{"start":1.2,"end":3.4,"text":"A real spoken phrase.","words":[{"start":1.2,"end":1.4,"text":"A"},{"start":1.4,"end":1.8,"text":"real"},{"start":1.8,"end":2.5,"text":"spoken"},{"start":2.5,"end":3.4,"text":"phrase."}]}]}
```

This is a format illustration, not a transcript to reuse. `words` is optional; omit it when true word timings are unavailable. Whisper-style JSON is also accepted. Exports using `start` plus `duration` instead of `end` work for both segments and words; when a segment omits `text`, its actual words supply the text. All times remain seconds. Verify imported names and unusual phrases against the audio before captioning.

**Transcribe locally:**

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements-transcription.txt
node scripts/editor.mjs transcribe --job my-video --model small --python .venv/bin/python
```

On Windows, use `.venv\Scripts\python.exe` for that environment's Python path. The first transcription downloads a model. Speech recognition runs locally on CPU using the optional dependency; the audio is not uploaded by this command. Add `--language en` only when that is the actual language, or use the appropriate supported language code. Use `--overwrite` only when deliberately replacing that job's transcript after a correction.

If no transcript route works, continue framing and visual planning, then request the missing transcript. Do not fill captions with a guessed script. A silent visual demonstration does not require invented speech captions.

## 4. Author the edit

Copy `public/jobs/my-video/edit-plan.template.json` to `jobs/my-video/plan.json` and replace the scaffold. Follow [the plan format](PLAN_FORMAT.md). Select source cuts, design the output beats, choose framing and brand, and write original graphics where the topic warrants them.

The media path in the plan is relative to `public/`: `jobs/my-video/source.mp4`. Keep source frame numbers and output frame numbers distinct. Use `src/custom/registry.tsx` to register new topic-specific React/SVG components.

Map source transcript timing through the completed cuts:

```sh
node scripts/editor.mjs captions jobs/my-video/plan.json "inputs/my-video.srt" --out jobs/my-video/plan.captioned.json
```

The same command accepts a timed JSON or VTT source. Import and local transcription save the normalized transcript at `public/jobs/my-video/transcript.json`; use that path if you corrected the normalized transcript. Without `--out`, captions writes a sibling `.captioned.json` plan. Continue with that captioned plan. Reimport after changing cuts; retain phrase timing when word timings do not exist. When correcting a word-timed caption, keep its full `text` consistent with the corrected entries in `words`.

## 5. Validate and review a draft

```sh
node scripts/editor.mjs validate jobs/my-video/plan.captioned.json
npm run typecheck
node scripts/editor.mjs storyboard jobs/my-video/plan.captioned.json
node scripts/editor.mjs render jobs/my-video/plan.captioned.json --draft
```

The storyboard contains `storyboard.html`, contact-sheet images, stills, and JSON/QA files in its printed output directory. It samples one frame around 55% into each beat; it does not automatically inspect every transition or animation extremum. Inspect it before the draft, especially at phone size, then use draft playback or additional extracted frames for those other moments. Watch and listen to the draft using an available playback surface. Follow [review criteria](REVIEW.md). Fix material problems and recheck affected parts.

`npm run studio` opens the Remotion development preview; consult the current composition/props setup for loading a job. A successful preview is not a completed MP4 render.

## 6. Export and retain the work

```sh
node scripts/editor.mjs render jobs/my-video/plan.captioned.json
```

By default, output goes to `renders/<plan-stem>-<UTC-timestamp>/`. It contains `final.mp4`, the rendered `edit-plan.json`, and `qa.json`. A draft is named `draft.mp4`. `--out <directory>` selects a destination for render or storyboard; the directory must be new or empty, so earlier output is not silently overwritten.

Check the actual final output and save `jobs/my-video/review.md` with completed checks and limitations. Append the completed edit's choices and actual feedback to `corpus/edit-history.jsonl`. Deliver the MP4 and editable plan with a concise summary. Never call a draft fully reviewed if only automated technical checks ran.
