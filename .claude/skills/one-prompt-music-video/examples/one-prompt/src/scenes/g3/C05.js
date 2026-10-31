// C05 — "One prompt," — Voxel explosion.
// CURSOR rebuilt LIVE from ~5,000 cubes: every frame the mascot is rendered into an 84×96 buffer (it dances and
// lip-syncs) and each opaque pixel becomes a Three.js InstancedMesh cube with that pixel's colour, two cubes deep.
// The cubes fly in and assemble on the cut, the camera orbits, on "prompt" (44.2) CURSOR EXPLODES at the lens
// (cubes tumble past the camera), then on the downbeat it rewinds and snaps back together with a squash.
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, hash, wobble, buf, bctx } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { drawMascot, pose } from '../../core/mascot.js';
import { THREE, render3d, envMap, renderer } from '../../core/three.js';
import { popText, confetti } from './_g3.js';

const S = shot('C05');
const SWD = 96, SHT = 106, U = 0.066, LAYERS = 3, SPR = 0.2, MAXI = SWD * SHT * LAYERS + 400;
const T_ASM = 43.6, T_BOOM = 44.2, T_BACK = 44.47, T_SNAP = 44.8;

let R = null;
function build() {
  const scene = new THREE.Scene();
  scene.environment = envMap();
  const camera = new THREE.PerspectiveCamera(35, W / H, 0.1, 300);
  scene.add(new THREE.HemisphereLight(0xfff2ff, 0x7b2ff7, 1.3));
  const key = new THREE.DirectionalLight(0xffffff, 2.6); key.position.set(4, 9, 7); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024); Object.assign(key.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 30 }); key.shadow.bias = -0.002;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xff3e8a, 1.6); rim.position.set(-6, 3, -5); scene.add(rim);
  const geo = new THREE.BoxGeometry(U * 0.9, U * 0.9, U * 0.9);
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.32, metalness: 0.05, envMapIntensity: 0.6 });
  const mesh = new THREE.InstancedMesh(geo, mat, MAXI);
  mesh.castShadow = true; mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.setColorAt(0, new THREE.Color(1, 1, 1));
  mesh.frustumCulled = false;
  scene.add(mesh);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: 0.28, color: 0x2a0e5c }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = 0; floor.receiveShadow = true; scene.add(floor);
  R = { scene, camera, mesh, m: new THREE.Matrix4(), q: new THREE.Quaternion(), e: new THREE.Euler(), p: new THREE.Vector3(), sc: new THREE.Vector3(), col: new THREE.Color() };
  return R;
}

// explosion offset for voxel (i,j,l) at time t → [dx,dy,dz,angle]
function offset(i, j, l, t) {
  const h1 = hash(i, j, 11 + l), h2 = hash(i, j, 12 + l), h3 = hash(i, j, 13 + l);
  const dx = (i - SWD / 2) / SWD, dy = (SHT * 0.55 - j) / SHT;
  // assemble from a cloud at the cut
  const ka = clamp((t - T_ASM) / 0.26);
  let ox = 0, oy = 0, oz = 0, ang = 0;
  if (ka < 1) {
    const e = 1 - ease.outExpo(ka), a = h1 * TAU, r = 6 + h2 * 9;
    ox += Math.cos(a) * r * e; oy += (Math.sin(a) * r * 0.6 + 2) * e; oz += (h3 - 0.3) * 18 * e; ang += e * 9 * h1;
  }
  // explode at the lens
  if (t >= T_BOOM) {
    const tau = Math.min(t, T_BACK) - T_BOOM;
    const vx = dx * (7 + 12 * h1) + (h2 - 0.5) * 5, vy = dy * (6 + 9 * h2) + 2 + (h3 - 0.5) * 4, vz = 16 + 40 * h3 + 12 * (1 - Math.hypot(dx, dy));
    let ex = vx * tau, ey = vy * tau - 6 * tau * tau, ez = vz * tau, ea = (6 + 20 * h1) * tau;
    if (t > T_BACK) { // rewind & snap together
      const k = clamp((t - T_BACK) / (T_SNAP - T_BACK));
      const r = 1 - ease.inOutCubic(k) * (k < 1 ? 1 : 1);
      const w = k < 0.15 ? 1 + 0.25 * Math.sin(k / 0.15 * Math.PI) : r; // tiny anticipation outward
      ex *= w; ey *= w; ez *= w; ea *= w;
    }
    ox += ex; oy += ey; oz += ez; ang += ea;
  }
  return [ox, oy, oz, ang];
}

