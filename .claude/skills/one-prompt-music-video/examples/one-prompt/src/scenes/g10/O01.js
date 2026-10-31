// O01 — "One prompt" — SUNRISE TERMINAL. Bookend of the intro: we open INSIDE the same night terminal
// ("> one" types in orange phosphor), then the camera dollies back through the laptop screen: it is the same
// laptop / red mug / plant from the intro, on a desk in front of a big window — and the sun is rising right
// behind the lid. Time-lapse dawn: shader sky (night → dawn → day, streaking clouds, stars fading), city
// windows switching off, true depth parallax (each layer has its own depth), crepuscular god-rays computed
// on the GPU from an occluder mask. "prompt" types, ENTER → the sun crests the lid and the rays burst.
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, seg, rng, hash, noise2, roundRect, font, buf, bctx } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import * as IC from '../intro/common.js';
import { clockParts, pad2, mix3, css, glowPass, motes, inOutSine, lensFlare, G } from './common.js';

const S = shot('O01');
const T0 = S.start;                 // 142.92
const ENTER = 145.0 - T0;           // lt of the ENTER keystroke (after "prompt" 144.62)
const ONE_T = [0.04, 0.12, 0.2];    // "one" keystrokes (lt)
const PROMPT_T = [1.71, 1.765, 1.82, 1.875, 1.93, 1.985]; // "prompt" keystrokes (vocal at 144.62)

// ---------- sky shader ----------
const SKY = `
uniform float uE, uTime, uSunR, uHor;
uniform vec2 uSun, uPan;
float h21(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h21(i),h21(i+vec2(1,0)),f.x), mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x), f.y); }
float fbm(vec2 p){ float s=0., a=.5; for(int i=0;i<5;i++){ s+=a*vn(p); p=p*2.03+vec2(1.7,9.2); a*=.5; } return s; }
vec3 tri(vec3 a, vec3 b, vec3 c, float e){ return e < .5 ? mix(a, b, e*2.) : mix(b, c, (e-.5)*2.); }
void main(){
  vec2 px = vec2(uv.x, 1.-uv.y) * vec2(1920.,1080.);
  float e = clamp(uE, 0., 1.);
  float hgt = clamp((uHor - px.y)/950., 0., 1.);
  vec3 Z  = tri(vec3(.024,.031,.078), vec3(.13,.13,.36), vec3(.28,.64,1.0), e);
  vec3 Hc = tri(vec3(.09,.08,.20),   vec3(1.,.40,.13),  vec3(1.,.85,.52), e);
  float g = pow(1.-hgt, 2.4);
  vec3 col = mix(Z, Hc, g);
  col += vec3(.45,.12,.30) * exp(-pow((hgt-.42)*3.2,2.)) * sin(e*3.14159) * .55;
  vec2 d = px - uSun; float r = length(d);
  vec3 sunC = mix(vec3(1.,.42,.12), vec3(1.,.86,.52), e);
  float gl = clamp(exp(-r/(uSunR*1.6))*.85 + exp(-r/(uSunR*5.))*.45 + exp(-r/(uSunR*14.))*.25, 0., 1.);
  vec3 glowC = mix(vec3(1.,.42,.14), vec3(1.,.72,.36), e);
  col = mix(col, glowC, gl * (.4 + .45*e));
  col += glowC * exp(-r/(uSunR*1.3)) * .22;
  col += sunC * exp(-abs(px.y-uHor)/70.) * exp(-abs(px.x-uSun.x)/800.) * .55 * smoothstep(.1,.6,e);
  vec2 sp = (px + uPan*.15)/3.2; float hs = h21(floor(sp));
  float st = step(.9972, hs) * (1.-smoothstep(.05,.5,e)) * (.55+.45*sin(uTime*6.+hs*90.));
  col += vec3(st) * smoothstep(.2,.6,hgt);
  vec2 cp = vec2((px.x + uPan.x*.5)/950. + uTime*.22, (px.y + uPan.y*.5)/150.);
  float n = fbm(cp) + .35*fbm(cp*vec2(3.,2.) - uTime*.1);
  float band = smoothstep(.2,.42,hgt) * (1.-smoothstep(.8,1.,hgt));
  float dens = smoothstep(.6,.86,n) * band;
  vec3 cc = tri(vec3(.07,.07,.15), vec3(1.,.48,.36), vec3(1.,.96,.9), e);
  cc = mix(cc, cc*vec3(.75,.7,.95), smoothstep(.0,.3,n-.85));
  cc = mix(cc, glowC * 1.08, exp(-r/(uSunR*4.)) * .65 * e);
  col = mix(col, cc, dens*.88);
  float disc = smoothstep(uSunR+2., uSunR-2., r);
  vec3 dc = mix(vec3(1.,.55,.25), vec3(1.,.99,.93), smoothstep(.0,.6,e));
  col = mix(col, dc, disc);
  o = vec4(col, 1.);
}`;

