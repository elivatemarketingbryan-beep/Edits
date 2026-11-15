// Posting to Instagram, and the retention sheet that shows which designs hold people.
//   node studio/ig-stats.mjs            refresh every logged reel's retention now, and re-rank the designs
//   node studio/ig-stats.mjs --if-due   only if the last refresh was 7+ days ago (what the weekly task runs)
// Also retries sheet rows for reels that posted while the sheet wasn't reachable.
//
// Two things can be posted: one reel from a reels job (reels.json, `rid` set), or a whole single edit
// (job.json `final`, `rid` null). Both record `ig` on themselves and a `design` snapshot for the sheet.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROOT, JOBS, jobDir, readJob, writeJob, listJobs } from './jobs.mjs';
import { igConfigured, publishReel, reelStats } from './instagram.mjs';
import { sheetsConfigured, logReel, loggedReels, writeStats, writeDesigns, STAT_COLS } from './sheets.mjs';

const WEEK = 7 * 24 * 3600 * 1000;
const STATE = path.join(JOBS, '.ig-stats.json');
const readState = () => (fs.existsSync(STATE) ? JSON.parse(fs.readFileSync(STATE, 'utf8')) : {});
const saveState = (s) => { fs.mkdirSync(JOBS, { recursive: true }); fs.writeFileSync(STATE, JSON.stringify({ ...readState(), ...s }, null, 2)); };
export const statsState = readState;
const round = (n, d = 1) => (n == null || Number.isNaN(n) ? '' : Math.round(n * 10 ** d) / 10 ** d);

// ---------- what was posted ----------
const reelsFile = (id) => path.join(jobDir(id), 'reels.json');
export function patchReel(id, rid, patch) {
  const list = JSON.parse(fs.readFileSync(reelsFile(id), 'utf8'));
  const next = list.map((r) => (r.id === rid ? { ...r, ...(typeof patch === 'function' ? patch(r) : patch) } : r));
  fs.writeFileSync(reelsFile(id), JSON.stringify(next, null, 2));
  writeJob(readJob(id));   // bumps `updated` so the page refreshes
  return next.find((r) => r.id === rid);
}
const patchJob = (id, patch) => { const job = readJob(id); return writeJob({ ...job, ...(typeof patch === 'function' ? patch(job) : patch) }); };

function target(id, rid) {
  const job = readJob(id);
  if (!job) throw new Error('No such job');
  if (rid) {
    const reel = (job.reels || []).find((r) => r.id === rid);
    if (!reel) throw new Error('No such reel');
    return { job, item: reel, file: reel.file, title: reel.title, approved: reel.status === 'approved', save: (p) => patchReel(id, rid, p) };
  }
  if (!job.final) throw new Error('This video has no final render yet.');
  return { job, item: job, file: job.final, title: job.title, approved: job.stage === 'done', save: (p) => patchJob(id, p) };
}

// The design a post went out with: format, effects (combo + picked ideas), its graphics and its length.
const catalogNames = () => {
  try { return Object.fromEntries(JSON.parse(fs.readFileSync(path.join(ROOT, 'styles', 'catalog.json'), 'utf8')).styles.map((s) => [s.id, s.name])); }
  catch { return {}; }
};
export function designOf(job, rid = null) {
  const names = catalogNames(), name = (s) => names[s] || s;
  const effects = [];
  const combo = (job.combos || []).find((c) => c.id === job.combo);
  if (combo) effects.push(`Combo: ${combo.name}`);
  for (const i of job.picked || []) { const idea = (job.ideas || []).find((x) => x.id === i); if (idea?.style && !effects.includes(name(idea.style))) effects.push(name(idea.style)); }
  const gfx = (job.graphics || []).filter((g) => (!rid || g.reel === rid) && g.status !== 'changes').sort((a, b) => a.t - b.t);
  const reel = rid && (job.reels || []).find((r) => r.id === rid);
  const length = reel ? (reel.ranges ? reel.ranges.reduce((s, [a, b]) => s + b - a, 0) : (reel.end ?? 0) - (reel.start ?? 0)) : (job.finalDuration ?? job.duration);
  return {
    format: job.style ? name(job.style) : job.mode === 'reels' ? 'Reels cut' : '',
    effects, hook: gfx[0]?.label || '', graphics: gfx.length, length: length ? round(length) : null,
  };
}

// ---------- posting ----------
const posting = new Set();
// Upload, publish, then log the row. Runs in the background; progress lands in `ig` on the reel or the job.
export function startPost(id, rid = null, caption) {
  const t = target(id, rid);
  if (!t.approved) throw new Error(rid ? 'Approve this reel before posting it.' : 'Approve the video before posting it.');
  if (t.item.ig?.status === 'posted') throw new Error('This is already on Instagram.');
  const key = `${id}/${rid || 'video'}`;
  if (posting.has(key)) throw new Error('This is already posting.');
  if (!igConfigured()) throw new Error('Instagram is not set up yet. Add IG_USER_ID and IG_ACCESS_TOKEN to .env (see .env.example).');
  const text = caption !== undefined ? String(caption) : t.item.caption || '';
  posting.add(key);
  t.save({ caption: text, design: designOf(t.job, rid), ig: { status: 'posting', step: 'Starting' } });
  (async () => {
    try {
      const post = await publishReel(path.join(jobDir(id), t.file), text, (step) => t.save((x) => ({ ig: { ...x.ig, step } })));
      t.save({ ig: { status: 'posted', id: post.id, permalink: post.permalink, postedAt: post.timestamp, sheet: false } });
      await logOne(id, rid);
    } catch (e) {
      t.save((x) => (x.ig?.status === 'posted' ? { ig: { ...x.ig, sheetError: e.message } } : { ig: { status: 'error', error: e.message } }));
    } finally { posting.delete(key); }
  })();
  return readJob(id);
}

