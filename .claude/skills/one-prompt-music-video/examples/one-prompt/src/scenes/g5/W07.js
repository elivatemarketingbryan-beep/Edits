// W07 — "and it's sitting right here" — Three.js studio product shot: the SKILL box (RoundedBoxGeometry,
// orange clearcoat physical material, ">_ SKILL" face decal, studio envMap reflections) drops onto a white
// pedestal (squash + settle), a ring of type orbits it, a FREE hang-tag swings on a string (damped pendulum),
// product callouts draw on, and RIGHT / HERE slam with bouncing arrows on the words.
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, font, buf, bctx, roundRect, wobble, rng } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { THREE, render3d, envMap, RoundedBoxGeometry } from '../../core/three.js';
import { C, slam, hit, kick, arrowDown, sparkle, grid } from './_g5.js';

const S = shot('W07');
const T0 = S.start;
const T_LAND = 66.3, T_RIGHT = 66.86, T_HERE = 67.12;

function faceCanvas() {
  const c = buf('W07-face', 512, 512), x = bctx(c);
  x.fillStyle = '#FF6A1F'; x.fillRect(0, 0, 512, 512);
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillStyle = '#1F2A55'; font(x, 170, 'JetBrains Mono', '800'); x.fillText('>_', 256, 196);
  font(x, 120, 'Anton'); x.fillText('SKILL', 256, 352);
  font(x, 26, 'JetBrains Mono', '800'); x.fillStyle = 'rgba(31,42,85,0.7)'; x.fillText('v1.0 · ONE PROMPT', 256, 436);
  return c;
}
function tagCanvas() {
  const c = buf('W07-tag', 512, 300), x = bctx(c);
  x.clearRect(0, 0, 512, 300);
  x.beginPath(); x.moveTo(90, 10); x.lineTo(500, 10); x.lineTo(500, 290); x.lineTo(90, 290); x.lineTo(10, 150); x.closePath();
  x.fillStyle = '#FFFFFF'; x.fill(); x.lineWidth = 12; x.strokeStyle = C.black; x.stroke();
  x.beginPath(); x.arc(70, 150, 18, 0, TAU); x.fillStyle = C.black; x.fill();
  x.fillStyle = C.red; font(x, 150, 'Anton'); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('FREE', 300, 135);
  font(x, 40, 'JetBrains Mono', '800'); x.fillStyle = C.black; x.fillText('$0.00', 300, 245);
  x.strokeStyle = C.red; x.lineWidth = 6; x.beginPath(); x.moveTo(220, 250); x.lineTo(380, 236); x.stroke();
  return c;
}
function ringCanvas() {
  const c = buf('W07-ring', 2048, 128), x = bctx(c);
  x.clearRect(0, 0, 2048, 128);
  font(x, 92, 'Anton'); x.textBaseline = 'middle'; x.textAlign = 'left';
  const str = 'FREE ★ OPEN ★ ONE PROMPT ★ NO SPONSOR ★ ';
  let px = 0; x.lineJoin = 'round';
  while (px < 2048) { x.lineWidth = 12; x.strokeStyle = C.black; x.strokeText(str, px, 66); x.fillStyle = '#FFFFFF'; x.fillText(str, px, 66); px += x.measureText(str).width; }
  return c;
}

