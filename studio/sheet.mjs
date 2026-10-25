// Video Breakdown Sheet: a timestamped list of every scene and animation in a job, with a
// place to say what to change. Long-form edits render one file per scene so a note
// re-renders only that scene, then `assemble` splices them back together.
//
//   node studio/sheet.mjs check <id>      validate jobs/<id>/sheet.json (order, gaps, files)
//   node studio/sheet.mjs thumbs <id>     one thumbnail per scene from preview.mp4 -> sheet/<scene>.jpg
//   node studio/sheet.mjs assemble <id>   join scenes/<scene>.mp4 in order -> .nosfx.mp4
//   node studio/sheet.mjs md <id>         print the sheet with its open notes, for pasting to Claude
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { jobDir, readJob } from './jobs.mjs';

const fmt = (t) => { t = Math.max(0, t || 0); return Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0'); };

export function readSheet(id) {
  const f = path.join(jobDir(id), 'sheet.json');
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : [];
}

// Notes left on the sheet carry `scene`; notes left on the review page are matched by time.
export const notesFor = (scene, notes) =>
  notes.filter((n) => n.scene ? n.scene === scene.id : n.t >= scene.start && n.t < scene.end);

export function check(id) {
  const sheet = readSheet(id);
  const problems = [];
  if (!sheet.length) problems.push('sheet.json is missing or empty');
  const ids = new Set();
  sheet.forEach((s, i) => {
    if (!/^s\d{2,}$/.test(s.id || '')) problems.push(`scene ${i + 1}: id should look like s01`);
    if (ids.has(s.id)) problems.push(`${s.id}: duplicate id`);
    ids.add(s.id);
    if (!(s.end > s.start)) problems.push(`${s.id}: end must be after start`);
    if (!s.title) problems.push(`${s.id}: no title`);
    if (!s.what) problems.push(`${s.id}: no "what" (what the viewer sees)`);
    const prev = sheet[i - 1];
    if (prev && Math.abs(s.start - prev.end) > 0.05) problems.push(`${s.id}: starts at ${s.start}, previous scene ends at ${prev.end} (scenes must be back to back)`);
    if (s.render && !fs.existsSync(path.join(jobDir(id), s.render))) problems.push(`${s.id}: render ${s.render} not found`);
  });
  return problems;
}

export function thumbs(id) {
  const job = readJob(id);
  const video = path.join(jobDir(id), job?.preview || 'preview.mp4');
  if (!fs.existsSync(video)) throw new Error(`no preview video at ${video}`);
  const dir = path.join(jobDir(id), 'sheet');
  fs.mkdirSync(dir, { recursive: true });
  const sheet = readSheet(id);
  for (const s of sheet) {
    const at = s.thumbAt ?? (s.start + Math.min(s.end - s.start, 4) / 2);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', String(at), '-i', video, '-frames:v', '1', '-vf', 'scale=480:-2', '-q:v', '4', path.join(dir, `${s.id}.jpg`)]);
    s.thumb = `sheet/${s.id}.jpg`;
  }
  fs.writeFileSync(path.join(jobDir(id), 'sheet.json'), JSON.stringify(sheet, null, 2));
  return sheet.length;
}

const probe = (file) => execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_name,width,height,r_frame_rate,sample_rate,channels', '-of', 'csv=p=0', file], { encoding: 'utf8' }).trim();

export function assemble(id) {
  const dir = jobDir(id);
  const sheet = readSheet(id);
  const files = sheet.map((s) => path.join(dir, s.render || `scenes/${s.id}.mp4`));
  const missing = files.filter((f) => !fs.existsSync(f));
  if (missing.length) throw new Error(`missing scene renders:\n${missing.join('\n')}`);
  const out = path.join(dir, '.nosfx.mp4');
  const same = new Set(files.map(probe)).size === 1;
  if (same) {
    // Same encoding everywhere: join without re-encoding, so a one-scene fix takes seconds.
    const list = path.join(dir, 'scenes', 'concat.txt');
    fs.mkdirSync(path.dirname(list), { recursive: true });
    fs.writeFileSync(list, files.map((f) => `file '${f.replace(/\\/g, '/').replace(/'/g, "'\\''")}'`).join('\n'));
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', '-movflags', '+faststart', out]);
  } else {
    const inputs = files.flatMap((f) => ['-i', f]);
    const chain = files.map((_, i) => `[${i}:v:0][${i}:a:0]`).join('') + `concat=n=${files.length}:v=1:a=1[v][a]`;
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...inputs, '-filter_complex', chain, '-map', '[v]', '-map', '[a]',
      '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-c:a', 'aac', '-b:a', '256k', '-movflags', '+faststart', out]);
  }
  return { out, copied: same, scenes: files.length };
}

export function markdown(id) {
  const job = readJob(id);
  const sheet = readSheet(id);
  const lines = [`# Video Breakdown Sheet: ${job?.title ?? id}`, `Job ${id}. Change only the scenes with notes, re-render those scenes, then assemble.`, ''];
  let chapter = null;
  for (const s of sheet) {
    if (s.chapter && s.chapter !== chapter) { chapter = s.chapter; lines.push(`## ${chapter}`); }
    lines.push(`- **${s.id} ${fmt(s.start)}-${fmt(s.end)} ${s.title}**: ${s.what}${s.file ? ` (\`${s.file}\`)` : ''}`);
    for (const n of notesFor(s, job?.notes ?? []).filter((n) => n.status === 'open')) lines.push(`  - CHANGE: ${n.text}`);
  }
  return lines.join('\n');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [cmd, id] = process.argv.slice(2);
  if (!id) { console.log('usage: node studio/sheet.mjs check|thumbs|assemble|md <job id>'); process.exit(1); }
  if (cmd === 'check') { const p = check(id); console.log(p.length ? p.map((x) => 'FAIL ' + x).join('\n') : `ok, ${readSheet(id).length} scenes`); process.exitCode = p.length ? 1 : 0; }
  else if (cmd === 'thumbs') console.log(`${thumbs(id)} thumbnails written`);
  else if (cmd === 'assemble') { const r = assemble(id); console.log(`${r.scenes} scenes -> ${r.out} (${r.copied ? 'joined without re-encoding' : 're-encoded'})`); }
  else if (cmd === 'md') console.log(markdown(id));
  else { console.log('usage: node studio/sheet.mjs check|thumbs|assemble|md <job id>'); process.exit(1); }
}
