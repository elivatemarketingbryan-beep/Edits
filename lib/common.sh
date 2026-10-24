#!/usr/bin/env bash
# lib/common.sh — shared helpers for every pipeline script.
# Written for stock bash 3.2 (macOS default) AND Linux/WSL2 bash.
# Rules for anyone editing this file:
#   - no associative arrays (declare -A)
#   - no ${var,,} / ${var^^} case folding (bash 4+ only) — use tr instead
#   - no `mapfile` / `readarray` — use a while-read loop instead
#   - the ONLY platform branch anywhere in this codebase is the video
#     encoder pick (see hf_video_encoder below). Everything else must
#     work identically on macOS and Linux.

set -euo pipefail

# ---- OS detection --------------------------------------------------------

hf_os() {
  # Prints "macos", "linux", or "other".
  case "$(uname -s)" in
    Darwin) echo "macos" ;;
    Linux)  echo "linux" ;;
    *)      echo "other" ;;
  esac
}

# ---- Encoder pick (THE one platform branch in this whole repo) ----------

hf_video_encoder() {
  if [ "$(hf_os)" = "macos" ]; then
    echo "h264_videotoolbox"
  else
    echo "libx264"
  fi
}

# Encoder-specific quality flags. videotoolbox uses -q:v (1-100, higher is
# better); libx264 uses -crf (0-51, lower is better). Callers pass a single
# 0-100 "quality" knob and this maps it.
hf_video_quality_flags() {
  # usage: hf_video_quality_flags <encoder> <0-100 quality, default 80>
  enc="$1"
  q="${2:-80}"
  if [ "$enc" = "h264_videotoolbox" ]; then
    printf -- "-q:v %s" "$q"
  else
    # invert 0-100 quality into a 0-51 crf: quality 80 -> crf ~14
    crf=$(( (100 - q) * 51 / 100 ))
    printf -- "-crf %s -preset medium" "$crf"
  fi
}

# ---- logging --------------------------------------------------------------

hf_log()  { printf '[hf] %s\n' "$*" >&2; }
hf_warn() { printf '[hf][WARN] %s\n' "$*" >&2; }
hf_err()  { printf '[hf][ERROR] %s\n' "$*" >&2; }
hf_die()  { hf_err "$*"; exit 1; }

# ---- dependency checks ------------------------------------------------

hf_require_cmd() {
  cmd="$1"
  command -v "$cmd" >/dev/null 2>&1 || hf_die "required command not found: $cmd (run ./check-setup.sh)"
}

# ---- job path helpers ------------------------------------------------

# All paths are resolved relative to the repo root, found by walking up
# from this file's location, so scripts work no matter the caller's cwd.
hf_repo_root() {
  script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  cd "$script_dir/.." && pwd
}

hf_job_dir() {
  # usage: hf_job_dir <job-name>
  echo "$(hf_repo_root)/projects/$1"
}

hf_require_job() {
  job="$1"
  dir="$(hf_job_dir "$job")"
  [ -d "$dir" ] || hf_die "no such project: projects/$job (run scripts/new-project.sh $job first)"
  echo "$dir"
}

# ---- frame grid helpers (ffprobe-backed) ------------------------------

hf_fps() {
  # usage: hf_fps <video-file>  -> prints fps as a decimal, e.g. 29.97
  ffprobe -v error -select_streams v:0 \
    -show_entries stream=r_frame_rate \
    -of default=noprint_wrappers=1:nokey=1 "$1" | \
  awk -F'/' '{ if ($2 > 0) printf "%.6f", $1/$2; else printf "%.6f", $1 }'
}

hf_duration() {
  # usage: hf_duration <media-file> -> seconds, decimal
  ffprobe -v error -show_entries format=duration \
    -of default=noprint_wrappers=1:nokey=1 "$1"
}

hf_sample_rate() {
  ffprobe -v error -select_streams a:0 \
    -show_entries stream=sample_rate \
    -of default=noprint_wrappers=1:nokey=1 "$1"
}

# ---- misc ---------------------------------------------------------------

hf_kebab() {
  # crude kebab-caser for job-name validation/suggestions. ASCII only.
  printf '%s' "$1" | tr '[:upper:]' '[:lower:]' | tr -cs 'a-z0-9' '-' | sed 's/^-*//; s/-*$//'
}

hf_require_uv() {
  hf_require_cmd uv
}

hf_py() {
  # Run a project python script through uv so pinned deps resolve
  # consistently on macOS and Linux, without polluting system python.
  hf_require_uv
  ( cd "$(hf_repo_root)" && uv run --project . "$@" )
}
