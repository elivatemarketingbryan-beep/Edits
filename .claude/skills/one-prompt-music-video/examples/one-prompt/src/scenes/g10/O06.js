// O06 — (end) — END CARD. The plain cursor left by O05 types the title itself ("> ONE PROMPT", centre-aligned so
// the cursor rides the end of the line), the lockup lifts, and the credits decode in line by line (glyph
// scramble → text): LOCAL CUT · made 100% in code by Claude Opus 5.5 · 0 AI-generated pixels · $0 · the skill is
// free — link in description · SUBSCRIBE. Tasteful continuous motion: breathing dawn light, slow push, glints and
// letter ripples on the downbeats, the bell nudging on beats. On the final snares the whole card deletes itself
// back into the cursor; the last second is black with only the cursor blinking.
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, seg, hash, font, roundRect, wobble } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { softRays, motes, inOutSine, spaced } from './common.js';
import { END_BLOCK, cursorOn } from './O05.js';

const S = shot('O06');
const T0 = S.start;                // 157.27
const BLACK = 164.0;
const MONO = 'JetBrains Mono';
const TITLE = 'ONE PROMPT', PROMPT = '> ', TS = 196;
const TYPE0 = 157.34, DT = 0.072;
const LIFT = [158.25, 158.75];
const LINES = [
  { t: 158.7, key: 'cut' },
  { t: 159.05, key: 'made' },
  { t: 159.45, key: 'zero' },
  { t: 159.85, key: 'free' },
];
const SUB_T = 160.3;
const DEL = { lines: 163.0, cut: 163.36, title: 163.5, titleEnd: 163.9 };
const GLYPHS = '01<>/{}[]#$%&*+=;:_~^';

function scramble(str, t, t0, dur = 0.42) {
  if (t < t0) return '';
  let out = '';
  const n = str.length;
  for (let i = 0; i < n; i++) {
    const ti = t0 + (i / n) * dur * 0.6;
    if (t < ti) break;
    const settle = ti + 0.12;
    out += t >= settle || str[i] === ' ' ? str[i] : GLYPHS[Math.floor(hash(i, Math.floor(t * 30)) * GLYPHS.length)];
  }
  return out;
}
/** characters left after a right-to-left delete that starts at d0 */
const kept = (len, t, d0, rate = 70) => (t < d0 ? len : Math.max(0, len - Math.floor((t - d0) * rate)));

