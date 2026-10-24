// Pixel-art room backdrops for the sprite.
//
//   pixelRoom({ width, height, variant, eyeLine, seed }) -> SVG string
//
// The room is painted on a 6 px cell grid with flat colours, soft per-object
// outlines and 2-3 tone shading, in the same retro "trainer sprite" style as the
// character, then encoded as one <path> of merged rectangles per colour
// (shape-rendering crispEdges). It is meant to sit BEHIND the sprite:
//   - panel layout (width >= height): the rounded panel at the bottom of light
//     scenes, 963 x 513 visible (or 963 x 700, the full .panel box). The head pokes
//     out above, chest and shoulders cover the middle, so decor lives in the left
//     and right thirds.
//   - full layout (height > width): full-bleed 1080 x 1920 behind the big close-up.
//     Decor sits at the edges and the top, around the head.
// eyeLine is the y (px, in this SVG's coordinates) of the character's eyes. It
// anchors the vertical layout: door handles, shelves and pictures keep their
// real-world heights relative to eye level. Defaults match engine.css geometry
// (panel: -26, the eyes sit just above the panel top; full: 552).
// Everything is deterministic: same arguments, same SVG.

const PX = 6;

export const ROOM_VARIANTS = Object.freeze(['sage', 'cream', 'blue', 'studio', 'mint', 'blush']);

/* ---------------- colour ---------------- */

const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const hex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('').toUpperCase();
const mix = (a, b, t) => { const A = rgb(a), B = rgb(b); return hex(A.map((v, i) => v + (B[i] - v) * t)); };

/* ---------------- palettes ---------------- */

const GREENS = { line: '#2F4A35', dark: '#4A7048', mid: '#628A55', light: '#86AE6A', hi: '#A9C97E', stem: '#55703F' };
const BOOKS = ['#8E4A44', '#3F5E80', '#D3AE5C', '#5C7A5A', '#E6DECB', '#3A3A44', '#B9774E', '#7A6A8E'];

const PALETTES = {
  sage: {
    wall: '#C5CCBB', wallLight: '#CDD3C4', wallDark: '#B8C0AE', shadow: '#55604F',
    trim: '#EFEFE8', trimLo: '#D7D9CE', trimHi: '#FAFAF5', trimLine: '#A2A898',
    metal: '#3E413D', metalHi: '#80847C', wood: '#9C7656', woodLo: '#7A5A40', woodHi: '#BC9670', woodLine: '#5A4231',
    floor: ['#B68C66', '#A67D58', '#C9A07A', '#8A6446'],
  },
  cream: {
    wall: '#E7DBC4', wallLight: '#EEE4D0', wallDark: '#DBCDB3', shadow: '#6A5843',
    trim: '#F4EEE1', trimLo: '#E2D9C6', trimHi: '#FCF9F1', trimLine: '#B9AB92',
    metal: '#B48A3E', metalHi: '#E6C77C', wood: '#9A6A44', woodLo: '#784E31', woodHi: '#BE8A5E', woodLine: '#553522',
    floor: ['#A8754C', '#976743', '#BD8A5F', '#7A5232'],
  },
  blue: {
    wall: '#B8C7D3', wallLight: '#C3D1DB', wallDark: '#AABAC7', shadow: '#43546A',
    trim: '#F1F3F2', trimLo: '#D8DEE2', trimHi: '#FFFFFF', trimLine: '#95A3AF',
    metal: '#3F4247', metalHi: '#80858C', wood: '#A87D58', woodLo: '#83603F', woodHi: '#C99D74', woodLine: '#5E432C',
    floor: ['#C2A07C', '#B2916E', '#D3B391', '#93745A'],
  },
  studio: {
    wall: '#2E2A36', wallLight: '#3A3245', wallDark: '#25222C', shadow: '#121016',
    trim: '#3B3744', trimLo: '#2A2731', trimHi: '#4C4757', trimLine: '#1A181F',
    metal: '#1D1B22', metalHi: '#56515F', wood: '#4E3B33', woodLo: '#3A2B25', woodHi: '#6B5145', woodLine: '#1E1613',
    neon: '#FF5FA8', neonCore: '#FFD6EA', cyan: '#4FDDF2', cyanCore: '#D8FAFF', warm: '#FFB45E',
    floor: ['#3A3036', '#332A30', '#463A40', '#221C21'],
  },
  mint: {
    wall: '#CBE1D3', wallLight: '#D5E8DB', wallDark: '#BED6C7', shadow: '#466053',
    trim: '#F5F7F3', trimLo: '#DDE5DE', trimHi: '#FFFFFF', trimLine: '#A0B3A6',
    metal: '#3C3F3D', metalHi: '#7F8580', wood: '#D2AE84', woodLo: '#B38D63', woodHi: '#E6C8A2', woodLine: '#7D5F41',
    floor: ['#D6B892', '#C9AA83', '#E4CBA8', '#A88B67'],
  },
  blush: {
    wall: '#E6CEC4', wallLight: '#EDD8CF', wallDark: '#DBC0B5', shadow: '#6B4A44',
    trim: '#F6EFEA', trimLo: '#E6DAD3', trimHi: '#FFFBF8', trimLine: '#BCA49B',
    metal: '#B88E44', metalHi: '#E8C77E', wood: '#A97B5B', woodLo: '#865C41', woodHi: '#C99C7A', woodLine: '#5E3F2C',
    floor: ['#C9A587', '#BA9679', '#D9B99D', '#9A7860'],
  },
};

/** Flat base colour of a variant's wall (handy as the panel's background-color). */
export function roomColor(variant = 'sage') { return (PALETTES[variant] || PALETTES.sage).wall; }

/* ---------------- raster ---------------- */

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hash = s => { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };

class Grid {
  constructor(w, h) { this.w = w; this.h = h; this.a = new Array(w * h).fill(null); }
  ok(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
  get(x, y) { return this.ok(x, y) ? this.a[y * this.w + x] : null; }
  set(x, y, c) { x = Math.round(x); y = Math.round(y); if (c && this.ok(x, y)) this.a[y * this.w + x] = c; }
  rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c); }
  hl(x0, x1, y, c) { for (let x = x0; x <= x1; x++) this.set(x, y, c); }
  vl(x, y0, y1, c) { for (let y = y0; y <= y1; y++) this.set(x, y, c); }
  frame(x, y, w, h, c) { this.hl(x, x + w - 1, y, c); this.hl(x, x + w - 1, y + h - 1, c); this.vl(x, y, y + h - 1, c); this.vl(x + w - 1, y, y + h - 1, c); }
  checker(x, y, w, h, c, par = 0) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (((x + i + y + j) & 1) === par) this.set(x + i, y + j, c); }
  map(x, y, w, h, fn) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const X = x + i, Y = y + j; if (!this.ok(X, Y)) continue;
      const k = Y * this.w + X, v = fn(this.a[k], X, Y); if (v) this.a[k] = v;
    }
  }
  line(x0, y0, x1, y1, c) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let e = dx + dy;
    for (;;) { this.set(x0, y0, c); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
  }
}

