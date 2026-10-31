// g7 shared helpers: 3D chunky CURSOR (Three.js), its live face texture, chrome display type, backgrounds.
import { THREE, RoundedBoxGeometry, envMap, renderer } from '../../core/three.js';
import { W, H, TAU, clamp, lerp, roundRect, star, heart, font, hex2rgb, buf, bctx } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { MASCOT, pose } from '../../core/mascot.js';

export const K = { lilac: '#B79CFF', cyan: '#3EF0FF', mint: '#7CFFC4', chrome: '#DDE3EE', deep: '#1A1240', white: '#FFFFFF', ink: '#1F2A55' };

// ---------------------------------------------------------------- face texture (matches core drawMascot)
/** draw CURSOR's face into a canvas sized to the body (170×230 body units × k). */
export function drawFace(x, o) {
  const { k = 2, t = 0, eyes = 'normal', look = [0, 0], blink = 'auto' } = o;
  let mouth = o.mouth ?? 'auto';
  const cw = 170 * k, ch = 230 * k;
  x.clearRect(0, 0, cw, ch);
  x.save(); x.translate(cw / 2, ch / 2); x.scale(k, k);
  const ink = MASCOT.ink;
  let bl = blink;
  if (bl === 'auto') { const b = (t + 0.7) % 3.1; bl = b < 0.12 ? Math.sin((b / 0.12) * Math.PI) : 0; }
  // gloss streak (as on the 2D mascot)
  x.fillStyle = 'rgba(255,255,255,0.42)'; roundRect(x, -85 + 16, -115 + 14, 22, 70, 11); x.fill(); roundRect(x, -85 + 16, -115 + 92, 22, 16, 8); x.fill();
  const eyeY = -48, eyeX = 38;
  const eye = (ex, closed) => {
    if (eyes === 'happy' || closed >= 0.98) { x.beginPath(); if (eyes === 'happy') x.arc(ex, eyeY + 10, 18, Math.PI * 1.1, Math.PI * 1.9); else { x.moveTo(ex - 18, eyeY + 6); x.lineTo(ex + 18, eyeY + 6); } x.lineWidth = 8; x.strokeStyle = ink; x.lineCap = 'round'; x.stroke(); return; }
    if (eyes === 'star') { star(x, ex, eyeY, 26, 11, 5); x.fillStyle = '#FFE14D'; x.fill(); x.lineWidth = 5; x.strokeStyle = ink; x.stroke(); return; }
    if (eyes === 'heart') { heart(x, ex, eyeY + 8, 24); x.fillStyle = '#FF2D6F'; x.fill(); x.lineWidth = 5; x.strokeStyle = ink; x.stroke(); return; }
    if (eyes === 'x') { x.lineWidth = 8; x.strokeStyle = ink; x.beginPath(); x.moveTo(ex - 14, eyeY - 14); x.lineTo(ex + 14, eyeY + 14); x.moveTo(ex + 14, eyeY - 14); x.lineTo(ex - 14, eyeY + 14); x.stroke(); return; }
    const eh = 50 * (1 - closed), ew = 38;
    roundRect(x, ex - ew / 2, eyeY - eh / 2, ew, Math.max(eh, 4), 14); x.fillStyle = '#fff'; x.fill(); x.lineWidth = 6; x.strokeStyle = ink; x.stroke();
    if (eh > 14) {
      const px = ex + clamp(look[0], -1, 1) * 7, py = eyeY + clamp(look[1], -1, 1) * 9, ph = Math.min(28, eh - 12);
      roundRect(x, px - 8, py - ph / 2, 16, ph, 4); x.fillStyle = ink; x.fill();
      x.beginPath(); x.arc(px - 2, py - ph / 2 + 6, 3.5, 0, TAU); x.fillStyle = '#fff'; x.fill();
    }
  };
  if (eyes === 'shades') {
    x.fillStyle = ink; roundRect(x, -76, eyeY - 22, 66, 40, 12); x.fill(); roundRect(x, 10, eyeY - 22, 66, 40, 12); x.fill(); x.fillRect(-12, eyeY - 14, 24, 7);
    x.fillStyle = 'rgba(255,255,255,0.55)'; x.fillRect(-64, eyeY - 14, 18, 6); x.fillRect(22, eyeY - 14, 18, 6);
  } else if (eyes === 'wink') { eye(-eyeX, 0); x.beginPath(); x.arc(eyeX, eyeY + 10, 18, Math.PI * 1.1, Math.PI * 1.9); x.lineWidth = 8; x.strokeStyle = ink; x.lineCap = 'round'; x.stroke(); }
  else { eye(-eyeX, bl); eye(eyeX, bl); }
  x.fillStyle = 'rgba(255,60,110,0.42)'; x.beginPath(); x.ellipse(-62, 2, 16, 10, 0, 0, TAU); x.ellipse(62, 2, 16, 10, 0, 0, TAU); x.fill();
  if (mouth === 'auto') mouth = A.mouth(t);
  const my = 18; x.lineCap = 'round'; x.lineJoin = 'round';
  if (typeof mouth === 'object') {
    const open = clamp(mouth.open * 1.25), wd = clamp(mouth.wide), rd = clamp(mouth.round), ss = clamp(mouth.sss);
    const mw = 26 + wd * 30 - rd * 10 + open * 8, mh = 6 + open * 44 * (1 - ss * 0.6);
    if (mh < 9 && ss < 0.3) { x.beginPath(); x.arc(0, my - 14, 22, Math.PI * 0.2, Math.PI * 0.8); x.lineWidth = 7; x.strokeStyle = ink; x.stroke(); }
    else {
      x.beginPath();
      if (rd > 0.55 && wd < 0.4) x.ellipse(0, my, mw * 0.55, mh * 0.6 + 6, 0, 0, TAU);
      else { x.moveTo(-mw, my - mh * 0.25); x.quadraticCurveTo(0, my - mh * 0.45, mw, my - mh * 0.25); x.quadraticCurveTo(mw * 0.9, my + mh, 0, my + mh); x.quadraticCurveTo(-mw * 0.9, my + mh, -mw, my - mh * 0.25); }
      x.closePath(); x.fillStyle = MASCOT.mouthIn; x.fill();
      x.save(); x.clip();
      if (ss > 0.3 || open > 0.25) { x.fillStyle = '#fff'; x.fillRect(-mw, my - mh * 0.45 - 2, mw * 2, 9); }
      if (open > 0.3) { x.fillStyle = MASCOT.tongue; x.beginPath(); x.ellipse(0, my + mh * 0.85, mw * 0.55, mh * 0.35, 0, 0, TAU); x.fill(); }
      x.restore(); x.lineWidth = 6; x.strokeStyle = ink; x.stroke();
    }
  } else {
    x.lineWidth = 7; x.strokeStyle = ink;
    if (mouth === 'smile') { x.beginPath(); x.arc(0, my - 14, 24, Math.PI * 0.18, Math.PI * 0.82); x.stroke(); }
    else if (mouth === 'o') { x.beginPath(); x.ellipse(0, my + 6, 13, 17, 0, 0, TAU); x.fillStyle = MASCOT.mouthIn; x.fill(); x.stroke(); }
    else {
      const hgt = mouth === 'open' ? 46 : 26;
      x.beginPath(); x.moveTo(-36, my - 8); x.quadraticCurveTo(0, my - 2, 36, my - 8); x.quadraticCurveTo(30, my + hgt, 0, my + hgt); x.quadraticCurveTo(-30, my + hgt, -36, my - 8); x.closePath();
      x.fillStyle = MASCOT.mouthIn; x.fill(); x.save(); x.clip(); x.fillStyle = '#fff'; x.fillRect(-40, my - 10, 80, 10);
      x.fillStyle = MASCOT.tongue; x.beginPath(); x.ellipse(0, my + hgt, 20, 12, 0, 0, TAU); x.fill(); x.restore(); x.stroke();
    }
  }
  if (o.glyph !== false) {
    x.fillStyle = 'rgba(31,42,85,0.85)'; x.font = '800 40px "JetBrains Mono"'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(Math.floor(t * 2) % 2 === 0 ? '>_' : '> ', 0, 78);
  }
  x.restore();
}