// ---------- god-ray shader (volumetric light scattering from an occluder mask) ----------
const RAYS = `
uniform sampler2D uMask; uniform vec2 uSun, uPan; uniform float uInt, uR, uTime, uHor; uniform vec3 uCol;
float h21(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h21(i),h21(i+vec2(1,0)),f.x), mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x), f.y); }
float fbm(vec2 p){ float s=0., a=.5; for(int i=0;i<4;i++){ s+=a*vn(p); p=p*2.03+vec2(1.7,9.2); a*=.5; } return s; }
float cloud(vec2 p){
  vec2 px = vec2(p.x, 1.-p.y) * vec2(1920.,1080.);
  float hgt = clamp((uHor - px.y)/950., 0., 1.);
  vec2 cp = vec2((px.x + uPan.x*.5)/950. + uTime*.22, (px.y + uPan.y*.5)/150.);
  float n = fbm(cp) + .35*fbm(cp*vec2(3.,2.) - uTime*.1);
  float band = smoothstep(.2,.42,hgt) * (1.-smoothstep(.8,1.,hgt));
  return smoothstep(.6,.86,n) * band;
}
void main(){
  vec2 p = uv; vec2 dl = (uSun - p) / 48.0;
  float acc = 0., dec = 1.;
  for (int i = 0; i < 48; i++) {
    p += dl;
    vec2 q = (p - uSun) * vec2(1.7778, 1.);
    float r = length(q);
    float m = texture(uMask, p).r * (1. - .85 * cloud(p));
    acc += m * (exp(-r / uR) + .12 * exp(-r / (uR * 5.))) * dec;
    dec *= .975;
  }
  acc /= 26.;
  vec2 dd = (uv - uSun) * vec2(1.7778, 1.);
  float ang = atan(dd.y, dd.x);
  float stk = vn(vec2(ang * 9.0 + 40., uTime * .35)) * .6 + vn(vec2(ang * 23.0, uTime * .2 + 7.)) * .4;
  acc *= .3 + .9 * smoothstep(.3, .8, stk);
  o = vec4(uCol * acc * uInt, 1.);
}`;

// ---------- static scene data ----------
function makeCity(seed, base, minH, maxH, x0 = -400, x1 = 2320) {
  const r = rng(seed), out = []; let x = x0;
  while (x < x1) {
    const w = 50 + r() * 120, h = minH + r() * (maxH - minH);
    const wins = [];
    for (let yy = base - h + 10; yy < base - 8; yy += 13) for (let xx = x + 7; xx < x + w - 8; xx += 11) { const hh = hash(Math.floor(xx), Math.floor(yy), seed); if (hh < 0.33) wins.push([xx, yy, hh]); }
    out.push({ x, w, h, ant: r() < 0.2, wins }); x += w + 3 + r() * 10;
  }
  return out;
}
const DESK_Y = 745;
const CITY_FAR = makeCity(21, DESK_Y, 60, 230);
const CITY_NEAR = makeCity(37, DESK_Y, 30, 150);

// world layout (end framing = world coordinates at layer scale 1)
const LID = { x: 530, y: 250, w: 860, h: 510 }, SCR = { x: 560, y: 280, w: 800, h: 450 };
const K_TERM = SCR.w / W;           // terminal local → world
const TERM = { x0: 190, y0: 640, size: 186 };

