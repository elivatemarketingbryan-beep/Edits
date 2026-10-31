// V06 — "no studio," — a Three.js pop-up book: die-cut paper softboxes, a camera on a tripod, a
// green screen, a director's chair and a clapperboard spring up off the spread (hinged planes with
// alpha cut-outs casting real shadows)… then the right half SLAMS shut over them, every pop-up folding
// flat as the page passes, and the cover reads NO STUDIO.
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, wobble, roundRect, font } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { THREE, render3d } from '../../core/three.js';
import { P1, paper, printType, paperBurst, toScreen, warm, paperTex } from './util.js';

const S = shot('V06');
const T_SHUT0 = 15.93, T_SHUT = 16.07;
let R = null;

function cutTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = Math.round(w * 200); c.height = Math.round(h * 200);
  const x = c.getContext('2d'); x.lineJoin = 'round'; x.lineCap = 'round';
  // die-cut: draw twice — fat white outline pass, then the art
  x.save(); x.shadowColor = '#fff'; draw(x, c.width, c.height, true); x.restore();
  draw(x, c.width, c.height, false);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}
// helper: in "outline" pass every fill/stroke is white + thick
function F(x, o, col) { x.fillStyle = o ? '#FFFFFF' : col; }
function St(x, o, col, w) { x.strokeStyle = o ? '#FFFFFF' : col; x.lineWidth = o ? w + 34 : w; }

