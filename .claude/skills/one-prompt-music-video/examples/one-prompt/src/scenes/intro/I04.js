// I04 — "(come alive)" — the vortex of particles lands on CURSOR's silhouette, it materialises with a flash,
// its eyes pop open, it looks around, notices the camera and waves. Synthwave night floor with a glossy reflection.
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, ease, seg, lerp, rng, font, buf, bctx, roundRect, wobble } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { drawMascot, pose } from '../../core/mascot.js';
import { particles, vortex, drawStreaks } from './particles.js';
import { NIGHT, MONO } from './common.js';

const S = shot('I04');
const MX = W / 2, MY = 780, MS = 1.6; // matches mascotPoints() layout
const v = [0, 0];
const OPEN = 5.45;

export function nightFloor(ctx, t, horizon = 600, glowX = W / 2) {
  const g = ctx.createLinearGradient(0, 0, 0, horizon); g.addColorStop(0, '#05060F'); g.addColorStop(1, '#1C1544'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, horizon);
  const r = rng(9);
  for (let i = 0; i < 160; i++) { const x = r() * W, y = r() * horizon * 0.9; ctx.fillStyle = `rgba(255,251,244,${0.2 + 0.5 * r() * (0.6 + 0.4 * Math.sin(t * 5 + i))})`; ctx.fillRect(x, y, 2, 2); }
  const hg = ctx.createRadialGradient(glowX, horizon, 0, glowX, horizon, 900); hg.addColorStop(0, 'rgba(255,106,31,0.55)'); hg.addColorStop(1, 'rgba(255,106,31,0)'); ctx.fillStyle = hg; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#0B0820'; ctx.fillRect(0, horizon, W, H - horizon);
  // perspective grid
  ctx.save(); ctx.strokeStyle = 'rgba(255,106,31,0.7)'; ctx.lineWidth = 2; ctx.shadowColor = '#FF6A1F'; ctx.shadowBlur = 12;
  ctx.beginPath();
  for (let i = -24; i <= 24; i++) { ctx.moveTo(W / 2 + i * 18, horizon); ctx.lineTo(W / 2 + i * 260, H + 40); }
  const scroll = (t * 0.9) % 1;
  for (let k = 0; k < 14; k++) { const z = (k + 1 - scroll) / 14, y = horizon + (H - horizon) * z * z; ctx.moveTo(0, y); ctx.lineTo(W, y); }
  ctx.stroke(); ctx.restore();
  ctx.fillStyle = 'rgba(255,170,90,0.9)'; ctx.fillRect(0, horizon - 1, W, 2);
}

function floatingGlyphs(ctx, t, n = 60) {
  const r = rng(77), G = '{}();=>[]</>01$#*+';
  font(ctx, 26, MONO, '700'); ctx.textAlign = 'center';
  for (let i = 0; i < n; i++) {
    const x = r() * W, sp = 30 + r() * 60, y = ((r() * H - (t - 4.3) * sp) % H + H) % H, a = 0.15 + 0.35 * r();
    ctx.fillStyle = `rgba(255,140,70,${a})`; ctx.fillText(G[Math.floor(r() * G.length)], x, y * 0.8);
  }
}

export function mascotWithReflection(ctx, opts, floorY) {
  const b = buf('I04-mascot', W, H), x = bctx(b);
  x.clearRect(0, 0, W, H); const anc = drawMascot(x, opts);
  // reflection
  ctx.save(); ctx.globalAlpha = 0.22; ctx.translate(0, floorY * 2); ctx.scale(1, -1);
  ctx.beginPath(); ctx.rect(0, floorY, W, H); ctx.clip(); ctx.drawImage(b, 0, 0); ctx.restore();
  // contact shadow
  ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.ellipse(opts.x, floorY + 4, 170 * opts.s * 0.8, 22 * opts.s, 0, 0, TAU); ctx.fill();
  ctx.drawImage(b, 0, 0);
  return anc;
}

