#!/bin/bash
# Set up the bundled ONE PROMPT example (88 finished shots) as a runnable project.
#   bash example.sh [parent_dir=~/music-videos] [song.mp3]   — the song is optional (from the Google Drive folder)
set -e
SKILL="$(cd "$(dirname "$0")/.." && pwd)"
PARENT="${1:-$HOME/music-videos}"; SONG="$2"; DEST="$PARENT/one-prompt-example"
[ -e "$DEST" ] && { echo "already exists: $DEST"; exit 0; }
mkdir -p "$PARENT"; cp -R "$SKILL/engine" "$DEST"; rm -rf "$DEST/src/scenes/start"
cp -R "$SKILL/examples/one-prompt/src/." "$DEST/src/"; cp "$SKILL/examples/one-prompt/data/"* "$DEST/data/"
cp "$SKILL/examples/one-prompt/project.js" "$DEST/src/project.js"; mkdir -p "$DEST/review" "$DEST/renders"
if [ -n "$SONG" ] && [ -f "$SONG" ]; then ffmpeg -loglevel error -y -i "$SONG" -ar 48000 -ac 2 "$DEST/data/song.wav"; cp "$SONG" "$DEST/data/song.mp3"; fi
echo "$DEST"
