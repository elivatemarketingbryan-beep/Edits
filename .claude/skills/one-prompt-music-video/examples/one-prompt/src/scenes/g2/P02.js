// P02 · "but I'm feeling free" — CURSOR floats up on a bunch of balloons while a REAL boids flock
// (separation / alignment / cohesion on a spatial hash, fixed 60 Hz steps from the shot start) swirls around it.
// From "feeling" each bird is assigned a target on the word (sorted by x so paths don't cross) and an arrival
// spring takes over: on "free" (32.98) the flock locks into FREE. Halftone cloud dots ripple on every beat.
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, hash, noise2, rng, sim, textPoints, font } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { drawMascot } from '../../core/mascot.js';
import { PS, SKY, cloud, shadowText } from './_g2.js';

const S = shot('P02');
const T_FORM = 32.4, T_FREE = 32.98;
const WCX = 840, WCY = 340;                          // word centre
let TGT = null, NB = 0;

const curPos = (t) => { // CURSOR's float path (ground point)
  const k = ease.outCubic(clamp((t - 31.56) / 1.5));
  return [lerp(1300, 1640, k) + Math.sin(t * 2.1) * 26, lerp(1320, 915, k) + Math.sin(t * 3.0) * 10];
};

function buildTargets() {
  const pts = textPoints('FREE', { size: 330, family: 'Rubik Mono One', step: 19, maxW: 1300 });
  const r = rng(11), arr = pts.map((p) => ({ x: WCX + p.x + (r() - 0.5) * 7 + ((Math.round(p.y / 19) % 2) ? 9.5 : 0), y: WCY + p.y + (r() - 0.5) * 6 }));
  const maxN = 560;
  if (arr.length > maxN) { const out = []; for (let i = 0; i < maxN; i++) out.push(arr[Math.floor(i * arr.length / maxN)]); TGT = out; } else TGT = arr;
  NB = TGT.length;
}

