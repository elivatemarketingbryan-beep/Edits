// W06 — "Turned it into a skill," — GLSL sphere-tracing of a LIQUID CHROME signed-distance field:
// a light bulb (sphere ∪ neck ∪ threaded screw base, smooth-min'd) melts into a metaball blob
// (orbiting droplets, smin k=.35) and snaps into a rounded cube with SKILL inlaid on its face on "skill".
// Chrome reflects a procedural blue/white studio; glossy floor with grid, reflection and SDF soft shadow.
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, font, buf, bctx, wobble } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { G } from '../../core/gl.js';
import { C, slam, grid, hit, kick } from './_g5.js';

const S = shot('W06');
const T0 = S.start;
const T_MELT = 65.32, T_SKILL = 65.88;

const FRAG = `
uniform float uT, uMorph, uWob, uRot, uTilt, uScale, uOrange, uLabel, uY;
uniform sampler2D uBg, uLab;
#define PI 3.14159265
mat3 rotY(float a){ float c = cos(a), s = sin(a); return mat3(c,0.,-s, 0.,1.,0., s,0.,c); }
mat3 rotX(float a){ float c = cos(a), s = sin(a); return mat3(1.,0.,0., 0.,c,s, 0.,-s,c); }
float smin(float a, float b, float k){ float h = clamp(.5 + .5 * (b - a) / k, 0., 1.); return mix(b, a, h) - k * h * (1. - h); }
float sdRoundBox(vec3 p, vec3 b, float r){ vec3 q = abs(p) - b + r; return length(max(q, 0.)) + min(max(q.x, max(q.y, q.z)), 0.) - r; }
float sdCyl(vec3 p, float h, float r){ vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(r, h); return min(max(d.x, d.y), 0.) + length(max(d, 0.)); }
float bulb(vec3 p){
  float glass = length(p - vec3(0., .3, 0.)) - .6;
  float ny = clamp((p.y + .32) / .46, 0., 1.);
  float neck = sdCyl(p - vec3(0., -.12, 0.), .24, mix(.25, .4, ny * ny));
  float d = smin(glass, neck, .16);
  vec3 q = p - vec3(0., -.52, 0.);
  float base = sdCyl(q, .19, .265 + .022 * sin(q.y * 52.));
  d = smin(d, base, .025);
  d = smin(d, length(p - vec3(0., -.76, 0.)) - .11, .07);
  return d;
}
float blob(vec3 p){
  float d = length(p * vec3(1., 1.12, 1.)) - .56;
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    vec3 c = .72 * vec3(sin(uT * 3.1 + fi * 1.7), cos(uT * 2.6 + fi * 2.3) * .75, sin(uT * 2.2 + fi * .9));
    d = smin(d, length(p - c) - (.2 + .05 * sin(fi * 2.)), .32);
  }
  return d;
}
float cube(vec3 p){ return sdRoundBox(p, vec3(.6), .16); }
vec3 objP(vec3 p){ p.y -= uY; p = rotX(uTilt) * (rotY(uRot) * p); return p / uScale; }
float map(vec3 p){
  vec3 q = objP(p);
  float m1 = smoothstep(0., .5, uMorph), m2 = smoothstep(.5, 1., uMorph);
  float d;
  if (m1 < 1.) {
    vec3 qb = q; qb.y = (qb.y + .8) / (1. - .35 * m1) - .8; qb.xz /= 1. + .25 * m1; // melt: sag + spread
    d = bulb(qb) * (1. - .35 * m1);
    if (m1 > 0.) d = mix(d, blob(q), m1);
  } else {
    d = blob(q);
  }
  if (m2 > 0.) d = mix(d, cube(q), m2);
  // falling drips while molten
  float molten = m1 * (1. - m2);
  if (molten > 0.) {
    for (int i = 0; i < 3; i++) { float fi = float(i); float ph = fract(uT * 1.6 + fi * .33);
      vec3 c = vec3(sin(fi * 2.4) * .35, -.55 - ph * .7, cos(fi * 2.4) * .3);
      d = smin(d, length(q - c) - .09 * (1. - ph) * molten, .2); }
  }
  d += uWob * .045 * sin(q.x * 9. + uT * 9.) * sin(q.y * 8. - uT * 7.) * sin(q.z * 7. + uT * 6.);
  return d * uScale;
}
vec3 nrm(vec3 p){ vec2 e = vec2(.0015, -.0015);
  return normalize(e.xyy * map(p + e.xyy) + e.yyx * map(p + e.yyx) + e.yxy * map(p + e.yxy) + e.xxx * map(p + e.xxx)); }
float march(vec3 ro, vec3 rd, float tmax){ float t = 0.; for (int i = 0; i < 110; i++) { float d = map(ro + rd * t); if (d < .0012 * t + .0005) return t; t += d * .8; if (t > tmax) break; } return -1.; }

vec3 BLUE = vec3(.169, .169, 1.);
vec3 env(vec3 d){
  // procedural studio for liquid chrome: deep blue dome, white softboxes, black horizon, grey floor with grid
  float a = atan(d.x, d.z);
  vec3 c = mix(BLUE * 1.25, vec3(.04, .04, .22), smoothstep(.05, .7, d.y));
  float box = smoothstep(.62, .66, d.y) * smoothstep(.55, .45, abs(sin(a * 1.)));
  c = mix(c, vec3(2.2), box);
  float mid = smoothstep(-.02, .06, d.y) * smoothstep(.6, .4, d.y);
  c = mix(c, vec3(2.4), smoothstep(.07, .02, abs(a - 1.15)) * mid);
  c = mix(c, vec3(2.4), smoothstep(.05, .012, abs(a + 1.35)) * mid);
  c = mix(c, vec3(2.2, .2, .2), smoothstep(.045, .01, abs(a - 2.55)) * mid);
  c = mix(c, vec3(2.3), smoothstep(.16, .08, abs(a)) * mid * step(0., d.z));
  if (d.y < 0.) {
    vec3 fl = mix(vec3(.30, .30, .42), vec3(.05, .05, .12), smoothstep(-.05, -.5, d.y));
    vec2 g = d.xz / max(-d.y, .05) * 1.2; vec2 f = abs(fract(g) - .5); fl = mix(fl, BLUE * 1.6 + .25, smoothstep(.44, .49, max(f.x, f.y)) * .9);
    fl = mix(fl, vec3(1.8), smoothstep(-.82, -.9, d.y)); // light pool straight below
    c = fl;
  }
  c = mix(c, vec3(.0, .0, .03), exp(-abs(d.y) * 28.) * .95);
  return c;
}
vec3 chrome(vec3 p, vec3 rd, vec3 n, out float labA){
  vec3 r = reflect(rd, n);
  float ndv = max(dot(-rd, n), 0.);
  float fr = .6 + .4 * pow(1. - ndv, 3.);
  vec3 L = normalize(vec3(-.5, .8, .6));
  vec3 col = env(r) * fr;
  col += vec3(1.6) * pow(max(dot(r, L), 0.), 60.);
  // orange candy coat (matches the product shot that follows)
  vec3 OR = vec3(1., .40, .10);
  vec3 candy = OR * (.32 + .8 * max(dot(n, L), 0.)) + OR * .25 * max(n.y, 0.);
  candy += env(r) * (.06 + .55 * pow(1. - ndv, 4.)) + vec3(1.5) * pow(max(dot(r, L), 0.), 80.);
  col = mix(col, candy, uOrange);
  labA = 0.;
  if (uLabel > 0.) {
    vec3 q = objP(p); vec3 nq = rotX(uTilt) * (rotY(uRot) * n);
    if (nq.z > .7) {
      vec2 l = q.xy / 1.2 + .5;
      if (l.x > 0. && l.x < 1. && l.y > 0. && l.y < 1.) {
        vec4 Lb = texture(uLab, l);
        labA = Lb.a * uLabel;
        vec3 ink = mix(vec3(1.), Lb.rgb, uOrange) * (.6 + .5 * pow(max(dot(r, L), 0.), 6.));
        col = mix(col, ink, labA);
      }
    }
  }
  return col;
}

void main(){
  vec2 fc = uv * uRes;
  vec2 p = (fc - .5 * uRes) / uRes.y;
  vec3 ro = vec3(0., .25, 3.65), ta = vec3(0., -.08, 0.);
  vec3 fw = normalize(ta - ro), rt = normalize(cross(fw, vec3(0., 1., 0.))), up = cross(rt, fw);
  vec3 rd = normalize(p.x * rt + p.y * up + 1.65 * fw);
  vec3 bg = texture(uBg, uv).rgb;
  vec3 col = bg;
  float FY = -1.02;
  float tf = rd.y < 0. ? (FY - ro.y) / rd.y : 1e9;
  float t = march(ro, rd, min(tf, 8.));
  float lab = 0.;
  if (t > 0.) {
    vec3 pos = ro + rd * t, n = nrm(pos);
    col = chrome(pos, rd, n, lab);
  } else if (tf < 1e8) {
    vec3 pos = ro + rd * tf;
    // glossy white stage floor with blue grid, fading into the backdrop
    vec2 g = pos.xz * 2.2; vec2 f = abs(fract(g) - .5);
    vec3 fl = mix(vec3(.96, .96, 1.), BLUE, smoothstep(.46, .49, max(f.x, f.y)) * .8);
    // soft shadow from the SDF (march toward the key light)
    float sh = 1.; float st = .03; vec3 L = normalize(vec3(-.25, 1., .2));
    for (int i = 0; i < 28; i++) { float h = map(pos + L * st); sh = min(sh, 9. * h / st); st += clamp(h, .03, .25); if (sh < .01 || st > 3.) break; }
    sh = clamp(sh, 0., 1.);
    float ao = clamp(map(pos) * 1.4 + .25, 0., 1.);
    fl *= mix(.35, 1., sh) * mix(.6, 1., ao);
    // mirror reflection of the chrome in the floor
    vec3 rr = reflect(rd, vec3(0., 1., 0.));
    float tr = march(pos + rr * .01, rr, 4.);
    if (tr > 0.) { vec3 pp = pos + rr * tr; float la; vec3 rc = chrome(pp, rr, nrm(pp), la); fl = mix(fl, rc, .45); }
    float fade = smoothstep(9., 4.5, tf);
    col = mix(bg, fl, fade);
  }
  o = vec4(col, 1.);
}`;

