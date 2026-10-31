// Shared helpers for group g3 (pre-chorus 1 "SKY BUILD" + chorus 1 "SUNBURST POP").
// Everything is a pure function of time — no state, no Math.random.
import { W, H, TAU, clamp, lerp, ease, hash, noise2, buf, bctx, hex2rgb, rgb } from '../../core/lib.js';

export const SKY = { sky: '#6EC3F0', deep: '#2E8BE0', white: '#FFFFFF', sun: '#FFD23F', ink: '#1F2A55' };
export const POP = { pink: '#FF3E8A', orange: '#FF7A1A', yellow: '#FFE14D', purple: '#7B2FF7', cream: '#FFFBF4' };

/** puffy cartoon cloud: flat bottom, 5 lobes, soft blue underside */
export function cloud(ctx, x, y, s, a = 1, top = '#FFFFFF', under = '#D6EEFB') {
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.scale(s, s);
  const lobes = [[-110, 0, 62], [-50, -40, 78], [30, -55, 92], [105, -18, 66], [150, 8, 44], [-160, 14, 40]];
  ctx.fillStyle = under; ctx.beginPath();
  for (const [lx, ly, r] of lobes) { ctx.moveTo(lx + r, ly + 14); ctx.arc(lx, ly + 14, r, 0, TAU); }
  ctx.rect(-170, 0, 330, 54); ctx.fill();
  ctx.fillStyle = top; ctx.beginPath();
  for (const [lx, ly, r] of lobes) { ctx.moveTo(lx + r, ly); ctx.arc(lx, ly, r, 0, TAU); }
  ctx.rect(-165, -10, 320, 50); ctx.fill();
  ctx.restore();
}

/** bright sky gradient + sun glow + drifting cloud layers. drift = px offset (camera move). */
export function skyBG(ctx, t, { top = '#4FB4EE', mid = '#6EC3F0', bot = '#CDEFFC', sunX = 1500, sunY = 230, drift = 0, rays = true, clouds = true, rot = 0 } = {}) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, top); g.addColorStop(0.55, mid); g.addColorStop(1, bot);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // sun glow + slow rays
  const rg = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 700);
  rg.addColorStop(0, 'rgba(255,248,214,0.95)'); rg.addColorStop(0.18, 'rgba(255,235,150,0.55)'); rg.addColorStop(1, 'rgba(255,235,150,0)');
  if (rays) {
    ctx.save(); ctx.translate(sunX, sunY); ctx.rotate(t * 0.15 + rot);
    ctx.fillStyle = 'rgba(255,255,255,0.13)';
    for (let i = 0; i < 18; i++) { const a = (i / 18) * TAU; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 2400, a, a + TAU / 36); ctx.closePath(); ctx.fill(); }
    ctx.restore();
  }
  ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
  ctx.beginPath(); ctx.arc(sunX, sunY, 92, 0, TAU); ctx.fillStyle = '#FFE680'; ctx.fill();
  ctx.beginPath(); ctx.arc(sunX, sunY, 70, 0, TAU); ctx.fillStyle = '#FFF6C8'; ctx.fill();
  if (clouds) cloudLayers(ctx, t, drift);
}

export function cloudLayers(ctx, t, drift = 0, alpha = 1) {
  const layers = [
    { n: 5, y: 260, s: 0.55, sp: 40, a: 0.75, seed: 3 },
    { n: 4, y: 520, s: 0.85, sp: 90, a: 0.9, seed: 9 },
    { n: 3, y: 900, s: 1.35, sp: 190, a: 1, seed: 17 },
  ];
  for (const L of layers) {
    const span = W + 900;
    for (let i = 0; i < L.n; i++) {
      const x = ((hash(i, L.seed) * span - t * L.sp - drift * L.s) % span + span) % span - 450;
      const y = L.y + (hash(i, L.seed + 1) - 0.5) * 140;
      cloud(ctx, x, y, L.s * (0.8 + hash(i, L.seed + 2) * 0.5), L.a * alpha);
    }
  }
}

