// V02 — "hit enter," — low hero angle on the ENTER keycap. CURSOR stomps on "hit", crouches, rockets
// up into the paper sky, hangs… and dives. On "enter" (11.12): 3 frames of manga impact (flat
// two-colour silhouettes + focus lines, colours flipping every frame), then the keyboard detonates:
// keycaps launched by the shockwave, the lens cracks, ENTER ⏎ slams in.
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, rng, font, wobble, rays } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { drawMascot, pose } from '../../core/mascot.js';
import { THREE, render3d } from '../../core/three.js';
import { P1, paper, toScreen, pressCurve, blobShadow, printType, focusLines, returnArrow, paperBurst, warm, paperTex } from './util.js';
import { buildKeyboard, studio, KEY_TOP } from './kb.js';

const S = shot('V02');
const T_HIT = 10.34, T_LAUNCH = 10.56, T_APEX = 10.96, T_DIVE = 11.03, T_IMP = 11.12;
const APEX = 7.2;
let R = null;

function build() {
  const scene = new THREE.Scene();
  const kb = buildKeyboard(); scene.add(kb.root);
  const st = studio(scene, { ext: 14 });
  const camera = new THREE.PerspectiveCamera(38, W / H, 0.3, 200);
  const enter = kb.by('ENTER');
  const r = rng(77);
  // launch params for every key (shockwave from ENTER)
  for (const k of kb.keys) {
    const dx = k.x - enter.x, dz = k.z - enter.z, d = Math.hypot(dx, dz);
    k.dist = d; k.delay = d / 34;
    const out = 2.5 + r() * 3.5, n = d || 1;
    k.v = [dx / n * out + (r() - 0.5) * 2, 7 + r() * 7 - d * 0.25, dz / n * out + 2.5 + r() * 3];
    k.spin = [(r() - 0.5) * 18, (r() - 0.5) * 12, (r() - 0.5) * 18];
    k.launch = k.label !== 'ENTER' && d < 9.5 && r() < 0.92 - d * 0.04;
  }
  const silMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
  // crack polylines (screen space, around the impact point), built once
  const cracks = [];
  const cr = rng(5);
  for (let i = 0; i < 8; i++) {
    let a = (i / 8) * TAU + cr() * 0.3, x = 0, y = 0; const pts = [[0, 0]];
    const L = 260 + cr() * 900;
    for (let s = 0; s < L; s += 40 + cr() * 50) { a += (cr() - 0.5) * 0.6; x += Math.cos(a) * 60; y += Math.sin(a) * 60; pts.push([x, y]); if (cr() < 0.18) cracks.push({ pts: [[x, y], [x + Math.cos(a + 1) * 90, y + Math.sin(a + 1) * 90], [x + Math.cos(a + 1.3) * 170, y + Math.sin(a + 0.8) * 170]], d: 0.03 }); }
    cracks.push({ pts, d: 0 });
  }
  R = { scene, camera, kb, enter, st, silMat, cracks };
}

/** mascot height above the ENTER key top */
function mascotY(t) {
  if (t < T_HIT) return lerp(1.4, 0, ease.inQuad(clamp((t - 10.26) / (T_HIT - 10.26))));
  if (t < T_LAUNCH) return 0;
  if (t < T_APEX) return APEX * ease.outCubic((t - T_LAUNCH) / (T_APEX - T_LAUNCH));
  if (t < T_DIVE) return APEX + 0.25 * Math.sin(((t - T_APEX) / (T_DIVE - T_APEX)) * Math.PI);
  if (t < T_IMP) return APEX * (1 - ease.inQuad((t - T_DIVE) / (T_IMP - T_DIVE)));
  return 0;
}

