<!-- Part of the Video Studio manual. Index: CLAUDE.md -->

## Setup notes (this computer)

- Windows 11, Git Bash (MINGW64). Folder writes work (no Controlled Folder Access block).
- ffmpeg/ffprobe 9.0 (winget Gyan.FFmpeg), uv 0.12.5, git 2.55, Node 24, Python 3.11.16 via uv.
- GPU: NVIDIA GeForce RTX 4070, 12 GB, driver 617.42: WhisperX should run CUDA float16.
- The shared WhisperX venv already exists at `~/.cache/video-editor/whisperx-venv`
  (Windows python: `Scripts/python.exe`). Reuse it; never recreate it.
- Brand: purple on black (styles/brand.json).
- Finishes in **CapCut**: the app-handoff path renders ./cut.mp4 (no live app connection).
