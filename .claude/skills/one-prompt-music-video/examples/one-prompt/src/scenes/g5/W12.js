// W12 — "Claude does the rest, and it runs the whole show" — CURSOR conducts from a podium; the tip of its
// baton stirs a REAL GPU stable-fluids simulation (semi-Lagrangian advection, vorticity confinement,
// divergence + 24 Jacobi pressure iterations, gradient subtraction) on the shared WebGL2 context.
// Marbled blue / red / ink dye on white; every beat is a flick (new colour + impulse), "rest" is a giant
// whirlpool, and the word SHOW is poured into the dye and carried by the flow.
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, rng, font, buf, bctx, hash } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { G } from '../../core/gl.js';
import { drawMascot, pose } from '../../core/mascot.js';
import { C, slam, hit, kick } from './_g5.js';

const S = shot('W12');
const T0 = S.start;
const SW = 320, SH = 180, DW = 1280, DH = 720;
const DT = 1 / 60;
const T_REST = 70.82, T_SHOW_IN = 71.42, T_SHOW = 71.92;

// ---------- shaders ----------
const F_SPLAT = `uniform sampler2D uT; uniform vec2 a, b; uniform float aspect, radius; uniform vec4 col; uniform float mode;
void main(){
  vec2 p = uv, pa = p - a, ba = b - a; pa.x *= aspect; ba.x *= aspect;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-8), 0., 1.);
  vec2 d = pa - ba * h;
  float g = exp(-dot(d, d) / radius);
  vec4 base = texture(uT, uv);
  if (mode > 1.5) { // vortex: tangential velocity around a
    vec2 q = uv - a; q.x *= aspect; float r2 = dot(q, q); float k = exp(-r2 / radius);
    o = base + vec4(vec2(-q.y, q.x) * col.x * k / (sqrt(r2) + 0.02), 0., 0.);
  } else if (mode > 0.5) { // dye: over-composite premultiplied ink; pure white = comb the ink away (bare paper)
    if (min(col.r, min(col.g, col.b)) > 0.99) o = base * (1. - g * col.a);
    else o = base * (1. - g * col.a) + vec4(col.rgb * col.a, col.a) * g;
  } else {
    o = base + vec4(col.xy * g, 0., 0.);
  }
}`;
const F_MASK = `uniform sampler2D uT, uMask; uniform vec4 col; uniform float amt;
void main(){ vec4 base = texture(uT, uv); float m = texture(uMask, uv).a * amt; o = base * (1. - m) + vec4(col.rgb, 1.) * m; }`;
const F_CURL = `uniform sampler2D uV; void main(){ vec2 t = 1. / uRes;
  float L = texture(uV, uv - vec2(t.x, 0.)).y, R = texture(uV, uv + vec2(t.x, 0.)).y, T = texture(uV, uv + vec2(0., t.y)).x, B = texture(uV, uv - vec2(0., t.y)).x;
  o = vec4(0.5 * (R - L - T + B), 0., 0., 1.); }`;
const F_VORT = `uniform sampler2D uV, uC; uniform float curl, dt; void main(){ vec2 t = 1. / uRes;
  float L = texture(uC, uv - vec2(t.x, 0.)).x, R = texture(uC, uv + vec2(t.x, 0.)).x, T = texture(uC, uv + vec2(0., t.y)).x, B = texture(uC, uv - vec2(0., t.y)).x, Cc = texture(uC, uv).x;
  vec2 f = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L)); f /= length(f) + 1e-4; f *= curl * Cc; f.y *= -1.;
  vec2 v = texture(uV, uv).xy + f * dt; o = vec4(clamp(v, -1000., 1000.), 0., 1.); }`;
const F_DIV = `uniform sampler2D uV; void main(){ vec2 t = 1. / uRes;
  float L = texture(uV, uv - vec2(t.x, 0.)).x, R = texture(uV, uv + vec2(t.x, 0.)).x, T = texture(uV, uv + vec2(0., t.y)).y, B = texture(uV, uv - vec2(0., t.y)).y;
  vec2 C = texture(uV, uv).xy;
  if (uv.x - t.x < 0.) L = -C.x; if (uv.x + t.x > 1.) R = -C.x; if (uv.y + t.y > 1.) T = -C.y; if (uv.y - t.y < 0.) B = -C.y;
  o = vec4(0.5 * (R - L + T - B), 0., 0., 1.); }`;
