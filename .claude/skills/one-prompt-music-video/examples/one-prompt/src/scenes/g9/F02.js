// F02 — "Opus five point five, yeah, it's breaking all the rules" · PAPER TEAR LAYERS
// A stack of six printed posters, one per world. CURSOR sings (live lip-sync) on every poster at the same spot,
// so each rip restyles him. Every rip is real geometry: a fractal torn edge splits the sheet; the big piece
// peels back along a moving fold line (2D page-curl by reflection: flat part / mirrored back-side flap with
// show-through, curl highlight + cast shadow), the small piece stays glued as a remnant with a white fibrous
// torn edge. Remnants pile up at the frame edges → a street-poster collage by the end.
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, seg, rng, hash, noise2, buf, bctx, rays, star, roundRect } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { drawMascot, pose } from '../../core/mascot.js';
import { bigType, grainTex } from './common.js';

const S = shot('F02');
const M = 60; // margin outside the frame
const TL = [-M, -M], TR = [W + M, -M], BR = [W + M, H + M], BL = [-M, H + M];

// rips: tear endpoints, remnant (A) corners walked from P1 back to P0, peel piece (B) corners walked from P1 to P0 the other way
const RIPS = [
  { t: 127.77, P0: [-M, 610], P1: [610, H + M], a: [BL], b: [BR, TR, TL], seed: 11, dur: 0.34 },
  { t: 128.19, P0: [1290, -M], P1: [W + M, 470], a: [TR], b: [BR, BL, TL], seed: 23, dur: 0.3 },
  { t: 128.46, P0: [250, -M], P1: [150, H + M], a: [BL, TL], b: [BR, TR], seed: 37, dur: 0.34 },
  { t: 129.02, P0: [-M, 915], P1: [W + M, 965], a: [BR, BL], b: [TR, TL], seed: 41, dur: 0.36 },
  { t: 129.62, P0: [-M, 330], P1: [690, -M], a: [TL], b: [TR, BR, BL], seed: 53, dur: 0.3 },
];

function tearLine(P0, P1, seed, amp = 70) {
  let pts = [P0, P1]; const r = rng(seed); let a = amp;
  for (let lvl = 0; lvl < 7; lvl++) {
    const np = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p = pts[i], q = pts[i + 1]; np.push(p);
      const dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy) || 1, off = (r() - 0.5) * 2 * a;
      np.push([(p[0] + q[0]) / 2 - dy / L * off, (p[1] + q[1]) / 2 + dx / L * off]);
    }
    np.push(pts[pts.length - 1]); pts = np; a *= lvl < 3 ? 0.5 : 0.62;
  }
  return pts;
}
function clipHalf(poly, d, f, keepLess) {
  const out = [], n = poly.length, sg = keepLess ? 1 : -1;
  for (let i = 0; i < n; i++) {
    const a = poly[i], b = poly[(i + 1) % n];
    const da = (a[0] * d[0] + a[1] * d[1] - f) * sg, db = (b[0] * d[0] + b[1] * d[1] - f) * sg;
    if (da <= 0) out.push(a);
    if ((da <= 0) !== (db <= 0)) { const u = da / (da - db); out.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]); }
  }
  return out;
}
const reflectPts = (poly, d, f) => poly.map(([x, y]) => { const k = 2 * (x * d[0] + y * d[1] - f); return [x - k * d[0], y - k * d[1]]; });
function pathPoly(ctx, poly) { ctx.beginPath(); poly.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); }

