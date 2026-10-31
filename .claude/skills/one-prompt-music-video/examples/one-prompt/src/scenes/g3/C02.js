// C02 — "and it moves" — Time-smeared dance (true slit-scan).
// CURSOR sways across the frame. The image is rebuilt from 8-px vertical slits: each slit re-draws CURSOR at
// its own moment in the past (delay grows with distance from where it is NOW, up to 1.25 s), so its body
// smears through time like taffy. Each slit is tinted by its age → candy stripes of time. A crisp "now" CURSOR
// rides the leading edge; a time ruler underneath shows the delay. MOVES bounces behind.
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, hash, wobble, buf, bctx } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { drawMascot } from '../../core/mascot.js';
import { popText } from './_g3.js';

const S = { ...shot('C02'), start: 39.95 }; // C01 owns the drop + dive through the O (39.667–39.95)
const DMAX = 1.3, C = 640, SW = 6, SC = 1.3;
const OM = TAU / 2.42, PH = -1.2;
const T_MOVES = 40.82;
const BANDS = ['#FF3E8A', '#7B2FF7', '#3EF0FF', '#FF7A1A', '#FF3E8A', '#7CFFC4', '#7B2FF7', '#FFFFFF'];

const mx = (tau) => 960 + 230 * Math.sin(OM * (tau - S.start) + PH);
const my = (tau) => { const b = A.beat(tau); return 880 - 105 * Math.sin(Math.PI * b.phase); };
const mrot = (tau) => { const b = A.beat(tau); return 0.3 * Math.sin(Math.PI * (b.i + b.phase)); };

export default {
  ...S,
  cutIn: 'flash',
  sfx: [{ t: T_MOVES, type: 'swoosh', gain: 0.8 }],
  draw(ctx, t, s, E) {
    const lt = s.lt;
    // ---------- background: yellow candy stripes ----------
    ctx.fillStyle = '#FFE14D'; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(-0.5); ctx.fillStyle = '#FFD21F';
    const off = (lt * 260) % 160;
    for (let x = -1500 + off; x < 1500; x += 160) ctx.fillRect(x, -1300, 70, 2600);
    ctx.restore();
    // pink dot field breathing on the beat
    const bp = A.pulse('beat', t, 0.12);
    ctx.fillStyle = 'rgba(255,62,138,0.35)'; ctx.beginPath();
    for (let y = 30; y < H; y += 54) for (let x = (y / 54) % 2 ? 27 : 0; x < W; x += 54) { const r = 4 + 5 * bp + 3 * Math.sin(x * 0.01 + y * 0.012 - lt * 6); if (r > 0.5) { ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, TAU); } }
    ctx.fill();

    // ---------- MOVES (letters on a wave) ----------
    const word = 'MOVES', mAge = t - T_MOVES;
    {
      ctx.save();
      ctx.font = '400 360px "Anton"'; const widths = [...word].map((ch) => ctx.measureText(ch).width);
      const total = widths.reduce((a, b) => a + b, 0) + 30 * (word.length - 1);
      let x = W / 2 - total / 2;
      for (let i = 0; i < word.length; i++) {
        const pop = ease.outBack(clamp((t - (S.start + 0.02 + i * 0.045)) / 0.2), 2.4);
        const jump = mAge > 0 ? -85 * Math.sin(clamp((mAge - i * 0.03) / 0.3) * Math.PI) : 0;
        const wave = Math.sin(lt * 7 - i * 0.9) * 26 + jump;
        const cx = x + widths[i] / 2, cy = 330 + wave;
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.sin(lt * 5 - i) * 0.06 + (mAge > 0 ? 0.25 * wobble(mAge - i * 0.03, 3, 5) * (i % 2 ? 1 : -1) : 0)); ctx.scale(pop, pop);
        // stacked extrusion
        for (let k = 14; k >= 1; k--) { ctx.fillStyle = k > 1 ? '#7B2FF7' : '#1F2A55'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(word[i], k * 1.4, k * 1.6); }
        ctx.fillStyle = mAge > 0 && Math.floor(mAge * 15 + i) % 2 ? '#FFFFFF' : '#FF3E8A'; ctx.fillText(word[i], 0, 0);
        ctx.lineWidth = 7; ctx.strokeStyle = '#1F2A55'; ctx.strokeText(word[i], 0, 0);
        ctx.restore();
        x += widths[i] + 30;
      }
      ctx.restore();
    }

    // ---------- the slit-scan ----------
    const L = buf('C02-layer', W, H), lx = bctx(L);
    lx.setTransform(1, 0, 0, 1, 0, 0); lx.clearRect(0, 0, W, H);
    const xn = mx(t);
    for (let x0 = 0; x0 < W; x0 += SW) {
      const xc = x0 + SW / 2, d = Math.abs(xc - xn) / C;
      if (d > DMAX) continue;
      const tau = t - d, px = mx(tau);
      if (Math.abs(px - xc) > 300 * SC) continue;
      lx.save(); lx.beginPath(); lx.rect(x0, 0, SW + 0.6, H); lx.clip();
      drawMascot(lx, { x: px, y: my(tau), s: SC, t: tau, pose: 'dance', mouth: 'auto', rot: mrot(tau), eyes: 'normal' });
      const band = Math.floor(d / 0.075);
      lx.globalCompositeOperation = 'source-atop';
      lx.globalAlpha = clamp((d - 0.03) / 0.12) * 0.82; lx.fillStyle = BANDS[band % BANDS.length]; lx.fillRect(x0, 0, SW + 1, H);
      lx.restore();
    }
    // soft shadow of the smear, then the smear
    ctx.save(); ctx.globalAlpha = 0.25; ctx.drawImage(L, 0, 0, W, H, 16, 22, W, H); ctx.restore();
    ctx.drawImage(L, 0, 0);

    // ---------- time ruler ----------
    ctx.save();
    const ry = 938;
    ctx.strokeStyle = 'rgba(31,42,85,0.75)'; ctx.fillStyle = 'rgba(31,42,85,0.85)'; ctx.lineWidth = 3;
    const r0 = Math.max(140, xn - DMAX * C), r1 = Math.min(W - 140, xn + DMAX * C);
    ctx.beginPath(); ctx.moveTo(r0, ry); ctx.lineTo(r1, ry); ctx.stroke();
    ctx.font = '700 20px "JetBrains Mono"'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (let k = -5; k <= 5; k++) {
      const x = xn + k * 0.25 * C; if (x < r0 - 1 || x > r1 + 1) continue;
      ctx.beginPath(); ctx.moveTo(x, ry - (k % 2 ? 8 : 14)); ctx.lineTo(x, ry + (k % 2 ? 8 : 14)); ctx.stroke();
      if (k !== 0 && k % 2 === 0) ctx.fillText(`−${(Math.abs(k) * 0.25).toFixed(1)}s`, x, ry + 18);
    }
    ctx.fillStyle = '#FF3E8A'; ctx.beginPath(); ctx.moveTo(xn, ry - 4); ctx.lineTo(xn - 13, ry - 26); ctx.lineTo(xn + 13, ry - 26); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#1F2A55'; ctx.fillText('NOW', xn, ry + 18);
    ctx.restore();

    // FX
    const kM = mAge > 0 ? Math.exp(-mAge / 0.12) : 0, kS = A.pulse('snare', t, 0.1);
    E.fx.shake = 22 * kM + 8 * kS; E.fx.zoom = 0.04 * kM + 0.015 * kS; E.fx.rgb = 8 * kM + 3;
    E.fx.saturation = 1.1; E.fx.vignette = 0.15;
  },
};
