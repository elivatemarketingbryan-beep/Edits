// W04 — "I said no, not me" — the sponsorship contract hangs as a VERLET CLOTH (2.5D, 1.9k particles,
// structural + shear + bend constraints, per-cell aerodynamic drag). CURSOR grabs it and rips it in half
// on "no" (seam constraints break, zipper-propagating from the hands), the clips pop on "not", the halves
// shred into flapping strips that fall. Rendered as a lit Three.js mesh with a live index (torn triangles drop).
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, rng, noise2, font, buf, bctx, sim, hash } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { drawMascot } from '../../core/mascot.js';
import { THREE, render3d } from '../../core/three.js';
import { C, slam, grid, hit, kick, speedLines } from './_g5.js';

const S = shot('W04');
const T0 = S.start;
// lyric beats (local time)
const T_RIP = 61.78 - T0;   // "no,"
const T_NOT = 62.02 - T0;   // "not"
const T_ME = 62.28 - T0;    // "me"
const T_CLIP = T_NOT - 0.05;
const T_LET = T_NOT + 0.1;

// ---------- cloth layout (screen px; x right, y down, z toward camera) ----------
const NX = 38, NY = 48, CELL = 20.5;
const PW = NX * CELL, PH = NY * CELL;
const PX0 = W / 2 - PW / 2, PY0 = 112;
const NP = (NX + 1) * (NY + 1);
const id = (i, j) => j * (NX + 1) + i;
const GRAB_ROW = 25;
const CLIPS = [1, 12, 27, 37];
const HAND_L = [15, 16], HAND_R = [23, 24];

// pieces: main jagged vertical seam + horizontal shred seams per half
const seamX = (j) => 19.5 + 1.25 * noise2(j * 0.21, 3.1) + 0.6 * Math.sin(j * 0.9);
const shredL = [(i) => 11 + 2.5 * noise2(i * 0.18, 7.7) + (19 - i) * 0.1, (i) => 34 + 2.2 * noise2(i * 0.2, 1.3) - (19 - i) * 0.2];
const shredR = [(i) => 13 + 2.2 * noise2(i * 0.2, 4.4) - (i - 19) * 0.12, (i) => 36 + 2 * noise2(i * 0.16, 9.9) + (i - 19) * 0.15];
function piece(i, j) {
  const right = i > seamX(j);
  const sh = right ? shredR : shredL;
  let k = 0; for (const f of sh) if (j > f(i)) k++;
  return (right ? 10 : 0) + k;
}

// hand path (screen coords) for the two grips, as a function of local time
function hands(lt) {
  const cy = PY0 + GRAB_ROW * CELL;
  const cxL = PX0 + (HAND_L[0] + 0.5) * CELL, cxR = PX0 + (HAND_R[0] + 0.5) * CELL;
  // anticipation: pinch inward & down (crumple), then RIP outward, then fling up & out
  const ant = ease.inOutQuad(clamp(lt / T_RIP));
  const rip = ease.outExpo(clamp((lt - T_RIP) / 0.2));
  const fl = ease.inOutQuad(clamp((lt - T_CLIP) / 0.3));
  const tug = 22 * (kick(lt, 0.03, 0.07) + kick(lt, 61.64 - T0, 0.07));
  const dx = -28 * ant + 380 * rip + 720 * fl - tug;
  const dy = 26 * ant - 70 * rip - 330 * fl + tug * 0.6;
  const shake = (1 - rip) * ant * Math.sin(lt * 70) * 4;
  return { L: [cxL - dx + shake, cy + dy, 40 + 60 * rip], R: [cxR + dx - shake, cy + dy - 10 * rip, 40 + 60 * rip], cxL, cxR, cy };
}

