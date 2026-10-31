// B03 — "Thank you for every comment" — Comment vortex.
// ~280 made-up comment cards on a twisting helix, perspective-projected by hand (pure 2D, depth sorted, fogged
// out of the light at the vanishing point). The camera flies down the tunnel and rolls; lyric words fly out of
// the vanishing point; on "comment" a giant speech bubble slams, every card flips to a heart in a wave and hearts burst.
import { shot } from '../../shots.js';
import { W, H, TAU, clamp, lerp, ease, seg, rng, buf, bctx, font, hash } from '../../core/lib.js';
import { A } from '../../core/audio.js';
import { drawMascot } from '../../core/mascot.js';
import { BP, glowSprite, heart, roundRect, sparkle } from './kit.js';

const S = { ...shot('B03'), end: 113.2 };
const T0 = S.start, THANK = 111.02, FOR = 111.84, EVERY = 112.2, COMMENT = 112.74;

const COMMENTS = [
  ['how is this free??', 'late_night_dev'], ['claude cooked', 'render_goblin'], ['WAIT this is code?!', 'ctrl_alt_defeat'],
  ['best video on youtube', 'sleepy_coder'], ['the cursor guy is so cute', 'mochi.makes'], ["I've watched this 11 times", 'frame_by_frame'],
  ['no way this is 100% code', 'curious_cat_dev'], ['my editor is shaking rn', 'keyframe_kid'], ['subscribed instantly', 'tea_and_typescript'],
  ['the bridge hits different', 'lofi.loop'], ["who's here at 3am", 'insomnia_ink'], ['this deserves 10M views', 'vibe.coder'],
  ['teach me pls', 'newbie_nova'], ['the mascot needs merch', 'sticker_goblin'], ['came for the skill, stayed for the song', 'tab_hoarder'],
  ['bro made a music video with ONE prompt', 'semi.colon'], ['okay the easing tho', 'bezier.bee'], ['I need this skill', 'motion_moth'],
  ['THANK YOU', 'grateful_gecko'], ['the VHS part!!', 'retro_rewind'], ['replay button = broken', 'loop_goblin'],
  ['petition for a full album', 'bass.bloop'], ['motion designers in shambles', 'tween_queen'], ['zero AI pixels?? respect', 'pixel_purist'],
  ['the high five got me', 'soft.serve'], ['sending this to my whole team', 'standup_snack'], ["can't stop humming one prompt", 'hum_bug'],
  ['underrated channel', 'quiet_scroller'], ['this is the future', 'future_fern'], ['pin this pls', 'first_frame_fan'],
  ['my jaw is on the floor', 'jaw.drop'], ['this made my day', 'sunny_side_up'], ['first!', 'speedy_snail'],
  ['how long did this take??', 'clockwatcher'], ['the petals!!', 'petal_pusher'], ['love from everywhere', 'globe.trotter'],
];
const CARD_BG = ['#FFFBF4', '#FFFBF4', '#FFFBF4', '#FFE1EB', '#FFE6D6', '#ECE4FF', '#FFF0C7'];
const AV = ['#FF8FB1', '#FFB000', '#C9B6FF', '#FF6A1F', '#7FD6C2', '#FF5C93', '#8FB8FF'];
const CW = 600, CH = 172, SPS = 1.5; // card world size, sprite supersample

