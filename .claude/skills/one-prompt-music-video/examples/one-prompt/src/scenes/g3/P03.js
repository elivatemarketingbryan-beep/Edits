// P03 — "No credits, no crew," — Empty end credits.
// A cinema: the end-credit roll runs on a tilted screen (2D perspective projection per row, speed-ramped
// roll with motion-blur ghosts). The only viewer is CURSOR (back-lit silhouette) among empty seats.
// "credits" → a red NO CREDITS rubber stamp slams onto the roll and jams it (spring recoil); "crew" → NO CREW.
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, hash, noise2, buf, bctx, font, roundRect, wobble } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { drawMascot, pose } from '../../core/mascot.js';
import { grunge } from './_g3.js';

const S = shot('P03');
const T_STAMP1 = 33.93, T_STAMP2 = 35.46, T_WHIP = 35.93;

// ---- credit rows (page coordinates, y grows downward) ----
const ROWS = [];
let yy = 0;
const add = (r, gap = 112) => { ROWS.push({ ...r, y: yy }); yy += gap; };
add({ kind: 'end', text: 'The End' }, 330);
add({ kind: 'title', text: 'ONE PROMPT' }, 120);
add({ kind: 'sub', text: 'a film written in code' }, 170);
add({ kind: 'row', l: 'DIRECTED BY', r: '—' });
add({ kind: 'row', l: 'PRODUCER', r: '—' });
add({ kind: 'row', l: 'EXECUTIVE PRODUCER', r: '—' });
add({ kind: 'row', l: 'SCREENPLAY', r: '—' });
add({ kind: 'row', l: 'DIRECTOR OF PHOTOGRAPHY', r: '—' });
add({ kind: 'row', l: 'EDITOR', r: '—' });
add({ kind: 'row', l: 'GAFFER', r: '—' });
add({ kind: 'row', l: 'CREW', r: '0', hot: true });
add({ kind: 'row', l: 'BUDGET', r: '$0.00', hot: true });
add({ kind: 'row', l: 'RENDER FARM', r: 'one laptop', hot: true });
add({ kind: 'row', l: 'CATERING', r: 'none' });
add({ kind: 'row', l: 'STUNTS', r: 'none' }, 170);
add({ kind: 'sub', text: 'starring' }, 110);
add({ kind: 'title', text: 'CURSOR' }, 130);
add({ kind: 'sub', text: '& Claude' }, 200);
const rowY = (l) => ROWS.find((r) => r.l === l || r.text === l).y;

// scroll keys (page y at screen centre)
const Y1 = (rowY('DIRECTED BY') + rowY('PRODUCER')) / 2 + 10;
const Y0 = -40;
const Y2 = rowY('BUDGET') - 20;
const Y3 = rowY('CURSOR') + 40;

function springStop(v, tau) { // displacement after an instant stop at velocity v (px/s)
  if (tau <= 0) return 0;
  const w = TAU * 4.2, z = 0.42;
  return (v / w) * Math.exp(-z * w * tau) * Math.sin(w * Math.sqrt(1 - z * z) * tau);
}
function scroll(t) {
  const dA = T_STAMP1 - S.start, v1 = 2 * (Y1 - Y0) / dA;
  if (t < T_STAMP1) { const k = (t - S.start) / dA; return Y0 + (Y1 - Y0) * k * k; }
  const creep1 = 26 * (t - T_STAMP1);
  const tB0 = 34.86;
  if (t < tB0) return Y1 + springStop(v1, t - T_STAMP1) + creep1;
  const yB0 = Y1 + 26 * (tB0 - T_STAMP1);
  const dB = T_STAMP2 - tB0, vEnd = 2 * (Y2 - yB0) / dB;
  if (t < T_STAMP2) { const k = (t - tB0) / dB; return yB0 + (Y2 - yB0) * k * k; }
  const y2 = Y2 + springStop(vEnd, t - T_STAMP2) + 22 * (t - T_STAMP2);
  if (t < T_WHIP) return y2;
  const k = (t - T_WHIP) / (S.end - T_WHIP);
  return y2 + (Y3 - Y2) * ease.inCubic(k);
}