function initCloth() {
  const pos = new Float32Array(NP * 3), prev = new Float32Array(NP * 3), pc = new Uint8Array(NP);
  for (let j = 0; j <= NY; j++) for (let i = 0; i <= NX; i++) {
    const k = id(i, j);
    pos[k * 3] = PX0 + i * CELL; pos[k * 3 + 1] = PY0 + j * CELL; pos[k * 3 + 2] = 0;
    pc[k] = piece(i, j);
  }
  prev.set(pos);
  // constraints
  const ca = [], cb = [], cr = [], ct = [];
  const add = (a, b) => {
    const dx = pos[a * 3] - pos[b * 3], dy = pos[a * 3 + 1] - pos[b * 3 + 1];
    ca.push(a); cb.push(b); cr.push(Math.hypot(dx, dy));
    // break time: permanent unless the two ends are in different pieces
    let tb = 1e9;
    if (pc[a] !== pc[b]) {
      const ia = a % (NX + 1), ja = Math.floor(a / (NX + 1));
      const crossMain = (pc[a] >= 10) !== (pc[b] >= 10);
      if (crossMain) tb = T_RIP + 0.012 + Math.abs(ja - GRAB_ROW) * 0.0105 + hash(a, b) * 0.02;
      else if (pc[a] % 10 === 0 || pc[b] % 10 === 0) tb = T_ME - 0.06 + (pc[a] >= 10 ? (NX - ia) : ia) * 0.005 + hash(a, b, 5) * 0.03; // top strip tears off mid-air
      else tb = T_NOT + 0.02 + (pc[a] >= 10 ? (NX - ia) : ia) * 0.006 + hash(a, b, 3) * 0.03;
    }
    ct.push(tb);
  };
  const edge = new Map();
  const key = (a, b) => (a < b ? a * 100000 + b : b * 100000 + a);
  for (let j = 0; j <= NY; j++) for (let i = 0; i <= NX; i++) {
    const a = id(i, j);
    if (i < NX) { edge.set(key(a, id(i + 1, j)), ca.length); add(a, id(i + 1, j)); }
    if (j < NY) { edge.set(key(a, id(i, j + 1)), ca.length); add(a, id(i, j + 1)); }
    if (i < NX && j < NY) { edge.set(key(id(i + 1, j), id(i, j + 1)), ca.length); add(id(i + 1, j), id(i, j + 1)); add(a, id(i + 1, j + 1)); }
    if (i < NX - 1) add(a, id(i + 2, j));
    if (j < NY - 1) add(a, id(i, j + 2));
  }
  const nc = ca.length;
  const cells = new Int32Array(NX * NY * 5);
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
    const a = id(i, j), b = id(i + 1, j), c = id(i, j + 1), d = id(i + 1, j + 1), o = (j * NX + i) * 5;
    cells[o] = edge.get(key(a, b)); cells[o + 1] = edge.get(key(a, c)); cells[o + 2] = edge.get(key(b, c)); cells[o + 3] = edge.get(key(b, d)); cells[o + 4] = edge.get(key(c, d));
  }
  return {
    pos, prev, pc, nc, ca: Int32Array.from(ca), cb: Int32Array.from(cb), cr: Float32Array.from(cr), ct: Float32Array.from(ct),
    broken: new Uint8Array(nc), cells, acc: new Float32Array(NP * 3), t: 0, nBroken: 0,
  };
}

