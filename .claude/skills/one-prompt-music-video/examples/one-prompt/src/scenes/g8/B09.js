// B09 — "(build)" — VHS rewind of the whole video.
// Every frame asks the engine to render THIS video at a tape time running backwards from 2:02 to 0:00 on an
// accelerating curve (E.thumb → a real render of that earlier scene), then a VHS decoder shader in the shared
// WebGL2 context: YIQ chroma bleed + offset, per-line jitter, rolling tracking-noise bands with white streaks,
// head-switching tear, tape noise and scanlines. VCR on-screen display on top; snaps to white for the drop.
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, seg, buf, bctx, font, hash } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { G } from '../../core/gl.js';

const S = shot('B09');
const T0 = S.start, REW = 2.22, END = S.end, WHITE = END - 0.1;
const TW = 480, TH = 270;

/** tape time shown at local time lt: 122 s → 0 s, exponential acceleration */
function tapeTime(lt) {
  const k = 2.3, x = clamp(lt / REW);
  const T = 122 * (1 - (Math.exp(k * x) - 1) / (Math.exp(k) - 1));
  return Math.max(0, Math.round(T * 30) / 30);
}
const fmt = (T) => { const s = Math.floor(T); return `${Math.floor(s / 3600)}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };

const VHS = `
uniform sampler2D tSrc; uniform float uTime, uBand1, uBand2, uBandW, uNoise, uJit, uSat, uRoll;
float h1(float n){ return fract(sin(n * 127.1) * 43758.5453); }
float h2(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
vec3 toYIQ(vec3 c){ return vec3(dot(c, vec3(.299, .587, .114)), dot(c, vec3(.596, -.274, -.322)), dot(c, vec3(.211, -.523, .312))); }
vec3 toRGB(vec3 y){ return vec3(y.x + .956 * y.y + .621 * y.z, y.x - .272 * y.y - .647 * y.z, y.x - 1.106 * y.y + 1.703 * y.z); }
void main(){
  vec2 p = uv;
  float ty = fract(1.0 - p.y + uRoll);             // 0 = top of picture
  float line = floor(ty * 270.0);
  float fr = floor(uTime * 30.0);
  float jit = (h1(line + fr * 13.0) - 0.5) * uJit * 0.006;
  float b1 = exp(-pow((ty - uBand1) / uBandW, 2.0)), b2 = exp(-pow((ty - uBand2) / (uBandW * 1.6), 2.0));
  float band = max(b1, b2);
  jit += band * (h1(line * 3.1 + fr * 7.0) - 0.35) * 0.09;
  float hs = smoothstep(0.93, 1.0, ty); jit += hs * (0.02 + 0.03 * h1(line + fr));
  vec2 q = vec2(p.x + jit, 1.0 - ty);
  vec3 c0 = texture(tSrc, q).rgb;
  float Y = toYIQ(c0).x;
  // sharpen luma a touch
  float Yl = toYIQ(texture(tSrc, q - vec2(0.0025, 0.0)).rgb).x, Yr = toYIQ(texture(tSrc, q + vec2(0.0025, 0.0)).rgb).x;
  Y = Y + (2.0 * Y - Yl - Yr) * 0.35;
  vec2 iq = vec2(0.0);
  for (int k = -5; k <= 5; k++) iq += toYIQ(texture(tSrc, q + vec2(float(k) * 0.0042 + 0.007, 0.0)).rgb).yz;
  iq /= 11.0;
  vec3 c = toRGB(vec3(Y, iq * uSat));
  c = mix(c, c * vec3(1.05, 0.98, 1.08), 0.5);
  float n = h2(vec2(floor(gl_FragCoord.x * 0.5) + fr * 11.0, line + fr * 37.0));
  c += (n - 0.5) * uNoise;
  float sw = 4.0 + h1(line) * 40.0;
  float streak = step(0.9 - band * 0.35, h2(vec2(floor(gl_FragCoord.x / sw), line + fr)));
  c = mix(c, vec3(0.95, 0.95, 1.0), streak * band * 0.9);
  c = mix(c, vec3(h2(vec2(gl_FragCoord.x, fr))), hs * 0.35);
  c *= 0.86 + 0.14 * sin(gl_FragCoord.y * 3.14159 * 0.5);
  o = vec4(clamp(c, 0.0, 1.0), 1.0);
}`;

export default {
  ...S,
  hud: 'paper',
  cutIn: 'glitch',
  async init() { G.program('B09-vhs', VHS); },
  sfx: [{ t: T0, type: 'glitch', gain: 0.7 }, { t: T0 + 0.05, type: 'riser', gain: 0.9 }, { t: WHITE, type: 'impact', gain: 1 }],
  draw(ctx, t, s, E) {
    const lt = t - T0;
    const T = tapeTime(lt);
    // fetch the frame of this very video (re-enters the engine) BEFORE drawing anything
    const th = s.thumb ? null : E.thumb(T, TW, TH);
    const build = seg(lt, 0, REW);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (t >= WHITE) { ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, W, H); E.fx.grain = 0.02; E.fx.vignette = 0; return; }

    // source picture: the frame + a horizontal ghost (tape smear)
    const src = buf('B09-src', TW, TH), sx = bctx(src);
    sx.setTransform(1, 0, 0, 1, 0, 0); sx.globalAlpha = 1; sx.globalCompositeOperation = 'source-over';
    sx.fillStyle = '#05050A'; sx.fillRect(0, 0, TW, TH);
    if (th) {
      // in the last stretch the picture splits into tape-track slices
      const slices = lt > 1.55 ? 3 : 1;
      for (let k = 0; k < slices; k++) {
        const y0 = (k / slices) * TH, y1 = ((k + 1) / slices) * TH, off = k === 0 ? 0 : (hash(k, E.frame) - 0.5) * 30;
        sx.drawImage(th, 0, y0, TW, y1 - y0, off, y0, TW, y1 - y0);
      }
      sx.globalAlpha = 0.35; sx.globalCompositeOperation = 'lighter'; sx.drawImage(th, 6 + 10 * build, 0, TW, TH); sx.globalCompositeOperation = 'source-over'; sx.globalAlpha = 1;
    }
    const tex = G.canvasTex('B09-src', src);
    const fr = E.frame;
    const b1 = (0.15 + lt * 0.9 + 0.2 * Math.sin(lt * 3)) % 1.1, b2 = (0.62 - lt * 0.55 + 1.1) % 1.1;
    const r = G.shader('B09-vhs', VHS, {
      tSrc: tex, uTime: t, uBand1: b1, uBand2: b2, uBandW: 0.025 + 0.03 * build, uNoise: 0.08 + 0.12 * build, uJit: 1 + 3 * build, uSat: 1.25 - 0.2 * build,
      uRoll: lt > 1.9 ? (lt - 1.9) * 2.3 : 0,
    }, 960, 540);
    // small CRT overscan + shake
    const shake = (hash(fr, 5) - 0.5) * 10 * build;
    G.draw(ctx, r, -24, -14 + shake, W + 48, H + 28);

    // ---- VCR on-screen display ----
    const blink = Math.floor(t * 4) % 2 === 0;
    const OSD = (str, x, y, size, align = 'left') => {
      font(ctx, size, 'Press Start 2P'); ctx.textAlign = align; ctx.textBaseline = 'top';
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillText(str, x + 5, y + 5);
      ctx.fillStyle = 'rgba(80,255,255,0.5)'; ctx.fillText(str, x - 3, y);
      ctx.fillStyle = '#FFFFFF'; ctx.fillText(str, x, y);
    };
    const done = lt >= REW;
    if (!done) {
      if (blink || lt < 0.3) OSD('◀◀', 150, 170, 72);
      OSD('REWIND', 330, 178, 56);
      OSD(`×${Math.round(lerp(15, 130, ease.inQuad(build)))}`, 330, 258, 30);
    } else {
      OSD(lt < REW + 0.06 ? '■ STOP' : '▶ PLAY', 150, 178, 56);
    }
    OSD('SP', 1770, 178, 44, 'right');
    OSD(fmt(T), 1770, 840, 56, 'right');
    // tape counter bar (progress through the tape)
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillRect(1290, 920, 480 * (T / 122), 10);
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 3; ctx.strokeRect(1290, 920, 480, 10);

    E.fx.scanlines = 0.12; E.fx.warp = 0.12; E.fx.vignette = 0.55; E.fx.rgb = 2 + 6 * build; E.fx.grain = 0.07 + 0.05 * build;
    E.fx.saturation = 1.05;
    if (lt > REW - 0.12) { E.fx.glitch = 0.35; E.fx.glitchSeed = fr; }
    const pre = seg(t, WHITE - 0.1, WHITE); if (pre > 0) E.fx.flash = [1, 1, 1, pre * pre];
  },
};
