// V14 · "It's on autopilot, baby," — cockpit POV. Paper clouds stream at the windscreen in true perspective,
// the plane wobbles in turbulence with every gauge jittering… then the chunky AUTOPILOT toggle flips ITSELF on
// "autopilot": green lamp, the artificial horizon levels, needles lock, the camera calms. CURSOR (pilot cap,
// shades, hands behind its head, feet on the dash) couldn't care less.
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, hash, noise2, spring, wobble, font, roundRect } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { drawMascot } from '../../core/mascot.js';
import { PS, cloud, shadowText } from './_g2.js';

const S = shot('V14');
const T_AP = 27.04, T_BABY = 27.54;
const HOR = 440;  // horizon y (screen, level)

function gaugeFace(ctx, x, y, r) {
  ctx.fillStyle = PS.ink; ctx.beginPath(); ctx.arc(x + 6, y + 8, r + 16, 0, TAU); ctx.fill();
  const g = ctx.createLinearGradient(x, y - r - 16, x, y + r + 16); g.addColorStop(0, '#E9DFCC'); g.addColorStop(1, '#B9AE98');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r + 16, 0, TAU); ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = PS.ink; ctx.stroke();
  ctx.fillStyle = '#141B3A'; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  for (let i = 0; i < 4; i++) { const a = i * TAU / 4 + 0.785; ctx.fillStyle = '#5A5468'; ctx.beginPath(); ctx.arc(x + Math.cos(a) * (r + 9), y + Math.sin(a) * (r + 9), 4, 0, TAU); ctx.fill(); }
}
function ticks(ctx, x, y, r, a0, a1, n, major = 5) {
  ctx.strokeStyle = '#FFFBF4';
  for (let i = 0; i <= n; i++) { const a = lerp(a0, a1, i / n), M = i % major === 0; ctx.lineWidth = M ? 4 : 2; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r * 0.92, y + Math.sin(a) * r * 0.92); ctx.lineTo(x + Math.cos(a) * r * (M ? 0.74 : 0.82), y + Math.sin(a) * r * (M ? 0.74 : 0.82)); ctx.stroke(); }
}
function needle(ctx, x, y, r, a, col = PS.orange, w = 9) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(a);
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-r * 0.18, -w / 2); ctx.lineTo(r * 0.82, 0); ctx.lineTo(-r * 0.18, w / 2); ctx.closePath(); ctx.fill();
  ctx.restore(); ctx.fillStyle = '#FFFBF4'; ctx.beginPath(); ctx.arc(x, y, 11, 0, TAU); ctx.fill(); ctx.fillStyle = PS.ink; ctx.beginPath(); ctx.arc(x, y, 5, 0, TAU); ctx.fill();
}
function label(ctx, s, x, y, size = 18, col = '#FFFBF4') { font(ctx, size, 'JetBrains Mono', '800'); ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(s, x, y); }

