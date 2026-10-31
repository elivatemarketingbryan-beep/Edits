// B07 — "Just a free skill" — The gift opens.
// Three.js: the glossy orange SKILL box (as in W07) wrapped as a gift. The bow unravels, the ribbons slip, the lid
// pops on "free". Volumetric light scattering (GPU Gems 3 style radial march, 80 samples, in the shared WebGL2
// context) pours out of the box; the floating FREE letters are occluders, so the light shafts are cut by the type.
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, seg, rng, buf, bctx, font, hash, wobble } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { G } from '../../core/gl.js';
import { THREE, render3d, renderer, RoundedBoxGeometry, envMap } from '../../core/three.js';
import { BP, glowSprite, sparkle, roundRect } from './kit.js';

const S = shot('B07');
const T0 = S.start, UNTIE = 118.56, POP = 118.8, DOWN = 118.91, SKILL = 118.98;

let R3 = null;
function build() {
  if (R3) return R3;
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(34, W / H, 0.1, 100);
  scene.add(new THREE.HemisphereLight(0xE4D6FF, 0xFFB89A, 0.55));
  const key = new THREE.DirectionalLight(0xFFF1DD, 1.05); key.position.set(-4, 7, 6); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); key.shadow.camera.left = -5; key.shadow.camera.right = 5; key.shadow.camera.top = 5; key.shadow.camera.bottom = -5; key.shadow.bias = -0.0004; key.shadow.radius = 6;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xFF8FB1, 1.6); rim.position.set(5, 3, -6); scene.add(rim);
  const inner = new THREE.PointLight(0xFFE2A0, 0, 12, 1.5); inner.position.set(0, 2.6, 0); scene.add(inner);
  const env = envMap();
  const boxMat = new THREE.MeshPhysicalMaterial({ color: 0xFF6A1F, roughness: 0.22, metalness: 0.0, clearcoat: 1, clearcoatRoughness: 0.12, envMap: env, envMapIntensity: 0.32 });
  const ribMat = new THREE.MeshPhysicalMaterial({ color: 0xFF5C93, roughness: 0.3, metalness: 0.15, sheen: 1, sheenColor: new THREE.Color(0xFFD0E0), envMap: env, envMapIntensity: 0.5 });
  const root = new THREE.Group(); scene.add(root);
  const box = new THREE.Mesh(new RoundedBoxGeometry(2.2, 1.8, 2.2, 6, 0.16), boxMat); box.position.y = 0.9; box.castShadow = true; root.add(box);
  // label decal on the front: ">_ SKILL"
  const lc = buf('B07-label', 512, 512), lx = bctx(lc);
  lx.clearRect(0, 0, 512, 512);
  roundRect(lx, 36, 70, 440, 330, 46); lx.fillStyle = '#FFF4EA'; lx.fill(); lx.lineWidth = 16; lx.strokeStyle = '#1F2A55'; lx.stroke();
  lx.fillStyle = '#1F2A55'; lx.textAlign = 'center'; lx.textBaseline = 'middle'; font(lx, 170, 'JetBrains Mono', '800'); lx.fillText('>_', 256, 205);
  font(lx, 92, 'Anton'); lx.fillStyle = '#FF6A1F'; lx.fillText('SKILL', 256, 335);
  const ltex = new THREE.CanvasTexture(lc); ltex.colorSpace = THREE.SRGBColorSpace; ltex.anisotropy = 4;
  const label = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 1.15), new THREE.MeshStandardMaterial({ map: ltex, transparent: true, roughness: 0.6 }));
  label.position.set(-0.55, 0.82, 1.111); root.add(label);
  // ribbons around the box (they slip off when untied)
  const ribA = new THREE.Mesh(new THREE.BoxGeometry(0.34, 1.84, 2.26), ribMat), ribB = new THREE.Mesh(new THREE.BoxGeometry(2.26, 1.84, 0.34), ribMat);
  ribA.position.set(0.45, 0.9, 0); ribB.position.set(0, 0.9, 0); ribA.castShadow = ribB.castShadow = true; root.add(ribA, ribB);
  // the lid group
  const lid = new THREE.Group(); root.add(lid);
  const lidBox = new THREE.Mesh(new RoundedBoxGeometry(2.38, 0.44, 2.38, 5, 0.14), boxMat); lidBox.castShadow = true; lid.add(lidBox);
  const lr1 = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.47, 2.42), ribMat), lr2 = new THREE.Mesh(new THREE.BoxGeometry(2.42, 0.47, 0.34), ribMat);
  lr1.position.x = 0.45; lid.add(lr1, lr2);
  // the bow: two torus loops + knot + tails
  const bow = new THREE.Group(); lid.add(bow); bow.position.set(0.45, 0.3, 0);
  const loopG = new THREE.TorusGeometry(0.42, 0.12, 14, 40);
  const l1 = new THREE.Mesh(loopG, ribMat), l2 = new THREE.Mesh(loopG, ribMat);
  l1.scale.set(1, 0.62, 0.55); l2.scale.set(1, 0.62, 0.55);
  l1.position.set(-0.36, 0.22, 0); l1.rotation.z = 0.5; l2.position.set(0.36, 0.22, 0); l2.rotation.z = -0.5;
  const knot = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 14), ribMat); knot.position.y = 0.12; knot.scale.set(1, 0.85, 0.85);
  const tailG = new THREE.BoxGeometry(0.22, 0.04, 0.9); tailG.translate(0, 0, 0.45);
  const t1 = new THREE.Mesh(tailG, ribMat), t2 = new THREE.Mesh(tailG, ribMat); t1.rotation.y = 0.5; t2.rotation.y = -0.5; t1.position.y = t2.position.y = 0.02;
  [l1, l2, knot, t1, t2].forEach((m) => { m.castShadow = true; bow.add(m); });
  // glowing interior (seen once the lid is off)
  const glowMat = new THREE.MeshBasicMaterial({ color: 0xFFF4D0, transparent: true, opacity: 0 });
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(1.98, 1.98), glowMat); glow.rotation.x = -Math.PI / 2; glow.position.y = 1.815; root.add(glow);
  // ground (shadow catcher)
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: 0.28, color: 0x6A2A60 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  R3 = { scene, cam, root, box, lid, bow, l1, l2, knot, t1, t2, ribA, ribB, glow, glowMat, inner, key };
  return R3;
}

