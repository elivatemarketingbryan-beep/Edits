// Person matte for a short span of a job's normalized source, instead of the whole clip
// (background removal runs ~0.6 s/frame on CPU). Writes public/jobs/<job>/matte/<name>.webm; reference it from
// a `behind` entry as {"matte": "jobs/<job>/matte/<name>.webm", "matteStart": <startFrame>}.
//   node scripts/matte-span.mjs <job> <startFrame> <endFrame> [name]
import {spawnSync} from 'child_process';
import fs from 'fs';

const [job, s, e, name = `span-${s}`] = process.argv.slice(2);
if (!job || !(Number(e) > Number(s))) { console.error('usage: node scripts/matte-span.mjs <job> <startFrame> <endFrame> [name]'); process.exit(1); }
const dir = `public/jobs/${job}/matte`;
fs.mkdirSync(dir, {recursive: true});
const clip = `${dir}/${name}-src.mp4`;
const run = (cmd, args) => { const r = spawnSync(cmd, args, {stdio: 'inherit', shell: process.platform === 'win32'}); if (r.status) process.exit(r.status ?? 1); };
run('ffmpeg', ['-v', 'error', '-y', '-i', `public/jobs/${job}/source.mp4`, '-an', '-vf', `trim=start_frame=${s}:end_frame=${e},setpts=PTS-STARTPTS`, '-c:v', 'libx264', '-crf', '14', clip]);
run('npx', ['hyperframes', 'remove-background', clip, '-o', `${dir}/${name}.webm`]);
fs.rmSync(clip);
console.log(`matte ${dir}/${name}.webm  matteStart=${s}`);