async function logOne(id, rid) {
  const t = target(id, rid), ig = t.item.ig;
  if (!sheetsConfigured()) return t.save({ ig: { ...ig, sheet: false, sheetError: 'Google Sheets is not set up yet (see .env.example).' } });
  const d = t.item.design || designOf(t.job, rid);
  await logReel({ date: ig.postedAt.slice(0, 10), title: t.title, link: ig.permalink, postId: ig.id, ...d, job: id, caption: t.item.caption });
  t.save({ ig: { ...ig, sheet: true, sheetError: null } });
}

// Rows that never made it into the sheet (posted while it was offline or not set up).
export async function retryLogs() {
  if (!sheetsConfigured()) return 0;
  let n = 0;
  for (const job of listJobs()) {
    const items = [...(job.reels || []).map((r) => [r, r.id]), [job, null]];
    for (const [x, rid] of items) if (x.ig?.status === 'posted' && !x.ig.sheet) await logOne(job.id, rid).then(() => n++).catch(() => {});
  }
  return n;
}

// ---------- retention + design ranking ----------
// Retention % = average watch time / reel length. Over 100% means people rewatch.
// Held past 3s % = 100 - Instagram's 3-second skip rate (an estimate from Meta).
export async function refreshStats() {
  if (!igConfigured() || !sheetsConfigured()) throw new Error('Set up Instagram and Google Sheets in .env first (see .env.example).');
  await retryLogs();
  const rows = await loggedReels();
  const out = [], failed = [];
  const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
  for (const r of rows) {
    try {
      const s = await reelStats(r['Post ID']);
      const len = Number(r['Length (s)']) || null, watch = s.avgWatchMs != null ? s.avgWatchMs / 1000 : null;
      const base = s.reach || s.views;
      Object.assign(r, {
        Views: s.views ?? '', 'Avg watch (s)': round(watch), 'Retention %': len && watch != null ? round((watch / len) * 100) : '',
        'Held past 3s %': s.skipRate != null ? round(100 - s.skipRate) : '', Likes: s.likes ?? '', Comments: s.comments ?? '',
        Shares: s.shares ?? '', Saves: s.saves ?? '', Engagement: s.engagement ?? '',
        'Engagement %': s.engagement != null && base ? round((s.engagement / base) * 100, 2) : '', Reach: s.reach ?? '',
        'Stats updated': stamp,
      });
      out.push({ row: r.row, cells: STAT_COLS.map((c) => r[c]) });
    } catch (e) { failed.push(`${r['Post ID']}: ${e.message}`); }
  }
  await writeStats(out);
  const designs = rankDesigns(rows);
  await writeDesigns(designs);
  saveState({ lastRefresh: new Date().toISOString(), updated: out.length, failed });
  return { updated: out.length, designs: designs.length, failed };
}

// Every format, combo and effect, with the average retention of the reels that used it, best first.
export function rankDesigns(rows) {
  const num = (v) => (v === '' || v == null || Number.isNaN(Number(v)) ? null : Number(v));
  const groups = new Map();
  const add = (kind, design, r) => {
    if (!design) return;
    const k = `${kind}\u0000${design}`;
    if (!groups.has(k)) groups.set(k, { kind, design, rows: [] });
    groups.get(k).rows.push(r);
  };
  for (const r of rows) {
    if (num(r['Retention %']) == null) continue;
    add('Format', r.Format, r);
    for (const e of String(r.Effects || '').split(' + ').map((x) => x.trim()).filter(Boolean)) add(e.startsWith('Combo: ') ? 'Combo' : 'Effect', e.replace(/^Combo: /, ''), r);
  }
  const avg = (list) => (list.length ? list.reduce((a, b) => a + b, 0) / list.length : null);
  const order = { Format: 0, Combo: 1, Effect: 2 };
  return [...groups.values()].map((g) => {
    const ret = g.rows.map((r) => num(r['Retention %']));
    const best = g.rows.reduce((a, b) => (num(b['Retention %']) > num(a['Retention %']) ? b : a));
    const avgOf = (c, d) => round(avg(g.rows.map((r) => num(r[c])).filter((x) => x != null)), d);
    return { g, avgRet: avg(ret), row: [g.kind, g.design, g.rows.length, round(avg(ret)), avgOf('Held past 3s %'), avgOf('Avg watch (s)'),
      avgOf('Engagement %', 2), g.rows.reduce((s, r) => s + (num(r.Views) || 0), 0), best.Reel, round(num(best['Retention %']))] };
  }).sort((a, b) => order[a.g.kind] - order[b.g.kind] || b.avgRet - a.avgRet || (Number(b.row[4]) || 0) - (Number(a.row[4]) || 0)).map((x) => x.row);   // ties: the stronger hook wins
}

export const refreshDue = () => { const last = readState().lastRefresh; return !last || Date.now() - Date.parse(last) >= WEEK; };
export async function refreshIfDue() {
  if (!igConfigured() || !sheetsConfigured() || !refreshDue()) return null;
  return refreshStats();
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const due = process.argv.includes('--if-due');
  try {
    const r = due ? await refreshIfDue() : await refreshStats();
    console.log(r ? `Updated ${r.updated} reel(s), ranked ${r.designs} design(s).${r.failed.length ? ` ${r.failed.length} failed:\n  ${r.failed.join('\n  ')}` : ''}` : 'Not due yet (or not set up). Nothing to do.');
  } catch (e) { console.error(e.message); process.exit(1); }
}
