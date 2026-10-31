// V10 · "every frame is a choice" — a 35mm strip of CURSOR poses races across the light table with real
// accumulated motion blur, brakes into the gate, two rejects get crossed out, a wobbly red grease-pencil
// loop circles THE frame and a ✓ CHOICE stamp slams onto it. The chosen frame comes alive.
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, hash, wobble, buf, bctx, font, roundRect } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { drawMascot } from '../../core/mascot.js';
import { PS, paperBG, cam, shadowText, popIn, slam, stampSprite, drawStamp, scribbleEllipse } from './_g2.js';

const S = shot('V10');
const FWI = 380, FHI = 285, GAP = 44, PITCH = FWI + GAP, MARG = 74, SH = FHI + MARG * 2;
const NF = 18, CH = 11;                                  // frames on the strip, chosen frame
const POSES = ['dance', 'wave', 'jump', 'point', 'cheer', 'sit', 'shrug', 'bounce', 'run', 'sing', 'heart', 'dance', 'fly', 'bow', 'surf', 'wave', 'conduct', 'cheer'];
const EYES = ['normal', 'happy', 'normal', 'normal', 'star', 'normal', 'normal', 'happy', 'normal', 'normal', 'heart', 'normal', 'normal', 'happy', 'normal', 'wink', 'shades', 'star'];
const BGS = ['#F4EDE0', '#FFB38A', '#BFD9F2', '#F2B33D', '#E9DFCC', '#F7C6CF', '#C8E6C9', '#FFD6A5', '#F4EDE0', '#BFD9F2', '#F7C6CF', '#FFE08A', '#E9DFCC', '#FFB38A', '#BFD9F2', '#C8E6C9', '#F2B33D', '#F4EDE0'];
const T_STOP = 21.16, T_X1 = 21.10, T_X2 = 21.2, T_C0 = 21.24, T_C1 = 21.56, T_STAMP = 21.6;

function cell(i) {
  const c = buf('V10-cell-' + i, FWI, FHI);
  if (c._done) return c;
  const x = bctx(c);
  x.fillStyle = BGS[i]; x.fillRect(0, 0, FWI, FHI);
  // tiny set dressing: floor line + sun/circle
  x.fillStyle = 'rgba(31,42,85,0.12)'; x.fillRect(0, FHI - 52, FWI, 52);
  x.fillStyle = 'rgba(255,255,255,0.5)'; x.beginPath(); x.arc(70 + hash(i, 1) * 240, 60 + hash(i, 2) * 40, 26 + hash(i, 3) * 18, 0, TAU); x.fill();
  drawMascot(x, { x: FWI / 2, y: FHI - 30, s: 0.66, t: 19.3 + i * 0.173, pose: POSES[i], eyes: EYES[i], mouth: i % 3 === 0 ? 'grin' : i % 3 === 1 ? 'smile' : 'o', blink: 0 });
  c._done = true; return c;
}

const PADF = 4;                                            // blank frames before/after
/** the whole strip baked once into a long canvas; frame i centre at x = (i+PADF)*PITCH + PITCH/2 */
function stripCanvas() {
  const c = buf('V10-long', (NF + PADF * 2) * PITCH, SH);
  if (c._done) return c;
  const x = bctx(c), x1 = c.width;
  x.fillStyle = '#1C1A26'; x.fillRect(0, 0, x1, SH);
  x.fillStyle = '#3A2A26'; x.fillRect(0, 6, x1, 10); x.fillRect(0, SH - 16, x1, 10);
  const sp = PITCH / 6;
  x.fillStyle = PS.paper;
  for (let k = 0; k * sp < x1; k++) { const sx = k * sp + sp / 2; roundRect(x, sx - 14, 24, 28, 30, 6); x.fill(); roundRect(x, sx - 14, SH - 54, 28, 30, 6); x.fill(); }
  for (let j = 0; j < NF + PADF * 2; j++) {
    const i = j - PADF, cx = j * PITCH + PITCH / 2;
    if (i < 0 || i >= NF) { x.fillStyle = '#2A2738'; x.fillRect(cx - FWI / 2, SH / 2 - FHI / 2, FWI, FHI); continue; }
    x.drawImage(cell(i), cx - FWI / 2, SH / 2 - FHI / 2);
    x.fillStyle = 'rgba(255,170,90,0.9)'; font(x, 17, 'JetBrains Mono', '800'); x.textAlign = 'left'; x.textBaseline = 'middle';
    x.fillText(`▸ ${String(200 + i).padStart(4, '0')}`, cx - FWI / 2, SH - 10);
    x.fillText(i % 2 ? 'PAPER STUDIO 400' : `${12 + i}A`, cx - FWI / 2 + 120, 12);
  }
  c._done = true; return c;
}
/** the chosen frame, live (drawn over the strip once it has stopped) */
function liveCell(t) {
  const c = buf('V10-live', FWI, FHI), x = bctx(c);
  x.fillStyle = '#FFE08A'; x.fillRect(0, 0, FWI, FHI);
  x.save(); x.translate(FWI / 2, FHI / 2 + 10); x.rotate(t * 0.8); x.fillStyle = 'rgba(255,106,31,0.35)';
  for (let r = 0; r < 12; r++) { x.beginPath(); x.moveTo(0, 0); x.arc(0, 0, 400, (r / 12) * TAU, (r / 12 + 0.04) * TAU); x.fill(); }
  x.restore();
  x.fillStyle = 'rgba(31,42,85,0.12)'; x.fillRect(0, FHI - 52, FWI, 52);
  drawMascot(x, { x: FWI / 2, y: FHI - 30, s: 0.66, t, pose: 'dance', eyes: 'star', mouth: 'auto' });
  return c;
}

