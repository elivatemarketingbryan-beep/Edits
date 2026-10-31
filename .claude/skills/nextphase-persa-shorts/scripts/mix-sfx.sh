#!/usr/bin/env bash
# Mix sound effects onto a render, on cue — the sound pass.
#
#   usage:  bash scripts/mix-sfx.sh <in.mp4> <out.mp4> <cues.txt>
#
# cues.txt — one cue per line:   <time_sec>  <sound>  [gain]
#   time_sec : when the sound STARTS (a riser starts ~1.5s BEFORE the payoff so it crests on it)
#   sound    : a name resolved in $SFX_DIR, then in the skill's sfx/ folder (swell, riser,
#              camera-shutter, futuristic-click, pop, ...), or a path to any audio file
#   gain     : linear volume, optional, default 0.20. MEASURE it — see reference/SOUND.md.
# '#' comment lines and blank lines are ignored.
#
# Persa bans four cues outright (ping, swoosh, confirm, beep) — this script refuses them, so a
# habit from a busier style cannot sneak back in. The answer to a banned cue is no cue.
# Video is stream-copied (no re-encode); only the audio is rebuilt.
set -euo pipefail

SKILL="$(cd "$(dirname "$0")/.." && pwd)"
IN="${1:?input video}"; OUT="${2:?output video}"; CUES="${3:?cues file}"
DEFAULT_GAIN="0.20"
BANNED=" ping swoosh confirm beep "

[[ -f "$IN" ]]   || { echo "mix-sfx: no input video: $IN"  >&2; exit 1; }
[[ -f "$CUES" ]] || { echo "mix-sfx: no cues file: $CUES" >&2; exit 1; }
ffprobe -v error -select_streams a -show_entries stream=index -of csv=p=0 "$IN" </dev/null | grep -q . \
  || { echo "mix-sfx: $IN has no audio track — relay the voice first (finish.sh does this)" >&2; exit 1; }

resolve () {
  local s="$1" d
  [[ -f "$s" ]] && { echo "$s"; return 0; }
  for d in "${SFX_DIR:-}" "$SKILL/sfx"; do
    [[ -z "$d" ]] && continue
    for ext in "" .wav .mp3 .m4a .aif .aiff; do
      [[ -f "$d/$s$ext" ]] && { echo "$d/$s$ext"; return 0; }
    done
  done
  return 1
}

inputs=(); filters=(); labels=""; k=0
while read -r t sound gain _; do
  [[ -z "${t:-}" ]] && continue
  [[ "${t:0:1}" == "#" ]] && continue
  [[ -z "${sound:-}" ]] && { echo "mix-sfx: cue missing sound: '$t'" >&2; exit 1; }
  if [[ "$BANNED" == *" $sound "* ]]; then
    echo "mix-sfx: '$sound' is banned in the persa style (ping, swoosh, confirm, beep). Delete the cue." >&2; exit 1
  fi
  path="$(resolve "$sound")" || { echo "mix-sfx: unknown sound '$sound' (run scripts/synth-sfx.py, or set SFX_DIR)" >&2; exit 1; }
  gain="${gain:-$DEFAULT_GAIN}"
  ms="$(awk "BEGIN{printf \"%d\", $t*1000}")"
  k=$((k+1))
  inputs+=( -i "$path" )
  filters+=( "[${k}:a]aformat=sample_rates=48000:channel_layouts=stereo,afade=t=in:st=0:d=0.006,volume=${gain},adelay=${ms}:all=1[s${k}]" )
  labels+="[s${k}]"
done < "$CUES"

[[ $k -gt 0 ]] || { echo "mix-sfx: no cues found in $CUES" >&2; exit 1; }
sfx_chain="$(IFS=';'; echo "${filters[*]}")"
fc="[0:a]aformat=sample_rates=48000:channel_layouts=stereo[vox];${sfx_chain};[vox]${labels}amix=inputs=$((k+1)):normalize=0:duration=first,alimiter=limit=0.95[aout]"

echo "mix-sfx: $k cue(s)  $IN -> $OUT"
ffmpeg -nostdin -hide_banner -loglevel error -y -i "$IN" "${inputs[@]}" \
  -filter_complex "$fc" -map 0:v -map "[aout]" -c:v copy -c:a aac -b:a 256k "$OUT"
echo "mix-sfx: done -> $OUT"
