#!/usr/bin/env bash
# setup.sh: checks and installs what this editor needs. Free, no password, nothing outside ~/.cache and this skill.
#   bash setup.sh                the editor itself
#   bash setup.sh --speech       adds word timings (faster-whisper)
#   bash setup.sh --matte        adds the cut-out of a person (PyTorch, about 1 GB)
#   bash setup.sh --demucs       adds voice separation, to study a new reference reel (PyTorch, about 1 GB)
# Re-run until it prints "All set".
SK="$(cd "$(dirname "$0")/.." && pwd)"
NAME="$(basename "$SK")"
VENV="$HOME/.cache/$NAME/venv"
BAD=0
ok(){ printf '  ok       %-10s %s\n' "$1" "$2"; }
no(){ printf '  MISSING  %-10s %s\n' "$1" "$2"; BAD=1; }

echo "$NAME setup ($(uname -s) $(uname -m))"

if command -v ffmpeg >/dev/null 2>&1 && command -v ffprobe >/dev/null 2>&1; then
  ok ffmpeg "$(ffmpeg -version | head -1 | cut -d' ' -f3)"
  for f in ebur128 loudnorm alimiter; do
    ffmpeg -hide_banner -filters 2>/dev/null | grep -q " $f " || no ffmpeg "this build has no $f filter. Install a full build: brew install ffmpeg, or apt install ffmpeg"
  done
  ffmpeg -hide_banner -encoders 2>/dev/null | grep -q libx264 || no ffmpeg "this build has no libx264. Install a full build: brew install ffmpeg, or apt install ffmpeg"
else
  no ffmpeg "install it: brew install ffmpeg (Mac), sudo apt install ffmpeg (Linux or Windows WSL)"
fi

PY=""
for c in python3.12 python3.11 python3.10 python3 python3.9; do
  if command -v "$c" >/dev/null 2>&1 && "$c" -c 'import sys; sys.exit(0 if (3,9) <= sys.version_info[:2] < (3,14) else 1)' 2>/dev/null; then PY="$c"; break; fi
done
if [ -n "$PY" ]; then ok python "$($PY --version 2>&1)"; else no python "install Python 3.9 to 3.13 from python.org"; fi

if [ "$BAD" = 1 ]; then echo; echo "Fix the MISSING lines, then run this again."; exit 1; fi

if [ ! -x "$VENV/bin/python" ]; then
  echo "  making a private Python in $VENV"
  mkdir -p "$(dirname "$VENV")"
  "$PY" -m venv "$VENV" || { echo "Could not make the private Python. On Linux: sudo apt install python3-venv"; exit 1; }
  "$VENV/bin/python" -m pip install -q --upgrade pip
fi
"$VENV/bin/python" -c 'import numpy, cv2, PIL, soundfile' 2>/dev/null || "$VENV/bin/python" -m pip install -q numpy opencv-python-headless pillow soundfile || exit 1
"$VENV/bin/python" -c 'import numpy, cv2, PIL, soundfile; print("  ok       packages   numpy", numpy.__version__, "opencv", cv2.__version__)' || exit 1

for a in "$@"; do
  case "$a" in
    --speech) "$VENV/bin/python" -c 'import faster_whisper' 2>/dev/null || "$VENV/bin/python" -m pip install -q faster-whisper || exit 1; echo "  ok       speech     faster-whisper (the model downloads on first use)";;
    --matte) "$VENV/bin/python" -c 'import torch, torchvision' 2>/dev/null || "$VENV/bin/python" -m pip install -q torch torchvision || exit 1; echo "  ok       matte      PyTorch (the cut-out model downloads on first use)";;
    --demucs) "$VENV/bin/python" -c 'import demucs' 2>/dev/null || "$VENV/bin/python" -m pip install -q demucs || exit 1; echo "  ok       demucs     voice separation";;
  esac
done

"$VENV/bin/python" "$SK/scripts/synth_sfx.py" "$SK/sfx" || exit 1
[ -f "$SK/music/song.m4a" ] && ok song "music/song.m4a" || { no song "music/song.m4a is missing from the skill. Unzip it again."; exit 1; }
chmod +x "$SK/scripts/"* 2>/dev/null
echo "All set"
