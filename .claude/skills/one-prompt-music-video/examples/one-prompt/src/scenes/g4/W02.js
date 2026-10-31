// W02 — "a pack, a crazy fee" · Pop-up storm.
// 60 Win95 pop-ups cascade onto an electric-blue desktop in 0.4 s (stacked cascades + scatter), a giant
// CRAZY FEE window lands on "crazy" — then a swarm of 40 mouse pointers flies in on eased, curved paths,
// each clicking one or two ✕ buttons so the windows close in a left→right wave. CURSOR (it IS a cursor)
// leaps in and punches the last, biggest ✕.
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, seg, font, hash, rng, roundRect, wobble } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { drawMascot } from '../../core/mascot.js';
import { C } from './_util.js';
import { win, button, pointer, warn, errIcon, bevel } from './_win.js';

const S = shot('W02');
const T0 = 59.36, T_CRAZY = 59.66, T_WAVE0 = 59.80, T_WAVE1 = 60.06, T_BIG = 60.13;
const MSGS = [
  ['PRESET PACK', '$299!!!'], ['LIMITED SPOTS', 'ONLY 2 LEFT'], ['CRAZY FEE', '$1,999'], ['BUY NOW', 'OFFER ENDS SOON'], ['LUT BUNDLE', '-90%*'],
  ['PLUGIN PRO', '$499 / yr'], ['MASTERCLASS 2.0', 'ENROLL NOW'], ['ACT NOW!!!', 'DON\'T MISS OUT'], ['UPGRADE', 'TO GOLD TIER'], ['MEGA PACK', '10,000 TEMPLATES'],
  ['RENDER FARM', '$$$ / HOUR'], ['TRIAL EXPIRED', 'PLEASE PAY'], ['VIP COMMUNITY', '$97 / MONTH'], ['COACHING 1:1', '$2,500'], ['STOCK PASS', 'ANNUAL ONLY'],
];
const TITLES = ['ALERT!!!', 'SPECIAL OFFER', 'WARNING', '!!! DEAL !!!', 'Message', 'URGENT', 'SALE.exe'];

let POPS = null;
function build() {
  const R = rng(2020), pops = [];
  for (let st = 0; st < 10; st++) {
    const gx = [0, 1, 2, 3, 4, 0, 1, 2, 3, 4][st], gy = st < 5 ? 0 : 1; const ox = 20 + gx * 330 + R.range(-40, 60), oy = 110 + gy * 330 + R.range(-20, 80);
    for (let k = 0; k < 6; k++) {
      const i = pops.length, big = i === 0, w = big ? 760 : R.range(430, 640), h = big ? 330 : R.range(230, 320);
      pops.push({ i, x: big ? 160 : Math.min(W - w - 10, ox + k * 40), y: big ? 300 : Math.min(1000 - h, oy + k * 36), w, h, ta: big ? T0 : T0 + 0.02 + (st * 6 + k) * 0.0052 + R.range(0, 0.012), msg: MSGS[(i * 7) % MSGS.length], title: TITLES[i % TITLES.length], icon: R() < 0.5 ? 0 : 1, seed: i });
    }
  }
  // close times: a left→right wave across the ✕ buttons
  for (const p of pops) { p.cx = p.x + p.w - 30; p.cy = p.y + 30; p.tc = T_WAVE0 + (p.cx / W) * (T_WAVE1 - T_WAVE0) + hash(p.i, 9) * 0.03; }
  const order = [...pops].sort((a, b) => a.tc - b.tc);
  // 40 pointers: pointer j takes the j-th and (j+40)-th close
  const ptrs = [];
  for (let j = 0; j < 40; j++) {
    const tg = [order[j], order[j + 40]].filter(Boolean);
    const side = j % 4, u = hash(j, 3);
    const start = side === 0 ? [-80, 120 + u * 840] : side === 1 ? [W + 80, 120 + u * 840] : side === 2 ? [u * W, -80] : [u * W, H + 80];
    ptrs.push({ j, tg, start, s: 1.7 + hash(j, 5) * 0.8 });
  }
  return { pops, ptrs };
}