function cardSprite(i) {
  const c = buf('B03-card-' + i, CW * SPS + 24, CH * SPS + 30), x = bctx(c);
  if (c._done) return c;
  const r = rng(77 + i * 13), [txt, user] = COMMENTS[i];
  x.save(); x.scale(SPS, SPS); x.translate(6, 6);
  // solid offset shadow + card
  roundRect(x, 6, 10, CW, CH, 30); x.fillStyle = '#7A2E60'; x.fill();
  roundRect(x, 0, 0, CW, CH, 30); x.fillStyle = r.pick(CARD_BG); x.fill();
  x.lineWidth = 5; x.strokeStyle = BP.ink; x.stroke();
  // avatar
  const ac = AV[i % AV.length];
  x.beginPath(); x.arc(70, 66, 42, 0, TAU); x.fillStyle = ac; x.fill(); x.lineWidth = 4; x.strokeStyle = BP.ink; x.stroke();
  x.fillStyle = '#FFFBF4'; x.textAlign = 'center'; x.textBaseline = 'middle'; font(x, 44, 'Anton'); x.fillText(user[0].toUpperCase(), 70, 68);
  // handle + time
  x.textAlign = 'left'; x.textBaseline = 'alphabetic';
  font(x, 26, 'Bricolage Grotesque', '800'); x.fillStyle = BP.ink; x.fillText('@' + user, 130, 48);
  const uw = x.measureText('@' + user).width;
  font(x, 22, 'Bricolage Grotesque', '600'); x.fillStyle = 'rgba(31,42,85,0.45)'; x.fillText(' · ' + r.pick(['now', '2m', '14m', '1h', '3h', '1d', '2d']) + ' ago', 130 + uw, 48);
  // comment text (fit to card)
  let fs = 40; font(x, fs, 'Bricolage Grotesque', '700');
  const tw = x.measureText(txt).width; if (tw > CW - 160) { fs = fs * (CW - 160) / tw; font(x, fs, 'Bricolage Grotesque', '700'); }
  x.fillStyle = BP.ink; x.fillText(txt, 130, 100);
  // likes row
  heart(x, 146, 142, 13); x.fillStyle = '#FF3E7A'; x.fill();
  const likes = r.pick(['2.4K', '318', '12K', '57', '901', '4.7K', '1.1K', '88K', '640']);
  font(x, 24, 'Bricolage Grotesque', '800'); x.fillStyle = '#E8346F'; x.fillText(likes, 166, 150);
  font(x, 22, 'Bricolage Grotesque', '700'); x.fillStyle = 'rgba(31,42,85,0.5)'; x.fillText('REPLY', 270, 150);
  x.fillText('↑  ↓', 370, 150);
  x.restore(); c._done = true; return c;
}
function backSprite() {
  const c = buf('B03-back', CW * SPS + 24, CH * SPS + 30), x = bctx(c);
  if (c._done) return c;
  x.save(); x.scale(SPS, SPS); x.translate(6, 6);
  roundRect(x, 6, 10, CW, CH, 30); x.fillStyle = '#7A2E60'; x.fill();
  roundRect(x, 0, 0, CW, CH, 30); const g = x.createLinearGradient(0, 0, CW, CH); g.addColorStop(0, '#FF7EA8'); g.addColorStop(1, '#FF5C93'); x.fillStyle = g; x.fill();
  x.lineWidth = 5; x.strokeStyle = BP.ink; x.stroke();
  heart(x, CW / 2, CH / 2 + 18, 62); x.fillStyle = '#FFFBF4'; x.fill(); x.lineWidth = 5; x.strokeStyle = BP.ink; x.stroke();
  x.restore(); c._done = true; return c;
}

// helix layout
const N = 230, L = 9200, F = 900;
let CARDS = null;
function cards() {
  if (CARDS) return CARDS;
  const r = rng(303);
  CARDS = Array.from({ length: N }, (_, i) => ({
    z: (i / N) * L + r.range(-12, 12), a: i * 2.39996 + r.range(-0.15, 0.15), rad: r.range(640, 1080),
    sp: i % COMMENTS.length, tilt: r.range(-0.2, 0.2), wob: r.range(0, TAU),
  }));
  return CARDS;
}

