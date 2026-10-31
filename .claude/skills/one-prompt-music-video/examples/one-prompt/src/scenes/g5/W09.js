// W09 — "install it," — black terminal: thousands of install-log lines firehose away from camera across a floor
// AND a ceiling plane (GLSL ray–plane perspective crawl, tiled columns, 8-tap motion blur along the scroll,
// distance fog + horizon glow). INSTALL slams in the vanishing gap; progress races to ✓ INSTALLED.
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, rng, font, buf, bctx, hash } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { G } from '../../core/gl.js';
import { C, slam, hit, kick } from './_g5.js';

const S = shot('W09');
const T0 = S.start;
const T_IT = 68.6, T_DONE = 68.98;

const FRAG = `
uniform sampler2D uLog; uniform float uScroll, uBlur, uT, uGlow;
float h1(float n){ return fract(sin(n * 127.1) * 43758.5453); }
vec3 logAt(vec2 st){
  float ti = floor(st.x);
  vec2 q = vec2(fract(st.x), st.y + h1(ti) * 7.3);
  if (q.x < 0.04 || q.x > 0.96) return vec3(0.);
  return texture(uLog, vec2(q.x, 1. - fract(q.y))).rgb;
}
void main(){
  vec2 p = (uv - .5) * vec2(uRes.x / uRes.y, 1.);
  float ay = abs(p.y) - 0.035;
  vec3 col = vec3(0.);
  if (ay > 0.) {
    float z = 0.42 / ay;                        // depth along the corridor
    float x = p.x * z;
    float side = sign(p.y);
    vec2 st = vec2(x * 0.3 + .5 + (side > 0. ? 0.37 : 0.), -z * 0.075 + uScroll * (side > 0. ? 0.92 : 1.));
    vec3 c = vec3(0.);
    for (int k = 0; k < 8; k++) c += logAt(st + vec2(0., float(k) * uBlur / 8.));
    c /= 8.;
    float fog = exp(-z * 0.085);
    c *= fog * 1.25;
    // blue cast with distance
    c = mix(c, c * vec3(.45, .55, 1.6), clamp(z / 14., 0., 1.));
    col = c;
  }
  // horizon glow (the vanishing gap)
  float gl = exp(-abs(p.y) * 22.) * (0.55 + uGlow);
  col += vec3(.17, .17, 1.) * gl * 1.4 + vec3(1.) * exp(-abs(p.y) * 90.) * (0.35 + uGlow * 0.8);
  // scan grain
  col *= 0.92 + 0.08 * sin(uv.y * uRes.y * 3.14159);
  o = vec4(col, 1.);
}`;

let LOG = null;
function logCanvas() {
  const c = buf('W09-log', 1024, 2048), x = bctx(c);
  x.fillStyle = '#000'; x.fillRect(0, 0, 1024, 2048);
  const r = rng(12);
  const pk = ['one-prompt', 'cursor-mascot', 'verlet-cloth', 'stable-fluids', 'sdf-chrome', 'firework-sim', 'kinetic-type', 'three-studio', 'shockwave-glsl', 'anton-font', 'beat-sync', 'lip-sync', 'grain-pass', 'bloom', 'win95-ui', 'navier-stokes'];
  const verbs = [['✓', 'added'], ['✓', 'linked'], ['→', 'fetching'], ['✓', 'compiled'], ['+', 'skill'], ['✓', 'resolved'], ['⚡', 'cached'], ['✓', 'verified']];
  font(x, 34, 'JetBrains Mono', '700'); x.textBaseline = 'middle'; x.textAlign = 'left';
  for (let i = 0; i < 46; i++) {
    const y = 22 + i * 44.4;
    const [g, v] = r.pick(verbs), p = r.pick(pk);
    x.fillStyle = g === '→' ? '#7A7AFF' : g === '⚡' ? '#FFD23F' : g === '+' ? '#FFFFFF' : '#2BFF88';
    x.fillText(g, 40, y);
    x.fillStyle = '#E8E8F0'; x.fillText(`${v} ${p}@${r.int(1, 9)}.${r.int(0, 20)}.${r.int(0, 9)}`, 90, y);
    x.fillStyle = '#5A5AA0'; x.fillText(`${r.int(2, 999)}ms`, 860, y);
  }
  return c;
}