const ART = {
  softbox: [1.5, 2.4, (x, w, h, o) => {
    St(x, o, P1.ink, 12); x.beginPath(); x.moveTo(w / 2, h * 0.45); x.lineTo(w / 2, h - 30); x.moveTo(w / 2, h * 0.8); x.lineTo(w * 0.2, h - 24); x.moveTo(w / 2, h * 0.8); x.lineTo(w * 0.8, h - 24); x.stroke();
    if (o) { x.fillStyle = '#fff'; x.beginPath(); x.moveTo(30, 40); x.lineTo(w - 30, 40); x.lineTo(w - 70, h * 0.48); x.lineTo(70, h * 0.48); x.closePath(); x.lineWidth = 34; x.strokeStyle = '#fff'; x.stroke(); x.fill(); return; }
    x.fillStyle = P1.ink; x.beginPath(); x.moveTo(30, 40); x.lineTo(w - 30, 40); x.lineTo(w - 70, h * 0.48); x.lineTo(70, h * 0.48); x.closePath(); x.fill();
    x.fillStyle = '#FFF7E0'; x.beginPath(); x.moveTo(52, 60); x.lineTo(w - 52, 60); x.lineTo(w - 86, h * 0.45); x.lineTo(86, h * 0.45); x.closePath(); x.fill();
    x.fillStyle = 'rgba(255,200,120,0.5)'; x.fillRect(w * 0.3, 80, w * 0.4, h * 0.3);
  }],
  camera: [1.7, 2.3, (x, w, h, o) => {
    St(x, o, P1.ink, 14); x.beginPath(); x.moveTo(w / 2, h * 0.45); x.lineTo(w * 0.15, h - 20); x.moveTo(w / 2, h * 0.45); x.lineTo(w * 0.85, h - 20); x.moveTo(w / 2, h * 0.45); x.lineTo(w / 2, h - 20); x.stroke();
    F(x, o, P1.orange); roundRect(x, w * 0.12, h * 0.16, w * 0.62, h * 0.3, 18); if (o) { x.lineWidth = 34; x.strokeStyle = '#fff'; x.stroke(); } x.fill();
    F(x, o, P1.ink); x.beginPath(); x.moveTo(w * 0.72, h * 0.22); x.lineTo(w * 0.95, h * 0.14); x.lineTo(w * 0.95, h * 0.48); x.lineTo(w * 0.72, h * 0.4); x.closePath(); if (o) { x.lineWidth = 34; x.strokeStyle = '#fff'; x.stroke(); } x.fill();
    F(x, o, P1.ink); x.beginPath(); x.arc(w * 0.3, h * 0.1, h * 0.07, 0, TAU); x.arc(w * 0.55, h * 0.1, h * 0.07, 0, TAU); if (o) { x.lineWidth = 34; x.strokeStyle = '#fff'; x.stroke(); } x.fill();
    if (o) return;
    x.fillStyle = P1.red; x.beginPath(); x.arc(w * 0.2, h * 0.22, 12, 0, TAU); x.fill();
    x.fillStyle = P1.cream; x.font = '800 44px "JetBrains Mono"'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('REC', w * 0.43, h * 0.32);
  }],
  green: [4.2, 2.6, (x, w, h, o) => {
    St(x, o, P1.ink, 14); x.beginPath(); x.moveTo(60, 40); x.lineTo(60, h - 20); x.moveTo(w - 60, 40); x.lineTo(w - 60, h - 20); x.stroke();
    F(x, o, '#3FAE68'); x.fillRect(80, 50, w - 160, h * 0.72); if (o) { x.lineWidth = 34; x.strokeStyle = '#fff'; x.strokeRect(80, 50, w - 160, h * 0.72); return; }
    x.fillStyle = 'rgba(255,255,255,0.18)'; for (let i = 0; i < 9; i++) x.fillRect(90 + i * 90, 50, 30, h * 0.72);
    x.fillStyle = 'rgba(0,0,0,0.25)'; x.font = '400 120px "Anton"'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('GREEN SCREEN', w / 2, 50 + h * 0.36);
  }],
  chair: [1.4, 1.9, (x, w, h, o) => {
    St(x, o, '#9C7A52', 16); x.beginPath(); x.moveTo(w * 0.15, h * 0.1); x.lineTo(w * 0.15, h - 16); x.moveTo(w * 0.85, h * 0.1); x.lineTo(w * 0.85, h - 16); x.moveTo(w * 0.15, h * 0.6); x.lineTo(w * 0.85, h - 16); x.moveTo(w * 0.85, h * 0.6); x.lineTo(w * 0.15, h - 16); x.stroke();
    F(x, o, P1.red); x.fillRect(w * 0.1, h * 0.12, w * 0.8, h * 0.22); x.fillRect(w * 0.08, h * 0.52, w * 0.84, h * 0.09);
    if (o) { x.lineWidth = 34; x.strokeStyle = '#fff'; x.strokeRect(w * 0.1, h * 0.12, w * 0.8, h * 0.22); return; }
    x.fillStyle = P1.cream; x.font = '400 54px "Anton"'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('DIRECTOR', w / 2, h * 0.23);
  }],
  clap: [1.0, 0.9, (x, w, h, o) => {
    F(x, o, P1.ink); x.fillRect(16, h * 0.32, w - 32, h * 0.62); if (o) { x.lineWidth = 34; x.strokeStyle = '#fff'; x.strokeRect(16, h * 0.32, w - 32, h * 0.62); }
    x.save(); x.translate(16, h * 0.3); x.rotate(-0.3); F(x, o, P1.ink); x.fillRect(0, -40, w - 30, 40); if (!o) { x.fillStyle = '#fff'; for (let i = 0; i < 5; i++) { x.beginPath(); x.moveTo(i * 40 + 10, -40); x.lineTo(i * 40 + 30, -40); x.lineTo(i * 40 + 10, 0); x.lineTo(i * 40 - 10, 0); x.fill(); } } x.restore();
    if (o) return;
    x.fillStyle = P1.cream; x.font = '700 30px "JetBrains Mono"'; x.textAlign = 'left'; x.fillText('SCENE 1', 34, h * 0.55); x.fillText('TAKE 99', 34, h * 0.8);
  }],
};

