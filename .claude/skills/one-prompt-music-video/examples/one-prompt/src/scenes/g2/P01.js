// P01 · "Tokens on the meter," — a giant mechanical odometer floating in the sky. Seven digit wheels are real
// cylinders (digits foreshortened by cos θ, shaded at the edges) with true odometer carry mechanics (a wheel
// only turns while the one to its right rolls 9→0). The count grows exponentially 0 → 2²⁰ = 1,048,576, landing
// on "meter"; fast wheels get accumulated motion blur, the pressure gauge slams into the red and the vents steam.
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, hash, noise2, wobble, buf, bctx, font, roundRect } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { drawMascot } from '../../core/mascot.js';
import { PS, SKY, cloud, shadowText } from './_g2.js';

const S = shot('P01');
const T0 = 29.98, T_METER = 31.12;
const FINAL = 1048576, ND = 7;
const WW = 142, WH = 236, GAPW = 14, COMMA = 44;
const HX = 960, HY = 640;                             // housing centre

const count = (t) => { const q = clamp((t - T0) / (T_METER - T0)); return q <= 0 ? 0 : Math.pow(2, 20 * Math.pow(q, 0.82)) - 1 + (q >= 1 ? 1 : 0); };
function wheelPos(v, i) { // odometer mechanics
  const a = v / Math.pow(10, i);
  if (i === 0) return a;
  const f = a - Math.floor(a), lowFrac = (v / Math.pow(10, i - 1)) % 10;
  return Math.floor(a) + clamp(lowFrac - 9);
}

const RCYL = 262;
function wheelFace(x, p, red) {
  x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
  x.fillStyle = '#FFFBF4'; x.fillRect(0, 0, WW, WH);
  const base = Math.round(p);
  font(x, 158, 'Anton'); x.textAlign = 'center'; x.textBaseline = 'middle';
  for (let d = base - 1; d <= base + 1; d++) {
    const th = (d - p) * (TAU / 10); if (Math.abs(th) > Math.PI / 2) continue;
    const y = WH / 2 + Math.sin(th) * RCYL, sy = Math.cos(th);
    x.save(); x.translate(WW / 2, y); x.scale(1, sy);
    x.fillStyle = red ? PS.red : PS.ink; x.fillText(String(((d % 10) + 10) % 10), 0, 8);
    x.restore();
  }
}
function drawWheel(x, k, p, red, blurD) {
  const n = blurD > 0.04 ? Math.min(12, 3 + Math.ceil(blurD * 5)) : 1;
  if (n === 1) wheelFace(x, p, red);
  else {
    const tmp = buf('P01-tmp', WW, WH), tx = bctx(tmp);
    x.clearRect(0, 0, WW, WH); x.globalCompositeOperation = 'lighter';
    for (let q = 0; q < n; q++) {
      wheelFace(tx, p + (q / (n - 1) - 0.5) * blurD, red);
      x.globalAlpha = 1 / n; x.drawImage(tmp, 0, 0);
    }
    x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
  }
  const g = x.createLinearGradient(0, 0, 0, WH);
  g.addColorStop(0, 'rgba(31,42,85,0.8)'); g.addColorStop(0.25, 'rgba(31,42,85,0.1)'); g.addColorStop(0.5, 'rgba(255,255,255,0.1)'); g.addColorStop(0.75, 'rgba(31,42,85,0.1)'); g.addColorStop(1, 'rgba(31,42,85,0.85)');
  x.fillStyle = g; x.fillRect(0, 0, WW, WH);
}

function gear(ctx, x, y, r, teeth, rot, col) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.beginPath();
  for (let i = 0; i < teeth * 2; i++) { const a0 = (i / (teeth * 2)) * TAU, rr = i % 2 ? r : r * 1.18; ctx.lineTo(Math.cos(a0) * rr, Math.sin(a0) * rr); ctx.lineTo(Math.cos(a0 + TAU / (teeth * 2)) * rr, Math.sin(a0 + TAU / (teeth * 2)) * rr); }
  ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = PS.ink; ctx.stroke();
  ctx.fillStyle = PS.ink; ctx.beginPath(); ctx.arc(0, 0, r * 0.28, 0, TAU); ctx.fill();
  ctx.fillStyle = '#FFFBF4'; for (let i = 0; i < 4; i++) { const a = i * TAU / 4; ctx.beginPath(); ctx.arc(Math.cos(a) * r * 0.62, Math.sin(a) * r * 0.62, r * 0.14, 0, TAU); ctx.fill(); }
  ctx.restore();
}

