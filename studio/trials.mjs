// Trial reels: test 2-4 versions of one reel on Instagram (trial reels go to non-followers first),
// log each version's numbers, keep the winner. The Trial Reels page (/trials) is the front door;
// Claude answers its requests ("run my studio jobs"), the same way as plans and edits.
//
// A trial is a folder: plans/trials/<id>/trial.json, and per version <vid>/raw/ (footage) and
// <vid>/final/ (the finished reel). plans/ is gitignored: the repo is public.
//
//   node studio/trials.mjs pending        trials waiting on Claude
//   node studio/trials.mjs show <id>      everything about one trial (JSON)
//   node studio/trials.mjs done <id>      clear its request after answering it
//
// Requests: hooks (write the versions), cut (cut versions from a finished long-form video), variations
// (render the other versions from one finished reel), farm (a new varied repost of the winner), revise. Rules: styles/TRIAL-REELS.md. Docs: docs/studio/trials.md.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { listPlans, readPlan } from './plans.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const TRIALS = path.join(ROOT, 'plans', 'trials');
const JOBS = path.join(ROOT, 'jobs');

export const REQUESTS = { hooks: 'Write hooks & scripts', cut: 'Cut from long-form', animate: 'Animate it (my cloned voice)', variations: 'Make versions from one reel', farm: 'Make a repost version', revise: 'Revise' };
// filmed: Bryan films it. animated: a cartoon story reel voiced by his cloned voice (docs/studio/voice.md, use 2).
export const FORMATS = { filmed: 'Filmed', animated: 'Animated, my cloned voice' };
// The stage is worked out from the versions, so every view agrees (no stage to keep in sync by hand).
export const STAGES = ['idea', 'scripted', 'filming', 'ready', 'testing', 'done'];
export const STAGE_LABEL = { idea: 'Idea', scripted: 'Scripted', filming: 'Filming', ready: 'Ready to post', testing: 'Testing', done: 'Farming the winner' };
export const MAX_VERSIONS = 10;   // Max Tornow: post 5-10 slightly different versions of one reel
const KINDS = { raw: 'raw', final: 'final', voice: 'voice' };
const VID = /\.(mp4|mov|m4v|webm|mkv)$/i, AUD = /\.(wav|mp3|m4a|aac|flac|ogg)$/i;
// The words Bryan approved for his cloned voice, exactly: any edit after approving needs a new OK.
const spokenText = (v) => `${(v.hook || '').trim()}\n${(v.script || '').trim()}`;
// views..follows from Instagram's numbers; skipRate (%), avgWatch (seconds) and length (seconds) are
// what heyDominik's data says decides a breakout (docs/studio/trials.md, styles/TRIAL-REELS.md).
const RESULT_KEYS = ['views', 'nonFollowerPct', 'likes', 'comments', 'shares', 'saves', 'follows', 'skipRate', 'avgWatch', 'length'];
const LETTERS = 'ABCDEFGHIJ';
const FARM_KINDS = { trial: 'Trial repost (with variations)', feed: 'Feed repost', remake: 'Remake (same script, new format)' };
const addDays = (d, n) => { const x = new Date(d + 'T12:00'); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };

const dir = (id) => path.join(TRIALS, path.basename(id));
const vdir = (id, vid, kind) => path.join(dir(id), path.basename(vid), KINDS[kind]);

export function newTrialId(idea = 'trial') {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const slug = idea.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'trial';
  let id = `${stamp}-${slug}`, n = 2;
  while (fs.existsSync(dir(id))) id = `${stamp}-${slug}-${n++}`;
  return id;
}

function files(id, vid, kind) {
  const d = vdir(id, vid, kind);
  if (!fs.existsSync(d)) return [];
  return fs.readdirSync(d).filter((n) => fs.statSync(path.join(d, n)).isFile())
    .map((name) => ({ name, path: `${vid}/${KINDS[kind]}/${name}`, size: fs.statSync(path.join(d, name)).size, added: fs.statSync(path.join(d, name)).mtime.toISOString() }))
    .sort((a, b) => b.added.localeCompare(a.added));
}

// Score for "who's leading": views first, then shares + saves (the signals that travel). Shown, never auto-picked.
const score = (r = {}) => (Number(r.views) || 0) + 20 * ((Number(r.shares) || 0) + (Number(r.saves) || 0));