const DT = 1 / 60, G = 2600;
function stepCloth(st, i) {
  const lt = (i + 1) * DT; st.t = lt;
  const { pos, prev, acc, ca, cb, cr, ct, broken } = st;
  acc.fill(0);
  // gravity + gentle wind billow
  for (let k = 0; k < NP; k++) {
    acc[k * 3 + 1] += G;
    const x = pos[k * 3], y = pos[k * 3 + 1];
    acc[k * 3 + 2] += 900 * Math.sin(lt * 5.5 + x * 0.006 + y * 0.004) + 500 * noise2(x * 0.004 + lt * 1.5, y * 0.004);
  }
  // aerodynamic drag per cell (flat paper catches air → flutter)
  const KA = 3.3;
  for (let j = 0; j < NY; j++) for (let ii = 0; ii < NX; ii++) {
    const a = id(ii, j), b = id(ii + 1, j), c = id(ii, j + 1), d = id(ii + 1, j + 1);
    const ux = pos[d * 3] - pos[a * 3], uy = pos[d * 3 + 1] - pos[a * 3 + 1], uz = pos[d * 3 + 2] - pos[a * 3 + 2];
    const vx = pos[c * 3] - pos[b * 3], vy = pos[c * 3 + 1] - pos[b * 3 + 1], vz = pos[c * 3 + 2] - pos[b * 3 + 2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
    let wx = 0, wy = 0, wz = 0;
    for (const p of [a, b, c, d]) { wx += pos[p * 3] - prev[p * 3]; wy += pos[p * 3 + 1] - prev[p * 3 + 1]; wz += pos[p * 3 + 2] - prev[p * 3 + 2]; }
    const vn = ((wx * nx + wy * ny + wz * nz) / 4) / DT;
    const f = -KA * vn;
    for (const p of [a, b, c, d]) { acc[p * 3] += f * nx; acc[p * 3 + 1] += f * ny; acc[p * 3 + 2] += f * nz; }
  }
  // integrate
  const damp = 0.992;
  for (let k = 0; k < NP * 3; k++) {
    const p = pos[k], v = (p - prev[k]) * damp;
    prev[k] = p; pos[k] = p + v + acc[k] * DT * DT;
  }
  // pins
  const hp = hands(lt);
  const clipOn = lt < T_CLIP, gripOn = lt < T_LET;
  const pinTo = (k, x, y, z) => { pos[k * 3] = x; pos[k * 3 + 1] = y; pos[k * 3 + 2] = z; };
  const pinAll = () => {
    if (clipOn) for (const ci of CLIPS) for (let di = -1; di <= 1; di++) { const ii = ci + di; if (ii < 0 || ii > NX) continue; pinTo(id(ii, 0), PX0 + ii * CELL, PY0, 0); }
    if (gripOn) {
      for (let r = -1; r <= 1; r++) {
        HAND_L.forEach((ii) => pinTo(id(ii, GRAB_ROW + r), hp.L[0] + (ii - HAND_L[0] - 0.5) * CELL * 0.8, hp.L[1] + r * CELL * 0.8, hp.L[2]));
        HAND_R.forEach((ii) => pinTo(id(ii, GRAB_ROW + r), hp.R[0] + (ii - HAND_R[0] - 0.5) * CELL * 0.8, hp.R[1] + r * CELL * 0.8, hp.R[2]));
      }
    }
  };
  pinAll();
  // break seams
  for (let c = 0; c < st.nc; c++) if (!broken[c] && ct[c] < 1e8) {
    if (lt >= ct[c]) { broken[c] = 1; st.nBroken++; continue; }
    if (lt > T_RIP - 0.02) {
      const a = ca[c], b = cb[c];
      const d = Math.hypot(pos[a * 3] - pos[b * 3], pos[a * 3 + 1] - pos[b * 3 + 1], pos[a * 3 + 2] - pos[b * 3 + 2]);
      if (d > cr[c] * 1.35) { broken[c] = 1; st.nBroken++; }
    }
  }
  // relax constraints
  for (let it = 0; it < 7; it++) {
    for (let c = 0; c < st.nc; c++) {
      if (broken[c]) continue;
      const a = ca[c] * 3, b = cb[c] * 3;
      const dx = pos[b] - pos[a], dy = pos[b + 1] - pos[a + 1], dz = pos[b + 2] - pos[a + 2];
      const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-6;
      const k = ((d - cr[c]) / d) * 0.5;
      pos[a] += dx * k; pos[a + 1] += dy * k; pos[a + 2] += dz * k;
      pos[b] -= dx * k; pos[b + 1] -= dy * k; pos[b + 2] -= dz * k;
    }
    pinAll();
  }
}

// ---------- contract texture ----------
function contractCanvas() {
  const c = buf('W04-contract', 1024, 1280), x = bctx(c);
  x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, 1024, 1280);
  x.fillStyle = '#F4F4F8'; for (let y = 0; y < 1280; y += 4) if ((y / 4) % 2) x.fillRect(0, y, 1024, 2);
  x.fillStyle = C.black; x.textAlign = 'center'; x.textBaseline = 'alphabetic';
  font(x, 92, 'Anton'); x.fillText('SPONSORSHIP', 512, 132);
  font(x, 92, 'Anton'); x.fillText('AGREEMENT', 512, 228);
  x.fillStyle = C.blue; x.fillRect(80, 252, 864, 10);
  font(x, 22, 'JetBrains Mono', '700'); x.fillStyle = C.black;
  x.fillText('between THE CREATOR ("You") and MEGA·CORP ("Us")', 512, 296);
  const r = rng(404);
  const words = ['the', 'Creator', 'shall', 'grant', 'Us', 'all', 'rights', 'in', 'perpetuity', 'throughout', 'the', 'universe', 'including', 'but', 'not', 'limited', 'to', 'videos', 'ideas', 'dreams', 'and', 'any', 'future', 'thoughts', 'hereinafter', 'per', 'clause', 'non-refundable', 'exclusive', 'royalty', 'waived', 'forever'];
  const clauses = ['§1 EXCLUSIVITY', '§2 PERPETUITY', '§3 ALL RIGHTS RESERVED', '§4 NON-COMPETE', '§5 CREATIVE CONTROL'];
  let y = 352;
  clauses.forEach((cl) => {
    font(x, 30, 'JetBrains Mono', '800'); x.textAlign = 'left'; x.fillStyle = C.black; x.fillText(cl, 84, y); y += 40;
    for (let L = 0; L < 3; L++) {
      font(x, 19, 'JetBrains Mono', '500');
      let lx = 84;
      const hl = r() < 0.4 ? r.int(2, 6) : -1;
      for (let k = 0; k < 14; k++) {
        const w = r.pick(words) + ' ';
        const ww = x.measureText(w).width;
        if (lx + ww > 940) break;
        if (k === hl) { x.fillStyle = 'rgba(255,42,42,0.28)'; x.fillRect(lx - 2, y - 17, ww, 22); }
        x.fillStyle = '#3A3A44'; x.fillText(w, lx, y); lx += ww;
      }
      y += 28;
    }
    y += 22;
  });
  x.strokeStyle = C.black; x.lineWidth = 4; x.beginPath(); x.moveTo(330, 1185); x.lineTo(930, 1185); x.stroke();
  x.fillStyle = C.red; font(x, 64, 'Anton'); x.textAlign = 'left'; x.fillText('SIGN HERE ✗', 84, 1180);
  font(x, 18, 'JetBrains Mono', '700'); x.fillStyle = '#555'; x.fillText('signature of THE CREATOR · date · soul', 540, 1214);
  x.save(); x.translate(800, 1030); x.rotate(-0.22); x.strokeStyle = 'rgba(43,43,255,0.75)'; x.lineWidth = 8;
  x.beginPath(); x.arc(0, 0, 92, 0, TAU); x.stroke(); x.beginPath(); x.arc(0, 0, 74, 0, TAU); x.lineWidth = 3; x.stroke();
  x.fillStyle = 'rgba(43,43,255,0.8)'; font(x, 34, 'Anton'); x.textAlign = 'center'; x.fillText('$$$', 0, -8); font(x, 18, 'JetBrains Mono', '800'); x.fillText('BINDING', 0, 26); x.restore();
  return c;
}