let R = null;
function build() {
  const scene = new THREE.Scene();
  scene.environment = envMap();
  const cam = new THREE.PerspectiveCamera(28, W / H, 0.1, 100);
  // pedestal
  const ped = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 3.2, 96), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.42, clearcoat: 0.4, envMapIntensity: 0.8 }));
  ped.position.y = -1.6; ped.castShadow = true; ped.receiveShadow = true; scene.add(ped);
  const trim = new THREE.Mesh(new THREE.CylinderGeometry(1.12, 1.12, 0.09, 96), new THREE.MeshPhysicalMaterial({ color: 0x2b2bff, roughness: 0.3, clearcoat: 1 }));
  trim.position.y = -0.22; scene.add(trim);
  // box
  const geo = new RoundedBoxGeometry(1.2, 1.2, 1.2, 8, 0.2);
  const base = { color: 0xff5a10, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 0.55 };
  const faceTex = new THREE.CanvasTexture(faceCanvas()); faceTex.colorSpace = THREE.SRGBColorSpace; faceTex.anisotropy = 8;
  const mSide = new THREE.MeshPhysicalMaterial(base);
  const mFace = new THREE.MeshPhysicalMaterial({ ...base, color: 0xffffff, map: faceTex });
  const box = new THREE.Mesh(geo, [mSide, mSide, mSide, mSide, mFace, mFace]);
  box.castShadow = true; box.receiveShadow = true;
  const boxG = new THREE.Group(); boxG.add(box); scene.add(boxG);
  // hang tag on a string from the top-right corner
  const tagTex = new THREE.CanvasTexture(tagCanvas()); tagTex.colorSpace = THREE.SRGBColorSpace;
  const pivot = new THREE.Group(); pivot.position.set(0.52, 0.52, 0.52); box.add(pivot);
  const swing = new THREE.Group(); pivot.add(swing);
  const str = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.5, 6), new THREE.MeshBasicMaterial({ color: 0x0e0e12 }));
  str.position.y = -0.25; swing.add(str);
  const tag = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 0.5), new THREE.MeshStandardMaterial({ map: tagTex, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.6 }));
  tag.position.set(0.34, -0.72, 0.02); tag.rotation.z = 0; tag.castShadow = true; swing.add(tag);
  // orbiting type ring
  const ringTex = new THREE.CanvasTexture(ringCanvas()); ringTex.colorSpace = THREE.SRGBColorSpace; ringTex.wrapS = THREE.RepeatWrapping; ringTex.repeat.set(2, 1); ringTex.anisotropy = 8;
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.55, 0.26, 128, 1, true), new THREE.MeshBasicMaterial({ map: ringTex, transparent: true, alphaTest: 0.35, side: THREE.DoubleSide }));
  scene.add(ring);
  // lights
  scene.add(new THREE.HemisphereLight(0xffffff, 0x3a3aff, 0.9));
  const key = new THREE.DirectionalLight(0xffffff, 2.4); key.position.set(-3.5, 7, 4.5); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); key.shadow.radius = 4; key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02;
  const sc = key.shadow.camera; sc.left = -4; sc.right = 4; sc.top = 4; sc.bottom = -4; sc.near = 1; sc.far = 20;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xa8b0ff, 1.6); rim.position.set(4, 2.5, -4); scene.add(rim);
  // floor (shadow catcher)
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: 0.28, color: 0x00004a }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -3.2; floor.receiveShadow = true; scene.add(floor);
  R = { scene, cam, box, boxG, swing, ring, tag };
}

const toScreen = (v, cam) => { const p = v.clone().project(cam); return [(p.x * 0.5 + 0.5) * W, (-p.y * 0.5 + 0.5) * H]; };