// ---- stamp sprites ----
function stampCanvas(key, text) {
  const c = buf('P03-stamp-' + key, 1180, 330), x = bctx(c);
  if (c._done) return c;
  x.clearRect(0, 0, c.width, c.height);
  x.strokeStyle = '#E8343F'; x.fillStyle = '#E8343F';
  x.lineWidth = 18; roundRect(x, 14, 14, 1152, 302, 34); x.stroke();
  x.lineWidth = 6; roundRect(x, 40, 40, 1100, 250, 20); x.stroke();
  x.font = '400 150px "Rubik Mono One"'; x.textAlign = 'center'; x.textBaseline = 'middle';
  const m = x.measureText(text).width; const sc = Math.min(1, 1000 / m);
  x.save(); x.translate(590, 172); x.scale(sc, 1); x.fillText(text, 0, 0); x.restore();
  // grunge: knock holes out
  x.globalCompositeOperation = 'destination-out';
  x.drawImage(grunge(key, 1180, 330, key === 'a' ? 3 : 8, 1.1), 0, 0);
  x.globalCompositeOperation = 'source-over';
  c._done = true; return c;
}

// project page-space y (relative to screen centre) through a tilted screen
function proj(v, th) {
  const D = 1500, z = D - v * Math.sin(th);
  return { sc: D / z, y: (D * v * Math.cos(th)) / z };
}

