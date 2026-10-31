#!/bin/bash
# Proves the whole pipeline on this machine: synth a 10 s test song → analyse → render frames + a 3 s clip.
set -e
SKILL="$(cd "$(dirname "$0")/.." && pwd)"; PY="$HOME/.one-prompt-mv/venv/bin/python"
T="$HOME/music-videos/_selftest"; rm -rf "$T"; mkdir -p "$HOME/music-videos"
bash "$SKILL/scripts/new_project.sh" _selftest >/dev/null
# a 10 s, 120 BPM test song: kick + snare + hat + a sung-ish vowel melody (no internet, no samples)
ffmpeg -loglevel error -y -f lavfi -i "aevalsrc='0.9*sin(2*PI*55*t)*exp(-12*mod(t,0.5))+0.4*(random(0)-0.5)*exp(-25*mod(t+0.25,0.5))*lt(mod(t+0.25,1),0.5)+0.15*(random(1)-0.5)*exp(-60*mod(t,0.125))+0.35*sin(2*PI*(220+110*lt(mod(t,2),1))*t)*sin(2*PI*5*t)^2:s=48000:d=10'" -ac 2 "$T/data/test.wav"
printf '[verse]\nThis is a test\nOf the music video engine\n' > "$T/song/lyrics.txt"
"$PY" "$SKILL/scripts/analyze.py" --song "$T/data/test.wav" --lyrics "$T/song/lyrics.txt" --project "$T" --bpm 120 --no-demucs --no-whisper
cd "$T"
node tools/capture.mjs check
node tools/capture.mjs sheet review/selftest.jpg "1,3,5,7" 4 0.3
node tools/capture.mjs video renders/selftest.mp4 0 3 2 --audio --draft
[ -s renders/selftest.mp4 ] && [ -s review/selftest.jpg ] && echo "SELFTEST PASSED — look at $T/review/selftest.jpg"
