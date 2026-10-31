// K08 · "and the whole thing comes alive" — GPU Gray–Scott reaction-diffusion (ping-pong float FBOs, 480×270,
// 24 steps/frame, deterministic: the step count is a function of the frame, re-run from 0 when scrubbing back).
// Coral grows from seeds inside the letters of ALIVE (outside is a kill zone); on "alive" the kill zone lifts,
// a seeding shockwave rolls out and fingerprint labyrinths swallow the whole frame. Shaded as glossy embossed
// jelly; the palette drifts neon → sunset peach for the hand-off to the bridge.
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, seg, font, buf, bctx } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { G } from '../../core/gl.js';
import { K, chromeText } from './lib7.js';

const S = shot('K08');
const SW = 480, SH = 270, PER = 24;
const T_ALIVE = 104.57;
const stepAt = (t) => Math.max(0, Math.round((t - S.start) * 30)) * PER;
const S_REL = stepAt(T_ALIVE);
const WORDS = [['AND', 102.84], ['THE', 103.06], ['WHOLE', 103.22], ['THING', 103.44], ['COMES', 103.74]];

const INIT = `
uniform sampler2D uMask;
float h(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
void main(){
  float m = texture(uMask, uv).r;
  vec2 cell = floor(uv * uRes / 3.);
  float seed = step(.982, h(cell)) * step(.5, m);
  o = vec4(1. - seed * .5, seed, 0., 1.);
}`;
const STEP = `
uniform sampler2D uS, uMask;
uniform vec2 uPx; uniform float uRel, uWave;
float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main(){
  vec2 c = texture(uS, uv).rg;
  vec2 lap = -c;
  lap += .2 * (texture(uS, uv + vec2(uPx.x, 0.)).rg + texture(uS, uv - vec2(uPx.x, 0.)).rg + texture(uS, uv + vec2(0., uPx.y)).rg + texture(uS, uv - vec2(0., uPx.y)).rg);
  lap += .05 * (texture(uS, uv + uPx).rg + texture(uS, uv - uPx).rg + texture(uS, uv + vec2(uPx.x, -uPx.y)).rg + texture(uS, uv + vec2(-uPx.x, uPx.y)).rg);
  float m = smoothstep(.3, .7, texture(uMask, uv).r);
  vec2 q = (uv - vec2(.5, .44)) * vec2(1.78, 1.);
  float r = length(q);
  // outside: kill zone until released; afterwards fingerprint labyrinth behind the wave front
  float open = uRel * smoothstep(uWave, uWave - .08, r);
  float f = mix(mix(.010, .039, open), .0545, m);
  float k = mix(mix(.090, .058, open), .062, m);
  float A = c.r, B = c.g;
  float abb = A * B * B;
  A += lap.r * 1.0 - abb + f * (1. - A);
  B += lap.g * .5 + abb - (k + f) * B;
  // the wave seeds as it passes
  float ring = uRel * (1. - smoothstep(0., .025, abs(r - uWave)));
  if (ring > .5 && h(floor(uv * uRes / 3.)) > .965) { B = 1.; A = .5; }
  o = vec4(clamp(A, 0., 1.), clamp(B, 0., 1.), 0., 1.);
}`;
const SHOW = `
uniform sampler2D uS, uMask;
uniform vec2 uPx; uniform float uWarm, uT, uZoom, uPulse;
vec3 pal(vec2 p, float w){
  vec3 a = mix(vec3(.24,.94,1.), vec3(.72,.61,1.), smoothstep(.0, 1., p.x * .8 + p.y * .4));
  a = mix(a, vec3(.49,1.,.77), smoothstep(.55, 1., p.y + sin(p.x * 3. + uT) * .1));
  vec3 b = mix(vec3(1.,.56,.69), vec3(1.,.70,.54), smoothstep(.0, 1., p.x * .8 + p.y * .4));
  b = mix(b, vec3(1.,.69,.0), smoothstep(.6, 1., p.y + sin(p.x * 3. + uT) * .1) * .8);
  return mix(a, b, w);
}
void main(){
  vec2 u = (uv - .5) / uZoom + .5;
  float B = texture(uS, u).g;
  float bx = texture(uS, u + vec2(uPx.x, 0.)).g - texture(uS, u - vec2(uPx.x, 0.)).g;
  float by = texture(uS, u + vec2(0., uPx.y)).g - texture(uS, u - vec2(0., uPx.y)).g;
  float v = smoothstep(.12, .32, B);
  vec3 n = normalize(vec3(-bx * 9., -by * 9., 1.));
  vec3 L = normalize(vec3(-.5, .6, .8));
  float dif = clamp(dot(n, L), 0., 1.);
  float spec = pow(clamp(dot(reflect(-L, n), vec3(0., 0., 1.)), 0., 1.), 28.);
  vec3 bgA = mix(vec3(.90,.85,1.), vec3(.80,.97,1.), uv.x + (uv.y - .5) * .3);
  vec3 bgB = mix(vec3(1.,.96,.92), vec3(1.,.90,.86), uv.x);
  vec3 bg = mix(bgA, bgB, uWarm);
  float m = texture(uMask, u).r;
  bg = mix(bg, mix(vec3(.80,.74,1.), vec3(1.,.82,.74), uWarm), m * .35);   // ghost of the letters
  vec3 pc = pal(uv, uWarm) * (.55 + .55 * dif) + spec * .8;
  float edge = 1. - smoothstep(.0, .06, abs(B - .2));
  vec3 ink = mix(vec3(.16,.10,.42), vec3(.55,.18,.30), uWarm);
  vec3 col = mix(bg, pc, v);
  col = mix(col, ink, edge * .55);
  col *= 1. + uPulse * .06;
  o = vec4(col, 1.);
}`;

