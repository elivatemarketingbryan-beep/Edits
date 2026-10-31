---
name: one-prompt-music-video
description: Make a full music video made 100% in code — no AI images, no AI video, no paid APIs — from any song, and optionally make the song itself for $0 on the user's own computer (ACE-Step 1.5, lyrics written with the user). Every shot literally illustrates the lyric being sung, every shot is a different motion-graphics technique (3D, shaders, particles, physics, fluids, reaction-diffusion, Fourier epicycles, voxel worlds, kinetic type…), a code-drawn mascot (CURSOR) dances on the beat and lip-syncs the vocal, and sound effects are synthesised from math. Renders a frame-exact 1080p MP4 with headless Chrome. Use whenever someone wants a music video, lyric video, visualiser or "one prompt music video" for a song, wants to make a song + video for $0, or asks for the ONE PROMPT / CURSOR / local-cut music video skill.
---

## Video Studio (read first; overrides the rest of this file)

Installed in Video Studio from a creator pack (2026-10-31). **This is not an editing style:** it makes a video
from scratch (motion graphics, lyric or music video), so it isn't in the studio's format list. Use it only when
Bryan asks for one by name. Its music model (ACE-Step 1.5) needs ~15 GB of disk and ~10 GB free while running:
check the space and ask before installing. Windows Git Bash rules from `CLAUDE.md` apply (`python`, short-path
drive mapping). Brand colours from `styles/brand.json`. Never publish anything.


# ONE PROMPT — music video from code

`SKILL` = the folder this file is in. The bundled example `examples/one-prompt/` is the real 2:45 "ONE PROMPT —
LOCAL CUT" (88 finished shots, built by this exact pipeline): it is the quality bar and the code to learn from.

**How it works.** A project is a small web app (`engine/`): one 1920×1080 canvas, every frame a pure function of
track time `t`, scenes in `src/scenes/<group>/<ID>.js`, timing + intent in `src/shots.js`, audio features in
`data/audio.json`. `tools/capture.mjs` drives headless Chrome to render exact frames in parallel → MP4.

**Cost: $0.** Only free, local tools: Node.js 22+, ffmpeg, Google Chrome, Python (via `uv`). Songs come from
ACE-Step 1.5 (MIT) on the user's machine. The only "cost" is Claude usage: a full 2–3 minute video with parallel
builders used about 15–20% of a Max plan's weekly allowance; a 30–60 s video is a fraction of that. Say so up front.

## 0. First use on a machine
`bash SKILL/scripts/setup.sh` until it prints **All set** (installs `uv` and builds `~/.one-prompt-mv/venv` with
numpy/scipy/librosa/faster-whisper/demucs — no admin rights). Install anything it reports missing the free,
official way (ask before anything that needs a password). `bash SKILL/scripts/selftest.sh` must print
**SELFTEST PASSED**; look at the contact sheet it names. Songs are optional: `bash SKILL/scripts/song/install_acestep.sh`
only when the user wants a $0 song (Apple Silicon 16 GB+ or NVIDIA 6 GB+ VRAM; ~15 GB disk incl. models).

## 1. Intake — ask in ONE message, numbered, each with its default (skip what they already said)
Read `references/intake.md`. Song (their file / make one $0 / write the lyrics with them) · topic & message ·
character (CURSOR default, or describe theirs) · look (the ten "worlds" or their brand colours) · length (full song or
a 30–60 s cut) · format (16:9 YouTube default) · sound effects on/off · anything that must appear. Wait for answers.
"Just go" = defaults. Write the answers to `<project>/BRIEF.md`.

## 2. The song
- **They have one:** use it as-is. Ask for the lyrics text (or let Whisper transcribe them in step 3).
- **$0 song:** follow `references/song.md`: write lyrics + a ≤512-char caption with them, `make_song.sh` 4 takes,
  `pick_take.py` ranks takes by intelligibility, they listen to the top two and choose. ~2 min per take on an M-series
  Mac after the first-run model download (~10 GB).

