// F03 — "One prompt, now it's real" · VOXEL ORBIT
// CURSOR is voxelised straight from the real mascot drawing (sampled pixels → ~2.4k rounded cubes, a hollow
// 9-deep body with relief eyes, thin limbs, chunky gloves/shoes) in one InstancedMesh. On the beat he blasts
// apart into a swirling cloud, the camera dives THROUGH the debris, exits the back and orbits round; every cube
// recolours on every beat in a ripple from the core (all 8 world palettes). The cubes slam home exactly on "real".
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, seg, hash, noise2, buf, bctx, rays } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { drawMascot } from '../../core/mascot.js';
import { THREE, render3d, renderer, envMap, RoundedBoxGeometry } from '../../core/three.js';
import { bigType } from './common.js';

const S = shot('F03');
const T_BOOM = 130.29, T_BACK = 131.42, T_REAL = 132.04;
// per-world voxel colourings: background gradient, body, ink, whites
const VOX = [
  { bg: ['#FF3E8A', '#FF7A1A'], body: '#FFE14D', ink: '#2A0B3D', white: '#FFFFFF', fog: '#FF7A1A' },
  { bg: ['#2B2BFF', '#0E0E12'], body: '#FF2A2A', ink: '#0E0E12', white: '#FFFFFF', fog: '#14146e' },
  { bg: ['#FFC300', '#E0A100'], body: '#FF6A1F', ink: '#111111', white: '#FFF4D6', fog: '#E0A100' },
  { bg: ['#B79CFF', '#1A1240'], body: '#3EF0FF', ink: '#1A1240', white: '#FFFFFF', fog: '#2a1d66' },
  { bg: ['#7CFFC4', '#3EF0FF'], body: '#FF3E8A', ink: '#10233A', white: '#FFFFFF', fog: '#3EF0FF' },
  { bg: ['#6EC3F0', '#2E8BE0'], body: '#FFD23F', ink: '#1F2A55', white: '#FFFFFF', fog: '#2E8BE0' },
  { bg: ['#F4EDE0', '#E9DFCC'], body: '#FF6A1F', ink: '#1F2A55', white: '#FFFFFF', fog: '#E9DFCC' },
  { bg: ['#FF8FB1', '#FFB38A'], body: '#C9B6FF', ink: '#3A1F4F', white: '#FFF4EA', fog: '#FFB38A' },
];
// this shot's own beat order: pop → neon (explosion) → net → gold → mint (landing) → sky → sunset
const ORDER = [0, 3, 1, 2, 4, 5, 7, 6];
let B0 = null;
const vox = (bi) => { if (B0 === null) B0 = A.beat(S.start + 0.01).i; const k = bi - B0; return VOX[ORDER[((k % ORDER.length) + ORDER.length) % ORDER.length]]; };
const CLS = { BODY: 0, INK: 1, WHITE: 2, MOUTH: 3, CHEEK: 4, TONGUE: 5 };

