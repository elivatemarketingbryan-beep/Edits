// W13 — "Every loop is perfect," — a log-polar kaleidoscope of CURSOR's dance.
// CURSOR + Win95 debris are drawn every frame into a 45° wedge buffer; a GLSL pass mirrors it 8×
// and repeats it in rings (×2.4 per ring) so the mandala zooms forever: a literally perfect loop.
import { shot } from '../../shots.js';
import { W, H, TAU, ease, seg, clamp, lerp, hash, font, roundRect, buf, bctx } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { G } from '../../core/gl.js';
import { drawMascot } from '../../core/mascot.js';
import { BRUT, mipCanvasTex, pointer, circleText, sparkle } from './kit.js';

const S = shot('W13');
const { blue: BLUE, red: RED, white: WHITE, grey: GREY, black: BLACK } = BRUT;
const SRC = 1024, K = 2.4, SEG = Math.PI / 4;
const T_LOOP = 72.88, T_PERF = 73.22;

const FRAG = `
uniform sampler2D src;
uniform float uRot, uZoom, uK, uReveal, uSwap, uPulse, uR0;
#define PI 3.14159265
void main(){
  vec2 p = (uv - .5) * vec2(uRes.x / uRes.y, 1.);
  p /= 1.0 + uPulse * 0.05;
  float r = length(p);
  float a0 = atan(p.y, p.x);
  float a = a0 + uRot;
  float seg = PI / 4.;
  float aa = mod(a, 2. * seg); if (aa > seg) aa = 2. * seg - aa;
  float Kl = log(uK);
  float lr = log(max(r, 1e-5)) - log(uR0) + uZoom;
  float ring = floor(lr / Kl);
  float rr = exp(lr - ring * Kl);
  vec2 q = rr * vec2(cos(aa), sin(aa)) / uK;
  float scr = uR0 * exp(ring * Kl - uZoom) * uRes.y;
  float lod = max(0., log2((${SRC}.0 / uK) / max(scr, 1e-3)) + .25);
  vec3 c = textureLod(src, q, lod).rgb;
  float odd = mod(ring, 2.);
  if (abs(odd - uSwap) > .5) {                     // electric blue <-> error red on alternate rings (mascot stays orange)
    vec3 B = vec3(.169,.169,1.), R = vec3(1.,.165,.165);
    float isB = smoothstep(.32, .12, distance(c, B)), isR = smoothstep(.32, .12, distance(c, R));
    c = mix(c, c.bgr, max(isB, isR));
  }
  float aw = fract((-a0 + PI * .5) / (2. * PI));    // sector reveal: the wedge multiplies to 8
  float m = smoothstep(uReveal, uReveal - .004, aw);
  vec3 bg = vec3(.169, .169, 1.) * (0.9 + 0.1 * step(.5, fract(r * 16.)));
  o = vec4(mix(bg, c, m), 1.);
}`;

let HITS = null;