function initState() {
  const r = rng(7), B = [];
  for (let i = 0; i < NB; i++) {
    // start as a dense murmuration ball swirling on the left
    const a = r() * TAU, rr = Math.sqrt(r());
    const x = 640 + Math.cos(a) * rr * 420, y = 470 + Math.sin(a) * rr * 200;
    B.push({ x, y, vx: -Math.sin(a) * 7 + (r() - 0.5) * 2, vy: Math.cos(a) * 3.5 + (r() - 0.5) * 2, tx: 0, ty: 0, ph: r() * TAU });
  }
  return { B, assigned: false };
}
function step(st, k) {
  const t = 31.56 + k / 60;
  const B = st.B, n = B.length;
  const m = ease.inOutCubic(clamp((t - T_FORM) / (T_FREE - T_FORM)));
  if (m > 0 && !st.assigned) {
    const order = B.map((b, i) => i).sort((a, b) => B[a].x - B[b].x || B[a].y - B[b].y);
    const tord = TGT.map((p, i) => i).sort((a, b) => TGT[a].x - TGT[b].x || TGT[a].y - TGT[b].y);
    order.forEach((bi, j) => { B[bi].tx = TGT[tord[j]].x; B[bi].ty = TGT[tord[j]].y; });
    st.assigned = true;
  }
  // spatial hash
  const CS = 60, grid = new Map();
  for (let i = 0; i < n; i++) { const key = ((B[i].x / CS) | 0) * 1000 + ((B[i].y / CS) | 0); let a = grid.get(key); if (!a) grid.set(key, (a = [])); a.push(i); }
  const [cx, cy] = curPos(t); const ocx = cx, ocy = cy - 330;
  for (let i = 0; i < n; i++) {
    const b = B[i];
    let sx = 0, sy = 0, ax = 0, ay = 0, chx = 0, chy = 0, cnt = 0;
    const gx = (b.x / CS) | 0, gy = (b.y / CS) | 0;
    for (let ix = gx - 1; ix <= gx + 1; ix++) for (let iy = gy - 1; iy <= gy + 1; iy++) {
      const a = grid.get(ix * 1000 + iy); if (!a) continue;
      for (const j of a) {
        if (j === i) continue; const o = B[j], dx = o.x - b.x, dy = o.y - b.y, d2 = dx * dx + dy * dy;
        if (d2 > 3600) continue;
        cnt++; ax += o.vx; ay += o.vy; chx += o.x; chy += o.y;
        if (d2 < 22 * 22) { const d = Math.sqrt(d2) + 0.01; sx -= dx / d * (22 - d); sy -= dy / d * (22 - d); }
      }
    }
    let fx = 0, fy = 0;
    const free = 1 - m;
    if (cnt) { fx += ((ax / cnt) - b.vx) * 0.05 + ((chx / cnt) - b.x) * 0.0035; fy += ((ay / cnt) - b.vy) * 0.05 + ((chy / cnt) - b.y) * 0.0035; }
    fx += sx * 0.05; fy += sy * 0.05;
    // swirl around CURSOR's balloons (tangential + radial pull to an orbit)
    const rx = b.x - ocx, ry = (b.y - ocy) * 1.4, rr = Math.hypot(rx, ry) + 1;
    const orbit = 380 + 120 * Math.sin(i * 0.37);
    fx += (-ry / rr) * 0.22 + (-rx / rr) * (rr - orbit) * 0.0016;
    fy += (rx / rr) * 0.22 * 0.7 + (-ry / rr) * (rr - orbit) * 0.0016;
    // soft bounds
    if (b.x < 80) fx += 0.4; if (b.x > W - 80) fx -= 0.4; if (b.y < 140) fy += 0.4; if (b.y > H - 160) fy -= 0.4;
    b.vx += fx * free; b.vy += fy * free;
    // arrival spring toward the letters
    if (m > 0) { const kk = 0.05 * m, dd = 0.32 * m; b.vx += (b.tx - b.x) * kk - b.vx * dd; b.vy += (b.ty - b.y) * kk - b.vy * dd; }
    const sp = Math.hypot(b.vx, b.vy), mx = lerp(10, 40, m), mn = 4.5 * free;
    if (sp > mx) { b.vx *= mx / sp; b.vy *= mx / sp; } else if (sp < mn && sp > 0) { b.vx *= mn / sp; b.vy *= mn / sp; }
    b.x += b.vx; b.y += b.vy;
    if (t >= T_FREE) {
      const pul = 1 + 0.07 * Math.exp(-(t - T_FREE) / 0.12) * Math.cos((t - T_FREE) * 40) + 0.025 * Math.exp(-A.since('beat', t) / 0.1);
      const gx2 = WCX + (b.tx - WCX) * pul, gy2 = WCY + (b.ty - WCY) * pul;
      b.x = lerp(b.x, gx2, 0.35); b.y = lerp(b.y, gy2, 0.35); b.vx *= 0.6; b.vy *= 0.6;
    }
    if (Math.abs(b.vx) + Math.abs(b.vy) > 0.6) b.hd = Math.atan2(b.vy, b.vx);
  }
}

function balloons(ctx, t, hx, hy) {
  const cols = [SKY.sun, PS.red, '#FFFFFF', PS.orange, '#FF7AA8', '#2FA39A', '#5B8CFF'];
  const B = [];
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI / 2 + (i - 3) * 0.24, L = 240 + (i % 3) * 50;
    const bx = hx + Math.cos(a) * L * 0.9 + noise2(t * 0.9, i) * 22, by = hy + Math.sin(a) * L + noise2(t * 0.8, i + 9) * 16;
    B.push([bx, by, cols[i], i]);
  }
  B.sort((a, b) => a[1] - b[1]);
  ctx.lineWidth = 3; ctx.strokeStyle = PS.ink;
  for (const [bx, by] of B) { ctx.beginPath(); ctx.moveTo(hx, hy); ctx.quadraticCurveTo(lerp(hx, bx, 0.5) + 20, lerp(hy, by, 0.5), bx, by + 66); ctx.stroke(); }
  for (const [bx, by, c, i] of B) {
    ctx.save(); ctx.translate(bx, by); ctx.rotate(noise2(t, i * 3) * 0.12);
    ctx.fillStyle = 'rgba(31,42,85,0.18)'; ctx.beginPath(); ctx.ellipse(8, 8, 52, 64, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(0, 0, 52, 64, 0, 0, TAU); ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = PS.ink; ctx.stroke();
    ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(-9, 70); ctx.lineTo(9, 70); ctx.lineTo(0, 60); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.ellipse(-20, -26, 11, 18, -0.5, 0, TAU); ctx.fill();
    ctx.restore();
  }
}

