# Builder handbook (read this before writing any scene)

A music video (1920×1080, 30 fps) made **100% in code** — no AI images, no AI video, no paid APIs.
**The motion graphics are the star.** Every shot must make a viewer think "how did they do that in code?" and it
must **literally illustrate the lyric** being sung at that moment (`src/shots.js` says exactly what).
The bundled ONE PROMPT example (skill folder `examples/one-prompt/`) is the quality bar — read a few of its scenes.

## The bar
- Showreel grade. Think Buck / Ordinary Folk / the best motion-design reels: bold, bright, crafted, *never* template-y.
- **Constant attention:** nothing is static for more than ~0.4 s. Something hits on every beat (A.beat / A.pulse).
  Camera always drifting/pushing. Hits are instant (0-frame snaps), moves are eased (outExpo/outBack 0.25–0.5 s).
- **One big moment per shot** (the impact, the reveal, the transformation) placed on the key word or downbeat.
- **Literal + readable:** the key word of the lyric appears as big display type (Anton / Rubik Mono One / Bungee /
  Anybody / Monoton / Instrument Serif italic…) for at least ~0.5 s, ≥ 96 px from frame edges.
- Bright by default (see world palettes in `src/shots.js` → `WORLDS`). Only the shots the storyboard marks dark are dark.
- Rich finish: shadows, gloss highlights, grain-friendly flat colour, thick outlines where it suits, depth via parallax/scale.
- Use the mascot **CURSOR** (`drawMascot`) wherever the shot list mentions it. Never draw real brand logos.

## Run it
- Dev player: `cd <project> && python3 -m http.server 8137` → http://127.0.0.1:8137/?scene=V04 (space = play, ←/→ = frame, [ ] = shots)
- **Contact sheet of your scenes (do this a lot, then LOOK at the jpg with the Read tool):**
  `node tools/capture.mjs scenes review/<group>/sheet.jpg "V01,V02,V03" 6 0.25` → 6 evenly spaced frames per scene.
- Specific times: `node tools/capture.mjs sheet review/<group>/x.jpg "9.0,9.1,9.2,9.3" 4 0.33`
- Full-res frames: `node tools/capture.mjs frames review/<group>/full "11.15,11.2"`
- Errors + speed: `node tools/capture.mjs check "V01,V02"` (prints ms/frame; keep avg < 150 ms, max < 400 ms).
- Short draft video of your range (with audio) to judge motion: `node tools/capture.mjs video review/<group>/draft.mp4 <start> <end> 3 --audio --draft`
  then inspect a few frames with ffmpeg if needed. (Rendering takes ~0.1 s/frame/worker.)

## Scene file contract
You own ONLY `src/scenes/<your group>/` (+ you may add helper modules inside that folder, and assets under
`assets/<your group>/` if you generate any in code). **Do not edit `src/core/*`, `src/shots.js`, `src/timeline.js`
or other groups' folders.** If you truly need a core change, describe it in your final report instead.

```js
// src/scenes/g1/V04.js
import { shot } from '../../shots.js';
import { W, H, TAU, PAL, ease, seg, clamp, lerp, rng, noise2, font, fitText, roundRect, buf, bctx } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { drawMascot, pose } from '../../core/mascot.js';

const S = shot('V04');
export default {
  ...S,                  // id, start, end, title, tech, cat, hud ('ink' | 'paper' | 'none'), lyric, desc
  cutIn: 'punch',        // engine FX on the first 5 frames: 'punch' (default) | 'flash' | 'glitch' | 'black' | 'none'
  sfx: [ { t: 13.98, type: 'whoosh' } ],   // optional cues for the sound-design pass (see below)
  async init(E) { /* optional: build geometry, sample points, compile shaders once */ },
  draw(ctx, t, s, E) {
    // t = TRACK time (s). s = { lt (local time since S.start), dur, u (0..1), start, end, idx, thumb }
    // ctx = 1920×1080 2D context, already cleared to black; you paint the whole frame.
    // E.fx = post FX for THIS frame (reset every frame): set fields to use them, e.g.
    //   E.fx.shake = 18 (px) · E.fx.rgb = 8 (px split) · E.fx.flash = [1,1,1,0.6] · E.fx.zoom = 0.04 (punch)
    //   E.fx.glitch = 0..1 + E.fx.glitchSeed = E.frame · E.fx.bloom = 0..1.5 (+bloomThreshold) · E.fx.invert
    //   E.fx.radialBlur = 0..1 (+ E.fx.center=[x,y] in 0..1, y up) · E.fx.warp (barrel) · E.fx.scanlines · E.fx.saturation · E.fx.vignette · E.fx.grain
    //   The HUD is a separate crisp overlay; set E.fx.hudFx = true if your FX should also hit the HUD (e.g. a frame-break glitch).
  },
};
```
Timing: your scene runs from `S.start` until the next scene's start. Do **not** change the first start / last end
of your group. You may override `start` for internal boundaries between two of *your own* consecutive shots
(`{ ...shot('V06'), start: 15.7 }`) when it improves lyric sync — mention it in your report.