export default {
  ...S,
  sfx: [{ t: 20.72, type: 'whoosh', gain: 0.7 }, { t: T_STOP, type: 'click', gain: 0.6 }, { t: T_STAMP, type: 'stamp', gain: 1 }],
  draw(ctx, t, s, E) {
    const lt = s.lt;
    // ---- strip kinematics: race → brake → gate settle ----
    const target = CH * PITCH, D = 5200;
    const posAt = (tt) => {
      const p = clamp((tt - 20.62) / (T_STOP - 20.62));
      let x = target - D * (1 - ease.outQuart(p));
      if (tt > T_STOP) x += wobble(tt - T_STOP, 4.5, 9) * 26;
      return x;
    };
    const pos = posAt(t), vel = (posAt(t + 1 / 60) - posAt(t - 1 / 60)) * 30;   // px/s
    const blurPx = Math.abs(vel) / 30 * 0.7;

    // ---- camera ----
    const st = t >= T_STAMP ? t - T_STAMP : -1;
    const push = st >= 0 ? ease.outExpo(st / 0.35) : 0;
    const zoom = 1 + lt * 0.03 + push * 0.07 + Math.exp(-A.since('beat', t) / 0.1) * 0.01;
    const rot = lerp(-0.05, -0.012, ease.outCubic(clamp((t - 20.7) / 0.6))) + push * 0.02;
    ctx.save();
    cam(ctx, W / 2 + push * 30, H / 2 + push * 16, zoom, rot);
    paperBG(ctx, '#F7F0E2', 1, 160);
    // light table glow + ruler ticks
    const g = ctx.createRadialGradient(W / 2, H / 2, 50, W / 2, H / 2, 1100); g.addColorStop(0, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(-160, -160, W + 320, H + 320);
    ctx.strokeStyle = 'rgba(31,42,85,0.35)'; ctx.lineWidth = 2;
    for (let x = -160; x < W + 160; x += 24) { const L = (Math.round(x / 24) % 5 === 0) ? 22 : 10; ctx.beginPath(); ctx.moveTo(x, 300); ctx.lineTo(x, 300 - L); ctx.moveTo(x, 830); ctx.lineTo(x, 830 + L); ctx.stroke(); }

    // background strip (parallax, opposite direction)
    ctx.save(); ctx.translate(W / 2, 205); ctx.rotate(0.06); ctx.scale(0.42, 0.42); ctx.globalAlpha = 0.22;
    const LS = stripCanvas(), bpos = -pos * 0.25 + 4200;
    ctx.drawImage(LS, -bpos, -SH / 2); ctx.restore();

    // ---- main strip with accumulated motion blur ----
    const SY = 560;
    const sb = buf('V10-strip', W + 400, SH), sx = bctx(sb);
    sx.setTransform(1, 0, 0, 1, 0, 0); sx.clearRect(0, 0, sb.width, sb.height);
    const n = blurPx > 3 ? Math.min(16, Math.ceil(blurPx / 16) + 2) : 1;
    sx.globalCompositeOperation = n > 1 ? 'lighter' : 'source-over';
    const base = PADF * PITCH + PITCH / 2 - (W + 400) / 2;      // long-canvas x at the buffer's left edge when pos = 0
    for (let k = 0; k < n; k++) {
      const off = n > 1 ? (k / (n - 1) - 0.5) * blurPx : 0;
      sx.globalAlpha = 1 / n;
      sx.drawImage(LS, base + pos + off, 0, W + 400, SH, 0, 0, W + 400, SH);
    }
    sx.globalAlpha = 1; sx.globalCompositeOperation = 'source-over';
    // shadow + strip
    ctx.fillStyle = 'rgba(31,42,85,0.22)'; ctx.fillRect(-200, SY - SH / 2 + 18, W + 400, SH);
    ctx.drawImage(sb, W / 2 - (W + 400) / 2, SY - SH / 2);
    const fx0 = W / 2 - (pos - target);
    if (t > T_STOP - 0.04) ctx.drawImage(liveCell(t), fx0 - FWI / 2, SY - FHI / 2);

    // ---- gate brackets ----
    const gk = ease.outBack(clamp((t - (T_STOP - 0.06)) / 0.2), 2);
    if (gk > 0) {
      const gx = W / 2, gy = SY, bw = FWI / 2 + 26 + (1 - gk) * 120, bh = FHI / 2 + 26 + (1 - gk) * 90;
      ctx.strokeStyle = PS.orange; ctx.lineWidth = 9; ctx.lineCap = 'square';
      for (const [sxn, syn] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
        ctx.beginPath(); ctx.moveTo(gx + sxn * bw, gy + syn * (bh - 44)); ctx.lineTo(gx + sxn * bw, gy + syn * bh); ctx.lineTo(gx + sxn * (bw - 44), gy + syn * bh); ctx.stroke();
      }
    }
    // ---- rejects: quick red X strokes on neighbours ----
    const xMark = (cx, t0) => {
      const a = clamp((t - t0) / 0.05), b = clamp((t - t0 - 0.05) / 0.05);
      ctx.strokeStyle = PS.red; ctx.lineWidth = 16; ctx.lineCap = 'round';
      if (a > 0) { ctx.beginPath(); ctx.moveTo(cx - 120, SY - 100); ctx.lineTo(cx - 120 + 240 * a, SY - 100 + 200 * a); ctx.stroke(); }
      if (b > 0) { ctx.beginPath(); ctx.moveTo(cx + 120, SY - 100); ctx.lineTo(cx + 120 - 240 * b, SY - 100 + 200 * b); ctx.stroke(); }
    };
    xMark(fx0 - PITCH, T_X1); xMark(fx0 + PITCH, T_X2);
    // dim the rest after the choice
    if (st >= 0) {
      const a = clamp(st / 0.12) * 0.55;
      ctx.fillStyle = `rgba(244,237,224,${a})`;
      ctx.fillRect(-200, SY - SH / 2, fx0 - FWI / 2 - 14 + 200, SH); ctx.fillRect(fx0 + FWI / 2 + 14, SY - SH / 2, W + 200, SH);
    }
    // ---- grease pencil loop ----
    scribbleEllipse(ctx, fx0, SY + 4, FWI * 0.66, FHI * 0.72, ease.inOutQuad(clamp((t - T_C0) / (T_C1 - T_C0))), { seed: 5, color: PS.red, width: 15, turns: 1.16 });

    // ---- big type ----
    const k1 = popIn(t, 20.7, 0.22), k2 = slam(t, 20.9, 0.16, 2.4);
    if (k1 > 0) { ctx.save(); ctx.translate(560, 208); ctx.scale(k1, k1); shadowText(ctx, 'EVERY', 0, 0, { size: 150, off: 8 }); ctx.restore(); }
    if (k2 > 0) { ctx.save(); ctx.translate(1180, 208); ctx.rotate(0.02); ctx.scale(k2, k2); shadowText(ctx, 'FRAME', 0, 0, { size: 170, off: 9, fill: PS.red, shadow: PS.ink }); ctx.restore(); }
    // UI readout
    const fr = 200 + Math.round(pos / PITCH);
    font(ctx, 26, 'JetBrains Mono', '800'); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = PS.ink;
    const spd = Math.abs(vel) / PITCH / 24;
    ctx.fillText(`TC 00:00:${String(Math.floor(fr / 24)).padStart(2, '0')}:${String(fr % 24).padStart(2, '0')}   FRAME ${String(fr).padStart(4, '0')}`, 300, 880);
    ctx.textAlign = 'right'; ctx.fillStyle = spd > 0.05 ? PS.red : PS.ink;
    ctx.fillText(spd > 0.05 ? `▶▶ ${spd.toFixed(1)}×` : (t >= T_STAMP ? '● SELECTED' : '■ HOLD'), 1620, 880);

    // ---- stamp ----
    const imp = drawStamp(ctx, stampSprite('V10choice', 'CHOICE', { size: 118, check: true, color: PS.red }), fx0 + 40, SY + 200, t, T_STAMP, -0.12, 1, 'source-over');
    ctx.restore();

    // ---- fx ----
    if (st >= 0.12 && st < 0.4) { const k = 1 - (st - 0.12) / 0.28; E.fx.shake = 16 * k; E.fx.zoom += 0.03 * k; E.fx.rgb = 5 * k; }
    if (blurPx > 40) E.fx.rgb += Math.min(6, blurPx / 60);
    if (t > T_STOP && t < T_STOP + 0.08) E.fx.shake = Math.max(E.fx.shake, 6);
  },
};