// ---------------------------------------------------------------- voxelise the mascot
function voxelise() {
  const cw = 520, ch = 640, step = 10;
  const c = buf('read-F03-vox', cw, ch), x = bctx(c);
  x.clearRect(0, 0, cw, ch);
  const P = { armL: [-150, -175], armR: [150, -175], legL: [-48, 185], legR: [48, 185], squash: 0, rot: 0, bob: 0, look: [0, 0], lean: 0 };
  drawMascot(x, { x: cw / 2, y: 600, s: 1, t: 0.2, P, eyes: 'normal', mouth: 'grin', blink: 0 });
  const d = x.getImageData(0, 0, cw, ch).data;
  const bcx = cw / 2, bcy = 600 - 185, bw = 170, bh = 230;
  const cols = cw / step, rows = ch / step, feetRow = Math.floor(600 / step);
  const cls = (i) => {
    const r = d[i], g = d[i + 1], b = d[i + 2];
    const lum = 0.3 * r + 0.59 * g + 0.11 * b;
    if (r > 225 && g > 225 && b > 225) return CLS.WHITE;
    if (lum < 75 && b > r - 10) return CLS.INK;
    if (r > 90 && g < 50 && b < 70 && r < 170) return CLS.MOUTH;
    if (r > 230 && g > 100 && b > 120) return CLS.TONGUE;
    if (r > 200 && b > 80 && g < 110) return CLS.CHEEK;
    return CLS.BODY;
  };
  const out = [];
  const inBody = (px, py) => Math.abs(px - bcx) < bw / 2 + 2 && Math.abs(py - bcy) < bh / 2 + 2;
  const solid = (cx, cy) => { if (cx < 0 || cy < 0 || cx >= cols || cy >= rows) return false; const px = cx * step + step / 2, py = cy * step + step / 2; return d[(py * cw + px) * 4 + 3] > 128; };
  const D = 4;
  for (let cy = 0; cy < rows; cy++) for (let cx = 0; cx < cols; cx++) {
    const px = cx * step + step / 2, py = cy * step + step / 2, i = (py * cw + px) * 4;
    if (d[i + 3] < 128) continue;
    const k = cls(i), X = cx - cols / 2 + 0.5, Y = feetRow - cy;
    if (inBody(px, py)) {
      const edge = !inBody(px - step, py) || !inBody(px + step, py) || !inBody(px, py - step) || !inBody(px, py + step);
      if (edge) { for (let z = -D; z <= D; z++) out.push([X, Y, z, k]); }
      else {
        out.push([X, Y, D, k]); out.push([X, Y, -D, CLS.BODY]);
        if (k === CLS.WHITE || k === CLS.INK) out.push([X, Y, D + 1, k]);
      }
    } else {
      const fat = k === CLS.WHITE ? 2 : (solid(cx, cy - 1) && solid(cx, cy + 1) && solid(cx - 1, cy) && solid(cx + 1, cy)) ? 2 : 1;
      for (let z = -fat; z <= fat; z++) out.push([X, Y, z, k]);
    }
  }
  return out;
}

let R3 = null;
function build() {
  const V = voxelise();
  const n = V.length;
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(50, W / H, 0.4, 900);
  scene.fog = new THREE.Fog(0xffffff, 120, 420);
  const geo = new RoundedBoxGeometry(0.93, 0.93, 0.93, 2, 0.14);
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.32, metalness: 0.08, envMap: envMap(), envMapIntensity: 0.75 });
  const mesh = new THREE.InstancedMesh(geo, mat, n);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); mesh.castShadow = true; mesh.frustumCulled = false;
  const col = new THREE.Color(); for (let i = 0; i < n; i++) mesh.setColorAt(i, col.set('#ffffff'));
  scene.add(mesh);
  // dust cubes far out for parallax
  const DN = 260, dust = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ roughness: 0.4, envMap: envMap(), envMapIntensity: 0.6 }), DN);
  dust.frustumCulled = false; for (let i = 0; i < DN; i++) dust.setColorAt(i, col.set('#ffffff'));
  scene.add(dust);
  // floor
  const gc = buf('F03-grid', 512, 512), gx = bctx(gc);
  gx.fillStyle = '#ffffff'; gx.fillRect(0, 0, 512, 512); gx.fillStyle = 'rgba(0,0,0,0.22)'; gx.fillRect(0, 0, 512, 6); gx.fillRect(0, 0, 6, 512);
  const gtex = new THREE.CanvasTexture(gc); gtex.wrapS = gtex.wrapT = THREE.RepeatWrapping; gtex.repeat.set(60, 60); gtex.anisotropy = 8; gtex.colorSpace = THREE.SRGBColorSpace;
  const floor = new THREE.Mesh(new THREE.CircleGeometry(600, 64), new THREE.MeshStandardMaterial({ map: gtex, roughness: 0.55, metalness: 0.0 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -0.48; floor.receiveShadow = true; scene.add(floor);
  // shockwave ring
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 96), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, side: THREE.DoubleSide, fog: false }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = -0.4; scene.add(ring);
  // lights
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8888aa, 1.4));
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(40, 90, 60); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -90, right: 90, top: 90, bottom: -90, near: 10, far: 300 }); key.shadow.bias = -0.0008;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 1.2); rim.position.set(-60, 30, -80); scene.add(rim);
  // per-voxel motion data
  const cx = 0, cy = 22;
  const data = V.map(([X, Y, Z, k], i) => {
    const dx = X - cx + (hash(i, 1) - 0.5) * 10, dy = Y - cy + (hash(i, 2) - 0.5) * 10 + 6, dz = Z * 3 + (hash(i, 3) - 0.5) * 22;
    const L = Math.hypot(dx, dy, dz) || 1, sp = 12 + 40 * hash(i, 4) ** 0.8;
    const ax = new THREE.Vector3(hash(i, 5) - 0.5, hash(i, 6) - 0.5, hash(i, 7) - 0.5).normalize();
    return { X, Y, Z, k, ox: dx / L * sp, oy: dy / L * sp * 0.8, oz: dz / L * sp, ax, spin: (2 + 6 * hash(i, 8)) * (hash(i, 9) < 0.5 ? -1 : 1), dist: Math.hypot(X - cx, Y - cy, Z), back: hash(i, 10) };
  });
  R3 = { scene, cam, mesh, dust, floor, ring, data, n, col, m4: new THREE.Matrix4(), q: new THREE.Quaternion(), p: new THREE.Vector3(), sc: new THREE.Vector3(), up: new THREE.Vector3(0, 1, 0) };
}

