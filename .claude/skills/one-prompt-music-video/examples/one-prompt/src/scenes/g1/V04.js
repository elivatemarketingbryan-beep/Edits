// V04 — "Opus five point five on the other side" — a TRUE Droste effect in GLSL.
// One self-similar "desk + laptop" image (4 colour variants in an atlas) is sampled recursively:
// every point is rescaled by s^n until it lands outside the laptop screen, so the zoom is genuinely
// infinite. On "five" it snaps into Escher's Print-Gallery spiral (complex log → multiply by
// β = 1 − i·ln(s)/2π → exp), on "other" it straightens and rushes, on "side" the camera punches
// through the glass and the world flips — CURSOR is pressed against the other side.
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, rng, font, roundRect, wobble } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { G } from '../../core/gl.js';
import { drawMascot, pose } from '../../core/mascot.js';
import { P1, paperTex, printType, stamp } from './util.js';

const S = shot('V04');
const SC = 2.5; // scale between levels
const T_FIVE = 12.92, T_POINT = 13.12, T_FIVE2 = 13.3, T_OTHER = 13.82, T_SIDE = 13.98;

const VARS = [
  { bg: '#F4EDE0', desk: '#E2D3B8', lid: P1.ink, deck: '#2A3768', keys: '#F4EDE0', acc: P1.orange, mug: P1.red, note: '#FFD9A8', ink: P1.ink, glow: P1.orange },
  { bg: P1.red, desk: '#B8232E', lid: '#F4EDE0', deck: '#E2D3B8', keys: P1.ink, acc: P1.orange, mug: P1.ink, note: '#F4EDE0', ink: P1.ink, glow: '#FFE0B0' },
  { bg: P1.orange, desk: '#D9520F', lid: P1.ink, deck: '#2A3768', keys: '#F4EDE0', acc: P1.red, mug: '#F4EDE0', note: '#FFF3D6', ink: P1.ink, glow: '#FFF3D6' },
  { bg: P1.ink, desk: '#141C3D', lid: P1.orange, deck: '#E8601A', keys: P1.ink, acc: '#F4EDE0', mug: P1.red, note: '#F4EDE0', ink: P1.ink, glow: P1.orange },
];

