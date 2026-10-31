// F05 — "On autopilot, let it fly" · CONTINUOUS WORLD TOUR
// One unbroken flight through all eight worlds of the video: night city → paper studio → sky → sunburst pop →
// internet windows → gold rush → voxel neon → sunset. Every world is an endless 3-layer parallax stack (far / mid /
// near, scrolling at 0.25 / 0.6 / 1.5× the flight speed); the next world is composited over the current one through
// a feathered, tilted travelling mask that sweeps in from the right and crosses CURSOR exactly on a beat or
// half-beat — so worlds dissolve into each other mid-flight with no cut. CURSOR (aviator goggles + scarf) tows a
// sliced-cloth banner: ON AUTOPILOT → LET IT FLY!, barrel-rolls on the downbeat.
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, seg, hash, noise2, buf, bctx, rays, roundRect, star } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { drawMascot, pose } from '../../core/mascot.js';
import { bigType } from './common.js';

const S = shot('F05');
// seam crossing times — world k is under CURSOR from T[k] to T[k+1]
const T = [S.start - 1, 135.67, 135.98, 136.28, 136.88, 137.19, 137.49, 138.09, S.end + 9];
const CX = 1130;          // CURSOR screen x
const VS = 3600;          // seam sweep speed px/s
const FEATHER = 460;
const PF = 0.25, PM = 0.6, PN = 1.5; // parallax
const SKY = [
  ['#05070f', '#24305e'], ['#FFF8EC', '#F1E4CC'], ['#2E8BE0', '#9ad8ff'], ['#FF3E8A', '#FF7A1A'],
  ['#F7F7FF', '#D9DBFF'], ['#FFC300', '#E0A100'], ['#120c33', '#7b5bd6'], ['#C9B6FF', '#FF8FB1'],
];
const camAt = (t) => 2500 * (t - S.start) + T.slice(1, 8).reduce((s, tk) => s + 140 * ease.outExpo(seg(t, tk - 0.05, tk + 0.35)), 0);

// iterate repeating elements of spacing sp across the screen for a layer scrolled by ox
function each(ox, sp, fn, pad = 400) {
  const n0 = Math.floor((ox - pad) / sp), n1 = Math.floor((ox + W + pad) / sp);
  for (let n = n0; n <= n1; n++) fn(n * sp - ox, n);
}
function cloud(x, cx, cy, s, col, sh) {
  for (const [c, dy] of [[sh, 22], [col, 0]]) {
    x.fillStyle = c; x.beginPath();
    for (let i = 0; i < 5; i++) { const a = (i - 2) * 0.55; x.ellipse(cx + Math.sin(a) * 120 * s, cy + dy * s - Math.cos(a) * 30 * s, (70 + 20 * (i % 2)) * s, 60 * s, 0, 0, TAU); }
    x.fill();
  }
}
function win95(x, wx, wy, ww, wh, title, n) {
  x.fillStyle = '#0E0E12'; x.fillRect(wx + 10, wy + 10, ww, wh);
  x.fillStyle = '#C3C3C3'; x.fillRect(wx, wy, ww, wh);
  x.fillStyle = '#2B2BFF'; x.fillRect(wx + 6, wy + 6, ww - 12, 34);
  x.fillStyle = '#FFFFFF'; x.font = '16px "Press Start 2P"'; x.textAlign = 'left'; x.textBaseline = 'middle'; x.fillText(title, wx + 16, wy + 24);
  x.fillStyle = '#FF2A2A'; x.fillRect(wx + ww - 36, wy + 10, 26, 26);
  x.fillStyle = '#FFFFFF'; x.fillRect(wx + 12, wy + 48, ww - 24, wh - 60);
  x.fillStyle = '#2B2BFF'; for (let r = 0; r < (wh - 80) / 26; r++) x.fillRect(wx + 26, wy + 64 + r * 26, (ww - 70) * (0.4 + 0.6 * hash(n, r)), 10);
}
function pointer(x, px, py, s) {
  x.save(); x.translate(px, py); x.scale(s, s); x.fillStyle = '#FFFFFF'; x.strokeStyle = '#0E0E12'; x.lineWidth = 3;
  x.beginPath(); x.moveTo(0, 0); x.lineTo(0, 44); x.lineTo(12, 33); x.lineTo(22, 52); x.lineTo(30, 48); x.lineTo(20, 30); x.lineTo(34, 30); x.closePath(); x.fill(); x.stroke(); x.restore();
}

