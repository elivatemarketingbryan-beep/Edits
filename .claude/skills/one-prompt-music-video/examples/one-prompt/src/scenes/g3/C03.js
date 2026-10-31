// C03 — "Opus five point five, yeah," — Spectrum halo.
// Close-up CURSOR singing into a mic (lip-sync from the vocal stem). Around its head: a 128-bar radial visualiser
// of the REAL vocal spectrum (A.vspec, mirrored, temporally smoothed), a dotted ring of the mix spectrum, a dial
// ring and a rotating text ring "OPUS 5.5 ✦". Big word-synced type: OPUS (41.15) · 5 · . · 5 on the snares.
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, hash, wobble, roundRect } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { drawMascot } from '../../core/mascot.js';
import { popText, confetti } from './_g3.js';

const S = shot('C03');
const T_OPUS = 41.15, T_5A = 41.59, T_DOT = 41.89, T_5B = 41.95, T_DOWN = 42.067;
const SC = 1.82;

function bandOf(k, n) { // bar k of n/2 → spectrum band (log-ish, low bands at the top)
  const u = k / (n / 2 - 1);
  return Math.min(A.nb - 1, Math.floor(2 + u * (A.nb - 6)));
}
const vs = (t, b) => (A.vspec(t, b) * 0.6 + A.vspec(t - 1 / 30, b) * 0.3 + A.vspec(t - 2 / 30, b) * 0.1);