// explosion amount for a voxel
function boom(t, d) {
  if (t < T_BOOM) return 0;
  const out = ease.outExpo(seg(t, T_BOOM, T_BOOM + 0.55)) + 0.18 * Math.max(0, t - T_BOOM - 0.3) + 0.12 * A.pulse('down', t, 0.2) * (t > 130.8 ? 1 : 0);
  const tb = T_BACK + d.back * 0.16;
  if (t < tb) return out;
  const eb = ease.outExpo(seg(tb, T_BOOM, T_BOOM + 0.55)) + 0.18 * Math.max(0, tb - T_BOOM - 0.3);
  return eb * (1 - ease.inCubic(seg(t, tb, T_REAL)));
}

// camera path: approach → dive through the debris → exit the back → orbit round to the hero 3/4 view
const CAMK = [
  [129.96, [5, 24, 66], [0, 22, 0]],
  [130.29, [10, 22, 44], [0, 22, 0]],
  [130.62, [6, 23, 15], [0, 22, -30]],
  [130.92, [-3, 22, -12], [-12, 21, -60]],
  [131.22, [-30, 25, -40], [0, 22, 0]],
  [131.55, [-58, 30, -4], [0, 22, 0]],
  [131.85, [-54, 27, 32], [-4, 22, 0]],
  [132.04, [-30, 23, 52], [-12, 21, -6]],
  [132.34, [-25, 21, 47], [-12, 20, -6]],
];
function catmull(p0, p1, p2, p3, u) {
  const u2 = u * u, u3 = u2 * u;
  return p1.map((_, i) => 0.5 * (2 * p1[i] + (-p0[i] + p2[i]) * u + (2 * p0[i] - 5 * p1[i] + 4 * p2[i] - p3[i]) * u2 + (-p0[i] + 3 * p1[i] - 3 * p2[i] + p3[i]) * u3));
}
function camAt(t) {
  let i = 0; while (i < CAMK.length - 2 && t > CAMK[i + 1][0]) i++;
  const a = CAMK[Math.max(0, i - 1)], b = CAMK[i], c = CAMK[i + 1], d = CAMK[Math.min(CAMK.length - 1, i + 2)];
  const u = clamp((t - b[0]) / (c[0] - b[0]));
  return { p: catmull(a[1], b[1], c[1], d[1], u), l: catmull(a[2], b[2], c[2], d[2], u) };
}

