#!/usr/bin/env node
// Starts a video from a voiceover: trims and levels the audio, transcribes it to
// word timings, builds the mouth track, and writes brief.md for planning.
//
// Usage: npm --prefix engine run new -- "<voiceover file>" [--name my-video] [--keep-pauses]
// Output: videos/<slug>/{assets/voiceover.wav, words.json, mouth.json, brief.md}

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT, ffmpegPath, decodeAudio, runHF, userPath, writeJSON, readJSON } from '../lib/tools.mjs';
import { mouthTrack, speechSpans } from './lipsync.mjs';
import { writeWav } from '../lib/audio.mjs';

const FPS = 30;
const argv = process.argv.slice(2);
const input = argv.find(a => !a.startsWith('--'));
const nameArg = argv.includes('--name') ? argv[argv.indexOf('--name') + 1] : null;
if (!input) { console.error('usage: npm --prefix engine run new -- "<voiceover file>" [--name slug]'); process.exit(1); }
const src = userPath(input);
if (!fs.existsSync(src)) { console.error(`No file at ${src}`); process.exit(1); }

const slugify = s => s.toLowerCase().replace(/\.[a-z0-9]+$/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'video';
const videos = path.join(ROOT, 'videos');
const freeSlug = base => { let s = base; for (let n = 2; fs.existsSync(path.join(videos, s)); n++) s = `${base}-${n}`; return s; };
// Without --name the folder is named after the script's first words once it's transcribed.
let slug = nameArg ? freeSlug(slugify(nameArg)) : freeSlug(`new-${process.pid}`);
let dir = path.join(videos, slug);
fs.mkdirSync(path.join(dir, 'assets'), { recursive: true });

// ---- 1. tighten pauses and level the voice ----
// The reference voice is a jump-cut track: every pause is trimmed to under ~0.1 s
// (243 wpm), then compressed and limited to -14 LUFS. --keep-pauses skips the trim.
const RATE = 48000;
const keepPauses = argv.includes('--keep-pauses');
const raw = decodeAudio(src, RATE);
const win = Math.round(RATE * 0.01);
const env = [];
for (let i = 0; i < raw.length; i += win) {
  let s = 0; const end = Math.min(raw.length, i + win);
  for (let j = i; j < end; j++) s += raw[j] * raw[j];
  env.push(10 * Math.log10(s / Math.max(1, end - i) + 1e-12));
}
const loud = [...env].sort((a, b) => a - b)[Math.floor(env.length * 0.95)];
// AI voices fill pauses with inhales at -24..-38 dB, so the gate sits at -26 dB and
// a 5-window median removes the breath's brief peak.
const gate = loud - 26;
const med = env.map((_, k) => env.slice(Math.max(0, k - 2), k + 3).sort((a, b) => a - b)[2]);
const first = env.findIndex(d => d > loud - 35);
let last = env.length - 1; while (last > 0 && env[last] <= loud - 35) last--;
const keep = []; // [start, end] in source seconds
const MAX_PAUSE = 0.14, PAD = 0.05;
let segStart = Math.max(0, first * 0.01 - 0.04), run = 0;
for (let k = first; k <= last; k++) {
  if (med[k] <= gate) { run++; continue; }
  if (run * 0.01 > MAX_PAUSE && !keepPauses) {
    const silA = (k - run) * 0.01, silB = k * 0.01;
    keep.push([segStart, silA + PAD]);
    segStart = silB - PAD;
  }
  run = 0;
}
keep.push([segStart, Math.min(raw.length / RATE, (last + 1) * 0.01 + 0.9)]); // room for the closing hold
const XF = Math.round(0.005 * RATE);
const pieces = keep.map(([a, b]) => raw.subarray(Math.round(a * RATE), Math.round(b * RATE)));
const out = new Float32Array(pieces.reduce((n, p) => n + p.length, 0) - XF * (pieces.length - 1));
let o = 0;
pieces.forEach((p, idx) => {
  for (let i = 0; i < p.length; i++) {
    const fadeIn = idx > 0 && i < XF ? i / XF : 1;
    const fadeOut = idx < pieces.length - 1 && i >= p.length - XF ? (p.length - i) / XF : 1;
    out[o + i] += p[i] * fadeIn * fadeOut;
  }
  o += p.length - XF;
});
const work = path.join(dir, '.work');
fs.mkdirSync(work, { recursive: true });
const tight = path.join(work, 'tight.wav');
writeWav(tight, [out], RATE);
const wav = path.join(dir, 'assets', 'voiceover.wav');
execFileSync(ffmpegPath(), ['-v', 'error', '-y', '-i', tight,
  '-af', 'highpass=f=80,acompressor=threshold=-24dB:ratio=3.5:attack=5:release=90:makeup=3,loudnorm=I=-14:TP=-1:LRA=4',
  '-ar', String(RATE), '-ac', '1', wav]);
// Source time -> tightened time.
const mapT = t => {
  let acc = 0;
  for (let k = 0; k < keep.length; k++) {
    const [a, b] = keep[k];
    if (t < a) return acc;
    if (t <= b) return acc + (t - a);
    acc += b - a - (k < keep.length - 1 ? XF / RATE : 0);
  }
  return acc;
};
const removed = raw.length / RATE - out.length / RATE;
console.log(`Audio: removed ${removed.toFixed(2)}s of pauses and silence (${keep.length - 1} pauses tightened), leveled to -14 LUFS.`);

// ---- 2. transcribe ----
// The untouched original transcribes more accurately than the leveled copy; shift its times after.
const srcCopy = path.join(work, 'source' + path.extname(src));
fs.copyFileSync(src, srcCopy);
const r = runHF(['transcribe', srcCopy, '--dir', work, '--language', 'en', '--json'], { timeout: 15 * 60 * 1000 });
const tx = (readJSON(path.join(work, 'transcript.json'), null) || [])
  .map(w => ({ ...w, start: mapT(w.start), end: mapT(w.end) }))
  .filter(w => w.end > w.start || w.text);
if (!tx.length) {
  console.error('Transcription failed.\n' + (r.stderr || r.stdout).slice(-1500));
  process.exit(1);
}

// ---- 3. tighten word starts to the audio (engines often start a word inside the pause before it) ----
const audio = decodeAudio(wav, 16000);
const e10 = [];
for (let i = 0; i < audio.length; i += 160) {
  let s = 0; for (let j = i; j < Math.min(audio.length, i + 160); j++) s += audio[j] * audio[j];
  e10.push(10 * Math.log10(s / 160 + 1e-12));
}
const sorted = [...e10].sort((a, b) => a - b);
const floor = sorted[Math.floor(e10.length * 0.1)], peak = sorted[Math.floor(e10.length * 0.97)];
const voiced = floor + (peak - floor) * 0.35;
const at = t => e10[Math.max(0, Math.min(e10.length - 1, Math.floor(t * 100)))];
const words = tx.map((w, i) => {
  let s = Math.max(0, w.start), e = w.end;
  if (at(s) < voiced) for (let t = s; t <= Math.min(e, s + 0.45); t += 0.01) if (at(t) >= voiced) { s = Math.max(w.start, t - 0.02); break; }
  // Same at the end, so real pauses show up between words.
  if (at(e - 0.01) < voiced) for (let t = e - 0.01; t >= Math.max(s + 0.05, e - 0.45); t -= 0.01) if (at(t) >= voiced) { e = t + 0.03; break; }
  const text = String(w.text).trim();
  const m = text.match(/^(.*?)([.,!?;:…]+)?$/);
  return { i, w: m[1] || text, s: +s.toFixed(3), e: +Math.max(e, s + 0.05).toFixed(3), p: m[2] ? m[2][0] : '' };
});
for (let i = 1; i < words.length; i++) if (words[i].s < words[i - 1].s) words[i].s = words[i - 1].s;

if (!nameArg) {
  const named = freeSlug(slugify(words.slice(0, 6).map(w => w.w).join(' ')));
  fs.renameSync(dir, path.join(videos, named));
  slug = named; dir = path.join(videos, named);
}

// ---- 4. mouth track ----
const track = mouthTrack(audio, 16000, FPS);
const duration = audio.length / 16000;
writeJSON(path.join(dir, 'mouth.json'), { fps: FPS, duration, track: track.join(''), spans: speechSpans(track, FPS) });
writeJSON(path.join(dir, 'words.json'), { duration, fps: FPS, words });

// ---- 5. brief for the planner ----
const sentences = [];
let cur = [];
words.forEach(w => { cur.push(w); if ('.!?'.includes(w.p) && w.p) { sentences.push(cur); cur = []; } });
if (cur.length) sentences.push(cur);
const lines = [];
lines.push(`# Brief: ${slug}`, '', `Duration ${duration.toFixed(2)} s (${Math.round(duration * FPS)} frames at ${FPS} fps), ${words.length} words.`, '');
lines.push('## Script', '');
for (const s of sentences) lines.push(`- [${s[0].i}-${s[s.length - 1].i}] ${s[0].s.toFixed(2)}s: ${s.map(w => w.w + w.p).join(' ')}`);
lines.push('', '## Words (index, start, end, gap before)', '', '| # | word | start | end | pause before |', '|---|---|---|---|---|');
words.forEach((w, i) => {
  const gap = i ? w.s - words[i - 1].e : w.s;
  lines.push(`| ${w.i} | ${w.w}${w.p} | ${w.s.toFixed(2)} | ${w.e.toFixed(2)} | ${gap > 0.2 ? gap.toFixed(2) + ' s' : ''} |`);
});
// Recent videos, so the new plan doesn't repeat their structure.
const recent = fs.readdirSync(videos, { withFileTypes: true })
  .filter(d => d.isDirectory() && d.name !== slug && fs.existsSync(path.join(videos, d.name, 'plan.json')))
  .map(d => ({ name: d.name, at: fs.statSync(path.join(videos, d.name, 'plan.json')).mtimeMs, plan: readJSON(path.join(videos, d.name, 'plan.json'), null) }))
  .filter(v => v.plan?.scenes).sort((a, b) => b.at - a.at).slice(0, 3);
lines.push('', '## Recent videos (do not repeat their structure)', '');
if (!recent.length) lines.push('None yet.');
for (const v of recent) {
  const sc = v.plan.scenes.map(s => {
    const kinds = [s.card?.kind, ...(s.cards || []).map(c => c.kind)].filter(Boolean);
    return s.layout + (kinds.length ? `(${kinds.join('+')})` : '') + ((s.beats || []).length ? `[${s.beats.map(b => b.fx).join(',')}]` : '');
  });
  lines.push(`- ${v.name}: ${sc.join(' > ')}`, `  hook: "${(v.plan.scenes[0].headline || []).join(' / ')}"`);
}
fs.writeFileSync(path.join(dir, 'brief.md'), lines.join('\n') + '\n');

console.log(`Transcribed ${words.length} words, ${duration.toFixed(1)} s.`);
console.log(`Video folder: videos/${slug}`);
console.log(`Next: read videos/${slug}/brief.md and write videos/${slug}/plan.json`);
