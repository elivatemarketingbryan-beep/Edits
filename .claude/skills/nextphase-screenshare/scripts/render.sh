#!/usr/bin/env bash
# render.sh — render a video's segments with HyperFrames.
#
#   bash <skill>/scripts/render.sh <video-dir>                 final quality, every segment
#   bash <skill>/scripts/render.sh <video-dir> --preview       draft quality, downscaled to 540p
#   bash <skill>/scripts/render.sh <video-dir> --only seg-02-the-setup [--preview]
#
# Writes out/<seg>.mp4 (or out/preview/<seg>.mp4). Runs check-screenshare.sh
# first and stops if it fails. Renders one segment at a time: two big renders
# in parallel can fill a small disk with cached frames.
set -euo pipefail
SK="$(cd "$(dirname "$0")/.." && pwd)"
source "$SK/scripts/env.sh"
VD="${1:?video dir}"; shift
Q="looks"; PREVIEW=0; ONLY=""
while [ $# -gt 0 ]; do
  case "$1" in
    --preview) PREVIEW=1; Q="draft"; shift;;
    --quality) Q="$2"; shift 2;;
    --only) ONLY="$2"; shift 2;;
    *) echo "render: unknown option $1" >&2; exit 2;;
  esac
done
cd "$VD"
bash "$SK/scripts/check-screenshare.sh" . || exit 1
mkdir -p out/preview
for d in seg-*/; do
  d="${d%/}"
  [ -n "$ONLY" ] && [ "$d" != "$ONLY" ] && continue
  [ -f "$d/index.html" ] || continue
  if [ $PREVIEW -eq 1 ]; then
    hf render "$d" -o "out/preview/$d.full.mp4" -q draft --quiet
    ffmpeg -v error -y -i "out/preview/$d.full.mp4" -vf scale=960:540 -c:v libx264 -crf 26 \
      -preset veryfast -an "out/preview/$d.mp4" </dev/null && rm -f "out/preview/$d.full.mp4"
    echo "preview -> out/preview/$d.mp4"
  else
    hf render "$d" -o "out/$d.mp4" -q "$Q" --quiet
    echo "render  -> out/$d.mp4"
  fi
done