let GEO = null;
function geo() {
  if (GEO) return GEO;
  GEO = RIPS.map((R) => {
    const T = tearLine(R.P0, R.P1, R.seed);
    const A_ = [...T, ...R.a];
    const B_ = [...T, ...R.b];
    const ca = A_.reduce((s, p) => [s[0] + p[0] / A_.length, s[1] + p[1] / A_.length], [0, 0]);
    let d = [-(R.P1[1] - R.P0[1]), R.P1[0] - R.P0[0]]; const L = Math.hypot(d[0], d[1]); d = [d[0] / L, d[1] / L];
    const mid = [(R.P0[0] + R.P1[0]) / 2, (R.P0[1] + R.P1[1]) / 2];
    if ((ca[0] - mid[0]) * d[0] + (ca[1] - mid[1]) * d[1] < 0) d = [-d[0], -d[1]];
    const proj = B_.map((p) => p[0] * d[0] + p[1] * d[1]);
    // white fibre band (inside the remnant, along the tear) + hairs
    const band = [], back = [];
    T.forEach((p, i) => { const w = 3 + 10 * (0.5 + 0.5 * noise2(i * 0.11, R.seed)) ** 2; band.push(p); back.push([p[0] + d[0] * w, p[1] + d[1] * w]); });
    const hairs = [], r = rng(R.seed + 5);
    T.forEach((p, i) => { if (i % 2) return; const n = r() < 0.5 ? 1 : 2; for (let k = 0; k < n; k++) { const L2 = 3 + r() * 9, a = Math.atan2(-d[1], -d[0]) + (r() - 0.5) * 1.6; hairs.push([p[0], p[1], p[0] + Math.cos(a) * L2, p[1] + Math.sin(a) * L2]); } });
    return { T, A: A_, B: B_, d, fmax: Math.max(...proj), fmin: Math.min(...proj), band: [...band, ...back.reverse()], hairs };
  });
  return GEO;
}