// each world: far / mid / near painters, all endless (ox = layer scroll offset)
const WORLD = [
  { // 0 NIGHT CITY
    far(x, t, ox, cam) {
      x.fillStyle = '#FFF4D6'; x.beginPath(); x.arc(1450 - cam * 0.03, 240, 92, 0, TAU); x.fill();
      x.fillStyle = 'rgba(255,244,214,0.13)'; x.beginPath(); x.arc(1450 - cam * 0.03, 240, 150, 0, TAU); x.fill();
      for (let i = 0; i < 90; i++) { x.fillStyle = `rgba(255,251,244,${0.3 + 0.6 * hash(i, 3)})`; x.fillRect((hash(i, 1) * 2400 - cam * 0.05) % 2400 - 200, hash(i, 2) * 560, 3, 3); }
      each(ox, 110, (bx, n) => { const bh = 180 + hash(n, 3) * 280; x.fillStyle = '#141A35'; x.fillRect(bx, H - bh, 112, bh); });
    },
    mid(x, t, ox) {
      each(ox, 290, (bx, n) => {
        const bw = 220 + hash(n, 5) * 50, bh = 360 + hash(n, 6) * 420, by = H - bh;
        x.fillStyle = '#1b2147'; x.fillRect(bx, by, bw, bh); x.fillStyle = '#2a3266'; x.fillRect(bx, by, 12, bh);
        for (let r = 0; r < bh / 46 - 1; r++) for (let c = 0; c < Math.floor((bw - 20) / 36); c++) {
          const hsh = hash(n * 31 + r, c); if (hsh < 0.42) continue;
          const blink = hsh > 0.93; x.fillStyle = blink ? (Math.floor(t * 4 + n) % 2 ? '#FF6A1F' : '#2a3266') : hsh > 0.72 ? '#FF8A3D' : '#FFD9A8';
          x.fillRect(bx + 22 + c * 36, by + 26 + r * 46, 16, 24);
        }
        x.fillStyle = '#1b2147'; x.fillRect(bx + bw / 2 - 3, by - 50, 6, 50); x.fillStyle = Math.floor(t * 3 + n) % 2 ? '#E8343F' : '#7a1020'; x.beginPath(); x.arc(bx + bw / 2, by - 52, 8, 0, TAU); x.fill();
      });
    },
    near(x, t, ox) { x.strokeStyle = 'rgba(255,138,61,0.9)'; x.lineCap = 'round'; each(ox, 700, (px, n) => { x.lineWidth = 6 + hash(n, 2) * 6; const y = 100 + hash(n, 8) * 880; x.beginPath(); x.moveTo(px, y); x.lineTo(px + 300, y); x.stroke(); }); },
  },
  { // 1 PAPER STUDIO
    far(x, t, ox, cam) {
      x.fillStyle = '#E8343F'; x.beginPath(); x.arc(560 - cam * 0.03, 250, 120, 0, TAU); x.fill();
      x.strokeStyle = '#1F2A55'; x.lineWidth = 6; x.stroke();
      for (let j = 0; j < 3; j++) {
        const o = ox * (0.6 + j * 0.45);
        const hill = () => { x.beginPath(); x.moveTo(-20, H + 20); for (let px = -20; px <= W + 40; px += 30) x.lineTo(px, H - 330 + j * 115 - (Math.sin((px + o) * 0.004 + j * 2) * 80 + Math.sin((px + o) * 0.011 + j) * 30)); x.lineTo(W + 40, H + 20); x.closePath(); };
        x.save(); x.translate(10, 12); hill(); x.fillStyle = 'rgba(31,42,85,0.25)'; x.fill(); x.restore();
        hill(); x.fillStyle = ['#CDBE9F', '#FF6A1F', '#E8343F'][j]; x.fill(); x.strokeStyle = '#1F2A55'; x.lineWidth = 7; x.stroke();
        // pencil hatching on each paper hill
        x.save(); hill(); x.clip(); x.strokeStyle = 'rgba(31,42,85,0.18)'; x.lineWidth = 3; x.beginPath();
        for (let k = -H; k < W + H; k += 26) { const kk = k - (o % 26); x.moveTo(kk, H); x.lineTo(kk + 300, H - 300); } x.stroke(); x.restore();
      }
    },
    mid(x, t, ox) {
      each(ox, 520, (px, n) => {
        const py = 160 + hash(n, 2) * 520 + Math.sin(t * 4 + n) * 20, s = 1 + hash(n, 4) * 0.7;
        x.save(); x.translate(px, py); x.scale(s, s); x.rotate(-0.15);
        x.fillStyle = 'rgba(31,42,85,0.18)'; x.beginPath(); x.moveTo(10, 40); x.lineTo(-110, 20); x.lineTo(-80, 70); x.closePath(); x.fill();
        x.fillStyle = '#FFFFFF'; x.strokeStyle = '#1F2A55'; x.lineWidth = 5; x.lineJoin = 'round';
        x.beginPath(); x.moveTo(60, 0); x.lineTo(-90, -40); x.lineTo(-50, 0); x.lineTo(-90, 34); x.closePath(); x.fill(); x.stroke();
        x.beginPath(); x.moveTo(60, 0); x.lineTo(-50, 0); x.stroke(); x.restore();
      });
    },
    near(x, t, ox) { each(ox, 260, (px, n) => { x.fillStyle = ['#E8343F', '#FF6A1F', '#1F2A55'][n % 3]; x.save(); x.translate(px, 80 + hash(n, 12) * 920); x.rotate(t * 5 + n); x.fillRect(-60, -8, 120, 16); x.restore(); }); },
  },
  { // 2 SKY BUILD
    far(x, t, ox, cam) {
      const sx = 1500 - cam * 0.03, sy = 240;
      x.save(); x.globalAlpha = 0.3; rays(x, sx, sy, 18, 1400, t * 0.5, '#FFF3B0', 'rgba(0,0,0,0)'); x.restore();
      x.fillStyle = '#FFD23F'; x.beginPath(); x.arc(sx, sy, 105, 0, TAU); x.fill();
      each(ox, 460, (px, n) => cloud(x, px, 820 + hash(n, 3) * 140, 1.5, '#FFFFFF', 'rgba(46,139,224,0.35)'));
    },
    mid(x, t, ox) { each(ox, 640, (px, n) => cloud(x, px, 200 + hash(n, 6) * 520, 1.1 + hash(n, 7) * 0.8, '#FFFFFF', 'rgba(46,139,224,0.3)')); },
    near(x, t, ox) { x.fillStyle = 'rgba(255,255,255,0.42)'; each(ox, 520, (px, n) => { const y = hash(n, 2) < 0.5 ? 80 + hash(n, 3) * 200 : 820 + hash(n, 3) * 200; x.beginPath(); x.ellipse(px, y, 260, 9, 0, 0, TAU); x.fill(); }); },
  },
  { // 3 SUNBURST POP
    far(x, t, ox) { rays(x, W * 0.62, H * 0.55, 24, 2000, t * 1.1, 'rgba(255,225,77,0.55)', 'rgba(0,0,0,0)'); x.fillStyle = 'rgba(255,251,244,0.35)'; each(ox, 60, (px, n) => { for (let r = 0; r < 18; r++) { const y = r * 60 + 30, rr = 4 + 5 * hash(n, r); x.beginPath(); x.arc(px, y, rr, 0, TAU); x.fill(); } }); },
    mid(x, t, ox) { each(ox, 380, (px, n) => { const py = 160 + hash(n, 4) * 700, r = 60 + hash(n, 5) * 60; star(x, px + 10, py + 12, r, r * 0.45, 5, t * 3 + n); x.fillStyle = '#7B2FF7'; x.fill(); star(x, px, py, r, r * 0.45, 5, t * 3 + n); x.fillStyle = n % 2 ? '#FFE14D' : '#FFFBF4'; x.fill(); }); },
    near(x, t, ox) { each(ox, 120, (px, n) => { x.fillStyle = ['#FFE14D', '#7B2FF7', '#FFFBF4', '#FF7A1A'][n % 4]; x.save(); x.translate(px, hash(n, 2) * H); x.rotate(t * 7 + n); x.fillRect(-16, -8, 32, 16); x.restore(); }); },
  },
  { // 4 INTERNET WINDOWS
    far(x, t, ox) { x.strokeStyle = 'rgba(43,43,255,0.16)'; x.lineWidth = 2; x.beginPath(); each(ox, 64, (px) => { x.moveTo(px, 0); x.lineTo(px, H); }, 64); for (let gy = 0; gy < H; gy += 64) { x.moveTo(0, gy); x.lineTo(W, gy); } x.stroke(); each(ox, 300, (px, n) => pointer(x, px, 100 + hash(n, 3) * 860, 0.8 + hash(n, 4))); },
    mid(x, t, ox) { const titles = ['AUTOPILOT.EXE', 'FLY.BAT', 'ONE_PROMPT.TXT', 'WORLD_TOUR.MP4']; each(ox, 540, (px, n) => win95(x, px, 110 + hash(n, 3) * 540, 320 + hash(n, 4) * 120, 200 + hash(n, 5) * 90, titles[((n % 4) + 4) % 4], n)); },
    near(x, t, ox) { x.fillStyle = '#2B2BFF'; each(ox, 230, (px, n) => x.fillRect(px, hash(n, 2) * H, 46, 46)); },
  },
  { // 5 GOLD RUSH
    far(x, t, ox) {
      rays(x, W * 0.6, H * 0.5, 30, 2000, -t * 0.8, 'rgba(17,17,17,0.13)', 'rgba(0,0,0,0)');
      x.fillStyle = 'rgba(17,17,17,0.32)'; x.beginPath(); each(ox, 26, (px) => { for (let y = 13; y < H; y += 26) { const r = 2 + 7 * (y / H) ** 1.5; x.moveTo(px + r, y); x.arc(px, y, r, 0, TAU); } }, 26); x.fill();
    },
    mid(x, t, ox) {
      each(ox, 400, (cx, n) => { const cy = 200 + hash(n, 2) * 560, r = 70 + hash(n, 3) * 40, sq = Math.abs(Math.cos(t * 4 + n)); x.fillStyle = '#7a5a00'; x.beginPath(); x.ellipse(cx + 8, cy + 10, r * sq + 4, r, 0, 0, TAU); x.fill(); x.fillStyle = '#FFE14D'; x.beginPath(); x.ellipse(cx, cy, r * sq + 3, r, 0, 0, TAU); x.fill(); x.strokeStyle = '#E0A100'; x.lineWidth = 8; x.beginPath(); x.ellipse(cx, cy, (r - 14) * sq + 2, r - 14, 0, 0, TAU); x.stroke(); });
      each(ox, 1300, (px) => bigType(x, '777', px, H * 0.8, { size: 170, family: 'Bungee', fill: '#111111', stroke: '#FFF4D6', sw: 14 }));
    },
    near(x, t, ox) { each(ox, 280, (px, n) => { x.fillStyle = '#FFE14D'; x.strokeStyle = '#111'; x.lineWidth = 4; x.beginPath(); x.ellipse(px, hash(n, 2) * H, 34, 34 * Math.abs(Math.cos(t * 9 + n)) + 3, 0, 0, TAU); x.fill(); x.stroke(); }); },
  },
  { // 6 VOXEL NEON
    far(x, t, ox, cam) {
      const sx = 1350 - cam * 0.03, sy = H * 0.6;
      const g = x.createLinearGradient(0, sy - 260, 0, sy); g.addColorStop(0, '#7CFFC4'); g.addColorStop(1, '#3EF0FF');
      x.beginPath(); x.arc(sx, sy, 260, Math.PI, 0); x.fillStyle = g; x.fill();
      x.fillStyle = '#120c33'; for (let j = 0; j < 7; j++) x.fillRect(sx - 270, sy - 20 - j * 34, 540, 4 + j * 1.8);
      const hz = H * 0.6; x.fillStyle = '#1A1240'; x.fillRect(0, hz, W, H - hz);
      x.strokeStyle = '#3EF0FF'; x.lineWidth = 3; x.beginPath();
      each(ox * 2, 70, (bx) => { x.moveTo(W / 2 + (bx - W / 2) * 0.16, hz); x.lineTo(bx, H); }, 3000);
      for (let j = 0; j < 9; j++) { const yy = hz + (H - hz) * ((j + (t * 3) % 1) / 9) ** 2; x.moveTo(0, yy); x.lineTo(W, yy); }
      x.stroke();
    },
    mid(x, t, ox) {
      each(ox, 430, (cx, n) => {
        const cy = 170 + hash(n, 5) * 300 + Math.sin(t * 3 + n) * 18, s = 60 + hash(n, 6) * 45;
        x.save(); x.translate(cx, cy); x.rotate(Math.sin(t + n) * 0.2);
        x.fillStyle = '#F2F5FF'; x.beginPath(); x.moveTo(0, -s); x.lineTo(s * 0.87, -s / 2); x.lineTo(0, 0); x.lineTo(-s * 0.87, -s / 2); x.closePath(); x.fill();
        x.fillStyle = '#B79CFF'; x.beginPath(); x.moveTo(-s * 0.87, -s / 2); x.lineTo(0, 0); x.lineTo(0, s); x.lineTo(-s * 0.87, s / 2); x.closePath(); x.fill();
        x.fillStyle = '#3EF0FF'; x.beginPath(); x.moveTo(s * 0.87, -s / 2); x.lineTo(0, 0); x.lineTo(0, s); x.lineTo(s * 0.87, s / 2); x.closePath(); x.fill();
        x.restore();
      });
    },
    near(x, t, ox) { x.strokeStyle = '#7CFFC4'; x.lineCap = 'round'; each(ox, 420, (px, n) => { x.lineWidth = 5 + 5 * hash(n, 5); const y = hash(n, 3) * H; x.beginPath(); x.moveTo(px, y); x.lineTo(px + 320, y); x.stroke(); }); },
  },
  { // 7 SUNSET
    far(x, t, ox, cam) {
      const sx = 1300 - cam * 0.02, sy = H * 0.8;
      x.save(); x.globalAlpha = 0.28; rays(x, sx, sy, 20, 1700, t * 0.25, '#FFF4EA', 'rgba(0,0,0,0)'); x.restore();
      const g = x.createRadialGradient(sx, sy, 0, sx, sy, 560); g.addColorStop(0, 'rgba(255,244,234,0.95)'); g.addColorStop(0.45, 'rgba(255,176,0,0.4)'); g.addColorStop(1, 'rgba(255,176,0,0)');
      x.fillStyle = g; x.fillRect(sx - 600, sy - 600, 1200, 1200);
      const sg = x.createLinearGradient(0, sy - 240, 0, sy + 60); sg.addColorStop(0, '#FFE14D'); sg.addColorStop(1, '#FF7A1A');
      x.fillStyle = sg; x.beginPath(); x.arc(sx, sy, 240, 0, TAU); x.fill();
      x.fillStyle = 'rgba(255,143,177,0.9)'; for (let j = 0; j < 4; j++) x.fillRect(sx - 260, sy - 70 + j * 34, 520, 8 + j * 4);
      x.fillStyle = '#FF8FB1'; x.fillRect(0, H * 0.82, W, H * 0.18);
      x.fillStyle = 'rgba(255,244,234,0.55)'; for (let j = 0; j < 5; j++) { const w2 = 360 - j * 30 + Math.sin(t * 6 + j) * 16; x.fillRect(sx - w2 / 2, H * 0.84 + j * 26, w2, 6); }
    },
    mid(x, t, ox) {
      each(ox, 700, (px, n) => cloud(x, px, 200 + hash(n, 6) * 300, 1.1 + hash(n, 7) * 0.6, '#C9B6FF', 'rgba(58,31,79,0.18)'));
      x.strokeStyle = '#3A1F4F'; x.lineWidth = 6; x.lineCap = 'round';
      each(ox * 0.8, 330, (bx, n) => { const by = 150 + hash(n, 10) * 380, f = Math.sin(t * 14 + n) * 16; x.beginPath(); x.moveTo(bx - 26, by + f); x.quadraticCurveTo(bx - 12, by - 10, bx, by + 4); x.quadraticCurveTo(bx + 12, by - 10, bx + 26, by + f); x.stroke(); });
    },
    near(x, t, ox) { x.fillStyle = 'rgba(255,244,234,0.85)'; each(ox, 200, (px, n) => { x.beginPath(); x.ellipse(px, hash(n, 2) * H, 16, 8, t * 3 + n, 0, TAU); x.fill(); }); },
  },
];

