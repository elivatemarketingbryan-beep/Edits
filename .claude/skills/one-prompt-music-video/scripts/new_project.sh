#!/bin/bash
# Create a new music-video project from the engine template.
#   bash new_project.sh <name> [parent_dir=~/music-videos]   →  prints the project path
set -e
SKILL="$(cd "$(dirname "$0")/.." && pwd)"
NAME="$1"; PARENT="${2:-$HOME/music-videos}"
[ -n "$NAME" ] || { echo "usage: new_project.sh <name> [parent_dir]"; exit 1; }
DEST="$PARENT/$NAME"
[ -e "$DEST" ] && { echo "already exists: $DEST"; exit 1; }
mkdir -p "$PARENT"; cp -R "$SKILL/engine" "$DEST"; mkdir -p "$DEST/review" "$DEST/renders" "$DEST/song"
cp "$SKILL/references/builders.md" "$DEST/BUILDERS.md"
echo "$DEST"
