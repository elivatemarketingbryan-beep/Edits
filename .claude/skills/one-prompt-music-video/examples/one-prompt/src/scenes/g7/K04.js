// K04 · "One prompt, now it's real" — a Three.js laptop on a mirror-chrome desk. On its screen a flat 2D CURSOR
// waves while "> one prompt" types itself (keys depress as letters land). On "now" it slams against the glass,
// peels OUT of the screen as a flat card, spins through the air and — on "real" — inflates into the chunky 3D
// CURSOR landing on the keyboard; an iridescent chrome REAL bursts up through the desk.
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, seg, hash, font, roundRect, spring, wobble } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { drawMascot, mascotSprite } from '../../core/mascot.js';
import { THREE, render3d, RoundedBoxGeometry, envMap, textGeo } from '../../core/three.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { K, makeMascot3D, neonEnv, warm3d } from './lib7.js';

const S = shot('K04');
const T_ONE = 91.6, T_PROMPT = 92.18, T_NOW = 93.04, T_OUT = 93.12, T_SWAP = 93.42, T_REAL = 93.64;
const PROMPT = 'one prompt';
const typeTimes = [91.6, 91.7, 91.8, 92.18, 92.26, 92.34, 92.42, 92.5, 92.58, 92.66];

let B = null;
function build() {
  const scene = new THREE.Scene();
  const bgc = document.createElement('canvas'); bgc.width = 16; bgc.height = 256;
  const bx = bgc.getContext('2d'); const g = bx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#A58CFF'); g.addColorStop(0.5, '#E6DEFF'); g.addColorStop(0.75, '#B8F9FF'); g.addColorStop(1, '#7CFFC4');
  bx.fillStyle = g; bx.fillRect(0, 0, 16, 256);
  const bgt = new THREE.CanvasTexture(bgc); bgt.colorSpace = THREE.SRGBColorSpace; scene.background = bgt;
  const cam = new THREE.PerspectiveCamera(34, W / H, 0.1, 200);
  scene.add(new THREE.HemisphereLight('#FFFFFF', '#8E74F0', 1.1));
  const key = new THREE.DirectionalLight('#FFFFFF', 2.2); key.position.set(6, 12, 9); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 40 }); key.shadow.bias = -0.0005;
  scene.add(key);
  const rim = new THREE.DirectionalLight('#3EF0FF', 1.6); rim.position.set(-8, 6, -8); scene.add(rim);
  const env = neonEnv();

  // desk: mirror + tinted gloss layer
  const mirror = new Reflector(new THREE.PlaneGeometry(80, 80), { textureWidth: 1280, textureHeight: 720, color: 0x9C93C8, clipBias: 0.003 });
  mirror.rotation.x = -Math.PI / 2; scene.add(mirror);
  const gloss = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshPhysicalMaterial({ color: '#C9BCFF', metalness: 0.2, roughness: 0.35, transparent: true, opacity: 0.38, envMap: env, envMapIntensity: 0.6 }));
  gloss.rotation.x = -Math.PI / 2; gloss.position.y = 0.002; gloss.receiveShadow = true; scene.add(gloss);
  const shadowCatch = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: 0.28, color: '#2A1A70' }));
  shadowCatch.rotation.x = -Math.PI / 2; shadowCatch.position.y = 0.004; shadowCatch.receiveShadow = true; scene.add(shadowCatch);

  // laptop
  const lap = new THREE.Group(); scene.add(lap);
  const alu = new THREE.MeshPhysicalMaterial({ color: '#C9CEDD', metalness: 1.0, roughness: 0.22, envMap: env, envMapIntensity: 1.0, clearcoat: 0.6 });
  const base = new THREE.Mesh(new RoundedBoxGeometry(6, 0.3, 4.2, 4, 0.12), alu); base.position.y = 0.15; base.castShadow = true; base.receiveShadow = true; lap.add(base);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.02, 2.0), new THREE.MeshStandardMaterial({ color: '#2B2358', roughness: 0.6 })); deck.position.set(0, 0.305, -0.75); lap.add(deck);
  const pad = new THREE.Mesh(new RoundedBoxGeometry(2.0, 0.02, 1.2, 2, 0.05), new THREE.MeshPhysicalMaterial({ color: '#D3D9E8', metalness: 0.6, roughness: 0.35, envMap: env })); pad.position.set(0, 0.305, 1.25); lap.add(pad);
  // keys
  const keys = [];
  const kGeo = new RoundedBoxGeometry(0.34, 0.12, 0.34, 2, 0.05);
  const kMat = new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.45, envMap: env, envMapIntensity: 0.4 });
  for (let r = 0; r < 5; r++) for (let c = 0; c < 13; c++) keys.push({ x: -2.55 + c * 0.425 + (r % 2) * 0.1, z: -1.6 + r * 0.42 });
  keys.push({ x: 0, z: -1.6 + 5 * 0.42, space: true });
  const keyM = new THREE.InstancedMesh(kGeo, kMat, keys.length); keyM.castShadow = true; keyM.receiveShadow = true;
  const kc = new THREE.Color();
  keys.forEach((k, i) => keyM.setColorAt(i, kc.set(i % 7 === 3 ? '#3EF0FF' : i % 11 === 5 ? '#7CFFC4' : '#3A2F78')));
  lap.add(keyM);
  // lid
  const hinge = new THREE.Group(); hinge.position.set(0, 0.3, -2.05); lap.add(hinge);
  const lid = new THREE.Mesh(new RoundedBoxGeometry(6, 4.1, 0.16, 4, 0.07), alu); lid.position.set(0, 2.05, 0); lid.castShadow = true; hinge.add(lid);
  const bezel = new THREE.Mesh(new THREE.PlaneGeometry(5.8, 3.9), new THREE.MeshStandardMaterial({ color: '#0D0A1E', roughness: 0.3 })); bezel.position.set(0, 2.05, 0.081); hinge.add(bezel);
  const scr = document.createElement('canvas'); scr.width = 1024; scr.height = 640;
  const scrTex = new THREE.CanvasTexture(scr); scrTex.colorSpace = THREE.SRGBColorSpace; scrTex.anisotropy = 8;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 3.44), new THREE.MeshBasicMaterial({ map: scrTex, toneMapped: false })); screen.position.set(0, 2.1, 0.085); hinge.add(screen);
  hinge.rotation.x = -0.24;
  // card (flat 2D CURSOR leaving the screen)
  const cardCanvas = mascotSprite('K04card', { t: 93, pose: 'jump' }, 520, 600);
  const cardTex = new THREE.CanvasTexture(cardCanvas); cardTex.colorSpace = THREE.SRGBColorSpace;
  const card = new THREE.Mesh(new THREE.PlaneGeometry(3.12, 3.6), new THREE.MeshBasicMaterial({ map: cardTex, transparent: true, side: THREE.DoubleSide, alphaTest: 0.05 }));
  card.castShadow = true; scene.add(card);
  // 3D CURSOR
  const m3 = makeMascot3D('K04'); m3.group.scale.setScalar(0.9); scene.add(m3.group);
  // REAL — iridescent chrome
  const realMat = new THREE.MeshPhysicalMaterial({ color: '#F2EEFF', metalness: 1, roughness: 0.1, envMap: env, envMapIntensity: 1.25, iridescence: 1, iridescenceIOR: 1.6, iridescenceThicknessRange: [200, 900], clearcoat: 1 });
  const real = new THREE.Mesh(textGeo('REAL', { font: 'Anton', size: 3.6, depth: 1.0, bevel: 0.1 }), realMat); real.castShadow = true;
  real.position.set(-6.4, -3, -2.6); scene.add(real);
  // shockwave ring
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 64), new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 0.8, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.33; scene.add(ring);
  // puff cubes for the 2D→3D inflate
  const puffN = 60, puff = new THREE.InstancedMesh(new RoundedBoxGeometry(0.22, 0.22, 0.22, 1, 0.04), new THREE.MeshBasicMaterial({ color: '#FFFFFF' }), puffN);
  for (let i = 0; i < puffN; i++) puff.setColorAt(i, kc.set([K.cyan, K.mint, K.lilac, '#FFFFFF', '#FF6A1F'][i % 5]));
  scene.add(puff);
  B = { scene, cam, lap, hinge, keys, keyM, screen, scr, scrTex, card, cardCanvas, cardTex, m3, real, ring, puff, puffN,
    m4: new THREE.Matrix4(), q: new THREE.Quaternion(), p: new THREE.Vector3(), s: new THREE.Vector3(), e: new THREE.Euler(), v: new THREE.Vector3(), v2: new THREE.Vector3() };
}

