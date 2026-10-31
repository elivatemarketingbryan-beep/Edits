// G04 — "No sponsor," — a "YOUR LOGO HERE" banner hangs on stage from three ropes. A red NO stamp slams onto
// it; on "spon-" two ropes snap and it swings from one corner, on "-sor" the last rope goes and the cloth
// (30×16 verlet grid, structural + shear + bend constraints, wind, drag, floor friction) drops and crumples,
// revealing NO SPONSOR in black on gold. Rendered in Three.js with real cloth shadows.
import { shot } from '../../shots.js';
import { W, H, TAU, ease, seg, clamp, lerp, hash, noise2, sim, font, roundRect, star } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { THREE, render3d } from '../../core/three.js';
import { drawMascot } from '../../core/mascot.js';
import { goldGrad, glowSprite } from './kit.js';

const S = shot('G04');
const NX = 30, NY = 16, BW = 17, BH = 8.5, TOP = 4.6, FLOOR = -5.3;
const T_NO = 81.6, T_SNAP1 = 82.14, T_SNAP2 = 82.4, T_REVEAL = 82.84, SIM0 = S.start - 0.7, DT = 1 / 60;
const PINS = [{ i: 0, t: T_SNAP1 }, { i: 15, t: T_SNAP1 + 0.03 }, { i: NX - 1, t: T_SNAP2 }];
let R = null;