// depth model: scale(layer at depth d) = (1 + d) / (D + d); D goes 1/2.4 → 1 (a dolly, not a zoom)
function camera(lt) {
  const u = ease.inOutQuart(seg(lt, 0.3, 1.62));
  const D0 = SCR.w / W, D1 = 1 / 1.07;
  let D = lerp(D0, D1, u);
  D = lerp(D, 1, ease.outCubic(seg(lt, 1.62, 2.62)));
  const beat = A.pulse('beat', T0 + lt, 0.12) * 0.006 * u;
  const F = { x: 960, y: lerp(SCR.y + SCR.h / 2, 540, u) };
  return { D, u, F, beat };
}
const layerScale = (cam, d) => (1 + d) / (cam.D + d) * (1 + cam.beat);
function setLayer(ctx, cam, d) {
  const s = layerScale(cam, d);
  ctx.setTransform(s, 0, 0, s, 960 - cam.F.x * s, 540 - cam.F.y * s);
  return s;
}
const toScreen = (cam, d, x, y) => { const s = layerScale(cam, d); return [960 + (x - cam.F.x) * s, 540 + (y - cam.F.y) * s]; };

function dawnE(lt) { return 0.62 * inOutSine(seg(lt, 0.25, 2.0)) + 0.38 * ease.outCubic(seg(lt, ENTER, ENTER + 0.55)); }
function sunWorldY(lt) {
  const pre = lerp(880, 352, inOutSine(seg(lt, 0.2, ENTER)));
  return lerp(pre, 214, ease.outBack(seg(lt, ENTER, ENTER + 0.42), 1.3));
}
function typedAt(lt) {
  let s = '';
  for (let i = 0; i < 3; i++) if (lt >= ONE_T[i]) s += 'one'[i];
  if (lt >= PROMPT_T[0]) s += ' ';
  for (let i = 0; i < 6; i++) if (lt >= PROMPT_T[i]) s += 'prompt'[i];
  return s;
}
const KEYS = [...ONE_T, ...PROMPT_T];
const lastKey = (lt) => { let k = -1; for (const x of [...KEYS, ENTER]) if (lt >= x) k = Math.max(k, x); return k; };

// ---------- drawing ----------
function drawCity(ctx, list, col, winA, t, e) {
  ctx.fillStyle = col;
  for (const b of list) {
    ctx.fillRect(b.x, DESK_Y - b.h, b.w, b.h + 400);
    if (b.ant) ctx.fillRect(b.x + b.w * 0.5 - 2, DESK_Y - b.h - 40, 4, 40);
  }
  if (winA <= 0.01) return;
  for (const b of list) for (const [x, y, hh] of b.wins) {
    const off = hh / 0.33;
    if (off < e * 1.25) continue;
    const warm = hh < 0.12;
    if (warm && Math.floor(t * 2.4 + hh * 40) % 2) continue;
    ctx.fillStyle = warm ? `rgba(255,106,31,${winA})` : `rgba(247,185,85,${winA * 0.8})`;
    ctx.fillRect(x, y, warm ? 2.6 : 5, warm ? 6 : 4);
  }
}

function drawWindowFrame(ctx, e) {
  ctx.fillStyle = css(mix3('#090B18', '#3A2433', e * 0.85));
  ctx.fillRect(-900, -900, 940, 2900);
  ctx.fillRect(1880, -900, 900, 2900);
  ctx.fillRect(268, -900, 34, 1650);
  ctx.fillRect(1618, -900, 34, 1650);
  ctx.fillStyle = `rgba(255,190,120,${0.15 + e * 0.75})`;
  ctx.fillRect(298, -900, 4, 1650); ctx.fillRect(1618, -900, 4, 1650); ctx.fillRect(36, -900, 4, 2900); ctx.fillRect(1880, -900, 4, 2900);
}

function drawDesk(ctx, e, sunX) {
  const top = mix3('#1A1430', '#6B3B2A', e), front = mix3('#0D0A1C', '#3A1E1A', e);
  const g = ctx.createLinearGradient(0, DESK_Y, 0, 1200);
  g.addColorStop(0, css(mix3('#2A1E48', '#FFB070', e * 0.9))); g.addColorStop(0.08, css(top)); g.addColorStop(1, css(front));
  ctx.fillStyle = g; ctx.fillRect(-900, DESK_Y, 3700, 900);
  const rg = ctx.createRadialGradient(sunX, DESK_Y + 30, 10, sunX, DESK_Y + 30, 700);
  rg.addColorStop(0, `rgba(255,200,130,${0.15 + e * 0.45})`); rg.addColorStop(1, 'rgba(255,200,130,0)');
  ctx.save(); ctx.translate(sunX, DESK_Y); ctx.scale(1, 0.25); ctx.translate(-sunX, -DESK_Y);
  ctx.fillStyle = rg; ctx.fillRect(-900, DESK_Y - 800, 3700, 1700); ctx.restore();
}

