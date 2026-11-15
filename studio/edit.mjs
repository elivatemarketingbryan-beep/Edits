// One flow for a motion-graphic edit: plan -> fit -> build -> cut -> check.
//   node studio/edit.mjs plan  <id> [--gap s]        search the library from the transcript; write jobs/<id>/brief.json
//   node studio/edit.mjs fit   <id>                  start a plan file for every board in the brief, listing its parts
//   node studio/edit.mjs build <id>                  fit and render every finished plan (resumable)
//   node studio/edit.mjs cut   <id> [--range a b]    put the rendered boards over the footage
//   node studio/edit.mjs check <id>                  listen to unheard sounds, then run the checklist gate
//   node studio/edit.mjs status <id>
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [cmd, id, ...rest] = process.argv.slice(2);
if (!cmd || !id) { console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(0, 7).join('\n')); process.exit(2); }
const job = path.join(ROOT, 'jobs', id), boards = path.join(ROOT, 'projects', id, 'boards');
const opt = (n, d) => { const i = rest.indexOf(n); return i >= 0 ? rest[i + 1] : d; };
const t = (x) => `${Math.floor(x / 60)}:${String(Math.floor(x % 60)).padStart(2, '0')}`;
const plans = () => fs.existsSync(boards) ? fs.readdirSync(boards).filter((f) => f.endsWith('.plan.json')) : [];

