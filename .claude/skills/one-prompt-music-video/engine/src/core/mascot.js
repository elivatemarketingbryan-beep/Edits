// "CURSOR" — the star of the local cut. A living block cursor (the one prompt, come alive),
// drawn entirely in code: rubber-hose limbs, cursor-shaped pupils, a lip-synced mouth driven
// by the vocal stem (A.mouth), and a pose library locked to the beat grid.
//
// drawMascot(ctx, {x, y, s, t, pose, ...}) — (x, y) is the point on the ground between the feet.
// Body units: the body block is 170×230, centred at (0,0); feet rest at y = 185.
import { A } from './audio.js';
import { TAU, clamp, lerp, ease, PAL, roundRect, heart, star, buf, bctx, W, H, shapePoints } from './lib.js';

export const MASCOT = {
  body: '#FF6A1F', bodyTop: '#FF9446', bodyBot: '#EE4E12',
  ink: '#1F2A55', white: '#FFFFFF', cheek: '#FF4F7B', mouthIn: '#7A1020', tongue: '#FF7A90',
  BW: 170, BH: 230, FEET: 185,
};

// ---------- poses: return limb targets in body units ----------
export function pose(name, t = 0, opts = {}) {
  const bt = A.beat(t), ph = bt.phase, bi = bt.i;
  const hit = Math.exp(-ph * 5);              // 1 on the beat, decays
  const sw = Math.sin((bi + ph) * Math.PI);   // swings once per 2 beats
  const P = { armL: [-125, 70], armR: [125, 70], legL: [-42, 185], legR: [42, 185], squash: 0, rot: 0, bob: 0, look: [0, 0], lean: 0 };
  switch (name) {
    case 'idle': {
      const br = Math.sin(t * 2.2);
      P.armL = [-122, 78 + br * 4]; P.armR = [122, 78 - br * 4]; P.squash = br * 0.02; P.look = [Math.sin(t * 0.7) * 0.4, 0];
      break;
    }
    case 'dance': {
      const up = bi % 2 === 0;
      P.squash = hit * 0.16 - 0.04; P.bob = -Math.abs(Math.sin(ph * Math.PI)) * 26;
      P.rot = sw * 0.09; P.lean = sw * 0.12;
      P.armL = up ? [-150, -150 + hit * 30] : [-150, 40]; P.armR = up ? [150, 40] : [150, -150 + hit * 30];
      P.legL = [-50 - sw * 14, 185]; P.legR = [50 - sw * 14, 185 - (up ? 0 : 18 * Math.sin(ph * Math.PI))];
      P.look = [sw * 0.6, -0.2];
      break;
    }
    case 'bounce': { // simple on-beat bop, arms swinging
      P.squash = hit * 0.2 - 0.05; P.bob = -Math.sin(ph * Math.PI) * 30;
      P.armL = [-140, 40 - Math.sin(ph * Math.PI) * 60]; P.armR = [140, 40 - Math.sin(ph * Math.PI) * 60];
      break;
    }
    case 'wave': {
      const w = Math.sin(t * 14);
      P.armR = [150 + w * 40, -170]; P.armL = [-120, 80]; P.rot = -0.05; P.squash = hit * 0.06;
      break;
    }
    case 'point': { // pointing at the viewer / to the right
      P.armR = [250, -40]; P.armL = [-118, 70]; P.lean = 0.08; P.look = [0.8, 0]; P.squash = hit * 0.05;
      break;
    }
    case 'pointYou': { // foreshortened point straight at camera
      P.armR = [60, -10]; P.armL = [-118, 70]; P.look = [0, 0.2];
      break;
    }
    case 'cheer': {
      const j = Math.abs(Math.sin(ph * Math.PI));
      P.armL = [-150, -190]; P.armR = [150, -190]; P.bob = -j * 60; P.squash = hit * 0.18 - 0.08 * j;
      P.legL = [-55, 175 - j * 20]; P.legR = [55, 175 - j * 20];
      break;
    }
    case 'heart': {
      P.armL = [-34, -168]; P.armR = [34, -168]; P.squash = hit * 0.05; P.rot = Math.sin(t * 2) * 0.04;
      break;
    }
    case 'sing': { // mic hand at the mouth, other arm out with feeling
      const v = A.env('vocal', t);
      P.armR = [118, 64]; P.armL = [-175, -60 - v * 70]; P.rot = -0.04 - v * 0.04; P.squash = hit * 0.05;
      P.look = [0, -0.3];
      break;
    }
    case 'fly': {
      P.rot = -0.25; P.armR = [190, -180]; P.armL = [-150, 30]; P.legL = [-70, 160]; P.legR = [-20, 175];
      P.squash = -0.06; P.look = [0.8, -0.4];
      break;
    }
    case 'sit': {
      P.legL = [-30, 140]; P.legR = [70, 150]; P.armL = [-130, 90]; P.armR = [130, 90];
      break;
    }
    case 'lounge': { // feet up, hands behind head
      P.rot = -0.35; P.armL = [-60, -140]; P.armR = [60, -140]; P.legL = [120, 130]; P.legR = [170, 110]; P.look = [0.4, -0.2];
      break;
    }
    case 'conduct': { // 4/4 conducting pattern with the right hand
      const b4 = (((bi % 4) + 4) % 4) + ph;
      const pts = [[150, -170], [150, 60], [40, -20], [230, -20], [150, -170]];
      const k = Math.floor(b4), u = ease.inOutQuad(b4 - k);
      const a = pts[k], b = pts[k + 1];
      P.armR = [lerp(a[0], b[0], u), lerp(a[1], b[1], u)]; P.armL = [-160, -80 + Math.sin(t * 3) * 20];
      P.squash = hit * 0.06; P.lean = (P.armR[0] - 150) / 900;
      break;
    }
    case 'type': {
      const k = Math.floor(t * 9) % 2;
      P.armL = [-60, 120 - (k ? 18 : 0)]; P.armR = [60, 120 - (k ? 0 : 18)]; P.look = [0, 0.7]; P.squash = hit * 0.04;
      break;
    }
    case 'bow': {
      P.rot = 0.55; P.armL = [-60, 170]; P.armR = [60, 170]; P.look = [0, 1];
      break;
    }
    case 'jump': {
      P.armL = [-160, -170]; P.armR = [160, -170]; P.legL = [-60, 150]; P.legR = [60, 150]; P.squash = -0.12;
      break;
    }
    case 'surf': {
      P.squash = 0.08 + hit * 0.06; P.armL = [-210, -10 + Math.sin(t * 3) * 30]; P.armR = [200, -40 - Math.sin(t * 3) * 30];
      P.legL = [-80, 185]; P.legR = [80, 185]; P.rot = Math.sin(t * 2.2) * 0.1; P.look = [0.7, 0];
      break;
    }
    case 'shrug': {
      P.armL = [-170, -40]; P.armR = [170, -40]; P.squash = 0.04; P.look = [0, -0.2];
      break;
    }
    case 'run': {
      const c = Math.sin(t * 16);
      P.armL = [-120 + c * 60, 40 - Math.abs(c) * 50]; P.armR = [120 - c * 60, 40 - Math.abs(c) * 50];
      P.legL = [-30 + c * 70, 185 - Math.max(0, c) * 40]; P.legR = [30 - c * 70, 185 - Math.max(0, -c) * 40];
      P.lean = 0.18; P.bob = -Math.abs(c) * 14;
      break;
    }
  }
  return P;
}

