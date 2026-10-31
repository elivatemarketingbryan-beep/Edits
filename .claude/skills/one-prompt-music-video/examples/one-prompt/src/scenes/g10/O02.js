// O02 — "The skill is free" — GOLDEN WINK. CURSOR stands on a hill in front of a huge rising sun (golden
// back-light, rim glow, long sweeping rays, drifting bokeh, birds). Above it a real 3D satin ribbon (Three.js,
// rebuilt every frame from an arc-length spiral: the rolled part is an actual Archimedean spiral that shrinks
// as it unrolls) unfurls word-by-word ON the vocal: THE · SKILL · IS · FREE. On "free" the ribbon snaps open,
// its tail flips out, FREE glints, and CURSOR turns to camera and winks.
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, seg, hash, font, roundRect, buf, bctx } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { drawMascot } from '../../core/mascot.js';
import { THREE, render3d, envMap, renderer } from '../../core/three.js';
import { softRays, motes, glowPass, inOutSine, lensFlare } from './common.js';

const S = shot('O02');
const T0 = S.start;            // 145.52
const W_THE = 145.52, W_SKILL = 147.66, W_IS = 149.62, W_FREE = 149.92;

// ---------- ribbon ----------
const L = 15.6, RH = 2.3, NX = 360, NY = 3, TH = 0.03, RMIN = 0.13;
const TEX_W = 2048, TEX_H = 256;
let R3 = null;

function ribbonTexture() {
  const c = document.createElement('canvas'); c.width = TEX_W; c.height = TEX_H;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, TEX_H);
  g.addColorStop(0, '#34428A'); g.addColorStop(0.45, '#24306A'); g.addColorStop(1, '#161E48');
  x.fillStyle = g; x.fillRect(0, 0, TEX_W, TEX_H);
  // gold trim + stitching
  x.fillStyle = '#FFD23F'; x.fillRect(0, 12, TEX_W, 9); x.fillRect(0, TEX_H - 21, TEX_W, 9);
  x.strokeStyle = 'rgba(255,244,214,0.55)'; x.lineWidth = 3; x.setLineDash([16, 12]);
  x.beginPath(); x.moveTo(0, 36); x.lineTo(TEX_W, 36); x.moveTo(0, TEX_H - 36); x.lineTo(TEX_W, TEX_H - 36); x.stroke(); x.setLineDash([]);
  // words
  const words = ['THE', 'SKILL', 'IS', 'FREE'];
  font(x, 196, 'Anton'); x.textBaseline = 'middle'; x.textAlign = 'left';
  const sp = 58, ws = words.map((w) => x.measureText(w).width);
  const total = ws.reduce((a, b) => a + b, 0) + sp * 3;
  let px = (TEX_W - total) / 2 + 20;
  const ends = [];
  words.forEach((w, i) => {
    x.fillStyle = 'rgba(8,10,30,0.55)'; x.fillText(w, px + 6, TEX_H / 2 + 10);
    x.fillStyle = i === 3 ? '#FFD23F' : '#FFFBF4'; x.fillText(w, px, TEX_H / 2 + 4);
    px += ws[i]; ends.push(px); px += sp;
  });
  // stars at both ends
  const starAt = (cx) => { x.fillStyle = '#FFD23F'; x.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 - Math.PI / 2, r = i % 2 ? 12 : 34; x.lineTo(cx + Math.cos(a) * r, TEX_H / 2 + Math.sin(a) * r); } x.closePath(); x.fill(); };
  starAt(((TEX_W - total) / 2 + 20) / 2); starAt((px - sp + TEX_W) / 2);
  const start = (TEX_W - total) / 2 + 20;
  return { c, ends: ends.map((e) => (e + 26) / TEX_W * L), freeStart: (ends[2] + sp) / TEX_W * L, freeEnd: ends[3] / TEX_W * L, start: start / TEX_W * L };
}

