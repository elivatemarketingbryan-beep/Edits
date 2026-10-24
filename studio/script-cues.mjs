// Reads a Content OS script (spoken lines with cue tags) against a clip's word timings.
//
//   node studio/script-cues.mjs score <words.json> <script.txt> [<script2.txt> ...]
//       How well each script matches what was said in the clip (0-1). Use it to find which
//       Notion script a dropped clip belongs to; above ~0.6 is a match.
//   node studio/script-cues.mjs cues <words.json> <script.txt> [out.json]
//       Timed cues: for every script line, when it was actually spoken and its tags, e.g.
//       { "line": 4, "text": "...", "start": 12.4, "end": 15.1, "match": 0.92,
//         "tags": [ { "type": "TIER", "value": "S" } ] }
//
// Script format (the `## Script` block the scriptwriter writes in Notion): one spoken line per
// line, cue tags in square brackets at the end, e.g.  Facebook ads land in S tier. [TIER: S]
// Lines are matched in order, allowing paraphrase, ad-libs and dropped lines: a line counts
// as spoken when most of its words appear, in order, near where the previous line ended.
import fs from 'node:fs';

const norm = (w) => w.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9'$%]/g, '');
const tokens = (s) => s.split(/\s+/).map(norm).filter(Boolean);
const TAG = /\[([A-Z]+)(?::\s*([^\]]*))?\]/g;

export function parseScript(text) {
  // Accept a whole Notion page body too: use the fenced block under "## Script" if present.
  const m = text.match(/##\s*Script\s*\n+```[a-z]*\n([\s\S]*?)```/i);
  const body = m ? m[1] : text;
  return body.split(/\r?\n/).map((raw) => raw.trim()).filter(Boolean).map((raw, i) => {
    const tags = [...raw.matchAll(TAG)].map((t) => ({ type: t[1], value: (t[2] ?? '').trim() || null }));
    const spoken = raw.replace(TAG, '').trim();
    return { line: i + 1, text: spoken, tags, words: tokens(spoken) };
  }).filter((l) => l.words.length || l.tags.length);
}

export function loadWords(file) {
  const j = JSON.parse(fs.readFileSync(file, 'utf8'));
  return (j.words || []).map((w) => ({ t: norm(w.w), s: w.s, e: w.e })).filter((w) => w.t);
}

// Longest common subsequence between a script line and a window of transcript words,
// returning how many line words were found and which transcript positions they hit.
function lcs(a, b) {
  const n = a.length, m = b.length, dp = Array.from({ length: n + 1 }, () => new Int16Array(m + 1));
  for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
  const hits = [];
  for (let i = n, j = m; i > 0 && j > 0;) {
    if (a[i - 1] === b[j - 1]) { hits.push(j - 1); i--; j--; } else if (dp[i - 1][j] >= dp[i][j - 1]) i--; else j--;
  }
  return { score: dp[n][m], hits: hits.reverse() };
}

export function alignScript(lines, words) {
  const out = [];
  let cursor = 0;
  const T = words.map((w) => w.t);
  for (const l of lines) {
    if (!l.words.length) { out.push({ line: l.line, text: l.text, tags: l.tags, start: null, end: null, match: 0 }); continue; }
    // Search a window ahead of the cursor; ad-libs and re-takes can sit in between.
    const span = Math.max(l.words.length * 3, 40);
    const win = T.slice(cursor, cursor + span + 200);
    let best = { score: 0, hits: [] };
    for (let off = 0; off < Math.max(1, win.length - l.words.length + 1); off += 2) {
      const r = lcs(l.words, win.slice(off, off + Math.ceil(l.words.length * 1.6) + 4));
      if (r.score > best.score) best = { score: r.score, hits: r.hits.map((h) => h + off) };
      if (best.score === l.words.length) break;
    }
    const match = best.score / l.words.length;
    if (match >= 0.5 && best.hits.length) {
      const first = cursor + best.hits[0], last = cursor + best.hits[best.hits.length - 1];
      out.push({ line: l.line, text: l.text, tags: l.tags, start: words[first].s, end: words[last].e, match: +match.toFixed(2) });
      cursor = last + 1;
    } else {
      out.push({ line: l.line, text: l.text, tags: l.tags, start: null, end: null, match: +match.toFixed(2) });   // not said (cut or skipped)
    }
  }
  return out;
}

// Share of the script's spoken words that the clip contains, in order, weighted by line length.
export function scoreScript(lines, words) {
  const a = alignScript(lines, words);
  const total = lines.reduce((n, l) => n + l.words.length, 0) || 1;
  return +(a.reduce((n, x, i) => n + (x.start != null ? x.match * lines[i].words.length : 0), 0) / total).toFixed(3);
}

if (process.argv[1] && process.argv[1].endsWith('script-cues.mjs')) {
  const [cmd, wordsFile, ...rest] = process.argv.slice(2);
  try {
    const words = loadWords(wordsFile);
    if (cmd === 'score') {
      for (const f of rest) console.log(`${scoreScript(parseScript(fs.readFileSync(f, 'utf8')), words).toFixed(3)}  ${f}`);
    } else if (cmd === 'cues') {
      const cues = alignScript(parseScript(fs.readFileSync(rest[0], 'utf8')), words);
      const json = JSON.stringify(cues, null, 1);
      if (rest[1]) fs.writeFileSync(rest[1], json); else console.log(json);
      const said = cues.filter((c) => c.start != null).length, tagged = cues.filter((c) => c.tags.length);
      console.error(`${said}/${cues.length} lines found in the clip; ${tagged.filter((c) => c.start != null).length}/${tagged.length} tagged lines timed`);
    } else {
      console.log('usage: node studio/script-cues.mjs score <words.json> <script.txt>... | cues <words.json> <script.txt> [out.json]');
    }
  } catch (e) { console.error(e.message); process.exit(1); }
}
