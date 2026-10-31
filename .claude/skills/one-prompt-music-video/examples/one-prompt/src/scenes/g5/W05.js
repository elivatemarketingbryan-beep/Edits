// W05 — "One guy with a laptop and a crazy idea" — a faceless geometric guy in a hoodie at a laptop inside a
// Win95 window; name-tag stickers pop on the words; the light bulb over his head flickers on "crazy", launches as a
// rocket through the title bar and bursts on "idea" into a REAL firework: every star integrates
// dv/dt = g − k·v (closed-form drag + gravity), a pattern shell whose star velocities ∝ the shape "IDEA!",
// a peony of 600 coloured stars with trails, crackle/glitter flicker and secondary ring breaks.
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, rng, font, buf, bctx, roundRect, textPoints, hash, wobble } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { C, slam, hit, kick, win95, grid, speedLines, bevel } from './_g5.js';

const S = shot('W05');
const T0 = S.start;
const T_GUY = 62.92, T_LAPTOP = 63.6, T_TEAM = 63.82, T_FLICK = 64.04, T_CRAZY = 64.2, T_LAUNCH = 64.26, T_IDEA = 64.44;
const CAM_UP = 470;
const BULB = [960, 300];                // world coords (before camera tilt)
const BURST = [960, 300 - CAM_UP];      // burst point in world coords (lands at screen y≈300 after tilt)

// ---------- firework physics (closed form) ----------
const K = 6.5, GR = 820;               // drag (1/s), gravity (px/s²)
function ballistic(p0, v0, tt, out) {
  const e = 1 - Math.exp(-K * tt);
  out[0] = p0[0] + v0[0] * e / K;
  out[1] = p0[1] + (GR / K) * tt + (v0[1] - GR / K) * e / K;
  return out;
}
let FW = null;
function fireworks() {
  if (FW) return FW;
  const r = rng(2024);
  const stars = [];
  // pattern shell: IDEA! — v0 = k·(target − p0) so the shape saturates at the letters (then droops)
  const pts = textPoints('IDEA!', { size: 330, family: 'Anton', step: 9 });
  for (const p of pts) stars.push({ t0: T_IDEA, p0: BURST, v0: [p.x * K * 1.02 + r.range(-8, 8), p.y * K * 1.02 + r.range(-8, 8)], life: r.range(0.75, 1.1), col: r() < 0.82 ? 0 : 1, w: 3.2, fl: r() < 0.35 });
  // peony: 600 stars on a sphere (projected) — red / white / orange
  for (let i = 0; i < 520; i++) {
    const a = r() * TAU, z = r.range(-1, 1), rr = Math.sqrt(1 - z * z), sp = r.range(0.95, 1.04) * 3300;
    stars.push({ t0: T_IDEA + 0.02, p0: BURST, v0: [Math.cos(a) * rr * sp, Math.sin(a) * rr * sp], life: r.range(0.5, 0.95), col: [2, 1, 3, 2][i % 4], w: 2.6, fl: r() < 0.5 });
  }
  // secondary ring breaks (crossette-style) around the rim
  const rings = [[T_IDEA + 0.2, [-420, -90], 1], [T_IDEA + 0.27, [430, -60], 2], [T_IDEA + 0.33, [-120, 210], 3], [T_IDEA + 0.38, [260, 230], 1]];
  for (const [tb, off, col] of rings) {
    const p0 = [BURST[0] + off[0], BURST[1] + off[1]];
    for (let i = 0; i < 70; i++) { const a = (i / 70) * TAU + r() * 0.05, sp = 900 + r() * 60; stars.push({ t0: tb, p0, v0: [Math.cos(a) * sp, Math.sin(a) * sp * 0.92], life: r.range(0.35, 0.5), col, w: 2.2, fl: true }); }
  }
  // rocket trail sparks
  const trail = [];
  for (let i = 0; i < 160; i++) { const te = T_LAUNCH + (i / 160) * (T_IDEA - T_LAUNCH); trail.push({ te, v: [r.range(-160, 160), r.range(60, 380)], life: r.range(0.18, 0.4) }); }
  FW = { stars, trail };
  return FW;
}
const SPARK = ['#FFF6C8', '#FFFFFF', '#FF2A2A', '#FF8A3D'];
// snap-zoom camera: [t0, dur, ease, {s, x, y}] — punches on the words, whip back wide, creep to the bulb
const CAMK = [
  [T0, 0.3, ease.inOutQuad, { s: 1.06, x: 960, y: 540 }],
  [T_GUY, 0.16, ease.outExpo, { s: 1.5, x: 960, y: 470 }],
  [T_GUY + 0.16, 0.5, ease.linear, { s: 1.58, x: 950, y: 480 }],
  [T_LAPTOP, 0.14, ease.outExpo, { s: 1.75, x: 960, y: 600 }],
  [T_TEAM, 0.16, ease.outExpo, { s: 1.0, x: 960, y: 540 }],
  [T_FLICK, 0.18, ease.outCubic, { s: 1.3, x: 960, y: 400 }],
  [T_LAUNCH - 0.02, 0.22, ease.inOutCubic, { s: 1.0, x: 960, y: 540 }],
];
function camAt(t) {
  let v = { s: 1, x: 960, y: 540 };
  for (const [t0, d, fn, tg] of CAMK) { if (t < t0) break; const u = fn(clamp((t - t0) / d)); v = { s: lerp(v.s, tg.s, u), x: lerp(v.x, tg.x, u), y: lerp(v.y, tg.y, u) }; }
  return v;
}
const applyCam = (ctx, c) => { ctx.translate(W / 2, H / 2); ctx.scale(c.s, c.s); ctx.translate(-c.x, -c.y); };
function rocketPos(t) {
  const u = ease.outQuad(clamp((t - T_LAUNCH) / (T_IDEA - T_LAUNCH)));
  return [lerp(BULB[0], BURST[0], u) + Math.sin(u * 9) * 10 * (1 - u), lerp(BULB[1] - 20, BURST[1], u)];
}

