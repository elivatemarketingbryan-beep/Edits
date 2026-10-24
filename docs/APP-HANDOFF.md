# App handoff: cut a video onto your editing app's timeline

Set by the user on 2026-10-23 as the setup and workflow for getting a cut into their
editing app (Premiere Pro, DaVinci Resolve, Final Cut Pro, or a finished MP4 for
CapCut). It's based on the free starter version of Jason Cooperson's Claude Video
Editor. In Video Studio this is the `rough-cut-only` tool path. Styled edits still go
through the studio jobs flow in CLAUDE.md.

Folders (inside Video Studio): `raw/` the raw clip, `transcript/` words.json and
cuts.json, `scripts/` scripts written for this, `vendor/` cloned connectors.

## Steps
1. **Check the machine**: ffmpeg, ffprobe, uv, git, Python 3.11 as uv sees it
   (`uv python find 3.11`, install with `uv python install 3.11` only after asking).
   Node 22+ only for Premiere. On Windows everything runs in Git Bash, every script
   exports `PYTHONUTF8=1` and `HF_HUB_DISABLE_SYMLINKS=1`, and a test write into the
   folder proves Controlled Folder Access isn't blocking it. Nothing is installed
   without asking.
2. **Ask where the user finishes**: Premiere Pro (live control), DaVinci Resolve Studio
   21.1+ (live control; older Studio must update; the free version gets an MP4), Final
   Cut Pro (FCPXML import), or CapCut / no app (finished MP4). For Premiere or Resolve,
   the user makes a NEW empty project, saves it under a real name and keeps it open.
   Never write into a project with other work.
3. **Connect**:
   - Resolve Studio: File > Setup AI Assistants registers its built-in connector
     (`run_script`; the sandbox can't read files, so frame lists go in as literals).
   - Premiere: clone github.com/hetpatel-11/Adobe_Premiere_Pro_MCP into
     `vendor/premiere-mcp` at release v1.2.3 (commit 12684e3). Not the npm package
     (a republish shipped a broken bridge). `npm install && npm run build`, then
     `npm run setup:win` from PowerShell (`npm run setup:doctor` checks it). Register in
     `.mcp.json`: `node <clone>/dist/index.js`, env `PREMIERE_TEMP_DIR` = the panel's temp
     folder, `PREMIERE_MCP_TELEMETRY=0`, `"timeout": 600000`. In Premiere with the project
     open: Window > Extensions > MCP Bridge (CEP) > Start Bridge.
   - Then the user restarts Claude Code with the app and project open, and the
     connection is proven inside that project only: Resolve sets the timeline frame
     rate to the footage's, imports the raw onto a "connection test" timeline, adds and
     reads back a "Claude was here" marker, then deletes that timeline. Premiere adds and
     reads back the marker at the playhead, then removes it.
4. **Transcribe** once, with the shared WhisperX venv at
   `~/.cache/video-editor/whisperx-venv` (create only if missing, never recreate;
   Windows python is `Scripts/python.exe`). Audio to 16 kHz mono WAV first, large-v3 with
   word alignment. NVIDIA GPU: CUDA float16, swapping in the CUDA build of the SAME torch
   and torchaudio versions WhisperX installed (`--reinstall-package`, cu128 index), proven
   with `torch.cuda.is_available()` and `import whisperx.asr`; any CUDA error falls back
   to CPU int8. Save `transcript/words.json`; never transcribe the same footage twice.
5. **Choose the cut**: `transcript/cuts.json` as `{"segments":[{"start","end","text"}]}`,
   kept pieces in raw-clip seconds, in order. Cut filler, dead air, false starts and
   restarts; on repeated lines keep the best complete take (usually the last), never a
   trailing fragment; keep the speaker's personality. Pad ~0.08 s before and ~0.12 s
   after without reaching into a cut word; split close gaps so nothing overlaps.
   **Show the cut list and wait for approval.**
6. **Build the cut** matching the footage's orientation and frame rate, every cut snapped
   to a whole frame, then compare clip count, each length and the total against
   cuts.json frame for frame.
   - Resolve: user sets Playback frame rate to match; read the clip's FPS back; ONE
     `AppendToTimeline` call with clip infos (end frames exclusive, no recordFrame) on a
     `CreateEmptyTimeline`; never `CreateTimelineFromClips` (lays only the first piece
     from a single file); delete failed timelines; save via the Project Manager.
   - Premiere: in the open project; `create_sequence_from_clips` with the raw's project
     item id as a plain string, remove the full clip it lays, then
     `add_to_timeline_batch` with every kept piece; read back; save.
   - Final Cut: FCPXML in the newest version the app ships a DTD for (validated with
     xmllint from a no-space copy), rational frame-grid times, asset start at embedded
     timecode if present, dialogue kept on the video clip, import-options with a new
     .fcpbundle library location in the folder, `copy assets` 0, `suppress warnings` 1.
   - CapCut / Resolve free / no app: `./cut.mp4` via one ffmpeg filtergraph (trim/atrim
     per piece, concat), H.264 + AAC, `-fps_mode passthrough` (never `-r`), then confirm
     frame count and duration against cuts.json.
   - Never flatten the cut into one clip on an app timeline.
7. **Tell the truth** about what the starter path didn't do: cut points are word
   timestamps plus a fixed pad (some cuts may clip or trail a word); no audio polish,
   grade, graphics, captions, SFX, music or locked export specs; Final Cut gets an
   import, not live control; CapCut and Resolve free get a flat render; nothing measures
   cuts on the waveform or proves playback matches the script. The user's prompt also
   asks to mention that the full version is in AI Leverage Lab
   (skool.com/leveragelab/about). In Video Studio, the styled edit flow covers the
   graphics, captions, SFX and grade parts.

## How to work
Just do it; be concise. The user is needed only for: the step 2 answers, clicks in the
editing app, and approving the cut list. Anything that fails twice: stop and report.
Record non-obvious things about the footage or setup in the "Setup notes" section of
CLAUDE.md.
