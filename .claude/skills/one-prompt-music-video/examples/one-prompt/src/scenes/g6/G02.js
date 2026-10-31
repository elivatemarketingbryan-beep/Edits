// G02 — "Tokens on the meter," — the reels slam $0.00 | $0.00 | $0.00 → JACKPOT. 320 Three.js gold coins
// burst out of the tray and rain from the sky with real rigid-body motion (gravity, bounce, friction,
// quaternion spin) simulated at 60 Hz from the jackpot frame, casting shadows on the floor. COST $0.00.
import { shot } from '../../shots.js';
import { W, H, TAU, ease, seg, clamp, lerp, rng, sim, font } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { THREE, render3d, envMap } from '../../core/three.js';
import { drawMascot } from '../../core/mascot.js';
import { drawSlot, goldBackdrop, reel, REEL_STOP } from './slot.js';
import { slabText, goldGrad } from './kit.js';

const S = shot('G02');
const T_JACK = 79.1, N = 320, DT = 1 / 60, G = -26;
let R = null;

function faceTex() {
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  const g = x.createRadialGradient(110, 100, 10, 128, 128, 128); g.addColorStop(0, '#FFF0B0'); g.addColorStop(0.6, '#FFC300'); g.addColorStop(1, '#C88A00');
  x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  x.strokeStyle = '#A06A00'; x.lineWidth = 10; x.beginPath(); x.arc(128, 128, 104, 0, TAU); x.stroke();
  x.lineWidth = 3; x.beginPath(); x.arc(128, 128, 92, 0, TAU); x.stroke();
  for (let i = 0; i < 40; i++) { const a = i / 40 * TAU; x.beginPath(); x.moveTo(128 + Math.cos(a) * 112, 128 + Math.sin(a) * 112); x.lineTo(128 + Math.cos(a) * 124, 128 + Math.sin(a) * 124); x.stroke(); }
  font(x, 140, 'Bungee'); x.fillStyle = '#A06A00'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('$', 132, 140);
  x.fillStyle = '#FFE58A'; x.fillText('$', 126, 132);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function bumpTex() {
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  x.fillStyle = '#808080'; x.fillRect(0, 0, 256, 256);
  x.strokeStyle = '#ffffff'; x.lineWidth = 10; x.beginPath(); x.arc(128, 128, 104, 0, TAU); x.stroke();
  font(x, 140, 'Bungee'); x.fillStyle = '#ffffff'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('$', 128, 136);
  return new THREE.CanvasTexture(c);
}

function build() {
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(36, W / H, 0.1, 100);
  cam.position.set(0, 4.6, 17); cam.lookAt(0, 4.1, 0); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
  scene.add(new THREE.HemisphereLight(0xfff4d6, 0x7a4b00, 1.1));
  const key = new THREE.DirectionalLight(0xffffff, 3.2); key.position.set(-6, 16, 10); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -16, right: 16, top: 14, bottom: -8, near: 1, far: 50 }); key.shadow.bias = -0.0005;
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(0xffd27a, 1.6); rim.position.set(8, 6, -6); scene.add(rim);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 40), new THREE.ShadowMaterial({ opacity: 0.32 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const env = envMap();
  const ft = faceTex(), bt = bumpTex();
  const side = new THREE.MeshStandardMaterial({ color: 0xE8A400, metalness: 1, roughness: 0.3, envMap: env, envMapIntensity: 1.5 });
  const face = new THREE.MeshStandardMaterial({ map: ft, bumpMap: bt, bumpScale: 2.5, metalness: 0.9, roughness: 0.25, envMap: env, envMapIntensity: 1.3 });
  const geo = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 36, 1);
  const mesh = new THREE.InstancedMesh(geo, [side, face, face], N);
  mesh.castShadow = true; mesh.frustumCulled = false; scene.add(mesh);
  // emitter: the world point on z=0 under the machine's tray (screen position decided in draw)
  return { scene, cam, mesh, m4: new THREE.Matrix4(), q: new THREE.Quaternion(), v3: new THREE.Vector3(), s3: new THREE.Vector3(), dq: new THREE.Quaternion(), ax: new THREE.Vector3() };
}
/** world point on plane z=0 seen at screen px (x,y) */
function unproject(px, py) {
  const v = new THREE.Vector3((px / W) * 2 - 1, -(py / H) * 2 + 1, 0.5).unproject(R.cam);
  const d = v.sub(R.cam.position).normalize(); const k = -R.cam.position.z / d.z;
  return R.cam.position.clone().add(d.multiplyScalar(k));
}
const TRAY = [960, 683];