function drawScreen(t) {
  const c = B.scr, x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 640); g.addColorStop(0, '#1C1146'); g.addColorStop(1, '#0B0722');
  x.fillStyle = g; x.fillRect(0, 0, 1024, 640);
  x.strokeStyle = 'rgba(62,240,255,0.08)'; x.lineWidth = 1; x.beginPath(); for (let i = 0; i < 1024; i += 32) { x.moveTo(i, 0); x.lineTo(i, 640); } for (let j = 0; j < 640; j += 32) { x.moveTo(0, j); x.lineTo(1024, j); } x.stroke();
  // title bar
  x.fillStyle = '#2A1E66'; x.fillRect(0, 0, 1024, 44);
  ['#FF5F7A', '#FFD23F', '#7CFFC4'].forEach((cc, i) => { x.fillStyle = cc; x.beginPath(); x.arc(28 + i * 28, 22, 9, 0, TAU); x.fill(); });
  x.fillStyle = '#B79CFF'; font(x, 22, 'JetBrains Mono', '700'); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('cursor — zsh — 100% code', 512, 23);
  // prompt line
  let n = 0; for (const tt of typeTimes) if (t >= tt) n++;
  x.textAlign = 'left'; font(x, 58, 'JetBrains Mono', '800');
  x.fillStyle = '#FF8A3D'; x.fillText('>', 50, 110);
  x.fillStyle = '#7CFFC4'; const typed = PROMPT.slice(0, n); x.fillText(typed, 100, 110);
  const cw = x.measureText(typed).width;
  if (Math.floor(t * 4) % 2 === 0 || n < PROMPT.length) { x.fillStyle = '#FF6A1F'; x.fillRect(104 + cw, 82, 30, 56); }
  font(x, 26, 'JetBrains Mono', '600');
  const lines = [[92.75, '✓ compiling motion ......... ok', '#7CFFC4'], [92.9, '✓ spawning cursor .......... ok', '#7CFFC4'], [93.12, '! cursor.exe left the screen', '#FF8A3D']];
  lines.forEach(([tt, L, cc], i) => { if (t >= tt) { x.fillStyle = cc; x.fillText(L, 54, 176 + i * 38); } });
  // 2D CURSOR on screen: waves, then slams into the glass on "now"
  if (t < T_OUT) {
    const k = ease.inCubic(seg(t, T_NOW - 0.04, T_OUT));
    const s = lerp(0.95, 2.6, k), xx = lerp(760, 512, k), yy = lerp(612, 1000, k);
    const P = k > 0 ? { armL: [-150, -150], armR: [150, -150], legL: [-50, 185], legR: [50, 185], squash: -0.1 * k, rot: 0, bob: 0, look: [0, 0], lean: 0 } : undefined;
    drawMascot(x, { x: xx, y: yy, s, t, pose: 'wave', P, mouth: k > 0.5 ? 'open' : 'smile', eyes: k > 0.6 ? 'star' : 'normal', look: [-0.6, -0.2] });
    if (k > 0.85) { // squashed against the glass: smudge + glare
      x.fillStyle = 'rgba(255,255,255,0.25)'; x.beginPath(); x.ellipse(512, 330, 300, 240, 0, 0, TAU); x.fill();
    }
  } else {
    // ripple where it left
    const a = t - T_OUT;
    for (let i = 0; i < 3; i++) { const r = (a * 900 + i * 90) % 700; x.strokeStyle = `rgba(62,240,255,${Math.max(0, 0.6 - r / 900)})`; x.lineWidth = 6; x.beginPath(); x.ellipse(512, 380, r, r * 0.6, 0, 0, TAU); x.stroke(); }
  }
  // scanline sheen
  x.fillStyle = 'rgba(255,255,255,0.04)'; for (let j = 0; j < 640; j += 4) x.fillRect(0, j, 1024, 1);
  B.scrTex.needsUpdate = true;
}

