// C12 — "(the whole thing) comes alive" · ALIVE → black hole.
// Quick-cut kinetic words (WHOLE / THING / COMES) then a giant candy-striped ALIVE with CURSOR holding the
// note. On the downbeat 56.47 a black hole is born inside the "I": the whole 2D frame is rendered into a
// buffer, uploaded (G.canvasTex) and warped by a GLSL thin-lens gravitational-lensing shader (Einstein ring,
// mirrored inner image, frame-dragging swirl, inward pull) with an analytic accretion disk whose far side is
// lensed over the shadow while the near side crosses in front. It swallows the frame → hard cut to black →
// a "1 PROMPT" rubber stamp slams for the last 0.3 s.
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, seg, font, hash, rng, buf, bctx, roundRect, wobble, star } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { G } from '../../core/gl.js';
import { drawMascot } from '../../core/mascot.js';
import { C, RAINBOW12, sunburst, cornerDots, sparkle, popText } from './_util.js';

const S = shot('C12');
const T_WHOLE = 55.20, T_THING = 55.44, T_COMES = 55.76, T_ALIVE = 56.12;
const T_HOLE = 56.47, T_EAT = 57.12, T_BLACK = 57.36, T_STAMP = 57.40;
const HC = [960, 420]; // hole centre (inside the I of ALIVE)

const LENS = `
uniform sampler2D uScene;
uniform vec2 uC;
uniform float uRs, uE, uSpin, uPull, uT, uDisk, uTilt, uDark;
vec3 diskCol(vec2 q, out float m){
  vec2 e = vec2(q.x, q.y/uTilt);
  float rr = length(e)/uRs;
  m = smoothstep(1.55, 1.9, rr)*(1. - smoothstep(3.6, 4.6, rr))*uDisk;
  float a = atan(e.y, e.x);
  float st = .9 + .22*sin(a*9. - uT*7. + rr*5.)*sin(a*5. + uT*3.1 - rr*2.);
  vec3 hot = mix(vec3(1.25, 1.2, 1.1), vec3(1., .78, .22), smoothstep(1.8, 2.5, rr));
  hot = mix(hot, vec3(1., .36, .10), smoothstep(2.5, 3.3, rr));
  hot = mix(hot, vec3(1., .16, .50), smoothstep(3.3, 4.4, rr));
  float beam = 1. + .3*cos(a + .3);
  return hot*st*beam;
}
vec2 mirror(vec2 u){ return 1. - abs(mod(u, 2.) - 1.); }
void main(){
  vec2 p = uv*uRes;
  vec2 d = p - uC; float r = max(length(d), 1e-3);
  float rs = r - uE*uE/r;                       // thin point-mass lens
  float ang = atan(d.y, d.x) + uSpin*(uRs*uRs)/(r*r*.35 + uRs*uRs*.2) ;
  vec2 src = uC + vec2(cos(ang), sin(ang))*rs*(1. + uPull);
  vec3 col = texture(uScene, mirror(src/uRes)).rgb;
  // light starvation: the sky darkens and reddens toward the hole so the disk glows against it
  float halo = exp(-max(r - uRs, 0.)/(uRs*1.6 + 40.));
  col = mix(col, col*vec3(.55, .12, .35), halo*uDark);
  // lensed far side of the accretion disk (only the half behind the hole)
  float m1; vec2 sq = src - uC;
  vec3 dc1 = diskCol(sq, m1);
  m1 *= smoothstep(-.02*uRs, .08*uRs, sq.y);
  col = mix(col, dc1, m1);
  // event horizon (shadow) + photon ring
  float sh = smoothstep(uRs*.985, uRs*1.03, r);
  col *= sh;
  float ring = exp(-pow((r - uRs*1.05)/(uRs*.035 + 1.5), 2.));
  col += vec3(1., .82, .55)*ring*uDisk*1.2;
  // near side of the disk crosses in front of the shadow
  float m2; vec3 dc2 = diskCol(d, m2);
  m2 *= 1. - smoothstep(-.06*uRs, .02*uRs, d.y);
  col = mix(col, dc2, m2);
  o = vec4(col, 1.);
}`;