// ---------------------------------------------------------------- the six posters
const CUR = { x: 1345, y: 1125, s: 2.7 };
function mic(ctx, P, col) {
  ctx.save(); ctx.translate(P.armR[0], P.armR[1]); ctx.rotate(-0.5);
  ctx.fillStyle = '#1F2A55'; roundRect(ctx, -10, -20, 20, 74, 9); ctx.fill();
  ctx.translate(0, -34); ctx.beginPath(); ctx.arc(0, -8, 26, 0, TAU); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = '#1F2A55'; ctx.stroke();
  ctx.strokeStyle = 'rgba(31,42,85,0.5)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-18, -8); ctx.lineTo(18, -8); ctx.moveTo(0, -30); ctx.lineTo(0, 14); ctx.stroke();
  ctx.restore();
}
function singer(x, t, o = {}) {
  const sq = 0.12 * Math.max(...RIPS.map((R) => (t >= R.t ? Math.exp(-(t - R.t) / 0.12) : 0)));
  const P = pose('sing', t), v = A.env('vocal', t);
  P.armL = [-112 + Math.sin(t * 3) * 12, -190 - v * 40]; P.armR = [46, 118];
  x.save();
  if (o.shadow !== false) { x.fillStyle = o.shadowCol || 'rgba(0,0,0,0.2)'; x.save(); x.translate(26, 22); drawMascot(x, { x: CUR.x, y: CUR.y, s: CUR.s, t, P, style: 'silhouette', colors: { ink: o.shadowCol || 'rgba(0,0,0,0.2)' }, squash: sq }); x.restore(); }
  drawMascot(x, { x: CUR.x, y: CUR.y, s: CUR.s, t, P, mouth: 'auto', squash: sq, sticker: o.sticker ?? true, eyes: o.eyes || 'normal', style: o.style || 'flat', colors: o.colors, lineGlow: o.glow, glyph: false, over: (c, P2) => mic(c, P2, o.mic || '#C3C3C3') });
  x.restore();
}
function grid(x, step, col, lw) { x.strokeStyle = col; x.lineWidth = lw; x.beginPath(); for (let gx = 0; gx <= W; gx += step) { x.moveTo(gx, 0); x.lineTo(gx, H); } for (let gy = 0; gy <= H; gy += step) { x.moveTo(0, gy); x.lineTo(W, gy); } x.stroke(); }
function dots(x, step, col, cx, cy, k = 1) {
  x.fillStyle = col; x.beginPath();
  for (let y = 0; y < H + step; y += step) for (let xx = (Math.round(y / step) % 2) * step / 2; xx < W + step; xx += step) {
    const d = Math.hypot(xx - cx, y - cy) / 1100, r = clamp(d * k) * step * 0.48; if (r > 0.7) { x.moveTo(xx + r, y); x.arc(xx, y, r, 0, TAU); }
  }
  x.fill();
}
const WX = 600; // word column centre
function poster(j, x, t) {
  x.save(); x.setTransform(1, 0, 0, 1, 0, 0);
  const bt = A.pulse('beat', t, 0.14);
  if (j === 0) { // OPUS · sunburst pop
    x.fillStyle = '#FF3E8A'; x.fillRect(0, 0, W, H);
    rays(x, CUR.x, 560, 26, 2600, t * 0.4, 'rgba(255,122,26,0.95)', 'rgba(0,0,0,0)');
    dots(x, 26, 'rgba(255,225,77,0.55)', CUR.x, 560, 1.4);
    for (let i = 0; i < 12; i++) { star(x, hash(i, 2) * W, hash(i, 3) * H, 30 + hash(i, 4) * 30, 13, 5, t * 3 + i); x.fillStyle = i % 2 ? '#FFE14D' : '#FFFBF4'; x.fill(); }
    x.save(); x.translate(WX, 520); x.rotate(-0.07); x.scale(1 + bt * 0.05, 1 + bt * 0.05);
    bigType(x, 'OPUS', 0, 0, { size: 470, fill: '#FFE14D', stroke: '#2A0B3D', sw: 24, shadow: '#7B2FF7', sx: 20, sy: 20, maxW: 820 });
    x.restore();
    singer(x, t, { mic: '#FFE14D' });
  } else if (j === 1) { // 5. · internet brutalism
    x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, W, H); grid(x, 64, 'rgba(43,43,255,0.14)', 2);
    const wx = 180, wy = 190, ww = 900, wh = 640;
    x.fillStyle = '#0E0E12'; x.fillRect(wx + 16, wy + 16, ww, wh);
    x.fillStyle = '#C3C3C3'; x.fillRect(wx, wy, ww, wh);
    x.fillStyle = '#2B2BFF'; x.fillRect(wx + 8, wy + 8, ww - 16, 54);
    bigType(x, 'OPUS_5.5.EXE', wx + 28, wy + 36, { size: 28, family: 'Press Start 2P', fill: '#fff', align: 'left' });
    x.fillStyle = '#FF2A2A'; x.fillRect(wx + ww - 60, wy + 16, 40, 38); bigType(x, 'X', wx + ww - 40, wy + 37, { size: 26, family: 'Press Start 2P', fill: '#fff' });
    x.fillStyle = '#fff'; x.fillRect(wx + 18, wy + 74, ww - 36, wh - 92);
    bigType(x, '5.', WX - 10 + 12, 545 + 12, { size: 470, family: 'Rubik Mono One', fill: '#FF2A2A' });
    bigType(x, '5.', WX - 10, 545, { size: 470, family: 'Rubik Mono One', fill: '#2B2BFF' });
    // pointer cursors
    for (let i = 0; i < 5; i++) { const px = 120 + hash(i, 8) * 1700, py = 140 + hash(i, 9) * 800 + Math.sin(t * 6 + i) * 20; x.fillStyle = '#0E0E12'; x.beginPath(); x.moveTo(px, py); x.lineTo(px, py + 44); x.lineTo(px + 12, py + 33); x.lineTo(px + 22, py + 52); x.lineTo(px + 30, py + 48); x.lineTo(px + 20, py + 30); x.lineTo(px + 34, py + 30); x.closePath(); x.fill(); }
    singer(x, t, { eyes: 'happy', mic: '#2B2BFF', shadowCol: 'rgba(43,43,255,0.25)' });
  } else if (j === 2) { // 5.5 · night terminal neon
    const g = x.createRadialGradient(CUR.x, 600, 50, CUR.x, 600, 1300); g.addColorStop(0, '#1d2550'); g.addColorStop(1, '#070915');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 140; i++) { x.fillStyle = `rgba(255,251,244,${0.3 + 0.7 * hash(i, 3)})`; x.fillRect(hash(i, 1) * W, hash(i, 2) * H, 3, 3); }
    x.fillStyle = 'rgba(255,255,255,0.04)'; for (let y = 0; y < H; y += 6) x.fillRect(0, y, W, 2);
    x.save(); x.shadowColor = '#FF6A1F'; x.shadowBlur = 40;
    bigType(x, '5.5', WX, 540, { size: 420, family: 'Monoton', fill: '#FF8A3D', maxW: 860 });
    x.shadowBlur = 0; bigType(x, '> opus --version', WX, 250, { size: 44, family: 'JetBrains Mono', weight: '800', fill: '#FF6A1F' });
    x.restore();
    singer(x, t, { style: 'line', glow: '#FF6A1F', colors: { ink: '#FF8A3D' }, shadow: false, sticker: false, mic: '#FF6A1F' });
  } else if (j === 3) { // YEAH! · gold rush
    x.fillStyle = '#FFC300'; x.fillRect(0, 0, W, H);
    rays(x, WX, 560, 30, 2600, -t * 0.5, 'rgba(224,161,0,0.9)', 'rgba(0,0,0,0)');
    dots(x, 22, '#111111', WX, 560, 1.6);
    for (let i = 0; i < 9; i++) { const cx = hash(i, 5) * W, cy = hash(i, 6) * H, rr = 34 + hash(i, 7) * 20, sq = Math.abs(Math.cos(t * 5 + i)); x.fillStyle = '#111'; x.beginPath(); x.ellipse(cx + 5, cy + 6, rr * sq + 3, rr, 0, 0, TAU); x.fill(); x.fillStyle = '#FFE14D'; x.beginPath(); x.ellipse(cx, cy, rr * sq + 2, rr, 0, 0, TAU); x.fill(); }
    x.save(); x.translate(WX, 540); x.rotate(-0.08); x.scale(1 + bt * 0.06, 1 + bt * 0.06);
    bigType(x, 'YEAH!', 0, 0, { size: 330, family: 'Bungee', fill: '#111111', stroke: '#FFF4D6', sw: 26, shadow: '#FF6A1F', sx: 16, sy: 16, maxW: 900 });
    x.restore();
    singer(x, t, { eyes: 'star', mic: '#111111' });
  } else if (j === 4) { // BREAKING · chrome voxel neon
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#B79CFF'); g.addColorStop(0.6, '#E6DBFF'); g.addColorStop(0.6, '#1A1240'); g.addColorStop(1, '#3a2a8a');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    x.strokeStyle = '#3EF0FF'; x.lineWidth = 4; x.beginPath(); const hz = H * 0.6;
    for (let i = -20; i <= 20; i++) { x.moveTo(W / 2 + i * 40, hz); x.lineTo(W / 2 + i * 300, H); }
    for (let k = 0; k < 10; k++) { const yy = hz + (H - hz) * ((k + (t * 2.5) % 1) / 10) ** 2; x.moveTo(0, yy); x.lineTo(W, yy); }
    x.stroke();
    x.save(); x.translate(WX, 520); x.rotate(-0.04);
    font_chrome(x, 'BREAKING', 0, 0, 300, 900);
    x.restore();
    singer(x, t, { eyes: 'shades', mic: '#3EF0FF', colors: { body: '#7CFFC4' } });
  } else { // RULES · ruled notebook paper
    x.fillStyle = '#F4EDE0'; x.fillRect(0, 0, W, H);
    x.strokeStyle = 'rgba(46,139,224,0.35)'; x.lineWidth = 3; x.beginPath(); for (let y = 150; y < H; y += 62) { x.moveTo(0, y); x.lineTo(W, y); } x.stroke();
    x.strokeStyle = 'rgba(232,52,63,0.55)'; x.beginPath(); x.moveTo(200, 0); x.lineTo(200, H); x.stroke();
    bigType(x, 'all the', WX, 300, { size: 130, family: 'Caveat', weight: '700', fill: '#E8343F' });
    x.save(); x.translate(WX, 560); x.rotate(-0.05);
    bigType(x, 'RULES', 0, 0, { size: 360, fill: '#1F2A55', shadow: 'rgba(31,42,85,0.18)', sx: 14, sy: 14, maxW: 780 });
    // red marker X scribbles itself across RULES
    const u = ease.outCubic(seg(t, 129.7, 129.9));
    x.strokeStyle = '#E8343F'; x.lineWidth = 34; x.lineCap = 'round'; x.globalAlpha = 0.92;
    if (u > 0) { x.beginPath(); x.moveTo(-400, -150); x.lineTo(-400 + 800 * clamp(u * 2), -150 + 300 * clamp(u * 2)); x.stroke(); }
    if (u > 0.5) { x.beginPath(); x.moveTo(400, -150); x.lineTo(400 - 800 * clamp(u * 2 - 1), -150 + 300 * clamp(u * 2 - 1)); x.stroke(); }
    x.restore();
    singer(x, t, { eyes: u > 0 ? 'star' : 'normal', mic: '#E8343F' });
  }
  // printed-paper finish
  x.globalCompositeOperation = 'source-over'; x.drawImage(grainTex('F02', 960, 540, 7, 0.7), 0, 0, W, H);
  x.restore();
}
function font_chrome(x, str, cx, cy, size, maxW) {
  x.font = `400 ${size}px "Anton"`; let s = size; const m = x.measureText(str).width; if (m > maxW) { s = size * maxW / m; x.font = `400 ${s}px "Anton"`; }
  x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round';
  x.fillStyle = '#1A1240'; x.fillText(str, cx + 14, cy + 16);
  const g = x.createLinearGradient(0, cy - s / 2, 0, cy + s / 2);
  g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.45, '#C9D2E6'); g.addColorStop(0.5, '#3a2a8a'); g.addColorStop(0.62, '#7CFFC4'); g.addColorStop(1, '#FFFFFF');
  x.lineWidth = 14; x.strokeStyle = '#1A1240'; x.strokeText(str, cx, cy);
  x.fillStyle = g; x.fillText(str, cx, cy);
  // cracks
  x.strokeStyle = '#1A1240'; x.lineWidth = 5; const r = rng(9);
  for (let k = 0; k < 5; k++) { let px = cx - maxW / 2 + 80 + k * (maxW - 160) / 4, py = cy - s * 0.4; x.beginPath(); x.moveTo(px, py); for (let i = 0; i < 7; i++) { px += (r() - 0.5) * 60; py += s * 0.12; x.lineTo(px, py); } x.stroke(); }
}

