// C09 — "On autopilot," · Flight through paper clouds.
// Multiplane 2.5D flight: 10 depth layers of paper-cut clouds (parallax ∝ 1/z, near layers pre-blurred
// for depth of field), a sunset-pop sky with turning rays, speed lines, and CURSOR in superhero fly pose
// with a fluttering cape, towing a cloth banner AUTOPILOT ✓ (strip-rendered travelling wave).
// Big moment: the downbeat 49.27 — sonic boom, the camera kicks into a speed boost.
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, seg, font, hash, buf, bctx, roundRect, wobble } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { drawMascot } from '../../core/mascot.js';
import { C, sparkle } from './_util.js';
import { drawSky, drawClouds, cloudSprites } from './_sky.js';

const S = shot('C09');
const T_AUTO = 48.62, T_BOOM = 49.27;
const HORIZON = 770;
const LAYERS = [
  { z: 9.0, n: 30, y0: -160, y1: 30, scale: 1.7 },
  { z: 7.0, n: 11, y0: -900, y1: 60 },
  { z: 5.0, n: 10, y0: -1100, y1: 80 },
  { z: 3.6, n: 8, y0: -1300, y1: 150 },
  { z: 4.2, n: 6, y0: -2600, y1: -1500, scale: 1.4 },
  { z: 2.6, n: 7, y0: -1200, y1: 250, scale: 1.3 },
  { z: 2.2, n: 4, y0: -1500, y1: -1000, scale: 1.5 },
  { z: 1.8, n: 6, y0: -900, y1: 420, scale: 1.35 },
  { z: 1.3, n: 4, y0: -650, y1: 420, skip: 0.2, scale: 1.3 },
  // ---- CURSOR flies at z = 1 ----
  { z: 0.78, n: 3, y0: -380, y1: 420, skip: 0.45 },
  { z: 0.5, n: 1.6, y0: 230, y1: 420, blur: true, skip: 0.2 },
  { z: 0.45, n: 1.2, y0: -560, y1: -400, blur: true, skip: 0.3 },
  { z: 0.3, n: 1.3, y0: 170, y1: 260, blur: true, skip: 0.3 },
];
const BW = 860, BH = 170;

function banner() {
  const c = buf('C09-banner', BW, BH), x = bctx(c);
  x.clearRect(0, 0, BW, BH);
  x.fillStyle = C.cream; x.fillRect(0, 0, BW, BH);
  x.fillStyle = C.pink; x.fillRect(0, 0, BW, 16); x.fillRect(0, BH - 16, BW, 16);
  x.strokeStyle = C.ink; x.lineWidth = 8; x.strokeRect(4, 4, BW - 8, BH - 8);
  font(x, 118, 'Anton'); x.textAlign = 'left'; x.textBaseline = 'middle'; x.letterSpacing = '6px';
  x.fillStyle = C.ink; x.fillText('AUTOPILOT', 44, BH / 2 + 4);
  x.letterSpacing = '0px';
  // ON badge
  const bx = 640, by = 30, bw = 180, bh = 110;
  x.fillStyle = C.ink; roundRect(x, bx + 6, by + 6, bw, bh, 22); x.fill();
  x.fillStyle = '#2BD96B'; roundRect(x, bx, by, bw, bh, 22); x.fill(); x.lineWidth = 6; x.stroke();
  font(x, 84, 'Anton'); x.fillStyle = C.cream; x.textAlign = 'center'; x.fillText('ON', bx + bw / 2 + 22, by + bh / 2 + 4);
  x.fillStyle = C.cream; x.beginPath(); x.arc(bx + 40, by + bh / 2, 15, 0, TAU); x.fill();
  return c;
}

