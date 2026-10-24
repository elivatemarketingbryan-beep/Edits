#!/usr/bin/env node
// One-shot answer to "where is this user in the process?" Claude runs this on
// every "go" and follows the first step that isn't done.
//
// Usage: npm run status          (add --json for machine-readable output)

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, ENGINE, ffmpegPath, readJSON } from '../lib/tools.mjs';

const AUDIO = /\.(mp3|wav|m4a|aac|ogg|flac|mp4|mov)$/i;
const IMAGE = /\.(png|jpe?g|webp)$/i;

function check(fn) { try { return fn(); } catch (e) { return { ok: false, detail: e.message }; } }

const steps = {};

steps.node = check(() => {
  const major = Number(process.versions.node.split('.')[0]);
  return { ok: major >= 22, detail: `Node ${process.versions.node}${major >= 22 ? '' : ' (need 22 or newer)'}` };
});

steps.engine = check(() => {
  const hf = path.join(ENGINE, 'node_modules', '.bin', process.platform === 'win32' ? 'hyperframes.cmd' : 'hyperframes');
  const sharpOk = fs.existsSync(path.join(ENGINE, 'node_modules', 'sharp'));
  const ok = fs.existsSync(hf) && sharpOk;
  return { ok, detail: ok ? 'engine packages installed' : 'engine packages missing' };
});

steps.ffmpeg = check(() => {
  const p = ffmpegPath();
  const r = spawnSync(p, ['-version'], { encoding: 'utf8' });
  return { ok: r.status === 0, detail: r.status === 0 ? r.stdout.split('\n')[0] : 'ffmpeg failed to run' };
});

steps.setup = check(() => {
  const marker = readJSON(path.join(ENGINE, '.cache', 'setup.json'), null);
  return { ok: !!marker?.complete, detail: marker?.complete ? `set up ${marker.at}` : 'first-time setup not finished', ...marker };
});

steps.sprite = check(() => {
  const manifest = readJSON(path.join(ROOT, 'sprite', 'sprite.json'), null);
  const rawDir = path.join(ROOT, 'sprite', 'raw');
  const raw = fs.existsSync(rawDir) ? fs.readdirSync(rawDir).filter(f => IMAGE.test(f)) : [];
  if (manifest?.poses?.idle?.neutral && manifest?.poses?.idle?.talk) {
    const stale = raw.some(f => fs.statSync(path.join(rawDir, f)).mtimeMs > fs.statSync(path.join(ROOT, 'sprite', 'sprite.json')).mtimeMs);
    return { ok: !stale, detail: stale ? 'new images in sprite/raw since the last prepare' : `${manifest.talking.length} talking poses: ${manifest.talking.join(', ')}`, poses: Object.keys(manifest.poses), missing: manifest.missing };
  }
  return { ok: false, detail: raw.length ? `${raw.length} images in sprite/raw waiting to be prepared` : 'no sprite yet', rawImages: raw.length };
});

steps.voiceovers = check(() => {
  const dir = path.join(ROOT, 'voiceovers');
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => AUDIO.test(f)) : [];
  return { ok: files.length > 0, detail: files.length ? files.join(', ') : 'none in voiceovers/ (user can also attach one in chat)', files };
});

steps.videos = check(() => {
  const dir = path.join(ROOT, 'videos');
  const list = fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => {
    const v = path.join(dir, d.name);
    const has = f => fs.existsSync(path.join(v, f));
    const mp4 = fs.readdirSync(v).find(f => f.endsWith('.mp4'));
    const stage = mp4 ? 'rendered' : has('index.html') ? 'built' : has('plan.json') ? 'planned' : has('words.json') ? 'transcribed' : 'started';
    return { slug: d.name, stage, mp4: mp4 ? path.join('videos', d.name, mp4) : null };
  }) : [];
  return { ok: true, detail: list.length ? list.map(v => `${v.slug}: ${v.stage}`).join('; ') : 'no videos yet', list };
});

const order = ['node', 'engine', 'ffmpeg', 'setup', 'sprite'];
const next = order.find(k => !steps[k].ok);
const nextStep = next ? {
  node: 'Install Node.js 22+ (https://nodejs.org) and reopen Claude Code.',
  engine: 'Run: npm --prefix engine run setup (in the background), then continue with the sprite.',
  ffmpeg: 'Run: npm --prefix engine run setup (in the background), then continue with the sprite.',
  setup: 'Run: npm --prefix engine run setup (in the background), then continue with the sprite.',
  sprite: steps.sprite.rawImages ? 'Run: npm --prefix engine run sprite, then check and show sprite/preview.png.' : 'Sprite onboarding: ask if they already have sprite images; otherwise walk them through guides/make-your-sprite.md.',
}[next] : 'Ready. Ask for a voiceover (attached or in voiceovers/) and make the video.';

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ steps, next: next || 'ready', nextStep }, null, 2));
} else {
  for (const [k, v] of Object.entries(steps)) console.log(`${v.ok ? '✔' : '✖'} ${k.padEnd(10)} ${v.detail}`);
  console.log(`\nNEXT: ${nextStep}`);
}
