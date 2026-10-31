#!/usr/bin/env bash
# finish.sh — concat, relay the voice, sound effects, optional music bed.
#
#   bash finish.sh                  (from this video's folder, after the segments render)
#   TITLES=titles.txt bash finish.sh   one chapter title per line, segment order
#
#   1. concat the SILENT segment renders (out/seg-*.mp4, in name order); chapter
#      timestamps come from the REAL rendered durations (out/chapters.txt)
#   2. relay the SOURCE audio (assets/cam.mp4) onto the join, whole — per-segment
#      audio drifts ~38ms of AAC priming per join; one continuous track cannot
#   3. sound effects from sfx-cues.txt (build.py writes it), if brand.json says sfx on
#   4. a ducked music bed from assets/music/, if brand.json says music on
#
# Ends with out/final.mp4. It does NOT publish or upload anything.
set -euo pipefail
V="$(cd "$(dirname "$0")" && pwd)"
cd "$V"
SK="$(python3 -c 'import json;print(json.load(open("kit.json"))["skill"])' 2>/dev/null || echo "$HOME/.claude/skills/nextphase-screenshare")"
source "$SK/scripts/env.sh"

read -r SFX MUSIC < <(python3 -c '
import json
b={"sfx":True,"music":False}
try: b.update(json.load(open("brand.json")))
except Exception: pass
print(int(bool(b.get("sfx"))), int(bool(b.get("music"))))')

shopt -s nullglob
SEGS=(out/seg-*.mp4)
[ ${#SEGS[@]} -ge 1 ] || { echo "finish: no out/seg-*.mp4 — render the segments first" >&2; exit 1; }
if [ ${#SEGS[@]} -eq 1 ]; then
  cp "${SEGS[0]}" out/final-visual.mp4
else
  bash "$SK/scripts/concat-segments.sh" out/final-visual.mp4 "${SEGS[@]}" \
       ${TITLES:+--titles "$TITLES"}
fi

echo "relay: muxing the source voice onto the join, whole"
ffmpeg -v error -y -i out/final-visual.mp4 -i assets/cam.mp4 \
  -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -shortest out/final-voice.mp4 </dev/null

CUR=out/final-voice.mp4
if [ "$SFX" = "1" ] && grep -qvE '^\s*(#|$)' sfx-cues.txt 2>/dev/null; then
  # called by its path INSIDE the skill: mix-sfx resolves sounds as <skill>/sfx/<name>
  bash "$SK/scripts/mix-sfx.sh" "$CUR" out/final-sfx.mp4 sfx-cues.txt
  CUR=out/final-sfx.mp4
else
  echo "sfx: off (or no cues) — voice only"
fi

BED=$(ls assets/music/*.{mp3,m4a,wav} 2>/dev/null | head -1 || true)
if [ "$MUSIC" = "1" ] && [ -n "$BED" ]; then
  bash "$SK/scripts/mix-bgm.sh" "$CUR" out/final.mp4 "$BED"
elif [ "$MUSIC" = "1" ]; then
  echo "music: ON in brand.json but no bed in assets/music/ — skipped (drop a track there and re-run)"
  cp "$CUR" out/final.mp4
else
  cp "$CUR" out/final.mp4
fi

[ -f out/chapters.txt ] && { echo; echo "chapters:"; cat out/chapters.txt; }
ffprobe -v error -show_entries format=duration \
        -show_entries stream=codec_type,nb_frames -of default=nw=1 out/final.mp4
echo "done -> out/final.mp4   (review it; nothing has been published)"
