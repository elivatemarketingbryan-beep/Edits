// O04 — "Thank you for subbing" — SUBSCRIBE AT SUNRISE. The sun itself rises into frame and morphs into a
// glowing pill button (with a photographic lens flare: anamorphic streak, starburst, iris ghosts along the optical
// axis). THANK slams on "Thank", YOU on "you"; CURSOR sprints in over the clouds, leaps, and STOMPS the button on
// "subbing": squash, shockwave rings, SUBSCRIBED ✓, the bell rings, confetti.
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, seg, hash, font, roundRect, spring, wobble } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { drawMascot } from '../../core/mascot.js';
import { lensFlare, softRays, motes } from './common.js';

const S = shot('O04');
const T0 = S.start;                   // 153.28
const W_THANK = 153.28, W_YOU = 154.16, W_SUB = 154.74;
const BX = 960, BY = 800;             // button centre (final)

function bellPath(ctx, x, y, s, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  ctx.beginPath();
  ctx.moveTo(-22, 14); ctx.quadraticCurveTo(-20, -24, 0, -26); ctx.quadraticCurveTo(20, -24, 22, 14); ctx.lineTo(28, 20); ctx.lineTo(-28, 20); ctx.closePath();
  ctx.fill();
  ctx.beginPath(); ctx.arc(0, 26, 7, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -29, 5, 0, TAU); ctx.fill();
  ctx.restore();
}

function cloudBank(ctx, t, y0, col, seed, speed, scale = 1) {
  ctx.fillStyle = col; ctx.beginPath();
  for (let i = -2; i < 14; i++) {
    const x = ((i * 190 + t * speed) % (16 * 190) + 16 * 190) % (16 * 190) - 380;
    const r = (90 + 60 * hash(i + 20, seed)) * scale;
    ctx.moveTo(x + r, y0); ctx.arc(x, y0 + Math.sin(i * 1.7) * 18, r, 0, TAU);
  }
  ctx.rect(-50, y0, W + 100, H);
  ctx.fill();
}

/** 3D-extruded warm display word */
function bigWord(ctx, str, x, y, size, k, tint) {
  if (k <= 0) return;
  font(ctx, size, 'Anton'); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  const depth = 14;
  ctx.save(); ctx.translate(x, y);
  for (let d = depth; d > 0; d -= 2) { ctx.fillStyle = d > depth - 3 ? 'rgba(20,24,60,0.35)' : '#1F2A55'; ctx.fillText(str, d * 0.7, d); }
  const g = ctx.createLinearGradient(0, -size * 0.75, 0, 0);
  g.addColorStop(0, '#FFE680'); g.addColorStop(0.5, tint); g.addColorStop(1, '#FF6A1F');
  ctx.fillStyle = g; ctx.fillText(str, 0, 0);
  ctx.lineWidth = 5; ctx.strokeStyle = '#1F2A55'; ctx.strokeText(str, 0, 0);
  // gloss band
  ctx.save(); ctx.globalCompositeOperation = 'source-atop'; ctx.restore();
  ctx.restore();
}

