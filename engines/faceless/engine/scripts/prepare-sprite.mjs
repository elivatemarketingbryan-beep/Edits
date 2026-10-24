#!/usr/bin/env node
// Turns whatever sprite images the user made (separate PNG/JPG/WEBP files or one
// sprite sheet) into a clean, aligned pose set the video engine can trust:
//   sprite/poses/<pose>-<state>.png   1254x1254, binary alpha, shared feet line
//   sprite/sprite.json                manifest (geometry, available poses, mouth box)
//   sprite/preview.png                labeled contact sheet to show the user
//
// Usage:
//   node scripts/prepare-sprite.mjs                      (reads ../sprite/raw)
//   node scripts/prepare-sprite.mjs --from "<folder>"
//   node scripts/prepare-sprite.mjs --sheet sheet.png --grid 4x4 --names idle-neutral,idle-talk,...

import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SPRITE_DIR = path.join(ROOT, 'sprite');
const OUT_POSES = path.join(SPRITE_DIR, 'poses');

// Standard geometry every pose is normalized to (matches the reference pack).
const CANVAS = 1254;
const FEET_Y = 1185;
const FIG_H = 1097;
const CENTER_X = 627;

export const POSES = ['idle', 'present-left', 'present-right', 'point-left', 'point-right', 'wave', 'thinking', 'arms-crossed'];
const IDLE_EXTRAS = ['talk-small', 'talk-wide', 'smile', 'surprised'];

const args = parseArgs(process.argv.slice(2));

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const k = argv[i].slice(2);
      const v = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
      out[k] = v;
    }
  }
  return out;
}

// ---------- naming ----------

export function classify(name) {
  const n = name.toLowerCase().replace(/\.[a-z0-9]+$/, '').replace(/[_\s.]+/g, '-');
  let pose = null;
  const side = /left/.test(n) ? 'left' : /right/.test(n) ? 'right' : null;
  if (/cross/.test(n)) pose = 'arms-crossed';
  else if (/present|offer|open-hand|palm/.test(n)) pose = side ? `present-${side}` : null;
  else if (/point/.test(n)) pose = side ? `point-${side}` : null;
  else if (/wav/.test(n)) pose = 'wave';
  else if (/think|ponder|chin/.test(n)) pose = 'thinking';
  else if (/idle|stand|default|base|neutral|talk|smile|surpris|mouth/.test(n)) pose = 'idle';
  if (!pose) return null;

  let state = 'neutral';
  if (/talk-?small|small/.test(n)) state = 'talk-small';
  else if (/talk-?wide|wide/.test(n)) state = 'talk-wide';
  else if (/smil/.test(n)) state = 'smile';
  else if (/surpris|shock|wow/.test(n)) state = 'surprised';
  else if (/talk|speak|open|mouth-open/.test(n)) state = 'talk';
  if (pose !== 'idle' && IDLE_EXTRAS.includes(state)) state = state.startsWith('talk') ? 'talk' : 'neutral';
  return { pose, state };
}

// ---------- pixel helpers ----------

async function loadRGBA(input) {
  const img = sharp(input).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  return { data: new Uint8ClampedArray(data), w: info.width, h: info.height };
}

