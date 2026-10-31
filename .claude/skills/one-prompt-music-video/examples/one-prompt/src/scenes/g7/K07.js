// K07 · "One prompt," — Conway's Game of Life (B3/S23) on a 192×108 torus, 30 generations/s, simulated
// deterministically from the shot start (lib.sim). Soup patches + a fleet of gliders and spaceships. On "One" a
// scan bar prints ONE into the grid, on "prompt" PROMPT; the letters are held alive as a boundary condition
// (a boiling aura grows around them) and released on the downbeat — the words themselves come alive and explode
// into life. Rendered by a fragment shader: rounded glowing cells, lilac death trails, perspective tilt.
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, seg, hash, rng, font, buf, bctx, sim, noise2 } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { G } from '../../core/gl.js';

const S = shot('K07');
const GW = 192, GH = 108, GPS = 30;
const T_ONE = 100.92, T_PROMPT = 101.48, T_REL = 102.08;
// 30 gen/s while seeding, then 9 gen/s after the release so you can watch the letters mutate
const genAt = (t) => Math.max(0, Math.floor((Math.min(t, T_REL) - S.start) * GPS) + (t > T_REL ? Math.floor((t - T_REL) * 9) : 0));
const G_ONE = genAt(T_ONE), G_PROMPT = genAt(T_PROMPT), G_REL = genAt(T_REL), SWEEP = 4;

let MASK = null; // 0 none, 1 = ONE, 2 = PROMPT ; band rows
function textMask() {
  if (MASK) return MASK;
  const c = buf('read-K07mask', GW, GH), x = bctx(c);
  x.clearRect(0, 0, GW, GH); x.fillStyle = '#f00'; x.textAlign = 'center'; x.textBaseline = 'middle';
  font(x, 40, 'Anton'); x.fillText('ONE', GW / 2, 33);
  x.fillStyle = '#0f0'; font(x, 40, 'Anton'); x.fillText('PROMPT', GW / 2, 76);
  const d = x.getImageData(0, 0, GW, GH).data, m = new Uint8Array(GW * GH);
  for (let i = 0; i < GW * GH; i++) m[i] = d[i * 4 + 3] > 110 ? (d[i * 4] > d[i * 4 + 1] ? 1 : 2) : 0;
  MASK = m; return m;
}
const BAND = { 1: [14, 52], 2: [56, 96] };

function initState() {
  const r = rng(1970), a = new Uint8Array(GW * GH);
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
    const n = noise2(x * 0.06, y * 0.06);
    if (n > 0.32 && r() < 0.4) a[y * GW + x] = 1;
  }
  const put = (pat, ox, oy, fx = 1, fy = 1) => pat.forEach(([px, py]) => { const X = (ox + px * fx + GW) % GW, Y = (oy + py * fy + GH) % GH; a[Y * GW + X] = 1; });
  const glider = [[1, 0], [2, 1], [0, 2], [1, 2], [2, 2]];
  const lwss = [[1, 0], [4, 0], [0, 1], [0, 2], [4, 2], [0, 3], [1, 3], [2, 3], [3, 3]];
  for (let i = 0; i < 34; i++) put(glider, r.int(0, GW - 1), r.int(0, GH - 1), r.sign(), r.sign());
  for (let i = 0; i < 8; i++) put(lwss, r.int(0, GW - 1), r.int(0, GH - 1), r.sign(), 1);
  return { a, b: new Uint8Array(GW * GH), age: new Uint8Array(GW * GH), trail: new Uint8Array(GW * GH), text: new Uint8Array(GW * GH), gen: 0 };
}
function step(st) {
  const { a, b, age, trail, text } = st, m = textMask(), g = st.gen + 1;
  for (let y = 0; y < GH; y++) {
    const ym = ((y - 1 + GH) % GH) * GW, y0 = y * GW, yp = ((y + 1) % GH) * GW;
    for (let x = 0; x < GW; x++) {
      const xm = (x - 1 + GW) % GW, xp = (x + 1) % GW;
      const n = a[ym + xm] + a[ym + x] + a[ym + xp] + a[y0 + xm] + a[y0 + xp] + a[yp + xm] + a[yp + x] + a[yp + xp];
      const i = y0 + x, alive = a[i];
      const nv = (n === 3 || (alive && n === 2)) ? 1 : 0;
      b[i] = nv;
      if (nv) { age[i] = Math.min(255, age[i] + 1); trail[i] = 255; } else { age[i] = 0; const dec = g > G_REL ? 26 : 18; trail[i] = trail[i] > dec ? trail[i] - dec : 0; if (alive) trail[i] = 200; }
    }
  }
  // stamping sweeps + hold
  const stamp = (id, g0) => {
    if (g < g0) return;
    const [r0, r1] = BAND[id];
    const k = clamp((g - g0 + 1) / SWEEP), xMax = Math.floor(k * GW);
    const hold = g < G_REL;
    for (let y = r0; y <= r1; y++) for (let x = 0; x < xMax; x++) {
      const i = y * GW + x;
      if (m[i] === id) { if (hold || g < g0 + SWEEP) { if (!b[i]) age[i] = 0; b[i] = 1; text[i] = 1; } }
      else if (g < g0 + SWEEP && x >= Math.floor(((g - g0) / SWEEP) * GW)) { b[i] = 0; age[i] = 0; text[i] = 0; }
    }
  };
  stamp(1, G_ONE); stamp(2, G_PROMPT);
  if (g === G_REL) { // release: each letter becomes a 45% living soup in its own shape → it boils into life
    for (let i = 0; i < text.length; i++) if (m[i]) { b[i] = hash(i, 7) < 0.45 ? 1 : 0; age[i] = 0; text[i] = b[i]; trail[i] = 140; }
  }
  if (g > G_REL) for (let i = 0; i < text.length; i++) if (!b[i]) text[i] = 0;
  st.a = b; st.b = a; st.gen = g;
}

