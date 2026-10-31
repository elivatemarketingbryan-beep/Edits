// V12 · "give the pixels a voice" — CURSOR rebuilt as a 64×36 LED wall. Every LED's colour is sampled from a
// live 4×-supersampled render; the mouth is lip-synced from the vocal analysis (A.mouth), and the dark LEDs
// around the face ripple with the REAL vocal spectrum (ring distance → band, and → delay into the past).
// Camera: wide shot of the wall → snap macro onto the singing LEDs on "pixels" → pull back, VOICE in LEDs.
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, hash, buf, bctx, font } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { drawMascot } from '../../core/mascot.js';
import { shadowText } from './_g2.js';

const S = shot('V12');
const C = 64, R = 36, P = 30;                 // LED grid, pitch (world px)
const SS = 4;                                  // supersampling of the source render
const T_PIX = 23.40, T_VOICE = 23.96;

const BANDCOL = (b) => (b < 9 ? [232, 52, 63] : b < 20 ? [255, 106, 31] : [255, 226, 180]);

function source(t) {
  const big = buf('V12-big', C * SS, R * SS), bx = bctx(big);
  bx.setTransform(1, 0, 0, 1, 0, 0); bx.clearRect(0, 0, big.width, big.height);
  // face layout: full wall until VOICE, then it shrinks up to make room for the LED type
  const vk = ease.inOutCubic(clamp((t - (T_VOICE - 0.1)) / 0.22));
  const s = lerp(0.58, 0.36, vk), cx = C * SS / 2, gy = lerp(R * SS + 52, 112, vk);
  const an = drawMascot(bx, { x: cx, y: gy, s, t, pose: 'sing', mouth: 'auto', eyes: 'normal', glyph: true });
  // VOICE in pixel type (types on letter by letter)
  if (t > T_VOICE - 0.04) {
    const word = 'VOICE';
    bx.fillStyle = '#FFE8C8'; font(bx, 13 * SS, 'Press Start 2P'); bx.textAlign = 'left'; bx.textBaseline = 'alphabetic';
    const tw = bx.measureText(word).width, x0 = (C * SS - tw) / 2;
    let x = x0;
    for (let i = 0; i < word.length; i++) {
      const ch = word[i], w = bx.measureText(ch).width;
      if (t > T_VOICE + i * 0.045) { bx.fillStyle = i % 2 ? '#FF6A1F' : '#FFE8C8'; bx.fillText(ch, x, R * SS - 2 * SS); }
      x += w;
    }
  }
  const small = buf('read-V12-src', C, R), sx = bctx(small);
  sx.clearRect(0, 0, C, R); sx.imageSmoothingEnabled = true; sx.imageSmoothingQuality = 'high';
  sx.drawImage(big, 0, 0, C, R);
  return { data: sx.getImageData(0, 0, C, R).data, mouth: [an.mouth[0] / SS, an.mouth[1] / SS] };
}

