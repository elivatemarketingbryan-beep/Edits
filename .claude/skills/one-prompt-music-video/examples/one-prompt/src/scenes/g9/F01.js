// F01 — "One prompt, and it moves" · STADIUM CARD STUNT
// A wall of 24×14 real 3D cards (one InstancedMesh, custom shader) sits on stepped bleachers. Waves of flips
// (radial / sweep / tumble / spiral) reveal a new world on every hit: ONE → PROMPT → CURSOR dancing (gold) →
// CURSOR dancing (neon) → MOVES. Every card samples its own slice of a LIVE image, so CURSOR really dances
// across the cards. Each card tracks its own flip history, so waves can chase each other closer than a sweep.
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, seg, hash, noise2, buf, bctx, rays, roundRect, star } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { drawMascot } from '../../core/mascot.js';
import { THREE, render3d, renderer } from '../../core/three.js';
import { bigType } from './common.js';

const S = shot('F01');
const COLS = 24, ROWS = 14, CW = 1, CH = 0.964, GX = 0.075, GY = 0.13, THK = 0.045, STEP = 0.2;
const SW = 1280, SH = 720;
const N = COLS * ROWS;
const CX = (COLS - 1) / 2, CY = (ROWS - 1) / 2;

const radial = (c, r, cx = CX, cy = CY) => Math.hypot(c - cx, (r - cy) * 1.05) / Math.hypot(CX + 0.5, CY + 0.5);
// image states: 0 = blank white cards (matches the white snap out of B09), then each wave reveals .img
const WAVES = [
  { t: 125.30, img: 1, axis: 1, dir: 1, dur: 0.26, lift: 1.1, delay: (c, r) => 0.30 * radial(c, r) + 0.025 * hash(c, r, 1) },
  { t: 125.86, img: 2, axis: 0, dir: -1, dur: 0.16, lift: 0.55, delay: (c, r) => 0.12 * c / (COLS - 1) + 0.012 * r / ROWS + 0.015 * hash(c, r, 3) },
  { t: 126.08, img: 3, axis: 1, dir: 1, dur: 0.24, lift: 2.2, delay: (c, r) => 0.22 * radial(c, r, CX, 5.0) + 0.02 * hash(c, r, 5) },
  { t: 126.73, img: 4, axis: 0, dir: 1, dur: 0.22, lift: 0.9, delay: (c, r) => 0.2 * r / (ROWS - 1) + 0.035 * Math.abs(c - CX) / CX + 0.02 * hash(c, r, 7) },
  { t: 127.22, img: 5, axis: 1, dir: -1, dur: 0.2, lift: 1.3, delay: (c, r) => { const a = Math.atan2(r - CY, c - CX); return 0.05 * ((a / TAU + 1) % 1) + 0.15 * radial(c, r); } },
];
const imgOf = (k) => (k === 0 ? 0 : WAVES[k - 1].img);

// rest orientation after n flips is a diagonal sign matrix — precompute signs + quaternions
const REST = [[1, 1, 1]];
for (const w of WAVES) { const [sx, sy, sz] = REST[REST.length - 1]; REST.push(w.axis === 1 ? [-sx, sy, -sz] : [sx, -sy, -sz]); }