export function readTrial(id) {
  const f = path.join(dir(id), 'trial.json');
  if (!fs.existsSync(f)) return null;
  const t = JSON.parse(fs.readFileSync(f, 'utf8'));
  t.variants ||= [];
  t.format ||= 'filmed';
  for (const v of t.variants) {
    v.raw = files(id, v.id, 'raw'); v.final = files(id, v.id, 'final'); v.voice = files(id, v.id, 'voice'); v.results ||= {};
    v.wordsApproved = !!(v.approved && v.approved.text === spokenText(v) && v.hook);
  }
  const vs = t.variants;
  t.stage = t.winner ? 'done' : vs.some((v) => v.posted) ? 'testing' : vs.some((v) => v.final.length) ? 'ready'
    : vs.some((v) => v.raw.length || v.voice.length || v.job) ? 'filming' : vs.some((v) => v.hook) ? 'scripted' : 'idea';
  const measured = vs.filter((v) => Number(v.results.views) > 0);
  t.leader = measured.length >= 2 ? measured.reduce((a, b) => (score(b.results) > score(a.results) ? b : a)).id : null;
  t.requestLabel = t.request ? REQUESTS[t.request.kind] : null;
  // Farming: total views over time is the number that matters, not one reel's views.
  t.farm ||= [];
  t.totalViews = vs.reduce((n, v) => n + (Number(v.results.views) || 0), 0) + t.farm.reduce((n, r) => n + (Number(r.views) || 0), 0);
  const lastTrial = t.farm.filter((r) => r.kind === 'trial').map((r) => r.date).sort().pop() || (t.winner && vs.find((v) => v.id === t.winner)?.posted);
  t.nextTrialRepost = t.winner && lastTrial ? addDays(lastTrial, 7) : null;
  return t;
}

export function writeTrial(t) {
  const rest = { ...t, variants: (t.variants || []).map(({ raw, final, voice, wordsApproved, ...v }) => v) };
  for (const k of ['stage', 'leader', 'requestLabel', 'totalViews', 'nextTrialRepost']) delete rest[k];
  fs.mkdirSync(dir(t.id), { recursive: true });
  rest.updated = new Date().toISOString();
  fs.writeFileSync(path.join(dir(t.id), 'trial.json'), JSON.stringify(rest, null, 2));
  return readTrial(t.id);
}

export function listTrials() {
  if (!fs.existsSync(TRIALS)) return [];
  return fs.readdirSync(TRIALS).map(readTrial).filter(Boolean).sort((a, b) => b.created.localeCompare(a.created));
}

// Finished long-form videos a trial can be cut from: done studio jobs with a final, and plans with a finished edit.
export function sources() {
  const out = [];
  if (fs.existsSync(JOBS)) for (const id of fs.readdirSync(JOBS)) {
    const f = path.join(JOBS, id, 'job.json');
    if (!fs.existsSync(f)) continue;
    try {
      const j = JSON.parse(fs.readFileSync(f, 'utf8'));
      if (j.final && j.mode !== 'reels' && (j.finalDuration || j.duration || 0) >= 120) out.push({ kind: 'job', id, label: j.title || id, at: j.updated || j.created });
    } catch {}
  }
  for (const p of listPlans()) if ((p.assets || []).some((a) => a.kind === 'final')) out.push({ kind: 'plan', id: p.id, label: p.titles?.find((t) => t.chosen)?.text || p.title, at: p.updated });
  return out.sort((a, b) => String(b.at).localeCompare(String(a.at)));
}

const num = (v) => (v === '' || v == null ? null : Math.max(0, Number(v) || 0));
function cleanVariant(v, prev = {}) {
  const out = { ...prev };
  if (v.hook !== undefined) out.hook = String(v.hook).slice(0, 400);
  if (v.script !== undefined) out.script = String(v.script).slice(0, 6000);
  if (v.changes !== undefined) out.changes = String(v.changes).slice(0, 300);
  // Approving stores the exact words; un-approving (or changing them) means Claude may not voice them.
  if (v.approve === true) out.approved = { text: spokenText(out), at: new Date().toISOString() };
  if (v.approve === false) out.approved = null;
  if (v.posted !== undefined) out.posted = /^\d{4}-\d{2}-\d{2}$/.test(v.posted) ? v.posted : null;
  if (v.results) { out.results = { ...(prev.results || {}) }; for (const k of RESULT_KEYS) if (k in v.results) out.results[k] = num(v.results[k]); }
  return out;
}

