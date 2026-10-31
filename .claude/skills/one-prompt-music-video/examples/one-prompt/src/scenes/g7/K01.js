// K01 · "One prompt, and it moves" — an isometric voxel city builds itself on the beat (Three.js instancing);
// the central tower rises in beat-steps carrying a voxel CURSOR that dances (stop-motion pose swaps) on the roof.
// On "moves" the whole city jelly-bounces, the camera whips 45° and MOVES slams in.
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, seg, hash, wobble } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { mascotSprite } from '../../core/mascot.js';
import { THREE, render3d, RoundedBoxGeometry, envMap } from '../../core/three.js';
import { K, neonBG, chromeText, warm3d } from './lib7.js';

const S = shot('K01');
const T0 = S.start;
const W_ONE = 86.86, W_PROMPT = 87.42, W_IT = 88.10, W_MOVES = 88.44;
const STEPS = [[86.91, 2], [87.05, 4], [87.42, 7], [87.68, 9], [88.10, 11], [88.28, 14]]; // tower floors on beats/words

let B = null;
function build() {
  const scene = new THREE.Scene();
  const root = new THREE.Group(); scene.add(root);
  const cam = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 400);
  scene.add(new THREE.HemisphereLight('#FFFFFF', '#7A5CE6', 0.95));
  const sun = new THREE.DirectionalLight('#FFF8F0', 1.7); sun.position.set(-18, 34, 22); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); const sc = sun.shadow.camera; sc.left = -24; sc.right = 24; sc.top = 24; sc.bottom = -24; sc.near = 1; sc.far = 120; sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.02;
  scene.add(sun); scene.add(sun.target);
  const fill = new THREE.DirectionalLight('#3EF0FF', 0.7); fill.position.set(20, 10, -10); scene.add(fill);

  // ---- slab (floating island) ----
  const N = 25, HALF = 12;
  const slabSide = new THREE.MeshStandardMaterial({ color: '#7E62E8', roughness: 0.6 });
  const gc = document.createElement('canvas'); gc.width = gc.height = 1024; const gx = gc.getContext('2d');
  gx.fillStyle = '#F4F0FF'; gx.fillRect(0, 0, 1024, 1024); gx.strokeStyle = 'rgba(122,92,230,0.28)'; gx.lineWidth = 3;
  for (let i = 0; i <= 25; i++) { const u = 10 + i * (1004 / 25); gx.beginPath(); gx.moveTo(u, 0); gx.lineTo(u, 1024); gx.moveTo(0, u); gx.lineTo(1024, u); gx.stroke(); }
  const gtex = new THREE.CanvasTexture(gc); gtex.colorSpace = THREE.SRGBColorSpace; gtex.anisotropy = 8;
  const slabTop = new THREE.MeshStandardMaterial({ color: '#FFFFFF', map: gtex, roughness: 0.7, emissive: '#2a1a60', emissiveIntensity: 0.0 });
  const slab = new THREE.Mesh(new RoundedBoxGeometry(N + 0.6, 3, N + 0.6, 2, 0.25), [slabSide, slabSide, slabTop, slabSide, slabSide, slabSide]);
  slab.position.y = -1.5; slab.receiveShadow = true; root.add(slab);
  const slab2 = new THREE.Mesh(new RoundedBoxGeometry(N - 3, 2.2, N - 3, 2, 0.25), new THREE.MeshStandardMaterial({ color: '#3EF0FF', roughness: 0.4, emissive: '#1AA6C9', emissiveIntensity: 0.25 }));
  slab2.position.y = -3.6; root.add(slab2);

  // ---- voxel list ----
  const vox = [];
  const isRoad = (i) => Math.abs(i) % 6 === 3;
  const PALB = ['#A07FFF', '#29D3F2', '#4FEFB0', '#FF9AE0', '#7A5CFF', '#BFC8E6'];
  const ROOF = { '#A07FFF': '#D9CCFF', '#29D3F2': '#B5F6FF', '#4FEFB0': '#C4FFE6', '#FF9AE0': '#FFD6F3', '#7A5CFF': '#C2B2FF', '#BFC8E6': '#F2F5FF' };
  const WIN = ['#FFFFFF', '#FFF7B8', '#E4FFFA'];
  const road = [];
  for (let x = -HALF; x <= HALF; x++) for (let z = -HALF; z <= HALF; z++) {
    if (!(isRoad(x) || isRoad(z))) continue;
    const d = Math.abs(x) + Math.abs(z);
    road.push({ x, z, t0: 0.02 + d * 0.022, dash: (isRoad(x) && !isRoad(z) && z % 2 === 0) || (isRoad(z) && !isRoad(x) && x % 2 === 0), along: isRoad(x) && !isRoad(z) ? 'z' : 'x' });
  }
  const ranges = [[-12, -10], [-8, -4], [-2, 2], [4, 8], [10, 12]];
  const waveT = [0.0, 0.19, 0.56, 0.82, 1.24];
  let bid = 0;
  const addBuilding = (x0, x1, z0, z1, h, t0, col, kind = 'b') => {
    const b = bid++;
    const per = Math.min(0.045, 0.32 / h);
    for (let y = 0; y < h; y++) for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
      const edge = x === x0 || x === x1 || z === z0 || z === z1;
      if (!edge && y < h - 1) continue; // hollow inside, solid roof
      const corner = (x === x0 || x === x1) && (z === z0 || z === z1);
      const win = edge && !corner && y % 2 === 1 && y < h - 1 && ((x + z) % 2 === 0);
      const c = y === h - 1 ? (ROOF[col] || '#FFFFFF') : win ? WIN[b % 3] : col;
      vox.push({ x, y, z, ax: x, ay: y, az: z, t0: t0 + y * per, dur: 0.16, col: c, win, kind, b, h });
    }
    return b;
  };
  const addTree = (x, z, t0) => {
    const b = bid++;
    const pushv = (dx, dy, dz, c) => vox.push({ x: x + dx, y: dy, z: z + dz, ax: x, ay: 0, az: z, t0, dur: 0.3, col: c, kind: 'tree', b, h: 3 });
    pushv(0, 0, 0, '#6A4FD8');
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (Math.abs(dx) + Math.abs(dz) < 2) pushv(dx, 1, dz, (dx + dz) % 2 ? '#3FE7A2' : '#22CF8A');
    pushv(0, 2, 0, '#8DFFD0');
  };
  ranges.forEach((rx, ix) => ranges.forEach((rz, iz) => {
    const ring = Math.max(Math.abs(ix - 2), Math.abs(iz - 2));
    const hsh = hash(ix * 7 + 3, iz * 13 + 5);
    if (ix === 2 && iz === 2) return; // central tower handled separately
    const wv = waveT[Math.min(4, ring === 1 ? (hsh < 0.5 ? 1 : 2) : (hsh < 0.5 ? 2 : 3))] + hash(ix, iz, 9) * 0.12;
    const narrow = rx[1] - rx[0] < 4 || rz[1] - rz[0] < 4;
    if (narrow) {
      for (let x = rx[0]; x <= rx[1]; x += 2) for (let z = rz[0]; z <= rz[1]; z += 2) {
        const r = hash(x + 40, z + 40, 3);
        if (r < 0.55) addTree(x, z, wv + r * 0.4);
        else if (r < 0.85) addBuilding(x, x, z, z, 1 + Math.floor(r * 4), wv + r * 0.3, PALB[Math.floor(r * 97) % 6]);
      }
      return;
    }
    if (hsh < 0.18) { for (let x = rx[0]; x <= rx[1]; x += 2) for (let z = rz[0]; z <= rz[1]; z += 2) addTree(x, z, wv + hash(x, z, 5) * 0.35); return; }
    const colA = PALB[Math.floor(hsh * 61) % 6], colB = PALB[Math.floor(hsh * 113 + 2) % 6];
    if (hsh < 0.5) addBuilding(rx[0], rx[1], rz[0], rz[1], 3 + Math.floor(hash(ix, iz, 1) * 5), wv, colA);
    else if (hsh < 0.75) { addBuilding(rx[0], rx[1], rz[0], rz[0] + 1, 3 + Math.floor(hash(ix, iz, 2) * 5), wv, colA); addBuilding(rx[0], rx[1], rz[0] + 3, rz[1], 4 + Math.floor(hash(ix, iz, 3) * 4), wv + 0.12, colB); }
    else {
      addBuilding(rx[0], rx[0] + 1, rz[0], rz[0] + 1, 3 + Math.floor(hash(ix, iz, 4) * 5), wv, colA);
      addBuilding(rx[0] + 3, rx[1], rz[0], rz[0] + 1, 2 + Math.floor(hash(ix, iz, 5) * 5), wv + 0.08, colB);
      addBuilding(rx[0], rx[0] + 1, rz[0] + 3, rz[1], 2 + Math.floor(hash(ix, iz, 6) * 4), wv + 0.14, colB);
      addBuilding(rx[0] + 3, rx[1], rz[0] + 3, rz[1], 3 + Math.floor(hash(ix, iz, 7) * 5), wv + 0.2, colA);
    }
  }));
  const TOWER_H = 14, towerVox = [];
  for (let y = 0; y < TOWER_H; y++) for (let x = -2; x <= 2; x++) for (let z = -2; z <= 2; z++) {
    const edge = Math.abs(x) === 2 || Math.abs(z) === 2; if (!edge && y < TOWER_H - 1) continue;
    const stripe = y % 3 === 1;
    const c = y === TOWER_H - 1 ? '#FFFFFF' : stripe ? (edge && (x + z) % 2 === 0 ? '#FFFFFF' : '#29D3F2') : (Math.abs(x) === 2 && Math.abs(z) === 2 ? '#5B3FE0' : '#9C7BFF');
    towerVox.push({ x, y, z, col: c });
  }

  // ---- instanced meshes ----
  const geo = new RoundedBoxGeometry(0.94, 0.94, 0.94, 2, 0.1);
  const mat = new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.55, metalness: 0.0, envMap: envMap(), envMapIntensity: 0.35 });
  const city = new THREE.InstancedMesh(geo, mat, vox.length); city.castShadow = true; city.receiveShadow = true;
  const col = new THREE.Color();
  vox.forEach((v, i) => city.setColorAt(i, col.set(v.col)));
  root.add(city);
  const tower = new THREE.InstancedMesh(geo, mat, towerVox.length); tower.castShadow = true; tower.receiveShadow = true;
  towerVox.forEach((v, i) => tower.setColorAt(i, col.set(v.col)));
  root.add(tower);
  const roadM = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.12, 1), new THREE.MeshStandardMaterial({ color: '#2A1E70', roughness: 0.8 }), road.length); roadM.receiveShadow = true; root.add(roadM);
  const dashes = road.filter((r) => r.dash);
  const dashM = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.14, 0.18), new THREE.MeshBasicMaterial({ color: K.mint }), dashes.length); root.add(dashM);

  // ---- voxel CURSOR: 2 stop-motion dance frames sampled from the 2D mascot ----
  const beats = A.beats.filter((b) => b > T0 - 1 && b < S.end + 1);
  const even = beats.find((b) => A.beat(b + 0.01).i % 2 === 0), odd = beats.find((b) => A.beat(b + 0.01).i % 2 === 1);
  const frames = [even, odd].map((bt, k) => voxelMascot('K01' + k, bt + 0.02, geo));
  frames.forEach((f) => { f.mesh.castShadow = true; root.add(f.mesh); });
  const sparkN = 160, sparks = new THREE.InstancedMesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), new THREE.MeshBasicMaterial({ color: '#FFFFFF' }), sparkN);
  for (let i = 0; i < sparkN; i++) sparks.setColorAt(i, col.set([K.cyan, K.mint, K.lilac, '#FFFFFF'][i % 4]));
  root.add(sparks);
  const floatN = 46, floaters = new THREE.InstancedMesh(new RoundedBoxGeometry(1, 1, 1, 2, 0.12), new THREE.MeshStandardMaterial({ color: '#fff', roughness: 0.2, metalness: 0.6, envMap: envMap(), envMapIntensity: 1.1 }), floatN);
  const fl = [];
  for (let i = 0; i < floatN; i++) {
    const a = hash(i, 71) * TAU, r = 17 + hash(i, 72) * 14;
    fl.push({ x: Math.cos(a) * r, y: -8 + hash(i, 73) * 30, z: Math.sin(a) * r, s: 0.5 + hash(i, 74) * 1.4, sp: 0.5 + hash(i, 75) * 1.5, ph: hash(i, 76) * TAU });
    floaters.setColorAt(i, col.set(['#B79CFF', '#3EF0FF', '#7CFFC4', '#DDE3EE', '#FF9AE0'][i % 5]));
  }
  scene.add(floaters);
  B = { floaters, fl, floatN, scene, root, cam, sun, vox, city, tower, towerVox, roadM, road, dashM, dashes, frames, sparks, sparkN, m4: new THREE.Matrix4(), q: new THREE.Quaternion(), p: new THREE.Vector3(), s: new THREE.Vector3(), e: new THREE.Euler(), up: new THREE.Vector3(0, 1, 0), c: new THREE.Color() };
}

