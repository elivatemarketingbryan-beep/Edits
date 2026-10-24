#!/usr/bin/env node
// plan.json -> a complete HyperFrames project inside videos/<slug>/.
//
// Usage: npm --prefix engine run build -- <slug or videos/slug>

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT, ENGINE, runHF, userPath, writeJSON } from '../lib/tools.mjs';
import { loadPlan, describe, PlanError, clipAttrs } from '../lib/plan.mjs';
import { sceneHTML, loadPages } from '../lib/scenes.mjs';
import { captionsHTML, spriteHTML, rigFor } from '../lib/layers.mjs';
import { musicBed, writeWav } from '../lib/audio.mjs';

export function resolveVideo(arg) {
  if (!arg) throw new Error('Which video? Pass its folder name, e.g. npm --prefix engine run build -- my-video');
  const direct = path.join(ROOT, 'videos', arg);
  if (fs.existsSync(direct)) return direct;
  const p = userPath(arg);
  if (fs.existsSync(p)) return p;
  throw new Error(`No video folder "${arg}" in videos/`);
}

function copy(src, dst) {
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  if (!fs.existsSync(dst) || fs.statSync(dst).mtimeMs < fs.statSync(src).mtimeMs || fs.statSync(dst).size !== fs.statSync(src).size) fs.copyFileSync(src, dst);
}

