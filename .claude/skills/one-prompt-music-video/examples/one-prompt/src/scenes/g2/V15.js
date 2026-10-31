// V15 · "let it sing" — Joy-Division ridgelines built from the REAL vocal-stem spectrum history: every ridge is
// A.vspec at a past moment (32 bands mirrored around the centre, low → middle), rows flow toward the camera,
// painter-occluded like the record sleeve. CURSOR surfs the live ridge and sings; SING rises behind the range;
// on the riser everything pushes brighter into white for the cut to the sky.
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, hash, noise2, mixHex, font } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { drawMascot } from '../../core/mascot.js';
import { PS, shadowText } from './_g2.js';

const S = shot('V15');
const NL = 50, DT = 1 / 40, NX = 150;
const T_SING = 28.52, T_RISE = 29.14, T_END = 29.92;
const ZC = 0.8;                                    // CURSOR's depth on the range

function vsp(tau, b) { // linearly interpolated vocal spectrum
  const f = tau * 30, i = Math.floor(f), u = f - i;
  return lerp(A.vspec(i / 30, b), A.vspec((i + 1) / 30, b), u);
}
const prof = new Float32Array(NX + 1);
function profile(tau, out, boost = 1) {
  const v = []; for (let b = 0; b < 32; b++) v.push(vsp(tau, b));
  for (let k = 0; k <= NX; k++) {
    const x = (k / NX) * 2 - 1, ax = Math.abs(x);
    let s = 0;
    for (let b = 2; b < 30; b++) { const c = 0.02 + (b - 2) / 28 * 0.5, d = (ax - c) / 0.075; s += v[b] * Math.exp(-d * d); }
    const env = Math.exp(-Math.pow(x / 0.56, 4));
    const jag = 1 + 0.22 * noise2(x * 30, tau * 9);
    out[k] = Math.pow(clamp(s / 3.6), 1.5) * env * jag * boost;
  }
  return out;
}
const geo = (z) => ({ y: lerp(352, 1010, Math.pow(z, 1.2)), hw: lerp(520, 1350, z), amp: lerp(70, 230, z), lw: lerp(1.6, 4.4, z) });

