// W11 — "press go" — a huge glossy red arcade GO button; CURSOR winds up and slams it with its glove on "go".
// The whole frame (rendered to a texture) goes through a GLSL refraction shockwave: a derivative-of-Gaussian
// radial displacement ring (+ a second, smaller echo) with per-channel chromatic dispersion and a hot rim.
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, font, buf, bctx, wobble, rng } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { G } from '../../core/gl.js';
import { drawMascot } from '../../core/mascot.js';
import { C, slam, hit, kick, grid, speedLines } from './_g5.js';

const S = shot('W11');
const T0 = S.start;
const T_GO = 69.8;
const BXc = 860, BYc = 650; // button centre (screen)

const FRAG = `
uniform sampler2D uT; uniform vec2 uC; uniform float uR, uR2, uAmp, uW, uRim;
void main(){
  vec2 px = uv * uRes; vec2 d = px - uC; float L = length(d); vec2 n = d / max(L, 1.);
  float x1 = (L - uR) / uW, x2 = (L - uR2) / (uW * .7);
  float s = (-x1 * exp(-x1 * x1) - .6 * x2 * exp(-x2 * x2)) * uAmp;
  vec2 off = n * s / uRes;
  vec3 c;
  c.r = texture(uT, uv - off * 1.35).r; c.g = texture(uT, uv - off).g; c.b = texture(uT, uv - off * .7).b;
  c = mix(c, vec3(1.), exp(-x1 * x1 * 5.) * uRim * .75); c += vec3(.1, .1, .5) * exp(-x2 * x2 * 4.) * uRim;
  o = vec4(c, 1.);
}`;

function button(x, t, press, glow) {
  const cx = BXc, cy = BYc, rx = 330, ry = 120;
  // housing
  x.fillStyle = C.black; x.beginPath(); x.ellipse(cx + 12, cy + 120, rx + 120, ry + 60, 0, 0, TAU); x.fill();
  x.fillStyle = '#2A2A33'; x.beginPath(); x.ellipse(cx, cy + 100, rx + 110, ry + 52, 0, 0, TAU); x.fill();
  x.fillStyle = '#4A4A58'; x.beginPath(); x.ellipse(cx, cy + 86, rx + 96, ry + 44, 0, 0, TAU); x.fill();
  x.fillStyle = '#16161C'; x.beginPath(); x.ellipse(cx, cy + 80, rx + 34, ry + 22, 0, 0, TAU); x.fill();
  // glow ring
  if (glow > 0) { x.strokeStyle = `rgba(255,80,80,${glow})`; x.lineWidth = 14; x.beginPath(); x.ellipse(cx, cy + 80, rx + 44, ry + 28, 0, 0, TAU); x.stroke(); }
  // cap: cylinder side + dome top
  const hgt = lerp(110, 26, press), top = cy + 80 - hgt;
  const sg = x.createLinearGradient(cx - rx, 0, cx + rx, 0);
  sg.addColorStop(0, '#8A0010'); sg.addColorStop(0.3, '#E0101E'); sg.addColorStop(0.55, '#FF4A4A'); sg.addColorStop(1, '#7A0010');
  x.fillStyle = sg; x.beginPath(); x.ellipse(cx, cy + 80, rx, ry, 0, 0, Math.PI); x.lineTo(cx - rx, top); x.ellipse(cx, top, rx, ry, 0, Math.PI, 0, true); x.closePath(); x.fill();
  x.lineWidth = 8; x.strokeStyle = C.black; x.stroke();
  const tg = x.createRadialGradient(cx - 90, top - 50, 20, cx, top, rx * 1.1);
  tg.addColorStop(0, '#FF8A8A'); tg.addColorStop(0.35, '#FF2A2A'); tg.addColorStop(1, '#B00010');
  x.fillStyle = tg; x.beginPath(); x.ellipse(cx, top, rx, ry, 0, 0, TAU); x.fill(); x.stroke();
  // GO on the cap (foreshortened)
  x.save(); x.translate(cx, top + 4); x.scale(1, ry / rx * 1.15); font(x, 300, 'Anton'); x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillStyle = 'rgba(80,0,10,0.6)'; x.fillText('GO', 8, 14); x.fillStyle = '#FFFFFF'; x.fillText('GO', 0, 0); x.restore();
  // gloss
  x.fillStyle = 'rgba(255,255,255,0.55)'; x.beginPath(); x.ellipse(cx - 150, top - 50, 90, 26, -0.25, 0, TAU); x.fill();
  x.fillStyle = 'rgba(255,255,255,0.35)'; x.beginPath(); x.ellipse(cx - 250, top + 40, 20, 50, 0.3, 0, TAU); x.fill();
}

