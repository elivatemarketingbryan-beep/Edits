# Runtime setup

The editor renders locally using Node, Remotion, a compatible Chromium browser, and FFmpeg. The included `package-lock.json` fixes the dependency versions. Use Node.js 22 or newer and run commands from the project root.

```sh
npm ci
node scripts/editor.mjs doctor
```

The doctor reports the available tools. Use `node scripts/editor.mjs doctor --browser download` to install/check the render browser; allow time and network access for that setup. FFmpeg and FFprobe come from npm packages, so a separate system installation is not the normal setup path. A failed doctor is actionable evidence, not permission to pretend the runtime is ready.

## npm install scripts

The project's `package.json` includes version-specific `allowScripts` entries for `ffmpeg-static@5.3.0` and `esbuild@0.28.1`. These dependencies need their install scripts to prepare working binaries. Keep those entries with the lockfile. npm 11 versions that support this policy can report unreviewed scripts, and strict configurations can reject them; older npm versions that do not use this policy perform their normal install-script handling. See npm's [script approval documentation](https://docs.npmjs.com/cli/v11/commands/npm-approve-scripts/) and [strict-allow-scripts configuration](https://docs.npmjs.com/cli/v11/using-npm/config/#strict-allow-scripts).

If installation reports a script-policy error, check the named package/version against those entries and the lockfile. Use the kit's pinned versions and rerun `npm ci`; do not globally allow every script. An install performed with `--ignore-scripts` can leave FFmpeg unavailable even when package folders exist. After correcting the local install configuration, rerun `npm ci` and the doctor. Review changed dependency versions before updating their approvals.

## Choose an execution environment

| Environment | Practical use |
| --- | --- |
| ChatGPT desktop local project using Codex | Open the unzipped folder and attach it as the primary project. The assistant can work with local files and terminal commands when permissions allow. |
| Codex CLI or another coding agent | Start it in the project folder. Ask it to read `AGENTS.md` and edit the video. |
| Executable cloud workspace | Use only after confirming full project extraction, Node, package downloads, browser rendering, FFmpeg, sufficient storage, and footage access. |
| ChatGPT Project with only uploaded reference files | Useful for instructions and planning. File attachment alone does not establish an executable rendering environment. |

OpenAI distinguishes [uploaded project sources and local project folders](https://learn.chatgpt.com/docs/projects). Its [integrated terminal documentation](https://learn.chatgpt.com/docs/integrated-terminal) describes running project commands in the desktop app. These are product capabilities, not a guarantee that every account, permission profile, or cloud session can run this kit. Verified October 7, 2026.

## Common issues

- **Node version is too old:** install Node 22 or newer, reopen the terminal, and rerun the doctor.
- **Dependencies are missing:** run `npm ci` in the folder containing `package.json`.
- **Browser cannot launch:** read the exact Remotion error. Install its required browser/system dependencies for the host, or use a supported local desktop environment. Do not disable security controls merely to bypass an unexplained error.
- **Out of memory:** close competing render jobs and try a draft or lower render concurrency if the CLI supports it. Preserve the same final composition.
- **Footage is unavailable:** attachments in another chat are not necessarily local files. Save the original media into this project's `inputs/` folder.
- **No transcription capability:** install the optional dependencies from `requirements-transcription.txt` in a Python environment for local transcription, or supply SRT, VTT, or timed JSON from a trusted transcript source. See [the exact transcription commands](WORKFLOW.md#3-obtain-a-real-timed-transcript). The renderer itself does not transcribe audio.

Rendering performance depends on duration, source resolution, scene complexity, and computer resources. Long recordings require editorial selection before a short-form render. The kit cannot guarantee support for every codec, damaged file, language, or topic without inspection.
