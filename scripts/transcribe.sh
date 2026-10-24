#!/usr/bin/env bash
# Word-level transcript with WhisperX (large-v3), using the shared venv.
#   scripts/transcribe.sh <media file> <out words.json>
# Extracts 16 kHz mono WAV, runs CUDA float16 on the GPU (falls back to CPU int8 if CUDA
# errors), aligns words. Never re-transcribes: exits if the output already exists.
set -euo pipefail
export PYTHONUTF8=1 HF_HUB_DISABLE_SYMLINKS=1

IN="${1:?usage: transcribe.sh <media> <out words.json>}"
OUT="${2:?usage: transcribe.sh <media> <out words.json>}"
if [ -s "$OUT" ]; then echo "already transcribed: $OUT (not redoing it)"; exit 0; fi

VENV="$HOME/.cache/video-editor/whisperx-venv"
PY="$VENV/Scripts/python.exe"; [ -x "$PY" ] || PY="$VENV/bin/python"
[ -x "$PY" ] || { echo "WhisperX venv missing at $VENV"; exit 1; }

mkdir -p "$(dirname "$OUT")"
WAV="${OUT%.json}.16k.wav"
ffmpeg -v error -y -i "$IN" -vn -ac 1 -ar 16000 -c:a pcm_s16le "$WAV"
"$PY" "$(dirname "$0")/whisperx_words.py" "$WAV" "$OUT"
rm -f "$WAV"