function cutoutMask({ data, w, h }) {
  const n = w * h;
  let transparent = 0;
  for (let i = 0; i < n; i++) if (data[i * 4 + 3] < 128) transparent++;
  const mask = new Uint8Array(n);
  if (transparent / n > 0.05) {
    for (let i = 0; i < n; i++) mask[i] = data[i * 4 + 3] >= 128 ? 1 : 0;
    return { mask, method: 'alpha' };
  }
  // Opaque image: key out the background colour sampled from the border.
  const border = [];
  for (let x = 0; x < w; x += 2) { border.push(x, (h - 1) * w + x); }
  for (let y = 0; y < h; y += 2) { border.push(y * w, y * w + w - 1); }
  const rs = [], gs = [], bs = [];
  for (const p of border) { rs.push(data[p * 4]); gs.push(data[p * 4 + 1]); bs.push(data[p * 4 + 2]); }
  const med = a => a.sort((x, y) => x - y)[a.length >> 1];
  const bg = [med(rs), med(gs), med(bs)];
  const maxc = Math.max(...bg), minc = Math.min(...bg);
  const chroma = maxc > 0 && (maxc - minc) / maxc > 0.55; // saturated green/magenta/blue screen
  const dist2 = i => {
    const dr = data[i * 4] - bg[0], dg = data[i * 4 + 1] - bg[1], db = data[i * 4 + 2] - bg[2];
    return dr * dr + dg * dg + db * db;
  };
  const tol = chroma ? 110 : 38;
  const near = i => dist2(i) < tol * tol;
  for (let i = 0; i < n; i++) mask[i] = 1;
  // Flood from the border so white sneakers / green eyes inside the outline survive.
  const stack = border.filter(near);
  for (const p of stack) mask[p] = 0;
  while (stack.length) {
    const p = stack.pop(); const x = p % w, y = (p / w) | 0;
    const nb = [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1];
    for (const q of nb) if (q >= 0 && mask[q] && near(q)) { mask[q] = 0; stack.push(q); }
  }
  // A screen colour can also hide in enclosed gaps (between arm and torso); only near-exact matches go.
  if (chroma) for (let i = 0; i < n; i++) if (dist2(i) < 50 * 50) mask[i] = 0;
  return { mask, method: chroma ? `chroma-key rgb(${bg})` : `flood-key rgb(${bg})`, bg, chroma };
}

function keepMainShape(mask, w, h) {
  const label = new Int32Array(w * h).fill(-1);
  const sizes = [];
  for (let i = 0; i < w * h; i++) {
    if (!mask[i] || label[i] >= 0) continue;
    const id = sizes.length; let size = 0; const stack = [i]; label[i] = id;
    while (stack.length) {
      const p = stack.pop(); size++;
      const x = p % w, y = (p / w) | 0;
      const nb = [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1];
      for (const q of nb) if (q >= 0 && mask[q] && label[q] < 0) { label[q] = id; stack.push(q); }
    }
    sizes.push(size);
  }
  if (!sizes.length) return { mask, removed: 0 };
  const biggest = Math.max(...sizes);
  let removed = 0;
  for (let i = 0; i < w * h; i++) {
    if (mask[i] && sizes[label[i]] < biggest * 0.01) { mask[i] = 0; removed++; }
  }
  return { mask, removed };
}

function geometry(mask, w, h) {
  let top = h, bottom = -1, left = w, right = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (mask[y * w + x]) {
    if (y < top) top = y; if (y > bottom) bottom = y; if (x < left) left = x; if (x > right) right = x;
  }
  if (bottom < 0) throw new Error('image is empty after background removal');
  const H = bottom - top + 1;
  // Lower legs sit below every hand position, so they give a stable horizontal centre.
  let sx = 0, c = 0;
  for (let y = Math.round(bottom - H * 0.25); y <= bottom; y++) for (let x = left; x <= right; x++) if (mask[y * w + x]) { sx += x; c++; }
  const centerX = sx / c;
  // Head top: highest pixel near the centre column (ignores raised hands).
  const half = H * 0.12;
  let headTop = top;
  outer: for (let y = top; y <= bottom; y++) for (let x = Math.round(centerX - half); x <= Math.round(centerX + half); x++) {
    if (x >= 0 && x < w && mask[y * w + x]) { headTop = y; break outer; }
  }
  return { top, bottom, left, right, centerX, headTop, figH: bottom - headTop + 1 };
}