// A boolean cell mask for organic shapes; paint() gives it a sprite-style
// outline plus a top-left highlight and bottom-right shade.
class Mask {
  constructor(g) { this.g = g; this.w = g.w; this.h = g.h; this.m = new Uint8Array(g.w * g.h); }
  has(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h && this.m[y * this.w + x] === 1; }
  add(x, y) { if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.m[y * this.w + x] = 1; return this; }
  del(x, y) { if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.m[y * this.w + x] = 0; return this; }
  rect(x, y, w, h) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.add(x + i, y + j); return this; }
  ellipse(cx, cy, rx, ry) {
    for (let y = Math.floor(cy - ry - 1); y <= cy + ry + 1; y++) for (let x = Math.floor(cx - rx - 1); x <= cx + rx + 1; x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry; if (dx * dx + dy * dy <= 1) this.add(x, y);
    }
    return this;
  }
  poly(pts) {
    const ys = pts.map(p => p[1]), y0 = Math.floor(Math.min(...ys)), y1 = Math.ceil(Math.max(...ys));
    for (let y = y0; y <= y1; y++) {
      const yc = y + 0.5, xs = [];
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length];
        if ((a[1] <= yc && b[1] > yc) || (b[1] <= yc && a[1] > yc)) xs.push(a[0] + (yc - a[1]) / (b[1] - a[1]) * (b[0] - a[0]));
      }
      xs.sort((p, q) => p - q);
      for (let i = 0; i + 1 < xs.length; i += 2) for (let x = Math.ceil(xs[i] - 0.5); x <= Math.floor(xs[i + 1] - 0.5); x++) this.add(x, y);
    }
    return this;
  }
  // Pointed leaf from (bx,by) to (tx,ty); round < 1 gives fuller leaves.
  leaf(bx, by, tx, ty, wid, round = 0.75) {
    const L = Math.hypot(tx - bx, ty - by), ux = (tx - bx) / L, uy = (ty - by) / L;
    const r = Math.max(L, wid) + 2;
    for (let y = Math.floor(Math.min(by, ty) - r / 2); y <= Math.max(by, ty) + r / 2; y++)
      for (let x = Math.floor(Math.min(bx, tx) - r / 2); x <= Math.max(bx, tx) + r / 2; x++) {
        const px = x + 0.5 - bx, py = y + 0.5 - by, t = (px * ux + py * uy) / L, d = Math.abs(-px * uy + py * ux);
        if (t >= 0 && t <= 1 && d <= wid / 2 * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.8)), round)) this.add(x, y);
      }
    return this;
  }
  paint({ fill, line, hi, lo, hiD = 1, loD = 1 }) {
    const g = this.g;
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (!this.has(x, y)) continue;
      const edge = !this.has(x - 1, y) || !this.has(x + 1, y) || !this.has(x, y - 1) || !this.has(x, y + 1);
      let c = fill;
      if (edge && line) c = line;
      else if (lo && (!this.has(x + loD + 1, y) || !this.has(x, y + loD + 1))) c = lo;
      else if (hi && (!this.has(x - hiD - 1, y) || !this.has(x, y - hiD - 1))) c = hi;
      g.set(x, y, c);
    }
    return this;
  }
  // Soft drop shadow on whatever is behind (usually the wall), offset down-right.
  shadow(c, dx = 1, dy = 1, t = 0.16) {
    const g = this.g, cache = {};
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (!this.has(x, y) || this.has(x + dx, y + dy)) continue;
      const k = g.get(x + dx, y + dy); if (!k) continue;
      g.set(x + dx, y + dy, cache[k] || (cache[k] = mix(k, c.p.shadow, t)));
    }
    return this;
  }
}

/* ---------------- encode ---------------- */

// Greedy rectangle cover per colour (runs right, then down), one <path> per colour.
function encode(g, bg) {
  const used = new Uint8Array(g.w * g.h), paths = new Map();
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    const k = y * g.w + x, c = g.a[k];
    if (used[k] || !c || c === bg) { used[k] = 1; continue; }
    let x1 = x;
    while (x1 + 1 < g.w && !used[k + x1 + 1 - x] && g.a[k + x1 + 1 - x] === c) x1++;
    let y1 = y;
    grow: while (y1 + 1 < g.h) {
      const r = (y1 + 1) * g.w;
      for (let i = x; i <= x1; i++) if (used[r + i] || g.a[r + i] !== c) break grow;
      y1++;
    }
    for (let j = y; j <= y1; j++) used.fill(1, j * g.w + x, j * g.w + x1 + 1);
    const w = x1 - x + 1, h = y1 - y + 1;
    if (!paths.has(c)) paths.set(c, []);
    paths.get(c).push(`M${x} ${y}h${w}v${h}h-${w}z`);
  }
  return [...paths].map(([c, d]) => `<path fill="${c}" d="${d.join('')}"/>`).join('');
}

/* ---------------- props ---------------- */

// Wall: three lighting tones (light pooled behind the head, darker toward the
// edges), joined by one-cell checker dither like hand-made pixel art.
function wall(c) {
  const { g, p } = c;
  const cx = g.w / 2, cy = c.Y(c.full ? 120 : 60);
  const rx = g.w * (c.full ? 0.62 : 0.58), ry = c.full ? g.h * 0.36 : g.h * 1.25;
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
    const f = 1 - Math.sqrt(dx * dx + dy * dy) + (((x + y) & 1) ? 0.012 : -0.012);
    g.a[y * g.w + x] = f > 0.5 ? p.wallLight : f > 0.06 ? p.wall : p.wallDark;
  }
}

// Soft light pool on the wall (lamp glow, neon spill): two dithered rings.
function glow(c, cx, cy, rx, ry, col, t1 = 0.18, t2 = 0.34) {
  const { g } = c, cache = {}, jit = Math.min(0.06, 0.7 / Math.min(rx, ry)); // ~1-cell checker seam
  const tint = (k, t) => cache[k + t] || (cache[k + t] = mix(k, col, t));
  g.map(Math.floor(cx - rx - 1), Math.floor(cy - ry - 1), Math.ceil(rx * 2 + 3), Math.ceil(ry * 2 + 3), (k, x, y) => {
    if (!k) return null;
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = Math.sqrt(dx * dx + dy * dy) + (((x + y) & 1) ? jit : -jit);
    return d < 0.55 ? tint(k, t2) : d < 1 ? tint(k, t1) : null;
  });
}

// Door in its casing from row `top` down past the bottom edge; hinge on the right,
// so the handle sits on the left stile, where it stays visible beside the sprite.
function door(c, { x, w, top, handleY, knob = 'lever' }) {
  const { g, p } = c, cw = c.S(36), bottom = Math.min(g.h, c.floor), x1 = x + w - 1;
  const slab = mix(p.trim, p.wall, 0.1), panel = mix(p.trim, p.wall, 0.2), panelLo = mix(panel, p.shadow, 0.14);
  new Mask(g).rect(x, top, w, bottom - top).shadow(c, -1, 0, 0.12);
  g.rect(x, top, w, bottom - top, p.trim);
  g.vl(x, top, bottom, p.trimLine); g.vl(x1, top, bottom, p.trimLine); g.hl(x, x1, top, p.trimLine);
  g.vl(x + 1, top + 1, bottom, p.trimHi); g.hl(x + 1, x1 - 1, top + 1, p.trimHi);
  const dx = x + cw, dy = top + cw, dw = w - 2 * cw;
  g.rect(dx, dy, dw, bottom - dy, slab);
  g.vl(dx - 1, dy - 1, bottom, p.trimLo); g.hl(dx - 1, dx + dw, dy - 1, p.trimLo);
  g.vl(dx, dy, bottom, mix(slab, p.shadow, 0.1));
  // shaker panels: lock stile on the left, lock rail at handle height
  const st = c.S(70), px0 = dx + st, pw = dw - 2 * st, railH = c.S(66);
  const upper = [dy + c.S(70), handleY - Math.round(railH / 2)];
  const lower = [handleY + Math.round(railH / 2) + 1, bottom + 2];
  for (const [y0, y1] of [upper, lower]) {
    if (y1 - y0 < 3 || pw < 3) continue;
    g.rect(px0, y0, pw, y1 - y0, panel);
    g.hl(px0, px0 + pw - 1, y0, panelLo); g.vl(px0, y0, y1 - 1, panelLo);
    g.hl(px0 + 1, px0 + pw - 1, y1 - 1, p.trimHi); g.vl(px0 + pw - 1, y0 + 1, y1 - 1, p.trimHi);
  }
  // handle: round rose with a lever reaching toward the hinge
  const hx = dx + Math.max(3, Math.round(st * 0.45)), hy = handleY, dark = mix(p.metal, '#000000', 0.35);
  if (knob === 'lever') { // tall backplate, lever with a rounded, slightly dropped end
    const len = Math.max(6, c.S(54)), ph = Math.max(6, c.S(48));
    const plate = new Mask(g).rect(hx - 1, hy - Math.round(ph / 2), 3, ph);
    plate.del(hx - 1, hy - Math.round(ph / 2)).del(hx + 1, hy - Math.round(ph / 2)).del(hx - 1, hy - Math.round(ph / 2) + ph - 1).del(hx + 1, hy - Math.round(ph / 2) + ph - 1);
    plate.shadow(c, 1, 1, 0.22).paint({ fill: mix(p.metal, p.trim, 0.25), line: mix(p.metal, p.trim, 0.1) });
    const lv = new Mask(g).rect(hx, hy - 2, len, 2).rect(hx + len - 2, hy - 1, 2, 2);
    lv.shadow(c, 1, 1, 0.3).paint({ fill: p.metal, line: dark });
    g.hl(hx + 1, hx + len - 2, hy - 2, p.metalHi);
    g.set(hx, hy - 2, dark); g.set(hx, hy - 1, dark);
  } else {
    new Mask(g).ellipse(hx + 0.5, hy + 0.5, 2.4, 2.4).shadow(c, 1, 1, 0.3).paint({ fill: p.metal, line: dark, hi: p.metalHi });
  }
}