## 3. Project + audio analysis
```bash
P=$(bash SKILL/scripts/new_project.sh <short-name>)            # → ~/music-videos/<short-name>
~/.one-prompt-mv/venv/bin/python SKILL/scripts/analyze.py --song <song.mp3|wav> --lyrics <lyrics.txt|LYRICS.md> --project "$P" [--bpm 100]
```
It writes `data/audio.json` (beats, downbeats, kick/snare/hat/perc hits, spectra, lip-sync vowel shapes, lyric word
times), `data/lyrics_timing.txt` and `review/audio_map.png`. **Check the lyric timing**: read `lyrics_timing.txt` +
look at `audio_map.png`. Lines in sparse intros/outros or ad-libs can be off; for a doubtful line run
`~/.one-prompt-mv/venv/bin/python SKILL/scripts/heard.py "$P/data/vocals.wav" <start> <end>` and fix the times in
`data/audio.json` (lyrics[].words[].t, start, end). Set the title / HUD text in `src/project.js`.

## 4. Storyboard — the shot list, then ONE confirmation
Follow `references/storyboard.md`. Write `src/shots.js`: a shot for every lyric phrase (a cut every ~1–2.5 s), each
shot = a literal picture of its words + its own technique + a big moment on the key word, sections in different colour
worlds, CURSOR where it helps. Assign shots to groups of ~8–10 (one builder per group). Show the user the shot list as
a compact table (time · lyric · what we see · technique) and ask **"Build it?"**. Then
`node tools/gen_placeholders.mjs` (in the project) creates a placeholder file per shot.

## 5. Build
- Read `references/builders.md` (copied into the project as `BUILDERS.md`) — the contract every scene follows.
- **Short video or few shots:** build the scenes yourself, group by group.
- **Full song:** launch one builder subagent per group IN PARALLEL (Agent tool, one message), each with this brief:
  > You are a senior motion designer AND creative coder building part of a music video made 100% in code. Project:
  > `<P>`. Read BUILDERS.md, src/shots.js (your shots, neighbours, WORLDS), skim src/core/*.js and 2–3 scenes in
  > `SKILL/examples/one-prompt/src/scenes/`. YOUR GROUP: <g> — shots <IDs> (<world>, <start>–<end> s). Highlights to
  > nail: <1 line per tricky shot>. Only touch src/scenes/<g>/ and review/<g>/. Render contact sheets, LOOK at them,
  > do at least two improvement passes, run `node tools/capture.mjs check "<IDs>"`. Final message: a short per-shot report.
- You (the lead) build the intro hook yourself while they work — the first 3 seconds must stop the scroll.

## 6. Review, sound, render, deliver
Follow `references/review.md`: contact sheets of every shot (`node tools/capture.mjs scenes review/all.jpg all 4 0.2`),
fix or re-brief anything weak, `check` for errors. Sound effects: `node tools/capture.mjs cues data/cues.json` then
`~/.one-prompt-mv/venv/bin/python tools/sfx.py data/cues.json` → `data/mix.wav`. Render:
`AUDIO=data/mix.wav node tools/capture.mjs video renders/<name>.mp4 0 end 6 --audio` (a 2:45 video ≈ 7 min on an
M-series Mac). Verify frames/duration, scan for black frames, open it for the user. Deliver: main MP4, a song-only
version, a smaller share copy, and tell them how to preview/edit (`python3 -m http.server 8137` → `?scene=ID`).

## Rules
- 100% code: never use AI image/video generators in this skill. Never draw real brand logos or real people.
- Everything deterministic (no Math.random / Date.now in scenes) — frames render out of order in parallel.
- Bright by default; dark only where the storyboard says so. Constant motion; a hit on every beat; nothing static > 0.4 s.
- Keep everything inside `~/music-videos/`, `~/.one-prompt-mv/` and this skill folder.