const F_CLEAR = `uniform sampler2D uT; uniform float k; void main(){ o = texture(uT, uv) * k; }`;
const F_PRES = `uniform sampler2D uP, uD; void main(){ vec2 t = 1. / uRes;
  float L = texture(uP, uv - vec2(t.x, 0.)).x, R = texture(uP, uv + vec2(t.x, 0.)).x, T = texture(uP, uv + vec2(0., t.y)).x, B = texture(uP, uv - vec2(0., t.y)).x;
  o = vec4((L + R + B + T - texture(uD, uv).x) * 0.25, 0., 0., 1.); }`;
const F_GRAD = `uniform sampler2D uP, uV; void main(){ vec2 t = 1. / uRes;
  float L = texture(uP, uv - vec2(t.x, 0.)).x, R = texture(uP, uv + vec2(t.x, 0.)).x, T = texture(uP, uv + vec2(0., t.y)).x, B = texture(uP, uv - vec2(0., t.y)).x;
  vec2 v = texture(uV, uv).xy - vec2(R - L, T - B); o = vec4(v, 0., 1.); }`;
const F_ADV = `uniform sampler2D uV, uS; uniform vec2 vt; uniform float dt, diss; void main(){
  vec2 c = uv - dt * texture(uV, uv).xy * vt; o = texture(uS, c) / (1. + diss * dt); }`;
const F_INIT = `uniform float seed;
float h(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f); return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
void main(){
  // marbling tray: wavy bands of blue / red / ink with bare-paper gaps, plus a few dropped blots
  vec2 p = uv * vec2(1.7778, 1.);
  float w = p.y * 7.5 + 0.55 * sin(p.x * 3.1 + 1.3) + 0.9 * (n2(p * 2.3) - .5);
  float band = floor(w), f = fract(w);
  vec3 cols[4] = vec3[](vec3(.169,.169,1.), vec3(1.,.165,.165), vec3(.055,.055,.075), vec3(.169,.169,1.));
  int ci = int(mod(band, 4.));
  float a = smoothstep(0.0, 0.06, f) * (1. - smoothstep(0.62, 0.68, f));
  vec3 ink = cols[ci];
  o = vec4(ink * a, a);
}`;
const F_SHOW = `uniform sampler2D uD; uniform float t; uniform vec2 dyeRes;
float h2(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
void main(){
  vec4 d = texture(uD, uv);
  vec2 e = 1. / dyeRes;
  float aR = texture(uD, uv + vec2(e.x, 0.)).a, aL = texture(uD, uv - vec2(e.x, 0.)).a, aT = texture(uD, uv + vec2(0., e.y)).a, aB = texture(uD, uv - vec2(0., e.y)).a;
  float a = clamp(d.a, 0., 1.);
  vec3 ink = d.rgb / max(d.a, 1e-3);
  vec3 paper = vec3(1.);
  // faint brutalist grid on the paper
  vec2 px = uv * uRes; float g = step(mod(px.x + 0.5, 90.), 2.) + step(mod(px.y + 0.5, 90.), 2.);
  paper = mix(paper, vec3(.86,.86,1.), clamp(g, 0., 1.) * 0.6);
  vec3 col = mix(paper, ink, smoothstep(0.22, 0.42, a));
  // glossy ink: fake normal from coverage gradient
  vec3 n = normalize(vec3((aL - aR) * 3., (aB - aT) * 3., 1.));
  float spec = pow(max(dot(n, normalize(vec3(-.4, .5, .8))), 0.), 24.);
  col += spec * 0.55 * smoothstep(0.1, 0.6, a);
  col *= 1. - 0.18 * clamp(length(vec2(aL - aR, aB - aT)) * 2., 0., 1.);
  col += (h2(px + t) - .5) * 0.03;
  o = vec4(col, 1.);
}`;

// ---------- conductor geometry (shared by sim + drawing) ----------
const CX = 1180, CY = 905, CS = 1.32;
function batonTip(t) {
  const P = pose('conduct', t);
  const hx = CX + CS * P.armR[0], hy = CY + CS * (P.armR[1] - 185);
  const sx = CX + CS * 79, sy = CY + CS * (8 - 185);
  // baton points away from the shoulder, lagging + whipping on each beat
  const bt = A.beat(t);
  let ang = Math.atan2(hy - sy, hx - sx) - 0.5 + 0.35 * Math.sin(t * 7.3);
  ang += 0.55 * Math.exp(-bt.phase * 6) * Math.sin(bt.phase * 18);
  const L = 300;
  return { hx, hy, tx: hx + Math.cos(ang) * L, ty: hy + Math.sin(ang) * L, ang, P };
}

