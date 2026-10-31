// V07 — "no team" — eight cardboard crew cut-outs fall like dominoes. A real (tiny) rigid-body solver
// (domino.js: gravity torque about the tipping corner, impact impulses, leaning contact, ground bounce)
// runs at 480 Hz from the moment a flying red NO smacks the first card; the last card topples the TEAM
// sign, which slams and bounces. CURSOR, alone at the end of the line, shrugs.
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, rng, sim, wobble, roundRect, font } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { drawMascot, pose } from '../../core/mascot.js';
import { P1, paper, printType, paperBurst, paperTex } from './util.js';
import { makeBodies, step } from './domino.js';

const S = shot('V07');
const T0 = 16.29, HZ = 480, G = 50000, PITCH = 270, CW = 140;
const ROLES = ['BOOM', 'CAMERA', 'SCRIPT', 'MAKEUP', 'LIGHTS', 'SOUND', 'PRODUCER', 'EDITOR'];
const SHIRT = [P1.red, P1.ink, P1.orange, '#6EC3F0', P1.red, '#3FAE68', P1.ink, P1.orange];
const SKIN = ['#F2C9A0', '#C68B59', '#8D5A3B', '#F5D3B3', '#B07A4F', '#E8B48A', '#6E4630', '#D9A273'];
const HEIGHTS = [400, 420, 390, 430, 405, 415, 440, 410];
const SIGN = { w: 36, h: 500 };
let R = null;

function spec() {
  const s = HEIGHTS.map((h, i) => ({ w: CW, h, px: i * PITCH + CW }));
  s.push({ w: SIGN.w, h: SIGN.h, px: 8 * PITCH + SIGN.w - 60, k: 1.8, e: 0.42 });
  return s;
}

