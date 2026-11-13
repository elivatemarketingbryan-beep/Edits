// Plan page store: long-form videos from idea to script, before they become studio jobs.
// A plan is a folder: plans/<id>/plan.json plus outline.md and script.md (Claude writes those).
// plans/ is gitignored: the blueprint and scripts are personal. Flow: docs/studio/plans.md.
//
//   node studio/plans.mjs pending              plans waiting on Claude (an outline, script, story-lock pass or revision)
//   node studio/plans.mjs show <id>            the plan, its request and file paths
//   node studio/plans.mjs done <id>            Claude finished the request: clears it and moves the status on
//   node studio/plans.mjs export <id> [out]    spoken lines + cue tags only, for studio/script-cues.mjs
//   node studio/plans.mjs scripts              scripted plans not yet tied to a job (for the formats stage)
//   node studio/plans.mjs link <plan> <job>    tie a plan to the studio job made from its footage
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Own ROOT (not jobs.mjs's): jobs.mjs imports this file, so importing back would be circular.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const PLANS = path.join(ROOT, 'plans');
export const BLUEPRINT = path.join(PLANS, 'blueprint.md');

// Board columns, in order. Requests sit on top of a status; Claude answers them.
export const STATUSES = ['idea', 'outlined', 'scripted', 'filming', 'editing', 'ready', 'posted'];
const REQUESTS = { outline: 'outlined', script: 'scripted', lock: 'scripted', revise: null };
const REQUEST_LABEL = { outline: 'Outline & check', script: 'Write the script', lock: 'Story-lock pass', revise: 'Revise' };

const planDir = (id) => path.join(PLANS, path.basename(id));
const read = (f, fallback = '') => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : fallback);

export function newPlanId(title = 'video') {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'video';
  let id = `${stamp}-${slug}`, n = 2;
  while (fs.existsSync(planDir(id))) id = `${stamp}-${slug}-${n++}`;
  return id;
}

export function readPlan(id, { files = true } = {}) {
  const f = path.join(planDir(id), 'plan.json');
  if (!fs.existsSync(f)) return null;
  const plan = JSON.parse(fs.readFileSync(f, 'utf8'));
  if (files) {
    plan.outline = read(path.join(planDir(id), 'outline.md'));
    plan.script = read(path.join(planDir(id), 'script.md'));
  }
  plan.waitingOn = plan.request ? 'claude' : 'you';
  plan.requestLabel = plan.request ? REQUEST_LABEL[plan.request.kind] : null;
  return plan;
}

export function writePlan(plan) {
  const rest = { ...plan };
  for (const k of ['outline', 'script', 'waitingOn', 'requestLabel']) delete rest[k];
  fs.mkdirSync(planDir(plan.id), { recursive: true });
  rest.updated = new Date().toISOString();
  fs.writeFileSync(path.join(planDir(plan.id), 'plan.json'), JSON.stringify(rest, null, 2));
  return readPlan(plan.id);
}

export function listPlans() {
  if (!fs.existsSync(PLANS)) return [];
  return fs.readdirSync(PLANS, { withFileTypes: true }).filter((d) => d.isDirectory())
    .map((d) => readPlan(d.name, { files: false })).filter(Boolean)
    .sort((a, b) => b.created.localeCompare(a.created));
}

// The studio job's stage drives the plan's column once they're linked (jobs.mjs setStage calls this).
export function syncFromJob(job) {
  if (!job?.plan) return;
  const plan = readPlan(job.plan, { files: false });
  if (!plan) return;
  const status = job.stage === 'done' ? 'ready' : 'editing';
  if (plan.status !== status && plan.status !== 'posted') writePlan({ ...plan, status, job: job.id });
}

// Spoken lines only (headings and the packaging angles dropped), cue tags kept.
export function spokenScript(md) {
  const lines = md.split(/\r?\n/);
  const start = lines.findIndex((l) => /^##\s+Intro\b/i.test(l.trim()));
  return lines.slice(start < 0 ? 0 : start).map((l) => l.trim().replace(/^[*-]\s+/, ''))
    .filter((l) => l && !l.startsWith('#') && !/^\[[^\]A-Z]*[a-z][^\]]*\]$/.test(l))   // drop headings and stage notes like [5 sec pause]
    .join('\n') + '\n';
}

