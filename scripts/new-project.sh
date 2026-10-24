#!/usr/bin/env bash
# scripts/new-project.sh — scaffold projects/<job-name>/
#
# usage: scripts/new-project.sh <kebab-case-job-name>
#
# Job names are kebab-case titles about the CONTENT, never the camera
# filename (e.g. "why-your-standups-suck", not "c0043.mp4").
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo="$(cd "$here/.." && pwd)"
. "$repo/lib/common.sh"

[ $# -eq 1 ] || hf_die "usage: new-project.sh <kebab-case-job-name>"
job="$1"

kebab="$(hf_kebab "$job")"
if [ "$job" != "$kebab" ]; then
  hf_die "'$job' isn't kebab-case. Did you mean: $kebab ?"
fi
case "$job" in
  *.mp4|*.mov|*.MP4|*.MOV|c[0-9]*|C[0-9]*|IMG_*|DSC*|GX*)
    hf_warn "'$job' looks like a camera filename, not a content title — job names should describe the content" ;;
esac

job_dir="$repo/projects/$job"
[ -d "$job_dir" ] && hf_die "projects/$job already exists"

mkdir -p \
  "$job_dir/raw" \
  "$job_dir/audio" \
  "$job_dir/assets" \
  "$job_dir/broll" \
  "$job_dir/outputs" \
  "$job_dir/hf-graphics" \
  "$job_dir/transcript" \
  "$job_dir/.cache"

sed "s/{{JOB}}/$job/g; s/{{DATE}}/$(date +%Y-%m-%d)/g" \
  "$repo/lib/templates/PROJECT.md.template" > "$job_dir/hf-graphics/PROJECT.md"

sed "s/{{JOB}}/$job/g" "$repo/lib/templates/finalize.sh" > "$job_dir/finalize.sh"
sed "s/{{JOB}}/$job/g" "$repo/lib/templates/prune.sh" > "$job_dir/prune.sh"
chmod +x "$job_dir/finalize.sh" "$job_dir/prune.sh"

cat > "$job_dir/transcript/corrections.json" <<'EOF'
{
  "corrections": []
}
EOF

hf_log "created projects/$job/"
hf_log "next: copy the raw file into projects/$job/raw/, then run the rough-cut skill"
