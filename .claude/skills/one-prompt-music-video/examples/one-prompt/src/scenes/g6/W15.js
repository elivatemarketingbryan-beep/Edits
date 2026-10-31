// W15 — "From a single little prompt in the middle of the night" — the one dark, gorgeous shot.
// CURSOR sits on a crescent moon typing a tiny glowing prompt; on "prompt" its characters lift off,
// fly into the sky and become the constellation "> one prompt" (stars are tiny glowing code glyphs).
// A shooting star crosses on "night".
import { shot } from '../../shots.js';
import { W, H, TAU, ease, seg, clamp, lerp, hash, fbm2, font, roundRect, buf, bctx } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { drawMascot, pose } from '../../core/mascot.js';
import { glowSprite } from './kit.js';

const S = shot('W15');
const T_TYPE = 74.66, T_LAUNCH = 75.06, T_PROMPT = 75.56, T_NIGHT = 76.82;
const PROMPT = '> one prompt';
const GLYPHS = ['·', '+', '*', '✦', '>', '_', '/', '{', '}', ';', '0', '1', '<', '=', '#', '~', '.'];

// single-stroke constellation alphabet (x-height units, y down: 0 = x-height top, 1 = baseline)
const LET = {
  '>': { w: 0.7, s: [[[0, 0.05], [0.7, 0.5], [0, 0.95]]] },
  'o': { w: 0.8, s: [[[0.4, 0], [0.8, 0.3], [0.75, 0.78], [0.4, 1], [0.05, 0.75], [0, 0.3], [0.4, 0]]] },
  'n': { w: 0.8, s: [[[0.05, 1], [0.05, 0]], [[0.05, 0.28], [0.4, 0], [0.78, 0.15], [0.8, 1]]] },
  'e': { w: 0.8, s: [[[0.05, 0.52], [0.8, 0.5], [0.7, 0.1], [0.38, 0], [0.06, 0.22], [0.02, 0.62], [0.3, 0.97], [0.65, 0.98], [0.82, 0.82]]] },
  'p': { w: 0.8, s: [[[0.05, 1.55], [0.05, 0]], [[0.05, 0.22], [0.42, 0], [0.8, 0.25], [0.78, 0.72], [0.42, 1], [0.05, 0.82]]] },
  'r': { w: 0.62, s: [[[0.05, 1], [0.05, 0]], [[0.05, 0.35], [0.33, 0.03], [0.62, 0.05]]] },
  'm': { w: 1.25, s: [[[0.05, 1], [0.05, 0]], [[0.05, 0.25], [0.3, 0], [0.62, 0.18], [0.62, 1]], [[0.62, 0.18], [0.92, 0], [1.2, 0.22], [1.22, 1]]] },
  't': { w: 0.6, s: [[[0.25, -0.55], [0.25, 0.82], [0.42, 1], [0.62, 0.92]], [[0, 0.02], [0.58, 0.02]]] },
  ' ': { w: 0.45, s: [] },
};
const XH = 112, GAP = 0.34, CX0 = 196, CY0 = 214; // constellation layout (sky space)

