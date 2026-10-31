// S01 — starter scene: CURSOR dances on the beat and lip-syncs the vocal; the current lyric line slams in word
// by word; sunburst rays + halftone pulse on the kick. A smoke test that the audio analysis drives everything.
import { shot } from '../../shots.js';
import { W, H, TAU, ease, clamp, font, rays, halftone, PAL } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { drawMascot } from '../../core/mascot.js';

const S = shot('S01');
export default {
  ...S,
  draw(ctx, t, s, E) {
    const bt = A.beat(t), hit = Math.exp(-bt.phase * 5), kick = A.pulse('kick', t, 0.15);
    ctx.fillStyle = PAL.pink; ctx.fillRect(0, 0, W, H);
    rays(ctx, W / 2, H * 0.62, 24, 2400, t * 0.25, 'rgba(255,225,77,0.55)', 'rgba(255,122,26,0.35)');
    halftone(ctx, 34, 'rgba(123,47,247,0.25)', (x, y) => 4 + 6 * kick * (0.5 + 0.5 * Math.sin(x * 0.01 + y * 0.013 + t)));
    drawMascot(ctx, { x: W / 2, y: H * 0.86, s: 1.5 + hit * 0.05, t, pose: 'dance', mouth: 'auto', sticker: true });
    const L = A.line(t);
    if (L) {
      const words = L.words.filter((w) => w.t <= t + 0.02);
      const str = words.map((w) => w.w).join(' ').toUpperCase();
      const last = words[words.length - 1];
      const pop = last ? 1 + 0.25 * Math.exp(-(t - last.t) * 14) : 1;
      ctx.save(); ctx.translate(W / 2, 250); ctx.scale(pop, pop);
      font(ctx, 120, 'Anton'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const m = ctx.measureText(str).width; if (m > 1700) ctx.scale(1700 / m, 1700 / m);
      ctx.fillStyle = '#1F2A55'; ctx.fillText(str, 8, 10); ctx.fillStyle = '#FFFBF4'; ctx.fillText(str, 0, 0);
      ctx.restore();
    }
    E.fx.zoom += 0.02 * kick; E.fx.rgb = 4 * kick;
  },
};
