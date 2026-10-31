// Shared gold slot machine for G01 (lever pull + spin) and G02 (reels land on $0.00 → JACKPOT).
// Machine-local units: reel window centred at (0,-50); cabinet x ±430, y −520 … 470. Lever pivot at (455,-40).
import { TAU, clamp, lerp, ease, font, roundRect, star, hash } from '../../core/lib.js';
import { goldGrad, glowSprite } from './kit.js';

export const SYMS = ['7', 'cherry', 'BAR', 'bell', '$0.00', 'star', 'cursor', 'coin'];
export const NS = SYMS.length, TARGET = 4, PITCH = 128;
export const LEVER = { px: 455, py: -40, len: 300, rest: -1.22, down: 0.95 };

// ---------- reel kinematics (pure functions of t) ----------
const V = 24;                    // symbols / s at full spin
export const REEL_START = [77.5, 77.55, 77.6];
export const REEL_STOP = [78.47, 78.65, 78.83];  // landing begins; first contact ≈ +0.12 s
const LAND = 0.28, D0 = 1.5;
const raw = (i, t) => { const tau = t - REEL_START[i]; if (tau <= 0) return 0; return tau < 0.15 ? V * tau * tau / 0.3 : V * (tau - 0.075); };
const phase = (i) => { const p = raw(i, REEL_STOP[i]); return ((((TARGET - D0) - p) % NS) + NS) % NS; };
/** reel position (symbol index units, fractional) and speed */
export function reel(i, t) {
  const ph = phase(i);
  if (t < REEL_STOP[i]) {
    const kick = t > REEL_START[i] - 0.12 && t < REEL_START[i] ? -0.18 * Math.sin(Math.PI * (t - REEL_START[i] + 0.12) / 0.12) : 0;
    const p = raw(i, t) + ph + kick;
    return { p, v: t > REEL_START[i] ? Math.min(V, V * (t - REEL_START[i]) / 0.15) : 0 };
  }
  const p0 = raw(i, REEL_STOP[i]) + ph, u = (t - REEL_STOP[i]) / LAND;
  if (u >= 1) return { p: p0 + D0, v: 0, landed: t - REEL_STOP[i] - LAND * 0.45 };
  const e = ease.outBack(u, 2.2);
  return { p: p0 + D0 * e, v: Math.max(0, (1 - u) * V * 0.8), landed: t - REEL_STOP[i] - LAND * 0.45 };
}

