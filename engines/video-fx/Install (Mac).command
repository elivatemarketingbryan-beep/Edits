#!/bin/bash
# Double-click to install Claude Video FX (macOS).
cd "$(dirname "$0")" || exit 1
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js isn't installed. Get the LTS version from https://nodejs.org, then double-click this file again."
  read -r -p "Press Enter to close."
  exit 1
fi
node install.mjs
read -r -p "Press Enter to close."
