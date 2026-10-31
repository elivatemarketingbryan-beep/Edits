#!/usr/bin/env bash
# env.sh — source this at the top of every step:   source "<skill>/scripts/env.sh"
#
# Non-interactive shells (the kind Claude Code runs commands in) often do not
# load your shell profile, so node / ffmpeg installed through nvm, Homebrew or
# ~/.local/bin are "command not found" even though they work in your terminal.
# This puts the usual install locations on PATH, newest Node first.
# (every line here must exit 0: callers run under `set -e`)
_ss_prepend(){ case ":$PATH:" in *":$1:"*) ;; *) if [ -d "$1" ]; then PATH="$1:$PATH"; fi;; esac; return 0; }
_ss_prepend /usr/local/bin
_ss_prepend /opt/homebrew/bin
_ss_prepend "$HOME/.local/bin"
_ss_prepend "$HOME/.volta/bin"
_ss_prepend "$HOME/.fnm/aliases/default/bin"
if [ -d "$HOME/.nvm/versions/node" ]; then
  _ss_newest=$(ls -1 "$HOME/.nvm/versions/node" 2>/dev/null | sed 's/^v//' | sort -t. -k1,1n -k2,2n -k3,3n | tail -1)
  if [ -n "$_ss_newest" ]; then _ss_prepend "$HOME/.nvm/versions/node/v$_ss_newest/bin"; fi
fi
export PATH
# the renderer, pinned to a version this kit was tested with (override: export HF_VERSION=latest)
export HF_VERSION="${HF_VERSION:-0.8.145}"
hf(){ npx -y "hyperframes@${HF_VERSION}" "$@"; }
# the kit's private Python (numpy lives here if your system Python lacks it)
SS_VENV="$HOME/.cache/nextphase-screenshare/venv"
if [ -x "$SS_VENV/bin/python" ]; then SS_PY="$SS_VENV/bin/python"; else SS_PY="$(command -v python3)"; fi
export SS_PY