let R = null;
function sim(step) {
  if (!R) {
    const mc = buf('K08-mask', SW, SH), mx = bctx(mc);
    mx.fillStyle = '#000'; mx.fillRect(0, 0, SW, SH);
    mx.fillStyle = '#fff'; mx.textAlign = 'center'; mx.textBaseline = 'middle'; font(mx, 158, 'Anton');
    mx.fillText('ALIVE', SW / 2, SH * 0.56);
    R = { pp: G.pingpong(SW, SH), mask: G.canvasTex('K08mask', mc), cur: -1, init: G.program('K08init', INIT), step: G.program('K08step', STEP) };
  }
  if (step < R.cur || R.cur < 0) { G.pass(R.init, { uMask: R.mask }, R.pp.read); R.cur = 0; }
  while (R.cur < step) {
    const s = R.cur;
    const rel = s >= S_REL ? 1 : 0;
    const wave = rel ? (s - S_REL) / PER / 30 * 1.6 : 0; // radius units per second
    G.pass(R.step, { uS: R.pp.read, uMask: R.mask, uPx: [1 / SW, 1 / SH], uRel: rel, uWave: wave }, R.pp.write);
    R.pp.swap(); R.cur++;
  }
  return R;
}

export default {
  ...S,
  cutIn: 'flash',
  init() { sim(0); G.program('K08show', SHOW); },
  sfx: [{ t: T_ALIVE, type: 'riser', gain: 0.7 }, { t: T_ALIVE, type: 'boom', gain: 0.9 }],
  draw(ctx, t, s, E) {
    const lt = s.lt, fx = E.fx;
    const st = sim(stepAt(t));
    const warm = ease.inOutCubic(seg(t, 104.9, 106.0));
    const zoom = 1 + lt * 0.03 + (t > T_ALIVE ? ease.outExpo(seg(t, T_ALIVE, T_ALIVE + 0.4)) * 0.05 : 0);
    const r = G.shader('K08show', SHOW, { uS: st.pp.read, uMask: st.mask, uPx: [1 / SW, 1 / SH], uWarm: warm, uT: t, uZoom: zoom, uPulse: A.pulse('beat', t, 0.12) });
    G.draw(ctx, r);
    // crisp outline of ALIVE (full res) — pulses on "alive", fades as the growth takes the frame
    const al = t >= T_ALIVE ? t - T_ALIVE : -1;
    const pop = al >= 0 ? 1 + Math.exp(-al / 0.12) * 0.08 : 1;
    const outA = al >= 0 ? clamp(1 - (al - 0.5) / 0.6) : 1;
    if (outA > 0) {
      ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(zoom * pop, zoom * pop); ctx.translate(0, H * 0.06);
      font(ctx, 158 * 4, 'Anton'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.globalAlpha = outA; ctx.lineJoin = 'round';
      ctx.lineWidth = 14; ctx.strokeStyle = warm > 0.5 ? '#8A2E4A' : '#2A1A70'; ctx.strokeText('ALIVE', 0, 0);
      ctx.lineWidth = 4; ctx.strokeStyle = '#FFFFFF'; ctx.strokeText('ALIVE', 0, 0);
      ctx.restore();
    }
    // the line, word by word above the word
    ctx.save(); ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; font(ctx, 54, 'Rubik Mono One');
    const words = WORDS.filter(([, tw]) => t >= tw);
    const gap = 26; let total = 0; const ws = WORDS.map(([w]) => ctx.measureText(w).width); total = ws.reduce((a, b) => a + b, 0) + gap * (ws.length - 1);
    let x = W / 2 - total / 2;
    WORDS.forEach(([w, tw], i) => {
      if (t >= tw) {
        const k = ease.outBack(seg(t, tw, tw + 0.16), 2.4), yy = 176 - (1 - k) * 40;
        ctx.save(); ctx.globalAlpha = clamp(k) * (al >= 0 ? clamp(1 - (al - 0.6) / 0.4) : 1); ctx.translate(x + ws[i] / 2, yy); ctx.scale(k, k);
        ctx.fillStyle = '#FFFFFF'; ctx.lineWidth = 12; ctx.strokeStyle = warm > 0.5 ? '#8A2E4A' : '#1A1240'; ctx.lineJoin = 'round';
        ctx.textAlign = 'center'; ctx.strokeText(w, 0, 0); ctx.fillText(w, 0, 0); ctx.restore();
      }
      x += ws[i] + gap;
    });
    ctx.restore();
    // ALIVE! chrome slam on the word
    if (al >= 0 && al < 1.0) {
      const k = ease.outBack(clamp(al / 0.18), 2.2), a = clamp(1 - (al - 0.7) / 0.3);
      ctx.save(); ctx.globalAlpha = a;
      chromeText(ctx, 'IT LIVES', W / 2, 880, { size: 120 * k, family: 'Rubik Mono One', fill: warm > 0.3 ? '#FFB000' : K.mint, stroke: '#1A1240', strokeW: 14, shadow: 10 });
      ctx.restore();
    }
    const hit = al >= 0 ? Math.exp(-al / 0.12) : 0;
    fx.shake = hit * 18; fx.rgb = 2 + hit * 10; fx.zoom += hit * 0.04 + A.pulse('kick', t, 0.15) * 0.015;
    fx.bloom = 0.2; fx.bloomThreshold = 0.85;
    if (al >= 0 && al < 0.04) fx.flash = [1, 1, 1, 0.45];
  },
};
