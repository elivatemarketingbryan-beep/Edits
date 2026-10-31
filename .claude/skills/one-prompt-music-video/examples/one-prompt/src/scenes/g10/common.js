// g10 — OUTRO "SUNRISE" shared helpers: palette, HUD-clock, soft light rays, lens flare, motes, glow type.
import { W, H, TAU, clamp, lerp, ease, hash, buf, bctx, font, roundRect, hex2rgb } from '../../core/lib.js';
import { G } from '../../core/gl.js';

export const SUN = {
  dawn: '#FF9E5E', gold: '#FFD23F', sky: '#8FD3FF', white: '#FFFBF4', ink: '#1F2A55',
  orange: '#FF6A1F', hot: '#FFB15C', night: '#0A0D1C', night2: '#141A35', red: '#E8343F', cream: '#FFF4D6',
  peach: '#FFB38A', deep: '#2E8BE0',
};

/** same clock as the HUD (night → dawn time-lapse) */
export function clockParts(t) {
  let s = 23 * 3600 + 59 * 60 + Math.floor(t * 131); s %= 86400;
  return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60];
}
export const pad2 = (n) => String(n).padStart(2, '0');

/** rgb string from hex mix, cached-ish helper */
export function mix3(a, b, k) { const A = hex2rgb(a), B = hex2rgb(b); return [lerp(A[0], B[0], k), lerp(A[1], B[1], k), lerp(A[2], B[2], k)]; }
export const css = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;

/**
 * Soft volumetric sun rays: drawn into a small buffer, blurred, composited with 'screen'.
 * n rays, rot = rotation, len = length, col = [r,g,b], alpha.
 */
export function softRays(ctx, key, cx, cy, { n = 14, rot = 0, len = 2200, width = 0.09, col = [255, 230, 160], alpha = 0.5, seed = 3, blur = 6, comp = 'screen' } = {}) {
  const sw = 480, sh = 270, sc = sw / W;
  const c = buf(key + '-rays', sw, sh), x = bctx(c);
  x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, sw, sh);
  x.save(); x.scale(sc, sc); x.translate(cx, cy);
  for (let i = 0; i < n; i++) {
    const a = rot + (i / n) * TAU + (hash(i, seed) - 0.5) * 0.35;
    const w = width * (0.45 + hash(i, seed, 2) * 1.1);
    const L = len * (0.55 + hash(i, seed, 3) * 0.6);
    const g = x.createLinearGradient(0, 0, Math.cos(a) * L, Math.sin(a) * L);
    const al = 0.35 + 0.65 * hash(i, seed, 4);
    g.addColorStop(0, `rgba(${col[0]},${col[1]},${col[2]},${al})`); g.addColorStop(1, `rgba(${col[0]},${col[1]},${col[2]},0)`);
    x.fillStyle = g; x.beginPath(); x.moveTo(0, 0);
    x.arc(0, 0, L, a - w / 2, a + w / 2); x.closePath(); x.fill();
  }
  x.restore();
  const b = buf(key + '-raysB', sw, sh), y = bctx(b);
  y.setTransform(1, 0, 0, 1, 0, 0); y.clearRect(0, 0, sw, sh); y.filter = `blur(${blur}px)`; y.drawImage(c, 0, 0); y.filter = 'none';
  ctx.save(); ctx.globalAlpha *= alpha; ctx.globalCompositeOperation = comp; ctx.drawImage(b, 0, 0, W, H); ctx.restore();
}

/**
 * Photographic lens flare (all additive): glow, anamorphic streak, starburst, ghosts along the axis through the centre.
 * k = intensity 0..1+
 */