// ---------- sim ----------
let F = null;
const INK = [[0.169, 0.169, 1.0], [1.0, 0.165, 0.165], [0.055, 0.055, 0.075], [1, 1, 1]];
function maskTex(key, str, x, y, size) {
  const c = buf('W12-' + key, DW, DH), xx = bctx(c);
  xx.clearRect(0, 0, DW, DH); xx.fillStyle = '#000'; font(xx, size, 'Anton'); xx.textAlign = 'center'; xx.textBaseline = 'middle';
  xx.fillText(str, x, y);
  return G.canvasTex('W12-' + key, c);
}
function setup() {
  F = {
    vel: G.pingpong(SW, SH), dye: G.pingpong(DW, DH), pres: G.pingpong(SW, SH),
    div: G.fbo(G.texture(SW, SH, { float: true })), curl: G.fbo(G.texture(SW, SH, { float: true })),
    P: {
      splat: G.program('W12-splat', F_SPLAT), mask: G.program('W12-mask', F_MASK), curl: G.program('W12-curl', F_CURL), vort: G.program('W12-vort', F_VORT),
      div: G.program('W12-div', F_DIV), clear: G.program('W12-clear', F_CLEAR), pres: G.program('W12-pres', F_PRES), grad: G.program('W12-grad', F_GRAD),
      adv: G.program('W12-adv', F_ADV), init: G.program('W12-init', F_INIT), show: G.program('W12-show', F_SHOW),
    },
    step: -1,
    showMask: maskTex('show', 'SHOW', DW / 2, DH * 0.36, 420),
    restMask: maskTex('rest', 'THE REST', DW / 2, DH * 0.3, 230),
  };
}
function reset() {
  const { P } = F;
  for (const pp of [F.vel, F.pres]) for (const f of [pp.read, pp.write]) G.pass(F.P.clear, { uT: F.div, k: 0 }, f);
  G.pass(P.clear, { uT: F.div, k: 0 }, F.div);
  G.pass(P.init, { seed: 1 }, F.dye.read);
  F.step = 0;
}
const toUV = (x, y) => [x / W, 1 - y / H];
function splatVel(a, b, vx, vy, radius) {
  G.pass(F.P.splat, { uT: F.vel.read, a, b, aspect: W / H, radius, col: [vx, vy, 0, 0], mode: 0 }, F.vel.write); F.vel.swap();
}
function splatDye(a, b, col, alpha, radius) {
  G.pass(F.P.splat, { uT: F.dye.read, a, b, aspect: W / H, radius, col: [...col, alpha], mode: 1 }, F.dye.write); F.dye.swap();
}
function vortex(a, strength, radius) {
  G.pass(F.P.splat, { uT: F.vel.read, a, b: a, aspect: W / H, radius, col: [strength, 0, 0, 0], mode: 2 }, F.vel.write); F.vel.swap();
}
function simStep(i) {
  const t = T0 + (i + 1) * DT, tp = T0 + i * DT;
  const { P } = F;
  const k = SW / W; // px/s → sim texels/s
  // baton tip ribbon
  const b0 = batonTip(tp), b1 = batonTip(t);
  const vx = (b1.tx - b0.tx) / DT, vy = (b1.ty - b0.ty) / DT;
  const bt = A.beat(t);
  const colI = [0, 1, 3][((bt.i % 3) + 3) % 3];
  splatVel(toUV(b0.tx, b0.ty), toUV(b1.tx, b1.ty), vx * k * 1.2, -vy * k * 1.2, 0.0009);
  splatDye(toUV(b0.tx, b0.ty), toUV(b1.tx, b1.ty), INK[colI], 0.55, 0.00016);
  // beat flicks: a jet along the baton + fresh colour bloom
  for (const bb of A.eventsIn('beat', tp, t)) {
    const dir = [Math.cos(b1.ang), Math.sin(b1.ang)];
    splatVel(toUV(b1.tx, b1.ty), toUV(b1.tx + dir[0] * 40, b1.ty + dir[1] * 40), dir[0] * 1600 * k * 3, -dir[1] * 1600 * k * 3, 0.004);
    splatDye(toUV(b1.tx, b1.ty), toUV(b1.tx + dir[0] * 120, b1.ty + dir[1] * 120), INK[[1, 3, 0][((bt.i % 3) + 3) % 3]], 0.9, 0.0011);
  }
  // giant whirlpool on "rest"
  if (tp < T_REST && t >= T_REST) { vortex(toUV(760, 430), -1900 * k, 0.05); splatVel(toUV(300, 260), toUV(1500, 260), 1500 * k, 0, 0.008); }
  if (tp < T_REST + 0.6 && t >= T_REST + 0.6) vortex(toUV(1250, 360), 2000 * k, 0.04);
  // the left hand gestures too (soft secondary stir)
  const lh = [CX + CS * b1.P.armL[0], CY + CS * (b1.P.armL[1] - 185)], lh0 = [CX + CS * b0.P.armL[0], CY + CS * (b0.P.armL[1] - 185)];
  splatVel(toUV(...lh0), toUV(...lh), (lh[0] - lh0[0]) / DT * k * 2, -(lh[1] - lh0[1]) / DT * k * 2, 0.002);
  // pour the words in (single-step pours so the letters land crisp)
  const at = (T) => tp < T && t >= T;
  if (at(70.62)) { G.pass(P.mask, { uT: F.dye.read, uMask: F.restMask, col: [...INK[2], 1], amt: 0.95 }, F.dye.write); F.dye.swap(); }
  if (at(T_SHOW_IN)) {
    // fermata: the maestro holds — the flow calms, then SHOW is poured in
    G.pass(P.clear, { uT: F.vel.read, k: 0.12 }, F.vel.write); F.vel.swap();
    G.pass(P.mask, { uT: F.dye.read, uMask: F.showMask, col: [...INK[2], 1], amt: 1 }, F.dye.write); F.dye.swap();
  }
  if (at(T_SHOW)) {
    // the downbeat flourish: a red fan of ink + white combs fired from the baton tip
    for (let j = 0; j < 5; j++) { const a = -2.6 + j * 0.45, ex = b1.tx + Math.cos(a) * 260, ey = b1.ty + Math.sin(a) * 260;
      splatVel(toUV(b1.tx, b1.ty), toUV(ex, ey), Math.cos(a) * 2200 * k, -Math.sin(a) * 2200 * k, 0.0012);
      splatDye(toUV(b1.tx, b1.ty), toUV(ex, ey), INK[j % 2 ? 3 : 1], 1, 0.0007); }
  }
  // --- solve ---
  G.pass(P.curl, { uV: F.vel.read }, F.curl);
  G.pass(P.vort, { uV: F.vel.read, uC: F.curl, curl: 28, dt: DT }, F.vel.write); F.vel.swap();
  G.pass(P.div, { uV: F.vel.read }, F.div);
  G.pass(P.clear, { uT: F.pres.read, k: 0.8 }, F.pres.write); F.pres.swap();
  for (let j = 0; j < 24; j++) { G.pass(P.pres, { uP: F.pres.read, uD: F.div }, F.pres.write); F.pres.swap(); }
  G.pass(P.grad, { uP: F.pres.read, uV: F.vel.read }, F.vel.write); F.vel.swap();
  G.pass(P.adv, { uV: F.vel.read, uS: F.vel.read, vt: [1 / SW, 1 / SH], dt: DT, diss: 0.25 }, F.vel.write); F.vel.swap();
  G.pass(P.adv, { uV: F.vel.read, uS: F.dye.read, vt: [1 / SW, 1 / SH], dt: DT, diss: 0.02 }, F.dye.write); F.dye.swap();
}
function advanceTo(step) {
  if (!F) setup();
  if (F.step < 0 || step < F.step) reset();
  while (F.step < step) { simStep(F.step); F.step++; }
}

