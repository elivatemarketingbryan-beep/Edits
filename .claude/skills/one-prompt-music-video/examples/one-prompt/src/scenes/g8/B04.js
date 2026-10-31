// B04 — "you've been saying" — Phone-light crowd.
// 2,128 tiny people on a field at dusk, each holding up a phone light, swaying on the beat. A hand-rolled
// perspective camera cranes from eye level behind the crowd to straight overhead; the lights switch on in a
// wave from the centre and, seen from above, the crowd spells a heart + THANK YOU back at us.
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, seg, rng, buf, bctx, font, hash, mixHex, heart } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { glowSprite, sparkle } from './kit.js';

const S = { ...shot('B04'), start: 113.2 };
const T0 = S.start, REVEAL = 113.92, DOWN = 114.1;
const COLS = 76, ROWS = 28, SP = 0.8, F = 1158;

let CROWD = null;
function crowd() {
  if (CROWD) return CROWD;
  // the message, rasterised at exactly one pixel per person
  const m = buf('read-B04-mask', COLS, ROWS), x = bctx(m);
  x.clearRect(0, 0, COLS, ROWS); x.fillStyle = '#f00';
  heart(x, COLS / 2, 11.2, 9.6); x.fill();
  // THANK YOU in a hand-made 5×7 dot font (one dot = one person)
  const G5 = {
    T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'], H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
    A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'], N: ['#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#', '#...#'],
    K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'], Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
    O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'], U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'], ' ': Array(7).fill('...'),
  };
  const msg = 'THANK YOU', widths = [...msg].map((ch) => G5[ch][0].length);
  const total = widths.reduce((a, b) => a + b, 0) + (msg.length - 1);
  let gx = Math.round((COLS - total) / 2); x.fillStyle = '#0f0';
  for (const ch of msg) { const g = G5[ch]; g.forEach((row, ry) => [...row].forEach((c, rx) => { if (c === '#') x.fillRect(gx + rx, 19 + ry, 1, 1); })); gx += g[0].length + 1; }
  const d = x.getImageData(0, 0, COLS, ROWS).data;
  const r = rng(414), P = [];
  for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) {
    const k = (j * COLS + i) * 4, isH = d[k] > 110 && d[k + 3] > 110, isT = d[k + 1] > 110 && d[k + 3] > 110;
    P.push({
      x: (i - (COLS - 1) / 2) * SP + r.range(-0.12, 0.12), z: (j - (ROWS - 1) / 2) * SP + r.range(-0.12, 0.12),
      h: r.range(1.55, 1.85), kind: isH ? 1 : isT ? 2 : 0, ph: r.range(0, TAU), tw: r.range(2, 7), col: r.pick(['#FFE7A8', '#FFC2D4', '#FFF4EA', '#C9B6FF', '#FFB38A']),
      dist: Math.hypot(i - COLS / 2, (j - ROWS / 2) * 1.4),
    });
  }
  CROWD = P; return P;
}

function camera(t) {
  const u = seg(t, T0 + 0.05, REVEAL + 0.06);
  const eh = ease.inOutCubic(u), ep = ease.inOutQuad(u);
  const hold = seg(t, REVEAL, S.end + 0.1);
  return {
    x: Math.sin(t * 0.8) * 0.6 * (1 - eh), y: lerp(1.5, 40.5, eh) + hold * 2.2, z: lerp(15.2, 0.0, ease.inOutCubic(u)),
    pitch: lerp(-0.05, -Math.PI / 2, ep), roll: 0.25 * (1 - ep) * Math.sin(Math.PI * u) + 0.012 * Math.sin(t * 2),
  };
}

