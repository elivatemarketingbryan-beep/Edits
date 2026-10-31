// K06 · "On autopilot, let it fly" — bullet time. The 3D CURSOR is frozen mid-jump above a frozen splash crown,
// frozen confetti and motion streaks (time ×0.03). The camera orbits 180° around the moment; on the downbeat a wall
// of light sweeps through the frozen world flipping it lilac → mint (two clipped floors + per-instance recolour +
// a matching 2D sky wipe). On "fly" time snaps back to ×1: CURSOR rockets out of frame, confetti bursts, FLY pops.
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, seg, hash, font, roundRect, wobble } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { THREE, render3d, renderer, RoundedBoxGeometry, textGeo } from '../../core/three.js';
import { K, makeMascot3D, neonEnv, chromeText, warm3d } from './lib7.js';

const S = shot('K06');
const T_AUTO = 96.64, T_FLIP = 97.27, T_FLY = 98.94;
const AZ0 = -1.17; // orbit start azimuth
const AZF = AZ0 + Math.PI * 0.64; // direction the frozen CURSOR faces (face reads from mid-orbit on)
const LIL = ['#B79CFF', '#FFFFFF', '#FF9AE0', '#7A5CFF', '#3EF0FF'];
const MNT = ['#7CFFC4', '#FFFFFF', '#3EF0FF', '#1FC98E', '#FFF07A'];

