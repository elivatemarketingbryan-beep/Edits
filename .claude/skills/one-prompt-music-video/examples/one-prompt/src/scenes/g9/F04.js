// F04 — "The skill is free, and that's the whole deal" · HALFTONE SHOCKWAVE
// The whole frame is a two-screen RISO print rendered live in a fragment shader: two rotated halftone screens
// (15° / 75°) overprint (multiply) a sunburst + a dancing CURSOR, and every stamp impact sends a travelling
// shockwave through the dot field (dots displaced + swollen by the wavefront). A real 3D rubber stamp (lathe
// handle, lacquer, mirrored extruded rubber letters) stamps THE · SKILL · FREE, then rises at the camera,
// flashes its DEAL rubber face and crashes down full-frame.
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, seg, rng, hash, noise2, buf, bctx, rays, roundRect, hex2rgb } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { G } from '../../core/gl.js';
import { drawMascot } from '../../core/mascot.js';
import { THREE, render3d, renderer, envMap, textGeo, RoundedBoxGeometry } from '../../core/three.js';
import { bigType } from './common.js';

const S = shot('F04');
const HITS = [
  { t: 132.36, x: 380, y: 310, rot: -0.12, word: 'THE', sc: 1.3, col: '#1F2A55', amp: 0.35 },
  { t: 133.18, x: 520, y: 680, rot: -0.07, word: 'SKILL', sc: 1.75, col: '#2B2BFF', amp: 0.5 },
  { t: 133.70, x: 1450, y: 300, rot: 0.1, word: 'FREE', sc: 1.75, col: '#FF3E8A', amp: 0.6 },
  { t: 134.92, x: 960, y: 600, rot: -0.07, word: 'DEAL', sc: 4.0, col: '#E8343F', amp: 1.0 },
];
// riso paper + two inks, swapped on every beat
const RISO = [
  { paper: '#FFF4E0', a: '#FF3E8A', b: '#2B2BFF' },
  { paper: '#FFE14D', a: '#FF6A1F', b: '#7B2FF7' },
  { paper: '#E3FFF3', a: '#3EF0FF', b: '#FF3E8A' },
  { paper: '#FFF4D6', a: '#FFC300', b: '#111111' },
  { paper: '#F1EAFF', a: '#B79CFF', b: '#1A1240' },
  { paper: '#FFFFFF', a: '#FF2A2A', b: '#2B2BFF' },
];
let B0 = null;
const riso = (t) => { if (B0 === null) B0 = A.beat(S.start + 0.01).i; const k = A.beat(t).i - B0; return RISO[((k % RISO.length) + RISO.length) % RISO.length]; };

const FRAG = `
uniform sampler2D uTex; uniform vec3 uPaper, uInkA, uInkB; uniform float uCell, uT;
uniform vec4 uW0, uW1, uW2, uW3;
vec2 rot(vec2 p, float a){ float c = cos(a), s = sin(a); return vec2(c*p.x - s*p.y, s*p.x + c*p.y); }
float wave(vec4 w, vec2 px, inout vec2 disp){
  float age = uT - w.z; if (age < 0. || w.w <= 0.) return 0.;
  vec2 d = px - w.xy; float r = length(d); vec2 dir = d / max(r, 1.);
  float x = r - age * (1500. + 2600. * w.w * w.w);
  float env = exp(-x * x / (2. * 70. * 70.)) * w.w * exp(-age * 1.1);
  float trail = (x < 0.) ? 0.55 * w.w * exp(-age * 1.6) * sin(x * 0.045) * exp(x / 380.) : 0.;
  disp += dir * (env * 70. + trail * 30.);
  return env + trail * 0.6;
}
float screen(vec2 px, float ang, float cell, float ch, float boost){
  vec2 g = rot(px, ang) / cell; vec2 c = floor(g) + 0.5; vec2 f = g - c;
  vec2 cpx = rot(c * cell, -ang);
  vec4 tx = texture(uTex, vec2(cpx.x / uRes.x, 1.0 - cpx.y / uRes.y));
  float v = mix(tx.r, tx.g, ch);
  float rad = sqrt(clamp(v + boost, 0., 1.)) * 0.64;
  float d = length(f), aa = 1.1 / cell;
  return smoothstep(rad + aa, rad - aa, d);
}
void main(){
  vec2 px = vec2(uv.x, 1.0 - uv.y) * uRes;
  vec2 disp = vec2(0.); float ring = 0.;
  ring += wave(uW0, px, disp); ring += wave(uW1, px, disp); ring += wave(uW2, px, disp); ring += wave(uW3, px, disp);
  vec2 q = px - disp;
  float a = screen(q, 0.2618, uCell, 0., ring * 0.75);
  float b = screen(q, 1.309, uCell * 1.05, 1., ring * 0.22);
  vec3 col = uPaper;
  col = mix(col, col * uInkA, a * 0.96);
  col = mix(col, col * uInkB, b * 0.96);
  o = vec4(col, 1.);
}`;