function pageTex(left) {
  const c = document.createElement('canvas'); c.width = 840; c.height = 1080; const x = c.getContext('2d');
  x.fillStyle = '#FBF5EA'; x.fillRect(0, 0, 840, 1080);
  x.fillStyle = 'rgba(31,42,85,0.12)';
  const g = x.createLinearGradient(left ? 840 : 0, 0, left ? 700 : 140, 0); g.addColorStop(0, 'rgba(0,0,0,0.18)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 840, 1080);
  x.fillStyle = P1.ink; x.font = '400 92px "Anton"'; x.textAlign = 'center';
  x.fillText(left ? 'CHAPTER 1' : 'THE STUDIO', 420, 140);
  x.fillStyle = 'rgba(31,42,85,0.35)'; for (let i = 0; i < 14; i++) x.fillRect(90, 900 + (i % 3) * 40, 660 - ((i * 77) % 300), 14);
  x.fillStyle = P1.red; x.font = '700 40px "Caveat"'; x.fillText(left ? 'pull tab →' : 'fold here ↓', 420, 210);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
function coverTex() {
  const c = document.createElement('canvas'); c.width = 840; c.height = 1080; const x = c.getContext('2d');
  x.fillStyle = P1.red; x.fillRect(0, 0, 840, 1080);
  x.strokeStyle = P1.cream; x.lineWidth = 10; x.strokeRect(40, 40, 760, 1000);
  x.fillStyle = P1.cream; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.font = '400 300px "Anton"'; x.fillText('NO', 420, 380);
  x.font = '400 190px "Anton"'; x.fillText('STUDIO', 420, 650);
  x.fillStyle = P1.ink; x.font = '800 44px "JetBrains Mono"'; x.fillText('a pop-up book', 420, 860);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

function build() {
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight('#FFF7EA', '#C9B89C', 1.4));
  const sun = new THREE.DirectionalLight('#FFF1DC', 2.4); sun.position.set(-5, 12, 7); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 40 }); sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.02;
  scene.add(sun);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.ShadowMaterial({ color: '#3A2A10', opacity: 0.25 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

  const BW = 4.2, BD = 5.4;
  const coverMat = new THREE.MeshStandardMaterial({ color: P1.red, roughness: 0.7 });
  const pageSide = new THREE.MeshStandardMaterial({ color: '#F1E6D2', roughness: 0.9 });
  const mkHalf = (left) => {
    const g = new THREE.Group();
    const cover = new THREE.Mesh(new THREE.BoxGeometry(BW + 0.12, 0.12, BD + 0.2), coverMat); cover.castShadow = cover.receiveShadow = true;
    const pages = new THREE.Mesh(new THREE.BoxGeometry(BW - 0.05, 0.18, BD - 0.05), [pageSide, pageSide, new THREE.MeshStandardMaterial({ map: pageTex(left), roughness: 0.85 }), pageSide, pageSide, pageSide]);
    pages.castShadow = pages.receiveShadow = true;
    const sx = left ? -1 : 1;
    if (left) { cover.position.set(-BW / 2 - 0.06, 0.06, 0); pages.position.set(-BW / 2 + 0.02, 0.21, 0); }
    else { cover.position.set(BW / 2 + 0.06, -0.24, 0); pages.position.set(BW / 2 - 0.02, -0.09, 0); }
    g.add(cover, pages);
    if (!left) { const cv = new THREE.Mesh(new THREE.PlaneGeometry(BW, BD), new THREE.MeshStandardMaterial({ map: coverTex(), roughness: 0.6 })); cv.rotation.x = Math.PI / 2; cv.rotation.z = Math.PI; cv.position.set(BW / 2 + 0.06, -0.301, 0); g.add(cv); }
    return g;
  };
  const left = mkHalf(true); scene.add(left);
  const right = mkHalf(false); right.position.set(0, 0.3, 0); scene.add(right);
  const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, BD + 0.2, 16), new THREE.MeshStandardMaterial({ color: P1.ink, roughness: 0.6 })); spine.rotation.x = Math.PI / 2; spine.position.set(0, 0.12, 0); scene.add(spine);

  const pops = [];
  const add = (key, parent, x, z, pageY, delay, rotY = 0) => {
    const [w, h, fn] = ART[key];
    const tex = cutTex(w, h, fn);
    const mat = new THREE.MeshStandardMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.85 });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.position.y = h / 2; m.castShadow = true; m.receiveShadow = true;
    m.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.5 });
    const hinge = new THREE.Group(); hinge.position.set(x, pageY, z); hinge.rotation.y = rotY; hinge.add(m); parent.add(hinge);
    // little paper tab at the hinge
    pops.push({ hinge, delay, left: parent === left });
  };
  add('green', left, -1.2, -1.9, 0.3, 0.0);
  add('softbox', left, -3.0, -0.4, 0.3, 0.05, 0.35);
  add('camera', left, -1.6, 1.0, 0.3, 0.08, 0.2);
  add('softbox', right, 2.9, -0.5, 0.0, 0.06, -0.35);
  add('chair', right, 1.5, 0.9, 0.0, 0.1, -0.15);
  add('clap', right, 3.0, 1.8, 0.0, 0.13, -0.3);
  const camera = new THREE.PerspectiveCamera(32, W / H, 0.5, 100);
  R = { scene, camera, left, right, pops };
}