export function lensFlare(ctx, lx, ly, k = 1, { t = 0, streak = 1, ghosts = 1, tint = [255, 200, 140], star = 1, core = 1 } = {}) {
  if (k <= 0.001) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const [r, g, b] = tint;
  // core glow
  let gr = ctx.createRadialGradient(lx, ly, 0, lx, ly, (380 * k + 60) * core);
  gr.addColorStop(0, `rgba(255,255,245,${0.9 * Math.min(1, k)})`); gr.addColorStop(0.12, `rgba(${r},${g},${b},${0.45 * Math.min(1, k)})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gr; ctx.fillRect(lx - 500, ly - 500, 1000, 1000);
  // anamorphic streak
  if (streak > 0) {
    ctx.save(); ctx.translate(lx, ly); ctx.scale(1, 0.018 + 0.01 * Math.sin(t * 3));
    gr = ctx.createRadialGradient(0, 0, 0, 0, 0, 1300 * streak);
    gr.addColorStop(0, `rgba(255,250,240,${0.85 * Math.min(1, k)})`); gr.addColorStop(0.3, `rgba(150,200,255,${0.35 * Math.min(1, k)})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, 1300 * streak, 0, TAU); ctx.fill(); ctx.restore();
  }
  // starburst spikes
  if (star > 0) {
    ctx.save(); ctx.translate(lx, ly); ctx.rotate(t * 0.15);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU, L = (i % 2 ? 260 : 420) * k * star;
      ctx.rotate(TAU / 12);
      gr = ctx.createLinearGradient(0, 0, L, 0); gr.addColorStop(0, `rgba(255,245,225,${0.5 * Math.min(1, k)})`); gr.addColorStop(1, 'rgba(255,245,225,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(0, -3); ctx.lineTo(L, 0); ctx.lineTo(0, 3); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
  // ghosts along the optical axis
  if (ghosts > 0) {
    const cx = W / 2, cy = H / 2, dx = cx - lx, dy = cy - ly;
    const G_ = [[0.45, 34, [255, 170, 90], 0.18], [0.7, 90, [120, 220, 255], 0.09], [1.05, 22, [255, 230, 140], 0.22], [1.3, 150, [255, 120, 160], 0.06], [1.6, 60, [160, 255, 200], 0.1], [1.9, 200, [140, 170, 255], 0.05], [2.2, 40, [255, 210, 120], 0.14]];
    for (const [f, rad, c, a] of G_) {
      const gx = lx + dx * f, gy = ly + dy * f, A = a * Math.min(1.2, k) * ghosts;
      gr = ctx.createRadialGradient(gx, gy, rad * 0.2, gx, gy, rad);
      gr.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},${A * 0.4})`); gr.addColorStop(0.85, `rgba(${c[0]},${c[1]},${c[2]},${A})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gr;
      // hexagonal iris ghost
      ctx.beginPath(); for (let i = 0; i < 6; i++) { const aa = i / 6 * TAU + 0.3; ctx.lineTo(gx + Math.cos(aa) * rad, gy + Math.sin(aa) * rad); } ctx.closePath(); ctx.fill();
    }
    // halo ring
    const hr = 520;
    gr = ctx.createRadialGradient(cx + dx * 0.15, cy + dy * 0.15, hr * 0.9, cx + dx * 0.15, cy + dy * 0.15, hr);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.5, `rgba(255,190,140,${0.05 * k * ghosts})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
  }
  ctx.restore();
}

/** floating light motes / bokeh (deterministic, drift up), additive */
export function motes(ctx, t, { n = 60, seed = 5, col = [255, 230, 170], alpha = 0.5, size = [3, 22], speed = 30, area = [0, 0, W, H], comp = 'lighter' } = {}) {
  ctx.save(); ctx.globalCompositeOperation = comp;
  const [ax, ay, aw, ah] = area;
  for (let i = 0; i < n; i++) {
    const h1 = hash(i, seed), h2 = hash(i, seed, 1), h3 = hash(i, seed, 2), h4 = hash(i, seed, 3);
    const r = lerp(size[0], size[1], h3 * h3);
    const sp = speed * (0.4 + h4);
    const x = ax + ((h1 * aw + Math.sin(t * (0.3 + h2) + i) * 40) % aw + aw) % aw;
    const y = ay + (((h2 * ah - t * sp) % ah) + ah) % ah;
    const tw = 0.55 + 0.45 * Math.sin(t * (1.5 + h1 * 3) + i * 1.7);
    const a = alpha * tw * (r > 12 ? 0.35 : 1);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${col[0]},${col[1]},${col[2]},${a})`); g.addColorStop(r > 12 ? 0.8 : 0.4, `rgba(${col[0]},${col[1]},${col[2]},${a * 0.5})`); g.addColorStop(1, `rgba(${col[0]},${col[1]},${col[2]},0)`);
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  ctx.restore();
}

/** blurred glow of any drawing: draws fn into a 1/4 buffer, blurs, adds it back with 'lighter' / 'screen' */
export function glowPass(ctx, key, fn, { blur = 10, alpha = 0.8, comp = 'lighter', scale = 0.25 } = {}) {
  const sw = Math.round(W * scale), sh = Math.round(H * scale);
  const c = buf(key + '-glow', sw, sh), x = bctx(c);
  x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, sw, sh); x.save(); x.scale(scale, scale); fn(x); x.restore();
  const b = buf(key + '-glowB', sw, sh), y = bctx(b);
  y.setTransform(1, 0, 0, 1, 0, 0); y.clearRect(0, 0, sw, sh); y.filter = `blur(${blur}px)`; y.drawImage(c, 0, 0); y.filter = 'none';
  ctx.save(); ctx.globalCompositeOperation = comp; ctx.globalAlpha *= alpha; ctx.drawImage(b, 0, 0, W, H); ctx.restore();
}

/** make a scene's HUD ink follow a condition each frame */
export function setHud(scene, mode) { scene.hud = mode; }

/** text with letter-spacing (canvas letterSpacing support varies — do it by hand). returns width */
export function spaced(ctx, str, x, y, sp, align = 'left') {
  let w = 0; const ws = [];
  for (const ch of str) { const m = ctx.measureText(ch).width; ws.push(m); w += m + sp; }
  w -= sp;
  let px = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
  const prev = ctx.textAlign; ctx.textAlign = 'left';
  let i = 0; for (const ch of str) { ctx.fillText(ch, px, y); px += ws[i++] + sp; }
  ctx.textAlign = prev;
  return w;
}

/** a white mascot-style glove (for hands holding props) */
export function glove(ctx, x, y, r = 22, ink = SUN.ink) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = ink; ctx.stroke();
}

export { G };

/** extra easings */
export const inOutSine = (t) => 0.5 - 0.5 * Math.cos(Math.PI * clamp(t));
export const outSine = (t) => Math.sin((Math.PI / 2) * clamp(t));
