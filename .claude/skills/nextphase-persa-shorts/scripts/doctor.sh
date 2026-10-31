#!/usr/bin/env bash
# DOCTOR — check (and with --fix, set up) everything the persa shorts kit needs.
#
#   bash scripts/doctor.sh            # check only, change nothing
#   bash scripts/doctor.sh --fix      # also: private Python env for pillow+numpy, the SFX
#                                     # palette, the renderer's headless Chrome
#   bash scripts/doctor.sh --fix --pages   # also Playwright + Chromium for real page shots (~200 MB)
#
# Everything here is free and local. It never needs your password: system tools (Node, ffmpeg,
# Python) it only REPORTS, with the official install command, and leaves the installing to you.
# It prints "All set" when every REQUIRED check passes.
set -uo pipefail
SKILL="$(cd "$(dirname "$0")/.." && pwd)"
FIX=0; PAGES=0
for a in "$@"; do [[ "$a" == "--fix" ]] && FIX=1; [[ "$a" == "--pages" ]] && PAGES=1; done
OS="$(uname -s)"; ARCH="$(uname -m)"
PRIV="$HOME/.cache/persa-shorts/py"
fail=0; warnc=0
ok ()   { printf "  \033[32mok\033[0m    %-22s %s\n" "$1" "$2"; }
bad ()  { printf "  \033[31mMISSING\033[0m %-20s %s\n" "$1" "$2"; fail=1; }
opt ()  { printf "  \033[33moptional\033[0m %-19s %s\n" "$1" "$2"; warnc=$((warnc+1)); }
hint () { printf "          %s\n" "$1"; }

echo "persa shorts kit — doctor ($OS $ARCH)"
echo "REQUIRED"

# node 22+
if command -v node >/dev/null; then
  NV="$(node -v | sed 's/v//')"; NM="${NV%%.*}"
  if (( NM >= 22 )); then ok node "v$NV"; else bad node "v$NV is too old — need 22+"; hint "install Node.js LTS: https://nodejs.org (or: brew install node)"; fi
else
  bad node "not found"; hint "install Node.js LTS: https://nodejs.org (or: brew install node / winget install OpenJS.NodeJS.LTS)"
fi

# hyperframes (the free, open-source HTML->MP4 renderer, run through npx)
if command -v npx >/dev/null && HV="$(npx --yes hyperframes --version 2>/dev/null | tail -1)" && [[ -n "$HV" ]]; then
  ok hyperframes "$HV"
  if (( FIX )); then npx --yes hyperframes browser ensure >/dev/null 2>&1 && ok "render browser" "ready" || opt "render browser" "could not pre-download; it downloads on first render"; fi
else
  bad hyperframes "npx could not run it"; hint "needs Node 22+ and internet on first run:  npx --yes hyperframes --version"
fi

# ffmpeg with x264 + vp9 (vp9 carries the transparent cut-out)
if command -v ffmpeg >/dev/null && command -v ffprobe >/dev/null; then
  ENC="$(ffmpeg -hide_banner -encoders 2>/dev/null)"
  if grep -q libx264 <<<"$ENC" && grep -q libvpx-vp9 <<<"$ENC"; then ok ffmpeg "$(ffmpeg -version | head -1 | awk '{print $3}') (x264 + vp9)"
  else bad ffmpeg "built without libx264/libvpx-vp9"; hint "install a full build: brew install ffmpeg  ·  winget install Gyan.FFmpeg  ·  apt install ffmpeg"; fi
else
  bad ffmpeg "not found"; hint "brew install ffmpeg  ·  winget install Gyan.FFmpeg  ·  sudo apt install ffmpeg"
fi

# python 3.9+ with pillow + numpy (system, or the kit's private env)
PY=""
if [[ -x "$PRIV/bin/python" ]]; then PY="$PRIV/bin/python"; elif command -v python3 >/dev/null; then PY="python3"; fi
if [[ -z "$PY" ]]; then
  bad python3 "not found"; hint "install Python 3.9+ from https://python.org"