const FRAG = `
uniform sampler2D uS;
uniform float uT, uTilt, uZoom, uRot, uScan, uScanOn, uPulse, uRel;
uniform vec2 uPan;
vec3 lil = vec3(.72,.61,1.), cy = vec3(.24,.94,1.), mi = vec3(.49,1.,.77);
void main(){
  vec2 s = (uv - .5) * vec2(uRes.x / uRes.y, 1.) * 2.;
  float f = 1.;
  float c = cos(uTilt), sn = sin(uTilt);
  float tt = c / (f * c - s.y * sn);
  vec2 pl = vec2(tt * s.x, tt * (s.y * c + f * sn) - sn);
  float cr = cos(uRot), sr = sin(uRot);
  pl = mat2(cr, -sr, sr, cr) * pl;
  vec2 px = pl / uZoom * (uRes.y * .5) + uRes * .5 + uPan;   // grid pixel coords (y up)
  px.y = uRes.y - px.y;
  vec2 cell = px / 10.;
  vec3 bg = mix(vec3(.10,.05,.25), vec3(.03,.02,.09), clamp(length(uv - .5) * 1.4, 0., 1.));
  vec3 col = bg;
  if (tt > 0. && cell.x >= 0. && cell.y >= 0. && cell.x < ${GW}. && cell.y < ${GH}.) {
    vec2 ci = floor(cell), lc = fract(cell) - .5;
    vec4 st = texture(uS, (ci + .5) / vec2(${GW}., ${GH}.) * vec2(1., -1.) + vec2(0., 1.));
    float alive = st.r, trail = st.g, txt = step(.97, st.b), age = st.b * (1. - txt);
    // grid
    float gl = max(step(.46, abs(lc.x)), step(.46, abs(lc.y)));
    col += gl * vec3(.42,.32,.95) * .10;
    vec2 q = abs(lc) - vec2(.30); float d = length(max(q, 0.)) - .1;
    float box = smoothstep(.06, -.02, d);
    float halo = smoothstep(.5, .0, length(lc)) ;
    vec3 ccol = mix(vec3(1.), mix(cy, mi, clamp(age * 6., 0., 1.)), clamp(age * 30., 0., 1.));
    ccol = mix(ccol, vec3(1., .98, .9), txt * .7);
    col += alive * (box * ccol * (1.15 + uPulse * .4) + halo * ccol * .25);
    col += (1. - alive) * trail * trail * box * lil * .4;
  }
  // scan bar
  float sx = uScan * uRes.x;
  float dsc = abs(px.x - sx);
  col += uScanOn * (exp(-dsc * .03) * vec3(.6,1.,.9) * 1.2 + exp(-dsc * .004) * vec3(.3,.2,.8) * .3);
  o = vec4(col, 1.);
}`;