// ---------- drawing ----------
function limb(ctx, x0, y0, x1, y1, bend, w, ink) {
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1;
  const cx = mx - (dy / L) * bend, cy = my + (dx / L) * bend;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(cx, cy, x1, y1);
  ctx.lineWidth = w; ctx.strokeStyle = ink; ctx.lineCap = 'round'; ctx.stroke();
}
function glove(ctx, x, y, r, M, style) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU);
  ctx.fillStyle = style === 'silhouette' ? M.ink : M.white; ctx.fill();
  if (style !== 'silhouette') { ctx.lineWidth = 6; ctx.strokeStyle = M.ink; ctx.stroke(); }
}
function shoe(ctx, x, y, dir, M) {
  ctx.beginPath(); ctx.ellipse(x + dir * 10, y - 8, 34, 18, 0, 0, TAU); ctx.fillStyle = M.ink; ctx.fill();
}

/**
 * Draw CURSOR.
 * o: {x, y, s=1, t, pose:'idle'|..., P (pose override object), rot, squash, look:[x,y], blink 0..1 | 'auto',
 *     eyes:'normal'|'happy'|'wink'|'star'|'heart'|'x'|'shades'|'closed', mouth:'auto'|'smile'|'grin'|'o'|'flat'|'open'|{open,wide,round,sss},
 *     style:'flat'|'line'|'silhouette', colors:{body,ink,...}, sticker:bool, glyph:true, alpha, lineGlow }
 * Returns anchors in world space: {head, hands:{l,r}, mouth, eyes, center, s, rot}.
 */
