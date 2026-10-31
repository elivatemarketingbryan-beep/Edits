// K03 · "yeah, it's breaking all the rules" — the VIDEO ITSELF breaks. The whole picture — including a live
// replica of the HUD (core drawHUD rendered into our own buffer, engine HUD off) and the frame border — is one
// buffer. CURSOR punches the glass on "breaking" (spider-web crack), blocks slip + datamosh-smear on the snare,
// RULES splits in half on "all the", and on "rules" the frame tears into rectangles that fall away (gravity +
// spin) revealing the backstage: this scene's own source code.
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, seg, hash, rng, font, buf, bctx, roundRect } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { drawMascot } from '../../core/mascot.js';
import { drawHUD } from '../../core/hud.js';
import { K, chromeText } from './lib7.js';

const S = shot('K03');
const T_PUNCH = 90.62, T_HIT = 90.70, T_SNARE = 90.81, T_SPLIT = 91.08, T_FALL = 91.22;
const IMPACT = [1010, 520];

const CODE = `// K03.js — the frame breaks
export default {
  ...shot('K03'), hud: 'none',
  draw(ctx, t, s, E) {
    const pic = buf('K03-pic', W, H);
    paintPicture(bctx(pic), t, E);      // world + HUD replica
    drawHUD(px, t, E.frame, E.nFrames, S, s.idx);
    if (t > T_HIT) crack(px, IMPACT, t - T_HIT);
    for (const b of blocks) {
      const age = t - b.fall;           // gravity + spin
      const y = b.y + 0.5 * 9000 * age * age;
      ctx.translate(b.cx, y); ctx.rotate(b.w * age);
      ctx.drawImage(pic, b.x, b.y, b.w, b.h, ...);
    }
    E.fx.glitch = 0.6; E.fx.rgb = 14;   // break all the rules
  },
};`;

let BL = null, CR = null;
function blocks() {
  if (BL) return BL;
  const r = rng(903), out = [];
  const split = (x, y, w, h, d) => {
    if (d > 5 || (w * h < 60000 && d > 2) || (r() < 0.15 && d > 3)) { out.push({ x, y, w, h }); return; }
    if (w > h * 1.2 || (w > h * 0.8 && r() < 0.5)) { const k = Math.round(w * r.range(0.3, 0.7)); split(x, y, k, h, d + 1); split(x + k, y, w - k, h, d + 1); }
    else { const k = Math.round(h * r.range(0.3, 0.7)); split(x, y, w, k, d + 1); split(x, y + k, w, h - k, d + 1); }
  };
  split(0, 0, W, H, 0);
  for (const b of out) {
    const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
    const d = Math.hypot(cx - IMPACT[0], cy - IMPACT[1]);
    b.fall = T_FALL + d * 0.00009 + hash(b.x, b.y) * 0.04;
    const dx = (cx - IMPACT[0]) / (d + 1), dy = (cy - IMPACT[1]) / (d + 1);
    b.vx = dx * (2000 + hash(b.x, 3) * 1400); b.vy = dy * (1500 + hash(b.y, 4) * 1000) - 300;
    b.w0 = (hash(b.x, b.y, 5) - 0.5) * 7;
    b.slip = hash(b.x, b.y, 6) < 0.35 ? (hash(b.x, 7) - 0.5) * 120 : 0;
    b.mosh = hash(b.x, b.y, 8) < 0.18;
  }
  BL = out; return out;
}
function cracks() {
  if (CR) return CR;
  const r = rng(77), rays = [];
  const n = 15;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + r.range(-0.15, 0.15), pts = [[0, 0]];
    let rr = 0;
    while (rr < 1500) { rr += r.range(50, 140); const aa = a + r.range(-0.12, 0.12); pts.push([Math.cos(aa) * rr, Math.sin(aa) * rr]); }
    rays.push(pts);
  }
  const rings = [];
  for (let k = 1; k <= 5; k++) {
    const rad = k * k * 26 + 40;
    for (let i = 0; i < n; i++) {
      if (r() < 0.25) continue;
      const a0 = (i / n) * TAU, a1 = ((i + 1) / n) * TAU, rj = rad * r.range(0.85, 1.15);
      rings.push([[Math.cos(a0) * rj, Math.sin(a0) * rj], [Math.cos((a0 + a1) / 2) * rj * 0.93, Math.sin((a0 + a1) / 2) * rj * 0.93], [Math.cos(a1) * rj * r.range(0.9, 1.1), Math.sin(a1) * rj * r.range(0.9, 1.1)]]);
    }
  }
  CR = { rays, rings }; return CR;
}