// ---------------------------------------------------------------- 3D CURSOR
const _v = new THREE.Vector3(), _u = new THREE.Vector3(0, 1, 0), _q = new THREE.Quaternion();
function outlineOf(mesh, mat, k = 1.06) {
  const o = new THREE.Mesh(mesh.geometry, mat); o.scale.setScalar(k); o.castShadow = false; mesh.add(o); return o;
}
/**
 * Chunky 3D CURSOR. 1 unit = 100 body units (body 1.7×2.3×depth). Origin = ground point between the feet.
 * m.update({t, pose|P, squash, rot, lean, eyes, mouth, look, armZ, legZ}) poses it (no allocations).
 */
export function makeMascot3D(key, { depth = 0.95, outline = true, face = true } = {}) {
  const g = new THREE.Group(); g.name = 'cursor3d-' + key;
  const ink = new THREE.MeshStandardMaterial({ color: MASCOT.ink, roughness: 0.55, metalness: 0.0 });
  const inkBack = new THREE.MeshBasicMaterial({ color: MASCOT.ink, side: THREE.BackSide });
  const bodyMat = new THREE.MeshPhysicalMaterial({ color: '#FF6A1F', roughness: 0.32, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.18, envMap: envMap(), envMapIntensity: 0.55 });
  const white = new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.4, envMap: envMap(), envMapIntensity: 0.3 });
  const bob = new THREE.Group(); g.add(bob); // bob
  const rot = new THREE.Group(); rot.position.y = 1.85; bob.add(rot); // rotation about the body centre (as in 2D)
  const rig = new THREE.Group(); rig.position.y = -1.85; rot.add(rig);
  const bodyPivot = new THREE.Group(); bodyPivot.position.y = 1.85 - 1.15; rig.add(bodyPivot); // bottom of body (squash anchor)
  const bodyGeo = new RoundedBoxGeometry(1.7, 2.3, depth, 5, 0.3);
  const body = new THREE.Mesh(bodyGeo, bodyMat); body.position.y = 1.15; body.castShadow = true; body.receiveShadow = true; bodyPivot.add(body);
  if (outline) outlineOf(body, inkBack, 1.045);
  let faceCanvas = null, faceTex = null, facePlane = null;
  if (face) {
    faceCanvas = document.createElement('canvas'); faceCanvas.width = 340; faceCanvas.height = 460;
    faceTex = new THREE.CanvasTexture(faceCanvas); faceTex.colorSpace = THREE.SRGBColorSpace; faceTex.anisotropy = 4;
    const fm = new THREE.MeshStandardMaterial({ map: faceTex, transparent: true, roughness: 0.35, polygonOffset: true, polygonOffsetFactor: -2, depthWrite: false });
    facePlane = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 2.3), fm); facePlane.position.z = depth / 2 + 0.004; body.add(facePlane);
  }
  // limbs: 2 capsule segments per limb (rubber-hose bend), gloves, shoes
  const capGeo = new THREE.CapsuleGeometry(0.075, 1, 4, 10);
  const mk = (geo, mat, sh = true) => { const m = new THREE.Mesh(geo, mat); m.castShadow = sh; rig.add(m); return m; };
  const limbs = {};
  for (const n of ['armL', 'armR', 'legL', 'legR']) limbs[n] = [mk(capGeo, ink), mk(capGeo, ink)];
  const sphere = new THREE.SphereGeometry(0.23, 24, 16);
  const gloves = { armL: mk(sphere, white), armR: mk(sphere, white) };
  if (outline) { outlineOf(gloves.armL, inkBack, 1.18); outlineOf(gloves.armR, inkBack, 1.18); }
  const shoeGeo = new THREE.SphereGeometry(0.3, 20, 12);
  const shoes = { legL: mk(shoeGeo, ink), legR: mk(shoeGeo, ink) };
  shoes.legL.scale.set(1.15, 0.6, 1.0); shoes.legR.scale.set(1.15, 0.6, 1.0);
  const seg = (m, a, b) => { _v.subVectors(b, a); const L = _v.length(); m.position.copy(a).addScaledVector(_v, 0.5); m.scale.set(1, Math.max(0.0001, (L + 0.1) / 1.15), 1); if (L > 1e-6) { _q.setFromUnitVectors(_u, _v.multiplyScalar(1 / L)); m.quaternion.copy(_q); } };
  const A0 = new THREE.Vector3(), B0 = new THREE.Vector3(), M0 = new THREE.Vector3(), tmp = new THREE.Vector3();
  const toV = (out, x, y, z = 0) => out.set(x / 100, (185 - y) / 100, z);
  const limb = (pair, ax, ay, bx, by, bend, za, zb) => {
    toV(A0, ax, ay, za); toV(B0, bx, by, zb);
    const dx = B0.x - A0.x, dy = B0.y - A0.y, L = Math.hypot(dx, dy) || 1;
    M0.set((A0.x + B0.x) / 2 - (dy / L) * bend, (A0.y + B0.y) / 2 + (dx / L) * bend, (za + zb) / 2 + 0.05);
    seg(pair[0], A0, M0); seg(pair[1], M0, B0);
  };
  const m = {
    group: g, rig, bob, rot, body, bodyPivot, faceCanvas, faceTex, mats: { body: bodyMat, ink, white, inkBack }, gloves, shoes,
    P: null,
    update(o = {}) {
      const t = o.t ?? 0;
      const P = o.P || pose(o.pose || 'idle', t);
      m.P = P;
      const sq = (o.squash ?? 0) + P.squash, sx = 1 + sq * 0.55, sy = 1 - sq * 0.55;
      bob.position.y = -P.bob / 100 * (o.bobK ?? 1);
      rot.rotation.z = -((o.rot ?? 0) + P.rot);
      bodyPivot.scale.set(sx, sy, 1 + sq * 0.3);
      bodyPivot.rotation.z = -(P.lean + (o.lean ?? 0)) * 0.6;
      const az = o.armZ ?? 0.25, lz = o.legZ ?? 0;
      const shY = 115 - 107 * sy, hipY = 107;
      limb(limbs.armL, -79 * sx, shY, P.armL[0], P.armL[1], -0.16, 0.05, az);
      limb(limbs.armR, 79 * sx, shY, P.armR[0], P.armR[1], 0.16, 0.05, az);
      limb(limbs.legL, -40, hipY, P.legL[0], P.legL[1] - 10, 0.1, 0, lz);
      limb(limbs.legR, 40, hipY, P.legR[0], P.legR[1] - 10, -0.1, 0, lz);
      toV(gloves.armL.position, P.armL[0], P.armL[1], az); toV(gloves.armR.position, P.armR[0], P.armR[1], az);
      toV(shoes.legL.position, P.legL[0] - 10, P.legL[1] - 8, lz + 0.08); toV(shoes.legR.position, P.legR[0] + 10, P.legR[1] - 8, lz + 0.08);
      if (faceCanvas && o.face !== false) { drawFace(bctx2(faceCanvas), { k: 2, t, eyes: o.eyes, mouth: o.mouth, look: o.look || P.look, blink: o.blink ?? 'auto' }); faceTex.needsUpdate = true; }
      return m;
    },
  };
  return m;
}
const bctx2 = (c) => c._c2 || (c._c2 = c.getContext('2d'));

