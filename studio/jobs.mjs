// Shared job store for the launcher (server.mjs) and for Claude (CLI below).
// A job is a folder: jobs/<id>/job.json plus its media and outputs.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const JOBS = path.join(ROOT, 'jobs');

// Stages in order. `who` says whose move it is.
// mode "video" (one edit):  formats -> pick  -> design -> graphics -> edit -> review <-> revise -> final -> done
// mode "reels" (cut a long video into reels): formats -> clips -> design -> graphics -> final -> review <-> revise -> done
//   (reels review: Bryan approves or rejects each reel in reels.json; approved reels can be posted to Instagram)
export const STAGES = {
  formats: { who: 'claude', label: 'Finding the best 3 formats' },
  pick:    { who: 'you',    label: 'Pick a format and ideas' },
  clips:   { who: 'you',    label: 'Pick your reels' },
  design:  { who: 'claude', label: 'Designing the motion graphics' },
  graphics:{ who: 'you',    label: 'Approve the motion graphics' },
  edit:    { who: 'claude', label: 'Editing' },
  review:  { who: 'you',    label: 'Review the preview' },
  revise:  { who: 'claude', label: 'Applying your notes' },
  final:   { who: 'claude', label: 'Rendering the final' },
  done:    { who: 'nobody', label: 'Done' },
};
// Where the reels flow words a stage differently.
const REELS_LABELS = { formats: 'Finding the best reels', final: 'Rendering your reels', review: 'Review your reels', revise: 'Fixing the reels you rejected' };
// Extra files read into the job: Claude writes them, the page shows them.
// clips.json = reels Claude found (reels mode), graphics.json = graphic stills to approve, reels.json = finished reels.
const EXTRAS = ['formats', 'ideas', 'combos', 'edits', 'notes', 'sheet', 'clips', 'graphics', 'reels'];

export function newId(name = 'video') {
  const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');
  const slug = name.toLowerCase().replace(/\.[a-z0-9]+$/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || 'video';
  return `${stamp}-${slug}`;
}

export const jobDir = (id) => path.join(JOBS, path.basename(id));

export function readJob(id) {
  const file = path.join(jobDir(id), 'job.json');
  if (!fs.existsSync(file)) return null;
  const job = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const extra of EXTRAS) {
    const f = path.join(jobDir(id), `${extra}.json`);
    job[extra] = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : (extra === 'formats' ? null : []);
  }
  job.waitingOn = STAGES[job.stage]?.who ?? 'claude';
  job.mode = job.mode === 'reels' ? 'reels' : 'video';
  job.stageLabel = (job.mode === 'reels' && REELS_LABELS[job.stage]) || STAGES[job.stage]?.label || job.stage;
  return job;
}

export function writeJob(job) {
  const rest = { ...job };
  for (const k of [...EXTRAS, 'waitingOn', 'stageLabel']) delete rest[k];
  fs.mkdirSync(jobDir(job.id), { recursive: true });
  rest.updated = new Date().toISOString();
  fs.writeFileSync(path.join(jobDir(job.id), 'job.json'), JSON.stringify(rest, null, 2));
  return readJob(job.id);
}

export function listJobs() {
  if (!fs.existsSync(JOBS)) return [];
  return fs.readdirSync(JOBS).map(readJob).filter(Boolean).sort((a, b) => b.created.localeCompare(a.created));
}

export function setStage(id, stage, extra = {}) {
  const job = readJob(id);
  if (!job) throw new Error(`No job ${id}`);
  if (!STAGES[stage]) throw new Error(`Unknown stage ${stage}`);
  return writeJob({ ...job, ...extra, stage });
}

// CLI for Claude: node studio/jobs.mjs pending | show <id> | stage <id> <stage>
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [cmd, id, stage] = process.argv.slice(2);
  if (cmd === 'pending') {
    const todo = listJobs().filter((j) => j.waitingOn === 'claude');
    if (!todo.length) console.log('No jobs waiting on Claude.');
    for (const j of todo) console.log(`${j.id}  mode=${j.mode}  stage=${j.stage}  style=${j.style ?? '-'}  source=${j.source ?? j.url}`);
  } else if (cmd === 'show') {
    console.log(JSON.stringify(readJob(id), null, 2));
  } else if (cmd === 'stage') {
    // Bryan's checklist gates anything he is about to see. Only skip it if he says so: --override.
    if (['review', 'final', 'done'].includes(stage) && !process.argv.includes('--override')) {
      const { preflight } = await import('./preflight.mjs');
      const { fails } = preflight(id);
      if (fails.length) {
        for (const f of fails) console.log('  FAIL ', f);
        console.log(`Blocked: ${fails.length} problem(s) against the checklist. Job stays in ${readJob(id).stage}.`);
        process.exit(1);
      }
    }
    console.log(`${id} -> ${setStage(id, stage).stage}`);
  } else {
    console.log('usage: node studio/jobs.mjs pending | show <id> | stage <id> <stage>');
  }
}
