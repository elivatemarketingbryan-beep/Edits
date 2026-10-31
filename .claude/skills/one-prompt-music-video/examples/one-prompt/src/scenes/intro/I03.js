// I03 — "Watch it come alive" — the prompt shatters into ~12k particles → spiral galaxy → the particles spell ALIVE
// on "alive" (3.25 s) → they let go and collapse into a vortex, ready to become CURSOR in I04.
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, ease, seg, lerp, rng, font } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { particles, galaxy, vortex, drawStreaks } from './particles.js';
import { NIGHT } from './common.js';

const S = shot('I03');
const WORDS = [{ w: 'WATCH', t: 2.38 }, { w: 'IT', t: 2.7 }, { w: 'COME', t: 3.02 }];
const g = [0, 0], v = [0, 0];

function pos(i, t, out) {
  const P = particles(), d = P.D[i];
  const u1 = ease.outExpo(seg(t, 2.38, 2.75));
  let x = lerp(P.X0[i], P.BX[i], u1), y = lerp(P.Y0[i], P.BY[i], u1);
  const u2 = ease.inOutCubic(seg(t, 2.5 + d * 0.2, 3.15));
  if (u2 > 0) { galaxy(i, t, g); x = lerp(x, g[0], u2); y = lerp(y, g[1], u2); }
  const u3 = ease.outExpo(seg(t, 3.2 + d * 0.1, 3.5 + d * 0.1));
  const u3out = ease.inCubic(seg(t, 3.82 + d * 0.12, 4.12 + d * 0.12));
  if (u3 > 0 && u3out < 1) {
    const jig = Math.sin(t * 20 + i) * 1.5;
    const k = u3 * (1 - u3out);
    x = lerp(x, P.AX[i] + jig, k); y = lerp(y, P.AY[i] + jig, k);
  }
  const u4 = ease.inCubic(seg(t, 3.85 + d * 0.15, 4.3));
  if (u4 > 0) { vortex(i, t, v, lerp(1.6, 1, u4)); x = lerp(x, v[0], u4); y = lerp(y, v[1], u4); }
  out[0] = x; out[1] = y;
}

export default {
  ...S,
  hud: 'paper', cutIn: 'none',
  sfx: [{ t: 2.38, type: 'boom', gain: 1 }, { t: 2.4, type: 'shatter', gain: 0.6 }, { t: 3.25, type: 'impact', gain: 0.8 }, { t: 3.85, type: 'riser', gain: 0.6 }],
  init() { particles(); },
  draw(ctx, t, s, E) {
    // deep space
    ctx.fillStyle = NIGHT.bg; ctx.fillRect(0, 0, W, H);
    const voc = A.env('vocal', t);
    const gl = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 900);
    const core = seg(t, 2.6, 3.1) * (1 - seg(t, 3.12, 3.24)) + seg(t, 3.8, 4.3) * 0.8;
    gl.addColorStop(0, `rgba(255,140,60,${0.2 + core * 0.45 + voc * 0.15})`); gl.addColorStop(0.4, `rgba(90,50,160,${0.18 + core * 0.15})`); gl.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H);
    const r = rng(5);
    for (let i = 0; i < 220; i++) { const x = r() * W, y = r() * H, z = r(); ctx.fillStyle = `rgba(255,251,244,${0.15 + 0.5 * z})`; const px = (x + (t - 2.38) * 40 * z) % W; ctx.fillRect(px, y, 2, 2); }

    // big kinetic words over the galaxy
    for (let k = 0; k < WORDS.length; k++) {
      const wd = WORDS[k], next = WORDS[k + 1]?.t ?? 3.2;
      if (t < wd.t || t >= next) continue;
      const a = t - wd.t, sc = 1 + 0.5 * Math.exp(-a * 14);
      ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(sc, sc);
      font(ctx, 300, 'Anton'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.globalAlpha = 0.9; ctx.shadowColor = 'rgba(255,106,31,0.9)'; ctx.shadowBlur = 40; ctx.fillStyle = '#FFFBF4'; ctx.fillText(wd.w, 0, 10);
      ctx.restore();
    }
    // ALIVE glow word under the particles
    const al = ease.outExpo(seg(t, 3.22, 3.4)) * (1 - seg(t, 3.8, 4.0));
    if (al > 0) {
      ctx.save(); ctx.globalAlpha = al * 0.55; ctx.translate(W / 2, H / 2); const sc = 1 + 0.06 * Math.exp(-(t - 3.25) * 10); ctx.scale(sc, sc);
      font(ctx, 470, 'Anton'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.shadowColor = '#FF6A1F'; ctx.shadowBlur = 80; ctx.fillStyle = '#FF7A2F'; ctx.fillText('ALIVE', 0, 0);
      ctx.restore();
    }
    // particles (dimmer while the galaxy is dense, thicker while they spell ALIVE)
    const dense = seg(t, 2.7, 3.0) * (1 - seg(t, 3.2, 3.35)) + seg(t, 3.95, 4.3);
    drawStreaks(ctx, t, pos, { width: 2.4 + al * 1.6, alpha: 1 - dense * 0.5 });
    // galaxy core
    if (core > 0) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const c2 = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 160); c2.addColorStop(0, `rgba(255,230,200,${core * 0.9})`); c2.addColorStop(1, 'rgba(255,120,40,0)');
      ctx.fillStyle = c2; ctx.fillRect(W / 2 - 200, H / 2 - 200, 400, 400); ctx.restore();
    }
    // FX
    const hitA = t >= 2.38 ? Math.exp(-(t - 2.38) * 8) : 0, hitB = t >= 3.25 ? Math.exp(-(t - 3.25) * 9) : 0;
    E.fx.shake = 30 * hitA + 18 * hitB; E.fx.rgb = 14 * hitA + 8 * hitB;
    E.fx.flash = [1, 0.85, 0.7, 0.8 * Math.exp(-(t - 2.38) * 20)];
    E.fx.bloom = 1.1; E.fx.bloomThreshold = 0.45;
    E.fx.zoom += 0.05 * hitB + 0.03 * seg(t, 3.9, 4.3);
  },
};