export default {
  ...S,
  cutIn: 'punch',
  sfx: [{ t: 48.32, type: 'whoosh', gain: 0.7 }, { t: T_BOOM, type: 'boom', gain: 0.9 }, { t: 49.84, type: 'whoosh', gain: 0.6 }],
  init() { cloudSprites(); this._ban = null; },
  draw(ctx, t, s, E) {
    const lt = s.lt;
    if (!this._ban) this._ban = banner();
    const beat = A.pulse('beat', t, 0.2);
    const bd = Math.max(0, t - T_BOOM), boom = t >= T_BOOM;
    // camera travel (px at depth 1): cruise, then a speed boost on the downbeat
    const camX = 1600 * lt + 2200 * (bd - (1 - Math.exp(-bd * 7)) / 7) + 4000;
    const speed = 1600 + (boom ? 2200 * (1 - Math.exp(-bd * 7)) : 0);
    const camY = Math.sin(lt * 2.3) * 40 - 30;
    const roll = Math.sin(lt * 1.7) * 0.035 - (boom ? 0.05 * Math.exp(-bd * 3) : 0);
    const fov = 1 + (boom ? 0.08 * Math.exp(-bd * 4) : 0) + beat * 0.012;

    ctx.save();
    ctx.translate(960, 540); ctx.rotate(roll); ctx.scale(fov * 1.06, fov * 1.06); ctx.translate(-960, -540);
    drawSky(ctx, t, { horizon: HORIZON, sunX: 1250, sunY: HORIZON - 60, sunR: 190, rot: lt * 0.4, camY: -camY * 0.1 });
    // far → mid layers, with aerial haze between
    drawClouds(ctx, LAYERS, camX, camY, 3.0, 99, { horizon: HORIZON });
    ctx.fillStyle = 'rgba(255,120,150,0.18)'; ctx.fillRect(-200, -200, W + 400, H + 400);
    drawClouds(ctx, LAYERS, camX, camY, 1.0, 3.0, { horizon: HORIZON, stretch: speed * 0.02 });

    // ---------- CURSOR + cape + banner ----------
    const enter = ease.outExpo(seg(lt, 0, 0.42));
    const MX = lerp(-300, 1150, enter) + Math.sin(lt * 2.1) * 30 + (boom ? 60 * ease.outBack(bd / 0.4) : 0);
    const MY = 560 + Math.sin(lt * 4.2) * 22 - camY * 0.3;
    const ms = 1.0;
    const rotO = -0.02 + Math.sin(lt * 3.1) * 0.05 + (boom ? -0.12 * Math.exp(-bd * 5) : 0);
    const rot = rotO - 0.25; // fly pose adds -0.25
    const bodyPt = (bx, by) => { const yy = by - 0; return [MX + ms * (Math.cos(rot) * bx - Math.sin(rot) * yy), MY + ms * (-185 + Math.sin(rot) * bx + Math.cos(rot) * yy)]; };
    // banner (towed from the left glove)
    const hand = bodyPt(-150, 30);
    const un = ease.outCubic(seg(t, T_AUTO, T_AUTO + 0.3));
    if (un > 0) {
      const rope = 200, ax = hand[0] - rope, ay = hand[1] + 150;
      const N = 43, sw = BW / N, vis = BW * un;
      const wave = (lx) => { const k = (BW - lx) / BW; return Math.sin(lx * 0.011 + lt * 15) * (8 + 34 * k) * (0.6 + 0.4 * speed / 3800) + k * k * 40 + Math.sin(lt * 3) * 10 * k; };
      // ropes
      ctx.strokeStyle = C.ink; ctx.lineWidth = 5; ctx.beginPath();
      ctx.moveTo(hand[0], hand[1]); ctx.lineTo(ax, ay - BH / 2 + wave(BW)); ctx.moveTo(hand[0], hand[1]); ctx.lineTo(ax, ay + BH / 2 + wave(BW)); ctx.stroke();
      for (let k = 0; k < N; k++) {
        const lx0 = k * sw; if (lx0 + sw < BW - vis) continue;
        const y0 = wave(lx0), y1 = wave(lx0 + sw);
        const dx = ax - (BW - lx0);
        ctx.drawImage(this._ban, lx0, 0, sw + 0.5, BH, dx, ay - BH / 2 + (y0 + y1) / 2, sw + 1, BH);
        const sl = (y1 - y0) / sw;
        ctx.fillStyle = sl > 0 ? `rgba(120,20,80,${clamp(sl * 0.9, 0, 0.35)})` : `rgba(255,255,255,${clamp(-sl * 0.9, 0, 0.35)})`;
        ctx.fillRect(dx, ay - BH / 2 + (y0 + y1) / 2, sw + 1, BH);
      }
      // the rolled end while unfurling
      if (un < 1) { const ex = ax - vis; ctx.fillStyle = C.cream; ctx.strokeStyle = C.ink; ctx.lineWidth = 6; roundRect(ctx, ex - 22, ay - BH / 2 + wave(BW - vis) - 8, 44, BH + 16, 20); ctx.fill(); ctx.stroke(); }
    }
    // cape (behind the body)
    ctx.save();
    ctx.translate(MX, MY); ctx.scale(ms, ms); ctx.translate(0, -185); ctx.rotate(rot);
    const capeW = (k) => Math.sin(k * 4 - lt * 22) * 26 * k + Math.sin(k * 7 - lt * 31) * 10 * k;
    ctx.beginPath(); ctx.moveTo(-40, -95);
    for (let k = 0; k <= 1.0001; k += 0.1) ctx.lineTo(-40 - k * 330, -95 + k * 40 + capeW(k));
    for (let k = 1; k >= -0.0001; k -= 0.1) ctx.lineTo(-40 - k * 300, 30 + k * 120 + capeW(k) * 1.2);
    ctx.closePath();
    ctx.fillStyle = '#FF2D6F'; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = C.ink; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.restore();
    drawMascot(ctx, { x: MX, y: MY, s: ms, t, pose: 'fly', rot: rotO, sticker: true, mouth: t > 48.62 && t < 49.6 ? 'auto' : 'grin', eyes: boom && bd < 0.5 ? 'star' : 'normal', squash: boom ? wobble(bd, 4, 6) * -0.15 : 0 });
    // sonic boom ring
    if (boom && bd < 0.5) {
      const u = ease.outCubic(bd / 0.5);
      ctx.strokeStyle = `rgba(255,251,244,${1 - u})`; ctx.lineWidth = 26 * (1 - u) + 3;
      ctx.beginPath(); ctx.ellipse(MX + 120, MY - 200, 80 + 700 * u, 120 + 900 * u, 0, -Math.PI / 2, Math.PI / 2); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(MX + 60, MY - 200, 40 + 500 * u, 70 + 700 * u, 0, -Math.PI / 2, Math.PI / 2); ctx.stroke();
    }

    // near layers (in front of CURSOR), motion-stretched
    drawClouds(ctx, LAYERS, camX, camY, 0, 1.0, { horizon: HORIZON, stretch: speed * 0.03 });

    // choreographed lens whooshes: giant blurred clouds tearing past the top / bottom edge
    for (const [t0, yb, sc, si] of [[48.40, 1260, 3.2, 2], [48.86, 330, 2.6, 5], [49.24, 1440, 3.6, 1], [49.56, 300, 2.8, 7]]) {
      const u = (t - t0) / 0.22; if (u < 0 || u > 1) continue;
      const sp = cloudSprites()[si], w = sp.w * sc, h = sp.h * sc;
      ctx.drawImage(sp.cb, lerp(W + 40, -w - 40, u), yb - h, w * 1.25, h);
    }
    // speed lines
    ctx.lineCap = 'round';
    const nl = boom ? 46 : 26;
    for (let i = 0; i < nl; i++) {
      const y = 60 + hash(i, 5) * 960, len = 120 + hash(i, 6) * 360 * (speed / 1600);
      const x = W + 300 - ((lt * (2600 + hash(i, 7) * 2600) * (speed / 1600) + hash(i, 8) * 3000) % (W + 900));
      ctx.strokeStyle = i % 5 === 0 ? 'rgba(255,225,77,0.85)' : 'rgba(255,251,244,0.7)'; ctx.lineWidth = 3 + hash(i, 9) * 6;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len, y); ctx.stroke();
    }
    // closing wipe: a giant blurred cloud crosses the lens into C10
    const wu = seg(t, 49.84, 50.02);
    if (wu > 0) {
      const sp = cloudSprites()[1];
      const sc = 6.2, w = sp.w * sc, h = sp.h * sc;
      const x = lerp(W + 100, -0.6 * w, ease.inQuad(wu) * 0.3 + wu * 0.7);
      ctx.drawImage(sp.cb, x, 1300 - h, w, h);
    }
    ctx.restore();

    E.fx.zoom += beat * 0.01;
    if (boom && bd < 0.35) { E.fx.radialBlur = 0.45 * Math.exp(-bd * 7); E.fx.center = [MX / W, 1 - (MY - 200) / H]; E.fx.shake = 14 * Math.exp(-bd * 9); E.fx.rgb = 6 * Math.exp(-bd * 8); }
    if (boom && bd < 0.04) E.fx.flash = [1, 0.95, 0.85, 0.35];
    if (lt < 0.25) E.fx.radialBlur = Math.max(E.fx.radialBlur, 0.5 * (1 - lt / 0.25));
  },
};
