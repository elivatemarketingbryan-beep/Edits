// Google Sheet that shows which designs hold attention. Zero dependencies: a service account signs its own token.
//   Reels tab    one row per posted reel: its design, then its retention (refreshed weekly)
//   Designs tab  every format and effect ranked by average retention (rebuilt on each refresh)
// Settings come from .env (see .env.example):
//   GOOGLE_SERVICE_ACCOUNT_FILE  path to the service account's JSON key (keep it outside the repo or git-ignored)
//   SHEET_ID                     the id in the sheet's URL: docs.google.com/spreadsheets/d/<SHEET_ID>/edit
//   SHEET_TAB                    reels tab name, default "Reels"; the summary tab is always "Designs"
// Share the sheet with the service account's client_email as an Editor.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import './env.mjs';
import { ROOT } from './jobs.mjs';

// A-I: what the reel was (written once, at posting). J-U: how it did (rewritten each refresh). V-W: reference.
export const STAT_COLS = ['Views', 'Avg watch (s)', 'Retention %', 'Held past 3s %', 'Likes', 'Comments', 'Shares', 'Saves',
  'Engagement', 'Engagement %', 'Reach', 'Stats updated'];
export const HEADER = ['Date posted', 'Reel', 'Link', 'Post ID', 'Format', 'Effects', 'Hook graphic', 'Graphics', 'Length (s)',
  ...STAT_COLS, 'Job', 'Caption'];
const COL = Object.fromEntries(HEADER.map((h, i) => [h, i]));
const letter = (i) => String.fromCharCode(65 + i);
const LAST = letter(HEADER.length - 1);
const STAT_FROM = letter(COL.Views), STAT_TO = letter(COL['Stats updated']);
export const DESIGN_HEADER = ['Kind', 'Design', 'Reels', 'Avg retention %', 'Avg held past 3s %', 'Avg watch (s)', 'Avg engagement %',
  'Total views', 'Best reel', 'Best retention %'];

const keyFile = () => {
  const f = process.env.GOOGLE_SERVICE_ACCOUNT_FILE;
  return f && (path.isAbsolute(f) ? f : path.join(ROOT, f));
};
export const sheetsConfigured = () => !!(process.env.SHEET_ID && keyFile() && fs.existsSync(keyFile()));
const tab = () => process.env.SHEET_TAB || 'Reels';
const DESIGNS = 'Designs';
const b64 = (x) => Buffer.from(typeof x === 'string' ? x : JSON.stringify(x)).toString('base64url');

let cached = { token: null, until: 0 };
async function token() {
  if (cached.token && Date.now() < cached.until) return cached.token;
  const key = JSON.parse(fs.readFileSync(keyFile(), 'utf8'));
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({ iss: key.client_email, scope: 'https://www.googleapis.com/auth/spreadsheets', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 })}`;
  const sig = crypto.createSign('RSA-SHA256').update(unsigned).sign(key.private_key, 'base64url');
  const res = await fetch(process.env.GOOGLE_TOKEN_URL || 'https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${unsigned}.${sig}` }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`Google sign-in failed: ${body.error_description || body.error}`);
  cached = { token: body.access_token, until: Date.now() + (body.expires_in - 60) * 1000 };
  return cached.token;
}

async function api(method, rel, data) {
  const res = await fetch(`${process.env.SHEETS_API_BASE || 'https://sheets.googleapis.com'}/v4/spreadsheets/${process.env.SHEET_ID}${rel}`, {
    method, headers: { Authorization: `Bearer ${await token()}`, 'Content-Type': 'application/json' },
    body: data ? JSON.stringify(data) : undefined,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Google Sheets: ${body.error?.message || res.status}`);
  return body;
}
const range = (t, a1) => `/values/${encodeURIComponent(`'${t}'!${a1}`)}`;

// Make a tab and its header row if they aren't there yet.
async function ensureTab(t, header) {
  const meta = await api('GET', '?fields=sheets.properties.title');
  if (!meta.sheets?.some((s) => s.properties.title === t)) {
    await api('POST', ':batchUpdate', { requests: [{ addSheet: { properties: { title: t, gridProperties: { frozenRowCount: 1 } } } }] });
  }
  const end = String.fromCharCode(64 + header.length);
  const head = await api('GET', range(t, `A1:${end}1`));
  if (!head.values?.[0]?.length) await api('PUT', `${range(t, `A1:${end}1`)}?valueInputOption=RAW`, { values: [header] });
}

// One row per posted reel: { date, title, link, postId, format, effects, hook, graphics, length, job, caption }.
export async function logReel(r) {
  await ensureTab(tab(), HEADER);
  const row = HEADER.map(() => '');
  Object.assign(row, {
    [COL['Date posted']]: r.date, [COL.Reel]: r.title || '', [COL.Link]: r.link || '', [COL['Post ID']]: String(r.postId),
    [COL.Format]: r.format || '', [COL.Effects]: (r.effects || []).join(' + '), [COL['Hook graphic']]: r.hook || '',
    [COL.Graphics]: r.graphics ?? '', [COL['Length (s)']]: r.length ?? '', [COL.Job]: r.job || '', [COL.Caption]: r.caption || '',
  });
  // RAW keeps the post id as text (it's longer than a spreadsheet number can hold).
  await api('POST', `${range(tab(), `A:${LAST}`)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, { values: [row] });
}

// Every logged reel as an object keyed by header name, with its sheet row number.
export async function loggedReels() {
  await ensureTab(tab(), HEADER);
  const { values = [] } = await api('GET', range(tab(), `A2:${LAST}`));
  return values.map((v, i) => ({ row: i + 2, ...Object.fromEntries(HEADER.map((h, j) => [h, v[j] ?? ''])) }))
    .filter((r) => String(r['Post ID']).trim());
}

// Write many rows of stats in one call: [{ row, cells: STAT_COLS in order }].
export async function writeStats(list) {
  if (!list.length) return;
  await api('POST', '/values:batchUpdate', {
    valueInputOption: 'RAW',
    data: list.map(({ row, cells }) => ({ range: `'${tab()}'!${STAT_FROM}${row}:${STAT_TO}${row}`, values: [cells] })),
  });
}

// Replace the Designs tab with the ranking.
export async function writeDesigns(rows) {
  await ensureTab(DESIGNS, DESIGN_HEADER);
  const end = letter(DESIGN_HEADER.length - 1);
  await api('POST', `${range(DESIGNS, `A2:${end}`)}:clear`);
  if (rows.length) await api('PUT', `${range(DESIGNS, `A2:${end}${rows.length + 1}`)}?valueInputOption=RAW`, { values: rows });
}
