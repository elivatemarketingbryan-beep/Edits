// The board library as an idea database: reads a job's transcript and suggests a board for each moment, from the words said.
// `node studio/board-ideas.mjs <job id> [--gap seconds]` prints the picks and writes jobs/<id>/board-ideas.json.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Spoken patterns for how Bryan actually talks. Earlier rows win ties. Add a row when a new phrasing should trigger a board.
const RULES = [
  [/\$\s?\d/, ['C239PriceCard', 'P198Odometer', 'C108Waterfall'], 'a price or money figure', 3],
  [/\bfrom \$?\d.*\bto \$?\d|\bused to\b|\bbefore\b.*\bnow\b/i, ['C111Slope', 'P209Flip'], 'before and after', 3],
  [/\bversus\b|\bvs\b|\bbut only has\b|\bcompare\b|\binstead of\b/i, ['C249VersusCards', 'Y164Versus'], 'comparing two things', 3],
  [/\bstep (one|two|three|four|five|\d)\b/i, ['D53Steps', 'P236Checklist'], 'numbered steps', 3],
  [/\bquestion (one|two|three|four|five)\b|\banother question\b|\bquestions?\b/i, ['H143Agenda', 'C247ChipFilter'], 'a set of questions', 2],
  [/\bnot everyone\b|\bonly\b.*\bout of\b|\bout of all\b|\bqualified\b|\bstages?\b/i, ['D48Funnel', 'C247ChipFilter'], 'something narrowing down', 2],
  [/\bhigh priority\b|\bmedium priority\b|\blow priority\b|\bprioritize\b|\brank\b|\bwinner\b/i, ['C114Ranking', 'K123Scorecard'], 'ranking or priority', 3],
  [/\bpremium\b|\bstandard\b|\bbasic\b|\btiers?\b|\boptions\b/i, ['C240TableFocus', 'K123Scorecard'], 'options side by side', 2],
  [/\byou assume\b|\byou think\b|\bmost (people|contractors)\b|\bisn't\b.*\bit's\b|\bwhat people\b/i, ['H144MythFact', 'P228CrossOut'], 'a belief being corrected', 2],
  [/\bcrm\b|\bpipeline\b|\bautomatic|\bsystem\b/i, ['C245NodeGraph', 'W69Nodes', 'Y182SystemMap'], 'a system or flow', 2],
  [/\bgo(es)? through\b.*\bstages\b|\bevery time\b|\bover and over\b|\bloop\b/i, ['D47Cycle'], 'a repeating process', 2],
  [/\btext|\bmessag|\bghost|\bdm\b/i, ['P219Chat'], 'a conversation', 2],
  [/\bphone\b|\bcalls?\b|\bwebsite\b/i, ['C246Phone', 'C242AppFocus'], 'a phone or app', 1],
  [/\bif (they|someone|you)\b.*\b(if|then|don't)\b|\bif they\b/i, ['A141Decision', 'D52Tree'], 'a decision', 2],
  [/\bmade of\b|\bbreaks? down\b|\bstack\b|\badds? up\b|\bwarrant/i, ['C108Waterfall', 'C244Receipt', 'D46Pyramid'], 'something built from parts', 2],
  [/\bbig takeaway\b|\bremember\b|\bthe moment\b|\bnever\b/i, ['D57Quote', 'P237Highlighter'], 'a line worth remembering', 2],
  [/\blet's start\b|\bso who\b|\bnow they're\b|\bso what do you\b/i, ['D56Chapter'], 'a new section', 2],
  [/\bwatch my next video\b|\bsubscribe\b/i, ['X41EndLayout'], 'the sign-off', 3],
];

const names = {};
for (const m of fs.readFileSync(path.join(ROOT, 'styles/BOARDS.md'), 'utf8').matchAll(/^- `(\w+)` \*\*(.+?)\*\*/gm)) names[m[1]] = m[2];
const [id, ...rest] = process.argv.slice(2);
if (!id) { console.log('usage: node studio/board-ideas.mjs <job id> [--gap seconds]'); process.exit(2); }
const g = rest.indexOf('--gap'), GAP = g >= 0 ? Number(rest[g + 1]) : 15;
const job = path.join(ROOT, 'jobs', id);
const raw = JSON.parse(fs.readFileSync(path.join(job, 'transcript.json'), 'utf8'));
const segs = Array.isArray(raw) ? raw : raw.segments;

const hits = [];
for (const s of segs) for (const [re, boards, why, weight] of RULES) if (re.test(s.text)) hits.push({ s, boards, why, weight });
hits.sort((a, b) => b.weight - a.weight || a.s.start - b.s.start);
const picks = [], used = new Map();
for (const h of hits) {
  if (picks.some((p) => Math.abs(p.start - h.s.start) < GAP)) continue;
  const board = h.boards.slice().sort((a, b) => (used.get(a) ?? 0) - (used.get(b) ?? 0))[0];     // rotate, so one board doesn't take over
  if ((used.get(board) ?? 0) >= 2) continue;
  used.set(board, (used.get(board) ?? 0) + 1);
  picks.push({ start: h.s.start, end: h.s.end, line: h.s.text.trim(), board, name: names[board] ?? board, why: h.why, also: h.boards.filter((b) => b !== board) });
}
picks.sort((a, b) => a.start - b.start);
fs.writeFileSync(path.join(job, 'board-ideas.json'), JSON.stringify(picks, null, 1));
const t = (x) => `${Math.floor(x / 60)}:${String(Math.floor(x % 60)).padStart(2, '0')}`;
for (const p of picks) console.log(`${t(p.start).padStart(5)}  ${p.board.padEnd(16)} ${p.why.padEnd(26)} "${p.line.slice(0, 62)}"`);
console.log(`\n${picks.length} ideas from ${segs.length} lines, ${new Set(picks.map((p) => p.board)).size} different boards -> jobs/${id}/board-ideas.json`);