let R3 = null;
function build() {
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(38, W / H, 0.1, 400);
  const geo = new THREE.BoxGeometry(CW, CH, THK);
  const aCell = new Float32Array(N * 2), aImg = new Float32Array(N * 2), aSgn = new Float32Array(N * 4);
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const i = r * COLS + c; aCell[i * 2] = c; aCell[i * 2 + 1] = r; }
  const attCell = new THREE.InstancedBufferAttribute(aCell, 2);
  const attImg = new THREE.InstancedBufferAttribute(aImg, 2); attImg.setUsage(THREE.DynamicDrawUsage);
  const attSgn = new THREE.InstancedBufferAttribute(aSgn, 4); attSgn.setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('aCell', attCell); geo.setAttribute('aImg', attImg); geo.setAttribute('aSgn', attSgn);
  const texs = [0, 1, 2, 3].map((i) => {
    const tx = new THREE.CanvasTexture(buf('F01-slot' + i, SW, SH));
    tx.colorSpace = THREE.NoColorSpace; tx.anisotropy = 8; tx.minFilter = THREE.LinearMipmapLinearFilter; tx.generateMipmaps = true;
    return tx;
  });
  const mat = new THREE.ShaderMaterial({
    defines: { CW: CW.toFixed(4), CH: CH.toFixed(4), COLS: COLS.toFixed(1), ROWS: ROWS.toFixed(1) },
    uniforms: {
      t0: { value: texs[0] }, t1: { value: texs[1] }, t2: { value: texs[2] }, t3: { value: texs[3] },
      uL: { value: new THREE.Vector3(-0.38, 0.5, 0.78).normalize() }, uEdge: { value: new THREE.Color('#F1ECE2') },
    },
    vertexShader: /* glsl */`
      attribute vec2 aCell; attribute vec2 aImg; attribute vec4 aSgn;
      varying vec3 vP; varying vec3 vON; varying vec3 vN; varying vec3 vW; varying vec2 vCell; varying vec2 vImg; varying vec4 vSgn;
      void main(){
        vP = position; vON = normal; vCell = aCell; vImg = aImg; vSgn = aSgn;
        mat4 m = modelMatrix * instanceMatrix;
        vec4 wp = m * vec4(position, 1.0); vW = wp.xyz;
        vN = normalize(mat3(m) * normal);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */`
      uniform sampler2D t0, t1, t2, t3; uniform vec3 uL; uniform vec3 uEdge;
      varying vec3 vP; varying vec3 vON; varying vec3 vN; varying vec3 vW; varying vec2 vCell; varying vec2 vImg; varying vec4 vSgn;
      vec3 tx(float s, vec2 uv){ if (s < 0.5) return texture2D(t0, uv).rgb; if (s < 1.5) return texture2D(t1, uv).rgb; if (s < 2.5) return texture2D(t2, uv).rgb; return texture2D(t3, uv).rgb; }
      void main(){
        vec3 base; float isFace = 0.0;
        if (abs(vON.z) > 0.5) {
          bool fr = vON.z > 0.0;
          vec2 sg = fr ? vSgn.xy : vSgn.zw; float sl = fr ? vImg.x : vImg.y;
          vec2 uv = vec2(0.5) + vec2(sg.x * vP.x / CW, sg.y * vP.y / CH);
          vec2 im = vec2((vCell.x + uv.x) / COLS, (ROWS - 1.0 - vCell.y + uv.y) / ROWS);
          base = tx(sl, im);
          vec2 e = abs(uv - 0.5) * 2.0; float edge = smoothstep(0.88, 1.0, max(e.x, e.y));
          base *= 1.0 - 0.16 * edge;
          isFace = 1.0;
        } else base = uEdge;
        vec3 N = normalize(vN); vec3 V = normalize(cameraPosition - vW);
        float dif = max(dot(N, uL), 0.0);
        vec3 Hh = normalize(uL + V); float sp = pow(max(dot(N, Hh), 0.0), 70.0);
        vec3 col = base * (0.66 + 0.42 * dif) + vec3(1.0, 0.98, 0.94) * sp * (0.25 + 0.35 * isFace);
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const mesh = new THREE.InstancedMesh(geo, mat, N);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); mesh.frustumCulled = false;
  scene.add(mesh);
  // bleacher risers behind every card row
  const rows = new THREE.Group();
  const rmat = new THREE.MeshBasicMaterial({ color: 0x0c1030 });
  const tmat = new THREE.MeshBasicMaterial({ color: 0x1a2050 });
  for (let r = 0; r < ROWS; r++) {
    const y = (CY - r) * (CH + GY), z = -(ROWS - 1 - r) * STEP;
    const riser = new THREE.Mesh(new THREE.BoxGeometry(COLS * (CW + GX) + 1.2, CH + GY, 0.05), rmat);
    riser.position.set(0, y, z - 0.18); rows.add(riser);
    const tread = new THREE.Mesh(new THREE.BoxGeometry(COLS * (CW + GX) + 1.2, 0.05, STEP + 0.2), tmat);
    tread.position.set(0, y - (CH + GY) / 2, z - 0.1); rows.add(tread);
  }
  scene.add(rows);
  R3 = { scene, cam, mesh, attImg, attSgn, texs, q: new THREE.Quaternion(), qf: new THREE.Quaternion(), qj: new THREE.Quaternion(),
    e: new THREE.Euler(), m4: new THREE.Matrix4(), p: new THREE.Vector3(), sc: new THREE.Vector3(1, 1, 1), ax: [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0)] };
  R3.restQ = REST.map(([sx, sy]) => {
    if (sx > 0 && sy > 0) return new THREE.Quaternion(0, 0, 0, 1);
    if (sx < 0 && sy > 0) return new THREE.Quaternion(0, 1, 0, 0);
    if (sx > 0 && sy < 0) return new THREE.Quaternion(1, 0, 0, 0);
    return new THREE.Quaternion(0, 0, 1, 0);
  });
}