// ---------- drawing ----------
function podium(ctx, t) {
  const x = CX, y = CY;
  ctx.fillStyle = C.black; ctx.fillRect(x - 230, y + 6, 460, H - y);
  ctx.fillStyle = C.white; ctx.fillRect(x - 230, y + 6, 460, 14);
  ctx.fillStyle = C.red; ctx.fillRect(x - 230, y + 40, 460, 10);
  ctx.fillStyle = C.white; font(ctx, 46, 'Anton'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('MAESTRO >_', x, y + 105);
  // tiny score stand
  ctx.fillStyle = '#2a2a33'; ctx.fillRect(x - 330, y - 140, 12, 150);
  ctx.save(); ctx.translate(x - 324, y - 150); ctx.rotate(-0.25); ctx.fillStyle = C.white; ctx.strokeStyle = C.black; ctx.lineWidth = 5;
  ctx.fillRect(-80, -50, 160, 100); ctx.strokeRect(-80, -50, 160, 100);
  ctx.fillStyle = C.black; for (let k = 0; k < 4; k++) ctx.fillRect(-64, -32 + k * 20, 128, 2);
  for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.ellipse(-50 + k * 21, -30 + ((k * 7) % 4) * 12, 6, 4.5, -0.4, 0, TAU); ctx.fill(); }
  ctx.restore();
}

