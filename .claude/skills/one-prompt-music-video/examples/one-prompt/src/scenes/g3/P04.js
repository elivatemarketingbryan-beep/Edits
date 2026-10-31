// P04 — "just Claude and me" — One line, one heart.
// A generic 8-point spark (Claude) zips in from the word CLAUDE, curls a loop-de-loop and traces ONE continuous
// neon line (arc-length parametrised spline + parametric heart curve) around CURSOR, whose pupils track the spark.
// On "me" the heart closes, fills and pulses; mini hearts burst out.
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, hash, heart, wobble } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { drawMascot, pose } from '../../core/mascot.js';
import { skyBG, neon, spark, popText } from './_g3.js';

const S = shot('P04');
const T0 = S.start, T_CLOSE = 37.1;
const HC = { x: 960, y: 548 }, HK = 21.5; // heart centre / scale

// ---- build the path once: entry curl (Catmull-Rom) + heart (u: π → 3π) ----
let PATH = null;
function buildPath() {
  const pts = [];
  const ctrl = [[120, 540], [300, 640], [470, 800], [585, 735], [545, 640], [455, 700], [520, 845], [730, 900], [HC.x, HC.y + 17 * HK]];
  for (let i = 0; i < ctrl.length - 1; i++) {
    const p0 = ctrl[Math.max(0, i - 1)], p1 = ctrl[i], p2 = ctrl[i + 1], p3 = ctrl[Math.min(ctrl.length - 1, i + 2)];
    for (let k = 0; k < 24; k++) {
      const u = k / 24, u2 = u * u, u3 = u2 * u;
      const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u2 + (-a + 3 * b - 3 * c + d) * u3);
      pts.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  const entryN = pts.length;
  for (let k = 0; k <= 360; k++) {
    const u = Math.PI + (k / 360) * TAU;
    const x = 16 * Math.sin(u) ** 3, y = -(13 * Math.cos(u) - 5 * Math.cos(2 * u) - 2 * Math.cos(3 * u) - Math.cos(4 * u));
    pts.push([HC.x + x * HK, HC.y + y * HK]);
  }
  const L = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  PATH = { pts, L, total: L[L.length - 1], entryLen: L[entryN] };
  return PATH;
}
function at(P, d) { // point at arc length d
  d = clamp(d, 0, P.total);
  let lo = 0, hi = P.L.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (P.L[m] <= d) lo = m; else hi = m; }
  const k = (d - P.L[lo]) / Math.max(1e-6, P.L[hi] - P.L[lo]);
  return [lerp(P.pts[lo][0], P.pts[hi][0], k), lerp(P.pts[lo][1], P.pts[hi][1], k), lo];
}
// progress (0..1) of the spark along the whole path
function prog(t) {
  const u = clamp((t - (T0 - 0.08)) / (T_CLOSE - T0 + 0.08));
  return lerp(u, ease.inOutCubic(u), 0.55);
}

