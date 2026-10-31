#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# cam-square.sh — cut the 1:1 camera tile for the SCREENSHARE style.
#
#   usage:  bash cam-square.sh <in.mp4> <out.mp4> [--offset N] [--size 300]
#
# The parked camera card is a 300x300 SQUARE — measured, three times, minutes
# apart: x 1560..1859, y 720..1021, aspect 1.000. The source is 16:9, so the
# card is an object-fit:cover crop of it, which is why the head reads bigger
# in the card than in the full frame. That is correct. Do not letterbox it to
# "show the whole shot".
#
#   --offset N   shift the crop horizontally, in SOURCE pixels. Negative moves
#                left. Use when the subject does not sit centred in the 16:9
#                frame — which is common, because a talking head is usually
#                framed with the face off-centre and the room to one side.
#   --size S     output edge, default 300 (= --ss-cam-size).
#
# ⚠ The full-bleed ground uses the ORIGINAL 16:9 file and the shrink
#   interpolates between the two, so BOTH must be the same tightened cut,
#   frame for frame. Always run this on assets/recording-tight.mp4, never on
#   the raw recording.
#
# ⚠ 30fps CFR out, always. Sourced and re-encoded clips come back at
#   24/25/50/60 or VFR and desync everything downstream.
# ═══════════════════════════════════════════════════════════════════════════
set -euo pipefail
source "$(cd "$(dirname "$0")" && pwd)/env.sh"

IN="${1:-}"; OUT="${2:-}"; shift 2 || true
OFFSET=0; SIZE=300
while [ $# -gt 0 ]; do
  case "$1" in
    --offset) OFFSET="$2"; shift 2;;
    --size)   SIZE="$2";   shift 2;;
    *) echo "cam-square: unknown argument: $1" >&2; exit 2;;
  esac
done

[ -n "$IN" ] && [ -n "$OUT" ] || {
  sed -n '3,30p' "$0" | sed 's/^# \{0,1\}//'; exit 2; }
[ -f "$IN" ] || { echo "cam-square: no such file: $IN" >&2; exit 2; }

read -r SW SH SFPS < <(ffprobe -v error -select_streams v:0 \
  -show_entries stream=width,height,r_frame_rate -of csv=p=0 "$IN" \
  | awk -F, '{print $1, $2, $3}')

echo "cam-square: $IN  (${SW}x${SH} @ ${SFPS})"

if [ "$SH" -gt "$SW" ]; then
  echo "cam-square: WARNING — the source is portrait. The camera tile is a" >&2
  echo "            crop of a 16:9 plate in this style; check the framing." >&2
fi

# square crop of the full height, centred, then offset
CROP_X=$(( (SW - SH) / 2 + OFFSET ))
if [ "$CROP_X" -lt 0 ]; then CROP_X=0; fi
MAXX=$(( SW - SH )); if [ "$CROP_X" -gt "$MAXX" ]; then CROP_X="$MAXX"; fi
if [ "$CROP_X" != "$(( (SW - SH) / 2 + OFFSET ))" ]; then
  echo "cam-square: offset clamped to $CROP_X (the crop would have left the frame)" >&2
fi

echo "cam-square: crop ${SH}x${SH} at x=${CROP_X}  ->  ${SIZE}x${SIZE} @30fps CFR"

ffmpeg -y -v error -stats -i "$IN" \
  -vf "crop=${SH}:${SH}:${CROP_X}:0,scale=${SIZE}:${SIZE}:flags=lanczos,fps=30" \
  -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p \
  -color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
  -c:a copy \
  "$OUT"

# verify — a wrong fps here desyncs every graphic downstream
read -r OW OH OFPS ONB < <(ffprobe -v error -select_streams v:0 \
  -show_entries stream=width,height,r_frame_rate,nb_frames -of csv=p=0 "$OUT" \
  | awk -F, '{print $1, $2, $3, $4}')
echo "cam-square: wrote $OUT  ${OW}x${OH} @ ${OFPS}  (${ONB} frames)"

[ "$OFPS" = "30/1" ] || { echo "cam-square: FAILED — output is ${OFPS}, not 30/1" >&2; exit 1; }
[ "$OW" = "$OH" ]    || { echo "cam-square: FAILED — output is not square" >&2; exit 1; }

echo "cam-square: ok. The full-bleed ground uses $IN; both must be the same cut."