export default {
  ...S,
  cutIn: 'punch',
  sfx: [{ t: 153.3, type: 'impact', gain: 0.8 }, { t: 154.18, type: 'impact', gain: 0.6 }, { t: 154.45, type: 'swoosh', gain: 0.6 }, { t: 154.74, type: 'pop', gain: 1 }, { t: 154.78, type: 'bell', gain: 0.8 }],
  draw(ctx, t, s, E) {
    const lt = t - T0;
    const hit = A.pulse('beat', t, 0.16);
    const pressed = t >= W_SUB ? t - W_SUB : -1;

    // camera: slow push + recoil on the stomp
    const z = 1 + lt * 0.025 + (pressed >= 0 ? 0.05 * Math.exp(-pressed * 7) : 0);
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2);

    // ---- sky ----
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#1F7AD6'); g.addColorStop(0.5, '#5DB8F5'); g.addColorStop(0.82, '#A9DDFF'); g.addColorStop(1, '#FFE0A8');
    ctx.fillStyle = g; ctx.fillRect(-60, -60, W + 120, H + 120);

    // the sun rises then becomes the button
    const rise = ease.outBack(seg(t, T0, T0 + 0.34), 1.2);
    const morph = ease.outBack(seg(t, T0 + 0.34, T0 + 0.7), 1.6);
    const sy = lerp(1180, BY, rise);
    const bw = lerp(300, 820, morph), bh = lerp(300, 176, morph);
    const press = pressed >= 0 ? (pressed < 0.06 ? pressed / 0.06 : Math.max(0, 1 - spring(pressed - 0.06, 5, 0.35))) : 0;
    const by = sy + press * 22, bsy = 1 - press * 0.16, bsx = 1 + press * 0.08;

    // god rays + glow behind the sun/button
    softRays(ctx, 'O04', BX, sy, { n: 18, rot: lt * 0.25, len: 2300, width: 0.07, col: [255, 248, 220], alpha: 0.38 + 0.2 * hit, seed: 6, blur: 4 });
    const halo = ctx.createRadialGradient(BX, sy, 60, BX, sy, 900);
    halo.addColorStop(0, 'rgba(255,250,225,0.8)'); halo.addColorStop(0.3, 'rgba(255,230,160,0.28)'); halo.addColorStop(1, 'rgba(255,220,150,0)');
    ctx.fillStyle = halo; ctx.fillRect(-60, -60, W + 120, H + 120);

    // clouds
    cloudBank(ctx, t, 990, 'rgba(255,255,255,0.65)', 3, -40, 1.0);
    cloudBank(ctx, t, 1040, '#FFFFFF', 7, 70, 1.15);

    // ---- the button ----
    ctx.save(); ctx.translate(BX, by); ctx.scale(bsx, bsy);
    const r = bh / 2;
    // glow
    ctx.save(); ctx.shadowColor = pressed >= 0 ? 'rgba(143,211,255,0.9)' : 'rgba(255,200,90,0.95)'; ctx.shadowBlur = 70 + 30 * hit;
    const redK = clamp((morph - 0.12) / 0.4);
    roundRect(ctx, -bw / 2, -bh / 2, bw, bh, r);
    ctx.fillStyle = pressed >= 0 ? '#1F2A55' : redK > 0 ? '#E8343F' : '#FFD23F'; ctx.fill();
    ctx.restore();
    if (redK > 0) {
      // depth + gloss
      ctx.save(); roundRect(ctx, -bw / 2, -bh / 2, bw, bh, r); ctx.clip();
      ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(-bw / 2, bh * 0.18, bw, bh);
      const gl = ctx.createLinearGradient(0, -bh / 2, 0, 0); gl.addColorStop(0, 'rgba(255,255,255,0.45)'); gl.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gl; roundRect(ctx, -bw / 2 + 18, -bh / 2 + 10, bw - 36, bh * 0.42, bh * 0.2); ctx.fill();
      const sx = lerp(-bw, bw, ((lt * 0.9) % 1.4) / 1.4);
      const sh = ctx.createLinearGradient(sx - 60, 0, sx + 60, 0); sh.addColorStop(0, 'rgba(255,255,255,0)'); sh.addColorStop(0.5, 'rgba(255,255,255,0.35)'); sh.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = sh; ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
      ctx.restore();
      ctx.lineWidth = 8 * redK; ctx.strokeStyle = '#1F2A55'; roundRect(ctx, -bw / 2, -bh / 2, bw, bh, r); ctx.stroke();
      const la = clamp((morph - 0.4) / 0.3);
      ctx.globalAlpha = la;
      font(ctx, 92, 'Anton'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const label = pressed >= 0 ? 'SUBSCRIBED ✓' : 'SUBSCRIBE';
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillText(label, -34 + 4, 8);
      ctx.fillStyle = '#FFFBF4'; ctx.fillText(label, -34, 4);
      const ring = pressed >= 0 ? wobble(pressed, 5, 3) * 0.6 : Math.sin(lt * 9) * 0.06;
      ctx.fillStyle = pressed >= 0 ? '#FFD23F' : '#FFFBF4';
      bellPath(ctx, bw / 2 - 78, -2, 1.25, ring);
      ctx.globalAlpha = 1;
    }
    if (redK < 1) {
      // the sun's face, fading as it becomes the button
      ctx.globalAlpha = 1 - redK;
      const sg = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(bw, bh) / 2);
      sg.addColorStop(0, '#FFFFFF'); sg.addColorStop(0.45, '#FFF2B0'); sg.addColorStop(0.85, '#FFD23F'); sg.addColorStop(1, '#FFB000');
      ctx.fillStyle = sg; roundRect(ctx, -bw / 2, -bh / 2, bw, bh, r); ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.restore();

    // shockwave rings on the stomp
    if (pressed >= 0) {
      for (let k = 0; k < 3; k++) {
        const pk = pressed - k * 0.07; if (pk < 0) continue;
        const rr = 120 + pk * 1500, a = Math.max(0, 0.7 - pk * 1.6);
        ctx.save(); ctx.translate(BX, BY); ctx.scale(1, 0.42);
        ctx.lineWidth = 16 - k * 4; ctx.strokeStyle = `rgba(255,251,244,${a})`; ctx.beginPath(); ctx.arc(0, 0, rr, 0, TAU); ctx.stroke(); ctx.restore();
      }
    }

    // ---- THANK YOU ----
    const thankK = ease.outBack(seg(t, W_THANK, W_THANK + 0.22), 2);
    const youK = ease.outBack(seg(t, W_YOU, W_YOU + 0.2), 2);
    font(ctx, 236, 'Anton');
    const wT = ctx.measureText('THANK').width, wY = ctx.measureText('YOU').width, gap = 60;
    const x0 = W / 2 - (wT + gap + wY) / 2, yb = 345;
    const bounce = 1 + 0.03 * hit;
    if (thankK > 0) {
      ctx.save(); ctx.translate(x0 + wT / 2, yb - 90); ctx.scale(thankK * bounce, thankK * bounce); ctx.rotate(-0.04 * (1 - thankK)); ctx.translate(-(x0 + wT / 2), -(yb - 90));
      bigWord(ctx, 'THANK', x0, yb, 236, thankK, '#FFC24A'); ctx.restore();
    }
    if (youK > 0) {
      const dy = lerp(-500, 0, youK);
      ctx.save(); ctx.translate(x0 + wT + gap + wY / 2, yb - 90 + dy); ctx.scale(bounce, bounce); ctx.rotate(0.05 * (1 - youK)); ctx.translate(-(x0 + wT + gap + wY / 2), -(yb - 90));
      bigWord(ctx, 'YOU', x0 + wT + gap, yb, 236, youK, '#FF9E5E'); ctx.restore();
    }

    // ---- CURSOR: sprint, leap, stomp ----
    if (t >= W_YOU - 0.02) {
      let mx, my, poseName, sq = 0, rot = 0, mouth = 'grin', eyes = 'normal';
      const runEnd = 154.45, top = BY - 176 / 2 + press * 22 - 4;
      if (t < runEnd) { const u = ease.outCubic(seg(t, W_YOU - 0.02, runEnd)); mx = lerp(2150, 1520, u); my = 1015; poseName = 'run'; }
      else if (pressed < 0) {
        const u = seg(t, runEnd, W_SUB); mx = lerp(1520, BX, u); my = lerp(1015, top, u) - Math.sin(u * Math.PI) * 330; poseName = 'jump'; sq = -0.14; rot = -0.25 + u * 0.25; mouth = 'open';
      } else {
        mx = BX; my = top; poseName = 'cheer'; sq = 0.3 * wobble(pressed, 4, 6); eyes = pressed < 0.25 ? 'star' : 'happy';
      }
      drawMascot(ctx, { x: mx, y: my, s: 0.74, t, pose: poseName, squash: sq, rot, mouth, eyes, sticker: true });
    }

    // confetti burst from the button
    if (pressed >= 0) {
      for (let i = 0; i < 90; i++) {
        const a = -Math.PI * (0.1 + 0.8 * hash(i, 51)), v = 700 + hash(i, 52) * 1100, tt = pressed;
        const px = BX + Math.cos(a) * v * tt + (hash(i, 55) - 0.5) * 600 * 0.3, py = BY - 60 + Math.sin(a) * v * tt + 1300 * tt * tt;
        const sz = 9 + hash(i, 53) * 14;
        ctx.save(); ctx.translate(px, py); ctx.rotate(tt * (5 + hash(i, 54) * 12) + i); ctx.scale(1, Math.cos(tt * 14 + i));
        ctx.fillStyle = ['#FFD23F', '#E8343F', '#FFFBF4', '#FF6A1F', '#1F2A55', '#8FD3FF'][i % 6]; ctx.fillRect(-sz / 2, -sz * 0.3, sz, sz * 0.6); ctx.restore();
      }
    }

    // lens flare from the sun-button (the light source is its upper-left gloss)
    const fl = clamp(rise) * (pressed >= 0 ? 0.6 + 0.6 * Math.exp(-pressed * 5) : 0.85 + 0.25 * hit);
    lensFlare(ctx, BX - bw / 2 + bh * 0.32, sy - bh * 0.3, fl, { t, streak: 1.1, ghosts: 1, star: 0.6, tint: [255, 210, 150], core: 0.35 });
    motes(ctx, t, { n: 30, seed: 61, col: [255, 250, 230], alpha: 0.45, size: [3, 20], speed: 26 });
    ctx.restore();

    // FX
    E.fx.bloom = 0.2; E.fx.bloomThreshold = 0.9; E.fx.vignette = 0.2; E.fx.saturation = 1.1;
    const thk = t >= W_THANK ? Math.exp(-(t - W_THANK) * 12) : 0, yk = t >= W_YOU ? Math.exp(-(t - W_YOU) * 12) : 0;
    E.fx.shake = 10 * thk + 8 * yk; E.fx.zoom += 0.02 * (thk + yk);
    if (pressed >= 0) { const k = Math.exp(-pressed * 9); E.fx.shake += 18 * k; E.fx.rgb = 7 * k; E.fx.flash = [1, 0.97, 0.88, 0.45 * k]; }
  },
};