function crewCard(i) {
  const w = CW, h = HEIGHTS[i], k = 2, c = document.createElement('canvas'); c.width = (w + 40) * k; c.height = (h + 90) * k;
  const x = c.getContext('2d'); x.scale(k, k); x.translate(20, 70); // card occupies (0,0)-(w,h); head may poke above
  x.lineJoin = 'round'; x.lineCap = 'round';
  const ink = P1.ink;
  // board
  x.fillStyle = '#FBF5EA'; roundRect(x, 0, 0, w, h, 10); x.fill(); x.lineWidth = 5; x.strokeStyle = ink; x.stroke();
  x.fillStyle = 'rgba(232,52,63,0.10)'; for (let j = 0; j < 9; j++) x.fillRect(0, 18 + j * 34, w, 14);
  // person
  const cx = w / 2, headY = 46;
  // body
  x.fillStyle = SHIRT[i]; roundRect(x, cx - 44, headY + 46, 88, 150, 30); x.fill(); x.lineWidth = 5; x.stroke();
  // legs
  x.strokeStyle = ink; x.lineWidth = 16; x.beginPath(); x.moveTo(cx - 20, headY + 190); x.lineTo(cx - 24, h - 74); x.moveTo(cx + 20, headY + 190); x.lineTo(cx + 24, h - 74); x.stroke();
  x.fillStyle = ink; x.beginPath(); x.ellipse(cx - 30, h - 70, 20, 10, 0, 0, TAU); x.ellipse(cx + 30, h - 70, 20, 10, 0, 0, TAU); x.fill();
  // head + hair (pokes out of the card: die-cut)
  x.fillStyle = SKIN[i]; x.beginPath(); x.arc(cx, headY, 40, 0, TAU); x.fill(); x.lineWidth = 5; x.strokeStyle = ink; x.stroke();
  x.fillStyle = i % 3 === 0 ? '#2B1D14' : i % 3 === 1 ? '#5A3A22' : ink;
  x.beginPath(); x.arc(cx, headY - 8, 40, Math.PI * 1.05, Math.PI * 1.95); x.closePath(); x.fill();
  x.fillStyle = ink; x.beginPath(); x.arc(cx - 13, headY + 4, 4.5, 0, TAU); x.arc(cx + 13, headY + 4, 4.5, 0, TAU); x.fill();
  x.lineWidth = 4; x.beginPath(); x.arc(cx, headY + 12, 12, 0.2, Math.PI - 0.2); x.stroke();
  // arms + prop
  const hand = (hx, hy) => { x.fillStyle = SKIN[i]; x.beginPath(); x.arc(hx, hy, 11, 0, TAU); x.fill(); x.lineWidth = 4; x.strokeStyle = ink; x.stroke(); };
  const arm = (ax, ay, bx, by) => { x.strokeStyle = SHIRT[i]; x.lineWidth = 18; x.beginPath(); x.moveTo(ax, ay); x.lineTo(bx, by); x.stroke(); };
  const prop = ROLES[i];
  if (prop === 'BOOM') { x.strokeStyle = '#9C7A52'; x.lineWidth = 8; x.beginPath(); x.moveTo(cx - 30, headY + 140); x.lineTo(w + 10, -60); x.stroke(); x.fillStyle = '#8A8A96'; x.beginPath(); x.ellipse(w + 14, -66, 30, 16, -0.6, 0, TAU); x.fill(); x.lineWidth = 4; x.strokeStyle = ink; x.stroke(); arm(cx - 40, headY + 70, cx - 6, headY + 120); arm(cx + 40, headY + 70, cx + 34, headY + 74); hand(cx - 6, headY + 120); hand(cx + 34, headY + 74); }
  if (prop === 'CAMERA') { arm(cx + 40, headY + 70, cx + 34, headY + 40); hand(cx + 34, headY + 40); x.fillStyle = P1.orange; roundRect(x, cx - 4, headY + 6, 74, 46, 8); x.fill(); x.lineWidth = 4; x.strokeStyle = ink; x.stroke(); x.fillStyle = ink; x.beginPath(); x.arc(cx + 70, headY + 29, 16, 0, TAU); x.fill(); x.fillStyle = P1.red; x.beginPath(); x.arc(cx + 10, headY + 16, 5, 0, TAU); x.fill(); arm(cx - 40, headY + 70, cx - 50, headY + 140); hand(cx - 50, headY + 140); }
  if (prop === 'SCRIPT') { arm(cx - 40, headY + 70, cx - 10, headY + 110); arm(cx + 40, headY + 70, cx + 18, headY + 112); x.fillStyle = '#9C7A52'; roundRect(x, cx - 34, headY + 84, 64, 84, 6); x.fill(); x.fillStyle = '#fff'; x.fillRect(cx - 26, headY + 96, 48, 64); x.fillStyle = ink; for (let j = 0; j < 4; j++) x.fillRect(cx - 20, headY + 106 + j * 12, 36, 4); hand(cx - 10, headY + 110); hand(cx + 18, headY + 112); }
  if (prop === 'MAKEUP') { arm(cx + 40, headY + 70, cx + 52, headY + 10); hand(cx + 52, headY + 10); x.strokeStyle = '#9C7A52'; x.lineWidth = 6; x.beginPath(); x.moveTo(cx + 52, headY + 10); x.lineTo(cx + 60, headY - 30); x.stroke(); x.fillStyle = P1.red; x.beginPath(); x.ellipse(cx + 61, headY - 38, 7, 12, 0.2, 0, TAU); x.fill(); arm(cx - 40, headY + 70, cx - 56, headY + 120); x.fillStyle = '#fff'; x.beginPath(); x.ellipse(cx - 60, headY + 124, 30, 18, 0, 0, TAU); x.fill(); x.lineWidth = 4; x.strokeStyle = ink; x.stroke(); ['#FF8FB1', P1.orange, '#B79CFF'].forEach((cc, j) => { x.fillStyle = cc; x.beginPath(); x.arc(cx - 74 + j * 14, headY + 122, 6, 0, TAU); x.fill(); }); }
  if (prop === 'LIGHTS') { arm(cx + 40, headY + 70, cx + 44, headY - 6); hand(cx + 44, headY - 6); x.fillStyle = '#FFE14D'; x.beginPath(); x.moveTo(cx + 30, headY - 20); x.lineTo(cx + 72, headY - 50); x.lineTo(cx + 72, headY + 10); x.closePath(); x.fill(); x.lineWidth = 4; x.strokeStyle = ink; x.stroke(); arm(cx - 40, headY + 70, cx - 50, headY + 140); hand(cx - 50, headY + 140); }
  if (prop === 'SOUND') { x.strokeStyle = ink; x.lineWidth = 9; x.beginPath(); x.arc(cx, headY, 44, Math.PI * 1.05, Math.PI * 1.95); x.stroke(); x.fillStyle = P1.red; x.fillRect(cx - 50, headY - 6, 14, 24); x.fillRect(cx + 36, headY - 6, 14, 24); arm(cx - 40, headY + 70, cx - 20, headY + 118); arm(cx + 40, headY + 70, cx + 20, headY + 118); x.fillStyle = '#333'; roundRect(x, cx - 30, headY + 104, 60, 40, 6); x.fill(); hand(cx - 20, headY + 118); hand(cx + 20, headY + 118); }
  if (prop === 'PRODUCER') { arm(cx + 40, headY + 70, cx + 30, headY + 16); hand(cx + 30, headY + 16); x.fillStyle = ink; roundRect(x, cx + 24, headY - 8, 16, 30, 4); x.fill(); arm(cx - 40, headY + 70, cx - 52, headY + 130); x.fillStyle = '#3FAE68'; x.beginPath(); x.arc(cx - 56, headY + 140, 22, 0, TAU); x.fill(); x.lineWidth = 4; x.strokeStyle = ink; x.stroke(); x.fillStyle = '#fff'; x.font = '800 26px "JetBrains Mono"'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('$', cx - 56, headY + 142); hand(cx - 52, headY + 124); }
  if (prop === 'EDITOR') { arm(cx - 40, headY + 70, cx - 24, headY + 112); arm(cx + 40, headY + 70, cx + 24, headY + 112); x.fillStyle = '#C3C3C3'; roundRect(x, cx - 46, headY + 96, 92, 56, 6); x.fill(); x.lineWidth = 4; x.strokeStyle = ink; x.stroke(); x.fillStyle = P1.orange; x.fillRect(cx - 38, headY + 104, 76, 40); hand(cx - 24, headY + 112); hand(cx + 24, headY + 112); }
  // label strip
  x.fillStyle = ink; x.fillRect(0, h - 50, w, 50);
  x.fillStyle = '#FBF5EA'; x.font = `400 ${prop.length > 6 ? 26 : 32}px "Anton"`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(prop, w / 2, h - 24);
  return { c, k, ox: 20, oy: 70 };
}

