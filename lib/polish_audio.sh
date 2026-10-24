#!/usr/bin/env bash
# lib/polish_audio.sh — the ONE audio polish pass. Never call this more
# than once per job on the same material, and never apply any of this
# per-segment.
#
# LOCK: "polish the assembled track exactly once: static +10 dB gain,
# then a -6 dBFS limiter, then AAC 256k. Never dynamic loudnorm (it
# pumps), never per-segment audio FX (clicks). Any re-encode after that
# must match or exceed 256k."
#
# usage: polish_audio.sh <assembled.mov> <out_with_polished_audio.mp4> [video_encoder]
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
. "$here/common.sh"

[ $# -ge 2 ] || hf_die "usage: polish_audio.sh <in> <out> [video_encoder]"
in="$1"; out="$2"; enc="${3:-$(hf_video_encoder)}"

hf_require_cmd ffmpeg

# -6dBFS as a linear ceiling for alimiter: 10^(-6/20)
LIMIT_LINEAR="0.501187"

# level=disabled avoids alimiter's automatic input-level makeup gain —
# we already applied a deliberate, static +10dB gain ourselves, and
# don't want the limiter re-deciding loudness dynamically (that's the
# "pumping" behavior loudnorm produces, which this pipeline forbids).
# NOTE on -b:a 256k: measured directly against real ffmpeg output, the
# native `aac` encoder's rate control is content-adaptive, not true
# CBR — a near-silent or very low-complexity passage can measure well
# under the requested 256k afterward (a pure test tone measured ~142k;
# -minrate/-maxrate/-bufsize do NOT fix this for the native aac
# encoder, confirmed by testing, so they're not applied here). Real
# dialogue is spectrally complex enough that this rarely bites in
# practice, but treat a post-encode bitrate check (workflows/probe-
# format.sh) as approximate, not a hard gate — the thing that actually
# matters is that 256k was the REQUESTED target, which it is here.
# `libfdk_aac` has better rate control but isn't in stock ffmpeg builds
# (licensing) — if your build has it, prefer `-c:a libfdk_aac -b:a 256k`.
ffmpeg -y -i "$in" \
  -filter:a "volume=10dB,alimiter=limit=${LIMIT_LINEAR}:level=disabled:attack=5:release=50" \
  -c:v copy \
  -c:a aac -b:a 256k \
  "$out"

hf_log "polished audio written: $out (gain +10dB -> limiter -6dBFS -> AAC 256k, single pass)"
