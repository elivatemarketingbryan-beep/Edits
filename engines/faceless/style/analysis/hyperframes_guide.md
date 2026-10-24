# HyperFrames field guide for the sprite short-form project

What this guide is based on: HyperFrames CLI `hyperframes@0.8.185` (latest on npm on 2026-10-21) and repo `heygen-com/hyperframes` at commit `4371981b` (2026-10-21). Everything marked **[verified]** was run on this Mac (Apple M3 Pro, 11 cores, 18 GB, Node 24.20.0, npm 11.19.0). Everything marked **[docs]** comes from the official skills or docs and was not exercised. **[untested]** marks my own inference.

The working proof of concept is in `scratchpad/hf_lab/poc`. It renders and was checked frame by frame.

---

## 0. The short version

- A video is plain HTML. The root `index.html` has a `#root` with `data-composition-id`, `data-duration`, `data-width` and `data-height`. It mounts one sub-composition per layer (`compositions/*.html`, wrapped in `<template>`). Each composition registers one paused GSAP timeline at `window.__timelines["<id>"]`. The renderer seeks that timeline frame by frame in headless Chrome and encodes the result with FFmpeg.
- Timing lives in attributes: `class="clip" data-start data-duration` for visuals, and `<audio id data-start data-media-start data-duration data-volume>` for sound. Audio is mixed automatically. Never call `play()` or `pause()`.
- Render speed on this Mac **[verified]**:
  - 30 s at 1080×1920 / 30 fps took **26 s**: `setup 6.5 s · capture 14.1 s · encode 3.9 s`, with 5 workers chosen automatically.
  - 6 s took 7.6–9.7 s.
  - Check takes about 3.5 s. A snapshot takes about 3.5 s.
- FFmpeg:
  - HyperFrames looks for FFmpeg in this order: the `HYPERFRAMES_FFMPEG_PATH` env var, then `PATH`, then `<cwd>/.hyperframes/bin/ffmpeg`, then the Homebrew and system dirs, then the npm package `@ffmpeg-installer/ffmpeg`. FFprobe is found the same way (`HYPERFRAMES_FFPROBE_PATH`, …, `@ffprobe-installer/ffprobe`).
  - **The `@ffmpeg-installer/ffmpeg` binary (FFmpeg 4.4) fails the audio mix stage**. Use FFmpeg 6.0 or newer: `ffmpeg-static` gives 6.0 and imageio-ffmpeg gives 7.1, and both worked.
  - FFprobe 4.4.1 from `@ffprobe-installer/ffprobe` is fine.
- Skills can be project-local:
  - `npx skills add heygen-com/hyperframes --skill hyperframes --skill hyperframes-cli --skill hyperframes-registry --skill media-use --agent claude-code --copy --full-depth --yes`, run in the project root, writes only `./.claude/skills/<4 skills>` and `./skills-lock.json` **[verified]**.
  - `npx hyperframes skills update` and a plain `npx hyperframes init` both install **globally** (`~/.claude/skills`, `~/.agents/skills`). Set `HYPERFRAMES_SKIP_SKILLS=1` to stop that.

---

## 1. Environment and setup (what a downloader needs)

### 1.1 Requirements

| Need | How HyperFrames gets it | Notes |
|---|---|---|
| Node.js ≥ 22 | user installs | The CLI refuses older versions (`runtimeVersionError`). |
| HyperFrames CLI | `npx hyperframes@0.8.185 …`, or a local `npm install hyperframes` | A scaffolded project pins the exact version in its `package.json` scripts. |
| Chrome | `chrome-headless-shell` 152, downloaded on first need to `~/.cache/hyperframes/chrome/` (193 MB) | `npx hyperframes browser ensure` downloads it ahead of time. `doctor --json` reports it. |
| FFmpeg ≥ 6 with libx264 | see §1.2 | The render refuses a build with no libx264 and no GPU H.264 encoder. If the build lacks the `psnr` filter, the engine drops to a slower capture path. |
| FFprobe | see §1.2 | Required for probing media. |
| Network on first render | Google Fonts faces are fetched and cached at `~/.cache/hyperframes/fonts/`, and CDN `<script src>` files are downloaded and inlined | Ship fonts and GSAP inside the project to render offline (§6, §7). |

### 1.2 FFmpeg and FFprobe resolution [verified from source + runs]

The code is in `packages/parsers/src/ffBinaries.ts`. `findFfBinary(name)` tries these in order:

1. The env var `HYPERFRAMES_FFMPEG_PATH` or `HYPERFRAMES_FFPROBE_PATH`, re-read on every call.
2. `which ffmpeg`, then a scan of `PATH`. On Windows it scans the current directory, then `PATH` with `PATHEXT`.
3. **The project-local `<cwd>/.hyperframes/bin/ffmpeg`** (`ffmpeg.exe` on Windows). The CLI must be run from the project dir.
4. `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin` and `/snap/bin`. These are skipped on Windows.
5. `@ffmpeg-installer/ffmpeg` or `@ffprobe-installer/ffprobe` resolved from `<cwd>/package.json`. Node resolution walks up through parent `node_modules`.

Tests on this machine:

| Binary | Version | Result |
|---|---|---|
| imageio-ffmpeg `ffmpeg-macos-aarch64-v7.1` (pip) | 7.1, libx264, psnr | **Render OK.** No ffprobe is included. |
| `ffmpeg-static@5.3.0` (npm) | 6.0, libx264, psnr | **Render OK** (8.0 s for the 6 s POC). No ffprobe. HyperFrames does not auto-detect this package, so point to it with the env var or `.hyperframes/bin/ffmpeg`. |
| `@ffmpeg-installer/ffmpeg` (npm, darwin-arm64) | **4.4** | **Render FAILED**: `audio_processing_failed … Error parsing bitstream filter sequence 'setts=duration=…': Option not found`. No MP4 is written. Even so, `doctor` reports it as OK. |
| `@ffprobe-installer/ffprobe` (npm) | 4.4.1 | Works for every probe. Auto-detected through rule 5. |
| `.hyperframes/bin/ffmpeg` symlink to ffmpeg-static | 6.0 | `doctor` found it at rule 3. |