// ---- YouTube: the channel's public feed (latest ~15 videos with views and likes), cached 30 min.
const YT_CACHE = path.join(PLANS, 'youtube.json');
function channelId() {
  try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'styles', 'brand.json'), 'utf8')).youtubeChannelId || null; } catch { return null; }
}
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
export async function youtube({ force = false } = {}) {
  const id = channelId();
  if (!id) return { error: 'Add your channel ID to styles/brand.json as "youtubeChannelId".' };
  const cached = fs.existsSync(YT_CACHE) ? JSON.parse(fs.readFileSync(YT_CACHE, 'utf8')) : null;
  if (cached && !force && Date.now() - cached.at < 30 * 60 * 1000) return cached;
  try {
    const r = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${id}`, { signal: AbortSignal.timeout(15000) });
    if (!r.ok) throw new Error(`YouTube answered ${r.status}`);
    const xml = await r.text();
    const channel = decode((xml.match(/<title>([^<]*)<\/title>/) || [])[1] || '');
    const videos = xml.split('<entry>').slice(1).map((e) => ({
      id: (e.match(/<yt:videoId>([\w-]+)<\/yt:videoId>/) || [])[1],
      title: decode((e.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || ''),
      published: (e.match(/<published>([^<]+)<\/published>/) || [])[1],
      views: Number((e.match(/views="(\d+)"/) || [])[1] || 0),
      likes: Number((e.match(/starRating count="(\d+)"/) || [])[1] || 0),
    })).filter((v) => v.id);
    const data = { at: Date.now(), channel, channelId: id, videos };
    fs.mkdirSync(PLANS, { recursive: true });
    fs.writeFileSync(YT_CACHE, JSON.stringify(data, null, 2));
    return data;
  } catch (e) {
    return cached ? { ...cached, stale: true, error: e.message } : { error: `Couldn't reach YouTube: ${e.message}` };
  }
}

// ---- HTTP routes, mounted by server.mjs.
export function planRoutes({ send, readBody }) {
  const clean = (b) => ({
    title: String(b.title ?? '').trim().slice(0, 200),
    notes: String(b.notes ?? '').slice(0, 20000),
    cta: String(b.cta ?? '').slice(0, 500),
    acts: [2, 3, 4].includes(Number(b.acts)) ? Number(b.acts) : 3,
  });
  return [
    ['GET', /^\/api\/plans$/, (req, res) => send(res, 200, { plans: listPlans(), statuses: STATUSES })],
    ['GET', /^\/api\/plans\/([\w-]+)$/, (req, res, [id]) => { const p = readPlan(id); p ? send(res, 200, p) : send(res, 404, { error: 'No such plan' }); }],
    ['POST', /^\/api\/plans$/, async (req, res) => {
      const b = clean(await readBody(req));
      if (!b.title) return send(res, 400, { error: 'Give the video a working title first.' });
      send(res, 200, writePlan({ id: newPlanId(b.title), ...b, status: 'idea', request: null, job: null, created: new Date().toISOString() }));
    }],
    ['POST', /^\/api\/plans\/([\w-]+)$/, async (req, res, [id]) => {
      const plan = readPlan(id, { files: false });
      if (!plan) return send(res, 404, { error: 'No such plan' });
      const body = await readBody(req);
      const next = { ...plan, ...clean({ ...plan, ...body }) };
      if (body.status && STATUSES.includes(body.status)) next.status = body.status;
      if (typeof body.script === 'string') fs.writeFileSync(path.join(planDir(id), 'script.md'), body.script.slice(0, 200000));
      if (!next.title) return send(res, 400, { error: 'A plan needs a title.' });
      send(res, 200, writePlan(next));
    }],
    // Ask Claude for something: outline | script | lock | revise (with a note). One request at a time.
    ['POST', /^\/api\/plans\/([\w-]+)\/request$/, async (req, res, [id]) => {
      const plan = readPlan(id);
      if (!plan) return send(res, 404, { error: 'No such plan' });
      const { kind, note = '' } = await readBody(req);
      if (!REQUESTS.hasOwnProperty(kind)) return send(res, 400, { error: 'Unknown request' });
      if ((kind === 'lock' || kind === 'revise') && !plan.script && !plan.outline) return send(res, 400, { error: 'Write an outline or script first.' });
      if (kind === 'revise' && !String(note).trim()) return send(res, 400, { error: 'Say what should change.' });
      send(res, 200, writePlan({ ...plan, request: { kind, note: String(note).trim().slice(0, 2000), at: new Date().toISOString() } }));
    }],
    ['POST', /^\/api\/plans\/([\w-]+)\/cancel$/, (req, res, [id]) => {
      const plan = readPlan(id, { files: false });
      plan ? send(res, 200, writePlan({ ...plan, request: null })) : send(res, 404, { error: 'No such plan' });
    }],
    ['POST', /^\/api\/plans\/([\w-]+)\/delete$/, (req, res, [id]) => {
      const dir = planDir(id);
      if (!fs.existsSync(path.join(dir, 'plan.json'))) return send(res, 404, { error: 'No such plan' });
      fs.rmSync(dir, { recursive: true, force: true });
      send(res, 200, { ok: true });
    }],
    ['GET', /^\/api\/blueprint$/, (req, res) => send(res, 200, { text: read(BLUEPRINT) })],
    ['POST', /^\/api\/blueprint$/, async (req, res) => {
      const { text = '' } = await readBody(req);
      fs.mkdirSync(PLANS, { recursive: true });
      fs.writeFileSync(BLUEPRINT, String(text).slice(0, 200000));
      send(res, 200, { ok: true });
    }],
    ['GET', /^\/api\/youtube$/, async (req, res) => send(res, 200, await youtube({ force: new URL(req.url, 'http://x').searchParams.has('refresh') }))],
  ];
}