export default {
  ...S,
  cutIn: 'glitch',
  sfx: [{ t: T_BOOM, type: 'boom', gain: 1 }, { t: 130.7, type: 'whoosh' }, { t: T_REAL, type: 'impact', gain: 1 }],
  init() { build(); renderer().compile(R3.scene, R3.cam); },
  draw(ctx, t, s, E) {
    if (!R3) build();
    const { scene, cam, mesh, dust, floor, ring, data, n, col, m4, q, p, sc } = R3;
    const bi = A.beat(t).i, P = vox(bi);
    // ---- background
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, P.bg[0]); g.addColorStop(1, P.bg[1]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalAlpha = 0.16; rays(ctx, W / 2, H * 0.42, 28, 1800, t * 0.3, '#ffffff', 'rgba(0,0,0,0)'); ctx.restore();
    scene.fog.color.set(P.fog);
    floor.material.color.set(P.fog).lerp(new THREE.Color('#ffffff'), 0.25);
    // ---- voxels
    const swirl = t > T_BOOM ? 0.9 * Math.sin(Math.min(t - T_BOOM, T_REAL - T_BOOM) / (T_REAL - T_BOOM) * Math.PI) * (t - T_BOOM) : 0;
    const cs = Math.cos(swirl), sn = Math.sin(swirl);
    const land = t >= T_REAL ? Math.exp(-(t - T_REAL) / 0.09) : 0;
    const bounce = t < T_BOOM ? A.pulse('beat', t, 0.12) * 0.08 : 0;
    for (let i = 0; i < n; i++) {
      const d = data[i], e = boom(t, d);
      let ox = d.ox * e, oz = d.oz * e; const oy = d.oy * e;
      const rx = ox * cs - oz * sn, rz = ox * sn + oz * cs; ox = rx; oz = rz;
      const sq = 1 + bounce - land * 0.25;
      const chg = t < T_BOOM ? ease.inQuad(seg(t, 130.02, T_BOOM)) * 0.45 : 0; // charge-up tremor before the blast
      const jx = chg ? (hash(i, Math.round(t * 30), 1) - 0.5) * chg : 0, jy = chg ? (hash(i, Math.round(t * 30), 2) - 0.5) * chg : 0;
      p.set(d.X * (1 + bounce * 0.5 + land * 0.18 + chg * 0.12) + ox + jx, d.Y * sq + oy + Math.max(0, e) * 6 + jy, d.Z * (1 + land * 0.18 + chg * 0.3) + oz);
      q.setFromAxisAngle(d.ax, d.spin * e * 1.4);
      const k = 1 + (0.6 + 1.2 * hash(i, 12)) * clamp(e) + 0.35 * clamp(e) * A.pulse('beat', t, 0.1);
      sc.set(k, k, k); m4.compose(p, q, sc); mesh.setMatrixAt(i, m4);
      // ripple recolour from the core on every beat
      const pb = vox(A.beat(t - d.dist * 0.0045).i);
      const hex = d.k === CLS.BODY ? pb.body : d.k === CLS.INK ? pb.ink : d.k === CLS.WHITE ? pb.white : d.k === CLS.MOUTH ? '#7A1020' : d.k === CLS.TONGUE ? '#FF7A90' : '#FF4F7B';
      mesh.setColorAt(i, col.set(hex));
    }
    mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true;
    for (let i = 0; i < dust.count; i++) {
      const a = hash(i, 1) * TAU + t * (0.15 + 0.2 * hash(i, 2)), r = 70 + hash(i, 3) * 160;
      p.set(Math.cos(a) * r, -10 + hash(i, 4) * 120 + Math.sin(t * 2 + i) * 3, Math.sin(a) * r);
      q.setFromAxisAngle(R3.up, t * 2 + i); const k = 1 + hash(i, 5) * 2.5; sc.set(k, k, k);
      m4.compose(p, q, sc); dust.setMatrixAt(i, m4);
      const pb = vox(bi + (i % 3)); dust.setColorAt(i, col.set(i % 2 ? pb.body : pb.white));
    }
    dust.instanceMatrix.needsUpdate = true; dust.instanceColor.needsUpdate = true;
    // shockwave on landing
    const rl = t - T_REAL;
    if (rl >= 0) { const r = 4 + rl * 160; ring.scale.set(r, r, r); ring.material.opacity = 0.9 * Math.exp(-rl / 0.2); } else ring.material.opacity = 0;
    // ---- camera
    const C = camAt(t);
    const shake = t >= T_BOOM && t < T_BOOM + 0.3 ? (1 - (t - T_BOOM) / 0.3) * 1.5 : 0;
    cam.position.set(C.p[0] + noise2(t * 9, 1) * shake, C.p[1] + noise2(t * 9, 2) * shake, C.p[2]);
    const roll = 0.18 * Math.sin(seg(t, 130.4, 131.6) * Math.PI);
    cam.up.set(Math.sin(roll), Math.cos(roll), 0);
    cam.lookAt(C.l[0], C.l[1], C.l[2]);
    cam.fov = 50 + 22 * Math.sin(seg(t, 130.35, 131.3) * Math.PI) - 4 * A.pulse('beat', t, 0.1); cam.updateProjectionMatrix();
    render3d(ctx, scene, cam, { toneMapping: THREE.NoToneMapping });

    // ---- type
    const ink = P.ink, fill = P.white === '#FFFFFF' ? '#FFFFFF' : P.white;
    const tp = (str, t0, t1, x, y, size, o = {}) => {
      if (t < t0 || t > t1) return;
      const u = ease.outBack(seg(t, t0, t0 + 0.18)), out = seg(t, t1 - 0.08, t1);
      ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot || 0); ctx.scale(u * (1 + out * 0.3), u * (1 - out));
      bigType(ctx, str, 0, 0, { size, fill: o.fill || fill, stroke: ink, sw: size * 0.06, shadow: o.shadow || P.body, sx: size * 0.04, sy: size * 0.045, maxW: o.maxW || 1700, family: o.family || 'Anton' });
      ctx.restore();
    };
    tp('ONE', 129.96, 130.6, W * 0.22, H * 0.46, 380, { rot: -0.08 });
    tp('PROMPT', 130.68, 131.12, W / 2, H * 0.5, 360, { rot: 0.04 });
    tp("NOW IT'S", 131.14, 132.02, W / 2, 210, 130, { family: 'Rubik Mono One' });
    if (t >= T_REAL) {
      const u = ease.outBack(seg(t, T_REAL, T_REAL + 0.16), 2.2);
      ctx.save(); ctx.translate(W * 0.3, H * 0.47); ctx.rotate(-0.06); ctx.scale(u, u);
      bigType(ctx, 'REAL', 0, 0, { size: 400, fill: P.body, stroke: P.ink, sw: 26, shadow: P.ink, sx: 16, sy: 18 });
      ctx.restore();
    }
    // ---- hits
    const db = t - T_BOOM;
    if (db >= 0 && db < 0.3) { const k = 1 - db / 0.3; E.fx.flash = [1, 1, 1, 0.3 * k * k]; E.fx.rgb += 10 * k; E.fx.radialBlur = 0.8 * k; }
    if (rl >= 0 && rl < 0.3) { const k = 1 - rl / 0.3; E.fx.flash = [1, 1, 1, 0.3 * k * k]; E.fx.shake = 16 * k * k; E.fx.zoom += 0.05 * k * k; E.fx.rgb += 8 * k; }
    const fly = Math.sin(seg(t, 130.4, 131.3) * Math.PI);
    if (fly > 0) { E.fx.radialBlur = Math.max(E.fx.radialBlur, 0.35 * fly); E.fx.rgb += 3 * fly; }
    E.fx.bloom = 0.25; E.fx.bloomThreshold = 0.85;
  },
};
