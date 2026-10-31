// V05 — "No After Effects," — a generic pro editor window (EDITOR PRO — $54.99/mo) gets a red NO
// stamp on "No", then melts: every pixel column slides down at its own speed (noise + gaussian drips
// with round tips) and a real pixel sort (per-column counting sort by luminance over a growing interval)
// streaks the colours as they run. Behind it, NO AFTER EFFECTS is printed on the paper.
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, rng, noise2, font, roundRect, buf, bctx } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { drawMascot } from '../../core/mascot.js';
import { P1, paper, printType, stamp, paperTex } from './util.js';

const S = shot('V05');
const T_NO = 14.52, T_AFTER = 14.75, T_EFF = 15.2;
const WX = 150, WY = 136, WW = W - 300, WH = 800;
const SW = 960, SH = 540; // melt resolution
let R = null;

function build() {
  const r = rng(21);
  const drips = []; for (let i = 0; i < 26; i++) drips.push({ x: r() * SW, w: 4 + r() * 14, a: 0.3 + r() * 1.1 });
  const colN = new Float32Array(SW), colSort = new Float32Array(SW);
  for (let x = 0; x < SW; x++) {
    let n = 0.5 + 0.5 * noise2(x * 0.011, 3.3) + 0.25 * noise2(x * 0.05, 8);
    for (const d of drips) n += d.a * Math.exp(-(((x - d.x) / d.w) ** 2));
    colN[x] = n; colSort[x] = 0.4 + 0.6 * (0.5 + 0.5 * noise2(x * 0.03, 1.7));
  }
  R = { colN, colSort, out: null, lum: new Uint8Array(SH), tmp: new Uint8ClampedArray(SH * 4), cnt: new Int32Array(256) };
}