// ---------------------------------------------------------------- 3D stamp
let R3 = null;
const CAM_H = 30, FOV = 55;
function build() {
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(FOV, W / H, 0.5, 400);
  cam.position.set(0, CAM_H, 0); cam.up.set(0, 0, -1); cam.lookAt(0, 0, 0); cam.updateMatrixWorld();
  const env = envMap();
  const stamp = new THREE.Group();
  const handleMat = new THREE.MeshPhysicalMaterial({ color: '#E8343F', roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.06, envMap: env, envMapIntensity: 1.1 });
  const grip = new THREE.Mesh(new RoundedBoxGeometry(4.8, 3.6, 2.3, 4, 0.55), handleMat); grip.position.y = 1.45 + 1.8; stamp.add(grip);
  const band = new THREE.Mesh(new RoundedBoxGeometry(5.2, 0.5, 2.7, 2, 0.2), new THREE.MeshPhysicalMaterial({ color: '#FFC300', metalness: 1, roughness: 0.18, envMap: env })); band.position.y = 1.7; stamp.add(band);
  const blockMat = new THREE.MeshPhysicalMaterial({ color: '#1F2A55', roughness: 0.3, clearcoat: 0.8, envMap: env, envMapIntensity: 0.9 });
  const block = new THREE.Mesh(new RoundedBoxGeometry(7.4, 1.2, 3.6, 3, 0.22), blockMat); block.position.y = 0.85; stamp.add(block);
  // label on top of the block
  const lc = buf('F04-label', 512, 256), lx = bctx(lc);
  const ltex = new THREE.CanvasTexture(lc); ltex.colorSpace = THREE.SRGBColorSpace; ltex.anisotropy = 8;
  const label = new THREE.Mesh(new THREE.PlaneGeometry(3.9, 1.75), new THREE.MeshStandardMaterial({ map: ltex, roughness: 0.5, envMap: env, envMapIntensity: 0.4 }));
  label.rotation.x = -Math.PI / 2; label.position.y = 1.45 + 3.6 + 0.01; stamp.add(label);
  const rubber = new THREE.Mesh(new THREE.BoxGeometry(7.1, 0.26, 3.3), new THREE.MeshStandardMaterial({ color: '#5a0d18', roughness: 0.85 })); rubber.position.y = 0.13; stamp.add(rubber);
  // mirrored raised rubber letters on the underside, one per word
  const letters = {};
  for (const h of HITS) {
    const g = textGeo(h.word, { font: 'Anton', size: 2.2, depth: 0.28, bevel: 0.02 });
    g.computeBoundingBox(); const bw = g.boundingBox.max.x - g.boundingBox.min.x, bh = g.boundingBox.max.y - g.boundingBox.min.y;
    const k = Math.min(6.2 / bw, 2.7 / bh);
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: '#7A1020', roughness: 0.7 }));
    // text lies in XY; lay it flat facing down (-Y), mirrored so the PRINT reads correctly
    m.scale.set(k, k, 1); m.rotation.x = -Math.PI / 2; m.position.y = -0.1;
    stamp.add(m); letters[h.word] = m;
  }
  scene.add(stamp);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x99889a, 1.6));
  const key = new THREE.DirectionalLight(0xffffff, 2.4); key.position.set(-20, 40, -18); scene.add(key);
  R3 = { scene, cam, stamp, letters, lc, lx, ltex, labelWord: '', v: new THREE.Vector3() };
}
function paintLabel(word) {
  if (R3.labelWord === word) return;
  const x = R3.lx; x.fillStyle = '#FFF4E0'; x.fillRect(0, 0, 512, 256);
  x.strokeStyle = '#1F2A55'; x.lineWidth = 10; x.strokeRect(14, 14, 484, 228);
  bigType(x, word, 256, 134, { size: 170, fill: '#E8343F', maxW: 430 });
  R3.labelWord = word; R3.ltex.needsUpdate = true;
}
/** screen px → world point on the paper plane (y = 0) */
function toWorld(px, py) {
  const v = R3.v.set(px / W * 2 - 1, -(py / H * 2 - 1), 0.5).unproject(R3.cam);
  const o = R3.cam.position, dx = v.x - o.x, dy = v.y - o.y, dz = v.z - o.z, k = -o.y / dy;
  return [o.x + dx * k, o.z + dz * k];
}
function toScreen(x, y, z) { const v = R3.v.set(x, y, z).project(R3.cam); return [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H]; }

