#!/usr/bin/env bash
# Lay a music bed under a finished mix — OPTIONAL, and bring your own track.
#
#   usage:  bash scripts/lay-bed.sh <in.mp4> <out.mp4> <music-file> [lu-under-mix]
#
# No music ships with this kit (a licence to USE a track is not a licence to redistribute it).
# Use a track you own or that is licensed for your videos.
#
# LEVEL BY LOUDNESS, NEVER BY PEAK. Sparse music sits 10-17 dB under its own peaks, so a bed
# "peak-normalised to -38 dB" lands near -50 LUFS and nobody can hear it. This measures the
# mix's integrated loudness and sets the bed a fixed number of LU under it (default 14).
# The track loops to cover any length and fades in over 1.5s; the output keeps EVERY video frame
# (no -shortest, which eats the last frame).
set -euo pipefail
IN="${1:?input video}"; OUT="${2:?output video}"; BED="${3:?music file}"; UNDER="${4:-14}"
[[ -f "$IN" && -f "$BED" ]] || { echo "lay-bed: missing input or music file" >&2; exit 1; }

lufs () { ffmpeg -nostdin -hide_banner -i "$1" -vn -af ebur128=framelog=quiet -f null - 2>&1 \
          | awk '/I:/{v=$2} END{print v}'; }
MIX=$(lufs "$IN"); BEDL=$(lufs "$BED")
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$IN" </dev/null)
GAIN=$(awk "BEGIN{print ($MIX - $UNDER) - ($BEDL)}")
echo "lay-bed: mix ${MIX} LUFS · bed ${BEDL} LUFS · bed gain ${GAIN} dB (target ${UNDER} LU under)"

ffmpeg -nostdin -hide_banner -loglevel error -y -i "$IN" -stream_loop -1 -i "$BED" -filter_complex \
  "[1:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=${GAIN}dB,afade=t=in:st=0:d=1.5,atrim=0:${DUR}[bed];\
[0:a]aformat=sample_rates=48000:channel_layouts=stereo[vox];\
[vox][bed]amix=inputs=2:normalize=0:duration=first,alimiter=limit=0.95[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 256k -t "$DUR" "$OUT"
echo "lay-bed: done -> $OUT ($(lufs "$OUT") LUFS)"
