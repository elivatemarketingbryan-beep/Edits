#!/usr/bin/env bash
# .claude/skills/music/scripts/mix_music_bed.sh — one flat music bed
# under the already-polished dialogue. ONE mix pass, no automation
# curve, no per-segment anything — consistent with the audio locks:
# never dynamic loudnorm, never per-segment FX, any re-encode must
# match or exceed 256k AAC.
#
# usage: mix_music_bed.sh <job-name> <music-file> [bed_db_below_dialogue, default -18]
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo="$(cd "$here/../../../.." && pwd)"
. "$repo/lib/common.sh"

[ $# -ge 2 ] || hf_die "usage: mix_music_bed.sh <job-name> <music-file> [bed_db_below_dialogue]"
job="$1"; music="$2"; bed_offset_db="${3:-18}"
job_dir="$(hf_require_job "$job")"

hf_require_cmd ffmpeg
hf_require_cmd ffprobe

[ -f "$music" ] || hf_die "music file not found: $music"

# newest render is whatever this job has furthest along: captioned ->
# graphics -> roughcut.
video=""
for candidate in "$job_dir/outputs/${job}-captioned.mp4" "$job_dir/outputs/${job}-graphics.mp4" "$job_dir/outputs/.roughcut.mp4"; do
  if [ -f "$candidate" ]; then video="$candidate"; break; fi
done
[ -n "$video" ] || hf_die "no rendered video found in $job_dir/outputs — run rough-cut/graphics-plan first"

dialogue_bitrate="$(ffprobe -v error -select_streams a:0 -show_entries stream=bit_rate -of default=noprint_wrappers=1:nokey=1 "$video" | head -1)"
hf_log "using video: $video (dialogue audio bitrate: ${dialogue_bitrate:-unknown})"

mkdir -p "$job_dir/assets"
cp -n "$music" "$job_dir/assets/$(basename "$music")" 2>/dev/null || true

out="$job_dir/outputs/${job}-music.mp4"

# Flat bed: static volume offset on the music (bed_offset_db quieter
# than unity), looped/trimmed to video length, mixed once with the
# dialogue as-is (no ducking automation — "flat bed under the voice").
# duration_of_shortest input via amix normalize=0 keeps levels honest
# (amix's default normalize would quietly halve dialogue level).
ffmpeg -y -i "$video" -stream_loop -1 -i "$music" \
  -filter_complex "[1:a]volume=-${bed_offset_db}dB[bed];[0:a][bed]amix=inputs=2:duration=first:normalize=0[aout]" \
  -map 0:v -map "[aout]" \
  -c:v copy \
  -c:a aac -b:a 256k \
  -shortest \
  "$out"

hf_log "music bed mixed: $out (bed at -${bed_offset_db}dB under dialogue, flat, single pass, AAC 256k)"
