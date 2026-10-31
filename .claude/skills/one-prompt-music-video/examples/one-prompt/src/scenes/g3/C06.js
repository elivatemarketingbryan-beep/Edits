// C06 — "now it's real" — Pop-art REAL!
// A Lichtenstein comic panel slams in: Ben-Day dot fields (animated dot-size waves), black action lines, a
// shocked CURSOR with a thick black ink contour (8-way silhouette dilation) and Ben-Day shading clipped to its
// body, a yellow NOW… caption box and a jagged speech burst IT'S REAL! that pops on "it's" / slams on "real".
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, hash, wobble, buf, bctx, roundRect, halftone } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { drawMascot, pose } from '../../core/mascot.js';

const S = shot('C06');
const T_ITS = 45.42, T_REAL = 45.6, T_SNARE = 45.79;
const INK = '#111111', YEL = '#FFE14D', RED = '#FF2E4D', BLUE = '#2B6BFF';

function burstPath(ctx, cx, cy, rx, ry, n, seed, jag = 0.24) {
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * TAU, k = i % 2 ? 1 - jag - hash(i, seed) * 0.1 : 1 + hash(i, seed + 1) * 0.08;
    const x = cx + Math.cos(a) * rx * k, y = cy + Math.sin(a) * ry * k;
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.closePath();
}

