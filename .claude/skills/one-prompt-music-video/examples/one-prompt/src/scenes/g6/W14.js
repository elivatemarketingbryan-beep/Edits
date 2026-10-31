// W14 — "every beat lands right" — a 3D 16-step drum machine programmed with the REAL drum events of this song.
// Pads are quantised to the 16th grid but fire at the exact detected hit times (A.eventsIn); CURSOR hops from
// pad to pad and LANDS on every hit; each hit launches a labelled cube + a shockwave ring.
import { shot } from '../../shots.js';
import { W, H, TAU, ease, seg, clamp, lerp, font, roundRect, buf, bctx } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { THREE, render3d, RoundedBoxGeometry } from '../../core/three.js';
import { mascotSprite } from '../../core/mascot.js';
import { BRUT } from './kit.js';

const S = shot('W14');
const ROWS = [
  { kind: 'kick', name: 'KICK', col: '#FF2A2A' },
  { kind: 'snare', name: 'SNARE', col: '#2B2BFF' },
  { kind: 'hat', name: 'HAT', col: '#FF6A1F' },
  { kind: 'perc', name: 'PERC', col: '#FFD23F' },
];
const T0 = 72.678, NSTEP = 16;
let STEP = 0.1495;
const colX = (k) => (k - 7.5) * 1.0 + (Math.floor(k / 4) - 1.5) * 0.28;
const colXf = (f) => { const k = Math.floor(f), u = f - k; return lerp(colX(clamp(k, 0, 15)), colX(clamp(k + 1, 0, 15)), u); };
const rowZ = (r) => (r - 1.5) * 1.05;
const PAD_TOP = 0.22;

let R = null;
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); draw(x, w, h);
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 8; tx._c = c; tx._x = x; return tx;
}
function outline(mesh, w, h, d, e = 0.04) {
  const o = new THREE.Mesh(mesh.geometry, new THREE.MeshBasicMaterial({ color: 0x0E0E12, side: THREE.BackSide }));
  o.scale.set((w + 2 * e) / w, (h + 2 * e) / h, (d + 2 * e) / d); mesh.add(o); return o;
}

