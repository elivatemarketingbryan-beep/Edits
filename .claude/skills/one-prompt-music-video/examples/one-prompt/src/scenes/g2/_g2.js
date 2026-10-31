// Shared look for group g2 (Verse 1 "PAPER STUDIO" second half + Pre-chorus 1 "SKY BUILD").
// Paper textures, printed hard-shadow type, rubber stamps, camera helpers, paper clouds.
import { W, H, TAU, clamp, lerp, ease, hash, noise2, fbm2, buf, bctx, font, roundRect, hex2rgb, rgb } from '../../core/lib.js';

export const PS = { paper: '#F4EDE0', paper2: '#E9DFCC', ink: '#1F2A55', red: '#E8343F', orange: '#FF6A1F', white: '#FFFBF4', blue: '#3D7FD8', mustard: '#F2B33D', teal: '#2FA39A', pink: '#F27BA5' };
export const SKY = { sky: '#6EC3F0', deep: '#2E8BE0', white: '#FFFFFF', sun: '#FFD23F', ink: '#1F2A55', pale: '#BDE6FB' };

// ---------- paper texture (generated once, multiplied over flat colour) ----------
export function paperTex() {
  const PW = 640, PH = 360;
  const c = buf('g2-paper-tex', PW, PH);
  if (c._done) return c;
  const x = bctx(c), id = x.createImageData(PW, PH), d = id.data;
  for (let j = 0; j < PH; j++) for (let i = 0; i < PW; i++) {
    const n = fbm2(i * 0.018, j * 0.018, 3) * 0.5 + 0.5;            // mottling
    const f = noise2(i * 0.9, j * 0.05) * 0.5 + 0.5;                 // horizontal fibres
    const g = hash(i, j, 3);                                          // tooth
    const v = 255 - n * 16 - f * f * 9 - g * 8;
    const k = (j * PW + i) * 4; d[k] = v; d[k + 1] = v - 2; d[k + 2] = v - 6; d[k + 3] = 255;
  }
  x.putImageData(id, 0, 0);
  // a few long fibres
  x.globalAlpha = 0.07; x.strokeStyle = '#6b5a3a'; x.lineWidth = 0.7;
  for (let i = 0; i < 180; i++) {
    const px = hash(i, 1) * PW, py = hash(i, 2) * PH, a = hash(i, 3) * TAU, L = 6 + hash(i, 4) * 26;
    x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + Math.cos(a + 0.6) * L * 0.5, py + Math.sin(a + 0.6) * L * 0.5, px + Math.cos(a) * L, py + Math.sin(a) * L); x.stroke();
  }
  x.globalAlpha = 1; c._done = true; return c;
}
/** flat colour + paper texture over the full frame (in current transform, covers margin m) */
export function paperBG(ctx, color = PS.paper, amt = 1, m = 0) {
  ctx.fillStyle = color; ctx.fillRect(-m, -m, W + 2 * m, H + 2 * m);
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = amt;
  ctx.drawImage(paperTex(), -m, -m, W + 2 * m, H + 2 * m); ctx.restore();
}
/** graph paper grid */
export function gridLines(ctx, step, color, lw = 1, ox = 0, oy = 0, x0 = 0, y0 = 0, x1 = W, y1 = H) {
  ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.beginPath();
  for (let x = x0 + (((ox - x0) % step) + step) % step; x <= x1; x += step) { ctx.moveTo(x, y0); ctx.lineTo(x, y1); }
  for (let y = y0 + (((oy - y0) % step) + step) % step; y <= y1; y += step) { ctx.moveTo(x0, y); ctx.lineTo(x1, y); }
  ctx.stroke();
}

// ---------- camera ----------
/** apply a camera: look at (cx,cy) world point, zoom, rotation (radians). */
export function cam(ctx, cx = W / 2, cy = H / 2, zoom = 1, rot = 0) {
  ctx.translate(W / 2, H / 2); ctx.rotate(rot); ctx.scale(zoom, zoom); ctx.translate(-cx, -cy);
}
/** beat punch: 1 on the beat → 0 */
export const punch = (since, d = 0.12) => (since < 0 ? 0 : Math.exp(-since / d));

