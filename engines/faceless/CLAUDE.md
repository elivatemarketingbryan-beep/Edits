# AI Faceless Content: operating instructions

This folder turns a voiceover into a finished vertical video (1080×1920, 30 fps) starring a pixel-art sprite of the user, edited in one fixed house style: captions, motion graphics, B-roll cards, lip sync and sound design. The person using it is usually **not technical**. Talk to them plainly, do the technical work yourself, keep messages short, and never paste walls of logs at them.

## When the user says "go", "start", "begin", "help" or anything like it

Run `npm --prefix engine run status` and continue from the first step that isn't done. Tell the user in one or two sentences where they are and what happens next. Steps, in order:

### 1. Setup (once, automatic)
- If Node.js is missing or older than 22, tell them to install the LTS from https://nodejs.org, reopen Claude Code, and say "go" again. Nothing else works without it.
- Otherwise run `npm --prefix engine run setup` **in the background** (it downloads about 1 GB: engine packages, FFmpeg, the render browser and a speech model, which takes a few minutes). Say what it's doing, then move straight on to step 2 while it runs.
- If setup fails, read its last lines, fix what you can (rerun, network, a missing tool), and only then involve the user, with the exact one-line fix.

### 2. Their sprite (once)
Ask: **"Do you already have pixel-art sprite images of yourself, or should we make them now?"**
- **They have them:** have them drop the images into `sprite/raw` (run `open sprite/raw` on Mac or `explorer sprite\raw` on Windows to open the folder). Any names, PNG or JPG, any background is fine. Then go to "Prepare".
- **Make them:** walk them through `guides/make-your-sprite.md` **one prompt at a time**. Paste each prompt in a code block so it's easy to copy. Start with the master image (they upload a clear front-facing photo of their face to ChatGPT, or any image tool, and paste prompt 1), then the talking mouth, then the gestures. Remind them to save each result with the suggested file name into `sprite/raw`.
  - **If a Higgsfield connector is available in this session** (tools for image generation and media upload from Higgsfield), offer to do it for them: get their photo (a file path they give you), upload it, generate the master with prompt 1 using the photo as the reference image, show it, iterate until they approve, then generate each edit from the approved master and save every result into `sprite/raw` with the right file name. Confirm before spending credits on more than the master.
  - Only `idle-neutral` and `idle-talk` are required to start. Gestures make the videos better; encourage them, but don't block on them.
- **Prepare:** run `npm --prefix engine run sprite`, then Read `sprite/preview.png` yourself. Check: same character in every image, clean edges, no background left, the talking mouth visibly open, nothing cropped. If an image is off, say which prompt to rerun and why. When it's good, show them the preview (send the file) and say it's done for good. They never repeat this step unless they want a new look.
- If they attach images directly in the chat instead of using the folder, ask them to drag the files into `sprite/raw` (or paste the file paths) so the engine can read them.

### 3. Their voice
Once, before their first video, recommend this in two or three sentences (no step-by-step guide needed):
- **Best:** clone their voice in ElevenLabs (Instant Voice Clone from a 1 to 3 minute recording), then generate every voiceover with the **Eleven v4** model using that clone. They write a script, paste it in, download the MP3, done. They never have to record again.
- **Otherwise:** record on their phone in a quiet room, close to the mic, and send the file.
- If an ElevenLabs connector is available in this session and they give you a script, you can generate the voiceover for them with their cloned voice (list voices, pick theirs, generate, save the file into `voiceovers/`).
- Optional, once: ask for their name, handle and usual CTA keyword and save them to `brand.json` (`{ "name": "", "handle": "@", "ctaKeyword": "", "accent": "#E5322B", "room": "sage" }`). Built posts use this handle. All fields are optional.

Then say: **"Whenever you're ready, attach a voiceover (or drop it in the voiceovers folder) and say 'make the video'."**

## Making a video

When they hand you a voiceover (attached path, a file in `voiceovers/`, or "use the latest one"):

1. `npm --prefix engine run new -- "<voiceover path>" [--name short-slug]`
   This tightens pauses (like the reference's jump-cut pacing), levels the audio, transcribes it and writes `videos/<slug>/brief.md`. If they want their natural pauses kept, add `--keep-pauses`.
2. Read `engine/docs/planning.md` (every time, it's the editing grammar) and `engine/docs/pages.md`. Read `videos/<slug>/brief.md`.
3. Decide the B-roll. If the script names real products or sites, capture them (`npm --prefix engine run capture -- <url> <slug> --name <shot>`) and **look at each capture** before using it. Otherwise build pages with specific, believable content for this topic.
4. Write `videos/<slug>/plan.json` following planning.md.
5. `npm --prefix engine run make -- <slug>`. It builds, checks, renders `videos/<slug>/<slug>.mp4` and writes a contact sheet. If it reports plan problems or lint errors, fix plan.json and rerun. Don't ask the user about technical errors.
6. Read the contact sheet `videos/<slug>/.work/frames.jpg` once as a technical sanity check (nothing blank, nothing overlapping, text readable). Fix real breakage. **Do not run critique or review passes, and do not spawn reviewer agents**: the user reviews the video themselves.
7. Send the MP4 to the user. Tell them in one or two lines what's in it, and that they can ask for any change.

Renders take roughly 1 second per second of video. Run long renders in the background.

### Changes
They'll say things like "make the intro punchier", "use a chart instead", "a darker red", "slower captions". Edit `plan.json` (or `brand.json` for global taste), rerun `make`, send the new file. To reshuffle the automatic choices (colours, poses, music chords) without changing the plan, set a new `"seed"`. To start over, run `new` again with a new `--name`.

## Rules
- Never touch `engine/` code to make one video work. If you genuinely find an engine bug, fix it carefully and say so.
- Keep every video different (planning.md section 9) while keeping the grammar identical.
- Never invent quotes, posts, reviews or articles attributed to real people or real publications. Real sources get real captures or the user's own screenshots.
- Everything must render offline from the files in the video's folder. Don't add CDN scripts or web fonts.
- The HyperFrames skills in `.claude/skills` are reference material for the engine (its composition format, CLI and media tools). **For making videos in this project, this file and `engine/docs/` take precedence over them.** In particular: render when asked to make the video (no preview-approval loop), don't install skills globally, and don't run `npx hyperframes init` here.
- To share the project with others, run `npm --prefix engine run package`. It writes a clean zip without their sprite, voiceovers or videos.

## Where things are
- `sprite/raw` holds the user's images and `sprite/poses` the cleaned, aligned poses. `sprite/sprite.json` is the manifest and `sprite/preview.png` the contact sheet.
- `videos/<slug>/` holds `brief.md`, `plan.json`, `words.json`, `mouth.json`, the HyperFrames project (`index.html`, `compositions/`, `assets/`) and the MP4.
- `engine/docs/planning.md` is the editing grammar and plan format, `engine/docs/pages.md` the B-roll page kinds, `style/HOUSE_STYLE.md` the look (red palette, dot grid), and `style/STYLE_BIBLE.md` the measured reference the editing grammar comes from.
- `engine/scripts/` holds `setup`, `status`, `sprite` (prepare-sprite), `new` (new-video), `capture`, `build`, `render`, `make` and `package`, each run as `npm --prefix engine run <name>`.
