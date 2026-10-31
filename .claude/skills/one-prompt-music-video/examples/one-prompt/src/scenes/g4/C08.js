// C08 — "I just tell it how I feel" · Feelings in marble.
// Full-frame GLSL domain-warped fbm (iq-style q/r warp) quantised into marbled-paper bands with
// cream veins and a glossy liquid sheen. Hearts + feeling words rise from CURSOR's heart hands into a
// 2D overlay that the shader samples THROUGH the warp field, so they literally get marbled in.
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, seg, font, hash, heart, buf, bctx, wobble } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { G } from '../../core/gl.js';
import { drawMascot } from '../../core/mascot.js';
import { C, sparkle } from './_util.js';

const S = shot('C08');
const T_HOW = 47.72, T_FEEL = 48.08;
const OW = 960, OH = 540;

const FRAG = `
uniform float uT, uAmp, uSwirl, uFlash;
uniform vec2 uHeart;
uniform sampler2D uOver;
float h21(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*f*(f*(f*6.-15.)+10.);
  return mix(mix(h21(i), h21(i+vec2(1,0)), u.x), mix(h21(i+vec2(0,1)), h21(i+vec2(1,1)), u.x), u.y); }
const mat2 M = mat2(1.6, 1.2, -1.2, 1.6);
float fbm(vec2 p){ float a = .5, s = 0.; for (int i = 0; i < 4; i++){ s += a*vnoise(p); p = M*p; a *= .5; } return s; }
vec3 pal(float i){
  i = mod(i, 7.);
  if (i < 1.) return vec3(1.00, .243, .541);   // pink
  if (i < 2.) return vec3(1.00, .882, .302);   // yellow
  if (i < 3.) return vec3(.482, .184, .969);   // purple
  if (i < 4.) return vec3(1.00, .478, .102);   // orange
  if (i < 5.) return vec3(1.00, .984, .957);   // cream
  if (i < 6.) return vec3(1.00, .604, .776);   // candy pink
  return vec3(1.00, .70, .16);                 // tangerine
}
vec2 hc;
// the marble field: returns band coordinate v, writes the warp vectors
float field(vec2 p, out vec2 q, out vec2 w){
  vec2 d = p - hc; float r = length(d);
  float sw = uSwirl*exp(-r*.8) + uT*.22*exp(-r*.45);
  p = hc + mat2(cos(sw), -sin(sw), sin(sw), cos(sw))*d;
  float t = uT;
  q = vec2(fbm(p + vec2(0., t*.3)), fbm(p + vec2(5.2, 1.3) - t*.25));
  w = vec2(fbm(p + 3.2*q + vec2(1.7, 9.2) + t*.4), fbm(p + 3.2*q + vec2(8.3, 2.8) - t*.33));
  float f = fbm(p*.9 + uAmp*w);
  return f*3.6 + length(q)*1.6 + w.x*1.1 - t*.45;
}
void main(){
  vec2 asp = vec2(uRes.x/uRes.y, 1.);
  float SC = 2.1;
  vec2 p = (uv - .5)*asp*SC;
  hc = (uHeart - .5)*asp*SC;
  vec2 q, w, q2, w2;
  float v = field(p, q, w);
  float e = 2.5/uRes.y*SC;
  float vx = field(p + vec2(e, 0.), q2, w2), vy = field(p + vec2(0., e), q2, w2);
  vec2 g = vec2(vx - v, vy - v)/e;
  // marbled bands: flat colour fields, quick blends, cream veins
  float x = v*2.1, fi = floor(x), fr = fract(x);
  vec3 col = mix(pal(fi), pal(fi + 1.), smoothstep(.86, .985, fr));
  float aa = length(g)*1.05*(1./uRes.y)*SC*1.5;
  float ed = min(fr, 1. - fr);
  float vein = 1. - smoothstep(.010, .010 + aa + .012, ed);
  col = mix(col, vec3(1., .984, .957), vein);
  float x2 = v*4.2 + w.y*2.;
  float e2 = abs(fract(x2) - .5);
  col = mix(col, col*.84, (1. - smoothstep(.015, .015 + length(g)*4.2*(1./uRes.y)*SC*1.5 + .01, e2))*.35);
  // glossy liquid sheen from the smooth gradient of the field
  vec3 n = normalize(vec3(-g*.11, 1.));
  vec3 L = normalize(vec3(-.5, .6, .65));
  float spec = pow(max(dot(reflect(-L, n), vec3(0, 0, 1)), 0.), 28.);
  float diff = dot(n, L)*.5 + .5;
  col *= .88 + .18*diff;
  col += spec*.42;
  // overlay (hearts / words) sampled through the warp field: crisp near CURSOR, marbled as they rise
  float amt = smoothstep(.62, 1.0, uv.y);
  vec2 disp = (w - .5)*vec2(.30, .22)*amt*amt + (q - .5)*.05*amt;
  vec4 ov = texture(uOver, uv + disp);
  col = mix(col, ov.rgb, ov.a);
  col = mix(col, vec3(1.), uFlash);
  o = vec4(col, 1.);
}`;