// ---------- type ----------
/** printed type with a hard offset shadow (and optional outline). align/baseline default centre/middle. */
export function shadowText(ctx, str, x, y, { size = 120, family = 'Anton', weight = '400', style = 'normal', fill = PS.ink, shadow = PS.red, off = 8, stroke = null, lw = 0, align = 'center', base = 'middle', spacing = 0 } = {}) {
  font(ctx, size, family, weight, style); ctx.textAlign = align; ctx.textBaseline = base;
  if (spacing) ctx.letterSpacing = spacing + 'px';
  if (shadow) { ctx.fillStyle = shadow; ctx.fillText(str, x + off, y + off); }
  if (stroke && lw) { ctx.lineJoin = 'round'; ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.strokeText(str, x, y); }
  ctx.fillStyle = fill; ctx.fillText(str, x, y);
  if (spacing) ctx.letterSpacing = '0px';
}
/** scale-pop factor for something appearing at t0 (outBack), 0 before */
export const popIn = (t, t0, d = 0.28, s = 2.2) => (t < t0 ? 0 : ease.outBack((t - t0) / d, s));
/** slam-in: big → 1 in d seconds (outExpo); returns scale (0 before) */
export const slam = (t, t0, d = 0.16, from = 2.6) => (t < t0 ? 0 : lerp(from, 1, ease.outExpo((t - t0) / d)));

// ---------- grunge mask (for stamps) ----------
function speckle() {
  const c = buf('g2-speckle', 512, 512);
  if (c._done) return c;
  const x = bctx(c), id = x.createImageData(512, 512), d = id.data;
  for (let j = 0; j < 512; j++) for (let i = 0; i < 512; i++) {
    const n = fbm2(i * 0.03, j * 0.03, 3) + (hash(i, j, 9) - 0.5) * 0.9;
    const a = n > 0.38 ? 255 : n > 0.3 ? 120 : 0;
    const k = (j * 512 + i) * 4; d[k] = d[k + 1] = d[k + 2] = 0; d[k + 3] = a;
  }
  x.putImageData(id, 0, 0); c._done = true; return c;
}
/** cached rubber-stamp sprite: bordered text with worn ink. Returns canvas (centre it yourself). */
export function stampSprite(key, text, { size = 120, family = 'Rubik Mono One', color = PS.red, pad = 34, border = 12, radius = 22, sub = null, subSize = 0, check = false } = {}) {
  const k = 'g2-stamp-' + key;
  const probe = buf('g2-probe', 8, 8), px = bctx(probe);
  font(px, size, family); const tw = px.measureText(text).width + (check ? size * 1.35 : 0);
  const w = Math.ceil(tw + pad * 2 + border * 2), h = Math.ceil(size * 1.05 + pad * 2 + border * 2 + (sub ? subSize * 1.3 : 0));
  const c = buf(k, w + 8, h + 8);
  if (c._done) return c;
  const x = bctx(c); x.clearRect(0, 0, c.width, c.height);
  x.translate(4, 4);
  x.strokeStyle = color; x.lineWidth = border; roundRect(x, border / 2, border / 2, w - border, h - border, radius); x.stroke();
  x.lineWidth = border * 0.35; roundRect(x, border * 1.9, border * 1.9, w - border * 3.8, h - border * 3.8, radius * 0.6); x.stroke();
  x.fillStyle = color; font(x, size, family); x.textAlign = 'center'; x.textBaseline = 'middle';
  const tx = w / 2 + (check ? size * 0.68 : 0), ty = h / 2 + size * 0.04 - (sub ? subSize * 0.62 : 0);
  x.fillText(text, tx, ty);
  if (check) {
    const cx = border + pad + size * 0.5, cy = ty - size * 0.04;
    x.lineWidth = size * 0.2; x.lineCap = 'round'; x.lineJoin = 'round';
    x.beginPath(); x.moveTo(cx - size * 0.38, cy); x.lineTo(cx - size * 0.1, cy + size * 0.3); x.lineTo(cx + size * 0.42, cy - size * 0.4); x.stroke();
  }
  if (sub) { font(x, subSize, 'JetBrains Mono', '800'); x.fillText(sub, w / 2, h / 2 + size * 0.5 + subSize * 0.15); }
  x.globalCompositeOperation = 'destination-out'; x.globalAlpha = 0.85;
  const sp = speckle(); x.drawImage(sp, 0, 0, w, Math.max(h, w * 0.4));
  x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; x.setTransform(1, 0, 0, 1, 0, 0);
  c._done = true; return c;
}
/** draw a stamp slamming at t0: scale from big to 1 with a tiny overshoot, rotation rot. Returns impact 0..1 */
export function drawStamp(ctx, spr, x, y, t, t0, rot = -0.12, scaleTo = 1, comp = 'multiply') {
  if (t < t0) return 0;
  const k = (t - t0) / 0.12;
  const sc = k < 1 ? lerp(2.4, 0.94, ease.inQuad(k)) : lerp(0.94, 1, ease.outBack(clamp((t - t0 - 0.12) / 0.15)));
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc * scaleTo, sc * scaleTo);
  ctx.globalAlpha = clamp(k * 3);
  ctx.globalCompositeOperation = comp;
  ctx.drawImage(spr, -spr.width / 2, -spr.height / 2);
  ctx.restore();
  return k >= 1 ? Math.exp(-(t - t0 - 0.12) / 0.12) : 0;
}