const RAYS_FS = `
uniform sampler2D tOcc; uniform vec2 uLight; uniform float uDensity, uDecay, uWeight, uExposure;
void main(){
  vec2 tc = uv; vec2 d = (tc - uLight) * (1.0 / 80.0) * uDensity;
  float ill = 1.0; vec3 c = vec3(0.0);
  for (int i = 0; i < 80; i++) { tc -= d; c += texture(tOcc, tc).rgb * ill * uWeight; ill *= uDecay; }
  o = vec4(c * uExposure, 1.0);
}`;

const OW = 480, OH = 270;
export default {
  ...S,
  cutIn: 'punch',
  async init() { // build + compile up front so the first frame is not a cold start
    const R = build(); renderer().compile(R.scene, R.cam);
    G.program('B07-rays', RAYS_FS);
  },
  sfx: [{ t: UNTIE, type: 'swoosh', gain: 0.5 }, { t: POP, type: 'pop', gain: 1 }, { t: POP + 0.01, type: 'boom', gain: 0.6 }, { t: DOWN, type: 'riser', gain: 0.5 }],
  draw(ctx, t, s, E) {
    const R = build(), lt = t - T0, beat = A.pulse('beat', t, 0.2);
    const open = t >= POP ? 1 : 0, po = t - POP;
    const light = open ? ease.outExpo(seg(t, POP, POP + 0.12)) * (1 + 0.15 * Math.sin(t * 23) * 0.3) : 0;

    // ---- 2D background ----
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#8C79E8'); g.addColorStop(0.5, '#E78BC8'); g.addColorStop(0.75, '#FFA39A'); g.addColorStop(1, '#FFD0A8');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // floor disc
    const fg = ctx.createRadialGradient(960, 860, 50, 960, 860, 900); fg.addColorStop(0, 'rgba(255,236,214,0.85)'); fg.addColorStop(1, 'rgba(255,236,214,0)');
    ctx.fillStyle = fg; ctx.fillRect(0, 500, W, H);

    // ---- animate the 3D gift ----
    const drop = ease.outBounce(seg(lt, -0.04, 0.16));
    const rock = open ? 0 : (wobble(t - 118.62, 3, 4) * 0.05 * (t > 118.62 ? 1 : 0) + wobble(t - 118.31, 3, 4) * 0.04 * (t > 118.31 ? 1 : 0)) + Math.sin(t * 20) * 0.012 * seg(t, UNTIE, POP);
    const hop = t > 118.62 && t < POP ? Math.sin(Math.PI * seg(t, 118.62, 118.74)) * 0.12 : 0;
    R.root.position.y = (1 - drop) * 3 + hop; R.root.rotation.z = rock; R.root.rotation.y = -0.42 + lt * 0.18;
    // bow unravels
    const un = ease.inBack(seg(t, UNTIE, POP - 0.03), 1.4);
    const bs = 1 - un;
    R.l1.scale.set(Math.max(0.001, bs), 0.62 * Math.max(0.001, bs), 0.55); R.l2.scale.set(Math.max(0.001, bs), 0.62 * Math.max(0.001, bs), 0.55);
    R.l1.rotation.z = 0.5 + un * 2.5; R.l2.rotation.z = -0.5 - un * 2.5;
    R.knot.scale.setScalar(Math.max(0.001, 1 - un) * 0.9);
    R.t1.rotation.x = R.t2.rotation.x = un * 1.2; R.t1.scale.z = R.t2.scale.z = Math.max(0.001, 1 - un * 0.8);
    // ribbons slip down the box
    const slip = ease.inQuad(seg(t, UNTIE + 0.05, POP + 0.25));
    R.ribA.scale.y = R.ribB.scale.y = Math.max(0.001, 1 - slip); R.ribA.position.y = R.ribB.position.y = 0.92 * (1 - slip);
    R.ribA.visible = R.ribB.visible = slip < 0.97;
    // lid pops
    if (open) {
      const v = po;
      R.lid.position.set(-3.2 * v - 1.5 * v * v, 2.02 + 9 * v - 9 * v * v + 0.0, 1.4 * v);
      R.lid.rotation.set(-v * 5.5, 0, v * 3.2);
    } else { R.lid.position.set(0, 2.02, 0); R.lid.rotation.set(0, 0, 0); }
    R.glowMat.opacity = light; R.inner.intensity = 14 * light;
    // camera: slow orbit, pushes into the light after the pop
    const push = ease.inOutCubic(seg(t, DOWN, S.end));
    const ang = -0.12 + lt * 0.05, dist = lerp(7.0, 5.6, push), hgt = lerp(3.3, 4.1, push);
    R.cam.position.set(Math.sin(ang) * dist, hgt, Math.cos(ang) * dist);
    R.cam.lookAt(0, lerp(1.35, 2.3, push), 0);
    R.cam.updateMatrixWorld();
    if (open && po < 0.08) R.cam.position.y += (hash(E.frame, 3) - 0.5) * 0.2;
    render3d(ctx, R.scene, R.cam, { toneMapping: THREE.NoToneMapping, exposure: 1 });

    // projected light source (box opening) + lid
    const lp = new THREE.Vector3(0, 1.9, 0).project(R.cam);
    const LX = (lp.x * 0.5 + 0.5) * W, LY = (-lp.y * 0.5 + 0.5) * H;
    const lidP = R.lid.position.clone(); lidP.y += R.root.position.y; const lpp = lidP.project(R.cam);
    const lidX = (lpp.x * 0.5 + 0.5) * W, lidY = (-lpp.y * 0.5 + 0.5) * H;

    // ---- FREE letters (rise out of the light) ----
    const kF = ease.outBack(seg(t, DOWN - 0.06, DOWN + 0.2), 1.8);
    const fy = lerp(LY - 40, 300, ease.outExpo(seg(t, DOWN - 0.06, DOWN + 0.25))) - Math.sin(t * 3) * 6;
    const word = 'FREE', fs = 300;
    const letters = () => { // per-letter layout
      font(ctx, fs, 'Anton'); const ws = [...word].map((c) => ctx.measureText(c).width); const tot = ws.reduce((a, b) => a + b, 0) + 30 * (word.length - 1);
      let x = 960 - tot / 2; return [...word].map((c, i) => { const cx = x + ws[i] / 2; x += ws[i] + 30; return { c, cx, i }; });
    };

    // ---- volumetric rays (occlusion pass → radial march on the GPU) ----
    if (light > 0.001) {
      const oc = buf('B07-occ', OW, OH), ox = bctx(oc), sx = OW / W;
      ox.setTransform(1, 0, 0, 1, 0, 0); ox.fillStyle = '#000'; ox.fillRect(0, 0, OW, OH);
      ox.setTransform(sx, 0, 0, sx, 0, 0);
      // light: a hot core at the opening (only above the rim) + soft halo
      const pulse = 1 + 0.12 * beat + 0.05 * Math.sin(t * 17);
      ox.save(); ox.beginPath(); ox.rect(0, 0, W, LY + 30); ox.clip();
      const lg = ox.createRadialGradient(LX, LY, 0, LX, LY, 300 * pulse);
      lg.addColorStop(0, 'rgba(255,250,232,1)'); lg.addColorStop(0.3, 'rgba(255,214,150,0.75)'); lg.addColorStop(0.7, 'rgba(255,130,170,0.22)'); lg.addColorStop(1, 'rgba(0,0,0,0)');
      ox.fillStyle = lg; ox.fillRect(0, 0, W, H); ox.restore();
      // dark wedges around the source → distinct shafts after the radial march
      ox.save(); ox.translate(LX, LY); ox.rotate(t * 0.35); ox.fillStyle = 'rgba(0,0,0,0.9)';
      for (let i = 0; i < 26; i++) { const a0 = (i / 26) * TAU + hash(i, 9) * 0.1, w = 0.05 + 0.07 * hash(i, 10); ox.beginPath(); ox.moveTo(0, 0); ox.arc(0, 0, 900, a0, a0 + w); ox.closePath(); ox.fill(); }
      ox.restore();
      // the box body occludes everything below the rim
      {
        const pts = [];
        for (const [x, y, z] of [[-1.1, 0, -1.1], [1.1, 0, -1.1], [1.1, 0, 1.1], [-1.1, 0, 1.1], [-1.1, 1.8, -1.1], [1.1, 1.8, -1.1], [1.1, 1.8, 1.1], [-1.1, 1.8, 1.1]]) {
          const v = new THREE.Vector3(x, y + R.root.position.y, z).applyAxisAngle(new THREE.Vector3(0, 1, 0), R.root.rotation.y).project(R.cam); pts.push([(v.x * 0.5 + 0.5) * W, (-v.y * 0.5 + 0.5) * H]);
        }
        pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
        const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
        const lo = [], up = [];
        for (const p of pts) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
        for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
        const hull = lo.slice(0, -1).concat(up.slice(0, -1)); R.hull = hull;
        // keep the top face open: draw the hull, then re-light the opening ellipse
        ox.fillStyle = '#000'; ox.beginPath(); hull.forEach((p, i) => (i ? ox.lineTo(p[0], p[1] + 14) : ox.moveTo(p[0], p[1] + 14))); ox.closePath(); ox.fill();
        ox.save(); ox.globalCompositeOperation = 'lighter';
        const og = ox.createRadialGradient(LX, LY, 0, LX, LY, 170); og.addColorStop(0, 'rgba(255,248,225,1)'); og.addColorStop(1, 'rgba(255,200,140,0)');
        ox.fillStyle = og; ox.beginPath(); ox.ellipse(LX, LY, 200, 70, 0, 0, TAU); ox.fill(); ox.restore();
      }
      // occluders: the FREE letters + flying lid
      if (kF > 0) {
        ox.fillStyle = '#000';
        for (const L of letters()) { ox.save(); ox.translate(L.cx, fy); ox.scale(kF, kF); ox.rotate(Math.sin(t * 2.5 + L.i) * 0.04); font(ox, fs, 'Anton'); ox.textAlign = 'center'; ox.textBaseline = 'middle'; ox.fillText(L.c, 0, 0); ox.restore(); }
      }
      ox.beginPath(); ox.ellipse(lidX, lidY, 190 / (1 + po * 0.5), 90, po * 3, 0, TAU); ox.fillStyle = '#000'; ox.fill();
      const tex = G.canvasTex('B07-occ', oc);
      const r = G.shader('B07-rays', RAYS_FS, { tOcc: tex, uLight: [LX / W, 1 - LY / H], uDensity: 1.0, uDecay: 0.982, uWeight: 0.04, uExposure: 1.1 * light * (1 + 0.25 * beat) }, 960, 540);
      // light scatters in the air around/above the box, not on its front faces
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H);
      if (R.hull) { R.hull.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1] + 30) : ctx.moveTo(p[0], p[1] + 30))); ctx.closePath(); }
      ctx.clip('evenodd'); ctx.globalCompositeOperation = 'screen'; G.draw(ctx, r); ctx.restore();
      ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 0.25; G.draw(ctx, r); ctx.restore();
    }

    // ---- FREE letters drawn on top (lit faces) ----
    if (kF > 0) {
      for (const L of letters()) {
        ctx.save(); ctx.translate(L.cx, fy); ctx.scale(kF, kF); ctx.rotate(Math.sin(t * 2.5 + L.i) * 0.04);
        font(ctx, fs, 'Anton'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.lineJoin = 'round'; ctx.lineWidth = 22; ctx.strokeStyle = BP.ink; ctx.strokeText(L.c, 0, 0);
        ctx.fillStyle = '#FF5C93'; ctx.fillText(L.c, 9, 11);
        const tg = ctx.createLinearGradient(0, -fs * 0.4, 0, fs * 0.4); tg.addColorStop(0, '#FFFFFF'); tg.addColorStop(0.55, '#FFF1C4'); tg.addColorStop(1, '#FFC94D');
        ctx.fillStyle = tg; ctx.fillText(L.c, 0, 0);
        ctx.restore();
      }
      // "a free skill" tag
      const kt = ease.outBack(seg(t, SKILL, SKILL + 0.2));
      if (kt > 0) {
        ctx.save(); ctx.translate(960, fy + 190); ctx.scale(kt, kt); ctx.rotate(0.03);
        font(ctx, 54, 'JetBrains Mono', '800'); const str = '> just a free skill_'; const tw = ctx.measureText(str).width + 60;
        roundRect(ctx, -tw / 2 + 6, -42 + 8, tw, 84, 20); ctx.fillStyle = '#7A2E60'; ctx.fill();
        roundRect(ctx, -tw / 2, -42, tw, 84, 20); ctx.fillStyle = BP.ink; ctx.fill();
        ctx.fillStyle = '#FFF4EA'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(str, 0, 3);
        ctx.restore();
      }
    }
    // sparkles streaming out of the box
    if (open) {
      for (let i = 0; i < 46; i++) {
        const t0 = hash(i, 1) * 1.1, a = po - t0; if (a < 0 || a > 0.9) continue;
        const ang = -Math.PI / 2 + (hash(i, 2) - 0.5) * 2.2, v = 700 + hash(i, 3) * 900;
        const x = LX + Math.cos(ang) * v * a, y = LY + Math.sin(ang) * v * a + 500 * a * a;
        ctx.fillStyle = ['#FFF4EA', '#FFD24D', '#FF8FB1'][i % 3]; sparkle(ctx, x, y, (12 + 20 * hash(i, 4)) * (1 - a / 0.9), a * 8 + i); ctx.fill();
      }
    }
    // end: wash into warm light (hands over to the storybook)
    const wash = ease.inQuad(seg(t, 119.72, S.end));
    if (wash > 0) { ctx.fillStyle = `rgba(255,246,228,${wash})`; ctx.fillRect(0, 0, W, H); }

    E.fx.bloom = 0.2 + 0.35 * light; E.fx.bloomThreshold = 0.82;
    if (open && po < 0.15) { E.fx.shake = 18 * (1 - po / 0.15); E.fx.flash = [1, 0.96, 0.85, 0.7 * (1 - po / 0.15)]; E.fx.rgb = 6 * (1 - po / 0.15); }
  },
};
