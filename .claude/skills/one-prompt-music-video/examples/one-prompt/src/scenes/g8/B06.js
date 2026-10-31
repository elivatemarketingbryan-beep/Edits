// B06 — "One guy, no sponsors, nothing to sell" — the high-five.
// The geometric guy (navy hoodie, faceless) and CURSOR leap at each other; time is re-mapped through a speed
// ramp (1× → 0.1× → 1×) so the contact plays in slow motion with echo trails, a comic burst, slow shock rings and
// drifting sparkles. The shock ring knocks the floating "sponsor" badges away; a price tag spins in and gets
// crossed out on "sell".
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, seg, rng, font, hash, rays, wobble, star } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { drawMascot, pose } from '../../core/mascot.js';
import { BP, drawGuy, glowSprite, sparkle, roundRect } from './kit.js';

const S = shot('B06');
const T0 = S.start, LEAP = 115.97, HIT = 116.5, NOSP = 116.84, NOTH = 117.64, SELL = 118.04;
const GROUND = 935, GS = 0.98, MS = 0.98;

// ---- speed ramp → action time ----
const speed = (t) => 1 - 0.9 * ease.inOutQuad(seg(t, 116.24, 116.46)) + 0.9 * ease.inOutQuad(seg(t, 116.98, 117.24));
let AT = null;
function actionTime(t) {
  if (!AT) { AT = new Float32Array(400); let a = 0; for (let i = 0; i < 400; i++) { AT[i] = a; a += speed(T0 + i / 120) / 120; } }
  const f = clamp((t - T0) * 120, 0, 398.999), i = Math.floor(f);
  return T0 + lerp(AT[i], AT[i + 1], f - i);
}
const aLeap = () => actionTime(LEAP), aHit = () => actionTime(HIT);

// hand offsets (body units) used at contact
const GUY_HAND = [96, -322], CUR_HAND = [-128, -262];
const C = [960, 372]; // contact point on screen

function guyState(a) {
  const al = aLeap(), ah = aHit(), aLand = ah + (ah - al) * 0.95;
  const x0 = 560, xEnd = 620;
  const xc = C[0] - GS * GUY_HAND[0] - 6, yc = C[1] - GS * (GUY_HAND[1] - 200);
  if (a < al) { const cr = ease.outQuad(seg(a, al - 0.2, al)); return { x: x0, y: GROUND, squash: 0.22 * cr, armL: [-110, 60 + 30 * cr], armR: [110, 60 + 30 * cr], phase: 'stand' }; }
  if (a < ah) { const u = (a - al) / (ah - al); const e = ease.outQuad(u);
    return { x: lerp(x0, xc, u), y: lerp(GROUND, yc, e), squash: -0.1 * (1 - u), armL: [-120, 40 - 60 * u], armR: [lerp(110, GUY_HAND[0], ease.outCubic(u * 1.4)), lerp(60, GUY_HAND[1], ease.outCubic(u * 1.4))], legL: [-50, 180], legR: [40, 170], phase: 'air' }; }
  if (a < aLand) { const u = (a - ah) / (aLand - ah);
    return { x: lerp(xc, xEnd, u), y: lerp(yc, GROUND, ease.inQuad(u)), squash: 0, armL: [-130, -40], armR: [lerp(GUY_HAND[0], 150, u), lerp(GUY_HAND[1], -200, u)], legL: [-55, 175], legR: [45, 165], phase: 'air' }; }
  const v = a - aLand; const sq = 0.25 * wobble(v, 3.5, 6);
  const pump = Math.abs(Math.sin(v * 7)) * (v > 0.15 ? 1 : 0);
  return { x: xEnd, y: GROUND, squash: sq, armL: [-110, 80], armR: [130, -180 - 60 * pump], phase: 'land' };
}
function curState(a, t) {
  const al = aLeap(), ah = aHit(), aLand = ah + (ah - al) * 0.95;
  const x0 = 1370, xEnd = 1320, rotC = -0.12;
  const hx = CUR_HAND[0], hy = CUR_HAND[1];
  // hand world = x + s(hx cos r − hy sin r), y + s(−185 + hx sin r + hy cos r)
  const cr = Math.cos(rotC), sr = Math.sin(rotC);
  const xc = C[0] - MS * (hx * cr - hy * sr) + 6, yc = C[1] - MS * (-185 + hx * sr + hy * cr);
  if (a < al) { const k = ease.outQuad(seg(a, al - 0.2, al)); return { x: x0, y: GROUND, rot: 0, squash: 0.22 * k, pose: 'idle', P: null, phase: 'stand' }; }
  if (a < ah) { const u = (a - al) / (ah - al), e = ease.outQuad(u);
    const P = pose('jump', t); P.armL = [lerp(-150, hx, ease.outCubic(u * 1.4)), lerp(-60, hy, ease.outCubic(u * 1.4))]; P.armR = [150, -120]; P.squash = -0.08;
    return { x: lerp(x0, xc, u), y: lerp(GROUND, yc, e), rot: rotC * u, P, phase: 'air' }; }
  if (a < aLand) { const u = (a - ah) / (aLand - ah);
    const P = pose('jump', t); P.armL = [lerp(hx, -160, u), lerp(hy, -190, u)]; P.armR = [160, -150]; P.squash = -0.06;
    return { x: lerp(xc, xEnd, u), y: lerp(yc, GROUND, ease.inQuad(u)), rot: rotC * (1 - u), P, phase: 'air' }; }
  const v = a - aLand;
  return { x: xEnd, y: GROUND, rot: 0, squash: 0.25 * wobble(v, 3.5, 6), pose: 'cheer', P: null, phase: 'land' };
}

