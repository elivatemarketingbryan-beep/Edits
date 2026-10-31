// P05 — "(build)" — Tile multiplier ×256.
// The frame splits 1 → 2 → 4 → 16 → 64 → 256 on straight 16ths of the beat grid. Every tile is a CURSOR dancing
// in sync (one sprite rendered per frame, blitted 256× with alternating mirror) on a sky→candy colour.
// Last 16th: the 256 tiles card-flip in a wave from the centre to their white backs → pure white exactly at 38.30.
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, hash, wobble } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { drawMascot, mascotSprite } from '../../core/mascot.js';
import { skyBG, popText } from './_g3.js';

const S = shot('P05');
const B = 37.291, SX = (37.895 - 37.291) / 4; // 16th note
const ST = [B, B + SX, B + 2 * SX, B + 3 * SX, B + 4 * SX, B + 5 * SX];
const GRID = [[1, 1], [2, 1], [2, 2], [4, 4], [8, 8], [16, 16]];
const COUNT = ['×1', '×2', '×4', '×16', '×64', '×256'];
const T_WHITE = 38.3, T_FLIP = ST[5] + 0.03;
const COLS = [
  ['#6EC3F0'], ['#6EC3F0', '#2E8BE0'], ['#6EC3F0', '#FFD23F', '#2E8BE0', '#FFFFFF'],
  ['#6EC3F0', '#2E8BE0', '#FFD23F', '#FFFFFF', '#C9B6FF', '#7CFFC4', '#FF8FB1'],
  ['#6EC3F0', '#2E8BE0', '#FFD23F', '#FFFFFF', '#C9B6FF', '#7CFFC4', '#FF3E8A', '#FFE14D', '#7B2FF7'],
  ['#FF3E8A', '#FFE14D', '#7B2FF7', '#6EC3F0', '#FFFFFF', '#2E8BE0', '#FF8FB1', '#7CFFC4', '#FFD23F'],
];