function build() {
  R = { cards: HEIGHTS.map((_, i) => crewCard(i)) };
}

function drawBody(ctx, b, img, sign) {
  // rotate about the bottom-right pivot (world coords; y up = negative)
  ctx.save(); ctx.translate(b.px, 0); ctx.rotate(b.th);
  if (sign) {
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(-b.w + 8, -b.h + 8, b.w, b.h);
    ctx.fillStyle = '#9C7A52'; ctx.fillRect(-b.w, -b.h, b.w, b.h); ctx.lineWidth = 5; ctx.strokeStyle = P1.ink; ctx.strokeRect(-b.w, -b.h, b.w, b.h);
    ctx.translate(-b.w / 2, -b.h);
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; roundRect(ctx, -160 + 10, -110 + 10, 320, 150, 14); ctx.fill();
    ctx.fillStyle = '#FBF5EA'; roundRect(ctx, -160, -110, 320, 150, 14); ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = P1.ink; ctx.stroke();
    printType(ctx, 'TEAM', 0, -34, 120, { fill: P1.red, shadow: P1.ink, off: 0.04 });
    ctx.restore(); return;
  }
  const { c, k, ox, oy } = img;
  // kraft thickness
  ctx.save(); ctx.translate(-b.w + 9, -b.h + 7); ctx.fillStyle = '#9C7A52'; roundRect(ctx, 0, 0, b.w, b.h, 10); ctx.fill(); ctx.restore();
  ctx.drawImage(c, -b.w - ox, -b.h - oy, c.width / k, c.height / k);
  ctx.restore();
}

