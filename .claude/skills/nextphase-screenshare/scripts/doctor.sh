#!/usr/bin/env bash
# doctor.sh — check (and where it is free and safe, fix) everything the skill needs.
#
#   bash ~/.claude/skills/nextphase-screenshare/scripts/doctor.sh
#   bash ~/.claude/skills/nextphase-screenshare/scripts/doctor.sh --install-speech
#
# Fixes on its own, without sudo and without spending money:
#   * numpy into a private venv (~/.cache/nextphase-screenshare/venv) if your Python lacks it
#   * the HyperFrames renderer (npx) and its headless Chrome
#   * GSAP (the animation library) into assets/vendor/
#   * the sound palette, synthesised in code into sfx/
#   * --install-speech: the on-device Parakeet speech model (Apple Silicon)
# Tells you how to install, but never installs by itself: Node.js, ffmpeg, Python.
# Re-run it until it prints "All set".
SK="$(cd "$(dirname "$0")/.." && pwd)"
source "$SK/scripts/env.sh"
INSTALL_SPEECH=0; [ "${1:-}" = "--install-speech" ] && INSTALL_SPEECH=1
OS="$(uname -s)"; ARCH="$(uname -m)"
BAD=0
ok(){ printf '  ok    %-14s %s\n' "$1" "$2"; }
no(){ printf '  MISSING %-12s %s\n' "$1" "$2"; BAD=1; }
warn(){ printf '  note  %-14s %s\n' "$1" "$2"; }

echo "nextphase-screenshare doctor  ($OS $ARCH)"

# ── Node.js 22+ ─────────────────────────────────────────────────────────────
if command -v node >/dev/null 2>&1; then
  NV="$(node -v | sed 's/^v//')"; NM="${NV%%.*}"
  if [ "$NM" -ge 22 ] 2>/dev/null; then ok node "v$NV"
  else no node "v$NV is too old — need 22+. Install the LTS from https://nodejs.org (or: brew install node)"; fi
else
  case "$OS" in
    Darwin) no node "install the LTS from https://nodejs.org, or: brew install node";;
    Linux)  no node "install Node 22+ via https://nodejs.org or your package manager (or nvm)";;
    *)      no node "install the LTS from https://nodejs.org (on Windows, run this kit inside WSL)";;
  esac
fi

# ── ffmpeg / ffprobe ────────────────────────────────────────────────────────
if command -v ffmpeg >/dev/null 2>&1 && command -v ffprobe >/dev/null 2>&1; then
  ok ffmpeg "$(ffmpeg -version 2>/dev/null | head -1 | awk '{print $3}')"
else
  case "$OS" in
    Darwin) no ffmpeg "brew install ffmpeg   (Homebrew: https://brew.sh)";;
    Linux)  no ffmpeg "sudo apt install ffmpeg   (or your distro's package)";;
    *)      no ffmpeg "winget install ffmpeg, or inside WSL: sudo apt install ffmpeg";;
  esac
fi

# ── Python 3.9+ and numpy ───────────────────────────────────────────────────
if command -v python3 >/dev/null 2>&1 && python3 -c 'import sys; sys.exit(0 if sys.version_info>=(3,9) else 1)'; then
  ok python "$(python3 -V 2>&1 | awk '{print $2}')"
  if "$SS_PY" -c 'import numpy' 2>/dev/null; then
    ok numpy "$("$SS_PY" -c 'import numpy;print(numpy.__version__)')"
  else
    echo "  ..    numpy          installing into a private venv (no sudo, nothing system-wide)"
    VENV="$HOME/.cache/nextphase-screenshare/venv"
    python3 -m venv "$VENV" >/dev/null 2>&1 && "$VENV/bin/pip" install -q numpy >/dev/null 2>&1
    if "$HOME/.cache/nextphase-screenshare/venv/bin/python" -c 'import numpy' 2>/dev/null; then
      SS_PY="$HOME/.cache/nextphase-screenshare/venv/bin/python"; ok numpy "installed in the private venv"
    else no numpy "could not install — try: python3 -m pip install --user numpy"; fi
  fi