## Determinism & performance (hard rules)
- Every frame must be a **pure function of t**. No `Math.random`, `Date.now`, `performance.now`, no rAF timing.
  Use `rng(seed)` / `hash(i,j)` / `noise2/noise3`. Frames are rendered out of order and in parallel processes.
- Stateful simulations (physics, cloth, boids, fluids, CA, reaction-diffusion): advance in fixed steps from the
  scene start: `const st = sim('W04', Math.floor(s.lt * 60), init, (state, i) => step(state))` (lib.sim re-simulates
  from scratch when asked to go back in time). GPU sims: keep your own `{fbo pair, step}`; if the requested step is
  lower than the current one, reset and re-run from 0; cap total steps so a cold start costs < ~1 s.
- **Never create a WebGL context.** Use `G` (shared WebGL2: `G.shader(key, frag, uniforms, w, h)` then
  `G.draw(ctx, result)`; `G.pingpong(w,h)`, `G.program`, `G.pass`, `G.canvasTex(key, canvas)` for sims) and the
  shared Three.js renderer (`renderer()`, `render3d(ctx, scene, camera)`). Build THREE scenes/geometries ONCE
  (init or lazily on first draw) — never allocate per frame. Offscreen 2D canvases: `buf(name, w, h)` (cached) — prefix
  names with your shot id.
- `ctx.filter` blur is slow at full res — use it on small offscreen buffers only. Avoid > ~40k path ops per frame.

## Core API cheat-sheet
**lib.js** — `W H FPS TAU PAL` · `clamp lerp fract smooth smoother seg(t,a,b) map(v,a,b,c,d) pingpong spring(t,f,damp) wobble(t,f,decay)` ·
`ease.{linear,inQuad,outQuad,inOutQuad,inCubic,outCubic,inOutCubic,inQuart,outQuart,inOutQuart,inExpo,outExpo,inOutExpo,outBack,inBack,inOutBack,outElastic,outBounce}` ·
`rng(seed)` (→ f(), .range, .int, .pick, .sign, .gauss) · `hash(i,j,k)` · `noise2 noise3 fbm2` · `hex2rgb rgb mixHex withAlpha hsl` ·
`buf(name,w,h) bctx(c)` · `font(ctx,size,family,weight,style) fitText(ctx,str,x,y,maxW,size,family,weight)` ·
`roundRect star heart rays(ctx,cx,cy,n,r,rot,colA,colB) halftone(ctx,step,color,sizeFn) cover` ·
`textPoints(str,{size,family,weight,step,maxW})` → [{x,y}] centred on 0,0 · `shapePoints(key, drawFn, step)` · `sim(key, step, init, advance)`.
Fonts loaded: Anton · Anybody (variable wdth 50–150 via `font-stretch`, wght 100–900) · JetBrains Mono · Bricolage Grotesque (200–800) ·
Instrument Serif (+italic) · Press Start 2P · Monoton · Rubik Mono One · Bungee · Caveat (handwriting).

**audio.js** (`A`, all by TRACK time) — `A.env(name,t)` names: rms low mid high vocal kick snare hat perc open wide round sss ·
`A.spec(t,i)` / `A.vspec(t,i)` 32 log bands (mix / vocal) · `A.beat(t)` → {i, phase 0..1, last, next, len} · `A.bar(t)` (downbeats) ·
`A.since(kind,t)` / `A.pulse(kind,t,decay)` kinds: kick snare hat perc beat down · `A.eventsIn(kind,a,b)` · `A.mouth(t)` → {open,wide,round,sss,vocal} ·
`A.line(t)` / `A.word(t)` current lyric line/word ({w, t}) · `A.lyrics` · `A.beats` `A.downbeats` (arrays of seconds).
Beat length, downbeats and the lyric word times are in `data/audio.json` (`A.beats`, `A.downbeats`, `A.lyrics`); `data/lyrics_timing.txt` lists every word time.

