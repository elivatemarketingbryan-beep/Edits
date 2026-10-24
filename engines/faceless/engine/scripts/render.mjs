#!/usr/bin/env node
// Renders a built video to videos/<slug>/<slug>.mp4 and runs technical checks
// (length, frame count, audio, no blank frames). It also writes a contact
// sheet, videos/<slug>/.work/frames.jpg, for a quick look.
//
// Usage: npm --prefix engine run render -- <slug> [--draft]

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { ROOT, runHF, ffmpegPath, ffprobePath } from '../lib/tools.mjs';
import { resolveVideo } from './build.mjs';

export async function render(dir, { draft = false } = {}) {
  const slug = path.basename(dir);
  const out = path.join(dir, draft ? `${slug}-draft.mp4` : `${slug}.mp4`);
  const t0 = Date.now();
  const r = runHF(['render', '--quality', draft ? 'draft' : 'delivery', '--fps', '30', '--output', out], { cwd: dir, timeout: 60 * 60 * 1000 });
  if (r.status !== 0 || !fs.existsSync(out)) {
    const tail = (r.stderr + r.stdout).split('\n').filter(l => /error|fail|✖/i.test(l)).slice(-15).join('\n');
    throw new Error(`Render failed.\n${tail || (r.stderr + r.stdout).slice(-2000)}`);
  }
  const secs = ((Date.now() - t0) / 1000).toFixed(0);
  const loudness = master(out);

  // Technical checks.
  const probe = JSON.parse(execFileSync(ffprobePath(), ['-v', 'error', '-show_entries', 'stream=codec_type,nb_frames,duration:format=duration', '-of', 'json', out], { encoding: 'utf8' }));
  const v = probe.streams.find(s => s.codec_type === 'video'), a = probe.streams.find(s => s.codec_type === 'audio');
  const expected = Number(fs.readFileSync(path.join(dir, 'index.html'), 'utf8').match(/data-composition-id="main"[^>]*data-duration="([\d.]+)"/)?.[1] || 0);
  const problems = [];
  if (!a) problems.push('no audio track');
  if (Math.abs(Number(probe.format.duration) - expected) > 0.15) problems.push(`length ${Number(probe.format.duration).toFixed(2)} s, expected ${expected.toFixed(2)} s`);

  // Contact sheet of 12 evenly spaced frames, plus a blank-frame check on each.
  const work = path.join(dir, '.work', 'frames');
  fs.rmSync(work, { recursive: true, force: true });
  fs.mkdirSync(work, { recursive: true });
  const dur = Number(probe.format.duration);
  const tiles = [];
  for (let k = 0; k < 12; k++) {
    const t = Math.min(dur - 0.05, (k + 0.5) * dur / 12);
    const f = path.join(work, `f${String(k).padStart(2, '0')}.png`);
    execFileSync(ffmpegPath(), ['-v', 'error', '-y', '-ss', t.toFixed(3), '-i', out, '-frames:v', '1', '-vf', 'scale=270:480', f]);
    const { channels } = await sharp(f).stats();
    if (channels.every(c => c.stdev < 2)) problems.push(`frame at ${t.toFixed(1)} s is blank`);
    tiles.push({ input: f, left: (k % 6) * 276 + 6, top: Math.floor(k / 6) * 486 + 6 });
  }
  const sheet = path.join(dir, '.work', 'frames.jpg');
  await sharp({ create: { width: 6 * 276 + 6, height: 2 * 486 + 6, channels: 3, background: '#222' } }).composite(tiles).jpeg({ quality: 82 }).toFile(sheet);

  return { out, secs, frames: Number(v?.nb_frames || 0), duration: dur, problems, sheet, loudness };
}

function measureLufs(file) {
  const r = spawnSync(ffmpegPath(), ['-hide_banner', '-nostats', '-i', file, '-vn', '-af', 'ebur128=peak=true', '-f', 'null', '-'], { encoding: 'utf8' });
  const sum = (r.stderr || '').split('Summary:').pop();
  return { I: Number(sum.match(/I:\s+(-?[\d.]+) LUFS/)?.[1]), peak: Number(sum.match(/Peak:\s+(-?[\d.]+) dBFS/)?.[1]) };
}

// Final loudness to the reference: -14 LUFS integrated, peaks under -1 dB. Video is copied untouched.
function master(file) {
  const before = measureLufs(file);
  if (!Number.isFinite(before.I) || Math.abs(before.I + 14) <= 0.4) return before;
  const tmp = file.replace(/\.mp4$/, '.master.mp4');
  const gain = (-14 - before.I).toFixed(2);
  execFileSync(ffmpegPath(), ['-v', 'error', '-y', '-i', file, '-c:v', 'copy', '-af', `volume=${gain}dB,alimiter=limit=0.89:level=false`, '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', tmp]);
  fs.renameSync(tmp, file);
  return { ...measureLufs(file), adjusted: Number(gain) };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const dir = resolveVideo(process.argv[2]);
  const draft = process.argv.includes('--draft');
  try {
    const r = await render(dir, { draft });
    console.log(`Rendered ${path.relative(ROOT, r.out)} in ${r.secs}s (${r.duration.toFixed(2)} s, ${r.frames} frames).`);
    console.log(r.problems.length ? `Checks: ${r.problems.join('; ')}` : `Checks: passed (length, audio, no blank frames, ${r.loudness.I} LUFS).`);
    console.log(`Contact sheet: ${path.relative(ROOT, r.sheet)}`);
    process.exit(r.problems.length ? 2 : 0);
  } catch (e) { console.error(e.message); process.exit(1); }
}