else
  no python "need Python 3.9+ — https://www.python.org/downloads/ (or: brew install python)"
fi

# ── HyperFrames + its headless Chrome ───────────────────────────────────────
if command -v npx >/dev/null 2>&1; then
  HV="$(hf --version 2>/dev/null | tail -1)"
  if [ -n "$HV" ]; then ok hyperframes "$HV (pinned; override with HF_VERSION)"
  else no hyperframes "npx -y hyperframes@$HF_VERSION --version failed — check your internet connection"; fi
  if hf browser ensure >/dev/null 2>&1; then ok chrome "$(hf browser path 2>/dev/null | tail -1)"
  else no chrome "npx hyperframes browser ensure failed — re-run with a working connection"; fi
else
  no hyperframes "needs Node.js (npx) first"
fi

# ── speech-to-text engine ───────────────────────────────────────────────────
if command -v npx >/dev/null 2>&1; then
  if hf models list 2>/dev/null | grep -qi "parakeet.*installed"; then
    ok speech "Parakeet (on-device)"
  elif [ "$OS" = "Darwin" ] && [ "$ARCH" = "arm64" ]; then
    if [ $INSTALL_SPEECH -eq 1 ]; then
      echo "  ..    speech         installing the Parakeet model (free, on-device, one-time download)"
      if hf models install parakeet; then ok speech "Parakeet installed"
      else warn speech "Parakeet install failed — whisper will be installed on first transcription instead"; fi
    else
      warn speech "Parakeet not installed — re-run with --install-speech (recommended on Apple Silicon)"
    fi
  else
    warn speech "whisper will be installed by HyperFrames on the first transcription (or: brew install whisper-cpp)"
  fi
fi

# ── GSAP (fetched, not bundled) ─────────────────────────────────────────────
GS="$SK/assets/vendor/gsap.min.js"
if [ ! -s "$GS" ] || ! head -c 200 "$GS" | grep -q GSAP; then
  mkdir -p "$SK/assets/vendor"
  curl -fsSL "https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js" -o "$GS" 2>/dev/null \
    || curl -fsSL "https://unpkg.com/gsap@3.14.2/dist/gsap.min.js" -o "$GS" 2>/dev/null
fi
if [ -s "$GS" ] && head -c 200 "$GS" | grep -q GSAP; then ok gsap "$(head -c 60 "$GS" | grep -o 'GSAP [0-9.]*')"
else no gsap "could not download GSAP 3.14.2 from jsdelivr/unpkg — check your connection"; fi

# ── sound palette (synthesised, royalty-free) ───────────────────────────────
if [ ! -f "$SK/sfx/peaks.json" ]; then python3 "$SK/scripts/synth-sfx.py" >/dev/null; fi
if [ -f "$SK/sfx/share-on.wav" ]; then ok sfx "$(ls "$SK"/sfx/*.wav | wc -l | tr -d ' ') sounds in sfx/"
else no sfx "python3 scripts/synth-sfx.py failed"; fi

# ── optional ────────────────────────────────────────────────────────────────
if command -v yt-dlp >/dev/null 2>&1; then ok yt-dlp "$(yt-dlp --version 2>/dev/null)"
else warn yt-dlp "optional (deep research: pulling short clips). brew install yt-dlp / pipx install yt-dlp"; fi

# ── theme ───────────────────────────────────────────────────────────────────
if grep -q '"filled": true' "$SK/brand/brand.json" 2>/dev/null; then ok brand "filled — $(grep -o '"ground": "[a-z]*"' "$SK/brand/brand.json")"
else warn brand "not set up yet — Claude asks the setup questions on first use"; fi

echo
if [ $BAD -eq 0 ]; then echo "All set"; exit 0; fi
echo "Not ready yet — install the MISSING items above, then re-run this script."; exit 1