function drawWedge(t, lt) {
  const c = buf('W13-wedge', SRC, SRC), x = bctx(c);
  const u = SRC / K; // px per unit
  const P = (r, a) => [r * Math.cos(a) * u, SRC - r * Math.sin(a) * u]; // q-space (y up) → canvas px
  x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
  x.fillStyle = BLUE; x.fillRect(0, 0, SRC, SRC);
  const bt = A.beat(t), hit = Math.exp(-bt.phase * 4);
  const arcBand = (r0, r1, a0, a1, col) => {
    x.beginPath(); x.arc(0, SRC, r1 * u, -a1, -a0); x.arc(0, SRC, r0 * u, -a0, -a1, true); x.closePath(); x.fillStyle = col; x.fill();
  };
  // 1) rotating checkerboard band just inside each ring seam
  const n = 9, sh = (lt * 1.6) % 2;
  for (let i = -2; i < n + 2; i++) for (let j = 0; j < 2; j++) {
    const a0 = (i + sh) * SEG / n, a1 = a0 + SEG / n;
    arcBand(1.0 + j * 0.07, 1.07 + j * 0.07, a0, a1, (i + j + 100) % 2 ? BLACK : WHITE);
  }
  arcBand(K - 0.025, K, -0.1, SEG + 0.1, BLACK);
  arcBand(1.14, 1.155, -0.1, SEG + 0.1, BLACK);
  // 2) dot ring that breathes on the beat
  for (let i = 0; i < 7; i++) {
    const a = (i + 0.5) / 7 * SEG + lt * 0.35;
    const [px, py] = P(2.2, a);
    x.beginPath(); x.arc(px, py, 9 + hit * 10, 0, TAU); x.fillStyle = i % 2 ? RED : WHITE; x.fill();
    x.lineWidth = 3; x.strokeStyle = BLACK; x.stroke();
  }
  x.strokeStyle = WHITE; x.lineWidth = 5;
  for (const r of [1.34, 2.06]) { x.beginPath(); x.arc(0, SRC, r * u, -SEG - 0.1, 0.1); x.stroke(); }
  // 3) expanding ripples on the real hats / snares / kicks
  for (const h of HITS) {
    const age = t - h.t; if (age < 0 || age > 0.5) continue;
    const r = 1.18 + age * 2.6, al = 1 - age / 0.5;
    x.globalAlpha = al; x.strokeStyle = h.kind === 'hat' ? WHITE : RED; x.lineWidth = 14 * al + 2;
    x.beginPath(); x.arc(0, SRC, r * u, -SEG - 0.1, 0.1); x.stroke(); x.globalAlpha = 1;
  }
  // 4) Win95 pointers sweeping across the wedge (they become arrow flowers)
  for (let i = 0; i < 5; i++) {
    const r = [1.24, 1.55, 1.95, 2.28, 1.45][i];
    const a = ((lt * (0.5 + i * 0.13) + i * 0.29) % 1) * (SEG + 0.3) - 0.15;
    const [px, py] = P(r, a);
    pointer(x, px, py, 3.2 + (i % 2) * 0.9, -a + Math.PI * 0.5 + lt * (i % 2 ? 2 : -1.5), WHITE, BLACK);
  }
  for (let i = 0; i < 6; i++) {
    const a = hash(i, 3) * SEG, r = 1.2 + hash(i, 7) * 1.1;
    const tw = 0.5 + 0.5 * Math.sin(t * 9 + i * 2.1);
    const [px, py] = P(r, a);
    sparkle(x, px, py, 10 + tw * 18, t * 2 + i); x.fillStyle = i % 3 === 0 ? RED : WHITE; x.fill();
  }
  font(x, 36, 'JetBrains Mono', '800'); x.textAlign = 'center'; x.textBaseline = 'middle';
  ['>_', '{ }', '∞', '01', ';'].forEach((g, i) => {
    const a = ((i * 0.21 + lt * 0.18) % 1) * SEG, r = 1.25 + (i % 3) * 0.38;
    const [px, py] = P(r, a);
    x.save(); x.translate(px, py); x.rotate(-a + Math.PI / 2); x.fillStyle = i % 2 ? WHITE : BLACK; x.fillText(g, 0, 0); x.restore();
  });
  // 5) CURSOR dancing, head pointing outward
  const am = SEG / 2 + Math.sin(lt * 3.1) * 0.03, rm = 1.74;
  const [mx, my] = P(rm, am);
  x.save(); x.translate(mx, my); x.rotate(Math.PI / 2 - am);
  const s = 1.0;
  drawMascot(x, { x: 0, y: 160 * s, s, t, pose: 'dance', mouth: 'auto', eyes: t > T_PERF ? 'star' : 'normal', sticker: true });
  x.restore();
  return c;
}

const lap = (t) => { const b = A.beat(t); return b.i + b.phase; };

