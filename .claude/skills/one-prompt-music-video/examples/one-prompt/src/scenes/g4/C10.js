// C10 — "let it fly" · Sky-writing squadron.
// Three paper planes fly filleted letter paths in formation and sky-write F L Y. Smoke is a real particle
// trail: every puff is emitted at the exact moment its plane passes that point of the path (inverse arc-length
// timing), then expands, drifts in the wind and wobbles — a pure function of t. CURSOR rides the lead plane.
// Big moment: downbeat 51.69 — the finished letters pop into candy-coloured smoke; then the lead plane
// banks round and flies straight into the lens (hand-off to C11).
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, seg, hash, noise2, wobble } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { drawMascot } from '../../core/mascot.js';
import { C, sparkle } from './_util.js';
import { drawSky, drawClouds, cloudSprites } from './_sky.js';

const S = shot('C10');
const T_WS = 50.30, T_WE = 51.58, T_POP = 51.69, T_DIVE = 52.18;
const HORIZON = 800;
const FAR = [
  { z: 9.0, n: 30, y0: -160, y1: 30, scale: 1.7 },
  { z: 6.0, n: 10, y0: -900, y1: 60 },
  { z: 3.6, n: 6, y0: -1100, y1: 100, skip: 0.3 },
];

// path points: {x, y, on (segment to next has smoke), r (fillet radius)}
const P = (x, y, on = 0, r) => ({ x, y, on, r });
const PATHS = [
  { // F — left plane
    pts: [P(-260, 1180), P(150, 900), P(372, 735, 1), P(372, 215, 1, 70), P(668, 215, 0, 50), P(780, 230, 0, 90), P(720, 470, 0, 120), P(500, 520, 0, 90), P(372, 470, 1, 70), P(610, 470, 0), P(780, 430, 0, 100), P(820, 120, 0, 120), P(400, -300, 0)],
    col: C.pink, scale: 2.0,
  },
  { // L — lead plane (CURSOR)
    pts: [P(980, 1260), P(1010, 900, 0, 200), P(940, 110, 0, 110), P(848, 200, 1, 60), P(848, 728, 1, 70), P(1140, 728, 0), P(1330, 760, 0, 160), P(1420, 980, 0, 150), P(1100, 1060, 0, 160), P(860, 900, 0, 150), P(960, 700, 0)],
    col: C.yellow, scale: 2.7, lead: true,
  },
  { // Y — right plane
    pts: [P(2250, 760), P(1900, 330, 0, 160), P(1600, 80, 0, 120), P(1250, 200, 1, 10), P(1438, 455, 1, 40), P(1626, 200, 0, 50), P(1700, 120, 0, 90), P(1560, 300, 0, 110), P(1438, 455, 1, 30), P(1438, 742, 0), P(1460, 950, 0, 120), P(1900, 1150, 0)],
    col: C.purple, scale: 2.0,
  },
];