function saveUpload(id, vid, kind, filename, req) {
  return new Promise((ok, fail) => {
    if (!KINDS[kind]) return fail(new Error('Unknown upload kind'));
    if (kind === 'voice' ? !AUD.test(filename) : !VID.test(filename)) return fail(new Error(kind === 'voice' ? 'Voiceovers must be WAV, MP3, M4A, AAC, FLAC or OGG.' : 'Reels must be MP4, MOV, M4V, WEBM or MKV.'));
    const d = vdir(id, vid, kind);
    fs.mkdirSync(d, { recursive: true });
    const base = path.basename(filename).replace(/[^\w.() -]+/g, '_').slice(-120) || 'reel.mp4';
    let name = base, n = 2;
    while (fs.existsSync(path.join(d, name))) name = base.replace(/(\.[^.]*)?$/, (ext) => ` (${n++})${ext}`);
    const out = fs.createWriteStream(path.join(d, name));
    req.pipe(out);
    out.on('finish', () => ok(name));
    out.on('error', fail);
  });
}

// A studio job made from a version reports back here (jobs.mjs setStage calls this): editing, then the
// finished reel is copied into the version's final/ folder.
export function syncTrialFromJob(job) {
  if (!job?.trial?.id) return;
  const t = readTrial(job.trial.id);
  const v = t?.variants.find((x) => x.id === job.trial.variant);
  if (!v) return;
  if (job.stage === 'done' && job.final) {
    const src = path.join(JOBS, job.id, job.final);
    const d = vdir(t.id, v.id, 'final');
    const dest = path.join(d, `${t.id}-${v.id}.mp4`);
    if (fs.existsSync(src) && !fs.existsSync(dest)) { fs.mkdirSync(d, { recursive: true }); fs.copyFileSync(src, dest); }
  }
  if (v.job !== job.id) { v.job = job.id; writeTrial(t); }
}

