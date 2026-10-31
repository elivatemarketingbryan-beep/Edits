// F06 — "One prompt, and the whole thing comes alive" · PHOTOMOSAIC (SELF-RENDER)
// CURSOR's face rebuilt from 2,304 tiles, every tile a real frame of THIS video (E.thumb renders ~120 moments of
// the whole timeline once, cached). Each tile is matched on a 2×2 colour layout (structure, not just average)
// with a neighbour-repeat penalty, then colour-graded toward its target. The shot opens INSIDE one tile — which
// is exactly the last frame of F05 — and log-zooms out ×48 to reveal the face. The face is alive: it lip-syncs,
// blinks and changes palette every beat, so the mosaic re-matches live (dirty-tile cache keeps it fast).
// On "alive" every tile bursts toward the camera and the frame explodes to white.
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, seg, hash, buf, bctx, rays, hex2rgb, roundRect } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { drawMascot } from '../../core/mascot.js';
import { bigType, SETS } from './common.js';

const S = shot('F06');
const COLS = 48, ROWS = 48, TW = W / COLS, TH = H / ROWS; // 40 × 22.5 px tiles at full zoom-out
const MW = 80, MH = 45;                                    // tile size in the master mosaic canvas
const ZMAX = COLS;                                         // one tile fills the frame
const HERO = { c: 27, r: 30 };                             // tile that holds F05's last frame
const T_ALIVE = 142.52;
const HERO_T = 138.93;

// ---------------------------------------------------------------- thumbnail library (built once, lazily)
let LIB = null;
function libTimes() {
  const ts = [];
  for (let i = 0; i < 100; i++) ts.push(+(0.4 + i * (119.1 / 99)).toFixed(3));   // 0:00 → 1:59 (skips the self-render bridge shots)
  for (let j = 0; j < 20; j++) ts.push(+(125.4 + j * (13.4 / 19)).toFixed(3));  // the final chorus so far
  return ts;
}
function buildLib(E) {
  const ts = libTimes(), n = ts.length;
  const atlasCols = 12, atlasRows = Math.ceil(n / atlasCols);
  const atlas = buf('F06-atlas', atlasCols * MW, atlasRows * MH), ax = bctx(atlas);
  ax.imageSmoothingQuality = 'high';
  const probe = buf('read-F06-probe', 16, 8), px = bctx(probe); px.imageSmoothingQuality = 'high';
  const stats = new Float32Array(n * 12), big = [];
  for (let i = 0; i < n; i++) {
    const th = E.thumb(ts[i], 320, 180);
    big.push(th);
    ax.drawImage(th, (i % atlasCols) * MW, Math.floor(i / atlasCols) * MH, MW, MH);
    px.clearRect(0, 0, 16, 8); px.drawImage(th, 0, 0, 16, 8);
    const d = px.getImageData(0, 0, 16, 8).data;
    for (let q = 0; q < 4; q++) {
      const qx = (q % 2) * 8, qy = Math.floor(q / 2) * 4; let r = 0, g = 0, b = 0;
      for (let y = qy; y < qy + 4; y++) for (let x = qx; x < qx + 8; x++) { const k = (y * 16 + x) * 4; r += d[k]; g += d[k + 1]; b += d[k + 2]; }
      stats[i * 12 + q * 3] = r / 32; stats[i * 12 + q * 3 + 1] = g / 32; stats[i * 12 + q * 3 + 2] = b / 32;
    }
  }
  const hero = E.thumb(HERO_T, 1920, 1080);
  LIB = { ts, n, atlas, atlasCols, stats, big, hero, assign: new Int16Array(COLS * ROWS).fill(-1), keys: new Int32Array(COLS * ROWS).fill(-1), cur: new Int16Array(COLS * ROWS), col: new Uint8Array(COLS * ROWS * 3) };
  const m = buf('F06-master', COLS * MW, ROWS * MH), mx = bctx(m); mx.fillStyle = '#0E0E12'; mx.fillRect(0, 0, m.width, m.height);
  LIB.master = m;
}

