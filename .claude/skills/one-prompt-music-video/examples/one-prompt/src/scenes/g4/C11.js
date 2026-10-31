// C11 — "One prompt, and the whole thing" · Everything at once.
// The maximal moment: palette-swapping sunburst, beat rings, Memphis shapes that tick-rotate on every hit,
// analytic confetti cannons (drag + gravity + 3D flutter), sparkle fountains, falling serpentine streamers,
// a spinning type ring, CURSOR cheering centre stage and ONE PROMPT letters that bounce in a wave on every hit.
// Big moment: downbeat 54.08 — every cannon fires at once, CURSOR clones pop up, the world flips palette.
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, seg, font, hash, star, roundRect, wobble } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { drawMascot } from '../../core/mascot.js';
import { C, RAINBOW12, CANDY, sunburst, cornerDots, sparkle, confetti, popText, chip } from './_util.js';

const S = shot('C11');
const T_ONE = 52.72, T_PROMPT = 53.48, T_BIG = 54.08, T_AND = 54.66;
const SCHEMES = [
  ['#FF5CA0', C.pink, C.yellow], ['#FFC12E', C.orange, C.pink], ['#9A5BFF', C.purple, C.yellow], ['#FFE97A', C.yellow, C.pink],
  ['#FF8A3D', '#FF5A2A', C.cream], ['#FF7AB8', '#FF2D6F', C.mint],
];
const SHAPES = [
  [170, 250, 'tri'], [330, 560, 'circ'], [120, 760, 'squig'], [520, 170, 'plus'], [1750, 230, 'donut'], [1600, 560, 'star'],
  [1800, 760, 'zig'], [1420, 150, 'pill'], [760, 640, 'half'], [1180, 640, 'tri'], [80, 470, 'star'], [1860, 470, 'circ'],
  [640, 820, 'plus'], [1290, 830, 'squig'],
];

function shape(ctx, kind, s, col) {
  ctx.lineWidth = 9; ctx.strokeStyle = C.ink; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const path = () => {
    ctx.beginPath();
    if (kind === 'tri') { ctx.moveTo(0, -s); ctx.lineTo(s * 0.9, s * 0.6); ctx.lineTo(-s * 0.9, s * 0.6); ctx.closePath(); }
    else if (kind === 'circ') ctx.arc(0, 0, s * 0.75, 0, TAU);
    else if (kind === 'donut') { ctx.arc(0, 0, s * 0.8, 0, TAU); ctx.moveTo(s * 0.38, 0); ctx.arc(0, 0, s * 0.38, 0, TAU, true); }
    else if (kind === 'star') star(ctx, 0, 0, s, s * 0.45, 5);
    else if (kind === 'plus') { const a = s * 0.3; ctx.moveTo(-a, -s); ctx.lineTo(a, -s); ctx.lineTo(a, -a); ctx.lineTo(s, -a); ctx.lineTo(s, a); ctx.lineTo(a, a); ctx.lineTo(a, s); ctx.lineTo(-a, s); ctx.lineTo(-a, a); ctx.lineTo(-s, a); ctx.lineTo(-s, -a); ctx.lineTo(-a, -a); ctx.closePath(); }
    else if (kind === 'pill') roundRect(ctx, -s, -s * 0.4, s * 2, s * 0.8, s * 0.4);
    else if (kind === 'half') { ctx.arc(0, s * 0.3, s * 0.85, Math.PI, TAU); ctx.closePath(); }
  };
  if (kind === 'squig' || kind === 'zig') {
    const line = (dx, dy) => { ctx.beginPath(); for (let i = 0; i <= 24; i++) { const x = -s * 1.2 + (i / 24) * s * 2.4; const y = kind === 'zig' ? (i % 4 < 2 ? -1 : 1) * s * 0.3 * ((i % 2) ? 1 : 0.0) + ((Math.floor(i / 2) % 2) ? s * 0.3 : -s * 0.3) : Math.sin(i / 24 * TAU * 1.5) * s * 0.35; i ? ctx.lineTo(x + dx, y + dy) : ctx.moveTo(x + dx, y + dy); } };
    ctx.lineWidth = s * 0.34; ctx.strokeStyle = C.ink; line(6, 8); ctx.stroke();
    line(0, 0); ctx.lineWidth = s * 0.34; ctx.stroke(); ctx.lineWidth = s * 0.2; ctx.strokeStyle = col; line(0, 0); ctx.stroke();
    return;
  }
  ctx.save(); ctx.translate(7, 9); path(); ctx.fillStyle = C.ink; ctx.fill('evenodd'); ctx.restore();
  path(); ctx.fillStyle = col; ctx.fill('evenodd'); ctx.stroke();
}

