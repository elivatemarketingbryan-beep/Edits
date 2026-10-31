// g4 shared sky world for C09 (paper-cloud flight) and C10 (sky-writing): sunset-pop gradient sky,
// a sun with turning rays, and layered paper-cut cloud sprites (sharp + pre-blurred for near-lens layers).
import { W, H, TAU, clamp, lerp, hash, rng, buf, bctx } from '../../core/lib.js';

export const SKY = { top: '#FF4F9A', mid: '#FF8A3D', low: '#FFD84D', sun: '#FFF6C9', ray: 'rgba(255,248,214,0.16)' };

export function drawSky(ctx, t, { horizon = 800, sunX = 1340, sunY = 760, sunR = 210, rot = 0, camY = 0 } = {}) {
  const g = ctx.createLinearGradient(0, -200 + camY, 0, horizon + 120 + camY);
  g.addColorStop(0, '#FF3E8A'); g.addColorStop(0.45, SKY.top); g.addColorStop(0.72, SKY.mid); g.addColorStop(1, SKY.low);
  ctx.fillStyle = g; ctx.fillRect(-300, -300, W + 600, H + 600);
  // sun rays
  ctx.save(); ctx.fillStyle = SKY.ray; ctx.beginPath();
  for (let i = 0; i < 24; i += 2) {
    const a0 = rot + (i / 24) * TAU, a1 = rot + ((i + 1) / 24) * TAU;
    ctx.moveTo(sunX, sunY + camY); ctx.lineTo(sunX + Math.cos(a0) * 2600, sunY + camY + Math.sin(a0) * 2600); ctx.lineTo(sunX + Math.cos(a1) * 2600, sunY + camY + Math.sin(a1) * 2600); ctx.closePath();
  }
  ctx.fill();
  // sun: concentric paper discs
  const cols = ['rgba(255,240,170,0.35)', 'rgba(255,236,150,0.55)', '#FFE98A', SKY.sun];
  cols.forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(sunX, sunY + camY, sunR * (1.75 - i * 0.25), 0, TAU); ctx.fill(); });
  ctx.restore();
}

const CLOUD_TINTS = [
  { base: '#FFFFFF', top: '#FFFFFF', shade: '#FFC2DD', sh: 'rgba(196,40,120,0.35)' },
  { base: '#FFE3F0', top: '#FFFFFF', shade: '#FF9CC8', sh: 'rgba(196,40,120,0.38)' },
  { base: '#FFF3C4', top: '#FFFDF0', shade: '#FFD27A', sh: 'rgba(214,90,20,0.35)' },
  { base: '#EADCFF', top: '#FFFFFF', shade: '#C9A8FF', sh: 'rgba(110,40,200,0.33)' },
];

let SPRITES = null;
/** paper-cut cloud sprites: [{c, cb, w, h}] */
export function cloudSprites() {
  if (SPRITES) return SPRITES;
  SPRITES = [];
  for (let v = 0; v < 12; v++) {
    const R = rng(900 + v * 17), tint = CLOUD_TINTS[v % CLOUD_TINTS.length];
    const w = 760, h = 380, c = buf('C09-cloud-' + v, w, h), x = bctx(c);
    x.clearRect(0, 0, w, h);
    const n = R.int(4, 6), bumps = [];
    let cx = 120;
    for (let i = 0; i < n; i++) { const r = R.range(70, 130) * (i === 0 || i === n - 1 ? 0.75 : 1); bumps.push([cx, 300 - r * R.range(0.6, 0.95), r]); cx += (520 / (n - 1)); }
    const shape = (ctx, k, ox, oy) => {
      ctx.beginPath();
      for (const [bx, by, r] of bumps) { ctx.moveTo(bx + ox + r * k, by + oy); ctx.arc(bx + ox, by + oy, r * k, 0, TAU); }
      ctx.moveTo(90 + ox, 300 + oy); roundRectPath(ctx, 70 + ox + (1 - k) * 40, 230 + oy, 620 - (1 - k) * 80, 70 * k + 10, 35 * k + 5);
    };
    // drop shadow (paper layer floating above the sky)
    x.fillStyle = tint.sh; shape(x, 1, 16, 18); x.fill();
    // layer 1: shaded base
    x.fillStyle = tint.shade; shape(x, 1, 0, 0); x.fill();
    // layer 2: main paper
    x.fillStyle = tint.base; shape(x, 0.9, -6, -12); x.fill();
    // layer 3: highlight cut-out with its own soft shadow
    x.fillStyle = 'rgba(0,0,0,0.06)'; shape(x, 0.66, 0, -20); x.fill();
    x.fillStyle = tint.top; shape(x, 0.64, -10, -30); x.fill();
    // paper grain
    const gr = rng(77 + v);
    x.globalCompositeOperation = 'source-atop';
    for (let i = 0; i < 900; i++) { x.fillStyle = gr() < 0.5 ? 'rgba(255,255,255,0.18)' : 'rgba(120,40,80,0.05)'; x.fillRect(gr() * w, gr() * h, 2, 2); }
    x.globalCompositeOperation = 'source-over';
    // blurred copy for near-lens layers
    const cb = buf('C09-cloudb-' + v, w / 2, h / 2), xb = bctx(cb);
    xb.clearRect(0, 0, w / 2, h / 2); xb.filter = 'blur(7px)'; xb.drawImage(c, 0, 0, w / 2, h / 2); xb.filter = 'none';
    SPRITES.push({ c, cb, w, h });
  }
  return SPRITES;
}
function roundRectPath(ctx, x, y, w, h, r) {
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

/**
 * Multiplane cloud field. camX in world px (at depth 1). layers: [{z, n (clouds per 4000px), y0, y1, scale}]
 * draws every layer whose z is in (zMin, zMax]. stretch = horizontal motion-blur factor.
 */
export function drawClouds(ctx, layers, camX, camY, zMin, zMax, opts = {}) {
  const S = cloudSprites();
  const horizon = opts.horizon ?? 760, stretch = opts.stretch ?? 0;
  for (let L = 0; L < layers.length; L++) {
    const ly = layers[L];
    if (!(ly.z > zMin && ly.z <= zMax)) continue;
    const spacing = 4000 / ly.n;
    const lx = camX / ly.z; // parallax position of this layer
    const i0 = Math.floor((lx - W) / spacing) - 1, i1 = Math.ceil((lx + W * 2) / spacing) + 1;
    const near = ly.z < 0.8;
    for (let i = i0; i <= i1; i++) {
      const h1 = hash(i, L, 1), h2 = hash(i, L, 2), h3 = hash(i, L, 3);
      if (h3 < (ly.skip ?? 0)) continue;
      const sp = S[Math.floor(h1 * S.length)];
      const sc = (ly.scale ?? 1) / ly.z * (0.7 + 0.6 * h2) * 0.55;
      const sx = i * spacing + h2 * spacing * 0.6 - lx;
      const sy = horizon + (lerp(ly.y0, ly.y1, h1) - camY) / ly.z;
      const w = sp.w * sc, h = sp.h * sc;
      if (sx + w < -100 || sx > W + 100) continue;
      const ext = stretch * (near ? 1 : 0.4) / ly.z;
      ctx.globalAlpha = ly.alpha ?? 1;
      ctx.drawImage(near && ly.blur ? sp.cb : sp.c, sx - ext, sy - h, w + ext, h);
    }
    ctx.globalAlpha = 1;
  }
}