function drawWorld(x, k, t, cam, layers) {
  if (layers.sky) { const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, SKY[k][0]); g.addColorStop(1, SKY[k][1]); x.fillStyle = g; x.fillRect(0, 0, W, H); }
  x.save();
  if (layers.far) WORLD[k].far(x, t, cam * PF, cam);
  if (layers.mid) WORLD[k].mid(x, t, cam * PM, cam);
  if (layers.near) WORLD[k].near(x, t, cam * PN, cam);
  x.restore();
}
// screen x of seam k (the left edge of world k)
const seamX = (k, t) => CX + (T[k] - t) * VS;
function maskRight(x, sx) { // keep only what is right of the (tilted, feathered) seam
  x.globalCompositeOperation = 'destination-in';
  const a = -0.22, ca = Math.cos(a) * FEATHER / 2, sa = Math.sin(a) * FEATHER / 2;
  const g = x.createLinearGradient(sx - ca, H / 2 - sa, sx + ca, H / 2 + sa);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,1)');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.globalCompositeOperation = 'source-over';
}
function composite(ctx, t, cam, layers) {
  // leftmost world on screen, then every following world through its travelling mask
  let k0 = 0; while (k0 < 7 && seamX(k0 + 1, t) < -FEATHER) k0++;
  drawWorld(ctx, k0, t, cam, layers);
  for (let k = k0 + 1; k <= 7; k++) {
    const sx = seamX(k, t); if (sx > W + FEATHER) break;
    const b = buf('F05-world', W, H), bx = bctx(b);
    bx.setTransform(1, 0, 0, 1, 0, 0); bx.clearRect(0, 0, W, H);
    drawWorld(bx, k, t, cam, layers); maskRight(bx, sx);
    ctx.drawImage(b, 0, 0);
  }
}