function drawCrack(x, age) {
  const { rays, rings } = cracks();
  const grow = ease.outExpo(clamp(age / 0.09));
  x.save(); x.translate(IMPACT[0], IMPACT[1]);
  x.lineJoin = 'round'; x.lineCap = 'round';
  // shattered core
  const cg = x.createRadialGradient(0, 0, 0, 0, 0, 120); cg.addColorStop(0, 'rgba(255,255,255,0.95)'); cg.addColorStop(0.4, 'rgba(230,240,255,0.5)'); cg.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = cg; x.beginPath(); x.arc(0, 0, 120 * grow, 0, TAU); x.fill();
  const pass = (col, lw, ox, oy) => {
    x.strokeStyle = col; x.lineWidth = lw;
    x.beginPath();
    for (const pts of rays) { const L = Math.max(2, Math.floor(pts.length * grow)); x.moveTo(pts[0][0] + ox, pts[0][1] + oy); for (let i = 1; i < L; i++) x.lineTo(pts[i][0] + ox, pts[i][1] + oy); }
    for (const pts of rings) { if (Math.hypot(pts[0][0], pts[0][1]) > 1500 * grow) continue; x.moveTo(pts[0][0] + ox, pts[0][1] + oy); x.lineTo(pts[1][0] + ox, pts[1][1] + oy); x.lineTo(pts[2][0] + ox, pts[2][1] + oy); }
    x.stroke();
  };
  pass('rgba(26,18,64,0.55)', 7, 3, 4);
  pass('rgba(255,255,255,0.95)', 3.2, 0, 0);
  pass('rgba(62,240,255,0.6)', 1.2, -2, -1);
  x.restore();
}