export default {
  ...S,
  cutIn: 'punch',
  sfx: [{ t: 72.88, type: 'swoosh' }, { t: 73.22, type: 'stamp', gain: 1 }],
  draw(ctx, t, s, E) {
    const lt = s.lt;
    if (!HITS) HITS = [...A.eventsIn('hat', S.start - 0.6, S.end + 0.6).map((t) => ({ t, kind: 'hat' })), ...A.eventsIn('snare', S.start - 0.6, S.end + 0.6).map((t) => ({ t, kind: 'snare' })), ...A.eventsIn('kick', S.start - 0.6, S.end + 0.6).map((t) => ({ t, kind: 'kick' }))];
    const tex = mipCanvasTex('W13-wedge', drawWedge(t, lt));

    // beat-pumped ring flow + rotation with a 90° snap on "perfect"
    let pump = 0; for (const b of A.eventsIn('beat', S.start - 1.2, t + 1e-4)) pump += ease.outExpo((t - b) / 0.3) * 0.34;
    const zoom = lt * 0.62 + pump;
    const snap = ease.outExpo((t - T_PERF) / 0.35) * SEG * 2;
    const rot = lt * 0.42 + snap + ease.outBack(seg(t, T_LOOP, T_LOOP + 0.3)) * 0.2;
    const reveal = 0.125 + 0.875 * ease.outCubic(seg(lt, 0.02, 0.26));
    const kp = A.pulse('snare', t, 0.1) + A.pulse('kick', t, 0.12);
    G.draw(ctx, G.shader('W13-kal', FRAG, { src: tex, uRot: rot, uZoom: zoom, uK: K, uReveal: reveal * 1.002, uSwap: t >= T_PERF ? 1 : 0, uPulse: kp, uR0: 0.13 }));

    // ---------- centre badge: L∞P ----------
    const cx = W / 2, cy = H / 2;
    const pop = ease.outBack(seg(t, T_LOOP - 0.06, T_LOOP + 0.22), 2.2);
    const sc = lerp(0.0, 0.62, ease.outBack(seg(lt, 0.05, 0.3))) + pop * 0.38 + A.pulse('beat', t, 0.1) * 0.03;
    ctx.save(); ctx.translate(cx, cy); ctx.scale(sc, sc); ctx.rotate(Math.sin(lt * 2.4) * 0.04 - (1 - pop) * 0.2);
    ctx.fillStyle = BLACK; ctx.beginPath(); ctx.arc(16, 18, 262, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(0, 0, 262, 0, TAU); ctx.fill();
    ctx.save(); ctx.rotate(-lt * 0.9); circleText(ctx, 'EVERY LOOP IS PERFECT ✦ EVERY LOOP IS PERFECT ✦ ', 231, 0, 30, 'Rubik Mono One', WHITE); ctx.restore();
    ctx.beginPath(); ctx.arc(0, 0, 202, 0, TAU); ctx.fillStyle = WHITE; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = BLACK; ctx.stroke();
    ctx.save(); ctx.beginPath(); ctx.arc(0, 0, 196, 0, TAU); ctx.clip();
    ctx.strokeStyle = 'rgba(43,43,255,0.12)'; ctx.lineWidth = 2;
    for (let g = -196; g <= 200; g += 28) { ctx.beginPath(); ctx.moveTo(g, -200); ctx.lineTo(g, 200); ctx.moveTo(-200, g); ctx.lineTo(200, g); ctx.stroke(); }
    ctx.restore();
    font(ctx, 132, 'Rubik Mono One'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const letter = (ch, x, k) => {
      if (k <= 0) return;
      ctx.save(); ctx.translate(x, 4); ctx.scale(k, k);
      ctx.fillStyle = BLACK; ctx.fillText(ch, 7, 8); ctx.fillStyle = BLUE; ctx.fillText(ch, 0, 0); ctx.restore();
    };
    letter('L', -146, ease.outBack(seg(t, T_LOOP - 0.04, T_LOOP + 0.16), 2.5));
    letter('P', 146, ease.outBack(seg(t, T_LOOP + 0.02, T_LOOP + 0.22), 2.5));
    // ∞ (the OO) draws itself on "loop"; a red dot laps it once per beat
    const inf = (k) => { const a = k * TAU; const d = 1 + Math.sin(a) ** 2; return [88 * Math.cos(a) / d, 84 * Math.sin(a) * Math.cos(a) / d + 4]; };
    const dr = ease.outCubic(seg(t, T_LOOP - 0.02, T_LOOP + 0.3));
    if (dr > 0) {
      const N = 120, nn = Math.max(2, Math.floor(N * dr));
      for (const [w, col, o] of [[40, BLACK, 5], [26, BLUE, 0]]) {
        ctx.beginPath();
        for (let i = 0; i <= nn; i++) { const [px, py] = inf(0.125 + i / N); if (i === 0) ctx.moveTo(px + o, py + o); else ctx.lineTo(px + o, py + o); }
        ctx.lineWidth = w; ctx.strokeStyle = col; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
      }
      const ph = lap(t) + 0.125;
      for (let k = 14; k >= 1; k--) {
        const [px, py] = inf(ph - k * 0.014);
        ctx.globalAlpha = dr * (1 - k / 15) * 0.9; ctx.fillStyle = RED;
        ctx.beginPath(); ctx.arc(px, py, 14 - k * 0.6, 0, TAU); ctx.fill();
      }
      ctx.globalAlpha = dr;
      const [dx, dy] = inf(ph); ctx.beginPath(); ctx.arc(dx, dy, 16, 0, TAU); ctx.fillStyle = RED; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = BLACK; ctx.stroke();
      ctx.fillStyle = WHITE; ctx.beginPath(); ctx.arc(dx - 4, dy - 5, 4.5, 0, TAU); ctx.fill();
      ctx.globalAlpha = 1;
    }
    if (t >= T_PERF - 0.01) { // PERFECT ✓ stamp
      const k = seg(t, T_PERF - 0.01, T_PERF + 0.09);
      const ss = lerp(2.2, 1, ease.outQuad(k));
      ctx.save(); ctx.translate(0, 138); ctx.rotate(-0.12); ctx.scale(ss, ss); ctx.globalAlpha = clamp(k * 3);
      ctx.fillStyle = BLACK; roundRect(ctx, -176, -30, 368, 76, 6); ctx.fill();
      ctx.fillStyle = RED; roundRect(ctx, -184, -38, 368, 76, 6); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = BLACK; ctx.stroke();
      font(ctx, 44, 'Rubik Mono One'); ctx.fillStyle = WHITE; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('PERFECT', -24, 3);
      ctx.lineWidth = 10; ctx.strokeStyle = WHITE; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(124, 0); ctx.lineTo(140, 18); ctx.lineTo(168, -18); ctx.stroke();
      ctx.restore();
    }
    ctx.restore();

    // Win95 "loop.exe" tag
    const tg = ease.outExpo(seg(lt, 0.1, 0.4));
    if (tg > 0) {
      ctx.save(); ctx.translate(lerp(-420, 120, tg), 168);
      ctx.fillStyle = BLACK; ctx.fillRect(8, 8, 340, 66);
      ctx.fillStyle = GREY; ctx.fillRect(0, 0, 340, 66); ctx.fillStyle = BLUE; ctx.fillRect(4, 4, 332, 26);
      font(ctx, 18, 'JetBrains Mono', '800'); ctx.fillStyle = WHITE; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText('loop.exe', 12, 17);
      ctx.fillStyle = WHITE; ctx.fillRect(312, 8, 18, 18); ctx.fillStyle = BLACK; ctx.fillText('×', 315, 17);
      font(ctx, 17, 'JetBrains Mono', '700'); ctx.fillText(`frame ${String(E.frame % 36).padStart(2, '0')}/36 · seamless ✓`, 12, 48);
      ctx.restore();
    }

    E.fx.rgb = 3 + kp * 10;
    E.fx.zoom += A.pulse('beat', t, 0.08) * 0.015;
    if (t >= T_PERF && t < T_PERF + 0.12) { const k = 1 - (t - T_PERF) / 0.12; E.fx.shake = 16 * k; E.fx.flash = [1, 1, 1, 0.35 * k]; }
    E.fx.vignette = 0.12;
  },
};