export default {
  ...S,
  cutIn: 'punch',
  sfx: [...ST.slice(1).map((t, i) => ({ t, type: 'pop', gain: 0.5 + i * 0.1 })), { t: 37.32, type: 'riser', gain: 0.9 }, { t: T_FLIP, type: 'swoosh', gain: 0.8 }],
  draw(ctx, t, s, E) {
    let si = 0; for (let i = 0; i < ST.length; i++) if (t >= ST[i] - 1e-4) si = i;
    const age = t - ST[si];
    const [nx, ny] = GRID[si];
    const settle = 1 + 0.22 * (1 - ease.outExpo(age / 0.13));
    const build = clamp((t - S.start) / (T_WHITE - S.start));
    const endZoom = 1 + 0.45 * ease.inQuad(clamp((t - T_FLIP) / (T_WHITE - T_FLIP)));
    const gap = [0, 14, 12, 8, 5, 3][si];
    const flipping = t >= T_FLIP;

    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate(Math.sin(t * 9) * 0.006 * si + build * build * 0.06);
    ctx.scale(settle * endZoom * (1 + build * 0.05), settle * endZoom * (1 + build * 0.05));
    ctx.translate(-W / 2, -H / 2);

    const tw = W / nx, th = H / ny;
    const pal = COLS[si];
    if (si <= 2) {
      // vector mascots, few tiles
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
        const x = i * tw, y = j * th, k = j * nx + i;
        ctx.save(); ctx.beginPath(); ctx.rect(x + gap / 2, y + gap / 2, tw - gap, th - gap); ctx.clip();
        if (si === 0) skyBG(ctx, t, { sunX: 1560, sunY: 250, drift: (t - 36.18) * 260 });
        else { ctx.fillStyle = pal[k % pal.length]; ctx.fillRect(x, y, tw, th); }
        ctx.translate(x + tw / 2, 0);
        if (k % 2 === 1) ctx.scale(-1, 1);
        const sc = (th / H) * 1.9;
        ctx.fillStyle = 'rgba(31,42,85,0.18)'; ctx.beginPath(); ctx.ellipse(0, y + th * 0.9, 150 * sc, 22 * sc, 0, 0, TAU); ctx.fill();
        drawMascot(ctx, { x: 0, y: y + th * 0.9, s: sc, t, pose: 'dance', mouth: 'grin', eyes: si === 2 ? 'star' : 'normal', sticker: true });
        ctx.restore();
      }
    } else {
      const spr = mascotSprite('P05', { t, pose: 'dance', mouth: 'grin', eyes: 'star', sticker: true }, 260, 290);
      const cx = (nx - 1) / 2, cy = (ny - 1) / 2, maxD = Math.hypot(cx, cy);
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
        const k = j * nx + i;
        const x = i * tw, y = j * th;
        let fx = 1, back = false;
        if (flipping) {
          const d = Math.hypot(i - cx, j - cy) / maxD;
          const f = clamp((t - (T_FLIP + d * 0.14)) / 0.075);
          fx = Math.abs(Math.cos(f * Math.PI)); back = f > 0.5;
          if (f >= 1) continue; // white back == background
        }
        ctx.save(); ctx.translate(x + tw / 2, y + th / 2); ctx.scale(fx, 1);
        const w2 = tw - gap, h2 = th - gap;
        if (back) { ctx.fillStyle = '#FFFFFF'; ctx.fillRect(-w2 / 2, -h2 / 2, w2, h2); ctx.restore(); continue; }
        ctx.fillStyle = pal[Math.floor(hash(i, j, si) * pal.length)]; ctx.fillRect(-w2 / 2, -h2 / 2, w2, h2);
        if (k % 2 === 1) ctx.scale(-1, 1);
        const sh = h2 * 1.12, sw = sh * (260 / 290);
        ctx.drawImage(spr, -sw / 2, h2 / 2 - sh + h2 * 0.02, sw, sh);
        ctx.restore();
      }
    }
    ctx.restore();

    // ---- the multiplier counter ----
    const cAge = age, slam = 1 + 0.9 * (1 - ease.outExpo(cAge / 0.1));
    const fadeOut = 1 - clamp((t - T_FLIP - 0.05) / 0.15);
    if (fadeOut > 0) {
      const cpos = si === 0 ? [1480, 300, 0.62] : si === 1 ? [W / 2, H / 2 - 10, 0.85] : [W / 2, H / 2 - 10, 1];
      ctx.save(); ctx.globalAlpha = fadeOut; ctx.translate(cpos[0], cpos[1]); ctx.scale(cpos[2], cpos[2]); ctx.rotate(-0.05 + 0.02 * wobble(cAge, 6, 8)); ctx.scale(slam, slam);
      // backing burst
      ctx.fillStyle = '#1F2A55'; ctx.beginPath();
      for (let i = 0; i < 28; i++) { const a = (i / 28) * TAU + t * 1.5, r = i % 2 ? 190 : 250; ctx.lineTo(Math.cos(a) * r * 1.5, Math.sin(a) * r * 0.82); }
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = si >= 4 ? '#FF3E8A' : '#FFD23F'; ctx.beginPath();
      for (let i = 0; i < 28; i++) { const a = (i / 28) * TAU + t * 1.5, r = i % 2 ? 170 : 228; ctx.lineTo(Math.cos(a) * r * 1.5, Math.sin(a) * r * 0.82); }
      ctx.closePath(); ctx.fill();
      popText(ctx, COUNT[si], 0, 6, 230, { fill: '#FFFFFF', shadow: '#1F2A55', off: 12, stroke: '#1F2A55', sw: 12, maxW: 560 });
      ctx.restore();
    }

    // ---- the white-out ----
    const white = ease.inQuad(clamp((t - (T_FLIP + 0.08)) / (T_WHITE - T_FLIP - 0.1)));
    E.fx.flash = [1, 1, 1, Math.max(white, 0.5 * Math.exp(-age / 0.05) * (si > 0 ? 1 : 0))];
    E.fx.shake = 10 * Math.exp(-age / 0.06) * (si > 0 ? 1 : 0) + build * 4;
    E.fx.rgb = 4 * build + 6 * Math.exp(-age / 0.06);
    E.fx.bloom = 0.3 * build;
    E.fx.vignette = 0.1;
  },
};
