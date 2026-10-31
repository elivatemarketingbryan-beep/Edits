// W03 — "They said you need a sponsor," · The endless contract.
// A SPONSORSHIP AGREEMENT on tractor-feed paper unrolls from a giant roll on the horizon and races toward
// the camera. Raytraced in one GLSL pass: ray → floor-plane hit + ray → cylinder (the roll), the contract
// sampled from mipmapped/anisotropic canvas textures (header + endlessly repeating fine print, sprocket holes
// cut out so the blue grid floor shows through), with velocity motion-blur along the scroll as it accelerates
// exponentially. 2D overlay: SIGN HERE ✗ boxes flying past the lens and a slammed SPONSOR?! label.
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, seg, font, hash, rng, buf, bctx, roundRect } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { G } from '../../core/gl.js';
import { C } from './_util.js';

const S = shot('W03');
const T_SPON = 60.86;
const TW = 1024, BODY_H = 4096, HEAD_H = 1024;

const FRAG = `
uniform sampler2D uHead, uBody;
uniform float uU, uBlur, uT, uShake;
const float CH = 1.55, PITCH = .40, FOV = .62, WP = 6.0, ZR = 17.0, RR = 1.15;
const float HEADLEN = 6.0, BODYLEN = 24.0;
vec4 paper(float s, float u, float lod){
  if (s >= 0. && s < HEADLEN) return texture(uHead, vec2(u, s/HEADLEN));
  return texture(uBody, vec2(u, (s - HEADLEN)/BODYLEN));
}
vec3 floorCol(vec3 p){
  vec2 g = abs(fract(p.xz*.5) - .5);
  vec2 w = fwidth(p.xz*.5)*1.2;
  float line = 1. - min(smoothstep(.0, w.x + .01, g.x), smoothstep(.0, w.y + .01, g.y));
  vec3 c = mix(vec3(.169, .169, 1.), vec3(1.), line*.55);
  float edge = abs(p.x) - WP*.5;                      // paper shadow on the floor
  c *= 1. - .45*exp(-max(edge, 0.)*4.)*step(0., edge)*step(p.z, ZR);
  return c;
}
void main(){
  vec2 q = (uv - .5)*vec2(uRes.x/uRes.y, 1.)*2.*FOV;
  vec3 d = normalize(vec3(q.x, q.y, 1.));
  float cp = cos(PITCH), sp = sin(PITCH);
  d = vec3(d.x, d.y*cp - d.z*sp, d.y*sp + d.z*cp);
  vec3 ro = vec3(uShake, CH, 0.);
  // sky: white with a fine grey grid
  vec3 col = vec3(1.);
  vec2 sg = abs(fract(uv*vec2(32., 18.)) - .5);
  col = mix(col, vec3(.8), (1. - smoothstep(.0, .06, min(sg.x, sg.y)))*.5);
  float tHit = 1e9;
  // floor + paper
  if (d.y < 0.) {
    float tt = -ro.y/d.y; vec3 p = ro + d*tt; tHit = tt;
    col = floorCol(p);
    float s = 5.2 - p.z - uU;            // document coordinate: top of the text points away from the lens
    if (abs(p.x) < WP*.5 && p.z < ZR) {
      float u = p.x/WP + .5;
      vec4 acc = vec4(0.);
      for (int i = 0; i < 7; i++) { float k = (float(i)/6. - .5)*uBlur; acc += paper(s + k, u, 0.); }
      acc /= 7.;
      vec3 pc = mix(col, acc.rgb, acc.a);
      // ambient occlusion in front of the roll + soft leading-edge shadow
      pc *= 1. - .35*smoothstep(ZR - 2.2, ZR, p.z);
      col = pc;
    }
    // haze into the distance
    col = mix(col, vec3(1.), smoothstep(14., 40., tt)*.6);
  }
  // the roll (cylinder along x)
  vec2 oc = vec2(ro.y - RR, ro.z - ZR), dd = vec2(d.y, d.z);
  float a = dot(dd, dd), b = 2.*dot(oc, dd), c = dot(oc, oc) - RR*RR, disc = b*b - 4.*a*c;
  if (disc > 0.) {
    float tc = (-b - sqrt(disc))/(2.*a);
    vec3 p = ro + d*tc;
    if (tc > 0. && tc < tHit && abs(p.x) < WP*.5) {
      vec2 n = vec2(p.y - RR, p.z - ZR)/RR;
      float phi = atan(n.y, -n.x);
      vec4 tx = texture(uBody, vec2(p.x/WP + .5, (-11.8 - uU - phi*RR)/BODYLEN));
      float lam = .55 + .45*max(dot(normalize(vec3(0., n.x, n.y)), normalize(vec3(.3, .8, -.5))), 0.);
      vec3 rc = mix(vec3(.85), tx.rgb, tx.a)*lam;
      rc = mix(rc, rc*.6, smoothstep(.6, 1., abs(p.x)/(WP*.5)));
      col = rc;
      // dark outline at the silhouette
      col *= smoothstep(0., .25, abs(n.y + .0) + .2);
    }
  }
  o = vec4(col, 1.);
}`;