// stamp choreography: {x,y (screen px of contact point), h (height), sc, rx (tilt), rot, word}
function stampAt(t) {
  const hs = HITS;
  if (t < hs[0].t) { const u = seg(t, S.start - 0.1, hs[0].t); return { x: hs[0].x, y: hs[0].y, h: 6 * (1 - ease.inQuad(u)), sc: hs[0].sc, rx: 0, rot: hs[0].rot, word: hs[0].word }; }
  for (let i = 0; i < hs.length - 1; i++) {
    const a = hs[i], b = hs[i + 1];
    if (t >= b.t) continue;
    const lt = t - a.t;
    const isDeal = i === hs.length - 2;
    const up = isDeal ? 9 : 7.5;
    let h = up * ease.outCubic(seg(lt, 0.05, 0.24));
    const mv = ease.inOutCubic(seg(t, a.t + 0.1, isDeal ? 134.55 : b.t - 0.08));
    let sc = lerp(a.sc, isDeal ? 1.3 : b.sc, mv), rx = 0;
    const word = lt > 0.12 ? b.word : a.word;
    if (isDeal) {
      // rise at the camera showing the rubber face, then the crash
      const r = ease.inOutCubic(seg(t, 134.08, 134.6));
      h = lerp(h, 4.5, r); sc = lerp(sc, b.sc, ease.inOutQuad(seg(t, 134.45, 134.86)));
      rx = -2.9 * Math.sin(Math.PI * seg(t, 134.08, 134.66)) ** 1.1;
      const dn = ease.inExpo(seg(t, 134.82, b.t));
      h = lerp(h, 0, dn);
    } else {
      h = lerp(h, 0, ease.inQuad(seg(t, b.t - 0.12, b.t)));
    }
    return { x: lerp(a.x, b.x, mv), y: lerp(a.y, b.y, mv), h, sc, rx, rot: lerp(a.rot, b.rot, mv), word };
  }
  const z = hs[hs.length - 1], lt = t - z.t;
  const up = ease.inQuad(seg(lt, 0.045, 0.17));
  return { x: z.x + up * 300, y: z.y - up * 1500, h: up * 9, sc: z.sc, rx: up * 0.5, rot: z.rot - up * 0.3, word: z.word, gone: lt > 0.17 };
}

// ---------------------------------------------------------------- 2D pieces
const imprints = {};
function imprint(h) {
  if (imprints[h.word]) return imprints[h.word];
  const size = 210;
  const m = bctx(buf('read-F04-m', 10, 10)); m.font = `400 ${size}px "Anton"`; m.letterSpacing = '6px';
  m.letterSpacing = '0px';
  const w = 645, hh = 300;
  const c = buf('F04-imp-' + h.word, w, hh), x = bctx(c);
  x.clearRect(0, 0, w, hh); x.fillStyle = h.col; x.strokeStyle = h.col;
  x.lineWidth = 16; roundRect(x, 14, 14, w - 28, hh - 28, 30); x.stroke();
  x.lineWidth = 5; roundRect(x, 36, 36, w - 72, hh - 72, 18); x.stroke();
  bigType(x, h.word, w / 2, hh / 2 + 8, { size, fill: h.col, track: 6, maxW: w - 130 });
  // grunge: knock out speckles + streaks
  x.globalCompositeOperation = 'destination-out'; const r = rng(h.word.length * 31 + 7);
  for (let i = 0; i < 900; i++) { x.globalAlpha = 0.3 + r() * 0.7; x.beginPath(); x.arc(r() * w, r() * hh, 0.6 + r() ** 3 * 7, 0, TAU); x.fill(); }
  x.globalAlpha = 0.18; for (let i = 0; i < 26; i++) { const y = r() * hh; x.fillRect(0, y, w, 1 + r() * 4); }
  x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
  imprints[h.word] = c; return c;
}
function splats(ctx, h, k) {
  const r = rng(h.word.length * 13 + 3); ctx.fillStyle = h.col;
  for (let i = 0; i < 26; i++) { const a = r() * TAU, d = (150 + r() * 260) * h.sc * 0.9, rr = (2 + r() ** 2 * 12) * h.sc * 0.7; ctx.globalAlpha = k; ctx.beginPath(); ctx.arc(h.x + Math.cos(a) * d * 1.4, h.y + Math.sin(a) * d * 0.7, rr, 0, TAU); ctx.fill(); }
  ctx.globalAlpha = 1;
}
function confetti(ctx, t, h, cols) {
  const lt = t - h.t; if (lt < 0 || lt > 1.6) return;
  const r = rng(77);
  for (let i = 0; i < 190; i++) {
    const a = r() * TAU, v = 500 + r() * 1700, drag = 3.0, g = 700;
    const f = (1 - Math.exp(-drag * lt)) / drag;
    const x = h.x + Math.cos(a) * v * f, y = h.y + Math.sin(a) * v * f + g * (lt * lt) * 0.5 * 0.9;
    const spin = lt * (6 + r() * 14) + r() * TAU, w = 10 + r() * 16, hh = 6 + r() * 8;
    ctx.save(); ctx.translate(x, y); ctx.rotate(spin * 0.4 + a); ctx.scale(1, Math.cos(spin));
    ctx.fillStyle = cols[i % cols.length]; ctx.fillRect(-w / 2, -hh / 2, w, hh);
    if (i % 9 === 0) { ctx.fillStyle = '#FFFFFF'; roundRect(ctx, -34, -14, 68, 28, 6); ctx.fill(); bigType(ctx, 'FREE', 0, 1, { size: 20, family: 'Rubik Mono One', fill: '#FF3E8A' }); }
    ctx.restore();
  }
}