function drawLevel(x, V, vi) {
  // wall + desk
  x.fillStyle = V.bg; x.fillRect(0, 0, W, H);
  x.globalAlpha = 0.55; x.globalCompositeOperation = 'multiply'; x.drawImage(paperTex('#F7F1E6', W, H, 11 + vi), 0, 0); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
  x.fillStyle = V.desk; x.fillRect(0, 900, W, H - 900);
  x.fillStyle = 'rgba(0,0,0,0.12)'; x.fillRect(0, 900, W, 10);
  // wall stripes (wallpaper)
  x.fillStyle = 'rgba(255,255,255,0.07)'; for (let i = 0; i < 24; i++) x.fillRect(i * 80, 44, 36, 856);
  // window chrome across the top of the "screen"
  x.fillStyle = V.lid; x.fillRect(0, 0, W, 44);
  [P1.red, P1.orange, '#F4EDE0'].forEach((c, i) => { x.fillStyle = c; x.beginPath(); x.arc(30 + i * 30, 22, 9, 0, TAU); x.fill(); });
  x.fillStyle = V.lid === P1.ink ? '#F4EDE0' : P1.ink; x.font = '700 22px "JetBrains Mono"'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText('opus-5.5 — ~/one-prompt — screen ' + (vi + 1), W / 2, 23);
  // sticky notes (code in handwriting)
  const notes = [[150, 190, -0.08, '// ship it'], [330, 330, 0.06, 'one prompt ✓'], [1630, 210, 0.07, 'npm run vibes'], [1500, 400, -0.05, '$0.00']];
  for (const [nx, ny, r, txt] of notes) {
    x.save(); x.translate(nx, ny); x.rotate(r);
    x.fillStyle = 'rgba(0,0,0,0.18)'; x.fillRect(-92, -72, 196, 160);
    x.fillStyle = V.note; x.fillRect(-100, -80, 196, 160);
    x.fillStyle = V.acc; x.fillRect(-100, -80, 196, 18);
    x.fillStyle = P1.ink; x.font = '700 38px "Caveat"'; x.fillText(txt, -2, 10); x.restore();
  }
  // poster on the wall
  x.save(); x.translate(1640, 640); x.rotate(0.03);
  x.fillStyle = V.lid; roundRect(x, -120, -150, 240, 300, 10); x.fill();
  x.fillStyle = V.acc; x.font = '800 120px "JetBrains Mono"'; x.fillText('>_', 0, -20);
  x.fillStyle = V.lid === P1.ink ? '#F4EDE0' : P1.ink; x.font = '400 46px "Anton"'; x.fillText('OPUS 5.5', 0, 95); x.restore();
  // desk lamp (left) + light cone
  x.save(); x.translate(250, 900);
  x.fillStyle = 'rgba(255,240,200,0.18)'; x.beginPath(); x.moveTo(150, -420); x.lineTo(-60, 0); x.lineTo(420, 0); x.closePath(); x.fill();
  x.strokeStyle = V.lid; x.lineWidth = 16; x.lineCap = 'round'; x.beginPath(); x.moveTo(0, -10); x.lineTo(-40, -260); x.lineTo(120, -400); x.stroke();
  x.fillStyle = V.acc; x.beginPath(); x.moveTo(90, -450); x.lineTo(210, -380); x.lineTo(150, -330); x.lineTo(60, -400); x.closePath(); x.fill();
  x.fillStyle = V.lid; roundRect(x, -70, -20, 140, 26, 10); x.fill(); x.restore();
  // mug with steam
  x.save(); x.translate(420, 900);
  x.fillStyle = V.mug; roundRect(x, -50, -120, 100, 120, 14); x.fill();
  x.lineWidth = 14; x.strokeStyle = V.mug; x.beginPath(); x.arc(50, -64, 26, -1.2, 1.2); x.stroke();
  x.fillStyle = V.mug === '#F4EDE0' ? P1.ink : '#F4EDE0'; x.font = '800 34px "JetBrains Mono"'; x.fillText('>_', 0, -60);
  x.strokeStyle = 'rgba(255,255,255,0.6)'; x.lineWidth = 8; for (let i = 0; i < 3; i++) { x.beginPath(); x.moveTo(-24 + i * 24, -140); x.bezierCurveTo(-44 + i * 24, -180, -4 + i * 24, -200, -24 + i * 24, -240); x.stroke(); }
  x.restore();
  // plant (right)
  x.save(); x.translate(1500, 900);
  x.fillStyle = V.acc; x.beginPath(); x.moveTo(-60, -110); x.lineTo(60, -110); x.lineTo(44, 0); x.lineTo(-44, 0); x.closePath(); x.fill();
  x.fillStyle = '#2F7A55';
  for (let i = 0; i < 7; i++) { x.save(); x.translate(0, -110); x.rotate(-1.2 + i * 0.4); x.beginPath(); x.ellipse(0, -80, 24, 80, 0, 0, TAU); x.fill(); x.restore(); }
  x.restore();
  // ---- laptop: screen rect = frame / SC, centred ----
  const sw = W / SC, sh = H / SC, sx = (W - sw) / 2, sy = (H - sh) / 2;
  // deck (perspective trapezoid)
  x.fillStyle = 'rgba(0,0,0,0.22)'; x.beginPath(); x.ellipse(W / 2, 935, 640, 40, 0, 0, TAU); x.fill();
  const dTop = sy + sh + 48, dBot = 930;
  x.fillStyle = V.deck; x.beginPath(); x.moveTo(sx - 40, dTop); x.lineTo(sx + sw + 40, dTop); x.lineTo(sx + sw + 190, dBot); x.lineTo(sx - 190, dBot); x.closePath(); x.fill();
  x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(sx - 190, dBot - 12, sw + 380, 12);
  // keys on the deck
  for (let r = 0; r < 4; r++) {
    const y0 = lerp(dTop + 16, dBot - 70, r / 4), y1 = lerp(dTop + 16, dBot - 70, (r + 0.75) / 4);
    const xl = lerp(sx - 20, sx - 130, (r + 0.5) / 4), xr = lerp(sx + sw + 20, sx + sw + 130, (r + 0.5) / 4);
    const n = 14;
    for (let i = 0; i < n; i++) { x.fillStyle = V.keys; const kx = lerp(xl, xr, i / n); x.fillRect(kx + 3, y0, (xr - xl) / n - 6, y1 - y0); }
  }
  x.fillStyle = 'rgba(255,255,255,0.18)'; roundRect(x, W / 2 - 110, dBot - 62, 220, 50, 8); x.fill();
  // lid / bezel
  x.fillStyle = 'rgba(0,0,0,0.25)'; roundRect(x, sx - 34, sy - 30, sw + 68, sh + 96, 30); x.fill();
  x.fillStyle = V.lid; roundRect(x, sx - 40, sy - 40, sw + 80, sh + 92, 30); x.fill();
  x.fillStyle = 'rgba(255,255,255,0.15)'; roundRect(x, sx - 40, sy - 40, sw + 80, 14, 7); x.fill();
  x.fillStyle = '#0B0F22'; x.beginPath(); x.arc(W / 2, sy - 20, 6, 0, TAU); x.fill();
  x.fillStyle = V.glow; x.font = '400 30px "Anton"'; x.fillText('OPUS 5.5', W / 2, sy + sh + 27);
  // screen glass border
  x.fillStyle = '#000'; x.fillRect(sx - 4, sy - 4, sw + 8, sh + 8);
}