function build() {
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(30, W / H, 0.1, 200);
  const T = ribbonTexture();
  const tex = new THREE.CanvasTexture(T.c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array((NX + 1) * NY * 3), uv = new Float32Array((NX + 1) * NY * 2), idx = [];
  for (let i = 0; i <= NX; i++) for (let j = 0; j < NY; j++) { const k = i * NY + j; uv[k * 2] = i / NX; uv[k * 2 + 1] = j / (NY - 1); }
  for (let i = 0; i < NX; i++) for (let j = 0; j < NY - 1; j++) { const a = i * NY + j, b = (i + 1) * NY + j; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  geo.setIndex(idx); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  const env = envMap();
  const front = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.38, metalness: 0.05, envMap: env, envMapIntensity: 0.35, side: THREE.FrontSide });
  const back = new THREE.MeshStandardMaterial({ color: 0x141a40, roughness: 0.45, metalness: 0.05, envMap: env, envMapIntensity: 0.3, side: THREE.BackSide });
  const group = new THREE.Group();
  const m1 = new THREE.Mesh(geo, front), m2 = new THREE.Mesh(geo, back);
  group.add(m1, m2);
  // tails (V-notched), behind both ends
  const tailShape = new THREE.Shape();
  tailShape.moveTo(0, -RH / 2); tailShape.lineTo(-2.0, -RH / 2); tailShape.lineTo(-1.45, 0); tailShape.lineTo(-2.0, RH / 2); tailShape.lineTo(0, RH / 2); tailShape.closePath();
  const tailGeo = new THREE.ShapeGeometry(tailShape);
  const tailMat = new THREE.MeshStandardMaterial({ color: 0x1d2656, roughness: 0.5, side: THREE.DoubleSide, envMap: env, envMapIntensity: 0.25 });
  const foldMat = new THREE.MeshStandardMaterial({ color: 0x0c1030, roughness: 0.6, side: THREE.DoubleSide });
  const mkTail = (dir) => {
    const p = new THREE.Group(); const tl = new THREE.Mesh(tailGeo, tailMat); tl.position.set(0, 0, 0); if (dir > 0) tl.scale.x = -1; p.add(tl);
    const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, RH / 2, 0, 0, -RH / 2, 0, -dir * -0.0, -RH / 2 - 0.0, 0]), 3));
    const fold = new THREE.Mesh(new THREE.PlaneGeometry(0.55, RH), foldMat); fold.position.set(dir * 0.27, 0, 0.01); p.add(fold);
    group.add(p); return p;
  };
  const tailL = mkTail(-1), tailR = mkTail(1);
  scene.add(group);
  scene.add(new THREE.AmbientLight(0xfff0dd, 0.55));
  const key = new THREE.DirectionalLight(0xffe2b8, 1.25); key.position.set(-4, 6, 10); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffc070, 1.6); rim.position.set(2, -3, -8); scene.add(rim);
  const fill = new THREE.DirectionalLight(0xffd0a0, 0.5); fill.position.set(6, 2, 6); scene.add(fill);
  R3 = { scene, cam, geo, pos, group, tailL, tailR, T };
  return R3;
}

/** unrolled length (word-synced, overshooting) */
function unrolled(t, T) {
  const [eThe, eSkill, eIs] = T.ends;
  const Rof = (u) => Math.sqrt(RMIN * RMIN + Math.max(0, L - u) * TH / Math.PI);
  const reveal = (e) => { let u = e + 0.12; for (let k = 0; k < 3; k++) u = e + 0.12 + Rof(u); return u; };
  const keys = [[T0 - 0.01, T.start - 0.35, 0], [W_THE + 0.06, reveal(eThe), 0.38], [W_SKILL, reveal(eSkill), 0.3], [W_IS, reveal(eIs), 0.2], [W_FREE, L, 0.24]];
  let U = keys[0][1];
  for (let i = 1; i < keys.length; i++) { const [tk, v, d] = keys[i]; if (t >= tk) U = lerp(keys[i - 1][1], v, ease.outBack(seg(t, tk, tk + d), 1.4)); }
  // breathing between words
  U += Math.sin(t * 5.2) * 0.03 * (U < L - 0.1 ? 1 : 0);
  return clamp(U, 0.3, L);
}

