// Structure check for the whole Video Studio folder: `node studio/check.mjs`
// Prints one line per check and exits 1 if anything required is broken.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, STAGES, listJobs } from './jobs.mjs';

let failed = 0, warned = 0;
const ok = (msg) => console.log(`  ok    ${msg}`);
const bad = (msg) => { failed++; console.log(`  FAIL  ${msg}`); };
const warn = (msg) => { warned++; console.log(`  warn  ${msg}`); };
const exists = (rel) => fs.existsSync(path.join(ROOT, rel));
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const json = (rel) => { try { return JSON.parse(read(rel)); } catch (e) { bad(`${rel} is not valid JSON: ${e.message}`); return null; } };
const section = (t) => console.log(`\n${t}`);

section('Folders and entry files');
for (const rel of ['CLAUDE.md', 'START_HERE.md', 'Start Studio.cmd', 'studio/server.mjs', 'studio/jobs.mjs', 'studio/sfx.mjs',
  'studio/public/index.html', 'studio/public/review.html', 'studio/public/studio.css',
  'styles/catalog.json', 'styles/STYLE-GUIDE.md', 'styles/SOUND-RULES.md', 'styles/sfx.json', 'styles/brand.json',
  'docs/editor-pipeline.md', 'lib', 'presets', 'workflows', 'assets/sfx', 'assets/sound-effects', '.claude/skills', '.claude/settings.json',
  'engines/split-screen/AGENTS.md', 'engines/split-screen/scripts/editor.mjs', 'engines/split-screen/src/custom/registry.tsx',
  'engines/split-screen/inputs', 'engines/split-screen/docs',
  'engines/video-fx/engine/fx.mjs', '.claude/skills/video-fx/SKILL.md', '.claude/skills/fx-checklist/SKILL.md',
  'engines/brand-motion/SKILL.md', 'engines/brand-motion/engine/make.py', 'studio/words-convert.mjs',
  '.claude/skills/motion-promo/SKILL.md', '.claude/skills/high-quality-captions/SKILL.md', '.claude/skills/glow-intro-caption/SKILL.md',
  '.claude/skills/headline-highlight/SKILL.md', '.claude/skills/github-callout/SKILL.md',
  'engines/faceless/CLAUDE.md', 'engines/faceless/engine/docs/planning.md', 'engines/faceless/engine/scripts/make.mjs',
  'engines/content-os/CLAUDE.md','engines/content-os/notion-pipeline.md', 'engines/content-os/.claude/skills/scriptwriter/SKILL.md',
  'engines/legacy-editor/.claude/skills/clipper/scripts/make-clips.py']) {
  exists(rel) ? ok(rel) : bad(`missing ${rel}`);
}