function drawLaptop(ctx, e, keyGlow) {
  ctx.fillStyle = css(mix3('#23263A', '#2C2235', e)); roundRect(ctx, LID.x, LID.y, LID.w, LID.h, 24); ctx.fill();
  ctx.fillStyle = css(mix3('#2E3248', '#5A4250', e));
  ctx.beginPath(); ctx.moveTo(500, 762); ctx.lineTo(1420, 762); ctx.lineTo(1500, 842); ctx.lineTo(420, 842); ctx.closePath(); ctx.fill();
  ctx.fillStyle = css(mix3('#3A3F5C', '#C88A6A', e)); ctx.fillRect(420, 842, 1080, 13);
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(420, 855, 1080, 6);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 15; c++) {
    const sx = lerp(0.93, 1.06, r / 3), kx = 960 + (c - 7) * 56 * sx - 23, ky = 772 + r * 16;
    const hot = keyGlow(c, r);
    ctx.fillStyle = hot > 0.02 ? `rgba(255,${150 + 80 * hot | 0},${80 + 100 * hot | 0},${0.3 + hot * 0.7})` : css(mix3('#3A2B40', '#6E5060', e), 0.9);
    ctx.fillRect(kx, ky, 46 * sx, 11);
  }
}

function drawProps(ctx, t, e) {
  ctx.fillStyle = '#E8343F'; roundRect(ctx, 1560, 690, 110, 130, 14); ctx.fill();
  ctx.strokeStyle = '#E8343F'; ctx.lineWidth = 16; ctx.beginPath(); ctx.arc(1680, 750, 32, -1.2, 1.2); ctx.stroke();
  ctx.fillStyle = `rgba(255,220,180,${0.25 + e * 0.5})`; ctx.fillRect(1566, 696, 8, 110);
  ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(1630, 696, 34, 118);
  ctx.lineCap = 'round';
  for (let k = 0; k < 3; k++) {
    ctx.strokeStyle = `rgba(255,${235 - k * 10},${210 - e * 40 | 0},${0.16 + e * 0.22})`; ctx.lineWidth = 7 - k;
    ctx.beginPath();
    for (let y = 0; y < 170; y += 5) ctx.lineTo(1590 + k * 26 + noise2(y * 0.012 - t * 0.9, k * 3) * 26 + Math.sin(y * 0.05 + t * 3 + k) * 6, 680 - y);
    ctx.stroke();
  }
  for (let k = 0; k < 7; k++) {
    ctx.save(); ctx.translate(260, 750); ctx.rotate(-1.2 + k * 0.4 + Math.sin(t * 1.3 + k) * 0.04);
    ctx.fillStyle = css(mix3('#2B6B4A', '#3E8A50', e)); ctx.beginPath(); ctx.ellipse(0, -90, 26, 90, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = `rgba(255,220,140,${0.1 + e * 0.35})`; ctx.beginPath(); ctx.ellipse(8, -100, 6, 70, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = '#C46A3A'; ctx.fillRect(210, 750, 100, 80); ctx.fillStyle = '#A8552C'; ctx.fillRect(204, 744, 112, 16);
}

function drawTerminal(ctx, t, lt) {
  const typed = typedAt(lt);
  const heat = lt >= ENTER ? Math.exp(-(lt - ENTER) * 3.5) : 0;
  const cursorOn = lt >= ENTER ? Math.floor((lt - ENTER) * 4) % 2 === 1 : (lt < 0.3 || lt >= PROMPT_T[0]) ? true : Math.floor((lt - 0.3) * 3.33) % 2 === 1;
  const [hh, mm, ss] = clockParts(T0);
  if (IC.terminal) IC.terminal(ctx, t, { typed, cursorOn, heat, size: TERM.size, x0: TERM.x0, y0: TERM.y0, lines: false, log: [] });
  else {
    ctx.fillStyle = '#070914'; ctx.fillRect(0, 0, W, H);
    font(ctx, TERM.size, 'JetBrains Mono', '800'); ctx.fillStyle = '#FF6A1F'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('> ' + typed, TERM.x0, TERM.y0);
  }
  font(ctx, 34, 'JetBrains Mono', '600'); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255,251,244,0.34)';
  ctx.fillText(`Last login: Sat Oct 10 ${pad2(hh)}:${pad2(mm)}:${pad2(ss)} on ttys001`, TERM.x0, TERM.y0 - 330);
  ctx.fillText('claude  ·  opus 5.5  ·  local  ·  ready', TERM.x0, TERM.y0 - 282);
  ctx.fillStyle = 'rgba(255,106,31,0.5)'; ctx.fillText('~/one-prompt  main ✓', TERM.x0, TERM.y0 - 212);
  if (lt >= ENTER + 0.06) {
    const k = ease.outExpo((lt - ENTER - 0.06) / 0.25);
    const str = '☀ good morning.';
    const n = Math.floor(clamp((lt - ENTER - 0.06) / 0.28) * str.length);
    font(ctx, 88, 'JetBrains Mono', '800');
    ctx.save(); ctx.globalAlpha = k; ctx.fillStyle = '#FFD23F'; ctx.shadowColor = 'rgba(255,190,80,0.9)'; ctx.shadowBlur = 30;
    ctx.fillText(str.slice(0, Math.max(1, n)), TERM.x0, TERM.y0 + 200);
    ctx.restore();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(0, 0, W, 64);
  ['#FF5F57', '#FEBC2E', '#28C840'].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(46 + i * 40, 32, 13, 0, TAU); ctx.fill(); });
  font(ctx, 28, 'JetBrains Mono', '700'); ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,251,244,0.45)';
  ctx.fillText('cursor — zsh — one-prompt', W / 2, 33);
}