export default {
  ...S,
  cutIn: 'punch',
  sfx: [{ t: 15.7, type: 'paper', gain: 0.8 }, { t: T_SHUT, type: 'impact', gain: 1 }],
  init() { paperTex('#EFE3CF', W, H, 12); build(); warm(R.scene, R.camera); },
  draw(ctx, t, s, E) {
    if (!R) build();
    const { scene, camera, right, pops } = R;
    const lt = s.lt;
    paper(ctx, '#EFE3CF', 0, 0, 12);
    // close angle: accelerating slam + bounce
    let c = ease.inCubic(clamp((t - T_SHUT0) / (T_SHUT - T_SHUT0)));
    const ds = t - T_SHUT;
    if (ds > 0) c = 1 - Math.abs(wobble(ds, 6, 14)) * 0.035;
    right.rotation.z = c * Math.PI;
    for (const p of pops) {
      const rise = ease.outBack(clamp((lt - p.delay) / 0.16), 2.2);
      const fold = clamp(c * 1.7);
      p.hinge.rotation.x = -Math.PI / 2 * (1 - rise * (1 - fold)) + (p.left ? 0 : 0);
      p.hinge.children[0].rotation.z = Math.sin(lt * 9 + p.delay * 40) * 0.03 * (1 - fold);
    }
    // camera: 3/4 top-down push, jolt on slam
    const push = ease.outCubic(s.u);
    const jolt = ds > 0 ? Math.exp(-ds * 18) : 0;
    const lx = lerp(0.1, -2.1, ease.inOutQuad(clamp((t - T_SHUT0 + 0.05) / 0.25)));
    camera.position.set(lx - 1.2, lerp(9.6, 8.2, push) + jolt * 0.6, lerp(8.4, 7.0, push));
    camera.lookAt(lx, 0.6, -0.1);
    camera.updateMatrixWorld();
    render3d(ctx, scene, camera);

    // slam air puff + paper bits
    if (ds > 0) {
      const [bx, by] = toScreen(camera, -2.1, 0.6, 0);
      ctx.save(); ctx.strokeStyle = P1.cream; ctx.lineCap = 'round';
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * TAU, r0 = 380 + ds * 1400, r1 = r0 + 90;
        ctx.globalAlpha = clamp(1 - ds * 5); ctx.lineWidth = 12;
        ctx.beginPath(); ctx.moveTo(bx + Math.cos(a) * r0, by + Math.sin(a) * r0 * 0.55); ctx.lineTo(bx + Math.cos(a) * r1, by + Math.sin(a) * r1 * 0.55); ctx.stroke();
      }
      ctx.restore();
      paperBurst(ctx, bx, by, ds, 30, 61, [P1.red, P1.ink, P1.cream, P1.orange], 1700, 1500, 22);
    }
    // NO STUDIO type
    const gone = ds > 0 ? 1 - ease.inBack(clamp(ds / 0.07)) : 1;
    const k1 = ease.outBack(clamp((t - 15.68) / 0.1), 2.5) * gone, k2 = ease.outBack(clamp((t - 15.88) / 0.1), 2.5) * gone;
    if (k1 > 0.01) { ctx.save(); ctx.translate(W / 2 - 330, 215); ctx.rotate(-0.06); ctx.scale(k1, k1);
    printType(ctx, 'NO', 0, 0, 200, { fill: P1.red, shadow: P1.ink, off: 0.05, stroke: P1.cream, strokeW: 14 }); ctx.restore(); }
    if (k2 > 0.01) { ctx.save(); ctx.translate(W / 2 + 170, 225); ctx.rotate(0.04); ctx.scale(k2, k2);
      printType(ctx, 'STUDIO', 0, 0, 200, { fill: P1.ink, shadow: P1.red, off: 0.05, stroke: P1.cream, strokeW: 14 }); ctx.restore(); }

    E.fx.shake = jolt * 26 + A.pulse('snare', t, 0.08) * 4;
    E.fx.zoom += jolt * 0.04;
    if (ds > 0 && ds < 0.05) E.fx.rgb = 8;
  },
};