export default {
  ...S,
  cutIn: 'none',
  sfx: [{ t: S.start, type: 'click', gain: 0.5 }, { t: T_STAMP1, type: 'stamp', gain: 1 }, { t: T_STAMP2, type: 'stamp', gain: 1 }, { t: T_WHIP + 0.05, type: 'whoosh', gain: 0.7 }],
  draw(ctx, t, s, E) {
    const lt = s.lt, frame = E.frame;
    const hit1 = t - T_STAMP1, hit2 = t - T_STAMP2;
    const jolt = (hit1 >= 0 ? wobble(hit1, 5, 6) : 0) + (hit2 >= 0 ? wobble(hit2, 5, 6) : 0);
    const camX = Math.sin(t * 1.3) * 16, push = 1 + lt * 0.018 + ease.inQuad(clamp((t - T_WHIP) / 0.25)) * 0.05;

    // ---------- cinema background: deep blue + projector beam + dust ----------
    const g = ctx.createRadialGradient(W / 2, H * 0.42, 50, W / 2, H * 0.5, 1250);
    g.addColorStop(0, '#2C5FC7'); g.addColorStop(0.45, '#183A8E'); g.addColorStop(1, '#0A1240');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const flick = 0.85 + 0.15 * hash(frame, 5);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 7; i++) {
      const a0 = -0.42 + i * 0.12 + Math.sin(t * 0.7 + i) * 0.015;
      const bg = ctx.createLinearGradient(W / 2, -260, W / 2, H);
      bg.addColorStop(0, `rgba(150,200,255,${0.11 * flick})`); bg.addColorStop(1, 'rgba(150,200,255,0)');
      ctx.fillStyle = bg; ctx.beginPath(); ctx.moveTo(W / 2 + camX * 0.3, -260);
      ctx.lineTo(W / 2 + Math.tan(a0) * 1400, H + 100); ctx.lineTo(W / 2 + Math.tan(a0 + 0.05 + hash(i, 4) * 0.04) * 1400, H + 100); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = 'rgba(210,230,255,0.55)';
    for (let i = 0; i < 70; i++) {
      const x = W * hash(i, 1) + noise2(i * 3.1, t * 0.4) * 120 + camX * 0.5;
      const y = H * hash(i, 2) + noise2(i * 7.3, t * 0.35 + 4) * 120 - lt * 20;
      const r = 1 + 2.2 * hash(i, 3);
      ctx.globalAlpha = 0.25 + 0.6 * Math.abs(noise2(i, t * 2));
      ctx.beginPath(); ctx.arc(((x % W) + W) % W, ((y % H) + H) % H, r, 0, TAU); ctx.fill();
    }
    ctx.restore(); ctx.globalAlpha = 1;

    // ---------- the credit roll on the tilted screen ----------
    const th = 0.36 + jolt * 0.07;
    const Y = scroll(t), vel = (scroll(t + 1 / 120) - scroll(t - 1 / 120)) * 60; // px/s
    const blurL = Math.min(260, Math.abs(vel) / 30 * 0.7);
    const nGhost = clamp(Math.ceil(blurL / 10), 1, 9);
    const cx = W / 2 + camX * 0.5, cy = H * 0.47 - 10;
    const weave = (hash(frame, 77) - 0.5) * 2.2;
    ctx.save();
    ctx.translate(W / 2, H / 2); ctx.rotate(Math.sin(t * 0.8) * 0.012 + jolt * 0.01); ctx.scale(push * (1 + jolt * 0.02), push * (1 + jolt * 0.02)); ctx.translate(-W / 2, -H / 2 + weave);

    const drawRow = (r, v, alpha) => {
      const p = proj(v, th);
      ctx.save(); ctx.translate(cx, cy + p.y); ctx.scale(p.sc, p.sc); ctx.globalAlpha = alpha;
      if (r.kind === 'end') {
        font(ctx, 190, 'Instrument Serif', '400', 'italic'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = '#FFFFFF'; ctx.fillText(r.text, 0, 0);
      } else if (r.kind === 'title') {
        ctx.letterSpacing = '18px'; font(ctx, 132, 'Instrument Serif'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = '#FFFFFF'; ctx.fillText(r.text, 0, 0);
      } else if (r.kind === 'sub') {
        ctx.letterSpacing = '2px'; font(ctx, 62, 'Instrument Serif', '400', 'italic'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = '#BFD6FF'; ctx.fillText(r.text, 0, 0);
      } else {
        const half = 600;
        ctx.letterSpacing = '7px'; font(ctx, 44, 'Bricolage Grotesque', '700'); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillStyle = '#EAF2FF'; ctx.fillText(r.l, -half, 0);
        const lw = ctx.measureText(r.l).width;
        ctx.letterSpacing = '0px'; font(ctx, r.hot ? 78 : 70, 'Instrument Serif', '400', 'italic'); ctx.textAlign = 'right';
        ctx.fillStyle = r.hot ? '#FFD23F' : '#FFFFFF'; ctx.fillText(r.r, half, 4);
        const rw = ctx.measureText(r.r).width;
        ctx.fillStyle = 'rgba(200,220,255,0.55)';
        for (let x = -half + lw + 26; x < half - rw - 22; x += 22) { ctx.beginPath(); ctx.arc(x, 14, 3.2, 0, TAU); ctx.fill(); }
      }
      ctx.restore();
    };
    for (const r of ROWS) {
      const v0 = r.y - Y;
      if (v0 < -1000 || v0 > 760) continue;
      const fade = clamp((v0 + 820) / 260) * clamp((700 - v0) / 160);
      if (fade <= 0) continue;
      if (nGhost === 1) drawRow(r, v0, fade);
      else for (let k = 0; k < nGhost; k++) drawRow(r, v0 + (k / (nGhost - 1) - 0.5) * blurL, fade * Math.min(1, 1.9 / nGhost));
    }
    ctx.letterSpacing = '0px';

    // ---------- stamps (anchored to the roll) ----------
    const stamp = (key, text, tHit, pageY, px, rot) => {
      const age = t - tHit;
      if (age < -0.1) return;
      const c = stampCanvas(key, text);
      const v = pageY - Y, p = proj(v, th);
      const k = clamp((age + 0.1) / 0.1);
      const drop = age < 0 ? lerp(3.2, 1, ease.inQuad(k)) : 1 + 0.07 * wobble(age, 7, 9);
      ctx.save(); ctx.translate(cx + px * p.sc, cy + p.y); ctx.scale(p.sc * drop, p.sc * drop); ctx.rotate(rot);
      ctx.globalAlpha = age < 0 ? k * 0.9 : 0.94;
      if (age >= 0) {
        ctx.fillStyle = '#E8343F';
        const g2 = ease.outExpo(age / 0.12);
        for (let i = 0; i < 16; i++) {
          const a = hash(i, key.charCodeAt(0)) * TAU, d = 560 + hash(i, 9) * 230, r = 5 + hash(i, 11) * 16;
          ctx.beginPath(); ctx.arc(Math.cos(a) * d * 0.98 * g2 * (0.6 + 0.4 * Math.abs(Math.cos(a))), Math.sin(a) * d * 0.33 * g2, r * g2, 0, TAU); ctx.fill();
        }
      }
      if (nGhost === 1) ctx.drawImage(c, -590, -165);
      else { const a0 = ctx.globalAlpha; for (let g = 0; g < nGhost; g++) { ctx.globalAlpha = a0 * Math.min(1, 1.9 / nGhost); ctx.drawImage(c, -590, -165 + (g / (nGhost - 1) - 0.5) * blurL / p.sc); } }
      ctx.restore();
    };
    stamp('a', 'NO CREDITS', T_STAMP1, Y1 - 6, 40, -0.13);
    stamp('b', 'NO CREW', T_STAMP2, rowY('CREW') - 4, 150, 0.085);
    ctx.restore();

    // ---------- the theatre: CURSOR alone among empty seats ----------
    const seatShift = Math.sin(t * 1.3) * 34;
    const mx = W / 2 + 30 + seatShift * 1.1;
    if (hit2 < -0.06) {
      // back view: dark silhouette with a blue rim from the screen
      let P = pose('idle', t);
      if (hit1 >= 0 && hit1 < 0.5) { P = pose('jump', t); P.squash = -0.14 * Math.exp(-hit1 * 6); }
      const my = 1160 - (hit1 >= 0 && hit1 < 0.45 ? Math.sin(clamp(hit1 / 0.45) * Math.PI) * 70 : 0);
      drawMascot(ctx, { x: mx, y: my - 6, s: 1.5, t, P, style: 'silhouette', colors: { ink: '#86B2FF' }, alpha: 0.7, glyph: false });
      drawMascot(ctx, { x: mx, y: my, s: 1.47, t, P, style: 'silhouette', colors: { ink: '#070C2C' }, glyph: false });
    } else {
      // turns round to the camera and shrugs: "no crew"
      const age = Math.max(0, hit2 + 0.06);
      const P = pose('shrug', t); const wb = wobble(age, 3, 4);
      P.armL = [-185, -60 - 16 * wb]; P.armR = [185, -60 - 16 * wb]; P.look = [0, 0.15];
      const c = buf('P03-cur', 760, 760), b = bctx(c);
      b.clearRect(0, 0, 760, 760);
      drawMascot(b, { x: 380, y: 740, s: 1.47, t, P, mouth: 'flat', eyes: 'normal', blink: 0, squash: 0.1 * wobble(age, 4, 6) });
      b.globalCompositeOperation = 'source-atop'; b.fillStyle = 'rgba(16,30,110,0.5)'; b.fillRect(0, 0, 760, 760);
      const gl = b.createLinearGradient(0, 0, 0, 760); gl.addColorStop(0, 'rgba(140,190,255,0.35)'); gl.addColorStop(0.5, 'rgba(140,190,255,0)');
      b.fillStyle = gl; b.fillRect(0, 0, 760, 760); b.globalCompositeOperation = 'source-over';
      ctx.drawImage(c, mx - 380, 1160 - 740 - 6 * Math.exp(-age * 8));
    }
    for (let i = -6; i <= 6; i++) {
      const x = W / 2 + i * 236 + seatShift * 1.25, yTop = 968 - 26 * Math.cos(i * 0.22) + Math.pow(i / 6, 2) * -30;
      ctx.fillStyle = '#060A24'; roundRect(ctx, x - 104, yTop, 208, 220, 44); ctx.fill();
      ctx.strokeStyle = 'rgba(130,175,255,0.42)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x - 80, yTop + 2); ctx.lineTo(x + 80, yTop + 2); ctx.stroke();
    }
    ctx.fillStyle = '#060A24'; ctx.fillRect(0, 1050, W, 40);

    // ---------- film finish: light leak + scratches ----------
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const lk = ctx.createRadialGradient(-80, H * 0.35, 0, -80, H * 0.35, 760);
    lk.addColorStop(0, `rgba(255,120,40,${0.22 + 0.1 * Math.sin(t * 5)})`); lk.addColorStop(1, 'rgba(255,120,40,0)');
    ctx.fillStyle = lk; ctx.fillRect(0, 0, W, H);
    ctx.restore();
    ctx.strokeStyle = 'rgba(220,235,255,0.25)'; ctx.lineWidth = 1.5;
    for (let i = 0; i < 2; i++) if (hash(frame, i + 40) < 0.6) { const x = hash(frame, i + 50) * W; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + (hash(frame, i + 60) - 0.5) * 30, H); ctx.stroke(); }

    const k1 = hit1 >= 0 ? Math.exp(-hit1 / 0.12) : 0, k2 = hit2 >= 0 ? Math.exp(-hit2 / 0.12) : 0;
    E.fx.shake = 30 * (k1 + k2);
    E.fx.rgb = 7 * (k1 + k2) + clamp((t - T_WHIP) / 0.25) * 6;
    E.fx.zoom = 0.035 * (k1 + k2);
    E.fx.flash = [1, 0.85, 0.85, 0.22 * (k1 + k2)];
    E.fx.vignette = 0.55; E.fx.grain = 0.075;
    // projector kicks in: 2-frame flicker on the cut
    const cf = Math.round(lt * 30);
    if (cf === 0) E.fx.flash = [0, 0, 0, 0.75]; else if (cf === 1) E.fx.flash = [0.85, 0.92, 1, 0.45]; else if (cf === 2) E.fx.flash = [0, 0, 0, 0.3];
  },
};
