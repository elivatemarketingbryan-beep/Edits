// Sound effects for every engine. Cues are named in styles/sfx.json; files live in assets/sfx.
//
//   node studio/sfx.mjs list
//   node studio/sfx.mjs place <in.mp4> <cues.json> <out.mp4> [--job <id>]
//   node studio/sfx.mjs remotion <cues.json> [fps]      -> plan.audio.effects for engines/split-screen
//   node studio/sfx.mjs peak <file.wav>                 -> seconds to the loudest point
//   node studio/sfx.mjs gen <earshot-id> <cue> [--dur s] [--apex s] [--pitch E5] [--seed n] [--volume v] [--use "..."]
//                                                       -> make a sound in code (engines/earshot bank, 252 sounds:
//                                                          `earshot sfx list`) and register it as a cue
//
// Generated cues keep their earshot recipe in styles/sfx.json; if the file is missing, place() re-renders it.
// earshot runs from its own venv: EARSHOT_PY, else ~/.cache/earshot-venv (setup: engines/earshot/UPSTREAM.txt).
//
// cues.json: [{ "cue": "pop", "at": 3.2, "volume": 0.2, "note": "tier card lands" }, ...]
// `at` is the output-timeline second the sound should HIT; the file starts `peak` earlier.
// `volume` is optional (defaults from styles/sfx.json). With --job, the cues are also
// written to jobs/<id>/edits.json as "sfx" edits so the review page shows them.
//
// A cue can also be a library ID from assets/sfx-library (the 1548-sound SFX Library, see its AGENT_GUIDE.md):
// { "cue": "SFX-0058", "at": 133.85 }. Its sync point, clip gain and high-pass come from the library's index;
// the gain is shifted by the video's own speech loudness (the library assumes -14 LUFS). `volume` there is a
// multiplier (default 1). Find one with: python assets/sfx-library/sfx.py find --moment <moment> --seed <job>.
// Credit-required library sounds are refused unless the cue has "allowCredit": true.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LIB = JSON.parse(fs.readFileSync(path.join(ROOT, 'styles', 'sfx.json'), 'utf8')).cues;
const SFX_DIR = path.join(ROOT, 'assets', 'sfx');
const SFXLIB_DIR = path.join(ROOT, 'assets', 'sfx-library');
let SFXLIB = null;
const sfxlib = () => {
  if (!SFXLIB) {
    const raw = JSON.parse(fs.readFileSync(path.join(SFXLIB_DIR, 'index.json'), 'utf8'));
    SFXLIB = new Map((Array.isArray(raw) ? raw : raw.sounds).map((s) => [s.id, s]));
  }
  return SFXLIB;
};
// integrated loudness of a file's audio (LUFS), for matching library sounds to this video's speech
const loudness = (file) => {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-vn', '-af', 'ebur128', '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 1 << 28 });
  const m = [...(r.stderr || '').matchAll(/I:\s+(-?[\d.]+) LUFS/g)].pop();
  return m ? Number(m[1]) : -14;
};

const run = (args, opts = {}) => {
  const r = spawnSync('ffmpeg', args, { encoding: opts.binary ? 'buffer' : 'utf8', maxBuffer: 1 << 30 });
  if (r.status !== 0) throw new Error((r.stderr || '').toString().split('\n').slice(-8).join('\n'));
  return r.stdout;
};
const hasAudio = (file) => spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'a', '-show_entries', 'stream=index', '-of', 'csv=p=0', file], { encoding: 'utf8' }).stdout.trim() !== '';
const duration = (file) => Number(spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file], { encoding: 'utf8' }).stdout);