function paintPicture(x, t, s, E) {
  const lt = s.lt;
  // bright neon world: lilac → cyan sky, chrome perspective grid floor
  const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#9E86FF'); g.addColorStop(0.55, '#E9E2FF'); g.addColorStop(0.56, '#7CFFC4'); g.addColorStop(1, '#3EF0FF');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  // sun disc with stripes
  x.save(); x.beginPath(); x.arc(W / 2, 600, 300, Math.PI, TAU); x.closePath(); x.clip();
  const sg = x.createLinearGradient(0, 300, 0, 600); sg.addColorStop(0, '#FFFFFF'); sg.addColorStop(1, '#FF9AE0'); x.fillStyle = sg; x.fillRect(W / 2 - 300, 300, 600, 300);
  x.fillStyle = '#C9B8FF'; for (let i = 0; i < 6; i++) x.fillRect(W / 2 - 300, 470 + i * 22 + ((lt * 60) % 22), 600, 3 + i * 2);
  x.restore();
  // grid floor
  x.save(); x.strokeStyle = 'rgba(26,18,64,0.35)'; x.lineWidth = 3;
  const hz = 604; x.beginPath();
  for (let i = -20; i <= 20; i++) { x.moveTo(W / 2 + i * 30, hz); x.lineTo(W / 2 + i * 260, H); }
  for (let k = 0; k < 14; k++) { const z = ((k + (lt * 3) % 1) / 14); const y = hz + (H - hz) * z * z; x.moveTo(0, y); x.lineTo(W, y); }
  x.stroke(); x.restore();
  // type: BREAKING ALL THE / RULES (RULES splits in half on "all the")
  const sp = ease.outExpo(seg(t, T_SPLIT, T_SPLIT + 0.25));
  const brk = ease.outBack(seg(t, 90.62, 90.78));
  if (brk > 0) chromeText(x, 'BREAKING ALL THE', W / 2, 205, { size: 80 * brk, family: 'Rubik Mono One', fill: K.deep, stroke: '#FFFFFF', strokeW: 12, shadow: 0 });
  const rulesY = 470;
  x.save(); x.beginPath(); x.rect(0, 0, W, rulesY - 10 + sp * 6); x.clip();
  chromeText(x, 'RULES', W / 2 - sp * 260, rulesY - sp * 30, { size: 420, fill: 'chrome', shadow: 20, skew: -0.08 });
  x.restore();
  x.save(); x.beginPath(); x.rect(0, rulesY - 10 + sp * 6, W, H); x.clip();
  chromeText(x, 'RULES', W / 2 + sp * 260, rulesY + sp * 30, { size: 420, fill: 'chrome', shadow: 20, skew: -0.08 });
  x.restore();
  if (sp > 0) { // glowing cut line
    x.save(); x.globalAlpha = 1 - sp * 0.6; x.fillStyle = '#FFFFFF'; x.shadowColor = '#3EF0FF'; x.shadowBlur = 30; x.fillRect(W / 2 - 900 * sp - 200, rulesY - 12, 1800 * sp + 400, 8); x.restore();
  }
  // CURSOR: wind-up → punch at the camera
  const wind = seg(t, 90.48, T_PUNCH), pu = seg(t, T_PUNCH, T_HIT), rec = seg(t, T_HIT + 0.05, T_HIT + 0.3);
  const P = { armL: [-150, -60], armR: [150, 60], legL: [-60, 185], legR: [55, 185], squash: 0, rot: 0, bob: 0, look: [-0.3, -0.1], lean: 0 };
  if (t < T_PUNCH) { const k = ease.outCubic(wind); P.armR = [lerp(150, 230, k), lerp(60, 20, k)]; P.lean = -0.12 * k; P.rot = 0.12 * k; P.squash = 0.1 * k; P.armL = [-170, lerp(-60, -120, k)]; }
  else { const k = ease.inCubic(pu) * (1 - ease.outCubic(rec)); P.armR = [lerp(230, 40, k), lerp(20, 0, k)]; P.lean = lerp(-0.12, 0.1, k); P.rot = lerp(0.12, -0.08, k); P.squash = -0.06 * k; P.armL = [-200, 40]; }
  const mx = 1290, my = 1010;
  const an = drawMascot(x, { x: mx, y: my, s: 1.45, t, P, mouth: t > T_HIT ? 'open' : 'grin', eyes: t > T_HIT && t < T_HIT + 0.25 ? 'x' : 'normal', sticker: true });
  // the glove flies at the lens
  if (t >= T_PUNCH && t < T_HIT + 0.3) {
    const k = t < T_HIT ? ease.inQuart(pu) : 1 - ease.outCubic(rec);
    const gx = lerp(an.hands.r[0], IMPACT[0], k), gy = lerp(an.hands.r[1], IMPACT[1], k), r = lerp(32, 470, k);
    x.save();
    // speed lines
    x.strokeStyle = 'rgba(26,18,64,0.5)'; x.lineWidth = 6;
    for (let i = 0; i < 18; i++) { const a = (i / 18) * TAU + 0.2, r0 = r * 1.15, r1 = r * (1.5 + hash(i, 3) * 0.8); x.beginPath(); x.moveTo(gx + Math.cos(a) * r0, gy + Math.sin(a) * r0); x.lineTo(gx + Math.cos(a) * r1, gy + Math.sin(a) * r1); x.stroke(); }
    x.beginPath(); x.arc(gx, gy, r, 0, TAU); x.fillStyle = '#FFFFFF'; x.fill(); x.lineWidth = r * 0.16; x.strokeStyle = '#1F2A55'; x.stroke();
    x.beginPath(); x.arc(gx - r * 0.3, gy - r * 0.3, r * 0.25, 0, TAU); x.fillStyle = 'rgba(183,156,255,0.35)'; x.fill();
    x.lineWidth = r * 0.07; x.beginPath(); for (let i = -1; i <= 1; i++) { x.moveTo(gx + i * r * 0.32, gy - r * 0.55); x.lineTo(gx + i * r * 0.32, gy - r * 0.1); } x.stroke();
    x.restore();
  }
  // frame border (part of the picture → it cracks and falls too)
  x.save(); x.strokeStyle = '#FFFFFF'; x.lineWidth = 10; roundRect(x, 22, 22, W - 44, H - 44, 26); x.stroke();
  x.strokeStyle = K.deep; x.lineWidth = 3; roundRect(x, 30, 30, W - 60, H - 60, 22); x.stroke(); x.restore();
  // live replica of the HUD, baked into the picture
  drawHUD(x, t, E.frame, E.nFrames, { ...S, hud: 'ink' }, s.idx);
  if (t >= T_HIT) drawCrack(x, t - T_HIT);
}

