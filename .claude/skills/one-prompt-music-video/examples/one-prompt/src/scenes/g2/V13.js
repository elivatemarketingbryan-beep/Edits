// V13 · "I don't touch the timeline, I don't move a thing" — CURSOR lounges in a deck chair (shades, drink)
// while a giant NLE timeline edits ITSELF: clips fly in and snap to tracks, ghost pointers drag / trim / re-track,
// keyframes pop on the automation lane, a razor slices every track on the downbeat, the ruler zooms out.
// The V1 clips carry REAL thumbnails of this very video (E.thumb), the A1 clip the REAL song waveform.
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, hash, wobble, spring, font, roundRect } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { drawMascot } from '../../core/mascot.js';
import { PS, paperBG, cam, shadowText } from './_g2.js';

const S = shot('V13');
const WX0 = 70, WX1 = 1850, WY0 = 132, WY1 = 884, LX0 = 238, LX1 = 1838;
const TR = [ // tracks
  { n: 'V3', y: 252, h: 74 }, { n: 'V2', y: 334, h: 74 }, { n: 'V1', y: 416, h: 112 },
  { n: 'A1', y: 536, h: 86 }, { n: 'A2', y: 630, h: 58 }, { n: 'FX', y: 696, h: 168 },
];
const T_TOUCH = 24.64, T_ZOOM = 24.92, T_RAZOR = 25.287, T_MOVE = 25.96, T_END = 26.36;
const RAZ = 9.0;

// clips: [track, start, len, colour, label, thumbTime|null, tIn]
const CL = [];
const V1 = [['V01', 1.6, 9.0], ['V02', 1.3, 10.8], ['V03', 0.9, 12.0], ['V04', 2.0, 13.4], ['V05', 1.2, 15.1], ['V06', 0.6, 16.0], ['V07', 0.8, 16.7], ['V08', 2.2, 18.3], ['V09', 1.5, 20.4], ['V10', 1.2, 21.7], ['V11', 1.1, 22.6], ['V12', 1.2, 23.7], ['V13', 2.4, null], ['V14', 1.3, null]];
{ let x = 0; V1.forEach(([n, L, th], i) => { CL.push({ tr: 2, s: x, len: L, c: [PS.ink, PS.blue][i % 2], label: n, th, tIn: i < 4 ? 0 : 24.3 + (i - 4) * 0.11 }); x += L; }); }
[['GLOW', 3.0, 1.6, 24.34], ['SHAKE', 5.4, 1.0, 24.5], ['RGB SPLIT', 8.0, 1.8, 24.64], ['GRAIN', 11.2, 2.4, 24.8], ['ZOOM PUNCH', 14.6, 1.4, 25.17], ['BLOOM', 17.0, 2.2, 25.52]]
  .forEach(([n, s, L, ti]) => CL.push({ tr: 1, s, len: L, c: PS.orange, label: n, tIn: ti }));
[['TITLE · ONE PROMPT', 0.4, 2.6, 0], ['LOWER THIRD', 4.2, 1.8, 24.46], ['KARAOKE', 7.2, 3.6, 24.91], ['TECH TAG', 12.4, 2.0, 25.3], ['END CARD', 16.2, 3.0, 25.84]]
  .forEach(([n, s, L, ti]) => CL.push({ tr: 0, s, len: L, c: PS.mustard, label: n, tIn: ti }));
CL.push({ tr: 3, s: 0, len: 20, c: PS.teal, label: 'one_prompt.wav', tIn: 0, wave: true });
[['whoosh', 1.0, 24.4], ['pop', 2.7, 24.58], ['stamp', 5.2, 24.72], ['ding', 7.6, 25.0], ['zap', 10.1, 25.4], ['tick', 12.0, 25.6], ['boom', 14.8, 26.0], ['riser', 17.2, 26.2]]
  .forEach(([n, s, ti]) => CL.push({ tr: 4, s, len: n === 'riser' ? 2.4 : 0.7, c: PS.red, label: n, tIn: ti }));