function initCoins() {
  const r = rng(77), em = unproject(TRAY[0], TRAY[1]), cs = [];
  for (let i = 0; i < N; i++) {
    const burst = i < 105;
    const c = { born: burst ? (i / 105) * 0.3 : 0.0 + ((i - 105) / (N - 105)) * 0.75, p: [0, 0, 0], v: [0, 0, 0], q: new THREE.Quaternion(), w: [0, 0, 0], rest: false, y0: 0.05 + r() * 0.12 };
    if (burst) { c.p = [em.x + r.range(-0.6, 0.6), em.y + r.range(-0.1, 0.3), 0.6]; c.v = [r.range(-9, 9), r.range(7, 14), r.range(0.5, 5.5)]; }
    else { c.p = [r.range(-13, 13), r.range(10.5, 14), r.range(-6, 6)]; c.v = [r.range(-1.5, 1.5), r.range(-10, -4), r.range(-0.5, 0.5)]; }
    c.q.setFromEuler(new THREE.Euler(r() * TAU, r() * TAU, r() * TAU));
    const sp = r.range(9, 22); const ax = new THREE.Vector3(r.range(-1, 1), r.range(-1, 1), r.range(-1, 1)).normalize();
    c.w = [ax.x * sp, ax.y * sp, ax.z * sp];
    c.yaw = r() * TAU;
    cs.push(c);
  }
  return { cs, time: 0 };
}
function stepCoins(st) {
  st.time += DT;
  const dq = R.dq, ax = R.ax;
  for (const c of st.cs) {
    if (st.time < c.born || c.rest) continue;
    c.v[1] += G * DT;
    c.p[0] += c.v[0] * DT; c.p[1] += c.v[1] * DT; c.p[2] += c.v[2] * DT;
    const wl = Math.hypot(c.w[0], c.w[1], c.w[2]);
    if (wl > 1e-4) { ax.set(c.w[0] / wl, c.w[1] / wl, c.w[2] / wl); dq.setFromAxisAngle(ax, wl * DT); c.q.premultiply(dq); }
    // floor contact (half-extent depends on tilt: radius*|sin| + thickness*|cos|)
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(c.q);
    const ext = 0.5 * Math.sqrt(Math.max(0, 1 - up.y * up.y)) + 0.05 * Math.abs(up.y);
    const fl = c.y0 + ext;
    if (c.p[1] < fl && c.v[1] < 0) {
      c.p[1] = fl;
      c.v[1] = -c.v[1] * 0.38; c.v[0] *= 0.62; c.v[2] *= 0.62;
      c.w = c.w.map((v) => v * 0.55);
      // rim hit → kick the coin's tilt toward flat
      if (Math.abs(c.v[1]) < 1.3) {
        c.settle = (c.settle || 0) + 1;
      }
    }
    if (c.settle) { // topple flat over a few frames, keeping its yaw
      const flat = new THREE.Quaternion().setFromEuler(new THREE.Euler(up.y >= 0 ? 0 : Math.PI, c.yaw, 0));
      c.q.slerp(flat, 0.18); c.w = c.w.map((v) => v * 0.85); c.v[0] *= 0.9; c.v[2] *= 0.9;
      if (c.p[1] <= fl + 0.02 && Math.abs(c.v[1]) < 0.5 && c.q.angleTo(flat) < 0.02) { c.rest = true; c.p[1] = c.y0 + 0.05; c.q.copy(flat); }
    }
  }
}

