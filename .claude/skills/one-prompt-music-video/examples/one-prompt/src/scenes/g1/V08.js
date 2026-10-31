// V08 — "Just Claude writing code, building every scene" — split frame. Left: an editor types real
// JavaScript lines from this project, syntax-highlighted. Right: a live Three.js viewport where every
// completed line BUILDS its piece (wireframe flash → solid drop with real bounce): grid floor, back
// wall, a spotlight that switches on, a sphere, a cube… and on "scene" CURSOR drops in and lands.
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, wobble, font, roundRect } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { drawMascot, pose } from '../../core/mascot.js';
import { THREE, render3d, RoundedBoxGeometry, envMap } from '../../core/three.js';
import { P1, paper, printType, toScreen, blobShadow, paperBurst, warm, paperTex } from './util.js';

const S = shot('V08');
const LINES = [
  { s: 'const scene = new THREE.Scene();', t: 17.24 },
  { s: 'scene.add(new THREE.GridHelper(20, 20));', t: 17.44, obj: 'grid' },
  { s: "wall.scale.y = ease.outBack(build(t));", t: 17.7, obj: 'wall' },
  { s: 'sun.intensity = 3 * flicker(t); // light', t: 17.97, obj: 'sun' },
  { s: 'ball.position.y = bounce(t - 18.24);', t: 18.25, obj: 'ball' },
  { s: 'cube.rotation.y += A.beat(t).phase;', t: 18.57, obj: 'cube' },
  { s: "drawMascot(ctx, { pose: 'jump', t });", t: 18.8, obj: 'cursor' },
];
const KW = /\b(const|new|let|return|import|from)\b/y, STR = /'[^']*'|"[^"]*"/y, NUM = /\b\d+(\.\d+)?\b/y, CMT = /\/\/.*/y, ID = /[A-Za-z_$][\w$]*/y;
function tokens(line) {
  const out = []; let i = 0;
  while (i < line.length) {
    let m = null, c = null;
    for (const [re, col] of [[CMT, '#8A93B8'], [STR, '#FF8FA0'], [KW, P1.orange], [NUM, '#FFD23F'], [ID, null]]) { re.lastIndex = i; const r = re.exec(line); if (r && r.index === i) { m = r[0]; c = col; break; } }
    if (!m) { out.push({ s: line[i], c: '#8FD3FF' }); i++; continue; }
    if (c === null) c = line[i + m.length] === '(' ? '#FFE9C7' : '#F4EDE0';
    out.push({ s: m, c }); i += m.length;
  }
  return out;
}
const PX = 64, PY = 160, PW = 860, PH = 700; // editor panel

