// K05 · "Claude made the motion, I just tell it how I feel" — homage to Muybridge's 1878 "Horse in Motion" plate:
// 12 numbered sepia frames of CURSOR's run cycle on a printed card. The camera pulls back from frame 1, the plate
// comes alive (every cell plays the cycle, phase-offset → a travelling wave), cells card-flip sepia → neon in a
// diagonal wave on "motion", then re-tint by emotion one per syllable; FEEL slams on "feel".
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, seg, hash, rng, font, buf, bctx, roundRect, heart } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { drawMascot, pose } from '../../core/mascot.js';
import { K, chromeText } from './lib7.js';

const S = shot('K05');
const T_PLAY = 94.40, T_MOTION = 94.64, T_TELL = 95.38, T_FEEL = 96.06;
const COLS = 4, ROWS = 3, CW = 372, CH = 232, GAP = 14;
const GX = (W - (COLS * CW + (COLS - 1) * GAP)) / 2, GY = 290;
const NEON = ['#B79CFF', '#3EF0FF', '#7CFFC4', '#DDE3EE'];
const EMO = [['JOY', '#FFE14D', 'happy'], ['LOVE', '#FF7AB8', 'heart'], ['AWE', '#3EF0FF', 'star'], ['CALM', '#7CFFC4', 'happy'], ['HYPE', '#FF8A3D', 'star'], ['DREAMY', '#C9B6FF', 'heart'],
  ['BOLD', '#FF4F6E', 'shades'], ['FREE', '#8FD3FF', 'happy'], ['WOW', '#FFD23F', 'star'], ['COSY', '#FFB38A', 'heart'], ['ZEN', '#9CFFDF', 'happy'], ['ALIVE', '#B79CFF', 'star']];
// syllable times for the emotion wave (tell · it · how · I · feel …)
const SYL = [95.38, 95.46, 95.53, 95.6, 95.67, 95.74, 95.82, 95.9, 95.98, 96.06, 96.08, 96.12];

let paper = null;
function makePaper() {
  const c = buf('K05-paper', W, H), x = bctx(c), r = rng(1878);
  x.fillStyle = '#E9D9B6'; x.fillRect(0, 0, W, H);
  for (let i = 0; i < 26; i++) { const gx = r() * W, gy = r() * H, rr = 80 + r() * 380; const g = x.createRadialGradient(gx, gy, 0, gx, gy, rr); g.addColorStop(0, `rgba(150,105,55,${0.05 + r() * 0.08})`); g.addColorStop(1, 'rgba(150,105,55,0)'); x.fillStyle = g; x.fillRect(gx - rr, gy - rr, rr * 2, rr * 2); }
  const id = x.getImageData(0, 0, W, H), d = id.data;
  for (let i = 0; i < d.length; i += 4) { const n = (hash(i >> 2, 5) - 0.5) * 26; d[i] += n; d[i + 1] += n; d[i + 2] += n * 0.8; }
  x.putImageData(id, 0, 0);
  const v = x.createRadialGradient(W / 2, H / 2, 300, W / 2, H / 2, 1200); v.addColorStop(0, 'rgba(80,50,20,0)'); v.addColorStop(1, 'rgba(80,50,20,0.45)');
  x.fillStyle = v; x.fillRect(0, 0, W, H);
  // printed header
  x.fillStyle = '#3A2614'; x.textAlign = 'center'; x.textBaseline = 'alphabetic';
  font(x, 64, 'Instrument Serif'); x.fillText('THE  CURSOR  IN  MOTION.', W / 2, 168);
  font(x, 30, 'Instrument Serif', '400', 'italic'); x.fillText('Illustrated by', W / 2 - 330, 214);
  font(x, 34, 'Instrument Serif'); x.fillText('C L A U D E .', W / 2 - 150, 214);
  font(x, 30, 'Instrument Serif'); x.fillText('AUTOMATIC  ELECTRO-RENDER.', W / 2 + 270, 214);
  font(x, 22, 'Instrument Serif', '400', 'italic');
  x.fillText('"CURSOR," owned by nobody; dancing at a 100 BPM gait over the Localhost track, 2026. — Frames taken at intervals of 1/30 of a second.', W / 2, 254);
  font(x, 20, 'Instrument Serif'); x.fillText('Copyleft, 2026, by ONE PROMPT.  —  MIT, use it free.', W / 2, 1052);
  x.strokeStyle = '#3A2614'; x.lineWidth = 3; x.strokeRect(GX - 26, 120, W - 2 * (GX - 26), 950); x.lineWidth = 1; x.strokeRect(GX - 18, 128, W - 2 * (GX - 18), 934);
  return c;
}