export default {
  ...S,
  cutIn: 'punch',
  sfx: [{ t: 69.62, type: 'whoosh', gain: 0.5 }, { t: 69.8, type: 'boom', gain: 1 }],
  init() { G.program('W11', FRAG); },
  draw(ctx, t, s, E) {
    const lt = s.lt;
    const go = t - T_GO;
    const press = go < 0 ? 0 : go < 0.08 ? ease.outExpo(go / 0.03) : 1 - 0.6 * ease.outBack(clamp((go - 0.08) / 0.2));
    // ---- 2D frame into a buffer ----
    const b = buf('W11-base', W, H), x = bctx(b);
    x.setTransform(1, 0, 0, 1, 0, 0);
    const pz = 1 + lt * 0.06;
    x.fillStyle = C.white; x.fillRect(0, 0, W, H);
    x.save(); x.translate(BXc, BYc); x.scale(pz, pz); x.translate(-BXc, -BYc);
    grid(x, 60, 'rgba(43,43,255,0.35)', 2, 0, 0, -200, -200, W + 400, H + 400);
    grid(x, 240, 'rgba(43,43,255,0.6)', 4, 0, 0, -200, -200, W + 400, H + 400);
    // concentric target rings around the button
    x.strokeStyle = 'rgba(255,42,42,0.25)'; x.lineWidth = 10;
    for (let i = 1; i < 9; i++) { const rr = i * 160 + ((lt * 400) % 160); x.beginPath(); x.ellipse(BXc, BYc + 80, rr * 1.6, rr * 0.62, 0, 0, TAU); x.stroke(); }
    // PRESS word
    slam(x, 'PRESS', 520, 230, 220, { fill: C.blue, shadow: C.black, sx: 12, sy: 12, rot: -0.06, scale: hit(t, T0, 0.14) });
    button(x, t, press, go < 0 ? 0.4 + 0.4 * Math.sin(lt * 40) : 1);
    x.restore();
    // CURSOR: wind-up then slam the glove down onto the cap
    const cx = 1500, cy = 930, sc = 1.55;
    const capTop = [BXc + 60, BYc + 80 - lerp(110, 26, press) - 10];
    const wind = ease.inOutQuad(clamp(lt / 0.16));
    let hand;
    if (go < 0) { const sl = ease.inExpo(clamp((t - (T_GO - 0.05)) / 0.05)); hand = [lerp(lerp(1280, 1150, wind), capTop[0], sl), lerp(lerp(640, 300, wind), capTop[1], sl)]; }
    else hand = [capTop[0], capTop[1] - 40 * ease.outBack(clamp((go - 0.1) / 0.2))];
    const toB = (px, py) => [(px - cx) / sc, (py - cy) / sc + 185];
    const P = { armL: toB(...hand), armR: go < 0 ? [150, 30 - 60 * wind] : [160, -170], legL: [-60, 185], legR: [60, 185], squash: go < 0 ? 0.08 * wind : -0.1 * kick(t, T_GO, 0.1), rot: go < 0 ? -0.1 * wind : -0.18, bob: 0, look: [-0.9, 0.3], lean: go < 0 ? -0.08 : -0.14 };
    drawMascot(x, { x: cx, y: cy, s: sc, t, P, mouth: go < 0 ? 'flat' : 'open', eyes: go < 0 ? 'normal' : 'star', sticker: true });
    // impact star at the glove
    if (go >= 0 && go < 0.18) { x.save(); x.translate(capTop[0], capTop[1]); speedLines(x, 0, 0, 30, 80, 600, 5, C.black, 0.05); x.restore(); }

    // ---- shockwave pass ----
    const tex = G.canvasTex('W11-base', b);
    const R1 = go < 0 ? -500 : 80 + 2300 * ease.outCubic(clamp(go / 0.38));
    const R2 = go < 0.07 ? -500 : 60 + 1700 * ease.outCubic(clamp((go - 0.07) / 0.36));
    const amp = go < 0 ? 0 : 300 * (1 - clamp(go / 0.4)) + 60;
    const r = G.shader('W11', FRAG, { uT: tex, uC: [BXc, H - (BYc + 40)], uR: R1, uR2: R2, uAmp: amp, uW: 150, uRim: go < 0 ? 0 : 1 - clamp(go / 0.3) }, W, H);
    G.draw(ctx, r);

    // ---- GO slam on top ----
    if (go >= 0) {
      const k = hit(t, T_GO, 0.14);
      slam(ctx, 'GO', 1260, 300, 480, { fill: C.white, stroke: C.black, lw: 16, shadow: C.red, sx: 22, sy: 22, scale: k * (1 + 0.1 * kick(t, T_GO + 0.18, 0.1)), rot: -0.08 });
      slam(ctx, '!', 1590, 280, 400, { fill: C.red, stroke: C.black, lw: 14, shadow: C.black, sx: 16, sy: 16, scale: hit(t, T_GO + 0.08, 0.14), rot: 0.12 });
    }

    const gk = kick(t, T_GO, 0.12);
    E.fx.shake = 30 * gk + 4 * A.pulse('beat', t, 0.1);
    E.fx.zoom += 0.06 * gk;
    E.fx.rgb = 10 * gk;
    if (go >= 0 && go < 0.035) E.fx.flash = [1, 1, 1, 0.7];
    E.fx.vignette = 0.12;
  },
};