export default {
  ...S,
  cutIn: 'punch',
  sfx: [{ t: T_NOW, type: 'pop' }, { t: T_SWAP, type: 'zap' }, { t: T_REAL, type: 'boom', gain: 1 }],
  async init() { if (!B) build(); B.cam.position.set(5, 4, 10); B.cam.lookAt(0, 2, 0); B.m3.update({ t: 93 }); await warm3d(B.scene, B.cam); },
  draw(ctx, t, s, E) {
    if (!B) build();
    const lt = s.lt, fx = E.fx;
    const { cam, m4, q, p, s: sc } = B;
    drawScreen(t);

    // keys: depress when a letter lands + shock around the landing point
    const landX = 0.15, landZ = 0.35;
    const lp = t - T_REAL;
    for (let i = 0; i < B.keys.length; i++) {
      const k = B.keys[i];
      let d = 0;
      for (let j = 0; j < typeTimes.length; j++) { const a = t - typeTimes[j]; if (a >= 0 && a < 0.25 && Math.floor(hash(j, 5) * 65) === i) d = Math.max(d, 1 - a / 0.25); }
      if (lp >= 0) { const dist = Math.hypot(k.x - landX, k.z - landZ); const wv = lp * 9 - dist; if (wv > 0) d = Math.max(d, Math.exp(-wv * 1.2) * Math.max(0, Math.sin(wv * 3)) * 1.2); }
      p.set(k.x, 0.36 - d * 0.09 + (lp >= 0 ? Math.max(0, wobble(lp - Math.hypot(k.x, k.z) * 0.08, 5, 6)) * 0.1 : 0), k.z);
      sc.set(k.space ? 7 : 1, 1, 1); m4.compose(p, q.identity(), sc); B.keyM.setMatrixAt(i, m4);
    }
    B.keyM.instanceMatrix.needsUpdate = true;

    // card: emerges from the screen, spins, arcs to the keyboard
    const cu = seg(t, T_OUT, T_SWAP);
    B.card.visible = t >= T_OUT && t < T_SWAP + 0.02;
    if (B.card.visible) {
      mascotSprite('K04card', { t, pose: 'jump', mouth: 'open', eyes: 'star' }, 520, 600); B.cardTex.needsUpdate = true;
      const e = ease.outCubic(cu);
      const start = B.v.set(0, 2.2, -1.8), end = B.v2.set(landX, 1.1, landZ + 0.3);
      B.card.position.set(lerp(start.x, end.x, e), lerp(start.y, end.y, e) + Math.sin(cu * Math.PI) * 1.6, lerp(start.z, end.z, e) + Math.sin(cu * Math.PI) * 1.4);
      B.card.rotation.set(lerp(-0.24, 0, e), e * TAU, Math.sin(cu * Math.PI) * 0.3);
      const scl = lerp(1.05, 1.15, e) * (1 + Math.sin(cu * Math.PI) * 0.25);
      B.card.scale.set(scl, scl, scl);
    }
    // 3D CURSOR
    const m3 = B.m3;
    m3.group.visible = t >= T_SWAP;
    if (m3.group.visible) {
      const f = seg(t, T_SWAP, T_REAL);
      const y = lp < 0 ? lerp(0.85, 0.32, ease.inQuad(f)) : 0.32;
      const inflate = ease.outBack(seg(t, T_SWAP, T_SWAP + 0.12), 3);
      const land = lp >= 0 ? wobble(lp, 3.5, 5) : 0;
      m3.group.position.set(landX, y, landZ);
      m3.group.scale.set(0.9 * lerp(1.1, 1, inflate), 0.9, 0.9 * Math.max(0.02, inflate));
      m3.group.rotation.y = lerp(-0.25, 0.32, ease.outCubic(seg(t, T_SWAP, T_REAL + 0.2)));
      m3.update({ t, pose: lp >= 0.08 ? 'cheer' : 'jump', squash: lp >= 0 ? land * 0.35 : -0.05, eyes: lp >= 0 ? 'star' : 'normal', mouth: lp >= 0 ? 'open' : 'o', armZ: 0.35 });
    }
    // puff cubes at the swap
    const pa = t - T_SWAP;
    for (let i = 0; i < B.puffN; i++) {
      if (pa < 0 || pa > 0.5) { m4.makeScale(0, 0, 0); B.puff.setMatrixAt(i, m4); continue; }
      const a = hash(i, 1) * TAU, b = (hash(i, 2) - 0.3) * 2, sp = 3 + hash(i, 3) * 4;
      p.set(landX + Math.cos(a) * sp * pa, 0.9 + b * sp * pa * 0.6 - 4 * pa * pa, landZ + Math.sin(a) * sp * pa);
      const ss = (1 - pa / 0.5) * (0.6 + hash(i, 4));
      B.e.set(pa * 9 + i, pa * 7, 0); q.setFromEuler(B.e); sc.set(ss, ss, ss); m4.compose(p, q, sc); B.puff.setMatrixAt(i, m4);
    }
    B.puff.instanceMatrix.needsUpdate = true;
    // REAL bursts up through the desk behind the laptop
    const ru = seg(t, T_REAL - 0.02, T_REAL + 0.22);
    B.real.position.y = lerp(-3.4, 1.95, ease.outBack(ru, 1.6));
    B.real.rotation.x = lerp(0.6, -0.05, ease.outCubic(ru));
    B.real.rotation.y = Math.atan2(5.0 + 6.4, 10.4 + 2.6) * 0.8;
    B.real.visible = ru > 0;
    // ring
    B.ring.visible = lp >= 0 && lp < 0.4;
    if (B.ring.visible) { const r = 0.3 + lp * 14; B.ring.scale.set(r, r, r); B.ring.material.opacity = 0.9 * (1 - lp / 0.4); B.ring.position.set(landX, 0.32, landZ); }

    // camera: dolly toward the screen, then pull back to a 3/4 hero on "now"
    const c1 = ease.inOutCubic(seg(t, T_ONE, T_NOW)), c2 = ease.inOutCubic(seg(t, T_NOW, T_REAL + 0.1));
    const px0 = lerp(3.6, 1.4, c1), py0 = lerp(3.3, 2.7, c1), pz0 = lerp(9.6, 6.4, c1);
    const px1 = lerp(px0, 5.0, c2), py1 = lerp(py0, 3.6, c2), pz1 = lerp(pz0, 10.4, c2);
    const drift = lp > 0 ? lp * 0.9 : 0;
    cam.position.set(px1 + drift, py1 + drift * 0.2, pz1 - drift * 0.6);
    cam.lookAt(lerp(0, -0.9, c2), lerp(2.0, 2.1, c2), lerp(-1.4, -0.9, c2));
    cam.fov = lerp(36, 40, c2); cam.updateProjectionMatrix();

    render3d(ctx, B.scene, cam);

    // 2D type overlay: ONE PROMPT chips, NOW IT'S
    fx.bloom = 0.3; fx.bloomThreshold = 0.85;
    const nowK = t >= T_NOW ? Math.exp(-(t - T_NOW) / 0.1) : 0, realK = lp >= 0 ? Math.exp(-lp / 0.12) : 0;
    fx.shake = 8 * nowK + 26 * realK; fx.rgb = 3 + 6 * nowK + 12 * realK; fx.zoom += 0.03 * realK + A.pulse('beat', t, 0.12) * 0.008;
    if (lp >= 0 && lp < 0.05) fx.flash = [1, 1, 1, 0.3];
    if (t >= T_SWAP && t < T_SWAP + 0.04) fx.flash = [0.7, 1, 1, 0.3];
  },
};