// ---------------------------------------------------------------- 2D display type
/** chrome / neon display type, centred at x,y. opts: {size, family, fill:'chrome'|'neon'|css, stroke, shadow, skew, track} */
export function chromeText(ctx, str, x, y, o = {}) {
  const size = o.size || 200, fam = o.family || 'Anton', wt = o.weight || '400';
  font(ctx, size, fam, wt);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (o.maxW) { const m = ctx.measureText(str).width; if (m > o.maxW) { font(ctx, size * o.maxW / m, fam, wt); } }
  const fs = parseFloat(ctx.font.match(/(\d+(\.\d+)?)px/)[1]);
  ctx.save(); ctx.translate(x, y); if (o.skew) ctx.transform(1, 0, o.skew, 1, 0, 0); if (o.scale) ctx.scale(o.scale[0], o.scale[1]);
  if (o.track) ctx.letterSpacing = o.track + 'px';
  const sh = o.shadow ?? fs * 0.06;
  const strokeW = o.strokeW ?? fs * 0.06;
  if (sh) { ctx.fillStyle = o.shadowCol || K.deep; for (let i = Math.ceil(sh); i > 0; i -= Math.max(1, sh / 8)) ctx.fillText(str, i, i); }
  if (strokeW) { ctx.lineJoin = 'round'; ctx.lineWidth = strokeW; ctx.strokeStyle = o.stroke || K.deep; ctx.strokeText(str, 0, 0); }
  let fill = o.fill || 'chrome';
  if (fill === 'chrome') {
    const g = ctx.createLinearGradient(0, -fs * 0.5, 0, fs * 0.5);
    g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.38, '#DDE3EE'); g.addColorStop(0.5, '#8C7BD6'); g.addColorStop(0.53, '#3A2C8A'); g.addColorStop(0.62, '#B79CFF'); g.addColorStop(0.85, '#3EF0FF'); g.addColorStop(1, '#E9FFFB');
    fill = g;
  } else if (fill === 'neon') {
    const g = ctx.createLinearGradient(-fs, 0, fs, 0); g.addColorStop(0, K.cyan); g.addColorStop(0.5, K.mint); g.addColorStop(1, K.lilac); fill = g;
  }
  ctx.fillStyle = fill; ctx.fillText(str, 0, 0);
  ctx.restore();
  return fs;
}

