// W01 — "They said you need a course," · Guru price glitch.
// A tacky, fictional guru sales page in a Win95 browser (generic sunglasses silhouette, marquee, countdown,
// fake reviews). THE COURSE price slot-rolls $997 → $9,997 → $99,997, then on "course" the page DATAMOSHES:
// a real P-frame feedback sim on the GPU (ping-pong FBOs, one step per video frame, re-simulated from scratch
// when scrubbing back) advects the last clean frame along a macroblock motion-vector field, with stuck blocks,
// residual refreshes, macroblock pixelation and chroma swaps — plus E.fx.glitch on the snares.
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, seg, font, hash, buf, bctx, roundRect, star } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { G } from '../../core/gl.js';
import { C } from './_util.js';
import { win, bevel, button, pointer } from './_win.js';

const S = shot('W01');
const T_P1 = 58.20, T_P2 = 58.50, T_MOSH = 58.80;

const MOSH = `
uniform sampler2D uPrev, uSrc;
uniform float uSeed, uAmt;
float h(vec2 p){ p = fract(p*vec2(443.897, 441.423)); p += dot(p, p.yx + 19.19); return fract((p.x + p.y)*p.x); }
void main(){
  vec2 px = uv*uRes;
  vec2 blk = floor(px/40.);
  vec2 bc = blk*40. + 20.;
  float r = h(blk + 0.37);
  float slow = floor(uSeed/4.);
  // coherent flow: everything slides down-right, blooms out of the guru's face and the price
  vec2 mv = vec2(1.5, -4.0);
  vec2 g1 = bc - vec2(420., 560.), g2 = bc - vec2(1240., 350.);
  mv += normalize(g1 + .01)*11.*exp(-length(g1)/420.);
  mv += normalize(g2 + .01)*9.*exp(-length(g2)/360.);
  mv += vec2(sin(blk.y*.5 + slow*1.7), cos(blk.x*.4 + slow))*2.5;
  if (r < .12) mv = vec2(0.);                                    // stuck blocks
  if (h(blk + 11.3 + slow) > .965) mv += (vec2(h(blk + 1.1 + slow), h(blk + 2.2 + slow)) - .5)*vec2(140., 60.); // jumpers
  vec4 c = texture(uPrev, (px - mv*uAmt)/uRes);
  if (h(blk + 3.3 + uSeed) < .025) c = texture(uSrc, (px + vec2(0., 32.*h(blk + uSeed)))/uRes); // residual refresh
  o = c;
}`;
const SHOW = `
uniform sampler2D uState;
uniform float uK, uSeed;
float h(vec2 p){ p = fract(p*vec2(443.897, 441.423)); p += dot(p, p.yx + 19.19); return fract((p.x + p.y)*p.x); }
void main(){
  vec2 px = uv*uRes;
  vec2 blk = floor(px/16.);
  float r = h(blk + uSeed*.07);
  vec2 q = uv;
  if (r < .09*uK) q = (floor(px/16.)*16. + 8.)/uRes;               // macroblock smear
  vec3 c = texture(uState, q).rgb;
  float sh = (h(vec2(floor(px.y/24.), uSeed)) - .5)*.012*uK;
  c.r = texture(uState, q + vec2(sh, 0.)).r;
  c.b = texture(uState, q - vec2(sh*.6, 0.)).b;
  if (h(blk*.5 + 9.1 + uSeed) < .05*uK) c = c.brg;               // chroma swap
  if (h(blk + 4.4 + floor(uSeed/3.)) < .03*uK) c = floor(c*3.)/3.; // posterised blocks
  o = vec4(c, 1.);
}`;

function priceAt(t) {
  if (t < T_P1) return { v: '$997', u: 1, size: 180 };
  if (t < T_P2) return { v: '$9,997', u: seg(t, T_P1, T_P1 + 0.16), size: 190, old: '$997' };
  return { v: '$99,997', u: seg(t, T_P2, T_P2 + 0.16), size: 200, old: '$9,997' };
}