export default {
  ...S,
  hud: 'paper',
  cutIn: 'flash',
  sfx: [{ t: 142.96, type: 'type', gain: 0.7 }, { t: 143.3, type: 'whoosh', gain: 0.8 }, { t: 144.64, type: 'type', gain: 0.7 }, { t: 145.0, type: 'boom', gain: 0.9 }],
  draw(ctx, t, s, E) {
    const lt = t - T0;
    const cam = camera(lt);
    const e = dawnE(lt);
    if (!s.thumb) this.hud = e > 0.58 ? 'ink' : 'paper';

    const sunY = sunWorldY(lt);
    const sunS = toScreen(cam, 1e6, 960, sunY);
    const horS = toScreen(cam, 1e6, 0, DESK_Y)[1];
    const sunR = 88;
    const burst = lt >= ENTER ? Math.exp(-(lt - ENTER) * 2.2) : 0;

    // ---- sky (GPU) ----
    G.draw(ctx, G.shader('O01-sky', SKY, { uE: e, uTime: lt + 0.4, uSun: sunS, uSunR: sunR, uHor: horS, uPan: [0, cam.F.y - 540] }));

    // ---- city (deep layers) ----
    const winA = 1 - clamp(e * 1.1);
    ctx.save(); setLayer(ctx, cam, 30);
    drawCity(ctx, CITY_FAR, css(mix3('#0F1430', '#B0607A', e * 0.75)), winA, t, e);
    ctx.restore();
    ctx.save(); setLayer(ctx, cam, 12);
    drawCity(ctx, CITY_NEAR, css(mix3('#080B1E', '#6A3550', e * 0.8)), winA, t, e);
    const hz = ctx.createLinearGradient(0, 560, 0, 760); hz.addColorStop(0, 'rgba(255,170,110,0)'); hz.addColorStop(1, `rgba(255,170,110,${0.1 + e * 0.35})`);
    ctx.fillStyle = hz; ctx.fillRect(-900, 560, 3700, 200);
    ctx.restore();

    // ---- window frame (depth 0.6) ----
    ctx.save(); setLayer(ctx, cam, 0.6); drawWindowFrame(ctx, e); ctx.restore();

    // ---- desk + laptop + props (depth 0) ----
    const keyGlow = (c, rr) => {
      let v = 0;
      for (const kt of KEYS) { if (lt < kt) continue; const k = Math.round(kt * 1000); if (c === Math.floor(hash(k, 3) * 15) && rr === Math.floor(hash(k, 4) * 3)) v = Math.max(v, Math.exp(-(lt - kt) * 6)); }
      if (lt >= ENTER && c >= 13 && rr === 1) v = Math.max(v, Math.exp(-(lt - ENTER) * 4));
      return v;
    };
    ctx.save(); setLayer(ctx, cam, 0);
    drawDesk(ctx, e, 960);
    const spill = ctx.createRadialGradient(960, 860, 40, 960, 860, 700);
    spill.addColorStop(0, `rgba(255,120,50,${0.32 * (1 - e)})`); spill.addColorStop(1, 'rgba(255,120,50,0)');
    ctx.fillStyle = spill; ctx.fillRect(200, 700, 1520, 500);
    drawLaptop(ctx, e, keyGlow);
    drawProps(ctx, t, e);
    ctx.save(); ctx.beginPath(); ctx.rect(SCR.x, SCR.y, SCR.w, SCR.h); ctx.clip();
    ctx.translate(SCR.x, SCR.y); ctx.scale(K_TERM, K_TERM);
    drawTerminal(ctx, t, lt);
    ctx.restore();
    if (e > 0.05) {
      ctx.save(); ctx.beginPath(); ctx.rect(SCR.x, SCR.y, SCR.w, SCR.h); ctx.clip();
      const gx = lerp(SCR.x - 500, SCR.x + SCR.w + 200, inOutSine(seg(lt, 1.0, 2.6)));
      const gg = ctx.createLinearGradient(gx, SCR.y, gx + 360, SCR.y + SCR.h);
      gg.addColorStop(0, 'rgba(255,240,220,0)'); gg.addColorStop(0.5, `rgba(255,240,220,${0.10 * e})`); gg.addColorStop(1, 'rgba(255,240,220,0)');
      ctx.fillStyle = gg; ctx.fillRect(SCR.x, SCR.y, SCR.w, SCR.h);
      ctx.restore();
    }
    ctx.restore();

    // ---- hot rim light around the lid (sun right behind it) ----
    const sunBehind = clamp(1 - Math.abs(sunY - (LID.y + 40)) / 380) * clamp(e * 2);
    const rimA = clamp(sunBehind * 0.9 + burst * 0.8);
    if (rimA > 0.02) {
      const s0 = layerScale(cam, 0);
      glowPass(ctx, 'O01-rim', (x) => {
        x.transform(s0, 0, 0, s0, 960 - cam.F.x * s0, 540 - cam.F.y * s0);
        x.strokeStyle = 'rgba(255,225,170,1)'; x.lineWidth = 16; roundRect(x, LID.x, LID.y, LID.w, LID.h, 24); x.stroke();
      }, { blur: 5, alpha: rimA, comp: 'lighter' });
      ctx.save(); setLayer(ctx, cam, 0);
      ctx.strokeStyle = `rgba(255,236,200,${rimA})`; ctx.lineWidth = 3; roundRect(ctx, LID.x + 1, LID.y + 1, LID.w - 2, LID.h - 2, 23); ctx.stroke();
      ctx.restore();
    }

    // ---- god rays from an occluder mask ----
    const mw = 480, mh = 270, m = buf('O01-mask', mw, mh), mx = bctx(m), q = mw / W;
    mx.setTransform(1, 0, 0, 1, 0, 0); mx.fillStyle = '#fff'; mx.fillRect(0, 0, mw, mh); mx.fillStyle = '#000';
    const sl = (d) => { const s0 = layerScale(cam, d); mx.setTransform(s0 * q, 0, 0, s0 * q, (960 - cam.F.x * s0) * q, (540 - cam.F.y * s0) * q); };
    sl(30); for (const b of CITY_FAR) mx.fillRect(b.x, DESK_Y - b.h, b.w, b.h + 400);
    sl(12); for (const b of CITY_NEAR) mx.fillRect(b.x, DESK_Y - b.h, b.w, b.h + 400);
    sl(0.6); mx.fillRect(-900, -900, 940, 2900); mx.fillRect(1880, -900, 900, 2900); mx.fillRect(268, -900, 34, 1650); mx.fillRect(1618, -900, 34, 1650);
    sl(0); mx.fillRect(-900, DESK_Y, 3700, 900); roundRect(mx, LID.x, LID.y, LID.w, LID.h, 24); mx.fill();
    mx.fillRect(1560, 690, 110, 130); mx.fillRect(160, 600, 200, 230);
    const mt = G.canvasTex('O01-mask', m);
    const rayInt = (0.24 + 0.3 * e) * (0.6 + 0.9 * burst) * clamp(lt / 0.6);
    const rr = G.shader('O01-rays', RAYS, { uMask: mt, uSun: [sunS[0] / W, 1 - sunS[1] / H], uInt: rayInt, uR: 0.055, uTime: lt + 0.4, uHor: horS, uPan: [0, cam.F.y - 540], uCol: [1.0, 0.72 + 0.2 * e, 0.42 + 0.3 * e] }, 960, 540);
    ctx.save(); ctx.globalCompositeOperation = 'screen'; G.draw(ctx, rr); ctx.restore();

    // crisp graphic sun disc, occluded by the lid (evenodd clip)
    if (sunS[1] < 900) {
      const s0 = layerScale(cam, 0);
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H);
      ctx.setTransform(s0, 0, 0, s0, 960 - cam.F.x * s0, 540 - cam.F.y * s0);
      const L = LID, rr0 = 24; ctx.moveTo(L.x + rr0, L.y); ctx.arcTo(L.x + L.w, L.y, L.x + L.w, L.y + L.h, rr0); ctx.arcTo(L.x + L.w, L.y + L.h, L.x, L.y + L.h, rr0); ctx.arcTo(L.x, L.y + L.h, L.x, L.y, rr0); ctx.arcTo(L.x, L.y, L.x + L.w, L.y, rr0); ctx.closePath();
      ctx.rect(-900, DESK_Y, 3700, 900);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clip('evenodd');
      const sg = ctx.createRadialGradient(sunS[0], sunS[1], 0, sunS[0], sunS[1], sunR);
      sg.addColorStop(0, '#FFFFFF'); sg.addColorStop(0.55, '#FFF6D8'); sg.addColorStop(0.92, `rgba(255,${226 + 20 * e | 0},${150 + 60 * e | 0},1)`); sg.addColorStop(1, 'rgba(255,214,120,0.0)');
      ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(sunS[0], sunS[1], sunR, 0, TAU); ctx.fill();
      ctx.restore();
    }

    // anamorphic lens flare once the disc clears the lid
    const vis = clamp((LID.y * layerScale(cam, 0) + 540 - cam.F.y * layerScale(cam, 0) - (sunS[1] - sunR)) / (sunR * 1.4));
    if (vis > 0) lensFlare(ctx, sunS[0], sunS[1], 0.55 * vis + 0.5 * burst * vis, { t, streak: 0.9, ghosts: 0.8, star: 0.5 });

    motes(ctx, t, { n: 46, seed: 11, col: [255, 225, 170], alpha: 0.18 + 0.4 * e, size: [2, 10], speed: 14 });

    // ---- FX ----
    const pull = Math.abs(ease.inOutQuart(seg(lt + 1 / 30, 0.3, 1.62)) - cam.u) * 30;
    E.fx.radialBlur = clamp(pull * 0.07, 0, 0.35);
    E.fx.center = [0.5, 0.5];
    E.fx.bloom = 0.3 + 0.15 * e + burst * 0.3; E.fx.bloomThreshold = 0.84;
    E.fx.vignette = 0.3;
    const kt = lastKey(lt);
    if (kt >= 0 && kt < ENTER) E.fx.zoom += 0.008 * Math.exp(-(lt - kt) * 18);
    if (lt >= ENTER) {
      E.fx.flash = [1, 0.85, 0.6, 0.38 * Math.exp(-(lt - ENTER) * 8)];
      E.fx.shake = 9 * Math.exp(-(lt - ENTER) * 9); E.fx.rgb = 5 * burst; E.fx.zoom += 0.035 * Math.exp(-(lt - ENTER) * 6);
    }
    E.fx.saturation = 1.14;
  },
};