export default {
  ...S,
  hud: 'paper',
  cutIn: 'punch',
  sfx: [{ t: T0 + 0.05, type: 'riser', gain: 0.5 }, { t: DOWN, type: 'ding', gain: 0.6 }],
  draw(ctx, t, s, E) {
    const P = crowd(), cam = camera(t);
    const cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch), cr = Math.cos(cam.roll), sr = Math.sin(cam.roll);
    const beat = A.pulse('beat', t, 0.25), down = t > DOWN ? Math.exp(-(t - DOWN) * 3) : 0;
    const proj = (X, Y, Z) => {
      const dx = X - cam.x, dy = Y - cam.y, dz = Z - cam.z;
      const yc = dy * cp + dz * sp, zc = dy * sp - dz * cp;
      if (zc < 0.15) return null;
      const k = F / zc, sx = dx * k, sy = -yc * k;
      return [W / 2 + sx * cr - sy * sr, H / 2 + sx * sr + sy * cr, k, zc];
    };

    // ---- sky / ground ----
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#1B1030'; ctx.fillRect(0, 0, W, H);
    const hz = H / 2 + F * Math.tan(cam.pitch);
    if (hz > -400) {
      ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(cam.roll); ctx.translate(-W / 2, -H / 2);
      const top = hz - 1100;
      const g = ctx.createLinearGradient(0, top, 0, hz);
      g.addColorStop(0, '#22184A'); g.addColorStop(0.45, '#4B2E7E'); g.addColorStop(0.78, '#B4528E'); g.addColorStop(0.93, '#FF8A6E'); g.addColorStop(1, '#FFB27A');
      ctx.fillStyle = g; ctx.fillRect(-300, top - 400, W + 600, hz - top + 400);
      ctx.fillStyle = '#22184A'; ctx.fillRect(-300, top - 1400, W + 600, 1001);
      ctx.fillStyle = '#FFF4EA';
      for (let i = 0; i < 70; i++) { const sx = hash(i, 1) * (W + 400) - 200, sy = hz - 120 - hash(i, 2) * 900; ctx.globalAlpha = 0.25 + 0.6 * hash(i, 3) * (0.6 + 0.4 * Math.sin(t * 5 + i)); ctx.fillRect(sx, sy, 3, 3); }
      ctx.globalAlpha = 1;
      const sg = glowSprite('#FF9A7A', 256); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 0.8; ctx.drawImage(sg, W / 2 - 900, hz - 380, 1800, 700); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#2A1840'; ctx.beginPath(); ctx.moveTo(-300, hz + 2);
      for (let i = 0; i <= 60; i++) { const xx = -300 + i * ((W + 600) / 60); const hh = 14 + hash(i, 7) * 60 * (hash(i, 8) > 0.6 ? 1.8 : 0.6); ctx.lineTo(xx, hz - hh); ctx.lineTo(xx + (W + 600) / 60, hz - hh); }
      ctx.lineTo(W + 300, hz + 2); ctx.closePath(); ctx.fill();
      ctx.globalCompositeOperation = 'lighter';
      for (let b = 0; b < 4; b++) {
        const bx = W / 2 + (b - 1.5) * 380, ang = -Math.PI / 2 + Math.sin(t * 1.6 + b * 1.7) * 0.5;
        const bg = ctx.createLinearGradient(bx, hz, bx + Math.cos(ang) * 1200, hz + Math.sin(ang) * 1200);
        bg.addColorStop(0, 'rgba(255,190,220,0.22)'); bg.addColorStop(1, 'rgba(255,190,220,0)');
        ctx.fillStyle = bg; ctx.beginPath(); ctx.moveTo(bx, hz); ctx.lineTo(bx + Math.cos(ang - 0.07) * 1300, hz + Math.sin(ang - 0.07) * 1300); ctx.lineTo(bx + Math.cos(ang + 0.07) * 1300, hz + Math.sin(ang + 0.07) * 1300); ctx.closePath(); ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
      const gg = ctx.createLinearGradient(0, hz, 0, hz + 700); gg.addColorStop(0, '#3A2352'); gg.addColorStop(1, '#1B1030');
      ctx.fillStyle = gg; ctx.fillRect(-300, hz, W + 600, H + 900);
      ctx.restore();
    }
    {
      const c0 = proj(0, 0, 0);
      if (c0) { const gs = glowSprite('#7A3E8E', 256); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 0.55 * seg(cam.y, 6, 30); const R = 40 * c0[2]; ctx.drawImage(gs, c0[0] - R, c0[1] - R * 0.6, 2 * R, 1.2 * R); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
    }

    // ---- crowd ----
    const sway = (p) => Math.sin(TAU * (t / 1.2) + p.x * 0.22 + p.ph * 0.15) * 0.2;
    const L = [];
    for (const p of P) {
      const ph = p.h + 0.38, sx = sway(p);
      const feet = proj(p.x, 0, p.z); if (!feet) continue;
      const sh = proj(p.x, p.h * 0.8, p.z), hd = proj(p.x, p.h * 0.93, p.z), ph2 = proj(p.x + 0.12 + sx, ph, p.z);
      if (!sh || !hd || !ph2) continue;
      if (Math.max(feet[0], hd[0]) < -200 || Math.min(feet[0], hd[0]) > W + 200 || Math.max(feet[1], hd[1]) < -200 || Math.min(feet[1], hd[1]) > H + 300) continue;
      L.push([feet[3], p, feet, sh, hd, ph2]);
    }
    L.sort((a, b) => b[0] - a[0]);
    const lightGlow = glowSprite('#FFFFFF', 64);
    const SL = 14, per = Math.ceil(L.length / SL);
    const topView = seg(cam.y, 8, 30);
    for (let sI = 0; sI < SL; sI++) {
      const part = L.slice(sI * per, (sI + 1) * per); if (!part.length) continue;
      const fogK = clamp(part[0][0] / 26);
      ctx.fillStyle = mixHex('#140A22', '#5A3A7E', fogK * (1 - topView));
      ctx.beginPath();
      for (const [, , ft, sh, hd, ph] of part) {
        const k = ft[2], bw = 0.24 * k, sw = 0.21 * sh[2];
        ctx.moveTo(ft[0] - bw * 0.7, ft[1]); ctx.lineTo(sh[0] - sw, sh[1]); ctx.lineTo(sh[0] + sw, sh[1]); ctx.lineTo(ft[0] + bw * 0.7, ft[1]); ctx.closePath();
        const hr = 0.115 * hd[2]; ctx.moveTo(hd[0] + hr, hd[1]); ctx.arc(hd[0], hd[1], hr, 0, TAU);
        const aw = 0.05 * sh[2]; ctx.moveTo(sh[0] + sw * 0.6, sh[1]); ctx.lineTo(ph[0] + aw, ph[1]); ctx.lineTo(ph[0] - aw, ph[1]); ctx.lineTo(sh[0] + sw * 0.2, sh[1]); ctx.closePath();
      }
      ctx.fill();
      ctx.globalCompositeOperation = 'lighter';
      for (const [, p, , , , ph] of part) {
        const k = ph[2];
        const on = clamp((t - (113.5 + p.dist * 0.0105)) / 0.12);
        let col = p.col, inten = 0.7 + 0.3 * Math.sin(t * p.tw + p.ph), sz = 0.62;
        if (on > 0) {
          if (p.kind === 1) { col = '#FF4F8B'; inten = lerp(inten, 1, on); sz = lerp(sz, 0.62, on); }
          else if (p.kind === 2) { col = '#FFC85A'; inten = lerp(inten, 1, on); sz = lerp(sz, 0.62, on); }
          else { col = '#7B68D8'; inten = lerp(inten, 0.3, on); sz = lerp(sz, 0.5, on); }
        }
        if (p.kind && on > 0) { inten *= 1 + 0.5 * down + (p.kind === 1 ? 0.45 : 0.15) * beat; sz *= 1 + 0.25 * down + (p.kind === 1 ? 0.12 * beat : 0); }
        else if (on > 0) { // a stadium wave runs through the crowd on every beat
          const bt = A.beat(t), wx = lerp(-34, 34, bt.phase), wv = Math.exp(-(((p.x - wx) / 2.6) ** 2));
          inten += 0.55 * wv * on; sz *= 1 + 0.35 * wv;
        }
        let R = sz * k;
        if (R < 9) { inten *= (R / 9) ** 2; R = 9; }
        inten *= lerp(0.26, 1, topView);
        R = Math.min(R, 200);
        ctx.globalAlpha = clamp(inten * 0.8);
        ctx.drawImage(glowSprite(col, 64, 0.2), ph[0] - R, ph[1] - R, 2 * R, 2 * R);
        const rc = Math.max(1.2, R * 0.2);
        ctx.globalAlpha = clamp(inten * 0.85); ctx.drawImage(lightGlow, ph[0] - rc * 2, ph[1] - rc * 2, rc * 4, rc * 4);
      }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    }
    ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < 26; i++) {
      const tf = T0 + hash(i, 5) * 1.5, a = t - tf; if (a < 0 || a > 0.1) continue;
      const p = P[Math.floor(hash(i, 6) * P.length)], q = proj(p.x, p.h + 0.4, p.z); if (!q) continue;
      const R = clamp(1.6 * q[2], 10, 260) * (1 - a / 0.1);
      sparkle(ctx, q[0], q[1], R, 0.4); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';

    const kc = ease.outExpo(seg(t, REVEAL + 0.02, REVEAL + 0.3));
    if (kc > 0) {
      ctx.save(); ctx.globalAlpha = kc; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      font(ctx, 30, 'JetBrains Mono', '700'); ctx.fillStyle = 'rgba(255,244,234,0.85)';
      ctx.fillText(`${P.length.toLocaleString('en-US')} PEOPLE · ${P.length.toLocaleString('en-US')} LIGHTS · 1 MESSAGE`, W / 2, 150 + (1 - kc) * 20);
      ctx.restore();
    }

    E.fx.bloom = 0.15 + 0.15 * topView + 0.6 * down; E.fx.bloomThreshold = 0.7;
    E.fx.vignette = 0.45;
    if (down > 0) E.fx.zoom += 0.02 * down;
  },
};
