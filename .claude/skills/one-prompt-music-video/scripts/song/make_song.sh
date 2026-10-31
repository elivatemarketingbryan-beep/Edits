#!/bin/bash
# Make song takes locally ($0): generate latents for each seed, then decode them to WAV.
#   bash make_song.sh <project_dir> [bpm=100] [duration=150] [seeds…]
# Reads <project>/song/caption.txt and <project>/song/lyrics.txt. Writes <project>/song/takes/seed<N>.wav
set -e
SKILL="$(cd "$(dirname "$0")/../.." && pwd)"
ACE="${ACE_STEP_DIR:-$HOME/.one-prompt-mv/ACE-Step-1.5}"
PROJ="$(cd "$1" && pwd)"; BPM="${2:-100}"; DUR="${3:-150}"; shift $(( $# < 3 ? $# : 3 ))
SEEDS="${*:-7 19 31 53}"
[ -d "$ACE" ] || { echo "ACE-Step not installed: run bash $SKILL/scripts/song/install_acestep.sh"; exit 1; }
LOCK="$HOME/.one-prompt-mv/.acestep-lock"; mkdir -p "$HOME/.one-prompt-mv"
while ! mkdir "$LOCK" 2>/dev/null; do
  pid=$(cat "$LOCK/pid" 2>/dev/null)
  if [ -n "$pid" ] && ! kill -0 "$pid" 2>/dev/null; then echo "clearing a stale lock (process $pid is gone)"; rm -rf "$LOCK"; continue; fi
  echo "another song is generating… waiting"; sleep 20
done
echo $$ > "$LOCK/pid"
trap 'rm -rf "$LOCK"' EXIT
cd "$ACE"
export TOKENIZERS_PARALLELISM=false PYTHONUNBUFFERED=1
if [ "$(uname -s)" = "Darwin" ]; then export ACESTEP_LM_BACKEND=mlx ACESTEP_MPS_DTYPE=bfloat16 ACESTEP_SAVE_MEMORY=1; fi
echo "[$(date +%T)] generating seeds: $SEEDS (first run downloads the models, ~10 GB)"
uv run python "$SKILL/scripts/song/gen_song.py" --caption "$PROJ/song/caption.txt" --lyrics "$PROJ/song/lyrics.txt" \
  --bpm "$BPM" --duration "$DUR" --out "$PROJ/song/takes" --seeds $SEEDS 2>&1 | tee "$PROJ/song/gen.log" | grep -E "seed|DiT|LM|Error|error" || true
echo "[$(date +%T)] decoding"
uv run python "$SKILL/scripts/song/decode_latents.py" "$PROJ/song/takes"
find "$PROJ/song/takes" -name '*-*-*-*-*.wav' -delete   # ACE-Step's silent placeholder files
echo "[$(date +%T)] done → $PROJ/song/takes"
