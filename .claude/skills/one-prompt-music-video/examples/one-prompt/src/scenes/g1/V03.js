// V03 — "let it ride" — a Great-Wave print made of code. The wave is a logarithmic-spiral band whose
// rows of glyphs stream up the back and over the lip (each glyph rides its own row parameter); the sea
// below is a stack of Gerstner trochoids made of characters. CURSOR surfs the barrel on an orange
// board, glyph spray flies off the lip, and RIDE slams into the tube in front of a red sun.
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, rng, hash, font, wobble } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { drawMascot, pose } from '../../core/mascot.js';
import { P1, paper, printType, paperTex } from './util.js';

const S = shot('V03');
const GLYPHS = '{}();=><[]/+*-_$#&%01λ'.split('').concat(['=>', '&&', '||', '//']);
const COLS = ['#FFFBF4', '#B9C8F0', '#FF8A3D', '#FFFFFF', '#7F95D6'];
let ATL = null;

function atlas() {
  if (ATL) return ATL;
  const cs = 64, c = document.createElement('canvas'); c.width = cs * GLYPHS.length; c.height = cs * (COLS.length + 1);
  const x = c.getContext('2d'); x.textAlign = 'center'; x.textBaseline = 'middle';
  [...COLS, P1.ink].forEach((col, j) => GLYPHS.forEach((g, i) => {
    x.font = `800 ${g.length > 1 ? 34 : 50}px "JetBrains Mono"`; x.fillStyle = col; x.fillText(g, i * cs + cs / 2, j * cs + cs / 2 + 2);
  }));
  ATL = { c, cs };
  return ATL;
}
function glyph(ctx, gi, ci, x, y, size, rot, alpha = 1) {
  const { c, cs } = ATL;
  const k = size / cs;
  ctx.setTransform(Math.cos(rot) * k, Math.sin(rot) * k, -Math.sin(rot) * k, Math.cos(rot) * k, x, y);
  ctx.globalAlpha = alpha;
  ctx.drawImage(c, gi * cs, ci * cs, cs, cs, -cs / 2, -cs / 2, cs, cs);
}