export default {
  ...S,
  cutIn: 'none',
  sfx: [{ t: 78.6, type: 'stamp' }, { t: 78.78, type: 'stamp' }, { t: 78.96, type: 'stamp' }, { t: 79.1, type: 'coin', gain: 1 }, { t: 79.12, type: 'boom', gain: 0.9 }],
  draw(ctx, t, s, E) {
    if (!R) R = build();
    const lt = s.lt;
    const back = ease.outExpo(seg(t, T_JACK, T_JACK + 0.42));
    // machine framing: tight on the reels → pull back to the whole cabinet on JACKPOT
    const msc = lerp(1.2 + lt * 0.12, 0.56, back);
    const mcx = 960, mcy = lerp(500 + 50 * msc, 470, back);
    const jk = t >= T_JACK;
    goldBackdrop(ctx, t, 960, lerp(300, 260, back), lt * (jk ? 1.6 : 0.6), W, H, 1);
    if (jk) { // sunburst flare behind the machine
      const fl = ctx.createRadialGradient(960, 360, 30, 960, 360, 900);
      fl.addColorStop(0, `rgba(255,255,240,${0.85 * Math.exp(-(t - T_JACK) / 0.35)})`); fl.addColorStop(1, 'rgba(255,255,240,0)');
      ctx.fillStyle = fl; ctx.fillRect(0, 0, W, H);
    }
    ctx.fillStyle = '#111'; ctx.fillRect(0, lerp(H + 40, 965, back), W, 200);
    const reels = [0, 1, 2].map((i) => reel(i, t));
    const tokens = Math.floor(lerp(0.4, 1, ease.outCubic(seg(t, 78.56, 79.6))) * 1048576);
    drawSlot(ctx, { t, cx: mcx, cy: mcy, sc: msc, lever: -1.22, lit: jk ? 1 : 0, chase: t * 18, reels, tokens });
    // CURSOR peeks in from the right on the jackpot, star-eyed
    if (jk) {
      const k = ease.outBack(seg(t, T_JACK + 0.15, T_JACK + 0.45));
      drawMascot(ctx, { x: lerp(2150, 1540, k), y: 960, s: 0.95, t, pose: 'cheer', eyes: 'star', mouth: 'open', sticker: true, rot: -0.1 * (1 - k) });
    }

    // ---------- 3D coins ----------
    if (jk) {
      const step = Math.floor((t - T_JACK) / DT);
      const st = sim('G02coins', step, initCoins, stepCoins);
      const m4 = R.m4, v3 = R.v3, s3 = R.s3;
      st.cs.forEach((c, i) => {
        const alive = st.time >= c.born;
        v3.set(c.p[0], c.p[1], c.p[2]); s3.setScalar(alive ? 1 : 0.0001);
        m4.compose(v3, c.q, s3); R.mesh.setMatrixAt(i, m4);
      });
      R.mesh.instanceMatrix.needsUpdate = true;
      render3d(ctx, R.scene, R.cam, { toneMapping: THREE.ACESFilmicToneMapping, exposure: 1.25 });
    }

    // ---------- type ----------
    if (jk) {
      const k = ease.outBack(seg(t, T_JACK + 0.22, T_JACK + 0.42), 2.4), wob = Math.sin((t - T_JACK) * 9) * 0.02;
      ctx.save(); ctx.translate(960, 846); ctx.rotate(-0.03 + wob); ctx.scale(k, k);
      font(ctx, 46, 'Bungee'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      slabText(ctx, 'COST', -500, -6, { size: 74, family: 'Bungee', face: '#FFF4D6', side: '#111', depth: 6, ow: 6 });
      slabText(ctx, '$0.00', 90, 0, { size: 210, family: 'Bungee', face: (c, a, b) => goldGrad(c, a, b), side: '#7A4B00', depth: 16, ow: 9, shadow: 'rgba(17,17,17,0.55)' });
      ctx.restore();
    }
    // landing banner: "$0.00 ×3"
    const landed = reels.filter((r) => r.landed !== undefined && r.landed > 0).length;
    if (!jk && landed > 0) {
      ctx.save(); ctx.translate(960, 150); const k = ease.outBack(seg(t, REEL_STOP[0] + 0.12, REEL_STOP[0] + 0.28));
      ctx.scale(k, k); slabText(ctx, landed < 3 ? `$0.00 × ${landed}` : '$0.00 × 3', 0, 0, { size: 96, family: 'Bungee', face: '#FFF4D6', side: '#111', depth: 8, ow: 7 });
      ctx.restore();
    }

    // FX: a slam per reel, then the jackpot hit
    let slam = 0; for (const i of [0, 1, 2]) { const L = reels[i].landed; if (L !== undefined && L >= 0) slam = Math.max(slam, Math.exp(-L / 0.09)); }
    E.fx.shake = slam * 16; E.fx.zoom += slam * 0.025; E.fx.rgb = slam * 6;
    if (jk) {
      const h = Math.exp(-(t - T_JACK) / 0.18);
      E.fx.shake += h * 34; E.fx.rgb += h * 14; E.fx.zoom += h * 0.06;
      if (t < T_JACK + 0.07) E.fx.flash = [1, 0.95, 0.75, 0.75];
      E.fx.bloom = 0.35; E.fx.bloomThreshold = 0.82;
    }
    E.fx.vignette = 0.25;
  },
};
