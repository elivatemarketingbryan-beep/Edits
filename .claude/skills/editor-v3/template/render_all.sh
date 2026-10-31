#!/usr/bin/env bash
# Renders the whole video in four parallel pieces, joins them, then mixes the sound.
cd "$(dirname "$0")" || exit 1
PY="${EDITOR_PY:-$HOME/.cache/editor-v3/venv/bin/python}"
mkdir -p work/out
TOTAL=$(grep -m1 '^TOTAL' edit.py | sed 's/[^0-9.]//g')
: > work/out/list.txt
for n in 0 1 2 3; do
  A=$(awk -v t="$TOTAL" -v n="$n" 'BEGIN{printf "%.4f", int(t*24*n/4)/24}')
  B=$(awk -v t="$TOTAL" -v n="$n" 'BEGIN{printf "%.4f", int(t*24*(n+1)/4)/24}')
  "$PY" edit.py "$A" "$B" "work/out/p$n.mp4" > "work/out/p$n.log" 2>&1 &
  echo "file 'p$n.mp4'" >> work/out/list.txt
done
wait
tail -qn 1 work/out/p*.log
ffmpeg -nostdin -v error -y -f concat -safe 0 -i work/out/list.txt -c copy work/out/picture.mp4
"$PY" mix.py work/out/picture.mp4 work/out/final.mp4
ffprobe -v error -show_entries stream=codec_type,width,height,nb_frames:format=duration -of compact work/out/final.mp4