function drawUI(x, t) {
  const lt = t - S.start;
  x.clearRect(0, 0, W, H);
  x.save();
  // window shadow + frame
  x.fillStyle = 'rgba(31,42,85,0.35)'; roundRect(x, WX + 18, WY + 22, WW, WH, 18); x.fill();
  x.fillStyle = '#20263F'; roundRect(x, WX, WY, WW, WH, 18); x.fill();
  // title bar
  x.fillStyle = '#2E3657'; roundRect(x, WX, WY, WW, 54, 18); x.fill(); x.fillRect(WX, WY + 30, WW, 24);
  [P1.red, P1.orange, '#7ED38B'].forEach((c, i) => { x.fillStyle = c; x.beginPath(); x.arc(WX + 32 + i * 30, WY + 27, 9, 0, TAU); x.fill(); });
  x.fillStyle = '#F4EDE0'; font(x, 24, 'Bricolage Grotesque', '800'); x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText('EDITOR PRO — $54.99/mo', WX + WW / 2, WY + 28);
  x.fillStyle = P1.orange; roundRect(x, WX + WW - 250, WY + 12, 220, 32, 8); x.fill();
  x.fillStyle = '#20263F'; font(x, 18, 'JetBrains Mono', '800'); x.fillText('TRIAL: 0 DAYS LEFT', WX + WW - 140, WY + 28);
  // menu
  x.fillStyle = 'rgba(244,237,224,0.6)'; font(x, 18, 'Bricolage Grotesque', '600'); x.textAlign = 'left';
  ['File', 'Edit', 'Composition', 'Layer', 'Effect', 'Animation', 'View', 'Window', 'Help'].forEach((m, i) => x.fillText(m, WX + 24 + i * 120, WY + 76));
  // project panel
  const top = WY + 96;
  x.fillStyle = '#272F4D'; x.fillRect(WX + 12, top, 300, 380);
  x.fillStyle = '#F4EDE0'; font(x, 17, 'JetBrains Mono', '800'); x.fillText('PROJECT', WX + 26, top + 22);
  const thumbs = [P1.orange, P1.red, '#6EC3F0', '#FFD23F', '#B79CFF', '#7CFFC4'];
  thumbs.forEach((c, i) => { const tx = WX + 26 + (i % 2) * 140, ty = top + 44 + Math.floor(i / 2) * 110; x.fillStyle = c; roundRect(x, tx, ty, 128, 72, 6); x.fill(); x.fillStyle = 'rgba(244,237,224,0.55)'; font(x, 13, 'JetBrains Mono', '700'); x.fillText(`comp_0${i + 1}.mov`, tx, ty + 90); });
  // viewer
  const vx = WX + 324, vw = 900, vh = 380;
  x.fillStyle = '#11152A'; x.fillRect(vx, top, vw, vh);
  const g = x.createLinearGradient(vx, top, vx, top + vh); g.addColorStop(0, '#6EC3F0'); g.addColorStop(1, '#2E8BE0');
  x.fillStyle = g; x.fillRect(vx + 120, top + 20, vw - 240, vh - 40);
  x.fillStyle = '#E9DFCC'; x.fillRect(vx + 120, top + vh - 90, vw - 240, 70);
  x.save(); x.beginPath(); x.rect(vx + 120, top + 20, vw - 240, vh - 40); x.clip();
  drawMascot(x, { x: vx + vw / 2 + Math.sin(lt * 5) * 180, y: top + vh - 40, s: 0.85, t, pose: 'dance', mouth: 'smile' });
  x.restore();
  x.fillStyle = 'rgba(255,255,255,0.9)'; font(x, 15, 'JetBrains Mono', '700'); x.fillText('FINAL_v27_REAL_final2.mov', vx + 130, top + 40);
  x.fillStyle = 'rgba(255,255,255,0.8)'; font(x, 15, 'JetBrains Mono', '700'); x.fillText('Full ▾   50% ▾   0;00;14;15   ▶', vx + 10, top + vh - 10);
  // effects panel
  const ex = vx + vw + 12, ew = WX + WW - 12 - ex;
  x.fillStyle = '#272F4D'; x.fillRect(ex, top, ew, 380);
  x.fillStyle = '#F4EDE0'; font(x, 17, 'JetBrains Mono', '800'); x.fillText('EFFECTS & PRESETS', ex + 14, top + 22);
  ['▸ Glow Ultra', '▸ Wiggle Pro', '▸ Shake 3000', '▸ Motion Blur+', '▸ Puppet Thing', '▸ Lens Flare XL', '▸ Plugin ($199)', '▸ Plugin ($299)'].forEach((e, i) => {
    x.fillStyle = i === 6 || i === 7 ? P1.orange : 'rgba(244,237,224,0.75)'; font(x, 17, 'Bricolage Grotesque', '600'); x.fillText(e, ex + 18, top + 62 + i * 38);
  });
  // timeline
  const tl = top + 392, th = WY + WH - 12 - tl;
  x.fillStyle = '#1A2038'; x.fillRect(WX + 12, tl, WW - 24, th);
  const layers = ['CURSOR.png', 'Shape Layer 7', 'Null 3', 'Adjustment 2', 'Text: ONE PROMPT', 'Camera 1', 'Light 4'];
  const clipC = [P1.orange, P1.red, '#6EC3F0', '#B79CFF', '#FFD23F', '#7CFFC4', '#F4EDE0'];
  layers.forEach((L, i) => {
    const ly = tl + 34 + i * 40;
    x.fillStyle = i % 2 ? '#20274A' : '#1D2342'; x.fillRect(WX + 12, ly - 16, WW - 24, 40);
    x.fillStyle = 'rgba(244,237,224,0.8)'; font(x, 15, 'JetBrains Mono', '700'); x.fillText(`${i + 1}  ${L}`, WX + 28, ly + 6);
    const cx0 = WX + 330 + ((i * 97) % 300), cw = 380 + ((i * 131) % 500);
    x.fillStyle = clipC[i]; roundRect(x, cx0, ly - 10, cw, 28, 6); x.fill();
    x.fillStyle = '#F4EDE0'; for (let k = 0; k < 4; k++) { const kx = cx0 + 30 + k * cw / 4; x.save(); x.translate(kx, ly + 4); x.rotate(Math.PI / 4); x.fillRect(-6, -6, 12, 12); x.restore(); }
  });
  const ph = WX + 360 + ((lt * 900) % (WW - 400));
  x.fillStyle = P1.red; x.fillRect(ph, tl, 4, th); x.beginPath(); x.moveTo(ph - 10, tl); x.lineTo(ph + 14, tl); x.lineTo(ph + 2, tl + 14); x.fill();
  // render bar
  x.fillStyle = '#11152A'; roundRect(x, WX + WW - 520, WY + WH - 56, 480, 34, 8); x.fill();
  x.fillStyle = P1.orange; roundRect(x, WX + WW - 516, WY + WH - 52, 480 * 0.03, 26, 6); x.fill();
  x.fillStyle = '#F4EDE0'; font(x, 15, 'JetBrains Mono', '700'); x.fillText('RENDERING… 3%  ETA 14h 22m', WX + WW - 500, WY + WH - 33);
  x.restore();
  // NO stamp lands ON the window (so it melts with it)
  if (t >= T_NO) {
    const k = clamp((t - T_NO) / 0.06);
    stamp(x, 'NO', W / 2 - 140, 560, 360, -0.14, P1.red, k, { multiply: false, alpha: 0.97 });
  }
}

