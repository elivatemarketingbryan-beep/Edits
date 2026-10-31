// V11 · "Easing in, easing out," — a graph-paper easing editor. A cubic-bézier draws itself and its handles
// spring from ease-in to ease-out; six balls race the SAME duration on lanes, each driven by its REAL easing
// function (linear / inCubic / outCubic / outBack / outElastic / outBounce). Strobe ghosts at equal time steps
// leave an animator's spacing chart; balls squash & stretch with their true velocity.
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, spring, wobble, font, roundRect } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { PS, paperBG, gridLines, cam, shadowText } from './_g2.js';

const S = shot('V11');
const R0 = 21.97, R1 = 22.80;                       // race window (finish on the kick 22.82)
const LANES = [
  { name: 'linear', f: ease.linear, c: PS.ink },
  { name: 'ease-in', f: ease.inCubic, c: PS.blue },
  { name: 'ease-out', f: ease.outCubic, c: PS.teal },
  { name: 'back', f: (p) => ease.outBack(p, 2.2), c: PS.mustard },
  { name: 'elastic', f: ease.outElastic, c: PS.orange },
  { name: 'bounce', f: ease.outBounce, c: PS.red },
];
const LX0 = 900, LX1 = 1690, LY0 = 392, LDY = 92;     // lanes
const GX = 132, GY = 392, GS = 410;                   // bézier panel
// first time each lane reaches the finish (sampled once)
const FIRST = LANES.map((L) => { for (let i = 0; i <= 400; i++) if (L.f(i / 400) >= 0.999) return i / 400; return 1; });

function bez(p1, p2, u) { // cubic bézier point for parameter u (P0=(0,0), P3=(1,1))
  const a = 3 * (1 - u) * (1 - u) * u, b = 3 * (1 - u) * u * u, c = u * u * u;
  return [a * p1[0] + b * p2[0] + c, a * p1[1] + b * p2[1] + c];
}
function bezY(p1, p2, x) { let lo = 0, hi = 1; for (let i = 0; i < 22; i++) { const m = (lo + hi) / 2; if (bez(p1, p2, m)[0] < x) lo = m; else hi = m; } return bez(p1, p2, (lo + hi) / 2)[1]; }

/** per-letter eased type: letters fly in from dx with the given easing, staggered */
function easedWord(ctx, str, x, y, size, t, t0, dx, fn, fill, shadow, dur = 0.26, stag = 0.022, split = 99, t1 = 0) {
  font(ctx, size, 'Anton'); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  let cx = x;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i], w = ctx.measureText(ch).width;
    const k = i < split ? clamp((t - t0 - i * stag) / dur) : clamp((t - t1 - (i - split) * stag) / dur);
    if (k > 0) {
      const e = fn(k), oy = (1 - e) * dx;
      ctx.globalAlpha = clamp(k * 5);
      ctx.fillStyle = shadow; ctx.fillText(ch, cx + 7, y + oy + 7);
      ctx.fillStyle = fill; ctx.fillText(ch, cx, y + oy);
      ctx.globalAlpha = 1;
    }
    cx += w;
  }
  return cx;
}

