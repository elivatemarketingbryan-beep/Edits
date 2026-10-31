// Footage effects with frame-exact control: the CapCut-style tricks that work on the picture itself,
// applied to any time range of a clip. From Zeven 7's "7 Stupidly Simple CapCut Tricks" (styles/REFERENCES.md).
//
//   node studio/fx.mjs list
//   node studio/fx.mjs <effect> <in.mp4> <out.mp4> [--from 2.4] [--to 3.1] [--amount N] [--at 1.2,4.8] [--overlay captions.webm]
//
// Effects (each only between --from and --to; the whole clip if both are left out):
//   lag       choppy low-frame-rate motion (FPS lag). --amount = frames per second, default 12 (10-20 reads best)
//   wide      wide-angle warp: the frame bends from the corners. --amount 0-1, default 0.35
//   fisheye   fisheye bulge from the centre. --amount 0-1, default 0.35
//   shade     soft vignette shading for depth. --amount 0-1, default 0.6
//   flash     white flash frames (a reveal): --at times, each 2 frames of full white
//   negative  negative text: the picture inverted inside the letters of a caption overlay (--overlay, a
//             --amount 0-1 to ease it off, default 1;
//             transparent WebM from `anim.mjs captions`; render the negative lines on their own overlay)
// Audio is copied untouched. Output: H.264 (NVENC), keyframe every second, same size and fps as the input.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

const EFFECTS = {
  lag: 'choppy low-frame-rate motion (--amount fps, default 12)',
  wide: 'wide-angle warp from the corners (--amount 0-1, default 0.35)',
  fisheye: 'fisheye bulge from the centre (--amount 0-1, default 0.35)',
  shade: 'soft vignette shading (--amount 0-1, default 0.6)',
  flash: 'white flash frames at --at times (2 frames each)',
  negative: 'picture inverted inside the caption letters (--overlay captions.webm, --amount 0-1, default 1)',
};