function labelCanvas() {
  const c = buf('W06-label', 512, 512), x = bctx(c);
  x.clearRect(0, 0, 512, 512);
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillStyle = C.navy; font(x, 150, 'JetBrains Mono', '800'); x.fillText('>_', 256, 190);
  x.fillStyle = C.black; font(x, 150, 'Anton'); x.fillText('SKILL', 256, 360);
  return c;
}

function bgCanvas(lt, t) {
  const c = buf('W06-bg', 960, 540), x = bctx(c);
  x.setTransform(1, 0, 0, 1, 0, 0);
  x.fillStyle = C.blue; x.fillRect(0, 0, 960, 540);
  // subtle vertical gradient for depth
  const g = x.createLinearGradient(0, 0, 0, 540); g.addColorStop(0, 'rgba(0,0,40,0.25)'); g.addColorStop(0.6, 'rgba(255,255,255,0.08)'); g.addColorStop(1, 'rgba(255,255,255,0.25)');
  x.fillStyle = g; x.fillRect(0, 0, 960, 540);
  grid(x, 40, 'rgba(255,255,255,0.14)', 1, -lt * 30, 0, 0, 0, 960, 540);
  const sk = lt > T_SKILL - T0;
  x.save(); x.translate(480, 200);
  if (!sk) {
    // "IDEA" outline → being turned
    const sc = 1 + lt * 0.08;
    x.scale(sc, sc);
    font(x, 230, 'Anton'); x.textAlign = 'center'; x.textBaseline = 'middle';
    x.lineWidth = 4; x.strokeStyle = 'rgba(255,255,255,0.9)'; x.strokeText('IDEA', 0, 0);
    // fill drains as it melts
    const drain = clamp((lt - (T_MELT - T0)) / 0.55);
    x.save(); x.beginPath(); x.rect(-400, -120 + drain * 240, 800, 300); x.clip(); x.fillStyle = 'rgba(255,255,255,0.95)'; x.fillText('IDEA', 0, 0); x.restore();
  } else {
    const k = hit(lt, T_SKILL - T0, 0.16);
    x.scale(0.85 + 0.15 * k + kick(lt, T_SKILL - T0, 0.1) * 0.08, 0.85 + 0.15 * k);
    font(x, 270, 'Anton'); x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillStyle = C.black; x.fillText('SKILL', 9, 9);
    x.fillStyle = C.white; x.fillText('SKILL', 0, 0);
  }
  x.restore();
  // small brutalist tags
  font(x, 18, 'JetBrains Mono', '800'); x.textAlign = 'left'; x.fillStyle = 'rgba(255,255,255,0.85)';
  x.fillText(sk ? '> skill.compile() ✓' : '> idea.melt()', 30, 500);
  return c;
}