export default {
  ...S,
  sfx: [{ t: 30.05, type: 'riser', gain: 0.4 }, { t: T_METER, type: 'impact', gain: 1 }, { t: T_METER + 0.05, type: 'bell', gain: 0.6 }],
  draw(ctx, t, s, E) {
    const lt = s.lt;
    const v = count(t), dv = (count(t + 1 / 60) - count(t - 1 / 60)) * 30;
    const hit = t >= T_METER ? t - T_METER : -1;
    const hitK = hit >= 0 ? Math.exp(-hit / 0.18) : 0;
    const beat = Math.exp(-A.since('beat', t) / 0.12);
    const speedLog = Math.log10(1 + Math.abs(dv));            // 0..6
    // ---- sky ----
    const sg = ctx.createLinearGradient(0, 0, 0, H); sg.addColorStop(0, '#3FA6EA'); sg.addColorStop(0.7, SKY.sky); sg.addColorStop(1, SKY.pale);
    ctx.fillStyle = sg; ctx.fillRect(0, 0, W, H);
    // sun + rays
    ctx.save(); ctx.translate(1700, 150); ctx.rotate(t * 0.3); ctx.fillStyle = 'rgba(255,255,255,0.18)';
    for (let r = 0; r < 16; r++) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 1600, (r / 16) * TAU, (r / 16 + 0.028) * TAU); ctx.fill(); }
    ctx.restore();
    ctx.fillStyle = SKY.sun; ctx.beginPath(); ctx.arc(1700, 150, 110 + beat * 8, 0, TAU); ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = '#F2A33D'; ctx.stroke();
    // far clouds
    for (let i = 0; i < 7; i++) { const x = ((i * 380 - t * 60) % 2600 + 2600) % 2600 - 300, y = 840 + (i % 3) * 70; cloud(ctx, x, y, 110 + (i % 2) * 40, { seed: i + 3, shade: '#D8EEFA', shadow: null }); }
    for (let i = 0; i < 4; i++) { const x = ((i * 610 + 200 - t * 30) % 2400 + 2400) % 2400 - 200, y = 300 + (i % 2) * 120; ctx.globalAlpha = 0.7; cloud(ctx, x, y, 70, { seed: i + 20, shade: '#E2F2FB', shadow: null }); ctx.globalAlpha = 1; }

    // speed lines (warp) as the count explodes
    const sl = clamp((speedLog - 2.5) / 3.5) * (t < T_METER ? 1 : Math.exp(-hit / 0.15));
    if (sl > 0.01) {
      ctx.save(); ctx.translate(HX, HY); ctx.strokeStyle = `rgba(255,255,255,${0.55 * sl})`; ctx.lineCap = 'round';
      for (let i = 0; i < 60; i++) { const a = hash(i, 9) * TAU, r0 = 300 + ((hash(i, 8) * 900 + t * 2600) % 900), L = 80 + sl * 260; ctx.lineWidth = 3 + hash(i, 7) * 6; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0 * 0.7); ctx.lineTo(Math.cos(a) * (r0 + L), Math.sin(a) * (r0 + L) * 0.7); ctx.stroke(); }
      ctx.restore();
    }
    // ---- camera ----
    ctx.save();
    const shake = clamp(speedLog / 6) * 4 + hitK * 0;
    const zoom = 0.94 + ease.inQuad(clamp((t - T0) / (T_METER - T0))) * 0.12 + beat * 0.012 + hitK * 0.05;
    ctx.translate(W / 2 + noise2(t * 30, 1) * shake, H / 2 + noise2(t * 30, 2) * shake); ctx.rotate(-0.025 + lt * 0.012 + hitK * 0.01 * Math.sin(hit * 60)); ctx.scale(zoom, zoom); ctx.translate(-W / 2, -H / 2);

    // ---- housing ----
    const totalW = ND * WW + (ND - 1) * GAPW + 2 * COMMA, bw = totalW + 150, bh = WH + 120;
    const bx = HX - bw / 2, by = HY - bh / 2;
    // float bob
    ctx.translate(0, Math.sin(t * 2.2) * 6);
    ctx.fillStyle = PS.ink; roundRect(ctx, bx + 18, by + 22, bw, bh, 44); ctx.fill();
    const hg = ctx.createLinearGradient(0, by, 0, by + bh); hg.addColorStop(0, '#FFFFFF'); hg.addColorStop(1, '#DCE6EE');
    ctx.fillStyle = hg; roundRect(ctx, bx, by, bw, bh, 44); ctx.fill(); ctx.lineWidth = 9; ctx.strokeStyle = PS.ink; ctx.stroke();
    // bolts
    ctx.fillStyle = PS.ink; for (const [qx, qy] of [[bx + 34, by + 34], [bx + bw - 34, by + 34], [bx + 34, by + bh - 34], [bx + bw - 34, by + bh - 34]]) { ctx.beginPath(); ctx.arc(qx, qy, 10, 0, TAU); ctx.fill(); }
    // vents (steam on the slam)
    for (let i = 0; i < 5; i++) { ctx.fillStyle = PS.ink; roundRect(ctx, bx + bw - 64, by + 80 + i * 40, 30, 12, 6); ctx.fill(); }
    // window
    const wx = HX - totalW / 2 - 18, wy = HY - WH / 2 - 18;
    ctx.fillStyle = '#121838'; roundRect(ctx, wx, wy, totalW + 36, WH + 36, 22); ctx.fill();
    // wheels
    let x = HX - totalW / 2;
    const digits = [];
    for (let k = 0; k < ND; k++) {
      const i = ND - 1 - k;                                   // place value
      let p = wheelPos(v, i);
      const landT = T_METER + (ND - 1 - i) * 0.025;
      if (t >= T_METER) p = Math.floor(FINAL / Math.pow(10, i)) + wobble(t - landT, 5, 7) * 0.09 * (t >= landT ? 1 : 0);
      const pv = i === 0 ? dv : (wheelPos(count(t + 1 / 60), i) - wheelPos(count(t - 1 / 60), i)) * 30;
      const blurD = t >= T_METER ? 0 : Math.min(2.2, Math.abs(pv) / 30 * 0.9);
      const wb = buf('P01-wheel' + k, WW, WH), wbx = bctx(wb);
      wbx.setTransform(1, 0, 0, 1, 0, 0); wbx.clearRect(0, 0, WW, WH);
      drawWheel(wbx, k, p, i === 0, blurD);
      ctx.drawImage(wb, x, HY - WH / 2);
      ctx.lineWidth = 4; ctx.strokeStyle = PS.ink; ctx.strokeRect(x, HY - WH / 2, WW, WH);
      digits.push(x);
      x += WW + GAPW;
      if (k === 0 || k === 3) { // commas
        x -= GAPW;
        ctx.fillStyle = '#FFFBF4'; ctx.beginPath(); ctx.arc(x + COMMA / 2, HY + WH / 2 - 34, 12, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x + COMMA / 2 + 4, HY + WH / 2 - 30); ctx.lineTo(x + COMMA / 2 - 8, HY + WH / 2 - 4); ctx.lineWidth = 8; ctx.strokeStyle = '#FFFBF4'; ctx.stroke();
        x += COMMA;
      }
    }
    // glass highlight
    ctx.save(); roundRect(ctx, wx, wy, totalW + 36, WH + 36, 22); ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.beginPath(); ctx.moveTo(wx + 120, wy); ctx.lineTo(wx + 300, wy); ctx.lineTo(wx + 180, wy + WH + 40); ctx.lineTo(wx, wy + WH + 40); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(wx, wy + 8, totalW + 36, 26);
    ctx.restore();
    ctx.lineWidth = 7; ctx.strokeStyle = PS.ink; roundRect(ctx, wx, wy, totalW + 36, WH + 36, 22); ctx.stroke();
    // gears on the left flank (spin with the units wheel)
    const gr = wheelPos(v, 1) * 0.6 + (t >= T_METER ? wobble(t - T_METER, 4, 6) * 0.3 : 0);
    gear(ctx, bx + 10, by + bh - 20, 70, 12, gr, PS.mustard);
    gear(ctx, bx - 70, by + bh - 130, 46, 8, -gr * 1.5 + 0.2, PS.orange);
    // label plate
    font(ctx, 22, 'JetBrains Mono', '800'); ctx.fillStyle = PS.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('TOKEN METER · MODEL 2^20 · ' + (t >= T_METER ? 'LIMIT REACHED' : `+${Math.round(Math.abs(dv)).toLocaleString('en-US')} tok/s`), HX, by + bh - 28);

    // ---- pressure gauge on top-right ----
    const GX = bx + bw - 150, GY = by - 120, GR = 118;
    ctx.fillStyle = '#B9C6D2'; ctx.fillRect(GX - 18, GY, 36, by - GY + 10); ctx.lineWidth = 6; ctx.strokeStyle = PS.ink; ctx.strokeRect(GX - 18, GY, 36, by - GY + 10);
    ctx.fillStyle = PS.ink; ctx.beginPath(); ctx.arc(GX + 12, GY + 14, GR + 20, 0, TAU); ctx.fill();
    ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(GX, GY, GR + 20, 0, TAU); ctx.fill(); ctx.lineWidth = 9; ctx.strokeStyle = PS.ink; ctx.stroke();
    const a0 = Math.PI * 0.8, a1 = Math.PI * 2.2;
    ctx.lineWidth = 22; ctx.strokeStyle = '#7ED38B'; ctx.beginPath(); ctx.arc(GX, GY, GR - 22, a0, lerp(a0, a1, 0.55)); ctx.stroke();
    ctx.strokeStyle = PS.mustard; ctx.beginPath(); ctx.arc(GX, GY, GR - 22, lerp(a0, a1, 0.55), lerp(a0, a1, 0.78)); ctx.stroke();
    ctx.strokeStyle = PS.red; ctx.beginPath(); ctx.arc(GX, GY, GR - 22, lerp(a0, a1, 0.78), a1); ctx.stroke();
    ctx.strokeStyle = PS.ink; ctx.lineWidth = 4;
    for (let i = 0; i <= 12; i++) { const a = lerp(a0, a1, i / 12); ctx.beginPath(); ctx.moveTo(GX + Math.cos(a) * (GR - 2), GY + Math.sin(a) * (GR - 2)); ctx.lineTo(GX + Math.cos(a) * (GR - 42), GY + Math.sin(a) * (GR - 42)); ctx.stroke(); }
    font(ctx, 26, 'Anton'); ctx.fillStyle = PS.ink; ctx.fillText('METER', GX, GY + 50);
    let nk = clamp(Math.log2(1 + v) / 20) * 0.92;
    if (t >= T_METER) nk = 0.97 + wobble(hit, 9, 4) * 0.06 + Math.sin(t * 70) * 0.012;
    else nk += Math.sin(t * 50) * 0.01 * clamp(speedLog / 4);
    const na = lerp(a0, a1, nk);
    ctx.save(); ctx.translate(GX, GY); ctx.rotate(na);
    ctx.fillStyle = PS.red; ctx.beginPath(); ctx.moveTo(-26, -10); ctx.lineTo(GR - 30, 0); ctx.lineTo(-26, 10); ctx.closePath(); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = PS.ink; ctx.stroke();
    ctx.restore();
    ctx.fillStyle = PS.ink; ctx.beginPath(); ctx.arc(GX, GY, 18, 0, TAU); ctx.fill();
    // red lamp
    const lamp = t >= T_METER && Math.floor(hit * 10) % 2 === 0;
    ctx.save(); if (lamp) { ctx.shadowColor = PS.red; ctx.shadowBlur = 40; } ctx.fillStyle = lamp ? '#FF4040' : '#7A2A30';
    ctx.beginPath(); ctx.arc(GX + GR + 50, GY + 40, 24, 0, TAU); ctx.fill(); ctx.restore();
    ctx.lineWidth = 6; ctx.strokeStyle = PS.ink; ctx.beginPath(); ctx.arc(GX + GR + 50, GY + 40, 24, 0, TAU); ctx.stroke();

    // ---- CURSOR perched on the housing, watching the numbers ----
    const look = [clamp(Math.sin(t * 9) * 0.3 + 0.6, -1, 1), 0.6];
    drawMascot(ctx, { x: bx + 120, y: by + 6, s: 0.6, t, pose: 'sit', look, eyes: t >= T_METER ? 'x' : 'normal', mouth: t >= T_METER ? 'open' : 'o', blink: 0 });

    // ---- big type ----
    const tk = ease.outBack(clamp((t - 29.92) / 0.24), 2.4);
    if (tk > 0) {
      ctx.save(); ctx.translate(HX - 40, by - 116); ctx.rotate(-0.03); ctx.scale(tk, tk);
      shadowText(ctx, 'TOKENS', 0, 0, { size: 200, fill: '#FFFBF4', shadow: PS.ink, off: 12, stroke: PS.ink, lw: 14 });
      ctx.restore();
    }
    // steam puffs from the vents on the slam
    if (hit >= 0) {
      for (let i = 0; i < 12; i++) {
        const k = clamp((hit - i * 0.02) / 0.5); if (k <= 0) continue;
        const px = bx + bw - 50 + k * (120 + hash(i, 1) * 200), py = by + 100 + (i % 5) * 40 - k * (60 + hash(i, 2) * 140);
        ctx.globalAlpha = (1 - k) * 0.95; ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(px, py, 20 + k * 70, 0, TAU); ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = PS.ink; ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    ctx.restore();

    // foreground cloud whoosh near the end
    const fc = (t - 31.36) / 0.24;
    if (fc > 0 && fc < 1) cloud(ctx, lerp(2400, -600, fc), 1000, 360, { seed: 77, outline: PS.ink, lw: 8, shade: '#DCEFFA', shadow: null });

    // ---- fx ----
    if (hit >= 0 && hit < 0.25) { E.fx.shake = 22 * (1 - hit / 0.25); E.fx.zoom += 0.05 * (1 - hit / 0.25); E.fx.rgb = 6 * (1 - hit / 0.25); }
    E.fx.rgb = Math.max(E.fx.rgb, clamp(speedLog / 6) * 3);
  },
};