const [cmd, input, output, ...rest] = process.argv.slice(2);
const opt = (k, d) => { const i = rest.indexOf('--' + k); return i >= 0 ? rest[i + 1] : d; };
const run = (args) => { const r = spawnSync('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: 'inherit' }); if (r.status !== 0) process.exit(r.status ?? 1); };
const probe = (f, entries) => spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', entries, '-of', 'csv=p=0', f], { encoding: 'utf8' }).stdout.trim().split(/\r?\n/)[0].trim();   // ffprobe can repeat the line

if (!cmd || cmd === 'list' || !EFFECTS[cmd]) {
  for (const [k, v] of Object.entries(EFFECTS)) console.log(`${k.padEnd(9)} ${v}`);
  if (cmd && cmd !== 'list') { console.error(`\nUnknown effect "${cmd}"`); process.exit(1); }
  process.exit(0);
}
if (!input || !output || !fs.existsSync(input)) { console.error('usage: node studio/fx.mjs <effect> <in.mp4> <out.mp4> [--from s] [--to s] [--amount n]'); process.exit(1); }

const [fr] = probe(input, 'stream=r_frame_rate').split(',');
const [num, den] = fr.split('/').map(Number), fps = den ? num / den : 30;
const dur = Number(spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', input], { encoding: 'utf8' }).stdout.trim());
const from = Math.max(0, Number(opt('from', 0))), to = Math.min(dur, Number(opt('to', dur)));
const amount = opt('amount');
const hasAudio = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'a', '-show_entries', 'stream=index', '-of', 'csv=p=0', input], { encoding: 'utf8' }).stdout.trim() !== '';
const enc = ['-c:v', 'h264_nvenc', '-cq', '18', '-g', String(Math.round(fps)), '-pix_fmt', 'yuv420p'];
const audio = hasAudio ? ['-map', '0:a', '-c:a', 'copy'] : [];

// The effect's own filter chain, applied to the middle segment [from, to).
function chain() {
  const a = (d) => Number(amount ?? d);
  switch (cmd) {
    case 'lag': return `fps=${a(12)},fps=${fps}`;
    // fisheye: barrel bulge from the centre; wide: stretched, pulled corners. Both zoom in to fill the frame (no black edges).
    case 'fisheye': { const k = a(0.35), z = (1 + 0.45 * k).toFixed(3); return `lenscorrection=k1=${(-0.75 * k).toFixed(3)}:k2=${(-0.3 * k).toFixed(3)}:i=bilinear,scale=iw*${z}:-2,crop=iw/${z}:ih/${z}`; }
    case 'wide': { const k = a(0.35), z = (1 + 0.9 * k).toFixed(3); return `lenscorrection=k1=${(0.55 * k).toFixed(3)}:k2=${(0.25 * k).toFixed(3)}:i=bilinear,scale=iw*${z}:-2,crop=iw/${z}:ih/${z}`; }
    case 'shade': return `vignette=angle=${(0.3 + 0.6 * a(0.6)).toFixed(3)}:mode=forward`;
    default: return null;
  }
}

if (cmd === 'flash') {
  // Full-frame white for 2 frames at each --at time (a reveal: put the next word or shot right behind it).
  const times = String(opt('at', '')).split(',').map(Number).filter((t) => t >= 0 && t < dur);
  if (!times.length) { console.error('flash needs --at 1.2,4.8'); process.exit(1); }
  const f = times.map((t) => `drawbox=x=0:y=0:w=iw:h=ih:c=white@1:t=fill:enable='between(t,${t.toFixed(3)},${(t + 2 / fps - 0.001).toFixed(3)})'`).join(',');
  run(['-i', input, '-filter_complex', `[0:v]${f}[v]`, '-map', '[v]', ...audio, ...enc, output]);
} else if (cmd === 'negative') {
  // Invert the picture wherever the caption overlay is opaque: the caption becomes a window of negative footage.
  const ov = opt('overlay');
  if (!ov || !fs.existsSync(ov)) { console.error('negative needs --overlay captions.webm (a transparent caption render)'); process.exit(1); }
  const [w, h] = probe(input, 'stream=width,height').split(',').map(Number);
  // All three in planar RGB so the mask (the overlay's alpha, copied to every plane) applies to every channel.
  run(['-i', input, '-c:v', 'libvpx-vp9', '-i', ov, '-filter_complex',
    // --amount 0-1 eases it off ("if it looks too flashy, bring it slightly down"): 1 = full negative.
    `[0:v]format=gbrp,split[a][b];[b]negate[n];[1:v]scale=${w}:${h},format=yuva420p,alphaextract,format=gbrp,lutrgb=r=val*${Number(amount ?? 1)}:g=val*${Number(amount ?? 1)}:b=val*${Number(amount ?? 1)}[m];[a][n][m]maskedmerge,format=yuv420p[v]`,
    '-map', '[v]', ...audio, '-shortest', ...enc, output]);
} else {
  // Split into before / effect / after so frame-rate and lens effects only touch the chosen range.
  // Lens effects can round the frame a pixel off; the effect segment always goes back to the clip's exact size.
  const [w, h] = probe(input, 'stream=width,height').split(',').map(Number);
  const c = `${chain()},scale=${w}:${h},setsar=1`, parts = [], labels = [];
  const seg = (a, b, name, extra) => {
    if (b - a < 1 / fps) return;
    parts.push(`[0:v]trim=start=${a.toFixed(4)}:end=${b.toFixed(4)},setpts=PTS-STARTPTS${extra ? ',' + extra : ''}[${name}]`); labels.push(`[${name}]`);
  };
  seg(0, from, 'pre');
  seg(from, to, 'mid', c);
  seg(to, dur, 'post');
  const graph = labels.length === 1 ? parts[0].replace(/\[\w+\]$/, '[v]') : `${parts.join(';')};${labels.join('')}concat=n=${labels.length}:v=1:a=0[v]`;
  run(['-i', input, '-filter_complex', graph, '-map', '[v]', ...audio, ...enc, output]);
}
console.log(`${cmd}: ${output}${cmd === 'flash' ? '' : ` (${from.toFixed(2)}-${to.toFixed(2)} s)`}`);