function voxelMascot(key, t, geo) {
  const spr = mascotSprite(key, { t, pose: 'dance', mouth: 'grin', eyes: 'normal', blink: 0, glyph: true }, 520, 600);
  const x = spr.getContext('2d', { willReadFrequently: true });
  const d = x.getImageData(0, 0, spr.width, spr.height).data;
  const step = 11, cols = Math.floor(spr.width / step), rows = Math.floor(spr.height / step);
  const cells = [];
  const isOrange = (r, g, b) => r > 200 && g > 60 && g < 170 && b < 110;
  const at = (i, j) => (((j * step + step / 2) | 0) * spr.width + ((i * step + step / 2) | 0)) * 4;
  const rowSpan = [];
  for (let j = 0; j < rows; j++) {
    let mn = 1e9, mx = -1;
    for (let i = 0; i < cols; i++) { const o = at(i, j); if (d[o + 3] > 128 && isOrange(d[o], d[o + 1], d[o + 2])) { mn = Math.min(mn, i); mx = Math.max(mx, i); } }
    rowSpan.push([mn, mx]);
  }
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const o = at(i, j);
    if (d[o + 3] < 128) continue;
    const inBody = i >= rowSpan[j][0] && i <= rowSpan[j][1];
    const c = `rgb(${d[o]},${d[o + 1]},${d[o + 2]})`;
    const depth = inBody ? 4 : (d[o] > 220 && d[o + 1] > 220 ? 2 : 1);
    for (let k = 0; k < depth; k++) cells.push({ i, j, k: k - (depth - 1) / 2, c: k === depth - 1 ? c : inBody ? '#FF6A1F' : c });
  }
  const mesh = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color: '#fff', roughness: 0.45, envMap: envMap(), envMapIntensity: 0.4 }), cells.length);
  const col = new THREE.Color(), m4 = new THREE.Matrix4();
  const VS = 0.36, fx = cols / 2, fy = rows - 20 / step;
  cells.forEach((c, n) => { m4.makeScale(VS, VS, VS); m4.setPosition((c.i - fx) * VS, (fy - c.j) * VS, c.k * VS); mesh.setMatrixAt(n, m4); mesh.setColorAt(n, col.set(c.c)); });
  return { mesh };
}