// earshot (engines/earshot): sounds made in code, rendered by bank id with exact length, apex and pitch.
const EARSHOT_PY = process.env.EARSHOT_PY || path.join(os.homedir(), '.cache', 'earshot-venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
function earshotRender(recipe, out) {
  if (!fs.existsSync(EARSHOT_PY)) throw new Error(`earshot isn't set up (no ${EARSHOT_PY}); see engines/earshot/UPSTREAM.txt`);
  const args = ['-m', 'earshot', 'sfx', 'render', recipe.id, '-o', out, '--json'];
  for (const k of ['dur', 'apex', 'pitch', 'seed']) if (recipe[k] != null) args.push('--' + k, String(recipe[k]));
  const r = spawnSync(EARSHOT_PY, args, { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`earshot: ${(r.stderr || r.stdout).trim().split('\n').pop()}`);
  return JSON.parse(r.stdout).meta;
}

function gen(id, cue, opts) {
  if (!id || !cue) throw new Error('usage: node studio/sfx.mjs gen <earshot-id> <cue> [--dur s] [--apex s] [--pitch E5] [--seed n] [--volume v] [--use "..."]');
  if (!/^[a-z0-9-]+$/.test(cue)) throw new Error('cue names are lowercase letters, digits and dashes');
  const recipe = { id };
  for (const k of ['dur', 'apex', 'pitch', 'seed']) if (opts[k] != null) recipe[k] = k === 'pitch' ? opts[k] : Number(opts[k]);
  const file = `gen/${cue}.wav`;
  fs.mkdirSync(path.join(SFX_DIR, 'gen'), { recursive: true });
  const meta = earshotRender(recipe, path.join(SFX_DIR, file));
  recipe.seed = meta.seed;                               // pin the take so a re-render is identical
  const libFile = path.join(ROOT, 'styles', 'sfx.json'), lib = JSON.parse(fs.readFileSync(libFile, 'utf8'));
  lib.cues[cue] = { file, peak: +meta.peak_s.toFixed(3), volume: Number(opts.volume ?? lib.cues[cue]?.volume ?? 0.2),
    use: opts.use ?? lib.cues[cue]?.use ?? `generated: ${id}`, earshot: recipe };
  fs.writeFileSync(libFile, JSON.stringify(lib, null, 2) + '\n');
  console.log(`${cue}: ${file} from ${id} (${meta.dur_s.toFixed(2)} s, peak at ${meta.peak_s.toFixed(3)} s, ${meta.checks?.summary ?? 'checked'})`);
}

function loadCues(file) {
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  const cues = Array.isArray(raw) ? raw : raw.cues;
  return cues.map((c, i) => {
    if (/^SFX-\d+$/.test(c.cue)) {
      const s = sfxlib().get(c.cue);
      if (!s) throw new Error(`Cue ${i + 1}: ${c.cue} is not in assets/sfx-library/index.json`);
      if (s.attribution_required && !c.allowCredit) throw new Error(`Cue ${i + 1}: ${c.cue} needs a credit line (${s.credit_line}); add "allowCredit": true only if Bryan said credits are fine`);
      if (!(c.at >= 0)) throw new Error(`Cue ${i + 1} (${c.cue}): "at" must be a time in seconds`);
      return { ...c, lib: s, file: path.join(SFXLIB_DIR, s.file), peak: s.sync_point_ms / 1000, highpass: s.suggested_highpass_hz, mult: c.volume ?? 1 };
    }
    const def = LIB[c.cue];
    if (!def) throw new Error(`Cue ${i + 1}: unknown sound "${c.cue}". Run "node studio/sfx.mjs list", or make it: "node studio/sfx.mjs gen <earshot-id> ${c.cue}".`);
    if (def.earshot && !fs.existsSync(path.join(SFX_DIR, def.file))) earshotRender(def.earshot, path.join(SFX_DIR, def.file));
    if (!(c.at >= 0)) throw new Error(`Cue ${i + 1} (${c.cue}): "at" must be a time in seconds`);
    return { ...c, file: path.join(SFX_DIR, def.file), peak: def.peak, volume: c.volume ?? def.volume };
  }).sort((a, b) => a.at - b.at);
}

function place(input, cuesFile, output, jobId) {
  const cues = loadCues(cuesFile);
  if (cues.some((c) => c.lib)) {
    // library gains assume speech at -14 LUFS; SFX_SPEECH_LUFS overrides the measurement (e.g. on a silent test track)
    const shift = (process.env.SFX_SPEECH_LUFS ? Number(process.env.SFX_SPEECH_LUFS) : hasAudio(input) ? loudness(input) : -14) + 14;
    for (const c of cues.filter((x) => x.lib)) c.volume = +(c.mult * 10 ** ((c.lib.clip_gain_db + shift) / 20)).toFixed(4);
    console.log(`Library sounds matched to speech at ${(shift - 14).toFixed(1)} LUFS`);
  }
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
    const hp = c.highpass ? `highpass=f=${c.highpass},` : '';
    parts.push(`[f${fi}_${k}]${trim}${hp}volume=${c.volume},adelay=${ms}|${ms}[s${i}]`);
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
    edits.push({ type: 'sfx', start: +c.at.toFixed(2), end: +(c.at + 0.3).toFixed(2), what: `${c.cue} at ${Math.round(c.volume * 100)}%`, why: c.note || (c.lib ? c.lib.description : LIB[c.cue].use) });
  }
  fs.writeFileSync(file, JSON.stringify(edits, null, 2));
  console.log(`Logged ${cues.length} sound edits in ${path.relative(ROOT, file)}`);
}

function remotion(cuesFile, fps = 30) {
  const effects = loadCues(cuesFile).map((c) => ({ src: path.relative(ROOT, c.file).split(path.sep).join('/'), atFrame: Math.round((c.at - c.peak) * fps), volume: c.volume }));
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
  else if (cmd === 'gen') {
    const opt = (k) => { const i = rest.indexOf('--' + k); return i >= 0 ? rest[i + 1] : undefined; };
    gen(rest[0], rest[1], { dur: opt('dur'), apex: opt('apex'), pitch: opt('pitch'), seed: opt('seed'), volume: opt('volume'), use: opt('use') });
  }
  else console.log('usage: node studio/sfx.mjs list | place <in> <cues.json> <out> [--job <id>] | remotion <cues.json> [fps] | peak <file> | gen <earshot-id> <cue> [...]');
} catch (e) { console.error(e.message); process.exit(1); }