let R = null;
function build() {
  const scene = new THREE.Scene();
  const hemi = new THREE.HemisphereLight('#FFF7EA', '#BFAE90', 0.55); scene.add(hemi);
  const key = new THREE.DirectionalLight('#FFF1DC', 0.9); key.position.set(-6, 10, 6); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024); Object.assign(key.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: 1, far: 40 }); scene.add(key);
  const floor = new THREE.Mesh(new RoundedBoxGeometry(12, 0.6, 9, 4, 0.12), new THREE.MeshStandardMaterial({ color: '#FBF5EA', roughness: 0.9 }));
  floor.position.y = -0.3; floor.receiveShadow = true; floor.castShadow = true; scene.add(floor);
  const rim = new THREE.Mesh(new THREE.BoxGeometry(12.1, 0.25, 9.1), new THREE.MeshStandardMaterial({ color: P1.ink, roughness: 0.7 })); floor.add(rim); rim.position.y = -0.2;
  const shadowCatch = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.ShadowMaterial({ color: '#3A2A10', opacity: 0.2 })); shadowCatch.rotation.x = -Math.PI / 2; shadowCatch.position.y = -1.6; shadowCatch.receiveShadow = true; scene.add(shadowCatch);
  const grid = new THREE.GridHelper(12, 12, P1.red, P1.ink); grid.scale.z = 0.75; grid.position.y = 0.01; grid.material.transparent = true; grid.material.opacity = 0.5; scene.add(grid);
  const wall = new THREE.Mesh(new THREE.BoxGeometry(12, 5, 0.4), new THREE.MeshStandardMaterial({ color: '#E9DFCC', roughness: 0.9 }));
  wall.position.set(0, 2.5, -4.3); wall.castShadow = wall.receiveShadow = true;
  const wallG = new THREE.Group(); wallG.add(wall); scene.add(wallG);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(12.02, 0.5, 0.42), new THREE.MeshStandardMaterial({ color: P1.red, roughness: 0.8 })); stripe.position.set(0, 1.0, -4.3); wallG.add(stripe);
  // spotlight rig
  const sun = new THREE.SpotLight('#FFE7C2', 0, 0, 0.42, 0.5, 0); sun.position.set(4, 9, 4); sun.target.position.set(0, 0, 0); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
  scene.add(sun, sun.target);
  const lamp = new THREE.Group();
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.6, 0.9, 20, 1, true), new THREE.MeshStandardMaterial({ color: P1.ink, roughness: 0.4, side: THREE.DoubleSide })); lamp.add(head);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12), new THREE.MeshBasicMaterial({ color: '#FFF4D6' })); bulb.position.y = -0.3; lamp.add(bulb);
  lamp.position.copy(sun.position); lamp.lookAt(0, 0, 0); lamp.rotateX(Math.PI / 2); scene.add(lamp);
  const coneLen = Math.hypot(4, 9, 4);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(Math.tan(0.42) * coneLen, coneLen, 32, 1, true), new THREE.MeshBasicMaterial({ color: '#FFE3A8', transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
  cone.position.set(2, 4.5, 2); cone.lookAt(0, 0, 0); cone.rotateX(-Math.PI / 2); scene.add(cone);
  const env = envMap();
  const ball = new THREE.Mesh(new THREE.SphereGeometry(1.2, 48, 32), new THREE.MeshStandardMaterial({ color: P1.orange, roughness: 0.25, metalness: 0.05, envMap: env, envMapIntensity: 0.6 }));
  ball.castShadow = true; scene.add(ball);
  const cube = new THREE.Mesh(new RoundedBoxGeometry(2, 2, 2, 5, 0.25), new THREE.MeshStandardMaterial({ color: P1.red, roughness: 0.45, envMap: env, envMapIntensity: 0.25 }));
  cube.castShadow = true; scene.add(cube);
  // wireframe ghosts for the "build" flash
  const wire = (geo, m) => { const l = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 20), new THREE.LineBasicMaterial({ color: P1.orange, transparent: true })); m.add(l); return l; };
  const wires = { wall: wire(wall.geometry, wall), ball: wire(new THREE.IcosahedronGeometry(1.25, 2), ball), cube: wire(cube.geometry, cube) };
  const camera = new THREE.PerspectiveCamera(36, W / H, 0.5, 200);
  R = { scene, hemi, key, floor, grid, wallG, sun, lamp, cone, ball, cube, wires, camera };
}

const at = (obj) => LINES.find((l) => l.obj === obj).t;
/** analytic drop with bounces: height above floor for time d since release */
function dropY(d, h0, g = 110, e = 0.42) {
  if (d < 0) return h0;
  let v = 0, y = h0, tf = Math.sqrt((2 * h0) / g);
  if (d < tf) return h0 - 0.5 * g * d * d;
  d -= tf; v = g * tf * e;
  for (let k = 0; k < 6; k++) { const tb = (2 * v) / g; if (d < tb) return v * d - 0.5 * g * d * d; d -= tb; v *= e; }
  return 0;
}