export default {
  ...S,
  sfx: [{ t: 21.97, type: 'whoosh', gain: 0.5 }, { t: 22.80, type: 'ding', gain: 0.8 }],
  draw(ctx, t, s, E) {
    const lt = s.lt;
    const p = clamp((t - R0) / (R1 - R0));
    const fin = t >= R1 ? t - R1 : -1;
    const cm = ease.inOutCubic(clamp((t - 21.95) / 0.8));
    const zoom = lerp(1.13, 1.0, cm) + (fin >= 0 ? 0.025 * Math.exp(-fin / 0.15) : 0) + Math.exp(-A.since('beat', t) / 0.1) * 0.01;
    ctx.save();
    cam(ctx, lerp(985, 960, cm), lerp(596, 572, cm), zoom, lerp(0.02, -0.004, cm));
    paperBG(ctx, PS.paper, 1, 120);
    gridLines(ctx, 46, 'rgba(31,42,85,0.06)', 1, 0, 0, -120, -120, W + 120, H + 120);

    // ---------- bézier editor panel ----------
    ctx.fillStyle = PS.ink; roundRect(ctx, GX - 30 + 10, GY - 70 + 10, GS + 60, GS + 130, 18); ctx.fill();
    ctx.fillStyle = '#FFFBF4'; roundRect(ctx, GX - 30, GY - 70, GS + 60, GS + 130, 18); ctx.fill();
    ctx.strokeStyle = PS.ink; ctx.lineWidth = 4; ctx.stroke();
    // title bar
    const ein = [0.55, 0.02], ein2 = [1, 0.45], eout = [0, 0.55], eout2 = [0.45, 0.98];
    const mk = spring(Math.max(0, t - 22.44), 3.2, 0.32);   // morph ease-in → ease-out (springy)
    const wig = (i) => Math.sin(t * 13 + i * 2) * 0.018 * (1 - clamp(p));
    const P1 = [lerp(ein[0], eout[0], mk) + wig(1), lerp(ein[1], eout[1], mk) + wig(2)];
    const P2 = [lerp(ein2[0], eout2[0], mk) + wig(3), lerp(ein2[1], eout2[1], mk) + wig(4)];
    font(ctx, 22, 'JetBrains Mono', '800'); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = PS.ink;
    ctx.fillText(`cubic-bezier(${P1[0].toFixed(2)}, ${P1[1].toFixed(2)}, ${P2[0].toFixed(2)}, ${P2[1].toFixed(2)})`, GX - 8, GY - 38);
    // graph area
    const gx = (v) => GX + v * GS, gy = (v) => GY + GS - v * GS;
    ctx.save(); ctx.beginPath(); ctx.rect(GX - 10, GY - 10, GS + 20, GS + 20); ctx.clip();
    gridLines(ctx, GS / 10, 'rgba(61,127,216,0.22)', 1, GX, GY, GX, GY, GX + GS, GY + GS);
    gridLines(ctx, GS / 2, 'rgba(61,127,216,0.4)', 1.5, GX, GY, GX, GY, GX + GS, GY + GS);
    ctx.restore();
    ctx.strokeStyle = PS.ink; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(GX, GY - 6); ctx.lineTo(GX, GY + GS); ctx.lineTo(GX + GS + 6, GY + GS); ctx.stroke();
    font(ctx, 18, 'JetBrains Mono', '700'); ctx.fillStyle = 'rgba(31,42,85,0.7)';
    ctx.textAlign = 'right'; ctx.fillText('time →', GX + GS, GY + GS + 26); ctx.save(); ctx.translate(GX - 16, GY + 4); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'right'; ctx.fillText('value →', 0, 0); ctx.restore();
    // diagonal reference (linear)
    ctx.setLineDash([8, 8]); ctx.strokeStyle = 'rgba(31,42,85,0.3)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(gx(0), gy(0)); ctx.lineTo(gx(1), gy(1)); ctx.stroke(); ctx.setLineDash([]);
    // handles
    const hk = ease.outBack(clamp((t - 21.95) / 0.25), 2.5);
    if (hk > 0) {
      ctx.strokeStyle = PS.red; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(gx(0), gy(0)); ctx.lineTo(lerp(gx(0), gx(P1[0]), hk), lerp(gy(0), gy(P1[1]), hk));
      ctx.moveTo(gx(1), gy(1)); ctx.lineTo(lerp(gx(1), gx(P2[0]), hk), lerp(gy(1), gy(P2[1]), hk)); ctx.stroke();
      for (const [P0, Q] of [[[0, 0], P1], [[1, 1], P2]]) {
        const hx = lerp(gx(P0[0]), gx(Q[0]), hk), hy = lerp(gy(P0[1]), gy(Q[1]), hk);
        ctx.fillStyle = '#FFFBF4'; ctx.beginPath(); ctx.arc(hx, hy, 15, 0, TAU); ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = PS.red; ctx.stroke();
        ctx.fillStyle = PS.red; ctx.beginPath(); ctx.arc(hx, hy, 5, 0, TAU); ctx.fill();
      }
    }
    // the curve draws itself
    const draw = ease.outCubic(clamp((t - 21.92) / 0.22));
    if (draw > 0) {
      ctx.beginPath();
      for (let i = 0; i <= 60 * draw; i++) { const q = bez(P1, P2, i / 60); if (i === 0) ctx.moveTo(gx(q[0]), gy(q[1])); else ctx.lineTo(gx(q[0]), gy(q[1])); }
      ctx.lineWidth = 9; ctx.strokeStyle = PS.ink; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
    }
    ctx.fillStyle = PS.ink; for (const v of [0, 1]) { ctx.beginPath(); ctx.arc(gx(v), gy(v), 9, 0, TAU); ctx.fill(); }
    // playhead dot on the curve
    if (t > R0) {
      const yv = bezY(P1, P2, p);
      ctx.strokeStyle = 'rgba(232,52,63,0.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(gx(p), gy(0)); ctx.lineTo(gx(p), gy(yv)); ctx.lineTo(gx(0), gy(yv)); ctx.stroke();
      ctx.fillStyle = PS.orange; ctx.strokeStyle = PS.ink; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(gx(p), gy(yv), 14, 0, TAU); ctx.fill(); ctx.stroke();
    }

    // ---------- lanes ----------
    // finish line (checkered)
    const fk = fin >= 0 ? Math.exp(-fin / 0.2) : 0;
    for (let r = 0; r < 26; r++) for (let c = 0; c < 2; c++) {
      ctx.fillStyle = (r + c) % 2 ? PS.ink : '#FFFBF4';
      ctx.fillRect(LX1 + 18 + c * 18, LY0 - 52 + r * 21.5, 18, 21.5);
    }
    ctx.strokeStyle = PS.ink; ctx.lineWidth = 3; ctx.strokeRect(LX1 + 18, LY0 - 52, 36, 26 * 21.5);
    font(ctx, 26, 'Anton'); ctx.fillStyle = PS.red; ctx.textAlign = 'center'; ctx.fillText('FINISH', LX1 + 36, LY0 - 78);
    ctx.fillStyle = PS.ink; ctx.fillText('START', LX0, LY0 - 78);
    LANES.forEach((L, i) => {
      const y = LY0 + i * LDY;
      // lane strip
      ctx.fillStyle = i % 2 ? 'rgba(31,42,85,0.05)' : 'rgba(31,42,85,0.1)'; ctx.fillRect(LX0 - 230, y - LDY / 2 + 4, LX1 - LX0 + 300, LDY - 8);
      // label chip
      ctx.fillStyle = L.c; roundRect(ctx, LX0 - 222, y - 22, 176, 44, 10); ctx.fill();
      font(ctx, 23, 'JetBrains Mono', '800'); ctx.fillStyle = L.c === PS.mustard ? PS.ink : '#FFFBF4'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(L.name, LX0 - 134, y + 1);
      // track + spacing ticks
      ctx.strokeStyle = 'rgba(31,42,85,0.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(LX0, y); ctx.lineTo(LX1, y); ctx.stroke();
      const X = (v) => LX0 + (LX1 - LX0) * v;
      // strobe ghosts every 1/16 of the duration
      const NG = 16;
      for (let k = 0; k <= NG; k++) {
        const pk = k / NG; if (pk > p + 1e-6 || t < R0) break;
        const gxp = X(L.f(pk));
        ctx.strokeStyle = L.c; ctx.globalAlpha = 0.85; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(gxp, y + 20); ctx.lineTo(gxp, y + 36); ctx.stroke();
        ctx.globalAlpha = 0.22; ctx.fillStyle = L.c; ctx.beginPath(); ctx.arc(gxp, y, 22, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
      }
      // first touch of the finish → lane flash
      const ft = R0 + FIRST[i] * (R1 - R0), fl = t >= ft ? Math.exp(-(t - ft) / 0.12) : 0;
      if (fl > 0.02) { ctx.fillStyle = `rgba(255,251,244,${fl * 0.9})`; ctx.fillRect(LX1 - 40, y - LDY / 2 + 4, 120, LDY - 8); ctx.strokeStyle = L.c; ctx.lineWidth = 6; ctx.globalAlpha = fl; ctx.beginPath(); ctx.arc(LX1, y, 30 + (1 - fl) * 60, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1; }
      // ball with squash & stretch from the true velocity
      const v = L.f(p), dv = (L.f(clamp(p + 0.01)) - L.f(clamp(p - 0.01))) / 0.02 * (t > R0 && t < R1 ? 1 : 0);
      const bx = X(v), sp = clamp(Math.abs(dv) * 0.16, 0, 0.9);
      const st = 1 + sp, sq = 1 / Math.sqrt(st);
      ctx.save(); ctx.translate(bx, y);
      ctx.fillStyle = 'rgba(31,42,85,0.25)'; ctx.beginPath(); ctx.ellipse(4, 30, 26 * st, 6, 0, 0, TAU); ctx.fill();
      ctx.scale(st, sq);
      ctx.fillStyle = L.c; ctx.beginPath(); ctx.arc(0, 0, 27, 0, TAU); ctx.fill();
      ctx.lineWidth = 4; ctx.strokeStyle = PS.ink; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.ellipse(-8, -10, 9, 6, -0.5, 0, TAU); ctx.fill();
      ctx.restore();
      // value readout
      font(ctx, 17, 'JetBrains Mono', '700'); ctx.fillStyle = 'rgba(31,42,85,0.8)'; ctx.textAlign = 'left';
      ctx.fillText(v.toFixed(2), LX1 + 66, y + 1);
    });

    ctx.restore();
    // ---------- type ----------
    easedWord(ctx, 'EASING IN,', 120, 196, 124, t, 21.9, -120, ease.inExpo, PS.ink, PS.blue, 0.16, 0.022, 7, 22.18);
    const ex = 1800; font(ctx, 124, 'Anton'); const ow = ctx.measureText('EASING OUT,').width;
    easedWord(ctx, 'EASING OUT,', ex - ow, 196, 124, t, 22.44, 150, ease.outExpo, PS.red, PS.ink, 0.28, 0.02, 7, 22.62);
    // "IN" / "OUT" underline flourishes
    if (t > 22.24) { const k = ease.outExpo((t - 22.24) / 0.2); ctx.fillStyle = PS.blue; ctx.fillRect(120 + 318, 262, 150 * k, 10); }
    if (t > 22.64) { const k = ease.outExpo((t - 22.64) / 0.2); ctx.fillStyle = PS.red; ctx.fillRect(ex - 230, 262, 200 * k, 10); }

    if (fin >= 0 && fin < 0.15) { E.fx.shake = 9 * (1 - fin / 0.15); E.fx.rgb = 3 * (1 - fin / 0.15); }
  },
};