// ---------------------------------------------------------------- compositing
function drawRemnant(ctx, img, G) {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.38)'; ctx.shadowBlur = 16; ctx.shadowOffsetX = 5; ctx.shadowOffsetY = 8;
  pathPoly(ctx, G.A); ctx.fillStyle = '#ffffff'; ctx.fill();
  ctx.restore();
  ctx.save(); pathPoly(ctx, G.A); ctx.clip(); ctx.drawImage(img, 0, 0);
  pathPoly(ctx, G.band); ctx.fillStyle = '#FCFAF4'; ctx.fill();
  ctx.restore();
  ctx.save(); ctx.strokeStyle = 'rgba(255,253,247,0.85)'; ctx.lineWidth = 1.3; ctx.beginPath();
  for (const h of G.hairs) { ctx.moveTo(h[0], h[1]); ctx.lineTo(h[2], h[3]); }
  ctx.stroke(); ctx.restore();
}
function drawPeel(ctx, img, G, f) {
  const d = G.d;
  const flat = clipHalf(G.B, d, f, true);
  if (flat.length > 2) {
    ctx.save(); pathPoly(ctx, flat); ctx.clip(); ctx.drawImage(img, 0, 0);
    // curl shadow on the flat part just behind the fold
    const gx0 = d[0] * f, gy0 = d[1] * f;
    const g = ctx.createLinearGradient(gx0, gy0, gx0 - d[0] * 90, gy0 - d[1] * 90);
    g.addColorStop(0, 'rgba(0,0,0,0.38)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(-M, -M, W + 2 * M, H + 2 * M);
    ctx.restore();
  }
  const flap0 = clipHalf(G.B, d, f, false);
  if (flap0.length > 2) {
    const flap = reflectPts(flap0, d, f);
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 34; ctx.shadowOffsetX = -d[0] * 26 + 10; ctx.shadowOffsetY = -d[1] * 26 + 18;
    pathPoly(ctx, flap); ctx.fillStyle = '#EFEAE0'; ctx.fill();
    ctx.restore();
    ctx.save(); pathPoly(ctx, flap); ctx.clip();
    // back of the paper: curl highlight at the fold, soft falloff to the tip
    const gx0 = d[0] * f, gy0 = d[1] * f;
    const g = ctx.createLinearGradient(gx0, gy0, gx0 - d[0] * 520, gy0 - d[1] * 520);
    g.addColorStop(0, '#C9C2B4'); g.addColorStop(0.05, '#FFFFFF'); g.addColorStop(0.16, '#F3EEE4'); g.addColorStop(1, '#E4DDCF');
    ctx.fillStyle = g; ctx.fillRect(-M * 4, -M * 4, W + M * 8, H + M * 8);
    // show-through of the print, mirrored
    const k = 2 * f; ctx.globalAlpha = 0.1;
    ctx.transform(1 - 2 * d[0] * d[0], -2 * d[0] * d[1], -2 * d[0] * d[1], 1 - 2 * d[1] * d[1], k * d[0], k * d[1]);
    ctx.drawImage(img, 0, 0);
    ctx.restore();
    ctx.save(); pathPoly(ctx, flap); ctx.strokeStyle = 'rgba(60,50,40,0.25)'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
  }
}

// little torn scraps spat out of every tear
const SCRAP_COL = ['#FF3E8A', '#2B2BFF', '#FF8A3D', '#FFC300', '#B79CFF'];
function scraps(ctx, t) {
  const G = geo();
  RIPS.forEach((R, j) => {
    const lt = t - R.t; if (lt < 0 || lt > 0.75) return;
    const g = G[j], r = rng(R.seed * 7 + 1), d = g.d;
    for (let i = 0; i < 26; i++) {
      const p = g.T[Math.floor(r() * g.T.length)];
      const sp = 500 + r() * 1300, side = (r() - 0.5) * 900, del = r() * 0.12, u = Math.max(0, lt - del);
      if (u <= 0) { r(); r(); r(); continue; }
      const vx = -d[0] * sp - d[1] * side, vy = -d[1] * sp + d[0] * side - 300;
      const f = (1 - Math.exp(-3 * u)) / 3;
      const x = p[0] + vx * f, y = p[1] + vy * f + 900 * u * u;
      const w = 10 + r() * 26, h = 6 + r() * 16, spin = r() * TAU + u * (8 + r() * 14);
      ctx.save(); ctx.translate(x, y); ctx.rotate(spin * 0.5); ctx.scale(1, Math.cos(spin));
      ctx.globalAlpha = clamp(1 - u / 0.6);
      ctx.fillStyle = Math.cos(spin) > 0 ? SCRAP_COL[j % SCRAP_COL.length] : '#F3EEE4';
      ctx.beginPath(); ctx.moveTo(-w / 2, -h / 2); ctx.lineTo(w / 2, -h / 2 + 3); ctx.lineTo(w / 2 - 4, h / 2); ctx.lineTo(-w / 2 + 2, h / 2 - 2); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  });
}

export default {
  ...S,
  cutIn: 'punch',
  sfx: RIPS.map((R, i) => ({ t: R.t, type: 'rip', gain: i === 4 ? 1 : 0.8 })),
  draw(ctx, t, s, E) {
    const G = geo();
    let k = 0; for (const R of RIPS) if (t >= R.t) k++;
    const imgs = [];
    const need = (j) => { if (!imgs[j]) { const c = buf('F02-L' + j, W, H); poster(j, bctx(c), t); imgs[j] = c; } return imgs[j]; };
    // gentle push on the whole wall
    const z = 1 + 0.04 * s.u, rot = Math.sin(t * 1.7) * 0.006;
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.rotate(rot); ctx.translate(-W / 2, -H / 2);
    ctx.drawImage(need(k), 0, 0);
    for (let j = k - 1; j >= 0; j--) {
      const R = RIPS[j], g = G[j], img = need(j);
      drawRemnant(ctx, img, g);
      const p = (t - R.t) / R.dur;
      if (p < 1) {
        const f = g.fmax - (g.fmax - g.fmin + 120) * Math.pow(clamp(p), 1.55);
        drawPeel(ctx, img, g, f);
      }
    }
    scraps(ctx, t);
    ctx.restore();
    for (const R of RIPS) {
      const d = t - R.t;
      if (d >= 0 && d < 0.22) { const q = 1 - d / 0.22; E.fx.shake = Math.max(E.fx.shake, 9 * q * q); E.fx.rgb += 4 * q; E.fx.zoom += 0.02 * q * q; }
    }
    E.fx.vignette = 0.18;
  },
};
