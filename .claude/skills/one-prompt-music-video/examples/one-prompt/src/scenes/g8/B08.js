// B08 — "and a story to tell" — The storybook.
// Three.js storybook whose pages are real bending meshes: every frame each turning page is rebuilt as a strip that
// curls around the spine (angle grows along the page, the bottom corner leads, it lands flat), with lighting and
// soft shadows. Every page is a photo of an earlier moment of THIS video (E.thumb renders those scenes live),
// taped onto paper with a handwritten caption.
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, seg, rng, buf, bctx, font, hash } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { drawMascot } from '../../core/mascot.js';
import { THREE, render3d, renderer } from '../../core/three.js';
import { BP, glowSprite, bokehSprite, heart, roundRect, sparkle } from './kit.js';

const S = shot('B08');
const T0 = S.start, STORY = 119.98, TELL = 120.42;
const PW = 1.0, PH = 1.36, NU = 40, NV = 14;
const TW = 768, TH = 1044; // page texture size

// earlier moments of this video shown in the book: [time, caption]
const MOMENTS = [
  [0.7, 'late one night…'], [5.6, 'a cursor came alive'],
  [11.15, 'we hit ENTER'], [38.9, 'ONE PROMPT!!'],
  [63.6, 'one guy, one idea'], [80.6, 'the skill is free'],
  [97.8, 'we learned to fly'], [104.8, 'it all came alive'],
  [109.4, '…and YOU stayed ♥'],
];
// flipping leaves: [start, duration, frontKey, backKey]
const LEAVES = [[STORY, 0.5, 'cover', 'endA'], [120.4, 0.6, 0, 1], [120.9, 0.6, 2, 3], [121.4, 0.6, 4, 5], [121.9, 0.6, 6, 7]];