// ---------- three scene ----------
let R3 = null;
function build3d() {
  const scene = new THREE.Scene();
  const D = 1400, fov = (2 * Math.atan(H / 2 / D) * 180) / Math.PI;
  const cam = new THREE.PerspectiveCamera(fov, W / H, 10, 6000); cam.position.set(0, 0, D); cam.lookAt(0, 0, 0);
  const geo = new THREE.BufferGeometry();
  const P = new Float32Array(NP * 3), UV = new Float32Array(NP * 2);
  for (let j = 0; j <= NY; j++) for (let i = 0; i <= NX; i++) { const k = id(i, j); UV[k * 2] = i / NX; UV[k * 2 + 1] = 1 - j / NY; }
  geo.setAttribute('position', new THREE.BufferAttribute(P, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(UV, 2));
  const IDX = new Uint32Array(NX * NY * 6);
  geo.setIndex(new THREE.BufferAttribute(IDX, 1));
  const tex = new THREE.CanvasTexture(contractCanvas()); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const mat = new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, roughness: 0.82, metalness: 0 });
  const mesh = new THREE.Mesh(geo, mat); mesh.castShadow = true; mesh.frustumCulled = false;
  scene.add(mesh);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb8bcff, 1.55));
  const dl = new THREE.DirectionalLight(0xffffff, 1.6); dl.position.set(-700, 900, 1300); dl.target.position.set(0, 0, 0);
  dl.castShadow = true; dl.shadow.mapSize.set(2048, 2048); dl.shadow.radius = 6; dl.shadow.bias = -0.0005;
  const sc = dl.shadow.camera; sc.left = -1300; sc.right = 1300; sc.top = 900; sc.bottom = -900; sc.near = 100; sc.far = 4000;
  scene.add(dl); scene.add(dl.target);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(5000, 3000), new THREE.ShadowMaterial({ opacity: 0.32, color: 0x0a0a40 }));
  wall.position.z = -90; wall.receiveShadow = true; scene.add(wall);
  R3 = { scene, cam, geo, P, IDX, mesh };
}

