#!/usr/bin/env node
// Builds a clean, shareable copy of this project for community members:
// no personal sprite, voiceovers, rendered videos, caches or node_modules.
//
// Usage: npm --prefix engine run package [-- --out <folder>]   -> AI-Faceless-Content-<date>.zip next to the project

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT } from '../lib/tools.mjs';

const EXCLUDE = [
  /^engine\/node_modules(\/|$)/,
  /^engine\/bin(\/|$)/,
  /^engine\/\.cache(\/|$)/,
  /^brand\.json$/,
  /(^|\/)\.hyperframes(\/|$)/,
  /^sprite\/raw\/.+/,
  /^sprite\/poses\/.+/,
  /^sprite\/(sprite\.json|preview\.png)$/,
  /^voiceovers\/.+/,
  /^videos\/.+/,
  /^state\.json$/,
  /^kyle-sprite-pack(\/|$)/,
  // The reference edit belongs to another creator; the style bible carries what the engine needs.
  /^[^/]+\.mp4$/,
  /^[^/]+\.(mp3|wav|m4a)$/,
  /(^|\/)\.DS_Store$/,
];
const KEEP = [/^(sprite\/raw|voiceovers|videos)\/README\.md$/, /^engine\/assets\//];

const d = new Date();
const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const name = `AI-Faceless-Content-${stamp}`;
const stage = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'afc-')), name);
fs.rmSync(path.dirname(stage), { recursive: true, force: true });

let copied = 0;
function walk(rel) {
  const abs = path.join(ROOT, rel);
  for (const e of fs.readdirSync(abs, { withFileTypes: true })) {
    const r = rel ? `${rel}/${e.name}` : e.name;
    const keep = KEEP.some(k => k.test(r));
    if (!keep && EXCLUDE.some(x => x.test(r))) continue;
    if (e.isDirectory()) { fs.mkdirSync(path.join(stage, r), { recursive: true }); walk(r); }
    else { fs.mkdirSync(path.dirname(path.join(stage, r)), { recursive: true }); fs.copyFileSync(path.join(ROOT, r), path.join(stage, r)); copied++; }
  }
}
fs.mkdirSync(stage, { recursive: true });
walk('');

const outArg = process.argv.indexOf('--out');
const outDir = outArg > 0 ? path.resolve(process.env.INIT_CWD || process.cwd(), process.argv[outArg + 1]) : path.join(ROOT, '..');
const zip = path.join(outDir, `${name}.zip`);
fs.rmSync(zip, { force: true });
if (process.platform === 'win32') {
  execFileSync('powershell', ['-NoProfile', '-Command', `Compress-Archive -Path '${stage}' -DestinationPath '${zip}'`]);
} else {
  execFileSync('zip', ['-qr', zip, name], { cwd: path.dirname(stage) });
}
fs.rmSync(path.dirname(stage), { recursive: true, force: true });
console.log(`Packaged ${copied} files -> ${zip}`);
console.log('Left out: your sprite images, voiceovers, rendered videos, kyle-sprite-pack and node_modules.');