function bannerCanvas() {
  const c = document.createElement('canvas'); c.width = 1536; c.height = 768; return c;
}
function paintBanner(c, stampK) {
  const x = c.getContext('2d'), w = c.width, h = c.height;
  x.fillStyle = '#FFF4D6'; x.fillRect(0, 0, w, h);
  for (let i = 0; i < 1400; i++) { x.fillStyle = `rgba(150,110,40,${0.04 + hash(i, 1) * 0.05})`; x.fillRect(hash(i, 2) * w, hash(i, 3) * h, 2 + hash(i, 4) * 30, 2); }
  x.fillStyle = goldGrad(x, 0, h); x.fillRect(0, 0, w, 54); x.fillRect(0, h - 54, w, 54); x.fillRect(0, 0, 40, h); x.fillRect(w - 40, 0, 40, h);
  x.strokeStyle = '#111'; x.lineWidth = 6; x.strokeRect(56, 70, w - 112, h - 140);
  font(x, 44, 'JetBrains Mono', '800'); x.fillStyle = '#111'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('★  PROUDLY SPONSORED BY  ★', w / 2, 150);
  x.setLineDash([34, 22]); x.lineWidth = 10; roundRect(x, 260, 210, w - 520, 400, 40); x.stroke(); x.setLineDash([]);
  font(x, 132, 'Bungee'); x.fillStyle = '#111'; x.fillText('YOUR LOGO', w / 2, 350); x.fillText('HERE', w / 2, 490);
  font(x, 30, 'JetBrains Mono', '700'); x.fillStyle = 'rgba(17,17,17,0.6)'; x.fillText('(this space available · $$$/mo)', w / 2, 660);
  for (const gx of [70, w / 2, w - 70]) { x.beginPath(); x.arc(gx, 30, 16, 0, TAU); x.fillStyle = '#9AA6BD'; x.fill(); x.lineWidth = 5; x.strokeStyle = '#333'; x.stroke(); x.beginPath(); x.arc(gx, 30, 7, 0, TAU); x.fillStyle = '#222'; x.fill(); }
  if (stampK > 0) { // red NO stamp
    x.save(); x.translate(w / 2 + 330, h / 2 + 30); x.rotate(-0.22); const k = lerp(2.4, 1, ease.outQuad(clamp(stampK))); x.scale(k, k); x.globalAlpha = clamp(stampK * 3) * 0.92;
    x.strokeStyle = '#E8343F'; x.lineWidth = 26; x.beginPath(); x.arc(0, 0, 210, 0, TAU); x.stroke();
    x.beginPath(); x.moveTo(-148, 148); x.lineTo(148, -148); x.stroke();
    font(x, 190, 'Bungee'); x.fillStyle = '#E8343F'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('NO', 0, 10);
    x.restore();
  }
}
function panelCanvas() {
  const c = document.createElement('canvas'); c.width = 2048; c.height = 1056; const x = c.getContext('2d');
  x.fillStyle = goldGrad(x, 0, 1056); x.fillRect(0, 0, 2048, 1056);
  for (let i = 0; i < 24; i++) { const a0 = (i / 24) * TAU, a1 = a0 + TAU / 48; x.fillStyle = 'rgba(255,240,180,0.25)'; x.beginPath(); x.moveTo(1024, 528); x.lineTo(1024 + Math.cos(a0) * 2400, 528 + Math.sin(a0) * 2400); x.lineTo(1024 + Math.cos(a1) * 2400, 528 + Math.sin(a1) * 2400); x.fill(); }
  x.strokeStyle = '#111'; x.lineWidth = 22; x.strokeRect(40, 40, 2048 - 80, 1056 - 80);
  font(x, 560, 'Anton'); x.textAlign = 'center'; x.textBaseline = 'middle';
  const m = x.measureText('NO SPONSOR').width; const k = Math.min(1, 1800 / m); font(x, 560 * k, 'Anton');
  x.fillStyle = 'rgba(122,75,0,0.6)'; x.fillText('NO SPONSOR', 1024 + 16, 560 + 18);
  x.fillStyle = '#111'; x.fillText('NO SPONSOR', 1024, 560);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

function build() {
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(32, W / H, 0.1, 200);
  scene.add(new THREE.HemisphereLight(0xfff4d6, 0x3a2a10, 1.05));
  const key = new THREE.DirectionalLight(0xfff0d0, 2.6); key.position.set(-7, 12, 16); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -16, right: 16, top: 12, bottom: -10, near: 1, far: 60 }); key.shadow.bias = -0.0006; key.shadow.normalBias = 0.02;
  scene.add(key, key.target);
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(19.4, 10.0), new THREE.MeshStandardMaterial({ map: panelCanvas(), roughness: 0.45, metalness: 0.15 }));
  panel.position.set(0, 0.35, -1.6); panel.receiveShadow = true; scene.add(panel);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 30), new THREE.MeshStandardMaterial({ color: 0x2A1C08, roughness: 0.35, metalness: 0.2 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = FLOOR; floor.receiveShadow = true; scene.add(floor);
  // cloth
  const geo = new THREE.PlaneGeometry(BW, BH, NX - 1, NY - 1);
  const bc = bannerCanvas(); paintBanner(bc, 0);
  const btex = new THREE.CanvasTexture(bc); btex.colorSpace = THREE.SRGBColorSpace; btex.anisotropy = 8;
  const front = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: btex, roughness: 0.9, side: THREE.FrontSide }));
  const back = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0xE8D9B0, roughness: 0.95, side: THREE.BackSide }));
  for (const m of [front, back]) { m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; scene.add(m); }
  return { scene, cam, geo, btex, bc, stampDone: -1 };
}

