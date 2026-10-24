// Colour grades as .cube LUTs (assets/luts/), made from a few readable numbers.
//
//   node studio/lut.mjs make soft-pastel           -> assets/luts/soft-pastel.cube
//   node studio/lut.mjs apply <in.mp4> <out.mp4> [soft-pastel] [--strength 0.8]
//
// soft-pastel: clean studio look for talking heads. Lifted blacks, gentle contrast,
// softer saturation, slightly cool shadows and warm-peach highlights, smooth highlight
// roll-off so skin and white walls never clip. Apply BEFORE graphics are composited, to
// the footage only, so brand colours in the graphics stay exact.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'assets', 'luts');

const LOOKS = {
  'soft-pastel': { lift: 0.045, gain: 0.97, contrast: 0.88, saturation: 0.82, shadowTint: [-0.006, 0.0, 0.014], highlightTint: [0.016, 0.006, -0.006], rolloff: 0.85 },
};

function grade([r, g, b], L) {
  let c = [r, g, b].map((v) => {
    v = 0.5 + (v - 0.5) * L.contrast;                         // gentler contrast
    if (v > L.rolloff) v = L.rolloff + (1 - L.rolloff) * Math.tanh((v - L.rolloff) / (1 - L.rolloff)); // soft highlights
    return L.lift + v * (L.gain - L.lift);                    // lifted blacks, no hard white
  });
  const y = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  c = c.map((v) => y + (v - y) * L.saturation);               // softer colour
  const sh = Math.max(0, 1 - y * 2), hi = Math.max(0, y * 2 - 1);
  c = c.map((v, i) => v + L.shadowTint[i] * sh + L.highlightTint[i] * hi);
  return c.map((v) => Math.min(1, Math.max(0, v)));
}

function make(name, size = 33) {
  const L = LOOKS[name];
  if (!L) throw new Error(`Unknown look "${name}". Looks: ${Object.keys(LOOKS).join(', ')}`);
  const lines = [`TITLE "${name}"`, `LUT_3D_SIZE ${size}`, ''];
  for (let b = 0; b < size; b++) for (let g = 0; g < size; g++) for (let r = 0; r < size; r++) {
    lines.push(grade([r, g, b].map((v) => v / (size - 1)), L).map((v) => v.toFixed(6)).join(' '));
  }
  fs.mkdirSync(DIR, { recursive: true });
  const file = path.join(DIR, `${name}.cube`);
  fs.writeFileSync(file, lines.join('\n') + '\n');
  return file;
}

const [cmd, a, b, c, ...rest] = process.argv.slice(2);
try {
  if (cmd === 'make') console.log(`Wrote ${path.relative(ROOT, make(a || 'soft-pastel'))}`);
  else if (cmd === 'apply') {
    const look = c && !c.startsWith('--') ? c : 'soft-pastel';
    const si = [c, ...rest].indexOf('--strength');
    const strength = si >= 0 ? Number([c, ...rest][si + 1]) : 1;
    const cube = path.join(DIR, `${look}.cube`);
    if (!fs.existsSync(cube)) make(look);
    // ffmpeg's filter parser needs forward slashes and an escaped drive colon on Windows.
    const lutPath = cube.replace(/\\/g, '/').replace(/^([A-Za-z]):/, '$1\\:');
    const vf = strength >= 1 ? `lut3d='${lutPath}'`
      : `split[o][g];[g]lut3d='${lutPath}'[l];[o][l]blend=all_expr='A*${1 - strength}+B*${strength}'`;
    const r = spawnSync('ffmpeg', ['-y', '-v', 'error', '-i', a, '-vf', vf, '-c:a', 'copy', '-c:v', 'libx264', '-crf', '16', '-pix_fmt', 'yuv420p', b], { encoding: 'utf8' });
    if (r.status !== 0) throw new Error(r.stderr);
    console.log(`Graded ${a} -> ${b} with ${look}${strength < 1 ? ` at ${Math.round(strength * 100)}%` : ''}`);
  } else console.log('usage: node studio/lut.mjs make [look] | apply <in> <out> [look] [--strength 0.8]');
} catch (e) { console.error(e.message); process.exit(1); }
