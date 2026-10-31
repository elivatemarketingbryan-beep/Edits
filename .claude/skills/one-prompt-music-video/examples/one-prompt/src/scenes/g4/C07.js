// C07 — "Claude made the motion," · Rainbow onion skin.
// CURSOR hops across a sunburst stage; 12 onion-skin echoes (the same character evaluated at earlier
// moments of its own dance) trail behind it in rainbow candy colours, with an animator's spacing chart.
// MOTION is drawn on as an outline, then on "motion" (46.80) it fills and the echoes fan wide.
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, seg, font, hash, wobble } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { drawMascot } from '../../core/mascot.js';
import { C, RAINBOW12, sunburst, cornerDots, sparkle, confetti } from './_util.js';

const S = shot('C07');
const T_MOTION = 46.80, T_HIT = 46.86;
const GROUND = 880, TY = 425, TS = 320;

// trajectory: travels left→right, hopping on every half-beat (a bouncing-ball arc per hop)
function pos(t) {
  const x = 960 + (t - 46.48) * 1080;
  const b = A.beat(t), hp = (b.phase * 2) % 1, big = t > 46.58 && t < T_HIT + 0.001;
  let hgt = Math.sin(Math.PI * hp) * 170;
  if (big) hgt = Math.sin(Math.PI * clamp((t - 46.58) / (T_HIT - 46.58))) * 320; // the big leap onto the downbeat
  const land = Math.exp(-((hp < 0.5 ? hp : 1 - hp) * b.len * 0.5) * 40); // squash near the ground
  return { x, y: GROUND - hgt, sq: land * 0.22 - (1 - land) * 0.06, rot: Math.sin(Math.PI * hp) * 0.25 - 0.08 };
}