let R = null;
function build() {
  const atlas = document.createElement('canvas'); atlas.width = W * 2; atlas.height = H * 2;
  const x = atlas.getContext('2d');
  VARS.forEach((V, i) => { x.save(); x.translate((i % 2) * W, Math.floor(i / 2) * H); x.beginPath(); x.rect(0, 0, W, H); x.clip(); drawLevel(x, V, i); x.restore(); });
  const tex = G.canvasTex('V04-atlas', atlas, true);
  const gl = G.gl; gl.bindTexture(gl.TEXTURE_2D, tex); gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  const shards = []; const r = rng(44);
  for (let i = 0; i < 40; i++) { const a = r() * TAU, d = 80 + r() * 700; const n = 3 + Math.floor(r() * 2); const pts = []; for (let k = 0; k < n; k++) { const b = a + (k / n) * TAU + r() * 0.5; pts.push([Math.cos(b) * (40 + r() * 90), Math.sin(b) * (40 + r() * 90)]); } shards.push({ a, d, pts, spin: (r() - 0.5) * 12, v: 900 + r() * 2200 }); }
  R = { tex, atlas, shards };
}

const FRAG = `
uniform sampler2D uT;
uniform float uS, uZ, uSpiral, uRot, uFlip, uVar, uLod;
vec2 cmul(vec2 a, vec2 b){ return vec2(a.x*b.x - a.y*b.y, a.x*b.y + a.y*b.x); }
void main(){
  float asp = uRes.x / uRes.y, hx = 0.5 * asp, hy = 0.5;
  vec2 p = vec2((uv.x - 0.5) * asp * uFlip, 0.5 - uv.y);
  float ls = log(uS);
  vec2 L = vec2(log(max(length(p), 1e-5)), atan(p.y, p.x) + uRot);
  vec2 beta = vec2(1.0, -ls / 6.2831853 * uSpiral);
  L = cmul(L, beta);
  L.x -= uZ * ls;
  vec2 q = exp(L.x) * vec2(cos(L.y), sin(L.y));
  float jac = exp(L.x) / max(length(p), 1e-5) * length(beta); // |dq/dp|
  float lvl = 0.;
  for (int i = 0; i < 14; i++) { if (abs(q.x) > hx || abs(q.y) > hy) { q /= uS; lvl -= 1.; jac /= uS; } }
  for (int i = 0; i < 14; i++) { if (abs(q.x) < hx / uS && abs(q.y) < hy / uS) { q *= uS; lvl += 1.; jac *= uS; } }
  float v = mod(floor(uZ) * 0. + lvl + uVar + 400., 4.);
  if (uSpiral > 0.5) v = mod(uVar + 400., 4.);
  vec2 cell = vec2(mod(v, 2.), floor(v / 2.));
  vec2 t = vec2(q.x / (2. * hx) + 0.5, q.y + 0.5);
  t = clamp(t, vec2(0.0008), vec2(0.9992));
  vec2 a = vec2((cell.x + t.x) * 0.5, 1. - (cell.y + t.y) * 0.5);
  float lod = log2(max(jac * uRes.y / 1080. * 0. + jac, 1.)) + uLod;
  o = vec4(textureLod(uT, a, lod).rgb, 1.);
}`;

