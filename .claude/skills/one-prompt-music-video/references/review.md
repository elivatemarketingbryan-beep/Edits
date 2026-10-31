# Review, sound, render, deliver

## Look at everything (you can't watch in real time — contact sheets are your eyes)
```bash
node tools/capture.mjs scenes review/all.jpg all 1 0.2              # one frame per shot: progress overview
node tools/capture.mjs scenes review/rev_a.jpg "V01,V02,…" 4 0.2   # 4 frames per shot, ~15–20 shots per sheet
node tools/capture.mjs sheet review/x.jpg "11.0,11.1,11.2" 3 0.33   # exact moments (hits, transitions)
node tools/capture.mjs check                                        # errors + ms/frame for every shot
```
Open each sheet with the Read tool. For every shot ask: does it show its lyric literally? is the key word readable?
is there a big moment? is anything static, empty, off-palette, cropped, too dark, washed out? does the cut in/out work?
Fix it yourself or SendMessage the builder with precise notes (shot, time, what's wrong, what to do).

Common fixes (all happened in the ONE PROMPT build):
- additive particles become a white blob when dense → lower alpha / darker palette while clustered
- particle text too dim → add a soft glow copy of the word underneath
- full-frame flash washes the frame → flash ≤ 0.4 alpha, use zoom/rgb/shake for the hit
- character leaves the frame on a jump / hides the key word → smaller jump, move the type
- bloom turns the orange character yellow → bloomThreshold ≥ 0.7 when it's on screen
- a 3D object too close to the lens on impact → start the fly-in closer to its resting depth
- a work-in-progress file crashed the boot → the engine isolates import errors; never touch audio at module top level

## Sound design (optional, $0 — synthesised from math, no samples)
```bash
node tools/capture.mjs cues data/cues.json
~/.one-prompt-mv/venv/bin/python tools/sfx.py data/cues.json      # → data/mix.wav (+ data/sfx_bus.wav)
```
Effects sit ~9 dB under the music (≈ -13 LUFS total). Check: `ffmpeg -i data/mix.wav -af ebur128 -f null - 2>&1 | grep " I:"`.
You can't hear it — tell the user to listen, and always deliver a song-only version too.

## Render
```bash
AUDIO=data/mix.wav node tools/capture.mjs video renders/<name>.mp4 0 end 6 --audio
```
(~7 min for 2:45 on an M-series Mac with 6 workers; `--draft` = fast 540p preview.) Verify:
`ffprobe -v error -show_entries format=duration:stream=nb_frames,width,height renders/<name>.mp4`; scan for black:
`ffmpeg -i renders/<name>.mp4 -vf "scale=320:-1,blackdetect=d=0.15:pix_th=0.06" -an -f null - 2>&1 | grep black_start`;
grab frames either side of each worker seam (duration/6 multiples) to confirm sims continue.

## Deliver
- `<name>.mp4` (with effects) · `<name>_song-only.mp4` (remux: `ffmpeg -i v.mp4 -i data/song.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 320k -shortest out.mp4`)
- a share copy (`-crf 20`) · open the main one for the user (`open` on macOS)
- A/B against another version of the same song: `tools/compare.sh <other.mp4> <this.mp4> <out.mp4> [seconds]`
- Tell them how to scrub and tweak: `python3 -m http.server 8137` in the project → http://127.0.0.1:8137/?scene=V04