**Recommended for non-technical Mac and Windows users [partly untested on Windows]:** a project `package.json` plus a tiny setup script, so FFmpeg comes from npm and lands in `.hyperframes/bin`:

```json
{
  "private": true,
  "type": "module",
  "devDependencies": {
    "hyperframes": "0.8.185",
    "ffmpeg-static": "5.3.0",
    "@ffprobe-installer/ffprobe": "2.1.2",
    "gsap": "3.14.2"
  },
  "scripts": {
    "setup": "npm install && node scripts/link-ffmpeg.mjs && npx hyperframes browser ensure && npx hyperframes doctor"
  }
}
```

```js
// scripts/link-ffmpeg.mjs: copy (not symlink: Windows symlinks need admin) ffmpeg-static into .hyperframes/bin
import { copyFileSync, mkdirSync, chmodSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
const ffmpeg = createRequire(import.meta.url)("ffmpeg-static"); // absolute path, or null
if (!ffmpeg || !existsSync(ffmpeg)) throw new Error("ffmpeg-static binary missing: run `npm rebuild ffmpeg-static`");
mkdirSync(".hyperframes/bin", { recursive: true });
const out = `.hyperframes/bin/${process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg"}`;
copyFileSync(ffmpeg, out);
if (process.platform !== "win32") chmodSync(out, 0o755);
```

- npm 11.19 printed `install-scripts … not yet covered by allowScripts` for `ffmpeg-static` (it downloads its binary in `install`). The scripts **still ran** in 11.19 and the 45 MB binary arrived. A future npm that enforces allowScripts would skip the download. The script above fails loudly when that happens. The fix then is `npm install-scripts approve ffmpeg-static`, or `npm rebuild ffmpeg-static`.
- Fallbacks are the CLI's own hints: `brew install ffmpeg` on macOS, and `winget install --id Gyan.FFmpeg -e` on Windows. imageio-ffmpeg from pip has no ffprobe, so it always needs a separate ffprobe.
- For my own tests I symlinked `scratchpad/hf_lab/bin/ffmpeg` to the imageio binary and prepended it to `PATH`. FFprobe came from `scratchpad/hf_lab/node_modules/@ffprobe-installer/darwin-arm64/ffprobe` through rule 5.

### 1.3 Skills inside the project (Claude Code) [verified]

```bash
# run once, in the project root, when preparing the downloadable folder
DO_NOT_TRACK=1 npx --yes skills add heygen-com/hyperframes \
  --skill hyperframes --skill hyperframes-cli --skill hyperframes-registry --skill media-use \
  --agent claude-code --copy --full-depth --yes
```

- This writes `./.claude/skills/{hyperframes,hyperframes-cli,hyperframes-registry,media-use}/`: 77 + 13 + 13 + 116 files, 3.6 MB, byte-identical to the repo's `skills/`. It also writes `./skills-lock.json` (source, path and hash per skill).
- I checked that nothing else was touched: the mtime of `~/.claude/skills` was unchanged, and `~/.agents` was not created. Tested in `scratchpad/hf_lab/skilltest`.
- Simplest distribution: **commit the `.claude/skills/` folder into the project zip.** The skills are Apache-2.0, so ship the LICENSE. Claude Code reads project `.claude/skills/*/SKILL.md` when the folder opens. `skills-lock.json` lets someone refresh later with `npx skills experimental_install`, or by re-running the add command.
- Two traps:
  - `npx hyperframes skills update` always installs with `--global --agent claude-code universal --copy` (from `commands/skills.ts`), which writes to `~/.claude/skills` and `~/.agents/skills`.
  - `npx hyperframes init` refreshes the skills globally too, unless `HYPERFRAMES_SKIP_SKILLS=1` is set. With that variable set, `skills update` and bare `skills` exit 0 and do nothing. Put it in the project's `.claude/settings.json` **[untested]**: `{"env": {"HYPERFRAMES_SKIP_SKILLS": "1", "HYPERFRAMES_NO_TELEMETRY": "1"}}`.
- Plugin alternative **[docs]**: `claude plugin marketplace add heygen-com/hyperframes && claude plugin install hyperframes@hyperframes`. This is user scope, and the skill is exposed as `/hyperframes:hyperframes`. A plugin install replaces `npx hyperframes` with `node <PLUGIN_ROOT>/skills/hyperframes/scripts/plugin-cli.mjs <cmd>` (`references/plugin-installation.md`). Project-wide plugin enablement is left to Claude's plugin docs **[untested]**.
- The skills assume an interactive loop: preview first, then render "when the person approves". This project's own CLAUDE.md or skill should override that and say "render when asked to create the video".

### 1.4 Telemetry and other env vars [verified names, from source]

| Variable | Effect |
|---|---|
| `HYPERFRAMES_NO_TELEMETRY=1` (or `DO_NOT_TRACK=1`) | Turns off the CLI's anonymous telemetry. |
| `HYPERFRAMES_SKIP_SKILLS=1` | Stops `init` and `skills update` from installing skills globally. |
| `HYPERFRAMES_FFMPEG_PATH`, `HYPERFRAMES_FFPROBE_PATH` | Explicit binaries. |
| `HYPERFRAMES_WHISPER_PATH` | A whisper.cpp `whisper-cli` binary. |
| `HYPERFRAMES_TRANSCRIBE_TIMEOUT_MS` | Whisper timeout. |
| `HYPERFRAMES_RENDER_DETACHED=1` | Detached render, for renders longer than a tool timeout **[docs]**. |

---

## 2. Project layout (the POC)

```
scratchpad/hf_lab/poc/
  build_poc.py              generator: data/words.json -> index.html + compositions/*.html  (python3 build_poc.py [seconds])
  index.html                root: background, 4 scene hosts, 3 <audio>
  compositions/sprite.html  pixel sprite + mouth-swap schedule + punch-in
  compositions/title.html   title line + highlight box wipe
  compositions/card.html    browser-window card (expo.out scale-in) + outline ring wipe
  compositions/captions.html  9 caption groups, per-word blur-in   (data-track-kind="captions")
  assets/vo.mp3             copy of "Kyle Sprite Voiceover.mp3" (31.95 s, 44.1 kHz mono)
  assets/sprite/kyle-idle-{neutral,talk}.png
  assets/sfx/{pop,whoosh}.mp3   (from skills/media-use/audio/assets/sfx, bundled library)
  assets/vendor/gsap.min.js     (gsap 3.14.2, vendored)
  assets/fonts/JetBrainsMono-700.woff2  (local @font-face test, family "PocMono")
  data/words.json           word timings [{w,s,e}] for the VO
  hyperframes.json          registry/paths config (copied from `init`)
  renders/poc.mp4           6 s, verified; poc_30s.mp4 (30 s), poc_draft.mp4, poc_ffstatic.mp4, poc_30s_delivery.mp4
  renders/frames/*.png      the frames I inspected
```

Folders the CLI writes and you can ignore:

- `.hyperframes/` holds history, check reports, snapshots and the render-output ledger. The skill says never to delete it.
- `.thumbnails/` and `.waveform-cache/` come from preview.

---

## 3. The composition contract (exact, rendering skeletons)

### 3.1 Root `index.html` (verbatim from the POC)

```html
<!doctype html>
<html lang="en" data-resolution="portrait">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <script src="assets/vendor/gsap.min.js"></script>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: 1080px; height: 1920px; overflow: hidden; background: #e9eef1; }
      #root { position: relative; width: 1080px; height: 1920px; overflow: hidden; }
      #bg { position: absolute; inset: 0; z-index: 0;
        background: radial-gradient(120% 80% at 50% 20%, #f4f5f1 0%, #dfe9ef 55%, #c5d6df 100%); }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="6"
         data-width="1080" data-height="1920">
      <div id="bg"></div>
      <div id="sprite" data-composition-id="sprite" data-composition-src="compositions/sprite.html"
           data-start="0" data-duration="6" data-track-index="1"
           data-track-kind="graphics" data-width="1080" data-height="1920" style="z-index: 2"></div>
      <div id="title" data-composition-id="title" data-composition-src="compositions/title.html"
           data-start="0" data-duration="6" data-track-index="2"
           data-track-kind="graphics" data-width="1080" data-height="1920" style="z-index: 3"></div>
      <div id="card" data-composition-id="card" data-composition-src="compositions/card.html"
           data-start="2.5333" data-duration="3.4667" data-track-index="3"
           data-track-kind="graphics" data-width="1080" data-height="1920" style="z-index: 4"></div>
      <div id="captions" data-composition-id="captions" data-composition-src="compositions/captions.html"
           data-start="0" data-duration="6" data-track-index="4"
           data-track-kind="captions" data-width="1080" data-height="1920" style="z-index: 5"></div>

      <audio id="vo" src="assets/vo.mp3" data-start="0" data-media-start="0" data-duration="6"
             data-track-index="10" data-volume="1" data-fade-out="0.12"></audio>
      <audio id="sfx-pop" src="assets/sfx/pop.mp3" data-start="1.08" data-track-index="11" data-volume="0.45"></audio>
      <audio id="sfx-whoosh" src="assets/sfx/whoosh.mp3" data-start="2.405" data-track-index="12" data-volume="0.35"></audio>
    </div>
    <script>
      window.__timelines = window.__timelines || {};
      window.__timelines["main"] = gsap.timeline({ paused: true });
    </script>
  </body>
</html>
```

### 3.2 Scene file `compositions/<id>.html` (pattern from the POC)

```html
<template>
  <style>
    #root { position: absolute; inset: 0; }          /* style the scene root as #root, never by class */
    #title-box { padding: 4px 26px 10px; background: #0a84ff; clip-path: inset(0% 100% 0% 0%); }
  </style>
  <div id="root" data-composition-id="title" data-width="1080" data-height="1920">
    <div id="title-box"><span id="title-box-text">Motion Designers</span></div>
  </div>
  <script>
    (function () {
      const FPS = 30; const T = (f) => f / FPS; const S = (f) => Math.max(0, (f - 0.5) / FPS);
      const tl = gsap.timeline({ paused: true });
      tl.fromTo("#title-box", { clipPath: "inset(0% 100% 0% 0%)" },
        { clipPath: "inset(0% 0% 0% 0%)", duration: 0.32, ease: "power3.out" }, T(35));
      window.__timelines = window.__timelines || {};
      window.__timelines["title"] = tl;               // key == data-composition-id of host AND scene root
    })();
  </script>
</template>
```

Rules the POC follows. Breaking any of them either fails lint or produced a bug.

1. The host `data-composition-id`, the scene root `data-composition-id` and the `__timelines` key are identical. If they differ, every render waits 45 s per scene, then shows static frames **[docs]**.
2. Everything in a scene file sits inside `<template>`. Styles and scripts outside it are dropped. The scene root uses `inset: 0`, never hard-coded pixel sizes.
3. Sub-compositions do **not** load GSAP. They inherit it from the root page **[verified]**. Lint allows this for `<template>` files.
4. A scene's clock starts at 0 at its host's `data-start`. The card scene starts its entrance at `0`, and the ring wipe at `T(114 - 76)` **[verified]**.
5. Ids must be unique across the assembled page, so prefix them (`cap-w3-1`, `card-ring`, `sprite-mouth-open`).
6. Use `fromTo`, not `from`, inside scenes. The host re-seeks the scene, and `from` drifts on seek-back **[docs]**.
7. Never `add()` a scene timeline to the root timeline. The runtime drives each one itself **[docs]**.
8. Asset paths are root-relative (`assets/...`), even inside `compositions/` **[verified]**.

### 3.3 Attributes in use

| Attribute | On | Meaning |
|---|---|---|
| `data-composition-id`, `data-width`, `data-height`, `data-start="0"`, `data-duration` | root | `data-duration` is the render length. Overruns are cut. A variable cannot change it. Max 24 h (`MAX_RENDER_DURATION_SECONDS = 86400`). |
| `class="clip"`, `data-start`, `data-duration` | timed DOM or `<img>` | Visible over `[start, start + duration)`. An end state that lands exactly on the end is never rendered. |
| `data-track-index` | any timed element | Studio lane only. Paint order is CSS `z-index`. |
| `data-track-kind="graphics"\|"captions"` | scene hosts | Studio track type. Exactly one host holds every caption. |
| `data-composition-src` | host div | Scene file to mount. |
| `data-media-start` | `<audio>`, `<video>` | Offset into the source (trim). **The audio mixer reads only this name** **[docs]**. Use `data-playback-start` on composition hosts. |
| `data-volume` | media | Gain: 1 = 0 dB, up to 3.98 = +12 dB. |
| `data-fade-in`, `data-fade-out` | media | Linear edge fades in seconds. |
| `data-playback-rate` | media | 0.1–10, pitch preserved. |
| `data-automation` | media | JSON volume, rate or fx lanes; `t` is in clip seconds. |
| `data-fx-chain` | media | Web Audio effects chain. |
| `data-audio-group` + `<hf-audio-group>` | media | Submix bus. |
| `data-has-audio="true"` or `muted` | `<video>` | One of the two is mandatory (lint `video_missing_muted`). |
| `data-no-timeline` | root or host with no timeline | Otherwise the render waits 45 s (`player-ready-timeout`). |
| `data-layout-allow-overflow`, `-overlap`, `-occlusion`, `-caption-zone`, `data-layout-ignore` | elements | Opt-outs for the `check` layout audit. |
| `data-composition-variables` (on `<html>`), `data-var-text`, `data-var-src`, `var(--id)` | | Studio-editable variables. `render --variables '{...}'` overrides them. |
| `data-start="otherId + 0.5"` | timed elements | Relative timing. A typo silently resolves to 0. |

---

## 4. Timeline API and determinism

- `const tl = gsap.timeline({ paused: true }); …tweens…; window.__timelines["<id>"] = tl;` Register **last**. If the build is async (for example `document.fonts.load(...).then(...)`), register at the end of the callback. Otherwise lint fails with `gsap_timeline_registered_before_async_build`.
- Place every tween at an absolute time: `tl.fromTo(sel, from, to, seconds)`. Set start states inside the tween, not in a CSS `transform`; doing that fails lint (`gsap_css_transform_conflict`). A CSS `opacity: 0` or `clip-path` start state plus a `fromTo` is fine **[verified]**.
- Never tween `display`, `visibility` or `autoAlpha` on a `.clip`. Tweening its opacity, or animating a child, is OK. `tl.set(el, {visibility: "hidden"}, t)` is an instant flip and is allowed.
- Determinism bans `Date.now()`, unseeded `Math.random()` (use a seeded PRNG such as mulberry32), `requestAnimationFrame` or timers as a clock, fetches during render, and `repeat: -1`. Finite repeats are allowed: `Math.max(0, Math.floor(dur / cycle) - 1)`.
- For a canvas or a custom renderer, draw from `window.addEventListener("hf-seek", e => renderAt(e.detail.time))`.
- Frame time is `time = floor(frame) / fps` in integer math.
- Helpers the runtime provides: `window.__hyperframes.fitTextFontSize(text, {fontFamily, fontWeight, maxWidth})` returns `{fontSize}`; `window.__hyperframes.getVariables()`; and `window.__hyperframes.pretext`.
- **Frame-grid rule (bug I hit) [verified]:**
  - In v1 I rounded `tl.set` times to 4 decimals. A set at `0.2667` did not fire on frame 8 (8/30 = 0.26667) and showed one frame late. A zero-duration set fires on the first frame whose time is ≥ its position.
  - Fix: keep **frame indices** in the data, place tweens at `T(f) = f/FPS`, and place instant swaps at `S(f) = (f - 0.5)/FPS`.
  - The lint rule `gsap_timeline_set_initial_hide` also warns that a `tl.set` at exactly 0 may not render on frame 0, so write the frame-0 state in CSS. In the POC, the generator writes `#sprite-mouth-open { opacity: 1 }` because the VO starts speaking on frame 0.
- GSAP source:
  - Compositions load GSAP themselves. The `init` template uses `<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js">`, and the core's default CDN version is 3.15.0.
  - At **every render compile** the producer downloads each http(s) `<script src>` (15 s timeout) and inlines it. If the download fails it only warns and keeps the external tag.
  - **Vendor it instead** (`<script src="assets/vendor/gsap.min.js">`). Lint accepts any src containing "gsap" **[verified]**.

---

## 5. Media

### 5.1 Voiceover (a) [verified]

`<audio id="vo" src="assets/vo.mp3" data-start="0" data-media-start="0" data-duration="6" data-volume="1" data-fade-out="0.12">`

- This trims the 31.95 s file to 6 s with no re-encode of the source. The rendered audio track is AAC LC, 48 kHz stereo, about 192 kb/s, exactly 6.000 s long.
- Correlation between the rendered audio and the source is 0.99 at lag 0. Per-channel gain is 0.9986, so the VO plays at unity and mono becomes dual-mono.
- A separate 1 s test with `data-media-start="10"` matched source t = 10.000 s (correlation 0.9999). Trims from the middle of a file work.
- Every `<audio>` needs an `id`, or it is left out of the mix. No `crossorigin`.
- `<audio>` or `<video>` without `data-duration` plays its full length. Clamp the root `data-duration` to the media length (ffprobe), or the render ends in black.

### 5.2 Sound effects (f) [verified]

- Find where a file actually hits: `npx hyperframes audio assets/sfx/whoosh.mp3 --json` returns `items[0].moments.peak`.
  - whoosh: onset 0.123 s, peak **0.162 s**, tail end 0.367 s, −15.2 LUFS.
  - pop: peak **0.120 s**, −21.2 LUFS.
- Placement used: `data-start = picture_time + 1/30 - peak`, so the peak lands one frame after the picture.
  - pop at 1.080 for the box wipe at frame 35.
  - whoosh at 2.405 for the card at frame 76.
- The rendered mix minus the VO shows energy peaks at **1.19–1.21 s** (expected 1.200) and **2.55–2.58 s** (expected 2.567). The full render measured −16.8 LUFS integrated, −3.3 dBTP, and no clipping.
- `npx hyperframes audio --element '#sfx-pop' --json` analyses a placed clip. Its moments are in the file timebase.
- 21 bundled offline SFX live in `.claude/skills/media-use/audio/assets/sfx/` with `manifest.json` durations: whoosh 0.57 s, whoosh-short 0.57, pop 0.72, click 0.37, click-soft 0.37, riser 10.03, impact-bass-1 2.12, glitch-1 2.64, typing, key-press, ping 1.32, chime 2.5, notification 2.46, sparkle and others. Openverse CC0/CC-BY search through `media-use resolve --type sfx` **[docs]**. The skill guidance is volume about 0.35 under the voice, 2–3 rotated takes of a repeated sound, and every SFX tied to a visible cause.
- Mixing **[docs]**: preview and render run the same Web Audio graph. Overlapping clips simply sum. The tools are `data-volume`, fades, `data-automation` volume lanes (ducking a music bed to 0.3–0.4 under the voice; music under a voice at about 0.14), `data-fx-chain` (`highpass`, `peaking`, `compressor`, `limiter`, …) and `data-audio-group` buses. Never tween volume with GSAP on a track that already has `data-volume` or a lane. Targets for social are −16 to −14 LUFS and ≤ −1 dBTP; `npx hyperframes normalize-audio` helps reach them.

### 5.3 Pixel sprite (b) [verified]

- The sprite PNGs are 1254×1254 RGBA. Alpha is binary and the content bbox is x 410–881, y 88–1186. They are not on a clean pixel grid (35,482 unique colours, horizontal runs of 1 px), but nearest-neighbour scaling still keeps the blocky look.
- POC placement: the full 1254 canvas is shown at **1.5×** (1881 px box) at `left:-428px; top:1048px`, so the head sits at about y 1180–1560 (61–81% of H) and the sprite centre lands on x = 540. The body runs off the bottom of the frame, like a talking head.
- Use the **same box for every pose PNG**. The pack guarantees an identical canvas and registration across all 20 poses, so swaps never shift.
- Required CSS: `#sprite-rig img { image-rendering: pixelated; }`. The rendered edges are hard blocks with no smoothing; see `renders/frames/v3_150.png`.
- Mouth swap:
  - Both PNGs are stacked as `<img class="clip" data-start="0" data-duration="6">`, and `#sprite-mouth-open`'s opacity is flipped with `tl.set(..., S(frame))`.
  - Generator rule: open on a word's first frame, toggle every **4 frames** (about 7.5 Hz) while the word lasts, and close on its end frame. That gives 43 keys over 6 s and 207 over 30 s.
  - I classified the mouth region of all **180/180 rendered frames** as open or closed (dark-pixel count, crop 120×70 at (440, 1550)). **0 mismatches** against the schedule, including after the punch-in.
- Give the `<img>` elements explicit `data-start`/`data-duration`. An `<img>` without them is listed by `npx hyperframes timeline` as a **3 s clip** (`durationSource: "default"`). The render was unaffected in my test, but Studio edits would treat it as 3 s.
- Cut-style punch-in: `tl.set("#sprite-rig", {scale: 1.08}, S(114))` with a CSS `transform-origin`. Use transforms on a wrapper, never on `left`/`top`/`width`/`height`.
- An oversize rig raises `check` → `escaped_container`; silence it with `data-layout-allow-overflow` on the rig.

### 5.4 Video and images (for B-roll, screenshots) [docs]

```html
<video id="broll-1" class="clip" src="assets/broll.mp4" data-start="4" data-duration="3"
       data-media-start="12" data-track-index="0" muted playsinline></video>
<img id="shot-1" class="clip" src="assets/shot.png" data-start="4" data-duration="3" data-track-index="1">
```

- Time a `<video>` or its wrapper, never both. Animate a wrapper (`scale`, `x`, `y`, `clip-path`), never the media element's box.
- If footage has keyframes more than about 1 s apart it freezes on seek: re-encode with `-g 30`.
- HEVC, ProRes and AV1 get auto-proxied for preview (`hyperframes.json` → `media.autoProxy`).
- Grades and blur on footage go through `npx hyperframes media-treatment`, not CSS filters. CSS `filter: blur()` on text is fine and verified.

---

## 6. Fonts [verified]

- Families auto-resolved by name: Inter, Montserrat, Outfit, Nunito, Oswald, League Gothic, Archivo Black, Space Mono, IBM Plex Mono, JetBrains Mono, EB Garamond, Playfair Display, Source Code Pro, Noto Sans JP, Roboto, Open Sans, Lato and Poppins. System fonts (Helvetica, Arial, …) are swapped for the nearest of these.
  - "Bundled" still hit the network for the weights I used. The first compile logged `Fetched 11 font face(s) for "Inter" from Google Fonts (cached to ~/.cache/hyperframes/fonts/inter)` and `Fetched 8 … "Playfair Display"`. Later runs read the cache.
- **Any other family fails lint** (`font_family_without_font_face`, an error).
  - The compiler still fetched "Instrument Serif" from Google Fonts and rendered it. `render` continues despite lint errors unless you pass `--strict`.
  - Adding `@font-face { font-family:"Instrument Serif"; src:url("assets/fonts/InstrumentSerif-Italic.woff2") format("woff2"); font-weight:400; font-style:italic; }` gives lint 0/0 and renders correctly.
  - A family name that is not on the list (`PocMono` → `assets/fonts/JetBrainsMono-700.woff2`) also rendered in the POC.
- **Recommendation:** ship a `.woff2` for every family, weight and style the style guide uses, in `assets/fonts/`, with `@font-face` in the file that uses it. Renders are then offline and deterministic. Google woff2 files are available from `~/.cache/hyperframes/fonts/<slug>/<weight>-<style>-<hash>.woff2` after one compile.
- `hyperframes-localize-fonts` (a second bin in the `hyperframes` package) reads a **full HTML document** on stdin and writes it to stdout with every resolvable family embedded as `data:font/woff2` @font-face rules (fail-closed fetch). It also adds two `<meta name="hyperframes-font-*-version">` stamps.
  - On the font test page it went from 1,428 B to 172,716 B.
  - On a `<template>` fragment it added only the stamps.
- When text is measured from script, `await document.fonts.load('800 88px "Inter"', text)` first.
- Pitfall seen: Playfair Display italic numerals are **old-style** ("230" descends below the baseline). Add `font-variant-numeric: lining-nums;` for stats.

---

## 7. Captions (c) and transcription

### 7.1 Caption build used in the POC [verified]

- The generator groups up to 2 words, breaking on `, . ! ?` or a pause of 150 ms or more. That gave 9 groups for 6 s and 47 for 30 s.
- Each group is `<div id="cap-gN" class="clip cap-group" data-start=<first word frame> data-duration=<until next group, max last-word end + 0.35 s>>`, with one `<span class="w">` per word.
- Word entrance at the word's own start frame: `fromTo({opacity:0, filter:"blur(14px)", scale:0.86}, {opacity:1, filter:"blur(0px)", scale:1, duration:0.2, ease:"power3.out"})`. The group needs no exit tween because the clip window hides it on time. This is the timed-clip alternative to the skill's `tl.set(group, {opacity:0, visibility:"hidden"}, end)` hard kill.
- Style: absolute, full-width box at `top:1010px` (52.6% of H), height 130, flex-centred, `gap: 0 22px`, `overflow: visible`, Inter 800 at 88 px, `#1b1c1f`. Emphasis words use Playfair Display italic in `#0a7df2`.
  - The first try used `#0a84ff` on a `#e1eaef` background and got a `contrast_aa_failure` warning (2.99:1 against 3:1). `#0a7df2` passes.
- Observed behaviour: words that have not appeared yet still take their layout space, so the first word of a two-word group sits off-centre until its partner appears ("230 …" at x ≈ 317–457 of 1080 at 4.0 s). Decide per the reference: either keep this stable layout, or re-centre with one group per word.
- Frame 0: a word whose entrance starts at t = 0 is invisible on frame 0. Frame 0 is the thumbnail. Either have other text up already (the POC title is) or render the first word in its landed state.
- Skill rules: groups of 2–3 words for high energy, one group visible at a time, never `left:50%; transform:translateX(-50%)`, and size with `fitTextFontSize` (portrait `maxWidth` 900, base 78, min 42). Lint warns `timeline_track_too_dense` (9 clips on one track) for the caption scene; that is expected.
- Registry caption components to read before hand-building: `caption-highlight`, `caption-clip-wipe`, `caption-editorial-emphasis`, `caption-weight-shift`, `soft-blur-in` and `inline-highlight` (`npx hyperframes catalog --tag caption-style --json`, `npx hyperframes add <name>`).

### 7.2 Transcription [verified source + import; engines not run]

- `npx hyperframes transcribe <audio|video> [--engine auto|parakeet|whisper] [--model small.en|medium.en|large-v3|small …] [--language en] [--dir <out>] [--json] [--to srt|vtt]`.
- Engines:
  - **Parakeet** (sherpa-onnx), installed with `npx hyperframes models install parakeet`: the runtime comes from npm and the model (about 600 MB) goes to `~/.cache`. On macOS, parakeet-mlx at `~/.venvs/parakeet/bin/parakeet-mlx` is used if present. It is the "auto" choice when installed (6.05% vs 7.44% WER, 5–10× faster than whisper).
  - Otherwise **whisper.cpp** (`whisper-cli`). If it is missing, the CLI runs `brew install whisper-cpp`, or builds from source with git + cmake. Models go to `~/.cache/hyperframes/whisper/models`.
  - Neither was installed here (`doctor`: whisper-cpp "Not found (optional)").
  - Always pass `--model`: the default `small.en` **translates** non-English audio.
- Output: `transcript.json`, written to `--dir` (default: the input file's folder), as `[{"id":"w0","text":"Claude","start":0,"end":0.36}, …]`. Import also works: `npx hyperframes transcribe words-normalized.json --json` returned `{"ok":true,"format":"words-json","wordCount":93,"transcriptPath":".../transcript.json"}`, and `--to srt -o out.srt` produced phrase cues.
- **Hidden side effect:** after transcribing, `patchCaptionHtml(dir, words)` scans every `.html` under `--dir` recursively and replaces any `const script = [ … ];` or `const TRANSCRIPT = [ … ];` with the new words. Never use those variable names in generated HTML, or point `--dir` at a work folder.
- Practical choice for this project: the Python `faster-whisper` pipeline already on this machine produced `vo_words.json` (`{w,s,e}`). Convert it to `{id,text,start,end}` for HyperFrames tools. For a downloader, `hyperframes transcribe` with Parakeet or whisper.cpp needs no Python. Whatever the engine, drop hallucinated words in the final silence (`silencedetect=noise=-35dB:d=0.6`) and check that more than 80% are real words.

---

## 8. Motion recipes used in the POC (d, e) [verified in render]

| Effect | Code | Seen in frames |
|---|---|---|
| Browser card scale-in | `tl.fromTo("#card-inner",{opacity:0,scale:0.55,y:140},{opacity:1,scale:1,y:0,duration:0.7,ease:"expo.out"},0)` with `transform-origin: 50% 40%`; card is 940×600 at (70, 360), radius 26, border `4px #8fbfff`, shadow `0 30px 70px rgba(30,60,90,.22)` | f79 (3 frames, 0.1 s in): measured width about 778/940 px = **0.83** scale, matching expo.out at progress 0.143; still translucent. f99: settled. |
| Highlight box wipe | `#title-box{clip-path:inset(0% 100% 0% 0%)}`, then `fromTo(clipPath → "inset(0% 0% 0% 0%)", 0.32 s, power3.out)`; text blur-in 10 px→0 over 0.18 s, power2.out, 3 frames later | f36: box partly drawn, no text. f45: complete. |
| Outline ring wipe | `#card-ring{position:absolute; inset:-6px -4px; border:6px solid #0a84ff; border-radius:16px; clip-path: inset(0% 100% 0% 0%)}` → full, 0.28 s, power2.out | f116 |
| Per-word blur-in | §7.1 | f36 ("motion" blurred), f79 |
| Punch-in | `tl.set(rig,{scale:1.08},S(f))` | f116 vs f99 |

Use `clip-path: inset(...)` with percent units in both the from and the to values. GSAP interpolated `inset(0% 100% 0% 0%)` to `inset(0% 0% 0% 0%)` cleanly.

Before hand-building, check these registry items **[docs]**:

- `browser-device-stage`: a generic app surface in browser or window chrome.
- `inline-highlight` and `marker-highlight`: marker sweeps.
- `yt-camera-move`, `ui-focus-zoom` and `cursor-zoom-follow`: zooms and pans.
- `zoom-through-transition` and `transitions-*`: transitions.
- `soft-blur-in`: an entrance.

Commands: `npx hyperframes catalog --query "<english>" --json`, then `npx hyperframes add <name> --json`. `add` needs network. Blocks install to `compositions/<name>.html` and components to `compositions/components/<name>.html`.

---

## 9. CLI cookbook (run from the project dir)

```bash
export HYPERFRAMES_NO_TELEMETRY=1 HYPERFRAMES_SKIP_SKILLS=1
npx hyperframes doctor --json                 # always exits 0: gate on .ok; lists FFmpeg/FFprobe/Chrome paths
npx hyperframes browser ensure                # pre-download chrome-headless-shell
npx hyperframes init my-video --resolution portrait --non-interactive   # 1080x1920 blank; writes index.html, package.json (pinned), hyperframes.json, meta.json, CLAUDE.md, AGENTS.md
npx hyperframes lint                          # static contract
npx hyperframes check --json                  # gate: lint + runtime + layout + motion + contrast + craft (~3.5 s for the POC)
npx hyperframes timeline --json               # .timeline.tracks[].rows[] with absStart/absEnd/file/src/durationSource/warnings
npx hyperframes snapshot --at 0.5,2.7,4.0     # PNGs + contact-sheet.jpg in .hyperframes/artifacts/snapshots/<id>/ (~3.5 s)
npx hyperframes snapshot --range 2,4 --frames 8 | --composition card | --zoom '#card-ring' | --at 1,2 --against ref.mp4   # [docs]
npx hyperframes keyframes --json --selector '#card-inner'      # [docs] tween list (property, time, value, ease)
npx hyperframes audio <file|video> --json     # moments.peak, onsets, LUFS, true peak, silence
npx hyperframes preview --background --port 4567 [--no-open]   # Studio; URL http://localhost:4567/#project/<dir-name>; verified HTTP 200
npx hyperframes preview --status ; npx hyperframes preview --stop
npx hyperframes render --quality draft|looks|delivery --fps 30 --output renders/out.mp4 [--strict] [--workers N] [--crf N | --video-bitrate 10M] [--format mp4|webm|mov|gif|png-sequence]
npx hyperframes render --variables '{"title":"…"}'  |  --batch rows.json --output "renders/{name}.mp4"   # [docs]
npx hyperframes transcribe assets/vo.mp3 --model small.en --dir work/ --json
npx hyperframes catalog --query "word by word caption blur" --json    # verified (search); `add` [docs]
```

Render facts **[verified]**:

- The default output name is timestamped (`renders/<project>_<date>_<time>.mp4`), so always pass `--output`.
- Lint warnings do not block a render; `--strict` blocks on errors and `--strict-all` on warnings too.
- The render's second summary line holds the timings: `screenshot capture · hardware gpu · compile · setup · capture · encode`.

| Render (1080×1920, 30 fps) | Wall time | Stages | Output |
|---|---|---|---|
| 6 s, `--quality looks` | 7.6–9.7 s | setup 1.8–2.0 s, capture 4.4–5.8 s, encode 0.5–0.9 s | H.264 High, yuv420p, about 930 kb/s, plus AAC 48 kHz stereo 192 kb/s |
| 6 s, `draft` | 6.7 s | capture 3.8 s | H.264 Constrained Baseline, about 585 kb/s |
| 30 s, `looks` | 25.9 s | setup 6.5 s, capture 14.1 s, encode 3.9 s | 2.8 MB, about 584 kb/s |
| 30 s, `delivery` | 26.0 s | the same | 2.8 MB (no visible size change for this flat-colour content) |

- Workers default to "auto", which was 5 here. Each worker starts its own Chrome (about 256 MB). 60 fps doubles render time **[docs]**.
- Verify the output: ffprobe shows `nb_frames=180` and `duration=6.000000` for both streams **[verified]**.

---

## 10. How I verified (reuse these for the project's self-checks)

- **Frames:** `ffmpeg -i out.mp4 -vf "select=eq(n\,FRAME)" -frames:v 1 f.png`. This is frame-exact; `-ss` can be off by one. Read the PNGs and lay several out as a contact sheet with Pillow.
- **Mouth sync:** crop the mouth region for all frames (`-vf crop=120:70:440:1550 m_%03d.png`), count pixels with luma below 70, threshold at the mid value between min and max, and compare with the schedule. Result: 0 of 180 mismatched.
- **SFX timing:** decode the render and the source VO to mono float, fit the gain, subtract, and look for peaks in the RMS of the residual in 10 ms windows.
  - Do not downmix with `-ac 1` to compare levels. ffmpeg's stereo→mono downmix adds the two channels at −3 dB each, which reads as a false +3 dB. Use `pan=mono|c0=c0`.
- **Audio sanity:** `npx hyperframes audio renders/out.mp4 --only loudness,silence --json`.

---

## 11. Pitfalls I hit or confirmed, with fixes

1. **Global skill install by default.** `init` and `skills update` write to `~/.claude/skills` and `~/.agents/skills`. Fix: set `HYPERFRAMES_SKIP_SKILLS=1`, and use `npx skills add … --agent claude-code --copy` without `-g` (§1.3).
2. **FFmpeg 4.4 breaks the audio mix.** `@ffmpeg-installer/ffmpeg` fails with `setts … duration … Option not found`, so the render fails and writes no file, even though `doctor` says OK. Fix: use FFmpeg 6.0 or newer (ffmpeg-static 6.0, imageio 7.1 or Homebrew).
3. **No ffprobe** comes with imageio-ffmpeg or ffmpeg-static. Fix: add `@ffprobe-installer/ffprobe` to devDependencies; it is auto-found.
4. **`tl.set` one frame late** after rounding times to 4 decimals. Fix: keep frame indices and place swaps at `(f - 0.5)/fps`. Put frame-0 states in CSS.
5. **`<img>` without timing** shows as a 3 s clip in `timeline` and Studio. Fix: add explicit `data-start`/`data-duration`.
6. **`nested_structure_needs_subcomposition`** warnings when the root holds timed wrappers with children. Fix: give each layer its own sub-composition; the root keeps only the background, the hosts and `<audio>`.
7. **`escaped_container`** on the oversize sprite rig. Fix: `data-layout-allow-overflow`.
8. **`text_below_floor`.** `check` wants reading text of at least 28 px on a 1080-wide frame; the URL bar was 22.5 px. Fix: raise it to 28 px, or mark it `data-layout-ignore` if it is texture.
9. **`contrast_aa_failure`** for `#0a84ff` on the pale background (2.99:1). Fix: `#0a7df2`.
10. **A non-listed font family** fails lint even though the compiler can fetch it. Fix: a local `.woff2` and `@font-face`.
11. **A CDN GSAP** is re-downloaded at every compile. Fix: vendor it.
12. **`transcribe` rewrites** `const script = […]` and `const TRANSCRIPT = […]` in every `.html` under `--dir`. Fix: different variable names, or transcribe into `work/`.
13. **The 45 s stall:** a composition id with no registered timeline, or a host id that differs from the scene's. Fix: matching ids, or `data-no-timeline`.
14. **The first caption is invisible on frame 0** if its entrance starts at 0. Fix: plan frame 0 as the thumbnail (title or first word already landed).
15. **Caption groups reserve space** for words not yet shown, so the first word sits off-centre (§7.1). Fix: a deliberate choice.
16. **Playfair italic old-style numerals.** Fix: `font-variant-numeric: lining-nums`.
17. **`preview` opens the system browser by default.** Fix: `--no-open` for headless agent runs. Hand the user `http://localhost:<port>/#project/<dir>`; without the `#project/…` hash Studio opens empty **[docs]**.
18. **npm 11 `allowScripts` warning** for packages with install scripts (ffmpeg-static). The scripts still ran in npm 11.19. Fix: verify the binary exists after install (§1.2 script).

---

## 12. Skeleton of the real pipeline on top of this [recommendation, untested end to end]

1. Setup (once): `npm run setup`. That covers the npm deps, `.hyperframes/bin/ffmpeg`, Chrome and `doctor`. Skills ship in `.claude/skills`.
2. Words: transcribe the user's VO (`hyperframes transcribe --model small.en --dir work/`, or faster-whisper) to get `{id,text,start,end}`, then clean it (silence-tail hallucinations, punctuation).
3. Plan: an LLM writes a beat sheet: groups, emphasis words, card/screenshot beats, pose per beat (present-left/right, point, thinking, …), punch-ins and SFX cues, all expressed as **frame indices**.
4. Generate: a deterministic generator, as in `build_poc.py`, writes `index.html`, `compositions/sprite.html` (pose swaps work like the mouth swap: one `<img class="clip">` per pose PNG used, opacity sets on the frame grid, identical box), `compositions/captions.html` and one `compositions/beat-NN.html` per graphic beat. It also places `<audio>` for the VO and SFX (peak-aligned).
5. Gate: `npx hyperframes check --json` must have zero errors. Then `snapshot --at <beat midpoints>` and read the PNGs. Then `render --quality looks --output renders/<slug>.mp4`. Then ffprobe the duration, extract frames and confirm the mouth/audio checks from §10.

---

## 13. Source map (what I read)

- Skills (repo `skills/`):
  - `hyperframes/SKILL.md` and its `references/` (format, runtimes, motion, captions, overlays, sound, look, film, skill-lifecycle, plugin-installation, types/vertical, types/character).
  - `hyperframes-cli/SKILL.md` and its `references/` (init-and-scaffold, preview-render).
  - `hyperframes-registry/SKILL.md` and its `references/` (install-locations, wiring-blocks, wiring-components).
  - `media-use/SKILL.md` and its `references/` (mixing, audio), plus `audio/references/` (transcribe, sfx, `captions/authoring.md`, `captions/transcript-handling.md`) and `audio/assets/sfx/manifest.json`.
- Docs: `README.md`, `docs/quickstart.mdx`, `docs/concepts/{determinism,data-attributes}.mdx`, `docs/reference/html-schema.mdx`, `docs/guides/{gsap-animation,skills,plugins,faceless-explainer,troubleshooting}.mdx`.
- Source:
  - `packages/parsers/src/ffBinaries.ts`, `packages/cli/src/browser/{ffmpeg,preflight}.ts` and `packages/engine/src/services/frameCapture.ts`: FFmpeg discovery and requirements.
  - `packages/producer/src/services/htmlCompiler.ts`: CDN inlining.
  - `packages/core/src/fonts/deterministicFonts.ts`: Google Fonts fetch and cache.
  - `packages/cli/src/{commands/skills.ts,fontLocalizeCli.ts}`, `packages/cli/src/whisper/{manager,parakeet,normalize}.ts` and `packages/cli/src/api/transcribe.ts`.
  - `packages/producer/src/services/render/planValidation.ts`: the 24 h maximum.
  - `packages/lint/src/rules/gsap.ts`.
