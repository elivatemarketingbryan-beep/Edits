// G05 — "no catch," — a fishing line (40-point verlet rope, weighted end, 24 constraint iterations) lowers a
// hook baited with a shiny $ coin. CURSOR works a pair of giant chrome scissors: SNIP on "catch" — the rope
// constraint at the blade crossing is deleted, the bait tumbles away, the line whips back up, and the word
// CATCH is sliced in half along the same cut.
import { shot } from '../../shots.js';
import { W, H, TAU, ease, seg, clamp, lerp, hash, sim, font, roundRect, star, buf, bctx } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { drawMascot } from '../../core/mascot.js';
import { goldGrad, chromeGrad } from './kit.js';

const S = shot('G05');
const T_NO = 83.3, T_CATCH = 83.5, T_SNIP = 83.66, NP = 40, SEGL = 14, DT = 1 / 120, GRAV = 2600;
const ROPEX = 1000, SROT = 0.436, SSC = 1.25;          // rope column, scissor tilt (25°) and scale
const PIV = [1400, 430];
const YC = PIV[1] - (PIV[0] - ROPEX) * Math.tan(SROT); // where the blade line crosses the rope

function anchor(t) {
  const d = ease.outCubic(seg(t, S.start, S.start + 0.28));
  let y = lerp(-620, -30, d), x = ROPEX;
  if (t > T_SNIP) y -= 1400 * ease.inQuad(seg(t, T_SNIP + 0.02, T_SNIP + 0.6));
  return [x + Math.sin((t - S.start) * 3.0) * 26, y];
}
function initRope() {
  const p = new Float32Array(NP * 2), q = new Float32Array(NP * 2), [ax, ay] = anchor(S.start);
  for (let i = 0; i < NP; i++) { p[i * 2] = ax - i * 0.8; p[i * 2 + 1] = ay + i * SEGL * 0.99; }
  q.set(p);
  return { p, q, cut: -1, time: S.start };
}
function stepRope(st) {
  st.time += DT; const t = st.time, { p, q } = st;
  if (st.cut < 0 && t >= T_SNIP) { // cut where the rope crosses the blade line
    let best = 1, bd = 1e9; for (let i = 1; i < NP - 1; i++) { const d = Math.abs(p[i * 2 + 1] - YC); if (d < bd) { bd = d; best = i; } } st.cut = best;
  }
  // lower the whole rig kinematically (a rope lowered faster than free-fall would just fold up)
  if (t < T_SNIP) { const dy = anchor(t)[1] - anchor(t - DT)[1]; for (let i = 1; i < NP; i++) { p[i * 2 + 1] += dy; q[i * 2 + 1] += dy; } }
  for (let i = 1; i < NP; i++) {
    const b = i * 2, vx = (p[b] - q[b]) * 0.995, vy = (p[b + 1] - q[b + 1]) * 0.995;
    q[b] = p[b]; q[b + 1] = p[b + 1];
    p[b] += vx; p[b + 1] += vy + (t > T_SNIP ? 4200 : GRAV) * DT * DT;
  }
  const [ax, ay] = anchor(t);
  for (let it = 0; it < 24; it++) {
    p[0] = ax; p[1] = ay;
    for (let i = 0; i < NP - 1; i++) {
      if (i === st.cut) continue;
      const a = i * 2, c = a + 2, dx = p[c] - p[a], dy = p[c + 1] - p[a + 1], d = Math.hypot(dx, dy) || 1e-6;
      const wa = i === 0 ? 0 : 1, wc = i + 1 === NP - 1 ? 0.25 : 1, ws = wa + wc; if (!ws) continue;
      const k = (d - SEGL) / d / ws;
      p[a] += dx * k * wa; p[a + 1] += dy * k * wa; p[c] -= dx * k * wc; p[c + 1] -= dy * k * wc;
    }
  }
  // the bait gets a spin kick when released
  if (st.cut >= 0 && !st.kicked) { st.kicked = true; const b = (NP - 1) * 2; q[b] += 4; q[b + 1] -= 7; }
}

