#!/usr/bin/env bash
# OPTIONAL — the "best" cut-out mode (RVM). Only needed if brand.json says "cutout": "best".
# The default "quick" mode uses HyperFrames' built-in background removal and needs none of this.
#
# Creates a private Python environment at ~/.cache/persa-shorts/rvm_env (NOT /tmp — macOS
# purges /tmp and the environment silently disappears). Downloads roughly 1 GB (PyTorch) plus a
# 15 MB model on first use. Nothing outside that folder and ~/.cache/torch is touched.
set -euo pipefail
ENV="$HOME/.cache/persa-shorts/rvm_env"
PY="${PYTHON:-python3}"
command -v "$PY" >/dev/null || { echo "need python3 (python.org or your package manager)"; exit 1; }
if [[ -x "$ENV/bin/python" ]] && "$ENV/bin/python" -c "import torch, cv2, numpy" 2>/dev/null; then
  echo "RVM environment already ready at $ENV"; exit 0
fi
mkdir -p "$(dirname "$ENV")"
if command -v uv >/dev/null; then
  uv venv "$ENV" --python 3.11 >/dev/null 2>&1 || uv venv "$ENV"
  uv pip install --python "$ENV/bin/python" torch torchvision opencv-python numpy pillow
else
  "$PY" -m venv "$ENV"
  "$ENV/bin/python" -m pip install --upgrade pip >/dev/null
  "$ENV/bin/python" -m pip install torch torchvision opencv-python numpy pillow
fi
echo "warming the model cache (downloads ~15 MB once)..."
"$ENV/bin/python" - <<'PY'
import torch
torch.hub.load("PeterL1n/RobustVideoMatting", "mobilenetv3", trust_repo=True)
print("RVM model ready")
PY
echo "All set: cut-out mode 'best' is available ($ENV)"
