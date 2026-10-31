// I02 — "one prompt" — the prompt types itself (keystroke visualiser), ENTER lands on the first beat (1.858 s),
// then the "AI" answers in a burst of log lines while the text heats up to white before it explodes (I03).
import { shot } from '../../shots.js';
import { W, H, clamp, ease, seg, lerp, roundRect, font, hash } from '../../core/lib.js';
import { terminal, NIGHT, MONO } from './common.js';

const S = shot('I02');
export const PROMPT = { x0: 200, y0: 470, size: 150, text: 'one prompt' };
const T0 = 1.13, DT = 0.048, ENTER = 1.858;
const LOG = [
  { t: 1.96, s: '▸ reading prompt ............ ok' },
  { t: 2.04, s: '▸ writing 88 scenes ......... ok' },
  { t: 2.12, s: '▸ drawing 4,950 frames ...... ok' },
  { t: 2.2, s: '▸ AI-generated pixels ....... 0', c: NIGHT.orange },
  { t: 2.28, s: '▸ cost ...................... $0.00', c: NIGHT.orange },
];

function keycap(ctx, x, y, w, h, label, down, glow) {
  ctx.fillStyle = '#04050B'; roundRect(ctx, x, y + 14, w, h, 18); ctx.fill();
  ctx.fillStyle = glow ? '#FF7A2F' : '#232958'; roundRect(ctx, x, y + down, w, h, 18); ctx.fill();
  ctx.fillStyle = glow ? '#FFB15C' : '#2F3670'; roundRect(ctx, x + 10, y + down + 8, w - 20, h - 26, 13); ctx.fill();
  font(ctx, h * 0.36, MONO, '800'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = glow ? '#2A0E02' : '#FFFBF4'; ctx.fillText(label, x + w / 2, y + down + h * 0.42);
}

export default {
  ...S,
  hud: 'paper', cutIn: 'flash',
  sfx: [...Array.from({ length: 10 }, (_, i) => ({ t: T0 + i * DT, type: 'type', gain: 0.5 })), { t: ENTER, type: 'impact', gain: 1 }, { t: 1.96, type: 'tick', gain: 0.4 }, { t: 2.2, type: 'zap', gain: 0.5 }],
  draw(ctx, t, s, E) {
    const n = clamp(Math.floor((t - T0) / DT) + 1, 0, PROMPT.text.length);
    const typed = PROMPT.text.slice(0, n);
    const heat = clamp((t - ENTER) / 0.5);
    const shakeIn = t > 2.1 ? (t - 2.1) / 0.28 : 0;
    const sc = lerp(1.07, 1.0, ease.outCubic(s.u)) + (t > ENTER ? 0.035 * Math.exp(-(t - ENTER) * 8) : 0);
    ctx.save();
    ctx.translate(W / 2, H / 2); ctx.scale(sc, sc); ctx.translate(-W / 2, -H / 2);
    if (shakeIn > 0) ctx.translate((hash(E.frame, 1) - 0.5) * 14 * shakeIn, (hash(E.frame, 2) - 0.5) * 14 * shakeIn);
    const log = LOG.filter((L) => t >= L.t).map((L) => ({ ...L, a: clamp((t - L.t) / 0.05) }));
    const cur = terminal(ctx, t, { typed, cursorOn: t < ENTER ? true : Math.floor(t * 8) % 2 === 0, heat, size: PROMPT.size, x0: PROMPT.x0, y0: PROMPT.y0, log });
    // phosphor bloom on freshly typed characters
    font(ctx, PROMPT.size, MONO, '800');
    const pw = ctx.measureText('> ').width;
    for (let i = 0; i < n; i++) {
      const age = t - (T0 + i * DT);
      if (age > 0.25) continue;
      const x = PROMPT.x0 + pw + ctx.measureText(PROMPT.text.slice(0, i)).width;
      const k = 1 - age / 0.25, sz = PROMPT.size * (1 + 0.5 * k);
      ctx.save(); ctx.globalAlpha = k; ctx.shadowColor = NIGHT.orange; ctx.shadowBlur = 60;
      font(ctx, sz, MONO, '800'); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#FFE9D2';
      ctx.fillText(PROMPT.text[i], x - (sz - PROMPT.size) * 0.3, PROMPT.y0);
      ctx.restore();
    }
    ctx.restore();

    // keystroke visualiser: keycaps pop up from the bottom and float away
    for (let i = 0; i < PROMPT.text.length; i++) {
      const tk = T0 + i * DT, age = t - tk;
      if (age < 0 || age > 0.5) continue;
      const ch = PROMPT.text[i] === ' ' ? 'SPACE' : PROMPT.text[i].toUpperCase();
      const w = ch === 'SPACE' ? 300 : 120, x = 220 + i * 128 - (ch === 'SPACE' ? 90 : 0);
      const y = 880 - ease.outCubic(age / 0.5) * 70, down = age < 0.06 ? 12 : 0;
      ctx.globalAlpha = 1 - seg(age, 0.3, 0.5);
      keycap(ctx, x, y, w, 110, ch, down, age < 0.12);
      ctx.globalAlpha = 1;
    }
    // ENTER: a giant keycap slams in on the beat
    if (t > ENTER - 0.12) {
      const a = t - (ENTER - 0.12), press = t >= ENTER ? 22 * Math.exp(-(t - ENTER) * 10) + 8 : 0;
      const y = lerp(1180, 760, ease.outBack(a / 0.12)) + (t > 2.2 ? (t - 2.2) * 600 : 0);
      keycap(ctx, 1290, y, 470, 230, 'ENTER ⏎', press, t >= ENTER);
    }
    // FX
    const hit = t >= ENTER ? Math.exp(-(t - ENTER) * 9) : 0;
    E.fx.shake = 26 * hit + 6 * shakeIn; E.fx.rgb = 12 * hit + 4 * shakeIn;
    E.fx.flash = [1, 0.75, 0.5, 0.4 * hit];
    E.fx.bloom = 0.5 + heat * 0.9; E.fx.bloomThreshold = 0.55;
    E.fx.scanlines = 0.08;
  },
};
