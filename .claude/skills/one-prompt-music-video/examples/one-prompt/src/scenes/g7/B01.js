// B01 · "Thank you for subbing," — bridge, warm & half-time. A giant glossy 3D SUBSCRIBE pill on a plinth;
// the 3D CURSOR waves "thank you", hops and STOMPS it on "subbing": the button squashes (spring), flips grey
// SUBSCRIBED ✓, a gold bell (lathe geometry) swings as a damped pendulum θ(t)=θ0·e^(−γt)·cos(ωt) with a
// lagging clapper and rings out ripple arcs; extruded 3D hearts float up. Handwritten "thank you" on top.
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, seg, hash, font, wobble, heart as heart2d } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { THREE, render3d, RoundedBoxGeometry, envMap, textGeo } from '../../core/three.js';
import { makeMascot3D, warm3d } from './lib7.js';

const S = shot('B01');
const T_THANK = 106.22, T_HOP = 106.98, T_PRESS = 107.32;
const BTN_H = 2.4, PLINTH = 0.5;

let B = null;
function build() {
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(34, W / H, 0.1, 200);
  scene.add(new THREE.HemisphereLight('#FFF4EA', '#FF8FB1', 1.25));
  const key = new THREE.DirectionalLight('#FFE2C8', 2.2); key.position.set(-6, 12, 10); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 50 }); key.shadow.bias = -0.0004;
  scene.add(key);
  const rim = new THREE.DirectionalLight('#C9B6FF', 1.2); rim.position.set(8, 5, -8); scene.add(rim);
  const env = envMap();
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.ShadowMaterial({ color: '#B0425F', opacity: 0.28 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  // plinth + button
  const plinth = new THREE.Mesh(new RoundedBoxGeometry(10.4, PLINTH, 3.8, 4, 0.2), new THREE.MeshPhysicalMaterial({ color: '#5A2346', roughness: 0.4, clearcoat: 0.6, envMap: env, envMapIntensity: 0.5 }));
  plinth.position.y = PLINTH / 2; plinth.castShadow = true; plinth.receiveShadow = true; scene.add(plinth);
  const btnG = new THREE.Group(); btnG.position.y = PLINTH; scene.add(btnG);
  const red = new THREE.MeshPhysicalMaterial({ color: '#FF2A3A', roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.08, envMap: env, envMapIntensity: 0.8 });
  const grey = new THREE.MeshPhysicalMaterial({ color: '#B8B2C6', roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.1, envMap: env, envMapIntensity: 0.7 });
  const btn = new THREE.Mesh(new RoundedBoxGeometry(9, BTN_H, 2.8, 6, 0.62), red); btn.position.y = BTN_H / 2; btn.castShadow = true; btn.receiveShadow = true; btnG.add(btn);
  const white = new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', roughness: 0.25, clearcoat: 1, envMap: env, envMapIntensity: 0.4 });
  const tSub = new THREE.Mesh(textGeo('SUBSCRIBE', { font: 'Anton', size: 1.12, depth: 0.16, bevel: 0.03 }), white); tSub.position.set(0, BTN_H / 2, 1.42); btnG.add(tSub);
  const tDone = new THREE.Group(); tDone.position.set(0, BTN_H / 2, 1.42); btnG.add(tDone);
  const ink = new THREE.MeshPhysicalMaterial({ color: '#4A3A66', roughness: 0.3, clearcoat: 1, envMap: env, envMapIntensity: 0.4 });
  const tD = new THREE.Mesh(textGeo('SUBSCRIBED', { font: 'Anton', size: 1.0, depth: 0.16, bevel: 0.03 }), ink); tD.position.x = -0.55; tDone.add(tD);
  const ck = new THREE.Shape(); ck.moveTo(-0.45, 0.05); ck.lineTo(-0.15, -0.3); ck.lineTo(0.48, 0.42); ck.lineTo(0.32, 0.55); ck.lineTo(-0.15, 0.0); ck.lineTo(-0.3, 0.2); ck.closePath();
  const check = new THREE.Mesh(new THREE.ExtrudeGeometry(ck, { depth: 0.16, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2 }), new THREE.MeshPhysicalMaterial({ color: '#21B57A', roughness: 0.3, clearcoat: 1 }));
  check.position.set(3.25, -0.05, -0.08); tDone.add(check);
  tDone.visible = false;
  // bell (lathe) on a rope, upper right
  const prof = [[0, 1.25], [0.18, 1.24], [0.34, 1.12], [0.43, 0.9], [0.47, 0.6], [0.52, 0.35], [0.64, 0.14], [0.84, 0.0], [0.86, -0.06], [0.0, -0.06]].map(([x, y]) => new THREE.Vector2(x, y));
  const gold = new THREE.MeshPhysicalMaterial({ color: '#FFB000', metalness: 1, roughness: 0.22, envMap: env, envMapIntensity: 1.3, clearcoat: 0.6 });
  const bellPivot = new THREE.Group(); bellPivot.position.set(6.2, 6.9, 0.2); bellPivot.scale.setScalar(1.25); scene.add(bellPivot);
  const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 3, 8), new THREE.MeshStandardMaterial({ color: '#5A2346' })); rope.position.y = 1.5; bellPivot.add(rope);
  const bellG = new THREE.Group(); bellPivot.add(bellG);
  const bell = new THREE.Mesh(new THREE.LatheGeometry(prof, 48), gold); bell.position.y = -1.6; bell.castShadow = true; bellG.add(bell);
  const knob = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.06, 10, 24), gold); knob.position.y = -0.28; bellG.add(knob);
  const clapP = new THREE.Group(); clapP.position.y = -0.6; bellG.add(clapP);
  const clap = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), gold); clap.position.y = -1.15; clapP.add(clap);
  // hearts (extruded)
  const hs = new THREE.Shape(); hs.moveTo(0, -0.35); hs.bezierCurveTo(-1.1, 0.35, -0.45, 1.05, 0, 0.45); hs.bezierCurveTo(0.45, 1.05, 1.1, 0.35, 0, -0.35);
  const hGeo = new THREE.ExtrudeGeometry(hs, { depth: 0.25, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 3, curveSegments: 16 }); hGeo.center();
  const HN = 18, hearts = new THREE.InstancedMesh(hGeo, new THREE.MeshPhysicalMaterial({ color: '#fff', roughness: 0.25, clearcoat: 1, envMap: env, envMapIntensity: 0.5 }), HN);
  const hc = new THREE.Color(); for (let i = 0; i < HN; i++) hearts.setColorAt(i, hc.set(['#FF3E6C', '#FF8FB1', '#FF5A8A', '#FFB38A'][i % 4]));
  scene.add(hearts);
  // press ring
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.06, 8, 64), new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true })); ring.rotation.x = -Math.PI / 2; scene.add(ring);
  const dummy = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.01, 0.01), grey); dummy.position.set(0, -50, 0); dummy.visible = false; scene.add(dummy);
  const m3 = makeMascot3D('B01'); m3.group.scale.setScalar(1.05); scene.add(m3.group);
  B = { scene, cam, btnG, btn, red, grey, tSub, tDone, bellPivot, bellG, clapP, bell, hearts, HN, ring, m3,
    m4: new THREE.Matrix4(), q: new THREE.Quaternion(), p: new THREE.Vector3(), s: new THREE.Vector3(), e: new THREE.Euler(), v: new THREE.Vector3() };
}