export default {
  ...S,
  cutIn: 'flash',
  sfx: [{ t: 65.32, type: 'whoosh', gain: 0.6 }, { t: 65.88, type: 'ding', gain: 1 }],
  init() {
    const bg = G.canvasTex('W06-bg', bgCanvas(0, T0)), lab = G.canvasTex('W06-lab', labelCanvas());
    G.shader('W06', FRAG, { uT: T0, uMorph: 0, uWob: 0, uRot: 0, uTilt: 0, uScale: 1, uOrange: 0, uLabel: 0, uY: 0, uBg: bg, uLab: lab }, 64, 36);
  },
  draw(ctx, t, s, E) {
    const lt = s.lt;
    const melt = ease.inOutCubic(clamp((t - T_MELT) / 0.5)) * 0.5;
    const snap = ease.outExpo(clamp((t - (T_SKILL - 0.06)) / 0.14)) * 0.5;
    const morph = melt + snap;
    const after = t - T_SKILL;
    const wob = (t > T_MELT && t < T_SKILL ? 1 : 0) * Math.sin(clamp((t - T_MELT) / 0.5) * Math.PI) + (after > 0 ? wobble(after, 5, 9) * 0.5 : 0) + A.pulse('beat', t, 0.12) * 0.6;
    const spin = lt * 3.2 + 0.4;
    const fin = ease.outBack(clamp(after / 0.3));
    const rot = lerp(spin, TAU * 1 - 0.42, after > 0 ? fin : 0);
    const tilt = lerp(0.12, 0.3, after > 0 ? fin : 0);
    const scIn = 0.7 + 0.3 * ease.outBack(clamp(lt / 0.25));
    const scale = scIn * (1 + (after > 0 ? wobble(after, 4, 7) * 0.1 : 0)) * (1 + 0.04 * A.pulse('beat', t, 0.1));
    const orange = after > 0 ? ease.inOutCubic(clamp((after - 0.05) / 0.16)) : 0;
    const label = after > 0 ? ease.outCubic(clamp(after / 0.1)) : 0;
    const y = 0.05 * Math.sin(lt * 4) + (1 - scIn) * 0.6;

    const bg = G.canvasTex('W06-bg', bgCanvas(lt, t));
    const lab = G.canvasTex('W06-lab', labelCanvas());
    const r = G.shader('W06', FRAG, { uT: t, uMorph: morph, uWob: wob, uRot: rot, uTilt: tilt, uScale: scale, uOrange: orange, uLabel: label, uY: y, uBg: bg, uLab: lab }, W, H);
    G.draw(ctx, r);

    // foreground caption bar
    const cap = hit(t, T0 + 0.02, 0.18);
    ctx.save(); ctx.translate(140, 900); ctx.scale(cap, cap); font(ctx, 44, 'Anton'); const txt = after > 0 ? 'IDEA → SKILL ✓' : 'TURNED IT INTO A…'; const tw = ctx.measureText(txt).width + 40;
    ctx.fillStyle = C.black; ctx.fillRect(8, -36 + 8, tw, 64); ctx.fillStyle = after > 0 ? C.red : C.white; ctx.fillRect(0, -36, tw, 64);
    ctx.fillStyle = after > 0 ? C.white : C.black; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(txt, 20, -3); ctx.restore();

    const sk = kick(t, T_SKILL, 0.12);
    E.fx.shake = 16 * sk + 4 * A.pulse('beat', t, 0.08);
    E.fx.zoom += 0.035 * sk;
    E.fx.rgb = 7 * sk;
    E.fx.bloom = 0.35 + 0.4 * sk; E.fx.bloomThreshold = 0.85;
    if (after > 0 && after < 0.05) E.fx.flash = [1, 1, 1, 0.45];
    E.fx.vignette = 0.2;
  },
};
