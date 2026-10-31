// B05 — "(breath)" — A tree grows.
// A blinking orange cursor drops like a seed; a stochastic, parametric L-system (A → F[+A][−A] / F[+A][A][−A], rewritten
// 9 times) is interpreted by a turtle every frame, so each branch grows from its parent's tip in fast motion while
// the whole tree sways. On the beat, ~400 cherry blossoms pop open (outBack) and petals start to drift.
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, seg, rng, buf, bctx, font, hash, rays } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { BP, glowSprite, petalSprite, sparkle } from './kit.js';

const S = shot('B05');
const T0 = S.start, BEAT = 115.31;
const BASE = [960, 905];

// ---------- the L-system ----------
let LS = null;
function lsystem() {
  if (LS) return LS;
  const r = rng(1205);
  let str = [{ c: 'A', l: 185, w: 50 }];
  for (let it = 0; it < 9; it++) {
    const out = [];
    for (const s of str) {
      if (s.c !== 'A') { out.push(s); continue; }
      const { l, w } = s;
      const three = it > 1 && r() < 0.28;
      const bend = r.range(-0.08, 0.08);
      out.push({ c: 'F', l, w, bend });
      const a1 = r.range(0.34, 0.78), a2 = r.range(0.34, 0.78);
      out.push({ c: '[' }, { c: '+', a: a1 }, { c: 'A', l: l * r.range(0.68, 0.8), w: w * 0.68 }, { c: ']' });
      if (three) out.push({ c: '[' }, { c: '+', a: r.range(-0.12, 0.12) }, { c: 'A', l: l * r.range(0.55, 0.7), w: w * 0.6 }, { c: ']' });
      out.push({ c: '[' }, { c: '-', a: a2 }, { c: 'A', l: l * r.range(0.68, 0.8), w: w * 0.68 }, { c: ']' });
    }
    str = out;
  }
  // timing pass: each F starts when its parent finishes (growth time units ∝ length)
  const stack = []; let tc = 0, depth = 0, maxT = 0;
  for (const s of str) {
    if (s.c === 'F') { s.t0 = tc; s.t1 = tc + Math.pow(s.l, 0.8); s.d = depth; tc = s.t1; maxT = Math.max(maxT, tc); }
    else if (s.c === '[') { stack.push([tc, depth]); depth++; }
    else if (s.c === ']') [tc, depth] = stack.pop();
    else if (s.c === 'A') { s.t0 = tc; s.d = depth; s.pop = r.range(0, 1); s.col = r.int(0, 3); s.rot = r.range(0, TAU); s.sz = r.range(0.75, 1.25); }
  }
  LS = { str, maxT };
  return LS;
}

function blossomSprite(k) {
  const cols = [['#FF8FB1', '#FFC2D4'], ['#FFC2D4', '#FFF4EA'], ['#FF6F9F', '#FFB3CB'], ['#FFF4EA', '#FFD9E6']];
  const c = buf('B05-bl-' + k, 72, 72), x = bctx(c);
  if (c._done) return c;
  const [a, b] = cols[k];
  x.translate(36, 36);
  for (let i = 0; i < 5; i++) {
    x.save(); x.rotate((i / 5) * TAU);
    x.beginPath(); x.moveTo(0, 0); x.bezierCurveTo(-16, -10, -14, -30, -4, -32); x.lineTo(0, -27); x.lineTo(4, -32); x.bezierCurveTo(14, -30, 16, -10, 0, 0);
    const g = x.createLinearGradient(0, 0, 0, -32); g.addColorStop(0, b); g.addColorStop(1, a);
    x.fillStyle = g; x.fill(); x.lineWidth = 2; x.strokeStyle = 'rgba(122,46,96,0.55)'; x.stroke();
    x.restore();
  }
  x.beginPath(); x.arc(0, 0, 7, 0, TAU); x.fillStyle = '#FFB000'; x.fill();
  for (let i = 0; i < 7; i++) { const a2 = (i / 7) * TAU; x.beginPath(); x.arc(Math.cos(a2) * 11, Math.sin(a2) * 11, 2.2, 0, TAU); x.fillStyle = '#E8346F'; x.fill(); }
  c._done = true; return c;
}

