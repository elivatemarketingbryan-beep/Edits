#!/usr/bin/env node
// One-time setup: engine packages, FFmpeg/FFprobe, the render browser and the
// on-device speech model. Safe to rerun; finished steps are skipped quickly.
//
// Usage: npm --prefix engine run setup

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ENGINE, writeJSON } from '../lib/tools.mjs';

const say = (m) => console.log(`\n▸ ${m}`);
const fail = (m) => { console.error(`\n✖ ${m}`); process.exit(1); };
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const major = Number(process.versions.node.split('.')[0]);
if (major < 22) fail(`Node ${process.versions.node} is too old. Install Node.js 22 or newer from https://nodejs.org, then run setup again.`);

say('Installing engine packages (first run downloads about 150 MB)');
let r = spawnSync(npm, ['install', '--no-audit', '--no-fund'], { cwd: ENGINE, stdio: 'inherit', shell: process.platform === 'win32', env: { ...process.env, HYPERFRAMES_SKIP_SKILLS: '1' } });
if (r.status !== 0) fail('npm install failed. Check your internet connection and run setup again.');

// Imported only now, because they need the packages installed above.
const { ffmpegPath, ffprobePath, runHF } = await import('../lib/tools.mjs');

say('Checking FFmpeg');
const ffVersion = (p) => {
  const out = spawnSync(p, ['-version'], { encoding: 'utf8' }).stdout || '';
  const m = out.match(/version n?(\d+)\.(\d+)/);
  return m ? Number(m[1]) : 0;
};
let ff;
try { ff = ffmpegPath(); } catch { ff = null; }
if (!ff || ffVersion(ff) < 6) {
  spawnSync(npm, ['rebuild', 'ffmpeg-static'], { cwd: ENGINE, stdio: 'inherit', shell: process.platform === 'win32' });
  try { ff = ffmpegPath(); } catch { ff = null; }
}
if (!ff || ffVersion(ff) < 6) {
  fail('Could not get FFmpeg 6 or newer.\n  Mac: install Homebrew (https://brew.sh) then run: brew install ffmpeg\n  Windows: winget install --id Gyan.FFmpeg -e\nThen run setup again.');
}
console.log(`  FFmpeg ${ffVersion(ff)} at ${ff}`);
const probe = ffprobePath();
if (!probe) fail('FFprobe is missing. Run setup again; if it repeats, install FFmpeg system-wide (see above).');
if (process.platform !== 'win32') try { fs.chmodSync(probe, 0o755); } catch {}
console.log(`  FFprobe at ${probe}`);

say('Downloading the render browser (about 190 MB, once)');
r = runHF(['browser', 'ensure'], { inherit: true });
if (r.status !== 0) fail('Could not download the render browser. Check your connection and run setup again.');

say('Downloading the speech-to-text model (about 640 MB, once)');
r = runHF(['models', 'install', 'parakeet'], { inherit: true });
const parakeet = r.status === 0;
if (!parakeet) console.log('  Parakeet could not be installed; transcription will fall back to whisper.cpp on first use.');

say('Checking everything');
r = runHF(['doctor', '--json']);
let doctor = {};
try { doctor = JSON.parse(r.stdout); } catch {}
for (const k of ['assets/vendor/gsap.min.js', 'assets/fonts']) {
  if (!fs.existsSync(path.join(ENGINE, k))) fail(`engine/${k} is missing. Re-download the project.`);
}

writeJSON(path.join(ENGINE, '.cache', 'setup.json'), {
  complete: true,
  at: new Date().toLocaleString(),
  node: process.versions.node,
  ffmpeg: ff,
  ffprobe: probe,
  transcription: parakeet ? 'parakeet' : 'whisper',
  doctorOk: doctor.ok ?? null,
});
console.log('\n✔ Setup complete. The engine is ready.');
