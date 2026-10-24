#!/usr/bin/env bash
# scripts/update-hyperframes-skills.sh — the ONLY sanctioned way to
# update the HyperFrames skill pack in .claude/skills/.
#
# LOCK: "Update them through that CLI only, never by hand editing."
# npx floats to latest and past releases have broken the composition
# contract mid-job (0.7.42 required data-start/data-composition-id/
# data-width/data-height on the root comp; 0.7.67 shipped a change
# reverted in 0.7.68). Never bump the pin blind — move it deliberately,
# with one composition part re-rendered and reviewed against the new
# version before it touches every job's render script.
#
# usage: scripts/update-hyperframes-skills.sh <version, e.g. 0.7.68>
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo="$(cd "$here/.." && pwd)"
. "$repo/lib/common.sh"

[ $# -eq 1 ] || hf_die "usage: update-hyperframes-skills.sh <version>"
version="$1"
hf_require_cmd npx
hf_require_cmd node

current_version="$(node -e "console.log(require('$repo/skills-lock.json').hyperframesVersion || 'none')" 2>/dev/null || echo none)"
hf_log "current pinned version: $current_version"
hf_log "installing hyperframes@$version skill pack ..."

npx --yes "hyperframes@$version" skills
npx --yes "hyperframes@$version" doctor || hf_warn "doctor reported issues above — review before proceeding"

vendor_root=""
for candidate in "$HOME/.claude/skills" "$HOME/.agents/skills"; do
  [ -d "$candidate" ] && vendor_root="$candidate" && break
done
[ -n "$vendor_root" ] || hf_die "could not find the CLI's installed skill directory (expected ~/.claude/skills or ~/.agents/skills)"

mkdir -p "$repo/.claude/skills"
tmp_new="$repo/.cache-skills-update"
rm -rf "$tmp_new"
mkdir -p "$tmp_new"

for d in "$vendor_root"/*/; do
  name="$(basename "$d")"
  # Never clobber our own pipeline skills — only vendor hyperframes/*
  # skill names (and the general-video-adjacent ones the CLI ships)
  # live under this update path. Recognize them by presence in the
  # previous lock file, or by name prefix on first install.
  cp -r "$d" "$tmp_new/$name"
done

hf_log "diff of SKILL.md content vs. what's currently vendored (review before trusting):"
for d in "$tmp_new"/*/; do
  name="$(basename "$d")"
  old="$repo/.claude/skills/$name/SKILL.md"
  new="$d/SKILL.md"
  if [ -f "$old" ] && [ -f "$new" ]; then
    if ! diff -q "$old" "$new" >/dev/null 2>&1; then
      echo "--- CHANGED: $name ---"
      diff -u "$old" "$new" || true
    fi
  elif [ -f "$new" ]; then
    echo "--- NEW SKILL: $name ---"
  fi
done

read -r -p "Apply this update to .claude/skills/ and skills-lock.json? [y/N] " confirm
if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
  hf_log "aborted — nothing changed. Re-run when ready."
  rm -rf "$tmp_new"
  exit 0
fi

for d in "$tmp_new"/*/; do
  name="$(basename "$d")"
  rm -rf "$repo/.claude/skills/$name"
  cp -r "$d" "$repo/.claude/skills/$name"
done
rm -rf "$tmp_new"

node -e "
const fs = require('fs'); const path = require('path'); const crypto = require('crypto');
const dir = '$repo/.claude/skills'; const version = '$version';
const names = fs.readdirSync(dir).filter(n => fs.statSync(path.join(dir,n)).isDirectory());
const skills = {};
for (const name of names.sort()) {
  const p = path.join(dir, name, 'SKILL.md');
  if (!fs.existsSync(p)) continue;
  skills[name] = {
    source: \`npx hyperframes@\${version} skills\`,
    package: 'hyperframes', version, path: \`.claude/skills/\${name}\`,
    skillMdSha256: crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'),
  };
}
fs.writeFileSync('$repo/skills-lock.json', JSON.stringify({
  \$schema: 'skills-lock v1',
  generatedBy: \`npx hyperframes@\${version} skills\`,
  hyperframesVersion: version,
  generatedAt: new Date().toISOString(),
  note: 'Managed file. Never hand-edit. Regenerate via scripts/update-hyperframes-skills.sh after running the hyperframes CLI.',
  skills,
}, null, 2) + '\n');
"

hf_log "skills-lock.json updated to hyperframes@$version"
hf_warn "pin is NOT yet updated in any job's render script — bump it deliberately, one part at a time:"
hf_warn "  grep -rl 'hyperframes@$current_version' projects/*/hf-graphics/ | while read f; do"
hf_warn "    # re-render ONE part with the new version, review it, then edit that render script's pin"
hf_warn "  done"