function windowFrame(c, { x, y, w, h, sky = ['#CFE3F1', '#E3EFF6', '#F2F6F4'], trees = true, cols = 2, rows = 2, sill = true }) {
  const { g, p } = c, cw = c.S(30), bar = Math.max(2, c.S(14));
  new Mask(g).rect(x, y, w, h).shadow(c, 1, 1, 0.14);
  g.rect(x, y, w, h, p.trim); g.frame(x, y, w, h, p.trimLine);
  g.hl(x + 1, x + w - 2, y + 1, p.trimHi); g.vl(x + 1, y + 1, y + h - 2, p.trimHi);
  const gx = x + cw, gy = y + cw, gw = w - 2 * cw, gh = h - 2 * cw;
  // sky bands; each seam is a two-row checker so it reads as a soft gradient
  const seam = gh / sky.length;
  for (let j = 0; j < gh; j++) {
    const band = Math.min(sky.length - 1, Math.floor(j / seam)), d = j - (band + 1) * seam; // d in (-seam, 0]
    for (let i = 0; i < gw; i++) {
      const chk = ((gx + i + gy + j) & 1) === 0;
      const b = d > -2.5 && band < sky.length - 1 && chk ? band + 1 : (j - band * seam < 2 && band > 0 && chk ? band - 1 : band);
      g.set(gx + i, gy + j, sky[b]);
    }
  }
  if (trees) { // distant tree line, soft
    const r = c.rnd, base = gy + gh;
    const far = mix(GREENS.light, sky[sky.length - 1], 0.55), near = mix(GREENS.mid, sky[sky.length - 1], 0.4);
    for (const [col, hgt, n] of [[far, 0.42, 7], [near, 0.26, 6]]) {
      const m = new Mask(g);
      for (let i = 0; i < n; i++) {
        const cx = gx + gw * (i + 0.2 + r() * 0.6) / n, ry = gh * hgt * (0.55 + r() * 0.45), rx = gw / n * (0.7 + r() * 0.4);
        m.ellipse(cx, base, rx, ry);
      }
      for (let j = gy; j < gy + gh; j++) for (let i = gx; i < gx + gw; i++) if (m.has(i, j)) g.set(i, j, col);
    }
  }
  // glare streaks
  const glare = mix(sky[0], '#FFFFFF', 0.6);
  for (let s = 0; s < 2; s++) {
    const o = Math.round(gw * (0.25 + s * 0.12));
    for (let j = 0; j < gh; j++) { const i = o + Math.round(j * 0.9) - Math.round(gh * 0.3); if (i >= 0 && i < gw && j < gh * 0.75) { g.set(gx + i, gy + j, glare); if (s === 0) g.set(gx + i + 1, gy + j, glare); } }
  }
  // sash bars
  for (let i = 1; i < cols; i++) { const bx = gx + Math.round(gw * i / cols - bar / 2); g.rect(bx, gy, bar, gh, p.trim); g.vl(bx + bar, gy, gy + gh - 1, p.trimLo); }
  for (let j = 1; j < rows; j++) { const by = gy + Math.round(gh * j / rows - bar / 2); g.rect(gx, by, gw, bar, p.trim); g.hl(gx, gx + gw - 1, by + bar, p.trimLo); }
  g.hl(gx, gx + gw - 1, gy, p.trimLo); g.vl(gx, gy, gy + gh - 1, p.trimLo);
  if (sill) {
    const sy = y + h - 1, sx = x - 2, sw = w + 4;
    new Mask(g).rect(sx, sy, sw, 3).shadow(c, 0, 2, 0.2);
    g.rect(sx, sy, sw, 3, p.trim); g.frame(sx, sy, sw, 3, p.trimLine); g.hl(sx + 1, sx + sw - 2, sy + 1, p.trimHi);
  }
}

function curtain(c, { x, y, w, h, fill, rod = true, folds = 5 }) {
  const { g, p } = c;
  const lo = mix(fill, p.shadow, 0.16), lo2 = mix(fill, p.shadow, 0.28), hi = mix(fill, '#FFFFFF', 0.4);
  for (let i = 0; i < w; i++) {
    const ph = ((i / w) * folds) % 1, tone = ph < 0.18 ? hi : ph < 0.55 ? fill : ph < 0.8 ? lo : lo2;
    const hem = y + h - 1 - (ph > 0.55 ? 1 : 0);
    g.vl(x + i, y, hem, tone);
    g.set(x + i, hem, ph < 0.55 ? lo : lo2);
  }
  g.vl(x + w, y, y + h - 2, mix(p.wall, p.shadow, 0.14));
  if (rod) {
    g.hl(x - 2, x + w + 3, y - 1, p.metal);
    g.rect(x - 4, y - 2, 2, 3, p.metal); g.set(x - 4, y - 2, p.metalHi);
  }
}

function frameArt(c, { x, y, w, h, frame = 'wood', mat = true, art = 'hills' }) {
  const { g, p } = c;
  const F = frame === 'wood' ? [p.wood, p.woodLine, p.woodHi] : frame === 'black' ? ['#2E2E30', '#141416', '#5A5A5E']
    : frame === 'gold' ? ['#C49A4A', '#7A5A24', '#EACB86'] : [p.trim, p.trimLine, p.trimHi];
  new Mask(g).rect(x, y, w, h).shadow(c, 1, 1, 0.22);
  g.rect(x, y, w, h, F[0]); g.frame(x, y, w, h, F[1]);
  g.hl(x + 1, x + w - 2, y + 1, F[2]); g.vl(x + 1, y + 1, y + h - 2, F[2]);
  const ft = 2, mt = mat ? Math.max(2, Math.round(Math.min(w, h) * 0.12)) : 0;
  const mx = x + ft, my = y + ft, mw = w - 2 * ft, mh = h - 2 * ft;
  if (mat) { g.rect(mx, my, mw, mh, '#F4F1EA'); g.hl(mx, mx + mw - 1, my, '#D9D4C9'); g.vl(mx, my, my + mh - 1, '#D9D4C9'); }
  const ax = mx + mt, ay = my + mt, aw = mw - 2 * mt, ah = mh - 2 * mt;
  ART[art](c, ax, ay, aw, ah);
  if (mat) { g.hl(ax - 1, ax + aw, ay - 1, '#CFC9BC'); g.vl(ax - 1, ay - 1, ay + ah, '#CFC9BC'); }
}

const ART = {
  hills(c, x, y, w, h) {
    const { g } = c;
    g.rect(x, y, w, h, '#F1D9B5');
    g.rect(x, y + Math.round(h * 0.45), w, h - Math.round(h * 0.45), '#EBC598');
    new Mask(g).ellipse(x + w * 0.66, y + h * 0.36, w * 0.17, w * 0.17).paint({ fill: '#E58B57' });
    const m1 = new Mask(g).ellipse(x + w * 0.2, y + h * 1.05, w * 0.55, h * 0.48);
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (m1.has(i, j)) g.set(i, j, '#8FA27A');
    const m2 = new Mask(g).ellipse(x + w * 0.85, y + h * 1.12, w * 0.6, h * 0.42);
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (m2.has(i, j)) g.set(i, j, '#5F7E5C');
  },
  abstract(c, x, y, w, h) {
    const { g } = c;
    g.rect(x, y, w, h, '#EFE6D6');
    g.rect(x, y + Math.round(h * 0.55), Math.round(w * 0.6), h - Math.round(h * 0.55), '#D9895B');
    new Mask(g).ellipse(x + w * 0.62, y + h * 0.36, w * 0.24, w * 0.24).paint({ fill: '#3F5E80' });
    g.rect(x + Math.round(w * 0.6), y + Math.round(h * 0.7), Math.round(w * 0.4), Math.round(h * 0.3), '#E3BF62');
  },
  sun(c, x, y, w, h) {
    const { g } = c;
    for (let j = 0; j < h; j++) g.hl(x, x + w - 1, y + j, j < h * 0.6 ? '#F3D7B6' : j < h * 0.75 ? '#E9B68D' : '#5D7FA0');
    new Mask(g).ellipse(x + w / 2, y + h * 0.6, w * 0.26, w * 0.26).paint({ fill: '#E2764C' });
    for (let j = Math.round(h * 0.75); j < h; j++) g.hl(x, x + w - 1, y + j, ((j & 1) ? '#5D7FA0' : '#6E90AE'));
  },
  botanical(c, x, y, w, h) {
    const { g } = c;
    g.rect(x, y, w, h, '#F0EADC');
    const cx = x + w / 2;
    g.vl(Math.round(cx), y + Math.round(h * 0.18), y + h - 2, '#5C7A4A');
    for (let i = 0; i < 4; i++) {
      const yy = y + h * (0.28 + i * 0.16), side = i % 2 ? 1 : -1;
      new Mask(g).leaf(cx, yy + 1, cx + side * w * 0.36, yy - h * 0.1, Math.max(2, w * 0.2), 0.6).paint({ fill: '#7E9B66', line: '#5C7A4A' });
    }
  },
  waves(c, x, y, w, h) {
    const { g } = c;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const v = Math.sin((i / w) * Math.PI * 2 + j * 0.5) * 0.5 + j / h * 3;
      g.set(x + i, y + j, ['#F1E6D2', '#BFD3DA', '#7FA6B8', '#4E7690'][Math.max(0, Math.min(3, Math.floor(v)))]);
    }
  },
};