function build() {
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(38, W / H, 0.1, 200);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x9aa0c0, 1.15));
  const key = new THREE.DirectionalLight(0xffffff, 1.7); key.position.set(-5, 14, 9); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -16, right: 16, top: 10, bottom: -10, near: 1, far: 40 }); key.shadow.bias = -0.0008;
  scene.add(key, key.target);
  const fill = new THREE.DirectionalLight(0xdfe6ff, 0.5); fill.position.set(8, 5, 10); scene.add(fill);

  // body
  const bw = 21.2, bh = 1.0, bd = 6.9;
  const body = new THREE.Mesh(new RoundedBoxGeometry(bw, bh, bd, 4, 0.3), new THREE.MeshStandardMaterial({ color: 0x1B1B24, roughness: 0.42, metalness: 0.1 }));
  body.position.set(-1.35, -bh / 2, -0.55); body.receiveShadow = true; scene.add(body); outline(body, bw, bh, bd, 0.06);
  // dark inset under the pads
  const inset = new THREE.Mesh(new RoundedBoxGeometry(17.6, 0.06, 4.6, 2, 0.02), new THREE.MeshStandardMaterial({ color: 0x2C2C38, roughness: 0.8 }));
  inset.position.set(0, 0.01, 0); inset.receiveShadow = true; scene.add(inset);
  // floor shadow catcher far below (for depth)
  // pads
  const padGeo = new RoundedBoxGeometry(0.8, 0.22, 0.8, 3, 0.07);
  const pads = [];
  for (let r = 0; r < 4; r++) for (let k = 0; k < NSTEP; k++) {
    const m = new THREE.Mesh(padGeo, new THREE.MeshStandardMaterial({ color: 0xF6F6F6, roughness: 0.35, emissive: 0x000000 }));
    m.position.set(colX(k), 0.11, rowZ(r)); m.castShadow = true; m.receiveShadow = true; scene.add(m); outline(m, 0.8, 0.22, 0.8, 0.035);
    pads.push(m);
  }
  // row labels (left) + row LEDs
  const labels = ROWS.map((row, r) => {
    const tx = canvasTex(512, 160, (x, w, h) => { x.fillStyle = '#1B1B24'; x.fillRect(0, 0, w, h); font(x, 92, 'Rubik Mono One'); x.fillStyle = '#FFFFFF'; x.textAlign = 'left'; x.textBaseline = 'middle'; x.fillText(row.name, 10, h / 2 + 4); });
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.75), new THREE.MeshStandardMaterial({ map: tx, roughness: 0.7, transparent: false }));
    pl.rotation.x = -Math.PI / 2; pl.position.set(-10.3, 0.004, rowZ(r)); scene.add(pl);
    const led = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.08, 20), new THREE.MeshStandardMaterial({ color: row.col, emissive: row.col, emissiveIntensity: 0.1 }));
    led.position.set(-8.75, 0.04, rowZ(r)); scene.add(led);
    return { pl, led };
  });
  // step LEDs behind the grid
  const leds = [];
  for (let k = 0; k < NSTEP; k++) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.1, 0.22), new THREE.MeshStandardMaterial({ color: 0x551111, emissive: 0xFF2A2A, emissiveIntensity: 0 }));
    m.position.set(colX(k), 0.05, -2.55); scene.add(m); leds.push(m);
  }
  // step numbers along the front lip
  const nums = canvasTex(2048, 96, (x, w, h) => {
    x.fillStyle = '#1B1B24'; x.fillRect(0, 0, w, h); x.textAlign = 'center'; x.textBaseline = 'middle';
    for (let k = 0; k < NSTEP; k++) { const px = (colX(k) + 9) / 18 * w; font(x, k % 4 === 0 ? 56 : 40, 'JetBrains Mono', '800'); x.fillStyle = k % 4 === 0 ? '#FFFFFF' : '#8A8AA0'; x.fillText(String(k + 1), px, h / 2 + 2); if (k % 4 === 0) { x.fillRect(px - 26, h - 12, 52, 7); } }
  });
  const numPl = new THREE.Mesh(new THREE.PlaneGeometry(18, 0.85), new THREE.MeshStandardMaterial({ map: nums, roughness: 0.8 }));
  numPl.rotation.x = -Math.PI / 2; numPl.position.set(0, 0.004, 2.25); scene.add(numPl);
  // back LCD strip (scrolling text) — tilted toward the camera
  const lcd = canvasTex(2048, 160, () => {});
  const lcdBox = new THREE.Mesh(new RoundedBoxGeometry(18.4, 1.25, 0.5, 2, 0.1), new THREE.MeshStandardMaterial({ color: 0x0E0E12, roughness: 0.4 }));
  lcdBox.position.set(-0.2, 0.55, -3.25); lcdBox.rotation.x = -0.5; scene.add(lcdBox);
  const lcdPl = new THREE.Mesh(new THREE.PlaneGeometry(17.8, 1.0), new THREE.MeshBasicMaterial({ map: lcd }));
  lcdPl.position.set(0, 0, 0.26); lcdBox.add(lcdPl);
  // playhead
  const ph = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.5, 4.5), new THREE.MeshBasicMaterial({ color: 0x2B2BFF, transparent: true, opacity: 0.16, depthWrite: false }));
  ph.position.set(0, 0.26, 0); scene.add(ph);
  const phBar = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.06, 0.12), new THREE.MeshBasicMaterial({ color: 0x2B2BFF }));
  phBar.position.set(0, 0.03, 2.0); scene.add(phBar);
  const phBar2 = phBar.clone(); phBar2.position.z = -2.05; scene.add(phBar2);

  // events → pattern
  const ev = [];
  const winA = T0 - STEP * 0.5, winB = T0 + STEP * (NSTEP - 0.5);
  ROWS.forEach((row, r) => {
    const used = new Set();
    for (const te of A.eventsIn(row.kind, winA, winB)) {
      const k = clamp(Math.round((te - T0) / STEP), 0, 15);
      if (used.has(k)) continue; used.add(k);
      ev.push({ r, k, t: te });
    }
  });
  ev.sort((a, b) => a.t - b.t);
  // cube + ring per event
  const cubeTex = ROWS.map((row) => canvasTex(256, 256, (x, w, h) => { x.fillStyle = row.col; x.fillRect(0, 0, w, h); x.strokeStyle = '#0E0E12'; x.lineWidth = 14; x.strokeRect(7, 7, w - 14, h - 14); font(x, row.name.length > 4 ? 50 : 64, 'Rubik Mono One'); x.fillStyle = row.kind === 'perc' ? '#0E0E12' : '#FFFFFF'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(row.name, w / 2, h / 2 + 4); }));
  const cubeGeo = new RoundedBoxGeometry(0.72, 0.72, 0.72, 3, 0.08);
  const ringGeo = new THREE.RingGeometry(0.42, 0.56, 48);
  for (const e of ev) {
    e.cube = new THREE.Mesh(cubeGeo, new THREE.MeshStandardMaterial({ map: cubeTex[e.r], roughness: 0.35 }));
    e.cube.castShadow = true; outline(e.cube, 0.72, 0.72, 0.72, 0.035); e.cube.visible = false; scene.add(e.cube);
    e.ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: ROWS[e.r].col, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
    e.ring.rotation.x = -Math.PI / 2; e.ring.visible = false; scene.add(e.ring);
  }
  // CURSOR billboard + blob shadow
  const curTex = new THREE.CanvasTexture(mascotSprite('W14cur', { t: 0 }, 420, 460)); curTex.colorSpace = THREE.SRGBColorSpace;
  const cur = new THREE.Sprite(new THREE.SpriteMaterial({ map: curTex, transparent: true })); cur.center.set(0.5, 0.04); cur.scale.set(2.9, 3.18, 1); scene.add(cur);
  const blob = new THREE.Mesh(new THREE.CircleGeometry(0.55, 32), new THREE.MeshBasicMaterial({ color: 0x0E0E12, transparent: true, opacity: 0.35, depthWrite: false }));
  blob.rotation.x = -Math.PI / 2; scene.add(blob);
  // hop path: every event of the song between these times becomes a landing
  const lands = ev.filter((e) => e.t > 73.3 && e.t < 75.0);
  return { scene, cam, pads, labels, leds, lcd, ph, phBar, phBar2, ev, cur, curTex, blob, lands, body };
}