// ---------------------------------------------------------------- CURSOR + banner
function banner(ctx, t, hx, hy) {
  const text = t < 136.66 ? 'ON AUTOPILOT' : 'LET IT FLY!';
  const flip = Math.max(0.04, Math.abs(Math.cos(Math.PI * seg(t, 136.56, 136.76))));
  const bw = 860, bh = 132;
  const bc = buf('F05-banner', bw, bh), bx = bctx(bc);
  bx.clearRect(0, 0, bw, bh);
  bx.fillStyle = '#FFFBF4'; bx.fillRect(0, 0, bw, bh);
  bx.fillStyle = '#E8343F'; bx.fillRect(0, 0, bw, 12); bx.fillRect(0, bh - 12, bw, 12);
  bigType(bx, text, bw / 2, bh / 2 + 4, { size: 104, fill: '#1F2A55', maxW: bw - 60, track: 4 });
  const x0 = hx - 230, y0 = hy + 30;
  ctx.strokeStyle = '#1F2A55'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.quadraticCurveTo(hx - 120, hy + 50, x0, y0 - 40); ctx.moveTo(hx, hy); ctx.quadraticCurveTo(hx - 120, hy + 70, x0, y0 + 40); ctx.stroke();
  const slice = 10;
  for (let i = 0; i < bw; i += slice) {
    const u = i / bw, amp = 8 + 34 * u, ph = TAU * (u * 1.6) - t * 13;
    const dy = Math.sin(ph) * amp, sl = Math.cos(ph), sx = x0 - i - slice;
    ctx.drawImage(bc, bw - i - slice, 0, slice, bh, sx, y0 - bh / 2 * flip + dy, slice + 1, bh * flip);
    ctx.fillStyle = sl > 0 ? `rgba(31,42,85,${0.18 * sl})` : `rgba(255,255,255,${-0.15 * sl})`;
    ctx.fillRect(sx, y0 - bh / 2 * flip + dy, slice + 1, bh * flip);
  }
}
function goggles(ctx, P, t) {
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (let pass = 0; pass < 2; pass++) {
    ctx.beginPath(); ctx.moveTo(-60, 70);
    for (let i = 1; i <= 14; i++) { const u = i / 14; ctx.lineTo(-60 - u * 330, 70 + Math.sin(u * 7 - t * 16) * 26 * u + u * 40); }
    ctx.lineWidth = pass ? 26 : 34; ctx.strokeStyle = pass ? '#E8343F' : '#1F2A55'; ctx.stroke();
  }
  ctx.fillStyle = '#E8343F'; ctx.strokeStyle = '#1F2A55'; ctx.lineWidth = 6; roundRect(ctx, -92, 58, 184, 34, 16); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#5a3b1f'; ctx.fillRect(-88, -104, 176, 16);
  for (const gx of [-36, 36]) { ctx.beginPath(); ctx.arc(gx, -96, 27, 0, TAU); ctx.fillStyle = '#FFC300'; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = '#1F2A55'; ctx.stroke(); ctx.beginPath(); ctx.arc(gx, -96, 16, 0, TAU); ctx.fillStyle = '#9ad8ff'; ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(gx - 9, -104, 6, 6); }
  ctx.restore();
}

