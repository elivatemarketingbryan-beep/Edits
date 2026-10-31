// Shared particle field for I03 → I04: the typed prompt shatters into ~12k particles, becomes a spiral galaxy,
// spells ALIVE, collapses into a vortex and finally lands on CURSOR's silhouette. Closed-form (pure function of t).
import { W, H, TAU, rng, shapePoints, textPoints, font } from '../../core/lib.js';
import { mascotPoints } from '../../core/mascot.js';
import { PROMPT } from './I02.js';

export const VORTEX = { x: W / 2, y: 500 };
let P = null;

export function particles() {
  if (P) return P;
  // sample the exact I02 layout: "> one prompt" + the log lines
  const pts = shapePoints('intro-prompt', (x) => {
    x.fillStyle = '#fff'; x.textAlign = 'left'; x.textBaseline = 'middle';
    font(x, PROMPT.size, 'JetBrains Mono', '800'); x.fillText('> ' + PROMPT.text, PROMPT.x0, PROMPT.y0);
    x.fillRect(PROMPT.x0 + x.measureText('> ' + PROMPT.text).width + 9, PROMPT.y0 - PROMPT.size * 0.56, PROMPT.size * 0.6, PROMPT.size * 1.12);
    font(x, 34, 'JetBrains Mono', '700');
    ['▸ reading prompt ............ ok', '▸ writing 88 scenes ......... ok', '▸ drawing 4,950 frames ...... ok', '▸ AI-generated pixels ....... 0', '▸ cost ...................... $0.00']
      .forEach((s, i) => x.fillText(s, PROMPT.x0, PROMPT.y0 + 120 + i * 50));
  }, 4);
  const r = rng(42);
  const src = pts.filter(() => r() < 0.85).slice(0, 12000);
  const alive = textPoints('ALIVE', { size: 470, family: 'Anton', step: 5 });
  const body = mascotPoints('intro', {}, 5);
  const N = src.length;
  const X0 = new Float32Array(N), Y0 = new Float32Array(N), BX = new Float32Array(N), BY = new Float32Array(N);
  const GR = new Float32Array(N), GA = new Float32Array(N), GW = new Float32Array(N);
  const AX = new Float32Array(N), AY = new Float32Array(N), MX = new Float32Array(N), MY = new Float32Array(N);
  const D = new Float32Array(N), C = new Uint8Array(N), SZ = new Float32Array(N);
  const cx = W / 2, cy = PROMPT.y0;
  for (let i = 0; i < N; i++) {
    const p = src[i];
    X0[i] = p.x + W / 2; Y0[i] = p.y + H / 2;
    const dx = X0[i] - cx, dy = Y0[i] - cy, L = Math.hypot(dx, dy) + 1, sp = 180 + r() * 620;
    BX[i] = X0[i] + (dx / L) * sp + r.gauss() * 120; BY[i] = Y0[i] + (dy / L) * sp * 0.8 + r.gauss() * 120;
    const arm = i % 3, rad = 40 + Math.pow(r(), 0.7) * 560;
    GR[i] = rad; GA[i] = (arm * TAU) / 3 + rad * 0.011 + r.gauss() * 0.28; GW[i] = 2.4 / Math.sqrt(rad / 80 + 0.4);
    const a = alive[Math.floor(r() * alive.length)]; AX[i] = a.x + W / 2 + r.gauss() * 1.5; AY[i] = a.y + H / 2 + r.gauss() * 1.5;
    const m = body[Math.floor(r() * body.length)]; MX[i] = m.x + W / 2; MY[i] = m.y + H / 2;
    D[i] = r(); C[i] = r() < 0.55 ? 0 : r() < 0.45 ? 1 : 2; SZ[i] = 1.6 + r() * 2.2;
  }
  P = { N, X0, Y0, BX, BY, GR, GA, GW, AX, AY, MX, MY, D, C, SZ };
  return P;
}

export const COLORS = ['#FF6A1F', '#FFD9B0', '#FF3E2A'];

export const galaxy = (i, t, out) => {
  const a = P.GA[i] + P.GW[i] * (t - 2.4), r = P.GR[i];
  out[0] = W / 2 + Math.cos(a) * r * 1.25; out[1] = H / 2 + Math.sin(a) * r * 0.5;
};
export const vortex = (i, t, out, shrink) => {
  const r = (20 + P.GR[i] * 0.14) * shrink, a = P.GA[i] * 3 + t * (9 + P.D[i] * 6);
  out[0] = VORTEX.x + Math.cos(a) * r; out[1] = VORTEX.y + Math.sin(a) * r * 0.8;
};

/** draw all particles as short motion streaks; posFn(i, t, out) gives the position */
export function drawStreaks(ctx, t, posFn, { width = 2.6, alpha = 1, dt = 1 / 45 } = {}) {
  const a = [0, 0], b = [0, 0];
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; ctx.globalAlpha = alpha;
  for (let c = 0; c < 3; c++) {
    ctx.beginPath();
    for (let i = 0; i < P.N; i++) {
      if (P.C[i] !== c) continue;
      posFn(i, t, a); posFn(i, t - dt, b);
      let dx = a[0] - b[0], dy = a[1] - b[1];
      if (dx * dx + dy * dy < 1) { dx = 0.8; dy = 0; b[0] = a[0] - dx; b[1] = a[1]; }
      ctx.moveTo(b[0], b[1]); ctx.lineTo(a[0], a[1]);
    }
    ctx.strokeStyle = COLORS[c]; ctx.lineWidth = width; ctx.stroke();
  }
  ctx.restore();
}
