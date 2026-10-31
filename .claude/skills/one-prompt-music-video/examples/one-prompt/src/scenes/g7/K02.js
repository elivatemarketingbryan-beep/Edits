// K02 · "Opus five point five," — CURSOR sings, rendered LIVE as ASCII by a GPU shader:
// a tiny 2D frame (mascot close-up, lip-synced) is sampled per character cell, luminance → code-glyph atlas.
// The resolution steps up on every sung word (28 → 20 → 14 → 10 px cells) with a re-sort sweep;
// OPUS / 5 / . / 5 slam in as ASCII block letters on the words.
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, seg, hash, font, buf, bctx } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { drawMascot } from '../../core/mascot.js';
import { G } from '../../core/gl.js';

const S = shot('K02');
const WORDS = [[88.78, 30], [89.12, 22], [89.46, 16], [89.80, 12], [90.09, 11]];
const RAMP = ' .\'`,:;-~=+*<>!?(){}[]/\\|1lI0O#%@';
const NG = RAMP.length;
const SW = 384, SH = 216; // source frame (1/5 res)

const FRAG = `
uniform sampler2D uSrc, uMask, uAtlas;
uniform float uT, uCs, uCsOld, uSweep, uNG, uFlash, uHue, uRain;
float h1(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
vec3 neon(float l){
  vec3 lil = vec3(.72,.61,1.), cy = vec3(.24,.94,1.), mi = vec3(.49,1.,.77);
  return l < .5 ? mix(lil, cy, l*2.) : mix(cy, mi, (l-.5)*2.);
}
float glyph(float idx, vec2 local){
  vec2 a = vec2((idx + clamp(local.x, .02, .98)) / uNG, 1. - clamp(local.y, .02, .98));
  return texture(uAtlas, a).r;
}
void main(){
  vec2 p = vec2(uv.x, 1. - uv.y) * uRes;
  float sweepX = uSweep * uRes.x;
  float cs = p.x < sweepX ? uCs : uCsOld;
  vec2 csz = vec2(cs, cs * 1.8);
  vec2 cell = floor(p / csz), local = fract(p / csz);
  vec2 c = (cell + .5) * csz / uRes;
  vec4 s = texture(uSrc, vec2(c.x, 1. - c.y));
  float m = texture(uMask, vec2(c.x, 1. - c.y)).r;
  float l = dot(s.rgb, vec3(.299,.587,.114));
  float lr = l;
  l = smoothstep(.06, .85, l);
  // background: deep violet gradient + digital rain
  vec3 bg = mix(vec3(.10,.06,.24), vec3(.04,.02,.11), uv.y * .6 + length(uv - .5) * .7);
  vec3 col = bg;
  float rnd = h1(cell + floor(uT * 9.));
  float colh = h1(vec2(cell.x, 7.));
  float rain = fract(colh * 4. - uT * (.35 + colh * .5) + cell.y * csz.y / uRes.y * .9);
  rain = pow(rain, 6.) * uRain;
  // glyph choice
  float shimmer = step(.93, rnd) * .25;
  float idx = floor(clamp(l * 1.15 + shimmer, 0., .999) * uNG);
  vec3 gcol;
  float sat = max(s.r, max(s.g, s.b)) - min(s.r, min(s.g, s.b));
  float mxc = max(s.r, max(s.g, s.b));
  gcol = sat > .35 ? (s.rgb / max(mxc, .001)) * vec3(1., .95, .9) : neon(clamp(l * 1.1, 0., 1.)) * (.45 + l * .9);
  float cov = 0.;
  if (lr > .03) { cov = glyph(idx, local); col += s.rgb * .2 * step(.35, sat) + vec3(.05,.08,.12) * l; }
  // text mask: dense block glyphs, lilac→white, shimmering
  if (m > .35) {
    float ti = floor(mix(uNG - 6., uNG - .01, h1(cell + floor(uT * 14.))));
    cov = max(cov * .2, glyph(ti, local));
    gcol = mix(vec3(.78,.66,1.), vec3(1.), .5 + .5 * sin(cell.x * .4 + cell.y * .3 - uT * 10.));
    gcol = mix(gcol, vec3(.49,1.,.77), step(.9, h1(cell + floor(uT * 6.))));
  } else if (lr <= .03) {
    float ri = floor(h1(cell + floor(uT * 7.)) * (uNG - 1.)) + 1.;
    cov = glyph(ri, local) * rain;
    gcol = vec3(.45,.33,.95);
  }
  // re-sort sweep front: random bright glyphs
  float d = sweepX - p.x;
  if (d > 0. && d < 140.) {
    float ri = floor(h1(cell + floor(uT * 30.)) * uNG);
    float k = 1. - d / 140.;
    cov = max(cov, glyph(ri, local) * k);
    gcol = mix(gcol, vec3(.75,1.,.95), k);
  }
  col += gcol * cov;
  col += uFlash * vec3(.3,.25,.6);
  o = vec4(col, 1.);
}`;

let atlas = null;
function makeAtlas() {
  const gw = 48, gh = 86, c = buf('K02-atlas', gw * NG, gh), x = bctx(c);
  x.fillStyle = '#000'; x.fillRect(0, 0, c.width, c.height);
  x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle';
  font(x, 70, 'JetBrains Mono', '800');
  for (let i = 0; i < NG; i++) x.fillText(RAMP[i], i * gw + gw / 2, gh / 2 + 2);
  return c;
}

