# workflow — from a recording to out/final.mp4

`SK=~/.claude/skills/nextphase-screenshare` below. Start **every** shell step
with `source $SK/scripts/env.sh` — non-interactive shells often cannot see
node / ffmpeg otherwise, and every "command not found" is this. It also
defines `hf` (the pinned HyperFrames CLI) and `$SS_PY` (the kit's Python).

Token-budget notes per step are marked **[lean]** / **[max]** (SKILL.md §4).

---

## 0 · Brand check

`cat $SK/brand/brand.md`. If it says UNFILLED, run the setup questions
(SKILL.md §0) before anything else. The answers decide the research depth,
the token budget, captions, sound and the camera side for this video.

## 1 · New project

```bash
bash $SK/scripts/new-video.sh ~/Desktop/my-take.mov my-video     # -> ./videos/my-video/
```
It snapshots your theme (`brand.json`, `assets/tokens.css`) into the project,
copies the template, and makes a 30fps CFR working copy at
`assets/recording.mp4`.

## 2 · Transcribe and tighten

```bash
python3 $SK/scripts/transcribe.py videos/my-video
python3 $SK/scripts/tighten-cuts.py --src videos/my-video/assets/recording.mp4 \
        --transcript videos/my-video/assets/transcript.json \
        --out videos/my-video/assets/recording-tight.mp4
cp videos/my-video/assets/recording-tight.mp4 videos/my-video/assets/cam.mp4
```

- transcribe.py windows anything over 90s (long single passes silently drop
  speech) and reports every stretch of speech-level audio with no words.
  **Resolve those before building.**
- Listen to the joins. A loud dip inside a word ("O | pus") can look like a
  gap; if a cut clips a word, raise `--pad` or `--max-gap`.
- ⚠ After the tighten pass, **`assets/transcript-tight.json` is the only
  timing source.** Timing against the original shows up as "the graphics are
  all slightly early", never as an error.
- Read the transcript for **ad-libbed claims** (numbers, dates, "it came out
  yesterday"). They get verified in step 4 at research level 1+.

## 3 · Inventory the footage — say so if it is wrong for the style

- The camera card is 300×300 in the corner and 560×740 in HALF. Is the
  background plain enough to read at that size?
- Is the subject roughly centred? The card is a centre crop. If not, note the
  offset now (shift the cam with a translate in build.py's `applyCam`, or
  re-frame).
- Is it bright enough for a white caption on FULL beats? (`check-contrast.py`
  will tell you on the render.)

If the footage cannot carry the cards, say so before building anything.

## 4 · Plan the layout track first — get a "go"

Fill `PLAN.md`: for every span, the layout (FULL / HALF / CORNER / PAGE), what
the screen plays, and **where it comes from** — a rebuilt UI (name the product
and the exact clicks), a real capture (URL), or a file the creator supplied.

Targets (demo-mix.md §6): FULL 14–18% · HALF 36–42% · CORNER 32–38% ·
PAGE/no-cam ~10% · a change every 7–9s · ~40% of graphics time in motion.

Research, by level (brand.json):
- **0** — only the creator's files and links. A beat with nothing real stays FULL.
- **1** — verify every number/claim on screen (caption the live figure, flag
  anything stale or wrong); capture every site and product named.
- **2** — also find real supporting examples for each point; flag any clip
  whose rights are unclear *before* it reaches a render.

**Show the plan and wait for a "go".** Fixing structure in comps costs far more.

## 5 · Source and build the screen shares

```bash
# real sites -> assets/captures/  (tall full-page PNGs at 2x)
echo '[{"name":"site-tall","url":"https://example.com","mode":"tall","height":4200,"wait":8000}]' > videos/my-video/jobs.json
node $SK/scripts/capture.js videos/my-video/assets/captures videos/my-video/jobs.json
```
**Look at every PNG.** Login walls, cookie banners and scroll-reveal pages come
back looking plausible and blank. Crop with ffmpeg, never CSS
(`object-view-box` is ignored in renders).

Then write one function per demo in `demos/make_demos.py` (demo-local times =
word onset − beat t0) and:
```bash
python3 videos/my-video/demos/make_demos.py
bash $SK/scripts/render-demos.sh videos/my-video            # -> assets/broll/*.mp4
```
**[lean]** reuse one demo across HALF → CORNER with `media_start` instead of
building two. **[max]** snapshot each demo (`hf snapshot demos/<name>`) and
check the cursor lands on its targets before rendering.

Sourced video clips: re-encode to 30fps CFR with `-g 30` before they enter a
composition (`ffmpeg -i in -r 30 -g 30 -pix_fmt yuv420p out.mp4`) and verify
with ffprobe. A long-GOP clip can render as a black panel.

## 6 · Captions

```bash
python3 videos/my-video/make_captions.py          # -> assets/captions.json
```
Fill `WORD_FIX` / `PHRASE_FIX` / `FUSE` first: speech-to-text is confident and
wrong on product names and jargon. Never caption a guessed word — leave that
span uncaptioned (`NO_CAPTION`). Skip this step if captions are OFF.

## 7 · Beats → segments

Edit `spec.py` (SEGMENTS + BEATS), then:
```bash
python3 videos/my-video/build.py
```
It prints the layout mix against the targets, writes `sfx-cues.txt`, and
generates `seg-NN-*/index.html`.

- Split segments on a FULL beat, on whole frames (t = frame/30). A travel
  cannot cross a segment boundary.
- One continuous camera clip per segment; every travel is a tween on it.
- `immediateRender:false` on every `fromTo`; no `overwrite:"auto"` on a
  same-target chain (it wipes a beat — leave a 1-frame gap instead).
- An overlay needs an explicit `z-index`; track order is not paint order.

## 8 · Gate, preview, render

```bash
bash $SK/scripts/check-screenshare.sh videos/my-video        # static gate
bash $SK/scripts/render.sh videos/my-video --preview         # draft, 540p -> out/preview/
bash $SK/scripts/render.sh videos/my-video                   # final -> out/seg-*.mp4
$SK/scripts/py $SK/scripts/check-contrast.py videos/my-video/out/seg-01-intro.mp4
```
**[lean]** preview only the segment you changed (`--only seg-02-…`) or use
`hf snapshot` stills; render final quality once. **[max]** full-quality render
of every segment, then every gate on every render.

## 9 · Finish

```bash
bash videos/my-video/finish.sh          # concat + voice relay + sfx + optional music
```
⚠ **Chapter timestamps come from `concat-segments.sh`** (out/chapters.txt),
computed from real rendered durations. Never copy them from PLAN.md.

Open `out/final.mp4` for review. **Stop there.** Nothing is published,
posted or uploaded without the creator's explicit approval.