export default {
  ...S,
  cutIn: 'punch',
  sfx: [{ t: 16.29, type: 'impact', gain: 0.6 }, { t: 16.4, type: 'tick', gain: 0.5 }, { t: 16.74, type: 'boom', gain: 0.8 }],
  init() { paperTex(P1.paper, W, H, 14); build(); },
  draw(ctx, t, s, E) {
    if (!R) build();
    const lt = s.lt;
    const n = Math.max(0, Math.floor((t - T0) * HZ));
    const B = sim('V07-dom', n, () => { const b = makeBodies(spec()); b[0].om = 9.5; return { b, time: 0 }; }, (st, i) => step(st.b, 1 / HZ, G, i / HZ)).b;
    const tt = t - T0;
    const sign = B[8];

    paper(ctx, P1.paper, -lt * 120, 0, 14);
    // camera: wide → push toward the sign + CURSOR
    const track = ease.inOutQuad(clamp((t - 16.27) / 0.55));
    const zoom = lerp(0.92, 0.84, track) + 0.05 * ease.outCubic(clamp((t - 16.75) / 0.3)), camX = lerp(640, 2560, track), groundY = 850;
    const shake = sign.tGround > 0 && tt > sign.tGround ? Math.exp(-(tt - sign.tGround) * 10) : 0;
    ctx.save();
    ctx.translate(W / 2, groundY); ctx.scale(zoom, zoom); ctx.translate(-camX, 0);
    // floor
    ctx.fillStyle = '#E2D3B8'; ctx.fillRect(camX - 2400, 0, 4800, 600);
    ctx.fillStyle = 'rgba(31,42,85,0.15)'; ctx.fillRect(camX - 2400, 0, 4800, 6);
    for (let i = -20; i < 40; i++) { ctx.fillStyle = 'rgba(31,42,85,0.06)'; ctx.fillRect(i * 160, 30, 80, 6); }
    // shadows
    for (const b of B) {
      const len = b.h * Math.sin(b.th) + 40;
      ctx.fillStyle = 'rgba(31,42,85,0.16)'; ctx.beginPath(); ctx.ellipse(b.px - b.w / 2 + len * 0.5, 6, len * 0.6 + b.w * 0.5, 14, 0, 0, TAU); ctx.fill();
    }
    // bodies back → front (each card drawn over the previous one it leans on)
    for (let i = 8; i >= 0; i--) drawBody(ctx, B[i], R.cards[i], i === 8);
    // impact dust at each first hit
    for (let i = 0; i < 8; i++) {
      const b = B[i]; if (b.tHit < 0 || tt < b.tHit) continue;
      const d = tt - b.tHit, cxp = b.px + b.h * Math.sin(b.th), cyp = -b.h * Math.cos(b.th);
      ctx.save(); ctx.globalAlpha = clamp(1 - d * 4); ctx.strokeStyle = P1.ink; ctx.lineWidth = 6; ctx.lineCap = 'round';
      for (let j = 0; j < 5; j++) { const a = -0.9 + j * 0.45; ctx.beginPath(); ctx.moveTo(cxp + Math.cos(a) * (20 + d * 300), cyp + Math.sin(a) * (20 + d * 300)); ctx.lineTo(cxp + Math.cos(a) * (50 + d * 380), cyp + Math.sin(a) * (50 + d * 380)); ctx.stroke(); }
      ctx.restore();
    }
    if (sign.tGround > 0 && tt > sign.tGround) {
      const d = tt - sign.tGround;
      paperBurst(ctx, sign.px + sign.h * 0.7, -10, d, 30, 71, ['#9C7A52', '#C9A57A', P1.cream, P1.red], 1200, 2600, 22);
      ctx.save(); ctx.globalAlpha = clamp(1 - d * 2.5); ctx.fillStyle = 'rgba(201,165,122,0.5)';
      for (let j = 0; j < 9; j++) { ctx.beginPath(); ctx.arc(sign.px + j * 70, -20 - d * 60, 40 + d * 200, 0, TAU); ctx.fill(); }
      ctx.restore();
    }
    // flying NO that starts the chain
    if (tt < 0.5) {
      const u = clamp((t - 16.24) / (T0 - 16.24));
      const hitX = B[0].px - CW - 60, hitY = -300;
      let nx = lerp(hitX - 900, hitX, ease.inQuad(u)), ny = hitY, rot = -0.2;
      if (tt > 0) { nx = hitX - tt * 900; ny = hitY - tt * 1400 + tt * tt * 5000; rot = -0.2 - tt * 8; }
      ctx.save(); ctx.translate(nx, ny); ctx.rotate(rot); ctx.globalAlpha = clamp(1 - (tt - 0.25) * 5);
      printType(ctx, 'NO', 0, 0, 300, { fill: P1.red, shadow: P1.ink, off: 0.05, stroke: P1.cream, strokeW: 14 });
      ctx.restore();
    }
    // CURSOR alone at the end of the line
    const mx = sign.px + 820;
    const shrug = clamp((t - 16.76) / 0.12);
    let P, eyes = 'normal', mouth = 'o';
    if (shrug > 0) { P = pose('shrug', t); P.armL = [lerp(-120, -175, shrug), lerp(70, -50, shrug)]; P.armR = [lerp(120, 175, shrug), lerp(70, -50, shrug)]; eyes = 'happy'; mouth = 'flat'; }
    else { P = pose('idle', t); P.look = [-1, 0]; }
    drawMascot(ctx, { x: mx, y: 0, s: 1.15, t, P, eyes, mouth, squash: shrug > 0 ? 0.12 * wobble(t - 16.76, 4, 6) : 0, rot: shrug > 0 ? 0.06 * Math.sin((t - 16.76) * 10) * (1 - shrug * 0.5) : 0, sticker: true });
    ctx.restore();

    // header: THE TEAM → strike → NO TEAM
    if (t < 16.7) {
      const k = ease.outBack(clamp((t - 16.27) / 0.12), 2);
      ctx.save(); ctx.translate(W / 2 - 60, 250); ctx.rotate(-0.04); ctx.scale(k, k);
      printType(ctx, 'THE TEAM', 0, 0, 200, { fill: P1.ink, shadow: P1.red, off: 0.05, stroke: P1.cream, strokeW: 14 });
      font(ctx, 200, 'Anton'); const tw = ctx.measureText('THE ').width, full = ctx.measureText('THE TEAM').width;
      const st = clamp((t - 16.58) / 0.08);
      if (st > 0) { ctx.strokeStyle = P1.red; ctx.lineWidth = 26; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-full / 2 - 20, 10); ctx.lineTo(-full / 2 - 20 + (tw + 20) * st, -14 * st); ctx.stroke(); }
      ctx.restore();
    }
    if (t >= 16.7) {
      const d = t - 16.7, k = ease.outBack(clamp(d / 0.12), 2.4);
      ctx.save(); ctx.translate(W / 2 - 60, 250); ctx.rotate(-0.04); ctx.scale(k, k);
      printType(ctx, 'NO TEAM', 0, 0, 230, { fill: P1.ink, shadow: P1.red, off: 0.05, stroke: P1.cream, strokeW: 16 });
      ctx.restore();
    }
    E.fx.shake = shake * 24 + (tt >= 0 && tt < 0.06 ? 10 : 0);
    E.fx.zoom += shake * 0.03;
  },
};