export default {
  ...S,
  cutIn: 'none',
  hud: 'ink',
  sfx: [{ t: 157.34, type: 'type', gain: 0.6 }, { t: 158.7, type: 'tick', gain: 0.4 }, { t: SUB_T, type: 'pop', gain: 0.7 }, { t: 163.0, type: 'glitch', gain: 0.5 }, { t: 163.5, type: 'type', gain: 0.5 }, { t: BLACK, type: 'click', gain: 0.6 }],
  draw(ctx, t, s, E) {
    const lt = t - T0;
    if (!s.thumb) this.hud = t >= BLACK - 0.05 ? 'none' : 'ink';
    const hit = A.pulse('beat', t, 0.22), down = A.pulse('down', t, 0.5);

    // ---------- final second: black + cursor ----------
    if (t >= BLACK) {
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
      const u = t - BLACK;
      const on = u < 0.32 || (u >= 0.55 && u < 0.85) || u >= 0.95;
      if (on) {
        const { x, y, w, h } = END_BLOCK;
        ctx.save(); ctx.shadowColor = 'rgba(255,106,31,0.9)'; ctx.shadowBlur = 60; ctx.fillStyle = '#FF6A1F'; ctx.fillRect(x - w / 2, y - h / 2, w, h); ctx.restore();
        ctx.fillStyle = '#FF6A1F'; ctx.fillRect(x - w / 2, y - h / 2, w, h);
      }
      E.fx.vignette = 0.4; E.fx.bloom = 0.6; E.fx.bloomThreshold = 0.4; E.fx.grain = 0.05;
      if (u < 0.05) E.fx.flash = [1, 0.6, 0.3, 0.25 * (1 - u / 0.05)];
      return;
    }

    // ---------- background: calm dawn paper, breathing light ----------
    const toPaper = ease.inOutCubic(seg(t, T0, T0 + 1.2));
    const night = ease.inCubic(seg(t, 163.6, BLACK));
    const bg = ctx.createRadialGradient(960, 470, 60, 960, 540, 1250);
    const mixc = (a, b, k) => { const A_ = parseInt(a.slice(1), 16), B_ = parseInt(b.slice(1), 16); return `rgb(${lerp((A_ >> 16) & 255, (B_ >> 16) & 255, k) | 0},${lerp((A_ >> 8) & 255, (B_ >> 8) & 255, k) | 0},${lerp(A_ & 255, B_ & 255, k) | 0})`; };
    bg.addColorStop(0, mixc('#FFF7EC', '#FFFBF4', toPaper)); bg.addColorStop(0.35, mixc('#FFD9B5', '#FFF1E2', toPaper)); bg.addColorStop(0.75, mixc('#FFB07A', '#FFD9B8', toPaper)); bg.addColorStop(1, mixc('#FF9E5E', '#FFBE8F', toPaper));
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    softRays(ctx, 'O06', 960, 1180, { n: 22, rot: -Math.PI / 2 + lt * 0.05, len: 2600, width: 0.05, col: [255, 255, 255], alpha: 0.5 + 0.15 * down, seed: 12, blur: 5, comp: 'source-over' });
    // faint dot grid drifting up
    ctx.fillStyle = 'rgba(255,140,80,0.16)'; ctx.beginPath();
    const go = (lt * 18) % 48;
    for (let y = -48; y < H + 48; y += 48) for (let x = 24; x < W; x += 48) { const yy = y - go; const r = 2.2 + 1.4 * Math.sin(x * 0.01 + yy * 0.01 + lt); ctx.moveTo(x + r, yy); ctx.arc(x, yy, r, 0, TAU); }
    ctx.fill();
    motes(ctx, t, { n: 26, seed: 91, col: [255, 190, 130], alpha: 0.4, size: [3, 16], speed: 18, comp: 'source-over' });

    // camera: slow push + drift
    const push = 1 + 0.035 * inOutSine(seg(t, T0, 163.4)) - 0.035 * ease.inOutCubic(seg(t, 163.3, 163.9));
    ctx.save(); ctx.translate(960, 540); ctx.scale(push, push); ctx.translate(-960 + Math.sin(lt * 0.5) * 6, -540 + Math.cos(lt * 0.4) * 4);

    // ---------- title line (centre-aligned with the cursor riding its end) ----------
    const nType = clamp(Math.floor((t - TYPE0) / DT) + 1, 0, PROMPT.length + TITLE.length);
    const full = PROMPT + TITLE;
    const nDel = t < DEL.title ? nType : Math.max(0, full.length - Math.floor((t - DEL.title) / ((DEL.titleEnd - DEL.title) / full.length)));
    const shown = full.slice(0, Math.min(nType, nDel));
    font(ctx, TS, MONO, '800');
    const cw = ctx.measureText('M').width;           // mono advance
    const bw = END_BLOCK.w, bh = END_BLOCK.h, gap = cw * 0.12;
    const groupW = shown.length * cw + (shown.length ? gap : 0) + bw;
    const lift = ease.inOutCubic(seg(t, LIFT[0], LIFT[1])) * (1 - ease.inOutCubic(seg(t, 163.3, 163.85)));
    const cy = lerp(END_BLOCK.y, 296, lift);
    const x0 = 960 - groupW / 2;
    // letters (with downbeat ripple + a highlight band sweeping through the ink on downbeats)
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    const base = cy + bh / 2 - 30;
    const sinceDown = A.since('down', t);
    const gx = lerp(x0 - 300, x0 + groupW + 300, clamp(sinceDown / 0.7));
    const ink = ctx.createLinearGradient(gx - 160, 0, gx + 160, 0);
    ink.addColorStop(0, '#1F2A55'); ink.addColorStop(0.5, t > 158.3 && sinceDown < 0.7 ? '#5C74D6' : '#1F2A55'); ink.addColorStop(1, '#1F2A55');
    for (let i = 0; i < shown.length; i++) {
      const ch = shown[i]; if (ch === ' ') continue;
      const age = t - (TYPE0 + i * DT);
      const pop = age < 0.18 ? 1 + 0.35 * (1 - age / 0.18) : 1;
      const rip = sinceDown < 0.8 && t > 158.3 ? Math.max(0, Math.sin(clamp((sinceDown - i * 0.035) / 0.3) * Math.PI)) * 12 : 0;
      const lx = x0 + i * cw;
      ctx.save(); ctx.translate(lx + cw / 2, base - rip); ctx.scale(pop, pop);
      ctx.fillStyle = 'rgba(255,106,31,0.22)'; ctx.fillText(ch, -cw / 2 + 7, 9);
      if (i < 2) ctx.fillStyle = '#FF6A1F';
      else { ctx.setTransform(ctx.getTransform()); ctx.fillStyle = ink; ctx.translate(-(lx + cw / 2), -(base - rip)); ctx.fillText(ch, lx, base - rip); ctx.restore(); continue; }
      ctx.fillText(ch, -cw / 2, 0);
      ctx.restore();
    }
    // the cursor
    const cx = x0 + shown.length * cw + (shown.length ? gap : 0) + bw / 2;
    const typing = t < TYPE0 + full.length * DT + 0.05;
    const deleting = t >= DEL.title && t < DEL.titleEnd + 0.05;
    const on = typing || deleting || cursorOn(t);
    if (on) {
      const gl = 0.6 + 0.4 * hit;
      ctx.save(); ctx.shadowColor = `rgba(255,106,31,${gl})`; ctx.shadowBlur = 40 + 30 * hit; ctx.fillStyle = '#FF6A1F';
      ctx.fillRect(cx - bw / 2, cy - bh / 2, bw, bh); ctx.restore();
    }

    // ---------- credit lines ----------
    const below = (k) => cy + bh / 2 + k;
    const rise = (t0) => (1 - ease.outExpo(seg(t, t0, t0 + 0.4))) * 26;
    // LOCAL CUT with rules
    {
      const L = LINES[0];
      const txt = scramble('LOCAL CUT', t, L.t, 0.4).slice(0, kept(9, t, DEL.cut));
      const ruleK = ease.outExpo(seg(t, L.t, L.t + 0.5)) * (1 - ease.inExpo(seg(t, DEL.cut, DEL.cut + 0.15)));
      const y = below(58);
      font(ctx, 46, MONO, '800'); ctx.fillStyle = '#FF6A1F'; ctx.textBaseline = 'middle';
      spaced(ctx, txt, 960, y, 20, 'center');
      const fullW = 9 * (ctx.measureText('M').width + 20);
      if (ruleK > 0) {
        ctx.fillStyle = '#1F2A55';
        ctx.fillRect(960 - fullW / 2 - 36 - 300 * ruleK, y - 2, 300 * ruleK, 4);
        ctx.fillRect(960 + fullW / 2 + 36, y - 2, 300 * ruleK, 4);
        ctx.beginPath(); ctx.arc(960 - fullW / 2 - 36 - 300 * ruleK, y, 7 * ruleK, 0, TAU); ctx.arc(960 + fullW / 2 + 36 + 300 * ruleK, y, 7 * ruleK, 0, TAU); ctx.fill();
      }
    }
    // made 100% in code by Claude Opus 5.5
    {
      const L = LINES[1], str = 'made 100% in code by Claude Opus 5.5';
      const txt = scramble(str, t, L.t, 0.5).slice(0, kept(str.length, t, DEL.lines + 0.24));
      font(ctx, 82, 'Instrument Serif', '400', 'italic'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#1F2A55'; ctx.fillText(txt, 960, below(152) + rise(L.t));
    }
    // chips: 0 AI-GENERATED PIXELS · $0
    {
      const L = LINES[2];
      const chips = [{ s: '0 AI-GENERATED PIXELS', d: 0 }, { s: '$0 BUDGET', d: 0.12 }];
      font(ctx, 40, MONO, '800');
      const pw = chips.map((c) => ctx.measureText(c.s).width + 64), gapC = 30, tot = pw[0] + pw[1] + gapC;
      let x = 960 - tot / 2;
      chips.forEach((c, i) => {
        const k = ease.outBack(seg(t, L.t + c.d, L.t + c.d + 0.32), 2) * (1 - ease.inBack(seg(t, DEL.lines + 0.1 - i * 0.05, DEL.lines + 0.24 - i * 0.05)));
        const y = below(258);
        if (k > 0.001) {
          ctx.save(); ctx.translate(x + pw[i] / 2, y); ctx.scale(k, k); ctx.rotate((i ? 0.02 : -0.015) + Math.sin(lt * 1.3 + i) * 0.006);
          ctx.fillStyle = '#1F2A55'; roundRect(ctx, -pw[i] / 2 + 6, -38 + 7, pw[i], 76, 38); ctx.fill();
          ctx.fillStyle = i ? '#FFD23F' : '#FFFBF4'; roundRect(ctx, -pw[i] / 2, -38, pw[i], 76, 38); ctx.fill();
          ctx.lineWidth = 5; ctx.strokeStyle = '#1F2A55'; ctx.stroke();
          const txt = scramble(c.s, t, L.t + c.d, 0.4);
          ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
          let tx = -ctx.measureText(c.s).width / 2;
          for (let j = 0; j < txt.length; j++) { const ch = txt[j]; ctx.fillStyle = (i === 0 && j === 0) || (i === 1 && j < 2) ? '#FF6A1F' : '#1F2A55'; if (i === 1 && j < 2) ctx.fillStyle = '#E8343F'; ctx.fillText(ch, tx, 2); tx += ctx.measureText(ch).width; }
          ctx.restore();
        }
        x += pw[i] + gapC;
      });
    }
    // the skill is free — link in description
    {
      const L = LINES[3], str = 'the skill is free — link in description ↓';
      const txt = scramble(str, t, L.t, 0.5).slice(0, kept(str.length, t, DEL.lines));
      font(ctx, 54, 'Bricolage Grotesque', '700'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const y = below(362) + rise(L.t);
      if (txt.length >= 17) {
        const u = ease.outCubic(seg(t, L.t + 0.45, L.t + 0.75)) * (1 - ease.inExpo(seg(t, DEL.lines, DEL.lines + 0.2)));
        const fw = ctx.measureText(str).width, fx = 960 - fw / 2 + ctx.measureText('the skill is ').width, ww = ctx.measureText('free').width;
        ctx.fillStyle = '#FFD23F'; ctx.save(); ctx.translate(fx - 6, y + 4); ctx.rotate(-0.02); ctx.fillRect(0, -6, (ww + 12) * u, 26); ctx.restore();
      }
      ctx.fillStyle = '#1F2A55'; ctx.fillText(txt, 960, y);
    }
    // SUBSCRIBE button
    {
      const k = ease.outBack(seg(t, SUB_T, SUB_T + 0.35), 2) * (1 - ease.inBack(seg(t, DEL.lines - 0.02, DEL.lines + 0.16)));
      if (k > 0.001) {
        const y = below(478), bwB = 560, bhB = 116;
        ctx.save(); ctx.translate(960, y); ctx.scale(k * (1 + 0.02 * hit), k * (1 + 0.02 * hit));
        ctx.fillStyle = '#1F2A55'; roundRect(ctx, -bwB / 2 + 7, -bhB / 2 + 8, bwB, bhB, bhB / 2); ctx.fill();
        ctx.fillStyle = '#E8343F'; roundRect(ctx, -bwB / 2, -bhB / 2, bwB, bhB, bhB / 2); ctx.fill();
        ctx.save(); roundRect(ctx, -bwB / 2, -bhB / 2, bwB, bhB, bhB / 2); ctx.clip();
        const sx = lerp(-bwB, bwB, ((t - SUB_T) % 1.8) / 1.0);
        const sh = ctx.createLinearGradient(sx - 50, 0, sx + 50, 0); sh.addColorStop(0, 'rgba(255,255,255,0)'); sh.addColorStop(0.5, 'rgba(255,255,255,0.4)'); sh.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = sh; ctx.fillRect(-bwB / 2, -bhB / 2, bwB, bhB);
        ctx.fillStyle = 'rgba(255,255,255,0.28)'; roundRect(ctx, -bwB / 2 + 16, -bhB / 2 + 8, bwB - 32, bhB * 0.36, 18); ctx.fill();
        ctx.restore();
        ctx.lineWidth = 6; ctx.strokeStyle = '#1F2A55'; roundRect(ctx, -bwB / 2, -bhB / 2, bwB, bhB, bhB / 2); ctx.stroke();
        font(ctx, 66, 'Anton'); ctx.fillStyle = '#FFFBF4'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('SUBSCRIBE', -30, 3);
        ctx.save(); ctx.translate(bwB / 2 - 70, -2); ctx.scale(1.15, 1.15); ctx.rotate(wobble(A.since('beat', t), 6, 6) * 0.35); ctx.fillStyle = '#FFD23F';
        ctx.beginPath(); ctx.moveTo(-17, 11); ctx.quadraticCurveTo(-15, -19, 0, -20); ctx.quadraticCurveTo(15, -19, 17, 11); ctx.lineTo(22, 16); ctx.lineTo(-22, 16); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.arc(0, 21, 5.5, 0, TAU); ctx.fill(); ctx.restore();
        ctx.restore();
      }
    }
    ctx.restore();

    // night returns for the final cut
    if (night > 0) { ctx.fillStyle = `rgba(0,0,0,${night})`; ctx.fillRect(0, 0, W, H);
      // keep the cursor glowing through the fade
      const { w, h } = END_BLOCK; ctx.save(); ctx.globalAlpha = night; ctx.shadowColor = 'rgba(255,106,31,0.9)'; ctx.shadowBlur = 50; ctx.fillStyle = '#FF6A1F';
      ctx.translate(960, 540); ctx.scale(push, push); ctx.translate(-960, -540); ctx.fillRect(cx - w / 2, cy - h / 2, w, h); ctx.restore(); }

    // FX
    E.fx.vignette = 0.22 + 0.3 * night; E.fx.bloom = 0.1; E.fx.bloomThreshold = 0.92;
    if (t >= DEL.lines && t < DEL.lines + 0.12) { E.fx.glitch = 0.35 * (1 - (t - DEL.lines) / 0.12); E.fx.glitchSeed = E.frame; E.fx.rgb = 4; }
    if (t >= DEL.cut && t < DEL.cut + 0.08) { E.fx.rgb = 3; }
  },
};