export default {
  ...S,
  cutIn: 'punch',
  sfx: [{ t: 10.34, type: 'click' }, { t: 10.56, type: 'whoosh', gain: 0.7 }, { t: 11.12, type: 'boom', gain: 1 }, { t: 11.14, type: 'shatter', gain: 0.6 }],
  init() { paperTex(P1.paper, W, H, 3); build(); warm(R.scene, R.camera); },
  draw(ctx, t, s, E) {
    if (!R) build();
    const { scene, camera, kb, enter, st } = R;
    const lt = s.lt, di = t - T_IMP;
    const impactFrame = di >= 0 && di < 0.1 ? Math.min(2, Math.floor(di * 30)) : -1;

    // ---------- keys ----------
    for (const k of kb.keys) {
      let y = 0, rx = 0, ry = 0, rz = 0, x = 0, z = 0;
      if (k.label === 'ENTER') {
        y = -pressCurve(t - T_HIT) * 0.15 - (di >= 0 ? (di < 0.05 ? 0.45 : 0.45 * Math.exp(-(di - 0.05) * 3)) : 0);
        y -= clamp((t - T_LAUNCH + 0.12) / 0.12) * (t < T_LAUNCH + 0.05 ? 0.1 : 0) ;
      } else if (di > 0) {
        const u = di - k.delay;
        if (u > 0 && k.launch) {
          x = k.v[0] * u; z = k.v[2] * u; y = k.v[1] * u - 14 * u * u;
          rx = k.spin[0] * u; ry = k.spin[1] * u; rz = k.spin[2] * u;
        } else if (u > 0) y = Math.exp(-u * 8) * Math.sin(u * 40) * 0.25;
      } else {
        // tension: keys tremble during the hang
        const tr = clamp((t - T_LAUNCH) / 0.5) * (t < T_IMP ? 1 : 0);
        y = Math.sin(t * 90 + k.x * 3 + k.z * 7) * 0.03 * tr;
      }
      k.g.position.set(k.x + x, y, k.z + z); k.g.rotation.set(rx, ry, rz);
    }

    // ---------- camera ----------
    const my = mascotY(t);
    const rise = clamp(my / APEX);
    const after = di > 0 ? ease.outCubic(clamp(di / 0.5)) : 0;
    const dive = t >= T_DIVE && t < T_IMP ? ease.inQuad((t - T_DIVE) / (T_IMP - T_DIVE)) : 0;
    const up = rise * (1 - dive);
    const myc = my * (1 - dive);
    const camPos = new THREE.Vector3(enter.x + 1.8 - up * 0.6, 4.0 + myc * 0.75, enter.z + 6.6 + up * 2.5);
    camPos.lerp(new THREE.Vector3(enter.x + 1.5, 6.5, enter.z + 8.5), after);
    camPos.x += Math.sin(lt * 2) * 0.15;
    camera.position.copy(camPos);
    const look = new THREE.Vector3(enter.x - 0.6, KEY_TOP + 1.25 + myc * 0.97, enter.z - 0.5);
    look.lerp(new THREE.Vector3(enter.x - 1.5, 0.8, enter.z - 0.5), after);
    camera.lookAt(look);
    camera.fov = lerp(40, 24, ease.inOutQuad(up)) + dive * 22; camera.updateProjectionMatrix();
    camera.updateMatrixWorld();

    // ---------- background ----------
    const [ex, ey] = toScreen(camera, enter.x, KEY_TOP, enter.z);
    const sil = impactFrame >= 0;
    const SCH = [[P1.red, P1.ink, P1.cream], [P1.cream, P1.ink, P1.ink], [P1.ink, P1.cream, P1.cream]][Math.max(0, impactFrame)];
    if (sil) {
      ctx.fillStyle = SCH[0]; ctx.fillRect(0, 0, W, H);
      focusLines(ctx, ex, ey - 120, 150, 210, SCH[2], 31 + impactFrame, 1.4);
    } else {
      paper(ctx, P1.paper, 0, -lt * 60);
      // sunburst behind the hang
      const tension = clamp((t - T_LAUNCH) / 0.5) * (di < 0 ? 1 : 0);
      if (tension > 0) {
        const [mx2, my2] = toScreen(camera, enter.x - 0.2, KEY_TOP + my + 1.0, enter.z);
        ctx.save(); ctx.globalAlpha = 0.85 * tension;
        rays(ctx, mx2, my2, 28, 2400, t * 0.9, 'rgba(232,52,63,0.0)', 'rgba(232,52,63,0.55)');
        ctx.restore();
      }
      if (tension > 0) {
        ctx.save(); ctx.globalAlpha = 0.18 + 0.3 * tension;
        focusLines(ctx, ex, ey - 300 * rise, 90, 380 - 120 * tension, P1.ink, (Math.floor(t * 15) % 4) + 3, 0.8);
        ctx.restore();
      }
      if (di > 0) {
        ctx.save(); ctx.globalAlpha = 0.9 * Math.exp(-di * 2);
        focusLines(ctx, ex, ey - 60, 120, 260 + di * 600, P1.red, 9 + (Math.floor(t * 30) % 3), 1.2); ctx.restore();
      }
    }

    // ---------- ENTER title (behind the board after impact) ----------
    if (di > 0.1) {
      const k = ease.outExpo(clamp((di - 0.1) / 0.22));
      ctx.save(); ctx.translate(W * 0.36, 330 + (1 - k) * -60); ctx.rotate(-0.06); const sc = lerp(2.4, 1, k) + wobble(di - 0.1, 3, 6) * 0.04; ctx.scale(sc, sc);
      ctx.globalAlpha = clamp(k * 2);
      printType(ctx, 'ENTER', -60, 0, 330, { family: 'Anton', fill: P1.orange, shadow: P1.ink, off: 0.05, stroke: P1.cream, strokeW: 18 });
      font(ctx, 330, 'Anton'); const w = ctx.measureText('ENTER').width;
      returnArrow(ctx, -60 + w / 2 + 150 + 10, 16, 210, P1.ink, 40);
      returnArrow(ctx, -60 + w / 2 + 150, 6, 210, P1.red, 40);
      ctx.restore();
    }

    // ---------- 3D ----------
    if (sil) {
      R.silMat.color.set(SCH[1]); scene.overrideMaterial = R.silMat; st.floor.visible = false;
      render3d(ctx, scene, camera);
      scene.overrideMaterial = null; st.floor.visible = true;
    } else render3d(ctx, scene, camera);

    // ---------- mascot ----------
    const ky = enter.g.position.y;
    const [fx, fy] = toScreen(camera, enter.x - 0.2, KEY_TOP + ky + my, enter.z);
    const [, hy] = toScreen(camera, enter.x - 0.2, KEY_TOP + ky + my + 2.1, enter.z);
    const sc = Math.abs(fy - hy) / 300;
    const [gx, gy] = toScreen(camera, enter.x - 0.2, KEY_TOP + ky, enter.z);
    let P = pose('idle', t), squash = 0, rot = 0, eyes = 'normal', mouth = 'auto';
    if (t < T_HIT) { P = pose('jump', t); squash = -0.15; }
    else if (t < T_LAUNCH) {
      const u = (t - T_HIT) / (T_LAUNCH - T_HIT);
      squash = 0.35 * wobble(t - T_HIT, 4, 10) + 0.42 * ease.inOutQuad(clamp((u - 0.25) / 0.75));
      P.armL = [-170, 120]; P.armR = [170, 120]; P.look = [0, -1]; eyes = u > 0.4 ? 'normal' : 'normal'; mouth = 'flat';
    } else if (t < T_DIVE) {
      const u = (t - T_LAUNCH) / (T_DIVE - T_LAUNCH);
      P = pose('cheer', t); squash = u < 0.3 ? -0.3 * (1 - u / 0.3) : 0; rot = ease.inOutCubic(clamp((u - 0.35) / 0.65)) * TAU;
      P.legL = [-50, 150]; P.legR = [50, 150]; eyes = 'star'; mouth = 'grin';
    } else if (t < T_IMP) {
      P = pose('jump', t); P.armL = [-60, -210]; P.armR = [60, -210]; P.legL = [-30, 195]; P.legR = [30, 195];
      squash = -0.38; eyes = 'x'; mouth = 'open';
    } else {
      squash = di < 0.1 ? 0.62 : 0.62 * wobble(di - 0.1, 3.2, 5) ;
      P = pose('cheer', t); P.armL = [-170 - squash * 60, -150 + squash * 200]; P.armR = [170 + squash * 60, -150 + squash * 200];
      eyes = di < 0.25 ? 'x' : 'star'; mouth = 'grin';
    }
    if (!sil) blobShadow(ctx, gx, gy + 4, (230 * sc) / (1 + my * 0.25), (64 * sc) / (1 + my * 0.25), 0.4 / (1 + my * 0.4));
    drawMascot(ctx, {
      x: fx, y: fy, s: sc * (sil ? 1.35 : 1), t, P, squash, rot, eyes, mouth, look: P.look, sticker: !sil,
      style: sil ? 'silhouette' : 'flat', colors: sil ? { ink: SCH[1] } : undefined,
    });

    // ---------- impact debris + cracks ----------
    if (di > 0) {
      if (!sil) paperBurst(ctx, gx, gy, di, 40, 13, [P1.red, P1.orange, P1.ink, P1.cream], 1500, 1600, 26);
      const grow = clamp(di / 0.06);
      ctx.save(); ctx.translate(gx, gy - 40); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      for (const pass of [0, 1]) {
        ctx.strokeStyle = sil ? SCH[2] : pass ? '#FFFFFF' : 'rgba(31,42,85,0.75)';
        ctx.lineWidth = pass ? 4 : 10;
        for (const c of R.cracks) {
          const n = Math.max(1, Math.floor(c.pts.length * clamp(grow - c.d * 10)));
          ctx.beginPath(); ctx.moveTo(c.pts[0][0], c.pts[0][1]);
          for (let i = 1; i <= n && i < c.pts.length; i++) ctx.lineTo(c.pts[i][0], c.pts[i][1]);
          ctx.stroke();
        }
      }
      ctx.restore();
      // shock ring
      if (!sil) {
        const rr = 60 + di * 2600;
        ctx.save(); ctx.globalAlpha = clamp(1 - di * 2.5); ctx.strokeStyle = P1.cream; ctx.lineWidth = 34 * (1 - clamp(di * 2.5));
        ctx.beginPath(); ctx.ellipse(gx, gy, rr, rr * 0.36, 0, 0, TAU); ctx.stroke(); ctx.restore();
      }
    }

    // ---------- "HIT!" sound-effect type ----------
    if (t >= T_HIT - 0.02 && t < T_LAUNCH + 0.15) {
      const d = t - T_HIT + 0.02, k = ease.outBack(clamp(d / 0.1), 2.5);
      ctx.save(); ctx.translate(clamp(fx - 520 * sc, 300, 1500), clamp(fy - 330 * sc, 260, 800)); ctx.rotate(-0.12); ctx.scale(k, k);
      ctx.globalAlpha = clamp((T_LAUNCH + 0.15 - t) / 0.1);
      printType(ctx, 'HIT', 0, 0, 230, { family: 'Anton', fill: P1.red, shadow: P1.ink, off: 0.05, stroke: P1.cream, strokeW: 16 });
      ctx.restore();
    }

    // ---------- fx ----------
    if (sil) { E.fx.shake = 26; E.fx.zoom += 0.08 - impactFrame * 0.02; E.fx.grain = 0.08; }
    else if (di > 0) { E.fx.shake = 22 * Math.exp(-di * 5); E.fx.rgb = 10 * Math.exp(-di * 6); E.fx.zoom += 0.05 * Math.exp(-di * 8); }
    else {
      const tension = clamp((t - T_LAUNCH) / 0.5);
      E.fx.shake = (t < T_HIT + 0.1 && t >= T_HIT ? 9 : 0) + tension * 3 * (0.5 + A.env('snare', t));
      if (t > T_DIVE) { E.fx.radialBlur = 0.6; E.fx.center = [ex / W, 1 - ey / H]; }
    }
    if (di >= 0 && di < 0.034) E.fx.flash = [1, 1, 1, 0.0];
  },
};