function build(path) {
  const pts = path.pts, dense = [];
  dense.push({ x: pts[0].x, y: pts[0].y, on: pts[0].on });
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1], v = pts[i], b = pts[i + 1];
    const la = Math.hypot(a.x - v.x, a.y - v.y), lb = Math.hypot(b.x - v.x, b.y - v.y);
    const r = Math.min(v.r ?? 40, la * 0.48, lb * 0.48);
    const p1 = { x: v.x + ((a.x - v.x) / la) * r, y: v.y + ((a.y - v.y) / la) * r };
    const p2 = { x: v.x + ((b.x - v.x) / lb) * r, y: v.y + ((b.y - v.y) / lb) * r };
    for (let k = 0; k <= 14; k++) {
      const u = k / 14, x = (1 - u) ** 2 * p1.x + 2 * (1 - u) * u * v.x + u * u * p2.x, y = (1 - u) ** 2 * p1.y + 2 * (1 - u) * u * v.y + u * u * p2.y;
      dense.push({ x, y, on: u < 0.5 ? a.on : v.on });
    }
  }
  const last = pts[pts.length - 1]; dense.push({ x: last.x, y: last.y, on: 0 });
  // resample every 5 px
  const out = []; let acc = 0, need = 0;
  for (let i = 0; i < dense.length - 1; i++) {
    const a = dense[i], b = dense[i + 1], L = Math.hypot(b.x - a.x, b.y - a.y);
    while (need <= acc + L) { const u = L ? (need - acc) / L : 0; out.push({ x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), on: a.on, s: need, ang: Math.atan2(b.y - a.y, b.x - a.x) }); need += 5; }
    acc += L;
  }
  let s0 = -1, s1 = 0; for (const p of out) if (p.on) { if (s0 < 0) s0 = p.s; s1 = p.s; }
  const len = out[out.length - 1].s;
  // timing: entry ends exactly at T_WS, letter strokes end at T_WE, exit at speed vx
  const tE0 = T_WS - 0.48, vW = (s1 - s0) / (T_WE - T_WS), vx = 1700;
  return { out, s0, s1, len, tE0, vW, vx, ...path };
}
function sAt(p, t) {
  if (t < T_WS) return p.s0 * ease.outQuad(clamp((t - p.tE0) / (T_WS - p.tE0)) * 0.5 + 0.5) * 2 - p.s0 + (t < p.tE0 ? (t - p.tE0) * 2000 : 0);
  if (t < T_WE) return p.s0 + (t - T_WS) * p.vW;
  return p.s1 + (t - T_WE) * p.vx;
}
function tAt(p, s) { // inverse for the writing window (smoke only exists there)
  return T_WS + (s - p.s0) / p.vW;
}
function sample(p, s) {
  const o = p.out, i = clamp(Math.floor(s / 5), 0, o.length - 2), u = clamp(s / 5 - i, 0, 1);
  const a = o[i], b = o[i + 1];
  if (s > p.len) { const e = o[o.length - 1]; return { x: e.x + Math.cos(e.ang) * (s - p.len), y: e.y + Math.sin(e.ang) * (s - p.len), ang: e.ang }; }
  if (s < 0) { const e = o[0]; return { x: e.x + Math.cos(e.ang) * s, y: e.y + Math.sin(e.ang) * s, ang: e.ang }; }
  let da = b.ang - a.ang; da = Math.atan2(Math.sin(da), Math.cos(da));
  return { x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), ang: a.ang + da * u };
}

function plane(ctx, x, y, ang, sc, col, bank = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(sc, sc * (1 - Math.abs(bank) * 0.35));
  ctx.lineJoin = 'round';
  // shadow
  ctx.fillStyle = 'rgba(120,20,80,0.25)'; ctx.beginPath(); ctx.moveTo(48, 10); ctx.lineTo(-38, -18); ctx.lineTo(-26, 10); ctx.lineTo(-38, 38); ctx.closePath(); ctx.fill();
  // far wing
  ctx.fillStyle = '#E9E1FF'; ctx.beginPath(); ctx.moveTo(44, 0); ctx.lineTo(-36, 30); ctx.lineTo(-24, 2); ctx.closePath(); ctx.fill();
  // near wing
  ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.moveTo(44, 0); ctx.lineTo(-36, -30); ctx.lineTo(-24, 2); ctx.closePath(); ctx.fill();
  // keel
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(44, 0); ctx.lineTo(-24, 2); ctx.lineTo(-30, 9); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = C.ink; ctx.lineWidth = 3.2 / sc * 1.6; ctx.beginPath(); ctx.moveTo(44, 0); ctx.lineTo(-36, -30); ctx.lineTo(-24, 2); ctx.lineTo(-36, 30); ctx.closePath(); ctx.moveTo(44, 0); ctx.lineTo(-24, 2); ctx.stroke();
  ctx.restore();
}

