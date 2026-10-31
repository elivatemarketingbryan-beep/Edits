// G03 — "but the skill is free" — a giant FREE in liquid gold. The letters are an implicit metaball field
// (blurred glyph field + up to 64 gaussian drop kernels + a rising pool), shaded in GLSL as liquid metal
// (height-field normals → reflected studio env + spec + shine sweep). Drips grow, neck, pinch off, fall and
// splash into the pool CURSOR is dancing in.
import { shot } from '../../shots.js';
import { W, H, TAU, ease, seg, clamp, lerp, hash, font, buf, bctx, spring } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { G } from '../../core/gl.js';
import { drawMascot } from '../../core/mascot.js';
import { goldGrad } from './kit.js';

const S = shot('G03');
const T_FREE = 81.14, T_SKILL = 80.28, MAXK = 64, GRAV = 2600;
const TY = 400; // text centre y (full-res px)
const poolY = (t) => lerp(1010, 948, ease.outCubic(seg(t, S.start, S.end)));

const FRAG = `
uniform sampler2D fieldT;
uniform vec4 uDrops[${MAXK}];
uniform float uN, uAmp, uTime, uPool, uShine, uWave;
float field(vec2 p) {
  vec2 tuv = vec2(p.x / ${W}.0, 1.0 - p.y / ${H}.0);
  float tf = texture(fieldT, tuv).r;
  float f = tf * uAmp;
  f += 0.05 * sin(p.x * 0.021 + uTime * 3.1) * sin(p.y * 0.017 - uTime * 2.3) * smoothstep(0.05, 0.4, tf);
  for (int i = 0; i < ${MAXK}; i++) {
    if (float(i) >= uN) break;
    vec4 d = uDrops[i]; vec2 q = p - d.xy;
    f += d.w * exp(-dot(q, q) / (d.z * d.z));
  }
  float surf = uPool + (6.0 + uWave * 10.0) * sin(p.x * 0.012 + uTime * 4.0) + 4.0 * sin(p.x * 0.031 - uTime * 5.3);
  f += clamp((p.y - surf) / 36.0 + 0.5, 0.0, 1.3);
  return f;
}
float hgt(float f) { return sqrt(max(f - 0.42, 0.0)); }
void main() {
  vec2 p = vec2(uv.x, 1.0 - uv.y) * vec2(${W}.0, ${H}.0);
  float f = field(p);
  float e = 2.5;
  float h0 = hgt(f), hx = hgt(field(p + vec2(e, 0.0))) - h0, hy = hgt(field(p + vec2(0.0, e))) - h0;
  float fw = max(fwidth(f), 0.004);
  float m = smoothstep(0.5 - fw, 0.5 + fw, f);
  // ---- background: warm cream, diagonal pinstripe, shadow of the liquid ----
  vec2 c = uv - 0.5;
  vec3 bg = mix(vec3(1.0, 0.965, 0.86), vec3(1.0, 0.84, 0.52), smoothstep(0.25, 0.95, length(c * vec2(1.5, 1.0))));
  bg *= 1.0 - 0.045 * step(0.5, fract((p.x + p.y) / 56.0));
  float fs = field(p - vec2(18.0, 24.0));
  bg = mix(bg, bg * vec3(0.5, 0.36, 0.22), smoothstep(0.42, 0.62, fs) * 0.55);
  // ---- liquid gold ----
  vec3 n = normalize(vec3(-hx * 9.0, hy * 9.0, 1.0));
  vec3 r = reflect(vec3(0.0, 0.0, -1.0), n);
  float el = r.y;
  float lum = 0.16 + 0.62 * smoothstep(-0.75, 0.25, el)
            + 1.05 * exp(-pow((el - 0.45) / 0.11, 2.0))
            + 0.55 * exp(-pow((r.x + 0.5) / 0.15, 2.0)) * smoothstep(-0.3, 0.4, el)
            - 0.32 * exp(-pow((el + 0.08) / 0.07, 2.0));
  vec3 deep = vec3(0.30, 0.13, 0.0), mid = vec3(1.0, 0.70, 0.06), hi = vec3(1.0, 0.97, 0.78);
  vec3 col = lum < 1.0 ? mix(deep, mid, clamp(lum, 0.0, 1.0)) : mix(mid, hi, clamp(lum - 1.0, 0.0, 1.0));
  vec3 L = normalize(vec3(-0.5, 0.6, 0.65)), Hh = normalize(L + vec3(0.0, 0.0, 1.0));
  col += vec3(1.0, 0.95, 0.8) * pow(max(dot(n, Hh), 0.0), 90.0) * 1.3;
  col *= 0.72 + 0.28 * n.z;
  float sw = exp(-pow((p.x - p.y * 0.55 - uShine) / 60.0, 2.0));
  col = mix(col, vec3(1.0, 0.99, 0.92), sw * 0.75);
  // thin dark rim for the illustrated look
  float rim = smoothstep(0.5 + fw * 4.0, 0.5 + fw, f) * m;
  col = mix(col, vec3(0.24, 0.1, 0.0), rim * 0.85);
  o = vec4(mix(bg, col, m), 1.0);
}`;

