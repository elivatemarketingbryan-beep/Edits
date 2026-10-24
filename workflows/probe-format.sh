#!/usr/bin/env bash
# workflows/probe-format.sh — check a rendered file against a format
# detail sheet before shipping.
#
# usage: probe-format.sh <file> <shortform|longform>
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo="$(cd "$here/.." && pwd)"
. "$repo/lib/common.sh"

[ $# -eq 2 ] || hf_die "usage: probe-format.sh <file> <shortform|longform>"
file="$1"; fmt="$2"
[ -f "$file" ] || hf_die "no such file: $file"

case "$fmt" in
  shortform) want_w=1080; want_h=1920 ;;
  longform)  want_w=1920; want_h=1080 ;;
  *) hf_die "format must be shortform or longform" ;;
esac

w="$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of default=noprint_wrappers=1:nokey=1 "$file")"
h="$(ffprobe -v error -select_streams v:0 -show_entries stream=height -of default=noprint_wrappers=1:nokey=1 "$file")"
vcodec="$(ffprobe -v error -select_streams v:0 -show_entries stream=codec_name -of default=noprint_wrappers=1:nokey=1 "$file")"
acodec="$(ffprobe -v error -select_streams a:0 -show_entries stream=codec_name -of default=noprint_wrappers=1:nokey=1 "$file")"
abitrate="$(ffprobe -v error -select_streams a:0 -show_entries stream=bit_rate -of default=noprint_wrappers=1:nokey=1 "$file")"
duration="$(hf_duration "$file")"

echo "=== $file ($fmt) ==="
[ "$w" = "$want_w" ] && [ "$h" = "$want_h" ] \
  && echo "  OK   resolution ${w}x${h}" \
  || echo "  WARN resolution ${w}x${h}, expected ${want_w}x${want_h}"

case "$vcodec" in
  h264) echo "  OK   video codec h264" ;;
  *) echo "  WARN video codec '$vcodec', expected h264" ;;
esac

case "$acodec" in
  aac) echo "  OK   audio codec aac" ;;
  *) echo "  WARN audio codec '$acodec', expected aac" ;;
esac

# NOTE: ffmpeg's native aac encoder is content-adaptive, not true CBR —
# a quiet/simple passage can measure well under the requested -b:a
# 256k even though 256k was genuinely what was requested (confirmed by
# direct testing). Treat this as approximate: a big shortfall (well
# under ~200k) on real dialogue is worth investigating; a modest one
# on a quiet clip is not evidence the polish pass regressed.
if [ -n "${abitrate:-}" ] && [ "$abitrate" != "N/A" ] && [ "$abitrate" -ge 256000 ] 2>/dev/null; then
  echo "  OK   audio bitrate ${abitrate} (>= 256k)"
else
  echo "  WARN audio bitrate '${abitrate:-unknown}' below 256k — check it was ENCODED with -b:a 256k (see note); the native aac encoder can legitimately measure lower on quiet content"
fi

echo "  info duration ${duration}s"

if [ "$fmt" = "shortform" ]; then
  over_3min="$(awk -v d="$duration" 'BEGIN { print (d > 180) ? "1" : "0" }')"
  if [ "$over_3min" = "1" ]; then
    echo "  WARN duration over 3 minutes for short-form — check the filler/dead-air cut wasn't under-aggressive"
  fi
fi
