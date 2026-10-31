// I05 — "Come alive" — CURSOR crouches, jumps on "come", and on "alive" a circle of daylight bursts out of it,
// wiping the night away (paper world + rays + 260 pieces of confetti physics). Lands, cheers, whip-pan into Verse 1.
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, ease, seg, lerp, rng, font, rays, buf, bctx, wobble, halftone } from '../../core/lib.js';
import { drawMascot } from '../../core/mascot.js';
import { nightFloor } from './I04.js';

const S = shot('I05');
const MX = W / 2, GROUND = 780, MS = 1.6;
const JUMP = 7.32, BURST = 7.76, LAND = 8.12, DOWN = 8.47;
const CONF = (() => {
  const r = rng(808), cols = ['#E8343F', '#FF6A1F', '#1F2A55', '#FFD23F', '#FF3E8A', '#2E8BE0'];
  return Array.from({ length: 260 }, () => {
    const a = -Math.PI / 2 + r.gauss() * 0.9, sp = 900 + r() * 1700;
    return { vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, w: 14 + r() * 18, h: 8 + r() * 10, col: r.pick(cols), spin: r.range(6, 16) * r.sign(), ph: r() * TAU, flut: r.range(30, 90), k: r.range(1.6, 3.2) };
  });
})();

function mascotY(t) {
  if (t < JUMP) return GROUND;
  if (t < LAND) { const u = (t - JUMP) / (LAND - JUMP); return GROUND - Math.sin(u * Math.PI) * 190; }
  return GROUND;
}

function dayWorld(ctx, t, cx, cy) {
  ctx.fillStyle = '#F4EDE0'; ctx.fillRect(0, 0, W, H);
  rays(ctx, cx, cy, 28, 2600, t * 0.5, 'rgba(255,106,31,0.16)', 'rgba(232,52,63,0.06)');
  halftone(ctx, 26, 'rgba(31,42,85,0.13)', (x, y) => { const d = Math.hypot(x - cx, y - cy); return 7 * clamp(1 - Math.abs(d - (t - BURST) * 2400 + 300) / 500); });
  // floor
  ctx.fillStyle = '#E9DFCC'; ctx.fillRect(0, GROUND + 10, W, H);
  ctx.fillStyle = 'rgba(31,42,85,0.18)'; ctx.fillRect(0, GROUND + 10, W, 4);
  // ALIVE!
  const k = ease.outBack(seg(t, BURST + 0.04, BURST + 0.3), 2.2);
  if (k > 0) {
    ctx.save(); ctx.translate(W / 2, 215); ctx.scale(k, k); ctx.rotate(-0.04);
    font(ctx, 300, 'Anton'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#E8343F'; ctx.fillText('ALIVE!', 12, 12);
    ctx.fillStyle = '#1F2A55'; ctx.fillText('ALIVE!', 0, 0);
    ctx.restore();
  }
}

function confetti(ctx, t) {
  const tau = t - BURST; if (tau <= 0) return;
  const cy = mascotY(BURST) - 200;
  for (const c of CONF) {
    const dr = (1 - Math.exp(-c.k * tau)) / c.k;
    const x = MX + c.vx * dr + Math.sin(tau * 5 + c.ph) * c.flut * clamp(tau * 2), y = cy + c.vy * dr + 900 * tau * tau * 0.5;
    if (y > H + 40) continue;
    ctx.save(); ctx.translate(x, y); ctx.rotate(c.ph + tau * c.spin);
    ctx.scale(1, Math.cos(tau * c.spin * 1.3 + c.ph)); ctx.fillStyle = c.col; ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h); ctx.restore();
  }
}

export default {
  ...S,
  hud: 'ink', cutIn: 'none',
  sfx: [{ t: JUMP, type: 'swoosh', gain: 0.6 }, { t: BURST, type: 'boom', gain: 1 }, { t: BURST + 0.02, type: 'pop', gain: 0.8 }, { t: LAND, type: 'impact', gain: 0.5 }, { t: DOWN, type: 'whoosh', gain: 0.9 }],
  draw(ctx, t, s, E) {
    const my = mascotY(t);
    const b = buf('I05-frame', W, H), x = bctx(b);
    // night world
    x.save(); nightFloor(x, t); x.restore();
    // day bursts out of CURSOR
    const R = ease.outExpo(seg(t, BURST, BURST + 0.42)) * 2400;
    const cx = MX, cy = my - 230;
    if (R > 1) { x.save(); x.beginPath(); x.arc(cx, cy, R, 0, TAU); x.clip(); dayWorld(x, t, cx, cy); x.restore();
      x.save(); x.strokeStyle = '#FFD23F'; x.lineWidth = 40 * (1 - seg(t, BURST, BURST + 0.42)); x.beginPath(); x.arc(cx, cy, R, 0, TAU); x.stroke(); x.restore(); }
    confetti(x, t);
    // CURSOR: crouch → jump → land → cheer
    let squash = 0, poseName = 'idle', eyes = 'normal', mouth = 'smile';
    if (t < JUMP + 0.02) { squash = 0.22 * seg(t, 7.3, JUMP); }
    else if (t < LAND) { poseName = 'jump'; squash = -0.1; mouth = t > BURST ? 'open' : 'o'; eyes = t > BURST ? 'star' : 'normal'; }
    else { poseName = 'cheer'; eyes = 'star'; mouth = 'grin'; squash = 0.3 * wobble(t - LAND, 4, 7); }
    const spin = t > JUMP && t < LAND ? ease.inOutCubic(seg(t, JUMP + 0.05, LAND - 0.05)) * TAU : 0;
    x.fillStyle = 'rgba(0,0,0,0.25)'; x.beginPath(); x.ellipse(MX, GROUND + 6, 130 * (1 - (GROUND - my) / 600), 18, 0, 0, TAU); x.fill();
    const ms = lerp(MS, 1.22, ease.inOutCubic(seg(t, JUMP, LAND)));
    drawMascot(x, { x: MX, y: my, s: ms, t, pose: poseName, eyes, mouth, squash, rot: spin, sticker: t > BURST });
    // whip pan into the verse
    const whip = ease.inExpo(seg(t, DOWN, 8.68));
    if (whip > 0) {
      ctx.fillStyle = '#F4EDE0'; ctx.fillRect(0, 0, W, H);
      const off = -whip * 2400;
      for (let k = 0; k < 7; k++) { ctx.globalAlpha = k === 0 ? 1 : 0.22; ctx.drawImage(b, off + k * whip * 70, 0); }
      ctx.globalAlpha = 1;
    } else ctx.drawImage(b, 0, 0);
    // FX
    const hb = t >= BURST ? Math.exp(-(t - BURST) * 7) : 0, hl = t >= LAND ? Math.exp(-(t - LAND) * 12) : 0, hd = t >= DOWN ? Math.exp(-(t - DOWN) * 14) : 0;
    E.fx.shake = 34 * hb + 14 * hl; E.fx.rgb = 12 * hb + 6 * hd; E.fx.zoom += 0.06 * hb + 0.04 * hd;
    E.fx.flash = [1, 0.95, 0.85, 0.7 * Math.exp(-(t - BURST) * 18) * (t >= BURST)];
  },
};