export default {
  ...S,
  cutIn: 'punch',
  sfx: [{ t: 70.82, type: 'swoosh', gain: 0.9 }, { t: 71.42, type: 'whoosh', gain: 0.5 }, { t: 71.92, type: 'bell', gain: 0.7 }],
  init() { setup(); advanceTo(2); G.shader('W12-show', F_SHOW, { uD: F.dye.read, t: 0, dyeRes: [DW, DH] }, 64, 36); F.step = -1; },
  draw(ctx, t, s, E) {
    const lt = s.lt;
    advanceTo(Math.min(Math.floor(lt * 60), 200));
    const r = G.shader('W12-show', F_SHOW, { uD: F.dye.read, t: E.frame, dyeRes: [DW, DH] }, W, H);
    G.draw(ctx, r);

    // spotlight cone on the maestro
    const g = ctx.createRadialGradient(CX, CY - 60, 50, CX, CY - 60, 520);
    g.addColorStop(0, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(CX - 600, CY - 600, 1200, 900);

    podium(ctx, t);
    const B = batonTip(t);
    const restK = kick(t, T_REST, 0.15), showK = kick(t, T_SHOW, 0.15);
    drawMascot(ctx, {
      x: CX, y: CY, s: CS, t, pose: 'conduct', mouth: 'auto', eyes: t > T_SHOW - 0.05 ? 'star' : 'normal', sticker: true,
      over: (c, P) => {
        // bow tie
        c.save(); c.translate(0, -4); c.fillStyle = C.red; c.strokeStyle = C.navy; c.lineWidth = 5;
        c.beginPath(); c.moveTo(0, 0); c.lineTo(-30, -16); c.lineTo(-30, 16); c.closePath(); c.fill(); c.stroke();
        c.beginPath(); c.moveTo(0, 0); c.lineTo(30, -16); c.lineTo(30, 16); c.closePath(); c.fill(); c.stroke();
        c.beginPath(); c.arc(0, 0, 8, 0, TAU); c.fill(); c.stroke(); c.restore();
      },
    });
    // baton (world space)
    ctx.save(); ctx.lineCap = 'round';
    ctx.strokeStyle = C.black; ctx.lineWidth = 13; ctx.beginPath(); ctx.moveTo(B.hx, B.hy); ctx.lineTo(B.tx, B.ty); ctx.stroke();
    ctx.strokeStyle = C.white; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(B.hx, B.hy); ctx.lineTo(B.tx, B.ty); ctx.stroke();
    ctx.fillStyle = C.white; ctx.strokeStyle = C.black; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(B.tx, B.ty, 8 + A.pulse('beat', t, 0.1) * 10, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.restore();
    // re-draw the glove over the baton handle
    ctx.fillStyle = C.white; ctx.strokeStyle = C.navy; ctx.lineWidth = 6 * CS; ctx.beginPath(); ctx.arc(B.hx, B.hy, 22 * CS, 0, TAU); ctx.fill(); ctx.stroke();

    // small brutalist caption chip (top-left) — the big words live in the dye
    const cap = t < 71.0 ? 'CLAUDE DOES THE REST' : 'IT RUNS THE WHOLE SHOW';
    const ci = t < 71.0 ? hit(t, T0 + 0.04, 0.2) : hit(t, 71.0, 0.2);
    ctx.save(); ctx.translate(140, 190); ctx.scale(ci, ci); font(ctx, 46, 'Anton'); const cw = ctx.measureText(cap).width + 40;
    ctx.fillStyle = C.black; ctx.fillRect(8, -30 + 8, cw, 64); ctx.fillStyle = C.blue; ctx.fillRect(0, -30, cw, 64);
    ctx.fillStyle = C.white; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(cap, 20, 3); ctx.restore();

    E.fx.shake = 14 * restK + 12 * showK + 5 * A.pulse('beat', t, 0.08);
    E.fx.zoom += 0.02 * restK + 0.025 * showK;
    E.fx.rgb = 4 * restK + 5 * showK;
    E.fx.vignette = 0.12;
  },
};