function drawCur(ctx, st, t, alpha = 1, eyes) {
  const o = { x: st.x, y: st.y, s: MS, t, rot: st.rot, sticker: alpha > 0.9, alpha, eyes: eyes || (st.phase === 'stand' ? 'normal' : 'star'), mouth: st.phase === 'stand' ? 'smile' : 'open', squash: st.squash || 0 };
  if (st.P) o.P = st.P; else o.pose = st.pose;
  drawMascot(ctx, o);
}

const BADGES = [['YOUR AD HERE', -700, 10, -0.12], ['SPONSORED', 720, -20, 0.1], ['PROMO CODE', -760, 270, 0.08], ['#AD', 790, 260, -0.15], ['BUY NOW', -640, 470, 0.06], ['BRAND DEAL', 640, 480, -0.08]];

export default {
  ...S,
  cutIn: 'punch',
  sfx: [{ t: LEAP, type: 'swoosh', gain: 0.6 }, { t: HIT, type: 'impact', gain: 1 }, { t: HIT + 0.02, type: 'boom', gain: 0.6 }, { t: SELL, type: 'stamp', gain: 0.9 }],
  draw(ctx, t, s, E) {
    const lt = t - T0, a = actionTime(t), beat = A.pulse('beat', t, 0.2);
    const slow = 1 - speed(t) / 1; // 0..0.9
    const hitK = t >= HIT ? Math.exp(-(t - HIT) * 2.2) : 0, hitSnap = t >= HIT ? Math.exp(-(t - HIT) * 14) : 0;
    const zoom = 1 + 0.16 * ease.inOutCubic(seg(t, 116.05, HIT)) - 0.16 * ease.inOutCubic(seg(t, 116.95, 117.45)) + 0.03 * hitSnap;
    ctx.setTransform(zoom, 0, 0, zoom, C[0] * (1 - zoom), C[1] * (1 - zoom));

    // ---- background ----
    const g = ctx.createLinearGradient(0, -200, 0, GROUND);
    g.addColorStop(0, '#8E7BEA'); g.addColorStop(0.45, '#E58CCB'); g.addColorStop(0.8, '#FF9F9A'); g.addColorStop(1, '#FFC27A');
    ctx.fillStyle = g; ctx.fillRect(-400, -400, W + 800, GROUND + 400);
    ctx.save(); ctx.globalCompositeOperation = 'soft-light';
    rays(ctx, C[0], C[1], 36, 2600, lt * 0.15 + (t > HIT ? (t - HIT) * 0.4 : 0), `rgba(255,250,235,${0.35 + 0.4 * hitK})`, 'rgba(255,250,235,0)');
    ctx.restore();
    // floor
    const fg = ctx.createLinearGradient(0, GROUND - 20, 0, H + 300); fg.addColorStop(0, '#FFB79A'); fg.addColorStop(1, '#FFD9BC');
    ctx.fillStyle = fg; ctx.fillRect(-400, GROUND - 20, W + 800, H + 600);
    ctx.fillStyle = 'rgba(122,46,96,0.25)'; ctx.fillRect(-400, GROUND - 20, W + 800, 5);

    // ---- impact glow + comic burst (behind the characters) ----
    if (t >= HIT) {
      const gs = glowSprite('#FFF1C2', 256); ctx.globalCompositeOperation = 'screen'; const R = 600 + 900 * (1 - hitK);
      ctx.globalAlpha = 0.9 * hitK + 0.2; ctx.drawImage(gs, C[0] - R / 2, C[1] - R / 2, R, R); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      const kb = ease.outBack(seg(t, HIT, HIT + 0.12), 2.5) * (1 - ease.inQuad(seg(t, 117.1, 117.4)));
      if (kb > 0) {
        ctx.save(); ctx.translate(C[0], C[1]); ctx.rotate((t - HIT) * 0.3); ctx.scale(kb, kb);
        star(ctx, 0, 0, 330, 190, 14, 0); ctx.fillStyle = '#7A2E60'; ctx.translate(10, 12); ctx.fill(); ctx.translate(-10, -12);
        star(ctx, 0, 0, 330, 190, 14, 0); ctx.fillStyle = '#FFD24D'; ctx.fill(); ctx.lineWidth = 10; ctx.strokeStyle = BP.ink; ctx.stroke();
        star(ctx, 0, 0, 200, 120, 14, 0.12); ctx.fillStyle = '#FFF4EA'; ctx.fill();
        ctx.restore();
      }
    }

    // ---- sponsor badges knocked away by the shock ring ----
    const ringR = t >= HIT ? 60 + 1700 * ease.outCubic(seg(t, HIT, HIT + 1.1)) : -1;
    for (let i = 0; i < BADGES.length; i++) {
      const [txt, bx, by, br] = BADGES[i];
      const d = Math.hypot(bx, by), hitT = ringR > d ? 1 : 0;
      const app = ease.outBack(seg(lt, 0.05 + i * 0.05, 0.3 + i * 0.05));
      if (app <= 0) continue;
      let x = C[0] + bx + Math.sin(t * 1.7 + i) * 10, y = C[1] + by + Math.cos(t * 1.3 + i) * 8, rot = br + Math.sin(t * 2 + i) * 0.05;
      let tk = 0;
      if (hitT) { // time since the ring reached it
        const tr = HIT + 1.1 * (Math.acos(1 - clamp((d - 60) / 1700)) / (Math.PI / 2)) * 0; // approx
        tk = Math.max(0, t - (HIT + (d - 60) / 1700 * 0.45));
        const vx = (bx / d) * 1400, vy = (by / d) * 1400 - 300;
        x += vx * tk; y += vy * tk + 900 * tk * tk; rot += tk * 9 * (i % 2 ? 1 : -1);
      }
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(app, app);
      font(ctx, 40, 'Bricolage Grotesque', '800'); const tw = ctx.measureText(txt).width + 60;
      roundRect(ctx, -tw / 2 + 6, -36 + 8, tw, 72, 36); ctx.fillStyle = '#7A2E60'; ctx.fill();
      roundRect(ctx, -tw / 2, -36, tw, 72, 36); ctx.fillStyle = '#FFFBF4'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = BP.ink; ctx.stroke();
      ctx.fillStyle = BP.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, 0, 2);
      if (tk > 0) { const k = clamp(tk * 8); ctx.strokeStyle = '#E8343F'; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-tw / 2 + 10, 20); ctx.lineTo(-tw / 2 + 10 + (tw - 20) * k, -20); ctx.stroke(); }
      ctx.restore();
    }

    // ---- characters (+ slow-mo echo trails) ----
    const gst = guyState(a), cst = curState(a, t);
    for (const [st, isGuy] of [[gst, true], [cst, false]]) {
      const shY = GROUND + 8, hgt = clamp((GROUND - st.y) / 400);
      ctx.fillStyle = `rgba(122,46,96,${0.3 * (1 - hgt * 0.6)})`; ctx.beginPath(); ctx.ellipse(st.x, shY, 120 * (1 - hgt * 0.5), 18 * (1 - hgt * 0.5), 0, 0, TAU); ctx.fill();
    }
    if (t > 116.05 && t < 117.35) {
      const trailK = clamp(seg(t, 116.05, 116.3)) * (1 - seg(t, 117.1, 117.35));
      for (let k = 4; k >= 1; k--) {
        const ae = a - k * 0.045;
        const tint = ['#FF5C93', '#FFB000', '#C9B6FF', '#FFF4EA'][k - 1];
        drawGuy(ctx, { ...guyState(ae), s: GS, alpha: 0.16 * trailK * (5 - k) / 4, hood: tint, hoodHi: tint, skin: tint, pants: tint });
        const cs2 = curState(ae, t);
        drawMascot(ctx, { x: cs2.x, y: cs2.y, s: MS, t, rot: cs2.rot, P: cs2.P || pose('idle', t), style: 'silhouette', colors: { ink: tint }, alpha: 0.16 * trailK * (5 - k) / 4 });
      }
    }
    drawGuy(ctx, { ...gst, s: GS });
    drawCur(ctx, cst, t);

    // ---- impact rings, speed lines, sparkles ----
    if (t >= HIT) {
      const tau = t - HIT, ta = a - aHit();
      ctx.save();
      for (let k = 0; k < 3; k++) {
        const r = 40 + 1500 * ease.outCubic(seg(tau, k * 0.07, 1.0 + k * 0.1));
        const w = 26 * (1 - seg(tau, k * 0.07, 1.0 + k * 0.1));
        if (w <= 0.5) continue;
        ctx.lineWidth = w; ctx.strokeStyle = k === 1 ? '#FF5C93' : '#FFFBF4'; ctx.beginPath(); ctx.arc(C[0], C[1], r, 0, TAU); ctx.stroke();
      }
      // speed lines
      ctx.strokeStyle = '#FFFBF4'; ctx.lineCap = 'round';
      for (let i = 0; i < 28; i++) {
        const ang = (i / 28) * TAU + hash(i, 2) * 0.2, r0 = 170 + 200 * ease.outCubic(seg(tau, 0, 0.6)) + hash(i, 3) * 60, len = 140 * (1 - seg(tau, 0.1, 0.8)) * (0.6 + hash(i, 4));
        if (len < 2) continue;
        ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(C[0] + Math.cos(ang) * r0, C[1] + Math.sin(ang) * r0); ctx.lineTo(C[0] + Math.cos(ang) * (r0 + len), C[1] + Math.sin(ang) * (r0 + len)); ctx.stroke();
      }
      // sparkles drifting in action time (slow-mo)
      for (let i = 0; i < 30; i++) {
        const ang = hash(i, 11) * TAU, v = 260 + hash(i, 12) * 900, d = v * ta * 3.2, gy = 600 * ta * ta;
        const x = C[0] + Math.cos(ang) * d, y = C[1] + Math.sin(ang) * d + gy;
        const sz = (16 + hash(i, 13) * 30) * (1 - seg(tau, 0.9, 1.6));
        if (sz <= 0) continue;
        sparkle(ctx, x, y, sz, ta * 6 + i); ctx.fillStyle = ['#FFD24D', '#FFFBF4', '#FF8FB1'][i % 3]; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = BP.ink; ctx.stroke();
      }
      ctx.restore();
    }

    // ---- price tag: spins in, crossed out on "sell" ----
    if (t > 117.45) {
      const tt = t - 117.45;
      const drop = ease.outBack(seg(tt, 0, 0.28), 1.6);
      const swing = 0.35 * Math.exp(-tt * 2.5) * Math.sin(tt * 9) + (t > SELL ? 0.12 * Math.exp(-(t - SELL) * 6) * Math.sin((t - SELL) * 40) : 0);
      const spin = TAU * 1.5 * (1 - ease.outCubic(seg(tt, 0, 0.55)));
      const px = C[0] + 30, py = lerp(-300, 560, drop);
      ctx.save();
      ctx.strokeStyle = BP.ink; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(px, -100); ctx.lineTo(px + Math.sin(swing) * 10, py - 150); ctx.stroke();
      ctx.translate(px, py - 150); ctx.rotate(swing); ctx.translate(0, 150);
      ctx.scale(Math.cos(spin) || 0.001, 1);
      const back = Math.cos(spin) < 0;
      ctx.beginPath(); ctx.moveTo(-200, -60); ctx.lineTo(-60, -150); ctx.lineTo(60, -150); ctx.lineTo(200, -60); ctx.lineTo(200, 130); ctx.lineTo(-200, 130); ctx.closePath();
      ctx.save(); ctx.translate(8, 10); ctx.fillStyle = '#7A2E60'; ctx.fill(); ctx.restore();
      ctx.fillStyle = back ? '#FFD24D' : '#FFF4D6'; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = BP.ink; ctx.stroke();
      ctx.beginPath(); ctx.arc(0, -105, 18, 0, TAU); ctx.fillStyle = '#E58CCB'; ctx.fill(); ctx.stroke();
      if (!back) {
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = BP.ink;
        font(ctx, 150, 'Anton'); ctx.fillText('$99', 0, 30);
        font(ctx, 34, 'JetBrains Mono', '800'); ctx.fillText('FOR SALE', 0, -52);
        if (t > SELL - 0.02) { // red marker cross-out
          const k1 = ease.outCubic(seg(t, SELL - 0.02, SELL + 0.08)), k2 = ease.outCubic(seg(t, SELL + 0.06, SELL + 0.16));
          ctx.strokeStyle = '#E8343F'; ctx.lineWidth = 22; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(-170, -110); ctx.lineTo(-170 + 340 * k1, -110 + 220 * k1); ctx.stroke();
          if (k2 > 0) { ctx.beginPath(); ctx.moveTo(170, -110); ctx.lineTo(170 - 340 * k2, -110 + 220 * k2); ctx.stroke(); }
        }
      }
      ctx.restore();
      // NOT FOR SALE stamp
      if (t > SELL + 0.1) {
        const ks = seg(t, SELL + 0.1, SELL + 0.2), sc = lerp(2.2, 1, ease.outQuad(ks));
        ctx.save(); ctx.translate(px + 10, py + 40); ctx.rotate(-0.16); ctx.scale(sc, sc); ctx.globalAlpha = clamp(ks * 3);
        ctx.lineWidth = 10; ctx.strokeStyle = '#E8343F'; roundRect(ctx, -250, -62, 500, 124, 16); ctx.stroke();
        ctx.lineWidth = 4; roundRect(ctx, -236, -48, 472, 96, 10); ctx.stroke();
        font(ctx, 84, 'Anton'); ctx.fillStyle = '#E8343F'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('NOT FOR SALE', 0, 4);
        ctx.restore();
      }
    }

    // ---- display type ----
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const words = [[115.74, NOSP, 'ONE GUY,', 150], [NOSP, NOTH, 'NO SPONSORS,', 1770], [NOTH, 999, 'NOTHING TO SELL', 960]];
    for (const [a0, a1, wd, xx] of words) {
      if (t < a0 || t > a1 + 0.06) continue;
      const kin = ease.outBack(seg(t, a0 + 0.03, a0 + 0.19), 2), kout = ease.inQuad(seg(t, a1 - 0.06, a1 + 0.05));
      const sc = kin * (1 - kout); if (sc <= 0.01) continue;
      ctx.save(); font(ctx, 150, 'Anton');
      const al = xx < 400 ? 'left' : xx > 1500 ? 'right' : 'center';
      ctx.textAlign = al; ctx.textBaseline = 'middle';
      ctx.translate(xx, 262); ctx.scale(sc, sc); ctx.rotate(-0.03);
      ctx.lineJoin = 'round'; ctx.lineWidth = 22; ctx.strokeStyle = BP.ink; ctx.strokeText(wd, 0, 0);
      ctx.fillStyle = '#FF5C93'; ctx.fillText(wd, 8, 9); ctx.fillStyle = '#FFFBF4'; ctx.fillText(wd, 0, 0);
      ctx.restore();
    }
    // hand-drawn arrow: ONE GUY → the guy
    {
      const k = ease.outCubic(seg(t, 115.86, 116.1)) * (1 - seg(t, 116.3, 116.45));
      if (k > 0) {
        ctx.save(); ctx.strokeStyle = '#FFFBF4'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        const p0 = [330, 350], p1 = [360, 520], p2 = [470, 600];
        ctx.beginPath(); ctx.moveTo(p0[0], p0[1]);
        const N = 20; for (let i = 1; i <= N * k; i++) { const u = i / N; ctx.lineTo((1 - u) * (1 - u) * p0[0] + 2 * u * (1 - u) * p1[0] + u * u * p2[0], (1 - u) * (1 - u) * p0[1] + 2 * u * (1 - u) * p1[1] + u * u * p2[1]); }
        ctx.stroke();
        if (k > 0.95) { ctx.beginPath(); ctx.moveTo(p2[0] - 46, p2[1] - 4); ctx.lineTo(p2[0], p2[1]); ctx.lineTo(p2[0] - 22, p2[1] - 42); ctx.stroke(); }
        ctx.restore();
      }
    }
    // slow-mo readout
    if (slow > 0.05) {
      ctx.save(); ctx.globalAlpha = clamp(slow * 1.5); font(ctx, 30, 'JetBrains Mono', '800'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const sp = speed(t);
      roundRect(ctx, W / 2 - 170, 860, 340, 56, 28); ctx.fillStyle = 'rgba(31,42,85,0.85)'; ctx.fill();
      ctx.fillStyle = '#FF5C93'; ctx.beginPath(); ctx.arc(W / 2 - 130, 888, 10, 0, TAU); ctx.fill();
      ctx.fillStyle = '#FFFBF4'; ctx.fillText(`SLOW-MO ×${sp.toFixed(2)}`, W / 2 + 14, 889);
      ctx.restore();
    }

    E.fx.bloom = 0.2 + 0.6 * hitK; E.fx.bloomThreshold = 0.8;
    if (t >= HIT) { E.fx.flash = [1, 0.97, 0.9, 0.85 * hitSnap]; E.fx.shake = 22 * hitSnap; E.fx.rgb = 10 * hitSnap; }
    E.fx.saturation = 1 + 0.15 * slow;
    if (t > SELL + 0.1 && t < SELL + 0.25) E.fx.shake = 10 * (1 - (t - SELL - 0.1) / 0.15);
  },
};
