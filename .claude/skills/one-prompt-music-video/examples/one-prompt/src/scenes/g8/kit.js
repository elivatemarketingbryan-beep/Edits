// g8 shared helpers — bridge "WARM THANK-YOU" world.
import { W, H, TAU, clamp, lerp, ease, hex2rgb, rgb, buf, bctx, rng, noise2, roundRect, heart, star } from '../../core/lib.js';

export const BP = {
  peach: '#FFB38A', pink: '#FF8FB1', gold: '#FFB000', lav: '#C9B6FF', cream: '#FFF4EA',
  rose: '#FF5C93', plum: '#4A2A5E', deep: '#2A1840', ink: '#1F2A55', orange: '#FF6A1F', sun: '#FFE7A8',
  skin: '#FFE2C4', hood: '#1F2A55', hoodHi: '#2D3D78', pants: '#141A35',
};

/** vertical gradient fill of the whole frame (or a band). stops: [[pos, hex], ...] */
export function vgrad(ctx, stops, y0 = 0, y1 = H, x = 0, w = W) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  for (const [p, c] of stops) g.addColorStop(p, c);
  ctx.fillStyle = g; ctx.fillRect(x, Math.min(y0, 0) - 2, w, Math.max(y1, H) - Math.min(y0, 0) + 4);
}

/** soft round glow sprite (cached) */
export function glowSprite(color, size = 128, hard = 0.0) {
  const key = `g8-glow-${color}-${size}-${hard}`;
  const c = buf(key, size, size), x = bctx(c);
  if (!c._done) {
    const [r, g, b] = hex2rgb(color), R = size / 2;
    const gr = x.createRadialGradient(R, R, 0, R, R, R);
    gr.addColorStop(0, rgb(r, g, b, 1)); gr.addColorStop(clamp(hard), rgb(r, g, b, 0.85)); gr.addColorStop(Math.min(1, hard + 0.35), rgb(r, g, b, 0.28)); gr.addColorStop(1, rgb(r, g, b, 0));
    x.fillStyle = gr; x.fillRect(0, 0, size, size); c._done = true;
  }
  return c;
}

/** bokeh disc sprite: flat-ish disc with brighter rim + slight hex aperture, soft edge */
export function bokehSprite(color, size = 160, blades = 6) {
  const key = `g8-bokeh-${color}-${size}-${blades}`;
  const c = buf(key, size, size), x = bctx(c);
  if (!c._done) {
    const [r, g, b] = hex2rgb(color), R = size / 2, rr = R * 0.82;
    x.save(); x.filter = `blur(${(size * 0.025).toFixed(1)}px)`;
    x.beginPath();
    for (let i = 0; i <= blades; i++) { const a = (i / blades) * TAU + 0.3; const px = R + Math.cos(a) * rr, py = R + Math.sin(a) * rr; i ? x.lineTo(px, py) : x.moveTo(px, py); }
    x.closePath();
    const gr = x.createRadialGradient(R, R, 0, R, R, rr);
    gr.addColorStop(0, rgb(r, g, b, 0.35)); gr.addColorStop(0.75, rgb(r, g, b, 0.45)); gr.addColorStop(0.93, rgb(r, g, b, 0.85)); gr.addColorStop(1, rgb(r, g, b, 0.6));
    x.fillStyle = gr; x.fill(); x.restore(); c._done = true;
  }
  return c;
}

/** paper petal sprite (cherry blossom petal with notch). side 0 = front, 1 = back (paler, with crease) */
export function petalSprite(color, side = 0, size = 96, blur = 0) {
  const key = `g8-petal-${color}-${side}-${size}-${blur}`;
  const c = buf(key, size, size), x = bctx(c);
  if (!c._done) {
    const s = size / 96;
    x.save(); x.translate(size / 2, size / 2); x.scale(s, s);
    if (blur) x.filter = `blur(${blur}px)`;
    const shape = () => {
      x.beginPath(); x.moveTo(-40, 0);
      x.bezierCurveTo(-30, -26, 14, -30, 34, -12);
      x.lineTo(28, 0); x.lineTo(34, 12);
      x.bezierCurveTo(14, 30, -30, 26, -40, 0); x.closePath();
    };
    shape();
    const [r, g, b] = hex2rgb(color);
    const k = side ? 1.12 : 1;
    const gr = x.createLinearGradient(-40, 0, 36, 0);
    gr.addColorStop(0, rgb(Math.min(255, r * 0.86 * k), Math.min(255, g * 0.78 * k), Math.min(255, b * 0.84 * k)));
    gr.addColorStop(0.6, rgb(Math.min(255, r * k), Math.min(255, g * k), Math.min(255, b * k)));
    gr.addColorStop(1, rgb(Math.min(255, r * 1.05 * k + 12), Math.min(255, g * 1.05 * k + 12), Math.min(255, b * 1.05 * k + 12)));
    x.fillStyle = gr; x.fill();
    if (!blur) {
      x.lineWidth = 2.2; x.strokeStyle = rgb(r * 0.7, g * 0.55, b * 0.65, 0.55); x.stroke();
      // centre crease
      x.beginPath(); x.moveTo(-38, 0); x.quadraticCurveTo(0, side ? 4 : -4, 26, 0); x.lineWidth = 1.6; x.strokeStyle = rgb(255, 255, 255, side ? 0.55 : 0.35); x.stroke();
    }
    x.restore(); c._done = true;
  }
  return c;
}