let STAMP = null;
function stampSprite() {
  if (STAMP) return STAMP;
  const w = 1560, h = 440, c = buf('C12-stamp', w, h), x = bctx(c);
  x.clearRect(0, 0, w, h);
  const col = '#FF5A1F';
  x.strokeStyle = col; x.lineWidth = 22; roundRect(x, 20, 20, w - 40, h - 40, 40); x.stroke();
  x.lineWidth = 8; roundRect(x, 52, 52, w - 104, h - 104, 26); x.stroke();
  font(x, 200, 'Rubik Mono One'); x.fillStyle = col; x.textAlign = 'center'; x.textBaseline = 'middle';
  const tw = x.measureText('1 PROMPT').width; if (tw > w - 200) font(x, 200 * (w - 200) / tw, 'Rubik Mono One');
  x.fillText('1 PROMPT', w / 2, h / 2 + 8);
  // rubber-stamp ink voids
  const R = rng(4242);
  x.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 2600; i++) { x.fillStyle = `rgba(0,0,0,${0.3 + R() * 0.7})`; const r = R() < 0.92 ? 1 + R() * 3 : 4 + R() * 9; x.beginPath(); x.arc(R() * w, R() * h, r, 0, TAU); x.fill(); }
  for (let i = 0; i < 26; i++) { x.fillStyle = 'rgba(0,0,0,0.5)'; x.fillRect(R() * w, R() * h, 60 + R() * 260, 2 + R() * 4); }
  x.globalCompositeOperation = 'source-over';
  STAMP = c; return c;
}

const WORDS = [
  { w: 'THE WHOLE', t: T_WHOLE, bg: ['#FF5CA0', C.pink], fill: C.yellow, size: 250 },
  { w: 'THING', t: T_THING, bg: ['#FFB020', C.orange], fill: C.cream, size: 330 },
  { w: 'COMES', t: T_COMES, bg: ['#9A5BFF', C.purple], fill: C.mint, size: 330 },
];
const LETTERS = [['A', '#FF2D6F'], ['L', C.orange], ['I', C.purple], ['V', '#2BD96B'], ['E', '#2FC8FF']];

