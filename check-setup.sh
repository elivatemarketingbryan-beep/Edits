#!/usr/bin/env bash
# check-setup.sh — report-only dependency check for the content pipeline.
# Targets macOS or WSL2 Ubuntu. Never installs anything; only tells you
# what's missing and the right command to fix it for YOUR OS.
#
# Bash 3.2 safe (macOS default bash). No associative arrays, no ${x,,}.
set -uo pipefail  # deliberately not -e: we want to run every check

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

OK=0
MISSING=0
WARN=0

pass() { printf '  \033[32mOK\033[0m      %s\n' "$1"; OK=$((OK+1)); }
fail() { printf '  \033[31mMISSING\033[0m %s\n' "$1"; [ -n "${2:-}" ] && printf '          fix: %s\n' "$2"; MISSING=$((MISSING+1)); }
warn() { printf '  \033[33mWARN\033[0m    %s\n' "$1"; [ -n "${2:-}" ] && printf '          %s\n' "$2"; WARN=$((WARN+1)); }

# ---- OS ---------------------------------------------------------------

OS="$(uname -s)"
case "$OS" in
  Darwin) PLATFORM="macos" ;;
  Linux)
    PLATFORM="linux"
    if grep -qi microsoft /proc/version 2>/dev/null || [ -n "${WSL_DISTRO_NAME:-}" ]; then
      PLATFORM="wsl2"
    fi
    ;;
  *) PLATFORM="other" ;;
esac

echo "=== Platform ==="
case "$PLATFORM" in
  macos) pass "macOS ($(sw_vers -productVersion 2>/dev/null || echo unknown))" ;;
  wsl2)  pass "WSL2 (${WSL_DISTRO_NAME:-unknown distro})" ;;
  linux) pass "Linux (native or container)" ;;
  other) warn "unrecognized platform ($OS)" "this pipeline targets macOS or WSL2 Ubuntu; the video encoder branch and PIL install instructions below assume one of those" ;;
esac
echo

# ---- ffmpeg / ffprobe ---------------------------------------------------

echo "=== ffmpeg / ffprobe ==="
if command -v ffmpeg >/dev/null 2>&1; then
  pass "ffmpeg: $(ffmpeg -version 2>/dev/null | head -1)"
else
  case "$PLATFORM" in
    macos) fail "ffmpeg not found" "brew install ffmpeg" ;;
    *)     fail "ffmpeg not found" "sudo apt update && sudo apt install ffmpeg" ;;
  esac
fi
if command -v ffprobe >/dev/null 2>&1; then
  pass "ffprobe: $(ffprobe -version 2>/dev/null | head -1)"
else
  fail "ffprobe not found" "installed alongside ffmpeg — see above"
fi

if command -v ffmpeg >/dev/null 2>&1; then
  if [ "$PLATFORM" = "macos" ] && ffmpeg -hide_banner -encoders 2>/dev/null | grep -q h264_videotoolbox; then
    pass "h264_videotoolbox encoder available"
  elif [ "$PLATFORM" != "macos" ] && ffmpeg -hide_banner -encoders 2>/dev/null | grep -q libx264; then
    pass "libx264 encoder available"
  else
    warn "expected video encoder not found in this ffmpeg build" "macOS needs h264_videotoolbox; Linux/WSL2 needs libx264 (usually the ffmpeg-full / non-minimal package)"
  fi
fi
echo

# ---- node / npx ---------------------------------------------------------

echo "=== Node.js ==="
if command -v node >/dev/null 2>&1; then
  pass "node $(node -v)"
else
  fail "node not found" "install via https://nodejs.org or your OS package manager / nvm"
fi
if command -v npx >/dev/null 2>&1; then
  pass "npx $(npx -v)"
else
  fail "npx not found" "ships with node >= 5.2 — reinstall node"
fi
echo

# ---- uv -------------------------------------------------------------------

echo "=== uv (Python toolchain) ==="
if command -v uv >/dev/null 2>&1; then
  pass "uv $(uv --version 2>/dev/null | awk '{print $2}')"
else
  fail "uv not found" "curl -LsSf https://astral.sh/uv/install.sh | sh"
fi
echo

# ---- python3 + PIL --------------------------------------------------------

echo "=== Python + PIL ==="
py_version_output="$(python3 --version 2>&1 || true)"
if command -v python3 >/dev/null 2>&1 && echo "$py_version_output" | grep -qE '^Python [0-9]+\.[0-9]+'; then
  pass "python3 $(echo "$py_version_output" | awk '{print $2}')"
  if python3 -c "import PIL" >/dev/null 2>&1; then
    pass "PIL (Pillow) importable by system python3"
  else
    case "$PLATFORM" in
      macos) fail "PIL not importable" "python3 -m pip install --user pillow   (or: brew install pillow)" ;;
      *)     fail "PIL not importable" "sudo apt install python3-pil   (NEVER 'pip install pillow' as root/bare — Debian/Ubuntu externally-managed-environment will fight you or silently install somewhere check-setup.sh won't see)" ;;
    esac
  fi