function drawHook(x, px, py, ang, spin, t) {
  x.save(); x.translate(px, py); x.rotate(ang); x.scale(1.45, 1.45);
  // shank down the rope direction (+y local), J-bend and barb
  x.lineCap = 'round'; x.lineJoin = 'round';
  const path = () => { x.beginPath(); x.moveTo(0, -6); x.lineTo(0, 92); x.arc(-34, 92, 34, 0, Math.PI, false); x.lineTo(-68, 64); };
  path(); x.strokeStyle = '#111'; x.lineWidth = 19; x.stroke();
  path(); x.strokeStyle = chromeGrad(x, -10, 130); x.lineWidth = 11; x.stroke();
  x.beginPath(); x.moveTo(-68, 60); x.lineTo(-56, 80); x.lineTo(-74, 76); x.closePath(); x.fillStyle = '#DDE3EE'; x.fill(); x.lineWidth = 4; x.strokeStyle = '#111'; x.stroke();
  x.beginPath(); x.arc(0, -10, 9, 0, TAU); x.lineWidth = 7; x.strokeStyle = '#111'; x.stroke(); x.lineWidth = 3; x.strokeStyle = '#DDE3EE'; x.stroke();
  // the $ coin skewered on the bend (spins on the hook)
  x.save(); x.translate(-40, 142); const sx = Math.cos(spin);
  x.scale(Math.max(0.12, Math.abs(sx)), 1);
  x.beginPath(); x.arc(0, 0, 54, 0, TAU); x.fillStyle = '#111'; x.fill();
  x.beginPath(); x.arc(0, 0, 47, 0, TAU); x.fillStyle = goldGrad(x, -50, 50, -40, 40); x.fill();
  x.beginPath(); x.arc(0, 0, 37, 0, TAU); x.lineWidth = 3; x.strokeStyle = '#9A6400'; x.stroke();
  if (sx > 0) { font(x, 56, 'Bungee'); x.fillStyle = '#9A6400'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('$', 0, 4); }
  x.beginPath(); x.arc(0, -40, 7, 0, TAU); x.fillStyle = '#5A3A00'; x.fill();
  x.restore();
  // glint
  const g = 0.5 + 0.5 * Math.sin(t * 9);
  star(x, -14, 120, 18 * g + 6, 4, 4, t * 3); x.fillStyle = '#FFFFFF'; x.fill();
  x.restore();
}

function drawScissors(x, px, py, open, sc, rot = 0) {
  x.save(); x.translate(px, py); x.rotate(rot); x.scale(sc, sc);
  const blade = (dir) => {
    x.save(); x.rotate(dir * open);
    x.beginPath(); x.moveTo(30, 0); x.lineTo(-440, dir * 4); x.quadraticCurveTo(-300, dir * 52, 20, dir * 46); x.closePath();
    x.fillStyle = '#111'; x.save(); x.translate(10, 12); x.fill(); x.restore();
    x.fillStyle = chromeGrad(x, -40, 50); x.fill(); x.lineWidth = 8; x.strokeStyle = '#111'; x.stroke();
    x.strokeStyle = 'rgba(255,255,255,0.9)'; x.lineWidth = 4; x.beginPath(); x.moveTo(-400, dir * 8); x.lineTo(0, dir * 10); x.stroke();
    // handle ring
    x.beginPath(); x.ellipse(120, -dir * 58, 78, 50, -dir * 0.35, 0, TAU); x.lineWidth = 34; x.strokeStyle = '#111'; x.stroke(); x.lineWidth = 22; x.strokeStyle = dir > 0 ? '#FF6A1F' : '#FFC300'; x.stroke();
    x.beginPath(); x.moveTo(20, 0); x.lineTo(70, -dir * 30); x.lineWidth = 30; x.strokeStyle = '#111'; x.stroke(); x.lineWidth = 18; x.strokeStyle = dir > 0 ? '#FF6A1F' : '#FFC300'; x.stroke();
    x.restore();
  };
  blade(-1); blade(1);
  x.beginPath(); x.arc(0, 0, 20, 0, TAU); x.fillStyle = '#DDE3EE'; x.fill(); x.lineWidth = 7; x.strokeStyle = '#111'; x.stroke();
  x.beginPath(); x.moveTo(-9, 0); x.lineTo(9, 0); x.lineWidth = 4; x.stroke();
  x.restore();
}

