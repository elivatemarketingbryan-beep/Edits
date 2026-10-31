// I01 — "Late night," — THE HOOK. A giant blinking cursor; the camera rockets backwards through five nested
// worlds (terminal → laptop → window → skyscraper facade → night city) where every lit window is a blinking cursor.
// Each layer is drawn in its own local 1920×1080 space with its own transform, so precision holds over a ×13,000 zoom.
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, ease, seg, hash, roundRect, font, lerp, rng } from '../../core/lib.js';
import { terminal, NIGHT, MONO } from './common.js';

const S = shot('I01');

// child rect inside parent (local px): parent = k * child + (x, y)
const PL = {
  A: { x: 560, y: 230, k: 800 / 1920 },   // terminal inside laptop scene
  B: { x: 760, y: 380, k: 400 / 1920 },   // laptop scene inside the window
  C: { x: 900, y: 500, k: 120 / 1920 },   // window wall inside the facade
  D: { x: 870, y: 300, k: 180 / 1920 },   // facade inside the city
};
const FOCUS = { x: 437, y: 560 };          // the cursor centre in terminal space
const S0 = 6.7, SEND = PL.A.k * PL.B.k * PL.C.k * PL.D.k; // final scale of A when E is at 1:1
const endFocus = (() => { let x = FOCUS.x, y = FOCUS.y; for (const p of [PL.A, PL.B, PL.C, PL.D]) { x = p.x + x * p.k; y = p.y + y * p.k; } return { x, y }; })();

// facade grid (D space): window cells 40×30, aligned so the hero window (C's opening) is one of them
const HERO = { x: PL.C.x + 760 * PL.C.k, y: PL.C.y + 380 * PL.C.k, w: 400 * PL.C.k, h: 225 * PL.C.k };
const GX = 40, GY = 30, TOWER = { x0: 600, x1: 1320 };
const winState = (i, j) => { const h = hash(i + 50, j + 50, 7); return h < 0.34 ? 'cursor' : h < 0.52 ? 'warm' : h < 0.6 ? 'blue' : 'dark'; };

function drawWindowPane(ctx, x, y, w, h, st, t, i, j) {
  if (st === 'dark') { ctx.fillStyle = '#0B0F24'; ctx.fillRect(x, y, w, h); return; }
  if (st === 'warm') { ctx.fillStyle = '#F7B955'; ctx.fillRect(x, y, w, h); ctx.fillStyle = 'rgba(120,50,0,0.35)'; ctx.fillRect(x, y + h * 0.6, w, h * 0.4); return; }
  if (st === 'blue') { ctx.fillStyle = '#5A7BFF'; ctx.fillRect(x, y, w, h); return; }
  ctx.fillStyle = '#120A16'; ctx.fillRect(x, y, w, h);
  const on = Math.floor(t * 2.4 + hash(i, j) * 2) % 2 === 0;
  if (on) { ctx.fillStyle = NIGHT.orange; ctx.fillRect(x + w * 0.42, y + h * 0.18, w * 0.16, h * 0.64); }
}