function shelf(c, { x, w, y, color = 'wood', brackets = false }) {
  const { g, p } = c;
  const [f, lo, hi, line] = color === 'wood' ? [p.wood, p.woodLo, p.woodHi, p.woodLine] : [p.trim, p.trimLo, p.trimHi, p.trimLine];
  new Mask(g).rect(x, y, w, 3).shadow(c, 0, 2, 0.24);
  new Mask(g).rect(x, y + 3, w, 1).shadow(c, 0, 1, 0.12);
  g.rect(x, y, w, 3, f); g.hl(x, x + w - 1, y, hi); g.hl(x, x + w - 1, y + 2, lo);
  g.vl(x, y, y + 2, line); g.vl(x + w - 1, y, y + 2, line); g.hl(x, x + w - 1, y + 3, line);
  if (brackets) for (const bx of [x + 3, x + w - 5]) { g.rect(bx, y + 4, 2, 3, p.metal); g.set(bx + 1, y + 6, null); }
}

// Books standing on a shelf whose top surface is row y. Returns the x after the last book.
function books(c, { x, y, n = 5, hMin = 12, hMax = 18, lean = false, colors = BOOKS }) {
  const { g, p } = c, r = c.rnd;
  let cx = x, last = null;
  for (let i = 0; i < n; i++) {
    const bw = 2 + Math.floor(r() * 2), bh = Math.round(hMin + r() * (hMax - hMin));
    let col = colors[Math.floor(r() * colors.length)];
    if (col === last) col = colors[(colors.indexOf(col) + 3) % colors.length];
    last = col;
    const dark = mix(col, '#000000', 0.32), light = mix(col, '#FFFFFF', 0.3);
    if (lean && i === n - 1 && bh > 6) { // last one leans on its neighbour
      const L = bh - 1, s = 0.3, m = new Mask(g);
      for (let j = 0; j < L; j++) { const o = Math.round(j * s); m.rect(cx + o, y - 1 - j, 3, 1); }
      m.shadow(c, 1, 0, 0.2).paint({ fill: col, line: dark, hi: light });
      cx += 3 + Math.round(L * s) + 1; continue;
    }
    new Mask(g).rect(cx, y - bh, bw, bh).shadow(c, 1, 0, 0.18);
    g.rect(cx, y - bh, bw, bh, col);
    g.vl(cx, y - bh, y - 1, dark); g.hl(cx, cx + bw - 1, y - bh, dark);
    if (bh > 6) { g.hl(cx + 1, cx + bw - 1, y - bh + 2, light); g.hl(cx + 1, cx + bw - 1, y - 3, light); }
    cx += bw;
  }
  return cx;
}

function bookStack(c, { x, y, n = 3, w = 9 }) { // books lying flat
  const { g } = c, r = c.rnd;
  let yy = y;
  for (let i = 0; i < n; i++) {
    const col = BOOKS[Math.floor(r() * BOOKS.length)], bw = w - Math.floor(r() * 3), off = Math.floor(r() * 2);
    g.rect(x + off, yy - 2, bw, 2, col); g.hl(x + off, x + off + bw - 1, yy - 2, mix(col, '#FFFFFF', 0.25));
    g.vl(x + off, yy - 2, yy - 1, mix(col, '#000000', 0.3)); g.vl(x + off + bw - 1, yy - 2, yy - 1, '#EEE8DA');
    yy -= 2;
  }
  return yy;
}

const POTS = {
  terra: ['#C46E46', '#8E4A2E', '#E3926A', '#A85A38'],
  white: ['#ECEAE3', '#A9A69C', '#FFFFFF', '#CFCBC0'],
  black: ['#3A3A3D', '#18181A', '#5E5E63', '#2A2A2D'],
  basket: ['#C9A46A', '#7E5F35', '#E0C189', '#A9844F'],
  sage: ['#9DB39A', '#5D725B', '#BFD0BB', '#83997F'],
  pink: ['#E3A9A0', '#9E6A63', '#F3C7BF', '#C98E86'],
};

// Pot whose bottom sits on row y, centred on cx. Returns the top row (soil line).
function pot(c, { cx, y, w, h, kind = 'terra' }) {
  const { g } = c, [f, line, hi, lo] = POTS[kind];
  const top = y - h, bw = Math.max(3, Math.round(w * 0.74));
  const m = new Mask(g).poly([[cx - w / 2, top + 2], [cx + w / 2, top + 2], [cx + bw / 2, y], [cx - bw / 2, y]]).rect(Math.round(cx - w / 2 - 1), top, Math.round(w) + 2, 3);
  m.shadow(c, 1, 1, 0.22).paint({ fill: f, line, hi, lo });
  g.hl(Math.round(cx - w / 2), Math.round(cx + w / 2), top + 2, lo);
  if (kind === 'basket') for (let j = top + 4; j < y - 1; j += 2) for (let i = Math.round(cx - w / 2) + 1; i < cx + w / 2 - 1; i++) if (m.has(i, j) && m.has(i + 1, j) && ((i + j) & 2)) g.set(i, j, lo);
  return top;
}

// Leafy plant: a fan of shaded leaves rising from (cx, y).
function bush(c, { cx, y, size, n = 11, spread = 150, round = 0.7, greens = GREENS, monstera = false }) {
  const { g } = c, r = c.rnd;
  const leaves = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const a = (-90 - spread / 2 + spread * t + (r() - 0.5) * 18) * Math.PI / 180;
    const L = size * (0.62 + r() * 0.38) * (1 - 0.25 * Math.abs(t - 0.5));
    leaves.push({ a, L, z: r() });
  }
  leaves.sort((A, B) => A.z - B.z);
  const geo = leaves.map(lf => {
    const Ll = lf.L * (monstera ? 0.6 : 0.78), st = lf.L - Ll, ca = Math.cos(lf.a), sa = Math.sin(lf.a);
    const bx = cx + ca * st, by = y + sa * st * 0.85;
    return { bx, by, tx: bx + ca * Ll, ty: by + sa * Ll + Ll * (monstera ? 0.3 : 0.15), Ll };
  });
  for (const q of geo) g.line(cx, y, q.bx, q.by, greens.stem); // petioles behind all leaves
  geo.forEach((q, i) => {
    const { bx, by, tx, ty, Ll } = q;
    const wid = Ll * (monstera ? 0.86 : 0.5);
    const m = new Mask(g).leaf(bx, by, tx, ty, wid, monstera ? 0.42 : round);
    m.paint({ fill: i % 3 === 0 ? greens.dark : greens.mid, line: greens.line, hi: greens.light });
    const ux = tx - bx, uy = ty - by, len = Math.hypot(ux, uy);
    if (len > 5) for (let k = 0.12; k < 0.8; k += 0.5 / len) { // midrib
      const px = Math.floor(bx + ux * k), py = Math.floor(by + uy * k); if (m.has(px, py)) g.set(px, py, greens.dark);
    }
    if (monstera && Ll > 7) { // fenestration splits: dark strokes from the edge toward the midrib
      const nx = -uy / len, ny = ux / len;
      for (const s of [0.32, 0.52, 0.72]) for (const side of [1, -1]) {
        const half = wid / 2 * Math.pow(Math.sin(Math.PI * Math.pow(s, 0.8)), 0.42);
        const ex = bx + ux * (s + 0.06) + nx * side * half, ey = by + uy * (s + 0.06) + ny * side * half;
        const ix = bx + ux * s + nx * side * half * 0.4, iy = by + uy * s + ny * side * half * 0.4;
        const n = Math.ceil(Math.hypot(ex - ix, ey - iy) * 2);
        for (let k = 0; k <= n; k++) { const px = Math.floor(ix + (ex - ix) * k / n), py = Math.floor(iy + (ey - iy) * k / n); if (m.has(px, py)) g.set(px, py, greens.line); }
      }
    }
  });
}