// camera travel: integral of a speed profile (closed form via fine fixed-step sum, cached)
let CAMZ = null;
function camZ(t) {
  if (!CAMZ) {
    CAMZ = new Float32Array(400); let z = 0;
    for (let i = 0; i < 400; i++) {
      CAMZ[i] = z; const tt = T0 + i / 120;
      const v = 2300 + 2600 * ease.inQuad(seg(tt, EVERY - 0.3, COMMENT)) + 9000 * Math.exp(-Math.max(0, tt - COMMENT) * 4) * (tt > COMMENT ? 1 : 0) - 1800 * seg(tt, COMMENT + 0.15, S.end);
      z += v / 120;
    }
  }
  const f = clamp((t - T0) * 120, 0, 398.999), i = Math.floor(f);
  return lerp(CAMZ[i], CAMZ[i + 1], f - i);
}

// lyric words flying out of the vanishing point
const WORDS = [[THANK, FOR, 'THANK YOU'], [FOR, EVERY, 'FOR'], [EVERY, COMMENT, 'EVERY'], [COMMENT, 999, 'COMMENT']];

export default {
  ...S,
  cutIn: 'punch',
  sfx: [{ t: THANK, type: 'whoosh', gain: 0.6 }, { t: COMMENT, type: 'impact', gain: 0.9 }, { t: COMMENT + 0.02, type: 'pop', gain: 0.7 }],
  draw(ctx, t, s, E) {
    const lt = t - T0;
    const beat = A.pulse('beat', t, 0.2), hitC = t >= COMMENT ? Math.exp(-(t - COMMENT) * 5) : 0;
    const cz = camZ(t);
    const roll = lt * 0.42 + 0.9 * ease.inOutCubic(seg(t, EVERY - 0.2, COMMENT + 0.3)) + Math.sin(lt * 1.3) * 0.05;
    const cx = W / 2 + Math.sin(lt * 1.1) * 30, cy = H / 2 + Math.cos(lt * 0.9) * 18;

    // ---- tunnel background ----
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 1250);
    bg.addColorStop(0, '#FFF6E6'); bg.addColorStop(0.12, '#FFDC9A'); bg.addColorStop(0.32, '#FFA0B8'); bg.addColorStop(0.62, '#D58CD6'); bg.addColorStop(1, '#7D63D6');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    // spiral wedges (tunnel walls) + streaks
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(roll * 0.7);
    for (let i = 0; i < 16; i++) {
      const a0 = (i / 16) * TAU, a1 = a0 + TAU / 32;
      ctx.beginPath(); ctx.moveTo(0, 0);
      for (let k = 0; k <= 12; k++) { const rr = k * 120, tw = rr * 0.0009; ctx.lineTo(Math.cos(a0 + tw) * rr, Math.sin(a0 + tw) * rr); }
      for (let k = 12; k >= 0; k--) { const rr = k * 120, tw = rr * 0.0009; ctx.lineTo(Math.cos(a1 + tw) * rr, Math.sin(a1 + tw) * rr); }
      ctx.closePath(); ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.fill();
    }
    ctx.restore();
    // tunnel ribs: rings at fixed world z spacing, moving toward camera
    ctx.save(); ctx.lineWidth = 3;
    const RIB = 900;
    for (let k = 0; k < 10; k++) {
      const zr = ((k * RIB - cz) % (RIB * 10) + RIB * 10) % (RIB * 10);
      if (zr < 120) continue;
      const rr = (1000 * F) / zr; if (rr > 2400) continue;
      ctx.globalAlpha = clamp((RIB * 10 - zr) / 3000) * 0.35 * (1 + beat);
      ctx.strokeStyle = '#FFF4EA'; ctx.beginPath(); ctx.arc(cx, cy, rr, 0, TAU); ctx.stroke();
    }
    ctx.restore();
    // speed streaks
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    const sp = 1 + 2.5 * ease.inQuad(seg(t, EVERY - 0.3, COMMENT)) + 3 * hitC;
    for (let i = 0; i < 90; i++) {
      const a = hash(i, 3) * TAU + roll * 0.7, ph = (hash(i, 9) + lt * 0.9 * sp) % 1;
      const r0 = 120 + ph * ph * 1500, len = (40 + 260 * ph) * (0.6 + 0.4 * sp);
      ctx.strokeStyle = `rgba(255,250,235,${(0.45 * ph * (1 - ph) * 4 * 0.5).toFixed(3)})`; ctx.lineWidth = 2 + ph * 4;
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); ctx.lineTo(cx + Math.cos(a) * (r0 + len), cy + Math.sin(a) * (r0 + len)); ctx.stroke();
    }
    ctx.restore();
    // central light
    ctx.globalCompositeOperation = 'screen';
    const gl = glowSprite('#FFF1D0', 256); const gs = 700 + 200 * beat + 900 * hitC;
    ctx.drawImage(gl, cx - gs / 2, cy - gs / 2, gs, gs);
    ctx.globalCompositeOperation = 'source-over';

    // ---- cards (depth sorted far → near) ----
    const C = cards(), vis = [];
    for (const c of C) {
      const zr = ((c.z - cz) % L + L) % L;
      if (zr < 90) continue;
      vis.push([zr, c]);
    }
    vis.sort((a, b) => b[0] - a[0]);
    const back = backSprite();
    let glowDone = false;
    for (const [zr, c] of vis) {
      if (!glowDone && zr < 3800) { // light at the end of the tunnel washes over the distant cards
        glowDone = true; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'screen';
        const gs2 = 1000 + 250 * beat + 900 * hitC; ctx.drawImage(gl, cx - gs2 / 2, cy - gs2 / 2, gs2, gs2); ctx.drawImage(gl, cx - gs2 / 4, cy - gs2 / 4, gs2 / 2, gs2 / 2);
        ctx.globalCompositeOperation = 'source-over';
      }
      const k = F / zr, a = c.a + roll;
      const x = cx + Math.cos(a) * c.rad * k, y = cy + Math.sin(a) * c.rad * k;
      const sc = k * (CW / (CW * SPS));
      const wHalf = CW * k * 0.6;
      if (x < -wHalf - 200 || x > W + wHalf + 200 || y < -wHalf || y > H + wHalf) continue;
      const fog = clamp((L - zr) / 3600) ** 1.5, near = clamp((zr - 120) / 320);
      // flip wave on "comment": cards rotate about their vertical axis, starting from the centre outward
      let yaw = Math.sin(lt * 1.7 + c.wob) * 0.35;
      if (t > COMMENT - 0.05) { const d = (t - COMMENT + 0.05) * 3.2 - (1 - clamp(zr / 4000)) * 0.6; yaw += TAU * ease.inOutCubic(clamp(d)) * 0.5 + (d > 1 ? 0 : 0); }
      const cosy = Math.cos(yaw);
      const showBack = cosy < 0 || (t > COMMENT && t < COMMENT + 0.5 && Math.cos(yaw) < 0.2);
      const spr = showBack ? back : cardSprite(c.sp);
      ctx.globalAlpha = fog * near;
      ctx.setTransform(sc * Math.max(0.04, Math.abs(cosy)), 0, 0, sc, x, y);
      ctx.rotate(c.tilt + 0.42 * Math.sin(a));
      ctx.drawImage(spr, -spr.width / 2, -spr.height / 2);
    }
    ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);

    // ---- heart burst on "comment" ----
    if (t > COMMENT) {
      const tau = t - COMMENT;
      for (let i = 0; i < 70; i++) {
        const a = hash(i, 41) * TAU, v = 0.4 + hash(i, 42) * 0.9;
        const zr = Math.max(60, 2600 - tau * 5200 * v), k = F / zr, rr = (180 + hash(i, 43) * 500) * k * Math.min(1, tau * 6);
        const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr, sz = 70 * k;
        if (sz > 400) continue;
        heart(ctx, x, y, sz); ctx.fillStyle = ['#FF3E7A', '#FF8FB1', '#FFB000', '#FFFBF4'][i % 4]; ctx.fill();
        ctx.lineWidth = Math.max(1, 5 * k); ctx.strokeStyle = BP.ink; ctx.stroke();
      }
    }

    // ---- lyric words out of the vanishing point ----
    for (const [a, b, word] of WORDS) {
      if (t < a - 0.12 || t > b + 0.35) continue;
      const kin = ease.outExpo(seg(t, a - 0.12, a + 0.18));
      const kout = ease.inQuad(seg(t, b - 0.04, b + 0.22));
      const isC = word === 'COMMENT';
      let sc = lerp(0.08, 1, kin) * (1 + 0.06 * (t - a)) + kout * 3.2;
      if (isC) sc = (t < COMMENT ? lerp(0.08, 1, kin) : 1 + 0.5 * Math.exp(-(t - COMMENT) * 14) * Math.cos((t - COMMENT) * 30)) * (1 + 0.05 * (t - a));
      const alpha = clamp(kin * 2) * (1 - clamp(kout * 1.5));
      if (alpha <= 0) continue;
      ctx.save(); ctx.translate(cx, cy); ctx.scale(sc, sc); ctx.rotate(-0.04 + (isC ? 0 : Math.sin(t * 2) * 0.02)); ctx.globalAlpha = alpha;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      if (isC) {
        // giant speech bubble
        const bw = 1180, bh = 360;
        ctx.save(); ctx.translate(10, 18);
        roundRect(ctx, -bw / 2, -bh / 2, bw, bh, 120); ctx.fillStyle = '#7A2E60'; ctx.fill();
        ctx.beginPath(); ctx.moveTo(-330, bh / 2 - 10); ctx.lineTo(-420, bh / 2 + 120); ctx.lineTo(-200, bh / 2 - 10); ctx.closePath(); ctx.fill();
        ctx.restore();
        roundRect(ctx, -bw / 2, -bh / 2, bw, bh, 120); ctx.fillStyle = '#FFFBF4'; ctx.fill(); ctx.lineWidth = 14; ctx.strokeStyle = BP.ink; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-330, bh / 2 - 7); ctx.lineTo(-420, bh / 2 + 120); ctx.lineTo(-200, bh / 2 - 7); ctx.fillStyle = '#FFFBF4'; ctx.fill();
        ctx.beginPath(); ctx.moveTo(-330, bh / 2 + 4); ctx.lineTo(-420, bh / 2 + 120); ctx.lineTo(-200, bh / 2 + 4); ctx.stroke();
        font(ctx, 250, 'Anton'); ctx.fillStyle = '#FF5C93'; ctx.fillText('COMMENT', 9, 14); ctx.fillStyle = BP.ink; ctx.fillText('COMMENT', 0, 4);
        heart(ctx, 520, -150, 60 + 10 * beat); ctx.fillStyle = '#FF3E7A'; ctx.fill(); ctx.lineWidth = 10; ctx.strokeStyle = BP.ink; ctx.stroke();
        ctx.fillStyle = '#FFB000'; sparkle(ctx, -560, -170, 60, t * 2); ctx.fill(); ctx.stroke();
      } else {
        const fs = word === 'THANK YOU' ? 260 : 300;
        font(ctx, fs, 'Anton');
        ctx.lineJoin = 'round'; ctx.lineWidth = 26; ctx.strokeStyle = BP.ink; ctx.strokeText(word, 0, 0);
        ctx.fillStyle = '#FF5C93'; ctx.fillText(word, 10, 12);
        ctx.fillStyle = '#FFFBF4'; ctx.fillText(word, 0, 0);
      }
      ctx.restore();
    }

    E.fx.bloom = 0.25 + 0.4 * hitC; E.fx.bloomThreshold = 0.82;
    if (hitC > 0) { E.fx.shake = 16 * hitC; E.fx.rgb = 8 * hitC; E.fx.flash = [1, 0.85, 0.92, 0.35 * Math.exp(-(t - COMMENT) * 18)]; }
    E.fx.radialBlur = 0.1 * ease.inQuad(seg(t, EVERY - 0.2, COMMENT)) + 0.2 * hitC; E.fx.center = [cx / W, 1 - cy / H];
  },
};
