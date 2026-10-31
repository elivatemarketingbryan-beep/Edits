// g4 shared "internet brutalism" UI kit: Win95-style bevelled windows, title bars, buttons, pointers.
import { TAU, font } from '../../core/lib.js';
import { C } from './_util.js';

export function bevel(ctx, x, y, w, h, inset = false, face = C.grey) {
  ctx.fillStyle = face; ctx.fillRect(x, y, w, h);
  const lt = inset ? '#5A5A5A' : '#FFFFFF', dk = inset ? '#FFFFFF' : '#0E0E12', md = inset ? '#E8E8E8' : '#7B7B7B';
  ctx.fillStyle = lt; ctx.fillRect(x, y, w, 3); ctx.fillRect(x, y, 3, h);
  ctx.fillStyle = dk; ctx.fillRect(x, y + h - 3, w, 3); ctx.fillRect(x + w - 3, y, 3, h);
  ctx.fillStyle = md; ctx.fillRect(x + 3, y + h - 6, w - 6, 3); ctx.fillRect(x + w - 6, y + 3, 3, h - 6);
}

/** a whole Win95 window frame; returns the client rect + close-button centre */
export function win(ctx, x, y, w, h, title, o = {}) {
  const tb = o.tb ?? Math.max(26, Math.min(44, h * 0.11));
  if (o.shadow !== false) { ctx.fillStyle = 'rgba(14,14,18,0.35)'; ctx.fillRect(x + 10, y + 12, w, h); }
  bevel(ctx, x, y, w, h);
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, o.active === false ? '#808080' : '#000080'); g.addColorStop(1, o.active === false ? '#B5B5B5' : C.blue);
  ctx.fillStyle = g; ctx.fillRect(x + 6, y + 6, w - 12, tb);
  ctx.save(); ctx.beginPath(); ctx.rect(x + 6, y + 6, w - 12 - tb * 2.3, tb); ctx.clip();
  font(ctx, tb * 0.56, 'JetBrains Mono', '800'); ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(title, x + 14 + (o.icon ? tb * 0.8 : 0), y + 6 + tb / 2 + 1);
  if (o.icon) { ctx.fillStyle = C.red; ctx.beginPath(); ctx.moveTo(x + 14 + tb * 0.3, y + 10); ctx.lineTo(x + 14 + tb * 0.6, y + tb); ctx.lineTo(x + 14, y + tb); ctx.closePath(); ctx.fill(); }
  ctx.restore();
  // ✕ button
  const bs = tb - 8, bx = x + w - 10 - bs, by = y + 10;
  bevel(ctx, bx, by, bs, bs - 2, !!o.pressed);
  ctx.strokeStyle = '#0E0E12'; ctx.lineWidth = Math.max(2.5, bs * 0.14); ctx.lineCap = 'square';
  const m = bs * 0.3, pp = o.pressed ? 2 : 0;
  ctx.beginPath(); ctx.moveTo(bx + m + pp, by + m + pp); ctx.lineTo(bx + bs - m + pp, by + bs - 2 - m + pp); ctx.moveTo(bx + bs - m + pp, by + m + pp); ctx.lineTo(bx + m + pp, by + bs - 2 - m + pp); ctx.stroke();
  if (o.minmax !== false) { bevel(ctx, bx - bs - 4, by, bs, bs - 2); bevel(ctx, bx - bs * 2 - 6, by, bs, bs - 2); ctx.fillStyle = '#0E0E12'; ctx.fillRect(bx - bs * 2 - 6 + bs * 0.25, by + bs * 0.62, bs * 0.45, 3); ctx.strokeStyle = '#0E0E12'; ctx.lineWidth = 2.5; ctx.strokeRect(bx - bs - 4 + bs * 0.25, by + bs * 0.22, bs * 0.5, bs * 0.45); }
  return { cx: x + 6, cy: y + 6 + tb + 4, cw: w - 12, ch: h - tb - 16, close: [bx + bs / 2, by + bs / 2], tb };
}

export function button(ctx, x, y, w, h, label, size, pressed = false, face = C.grey, fg = '#0E0E12') {
  bevel(ctx, x, y, w, h, pressed, face);
  font(ctx, size, 'JetBrains Mono', '800'); ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(label, x + w / 2 + (pressed ? 2 : 0), y + h / 2 + (pressed ? 2 : 0) + 1);
}

/** classic arrow mouse pointer, tip at (x,y) */
export function pointer(ctx, x, y, s = 1, fill = '#FFFFFF', ink = '#0E0E12', rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 34); ctx.lineTo(8, 26); ctx.lineTo(14, 40); ctx.lineTo(20, 37); ctx.lineTo(14, 24); ctx.lineTo(25, 24); ctx.closePath();
  ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = 2.6; ctx.strokeStyle = ink; ctx.lineJoin = 'miter'; ctx.stroke();
  ctx.restore();
}

/** warning triangle icon */
export function warn(ctx, x, y, s) {
  ctx.fillStyle = '#0E0E12'; ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s * 1.1, y + s * 0.8); ctx.lineTo(x - s * 1.1, y + s * 0.8); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#FFE14D'; ctx.beginPath(); ctx.moveTo(x, y - s * 0.72); ctx.lineTo(x + s * 0.86, y + s * 0.66); ctx.lineTo(x - s * 0.86, y + s * 0.66); ctx.closePath(); ctx.fill();
  font(ctx, s * 1.1, 'Anton'); ctx.fillStyle = '#0E0E12'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('!', x, y + s * 0.12);
}
export function errIcon(ctx, x, y, s) {
  ctx.fillStyle = C.red; ctx.beginPath(); ctx.arc(x, y, s, 0, TAU); ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = '#0E0E12'; ctx.stroke();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = s * 0.28; ctx.beginPath(); ctx.moveTo(x - s * 0.4, y - s * 0.4); ctx.lineTo(x + s * 0.4, y + s * 0.4); ctx.moveTo(x + s * 0.4, y - s * 0.4); ctx.lineTo(x - s * 0.4, y + s * 0.4); ctx.stroke();
}
