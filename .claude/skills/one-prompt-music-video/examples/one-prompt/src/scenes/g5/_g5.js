// g5 shared helpers — INTERNET BRUTALISM toolkit (Win95 chrome, slam type, grids, shards).
import { W, H, TAU, clamp, lerp, ease, font, roundRect, rng, hash } from '../../core/lib.js';

export const C = {
  white: '#FFFFFF', blue: '#2B2BFF', red: '#FF2A2A', grey: '#C3C3C3', black: '#0E0E12',
  orange: '#FF6A1F', navy: '#1F2A55', dk: '#7B7B7B', lt: '#F2F2F2', title2: '#6F6FFF', green: '#2BFF88',
};

/** 0 before t0, then eased 0..1 over dur */
export const hit = (t, t0, dur = 0.2, fn = ease.outBack) => (t < t0 ? 0 : fn(clamp((t - t0) / dur)));
/** decaying pulse after t0 */
export const kick = (t, t0, decay = 0.12) => (t < t0 ? 0 : Math.exp(-(t - t0) / decay));

/** Win95-style bevelled rectangle. inset=true draws a sunken field. */
export function bevel(ctx, x, y, w, h, inset = false, face = C.grey, d = 3) {
  ctx.fillStyle = face; ctx.fillRect(x, y, w, h);
  const hiC = inset ? '#5A5A5A' : '#FFFFFF', loC = inset ? '#FFFFFF' : '#1A1A1A', hi2 = inset ? '#8A8A8A' : '#E8E8E8', lo2 = inset ? '#E8E8E8' : '#7B7B7B';
  ctx.fillStyle = hiC; ctx.fillRect(x, y, w, d); ctx.fillRect(x, y, d, h);
  ctx.fillStyle = loC; ctx.fillRect(x, y + h - d, w, d); ctx.fillRect(x + w - d, y, d, h);
  ctx.fillStyle = hi2; ctx.fillRect(x + d, y + d, w - 2 * d, d); ctx.fillRect(x + d, y + d, d, h - 2 * d);
  ctx.fillStyle = lo2; ctx.fillRect(x + d, y + h - 2 * d, w - 2 * d, d); ctx.fillRect(x + w - 2 * d, y + d, d, h - 2 * d);
}

/** Win95 window: bevel frame + gradient title bar + ✕ □ _ buttons. Returns the client rect. */
export function win95(ctx, x, y, w, h, title, { tb = 46, active = true, icon = true, font: fz = 26, close = true } = {}) {
  // hard drop shadow (brutalist)
  ctx.fillStyle = C.black; ctx.fillRect(x + 14, y + 14, w, h);
  bevel(ctx, x, y, w, h, false, C.grey, 4);
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  if (active) { g.addColorStop(0, C.blue); g.addColorStop(1, C.title2); } else { g.addColorStop(0, '#7B7B7B'); g.addColorStop(1, '#B5B5B5'); }
  ctx.fillStyle = g; ctx.fillRect(x + 8, y + 8, w - 16, tb);
  ctx.fillStyle = '#fff'; font(ctx, fz, 'JetBrains Mono', '800'); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  let tx = x + 20;
  if (icon) { ctx.fillStyle = '#fff'; ctx.fillRect(tx, y + 8 + tb / 2 - 11, 22, 22); ctx.fillStyle = C.orange; ctx.fillRect(tx + 4, y + 8 + tb / 2 - 7, 14, 14); tx += 34; ctx.fillStyle = '#fff'; }
  ctx.fillText(title, tx, y + 8 + tb / 2 + 1);
  // buttons
  const bs = tb - 12, by = y + 14;
  const labels = close ? ['_', '□', '✕'] : ['✕'];
  labels.forEach((L, k) => {
    const bx = x + w - 14 - (labels.length - k) * (bs + 6);
    bevel(ctx, bx, by, bs + 4, bs, false, C.grey, 2);
    ctx.fillStyle = C.black; font(ctx, bs * 0.62, 'JetBrains Mono', '800'); ctx.textAlign = 'center';
    ctx.fillText(L, bx + (bs + 4) / 2, by + bs / 2 + 1);
  });
  return { x: x + 10, y: y + 10 + tb + 6, w: w - 20, h: h - tb - 26 };
}

/**
 * Big display type with hard offset shadow + optional outline. (x,y) = centre.
 * o: {family, weight, fill, stroke, lw, shadow, sx, sy, rot, scale, maxW, align, track}
 */
