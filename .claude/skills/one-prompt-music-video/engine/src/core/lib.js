// Shared helpers for every scene. Everything here is deterministic: no Math.random, no Date.now.

export const W = 1920, H = 1080, FPS = 30;
export const TAU = Math.PI * 2;

// ---------- math ----------
export const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const fract = (x) => x - Math.floor(x);
export const smooth = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };
export const smoother = (t) => { t = clamp(t); return t * t * t * (t * (t * 6 - 15) + 10); };
/** 0..1 progress of t inside [a,b] (clamped) */
export const seg = (t, a, b) => clamp((t - a) / (b - a));
/** remap v from [a,b] to [c,d], clamped */
export const map = (v, a, b, c, d) => c + (d - c) * clamp((v - a) / (b - a));
export const pingpong = (x) => 1 - Math.abs(1 - 2 * fract(x));
export const dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
/** damped spring response to a step at t=0 (0 → 1 with overshoot). freq in Hz. */
export const spring = (t, freq = 3, damp = 0.35) => t <= 0 ? 0 : 1 - Math.exp(-damp * TAU * freq * t) * Math.cos(TAU * freq * Math.sqrt(1 - damp * damp) * t);
/** decaying wobble that starts at 1 and settles to 0 */
export const wobble = (t, freq = 6, decay = 5) => t < 0 ? 0 : Math.exp(-decay * t) * Math.cos(TAU * freq * t);

