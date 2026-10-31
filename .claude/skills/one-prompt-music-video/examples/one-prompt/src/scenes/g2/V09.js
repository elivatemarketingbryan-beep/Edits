// V09 · "Every shape is a line," — REAL Fourier epicycles.
// Four closed paths (circle, square, star, CURSOR's traced silhouette outline) are resampled by arc length,
// transformed with a DFT, and redrawn by a chain of rotating circles. The coefficient sets cross-fade
// at the shared start point, so the pen never lifts: ONE continuous line draws all four shapes.
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, seg, hash, buf, bctx, font } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { drawMascot, pose } from '../../core/mascot.js';
import { PS, paperBG, paperTex, gridLines, cam, shadowText, popIn, slam } from './_g2.js';

const S = shot('V09');
const N = 1024, K = 110;
const SX = 1170, SY = 548;          // stage centre (world)
const R0 = 270;                       // all shapes start at (0,-R0)
const T = [19.24, 19.47, 19.72, 19.98, 20.42];   // shape boundaries (circle, square, star, cursor)
const NAMES = ['CIRCLE', 'SQUARE', 'STAR', 'CURSOR'];

let shapes = null, cursorXf = null;
const mkPZ = () => { const P = { armL: [-122, 78], armR: [122, 78], legL: [-42, 185], legR: [42, 185], squash: 0, rot: 0, bob: 0, look: [0, 0], lean: 0 }; P.armL = [-178, 46]; P.armR = [170, -176]; P.legL = [-46, 185]; P.legR = [46, 185]; P.look = [0.3, -0.2]; return P; };
const PZ = mkPZ();

// ---------- geometry ----------
function resample(pts, n) {
  const L = [0]; for (let i = 1; i <= pts.length; i++) { const a = pts[i - 1], b = pts[i % pts.length]; L.push(L[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1])); }
  const tot = L[L.length - 1], out = []; let j = 0;
  for (let i = 0; i < n; i++) {
    const d = (i / n) * tot; while (L[j + 1] < d) j++;
    const a = pts[j], b = pts[(j + 1) % pts.length], u = (d - L[j]) / Math.max(1e-9, L[j + 1] - L[j]);
    out.push([lerp(a[0], b[0], u), lerp(a[1], b[1], u)]);
  }
  return out;
}
const area = (p) => { let s = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return s / 2; };
function prep(pts, startNear) {
  if (area(pts) < 0) pts = pts.slice().reverse();        // clockwise on screen (y down) ⇒ positive area
  let bi = 0, bd = 1e18; pts.forEach((p, i) => { const d = (p[0] - startNear[0]) ** 2 + (p[1] - startNear[1]) ** 2; if (d < bd) { bd = d; bi = i; } });
  pts = pts.slice(bi).concat(pts.slice(0, bi));
  return pts;
}
function dft(pts) { // c_k for k = -K..K ; z(θ) = Σ c_k e^{ikθ}
  const C = [];
  for (let k = -K; k <= K; k++) {
    let re = 0, im = 0;
    for (let n = 0; n < N; n++) { const a = (-TAU * k * n) / N, x = pts[n][0], y = pts[n][1], c = Math.cos(a), s = Math.sin(a); re += x * c - y * s; im += x * s + y * c; }
    C.push([re / N, im / N]);
  }
  return C;
}
function traceSilhouette() {
  const w = 560, h = 600, c = buf('read-V09-sil', w, h), x = bctx(c);
  x.clearRect(0, 0, w, h);
  const ox = 290, oy = 520, s0 = 1;
  drawMascot(x, { x: ox, y: oy, s: s0, t: 0, P: PZ, style: 'silhouette', blink: 0, mouth: 'smile', glyph: false, colors: { ink: '#000' } });
  const d = x.getImageData(0, 0, w, h).data, m = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) m[i] = d[i * 4 + 3] > 110 ? 1 : 0;
  const fg = (px, py) => px >= 0 && py >= 0 && px < w && py < h && m[py * w + px] === 1;
  let sx = -1, sy = -1;
  outer: for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) if (m[yy * w + xx]) { sx = xx; sy = yy; break outer; }
  const D = [[-1, 0], [-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1]];
  const pts = [[sx, sy]]; let cx = sx, cy = sy, bdir = 0;
  for (let it = 0; it < 20000; it++) {
    let found = false;
    for (let i = 1; i <= 8; i++) {
      const dd = (bdir + i) % 8, nx = cx + D[dd][0], ny = cy + D[dd][1];
      if (fg(nx, ny)) {
        const pd = (bdir + i - 1) % 8, bx = cx + D[pd][0], by = cy + D[pd][1];
        cx = nx; cy = ny;
        const rx = bx - cx, ry = by - cy; bdir = D.findIndex((q) => q[0] === rx && q[1] === ry); if (bdir < 0) bdir = 0;
        found = true; break;
      }
    }
    if (!found || (cx === sx && cy === sy)) break;
    pts.push([cx, cy]);
  }
  // smooth
  const sm = pts.map((_, i) => { let ax = 0, ay = 0; for (let k = -3; k <= 3; k++) { const q = pts[(i + k + pts.length) % pts.length]; ax += q[0]; ay += q[1]; } return [ax / 7, ay / 7]; });
  return { pts: sm, ox, oy, s0 };
}