async function normalize(file, opts = {}) {
  const src = opts.buffer ? await loadRGBA(opts.buffer) : await loadRGBA(file);
  const { mask, method } = cutoutMask(src);
  const { removed } = keepMainShape(mask, src.w, src.h);
  const g = geometry(mask, src.w, src.h);
  // Binary alpha, background zeroed.
  const rgba = Buffer.alloc(src.w * src.h * 4);
  for (let i = 0; i < src.w * src.h; i++) {
    if (mask[i]) { rgba[i * 4] = src.data[i * 4]; rgba[i * 4 + 1] = src.data[i * 4 + 1]; rgba[i * 4 + 2] = src.data[i * 4 + 2]; rgba[i * 4 + 3] = 255; }
  }
  let scale = FIG_H / g.figH;
  if (Math.abs(scale - 1) < 0.004) scale = 1;
  let img = sharp(rgba, { raw: { width: src.w, height: src.h, channels: 4 } });
  let w = src.w, h = src.h;
  if (scale !== 1) {
    w = Math.round(src.w * scale); h = Math.round(src.h * scale);
    img = sharp(await img.resize(w, h, { kernel: 'nearest' }).raw().toBuffer(), { raw: { width: w, height: h, channels: 4 } });
  }
  const dx = Math.round(CENTER_X - g.centerX * scale);
  const dy = Math.round(FEET_Y - g.bottom * scale);
  // Place on the standard canvas (crop or pad as needed).
  const buf = await img.raw().toBuffer();
  const out = Buffer.alloc(CANVAS * CANVAS * 4);
  for (let y = 0; y < h; y++) {
    const ty = y + dy; if (ty < 0 || ty >= CANVAS) continue;
    for (let x = 0; x < w; x++) {
      const tx = x + dx; if (tx < 0 || tx >= CANVAS) continue;
      const s = (y * w + x) * 4; if (buf[s + 3] < 128) continue;
      const t = (ty * CANVAS + tx) * 4;
      out[t] = buf[s]; out[t + 1] = buf[s + 1]; out[t + 2] = buf[s + 2]; out[t + 3] = 255;
    }
  }
  return { pixels: out, info: { method, removedSpecks: removed, scale: +scale.toFixed(4), shift: [dx, dy], source: [src.w, src.h] } };
}

function diffBox(a, b, region) {
  let x0 = CANVAS, y0 = CANVAS, x1 = -1, y1 = -1, count = 0;
  for (let y = region.y0; y < region.y1; y++) for (let x = region.x0; x < region.x1; x++) {
    const i = (y * CANVAS + x) * 4;
    if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) + Math.abs(a[i + 3] - b[i + 3]) > 24) {
      count++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
  }
  return count ? { x0, y0, x1, y1, count } : null;
}

function regionDiff(a, b, region) {
  let sum = 0, n = 0;
  for (let y = region.y0; y < region.y1; y++) for (let x = region.x0; x < region.x1; x++) {
    const i = (y * CANVAS + x) * 4;
    if (!a[i + 3] && !b[i + 3]) continue;
    sum += (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2])) / 3 + (a[i + 3] !== b[i + 3] ? 255 : 0);
    n++;
  }
  return n ? sum / n : 999;
}

function savePNG(pixels, file) {
  return sharp(pixels, { raw: { width: CANVAS, height: CANVAS, channels: 4 } }).png({ compressionLevel: 9 }).toFile(file);
}

// ---------- main ----------

async function collectInputs() {
  if (args.sheet) {
    const [cols, rows] = String(args.grid || '4x4').split('x').map(Number);
    const names = String(args.names || '').split(',').map(s => s.trim()).filter(Boolean);
    const meta = await sharp(args.sheet).metadata();
    const cw = Math.floor(meta.width / cols), ch = Math.floor(meta.height / rows);
    const items = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const k = r * cols + c; if (!names[k] || names[k] === 'skip') continue;
      const buffer = await sharp(args.sheet).extract({ left: c * cw, top: r * ch, width: cw, height: ch }).png().toBuffer();
      items.push({ name: names[k], buffer });
    }
    return items;
  }
  const dir = path.resolve(args.from || path.join(SPRITE_DIR, 'raw'));
  if (!fs.existsSync(dir)) throw new Error(`no folder at ${dir}`);
  const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? (/preview/i.test(e.name) ? [] : walk(path.join(d, e.name))) : [path.join(d, e.name)]);
  return walk(dir).filter(f => /\.(png|jpe?g|webp)$/i.test(f)).map(f => ({ name: path.basename(f), file: f }));
}