export default {
  ...S,
  cutIn: 'punch',
  sfx: [{ t: 132.36, type: 'stamp', gain: 0.6 }, { t: 133.18, type: 'stamp', gain: 0.8 }, { t: 133.70, type: 'stamp', gain: 0.8 }, { t: 133.72, type: 'pop' }, { t: 134.92, type: 'boom', gain: 1 }],
  init() { build(); G.program('F04-riso', FRAG); for (const h of HITS) imprint(h); paintLabel('THE'); renderer().compile(R3.scene, R3.cam); },
  draw(ctx, t, s, E) {
    if (!R3) build();
    const P = riso(t);
    // ---- content for the two halftone screens (R = ink A, G = ink B)
    const cc = buf('F04-content', 960, 540), cx = bctx(cc);
    cx.save(); cx.setTransform(0.5, 0, 0, 0.5, 0, 0);
    cx.fillStyle = '#000'; cx.fillRect(0, 0, W, H);
    cx.globalCompositeOperation = 'lighter';
    const sh = HITS.reduce((m, h) => (t >= h.t ? h : m), HITS[0]);
    rays(cx, sh.x, sh.y, 24, 2600, t * 0.35, 'rgb(70,0,0)', 'rgb(0,0,0)');
    const vg = cx.createRadialGradient(W / 2, H / 2, 300, W / 2, H / 2, 1200); vg.addColorStop(0, 'rgb(0,0,0)'); vg.addColorStop(1, 'rgb(0,90,0)');
    cx.fillStyle = vg; cx.fillRect(0, 0, W, H);
    cx.globalCompositeOperation = 'source-over';
    const push = ease.outExpo(seg(t, 134.95, 135.3));
    drawMascot(cx, { x: 1380 + push * 260, y: 1150 + push * 40, s: 2.65 - push * 0.4, t, pose: t > 134.92 ? 'cheer' : 'dance', eyes: 'happy', mouth: 'auto', glyph: false,
      colors: { body: '#D80000', ink: '#00FF00', white: '#000000', mouthIn: '#30d000', tongue: '#ff0000' } });
    if (t >= HITS[3].t) { // the crash clears the dots under the stamp
      const D = HITS[3], k = 7.1 * D.sc * (H / (2 * CAM_H * Math.tan(FOV * Math.PI / 360)));
      cx.save(); cx.translate(D.x, D.y); cx.rotate(D.rot); cx.fillStyle = '#000'; const g2 = ease.outExpo(seg(t, D.t, D.t + 0.2));
      roundRect(cx, -k * 0.56 * g2, -k * 0.27 * g2, k * 1.12 * g2, k * 0.54 * g2, 40); cx.fill(); cx.restore();
    }
    cx.restore();
    const tex = G.canvasTex('F04-content', cc);
    const wv = HITS.map((h) => [h.x, h.y, h.t, t >= h.t ? h.amp : 0]);
    const cell = 15 + 3 * A.pulse('beat', t, 0.1);
    const pc = (hx) => hex2rgb(hx).map((v) => v / 255);
    const r = G.shader('F04-riso', FRAG, { uTex: tex, uPaper: pc(P.paper), uInkA: pc(P.a), uInkB: pc(P.b), uCell: cell, uT: t, uW0: wv[0], uW1: wv[1], uW2: wv[2], uW3: wv[3] });
    G.draw(ctx, r);

    // ---- imprints already stamped
    const D = HITS[3];
    for (const h of HITS) {
      if (t < h.t) continue;
      const lt = t - h.t, c = imprint(h), k = 7.1 * h.sc * (H / (2 * CAM_H * Math.tan(FOV * Math.PI / 360))) / c.width;
      let bx = 0, by = 0, br = 0;
      if (h !== D && t >= D.t) { // the DEAL shockwave blows the earlier stamps off the page
        const dx = h.x - D.x, dy = h.y - D.y, L = Math.hypot(dx, dy) || 1, u = ease.inQuad(seg(t, D.t + L / 4100, D.t + L / 4100 + 0.14));
        bx = dx / L * 2400 * u; by = dy / L * 2400 * u; br = u * 2.5 * (dx > 0 ? 1 : -1);
      }
      ctx.save(); ctx.translate(h.x + bx, h.y + by); ctx.rotate(h.rot + br);
      const sp = 1 + 0.06 * Math.exp(-lt / 0.05);
      ctx.scale(k * sp, k * sp); ctx.globalAlpha = 0.93;
      ctx.drawImage(c, -c.width / 2, -c.height / 2);
      ctx.restore();
      if (h === D || t < D.t) splats(ctx, h, clamp(lt / 0.04) * 0.9);
    }
    // ---- "THE WHOLE" headline
    if (t >= 134.58) {
      const u = ease.outBack(seg(t, 134.58, 134.76), 2);
      ctx.save(); ctx.translate(W / 2, 175); ctx.scale(u, u);
      bigType(ctx, t >= 134.7 ? 'THE WHOLE' : 'THE', 0, 0, { size: 150, family: 'Rubik Mono One', fill: '#FFFFFF', stroke: '#1F2A55', sw: 18, shadow: '#1F2A55', sx: 8, sy: 10 });
      ctx.restore();
    }

    // ---- stamp: soft shadow on the paper, then the 3D stamp
    confetti(ctx, t, HITS[2], [P.a, P.b, '#FFE14D', '#7CFFC4', '#FFFFFF', '#FF6A1F']);
    const st = stampAt(t);
    if (!st.gone) {
      const [wx, wz] = toWorld(st.x, st.y);
      const hw = st.h;
      const shOff = 12 + hw * 26, blur = 0.3 + hw * 0.05;
      const sw = 7.4 * st.sc * (1 + hw * 0.02) * (W / (2 * CAM_H * Math.tan(FOV * Math.PI / 360) * W / H));
      ctx.save(); ctx.translate(st.x + shOff * 0.6, st.y + shOff); ctx.rotate(st.rot);
      ctx.globalAlpha = clamp(0.55 - hw * 0.025, 0.12, 0.55);
      ctx.filter = `blur(${Math.round(6 + blur * 40)}px)`;
      ctx.fillStyle = '#1a1030'; roundRect(ctx, -sw / 2, -sw * 0.24, sw, sw * 0.48, 30); ctx.fill();
      ctx.filter = 'none'; ctx.restore();
      R3.stamp.position.set(wx, hw, wz);
      R3.stamp.rotation.set(0, -st.rot, st.rx, 'YXZ');
      const contact = Math.max(...HITS.map((h) => (t >= h.t ? Math.exp(-(t - h.t) / 0.05) : 0)));
      R3.stamp.scale.set(st.sc * (1 + contact * 0.06), st.sc * (1 - contact * 0.14), st.sc * (1 + contact * 0.06));
      for (const w in R3.letters) R3.letters[w].visible = w === st.word;
      paintLabel(st.word);
      render3d(ctx, R3.scene, R3.cam);
    }

    // ---- hits
    for (const h of HITS) {
      const d = t - h.t; if (d < 0 || d > 0.4) continue;
      const k = 1 - d / 0.4;
      E.fx.shake = Math.max(E.fx.shake, (h.word === 'DEAL' ? 30 : 10) * k * k);
      E.fx.zoom += (h.word === 'DEAL' ? 0.07 : 0.025) * k * k; E.fx.rgb += (h.word === 'DEAL' ? 12 : 4) * k;
      if (h.word === 'DEAL') { E.fx.flash = [1, 1, 1, 0.35 * k ** 3]; }
    }
    E.fx.vignette = 0.2; E.fx.grain = 0.06;
  },
};