export default {
  ...S,
  cutIn: 'punch',
  sfx: [{ t: T_ONE, type: 'impact', gain: 0.8 }, { t: T_PROMPT, type: 'impact', gain: 0.8 }, { t: T_BIG, type: 'firework', gain: 1.0 }],
  draw(ctx, t, s, E) {
    const lt = s.lt;
    // hit grid: beats + 8ths + the sung words
    if (!this._hits) {
      const b = A.eventsIn('beat', 52.0, 55.4), h = [T_ONE, T_PROMPT, T_AND, 55.02];
      for (let i = 0; i < b.length - 1; i++) h.push(b[i], (b[i] + b[i + 1]) / 2);
      h.sort((x, y) => x - y);
      this._hits = h.filter((x, i) => x >= 52.6 && (i === 0 || x - h[i - 1] > 0.1));
      this._beats = b;
    }
    const hits = this._hits;
    let hi = -1; for (let i = 0; i < hits.length; i++) if (hits[i] <= t) hi = i;
    const hAge = hi >= 0 ? t - hits[hi] : 9;
    const hp = Math.exp(-hAge / 0.12);
    const bigAge = t - T_BIG, big = bigAge >= 0;
    const beat = A.pulse('beat', t, 0.16);
    const sch = SCHEMES[(Math.max(0, hi) + (big ? 3 : 0)) % SCHEMES.length];

    ctx.save();
    const zoom = 1.02 + hp * 0.035 + (big ? 0.06 * Math.exp(-bigAge / 0.3) : 0);
    const tilt = (hi % 2 ? 1 : -1) * 0.018 * (0.4 + hp);
    ctx.translate(960, 560); ctx.scale(zoom, zoom); ctx.rotate(tilt); ctx.translate(-960, -560);

    // ---------- background ----------
    const rot = lt * 0.5 * (big ? -1.4 : 1) + hi * 0.13;
    sunburst(ctx, 960, 620, 28, rot, sch[0], sch[1]);
    cornerDots(ctx, 'rgba(31,42,85,0.13)', 30, 12, 960, 600, 0.3);
    // beat rings
    for (const b of this._beats) {
      const a = t - b; if (a < 0 || a > 0.9) continue;
      const u = ease.outCubic(a / 0.9);
      ctx.strokeStyle = `rgba(255,251,244,${0.65 * (1 - u)})`; ctx.lineWidth = 34 * (1 - u) + 4;
      ctx.beginPath(); ctx.arc(960, 620, 120 + 1100 * u, 0, TAU); ctx.stroke();
    }
    // ---------- Memphis shapes ----------
    SHAPES.forEach(([x, y, k], i) => {
      const appear = ease.outBack(seg(t, S.start + i * 0.035, S.start + i * 0.035 + 0.22));
      if (appear <= 0) return;
      const tick = (hi + 1) * (Math.PI / 4) * (i % 2 ? 1 : -1);
      const rr = ease.outBack(clamp(hAge / 0.18)) * (Math.PI / 4) * (i % 2 ? 1 : -1);
      const sc = appear * (1 + hp * 0.35 * (i % 3 === hi % 3 ? 1.6 : 0.6));
      ctx.save(); ctx.translate(x + Math.sin(lt * 2 + i) * 14, y + Math.cos(lt * 2.4 + i) * 12 - hp * 18 * ((i + hi) % 2));
      ctx.rotate(tick - Math.PI / 4 * (i % 2 ? 1 : -1) + rr + i); ctx.scale(sc, sc);
      shape(ctx, k, 46 + (i % 3) * 10, CANDY[(i + hi + 6) % CANDY.length]);
      ctx.restore();
    });
    // ---------- spinning type ring ----------
    ctx.save(); ctx.translate(960, 640); ctx.rotate(-lt * 0.9);
    font(ctx, 38, 'Rubik Mono One'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const ring = 'ONE PROMPT ★ ONE PROMPT ★ ONE PROMPT ★ ', R = 400;
    for (let i = 0; i < ring.length; i++) {
      const a = (i / ring.length) * TAU;
      ctx.save(); ctx.rotate(a); ctx.translate(0, -R); ctx.fillStyle = C.ink; ctx.fillText(ring[i], 3, 4); ctx.fillStyle = sch[2] === C.cream ? C.yellow : C.cream; ctx.fillText(ring[i], 0, 0); ctx.restore();
    }
    ctx.restore();

    // ---------- fountains (behind CURSOR) ----------
    for (const [fx, seed] of [[560, 1], [1360, 2]]) {
      ctx.beginPath();
      for (let i = 0; i < 90; i++) {
        const te = S.start - 1.2 + i * 0.0145 + hash(i, seed) * 0.01, a = t - te;
        if (a < 0 || a > 1.25) continue;
        const ang = -Math.PI / 2 + (hash(i, seed, 2) - 0.5) * 0.6 + (fx < 960 ? -0.12 : 0.12);
        const sp = 1350 + hash(i, seed, 3) * 600 * (1 + beat * 0.3);
        const x = fx + Math.cos(ang) * sp * a, y = 980 + Math.sin(ang) * sp * a + 0.5 * 2200 * a * a;
        const r = 6 + 10 * hash(i, seed, 4) * (1 - a / 1.25);
        ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, TAU);
      }
      ctx.fillStyle = C.cream; ctx.fill();
    }

    // ---------- serpentine streamers falling ----------
    for (let i = 0; i < 9; i++) {
      const x0 = (i < 5 ? 90 + i * 150 : 1250 + (i - 5) * 160) + hash(i, 1) * 60, sp = 360 + hash(i, 2) * 260;
      const y0 = -420 + ((lt + hash(i, 3) * 2) * sp) % 1700;
      ctx.strokeStyle = C.ink; ctx.lineWidth = 16; ctx.lineCap = 'round';
      const pathS = (dx, dy) => { ctx.beginPath(); for (let k = 0; k <= 20; k++) { const yy = y0 + k * 16; const xx = x0 + Math.sin(k * 0.55 + lt * 9 + i) * 26; k ? ctx.lineTo(xx + dx, yy + dy) : ctx.moveTo(xx + dx, yy + dy); } };
      pathS(4, 5); ctx.stroke();
      ctx.strokeStyle = RAINBOW12[(i * 3 + hi) % 12]; ctx.lineWidth = 11; pathS(0, 0); ctx.stroke();
    }
    // ---------- ONE PROMPT bouncing letters ----------
    const word = 'ONE PROMPT';
    font(ctx, 236, 'Anton'); ctx.letterSpacing = '0px';
    const widths = [...word].map((ch) => ctx.measureText(ch).width + 8);
    const total = widths.reduce((a, b) => a + b, 0);
    let x = 960 - total / 2;
    [...word].forEach((ch, i) => {
      const w = widths[i];
      const at = i < 3 ? T_ONE + i * 0.05 : T_PROMPT + (i - 4) * 0.04;
      const a = seg(t, at, at + 0.2);
      if (ch !== ' ' && a > 0) {
        const delay = i * 0.025, ha = clamp((hAge - delay) / 0.3);
        const jumpL = hAge > delay ? Math.sin(Math.PI * ha) * 46 * (1 - ha * 0.3) : 0;
        const sc = ease.outBack(a, 2.6) * (1 + (hAge > delay ? wobble(hAge - delay, 4, 8) * 0.12 : 0));
        ctx.save(); ctx.translate(x + w / 2, 318 - jumpL); ctx.rotate(Math.sin(i * 1.7 + hi) * 0.07); ctx.scale(sc, sc);
        popText(ctx, ch, 0, 0, 236, { fill: RAINBOW12[(i * 2 + hi + 12) % 12], depth: 22, lw: 13, dir: [0.4, 1] });
        // gloss
        ctx.fillStyle = 'rgba(255,255,255,0.55)'; roundRect(ctx, -w * 0.28, -92, 16, 60, 8); ctx.fill();
        ctx.restore();
      }
      x += w;
    });
    if (big) confetti(ctx, { x: 960, y: 640, ang: -Math.PI / 2, spread: TAU, speed: 2600, n: 120, seed: 999, size: 34, colors: [C.cream, C.yellow, C.mint, C.cyan, C.pink], g: 1300, drag: 2.4 }, bigAge);
    // ---------- CURSOR centre stage ----------
    ctx.fillStyle = 'rgba(31,42,85,0.25)'; ctx.beginPath(); ctx.ellipse(960, 912, 190, 30, 0, 0, TAU); ctx.fill();
    const jump = big ? Math.sin(Math.PI * clamp(bigAge / 0.45)) * 160 : 0;
    drawMascot(ctx, { x: 960, y: 905 - jump, s: 1.22, t, pose: 'cheer', eyes: 'star', mouth: 'auto', sticker: true, squash: hp * 0.1 });

    // clones on the downbeat
    if (big) {
      [[230, C.pink], [470, C.purple], [1450, '#2BD96B'], [1690, C.yellow]].forEach(([x, col], i) => {
        const u = ease.outBack(seg(bigAge, i * 0.04, i * 0.04 + 0.3), 2.2);
        if (u <= 0) return;
        drawMascot(ctx, { x, y: 915 + (1 - u) * 400, s: 0.62, t: t + i * 0.3, pose: i % 2 ? 'dance' : 'cheer', colors: { body: col }, sticker: true, mouth: 'grin', eyes: i % 2 ? 'happy' : 'star' });
      });
    }

    // "AND THE" chip on 54.66
    const an = ease.outBack(seg(t, T_AND - 0.03, T_AND + 0.18), 2.4);
    if (an > 0) {
      ctx.save(); ctx.translate(960, 500); ctx.scale(an, an); ctx.rotate(-0.05 + Math.sin(lt * 9) * 0.02);
      chip(ctx, 'AND THE…', 0, 0, 78, { bg: C.ink, fg: C.yellow, shadow: '#FF2D6F' });
      ctx.restore();
    }

    // ---------- confetti cannons ----------
    for (let k = 0; k < hits.length; k++) {
      const a = t - hits[k]; if (a < 0 || a > 1.8) continue;
      const isBig = Math.abs(hits[k] - T_BIG) < 0.01;
      const n = isBig ? 140 : 46;
      confetti(ctx, { x: -20, y: 1060, ang: -1.05, spread: 0.55, speed: isBig ? 3300 : 2600, n, seed: k * 13 + 1, size: 30, colors: RAINBOW12, g: 1500, drag: 1.9 }, a);
      confetti(ctx, { x: W + 20, y: 1060, ang: -Math.PI + 1.05, spread: 0.55, speed: isBig ? 3300 : 2600, n, seed: k * 13 + 7, size: 30, colors: RAINBOW12, g: 1500, drag: 1.9 }, a);
    }
    // sparkles everywhere on the 8ths
    for (let i = 0; i < 22; i++) {
      const ph = (lt * 2.3 + hash(i, 31)) % 1;
      sparkle(ctx, hash(i, 32) * W, 130 + hash(i, 33) * 800, (14 + 22 * hash(i, 34)) * Math.sin(Math.PI * ph) * (0.6 + hp), lt * 4 + i, i % 2 ? C.cream : C.yellow);
    }
    ctx.restore();

    // ---------- fx ----------
    E.fx.zoom += hp * 0.012;
    E.fx.rgb = 2 + hp * 4;
    if (big && bigAge < 0.3) { E.fx.shake = 22 * (1 - bigAge / 0.3); E.fx.rgb = 10 * (1 - bigAge / 0.3); }
    if (big && bigAge < 0.04) E.fx.flash = [1, 1, 0.9, 0.28];
    E.fx.saturation = 1.12;
  },
};