// ---------------------------------------------------------------- the living target face
const FACE = [ // body / ink / background pairs cycled per beat (every world)
  { body: '#FF6A1F', bg: '#FFE14D', bg2: '#FF3E8A' },
  { body: '#FF3E8A', bg: '#3EF0FF', bg2: '#2B2BFF' },
  { body: '#3EF0FF', bg: '#B79CFF', bg2: '#1A1240' },
  { body: '#FFC300', bg: '#FF6A1F', bg2: '#E8343F' },
  { body: '#7CFFC4', bg: '#2B2BFF', bg2: '#0E0E12' },
  { body: '#FF7A1A', bg: '#6EC3F0', bg2: '#FFFFFF' },
  { body: '#B79CFF', bg: '#FFB38A', bg2: '#FF8FB1' },
];
let B0 = null;
function faceSet(t) { if (B0 === null) B0 = A.beat(S.start + 0.01).i; const k = A.beat(t).i - B0; return FACE[((k % FACE.length) + FACE.length) % FACE.length]; }
function drawFace(x, t, sx, sy) {
  const F = faceSet(t);
  x.save(); x.scale(sx, sy);
  const g = x.createRadialGradient(W / 2, H * 0.5, 100, W / 2, H * 0.5, 1150); g.addColorStop(0, F.bg); g.addColorStop(1, F.bg2);
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  rays(x, W / 2, H * 0.5, 20, 1600, t * 0.4, 'rgba(255,255,255,0.22)', 'rgba(0,0,0,0)');
  const v = A.env('vocal', t), wave = Math.sin(t * 9);
  const P = { armL: [-175 - wave * 20, -40 - v * 60], armR: [175 + wave * 20, -40 - v * 60], legL: [-48, 185], legR: [48, 185], squash: 0.04 * A.pulse('beat', t, 0.12), rot: Math.sin(t * 2.4) * 0.03, bob: 0, look: [Math.sin(t * 1.7) * 0.6, -0.1], lean: 0 };
  const alive = t >= 142.14;
  drawMascot(x, { x: W / 2, y: 545 + 185 * 4.1, s: 4.1, t, P, eyes: alive ? 'star' : 'normal', mouth: 'auto', colors: { body: F.body }, glyph: true });
  x.restore();
}

// ---------------------------------------------------------------- matching + master mosaic
function match(t) {
  const tc = buf('read-F06-target', COLS * 2, ROWS * 2), tx = bctx(tc);
  tx.setTransform(1, 0, 0, 1, 0, 0); tx.imageSmoothingQuality = 'high';
  drawFace(tx, t, COLS * 2 / W, ROWS * 2 / H);
  const d = tx.getImageData(0, 0, COLS * 2, ROWS * 2).data, L = LIB, st = L.stats, n = L.n;
  const tw = COLS * 2, memo = new Map();
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const q = [];
    for (let k = 0; k < 4; k++) { const p = ((r * 2 + (k >> 1)) * tw + c * 2 + (k & 1)) * 4; q.push(d[p], d[p + 1], d[p + 2]); }
    const i = r * COLS + c;
    const mr = (q[0] + q[3] + q[6] + q[9]) / 4, mg = (q[1] + q[4] + q[7] + q[10]) / 4, mb = (q[2] + q[5] + q[8] + q[11]) / 4;
    L.col[i * 3] = mr; L.col[i * 3 + 1] = mg; L.col[i * 3 + 2] = mb;
    const left = c > 0 ? L.cur[i - 1] : -1, up = r > 0 ? L.cur[i - COLS] : -1, ul = c > 0 && r > 0 ? L.cur[i - COLS - 1] : -1;
    const key = q.map((v) => v >> 4).join(',') + '|' + left + '|' + up + '|' + (hash(c, r) * 3 | 0);
    let best = memo.get(key);
    if (best === undefined) {
      let bd = 1e18; best = 0;
      const off = Math.floor(hash(c, r, 5) * n);
      for (let jj = 0; jj < n; jj++) {
        const j = (jj + off) % n; let dist = 0;
        for (let k = 0; k < 12; k += 3) { const dr = q[k] - st[j * 12 + k], dg = q[k + 1] - st[j * 12 + k + 1], db = q[k + 2] - st[j * 12 + k + 2]; dist += 2 * dr * dr + 4 * dg * dg + 3 * db * db; }
        if (j === left || j === up || j === ul) dist += 9000;
        if (dist < bd) { bd = dist; best = j; }
      }
      memo.set(key, best);
    }
    L.cur[i] = best;
  }
}
const GRADE = 0.5; // how hard each small tile is pulled toward its target colour
function updateMaster() {
  const L = LIB, mx = bctx(L.master), ac = L.atlasCols;
  for (let i = 0; i < COLS * ROWS; i++) {
    const j = L.cur[i], r = L.col[i * 3] >> 3, g = L.col[i * 3 + 1] >> 3, b = L.col[i * 3 + 2] >> 3;
    const key = (j << 15) | (r << 10) | (g << 5) | b;
    if (L.keys[i] === key) continue;
    L.keys[i] = key;
    const c = i % COLS, rr = Math.floor(i / COLS), x = c * MW, y = rr * MH;
    mx.drawImage(L.atlas, (j % ac) * MW, Math.floor(j / ac) * MH, MW, MH, x + 1, y + 1, MW - 2, MH - 2);
    mx.fillStyle = `rgba(${r * 8 + 4},${g * 8 + 4},${b * 8 + 4},${GRADE})`; mx.fillRect(x + 1, y + 1, MW - 2, MH - 2);
  }
}
const fmt = (t) => `${String(Math.floor(t / 60)).padStart(2, '0')}:${(t % 60).toFixed(2).padStart(5, '0')}`;

