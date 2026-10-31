// C04 — "it's breaking all the rules" — The rulebook shatters.
// A glass-framed rulebook page (THE RULES 1–10, ruler grid). "it's" → hairline cracks race out along the very
// Voronoi edges that will separate. "breaking" → CURSOR bursts through, the pane explodes into ~90 Voronoi shards
// (half-plane clipped cells, dense at the impact) flying at the lens with pseudo-3D tumble (axis squash + perspective
// z), mirrored backs, specular glints and chromatic edge fringes. Behind: RULES, slashed on "rules".
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, hash, rng, wobble, buf, bctx, font, roundRect, halftone } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { drawMascot } from '../../core/mascot.js';
import { voronoi, speedLines, popText } from './_g3.js';

const S = shot('C04');
const T_CRACK = 42.40, T_BREAK = 42.62, T_SLASH = 43.24, T_BASS = 43.0;
const PW = 1180, PH = 760, PX = (W - PW) / 2, PY = 150;
const IMP = { x: PX + PW * 0.56, y: PY + PH * 0.47 };

const RULES = ['HIRE A STUDIO', 'BUY THE SOFTWARE', 'KEYFRAME BY HAND', 'RENDER FOR A WEEK', 'NEVER TRUST A PROMPT', 'WAIT FOR NOTES', 'DOUBLE THE BUDGET', 'ASK PERMISSION', 'STAY IN YOUR LANE', "DON'T BREAK THE RULES"];

function pageCanvas() {
  const c = buf('C04-page', PW, PH), x = bctx(c);
  if (c._done) return c;
  x.fillStyle = '#FFFBF4'; x.fillRect(0, 0, PW, PH);
  // ruler grid
  x.strokeStyle = 'rgba(46,139,224,0.22)'; x.lineWidth = 1.5;
  for (let gx = 0; gx < PW; gx += 30) { x.beginPath(); x.moveTo(gx, 0); x.lineTo(gx, PH); x.stroke(); }
  for (let gy = 0; gy < PH; gy += 30) { x.beginPath(); x.moveTo(0, gy); x.lineTo(PW, gy); x.stroke(); }
  x.strokeStyle = 'rgba(232,52,63,0.6)'; x.lineWidth = 3; x.beginPath(); x.moveTo(110, 0); x.lineTo(110, PH); x.stroke();
  // ruler strip on the left
  x.fillStyle = '#FFD23F'; x.fillRect(0, 0, 70, PH); x.fillStyle = '#1F2A55';
  for (let i = 0; i < PH; i += 15) { const L = i % 75 === 0 ? 30 : i % 30 === 0 ? 20 : 11; x.fillRect(70 - L, i, L, 2); }
  font(x, 16, 'JetBrains Mono', '700'); x.textAlign = 'left'; x.textBaseline = 'middle';
  for (let i = 75, n = 1; i < PH; i += 75, n++) x.fillText(String(n), 8, i + 1);
  // header
  x.fillStyle = '#1F2A55'; font(x, 104, 'Anton'); x.textAlign = 'left'; x.textBaseline = 'alphabetic';
  x.fillText('THE RULES', 150, 140);
  x.fillStyle = '#E8343F'; x.fillRect(150, 158, 470, 8);
  font(x, 26, 'JetBrains Mono', '700'); x.fillStyle = 'rgba(31,42,85,0.6)'; x.fillText('OF MAKING A MUSIC VIDEO · EST. FOREVER', 650, 136);
  // rules
  RULES.forEach((r, i) => {
    const col = i < 5 ? 0 : 1, row = i % 5;
    const bx = 150 + col * 510, by = 245 + row * 98;
    x.fillStyle = '#E8343F'; font(x, 56, 'Anton'); x.textAlign = 'right'; x.fillText(String(i + 1), bx + 52, by + 20);
    x.fillStyle = '#1F2A55'; font(x, 30, 'Bricolage Grotesque', '800'); x.textAlign = 'left'; x.fillText(r, bx + 72, by + 10);
    x.fillStyle = 'rgba(31,42,85,0.25)'; x.fillRect(bx + 72, by + 26, 380, 3);
  });
  // seal
  x.save(); x.translate(PW - 120, PH - 110); x.rotate(-0.25);
  x.strokeStyle = 'rgba(123,47,247,0.7)'; x.lineWidth = 6; x.beginPath(); x.arc(0, 0, 70, 0, TAU); x.stroke(); x.beginPath(); x.arc(0, 0, 56, 0, TAU); x.stroke();
  x.fillStyle = 'rgba(123,47,247,0.75)'; font(x, 26, 'Rubik Mono One'); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('§ 1-10', 0, 0);
  x.restore();
  c._done = true; return c;
}

