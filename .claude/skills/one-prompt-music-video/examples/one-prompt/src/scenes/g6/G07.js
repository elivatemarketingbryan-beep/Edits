// G07 — (riser into chorus 2) — chrome 3 · 2 · 1 (Three.js extruded Anton, env-mapped metal) slam on the three beats
// while the gold world is sucked into a vortex: rays spin up, 900 gold sparks spiral into the centre, CURSOR gets
// stretched toward the singularity, then everything implodes to a point and flashes lilac into the voxel chorus.
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, seg, rng, rays, spring } from '../../core/lib.js';
import { drawMascot } from '../../core/mascot.js';
import { THREE, render3d, envMap, textGeo } from '../../core/three.js';

const S = { ...shot('G07'), start: 85.31 };
const HITS = [85.31, 85.914, 86.494], IMPLODE = 86.62, END = 86.86;
const SPARKS = (() => { const r = rng(707); return Array.from({ length: 900 }, () => ({ a: r() * TAU, r0: 500 + r() * 1400, sp: 0.6 + r() * 1.6, d: r() * 0.9, c: r() < 0.7 ? '#FFC300' : r() < 0.5 ? '#FFF1B0' : '#FF6A1F', w: 1.5 + r() * 3 })); })();

let T = null;
function build() {
  const scene = new THREE.Scene();
  scene.environment = envMap();
  const cam = new THREE.PerspectiveCamera(32, W / H, 0.1, 100); cam.position.set(0, 0, 14);
  const mat = new THREE.MeshStandardMaterial({ color: '#F4F7FF', metalness: 1, roughness: 0.12, envMapIntensity: 1.35 });
  const rim = new THREE.MeshStandardMaterial({ color: '#FFC300', metalness: 1, roughness: 0.25, envMapIntensity: 1.2 });
  const key = new THREE.DirectionalLight('#FFF4D6', 2.2); key.position.set(-4, 6, 8); scene.add(key);
  const warm = new THREE.PointLight('#FFC300', 60, 30); warm.position.set(5, -3, 5); scene.add(warm);
  scene.add(new THREE.AmbientLight('#ffffff', 0.25));
  const nums = ['3', '2', '1'].map((n) => {
    const m = new THREE.Mesh(textGeo(n, { font: 'Anton', size: 5.2, depth: 1.3, bevel: 0.14, curveSegments: 10 }), [mat, rim]);
    m.visible = false; scene.add(m); return m;
  });
  return { scene, cam, nums };
}

export default {
  ...S,
  hud: 'paper', cutIn: 'flash',
  sfx: [{ t: 85.31, type: 'stamp', gain: 0.9 }, { t: 85.914, type: 'stamp', gain: 1 }, { t: 86.494, type: 'impact', gain: 1 }, { t: 86.6, type: 'riser', gain: 0.5 }, { t: IMPLODE, type: 'whoosh', gain: 0.9 }],
  draw(ctx, t, s, E) {
    if (!T) T = build();
    const k = clamp((t - S.start) / (END - S.start));               // 0..1 over the shot
    const imp = ease.inExpo(seg(t, IMPLODE, END - 0.04));            // final implosion
    const cx = W / 2, cy = H / 2;
    ctx.save();
    ctx.translate(cx, cy); ctx.scale(1 - imp * 0.97, 1 - imp * 0.97); ctx.rotate(imp * 1.2); ctx.translate(-cx, -cy);
    // vortex background: black + spinning gold rays, accelerating
    ctx.fillStyle = '#111111'; ctx.fillRect(-W, -H, W * 3, H * 3);
    const el = t - S.start, spin = 0.6 * el + 2.2 * el * el;
    rays(ctx, cx, cy, 36, 2600, spin, 'rgba(255,195,0,0.95)', 'rgba(17,17,17,1)');
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 900); g.addColorStop(0, 'rgba(255,241,176,0.85)'); g.addColorStop(0.35, 'rgba(255,195,0,0.25)'); g.addColorStop(1, 'rgba(17,17,17,0.55)');
    ctx.fillStyle = g; ctx.fillRect(-W, -H, W * 3, H * 3);
    // sparks spiralling into the centre (closed form, looping per spark)
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    for (const p of SPARKS) {
      const u = ((el * p.sp + p.d) % 1.2) / 1.2, u2 = Math.max(0, u - 0.03);
      const r = p.r0 * (1 - ease.inCubic(u)), a = p.a + u * 5 * p.sp;
      const r2 = p.r0 * (1 - ease.inCubic(u2)), a2 = p.a + u2 * 5 * p.sp;
      ctx.strokeStyle = p.c; ctx.lineWidth = p.w * (0.4 + r / p.r0);
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(a2) * r2, cy + Math.sin(a2) * r2 * 0.75); ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.75); ctx.stroke();
    }
    ctx.restore();
    // CURSOR caught in the pull: from the lower left, stretched toward the centre, spinning away
    const pull = ease.inCubic(seg(t, 85.6, IMPLODE));
    const mx = lerp(330, cx, pull), my = lerp(960, cy + 120, pull), ms = lerp(1.05, 0.15, pull);
    drawMascot(ctx, { x: mx, y: my, s: ms, t, pose: pull > 0.15 ? 'jump' : 'shrug', eyes: pull > 0.1 ? 'x' : 'normal', mouth: pull > 0.1 ? 'open' : 'o', squash: -0.35 * pull, rot: pull * 4.5, sticker: true });

    // chrome numerals: fly in from behind the lens on the beat, spring-settle, get flung out on the next hit
    const { scene, cam, nums } = T;
    nums.forEach((m, i) => {
      const t0 = HITS[i], t1 = HITS[i + 1] ?? IMPLODE;
      m.visible = t >= t0 - 0.08 && t < t1 + 0.14;
      if (!m.visible) return;
      const a = t - t0;
      const z = a < 0 ? lerp(7, 3.5, (a + 0.08) / 0.08) : 3.5 * Math.exp(-a * 30);
      const out = ease.inCubic(seg(t, t1 - 0.02, t1 + 0.14));
      m.position.set(out * (i % 2 ? -9 : 9), out * 4 + 0.15, z - out * 6);
      m.rotation.set(0.12 * Math.exp(-Math.max(0, a) * 6), (1 - spring(Math.max(0, a), 2.4, 0.3)) * 0.8 + 0.15 * Math.sin(t * 3) + out * 3, (i - 1) * 0.06 + out * 1.4);
      m.scale.setScalar((1 + 0.25 * Math.exp(-Math.max(0, a) * 14)) * (1 - imp));
    });
    cam.position.set(Math.sin(t * 1.3) * 0.6, Math.cos(t * 1.1) * 0.4, 14 - k * 2);
    cam.lookAt(0, 0, 0);
    render3d(ctx, scene, cam, { toneMapping: THREE.ACESFilmicToneMapping, exposure: 1.15 });
    ctx.restore();

    // lilac flash handing over to chorus 2
    if (imp > 0) { ctx.fillStyle = `rgba(183,156,255,${imp})`; ctx.fillRect(0, 0, W, H); }
    const hit = HITS.reduce((m, h, i) => Math.max(m, t >= h ? Math.exp(-(t - h) * 9) * (0.6 + i * 0.25) : 0), 0);
    E.fx.shake = 30 * hit + 8 * k; E.fx.rgb = 10 * hit + 4 * k; E.fx.zoom += 0.05 * hit;
    E.fx.radialBlur = 0.2 * k + 0.6 * imp; E.fx.center = [0.5, 0.5];
    E.fx.bloom = 0.6; E.fx.bloomThreshold = 0.75;
  },
};
