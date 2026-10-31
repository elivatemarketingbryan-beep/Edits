// g1 shared helpers — PAPER STUDIO look: printed paper, ink, stamps, offset type.
import { W, H, TAU, clamp, lerp, rng, noise2, hex2rgb, buf, bctx, font, roundRect, ease } from '../../core/lib.js';
import { THREE } from '../../core/three.js';

export const P1 = { paper: '#F4EDE0', paper2: '#E9DFCC', ink: '#1F2A55', red: '#E8343F', orange: '#FF6A1F', cream: '#FFFBF4', kraft: '#C9A57A', kraftD: '#9C7A52' };

/** cached paper texture (fibres + mottling + specks) in any base colour */
export function paperTex(base = P1.paper, w = W, h = H, seed = 3) {
  const key = `g1-paper-${base}-${w}x${h}-${seed}`;
  const c = buf(key, w, h);
  if (c._done) return c;
  const x = bctx(c);
  x.fillStyle = base; x.fillRect(0, 0, w, h);
  // mottling: low-res noise, upscaled smooth
  const sm = buf(key + '-m', 96, 54), sx = bctx(sm), id = sx.createImageData(96, 54);
  for (let j = 0; j < 54; j++) for (let i = 0; i < 96; i++) {
    const n = noise2(i * 0.09 + seed, j * 0.09) * 0.6 + noise2(i * 0.3, j * 0.3 + seed) * 0.4;
    const k = (j * 96 + i) * 4; const v = n > 0 ? 255 : 0;
    id.data[k] = v; id.data[k + 1] = v * 0.95; id.data[k + 2] = v * 0.85; id.data[k + 3] = Math.abs(n) * 26;
  }
  sx.putImageData(id, 0, 0);
  x.imageSmoothingEnabled = true; x.drawImage(sm, 0, 0, w, h);
  const r = rng(seed * 17 + 5);
  // fibres
  x.lineCap = 'round';
  for (let i = 0; i < 900; i++) {
    const px = r() * w, py = r() * h, a = r() * TAU, L = 6 + r() * 26;
    x.strokeStyle = r() < 0.5 ? 'rgba(120,90,50,0.07)' : 'rgba(255,255,255,0.10)';
    x.lineWidth = 0.6 + r() * 0.9;
    x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + Math.cos(a + 0.6) * L * 0.5, py + Math.sin(a + 0.6) * L * 0.5, px + Math.cos(a) * L, py + Math.sin(a) * L); x.stroke();
  }
  // specks
  for (let i = 0; i < 500; i++) { x.fillStyle = `rgba(60,40,20,${0.05 + r() * 0.12})`; x.fillRect(r() * w, r() * h, 1 + r() * 1.6, 1 + r() * 1.6); }
  c._done = true; return c;
}

/** full-frame paper background with optional slow parallax offset (wraps) */
export function paper(ctx, base = P1.paper, ox = 0, oy = 0, seed = 3) {
  const p = paperTex(base, W, H, seed);
  if (!ox && !oy) { ctx.drawImage(p, 0, 0); return; }
  const fx = ((ox % W) + W) % W, fy = ((oy % H) + H) % H;
  for (let i = -1; i <= 0; i++) for (let j = -1; j <= 0; j++) ctx.drawImage(p, fx + i * W, fy + j * H);
}

/** grunge mask for rubber stamps (cached) */
function grunge(w, h, seed) {
  const key = `g1-grunge-${w}x${h}-${seed}`; const c = buf(key, w, h);
  if (c._done) return c;
  const x = bctx(c), r = rng(seed);
  x.clearRect(0, 0, w, h);
  for (let i = 0; i < (w * h) / 260; i++) { x.fillStyle = `rgba(0,0,0,${0.5 + r() * 0.5})`; const s = 1 + r() * 4.5; x.beginPath(); x.arc(r() * w, r() * h, s, 0, TAU); x.fill(); }
  for (let i = 0; i < 24; i++) { x.strokeStyle = 'rgba(0,0,0,0.8)'; x.lineWidth = 1 + r() * 3; x.beginPath(); const y = r() * h; x.moveTo(0, y); x.lineTo(w, y + (r() - 0.5) * 40); x.stroke(); }
  c._done = true; return c;
}

const stampCache = new Map();
/** rubber stamp: rounded double border + text, grunge-knocked-out. k = 0..1 slam progress (scale from big). */
export function stamp(ctx, text, x, y, size, rot, color = P1.red, k = 1, opts = {}) {
  if (k <= 0) return;
  const fam = opts.family || 'Anton';
  const key = `g1-stamp-${text}-${size}-${color}-${fam}`;
  let c = stampCache.get(key);
  if (!c) {
    const m = bctx(buf('g1-measure', 4, 4)); font(m, size, fam); const tw = m.measureText(text).width;
    const pw = Math.ceil(tw + size * 0.7), ph = Math.ceil(size * 1.32);
    c = document.createElement('canvas'); c.width = pw; c.height = ph; stampCache.set(key, c); const s = c.getContext('2d');
    s.clearRect(0, 0, pw, ph);
    s.strokeStyle = color; s.fillStyle = color;
    s.lineWidth = size * 0.07; roundRect(s, s.lineWidth, s.lineWidth, pw - s.lineWidth * 2, ph - s.lineWidth * 2, size * 0.16); s.stroke();
    s.lineWidth = size * 0.025; roundRect(s, size * 0.13, size * 0.13, pw - size * 0.26, ph - size * 0.26, size * 0.1); s.stroke();
    font(s, size, fam); s.textAlign = 'center'; s.textBaseline = 'middle'; s.fillText(text, pw / 2, ph / 2 + size * 0.04);
    s.globalCompositeOperation = 'destination-out'; s.drawImage(grunge(pw, ph, size | 0), 0, 0);
    s.globalCompositeOperation = 'source-over';
  }
  const sc = lerp(2.6, 1, ease.outExpo(k)) * (opts.scale || 1);
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc, sc);
  ctx.globalAlpha *= clamp(k * 3) * (opts.alpha ?? 0.93);
  if (opts.multiply !== false) ctx.globalCompositeOperation = 'multiply';
  ctx.drawImage(c, -c.width / 2, -c.height / 2);
  ctx.restore();
}