async function main() {
  const inputs = await collectInputs();
  const chosen = {}; const skipped = [];
  for (const it of inputs) {
    const c = classify(it.name);
    if (!c) { skipped.push(it.name); continue; }
    const key = `${c.pose}-${c.state}`;
    if (!chosen[key]) chosen[key] = it; else skipped.push(`${it.name} (duplicate of ${key})`);
  }
  if (!chosen['idle-neutral']) throw new Error('Need at least one closed-mouth standing image (name it idle-neutral.png).');
  if (!chosen['idle-talk']) {
    if (chosen['idle-talk-small']) chosen['idle-talk'] = chosen['idle-talk-small'];
    else if (chosen['idle-talk-wide']) chosen['idle-talk'] = chosen['idle-talk-wide'];
    else throw new Error('Need an open-mouth standing image (name it idle-talk.png) so the character can talk.');
  }

  fs.mkdirSync(OUT_POSES, { recursive: true });
  for (const f of fs.readdirSync(OUT_POSES)) if (f.endsWith('.png')) fs.unlinkSync(path.join(OUT_POSES, f));

  const px = {}; const report = {};
  for (const [key, it] of Object.entries(chosen)) {
    const { pixels, info } = await normalize(it.file, { buffer: it.buffer });
    px[key] = pixels; report[key] = { from: it.name, ...info };
  }

  // Head + mouth geometry from the idle pair.
  const head = { x0: Math.round(CENTER_X - FIG_H * 0.17), x1: Math.round(CENTER_X + FIG_H * 0.17), y0: FEET_Y - FIG_H, y1: Math.round(FEET_Y - FIG_H + FIG_H * 0.31) };
  const mouth = diffBox(px['idle-neutral'], px['idle-talk'], head);
  if (!mouth) throw new Error('idle-neutral and idle-talk look identical; the talk image needs an open mouth.');
  const pad = 3;
  const mbox = { x0: Math.max(head.x0, mouth.x0 - pad), y0: Math.max(head.y0, mouth.y0 - pad), x1: Math.min(head.x1, mouth.x1 + pad + 1), y1: Math.min(head.y1, mouth.y1 + pad + 1) };

  // Gesture poses without a talking version: borrow the idle mouth when the face matches.
  for (const pose of POSES.slice(1)) {
    const n = `${pose}-neutral`, t = `${pose}-talk`;
    if (px[n] && !px[t]) {
      const d = regionDiff(px[n], px['idle-neutral'], head);
      if (d < 18) {
        const out = Buffer.from(px[n]);
        for (let y = mbox.y0; y < mbox.y1; y++) for (let x = mbox.x0; x < mbox.x1; x++) {
          const i = (y * CANVAS + x) * 4; for (let k = 0; k < 4; k++) out[i + k] = px['idle-talk'][i + k];
        }
        px[t] = out; report[t] = { from: `synthesized: idle-talk mouth on ${n}`, faceDiff: +d.toFixed(1) };
      } else {
        report[n].note = `no talking version and the face differs from idle (diff ${d.toFixed(1)}), so this pose is used only in pauses`;
      }
    }
    if (px[t] && !px[n]) { report[t].note = 'no closed-mouth version; pose disabled'; delete px[t]; }
  }

  const poses = {};
  for (const [key, pixels] of Object.entries(px)) {
    const [pose, state] = splitKey(key);
    await savePNG(pixels, path.join(OUT_POSES, `${key}.png`));
    (poses[pose] ||= {})[state] = `poses/${key}.png`;
  }

  // Real head geometry from the master pose (framing scales by head width), and each pose's reach.
  const master = px['idle-neutral'];
  const rowSpan = (buf, y) => { let l = -1, r = -1; for (let x = 0; x < CANVAS; x++) if (buf[(y * CANVAS + x) * 4 + 3]) { if (l < 0) l = x; r = x; } return l < 0 ? null : [l, r]; };
  let headW = 0, hx0 = CANVAS, hx1 = 0, chinY = FEET_Y - FIG_H + Math.round(FIG_H * 0.3);
  for (let y = FEET_Y - FIG_H; y < FEET_Y - FIG_H + FIG_H * 0.45; y++) {
    const sp = rowSpan(master, y); if (!sp) continue;
    const w = sp[1] - sp[0];
    if (y > FEET_Y - FIG_H + FIG_H * 0.15 && w < headW * 0.62) { chinY = y; break; }
    if (w > headW) headW = w;
    hx0 = Math.min(hx0, sp[0]); hx1 = Math.max(hx1, sp[1]);
  }
  const reach = {};
  for (const [key, buf] of Object.entries(px)) {
    let l = CANVAS, r = 0;
    for (let y = FEET_Y - FIG_H; y < FEET_Y - FIG_H * 0.35; y++) { const sp = rowSpan(buf, y); if (sp) { l = Math.min(l, sp[0]); r = Math.max(r, sp[1]); } }
    reach[key] = [l, r];
  }

  const manifest = {
    version: 2,
    canvas: [CANVAS, CANVAS],
    figure: { headTop: FEET_Y - FIG_H, feetY: FEET_Y, centerX: CENTER_X, height: FIG_H, headCenterX: Math.round((hx0 + hx1) / 2), headWidth: headW, chinY },
    reach,
    head: { x0: head.x0, y0: head.y0, x1: head.x1, y1: head.y1 },
    mouth: { x0: mouth.x0, y0: mouth.y0, x1: mouth.x1, y1: mouth.y1 },
    poses,
    talking: Object.keys(poses).filter(p => poses[p].neutral && poses[p].talk),
    missing: POSES.filter(p => !poses[p]),
    report,
    skipped,
  };
  fs.writeFileSync(path.join(SPRITE_DIR, 'sprite.json'), JSON.stringify(manifest, null, 2));
  await contactSheet(manifest);

  console.log(`Sprite ready: ${Object.keys(px).length} images, ${manifest.talking.length} talking poses (${manifest.talking.join(', ')}).`);
  if (manifest.missing.length) console.log(`Missing poses (optional, the editor works around them): ${manifest.missing.join(', ')}`);
  if (skipped.length) console.log(`Ignored files: ${skipped.join('; ')}`);
  console.log(`Preview: ${path.join(SPRITE_DIR, 'preview.png')}`);
}