else
  case "$PLATFORM" in
    macos) fail "python3 not found" "brew install python3" ;;
    *)     fail "python3 not found" "sudo apt install python3 python3-pil" ;;
  esac
fi

# WhisperX lives in the uv-managed project venv (pyproject.toml), not
# system python. --no-sync is deliberate: this script is report-only
# and must never trigger an install (whisperx pulls in torch — multiple
# GB). We only look at whatever env already exists.
if command -v uv >/dev/null 2>&1; then
  if (cd "$here" && uv run --project . --no-sync python -c "import whisperx" >/dev/null 2>&1); then
    pass "whisperx resolvable via uv project env"
  else
    warn "whisperx not yet resolved in the uv project env" "run 'uv sync' once (large download — includes torch) before the first rough-cut; check-setup.sh will never trigger this for you"
  fi
fi
echo

# ---- HyperFrames skill pack integrity -------------------------------------

echo "=== HyperFrames skill pack ==="
lock="$here/skills-lock.json"
if [ ! -f "$lock" ]; then
  fail "skills-lock.json missing" "npx hyperframes@0.7.68 skills && npx hyperframes@0.7.68 doctor, then see scripts/update-hyperframes-skills.sh"
elif command -v node >/dev/null 2>&1; then
  # scratch lives under the repo, never /tmp (macOS clears it — same
  # rule this pipeline holds for every job's build artifacts).
  scratch_dir="$here/.cache-checksetup"
  mkdir -p "$scratch_dir"
  scratch="$scratch_dir/lock-check.$$"
  node -e '
    const fs = require("fs");
    const path = require("path");
    const crypto = require("crypto");
    const here = process.argv[1];
    const lock = JSON.parse(fs.readFileSync(path.join(here, "skills-lock.json"), "utf8"));
    let ok = 0, bad = 0, missing = 0;
    for (const [name, meta] of Object.entries(lock.skills || {})) {
      const p = path.join(here, meta.path, "SKILL.md");
      if (!fs.existsSync(p)) { console.log(`MISSING ${name} (expected at ${meta.path})`); missing++; continue; }
      const sha = crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
      if (sha !== meta.skillMdSha256) { console.log(`MODIFIED ${name} — SKILL.md does not match skills-lock.json (hand-edited? re-run scripts/update-hyperframes-skills.sh)`); bad++; }
      else ok++;
    }
    console.log(`__SUMMARY__ ${ok} ${bad} ${missing} ${lock.hyperframesVersion || "unknown"}`);
  ' "$here" > "$scratch" 2>&1 || true
  summary_line="$(grep '__SUMMARY__' "$scratch" 2>/dev/null || true)"
  grep -v '__SUMMARY__' "$scratch" 2>/dev/null | while read -r line; do
    [ -n "$line" ] && warn "$line"
  done
  rm -rf "$scratch_dir"
  if [ -n "$summary_line" ]; then
    ok_n=$(echo "$summary_line" | awk '{print $2}')
    bad_n=$(echo "$summary_line" | awk '{print $3}')
    miss_n=$(echo "$summary_line" | awk '{print $4}')
    pinned=$(echo "$summary_line" | awk '{print $5}')
    if [ "$bad_n" = "0" ] && [ "$miss_n" = "0" ]; then
      pass "$ok_n skill(s) verified against skills-lock.json (pinned hyperframes@$pinned)"
    fi
  fi
else
  warn "node not available to verify skill hashes"
fi
echo

# ---- repo structure --------------------------------------------------

echo "=== Repo structure ==="
for d in projects workflows presets lib scripts .claude/skills; do
  if [ -d "$here/$d" ]; then
    pass "$d/"
  else
    fail "$d/ missing" "this looks like an incomplete checkout of this content system"
  fi
done
if [ -d "$HOME/Downloads" ]; then
  pass "~/Downloads exists (finalize.sh copies exports there)"
else
  warn "~/Downloads does not exist" "finalize.sh will create it on first use"
fi
echo

# ---- summary --------------------------------------------------------------

echo "=== Summary ==="
echo "  $OK ok, $WARN warning(s), $MISSING missing"
if [ "$MISSING" -gt 0 ]; then
  echo "  Fix the MISSING items above before running the pipeline."
  exit 1
elif [ "$WARN" -gt 0 ]; then
  echo "  No hard blockers, but review the warnings above."
  exit 0
else
  echo "  Everything checks out."
  exit 0
fi