/** printed display type with a hard offset shadow (risograph misregistration feel) */
export function printType(ctx, str, x, y, size, { family = 'Anton', weight = '400', fill = P1.ink, shadow = P1.red, off = 0.06, align = 'center', base = 'middle', stroke = null, strokeW = 0, maxW = 0, track = 0 } = {}) {
  font(ctx, size, family, weight);
  if (maxW) { const m = ctx.measureText(str).width; if (m > maxW) { size *= maxW / m; font(ctx, size, family, weight); } }
  ctx.textAlign = align; ctx.textBaseline = base;
  if (track) ctx.letterSpacing = `${track}px`;
  if (shadow) { ctx.fillStyle = shadow; ctx.fillText(str, x + size * off, y + size * off); }
  if (stroke) { ctx.lineJoin = 'round'; ctx.lineWidth = strokeW; ctx.strokeStyle = stroke; ctx.strokeText(str, x, y); }
  ctx.fillStyle = fill; ctx.fillText(str, x, y);
  if (track) ctx.letterSpacing = '0px';
  return size;
}

/** manga focus lines around (cx,cy): n wedges from radius r0 outward */
export function focusLines(ctx, cx, cy, n, r0, color, seed = 1, thick = 1) {
  const r = rng(seed); ctx.fillStyle = color; ctx.beginPath();
  const R = 2600;
  for (let i = 0; i < n; i++) {
    const a = r() * TAU, w = (0.004 + r() * 0.014) * thick, ri = r0 * (0.75 + r() * 0.6);
    ctx.moveTo(cx + Math.cos(a) * ri, cy + Math.sin(a) * ri);
    ctx.lineTo(cx + Math.cos(a - w) * R, cy + Math.sin(a - w) * R);
    ctx.lineTo(cx + Math.cos(a + w) * R, cy + Math.sin(a + w) * R);
    ctx.closePath();
  }
  ctx.fill();
}

/** return-arrow glyph ⏎ (drawn as a path), centred at x,y with size s */
export function returnArrow(ctx, x, y, s, color, lw = s * 0.16) {
  ctx.save(); ctx.translate(x, y); ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(s * 0.45, -s * 0.45); ctx.lineTo(s * 0.45, s * 0.12); ctx.lineTo(-s * 0.4, s * 0.12); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-s * 0.15, -s * 0.14); ctx.lineTo(-s * 0.42, s * 0.12); ctx.lineTo(-s * 0.15, s * 0.38); ctx.stroke();
  ctx.restore();
}

/** project a THREE.Vector3 to canvas px */
const _v = new THREE.Vector3();
export function toScreen(camera, x, y, z) {
  _v.set(x, y, z).project(camera);
  return [(_v.x * 0.5 + 0.5) * W, (-_v.y * 0.5 + 0.5) * H, _v.z];
}

/** key-press depth curve: 0 → 1 (down) fast, then springy return. d = seconds since press */
export function pressCurve(d, down = 0.035, back = 15) {
  if (d < 0) return 0;
  if (d < down) return ease.outQuad(d / down);
  const u = d - down;
  return Math.exp(-u * back) * Math.cos(u * 34);
}

/** soft drop shadow ellipse */
export function blobShadow(ctx, x, y, rx, ry, a = 0.25, col = '31,42,85') {
  const g = ctx.createRadialGradient(x, y, 0, x, y, rx);
  g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`);
  ctx.save(); ctx.translate(x, y); ctx.scale(1, ry / rx); ctx.translate(-x, -y);
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rx, 0, TAU); ctx.fill(); ctx.restore();
}

/** confetti / paper bits burst. t = seconds since burst */
export function paperBurst(ctx, x, y, t, n, seed, cols, spread = 600, grav = 1800, size = 14) {
  if (t < 0 || t > 1.6) return;
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (r() - 0.5) * Math.PI * 1.5, v = spread * (0.35 + r() * 0.9);
    const vx = Math.cos(a) * v, vy = Math.sin(a) * v;
    const drag = 2.2;
    const k = (1 - Math.exp(-drag * t)) / drag;
    const px = x + vx * k, py = y + vy * k + 0.5 * grav * t * t * 0.55;
    const rot = r() * TAU + t * (r() - 0.5) * 24, s = size * (0.5 + r());
    ctx.save(); ctx.translate(px, py); ctx.rotate(rot); ctx.scale(1, Math.cos(t * (6 + r() * 10) + i));
    ctx.globalAlpha = clamp(1.4 - t); ctx.fillStyle = cols[i % cols.length];
    ctx.fillRect(-s / 2, -s * 0.3, s, s * 0.6); ctx.restore();
  }
}

export { hex2rgb };

/** compile shaders / shadow programs ahead of time by rendering once into a throwaway canvas */
import { render3d as _r3d, renderer as _rend } from '../../core/three.js';
export function warm(scene, camera) {
  try { camera.position.set(0, 10, 20); camera.lookAt(0, 0, 0); camera.updateMatrixWorld(); _rend().compile(scene, camera); const c = document.createElement('canvas'); c.width = 8; c.height = 8; _r3d(c.getContext('2d'), scene, camera); } catch (e) { /* ignore */ }
}