let C = null; // cached layout
function layout() {
  const letters = []; let x = 0;
  [...PROMPT].forEach((ch, i) => {
    const L = LET[ch];
    const strokes = L.s.map((st) => st.map(([u, v]) => [CX0 + (x + u) * XH, CY0 + v * XH]));
    const verts = []; for (const st of strokes) for (const p of st) if (!verts.some((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < 4)) verts.push(p);
    let len = 0; for (const st of strokes) for (let k = 1; k < st.length; k++) len += Math.hypot(st[k][0] - st[k - 1][0], st[k][1] - st[k - 1][1]);
    const cx = CX0 + (x + L.w / 2) * XH, cy = CY0 + 0.5 * XH;
    letters.push({ ch, i, strokes, verts, len, cx, cy });
    x += L.w + GAP;
  });
  // stars (3 parallax layers)
  const stars = [];
  for (let i = 0; i < 520; i++) {
    const layer = i < 330 ? 0 : i < 480 ? 1 : 2;
    stars.push({ x: hash(i, 1) * (W + 300) - 150, y: hash(i, 2) * (H + 160) - 80, layer, g: GLYPHS[Math.floor(hash(i, 3) * GLYPHS.length)],
      ph: hash(i, 4) * TAU, f: 1.5 + hash(i, 5) * 4, col: ['255,251,244', '200,216,255', '255,222,178', '255,170,110'][Math.floor(hash(i, 6) ** 2 * 4)], sz: hash(i, 7) });
  }
  // nebula (low-res fbm, drawn scaled up)
  const nb = buf('W15-nebula', 480, 270), nx = bctx(nb), id = nx.createImageData(480, 270);
  for (let y = 0; y < 270; y++) for (let x2 = 0; x2 < 480; x2++) {
    const n = fbm2(x2 * 0.008, y * 0.012, 5), m = fbm2(x2 * 0.004 + 9, y * 0.006 + 3, 3);
    const band = Math.exp(-((((y - 270 * 0.62) + (x2 - 240) * 0.38) / 70) ** 2)); // milky-way diagonal band
    const a = clamp((n * 0.5 + 0.5) ** 2.2 * 0.9 * (0.35 + band) + band * 0.12);
    const k = (y * 480 + x2) * 4;
    id.data[k] = lerp(58, 30, m * 0.5 + 0.5); id.data[k + 1] = lerp(30, 86, m * 0.5 + 0.5); id.data[k + 2] = lerp(120, 140, m * 0.5 + 0.5); id.data[k + 3] = a * 150;
  }
  nx.putImageData(id, 0, 0);
  // moon (crescent with craters), cached
  const R = 250, mb = buf('W15-moon', 640, 640), mx = bctx(mb), c0 = 320;
  mx.clearRect(0, 0, 640, 640);
  const g = mx.createRadialGradient(c0 - 60, c0 + 40, 20, c0, c0, R);
  g.addColorStop(0, '#FFF3D2'); g.addColorStop(0.55, '#F4D898'); g.addColorStop(1, '#D9AE68');
  mx.fillStyle = g; mx.beginPath(); mx.arc(c0, c0, R, 0, TAU); mx.fill();
  for (let i = 0; i < 22; i++) {
    const a = hash(i, 11) * TAU, rr = Math.sqrt(hash(i, 12)) * R * 0.9, cr = 6 + hash(i, 13) ** 2 * 34;
    const px = c0 + Math.cos(a) * rr, py = c0 + Math.sin(a) * rr;
    const cg = mx.createRadialGradient(px + cr * 0.25, py + cr * 0.25, cr * 0.1, px, py, cr);
    cg.addColorStop(0, 'rgba(170,120,60,0.55)'); cg.addColorStop(0.75, 'rgba(190,140,80,0.32)'); cg.addColorStop(1, 'rgba(255,250,230,0.0)');
    mx.fillStyle = cg; mx.beginPath(); mx.arc(px, py, cr, 0, TAU); mx.fill();
  }
  mx.globalCompositeOperation = 'destination-out';
  const ox = 0.44 * R, oy = -0.34 * R, orr = 0.86 * R;
  const cut = mx.createRadialGradient(c0 + ox, c0 + oy, orr - 3, c0 + ox, c0 + oy, orr + 3);
  cut.addColorStop(0, 'rgba(0,0,0,1)'); cut.addColorStop(1, 'rgba(0,0,0,0)');
  mx.fillStyle = cut; mx.beginPath(); mx.arc(c0 + ox, c0 + oy, orr + 3, 0, TAU); mx.fill();
  mx.globalCompositeOperation = 'source-atop'; // soft terminator shading along the inner edge
  const tg = mx.createRadialGradient(c0 + ox, c0 + oy, orr, c0 + ox, c0 + oy, orr + 60);
  tg.addColorStop(0, 'rgba(150,100,60,0.55)'); tg.addColorStop(1, 'rgba(150,100,60,0)');
  mx.fillStyle = tg; mx.fillRect(0, 0, 640, 640);
  mx.globalCompositeOperation = 'source-over';
  // seat = bottom of the inner bowl (moon-local coords)
  const seat = [ox, oy + orr];
  // soft violet cloud bank (foreground parallax)
  const cl = buf('W15-cloud', 1200, 260), cx = bctx(cl);
  cx.clearRect(0, 0, 1200, 260); cx.filter = 'blur(14px)';
  for (let i = 0; i < 46; i++) {
    const x3 = hash(i, 21) * 1200, y3 = 150 + hash(i, 22) * 90 - Math.sin(x3 / 1200 * Math.PI * 3) * 30, r3 = 40 + hash(i, 23) * 70;
    cx.fillStyle = `rgba(${lerp(70, 120, hash(i, 24)) | 0},${lerp(52, 80, hash(i, 25)) | 0},${lerp(130, 170, hash(i, 26)) | 0},0.55)`;
    cx.beginPath(); cx.arc(x3, y3, r3, 0, TAU); cx.fill();
  }
  cx.filter = 'none';
  C = { letters, stars, nb, mb, R, seat, cl };
}

export default {
  ...S,
  cutIn: 'none',
  sfx: [{ t: 75.56, type: 'bell', gain: 0.8 }, { t: 76.82, type: 'whoosh', gain: 0.9 }],
  draw(ctx, t, s, E) {
    if (!C) layout();
    const lt = s.lt;
    // camera: slow push-in + drift, parallax by layer
    const zoom = 1 + ease.inOutQuad(lt / s.dur) * 0.07 + (1 - ease.outCubic(seg(lt, 0, 0.6))) * 0.06;
    const camX = -lt * 22, camY = lt * 7;
    const par = (k) => [camX * k, camY * k];
    ctx.save();
    ctx.translate(W / 2, H / 2); ctx.scale(zoom, zoom); ctx.translate(-W / 2, -H / 2);
    // sky
    const sky = ctx.createLinearGradient(0, -100, 0, H + 100);
    sky.addColorStop(0, '#03050F'); sky.addColorStop(0.45, '#0A1030'); sky.addColorStop(0.8, '#1A1648'); sky.addColorStop(1, '#2C1A52');
    ctx.fillStyle = sky; ctx.fillRect(-200, -200, W + 400, H + 400);
    { const [px, py] = par(0.15); ctx.globalAlpha = 0.9; ctx.imageSmoothingEnabled = true; ctx.drawImage(C.nb, -120 + px, -80 + py, W + 240, H + 160); ctx.globalAlpha = 1; }
    // stars
    const hatP = A.pulse('hat', t, 0.18);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const glow = glowSprite('w15', '255,240,215', 64);
    for (const st of C.stars) {
      const k = [0.25, 0.55, 1.0][st.layer];
      const x = st.x + camX * k, y = st.y + camY * k;
      let tw = 0.55 + 0.45 * Math.sin(t * st.f + st.ph);
      if (hash(Math.floor(t * 8), st.ph * 100 | 0) > 0.93) tw += hatP;
      if (st.layer === 0) { ctx.fillStyle = `rgba(${st.col},${0.35 + 0.5 * tw * st.sz})`; const z = 1 + st.sz * 1.6; ctx.fillRect(x, y, z, z); continue; }
      const size = st.layer === 1 ? 11 + st.sz * 7 : 17 + st.sz * 10;
      if (st.layer === 2) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.35 * tw; ctx.drawImage(glow, x - size * 1.4, y - size * 1.4, size * 2.8, size * 2.8); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
      font(ctx, size, 'JetBrains Mono', '700'); ctx.fillStyle = `rgba(${st.col},${0.45 + 0.55 * tw})`; ctx.fillText(st.g, x, y);
    }

    // ---------- moon + CURSOR (rocking together like a swing) ----------
    const [mpx, mpy] = par(0.7);
    const MX = 1395 + mpx, MY = 680 + mpy, rock = Math.sin(lt * 2.1) * 0.035;
    const snP = A.pulse('snare', t, 0.25);
    ctx.save(); ctx.translate(MX, MY); ctx.rotate(rock);
    ctx.globalCompositeOperation = 'lighter';
    const halo = ctx.createRadialGradient(-30, 20, 60, -30, 20, 520);
    halo.addColorStop(0, `rgba(255,214,150,${0.28 + snP * 0.1})`); halo.addColorStop(0.45, 'rgba(160,120,255,0.08)'); halo.addColorStop(1, 'rgba(40,30,120,0)');
    ctx.fillStyle = halo; ctx.fillRect(-560, -540, 1120, 1120);
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(C.mb, -320, -320);
    // CURSOR on the seat
    const sx = C.seat[0], sy = C.seat[1], ms = 0.62;
    const P = pose('sit', t);
    const swing = Math.sin(t * 4.2), swing2 = Math.sin(t * 4.2 + 1.3);
    P.legL = [-32 + swing * 22, 238 - Math.abs(swing) * 10]; P.legR = [44 + swing2 * 22, 246 - Math.abs(swing2) * 10];
    P.rot = Math.sin(lt * 2.1 + 0.6) * 0.04; P.bob = 0; P.squash = A.pulse('beat', t, 0.12) * 0.04;
    const typing = t < T_LAUNCH + 0.05, afterP = t > T_PROMPT - 0.15;
    if (typing) { const k = Math.floor(t * 12) % 2; P.armL = [-34, 52 - (k ? 10 : 0)]; P.armR = [36, 52 - (k ? 0 : 10)]; P.look = [0.1, 0.9]; }
    else if (!afterP) { P.armL = [-40, 40]; P.armR = [70, -10]; P.look = [-0.7, -0.9]; }
    else { const r = ease.outBack(seg(t, T_PROMPT - 0.15, T_PROMPT + 0.2)); P.armR = [lerp(70, 40, r), lerp(-10, -185, r)]; P.armL = [-130, 92]; P.look = t > T_NIGHT - 0.1 ? [0.9, -0.9] : [-0.8, -0.9]; }
    // seat point: body bottom (y = +115 body units) sits on the bowl
    const gx = sx, gy = sy - 115 * ms + 185 * ms;
    const cb = buf('W15-cur', 520, 560), cx2 = bctx(cb);
    cx2.setTransform(1, 0, 0, 1, 0, 0); cx2.clearRect(0, 0, 520, 560);
    drawMascot(cx2, { x: 260, y: 400, s: ms * 1.0, t, P, mouth: 'auto', eyes: afterP && t < T_PROMPT + 0.5 ? 'star' : 'normal', blink: 'auto' });
    // moonlight grading: cool shadow side, warm rim from the moon
    cx2.globalCompositeOperation = 'source-atop';
    const sh = cx2.createLinearGradient(120, 0, 420, 0); sh.addColorStop(0, 'rgba(12,16,52,0.5)'); sh.addColorStop(1, 'rgba(12,16,52,0.06)');
    cx2.fillStyle = sh; cx2.fillRect(0, 0, 520, 560);
    const rim = cx2.createLinearGradient(0, 470, 0, 300); rim.addColorStop(0, 'rgba(255,220,160,0.35)'); rim.addColorStop(1, 'rgba(255,220,160,0)');
    cx2.fillStyle = rim; cx2.fillRect(0, 0, 520, 560);
    cx2.globalCompositeOperation = 'source-over';
    ctx.drawImage(cb, gx - 260, gy - 400);
    // the tiny glowing prompt card in CURSOR's hands
    const cardA = 1 - seg(t, T_LAUNCH + 0.25, T_LAUNCH + 0.5);
    if (cardA > 0) {
      const kx = gx + 0, ky = gy - 185 * ms + 34 * ms;
      ctx.save(); ctx.translate(kx, ky); ctx.rotate(-0.06);
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = cardA * 0.8;
      ctx.drawImage(glowSprite('w15card', '255,140,60', 64), -110, -70, 220, 140);
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = cardA;
      roundRect(ctx, -62, -17, 124, 34, 7); ctx.fillStyle = '#141A35'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = '#FF8A3D'; ctx.stroke();
      const nTyped = Math.floor(clamp((t - T_TYPE) / 0.3) * PROMPT.length);
      font(ctx, 14, 'JetBrains Mono', '800'); ctx.fillStyle = '#FFD9A8'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      let txt = ''; for (let i = 0; i < PROMPT.length; i++) { const lf = T_LAUNCH + i * 0.026; txt += i < nTyped && t < lf ? PROMPT[i] : ' '; }
      ctx.fillText(txt + (Math.floor(t * 4) % 2 ? '▌' : ' '), -54, 1);
      ctx.restore();
    }
    // anchor of the card in world space (for the flying characters)
    const m = ctx.getTransform();
    const cardW = m.transformPoint(new DOMPoint(gx - 54, gy - 185 * ms + 34 * ms));
    ctx.restore();

    // foreground cloud bank drifting under the moon
    { const [qx, qy] = par(1.35); ctx.globalAlpha = 0.85; ctx.drawImage(C.cl, -260 + qx + lt * 30, H - 230 + qy, 2400, 520); ctx.globalAlpha = 1; }
    // ---------- constellation ----------
    const [cpx, cpy] = par(0.35);
    ctx.save(); ctx.translate(cpx, cpy);
    const inv = ctx.getTransform().inverse();
    const cardL = inv.transformPoint(cardW);
    const glowW = glowSprite('w15w', '255,246,226', 64), glowB = glowSprite('w15b', '170,200,255', 64);
    let ci = 0;
    for (const L of C.letters) {
      if (L.ch === ' ') { ci++; continue; }
      const t0 = T_LAUNCH + L.i * 0.026, fly = 0.44, tArr = t0 + fly;
      // flying character (from the card to the letter's centre)
      if (t >= t0 && t < tArr + 0.06) {
        const u = ease.inOutCubic(seg(t, t0, tArr));
        const ax = cardL.x + L.i * 8.4, ay = cardL.y;
        const ctrlx = lerp(ax, L.cx, 0.35), ctrly = Math.min(ay, L.cy) - 260 - L.i * 8;
        const bx = (1 - u) ** 2 * ax + 2 * (1 - u) * u * ctrlx + u * u * L.cx, by = (1 - u) ** 2 * ay + 2 * (1 - u) * u * ctrly + u * u * L.cy;
        // sparkle trail
        for (let k = 1; k < 8; k++) {
          const uu = clamp(u - k * 0.03); const tx = (1 - uu) ** 2 * ax + 2 * (1 - uu) * uu * ctrlx + uu * uu * L.cx, ty = (1 - uu) ** 2 * ay + 2 * (1 - uu) * uu * ctrly + uu * uu * L.cy;
          ctx.globalAlpha = (1 - k / 8) * 0.7; ctx.fillStyle = '#FFD9A8'; ctx.fillRect(tx - 1.5, ty - 1.5, 3, 3);
        }
        ctx.globalAlpha = 1;
        const sz = lerp(14, 54, u);
        ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(glowSprite('w15card', '255,140,60', 64), bx - sz * 1.5, by - sz * 1.5, sz * 3, sz * 3); ctx.globalCompositeOperation = 'source-over';
        font(ctx, sz, 'JetBrains Mono', '800'); ctx.fillStyle = '#FFF4E0'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(L.ch, bx, by);
      }
      // lines draw after arrival
      const dr = ease.outCubic(seg(t, tArr - 0.02, tArr + 0.26));
      if (dr > 0) {
        let budget = dr * L.len;
        ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        const pathTo = () => {
          let b = budget; ctx.beginPath();
          for (const st of L.strokes) {
            ctx.moveTo(st[0][0], st[0][1]);
            for (let k = 1; k < st.length && b > 0; k++) {
              const sl = Math.hypot(st[k][0] - st[k - 1][0], st[k][1] - st[k - 1][1]), f = Math.min(1, b / sl);
              ctx.lineTo(lerp(st[k - 1][0], st[k][0], f), lerp(st[k - 1][1], st[k][1], f)); b -= sl;
            }
          }
        };
        const breath = 0.8 + 0.2 * Math.sin(t * 3 + L.i);
        pathTo(); ctx.strokeStyle = `rgba(150,180,255,${0.16 * breath})`; ctx.lineWidth = 14; ctx.stroke();
        ctx.strokeStyle = `rgba(200,220,255,${0.3 * breath})`; ctx.lineWidth = 6; ctx.stroke();
        ctx.strokeStyle = `rgba(255,252,240,${0.95})`; ctx.lineWidth = 2.2; ctx.stroke();
        ctx.globalCompositeOperation = 'source-over';
      }
      // vertex stars burst out of the arriving character
      if (t >= tArr - 0.02) {
        const b = ease.outBack(seg(t, tArr - 0.02, tArr + 0.22), 2.2);
        L.verts.forEach((v, vi) => {
          const x = lerp(L.cx, v[0], b), y = lerp(L.cy, v[1], b);
          const tw = 0.75 + 0.25 * Math.sin(t * (5 + vi) + vi * 1.7 + L.i);
          const flare = Math.exp(-Math.max(0, t - tArr) / 0.18);
          const z = 20 * tw + flare * 16;
          ctx.globalCompositeOperation = 'lighter';
          ctx.drawImage(vi % 3 ? glowW : glowB, x - z * 1.6, y - z * 1.6, z * 3.2, z * 3.2);
          ctx.globalCompositeOperation = 'source-over';
          font(ctx, 17 + flare * 10, 'JetBrains Mono', '800'); ctx.fillStyle = '#FFFFFF'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(['✦', '+', '*', '✦', '·'][(vi + L.i) % 5], x, y);
        });
      }
      ci++;
    }
    ctx.restore();

    // ---------- shooting star on "night" ----------
    const ss = seg(t, T_NIGHT - 0.04, T_NIGHT + 0.3);
    if (ss > 0 && ss < 1) {
      const u = ease.outQuad(ss);
      const x0 = 1920, y0 = 300, x1 = 640, y1 = 470;
      const hx = lerp(x0, x1, u), hy = lerp(y0, y1, u);
      const dx = x1 - x0, dy = y1 - y0, dl = Math.hypot(dx, dy), tl = 420 * Math.min(1, ss * 4) * (1 - ss * 0.6);
      const tx = hx - dx / dl * tl, ty = hy - dy / dl * tl;
      ctx.globalCompositeOperation = 'lighter';
      const tg = ctx.createLinearGradient(tx, ty, hx, hy); tg.addColorStop(0, 'rgba(160,190,255,0)'); tg.addColorStop(1, 'rgba(255,250,235,0.95)');
      ctx.strokeStyle = tg; ctx.lineCap = 'round'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(hx, hy); ctx.stroke();
      ctx.lineWidth = 16; ctx.globalAlpha = 0.25; ctx.stroke(); ctx.globalAlpha = 1;
      ctx.drawImage(glowSprite('w15w', '255,246,226', 64), hx - 60, hy - 60, 120, 120);
      for (let k = 0; k < 10; k++) { const f = k / 10; const sx2 = lerp(tx, hx, f) + (hash(k, 5) - 0.5) * 30, sy2 = lerp(ty, hy, f) + (hash(k, 6) - 0.5) * 30 + (1 - f) * 20; ctx.fillStyle = `rgba(255,230,200,${f * 0.8})`; font(ctx, 14, 'JetBrains Mono', '700'); ctx.fillText(GLYPHS[k % GLYPHS.length], sx2, sy2); }
      ctx.globalCompositeOperation = 'source-over';
      font(ctx, 34, 'JetBrains Mono', '800'); ctx.fillStyle = '#FFFFFF'; ctx.fillText('*', hx, hy + 2);
    }
    ctx.restore(); // camera

    // ---------- lyric caption, word by word ----------
    const words = [['in', 75.82], ['the', 76.1], ['middle', 76.24], ['of', 76.42], ['the', 76.68], ['night', 76.82]];
    font(ctx, 66, 'Instrument Serif', '400', 'italic');
    let wx = 214; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    for (const [w, wt] of words) {
      const k = ease.outCubic(seg(t, wt - 0.05, wt + 0.25));
      const ww = ctx.measureText(w + ' ').width;
      if (k > 0) {
        ctx.globalAlpha = k; ctx.fillStyle = w === 'night' ? '#FFD9A8' : '#FFF4E0';
        if (w === 'night') { ctx.save(); font(ctx, 66, 'Instrument Serif', '400', 'italic'); ctx.shadowColor = 'rgba(255,190,120,0.9)'; ctx.shadowBlur = 24 * k; ctx.fillText(w, wx, 580 + (1 - k) * 18); ctx.restore(); }
        else ctx.fillText(w, wx, 580 + (1 - k) * 18);
      }
      wx += ww;
    }
    ctx.globalAlpha = 1;
    // "a single little prompt" whisper label near the card at the top of the shot
    const lab = seg(t, 74.7, 74.85) * (1 - seg(t, T_LAUNCH + 0.1, T_LAUNCH + 0.3));
    if (lab > 0) {
      ctx.globalAlpha = lab; font(ctx, 30, 'Caveat', '700'); ctx.fillStyle = '#FFD9A8'; ctx.textAlign = 'right';
      ctx.fillText('a single little prompt →', cardW.x - 30, cardW.y + 8);
      ctx.globalAlpha = 1;
    }

    // FX: glow + gentle cut-in from the bright drum machine
    E.fx.bloom = 0.6; E.fx.bloomThreshold = 0.7; E.fx.vignette = 0.45; E.fx.grain = 0.05;
    const pf = Math.exp(-Math.max(0, t - T_PROMPT) / 0.25) * (t >= T_PROMPT ? 1 : 0);
    E.fx.bloom += pf * 0.35;
    if (t >= T_NIGHT && t < T_NIGHT + 0.15) E.fx.flash = [0.85, 0.9, 1, 0.12 * (1 - (t - T_NIGHT) / 0.15)];
  },
};
