// W10 — "paste it," — a giant 3D ⌘ + V keycap pair (Three.js RoundedBox keycaps, clearcoat, studio env) is
// pressed — and the SCREEN PASTES ITSELF: each ⌘V tiles the previous full frame 2×2 (true recursion: level n
// is four copies of level n−1, labels included) → 1 → 4 → 16 → 64 copies in 0.4 s, every paste re-pressing the keys.
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, font, buf, bctx, roundRect } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { THREE, render3d, envMap, RoundedBoxGeometry } from '../../core/three.js';
import { C, slam, hit, kick, grid } from './_g5.js';

const S = shot('W10');
const T0 = S.start;
const T_IT = 69.34;
const PASTES = [69.16, 69.24, 69.32, 69.41];   // ⌘V presses: base, ×4, ×16, ×64
const POPDUR = 0.06;

function legend(str, kind) {
  const c = buf('W10-leg-' + kind, 512, 512), x = bctx(c);
  x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, 512, 512);
  x.fillStyle = C.black; x.textAlign = 'center'; x.textBaseline = 'middle';
  if (kind === 'cmd') {
    // ⌘ drawn as geometry (no font dependency): square + four corner loops
    x.lineWidth = 30; x.strokeStyle = C.black; x.lineCap = 'round';
    const a = 70, r = 52;
    x.strokeRect(256 - a, 256 - a, 2 * a, 2 * a);
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { x.beginPath(); x.arc(256 + sx * (a + r), 256 + sy * (a + r), r, 0, TAU); x.stroke(); }
    font(x, 64, 'JetBrains Mono', '800'); x.fillText('cmd', 256, 450);
  } else {
    font(x, 330, 'Anton'); x.fillText('V', 256, 270);
  }
  return c;
}

let R = null;
function build() {
  const scene = new THREE.Scene(); scene.environment = envMap();
  const cam = new THREE.PerspectiveCamera(32, W / H, 0.1, 100);
  const geo = new RoundedBoxGeometry(1.7, 0.75, 1.7, 5, 0.22);
  const keys = [];
  ['cmd', 'v'].forEach((k, i) => {
    const tex = new THREE.CanvasTexture(legend(k === 'cmd' ? '⌘' : 'V', k)); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    const side = new THREE.MeshPhysicalMaterial({ color: 0xf2f2f6, roughness: 0.35, clearcoat: 0.6, envMapIntensity: 0.6 });
    const top = new THREE.MeshPhysicalMaterial({ color: 0xffffff, map: tex, roughness: 0.35, clearcoat: 0.6, envMapIntensity: 0.5 });
    const m = new THREE.Mesh(geo, [side, side, top, side, side, side]);
    m.position.set(i === 0 ? -1.05 : 1.05, 0.4, 0); m.castShadow = true; scene.add(m); keys.push(m);
  });
  const plate = new THREE.Mesh(new RoundedBoxGeometry(4.6, 0.4, 2.6, 4, 0.18), new THREE.MeshPhysicalMaterial({ color: 0x0e0e12, roughness: 0.5, clearcoat: 0.5 }));
  plate.position.y = -0.2; plate.receiveShadow = true; scene.add(plate);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x4040ff, 1.1));
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(-3, 7, 4); key.castShadow = true; key.shadow.mapSize.set(1024, 1024);
  const sc = key.shadow.camera; sc.left = -4; sc.right = 4; sc.top = 4; sc.bottom = -4; scene.add(key);
  R = { scene, cam, keys };
}

function pressDepth(t) {
  let d = 0;
  for (const p of PASTES) { const u = t - p; if (u >= 0 && u < 0.09) d = Math.max(d, u < 0.025 ? 1 : 1 - (u - 0.025) / 0.065); }
  return d;
}

function base(t, lt, scheme) {
  const b = buf('W10-base-' + scheme, W, H), x = bctx(b);
  const bg = [C.blue, C.white, C.red][scheme], ink = scheme === 1 ? C.black : C.white;
  x.setTransform(1, 0, 0, 1, 0, 0);
  x.fillStyle = bg; x.fillRect(0, 0, W, H);
  x.save(); x.globalAlpha = 0.18; grid(x, 90, scheme === 1 ? C.blue : '#fff', 3); x.restore();
  x.drawImage(buf('W10-keys', W, H), 0, 0);
  const str = t >= T_IT ? 'PASTE IT' : 'PASTE';
  slam(x, str, W / 2, 240, 230, { fill: ink, shadow: scheme === 1 ? C.red : C.black, sx: 14, sy: 14, rot: -0.03, maxW: 1500 });
  font(x, 54, 'JetBrains Mono', '800'); x.textAlign = 'center'; x.fillStyle = ink; x.fillText('⌘ + V', W / 2, 1000);
  return b;
}

