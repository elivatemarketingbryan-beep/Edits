// C01 — "One prompt," — THE DROP. Chrome title slam.
// Extruded 3D Anton letters (Three.js TextGeometry, one mesh per glyph) with mirror-chrome faces reflecting a
// hand-painted candy environment map (PMREM of a 2D canvas) and hot-pink candy sides.
// 38.30 white → letters of ONE rocket at the lens out of a warp of speed lines through spinning sunburst rays;
// SLAM on the sung "One" (38.97), PROMPT drops in from the sky and thuds (39.30–39.42), the bass DROP (39.667)
// punches everything + confetti, then the camera dives through the counter of the O into the next shot.
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, hash, wobble, buf, bctx, halftone } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { THREE, render3d, fonts3d, TextGeometry, renderer } from '../../core/three.js';
import { confetti, speedLines } from './_g3.js';

const S = shot('C01');
const END = 39.95;              // C02 starts here (override in C02.js)
const T_ONE = 38.97, T_PROMPT = 39.30, T_DROP = 39.667, T_DIVE = 39.72;

let R = null;
function candyEnv() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0.0, '#2A0E5C'); g.addColorStop(0.22, '#7B2FF7'); g.addColorStop(0.38, '#FF3E8A');
  g.addColorStop(0.485, '#FFD0E4'); g.addColorStop(0.5, '#FFFFFF'); g.addColorStop(0.515, '#3A1050');
  g.addColorStop(0.6, '#FF7A1A'); g.addColorStop(0.78, '#FFE14D'); g.addColorStop(1.0, '#FF3E8A');
  x.fillStyle = g; x.fillRect(0, 0, 1024, 512);
  // soft boxes + a dark band so the chrome reads as metal
  x.fillStyle = '#FFFFFF';
  [[120, 120, 150, 60], [560, 90, 220, 70], [860, 150, 90, 120], [330, 170, 70, 40]].forEach(([a, b, w, h]) => x.fillRect(a, b, w, h));
  x.fillStyle = 'rgba(20,6,40,0.85)'; x.fillRect(0, 300, 1024, 26);
  x.fillStyle = 'rgba(255,255,255,0.9)'; x.fillRect(0, 410, 1024, 10);
  const tex = new THREE.CanvasTexture(c); tex.mapping = THREE.EquirectangularReflectionMapping; tex.colorSpace = THREE.SRGBColorSpace;
  const pm = new THREE.PMREMGenerator(renderer());
  const env = pm.fromEquirectangular(tex).texture; pm.dispose();
  return env;
}