function guru(g, x, y, t) {
  const bp = A.pulse('beat', t, 0.14), nod = Math.sin(A.beat(t).phase * Math.PI) * 10;
  // starburst behind
  g.save(); g.translate(x, y); g.rotate(t * 0.6); g.scale(1 + bp * 0.06, 1 + bp * 0.06);
  star(g, 0, 0, 330, 250, 18); g.fillStyle = C.red; g.fill(); g.lineWidth = 6; g.strokeStyle = C.black; g.stroke();
  g.restore();
  font(g, 46, 'Anton'); g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.save(); g.translate(x + 210, y - 230); g.rotate(0.3); g.fillText('#1', 0, 0); g.restore();
  // body silhouette (generic, faceless): shoulders, crossed arms, head, quiff — nodding smugly on the beat
  g.save(); g.translate(x, y + 300); g.scale(1 + bp * 0.03, 1 - bp * 0.03); g.translate(-x, -(y + 300)); g.translate(0, nod * 0.4);
  g.fillStyle = C.black;
  g.beginPath(); g.moveTo(x - 250, y + 300); g.bezierCurveTo(x - 240, y + 90, x - 160, y + 40, x, y + 40); g.bezierCurveTo(x + 160, y + 40, x + 240, y + 90, x + 250, y + 300); g.closePath(); g.fill();
  g.fillStyle = '#26262E'; roundRect(g, x - 170, y + 130, 340, 74, 37); g.fill();
  g.fillStyle = C.black; g.beginPath(); g.ellipse(x, y - 80, 92, 112, 0, 0, TAU); g.fill();
  g.beginPath(); g.moveTo(x - 92, y - 110); g.bezierCurveTo(x - 90, y - 230, x + 60, y - 250, x + 120, y - 175); g.bezierCurveTo(x + 60, y - 190, x + 20, y - 170, x - 92, y - 110); g.fill();
  g.fillRect(x - 40, y - 10, 80, 60);
  // sunglasses
  const gl = (gx) => { const gr = g.createLinearGradient(gx - 40, y - 110, gx + 40, y - 60); gr.addColorStop(0, '#5A5AFF'); gr.addColorStop(0.5, '#000040'); gr.addColorStop(1, C.blue); g.fillStyle = gr; roundRect(g, gx - 42, y - 112, 84, 48, 14); g.fill(); };
  gl(x - 46); gl(x + 46); g.fillStyle = '#3A3A44'; g.fillRect(x - 6, y - 100, 12, 8);
  g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 6; g.beginPath(); g.moveTo(x - 74, y - 100); g.lineTo(x - 56, y - 82); g.moveTo(x + 18, y - 100); g.lineTo(x + 36, y - 82); g.stroke();
  // gold-free chain: white "bling" sparkle
  const sp = (t * 3) % 1;
  g.fillStyle = '#fff'; star(g, x + 52, y - 104, 20 * Math.sin(Math.PI * sp), 4, 4); g.fill();
  g.restore();
}