else
  PV="$($PY -c 'import sys;print("%d.%d"%sys.version_info[:2])')"
  if ! $PY -c 'import sys; sys.exit(0 if sys.version_info>=(3,9) else 1)'; then bad python3 "$PV is too old — need 3.9+"
  elif $PY -c 'import PIL, numpy' 2>/dev/null; then ok python "$PV + pillow + numpy ($PY)"
  elif (( FIX )); then
    echo "          creating the kit's private Python env at $PRIV (pillow + numpy, ~40 MB)…"
    python3 -m venv "$PRIV" && "$PRIV/bin/python" -m pip install -q --upgrade pip && "$PRIV/bin/python" -m pip install -q pillow numpy \
      && ok python "private env ready ($PRIV)" || bad python "could not build the private env"
  else bad "pillow/numpy" "not installed for $PY"; hint "run:  bash scripts/doctor.sh --fix   (private env, touches nothing else)"; fi
fi

# the sound palette (synthesised, royalty-free)
if ls "$SKILL/sfx/"*.wav >/dev/null 2>&1; then ok "sfx palette" "$(ls "$SKILL/sfx/"*.wav | wc -l | tr -d ' ') sounds"
elif (( FIX )); then "$SKILL/scripts/py" "$SKILL/scripts/synth-sfx.py" >/dev/null && ok "sfx palette" "synthesised" || bad "sfx palette" "synth failed"
else bad "sfx palette" "not generated yet"; hint "run:  bash scripts/doctor.sh --fix"; fi

# tokens
[[ -f "$SKILL/assets/tokens.css" ]] && ok tokens.css "present" || bad tokens.css "missing — run scripts/py scripts/make-tokens.py"

echo "OPTIONAL"
# transcription engine
if npx --yes hyperframes models list 2>/dev/null | grep -qi "parakeet.*installed"; then ok transcription "parakeet (fast, local)"
else
  if [[ "$OS" == "Darwin" && "$ARCH" == "arm64" ]]; then opt transcription "parakeet not installed — whisper will be used (auto-installs)"; hint "faster + more accurate on Apple Silicon:  npx --yes hyperframes models install parakeet"
  else opt transcription "whisper (auto-installs on first transcribe)"; fi
fi
# cut-out
BG="$(npx --yes hyperframes remove-background --info 2>/dev/null | grep -i 'Weights cached' | awk '{print $3}')"
[[ "$BG" == "yes" ]] && ok "cut-out (quick)" "model cached" || opt "cut-out (quick)" "model (~170 MB) downloads on first use"
[[ -x "$HOME/.cache/persa-shorts/rvm_env/bin/python" ]] && ok "cut-out (best)" "RVM env ready" || opt "cut-out (best)" "not installed — only needed for cutout: best (bash scripts/setup-cutout-best.sh, ~1 GB)"
# sourcing
command -v yt-dlp >/dev/null && ok yt-dlp "$(yt-dlp --version)" || { opt yt-dlp "not found — needed to pull real clips (research level 2)"; hint "brew install yt-dlp  ·  pipx install yt-dlp  ·  winget install yt-dlp"; }
if [[ -n "$PY" ]] && $PY -c 'import playwright' 2>/dev/null; then ok playwright "real page shots available"
elif (( FIX && PAGES )) && [[ -x "$PRIV/bin/python" || -n "$PY" ]]; then
  P2="$PRIV/bin/python"; [[ -x "$P2" ]] || { python3 -m venv "$PRIV"; }
  "$P2" -m pip install -q pillow numpy playwright && "$P2" -m playwright install chromium >/dev/null && ok playwright "installed (private env)" || opt playwright "install failed"
else opt playwright "not installed — needed for 9:16 page shots (scripts/shoot-page-9x16.py)"; hint "bash scripts/doctor.sh --fix --pages"; fi

# brand
if grep -q '"setup_complete": true' "$SKILL/brand/brand.json" 2>/dev/null; then ok brand "set up"
else opt brand "not set up yet — the setup questions run before the first edit"; fi

echo
if (( fail )); then echo "Not ready — fix the MISSING lines above, then run this again."; exit 1; fi
echo "All set"