**mascot.js** — `drawMascot(ctx, {x, y (ground point between the feet), s (1 → ~300 px tall), t, pose, rot, squash, lean, look:[x,y], blink:'auto'|0..1,
eyes:'normal'|'happy'|'wink'|'star'|'heart'|'x'|'shades', mouth:'auto'(lip-sync!)|'smile'|'grin'|'o'|'flat'|'open'|{open,wide,round,sss},
style:'flat'|'line'|'silhouette', colors:{body,ink,…}, sticker:bool (white outline), glyph:bool, alpha, lineGlow:'#hex', over(ctx,P) (props in body space; hands at P.armR / P.armL)})`
→ anchors {head, center, mouth, eyes, hands:{l,r}, feet} in canvas coords.
Poses: idle dance bounce wave point pointYou cheer heart sing fly sit lounge conduct type bow jump surf shrug run (all beat-synced).
`pose(name, t)` returns the limb targets so you can tweak and pass `P:` yourself. `mascotSprite(key, opts, w, h)` → offscreen canvas of the mascot
(sample it for voxels / particles / ASCII / LEDs). `mascotPoints(key, opts, step)` → silhouette points (centred).
Body units: body block 170×230 centred at 0,0; feet at y = 185. Body colour #FF6A1F, ink #1F2A55.

**three.js** — `import { THREE, renderer, render3d, envMap, textGeo, fonts3d, RoundedBoxGeometry, TextGeometry } from '../../core/three.js'`;
`textGeo('ONE PROMPT', {font:'Anton'|'RubikMono'|'Bungee', size, depth, bevel})` centred geometry · `envMap()` studio reflections for chrome.
`render3d(ctx, scene, camera, {toneMapping, exposure})` clears to transparent and composites over whatever you drew before (so you can paint
a 2D background first). Addons available under `three/addons/…` (vendor/jsm).

**engine** — `E.thumb(t, w, h)` renders the video at time t (another scene!) into a small cached canvas — for recap / mosaic / rewind shots.
Build what you need lazily on the first draw (it costs ~10–40 ms per thumb). `E.frame`, `E.t`.

## HUD safe zones (the engine draws the HUD on top)
Top 120 px: REC/cost (left) and frame/clock (right). Bottom-left (x 56–1150, y 950–1030): karaoke subtitle chip.
Bottom-right (x > 1400, y 960–1030): technique tag. Bottom 30 px: spectrum. Keep hero type and faces inside y 130–930.
`hud: 'ink'` = dark HUD text (use on bright scenes), `'paper'` = light HUD text (dark scenes).

## Sound-design cues
Export `sfx: [{ t, type, gain }]` (t = track seconds) for your impacts. Types: whoosh swoosh impact boom click type pop glitch riser ding coin
shatter rip paper bell zap firework tick stamp. Keep it to the moments that matter (1–3 per shot). A separate pass synthesises them.

## Your loop
1. Read `src/shots.js` (your shots + neighbours, WORLDS palette), this file, skim `src/core/*.js`, and read 2–3 scenes from the skill's `examples/one-prompt/src/scenes/` for the quality bar.
2. Build every shot of your group — real, finished scenes, not sketches.
3. Render contact sheets (6+ frames per shot), **open them and look**. Fix anything that is static, empty, off-palette, cramped,
   unreadable, misaligned with the lyric, or simply not impressive. Do at least two improve passes. Check the cut points into your
   neighbours' first/last frames look intentional.
4. `node tools/capture.mjs check "<your ids>"` must report no errors and sane timings.
5. Final report (short): per shot — what it shows, the technique, the big moment, any timing override, known weaknesses.

## Hard-won rules (from the ONE PROMPT build)
- Never call `A.*`, `pose()` or anything audio-dependent at module top level — audio loads after import. Do it inside `init`/`draw`.
- Additive particles ('lighter') saturate to a white blob when dense — lower alpha or the palette's brightness while they cluster.
- Text built from particles reads dim — put a soft glow copy of the word underneath.
- Full-frame flashes wash everything out — keep flash alpha ≤ 0.4 and very short; use E.fx.zoom/rgb/shake for hits instead.
- Keep the character fully in frame on jumps (body centre = y − 185·s); never hide the key word behind the character.
- Bloom (E.fx.bloom) tints orange/yellow characters — threshold ≥ 0.7 when the character is on screen.
- The HUD is drawn on its own crisp layer; don't put hero type under the HUD corners or the subtitle chip.
