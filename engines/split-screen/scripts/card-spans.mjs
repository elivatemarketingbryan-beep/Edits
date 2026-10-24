// Frame spans where a job's source shows a low-saturation graphic card instead of the purple-lit presenter.
//   node scripts/card-spans.mjs <job> [threshold=18]
import {spawn} from 'child_process';

const [job, thr = '18'] = process.argv.slice(2);
const p = spawn('ffmpeg', ['-v', 'error', '-i', `public/jobs/${job}/source.mp4`, '-an', '-vf', 'scale=270:-1,signalstats,metadata=print:key=lavfi.signalstats.SATAVG:file=-', '-f', 'null', '-']);
let buf = '', t = 0, frame = -1, start = -1;
const spans = [];
p.stdout.on('data', d => {
  buf += d;
  const lines = buf.split('\n'); buf = lines.pop();
  for (const l of lines) {
    const pt = l.match(/pts_time:([\d.]+)/); if (pt) { t = Number(pt[1]); frame = Math.round(t * 30); continue; }
    const s = l.match(/SATAVG=([\d.]+)/); if (!s) continue;
    const card = Number(s[1]) < Number(thr);
    if (card && start < 0) start = frame;
    if (!card && start >= 0) { spans.push([start, frame]); start = -1; }
  }
});
p.on('close', () => { if (start >= 0) spans.push([start, frame + 1]); console.log(spans.length ? spans.map(([a, b]) => `card ${a}-${b}`).join('\n') : 'no cards'); });