// ---------- E: the night city ----------
function layerE(ctx, t) {
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#03040B'); g.addColorStop(0.6, '#10153A'); g.addColorStop(1, '#2A1E48');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const r = rng(11);
  for (let i = 0; i < 260; i++) { const x = r() * W, y = r() * H * 0.55, tw = 0.5 + 0.5 * Math.sin(t * 6 + i); ctx.fillStyle = `rgba(255,251,244,${0.25 + 0.6 * tw * r()})`; ctx.fillRect(x, y, 2, 2); }
  // moon
  ctx.save(); ctx.shadowColor = 'rgba(255,240,210,0.8)'; ctx.shadowBlur = 60; ctx.fillStyle = '#FFF2D6'; ctx.beginPath(); ctx.arc(1560, 170, 70, 0, TAU); ctx.fill(); ctx.restore();
  ctx.fillStyle = '#03040B'; ctx.beginPath(); ctx.arc(1590, 150, 64, 0, TAU); ctx.fill();
  // far + near skylines
  const city = (seed, base, minH, maxH, col, dot, step) => {
    const q = rng(seed); let x = -20;
    while (x < W + 20) {
      const w = 40 + q() * 90, h = minH + q() * (maxH - minH);
      if (!(x + w > 900 && x < 1020 && seed === 3)) {
        ctx.fillStyle = col; ctx.fillRect(x, base - h, w, h);
        for (let yy = base - h + 8; yy < base - 6; yy += step) for (let xx = x + 6; xx < x + w - 6; xx += step) {
          const hh = hash(Math.floor(xx), Math.floor(yy), seed); if (hh < 0.3) { ctx.fillStyle = hh < 0.12 ? NIGHT.orange : dot; ctx.fillRect(xx, yy, 2.4, 1.6); }
        }
      }
      x += w + 4;
    }
  };
  city(2, 1000, 120, 380, '#0D1129', 'rgba(247,185,85,0.7)', 7);
  // the hero tower (the facade D lives in it): D x 600..1320 → E
  const tx0 = PL.D.x + TOWER.x0 * PL.D.k, tx1 = PL.D.x + TOWER.x1 * PL.D.k;
  ctx.fillStyle = '#151A3A'; ctx.fillRect(tx0, 150, tx1 - tx0, 900);
  ctx.fillStyle = '#1C2250'; ctx.fillRect(tx0 + (tx1 - tx0) * 0.5 - 2, 90, 4, 60);
  ctx.fillStyle = (Math.floor(t * 2) % 2) ? '#FF2A3A' : '#5a0d14'; ctx.beginPath(); ctx.arc(tx0 + (tx1 - tx0) * 0.5, 88, 4, 0, TAU); ctx.fill();
  for (let j = -12; j < 60; j++) for (let i = -12; i < 12; i++) {
    const dx = HERO.x + GX * i, dy = HERO.y + GY * j;
    if (dx < TOWER.x0 + 10 || dx + HERO.w > TOWER.x1 - 10) continue;
    const ex = PL.D.x + dx * PL.D.k, ey = PL.D.y + dy * PL.D.k;
    if (ey < 160 || ey > 1040) continue;
    const st = i === 0 && j === 0 ? 'cursor' : winState(i, j);
    if (st === 'dark') continue;
    ctx.fillStyle = st === 'cursor' ? NIGHT.orange : st === 'warm' ? '#F7B955' : '#5A7BFF';
    ctx.fillRect(ex, ey, HERO.w * PL.D.k, HERO.h * PL.D.k);
  }
  city(3, 1080, 60, 240, '#070A1C', 'rgba(255,200,120,0.55)', 9);
  // orange haze
  const hz = ctx.createLinearGradient(0, 760, 0, H); hz.addColorStop(0, 'rgba(255,106,31,0)'); hz.addColorStop(1, 'rgba(255,106,31,0.22)'); ctx.fillStyle = hz; ctx.fillRect(0, 760, W, 320);
}