export default {
  ...S,
  cutIn: 'none',
  sfx: [{ t: S.start, type: 'impact', gain: 0.8 }, { t: T_REAL, type: 'pop', gain: 1 }],
  draw(ctx, t, s, E) {
    const lt = s.lt, frame = E.frame;
    const kIn = Math.exp(-lt / 0.1), kR = t >= T_REAL ? Math.exp(-(t - T_REAL) / 0.1) : 0, kS = t >= T_SNARE ? Math.exp(-(t - T_SNARE) / 0.08) : 0;

    // ---------- page outside the panel: red Ben-Day on yellow ----------
    ctx.fillStyle = YEL; ctx.fillRect(0, 0, W, H);
    halftone(ctx, 34, RED, (x, y) => 5 + 7 * (0.5 + 0.5 * Math.sin(x * 0.006 - y * 0.004 + lt * 7)), lt * 60, 0);

    // ---------- the panel ----------
    const k = ease.outBack(clamp(lt / 0.16), 1.8);
    const sc = lerp(1.35, 1, k) * (1 + lt * 0.05) * (1 + 0.03 * kR);
    const rot = lerp(-0.16, -0.025, k) + 0.012 * wobble(t - T_REAL, 5, 7) * (t > T_REAL ? 1 : 0);
    const PWd = 1660, PHt = 880;
    ctx.save();
    ctx.translate(W / 2, H / 2); ctx.rotate(rot); ctx.scale(sc, sc);
    // drop shadow + border
    ctx.fillStyle = INK; ctx.fillRect(-PWd / 2 + 22, -PHt / 2 + 24, PWd, PHt);
    ctx.fillStyle = '#FFF8E6'; ctx.fillRect(-PWd / 2, -PHt / 2, PWd, PHt);
    ctx.save(); ctx.beginPath(); ctx.rect(-PWd / 2, -PHt / 2, PWd, PHt); ctx.clip();
    // panel background: blue Ben-Day sky + yellow/white burst
    ctx.fillStyle = '#BFD8FF'; ctx.fillRect(-PWd / 2, -PHt / 2, PWd, PHt);
    ctx.save(); ctx.translate(-W / 2, -H / 2);
    halftone(ctx, 22, BLUE, (x, y) => { const d = Math.hypot(x - W * 0.42, y - H * 0.58) / 900; return 2 + 7 * clamp(d) * (0.85 + 0.15 * Math.sin(lt * 20 + d * 9)); });
    ctx.restore();
    const bx = -140, by = 60;
    // burst rays
    ctx.save(); ctx.translate(bx, by); ctx.rotate(lt * 0.4);
    for (let i = 0; i < 18; i++) {
      const a0 = (i / 18) * TAU, a1 = a0 + TAU / 36;
      ctx.fillStyle = i % 2 ? YEL : '#FFFFFF';
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a0) * 1400, Math.sin(a0) * 1400); ctx.lineTo(Math.cos(a1) * 1400, Math.sin(a1) * 1400); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    // action lines (black, flickering)
    ctx.fillStyle = INK; ctx.beginPath();
    for (let i = 0; i < 46; i++) {
      const a = hash(i, 7, frame >> 1) * TAU, w = 0.006 + hash(i, 8) * 0.01, r0 = 420 + hash(i, 9, frame >> 1) * 140;
      ctx.moveTo(bx + Math.cos(a) * r0, by + Math.sin(a) * r0);
      ctx.lineTo(bx + Math.cos(a - w) * 1500, by + Math.sin(a - w) * 1500); ctx.lineTo(bx + Math.cos(a + w) * 1500, by + Math.sin(a + w) * 1500); ctx.closePath();
    }
    ctx.fill();

    // ---------- shocked CURSOR with thick ink contour ----------
    const P = pose('idle', t);
    const jolt = ease.outBack(clamp(lt / 0.14), 3);
    P.armL = [-175, -95 - 30 * kR]; P.armR = [175, -95 - 30 * kR]; P.squash = -0.1 * kIn + 0.12 * kR; P.look = [0.15, -0.1]; P.rot = -0.06;
    const ms = 2.15, f = ms / 1.5, mx = bx - 60, my = by + 560 - 60 * (1 - jolt);
    const BW2 = 1100, BH2 = 1200, cb = buf('C06-cur', BW2, BH2), cx2 = bctx(cb);
    cx2.setTransform(1, 0, 0, 1, 0, 0); cx2.clearRect(0, 0, BW2, BH2);
    const ox = BW2 / 2, oy = BH2 - 30;
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; drawMascot(cx2, { x: ox + Math.cos(a) * 15, y: oy + Math.sin(a) * 15, s: ms, t, P, style: 'silhouette', colors: { ink: INK }, glyph: false }); }
    drawMascot(cx2, { x: ox, y: oy, s: ms, t, P, mouth: 'o', eyes: 'normal', blink: 0, colors: { body: '#FF6A1F', ink: INK } });
    // Ben-Day shading on the body (lower-right half)
    cx2.save(); cx2.globalCompositeOperation = 'source-atop'; cx2.fillStyle = 'rgba(200,20,40,0.55)'; cx2.beginPath();
    for (let y = 0; y < BH2; y += 16) for (let x = (y / 16) % 2 ? 8 : 0; x < BW2; x += 16) {
      const sh = clamp((x - 500) / 420 + (y - 640) / 700); const r = 1 + 5.4 * sh; if (r > 1.3) { cx2.moveTo(x + r, y); cx2.arc(x, y, r, 0, TAU); }
    }
    cx2.fill(); cx2.restore();
    ctx.drawImage(cb, mx - ox, my - oy);
    // sweat drops + shock marks
    const sw = ease.outBack(clamp((lt - 0.08) / 0.15), 2);
    for (let i = 0; i < 3; i++) {
      const a = -2.3 + i * 0.32, rr = (300 + i * 26) * f, x = mx + Math.cos(a) * rr * 0.9, y = my - 440 * f + Math.sin(a) * rr * 0.5 - 40;
      ctx.save(); ctx.translate(x, y); ctx.rotate(a + 1.57); ctx.scale(sw, sw);
      ctx.beginPath(); ctx.moveTo(0, -30); ctx.quadraticCurveTo(18, 0, 0, 14); ctx.quadraticCurveTo(-18, 0, 0, -30); ctx.fillStyle = '#9FD4FF'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
      ctx.restore();
    }
    ctx.lineWidth = 12; ctx.strokeStyle = INK; ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) { const a = -1.15 + i * 0.28, r0 = 330 * f, r1 = 420 * f; ctx.beginPath(); ctx.moveTo(mx + Math.cos(a) * r0, my - 380 * f + Math.sin(a) * r0 * 0.6); ctx.lineTo(mx + Math.cos(a) * r1 * sw, my - 380 * f + Math.sin(a) * r1 * 0.6 * sw); ctx.stroke(); }

    // ---------- caption box NOW... ----------
    const cap = ease.outExpo(clamp((lt - 0.04) / 0.18));
    ctx.save(); ctx.translate(-PWd / 2 + 40, -PHt / 2 + 36); ctx.scale(cap, 1);
    ctx.fillStyle = YEL; ctx.fillRect(0, 0, 470, 120); ctx.lineWidth = 8; ctx.strokeStyle = INK; ctx.strokeRect(0, 0, 470, 120);
    ctx.fillStyle = INK; ctx.font = '400 66px "Bungee"'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    const dots = Math.min(3, Math.floor(clamp((lt - 0.1) / 0.3) * 4));
    ctx.fillText('NOW' + '.'.repeat(dots), 30, 64);
    ctx.restore();

    // ---------- speech burst ----------
    const pb = ease.outBack(clamp((t - (T_ITS - 0.04)) / 0.16), 2.4);
    if (pb > 0) {
      const sx = 500, sy = -170, rs = pb * (1 + 0.14 * kR + 0.05 * kS);
      ctx.save(); ctx.translate(sx, sy); ctx.rotate(-0.08 + 0.05 * wobble(t - T_REAL, 6, 8) * (t > T_REAL ? 1 : 0)); ctx.scale(rs, rs);
      // tail to CURSOR's mouth
      ctx.beginPath(); ctx.moveTo(-210, 120); ctx.lineTo(-420, 300); ctx.lineTo(-120, 175); ctx.closePath(); ctx.fillStyle = '#FFFFFF'; ctx.fill(); ctx.lineWidth = 10; ctx.strokeStyle = INK; ctx.stroke();
      burstPath(ctx, 10, 12, 440, 270, 14, 3); ctx.fillStyle = INK; ctx.fill();
      burstPath(ctx, 0, 0, 440, 270, 14, 3); ctx.fillStyle = '#FFFFFF'; ctx.fill(); ctx.lineWidth = 10; ctx.strokeStyle = INK; ctx.stroke();
      ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = '400 74px "Bungee"'; ctx.fillText("IT'S", 0, -88);
      const rr = t >= T_REAL - 0.03 ? ease.outBack(clamp((t - (T_REAL - 0.03)) / 0.12), 3) : 0;
      if (rr > 0) {
        ctx.save(); ctx.translate(0, 40); ctx.rotate(-0.05); ctx.scale(rr * (1 + 0.6 * (1 - clamp((t - T_REAL + 0.03) / 0.08))), rr);
        ctx.font = '400 168px "Bungee"';
        ctx.fillStyle = INK; ctx.fillText('REAL!', 8, 8);
        ctx.fillStyle = RED; ctx.fillText('REAL!', 0, 0);
        ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.strokeText('REAL!', 0, 0);
        ctx.restore();
      }
      ctx.restore();
    }
    ctx.restore(); // clip
    // panel border
    ctx.lineWidth = 16; ctx.strokeStyle = INK; ctx.strokeRect(-PWd / 2, -PHt / 2, PWd, PHt);
    ctx.restore();

    // print misregistration feel
    E.fx.rgb = 5 + 10 * kIn + 12 * kR;
    E.fx.shake = 30 * kIn + 34 * kR + 16 * kS;
    E.fx.zoom = 0.05 * kIn + 0.05 * kR + 0.02 * kS;
    E.fx.flash = [1, 1, 1, 0.3 * kIn];
    E.fx.saturation = 1.15; E.fx.vignette = 0.12; E.fx.grain = 0.06;
  },
};