const FACE_VS = `
varying float vY; varying vec3 vWP;
void main(){ vY = position.y; vec4 wp = modelMatrix * vec4(position, 1.); vWP = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const FACE_FS = `
uniform float uHalf, uSweep, uFlash; varying float vY; varying vec3 vWP;
void main(){
  float h = clamp(vY / uHalf * 0.5 + 0.5, 0., 1.);
  vec3 col;
  if (h > 0.53) { float k = (h - 0.53) / 0.47; col = mix(vec3(1.0, 0.84, 0.95), vec3(0.30, 0.08, 0.72), smoothstep(0., 1., k)); }
  else if (h > 0.47) { col = vec3(1.0); }
  else { float k = (0.47 - h) / 0.47; col = mix(vec3(0.40, 0.02, 0.32), vec3(1.0, 0.86, 0.22), smoothstep(0.0, 1., k)); }
  col += vec3(0.35) * smoothstep(0.016, 0., abs(h - 0.8)) + vec3(0.25) * smoothstep(0.014, 0., abs(h - 0.18));
  float sw = exp(-pow((vWP.x * 0.42 + vWP.y * 0.75 - uSweep) * 1.5, 2.));
  col = mix(col, vec3(1.), sw * 0.9);
  col = mix(col, vec3(1.), uFlash);
  gl_FragColor = vec4(col, 1.);
}`;

function build() {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, W / H, 0.05, 400);
  scene.environment = candyEnv();
  scene.add(new THREE.HemisphereLight(0xffffff, 0xff5aa0, 1.5));
  const dl = new THREE.DirectionalLight(0xffffff, 2.4); dl.position.set(-4, 6, 8); scene.add(dl);
  const side = new THREE.MeshPhysicalMaterial({ color: 0xff3e8a, metalness: 0.3, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 1.1 });
  const font = fonts3d.Anton;
  const letters = [], faces = [];
  const group = new THREE.Group(); scene.add(group);
  const line = (str, size, y, depth, row) => {
    const face = new THREE.ShaderMaterial({ vertexShader: FACE_VS, fragmentShader: FACE_FS, uniforms: { uHalf: { value: 1 }, uSweep: { value: -100 }, uFlash: { value: 0 } } });
    faces.push(face);
    let pen = 0, hMax = 0; const items = [];
    for (const ch of str) {
      const gl = font.data.glyphs[ch]; const adv = gl.ha * size / 1000;
      const geo = new TextGeometry(ch, { font, size, depth, curveSegments: 10, bevelEnabled: true, bevelThickness: size * 0.04, bevelSize: size * 0.028, bevelSegments: 4 });
      geo.computeBoundingBox(); const b = geo.boundingBox;
      const cx = (b.max.x + b.min.x) / 2, cy = (b.max.y + b.min.y) / 2, cz = (b.max.z + b.min.z) / 2;
      geo.translate(-cx, -cy, -cz);
      hMax = Math.max(hMax, b.max.y - b.min.y);
      const mesh = new THREE.Mesh(geo, [face, side]);
      group.add(mesh);
      items.push({ mesh, x: pen + cx, y: y + cy, row, ch, h: b.max.y - b.min.y });
      pen += adv + size * 0.035;
    }
    face.uniforms.uHalf.value = hMax / 2;
    const wdt = pen - size * 0.035;
    items.forEach((it) => { it.x -= wdt / 2; });
    return items;
  };
  const one = line('ONE', 3.1, 0.15, 1.1, 0);
  const prompt = line('PROMPT', 2.25, -2.85, 0.85, 1);
  const all = [...one, ...prompt];
  let top = -1e9, bot = 1e9;
  all.forEach((it) => { top = Math.max(top, it.y + it.h / 2); bot = Math.min(bot, it.y - it.h / 2); });
  const yMid = (top + bot) / 2;
  all.forEach((it, i) => {
    it.i = i; it.y -= yMid;
    it.ax = new THREE.Vector3(hash(i, 1) - 0.5, hash(i, 2) - 0.5, hash(i, 3) - 0.5).normalize();
    letters.push(it);
  });
  R = { scene, camera, group, letters, faces, oLetter: one[0], q: new THREE.Quaternion() };
  return R;
}

function landT(it) {
  if (it.row === 0) return T_ONE - 0.02 + it.i * 0.022;
  return T_PROMPT - 0.06 + (it.i - 3) * 0.03;
}

const RAYS = ['#FF3E8A', '#FF7A1A'];
function sunburst(ctx, t, cx, cy, ang, boost) {
  // rays
  const n = 22;
  for (let i = 0; i < n; i++) {
    const a0 = ang + (i / n) * TAU, a1 = a0 + TAU / n;
    ctx.fillStyle = RAYS[i % 2];
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a0) * 2600, cy + Math.sin(a0) * 2600); ctx.lineTo(cx + Math.cos(a1) * 2600, cy + Math.sin(a1) * 2600); ctx.closePath(); ctx.fill();
  }
  // thin counter-rotating yellow rays
  ctx.fillStyle = `rgba(255,225,77,${0.35 + 0.4 * boost})`;
  ctx.beginPath();
  for (let i = 0; i < 44; i++) {
    const a = -ang * 0.6 + (i / 44) * TAU, w = 0.012;
    ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a - w) * 2600, cy + Math.sin(a - w) * 2600); ctx.lineTo(cx + Math.cos(a + w) * 2600, cy + Math.sin(a + w) * 2600); ctx.closePath();
  }
  ctx.fill();
  // hot core
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 760 + 300 * boost);
  g.addColorStop(0, 'rgba(255,251,230,1)'); g.addColorStop(0.22, 'rgba(255,225,77,0.95)'); g.addColorStop(0.55, 'rgba(255,170,60,0.35)'); g.addColorStop(1, 'rgba(255,120,60,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

export default {
  ...S,
  cutIn: 'none',
  sfx: [{ t: 38.3, type: 'boom', gain: 0.6 }, { t: T_ONE, type: 'impact', gain: 1 }, { t: T_PROMPT + 0.05, type: 'impact', gain: 0.8 }, { t: T_DROP, type: 'boom', gain: 1 }, { t: T_DIVE, type: 'whoosh', gain: 0.9 }],
  async init() { const r = R || build(); renderer().compile(r.scene, r.camera); },
  draw(ctx, t, s, E) {
    const r = R || build();
    const lt = s.lt, frame = E.frame;
    const kOne = t >= T_ONE ? Math.exp(-(t - T_ONE) / 0.12) : 0;
    const kPr = t >= T_PROMPT + 0.06 ? Math.exp(-(t - T_PROMPT - 0.06) / 0.1) : 0;
    const kDrop = t >= T_DROP ? Math.exp(-(t - T_DROP) / 0.14) : 0;
    const boost = Math.max(kOne, kPr * 0.7, kDrop);
    const dive = ease.inExpo(clamp((t - T_DIVE) / (END - T_DIVE)));

    // ---------- 2D background ----------
    const spinBase = 0.5 * lt + 1.6 * ease.outExpo(clamp((t - T_ONE) / 0.5)) + 1.2 * ease.outExpo(clamp((t - T_DROP) / 0.6)) + 0.6 * ease.outExpo(clamp((t - T_PROMPT) / 0.4));
    const bcx = W / 2 + Math.sin(lt * 2.1) * 30, bcy = H * 0.48;
    ctx.fillStyle = '#FF3E8A'; ctx.fillRect(0, 0, W, H);
    sunburst(ctx, t, bcx, bcy, spinBase, boost);
    // pop-art dots in the corners
    halftone(ctx, 26, 'rgba(123,47,247,0.35)', (x, y) => { const d = Math.hypot(x - bcx, y - bcy) / 1100; return Math.max(0, d - 0.45) * 22; }, lt * 40, 0);
    // warp streaks while letters approach
    const approach = 1 - clamp((t - T_ONE) / 0.15);
    if (approach > 0) speedLines(ctx, bcx, bcy, 70, 140, 1500, frame, `rgba(255,255,255,${0.55 * approach})`, 3, 0.006);
    if (kDrop > 0.05 || t > T_DIVE) speedLines(ctx, bcx, bcy, 90, 260, 1700, frame, `rgba(255,255,255,${0.5 * Math.max(kDrop, dive)})`, 9, 0.008);

    // shockwave rings
    for (const [T0, col] of [[T_ONE, '#FFFFFF'], [T_PROMPT + 0.06, '#FFE14D'], [T_DROP, '#FFFFFF']]) {
      const a = t - T0; if (a < 0 || a > 0.45) continue;
      const rr = 120 + 1500 * ease.outCubic(a / 0.45);
      ctx.strokeStyle = col; ctx.globalAlpha = 1 - a / 0.45; ctx.lineWidth = 40 * (1 - a / 0.45) + 4;
      ctx.beginPath(); ctx.ellipse(bcx, bcy, rr, rr * 0.62, 0, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1;
    }
    // confetti behind the type
    confetti(ctx, t - T_DROP, { x: bcx, y: bcy, n: 90, seed: 4, speed: 2200, size: 1.4, life: 1.2 });

    // ---------- 3D letters ----------
    const cam = r.camera;
    const camZ = 17.8 - lt * 1.1 + (t > T_DROP ? -0.45 * (1 - Math.exp(-(t - T_DROP) * 7)) : 0);
    const yaw = Math.sin(lt * 1.7) * 0.11 - 0.04, pitch = -0.05 + Math.sin(lt * 1.3) * 0.03;
    let px = Math.sin(yaw) * camZ, py = Math.sin(pitch) * camZ, pz = Math.cos(yaw) * camZ;
    let tx = 0, ty = 0, tz = 0;
    const O = r.oLetter;
    if (dive > 0) { // fly into the counter of the O
      const e = dive, e2 = ease.outCubic(clamp((t - T_DIVE) / (END - T_DIVE)));
      px = lerp(px, O.x, e2); py = lerp(py, O.y, e2); pz = lerp(pz, 1.55, e);
      tx = lerp(0, O.x, e2); ty = lerp(0, O.y, e2); tz = lerp(0, -10, e2);
    }
    cam.position.set(px, py, pz); cam.lookAt(tx, ty, tz);
    cam.fov = 30 - 4 * dive; cam.updateProjectionMatrix();
    cam.rotateZ(Math.sin(lt * 1.1) * 0.025 + (kOne - kDrop) * 0.03 + 0.5 * dive);

    const dropPunch = t >= T_DROP ? 0.055 * wobble(t - T_DROP, 3.5, 6) : 0;
    r.group.scale.setScalar(1 + dropPunch);
    for (const it of r.letters) {
      const L = landT(it), m = it.mesh;
      const a = t - L;
      let x = it.x, y = it.y, z = 0, ang = 0, sq = 0, flip = 0;
      if (it.row === 0) {
        // rockets at the lens from deep space, tumbling
        const dur = L - 38.3 + 0.05, k = clamp((t - (L - dur)) / dur);
        if (a < 0) {
          // spiral in: orbit the lens axis on a shrinking ring while rushing forward
          const e = ease.inCubic(k), ph = (1 - e) * 2.6 * Math.PI + it.i * (TAU / 3) + 0.4, rad = (1 - e) * 6.5;
          x = it.x * e + Math.cos(ph) * rad;
          y = it.y * e + Math.sin(ph) * rad * 0.62;
          z = lerp(-34, 0, e); ang = (1 - e) * (4 + hash(it.i, 9) * 4);
        } else { z = 2.4 * wobble(a, 3.2, 7); sq = 0.2 * wobble(a, 5, 8); }
      } else {
        // stands up from lying flat (domino in reverse), pivoting on its baseline
        const dur = 0.2;
        if (a < 0) flip = -Math.PI / 2 * (1 - ease.inQuad(clamp((t - (L - dur)) / dur)));
        else flip = 0.32 * Math.sin(a * 22) * Math.exp(-a * 9);
        const hh = it.h / 2;
        y = it.y - hh + hh * Math.cos(flip); z = hh * Math.sin(flip);
        if (a > 0) sq = 0.16 * wobble(a, 5, 9);
      }
      if (a > 0.15) { const bp = A.pulse('beat', t, 0.1); y += 0.1 * bp * Math.sin(it.i * 1.3 + t * 3); }
      m.position.set(x, y, z);
      r.q.setFromAxisAngle(it.ax, ang); m.quaternion.copy(r.q);
      if (flip) m.rotateX(-flip);
      if (a > 0) m.rotateY(Math.sin(t * 2.4 + it.i) * 0.05);
      m.scale.set(1 + sq * 0.6, 1 - sq, 1 + sq * 0.6);
      m.visible = !(it.row === 1 && t < L - 0.2);
    }
    // chrome glint sweeps after each hit
    let sweep = -100;
    for (const T0 of [T_ONE + 0.04, T_PROMPT + 0.12, T_DROP + 0.02]) { const a = t - T0; if (a >= 0 && a < 0.5) sweep = lerp(-14, 14, ease.inOutQuad(a / 0.5)); }
    for (const f of r.faces) { f.uniforms.uSweep.value = sweep; f.uniforms.uFlash.value = 0.5 * Math.max(kOne, kDrop); }

    const b3 = buf('C01-3d', W, H), b3x = bctx(b3);
    b3x.clearRect(0, 0, W, H);
    render3d(b3x, r.scene, cam);
    // hard pop-art drop shadow of the type (navy, soft from a 1/4-res buffer)
    const sb = buf('C01-sh', 480, 270), sx = bctx(sb);
    sx.globalCompositeOperation = 'source-over'; sx.clearRect(0, 0, 480, 270); sx.drawImage(b3, 0, 0, 480, 270);
    sx.globalCompositeOperation = 'source-in'; sx.fillStyle = '#2A0E5C'; sx.fillRect(0, 0, 480, 270); sx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 0.72 * (1 - dive); ctx.drawImage(sb, 22, 30, W, H); ctx.globalAlpha = 1;
    ctx.drawImage(b3, 0, 0);

    // front confetti + sparkles
    confetti(ctx, t - T_DROP, { x: bcx, y: bcy + 40, n: 70, seed: 11, speed: 2600, size: 2.1, life: 1.2 });
    confetti(ctx, t - T_ONE, { x: bcx, y: bcy, n: 40, seed: 21, speed: 1800, size: 1.2, life: 1.0, cols: ['#FFFFFF', '#FFE14D'] });

    // ---------- FX ----------
    const flashIn = 1 - clamp(lt / 0.2);
    E.fx.flash = [1, 1, 1, Math.max(ease.inQuad(flashIn), 0.32 * kOne, 0.28 * kDrop)];
    E.fx.shake = 46 * kOne + 24 * kPr + 54 * kDrop;
    E.fx.rgb = 16 * kOne + 9 * kPr + 20 * kDrop + 16 * dive;
    E.fx.zoom = 0.07 * kOne + 0.035 * kPr + 0.085 * kDrop;
    E.fx.bloom = 0.25 + 0.45 * boost; E.fx.bloomThreshold = 0.82;
    E.fx.radialBlur = Math.max(0.3 * approach * clamp(lt / 0.2), 0.85 * dive, 0.18 * kDrop);
    E.fx.center = [0.5, 0.52];
    E.fx.saturation = 1.1; E.fx.vignette = 0.2;
  },
};