// How Bryan talks -> which graphics fit. Add a row when a new phrasing should trigger something.
const RULES = [
  // a story or scenario: act it out with the faceless figure (styles/REFERENCES.md "Moonshot Motion"); premium ones that already act a scene out
  [/\bimagine\b|\bpicture this\b|\blet's say\b|\bthink of\b|\bfor example\b|\ba client of mine\b|\bone of my clients\b|\bi remember\b|\bthere was\b|\bwhen i was\b|\bstarting over\b/i, ['S01-climb'], 'a story or scenario', 4],
  [/\$\s?\d/, ['C239PriceCard', 'P198Odometer', 'C108Waterfall'], 'a price or money figure', 3],
  [/\bfrom \$?\d.*\bto \$?\d|\bused to\b|\bbefore\b.*\bnow\b/i, ['C111Slope', 'P209Flip'], 'before and after', 3],
  [/\bversus\b|\bvs\b|\bbut only has\b|\bcompare\b|\binstead of\b/i, ['C249VersusCards', 'Y164Versus'], 'comparing two things', 3],
  [/\bstep (one|two|three|four|five|\d)\b/i, ['D53Steps', 'P236Checklist'], 'numbered steps', 3],
  [/\bquestions?\b/i, ['H143Agenda', 'C247ChipFilter'], 'a set of questions', 2],
  [/\bnot everyone\b|\bout of all\b|\bqualified\b|\bstages?\b/i, ['D48Funnel', 'C247ChipFilter'], 'something narrowing down', 2],
  [/\bpriority\b|\bprioritize\b|\brank\b|\bwinner\b/i, ['C114Ranking', 'K123Scorecard'], 'ranking or priority', 3],
  [/\bpremium\b|\bstandard\b|\bbasic\b|\btiers?\b|\boptions\b/i, ['C240TableFocus', 'K123Scorecard'], 'options side by side', 2],
  [/\byou assume\b|\byou think\b|\bmost (people|contractors)\b|\bwhat people\b/i, ['H144MythFact', 'P228CrossOut'], 'a belief being corrected', 2],
  [/\bcrm\b|\bpipeline\b|\bautomatic|\bsystem\b/i, ['C245NodeGraph', 'W69Nodes', 'Y182SystemMap'], 'a system or flow', 2],
  [/\bevery time\b|\bover and over\b|\bloop\b/i, ['D47Cycle'], 'a repeating process', 2],
  [/\btext|\bmessag|\bghost|\bdm\b/i, ['P219Chat'], 'a conversation', 2],
  [/\bphone\b|\bcalls?\b|\bwebsite\b/i, ['C246Phone', 'C242AppFocus'], 'a phone or app', 1],
  [/\bif they\b|\bif someone\b/i, ['A141Decision', 'D52Tree'], 'a decision', 2],
  [/\bbreaks? down\b|\bstack\b|\badds? up\b|\bwarrant/i, ['C108Waterfall', 'C244Receipt', 'D46Pyramid'], 'something built from parts', 2],
  [/\bbig takeaway\b|\bremember\b|\bnever\b/i, ['D57Quote', 'P237Highlighter'], 'a line worth remembering', 2],
  [/\blet's start\b|\bso who\b|\bnow they're\b/i, ['D56Chapter'], 'a new section', 2],
  [/\bwatch my next video\b|\bsubscribe\b/i, ['X41EndLayout'], 'the sign-off', 3],
];

function plan() {
  const lib = JSON.parse(fs.readFileSync(path.join(ROOT, 'styles/library.json'), 'utf8'));
  const byId = Object.fromEntries(lib.map((i) => [i.id, i]));
  const premium = lib.filter((i) => i.kind === 'premium');
  const raw = JSON.parse(fs.readFileSync(path.join(job, 'transcript.json'), 'utf8'));
  const segs = Array.isArray(raw) ? raw : raw.segments;
  const GAP = Number(opt('--gap', 15));
  const hits = [];
  for (const s of segs) for (const [re, ids, why, weight] of RULES) if (re.test(s.text)) {
    // a graphic Bryan already approved for this kind of moment goes in front of the boards
    const own = premium.filter((p) => re.test(`${p.name} ${p.say}`)).map((p) => p.id);
    hits.push({ s, ids: [...own, ...ids], why, weight });
  }
  hits.sort((a, b) => b.weight - a.weight || a.s.start - b.s.start);
  const picks = [], used = new Map();
  for (const h of hits) {
    if (picks.some((p) => Math.abs(p.start - h.s.start) < GAP)) continue;
    const pick = h.ids.slice().sort((a, b) => (used.get(a) ?? 0) - (used.get(b) ?? 0))[0];
    if (byId[pick]?.kind !== 'story' && (used.get(pick) ?? 0) >= 1 && h.ids.every((x) => (used.get(x) ?? 0) >= 1)) continue;   // a story gets a new scene each time   // never the same graphic twice in one video
    used.set(pick, (used.get(pick) ?? 0) + 1);
    const it = byId[pick];
    picks.push({ start: h.s.start, end: h.s.end, line: h.s.text.trim(), id: pick, kind: it.kind, name: it.name, why: h.why, also: h.ids.filter((x) => x !== pick).slice(0, 4), how: it.how });
  }
  picks.sort((a, b) => a.start - b.start);
  fs.writeFileSync(path.join(job, 'brief.json'), JSON.stringify(picks, null, 1));
  for (const p of picks) console.log(`${t(p.start).padStart(5)}  ${p.id.padEnd(22).slice(0, 22)} ${p.why.padEnd(26)} "${p.line.slice(0, 54)}"`);
  console.log(`\n${picks.length} moments, ${new Set(picks.map((p) => p.id)).size} different graphics (${picks.filter((p) => p.kind === 'premium').length} approved, ${picks.filter((p) => p.kind === 'board').length} boards) -> jobs/${id}/brief.json`);
}

function fit() {
  const brief = JSON.parse(fs.readFileSync(path.join(job, 'brief.json'), 'utf8'));
  fs.mkdirSync(boards, { recursive: true });
  let made = 0;
  for (const b of brief) {
    if (b.kind === 'story') { console.log(`  ${t(b.start)} story: write a new scene for "${b.line.slice(0, 50)}" with assets/boards/story/kit.js (start from ${b.id})`); continue; }
    if (b.kind !== 'board') { console.log(`  ${t(b.start)} ${b.id}: approved graphic, copy it and change the words and times by hand`); continue; }
    const name = `${b.id.toLowerCase()}-${Math.round(b.start)}`, f = path.join(boards, `${name}.plan.json`);
    if (fs.existsSync(f)) continue;
    const parts = execFileSync('python', ['studio/board-fit.py', '--list', b.id], { cwd: ROOT, encoding: 'utf8' }).trim().split('\n').map((l) => l.replace(/\s+/g, ' ').trim());
    fs.writeFileSync(f, JSON.stringify({ TODO: 'Fill beats with the real words, then delete TODO', line: b.line, parts, job: id, board: b.id, name, t0: Math.max(0, b.start - 0.4), dur: Math.ceil(b.end - b.start + 1.5), title: '', speaker: 'remove', drop: [], beats: [] }, null, 1));
    made++;
  }
  console.log(`${made} new plan(s) in projects/${id}/boards/. Fill each one's beats, then: node studio/edit.mjs build ${id}`);
}

function build() {
  const ready = plans().filter((p) => !JSON.parse(fs.readFileSync(path.join(boards, p), 'utf8')).TODO);
  console.log(`${ready.length} of ${plans().length} plans ready`);
  const assets = path.join(boards, 'assets');
  if (ready.length && !fs.existsSync(assets)) fs.cpSync(path.join(ROOT, 'assets/boards/assets'), assets, { recursive: true });
  let bad = 0;
  for (const p of ready) {
    const name = p.replace('.plan.json', ''), mp4 = path.join(boards, `${name}.mp4`), pf = path.join(boards, p);
    if (fs.existsSync(mp4) && fs.statSync(mp4).mtimeMs > fs.statSync(pf).mtimeMs) { console.log(`  skip ${name}`); continue; }
    const fitted = spawnSync('python', ['studio/board-fit.py', pf], { cwd: ROOT, encoding: 'utf8' });
    if (fitted.status) { console.log(`  FAIL ${name}: ${fitted.stderr.trim() || fitted.stdout.trim()}`); bad++; continue; }
    const r = spawnSync('npx', ['--yes', 'hyperframes@0.7.68', 'render', '-c', `${name}.html`, '--format', 'mp4', '--quality', 'high', '--frames-cache-dir', 'off', '-o', `${name}.mp4`, '--quiet'], { cwd: boards, encoding: 'utf8', shell: process.platform === 'win32', timeout: 180000, stdio: ['ignore', 'pipe', 'pipe'] });
    if (r.status !== 0 || !fs.existsSync(mp4)) { console.log(`  FAIL ${name}: render stopped`); bad++; continue; }
    console.log(`  ok   ${name}`);
  }
  process.exit(bad ? 1 : 0);
}

function cut() {
  const base = [path.join(job, '.nosfx.mp4'), path.join(job, 'source.mp4')].find((f) => fs.existsSync(f));
  const i = rest.indexOf('--range'), range = i >= 0 ? [Number(rest[i + 1]), Number(rest[i + 2])] : null;
  const list = plans().map((p) => [p.replace('.plan.json', ''), JSON.parse(fs.readFileSync(path.join(boards, p), 'utf8'))]).filter(([n, p]) => !p.TODO && fs.existsSync(path.join(boards, `${n}.mp4`)) && (!range || (p.t0 < range[1] && p.t0 + p.dur > range[0])));
  if (!list.length) { console.log('no rendered boards in that range'); process.exit(1); }
  const offset = range ? range[0] : 0;
  const args = ['-nostdin', '-hide_banner', '-loglevel', 'error', '-y', ...(range ? ['-ss', `${range[0]}`, '-t', `${range[1] - range[0]}`] : []), '-i', base];
  let fc = '[0:v:0]scale=1920:1080,setsar=1,format=yuv420p[b0]', cur = 'b0';
  list.forEach(([n, p], k) => {
    args.push('-i', path.join(boards, `${n}.mp4`));
    const st = p.t0 - offset;
    fc += `;[${k + 1}:v]format=yuva420p,fade=t=in:st=0:d=0.25:alpha=1,fade=t=out:st=${p.dur - 0.3}:d=0.3:alpha=1,setpts=PTS+${st}/TB[g${k}];[${cur}][g${k}]overlay=eof_action=pass[b${k + 1}]`;
    cur = `b${k + 1}`;
  });
  const out = range ? path.join(boards, `cut-${range[0]}-${range[1]}.mp4`) : path.join(job, '.nosfx.boards.mp4');
  args.push('-filter_complex', fc, '-map', `[${cur}]`, '-map', '0:a?', '-c:v', 'libx264', '-crf', '17', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '256k', out);
  const r = spawnSync('ffmpeg', args, { encoding: 'utf8', timeout: 800000 });
  if (r.status) { console.log(r.stderr.slice(-400)); process.exit(1); }
  console.log(`${list.length} board(s) -> ${path.relative(ROOT, out)}. Next: add sounds with studio/sfx.mjs, then edit.mjs check.`);
}

function check() {
  const py = path.join(os.homedir(), '.cache/earshot-venv/Scripts/python.exe');
  const f = path.join(job, 'sfx.json');
  if (fs.existsSync(f) && fs.existsSync(py)) {
    const heardF = path.join(ROOT, 'styles/sfx-heard.json');
    const heard = fs.existsSync(heardF) ? JSON.parse(fs.readFileSync(heardF, 'utf8')) : {};
    const lib = JSON.parse(fs.readFileSync(path.join(ROOT, 'styles/sfx.json'), 'utf8')).cues;
    const todo = [...new Set(JSON.parse(fs.readFileSync(f, 'utf8')).map((c) => c.cue))].filter((c) => lib[c] && !heard[c]);
    if (todo.length) spawnSync(py, ['studio/listen.py', 'cues', ...todo], { cwd: ROOT, stdio: 'inherit', timeout: 600000 });
  }
  const r = spawnSync('node', ['studio/preflight.mjs', id], { cwd: ROOT, stdio: 'inherit' });
  process.exit(r.status);
}

function status() {
  const b = path.join(job, 'brief.json');
  console.log(fs.existsSync(b) ? `brief: ${JSON.parse(fs.readFileSync(b, 'utf8')).length} moments` : 'brief: none yet (edit.mjs plan)');
  for (const p of plans()) { const n = p.replace('.plan.json', ''); console.log(`  ${n.padEnd(28)} ${JSON.parse(fs.readFileSync(path.join(boards, p), 'utf8')).TODO ? 'needs words' : fs.existsSync(path.join(boards, `${n}.mp4`)) ? 'rendered' : 'ready to build'}`); }
}

({ plan, fit, build, cut, check, status }[cmd] ?? (() => { console.log(`unknown step ${cmd}`); process.exit(2); }))();