let FIELD = null, SITES = null, FX = null;
function buildField() {
  // sharp text (for drip sites) + blurred field texture, both at half res
  const sharp = buf('read-G03sharp', 960, 540), sx = bctx(sharp);
  sx.clearRect(0, 0, 960, 540); sx.fillStyle = '#fff'; sx.textAlign = 'center'; sx.textBaseline = 'middle';
  let size = 230; font(sx, size, 'Rubik Mono One'); const mw = sx.measureText('FREE').width; size = size * 760 / mw; font(sx, size, 'Rubik Mono One');
  sx.fillText('FREE', 480, TY / 2);
  // float gaussian blur on the GPU (8-bit canvas blur bands the liquid's normals)
  const src = G.canvasTex('G03-sharp', sharp);
  const pp = G.pingpong(960, 540, { float: true, linear: true });
  const BL = G.program('G03-blur', `uniform sampler2D t; uniform vec2 d; void main(){ float s = 0.; float wsum = 0.; for (int i = -14; i <= 14; i++) { float w = exp(-float(i*i) / 72.); s += texture(t, uv + d * float(i)).a * w; wsum += w; } o = vec4(s / wsum, 0., 0., 1.); }`);
  const BL2 = G.program('G03-blur2', `uniform sampler2D t; uniform vec2 d; void main(){ float s = 0.; float wsum = 0.; for (int i = -14; i <= 14; i++) { float w = exp(-float(i*i) / 72.); s += texture(t, uv + d * float(i)).r * w; wsum += w; } o = vec4(s / wsum, 0., 0., 1.); }`);
  G.pass(BL, { t: src, d: [1 / 960, 0] }, pp.write); pp.swap();
  G.pass(BL2, { t: pp.read, d: [0, 1 / 540] }, pp.write); pp.swap();
  FIELD = pp.read;
  // drip sites: bottoms of the glyphs along the baseline
  const d = sx.getImageData(0, 0, 960, 540).data;
  const bottoms = [];
  for (let x = 0; x < 960; x += 2) { let yb = -1; for (let y = 539; y > 0; y--) if (d[(y * 960 + x) * 4 + 3] > 128) { yb = y; break; } if (yb > 0) bottoms.push([x, yb]); }
  const maxY = Math.max(...bottoms.map((b) => b[1]));
  const cand = bottoms.filter((b) => b[1] >= maxY - 3 && Math.abs(b[0] * 2 - 960) > 150);
  const sites = [];
  for (const b of cand) if (!sites.some((s) => Math.abs(s[0] - b[0] * 2) < 92)) sites.push([b[0] * 2, b[1] * 2]);
  SITES = sites.map((s, i) => ({ x: s[0] + 10 + (hash(i, 2) - 0.5) * 30, y: s[1] - 6, P: 0.55 + hash(i, 3) * 0.6, s0: 80.2 + hash(i, 9) * 0.8 }));
  FX = { bottomY: maxY * 2 };
}

