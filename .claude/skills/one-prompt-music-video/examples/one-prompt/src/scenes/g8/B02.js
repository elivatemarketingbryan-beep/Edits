// B02 — "thank you for staying" — The bow.
// Sunset; CURSOR holds a THANK YOU sign and bows TOWARD the camera (sprite re-projected strip by strip
// with a real perspective tilt about the feet). ~150 paper petals fall with quasi-steady plate
// aerodynamics (flutter + tumble), a wind gust on "staying" swirls them; hex bokeh + light rays.
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, seg, rng, buf, bctx, font, noise2, wobble, rays } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { drawMascot, pose } from '../../core/mascot.js';
import { BP, vgrad, glowSprite, bokehSprite, petalSprite, simulatePetal, sampleTrack, heart, roundRect } from './kit.js';

const S = shot('B02');
const T0 = S.start, WARM = 4.2, BOW = 109.27, STAY = 109.68;
const SUN = [960, 690];

const gust = (t) => Math.exp(-(((t - (STAY + 0.25)) / 0.33) ** 2));
const wind = (t, x, y) => { const g = gust(t); return [25 + 950 * g * (1 + 0.35 * Math.sin(y / 170)), -420 * g * (0.6 + 0.4 * Math.cos(x / 230))]; };

let PET = null;
function petals() {
  if (PET) return PET;
  const r = rng(808);
  const layers = [[0.42, 50], [0.7, 56], [1.0, 50], [1.45, 30], [2.0, 12], [2.9, 6]];
  const cols = ['#FF8FB1', '#FFC2D4', '#FFB38A', '#FFF4EA', '#FFD37A', '#FFA3BF', '#C9B6FF'];
  PET = [];
  for (const [d, n] of layers) for (let i = 0; i < n; i++) {
    const dur = WARM + (S.end - S.start) + 0.3;
    const tr = simulatePetal(r, { x0: 0, y0: 0, dur, t0: T0 - WARM, wind });
    const fall = 600; // ≈ px fallen during warm-up at d=1
    PET.push({ d, tr, x0: r.range(-250, W + 150), y0: r.range(-fall * d * 0.9 - 1300, H - fall * d * 0.9 + 80), col: r.pick(cols), size: r.range(34, 52) * d, blur: d > 2.5 });
  }
  PET.sort((a, b) => a.d - b.d);
  return PET;
}

function drawPetal(ctx, p, t) {
  const [x, y, th, roll] = sampleTrack(p.tr, t - (T0 - WARM));
  const sx = p.x0 + x * p.d, sy = p.y0 + y * p.d;
  if (sy < -80 || sy > H + 80 || sx < -120 || sx > W + 120) return;
  const c = Math.cos(roll), side = c < 0 ? 1 : 0;
  const spr = petalSprite(p.col, side, p.blur ? 128 : 96, p.blur ? 5 : 0);
  ctx.setTransform(1, 0, 0, 1, sx, sy); ctx.rotate(th);
  const k = p.size / 80;
  ctx.scale(k, k * Math.max(0.12, Math.abs(c)));
  ctx.drawImage(spr, -spr.width / 2, -spr.height / 2);
}

function hills(ctx, y0, amp, freq, seed, col, par) {
  ctx.beginPath(); ctx.moveTo(-50, H + 10);
  for (let x = -50; x <= W + 50; x += 40) ctx.lineTo(x, y0 - amp * (0.6 + 0.5 * noise2((x + par) * freq, seed)));
  ctx.lineTo(W + 50, H + 10); ctx.closePath(); ctx.fillStyle = col; ctx.fill();
}