/** soft diagonal gradient background + drifting dot grid */
export function neonBG(ctx, t, { a = K.lilac, b = K.cyan, c = '#F3EEFF', dots = true, dotCol = 'rgba(26,18,64,0.10)', pulse = 0 } = {}) {
  const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, a); g.addColorStop(0.55, c); g.addColorStop(1, b);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  if (dots) {
    ctx.fillStyle = dotCol; const st = 48, o = (t * 30) % st;
    ctx.beginPath();
    for (let y = -st; y < H + st; y += st) for (let x = -st; x < W + st; x += st) { const r = 2.2 + pulse * 2.5; ctx.moveTo(x + o + r, y + o * 0.5); ctx.arc(x + o, y + o * 0.5, r, 0, TAU); }
    ctx.fill();
  }
}

// ---------------------------------------------------------------- neon studio environment (chrome reflects lilac/cyan/mint)
let NENV = null;
export function neonEnv() {
  if (NENV) return NENV;
  const sc = new THREE.Scene();
  const c = document.createElement('canvas'); c.width = 8; c.height = 256; const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, '#8E6BFF'); g.addColorStop(0.45, '#F4F0FF'); g.addColorStop(0.55, '#2A1A70'); g.addColorStop(1, '#3EF0FF');
  x.fillStyle = g; x.fillRect(0, 0, 8, 256);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  sc.add(new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide })));
  const panel = (col, k, pos, sz) => { const m = new THREE.Mesh(new THREE.BoxGeometry(...sz), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(k) })); m.position.set(...pos); m.lookAt(0, 0, 0); sc.add(m); };
  panel('#FFFFFF', 4, [0, 30, 10], [30, 6, 1]);
  panel('#3EF0FF', 3, [-30, 8, 10], [4, 30, 1]);
  panel('#7CFFC4', 3, [30, 6, -6], [4, 26, 1]);
  panel('#FF9AE0', 2.5, [8, 4, -32], [24, 4, 1]);
  panel('#B79CFF', 3, [-10, 18, -28], [16, 10, 1]);
  const pm = new THREE.PMREMGenerator(renderer());
  NENV = pm.fromScene(sc, 0.03).texture;
  return NENV;
}

/** pre-compile every material (incl. hidden objects, shadow + clipping variants) so the first drawn frame is cheap */
export async function warm3d(scene, cam, { clip = false } = {}) {
  const r = renderer();
  const hidden = []; scene.traverse((o) => { if (!o.visible) { hidden.push(o); o.visible = true; } });
  r.localClippingEnabled = clip;
  try { await r.compileAsync(scene, cam); } catch (e) { /* fall back to the warm render */ }
  r.setRenderTarget(null); r.setClearColor(0x000000, 0); r.clear(); r.render(scene, cam);
  r.localClippingEnabled = false;
  hidden.forEach((o) => { o.visible = false; });
}

export const rgbArr = (h) => hex2rgb(h).map((v) => v / 255);
export { THREE };