function melt(src, dst, t) {
  const m = clamp((t - T_AFTER) / (S.end - T_AFTER + 0.12));
  const D = (m < 0.45 ? 0.16 * ease.inQuad(m / 0.45) : 0.16 + 1.6 * ease.inQuad((m - 0.45) / 0.55)) * SH; // speeds up on "Effects"
  const sortGrow = ease.inOutQuad(clamp((t - T_AFTER + 0.05) / 0.75));
  const wTop = Math.floor(WY / 2), wBot = Math.floor((WY + WH) / 2) + 14;
  const { colN, colSort, lum, tmp, cnt } = R;
  const d32 = new Uint32Array(dst.buffer), s32 = new Uint32Array(src.buffer);
  d32.fill(0);
  for (let x = 0; x < SW; x++) {
    const dx = Math.floor(D * colN[x]);
    // shift column down by dx (leaving transparent above)
    for (let y = SH - 1; y >= 0; y--) { const sy = y - dx; d32[y * SW + x] = sy >= 0 ? s32[sy * SW + x] : 0; }
    // pixel sort an interval of the dripped column by luminance (counting sort, bright → bottom)
    const a = clamp(wTop + dx, 0, SH - 1) | 0;
    const L = Math.floor((wBot - wTop) * sortGrow * colSort[x] * (0.6 + 0.6 * colN[x]));
    const b = Math.min(SH, a + L);
    if (b - a < 3) continue;
    cnt.fill(0);
    let n = 0;
    for (let y = a; y < b; y++) {
      const p = d32[y * SW + x]; if (!(p >>> 24)) { lum[y - a] = 0; continue; }
      const l = ((p & 255) * 54 + ((p >> 8) & 255) * 183 + ((p >> 16) & 255) * 19) >> 8; lum[y - a] = l; cnt[l]++; n++;
    }
    for (let i = 1; i < 256; i++) cnt[i] += cnt[i - 1];
    const t32 = new Uint32Array(tmp.buffer);
    for (let y = b - 1; y >= a; y--) { const p = d32[y * SW + x]; if (!(p >>> 24)) continue; const l = lum[y - a]; t32[--cnt[l]] = p; }
    // write back sorted run (dark at top → bright at the drip tips) only over opaque pixels
    let k = 0;
    for (let y = a; y < b; y++) { if (!(d32[y * SW + x] >>> 24)) continue; d32[y * SW + x] = t32[k++]; }
  }
}

export default {
  ...S,
  cutIn: 'punch',
  sfx: [{ t: 14.52, type: 'stamp', gain: 1 }, { t: 14.76, type: 'glitch', gain: 0.6 }, { t: 15.2, type: 'swoosh', gain: 0.7 }],
  init() { paperTex(P1.paper, W, H, 8); build(); const ui = buf('V05-ui', W, H); drawUI(bctx(ui), T_NO + 0.1); },
  draw(ctx, t, s, E) {
    if (!R) build();
    const lt = s.lt;
    paper(ctx, P1.paper, 0, 0, 8);
    // big type printed on the paper behind the window
    const rv = ease.outExpo(clamp((t - T_AFTER) / 0.3));
    ctx.save(); ctx.translate(W / 2, 330); ctx.rotate(-0.025);
    printType(ctx, 'NO', -560, 0, 300, { fill: P1.red, shadow: P1.ink, off: 0.04 });
    printType(ctx, 'AFTER', 150, 0, 300, { fill: P1.ink, shadow: P1.red, off: 0.04 });
    ctx.restore();
    ctx.save(); ctx.translate(W / 2, 640); ctx.rotate(0.02);
    printType(ctx, 'EFFECTS', 0, 0, 320, { fill: P1.ink, shadow: P1.orange, off: 0.04, maxW: 1500 });
    ctx.restore();

    const ui = buf('V05-ui', W, H), ux = bctx(ui);
    drawUI(ux, t);
    // window jolts on the stamp
    const jolt = t >= T_NO ? Math.exp(-(t - T_NO) * 14) : 0;
    if (t < T_AFTER) {
      ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(1 + jolt * 0.03, 1 + jolt * 0.03); ctx.translate(-W / 2, -H / 2);
      ctx.drawImage(ui, 0, 0); ctx.restore();
    } else {
      const sm = buf('read-V05-small', SW, SH), sx = bctx(sm);
      sx.clearRect(0, 0, SW, SH); sx.imageSmoothingEnabled = true; sx.drawImage(ui, 0, 0, SW, SH);
      const img = sx.getImageData(0, 0, SW, SH);
      if (!R.out) R.out = sx.createImageData(SW, SH);
      melt(img.data, R.out.data, t);
      sx.putImageData(R.out, 0, 0);
      ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(sm, 0, 0, W, H); ctx.restore();
    }

    // little mouse pointer reaching for "Effect" menu… then giving up
    if (t < T_AFTER + 0.1) {
      const px = lerp(1300, WX + 24 + 4 * 120 + 30, ease.outCubic(clamp(lt / 0.2))), py = lerp(700, WY + 80, ease.outCubic(clamp(lt / 0.2)));
      ctx.save(); ctx.translate(px, py); ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 42); ctx.lineTo(11, 32); ctx.lineTo(19, 50); ctx.lineTo(26, 46); ctx.lineTo(18, 29); ctx.lineTo(32, 29); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    }

    // fx
    E.fx.shake = jolt * 22;
    if (t >= T_NO && t < T_NO + 0.05) { E.fx.rgb = 10; E.fx.zoom += 0.03; }
    if (t >= T_AFTER && t < T_AFTER + 0.07) { E.fx.glitch = 0.6; E.fx.glitchSeed = E.frame; }
    if (t >= T_EFF && t < T_EFF + 0.08) { E.fx.rgb = 8; E.fx.shake = 10; }
  },
};