// edits performed by ghost pointers: [clipIndex, t0, t1, kind, amount, pointer]
const findC = (lab) => CL.findIndex((c) => c.label === lab);
const ED = [
  [findC('GLOW'), 24.42, 24.62, 'move', -1.6, 0],
  [findC('LOWER THIRD'), 24.66, 24.86, 'trimR', 1.4, 1],
  [findC('SHAKE'), 24.98, 25.2, 'track', -1, 2],
  [findC('RGB SPLIT'), 25.42, 25.66, 'move', 1.2, 0],
  [findC('GRAIN'), 25.7, 25.92, 'trimL', 1.0, 1],
  [findC('KARAOKE'), 26.02, 26.26, 'move', -0.8, 2],
  [findC('END CARD'), 25.36, 25.56, 'trimR', -0.8, 2],
];
const KEYS = [[0.4, 0.2], [1.8, 0.75], [3.0, 0.35], [4.6, 0.9], [6.1, 0.15], [7.5, 0.6], [9.2, 0.82], [10.6, 0.3], [12.2, 0.7], [13.8, 0.45], [15.6, 0.95], [17.4, 0.25], [19.0, 0.6]];

function clipState(c, t) {
  let s = c.s, len = c.len, tr = c.tr;
  for (const [ci, t0, t1, kind, amt] of ED) {
    if (CL[ci] !== c || t < t0) continue;
    const k = ease.inOutCubic(clamp((t - t0) / (t1 - t0)));
    if (kind === 'move') s += amt * k; else if (kind === 'trimR') len += amt * k; else if (kind === 'trimL') { s += amt * k; len -= amt * k; } else if (kind === 'track') tr += amt * k;
  }
  return { s, len, tr };
}
const trackY = (tr) => { const i = Math.floor(tr), f = tr - i; const a = TR[clamp(i, 0, 5)], b = TR[clamp(i + 1, 0, 5)]; return lerp(a.y, b.y, f); };

// deck chair + CURSOR (foreground). Chair-local units, ground at y = 0, the sitter faces right.
function slingPath(ctx) {
  ctx.beginPath(); ctx.moveTo(-232, -392); ctx.quadraticCurveTo(-120, -90, 40, -86); ctx.quadraticCurveTo(130, -90, 196, -150);
  ctx.lineTo(186, -112); ctx.quadraticCurveTo(120, -40, 30, -36); ctx.quadraticCurveTo(-150, -50, -268, -372); ctx.closePath();
}
function lounger(ctx, t, x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = 'rgba(31,42,85,0.25)'; ctx.beginPath(); ctx.ellipse(-20, 4, 300, 24, 0, 0, TAU); ctx.fill();
  ctx.lineCap = 'round';
  // rear frame (behind the sling)
  ctx.strokeStyle = '#7A4E2C'; ctx.lineWidth = 18;
  ctx.beginPath(); ctx.moveTo(-250, -380); ctx.lineTo(-90, 0); ctx.moveTo(190, -130); ctx.lineTo(-40, -270); ctx.stroke();
  // sling: striped canvas
  ctx.save(); slingPath(ctx); ctx.clip();
  for (let i = -10; i < 16; i++) { ctx.fillStyle = i % 2 ? PS.red : '#FFFBF4'; ctx.save(); ctx.translate(-300 + i * 36, -420); ctx.rotate(-0.35); ctx.fillRect(0, 0, 18, 520); ctx.restore(); }
  ctx.fillStyle = 'rgba(31,42,85,0.18)'; ctx.fillRect(-300, -60, 520, 40);
  ctx.restore();
  ctx.strokeStyle = PS.ink; ctx.lineWidth = 6; slingPath(ctx); ctx.stroke();
  ctx.restore();
  // the mascot reclining in it: shades, sipping a drink
  const sip = Math.sin(t * 3) * 0.5 + 0.5;
  drawMascot(ctx, {
    x: x - 30 * s, y: y - 22 * s, s: s * 0.95, t, pose: 'lounge', eyes: 'shades', mouth: 'smile', rot: -0.42,
    over: (c, P) => {
      c.save(); c.translate(150, 40); c.rotate(0.35);
      c.fillStyle = '#BFE6F5'; c.strokeStyle = PS.ink; c.lineWidth = 6; c.beginPath(); c.moveTo(-26, -44); c.lineTo(26, -44); c.lineTo(19, 34); c.lineTo(-19, 34); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = PS.orange; c.fillRect(-20, -14, 40, 12);
      c.fillStyle = '#7CD16B'; c.beginPath(); c.arc(-14, -44, 13, 0, TAU); c.fill(); c.stroke();
      c.strokeStyle = PS.red; c.lineWidth = 7; c.beginPath(); c.moveTo(8, -44); c.lineTo(20, -84 - sip * 4); c.stroke();
      c.restore();
    },
  });
  // front frame (in front of the sitter)
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineCap = 'round';
  ctx.strokeStyle = '#A06A3D'; ctx.lineWidth = 18;
  ctx.beginPath(); ctx.moveTo(196, -140); ctx.lineTo(250, 0); ctx.moveTo(-60, -100); ctx.lineTo(-120, 0); ctx.stroke();
  ctx.restore();
}

