#!/usr/bin/env bash
# One-time setup for brand-motion-studio. Safe to re-run.
# Creates a private Python environment inside the skill folder so nothing else on the machine is touched.
set -e
HERE="$(cd "$(dirname "$0")/.." && pwd)"
VENV="$HERE/.venv"

if ! command -v ffmpeg >/dev/null 2>&1; then
  if command -v brew >/dev/null 2>&1; then
    echo "Installing ffmpeg with Homebrew..."; brew install ffmpeg
  elif command -v apt-get >/dev/null 2>&1; then
    echo "Installing ffmpeg with apt..."; sudo apt-get update && sudo apt-get install -y ffmpeg
  elif command -v winget >/dev/null 2>&1; then
    echo "Installing ffmpeg with winget..."; winget install --id Gyan.FFmpeg -e
  else
    echo "ffmpeg is missing. Install it (macOS: 'brew install ffmpeg', https://brew.sh for Homebrew) and run this again."; exit 1
  fi
fi

PY=""
for c in python3.12 python3.11 python3.10 python3 python py; do
  if command -v $c >/dev/null 2>&1 && $c -c 'import sys; sys.exit(0 if sys.version_info >= (3, 10) else 1)'; then PY=$c; break; fi
done
if [ -z "$PY" ]; then echo "Python 3.10+ is required (macOS: 'brew install python@3.12')."; exit 1; fi

if [ ! -x "$VENV/bin/python" ] && [ ! -f "$VENV/Scripts/python.exe" ]; then "$PY" -m venv "$VENV"; fi
VPY="$VENV/bin/python"; [ -f "$VENV/Scripts/python.exe" ] && VPY="$VENV/Scripts/python.exe"
"$VPY" -m pip install --upgrade pip -q
"$VPY" -m pip install -q -r "$HERE/setup/requirements.txt"
if [ "${WITH_BROWSER:-1}" = "1" ]; then
  "$VPY" -m pip install -q playwright && "$VPY" -m playwright install chromium >/dev/null 2>&1 || echo "(website capture unavailable, screenshots still work)"
fi
"$VPY" "$HERE/setup/check.py"
echo "Use this python for the skill: $VPY"
