// G06 — "just you and me" — CURSOR points straight down the lens: "YOU". The camera then flies into its glove
// fingertip (exponential zoom ×90, every layer vector so it stays razor sharp): the fingertip's whorl is a
// fingerprint written in "you and me", "& ME" waits at its centre, and everything burns out white-gold.
import { shot } from '../../shots.js';
import { W, H, TAU, ease, seg, clamp, lerp, hash, font, star, heart } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { drawMascot, pose } from '../../core/mascot.js';
import { slabText, goldGrad } from './kit.js';

const S = { ...shot('G06'), end: 85.31 };
const T_YOU = 84.54, T_Z0 = 84.66, T_Z1 = 85.29, T_ME = 85.12;
const MX = 960, MY = 1065, MS = 1.7, ARM = [22, 26];
const TIP = [MX + MS * ARM[0], MY + MS * (ARM[1] - 185) - 8];
const ZMAX = 95;

function zoomAt(t) { const u = seg(t, T_Z0, T_Z1); return Math.exp(Math.log(ZMAX) * ease.inCubic(u)); }

function fingertip(ctx, t) {
  // drawn in world space around TIP; radius ~ 40 px at zoom 1
  ctx.save(); ctx.translate(TIP[0], TIP[1]);
  ctx.save(); ctx.beginPath(); ctx.arc(0, 0, 38, 0, TAU); ctx.clip();
  // whorl: a spiral fingerprint whose ridges are the words "you and me"
  ctx.strokeStyle = 'rgba(224,161,0,0.55)'; ctx.lineWidth = 0.55;
  for (let k = 0; k < 15; k++) { const r = 2.2 + k * 2.4; ctx.beginPath(); ctx.ellipse(0.4 * Math.sin(k), 0, r * 1.08, r * 0.92, 0.3, 0, TAU); ctx.stroke(); }
  font(ctx, 1.6, 'JetBrains Mono', '800'); ctx.fillStyle = 'rgba(160,100,0,0.85)'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const msg = 'you and me · ';
  for (let k = 3; k < 15; k += 2) {
    const r = 2.2 + k * 2.4 + 1.2, n = Math.floor((TAU * r) / 1.25);
    for (let i = 0; i < n; i++) { const a = i / n * TAU + k * 0.4; ctx.save(); ctx.rotate(a); ctx.translate(0, -r); ctx.fillText(msg[i % msg.length], 0, 0); ctx.restore(); }
  }
  ctx.restore();
  // "& ME" + heart at the very centre (readable around zoom 25-90)
  const mk = ease.outBack(seg(t, T_ME - 0.06, T_ME + 0.12), 2);
  if (mk > 0) {
    ctx.save(); ctx.scale(mk, mk);
    heart(ctx, 0, -1.6, 2.2); ctx.fillStyle = '#FF3E8A'; ctx.fill(); ctx.lineWidth = 0.25; ctx.strokeStyle = '#111'; ctx.stroke();
    font(ctx, 3.0, 'Anton'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#111'; ctx.fillText('& ME', 0, 2.6);
    ctx.restore();
  }
  ctx.restore();
}

export default {
  ...S,
  cutIn: 'punch',
  sfx: [{ t: T_YOU, type: 'impact', gain: 1 }, { t: T_Z0, type: 'riser', gain: 0.7 }, { t: 85.2, type: 'whoosh', gain: 1 }],
  draw(ctx, t, s, E) {
    const lt = s.lt;
    const z = zoomAt(t) * (1 + lt * 0.04), center = clamp(Math.log(z) / Math.log(5));
    const fx = lerp(W / 2, TIP[0], center), fy = lerp(H / 2, TIP[1], center);
    const youH = t >= T_YOU ? Math.exp(-(t - T_YOU) / 0.12) : 0;
    ctx.save();
    ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-fx, -fy);
    // world: rays + halftone, centred on the fingertip
    const rot = lt * 0.5;
    ctx.fillStyle = '#FFF4D6'; ctx.fillRect(-2000, -2000, W + 4000, H + 4000);
    for (let i = 0; i < 36; i++) { const a0 = rot + (i / 36) * TAU, a1 = a0 + TAU / 72; ctx.fillStyle = i % 2 ? '#FFC300' : '#FFB000'; ctx.beginPath(); ctx.moveTo(TIP[0], TIP[1]); ctx.lineTo(TIP[0] + Math.cos(a0) * 3000, TIP[1] + Math.sin(a0) * 3000); ctx.lineTo(TIP[0] + Math.cos(a1) * 3000, TIP[1] + Math.sin(a1) * 3000); ctx.fill(); }
    // concentric target rings around the finger (they read as "you" being aimed at)
    for (let k = 0; k < 6; k++) { const r = 160 + k * 150 + ((lt * 260) % 150); ctx.beginPath(); ctx.arc(TIP[0], TIP[1], r, 0, TAU); ctx.lineWidth = 10; ctx.strokeStyle = `rgba(17,17,17,${0.12})`; ctx.stroke(); }
    // JUST (small) + YOU (huge) behind CURSOR
    const jk = ease.outBack(seg(t, S.start, S.start + 0.16), 2);
    if (jk > 0) { ctx.save(); ctx.translate(560, 236); ctx.rotate(-0.08); ctx.scale(jk, jk); slabText(ctx, 'JUST', 0, 0, { size: 110, family: 'Bungee', face: '#FFF4D6', side: '#111', depth: 8, ow: 7 }); ctx.restore(); }
    const yk = ease.outBack(seg(t, T_YOU - 0.03, T_YOU + 0.12), 2.4);
    if (yk > 0) {
      ctx.save(); ctx.translate(980, 330); ctx.scale(yk * (1 + youH * 0.06), yk * (1 + youH * 0.06));
      slabText(ctx, 'YOU', 0, 0, { size: 470, family: 'Anton', face: (c, a, b) => goldGrad(c, a, b), side: '#111', depth: 22, ow: 12, outline: '#111' });
      ctx.restore();
    }
    // CURSOR pointing at the lens (foreshortened arm) with a big glove
    const P = pose('pointYou', t);
    P.armR = [...ARM]; P.armL = [-128, 92]; P.bob = 0; P.rot = 0; P.lean = 0; P.squash = A.pulse('beat', t, 0.12) * 0.05 + youH * 0.08; P.look = [0.05, 0.1];
    const eyes = t >= 84.9 ? 'heart' : t >= T_YOU ? 'wink' : 'normal';
    drawMascot(ctx, { x: MX, y: MY, s: MS, t, P, eyes, mouth: 'auto', sticker: true,
      over: (c, PP) => {
        const [hx, hy] = PP.armR, jab = 1 + youH * 0.25;
        c.save(); c.translate(hx, hy - 4); c.scale(jab, jab);
        // fist
        c.beginPath(); c.arc(0, 6, 46, 0, TAU); c.fillStyle = '#fff'; c.fill(); c.lineWidth = 7; c.strokeStyle = '#1F2A55'; c.stroke();
        c.beginPath(); c.moveTo(-30, 30); c.quadraticCurveTo(0, 40, 30, 30); c.lineWidth = 5; c.stroke();
        c.beginPath(); c.ellipse(-40, 14, 14, 20, -0.4, 0, TAU); c.fillStyle = '#fff'; c.fill(); c.lineWidth = 6; c.stroke();
        // index finger, end-on, pointing straight at us
        c.beginPath(); c.arc(0, -4 / MS * 0, 26, 0, TAU); c.fillStyle = '#fff'; c.fill(); c.lineWidth = 6; c.stroke();
        c.restore();
      } });
    // fingertip detail lives on top (in world space, scaled with the camera)
    fingertip(ctx, t);
    ctx.restore();

    // warp sparkles flying past the camera during the zoom
    const zs = seg(t, T_Z0, T_Z1);
    if (zs > 0) {
      ctx.save(); ctx.translate(W / 2, H / 2);
      for (let i = 0; i < 70; i++) {
        const a = hash(i, 3) * TAU, ph = (hash(i, 4) + t * (0.6 + zs * 2.6)) % 1, r = Math.pow(ph, 2.2) * 1300;
        const len = 20 + zs * 160 * ph;
        ctx.strokeStyle = i % 3 ? `rgba(255,195,0,${0.8 * ph})` : `rgba(255,255,255,${0.9 * ph})`; ctx.lineWidth = 2 + ph * 5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r); ctx.lineTo(Math.cos(a) * (r + len), Math.sin(a) * (r + len)); ctx.stroke();
      }
      ctx.restore();
    }

    // FX: the jab on "you", radial blur with zoom speed, white-gold burnout at the end
    E.fx.shake = youH * 22; E.fx.zoom += youH * 0.05; E.fx.rgb = youH * 10 + zs * 6;
    E.fx.radialBlur = ease.inQuad(zs) * 0.9; E.fx.center = [0.5, 0.5];
    const burn = ease.inQuad(seg(t, 85.18, 85.3));
    if (burn > 0) E.fx.flash = [1, 0.93, 0.62, burn];
    E.fx.vignette = 0.2;
  },
};
