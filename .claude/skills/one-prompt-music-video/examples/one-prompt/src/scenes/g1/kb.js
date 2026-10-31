// Chunky 3D paper-studio keyboard (Three.js) shared by V01 + V02.
import { THREE, RoundedBoxGeometry, envMap } from '../../core/three.js';
import { P1 } from './util.js';

const ROWS = [
  [['ESC', 1, 'red'], '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', ['DEL', 2, 'mod']],
  [['TAB', 1.5, 'mod'], 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']', ['\\', 1.5, 'mod']],
  [['CAPS', 1.75, 'mod'], 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', "'", ['ENTER', 2.25, 'orange']],
  [['SHIFT', 2.25, 'mod'], 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/', ['SHIFT', 2.75, 'mod']],
  [['CTRL', 1.25, 'mod'], ['OPT', 1.25, 'mod'], ['CMD', 1.5, 'mod'], ['SPACE', 6.25, 'navy'], ['CMD', 1.5, 'mod'], ['OPT', 1.25, 'mod'], ['◀', 1, 'mod'], ['▶', 1, 'mod']],
];
const COLS = { cream: '#FBF4E4', mod: '#E2D3B8', red: P1.red, orange: P1.orange, navy: P1.ink };
export const KEY_TOP = 0.7;
export const KB_W = 15, KB_D = 5;

const geoCache = new Map();
function capGeo(w) {
  const k = w.toFixed(2);
  if (!geoCache.has(k)) geoCache.set(k, new RoundedBoxGeometry(w - 0.12, 0.62, 0.86, 4, 0.15));
  return geoCache.get(k);
}
let mats = null;
function materials() {
  if (mats) return mats;
  const env = envMap();
  mats = {};
  for (const [k, c] of Object.entries(COLS)) mats[k] = new THREE.MeshStandardMaterial({ color: c, roughness: 0.42, metalness: 0, envMap: env, envMapIntensity: 0.45 });
  mats.case = new THREE.MeshStandardMaterial({ color: P1.ink, roughness: 0.5, envMap: env, envMapIntensity: 0.5 });
  mats.plate = new THREE.MeshStandardMaterial({ color: '#141C3D', roughness: 0.8 });
  return mats;
}

function legendTex(label, w, style) {
  const pxw = Math.round(160 * w), pxh = 160;
  const c = document.createElement('canvas'); c.width = pxw; c.height = pxh;
  const x = c.getContext('2d');
  const ink = style === 'navy' || style === 'red' || style === 'orange' ? '#FFFBF4' : P1.ink;
  x.fillStyle = ink; x.strokeStyle = ink; x.textAlign = 'center'; x.textBaseline = 'middle';
  if (label.length === 1) {
    x.font = '800 92px "JetBrains Mono"'; x.fillText(label, pxw / 2, pxh / 2 + 4);
  } else if (label === 'ENTER') {
    x.font = '800 44px "Bricolage Grotesque"'; x.fillText('ENTER', pxw / 2 - 22, pxh / 2 + 2);
    x.lineWidth = 9; x.lineCap = 'round'; x.lineJoin = 'round';
    const ax = pxw / 2 + 90, ay = pxh / 2;
    x.beginPath(); x.moveTo(ax + 22, ay - 26); x.lineTo(ax + 22, ay + 6); x.lineTo(ax - 18, ay + 6); x.stroke();
    x.beginPath(); x.moveTo(ax - 6, ay - 8); x.lineTo(ax - 20, ay + 6); x.lineTo(ax - 6, ay + 20); x.stroke();
  } else if (label === 'SPACE') {
    x.font = '800 40px "JetBrains Mono"'; x.globalAlpha = 0.9; x.fillText('>_ one prompt', pxw / 2, pxh / 2 + 2);
  } else {
    x.font = `800 ${label.length > 3 ? 34 : 40}px "Bricolage Grotesque"`; x.textAlign = 'left'; x.fillText(label, 24, pxh - 40);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

/** builds the keyboard. returns {root, keys, by(label), center} — keyboard centred on x=0,z=0, case top at y=0 */
export function buildKeyboard() {
  const M = materials();
  const root = new THREE.Group();
  const keys = [];
  ROWS.forEach((row, ri) => {
    let x = -KB_W / 2;
    for (const item of row) {
      const [label, w, style] = Array.isArray(item) ? item : [item, 1, 'cream'];
      const g = new THREE.Group();
      const cap = new THREE.Mesh(capGeo(w), M[style]); cap.castShadow = true; cap.receiveShadow = true;
      cap.position.y = 0.36; g.add(cap);
      const lg = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.22, 0.76), new THREE.MeshStandardMaterial({ map: legendTex(label, w - 0.22, style), transparent: true, roughness: 0.42, depthWrite: false }));
      lg.rotation.x = -Math.PI / 2; lg.position.y = 0.36 + 0.31 + 0.004; g.add(lg);
      const kx = x + w / 2, kz = -2 + ri;
      g.position.set(kx, 0, kz);
      root.add(g);
      keys.push({ label, w, style, x: kx, z: kz, row: ri, g, cap, legend: lg });
      x += w;
    }
  });
  const kcase = new THREE.Mesh(new RoundedBoxGeometry(KB_W + 0.7, 0.9, KB_D + 0.75, 5, 0.32), M.case);
  kcase.position.y = -0.4; kcase.castShadow = true; kcase.receiveShadow = true; root.add(kcase);
  const plate = new THREE.Mesh(new THREE.BoxGeometry(KB_W + 0.1, 0.05, KB_D + 0.1), M.plate);
  plate.position.y = 0.03; plate.receiveShadow = true; root.add(plate);
  const by = (label) => keys.find((k) => k.label === label);
  return { root, keys, by, case: kcase };
}

/** studio scene with paper floor shadow catcher + warm lights */
export function studio(scene, { shadowSize = 2048, ext = 14, sun = [-7, 16, 9] } = {}) {
  scene.add(new THREE.HemisphereLight('#FFF7EA', '#C9B89C', 1.35));
  const d = new THREE.DirectionalLight('#FFF1DC', 2.6);
  d.position.set(...sun); d.castShadow = true;
  d.shadow.mapSize.set(shadowSize, shadowSize);
  Object.assign(d.shadow.camera, { left: -ext, right: ext, top: ext, bottom: -ext, near: 1, far: 60 });
  d.shadow.bias = -0.0004; d.shadow.normalBias = 0.02; d.shadow.radius = 4;
  scene.add(d); scene.add(d.target);
  const fill = new THREE.DirectionalLight('#FFD9C2', 0.7); fill.position.set(8, 6, -4); scene.add(fill);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ color: '#3A2A10', opacity: 0.22 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -0.85; floor.receiveShadow = true; scene.add(floor);
  return { sun: d, floor };
}