// ---------- verlet cloth ----------
function initCloth() {
  const n = NX * NY, p = new Float32Array(n * 3), q = new Float32Array(n * 3);
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
    const k = j * NX + i; p[k * 3] = -BW / 2 + (i / (NX - 1)) * BW; p[k * 3 + 1] = TOP - (j / (NY - 1)) * BH; p[k * 3 + 2] = 0;
  }
  q.set(p);
  const cons = [];
  const add = (a, b, s) => { const dx = p[a * 3] - p[b * 3], dy = p[a * 3 + 1] - p[b * 3 + 1], dz = p[a * 3 + 2] - p[b * 3 + 2]; cons.push([a, b, Math.hypot(dx, dy, dz), s]); };
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
    const k = j * NX + i;
    if (i < NX - 1) add(k, k + 1, 1); if (j < NY - 1) add(k, k + NX, 1);
    if (i < NX - 1 && j < NY - 1) { add(k, k + NX + 1, 0.7); add(k + 1, k + NX, 0.7); }
    if (i < NX - 2) add(k, k + 2, j === 0 ? 0.6 : 0.25); if (j < NY - 2) add(k, k + 2 * NX, 0.25);
  }
  return { p, q, cons, pinPos: PINS.map((P) => [p[P.i * 3], p[P.i * 3 + 1], p[P.i * 3 + 2]]), time: SIM0 };
}
function stepCloth(st) {
  st.time += DT; const t = st.time, { p, q, cons } = st;
  const g = (t > T_SNAP1 ? -44 : -24) * DT * DT, n = NX * NY;
  const pinned = new Set(PINS.filter((P) => t < P.t).map((P) => P.i));
  const falling = t > T_SNAP1;
  for (let k = 0; k < n; k++) {
    if (pinned.has(k)) continue;
    const i = k % NX, j = (k / NX) | 0, b = k * 3;
    const damp = falling ? 0.985 : 0.97;
    const vx = (p[b] - q[b]) * damp, vy = (p[b + 1] - q[b + 1]) * damp, vz = (p[b + 2] - q[b + 2]) * damp;
    q[b] = p[b]; q[b + 1] = p[b + 1]; q[b + 2] = p[b + 2];
    // wind / flutter
    const wz = (falling ? 9 : 2.2) * noise2(i * 0.18 + t * (falling ? 2.6 : 0.9), j * 0.22 - t * 0.7) * (j / (NY - 1) + 0.2);
    const wx = falling ? 2.5 * noise2(i * 0.2 - t * 1.7, j * 0.2 + 5) : 0;
    p[b] += vx + wx * DT * DT; p[b + 1] += vy + g; p[b + 2] += vz + wz * DT * DT;
  }
  for (let it = 0; it < 14; it++) {
    for (const [a, c, rest, s] of cons) {
      const pa = pinned.has(a), pc = pinned.has(c); if (pa && pc) continue;
      const A3 = a * 3, C3 = c * 3;
      const dx = p[C3] - p[A3], dy = p[C3 + 1] - p[A3 + 1], dz = p[C3 + 2] - p[A3 + 2];
      const d = Math.hypot(dx, dy, dz) || 1e-6;
      if (s < 1 && d < rest) continue; // bend/shear: resist stretching only (lets it fold)
      const diff = ((d - rest) / d) * s;
      const wa = pa ? 0 : pc ? 1 : 0.5, wc = pc ? 0 : pa ? 1 : 0.5;
      p[A3] += dx * diff * wa; p[A3 + 1] += dy * diff * wa; p[A3 + 2] += dz * diff * wa;
      p[C3] -= dx * diff * wc; p[C3 + 1] -= dy * diff * wc; p[C3 + 2] -= dz * diff * wc;
    }
    for (let k = 0; k < n; k++) {
      const b = k * 3;
      if (p[b + 1] < FLOOR + 0.05) { p[b + 1] = FLOOR + 0.05 + (k % 7) * 0.004; q[b] = lerp(q[b], p[b], 0.6); q[b + 2] = lerp(q[b + 2], p[b + 2], 0.6); }
      if (p[b + 2] < -1.4) p[b + 2] = -1.4;
    }
    PINS.forEach((P, pi) => { if (pinned.has(P.i)) { const b = P.i * 3; p[b] = st.pinPos[pi][0]; p[b + 1] = st.pinPos[pi][1]; p[b + 2] = st.pinPos[pi][2]; } });
  }
}