function build() {
  const sh = [];
  // circle
  const circ = []; for (let i = 0; i < 720; i++) { const a = (i / 720) * TAU; circ.push([Math.sin(a) * R0, -Math.cos(a) * R0]); }
  // square (top-middle start)
  const hs = 255, sq = [];
  const corners = [[0, -hs], [hs, -hs], [hs, hs], [-hs, hs], [-hs, -hs], [0, -hs]];
  for (let c = 0; c < 5; c++) for (let i = 0; i < 100; i++) { const a = corners[c], b = corners[c + 1], u = i / 100; sq.push([lerp(a[0], b[0], u), lerp(a[1], b[1], u) - (R0 - hs)]); }
  // star
  const st = []; const ro = 300, ri = 128;
  for (let i = 0; i < 10; i++) {
    const a0 = -Math.PI / 2 + (i * Math.PI) / 5, a1 = -Math.PI / 2 + ((i + 1) * Math.PI) / 5;
    const r0 = i % 2 ? ri : ro, r1 = i % 2 ? ro : ri;
    for (let j = 0; j < 60; j++) { const u = j / 60; st.push([lerp(Math.cos(a0) * r0, Math.cos(a1) * r1, u), lerp(Math.sin(a0) * r0, Math.sin(a1) * r1, u) + (ro - R0) + 6]); }
  }
  // cursor silhouette
  const tr = traceSilhouette();
  const sc = 1.42;
  const headTopY = tr.oy - 300 * tr.s0;
  const cur = tr.pts.map((p) => [(p[0] - tr.ox) * sc, (p[1] - headTopY) * sc - R0]);
  cursorXf = { x: 0, y: (tr.oy - headTopY) * sc - R0, s: sc };   // mascot ground point in stage space
  for (const raw of [circ, sq, st, cur]) {
    const p = resample(prep(raw, [0, -R0 - 40]), N);
    const C = dft(p);
    sh.push({ pts: p, C });
  }
  shapes = sh;
}

// pen position for continuous parameter u ∈ [0,4]: shape floor(u), θ = 2π·frac(u); coefficient sets blend at the seams
function coeffs(u) {
  const i = clamp(Math.floor(u), 0, 3), f = u - Math.floor(u);
  const BW = 0.035;
  if (f < BW && i > 0) return { a: shapes[i - 1].C, b: shapes[i].C, m: 0.5 + 0.5 * (f / BW) };
  if (f > 1 - BW && i < 3) return { a: shapes[i].C, b: shapes[i + 1].C, m: 0.5 - 0.5 * ((1 - f) / BW) };
  return { a: shapes[i].C, b: shapes[i].C, m: 0 };
}
function penAt(u, out) {
  const { a, b, m } = coeffs(u), th = TAU * (u - Math.floor(u));
  let x = 0, y = 0;
  for (let j = 0; j < a.length; j++) {
    const re = lerp(a[j][0], b[j][0], m), im = lerp(a[j][1], b[j][1], m);
    if (Math.abs(re) + Math.abs(im) < 0.05) continue;
    const k = j - K, c = Math.cos(k * th), s = Math.sin(k * th);
    x += re * c - im * s; y += re * s + im * c;
  }
  out[0] = x; out[1] = y; return out;
}
function uAt(t) {
  if (t <= T[0]) return 0;
  for (let i = 0; i < 4; i++) if (t < T[i + 1]) return i + (t - T[i]) / (T[i + 1] - T[i]);
  return 4 + (t - T[4]) / 0.9;
}