function drawPop(ctx, p, t) {
  const a = t - p.ta; if (a < 0) return;
  const closing = t >= p.tc;
  if (closing) {
    // Win95 zoom-rect: an outline shrinks into the ✕
    const u = (t - p.tc) / 0.09; if (u > 1) return;
    const k = ease.inCubic(u);
    ctx.strokeStyle = '#0E0E12'; ctx.lineWidth = 3; ctx.setLineDash([6, 4]);
    ctx.strokeRect(lerp(p.x, p.cx, k), lerp(p.y, p.cy, k), p.w * (1 - k), p.h * (1 - k)); ctx.setLineDash([]);
    return;
  }
  const sc = a < 0.035 ? lerp(0.55, 1, ease.outBack(a / 0.035, 2)) : 1;
  ctx.save(); ctx.translate(p.x + p.w / 2, p.y + p.h / 2); ctx.scale(sc, sc); ctx.translate(-p.w / 2, -p.h / 2);
  const pressed = t > p.tc - 0.04;
  const R = win(ctx, 0, 0, p.w, p.h, p.title, { tb: 34, pressed, minmax: false });
  ctx.fillStyle = C.grey; ctx.fillRect(R.cx, R.cy, R.cw, R.ch);
  if (p.icon) warn(ctx, 52, R.cy + 52, 30); else errIcon(ctx, 52, R.cy + 52, 28);
  const fs = p.h * 0.21;
  font(ctx, fs, 'Anton'); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillStyle = (p.i % 3 === 0) ? C.red : (p.i % 3 === 1 ? C.blue : '#0E0E12');
  ctx.fillText(p.msg[0], 100, R.cy + fs * 0.75, p.w - 120);
  font(ctx, fs * 0.6, 'JetBrains Mono', '800'); ctx.fillStyle = '#0E0E12'; ctx.fillText(p.msg[1], 100, R.cy + fs * 1.75, p.w - 120);
  const by = p.h - 62;
  button(ctx, p.w / 2 - 170, by, 150, 46, 'BUY', 24, false, p.i % 2 ? C.red : C.grey, p.i % 2 ? '#fff' : '#0E0E12');
  button(ctx, p.w / 2 + 20, by, 150, 46, 'OK', 24);
  ctx.restore();
}

