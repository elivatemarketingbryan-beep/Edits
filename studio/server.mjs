// Video Studio launcher. Zero dependencies: `node studio/server.mjs`, then open http://localhost:4747
// The page only files work into jobs/; Claude Code does the editing (see CLAUDE.md, "Studio jobs").
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, JOBS, jobDir, newId, readJob, writeJob, listJobs, setStage } from './jobs.mjs';

const PORT = Number(process.env.PORT) || 4747;
const PUBLIC = path.join(ROOT, 'studio', 'public');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.webm': 'video/webm', '.m4v': 'video/mp4', '.jpg': 'image/jpeg', '.png': 'image/png',
  '.md': 'text/markdown; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.srt': 'text/plain; charset=utf-8', '.fcpxml': 'application/xml' };
const VIDEO_EXT = /\.(mp4|mov|m4v|webm|mkv)$/i;

const send = (res, code, body, type = 'application/json') => {
  res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
};
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
  ['GET', /^\/api\/jobs\/([\w-]+)$/, (req, res, [id]) => {
    const job = readJob(id);
    job ? send(res, 200, job) : send(res, 404, { error: 'No such job' });
  }],

  // Drop a video: raw body, filename in a header.
  ['POST', /^\/api\/upload$/, (req, res) => {
    const name = path.basename(decodeURIComponent(req.headers['x-filename'] || 'video.mp4'));
    if (!VIDEO_EXT.test(name)) return send(res, 400, { error: 'That file type isn\'t a video. Use mp4, mov, m4v, webm or mkv.' });
    const id = newId(name);
    const dir = jobDir(id);
    fs.mkdirSync(dir, { recursive: true });
    const source = 'source' + path.extname(name).toLowerCase();
    const out = fs.createWriteStream(path.join(dir, source));
    req.pipe(out);
    out.on('finish', () => send(res, 200, writeJob({ id, title: name, source, created: new Date().toISOString(), stage: 'formats' })));
    out.on('error', (e) => send(res, 500, { error: e.message }));
  }],

  // Paste a link instead (Claude downloads it with yt-dlp).
  ['POST', /^\/api\/link$/, async (req, res) => {
    const { url } = await readBody(req);
    if (!/^https?:\/\/\S+$/.test(url || '')) return send(res, 400, { error: 'Paste a full link starting with https://' });
    const id = newId(new URL(url).hostname.replace('www.', ''));
    send(res, 200, writeJob({ id, title: url, url, created: new Date().toISOString(), stage: 'formats' }));
  }],

  // Pick a format (or a tool) straight away, or from the top 3.
  ['POST', /^\/api\/jobs\/([\w-]+)\/choose$/, async (req, res, [id]) => {
    const { style } = await readBody(req);
    const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'styles', 'catalog.json'), 'utf8'));
    if (!catalog.styles.some((s) => s.id === style)) return send(res, 400, { error: 'Unknown style' });
    send(res, 200, setStage(id, 'edit', { style }));
  }],

  ['POST', /^\/api\/jobs\/([\w-]+)\/notes$/, async (req, res, [id]) => {
    const { t, text, edit } = await readBody(req);
    if (!text?.trim()) return send(res, 400, { error: 'Write a note first' });
    const file = path.join(jobDir(id), 'notes.json');
    const notes = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : [];
    notes.push({ id: Date.now().toString(36), t: Number(t) || 0, text: text.trim(), edit: edit ?? null, status: 'open', reply: null, created: new Date().toISOString() });
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

  ['POST', /^\/api\/jobs\/([\w-]+)\/request-changes$/, (req, res, [id]) => send(res, 200, setStage(id, 'revise'))],
  ['POST', /^\/api\/jobs\/([\w-]+)\/approve$/, (req, res, [id]) => send(res, 200, setStage(id, 'final'))],

  // Job media and outputs.
  ['GET', /^\/files\/([\w-]+)\/(.+)$/, (req, res, [id, rel]) => {
    const file = inside(jobDir(id), rel);
    file ? serveFile(req, res, file) : send(res, 403, { error: 'Forbidden' });
  }],
  ['GET', /^\/(review)?$/, (req, res, [review]) => serveFile(req, res, path.join(PUBLIC, review ? 'review.html' : 'index.html'))],
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