// ---------- symbol art ----------
export function drawSymbol(x, id, cx, cy, k = 1) {
  x.save(); x.translate(cx, cy); x.scale(k, k);
  x.lineJoin = 'round'; x.lineCap = 'round';
  const ink = '#111111';
  switch (id) {
    case '7': {
      font(x, 104, 'Bungee'); x.textAlign = 'center'; x.textBaseline = 'middle';
      x.lineWidth = 12; x.strokeStyle = ink; x.strokeText('7', 4, 8); x.fillStyle = ink; x.fillText('7', 4, 8);
      x.strokeText('7', 0, 2); x.fillStyle = '#E8343F'; x.fillText('7', 0, 2);
      x.fillStyle = 'rgba(255,255,255,0.5)'; x.fillRect(-30, -36, 46, 8);
      break;
    }
    case 'cherry': {
      x.strokeStyle = '#1E7A34'; x.lineWidth = 7;
      x.beginPath(); x.moveTo(-22, 10); x.quadraticCurveTo(-8, -30, 14, -44); x.moveTo(24, 14); x.quadraticCurveTo(20, -20, 14, -44); x.stroke();
      x.fillStyle = '#2E9E44'; x.beginPath(); x.ellipse(28, -42, 20, 9, -0.4, 0, TAU); x.fill(); x.lineWidth = 4; x.strokeStyle = ink; x.stroke();
      for (const [px, py] of [[-24, 22], [24, 26]]) { x.beginPath(); x.arc(px, py, 25, 0, TAU); x.fillStyle = '#E8343F'; x.fill(); x.lineWidth = 6; x.strokeStyle = ink; x.stroke(); x.fillStyle = 'rgba(255,255,255,0.7)'; x.beginPath(); x.arc(px - 9, py - 9, 6, 0, TAU); x.fill(); }
      break;
    }
    case 'BAR': {
      roundRect(x, -72, -32, 144, 64, 12); x.fillStyle = ink; x.fill();
      roundRect(x, -64, -24, 128, 48, 8); x.lineWidth = 3; x.strokeStyle = '#FFC300'; x.stroke();
      font(x, 40, 'Bungee'); x.fillStyle = '#FFC300'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('BAR', 0, 3);
      break;
    }
    case 'bell': {
      x.beginPath(); x.moveTo(-44, 30); x.quadraticCurveTo(-36, 18, -32, -6); x.quadraticCurveTo(-28, -44, 0, -46); x.quadraticCurveTo(28, -44, 32, -6); x.quadraticCurveTo(36, 18, 44, 30); x.closePath();
      x.fillStyle = goldGrad(x, -46, 30, -40, 40); x.fill(); x.lineWidth = 6; x.strokeStyle = ink; x.stroke();
      x.beginPath(); x.arc(0, 36, 10, 0, TAU); x.fillStyle = ink; x.fill();
      x.beginPath(); x.arc(0, -50, 7, 0, TAU); x.fill();
      x.fillStyle = 'rgba(255,255,255,0.6)'; x.fillRect(-20, -30, 7, 34);
      break;
    }
    case '$0.00': {
      font(x, 58, 'Bungee'); x.textAlign = 'center'; x.textBaseline = 'middle';
      x.lineWidth = 10; x.strokeStyle = ink; x.strokeText('$0.00', 4, 6); x.fillStyle = ink; x.fillText('$0.00', 4, 6);
      x.strokeText('$0.00', 0, 0); x.fillStyle = '#FF6A1F'; x.fillText('$0.00', 0, 0);
      x.fillStyle = 'rgba(255,255,255,0.45)'; x.fillRect(-74, -16, 148, 6);
      break;
    }
    case 'star': {
      star(x, 0, 0, 48, 21, 5); x.fillStyle = '#FFC300'; x.fill(); x.lineWidth = 6; x.strokeStyle = ink; x.stroke();
      star(x, -6, -6, 18, 8, 5); x.fillStyle = 'rgba(255,255,255,0.6)'; x.fill();
      break;
    }
    case 'cursor': {
      roundRect(x, -30, -42, 60, 84, 14); x.fillStyle = '#FF6A1F'; x.fill(); x.lineWidth = 6; x.strokeStyle = '#1F2A55'; x.stroke();
      x.fillStyle = '#fff'; roundRect(x, -19, -28, 14, 20, 5); x.fill(); roundRect(x, 5, -28, 14, 20, 5); x.fill();
      x.fillStyle = '#1F2A55'; x.fillRect(-14, -24, 6, 12); x.fillRect(10, -24, 6, 12);
      font(x, 22, 'JetBrains Mono', '800'); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('>_', 0, 22);
      break;
    }
    case 'coin': {
      x.beginPath(); x.arc(0, 0, 44, 0, TAU); x.fillStyle = goldGrad(x, -44, 44, -30, 30); x.fill(); x.lineWidth = 6; x.strokeStyle = ink; x.stroke();
      x.beginPath(); x.arc(0, 0, 33, 0, TAU); x.lineWidth = 3; x.strokeStyle = '#9A6400'; x.stroke();
      font(x, 46, 'Bungee'); x.fillStyle = '#9A6400'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('$', 0, 3);
      break;
    }
  }
  x.restore();
}

function bulb(x, px, py, r, on) {
  if (on > 0.05) { x.globalCompositeOperation = 'lighter'; x.globalAlpha = on * 0.55; x.drawImage(glowSprite('bulb', '255,200,80', 64), px - r * 3, py - r * 3, r * 6, r * 6); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; }
  x.beginPath(); x.arc(px, py, r, 0, TAU);
  x.fillStyle = on > 0.5 ? '#FFF7D0' : '#8A5A00'; x.fill(); x.lineWidth = 3; x.strokeStyle = '#111'; x.stroke();
  if (on > 0.5) { x.beginPath(); x.arc(px - r * 0.3, py - r * 0.3, r * 0.35, 0, TAU); x.fillStyle = '#fff'; x.fill(); }
}