/** multi-pass neon stroke of the current path (call after building a path). */
export function neon(ctx, col = '#FF4F7B', w = 10, glow = 1) {
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const [r, g, b] = hex2rgb(col);
  ctx.strokeStyle = rgb(r, g, b, 0.13 * glow); ctx.lineWidth = w * 4.2; ctx.stroke();
  ctx.strokeStyle = rgb(r, g, b, 0.28 * glow); ctx.lineWidth = w * 2.4; ctx.stroke();
  ctx.strokeStyle = rgb(r, g, b, 1); ctx.lineWidth = w; ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = w * 0.38; ctx.stroke();
}

/** generic 8-point asterisk spark (NOT a logo): 8 rounded spokes + white core. */
export function spark(ctx, x, y, r, rot = 0, col = '#FF6A1F') {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 2.6);
  glow.addColorStop(0, 'rgba(255,200,140,0.9)'); glow.addColorStop(0.35, 'rgba(255,120,60,0.35)'); glow.addColorStop(1, 'rgba(255,120,60,0)');
  ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(0, 0, r * 2.6, 0, TAU); ctx.fill();
  ctx.lineCap = 'round';
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU, L = i % 2 ? r * 0.72 : r;
    ctx.strokeStyle = col; ctx.lineWidth = r * 0.34;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * L, Math.sin(a) * L); ctx.stroke();
  }
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU, L = (i % 2 ? r * 0.72 : r) * 0.8;
    ctx.strokeStyle = '#FFF4E0'; ctx.lineWidth = r * 0.13;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * L, Math.sin(a) * L); ctx.stroke();
  }
  ctx.beginPath(); ctx.arc(0, 0, r * 0.26, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill();
  ctx.restore();
}

/** ballistic confetti burst, fully analytic. age = seconds since burst. */
export function confetti(ctx, age, { x = W / 2, y = H / 2, n = 160, seed = 1, speed = 1400, grav = 1500, cols = ['#FF3E8A', '#FFE14D', '#7B2FF7', '#FF7A1A', '#FFFFFF', '#3EF0FF'], size = 1, life = 2.2, spread = TAU, dir = 0, drag = 1.6 } = {}) {
  if (age < 0 || age > life) return;
  const fade = clamp((life - age) / 0.4);
  for (let i = 0; i < n; i++) {
    const a = dir + (hash(i, seed) - 0.5) * spread, sp = speed * (0.25 + 0.75 * hash(i, seed + 1));
    // velocity with linear drag: x(t) = v/k (1 - e^-kt)
    const k = drag * (0.7 + hash(i, seed + 2) * 0.8), d = (1 - Math.exp(-k * age)) / k;
    const px = x + Math.cos(a) * sp * d + Math.sin(age * 3 + i) * 18;
    const py = y + Math.sin(a) * sp * d + grav * (age * age) * 0.5 * (0.6 + hash(i, seed + 3) * 0.6) * 0.6;
    const spin = age * (6 + hash(i, seed + 4) * 14) + i;
    const w = (10 + hash(i, seed + 5) * 16) * size, h = w * (0.45 + 0.3 * hash(i, seed + 6));
    ctx.save(); ctx.translate(px, py); ctx.rotate(spin); ctx.scale(1, Math.cos(spin * 1.7));
    ctx.globalAlpha = fade; ctx.fillStyle = cols[i % cols.length];
    if (i % 5 === 0) { ctx.beginPath(); ctx.arc(0, 0, w * 0.4, 0, TAU); ctx.fill(); } else ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.restore();
  }
}