function cellPose(phi) { return pose('run', phi * TAU / 16 + 0.3); }

function drawCell(ctx, i, t, state) {
  const c = i % COLS, r = Math.floor(i / COLS);
  const x0 = GX + c * (CW + GAP), y0 = GY + r * (CH + GAP);
  const { phi, flip, emo, emoK, beat } = state;
  // card flip around the vertical axis: sepia → neon (scaleX 1 → 0 → 1)
  const fk = clamp(flip), sx = Math.abs(Math.cos(fk * Math.PI)) || 0.001, neon = fk >= 0.5;
  ctx.save(); ctx.translate(x0 + CW / 2, y0 + CH / 2); ctx.scale(sx, 1 + (1 - sx) * 0.06); ctx.translate(-CW / 2, -CH / 2);
  ctx.beginPath(); ctx.rect(0, 0, CW, CH); ctx.clip();
  // background: Muybridge's numbered track lines (shift with the camera stations)
  let bg = '#DCC79F', line = 'rgba(46,28,12,0.72)', fig = '#1C1008';
  if (neon) { bg = emoK > 0 ? EMO[i][1] : NEON[(c + r) % 4]; line = 'rgba(26,18,64,0.35)'; }
  ctx.fillStyle = bg; ctx.fillRect(0, 0, CW, CH);
  if (neon) { const g = ctx.createLinearGradient(0, 0, 0, CH); g.addColorStop(0, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(26,18,64,0.12)'); ctx.fillStyle = g; ctx.fillRect(0, 0, CW, CH); }
  ctx.strokeStyle = line; ctx.lineWidth = 3;
  const off = (i * 23) % 46;
  ctx.beginPath(); for (let k = -1; k < 10; k++) { const lx = k * 46 - off; ctx.moveTo(lx, 0); ctx.lineTo(lx, CH * 0.78); } ctx.stroke();
  ctx.fillStyle = line; font(ctx, 13, 'JetBrains Mono', '700'); ctx.textAlign = 'center';
  for (let k = 0; k < 10; k++) ctx.fillText(String(k + i * 2 + 1), k * 46 - off + 23, 14);
  // ground strip
  ctx.fillStyle = neon ? 'rgba(26,18,64,0.25)' : 'rgba(60,38,16,0.22)'; ctx.fillRect(0, CH * 0.8, CW, CH * 0.2);
  // CURSOR — silhouette in sepia, full colour in neon
  const P = cellPose(phi);
  const em = emoK > 0 ? EMO[i][2] : 'normal';
  drawMascot(ctx, { x: CW / 2 + 10, y: CH * 0.86, s: 0.5 + beat * 0.03, t: t + i * 0.37, P, style: neon ? 'flat' : 'silhouette', colors: neon ? undefined : { ink: fig }, eyes: em, mouth: neon ? (emoK > 0 ? 'open' : 'grin') : 'smile', glyph: neon });
  // emotion hearts / sparkles
  if (emoK > 0 && (i % 3 === 1)) { ctx.fillStyle = '#FF2D6F'; for (let k = 0; k < 3; k++) { const a = (t * 1.3 + k / 3) % 1; heart(ctx, CW * (0.2 + k * 0.3), CH * (0.7 - a * 0.6), 12 * (1 - a)); ctx.fill(); } }
  // plate number / emotion label
  ctx.fillStyle = '#1A1240';
  if (emoK > 0) {
    const k = ease.outBack(clamp(emoK * 3));
    ctx.save(); ctx.translate(14, CH - 14); ctx.scale(k, k); font(ctx, 30, 'Rubik Mono One'); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillText(EMO[i][0], 0, 0); ctx.restore();
  } else { font(ctx, 26, 'Instrument Serif'); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillText(String(i + 1), 12, CH - 12); }
  // print scratches on sepia
  if (!neon) { ctx.fillStyle = 'rgba(60,38,16,0.10)'; ctx.fillRect(0, 0, CW, CH); ctx.strokeStyle = 'rgba(40,24,8,0.3)'; ctx.lineWidth = 1; ctx.beginPath(); for (let k = 0; k < 3; k++) { const sx2 = hash(i, k, Math.floor(t * 12)) * CW; ctx.moveTo(sx2, 0); ctx.lineTo(sx2 + 6, CH); } ctx.stroke(); }
  ctx.restore();
  // frame border
  ctx.save(); ctx.translate(x0 + CW / 2, y0 + CH / 2); ctx.scale(sx, 1);
  ctx.lineWidth = 4; ctx.strokeStyle = neon ? '#1A1240' : '#3A2614'; ctx.strokeRect(-CW / 2, -CH / 2, CW, CH);
  ctx.restore();
}

export default {
  ...S,
  cutIn: 'flash',
  init() { paper = paper || makePaper(); },
  sfx: [{ t: T_MOTION, type: 'swoosh' }, { t: T_FEEL, type: 'ding' }],
  draw(ctx, t, s, E) {
    if (!paper) paper = makePaper();
    const lt = s.lt, fx = E.fx;
    const beat = A.pulse('beat', t, 0.12);
    ctx.fillStyle = '#1A1240'; ctx.fillRect(0, 0, W, H);
    // camera: from frame 1 (zoomed) pull back to the whole plate; slow push + tilt afterwards
    const pull = ease.outExpo(seg(t, S.start + 0.05, S.start + 0.5));
    const c1x = GX + CW / 2, c1y = GY + CH / 2;
    const z = lerp(3.4, 1, pull) * (1 + seg(t, 94.5, S.end) * 0.07) * (1 + beat * 0.012);
    const cx = lerp(c1x, W / 2, pull), cy = lerp(c1y, H / 2 + 20, pull);
    ctx.save();
    ctx.translate(W / 2, H / 2); ctx.rotate(lerp(-0.05, 0, pull) + Math.sin(lt * 1.3) * 0.012); ctx.scale(z, z); ctx.translate(-cx, -cy);
    ctx.drawImage(paper, 0, 0);
    // neon world bleeding into the paper after the flip wave
    const nw = ease.inOutCubic(seg(t, T_MOTION, 95.3));
    if (nw > 0) { ctx.globalAlpha = nw * 0.85; const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#2A1A70'); g.addColorStop(1, '#14103A'); ctx.fillStyle = g; ctx.fillRect(GX - 26, 120, W - 2 * (GX - 26), 950); ctx.globalAlpha = 1; }
    const playing = t >= T_PLAY;
    for (let i = 0; i < 12; i++) {
      const c = i % COLS, r = Math.floor(i / COLS);
      const phi = i / 12 + (playing ? (t - T_PLAY) / 0.6 : 0);
      const flip = seg(t, T_MOTION + (c + r) * 0.06, T_MOTION + (c + r) * 0.06 + 0.22);
      const emoK = seg(t, SYL[i], SYL[i] + 0.3);
      drawCell(ctx, i, t, { phi, flip, emoK, beat });
    }
    ctx.restore();

    // THE MOTION caption
    const mk = seg(t, 94.64, 94.84), mo = seg(t, 95.3, 95.45);
    if (mk > 0 && mo < 1) {
      const k = ease.outBack(mk, 2), out = ease.inCubic(mo);
      ctx.save(); ctx.translate(W / 2, 560 + out * 700); ctx.rotate(-0.04); ctx.scale(k, k);
      ctx.fillStyle = '#1A1240'; roundRect(ctx, -640, -120, 1280, 230, 18); ctx.fill();
      chromeText(ctx, 'THE MOTION', 0, 0, { size: 210, fill: 'chrome', family: 'Anton', shadow: 0, strokeW: 0 });
      ctx.restore();
    }
    // FEEL slam
    const fk = seg(t, T_FEEL, T_FEEL + 0.14);
    if (fk > 0) {
      const k = ease.outBack(fk, 2.5);
      ctx.save(); ctx.translate(W / 2, 540); ctx.rotate(0.03); ctx.scale(k, k);
      ctx.fillStyle = '#FF2D6F'; heart(ctx, 0, 190, 400); ctx.fill(); ctx.lineWidth = 18; ctx.strokeStyle = '#1A1240'; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(-190, -120, 60, 34, -0.6, 0, TAU); ctx.fill();
      chromeText(ctx, 'FEEL', 0, 30, { size: 230, fill: '#FFFFFF', stroke: '#1A1240', strokeW: 18, shadow: 14 });
      ctx.restore();
    }
    // FX
    const fl = Math.max(t >= T_MOTION ? Math.exp(-(t - T_MOTION) / 0.1) : 0, t >= T_FEEL ? Math.exp(-(t - T_FEEL) / 0.08) : 0);
    fx.zoom += fl * 0.04; fx.rgb = 2 + fl * 8; fx.shake = fl * 10;
    fx.saturation = lerp(0.75, 1.1, nw); fx.grain = lerp(0.12, 0.05, nw); fx.vignette = lerp(0.6, 0.3, nw);
    fx.bloom = 0.2 * nw; fx.bloomThreshold = 0.85;
  },
};
