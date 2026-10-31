// Shared helpers for the final chorus (g9): the per-beat "every world" palette carousel + display type.
import { A } from '../../core/audio.js';
import { font, buf, bctx, rng, hex2rgb, clamp } from '../../core/lib.js';

// Every world of the video as a usable colour set.
// bg = dominant field · bg2 = second field · a = loud accent · b = second accent · ink = outlines/type · lite = paper/white
export const SETS = [
  { k: 'pop', bg: '#FF3E8A', bg2: '#FF7A1A', a: '#FFE14D', b: '#7B2FF7', ink: '#2A0B3D', lite: '#FFFBF4' },
  { k: 'net', bg: '#2B2BFF', bg2: '#FFFFFF', a: '#FF2A2A', b: '#3EF0FF', ink: '#0E0E12', lite: '#FFFFFF' },
  { k: 'gold', bg: '#FFC300', bg2: '#E0A100', a: '#111111', b: '#FF6A1F', ink: '#111111', lite: '#FFF4D6' },
  { k: 'neon', bg: '#B79CFF', bg2: '#3EF0FF', a: '#7CFFC4', b: '#1A1240', ink: '#1A1240', lite: '#DDE3EE' },
  { k: 'mint', bg: '#7CFFC4', bg2: '#3EF0FF', a: '#FF3E8A', b: '#2B2BFF', ink: '#10233A', lite: '#FFFFFF' },
  { k: 'sky', bg: '#6EC3F0', bg2: '#2E8BE0', a: '#FFD23F', b: '#FFFFFF', ink: '#1F2A55', lite: '#FFFFFF' },
  { k: 'paper', bg: '#F4EDE0', bg2: '#E9DFCC', a: '#E8343F', b: '#FF6A1F', ink: '#1F2A55', lite: '#FFFFFF' },
  { k: 'sunset', bg: '#FF8FB1', bg2: '#FFB38A', a: '#FFB000', b: '#C9B6FF', ink: '#3A1F4F', lite: '#FFF4EA' },
];
export const SET = Object.fromEntries(SETS.map((s) => [s.k, s]));
/** colour set for the beat containing t (swaps on every beat) */
export function setAt(t, off = 0) {
  const i = A.beat(t).i + off, n = SETS.length;
  return SETS[((i % n) + n) % n];
}

/** big display type with optional outline + hard offset shadow. Returns the used size. */
export function bigType(ctx, str, x, y, o = {}) {
  const { size = 200, family = 'Anton', weight = '400', fill = '#fff', stroke = null, sw = 0, shadow = null, sx = 0, sy = 0,
    maxW = 1e9, align = 'center', base = 'middle', track = 0, style = 'normal' } = o;
  font(ctx, size, family, weight, style);
  ctx.letterSpacing = track ? `${track}px` : '0px';
  let s = size; const m = ctx.measureText(str).width;
  if (m > maxW) { s = size * maxW / m; font(ctx, s, family, weight, style); }
  const k = s / size;
  ctx.textAlign = align; ctx.textBaseline = base; ctx.lineJoin = 'round'; ctx.miterLimit = 2;
  if (shadow) {
    ctx.fillStyle = shadow;
    if (stroke && sw) { ctx.strokeStyle = shadow; ctx.lineWidth = sw * k; ctx.strokeText(str, x + sx * k, y + sy * k); }
    ctx.fillText(str, x + sx * k, y + sy * k);
  }
  if (stroke && sw) { ctx.strokeStyle = stroke; ctx.lineWidth = sw * k; ctx.strokeText(str, x, y); }
  ctx.fillStyle = fill; ctx.fillText(str, x, y);
  ctx.letterSpacing = '0px';
  return s;
}

/** cached monochrome grain / paper-fibre texture (transparent, white+black specks) */
export function grainTex(name, w, h, seed = 3, density = 0.5) {
  const key = 'g9-grain-' + name;
  const c = buf(key, w, h);
  if (c._done) return c;
  const x = bctx(c), img = x.createImageData(w, h), d = img.data, r = rng(seed);
  for (let i = 0; i < w * h; i++) {
    const v = r();
    if (v < density) {
      const k = r() < 0.5 ? 0 : 255;
      d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = k; d[i * 4 + 3] = Math.floor(r() * 26);
    }
  }
  // a few long paper fibres
  x.putImageData(img, 0, 0);
  x.lineCap = 'round';
  for (let i = 0; i < (w * h) / 9000; i++) {
    const px = r() * w, py = r() * h, a = r() * Math.PI * 2, L = 6 + r() * 26;
    x.strokeStyle = r() < 0.5 ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.12)'; x.lineWidth = 0.6 + r();
    x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + Math.cos(a + 0.6) * L * 0.5, py + Math.sin(a + 0.6) * L * 0.5, px + Math.cos(a) * L, py + Math.sin(a) * L); x.stroke();
  }
  c._done = true;
  return c;
}

/** linear rgb mix of two hex colours → [r,g,b] */
export function mixRGB(a, b, t) {
  const A_ = hex2rgb(a), B_ = hex2rgb(b); t = clamp(t);
  return [A_[0] + (B_[0] - A_[0]) * t, A_[1] + (B_[1] - A_[1]) * t, A_[2] + (B_[2] - A_[2]) * t];
}
export const css = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