/**
 * Falling-paper aerodynamics (quasi-steady plate model): anisotropic drag (broadside >> edgewise),
 * circulation lift ∝ u_t·u_n, Munk pitching moment that turns the plate broadside, rotational damping.
 * Produces genuine flutter (pendulum swings) and tumbling depending on parameters.
 * Returns Float32Array samples [x, y, theta, roll] at `rate` Hz over `dur` seconds.
 */
export function simulatePetal(r, { x0, y0, dur, rate = 60, sub = 4, g = 500, wind = () => [0, 0], t0 = 0 }) {
  const P = {
    kn: r.range(0.03, 0.048), kt: r.range(0.0024, 0.0038), ct: r.range(0.0005, 0.0009),
    dw: r.range(1.0, 1.8), cl: r.range(-0.9, 0.2),
  };
  let x = x0, y = y0, vx = r.range(-40, 40), vy = r.range(40, 120), th = r.range(-1.2, 1.2), w = r.range(-2, 2), roll = r.range(0, TAU);
  const rollRate = r.range(1.5, 5) * r.sign();
  const n = Math.ceil(dur * rate) + 1, out = new Float32Array(n * 4), dt = 1 / (rate * sub);
  for (let i = 0; i < n; i++) {
    out[i * 4] = x; out[i * 4 + 1] = y; out[i * 4 + 2] = th; out[i * 4 + 3] = roll;
    for (let k = 0; k < sub; k++) {
      const tt = t0 + (i * sub + k) * dt;
      const [wx, wy] = wind(tt, x, y);
      const rx = vx - wx, ry = vy - wy;
      const c = Math.cos(th), sn = Math.sin(th), tx = c, ty = sn, nx = -sn, ny = c;
      const ut = rx * tx + ry * ty, un = rx * nx + ry * ny, sp = Math.hypot(rx, ry) + 1e-6;
      let ax = 0, ay = g;
      ax -= P.kn * sp * un * nx + P.kt * sp * ut * tx; ay -= P.kn * sp * un * ny + P.kt * sp * ut * ty;
      const L = (P.cl * ut * un) / (sp * sp); ax += L * -ry; ay += L * rx;
      const tau = -P.ct * ut * un - P.dw * w;
      w += tau * dt; th += w * dt; vx += ax * dt; vy += ay * dt; x += vx * dt; y += vy * dt;
      roll += (rollRate + w * 0.35) * dt;
    }
  }
  return out;
}

/** sample a petal track at time (s since track start) with linear interpolation */
export function sampleTrack(tr, t, rate = 60) {
  const n = tr.length / 4, f = clamp(t * rate, 0, n - 1.001), i = Math.floor(f), u = f - i;
  const a = i * 4, b = a + 4;
  return [lerp(tr[a], tr[b], u), lerp(tr[a + 1], tr[b + 1], u), lerp(tr[a + 2], tr[b + 2], u), lerp(tr[a + 3], tr[b + 3], u)];
}

// ---------------- the geometric guy (consistent with W05: navy hoodie, cream circle head, no face) ----------------
function limbPath(ctx, x0, y0, x1, y1, bend, w, col) {
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(mx - (dy / L) * bend, my + (dx / L) * bend, x1, y1);
  ctx.lineWidth = w; ctx.strokeStyle = col; ctx.lineCap = 'round'; ctx.stroke();
}
/**
 * drawGuy(ctx, {x, y (ground point), s, rot, squash, armL:[x,y], armR:[x,y], legL, legR, alpha, tint})
 * Body units: torso 150 wide x 190 tall, centred at (0,0); feet at y = 200; head radius 62 at y = -150.
 */
