#!/usr/bin/env bash
# new_project.sh <name>: a fresh video folder with the worked example to copy from.
SK="$(cd "$(dirname "$0")/.." && pwd)"
P="$HOME/editor-v3/videos/$1"
[ -n "$1" ] || { echo "usage: new_project.sh <name>"; exit 1; }
[ -e "$P" ] && { echo "already there: $P"; exit 1; }
mkdir -p "$P/raw" "$P/pictures" "$P/work/gen/clips" "$P/work/out" "$P/out"
cp -R "$SK/template/." "$P/"
echo "$P"