export default {
  ...S,
  cutIn: 'glitch',
  hud: 'paper', // light HUD text on the electric-blue desktop
  sfx: [{ t: T0 + 0.02, type: 'pop', gain: 0.7 }, { t: T_CRAZY, type: 'glitch', gain: 0.8 }, { t: T_WAVE0, type: 'click', gain: 0.8 }, { t: T_BIG, type: 'impact', gain: 0.9 }],
  draw(ctx, t, s, E) {
    if (!POPS) POPS = build();
    const lt = s.lt;
    // ---------- desktop ----------
    ctx.fillStyle = C.blue; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    for (let y = 0; y < H; y += 6) ctx.fillRect(0, y, W, 2);
    // desktop icons
    const icons = [['MY PROMPTS', 0], ['RECYCLE BIN', 1], ['ONE_PROMPT.txt', 2]];
    icons.forEach(([label, k], i) => {
      const x = 110, y = 190 + i * 170;
      if (k === 0) { ctx.fillStyle = '#FFD23F'; ctx.fillRect(x - 44, y - 30, 88, 64); ctx.fillRect(x - 44, y - 42, 40, 16); ctx.strokeStyle = '#0E0E12'; ctx.lineWidth = 3; ctx.strokeRect(x - 44, y - 30, 88, 64); }
      else if (k === 1) { ctx.fillStyle = C.grey; ctx.fillRect(x - 30, y - 34, 60, 70); ctx.strokeStyle = '#0E0E12'; ctx.lineWidth = 3; ctx.strokeRect(x - 30, y - 34, 60, 70); for (let q = 0; q < 3; q++) { ctx.beginPath(); ctx.moveTo(x - 15 + q * 15, y - 24); ctx.lineTo(x - 15 + q * 15, y + 26); ctx.stroke(); } }
      else { ctx.fillStyle = '#fff'; ctx.fillRect(x - 30, y - 38, 60, 76); ctx.strokeStyle = '#0E0E12'; ctx.lineWidth = 3; ctx.strokeRect(x - 30, y - 38, 60, 76); ctx.fillStyle = '#FF6A1F'; ctx.fillRect(x - 18, y - 20, 14, 26); }
      font(ctx, 22, 'JetBrains Mono', '700'); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(label, x, y + 48);
    });

    // camera jolt on the cascade
    const shakeIn = Math.exp(-lt / 0.25);
    ctx.save();
    const z = 1 + 0.03 * Math.exp(-(t - T_CRAZY) / 0.15) * (t > T_CRAZY ? 1 : 0) + lt * 0.03;
    ctx.translate(960, 540); ctx.scale(z, z); ctx.translate(-960, -540);

    // ---------- pop-ups ----------
    for (const p of POPS.pops) if (p.i !== 0 || t >= T_CRAZY) drawPop(ctx, p, t);
    if (t < T_CRAZY) drawPop(ctx, POPS.pops[0], t);

    // ---------- the CRAZY FEE window ----------
    const ba = t - T_CRAZY;
    const bx = 470, by = 250, bw = 980, bh = 540;
    if (ba >= 0 && t < T_BIG + 0.09) {
      const closing = t >= T_BIG;
      ctx.save();
      if (closing) { const u = ease.inCubic((t - T_BIG) / 0.09); ctx.translate(bx + bw - 40, by + 36); ctx.scale(1 - u, 1 - u); ctx.rotate(u * 0.6); ctx.translate(-(bx + bw - 40), -(by + 36)); }
      const sc = ease.outBack(clamp(ba / 0.1), 2.4);
      ctx.translate(960, 520); ctx.scale(sc, sc); ctx.rotate((1 - sc) * 0.1); ctx.translate(-960, -520);
      const R = win(ctx, bx, by, bw, bh, '⚠ CRAZY_FEE.exe — NOT RESPONDING', { tb: 52, icon: true, pressed: t > T_BIG - 0.05 });
      ctx.fillStyle = '#fff'; ctx.fillRect(R.cx, R.cy, R.cw, R.ch);
      ctx.fillStyle = C.red; ctx.fillRect(R.cx, R.cy, R.cw, 18);
      font(ctx, 200, 'Anton'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const jit = Math.sin(lt * 70) * 3;
      ctx.fillStyle = '#0E0E12'; ctx.fillText('CRAZY FEE', 960 + 10, by + 250 + 10);
      ctx.fillStyle = C.red; ctx.fillText('CRAZY FEE', 960 + jit, by + 250);
      font(ctx, 54, 'JetBrains Mono', '800'); ctx.fillStyle = C.blue; ctx.fillText('$4,999.99 / month*', 960, by + 395);
      button(ctx, bx + 170, by + bh - 100, 280, 70, 'PAY NOW', 32, false, C.red, '#fff');
      button(ctx, bx + bw - 450, by + bh - 100, 280, 70, 'PAY LATER', 32);
      ctx.restore();
    }

    // ---------- the swarm ----------
    for (const P of POPS.ptrs) {
      const tg = P.tg; if (!tg.length) continue;
      const tStart = tg[0].tc - 0.2;
      if (t < tStart) continue;
      let x, y, press = 0;
      const legs = [{ from: P.start, to: [tg[0].cx, tg[0].cy], t0: tStart, t1: tg[0].tc }];
      if (tg[1]) legs.push({ from: [tg[0].cx, tg[0].cy], to: [tg[1].cx, tg[1].cy], t0: tg[0].tc + 0.03, t1: tg[1].tc });
      const exitFrom = tg[tg.length - 1];
      legs.push({ from: [exitFrom.cx, exitFrom.cy], to: [exitFrom.cx + 500 * (hash(P.j, 8) - 0.3), -200], t0: exitFrom.tc + 0.04, t1: exitFrom.tc + 0.34 });
      let leg = legs[0];
      for (const L of legs) if (t >= L.t0) leg = L;
      const u = clamp((t - leg.t0) / (leg.t1 - leg.t0));
      const k = leg === legs[legs.length - 1] ? ease.inCubic(u) : ease.outCubic(u);
      const bend = Math.sin(Math.PI * k) * 90 * (hash(P.j, 6) - 0.5);
      const dx = leg.to[0] - leg.from[0], dy = leg.to[1] - leg.from[1], dl = Math.hypot(dx, dy) || 1;
      x = lerp(leg.from[0], leg.to[0], k) - (dy / dl) * bend; y = lerp(leg.from[1], leg.to[1], k) + (dx / dl) * bend;
      for (const w of tg) { const d = t - w.tc; if (d > -0.03 && d < 0.05) press = 1; }
      // click ring
      for (const w of tg) { const d = t - w.tc; if (d >= 0 && d < 0.15) { ctx.strokeStyle = `rgba(255,255,255,${1 - d / 0.15})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(w.cx, w.cy, 10 + d * 300, 0, TAU); ctx.stroke(); } }
      pointer(ctx, x + 6, y + 8, P.s * (press ? 0.86 : 1), 'rgba(14,14,18,0.45)', 'rgba(0,0,0,0)', -0.05 + Math.sin(lt * 9 + P.j) * 0.08);
      pointer(ctx, x, y, P.s * (press ? 0.86 : 1), '#FFFFFF', '#0E0E12', -0.05 + Math.sin(lt * 9 + P.j) * 0.08);
    }

    // ---------- CURSOR punches the last ✕ ----------
    const ma = t - (T_BIG - 0.2);
    if (ma >= 0) {
      const u = ease.outCubic(clamp(ma / 0.2));
      const x = lerp(1250, bx + bw - 120, u), y = lerp(1250, by + 250, u) + (ma > 0.2 ? Math.sin(Math.PI * clamp((ma - 0.2) / 0.3)) * -40 : 0);
      drawMascot(ctx, { x, y, s: 0.62, t, pose: ma < 0.2 ? 'jump' : 'cheer', sticker: true, mouth: 'grin', eyes: ma > 0.2 ? 'happy' : 'normal', rot: ma < 0.2 ? -0.3 : 0, squash: ma > 0.2 ? wobble(ma - 0.2, 5, 7) * 0.2 : 0 });
    }
    // KA-CLICK burst
    const kb = t - T_BIG;
    if (kb >= 0 && kb < 0.11) {
      const u = kb / 0.11;
      ctx.save(); ctx.translate(bx + bw - 40, by + 36);
      ctx.fillStyle = '#FFE14D'; ctx.beginPath();
      for (let i = 0; i < 24; i++) { const a = (i / 24) * TAU, r = (i % 2 ? 60 : 170) * (0.6 + u); ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
      ctx.closePath(); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = '#0E0E12'; ctx.stroke();
      font(ctx, 64, 'Anton'); ctx.fillStyle = C.red; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('CLICK!', 0, 4);
      ctx.restore();
    }
    ctx.restore();

    E.fx.shake = 6 * shakeIn + (kb >= 0 && kb < 0.12 ? 16 : 0);
    if (ba >= 0 && ba < 0.06) { E.fx.glitch = 0.3; E.fx.glitchSeed = E.frame; E.fx.rgb = 8; }
    E.fx.rgb = Math.max(E.fx.rgb, 2);
  },
};