export default {
  ...S,
  cutIn: 'punch',
  sfx: [{ t: 12.92, type: 'zap', gain: 0.6 }, { t: 13.82, type: 'riser', gain: 0.7 }, { t: 13.98, type: 'shatter', gain: 1 }],
  init() { build(); G.program('V04-droste', FRAG); },
  draw(ctx, t, s, E) {
    if (!R) build();
    const lt = s.lt;
    const beat = A.pulse('beat', t, 0.12), sn = A.pulse('snare', t, 0.1), hat = A.pulse('hat', t, 0.08);
    // ---------- zoom choreography (in levels) ----------
    let Z, spiral = 0, rot = 0, varOff = 0, flip = 1;
    if (t < T_FIVE) Z = 1.6 * ease.inOutQuad(seg(t, 12.48, T_FIVE)) + 0.25 * lt;
    else if (t < T_OTHER) {
      const u = (t - T_FIVE) / (T_OTHER - T_FIVE);
      Z = 1.7 + u * 2.6; spiral = 1; rot = -u * 2.2 - ease.outExpo(seg(t, T_POINT, T_POINT + 0.2)) * 0.6 - ease.outExpo(seg(t, T_FIVE2, T_FIVE2 + 0.2)) * 0.6;
      varOff = t < T_POINT ? 1 : t < T_FIVE2 ? 2 : t < 13.5 ? 3 : 0;
    } else if (t < T_SIDE) Z = 4.3 + 3.2 * ease.inCubic(seg(t, T_OTHER, T_SIDE));
    else { Z = 7.6 + (t - T_SIDE) * 0.9; flip = -1; varOff = 2; }
    const after = t >= T_SIDE;
    const r = G.shader('V04-droste', FRAG, { uT: R.tex, uS: SC, uZ: Z, uSpiral: spiral, uRot: rot, uFlip: 1, uVar: varOff, uLod: 0.3 });
    // flip (card turn) around the punch
    const fd = t - T_SIDE;
    let sx = 1;
    if (fd > -0.04 && fd < 0.1) { const k = ease.inOutCubic(clamp((fd + 0.04) / 0.14)); sx = Math.cos(k * Math.PI); }
    else if (after) sx = -1;
    ctx.fillStyle = Math.abs(sx) < 0.98 ? '#FFFBF4' : P1.ink; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(sx >= 0 ? Math.max(sx, 0.02) : Math.min(sx, -0.02), 1 + (1 - Math.abs(sx)) * 0.12);
    G.draw(ctx, r, -W / 2, -H / 2, W, H);
    if (Math.abs(sx) < 0.98) { ctx.fillStyle = `rgba(255,251,244,${(1 - Math.abs(sx)) * 0.6})`; ctx.fillRect(-W / 2, -H / 2, W, H); }
    ctx.restore();

    // ---------- OPUS 5.5 at the vanishing point ----------
    if (!after) {
      let str = 'OPUS';
      if (t >= T_FIVE) str += ' 5'; if (t >= T_POINT) str += '.'; if (t >= T_FIVE2) str += '5';
      const lastHit = t >= T_FIVE2 ? T_FIVE2 : t >= T_POINT ? T_POINT : t >= T_FIVE ? T_FIVE : 12.48;
      const pop = 1 + 0.25 * Math.exp(-(t - lastHit) * 12);
      const shrink = t >= T_OTHER ? 1 - ease.inCubic(seg(t, T_OTHER, T_SIDE)) * 0.92 : 1;
      const grow = ease.outBack(clamp(lt / 0.18), 2);
      const sz = (spiral ? 190 : 220) * pop * shrink * grow;
      ctx.save(); ctx.translate(W / 2, H / 2 + 6); ctx.rotate(spiral ? Math.sin(lt * 3) * 0.04 : 0);
      ctx.shadowColor = 'rgba(255,106,31,0.8)'; ctx.shadowBlur = 34 * shrink;
      printType(ctx, str, 0, 0, sz, { family: 'Anton', fill: '#FFF3E0', shadow: P1.orange, off: 0.035, stroke: P1.ink, strokeW: 14 * shrink, maxW: 1500 });
      ctx.restore();
      if (t > T_FIVE - 0.02) {
        const words = [['FIVE', T_FIVE], ['POINT', T_POINT], ['FIVE', T_FIVE2], ['ON THE', 13.5], ['OTHER', T_OTHER]];
        let wi = -1; for (let i = 0; i < words.length; i++) if (t >= words[i][1] - 0.02) wi = i;
        if (wi >= 0) {
          const d = t - words[wi][1], k = ease.outBack(clamp(d / 0.1), 2.5);
          ctx.save(); ctx.translate(W / 2 + (wi % 2 ? 470 : -470), wi % 2 ? 300 : 790); ctx.rotate(wi % 2 ? 0.07 : -0.07); ctx.scale(k, k);
          printType(ctx, words[wi][0], 0, 0, 120, { family: 'Anton', fill: P1.cream, shadow: P1.red, off: 0.06, stroke: P1.ink, strokeW: 12 });
          ctx.restore();
        }
      }
    }

    // ---------- punch through: shards + flash ----------
    if (fd > -0.02 && fd < 0.45) {
      const k = Math.max(0, fd);
      for (const sh of R.shards) {
        const dd = sh.d + sh.v * k, sc = 1 + k * 5;
        ctx.save(); ctx.translate(W / 2 + Math.cos(sh.a) * dd, H / 2 + Math.sin(sh.a) * dd); ctx.rotate(sh.spin * k); ctx.scale(sc, sc);
        ctx.globalAlpha = clamp(1 - k * 2.4);
        ctx.beginPath(); sh.pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath();
        ctx.fillStyle = 'rgba(220,240,255,0.55)'; ctx.fill(); ctx.lineWidth = 3 / sc; ctx.strokeStyle = '#FFFFFF'; ctx.stroke();
        ctx.restore();
      }
    }

    // ---------- the other side ----------
    if (after) {
      const d = t - T_SIDE;
      // glass sheen
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, 'rgba(255,255,255,0.0)'); g.addColorStop(0.45, 'rgba(255,255,255,0.0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.22)'); g.addColorStop(0.56, 'rgba(255,255,255,0.0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // CURSOR squashed against the glass
      const k = ease.outBack(clamp((d - 0.08) / 0.18), 1.6);
      if (k > 0) {
        const P = pose('wave', t); P.armL = [-185, -120 + Math.sin(d * 20) * 6]; P.armR = [185, -120 - Math.sin(d * 20) * 6];
        const my = lerp(1350, 1120, k);
        const an = drawMascot(ctx, { x: W / 2 + 40, y: my, s: 2.15, t, P, squash: -0.04 + 0.06 * wobble(d - 0.1, 3, 5), mouth: 'grin', eyes: 'happy', sticker: true });
        // gloves squashed flat on the glass + breath fog
        ctx.save(); ctx.globalAlpha = clamp((d - 0.12) * 8);
        for (const [hx, hy, dir] of [[...an.hands.l, -1], [...an.hands.r, 1]]) {
          ctx.fillStyle = '#FFFFFF'; ctx.strokeStyle = P1.ink; ctx.lineWidth = 9;
          for (let f = 0; f < 4; f++) { ctx.beginPath(); ctx.ellipse(hx - 54 + f * 36, hy - 70 + Math.abs(f - 1.5) * 10, 17, 40, (f - 1.5) * 0.18, 0, TAU); ctx.fill(); ctx.stroke(); }
          ctx.beginPath(); ctx.ellipse(hx + dir * 70, hy + 10, 18, 34, dir * 0.9, 0, TAU); ctx.fill(); ctx.stroke();
          ctx.beginPath(); ctx.ellipse(hx, hy, 72, 64, 0, 0, TAU); ctx.fill(); ctx.stroke();
          ctx.fillStyle = 'rgba(31,42,85,0.12)'; ctx.beginPath(); ctx.ellipse(hx, hy + 8, 44, 36, 0, 0, TAU); ctx.fill();
        }
        const fog = ctx.createRadialGradient(W / 2 + 40, my - 330, 10, W / 2 + 40, my - 330, 230);
        fog.addColorStop(0, 'rgba(255,255,255,0.55)'); fog.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = fog; ctx.beginPath(); ctx.arc(W / 2 + 40, my - 330, 230 * (0.8 + 0.2 * Math.sin(d * 12)), 0, TAU); ctx.fill();
        ctx.restore();
      }
      const tk = ease.outExpo(clamp((d - 0.02) / 0.2));
      ctx.save(); ctx.translate(W / 2, 250); ctx.scale(lerp(1.8, 1, tk), lerp(1.8, 1, tk)); ctx.globalAlpha = clamp(tk * 3);
      printType(ctx, 'THE OTHER SIDE', 0, 0, 190, { family: 'Anton', fill: P1.cream, shadow: P1.red, off: 0.05, stroke: P1.ink, strokeW: 16, maxW: 1500 });
      ctx.restore();
    }

    // ---------- fx ----------
    E.fx.bloom = after ? 0.15 : 0.3; E.fx.bloomThreshold = 0.8;
    E.fx.zoom += beat * 0.015;
    if (t >= T_FIVE && t < T_FIVE + 0.06) { E.fx.flash = [1, 0.6, 0.3, 0.5]; E.fx.rgb = 12; }
    if (t >= T_OTHER && t < T_SIDE) { E.fx.radialBlur = ease.inQuad(seg(t, T_OTHER, T_SIDE)) * 1.2; E.fx.rgb = 8 * seg(t, T_OTHER, T_SIDE); }
    if (fd >= 0 && fd < 0.12) { E.fx.flash = [1, 1, 1, 0.9 * (1 - fd / 0.12)]; E.fx.shake = 30; }
    else if (fd >= 0.12 && fd < 0.5) E.fx.shake = 12 * (1 - (fd - 0.12) / 0.38);
    E.fx.shake = Math.max(E.fx.shake, sn * 4);
  },
};

function seg(t, a, b) { return clamp((t - a) / (b - a)); }