/** drop kernels + splash events for time t */
function kernels(t, out) {
  let n = 0; const push = (x, y, r, w) => { if (n < MAXK && w > 0.01) { out[n * 4] = x; out[n * 4 + 1] = y; out[n * 4 + 2] = r; out[n * 4 + 3] = w; n++; } };
  const splashes = [];
  const pool = poolY(t);
  // intro pour: big blobs fall into the letters
  for (let i = 0; i < 7; i++) {
    const ta = 80.1 + i * 0.03, x = 480 + i * 160 + (hash(i, 4) - 0.5) * 60, ty = TY + (hash(i, 5) - 0.5) * 60;
    if (t > ta + 0.12) continue;
    const u = clamp((t - (ta - 0.26)) / 0.26); if (u <= 0) continue;
    const y = lerp(-140, ty, u * u);
    push(x, y, 46, t > ta ? 1.2 * (1 - (t - ta) / 0.12) : 1.2);
    push(x, y - 40 * u, 28, 0.8 * (t > ta ? 1 - (t - ta) / 0.12 : 1));
  }
  for (const S2 of SITES) {
    if (t < S2.s0) continue;
    const kNow = Math.floor((t - S2.s0) / S2.P);
    for (let k = Math.max(0, kNow - 1); k <= kNow; k++) {
      const tau = t - S2.s0 - k * S2.P, tr = S2.P * 0.5;
      if (tau < 0) continue;
      if (tau < tr) { // growing / hanging
        const g = ease.inOutQuad(tau / tr);
        push(S2.x, S2.y - 2, 19, 0.5 + 0.2 * g);
        push(S2.x, S2.y + 12 + 16 * g, 12, 0.75 * g);
        push(S2.x, S2.y + 18 + 40 * g, 11 + 14 * g, 1.0 * g);
      } else {
        const ft = tau - tr, y0 = S2.y + 58, y = y0 + 0.5 * GRAV * ft * ft, v = GRAV * ft;
        const tHit = Math.sqrt(2 * Math.max(1, pool - y0) / GRAV);
        const neck = 1 - clamp(ft / 0.09);
        push(S2.x, S2.y - 2, 19, 0.5 + 0.2 * neck); push(S2.x, S2.y + 14 + 20 * (1 - neck), 11, 0.75 * neck);
        if (ft < tHit + 0.07) {
          const sink = ft > tHit ? 1 - (ft - tHit) / 0.07 : 1;
          push(S2.x, Math.min(y, pool + 12), 21, 0.95 * sink);
          push(S2.x, Math.min(y, pool) - Math.min(36, v * 0.012) - 8, 13, 0.75 * sink);
        }
        if (ft >= tHit) splashes.push({ x: S2.x, t0: S2.s0 + k * S2.P + tr + tHit, seed: k * 31 + S2.x });
      }
    }
  }
  return { n, splashes };
}