export default {
  ...S,
  cutIn: 'punch',
  sfx: [{ t: T_HIT, type: 'impact', gain: 0.9 }, { t: 46.28, type: 'swoosh', gain: 0.5 }],
  draw(ctx, t, s, E) {
    const lt = s.lt, hitAge = t - T_HIT, hit = hitAge >= 0;
    const kick = A.pulse('beat', t, 0.18);
    const P = pos(t);
    const camX = -(P.x - 960) * 0.42;
    const push = 1 + lt * 0.05 + (hit ? 0.05 * ease.outExpo(hitAge / 0.3) : 0);

    // ---------- background: sunburst + halftone ----------
    ctx.save();
    ctx.translate(960, 540); ctx.scale(push, push); ctx.rotate(Math.sin(lt * 1.3) * 0.015); ctx.translate(-960, -540);
    const rayRot = lt * 0.35 + (hit ? ease.outExpo(hitAge / 0.4) * 0.6 : 0);
    sunburst(ctx, 960 + camX * 0.3, 1180, 36, rayRot, '#FF5CA0', C.pink);
    cornerDots(ctx, 'rgba(123,47,247,0.22)', 28, 11, 960, 640, 0.35, camX * 0.3, 0);

    // ---------- MOTION title: outline drawn on, then fills + rainbow extrusion on the word ----------
    ctx.save();
    ctx.translate(camX * 0.25, 0);
    const ty = TY;
    font(ctx, TS, 'Anton'); ctx.letterSpacing = '18px'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    const fill = hit ? ease.outExpo(hitAge / 0.12) : 0;
    const spread = hit ? ease.outBack(hitAge / 0.3, 2.2) : seg(t, 46.6, T_HIT) * 0.3;
    // rainbow echo outlines (the type's own onion skin)
    for (let k = 7; k >= 1; k--) {
      const dx = -k * (6 + 16 * spread), dy = k * (4 + 7 * spread);
      ctx.strokeStyle = RAINBOW12[(k * 2 + Math.floor(lt * 12)) % 12]; ctx.lineWidth = 9;
      ctx.globalAlpha = clamp(seg(lt, 0.05 + k * 0.03, 0.2 + k * 0.03)) * (0.55 + 0.45 * fill);
      if (fill > 0) { ctx.fillStyle = RAINBOW12[(k * 2) % 12]; ctx.fillText('MOTION', 960 + dx, ty + dy); }
      ctx.strokeText('MOTION', 960 + dx, ty + dy);
    }
    ctx.globalAlpha = 1;
    ctx.letterSpacing = '0px';
    ctx.restore();
    // small kicker line
    ctx.save(); ctx.translate(camX * 0.25, 0);
    const kIn = ease.outBack(seg(lt, 0.02, 0.22));
    ctx.translate(960, 172); ctx.scale(kIn, kIn); ctx.rotate(-0.03);
    font(ctx, 46, 'JetBrains Mono', '800'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const kicker = 'CLAUDE MADE THE';
    const kw = ctx.measureText(kicker).width + 50;
    ctx.fillStyle = C.ink; ctx.fillRect(-kw / 2 + 8, -34 + 8, kw, 68);
    ctx.fillStyle = C.yellow; ctx.fillRect(-kw / 2, -34, kw, 68);
    ctx.fillStyle = C.ink; ctx.fillText(kicker, 0, 2);
    ctx.restore();

    // ---------- the stage ----------
    ctx.save(); ctx.translate(camX, 0);
    // spacing chart: the path of the centre with frame ticks
    const dt = hit ? lerp(0.075, 0.03, ease.inOutCubic(hitAge / 0.16)) : lerp(0.045, 0.075, seg(t, 46.2, T_HIT));
    ctx.strokeStyle = 'rgba(31,42,85,0.55)'; ctx.lineWidth = 4; ctx.setLineDash([2, 14]); ctx.lineCap = 'round';
    ctx.beginPath();
    for (let k = 0; k <= 60; k++) { const q = pos(t - (k / 60) * 12 * dt); const yy = q.y - 150; k ? ctx.lineTo(q.x, yy) : ctx.moveTo(q.x, yy); }
    ctx.stroke(); ctx.setLineDash([]);
    // ground shadows
    for (let k = 12; k >= 0; k--) {
      const q = pos(t - k * dt), hh = clamp((GROUND - q.y) / 420);
      ctx.fillStyle = `rgba(110,10,70,${0.22 * (1 - hh * 0.7) * (k ? 0.5 : 1)})`;
      ctx.beginPath(); ctx.ellipse(q.x, GROUND + 6, 110 * (1 - hh * 0.4), 18, 0, 0, TAU); ctx.fill();
    }
    // onion-skin echoes: oldest first
    for (let k = 12; k >= 1; k--) {
      const te = t - k * dt, q = pos(te);
      const col = RAINBOW12[(12 - k) % 12];
      drawMascot(ctx, { x: q.x, y: q.y, s: 1.08 - k * 0.012, t: te, pose: 'dance', style: 'silhouette', colors: { ink: col }, rot: q.rot, squash: q.sq });
      // tick + frame number on the chart
      const yy = q.y - 150;
      ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(q.x, yy, 7, 0, TAU); ctx.fill();
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(q.x, yy, 4, 0, TAU); ctx.fill();
    }
    ctx.save();
    ctx.translate(camX * 0.25 - camX, 0);
    font(ctx, TS, 'Anton'); ctx.letterSpacing = '18px'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    // draw-on stroke
    const draw = ease.outCubic(seg(lt, 0.0, 0.55));
    ctx.setLineDash([2400 * draw + 1, 99999]);
    ctx.strokeStyle = C.ink; ctx.lineWidth = 22; ctx.strokeText('MOTION', 960, ty + 10);
    ctx.strokeStyle = C.cream; ctx.lineWidth = 11; ctx.strokeText('MOTION', 960, ty);
    ctx.setLineDash([]);
    if (fill > 0) {
      ctx.globalAlpha = fill; ctx.fillStyle = C.cream; ctx.fillText('MOTION', 960, ty);
      ctx.globalAlpha = 1;
      // gloss band
      ctx.save(); ctx.beginPath(); ctx.rect(-W, ty - 120, W * 3, 36); ctx.clip();
      ctx.fillStyle = 'rgba(255,225,77,0.9)'; ctx.fillText('MOTION', 960, ty);
      ctx.restore();
    }
    ctx.letterSpacing = '0px';
    ctx.restore();

    // the hero
    drawMascot(ctx, { x: P.x, y: P.y, s: 1.1, t, pose: 'dance', sticker: true, rot: P.rot, squash: P.sq + (hit ? wobble(hitAge, 5, 7) * 0.25 : 0), mouth: 'auto', eyes: hit && hitAge < 0.12 ? 'happy' : 'normal' });
    // landing shockwave
    if (hit) {
      const u = ease.outCubic(hitAge / 0.3);
      ctx.strokeStyle = C.yellow; ctx.lineWidth = 16 * (1 - u) + 2; ctx.beginPath(); ctx.ellipse(P.x, GROUND + 6, 120 + 520 * u, 22 + 70 * u, 0, 0, TAU); ctx.stroke();
      for (let i = 0; i < 10; i++) {
        const a = Math.PI + (i / 9) * Math.PI, r = 180 + 260 * u;
        ctx.strokeStyle = i % 2 ? C.cream : C.yellow; ctx.lineWidth = 12 * (1 - u);
        ctx.beginPath(); ctx.moveTo(P.x + Math.cos(a) * r * 0.6, GROUND - 120 + Math.sin(a) * r * 0.6); ctx.lineTo(P.x + Math.cos(a) * r, GROUND - 120 + Math.sin(a) * r); ctx.stroke();
      }
    }
    ctx.restore();

    // ---------- confetti + sparkles ----------
    if (hit) {
      confetti(ctx, { x: 960 + (P.x - 960) * 0.58, y: GROUND - 80, ang: -Math.PI / 2, spread: 2.6, speed: 2300, n: 70, seed: 707, size: 26, colors: RAINBOW12 }, hitAge);
    }
    for (let i = 0; i < 14; i++) {
      const ph = (lt * 1.7 + hash(i, 3)) % 1;
      const x = hash(i, 1) * W, y = 140 + hash(i, 2) * 760;
      sparkle(ctx, x, y, (12 + 18 * hash(i, 4)) * Math.sin(Math.PI * ph) * (1 + kick * 0.6), lt * 2 + i, i % 3 ? C.cream : C.yellow);
    }
    ctx.restore();

    // ---------- fx ----------
    if (hit && hitAge < 0.25) { E.fx.shake = 16 * (1 - hitAge / 0.25); E.fx.zoom += 0.04 * Math.exp(-hitAge / 0.06); E.fx.rgb = 7 * Math.exp(-hitAge / 0.08); }
    if (hit && hitAge < 0.04) E.fx.flash = [1, 0.97, 0.85, 0.2];
    E.fx.zoom += kick * 0.008;
    E.fx.saturation = 1.08;
  },
};
