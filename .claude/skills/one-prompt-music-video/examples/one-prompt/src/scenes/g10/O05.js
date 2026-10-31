// O05 — "Come alive" — BACK TO A CURSOR. The bookend of the intro's birth: CURSOR sings its last "come alive"
// (real lip-sync) in front of a huge COME ALIVE, then closes its eyes with a little contented smile, its rubber-hose
// limbs zip back into the body (legs, then arms, with anticipation), the face melts away, and the body snaps
// into a plain, glowing orange block cursor while sparks spiral back into it — then it just blinks.
// A custom re-implementation of the mascot renderer lets every part (limb length, glove size, outline, gloss,
// corner radius, gradient, face) be interpolated continuously.
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, seg, hash, font, roundRect, wobble } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { drawMascot, MASCOT as M } from '../../core/mascot.js';
import { softRays, motes, inOutSine } from './common.js';

const S = shot('O05');
const T0 = S.start;                   // 155.18
const W_COME = 155.18, W_ALIVE = 155.513, V_END = 155.86;
const SC = 1.62, CX = 960, CY = 520;  // body centre on screen during the whole shot
export const END_BLOCK = { x: 960, y: 520, w: 118, h: 214 };
/** shared blink for the plain cursor (also used by O06) */
export const cursorOn = (t) => Math.floor((t - 156.78) / 0.3) % 2 === 0;

function limb(ctx, x0, y0, x1, y1, bend, w) {
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(mx - (dy / L) * bend, my + (dx / L) * bend, x1, y1);
  ctx.lineWidth = w; ctx.strokeStyle = M.ink; ctx.lineCap = 'round'; ctx.stroke();
}

/**
 * CURSOR, parameterised for the morph (body units, centred on the body).
 * o: {P, legK, armK (0 = full limbs → 1 = retracted), closed 0..1 (lid), calm 0..1 (closed lids curve into ‿),
 *     face 0..1, outline 0..1, grad 0..1, gloss 0..1, bw, bh, rad, sq, glow}
 */