const WORDS = ['JOY', 'WOW', 'LOVE', 'HYPE', 'BLISS', 'YES!', 'AWW', 'OMG', 'FEELS', 'YAY', '<3', 'VIBES', 'SO GOOD', 'WOO'];
const WCOL = [C.cream, C.ink, C.purple, C.cream, C.hot, C.yellow];

export default {
  ...S,
  cutIn: 'punch',
  sfx: [{ t: T_FEEL, type: 'pop', gain: 0.8 }, { t: 47.48, type: 'swoosh', gain: 0.4 }],
  init() { G.program('C08-marble', FRAG); },
  draw(ctx, t, s, E) {
    const lt = s.lt;
    const beat = A.pulse('beat', t, 0.22), kick = A.pulse('kick', t, 0.2);
    const MX = 1395, MY = 905, MS = 1.32;
    const hands = [MX, MY - MS * 375];
    // ---------- overlay: hearts + words rising from the heart hands ----------
    const ov = buf('C08-over', OW, OH), ox = bctx(ov);
    ox.setTransform(1, 0, 0, 1, 0, 0); ox.clearRect(0, 0, OW, OH);
    ox.scale(OW / W, OH / H);
    for (let i = 0; i < 46; i++) {
      const born = S.start - 0.9 + i * 0.05, age = t - born;
      if (age < 0) continue;
      const side = hash(i, 1) - 0.5;
      const x = hands[0] + side * 200 + Math.sin(age * 4 + i) * 30 + age * (hash(i, 4) - 0.75) * 900;
      const y = hands[1] + 20 - age * (380 + 240 * hash(i, 2));
      if (y < -200) continue;
      const sc = ease.outBack(Math.min(1, age * 4)) * (0.8 + 0.7 * hash(i, 3));
      ox.save(); ox.translate(x, y); ox.rotate(Math.sin(age * 3 + i) * 0.3); ox.scale(sc, sc);
      if (i % 3 === 2) {
        const word = WORDS[i % WORDS.length];
        font(ox, 64, 'Anton'); ox.textAlign = 'center'; ox.textBaseline = 'middle';
        ox.lineWidth = 10; ox.strokeStyle = C.ink; ox.lineJoin = 'round'; ox.strokeText(word, 0, 0);
        ox.fillStyle = WCOL[i % WCOL.length] === C.ink ? C.cream : WCOL[i % WCOL.length]; ox.fillText(word, 0, 0);
      } else {
        heart(ox, 0, 0, 46); ox.fillStyle = C.ink; ox.fill();
        heart(ox, 0, -4, 40); ox.fillStyle = i % 2 ? '#FF2D6F' : C.cream; ox.fill();
        ox.fillStyle = 'rgba(255,255,255,0.7)'; ox.beginPath(); ox.ellipse(-16, -22, 7, 11, -0.5, 0, TAU); ox.fill();
      }
      ox.restore();
    }
    ox.setTransform(1, 0, 0, 1, 0, 0);
    const otex = G.canvasTex('C08-over', ov);

    // ---------- marble ----------
    const surge = A.pulse('beat', t, 0.35);
    const feelAge = t - T_FEEL;
    const r = G.shader('C08-marble', FRAG, {
      uT: lt * 1.25 + 3.0 + surge * 0.25,
      uAmp: 3.2 + surge * 1.4 + (feelAge > 0 ? 1.2 * Math.exp(-feelAge / 0.2) : 0),
      uSwirl: 1.2 + 2.5 * ease.inOutCubic(seg(lt, 0, 1.28)) + beat * 0.6,
      uHeart: [hands[0] / W, 1 - hands[1] / H],
      uOver: otex,
      uFlash: feelAge > 0 && feelAge < 0.06 ? 0.35 : 0,
    });
    G.draw(ctx, r);

    // ---------- type: "tell it how I" + giant italic FEEL ----------
    ctx.save();
    const drift = lt * 14;
    const small = [['tell', 47.38], ['it', 47.58], ['how', 47.72], ['I', 47.88]];
    font(ctx, 92, 'Instrument Serif', '400', 'italic'); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    let x = 168;
    for (const [w, wt] of small) {
      const a = ease.outBack(seg(t, wt - 0.06, wt + 0.12));
      const ww = ctx.measureText(w + ' ').width;
      if (a > 0) {
        ctx.save(); ctx.translate(x + drift, 312); ctx.scale(a, a);
        ctx.fillStyle = C.ink; ctx.fillText(w, 5, 6);
        ctx.fillStyle = C.cream; ctx.fillText(w, 0, 0); ctx.restore();
      }
      x += ww;
    }
    const fa = seg(t, T_HOW - 0.04, T_HOW + 0.22);
    if (fa > 0) {
      const sc = ease.outBack(fa, 2.0) * (1 + (feelAge > 0 ? wobble(feelAge, 4, 6) * 0.08 : 0)) + beat * 0.02;
      ctx.translate(560 + drift, 600); ctx.scale(sc, sc); ctx.rotate(-0.06 + (1 - fa) * 0.3);
      font(ctx, 430, 'Instrument Serif', '400', 'italic'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      for (let k = 14; k >= 1; k--) { ctx.fillStyle = k > 7 ? C.ink : C.purple; ctx.fillText('feel', k * 1.6, k * 2.2); }
      ctx.lineWidth = 12; ctx.strokeStyle = C.ink; ctx.strokeText('feel', 0, 0);
      const gr = ctx.createLinearGradient(0, -170, 0, 150);
      gr.addColorStop(0, '#FFFFFF'); gr.addColorStop(0.5, C.cream); gr.addColorStop(0.51, C.yellow); gr.addColorStop(1, '#FFB020');
      ctx.fillStyle = gr; ctx.fillText('feel', 0, 0);
    }
    ctx.restore();

    // ---------- CURSOR: heart hands, heart eyes ----------
    const bob = Math.sin(lt * 5) * 8;
    ctx.fillStyle = 'rgba(80,10,60,0.25)'; ctx.beginPath(); ctx.ellipse(MX, MY + 8, 150, 26, 0, 0, TAU); ctx.fill();
    drawMascot(ctx, { x: MX, y: MY + bob, s: MS, t, pose: 'heart', eyes: 'heart', mouth: t > 47.2 ? 'auto' : 'smile', sticker: true, squash: kick * 0.08 });
    // big pulsing heart between the hands
    const hp = 1 + beat * 0.25 + (feelAge > 0 ? wobble(feelAge, 5, 5) * 0.35 + 0.2 : 0);
    ctx.save(); ctx.translate(hands[0], hands[1] + 30 + bob); ctx.scale(hp, hp);
    heart(ctx, 0, 0, 62); ctx.fillStyle = C.ink; ctx.fill();
    heart(ctx, 0, -5, 54); ctx.fillStyle = '#FF2D6F'; ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.beginPath(); ctx.ellipse(-22, -30, 9, 15, -0.5, 0, TAU); ctx.fill();
    ctx.restore();
    // heart burst on "feel"
    if (feelAge > 0) {
      const u = ease.outCubic(feelAge / 0.35);
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * TAU + 0.2, rr = 90 + 430 * u;
        ctx.save(); ctx.translate(hands[0] + Math.cos(a) * rr, hands[1] + 30 + Math.sin(a) * rr); ctx.rotate(a + Math.PI / 2);
        const sc = (1 - u * 0.6) * 0.7;
        ctx.scale(sc, sc); heart(ctx, 0, 0, 34); ctx.fillStyle = C.ink; ctx.fill(); heart(ctx, 0, -3, 28); ctx.fillStyle = i % 2 ? C.cream : C.yellow; ctx.fill();
        ctx.restore();
      }
      ctx.strokeStyle = C.cream; ctx.lineWidth = 14 * (1 - u); ctx.beginPath(); ctx.arc(hands[0], hands[1] + 30, 80 + 380 * u, 0, TAU); ctx.stroke();
    }
    for (let i = 0; i < 10; i++) {
      const ph = (lt * 1.9 + hash(i, 7)) % 1;
      sparkle(ctx, hash(i, 8) * W, 150 + hash(i, 9) * 740, 26 * Math.sin(Math.PI * ph), lt * 3 + i, C.cream);
    }

    E.fx.zoom += 0.012 * beat + lt * 0.02;
    if (feelAge > 0 && feelAge < 0.2) { E.fx.shake = 10 * (1 - feelAge / 0.2); E.fx.rgb = 5; }
    E.fx.saturation = 1.1;
  },
};
