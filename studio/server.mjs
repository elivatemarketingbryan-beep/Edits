// Video Studio launcher. Zero dependencies: `node studio/server.mjs`, then open http://localhost:4747
// The page only files work into jobs/; Claude Code does the editing (see CLAUDE.md, "Studio jobs").
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, JOBS, jobDir, newId, readJob, writeJob, listJobs, setStage } from './jobs.mjs';
import { igConfigured } from './instagram.mjs';
import { sheetsConfigured } from './sheets.mjs';
import { startPost, refreshStats, refreshIfDue, statsState } from './ig-stats.mjs';
import { planRoutes } from './plans.mjs';

const PORT = Number(process.env.PORT) || 4747;
const PUBLIC = path.join(ROOT, 'studio', 'public');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.webm': 'video/webm', '.m4v': 'video/mp4', '.jpg': 'image/jpeg', '.png': 'image/png',
  '.md': 'text/markdown; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.srt': 'text/plain; charset=utf-8', '.fcpxml': 'application/xml',
  '.ttf': 'font/ttf', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.m4a': 'audio/mp4' };
const VIDEO_EXT = /\.(mp4|mov|m4v|webm|mkv|mp3|wav|m4a)$/i;   // audio = a voiceover for the faceless-sprite style

const send = (res, code, body, type = 'application/json') => {
  res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
};
// What the drop screen asked for: one edit ("video") or reels cut from it, with how many and how long.
const REEL_COUNTS = ['auto', '5', '10', '15'], REEL_LENGTHS = ['15-30', '30-60', '60-90'];
function intake(mode, reels = {}) {
  if (mode !== 'reels') return { mode: 'video' };
  const count = REEL_COUNTS.includes(String(reels.count)) ? String(reels.count) : 'auto';
  const length = REEL_LENGTHS.includes(String(reels.length)) ? String(reels.length) : '30-60';
  return { mode: 'reels', reelOpts: { count, length } };   // not `reels`: that's reels.json, the finished reels
}
const json = (file, fallback) => (fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : fallback);

// The toolbar's notes box: a note on the whole video, not a second of it. `kind: "approve"` = left while approving.
function addGeneralNote(id, text, kind = 'change') {
  if (!String(text || '').trim()) return;
  const file = path.join(jobDir(id), 'notes.json');
  const notes = json(file, []);
  notes.push({ id: Date.now().toString(36), t: 0, text: String(text).trim(), general: true, kind, edit: null, scene: null, status: 'open', reply: null, created: new Date().toISOString() });
  fs.writeFileSync(file, JSON.stringify(notes, null, 2));
}

const readBody = (req) => new Promise((ok, fail) => {
  let data = '';
  req.on('data', (c) => { data += c; if (data.length > 1e6) req.destroy(); });
  req.on('end', () => { try { ok(data ? JSON.parse(data) : {}); } catch (e) { fail(e); } });
});