// ---------------------------------------------------------------- the images on the cards
function popBg(x, col, ray, t, cx = SW / 2, cy = SH * 0.55, n = 22) {
  x.fillStyle = col; x.fillRect(0, 0, SW, SH);
  rays(x, cx, cy, n, 1700, t * 0.5, ray, 'rgba(0,0,0,0)');
}
function halftoneBg(x, dot, step, cx, cy) {
  x.fillStyle = dot; x.beginPath();
  for (let y = step / 2; y < SH; y += step) for (let xx = (Math.round(y / step) % 2) * step / 2; xx < SW; xx += step) {
    const d = Math.hypot(xx - cx, y - cy) / 760, r = clamp(d * d) * step * 0.46;
    if (r > 0.6) { x.moveTo(xx + r, y); x.arc(xx, y, r, 0, TAU); }
  }
  x.fill();
}
function paint(k, c, t) {
  const x = bctx(c);
  x.save(); x.setTransform(1, 0, 0, 1, 0, 0);
  if (k === 0) {
    x.fillStyle = '#FFFBF4'; x.fillRect(0, 0, SW, SH);
  } else if (k === 1) { // ONE — sunburst pop
    popBg(x, '#FF3E8A', 'rgba(255,122,26,0.95)', t);
    x.save(); x.translate(SW / 2, SH * 0.52); x.rotate(-0.05); const p = 1 + 0.04 * A.pulse('beat', t, 0.12); x.scale(p, p);
    bigType(x, 'ONE', 0, 20, { size: 620, fill: '#FFE14D', stroke: '#2A0B3D', sw: 26, shadow: '#7B2FF7', sx: 22, sy: 22, maxW: 1100 });
    x.restore();
    for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + t; star(x, SW / 2 + Math.cos(a) * 560, SH / 2 + Math.sin(a) * 290, 38, 16, 5, t * 2 + i); x.fillStyle = i % 2 ? '#FFFBF4' : '#FFE14D'; x.fill(); }
  } else if (k === 2) { // PROMPT — internet brutalism
    x.fillStyle = '#2B2BFF'; x.fillRect(0, 0, SW, SH);
    x.strokeStyle = 'rgba(255,255,255,0.22)'; x.lineWidth = 3; x.beginPath();
    for (let gx = 0; gx <= SW; gx += 80) { x.moveTo(gx, 0); x.lineTo(gx, SH); }
    for (let gy = 0; gy <= SH; gy += 80) { x.moveTo(0, gy); x.lineTo(SW, gy); }
    x.stroke();
    x.fillStyle = '#C3C3C3'; x.fillRect(90, 110, SW - 180, SH - 220);
    x.fillStyle = '#0E0E12'; x.fillRect(90, SH - 110, SW - 180, 10); x.fillRect(SW - 100, 110, 10, SH - 220);
    x.fillStyle = '#FFFFFF'; x.fillRect(110, 186, SW - 220, SH - 316);
    x.fillStyle = '#0E0E12'; x.fillRect(110, 130, SW - 220, 48);
    x.fillStyle = '#FF2A2A'; x.fillRect(SW - 160, 136, 36, 36);
    bigType(x, 'PROMPT.EXE', 140, 156, { size: 34, family: 'Press Start 2P', fill: '#FFFFFF', align: 'left' });
    bigType(x, '> PROMPT', SW / 2 + 6, SH / 2 + 46, { size: 300, fill: '#FF2A2A', maxW: 1000 });
    bigType(x, '> PROMPT', SW / 2 - 6, SH / 2 + 40, { size: 300, fill: '#2B2BFF', maxW: 1000 });
    if (Math.floor(t * 4) % 2 === 0) { x.fillStyle = '#2B2BFF'; x.fillRect(SW / 2 + 520, SH / 2 + 80, 70, 22); }
  } else if (k === 3 || k === 4 || k === 5) {
    if (k === 3) { // gold rush
      popBg(x, '#FFC300', 'rgba(224,161,0,0.9)', -t, SW / 2, SH * 0.62, 26);
      halftoneBg(x, '#111111', 22, SW / 2, SH * 0.62);
      bigType(x, 'ONE PROMPT', SW / 2, 96, { size: 92, fill: '#111111', track: 14 });
    } else if (k === 4) { // chrome voxel neon
      const g = x.createLinearGradient(0, 0, 0, SH); g.addColorStop(0, '#B79CFF'); g.addColorStop(0.62, '#E2D6FF'); g.addColorStop(0.62, '#1A1240'); g.addColorStop(1, '#2A1E70');
      x.fillStyle = g; x.fillRect(0, 0, SW, SH);
      x.strokeStyle = '#3EF0FF'; x.lineWidth = 4; x.beginPath();
      const hz = SH * 0.62;
      for (let i = -14; i <= 14; i++) { x.moveTo(SW / 2 + i * 30, hz); x.lineTo(SW / 2 + i * 260, SH); }
      for (let j = 0; j < 9; j++) { const yy = hz + (SH - hz) * ((j + (t * 2) % 1) / 9) ** 2; x.moveTo(0, yy); x.lineTo(SW, yy); }
      x.stroke();
      x.fillStyle = '#7CFFC4'; x.beginPath(); x.arc(SW / 2, hz - 10, 190, Math.PI, 0); x.fill();
      x.fillStyle = '#B79CFF'; for (let j = 0; j < 6; j++) x.fillRect(SW / 2 - 200, hz - 30 - j * 30, 400, 6 + j);
    } else { // MOVES — mint
      popBg(x, '#7CFFC4', 'rgba(62,240,255,0.85)', t * 1.5, SW / 2, SH * 0.6, 18);
      x.save(); x.translate(SW / 2, SH * 0.48); x.rotate(0.04);
      bigType(x, 'MOVES', 0, 0, { size: 470, fill: '#FF3E8A', stroke: '#10233A', sw: 22, shadow: '#2B2BFF', sx: 18, sy: 18, maxW: 1020 });
      x.restore();
    }
    // CURSOR dances on the cards
    const pose = k === 5 ? 'cheer' : 'dance';
    const eyes = k === 3 ? 'star' : k === 4 ? 'shades' : 'happy';
    const sc = k === 5 ? 1.05 : 1.55, fx = SW * 0.5, fy = k === 5 ? SH * 1.02 : SH * 0.985;
    x.fillStyle = 'rgba(0,0,0,0.22)'; x.beginPath(); x.ellipse(fx, fy - 8, 170 * sc, 26 * sc, 0, 0, TAU); x.fill();
    drawMascot(x, { x: fx, y: fy, s: sc, t, pose, eyes, mouth: k === 4 ? 'grin' : 'open', sticker: true });
  }
  x.restore();
}