export default {
  ...S,
  cutIn: 'punch',
  sfx: [{ t: T_NO, type: 'stamp', gain: 1 }, { t: T_SNAP1, type: 'rip', gain: 1 }, { t: T_SNAP2, type: 'rip', gain: 0.8 }, { t: T_REVEAL, type: 'boom', gain: 0.8 }],
  draw(ctx, t, s, E) {
    if (!R) R = build();
    const lt = s.lt;
    const st = sim('G04cloth', Math.floor((t - SIM0) / DT), initCloth, stepCloth);
    // cloth → geometry (PlaneGeometry vertex order matches our grid: row-major from the top-left)
    const pos = R.geo.attributes.position;
    for (let k = 0; k < NX * NY; k++) pos.setXYZ(k, st.p[k * 3], st.p[k * 3 + 1], st.p[k * 3 + 2]);
    pos.needsUpdate = true; R.geo.computeVertexNormals();
    // stamp animates in the texture
    const sk = seg(t, T_NO - 0.02, T_NO + 0.1), skey = Math.round(sk * 12);
    if (skey !== R.stampDone) { paintBanner(R.bc, sk); R.btex.needsUpdate = true; R.stampDone = skey; }

    // ---------- 2D stage behind ----------
    const rv = t >= T_REVEAL ? 1 : 0;
    ctx.fillStyle = '#141008'; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 24; i++) { ctx.fillStyle = i % 2 ? 'rgba(255,195,0,0.04)' : 'rgba(0,0,0,0.12)'; ctx.fillRect(i * 80, 0, 80, H); }
    // spotlights sweeping
    ctx.globalCompositeOperation = 'lighter';
    for (const [sx, ph] of [[300, 0], [1620, 2]]) {
      const aim = 960 + Math.sin(t * 1.6 + ph) * 420 * (1 - rv * 0.8);
      const g = ctx.createLinearGradient(sx, 0, aim, H); g.addColorStop(0, 'rgba(255,240,200,0.5)'); g.addColorStop(1, 'rgba(255,220,150,0.02)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(sx - 30, -20); ctx.lineTo(sx + 30, -20); ctx.lineTo(aim + 330, H + 40); ctx.lineTo(aim - 330, H + 40); ctx.closePath(); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';

    // ---------- 3D ----------
    const push = ease.inOutQuad(seg(t, S.start, S.end));
    R.cam.position.set(Math.sin(lt * 0.9) * 0.4, 0.3 - push * 0.3, 27 - push * 2.2);
    R.cam.lookAt(0, 0.1, 0); R.cam.updateProjectionMatrix();
    render3d(ctx, R.scene, R.cam, { toneMapping: THREE.ACESFilmicToneMapping, exposure: 1.15 });

    // ropes (2D) from the fly bars to the grommets; after a snap the upper piece whips back up
    const proj = (x, y, z) => { const v = new THREE.Vector3(x, y, z).project(R.cam); return [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H]; };
    PINS.forEach((P, pi) => {
      const [ax, ay] = proj(st.pinPos[pi][0], st.pinPos[pi][1], 0);
      const topX = ax + (pi - 1) * 40, topY = -30;
      const age = t - P.t;
      ctx.lineCap = 'round';
      let ex = ax, ey = ay, bend = 0;
      if (age >= 0) { const k = ease.outExpo(clamp(age / 0.35)); ex = lerp(ax, topX, k * 0.7); ey = lerp(ay, topY + 120, k); bend = Math.sin(age * 40) * 60 * Math.exp(-age * 5); }
      for (const [w, col] of [[11, '#111'], [6, '#C9A56A']]) {
        ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(topX, topY);
        ctx.quadraticCurveTo((topX + ex) / 2 + bend, (topY + ey) / 2, ex, ey); ctx.stroke();
      }
      if (age >= 0 && age < 0.25) { // snap sparks
        const [bx, by] = proj(st.pinPos[pi][0], st.pinPos[pi][1], 0);
        ctx.save(); ctx.translate(bx, by - 30); const k = age / 0.25;
        star(ctx, 0, 0, 80 * (0.5 + k), 30 * (0.5 + k), 8, age * 6); ctx.fillStyle = `rgba(255,240,180,${1 - k})`; ctx.fill(); ctx.restore();
      }
    });

    // gold curtains + valance framing the stage (in front)
    const curtain = (x0, dir) => {
      const g = ctx.createLinearGradient(x0, 0, x0 + dir * 270, 0);
      for (let i = 0; i <= 6; i++) g.addColorStop(i / 6, i % 2 ? '#7A4B00' : '#FFC300');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x0, 0); ctx.lineTo(x0 + dir * 270, 0);
      ctx.quadraticCurveTo(x0 + dir * 180, H * 0.55, x0 + dir * 120 + Math.sin(t * 2 + dir) * 8, H); ctx.lineTo(x0, H); ctx.closePath(); ctx.fill();
      ctx.lineWidth = 8; ctx.strokeStyle = '#111'; ctx.stroke();
    };
    curtain(-10, 1); curtain(W + 10, -1);
    ctx.fillStyle = '#111'; ctx.fillRect(0, 0, W, 34);
    for (let i = 0; i < 26; i++) { const x = i * 77; ctx.beginPath(); ctx.arc(x + 38, 30, 40, 0, Math.PI); ctx.fillStyle = i % 2 ? '#FFC300' : '#E0A100'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = '#111'; ctx.stroke(); }

    // CURSOR at the side of the stage: looks up → flinches → shrug on the reveal
    const P = t < T_SNAP1 ? 'idle' : t < T_REVEAL - 0.1 ? 'jump' : 'shrug';
    const hop = t > T_SNAP1 && t < T_REVEAL ? Math.sin(seg(t, T_SNAP1, T_SNAP1 + 0.35) * Math.PI) * 60 : 0;
    drawMascot(ctx, { x: 215, y: 922 - hop, s: 0.9, t, pose: P, eyes: t < T_SNAP1 ? 'normal' : t < T_REVEAL ? 'x' : 'shades', mouth: t < T_SNAP1 ? 'auto' : t < T_REVEAL ? 'o' : 'grin', look: t < T_SNAP1 ? [0.6, -0.7] : [0.5, -0.2], sticker: true });

    // reveal: shine sweep over the panel text + gold glitter
    if (rv) {
      const age = t - T_REVEAL, k = ease.inOutCubic(clamp(age / 0.4));
      const [lx, ly] = proj(-9.7, 5.35, -1.6), [rx2, ry2] = proj(9.7, -4.65, -1.6);
      ctx.save(); ctx.beginPath(); ctx.rect(lx, ly, rx2 - lx, ry2 - ly); ctx.clip();
      ctx.globalCompositeOperation = 'lighter';
      const sx = lerp(lx - 300, rx2 + 300, k);
      const g = ctx.createLinearGradient(sx - 140, 0, sx + 140, 0); g.addColorStop(0, 'rgba(255,255,230,0)'); g.addColorStop(0.5, 'rgba(255,255,230,0.6)'); g.addColorStop(1, 'rgba(255,255,230,0)');
      ctx.fillStyle = g; ctx.save(); ctx.translate(sx, (ly + ry2) / 2); ctx.rotate(0.25); ctx.fillRect(-140, -900, 280, 1800); ctx.restore();
      ctx.restore();
      for (let i = 0; i < 30; i++) { const a = hash(i, 5) * TAU, sp = 300 + hash(i, 6) * 700; const x = 960 + Math.cos(a) * sp * age, y = 520 + Math.sin(a) * sp * age + 600 * age * age; ctx.globalAlpha = clamp(1 - age / 0.45); star(ctx, x, y, 14, 5, 4, age * 8 + i); ctx.fillStyle = '#FFF4D6'; ctx.fill(); }
      ctx.globalAlpha = 1;
    }

    // FX
    const stampH = t >= T_NO ? Math.exp(-(t - T_NO) / 0.1) : 0;
    const snapH = Math.max(t >= T_SNAP1 ? Math.exp(-(t - T_SNAP1) / 0.1) : 0, t >= T_SNAP2 ? Math.exp(-(t - T_SNAP2) / 0.1) : 0);
    const revH = t >= T_REVEAL ? Math.exp(-(t - T_REVEAL) / 0.14) : 0;
    E.fx.shake = stampH * 18 + snapH * 12 + revH * 28; E.fx.zoom += stampH * 0.03 + revH * 0.05; E.fx.rgb = 2 + revH * 12 + snapH * 6;
    if (t >= T_REVEAL && t < T_REVEAL + 0.06) E.fx.flash = [1, 0.95, 0.75, 0.6];
    E.fx.vignette = 0.35; E.fx.bloom = 0.3; E.fx.bloomThreshold = 0.8;
  },
};