// ---------- the guy, the desk, the bulb ----------
function guy(ctx, t, lt) {
  const bt = A.beat(t), nod = Math.exp(-bt.phase * 5) * 6;
  const cx = 960, hy = 448 + nod;
  // hoodie body
  ctx.fillStyle = C.blue;
  ctx.beginPath(); ctx.moveTo(cx - 170, 690); ctx.quadraticCurveTo(cx - 175, 520, cx - 95, 505); ctx.lineTo(cx + 95, 505); ctx.quadraticCurveTo(cx + 175, 520, cx + 170, 690); ctx.closePath(); ctx.fill();
  ctx.lineWidth = 7; ctx.strokeStyle = C.black; ctx.stroke();
  // hood (behind head)
  ctx.beginPath(); ctx.ellipse(cx, hy - 2, 86, 92, 0, 0, TAU); ctx.fillStyle = '#1C1CC8'; ctx.fill(); ctx.stroke();
  // head (faceless)
  ctx.beginPath(); ctx.ellipse(cx, hy + 6, 56, 62, 0, 0, TAU); ctx.fillStyle = '#F2C29B'; ctx.fill(); ctx.stroke();
  // screen glow on the face
  const glow = 0.25 + 0.2 * Math.sin(lt * 23) * Math.sin(lt * 7);
  ctx.fillStyle = `rgba(120,160,255,${glow})`; ctx.beginPath(); ctx.ellipse(cx, hy + 22, 50, 44, 0, 0, TAU); ctx.fill();
  // hood strings
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(cx - 26, 512); ctx.lineTo(cx - 32, 575); ctx.moveTo(cx + 26, 512); ctx.lineTo(cx + 30, 570); ctx.stroke();
  // typing arms → hands at the keyboard (alternating, faster on the beat)
  const k = Math.floor(lt * 14) % 2;
  ctx.strokeStyle = C.black; ctx.lineWidth = 7; ctx.fillStyle = C.blue;
  for (const sd of [-1, 1]) {
    const up = (sd < 0 ? k : 1 - k) * 12;
    ctx.beginPath(); ctx.moveTo(cx + sd * 150, 560); ctx.quadraticCurveTo(cx + sd * 190, 650, cx + sd * 120, 668 - up); ctx.lineTo(cx + sd * 92, 652 - up); ctx.quadraticCurveTo(cx + sd * 150, 640, cx + sd * 122, 560); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx + sd * 100, 664 - up, 17, 0, TAU); ctx.fillStyle = '#F2C29B'; ctx.fill(); ctx.stroke(); ctx.fillStyle = C.blue;
  }
}
function desk(ctx, t, lt) {
  // desk
  ctx.fillStyle = C.black; ctx.fillRect(560, 680, 800, 26); ctx.fillRect(600, 706, 22, 160); ctx.fillRect(1298, 706, 22, 160);
  // laptop lid (back side facing us) with sticker
  const lap = kick(t, T_LAPTOP, 0.12);
  ctx.save(); ctx.translate(960, 690); ctx.scale(1 + lap * 0.08, 1 + lap * 0.08);
  ctx.fillStyle = '#B9B9C4'; roundRect(ctx, -175, -205, 350, 205, 14); ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = C.black; ctx.stroke();
  ctx.fillStyle = '#D6D6DE'; roundRect(ctx, -160, -192, 150, 60, 10); ctx.fill();
  ctx.fillStyle = C.orange; roundRect(ctx, -40, -140, 80, 80, 14); ctx.fill(); ctx.lineWidth = 5; ctx.stroke();
  ctx.fillStyle = C.navy; font(ctx, 38, 'JetBrains Mono', '800'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('>_', 0, -98);
  ctx.fillStyle = '#7E7E8C'; ctx.fillRect(-190, -6, 380, 14);
  ctx.restore();
  // screen light spill above lid
  ctx.fillStyle = `rgba(150,180,255,${0.18 + 0.1 * Math.sin(lt * 31)})`; ctx.beginPath(); ctx.moveTo(800, 485); ctx.lineTo(1120, 485); ctx.lineTo(1180, 380); ctx.lineTo(740, 380); ctx.closePath(); ctx.fill();
  // coffee mug + steam
  ctx.fillStyle = C.red; roundRect(ctx, 1210, 620, 64, 62, 8); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = C.black; ctx.stroke();
  ctx.beginPath(); ctx.arc(1282, 650, 18, -1.2, 1.2); ctx.stroke();
  ctx.strokeStyle = 'rgba(14,14,18,0.35)'; ctx.lineWidth = 5;
  for (let i = 0; i < 3; i++) { ctx.beginPath(); for (let y = 0; y < 70; y += 5) { const x = 1226 + i * 16 + Math.sin(y * 0.12 - lt * 8 + i) * 6; y ? ctx.lineTo(x, 610 - y) : ctx.moveTo(x, 610 - y); } ctx.stroke(); }
}
function bulb(ctx, t, x, y, on, sc = 1, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc, sc);
  if (on > 0) {
    // glow + rays
    const g = ctx.createRadialGradient(0, -10, 10, 0, -10, 260);
    g.addColorStop(0, `rgba(255,240,170,${0.9 * on})`); g.addColorStop(0.35, `rgba(255,210,80,${0.35 * on})`); g.addColorStop(1, 'rgba(255,210,80,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, -10, 260, 0, TAU); ctx.fill();
    ctx.strokeStyle = `rgba(14,14,18,${on})`; ctx.lineWidth = 9; ctx.lineCap = 'round';
    for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (i - 4) * 0.36, r0 = 100 + Math.sin(t * 40 + i) * 6; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r0, -10 + Math.sin(a) * r0); ctx.lineTo(Math.cos(a) * (r0 + 46), -10 + Math.sin(a) * (r0 + 46)); ctx.stroke(); }
  }
  // glass
  ctx.beginPath(); ctx.arc(0, -20, 62, Math.PI * 0.78, Math.PI * 0.22); ctx.lineTo(24, 40); ctx.lineTo(-24, 40); ctx.closePath();
  ctx.fillStyle = on > 0.5 ? '#FFF3B8' : '#F4F4FA'; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = C.black; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.ellipse(-26, -42, 10, 18, 0.5, 0, TAU); ctx.fill();
  // filament
  ctx.strokeStyle = on > 0.5 ? C.orange : '#555'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-12, 36); ctx.lineTo(-10, -6); for (let i = 0; i <= 6; i++) ctx.lineTo(-10 + i * 3.4, -6 - (i % 2) * 10); ctx.lineTo(12, 36); ctx.stroke();
  // screw base
  ctx.fillStyle = C.grey; ctx.fillRect(-26, 40, 52, 34); ctx.strokeStyle = C.black; ctx.lineWidth = 6; ctx.strokeRect(-26, 40, 52, 34);
  ctx.beginPath(); for (let i = 0; i < 3; i++) { ctx.moveTo(-26, 48 + i * 9); ctx.lineTo(26, 52 + i * 9); } ctx.stroke();
  ctx.fillStyle = C.black; ctx.beginPath(); ctx.arc(0, 80, 10, 0, Math.PI); ctx.fill();
  ctx.restore();
}

