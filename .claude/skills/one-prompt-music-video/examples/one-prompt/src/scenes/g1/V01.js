// V01 — "Typed one line in the terminal," — CURSOR hops key to key on a giant Three.js keyboard,
// one hop per sung syllable; every landing stomps a key, the word's other keys ghost-type, and the
// letters fly up into a terminal bar. "ter-mi-nal" = three stomps that send ripples through the board.
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, font, roundRect, wobble } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { drawMascot, pose } from '../../core/mascot.js';
import { THREE, render3d } from '../../core/three.js';
import { P1, paper, toScreen, pressCurve, blobShadow, printType, paperBurst, warm, paperTex } from './util.js';
import { buildKeyboard, studio, KEY_TOP } from './kb.js';

const S = shot('V01');

// one landing per sung syllable (from the vocal envelope onsets)
const HOPS = [
  { t: 8.42, key: '4', seg: '' },          // virtual take-off pad (before the shot)
  { t: 8.76, key: 'T', seg: 'typed ', big: 'TYPED' },
  { t: 9.07, key: 'O', seg: 'one ', big: 'ONE' },
  { t: 9.29, key: 'L', seg: 'line ', big: 'LINE' },
  { t: 9.63, key: 'I', seg: 'in ', big: 'IN', flip: true },
  { t: 9.78, key: 'H', seg: 'the ', big: 'THE' },
  { t: 9.96, key: 'T', seg: 'ter', big: 'TER', wave: true },
  { t: 10.1, key: 'M', seg: 'mi', big: 'TERMI', wave: true },
  { t: 10.23, key: 'N', seg: 'nal', big: 'TERMINAL', wave: true },
];
const PREFIX = '> ';
let R = null;

function build() {
  const scene = new THREE.Scene();
  const kb = buildKeyboard();
  scene.add(kb.root);
  studio(scene, { ext: 13 });
  const camera = new THREE.PerspectiveCamera(30, W / H, 0.5, 200);
  const chars = [];
  for (let h = 1; h < HOPS.length; h++) {
    const hp = HOPS[h];
    [...hp.seg].forEach((ch, i) => chars.push({ t: hp.t + 0.012 + i * 0.034, ch, key: ch === ' ' ? 'SPACE' : ch.toUpperCase(), hop: h }));
  }
  const keyPress = new Map();
  const addPress = (label, t, amp) => { if (!keyPress.has(label)) keyPress.set(label, []); keyPress.get(label).push({ t, amp }); };
  for (let h = 1; h < HOPS.length; h++) addPress(HOPS[h].key, HOPS[h].t, 1);
  for (const c of chars) addPress(c.key, c.t, c.key === 'SPACE' ? 0.8 : 0.6);
  R = { scene, camera, kb, chars, keyPress };
}

function keyPos(label) { const k = R.kb.by(label); return [k.x, k.z]; }

/** mascot world position + air state at time t */
function mascotAt(t) {
  let i = 0; while (i < HOPS.length - 1 && HOPS[i + 1].t <= t) i++;
  const a = HOPS[i], b = HOPS[i + 1];
  const [ax, az] = keyPos(a.key);
  if (!b) return { x: ax, z: az, y: KEY_TOP, air: 0, land: t - a.t, i, dir: 0, spin: 0 };
  const [bx, bz] = keyPos(b.key);
  const take = a.t + Math.min(0.07, (b.t - a.t) * 0.3);
  if (t < take) return { x: ax, z: az, y: KEY_TOP, air: 0, land: t - a.t, i, dir: Math.sign(bx - ax), pre: (t - a.t) / (take - a.t), spin: 0 };
  const u = (t - take) / (b.t - take), d = Math.hypot(bx - ax, bz - az);
  const hgt = 0.55 + d * 0.2;
  return { x: lerp(ax, bx, u), z: lerp(az, bz, u), y: KEY_TOP + 4 * hgt * u * (1 - u), air: 1, u, i, dir: Math.sign(bx - ax), spin: b.flip ? ease.inOutCubic(u) * TAU * Math.sign(bx - ax || 1) : 0, land: -1 };
}

function camAt(t) {
  let sx = 0, sz = 0, n = 0;
  for (let k = 0; k < 10; k++) { const m = mascotAt(t - k * 0.04 + 0.12); sx += m.x; sz += m.z; n++; }
  return [sx / n, sz / n];
}

