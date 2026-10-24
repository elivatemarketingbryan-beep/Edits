// Turns a job's WhisperX word timings (projects/<id>/transcript/words.json, {words:[{w,s,e}]})
// into the shape each add-on kit reads, so nothing is transcribed twice.
//
//   node studio/words-convert.mjs captions     <words.json> <out.json> [from] [to]
//       Remotion Caption[] ({text, startMs, endMs, timestampMs, confidence}): high-quality-captions,
//       github-callout (save as public/raw/<slug>.words.json), any @remotion/captions code.
//   node studio/words-convert.mjs segments     <words.json> <out.json> [from] [to]
//       {segments:[{words:[{text, start, duration}]}]} (seconds): high-quality-captions' other input.
//   node studio/words-convert.mjs brand-motion <words.json> <out.json> [from] [to]
//       {text, words:[{word, start, end}]} (seconds): engines/brand-motion (voice.py's format).
//
// [from] [to] (seconds) cut a slice and shift it to start at 0, for when the kit's project uses a
// trimmed copy of the footage.
import fs from 'node:fs';

const [fmt, src, out, fromArg, toArg] = process.argv.slice(2);
if (!fmt || !src || !out) {
  console.log('usage: node studio/words-convert.mjs captions|segments|brand-motion <words.json> <out.json> [from] [to]');
  process.exit(1);
}
const from = Number(fromArg) || 0, to = toArg != null ? Number(toArg) : Infinity;
const words = JSON.parse(fs.readFileSync(src, 'utf8')).words
  .filter((w) => w.s >= from && w.e <= to)
  .map((w) => ({ text: w.w, s: +(w.s - from).toFixed(3), e: +(w.e - from).toFixed(3) }));

let data;
if (fmt === 'captions') {
  data = words.map((w, i) => ({
    text: (i ? ' ' : '') + w.text,
    startMs: Math.round(w.s * 1000), endMs: Math.round(w.e * 1000),
    timestampMs: Math.round(((w.s + w.e) / 2) * 1000), confidence: null,
  }));
} else if (fmt === 'segments') {
  // One segment per sentence, so kits that group by segment still break at full stops.
  const segs = [[]];
  for (const w of words) { segs[segs.length - 1].push({ text: w.text, start: w.s, duration: +(w.e - w.s).toFixed(3) }); if (/[.!?]$/.test(w.text)) segs.push([]); }
  data = { segments: segs.filter((s) => s.length).map((ws) => ({ words: ws })) };
} else if (fmt === 'brand-motion') {
  data = { text: words.map((w) => w.text).join(' '), words: words.map((w) => ({ word: w.text, start: w.s, end: w.e })) };
} else {
  console.error(`unknown format "${fmt}"`); process.exit(1);
}
fs.writeFileSync(out, JSON.stringify(data, null, 1));
console.log(`${words.length} words -> ${out} (${fmt})`);
