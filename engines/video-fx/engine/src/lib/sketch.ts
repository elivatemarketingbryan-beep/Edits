// Hand-drawn geometry helpers for the sketchy effects (Doodle Boil, Paper Cut).
// Everything is deterministic: the same inputs and "boil step" give the same wobble,
// so lines only change when the step changes (the hand-drawn "boil" look).
import { random } from "remotion";

export type Pt = [number, number];

// ---------- noise ----------
const hash3 = (x: number, y: number, z: number) => random(`h${x}|${y}|${z}`) * 2 - 1;
const fade = (t: number) => t * t * (3 - 2 * t);

/** Smooth 2-D value noise in [-1, 1], with an integer "step" that reseeds the field. */
export function noise2(x: number, y: number, step: number): number {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = fade(xf), v = fade(yf);
  const a = hash3(xi, yi, step), b = hash3(xi + 1, yi, step);
  const c = hash3(xi, yi + 1, step), d = hash3(xi + 1, yi + 1, step);
  return (a + (b - a) * u) * (1 - v) + (c + (d - c) * u) * v;
}

/** Seeded random in [a, b]. */
export const rnd = (seed: string, a = 0, b = 1) => a + (b - a) * random(seed);

// ---------- polylines ----------
const dist = (a: Pt, b: Pt) => Math.hypot(b[0] - a[0], b[1] - a[1]);

export function flatToPts(flat: number[]): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i + 1 < flat.length; i += 2) out.push([flat[i], flat[i + 1]]);
  return out;
}

/** Evenly spaced points along a polyline (closed: wraps around). */
export function resample(pts: Pt[], spacing: number, closed: boolean): Pt[] {
  if (pts.length < 2) return pts.slice();
  const src = closed ? [...pts, pts[0]] : pts;
  const out: Pt[] = [src[0]];
  let carry = 0;
  for (let i = 1; i < src.length; i++) {
    const a = src[i - 1], b = src[i];
    const seg = dist(a, b);
    if (seg === 0) continue;
    let d = spacing - carry;
    while (d <= seg) {
      const t = d / seg;
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
      d += spacing;
    }
    carry = seg - (d - spacing);
  }
  if (!closed) out.push(src[src.length - 1]);
  else if (out.length > 2 && dist(out[out.length - 1], out[0]) < spacing * 0.5) out.pop();
  return out;
}

/** Moving-average smoothing (closed wraps, open keeps the end points). */
export function smooth(pts: Pt[], radius: number, closed: boolean, passes = 1): Pt[] {
  let cur = pts;
  const n = pts.length;
  if (n < 3) return pts;
  for (let p = 0; p < passes; p++) {
    const next: Pt[] = [];
    for (let i = 0; i < n; i++) {
      if (!closed && (i < radius || i >= n - radius)) {
        next.push(cur[i]);
        continue;
      }
      let sx = 0, sy = 0, c = 0;
      for (let k = -radius; k <= radius; k++) {
        const j = closed ? (i + k + n) % n : i + k;
        sx += cur[j][0];
        sy += cur[j][1];
        c++;
      }
      next.push([sx / c, sy / c]);
    }
    cur = next;
  }
  return cur;
}

/** Unit normals; pointing away from `center` on average. */
export function normals(pts: Pt[], closed: boolean, center: Pt): Pt[] {
  const n = pts.length;
  const ns: Pt[] = pts.map((_, i) => {
    const a = pts[closed ? (i - 1 + n) % n : Math.max(0, i - 1)];
    const b = pts[closed ? (i + 1) % n : Math.min(n - 1, i + 1)];
    const tx = b[0] - a[0], ty = b[1] - a[1];
    const l = Math.hypot(tx, ty) || 1;
    return [ty / l, -tx / l];
  });
  let s = 0;
  pts.forEach((p, i) => (s += ns[i][0] * (p[0] - center[0]) + ns[i][1] * (p[1] - center[1])));
  return s < 0 ? ns.map(([x, y]) => [-x, -y] as Pt) : ns;
}

/** Push every point along its normal by `offset` plus a noise wobble of `amp` px. */
export function wobble(pts: Pt[], nrm: Pt[], offset: number, amp: number, step: number, scale = 70, seed = 0): Pt[] {
  return pts.map((p, i) => {
    const w = amp * noise2(p[0] / scale + seed * 13.1, p[1] / scale, step);
    const tw = amp * 0.5 * noise2(p[1] / scale + 7.7, p[0] / scale + seed, step + 101);
    const [nx, ny] = nrm[i];
    return [p[0] + nx * (offset + w) - ny * tw, p[1] + ny * (offset + w) + nx * tw];
  });
}

/** Jitter arbitrary points (doodles) with a per-step offset. */
export function jitter(pts: Pt[], amp: number, step: number, seed: string): Pt[] {
  return pts.map((p, i) => [p[0] + amp * (random(`${seed}x${i}|${step}`) * 2 - 1), p[1] + amp * (random(`${seed}y${i}|${step}`) * 2 - 1)]);
}