function candyLetter(ctx, ch, x, y, size, col, lt) {
  font(ctx, size, 'Anton'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  // extrusion
  for (let k = 22; k >= 1; k--) { ctx.fillStyle = k > 15 ? C.ink : '#3A1C6E'; ctx.fillText(ch, x + k * 0.6, y + k * 1.15); }
  ctx.lineWidth = 16; ctx.strokeStyle = C.ink; ctx.strokeText(ch, x, y);
  ctx.fillStyle = col; ctx.fillText(ch, x, y);
  // candy stripes clipped by the glyph (source-atop on an offscreen would be cleaner; use clip via text path trick)
  const g = buf('C12-letter', 420, 520), gx = bctx(g);
  gx.clearRect(0, 0, 420, 520); font(gx, size, 'Anton'); gx.textAlign = 'center'; gx.textBaseline = 'middle';
  gx.fillStyle = '#fff'; gx.fillText(ch, 210, 260);
  gx.globalCompositeOperation = 'source-in';
  gx.save(); gx.translate(210, 260); gx.rotate(-0.6);
  gx.fillStyle = 'rgba(255,255,255,0.55)';
  for (let i = -12; i < 12; i++) gx.fillRect(i * 56 + ((lt * 120) % 56), -500, 22, 1000);
  gx.restore();
  // gloss highlight
  gx.fillStyle = 'rgba(255,255,255,0.7)'; gx.fillRect(0, 60, 420, 34);
  gx.globalCompositeOperation = 'source-over';
  ctx.drawImage(g, x - 210, y - 260);
}

export default {
  ...S,
  cutIn: 'punch',
  sfx: [{ t: T_ALIVE, type: 'impact', gain: 0.9 }, { t: T_HOLE, type: 'boom', gain: 1.0 }, { t: 56.9, type: 'riser', gain: 0.7 }, { t: T_STAMP, type: 'stamp', gain: 1.0 }],
  init() { stampSprite(); G.program('C12-lens', LENS); },
  draw(ctx, t, s, E) {
    const lt = s.lt;
    this.hud = t >= T_BLACK ? 'paper' : 'ink';
    // ---------- final black + stamp ----------
    if (t >= T_BLACK) {
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
      if (t >= T_STAMP) {
        const a = t - T_STAMP, k = clamp(a / 0.07);
        const sc = lerp(1.7, 1, ease.outQuad(k)) + wobble(a - 0.07, 6, 10) * 0.03 * (a > 0.07 ? 1 : 0);
        const sp = stampSprite();
        ctx.save(); ctx.translate(960, 520); ctx.rotate(-0.09); ctx.scale(sc, sc);
        ctx.globalAlpha = clamp(k * 1.5);
        ctx.drawImage(sp, -sp.width / 2, -sp.height / 2);
        ctx.restore();
        if (a < 0.1) { E.fx.shake = 26 * (1 - a / 0.1); E.fx.rgb = 8; E.fx.zoom += 0.05 * (1 - a / 0.1); }
      }
      E.fx.vignette = 0.5; E.fx.grain = 0.08;
      return;
    }

    const holeOn = t >= T_HOLE;
    const target = holeOn ? buf('C12-scene', W, H) : null;
    const g = holeOn ? bctx(target) : ctx;
    if (holeOn) { g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.fillStyle = '#000'; g.fillRect(0, 0, W, H); }
    const beat = A.pulse('beat', t, 0.18);

    // ---------- the bright world ----------
    let wi = -1; for (let i = 0; i < WORDS.length; i++) if (t >= WORDS[i].t) wi = i;
    const alive = t >= T_ALIVE, aAge = t - T_ALIVE;
    const bg = alive ? ['#FFF3B0', C.yellow] : WORDS[Math.max(0, wi)].bg;
    g.save();
    const z = 1 + lt * 0.03 + (alive ? 0.04 * Math.exp(-aAge / 0.2) : 0);
    g.translate(960, 540); g.scale(z, z); g.translate(-960, -540);
    sunburst(g, HC[0], HC[1] + 60, 30, lt * 0.6, bg[0], bg[1]);
    cornerDots(g, alive ? 'rgba(255,62,138,0.25)' : 'rgba(31,42,85,0.14)', 30, 12, 960, 500, 0.3);

    if (!alive) {
      const W0 = WORDS[Math.max(0, wi)], wa = t - W0.t;
      const sc = ease.outBack(clamp(wa / 0.12), 2.5) * (1 + wa * 0.15);
      g.save(); g.translate(960, 400); g.scale(sc, sc); g.rotate((wi % 2 ? 0.04 : -0.04));
      popText(g, W0.w, 0, 0, W0.size, { fill: W0.fill, depth: 26, lw: 14, maxW: 1500 });
      g.restore();
    } else {
      // ALIVE: candy letters dropping in, staggered
      const size = 420; font(g, size, 'Anton');
      const ws = LETTERS.map(([ch]) => g.measureText(ch).width + 26), tot = ws.reduce((a, b) => a + b, 0);
      let x = 960 - tot / 2;
      LETTERS.forEach(([ch, col], i) => {
        const la = aAge - i * 0.035;
        const drop = la < 0 ? 1 : 1 - ease.outBounce(clamp(la / 0.32));
        const bounce = A.pulse('beat', t, 0.12) * 18 * ((i % 2) ? 1 : -1);
        if (la >= -0.001) {
          g.save(); g.translate(x + ws[i] / 2, 400 - drop * 700 + bounce); g.rotate(Math.sin(lt * 3 + i * 1.3) * 0.05);
          const sq = 1 + (la > 0.3 ? 0 : 0) + wobble(la - 0.32, 5, 8) * 0.06 * (la > 0.32 ? 1 : 0);
          g.scale(1 / sq, sq);
          candyLetter(g, ch, 0, 0, size, col, lt);
          g.restore();
        }
        x += ws[i];
      });
    }
    // CURSOR holding the note
    const holdOpen = alive && t < 56.75;
    const pull = holeOn ? seg(t, 56.65, T_EAT) : 0;
    drawMascot(g, { x: 960, y: 935, s: 1.12, t, pose: 'sing', sticker: true, mouth: holdOpen ? { open: 0.85 + 0.15 * Math.sin(lt * 30), wide: 0.4, round: 0.3, sss: 0 } : (holeOn ? 'o' : 'auto'), eyes: holeOn && t > 56.7 ? 'x' : (alive ? 'happy' : 'normal'), rot: pull * 0.4 });
    // sound waves out of the mouth while holding the note
    if (alive) {
      for (let k = 0; k < 4; k++) {
        const ph = (lt * 2.6 + k / 4) % 1;
        g.strokeStyle = `rgba(31,42,85,${0.8 * (1 - ph)})`; g.lineWidth = 10 * (1 - ph) + 2;
        g.beginPath(); g.arc(960, 935 - 1.12 * 167, 90 + ph * 360, -Math.PI * 0.85, -Math.PI * 0.15); g.stroke();
      }
    }
    // sparkles
    for (let i = 0; i < 16; i++) {
      const ph = (lt * 2 + hash(i, 61)) % 1;
      sparkle(g, hash(i, 62) * W, 130 + hash(i, 63) * 780, (16 + 20 * hash(i, 64)) * Math.sin(Math.PI * ph), lt * 3 + i, i % 2 ? C.cream : C.ink);
    }
    // singularity spark just before the downbeat
    const pre = seg(t, T_HOLE - 0.18, T_HOLE);
    if (pre > 0 && !holeOn) {
      g.fillStyle = C.ink; g.beginPath(); g.arc(HC[0], HC[1], 6 + 30 * pre * pre, 0, TAU); g.fill();
      g.strokeStyle = C.cream; g.lineWidth = 4; g.beginPath(); g.arc(HC[0], HC[1], 10 + 60 * pre, 0, TAU); g.stroke();
    }
    g.restore();

    if (!holeOn) {
      E.fx.zoom += beat * 0.01;
      if (alive && aAge < 0.2) { E.fx.shake = 14 * (1 - aAge / 0.2); E.fx.rgb = 6 * (1 - aAge / 0.2); }
      if (wi >= 0 && t - WORDS[wi].t < 0.05 && !alive) E.fx.zoom += 0.03;
      E.fx.saturation = 1.1;
      return;
    }

    // ---------- the black hole ----------
    const hAge = t - T_HOLE;
    // debris orbits drawn into the scene so it is lensed too
    for (let i = 0; i < 70; i++) {
      const h1 = hash(i, 71), h2 = hash(i, 72), h3 = hash(i, 73);
      const life = 0.35 + h2 * 0.6, born = T_HOLE + h1 * 0.6, a = (t - born) / life;
      if (a < 0 || a > 1) continue;
      const r0 = 900 + h3 * 500, r = r0 * (1 - ease.inCubic(a)) + 20;
      const ang = h1 * TAU + (a * a) * (4 + h2 * 4);
      const x = HC[0] + Math.cos(ang) * r, y = HC[1] + Math.sin(ang) * r * 0.8;
      g.save(); g.translate(x, y); g.rotate(ang + Math.PI / 2); g.scale(1 + a * 2.5, 1 / (1 + a * 1.5));
      g.fillStyle = RAINBOW12[i % 12];
      if (i % 3 === 0) { star(g, 0, 0, 22, 10, 5); g.fill(); } else g.fillRect(-14, -7, 28, 14);
      g.restore();
    }
    const tex = G.canvasTex('C12-scene', target);
    const grow = ease.outBack(clamp(hAge / 0.18), 2.6);
    const eat = ease.inExpo(seg(t, T_EAT, T_BLACK));
    const rs = 38 * grow + 120 * ease.inOutCubic(seg(t, T_HOLE + 0.1, T_EAT)) + 1500 * eat + A.pulse('beat', t, 0.12) * 10;
    const r = G.shader('C12-lens', LENS, {
      uScene: tex, uC: [HC[0], H - HC[1]], uRs: Math.max(1, rs), uE: rs * 1.45,
      uSpin: 0.6 + 3.5 * seg(t, T_HOLE, T_BLACK), uPull: 0.15 * grow + 1.4 * ease.inQuad(seg(t, T_HOLE + 0.15, T_BLACK)),
      uT: lt, uDisk: clamp(hAge / 0.12), uTilt: 0.17, uDark: 0.85 * clamp(hAge / 0.25),
    });
    G.draw(ctx, r);
    if (hAge < 0.3) { E.fx.shake = 20 * (1 - hAge / 0.3); E.fx.rgb = 9 * (1 - hAge / 0.3); }
    if (hAge < 0.04) E.fx.flash = [1, 1, 1, 0.3];
    E.fx.bloom = 0.55; E.fx.bloomThreshold = 0.82;
    E.fx.radialBlur = 0.15 + 0.5 * eat; E.fx.center = [HC[0] / W, 1 - HC[1] / H];
    E.fx.vignette = 0.22 + 0.5 * seg(t, T_HOLE, T_BLACK);
    E.fx.zoom += 0.02 * Math.sin(lt * 40) * eat;
  },
};
