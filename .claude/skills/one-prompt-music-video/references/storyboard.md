# Storyboard — writing `src/shots.js`

Open `examples/one-prompt/src/shots.js` first: 88 shots for a 2:45 song is the bar (a new picture every ~1.9 s).

## Timing
- Use `data/lyrics_timing.txt`: one shot per lyric phrase; split long lines at commas / key words
  ("No After Effects, | no studio, | no team" = three shots). Instrumental gaps get their own shots (builds, risers).
- Cut on a word onset or a downbeat (`A.downbeats` in audio.json). Fast lists (Download it / install it / paste it /
  press go) can be 0.5 s shots — that rhythm is the point.
- `start` of each shot = its first word (or the downbeat just before). The engine shows a shot until the next starts.

## Every shot = a literal picture of its words
"hit enter" → a giant ENTER key slams (manga impact frame). "no team" → cardboard crew falls like dominoes.
"every shape is a line" → Fourier epicycles draw the mascot with ONE line. "every beat lands right" → a drum machine
lighting on the song's REAL drum hits. Never generic "pretty background + lyric".

## Every shot = a different technique (never the same trick twice in a row; no trick more than 2–3 times)
Library used in ONE PROMPT (label each shot's `tech` + `cat` — the HUD shows it, viewers love it):
infinite zoom-out through nested worlds · typewriter + keystroke visualiser · text → 12k particles → galaxy · particles
→ character · radial wipe + confetti physics · Three.js 3D keyboard · manga impact frame · glyph wave (Gerstner) ·
Droste recursion · pixel-sort melt · paper fold 3D · rigid-body dominoes · code → 3D geometry · Fourier epicycles ·
film strip + grease pencil · easing-function race · LED-matrix lip-sync · self-editing UI timeline · flight instruments ·
spectrogram ridgelines from the real vocal · mechanical odometer · boids flock spelling a word · credit roll · neon line
tracing · recursive tiling ×256 · extruded 3D type · slit-scan · radial audio visualiser · Voronoi glass shatter · voxel
pop-out · Ben-Day comic panel · onion-skin echoes · domain-warp marble shader · 2.5D parallax flight · sky-writing ·
confetti everything-at-once · gravitational lensing · datamosh glitch · pop-up window storm + cursor swarm · endless
contract scroll · verlet cloth tearing · firework particles · raymarched SDF morph · 3D product shot · progress-bar
overflow · perspective text crawl · recursive paste · shockwave distortion · stable fluids (Navier–Stokes) · kaleidoscope
· step sequencer on real drum data · starfield constellation · slot machine · 3D coin rain · metaball drip · banner cloth
drop · verlet rope · zoom-through · chrome countdown · voxel city · live ASCII renderer · frame-break glitch · 2D→3D
pop-out · Muybridge chronophotography · bullet-time orbit · Game of Life · Gray–Scott reaction-diffusion · 3D button +
pendulum bell · petal flutter + bokeh · 3D type tunnel · crowd → image · L-system tree · slow-mo impact · god rays ·
page curl with the video's own frames · VHS rewind of the video itself · card-flip stadium wall · torn-paper layers ·
voxel fly-through · halftone shockwave · continuous world tour · photomosaic of the video's own frames · sunrise ·
ribbon unfurl · flipbook recap · lens flare · reverse transformation · end card.

## Worlds, pacing, structure
- One colour world per section (`WORLDS` in shots.js) — bright by default, 1–2 dark sections for contrast.
- Intro: the first 3 s must stop the scroll (a hook with a giant move). Chorus 1 = the first explosion; final chorus =
  everything at once, palette swapping per beat; outro bookends the intro.
- Recap shots can render earlier moments of the video itself with `E.thumb(t)` (storybook, VHS rewind, flipbook, mosaic).

## Format
```js
S('V02', 'g1', 'verse1', 10.30, 11.62, 'hit enter,', 'ENTER impact', 'MANGA IMPACT FRAME', 'COMICS', 'ink',
  '"hit": a huge ENTER keycap looms, CURSOR winds up. On "enter" (11.12) SLAM: 3 frames of manga impact …'),
```
id · group (one builder per group, ~8–10 shots, consecutive) · world · start · end · lyric · title · tech (HUD tag) ·
cat (HUD sub-tag) · hud ('ink' bright scene / 'paper' dark scene / 'none') · desc (what we SEE, the big moment and
its exact time). Descriptions are the builders' only brief — make them vivid and specific.