export default {
  ...S,
  cutIn: 'punch',
  sfx: [{ t: 69.16, type: 'click', gain: 0.9 }, { t: 69.24, type: 'pop', gain: 0.6 }, { t: 69.32, type: 'pop', gain: 0.7 }, { t: 69.41, type: 'pop', gain: 0.8 }],
  init() { build(); R.cam.position.set(0, 5, 6); R.cam.lookAt(0, 0, 0); render3d(bctx(buf('W10-warm', 64, 36)), R.scene, R.cam); },
  draw(ctx, t, s, E) {
    if (!R) build();
    const lt = s.lt;
    // ---- 3D keys into their own layer ----
    const d = pressDepth(t);
    R.keys.forEach((k, i) => { k.position.y = 0.4 - d * 0.32 * (i === 0 ? 1 : 0.9); k.rotation.z = (i === 0 ? 1 : -1) * d * 0.03; });
    const ang = 0.18 + lt * 0.2;
    R.cam.position.set(Math.sin(ang) * 6.6, 5.2, Math.cos(ang) * 6.6); R.cam.lookAt(0, 0.55, -0.35);
    const kb = buf('W10-keys', W, H), kx = bctx(kb); kx.clearRect(0, 0, W, H);
    render3d(kx, R.scene, R.cam);

    // ---- recursive paste ----
    const B = [0, 1, 2].map((sc) => base(t, lt, sc));
    const level = PASTES.filter((p) => t >= p).length - 1; // 0..3
    const labels = ['', '×4', '×16', '×64'];
    let prev = B[0];
    const quads = [[0, 0], [1, 0], [0, 1], [1, 1]];
    for (let L = 1; L <= level; L++) {
      const lb = buf('W10-L' + L, W, H), lx = bctx(lb);
      lx.setTransform(1, 0, 0, 1, 0, 0);
      lx.fillStyle = C.black; lx.fillRect(0, 0, W, H);
      const isTop = L === level, tp = t - PASTES[L];
      quads.forEach(([qx, qy], q) => {
        const src = L === 1 ? B[[0, 1, 1, 2][q]] : prev;
        let sc = 1;
        if (isTop) { const u = clamp((tp - q * 0.012) / POPDUR); if (u <= 0) { lx.drawImage(L === 1 ? B[0] : prev, qx * W / 2, qy * H / 2, W / 2, H / 2, qx * W / 2, qy * H / 2, W / 2, H / 2); return; } sc = 1 + 0.25 * (1 - ease.outBack(u)); }
        const cx = qx * W / 2 + W / 4, cy = qy * H / 2 + H / 4;
        lx.save(); lx.translate(cx, cy); lx.scale(sc, sc);
        lx.drawImage(src, -W / 4 + 5, -H / 4 + 5, W / 2 - 10, H / 2 - 10);
        lx.restore();
      });
      // level label
      const lk = isTop ? hit(t, PASTES[L], 0.12) : 1;
      lx.save(); lx.translate(W / 2, H / 2); lx.rotate(-0.06); lx.scale(lk, lk);
      font(lx, 150, 'Anton'); const tw = lx.measureText('⌘V ' + labels[L]).width + 70;
      lx.fillStyle = C.black; lx.fillRect(-tw / 2 + 14, -95 + 14, tw, 190); lx.fillStyle = L === 3 ? C.red : C.white; lx.fillRect(-tw / 2, -95, tw, 190);
      lx.lineWidth = 8; lx.strokeStyle = C.black; lx.strokeRect(-tw / 2, -95, tw, 190);
      lx.fillStyle = L === 3 ? C.white : C.black; lx.textAlign = 'center'; lx.textBaseline = 'middle'; lx.fillText('⌘V ' + labels[L], 0, 8);
      lx.restore();
      prev = lb;
    }
    // final composite with a little punch per paste
    const pk = level > 0 ? kick(t, PASTES[level], 0.08) : kick(t, PASTES[0], 0.08);
    ctx.save(); ctx.translate(W / 2, H / 2); const z = 1 + pk * 0.05 + (level === 3 ? (t - PASTES[3]) * 0.12 : 0); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2);
    ctx.drawImage(level === 0 ? B[0] : prev, 0, 0);
    ctx.restore();

    E.fx.shake = 14 * pk;
    E.fx.rgb = 8 * pk;
    E.fx.zoom += 0.02 * pk;
    E.fx.vignette = 0.15;
  },
};