export default {
  ...S,
  cutIn: 'punch',
  sfx: [{ t: 66.3, type: 'impact', gain: 0.9 }, { t: 66.86, type: 'stamp', gain: 0.7 }, { t: 67.12, type: 'pop', gain: 0.9 }],
  init() { build(); R.cam.position.set(0, 2, 8); R.cam.lookAt(0, 1, 0); render3d(bctx(buf('W07-warm', 64, 36)), R.scene, R.cam); },
  draw(ctx, t, s, E) {
    if (!R) build();
    const lt = s.lt;
    const land = t - T_LAND;

    // ---- 2D studio sweep background ----
    const g = ctx.createRadialGradient(W / 2, 520, 80, W / 2, 560, 1150);
    g.addColorStop(0, '#6A6AFF'); g.addColorStop(0.45, C.blue); g.addColorStop(1, '#1414A8');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalAlpha = 0.16; grid(ctx, 96, '#fff', 2, 0, lt * 40); ctx.restore();
    // floor sweep (lighter band at the bottom)
    const fg = ctx.createLinearGradient(0, 760, 0, H); fg.addColorStop(0, 'rgba(255,255,255,0)'); fg.addColorStop(1, 'rgba(255,255,255,0.28)');
    ctx.fillStyle = fg; ctx.fillRect(0, 760, W, H - 760);
    // light rays from behind the pedestal on the beat
    const bp = A.pulse('beat', t, 0.2);
    ctx.save(); ctx.translate(W / 2, 560); ctx.rotate(lt * 0.25);
    ctx.fillStyle = `rgba(255,255,255,${0.07 + 0.08 * bp})`;
    for (let i = 0; i < 16; i++) { ctx.rotate(TAU / 16); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(1400, -110); ctx.lineTo(1400, 110); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    // giant outline type behind
    ctx.save(); ctx.globalAlpha = 0.5; font(ctx, 420, 'Anton'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = 4; ctx.strokeStyle = '#fff'; ctx.strokeText('RIGHT HERE', W / 2 + Math.sin(lt * 1.5) * 20, 600); ctx.restore();

    // ---- camera + box animation ----
    const orbit = 0.42 - lt * 0.22, rad = 7.3 - lt * 0.7, camY = 1.75 + lt * 0.1;
    R.cam.position.set(Math.sin(orbit) * rad, camY, Math.cos(orbit) * rad); R.cam.lookAt(0, 0.95, 0); R.cam.updateMatrixWorld();
    let by, sqY = 1;
    if (land < 0) { const u = clamp((t - T0) / (T_LAND - T0)); by = lerp(2.75, 0.6, u * u); sqY = 1.14; }
    else { by = 0.6; sqY = 1 - 0.22 * wobble(land, 3.2, 6); }
    const sq = sqY, sxz = 1 / Math.sqrt(sq);
    R.boxG.position.set(0, by - (1 - sq) * 0.6, 0); R.boxG.scale.set(sxz, sq, sxz);
    const here = kick(t, T_HERE, 0.2);
    R.box.rotation.set(0, -0.95 + lt * 0.55 + (land < 0 ? -land * 1.5 : 0), 0);
    R.boxG.position.y += 0.06 * Math.sin(lt * 5) * clamp(land * 4) + 0.08 * here;
    // tag pendulum: kicked by the landing and by "here"
    const sw = 0.9 * wobble(Math.max(0, land), 1.8, 1.6) + 0.7 * (t > T_HERE ? wobble(t - T_HERE, 2.2, 2) : 0);
    R.swing.rotation.set(0.25 * Math.sin(lt * 3), lt * 0.4, sw);
    R.tag.rotation.y = t > T_HERE ? ease.outBack(clamp((t - T_HERE) / 0.35)) * TAU : 0;
    R.ring.position.y = 0.55 + 0.05 * Math.sin(lt * 3); R.ring.rotation.set(0.12, -lt * 1.4, -0.08);
    R.ring.scale.setScalar(land < 0 ? 0.001 : ease.outBack(clamp(land / 0.25)));

    // contact shadow under the pedestal + glow pool
    const pedBase = toScreen(new THREE.Vector3(0, -3.2, 0), R.cam);
    const cg = ctx.createRadialGradient(pedBase[0], pedBase[1], 10, pedBase[0], pedBase[1], 420);
    cg.addColorStop(0, 'rgba(0,0,40,0.45)'); cg.addColorStop(1, 'rgba(0,0,40,0)');
    ctx.save(); ctx.translate(pedBase[0], pedBase[1]); ctx.scale(1, 0.18); ctx.translate(-pedBase[0], -pedBase[1]); ctx.fillStyle = cg; ctx.fillRect(pedBase[0] - 500, pedBase[1] - 500, 1000, 1000); ctx.restore();

    render3d(ctx, R.scene, R.cam, { toneMapping: THREE.NoToneMapping, exposure: 1 });

    // ---- landing shock ring on the pedestal top ----
    const top = toScreen(new THREE.Vector3(0, 0, 0), R.cam);
    if (land > 0 && land < 0.45) {
      const u = ease.outCubic(land / 0.45);
      ctx.save(); ctx.translate(top[0], top[1] + 10); ctx.scale(1, 0.26);
      ctx.strokeStyle = `rgba(255,255,255,${1 - u})`; ctx.lineWidth = 26 * (1 - u) + 2; ctx.beginPath(); ctx.arc(0, 0, 200 + 700 * u, 0, TAU); ctx.stroke(); ctx.restore();
      const r = rng(3);
      for (let i = 0; i < 26; i++) { const a = r() * TAU, sp = r.range(300, 900), x = top[0] + Math.cos(a) * sp * land, y = top[1] + Math.sin(a) * sp * land * 0.3 - 500 * land + 1600 * land * land; ctx.fillStyle = i % 3 ? '#fff' : C.orange; ctx.fillRect(x - 5, y - 5, 10, 10); }
    }

    // ---- product callouts ----
    const call = (k, t0, anchor, lx, ly, title, val) => {
      const u = ease.outExpo(clamp((t - t0) / 0.25)); if (u <= 0) return;
      const a = toScreen(anchor, R.cam);
      const ex = lerp(a[0], lx, u), ey = lerp(a[1], ly, u);
      ctx.strokeStyle = C.white; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.fillStyle = C.white; ctx.beginPath(); ctx.arc(a[0], a[1], 9, 0, TAU); ctx.fill(); ctx.strokeStyle = C.black; ctx.lineWidth = 3; ctx.stroke();
      if (u > 0.6) {
        const left = lx < W / 2;
        font(ctx, 26, 'JetBrains Mono', '800'); const w1 = ctx.measureText(title).width; font(ctx, 54, 'Anton'); const w2 = ctx.measureText(val).width;
        const bw = Math.max(w1, w2) + 40, bx = left ? ex - bw : ex, byy = ey - 50;
        ctx.fillStyle = C.black; ctx.fillRect(bx + 8, byy + 8, bw, 104); ctx.fillStyle = C.white; ctx.fillRect(bx, byy, bw, 104);
        ctx.fillStyle = C.blue; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; font(ctx, 26, 'JetBrains Mono', '800'); ctx.fillText(title, bx + 20, byy + 26);
        ctx.fillStyle = C.black; font(ctx, 54, 'Anton'); ctx.fillText(val, bx + 20, byy + 70);
      }
    };
    call(0, 66.42, new THREE.Vector3(-0.62, 0.95, 0.3), 470, 500, 'SIZE', '1 PROMPT');
    call(1, 66.56, new THREE.Vector3(-0.5, 0.15, 0.6), 430, 760, 'BUILT', 'LOCALLY');
    call(2, 66.7, new THREE.Vector3(0.62, 0.3, -0.2), 1500, 640, 'PRICE', '$0.00');

    // ---- RIGHT HERE + arrows ----
    const boxTop = toScreen(new THREE.Vector3(0, 1.35, 0), R.cam);
    if (t > T_RIGHT) {
      const a = hit(t, T_RIGHT, 0.16), b = hit(t, T_HERE, 0.16);
      slam(ctx, 'RIGHT', W / 2 - 250, 190, 200, { fill: C.white, shadow: C.black, sx: 12, sy: 12, scale: a, rot: -0.04 });
      if (t > T_HERE) slam(ctx, 'HERE', W / 2 + 250, 190, 200, { fill: C.red, shadow: C.black, sx: 12, sy: 12, scale: b, rot: 0.04, lw: 10, stroke: C.black });
      const bounce = Math.abs(Math.sin((t - T_RIGHT) * 9)) * 26;
      [-170, 0, 170].forEach((dx, i) => {
        const d = clamp((t - T_RIGHT - i * 0.05) / 0.18); if (d <= 0) return;
        arrowDown(ctx, boxTop[0] + dx * 1.3, boxTop[1] - 95 + (1 - ease.outBounce(d)) * -300 + bounce * (i === 1 ? 1 : 0.6), i === 1 ? 1.15 : 0.85, i === 1 ? C.red : C.white);
      });
    }
    // sparkles on the box on beats + "here"
    const sp = Math.max(A.pulse('beat', t, 0.15), here);
    if (land > 0) {
      const pts = [[-0.6, 0.6, 0.6], [0.6, 0.6, -0.6], [-0.6, -0.5, 0.6], [0.6, 0.6, 0.6]];
      pts.forEach((p, i) => { const q = toScreen(new THREE.Vector3(...p).applyMatrix4(R.box.matrixWorld), R.cam); sparkle(ctx, q[0], q[1], (30 + 40 * sp) * (0.6 + 0.4 * Math.sin(t * 9 + i * 2)), '#fff', t * 2 + i); });
    }

    const lk = kick(t, T_LAND, 0.12);
    E.fx.shake = 18 * lk + 10 * kick(t, T_RIGHT, 0.08) + 14 * here;
    E.fx.zoom += 0.03 * lk + 0.025 * here;
    E.fx.rgb = 5 * lk + 4 * here;
    E.fx.bloom = 0.25; E.fx.bloomThreshold = 0.9;
    E.fx.vignette = 0.25;
  },
};