function drawMorph(ctx, t, o) {
  const P = o.P;
  ctx.save();
  ctx.translate(o.cx, o.cy); ctx.scale(o.s, o.s); ctx.rotate(P.rot || 0);
  const lw = 14;
  // legs (behind)
  if (o.legK < 1) {
    const k = 1 - o.legK, hipY = M.BH / 2 - 8;
    const f1x = lerp(-40, P.legL[0], k), f1y = lerp(hipY, P.legL[1], k), f2x = lerp(40, P.legR[0], k), f2y = lerp(hipY, P.legR[1], k);
    limb(ctx, -40, hipY, f1x, f1y - 10 * k, 10 * k, lw * Math.sqrt(k)); limb(ctx, 40, hipY, f2x, f2y - 10 * k, -10 * k, lw * Math.sqrt(k));
    ctx.fillStyle = M.ink;
    ctx.beginPath(); ctx.ellipse(f1x - 10, f1y - 8, 34 * k, 18 * k, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(f2x + 10, f2y - 8, 34 * k, 18 * k, 0, 0, TAU); ctx.fill();
  }
  // body (squash anchored at the bottom)
  const sx = 1 + o.sq * 0.55, sy = 1 - o.sq * 0.55;
  ctx.save();
  ctx.translate(0, o.bh / 2); ctx.scale(sx, sy); ctx.translate(0, -o.bh / 2);
  if (o.glow > 0) { ctx.save(); ctx.shadowColor = `rgba(255,106,31,${0.9 * o.glow})`; ctx.shadowBlur = 70 * o.glow; ctx.fillStyle = '#FF6A1F'; roundRect(ctx, -o.bw / 2, -o.bh / 2, o.bw, o.bh, o.rad); ctx.fill(); ctx.restore(); }
  roundRect(ctx, -o.bw / 2, -o.bh / 2, o.bw, o.bh, o.rad);
  const g = ctx.createLinearGradient(0, -o.bh / 2, 0, o.bh / 2);
  const mixc = (a) => { const A_ = parseInt(a.slice(1), 16), k = o.grad; return `rgb(${lerp(255, (A_ >> 16) & 255, k) | 0},${lerp(106, (A_ >> 8) & 255, k) | 0},${lerp(31, A_ & 255, k) | 0})`; };
  g.addColorStop(0, mixc(M.bodyTop)); g.addColorStop(0.55, M.body); g.addColorStop(1, mixc(M.bodyBot));
  ctx.fillStyle = g; ctx.fill();
  if (o.outline > 0.01) { ctx.lineWidth = 8 * o.outline; ctx.strokeStyle = M.ink; ctx.stroke(); }
  if (o.gloss > 0.01) {
    ctx.fillStyle = `rgba(255,255,255,${0.45 * o.gloss})`;
    roundRect(ctx, -o.bw / 2 + 16, -o.bh / 2 + 14, 22, 70 * Math.min(1, o.bh / 230), 11); ctx.fill();
    roundRect(ctx, -o.bw / 2 + 16, -o.bh / 2 + 92 * Math.min(1, o.bh / 230), 22, 16, 8); ctx.fill();
  }
  // face
  if (o.face > 0.01) {
    const f = o.face, eyeY = -48 * f, eyeX = 38 * f;
    ctx.save(); ctx.scale(f, f); ctx.globalAlpha *= clamp(f * 1.5);
    for (const ex of [-38, 38]) {
      if (o.closed < 0.98) {
        const eh = 50 * (1 - o.closed);
        roundRect(ctx, ex - 19, -48 - eh / 2, 38, Math.max(eh, 4), 14); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = M.ink; ctx.stroke();
        if (eh > 14) { const ph = Math.min(28, eh - 12); roundRect(ctx, ex - 8, -48 - ph / 2, 16, ph, 4); ctx.fillStyle = M.ink; ctx.fill(); ctx.beginPath(); ctx.arc(ex - 2, -48 - ph / 2 + 6, 3.5, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill(); }
      } else {
        // closed lid: flat line → contented ‿ curve
        ctx.beginPath(); ctx.lineWidth = 8; ctx.strokeStyle = M.ink; ctx.lineCap = 'round';
        const c = o.calm; ctx.moveTo(ex - 18, -42); ctx.quadraticCurveTo(ex, -42 + 16 * c, ex + 18, -42); ctx.stroke();
      }
    }
    ctx.fillStyle = 'rgba(255,60,110,0.42)'; ctx.beginPath(); ctx.ellipse(-62, 2, 16, 10, 0, 0, TAU); ctx.ellipse(62, 2, 16, 10, 0, 0, TAU); ctx.fill();
    ctx.lineWidth = 7; ctx.strokeStyle = M.ink; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(0, 4, 24, Math.PI * 0.18, Math.PI * 0.82); ctx.stroke();
    ctx.fillStyle = 'rgba(31,42,85,0.85)'; ctx.font = '800 40px "JetBrains Mono"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(Math.floor(t * 2) % 2 === 0 ? '>_' : '> ', 0, 78);
    ctx.restore();
  }
  ctx.restore();
  // arms (in front)
  if (o.armK < 1) {
    const k = 1 - o.armK;
    const ax = (sx0, tx, ty) => [lerp(sx0, tx, k), lerp(8, ty, k)];
    const [a1x, a1y] = ax(-M.BW / 2 + 6, P.armL[0], P.armL[1]), [a2x, a2y] = ax(M.BW / 2 - 6, P.armR[0], P.armR[1]);
    limb(ctx, -M.BW / 2 + 6, 8, a1x, a1y, -16 * k, lw * Math.sqrt(k)); limb(ctx, M.BW / 2 - 6, 8, a2x, a2y, 16 * k, lw * Math.sqrt(k));
    for (const [gx, gy] of [[a1x, a1y], [a2x, a2y]]) { ctx.beginPath(); ctx.arc(gx, gy, 22 * k, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 6 * k; ctx.strokeStyle = M.ink; ctx.stroke(); }
  }
  ctx.restore();
}

export default {
  ...S,
  cutIn: 'punch',
  sfx: [{ t: 155.2, type: 'whoosh', gain: 0.5 }, { t: 156.2, type: 'zap', gain: 0.5 }, { t: 156.62, type: 'click', gain: 0.9 }],
  draw(ctx, t, s, E) {
    const lt = t - T0;
    const hit = A.pulse('beat', t, 0.2);
    const fadeWorld = ease.inOutCubic(seg(t, 156.2, 157.1));   // the world calms down to plain dawn white

    // ---- background: bright dawn ----
    const bg = ctx.createRadialGradient(CX, CY - 40, 60, CX, CY, 1150);
    bg.addColorStop(0, '#FFF7EC'); bg.addColorStop(0.35, '#FFD9B5'); bg.addColorStop(0.75, '#FFB07A'); bg.addColorStop(1, '#FF9E5E');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    softRays(ctx, 'O05', CX, CY, { n: 20, rot: lt * 0.18, len: 2300, width: 0.06, col: [255, 250, 235], alpha: 0.55, seed: 8, blur: 4, comp: 'source-over' });
    // breathing rings
    ctx.save(); ctx.lineWidth = 3;
    for (let k = 0; k < 6; k++) {
      const r = ((lt * 160 + k * 170) % 1020) + 60;
      ctx.strokeStyle = `rgba(255,140,80,${0.22 * (1 - r / 1080) * (1 - fadeWorld * 0.7)})`; ctx.beginPath(); ctx.arc(CX, CY, r, 0, TAU); ctx.stroke();
    }
    ctx.restore();

    // ---- COME ALIVE (behind) ----
    const comeK = ease.outBack(seg(t, W_COME, W_COME + 0.2), 1.8), aliveK = ease.outBack(seg(t, W_ALIVE, W_ALIVE + 0.2), 1.8);
    const typeOut = ease.inBack(seg(t, 156.0, 156.45));
    if (typeOut < 1) {
      ctx.save(); ctx.globalAlpha = 1 - typeOut;
      ctx.translate(CX, CY); ctx.scale(1 + typeOut * 0.4 + 0.015 * hit, 1 + typeOut * 0.4 + 0.015 * hit); ctx.translate(-CX, -CY);
      font(ctx, 400, 'Anton'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const word = (str, y, k, dx) => {
        if (k <= 0) return;
        ctx.save(); ctx.translate(CX + dx, y); ctx.scale(k, k);
        ctx.fillStyle = 'rgba(232,90,30,0.35)'; ctx.fillText(str, 12, 14);
        ctx.fillStyle = '#FFF4E6'; ctx.fillText(str, 0, 0);
        ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(255,106,31,0.9)'; ctx.strokeText(str, 0, 0);
        ctx.restore();
      };
      word('COME', 300, comeK, -60); word('ALIVE', 770, aliveK, 60);
      ctx.restore();
    }

    // ---- CURSOR ----
    // custom pose: arms open wide while singing, lowering to the sides as it settles
    const sway = Math.sin(lt * 4.2) * 0.06;
    const settle = ease.inOutCubic(seg(t, V_END - 0.05, V_END + 0.3));
    const v = A.env('vocal', t);
    const P = {
      armL: [lerp(-185, -122, settle), lerp(-70 - v * 50, 80, settle)], armR: [lerp(185, 122, settle), lerp(-70 - v * 50, 80, settle)],
      legL: [-46, 185], legR: [46, 185], squash: 0, rot: sway * (1 - settle), bob: 0, look: [0, -0.1], lean: 0,
    };
    const closed = ease.inOutQuad(seg(t, V_END + 0.02, V_END + 0.17));
    const calm = ease.outBack(seg(t, V_END + 0.17, V_END + 0.4));
    const sigh = Math.sin(clamp(seg(t, V_END + 0.1, V_END + 0.6)) * Math.PI) * 0.08;
    const legK = ease.inBack(seg(t, 156.12, 156.38), 2.2), armK = ease.inBack(seg(t, 156.22, 156.48), 2.2);
    const m = ease.outBack(seg(t, 156.42, 156.7), 1.4);              // block snap
    const faceK = 1 - ease.inQuad(seg(t, 156.3, 156.5));
    const pop = t >= 156.42 ? wobble(t - 156.42, 5, 7) * 0.12 : 0;
    const bwS = lerp(M.BW, END_BLOCK.w / SC, m), bhS = lerp(M.BH, END_BLOCK.h / SC, m);
    // after the snap, the plain cursor blinks
    const blinkOn = t < 156.78 || cursorOn(t);
    if (t < V_END) {
      // the last line, lip-synced, with the core renderer
      drawMascot(ctx, { x: CX, y: CY + M.FEET * SC, s: SC, t, P, mouth: 'auto', eyes: 'normal', look: [0, -0.1], sticker: false });
    } else if (blinkOn) {
      drawMorph(ctx, t, {
        P, cx: CX, cy: CY, s: SC, legK, armK, closed, calm, face: faceK, outline: 1 - m, grad: 1 - m, gloss: 1 - clamp(m * 1.5),
        bw: bwS, bh: bhS, rad: lerp(38, 3, m), sq: -sigh + pop, glow: clamp(m * 1.2),
      });
    }

    // sonar pings each time the plain cursor blinks on
    if (t >= 156.7) {
      for (let k = 0; k < 4; k++) {
        const tOn = 156.78 + Math.floor((t - 156.78) / 0.6) * 0.6 - k * 0.6; if (tOn < 156.5) continue;
        const a = t - tOn; if (a < 0) continue;
        const rr = 80 + a * 900, al = Math.max(0, 0.5 - a * 0.45);
        ctx.save(); ctx.strokeStyle = `rgba(255,106,31,${al})`; ctx.lineWidth = 6; ctx.beginPath();
        roundRect(ctx, CX - END_BLOCK.w / 2 - rr * 0.55, CY - END_BLOCK.h / 2 - rr * 0.55, END_BLOCK.w + rr * 1.1, END_BLOCK.h + rr * 1.1, 30 + rr * 0.3); ctx.stroke(); ctx.restore();
      }
    }

    // sparks spiralling back into the cursor
    const sp = seg(t, 156.1, 156.75);
    if (sp > 0 && sp < 1) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 110; i++) {
        const st = hash(i, 71) * 0.45, u = clamp((sp - st) / 0.55);
        if (u <= 0 || u >= 1) continue;
        const a0 = hash(i, 72) * TAU, r0 = 260 + hash(i, 73) * 520;
        const r = r0 * (1 - ease.inCubic(u)), a = a0 + u * 3.2;
        const x = CX + Math.cos(a) * r, y = CY + Math.sin(a) * r * 0.8;
        const sz = 3 + 5 * hash(i, 74);
        ctx.fillStyle = i % 3 ? `rgba(255,140,50,${0.9 * (1 - u * 0.3)})` : `rgba(255,220,120,${0.9})`;
        ctx.beginPath(); ctx.arc(x, y, sz * (1 - u * 0.5), 0, TAU); ctx.fill();
      }
      ctx.restore();
    }

    motes(ctx, t, { n: 34, seed: 81, col: [255, 200, 150], alpha: 0.5 * (1 - fadeWorld * 0.7), size: [3, 18], speed: 24 });

    // FX
    E.fx.bloom = 0.12 + 0.2 * clamp(m); E.fx.bloomThreshold = 0.92; E.fx.vignette = 0.22;
    const ak = t >= W_ALIVE ? Math.exp(-(t - W_ALIVE) * 10) : 0;
    E.fx.zoom += 0.03 * ak + (t >= 156.42 ? 0.025 * Math.exp(-(t - 156.42) * 12) : 0);
    E.fx.shake = 8 * ak;
    if (t >= 156.42 && t < 156.6) E.fx.rgb = 5 * Math.exp(-(t - 156.42) * 15);
  },
};