export function trialRoutes({ send, readBody, serveFile, inside }) {
  const need = (res, id) => { const t = readTrial(id); if (!t) send(res, 404, { error: 'No such trial' }); return t; };
  return [
    ['GET', /^\/api\/trials$/, (req, res) => send(res, 200, { trials: listTrials(), stages: STAGES, labels: STAGE_LABEL, farmKinds: FARM_KINDS, maxVersions: MAX_VERSIONS, formats: FORMATS })],
    ['GET', /^\/api\/trials\/sources$/, (req, res) => send(res, 200, { sources: sources() })],
    ['POST', /^\/api\/trials$/, async (req, res) => {
      const b = await readBody(req);
      const idea = String(b.idea || '').trim().slice(0, 200);
      if (!idea) return send(res, 400, { error: 'Say what the reel is about first.' });
      const id = newTrialId(idea), src = sources().find((s) => s.kind === b.source?.kind && s.id === b.source?.id) || null;
      const count = Math.min(MAX_VERSIONS, Math.max(2, Number(b.count) || 5));
      const variants = Array.from({ length: count }, (_, i) => ({ id: 'v' + (i + 1), label: LETTERS[i], hook: '', script: '', results: {} }));
      send(res, 200, writeTrial({ id, idea, notes: String(b.notes || '').slice(0, 8000), source: src, format: FORMATS[b.format] ? b.format : 'filmed', variants, request: null, winner: null, farm: [], created: new Date().toISOString() }));
    }],
    ['GET', /^\/api\/trials\/([\w-]+)$/, (req, res, [id]) => { const t = need(res, id); if (t) send(res, 200, t); }],
    ['POST', /^\/api\/trials\/([\w-]+)$/, async (req, res, [id]) => {
      const t = need(res, id); if (!t) return;
      const b = await readBody(req);
      if (b.idea !== undefined) { const idea = String(b.idea).trim().slice(0, 200); if (!idea) return send(res, 400, { error: 'The idea can\'t be empty.' }); t.idea = idea; }
      if (b.notes !== undefined) t.notes = String(b.notes).slice(0, 8000);
      if (b.format !== undefined && FORMATS[b.format]) t.format = b.format;
      if (b.source !== undefined) t.source = b.source ? sources().find((s) => s.kind === b.source.kind && s.id === b.source.id) || null : null;
      if (b.winner !== undefined) t.winner = b.winner && t.variants.some((v) => v.id === b.winner) ? b.winner : null;
      send(res, 200, writeTrial(t));
    }],
    ['POST', /^\/api\/trials\/([\w-]+)\/variants\/([\w-]+)$/, async (req, res, [id, vid]) => {
      const t = need(res, id); if (!t) return;
      const i = t.variants.findIndex((v) => v.id === vid);
      if (i < 0) return send(res, 404, { error: 'No such version' });
      t.variants[i] = cleanVariant(await readBody(req), t.variants[i]);
      send(res, 200, writeTrial(t));
    }],
    ['POST', /^\/api\/trials\/([\w-]+)\/variants$/, (req, res, [id]) => {
      const t = need(res, id); if (!t) return;
      if (t.variants.length >= MAX_VERSIONS) return send(res, 400, { error: `${MAX_VERSIONS} versions is the most worth testing at once.` });
      const n = Math.max(0, ...t.variants.map((v) => Number(v.id.slice(1)) || 0)) + 1;
      t.variants.push({ id: 'v' + n, label: LETTERS[t.variants.length], hook: '', script: '', results: {} });
      send(res, 200, writeTrial(t));
    }],
    ['POST', /^\/api\/trials\/([\w-]+)\/variants\/([\w-]+)\/delete$/, (req, res, [id, vid]) => {
      const t = need(res, id); if (!t) return;
      if (t.variants.length <= 2) return send(res, 400, { error: 'A trial needs at least two versions.' });
      t.variants = t.variants.filter((v) => v.id !== vid);
      t.variants.forEach((v, i) => (v.label = LETTERS[i]));
      if (t.winner === vid) t.winner = null;
      fs.rmSync(path.join(dir(id), path.basename(vid)), { recursive: true, force: true });
      send(res, 200, writeTrial(t));
    }],
    ['POST', /^\/api\/trials\/([\w-]+)\/request$/, async (req, res, [id]) => {
      const t = need(res, id); if (!t) return;
      const { kind, note = '' } = await readBody(req);
      if (!REQUESTS[kind]) return send(res, 400, { error: 'Unknown request' });
      if (kind === 'cut' && !t.source) return send(res, 400, { error: 'Pick the long-form video to cut from first.' });
      if (kind === 'revise' && !String(note).trim()) return send(res, 400, { error: 'Say what should change.' });
      if (kind === 'variations' && !t.variants.some((v) => v.final.length)) return send(res, 400, { error: 'Finish one version first (upload it or send it to the editor), then the rest are made from it.' });
      if (kind === 'farm' && !t.winner) return send(res, 400, { error: 'Pick the winner first.' });
      if (kind === 'animate') {
        const written = t.variants.filter((v) => v.hook);
        if (!written.length) return send(res, 400, { error: 'Write the versions first.' });
        const unapproved = written.filter((v) => !v.wordsApproved).map((v) => v.label);
        if (unapproved.length) return send(res, 400, { error: `Approve the words on version ${unapproved.join(', ')} first. Your cloned voice only says words you've OK'd.` });
      }
      t.request = { kind, note: String(note).trim().slice(0, 2000), at: new Date().toISOString() };
      send(res, 200, writeTrial(t));
    }],
    // Farming log: every repost of the winner (trial repost, feed repost, remake) and its views.
    ['POST', /^\/api\/trials\/([\w-]+)\/farm$/, async (req, res, [id]) => {
      const t = need(res, id); if (!t) return;
      const b = await readBody(req);
      if (!FARM_KINDS[b.kind]) return send(res, 400, { error: 'Pick what kind of repost it was.' });
      if (!/^\d{4}-\d{2}-\d{2}$/.test(b.date || '')) return send(res, 400, { error: 'Add the date it went up.' });
      t.farm.push({ id: Date.now().toString(36), date: b.date, kind: b.kind, views: num(b.views), note: String(b.note || '').slice(0, 200) });
      t.farm.sort((a, c) => a.date.localeCompare(c.date));
      send(res, 200, writeTrial(t));
    }],
    ['POST', /^\/api\/trials\/([\w-]+)\/farm\/([\w-]+)$/, async (req, res, [id, rid]) => {
      const t = need(res, id); if (!t) return;
      const b = await readBody(req), r = t.farm.find((x) => x.id === rid);
      if (!r) return send(res, 404, { error: 'No such repost' });
      if (b.delete) t.farm = t.farm.filter((x) => x.id !== rid); else r.views = num(b.views);
      send(res, 200, writeTrial(t));
    }],
    ['POST', /^\/api\/trials\/([\w-]+)\/cancel$/, (req, res, [id]) => { const t = need(res, id); if (t) send(res, 200, writeTrial({ ...t, request: null })); }],
    ['POST', /^\/api\/trials\/([\w-]+)\/delete$/, (req, res, [id]) => {
      if (!fs.existsSync(path.join(dir(id), 'trial.json'))) return send(res, 404, { error: 'No such trial' });
      fs.rmSync(dir(id), { recursive: true, force: true });
      send(res, 200, { ok: true });
    }],
    ['POST', /^\/api\/trials\/([\w-]+)\/upload$/, async (req, res, [id]) => {
      const t = need(res, id); if (!t) return;
      const q = new URL(req.url, 'http://x').searchParams, vid = q.get('variant') || '', kind = q.get('kind') || 'raw';
      if (!t.variants.some((v) => v.id === vid)) return send(res, 404, { error: 'No such version' });
      try { await saveUpload(id, vid, kind, decodeURIComponent(req.headers['x-filename'] || 'reel.mp4'), req); send(res, 200, readTrial(id)); }
      catch (e) { send(res, 400, { error: e.message }); }
    }],
    ['POST', /^\/api\/trials\/([\w-]+)\/files\/delete$/, async (req, res, [id]) => {
      if (!readTrial(id)) return send(res, 404, { error: 'No such trial' });
      const { path: rel } = await readBody(req);
      const file = /^v\d+\/(raw|final|voice)\/[^/\\]+$/.test(rel || '') && inside(dir(id), rel);
      if (!file || !fs.existsSync(file)) return send(res, 404, { error: 'No such file' });
      fs.rmSync(file);
      send(res, 200, readTrial(id));
    }],
    // Send a version's footage to the editor: a new 9:16 studio job that knows its hook and script.
    ['POST', /^\/api\/trials\/([\w-]+)\/variants\/([\w-]+)\/to-edit$/, async (req, res, [id, vid]) => {
      const t = need(res, id); if (!t) return;
      const v = t.variants.find((x) => x.id === vid);
      const { path: rel } = await readBody(req);
      const src = v && new RegExp(`^${vid}/raw/[^/\\\\]+$`).test(rel || '') && inside(dir(id), rel);
      if (!src || !fs.existsSync(src)) return send(res, 404, { error: 'No such clip' });
      const { newId, jobDir, writeJob } = await import('./jobs.mjs');   // runtime import: jobs.mjs imports this file
      const jobId = newId(`${t.idea} ${v.label}`);
      fs.mkdirSync(jobDir(jobId), { recursive: true });
      const source = 'source' + path.extname(src).toLowerCase();
      await fs.promises.copyFile(src, path.join(jobDir(jobId), source));
      fs.writeFileSync(path.join(jobDir(jobId), 'trial-script.md'), `# Trial reel: ${t.idea} (version ${v.label})\n\nHook: ${v.hook || ''}\n\n${v.script || ''}\n`);
      const job = writeJob({ id: jobId, title: `${t.idea} · ${v.label}`, source, created: new Date().toISOString(), stage: 'formats', mode: 'video',
        trial: { id, variant: vid }, trialScript: 'trial-script.md' });
      v.job = job.id;
      send(res, 200, { job: job.id, trial: writeTrial(t) });
    }],
    ['GET', /^\/trial-files\/([\w-]+)\/(v\d+\/(?:raw|final|voice)\/.+)$/, (req, res, [id, rel]) => {
      const file = inside(dir(id), rel);
      file ? serveFile(req, res, file) : send(res, 403, { error: 'Forbidden' });
    }],
  ];
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [cmd, id] = process.argv.slice(2);
  if (cmd === 'pending') {
    const todo = listTrials().filter((t) => t.request);
    if (!todo.length) console.log('No trial reels waiting on Claude.');
    for (const t of todo) console.log(`${t.id}  ${t.request.kind}${t.request.note ? `  note="${t.request.note}"` : ''}  idea="${t.idea}"  format=${t.format}${t.source ? `  source=${t.source.kind}:${t.source.id}` : ''}`);
  } else if (cmd === 'show') {
    const t = readTrial(id);
    if (!t) { console.log(`No trial ${id}`); process.exit(1); }
    let source = null;
    if (t.source?.kind === 'plan') source = { plan: readPlan(t.source.id, { files: false })?.title, script: path.relative(ROOT, path.join(ROOT, 'plans', t.source.id, 'script.md')) };
    if (t.source?.kind === 'job') source = { job: path.relative(ROOT, path.join(JOBS, t.source.id)), transcript: path.relative(ROOT, path.join(ROOT, 'projects', t.source.id, 'transcript', 'words.json')) };
    console.log(JSON.stringify({ ...t, dir: path.relative(ROOT, dir(id)), sourceFiles: source }, null, 2));
  } else if (cmd === 'done') {
    const t = readTrial(id);
    if (!t?.request) { console.log(`${id} has no open request.`); process.exit(1); }
    writeTrial({ ...t, request: null, lastDone: { kind: t.request.kind, at: new Date().toISOString() } });
    console.log(`${id} -> ${readTrial(id).stage} (request cleared)`);
  } else {
    console.log('usage: node studio/trials.mjs pending | show <id> | done <id>');
    process.exit(1);
  }
}