function paperBase(x, seed) {
  const g = x.createLinearGradient(0, 0, TW, TH); g.addColorStop(0, '#FFF8EC'); g.addColorStop(1, '#FBEBD8');
  x.fillStyle = g; x.fillRect(0, 0, TW, TH);
  const r = rng(seed);
  for (let i = 0; i < 2200; i++) { x.fillStyle = r() < 0.5 ? 'rgba(140,90,60,0.05)' : 'rgba(255,255,255,0.3)'; x.fillRect(r() * TW, r() * TH, 1 + r() * 2, 1 + r() * 2); }
}
function pageCanvas(key, E) {
  const c = buf('B08-page-' + key, TW, TH), x = bctx(c);
  if (c._done) return c;
  x.setTransform(1, 0, 0, 1, 0, 0);
  if (key === 'cover') {
    const g = x.createLinearGradient(0, 0, TW, TH); g.addColorStop(0, '#7A3E8E'); g.addColorStop(1, '#4A2A5E');
    x.fillStyle = g; x.fillRect(0, 0, TW, TH);
    x.strokeStyle = '#FFC94D'; x.lineWidth = 10; roundRect(x, 50, 50, TW - 100, TH - 100, 30); x.stroke();
    x.lineWidth = 3; roundRect(x, 72, 72, TW - 144, TH - 144, 22); x.stroke();
    x.fillStyle = '#FFC94D'; x.textAlign = 'center'; x.textBaseline = 'middle';
    font(x, 150, 'Anton'); x.fillText('ONE', TW / 2, 230); x.fillText('PROMPT', TW / 2, 380);
    font(x, 60, 'Instrument Serif', '400', 'italic'); x.fillText('a story told in code', TW / 2, 490);
    drawMascot(x, { x: TW / 2, y: 900, s: 0.95, t: 0.3, pose: 'wave', eyes: 'happy', mouth: 'grin', sticker: true });
  } else if (key === 'endA' || key === 'endB') {
    x.fillStyle = '#FFB3C9'; x.fillRect(0, 0, TW, TH);
    x.fillStyle = 'rgba(255,255,255,0.45)'; font(x, 44, 'JetBrains Mono', '800'); x.textAlign = 'center'; x.textBaseline = 'middle';
    for (let j = 0; j < 14; j++) for (let i = 0; i < 7; i++) { const px = 60 + i * 110 + (j % 2) * 55, py = 50 + j * 76; if ((i + j) % 2) x.fillText('>_', px, py); else { heart(x, px, py + 8, 16); x.fill(); } }
    if (key === 'endB') {
      x.save(); x.translate(TW / 2, TH / 2); x.rotate(-0.04);
      roundRect(x, -250, -180, 500, 360, 24); x.fillStyle = '#FFF8EC'; x.fill(); x.lineWidth = 8; x.strokeStyle = BP.ink; x.stroke();
      x.fillStyle = BP.ink; font(x, 40, 'JetBrains Mono', '800'); x.fillText('THIS BOOK BELONGS TO', 0, -100);
      font(x, 150, 'Caveat', '700'); x.fillStyle = '#E8346F'; x.fillText('you ♥', 0, 40);
      x.restore();
    }
  } else {
    const [tm, cap] = MOMENTS[key];
    paperBase(x, 40 + key);
    const th = E.thumb(tm, 512, 288);
    const r = rng(90 + key), rot = r.range(-0.06, 0.06);
    x.save(); x.translate(TW / 2, 400); x.rotate(rot);
    x.fillStyle = 'rgba(80,40,60,0.25)'; x.fillRect(-318 + 10, -200 + 14, 636, 400);
    x.fillStyle = '#FFFFFF'; x.fillRect(-318, -200, 636, 400);
    x.drawImage(th, -300, -182, 600, 337.5);
    x.fillStyle = 'rgba(255,143,177,0.8)'; x.save(); x.rotate(-0.5); x.fillRect(-60, -330, 120, 34); x.restore();
    x.fillStyle = 'rgba(255,201,77,0.85)'; x.save(); x.translate(300, -190); x.rotate(0.6); x.fillRect(-60, -17, 120, 34); x.restore();
    x.restore();
    x.fillStyle = BP.ink; x.textAlign = 'center'; x.textBaseline = 'middle';
    font(x, 84, 'Caveat', '700'); x.fillText(cap, TW / 2 + r.range(-20, 20), 720);
    // doodles
    x.strokeStyle = '#E8346F'; x.lineWidth = 6; x.lineCap = 'round';
    x.beginPath(); for (let i = 0; i <= 30; i++) { const u = i / 30; x.lineTo(180 + u * 410, 790 + Math.sin(u * 18) * 6); } x.stroke();
    x.fillStyle = '#FFB000'; sparkle(x, 120 + r.range(0, 40), 640 + r.range(-40, 40), 30, 0.3); x.fill();
    heart(x, 650 + r.range(-30, 0), 870, 26); x.fillStyle = '#FF5C93'; x.fill();
    font(x, 34, 'Instrument Serif', '400', 'italic'); x.fillStyle = 'rgba(31,42,85,0.55)'; x.fillText(`— ${key + 1} —`, TW / 2, 960);
  }
  c._done = true; return c;
}

function makeTex(c, mirror) {
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (mirror) { t.wrapS = THREE.RepeatWrapping; t.repeat.x = -1; t.offset.x = 1; }
  return t;
}

let R3 = null;
function leafGeometry() {
  const g = new THREE.BufferGeometry();
  const pos = new Float32Array((NU + 1) * (NV + 1) * 3), uv = new Float32Array((NU + 1) * (NV + 1) * 2), idx = [];
  for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) { const k = j * (NU + 1) + i; uv[k * 2] = i / NU; uv[k * 2 + 1] = 1 - j / NV; }
  for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) { const a = j * (NU + 1) + i, b = a + 1, c = a + NU + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  g.setIndex(idx); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return g;
}
/** bend a leaf: p 0..1 flip progress, lift = height offset, stiff = cover rigidity */
function bendLeaf(g, p, lift, stiff) {
  const pos = g.attributes.position.array;
  const th = Math.PI * ease.inOutCubic(p), kap = (stiff ? 0.6 : 2.4) * Math.sin(Math.PI * p);
  const ds = PW / NU;
  for (let j = 0; j <= NV; j++) {
    const v = j / NV, corner = 1 + 0.55 * v; // bottom (near camera) corner leads
    let x = 0, y = 0;
    for (let i = 0; i <= NU; i++) {
      const u = i / NU, k = (j * (NU + 1) + i) * 3;
      pos[k] = x; pos[k + 1] = y + lift; pos[k + 2] = (v - 0.5) * PH;
      const phi = clamp(th + kap * Math.pow(u, 1.3) * corner * (1 - 0.35 * p), 0, Math.PI);
      x += Math.cos(phi) * ds; y += Math.sin(phi) * ds;
    }
  }
  g.attributes.position.needsUpdate = true; g.computeVertexNormals(); g.computeBoundingSphere();
}