// Fiddle-leaf fig: a couple of trunks with big rounded leaves alternating up them.
function fig(c, { cx, y, h, greens = GREENS }) {
  const { g } = c, r = c.rnd, trunk = '#6B5440';
  const stems = [{ dx: -0.18, hh: 1 }, { dx: 0.22, hh: 0.78 }];
  const leaves = [];
  for (const s of stems) {
    const top = y - h * s.hh, tx = cx + s.dx * h * 0.5;
    g.line(cx, y, tx, top, trunk); g.line(cx + 1, y, tx + 1, top + 2, mix(trunk, '#000000', 0.3));
    const n = Math.round(h * s.hh / 5);
    for (let i = 0; i < n; i++) {
      const t = 0.32 + 0.68 * i / Math.max(1, n - 1), px = cx + (tx - cx) * t, py = y + (top - y) * t;
      const side = i % 2 ? 1 : -1, L = h * (0.2 + 0.08 * r()) * (1.05 - 0.35 * t);
      const a = (-90 + side * (38 + r() * 26)) * Math.PI / 180;
      leaves.push({ bx: px, by: py, tx: px + Math.cos(a) * L, ty: py + Math.sin(a) * L + L * 0.35, w: L * 0.7, z: r() });
    }
    leaves.push({ bx: tx, by: top + 1, tx: tx + (r() - 0.5) * 3, ty: top - h * 0.16, w: h * 0.12, z: 2 });
  }
  leaves.sort((A, B) => A.z - B.z).forEach((lf, i) => {
    const m = new Mask(g).leaf(lf.bx, lf.by, lf.tx, lf.ty, lf.w, 0.38);
    m.paint({ fill: i % 3 === 1 ? greens.dark : greens.mid, line: greens.line, hi: greens.light });
    const ux = lf.tx - lf.bx, uy = lf.ty - lf.by, len = Math.hypot(ux, uy);
    for (let k = 0.15; k < 0.8; k += 0.5 / len) { const px = Math.floor(lf.bx + ux * k), py = Math.floor(lf.by + uy * k); if (m.has(px, py)) g.set(px, py, greens.light); }
  });
}

// Creator ring light on a stand (studio).
function ringLight(c, { cx, cy, r, y }) {
  const { g, p } = c;
  glow(c, cx, cy, r * 2, r * 2, '#EFE8FF', 0.12, 0.24);
  g.vl(Math.round(cx), Math.round(cy + r), y, p.metal); g.vl(Math.round(cx) + 1, Math.round(cy + r), y, '#0E0D12');
  const m = new Mask(g);
  for (let j = Math.floor(cy - r - 1); j <= cy + r + 1; j++) for (let i = Math.floor(cx - r - 1); i <= cx + r + 1; i++) {
    const d = Math.hypot(i + 0.5 - cx, j + 0.5 - cy); if (d <= r && d > r - 3.4) m.add(i, j);
  }
  m.paint({ fill: '#FFFFFF', line: '#CFC6E6' });
}

// Snake plant: tall striped blades.
function snake(c, { cx, y, h, n = 6, greens = GREENS }) {
  const { g } = c, r = c.rnd;
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n - 0.5, bx = cx + t * n * 1.6, tx = bx + t * h * 0.5, L = h * (0.65 + r() * 0.35);
    const m = new Mask(g).leaf(bx, y + 1, tx, y - L, 3.6 + r(), 0.35);
    m.paint({ fill: i % 2 ? greens.mid : greens.dark, line: greens.line, hi: greens.hi });
    for (let j = y - Math.round(L); j < y; j += 3) for (let x = Math.floor(Math.min(bx, tx)) - 3; x < Math.max(bx, tx) + 3; x++)
      if (m.has(x, j) && m.has(x - 1, j) && m.has(x + 1, j)) g.set(x, j, greens.light);
  }
}

// Trailing vines hanging from (x0..x1, y).
function vines(c, { x0, x1, y, len, n = 4, greens = GREENS }) {
  const { g } = c, r = c.rnd;
  for (let i = 0; i < n; i++) {
    const sx = x0 + (x1 - x0) * (i + 0.5) / n, L = len * (0.45 + r() * 0.55), ph = r() * 6;
    let px = sx;
    for (let k = 0; k < L; k++) {
      px = sx + Math.sin(k * 0.22 + ph) * 1.6 + k * 0.08 * (i % 2 ? 1 : -1);
      g.set(Math.round(px), y + k, greens.stem);
      if (k % 3 === 1) {
        const side = (k / 3) % 2 ? 1 : -1, lx = Math.round(px) + side * 2, ly = y + k;
        const m = new Mask(g).ellipse(lx + 0.5, ly + 0.5, 1.7, 1.25);
        m.paint({ fill: k % 2 ? greens.mid : greens.light, line: greens.line });
      }
    }
  }
}

function tableLamp(c, { cx, y, h, shadeW, shade = '#F2E6CF', base = '#C9A46A', glowCol = '#FFE9B8' }) {
  const { g, p } = c;
  const sh = Math.round(shadeW * 0.62), st = y - h; // st: top of shade
  glow(c, cx, st + sh / 2, shadeW * 1.25, shadeW * 1.1, glowCol, 0.14, 0.26);
  const bm = new Mask(g).ellipse(cx, y - 3, 3, 3.2).rect(Math.round(cx) - 1, st + sh, 2, h - sh - 4).rect(Math.round(cx - 3), y - 1, 6, 1);
  bm.shadow(c, 1, 0, 0.2).paint({ fill: base, line: mix(base, '#000000', 0.4), hi: mix(base, '#FFFFFF', 0.35) });
  const top = shadeW * 0.62;
  const sm = new Mask(g).poly([[cx - top / 2, st], [cx + top / 2, st], [cx + shadeW / 2, st + sh], [cx - shadeW / 2, st + sh]]);
  sm.shadow(c, 1, 1, 0.18).paint({ fill: shade, line: mix(shade, p.shadow, 0.35), hi: mix(shade, '#FFFFFF', 0.5), lo: mix(shade, p.shadow, 0.12) });
  g.hl(Math.round(cx - shadeW / 2) + 1, Math.round(cx + shadeW / 2) - 1, st + sh - 1, mix(glowCol, '#FFFFFF', 0.4));
}

function floorLamp(c, { cx, y, h, shadeW, shade = '#F1E7D6', pole = null, glowCol = '#FFE6B0' }) {
  const { g, p } = c, sh = Math.round(shadeW * 0.7), st = y - h;
  glow(c, cx, st + sh * 0.6, shadeW * 1.4, shadeW * 1.6, glowCol, 0.12, 0.24);
  const pc = pole || p.metal;
  g.vl(Math.round(cx), st + sh, y, pc); g.vl(Math.round(cx) + 1, st + sh, y, mix(pc, '#000000', 0.3));
  const top = shadeW * 0.55;
  new Mask(g).poly([[cx - top / 2, st], [cx + top / 2, st], [cx + shadeW / 2, st + sh], [cx - shadeW / 2, st + sh]])
    .shadow(c, 1, 1, 0.18).paint({ fill: shade, line: mix(shade, p.shadow, 0.35), hi: mix(shade, '#FFFFFF', 0.5), lo: mix(shade, p.shadow, 0.12) });
  g.hl(Math.round(cx - shadeW / 2) + 1, Math.round(cx + shadeW / 2) - 1, st + sh - 1, mix(glowCol, '#FFFFFF', 0.4));
}

function sconce(c, { cx, y, w, shade = '#F5E9D0', glowCol = '#FFD27E' }) {
  const { g, p } = c, h = Math.round(w * 0.85), x = Math.round(cx);
  glow(c, cx, y + h * 0.7, w * 1.5, w * 2.6, glowCol, 0.16, 0.3);
  const arm = new Mask(g).rect(x - 1, y + h, 3, 4).rect(x - 2, y + h + 4, 5, 6);
  arm.shadow(c, 1, 1, 0.22).paint({ fill: p.metal, line: mix(p.metal, '#000000', 0.4), hi: p.metalHi });
  new Mask(g).poly([[cx - w * 0.32, y], [cx + w * 0.32, y], [cx + w / 2, y + h], [cx - w / 2, y + h]])
    .shadow(c, 1, 1, 0.18).paint({ fill: shade, line: mix(shade, p.shadow, 0.35), hi: mix(shade, '#FFFFFF', 0.55), lo: mix(shade, glowCol, 0.35) });
  g.hl(Math.round(cx - w / 2) + 1, Math.round(cx + w / 2) - 1, y + h - 1, mix(glowCol, '#FFFFFF', 0.45));
}

function pendant(c, { cx, y, w, color = '#2F2F33', glowCol = '#FFE2A8' }) {
  const { g, p } = c, h = Math.round(w * 0.45);
  glow(c, cx, y + h, w * 0.9, w * 0.9, glowCol, 0.1, 0.2);
  g.vl(Math.round(cx), 0, y, p.metal);
  const e = new Mask(g).ellipse(cx + 0.5, y + h, w / 2, h), m = new Mask(g); // dome = top half
  for (let j = y; j < y + h; j++) for (let i = 0; i < g.w; i++) if (e.has(i, j)) m.add(i, j);
  m.shadow(c, 1, 1, 0.2).paint({ fill: color, line: mix(color, '#000000', 0.4), hi: mix(color, '#FFFFFF', 0.25) });
  g.hl(Math.round(cx - w / 2) + 2, Math.round(cx + w / 2) - 1, y + h, mix(glowCol, '#FFFFFF', 0.5));
}

