#!/bin/bash
# Install ACE-Step 1.5 (MIT, open source) for $0 local song generation.
# Needs: Apple Silicon Mac with 16 GB+ RAM, or an NVIDIA GPU with 6 GB+ VRAM. ~15 GB disk for the code + models.
set -e
DEST="${ACE_STEP_DIR:-$HOME/.one-prompt-mv/ACE-Step-1.5}"
command -v uv >/dev/null || curl -LsSf https://astral.sh/uv/install.sh | sh
export PATH="$HOME/.local/bin:$PATH"
command -v git >/dev/null || { echo "git is missing (macOS: xcode-select --install)"; exit 1; }
if [ ! -d "$DEST" ]; then mkdir -p "$(dirname "$DEST")"; git clone --depth 1 https://github.com/ACE-Step/ACE-Step-1.5.git "$DEST"; fi
cd "$DEST" && uv sync
echo "ACE-Step installed at $DEST (models download on the first song, ~10 GB)."