export default {
  ...S,
  cutIn: 'none',
  sfx: [{ t: 31.6, type: 'whoosh', gain: 0.6 }, { t: T_FREE, type: 'firework', gain: 0.9 }],
  async init() { buildTargets(); },
  draw(ctx, t, s, E) {
    if (!TGT) buildTargets();
    const lt = s.lt;
    const st = sim('P02-boids', Math.floor(lt * 60), initState, step);
    const free = t >= T_FREE ? t - T_FREE : -1, fk = free >= 0 ? Math.exp(-free / 0.2) : 0;
    const beat = Math.exp(-A.since('beat', t) / 0.12);
    // ---- sky ----
    const sg = ctx.createLinearGradient(0, 0, 0, H); sg.addColorStop(0, '#2E8BE0'); sg.addColorStop(0.55, SKY.sky); sg.addColorStop(1, '#BDE6FB');
    ctx.fillStyle = sg; ctx.fillRect(0, 0, W, H);
    // sun glow
    const sgx = 1650, sgy = 170;
    const glow = ctx.createRadialGradient(sgx, sgy, 40, sgx, sgy, 700); glow.addColorStop(0, 'rgba(255,240,170,0.75)'); glow.addColorStop(1, 'rgba(255,240,170,0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = SKY.sun; ctx.beginPath(); ctx.arc(sgx, sgy, 95, 0, TAU); ctx.fill();
    // ---- halftone clouds (scroll down: we are rising), ripple on beats ----
    const rise = lt * 260;
    const [cx0, cy0] = curPos(t);
    const lastBeat = A.since('beat', t), rr = lastBeat * 1500;
    const STEP = 24;
    ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath();
    for (let y = -STEP; y < H + STEP; y += STEP) {
      const row = Math.round(y / STEP);
      for (let x = (row % 2) * STEP / 2 - STEP; x < W + STEP; x += STEP) {
        const wy = y - rise;
        let d = noise2(x * 0.0016, wy * 0.0028) * 0.9 + noise2(x * 0.004 + 7, wy * 0.006) * 0.35 - 0.3 + (y / H) * 0.45;
        if (d <= 0.02) continue;
        const dr = Math.hypot(x - cx0, y - cy0 + 300), ring = Math.exp(-Math.pow((dr - rr) / 70, 2)) * Math.exp(-lastBeat * 2);
        const r = Math.min(STEP * 0.62, d * STEP * 0.6 * (1 + ring * 0.9 + fk * 0.6));
        if (r < 0.8) continue;
        ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, TAU);
      }
    }
    ctx.fill();
    // a couple of solid paper clouds drifting down for depth
    for (let i = 0; i < 3; i++) { const y = ((i * 520 + lt * 520) % 1700) - 300, x = [260, 1700, 900][i]; cloud(ctx, x, y, 120 + i * 30, { seed: i + 40, outline: PS.ink, lw: 6, shade: '#D8EEFA', shadow: null }); }
    // P01's wipe cloud leaving the frame
    if (lt < 0.25) cloud(ctx, lerp(-200, -1400, ease.outCubic(lt / 0.25)), 1000, 360, { seed: 77, outline: PS.ink, lw: 8, shade: '#DCEFFA', shadow: null });

    // ---- the flock ----
    const B = st.B, locked = free >= 0;
    const drawBirds = (pass) => {
      if (locked) {
        ctx.strokeStyle = PS.ink; ctx.lineWidth = 3.6; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath();
        for (let i = 0; i < B.length; i++) {
          if ((i % 3 === 0) !== (pass === 0)) continue;
          const b = B[i], f = Math.sin(t * 13 + b.ph) * 2.5, w = 6 + (i % 4) * 0.8;
          ctx.moveTo(b.x - w, b.y - 2 + f); ctx.quadraticCurveTo(b.x - w * 0.45, b.y - 7 - f * 0.5, b.x, b.y + 1);
          ctx.quadraticCurveTo(b.x + w * 0.45, b.y - 7 - f * 0.5, b.x + w, b.y - 2 + f);
        }
        ctx.stroke(); return;
      }
      ctx.fillStyle = PS.ink; ctx.beginPath();
      for (let i = 0; i < B.length; i++) {
        if ((i % 3 === 0) !== (pass === 0)) continue;
        const b = B[i], hd = b.hd ?? 0, flap = Math.sin(t * 22 + b.ph), sz = 14;
        const c = Math.cos(hd), sN = Math.sin(hd), wx = -sz * 0.6, wy = sz * (0.7 + flap * 0.55);
        const pts = [[sz * 0.8, 0], [wx, wy], [-sz * 0.15, 0], [wx, -wy]];
        for (let q = 0; q < 4; q++) { const [px, py] = pts[q]; const X = b.x + px * c - py * sN, Y = b.y + px * sN + py * c; if (q === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y); }
        ctx.closePath();
      }
      ctx.fill();
    };
    // ---- CURSOR + balloons ----
    const [cx, cy] = curPos(t);
    const P = { armL: [-150, 60 + Math.sin(t * 3) * 14], armR: [96, -205], legL: [-38 + Math.sin(t * 4) * 10, 196], legR: [44 - Math.sin(t * 4) * 10, 200], squash: -0.04, rot: Math.sin(t * 2.1) * 0.06, bob: 0, look: [-0.5, -0.8], lean: 0 };
    const sc = 0.78;
    // hand position (approx.) in world for the strings
    const hx = cx + 96 * sc, hy = cy - 185 * sc - 205 * sc;
    if (locked) { // soft white glow of the word behind the birds
      ctx.save(); ctx.globalAlpha = clamp(free / 0.15) * 0.55; ctx.shadowColor = '#FFFFFF'; ctx.shadowBlur = 50;
      font(ctx, 330, 'Rubik Mono One'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = 'rgba(255,255,255,0.9)';
      const m0 = ctx.measureText('FREE').width, scW = Math.min(1, 1300 / m0); ctx.translate(WCX, WCY); ctx.scale(scW, scW); ctx.fillText('FREE', 0, 0);
      ctx.restore();
    }
    drawBirds(0);
    balloons(ctx, t, hx, hy);
    drawMascot(ctx, { x: cx, y: cy, s: sc, t, P, eyes: free >= 0 ? 'star' : 'happy', mouth: 'auto', sticker: true });
    drawBirds(1);

    // ---- type ----
    if (t < T_FREE) {
      const k1 = ease.outBack(clamp((t - 31.56) / 0.22), 2), k2 = ease.outBack(clamp((t - 32.44) / 0.22), 2);
      if (k1 > 0) { ctx.save(); ctx.translate(330, 760); ctx.rotate(-0.05); ctx.scale(k1, k1); shadowText(ctx, "but I'm", 0, 0, { size: 96, family: 'Caveat', weight: '700', fill: '#FFFFFF', shadow: PS.ink, off: 5 }); ctx.restore(); }
      if (k2 > 0) { ctx.save(); ctx.translate(390, 860); ctx.rotate(-0.05); ctx.scale(k2, k2); shadowText(ctx, 'feeling…', 0, 0, { size: 110, family: 'Caveat', weight: '700', fill: SKY.sun, shadow: PS.ink, off: 6 }); ctx.restore(); }
    } else {
      // tiny label under the bird-word
      font(ctx, 24, 'JetBrains Mono', '800'); ctx.fillStyle = 'rgba(31,42,85,0.75)'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.globalAlpha = clamp(free / 0.2); ctx.fillText(`${B.length} BOIDS · SEPARATION · ALIGNMENT · COHESION`, WCX, 575); ctx.globalAlpha = 1;
      // shockwave ring from the word
      if (free < 0.3) { const k = ease.outCubic(free / 0.3); ctx.strokeStyle = `rgba(255,255,255,${1 - k})`; ctx.lineWidth = 40 * (1 - k); ctx.beginPath(); ctx.ellipse(WCX, WCY, 300 + k * 900, 120 + k * 500, 0, 0, TAU); ctx.stroke(); }
    }

    // ---- fx ----
    if (free >= 0 && free < 0.2) { E.fx.flash = [1, 1, 1, 0.45 * (1 - free / 0.2)]; E.fx.shake = 12 * (1 - free / 0.2); E.fx.zoom += 0.04 * (1 - free / 0.2); }
    E.fx.zoom += beat * 0.008;
  },
};