// Neon tube along a polyline (cell coords), with a dithered spill on the wall.
function neon(c, pts, col, core) {
  const { g } = c, cells = [];
  for (let i = 0; i + 1 < pts.length; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2 + 1;
    for (let k = 0; k <= n; k++) cells.push([Math.round(x0 + (x1 - x0) * k / n), Math.round(y0 + (y1 - y0) * k / n)]);
  }
  const xs = cells.map(q => q[0]), ys = cells.map(q => q[1]);
  const bx = Math.min(...xs) - 6, by = Math.min(...ys) - 6, bw = Math.max(...xs) - bx + 7, bh = Math.max(...ys) - by + 7;
  const dist = (x, y) => { let d = 1e9; for (const [cx, cy] of cells) d = Math.min(d, Math.hypot(x - cx, y - cy)); return d; };
  const cache = {};
  g.map(bx, by, bw, bh, (k, x, y) => {
    if (!k) return null;
    const d = dist(x, y) + (((x + y) & 1) ? 0.5 : -0.5);
    const t = d <= 1.5 ? 0.85 : d < 3 ? 0.36 : d < 5 ? 0.18 : 0;
    return t ? cache[k + t] || (cache[k + t] = mix(k, col, t)) : null;
  });
  for (const [x, y] of cells) { g.set(x, y, col); }
  for (const [x, y] of cells) { g.set(x, y, core); }
  for (const [x, y] of cells) { if (g.get(x + 1, y) !== core) g.set(x + 1, y, col); if (g.get(x, y + 1) !== core) g.set(x, y + 1, col); }
}

function acoustic(c, { x, y, cols, rows, t = 7, base = '#3A3646' }) {
  const { g } = c, hi = mix(base, '#FFFFFF', 0.12), lo = mix(base, '#000000', 0.3), gap = mix(base, '#000000', 0.45);
  for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
    const tx = x + q * (t + 1), ty = y + r * (t + 1);
    for (let j = 0; j < t; j++) for (let i = 0; i < t; i++) g.set(tx + i, ty + j, i + j < t - 1 ? (i < j ? base : hi) : (i < j ? lo : base));
    g.hl(tx, tx + t, ty + t, gap); g.vl(tx + t, ty, ty + t, gap);
  }
}

function clock(c, { cx, cy, r }) {
  const { g, p } = c;
  new Mask(g).ellipse(cx, cy, r, r).shadow(c, 1, 1, 0.22).paint({ fill: '#FBFAF6', line: p.metal, lo: '#E3E1DA' });
  for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) g.set(Math.floor(cx + dx * (r - 2)), Math.floor(cy + dy * (r - 2)), p.metal);
  g.line(Math.floor(cx), Math.floor(cy), Math.floor(cx), Math.floor(cy - r * 0.6), p.metal);
  g.line(Math.floor(cx), Math.floor(cy), Math.floor(cx + r * 0.45), Math.floor(cy + r * 0.15), p.metal);
}

function mirror(c, { x, y, w, h }) {
  const { g } = c, rim = ['#C49A4A', '#7A5A24', '#EACB86'];
  const m = new Mask(g).ellipse(x + w / 2, y + w / 2, w / 2, w / 2).rect(x, Math.round(y + w / 2), w, h - Math.round(w / 2));
  m.shadow(c, 1, 1, 0.22).paint({ fill: rim[0], line: rim[1], hi: rim[2] });
  const inner = new Mask(g).ellipse(x + w / 2, y + w / 2, w / 2 - 2, w / 2 - 2).rect(x + 2, Math.round(y + w / 2), w - 4, h - Math.round(w / 2) - 2);
  inner.paint({ fill: '#D8E3E6', lo: '#C5D3D8' });
  for (let k = 0; k < h; k++) for (const o of [0.3, 0.42]) { const i = Math.round(x + w * o + k * 0.6 - h * 0.15), j = y + 2 + k; if (inner.has(i, j)) g.set(i, j, '#EEF5F6'); }
}

function vase(c, { cx, y, h, w, color = '#EDE6DA' }) {
  const { g } = c;
  const m = new Mask(g).ellipse(cx, y - h * 0.35, w / 2, h * 0.35).rect(Math.round(cx - w * 0.18), y - h, Math.max(2, Math.round(w * 0.36)), Math.round(h * 0.7));
  m.shadow(c, 1, 1, 0.2).paint({ fill: color, line: mix(color, '#000000', 0.38), hi: mix(color, '#FFFFFF', 0.45), lo: mix(color, '#000000', 0.1) });
  return y - h;
}

function pampas(c, { cx, y, h }) {
  const { g } = c, r = c.rnd, cols = ['#E9D8B4', '#DCC69C', '#F3E7CC'];
  for (let i = 0; i < 5; i++) {
    const a = (-90 + (i - 2) * 16 + (r() - 0.5) * 8) * Math.PI / 180, L = h * (0.75 + r() * 0.25);
    const tx = cx + Math.cos(a) * L, ty = y + Math.sin(a) * L;
    g.line(cx, y, cx + Math.cos(a) * L * 0.55, y + Math.sin(a) * L * 0.55, '#B49A6C');
    const m = new Mask(g).leaf(cx + Math.cos(a) * L * 0.45, y + Math.sin(a) * L * 0.45, tx, ty, L * 0.24, 0.5);
    for (let j = 0; j < g.h; j++) for (let x = 0; x < g.w; x++) if (m.has(x, j)) g.set(x, j, cols[(x * 7 + j * 3 + i) % 3]);
  }
}

function candle(c, { cx, y }) {
  const { g } = c;
  g.rect(cx - 1, y - 4, 3, 4, '#F4EEE2'); g.vl(cx + 1, y - 4, y - 1, '#D9CFBE'); g.set(cx, y - 5, '#3A3230');
}

function wainscot(c, { y }) { // chair rail at row y, panelled below
  const { g, p } = c, fill = mix(p.trim, p.wall, 0.22), lo = mix(fill, p.shadow, 0.14);
  const bot = Math.min(g.h, c.floor);
  g.rect(0, y, g.w, bot - y, fill);
  g.rect(0, y, g.w, 2, p.trim); g.hl(0, g.w - 1, y, p.trimHi); g.hl(0, g.w - 1, y + 2, lo);
  new Mask(g).rect(0, y - 1, g.w, 1);
  g.hl(0, g.w - 1, y - 1, mix(p.wall, p.shadow, 0.12));
  const pw = c.S(170), gap = c.S(30);
  for (let x = gap; x < g.w; x += pw + gap) {
    const y0 = y + 2 + c.S(36);
    g.hl(x, x + pw - 1, y0, lo); g.vl(x, y0, bot - 1, lo); g.vl(x + pw - 1, y0, bot - 1, p.trimHi); g.hl(x, x + pw - 1, y0 + 1, p.trimHi);
  }
}

// Baseboard and plank floor from row y (the floor line) down.
function floorAndBase(c, y) {
  const { g, p } = c, bh = c.S(66), floor = p.floor;
  if (y - bh >= g.h) return;
  for (let j = y; j < g.h; j++) {
    const row = Math.floor((j - y) / 4), k = (j - y) % 4;
    g.hl(0, g.w - 1, j, k === 3 ? floor[3] : floor[row % 2 ? 1 : 0]);
    if (k === 0) g.hl(0, g.w - 1, j, mix(floor[row % 2 ? 1 : 0], floor[2], 0.5));
    for (let x = (row * 29) % 41; x < g.w; x += 41) g.set(x, j, floor[3]);
  }
  g.hl(0, g.w - 1, y, mix(floor[3], '#000000', 0.2));
  g.rect(0, y - bh, g.w, bh, p.trim); g.hl(0, g.w - 1, y - bh, p.trimHi); g.hl(0, g.w - 1, y - bh + 1, p.trimLo);
  g.hl(0, g.w - 1, y - bh - 1, mix(p.wall, p.shadow, 0.16)); g.hl(0, g.w - 1, y - 1, p.trimLo);
}

/* ---------------- scenes ---------------- */

