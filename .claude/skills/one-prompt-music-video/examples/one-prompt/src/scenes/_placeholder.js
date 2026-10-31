// Placeholder card for scenes that are not built yet.
import { WORLDS } from '../shots.js';
import { W, H, font } from '../core/lib.js';
export function placeholder(ctx, t, s, S) {
  const pal = WORLDS[S.world].pal;
  ctx.fillStyle = pal[0]; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = pal[2]; ctx.fillRect(0, H - 12, W * s.u, 12);
  ctx.fillStyle = S.hud === 'paper' ? '#fff' : '#111'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  font(ctx, 120, 'Anton'); ctx.fillText(`${S.id} · ${S.title}`, 110, 170);
  font(ctx, 44, 'Bricolage Grotesque', '700'); ctx.fillText(`“${S.lyric}”  —  ${S.tech}`, 110, 320);
  font(ctx, 30, 'Bricolage Grotesque', '500');
  const words = S.desc.split(' '); let line = '', y = 410;
  for (const w of words) { if (ctx.measureText(line + w).width > 1650) { ctx.fillText(line, 110, y); y += 42; line = ''; } line += w + ' '; }
  ctx.fillText(line, 110, y);
}
