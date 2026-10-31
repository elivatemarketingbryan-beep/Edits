// Tiny 2D rigid-body domino solver (pure, deterministic). Bodies are rectangles that tip clockwise about
// their bottom-right corner. Integrates θ'' = 1.5·g·sin(θ − θc)/L (rod about its corner), detects the
// moment a top-right corner hits the next body's left edge (impulse exchange with restitution), then keeps
// the striker leaning on it (contact projection), and bounces bodies off the ground.
export function makeBodies(spec) {
  return spec.map((b) => ({ ...b, th: 0, om: 0, hit: false, rest: false, groundHits: 0, tHit: -1, tGround: -1 }));
}
const corner = (b, th) => [b.px + b.h * Math.sin(th), -b.h * Math.cos(th)]; // top-right corner (y up negative)
function edgeDist(Q, b) { // signed distance of Q from b's left edge (negative = inside b)
  const c = Math.cos(b.th), s = Math.sin(b.th);
  const BL = [b.px - b.w * c, -b.w * s];
  const n = [-c, -s];
  const d = (Q[0] - BL[0]) * n[0] + (Q[1] - BL[1]) * n[1];
  const along = ((Q[0] - BL[0]) * s + (Q[1] - BL[1]) * -c) / b.h; // 0 at bottom … 1 at top of the edge
  return { d, along };
}
export function step(bodies, dt, g, time) {
  const n = bodies.length;
  for (const b of bodies) {
    const L = Math.hypot(b.w, b.h), thc = Math.atan2(b.w, b.h);
    const acc = (1.5 * g * Math.sin(b.th - thc)) / L;
    if (b.th <= 0 && b.om <= 0 && acc < 0) { b.th = 0; b.om = 0; continue; }
    b.om += acc * dt; b.th += b.om * dt;
    if (b.th < 0) { b.th = 0; b.om = 0; }
    const flat = b.flat ?? Math.PI / 2;
    if (b.th > flat) { b.th = flat; if (b.om > 0) { b.groundHits++; if (b.tGround < 0) b.tGround = time; b.om = -b.om * (b.e ?? 0.32); if (Math.abs(b.om) < 0.6) b.om = 0; } }
  }
  for (let iter = 0; iter < 3; iter++) for (let i = 0; i < n - 1; i++) {
    const a = bodies[i], b = bodies[i + 1];
    const Q = corner(a, a.th);
    const { d, along } = edgeDist(Q, b);
    if (d >= 0 || along < -0.05 || along > 1.05) continue;
    if (!a.hit) { // first impact: impulse exchange
      a.hit = true; a.tHit = time;
      const kk = b.k ?? 1.06;
      b.om = Math.max(b.om, a.om * kk * (a.h / b.h));
      a.om *= 0.55;
    }
    // project: rotate a back until its corner touches b's edge (bisection)
    let lo = 0, hi = a.th;
    for (let k = 0; k < 14; k++) { const m = (lo + hi) / 2; if (edgeDist(corner(a, m), b).d < 0) hi = m; else lo = m; }
    const nt = lo;
    if (nt < a.th) { a.th = nt; a.om = Math.min(a.om, b.om); }
    // the leaning weight keeps pushing b
    b.om += 0.7 * (1.5 * g / Math.hypot(b.w, b.h)) * dt * (a.h / b.h);
  }
}