export default {
  ...S,
  hud: 'paper',
  cutIn: 'flash',
  sfx: [{ t: T_SING, type: 'bell', gain: 0.6 }, { t: T_RISE, type: 'riser', gain: 0.9 }],
  draw(ctx, t, s, E) {
    const lt = s.lt;
    const rise = ease.inQuad(clamp((t - T_RISE) / (T_END - T_RISE)));
    const beat = Math.exp(-A.since('beat', t) / 0.14);
    // palette ramps toward white on the riser
    const bg = mixHex('#121A42', '#8FA6E8', rise * 0.85), lineCol = mixHex('#FFF4E2', '#FFFFFF', rise);
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    const halo = ctx.createRadialGradient(W / 2, 360, 40, W / 2, 360, 900);
    halo.addColorStop(0, `rgba(255,170,110,${0.18 + rise * 0.5})`); halo.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = halo; ctx.fillRect(0, 0, W, H);

    // camera: gentle crane up during the riser
    ctx.save();
    const camY = rise * -120, zoom = 1 + lt * 0.025 + rise * 0.12 + beat * 0.012;
    ctx.translate(W / 2, H / 2); ctx.scale(zoom, zoom); ctx.rotate(Math.sin(lt * 0.8) * 0.01); ctx.translate(-W / 2, -H / 2 - camY);

    // SING behind the range (moon-like)
    const sk = t >= T_SING ? ease.outExpo((t - T_SING) / 0.35) : 0;
    if (t > T_SING - 0.02) {
      ctx.save(); ctx.translate(W / 2, 270 - sk * 30); const sc = lerp(0.6, 1, sk) * (1 + beat * 0.03); ctx.scale(sc, sc);
      ctx.globalAlpha = clamp(sk * 1.5);
      font(ctx, 360, 'Instrument Serif', '400', 'italic'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = PS.orange; ctx.fillText('sing', 10, 12);
      ctx.fillStyle = mixHex('#FFF4E2', '#FFFFFF', rise); ctx.fillText('sing', 0, 0);
      ctx.restore();
    } else {
      // "let it" — small caps above the range
      const k = ease.outBack(clamp(lt / 0.25), 2);
      ctx.save(); ctx.translate(W / 2, 236); ctx.scale(k, k);
      font(ctx, 120, 'Anton'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.letterSpacing = '18px';
      ctx.fillStyle = PS.orange; ctx.fillText(t > 28.38 ? 'LET IT' : 'LET', 0, 0); ctx.letterSpacing = '0px';
      ctx.restore();
    }

    // ridgelines: oldest (front) drawn last
    const jNow = Math.floor(t / DT);
    const rows = [];
    for (let n = NL; n >= 0; n--) {
      const j = jNow - n, tau = j * DT, z = (t - tau) / (NL * DT);
      if (z < 0 || z > 1) continue;
      rows.push({ tau, z });
    }
    rows.sort((a, b) => a.z - b.z);
    let mascotDone = false;
    const drawMascotNow = () => {
      // CURSOR rides the ridge at x = 0, depth ZC (smoothed height)
      const g = geo(ZC); let hsum = 0;
      for (let k = -2; k <= 2; k++) { const tau = t - ZC * NL * DT + k * DT; profile(tau, prof, 1 + rise * 0.6); hsum += prof[NX / 2]; }
      const yy = g.y - g.amp * hsum / 5;
      ctx.save();
      const notes = ['♪', '♫', '♪', '♬'];
      for (let i = 0; i < 6; i++) { // notes float up from the mouth
        const ph = ((t * 1.3 + i / 6) % 1), nx = W / 2 + 40 + Math.sin(i * 2.1 + ph * 5) * 60 + ph * 120, ny = yy - 280 - ph * 300;
        ctx.globalAlpha = Math.sin(ph * Math.PI) * clamp((t - 28.0) / 0.2); font(ctx, 54 + i * 4, 'Bricolage Grotesque', '800'); ctx.fillStyle = i % 2 ? PS.orange : '#FFF4E2'; ctx.textAlign = 'center'; ctx.fillText(notes[i % 4], nx, ny);
      }
      ctx.restore();
      drawMascot(ctx, { x: W / 2 - 10, y: yy + 6, s: 0.86, t, pose: 'sing', mouth: 'auto', eyes: t > T_SING ? 'happy' : 'normal', sticker: true, lineGlow: '#FF9A50' });
      mascotDone = true;
    };
    for (const r of rows) {
      if (!mascotDone && r.z > ZC) drawMascotNow();
      const g = geo(r.z);
      profile(r.tau, prof, 1 + rise * 0.6);
      ctx.beginPath();
      ctx.moveTo(W / 2 - g.hw - 400, g.y + 2);
      for (let k = 0; k <= NX; k++) { const x = W / 2 + ((k / NX) * 2 - 1) * g.hw; ctx.lineTo(x, g.y - prof[k] * g.amp); }
      ctx.lineTo(W / 2 + g.hw + 400, g.y + 2);
      ctx.save(); ctx.lineTo(W / 2 + g.hw + 400, H + 400); ctx.lineTo(W / 2 - g.hw - 400, H + 400); ctx.closePath(); ctx.fillStyle = bg; ctx.fill(); ctx.restore();
      ctx.beginPath();
      ctx.moveTo(W / 2 - g.hw - 400, g.y);
      for (let k = 0; k <= NX; k++) { const x = W / 2 + ((k / NX) * 2 - 1) * g.hw; ctx.lineTo(x, g.y - prof[k] * g.amp); }
      ctx.lineTo(W / 2 + g.hw + 400, g.y);
      ctx.lineWidth = g.lw * (1 + rise * 0.8); ctx.strokeStyle = lineCol; ctx.globalAlpha = clamp(r.z * 5) * clamp((1 - r.z) * 12); ctx.lineJoin = 'round'; ctx.stroke(); ctx.globalAlpha = 1;
    }
    if (!mascotDone) drawMascotNow();
    ctx.restore();

    // label
    font(ctx, 22, 'JetBrains Mono', '800'); ctx.fillStyle = 'rgba(255,244,226,0.7)'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ctx.fillText(`VOCAL STEM · 32 BANDS · ${NL} RIDGES = ${(NL * DT).toFixed(2)} s OF HISTORY`, W - 64, 150);

    // fx
    E.fx.bloom = 0.25 + rise * 1.1 + beat * 0.15; E.fx.bloomThreshold = 0.75 - rise * 0.35;
    E.fx.vignette = 0.4 - rise * 0.3;
    if (t > T_END - 0.2) E.fx.flash = [1, 1, 1, ease.inQuad(clamp((t - (T_END - 0.2)) / 0.2)) * 0.95];
    const sg = t - T_SING; if (sg >= 0 && sg < 0.15) { E.fx.zoom += 0.03 * (1 - sg / 0.15); E.fx.rgb = 5 * (1 - sg / 0.15); }
  },
};