function paintBackstage(ctx, t) {
  ctx.fillStyle = '#0E0828'; ctx.fillRect(0, 0, W, H);
  // wire grid
  ctx.strokeStyle = 'rgba(62,240,255,0.16)'; ctx.lineWidth = 2; ctx.beginPath();
  for (let x = 0; x <= W; x += 60) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
  for (let y = 0; y <= H; y += 60) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
  ctx.stroke();
  // the scene's own code
  const lines = CODE.split('\n');
  font(ctx, 30, 'JetBrains Mono', '700'); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  const y0 = 230 - (t - T_FALL) * 60;
  lines.forEach((L, i) => {
    const y = y0 + i * 44; if (y < 140 || y > 940) return;
    const kw = /^\s*(\/\/)/.test(L);
    ctx.fillStyle = kw ? 'rgba(124,255,196,0.75)' : i % 3 === 0 ? '#B79CFF' : '#E9E6FF';
    ctx.fillText(L, 140, y);
  });
  // error badge
  const k = ease.outBack(seg(t, T_FALL + 0.12, T_FALL + 0.3));
  if (k > 0) {
    ctx.save(); ctx.translate(1420, 560); ctx.rotate(-0.06); ctx.scale(k, k);
    ctx.fillStyle = '#FF2A5A'; roundRect(ctx, -330, -120, 660, 240, 20); ctx.fill();
    ctx.lineWidth = 8; ctx.strokeStyle = '#FFFFFF'; ctx.stroke();
    ctx.fillStyle = '#FFFFFF'; font(ctx, 40, 'Press Start 2P'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('ERR 404', 0, -45); font(ctx, 30, 'Press Start 2P'); ctx.fillText('RULES NOT FOUND', 0, 35);
    ctx.restore();
  }
}

export default {
  ...S,
  hud: 'none',
  cutIn: 'none',
  sfx: [{ t: T_HIT, type: 'shatter', gain: 1 }, { t: T_SNARE, type: 'glitch' }, { t: T_FALL, type: 'rip' }],
  draw(ctx, t, s, E) {
    const fx = E.fx;
    const pic = buf('K03-pic', W, H), px = bctx(pic);
    px.setTransform(1, 0, 0, 1, 0, 0); px.globalAlpha = 1;
    paintPicture(px, t, s, E);
    const bl = blocks();
    const falling = t >= T_FALL - 0.01;
    if (falling) paintBackstage(ctx, t);
    // datamosh / slip phase
    const slipK = t >= T_SNARE ? Math.max(Math.exp(-(t - T_SNARE) / 0.09), A.pulse('hat', t, 0.05) * 0.35, 0) * (t > T_SPLIT ? 0.25 : 1) : 0;
    const shiftEvent = Math.floor(t * 15);
    for (const b of bl) {
      const age = t - b.fall;
      ctx.save();
      if (age > 0) {
        const xx = b.x + b.w / 2 + b.vx * age, yy = b.y + b.h / 2 + b.vy * age + 0.5 * 9000 * age * age;
        if (yy - b.h > H + 400) { ctx.restore(); continue; }
        ctx.translate(xx, yy); ctx.rotate(b.w0 * age); const sc = 1 + age * 1.6; ctx.scale(sc, sc);
        ctx.fillStyle = 'rgba(10,6,30,0.45)'; ctx.fillRect(-b.w / 2 + 14, -b.h / 2 + 18, b.w, b.h);
        ctx.drawImage(pic, b.x, b.y, b.w, b.h, -b.w / 2, -b.h / 2, b.w, b.h);
        ctx.lineWidth = 4; ctx.strokeStyle = '#FFFFFF'; ctx.strokeRect(-b.w / 2, -b.h / 2, b.w, b.h);
      } else {
        const slip = slipK * (b.slip + (hash(b.x, shiftEvent) < 0.2 ? (hash(b.y, shiftEvent) - 0.5) * 80 : 0));
        if (b.mosh && slipK > 0.1) {
          // pixel-drag smear: one column stretched across the block
          ctx.drawImage(pic, b.x + b.w * 0.3, b.y, 3, b.h, b.x + slip, b.y, b.w, b.h);
          ctx.globalAlpha = 0.5; ctx.drawImage(pic, b.x, b.y, b.w, b.h, b.x + slip * 2, b.y, b.w, b.h); ctx.globalAlpha = 1;
        } else ctx.drawImage(pic, b.x, b.y, b.w, b.h, b.x + slip, b.y, b.w, b.h);
        if (slip && Math.abs(slip) > 8) { ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = hash(b.x, b.y) < 0.5 ? 'rgba(62,240,255,0.35)' : 'rgba(255,60,170,0.3)'; ctx.fillRect(b.x + slip, b.y, b.w, b.h); ctx.globalCompositeOperation = 'source-over'; }
      }
      ctx.restore();
    }
    // FX
    const hitK = t >= T_HIT ? Math.exp(-(t - T_HIT) / 0.1) : 0;
    fx.shake = 34 * hitK + 10 * (t >= T_FALL ? Math.exp(-(t - T_FALL) / 0.1) : 0);
    fx.rgb = 3 + 16 * hitK + 10 * slipK;
    if (t >= T_HIT && t < T_HIT + 0.034) fx.flash = [1, 1, 1, 0.45];
    fx.glitch = slipK * 0.4 + (t > T_FALL ? 0.1 : 0); fx.glitchSeed = Math.floor(t * 20);
    fx.zoom += hitK * 0.04;
    fx.bloom = 0.25; fx.bloomThreshold = 0.8;
  },
};