export function drawGuy(ctx, o = {}) {
  const s = o.s ?? 1, sq = o.squash ?? 0;
  const armL = o.armL || [-105, 95], armR = o.armR || [105, 95];
  const legL = o.legL || [-40, 200], legR = o.legR || [40, 200];
  const hood = o.hood || BP.hood, hi = o.hoodHi || BP.hoodHi, skin = o.skin || BP.skin, pants = o.pants || BP.pants;
  ctx.save();
  ctx.globalAlpha *= o.alpha ?? 1;
  ctx.translate(o.x, o.y); ctx.scale(s, s); ctx.translate(0, -200);
  ctx.rotate(o.rot || 0);
  // legs
  limbPath(ctx, -34, 80, legL[0], legL[1] - 12, 8, 30, pants);
  limbPath(ctx, 34, 80, legR[0], legR[1] - 12, -8, 30, pants);
  for (const [lx, ly, d] of [[legL[0], legL[1], -1], [legR[0], legR[1], 1]]) {
    ctx.beginPath(); ctx.ellipse(lx + d * 10, ly - 10, 30, 15, 0, 0, TAU); ctx.fillStyle = BP.cream; ctx.fill();
    ctx.beginPath(); ctx.ellipse(lx + d * 10, ly - 4, 30, 8, 0, 0, Math.PI); ctx.fillStyle = '#E8D9C8'; ctx.fill();
  }
  // torso (squash anchored at hips)
  ctx.save();
  ctx.translate(0, 95); ctx.scale(1 + sq * 0.5, 1 - sq * 0.5); ctx.translate(0, -95);
  // back arm sleeve first? both arms in front for clarity
  // hood (behind head)
  ctx.beginPath(); ctx.ellipse(0, -92, 78, 46, 0, 0, TAU); ctx.fillStyle = hi; ctx.fill();
  // torso shape
  ctx.beginPath();
  ctx.moveTo(-70, -88); ctx.quadraticCurveTo(-82, -40, -76, 96); ctx.lineTo(76, 96); ctx.quadraticCurveTo(82, -40, 70, -88);
  ctx.quadraticCurveTo(0, -112, -70, -88); ctx.closePath();
  ctx.fillStyle = hood; ctx.fill();
  // waistband + pocket
  roundRect(ctx, -78, 78, 156, 22, 9); ctx.fillStyle = hi; ctx.fill();
  roundRect(ctx, -46, 18, 92, 46, 14); ctx.fillStyle = hi; ctx.fill();
  // drawstrings
  ctx.strokeStyle = BP.cream; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-16, -84); ctx.lineTo(-19, -40); ctx.moveTo(16, -84); ctx.lineTo(19, -46); ctx.stroke();
  ctx.fillStyle = BP.cream; ctx.beginPath(); ctx.arc(-19, -38, 5, 0, TAU); ctx.arc(19, -44, 5, 0, TAU); ctx.fill();
  // highlight edge
  ctx.beginPath(); ctx.moveTo(-60, -80); ctx.quadraticCurveTo(-70, -20, -66, 60); ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.stroke();
  // head
  ctx.beginPath(); ctx.arc(0, -150, 62, 0, TAU); ctx.fillStyle = skin; ctx.fill();
  ctx.beginPath(); ctx.arc(-18, -170, 18, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fill();
  // hood rim in front of the neck
  ctx.beginPath(); ctx.ellipse(0, -96, 50, 16, 0, 0, Math.PI); ctx.lineWidth = 12; ctx.strokeStyle = hi; ctx.stroke();
  ctx.restore();
  // arms (sleeves) + hands
  limbPath(ctx, -62, -70, armL[0], armL[1], -14, 32, hood);
  limbPath(ctx, 62, -70, armR[0], armR[1], 14, 32, hood);
  for (const [hx, hy] of [armL, armR]) { ctx.beginPath(); ctx.arc(hx, hy, 21, 0, TAU); ctx.fillStyle = skin; ctx.fill(); }
  const m = ctx.getTransform();
  const toW = (lx, ly) => { const p = m.transformPoint(new DOMPoint(lx, ly)); return [p.x, p.y]; };
  ctx.restore();
  return { hands: { l: toW(...armL), r: toW(...armR) }, head: toW(0, -150) };
}

/** 4-point sparkle */
export function sparkle(ctx, x, y, r, rot = 0) {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) { const a = rot + (i * Math.PI) / 4, rr = i % 2 ? r * 0.22 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  ctx.closePath();
}

/** soft cream paper noise texture (cached) */
export function paperTex(key, w, h, base = BP.cream, seed = 3) {
  const c = buf('g8-paper-' + key, w, h), x = bctx(c);
  if (!c._done) {
    x.fillStyle = base; x.fillRect(0, 0, w, h);
    const r = rng(seed);
    for (let i = 0; i < (w * h) / 60; i++) { x.fillStyle = r() < 0.5 ? 'rgba(120,80,60,0.05)' : 'rgba(255,255,255,0.18)'; x.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); }
    c._done = true;
  }
  return c;
}

export { heart, star, roundRect, noise2 };