function sync3d(st) {
  const { P, IDX, geo } = R3;
  const { pos, broken, cells } = st;
  for (let k = 0; k < NP; k++) { P[k * 3] = pos[k * 3] - W / 2; P[k * 3 + 1] = H / 2 - pos[k * 3 + 1]; P[k * 3 + 2] = pos[k * 3 + 2]; }
  let n = 0;
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
    const o = (j * NX + i) * 5;
    const a = id(i, j), b = id(i + 1, j), c = id(i, j + 1), d = id(i + 1, j + 1);
    if (!broken[cells[o]] && !broken[cells[o + 1]] && !broken[cells[o + 2]]) { IDX[n++] = a; IDX[n++] = c; IDX[n++] = b; }
    if (!broken[cells[o + 3]] && !broken[cells[o + 4]] && !broken[cells[o + 2]]) { IDX[n++] = b; IDX[n++] = c; IDX[n++] = d; }
  }
  geo.setDrawRange(0, n);
  geo.attributes.position.needsUpdate = true; geo.index.needsUpdate = true;
  geo.computeVertexNormals();
}

// paper scraps flying off the tear (analytic flutter)
const SCRAPS = (() => { const r = rng(77); return Array.from({ length: 70 }, () => ({ j: r.range(4, NY - 2), vx: r.range(-900, 900), vy: r.range(-1100, -200), t0: r.range(0, 0.18), rot: r.range(0, TAU), vr: r.range(-14, 14), s: r.range(7, 18), f: r.range(5, 11), ph: r() * TAU, red: r() < 0.18 })); })();