export default {
  ...S,
  cutIn: 'none',
  sfx: [{ t: 138.96, type: 'whoosh', gain: 0.8 }, { t: 140.48, type: 'ding' }, { t: T_ALIVE, type: 'firework', gain: 1 }],
  draw(ctx, t, s, E) {
    if (!LIB) {
      if (s.thumb) { drawFace(ctx, t, 1, 1); return; } // cheap stand-in when another shot thumbnails us
      buildLib(E);
    }
    const L = LIB;
    match(t); updateMaster();

    // ---- camera: log-zoom out from the hero tile, landing on the downbeat
    const zu0 = seg(t, S.start, 140.48), zu = 0.5 - 0.5 * Math.cos(Math.PI * zu0);
    const push = 1 + 0.14 * ease.inOutQuad(seg(t, 140.48, 141.84)) - 0.1 * ease.outExpo(seg(t, 141.84, 142.2));
    const z = Math.pow(ZMAX, 1 - zu) * push * (1 + 0.02 * A.pulse('beat', t, 0.15));
    const hx = (HERO.c + 0.5) * TW, hy = (HERO.r + 0.5) * TH;
    const lu = Math.log(z) / Math.log(ZMAX);
    const cxp = lerp(W / 2, hx, clamp(lu)), cyp = lerp(H / 2, hy, clamp(lu));
    const rot = 0.045 * Math.sin(seg(t, 139.2, T_ALIVE) * Math.PI) * (1 - clamp(lu));
    const zc = Math.cos(rot) + (W / H) * Math.abs(Math.sin(rot)) + 0.01; // never expose the frame edge when tilted
    const zz = Math.max(z, zc);
    const toS = (wx, wy) => [(wx - cxp) * zz, (wy - cyp) * zz];
    ctx.fillStyle = '#0E0E12'; ctx.fillRect(0, 0, W, H);
    const blow = t >= T_ALIVE ? t - T_ALIVE : -1;

    ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(rot);
    if (blow < 0) {
      // base: the whole master mosaic
      const [x0, y0] = toS(0, 0);
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(L.master, x0, y0, W * zz, H * zz);
      // big tiles: real frames, sharper sources, graded less the bigger they are
      const tws = TW * zz;
      if (tws > 70) {
        const half = Math.hypot(W, H) / 2;
        const c0 = Math.max(0, Math.floor((cxp - half / zz) / TW)), c1 = Math.min(COLS - 1, Math.floor((cxp + half / zz) / TW));
        const r0 = Math.max(0, Math.floor((cyp - half / zz) / TH)), r1 = Math.min(ROWS - 1, Math.floor((cyp + half / zz) / TH));
        const open = ease.outCubic(seg(t, S.start, S.start + 0.22)); // first frame == F05's last frame, then the tile border opens
        const gap = Math.max(2, tws * 0.012) * open;
        const grade = clamp((420 - tws) / 350) * GRADE;
        for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
          const i = r * COLS + c, [sx, sy] = toS(c * TW, r * TH), w = TW * zz, h = TH * zz;
          const isHero = c === HERO.c && r === HERO.r;
          ctx.fillStyle = '#0E0E12'; ctx.fillRect(sx, sy, w, h);
          ctx.drawImage(isHero ? L.hero : L.big[L.cur[i]], sx + gap, sy + gap, w - 2 * gap, h - 2 * gap);
          if (grade > 0.01 && !(isHero && tws > 600)) { ctx.fillStyle = `rgba(${L.col[i * 3]},${L.col[i * 3 + 1]},${L.col[i * 3 + 2]},${isHero ? grade * 0.6 : grade})`; ctx.fillRect(sx + gap, sy + gap, w - 2 * gap, h - 2 * gap); }
          if (tws > 260 && open > 0.5) { // frame timecode on big tiles
            const tt = isHero ? HERO_T : L.ts[L.cur[i]], fs = Math.max(11, Math.min(28, tws * 0.022));
            ctx.font = `700 ${fs}px "JetBrains Mono"`; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
            const lab = `▶ ${fmt(tt)} · F${String(Math.round(tt * 30)).padStart(4, '0')}`;
            const lw = ctx.measureText(lab).width;
            ctx.fillStyle = 'rgba(14,14,18,0.78)'; ctx.fillRect(sx + gap + fs * 0.6, sy + gap + fs * 0.6, lw + fs * 0.8, fs * 1.5);
            ctx.fillStyle = '#FFFBF4'; ctx.fillText(lab, sx + gap + fs, sy + gap + fs * 0.85);
          }
        }
      }
      if (t > 140.4) { // a ring of light runs across the tiles on every beat
        const bt = A.beat(t), age = t - bt.last, rr = age * 2600;
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createRadialGradient(0, 0, Math.max(0, rr - 160), 0, 0, rr + 30);
        g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.75, `rgba(255,250,235,${0.32 * Math.exp(-age / 0.35)})`); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g; ctx.fillRect(-W, -H, 2 * W, 2 * H); ctx.restore();
      }
    } else {
      // ALIVE: every tile bursts toward the camera
      const k = blow;
      ctx.save();
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 900 + k * 3000); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,240,200,0.8)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.fillRect(-W, -H, 2 * W, 2 * H); ctx.restore();
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const i = r * COLS + c;
        const [sx, sy] = toS((c + 0.5) * TW, (r + 0.5) * TH);
        const dl = Math.hypot(sx, sy) / 1100, delay = dl * 0.08 + hash(c, r, 9) * 0.05, u = Math.max(0, k - delay);
        const sc = 1 + u * u * (14 + 26 * hash(c, r, 2)), push = 1 + u * (3 + 5 * hash(c, r, 3)) + u * u * 12;
        const ang = (hash(c, r, 4) - 0.5) * 7 * u;
        ctx.save(); ctx.translate(sx * push, sy * push); ctx.rotate(ang); ctx.scale(sc, sc);
        ctx.globalAlpha = clamp(1 - u * 2.2);
        ctx.drawImage(L.master, c * MW, r * MH, MW, MH, -TW * zz / 2, -TH * zz / 2, TW * zz, TH * zz);
        ctx.restore();
      }
    }
    ctx.restore();

    // ---- type
    const wt = (str, t0, t1, x, y, size, o = {}) => {
      if (t < t0 || t > t1) return;
      const u = ease.outBack(seg(t, t0, t0 + 0.2), 1.8), out = seg(t, t1 - 0.1, t1);
      ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot || 0); ctx.scale(u, u); ctx.globalAlpha = 1 - out;
      bigType(ctx, str, 0, 0, { size, family: o.family || 'Anton', fill: o.fill || '#FFFBF4', stroke: '#0E0E12', sw: size * 0.07, shadow: o.shadow || '#FF3E8A', sx: size * 0.035, sy: size * 0.04, maxW: 1700 });
      ctx.restore();
    };
    wt('ONE', 138.96, 139.84, W / 2, H * 0.78, 190, { shadow: '#FF6A1F' });
    wt('ONE PROMPT', 139.84, 140.9, W / 2, H * 0.78, 190, { shadow: '#2B2BFF' });
    wt('THE WHOLE THING', 141.44, 142.14, W / 2, 200, 120, { family: 'Rubik Mono One', shadow: '#2B2BFF' });
    wt('COMES', 142.14, 142.55, W / 2, 200, 170, { family: 'Rubik Mono One', shadow: '#FF3E8A' });
    if (t >= T_ALIVE) {
      const u = ease.outBack(seg(t, T_ALIVE, T_ALIVE + 0.16), 2.6);
      ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(u * (1 + blow * 0.5), u * (1 + blow * 0.5)); ctx.rotate(-0.05);
      bigType(ctx, 'ALIVE!', 0, 0, { size: 400, fill: '#FF6A1F', stroke: '#1F2A55', sw: 26, shadow: '#1F2A55', sx: 16, sy: 18 });
      ctx.restore();
    }

    // ---- fx
    const dn = t - 140.48; if (dn >= 0 && dn < 0.3) { const q = 1 - dn / 0.3; E.fx.zoom += 0.03 * q * q; E.fx.rgb += 5 * q; }
    if (blow >= 0) {
      E.fx.flash = [1, 1, 1, clamp(Math.pow(blow / 0.36, 1.6)) * 0.97];
      E.fx.bloom = 0.8; E.fx.bloomThreshold = 0.6; E.fx.shake = 18 * Math.exp(-blow / 0.1); E.fx.rgb += 10 * Math.exp(-blow / 0.12);
      E.fx.radialBlur = 0.6 * Math.exp(-blow / 0.25);
    }
    E.fx.vignette = 0.22;
  },
};