// ---- the sprite of CURSOR holding the sign above its head (redrawn every frame, then perspective-projected) ----
const SPW = 900, SPH = 1120, FEETY = 1080, SC = 1.18;
function cursorSprite(t, bowK, happy) {
  const c = buf('B02-cur', SPW, SPH), x = bctx(c);
  x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, SPW, SPH);
  const P = pose('idle', t);
  const hit = A.pulse('beat', t, 0.18);
  const sway = Math.sin(t * 2.6) * 6;
  P.armL = [-150 + sway, -262]; P.armR = [150 + sway, -262];
  P.squash = hit * 0.04; P.bob = 0;
  P.look = [0, lerp(-0.4, 1, bowK)];
  const signWob = wobble(t - T0, 2.2, 3.2) * 0.06 + Math.sin(t * 2.6) * 0.03;
  drawMascot(x, {
    x: SPW / 2, y: FEETY, s: SC, t, P, sticker: true,
    eyes: happy ? 'happy' : 'normal', mouth: happy ? 'grin' : 'smile',
    over(ctx, PP) {
      ctx.save(); ctx.translate(sway, -300); ctx.rotate(signWob);
      // sign board: solid offset shadow, cream face, thick ink outline
      roundRect(ctx, -228, -112 + 16, 456, 210, 22); ctx.fillStyle = '#7A2E60'; ctx.fill();
      roundRect(ctx, -228, -112, 456, 210, 22); ctx.fillStyle = '#FFF8EE'; ctx.fill();
      ctx.lineWidth = 10; ctx.strokeStyle = BP.ink; ctx.stroke();
      ctx.save(); ctx.rotate(-0.07); ctx.fillStyle = 'rgba(255,143,177,0.9)'; ctx.fillRect(-170, -126, 90, 28); ctx.restore();
      ctx.save(); ctx.rotate(0.06); ctx.fillStyle = 'rgba(255,176,0,0.9)'; ctx.fillRect(90, -128, 90, 28); ctx.restore();
      ctx.fillStyle = BP.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      font(ctx, 132, 'Anton'); ctx.fillStyle = '#FF5C93'; ctx.fillText('THANK YOU', 5, -12 + 5); ctx.fillStyle = BP.ink; ctx.fillText('THANK YOU', 0, -12);
      font(ctx, 46, 'Caveat', '700'); ctx.fillStyle = '#E8346F'; ctx.fillText('love, CURSOR', -18, 66);
      heart(ctx, 122, 70, 17 + hit * 6); ctx.fillStyle = '#FF3E7A'; ctx.fill();
      ctx.restore();
      for (const [hx, hy] of [PP.armL, PP.armR]) { ctx.beginPath(); ctx.arc(hx, hy + 10, 24, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = BP.ink; ctx.stroke(); }
    },
  });
  return c;
}

/** draw the sprite tilted toward the camera by angle th about the feet line (true perspective, strip by strip).
 *  When tilted we also see the TOP FACE of CURSOR's block (it is a box, not a card) — inserted in depth order. */