export default {
  ...S,
  cutIn: 'punch',
  sfx: [{ t: 61.78, type: 'rip', gain: 1 }, { t: 62.02, type: 'paper', gain: 0.8 }, { t: 62.28, type: 'stamp', gain: 0.9 }],
  async init() { build3d(); render3d(bctx(buf('W04-warm', 64, 36)), R3.scene, R3.cam); },
  draw(ctx, t, s, E) {
    const lt = s.lt;
    if (!R3) build3d();
    const st = sim('W04', Math.floor(lt * 60), initCloth, stepCloth);
    const ripK = kick(lt, T_RIP, 0.12), notK = kick(lt, T_NOT, 0.1), meK = kick(lt, T_ME, 0.1);

    // ---- background: electric-blue wall, white grid, giant NO behind the paper ----
    const push = 1 + lt * 0.035 + ripK * 0.02;
    ctx.save();
    ctx.translate(W / 2, H / 2); ctx.scale(push, push); ctx.translate(-W / 2, -H / 2);
    ctx.fillStyle = C.blue; ctx.fillRect(-50, -50, W + 100, H + 100);
    grid(ctx, 80, 'rgba(255,255,255,0.18)', 2, lt * 40, lt * 25, -50, -50, W + 100, H + 100);
    const bp = A.pulse('beat', t, 0.18);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    for (let gy = -50 + ((lt * 25) % 80 + 80) % 80; gy < H + 50; gy += 80) for (let gx = -50 + ((lt * 40) % 80 + 80) % 80; gx < W + 50; gx += 80) { ctx.beginPath(); ctx.arc(gx, gy, 3 + bp * 4, 0, TAU); ctx.fill(); }
    if (lt > T_RIP - 0.02) {
      const sc = 1 + ripK * 0.12;
      slam(ctx, 'NO.', W / 2, 430, 640, { fill: C.white, shadow: C.black, sx: 22, sy: 22, scale: sc, rot: -0.03 });
      const u = ease.outExpo(clamp((lt - T_RIP - 0.04) / 0.2));
      ctx.fillStyle = C.red; ctx.save(); ctx.translate(W / 2, 700); ctx.rotate(-0.03); ctx.fillRect(-470, -18, 940 * u, 36); ctx.restore();
    }
    ctx.strokeStyle = C.black; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-50, PY0 - 14); ctx.quadraticCurveTo(W / 2, PY0 - 4, W + 50, PY0 - 14); ctx.stroke();
    ctx.restore();

    // ---- the cloth ----
    sync3d(st);
    R3.cam.position.set(Math.sin(lt * 2) * 10, 0, 1400 / push);
    R3.cam.lookAt(0, 0, 0);
    render3d(ctx, R3.scene, R3.cam);

    // ---- clips (pop off when released) + scraps ----
    ctx.save();
    ctx.translate(W / 2, H / 2); ctx.scale(push, push); ctx.translate(-W / 2, -H / 2);
    CLIPS.forEach((ci, q) => {
      const x0 = PX0 + ci * CELL, y0 = PY0 - 6;
      const tr = lt - T_CLIP;
      let x = x0, y = y0, rot = 0, open = 0;
      if (tr > 0) { const vx = (q < 2 ? -1 : 1) * (300 + q * 90), vy = -900 - q * 80; x += vx * tr; y += vy * tr + 2600 * tr * tr; rot = tr * (q % 2 ? 9 : -9); open = 1; }
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
      ctx.fillStyle = C.black; ctx.beginPath(); ctx.moveTo(-26, -20); ctx.lineTo(26, -20); ctx.lineTo(22, 26); ctx.lineTo(-22, 26); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#5B5B66'; ctx.fillRect(-18, -14, 36, 6);
      ctx.strokeStyle = '#9A9AA8'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-14, -20); ctx.lineTo(-20 - open * 16, -50); ctx.lineTo(-6, -58); ctx.moveTo(14, -20); ctx.lineTo(20 + open * 16, -50); ctx.lineTo(6, -58); ctx.stroke();
      ctx.restore();
    });
    if (lt > T_RIP) {
      for (const p of SCRAPS) {
        const tt = lt - T_RIP - p.t0; if (tt < 0) continue;
        const y0 = PY0 + p.j * CELL, x0 = W / 2 + (seamX(p.j) - 19.5) * CELL;
        const x = x0 + p.vx * tt * Math.exp(-tt * 1.5) + Math.sin(tt * p.f + p.ph) * 26;
        const y = y0 + p.vy * tt + 1500 * tt * tt;
        const sx = Math.cos(tt * p.f * 1.3 + p.ph);
        ctx.save(); ctx.translate(x, y); ctx.rotate(p.rot + p.vr * tt); ctx.scale(sx, 1);
        ctx.fillStyle = p.red ? C.red : '#fff'; ctx.fillRect(-p.s, -p.s * 0.6, p.s * 2, p.s * 1.2);
        ctx.fillStyle = 'rgba(14,14,18,0.5)'; ctx.fillRect(-p.s * 0.7, -2, p.s * 1.3, 2);
        ctx.restore();
      }
    }
    ctx.restore();

    // ---- CURSOR ----
    const hp = hands(lt);
    const cx = W / 2, cy = 1112, sc = 1.3;
    const scr = (px, py) => [(px - W / 2) * push + W / 2, (py - H / 2) * push + H / 2];
    const toBody = (px, py) => { const [X, Y] = scr(px, py); return [(X - cx) / sc, (Y - cy) / sc + 185]; };
    let P;
    if (lt <= T_LET) {
      P = { armL: toBody(hp.L[0], hp.L[1]), armR: toBody(hp.R[0], hp.R[1]), legL: [-58, 185], legR: [58, 185], squash: -0.05 * ease.outExpo(clamp((lt - T_RIP) / 0.15)) + 0.04 * (1 - clamp(lt / T_RIP)), rot: 0, bob: 0, look: [0, -0.9], lean: 0 };
    } else {
      const u = ease.outBack(clamp((lt - T_LET) / 0.16));
      const Lh = toBody(hp.L[0], hp.L[1]), Rh = toBody(hp.R[0], hp.R[1]);
      P = { armL: [lerp(Lh[0], 62, u), lerp(Lh[1], 58, u)], armR: [lerp(Rh[0], -66, u), lerp(Rh[1], 44, u)], legL: [-58, 185], legR: [58, 185], squash: meK * 0.12, rot: Math.sin((lt - T_LET) * 28) * 0.06 * Math.exp(-(lt - T_LET) * 4), bob: 0, look: [0, 0], lean: 0 };
    }
    drawMascot(ctx, { x: cx, y: cy, s: sc, t, P, mouth: 'auto', eyes: lt > T_ME - 0.04 ? 'shades' : 'normal', sticker: true });

    // ---- front type: NOT [CURSOR] ME ----
    const label = (str, x, y, rot, a, fill) => {
      if (a <= 0) return;
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(a, a);
      font(ctx, 190, 'Anton'); const tw = ctx.measureText(str).width + 70, bh = 210;
      ctx.fillStyle = C.black; ctx.fillRect(-tw / 2 + 16, -bh / 2 + 16, tw, bh);
      ctx.fillStyle = fill; ctx.fillRect(-tw / 2, -bh / 2, tw, bh);
      ctx.strokeStyle = C.black; ctx.lineWidth = 8; ctx.strokeRect(-tw / 2, -bh / 2, tw, bh);
      ctx.restore();
      slam(ctx, str, x, y + 6, 190, { fill: C.white, shadow: C.black, sx: 9, sy: 9, scale: a, rot });
    };
    if (lt > T_NOT) {
      if (lt < T_NOT + 0.2) speedLines(ctx, 520, 820, 40, 260, 1300, 4 + (E.frame % 3), 'rgba(255,255,255,0.75)', 0.03);
      label('NOT', 540, 820, -0.07, hit(lt, T_NOT, 0.16), C.red);
    }
    if (lt > T_ME) {
      if (lt < T_ME + 0.2) speedLines(ctx, 1400, 820, 40, 260, 1300, 7 + (E.frame % 3), 'rgba(255,255,255,0.75)', 0.03);
      label('ME', 1390, 815, 0.06, hit(lt, T_ME, 0.16), C.red);
    }

    // ---- fx ----
    E.fx.shake = 22 * ripK + 14 * notK + 18 * meK + 10 * A.pulse('kick', t, 0.1);
    E.fx.rgb = 10 * ripK + 6 * meK;
    E.fx.zoom += 0.03 * ripK;
    if (lt > T_RIP && lt < T_RIP + 0.05) E.fx.flash = [1, 1, 1, 0.5];
    E.fx.vignette = 0.15;
  },
};