function page(g, t) {
  g.setTransform(1, 0, 0, 1, 0, 0);
  // brutalist desk: white with a black grid
  g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(14,14,18,0.12)'; g.lineWidth = 2; g.beginPath();
  for (let x = 0; x <= W; x += 60) { g.moveTo(x, 0); g.lineTo(x, H); } for (let y = 0; y <= H; y += 60) { g.moveTo(0, y); g.lineTo(W, y); } g.stroke();
  const R = win(g, 40, 108, 1840, 944, '★ MASTER MOTION IN 30 DAYS™ ★ — WebSurfer 95', { tb: 44, icon: true });
  // address bar
  bevel(g, R.cx, R.cy, R.cw, 56);
  font(g, 24, 'JetBrains Mono', '700'); g.fillStyle = C.black; g.textAlign = 'left'; g.textBaseline = 'middle';
  g.fillText('Address', R.cx + 14, R.cy + 29);
  bevel(g, R.cx + 140, R.cy + 9, R.cw - 160, 38, true, '#FFFFFF');
  g.fillStyle = C.black; g.fillText('http://www.motion-millionaire.biz/COURSE?ref=guru&urgent=TRUE&spots=3', R.cx + 154, R.cy + 29);
  const top = R.cy + 60, L = R.cx, Rr = R.cx + R.cw;
  g.save(); g.beginPath(); g.rect(L, top, R.cw, 1052 - 8 - top); g.clip();
  g.fillStyle = '#FFFFFF'; g.fillRect(L, top, R.cw, 900);
  // marquee
  g.fillStyle = C.red; g.fillRect(L, top, R.cw, 52);
  font(g, 34, 'Anton'); g.fillStyle = '#fff'; g.textBaseline = 'middle'; g.textAlign = 'left';
  const mq = '⚠ ONLY 3 SPOTS LEFT ⚠ PRICE GOES UP AT MIDNIGHT ⚠ 97% OF STUDENTS* QUIT THEIR JOB ⚠ NO REFUNDS ⚠ ';
  const mw = g.measureText(mq).width, off = (t * 700) % mw;
  for (let k = -1; k < 3; k++) g.fillText(mq, L + k * mw - off, top + 28);
  // guru column
  guru(g, 420, 640, t);
  // speech bubble
  g.fillStyle = '#fff'; g.strokeStyle = C.black; g.lineWidth = 6;
  roundRect(g, 120, 330, 330, 92, 18); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(380, 418); g.lineTo(420, 470); g.lineTo(330, 420); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#fff'; g.fillRect(334, 412, 50, 10);
  font(g, 30, 'Anton'); g.fillStyle = C.black; g.textAlign = 'center'; g.fillText('I MADE $10M', 285, 358); g.fillStyle = C.blue; g.fillText('WHILE I SLEPT', 285, 394);
  // headline column
  g.textAlign = 'left';
  font(g, 92, 'Anton'); g.fillStyle = C.black; g.fillText('MASTER MOTION IN', 820, 352);
  g.fillStyle = C.blue; g.fillText('30 DAYS!!!', 1530, 352);
  font(g, 250, 'Anton'); const cw = g.measureText('THE COURSE').width, csc = Math.min(1, 1010 / cw);
  g.save(); g.translate(820, 535); g.scale(csc, 1);
  g.fillStyle = C.black; g.fillText('THE COURSE', 10, 12); g.fillStyle = C.red; g.fillText('THE COURSE', 0, 0);
  g.restore();
  g.fillStyle = C.blue; g.fillRect(820, 650, 1010 * 1.0, 14);
  // price
  const P = priceAt(t);
  font(g, 40, 'Anton'); g.fillStyle = C.black; g.fillText('ONLY', 826, 724);
  font(g, 46, 'Anton'); g.fillStyle = '#8A8A8A'; g.fillText('$4,997', 826, 800); g.fillStyle = C.red; g.fillRect(820, 798, 132, 6);
  const px = 990, py = 762;
  g.save(); g.beginPath(); g.rect(px - 10, py - 120, 640, 230); g.clip();
  font(g, P.size, 'Anton');
  if (P.u < 1) {
    const roll = (1 - ease.outBack(P.u, 1.6)) * 220;
    g.fillStyle = 'rgba(255,42,42,0.25)'; for (let k = 1; k < 4; k++) g.fillText(P.v, px, py - roll - k * 40);
    g.fillStyle = 'rgba(14,14,18,0.6)'; g.fillText(P.old, px, py - roll + 220);
    g.fillStyle = C.red; g.fillText(P.v, px, py - roll);
  } else { g.fillStyle = C.black; g.fillText(P.v, px + 8, py + 8); g.fillStyle = C.red; g.fillText(P.v, px, py); }
  g.restore();
  // BUY NOW
  const blink = Math.floor(t * 6) % 2 === 0;
  button(g, 1560, 690, 280, 110, 'BUY NOW ►', 40, false, blink ? C.red : C.blue, '#fff');
  pointer(g, 1770, 760, 1.6, '#fff');
  // timer + reviews
  const left = Math.max(0, 299 - Math.floor((t - 57.0) * 37));
  font(g, 34, 'JetBrains Mono', '800'); g.fillStyle = C.red; g.textAlign = 'left';
  g.fillText(`OFFER ENDS IN 00:0${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`, 826, 884);
  g.fillStyle = C.black; g.fillText('★★★★★ 10,000+ "STUDENTS"*', 1310, 884);
  font(g, 18, 'JetBrains Mono', '600'); g.fillStyle = '#7B7B7B'; g.fillText('*results not typical. course is a 4-hour livestream. upsells apply. ', 826, 922);
  // LIMITED badge
  g.save(); g.translate(735, 300); g.rotate(-0.3 + Math.sin(t * 8) * 0.08);
  star(g, 0, 0, 92, 74, 16); g.fillStyle = C.blue; g.fill(); g.strokeStyle = C.black; g.lineWidth = 5; g.stroke();
  font(g, 30, 'Anton'); g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText('LIMITED', 0, -8); g.fillText('!!!', 0, 24);
  g.restore();
  g.restore();
}