// ---------- D: the facade ----------
function layerD(ctx, t, opaque) {
  if (opaque) { const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0B0F2A'); g.addColorStop(1, '#141A40'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
  ctx.fillStyle = '#151A3A'; ctx.fillRect(TOWER.x0, 0, TOWER.x1 - TOWER.x0, H);
  ctx.fillStyle = 'rgba(255,255,255,0.04)'; for (let x = TOWER.x0; x < TOWER.x1; x += GX) ctx.fillRect(x, 0, 2, H);
  for (let j = -20; j < 20; j++) for (let i = -10; i < 10; i++) {
    const x = HERO.x + GX * i, y = HERO.y + GY * j;
    if (x < TOWER.x0 + 10 || x + HERO.w > TOWER.x1 - 10 || y < -30 || y > H) continue;
    if (i === 0 && j === 0) continue; // the hero window is drawn by layer C
    drawWindowPane(ctx, x, y, HERO.w, HERO.h, winState(i, j), t, i, j);
  }
}

// ---------- C: one window from outside ----------
function layerC(ctx, t) {
  ctx.fillStyle = '#171C40'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(255,255,255,0.03)'; for (let y = 0; y < H; y += 60) ctx.fillRect(0, y, W, 3);
  const sc = 1 / PL.C.k; // facade px → C px
  for (let j = -2; j <= 2; j++) for (let i = -3; i <= 3; i++) {
    const x = 760 + GX * sc * i, y = 380 + GY * sc * j;
    if (i === 0 && j === 0) continue;
    if (x > W || x + 400 < 0 || y > H || y + 225 < 0) continue;
    drawWindowPane(ctx, x, y, 400, 225, winState(i, j), t, i, j);
    ctx.strokeStyle = '#0A0D20'; ctx.lineWidth = 14; ctx.strokeRect(x, y, 400, 225);
  }
  // glow spilling from the hero window
  const g = ctx.createRadialGradient(960, 492, 50, 960, 492, 600); g.addColorStop(0, 'rgba(255,120,50,0.35)'); g.addColorStop(1, 'rgba(255,120,50,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
function layerCFrame(ctx) { // drawn after B, over the window opening
  ctx.save();
  ctx.strokeStyle = '#0A0D20'; ctx.lineWidth = 16; ctx.strokeRect(760, 380, 400, 225);
  ctx.globalAlpha = 0.18; ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.moveTo(800, 380); ctx.lineTo(860, 380); ctx.lineTo(780, 605); ctx.lineTo(760, 605); ctx.lineTo(760, 500); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(1040, 380); ctx.lineTo(1060, 380); ctx.lineTo(990, 605); ctx.lineTo(970, 605); ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#0A0D20'; ctx.fillRect(740, 600, 440, 18);
}

// ---------- B: laptop on a desk at night ----------
function layerB(ctx, t) {
  ctx.fillStyle = '#0A0C1E'; ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(960, 450, 40, 960, 450, 1000); g.addColorStop(0, 'rgba(255,110,40,0.42)'); g.addColorStop(0.5, 'rgba(60,40,120,0.25)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // desk
  ctx.fillStyle = '#1A1430'; ctx.fillRect(0, 760, W, 320);
  const dg = ctx.createLinearGradient(0, 760, 0, H); dg.addColorStop(0, 'rgba(255,120,60,0.35)'); dg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = dg; ctx.fillRect(0, 760, W, 320);
  // laptop lid + base
  ctx.fillStyle = '#23263A'; roundRect(ctx, 530, 200, 860, 510, 24); ctx.fill();
  ctx.fillStyle = '#05060D'; ctx.fillRect(560, 230, 800, 450);
  ctx.fillStyle = '#2E3248'; ctx.beginPath(); ctx.moveTo(500, 712); ctx.lineTo(1420, 712); ctx.lineTo(1500, 790); ctx.lineTo(420, 790); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#3A3F5C'; ctx.fillRect(420, 790, 1080, 12);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 14; c++) { ctx.fillStyle = 'rgba(255,140,80,0.18)'; ctx.fillRect(560 + c * 58 + r * 6 - 12, 722 + r * 16, 48, 11); }
  // mug + steam, plant
  ctx.fillStyle = '#E8343F'; roundRect(ctx, 1560, 640, 110, 130, 14); ctx.fill(); ctx.strokeStyle = '#E8343F'; ctx.lineWidth = 16; ctx.beginPath(); ctx.arc(1680, 700, 32, -1.2, 1.2); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 6; for (let k = 0; k < 3; k++) { ctx.beginPath(); for (let y = 0; y < 120; y += 6) ctx.lineTo(1590 + k * 25 + Math.sin(y * 0.08 + t * 4 + k) * 10, 620 - y); ctx.stroke(); }
  ctx.fillStyle = '#2B6B4A'; for (let k = 0; k < 7; k++) { ctx.save(); ctx.translate(260, 700); ctx.rotate(-1.2 + k * 0.4 + Math.sin(t + k) * 0.03); ctx.beginPath(); ctx.ellipse(0, -90, 26, 90, 0, 0, TAU); ctx.fill(); ctx.restore(); }
  ctx.fillStyle = '#C46A3A'; ctx.fillRect(210, 700, 100, 80);
}

function setT(ctx, T) { ctx.setTransform(T.s, 0, 0, T.s, T.tx, T.ty); }
const parentOf = (T, p) => { const s = T.s / p.k; return { s, tx: T.tx - s * p.x, ty: T.ty - s * p.y }; };
const covers = (T, p) => { const X = T.tx + T.s * p.x, Y = T.ty + T.s * p.y, Wd = T.s * p.k * W, Hd = T.s * p.k * H; return X <= 0 && Y <= 0 && X + Wd >= W && Y + Hd >= H; };

export default {
  ...S,
  hud: 'paper', cutIn: 'none',
  sfx: [{ t: 0.05, type: 'boom', gain: 1 }, { t: 0.32, type: 'whoosh', gain: 0.9 }, { t: 0.4, type: 'impact', gain: 0.7 }],
  draw(ctx, t, s, E) {
    const zu = ease.inOutCubic(seg(t, 0.28, 1.1));
    const sA = Math.exp(lerp(Math.log(S0), Math.log(SEND), zu));
    // screen position of the focus: from right-of-centre to its final place in the city
    const fx = lerp(1290, endFocus.x, zu), fy = lerp(540, endFocus.y, zu);
    const TA = { s: sA, tx: fx - sA * FOCUS.x, ty: fy - sA * FOCUS.y };
    const TB = parentOf(TA, PL.A), TC = parentOf(TB, PL.B), TD = parentOf(TC, PL.C), TE = parentOf(TD, PL.D);
    // outer → inner; skip parents whose child already covers the whole screen
    const layers = [[TE, layerE, PL.D], [TD, layerD, PL.C], [TC, layerC, PL.B], [TB, layerB, PL.A]];
    let start = 0;
    for (let i = layers.length - 1; i >= 0; i--) if (covers(layers[i][0], layers[i][2])) { start = i + 1; break; }
    for (let i = start; i < layers.length; i++) { const [T, fn] = layers[i]; ctx.save(); setT(ctx, T); fn(ctx, t, i === start); ctx.restore(); }
    // terminal (A) clipped to the laptop screen
    ctx.save(); setT(ctx, TA); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
    const on = t < 0.3 ? true : Math.floor(t * 4) % 2 === 0 || zu > 0.02;
    terminal(ctx, t, { typed: '', cursorOn: on, size: 120, x0: 250, y0: 560 });
    ctx.restore();
    if (start <= 2) { ctx.save(); setT(ctx, TC); layerCFrame(ctx); ctx.restore(); }
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // giant type: LATE (0.05) / NIGHT (0.40)
    const slam = (str, t0, y, sz) => {
      if (t < t0) return;
      const k = ease.outExpo((t - t0) / 0.22), sc = lerp(1.6, 1, k);
      ctx.save(); ctx.translate(120, y); ctx.scale(sc, sc);
      font(ctx, sz, MONO, '800'); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(255,106,31,0.9)'; ctx.shadowBlur = 50; ctx.fillStyle = '#FFFBF4'; ctx.fillText(str, 0, 0);
      ctx.restore();
    };
    slam('LATE', 0.05, 390, 250);
    slam('NIGHT', 0.40, 650, 250);
    // FX: impact punches + motion blur during the fast pull-back
    const speed = Math.abs(ease.inOutCubic(seg(t + 1 / 30, 0.28, 1.1)) - zu) * 30;
    E.fx.radialBlur = clamp(speed * 0.12, 0, 0.45);
    E.fx.center = [fx / W, 1 - fy / H];
    const hit = Math.max(t >= 0.05 ? Math.exp(-(t - 0.05) * 12) : 0, t >= 0.4 ? Math.exp(-(t - 0.4) * 12) : 0);
    E.fx.shake = 22 * hit; E.fx.rgb = 10 * hit; E.fx.zoom += 0.04 * hit;
    E.fx.bloom = 0.6; E.fx.bloomThreshold = 0.6;
    if (t < 0.06) E.fx.flash = [1, 0.6, 0.3, 1 - t / 0.06];
  },
};
