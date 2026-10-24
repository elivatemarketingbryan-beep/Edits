#!/usr/bin/env bash
# .claude/skills/graphics-plan/scripts/scaffold-graphics.sh
#
# Scaffolds projects/<job>/hf-graphics/ with a thin index.html orchestrator,
# a compositions/ dir for per-part sub-compositions, and render scripts
# that PIN the HyperFrames CLI version literally (read from the repo's
# current skills-lock.json at scaffold time, then baked into this job's
# own scripts as a fixed string — later repo-wide version bumps do NOT
# silently move this job; see scripts/update-hyperframes-skills.sh).
#
# usage: scaffold-graphics.sh <job-name> <9x16|16x9>
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo="$(cd "$here/../../../.." && pwd)"
. "$repo/lib/common.sh"

[ $# -eq 2 ] || hf_die "usage: scaffold-graphics.sh <job-name> <9x16|16x9>"
job="$1"; format="$2"
job_dir="$(hf_require_job "$job")"

case "$format" in
  9x16) width=1080; height=1920 ;;
  16x9) width=1920; height=1080 ;;
  *) hf_die "format must be 9x16 or 16x9" ;;
esac

hf_require_cmd node
version="$(node -e "console.log(require('$repo/skills-lock.json').hyperframesVersion)")"
[ -n "$version" ] || hf_die "could not read hyperframesVersion from skills-lock.json"

gfx="$job_dir/hf-graphics"
mkdir -p "$gfx/compositions"

if [ ! -f "$gfx/index.html" ]; then
  cat > "$gfx/index.html" <<EOF
<!DOCTYPE html>
<!--
  $job — shared timeline, $format ($width x $height).
  THIN orchestrator: slots + timing + audio only. Every scene's real
  content and animation lives in its own compositions/part-NN.html
  sub-composition (see hyperframes-core/references/sub-compositions.md
  and composition-patterns.md) so a tweak re-renders one part, not the
  whole video.
-->
<html>
<head><meta charset="utf-8"></head>
<body>
  <div id="root" data-start="0" data-composition-id="$job" data-width="$width" data-height="$height">
    <!-- one <div data-composition-src="compositions/part-01.html" data-start="0" data-duration="..."> per beat -->
  </div>
</body>
</html>
EOF
  hf_log "wrote $gfx/index.html (fill in slots per the beat sheet before building parts)"
else
  hf_log "$gfx/index.html already exists — not overwritten"
fi

render_part="$gfx/render-part.sh"
cat > "$render_part" <<EOF
#!/usr/bin/env bash
# Fast iteration: render ONE part. Re-run after every tweak to that part
# only — never re-renders the whole timeline.
# PINNED: hyperframes@$version — see root skills-lock.json for how this
# gets moved (deliberately, one part re-rendered and reviewed at a time).
set -euo pipefail
[ \$# -eq 1 ] || { echo "usage: render-part.sh <part-file, e.g. compositions/part-01.html>" >&2; exit 1; }
cd "\$(dirname "\${BASH_SOURCE[0]}")"
npx --yes hyperframes@$version render -c "\$1" -o "dist/\$(basename "\${1%.html}").mp4" --quality draft
EOF
chmod +x "$render_part"

render_final="$gfx/render-final.sh"
cat > "$render_final" <<EOF
#!/usr/bin/env bash
# Full-quality single-pass render of the whole shared timeline, for
# final delivery once every part has been reviewed individually.
# PINNED: hyperframes@$version
set -euo pipefail
cd "\$(dirname "\${BASH_SOURCE[0]}")"
mkdir -p dist
npx --yes hyperframes@$version render --quality high -o "../outputs/${job}-graphics.mp4"
EOF
chmod +x "$render_final"

mkdir -p "$gfx/dist"
hf_log "graphics scaffold ready at $gfx/ (pinned to hyperframes@$version)"
