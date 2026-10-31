// The engine: one 2D canvas the scenes draw into → HUD → WebGL post pass → output canvas.
// Every frame is a pure function of track time t (sims re-run deterministically via lib.sim).
import { W, H, FPS, hash } from './lib.js';
import { A } from './audio.js';
import { G } from './gl.js';
import { drawHUD } from './hud.js';

export const E = {
  W, H, FPS, A, G,
  scenes: [], main: null, ctx: null, out: null, fx: null, t: 0, frame: 0, nFrames: 0, errors: [],
};

const FX0 = () => ({
  rgb: 0, glitch: 0, glitchSeed: 0, flash: [1, 1, 1, 0], invert: 0, zoom: 0, vignette: 0.22, grain: 0.045,
  bloom: 0, bloomThreshold: 0.72, warp: 0, saturation: 1, scanlines: 0, mono: 0, tint: [1, 1, 1, 1],
  radialBlur: 0, center: [0.5, 0.5], shake: 0,
});

export function setup(outCanvas, scenes, duration) {
  E.out = outCanvas;
  E.main = document.createElement('canvas'); E.main.width = W; E.main.height = H;
  E.ctx = E.main.getContext('2d');
  E.hud = document.createElement('canvas'); E.hud.width = W; E.hud.height = H; E.hctx = E.hud.getContext('2d');
  G.init(outCanvas);
  E.scenes = scenes; E.duration = duration; E.nFrames = Math.round(duration * FPS);
}

export function sceneAt(t) {
  const S = E.scenes;
  for (let i = S.length - 1; i >= 0; i--) if (t >= S[i].start - 1e-6) return i;
  return 0;
}

/** draw the scene at time t into any 2D context (no HUD, no post). Used for thumbnails / recaps. */
export function drawSceneInto(ctx, t) {
  const idx = sceneAt(t), sc = E.scenes[idx];
  ctx.save(); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  const saved = E.fx; E.fx = FX0();
  try { sc.draw(ctx, t, { lt: t - sc.start, dur: sc.end - sc.start, u: (t - sc.start) / (sc.end - sc.start), start: sc.start, end: sc.end, idx, thumb: true }, E); } catch (e) { /* ignore in thumbs */ }
  E.fx = saved; ctx.restore();
}
/** small thumbnail canvas of the video at time t (cached by key) */
const thumbs = new Map();
export function thumb(t, w = 192, h = 108) {
  const key = `${t.toFixed(3)}|${w}x${h}`; if (thumbs.has(key)) return thumbs.get(key);
  if (!E._big) { E._big = document.createElement('canvas'); E._big.width = W; E._big.height = H; }
  const bx = E._big.getContext('2d'); bx.setTransform(1, 0, 0, 1, 0, 0);
  drawSceneInto(bx, t);
  const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(E._big, 0, 0, w, h);
  thumbs.set(key, c); return c;
}
E.thumb = thumb;

/** render track time t into the output canvas */
export function render(t) {
  const frame = Math.round(t * FPS);
  E.t = t; E.frame = frame;
  const fx = (E.fx = FX0());
  const idx = sceneAt(t), sc = E.scenes[idx];
  const ctx = E.ctx;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none'; ctx.shadowBlur = 0;
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  const lt = t - sc.start, dur = sc.end - sc.start;
  ctx.save();
  try { sc.draw(ctx, t, { lt, dur, u: lt / dur, start: sc.start, end: sc.end, idx }, E); }
  catch (e) {
    ctx.restore(); ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#300'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#f66'; ctx.font = '28px monospace';
    ctx.fillText(`${sc.id}: ${e.message}`.slice(0, 120), 60, H / 2);
    if (!E.errors.find((x) => x.id === sc.id)) { E.errors.push({ id: sc.id, msg: e.message, stack: e.stack }); console.error(sc.id, e); }
  }
  ctx.restore();
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none'; ctx.shadowBlur = 0;

  // cut-in punch on the first frames of every scene (scene can opt out with cutIn:'none')
  const cut = sc.cutIn ?? 'punch', cf = lt * FPS;
  if (cf < 5 && cut !== 'none') {
    const k = 1 - cf / 5;
    if (cut === 'punch') { fx.zoom += 0.05 * k * k; fx.rgb += 6 * k; }
    if (cut === 'flash') { fx.flash = [1, 1, 1, Math.max(fx.flash[3], k * k)]; }
    if (cut === 'glitch') { fx.glitch = Math.max(fx.glitch, k); fx.glitchSeed = frame; fx.rgb += 10 * k; }
    if (cut === 'black' && cf < 1) { fx.flash = [0, 0, 0, 1]; }
  }

  // HUD: its own crisp overlay layer (unaffected by camera FX) unless the scene sets fx.hudFx = true
  const hctx = E.hctx; hctx.setTransform(1, 0, 0, 1, 0, 0); hctx.clearRect(0, 0, W, H);
  if (fx.hudFx) drawHUD(ctx, t, frame, E.nFrames, sc, idx); else drawHUD(hctx, t, frame, E.nFrames, sc, idx);

  // shake → offset via zoom/center
  if (fx.shake > 0) {
    const sx = (hash(frame, 11) - 0.5) * 2 * fx.shake, sy = (hash(frame, 23) - 0.5) * 2 * fx.shake;
    fx.zoom += (fx.shake * 2.4) / W;
    fx.off = [sx / W, sy / H];
  }
  G.post(E.main, fx, frame, E.hud);
}