// ---------- easing (input clamped 0..1) ----------
export const ease = {
  linear: (t) => clamp(t),
  inQuad: (t) => (t = clamp(t), t * t),
  outQuad: (t) => (t = clamp(t), 1 - (1 - t) * (1 - t)),
  inOutQuad: (t) => (t = clamp(t), t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2),
  inCubic: (t) => (t = clamp(t), t * t * t),
  outCubic: (t) => (t = clamp(t), 1 - (1 - t) ** 3),
  inOutCubic: (t) => (t = clamp(t), t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
  inQuart: (t) => (t = clamp(t), t ** 4),
  outQuart: (t) => (t = clamp(t), 1 - (1 - t) ** 4),
  inOutQuart: (t) => (t = clamp(t), t < 0.5 ? 8 * t ** 4 : 1 - (-2 * t + 2) ** 4 / 2),
  inExpo: (t) => (t = clamp(t), t === 0 ? 0 : 2 ** (10 * t - 10)),
  outExpo: (t) => (t = clamp(t), t === 1 ? 1 : 1 - 2 ** (-10 * t)),
  inOutExpo: (t) => (t = clamp(t), t === 0 ? 0 : t === 1 ? 1 : t < 0.5 ? 2 ** (20 * t - 10) / 2 : (2 - 2 ** (-20 * t + 10)) / 2),
  outBack: (t, s = 1.70158) => (t = clamp(t), 1 + (s + 1) * (t - 1) ** 3 + s * (t - 1) ** 2),
  inBack: (t, s = 1.70158) => (t = clamp(t), (s + 1) * t * t * t - s * t * t),
  inOutBack: (t, s = 1.70158 * 1.525) => (t = clamp(t), t < 0.5 ? ((2 * t) ** 2 * ((s + 1) * 2 * t - s)) / 2 : ((2 * t - 2) ** 2 * ((s + 1) * (t * 2 - 2) + s) + 2) / 2),
  outElastic: (t) => (t = clamp(t), t === 0 ? 0 : t === 1 ? 1 : 2 ** (-10 * t) * Math.sin((t * 10 - 0.75) * (TAU / 3)) + 1),
  outBounce: (t) => {
    t = clamp(t); const n = 7.5625, d = 2.75;
    if (t < 1 / d) return n * t * t;
    if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
    if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
    return n * (t -= 2.625 / d) * t + 0.984375;
  },
};

// ---------- deterministic randomness ----------
export function rng(seed = 1) {
  let a = (seed * 2654435761) >>> 0 || 1;
  const f = () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  f.range = (a, b) => a + (b - a) * f();
  f.int = (a, b) => Math.floor(a + (b - a + 1) * f());
  f.pick = (arr) => arr[Math.floor(f() * arr.length)];
  f.sign = () => (f() < 0.5 ? -1 : 1);
  f.gauss = () => { let u = 0, v = 0; while (u === 0) u = f(); while (v === 0) v = f(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v); };
  return f;
}
/** stateless hash → [0,1) for integer inputs */
export const hash = (i, j = 0, k = 0) => {
  let h = (i * 374761393 + j * 668265263 + k * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
};

// ---------- simplex noise (2D/3D), seeded ----------
const grad3 = [[1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0], [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1], [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]];
function buildPerm(seed) {
  const r = rng(seed), p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
  const perm = new Uint8Array(512), pm12 = new Uint8Array(512);
  for (let i = 0; i < 512; i++) { perm[i] = p[i & 255]; pm12[i] = perm[i] % 12; }
  return { perm, pm12 };
}
const P = buildPerm(7);
export function noise2(xin, yin) {
  const { perm, pm12 } = P, F2 = 0.5 * (Math.sqrt(3) - 1), G2 = (3 - Math.sqrt(3)) / 6;
  const s = (xin + yin) * F2, i = Math.floor(xin + s), j = Math.floor(yin + s), t = (i + j) * G2;
  const x0 = xin - (i - t), y0 = yin - (j - t);
  const i1 = x0 > y0 ? 1 : 0, j1 = x0 > y0 ? 0 : 1;
  const x1 = x0 - i1 + G2, y1 = y0 - j1 + G2, x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2;
  const ii = i & 255, jj = j & 255;
  let n = 0, tt;
  tt = 0.5 - x0 * x0 - y0 * y0; if (tt > 0) { const g = grad3[pm12[ii + perm[jj]]]; tt *= tt; n += tt * tt * (g[0] * x0 + g[1] * y0); }
  tt = 0.5 - x1 * x1 - y1 * y1; if (tt > 0) { const g = grad3[pm12[ii + i1 + perm[jj + j1]]]; tt *= tt; n += tt * tt * (g[0] * x1 + g[1] * y1); }
  tt = 0.5 - x2 * x2 - y2 * y2; if (tt > 0) { const g = grad3[pm12[ii + 1 + perm[jj + 1]]]; tt *= tt; n += tt * tt * (g[0] * x2 + g[1] * y2); }
  return 70 * n; // -1..1
}
export function noise3(x, y, z) {
  const { perm, pm12 } = P, F3 = 1 / 3, G3 = 1 / 6;
  const s = (x + y + z) * F3, i = Math.floor(x + s), j = Math.floor(y + s), k = Math.floor(z + s);
  const t = (i + j + k) * G3, x0 = x - (i - t), y0 = y - (j - t), z0 = z - (k - t);
  let i1, j1, k1, i2, j2, k2;
  if (x0 >= y0) { if (y0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0; } else if (x0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1; } else { i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1; } }
  else { if (y0 < z0) { i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1; } else if (x0 < z0) { i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1; } else { i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0; } }
  const x1 = x0 - i1 + G3, y1 = y0 - j1 + G3, z1 = z0 - k1 + G3, x2 = x0 - i2 + 2 * G3, y2 = y0 - j2 + 2 * G3, z2 = z0 - k2 + 2 * G3, x3 = x0 - 1 + 0.5, y3 = y0 - 1 + 0.5, z3 = z0 - 1 + 0.5;
  const ii = i & 255, jj = j & 255, kk = k & 255;
  const c = (tx, ty, tz, gi) => { let tt = 0.6 - tx * tx - ty * ty - tz * tz; if (tt < 0) return 0; const g = grad3[gi]; tt *= tt; return tt * tt * (g[0] * tx + g[1] * ty + g[2] * tz); };
  return 32 * (c(x0, y0, z0, pm12[ii + perm[jj + perm[kk]]]) + c(x1, y1, z1, pm12[ii + i1 + perm[jj + j1 + perm[kk + k1]]]) + c(x2, y2, z2, pm12[ii + i2 + perm[jj + j2 + perm[kk + k2]]]) + c(x3, y3, z3, pm12[ii + 1 + perm[jj + 1 + perm[kk + 1]]]));
}
export const fbm2 = (x, y, oct = 4) => { let a = 0.5, f = 1, s = 0; for (let i = 0; i < oct; i++) { s += a * noise2(x * f, y * f); f *= 2; a *= 0.5; } return s; };

// ---------- colour ----------
export function hex2rgb(h) { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map((c) => c + c).join(''); const n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
export const rgb = (r, g, b, a = 1) => `rgba(${r | 0},${g | 0},${b | 0},${a})`;
export function mixHex(a, b, t, alpha = 1) { const A = hex2rgb(a), B = hex2rgb(b); return rgb(lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t), alpha); }
export function withAlpha(hexc, a) { const [r, g, b] = hex2rgb(hexc); return rgb(r, g, b, a); }
export const hsl = (h, s, l, a = 1) => `hsla(${h},${s}%,${l}%,${a})`;

// The video's master palette. Section worlds are documented in STORYBOARD.md.
export const PAL = {
  night: '#0A0D1C', night2: '#141A35', orange: '#FF6A1F', orangeHot: '#FF8A3D', claude: '#E8743B',
  paper: '#F4EDE0', paper2: '#E9DFCC', ink: '#1F2A55', red: '#E8343F', white: '#FFFBF4', black: '#0E0E12',
  sky: '#6EC3F0', skyDeep: '#2E8BE0', sun: '#FFD23F', cloud: '#FFFFFF',
  pink: '#FF3E8A', pop: '#FF7A1A', yellow: '#FFE14D', purple: '#7B2FF7',
  blue: '#2B2BFF', winGrey: '#C3C3C3', errRed: '#FF2A2A',
  gold: '#FFC300', gold2: '#E0A100', cream: '#FFF4D6',
  lilac: '#B79CFF', cyan: '#3EF0FF', mint: '#7CFFC4', chrome: '#DDE3EE',
  peach: '#FFB38A', rose: '#FF8FB1', sunset: '#FFB000', lav: '#C9B6FF',
  dawn: '#FF9E5E', dawnSky: '#8FD3FF',
};

// ---------- canvas helpers ----------
const pools = new Map();
/** persistent offscreen canvas by name (recreated if size changes) */
export function buf(name, w = W, h = H) {
  let c = pools.get(name);
  if (!c || c.width !== w || c.height !== h) { c = document.createElement('canvas'); c.width = w; c.height = h; c._ctx = c.getContext('2d', { willReadFrequently: name.startsWith('read') }); pools.set(name, c); }
  return c;
}
export const bctx = (c) => c._ctx || c.getContext('2d');

export function font(ctx, size, family = 'Anton', weight = '400', style = 'normal') {
  ctx.font = `${style} ${weight} ${size}px "${family}"`;
}
/** Draw text centred at (x,y) fitted to maxW. Returns the used size. */
export function fitText(ctx, str, x, y, maxW, size, family = 'Anton', weight = '400') {
  font(ctx, size, family, weight);
  const m = ctx.measureText(str).width;
  if (m > maxW) { size = size * maxW / m; font(ctx, size, family, weight); }
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
  return size;
}
export function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
export function star(ctx, x, y, r1, r2, n = 5, rot = -Math.PI / 2) {
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) { const r = i % 2 ? r2 : r1, a = rot + (i * Math.PI) / n; ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
  ctx.closePath();
}
export function heart(ctx, x, y, s) {
  ctx.beginPath(); ctx.moveTo(x, y + s * 0.35);
  ctx.bezierCurveTo(x - s * 1.1, y - s * 0.35, x - s * 0.45, y - s * 1.05, x, y - s * 0.45);
  ctx.bezierCurveTo(x + s * 0.45, y - s * 1.05, x + s * 1.1, y - s * 0.35, x, y + s * 0.35);
  ctx.closePath();
}
/** radial sunburst rays */
export function rays(ctx, cx, cy, n, r, rot, colA, colB) {
  for (let i = 0; i < n; i++) {
    const a0 = rot + (i / n) * TAU, a1 = rot + ((i + 1) / n) * TAU;
    ctx.fillStyle = i % 2 ? colA : colB;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a0) * r, cy + Math.sin(a0) * r); ctx.lineTo(cx + Math.cos(a1) * r, cy + Math.sin(a1) * r); ctx.closePath(); ctx.fill();
  }
}
/** halftone dot grid; sizeFn(x,y) → radius */
export function halftone(ctx, step, color, sizeFn, ox = 0, oy = 0) {
  ctx.fillStyle = color; ctx.beginPath();
  for (let y = oy % step - step; y < H + step; y += step) for (let x = ox % step - step; x < W + step; x += step) {
    const r = sizeFn(x, y); if (r > 0.3) { ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, TAU); }
  }
  ctx.fill();
}
export function cover(ctx, img, x = 0, y = 0, w = W, h = H) {
  const s = Math.max(w / img.width, h / img.height), dw = img.width * s, dh = img.height * s;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

// ---------- text → points (cached) ----------
const ptCache = new Map();
/**
 * Sample points inside rendered text (or any draw fn). Returns [{x,y}] centred on (0,0) in px.
 * opts: {size, family, weight, step, maxW, lines:[...]} — step is the grid spacing in px.
 */
export function textPoints(str, { size = 300, family = 'Anton', weight = '400', step = 6, maxW = 1700, lineH = 0.95 } = {}) {
  const key = [str, size, family, weight, step, maxW, lineH].join('|');
  if (ptCache.has(key)) return ptCache.get(key);
  const lines = String(str).split('\n');
  const c = buf('read-textpts', W, H), x = bctx(c);
  x.clearRect(0, 0, W, H); x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle';
  font(x, size, family, weight);
  let s = size; for (const L of lines) { const m = x.measureText(L).width; if (m > maxW) s = Math.min(s, size * maxW / m); }
  font(x, s, family, weight);
  lines.forEach((L, i) => x.fillText(L, W / 2, H / 2 + (i - (lines.length - 1) / 2) * s * lineH));
  const pts = sampleAlpha(x, step);
  ptCache.set(key, pts); return pts;
}
/** points from any drawing callback(ctx) on a W×H canvas, centred on (0,0) */
export function shapePoints(key, drawFn, step = 6) {
  if (ptCache.has(key)) return ptCache.get(key);
  const c = buf('read-shapepts', W, H), x = bctx(c);
  x.clearRect(0, 0, W, H); x.save(); drawFn(x); x.restore();
  const pts = sampleAlpha(x, step); ptCache.set(key, pts); return pts;
}
function sampleAlpha(x, step) {
  const d = x.getImageData(0, 0, W, H).data, pts = [];
  for (let y = 0; y < H; y += step) for (let xx = 0; xx < W; xx += step) {
    if (d[(y * W + xx) * 4 + 3] > 128) pts.push({ x: xx - W / 2, y: y - H / 2, r: d[(y * W + xx) * 4], g: d[(y * W + xx) * 4 + 1], b: d[(y * W + xx) * 4 + 2] });
  }
  return pts;
}

/** deterministic stateful simulation cache. Re-simulates from scratch if asked to go back in time. */
const sims = new Map();
export function sim(key, step, init, advance) {
  let s = sims.get(key);
  if (!s || s.step > step) { s = { step: 0, state: init() }; sims.set(key, s); }
  while (s.step < step) { advance(s.state, s.step); s.step++; }
  return s.state;
}