export default {
  ...S,
  cutIn: 'punch',
  sfx: [{ t: 8.76, type: 'click', gain: 0.8 }, { t: 9.96, type: 'click' }, { t: 10.23, type: 'impact', gain: 0.6 }],
  init() { paperTex(P1.paper, W, H, 3); build(); warm(R.scene, R.camera); },
  draw(ctx, t, s, E) {
    if (!R) build();
    const { scene, camera, kb } = R;
    const lt = s.lt;

    paper(ctx, P1.paper, 0, -lt * 40);
    const kick = A.pulse('kick', t, 0.12), snare = A.pulse('snare', t, 0.1);

    // ---------- keys: presses + ripple waves + beat bob ----------
    const waves = HOPS.filter((h) => h.wave && t >= h.t).map((h) => { const [x, z] = keyPos(h.key); return { x, z, d: t - h.t }; });
    for (const k of kb.keys) {
      let p = 0;
      const ev = R.keyPress.get(k.label);
      if (ev) for (const e of ev) p = Math.max(p, pressCurve(t - e.t) * e.amp);
      let lift = 0;
      for (const w of waves) {
        const dist = Math.hypot(k.x - w.x, (k.z - w.z) * 1.2), front = w.d * 26;
        lift += Math.exp(-((front - dist) ** 2) / 3.5) * Math.exp(-w.d * 2.2) * 0.75;
      }
      const bob = Math.sin(k.x * 0.7 - lt * 9) * 0.02 * snare;
      k.g.position.y = -p * 0.3 + lift + bob;
      k.g.rotation.x = lift * 0.25;
    }

    // ---------- camera ----------
    const [cx, cz] = camAt(t);
    const push = ease.inOutQuad(s.u);
    const dist = lerp(14.8, 12.6, push) - kick * 0.5;
    const el = lerp(0.62, 0.55, push), az = lerp(-0.3, -0.1, push) + Math.sin(lt * 1.3) * 0.03;
    const tx = cx * 0.8, tz = cz * 0.5;
    camera.position.set(tx + Math.sin(az) * Math.cos(el) * dist, Math.sin(el) * dist, tz + Math.cos(az) * Math.cos(el) * dist);
    camera.lookAt(tx, 0.2, tz - 0.6);
    camera.setViewOffset(W, H, 0, -H * 0.25, W, H);
    camera.updateMatrixWorld(); camera.updateProjectionMatrix();

    // ---------- big word pop (the sung word, huge) ----------
    let hi = 0; for (let h = 1; h < HOPS.length; h++) if (t >= HOPS[h].t - 0.02) hi = h;
    if (hi > 0) {
      const hp = HOPS[hi], d = t - hp.t + 0.02;
      const isTerm = hi >= 6;
      const k = ease.outBack(clamp(d / 0.12), 2.2);
      const size = isTerm ? 300 : 240;
      ctx.save(); ctx.translate(W / 2 + (isTerm ? 0 : (hi % 2 ? -1 : 1) * 330), 420);
      ctx.rotate((isTerm ? -0.03 : (hi % 2 ? -0.06 : 0.05)) * (1 - d * 0.5)); ctx.scale(k, k);
      printType(ctx, hp.big, 0, 0, size, { family: 'Anton', fill: isTerm ? P1.orange : P1.ink, shadow: isTerm ? P1.ink : P1.red, off: 0.045, stroke: P1.cream, strokeW: 16, maxW: 1500 });
      ctx.restore();
    }

    render3d(ctx, scene, camera);

    // ---------- mascot ----------
    const m = mascotAt(t);
    const [gx, gy] = toScreen(camera, m.x, KEY_TOP, m.z);
    const [fx, fy] = toScreen(camera, m.x, m.y, m.z);
    const [, hy] = toScreen(camera, m.x, m.y + 2.1, m.z);
    const sc = Math.abs(fy - hy) / 300;
    const air = m.y - KEY_TOP;
    blobShadow(ctx, gx, gy, (210 * sc) / (1 + air * 0.6), (60 * sc) / (1 + air * 0.6), 0.35 / (1 + air));
    const P = pose(m.air ? 'jump' : 'bounce', t);
    let squash = 0, rot = 0;
    if (m.air) {
      const v = 1 - 2 * m.u; squash = -0.18 * Math.abs(v);
      P.armL = [-150, -150 + m.u * 120]; P.armR = [150, -150 + m.u * 120]; P.legL = [-55, 160 - 30 * (1 - Math.abs(v))]; P.legR = [55, 160 - 30 * (1 - Math.abs(v))];
      rot = m.dir * 0.18 * v + m.spin;
    } else {
      const d = m.land; squash = d >= 0 ? 0.42 * wobble(d, 5, 9) : 0;
      if (m.pre !== undefined && m.pre > 0) squash = Math.max(squash, 0.25 * Math.sin(m.pre * Math.PI));
      P.armL = [-150, 30 - squash * 120]; P.armR = [150, 30 - squash * 120];
    }
    drawMascot(ctx, { x: fx, y: fy, s: sc, t, P, squash, rot, mouth: 'auto', look: [m.dir * 0.7, 0.5], sticker: true });

    // landing rings + paper bits
    for (let h = 1; h < HOPS.length; h++) {
      const d = t - HOPS[h].t; if (d < 0 || d > 0.6) continue;
      const [kx, kz] = keyPos(HOPS[h].key); const [px, py] = toScreen(camera, kx, KEY_TOP, kz);
      ctx.save(); ctx.strokeStyle = HOPS[h].wave ? P1.red : P1.ink; ctx.globalAlpha = clamp(1 - d * 2.4); ctx.lineWidth = 6 * (1 - d);
      ctx.beginPath(); ctx.ellipse(px, py, 40 + d * 520, (40 + d * 520) * 0.32, 0, 0, TAU); ctx.stroke(); ctx.restore();
      if (HOPS[h].wave) paperBurst(ctx, px, py - 10, d, 16, h * 7, [P1.red, P1.orange, P1.ink, '#fff'], 700, 2400, 16);
    }

    // ---------- flying glyphs: key → terminal bar ----------
    const barX = 250, barY = 168, barW = W - 500, barH = 104;
    font(ctx, 54, 'JetBrains Mono', '800');
    const cw = ctx.measureText('M').width;
    const full = PREFIX + 'typed one line in the terminal';
    const textX = W / 2 - (full.length * cw) / 2;
    const slotX = (i) => textX + (i + PREFIX.length) * cw + cw / 2;
    const slotY = barY + barH / 2 + 2;
    let shown = 0;
    R.chars.forEach((c, i) => {
      const d = t - c.t, fl = 0.16;
      if (d >= fl) { shown = i + 1; return; }
      if (d < 0 || c.ch === ' ') return;
      const [kx, kz] = keyPos(c.key); const [px, py] = toScreen(camera, kx, KEY_TOP + 0.2, kz);
      const u = ease.inQuad(d / fl);
      const x = lerp(px, slotX(i), u), y = lerp(py, slotY, u) - Math.sin(u * Math.PI) * 140;
      const sz = lerp(120, 54, u) * (0.6 + 0.4 * ease.outBack(clamp(d / 0.05)));
      font(ctx, sz, 'JetBrains Mono', '800'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 10; ctx.strokeStyle = P1.cream; ctx.lineJoin = 'round'; ctx.strokeText(c.ch, x, y);
      ctx.fillStyle = c.hop >= 6 ? P1.red : P1.ink; ctx.fillText(c.ch, x, y);
    });

    // ---------- terminal bar ----------
    const barIn = ease.outBack(clamp(lt / 0.3));
    ctx.save();
    ctx.translate(W / 2, barY + barH / 2); ctx.scale(lerp(0.6, 1, barIn), barIn); ctx.translate(-W / 2, -(barY + barH / 2));
    ctx.fillStyle = P1.red; roundRect(ctx, barX + 10, barY + 12, barW, barH, 26); ctx.fill();
    ctx.fillStyle = P1.ink; roundRect(ctx, barX, barY, barW, barH, 26); ctx.fill();
    [P1.red, P1.orange, P1.paper].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(barX + 38 + i * 30, barY + 24, 9, 0, TAU); ctx.fill(); });
    font(ctx, 54, 'JetBrains Mono', '800'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const str = PREFIX + R.chars.slice(0, shown).map((c) => c.ch).join('');
    for (let i = 0; i < str.length; i++) {
      const isTerm = i >= PREFIX.length + 'typed one line in the '.length;
      const c = R.chars[i - PREFIX.length];
      const pop = c ? 1 + 0.5 * Math.exp(-(t - c.t - 0.16) * 14) : 1;
      ctx.save(); ctx.translate(textX + i * cw + cw / 2, slotY); ctx.scale(pop, pop);
      ctx.fillStyle = i < 2 ? P1.orange : isTerm ? '#FFB27A' : P1.cream; ctx.fillText(str[i], 0, 0); ctx.restore();
    }
    if (Math.floor(lt * 5) % 2 === 0 || shown < R.chars.length) { ctx.fillStyle = P1.orange; ctx.fillRect(textX + str.length * cw + 4, slotY - 30, cw - 6, 60); }
    ctx.restore();

    // ---------- fx ----------
    const land = HOPS.slice(1).reduce((m2, h) => Math.max(m2, t >= h.t ? Math.exp(-(t - h.t) / 0.07) * (h.wave ? 1.6 : 1) : 0), 0);
    E.fx.shake = land * 7;
    E.fx.zoom += land * 0.012;
    E.fx.rgb = land * 2.5;
  },
};