// Pixel-art room behind the sprite. eyeLine = where the sprite's eyes sit inside the box.
async function room(variant, width, height, eyeLine, seed) {
  const { pixelRoom, roomColor, ROOM_VARIANTS } = await import('../lib/room.mjs');
  const v = ROOM_VARIANTS.includes(variant) ? variant : 'sage';
  let h = 2166136261; for (const ch of String(seed)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return { svg: pixelRoom({ width, height, variant: v, eyeLine: Math.round(eyeLine), seed: h >>> 0 }), color: roomColor(v) };
}

export async function build(dir, { quiet } = {}) {
  const log = quiet ? () => {} : console.log;
  const edit = loadPlan(dir);
  await loadPages(edit.accentColor);
  const A = path.join(dir, 'assets');

  // Runtime, fonts, textures, sprite poses and the chosen sound effects.
  copy(path.join(ENGINE, 'runtime', 'fx.js'), path.join(A, 'engine', 'fx.js'));
  copy(path.join(ENGINE, 'runtime', 'engine.css'), path.join(A, 'engine', 'engine.css'));
  if (fs.existsSync(path.join(ENGINE, 'runtime', 'pages.css'))) copy(path.join(ENGINE, 'runtime', 'pages.css'), path.join(A, 'engine', 'pages.css'));
  for (const f of ['gsap.min.js', 'CustomEase.min.js']) copy(path.join(ENGINE, 'assets', 'vendor', f), path.join(A, 'engine', f));
  for (const f of fs.readdirSync(path.join(ENGINE, 'assets', 'fonts'))) if (f.endsWith('.woff2')) copy(path.join(ENGINE, 'assets', 'fonts', f), path.join(A, 'fonts', f));
  const tex = path.join(ENGINE, 'assets', 'textures');
  if (fs.existsSync(tex)) for (const f of fs.readdirSync(tex)) copy(path.join(tex, f), path.join(A, 'textures', f));
  for (const k of new Set(edit.spriteFrames.filter(Boolean))) {
    const src = path.join(ROOT, 'sprite', 'poses', `${k}.png`);
    if (!fs.existsSync(src)) throw new PlanError(`sprite pose ${k}.png is missing; run npm --prefix engine run sprite`);
    copy(src, path.join(A, 'sprite', `${k}.png`));
  }
  for (const e of edit.sfx) copy(path.join(ENGINE, 'assets', 'sfx', e.file), path.join(A, 'sfx', e.file));

  // Music bed, unique per video.
  const bedFile = path.join(A, 'music.wav');
  const bedKey = `${edit.seed}|${edit.duration.toFixed(2)}`;
  const bedStamp = path.join(dir, '.work', 'music.key');
  if (!fs.existsSync(bedFile) || (fs.existsSync(bedStamp) ? fs.readFileSync(bedStamp, 'utf8') : '') !== bedKey) {
    const bed = musicBed(edit.duration + 0.2, edit.seed);
    writeWav(bedFile, bed.channels, bed.rate);
    fs.mkdirSync(path.dirname(bedStamp), { recursive: true });
    fs.writeFileSync(bedStamp, bedKey);
    log(`Music bed: ${bed.progression.join(' - ')}`);
  }

  // Compositions.
  const comp = path.join(dir, 'compositions');
  fs.rmSync(comp, { recursive: true, force: true });
  fs.mkdirSync(comp, { recursive: true });
  const errors = [];
  for (const s of edit.scenes) {
    const { html, errors: e } = sceneHTML(s, edit);
    errors.push(...e);
    fs.writeFileSync(path.join(comp, `${s.id}.html`), html);
  }
  if (errors.length) throw new PlanError(errors.join('\n'));
  fs.writeFileSync(path.join(comp, 'captions.html'), captionsHTML(edit));
  const EYE = 285; // eye row on the sprite canvas
  const rp = rigFor('panel', edit.sprite), rf = rigFor('face', edit.sprite);
  const roomPanel = await room(edit.room, 963, 700, rp.y + EYE * rp.scale - 1407, edit.seed);
  const roomFace = await room(edit.room, 1080, 1920, rf.y + EYE * rf.scale, edit.seed);
  fs.writeFileSync(path.join(comp, 'sprite.html'), spriteHTML(edit, roomPanel, roomFace));

  const D = edit.duration.toFixed(4);
  const accent = edit.accentColor ? `\n      :root { ${accentTokens(edit.accentColor)} }` : '';
  const hosts = edit.scenes.map(s => `      <div id="${s.id}" data-composition-id="${s.id}" data-composition-src="compositions/${s.id}.html" ${clipAttrs(s.f0, s.f1)} data-track-index="1" data-track-kind="graphics" data-width="1080" data-height="1920" style="z-index:1"></div>`).join('\n');
  const SFX_LEN = { riser: 0.64, swell: 0.94, whoosh: 0.46, tick: 0.2 };
  const sfx = edit.sfx.map((e, n) => {
    const len = Math.min(SFX_LEN[e.file.split('-')[0]] || 1, edit.duration - e.f / 30);
    return `      <audio id="sfx${n + 1}" src="assets/sfx/${e.file}" data-start="${(e.f / 30).toFixed(4)}" data-duration="${len.toFixed(4)}" data-track-index="${12 + (n % 4)}" data-volume="${e.gain.toFixed(2)}"></audio>`;
  }).join('\n');
  const voLen = Math.min(edit.duration, edit.voiceDuration || edit.duration).toFixed(4);
  const index = `<!doctype html>
<html lang="en" data-resolution="portrait">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <title>${edit.title || path.basename(dir)}</title>
    <link rel="stylesheet" href="assets/engine/engine.css" />
    ${fs.existsSync(path.join(A, 'engine', 'pages.css')) ? '<link rel="stylesheet" href="assets/engine/pages.css" />' : ''}
    <script src="assets/engine/gsap.min.js"></script>
    <script src="assets/engine/CustomEase.min.js"></script>
    <script src="assets/engine/fx.js"></script>
    <style>
      @font-face { font-family: 'Inter'; font-style: normal; font-weight: 100 900; src: url('assets/fonts/Inter-Variable.woff2') format('woff2'); }
      @font-face { font-family: 'EB Garamond'; font-style: italic; font-weight: 800; src: url('assets/fonts/EBGaramond-ExtraBoldItalic.woff2') format('woff2'); }${fontFaces(A)}${accent}
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: 1080px; height: 1920px; overflow: hidden; background: #E4E8EC; }
      #root { position: relative; width: 1080px; height: 1920px; overflow: hidden; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${D}" data-width="1080" data-height="1920">
${hosts}
      <div id="sprite" data-composition-id="sprite" data-composition-src="compositions/sprite.html" data-start="0" data-duration="${D}" data-track-index="2" data-track-kind="graphics" data-width="1080" data-height="1920" style="z-index:2"></div>
      <div id="captions" data-composition-id="captions" data-composition-src="compositions/captions.html" data-start="0" data-duration="${D}" data-track-index="3" data-track-kind="captions" data-width="1080" data-height="1920" style="z-index:3"></div>
      <audio id="vo" src="assets/voiceover.wav" data-start="0" data-media-start="0" data-duration="${voLen}" data-track-index="10" data-volume="1"></audio>
      <audio id="music" src="assets/music.wav" data-start="0" data-media-start="0" data-duration="${D}" data-track-index="11" data-volume="1"></audio>
${sfx}
    </div>
    <script>
      window.__timelines = window.__timelines || {};
      window.__timelines["main"] = gsap.timeline({ paused: true });
    </script>
  </body>
</html>
`;
  fs.writeFileSync(path.join(dir, 'index.html'), index);
  if (!fs.existsSync(path.join(dir, 'hyperframes.json'))) writeJSON(path.join(dir, 'hyperframes.json'), { $schema: 'https://hyperframes.heygen.com/schema/hyperframes.json', paths: { blocks: 'compositions', components: 'compositions/components', assets: 'assets' } });
  writeJSON(path.join(dir, '.work', 'edit.json'), { ...edit, sprite: undefined, mouth: undefined, spriteFrames: undefined, words: undefined });

  log(describe(edit));
  const lint = runHF(['lint', '--json'], { cwd: dir });
  let res = {};
  try { res = JSON.parse(lint.stdout); } catch {}
  const errs = (res.findings || []).filter(f => f.severity === 'error');
  if (errs.length) {
    log(`Lint: ${errs.length} error(s)`);
    errs.slice(0, 12).forEach(f => log(`  ${f.code}: ${f.message}${f.file ? ` (${f.file})` : ''}`));
  } else log(`Lint: clean (${res.warningCount ?? 0} warnings)`);
  return { edit, lint: res };
}

// A brand accent re-derives every accent token the same way the house red is built:
// a lighter top and darker bottom for gradients, a pale version for dark scenes.
function accentTokens(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex).trim());
  if (!m) throw new PlanError(`accent "${hex}" must be a hex colour like #E5322B`);
  const rgb = [0, 2, 4].map(i => parseInt(m[1].slice(i, i + 2), 16));
  const mix = (to, a) => '#' + rgb.map((c, i) => Math.round(c + (to[i] - c) * a).toString(16).padStart(2, '0')).join('');
  const W = [255, 255, 255], K = [0, 0, 0];
  return `--accent: #${m[1]}; --ring: #${m[1]}; --accent-hi: ${mix(W, 0.22)}; --accent-lo: ${mix(K, 0.18)}; ` +
    `--accent-soft-hi: ${mix(W, 0.62)}; --accent-soft-lo: ${mix(W, 0.18)}; --select: ${mix(W, 0.78)}; --beam: ${mix(W, 0.38)};`;
}

// Extra fonts the page templates use (code pages).
const EXTRA_FONTS = { 'JetBrainsMono-Regular.woff2': ["JetBrains Mono", 'normal', '400'] };
function fontFaces(A) {
  return Object.entries(EXTRA_FONTS).filter(([f]) => fs.existsSync(path.join(A, 'fonts', f))).map(([f, [fam, style, w]]) =>
    `\n      @font-face { font-family: '${fam}'; font-style: ${style}; font-weight: ${w}; src: url('assets/fonts/${f}') format('woff2'); }`).join('');
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const dir = resolveVideo(process.argv[2]);
    const { lint } = await build(dir);
    const errs = (lint.findings || []).filter(f => f.severity === 'error').length;
    console.log(errs ? '\nBuild finished with lint errors (see above).' : `\nBuilt: ${path.relative(ROOT, dir)}/index.html`);
    process.exit(errs ? 2 : 0);
  } catch (e) {
    if (e instanceof PlanError) { console.error('Plan problems:\n' + e.message); process.exit(3); }
    throw e;
  }
}