// Each scene places props in cells. c.L(px) is px from the left edge, c.R(px) px from
// the right edge, c.Y(dy) is dy px below the eye line, c.S(px) a length; all are
// laid out for the canonical width (963 panel / 1080 full) and scale with width.
const SCENES = {
  sage(c) {
    const { g, p } = c;
    if (!c.full) {
      door(c, { x: c.L(40), w: c.S(440), top: c.Y(-300), handleY: c.Y(330) });
      frameArt(c, { x: c.R(262), y: c.Y(56), w: c.S(132), h: c.S(162), frame: 'wood', art: 'hills' });
      const sy = c.Y(345);
      pot(c, { cx: c.R(200), y: sy, w: 8, h: 7, kind: 'white' });
      vines(c, { x0: c.R(222), x1: c.R(178), y: sy + 3, len: c.S(140), n: 3 });
      shelf(c, { x: c.R(236), w: c.S(236), y: sy });
      bush(c, { cx: c.R(200) + 0.5, y: sy - 7, size: 9, n: 8, spread: 170 });
      books(c, { x: c.R(150), y: sy, n: 4, hMin: 13, hMax: 17, lean: true });
      vase(c, { cx: c.R(48), y: sy, h: 9, w: 5, color: '#D9895B' });
    } else {
      door(c, { x: c.L(24), w: c.S(470), top: c.Y(-470), handleY: c.Y(420) });
      frameArt(c, { x: c.R(250), y: c.Y(-330), w: c.S(170), h: c.S(210), frame: 'wood', art: 'hills' });
      frameArt(c, { x: c.R(250), y: c.Y(-80), w: c.S(110), h: c.S(130), frame: 'black', art: 'abstract' });
      const sy = c.Y(200);
      vines(c, { x0: c.R(150), x1: c.R(60), y: sy + 3, len: c.S(260), n: 4 });
      shelf(c, { x: c.R(330), w: c.S(330), y: sy });
      books(c, { x: c.R(300), y: sy, n: 6, hMin: 15, hMax: 22, lean: true });
      pot(c, { cx: c.R(100), y: sy, w: 9, h: 8, kind: 'white' });
      bush(c, { cx: c.R(100) + 0.5, y: sy - 8, size: 12, n: 9, spread: 170 });
      pot(c, { cx: c.R(110), y: c.floor + 3, w: 22, h: 20, kind: 'terra' });
      bush(c, { cx: c.R(110), y: c.floor - 17, size: 46, n: 14, spread: 150, monstera: true });
    }
  },

  cream(c) {
    const { g } = c;
    if (!c.full) {
      wainscot(c, { y: c.Y(400) });
      // bookcase on the left
      bookcase(c, { x: c.L(24), w: c.S(250), top: c.Y(-300), shelves: [c.Y(70), c.Y(240), c.Y(400)] });
      sconce(c, { cx: c.R(140), y: c.Y(60), w: 11 });
      frameArt(c, { x: c.R(286), y: c.Y(150), w: c.S(96), h: c.S(120), frame: 'gold', art: 'botanical' });
      const by = c.Y(540); // panel props stand on the visible bottom edge (frame y 1920)
      pot(c, { cx: c.R(100), y: by, w: 16, h: 14, kind: 'basket' });
      snake(c, { cx: c.R(100), y: by - 14, h: 30, n: 6 });
    } else {
      wainscot(c, { y: c.Y(700) });
      bookcase(c, { x: c.L(-20), w: c.S(300), top: c.Y(-560), shelves: [c.Y(-330), c.Y(-110), c.Y(110), c.Y(330), c.Y(560)] });
      sconce(c, { cx: c.R(140), y: c.Y(-250), w: 13 });
      frameArt(c, { x: c.R(270), y: c.Y(-40), w: c.S(140), h: c.S(176), frame: 'gold', art: 'botanical' });
      pot(c, { cx: c.R(120), y: c.floor + 3, w: 20, h: 18, kind: 'basket' });
      snake(c, { cx: c.R(120), y: c.floor - 15, h: 44, n: 7 });
    }
  },

  blue(c) {
    const { g } = c;
    if (!c.full) {
      windowFrame(c, { x: c.L(20), y: c.Y(-260), w: c.S(400), h: c.S(660), cols: 2, rows: 2 });
      curtain(c, { x: c.L(0), y: c.Y(-200), w: c.S(66), h: Math.min(g.h + 2, c.floor) - c.Y(-200), fill: '#F2EEE6' });
      frameArt(c, { x: c.R(330), y: c.Y(70), w: c.S(126), h: c.S(150), frame: 'white', art: 'sun' });
      const ty = c.Y(450);
      sideboard(c, { x: c.R(270), w: c.S(290), y: ty });
      tableLamp(c, { cx: c.R(110), y: ty, h: 30, shadeW: 13 });
      vase(c, { cx: c.R(210), y: ty, h: 8, w: 6, color: '#5D7FA0' });
    } else {
      windowFrame(c, { x: c.L(-40), y: c.Y(-470), w: c.S(470), h: c.S(1030), cols: 2, rows: 3 });
      curtain(c, { x: c.L(0), y: c.Y(-440), w: c.S(80), h: c.floor - c.Y(-440), fill: '#F2EEE6' });
      frameArt(c, { x: c.R(260), y: c.Y(-300), w: c.S(170), h: c.S(210), frame: 'white', art: 'sun' });
      const ty = c.Y(640);
      sideboard(c, { x: c.R(360), w: c.S(380), y: ty });
      tableLamp(c, { cx: c.R(130), y: ty, h: 40, shadeW: 17 });
      vase(c, { cx: c.R(270), y: ty, h: 11, w: 8, color: '#5D7FA0' });
      pendant(c, { cx: c.R(150), y: c.Y(-470), w: 16 });
    }
  },

  studio(c) {
    const { g, p } = c;
    if (!c.full) {
      glow(c, g.w / 2, c.Y(120), g.w * 0.42, c.S(330), '#7B4FB0', 0.1, 0.2);
      acoustic(c, { x: c.L(28), y: c.Y(40), cols: 3, rows: 5, t: 7 });
      neon(c, [[c.R(250), c.Y(150)], [c.R(222), c.Y(70)], [c.R(196), c.Y(150)], [c.R(170), c.Y(70)], [c.R(144), c.Y(150)], [c.R(118), c.Y(70)]], p.neon, p.neonCore);
      const sy = c.Y(300);
      shelf(c, { x: c.R(270), w: c.S(270), y: sy });
      glow(c, c.R(135), sy + 6, c.S(160) / 6 + 6, 5, p.cyan, 0.12, 0.3);
      g.hl(c.R(266), c.R(4), sy + 3, p.cyan);
      books(c, { x: c.R(236), y: sy, n: 5, hMin: 13, hMax: 18, colors: ['#5B4A8A', '#2C2C38', '#8A3F5C', '#3E6E8E', '#D7C9E8'] });
      pot(c, { cx: c.R(70), y: sy, w: 7, h: 6, kind: 'black' });
      snake(c, { cx: c.R(70), y: sy - 6, h: 14, n: 4, greens: { ...GREENS, mid: '#4E7A5A', dark: '#3A5E48', light: '#6E9E74', hi: '#8FBE88' } });
      ringLight(c, { cx: c.R(112), cy: c.Y(440), r: 11, y: g.h });
    } else {
      glow(c, g.w / 2, c.Y(80), g.w * 0.55, c.S(560), '#7B4FB0', 0.1, 0.2);
      acoustic(c, { x: c.L(-10), y: c.Y(-500), cols: 3, rows: 12, t: 9 });
      neon(c, [[c.R(240), c.Y(-330)], [c.R(205), c.Y(-430)], [c.R(170), c.Y(-330)], [c.R(135), c.Y(-430)], [c.R(100), c.Y(-330)], [c.R(65), c.Y(-430)]], p.neon, p.neonCore);
      const sy = c.Y(150);
      shelf(c, { x: c.R(330), w: c.S(330), y: sy });
      glow(c, c.R(165), sy + 6, c.S(200) / 6 + 6, 6, p.cyan, 0.12, 0.3);
      g.hl(c.R(326), c.R(4), sy + 3, p.cyan);
      books(c, { x: c.R(290), y: sy, n: 6, hMin: 16, hMax: 22, colors: ['#5B4A8A', '#2C2C38', '#8A3F5C', '#3E6E8E', '#D7C9E8'] });
      pot(c, { cx: c.R(70), y: sy, w: 9, h: 8, kind: 'black' });
      snake(c, { cx: c.R(70), y: sy - 8, h: 18, n: 4, greens: { ...GREENS, mid: '#4E7A5A', dark: '#3A5E48', light: '#6E9E74', hi: '#8FBE88' } });
      neon(c, [[c.L(40), c.Y(200)], [c.L(40), c.Y(700)]], p.cyan, p.cyanCore);
      floorLamp(c, { cx: c.R(130), y: c.floor + 2, h: 120, shadeW: 18, shade: '#3A3246', pole: '#1E1C24', glowCol: p.warm });
    }
  },

  mint(c) {
    const { g } = c;
    const snakeG = { ...GREENS, dark: '#3F6A4C', mid: '#5A8A5E', light: '#86B07A' };
    if (!c.full) {
      const by = c.Y(546);
      pot(c, { cx: c.L(120), y: by, w: 20, h: 15, kind: 'white' });
      fig(c, { cx: c.L(120), y: by - 15, h: 66 });
      clock(c, { cx: c.R(178), cy: c.Y(110), r: 9 });
      for (const [k, dy] of [[0, 250], [1, 400]]) {
        const sy = c.Y(dy);
        shelf(c, { x: c.R(250), w: c.S(250), y: sy, color: 'white', brackets: true });
        if (k === 0) {
          const t = bookStack(c, { x: c.R(220), y: sy, n: 3, w: 10 });
          candle(c, { cx: c.R(200), y: t });
          pot(c, { cx: c.R(110), y: sy, w: 7, h: 6, kind: 'terra' });
          bush(c, { cx: c.R(110) + 0.5, y: sy - 6, size: 8, n: 7, spread: 160 });
          vase(c, { cx: c.R(50), y: sy, h: 10, w: 5, color: '#E7C8A0' });
        } else {
          books(c, { x: c.R(220), y: sy, n: 4, hMin: 12, hMax: 16 });
          pot(c, { cx: c.R(84), y: sy, w: 8, h: 6, kind: 'sage' });
          snake(c, { cx: c.R(84), y: sy - 6, h: 13, n: 4, greens: snakeG });
        }
      }
    } else {
      pot(c, { cx: c.L(90), y: c.floor + 3, w: 28, h: 20, kind: 'white' });
      fig(c, { cx: c.L(90), y: c.floor - 16, h: 120 });
      clock(c, { cx: c.R(160), cy: c.Y(-330), r: 13 });
      for (const [k, dy] of [[0, -40], [1, 260]]) {
        const sy = c.Y(dy);
        shelf(c, { x: c.R(300), w: c.S(300), y: sy, color: 'white', brackets: true });
        if (k === 0) {
          const t = bookStack(c, { x: c.R(250), y: sy, n: 3, w: 12 });
          candle(c, { cx: c.R(225), y: t });
          pot(c, { cx: c.R(110), y: sy, w: 9, h: 8, kind: 'terra' });
          bush(c, { cx: c.R(110) + 0.5, y: sy - 8, size: 11, n: 8, spread: 160 });
        } else {
          books(c, { x: c.R(250), y: sy, n: 5, hMin: 15, hMax: 20 });
          pot(c, { cx: c.R(86), y: sy, w: 10, h: 7, kind: 'sage' });
          snake(c, { cx: c.R(86), y: sy - 7, h: 17, n: 5, greens: snakeG });
        }
      }
    }
  },

  blush(c) {
    const { g } = c;
    if (!c.full) {
      mirror(c, { x: c.L(40), y: c.Y(40), w: c.S(170), h: c.S(420) });
      frameArt(c, { x: c.R(330), y: c.Y(70), w: c.S(120), h: c.S(150), frame: 'white', art: 'waves' });
      const ty = c.Y(430);
      sideboard(c, { x: c.R(300), w: c.S(300), y: ty, color: 'white' });
      const vt = vase(c, { cx: c.R(130), y: ty, h: 14, w: 8, color: '#EDE6DA' });
      pampas(c, { cx: c.R(130), y: vt + 1, h: 32 });
      bookStack(c, { x: c.R(250), y: ty, n: 2, w: 11 });
    } else {
      mirror(c, { x: c.L(-60), y: c.Y(-380), w: c.S(300), h: c.S(1100) });
      frameArt(c, { x: c.R(290), y: c.Y(-360), w: c.S(170), h: c.S(210), frame: 'white', art: 'waves' });
      const ty = c.Y(400);
      sideboard(c, { x: c.R(380), w: c.S(380), y: ty, color: 'white' });
      const vt = vase(c, { cx: c.R(150), y: ty, h: 18, w: 10, color: '#EDE6DA' });
      pampas(c, { cx: c.R(150), y: vt + 1, h: 46 });
      bookStack(c, { x: c.R(320), y: ty, n: 3, w: 13 });
    }
  },
};