function build(E) {
  if (R3) return R3;
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(36, W / H, 0.05, 50);
  scene.add(new THREE.HemisphereLight(0xF3E8FF, 0xFFC8A8, 1.15));
  const key = new THREE.DirectionalLight(0xFFF0DC, 2.1); key.position.set(-1.6, 3.2, 1.6); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -2, right: 2, top: 2, bottom: -2, near: 0.5, far: 8 }); key.shadow.bias = -0.0006; key.shadow.normalBias = 0.01;
  scene.add(key);
  const mat = (c, mirror, side) => new THREE.MeshStandardMaterial({ map: makeTex(c, mirror), roughness: 0.82, side });
  // table shadow catcher
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.ShadowMaterial({ opacity: 0.3, color: 0x5A2A5E }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.075; ground.receiveShadow = true; scene.add(ground);
  // hard cover boards + page blocks
  const coverMat = new THREE.MeshStandardMaterial({ color: 0x5A2F70, roughness: 0.6 });
  const board = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.03, PH + 0.08), coverMat); board.position.y = -0.06; board.castShadow = true; board.receiveShadow = true; scene.add(board);
  const edgeMat = new THREE.MeshStandardMaterial({ color: 0xF6E7D2, roughness: 0.9 });
  const blockR = new THREE.Mesh(new THREE.BoxGeometry(PW, 0.045, PH), edgeMat); blockR.position.set(PW / 2, -0.024, 0); blockR.castShadow = blockR.receiveShadow = true; scene.add(blockR);
  const blockL = new THREE.Mesh(new THREE.BoxGeometry(PW, 0.02, PH), edgeMat); blockL.position.set(-PW / 2, -0.036, 0); blockL.receiveShadow = true; scene.add(blockL);
  // static top pages
  const flat = (c, x0) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), mat(c, false, THREE.FrontSide)); m.rotation.x = -Math.PI / 2; m.position.set(x0, 0.0, 0); m.receiveShadow = true; scene.add(m); return m; };
  const right = flat(pageCanvas(8, E), PW / 2), left = flat(pageCanvas('endB', E), -PW / 2);
  // leaves
  const leaves = LEAVES.map(([st, du, fk, bk], i) => {
    const g = leafGeometry();
    const front = new THREE.Mesh(g, mat(pageCanvas(fk, E), false, THREE.FrontSide));
    const back = new THREE.Mesh(g, mat(pageCanvas(bk, E), true, THREE.BackSide));
    front.castShadow = back.castShadow = true; front.receiveShadow = back.receiveShadow = true;
    scene.add(front, back);
    return { st, du, g, i, cover: fk === 'cover' };
  });
  R3 = { scene, cam, leaves, right, left };
  return R3;
}

