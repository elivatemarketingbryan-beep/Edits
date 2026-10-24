#!/usr/bin/env bash
# scripts/assemble_rough_cut.sh — build the FLATTENED rough cut.
#
# Only needed on the full-render path (graphics/captions/music -> export).
# The default "rough cut this" finish hands the cut list + transcript to
# an editing app instead and skips this entirely (see
# .claude/skills/editing-handoff). Run this explicitly when a job is
# headed for a full HyperFrames render.
#
# usage: scripts/assemble_rough_cut.sh <job-name>
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo="$(cd "$here/../../../.." && pwd)"
. "$repo/lib/common.sh"

[ $# -eq 1 ] || hf_die "usage: assemble_rough_cut.sh <job-name>"
job="$1"
job_dir="$(hf_require_job "$job")"

cutlist_json="$job_dir/cutlist.json"
[ -f "$cutlist_json" ] || hf_die "missing $cutlist_json — run scripts/build_cutlist.py $job first"

raw_source_rel="$(hf_py python -c "import json,sys; print(json.load(open(sys.argv[1]))['source'])" "$cutlist_json")"
raw_source="$job_dir/$raw_source_rel"
[ -f "$raw_source" ] || hf_die "raw source not found: $raw_source"

encoder="$(hf_video_encoder)"
mkdir -p "$job_dir/outputs" "$job_dir/.cache"

assembled="$job_dir/.cache/assembled.mov"
hf_log "assembling lossless cut+concat ($encoder) ..."
hf_py python lib/build_filtergraph.py "$raw_source" "$cutlist_json" "$assembled" "$encoder"

polished="$job_dir/outputs/.roughcut.mp4"
hf_log "polishing audio (single pass: +10dB -> -6dBFS limiter -> AAC 256k) ..."
bash "$repo/lib/polish_audio.sh" "$assembled" "$polished" "$encoder"

hf_log "running mandatory audio QA pass ..."
set +e
hf_py python lib/audio_qa.py "$polished" "$cutlist_json"
qa_status=$?
set -e
if [ "$qa_status" -ne 0 ]; then
  hf_warn "audio QA reported FAIL-level findings above — review before proceeding to graphics"
fi

hf_log "rough cut assembled: $polished"