export function drawMascot(ctx, o = {}) {
  const M = { ...MASCOT, ...(o.colors || {}) };
  const t = o.t ?? 0, s = o.s ?? 1, style = o.style || 'flat';
  const P = o.P || pose(o.pose || 'idle', t, o);
  const rot = (o.rot ?? 0) + P.rot, sq = (o.squash ?? 0) + P.squash, lean = P.lean + (o.lean ?? 0);
  const look = o.look || P.look;
  // auto blink: quick blink roughly every 3.1 s, deterministic
  let blink = o.blink ?? 'auto';
  if (blink === 'auto') { const b = (t + 0.7) % 3.1; blink = b < 0.12 ? Math.sin((b / 0.12) * Math.PI) : 0; }
  const sx = 1 + sq * 0.55, sy = 1 - sq * 0.55;

  ctx.save();
  ctx.globalAlpha *= o.alpha ?? 1;
  ctx.translate(o.x ?? W / 2, (o.y ?? H * 0.8) + P.bob * s);
  ctx.scale(s, s);
  ctx.translate(0, -M.FEET);
  // whole-character rotation around the body centre
  ctx.rotate(rot);
  if (o.lineGlow) { ctx.shadowColor = o.lineGlow; ctx.shadowBlur = 30; }

  const ink = style === 'line' ? (o.colors?.ink || M.body) : M.ink;
  const lw = 14;
  // legs (behind body)
  const hipY = M.BH / 2 - 8;
  limb(ctx, -40, hipY, P.legL[0], P.legL[1] - 10, 10, lw, ink);
  limb(ctx, 40, hipY, P.legR[0], P.legR[1] - 10, -10, lw, ink);
  if (style !== 'line') { shoe(ctx, P.legL[0], P.legL[1], -1, { ...M, ink }); shoe(ctx, P.legR[0], P.legR[1], 1, { ...M, ink }); }
  else { ctx.lineWidth = 8; ctx.strokeStyle = ink; ctx.beginPath(); ctx.ellipse(P.legL[0] - 10, P.legL[1] - 8, 34, 18, 0, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.ellipse(P.legR[0] + 10, P.legR[1] - 8, 34, 18, 0, 0, TAU); ctx.stroke(); }

  // body with squash anchored at the bottom + lean (skew)
  ctx.save();
  ctx.translate(0, M.BH / 2); ctx.transform(sx, 0, -lean, sy, 0, 0); ctx.translate(0, -M.BH / 2);
  const bw = M.BW, bh = M.BH;
  if (o.sticker && style === 'flat') { roundRect(ctx, -bw / 2, -bh / 2, bw, bh, 38); ctx.lineWidth = 26; ctx.strokeStyle = '#fff'; ctx.stroke(); }
  roundRect(ctx, -bw / 2, -bh / 2, bw, bh, 38);
  if (style === 'flat') {
    const g = ctx.createLinearGradient(0, -bh / 2, 0, bh / 2); g.addColorStop(0, M.bodyTop); g.addColorStop(0.55, M.body); g.addColorStop(1, M.bodyBot);
    ctx.fillStyle = o.colors?.body ? M.body : g; ctx.fill();
    ctx.lineWidth = 8; ctx.strokeStyle = M.ink; ctx.stroke();
    // gloss
    ctx.save(); roundRect(ctx, -bw / 2 + 16, -bh / 2 + 14, 22, 70, 11); ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fill();
    roundRect(ctx, -bw / 2 + 16, -bh / 2 + 92, 22, 16, 8); ctx.fill(); ctx.restore();
  } else if (style === 'silhouette') { ctx.fillStyle = M.ink; ctx.fill(); }
  else { ctx.lineWidth = 10; ctx.strokeStyle = ink; ctx.stroke(); }

  if (style !== 'silhouette') {
    // ---- face ----
    const eyeY = -48, eyeX = 38;
    const eyes = o.eyes || 'normal';
    const faceInk = style === 'line' ? ink : M.ink;
    const drawEye = (ex, closed) => {
      if (eyes === 'happy' || closed >= 0.98) { ctx.beginPath(); if (eyes === 'happy') ctx.arc(ex, eyeY + 10, 18, Math.PI * 1.1, Math.PI * 1.9); else { ctx.moveTo(ex - 18, eyeY + 6); ctx.lineTo(ex + 18, eyeY + 6); } ctx.lineWidth = 8; ctx.strokeStyle = faceInk; ctx.lineCap = 'round'; ctx.stroke(); return; }
      if (eyes === 'x') { ctx.lineWidth = 8; ctx.strokeStyle = faceInk; ctx.beginPath(); ctx.moveTo(ex - 14, eyeY - 14); ctx.lineTo(ex + 14, eyeY + 14); ctx.moveTo(ex + 14, eyeY - 14); ctx.lineTo(ex - 14, eyeY + 14); ctx.stroke(); return; }
      if (eyes === 'star') { star(ctx, ex, eyeY, 26, 11, 5); ctx.fillStyle = style === 'line' ? ink : '#FFE14D'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = faceInk; ctx.stroke(); return; }
      if (eyes === 'heart') { heart(ctx, ex, eyeY + 8, 24); ctx.fillStyle = style === 'line' ? ink : '#FF2D6F'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = faceInk; ctx.stroke(); return; }
      const eh = 50 * (1 - closed), ew = 38;
      roundRect(ctx, ex - ew / 2, eyeY - eh / 2, ew, Math.max(eh, 4), 14);
      if (style === 'line') { ctx.lineWidth = 6; ctx.strokeStyle = ink; ctx.stroke(); }
      else { ctx.fillStyle = M.white; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = M.ink; ctx.stroke(); }
      if (eh > 14) { // cursor-shaped pupil
        const px = ex + clamp(look[0], -1, 1) * 7, py = eyeY + clamp(look[1], -1, 1) * 9;
        const ph = Math.min(28, eh - 12);
        roundRect(ctx, px - 8, py - ph / 2, 16, ph, 4); ctx.fillStyle = faceInk; ctx.fill();
        if (style !== 'line') { ctx.beginPath(); ctx.arc(px - 2, py - ph / 2 + 6, 3.5, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill(); }
      }
    };
    if (eyes === 'shades') {
      ctx.fillStyle = M.ink; roundRect(ctx, -76, eyeY - 22, 66, 40, 12); ctx.fill(); roundRect(ctx, 10, eyeY - 22, 66, 40, 12); ctx.fill();
      ctx.fillRect(-12, eyeY - 14, 24, 7);
      ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillRect(-64, eyeY - 14, 18, 6); ctx.fillRect(22, eyeY - 14, 18, 6);
    } else if (eyes === 'wink') { drawEye(-eyeX, 0); ctx.beginPath(); ctx.arc(eyeX, eyeY + 10, 18, Math.PI * 1.1, Math.PI * 1.9); ctx.lineWidth = 8; ctx.strokeStyle = faceInk; ctx.lineCap = 'round'; ctx.stroke(); }
    else { drawEye(-eyeX, blink); drawEye(eyeX, blink); }

    // cheeks
    if (style === 'flat') { ctx.fillStyle = 'rgba(255,60,110,0.42)'; ctx.beginPath(); ctx.ellipse(-62, 2, 16, 10, 0, 0, TAU); ctx.ellipse(62, 2, 16, 10, 0, 0, TAU); ctx.fill(); }

    // mouth
    let m = o.mouth ?? 'smile';
    if (m === 'auto') m = A.mouth(t);
    const my = 18;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (typeof m === 'object') {
      const open = clamp(m.open * 1.25), wd = clamp(m.wide), rd = clamp(m.round), ss = clamp(m.sss);
      const mw = 26 + wd * 30 - rd * 10 + open * 8, mh = 6 + open * 44 * (1 - ss * 0.6);
      if (mh < 9 && ss < 0.3) { ctx.beginPath(); ctx.arc(0, my - 14, 22, Math.PI * 0.2, Math.PI * 0.8); ctx.lineWidth = 7; ctx.strokeStyle = faceInk; ctx.stroke(); }
      else {
        ctx.beginPath();
        if (rd > 0.55 && wd < 0.4) ctx.ellipse(0, my, mw * 0.55, mh * 0.6 + 6, 0, 0, TAU);
        else { ctx.moveTo(-mw, my - mh * 0.25); ctx.quadraticCurveTo(0, my - mh * 0.45, mw, my - mh * 0.25); ctx.quadraticCurveTo(mw * 0.9, my + mh, 0, my + mh); ctx.quadraticCurveTo(-mw * 0.9, my + mh, -mw, my - mh * 0.25); }
        ctx.closePath();
        if (style === 'line') { ctx.lineWidth = 6; ctx.strokeStyle = ink; ctx.stroke(); }
        else {
          ctx.fillStyle = M.mouthIn; ctx.fill();
          ctx.save(); ctx.clip();
          if (ss > 0.3 || open > 0.25) { ctx.fillStyle = '#fff'; ctx.fillRect(-mw, my - mh * 0.45 - 2, mw * 2, 9); }
          if (open > 0.3) { ctx.fillStyle = M.tongue; ctx.beginPath(); ctx.ellipse(0, my + mh * 0.85, mw * 0.55, mh * 0.35, 0, 0, TAU); ctx.fill(); }
          ctx.restore();
          ctx.lineWidth = 6; ctx.strokeStyle = M.ink; ctx.stroke();
        }
      }
    } else {
      ctx.lineWidth = 7; ctx.strokeStyle = faceInk;
      if (m === 'smile') { ctx.beginPath(); ctx.arc(0, my - 14, 24, Math.PI * 0.18, Math.PI * 0.82); ctx.stroke(); }
      else if (m === 'flat') { ctx.beginPath(); ctx.moveTo(-18, my); ctx.lineTo(18, my); ctx.stroke(); }
      else if (m === 'o') { ctx.beginPath(); ctx.ellipse(0, my + 6, 13, 17, 0, 0, TAU); ctx.fillStyle = M.mouthIn; ctx.fill(); ctx.stroke(); }
      else if (m === 'grin' || m === 'open') {
        const hgt = m === 'open' ? 46 : 26;
        ctx.beginPath(); ctx.moveTo(-36, my - 8); ctx.quadraticCurveTo(0, my - 2, 36, my - 8); ctx.quadraticCurveTo(30, my + hgt, 0, my + hgt); ctx.quadraticCurveTo(-30, my + hgt, -36, my - 8); ctx.closePath();
        ctx.fillStyle = M.mouthIn; ctx.fill(); ctx.save(); ctx.clip(); ctx.fillStyle = '#fff'; ctx.fillRect(-40, my - 10, 80, 10);
        ctx.fillStyle = M.tongue; ctx.beginPath(); ctx.ellipse(0, my + hgt, 20, 12, 0, 0, TAU); ctx.fill(); ctx.restore(); ctx.stroke();
      }
    }
    // the prompt glyph on the chest
    if (o.glyph !== false) {
      ctx.fillStyle = style === 'line' ? ink : 'rgba(31,42,85,0.85)';
      ctx.font = '800 40px "JetBrains Mono"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const blinkOn = Math.floor(t * 2) % 2 === 0;
      ctx.fillText(blinkOn ? '>_' : '> ', 0, 78);
    }
  }
  ctx.restore(); // body transform

  // arms (in front)
  const shY = 8;
  limb(ctx, -M.BW / 2 + 6, shY, P.armL[0], P.armL[1], -16, lw, ink);
  limb(ctx, M.BW / 2 - 6, shY, P.armR[0], P.armR[1], 16, lw, ink);
  if (style === 'line') { ctx.lineWidth = 7; ctx.strokeStyle = ink; ctx.beginPath(); ctx.arc(P.armL[0], P.armL[1], 20, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(P.armR[0], P.armR[1], 20, 0, TAU); ctx.stroke(); }
  else { glove(ctx, P.armL[0], P.armL[1], 22, M, style); glove(ctx, P.armR[0], P.armR[1], 22, M, style); }
  if (o.over) o.over(ctx, P); // props in body space (e.g. baton in right hand at P.armR)

  // anchors
  const m2 = ctx.getTransform();
  const toW = (lx, ly) => { const p = m2.transformPoint(new DOMPoint(lx, ly)); return [p.x, p.y]; };
  ctx.restore();
  return { head: toW(0, -M.BH / 2), center: toW(0, 0), mouth: toW(0, 18), eyes: [toW(-38, -48), toW(38, -48)], hands: { l: toW(...P.armL), r: toW(...P.armR) }, feet: toW(0, M.FEET), s, rot, P };
}

/** Render the mascot into an offscreen canvas (cached per key). Useful for voxels / particles / ASCII / pixel looks. */
export function mascotSprite(key, o = {}, w = 600, h = 640) {
  const c = buf('mascot-' + key, w, h), x = bctx(c);
  x.clearRect(0, 0, w, h);
  drawMascot(x, { x: w / 2, y: h - 20, s: Math.min(w / 520, h / 600), ...o });
  return c;
}

/** Sample points from the mascot silhouette (cached by key). Points are centred on (0,0); s = scale. */
export function mascotPoints(key, o = {}, step = 6) {
  return shapePoints('mascot-pts-' + key + step, (x) => drawMascot(x, { x: W / 2, y: H / 2 + 150 * 1.6, s: 1.6, mouth: 'smile', ...o }), step);
}
