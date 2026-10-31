// G01 — (drum fill) — "Pull the lever": CURSOR crouches, jumps, hangs on a gold slot machine's lever and its
// weight yanks it down (anticipation → overshoot → elastic return). Three reels spin up with motion blur,
// bulbs chase around the cabinet, and the camera pushes into the reels for the jackpot in G02.
import { shot } from '../../shots.js';
import { W, H, TAU, ease, seg, clamp, lerp, font, roundRect, star, wobble } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { drawMascot, pose } from '../../core/mascot.js';
import { drawSlot, goldBackdrop, reel, LEVER } from './slot.js';
import { slabText } from './kit.js';

const S = shot('G01');
const MX = 760, MY = 560, MS = 0.8, GY = 952, CS = 0.92;
const T_GRAB = 77.36, T_DOWN = 77.5, T_LET = 77.64, T_DB = 78.089;

export function leverAngle(t) {
  const { rest, down } = LEVER;
  if (t < T_GRAB) return rest + (t > 77.2 ? -0.04 * Math.sin((t - 77.2) / 0.16 * Math.PI) : 0);
  if (t < T_DOWN) return lerp(rest, down, ease.inQuad(seg(t, T_GRAB, T_DOWN)));
  if (t < T_LET) return down + 0.07 * wobble(t - T_DOWN, 9, 10);
  return lerp(down, rest, ease.outElastic(seg(t, T_LET, T_LET + 0.7)));
}
const knobAt = (t, cx = MX, cy = MY, sc = MS) => { const a = leverAngle(t); return [cx + (LEVER.px + Math.cos(a) * LEVER.len) * sc, cy + (LEVER.py + Math.sin(a) * LEVER.len) * sc]; };