export default {
  ...S,
  cutIn: 'punch',
  sfx: [{ t: T_OPUS, type: 'impact', gain: 0.8 }, { t: T_5A, type: 'stamp', gain: 0.6 }, { t: T_5B, type: 'stamp', gain: 0.7 }],
  draw(ctx, t, s, E) {
    const lt = s.lt;
    const kick = A.pulse('kick', t, 0.12), snare = A.pulse('snare', t, 0.09), voc = A.env('vocal', t);
    const kD = t >= T_DOWN ? Math.exp(-(t - T_DOWN) / 0.12) : 0;

    // camera
    const push = 1 + lt * 0.07 + 0.03 * kick;
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(push, push); ctx.rotate(Math.sin(lt * 1.6) * 0.015 - lt * 0.012); ctx.translate(-W / 2, -H / 2);

    // ---------- background ----------
    const hx = W / 2 + Math.sin(lt * 1.3) * 14, hy = 535;
    const g = ctx.createRadialGradient(hx, hy, 40, hx, hy, 1250);
    g.addColorStop(0, '#FF6FB0'); g.addColorStop(0.35, '#D02FC0'); g.addColorStop(0.75, '#6A1DD8'); g.addColorStop(1, '#3A0F8F');
    ctx.fillStyle = g; ctx.fillRect(-200, -200, W + 400, H + 400);
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(lt * 0.25); ctx.fillStyle = 'rgba(255,255,255,0.07)';
    for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 2200, a, a + TAU / 32); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    // drifting sparkles
    for (let i = 0; i < 40; i++) {
      const a = hash(i, 3) * TAU + lt * (0.2 + hash(i, 4) * 0.4), r = 380 + hash(i, 5) * 700 + lt * 60;
      const x = hx + Math.cos(a) * r * 1.4, y = hy + Math.sin(a) * r * 0.8, sz = 3 + hash(i, 6) * 7 * (0.6 + snare);
      ctx.fillStyle = i % 3 ? 'rgba(255,255,255,0.8)' : '#FFE14D';
      ctx.beginPath(); ctx.moveTo(x, y - sz * 2); ctx.lineTo(x + sz * 0.5, y); ctx.lineTo(x, y + sz * 2); ctx.lineTo(x - sz * 0.5, y); ctx.closePath(); ctx.fill();
    }

    // ---------- halo glow ----------
    const gl = ctx.createRadialGradient(hx, hy, 60, hx, hy, 520);
    gl.addColorStop(0, `rgba(255,240,170,${0.75 + 0.25 * voc})`); gl.addColorStop(0.5, 'rgba(255,170,90,0.35)'); gl.addColorStop(1, 'rgba(255,120,120,0)');
    ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(hx, hy, 520, 0, TAU); ctx.fill();

    // ---------- radial spectrum: 128 bars ----------
    const N = 128, r0 = 330 + 14 * kick, rot = lt * 0.35 + 0.25 * ease.outExpo(clamp((t - T_5A) / 0.3)) + 0.25 * ease.outExpo(clamp((t - T_5B) / 0.3));
    ctx.lineCap = 'round';
    for (let k = 0; k < N; k++) {
      const half = k < N / 2 ? k : N - 1 - k;
      const b = bandOf(half, N);
      const v = clamp(vs(t, b) * 0.85 + A.spec(t, b) * 0.35);
      const len = 16 + v * v * 270 + 30 * kD;
      const a = rot - Math.PI / 2 + (k / N) * TAU;
      const c = Math.cos(a), sn = Math.sin(a);
      const col = v > 0.72 ? '#FFFFFF' : v > 0.5 ? '#FFE14D' : v > 0.3 ? '#FFB13D' : '#FF7A1A';
      ctx.strokeStyle = col; ctx.lineWidth = 11;
      ctx.beginPath(); ctx.moveTo(hx + c * r0, hy + sn * r0); ctx.lineTo(hx + c * (r0 + len), hy + sn * (r0 + len)); ctx.stroke();
    }
    // inner ring
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(hx, hy, r0 - 16, 0, TAU); ctx.stroke();
    // dial ring with ticks, counter-rotating
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(-lt * 0.6);
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 790, 0, TAU); ctx.stroke();
    for (let i = 0; i < 96; i++) { const a = (i / 96) * TAU, L = i % 8 === 0 ? 26 : 10; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 790, Math.sin(a) * 790); ctx.lineTo(Math.cos(a) * (790 - L), Math.sin(a) * (790 - L)); ctx.stroke(); }
    ctx.restore();
    // mix-spectrum dots ring
    for (let k = 0; k < 64; k++) {
      const half = k < 32 ? k : 63 - k, v = A.spec(t, Math.min(31, 1 + half));
      const a = -lt * 0.5 + (k / 64) * TAU, rr = 735 + v * 40;
      ctx.fillStyle = v > 0.6 ? '#FFE14D' : '#FFFFFF';
      ctx.beginPath(); ctx.arc(hx + Math.cos(a) * rr, hy + Math.sin(a) * rr, 4 + v * 9, 0, TAU); ctx.fill();
    }

    // ---------- text ring "OPUS 5.5 ✦" ----------
    {
      const R = 655, str = 'OPUS 5.5 ✦ OPUS 5.5 ✦ OPUS 5.5 ✦ OPUS 5.5 ✦ ';
      ctx.save(); ctx.translate(hx, hy); ctx.rotate(-lt * 0.9 - 0.4);
      ctx.font = '400 50px "Rubik Mono One"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const ws = [...str].map((ch) => ctx.measureText(ch).width + 4), tot = ws.reduce((a, b) => a + b, 0);
      const scaleA = TAU / tot;
      let acc = 0;
      for (let i = 0; i < str.length; i++) {
        const a = (acc + ws[i] / 2) * scaleA; acc += ws[i];
        ctx.save(); ctx.rotate(a); ctx.translate(0, -R);
        ctx.lineWidth = 8; ctx.strokeStyle = '#3A0F8F'; ctx.strokeText(str[i], 0, 0);
        ctx.fillStyle = str[i] === '✦' ? '#FFE14D' : '#FFFFFF'; ctx.fillText(str[i], 0, 0);
        ctx.restore();
      }
      ctx.restore();
    }

    confetti(ctx, t - T_DOWN, { x: hx, y: hy, n: 90, seed: 31, speed: 2100, size: 1.4, life: 0.6 });
    // ---------- CURSOR singing (close-up) ----------
    const feetY = hy + 185 * SC + 10;
    drawMascot(ctx, {
      x: hx, y: feetY + 18 * kick, s: SC, t, pose: 'sing', mouth: 'auto', sticker: true, squash: 0.05 * kick - 0.04 * kD,
      eyes: t > 42.15 ? 'happy' : 'normal', look: [0, -0.35],
      over: (c, P) => { // microphone in the right hand
        c.save(); c.translate(P.armR[0] - 22, P.armR[1] - 10); c.rotate(-0.5);
        c.fillStyle = '#1F2A55'; roundRect(c, -11, 0, 22, 74, 8); c.fill();
        c.beginPath(); c.arc(0, -8, 24, 0, TAU); c.fillStyle = '#C9CFE0'; c.fill(); c.lineWidth = 6; c.strokeStyle = '#1F2A55'; c.stroke();
        c.strokeStyle = 'rgba(31,42,85,0.5)'; c.lineWidth = 3; for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(-18, -8 + i * 9); c.lineTo(18, -8 + i * 9); c.stroke(); }
        c.restore();
      },
    });
    ctx.restore();

    // ---------- big word-synced type ----------
    const pop = (tw, d = 0.16) => ease.outBack(clamp((t - tw) / d), 2.6);
    const po = pop(T_OPUS - 0.02);
    if (po > 0) {
      ctx.save(); ctx.translate(380, 300); ctx.rotate(-0.12); ctx.scale(po, po);
      popText(ctx, 'OPUS', 0, 0, 250, { fill: '#FFFFFF', shadow: '#3A0F8F', off: 14, stroke: '#3A0F8F', sw: 10 });
      ctx.restore();
    }
    const parts = [['5', T_5A, -150], ['.', T_DOT, -30], ['5', T_5B, 90]];
    ctx.save(); ctx.translate(1530, 790); ctx.rotate(-0.08);
    for (const [ch, tw, dx] of parts) {
      const p = pop(tw - 0.01, 0.12); if (p <= 0) continue;
      ctx.save(); ctx.translate(dx, 0); ctx.scale(p * (1 + 0.15 * kD), p * (1 + 0.15 * kD));
      popText(ctx, ch, 0, 0, 330, { fill: '#FFE14D', shadow: '#3A0F8F', off: 16, stroke: '#3A0F8F', sw: 12 });
      ctx.restore();
    }
    ctx.restore();

    const kO = t >= T_OPUS ? Math.exp(-(t - T_OPUS) / 0.1) : 0;
    E.fx.shake = 18 * kO + 10 * snare + 24 * kD; E.fx.zoom = 0.03 * kO + 0.02 * snare + 0.04 * kD; E.fx.rgb = 4 + 8 * kO + 6 * kD;
    E.fx.bloom = 0.45 + 0.3 * voc; E.fx.bloomThreshold = 0.8; E.fx.vignette = 0.25; E.fx.saturation = 1.08;
  },
};