export default {
  ...S,
  cutIn: 'punch',
  sfx: [{ t: 36.2, type: 'zap', gain: 0.6 }, { t: T_CLOSE + 0.05, type: 'ding', gain: 0.9 }],
  draw(ctx, t, s, E) {
    const P = PATH || buildPath();
    const lt = s.lt;
    const closeAge = t - T_CLOSE;
    const bp = A.pulse('beat', t, 0.12);
    // camera: slow push + tilt, pulse on close
    const push = 1.0 + lt * 0.05 + (closeAge > 0 ? 0.05 * wobble(closeAge, 3, 5) : 0);
    ctx.save();
    ctx.translate(W / 2, H / 2); ctx.scale(push, push); ctx.rotate(Math.sin(lt * 2) * 0.008); ctx.translate(-W / 2, -H / 2);
    skyBG(ctx, t, { sunX: 1560, sunY: 250, drift: lt * 260 });

    // ---- words ----
    const wpop = (tw) => ease.outBack(clamp((t - tw) / 0.22), 2.2);
    const jw = wpop(36.1), cw = wpop(36.5), aw = wpop(36.72), mw = wpop(36.86);
    ctx.save(); ctx.translate(330, 470); ctx.rotate(-0.06);
    if (jw > 0) { ctx.save(); ctx.scale(jw, jw); popText(ctx, 'just', -120, -138, 96, { family: 'Instrument Serif', weight: '400', fill: '#FFFFFF', shadow: '#1F2A55', off: 6 }); ctx.restore(); }
    if (cw > 0) { ctx.save(); ctx.scale(cw, cw); popText(ctx, 'CLAUDE', 0, 0, 150, { fill: '#FFFFFF', shadow: '#1F2A55', off: 10, stroke: '#1F2A55', sw: 8 }); ctx.restore(); }
    ctx.restore();
    ctx.save(); ctx.translate(1600, 470); ctx.rotate(0.05);
    if (aw > 0) { ctx.save(); ctx.scale(aw, aw); popText(ctx, '&', -175, -30, 130, { family: 'Instrument Serif', weight: '400', fill: '#FF2D6F', shadow: '#1F2A55', off: 6 }); ctx.restore(); }
    if (mw > 0) { const k = mw * (1 + (closeAge > 0 ? 0.25 * wobble(closeAge, 4, 6) : 0)); ctx.save(); ctx.scale(k, k); popText(ctx, 'ME', 40, 30, 210, { fill: '#FFFFFF', shadow: '#1F2A55', off: 12, stroke: '#1F2A55', sw: 9 }); ctx.restore(); }
    ctx.restore();

    // ---- spark position ----
    const pr = prog(t), d = pr * P.total;
    const [sx, sy] = at(P, d);
    // ---- heart fill on close ----
    if (closeAge > 0) {
      const k = ease.outExpo(closeAge / 0.25), pul = 1 + 0.1 * wobble(closeAge, 3.2, 3.5);
      ctx.save(); ctx.translate(HC.x, HC.y); ctx.scale(pul, pul); ctx.translate(-HC.x, -HC.y);
      ctx.beginPath(); P.pts.slice(P.pts.length - 361).forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath();
      const g = ctx.createRadialGradient(HC.x, HC.y + 60, 30, HC.x, HC.y, 520);
      g.addColorStop(0, `rgba(255,255,255,${0.55 * k})`); g.addColorStop(0.55, `rgba(255,120,170,${0.45 * k})`); g.addColorStop(1, `rgba(255,45,111,${0.55 * k})`);
      ctx.fillStyle = g; ctx.fill();
      ctx.restore();
    }

    // ---- CURSOR (pupils track the spark) ----
    const Pz = pose('heart', t);
    const hx = 960, hy = 872 - 185 * 1.28 - 48 * 1.28;
    Pz.look = [clamp((sx - hx) / 320, -1, 1), clamp((sy - hy) / 260, -1, 1)];
    if (closeAge > 0) Pz.squash += 0.12 * wobble(closeAge, 4, 6);
    drawMascot(ctx, { x: 960, y: 872 - 26 * bp, s: 1.24, t, P: Pz, mouth: 'auto', eyes: closeAge > 0.02 ? 'heart' : 'normal', sticker: true });

    // ---- the ONE neon line ----
    const lineW = 16 + 6 * bp + (closeAge > 0 ? 8 * Math.exp(-closeAge * 6) : 0);
    const drawLine = (from, to, alphaScale) => {
      const [, , i0] = at(P, from), [ex, ey, i1] = at(P, to);
      ctx.beginPath(); ctx.moveTo(...at(P, from).slice(0, 2));
      for (let i = i0 + 1; i <= i1; i++) ctx.lineTo(P.pts[i][0], P.pts[i][1]);
      ctx.lineTo(ex, ey);
      neon(ctx, '#FF2D6F', lineW, alphaScale);
    };
    const pulseHeart = closeAge > 0 ? 1 + 0.1 * wobble(closeAge, 3.2, 3.5) : 1;
    ctx.save();
    if (closeAge > 0) { ctx.translate(HC.x, HC.y); ctx.scale(pulseHeart, pulseHeart); ctx.translate(-HC.x, -HC.y); }
    // entry curl fades once the heart is underway
    const entryFade = 1 - clamp((d - P.entryLen - 900) / 800);
    ctx.globalAlpha = entryFade;
    if (d > 0) drawLine(0, Math.min(d, P.entryLen), 1);
    ctx.globalAlpha = 1;
    if (d > P.entryLen) drawLine(P.entryLen, d, 1);
    ctx.restore();

    // ---- sparkles shed by the spark ----
    for (let k = 0; k < 46; k++) {
      const te = t - k * 0.014; if (te < T0 - 0.1) break;
      const age = t - te; if (age > 0.6) continue;
      const [px, py] = at(P, prog(te) * P.total);
      const vx = (hash(k + Math.floor(te * 70), 3) - 0.5) * 420, vy = (hash(k + Math.floor(te * 70), 4) - 0.8) * 380;
      const x = px + vx * age, y = py + vy * age + 900 * age * age;
      const r = (1 - age / 0.6) * (5 + hash(k, 7) * 7);
      ctx.fillStyle = k % 3 ? '#FFFFFF' : '#FFE14D';
      ctx.beginPath(); ctx.moveTo(x, y - r * 1.8); ctx.lineTo(x + r * 0.45, y); ctx.lineTo(x, y + r * 1.8); ctx.lineTo(x - r * 0.45, y); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x - r * 1.8, y); ctx.lineTo(x, y + r * 0.45); ctx.lineTo(x + r * 1.8, y); ctx.lineTo(x, y - r * 0.45); ctx.closePath(); ctx.fill();
    }
    // ---- the spark itself ----
    if (closeAge < 0.15) spark(ctx, sx, sy, 30 + 6 * bp, t * 9, '#FF6A1F');

    // ---- burst of mini hearts on "me" ----
    if (closeAge > 0) {
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * TAU + 0.2, k = ease.outExpo(closeAge / 0.4);
        const r = 380 + 220 * k + hash(i, 2) * 80;
        const x = HC.x + Math.cos(a) * r * 1.15, y = HC.y + Math.sin(a) * r * 0.82 - 60 * closeAge;
        const sz = (18 + hash(i, 5) * 20) * (1 - clamp((closeAge - 0.12) / 0.3) * 0.3);
        heart(ctx, x, y, sz); ctx.fillStyle = i % 2 ? '#FF2D6F' : '#FFFFFF'; ctx.fill();
        ctx.lineWidth = 4; ctx.strokeStyle = '#1F2A55'; ctx.stroke();
      }
    }
    ctx.restore();

    E.fx.bloom = 0.35 + (closeAge > 0 ? 0.6 * Math.exp(-closeAge * 5) : 0); E.fx.bloomThreshold = 0.8;
    if (closeAge > 0) { E.fx.zoom = 0.04 * Math.exp(-closeAge * 8); E.fx.flash = [1, 0.9, 0.95, 0.35 * Math.exp(-closeAge * 10)]; E.fx.rgb = 5 * Math.exp(-closeAge * 8); }
    E.fx.vignette = 0.12;
  },
};