export default {
  ...S,
  cutIn: 'none',
  sfx: [{ t: STORY, type: 'paper', gain: 0.7 }, { t: 120.4, type: 'paper', gain: 0.5 }, { t: 120.9, type: 'paper', gain: 0.5 }, { t: 121.4, type: 'paper', gain: 0.5 }, { t: 121.9, type: 'paper', gain: 0.5 }],
  draw(ctx, t, s, E) {
    // fetch every thumbnail BEFORE drawing anything (thumbs re-enter the engine)
    for (let i = 0; i < MOMENTS.length; i++) pageCanvas(i, E);
    const R = build(E), lt = t - T0, beat = A.pulse('beat', t, 0.22);

    // ---- background: warm table, bokeh, light ----
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const bg = ctx.createRadialGradient(960, 420, 100, 960, 540, 1300);
    bg.addColorStop(0, '#FFE9D2'); bg.addColorStop(0.45, '#FFC2B4'); bg.addColorStop(1, '#B98AD8');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < 18; i++) {
      const r = rng(700 + i), x = (r.range(0, W) + lt * r.range(-30, 30) + W) % W, y = r.range(60, H - 60) + Math.sin(lt + i) * 20, sz = r.range(80, 240) * (1 + 0.1 * beat);
      ctx.globalAlpha = r.range(0.2, 0.45); ctx.drawImage(bokehSprite(r.pick(['#FFE3A3', '#FF8FB1', '#FFF4EA', '#C9B6FF']), 160), x - sz / 2, y - sz / 2, sz, sz);
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';

    // ---- leaves ----
    const nL = R.leaves.length;
    for (const L of R.leaves) {
      const p = clamp((t - L.st) / L.du);
      const flipped = p >= 1, order = L.i;
      const lift = flipped ? 0.0015 + order * 0.0014 : 0.0015 + (nL - order) * 0.0014;
      bendLeaf(L.g, p, lift + Math.sin(Math.PI * p) * 0.02, L.cover);
    }

    // ---- camera: settle in, drift, then dive into the last photo ----
    const dive = ease.inOutCubic(seg(t, 122.3, S.end + 0.02));
    const ang = 0.1 - lt * 0.04;
    const base = new THREE.Vector3(Math.sin(ang) * 1.72 + 0.05, lerp(2.42, 2.12, ease.outCubic(seg(lt, 0, 1.4))), Math.cos(ang) * 1.72);
    const target = new THREE.Vector3(0, 0, 0.12);
    const photo = new THREE.Vector3(PW / 2, 0, -0.17), close = new THREE.Vector3(PW / 2, 0.62, 0.02);
    R.cam.position.copy(base.lerp(close, dive)); R.cam.lookAt(target.lerp(photo, dive));
    R.cam.position.y += Math.sin(t * 1.3) * 0.01;
    render3d(ctx, R.scene, R.cam, { toneMapping: THREE.NoToneMapping });

    // dust motes in the light
    ctx.globalCompositeOperation = 'screen';
    const gsp = glowSprite('#FFF1D0', 64);
    for (let i = 0; i < 50; i++) {
      const x = (hash(i, 1) * W + lt * 40 * (hash(i, 2) - 0.3) + W) % W, y = (hash(i, 3) * H - lt * 30 * hash(i, 4) + H) % H, sz = 6 + 18 * hash(i, 5);
      ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 3 + i); ctx.drawImage(gsp, x - sz, y - sz, sz * 2, sz * 2);
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';

    // ---- type: "a story to tell" ----
    const k1 = ease.outBack(seg(t, STORY - 0.02, STORY + 0.25), 1.8), kOut = ease.inCubic(seg(t, 121.25, 121.55));
    if (k1 > 0 && kOut < 1) {
      ctx.save(); ctx.translate(960, 200 - kOut * 300); ctx.scale(k1, k1);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      font(ctx, 132, 'Instrument Serif', '400', 'italic');
      ctx.fillStyle = '#7A2E60'; ctx.fillText('a story to tell', 7, 9);
      const tg = ctx.createLinearGradient(0, -70, 0, 60); tg.addColorStop(0, '#FFFFFF'); tg.addColorStop(1, '#FFE0A6');
      ctx.fillStyle = tg; ctx.fillText('a story to tell', 0, 0);
      ctx.restore();
    }
    E.fx.bloom = 0.18; E.fx.bloomThreshold = 0.86; E.fx.vignette = 0.35;
    if (!s.thumb && lt < 0.12) E.fx.flash = [1, 0.97, 0.9, 1 - lt / 0.12];
  },
};