function cellSize(t) {
  let cs = WORDS[0][1], old = WORDS[0][1], sweep = 1.2;
  for (let i = 0; i < WORDS.length; i++) {
    if (t >= WORDS[i][0]) { old = i ? WORDS[i - 1][1] : WORDS[0][1]; cs = WORDS[i][1]; sweep = lerp(-0.08, 1.2, ease.outCubic(seg(t, WORDS[i][0], WORDS[i][0] + 0.2))); }
  }
  return { cs, old, sweep };
}

export default {
  ...S,
  cutIn: 'glitch',
  init() { atlas = atlas || makeAtlas(); G.program('K02', FRAG); },
  sfx: [{ t: 88.78, type: 'glitch', gain: 0.7 }, { t: 89.8, type: 'type' }],
  draw(ctx, t, s, E) {
    if (!atlas) atlas = makeAtlas();
    const lt = s.lt, fx = E.fx;
    // ---- source frame (1/5 res): CURSOR close-up singing, camera push + sway ----
    const src = buf('K02-src', SW, SH), sx = bctx(src);
    sx.setTransform(1, 0, 0, 1, 0, 0); sx.fillStyle = '#000'; sx.fillRect(0, 0, SW, SH);
    const push = 1 + lt * 0.12 + A.pulse('beat', t, 0.15) * 0.04;
    const k = SW / W;
    sx.save(); sx.scale(k, k);
    sx.translate(1390, 600); sx.scale(push, push); sx.rotate(Math.sin(lt * 2.2) * 0.04); sx.translate(-1390, -600);
    // soft halo behind the singer so the glyph field breathes with the vocal
    const v = A.env('vocal', t);
    // sound rings from the mouth (become sparse glyph ripples)
    for (let i = 0; i < 3; i++) { const rr = ((lt * 1.6 + i / 3) % 1); sx.strokeStyle = `rgba(120,230,255,${(1 - rr) * (0.25 + v * 0.5)})`; sx.lineWidth = 26; sx.beginPath(); sx.arc(1390, 700, 280 + rr * 700, 0, TAU); sx.stroke(); }
    drawMascot(sx, { x: 1400, y: 1290, s: 2.95, t, pose: 'sing', mouth: 'auto', eyes: t > 89.8 ? 'star' : 'normal', look: [-0.3, -0.2] });
    sx.restore();
    // ---- text mask: OPUS / 5 . 5 ----
    const msk = buf('K02-mask', SW, SH), mx = bctx(msk);
    mx.setTransform(1, 0, 0, 1, 0, 0); mx.fillStyle = '#000'; mx.fillRect(0, 0, SW, SH);
    mx.save(); mx.scale(k, k); mx.fillStyle = '#fff'; mx.textAlign = 'center'; mx.textBaseline = 'middle';
    const pop = (tw) => { const u = seg(t, tw, tw + 0.16); return u <= 0 ? 0 : ease.outBack(u, 2.4); };
    const p0 = pop(88.78);
    if (p0 > 0) { mx.save(); mx.translate(500, 370); mx.scale(p0, p0); font(mx, 230, 'Rubik Mono One'); mx.fillText('OPUS', 0, 0); mx.restore(); }
    const glyphs = [['5', 89.12, 250], ['.', 89.46, 470], ['5', 89.80, 690]];
    font(mx, 380, 'Rubik Mono One');
    for (const [g, tw, gx] of glyphs) { const p = pop(tw); if (p <= 0) continue; mx.save(); mx.translate(gx, 700); mx.scale(p, p); mx.fillText(g, 0, 0); mx.restore(); }
    mx.restore();

    const { cs, old, sweep } = cellSize(t);
    const hit = Math.max(...WORDS.map(([tw]) => (t >= tw ? Math.exp(-(t - tw) / 0.08) : 0)));
    const r = G.shader('K02', FRAG, {
      uSrc: G.canvasTex('K02src', src), uMask: G.canvasTex('K02mask', msk), uAtlas: G.canvasTex('K02atlas', atlas),
      uT: t, uCs: cs, uCsOld: old, uSweep: sweep, uNG: NG, uFlash: hit * 0.6, uRain: 0.55 + A.env('hat', t) * 0.6,
    });
    G.draw(ctx, r);

    // ---- terminal chrome (small, inside safe zone) ----
    ctx.save();
    font(ctx, 22, 'JetBrains Mono', '700'); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = 'rgba(124,255,196,0.85)';
    const cols = Math.floor(W / cs), rows = Math.floor(H / (cs * 1.8));
    ctx.fillText(`$ ascii --live cursor.cam --grid ${cols}x${rows} --font mono`, 96, 170);
    ctx.fillStyle = 'rgba(183,156,255,0.7)';
    ctx.fillText(`render: ${(cols * rows).toLocaleString('en-US')} glyphs/frame · vocal ${(v * 100).toFixed(0).padStart(3, '0')}%`, 96, 202);
    ctx.restore();

    fx.bloom = 0.75; fx.bloomThreshold = 0.55; fx.scanlines = 0.12; fx.vignette = 0.45;
    fx.rgb = 2 + hit * 8; fx.zoom += hit * 0.02;
    if (hit > 0.5) { fx.glitch = (hit - 0.5) * 0.6; fx.glitchSeed = E.frame; }
  },
};