/** Smooth SVG path through points (quadratic curves through midpoints). */
export function smoothPath(pts: Pt[], closed: boolean): string {
  if (pts.length < 2) return "";
  if (pts.length === 2) return `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}L${pts[1][0].toFixed(1)},${pts[1][1].toFixed(1)}`;
  const mid = (a: Pt, b: Pt): Pt => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const f = (p: Pt) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;
  if (closed) {
    const n = pts.length;
    let d = `M${f(mid(pts[n - 1], pts[0]))}`;
    for (let i = 0; i < n; i++) d += `Q${f(pts[i])} ${f(mid(pts[i], pts[(i + 1) % n]))}`;
    return d + "Z";
  }
  let d = `M${f(pts[0])}`;
  for (let i = 1; i < pts.length - 1; i++) d += `Q${f(pts[i])} ${f(mid(pts[i], pts[i + 1]))}`;
  return d + `L${f(pts[pts.length - 1])}`;
}

/** Straight-segment SVG path (for crayon hatching with sharp turns). */
export function linePath(pts: Pt[]): string {
  return pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join("");
}

export function polyLength(pts: Pt[], closed: boolean): number {
  let l = 0;
  for (let i = 1; i < pts.length; i++) l += dist(pts[i - 1], pts[i]);
  if (closed && pts.length > 2) l += dist(pts[pts.length - 1], pts[0]);
  return l;
}

// ---------- shapes (in a local box centred on 0,0, size 1 ≈ 100px before scaling) ----------

/** Scribble fill: a back-and-forth zigzag covering a w×h box, slightly irregular. */
export function zigzag(x: number, y: number, w: number, h: number, strokes: number, seed: string, vertical = true, slant = 0.25, vary = 0.06): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i <= strokes; i++) {
    const t = Math.min(1, Math.max(0, (i + rnd(`${seed}t${i}`, -0.35, 0.35) * vary * 8) / strokes));
    const up = i % 2 === 0;
    const jitterA = rnd(`${seed}a${i}`, -vary, vary);
    const jitterB = rnd(`${seed}b${i}`, -vary * 1.3, vary * 0.7);
    if (vertical) {
      const px = x + w * t + (w * slant * (up ? 0 : 1)) / strokes;
      pts.push([px, y + h * (up ? jitterB + 0.02 : 1 - jitterB - 0.02) + h * jitterA]);
    } else {
      const py = y + h * t;
      pts.push([x + w * (up ? jitterB + 0.02 : 1 - jitterB - 0.02) + w * jitterA, py]);
    }
  }
  return pts;
}

/** Hand-drawn ellipse that overshoots its start (about 1.08 turns), as points. */
export function handEllipse(cx: number, cy: number, rx: number, ry: number, seed: string, turns = 1.1, tilt = -0.06): Pt[] {
  const n = 64;
  const start = rnd(`${seed}s`, -2.6, -2.0);
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = start + t * Math.PI * 2 * turns;
    const r = 1 + 0.05 * Math.sin(a * 2 + rnd(`${seed}p`, 0, 6)) + (t - 0.5) * 0.06;
    const ex = Math.cos(a) * rx * r, ey = Math.sin(a) * ry * r;
    pts.push([cx + ex * Math.cos(tilt) - ey * Math.sin(tilt), cy + ex * Math.sin(tilt) + ey * Math.cos(tilt)]);
  }
  return pts;
}

/** Slightly wonky rectangle, drawn as one stroke that overlaps its start. */
export function roughRect(x: number, y: number, w: number, h: number, seed: string): Pt[] {
  const j = (k: string) => rnd(`${seed}${k}`, -0.035, 0.035);
  return [
    [x + w * j("a"), y + h * j("b")],
    [x + w * (1 + j("c")), y + h * j("d")],
    [x + w * (1 + j("e")), y + h * (1 + j("f"))],
    [x + w * j("g"), y + h * (1 + j("h"))],
    [x + w * (0.02 + j("i")), y + h * (0.06 + j("k"))],
  ];
}

/** Points along a polyline with straight segments subdivided (so jitter bends them a little). */
export function subdivide(pts: Pt[], maxSeg: number): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    const n = Math.max(1, Math.ceil(dist(a, b) / maxSeg));
    for (let k = 0; k < n; k++) out.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]);
  }
  out.push(pts[pts.length - 1]);
  return out;
}

/** Heart outline (unit ≈ radius 1, centred), as a closed polyline. */
export function heartPts(cx: number, cy: number, s: number): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i <= 48; i++) {
    const t = (i / 48) * Math.PI * 2;
    const x = 16 * Math.sin(t) ** 3;
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    pts.push([cx + (x / 17) * s, cy + (y / 17) * s]);
  }
  return pts;
}

/** Five-point star outline. */
export function starPts(cx: number, cy: number, s: number, rot = -Math.PI / 2): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i <= 10; i++) {
    const r = i % 2 === 0 ? s : s * 0.45;
    const a = rot + (i * Math.PI) / 5;
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return pts;
}

/** Cursive loop squiggle ("ꝏꝏꝏ") along a line. */
export function loops(x: number, y: number, w: number, h: number, count: number): Pt[] {
  const pts: Pt[] = [];
  const n = count * 24;
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * count * Math.PI * 2;
    pts.push([x + (w * i) / n - Math.sin(t) * h * 0.45, y - (1 - Math.cos(t)) * h * 0.5]);
  }
  return pts;
}