let TXT = null;
function textBuf() {
  const c = buf('G05-txt', 1900, 480), x = bctx(c);
  x.clearRect(0, 0, 1900, 480); font(x, 360, 'Anton'); x.textAlign = 'center'; x.textBaseline = 'middle';
  x.lineJoin = 'round';
  x.fillStyle = '#7A4B00'; x.fillText('CATCH', 950 + 14, 250 + 16);
  x.lineWidth = 16; x.strokeStyle = '#111'; x.strokeText('CATCH', 950, 250); x.fillStyle = '#111'; x.fillText('CATCH', 950, 250);
  x.fillStyle = '#FFF4D6'; x.fillText('CATCH', 950, 250);
  x.lineWidth = 8; x.strokeStyle = '#111'; x.strokeText('CATCH', 950, 250);
  return c;
}

export default {
  ...S,
  cutIn: 'punch',
  sfx: [{ t: T_SNIP, type: 'click', gain: 1 }, { t: T_SNIP + 0.01, type: 'rip', gain: 0.5 }],
  draw(ctx, t, s, E) {
    if (!TXT) TXT = textBuf();
    const lt = s.lt;
    // background: gold with moving cream barber stripes
    ctx.fillStyle = '#FFC300'; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate((lt * 220) % 160, 0); ctx.fillStyle = '#FFD84A';
    for (let i = -20; i < 30; i++) { ctx.beginPath(); ctx.moveTo(i * 160, 0); ctx.lineTo(i * 160 + 80, 0); ctx.lineTo(i * 160 + 80 - 600, H); ctx.lineTo(i * 160 - 600, H); ctx.fill(); }
    ctx.restore();
    const snipH = t >= T_SNIP ? Math.exp(-(t - T_SNIP) / 0.12) : 0;

    // ---- NO / CATCH stacked on the left; CATCH gets sliced along the scissor angle ----
    const nk = ease.outBack(seg(t, T_NO, T_NO + 0.18), 2);
    if (nk > 0) {
      ctx.save(); ctx.translate(430, 400); ctx.scale(nk, nk); ctx.rotate(-0.05);
      font(ctx, 300, 'Anton'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
      ctx.fillStyle = '#7A4B00'; ctx.fillText('NO', 14, 16); ctx.lineWidth = 16; ctx.strokeStyle = '#111'; ctx.strokeText('NO', 0, 0); ctx.fillStyle = '#111'; ctx.fillText('NO', 0, 0);
      ctx.restore();
    }
    const ck = ease.outBack(seg(t, T_CATCH, T_CATCH + 0.14), 2.2);
    if (ck > 0) {
      const cx = 450, cy = 700, sc = 0.78 * ck;
      const fall = t >= T_SNIP ? ease.outCubic(seg(t, T_SNIP, T_SNIP + 0.32)) : 0;
      const cut = (side) => { // half-plane clip along a line through the buffer centre at the blade angle
        const a = -SROT, L = 3000, nx = -Math.sin(a), ny = Math.cos(a);
        ctx.beginPath(); ctx.moveTo(950 - Math.cos(a) * L, 250 - Math.sin(a) * L); ctx.lineTo(950 + Math.cos(a) * L, 250 + Math.sin(a) * L);
        ctx.lineTo(950 + Math.cos(a) * L + nx * L * side, 250 + Math.sin(a) * L + ny * L * side); ctx.lineTo(950 - Math.cos(a) * L + nx * L * side, 250 - Math.sin(a) * L + ny * L * side); ctx.closePath(); ctx.clip();
      };
      ctx.save(); ctx.translate(cx, cy); ctx.scale(sc, sc); ctx.translate(-950, -250); cut(-1); ctx.drawImage(TXT, -fall * 8, -fall * 6); ctx.restore();
      ctx.save(); ctx.translate(cx + fall * 30, cy + fall * 52); ctx.rotate(fall * 0.05); ctx.scale(sc, sc); ctx.translate(-950, -250); cut(1); ctx.drawImage(TXT, 0, 0); ctx.restore();
      if (fall > 0 && fall < 1) { ctx.save(); ctx.translate(cx, cy); ctx.rotate(-SROT); ctx.globalAlpha = 1 - fall; ctx.fillStyle = '#FFFFFF'; ctx.fillRect(-520, -3, 1040, 6); ctx.restore(); }
    }

    // ---- rope + bait ----
    const st = sim('G05rope', Math.floor((t - S.start) / DT), initRope, stepRope);
    const p = st.p;
    const strokeRope = (from, to) => {
      for (const [w, col] of [[10, '#111'], [4, '#FFFFFF']]) {
        ctx.beginPath(); ctx.moveTo(p[from * 2], p[from * 2 + 1]);
        for (let i = from + 1; i <= to; i++) ctx.lineTo(p[i * 2], p[i * 2 + 1]);
        ctx.lineWidth = w; ctx.strokeStyle = col; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke();
      }
    };
    if (st.cut < 0) strokeRope(0, NP - 1); else { strokeRope(0, st.cut); strokeRope(st.cut + 1, NP - 1); }
    const e = NP - 1, ex = p[e * 2], ey = p[e * 2 + 1], dx = ex - p[(e - 1) * 2], dy = ey - p[(e - 1) * 2 + 1];
    drawHook(ctx, ex, ey, Math.atan2(dy, dx) - Math.PI / 2, t * 7, t);

    // ---- tilted scissors worked by CURSOR ----
    const inK = ease.outExpo(seg(t, S.start + 0.04, S.start + 0.3));
    const outK = ease.inBack(seg(t, T_SNIP + 0.34, T_SNIP + 0.62));
    const px = lerp(2500, PIV[0], inK) + outK * 1100, py = PIV[1] + (1 - inK) * 300;
    const open = t < T_SNIP - 0.07 ? 0.24 + Math.sin(t * 16) * 0.05 : t < T_SNIP ? lerp(0.24, 0, ease.inQuad(seg(t, T_SNIP - 0.07, T_SNIP))) : 0.02 + 0.3 * ease.outCubic(seg(t, T_SNIP + 0.15, T_SNIP + 0.4));
    drawScissors(ctx, px, py, open, SSC, SROT);
    const hx = px + Math.cos(SROT) * 150 * SSC, hy = py + Math.sin(SROT) * 150 * SSC;
    const cxM = 1770 + outK * 900, cyM = 925, ms = 1.0;
    const loc = (X, Y) => [(X - cxM) / ms, (Y - cyM) / ms + 185];
    const P = { armL: loc(hx - 20, hy - 30), armR: loc(hx + 20, hy + 34), legL: [-46, 185], legR: [46, 185], squash: snipH * 0.18, rot: -0.04 - snipH * 0.1, bob: 0, look: [-1, -0.5], lean: -0.1 };
    drawMascot(ctx, { x: cxM, y: cyM, s: ms, t, P, eyes: t >= T_SNIP && t < T_SNIP + 0.55 ? 'wink' : 'normal', mouth: t >= T_SNIP ? 'grin' : 'flat', sticker: true });

    // dashed cut guide + snip burst
    if (t > T_CATCH - 0.06 && t < T_SNIP) {
      ctx.save(); ctx.translate(ROPEX, YC); ctx.rotate(SROT); ctx.setLineDash([22, 16]); ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(17,17,17,0.75)';
      ctx.beginPath(); ctx.moveTo(-260, 0); ctx.lineTo(120, 0); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
    }
    if (t >= T_SNIP && t < T_SNIP + 0.32) {
      const k = (t - T_SNIP) / 0.32, cxp = st.cut >= 0 ? p[st.cut * 2] : ROPEX;
      ctx.save(); ctx.translate(cxp, YC); ctx.globalAlpha = 1 - k;
      star(ctx, 0, 0, 130 * (0.4 + k), 32 * (0.4 + k), 10, 0.3); ctx.fillStyle = '#FFFFFF'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = '#111'; ctx.stroke();
      font(ctx, 72, 'Bungee'); ctx.fillStyle = '#111'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('SNIP!', 0, -140 - k * 50);
      ctx.restore();
    }

    E.fx.shake = snipH * 22 + A.pulse('beat', t, 0.1) * 4; E.fx.zoom += snipH * 0.05; E.fx.rgb = 2 + snipH * 10;
    if (t >= T_SNIP && t < T_SNIP + 0.05) E.fx.flash = [1, 1, 1, 0.45];
    E.fx.vignette = 0.25;
  },
};
