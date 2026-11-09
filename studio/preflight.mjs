// Checks a job against Bryan's checklist (styles/EDIT-PREFERENCES.md) before he sees it.
// `node studio/preflight.mjs <job id> [--sfx file]`  exits 1 on any FAIL. `jobs.mjs stage` runs this before review, final and done.
// Each check names the rule it enforces. Rules a script can't judge are listed at the end for a human-style look.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BANNED = /^(hit|glitch|SFX-1389|SFX-0814|SFX-0802|SFX-0912|thd-|air-)/;   // bonks, booms, scratchy glitches, the kazoo set
const REPEAT_OK = new Set(['lst-12', 'lst-stage']);   // Bryan picked these for lists and stages; they may repeat

export function preflight(id, sfxFile) {
  const fails = [], warns = [];
  const job = path.join(ROOT, 'jobs', id);
  const read = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
  const sfxPath = sfxFile ?? path.join(job, 'sfx.json');
  const lib = read(path.join(ROOT, 'styles/sfx.json')).cues;
  const heardFile = path.join(ROOT, 'styles/sfx-heard.json');
  const heard = fs.existsSync(heardFile) ? read(heardFile) : {};
  const approvedFile = path.join(ROOT, 'styles/sfx-approved.json');   // his ears beat the model
  const approved = new Set(fs.existsSync(approvedFile) ? read(approvedFile).cues : []);

  if (fs.existsSync(sfxPath)) {
    const raw = read(sfxPath);
    const cues = (Array.isArray(raw) ? raw : raw.cues).slice().sort((a, b) => a.at - b.at);
    const count = {};
    cues.forEach((c, i) => {
      count[c.cue] = (count[c.cue] ?? 0) + 1;
      if (!lib[c.cue] && !/^SFX-\d+/.test(c.cue)) fails.push(`${c.at}s: unknown sound "${c.cue}"`);
      if (BANNED.test(c.cue)) fails.push(`${c.at}s: "${c.cue}" is banned (no bonks, booms or scratchy glitches)`);
      const h = heard[c.cue];
      if (h?.reject && !approved.has(c.cue)) fails.push(`${c.at}s: "${c.cue}" failed listening: ${h.reject}`);
      const p = cues[i - 1];
      if (!p) return;
      if (c.at - p.at < 0.08) fails.push(`${c.at}s: two sounds on one beat ("${p.cue}" and "${c.cue}")`);
      if (c.cue === p.cue && !REPEAT_OK.has(c.cue)) fails.push(`${c.at}s: "${c.cue}" plays twice in a row`);
      if (c.at < 30 && c.at - p.at < 3) fails.push(`${c.at}s: too busy for the opening (about one sound every 5 s in the first 30 s)`);
      else if (c.at < 30 && c.at - p.at < 4.5) warns.push(`${c.at}s: opening is a little busy (${(c.at - p.at).toFixed(1)} s since the last sound)`);
    });
    for (const [k, n] of Object.entries(count)) if (n > 6 && !REPEAT_OK.has(k)) fails.push(`"${k}" is used ${n} times (no sound more than a few times)`);
    const unheard = [...new Set(cues.map((c) => c.cue))].filter((k) => !heard[k]);
    if (unheard.length) warns.push(`not listened to yet: ${unheard.join(', ')} (run studio/listen.py cues ${unheard.join(' ')})`);
  } else warns.push('no sfx.json yet');

  const gfx = path.join(job, 'graphics.json');
  if (fs.existsSync(gfx)) for (const g of read(gfx)) {
    if (!g.file) continue;
    const f = path.join(ROOT, g.file);
    if (!fs.existsSync(f)) { fails.push(`${g.id}: file missing (${g.file})`); continue; }
    const h = fs.readFileSync(f, 'utf8');
    const body = h.slice(h.search(/<body/i));
    if (/sample-tag/.test(body.replace(/<style[\s\S]*?<\/style>/g, ''))) fails.push(`${g.id}: still has its SAMPLE tag`);
    if (/example data/i.test(body)) fails.push(`${g.id}: still says "example data"`);
    if (/\byour client\b/i.test(body)) fails.push(`${g.id}: says "your client" (always "my client")`);
    if (/#2563EB/i.test(body.replace(/<style[\s\S]*?<\/style>/g, ''))) fails.push(`${g.id}: off-brand blue`);
  }
  return { fails, warns };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [id, ...rest] = process.argv.slice(2);
  if (!id) { console.log('usage: node studio/preflight.mjs <job id> [--sfx file]'); process.exit(2); }
  const i = rest.indexOf('--sfx');
  const { fails, warns } = preflight(id, i >= 0 ? rest[i + 1] : undefined);
  for (const w of warns) console.log('  warn ', w);
  for (const f of fails) console.log('  FAIL ', f);
  const rules = (fs.readFileSync(path.join(ROOT, 'styles/EDIT-PREFERENCES.md'), 'utf8').match(/^- (DO|DON'T):/gm) ?? []).length;
  console.log(fails.length ? `${fails.length} problem(s). Not ready to show.` : `Passed. ${rules} rules on the checklist; layout, taste and picture rules still need a look at the frames.`);
  process.exit(fails.length ? 1 : 0);
}
