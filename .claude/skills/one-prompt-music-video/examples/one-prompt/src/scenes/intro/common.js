// Shared look for the NIGHT TERMINAL intro (and the sunrise bookend can import it too).
import { W, H, TAU, clamp, ease, hash, roundRect, font, lerp } from '../../core/lib.js';

export const NIGHT = { bg: '#070914', bg2: '#0E1330', ink: '#FFFBF4', dim: 'rgba(255,251,244,0.32)', orange: '#FF6A1F', hot: '#FFB15C', glow: 'rgba(255,106,31,0.55)' };
export const MONO = 'JetBrains Mono';

/** night background with a soft vignette + faint phosphor scanlines (in the current transform, local W×H) */
export function nightBg(ctx, t, { scan = true, glowX = W / 2, glowY = H / 2, glow = 0.25 } = {}) {
  ctx.fillStyle = NIGHT.bg; ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, 1100);
  g.addColorStop(0, `rgba(255,106,31,${glow})`); g.addColorStop(0.35, `rgba(40,30,90,${glow * 0.6})`); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  if (scan) { ctx.fillStyle = 'rgba(255,255,255,0.025)'; for (let y = (t * 40) % 6; y < H; y += 6) ctx.fillRect(0, y, W, 2); }
}

/** glowing text (orange phosphor). align left by default. */
export function glowText(ctx, str, x, y, size, color = NIGHT.orange, blur = 28, weight = '800', align = 'left') {
  font(ctx, size, MONO, weight); ctx.textAlign = align; ctx.textBaseline = 'middle';
  ctx.save(); ctx.shadowColor = color; ctx.shadowBlur = blur; ctx.fillStyle = color; ctx.fillText(str, x, y); ctx.restore();
  ctx.fillStyle = color; ctx.fillText(str, x, y);
}

/**
 * The terminal screen content in local 1920×1080 space.
 * typed: string typed so far · cursorOn: bool · heat 0..1 (white-hot glow after ENTER) · size: prompt font size
 * returns the cursor rect in local coords.
 */
export function terminal(ctx, t, { typed = '', cursorOn = true, heat = 0, size = 120, x0 = 250, y0 = 560, lines = true, log = [] } = {}) {
  nightBg(ctx, t, { glowX: x0 + 500, glowY: y0, glow: 0.18 + heat * 0.25 });
  if (lines) {
    font(ctx, 30, MONO, '600'); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = NIGHT.dim;
    ctx.fillText('Last login: Fri Oct 9 23:59:00 on ttys001', x0, y0 - 260);
    ctx.fillText('claude  ·  opus 5.5  ·  local  ·  ready', x0, y0 - 215);
    ctx.fillStyle = 'rgba(255,106,31,0.45)'; ctx.fillText('~/one-prompt  main ✓', x0, y0 - 150);
  }
  // prompt glyph
  const col = heat > 0 ? lerpColor(NIGHT.orange, '#FFF3E0', heat) : NIGHT.orange;
  glowText(ctx, '>', x0, y0, size, col, 30 + heat * 40);
  font(ctx, size, MONO, '800');
  const pw = ctx.measureText('> ').width;
  glowText(ctx, typed, x0 + pw, y0, size, heat > 0 ? col : NIGHT.ink, 18 + heat * 50);
  font(ctx, size, MONO, '800');
  const tw = ctx.measureText(typed).width, cw = size * 0.6, ch = size * 1.12;
  const cx = x0 + pw + tw + size * 0.06, cy = y0 - ch / 2;
  if (cursorOn) {
    ctx.save(); ctx.shadowColor = NIGHT.orange; ctx.shadowBlur = 40; ctx.fillStyle = NIGHT.orange; ctx.fillRect(cx, cy, cw, ch); ctx.restore();
    ctx.fillStyle = NIGHT.orange; ctx.fillRect(cx, cy, cw, ch);
  }
  // response log lines
  font(ctx, 34, MONO, '700');
  log.forEach((L, i) => { ctx.globalAlpha = L.a ?? 1; ctx.fillStyle = L.c || NIGHT.dim; ctx.fillText(L.s, x0, y0 + 120 + i * 50); ctx.globalAlpha = 1; });
  return { x: cx, y: cy, w: cw, h: ch };
}

function lerpColor(a, b, t) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const r = lerp((pa >> 16) & 255, (pb >> 16) & 255, t), g = lerp((pa >> 8) & 255, (pb >> 8) & 255, t), bl = lerp(pa & 255, pb & 255, t);
  return `rgb(${r | 0},${g | 0},${bl | 0})`;
}

/** a row of faux-3D keycaps along the bottom; `down` = label of the pressed key, `press` 0..1 */
export function keyRow(ctx, labels, down, press, y = 900, { cap = '#1B2045', face = '#262C5C', ink = '#FFFBF4', hi = NIGHT.orange } = {}) {
  const kw = 120, gap = 16, total = labels.length * (kw + gap) - gap; let x = W / 2 - total / 2;
  for (const L of labels) {
    const isDown = L === down, d = isDown ? 14 * press : 0, w = L.length > 1 ? kw * 1.8 : kw;
    ctx.fillStyle = '#05060C'; roundRect(ctx, x, y + 16, w, kw * 0.82, 16); ctx.fill();
    ctx.fillStyle = cap; roundRect(ctx, x, y + d, w, kw * 0.82, 16); ctx.fill();
    ctx.fillStyle = isDown && press > 0.1 ? hi : face; roundRect(ctx, x + 10, y + d + 6, w - 20, kw * 0.62, 12); ctx.fill();
    font(ctx, 40, MONO, '800'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = isDown && press > 0.1 ? '#140A04' : ink;
    ctx.fillText(L, x + w / 2, y + d + 6 + kw * 0.31);
    x += w + gap;
  }
}