const PH = [
  'CREATOR shall mention SPONSOR no fewer than forty-seven (47) times per video', 'SPONSOR retains perpetual rights to CREATOR\'s face, voice and thumbnail',
  'CREATOR waives all rights to say "this video is not sponsored"', 'all creative decisions require written approval in triplicate',
  'SPONSOR may edit the final cut at any time without notice', 'CREATOR shall smile on camera at all times (see Appendix Q)',
  'exclusivity extends to this universe and all adjacent universes', 'payment net-180 days, in exposure and store credit',
  'CREATOR agrees to read the ad-read script verbatim, including typos', 'any mention of competing products shall incur a penalty of $99,997',
  'this clause intentionally left ambiguous', 'CREATOR consents to a mandatory 90-second unskippable intro',
  'SPONSOR may rename the channel at its sole discretion', 'renewal is automatic and cannot be cancelled',
];

let TEX = null;
function makeTex(gl, canvas) {
  const tx = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tx);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  const an = gl.getExtension('EXT_texture_filter_anisotropic');
  if (an) gl.texParameterf(gl.TEXTURE_2D, an.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(16, gl.getParameter(an.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
  return tx;
}
function sheet(x, h) {
  // tractor-feed paper: pale blue bars, margins with sprocket holes
  x.clearRect(0, 0, TW, h);
  for (let y = 0; y < h; y += 128) { x.fillStyle = '#FFFFFF'; x.fillRect(0, y, TW, 64); x.fillStyle = '#E4E8FF'; x.fillRect(0, y + 64, TW, 64); }
  x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, 70, h); x.fillRect(TW - 70, 0, 70, h);
  x.strokeStyle = 'rgba(14,14,18,0.25)'; x.setLineDash([6, 6]); x.lineWidth = 2; x.beginPath(); x.moveTo(72, 0); x.lineTo(72, h); x.moveTo(TW - 72, 0); x.lineTo(TW - 72, h); x.stroke(); x.setLineDash([]);
}
function holes(x, h) {
  x.globalCompositeOperation = 'destination-out'; x.fillStyle = '#000';
  for (let y = 32; y < h; y += 64) { x.beginPath(); x.arc(35, y, 13, 0, TAU); x.arc(TW - 35, y, 13, 0, TAU); x.fill(); }
  x.globalCompositeOperation = 'source-over';
}
function buildTextures() {
  const R = rng(5150);
  // ---- header ----
  const hc = buf('W03-head', TW, HEAD_H), hx = bctx(hc);
  sheet(hx, HEAD_H);
  hx.textAlign = 'center'; hx.textBaseline = 'middle'; hx.fillStyle = '#0E0E12';
  font(hx, 112, 'Anton'); hx.fillText('SPONSORSHIP', TW / 2, 150); hx.fillText('AGREEMENT', TW / 2, 272);
  hx.fillStyle = C.blue; hx.fillRect(110, 350, TW - 220, 12);
  font(hx, 26, 'JetBrains Mono', '700'); hx.fillStyle = '#0E0E12';
  hx.fillText('THIS AGREEMENT IS MADE BETWEEN', TW / 2, 410);
  font(hx, 48, 'Anton'); hx.fillStyle = C.red; hx.fillText('BIG BRAND CORP™ ("SPONSOR")', TW / 2, 476);
  font(hx, 26, 'JetBrains Mono', '700'); hx.fillStyle = '#0E0E12'; hx.fillText('— AND —', TW / 2, 530);
  font(hx, 48, 'Anton'); hx.fillStyle = C.blue; hx.fillText('YOU ("CREATOR")', TW / 2, 586);
  font(hx, 24, 'JetBrains Mono', '800'); hx.fillStyle = C.red; hx.fillText('PAGE 1 OF ∞', TW / 2, 650);
  hx.textAlign = 'left'; font(hx, 19, 'JetBrains Mono', '500'); hx.fillStyle = '#0E0E12';
  for (let i = 0; i < 12; i++) hx.fillText(('§0.' + (i + 1) + ' ' + PH[i % PH.length] + '; ').slice(0, 74), 100, 710 + i * 26);
  holes(hx, HEAD_H);
  // ---- body: endless fine print ----
  const bc = buf('W03-body', TW, BODY_H), bx = bctx(bc);
  sheet(bx, BODY_H);
  let y = 40, sec = 1;
  while (y < BODY_H - 60) {
    const r = R();
    if (r < 0.07 && y < BODY_H - 160) { // SIGN HERE box
      bx.fillStyle = '#FFE3E3'; bx.fillRect(110, y, TW - 220, 92); bx.strokeStyle = C.red; bx.lineWidth = 5; bx.strokeRect(110, y, TW - 220, 92);
      font(bx, 46, 'Anton'); bx.fillStyle = C.red; bx.textAlign = 'left'; bx.textBaseline = 'middle'; bx.fillText('SIGN HERE ✗', 136, y + 48);
      bx.fillStyle = '#0E0E12'; bx.fillRect(460, y + 66, TW - 600, 4);
      y += 120; continue;
    }
    if (r < 0.16 && y < BODY_H - 120) { // highlighted clause
      bx.fillStyle = C.blue; bx.fillRect(100, y - 4, TW - 200, 66);
      font(bx, 28, 'Anton'); bx.fillStyle = '#FFFFFF'; bx.textAlign = 'left'; bx.textBaseline = 'top';
      bx.fillText(('§' + sec + '.' + R.int(1, 9) + ' ' + PH[R.int(0, PH.length - 1)]).toUpperCase().slice(0, 58), 116, y + 14);
      y += 86; continue;
    }
    if (r < 0.24) { // section heading
      font(bx, 30, 'Anton'); bx.fillStyle = '#0E0E12'; bx.textAlign = 'left'; bx.textBaseline = 'top';
      bx.fillText(`§ ${sec}. ${['EXCLUSIVITY', 'COMPENSATION', 'TERMINATION', 'OWNERSHIP', 'OBLIGATIONS', 'PENALTIES', 'MORE PENALTIES', 'SOUL'][sec % 8]}`, 100, y + 6);
      sec++; y += 48; continue;
    }
    font(bx, 17, 'JetBrains Mono', '500'); bx.fillStyle = '#20202A'; bx.textAlign = 'left'; bx.textBaseline = 'top';
    const n = R.int(3, 6);
    for (let k = 0; k < n; k++) {
      let line = '';
      while (line.length < 78) line += PH[R.int(0, PH.length - 1)] + (R() < 0.3 ? ' (hereinafter "the Clause"); ' : '; ');
      if (R() < 0.08) { bx.fillStyle = 'rgba(255,42,42,0.25)'; bx.fillRect(98, y - 2, TW - 196, 24); bx.fillStyle = '#20202A'; }
      bx.fillText(line.slice(0, 82), 100, y); y += 25;
    }
    y += 12;
  }
  holes(bx, BODY_H);
  return { head: makeTex(G.gl, hc), body: makeTex(G.gl, bc) };
}

const FLY = [
  { t: 60.30, txt: 'SIGN HERE ✗', x: -0.55, y: 0.35, r: -0.2, red: 1 }, { t: 60.42, txt: 'INITIAL ___', x: 0.6, y: 0.2, r: 0.25 },
  { t: 60.52, txt: 'SIGN HERE ✗', x: 0.4, y: 0.55, r: 0.15, red: 1 }, { t: 60.62, txt: 'NON-COMPETE', x: -0.65, y: -0.1, r: -0.3 },
  { t: 60.72, txt: 'SIGN HERE ✗', x: -0.35, y: 0.6, r: 0.2, red: 1 }, { t: 60.82, txt: 'NET-180', x: 0.7, y: -0.15, r: -0.15 },
  { t: 60.92, txt: 'SIGN HERE ✗', x: 0.55, y: 0.5, r: -0.25, red: 1 }, { t: 61.02, txt: 'NO REFUNDS', x: -0.6, y: 0.3, r: 0.3 },
  { t: 61.10, txt: 'SIGN HERE ✗', x: -0.15, y: 0.62, r: 0.1, red: 1 }, { t: 61.18, txt: '∞ RENEWAL', x: 0.65, y: 0.4, r: 0.2 },
];

export default {
  ...S,
  cutIn: 'punch',
  sfx: [{ t: 60.30, type: 'paper', gain: 0.8 }, { t: T_SPON, type: 'stamp', gain: 0.9 }, { t: 61.0, type: 'riser', gain: 0.5 }],
  init() { TEX = buildTextures(); G.program('W03-paper', FRAG); },
  draw(ctx, t, s, E) {
    if (!TEX) TEX = buildTextures();
    const lt = s.lt;
    const U = 2.2 * lt + 0.42 * (Math.exp(lt * 4.3) - 1);
    const vel = 2.2 + 0.42 * 4.3 * Math.exp(lt * 4.3);
    const sn = A.pulse('snare', t, 0.08);
    const r = G.shader('W03-paper', FRAG, { uHead: TEX.head, uBody: TEX.body, uU: U, uBlur: Math.min(3.5, vel / 30 * 0.55), uT: lt, uShake: Math.sin(lt * 50) * 0.01 * sn });
    G.draw(ctx, r);

    // ---------- SIGN HERE boxes flying past the lens ----------
    const vp = [960, 300];
    for (const f of FLY) {
      const a = t - f.t; if (a < 0 || a > 0.42) continue;
      const k = Math.exp(a * 7.5) - 1;                   // perspective approach
      const sc = 0.12 + k * 0.32;
      const x = vp[0] + f.x * k * 520, y = vp[1] + f.y * k * 520;
      ctx.save(); ctx.translate(x, y); ctx.rotate(f.r + a * f.r * 3); ctx.scale(sc, sc);
      font(ctx, 90, 'Anton'); const tw = ctx.measureText(f.txt).width + 70;
      ctx.fillStyle = '#0E0E12'; ctx.fillRect(-tw / 2 + 14, -70 + 16, tw, 140);
      ctx.fillStyle = f.red ? '#FFFFFF' : C.grey; ctx.fillRect(-tw / 2, -70, tw, 140);
      ctx.lineWidth = 8; ctx.strokeStyle = f.red ? C.red : '#0E0E12'; ctx.strokeRect(-tw / 2, -70, tw, 140);
      ctx.fillStyle = f.red ? C.red : '#0E0E12'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(f.txt, 0, 4);
      ctx.restore();
    }

    // ---------- "THEY SAID YOU NEED A" + SPONSOR?! ----------
    const kick = [['THEY SAID', 60.28], ['YOU NEED', 60.76], ['A', 61.08]];
    font(ctx, 54, 'JetBrains Mono', '800');
    let x = 140;
    for (const [w, wt] of kick) {
      const a = seg(t, wt - 0.04, wt + 0.08); const ww = ctx.measureText(w).width + 36;
      if (a > 0) {
        ctx.save(); ctx.translate(x, 190); ctx.scale(1, ease.outBack(a, 2));
        ctx.fillStyle = '#0E0E12'; ctx.fillRect(8, -40 + 8, ww, 76); ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, -40, ww, 76);
        ctx.lineWidth = 5; ctx.strokeStyle = '#0E0E12'; ctx.strokeRect(0, -40, ww, 76);
        ctx.fillStyle = '#0E0E12'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(w, 18, 0);
        ctx.restore();
      }
      x += ww + 20;
    }
    const sa = t - T_SPON;
    if (sa >= 0) {
      const sc = lerp(1.5, 1, ease.outExpo(clamp(sa / 0.1))) * (1 + A.pulse('snare', t, 0.1) * 0.04);
      ctx.save(); ctx.translate(960, 440); ctx.rotate(-0.05); ctx.scale(sc, sc);
      font(ctx, 250, 'Anton'); const tw = ctx.measureText('SPONSOR?!').width + 110;
      ctx.fillStyle = '#0E0E12'; ctx.fillRect(-tw / 2 + 22, -150 + 24, tw, 300);
      ctx.fillStyle = C.blue; ctx.fillRect(-tw / 2, -150, tw, 300);
      ctx.lineWidth = 10; ctx.strokeStyle = '#0E0E12'; ctx.strokeRect(-tw / 2, -150, tw, 300);
      ctx.fillStyle = '#FFFFFF'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('SPONSOR?!', 0, 10);
      // red ✗
      ctx.strokeStyle = C.red; ctx.lineWidth = 26; ctx.lineCap = 'round';
      const xu = ease.outCubic(seg(t, 61.2, 61.3));
      if (xu > 0) { ctx.beginPath(); ctx.moveTo(-tw / 2 + 30, -130); ctx.lineTo(-tw / 2 + 30 + (tw - 60) * xu, -130 + 260 * xu); ctx.stroke(); }
      ctx.restore();
      if (sa < 0.12) { E.fx.shake = 18 * (1 - sa / 0.12); E.fx.rgb = 8; E.fx.zoom += 0.04 * (1 - sa / 0.12); }
    }
    E.fx.radialBlur = clamp((vel - 15) / 120) * 0.35; E.fx.center = [0.5, 0.72];
    E.fx.zoom += sn * 0.01;
  },
};
