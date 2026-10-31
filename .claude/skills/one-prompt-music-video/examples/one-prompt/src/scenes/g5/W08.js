// W08 — "Download it," — a Win95 download dialog: the progress bar fills 0→100 % in a blink on "Download",
// keeps going (150… 200… 300 %), bursts through the window frame (cracks) and the whole dialog SHATTERS into
// tumbling glass-like shards (the dialog is rendered once to a buffer, then drawn clipped per shard).
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, rng, font, buf, bctx, hash } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { C, slam, hit, kick, win95, bevel, grid, shardsFor, speedLines, pointer } from './_g5.js';

const S = shot('W08');
const T0 = S.start;
const T_DL = 67.64, T_FULL = 67.72, T_BREAK = 67.87;
const DX = 440, DY = 330, DW = 1040, DH = 470;          // dialog rect
const BX = DX + 40, BY = DY + 300, BW = DW - 80, BHt = 64; // progress field

function pct(t) {
  if (t < T_DL) return 0;
  if (t < T_FULL) return 100 * ease.inQuad((t - T_DL) / (T_FULL - T_DL));
  return 100 + 200 * ease.inQuad(clamp((t - T_FULL) / (T_BREAK - T_FULL)));
}

function drawDialog(x, t, lt, p) {
  // draws the dialog in its own buffer coords (0,0 = dialog top-left, + margin for shadow)
  x.clearRect(0, 0, DW + 40, DH + 40);
  win95(x, 0, 0, DW, DH, 'Downloading skill.zip', { tb: 50, font: 26 });
  // folders + flying paper (classic copy animation)
  const fx0 = 90, fx1 = DW - 170, fy = 110;
  const folder = (fx, open) => { x.fillStyle = '#FFD23F'; x.fillRect(fx, fy, 90, 66); x.fillRect(fx, fy - 10, 40, 12); x.strokeStyle = C.black; x.lineWidth = 4; x.strokeRect(fx, fy, 90, 66); if (open) { x.fillStyle = '#FFE680'; x.beginPath(); x.moveTo(fx - 6, fy + 66); x.lineTo(fx + 14, fy + 22); x.lineTo(fx + 104, fy + 22); x.lineTo(fx + 90, fy + 66); x.closePath(); x.fill(); x.stroke(); } };
  // globe as source
  x.fillStyle = C.blue; x.beginPath(); x.arc(fx0 + 40, fy + 30, 38, 0, TAU); x.fill(); x.strokeStyle = C.black; x.lineWidth = 4; x.stroke();
  x.strokeStyle = '#fff'; x.lineWidth = 3; x.beginPath(); x.ellipse(fx0 + 40, fy + 30, 16, 38, 0, 0, TAU); x.moveTo(fx0 + 2, fy + 30); x.lineTo(fx0 + 78, fy + 30); x.stroke();
  folder(fx1, true);
  const speed = 2 + p / 30;
  for (let k = 0; k < 3; k++) {
    const u = ((lt * speed + k / 3) % 1);
    const px = lerp(fx0 + 80, fx1 + 20, u), py = fy + 10 - Math.sin(u * Math.PI) * 80;
    x.save(); x.translate(px, py); x.rotate(Math.sin(u * TAU) * 0.6); x.fillStyle = '#fff'; x.fillRect(-16, -20, 32, 40); x.strokeStyle = C.black; x.lineWidth = 3; x.strokeRect(-16, -20, 32, 40);
    x.fillStyle = C.blue; for (let l = 0; l < 4; l++) x.fillRect(-10, -12 + l * 8, 20, 3); x.restore();
  }
  // texts
  x.fillStyle = C.black; x.textAlign = 'left'; x.textBaseline = 'middle';
  font(x, 26, 'JetBrains Mono', '700'); x.fillText('Saving:  skill.zip  from  claude.local', 40, 222);
  font(x, 22, 'JetBrains Mono', '600'); x.fillStyle = '#333';
  x.fillText(p > 100 ? 'Estimated time left:  -3 sec  (∞ KB/s)  ?!' : `Estimated time left:  0 sec  (${(p * 31.3).toFixed(0)} KB/s)`, 40, 258);
  // progress field
  bevel(x, BX - DX, BY - DY, BW, BHt, true, '#FFFFFF', 3);
  // buttons
  bevel(x, DW - 210, DH - 66, 170, 46, false, C.grey, 3);
  x.fillStyle = C.black; font(x, 24, 'JetBrains Mono', '800'); x.textAlign = 'center'; x.fillText('Cancel', DW - 125, DH - 42);
  x.textAlign = 'left'; font(x, 22, 'JetBrains Mono', '700'); x.fillText('☐ Close this dialog box when download completes', 40, DH - 42);
}