let SH = null;
function shards() {
  if (SH) return SH;
  const r = rng(424), seeds = [];
  for (let i = 0; i < 70; i++) { const a = r() * TAU, d = Math.pow(r(), 1.8) * 900; seeds.push([IMP.x + Math.cos(a) * d * 1.1, IMP.y + Math.sin(a) * d * 0.8]); }
  for (let i = 0; i < 22; i++) seeds.push([PX + r() * PW, PY + r() * PH]);
  const ok = seeds.filter((p) => p[0] > PX && p[0] < PX + PW && p[1] > PY && p[1] < PY + PH);
  SH = voronoi(ok, PX, PY, PX + PW, PY + PH).filter((c) => c.poly.length >= 3).map((c, i) => {
    const dx = c.cx - IMP.x, dy = c.cy - IMP.y, dd = Math.hypot(dx, dy) || 1;
    const near = Math.exp(-dd / 420);
    return {
      ...c,
      d: dd,
      vx: (dx / dd) * (90 + 950 * near) + (hash(i, 1) - 0.5) * 160,
      vy: (dy / dd) * (70 + 700 * near) + (hash(i, 2) - 0.5) * 160 - 160,
      vz: 260 + 1100 * near + hash(i, 3) * 380,
      back: hash(i, 7) < 0.45 && dd > 260, axis: hash(i, 4) * Math.PI, spin: (hash(i, 5) - 0.5) * 22, roll: (hash(i, 6) - 0.5) * 9, delay: dd / 5200,
    };
  });
  return SH;
}

// draw shards of one layer (front: flying at the lens; back: tumbling away behind RULES)
function drawShards(ctx, cells, br, push, page, back) {
  const F = 1500;
  const list = cells.filter((c) => c.back === back).map((c) => {
    const a = Math.max(0, br - c.delay);
    const z = back ? -c.vz * 0.55 * a : c.vz * a + 140 * a * a;
    return { c, a, z };
  }).sort((p, q) => p.z - q.z);
  for (const { c, a, z } of list) {
    if (F - z < 140) continue;
    const k = F / (F - z) * push;
    const g = back ? 520 : 360, vs = back ? 0.45 : 1;
    const x = W / 2 + (c.cx + c.vx * a * vs - W / 2) * k, y = H / 2 + (c.cy + c.vy * a * vs + g * a * a - H / 2) * k;
    const th = c.spin * a, sq = Math.cos(th), roll = c.roll * a;
    const glint = Math.pow(Math.max(0, Math.sin(th + c.axis)), 10);
    ctx.save();
    ctx.translate(x, y); ctx.scale(k, k); ctx.rotate(roll + c.axis); ctx.scale(sq, 1); ctx.rotate(-c.axis);
    ctx.beginPath(); c.poly.forEach((p, i) => (i ? ctx.lineTo(p[0] - c.cx, p[1] - c.cy) : ctx.moveTo(p[0] - c.cx, p[1] - c.cy))); ctx.closePath();
    ctx.save(); ctx.clip();
    ctx.drawImage(page, PX - c.cx, PY - c.cy);
    if (sq < 0) { ctx.fillStyle = 'rgba(120,200,255,0.35)'; ctx.fillRect(-PW, -PH, PW * 2, PH * 2); }
    if (back) { ctx.fillStyle = 'rgba(255,90,150,0.25)'; ctx.fillRect(-PW, -PH, PW * 2, PH * 2); }
    const gg = ctx.createLinearGradient(-120, -120, 120, 120);
    gg.addColorStop(0, `rgba(255,255,255,${0.10 + 0.8 * glint})`); gg.addColorStop(0.5, `rgba(150,230,255,${0.18 + 0.3 * glint})`); gg.addColorStop(1, `rgba(255,255,255,${0.05 + 0.6 * glint})`);
    ctx.fillStyle = gg; ctx.fillRect(-PW, -PH, PW * 2, PH * 2);
    ctx.restore();
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(62,240,255,0.8)'; ctx.lineWidth = 5 / Math.max(0.5, k); ctx.stroke();
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2.5 / Math.max(0.5, k); ctx.stroke();
    ctx.restore();
  }
}