/**
 * Draw the machine. o: {t, cx, cy, sc, lever (rad), lit 0..1, chase (bulb chase phase), reels:[{p,v,landed}], tokens, winFlash 0..1}
 * Returns world coords of useful anchors.
 */
export function drawSlot(x, o) {
  const { t } = o;
  x.save(); x.translate(o.cx, o.cy); x.scale(o.sc, o.sc);
  // drop shadow
  x.fillStyle = 'rgba(17,17,17,0.9)';
  roundRect(x, -430 + 30, -330 + 30, 860, 800, 60); x.fill();
  // ---- lever (behind the cabinet edge) ----
  const L = LEVER, la = o.lever ?? L.rest;
  const kx = L.px + Math.cos(la) * L.len, ky = L.py + Math.sin(la) * L.len;
  roundRect(x, 418, -110, 74, 140, 18); x.fillStyle = goldGrad(x, -110, 30, 418, 492); x.fill(); x.lineWidth = 9; x.strokeStyle = '#111'; x.stroke();
  x.lineCap = 'round';
  x.strokeStyle = '#111'; x.lineWidth = 34; x.beginPath(); x.moveTo(L.px, L.py); x.lineTo(kx, ky); x.stroke();
  const rg = x.createLinearGradient(L.px - 10, 0, L.px + 10, 0); rg.addColorStop(0, '#8E98AA'); rg.addColorStop(0.5, '#FFFFFF'); rg.addColorStop(1, '#6C7588');
  x.strokeStyle = '#DDE3EE'; x.lineWidth = 20; x.beginPath(); x.moveTo(L.px, L.py); x.lineTo(kx, ky); x.stroke();
  x.strokeStyle = 'rgba(255,255,255,0.9)'; x.lineWidth = 5; x.beginPath(); x.moveTo(L.px - 4, L.py - 4); x.lineTo(kx - 4, ky - 4); x.stroke();
  x.beginPath(); x.arc(L.px, L.py, 26, 0, TAU); x.fillStyle = '#111'; x.fill();
  x.beginPath(); x.arc(kx, ky, 46, 0, TAU); x.fillStyle = '#E8343F'; x.fill(); x.lineWidth = 9; x.strokeStyle = '#111'; x.stroke();
  x.beginPath(); x.arc(kx - 14, ky - 14, 13, 0, TAU); x.fillStyle = 'rgba(255,255,255,0.75)'; x.fill();

  // ---- cabinet body ----
  const body = x.createLinearGradient(-430, 0, 430, 0);
  body.addColorStop(0, '#B07400'); body.addColorStop(0.08, '#FFD84A'); body.addColorStop(0.22, '#FFF1B0'); body.addColorStop(0.36, '#FFC300');
  body.addColorStop(0.7, '#E0A100'); body.addColorStop(0.9, '#FFCF3A'); body.addColorStop(1, '#9A6400');
  roundRect(x, -430, -330, 860, 800, 50); x.fillStyle = body; x.fill(); x.lineWidth = 12; x.strokeStyle = '#111'; x.stroke();
  // marquee arch
  x.beginPath(); x.moveTo(-400, -300); x.lineTo(-400, -420); x.quadraticCurveTo(0, -620, 400, -420); x.lineTo(400, -300); x.closePath();
  x.fillStyle = '#111'; x.fill(); x.lineWidth = 12; x.stroke();
  x.save(); x.beginPath(); x.moveTo(-372, -318); x.lineTo(-372, -410); x.quadraticCurveTo(0, -584, 372, -410); x.lineTo(372, -318); x.closePath(); x.clip();
  const lit = o.lit || 0;
  if (lit > 0) { // rotating rays behind the JACKPOT sign when lit
    x.globalAlpha = lit; for (let i = 0; i < 18; i++) { const a0 = t * 2 + (i / 18) * TAU, a1 = a0 + TAU / 36; x.fillStyle = i % 2 ? '#FF6A1F' : '#FFC300'; x.beginPath(); x.moveTo(0, -380); x.lineTo(Math.cos(a0) * 900, -380 + Math.sin(a0) * 900); x.lineTo(Math.cos(a1) * 900, -380 + Math.sin(a1) * 900); x.closePath(); x.fill(); }
    x.globalAlpha = 1;
  }
  x.restore();
  font(x, 104, 'Bungee'); x.textAlign = 'center'; x.textBaseline = 'middle';
  const jk = lit > 0 ? (Math.floor(t * 12) % 2 ? 1 : 0.75) : 0;
  x.lineWidth = 14; x.strokeStyle = '#111'; x.strokeText('JACKPOT', 6, -392); x.fillStyle = '#111'; x.fillText('JACKPOT', 6, -392);
  if (lit > 0) { x.globalCompositeOperation = 'lighter'; x.globalAlpha = 0.6 * lit; x.drawImage(glowSprite('jk', '255,200,60', 64), -460, -520, 920, 260); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; }
  x.fillStyle = lit > 0 ? (jk > 0.9 ? '#FFF4D6' : '#FFC300') : '#5A4310'; x.strokeText('JACKPOT', 0, -398); x.fillText('JACKPOT', 0, -398);
  // bulbs along the arch
  const chase = o.chase || 0;
  for (let i = 0; i < 15; i++) {
    const u = i / 14, bx = lerp(-370, 370, u), by = (1 - u) * (1 - u) * -410 + 2 * (1 - u) * u * -600 + u * u * -410 + 30;
    const on = lit > 0 ? (Math.floor(t * 14 + i) % 2) : ((Math.floor(chase) + i) % 3 === 0 ? 1 : 0.08);
    bulb(x, bx, by + 8, 15, on);
  }
  // side bulb columns
  for (let s = -1; s <= 1; s += 2) for (let i = 0; i < 11; i++) {
    const by = -280 + i * 68, on = lit > 0 ? (Math.floor(t * 14 + i + (s > 0 ? 1 : 0)) % 2) : ((Math.floor(chase) + (s > 0 ? 10 - i : i)) % 3 === 0 ? 1 : 0.08);
    bulb(x, s * 398, by, 13, on);
  }
  // ---- reel window ----
  roundRect(x, -372, -232, 744, 368, 30); x.fillStyle = '#111'; x.fill();
  const reels = o.reels || [];
  for (let i = 0; i < 3; i++) {
    const rx = -246 + i * 246, w = 226, h = 330, ry = -50;
    x.save(); roundRect(x, rx - w / 2, ry - h / 2, w, h, 16); x.clip();
    x.fillStyle = '#FFF4D6'; x.fillRect(rx - w / 2, ry - h / 2, w, h);
    const R = reels[i] || { p: 0, v: 0 };
    const blurN = R.v > 6 ? 9 : R.v > 1 ? 3 : 1, shift = (R.v / 30) * PITCH * 1.4; // per-frame travel → motion blur samples
    const base = Math.floor(R.p), fr = R.p - base;
    for (let b = 0; b < blurN; b++) {
      const off = blurN > 1 ? (b / (blurN - 1) - 0.5) * shift : 0;
      x.globalAlpha = blurN > 3 ? 0.17 : blurN > 1 ? 0.4 : 1;
      for (let j = -2; j <= 2; j++) {
        const idx = ((base - j) % NS + NS) % NS; // reel scrolls downward
        const sy = ry + (j + fr) * PITCH + off;
        const sq = blurN > 1 ? 1 : 1;
        x.save(); x.translate(rx, sy); x.scale(1, sq); drawSymbol(x, SYMS[idx], 0, 0, 0.92); x.restore();
      }
    }
    x.globalAlpha = 1;
    // win flash on landing
    if (R.landed !== undefined && R.landed > -0.02 && R.landed < 0.4) { x.globalCompositeOperation = 'lighter'; x.fillStyle = `rgba(255,200,60,${0.7 * (1 - R.landed / 0.4)})`; x.fillRect(rx - w / 2, ry - h / 2, w, h); x.globalCompositeOperation = 'source-over'; }
    // cylinder shading + glass
    const sh = x.createLinearGradient(0, ry - h / 2, 0, ry + h / 2);
    sh.addColorStop(0, 'rgba(60,30,0,0.55)'); sh.addColorStop(0.22, 'rgba(60,30,0,0)'); sh.addColorStop(0.78, 'rgba(60,30,0,0)'); sh.addColorStop(1, 'rgba(60,30,0,0.55)');
    x.fillStyle = sh; x.fillRect(rx - w / 2, ry - h / 2, w, h);
    x.fillStyle = 'rgba(255,255,255,0.22)'; x.beginPath(); x.moveTo(rx - w / 2, ry - h / 2); x.lineTo(rx - w / 2 + 70, ry - h / 2); x.lineTo(rx - w / 2 + 10, ry + h / 2); x.lineTo(rx - w / 2, ry + h / 2); x.fill();
    x.restore();
    roundRect(x, rx - w / 2, ry - h / 2, w, h, 16); x.lineWidth = 7; x.strokeStyle = '#111'; x.stroke();
  }
  // payline
  x.fillStyle = '#E8343F'; x.fillRect(-372, -54, 744, 7);
  x.beginPath(); x.moveTo(-372, -70); x.lineTo(-344, -50); x.lineTo(-372, -30); x.fill();
  x.beginPath(); x.moveTo(372, -70); x.lineTo(344, -50); x.lineTo(372, -30); x.fill();
  // ---- meters ----
  const meter = (mx, label, val, col) => {
    roundRect(x, mx - 170, 168, 340, 108, 16); x.fillStyle = '#111'; x.fill();
    font(x, 22, 'JetBrains Mono', '800'); x.fillStyle = '#FFC300'; x.textAlign = 'left'; x.textBaseline = 'middle'; x.fillText(label, mx - 152, 192);
    roundRect(x, mx - 154, 206, 308, 56, 8); x.fillStyle = '#1C1406'; x.fill();
    font(x, 42, 'JetBrains Mono', '800'); x.fillStyle = col; x.textAlign = 'right'; x.fillText(val, mx + 142, 236);
  };
  meter(-200, 'TOKENS', (o.tokens ?? 0).toLocaleString('en-US'), '#FF8A3D');
  meter(200, 'COST', '$0.00', '#7CFFC4');
  // coin tray
  roundRect(x, -300, 318, 600, 120, 26); x.fillStyle = '#111'; x.fill();
  roundRect(x, -270, 340, 540, 70, 18); x.fillStyle = '#2A1E08'; x.fill();
  x.strokeStyle = '#FFE58A'; x.lineWidth = 4; x.beginPath(); x.moveTo(-250, 344); x.lineTo(250, 344); x.stroke();
  // gloss streak on the cabinet
  x.fillStyle = 'rgba(255,255,255,0.35)'; roundRect(x, -404, -290, 18, 720, 9); x.fill();
  x.restore();
  const wp = (lx, ly) => [o.cx + lx * o.sc, o.cy + ly * o.sc];
  return { knob: wp(kx, ky), pivot: wp(L.px, L.py), tray: wp(0, 380), reelC: wp(0, -50), wp };
}

/** cream + gold sunburst backdrop with halftone and drifting glints */
export function goldBackdrop(x, t, cx, cy, rot, W, H, intensity = 1) {
  x.fillStyle = '#FFF4D6'; x.fillRect(0, 0, W, H);
  const n = 28;
  for (let i = 0; i < n; i++) {
    const a0 = rot + (i / n) * TAU, a1 = a0 + TAU / n / 2;
    x.fillStyle = i % 2 ? '#FFC300' : '#FFE9A8';
    x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(a0) * 2600, cy + Math.sin(a0) * 2600); x.lineTo(cx + Math.cos(a1) * 2600, cy + Math.sin(a1) * 2600); x.closePath(); x.fill();
  }
  // halftone vignette dots
  x.fillStyle = 'rgba(255,106,31,0.55)'; x.beginPath();
  for (let y = 0; y < H + 30; y += 30) for (let xx = (y / 30) % 2 ? 15 : 0; xx < W + 30; xx += 30) {
    const d = Math.hypot(xx - W / 2, y - H / 2) / 1100; const r = clamp((d - 0.45) * 14, 0, 9) * intensity;
    if (r > 0.4) { x.moveTo(xx + r, y); x.arc(xx, y, r, 0, TAU); }
  }
  x.fill();
}