function splitKey(key) {
  for (const s of ['talk-small', 'talk-wide', 'neutral', 'talk', 'smile', 'surprised']) if (key.endsWith('-' + s)) return [key.slice(0, -s.length - 1), s];
  return [key, 'neutral'];
}

async function contactSheet(manifest) {
  const keys = Object.entries(manifest.poses).flatMap(([p, st]) => Object.keys(st).map(s => `${p}-${s}`));
  const tile = 220, cols = 5, rows = Math.ceil(keys.length / cols), lab = 26;
  const comps = [];
  for (let i = 0; i < keys.length; i++) {
    const x = (i % cols) * (tile + 8) + 8, y = Math.floor(i / cols) * (tile + lab + 8) + 8;
    const png = await sharp(path.join(OUT_POSES, `${keys[i]}.png`)).resize(tile, tile, { kernel: 'nearest' }).toBuffer();
    comps.push({ input: { create: { width: tile, height: tile, channels: 4, background: '#ffffff' } }, left: x, top: y });
    comps.push({ input: png, left: x, top: y });
    const svg = `<svg width="${tile}" height="${lab}" xmlns="http://www.w3.org/2000/svg"><text x="4" y="18" font-family="Helvetica, Arial" font-size="15" fill="#222">${keys[i]}${manifest.report[keys[i]]?.from?.startsWith('synth') ? ' *' : ''}</text></svg>`;
    comps.push({ input: Buffer.from(svg), left: x, top: y + tile });
  }
  await sharp({ create: { width: cols * (tile + 8) + 8, height: rows * (tile + lab + 8) + 8, channels: 4, background: '#efeee9' } })
    .composite(comps).png().toFile(path.join(SPRITE_DIR, 'preview.png'));
}

main().catch(e => { console.error('prepare-sprite failed:', e.message); process.exit(1); });