export default {
  ...S,
  cutIn: 'punch',
  sfx: [{ t: T_CRACK, type: 'glitch', gain: 0.5 }, { t: T_BREAK, type: 'shatter', gain: 1 }, { t: T_SLASH, type: 'rip', gain: 0.8 }],
  draw(ctx, t, s, E) {
    const lt = s.lt, frame = E.frame;
    const page = pageCanvas(), cells = shards();
    const br = t - T_BREAK, crack = t - T_CRACK;
    const kB = br >= 0 ? Math.exp(-br / 0.12) : 0, kC = crack >= 0 ? Math.exp(-crack / 0.08) : 0, kS = t >= T_SLASH ? Math.exp(-(t - T_SLASH) / 0.1) : 0;
    const kBass = t >= T_BASS ? Math.exp(-(t - T_BASS) / 0.1) : 0;

    // ---------- background: orange → pink, halftone, action lines ----------
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#FF7A1A'); g.addColorStop(0.55, '#FF4F6E'); g.addColorStop(1, '#FF3E8A');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    halftone(ctx, 30, 'rgba(255,225,77,0.45)', (x, y) => 2 + 9 * Math.max(0, Math.sin(x * 0.004 + y * 0.003 - lt * 3)), lt * 30, lt * 18);
    if (br > 0) speedLines(ctx, IMP.x, IMP.y, 60, 300, 1600, frame, `rgba(255,255,255,${0.5 * Math.exp(-br / 0.3)})`, 5, 0.01);

    if (br >= 0) drawShards(ctx, cells, br, 1 + lt * 0.05, page, true);
    // ---------- RULES (revealed behind the glass) ----------
    const rIn = ease.outBack(clamp((t - (T_BREAK - 0.05)) / 0.35), 1.6);
    ctx.save(); ctx.translate(W / 2, 545); ctx.rotate(-0.06 + 0.04 * wobble(t - T_SLASH, 4, 6) * (t > T_SLASH ? 1 : 0));
    const rs = (0.75 + 0.25 * rIn) * (1 + 0.06 * kBass + 0.08 * kS);
    ctx.scale(rs, rs);
    const drawRules = () => {
      ctx.font = '400 500px "Anton"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (let k = 22; k >= 1; k--) { ctx.fillStyle = k > 2 ? '#C2185B' : '#1F2A55'; ctx.fillText('RULES', k * 1.3, k * 1.5); }
      ctx.fillStyle = '#FFE14D'; ctx.fillText('RULES', 0, 0);
      ctx.lineWidth = 12; ctx.strokeStyle = '#1F2A55'; ctx.strokeText('RULES', 0, 0);
    };
    const cut = ease.outExpo(clamp((t - T_SLASH - 0.04) / 0.3)), sep = 120 * cut;
    if (t < T_SLASH + 0.04) drawRules();
    else {
      ctx.save(); ctx.rotate(-0.16);
      for (const side of [-1, 1]) {
        ctx.save(); ctx.beginPath(); ctx.rect(-2000, side < 0 ? -2000 : 0, 4000, 2000); ctx.clip();
        ctx.translate(side * sep, side * sep * 0.42); ctx.rotate(0.16 + side * 0.05 * cut); drawRules(); ctx.restore();
      }
      // glowing seam
      ctx.fillStyle = `rgba(232,52,63,${0.9 * (1 - cut * 0.4)})`; ctx.fillRect(-700, -5 - sep * 0.2, 1400, 10 + sep * 0.4);
      ctx.restore();
    }
    // the slash: a white-hot blade streak sweeping across
    const sl = clamp((t - T_SLASH) / 0.09), fadeS = 1 - clamp((t - T_SLASH - 0.09) / 0.2);
    if (sl > 0 && fadeS > 0) {
      ctx.save(); ctx.rotate(-0.16); ctx.globalAlpha = fadeS;
      const x1 = -760 + 1520 * ease.outQuad(sl);
      const gs = ctx.createLinearGradient(-760, 0, x1, 0); gs.addColorStop(0, 'rgba(255,255,255,0)'); gs.addColorStop(0.7, 'rgba(255,230,240,0.9)'); gs.addColorStop(1, '#FFFFFF');
      ctx.fillStyle = gs; ctx.beginPath(); ctx.moveTo(-760, 0); ctx.lineTo(x1, -26); ctx.lineTo(x1 + 60, 0); ctx.lineTo(x1, 26); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    ctx.restore();

    // glass spray out of the slice seam
    const sa = t - T_SLASH - 0.03;
    if (sa > 0) {
      const ang = -0.06 - 0.16, ca = Math.cos(ang), sa2 = Math.sin(ang);
      for (let i = 0; i < 70; i++) {
        const u = (hash(i, 41) - 0.5) * 1250, side = i % 2 ? 1 : -1;
        const x0 = W / 2 + ca * u, y0 = 545 + sa2 * u;
        const sp = 300 + hash(i, 42) * 900, vx = -sa2 * side * sp * 0.6 + ca * (hash(i, 43) - 0.5) * 500, vy = ca * side * sp;
        const x = x0 + vx * sa, y = y0 + vy * sa + 1400 * sa * sa, r = (12 + hash(i, 44) * 26) * (1 - clamp(sa / 0.5) * 0.4);
        ctx.save(); ctx.translate(x, y); ctx.rotate(sa * 14 * (hash(i, 45) - 0.5) + i);
        ctx.fillStyle = i % 3 === 0 ? '#FFE14D' : i % 3 === 1 ? 'rgba(255,255,255,0.95)' : 'rgba(62,240,255,0.9)';
        ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(r * 0.8, r * 0.6); ctx.lineTo(-r * 0.7, r * 0.4); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
    }

    // ---------- the pane (intact) ----------
    const push = 1 + lt * 0.05;
    const paneShake = kC * 10;
    if (br < 0) {
      ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(push, push); ctx.rotate(-0.02 + Math.sin(lt * 3) * 0.006); ctx.translate(-W / 2 + (hash(frame, 3) - 0.5) * paneShake, -H / 2 + (hash(frame, 4) - 0.5) * paneShake);
      // frame shadow + bevel
      ctx.fillStyle = 'rgba(60,10,40,0.35)'; roundRect(ctx, PX - 22 + 20, PY - 22 + 26, PW + 44, PH + 44, 18); ctx.fill();
      ctx.fillStyle = '#1F2A55'; roundRect(ctx, PX - 22, PY - 22, PW + 44, PH + 44, 18); ctx.fill();
      ctx.drawImage(page, PX, PY);
      // glass sheen
      ctx.save(); ctx.beginPath(); ctx.rect(PX, PY, PW, PH); ctx.clip();
      const sh = ((lt * 900) % 2600) - 600;
      ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.beginPath(); ctx.moveTo(PX + sh, PY); ctx.lineTo(PX + sh + 160, PY); ctx.lineTo(PX + sh - 240, PY + PH); ctx.lineTo(PX + sh - 400, PY + PH); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(160,230,255,0.10)'; ctx.fillRect(PX, PY, PW, PH);
      // cracks race out along the future shard edges
      if (crack > 0) {
        const reach = 1300 * ease.outExpo(crack / 0.22);
        ctx.lineJoin = 'round';
        for (const c of cells) {
          if (c.d > reach) continue;
          ctx.beginPath(); c.poly.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath();
          ctx.strokeStyle = 'rgba(40,60,90,0.55)'; ctx.lineWidth = 4; ctx.stroke();
          ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 1.8; ctx.stroke();
        }
        // impact star
        ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.arc(IMP.x, IMP.y, 18 + 30 * kC, 0, TAU); ctx.fill();
      }
      ctx.restore();
      ctx.restore();
    } else {
      drawShards(ctx, cells, br, push, page, false);
      const F = 1500;
      // glass dust
      for (let i = 0; i < 90; i++) {
        const a = br, ang = hash(i, 9) * TAU, sp = 300 + hash(i, 10) * 1500;
        const z = (600 + hash(i, 11) * 1400) * a, k = F / Math.max(120, F - z);
        const x = W / 2 + (IMP.x + Math.cos(ang) * sp * a - W / 2) * k, y = H / 2 + (IMP.y + Math.sin(ang) * sp * a * 0.8 + 600 * a * a - H / 2) * k;
        ctx.fillStyle = i % 4 ? 'rgba(255,255,255,0.9)' : 'rgba(62,240,255,0.9)';
        ctx.fillRect(x, y, 4 * k, 4 * k);
      }
    }

    // ---------- CURSOR bursts through ----------
    if (br >= 0 && br < 0.42) {
      const a = clamp(br / 0.42);
      const z = lerp(0, 1, ease.inQuad(a));
      const k = 0.55 + 2.8 * z;
      const x = lerp(IMP.x, IMP.x + 640, ease.inQuad(a)), y = lerp(IMP.y + 120, IMP.y + 900, ease.inQuad(a));
      drawMascot(ctx, { x, y: y + 185 * k * 0.5, s: k, t, pose: 'jump', eyes: 'star', mouth: 'open', rot: -0.35 + a * 0.9, sticker: true });
    }

    E.fx.shake = 14 * kC + 46 * kB + 22 * kS + 18 * kBass;
    E.fx.rgb = 6 * kC + 18 * kB + 10 * kS + 3;
    E.fx.zoom = 0.02 * kC + 0.07 * kB + 0.04 * kS;
    E.fx.flash = [1, 1, 1, 0.45 * kB];
    E.fx.bloom = 0.25 + 0.4 * kB; E.fx.bloomThreshold = 0.85; E.fx.vignette = 0.2;
  },
};
