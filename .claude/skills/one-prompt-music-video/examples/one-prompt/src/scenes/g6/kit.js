// g6 shared helpers: gold / chrome fills, display type with extrusion, mipmapped canvas textures, misc.
import { W, H, TAU, clamp, lerp, ease, font, roundRect, buf, bctx, hash } from '../../core/lib.js';
import { G } from '../../core/gl.js';

export const GOLD = { g: '#FFC300', g2: '#E0A100', cream: '#FFF4D6', black: '#111111', orange: '#FF6A1F', deep: '#7A4B00', hi: '#FFF1B0' };
export const BRUT = { white: '#FFFFFF', blue: '#2B2BFF', red: '#FF2A2A', grey: '#C3C3C3', black: '#0E0E12' };

/** vertical metallic gold gradient between y0 and y1 */
export function goldGrad(ctx, y0, y1, x0 = 0, x1 = 0) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, '#FFF6C8'); g.addColorStop(0.18, '#FFD84A'); g.addColorStop(0.42, '#F2A900');
  g.addColorStop(0.5, '#B87400'); g.addColorStop(0.58, '#FFCB2E'); g.addColorStop(0.8, '#FFE58A'); g.addColorStop(1, '#C88A00');
  return g;
}
export function chromeGrad(ctx, y0, y1) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.35, '#C9D2E3'); g.addColorStop(0.5, '#59627A');
  g.addColorStop(0.56, '#E9EEF7'); g.addColorStop(0.8, '#9AA6BD'); g.addColorStop(1, '#FFFFFF');
  return g;
}

/**
 * Big display word with a stacked extrusion, thick outline and optional face fill/gradient.
 * o: {size, family, weight, face (style or fn(ctx, top, bottom)), side, outline, ow, depth, dx, dy, shadow, align}
 */
export function slabText(ctx, str, x, y, o = {}) {
  const size = o.size || 200, fam = o.family || 'Anton', wt = o.weight || '400';
  font(ctx, size, fam, wt);
  ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'middle';
  if (o.tracking) ctx.letterSpacing = o.tracking + 'px';
  const depth = o.depth ?? Math.round(size * 0.06), dx = o.dx ?? 0.7, dy = o.dy ?? 1;
  ctx.lineJoin = 'round'; ctx.miterLimit = 2;
  const ow = o.ow ?? Math.max(4, size * 0.045);
  if (o.shadow) { ctx.fillStyle = o.shadow; ctx.strokeStyle = o.shadow; ctx.lineWidth = ow * 2; for (let k = 0; k < 3; k++) { ctx.strokeText(str, x + depth * dx + size * 0.05, y + depth * dy + size * 0.06); } }
  ctx.strokeStyle = o.outline || '#111'; ctx.lineWidth = ow * 2;
  for (let i = depth; i >= 1; i--) { ctx.strokeText(str, x + i * dx, y + i * dy); }
  ctx.fillStyle = o.side || '#7A4B00';
  for (let i = depth; i >= 1; i--) ctx.fillText(str, x + i * dx, y + i * dy);
  ctx.strokeText(str, x, y);
  ctx.fillStyle = typeof o.face === 'function' ? o.face(ctx, y - size * 0.5, y + size * 0.5) : (o.face || '#FFC300');
  ctx.fillText(str, x, y);
  if (o.tracking) ctx.letterSpacing = '0px';
}

/** upload a canvas into a mipmapped texture on the shared GL context (cached by key) */
const mipTex = new Map();
export function mipCanvasTex(key, src) {
  const gl = G.gl; let t = mipTex.get(key);
  if (!t) {
    t = gl.createTexture(); mipTex.set(key, t);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.generateMipmap(gl.TEXTURE_2D);
  t.w = src.width; t.h = src.height;
  return t;
}

/** classic arrow mouse pointer at (x,y) tip, scale s, rotation a */
export function pointer(ctx, x, y, s = 1, a = 0, fill = '#fff', ink = '#0E0E12') {
  ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.scale(s, s);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 17); ctx.lineTo(4, 13); ctx.lineTo(7, 20); ctx.lineTo(9.5, 19); ctx.lineTo(6.5, 12); ctx.lineTo(12, 12); ctx.closePath();
  ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = 1.6; ctx.lineJoin = 'round'; ctx.strokeStyle = ink; ctx.stroke();
  ctx.restore();
}

/** soft radial glow sprite (cached) */
export function glowSprite(key, color = '255,240,200', size = 128) {
  const c = buf('g6glow-' + key, size, size), x = bctx(c);
  if (!c._done) {
    const g = x.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, `rgba(${color},1)`); g.addColorStop(0.18, `rgba(${color},0.55)`); g.addColorStop(0.45, `rgba(${color},0.14)`); g.addColorStop(1, `rgba(${color},0)`);
    x.fillStyle = g; x.fillRect(0, 0, size, size); c._done = true;
  }
  return c;
}

/** times of the events of a kind that fall in [a, b) — sugar */
export const hitsBetween = (A, kind, a, b) => A.eventsIn(kind, a, b);

/** sum of exponential pulses for a list of times (only past ones) */
export function pulses(t, times, decay = 0.12) { let s = 0; for (const x of times) if (t >= x) s += Math.exp(-(t - x) / decay); return s; }

/** draw text along a circle (centered at 0,0) */
export function circleText(ctx, str, r, a0, size, family, color) {
  font(ctx, size, family); ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  let a = a0;
  for (const ch of str) {
    const w = ctx.measureText(ch).width; const da = w / r;
    ctx.save(); ctx.rotate(a + da / 2); ctx.translate(0, -r); ctx.fillText(ch, 0, 0); ctx.restore();
    a += da;
  }
}

/** 4-point sparkle */
export function sparkle(ctx, x, y, r, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.beginPath();
  for (let i = 0; i < 8; i++) { const rr = i % 2 ? r * 0.22 : r, a = (i / 8) * TAU; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  ctx.closePath(); ctx.restore();
}

export { W, H, TAU, clamp, lerp, ease, font, roundRect, buf, bctx, hash };
