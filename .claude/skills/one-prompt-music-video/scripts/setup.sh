#!/bin/bash
# One-time setup: checks the free tools and builds the Python env used for audio analysis.
#   bash setup.sh            → prints "All set" when everything works
set -u
ok=1; say() { printf '%-10s %s\n' "$1" "$2"; }
export PATH="$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"
NODE_V=$(node -v 2>/dev/null | sed 's/v//' | cut -d. -f1)
if [ -n "$NODE_V" ] && [ "$NODE_V" -ge 22 ]; then say node "ok ($(node -v))"; else say node "MISSING or too old (need Node.js 22+ from nodejs.org or brew install node)"; ok=0; fi
if command -v ffmpeg >/dev/null; then say ffmpeg ok; else say ffmpeg "MISSING (brew install ffmpeg / winget install ffmpeg / apt install ffmpeg)"; ok=0; fi
CH=""; for p in "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" "/Applications/Chromium.app/Contents/MacOS/Chromium" "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge" /usr/bin/google-chrome /usr/bin/google-chrome-stable /usr/bin/chromium /usr/bin/chromium-browser /snap/bin/chromium; do [ -x "$p" ] && CH="$p" && break; done
if [ -n "$CH" ]; then say chrome "ok ($CH)"; else say chrome "MISSING (install Google Chrome from google.com/chrome)"; ok=0; fi
if command -v python3 >/dev/null; then say python3 "ok ($(python3 -V 2>&1))"; else say python3 "MISSING (python.org)"; ok=0; fi
if ! command -v uv >/dev/null; then echo "installing uv (fast Python package manager, no admin needed)…"; curl -LsSf https://astral.sh/uv/install.sh | sh >/dev/null 2>&1; export PATH="$HOME/.local/bin:$PATH"; fi
if command -v uv >/dev/null; then say uv ok; else say uv "MISSING (see docs.astral.sh/uv)"; ok=0; fi
VENV="$HOME/.one-prompt-mv/venv"
if [ ! -x "$VENV/bin/python" ]; then
  echo "building the audio-analysis env in $VENV (numpy, scipy, librosa, faster-whisper, demucs) — a few minutes, ~1.5 GB…"
  mkdir -p "$HOME/.one-prompt-mv" && uv venv --python 3.11 "$VENV" >/dev/null 2>&1 || uv venv "$VENV" >/dev/null
fi
uv pip install --python "$VENV/bin/python" -q numpy scipy soundfile librosa faster-whisper demucs pillow >/dev/null 2>&1 || true
if "$VENV/bin/python" -c "import numpy, scipy, soundfile, librosa, faster_whisper, demucs, PIL" 2>/dev/null; then say audio-env "ok ($VENV)"; else say audio-env "BROKEN — run: uv pip install --python $VENV/bin/python numpy scipy soundfile librosa faster-whisper demucs pillow"; ok=0; fi
if [ -d "$HOME/.one-prompt-mv/ACE-Step-1.5" ]; then say ace-step "ok (for \$0 songs)"; else say ace-step "not installed (only needed to MAKE a song: bash $(dirname "$0")/song/install_acestep.sh)"; fi
[ $ok = 1 ] && echo "All set" || { echo "Fix the MISSING items above, then run setup.sh again."; exit 1; }