function blocks(ctx, t, p, ox, oy, clipToField) {
  const bw = 30, gap = 6, n = Math.floor((BW - 8) * (p / 100) / (bw + gap));
  for (let i = 0; i < n; i++) {
    const x = BX + 6 + i * (bw + gap) + ox, y = BY + 7 + oy;
    const out = x + bw > BX + BW - 4;
    if (clipToField && out) break;
    if (!clipToField && !out) continue;
    const jit = out ? (hash(i, Math.floor(t * 30)) - 0.5) * 10 * clamp((p - 100) / 100) : 0;
    if (out) { ctx.fillStyle = C.black; ctx.fillRect(x + 6, y + 6 + jit, bw, BHt - 14); }
    ctx.fillStyle = out ? (i % 2 ? C.red : C.blue) : C.blue; ctx.fillRect(x, y + jit, bw, BHt - 14);
    if (out) { ctx.strokeStyle = C.black; ctx.lineWidth = 3; ctx.strokeRect(x, y + jit, bw, BHt - 14); }
  }
}

let SH = null;
export default {
  ...S,
  cutIn: 'glitch',
  sfx: [{ t: 67.64, type: 'click', gain: 0.7 }, { t: 67.72, type: 'riser', gain: 0.5 }, { t: 67.87, type: 'shatter', gain: 1 }],
  draw(ctx, t, s, E) {
    const lt = s.lt;
    const p = pct(t);
    const br = t - T_BREAK;
    const bp = A.pulse('beat', t, 0.15);
    // background desktop
    ctx.fillStyle = C.blue; ctx.fillRect(0, 0, W, H);
    grid(ctx, 80, 'rgba(255,255,255,0.15)', 2, lt * 60, 0);
    // giant DOWNLOAD behind: outline before, solid after break
    const dk = hit(t, T_DL, 0.16);
    if (br < 0) {
      ctx.save(); font(ctx, 300, 'Anton'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.globalAlpha = 0.9; ctx.lineWidth = 5; ctx.strokeStyle = '#fff'; ctx.translate(W / 2, 215); ctx.scale(0.82 + 0.1 * dk, 0.82 + 0.1 * dk); ctx.strokeText('DOWNLOAD', 0, 0);
      if (t > T_DL) { ctx.beginPath(); ctx.rect(-800, -200, 1600 * (p / 300), 400); ctx.clip(); ctx.fillStyle = '#fff'; ctx.fillText('DOWNLOAD', 0, 0); }
      ctx.restore();
    } else {
      const k = ease.outBack(clamp(br / 0.18));
      speedLines(ctx, W / 2, H / 2, 60, 380, 1500, 21 + (E.frame % 2), 'rgba(255,255,255,0.35)', 0.025);
      slam(ctx, 'DOWNLOAD', W / 2, H / 2 - 10, 330, { fill: C.white, shadow: C.black, sx: 18, sy: 18, scale: 0.6 + 0.4 * k + kick(t, T_BREAK, 0.1) * 0.1, rot: -0.04, maxW: 1700 });
      slam(ctx, 'IT.', W / 2 + 620, H / 2 + 220, 150, { fill: C.red, shadow: C.black, sx: 10, sy: 10, scale: hit(t, T_BREAK + 0.06, 0.15), rot: 0.08 });
    }

    // dialog buffer
    const db = buf('W08-dialog', DW + 40, DH + 40), dx = bctx(db);
    drawDialog(dx, t, lt, Math.min(p, 100));
    blocks(dx, t, Math.min(p, 100), -DX, -DY, true);
    const pop = ease.outBack(clamp(lt / 0.12));
    const shake = p > 100 && br < 0 ? (p - 100) / 200 : 0;
    const sx = (hash(E.frame, 3) - 0.5) * 24 * shake, sy = (hash(E.frame, 5) - 0.5) * 24 * shake;
    if (br < 0) {
      ctx.save(); ctx.translate(W / 2 + sx, H / 2 + 60 + sy); ctx.scale((0.75 + 0.25 * pop) * 1.1, (0.75 + 0.25 * pop) * 1.1); ctx.translate(-W / 2, -(H / 2 + 60));
      ctx.drawImage(db, DX, DY);
      // cracks spreading from the right frame where the bar is punching through
      if (p > 100) {
        const ck = clamp((p - 100) / 200), r = rng(9);
        ctx.strokeStyle = C.black; ctx.lineWidth = 4; ctx.beginPath();
        for (let c = 0; c < 9; c++) { let x = DX + DW - 4, y = BY + BHt / 2; ctx.moveTo(x, y); const a = Math.PI + r.range(-1.3, 1.3); for (let k = 0; k < 6 * ck; k++) { x += Math.cos(a + r.range(-0.5, 0.5)) * 50; y += Math.sin(a + r.range(-0.5, 0.5)) * 50; ctx.lineTo(x, y); } }
        ctx.stroke();
      }
      ctx.restore();
      // overflowing blocks burst out past the frame
      ctx.save(); ctx.translate(W / 2 + sx, H / 2 + 60 + sy); ctx.scale(1.1, 1.1); ctx.translate(-W / 2, -(H / 2 + 60)); blocks(ctx, t, p, 0, 0, false); ctx.restore();
      // percent counter
      if (t > T_DL) {
        const big = p > 100;
        slam(ctx, `${Math.floor(p)}%`, big ? DX + DW - 130 : BX + BW - 90, BY - 60, big ? 120 + (p - 100) * 0.5 : 64, { fill: big ? C.red : C.black, shadow: big ? C.black : null, sx: 8, sy: 8, rot: big ? -0.06 : 0, family: 'Anton' });
      }
      // the click
      if (t < T_DL + 0.12) pointer(ctx, 1290 - (1 - ease.outExpo(clamp(lt / 0.15))) * 300, 780, 1.6 * (t > T_DL && t < T_DL + 0.06 ? 0.85 : 1));
    } else {
      // SHATTER
      if (!SH) SH = shardsFor(81, DX, DY, DW, DH, 9, 5, 0.42);
      const ix = DX + DW, iy = BY + BHt / 2;
      const r = rng(17);
      for (const sh of SH) {
        const dxv = sh.cx - ix, dyv = sh.cy - iy, d = Math.hypot(dxv, dyv) || 1;
        const sp = r.range(700, 1500) * (0.5 + 600 / (d + 300));
        const vx = (dxv / d) * sp + r.range(-200, 200), vy = (dyv / d) * sp - r.range(200, 700);
        const tt = br * 1.35, zs = 1 + tt * r.range(0.2, 2.6);
        const ox = vx * tt, oy = vy * tt + 2600 * tt * tt, rot = r.range(-9, 9) * tt, flip = Math.cos(tt * r.range(4, 14));
        ctx.save();
        ctx.translate(W / 2, H / 2 + 60); ctx.scale(1.1, 1.1); ctx.translate(-W / 2, -(H / 2 + 60));
        ctx.translate(sh.cx + ox * zs, sh.cy + oy * zs); ctx.rotate(rot); ctx.scale(flip * zs, zs); ctx.translate(-sh.cx, -sh.cy);
        ctx.beginPath(); ctx.moveTo(...sh.pts[0]); ctx.lineTo(...sh.pts[1]); ctx.lineTo(...sh.pts[2]); ctx.closePath();
        ctx.save(); ctx.clip(); ctx.drawImage(db, DX, DY); ctx.restore();
        ctx.lineWidth = 3; ctx.strokeStyle = C.black; ctx.stroke();
        ctx.restore();
      }
      // the bar becomes a beam that shoots off the right edge
      const head = BX + (W + 600 - BX) * ease.outExpo(clamp(br / 0.18)), tail = BX + (W + 600 - BX) * ease.inQuad(clamp(br / 0.3));
      if (tail < W) {
        ctx.fillStyle = C.black; ctx.fillRect(tail + 10, BY + 16, head - tail, BHt - 14);
        ctx.fillStyle = C.red; ctx.fillRect(tail, BY + 6, head - tail, BHt - 14);
        ctx.fillStyle = C.white; ctx.fillRect(tail, BY + 20, head - tail, 8);
      }
      slam(ctx, '300%', 1500, 300, 150, { fill: C.red, shadow: C.black, sx: 9, sy: 9, rot: 0.1, scale: hit(t, T_BREAK, 0.12) });
    }

    const bk = kick(t, T_BREAK, 0.12);
    E.fx.shake = 26 * bk + 10 * shake + 6 * kick(t, T_DL, 0.08) + 3 * bp;
    E.fx.rgb = 12 * bk + 6 * shake;
    E.fx.zoom += 0.05 * bk;
    if (br > 0 && br < 0.04) E.fx.flash = [1, 1, 1, 0.55];
    E.fx.glitch = shake * 0.25; E.fx.glitchSeed = E.frame;
    E.fx.vignette = 0.18;
  },
};