// ---------- paper clouds (sky world) ----------
/** puffy paper-cut cloud: circles on a flat base. Two-tone (shade crescent at the bottom), optional outline + drop shadow. */
export function cloud(ctx, x, y, s, { fill = '#FFFFFF', shade = '#D9ECF7', outline = null, lw = 6, seed = 1, shadow = 'rgba(31,42,85,0.12)' } = {}) {
  const n = 4 + Math.floor(hash(seed, 7) * 3);
  const blobs = [];
  for (let i = 0; i < n; i++) {
    const u = n === 1 ? 0 : (i / (n - 1)) * 2 - 1;
    const r = (0.36 + 0.42 * (1 - u * u) + hash(seed, i) * 0.16) * s;
    blobs.push([x + u * s * 1.15, y - r * 0.55, r]);
  }
  const path = (dx = 0, dy = 0) => {
    ctx.beginPath();
    for (const [bx, by, r] of blobs) { ctx.moveTo(bx + dx + r, by + dy); ctx.arc(bx + dx, by + dy, r, 0, TAU); }
  };
  ctx.save();
  // flat bottom: clip everything below the base line
  ctx.beginPath(); ctx.rect(x - s * 4, y - s * 4, s * 8, s * 4); ctx.clip();
  if (shadow) { path(s * 0.07, s * 0.09); ctx.fillStyle = shadow; ctx.fill(); }
  if (outline) { path(); ctx.lineWidth = lw * 2; ctx.strokeStyle = outline; ctx.lineJoin = 'round'; ctx.stroke(); }
  path(); ctx.fillStyle = shade; ctx.fill();
  // lit tops: same blobs nudged up-left, clipped to the silhouette
  path(); ctx.clip();
  ctx.beginPath(); for (const [bx, by, r] of blobs) { ctx.moveTo(bx - s * 0.05 + r * 0.95, by - s * 0.1); ctx.arc(bx - s * 0.05, by - s * 0.1, r * 0.95, 0, TAU); }
  ctx.fillStyle = fill; ctx.fill();
  ctx.restore();
  if (outline) {
    let xl = 1e9, xr = -1e9;
    for (const [bx, by, r] of blobs) { const dy = y - by; if (r > Math.abs(dy)) { const hh = Math.sqrt(r * r - dy * dy); xl = Math.min(xl, bx - hh); xr = Math.max(xr, bx + hh); } }
    if (xr > xl) { ctx.save(); ctx.strokeStyle = outline; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(xl, y - lw / 2); ctx.lineTo(xr, y - lw / 2); ctx.stroke(); ctx.restore(); }
  }
}

/** draw a sprite (canvas) centred */
export function drawC(ctx, img, x, y, sc = 1, rot = 0, alpha = 1) {
  ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(rot); ctx.scale(sc, sc); ctx.globalAlpha *= alpha;
  ctx.drawImage(img, -img.width / 2, -img.height / 2); ctx.restore();
}

/** a wobbly hand-drawn closed loop (grease pencil). returns nothing; draws progress p 0..1 */
export function scribbleEllipse(ctx, cx, cy, rx, ry, p, { seed = 3, turns = 1.18, color = PS.red, width = 14, rot = -0.08 } = {}) {
  if (p <= 0) return;
  const N = 90, end = Math.max(2, Math.floor(N * turns * p));
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
  ctx.strokeStyle = color; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  let prev = null;
  for (let i = 0; i <= end; i++) {
    const a = -Math.PI * 0.6 + (i / N) * TAU;
    const wob = 1 + noise2(i * 0.09, seed) * 0.06 + (i / N) * 0.05;
    const px = Math.cos(a) * rx * wob, py = Math.sin(a) * ry * wob;
    if (prev) {
      const pr = 0.55 + 0.45 * Math.sin(Math.min(1, i / end) * Math.PI); // pressure
      ctx.lineWidth = width * (0.6 + 0.5 * pr);
      ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(px, py); ctx.stroke();
    }
    prev = [px, py];
  }
  ctx.restore();
}

export { rgb, hex2rgb };
