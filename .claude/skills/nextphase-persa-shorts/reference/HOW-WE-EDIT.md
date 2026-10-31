# HOW WE EDIT — the build, and the traps that cost renders

**The one rule that matters most: never call a cut done from a snapshot. Sample the rendered mp4.**
The preview path and the render path disagree, and the preview lies.

---

## 1 · The HyperFrames contract

**Visibility is owned by CLIPS.** Every timed element carries
`class="clip" data-start data-duration data-track-index`. Without those the framework paints the
element for the whole composition — one early cut had every graphic and every caption on screen
for all 52 seconds, and the snapshots looked perfect. `build.py` emits every element correctly; if
you hand-edit `index.html`, keep the contract.

- **Paint order is z-index, not track index.** `persa-roles.css` sets it per layer:
  camera 1 · surface 2 · card 3 · card cut-out 4 · vignette 5 · display type 6 · occluder 7 ·
  floating window 8 · caption 9. An overlay with no z-index can paint UNDER the footage and vanish
  while every gate passes.
- **A `<video>` nested inside a timed element renders FROZEN.** The camera card's wrapper is
  untimed; the video inside it is the clip, with its own id.
- **Every concurrent element owns its own track.** Captions alternate two lanes.
- **Every `<video>` is muted.** The render is silent on purpose (the voice would play once per
  layer); `finish.sh` relays the voice from the take, frame-exact.
- The composition is `data-no-timeline`: no GSAP, no tweens. Everything hard-cuts on word onsets,
  which is also the style.

## 2 · One take, one framing, one matte

- `new-video.py` normalises the take to **1080×1920, 30fps CFR** once. Every downstream tool
  assumes it. Log/HLG footage (some phones and action cams) is decoded to Rec.709 first with
  `scripts/camera-decode.py` — never grade or matte a log file.
- **Matte the whole take once** (`cutout.py`). Three spans matted separately gave three framings
  and read as broken.
- The card geometry is solved from the measured head top in `geometry.json`. Never hardcode it.

## 3 · Timing

- **The transcript is the only clock.** Every beat boundary and every display word sits on a real
  word onset from `assets/transcript.json`. Round-number timings are banned — they read as "the
  graphics are slightly early".
- A product shows up **on the word** that names it, not after.
- Exit at the beat boundary; display words exit ~0.1s before the next beat.
- **ASR fixes are caption TEXT only:** `beats.json "fixes": {"19": "Acme", "22": ""}` keyed by
  word index. Never edit times. Brand names, numbers and the CTA keyword are the usual slips.
- **Fact-check the script BEFORE the beat map.** A loose claim can often be made true by the
  picture (show the exact leaderboard the claim is true on) — but only if you catch it before the
  beats are built around it.

## 4 · Sourcing is step one, not step five
Find the real media, show it to the creator, get a yes — then build (SOURCING.md). Media found
halfway through a build gets cut in unchecked.

## 5 · Writing beats.json

```json
{"start": 13.20, "end": 31.40, "kind": "ui", "src": "assets/ui/demo.mp4", "media_start": 3.0}
```
- beats are contiguous and cover the whole take (build.py warns otherwise)
- `ui` surfaces: a 1080×1920 page shot (`shoot-page-9x16.py`) or a vertical screen recording.
  A landscape recording: crop the region that matters to 9:16 with ffmpeg first — never letterbox
- split a long demo into several `ui` beats that jump (`media_start`) to the moment each named
  feature is on screen
- `"caps": false` on a beat where the picture already says the words
- See `template/beats.example.json` for every kind and overlay.

## 6 · The gates — in this order, every time
```bash
python3 build.py                                    # read every WARN line
npx --yes hyperframes check .                       # 0 errors; read the contrast lines
scripts/py <skill>/scripts/check-density.py .       # no gap > 6s (moving media excused)
# walk reference/BLACKLIST.md "the test before you render"
```
`text_occluded` infos on the title stack and CTA are expected — the head passing in front is the
move (`build.py` marks them allowed). A contrast failure on an annotation means the UI is light:
move the claim (TYPE-ROLES role 9).

## 7 · Render, then LOOK
```bash
npx --yes hyperframes render . -o out/visual.mp4 -q draft      # previews
npx --yes hyperframes render . -o out/visual.mp4 -q delivery   # the final
scripts/py <skill>/scripts/contact-sheet.py out/visual.mp4 --at <beat middles>
```
Read the contact sheet image yourself before showing anyone. Check: head breaks the card edge,
nothing floats in a box, every display word is on screen whole, captions on one line.

## 8 · Finish
```bash
bash <skill>/scripts/finish.sh .        # voice → sfx (if on) → music (if on) → out/<slug>-FINAL.mp4
```
Then open it for review. **Publish nothing.**

## 9 · Working with the creator
- **Show, do not describe.** A rough page or frame beats a paragraph.
- They will tell you exactly what is wrong, per timecode. Take it literally.
- When they correct something that will come up again, offer to write it into `brand/brand.md`
  so the next video starts from it.