let BUILT = null;
export default {
  ...S,
  cutIn: 'none',
  sfx: [{ t: 50.30, type: 'riser', gain: 0.5 }, { t: T_POP, type: 'firework', gain: 0.9 }, { t: 52.5, type: 'whoosh', gain: 0.9 }],
  init() { cloudSprites(); },
  draw(ctx, t, s, E) {
    if (!BUILT) BUILT = PATHS.map(build);
    const lt = s.lt, popAge = t - T_POP, pop = popAge >= 0;
    const beat = A.pulse('beat', t, 0.2);
    // camera: wide reveal, then a push after the pop
    const zoom = lerp(1.14, 1.0, ease.outCubic(seg(t, 50.02, 51.0))) + (pop ? 0.05 * ease.outCubic(popAge / 0.8) : 0) + beat * 0.006;
    const panX = Math.sin(lt * 0.8) * 20, panY = -lt * 6;
    ctx.save();
    ctx.translate(960, 540); ctx.scale(zoom, zoom); ctx.rotate(Math.sin(lt * 1.1) * 0.012); ctx.translate(-960 + panX, -540 + panY);
    drawSky(ctx, t, { horizon: HORIZON, sunX: 960, sunY: HORIZON + 40, sunR: 230, rot: lt * 0.3 + (pop ? ease.outExpo(popAge / 0.6) * 0.5 : 0) });
    drawClouds(ctx, FAR, lt * 900 + 9000, 0, 0, 99, { horizon: HORIZON });
    ctx.fillStyle = 'rgba(255,120,150,0.12)'; ctx.fillRect(-300, -300, W + 600, H + 600);

    // pop: sunburst flash ring behind the letters
    if (pop && popAge < 0.6) {
      const u = ease.outCubic(popAge / 0.6);
      ctx.strokeStyle = `rgba(255,251,244,${0.7 * (1 - u)})`; ctx.lineWidth = 60 * (1 - u);
      ctx.beginPath(); ctx.arc(960, 470, 200 + 1100 * u, 0, TAU); ctx.stroke();
    }

    // ---------- smoke: emitted puffs ----------
    const cols = [C.pink, '#FFB020', C.purple];
    for (let pass = 0; pass < 3; pass++) {
      for (let pi = 0; pi < BUILT.length; pi++) {
        const p = BUILT[pi];
        const sNow = sAt(p, t);
        ctx.beginPath();
        let n = 0;
        for (let k = 0; k < p.out.length; k += 1) {
          const q = p.out[k];
          if (!q.on || q.s > sNow) continue;
          const born = tAt(p, q.s), age = t - born;
          if (age < 0) continue;
          const h1 = hash(k, pi, 1), h2 = hash(k, pi, 2), h3 = hash(k, pi, 3);
          if ((k & 1) && h3 < 0.5) continue;
          let r = (26 + 16 * h1) * (0.3 + 0.7 * (1 - Math.exp(-age * 9))) + age * 9;
          if (pop) r *= 1 + wobble(popAge - h2 * 0.08, 3, 5) * 0.22 * (popAge > h2 * 0.08 ? 1 : 0);
          const nx = noise2(q.x * 0.01 + age * 0.6, q.y * 0.01 + pi * 7) * 14 * age;
          const x = q.x + (h2 - 0.5) * 18 + age * 34 + nx, y = q.y + (h1 - 0.5) * 18 - age * 10 + noise2(q.y * 0.01, q.x * 0.01 + age) * 10 * age;
          if (pass === 0) { ctx.moveTo(x + 7 + r, y + 10); ctx.arc(x + 7, y + 10, r, 0, TAU); }
          else if (pass === 1) { ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, TAU); }
          else { const rr = r * 0.5; ctx.moveTo(x - r * 0.28 + rr, y - r * 0.32); ctx.arc(x - r * 0.28, y - r * 0.32, rr, 0, TAU); }
          n++;
        }
        if (!n) continue;
        const dye = pop ? ease.outCubic(popAge / 0.18) : 0;
        if (pass === 0) ctx.fillStyle = 'rgba(150,40,140,0.42)';
        else if (pass === 1) ctx.fillStyle = dye > 0 ? lerpHex('#F3EAFF', cols[pi], dye) : '#F3EAFF';
        else ctx.fillStyle = dye > 0 ? lerpHex('#FFFFFF', '#FFF6D0', dye) : '#FFFFFF';
        ctx.fill();
      }
    }
    // sparkles from the letters on the pop
    if (pop && popAge < 0.9) {
      for (let i = 0; i < 40; i++) {
        const p = BUILT[i % 3], q = p.out[Math.floor(hash(i, 4) * p.out.length)];
        if (!q.on) continue;
        const a = hash(i, 5) * TAU, d = 40 + popAge * (300 + hash(i, 6) * 400);
        sparkle(ctx, q.x + Math.cos(a) * d, q.y + Math.sin(a) * d, 22 * (1 - popAge / 0.9), popAge * 6 + i, i % 2 ? C.cream : C.yellow);
      }
    }

    // ---------- planes ----------
    for (let pi = 0; pi < BUILT.length; pi++) {
      const p = BUILT[pi];
      if (p.lead && t > T_DIVE) continue;
      const sNow = sAt(p, t), q = sample(p, sNow);
      const qa = sample(p, sNow + 30);
      let da = qa.ang - q.ang; da = Math.atan2(Math.sin(da), Math.cos(da));
      plane(ctx, q.x, q.y, q.ang, p.scale, p.col, clamp(da * 3, -1, 1));
      if (p.lead) rider(ctx, q.x, q.y, q.ang, p.scale, t);
    }
    // lead plane dives into the lens
    if (t > T_DIVE) {
      const p = BUILT[1], q0 = sample(p, sAt(p, T_DIVE));
      const u = seg(t, T_DIVE, S.end);
      const k = ease.inExpo(u);
      const x = lerp(q0.x, 980, ease.inOutCubic(u)), y = lerp(q0.y, 560, ease.inOutCubic(u));
      const sc = lerp(p.scale, 46, k);
      const ang = lerp(q0.ang, -0.25, ease.outCubic(u));
      plane(ctx, x, y, ang, sc, p.col, Math.sin(u * 6) * 0.3);
      rider(ctx, x, y, ang, sc, t);
    }
    // continuity from C09: the giant blurred cloud that wiped the lens exits left
    const cu = seg(t, S.start, S.start + 0.13);
    if (cu < 1) {
      const sp = cloudSprites()[1], sc = 6.2, w = sp.w * sc, h = sp.h * sc;
      ctx.drawImage(sp.cb, lerp(-0.6 * w, -1.02 * w, ease.outQuad(cu)), 1300 - h, w, h);
    }
    ctx.restore();

    E.fx.zoom += beat * 0.008;
    if (pop && popAge < 0.25) { E.fx.shake = 12 * (1 - popAge / 0.25); E.fx.rgb = 5 * (1 - popAge / 0.25); }
    if (pop && popAge < 0.05) E.fx.flash = [1, 0.96, 0.9, 0.3];
    E.fx.saturation = 1.08;
  },
};

function rider(ctx, x, y, ang, sc, t) {
  // CURSOR sits on the lead plane's back, waving (rotation damped so it stays upright-ish)
  let a = Math.atan2(Math.sin(ang), Math.cos(ang));
  const flip = Math.abs(a) > Math.PI / 2;
  const ra = flip ? (a > 0 ? a - Math.PI : a + Math.PI) : a;
  const s = sc * 0.16;
  drawMascot(ctx, { x: x - Math.sin(ra) * 6 * sc, y: y + Math.cos(ra) * -4 * sc, s, t, pose: 'wave', rot: ra * 0.45, sticker: true, mouth: 'grin', eyes: 'happy' });
}

function lerpHex(a, b, u) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const r = lerp(pa >> 16, pb >> 16, u), g = lerp((pa >> 8) & 255, (pb >> 8) & 255, u), bl = lerp(pa & 255, pb & 255, u);
  return `rgb(${r | 0},${g | 0},${bl | 0})`;
}
