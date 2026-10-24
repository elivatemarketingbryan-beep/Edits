// Correct misheard words in a job's word-timed transcript without losing timing.
//   node scripts/fix-words.mjs <job> "<startSec>:<old words>=><new words>" ...
// The old words must match consecutive words starting at the word whose start is within 0.05 s of startSec.
// New words share that span: the first takes the first old start, the last takes the last old end.
import fs from 'fs';

const [job, ...fixes] = process.argv.slice(2);
const file = `public/jobs/${job}/transcript.json`;
const t = JSON.parse(fs.readFileSync(file, 'utf8'));
const norm = (w) => w.trim().toLowerCase().replace(/[^a-z0-9']/g, '');
for (const fix of fixes) {
  const m = fix.match(/^([\d.]+):(.+)=>(.*)$/);
  if (!m) throw new Error(`bad fix: ${fix}`);
  const at = Number(m[1]), oldW = m[2].trim().split(/\s+/), newW = m[3].trim().split(/\s+/).filter(Boolean);
  const seg = t.segments.find(s => s.words?.some(w => Math.abs(w.start - at) < .05));
  if (!seg) throw new Error(`no word at ${at}s`);
  const i = seg.words.findIndex(w => Math.abs(w.start - at) < .05);
  const span = seg.words.slice(i, i + oldW.length);
  if (span.map(w => norm(w.text)).join(' ') !== oldW.map(norm).join(' ')) throw new Error(`"${span.map(w => w.text).join(' ')}" != "${oldW.join(' ')}" at ${at}s`);
  const start = span[0].start, end = span[span.length - 1].end, step = (end - start) / newW.length;
  const repl = newW.map((text, k) => ({start: +(start + k * step).toFixed(3), end: +(start + (k + 1) * step).toFixed(3), text: (k || span[0].text.startsWith(' ') ? ' ' : '') + text}));
  seg.words.splice(i, oldW.length, ...repl);
  seg.text = seg.words.map(w => w.text).join('').trim();
  console.log(`${at}s: ${oldW.join(' ')} -> ${newW.join(' ')}`);
}
fs.writeFileSync(file, JSON.stringify(t, null, 2));