// damped pendulum (analytic) — kicked by the press
const bellAngle = (t) => { const a = t - T_PRESS - 0.05; return a < 0 ? Math.sin(t * 2.2) * 0.04 : 0.62 * Math.exp(-1.15 * a) * Math.sin(TAU * 1.55 * a); };
const clapAngle = (t) => { const a = t - T_PRESS - 0.1; return a < 0 ? 0 : -0.5 * Math.exp(-1.0 * a) * Math.sin(TAU * 1.55 * a - 0.9); };

export default {
  ...S,
  cutIn: 'flash',
  async init() { if (!B) build(); B.cam.position.set(0, 4, 17); B.cam.lookAt(0, 3, 0); B.m3.update({ t: 107 }); await warm3d(B.scene, B.cam); },
  sfx: [{ t: T_PRESS, type: 'click', gain: 1 }, { t: T_PRESS + 0.12, type: 'bell', gain: 0.9 }, { t: T_PRESS + 0.05, type: 'pop' }],
  draw(ctx, t, s, E) {
    if (!B) build();
    const lt = s.lt, fx = E.fx, pa = t - T_PRESS;
    // ---------- warm background: gradient, slow sunburst, bokeh ----------
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#FF9E8A'); g.addColorStop(0.45, '#FFC2A0'); g.addColorStop(1, '#FFF1E4');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(W / 2, 760); ctx.rotate(lt * 0.12); ctx.globalAlpha = 0.18;
    for (let i = 0; i < 24; i++) { ctx.fillStyle = i % 2 ? '#FFFFFF' : '#FFD9B8'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 1800, (i / 24) * TAU, ((i + 0.5) / 24) * TAU); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    ctx.save();
    for (let i = 0; i < 22; i++) {
      const bx = hash(i, 1) * W, by = (hash(i, 2) * H - lt * (20 + hash(i, 3) * 40) + H) % H, br = 20 + hash(i, 4) * 70;
      ctx.globalAlpha = 0.18 + hash(i, 5) * 0.2; ctx.fillStyle = ['#FFFFFF', '#FFE07A', '#FF8FB1', '#C9B6FF'][i % 4];
      ctx.beginPath(); ctx.arc(bx, by, br, 0, TAU); ctx.fill();
    }
    ctx.restore();

    // ---------- button press physics ----------
    const press = pa < 0 ? 0 : pa < 0.07 ? ease.outQuad(pa / 0.07) : 1;
    const dip = pa < 0 ? 0 : 0.42 * press - (pa > 0.07 ? (0.42 - 0.16) * (1 - Math.exp(-(pa - 0.07) * 9)) + wobble(pa - 0.07, 3.2, 4) * 0.06 : 0);
    const sy = 1 - dip;
    B.btn.scale.set(1 + dip * 0.12, sy, 1 + dip * 0.06); B.btn.position.y = BTN_H * sy / 2;
    const done = pa >= 0.04;
    B.btn.material = done ? B.grey : B.red;
    B.tSub.visible = !done; B.tDone.visible = done;
    const flipT = done ? ease.outBack(clamp((pa - 0.04) / 0.25), 2) : 0;
    B.tDone.position.y = BTN_H * sy / 2; B.tDone.rotation.x = (1 - flipT) * -Math.PI / 2; B.tDone.scale.setScalar(Math.max(0.01, flipT));
    B.tSub.position.y = BTN_H * sy / 2;
    const topY = PLINTH + BTN_H * sy;
    // ---------- CURSOR: wave → hop → stomp → happy bounce ----------
    const m3 = B.m3;
    const x0 = -6.3, y0 = 0;
    let mx = x0, my = y0, pz = 0.6, poseName = 'wave', squash = 0, eyes = 'happy', mouth = 'auto', rot = 0;
    if (t >= T_HOP - 0.12 && t < T_HOP) { squash = 0.25 * ease.outQuad((t - (T_HOP - 0.12)) / 0.12); poseName = 'cheer'; eyes = 'normal'; }
    else if (t >= T_HOP && pa < 0) {
      const u = (t - T_HOP) / (T_PRESS - T_HOP);
      mx = lerp(x0, 0, ease.inOutQuad(u)); my = lerp(y0, PLINTH + BTN_H, u) + Math.sin(u * Math.PI) * 2.0; pz = lerp(0.6, 0.3, u);
      poseName = 'jump'; squash = -0.15 * Math.sin(u * Math.PI); eyes = 'star'; mouth = 'open'; rot = -0.4 * Math.sin(u * Math.PI);
    } else if (pa >= 0) {
      mx = 0; pz = 0.3; my = topY; poseName = 'cheer'; eyes = 'heart'; mouth = 'open';
      squash = pa < 0.3 ? wobble(pa, 3, 6) * 0.35 : 0;
      const bt = A.beat(t), hopK = pa > 0.35 ? Math.abs(Math.sin(bt.phase * Math.PI)) * 0.6 : 0; my += hopK;
    }
    m3.group.position.set(mx, my, pz);
    m3.group.rotation.y = pa >= 0 ? Math.sin(lt * 2) * 0.15 : t >= T_HOP ? 0.3 : 0.35;
    m3.update({ t, pose: poseName, squash, eyes, mouth, rot, armZ: 0.3 });
    // ---------- bell ----------
    B.bellG.rotation.z = bellAngle(t);
    B.clapP.rotation.z = clapAngle(t);
    // ---------- hearts ----------
    const { m4, q, p, s: sc, e } = B;
    for (let i = 0; i < B.HN; i++) {
      const a = pa - i * 0.035;
      if (a < 0) { m4.makeScale(0, 0, 0); B.hearts.setMatrixAt(i, m4); continue; }
      const side = (i % 2 ? 1 : -1) * (1.8 + hash(i, 1) * 3.4);
      p.set(side + Math.sin(a * 4 + i) * 0.4, PLINTH + BTN_H * 0.6 + a * (3.0 + hash(i, 2) * 2.2), -0.6 + hash(i, 3) * 1.2);
      const ss = ease.outBack(clamp(a / 0.25), 3) * (0.3 + hash(i, 4) * 0.28) * (1 + A.pulse('beat', t, 0.1) * 0.15);
      e.set(0.2 * Math.sin(a * 3 + i), Math.sin(a * 2.5 + i) * 0.8, Math.sin(a * 3.3 + i) * 0.3); q.setFromEuler(e); sc.set(ss, ss, ss);
      m4.compose(p, q, sc); B.hearts.setMatrixAt(i, m4);
    }
    B.hearts.instanceMatrix.needsUpdate = true;
    B.ring.visible = pa >= 0 && pa < 0.45;
    if (B.ring.visible) { const r = 1 + pa * 18; B.ring.scale.set(r, r, 1); B.ring.material.opacity = 1 - pa / 0.45; B.ring.position.set(0, topY + 0.05, 0.3); }
    // ---------- camera ----------
    const cam = B.cam, cu = ease.inOutCubic(seg(t, S.start, S.end));
    cam.position.set(lerp(-1.2, 0.6, cu), lerp(4.4, 3.8, cu), lerp(18.5, 16.2, cu));
    cam.lookAt(lerp(-0.4, 0.4, cu), 3.45, 0);
    render3d(ctx, B.scene, cam);

    // ---------- 2D: bell ripples, handwritten thank you ----------
    B.v.set(6.2, 6.9 - 1.9 * 1.25, 0.2).project(cam);
    const bx = (B.v.x * 0.5 + 0.5) * W, by = (-B.v.y * 0.5 + 0.5) * H;
    if (pa > 0.05) {
      ctx.save(); ctx.lineCap = 'round';
      for (let k = 0; k < 6; k++) {
        const born = 0.1 + k * 0.3, a = pa - born; if (a < 0 || a > 0.55) continue;
        const r = 110 + a * 340, al = 1 - a / 0.55;
        ctx.strokeStyle = `rgba(255,255,255,${al})`; ctx.lineWidth = 10 * al + 2;
        for (const sd of [-1, 1]) { ctx.beginPath(); ctx.arc(bx, by, r, sd > 0 ? -0.5 : Math.PI - 0.5, sd > 0 ? 0.5 : Math.PI + 0.5); ctx.stroke(); }
      }
      ctx.restore();
    }
    // handwritten "thank you" revealed left→right, then "for subbing ♥"
    ctx.save();
    const rv = ease.inOutCubic(seg(t, T_THANK, T_THANK + 0.6));
    font(ctx, 170, 'Caveat', '700'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const tw = ctx.measureText('thank you').width;
    const TX = 470; ctx.beginPath(); ctx.rect(TX - tw / 2 - 30, 110, (tw + 60) * rv, 260); ctx.clip();
    ctx.translate(TX, 232); ctx.rotate(-0.05);
    ctx.lineWidth = 16; ctx.strokeStyle = '#7A2A4A'; ctx.lineJoin = 'round'; ctx.strokeText('thank you', 0, 0);
    ctx.fillStyle = '#FFFFFF'; ctx.fillText('thank you', 0, 0);
    ctx.restore();
    const fs = ease.outBack(seg(t, 107.06, 107.22), 2);
    if (fs > 0) {
      ctx.save(); ctx.translate(480, 368); ctx.rotate(-0.03); ctx.scale(fs, fs);
      font(ctx, 54, 'Rubik Mono One'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 12; ctx.strokeStyle = '#7A2A4A'; ctx.lineJoin = 'round'; ctx.strokeText('FOR SUBBING', 0, 0); ctx.fillStyle = '#FFE07A'; ctx.fillText('FOR SUBBING', 0, 0);
      ctx.fillStyle = '#FF3E6C'; heart2d(ctx, 290, 8, 30); ctx.fill(); ctx.restore();
    }
    // FX
    const hit = pa >= 0 ? Math.exp(-pa / 0.12) : 0;
    fx.shake = hit * 16; fx.rgb = 1 + hit * 6; fx.zoom += hit * 0.03;
    if (pa >= 0 && pa < 0.034) fx.flash = [1, 0.95, 0.9, 0.35];
    fx.bloom = 0.25; fx.bloomThreshold = 0.82; fx.vignette = 0.3;
  },
};