// ---- CLI for Claude.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [cmd, id, arg] = process.argv.slice(2);
  if (cmd === 'pending') {
    const todo = listPlans().filter((p) => p.request);
    if (!todo.length) console.log('No plans waiting on Claude.');
    for (const p of todo) console.log(`${p.id}  ${p.request.kind}${p.request.note ? `  note="${p.request.note}"` : ''}  title="${p.title}"`);
  } else if (cmd === 'show') {
    const p = readPlan(id, { files: false });
    if (!p) { console.log(`No plan ${id}`); process.exit(1); }
    console.log(JSON.stringify({ ...p, files: { dir: path.relative(ROOT, planDir(id)), outline: fs.existsSync(path.join(planDir(id), 'outline.md')), script: fs.existsSync(path.join(planDir(id), 'script.md')), blueprint: path.relative(ROOT, BLUEPRINT) } }, null, 2));
  } else if (cmd === 'done') {
    const p = readPlan(id, { files: false });
    if (!p?.request) { console.log(`${id} has no open request.`); process.exit(1); }
    const to = REQUESTS[p.request.kind];
    const status = to && STATUSES.indexOf(to) > STATUSES.indexOf(p.status) ? to : p.status;
    writePlan({ ...p, request: null, status, lastDone: { kind: p.request.kind, at: new Date().toISOString() } });
    console.log(`${id} -> ${status} (request cleared)`);
  } else if (cmd === 'export') {
    const md = read(path.join(planDir(id), 'script.md'));
    if (!md) { console.log(`${id} has no script.md`); process.exit(1); }
    const out = spokenScript(md);
    if (arg) { fs.mkdirSync(path.dirname(arg), { recursive: true }); fs.writeFileSync(arg, out); console.log(`wrote ${arg}`); } else process.stdout.write(out);
  } else if (cmd === 'scripts') {
    const list = listPlans().filter((p) => !p.job && ['scripted', 'filming'].includes(p.status) && fs.existsSync(path.join(planDir(p.id), 'script.md')));
    if (!list.length) console.log('No scripted plans waiting for footage.');
    for (const p of list) console.log(`${p.id}  status=${p.status}  title="${p.title}"`);
  } else if (cmd === 'link') {
    const p = readPlan(id, { files: false });
    if (!p || !arg) { console.log('usage: node studio/plans.mjs link <plan id> <job id>'); process.exit(1); }
    const jobFile = path.join(ROOT, 'jobs', path.basename(arg), 'job.json');
    if (!fs.existsSync(jobFile)) { console.log(`No job ${arg}`); process.exit(1); }
    const job = JSON.parse(fs.readFileSync(jobFile, 'utf8'));
    fs.writeFileSync(jobFile, JSON.stringify({ ...job, plan: id }, null, 2));   // jobs.mjs setStage keeps the plan's column in step
    writePlan({ ...p, job: arg, status: 'editing' });
    console.log(`${id} linked to job ${arg} -> editing`);
  } else {
    console.log('usage: node studio/plans.mjs pending | show <id> | done <id> | export <id> [out] | scripts | link <plan> <job>');
  }
}