// Static files with Range support so <video> can seek.
function serveFile(req, res, file) {
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return send(res, 404, { error: 'Not found' });
  const size = fs.statSync(file).size;
  const type = TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';
  const range = req.headers.range?.match(/bytes=(\d*)-(\d*)/);
  if (range) {
    const start = range[1] ? Number(range[1]) : 0;
    const end = range[2] ? Number(range[2]) : size - 1;
    res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${start}-${end}/${size}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1 });
    return fs.createReadStream(file, { start, end }).pipe(res);
  }
  res.writeHead(200, { 'Content-Type': type, 'Content-Length': size, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store' });
  fs.createReadStream(file).pipe(res);
}

// Keep every resolved path inside its base folder.
const inside = (base, rel) => {
  const p = path.resolve(base, '.' + path.sep + decodeURIComponent(rel));
  return p.startsWith(base + path.sep) || p === base ? p : null;
};

const routes = [
  ['GET', /^\/api\/catalog$/, (req, res) => serveFile(req, res, path.join(ROOT, 'styles', 'catalog.json'))],
  ['GET', /^\/api\/jobs$/, (req, res) => send(res, 200, listJobs())],
  // Format preview videos (docs/reel-videos/NN-<name>.mp4), keyed by the style's name slug.
  ['GET', /^\/api\/previews$/, (req, res) => {
    const dir = path.join(ROOT, 'docs', 'reel-videos');
    const map = {};
    if (fs.existsSync(dir)) for (const f of fs.readdirSync(dir)) { const m = f.match(/^\d+-(.+)\.mp4$/); if (m) map[m[1]] = `/previews/${f}`; }
    // Video FX styles preview with the engine's example clip (engines/video-fx/examples/NN-<fx>.mp4).
    const fxDir = path.join(ROOT, 'engines', 'video-fx', 'examples');
    const fxFiles = fs.existsSync(fxDir) ? fs.readdirSync(fxDir) : [];
    const slug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    for (const s of JSON.parse(fs.readFileSync(path.join(ROOT, 'styles', 'catalog.json'), 'utf8')).styles) {
      const f = s.fx && fxFiles.find((x) => x.match(/^\d+-(.+)\.mp4$/)?.[1] === s.fx);
      if (f && !map[slug(s.name)]) map[slug(s.name)] = `/fx-previews/${f}`;
    }
    send(res, 200, map);
  }],
  ['GET', /^\/previews\/([\w.-]+\.mp4)$/, (req, res, [f]) => serveFile(req, res, path.join(ROOT, 'docs', 'reel-videos', f))],
  ['GET', /^\/fx-previews\/([\w.-]+\.mp4)$/, (req, res, [f]) => serveFile(req, res, path.join(ROOT, 'engines', 'video-fx', 'examples', f))],
  ['GET', /^\/api\/jobs\/([\w-]+)$/, (req, res, [id]) => {
    const job = readJob(id);
    job ? send(res, 200, job) : send(res, 404, { error: 'No such job' });
  }],

  // Drop a video: raw body, filename in a header.
  ['POST', /^\/api\/upload$/, (req, res) => {
    const name = path.basename(decodeURIComponent(req.headers['x-filename'] || 'video.mp4'));
    let opts = {};
    try { opts = JSON.parse(decodeURIComponent(req.headers['x-intake'] || '{}')); } catch {}
    if (!VIDEO_EXT.test(name)) return send(res, 400, { error: 'That file type isn\'t a video or a voiceover. Use mp4, mov, m4v, webm, mkv, mp3, wav or m4a.' });
    const id = newId(name);
    const dir = jobDir(id);
    fs.mkdirSync(dir, { recursive: true });
    const source = 'source' + path.extname(name).toLowerCase();
    const out = fs.createWriteStream(path.join(dir, source));
    req.pipe(out);
    out.on('finish', () => send(res, 200, writeJob({ id, title: name, source, created: new Date().toISOString(), stage: 'formats', ...intake(opts.mode, opts.reels) })));
    out.on('error', (e) => send(res, 500, { error: e.message }));
  }],

  // Paste a link instead (Claude downloads it with yt-dlp).
  ['POST', /^\/api\/link$/, async (req, res) => {
    const { url, mode, reels } = await readBody(req);
    if (!/^https?:\/\/\S+$/.test(url || '')) return send(res, 400, { error: 'Paste a full link starting with https://' });
    const id = newId(new URL(url).hostname.replace('www.', ''));
    send(res, 200, writeJob({ id, title: url, url, created: new Date().toISOString(), stage: 'formats', ...intake(mode, reels) }));
  }],

  // Pick a format (or a tool) straight away, or from the top 3, plus any of Claude's ideas (ideas.json ids).
  ['POST', /^\/api\/jobs\/([\w-]+)\/choose$/, async (req, res, [id]) => {
    const { style, ideas, combo } = await readBody(req);
    const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'styles', 'catalog.json'), 'utf8'));
    if (!catalog.styles.some((s) => s.id === style)) return send(res, 400, { error: 'Unknown style' });
    const job = readJob(id);
    const known = new Set((job?.ideas || []).map((i) => i.id));
    const picked = Array.isArray(ideas) ? ideas.filter((i) => known.has(i)) : [];
    // combo = the combo they started from (combos.json id), or null if they picked ideas one by one.
    // Graphics are designed and approved before anything renders (CLAUDE.md, Bryan's rule).
    send(res, 200, setStage(id, 'design', { style, picked, combo: (job?.combos || []).some((c) => c.id === combo) ? combo : null }));
  }],

  // Reels mode: tick which of Claude's reels (clips.json ids) to make.
  ['POST', /^\/api\/jobs\/([\w-]+)\/reels$/, async (req, res, [id]) => {
    const { ids } = await readBody(req);
    const job = readJob(id);
    if (job?.stage !== 'clips') return send(res, 400, { error: 'This video isn\'t waiting for a reel pick' });
    const known = new Set(job.clips.map((c) => c.id));
    const chosen = Array.isArray(ids) ? ids.filter((i) => known.has(i)) : [];
    if (!chosen.length) return send(res, 400, { error: 'Pick at least one reel' });
    send(res, 200, setStage(id, 'design', { chosen }));
  }],

  // Graphics approval: notes per graphic (id -> text) and/or approve the ones on screen.
  // All approved -> render (edit for one video, final for reels). Any note -> back to design.
  ['POST', /^\/api\/jobs\/([\w-]+)\/graphics$/, async (req, res, [id]) => {
    const { notes = {}, approve = [] } = await readBody(req);
    const job = readJob(id);
    if (job?.stage !== 'graphics') return send(res, 400, { error: 'No graphics waiting for approval' });
    const file = path.join(jobDir(id), 'graphics.json');
    const list = json(file, []).map((g) => {
      const note = String(notes[g.id] ?? '').trim();
      if (note) return { ...g, status: 'changes', note, reply: null };
      if (approve.includes(g.id)) return { ...g, status: 'approved' };
      return g;
    });
    fs.writeFileSync(file, JSON.stringify(list, null, 2));
    const changes = list.some((g) => g.status === 'changes');
    const allOk = list.length > 0 && list.every((g) => g.status === 'approved');
    const next = changes ? 'design' : allOk ? (job.mode === 'reels' ? 'final' : 'edit') : null;
    send(res, 200, next ? setStage(id, next) : readJob(id));
  }],

  ['POST', /^\/api\/jobs\/([\w-]+)\/notes$/, async (req, res, [id]) => {
    const { t, text, edit, scene } = await readBody(req);
    if (!text?.trim()) return send(res, 400, { error: 'Write a note first' });
    const file = path.join(jobDir(id), 'notes.json');
    const notes = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : [];
    notes.push({ id: Date.now().toString(36), t: Number(t) || 0, text: text.trim(), edit: edit ?? null, scene: scene ?? null, status: 'open', reply: null, created: new Date().toISOString() });
    fs.writeFileSync(file, JSON.stringify(notes, null, 2));
    send(res, 200, readJob(id));
  }],

  ['POST', /^\/api\/jobs\/([\w-]+)\/notes\/(\w+)$/, async (req, res, [id, noteId]) => {
    const body = await readBody(req);
    const file = path.join(jobDir(id), 'notes.json');
    let notes = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : [];
    if (body.delete) notes = notes.filter((n) => n.id !== noteId);
    else notes = notes.map((n) => (n.id === noteId ? { ...n, ...(body.text ? { text: body.text } : {}), ...(body.status ? { status: body.status } : {}) } : n));
    fs.writeFileSync(file, JSON.stringify(notes, null, 2));
    send(res, 200, readJob(id));
  }],

  // One edit: approve or reject from the always-on toolbar. An optional overall note (not tied to a second) rides along.
  ['POST', /^\/api\/jobs\/([\w-]+)\/request-changes$/, async (req, res, [id]) => {
    const { note } = await readBody(req);
    addGeneralNote(id, note);
    if (!(readJob(id).notes || []).some((n) => n.status === 'open')) return send(res, 400, { error: 'Write what should change first, in the notes box or as a note on the timeline.' });
    send(res, 200, setStage(id, 'revise'));
  }],
  // The post caption shown under the video (styles/POST-CAPTIONS.md). Saved as you edit it; Post to Instagram uses it.
  ['POST', /^\/api\/jobs\/([\w-]+)\/caption$/, async (req, res, [id]) => {
    const { caption = '' } = await readBody(req);
    const job = readJob(id);
    if (!job) return send(res, 404, { error: 'No such job' });
    send(res, 200, writeJob({ ...job, caption: String(caption).slice(0, 2200) }));
  }],
  ['POST', /^\/api\/jobs\/([\w-]+)\/approve$/, async (req, res, [id]) => {
    const { note } = await readBody(req);
    addGeneralNote(id, note, 'approve');
    send(res, 200, setStage(id, 'final'));
  }],

  // Reels review: { decisions: { <reel id>: { status: "approved"|"changes", note } } }.
  // Any rejected reel sends the job to `revise`; every reel approved finishes it.
  ['POST', /^\/api\/jobs\/([\w-]+)\/reel-review$/, async (req, res, [id]) => {
    const { decisions = {} } = await readBody(req);
    const job = readJob(id);
    if (job?.mode !== 'reels' || !['review', 'done'].includes(job.stage)) return send(res, 400, { error: 'These reels aren\'t waiting for review' });
    for (const [rid, d] of Object.entries(decisions)) {
      if (d.status === 'changes' && !String(d.note || '').trim()) return send(res, 400, { error: 'Add a note to every reel you reject, so Claude knows what to fix.' });
    }
    const file = path.join(jobDir(id), 'reels.json');
    const list = json(file, []).map((r) => {
      const d = decisions[r.id];
      if (!d || r.ig?.status === 'posted') return r;
      const note = String(d.note ?? '').trim() || null;
      if (d.status === 'changes') return { ...r, status: 'changes', note, reply: null };
      if (d.status === 'approved') return { ...r, status: 'approved', note };
      return { ...r, note };
    });
    fs.writeFileSync(file, JSON.stringify(list, null, 2));
    const next = list.some((r) => r.status === 'changes') ? 'revise' : list.length && list.every((r) => r.status === 'approved') ? 'done' : null;
    send(res, 200, next && next !== job.stage ? setStage(id, next) : writeJob(readJob(id)));
  }],

  // Post an approved reel to Instagram. Returns at once; progress shows on the reel (reels.json `ig`).
  ['POST', /^\/api\/jobs\/([\w-]+)\/reels\/([\w-]+)\/instagram$/, async (req, res, [id, rid]) => send(res, 200, startPost(id, rid, (await readBody(req)).caption))],
  // A finished single edit (a one-off reel) posts the same way, with the caption typed on the page.
  ['POST', /^\/api\/jobs\/([\w-]+)\/instagram$/, async (req, res, [id]) => send(res, 200, startPost(id, null, (await readBody(req)).caption))],
  ['GET', /^\/api\/integrations$/, (req, res) => send(res, 200, { instagram: igConfigured(), sheets: sheetsConfigured(), stats: statsState() })],
  ['POST', /^\/api\/stats\/refresh$/, async (req, res) => send(res, 200, await refreshStats())],

  // Job media and outputs.
  ['GET', /^\/files\/([\w-]+)\/(.+)$/, (req, res, [id, rel]) => {
    const file = inside(jobDir(id), rel);
    file ? serveFile(req, res, file) : send(res, 403, { error: 'Forbidden' });
  }],
  // The Plan page (long-form planning and scripts): studio/plans.mjs, docs/studio/plans.md.
  ...planRoutes({ send, readBody, serveFile, inside }),
  ['GET', /^\/(review|sheet|plan|script)?$/, (req, res, [page]) => serveFile(req, res, path.join(PUBLIC, (page || 'index') + '.html'))],
  ['GET', /^\/(.+)$/, (req, res, [rel]) => {
    const file = inside(PUBLIC, rel);
    file ? serveFile(req, res, file) : send(res, 403, { error: 'Forbidden' });
  }],
];

fs.mkdirSync(JOBS, { recursive: true });
http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  for (const [method, re, handler] of routes) {
    const m = req.method === method && url.pathname.match(re);
    if (m) {
      try { return await handler(req, res, m.slice(1)); } catch (e) { return send(res, 500, { error: e.message }); }
    }
  }
  send(res, 404, { error: 'Not found' });
}).listen(PORT, '127.0.0.1', () => console.log(`Video Studio is open at http://localhost:${PORT}`));

// Weekly stats refresh, as a catch-up for the scheduled task: on start, then every 6 hours while running.
const statsTick = () => refreshIfDue().then((r) => r && console.log(`Instagram stats refreshed for ${r.updated} reel(s).`)).catch((e) => console.log(`Stats refresh failed: ${e.message}`));
statsTick();
setInterval(statsTick, 6 * 3600 * 1000).unref();
