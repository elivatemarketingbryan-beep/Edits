// Bryan's cloned voice, through VoiceStudio (github.com/debpalash/VoiceStudio), running locally. See docs/studio/voice.md.
//   node studio/voice.mjs status                                   is the VoiceStudio backend up, which engine, is the voice saved
//   node studio/voice.mjs clone <ref.wav> --text "<its words>" [--name "Bryan Tabora"]   save a voice from a clean 8-20 s clip
//   node studio/voice.mjs speak "<line>" -o <out.wav> [--takes 3] [--voice "Bryan Tabora"]   generate takes: out-<seed>.wav
// Always VoxCPM2 (Apache-2.0). Never OmniVoice for Bryan's videos: its weights are CC-BY-NC (non-commercial).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CLI = path.join(os.homedir(), 'AppData/Local/Programs/VoiceStudio/resources/cli/voicestudio.exe');
const URL = process.env.VOICESTUDIO_URL || 'http://127.0.0.1:3900';
const ENGINE = 'voxcpm2';
const [cmd, ...rest] = process.argv.slice(2);
const opt = (n, d) => { const i = rest.indexOf(n); return i >= 0 ? rest[i + 1] : d; };
const positional = rest.filter((a, i) => !a.startsWith('--') && !(i > 0 && rest[i - 1].startsWith('--')) && a !== '-o' && !(i > 0 && rest[i - 1] === '-o'));
const vs = (args, timeout = 900) => spawnSync(CLI, ['--url', URL, '--timeout', String(timeout), ...args], { encoding: 'utf8' });
const winPath = (p) => path.resolve(p).replace(/\//g, '\\');

if (!cmd) { console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(0, 6).join('\n')); process.exit(2); }
if (!fs.existsSync(CLI)) { console.log(`VoiceStudio isn't installed (${CLI}). Setup: docs/studio/voice.md`); process.exit(1); }

const health = async () => { try { return await (await fetch(`${URL}/health`)).json(); } catch { return null; } };

if (cmd === 'status') {
  const h = await health();
  if (!h) {
    console.log(`VoiceStudio isn't running at ${URL}. Start it through Explorer (not from a Claude shell, see docs/studio/voice.md):`);
    console.log(`  powershell -Command "Start-Process explorer.exe -ArgumentList '\\"$env:LOCALAPPDATA\\Programs\\VoiceStudio\\VoiceStudio.exe\\"'"`);
    process.exit(1);
  }
  console.log(`backend: ${h.status}${h.label ? ` (${h.label})` : ''}, version ${h.version}`);
  const eng = JSON.parse(vs(['--json', 'engines', 'list']).stdout || '{}');
  const b = (eng.tts?.backends || []).find((x) => x.id === ENGINE);
  console.log(`${ENGINE}: ${b?.available ? 'ready' : `not ready (${b?.reason || 'unknown'})`}`);
  console.log(vs(['voices', 'list']).stdout.split('\n').filter((l) => l.trim() && !/demo/i.test(l)).map((l) => 'voice: ' + l.split('\t').slice(0, 3).join(' | ')).join('\n') || 'no saved voices yet');
} else if (cmd === 'clone') {
  const ref = positional[0], text = opt('--text'), name = opt('--name', 'Bryan Tabora');
  if (!ref || !text) { console.log('usage: node studio/voice.mjs clone <ref.wav> --text "<exact words in the clip>" [--name ...]'); process.exit(2); }
  const r = vs(['--json', 'voices', 'clone', '--name', name, '--engine', ENGINE, '--language', 'en', '--audio', winPath(ref), '--ref-text', text]);
  console.log(r.status ? r.stderr || r.stdout : `saved voice "${name}"`);
  process.exit(r.status ?? 0);
} else if (cmd === 'speak') {
  const line = positional[0], out = rest[rest.indexOf('-o') + 1], takes = Number(opt('--takes', 3)), voice = opt('--voice', 'Bryan Tabora');
  if (!line || rest.indexOf('-o') < 0) { console.log('usage: node studio/voice.mjs speak "<line>" -o <out.wav> [--takes 3]'); process.exit(2); }
  // Spell out money for the voice ("$500,000" -> "five hundred thousand dollars") so it reads the number right.
  const spoken = line.replace(/\$([\d,]+)/g, (m, n) => `${Number(n.replace(/,/g, '')).toLocaleString('en-US')} dollars`);
  const base = out.replace(/\.wav$/i, '');
  const seeds = [42, 27, 11, 7, 63].slice(0, takes);
  for (const s of seeds) {
    // The first call after the engine loads can fail while it warms up: retry once.
    let r = vs(['speak', '--voice', voice, '--engine', ENGINE, '--language', 'en', '--seed', String(s), '-o', winPath(`${base}-${s}.wav`), '--overwrite', spoken]);
    if (r.status) r = vs(['speak', '--voice', voice, '--engine', ENGINE, '--language', 'en', '--seed', String(s), '-o', winPath(`${base}-${s}.wav`), '--overwrite', spoken]);
    const d = r.status ? null : spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', `${base}-${s}.wav`], { encoding: 'utf8' }).stdout.trim();
    console.log(r.status ? `seed ${s}: FAILED ${(r.stderr || r.stdout).slice(0, 200)}` : `seed ${s}: ${base}-${s}.wav (${Number(d).toFixed(2)} s)`);
  }
  console.log('Next: transcribe each take, compare its pitch to the reference, then listen (docs/studio/voice.md "Checking a take").');
} else {
  console.log(`unknown command: ${cmd}`); process.exit(2);
}
