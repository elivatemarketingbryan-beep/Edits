// Sound effects for every engine. Cues are named in styles/sfx.json; files live in assets/sfx.
//
//   node studio/sfx.mjs list
//   node studio/sfx.mjs place <in.mp4> <cues.json> <out.mp4> [--job <id>]
//   node studio/sfx.mjs remotion <cues.json> [fps]      -> plan.audio.effects for engines/split-screen
//   node studio/sfx.mjs peak <file.wav>                 -> seconds to the loudest point
//
// cues.json: [{ "cue": "pop", "at": 3.2, "volume": 0.2, "note": "tier card lands" }, ...]
// `at` is the output-timeline second the sound should HIT; the file starts `peak` earlier.
// `volume` is optional (defaults from styles/sfx.json). With --job, the cues are also
// written to jobs/<id>/edits.json as "sfx" edits so the review page shows them.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LIB = JSON.parse(fs.readFileSync(path.join(ROOT, 'styles', 'sfx.json'), 'utf8')).cues;
const SFX_DIR = path.join(ROOT, 'assets', 'sfx');

const run = (args, opts = {}) => {
  const r = spawnSync('ffmpeg', args, { encoding: opts.binary ? 'buffer' : 'utf8', maxBuffer: 1 << 30 });
  if (r.status !== 0) throw new Error((r.stderr || '').toString().split('\n').slice(-8).join('\n'));
  return r.stdout;
};
const hasAudio = (file) => spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'a', '-show_entries', 'stream=index', '-of', 'csv=p=0', file], { encoding: 'utf8' }).stdout.trim() !== '';
const duration = (file) => Number(spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file], { encoding: 'utf8' }).stdout);

function loadCues(file) {
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  const cues = Array.isArray(raw) ? raw : raw.cues;
  return cues.map((c, i) => {
    const def = LIB[c.cue];
    if (!def) throw new Error(`Cue ${i + 1}: unknown sound "${c.cue}". Run "node studio/sfx.mjs list".`);
    if (!(c.at >= 0)) throw new Error(`Cue ${i + 1} (${c.cue}): "at" must be a time in seconds`);
    return { ...c, file: path.join(SFX_DIR, def.file), peak: def.peak, volume: c.volume ?? def.volume };
  }).sort((a, b) => a.at - b.at);
}

function place(input, cuesFile, output, jobId) {
  const cues = loadCues(cuesFile);
  const files = [...new Set(cues.map((c) => c.file))];
  const args = ['-y', '-v', 'error', '-i', input];
  files.forEach((f) => args.push('-i', f));
  const base = hasAudio(input) ? '[0:a]' : null;
  const parts = [];
  // One input per unique file, split into one branch per use.
  files.forEach((f, fi) => {
    const uses = cues.filter((c) => c.file === f);
    parts.push(`[${fi + 1}:a]aformat=sample_rates=48000:channel_layouts=stereo,asplit=${uses.length}${uses.map((_, k) => `[f${fi}_${k}]`).join('')}`);
  });
  const counters = new Map();
  cues.forEach((c, i) => {
    const fi = files.indexOf(c.file);
    const k = counters.get(fi) ?? 0; counters.set(fi, k + 1);
    const start = Math.max(0, c.at - c.peak);
    const trim = start === 0 && c.at < c.peak ? `atrim=start=${(c.peak - c.at).toFixed(3)},asetpts=PTS-STARTPTS,` : '';
    const ms = Math.round(start * 1000);
    parts.push(`[f${fi}_${k}]${trim}volume=${c.volume},adelay=${ms}|${ms}[s${i}]`);
  });
  const mixIn = (base ? '[base]' : '[sil]') + cues.map((_, i) => `[s${i}]`).join('');
  if (base) parts.push(`${base}aformat=sample_rates=48000:channel_layouts=stereo[base]`);
  else parts.push(`anullsrc=r=48000:cl=stereo,atrim=duration=${duration(input)}[sil]`);
  // normalize=0 keeps speech at its level; the sounds sit under it at their own gain.
  parts.push(`${mixIn}amix=inputs=${cues.length + 1}:normalize=0:duration=first:dropout_transition=0,alimiter=limit=0.5:level=false[aout]`);
  args.push('-filter_complex', parts.join(';'), '-map', '0:v?', '-map', '[aout]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', output);
  run(args);
  console.log(`Placed ${cues.length} sounds -> ${output}`);
  if (jobId) writeEdits(jobId, cues);
}

function writeEdits(jobId, cues) {
  const file = path.join(ROOT, 'jobs', path.basename(jobId), 'edits.json');
  const edits = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')).filter((e) => e.type !== 'sfx') : [];
  for (const c of cues) {
    edits.push({ type: 'sfx', start: +c.at.toFixed(2), end: +(c.at + 0.3).toFixed(2), what: `${c.cue} at ${Math.round(c.volume * 100)}%`, why: c.note || LIB[c.cue].use });
  }
  fs.writeFileSync(file, JSON.stringify(edits, null, 2));
  console.log(`Logged ${cues.length} sound edits in ${path.relative(ROOT, file)}`);
}

function remotion(cuesFile, fps = 30) {
  const effects = loadCues(cuesFile).map((c) => ({ src: `assets/sfx/${path.basename(c.file)}`, atFrame: Math.round((c.at - c.peak) * fps), volume: c.volume }));
  console.log(JSON.stringify({ audio: { effects } }, null, 2));
}

function peak(file) {
  const pcm = run(['-v', 'error', '-i', file, '-ac', '1', '-ar', '8000', '-f', 's16le', '-'], { binary: true });
  let max = 0, at = 0;
  for (let i = 0; i < pcm.length - 1; i += 2) { const v = Math.abs(pcm.readInt16LE(i)); if (v > max) { max = v; at = i / 2; } }
  console.log((at / 8000).toFixed(2));
}

const [cmd, ...rest] = process.argv.slice(2);
try {
  if (cmd === 'list') for (const [k, v] of Object.entries(LIB)) console.log(`${k.padEnd(18)} ${v.use}`);
  else if (cmd === 'place') { const j = rest.indexOf('--job'); place(rest[0], rest[1], rest[2], j >= 0 ? rest[j + 1] : null); }
  else if (cmd === 'remotion') remotion(rest[0], Number(rest[1]) || 30);
  else if (cmd === 'peak') peak(rest[0]);
  else console.log('usage: node studio/sfx.mjs list | place <in> <cues.json> <out> [--job <id>] | remotion <cues.json> [fps] | peak <file>');
} catch (e) { console.error(e.message); process.exit(1); }