function cursorAt(t) {
  const L = R.lands; const P = (e) => [colX(e.k), PAD_TOP, rowZ(e.r)];
  if (t <= L[0].t) { const p = P(L[0]); return { p, air: 0, since: 1, next: L[0] }; }
  for (let i = 0; i < L.length - 1; i++) {
    const a = L[i], b = L[i + 1];
    if (t >= a.t && t < b.t) {
      const d = b.t - a.t, u = (t - a.t) / d, pa = P(a), pb = P(b);
      const hm = 0.35 + d * 2.2;
      // short ground contact (0.05 s) then a parabolic hop that lands exactly on b.t
      const c = Math.min(0.05, d * 0.3), uu = clamp((t - a.t - c) / (d - c));
      const y = PAD_TOP + 4 * hm * uu * (1 - uu);
      return { p: [lerp(pa[0], pb[0], ease.inOutQuad(uu)), y, lerp(pa[2], pb[2], ease.inOutQuad(uu))], air: uu > 0 && uu < 1 ? 1 : 0, since: t - a.t, uu, next: b };
    }
  }
  const e = L[L.length - 1]; return { p: P(e), air: 0, since: t - e.t };
}

export default {
  ...S,
  cutIn: 'punch',
  sfx: [{ t: 73.7, type: 'click' }, { t: 74.095, type: 'click' }],
  draw(ctx, t, s, E) {
    if (!R) {
      const bs = A.eventsIn('beat', 72.6, 75.2); if (bs.length >= 5) STEP = (bs[4] - bs[0]) / 16;
      R = build();
    }
    const lt = s.lt;
    // ---------- 2D backdrop: graph paper + headline ----------
    const cs = cursorAt(t);
    const camX = cs.p[0];
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(43,43,255,0.16)'; ctx.lineWidth = 2;
    const gx = -(camX * 40) % 60;
    for (let x = gx - 60; x < W + 60; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    const bp = A.pulse('beat', t, 0.12);
    const inv = t >= 73.78 && t < 73.86; // flash on "beat"
    ctx.save(); ctx.translate(W / 2 - camX * 6, 236);
    const hk = ease.outExpo(seg(lt, 0, 0.25)), hsx = 1 + bp * 0.05;
    ctx.scale(hsx * lerp(1.4, 1, hk), hsx * lerp(1.4, 1, hk));
    font(ctx, 230, 'Anton'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = BRUT.blue; ctx.fillText('EVERY BEAT', 12, 12);
    ctx.lineWidth = 10; ctx.strokeStyle = '#0E0E12'; ctx.lineJoin = 'round'; ctx.strokeText('EVERY BEAT', 0, 0);
    ctx.fillStyle = inv ? BRUT.red : '#0E0E12'; ctx.fillText('EVERY BEAT', 0, 0);
    ctx.restore();

    // ---------- 3D update ----------
    const step = (t - T0) / STEP; // fractional column of the playhead
    const phx = colXf(clamp(step, 0, 15.49));
    R.ph.position.x = phx; R.phBar.position.x = phx; R.phBar2.position.x = phx;
    R.leds.forEach((m, k) => { m.material.emissiveIntensity = Math.abs(step - k) < 0.5 ? 2.2 : (k % 4 === 0 ? 0.25 : 0); });
    const rowFlash = [0, 0, 0, 0];
    R.pads.forEach((m) => { m.material.color.set(0xF6F6F6); m.material.emissive.set(0x000000); m.position.y = 0.11; });
    for (const e of R.ev) {
      const pad = R.pads[e.r * NSTEP + e.k], col = ROWS[e.r].col, age = t - e.t;
      if (age < 0) { pad.material.color.set(col).lerp(new THREE.Color(0xFFFFFF), 0.62); }
      else {
        pad.material.color.set(col); pad.material.emissive.set(col); pad.material.emissiveIntensity = 0.12 + 1.6 * Math.exp(-age / 0.16);
        pad.position.y = 0.11 - 0.09 * Math.exp(-age / 0.09);
        rowFlash[e.r] = Math.max(rowFlash[e.r], Math.exp(-age / 0.15));
      }
      // cube pop
      const cu = e.cube;
      if (age >= 0 && age < 0.8 && e.t > S.start - 0.25) {
        const g = 26, v0 = 8.2, ta = 2 * v0 / g;
        let y; if (age < ta) y = v0 * age - 0.5 * g * age * age; else { const a2 = age - ta, v1 = v0 * 0.38; y = Math.max(0, v1 * a2 - 0.5 * g * a2 * a2); }
        cu.visible = true; cu.position.set(colX(e.k), PAD_TOP + 0.4 + y, rowZ(e.r));
        cu.rotation.set(age * 7 * (e.r % 2 ? 1 : -1), age * 5, age * 3);
        const sc = Math.min(1, age / 0.06) * (age > 0.6 ? 1 - (age - 0.6) / 0.2 : 1);
        cu.scale.setScalar(Math.max(0.001, sc));
      } else cu.visible = false;
      const rg = e.ring;
      if (age >= 0 && age < 0.45) { rg.visible = true; const k = age / 0.45; rg.position.set(colX(e.k), PAD_TOP + 0.02, rowZ(e.r)); rg.scale.setScalar(1 + k * 2.6); rg.material.opacity = (1 - k) * 0.9; }
      else rg.visible = false;
    }
    R.labels.forEach((L, r) => { L.led.material.emissiveIntensity = 0.1 + rowFlash[r] * 3; });
    // LCD text
    {
      const c = R.lcd._c, x = R.lcd._x; x.fillStyle = '#B9F2C4'; x.fillRect(0, 0, c.width, c.height);
      x.fillStyle = 'rgba(14,14,18,0.08)'; for (let i = 0; i < c.width; i += 8) x.fillRect(i, 0, 2, c.height);
      font(x, 70, 'Press Start 2P'); x.fillStyle = '#123018'; x.textBaseline = 'middle'; x.textAlign = 'left';
      const msg = `EVERY BEAT LANDS RIGHT ▸ 100 BPM ▸ STEP ${String(clamp(Math.floor(step) + 1, 1, 16)).padStart(2, '0')}/16 ▸ REAL DRUM DATA ▸ `;
      const mw = x.measureText(msg).width, off = -((lt * 900) % mw);
      x.fillText(msg, off, c.height / 2 + 6); x.fillText(msg, off + mw, c.height / 2 + 6);
      R.lcd.needsUpdate = true;
    }
    // CURSOR hop
    const land = cs.air ? 0 : Math.exp(-cs.since / 0.08);
    mascotSprite('W14cur', { t, pose: cs.air ? 'jump' : 'cheer', eyes: cs.air ? 'normal' : 'star', mouth: cs.air ? 'o' : 'grin', squash: land * 0.3 - (cs.air ? 0.06 : 0), sticker: true }, 420, 460);
    R.curTex.needsUpdate = true;
    R.cur.position.set(cs.p[0], cs.p[1], cs.p[2] + 0.05);
    R.blob.position.set(cs.p[0], PAD_TOP + 0.01, cs.p[2]); R.blob.scale.setScalar(1 - clamp((cs.p[1] - PAD_TOP) / 4) * 0.6); R.blob.material.opacity = 0.35 * (1 - clamp((cs.p[1] - PAD_TOP) / 4) * 0.6);
    // machine bump on beats
    R.body.position.y = -0.5 - bp * 0.06;

    // camera: swings from a low dramatic angle into a 3/4 view, always chasing CURSOR
    const e1 = ease.outExpo(seg(lt, 0, 0.55)), e2 = ease.inOutQuad(seg(lt, 0.3, 1.0));
    const cx = camX;
    R.cam.position.set(cx - lerp(4.8, 1.6, e1) - e2 * 0.8, lerp(2.4, 9.2, e1) + bp * 0.15 + e2 * 0.6, lerp(6.0, 8.0, e1) + e2 * 0.5);
    R.cam.lookAt(cx + 0.9, lerp(1.0, 2.1, e1), lerp(-0.8, -0.6, e1));
    R.cam.fov = lerp(46, 40, e1); R.cam.updateProjectionMatrix();
    render3d(ctx, R.scene, R.cam);

    // FX: every real hit pumps the frame
    let hp = 0; for (const e of R.ev) if (t >= e.t) hp = Math.max(hp, Math.exp(-(t - e.t) / 0.09));
    E.fx.zoom += hp * 0.02; E.fx.rgb = 2 + hp * 8; E.fx.shake = hp * 7;
    E.fx.bloom = 0.25; E.fx.bloomThreshold = 0.8;
  },
};