export default {
  ...S,
  cutIn: 'black',
  sfx: [{ t: 23.05, type: 'zap', gain: 0.6 }, { t: T_PIX, type: 'whoosh', gain: 0.7 }, { t: T_VOICE, type: 'glitch', gain: 0.6 }],
  draw(ctx, t, s, E) {
    const lt = s.lt;
    const src = source(t);
    // ---- camera: wide → macro on the mouth ("pixels") → back out ("voice") ----
    const mx = src.mouth[0] * P, my = src.mouth[1] * P;
    const zin = ease.outExpo(clamp((t - T_PIX) / 0.22)), zout = ease.inOutCubic(clamp((t - (T_VOICE - 0.16)) / 0.24));
    const z = lerp(lerp(0.8 + lt * 0.08, 2.7, zin), 0.97, zout);
    const fcx = lerp(lerp(C * P / 2, mx + 60, zin), C * P / 2, zout), fcy = lerp(lerp(R * P / 2 + 20, my - 10, zin), R * P / 2 + 6, zout);
    const rot = lerp(lerp(-0.035, 0.06, zin), -0.01, zout);

    // ---- room ----
    ctx.fillStyle = '#07080F'; ctx.fillRect(0, 0, W, H);
    const rg = ctx.createRadialGradient(W / 2, H * 0.45, 100, W / 2, H * 0.45, 1200); rg.addColorStop(0, 'rgba(60,40,90,0.35)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.translate(W / 2, H / 2); ctx.rotate(rot); ctx.scale(z, z); ctx.translate(-fcx, -fcy);
    // bezel
    ctx.fillStyle = '#16151E'; ctx.fillRect(-26, -26, C * P + 52, R * P + 52);
    ctx.strokeStyle = '#2B2A38'; ctx.lineWidth = 6; ctx.strokeRect(-26, -26, C * P + 52, R * P + 52);
    ctx.fillStyle = '#0B0A10'; ctx.fillRect(0, 0, C * P, R * P);

    // visible LED range
    const inv = ctx.getTransform().inverse();
    let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
    for (const [qx, qy] of [[0, 0], [W, 0], [0, H], [W, H]]) { const p = inv.transformPoint(new DOMPoint(qx, qy)); minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y); }
    const i0 = clamp(Math.floor(minX / P) - 1, 0, C - 1), i1 = clamp(Math.ceil(maxX / P) + 1, 0, C - 1);
    const j0 = clamp(Math.floor(minY / P) - 1, 0, R - 1), j1 = clamp(Math.ceil(maxY / P) + 1, 0, R - 1);

    // per-LED colour = face over spectrum ripples, gated by the power-on wavefront
    const glow = buf('read-V12-glow', C, R), gx = bctx(glow);
    const gid = gx.createImageData(C, R), gd = gid.data;
    const d = src.data, M = src.mouth;
    const pw = (t - 23.04) / 0.26;                      // power-on wave (0 → 1 radius fraction)
    const beat = Math.exp(-A.since('beat', t) / 0.15);
    const cols = new Array(C * R);
    for (let j = 0; j < R; j++) for (let i = 0; i < C; i++) {
      const k = j * C + i, q = k * 4;
      const dx = i + 0.5 - M[0], dy = (j + 0.5 - M[1]) * 1.0, dd = Math.hypot(dx, dy);
      const band = clamp(Math.floor(dd * 0.72), 0, 31);
      const v = A.vspec(t - dd * 0.028, band);
      const ring = 0.5 + 0.5 * Math.cos(dd * 1.05 - t * 17);
      let I = clamp(Math.pow(v, 1.4) * 1.9 * (0.3 + 0.7 * ring) + beat * 0.12 * clamp(1 - dd / 40));
      const bc = BANDCOL(band);
      let r = bc[0] * I, g = bc[1] * I, b = bc[2] * I;
      const a = d[q + 3] / 255;
      if (a > 0) { const ia = 1 - a; r = r * ia + d[q] * a; g = g * ia + d[q + 1] * a; b = b * ia + d[q + 2] * a; }
      // power-on: LEDs light from the centre out with a hot white wavefront
      const rr = Math.hypot((i - C / 2) / (C / 2), (j - R / 2) / (C / 2));
      const on = clamp((pw * 1.25 - rr) * 6), front = Math.exp(-Math.abs(pw * 1.25 - rr) * 10) * (pw < 1.3 ? 1 : 0);
      r = r * on + 255 * front * 0.8; g = g * on + 240 * front * 0.8; b = b * on + 220 * front * 0.8;
      cols[k] = [r, g, b];
      gd[q] = r; gd[q + 1] = g; gd[q + 2] = b; gd[q + 3] = 255;
    }
    gx.putImageData(gid, 0, 0);

    // sockets (one path)
    ctx.fillStyle = '#1B1824'; ctx.beginPath();
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const x = i * P + P / 2, y = j * P + P / 2; ctx.moveTo(x + 13.5, y); ctx.arc(x, y, 13.5, 0, TAU); }
    ctx.fill();
    // lit LEDs (quantised colour buckets to keep fills cheap)
    const buckets = new Map();
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const c = cols[j * C + i]; const L = Math.max(c[0], c[1], c[2]); if (L < 10) continue;
      const boost = 1.0;
      const key = ((Math.min(255, c[0] * boost) >> 3) << 10) | ((Math.min(255, c[1] * boost) >> 3) << 5) | (Math.min(255, c[2] * boost) >> 3);
      let arr = buckets.get(key); if (!arr) buckets.set(key, (arr = [])); arr.push(i, j);
    }
    for (const [key, arr] of buckets) {
      const r = ((key >> 10) & 31) << 3, g = ((key >> 5) & 31) << 3, b = (key & 31) << 3;
      ctx.fillStyle = `rgb(${r},${g},${b})`; ctx.beginPath();
      for (let n = 0; n < arr.length; n += 2) { const x = arr[n] * P + P / 2, y = arr[n + 1] * P + P / 2; ctx.moveTo(x + 11.5, y); ctx.arc(x, y, 11.5, 0, TAU); }
      ctx.fill();
    }
    // dome highlights
    ctx.fillStyle = 'rgba(255,255,255,0.16)'; ctx.beginPath();
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const x = i * P + P / 2 - 4, y = j * P + P / 2 - 4.5; ctx.moveTo(x + 4, y); ctx.ellipse(x, y, 4.2, 3, -0.6, 0, TAU); }
    ctx.fill();
    // bloom: the LED colours, upscaled + blurred, added on top
    const gb = buf('V12-gb', 256, 144), gbx = bctx(gb);
    gbx.clearRect(0, 0, 256, 144); gbx.filter = 'blur(3px)'; gbx.imageSmoothingEnabled = true; gbx.drawImage(glow, 0, 0, 256, 144); gbx.filter = 'none';
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.32; ctx.drawImage(gb, -P, -P, C * P + 2 * P, R * P + 2 * P); ctx.globalAlpha = 0.18; ctx.drawImage(gb, 0, 0, C * P, R * P); ctx.restore();
    // floor reflection (only visible in the wide shot)
    ctx.save(); ctx.translate(0, R * P * 2 + 80); ctx.scale(1, -1); ctx.globalAlpha = 0.18; ctx.drawImage(gb, 0, 0, C * P, R * P); ctx.restore();
    ctx.restore();

    // ---- screen-space type ----
    const pk = t >= T_PIX ? t - T_PIX : -1;
    if (pk >= 0 && t < T_VOICE - 0.06) {
      const k = ease.outBack(pk / 0.2, 2.4), jit = Math.floor(t * 30) % 2;
      ctx.save(); ctx.translate(140, 250); ctx.scale(k, k);
      shadowText(ctx, 'PIXELS', 0, 0, { size: 112, family: 'Press Start 2P', align: 'left', fill: '#FFF6E8', shadow: '#E8343F', off: 12 + jit * 3, stroke: '#0B0A10', lw: 18 });
      ctx.restore();
      font(ctx, 26, 'JetBrains Mono', '800'); ctx.textAlign = 'left'; ctx.fillStyle = '#0B0A10'; ctx.fillRect(140, 340, 640, 42); ctx.fillStyle = '#FFE8C8';
      ctx.fillText(`${C}×${R} = ${C * R} LEDs · lip-sync: vocal stem`, 152, 362);
    }
    if (t < T_PIX) {
      font(ctx, 24, 'JetBrains Mono', '800'); ctx.fillStyle = 'rgba(255,232,200,0.7)'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText('LED WALL · 2304 PX · 60 CD/M² · ON', 140, 168);
    }

    // ---- fx ----
    E.fx.bloom = 0.3 + beat * 0.25; E.fx.bloomThreshold = 0.8;
    E.fx.vignette = 0.45;
    if (pk >= 0 && pk < 0.12) { E.fx.rgb = 10 * (1 - pk / 0.12); E.fx.radialBlur = 0.6 * (1 - pk / 0.12); }
    const vk = t - T_VOICE; if (vk >= 0 && vk < 0.15) { E.fx.glitch = 0.5 * (1 - vk / 0.15); E.fx.glitchSeed = E.frame; E.fx.shake = 8 * (1 - vk / 0.15); }
  },
};