// ---------------------------------------------------------------- per-card flip state
function cardState(c, r, t) {
  let prevEnd = -1e9, n = 0, p = 0, flipping = -1;
  for (let j = 0; j < WAVES.length; j++) {
    const w = WAVES[j];
    const s0 = Math.max(w.t + w.delay(c, r), prevEnd + 0.004), e0 = s0 + w.dur;
    prevEnd = e0;
    if (t >= e0) { n = j + 1; continue; }
    if (t >= s0) { flipping = j; p = (t - s0) / w.dur; }
    break;
  }
  return { n, flipping, p };
}

// ---------------------------------------------------------------- camera
const KA = { p: [-6.4, -4.6, 5.0], l: [-2.6, -2.2, -1.4], fov: 54, roll: -0.16 };
const KB = { p: [0.0, 0.5, 25.5], l: [0, -0.15, -1.3], fov: 38, roll: 0 };
const KC = { p: [2.4, -0.5, 18.2], l: [0.6, -0.4, -1.3], fov: 40, roll: 0.06 };
function camAt(t) {
  let a, b, u;
  if (t < 126.1) { a = KA; b = KB; u = ease.inOutQuart(seg(t, S.start, 126.1)); }
  else { a = KB; b = KC; u = ease.inQuad(seg(t, 126.1, S.end)); }
  const L = (k) => [0, 1, 2].map((i) => lerp(a[k][i], b[k][i], u));
  return { p: L('p'), l: L('l'), fov: lerp(a.fov, b.fov, u), roll: lerp(a.roll, b.roll, u) };
}

