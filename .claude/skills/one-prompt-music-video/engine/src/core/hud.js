// HUD drawn over every scene: REC + cost, frame counter + night→dawn clock, karaoke subtitle chip,
// technique tag (what this shot is made of), and a thin live spectrum. Scenes choose the HUD ink via
// `hud: 'ink'` (dark text for bright scenes), `hud: 'paper'` (light text for dark scenes) or 'none'.
import { A } from './audio.js';
import { W, H, TAU, clamp, ease, roundRect, font } from './lib.js';
import { PROJECT } from '../project.js';

const PAD = 56;

const hms = (str) => { const [h, m, s] = str.split(':').map(Number); return h * 3600 + m * 60 + (s || 0); };
function clock(t) {
  const a = hms(PROJECT.clock.from); let b = hms(PROJECT.clock.to); if (b <= a) b += 86400;
  const dur = (A.data && A.data.duration) || 165;
  let s = Math.floor(a + (b - a) * clamp(t / dur));
  s %= 86400;
  const hh = Math.floor(s / 3600), mm = Math.floor((s % 3600) / 60), ss = s % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

export function drawHUD(ctx, t, frame, nFrames, scene, idx) {
  const mode = scene.hud ?? 'ink';
  if (mode === 'none') return;
  const corners = PROJECT.corners !== false;
  const ink = mode === 'paper' ? 'rgba(255,251,244,0.92)' : 'rgba(20,24,48,0.88)';
  const dim = mode === 'paper' ? 'rgba(255,251,244,0.55)' : 'rgba(20,24,48,0.5)';
  ctx.save();
  ctx.textBaseline = 'alphabetic';

  if (corners) {
  // ---- top-left: REC + project + cost ----
  const on = Math.floor(t * 2) % 2 === 0;
  ctx.fillStyle = '#FF2A3A'; ctx.globalAlpha = on ? 1 : 0.25;
  ctx.beginPath(); ctx.arc(PAD + 9, PAD + 2, 9, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
  ctx.fillStyle = ink; font(ctx, 22, 'JetBrains Mono', '700'); ctx.textAlign = 'left';
  ctx.fillText('REC  ' + PROJECT.title, PAD + 28, PAD + 10);
  font(ctx, 18, 'JetBrains Mono', '600'); ctx.fillStyle = dim;
  if (PROJECT.sub) ctx.fillText(PROJECT.sub, PAD + 28, PAD + 38);

  // ---- top-right: frame counter + clock ----
  ctx.textAlign = 'right'; ctx.fillStyle = ink; font(ctx, 22, 'JetBrains Mono', '700');
  ctx.fillText(`FRAME ${String(frame).padStart(4, '0')} / ${nFrames}`, W - PAD, PAD + 10);
  font(ctx, 18, 'JetBrains Mono', '600'); ctx.fillStyle = dim;
  if (PROJECT.clock) ctx.fillText(`● LIVE  ${clock(t)}`, W - PAD, PAD + 38);

  // ---- bottom-right: technique tag ----
  if (scene.tech) {
    const lt = t - scene.start;
    const k = ease.outExpo(lt / 0.35);
    const label = `№${String(idx + 1).padStart(2, '0')}  ${scene.tech}`;
    font(ctx, 20, 'JetBrains Mono', '800');
    const tw = ctx.measureText(label).width;
    const x1 = W - PAD, y1 = H - PAD - 6;
    ctx.save();
    ctx.beginPath(); ctx.rect(x1 - (tw + 30) * k, y1 - 34, tw + 30, 44); ctx.clip();
    ctx.fillStyle = mode === 'paper' ? 'rgba(255,251,244,0.95)' : 'rgba(20,24,48,0.92)';
    roundRect(ctx, x1 - tw - 28, y1 - 32, tw + 28, 40, 6); ctx.fill();
    ctx.fillStyle = mode === 'paper' ? '#141830' : '#FFFBF4'; ctx.textAlign = 'right';
    ctx.fillText(label, x1 - 14, y1 - 5);
    ctx.restore();
    if (scene.cat) { font(ctx, 15, 'JetBrains Mono', '700'); ctx.fillStyle = dim; ctx.textAlign = 'right'; ctx.globalAlpha = k; ctx.fillText(scene.cat, x1 - 14, y1 - 44); ctx.globalAlpha = 1; }
  }

  }
  // ---- bottom-left: karaoke subtitle chip ----
  if (scene.subs !== false && PROJECT.subtitles !== false) drawSub(ctx, t);

  // ---- bottom edge: live spectrum ----
  if (scene.spectrum !== false && PROJECT.spectrum !== false) {
    ctx.fillStyle = mode === 'paper' ? 'rgba(255,251,244,0.28)' : 'rgba(20,24,48,0.22)';
    const n = 96, bw = W / n;
    for (let i = 0; i < n; i++) {
      const band = Math.min(A.nb - 1, Math.floor(Math.abs(i - n / 2) / (n / 2) * A.nb));
      const v = A.spec(t, band);
      const h = 3 + v * v * 26;
      ctx.fillRect(i * bw + 1, H - h, bw - 2, h);
    }
  }
  ctx.restore();
}

function drawSub(ctx, t) {
  const L = A.line(t);
  if (!L) return;
  const lt = t - L.start;
  const pop = ease.outBack(lt / 0.18);
  const words = L.words.map((w) => w.w);
  font(ctx, 34, 'Bricolage Grotesque', '700');
  const space = ctx.measureText(' ').width;
  const widths = words.map((w) => ctx.measureText(w).width);
  const total = widths.reduce((a, b) => a + b, 0) + space * (words.length - 1);
  const x0 = PAD, y0 = H - PAD - 64, padX = 22, hgt = 58;
  ctx.save();
  ctx.translate(x0, y0 + hgt / 2); ctx.scale(0.9 + 0.1 * pop, 0.9 + 0.1 * pop); ctx.translate(-x0, -(y0 + hgt / 2));
  ctx.globalAlpha = clamp(lt / 0.08) * clamp((L.end + 0.25 - t) / 0.12);
  // hard shadow + chip
  ctx.fillStyle = '#141830'; roundRect(ctx, x0 + 6, y0 + 6, total + padX * 2, hgt, 8); ctx.fill();
  ctx.fillStyle = '#FFFBF4'; roundRect(ctx, x0, y0, total + padX * 2, hgt, 8); ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = '#141830'; ctx.stroke();
  let x = x0 + padX; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  const keys = (L.key || '').toLowerCase().split(' ');
  L.words.forEach((w, i) => {
    const sung = t >= w.t - 0.02;
    ctx.fillStyle = sung ? '#141830' : 'rgba(20,24,48,0.32)';
    ctx.fillText(w.w, x, y0 + hgt / 2 + 1);
    const clean = w.w.toLowerCase().replace(/[^a-z0-9.]/g, '');
    if (keys.includes(clean) && sung) {
      const u = ease.outCubic((t - w.t) / 0.25);
      ctx.fillStyle = '#E8343F'; ctx.fillRect(x, y0 + hgt - 13, widths[i] * u, 5);
    }
    x += widths[i] + space;
  });
  ctx.restore();
}