const drops = new Float32Array(MAXK * 4);
export default {
  ...S,
  cutIn: 'flash',
  sfx: [{ t: 80.1, type: 'swoosh' }, { t: 81.14, type: 'ding', gain: 1 }],
  draw(ctx, t, s, E) {
    if (!FIELD) buildField();
    const lt = s.lt;
    const tex = FIELD;
    const inflate = ease.outBack(seg(t, 80.08, 80.36), 1.6);
    const sw = t >= T_FREE ? 0.16 * Math.exp(-(t - T_FREE) / 0.25) * Math.cos((t - T_FREE) * 26) : 0;
    const amp = 0.25 + 0.8 * inflate + sw + A.pulse('kick', t, 0.15) * 0.06 + A.pulse('snare', t, 0.12) * 0.04;
    const { n, splashes } = kernels(t, drops);
    const pool = poolY(t);
    const shine = lerp(-500, 2600, ease.inOutCubic(seg(t, T_FREE - 0.05, T_FREE + 0.45)));
    const r = G.shader('G03-gold', FRAG, { fieldT: tex, uDrops: drops, uN: n, uAmp: amp, uTime: t, uPool: pool, uShine: shine, uWave: A.pulse('kick', t, 0.3) + A.pulse('snare', t, 0.25) });
    G.draw(ctx, r);

    // splashes: crown droplets thrown out of the pool (ballistic, deterministic)
    const drop = (x, y, rr) => { ctx.beginPath(); ctx.arc(x, y, rr, 0, TAU); ctx.fillStyle = goldGrad(ctx, y - rr, y + rr); ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = '#4A2400'; ctx.stroke(); ctx.fillStyle = 'rgba(255,255,235,0.9)'; ctx.beginPath(); ctx.arc(x - rr * 0.35, y - rr * 0.35, rr * 0.28, 0, TAU); ctx.fill(); };
    for (const sp of splashes) {
      const age = t - sp.t0; if (age < 0 || age > 0.6) continue;
      for (let i = 0; i < 6; i++) {
        const vx = (hash(sp.seed, i) - 0.5) * 560, vy = -(320 + hash(sp.seed, i + 9) * 420);
        const x = sp.x + vx * age, y = pool - 4 + vy * age + 0.5 * GRAV * age * age;
        if (y > pool + 6) continue;
        drop(x, y, 4 + hash(sp.seed, i + 20) * 6);
      }
    }
    // "free!" burst: droplets flung off the letter tops
    if (t >= T_FREE) {
      const age = t - T_FREE;
      for (let i = 0; i < 26; i++) {
        const x0 = 320 + hash(i, 41) * 1280, vx = (hash(i, 42) - 0.5) * 900, vy = -(500 + hash(i, 43) * 900);
        const x = x0 + vx * age, y = TY - 120 + vy * age + 0.5 * GRAV * age * age;
        if (y < H + 20) drop(x, y, 6 + hash(i, 44) * 10);
      }
    }

    // CURSOR dancing in the gold pool
    const jump = t >= T_FREE ? Math.sin(clamp((t - T_FREE) / 0.38) * Math.PI) * 120 : 0;
    drawMascot(ctx, { x: 960, y: pool + 26 - jump, s: 0.82, t, pose: t >= T_FREE ? 'cheer' : 'dance', eyes: t >= T_FREE ? 'star' : 'normal', mouth: 'auto', sticker: true });
    // liquid lip over its feet
    ctx.fillStyle = 'rgba(0,0,0,0)';

    // "the skill is" serif kicker on "skill"
    const kk = ease.outCubic(seg(t, T_SKILL - 0.05, T_SKILL + 0.25));
    if (kk > 0) {
      ctx.save(); ctx.globalAlpha = kk; ctx.translate(960, 152 + (1 - kk) * 20);
      font(ctx, 78, 'Instrument Serif', '400', 'italic'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const w1 = ctx.measureText('the ').width, w2 = ctx.measureText('skill').width, w3 = ctx.measureText(' is').width, tot = w1 + w2 + w3;
      ctx.fillStyle = '#111'; ctx.textAlign = 'left';
      ctx.fillText('the ', -tot / 2, 0);
      ctx.fillStyle = '#FF6A1F'; ctx.fillText('skill', -tot / 2 + w1, 0);
      ctx.fillStyle = '#111'; ctx.fillText(' is', -tot / 2 + w1 + w2, 0);
      ctx.fillStyle = '#FF6A1F'; ctx.fillRect(-tot / 2 + w1, 40, w2 * ease.outCubic(seg(t, T_SKILL, T_SKILL + 0.3)), 6);
      ctx.restore();
    }

    // FX
    const fh = t >= T_FREE ? Math.exp(-(t - T_FREE) / 0.16) : 0;
    E.fx.shake = fh * 22 + A.pulse('kick', t, 0.1) * 8; E.fx.zoom += fh * 0.05; E.fx.rgb = fh * 8 + 1.5;
    E.fx.bloom = 0.3 + fh * 0.5; E.fx.bloomThreshold = 0.86; E.fx.vignette = 0.2;
  },
};