export default {
  ...S,
  cutIn: 'flash',
  sfx: [{ t: T0 + 0.05, type: 'pop', gain: 0.5 }, { t: BEAT, type: 'ding', gain: 0.5 }],
  draw(ctx, t, s, E) {
    const lt = t - T0, beat = A.pulse('beat', t, 0.2);
    const { str, maxT } = lsystem();
    const G = maxT * ease.inOutQuad(seg(lt, 0.07, 0.6)) * 1.0001;
    const zoom = lerp(1.85, 1.0, ease.outCubic(seg(lt, 0.0, 0.62))) + 0.04 * lt;
    const fy = lerp(800, 560, ease.outCubic(seg(lt, 0.0, 0.62)));

    // ---- sky ----
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#9C86EC'); g.addColorStop(0.35, '#E58CC8'); g.addColorStop(0.62, '#FF9F9A'); g.addColorStop(0.85, '#FFC46A');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.setTransform(zoom, 0, 0, zoom, W / 2 - 960 * zoom, H / 2 - fy * zoom + (fy - 540) * 0);
    const cam = () => ctx.setTransform(zoom, 0, 0, zoom, W / 2 - 960 * zoom, H / 2 - fy * zoom);
    cam();
    ctx.save(); ctx.globalCompositeOperation = 'soft-light';
    rays(ctx, 960, 560, 28, 2600, lt * 0.2, 'rgba(255,250,235,0.6)', 'rgba(255,250,235,0)');
    ctx.restore();
    // sun
    ctx.globalCompositeOperation = 'screen'; const sg = glowSprite('#FFE7A8', 256); ctx.drawImage(sg, 960 - 650, 560 - 650, 1300, 1300); ctx.globalCompositeOperation = 'source-over';
    { const R = 300, gg = ctx.createLinearGradient(0, 560 - R, 0, 560 + R); gg.addColorStop(0, '#FFF6D8'); gg.addColorStop(0.6, '#FFCF5A'); gg.addColorStop(1, '#FF8F6E');
      ctx.beginPath(); ctx.arc(960, 560, R * (1 + 0.015 * beat), 0, TAU); ctx.fillStyle = gg; ctx.fill(); }
    // distant hills
    ctx.fillStyle = '#C77FC6'; ctx.beginPath(); ctx.moveTo(-600, 1400); for (let x = -600; x <= 2600; x += 60) ctx.lineTo(x, 860 - 60 * (0.5 + 0.5 * Math.sin(x * 0.004 + 1))); ctx.lineTo(2600, 1400); ctx.fill();
    // hill
    ctx.beginPath(); ctx.ellipse(960, 1120, 900, 240, 0, 0, TAU);
    const hg = ctx.createLinearGradient(0, 880, 0, 1200); hg.addColorStop(0, '#FFB79A'); hg.addColorStop(1, '#FF8F86'); ctx.fillStyle = hg; ctx.fill();
    ctx.lineWidth = 8; ctx.strokeStyle = BP.ink; ctx.stroke();

    // ---- the seed: a blinking cursor drops into the hill ----
    if (lt < 0.3) {
      const fall = ease.inQuad(seg(lt, 0, 0.07)), sq = lt > 0.07 ? Math.exp(-(lt - 0.07) * 18) * Math.sin((lt - 0.07) * 50) * 0.3 : 0;
      const sy = lerp(760, BASE[1] - 34, fall), a = 1 - seg(lt, 0.16, 0.3);
      ctx.save(); ctx.globalAlpha = a; ctx.translate(BASE[0], sy + 34); ctx.scale(1 + sq, 1 - sq);
      ctx.fillStyle = BP.orange; ctx.fillRect(-20, -68, 40, 68); ctx.lineWidth = 5; ctx.strokeStyle = BP.ink; ctx.strokeRect(-20, -68, 40, 68);
      ctx.restore();
      if (lt > 0.07) { const k = seg(lt, 0.07, 0.3); ctx.globalAlpha = 1 - k; ctx.lineWidth = 10 * (1 - k); ctx.strokeStyle = '#FFF4EA'; ctx.beginPath(); ctx.ellipse(BASE[0], BASE[1], 40 + k * 260, 10 + k * 60, 0, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1; }
    }

    // ---- turtle interpretation (every frame: growth + sway) ----
    const segs = [], blos = [];
    const stack = []; let x = BASE[0], y = BASE[1], ang = -Math.PI / 2, tc = 0;
    for (const sy of str) {
      switch (sy.c) {
        case 'F': {
          if (G <= sy.t0) { tc = 1e9; break; }
          const gr = clamp((G - sy.t0) / (sy.t1 - sy.t0));
          const sway = Math.sin(t * 2.3 + sy.d * 0.45) * 0.012 * sy.d + Math.sin(t * 5.1 + sy.d) * 0.004 * sy.d;
          // gentle upward tropism
          ang += sy.bend + sway; ang += (-Math.PI / 2 - ang) * 0.028;
          const L = sy.l * ease.outQuad(gr);
          const nx = x + Math.cos(ang) * L, ny = y + Math.sin(ang) * L;
          segs.push(x, y, nx, ny, sy.w * lerp(0.5, 1, gr), sy.d);
          x = nx; y = ny; tc = gr >= 1 ? sy.t1 : 1e9;
          break;
        }
        case '[': stack.push([x, y, ang, tc]); break;
        case ']': [x, y, ang, tc] = stack.pop(); break;
        case '+': ang -= sy.a; break;
        case '-': ang += sy.a; break;
        case 'A': if (tc < 1e8 && G >= sy.t0) blos.push(x, y, sy); break;
      }
    }
    // branches: dark plum body + warm rim light
    ctx.lineCap = 'round';
    for (let i = 0; i < segs.length; i += 6) {
      ctx.lineWidth = segs[i + 4] + 7; ctx.strokeStyle = BP.ink;
      ctx.beginPath(); ctx.moveTo(segs[i], segs[i + 1]); ctx.lineTo(segs[i + 2], segs[i + 3]); ctx.stroke();
    }
    for (let i = 0; i < segs.length; i += 6) {
      ctx.lineWidth = segs[i + 4]; ctx.strokeStyle = '#5B2F6E';
      ctx.beginPath(); ctx.moveTo(segs[i], segs[i + 1]); ctx.lineTo(segs[i + 2], segs[i + 3]); ctx.stroke();
    }
    for (let i = 0; i < segs.length; i += 6) {
      if (segs[i + 4] < 5) continue;
      const w = segs[i + 4];
      ctx.lineWidth = w * 0.28; ctx.strokeStyle = '#B06A9E';
      ctx.beginPath(); ctx.moveTo(segs[i] + w * 0.22, segs[i + 1]); ctx.lineTo(segs[i + 2] + w * 0.22, segs[i + 3]); ctx.stroke();
    }

    // ---- blossoms pop ----
    const popBase = 0.44;
    for (let i = 0; i < blos.length; i += 3) {
      const bx = blos[i], by = blos[i + 1], b = blos[i + 2];
      const tp = popBase + b.pop * 0.28 - (b.d < 7 ? 0.05 : 0);
      const k = ease.outBack(seg(lt, tp, tp + 0.14), 2.6);
      if (k <= 0) continue;
      const sp = blossomSprite(b.col), sz = 46 * b.sz * k * (1 + 0.08 * beat);
      ctx.save(); ctx.translate(bx, by); ctx.rotate(b.rot + lt * 0.4);
      ctx.drawImage(sp, -sz / 2, -sz / 2, sz, sz); ctx.restore();
      if (lt - tp < 0.12 && lt > tp) { const q = (lt - tp) / 0.12; ctx.globalAlpha = 1 - q; ctx.fillStyle = '#FFF4EA'; sparkle(ctx, bx, by, 10 + 30 * q, 0.3); ctx.fill(); ctx.globalAlpha = 1; }
    }
    // a few petals already letting go
    for (let i = 0; i < 40; i++) {
      const t0 = 0.62 + hash(i, 4) * 0.3, a = lt - t0; if (a <= 0) continue;
      const bx = 960 + (hash(i, 5) - 0.5) * 1100, by = 300 + hash(i, 6) * 280;
      const px = bx + a * 160 + Math.sin(a * 6 + i) * 30, py = by + a * 140;
      const sp = petalSprite(['#FF8FB1', '#FFC2D4', '#FFF4EA'][i % 3], 0, 96);
      ctx.save(); ctx.translate(px, py); ctx.rotate(a * 4 + i); ctx.scale(0.32, 0.32 * Math.cos(a * 7 + i)); ctx.drawImage(sp, -48, -48); ctx.restore();
    }

    // ---- caption ----
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const kc = seg(lt, 0.32, 0.72);
    if (kc > 0) {
      ctx.save(); font(ctx, 96, 'Caveat', '700'); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      const L1 = 'from one', L2 = 'little prompt…', x0 = 1790, y0 = 300;
      const w2 = ctx.measureText(L2).width;
      ctx.textAlign = 'right';
      ctx.beginPath(); ctx.rect(x0 - w2 - 30, y0 - 100, (w2 + 60) * ease.outCubic(kc), 260); ctx.clip();
      ctx.save(); ctx.translate(x0, y0); ctx.rotate(-0.05);
      ctx.fillStyle = '#7A2E60'; ctx.fillText(L1, 4, 5); ctx.fillText(L2, 4, 95);
      ctx.fillStyle = '#FFF4EA'; ctx.fillText(L1, 0, 0); ctx.fillText(L2, 0, 90);
      ctx.restore();
      ctx.restore();
    }
    E.fx.bloom = 0.25 + 0.3 * A.pulse('beat', t, 0.3); E.fx.bloomThreshold = 0.85;
    if (lt > 0.07 && lt < 0.15) E.fx.shake = 6 * (1 - (lt - 0.07) / 0.08);
  },
};
