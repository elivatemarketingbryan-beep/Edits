// Shared Three.js renderer (its own WebGL canvas). Scenes build their own THREE.Scene/Camera once,
// call render3d(ctx, scene, camera) each frame, which renders and composites into the 2D context.
import * as THREE from 'three';
import { TTFLoader } from 'three/addons/loaders/TTFLoader.js';
import { Font } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { W, H } from './lib.js';

export { THREE, TextGeometry, RoundedBoxGeometry };
let R = null, ENV = null;

export function renderer() {
  if (R) return R;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  R = new THREE.WebGLRenderer({ canvas: c, antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  R.setPixelRatio(1); R.setSize(W, H, false);
  R.outputColorSpace = THREE.SRGBColorSpace;
  R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
  return R;
}

/** neutral studio environment map (for chrome / glossy materials) */
export function envMap() {
  if (ENV) return ENV;
  const pm = new THREE.PMREMGenerator(renderer());
  ENV = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  return ENV;
}

/** render scene/camera and draw the result into ctx (full frame by default). Clears to transparent. */
export function render3d(ctx, scene, camera, { toneMapping = THREE.NoToneMapping, exposure = 1 } = {}) {
  const r = renderer();
  r.toneMapping = toneMapping; r.toneMappingExposure = exposure;
  r.setClearColor(0x000000, 0); r.clear();
  r.render(scene, camera);
  ctx.drawImage(r.domElement, 0, 0, W, H);
}

// ---- 3D fonts (TTF → three Font), loaded at boot ----
export const fonts3d = {};
export async function loadFonts3d() {
  const L = new TTFLoader();
  const files = { Anton: 'fonts/Anton-Regular.ttf', RubikMono: 'fonts/RubikMonoOne-Regular.ttf', Bungee: 'fonts/Bungee-Regular.ttf' };
  await Promise.all(Object.entries(files).map(([k, f]) => new Promise((res, rej) => L.load(f, (json) => { fonts3d[k] = new Font(json); res(); }, undefined, rej))));
}

/** centred extruded text geometry */
export function textGeo(str, { font = 'Anton', size = 1, depth = 0.3, bevel = 0.03, curveSegments = 6 } = {}) {
  const g = new TextGeometry(str, { font: fonts3d[font], size, depth, curveSegments, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel * 0.8, bevelSegments: 3 });
  g.computeBoundingBox(); const b = g.boundingBox;
  g.translate(-(b.max.x + b.min.x) / 2, -(b.max.y + b.min.y) / 2, -(b.max.z + b.min.z) / 2);
  return g;
}