// ---------------------------------------------------------------- 2D stadium dressing
function stadiumBg(ctx, t) {
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#05060f'); g.addColorStop(0.5, '#0d1030'); g.addColorStop(1, '#1a1240');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(120,130,200,0.18)';
  for (let i = 0; i < 520; i++) { const x = hash(i, 1) * W, y = 120 + hash(i, 2) * (H - 160); ctx.fillRect(x, y + Math.sin(t * 9 + i) * 2, 4, 4); }
}
function floodlights(ctx, t, k) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const b = A.pulse('beat', t, 0.18);
  for (let i = 0; i < 4; i++) {
    const x = [180, 640, 1280, 1740][i], y = -20;
    const g = ctx.createRadialGradient(x, y, 0, x, y, 420 + 140 * b);
    g.addColorStop(0, `rgba(255,250,235,${0.5 * k})`); g.addColorStop(0.25, `rgba(255,230,190,${0.16 * k})`); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(x - 600, 0, 1200, 700);
    const a = Math.PI / 2 + Math.sin(t * 2.2 + i * 1.7) * 0.5;
    ctx.fillStyle = `rgba(255,240,210,${(0.05 + 0.06 * b) * k})`;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a - 0.09) * 1600, y + Math.sin(a - 0.09) * 1600); ctx.lineTo(x + Math.cos(a + 0.09) * 1600, y + Math.sin(a + 0.09) * 1600); ctx.fill();
  }
  ctx.restore();
}
function crowd(ctx, t, camx) {
  // foreground silhouettes: a row of little block-cursor fans, arms up on the beat
  const ph = A.beat(t).phase, hop = Math.exp(-ph * 5);
  ctx.fillStyle = '#05060d'; ctx.strokeStyle = '#05060d'; ctx.lineCap = 'round';
  for (let i = -1; i < 15; i++) {
    const x = i * 138 + 40 - camx * 22 + hash(i, 9) * 50, s = 0.8 + hash(i, 4) * 0.45;
    const up = (i + A.beat(t).i) % 3 === 0;
    const y = H + 40 - hop * 22 * hash(i, 5) - (up ? 14 : 0);
    roundRect(ctx, x - 52 * s, y - 150 * s, 104 * s, 170 * s, 26 * s); ctx.fill();
    ctx.lineWidth = 15 * s; ctx.beginPath();
    const ay = up ? -250 : -150 + 50 * Math.sin(t * 7 + i), by = up ? ay : -120 - 40 * Math.cos(t * 6 + i);
    ctx.moveTo(x - 46 * s, y - 100 * s); ctx.lineTo(x - 92 * s, y + ay * s);
    ctx.moveTo(x + 46 * s, y - 100 * s); ctx.lineTo(x + 92 * s, y + by * s); ctx.stroke();
    ctx.beginPath(); ctx.arc(x - 92 * s, y + ay * s, 17 * s, 0, TAU); ctx.arc(x + 92 * s, y + by * s, 17 * s, 0, TAU); ctx.fill();
  }
}