function pointer(ctx, x, y, label, a = 1, down = 0) {
  ctx.save(); ctx.translate(x, y); ctx.globalAlpha *= a; ctx.scale(1.25 - down * 0.12, 1.25 - down * 0.12);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 34); ctx.lineTo(9, 26); ctx.lineTo(16, 41); ctx.lineTo(22, 38); ctx.lineTo(15, 23); ctx.lineTo(27, 23); ctx.closePath();
  ctx.fillStyle = '#FFFFFF'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = PS.ink; ctx.stroke();
  font(ctx, 15, 'JetBrains Mono', '800'); const tw = ctx.measureText(label).width;
  ctx.fillStyle = PS.ink; roundRect(ctx, 22, 38, tw + 14, 24, 6); ctx.fill(); ctx.fillStyle = '#FFFBF4'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(label, 29, 51);
  ctx.restore();
}

export default {
  ...S,
  sfx: [{ t: T_TOUCH, type: 'stamp', gain: 0.6 }, { t: T_RAZOR, type: 'shatter', gain: 0.6 }, { t: T_MOVE, type: 'swoosh', gain: 0.6 }],
  draw(ctx, t, s, E) {
    const lt = s.lt;
    // build every clip thumbnail once (real frames of this video), so later frames stay cheap
    if (!s.thumb && E.thumb && !this._thumbs) { for (const c of CL) if (c.th != null) E.thumb(c.th, 160, 90); this._thumbs = true; }
    // ---- timeline window zoom (ruler rescales on "timeline") ----
    const zk = ease.inOutExpo(clamp((t - T_ZOOM) / 0.3));
    const span = lerp(9.4, 20.2, zk), v0 = lerp(0.2, -0.1, zk);
    const pps = (LX1 - LX0) / span, X = (tau) => LX0 + (tau - v0) * pps;
    const beat = Math.exp(-A.since('beat', t) / 0.12);
    // ---- camera ----
    const razK = t >= T_RAZOR ? Math.exp(-(t - T_RAZOR) / 0.15) : 0;
    const zoom = 1.0 + ease.inOutQuad(lt / 2.4) * 0.07 + beat * 0.012 + (t > T_ZOOM ? 0.02 * Math.exp(-(t - T_ZOOM) / 0.2) : 0);
    ctx.save();
    cam(ctx, W / 2 + lt * 30, H / 2 + 8 + lt * 10, zoom, -0.01 + Math.sin(lt * 0.9) * 0.008);
    paperBG(ctx, PS.paper2, 1, 100);

    // ---- window ----
    ctx.fillStyle = PS.ink; roundRect(ctx, WX0 + 12, WY0 + 12, WX1 - WX0, WY1 - WY0, 18); ctx.fill();
    ctx.fillStyle = '#FFFBF4'; roundRect(ctx, WX0, WY0, WX1 - WX0, WY1 - WY0, 18); ctx.fill();
    ctx.save(); roundRect(ctx, WX0, WY0, WX1 - WX0, WY1 - WY0, 18); ctx.clip();
    ctx.fillStyle = PS.ink; ctx.fillRect(WX0, WY0, WX1 - WX0, 50);
    for (let i = 0; i < 3; i++) { ctx.fillStyle = [PS.red, PS.mustard, PS.teal][i]; ctx.beginPath(); ctx.arc(WX0 + 30 + i * 28, WY0 + 25, 9, 0, TAU); ctx.fill(); }
    font(ctx, 22, 'JetBrains Mono', '800'); ctx.fillStyle = '#FFFBF4'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('TIMELINE — one_prompt.seq', WX0 + 130, WY0 + 26);
    const ops = Math.floor((t - 24.28) * 41 + 120);
    ctx.textAlign = 'right'; ctx.fillStyle = Math.floor(t * 4) % 2 ? PS.orange : '#FFFBF4';
    ctx.fillText(`● AUTO-EDIT · ${ops} ops · hands: 0`, WX1 - 24, WY0 + 26);
    // ruler
    ctx.fillStyle = '#EFE6D4'; ctx.fillRect(WX0, WY0 + 50, WX1 - WX0, 62);
    ctx.strokeStyle = PS.ink; ctx.fillStyle = PS.ink; font(ctx, 16, 'JetBrains Mono', '700'); ctx.textAlign = 'left';
    const step = span > 14 ? 1 : 0.5;
    for (let tau = Math.ceil(v0 / step) * step; tau < v0 + span; tau += step) {
      const x = X(tau), major = Math.abs(tau - Math.round(tau)) < 1e-6 && Math.round(tau) % 2 === 0;
      ctx.lineWidth = major ? 2.5 : 1.2; ctx.beginPath(); ctx.moveTo(x, WY0 + 112); ctx.lineTo(x, WY0 + (major ? 74 : 92)); ctx.stroke();
      if (major) ctx.fillText(`00:${String(Math.round(tau)).padStart(2, '0')}:00`, x + 5, WY0 + 70);
    }
    // track headers + lanes
    TR.forEach((T, i) => {
      ctx.fillStyle = i % 2 ? '#F6EFE2' : '#F1E8D7'; ctx.fillRect(LX0 - 6, T.y, WX1 - LX0, T.h);
      ctx.fillStyle = '#E3D7C0'; ctx.fillRect(WX0, T.y, LX0 - WX0 - 10, T.h);
      font(ctx, 26, 'Anton'); ctx.fillStyle = PS.ink; ctx.textAlign = 'left'; ctx.fillText(T.n, WX0 + 18, T.y + T.h / 2);
      ctx.fillStyle = 'rgba(31,42,85,0.35)'; ctx.fillRect(WX0 + 70, T.y + T.h / 2 - 9, 18, 18); ctx.fillRect(WX0 + 98, T.y + T.h / 2 - 9, 18, 18);
    });
    // ---- clips ----
    ctx.save(); ctx.beginPath(); ctx.rect(LX0 - 6, WY0 + 112, WX1 - LX0, WY1 - WY0 - 112); ctx.clip();
    CL.forEach((c, ci) => {
      if (t < c.tIn) return;
      const st = clipState(c, t);
      let x = X(st.s), w = st.len * pps, y = trackY(st.tr) + 5, h = TR[Math.round(clamp(st.tr, 0, 5))].h - 10;
      if (c.tr === 2) h = TR[2].h - 10;
      // fly-in from above-right with trail, snap with squash
      const fi = (t - c.tIn) / 0.24;
      let ox = 0, oy = 0, sc = 1, a = 1;
      if (fi < 1 && c.tIn > 0) {
        const e = ease.outBack(fi, 1.6);
        ox = (1 - e) * (300 + hash(ci, 1) * 500); oy = (1 - e) * -(420 + hash(ci, 2) * 200); sc = lerp(1.25, 1, ease.outCubic(fi)); a = clamp(fi * 5);
        for (let g = 1; g <= 3; g++) { const e2 = ease.outBack(clamp(fi - g * 0.07), 1.6); ctx.globalAlpha = 0.18; ctx.fillStyle = c.c; roundRect(ctx, x + (1 - e2) * (300 + hash(ci, 1) * 500), y + (1 - e2) * -(420 + hash(ci, 2) * 200), w, h, 8); ctx.fill(); }
        ctx.globalAlpha = 1;
      }
      const snapK = c.tIn > 0 ? Math.max(0, wobble(t - c.tIn - 0.2, 7, 12)) : 0;
      ctx.save(); ctx.globalAlpha = a; ctx.translate(x + ox + w / 2, y + oy + h / 2); ctx.scale(sc * (1 + snapK * 0.06), sc * (1 - snapK * 0.1)); ctx.translate(-w / 2, -h / 2);
      // razor: clips crossing the cut get split
      const cutX = (RAZ - st.s) * pps, cut = t >= T_RAZOR && cutX > 4 && cutX < w - 4;
      const drawBody = (bx, bw, k) => {
        ctx.fillStyle = PS.ink; roundRect(ctx, bx + 4, 5, bw, h, 8); ctx.fill();
        ctx.fillStyle = c.c; roundRect(ctx, bx, 0, bw, h, 8); ctx.fill();
        ctx.save(); roundRect(ctx, bx, 0, bw, h, 8); ctx.clip();
        if (c.th != null && E.thumb && !s.thumb) {
          const th = E.thumb(c.th, 160, 90), tw = (h - 26) * 16 / 9;
          for (let xx = bx + 4; xx < bx + bw; xx += tw + 3) ctx.drawImage(th, xx, 22, tw, h - 26);
        }
        if (c.wave) { // the REAL song envelope
          ctx.fillStyle = 'rgba(255,251,244,0.85)';
          const mid = h / 2 + 8;
          for (let xx = bx; xx < bx + bw; xx += 3) { const tau = st.s + (xx / pps); const v = A.env('rms', 8.68 + tau * 1.0); const hh = 4 + v * (h * 0.4); ctx.fillRect(xx, mid - hh / 2, 2, hh); }
        }
        if (c.tr === 0 || c.tr === 1) { ctx.fillStyle = 'rgba(255,255,255,0.18)'; for (let xx = bx - 40; xx < bx + bw; xx += 22) { ctx.beginPath(); ctx.moveTo(xx, h); ctx.lineTo(xx + 11, h); ctx.lineTo(xx + 31, 0); ctx.lineTo(xx + 20, 0); ctx.fill(); } }
        ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(bx, 0, bw, 20);
        font(ctx, 15, 'JetBrains Mono', '800'); ctx.fillStyle = '#FFFBF4'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(c.label, bx + 8, 10);
        ctx.restore();
        ctx.lineWidth = 3; ctx.strokeStyle = PS.ink; roundRect(ctx, bx, 0, bw, h, 8); ctx.stroke();
      };
      if (cut) { const gap = 6 + razK * 18; drawBody(0, cutX - gap / 2, 0); drawBody(cutX + gap / 2, w - cutX - gap / 2, 0); }
      else drawBody(0, w, 0);
      // selection outline while being edited
      for (const [eci, t0, t1, kind] of ED) if (eci === ci && t > t0 - 0.12 && t < t1 + 0.1) { ctx.lineWidth = 5; ctx.strokeStyle = PS.red; ctx.setLineDash([10, 6]); ctx.lineDashOffset = -t * 60; roundRect(ctx, -4, -4, w + 8, h + 8, 10); ctx.stroke(); ctx.setLineDash([]); }
      ctx.restore();
      // snap guide
      if (c.tIn > 0 && t - c.tIn > 0.18 && t - c.tIn < 0.34) { ctx.strokeStyle = PS.red; ctx.lineWidth = 3; ctx.globalAlpha = 1 - (t - c.tIn - 0.18) / 0.16; ctx.beginPath(); ctx.moveTo(x, WY0 + 112); ctx.lineTo(x, WY1); ctx.stroke(); ctx.globalAlpha = 1; }
    });
    // ---- automation lane: keyframes pop on the hats ----
    const FT = TR[5], ky = (v) => FT.y + FT.h - 18 - v * (FT.h - 40);
    const kt = (i) => 24.3 + i * 0.14;
    ctx.strokeStyle = PS.red; ctx.lineWidth = 4; ctx.beginPath(); let first = true;
    KEYS.forEach(([tau, v], i) => { if (t < kt(i)) return; const x = X(tau), y = ky(v); if (first) { ctx.moveTo(x, y); first = false; } else ctx.lineTo(x, y); });
    ctx.stroke();
    KEYS.forEach(([tau, v], i) => {
      if (t < kt(i)) return; const k = ease.outBack((t - kt(i)) / 0.2, 3), x = X(tau), y = ky(v);
      ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI / 4); ctx.scale(k, k); ctx.fillStyle = i % 3 === 0 ? PS.orange : '#FFFBF4'; ctx.fillRect(-11, -11, 22, 22); ctx.lineWidth = 4; ctx.strokeStyle = PS.ink; ctx.strokeRect(-11, -11, 22, 22); ctx.restore();
    });
    font(ctx, 16, 'JetBrains Mono', '800'); ctx.fillStyle = 'rgba(31,42,85,0.6)'; ctx.textAlign = 'left'; ctx.fillText('camera.zoom  ◆ 13 keys · auto', LX0 + 10, FT.y + 16);
    // razor line
    if (t >= T_RAZOR - 0.05) {
      const rk = clamp((t - (T_RAZOR - 0.05)) / 0.05), x = X(RAZ);
      ctx.strokeStyle = PS.red; ctx.lineWidth = 5 + razK * 6; ctx.beginPath(); ctx.moveTo(x, WY0 + 112); ctx.lineTo(x, lerp(WY0 + 112, WY1, rk)); ctx.stroke();
      if (razK > 0.05) for (let i = 0; i < 26; i++) { const a = hash(i, 4) * TAU, r = (1 - razK) * (60 + hash(i, 5) * 160), yy = TR[i % 6].y + 40; ctx.fillStyle = i % 2 ? PS.orange : PS.mustard; ctx.globalAlpha = razK; ctx.fillRect(x + Math.cos(a) * r, yy + Math.sin(a) * r, 7, 7); }
      ctx.globalAlpha = 1;
    }
    // playhead (races, jumps back on the downbeat)
    const ph = t < T_RAZOR ? v0 + 0.3 + (t - 24.28) * 7.5 : v0 + 0.3 + (t - T_RAZOR) * 9.5;
    const phx = X(ph);
    ctx.fillStyle = PS.red; ctx.fillRect(phx - 2.5, WY0 + 60, 5, WY1 - WY0 - 60);
    ctx.beginPath(); ctx.moveTo(phx - 14, WY0 + 60); ctx.lineTo(phx + 14, WY0 + 60); ctx.lineTo(phx + 14, WY0 + 80); ctx.lineTo(phx, WY0 + 96); ctx.lineTo(phx - 14, WY0 + 80); ctx.closePath(); ctx.fill();
    ctx.restore();
    // ---- ghost pointers ----
    const grab = (e, k) => { const [ci, , , kind] = e, c = CL[ci], st = clipState(c, lerp(e[1], e[2], k)); const y = trackY(st.tr) + 30; if (kind === 'trimR') return [X(st.s + st.len) - 4, y]; if (kind === 'trimL') return [X(st.s) + 4, y]; return [X(st.s) + 40, y]; };
    for (let p = 0; p < 3; p++) {
      const mine = ED.filter((e) => e[5] === p).sort((a, b) => a[1] - b[1]);
      let pos = null, down = 0;
      const rest = [[1500, 900], [700, 960], [1100, 940]][p];
      for (let i = 0; i < mine.length; i++) {
        const e = mine[i];
        if (t >= e[1] && t <= e[2]) { pos = grab(e, (t - e[1]) / (e[2] - e[1])); down = 1; break; }
        const prevEnd = i > 0 ? mine[i - 1][2] : 24.0, prevP = i > 0 ? grab(mine[i - 1], 1) : rest;
        if (t > prevEnd && t < e[1]) { const k = ease.inOutCubic((t - prevEnd) / (e[1] - prevEnd)); const q = grab(e, 0); pos = [lerp(prevP[0], q[0], k), lerp(prevP[1], q[1], k) - Math.sin(k * Math.PI) * 60]; }
      }
      if (!pos) { const L = mine[mine.length - 1]; const q = grab(L, 1); const k = ease.inOutCubic(clamp((t - L[2]) / 0.4)); pos = [lerp(q[0], rest[0], k), lerp(q[1], rest[1], k)]; }
      // ghost trail
      ctx.globalAlpha = 0.35; pointer(ctx, pos[0] - 10, pos[1] + 6, ['AUTO-1', 'AUTO-2', 'AUTO-3'][p], 0.25); ctx.globalAlpha = 1;
      pointer(ctx, pos[0], pos[1], ['AUTO-1', 'AUTO-2', 'AUTO-3'][p], 0.92, down);
    }
    ctx.restore(); // window clip

    // ---- foreground: CURSOR on the deck chair ----
    lounger(ctx, t, 1560, 1030, 0.92);
    ctx.restore(); // camera

    // ---- caption: a hanging sign that flips ----
    const sk = t - 24.46;
    if (sk > 0) {
      const drop = ease.outBack(clamp(sk / 0.2), 1.4), sw = wobble(Math.max(0, t - T_TOUCH), 1.6, 2.2) * 0.12 + Math.sin(t * 2) * 0.02;
      const flip = clamp((t - T_MOVE) / 0.22), fa = Math.cos(flip * Math.PI);
      const sx = 520, sy = lerp(-200, 330, drop);
      ctx.save();
      ctx.strokeStyle = PS.ink; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(sx - 180, 0); ctx.lineTo(sx - 150 + Math.sin(sw) * 90, sy - 80); ctx.moveTo(sx + 180, 0); ctx.lineTo(sx + 150 + Math.sin(sw) * 90, sy - 80); ctx.stroke();
      ctx.translate(sx, sy - 90); ctx.rotate(sw); ctx.translate(0, 90);
      ctx.scale(Math.abs(fa) < 0.02 ? 0.02 : fa, 1);
      const back = fa < 0;
      ctx.scale(back ? -1 : 1, 1);
      ctx.fillStyle = PS.ink; ctx.fillRect(-300 + 12, -96 + 12, 600, 192);
      ctx.fillStyle = back ? PS.orange : PS.red; ctx.fillRect(-300, -96, 600, 192);
      ctx.strokeStyle = '#FFFBF4'; ctx.lineWidth = 6; ctx.strokeRect(-286, -82, 572, 164);
      if (!back) { shadowText(ctx, "DON'T TOUCH", 0, 6, { size: 116, fill: '#FFFBF4', shadow: PS.ink, off: 6 }); }
      else { shadowText(ctx, "DON'T MOVE", 0, -6, { size: 104, fill: '#FFFBF4', shadow: PS.ink, off: 6 }); font(ctx, 30, 'JetBrains Mono', '800'); ctx.fillStyle = PS.ink; ctx.fillText('— A THING —', 0, 66); }
      ctx.restore();
    }
    // ---- fx ----
    if (razK > 0.1) { E.fx.shake = 12 * razK; E.fx.rgb = 6 * razK; }
    if (sk > 0.18 && sk < 0.32) E.fx.shake = Math.max(E.fx.shake, 6);
    const ek = t - T_END; if (ek >= 0 && ek < 0.15) E.fx.zoom += 0.03 * (1 - ek / 0.15);
  },
};