function updateRibbon(t, lt, U) {
  const { pos, geo } = R3;
  const R = Math.sqrt(RMIN * RMIN + Math.max(0, L - U) * TH / Math.PI);
  const b = TH / (TAU);
  const x0 = -L / 2, xc = x0 + U;
  for (let i = 0; i <= NX; i++) {
    const u = (i / NX) * L;
    let x, z;
    if (u <= U) { x = x0 + u; z = 0; }
    else {
      const s = u - U;
      const disc = Math.max(0, R * R - 2 * b * s);
      const phi = (R - Math.sqrt(disc)) / b;
      const r = Math.max(0.02, R - b * phi);
      x = xc + r * Math.sin(phi); z = R - r * Math.cos(phi);
    }
    // gentle travelling waves (zero at the fixed left end)
    const xn = (x - x0) / L, env = Math.sin(Math.PI * clamp(xn)) ;
    const wy = env * (0.22 * Math.sin(x * 0.55 - lt * 2.6) + 0.08 * Math.sin(x * 1.3 + lt * 3.1));
    const wz = env * 0.55 * Math.sin(x * 0.42 - lt * 2.2 + 1.0);
    const arch = 0.55 * (1 - (x / (L / 2)) ** 2);
    for (let j = 0; j < NY; j++) {
      const k = (i * NY + j) * 3, yy = (j / (NY - 1) - 0.5) * RH;
      // slight twist along the ribbon
      const tw = env * 0.12 * Math.sin(x * 0.35 - lt * 1.7);
      pos[k] = x; pos[k + 1] = yy * Math.cos(tw) + wy + arch; pos[k + 2] = z + wz + yy * Math.sin(tw);
    }
  }
  geo.attributes.position.needsUpdate = true;
  geo.computeVertexNormals();
  return { R, xc };
}

// ---------- background ----------
function hill(ctx, t, y0, amp, col, seed, ph) {
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-50, H + 50);
  for (let x = -50; x <= W + 50; x += 30) {
    const y = y0 - amp * Math.exp(-(((x - 960) / 520) ** 2)) + Math.sin(x * 0.004 + seed) * 22 + Math.sin(x * 0.011 + seed * 2) * 9;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(W + 50, H + 50); ctx.closePath(); ctx.fill();
}

function bird(ctx, x, y, s, flap) {
  ctx.beginPath(); ctx.moveTo(x - 22 * s, y - 10 * s * flap); ctx.quadraticCurveTo(x - 8 * s, y - 2 * s, x, y + 3 * s);
  ctx.quadraticCurveTo(x + 8 * s, y - 2 * s, x + 22 * s, y - 10 * s * flap); ctx.lineWidth = 4.5 * s; ctx.strokeStyle = '#5A2E3E'; ctx.lineCap = 'round'; ctx.stroke();
}