export default {
  ...S,
  hud: 'paper',
  sfx: [{ t: T_AP, type: 'click', gain: 1 }, { t: T_AP + 0.05, type: 'ding', gain: 0.6 }],
  draw(ctx, t, s, E) {
    const lt = s.lt;
    const ap = t >= T_AP ? t - T_AP : -1;
    const calm = ap >= 0 ? ease.outCubic(clamp(ap / 0.45)) : 0;           // 0 = turbulence, 1 = autopilot
    const turb = 1 - calm;
    const kickP = Math.exp(-A.since('kick', t) / 0.12);
    // flight state
    const bank = (Math.sin(t * 2.3) * 0.12 + noise2(t * 1.7, 3) * 0.08) * turb + wobble(Math.max(0, ap), 1.4, 3) * 0.04 * calm;
    const pitch = (Math.sin(t * 1.6 + 1) * 34 + noise2(t * 2.2, 9) * 26) * turb;
    const shakeX = (noise2(t * 31, 1) * 10 + kickP * 6) * turb, shakeY = (noise2(t * 29, 2) * 8) * turb;

    ctx.save();
    const push = ap >= 0 ? ease.inOutCubic(clamp(ap / 0.9)) : 0, cz = 1 + push * 0.06 + Math.exp(-A.since('beat', t) / 0.1) * 0.01;
    ctx.translate(W / 2 + shakeX, H / 2 + shakeY); ctx.scale(cz, cz); ctx.rotate(bank * 0.15); ctx.translate(-W / 2 - push * 40, -H / 2 - push * 10);
    // ---------------- sky through the windscreen ----------------
    ctx.save();
    ctx.translate(W / 2, HOR + pitch); ctx.rotate(bank); ctx.translate(-W / 2, -(HOR + pitch));
    const sg = ctx.createLinearGradient(0, HOR - 420, 0, HOR);
    sg.addColorStop(0, '#2F8FDB'); sg.addColorStop(1, '#A8DDF8');
    ctx.fillStyle = sg; ctx.fillRect(-400, -400, W + 800, HOR + 400);
    // sun (comes out on autopilot)
    const sunK = 0.45 + 0.55 * calm;
    ctx.save(); ctx.translate(1530, HOR - 250); ctx.rotate(t * 0.4);
    ctx.globalAlpha = 0.25 * sunK; ctx.fillStyle = '#FFF4B0';
    for (let r = 0; r < 14; r++) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 520, (r / 14) * TAU, (r / 14 + 0.032) * TAU); ctx.fill(); }
    ctx.globalAlpha = 1; ctx.fillStyle = '#FFD23F'; ctx.beginPath(); ctx.arc(0, 0, 70 + 10 * calm, 0, TAU); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = '#F2A33D'; ctx.stroke();
    ctx.restore();
    // cloud sea below the horizon
    const cg = ctx.createLinearGradient(0, HOR, 0, HOR + 500); cg.addColorStop(0, '#EAF5FC'); cg.addColorStop(1, '#C9E3F4');
    ctx.fillStyle = cg; ctx.fillRect(-400, HOR, W + 800, 900);
    for (let r = 0; r < 4; r++) {
      const sc = 26 + r * r * 22, yy = HOR + 12 + r * r * 26, sp = 160 * (1 + r * 1.6), gap = sc * 3.2;
      for (let k = -3; k < W / gap + 4; k++) { const xx = ((k * gap - t * sp) % (W + 2 * gap) + W + 2 * gap) % (W + 2 * gap) - gap; cloud(ctx, xx, yy, sc, { fill: '#FFFFFF', shade: '#D6EAF6', seed: k * 7 + r * 31, shadow: null }); }
    }
    // flying clouds in perspective (fly past the windscreen)
    const items = [];
    for (let i = 0; i < 22; i++) {
      const z = 0.3 + ((hash(i, 1) * 7 - t * 4.2) % 7 + 7) % 7;
      const x = (hash(i, 2) - 0.5) * 3000, y = -60 - hash(i, 3) * 300;
      items.push({ i, z, x, y });
    }
    items.sort((a, b) => b.z - a.z);
    for (const it of items) {
      const sx = W / 2 + it.x / it.z * 0.85, sy = HOR + it.y / it.z * 0.55, sc = 150 / it.z;
      if (sc > 420 || sx < -sc * 2 || sx > W + sc * 2) continue;
      ctx.globalAlpha = clamp((7 - it.z) / 1.5) * clamp((it.z - 0.36) / 0.2);
      cloud(ctx, sx, sy, sc, { fill: '#FFFFFF', shade: '#D2E7F5', outline: PS.ink, lw: Math.max(2.5, sc * 0.035), seed: it.i + 5, shadow: null });
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    // speed streaks
    ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineCap = 'round';
    for (let i = 0; i < 26; i++) { const a = hash(i, 31) * TAU, r0 = 120 + ((hash(i, 32) * 900 + t * 1900) % 900), L = 60 + hash(i, 33) * 120; ctx.lineWidth = 2 + hash(i, 34) * 4; const ox = W / 2, oy = HOR; ctx.beginPath(); ctx.moveTo(ox + Math.cos(a) * r0, oy + Math.sin(a) * r0 * 0.5); ctx.lineTo(ox + Math.cos(a) * (r0 + L), oy + Math.sin(a) * (r0 + L) * 0.5); ctx.stroke(); }
    ctx.restore();
    // ---------------- windscreen frame ----------------
    ctx.fillStyle = PS.ink;
    ctx.beginPath(); ctx.rect(-40, -40, W + 80, H + 80);
    // two panes (holes)
    const pane = (x0, x1, top, slant) => { ctx.moveTo(x0 + slant, top); ctx.lineTo(x1 - 10, top + 20); ctx.lineTo(x1, 610); ctx.lineTo(x0, 610); ctx.closePath(); };
    pane(70, 930, 150, 60); pane(990, 1850, 160, 0);
    ctx.fill('evenodd');
    // glass reflections
    ctx.save(); ctx.globalAlpha = 0.16; ctx.fillStyle = '#FFFFFF';
    for (const [x, w] of [[300, 90], [440, 30], [1250, 110], [1420, 36]]) { ctx.beginPath(); ctx.moveTo(x, 150); ctx.lineTo(x + w, 150); ctx.lineTo(x + w - 260, 610); ctx.lineTo(x - 260, 610); ctx.fill(); }
    ctx.restore();
    // rivets on the post
    ctx.fillStyle = '#3A4680'; for (let y = 190; y < 600; y += 60) { ctx.beginPath(); ctx.arc(960, y, 6, 0, TAU); ctx.fill(); }

    // ---------------- HUD on the glass ----------------
    if (ap >= 0) {
      const k = ease.outBack(clamp(ap / 0.22), 2.2);
      const bp = 1 + Math.exp(-A.since('beat', t) / 0.1) * 0.05; ctx.save(); ctx.translate(1420, 300); ctx.scale(k * bp, k * bp); ctx.rotate(-0.03);
      shadowText(ctx, 'AUTOPILOT', 0, 0, { size: 150, fill: '#FFFBF4', shadow: PS.ink, off: 9, stroke: PS.ink, lw: 10 });
      ctx.fillStyle = '#2FCB6F'; roundRect(ctx, -110, 90, 220, 64, 12); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = PS.ink; ctx.stroke();
      font(ctx, 46, 'Anton'); ctx.fillStyle = '#FFFBF4'; ctx.textAlign = 'center'; ctx.fillText('● ON', 0, 124);
      ctx.restore();
    } else {
      label(ctx, Math.floor(t * 5) % 2 ? '⚠ TURBULENCE · MANUAL' : '', 1420, 240, 34, PS.red);
    }
    // pitch ladder (centre of the right pane)
    ctx.save(); ctx.strokeStyle = 'rgba(124,255,196,0.75)'; ctx.lineWidth = 3; ctx.translate(1420, 470); ctx.rotate(bank);
    for (let p = -2; p <= 2; p++) { const y = p * 50 + pitch * 0.6; if (Math.abs(y) > 120) continue; ctx.beginPath(); ctx.moveTo(-110, y); ctx.lineTo(-40, y); ctx.moveTo(40, y); ctx.lineTo(110, y); ctx.stroke(); }
    ctx.restore();

    // ---------------- instrument panel ----------------
    ctx.fillStyle = '#26305E'; ctx.beginPath(); ctx.moveTo(-40, 640); ctx.quadraticCurveTo(W / 2, 560, W + 40, 640); ctx.lineTo(W + 40, H + 40); ctx.lineTo(-40, H + 40); ctx.closePath(); ctx.fill();
    ctx.fillStyle = PS.ink; ctx.beginPath(); ctx.moveTo(-40, 640); ctx.quadraticCurveTo(W / 2, 560, W + 40, 640); ctx.lineTo(W + 40, 680); ctx.quadraticCurveTo(W / 2, 600, -40, 680); ctx.closePath(); ctx.fill();
    const pg = ctx.createLinearGradient(0, 660, 0, H); pg.addColorStop(0, '#E9DFCC'); pg.addColorStop(1, '#CFC3AA');
    ctx.fillStyle = pg; roundRect(ctx, 430, 664, 1440, 440, 26); ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = PS.ink; ctx.stroke();
    // airspeed
    const G1 = [700, 858], R = 104;
    gaugeFace(ctx, G1[0], G1[1], R); ticks(ctx, G1[0], G1[1], R, -Math.PI * 1.25, Math.PI * 0.25, 30);
    label(ctx, 'KNOTS', G1[0], G1[1] + 46, 15); label(ctx, 'AIRSPEED', G1[0], G1[1] - R - 34, 17, PS.ink);
    needle(ctx, G1[0], G1[1], R, lerp(-Math.PI * 1.25, Math.PI * 0.25, 0.62 + noise2(t * 9, 4) * 0.12 * turb + Math.sin(t * 40) * 0.02 * turb));
    // attitude indicator
    const G2 = [980, 858], R2 = 118;
    gaugeFace(ctx, G2[0], G2[1], R2);
    ctx.save(); ctx.beginPath(); ctx.arc(G2[0], G2[1], R2, 0, TAU); ctx.clip();
    ctx.translate(G2[0], G2[1]); ctx.rotate(-bank * 2.2); ctx.translate(0, pitch * 0.9);
    ctx.fillStyle = '#4FA9E3'; ctx.fillRect(-200, -260, 400, 260); ctx.fillStyle = '#C9733A'; ctx.fillRect(-200, 0, 400, 260);
    ctx.strokeStyle = '#FFFBF4'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-200, 0); ctx.lineTo(200, 0);
    for (let p = -3; p <= 3; p++) if (p) { ctx.moveTo(-26 - (p % 2 ? 0 : 14), p * 22); ctx.lineTo(26 + (p % 2 ? 0 : 14), p * 22); }
    ctx.stroke(); ctx.restore();
    ctx.strokeStyle = PS.mustard; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(G2[0] - 70, G2[1]); ctx.lineTo(G2[0] - 24, G2[1]); ctx.lineTo(G2[0], G2[1] + 16); ctx.lineTo(G2[0] + 24, G2[1]); ctx.lineTo(G2[0] + 70, G2[1]); ctx.stroke();
    label(ctx, 'ATTITUDE', G2[0], G2[1] - R2 - 34, 17, PS.ink);
    // altimeter (needles race in turbulence, settle on A/P)
    const G3 = [1260, 858];
    gaugeFace(ctx, G3[0], G3[1], R); ticks(ctx, G3[0], G3[1], R, -Math.PI / 2, Math.PI * 1.5, 50);
    for (let d = 0; d < 10; d++) { const a = -Math.PI / 2 + d * TAU / 10; label(ctx, String(d), G3[0] + Math.cos(a) * R * 0.6, G3[1] + Math.sin(a) * R * 0.6, 17); }
    const alt = lerp(t * 2.6, T_AP * 2.6 + (1 - Math.exp(-Math.max(0, ap) * 6)) * 0.4, calm);
    needle(ctx, G3[0], G3[1], R * 0.7, -Math.PI / 2 + alt * TAU * 0.1, '#FFFBF4', 12);
    needle(ctx, G3[0], G3[1], R, -Math.PI / 2 + alt * TAU, PS.orange, 8);
    label(ctx, 'ALTITUDE', G3[0], G3[1] - R - 34, 17, PS.ink); label(ctx, 'FT ×1000', G3[0], G3[1] + 50, 14);

    // ---------------- the AUTOPILOT toggle ----------------
    const TX = 1590, TY = 846;
    ctx.fillStyle = PS.ink; roundRect(ctx, TX - 120 + 8, TY - 150 + 8, 240, 300, 22); ctx.fill();
    ctx.fillStyle = '#3A4680'; roundRect(ctx, TX - 120, TY - 150, 240, 300, 22); ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = PS.ink; ctx.stroke();
    label(ctx, 'AUTOPILOT', TX, TY - 118, 24);
    // lamp
    const lampOn = ap >= 0.02;
    ctx.save();
    if (lampOn) { ctx.shadowColor = '#3BFF8A'; ctx.shadowBlur = 40; }
    ctx.fillStyle = lampOn ? '#3BFF8A' : (Math.floor(t * 6) % 2 ? '#E8343F' : '#5A2030');
    ctx.beginPath(); ctx.arc(TX, TY - 66, 24, 0, TAU); ctx.fill(); ctx.restore();
    ctx.lineWidth = 5; ctx.strokeStyle = PS.ink; ctx.beginPath(); ctx.arc(TX, TY - 66, 24, 0, TAU); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.arc(TX - 8, TY - 74, 7, 0, TAU); ctx.fill();
    label(ctx, 'ON', TX + 82, TY - 6, 22, lampOn ? '#3BFF8A' : '#8A90B8'); label(ctx, 'OFF', TX + 82, TY + 92, 22, lampOn ? '#8A90B8' : '#FFFBF4');
    // lever: flips by ITSELF (no hand) — down → up with overshoot
    const flip = ap >= 0 ? spring(ap, 5, 0.35) : 0;
    const ang = lerp(0.95, -0.95, flip);
    ctx.fillStyle = '#1A2148'; roundRect(ctx, TX - 46, TY + 4, 92, 92, 16); ctx.fill();
    ctx.save(); ctx.translate(TX, TY + 50);
    const ly = -Math.cos(ang) * 0, lx = 0;
    const tipX = Math.sin(-ang) * 0, tipLen = 120 * Math.cos(Math.abs(ang) * 0.3);
    const dir = ang > 0 ? 1 : -1;
    // lever as a foreshortened cylinder
    const len = 118 * Math.abs(Math.sin(ang)) + 20, yEnd = -dir * len;
    const lg = ctx.createLinearGradient(-20, 0, 20, 0); lg.addColorStop(0, '#9AA3B8'); lg.addColorStop(0.45, '#FFFFFF'); lg.addColorStop(1, '#6C7590');
    ctx.fillStyle = lg; ctx.fillRect(-16, Math.min(0, yEnd), 32, Math.abs(yEnd));
    ctx.beginPath(); ctx.ellipse(0, yEnd, 26, 18, 0, 0, TAU); ctx.fillStyle = lg; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = PS.ink; ctx.stroke();
    ctx.strokeRect(-16, Math.min(0, yEnd), 32, Math.abs(yEnd));
    ctx.fillStyle = PS.ink; ctx.beginPath(); ctx.arc(0, 0, 14, 0, TAU); ctx.fill();
    ctx.restore();
    // click flash + spark ring on the toggle
    if (ap >= 0 && ap < 0.3) { const k = ap / 0.3; ctx.strokeStyle = `rgba(59,255,138,${1 - k})`; ctx.lineWidth = 10 * (1 - k); ctx.beginPath(); ctx.arc(TX, TY, 60 + k * 220, 0, TAU); ctx.stroke(); }

    // ---------------- pilot seat + CURSOR ----------------
    ctx.fillStyle = PS.ink; roundRect(ctx, 104, 548, 330, 600, 60); ctx.fill();
    ctx.fillStyle = PS.red; roundRect(ctx, 96, 540, 330, 600, 60); ctx.fill();
    ctx.strokeStyle = '#FFFBF4'; ctx.lineWidth = 4; ctx.setLineDash([12, 9]); roundRect(ctx, 122, 566, 278, 560, 44); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#B8232E'; for (let i = 0; i < 3; i++) ctx.fillRect(150 + i * 80, 600, 20, 500);
    ctx.fillStyle = '#C92B36'; roundRect(ctx, 150, 500, 222, 110, 40); ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = PS.ink; ctx.stroke();
    const P = { armL: [-112, -128], armR: [112, -128], legL: [170, 30], legR: [230, 10], squash: Math.exp(-A.since('beat', t) / 0.1) * 0.04, rot: -0.22, bob: 0, look: [0.6, -0.1], lean: 0 };
    drawMascot(ctx, {
      x: 268, y: 1000, s: 1.0, t, P, eyes: 'shades', mouth: t > T_BABY ? 'grin' : 'smile',
      over: (c) => {
        // pilot cap
        c.fillStyle = '#FFFBF4'; c.strokeStyle = PS.ink; c.lineWidth = 7;
        c.beginPath(); c.moveTo(-86, -118); c.quadraticCurveTo(-92, -190, 0, -196); c.quadraticCurveTo(92, -190, 86, -118); c.closePath(); c.fill(); c.stroke();
        c.fillStyle = PS.ink; c.fillRect(-90, -132, 180, 22);
        c.beginPath(); c.ellipse(26, -112, 92, 16, 0.06, 0, TAU); c.fill();
        c.fillStyle = PS.mustard; c.beginPath(); c.moveTo(0, -170); c.lineTo(-36, -158); c.lineTo(-8, -152); c.lineTo(0, -144); c.lineTo(8, -152); c.lineTo(36, -158); c.closePath(); c.fill();
        c.beginPath(); c.arc(0, -158, 9, 0, TAU); c.fill();
      },
    });
    // shades glint on "baby"
    if (t > T_BABY && t < T_BABY + 0.35) {
      const k = (t - T_BABY) / 0.35, gx = lerp(190, 330, k), gy = 735;
      ctx.save(); ctx.translate(gx, gy); ctx.rotate(k * 2); ctx.fillStyle = '#FFFFFF';
      for (let i = 0; i < 4; i++) { ctx.rotate(Math.PI / 2); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(6, 6); ctx.lineTo(0, 34 * Math.sin(k * Math.PI)); ctx.lineTo(-6, 6); ctx.fill(); }
      ctx.restore();
    }
    if (t > T_BABY) {
      const k = ease.outBack(clamp((t - T_BABY) / 0.2), 2.5);
      ctx.save(); ctx.translate(560, 470); ctx.rotate(-0.12); ctx.scale(k, k);
      shadowText(ctx, 'baby.', 0, 0, { size: 130, family: 'Caveat', weight: '700', fill: '#FF7AA8', shadow: PS.ink, off: 6 });
      ctx.restore();
    }
    ctx.restore();

    // ---------------- fx ----------------
    if (ap >= 0 && ap < 0.16) { E.fx.flash = [0.85, 1, 0.9, 0.35 * (1 - ap / 0.16)]; E.fx.zoom += 0.035 * (1 - ap / 0.16); }
    E.fx.shake = Math.max(E.fx.shake || 0, kickP * 6 * turb);
  },
};
