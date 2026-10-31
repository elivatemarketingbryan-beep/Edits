// g4 shared helpers: candy palette, pop/sticker type, sunburst + halftone backgrounds, confetti.
import { W, H, TAU, clamp, lerp, ease, font, roundRect, star, hash } from '../../core/lib.js';

export const C = {
  pink: '#FF3E8A', hot: '#FF2D6F', orange: '#FF7A1A', yellow: '#FFE14D', purple: '#7B2FF7',
  cream: '#FFFBF4', ink: '#1F2A55', mint: '#7CFFC4', cyan: '#3EF0FF', white: '#FFFFFF', lilac: '#C9A8FF',
  // verse 2 — internet brutalism
  blue: '#2B2BFF', red: '#FF2A2A', grey: '#C3C3C3', black: '#0E0E12', navy95: '#000080',
};
export const RAINBOW12 = ['#FF2D6F', '#FF4FA0', '#FF6A3D', '#FF8F1A', '#FFC12E', '#FFE14D', '#C6F04A', '#7CFFC4', '#3EF0FF', '#4F9BFF', '#7B2FF7', '#C04BFF'];
export const CANDY = [C.pink, C.orange, C.yellow, C.purple, C.mint, C.cyan];

/** extruded sticker type: hard 3D extrusion + thick outline + fill + gloss line. Returns measured width. */
export function popText(ctx, str, x, y, size, o = {}) {
  const family = o.family || 'Anton', weight = o.weight || '400';
  font(ctx, size, family, weight, o.style || 'normal');
  ctx.textAlign = o.align || 'center'; ctx.textBaseline = o.base || 'middle';
  if (o.spacing != null) ctx.letterSpacing = o.spacing + 'px';
  let w = ctx.measureText(str).width;
  if (o.maxW && w > o.maxW) { size *= o.maxW / w; font(ctx, size, family, weight, o.style || 'normal'); w = o.maxW; }
  const depth = o.depth ?? size * 0.07, dx = o.dir ? o.dir[0] : 0.55, dy = o.dir ? o.dir[1] : 1;
  const lw = o.lw ?? Math.max(4, size * 0.055);
  ctx.lineJoin = 'round'; ctx.miterLimit = 2;
  // extrusion
  if (depth > 0) {
    ctx.fillStyle = o.side || C.ink; ctx.strokeStyle = o.side || C.ink; ctx.lineWidth = lw;
    const n = Math.max(2, Math.ceil(depth / 3));
    for (let i = n; i >= 1; i--) { const k = (i / n) * depth; ctx.strokeText(str, x + dx * k, y + dy * k); ctx.fillText(str, x + dx * k, y + dy * k); }
  }
  if (lw > 0 && o.stroke !== false) { ctx.strokeStyle = o.stroke || C.ink; ctx.lineWidth = lw; ctx.strokeText(str, x, y); }
  ctx.fillStyle = o.fill || C.cream; ctx.fillText(str, x, y);
  if (o.gloss) {
    ctx.save(); ctx.globalCompositeOperation = 'source-atop';
    ctx.restore();
  }
  if (o.spacing != null) ctx.letterSpacing = '0px';
  return w;
}

/** chunky sticker chip with text (rounded rect + hard shadow) */
export function chip(ctx, str, x, y, size, o = {}) {
  font(ctx, size, o.family || 'Anton', o.weight || '400');
  const w = ctx.measureText(str).width, pad = size * 0.38, h = size * 1.25;
  const bx = x - w / 2 - pad, by = y - h / 2;
  ctx.fillStyle = o.shadow || C.ink; roundRect(ctx, bx + size * 0.1, by + size * 0.12, w + pad * 2, h, h * 0.3); ctx.fill();
  ctx.fillStyle = o.bg || C.cream; roundRect(ctx, bx, by, w + pad * 2, h, h * 0.3); ctx.fill();
  ctx.lineWidth = Math.max(3, size * 0.07); ctx.strokeStyle = o.stroke || C.ink; ctx.stroke();
  ctx.fillStyle = o.fg || C.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y + size * 0.04);
  return w + pad * 2;
}