export default {
  ...S,
  cutIn: 'flash',
  sfx: [{ t: 125.30, type: 'whoosh' }, { t: 126.08, type: 'impact', gain: 1 }, { t: 127.22, type: 'swoosh' }],
  init() { build(); for (let i = 0; i < 4; i++) paint(i, buf('F01-slot' + i, SW, SH), S.start); renderer().compile(R3.scene, R3.cam); },
  draw(ctx, t, s, E) {
    if (!R3) build();
    const { scene, cam, mesh, attImg, attSgn, texs } = R3;
    // ---- update every card
    const used = new Set();
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const i = r * COLS + c, st = cardState(c, r, t);
      const n = st.n, nx = Math.min(n + 1, WAVES.length);
      const restA = REST[n];
      // whichever state shows the front face (sz=+1) owns the front
      const fState = restA[2] > 0 ? n : nx, bState = restA[2] > 0 ? nx : n;
      const fi = imgOf(fState), bi = imgOf(bState);
      attImg.array[i * 2] = fi % 4; attImg.array[i * 2 + 1] = bi % 4;
      const fs = REST[fState], bs = REST[bState];
      attSgn.array[i * 4] = fs[0]; attSgn.array[i * 4 + 1] = fs[1]; attSgn.array[i * 4 + 2] = bs[0]; attSgn.array[i * 4 + 3] = bs[1];
      used.add(imgOf(n)); if (st.flipping >= 0) used.add(imgOf(nx));
      const R = R3;
      R.q.copy(R.restQ[n]);
      let lift = 0;
      if (st.flipping >= 0) {
        const w = WAVES[st.flipping];
        const ang = Math.PI * ease.outBack(st.p, 1.25) * w.dir;
        R.qf.setFromAxisAngle(R.ax[w.axis], ang); R.q.premultiply(R.qf);
        lift = Math.sin(clamp(st.p) * Math.PI) * w.lift * (0.7 + 0.3 * hash(c, r, 11));
      }
      const sway = Math.sin(t * 5.2 + c * 0.45 + r * 0.3) * 0.025;
      R.e.set((hash(c, r, 21) - 0.5) * 0.07 + sway * 0.6, (hash(c, r, 22) - 0.5) * 0.07, (hash(c, r, 23) - 0.5) * 0.05 + sway);
      R.qj.setFromEuler(R.e); R.q.premultiply(R.qj);
      const bob = A.pulse('beat', t - 0.012 * (c + r), 0.1) * 0.06 * hash(c, r, 31);
      R.p.set((c - CX) * (CW + GX) + (hash(c, r, 24) - 0.5) * 0.05, (CY - r) * (CH + GY) + bob + (hash(c, r, 25) - 0.5) * 0.04, -(ROWS - 1 - r) * STEP + lift);
      R.m4.compose(R.p, R.q, R.sc); mesh.setMatrixAt(i, R.m4);
    }
    mesh.instanceMatrix.needsUpdate = true; attImg.needsUpdate = true; attSgn.needsUpdate = true;
    for (const k of used) { paint(k, buf('F01-slot' + (k % 4), SW, SH), t); texs[k % 4].needsUpdate = true; }

    // ---- camera
    const C = camAt(t);
    const hx = noise2(t * 1.3, 4.1) * 0.18, hy = noise2(t * 1.1, 9.7) * 0.14;
    cam.position.set(C.p[0] + hx, C.p[1] + hy, C.p[2]);
    cam.up.set(Math.sin(C.roll), Math.cos(C.roll), 0);
    cam.lookAt(C.l[0], C.l[1], C.l[2]);
    cam.fov = C.fov - 2.5 * A.pulse('beat', t, 0.12); cam.updateProjectionMatrix();

    // ---- paint
    stadiumBg(ctx, t);
    floodlights(ctx, t, 1);
    render3d(ctx, scene, cam);
    // phone flashes popping in the stands (outside the card wall)
    const fr = Math.round(t * 30);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 9; i++) {
      const x = hash(fr, i, 1) * W, y = 130 + hash(fr, i, 2) * 800, r = 2 + hash(fr, i, 3) * 3;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r * 6); g.addColorStop(0, 'rgba(255,255,255,0.85)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.fillRect(x - r * 6, y - r * 6, r * 12, r * 12);
    }
    ctx.restore();
    crowd(ctx, t, C.p[0]);
    floodlights(ctx, t, 0.55);

    // ---- hits
    for (const w of WAVES) {
      const d = t - w.t;
      if (d >= 0 && d < 0.2) { const k = 1 - d / 0.2; E.fx.zoom += 0.035 * k * k; E.fx.rgb += 5 * k; }
    }
    const dn = t - 126.08;
    if (dn >= 0 && dn < 0.35) { const k = 1 - dn / 0.35; E.fx.shake = 14 * k * k; E.fx.flash = [1, 1, 1, 0.22 * k * k]; E.fx.bloom = 0.5 * k; }
    E.fx.vignette = 0.32;
  },
};