function bookcase(c, { x, w, top, shelves }) {
  const { g, p } = c, side = 3, bot = Math.min(g.h, c.floor + 2);
  new Mask(g).rect(x, top, w, bot - top).shadow(c, 2, 0, 0.25);
  g.rect(x, top, w, bot - top, p.wood);
  g.vl(x, top, bot, p.woodLine); g.vl(x + w - 1, top, bot, p.woodLine); g.vl(x + 1, top, bot, p.woodHi);
  const back = mix(p.woodLo, p.shadow, 0.25);
  let prev = top + side;
  for (const sy of shelves) {
    g.rect(x + side, prev, w - 2 * side, sy - prev, back);
    g.hl(x + side, x + w - side - 1, prev, mix(back, '#000000', 0.25));
    if (sy - prev > 8) {
      const r = c.rnd;
      let bx = x + side + 1;
      while (bx < x + w - side - 6) {
        if (r() < 0.16) { // a plant or vase gap
          const pw = 6;
          pot(c, { cx: bx + pw / 2, y: sy, w: 5, h: 4, kind: r() < 0.5 ? 'terra' : 'white' });
          bush(c, { cx: bx + pw / 2, y: sy - 4, size: 5, n: 5, spread: 150 });
          bx += pw + 1; continue;
        }
        const n = 2 + Math.floor(r() * 4);
        bx = books(c, { x: bx, y: sy, n, hMin: Math.min(sy - prev - 4, 9), hMax: Math.min(sy - prev - 2, 15), lean: r() < 0.3 });
        bx += 1 + Math.floor(r() * 3);
      }
      g.rect(x + w - side, prev, side, sy - prev, p.wood); g.vl(x + w - 1, prev, sy, p.woodLine);
    }
    g.rect(x + side, sy, w - 2 * side, 3, p.wood); g.hl(x + side, x + w - side - 1, sy, p.woodHi); g.hl(x + side, x + w - side - 1, sy + 2, p.woodLo);
    prev = sy + 3;
  }
  if (prev < bot) g.rect(x + side, prev, w - 2 * side, bot - prev, back);
}

function sideboard(c, { x, w, y, color = 'wood' }) {
  const { g, p } = c, bot = Math.min(g.h, c.floor + 2);
  const [f, lo, hi, line] = color === 'wood' ? [p.wood, p.woodLo, p.woodHi, p.woodLine] : [p.trim, p.trimLo, p.trimHi, p.trimLine];
  new Mask(g).rect(x, y, w, bot - y).shadow(c, 1, 0, 0.2);
  g.rect(x, y, w, bot - y, f);
  g.rect(x - 1, y, w + 2, 3, f); g.hl(x - 1, x + w, y, hi); g.hl(x - 1, x + w, y + 3, line); g.vl(x - 1, y, y + 2, line); g.vl(x + w, y, y + 2, line);
  g.vl(x, y + 3, bot, line);
  const dw = Math.round(w / 3);
  for (let i = 1; i < 3; i++) g.vl(x + i * dw, y + 5, bot, lo);
  for (let i = 0; i < 3; i++) { g.rect(x + i * dw + Math.round(dw / 2) - 1, y + 8, 3, 1, p.metal); }
  g.hl(x + 1, x + w - 1, y + 4, lo);
}

/* ---------------- entry ---------------- */

/**
 * Pixel-art room backdrop as an SVG string.
 * @param {object} o
 * @param {number} [o.width=963]   SVG width in px
 * @param {number} [o.height=513]  SVG height in px (height > width selects the full-bleed layout)
 * @param {string} [o.variant='sage'] one of ROOM_VARIANTS
 * @param {number} [o.eyeLine]     y (px) of the character's eyes in this SVG; default panel -26, full 552
 * @param {number} [o.seed]        vary the random details (books, leaves); default derived from variant
 */
export function pixelRoom({ width = 963, height = 513, variant = 'sage', eyeLine, seed } = {}) {
  if (!SCENES[variant]) throw new Error(`pixelRoom: unknown variant "${variant}" (use ${ROOM_VARIANTS.join(', ')})`);
  width = Math.round(width); height = Math.round(height);
  const full = height > width * 1.2;
  const canon = full ? 1080 : 963, sx = width / canon;
  const e = eyeLine ?? (full ? 552 * height / 1920 : -26 * sx);
  const g = new Grid(Math.ceil(width / PX), Math.ceil(height / PX));
  const p = PALETTES[variant];
  const c = {
    g, p, full, rnd: rng(seed ?? hash(variant + (full ? ':full' : ':panel'))),
    L: px => Math.round(px * sx / PX),
    R: px => g.w - Math.round(px * sx / PX),
    Y: dy => Math.round((e + dy * sx) / PX),
    S: px => Math.max(1, Math.round(px * sx / PX)),
  };
  c.floor = c.Y(full ? 1150 : 880);
  wall(c);
  floorAndBase(c, c.floor);
  SCENES[variant](c);
  const body = encode(g, p.wall);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" ` +
    `preserveAspectRatio="xMidYMid slice" shape-rendering="crispEdges" style="display:block">` +
    `<rect width="${width}" height="${height}" fill="${p.wall}"/><g transform="scale(${PX})">${body}</g></svg>`;
}