export default {
  ...S,
  cutIn: 'punch',
  async init() { if (!R3) build(); renderer().compile(R3.scene, R3.cam); },
  sfx: [{ t: 145.56, type: 'swoosh', gain: 0.8 }, { t: 147.68, type: 'paper', gain: 0.7 }, { t: 149.64, type: 'paper', gain: 0.5 }, { t: 149.94, type: 'ding', gain: 1 }],
  draw(ctx, t, s, E) {
    if (!R3) build();
    const lt = t - T0;
    const bt = A.beat(t), hit = A.pulse('beat', t, 0.18);
    const free = t >= W_FREE ? t - W_FREE : -1;

    // camera drift (slow push + float)
    const push = lerp(1.0, 1.035, inOutSine(s.u)) + (free >= 0 ? 0.04 * Math.exp(-free * 5) : 0);
    ctx.save();
    ctx.translate(W / 2, H / 2); ctx.scale(push, push); ctx.translate(-W / 2 + Math.sin(lt * 0.7) * 10, -H / 2 + Math.cos(lt * 0.6) * 6);

    // ---- golden sky ----
    const SX = 960, SY = 760 - lt * 18;
    const sky = ctx.createLinearGradient(0, -60, 0, H);
    sky.addColorStop(0, '#FF9E5E'); sky.addColorStop(0.42, '#FFB45E'); sky.addColorStop(0.75, '#FFD23F'); sky.addColorStop(1, '#FFE89A');
    ctx.fillStyle = sky; ctx.fillRect(-100, -100, W + 200, H + 200);
    const halo = ctx.createRadialGradient(SX, SY, 120, SX, SY, 1100);
    halo.addColorStop(0, 'rgba(255,251,235,0.95)'); halo.addColorStop(0.25, 'rgba(255,236,170,0.55)'); halo.addColorStop(1, 'rgba(255,200,120,0)');
    ctx.fillStyle = halo; ctx.fillRect(-100, -100, W + 200, H + 200);
    // soft clouds drifting
    for (let i = 0; i < 7; i++) {
      const cy = 120 + hash(i, 4) * 420, cx = ((hash(i, 5) * 2400 + lt * (30 + 40 * hash(i, 6))) % 2600) - 340;
      ctx.fillStyle = `rgba(255,244,220,${0.28 + 0.2 * hash(i, 7)})`;
      for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.ellipse(cx + k * 70 - 140, cy + Math.sin(k * 1.7) * 14, 90 + 30 * Math.sin(k + i), 30 + 8 * Math.cos(k * 2 + i), 0, 0, TAU); ctx.fill(); }
    }
    // long rays sweeping
    softRays(ctx, 'O02a', SX, SY, { n: 16, rot: lt * 0.12 + 0.3, len: 2400, width: 0.07, col: [255, 252, 235], alpha: 0.55 + 0.25 * hit, seed: 4, blur: 4 });
    softRays(ctx, 'O02b', SX, SY, { n: 7, rot: -lt * 0.22, len: 2600, width: 0.16, col: [255, 236, 190], alpha: 0.35, seed: 9, blur: 10 });
    // sun disc
    const sr = 230 * (1 + 0.02 * hit);
    const sd = ctx.createRadialGradient(SX, SY, 0, SX, SY, sr);
    sd.addColorStop(0, '#FFFFFF'); sd.addColorStop(0.7, '#FFF8E0'); sd.addColorStop(0.97, '#FFE9A0'); sd.addColorStop(1, 'rgba(255,230,150,0)');
    ctx.fillStyle = sd; ctx.beginPath(); ctx.arc(SX, SY, sr, 0, TAU); ctx.fill();
    // birds
    for (let i = 0; i < 5; i++) {
      const bx = -200 + ((lt * (150 + i * 12) + i * 90) % 2400), by = 250 + i * 34 + Math.sin(lt * 1.3 + i) * 12 + (i % 2) * 20;
      bird(ctx, bx, by, 0.9 - i * 0.08, Math.sin(lt * 11 + i * 1.3));
    }
    // hills (back-lit)
    hill(ctx, t, 930, 40, '#E9875A', 1.3, 0);
    hill(ctx, t, 985, 95, '#C05A4A', 2.1, 0);
    // rim of the front hill
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.3; hill(ctx, t, 983, 95, 'rgba(255,220,150,1)', 2.1, 0); ctx.restore();
    hill(ctx, t, 990, 95, '#8E3F48', 2.1, 0);

    // ---- CURSOR (golden back-light) ----
    const MX = 960, MY = 948;
    const U = unrolled(t, R3.T);
    const rollScreenX = 960 + (U - L / 2) * 74;
    let poseName = 'bounce', eyes = 'normal', mouth = 'auto', look = [clamp((rollScreenX - MX) / 700, -1, 1), -0.9];
    if (t >= W_SKILL && t < W_SKILL + 0.75) poseName = 'cheer';
    if (free >= 0) { poseName = 'point'; eyes = 'wink'; mouth = 'grin'; look = [0, 0]; }
    const squash = free >= 0 ? -0.12 * Math.exp(-free * 6) * Math.cos(free * 30) : 0;
    const mo = { x: MX, y: MY, s: 1.16, t, pose: poseName, eyes, mouth, look, squash };
    glowPass(ctx, 'O02-rim', (x) => drawMascot(x, { ...mo, style: 'silhouette', colors: { ink: '#FFF2C0' }, glyph: false }), { blur: 7, alpha: 0.95, comp: 'lighter' });
    const an = drawMascot(ctx, { ...mo, sticker: false });
    // shadow-side warm grade on the body
    if (free >= 0) {
      // wink sparkle
      const k = ease.outBack(clamp(free / 0.18)), fade = 1 - seg(free, 0.3, 0.46);
      const [ex, ey] = an.eyes[1];
      ctx.save(); ctx.translate(ex + 60, ey - 50); ctx.rotate(free * 3); ctx.scale(k * fade, k * fade);
      ctx.fillStyle = '#FFFFFF'; ctx.beginPath();
      for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, r = i % 2 ? 10 : 46; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
      ctx.closePath(); ctx.fill(); ctx.restore();
    }

    // ---- 3D ribbon ----
    const rb = updateRibbon(t, lt, U);
    const drop = ease.outExpo(seg(t, T0, T0 + 0.45));
    const G3 = R3.group;
    G3.position.set(lerp(-9, 0, drop), 4.15 + lerp(4, 0, drop) + Math.sin(lt * 1.6) * 0.06 + hit * 0.04, 0);
    G3.rotation.set(0.12 + Math.sin(lt * 0.9) * 0.03, lerp(-0.42, -0.1, inOutSine(seg(t, T0, W_FREE))) + (free >= 0 ? 0.1 * (1 - Math.exp(-free * 4)) : 0), lerp(0.25, 0, drop) + Math.sin(lt * 0.8) * 0.015);
    // tails: left one always, right one flips out on FREE
    R3.tailL.position.set(-L / 2 + 0.05, -0.42, -0.5); R3.tailL.rotation.set(0, 0.55, 0.06);
    const flip = free >= 0 ? ease.outBack(seg(free, 0.06, 0.34), 2.2) : 0;
    R3.tailR.visible = flip > 0.001;
    R3.tailR.position.set(L / 2 - 0.05, -0.42, -0.5); R3.tailR.rotation.set(0, lerp(-2.6, -0.55, flip), -0.06); R3.tailR.scale.setScalar(Math.max(0.001, flip));
    const cam = R3.cam;
    cam.position.set(Math.sin(lt * 0.5) * 0.4, 1.2, 25 - lt * 0.25); cam.lookAt(0, 1.8, 0);
    render3d(ctx, R3.scene, cam);

    // glint sweep across FREE + confetti on "free"
    if (free >= 0) {
      const gl = seg(free, 0.12, 0.5);
      if (gl > 0 && gl < 1) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const gx = lerp(1050, 1640, gl), gy = 300;
        const g = ctx.createLinearGradient(gx - 70, 0, gx + 70, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,240,0.65)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.translate(gx, gy); ctx.rotate(0.35); ctx.fillStyle = g; ctx.fillRect(-70 - gx + gx, -170, 140, 340);
        ctx.restore();
      }
      for (let i = 0; i < 70; i++) {
        const a = hash(i, 31) * TAU, v = 500 + hash(i, 32) * 900, tt = free;
        const px = 1340 + Math.cos(a) * v * tt, py = 330 + Math.sin(a) * v * tt + 900 * tt * tt;
        const sz = 8 + hash(i, 33) * 12;
        ctx.save(); ctx.translate(px, py); ctx.rotate(tt * (6 + hash(i, 34) * 10) + i); ctx.scale(1, Math.cos(tt * 12 + i));
        ctx.fillStyle = ['#FFFBF4', '#FFD23F', '#FF6A1F', '#8FD3FF', '#E8343F'][i % 5]; ctx.globalAlpha = 1 - seg(tt, 0.3, 0.46);
        ctx.fillRect(-sz / 2, -sz * 0.3, sz, sz * 0.6); ctx.restore();
      }
    }

    // bokeh / dust in the golden light
    motes(ctx, t, { n: 40, seed: 21, col: [255, 240, 200], alpha: 0.45, size: [3, 28], speed: 22 });
    ctx.restore();

    // FX
    E.fx.bloom = 0.15 + 0.1 * hit; E.fx.bloomThreshold = 0.9;
    E.fx.vignette = 0.28; E.fx.saturation = 1.08;
    if (free >= 0) { const k = Math.exp(-free * 9); E.fx.flash = [1, 0.95, 0.8, 0.35 * k]; E.fx.zoom += 0.03 * k; E.fx.shake = 6 * k; }
    if (t >= W_SKILL && t < W_SKILL + 0.4) E.fx.zoom += 0.02 * Math.exp(-(t - W_SKILL) * 10);
  },
};