let B = null;
function build() {
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(40, W / H, 0.1, 300);
  scene.add(new THREE.HemisphereLight('#FFFFFF', '#9A86E8', 1.2));
  const key = new THREE.DirectionalLight('#FFFFFF', 2.0); key.position.set(4, 14, 6); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: 1, far: 40 });
  scene.add(key);
  const env = neonEnv();
  // floors (lilac keeps x > seam, mint keeps x < seam)
  const pL = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0), pM = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0);
  const gridTex = (bg, ln) => {
    const c = document.createElement('canvas'); c.width = c.height = 1024; const x = c.getContext('2d');
    x.fillStyle = bg; x.fillRect(0, 0, 1024, 1024); x.strokeStyle = ln; x.lineWidth = 4;
    for (let i = 0; i <= 32; i++) { x.beginPath(); x.moveTo(i * 32, 0); x.lineTo(i * 32, 1024); x.moveTo(0, i * 32); x.lineTo(1024, i * 32); x.stroke(); }
    const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.repeat.set(4, 4); tx.anisotropy = 8; return tx;
  };
  const floorGeo = new THREE.CircleGeometry(40, 96);
  const fL = new THREE.Mesh(floorGeo, new THREE.MeshStandardMaterial({ map: gridTex('#D6C9FF', 'rgba(110,80,230,0.35)'), roughness: 0.6, clippingPlanes: [pL] }));
  const fM = new THREE.Mesh(floorGeo, new THREE.MeshStandardMaterial({ map: gridTex('#B9FFE2', 'rgba(20,160,110,0.35)'), roughness: 0.6, clippingPlanes: [pM] }));
  for (const f of [fL, fM]) { f.rotation.x = -Math.PI / 2; f.receiveShadow = true; scene.add(f); }
  // FLY lying on the floor, readable from the end of the orbit
  const flyMatL = new THREE.MeshPhysicalMaterial({ color: '#8C6CFF', metalness: 0.7, roughness: 0.2, envMap: env, clearcoat: 1, clippingPlanes: [pL] });
  const flyMatM = new THREE.MeshPhysicalMaterial({ color: '#4B2FD0', metalness: 0.5, roughness: 0.25, envMap: env, clearcoat: 1, clippingPlanes: [pM] });
  const flyGeo = textGeo('FLY', { font: 'Anton', size: 4.4, depth: 0.35, bevel: 0.06 });
  const flyG = new THREE.Group(); scene.add(flyG);
  const azEnd = AZ0 + Math.PI;
  flyG.position.set(-Math.sin(azEnd) * 5.2, 0.2, -Math.cos(azEnd) * 5.2);
  flyG.rotation.y = azEnd;
  for (const m of [flyMatL, flyMatM]) { const me = new THREE.Mesh(flyGeo, m); me.rotation.x = -Math.PI / 2; me.castShadow = true; me.receiveShadow = true; flyG.add(me); }
  // CURSOR
  const m3 = makeMascot3D('K06', { depth: 1.25 }); m3.group.scale.setScalar(0.95); scene.add(m3.group);
  // frozen confetti
  const CN = 1100, conf = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.2, 0.12), new THREE.MeshStandardMaterial({ color: '#fff', side: THREE.DoubleSide, roughness: 0.5, metalness: 0.1 }), CN);
  const cd = [];
  for (let i = 0; i < CN; i++) {
    const a = hash(i, 1) * TAU, r = 1.3 + Math.pow(hash(i, 2), 0.8) * 5.2, y = 0.4 + hash(i, 3) * 7;
    const v = new THREE.Vector3(Math.cos(a), 0.6 + hash(i, 4), Math.sin(a)).multiplyScalar(2 + hash(i, 5) * 4);
    cd.push({ p: new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r), v, rx: hash(i, 6) * TAU, ry: hash(i, 7) * TAU, spin: (hash(i, 8) - 0.5) * 14, ci: i % 5 });
  }
  scene.add(conf);
  // frozen splash crown (chrome drops stretched along their velocity)
  const DN = 70, drops = new THREE.InstancedMesh(new THREE.SphereGeometry(0.11, 16, 10), new THREE.MeshPhysicalMaterial({ color: '#E8F6FF', metalness: 0.9, roughness: 0.05, envMap: env, envMapIntensity: 1.3 }), DN);
  drops.castShadow = true;
  const dd = [];
  for (let i = 0; i < DN; i++) { const a = (i / DN) * TAU + hash(i, 9) * 0.2, k = hash(i, 10); dd.push({ a, r: 0.9 + k * 1.2, y: 0.15 + Math.sin(k * Math.PI) * 1.3 + hash(i, 11) * 0.4, s: 0.45 + hash(i, 12) * 0.7 }); }
  scene.add(drops);
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 0.9, 0.5, 48, 1, true), new THREE.MeshPhysicalMaterial({ color: '#E8F6FF', metalness: 0.9, roughness: 0.05, envMap: env, side: THREE.DoubleSide, transparent: true, opacity: 0.85 }));
  crown.position.y = 0.25; scene.add(crown);
  const pool = new THREE.Mesh(new THREE.CircleGeometry(1.6, 48), new THREE.MeshPhysicalMaterial({ color: '#DDF6FF', metalness: 1, roughness: 0.04, envMap: env }));
  pool.rotation.x = -Math.PI / 2; pool.position.y = 0.01; scene.add(pool);
  // frozen motion streaks under the jump
  const SN = 34, streaks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.02, 0.02, 1, 6), new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 0.75 }), SN);
  const sd = []; for (let i = 0; i < SN; i++) { const a = hash(i, 13) * TAU, r = 0.3 + hash(i, 14) * 1.0; sd.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, y: 0.6 + hash(i, 15) * 1.2, l: 0.8 + hash(i, 16) * 2.2 }); }
  scene.add(streaks);
  // the light wall
  const wc = document.createElement('canvas'); wc.width = 256; wc.height = 4; const wx = wc.getContext('2d');
  const wg = wx.createLinearGradient(0, 0, 256, 0); wg.addColorStop(0, 'rgba(255,255,255,0)'); wg.addColorStop(0.45, 'rgba(124,255,196,0.5)'); wg.addColorStop(0.5, 'rgba(255,255,255,1)'); wg.addColorStop(0.55, 'rgba(183,156,255,0.5)'); wg.addColorStop(1, 'rgba(255,255,255,0)');
  wx.fillStyle = wg; wx.fillRect(0, 0, 256, 4);
  const wt = new THREE.CanvasTexture(wc); wt.colorSpace = THREE.SRGBColorSpace;
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(4, 40), new THREE.MeshBasicMaterial({ map: wt, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  wall.rotation.y = Math.PI / 2; scene.add(wall);
  B = { scene, cam, pL, pM, m3, conf, cd, CN, drops, dd, DN, crown, streaks, sd, SN, wall, flyG, flyMatL, flyMatM, c: new THREE.Color(),
    m4: new THREE.Matrix4(), q: new THREE.Quaternion(), p: new THREE.Vector3(), s: new THREE.Vector3(), e: new THREE.Euler(), v: new THREE.Vector3(), up: new THREE.Vector3(0, 1, 0) };
}

// effective (bullet) time: ×0.03 until "fly", then real time
const teOf = (t) => (t < T_FLY ? (t - S.start) * 0.03 : (T_FLY - S.start) * 0.03 + (t - T_FLY));

export default {
  ...S,
  cutIn: 'punch',
  sfx: [{ t: 96.32, type: 'whoosh', gain: 0.6 }, { t: T_FLIP, type: 'zap' }, { t: T_FLY, type: 'firework', gain: 1 }],
  async init() { if (!B) build(); B.cam.position.set(10, 5, 10); B.cam.lookAt(0, 3, 0); B.m3.update({ t: 97 }); await warm3d(B.scene, B.cam, { clip: true }); },
  draw(ctx, t, s, E) {
    if (!B) build();
    const lt = s.lt, fx = E.fx, te = teOf(t), fl = t - T_FLY;
    const { cam, m4, q, p, s: sc, e } = B;
    // ---------- camera: 180° orbit ----------
    const ou = ease.inOutSine ? ease.inOutSine(seg(t, S.start, T_FLY)) : ease.inOutCubic(seg(t, S.start, T_FLY));
    const az = AZ0 + Math.PI * ou + (fl > 0 ? fl * 0.15 : 0);
    const R = lerp(11.8, 12.6, ou), camY = lerp(3.0, 7.6, ou);
    const look = fl > 0 ? lerp(3.1, 9, ease.inOutCubic(clamp(fl / 0.6))) : 3.1;
    cam.position.set(Math.sin(az) * R, camY + (fl > 0 ? ease.outCubic(clamp(fl / 0.6)) * 1.5 : 0), Math.cos(az) * R);
    cam.lookAt(0, look, 0);
    // ---------- the seam (wall of light) ----------
    const sx = lerp(-16, 16, ease.inOutCubic(seg(t, T_FLIP - 0.32, T_FLIP + 0.32)));
    B.pL.constant = -sx; B.pM.constant = sx;
    B.wall.position.set(sx, 10, 0); B.wall.visible = t > T_FLIP - 0.34 && t < T_FLIP + 0.36;
    // ---------- 2D sky with matching wipe ----------
    const proj = (x, y, z) => { B.v.set(x, y, z).project(cam); return [(B.v.x * 0.5 + 0.5) * W, (-B.v.y * 0.5 + 0.5) * H, B.v.z]; };
    const skyL = ctx.createLinearGradient(0, 0, 0, H); skyL.addColorStop(0, '#8E70FF'); skyL.addColorStop(0.6, '#E3DAFF'); skyL.addColorStop(1, '#F6F2FF');
    const skyM = ctx.createLinearGradient(0, 0, 0, H); skyM.addColorStop(0, '#16C98C'); skyM.addColorStop(0.6, '#C6FFE8'); skyM.addColorStop(1, '#F2FFF9');
    ctx.fillStyle = skyL; ctx.fillRect(0, 0, W, H);
    // mint region = world x < sx → find its screen-space half-plane using two points on the seam
    const a1 = proj(sx, 0, -60), a2 = proj(sx, 30, -60), a3 = proj(sx - 1, 0, -60);
    if (sx > -16) {
      if (sx >= 16) { ctx.fillStyle = skyM; ctx.fillRect(0, 0, W, H); }
      else {
        let dx = a2[0] - a1[0], dy = a2[1] - a1[1]; const L = Math.hypot(dx, dy) || 1; dx /= L; dy /= L;
        let nx = -dy, ny = dx; if ((a3[0] - a1[0]) * nx + (a3[1] - a1[1]) * ny < 0) { nx = -nx; ny = -ny; }
        const cx = a1[0], cy = a1[1], F = 4000;
        ctx.save(); ctx.beginPath(); ctx.moveTo(cx - dx * F, cy - dy * F); ctx.lineTo(cx + dx * F, cy + dy * F); ctx.lineTo(cx + dx * F + nx * F, cy + dy * F + ny * F); ctx.lineTo(cx - dx * F + nx * F, cy - dy * F + ny * F); ctx.closePath();
        ctx.fillStyle = skyM; ctx.fill(); ctx.restore();
      }
    }
    // giant faint orbit rings in the sky
    ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 3;
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(W / 2, H * 0.62, 500 + i * 220, 90 + i * 40, 0, (az * 0.5 + i) % TAU, ((az * 0.5 + i) % TAU) + 4.4); ctx.stroke(); }
    ctx.restore();

    // ---------- CURSOR ----------
    const m3 = B.m3;
    const launch = fl > 0 ? ease.inQuad(clamp(fl / 0.55)) : 0;
    const hy = 2.1 + te * 0.4 + launch * 16 + (fl > 0 ? -Math.exp(-fl / 0.05) * 0.25 : 0);
    m3.group.position.set(0, hy, 0);
    m3.group.rotation.y = AZF + (fl > 0 ? ease.outBack(clamp(fl / 0.25)) * (az - AZF) * 0.9 : 0);
    m3.group.rotation.x = fl > 0 ? -0.2 * launch : 0.12;
    const st = fl > 0 ? 1 + launch * 0.5 : 1;
    m3.group.scale.set(0.95 / Math.sqrt(st), 0.95 * st, 0.95 / Math.sqrt(st));
    const P = fl > 0 ? { armL: [-70, -230], armR: [70, -230], legL: [-30, 200], legR: [30, 205], squash: 0, rot: 0, bob: 0, look: [0, -0.5], lean: 0 }
      : { armL: [-170, -160], armR: [165, -175], legL: [-70, 140], legR: [55, 120], squash: -0.08, rot: -0.06, bob: 0, look: [0.3, -0.2], lean: 0.05 };
    m3.update({ t: fl > 0 ? t : S.start + te, P, eyes: fl > 0 ? 'wink' : 'star', mouth: fl > 0 ? 'open' : 'grin', blink: 0, armZ: 0.3, legZ: 0.1 });
    // ---------- confetti ----------
    const cBurst = fl > 0 ? fl : 0;
    for (let i = 0; i < B.CN; i++) {
      const d = B.cd[i];
      const tt = te + cBurst * 1.5;
      p.set(d.p.x + d.v.x * tt * 0.4, d.p.y + d.v.y * tt * 0.4 - 2.5 * tt * tt * 0.4, d.p.z + d.v.z * tt * 0.4);
      e.set(d.rx + d.spin * tt, d.ry + d.spin * 0.7 * tt, 0); q.setFromEuler(e);
      const pulse = 1 + A.pulse('beat', t, 0.1) * 0.25;
      sc.set(pulse, pulse, pulse); m4.compose(p, q, sc); B.conf.setMatrixAt(i, m4);
      B.conf.setColorAt(i, B.c.set(p.x < sx ? MNT[d.ci] : LIL[d.ci]));
    }
    B.conf.instanceMatrix.needsUpdate = true; B.conf.instanceColor.needsUpdate = true;
    // drops (frozen crown; fall after fly)
    for (let i = 0; i < B.DN; i++) {
      const d = B.dd[i], tt = te;
      const r = d.r + tt * 1.5, y = Math.max(0.05, d.y + tt * 2 - 6 * tt * tt);
      p.set(Math.cos(d.a) * r, y, Math.sin(d.a) * r);
      B.v.set(Math.cos(d.a) * 0.5, 1 - tt * 5, Math.sin(d.a) * 0.5).normalize(); q.setFromUnitVectors(B.up, B.v);
      sc.set(d.s * 0.8, d.s * 1.9, d.s * 0.8); m4.compose(p, q, sc); B.drops.setMatrixAt(i, m4);
    }
    B.drops.instanceMatrix.needsUpdate = true;
    B.crown.scale.set(1 + te * 0.6, Math.max(0.01, 1 - te * 0.8), 1 + te * 0.6);
    // streaks
    for (let i = 0; i < B.SN; i++) {
      const d = B.sd[i];
      const op = fl > 0 ? Math.max(0, 1 - fl * 4) : 1;
      p.set(d.x, hy - d.y - d.l / 2 + (fl > 0 ? -fl * 6 : 0), d.z); sc.set(1, d.l * (1 + launch * 3) * op + 0.001, 1);
      m4.compose(p, q.identity(), sc); B.streaks.setMatrixAt(i, m4);
    }
    B.streaks.instanceMatrix.needsUpdate = true;
    // FLY pops on "fly"
    const fp = fl > 0 ? wobble(fl, 4, 5) : 0;
    B.flyG.scale.set(1 + fp * 0.15, 1 + Math.max(0, fp) * 1.8, 1 + fp * 0.15);

    const R3 = renderer(); R3.localClippingEnabled = true;
    render3d(ctx, B.scene, cam);
    R3.localClippingEnabled = false;

    // ---------- 2D overlay: autopilot HUD ----------
    const ak = ease.outBack(seg(t, T_AUTO, T_AUTO + 0.2));
    if (ak > 0) {
      ctx.save(); ctx.translate(W / 2, 168); ctx.scale(ak * 0.85, ak * 0.85);
      const on = fl > 0;
      ctx.fillStyle = on ? '#FF6A1F' : '#1A1240'; roundRect(ctx, -330, -40, 660, 80, 40); ctx.fill();
      ctx.lineWidth = 5; ctx.strokeStyle = '#FFFFFF'; ctx.stroke();
      ctx.fillStyle = Math.floor(t * 6) % 2 && !on ? '#FF4F6E' : '#7CFFC4'; ctx.beginPath(); ctx.arc(-282, 0, 13, 0, TAU); ctx.fill();
      font(ctx, 34, 'Rubik Mono One'); ctx.fillStyle = '#FFFFFF'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(on ? 'TAKE OFF!' : 'AUTOPILOT', 10, 2);
      ctx.restore();
      // time-scale readout
      ctx.save(); font(ctx, 26, 'JetBrains Mono', '800'); ctx.textAlign = 'center'; ctx.fillStyle = '#1A1240';
      const ts = fl > 0 ? Math.min(1, 0.03 + fl * 6) : 0.03;
      ctx.fillText(`TIME ×${ts.toFixed(2)}  ·  ORBIT ${Math.round(clamp(ou) * 180)}°`, W / 2, 238);
      ctx.restore();
    }
    // big FLY flash type on the word
    if (fl > 0) {
      const k = ease.outExpo(clamp(fl / 0.2));
      ctx.save(); ctx.globalAlpha = clamp(1 - (fl - 0.45) / 0.25);
      chromeText(ctx, 'FLY!', W / 2, 520, { size: 360 * (0.6 + 0.4 * k), fill: 'chrome', shadow: 18, skew: -0.12 });
      ctx.restore();
    }
    // FX
    const fk = fl > 0 ? Math.exp(-fl / 0.12) : 0, flipK = Math.exp(-Math.abs(t - T_FLIP) / 0.08);
    fx.bloom = 0.3 + flipK * 0.3; fx.bloomThreshold = 0.8;
    fx.shake = fk * 22 + flipK * 6; fx.rgb = 2 + fk * 12 + flipK * 6; fx.zoom += fk * 0.05;
    if (fl > 0) { fx.radialBlur = clamp(0.8 * Math.exp(-fl / 0.25)); fx.center = [0.5, 0.6]; }
    if (fl >= 0 && fl < 0.04) fx.flash = [1, 1, 1, 0.5];
    if (t < T_FLY) { fx.saturation = 0.95; fx.vignette = 0.35; }
  },
};