section('Styles');
const catalog = json('styles/catalog.json');
const guide = read('styles/STYLE-GUIDE.md');
const soundPart = guide.slice(guide.indexOf('## Sound'), guide.indexOf('## Motion feel'));
if (catalog) {
  const ids = catalog.styles.map((s) => s.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  dupes.length ? bad(`duplicate style ids: ${dupes.join(', ')}`) : ok(`${ids.length} catalog entries, ids unique`);
  const styles = catalog.styles.filter((s) => s.kind === 'style');
  ok(`${styles.length} styles, ${catalog.styles.length - styles.length} tools, ${styles.filter((s) => s.status === 'ready').length} ready`);
  for (const s of catalog.styles) {
    if (!['editor', 'split-screen', 'legacy', 'content-os', 'faceless', 'brand-motion', 'remotion-skill'].includes(s.engine)) bad(`${s.id}: unknown engine "${s.engine}"`);
    if (!['ready', 'draft'].includes(s.status)) bad(`${s.id}: unknown status "${s.status}"`);
    if (s.kind === 'style') {
      if (!guide.includes(`### ${s.id}:`)) bad(`${s.id}: no "### ${s.id}:" section in STYLE-GUIDE.md`);
      if (!soundPart.includes(s.id)) bad(`${s.id}: no sound density (dense/light/minimal) in STYLE-GUIDE.md Sound section`);
      if (!s.bestFor?.length) warn(`${s.id}: no ranking cues (bestFor)`);
    }
  }
  if (!failed) ok('every style has a guide section and a sound density');
}

section('Sound effects');
const sfx = json('styles/sfx.json');
if (sfx) {
  let n = 0;
  for (const [cue, c] of Object.entries(sfx.cues)) {
    n++;
    if (!exists(`assets/sfx/${c.file}`)) bad(`sound "${cue}": assets/sfx/${c.file} is missing`);
    if (!(c.peak >= 0) || !(c.volume > 0 && c.volume <= 1)) bad(`sound "${cue}": bad peak or volume`);
  }
  ok(`${n} named sounds checked`);
  const rules = read('styles/SOUND-RULES.md');
  const unruled = Object.keys(sfx.cues).filter((c) => !c.startsWith('water') && !rules.includes(c));
  unruled.length ? warn(`sounds with no rule in SOUND-RULES.md: ${unruled.join(', ')}`) : ok('every sound has a placement rule');
}

section('Animation library');
const animDir = path.join(ROOT, 'assets', 'animations');
const anims = fs.existsSync(animDir) ? fs.readdirSync(animDir).filter((n) => fs.existsSync(path.join(animDir, n, 'index.html'))) : [];
const animGuide = exists('styles/ANIMATIONS.md') ? read('styles/ANIMATIONS.md') : '';
if (!animGuide) bad('missing styles/ANIMATIONS.md');
for (const n of anims) {
  if (!animGuide.includes(`\`${n}\``)) warn(`template ${n} is not described in styles/ANIMATIONS.md`);
  if (/__[A-Z_]+__/.test(read(`assets/animations/${n}/index.html`).replace(/__(W|H|DURATION|TEXT|ACCENT|ACCENT_LIGHT|ACCENT_DEEP|BG|TEXT_COLOR|IMAGE|ROTATE|SCREEN|FACE|IMAGES|TIMES|SIDE|CAPTIONS|FONT_SANS|FONT_SERIF)__/g, ''))) bad(`template ${n} uses a token studio/anim.mjs doesn't fill`);
}
ok(`${anims.length} animation templates: ${anims.join(', ')}`);
exists('assets/luts/soft-pastel.cube') ? ok('soft-pastel colour grade') : warn('soft-pastel grade not built: node studio/lut.mjs make soft-pastel');

section('Render engines');
const engines = json('styles/engines.json');
if (engines) {
  ok('HyperFrames: always on (renders every style)');
  if (engines.remotion) {
    exists('engines/split-screen/node_modules') ? ok(`Remotion: on for ${engines.remotionStyles.join(', ')}`) : bad('Remotion is on but engines/split-screen has no packages: run "npm ci" there');
  } else ok('Remotion: off (engines/split-screen is reference only)');
}

section('Brand');
const brand = json('styles/brand.json');
if (brand) brand.set ? ok('brand colours and fonts set') : warn('brand not set yet: Claude asks for colours and fonts on the first edit');

section('Skills');
const skillsDir = path.join(ROOT, '.claude', 'skills');
let skills = 0;
for (const n of fs.readdirSync(skillsDir)) {
  const dir = path.join(skillsDir, n);
  if (!fs.statSync(dir).isDirectory()) continue;
  skills++;
  const f = path.join(dir, 'SKILL.md');
  if (!fs.existsSync(f)) { bad(`skill ${n}: no SKILL.md`); continue; }
  const s = fs.readFileSync(f, 'utf8');
  if (!/^---\r?\n[\s\S]*?name:/m.test(s)) bad(`skill ${n}: SKILL.md has no name in its header`);
  const m = s.match(/this skill lives in `(engines\/[a-z-]+)`/);
  if (m && !fs.existsSync(path.join(ROOT, m[1], '.claude', 'skills', n, 'SKILL.md'))) bad(`skill ${n}: points to ${m[1]} but the copy there is missing`);
}
ok(`${skills} skills, all with headers`);

section('Jobs');
const jobs = listJobs();
for (const j of jobs) if (!STAGES[j.stage]) bad(`job ${j.id}: unknown stage "${j.stage}"`);
ok(`${jobs.length} jobs`);

section('Tools on this computer');
const tool = (cmd, args, need, label = cmd) => {
  const r = spawnSync(cmd, args, { encoding: 'utf8', shell: process.platform === 'win32' });
  if (r.status === 0) ok(`${label}: ${(r.stdout || r.stderr).split('\n')[0].trim().slice(0, 60)}`);
  else (need ? bad : warn)(`${label} not found${need ? '' : ' (needed for some steps)'}`);
};
tool('node', ['--version'], true);
tool('ffmpeg', ['-version'], true);
tool('ffprobe', ['-version'], true);
tool('yt-dlp', ['--version'], false, 'yt-dlp (YouTube links)');
tool('uv', ['--version'], false, 'uv (transcription, root pipeline)');
tool('python', ['--version'], false);
exists('engines/split-screen/node_modules') ? ok('split-screen packages installed') : warn('split-screen packages not installed: run "npm ci" in engines/split-screen');

console.log(`\n${failed ? `${failed} problem(s) to fix` : 'Structure OK'}${warned ? `, ${warned} warning(s)` : ''}.`);
process.exit(failed ? 1 : 0);