export default {
  ...S,
  hud: 'paper', cutIn: 'none',
  sfx: [{ t: 5.05, type: 'boom', gain: 0.9 }, { t: OPEN, type: 'pop', gain: 1 }, { t: 5.75, type: 'swoosh', gain: 0.3 }, { t: 6.1, type: 'swoosh', gain: 0.3 }, { t: 6.62, type: 'ding', gain: 0.6 }],
  init() { particles(); },
  draw(ctx, t, s, E) {
    const P = particles();
    const push = 1 + 0.12 * ease.inOutCubic(s.u);
    ctx.save(); ctx.translate(MX, 520); ctx.scale(push, push); ctx.translate(-MX, -520);
    nightFloor(ctx, t);
    floatingGlyphs(ctx, t);

    const born = 5.05;
    // particles: vortex → silhouette, then burst away as sparkles
    if (t < born + 0.6) {
      const pos = (i, tt, out) => {
        const d = P.D[i];
        vortex(i, tt, v, 1);
        const u = ease.inOutCubic(seg(tt, 4.3 + d * 0.3, 4.72 + d * 0.3));
        let x = lerp(v[0], P.MX[i], u), y = lerp(v[1], P.MY[i], u);
        if (tt > born) { const k = ease.outCubic(seg(tt, born, born + 0.6)); const dx = P.MX[i] - MX, dy = P.MY[i] - 480; x += dx * k * (0.6 + d); y += dy * k * (0.6 + d) - k * 120 * d; }
        out[0] = x; out[1] = y;
      };
      drawStreaks(ctx, t, pos, { width: 2.6, alpha: t > born ? 1 - seg(t, born, born + 0.6) : 0.95 });
    }

    if (t >= born) {
      // expression timeline
      const P0 = pose('idle', t);
      let look = [0, 0], eyes = 'normal', mouth = 'smile', blink = 1, squash = 0, poseName = 'idle';
      if (t >= OPEN) blink = 'auto';
      if (t < OPEN) { blink = 1; squash = 0.04 * Math.sin((t - born) * 9); }
      else if (t < OPEN + 0.08) blink = 1 - (t - OPEN) / 0.08;
      if (t >= OPEN) { squash = 0.18 * wobble(t - OPEN, 5, 6); mouth = t < OPEN + 0.35 ? 'o' : 'smile'; }
      if (t >= 5.72 && t < 6.05) { look = [-1, 0]; }
      if (t >= 6.05 && t < 6.38) { look = [1, 0]; }
      if (t >= 6.38) { look = [0, 0.15]; }
      if (t >= 6.42 && t < 6.62) { eyes = 'star'; mouth = 'o'; }
      if (t >= 6.62) { poseName = 'wave'; eyes = 'happy'; mouth = 'grin'; }
      const lean = t >= 5.72 && t < 6.38 ? look[0] * 0.08 : 0;
      const glow = 1 - seg(t, born, born + 0.5);
      const anc = mascotWithReflection(ctx, { x: MX, y: MY, s: MS, t, pose: poseName, look, eyes, mouth, blink, squash, lean, lineGlow: glow > 0.05 ? '#FF6A1F' : null }, MY);
      // materialise flash
      if (glow > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = glow; const g = ctx.createRadialGradient(MX, 480, 0, MX, 480, 500); g.addColorStop(0, 'rgba(255,220,180,1)'); g.addColorStop(1, 'rgba(255,106,31,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore(); }
      // sparkles when the eyes pop
      if (t >= OPEN && t < OPEN + 0.6) {
        const k = (t - OPEN) / 0.6;
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * TAU + 0.3, r = 200 + k * 160, x = MX + Math.cos(a) * r * 1.2, y = anc.head[1] + 40 + Math.sin(a) * r * 0.7;
          ctx.save(); ctx.translate(x, y); ctx.rotate(k * 3); ctx.globalAlpha = 1 - k; ctx.fillStyle = i % 2 ? '#FFE14D' : '#FFFBF4';
          ctx.beginPath(); for (let j = 0; j < 8; j++) { const rr = j % 2 ? 6 : 22; ctx.lineTo(Math.cos(j * Math.PI / 4) * rr, Math.sin(j * Math.PI / 4) * rr); } ctx.fill(); ctx.restore();
        }
      }
      // speech bubble on the wave
      if (t >= 6.7) {
        const k = ease.outBack(seg(t, 6.7, 6.9)), bx = anc.head[0] + 260, by = anc.head[1] - 40;
        ctx.save(); ctx.translate(bx, by); ctx.scale(k, k);
        ctx.fillStyle = '#FFFBF4'; roundRect(ctx, -10, -60, 250, 110, 26); ctx.fill();
        ctx.beginPath(); ctx.moveTo(10, 40); ctx.lineTo(-40, 80); ctx.lineTo(60, 44); ctx.fill();
        font(ctx, 56, MONO, '800'); ctx.fillStyle = '#1F2A55'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText('hi :)', 22, -4);
        ctx.restore();
      }
    }
    ctx.restore();
    // terminal caption
    font(ctx, 30, MONO, '700'); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    const cap = t < born ? '> compiling cursor' + '.'.repeat(1 + Math.floor(t * 8) % 3) : t < OPEN ? '> cursor.exe ........ spawned' : '> cursor.exe ........ ALIVE';
    ctx.fillStyle = t < OPEN ? 'rgba(255,251,244,0.6)' : '#FF8A3D'; ctx.fillText(cap, 120, 170);
    // FX
    const hb = t >= born ? Math.exp(-(t - born) * 7) : 0, ho = t >= OPEN ? Math.exp(-(t - OPEN) * 10) : 0;
    E.fx.flash = [1, 0.9, 0.8, 0.85 * Math.exp(-(t - born) * 14) * (t >= born)];
    E.fx.shake = 20 * hb + 10 * ho; E.fx.rgb = 8 * hb + 6 * ho; E.fx.zoom += 0.03 * ho;
    E.fx.bloom = t < born ? 0.8 : lerp(0.8, 0.3, seg(t, born, born + 0.5)); E.fx.bloomThreshold = t < born ? 0.5 : 0.72;
  },
};