function towerFloors(t) {
  let h = 0;
  for (let i = 0; i < STEPS.length; i++) {
    const [ts, fl] = STEPS[i]; if (t < ts) break;
    const prev = i ? STEPS[i - 1][1] : 0;
    h = lerp(prev, fl, ease.outBack(seg(t, ts, ts + 0.16), 2.2));
  }
  return h;
}

export default {
  ...S,
  cutIn: 'flash',
  sfx: [{ t: 86.86, type: 'boom', gain: 0.9 }, { t: 88.28, type: 'stamp' }, { t: 88.44, type: 'whoosh' }],
  async init() { if (!B) build(); await warm3d(B.scene, B.cam); },
  draw(ctx, t, s, E) {
    if (!B) build();
    const lt = s.lt, fx = E.fx;
    const beatP = A.pulse('beat', t, 0.12), kick = A.pulse('kick', t, 0.15);
    const mv = t - W_MOVES;

    // ---------- 2D background + type ----------
    neonBG(ctx, t, { a: '#C8B4FF', b: '#8FF6FF', c: '#F7F3FF', pulse: beatP });
    ctx.save();
    if (mv < 0) {
      const pr = ease.outExpo(seg(t, W_ONE, W_ONE + 0.3)), pr2 = ease.outExpo(seg(t, W_PROMPT, W_PROMPT + 0.3));
      chromeText(ctx, 'ONE', 560, 300 - (1 - pr) * 120, { size: 330, fill: 'chrome', shadow: 16, scale: [1, Math.max(0.001, pr)] });
      if (pr2 > 0) chromeText(ctx, 'PROMPT', 1330, 300 - (1 - pr2) * 120, { size: 330, fill: 'chrome', shadow: 16, scale: [1, Math.max(0.001, pr2)] });
      const a1 = ease.outBack(seg(t, 87.76, 87.95)), a2 = ease.outBack(seg(t, W_IT, W_IT + 0.18));
      if (a1 > 0) chromeText(ctx, 'AND', 300, 600, { size: 120 * a1, fill: K.deep, stroke: '#fff', strokeW: 10, shadow: 0, family: 'Rubik Mono One' });
      if (a2 > 0) chromeText(ctx, 'IT', 1640, 600, { size: 140 * a2, fill: K.deep, stroke: '#fff', strokeW: 10, shadow: 0, family: 'Rubik Mono One' });
    } else {
      const k = ease.outExpo(clamp(mv / 0.18));
      const sx = 1 + (1 - k) * 0.8;
      for (let i = 5; i >= 1; i--) { ctx.globalAlpha = 0.16 * (6 - i) / 5; chromeText(ctx, 'MOVES', W / 2 - i * 70 * (1 - k * 0.6), 290, { size: 420, fill: i % 2 ? K.cyan : K.mint, shadow: 0, strokeW: 0, skew: -0.18 }); }
      ctx.globalAlpha = 1;
      chromeText(ctx, 'MOVES', W / 2, 290, { size: 420, fill: 'chrome', shadow: 22, skew: -0.18 * (1 - k * 0.5), scale: [sx, 1 / sx] });
    }
    ctx.restore();
    ctx.save(); ctx.fillStyle = 'rgba(40,20,110,0.16)'; ctx.beginPath(); ctx.ellipse(W / 2, 1010, 760, 60, 0, 0, TAU); ctx.fill(); ctx.restore();

    // ---------- 3D ----------
    const { cam, vox, city, tower, towerVox, m4, q, p, s: sc } = B;
    const whip = ease.outExpo(clamp(mv / 0.3));
    const az = (36 + lt * 9) * Math.PI / 180 + whip * Math.PI / 6;
    const el = (32 - lt * 2) * Math.PI / 180;
    const fl = towerFloors(t);
    const hh = lerp(8.5, 18, ease.inOutCubic(seg(lt, 0.0, 1.55))) * (1 - kick * 0.02);
    const aspect = W / H;
    cam.left = -hh * aspect; cam.right = hh * aspect; cam.top = hh * 1.22; cam.bottom = -hh * 0.78; cam.updateProjectionMatrix();
    const ty = lerp(1.0, 5.0, ease.inOutCubic(seg(lt, 0.2, 1.6)));
    cam.position.set(Math.sin(az) * Math.cos(el) * 100, ty + Math.sin(el) * 100, Math.cos(az) * Math.cos(el) * 100);
    cam.lookAt(0, ty, 0);

    const slabK = ease.outBack(seg(lt, 0, 0.22));
    const bounceBeat = beatP * 0.05;
    for (let i = 0; i < vox.length; i++) {
      const v = vox[i];
      const u = (lt - v.t0) / v.dur;
      const k = u <= 0 ? 0 : v.kind === 'tree' ? ease.outBack(u, 2.6) : ease.outBack(u, 1.8);
      if (k <= 0.001) { m4.makeScale(0, 0, 0); city.setMatrixAt(i, m4); continue; }
      const drop = v.kind === 'tree' ? 0 : (1 - ease.outCubic(u)) * 2.2;
      const ph = Math.hypot(v.ax, v.az) * 0.025;
      const jj = mv > 0 ? wobble(Math.max(0, mv - ph), 4.2, 4.5) * 0.2 : 0;
      const yScale = 1 + jj + bounceBeat * (v.b % 2 ? 1 : -0.6);
      let x = v.x, y = v.y + 0.5, z = v.z;
      if (v.kind === 'tree') { x = v.ax + (v.x - v.ax) * k; y = (v.y + 0.5) * k; z = v.az + (v.z - v.az) * k; }
      y = y * yScale + drop;
      const sx = 1 - jj * 0.25;
      p.set(x, y, z); sc.set(k * sx, k * yScale, k * sx);
      m4.compose(p, q.identity(), sc); city.setMatrixAt(i, m4);
    }
    city.instanceMatrix.needsUpdate = true;
    // window lights chase
    const ccol = B.c, fr8 = Math.floor(t * 8);
    for (let i = 0; i < vox.length; i++) { const v = vox[i]; if (!v.win) continue; const on = hash(v.b, fr8, v.y) < 0.75; city.setColorAt(i, ccol.set(on ? v.col : '#7A5CE0')); }
    city.instanceColor.needsUpdate = true;
    // tower
    const tj = mv > 0 ? wobble(mv, 4.2, 4.5) * 0.15 : 0;
    for (let i = 0; i < towerVox.length; i++) {
      const v = towerVox[i];
      const vis = clamp(fl - v.y);
      if (vis <= 0) { m4.makeScale(0, 0, 0); tower.setMatrixAt(i, m4); continue; }
      const yS = 1 + tj;
      p.set(v.x, (v.y + 0.5) * yS, v.z); sc.set(1 - tj * 0.2, vis * yS, 1 - tj * 0.2);
      m4.compose(p, q.identity(), sc); tower.setMatrixAt(i, m4);
    }
    tower.instanceMatrix.needsUpdate = true;
    for (let i = 0; i < B.road.length; i++) {
      const r = B.road[i], k = ease.outCubic(seg(lt, r.t0, r.t0 + 0.12));
      p.set(r.x, 0.05, r.z); sc.set(k, 1, k); m4.compose(p, q.identity(), sc); B.roadM.setMatrixAt(i, m4);
    }
    B.roadM.instanceMatrix.needsUpdate = true;
    for (let i = 0; i < B.dashes.length; i++) {
      const r = B.dashes[i], k = ease.outCubic(seg(lt, r.t0 + 0.1, r.t0 + 0.25));
      if (r.along === 'z') q.setFromAxisAngle(B.up, Math.PI / 2); else q.identity();
      p.set(r.x, 0.13, r.z); sc.set(k * 0.6, 1, 1); m4.compose(p, q, sc); B.dashM.setMatrixAt(i, m4);
    }
    B.dashM.instanceMatrix.needsUpdate = true;
    // voxel cursor
    const roofY = fl * (1 + tj);
    const bt = A.beat(t), fr = ((bt.i % 2) + 2) % 2, ph = bt.phase;
    const hop = mv > 0 ? Math.sin(clamp(mv / 0.34) * Math.PI) * 3.2 : Math.abs(Math.sin(ph * Math.PI)) * 0.5;
    const sq = Math.exp(-ph * 6) * 0.14;
    const appear = ease.outBack(seg(lt, 0.08, 0.3));
    B.frames.forEach((f, k) => {
      f.mesh.visible = k === fr;
      f.mesh.position.set(0, roofY + 0.05 + hop, 0);
      f.mesh.scale.set((1 + sq) * appear + 1e-4, (1 - sq) * appear + 1e-4, appear + 1e-4);
      f.mesh.rotation.set(0, az + Math.sin(lt * 3) * 0.25, (mv > 0 ? Math.sin(clamp(mv / 0.34) * Math.PI) * 0.3 : 0));
    });
    // sparks off each tower step
    let si = 0;
    for (let st = 0; st < STEPS.length; st++) {
      const age = t - STEPS[st][0];
      for (let k = 0; k < 26; k++, si++) {
        if (si >= B.sparkN) break;
        if (age < 0 || age > 0.7) { m4.makeScale(0, 0, 0); B.sparks.setMatrixAt(si, m4); continue; }
        const a = hash(st, k) * TAU, sp = 4 + hash(k, st, 2) * 6, vy = 5 + hash(k, st, 3) * 6;
        const yTop = STEPS[st][1];
        p.set(Math.cos(a) * (sp * age * 1.2 + 2.6), yTop + vy * age - 9 * age * age, Math.sin(a) * (sp * age * 1.2 + 2.6));
        const ss = (1 - age / 0.7) * (0.5 + hash(k, st, 4));
        B.e.set(age * 8 + k, age * 6, 0); q.setFromEuler(B.e); sc.set(ss, ss, ss); m4.compose(p, q, sc); B.sparks.setMatrixAt(si, m4);
      }
    }
    for (; si < B.sparkN; si++) { m4.makeScale(0, 0, 0); B.sparks.setMatrixAt(si, m4); }
    B.sparks.instanceMatrix.needsUpdate = true;

    for (let i = 0; i < B.floatN; i++) {
      const f = B.fl[i], k = ease.outBack(seg(lt, 0.1 + hash(i, 77) * 0.6, 0.4 + hash(i, 77) * 0.6));
      p.set(f.x, f.y + Math.sin(t * f.sp + f.ph) * 1.2 + (mv > 0 ? wobble(mv, 3, 4) * 2 * (i % 2 ? 1 : -1) : 0), f.z);
      B.e.set(t * f.sp + f.ph, t * f.sp * 0.7, 0); q.setFromEuler(B.e); const ss = f.s * k * (1 + beatP * 0.15); sc.set(ss, ss, ss);
      m4.compose(p, q, sc); B.floaters.setMatrixAt(i, m4);
    }
    B.floaters.instanceMatrix.needsUpdate = true;
    B.root.scale.setScalar(Math.max(0.001, slabK));
    render3d(ctx, B.scene, cam);

    // ---------- FX ----------
    fx.bloom = 0.18; fx.bloomThreshold = 0.92;
    if (mv > 0) { const k = Math.exp(-mv / 0.12); fx.shake = 16 * k; fx.rgb = 10 * k; fx.zoom += 0.05 * k; fx.flash = [0.85, 1, 1, 0.5 * Math.exp(-mv / 0.06)]; }
    fx.zoom += kick * 0.015 + beatP * 0.008;
    for (const [ts] of STEPS) { const a = t - ts; if (a >= 0 && a < 0.15) fx.shake = Math.max(fx.shake, 6 * (1 - a / 0.15)); }
  },
};
