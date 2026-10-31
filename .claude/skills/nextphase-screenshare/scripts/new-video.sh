#!/usr/bin/env bash
# new-video.sh — start a new video project from the template.
#
#   bash <skill>/scripts/new-video.sh <recording> [name] [--dir <parent>]
#
#   <recording>  your talking-head take (.mov / .mp4 / .mkv …)
#   [name]       folder name; default: today's date + the file name
#   --dir        where projects live; default: ./videos
#
# Creates <parent>/<name>/ with:
#   build.py devices.py spec.py make_captions.py finish.sh demos/   (the template)
#   brand.json      a SNAPSHOT of your theme + settings, so changing your theme
#                   later never silently changes an old video
#   kit.json        where the skill lives
#   PLAN.md         fill this in and get a "go" before building
#   assets/         recording, tokens.css, ss.css, fonts/, vendor/gsap.min.js
set -euo pipefail
SK="$(cd "$(dirname "$0")/.." && pwd)"
source "$SK/scripts/env.sh"
REC="${1:?usage: new-video.sh <recording> [name] [--dir parent]}"; shift
NAME=""; PARENT="videos"
while [ $# -gt 0 ]; do
  case "$1" in
    --dir) PARENT="$2"; shift 2;;
    *) NAME="$1"; shift;;
  esac
done
[ -f "$REC" ] || { echo "new-video: no such file: $REC" >&2; exit 1; }
if [ -z "$NAME" ]; then
  base="$(basename "$REC")"; base="${base%.*}"
  NAME="$(date +%Y-%m-%d)-$(echo "$base" | tr 'A-Z' 'a-z' | tr -cs 'a-z0-9' '-' | sed 's/^-//;s/-$//' | cut -c1-40)"
fi
VD="$PARENT/$NAME"
[ -e "$VD" ] && { echo "new-video: $VD already exists" >&2; exit 1; }
[ -f "$SK/assets/vendor/gsap.min.js" ] || { echo "new-video: GSAP missing — run scripts/doctor.sh first" >&2; exit 1; }

mkdir -p "$VD"/{assets/broll,assets/captures,assets/music,out,demos}
cp "$SK"/template/{build.py,devices.py,spec.py,make_captions.py,finish.sh} "$VD/"
cp "$SK"/template/demos/{demolib.py,make_demos.py} "$VD/demos/"
cp "$SK/assets/tokens.css" "$SK/assets/ss.css" "$VD/assets/"
cp -R "$SK/assets/fonts" "$SK/assets/vendor" "$VD/assets/"
cp "$SK/brand/brand.json" "$VD/brand.json"
VDA="$(cd "$VD" && pwd)"
printf '{\n  "skill": "%s",\n  "created": "%s"\n}\n' "$SK" "$(date +%Y-%m-%d)" > "$VD/kit.json"
ext="${REC##*.}"
# a hard link costs no disk; fall back to a copy across volumes
ln "$REC" "$VD/assets/recording-src.$ext" 2>/dev/null || cp "$REC" "$VD/assets/recording-src.$ext"
# one 30fps CFR h264 working copy with a keyframe every second
ffmpeg -v error -stats -y -i "$VD/assets/recording-src.$ext" -map 0:v:0 -map 0:a:0 \
  -c:v libx264 -preset medium -crf 16 -g 30 -r 30 -pix_fmt yuv420p \
  -color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
  -c:a aac -b:a 256k -ar 48000 "$VD/assets/recording.mp4" </dev/null
cat > "$VD/PLAN.md" <<PLAN
# PLAN — $NAME

## STYLE: nextphase-screenshare (played screen shares, live ground)
Theme snapshot: brand.json · created $(date +%Y-%m-%d)

## The video in one line
(what the viewer gets)

## Layout track — plan this BEFORE building (targets: FULL 14-18% · HALF 36-42% · CORNER 32-38% · PAGE/no-cam ~10% · a change every 7-9s)
| span (tight s) | layout | what the screen plays | source (real capture / rebuilt UI / supplied file) |
|---|---|---|---|
| 0.0–4.8 | FULL | — | |

## Facts to verify before they go on screen
-

## Open questions for the creator
-
PLAN
echo "new video: $VDA"
echo "next:"
echo "  python3 $SK/scripts/transcribe.py $VD"
echo "  python3 $SK/scripts/tighten-cuts.py --src $VD/assets/recording.mp4 --transcript $VD/assets/transcript.json --out $VD/assets/recording-tight.mp4"
echo "  cp $VD/assets/recording-tight.mp4 $VD/assets/cam.mp4"