/** grunge speckle mask canvas (cached): white with transparent holes, for rubber-stamp texture */
export function grunge(key, w, h, seed = 1, density = 1) {
  const c = buf('g3-grunge-' + key, w, h), x = bctx(c);
  if (c._done) return c;
  x.clearRect(0, 0, w, h);
  const N = Math.floor(w * h / 220 * density);
  x.fillStyle = '#000';
  for (let i = 0; i < N; i++) {
    const px = hash(i, seed) * w, py = hash(i, seed + 1) * h, r = 0.6 + Math.pow(hash(i, seed + 2), 3) * 5.5;
    const n = noise2(px * 0.012, py * 0.012);
    if (n > -0.15 || hash(i, seed + 3) < 0.25) { x.beginPath(); x.arc(px, py, r, 0, TAU); x.fill(); }
  }
  // a few scratches
  x.lineWidth = 1.6; x.strokeStyle = '#000';
  for (let i = 0; i < 14; i++) { const px = hash(i, seed + 7) * w, py = hash(i, seed + 8) * h, a = hash(i, seed + 9) * 0.6 - 0.3, L = 40 + hash(i, seed + 10) * 160; x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * L, py + Math.sin(a) * L); x.stroke(); }
  c._done = true; return c;
}

/** Polygon clip of convex poly by half-plane (keep side where (p-m)·n <= 0). */
export function clipPoly(poly, mx, my, nx, ny) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    const da = (a[0] - mx) * nx + (a[1] - my) * ny, db = (b[0] - mx) * nx + (b[1] - my) * ny;
    if (da <= 0) out.push(a);
    if ((da <= 0) !== (db <= 0)) { const k = da / (da - db); out.push([a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]); }
  }
  return out;
}

/** Voronoi cells of seeds inside rect [x0,y0,x1,y1] by half-plane clipping (O(n²), fine for < 200 seeds). */
export function voronoi(seeds, x0, y0, x1, y1) {
  return seeds.map((s, i) => {
    let poly = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
    for (let j = 0; j < seeds.length && poly.length; j++) {
      if (j === i) continue;
      const o = seeds[j], mx = (s[0] + o[0]) / 2, my = (s[1] + o[1]) / 2;
      poly = clipPoly(poly, mx, my, o[0] - s[0], o[1] - s[1]);
    }
    let cx = 0, cy = 0; for (const p of poly) { cx += p[0]; cy += p[1]; }
    cx /= poly.length || 1; cy /= poly.length || 1;
    return { poly, cx, cy, seed: s, i };
  });
}

/** speed lines radiating from (cx,cy): thin wedges, flickering per frame index */
export function speedLines(ctx, cx, cy, n, r0, r1, frame, col = 'rgba(255,255,255,0.8)', seed = 1, width = 0.012) {
  ctx.fillStyle = col; ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const a = hash(i, seed, frame >> 1) * TAU, w = width * (0.4 + hash(i, seed + 1, frame >> 1));
    const rr0 = r0 * (0.8 + 0.5 * hash(i, seed + 2, frame >> 1));
    ctx.moveTo(cx + Math.cos(a) * rr0, cy + Math.sin(a) * rr0);
    ctx.lineTo(cx + Math.cos(a - w) * r1, cy + Math.sin(a - w) * r1);
    ctx.lineTo(cx + Math.cos(a + w) * r1, cy + Math.sin(a + w) * r1);
    ctx.closePath();
  }
  ctx.fill();
}

/** text with thick hard offset shadow ("sticker" pop type) */
export function popText(ctx, str, x, y, size, { family = 'Anton', fill = '#fff', shadow = '#1F2A55', off = 10, stroke = null, sw = 10, align = 'center', weight = '400', maxW = 0 } = {}) {
  ctx.font = `${weight} ${size}px "${family}"`;
  if (maxW) { const m = ctx.measureText(str).width; if (m > maxW) { size *= maxW / m; ctx.font = `${weight} ${size}px "${family}"`; } }
  ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  if (shadow) { ctx.fillStyle = shadow; ctx.fillText(str, x + off, y + off); if (stroke) { ctx.lineWidth = sw; ctx.strokeStyle = shadow; ctx.strokeText(str, x + off, y + off); } }
  if (stroke) { ctx.lineWidth = sw; ctx.strokeStyle = stroke; ctx.strokeText(str, x, y); }
  ctx.fillStyle = fill; ctx.fillText(str, x, y);
  return size;
}

export const kick = (t, d = 0.12) => 0; // placeholder to keep import lists stable