export default {
  ...S,
  cutIn: 'black',
  init() { textMask(); G.program('K07', FRAG); },
  sfx: [{ t: T_ONE, type: 'stamp' }, { t: T_PROMPT, type: 'stamp' }, { t: T_REL, type: 'boom', gain: 0.8 }],
  draw(ctx, t, s, E) {
    textMask();
    const g = genAt(t);
    const st = sim('K07', g, initState, (state) => step(state));
    // upload state
    const c = buf('read-K07state', GW, GH), x = bctx(c);
    const img = c._img || (c._img = x.createImageData(GW, GH)), d = img.data;
    let pop = 0;
    for (let i = 0; i < GW * GH; i++) { const o = i * 4; d[o] = st.a[i] * 255; d[o + 1] = st.trail[i]; d[o + 2] = st.text[i] ? 255 : Math.min(240, st.age[i] * 8); d[o + 3] = 255; pop += st.a[i]; }
    x.putImageData(img, 0, 0);
    const lt = s.lt;
    const tilt = lerp(0.42, 0.12, ease.inOutCubic(seg(t, S.start, T_ONE))) + (t > T_REL ? ease.inOutCubic(seg(t, T_REL, S.end)) * 0.35 : 0);
    const zoom = lerp(1.25, 1.0, ease.outCubic(seg(t, S.start, T_ONE))) * (t > T_REL ? 1 + ease.inCubic(seg(t, T_REL, S.end)) * 0.25 : 1) * (1 + A.pulse('beat', t, 0.12) * 0.015);
    const rot = lerp(-0.12, 0, ease.inOutCubic(seg(t, S.start, T_ONE))) + (t > T_REL ? ease.inCubic(seg(t, T_REL, S.end)) * 0.12 : 0);
    let scan = -1, scanOn = 0;
    for (const T of [T_ONE, T_PROMPT]) { const u = (t - T) / (SWEEP / GPS); if (u >= -0.05 && u < 1.6) { scan = u; scanOn = Math.max(0, 1 - Math.max(0, u - 1) * 1.6); } }
    const r = G.shader('K07', FRAG, {
      uS: G.canvasTex('K07s', c, false), uT: t, uTilt: tilt, uZoom: zoom, uRot: rot, uPan: [0, 0], uScan: scan, uScanOn: scanOn,
      uPulse: A.pulse('beat', t, 0.1), uRel: t > T_REL ? 1 : 0,
    });
    G.draw(ctx, r);
    // readouts
    ctx.save(); font(ctx, 24, 'JetBrains Mono', '700'); ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(124,255,196,0.9)';
    ctx.fillText(`B3/S23 · GEN ${String(st.gen).padStart(4, '0')} · POP ${pop.toLocaleString('en-US')}`, 96, 170);
    ctx.fillStyle = 'rgba(183,156,255,0.75)';
    const phase = t < T_ONE ? 'random soup + 34 gliders + 8 spaceships' : t < T_REL ? 'seeding prompt… holding' : 'released → it lives';
    ctx.fillText(`> ${phase}`, 96, 202);
    ctx.restore();
    const fx = E.fx;
    const hit = Math.max(t >= T_ONE ? Math.exp(-(t - T_ONE) / 0.1) : 0, t >= T_PROMPT ? Math.exp(-(t - T_PROMPT) / 0.1) : 0), rel = t >= T_REL ? Math.exp(-(t - T_REL) / 0.15) : 0;
    fx.bloom = 0.9 + hit * 0.5 + rel * 0.6; fx.bloomThreshold = 0.45;
    fx.rgb = 2 + hit * 6 + rel * 10; fx.shake = hit * 8 + rel * 14; fx.zoom += hit * 0.02 + rel * 0.04;
    fx.vignette = 0.5; fx.scanlines = 0.06;
  },
};