function drawTilted(ctx, spr, fx, fy, th, squash = 0) {
  const D = 1350, HC = 330, eyeY = fy - HC, sn = Math.sin(th), cs = Math.cos(th);
  const P3 = (h, z) => { // point at height h along the body axis, z = offset along the front normal (toward camera)
    const yy = h * cs - z * sn, zz = h * sn + z * cs, k = D / (D - zz);
    return [eyeY - (yy - HC) * k, k];
  };
  const hTop = (185 + 115) * SC * (1 - squash * 0.55), depth = 120 * SC;
  const step = 4;
  let faceDone = th < 0.04;
  for (let ys = FEETY; ys > 0; ys -= step) {
    const h0 = FEETY - ys, h1 = h0 + step;
    if (!faceDone && h0 >= hTop - 6) {
      faceDone = true;
      const [yf, kf] = P3(hTop - 6, 0), [yb, kb] = P3(hTop - 6, -depth);
      const bh = yf - yb;
      if (bh > 2) {
        const wf = 170 * SC * kf * (1 + squash * 0.55), wb = 170 * SC * kb * (1 + squash * 0.55);
        ctx.save();
        ctx.beginPath();
        const r = Math.min(30 * SC * kf, bh * 0.5);
        ctx.moveTo(fx - wf / 2 + r, yf); ctx.lineTo(fx + wf / 2 - r, yf);
        ctx.quadraticCurveTo(fx + wf / 2, yf, fx + (wf / 2 + wb / 2) / 2, (yf + yb) / 2);
        ctx.quadraticCurveTo(fx + wb / 2, yb, fx + wb / 2 - r, yb);
        ctx.lineTo(fx - wb / 2 + r, yb);
        ctx.quadraticCurveTo(fx - wb / 2, yb, fx - (wf / 2 + wb / 2) / 2, (yf + yb) / 2);
        ctx.quadraticCurveTo(fx - wf / 2, yf, fx - wf / 2 + r, yf);
        ctx.closePath();
        const g = ctx.createLinearGradient(0, yf, 0, yb); g.addColorStop(0, '#FFB27A'); g.addColorStop(1, '#FF8A3D');
        ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 8 * SC * kf; ctx.strokeStyle = BP.ink; ctx.stroke();
        // gloss streak on the top face
        ctx.beginPath(); ctx.ellipse(fx - wf * 0.18, (yf * 0.6 + yb * 0.4), wf * 0.16, Math.max(2, bh * 0.16), 0, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fill();
        ctx.restore();
      }
    }
    const [y0, k] = P3(h0, 0), [y1] = P3(h1, 0);
    const top = Math.min(y0, y1), hh = Math.abs(y0 - y1) + 1.2;
    ctx.drawImage(spr, 0, ys - step, SPW, step, fx - (SPW / 2) * k, top, SPW * k, hh);
  }
}

export default {
  ...S,
  cutIn: 'punch',
  sfx: [{ t: BOW, type: 'swoosh', gain: 0.6 }, { t: STAY, type: 'whoosh', gain: 0.7 }, { t: STAY + 0.05, type: 'bell', gain: 0.4 }],
  draw(ctx, t, s, E) {
    const lt = s.lt, u = s.u;
    const beat = A.pulse('beat', t, 0.22), down = A.pulse('down', t, 0.4);
    const zoom = 1 + 0.08 * ease.inOutQuad(u) + 0.015 * down;
    const camX = Math.sin(lt * 0.9) * 14, camY = Math.cos(lt * 0.7) * 6;
    const cam = (par) => { ctx.setTransform(zoom, 0, 0, zoom, (1 - zoom) * 960 + camX * par, (1 - zoom) * 640 + camY * par); };

    // ---- sky ----
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    vgrad(ctx, [[0, '#8A78E6'], [0.28, '#C987DA'], [0.5, '#FF8FB1'], [0.66, '#FFA07E'], [0.78, '#FFC15A']]);
    cam(0.2);
    // graphic sunburst (flat alternating wedges) + a soft glow core
    ctx.save(); ctx.globalCompositeOperation = 'soft-light';
    rays(ctx, SUN[0], SUN[1], 32, 2400, lt * 0.12 + beat * 0.02, 'rgba(255,248,230,0.55)', 'rgba(255,248,230,0)');
    ctx.restore();
    const g1 = glowSprite('#FFE3A3', 256, 0.0);
    ctx.globalCompositeOperation = 'screen';
    const gr = 900 + beat * 80;
    ctx.globalAlpha = 0.55; ctx.drawImage(g1, SUN[0] - gr / 2, SUN[1] - gr / 2, gr, gr);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    {
      const R = 270, sg = ctx.createLinearGradient(0, SUN[1] - R, 0, SUN[1] + R);
      sg.addColorStop(0, '#FFF3C4'); sg.addColorStop(0.5, '#FFC94D'); sg.addColorStop(1, '#FF7E6B');
      ctx.save(); ctx.beginPath(); ctx.arc(SUN[0], SUN[1], R, 0, TAU); ctx.clip();
      ctx.fillStyle = sg; ctx.fillRect(SUN[0] - R, SUN[1] - R, 2 * R, 2 * R);
      ctx.fillStyle = '#FF9FB0';
      for (let i = 0; i < 6; i++) { const yy = SUN[1] + 10 + i * 40 - ((lt * 26) % 40), hh = 3 + i * 3.4; ctx.fillRect(SUN[0] - R, yy, 2 * R, hh); }
      ctx.restore();
    }
    const BK = ['#FFE3A3', '#FFB8CF', '#FFF4EA', '#D9CCFF', '#FFC9A8'];
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < 24; i++) {
      const r = rng(500 + i), d = r.range(0.25, 0.6);
      const x = ((r.range(0, W + 400) + lt * 22 * d + noise2(i, lt * 0.3) * 40) % (W + 400)) - 200;
      const y = r.range(130, 700) + Math.sin(lt * 0.8 + i) * 18;
      const sz = r.range(50, 150) * (1 + beat * 0.15);
      ctx.globalAlpha = r.range(0.3, 0.65);
      ctx.drawImage(bokehSprite(r.pick(BK), 160), x - sz / 2, y - sz / 2, sz, sz);
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    cam(0.35); hills(ctx, 800, 120, 0.0016, 1.3, '#B77CC9', lt * 6);
    cam(0.6); hills(ctx, 855, 85, 0.0022, 4.1, '#EA72A0', lt * 10);
    cam(0.85);
    {
      const gg = ctx.createLinearGradient(0, 870, 0, H);
      gg.addColorStop(0, '#FF9F86'); gg.addColorStop(1, '#FFC7A6');
      ctx.beginPath(); ctx.moveTo(-60, H + 40); ctx.lineTo(-60, 915);
      ctx.bezierCurveTo(500, 880, 1400, 880, W + 60, 920); ctx.lineTo(W + 60, H + 40); ctx.closePath(); ctx.fillStyle = gg; ctx.fill();
    }
    const pts = petals();
    for (const p of pts) if (p.d < 1) drawPetal(ctx, p, t);
    cam(0.85);

    // ---- CURSOR bows toward us ----
    const bowIn = ease.outCubic(seg(t, BOW - 0.24, BOW + 0.14));
    const bowOut = ease.inOutCubic(seg(t, 110.3, 110.66));
    const settle = t > 110.66 ? wobble(t - 110.66, 2.4, 4) * 0.07 : 0;
    let th = 0.98 * bowIn * (1 - bowOut) - 0.12 * Math.sin(Math.PI * seg(t, 110.45, 110.85)) + settle;
    th += (Math.sin(t * 2.4) * 0.03 + 0.09 * A.pulse('beat', t, 0.16)) * bowIn * (1 - bowOut); // little extra nod on every beat
    th -= 0.07 * Math.sin(Math.PI * seg(t, BOW - 0.5, BOW - 0.24)); // anticipation: lean back first
    const happy = t > BOW - 0.12;
    const spr = cursorSprite(t, bowIn * (1 - bowOut), happy);
    const FX = 960, FY = 935;
    ctx.save();
    const shg = ctx.createLinearGradient(0, FY, 0, H + 40);
    shg.addColorStop(0, 'rgba(110,40,90,0.42)'); shg.addColorStop(1, 'rgba(110,40,90,0)');
    ctx.fillStyle = shg; ctx.beginPath(); ctx.moveTo(FX - 80, FY - 4); ctx.lineTo(FX + 80, FY - 4); ctx.lineTo(FX + 230 + th * 80, H + 60); ctx.lineTo(FX - 230 - th * 80, H + 60); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.ellipse(FX, FY, 140, 20, 0, 0, TAU); ctx.fillStyle = 'rgba(110,40,90,0.35)'; ctx.fill();
    ctx.restore();
    drawTilted(ctx, spr, FX, FY, th, A.pulse('beat', t, 0.18) * 0.04);

    for (const p of pts) if (p.d >= 1 && p.d < 1.9) drawPetal(ctx, p, t);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // ---- type: "thank you for / staying" ----
    {
      const k1 = ease.outBack(seg(t, 109.4, 109.62)), k2 = seg(t, STAY - 0.04, STAY + 0.5);
      const cx = 960, cy = 210;
      ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      if (k1 > 0) {
        font(ctx, 64, 'Anton');
        ctx.globalAlpha = clamp(k1 * 1.4);
        const yy = cy + (1 - k1) * 40 - ease.inCubic(seg(t, 110.18, 110.42)) * 400;
        ctx.fillStyle = '#7A2E60'; ctx.fillText('THANK YOU FOR', cx + 4, yy + 5);
        ctx.fillStyle = BP.cream; ctx.fillText('THANK YOU FOR', cx, yy);
      }
      ctx.globalAlpha = 1;
      if (k2 > 0) {
        const word = 'staying', fs = 250; font(ctx, fs, 'Instrument Serif', '400', 'italic');
        const tw = ctx.measureText(word).width; let x = cx - tw / 2;
        for (let i = 0; i < word.length; i++) {
          const ch = word[i], cw = ctx.measureText(ch).width;
          const kk = ease.outBack(seg(t, STAY - 0.04 + i * 0.026, STAY + 0.2 + i * 0.026), 2.2);
          if (kk <= 0) { x += cw; continue; }
          const ex = ease.inCubic(seg(t, 110.2 + i * 0.022, 110.46 + i * 0.022));
          const yy = cy + 200 + (1 - kk) * 140 + Math.sin(t * 2.5 + i * 0.7) * 6 - ex * 620, rot = (1 - kk) * 0.5 * (i % 2 ? 1 : -1) + ex * (i % 2 ? 0.6 : -0.6);
          ctx.save(); ctx.translate(x + cw / 2, yy); ctx.rotate(rot); ctx.scale(kk, kk);
          ctx.textAlign = 'center';
          ctx.fillStyle = '#7A2E60'; ctx.fillText(ch, 8, 10);
          const tg = ctx.createLinearGradient(0, -fs * 0.7, 0, 0); tg.addColorStop(0, '#FFFFFF'); tg.addColorStop(1, '#FFE0A6');
          ctx.fillStyle = tg; ctx.fillText(ch, 0, 0);
          ctx.restore(); x += cw;
        }
      }
      ctx.restore();
    }

    for (const p of pts) if (p.d >= 1.9) drawPetal(ctx, p, t);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < 8; i++) {
      const r = rng(900 + i);
      const x = ((r.range(0, W + 600) - lt * 60 * r.range(0.6, 1.4)) % (W + 600) + W + 600) % (W + 600) - 300;
      const y = r.range(100, 1000) + Math.sin(lt + i) * 30;
      const sz = r.range(220, 420) * (1 + beat * 0.1);
      ctx.globalAlpha = r.range(0.14, 0.28) * (0.7 + 0.3 * beat);
      ctx.drawImage(bokehSprite(r.pick(['#FFE3A3', '#FF8FB1', '#FFF4EA']), 200, 7), x - sz / 2, y - sz / 2, sz, sz);
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';

    E.fx.bloom = 0.22 + 0.25 * down; E.fx.bloomThreshold = 0.86;
    E.fx.vignette = 0.32;
    if (t > STAY && t < STAY + 0.12) E.fx.zoom += 0.014 * (1 - (t - STAY) / 0.12);
  },
};