export default {
  ...S,
  cutIn: 'flash',
  sfx: [{ t: 77.5, type: 'impact', gain: 1 }, { t: 77.55, type: 'riser', gain: 0.6 }, { t: 78.089, type: 'ding' }],
  draw(ctx, t, s, E) {
    const lt = s.lt;
    // camera: gentle drift, punch on the downbeat, then push into the reel window
    const push = ease.inOutCubic(seg(t, 78.12, S.end));
    const z = lerp(1.0 + lt * 0.03, 1.5, push) + A.pulse('down', t, 0.12) * 0.03;
    const fx = lerp(W / 2, MX, push), fy = lerp(H / 2 + 10, MY - 50 * MS, push);
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-fx, -fy);
    const spinning = t > 77.5;
    goldBackdrop(ctx, t, MX, MY - 200, lt * (spinning ? 0.9 : 0.25) + ease.outExpo(seg(t, T_DB, T_DB + 0.4)) * 0.6, W, H);
    ctx.save(); ctx.translate(-200, -200); ctx.restore();
    // floor line
    ctx.fillStyle = 'rgba(224,161,0,0.35)'; ctx.fillRect(-400, GY + 4, W + 800, 600);
    ctx.fillStyle = '#111'; ctx.fillRect(-400, GY, W + 800, 8);

    const reels = [0, 1, 2].map((i) => reel(i, t));
    const tokens = spinning ? Math.floor(Math.pow(clamp((t - 77.5) / 1.4), 2.2) * 1048576 * 0.4) : 0;
    const chase = t * (spinning ? 22 : 6);
    const db = A.pulse('down', t, 0.2);
    drawSlot(ctx, { t, cx: MX, cy: MY, sc: MS, lever: leverAngle(t), lit: 0, chase, reels, tokens });
    if (db > 0.02) { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,200,60,${db * 0.35})`; ctx.fillRect(-400, -400, W + 800, H + 800); ctx.globalCompositeOperation = 'source-over'; }

    // ---------- CURSOR: crouch → jump → hang → yank → let go → cheer ----------
    const [kx, ky] = knobAt(t);
    const hangY = (yk) => yk + (200 + 185) * CS;
    let cx, cy, P, eyes = 'normal', mouth = 'auto', squash = 0;
    const X0 = knobAt(77.08)[0];
    if (t < 77.22) { // crouch (anticipation)
      const k = ease.outCubic(seg(t, 77.08, 77.2));
      cx = X0 + 6; cy = GY; P = pose('idle', t); P.armL = [-150, 100]; P.armR = [150, 100]; P.look = [0.3, -1]; squash = 0.28 * k; mouth = 'o';
    } else if (t < T_GRAB) { // jump up to the knob
      const u = seg(t, 77.22, T_GRAB), e = ease.outQuad(u);
      const [gx, gy] = knobAt(T_GRAB);
      cx = lerp(X0 + 6, gx, e); cy = lerp(GY, hangY(gy), e) - Math.sin(u * Math.PI) * 50;
      P = pose('jump', t); P.armL = [-40, -210]; P.armR = [40, -210]; squash = -0.12; mouth = 'open'; eyes = 'normal'; P.look = [0.3, -1];
    } else if (t < T_LET) { // hanging: its weight yanks the lever down
      cx = kx; cy = Math.min(GY, hangY(ky));
      P = pose('jump', t); P.legL = [-60, 160]; P.legR = [60, 160];
      const land = t > 77.47 ? Math.exp(-(t - 77.47) / 0.07) : 0;
      const local = [(kx - cx) / CS, (ky - cy) / CS + 185];
      P.armL = [local[0] - 16, local[1]]; P.armR = [local[0] + 16, local[1]];
      squash = cy >= GY ? 0.22 * land + 0.05 : -0.08; mouth = 'grin'; eyes = 'x';
      if (cy >= GY) eyes = 'happy';
    } else { // let go → spin celebration
      const [dx] = knobAt(T_LET - 0.01);
      cx = dx; cy = GY; P = pose('cheer', t); eyes = 'star'; mouth = 'auto';
      const hop = ease.outBack(seg(t, T_LET, T_LET + 0.25));
      P.look = [-1, -0.3];
      squash = (1 - hop) * 0.2;
    }
    // shadow
    ctx.fillStyle = 'rgba(17,17,17,0.25)'; ctx.beginPath(); ctx.ellipse(cx, GY + 4, 90 * CS * (1 - clamp((GY - cy) / 600) * 0.5), 14, 0, 0, TAU); ctx.fill();
    drawMascot(ctx, { x: cx, y: cy, s: CS, t, P, eyes, mouth, squash, sticker: true });

    // "PULL!" comic burst on the yank
    const pk = seg(t, 77.44, 77.52), pv = 1 - seg(t, 77.95, 78.1);
    if (pk > 0 && pv > 0) {
      const sc = ease.outBack(pk, 2.6) * pv;
      ctx.save(); ctx.translate(1560, 300); ctx.rotate(0.12 + Math.sin(t * 30) * 0.02); ctx.scale(sc, sc);
      star(ctx, 0, 0, 230, 150, 14, t * 2); ctx.fillStyle = '#111'; ctx.save(); ctx.translate(10, 12); ctx.fill(); ctx.restore();
      star(ctx, 0, 0, 220, 145, 14, t * 2); ctx.fillStyle = '#E8343F'; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = '#111'; ctx.stroke();
      slabText(ctx, 'PULL!', 0, 4, { size: 130, family: 'Bungee', face: '#FFF4D6', side: '#7A1020', depth: 10, ow: 6 });
      ctx.restore();
    }
    // speed streaks around the reels while spinning (sell the spin)
    if (spinning) {
      const k = clamp((t - 77.5) / 0.3) * (1 - push * 0.5);
      ctx.strokeStyle = `rgba(17,17,17,${0.25 * k})`; ctx.lineWidth = 6; ctx.lineCap = 'round';
      for (let i = 0; i < 10; i++) {
        const y0 = ((t * 2200 + i * 211) % 700) + MY - 400, x0 = MX - 380 * MS - 60 - (i % 3) * 30;
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y0 + 90); ctx.stroke();
      }
    }
    ctx.restore();

    // FX
    const yank = t >= T_DOWN ? Math.exp(-(t - T_DOWN) / 0.12) : 0;
    E.fx.shake = yank * 26 + db * 14; E.fx.rgb = yank * 10 + db * 6; E.fx.zoom += yank * 0.04;
    if (t >= T_DOWN && t < T_DOWN + 0.06) E.fx.flash = [1, 0.95, 0.8, 0.5];
    E.fx.radialBlur = ease.inQuad(push) * 0.22; E.fx.center = [0.5, 0.5];
    E.fx.vignette = 0.2;
  },
};