export function slam(ctx, str, x, y, size, o = {}) {
  const { family = 'Anton', weight = '400', fill = C.white, stroke = C.black, lw = 0, shadow = C.black, sx = 12, sy = 12, rot = 0, scale = 1, maxW = 1700, alpha = 1, skew = 0 } = o;
  if (scale <= 0.001 || alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x, y); ctx.rotate(rot); ctx.scale(scale, scale);
  if (skew) ctx.transform(1, 0, skew, 1, 0, 0);
  font(ctx, size, family, weight);
  const m = ctx.measureText(str).width;
  if (m > maxW) { const k = maxW / m; ctx.scale(k, k); }
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  if (shadow) {
    ctx.fillStyle = shadow; ctx.fillText(str, sx, sy);
    if (lw) { ctx.lineWidth = lw; ctx.strokeStyle = shadow; ctx.strokeText(str, sx, sy); }
  }
  if (lw) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.strokeText(str, 0, 0); }
  if (fill) { ctx.fillStyle = fill; ctx.fillText(str, 0, 0); }
  ctx.restore();
}

/** square grid lines */
export function grid(ctx, step, color, lw = 2, ox = 0, oy = 0, x0 = 0, y0 = 0, w = W, h = H) {
  ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.beginPath();
  for (let x = x0 + ((ox % step) + step) % step; x <= x0 + w; x += step) { ctx.moveTo(x, y0); ctx.lineTo(x, y0 + h); }
  for (let y = y0 + ((oy % step) + step) % step; y <= y0 + h; y += step) { ctx.moveTo(x0, y); ctx.lineTo(x0 + w, y); }
  ctx.stroke();
}

/** radial manga speed lines (filled wedges) */
export function speedLines(ctx, cx, cy, n, r0, r1, seed, color, wMax = 0.05, phase = 0) {
  const r = rng(seed);
  ctx.fillStyle = color; ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const a = r() * TAU + phase, w = r.range(0.004, wMax), rr0 = r0 * r.range(0.8, 1.4);
    ctx.moveTo(cx + Math.cos(a - w) * r1, cy + Math.sin(a - w) * r1);
    ctx.lineTo(cx + Math.cos(a) * rr0, cy + Math.sin(a) * rr0);
    ctx.lineTo(cx + Math.cos(a + w) * r1, cy + Math.sin(a + w) * r1);
  }
  ctx.fill();
}

/** Win95 classic arrow pointer (tip at x,y) */
export function pointer(ctx, x, y, s = 1, fill = '#fff', ink = C.black) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath();
  ctx.moveTo(0, 0); ctx.lineTo(0, 34); ctx.lineTo(8, 26); ctx.lineTo(14, 40); ctx.lineTo(20, 37); ctx.lineTo(14, 24); ctx.lineTo(25, 24); ctx.closePath();
  ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = ink; ctx.lineJoin = 'round'; ctx.stroke();
  ctx.restore();
}

/** random convex-ish shards covering a rect (deterministic). Returns polygons [{pts:[[x,y]..], cx, cy}] */
export function shardsFor(seed, x, y, w, h, nx = 7, ny = 4, jitter = 0.38) {
  const r = rng(seed);
  const P = [];
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
    const edgeX = i === 0 || i === nx, edgeY = j === 0 || j === ny;
    P.push([x + (i + (edgeX ? 0 : r.range(-jitter, jitter))) * (w / nx), y + (j + (edgeY ? 0 : r.range(-jitter, jitter))) * (h / ny)]);
  }
  const at = (i, j) => P[j * (nx + 1) + i];
  const out = [];
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const a = at(i, j), b = at(i + 1, j), c = at(i + 1, j + 1), d = at(i, j + 1);
    const tris = r() < 0.5 ? [[a, b, c], [a, c, d]] : [[a, b, d], [b, c, d]];
    for (const pts of tris) { const cx = (pts[0][0] + pts[1][0] + pts[2][0]) / 3, cy = (pts[0][1] + pts[1][1] + pts[2][1]) / 3; out.push({ pts, cx, cy, k: out.length }); }
  }
  return out;
}

/** big chunky down arrow centred at (x,y) */
export function arrowDown(ctx, x, y, s, fill = C.red, ink = C.black, lw = 8) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath();
  ctx.moveTo(-22, -60); ctx.lineTo(22, -60); ctx.lineTo(22, 0); ctx.lineTo(50, 0); ctx.lineTo(0, 55); ctx.lineTo(-50, 0); ctx.lineTo(-22, 0); ctx.closePath();
  ctx.fillStyle = ink; ctx.save(); ctx.translate(8, 8); ctx.fill(); ctx.restore();
  ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = lw / s; ctx.strokeStyle = ink; ctx.lineJoin = 'round'; ctx.stroke();
  ctx.restore();
}

/** 4-point sparkle */
export function sparkle(ctx, x, y, r, color = '#fff', rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.beginPath();
  for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU, rr = i % 2 ? r * 0.18 : r; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  ctx.closePath(); ctx.fillStyle = color; ctx.fill(); ctx.restore();
}

export { hash };
