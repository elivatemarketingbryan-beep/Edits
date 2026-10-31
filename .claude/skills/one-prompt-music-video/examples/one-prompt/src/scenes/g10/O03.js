// O03 — (instrumental) — SHOWREEL FLIPBOOK. A real 3D flipbook (Three.js) of THIS video: 28 highlight moments
// × 2 consecutive frames each, rendered by the engine itself (E.thumb) onto the pages. CURSOR's glove riffles
// the free edge, pages curl over the spine (each page is a bent strip: its angle is integrated along its width),
// up to ~9 pages in flight at once, casting real shadows, stacks growing/shrinking. The riffle accelerates,
// then lands on the downbeat on the ONE PROMPT page; a handwritten note gets scribbled in the margin.
import { shot, SHOTS } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, seg, hash, font, roundRect, buf, bctx } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { THREE, render3d } from '../../core/three.js';
import { inOutSine, motes, spaced, glove } from './common.js';

const S = shot('O03');
const T0 = S.start;                  // 150.38
const LAND = 152.485;                // downbeat — the riffle lands here
const RIFF0 = 150.56;
const PW = 6.4, PD = 4.0, PT = 0.011, NSLOT = 10, NXC = 30, FLIP = 0.24;

// ---------- highlight moments (spread over the whole video) ----------
function pickMoments() {
  const bad = (s) => /SELF-RENDER|PHOTOMOSAIC/.test(s.tech) || s.group === 'g10';
  const el = SHOTS.filter((s) => !bad(s) && s.end <= 142.9);
  const n = 27, out = [];
  for (let i = 0; i < n; i++) { const s = el[Math.round(i * (el.length - 1) / (n - 1))]; out.push({ t: +(s.start + (s.end - s.start) * 0.62).toFixed(3), id: s.id }); }
  const c1 = SHOTS.find((s) => s.id === 'C01');
  out.push({ t: +(c1.start + (c1.end - c1.start) * 0.78).toFixed(3), id: 'C01', last: true });
  return out;
}
let B = null;

function mmss(t) { const m = Math.floor(t / 60), s = Math.floor(t % 60); return `${m}:${String(s).padStart(2, '0')}`; }

function pageCanvas(E, t, id, k) {
  const th = E.thumb(t, 640, 360);
  const c = document.createElement('canvas'); c.width = 640; c.height = 360; const x = c.getContext('2d');
  x.drawImage(th, 0, 0);
  // printed timestamp sticker
  x.fillStyle = 'rgba(255,251,244,0.92)'; roundRect(x, 14, 14, 112, 40, 8); x.fill();
  x.fillStyle = '#1F2A55'; font(x, 24, 'JetBrains Mono', '800'); x.textAlign = 'left'; x.textBaseline = 'middle';
  x.fillText(mmss(t), 26, 35);
  x.fillStyle = '#E8343F'; x.beginPath(); x.arc(108, 34, 6, 0, TAU); x.fill();
  return c;
}