function legendSlot(i) { return [1748, 300 + i * 158]; }

export default {
  ...S,
  sfx: [{ t: 19.47, type: 'tick', gain: 0.5 }, { t: 19.72, type: 'tick', gain: 0.5 }, { t: 19.98, type: 'tick', gain: 0.5 }, { t: 20.42, type: 'pop', gain: 0.9 }],
  async init() { build(); paperTex(); },
  draw(ctx, t, s, E) {
    if (!shapes) build();
    const lt = s.lt;
    const u = uAt(t);
    const reveal = t >= T[4] ? (t - T[4]) : -1;
    // ---- camera ----
    const kick = Math.exp(-A.since('beat', t) / 0.12);
    const zoom = 1 + lt * 0.035 + kick * 0.012 + (reveal >= 0 ? 0.03 * ease.outExpo(reveal / 0.3) : 0);
    ctx.save();
    cam(ctx, W / 2 + lt * 10, H / 2, zoom, -0.012 + lt * 0.01);
    paperBG(ctx, PS.paper, 1, 120);
    gridLines(ctx, 30, 'rgba(31,42,85,0.06)', 1, 0, 0, -120, -120, W + 120, H + 120);
    gridLines(ctx, 150, 'rgba(31,42,85,0.13)', 1.5, SX % 150, SY % 150, -120, -120, W + 120, H + 120);
    // stage axes
    ctx.strokeStyle = 'rgba(232,52,63,0.25)'; ctx.lineWidth = 2; ctx.setLineDash([10, 10]);
    ctx.beginPath(); ctx.moveTo(SX - 520, SY); ctx.lineTo(SX + 560, SY); ctx.moveTo(SX, SY - 460); ctx.lineTo(SX, SY + 430); ctx.stroke(); ctx.setLineDash([]);

    // ---- completed shapes fly to the legend ----
    for (let i = 0; i < 3; i++) {
      if (t < T[i + 1]) continue;
      const k = ease.outExpo((t - T[i + 1]) / 0.32), [lx, ly] = legendSlot(i);
      const px = lerp(SX, lx, k), py = lerp(SY, ly + 10, k), sc = lerp(1, 0.15, k);
      if (k > 0.5) {
        const a = clamp((k - 0.5) * 2);
        ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = PS.ink; ctx.fillRect(lx - 55 + 6, ly - 55 + 6, 110, 110); ctx.fillStyle = '#FFFBF4'; ctx.fillRect(lx - 55, ly - 55, 110, 110);
        ctx.strokeStyle = PS.ink; ctx.lineWidth = 3; ctx.strokeRect(lx - 55, ly - 55, 110, 110);
        font(ctx, 17, 'JetBrains Mono', '800'); ctx.fillStyle = PS.red; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText(NAMES[i], lx - 84, ly, ); 
        ctx.restore();
      }
      ctx.save(); ctx.translate(px, py); ctx.scale(sc, sc);
      ctx.beginPath(); const P = shapes[i].pts; ctx.moveTo(P[0][0], P[0][1]); for (let j = 1; j < N; j += 2) ctx.lineTo(P[j][0], P[j][1]); ctx.closePath();
      ctx.lineWidth = 14 / Math.max(sc, 0.35); ctx.strokeStyle = PS.ink; ctx.lineJoin = 'round'; ctx.stroke();
      ctx.restore();
      if (k > 0.5) { ctx.fillStyle = PS.ink; font(ctx, 34, 'Anton'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.globalAlpha = clamp((k - 0.5) * 2); ctx.fillText('↓', lx, ly + 79); ctx.globalAlpha = 1; }
    }
    if (reveal >= 0) {
      const [lx, ly] = legendSlot(3), a = clamp(reveal / 0.15);
      ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = PS.red; ctx.fillRect(lx - 55 + 6, ly - 55 + 6, 110, 110); ctx.fillStyle = PS.orange; ctx.fillRect(lx - 55, ly - 55, 110, 110);
      ctx.strokeStyle = PS.ink; ctx.lineWidth = 3; ctx.strokeRect(lx - 55, ly - 55, 110, 110);
      font(ctx, 17, 'JetBrains Mono', '800'); ctx.fillStyle = PS.red; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText('CURSOR', lx - 84, ly);
      ctx.restore();
    }

    // ---- the drawing ----
    ctx.save(); ctx.translate(SX, SY);
    const u0 = Math.min(3, Math.floor(u));
    const p = [0, 0];
    if (reveal >= 0) {
      const k = ease.outBack(reveal / 0.24, 2.6);
      const sq = Math.sin(reveal * 22) * Math.exp(-reveal * 7) * 0.12;
      ctx.save(); ctx.globalAlpha = clamp(reveal / 0.05);
      ctx.translate(cursorXf.x, cursorXf.y); ctx.scale(lerp(0.9, 1, k), lerp(0.9, 1, k));
      drawMascot(ctx, { x: 0, y: 0, s: cursorXf.s, t, P: { ...PZ, squash: sq }, blink: reveal < 0.08 ? 1 : 'auto', mouth: reveal < 0.14 ? 'smile' : 'grin', eyes: 'normal' });
      ctx.restore();
    }
    const endU = Math.min(u, 4 - 1e-4);
    const startU = Math.max(0, reveal >= 0 ? 3 : u0 - 0.035);
    const steps = Math.max(2, Math.ceil((endU - startU) * 520));
    const P2 = new Float32Array((steps + 1) * 2);
    for (let i = 0; i <= steps; i++) { penAt(lerp(startU, endU, i / steps), p); P2[i * 2] = p[0]; P2[i * 2 + 1] = p[1]; }
    const path = (a, b) => { ctx.beginPath(); ctx.moveTo(P2[a * 2], P2[a * 2 + 1]); for (let i = a + 1; i <= b; i++) ctx.lineTo(P2[i * 2], P2[i * 2 + 1]); };
    const trailW = reveal >= 0 ? lerp(15, 9, clamp(reveal / 0.2)) : 15;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    path(0, steps);
    ctx.strokeStyle = 'rgba(232,52,63,0.35)'; ctx.lineWidth = trailW; ctx.save(); ctx.translate(5, 4); ctx.stroke(); ctx.restore();
    ctx.strokeStyle = PS.ink; ctx.lineWidth = trailW; ctx.stroke();
    // fresh ink near the nib is still hot orange, cooling to navy
    if (reveal < 0) {
      const hot = Math.min(steps, 60);
      for (let q = 0; q < 3; q++) { const a = steps - Math.round(hot * (1 - q / 3)); path(Math.max(0, a), steps); ctx.strokeStyle = q === 2 ? '#FFB066' : PS.orange; ctx.globalAlpha = 0.45 + q * 0.25; ctx.lineWidth = trailW + 2 - q * 2; ctx.stroke(); }
      ctx.globalAlpha = 1;
    }

    // epicycle chain
    const chainA = reveal >= 0 ? clamp(1 - reveal / 0.18) : 1;
    if (chainA > 0) {
      const uu = reveal >= 0 ? 4 - 1e-4 : u;
      const { a, b, m } = coeffs(uu), th = TAU * (uu - Math.floor(uu));
      const terms = [];
      let dc = null;
      for (let j = 0; j < a.length; j++) {
        const re = lerp(a[j][0], b[j][0], m), im = lerp(a[j][1], b[j][1], m), r = Math.hypot(re, im);
        if (j === K) { dc = { re, im }; continue; }
        if (r > 0.3) terms.push({ k: j - K, re, im, r });
      }
      terms.sort((x, y) => y.r - x.r);
      let x = dc.re, y = dc.im;
      const burst = reveal >= 0 ? 1 + ease.outExpo(reveal / 0.18) * 0.8 : 1;
      ctx.save();
      ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(232,52,63,0.8)';
      const joints = [];
      for (let q = 0; q < terms.length && q < 170; q++) {
        const T2 = terms[q], c = Math.cos(T2.k * th), sN = Math.sin(T2.k * th);
        const nx = x + (T2.re * c - T2.im * sN), ny = y + (T2.re * sN + T2.im * c);
        ctx.globalAlpha = chainA * (q < 8 ? 0.95 : 0.6);
        ctx.beginPath(); ctx.arc(x, y, T2.r * burst, 0, TAU);
        if (q < 3) { ctx.fillStyle = q === 0 ? 'rgba(232,52,63,0.05)' : 'rgba(255,106,31,0.08)'; ctx.fill(); }
        ctx.lineWidth = q < 8 ? 3.2 : 1.8; ctx.stroke();
        if (T2.r > 14) { const ta = Math.atan2(ny - y, nx - x); ctx.beginPath(); ctx.moveTo(x + Math.cos(ta) * T2.r * 0.86, y + Math.sin(ta) * T2.r * 0.86); ctx.lineTo(x + Math.cos(ta) * T2.r * 1.14, y + Math.sin(ta) * T2.r * 1.14); ctx.stroke(); }
        joints.push([x, y, nx, ny]);
        x = nx; y = ny;
      }
      ctx.globalAlpha = chainA;
      ctx.strokeStyle = PS.ink; ctx.lineWidth = 3; ctx.beginPath();
      for (const j of joints) { ctx.moveTo(j[0], j[1]); ctx.lineTo(j[2], j[3]); } ctx.stroke();
      ctx.fillStyle = PS.ink; for (let q = 0; q < Math.min(14, joints.length); q++) { ctx.beginPath(); ctx.arc(joints[q][0], joints[q][1], 4, 0, TAU); ctx.fill(); }
      ctx.fillStyle = PS.orange; ctx.strokeStyle = PS.ink; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(x, y, 13, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
    ctx.restore();

    // ---- labels ----
    ctx.save();
    font(ctx, 24, 'JetBrains Mono', '700'); ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillStyle = 'rgba(31,42,85,0.75)';
    ctx.fillText('z(θ) = Σ cₖ · e^(i·k·θ)', 1840, 172);
    const nCirc = shapes[u0].C.filter((c) => Math.hypot(c[0], c[1]) > 0.3).length;
    ctx.fillStyle = PS.red; ctx.fillText(`${String(nCirc).padStart(3, '0')} EPICYCLES · N=${N} · DFT`, 1840, 206);
    font(ctx, 30, 'JetBrains Mono', '800'); ctx.fillStyle = PS.ink; ctx.textAlign = 'center';
    ctx.fillText(`[ ${NAMES[u0]} ]`, SX, SY + 372);
    ctx.restore();

    // ---- big type (left column) ----
    const X = 130;
    const w1 = popIn(t, 19.24, 0.22), w2 = slam(t, 19.72, 0.18, 2.2), w3 = popIn(t, 20.02, 0.22), w4 = slam(t, 20.42, 0.18, 2.6);
    const put = (k, fn) => { if (k <= 0) return; ctx.save(); fn(k); ctx.restore(); };
    put(w1, (k) => { ctx.translate(X, 250); ctx.scale(k, k); shadowText(ctx, 'EVERY', 0, 0, { size: 118, align: 'left', off: 6 }); });
    put(w2, (k) => { ctx.translate(X, 410); ctx.scale(k, k); shadowText(ctx, 'SHAPE', 0, 0, { size: 210, align: 'left', off: 9, fill: PS.ink, shadow: PS.orange }); });
    put(w3, (k) => { ctx.translate(X, 572); ctx.scale(k, k); shadowText(ctx, 'IS A', 0, 0, { size: 118, align: 'left', off: 6 }); });
    put(w4, (k) => { ctx.translate(X - 6, 760); ctx.rotate(-0.04); ctx.scale(k, k); shadowText(ctx, 'line.', 0, 0, { size: 290, family: 'Instrument Serif', style: 'italic', align: 'left', off: 8, fill: PS.red, shadow: PS.ink }); });
    ctx.restore();

    // ---- fx ----
    if (reveal >= 0 && reveal < 0.2) { E.fx.zoom += 0.04 * (1 - reveal / 0.2); E.fx.shake = 10 * (1 - reveal / 0.2); E.fx.rgb = 4 * (1 - reveal / 0.2); }
    for (let i = 1; i < 4; i++) { const d = t - T[i]; if (d >= 0 && d < 0.1) E.fx.zoom += 0.012 * (1 - d / 0.1); }
  },
};