export default {
  ...S,
  cutIn: 'punch',
  sfx: [{ t: 17.1, type: 'type', gain: 0.6 }, { t: 17.97, type: 'click' }, { t: 18.8, type: 'impact', gain: 0.9 }],
  init() { paperTex(P1.paper, W, H, 21); build(); warm(R.scene, R.camera); },
  draw(ctx, t, s, E) {
    if (!R) build();
    const lt = s.lt;
    const { scene, camera } = R;
    // ---------- background ----------
    paper(ctx, P1.paper, -lt * 30, 0, 21);

    // ---------- 3D build state ----------
    const g = clamp((t - at('grid')) / 0.25);
    R.grid.scale.setScalar(Math.max(0.001, ease.outExpo(g))); R.grid.visible = g > 0; R.floor.visible = t >= LINES[0].t - 0.05;
    R.floor.scale.setScalar(Math.max(0.001, ease.outExpo(clamp((t - LINES[0].t + 0.05) / 0.3))));
    const w = clamp((t - at('wall')) / 0.3);
    R.wallG.visible = w > 0; R.wallG.scale.set(1, Math.max(0.001, ease.outBack(w, 2.2)), 1);
    R.wires.wall.material.opacity = 1 - clamp((t - at('wall') - 0.08) / 0.2);
    const sOn = t >= at('sun') ? (t - at('sun') < 0.12 ? (Math.floor((t - at('sun')) * 60) % 2) : 1) : 0;
    R.sun.intensity = 1.6 * sOn; R.cone.material.opacity = 0.1 * sOn;
    R.lamp.visible = t >= at('sun') - 0.2; R.lamp.scale.setScalar(Math.max(0.001, ease.outBack(clamp((t - at('sun') + 0.2) / 0.2))));
    R.hemi.intensity = lerp(0.7, 1.15, sOn); R.key.intensity = lerp(1.1, 1.3, sOn);
    const bY = dropY(t - at('ball'), 5);
    R.ball.visible = t >= at('ball') - 0.02; R.ball.position.set(-2.8, 1.2 + bY, 0.6);
    const bImp = t - at('ball') - Math.sqrt(10 / 110); const bsq = bImp > 0 ? 0.25 * Math.exp(-bImp * 9) * Math.abs(Math.cos(bImp * 22)) : 0;
    R.ball.scale.set(1 + bsq, 1 - bsq, 1 + bsq);
    R.wires.ball.material.opacity = 1 - clamp((t - at('ball') - 0.05) / 0.2);
    const cY = dropY(t - at('cube'), 5);
    R.cube.visible = t >= at('cube') - 0.02; R.cube.position.set(2.9, 1 + cY, -1.2);
    R.cube.rotation.set(0, 0.5 + (t - at('cube')) * 1.2, cY * 0.2);
    R.wires.cube.material.opacity = 1 - clamp((t - at('cube') - 0.05) / 0.2);

    // camera: slow orbit + push, scene centred in the right part of frame
    const orbit = lerp(-0.5, -0.22, s.u) + Math.sin(lt * 1.5) * 0.03;
    const dist = lerp(29, 24.5, ease.inOutQuad(s.u)) - A.pulse('kick', t, 0.12) * 0.5;
    camera.position.set(Math.sin(orbit) * dist, lerp(12, 10, s.u), Math.cos(orbit) * dist);
    camera.lookAt(0, 1.2, 0);
    camera.setViewOffset(W, H, -W * 0.235, H * 0.03, W, H);
    camera.updateProjectionMatrix(); camera.updateMatrixWorld();
    render3d(ctx, scene, camera);

    // viewfinder corners framing the viewport
    ctx.save(); ctx.strokeStyle = P1.ink; ctx.lineWidth = 7; ctx.lineCap = 'round';
    const vx0 = 1000, vy0 = 140, vx1 = 1860, vy1 = 930, cl = 46 + 6 * A.pulse('beat', t, 0.1);
    for (const [cx0, cy0, dx, dy] of [[vx0, vy0, 1, 1], [vx1, vy0, -1, 1], [vx0, vy1, 1, -1], [vx1, vy1, -1, -1]]) { ctx.beginPath(); ctx.moveTo(cx0, cy0 + dy * cl); ctx.lineTo(cx0, cy0); ctx.lineTo(cx0 + dx * cl, cy0); ctx.stroke(); }
    ctx.fillStyle = P1.ink; font(ctx, 18, 'JetBrains Mono', '700'); ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ctx.fillText(`${Math.round(1000 / 7.3)} fps · ${LINES.filter((l) => t >= l.t && l.obj).length} objects`, vx1 - 10, vy1 - 22);
    ctx.restore();
    // viewport label
    ctx.fillStyle = P1.ink; roundRect(ctx, 1010, 150, 430, 46, 10); ctx.fill();
    ctx.fillStyle = P1.red; ctx.beginPath(); ctx.arc(1036, 173, 8, 0, TAU); ctx.fill();
    font(ctx, 20, 'JetBrains Mono', '800'); ctx.fillStyle = P1.cream; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('LIVE PREVIEW · THREE.JS', 1056, 174);

    // ---------- CURSOR drops in on "scene" ----------
    const tc = at('cursor');
    if (t >= tc - 0.22) {
      const [fx, fy] = toScreen(camera, 0.2, 0, 2.2);
      const [, hy] = toScreen(camera, 0.2, 3.4, 2.2);
      const sc = Math.abs(fy - hy) / 300;
      const d = t - tc;
      let yy = fy, squash = 0, P = pose('jump', t), eyes = 'normal', mouth = 'open';
      if (d < 0) { yy = fy - ease.inQuad(clamp(-d / 0.22)) * 1100; squash = -0.35; P.armL = [-70, -220]; P.armR = [70, -220]; }
      else { squash = 0.55 * wobble(d, 3.5, 6); P = pose('cheer', t); eyes = 'star'; mouth = 'grin'; }
      blobShadow(ctx, fx, fy + 4, 240 * sc * clamp(1 - (yy < fy ? (fy - yy) / 1500 : 0)), 50 * sc, 0.35);
      drawMascot(ctx, { x: fx, y: yy, s: sc, t, P, squash, eyes, mouth, sticker: true });
      if (d >= 0) {
        ctx.save(); ctx.strokeStyle = P1.orange; ctx.globalAlpha = clamp(1 - d * 2.5); ctx.lineWidth = 12 * (1 - clamp(d * 2));
        ctx.beginPath(); ctx.ellipse(fx, fy, 60 + d * 900, (60 + d * 900) * 0.3, 0, 0, TAU); ctx.stroke(); ctx.restore();
        paperBurst(ctx, fx, fy - 20, d, 30, 88, [P1.red, P1.orange, P1.ink, P1.cream], 1300, 2200, 20);
      }
    }

    // ---------- code editor panel ----------
    ctx.save();
    ctx.fillStyle = P1.red; roundRect(ctx, PX + 14, PY + 16, PW, PH, 22); ctx.fill();
    ctx.fillStyle = '#18204A'; roundRect(ctx, PX, PY, PW, PH, 22); ctx.fill();
    ctx.fillStyle = '#232D5E'; roundRect(ctx, PX, PY, PW, 58, 22); ctx.fill(); ctx.fillRect(PX, PY + 30, PW, 28);
    [P1.red, P1.orange, '#F4EDE0'].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(PX + 32 + i * 28, PY + 29, 8, 0, TAU); ctx.fill(); });
    ctx.fillStyle = '#18204A'; roundRect(ctx, PX + 130, PY + 12, 260, 46, 8); ctx.fill();
    font(ctx, 20, 'JetBrains Mono', '700'); ctx.fillStyle = P1.cream; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText('scenes/g1/V08.js', PX + 150, PY + 36);
    const fs = 27, lh = 74, cw = (font(ctx, fs, 'JetBrains Mono', '700'), ctx.measureText('M').width);
    let caret = null, active = -1;
    LINES.forEach((L, i) => {
      const t0 = i === 0 ? S.start + 0.0 : LINES[i - 1].t + 0.015;
      const k = clamp((t - t0) / (L.t - t0));
      if (t < t0) return;
      const nch = Math.floor(L.s.length * k);
      const y = PY + 110 + i * lh;
      if (k < 1 || (t - L.t) < 0.25) {
        const fl = k >= 1 ? 1 - (t - L.t) / 0.25 : 0.6;
        ctx.fillStyle = `rgba(255,106,31,${0.18 * fl + (k >= 1 ? 0.25 * fl : 0)})`; ctx.fillRect(PX + 8, y - lh / 2 + 6, PW - 16, lh - 12);
      }
      ctx.fillStyle = 'rgba(244,237,224,0.35)'; font(ctx, 20, 'JetBrains Mono', '700'); ctx.textAlign = 'right'; ctx.fillText(String(i + 1), PX + 50, y + 1);
      font(ctx, fs, 'JetBrains Mono', '700'); ctx.textAlign = 'left';
      let x = PX + 72, c = 0;
      for (const tk of tokens(L.s)) {
        if (c >= nch) break;
        const part = tk.s.slice(0, nch - c); ctx.fillStyle = tk.c; ctx.fillText(part, x, y + 1); x += part.length * cw; c += part.length;
      }
      if (k < 1) { caret = [x, y]; active = i; }
      else if (i === LINES.length - 1) caret = [x, y];
      // completion check mark + beam to the 3D object
      if (k >= 1 && L.obj) {
        const d = t - L.t;
        const pop = ease.outBack(clamp(d / 0.12), 3);
        ctx.fillStyle = '#7CFFC4'; font(ctx, 26 * pop, 'JetBrains Mono', '800'); ctx.textAlign = 'right'; ctx.fillText('✓', PX + PW - 22, y + 1);
      }
    });
    if (caret && Math.floor(lt * 6) % 2 === 0 || (caret && active >= 0)) { ctx.fillStyle = P1.orange; ctx.fillRect(caret[0] + 2, caret[1] - 17, cw * 0.9, 34); }
    ctx.restore();

    // beams: code line → object
    const objPos = { grid: [0, 0, 2.5], wall: [0, 4, -4.3], sun: [4, 9, 4], ball: [-2.8, 1.2, 0.6], cube: [2.9, 1, -1.2], cursor: [0.2, 1.2, 2.2] };
    LINES.forEach((L, i) => {
      if (!L.obj) return;
      const d = t - L.t; if (d < -0.02 || d > 0.32) return;
      const y = PY + 110 + i * lh, x0 = PX + PW - 8;
      const [tx, ty] = toScreen(camera, ...objPos[L.obj]);
      const k = ease.outCubic(clamp((d + 0.02) / 0.14)), fade = clamp(1 - (d - 0.12) / 0.2);
      ctx.save(); ctx.globalAlpha = fade; ctx.strokeStyle = P1.orange; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.setLineDash([2, 16]);
      const mx = (x0 + tx) / 2, my = Math.min(y, ty) - 140;
      ctx.beginPath(); ctx.moveTo(x0, y);
      const N = 24; for (let j = 1; j <= N * k; j++) { const u = j / N; const bx = (1 - u) ** 2 * x0 + 2 * (1 - u) * u * mx + u * u * tx, by = (1 - u) ** 2 * y + 2 * (1 - u) * u * my + u * u * ty; ctx.lineTo(bx, by); }
      ctx.stroke(); ctx.setLineDash([]);
      const u = k, sx = (1 - u) ** 2 * x0 + 2 * (1 - u) * u * mx + u * u * tx, sy = (1 - u) ** 2 * y + 2 * (1 - u) * u * my + u * u * ty;
      ctx.fillStyle = '#FFF4D6'; ctx.beginPath(); ctx.arc(sx, sy, 14, 0, TAU); ctx.fill(); ctx.fillStyle = P1.orange; ctx.beginPath(); ctx.arc(sx, sy, 8, 0, TAU); ctx.fill();
      ctx.restore();
    });

    // ---------- big words ----------
    if (t >= 17.96 && t < 18.62) {
      const d = t - 17.96, k = ease.outBack(clamp(d / 0.1), 2.6), out = clamp((18.62 - t) / 0.08);
      ctx.save(); ctx.translate(PX + PW / 2, PY + PH / 2 + 40); ctx.rotate(-0.12); ctx.scale(k * out, k * out);
      printType(ctx, 'CODE', 0, 0, 300, { fill: P1.orange, shadow: P1.ink, off: 0.05, stroke: P1.cream, strokeW: 16 });
      ctx.restore();
    }
    if (t >= 18.78) {
      const d = t - 18.78, k = ease.outExpo(clamp(d / 0.16));
      ctx.save(); ctx.translate(1400, 300); ctx.rotate(-0.05); const sc = lerp(2.2, 1, k) * (1 + 0.04 * wobble(d, 3, 6)); ctx.scale(sc, sc); ctx.globalAlpha = clamp(k * 3);
      printType(ctx, 'EVERY SCENE', 0, 0, 170, { fill: P1.cream, shadow: P1.red, off: 0.05, stroke: P1.ink, strokeW: 16 });
      ctx.restore();
    }

    // fx
    const land = t >= tc ? Math.exp(-(t - tc) * 9) : 0;
    E.fx.shake = land * 22 + (t >= at('sun') && t < at('sun') + 0.1 ? 5 : 0);
    E.fx.zoom += land * 0.035 + A.pulse('snare', t, 0.1) * 0.008;
    if (t >= tc && t < tc + 0.05) E.fx.rgb = 8;
  },
};