function pageMaterial(tex) {
  const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.82, metalness: 0, side: THREE.DoubleSide });
  m.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', `
      vec2 pu = (vMapUv - vec2(0.045, 0.125)) / vec2(0.91, 0.82);
      vec4 tc = texture2D(map, clamp(pu, 0.0, 1.0));
      float ins = step(0.0, pu.x) * step(pu.x, 1.0) * step(0.0, pu.y) * step(pu.y, 1.0);
      vec3 paper = vec3(0.93, 0.90, 0.84);
      float edge = smoothstep(0.0, 0.012, min(min(pu.x, 1.0 - pu.x), min(pu.y, 1.0 - pu.y)));
      vec3 c = mix(paper, tc.rgb, ins);
      c = mix(c, vec3(0.08, 0.1, 0.2), ins * (1.0 - edge) * 0.6);
      if (!gl_FrontFacing) c = paper * 0.97;
      diffuseColor.rgb *= c;
    `);
  };
  m.customProgramCacheKey = () => 'O03-page';
  return m;
}

function pageGeo() {
  const g = new THREE.BufferGeometry();
  const pos = new Float32Array((NXC + 1) * 2 * 3), uv = new Float32Array((NXC + 1) * 2 * 2), idx = [];
  for (let i = 0; i <= NXC; i++) for (let j = 0; j < 2; j++) { const k = i * 2 + j; uv[k * 2] = i / NXC; uv[k * 2 + 1] = 1 - j; }
  for (let i = 0; i < NXC; i++) { const a = i * 2, b = (i + 1) * 2; idx.push(a, a + 1, b, b, a + 1, b + 1); }
  g.setIndex(idx); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return g;
}

function edgeTexture() {
  const c = document.createElement('canvas'); c.width = 64; c.height = 256; const x = c.getContext('2d');
  x.fillStyle = '#F2EBDD'; x.fillRect(0, 0, 64, 256);
  for (let y = 0; y < 256; y += 4) { x.fillStyle = `rgba(120,100,80,${0.12 + 0.12 * hash(y, 3)})`; x.fillRect(0, y, 64, 1); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}

function build(E) {
  const moments = pickMoments();
  const pages = [];
  moments.forEach((m, i) => {
    for (let k = 0; k < 2; k++) {
      const tt = m.last && k === 1 ? m.t + 0.0 : m.t + k * 0.067;
      const tex = new THREE.CanvasTexture(pageCanvas(E, tt, m.id, k)); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
      pages.push({ tex, t: tt, id: m.id });
    }
  });
  const N = pages.length;
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(30, W / H, 0.1, 100);
  scene.add(new THREE.AmbientLight(0xffffff, 0.8));
  const sun = new THREE.DirectionalLight(0xfff1dc, 1.5); sun.position.set(-3.5, 9, 5); sun.castShadow = true;
  sun.shadow.mapSize.set(1536, 1536); sun.shadow.camera.left = -9; sun.shadow.camera.right = 9; sun.shadow.camera.top = 7; sun.shadow.camera.bottom = -7; sun.shadow.camera.near = 1; sun.shadow.camera.far = 30;
  sun.shadow.bias = -0.0008; sun.shadow.radius = 4;
  sun.target.position.set(1.5, 0, 0); scene.add(sun, sun.target);
  const sky = new THREE.HemisphereLight(0xcfeaff, 0xffd8b0, 0.35); scene.add(sky);
  const book = new THREE.Group(); scene.add(book);
  // ground (shadow catcher)
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({ opacity: 0.22 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.09; ground.receiveShadow = true; scene.add(ground);
  // cover board
  const coverMat = new THREE.MeshStandardMaterial({ color: 0xff6a1f, roughness: 0.55 });
  const cover = new THREE.Mesh(new THREE.BoxGeometry(PW * 2 + 0.36, 0.09, PD + 0.36), coverMat);
  cover.position.set(0, -0.045, 0); cover.castShadow = true; cover.receiveShadow = true; book.add(cover);
  // spine cloth
  const spine = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.1, PD + 0.4), new THREE.MeshStandardMaterial({ color: 0x1f2a55, roughness: 0.7 }));
  spine.position.set(0, -0.03, 0); book.add(spine);
  // stacks
  const eTex = edgeTexture();
  const edgeMat = new THREE.MeshStandardMaterial({ map: eTex, roughness: 0.9 });
  const paperMat = new THREE.MeshStandardMaterial({ color: 0xf3eee4, roughness: 0.85 });
  const stackMat = [edgeMat, edgeMat, paperMat, paperMat, edgeMat, edgeMat];
  const stackR = new THREE.Mesh(new THREE.BoxGeometry(PW - 0.04, 1, PD - 0.04), stackMat); stackR.castShadow = true; stackR.receiveShadow = true; book.add(stackR);
  const stackL = new THREE.Mesh(new THREE.BoxGeometry(PW - 0.04, 1, PD - 0.04), stackMat); stackL.castShadow = true; stackL.receiveShadow = true; book.add(stackL);
  // top page (flat) + slots
  const mkPage = () => { const g = pageGeo(); const m = new THREE.Mesh(g, pageMaterial(pages[0].tex)); m.castShadow = true; m.receiveShadow = true; book.add(m); return m; };
  const top = mkPage();
  const slots = Array.from({ length: NSLOT }, mkPage);
  // binder clip (simple)
  B = { pages, N, scene, cam, book, stackR, stackL, top, slots, moments };
}

/** continuous number of released pages at time t (slow → fast → lands on the downbeat) */
function released(t, N) {
  const u = seg(t, RIFF0, LAND - 0.2);
  // ease: gentle start, fast middle, soft landing
  const f = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2.4) / 2;
  return (N - 1) * clamp(f);
}

/** set a page mesh's vertices for flip angle th (0 = flat on the right stack, PI = on the left) */
function shapePage(mesh, th, yR, yL, lift = 0) {
  const pos = mesh.geometry.attributes.position.array;
  const bend = -0.95 * Math.sin(th);
  const py = lerp(yR, yL, th / Math.PI) + lift;
  let x = 0, y = 0; const ds = PW / NXC;
  for (let i = 0; i <= NXC; i++) {
    if (i > 0) { const dn = (i - 0.5) / NXC; const ph = th + bend * Math.pow(dn, 1.6); x += Math.cos(ph) * ds; y += Math.sin(ph) * ds; }
    for (let j = 0; j < 2; j++) { const k = (i * 2 + j) * 3; pos[k] = x; pos[k + 1] = py + y; pos[k + 2] = j === 0 ? -PD / 2 + 0.03 : PD / 2 - 0.03; }
  }
  mesh.geometry.attributes.position.needsUpdate = true;
  mesh.geometry.computeVertexNormals();
  mesh.geometry.computeBoundingSphere();
}

const toScreen = (v, cam) => { const p = v.clone().project(cam); return [(p.x + 1) / 2 * W, (1 - p.y) / 2 * H]; };

export default {
  ...S,
  cutIn: 'punch',
  sfx: [{ t: 150.4, type: 'whoosh', gain: 0.7 }, { t: 150.6, type: 'paper', gain: 0.8 }, { t: 151.4, type: 'paper', gain: 0.6 }, { t: LAND, type: 'stamp', gain: 0.9 }],
  draw(ctx, t, s, E) {
    if (!B) build(E);
    const lt = t - T0, N = B.N;
    const rel = released(t, N);
    const nRel = Math.floor(rel);
    const landed = t >= LAND ? t - LAND : -1;
    const hit = A.pulse('beat', t, 0.16);

    // ---- background: bright sky blue, light pool, rolling giant type ----
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#8FD3FF'); g.addColorStop(1, '#D6F0FF');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const lp = ctx.createRadialGradient(760, 300, 50, 760, 300, 1200); lp.addColorStop(0, 'rgba(255,251,240,0.85)'); lp.addColorStop(1, 'rgba(255,251,240,0)');
    ctx.fillStyle = lp; ctx.fillRect(0, 0, W, H);
    // halftone dots drifting
    ctx.fillStyle = 'rgba(46,139,224,0.16)';
    const off = (lt * 40) % 36;
    ctx.beginPath();
    for (let y = -36; y < H + 36; y += 36) for (let x = -36; x < W + 36; x += 36) {
      const px = x + off + ((y / 36) % 2) * 18, py = y + off * 0.5;
      const r = 2 + 4 * clamp((py / H) * 1.1 - 0.2 + 0.2 * Math.sin(px * 0.004 + lt * 2));
      ctx.moveTo(px + r, py); ctx.arc(px, py, r, 0, TAU);
    }
    ctx.fill();
    // marquee
    font(ctx, 250, 'Anton'); ctx.textBaseline = 'middle';
    const line1 = 'EVERY FRAME · 100% CODE · 0 AI PIXELS · ';
    const lw = ctx.measureText(line1).width;
    ctx.save(); ctx.globalAlpha = 0.9; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    for (let k = -1; k < 3; k++) ctx.strokeText(line1, -((lt * 520) % lw) + k * lw, 170);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    for (let k = -1; k < 3; k++) ctx.fillText(line1, -lw + ((lt * 380) % lw) + k * lw, 960);
    ctx.restore();

    // ---- book ----
    const yBase = 0.0;
    const hR = yBase + (N - rel) * PT + 0.02, hL = yBase + rel * PT + 0.02;
    B.stackR.scale.y = hR; B.stackR.position.set(PW / 2, hR / 2, 0);
    B.stackL.scale.y = hL; B.stackL.position.set(-PW / 2, hL / 2, 0);
    // top page = next unreleased page
    shapePage(B.top, 0, hR + 0.003, hL, 0);
    // flipping pages: page p released at time where rel crosses p; its angle grows over FLIP seconds
    // estimate release time by inverting rel(t) numerically (cheap: march back)
    let si = 0;
    for (let p = nRel; p >= Math.max(1, nRel - 14) && si < NSLOT; p--) {
      // time when rel == p
      let lo = RIFF0 - 0.01, hi = t;
      if (released(hi, N) < p) continue;
      for (let it = 0; it < 18; it++) { const mid = (lo + hi) / 2; if (released(mid, N) >= p) hi = mid; else lo = mid; }
      const age = t - hi;
      const u = clamp(age / FLIP);
      if (u >= 1) continue;
      const th = Math.PI * (1 - Math.pow(1 - u, 2.2));
      const m = B.slots[si++];
      m.visible = true; m.material.map = B.pages[p - 1].tex;
      shapePage(m, th, hR + 0.006 + si * 0.0005, hL + 0.006, 0.02);
    }
    // the current top page shown on the right stack is page index nRel (pages 0..nRel-1 flipped)
    B.top.material.map = B.pages[Math.min(N - 1, nRel)].tex;
    for (; si < NSLOT; si++) B.slots[si].visible = false;

    // camera: drop-in, push, landing push to the last page
    const drop = ease.outExpo(seg(t, T0, T0 + 0.4));
    B.book.position.set(0, lerp(3, 0, drop), lerp(-4, 0, drop));
    B.book.rotation.set(0, lerp(0.16, 0.03, inOutSine(seg(t, T0, LAND))), 0);
    const land = landed >= 0 ? ease.outCubic(clamp(landed / 0.8)) : 0;
    const cam = B.cam;
    const cx = lerp(2.5, 3.0, inOutSine(s.u)) + land * 0.25, cy = lerp(15.6, 14.2, inOutSine(s.u)) - land * 1.3, cz = lerp(8.6, 7.6, inOutSine(s.u)) - land * 0.7;
    cam.position.set(cx + Math.sin(lt * 1.3) * 0.08, cy, cz);
    cam.lookAt(lerp(2.5, 3.0, inOutSine(s.u)) + land * 0.25, 0, lerp(-0.75, -0.6, s.u) - land * 0.1);
    render3d(ctx, B.scene, cam);

    // ---- CURSOR glove riffling the free edge ----
    if (landed < 0.25) {
      const corner = new THREE.Vector3(PW + 0.15, hR + 0.15, PD / 2 - 0.5).applyMatrix4(B.book.matrixWorld);
      const [gx, gy] = toScreen(corner, cam);
      const flick = Math.sin(rel * Math.PI) ** 2;
      const a = landed >= 0 ? 1 - landed / 0.25 : clamp(lt / 0.2);
      ctx.save(); ctx.globalAlpha = a;
      ctx.translate(gx + 10, gy - 14 * flick); ctx.rotate(-0.4 + 0.15 * flick);
      ctx.lineWidth = 14; ctx.strokeStyle = '#1F2A55'; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(60, 120); ctx.quadraticCurveTo(80, 60, 30, 10); ctx.stroke();
      ctx.scale(1.5, 1.5); glove(ctx, 0, 0, 34); glove(ctx, -26, -8, 15);
      ctx.restore();
    }

    // ---- handwriting on the left page (backs of the flipped pages) ----
    {
      const p = new THREE.Vector3(-PW * 0.42, hL + 0.01, 0.1).applyMatrix4(B.book.matrixWorld);
      const [px, py] = toScreen(p, cam);
      ctx.save(); ctx.translate(px, py); ctx.rotate(-0.12);
      font(ctx, 58, 'Caveat', '700'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = 'rgba(31,42,85,0.75)';
      ctx.fillText(`page ${Math.min(N, nRel + 1)} / ${N}`, 0, 0);
      font(ctx, 40, 'Caveat', '600'); ctx.fillStyle = 'rgba(232,52,63,0.8)';
      ctx.fillText('flip it →', 10, 56);
      ctx.restore();
    }

    // ---- frame counter chip (which moment we are looking at) ----
    const curT = B.pages[Math.min(N - 1, nRel)].t;
    const chipK = ease.outBack(seg(t, T0 + 0.1, T0 + 0.35));
    ctx.save(); ctx.translate(1640, 262); ctx.scale(chipK, chipK); ctx.rotate(0.06);
    ctx.fillStyle = '#1F2A55'; roundRect(ctx, -190 + 8, -78 + 8, 380, 156, 22); ctx.fill();
    ctx.fillStyle = '#FFFBF4'; roundRect(ctx, -190, -78, 380, 156, 22); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = '#1F2A55'; ctx.stroke();
    font(ctx, 26, 'JetBrains Mono', '800'); ctx.fillStyle = '#E8343F'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(landed >= 0 ? '■ REPLAY' : '▶▶ REPLAY', 0, -42);
    font(ctx, 96, 'Anton'); ctx.fillStyle = '#1F2A55'; ctx.fillText(mmss(curT), 0, 22);
    ctx.restore();

    // ---- landing: handwritten note in the margin ----
    if (landed >= 0) {
      const top = new THREE.Vector3(PW * 0.5, hR, PD / 2 - 0.08).applyMatrix4(B.book.matrixWorld);
      const [nx, ny] = toScreen(top, cam);
      const str = 'all of it = code ♥';
      const n = Math.floor(clamp((landed - 0.1) / 0.5) * str.length);
      ctx.save(); ctx.translate(nx - 40, ny + 20); ctx.rotate(-0.05);
      font(ctx, 64, 'Caveat', '700'); ctx.fillStyle = '#E8343F'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(str.slice(0, n), 0, 0);
      ctx.restore();
    }

    motes(ctx, t, { n: 24, seed: 41, col: [255, 255, 255], alpha: 0.4, size: [3, 16], speed: 20 });

    // FX — a tick on every page, a stamp on the landing
    const pageTick = rel - nRel < 0.25 && rel < N - 1.5 ? 1 : 0;
    E.fx.zoom += 0.004 * pageTick;
    E.fx.vignette = 0.25; E.fx.bloom = 0.2; E.fx.bloomThreshold = 0.85;
    if (landed >= 0) { const k = Math.exp(-landed * 10); E.fx.shake = 10 * k; E.fx.zoom += 0.03 * k; E.fx.rgb = 4 * k; }
    const sp = Math.abs(released(t + 1 / 30, N) - rel) * 30;
    E.fx.rgb += clamp(sp / 40) * 2;
  },
};