export default {
  ...S,
  cutIn: 'flash',
  sfx: [{ t: 68.3, type: 'zap', gain: 0.8 }, { t: 68.6, type: 'type', gain: 0.6 }, { t: 68.98, type: 'ding', gain: 0.8 }],
  init() { LOG = G.canvasTex('W09-log', logCanvas()); G.shader('W09', FRAG, { uLog: LOG, uScroll: 0, uBlur: 0, uT: 0, uGlow: 0 }, 64, 36); },
  draw(ctx, t, s, E) {
    const lt = s.lt;
    if (!LOG) LOG = G.canvasTex('W09-log', logCanvas());
    const speed = 1.6 + 5 * ease.inQuad(clamp(lt / 0.7));
    const scroll = 1.6 * lt + 2.5 * Math.pow(clamp(lt / 0.7), 3) * 0.7 + lt * lt * 1.2;
    const blur = 0.002 + speed * 0.0035;
    const dk = A.pulse('down', t, 0.15), done = kick(t, T_DONE, 0.15);
    const r = G.shader('W09', FRAG, { uLog: LOG, uScroll: scroll, uBlur: blur, uT: t, uGlow: dk * 0.8 + done }, W, H);
    // slight dutch roll for energy
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(Math.sin(lt * 3) * 0.04); ctx.scale(1.08, 1.08); ctx.translate(-W / 2, -H / 2);
    G.draw(ctx, r);
    ctx.restore();

    // terminal command (top-left)
    const cmd = '$ claude skill install one-prompt';
    const n = Math.floor(clamp(lt / 0.22) * cmd.length);
    ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(110, 150, 900, 70);
    font(ctx, 36, 'JetBrains Mono', '800'); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#2BFF88'; ctx.fillText(cmd.slice(0, n) + (Math.floor(t * 8) % 2 ? '█' : ' '), 130, 186); ctx.restore();

    // INSTALL (+ IT) in the vanishing gap
    const a = hit(t, T0, 0.16), b = hit(t, T_IT, 0.14);
    const z = 1 + dk * 0.08 + done * 0.06;
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z);
    ctx.shadowColor = '#2B2BFF'; ctx.shadowBlur = 30;
    slam(ctx, 'INSTALL', t > T_IT ? -150 : 0, 0, 290, { fill: '#FFFFFF', shadow: C.blue, sx: 0, sy: 10, scale: a, maxW: 1300 });
    ctx.shadowBlur = 0;
    if (t > T_IT) slam(ctx, 'IT', 470, 0, 290, { fill: C.green, shadow: '#0A5A30', sx: 0, sy: 10, scale: b });
    ctx.restore();

    // progress bar + counters
    const pr = clamp((t - T0 - 0.05) / (T_DONE - T0 - 0.05));
    const bw = 900, bx = W / 2 - bw / 2, by = H / 2 + 200;
    ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(bx - 10, by - 10, bw + 20, 64);
    ctx.strokeStyle = '#E8E8F0'; ctx.lineWidth = 3; ctx.strokeRect(bx, by, bw, 44);
    const nb = Math.floor(pr * 36);
    for (let i = 0; i < nb; i++) { ctx.fillStyle = i === nb - 1 ? '#fff' : (pr >= 1 ? C.green : '#5A5AFF'); ctx.fillRect(bx + 6 + i * 24.8, by + 6, 20, 32); }
    font(ctx, 30, 'JetBrains Mono', '800'); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#E8E8F0';
    ctx.fillText(`${Math.floor(pr * 100)}%  ·  ${Math.floor(pr * pr * 48213).toLocaleString('en-US')} files`, bx, by + 82);
    if (t > T_DONE) {
      const k = hit(t, T_DONE, 0.12);
      ctx.save(); ctx.translate(W / 2 + 330, by + 82); ctx.rotate(-0.06); ctx.scale(k, k);
      ctx.fillStyle = C.green; ctx.fillRect(-170, -40, 340, 80); ctx.fillStyle = C.black; font(ctx, 52, 'Anton'); ctx.textAlign = 'center'; ctx.fillText('✓ INSTALLED', 0, 3); ctx.restore();
    }

    E.fx.shake = 8 * dk + 10 * done + 4 * kick(t, T_IT, 0.08);
    E.fx.rgb = 3 + 6 * dk;
    E.fx.bloom = 0.45; E.fx.bloomThreshold = 0.62;
    E.fx.scanlines = 0.12;
    E.fx.vignette = 0.5;
  },
};
