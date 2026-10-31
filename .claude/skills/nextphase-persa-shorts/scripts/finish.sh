#!/usr/bin/env bash
# FINISH — visual render -> voice -> sound effects -> (music) -> out/<slug>-FINAL.mp4
#
#   usage:  bash scripts/finish.sh <video-folder> [visual.mp4]
#
# The render itself is silent (every <video> in the composition is muted on purpose — the voice
# would otherwise play once per layer). So the voice is relayed from assets/recording.mp4,
# frame-exact, then the sound pass is mixed on top if brand.json has sfx on and sfx-cues.txt
# exists, then the bed if music is on and a music file is set.
# It opens nothing and publishes nothing.
set -euo pipefail
SKILL="$(cd "$(dirname "$0")/.." && pwd)"
VD="$(cd "${1:?video folder}" && pwd)"; SLUG="$(basename "$VD")"
VIS="${2:-$VD/out/visual.mp4}"
[[ -f "$VIS" ]] || { echo "finish: no visual render at $VIS" >&2; exit 1; }
jq_get () { python3 -c "import json,sys; d=json.load(open('$VD/brand.json')); print(d.get('$1',''))"; }
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$VIS" </dev/null)

VOICE="$VD/out/$SLUG-voice.mp4"
ffmpeg -nostdin -hide_banner -loglevel error -y -i "$VIS" -i "$VD/assets/recording.mp4" \
  -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -ar 48000 -t "$DUR" "$VOICE"
CUR="$VOICE"; echo "finish: voice relayed -> $(basename "$VOICE")"

if [[ "$(jq_get sfx)" == "True" && -f "$VD/sfx-cues.txt" ]]; then
  bash "$SKILL/scripts/mix-sfx.sh" "$CUR" "$VD/out/$SLUG-sfx.mp4" "$VD/sfx-cues.txt"
  CUR="$VD/out/$SLUG-sfx.mp4"
fi
MUSIC="$(jq_get music_file)"; MUSIC="${MUSIC/#\~/$HOME}"
if [[ "$(jq_get music)" == "True" && -n "$MUSIC" && -f "$MUSIC" ]]; then
  bash "$SKILL/scripts/lay-bed.sh" "$CUR" "$VD/out/$SLUG-bed.mp4" "$MUSIC"
  CUR="$VD/out/$SLUG-bed.mp4"
fi
cp "$CUR" "$VD/out/$SLUG-FINAL.mp4"
echo "finish: $VD/out/$SLUG-FINAL.mp4"
echo "finish: now SAMPLE it (scripts/contact-sheet.py) and open it for review. Publish nothing."