export default {
  ...S,
  cutIn: 'glitch',
  sfx: [{ t: 11.64, type: 'whoosh', gain: 0.8 }, { t: 12.04, type: 'swoosh' }],
  init() { paperTex(P1.paper, W, H, 5); atlas(); },
  draw(ctx, t, s, E) {
    atlas();
    const lt = s.lt, u = s.u;
    const kick = A.pulse('snare', t, 0.12);
    // camera: slow push + drift
    // start tight on the surfer in the barrel, pull out to reveal the whole wave on "ride"
    const rev = ease.outExpo(clamp((t - 11.98) / 0.35));
    const zoom = lerp(1.55 + lt * 0.12, 1.0, rev) + kick * 0.01;
    const camX = lerp(-140, 0, rev) + lerp(30, -40, u), camY = lerp(-170, 0, rev);

    paper(ctx, P1.paper, -lt * 200, 0, 5);
    ctx.save();
    ctx.translate(W / 2, H / 2); ctx.scale(zoom, zoom); ctx.translate(-W / 2 + camX, -H / 2 + camY);

    // ---------- spiral wave definition ----------
    const C = [920, 650], R0 = 700, RX = 1.32, B = 0.2;
    const phEnd = lerp(4.05, 4.55, ease.outQuad(u)); // the lip throws forward
    const swell = 1 + 0.03 * Math.sin(lt * 7);
    const th0 = Math.PI + 0.5;
    const thick = (ph) => lerp(0.5, 0.2, clamp(ph / 4.4)) * (1 - 0.6 * clamp((ph - phEnd + 0.5) / 0.5));
    const pt = (ph, f) => { // f: 0 outer edge … 1 inner edge
      const r = R0 * Math.exp(-B * ph) * swell * (1 - thick(ph) * f), th = th0 - ph;
      const back = (1 - clamp(ph / 2.2)) ** 2 * (520 + 140 * (1 - f)); // long sloping back of the wave
      return [C[0] - RX * r * Math.cos(th) + back, C[1] - r * Math.sin(th) + back * 0.12];
    };

    // red sun in the barrel
    const sunK = ease.outBack(clamp((t - 11.98) / 0.2));
    ctx.fillStyle = P1.red; ctx.beginPath(); ctx.arc(1000, 470, 150 + 40 * sunK + kick * 10, 0, TAU); ctx.fill();

    // ---------- sea: Gerstner trochoid rows of glyphs ----------
    const seaY = 880;
    ctx.fillStyle = P1.ink; ctx.fillRect(-200, seaY - 10, W + 400, H);
    for (let row = 0; row < 11; row++) {
      const depth = row * 24, A0 = 22 * Math.exp(-row * 0.2), k = 0.011, w = 6;
      const sz = 44 - row * 2;
      for (let i = -4; i < 90; i++) {
        const x0 = i * 26 + ((lt * 140 * (1 + row * 0.1)) % 26) - 100;
        const ph = k * x0 - w * lt + row;
        const x = x0 - Math.sin(ph) * A0 * 0.9, y = seaY + depth - Math.cos(ph) * A0;
        const gi = Math.floor(hash(i + 100, row) * GLYPHS.length);
        glyph(ctx, gi, row === 0 ? 3 : row % 2 ? 4 : 1, x, y, sz, Math.atan2(-Math.sin(ph) * A0 * k, 1), 0.95 - row * 0.06);
      }
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
    ctx.translate(W / 2, H / 2); ctx.scale(zoom, zoom); ctx.translate(-W / 2 + camX, -H / 2 + camY);

    // ---------- the band (navy body) ----------
    ctx.beginPath();
    const st = 0.04;
    ctx.moveTo(W + 400, H + 200);
    for (let ph = -0.8; ph <= phEnd; ph += st) { const p = pt(ph, 0); ctx.lineTo(p[0], p[1]); }
    for (let ph = phEnd; ph >= -0.8; ph -= st) { const p = pt(ph, 1); ctx.lineTo(p[0], p[1]); }
    ctx.lineTo(pt(-0.8, 1)[0], H + 200);
    ctx.closePath();
    ctx.fillStyle = P1.ink; ctx.fill();
    ctx.lineWidth = 10; ctx.strokeStyle = P1.cream; ctx.lineJoin = 'round'; ctx.stroke();

    // ---------- glyph rows streaming along the band ----------
    const NR = 7;
    for (let j = 0; j < NR; j++) {
      const f = (j + 0.5) / NR;
      const flow = 1.3 + j * 0.08;
      const n = 96;
      for (let i = 0; i < n; i++) {
        let ph = ((i / n) * 5.6 + lt * flow * 0.35 + hash(i, j) * 0.02) % 5.6 - 0.9;
        if (ph > phEnd - 0.02) continue;
        const p = pt(ph, f), q = pt(ph + 0.01, f);
        const r = R0 * Math.exp(-B * ph);
        const size = clamp(r * thick(ph) / NR * 1.55, 14, 60);
        const rot = Math.atan2(q[1] - p[1], q[0] - p[0]);
        const ci = j === 0 ? 3 : j === 1 ? 2 : j === NR - 1 ? 0 : j % 2 ? 1 : 4;
        const gi = Math.floor(hash(i * 7 + Math.floor(lt * 6 + i) , j) * GLYPHS.length);
        glyph(ctx, gi, ci, p[0], p[1], size, rot, 1);
      }
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
    ctx.translate(W / 2, H / 2); ctx.scale(zoom, zoom); ctx.translate(-W / 2 + camX, -H / 2 + camY);

    // ---------- Hokusai foam claws along the lip ----------
    for (let c = 0; c < 9; c++) {
      const ph = phEnd - 0.05 - c * 0.14;
      if (ph < 2.3) break;
      const b0 = pt(ph, 0), b1 = pt(ph + 0.02, 0);
      const tang = Math.atan2(b1[1] - b0[1], b1[0] - b0[0]);
      const len = (150 - c * 9) * (0.9 + 0.2 * Math.sin(lt * 9 + c));
      let a = tang - 1.3, x = b0[0], y = b0[1];
      for (let k = 0; k < 6; k++) {
        const rr = (30 - k * 4.4) * (1 - c * 0.05);
        x += Math.cos(a) * len * 0.22; y += Math.sin(a) * len * 0.22; a += 0.42 + Math.sin(lt * 6 + c) * 0.05;
        ctx.beginPath(); ctx.arc(x, y, rr, 0, TAU); ctx.fillStyle = P1.cream; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = P1.ink; ctx.stroke();
      }
    }

    // ---------- foam claws at the lip + spray ----------
    const tip = pt(phEnd, 0.5), tipN = pt(phEnd - 0.05, 0.5);
    const tdir = Math.atan2(tip[1] - tipN[1], tip[0] - tipN[0]);
    const r = rng(9);
    for (let i = 0; i < 260; i++) {
      const born = r() * 1.2 - 0.4, age = lt - born;
      if (age < 0 || age > 0.9) continue;
      const src = r() < 0.6 ? pt(phEnd - r() * 1.6, r() * 0.25) : tip;
      const a = tdir + (r() - 0.5) * 1.6 - 0.3, sp = 300 + r() * 700;
      const x = src[0] + Math.cos(a) * sp * age, y = src[1] + Math.sin(a) * sp * age - 260 * age + 900 * age * age;
      glyph(ctx, Math.floor(r() * GLYPHS.length), r() < 0.6 ? 5 : 2, x, y, 24 + r() * 30, r() * TAU + age * 6, clamp(1 - age / 0.9));
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
    ctx.translate(W / 2, H / 2); ctx.scale(zoom, zoom); ctx.translate(-W / 2 + camX, -H / 2 + camY);

    // ---------- type in the barrel ----------
    const words = [{ w: 'LET', t: 11.62, x: 820, y: 470, s: 120 }, { w: 'IT', t: 11.84, x: 1110, y: 470, s: 120 }];
    if (t < 12.02) for (const wd of words) {
      if (t < wd.t) continue;
      const k = ease.outBack(clamp((t - wd.t) / 0.1), 2.4);
      ctx.save(); ctx.translate(wd.x, wd.y); ctx.scale(k, k); ctx.rotate(-0.05);
      printType(ctx, wd.w, 0, 0, wd.s, { fill: P1.cream, shadow: P1.ink, off: 0.06 }); ctx.restore();
    }
    if (t >= 12.02) {
      const d = t - 12.02, k = ease.outExpo(clamp(d / 0.16));
      ctx.save(); ctx.translate(985, 480); ctx.rotate(-0.07); const sc = lerp(2.2, 1, k) * (1 + wobble(d, 4, 7) * 0.03); ctx.scale(sc, sc);
      printType(ctx, 'RIDE', 0, 0, 300, { fill: P1.cream, shadow: P1.ink, off: 0.05, stroke: P1.ink, strokeW: 12 });
      ctx.restore();
    }

    // ---------- CURSOR surfing the barrel ----------
    const carve = Math.sin(lt * 7.5);
    const sx = 1150 - lt * 120 + carve * 40, sy = 850 - Math.abs(Math.cos(lt * 7.5)) * 30;
    const brot = -0.12 + carve * 0.12;
    // board wake
    ctx.save(); ctx.translate(sx, sy); ctx.rotate(brot);
    ctx.fillStyle = 'rgba(255,251,244,0.85)';
    for (let i = 0; i < 26; i++) { const a = i / 26; ctx.globalAlpha = 0.7 * (1 - a); ctx.beginPath(); ctx.arc(130 + a * 300, 18 - Math.sin(a * 6 + lt * 20) * 10 * a, 16 * (1 - a) + 4, 0, TAU); ctx.fill(); }
    ctx.globalAlpha = 1;
    // surfboard
    ctx.beginPath(); ctx.ellipse(0, 6, 210, 30, 0, 0, TAU);
    ctx.fillStyle = P1.ink; ctx.save(); ctx.translate(6, 10); ctx.fill(); ctx.restore();
    ctx.beginPath(); ctx.ellipse(0, 0, 210, 30, 0, 0, TAU); ctx.fillStyle = P1.orange; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = P1.ink; ctx.stroke();
    ctx.fillStyle = P1.cream; ctx.fillRect(-190, -4, 380, 8);
    font(ctx, 26, 'JetBrains Mono', '800'); ctx.fillStyle = P1.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('>_', 120, 1);
    ctx.restore();
    const P = pose('surf', t);
    drawMascot(ctx, { x: sx + Math.sin(brot) * 10, y: sy - 8, s: 0.78, t, P, rot: brot * 0.8 - 0.06, mouth: 'auto', eyes: t > 12.02 ? 'star' : 'normal', look: [-0.8, -0.2], sticker: true });
    ctx.restore();

    E.fx.zoom += kick * 0.01;
    if (t >= 12.02 && t < 12.12) { E.fx.shake = 14 * (1 - (t - 12.02) / 0.1); E.fx.rgb = 6; }
  },
};