/** full-frame sunburst rays around (cx,cy) */
export function sunburst(ctx, cx, cy, n, rot, colA, colB, r = 2600) {
  ctx.fillStyle = colB; ctx.fillRect(-200, -200, W + 400, H + 400);
  ctx.fillStyle = colA; ctx.beginPath();
  for (let i = 0; i < n; i += 2) {
    const a0 = rot + (i / n) * TAU, a1 = rot + ((i + 1) / n) * TAU;
    ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a0) * r, cy + Math.sin(a0) * r); ctx.lineTo(cx + Math.cos(a1) * r, cy + Math.sin(a1) * r); ctx.closePath();
  }
  ctx.fill();
}

/** halftone dots that grow toward the frame corners (radial) */
export function cornerDots(ctx, color, step = 26, maxR = 9, cx = W / 2, cy = H / 2, inner = 0.45, ox = 0, oy = 0) {
  ctx.fillStyle = color; ctx.beginPath();
  const R = Math.hypot(W / 2, H / 2);
  for (let y = (oy % step) - step; y < H + step; y += step) for (let x = (ox % step) - step + ((Math.floor((y - oy) / step) & 1) ? step / 2 : 0); x < W + step; x += step) {
    const d = Math.hypot(x - cx, y - cy) / R; const r = clamp((d - inner) / (1 - inner)) * maxR;
    if (r > 0.6) { ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, TAU); }
  }
  ctx.fill();
}

/** sparkle (4-point twinkle) */
export function sparkle(ctx, x, y, r, rot = 0, color = C.cream) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = color; ctx.beginPath();
  for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU, rr = i % 2 ? r * 0.22 : r; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  ctx.closePath(); ctx.fill(); ctx.restore();
}

/**
 * Analytic confetti burst (pure function of age): returns nothing, draws pieces.
 * b: {x, y, ang, spread, speed, n, seed, g, drag, size, colors}
 */
export function confetti(ctx, b, age) {
  if (age < 0) return;
  const k = b.drag ?? 2.2, g = b.g ?? 1400, e = Math.exp(-k * age), n = b.n ?? 80;
  for (let i = 0; i < n; i++) {
    const h1 = hash(i, b.seed, 1), h2 = hash(i, b.seed, 2), h3 = hash(i, b.seed, 3), h4 = hash(i, b.seed, 4);
    const a = b.ang + (h1 - 0.5) * b.spread, sp = b.speed * (0.45 + 0.75 * h2);
    const vx = Math.cos(a) * sp, vy = Math.sin(a) * sp;
    // drag + gravity, terminal fall speed g/k (flutter)
    let x = b.x + (vx / k) * (1 - e), y = b.y + (vy / k) * (1 - e) + (g / k) * (age - (1 - e) / k);
    const flut = Math.sin(age * (6 + h3 * 8) + h4 * 9);
    x += flut * 26 * clamp(age * 2);
    if (y > H + 60 || x < -80 || x > W + 80) continue;
    const s = (b.size ?? 22) * (0.6 + 0.7 * h3);
    const spin = age * (8 + h4 * 14) + h1 * 6;
    ctx.save(); ctx.translate(x, y); ctx.rotate(h2 * 6 + age * (2 + h3 * 4) * (h1 > 0.5 ? 1 : -1));
    ctx.scale(Math.cos(spin), 1);
    const cols = b.colors || CANDY;
    ctx.fillStyle = cols[Math.floor(h4 * cols.length)];
    const shape = Math.floor(h3 * 4);
    if (shape === 0) { ctx.beginPath(); ctx.arc(0, 0, s * 0.42, 0, TAU); ctx.fill(); }
    else if (shape === 1) { star(ctx, 0, 0, s * 0.6, s * 0.28, 5); ctx.fill(); }
    else ctx.fillRect(-s * 0.5, -s * 0.22, s, s * 0.44 * (shape === 3 ? 1.8 : 1));
    ctx.restore();
  }
}

/** times of hits in [a,b) merged from several kinds */
export function hitList(A, a, b, kinds = ['beat']) {
  const L = []; for (const k of kinds) L.push(...A.eventsIn(k, a, b)); L.sort((x, y) => x - y);
  return L.filter((x, i) => i === 0 || x - L[i - 1] > 0.08);
}
/** seconds since last hit in list (or 99) */
export const sinceIn = (list, t) => { let r = 99; for (const x of list) if (x <= t) r = t - x; return r; };
export const lastIdx = (list, t) => { let r = -1; for (let i = 0; i < list.length; i++) if (list[i] <= t) r = i; return r; };
