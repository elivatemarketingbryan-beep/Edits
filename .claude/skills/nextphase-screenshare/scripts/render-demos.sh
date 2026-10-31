#!/usr/bin/env bash
# render-demos.sh — render every played screen share in <video>/demos/ to
# <video>/assets/broll/<name>.mp4, then make sure each is 30fps CFR.
#
#   bash <skill>/scripts/render-demos.sh <video-dir> [name ...]
set -euo pipefail
SK="$(cd "$(dirname "$0")/.." && pwd)"
source "$SK/scripts/env.sh"
VD="${1:?video dir}"; shift
cd "$VD"
mkdir -p assets/broll
for d in demos/*/; do
  n="$(basename "$d")"
  [ -f "$d/index.html" ] || continue
  if [ $# -gt 0 ] && ! printf '%s\n' "$@" | grep -qx "$n"; then continue; fi
  hf render "$d" -o "assets/broll/$n.mp4" -q looks --quiet
  r=$(ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate -of csv=p=0 "assets/broll/$n.mp4")
  echo "demo -> assets/broll/$n.mp4  ($r)"
  [ "$r" = "30/1" ] || echo "  ! not 30fps — re-encode before it enters a composition"
done