export default {
  ...S,
  cutIn: 'punch',
  sfx: [{ t: 135.26, type: 'whoosh', gain: 1 }, { t: 136.28, type: 'swoosh' }, { t: 137.3, type: 'whoosh' }, { t: 138.09, type: 'swoosh' }],
  draw(ctx, t, s, E) {
    const cam = camAt(t);
    composite(ctx, t, cam, { sky: true, far: true, mid: true });

    // ---- CURSOR flies (barrel roll on the downbeat 138.09)
    const P = pose('fly', t);
    P.armR = [215, -150 + Math.sin(t * 6) * 10]; P.armL = [-170, 60]; P.legL = [-120, 150 + Math.sin(t * 9) * 12]; P.legR = [-70, 178 + Math.cos(t * 9) * 12];
    const roll = TAU * ease.inOutCubic(seg(t, 138.09, 138.42));
    const cy = 470 + Math.sin(t * 3.1) * 40 - 60 * A.pulse('beat', t, 0.18);
    const cs = 1.22;
    ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineCap = 'round';
    for (let i = 0; i < 9; i++) { const y = cy - 300 + i * 50 + hash(i, 4) * 30, len = 160 + hash(i, 5) * 260, xo = ((t * 2400 + hash(i, 6) * 900) % 900); ctx.lineWidth = 4 + hash(i, 7) * 6; ctx.beginPath(); ctx.moveTo(CX - 220 - xo, y); ctx.lineTo(CX - 220 - xo - len, y); ctx.stroke(); }
    ctx.restore();
    banner(ctx, t, CX - 150, cy - 120);
    ctx.save(); ctx.translate(CX, cy); ctx.rotate(roll); ctx.translate(-CX, -cy);
    drawMascot(ctx, { x: CX, y: cy + 185 * cs, s: cs, t, P, eyes: t > 137.3 && t < 138.0 ? 'star' : 'happy', mouth: 'auto', sticker: true, over: (c, P2) => goggles(c, P2, t) });
    ctx.restore();

    composite(ctx, t, cam, { near: true });

    // ---- FLY slam
    if (t >= 137.3 && t < 138.05) {
      const u = ease.outBack(seg(t, 137.3, 137.48), 2.4), out = ease.inQuad(seg(t, 137.85, 138.05));
      ctx.save(); ctx.translate(W * 0.47 + out * 900, H * 0.5); ctx.rotate(-0.08); ctx.scale(u * (1 + out), u);
      ctx.globalAlpha = 1 - out;
      bigType(ctx, 'FLY', 0, 0, { size: 580, fill: 'rgba(0,0,0,0)', stroke: '#1F2A55', sw: 30, shadow: null });
      bigType(ctx, 'FLY', 0, 0, { size: 580, fill: 'rgba(0,0,0,0)', stroke: '#FFFFFF', sw: 14 });
      ctx.restore();
    }
    // ---- hits on every seam crossing
    for (let k = 1; k < 8; k++) {
      const d = t - T[k]; if (d < 0 || d > 0.2) continue;
      const q = 1 - d / 0.2; E.fx.zoom += 0.035 * q * q; E.fx.rgb += 6 * q; E.fx.radialBlur = 0.22 * q;
    }
    E.fx.center = [CX / W, 1 - cy / H];
    E.fx.vignette = 0.2;
  },
};