function sticker(ctx, str, x, y, rot, a, fill, ink = C.black, sub) {
  if (a <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(a, a);
  font(ctx, 92, 'Anton'); const tw = ctx.measureText(str).width + 60, bh = 128;
  ctx.fillStyle = C.black; ctx.fillRect(-tw / 2 + 12, -bh / 2 + 12, tw, bh);
  ctx.fillStyle = fill; ctx.fillRect(-tw / 2, -bh / 2, tw, bh); ctx.lineWidth = 7; ctx.strokeStyle = C.black; ctx.strokeRect(-tw / 2, -bh / 2, tw, bh);
  ctx.fillStyle = ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(str, 0, 6);
  if (sub) { font(ctx, 22, 'JetBrains Mono', '800'); ctx.fillStyle = C.black; ctx.fillText(sub, 0, -bh / 2 - 20); }
  ctx.restore();
}

function drawSparks(ctx, t, camY, glow) {
  const { stars, trail } = fireworks();
  const tmp = [0, 0], tmp2 = [0, 0];
  const groups = [[], [], [], []];
  const frame = Math.round(t * 30);
  for (let i = 0; i < stars.length; i++) {
    const s = stars[i], tt = t - s.t0;
    if (tt < 0 || tt > s.life) continue;
    let a = 1 - Math.pow(tt / s.life, 3);
    if (s.fl && tt > s.life * 0.45 && hash(i, frame) < 0.45) a *= 0.15; // glitter flicker
    ballistic(s.p0, s.v0, tt, tmp); ballistic(s.p0, s.v0, Math.max(0, tt - 0.055), tmp2);
    groups[s.col].push(tmp2[0], tmp2[1] + camY, tmp[0], tmp[1] + camY, a, s.w);
  }
  ctx.lineCap = 'round';
  for (let c = 0; c < 4; c++) {
    const g = groups[c]; if (!g.length) continue;
    ctx.strokeStyle = SPARK[c]; ctx.fillStyle = SPARK[c];
    // trails
    for (let k = 0; k < g.length; k += 6) {
      ctx.globalAlpha = g[k + 4] * (glow ? 0.7 : 1); ctx.lineWidth = g[k + 5] * (glow ? 2.2 : 1);
      ctx.beginPath(); ctx.moveTo(g[k], g[k + 1]); ctx.lineTo(g[k + 2], g[k + 3]); ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
  // rocket trail sparks
  if (t > T_LAUNCH && t < T_IDEA + 0.5) {
    ctx.fillStyle = SPARK[0];
    for (const s of trail) {
      const tt = t - s.te; if (tt < 0 || tt > s.life) continue;
      const p = rocketPos(s.te);
      const x = p[0] + s.v[0] * tt, y = p[1] + s.v[1] * tt + 900 * tt * tt + camY;
      ctx.globalAlpha = 1 - tt / s.life; ctx.fillRect(x - 3, y - 3, glow ? 10 : 6, glow ? 10 : 6);
    }
    ctx.globalAlpha = 1;
  }
}

export default {
  ...S,
  cutIn: 'punch',
  sfx: [{ t: 62.92, type: 'pop', gain: 0.6 }, { t: 63.6, type: 'pop', gain: 0.6 }, { t: 63.82, type: 'stamp', gain: 0.7 }, { t: 64.04, type: 'zap', gain: 0.6 }, { t: 64.26, type: 'riser', gain: 0.7 }, { t: 64.44, type: 'firework', gain: 1 }],
  init() { fireworks(); },
  draw(ctx, t, s, E) {
    const lt = s.lt;
    const tilt = ease.inOutCubic(clamp((t - T_LAUNCH + 0.04) / 0.3));
    const camY = tilt * CAM_UP;
    const burstK = kick(t, T_IDEA, 0.1);
    const cam = camAt(t); cam.s *= 1 + 0.04 * kick(t, T_CRAZY, 0.15) + 0.03 * A.pulse('down', t, 0.15);

    // ---- desktop background (world) ----
    ctx.save();
    applyCam(ctx, cam);
    ctx.fillStyle = C.blue; ctx.fillRect(-60, -60, W + 120, H + 120);
    // sky gradient above the desktop as we tilt up
    const sg = ctx.createLinearGradient(0, -CAM_UP + camY, 0, 300 + camY); sg.addColorStop(0, '#1010B0'); sg.addColorStop(1, 'rgba(43,43,255,0)');
    ctx.fillStyle = sg; ctx.fillRect(-60, -60, W + 120, H + 120);
    grid(ctx, 80, 'rgba(255,255,255,0.15)', 2, 0, camY + lt * 20, -60, -60, W + 120, H + 120);
    // desktop icons (left column)
    ctx.save(); ctx.translate(0, camY);
    ['MY IDEA.txt', 'laptop.exe', 'team/'].forEach((n, i) => {
      const y = 230 + i * 160; ctx.fillStyle = i === 2 ? '#FFD23F' : '#fff'; ctx.fillRect(120, y, 64, 64); ctx.strokeStyle = C.black; ctx.lineWidth = 4; ctx.strokeRect(120, y, 64, 64);
      if (i === 2) { ctx.fillStyle = C.black; font(ctx, 18, 'JetBrains Mono', '800'); ctx.textAlign = 'center'; ctx.fillText('0', 152, y + 40); }
      font(ctx, 20, 'JetBrains Mono', '700'); ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillStyle = '#fff'; ctx.fillText(n, 152, y + 74);
    });
    ctx.restore();

    // ---- the Win95 window with the room ----
    ctx.save(); ctx.translate(0, camY);
    const wi = ease.outBack(clamp(lt / 0.22));
    ctx.translate(W / 2, 520); ctx.scale(0.92 + 0.08 * wi, 0.92 + 0.08 * wi); ctx.translate(-W / 2, -520);
    const WX = 330, WY = 150, WW = 1260, WH = 740;
    const cl = win95(ctx, WX, WY, WW, WH, 'ONE_GUY.EXE — 1 guy · 1 laptop · 0 team', { tb: 50, font: 26 });
    ctx.save(); ctx.beginPath(); ctx.rect(cl.x, cl.y, cl.w, cl.h); ctx.clip();
    // room: wall + floor
    ctx.fillStyle = '#F2F2F6'; ctx.fillRect(cl.x, cl.y, cl.w, cl.h);
    ctx.fillStyle = 'rgba(43,43,255,0.07)'; for (let x = cl.x; x < cl.x + cl.w; x += 60) ctx.fillRect(x, cl.y, 30, cl.h);
    ctx.fillStyle = C.grey; ctx.fillRect(cl.x, 770, cl.w, cl.h);
    ctx.fillStyle = C.black; ctx.fillRect(cl.x, 766, cl.w, 6);
    // little window on the wall + poster + clock
    ctx.fillStyle = '#6EC3F0'; ctx.fillRect(430, 260, 210, 170); ctx.strokeStyle = C.black; ctx.lineWidth = 8; ctx.strokeRect(430, 260, 210, 170); ctx.beginPath(); ctx.moveTo(535, 260); ctx.lineTo(535, 430); ctx.moveTo(430, 345); ctx.lineTo(640, 345); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(470 + ((lt * 30) % 120), 300, 18, 0, TAU); ctx.arc(495 + ((lt * 30) % 120), 296, 22, 0, TAU); ctx.fill();
    ctx.save(); ctx.translate(1350, 340); ctx.rotate(0.05); ctx.fillStyle = C.red; ctx.fillRect(-90, -110, 180, 220); ctx.strokeStyle = C.black; ctx.lineWidth = 6; ctx.strokeRect(-90, -110, 180, 220);
    ctx.fillStyle = '#fff'; font(ctx, 64, 'Anton'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('SHIP', 0, -40); ctx.fillText('IT.', 0, 40); ctx.restore();
    ctx.save(); ctx.translate(1180, 280); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, 44, 0, TAU); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = C.black; ctx.stroke();
    const ang = t * 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(ang) * 30, Math.sin(ang) * 30); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(ang / 12) * 20, Math.sin(ang / 12) * 20); ctx.stroke(); ctx.restore();
    guy(ctx, t, lt);
    desk(ctx, t, lt);
    // code glyphs bubbling up out of the laptop (ideas forming)
    { const r = rng(31), G2 = ['{', '}', ';', '=>', '</>', '()', '#', '$', '*', '[]'];
      font(ctx, 30, 'JetBrains Mono', '800'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (let i = 0; i < 22; i++) { const per = r.range(0.7, 1.2), ph = r(), u = ((lt / per + ph) % 1), x = 960 + r.range(-150, 150) + Math.sin(u * 6 + i) * 20, y = 480 - u * 260;
        ctx.globalAlpha = Math.sin(u * Math.PI) * 0.85; ctx.fillStyle = i % 3 ? C.blue : C.red; ctx.fillText(G2[i % G2.length], x, y); }
      ctx.globalAlpha = 1; }
    // the bulb over his head: idle dim → flicker → ON → launches
    let on = 0;
    if (t > T_FLICK && t < T_CRAZY) on = hash(Math.floor(t * 34), 7) > 0.45 ? 1 : 0.15;
    if (t >= T_CRAZY) on = 1;
    const appear = ease.outBack(clamp((t - 63.9) / 0.18));
    if (t < T_LAUNCH && appear > 0) {
      const shakeB = t > T_FLICK ? Math.sin(t * 90) * 4 : 0;
      bulb(ctx, t, BULB[0] + shakeB, BULB[1] + Math.sin(lt * 5) * 4, on, 0.9 * appear * (1 + 0.15 * kick(t, T_CRAZY, 0.1)));
    }
    ctx.restore(); // clip
    // hole punched through the title bar by the rocket
    if (t > T_LAUNCH + 0.07) {
      const r = rng(5); ctx.fillStyle = C.blue; ctx.beginPath();
      for (let i = 0; i < 14; i++) { const a = (i / 14) * TAU, rr = 70 + r() * 40; ctx.lineTo(960 + Math.cos(a) * rr, WY + 20 + Math.sin(a) * rr * 0.7); }
      ctx.closePath(); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = C.black; ctx.stroke();
      // flying shards
      const tt = t - T_LAUNCH - 0.07;
      for (let i = 0; i < 18; i++) { const a = -Math.PI / 2 + r.range(-1.3, 1.3), sp = r.range(400, 1100); const x = 960 + Math.cos(a) * sp * tt, y = WY + Math.sin(a) * sp * tt + 2200 * tt * tt;
        ctx.save(); ctx.translate(x, y); ctx.rotate(tt * r.range(-20, 20)); ctx.fillStyle = i % 3 ? C.grey : C.blue; ctx.fillRect(-14, -9, 28, 18); ctx.strokeStyle = C.black; ctx.lineWidth = 3; ctx.strokeRect(-14, -9, 28, 18); ctx.restore(); }
    }
    ctx.restore(); // window
    ctx.restore(); // push

    // ---- name-tag stickers (screen space, scroll away with the tilt) ----
    ctx.save(); ctx.translate(0, camY * 1.2);
    sticker(ctx, '1 GUY', 600, 830, -0.05, hit(t, T_GUY, 0.18), C.white);
    sticker(ctx, '1 LAPTOP', 960, 852, 0.03, hit(t, T_LAPTOP, 0.18), C.white);
    sticker(ctx, '0 TEAM', 1340, 828, -0.04, hit(t, T_TEAM, 0.18), C.red, C.white);
    if (t > T_GUY && t < T_GUY + 0.18) speedLines(ctx, 600, 830, 30, 140, 700, 3, 'rgba(255,255,255,0.7)', 0.04);
    ctx.restore();

    // ---- the rocket & the firework ----
    if (t >= T_LAUNCH && t < T_IDEA) {
      const p = rocketPos(t);
      ctx.save(); applyCam(ctx, cam);
      bulb(ctx, t, p[0], p[1] + camY, 1, 0.75, Math.sin(t * 60) * 0.15);
      ctx.restore();
    }
    if (t >= T_LAUNCH) {
      ctx.save(); applyCam(ctx, cam);
      // burst flash disc
      if (t > T_IDEA && t < T_IDEA + 0.2) {
        const u = (t - T_IDEA) / 0.2; const g = ctx.createRadialGradient(BURST[0], BURST[1] + camY, 0, BURST[0], BURST[1] + camY, 500 * (0.4 + u));
        g.addColorStop(0, `rgba(255,255,230,${0.8 * (1 - u)})`); g.addColorStop(1, 'rgba(255,255,230,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      }
      // glow pass: sparks into a small buffer, blurred, added
      const gb = buf('W05-glow', 480, 270), gx = bctx(gb);
      gx.setTransform(1, 0, 0, 1, 0, 0); gx.clearRect(0, 0, 480, 270); gx.setTransform(0.25, 0, 0, 0.25, 0, 0);
      drawSparks(gx, t, camY, true);
      const gb2 = buf('W05-glow2', 480, 270), gx2 = bctx(gb2); gx2.clearRect(0, 0, 480, 270); gx2.filter = 'blur(5px)'; gx2.drawImage(gb, 0, 0); gx2.filter = 'none';
      ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 0.75; ctx.drawImage(gb2, 0, 0, W, H); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      drawSparks(ctx, t, camY, false);
      ctx.restore();
    }

    E.fx.shake = 20 * burstK + 6 * kick(t, T_CRAZY, 0.08) + 5 * kick(t, T_TEAM, 0.08) + 3 * A.pulse('beat', t, 0.1);
    E.fx.zoom += 0.04 * burstK;
    E.fx.rgb = 8 * burstK;
    E.fx.bloom = t > T_IDEA ? 0.3 : 0.12; E.fx.bloomThreshold = 0.8;
    if (t > T_FLICK && t < T_CRAZY && hash(Math.floor(t * 34), 7) > 0.45) E.fx.flash = [1, 0.95, 0.7, 0.12];
    E.fx.vignette = 0.2;
  },
};