let MS = null;
export default {
  ...S,
  cutIn: 'glitch',
  init() { G.program('W01-mosh', MOSH); G.program('W01-show', SHOW); G.program('W01-copy', 'uniform sampler2D t; void main(){ o = texture(t, uv); }'); MS = { pp: G.pingpong(W, H, { float: false, linear: true }), step: -1, src: null }; },
  sfx: [{ t: T_P1, type: 'coin', gain: 0.6 }, { t: T_P2, type: 'coin', gain: 0.7 }, { t: T_MOSH, type: 'glitch', gain: 1.0 }],
  draw(ctx, t, s, E) {
    const lt = s.lt;
    const frame = (target, tt) => {
      const pg = buf('W01-page', W, H), g = bctx(pg);
      page(g, tt);
      const lt2 = tt - S.start, enter = ease.outExpo(seg(lt2, 0, 0.3));
      const z = 1.0 + 0.05 * (1 - enter) + 0.03 * ease.inOutCubic(seg(tt, 57.9, T_MOSH)) + (tt > T_P1 ? 0.025 * Math.exp(-(tt - T_P1) / 0.15) : 0) + (tt > T_P2 ? 0.03 * Math.exp(-(tt - T_P2) / 0.15) : 0);
      target.save(); target.setTransform(1, 0, 0, 1, 0, 0); target.fillStyle = '#fff'; target.fillRect(0, 0, W, H);
      target.translate(1000, 590); target.scale(z, z); target.rotate((1 - enter) * -0.02); target.translate(-1000, -590);
      target.drawImage(pg, 0, 0);
      target.restore();
    };
    if (t < T_MOSH) {
      frame(ctx, t);
      for (const tp of [T_P1, T_P2]) { const a = t - tp; if (a >= 0 && a < 0.1) { E.fx.glitch = 0.35; E.fx.glitchSeed = E.frame; E.fx.rgb = 8; E.fx.shake = 8; } }
      return;
    }
    // ---------- datamosh ----------
    const step = Math.min(40, Math.floor((t - T_MOSH) * 30 + 1e-4));
    if (!MS) MS = { pp: G.pingpong(W, H, { float: false, linear: true }), step: -1, src: null };
    if (MS.step < 0 || step < MS.step) {
      const p0 = buf('W01-page0', W, H);
      frame(bctx(p0), T_MOSH - 1 / 60);
      MS.src = G.canvasTex('W01-page0', p0);
      G.pass(G.program('W01-copy', 'uniform sampler2D t; void main(){ o = texture(t, uv); }'), { t: MS.src }, MS.pp.read);
      MS.step = 0;
    }
    const mp = G.program('W01-mosh', MOSH);
    while (MS.step < step) {
      G.pass(mp, { uPrev: MS.pp.read, uSrc: MS.src, uSeed: MS.step, uAmt: 1 + MS.step * 0.07 }, MS.pp.write);
      MS.pp.swap(); MS.step++;
    }
    const k = clamp(0.2 + step / 18);
    const r = G.shader('W01-show', SHOW, { uState: MS.pp.read, uK: k, uSeed: step });
    G.draw(ctx, r);
    const sn = A.pulse('snare', t, 0.06);
    E.fx.glitch = clamp(0.12 + sn * 0.7 + (step < 2 ? 0.8 : 0)); E.fx.glitchSeed = E.frame;
    E.fx.rgb = 4 + sn * 10;
    if (step < 2) { E.fx.shake = 14; E.fx.flash = [1, 0.16, 0.16, 0.12]; }
  },
};