export default {
  ...S,
  cutIn: 'flash',
  sfx: [{ t: T_ASM + 0.02, type: 'swoosh', gain: 0.7 }, { t: T_BOOM, type: 'boom', gain: 1 }, { t: T_SNAP, type: 'click', gain: 0.9 }],
  async init() { const r = R || build(); renderer().compile(r.scene, r.camera); },
  draw(ctx, t, s, E) {
    const r = R || build();
    const lt = s.lt;
    const kB = t >= T_BOOM ? Math.exp(-(t - T_BOOM) / 0.12) : 0, kS = t >= T_SNAP ? Math.exp(-(t - T_SNAP) / 0.1) : 0;
    const kick = A.pulse('kick', t, 0.12), beat = A.pulse('beat', t, 0.1);

    // ---------- 2D background: purple → pink, marquee ONE PROMPT rows ----------
    const g = ctx.createRadialGradient(W / 2, H * 0.55, 60, W / 2, H * 0.55, 1200);
    g.addColorStop(0, '#FF6FB0'); g.addColorStop(0.4, '#E03AB8'); g.addColorStop(1, '#5B1BD0');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(W / 2, H * 0.55); ctx.rotate(-lt * 0.3); ctx.fillStyle = 'rgba(255,255,255,0.08)';
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 2000, a, a + TAU / 24); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    const flashRow = kB > 0.2 && Math.floor(t * 30) % 2 === 0;
    const row = (y, dir, sz, fill, stroke, phase) => {
      ctx.save(); ctx.font = `400 ${sz}px "Anton"`; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
      const str = 'ONE PROMPT ✦ ';
      const w = ctx.measureText(str).width;
      let x = ((dir * (lt * 520 + phase)) % w + w) % w - w;
      ctx.lineWidth = 10; ctx.lineJoin = 'round';
      for (; x < W; x += w) { ctx.strokeStyle = stroke; ctx.strokeText(str, x, y); ctx.fillStyle = fill; ctx.fillText(str, x, y); }
      ctx.restore();
    };
    row(260, -1, 300, flashRow ? '#FFFFFF' : '#FFE14D', '#2A0E5C', 0);
    row(820, 1, 300, flashRow ? '#FFE14D' : 'rgba(255,255,255,0)', '#FFE14D', 300);

    // ---------- sample the dancing mascot ----------
    const sp = buf('read-C05-sprite', SWD, SHT), sx = bctx(sp);
    sx.setTransform(1, 0, 0, 1, 0, 0); sx.clearRect(0, 0, SWD, SHT);
    const pz = t < T_BOOM ? 'dance' : t < T_SNAP + 0.05 ? 'jump' : 'cheer';
    const PP = pose(pz, t); PP.bob *= 0.25;
    drawMascot(sx, { x: SWD / 2, y: SHT - 3, s: SPR, t, P: PP, mouth: 'auto', eyes: t > T_SNAP ? 'star' : 'normal', glyph: true });
    const px = sx.getImageData(0, 0, SWD, SHT).data;

    // ---------- camera orbit ----------
    const cam = r.camera;
    const yaw = lerp(-0.6, 0.55, ease.inOutQuad(s.u)) + 0.08 * kB;
    const dist = 10.0 - 0.8 * ease.outCubic(clamp(lt / 1.2)) + 1.2 * ease.outExpo(clamp((t - T_BOOM) / 0.25)) * (t < T_BACK ? 1 : 1 - ease.inOutCubic(clamp((t - T_BACK) / 0.33)));
    const cy = 2.55;
    cam.position.set(Math.sin(yaw) * dist, cy + 0.9 + Math.sin(lt * 1.5) * 0.2, Math.cos(yaw) * dist);
    cam.lookAt(0, cy, 0); cam.rotateZ(Math.sin(lt * 2) * 0.03 + 0.05 * kB);

    // ---------- fill instances ----------
    const { mesh, m, q, e, p, sc, col } = r;
    const snapSq = t >= T_SNAP ? 0.22 * wobble(t - T_SNAP, 4, 6) : 0;
    let n = 0;
    for (let j = 0; j < SHT; j++) for (let i = 0; i < SWD; i++) {
      const k4 = (j * SWD + i) * 4;
      if (px[k4 + 3] < 140) continue;
      col.setRGB(px[k4] / 255, px[k4 + 1] / 255, px[k4 + 2] / 255, THREE.SRGBColorSpace);
      for (let l = 0; l < LAYERS; l++) {
        const [ox, oy, oz, ang] = offset(i, j, l, t);
        const bx = (i - SWD / 2) * U, by = (SHT - 3 - j) * U, bz = -l * U * 1.05 + U * 0.5;
        p.set(bx * (1 + snapSq * 0.5) + ox, by * (1 - snapSq) + oy, bz + oz);
        if (ang !== 0) { e.set(ang * 0.7, ang, ang * 0.4); q.setFromEuler(e); } else q.identity();
        const near = p.distanceTo(cam.position);
        sc.setScalar(near < 2.2 ? 0 : 1 + Math.min(1.6, Math.abs(oz) * 0.09));
        m.compose(p, q, sc);
        mesh.setMatrixAt(n, m);
        if (l > 0) { col.multiplyScalar(0.8); }
        mesh.setColorAt(n, col);
        n++;
      }
    }
    // a few stray floating cubes for depth
    for (let k = 0; k < 160 && n < MAXI; k++) {
      const a = hash(k, 1) * TAU + lt * (0.3 + hash(k, 2)), rr = 3.6 + hash(k, 3) * 4.5;
      p.set(Math.cos(a) * rr, 0.3 + hash(k, 4) * 5.5 + Math.sin(lt * 2 + k) * 0.3, Math.sin(a) * rr - 1.5);
      e.set(lt * 2 + k, lt * 3 + k, 0); q.setFromEuler(e); sc.setScalar(1.6 + hash(k, 5) * 2.5);
      m.compose(p, q, sc); mesh.setMatrixAt(n, m);
      col.set(['#FFE14D', '#FFFFFF', '#3EF0FF', '#FF3E8A', '#FF7A1A'][k % 5]); mesh.setColorAt(n, col); n++;
    }
    mesh.count = n;
    mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true;

    confetti(ctx, t - T_SNAP, { x: W / 2, y: H * 0.5, n: 120, seed: 51, speed: 2300, size: 1.5, life: 0.5 });
    render3d(ctx, r.scene, cam, { toneMapping: THREE.NoToneMapping });

    E.fx.shake = 44 * kB + 20 * kS + 8 * kick; E.fx.rgb = 14 * kB + 8 * kS + 3; E.fx.zoom = 0.06 * kB + 0.04 * kS;
    E.fx.flash = [1, 1, 1, 0.35 * kB + 0.25 * kS];
    E.fx.bloom = 0.3 + 0.4 * kB; E.fx.bloomThreshold = 0.82; E.fx.vignette = 0.22;
    E.fx.radialBlur = 0.35 * kB;
  },
};
