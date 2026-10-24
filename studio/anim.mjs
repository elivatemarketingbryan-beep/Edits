// Animation templates (assets/animations/<name>/) -> a ready HyperFrames project.
//
//   node studio/anim.mjs list
//   node studio/anim.mjs new <name> <9x16|16x9> <outDir> [--text "..."] [--duration 6] [--image pic.jpg]
//        [--screen rec.mp4 --face me.mp4] [--images a.png,b.png] [--times 0.5,1.8] [--side left|right]
//   (glow-pill = search-bar with no text; motion-background needs --image;
//    screen-window needs --screen and --face; icon-stack takes --images, --times, --side)
//
// Fills the template's __TOKENS__ with the format size, the text and styles/brand.json,
// writes a package.json pinned to the repo's HyperFrames version, and prints the render
// command. Render with: cd <outDir> && npx --yes hyperframes@<pin> render --quality high -o out.mp4
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TEMPLATES = path.join(ROOT, 'assets', 'animations');
// Full edit formats (assets/formats/<name>/) use the same tokens; looked up after effects.
const FORMATS = path.join(ROOT, 'assets', 'formats');
const dirOf = (n) => [TEMPLATES, FORMATS].map((d) => path.join(d, n ?? '')).find((d) => fs.existsSync(path.join(d, 'index.html')));
const SIZES = { '9x16': [1080, 1920], '16x9': [1920, 1080] };

const [cmd, name, format, out, ...rest] = process.argv.slice(2);
const opt = (k, d) => { const i = rest.indexOf(`--${k}`); return i >= 0 ? rest[i + 1] : d; };

if (cmd === 'list') {
  for (const n of [...fs.readdirSync(TEMPLATES), ...(fs.existsSync(FORMATS) ? fs.readdirSync(FORMATS) : [])]) {
    const f = path.join(dirOf(n) ?? '', 'index.html');
    if (!fs.existsSync(f)) continue;
    const note = fs.readFileSync(f, 'utf8').match(/<!--\s*([\s\S]*?)-->/)?.[1].split('\n')[0].trim() ?? '';
    console.log(`${n.padEnd(18)} ${note}`);
  }
} else if (cmd === 'new') {
  // glow-pill is the search bar with nothing typed: just the box and its orbiting glows.
  const template = name === 'glow-pill' ? 'search-bar' : name;
  if (!dirOf(template)) { console.error(`No template "${name}". Run: node studio/anim.mjs list`); process.exit(1); }
  if (!SIZES[format]) { console.error('Format must be 9x16 or 16x9'); process.exit(1); }
  const [W, H] = SIZES[format];
  const brand = JSON.parse(fs.readFileSync(path.join(ROOT, 'styles', 'brand.json'), 'utf8'));
  const pin = JSON.parse(fs.readFileSync(path.join(ROOT, 'skills-lock.json'), 'utf8')).hyperframesVersion;
  const DEFAULT_TEXT = {
    'search-bar': 'How do I create stunning motion graphics like this?', 'glow-pill': '', counter: '$535', 'map-route': 'Los Angeles > New York',
    'article-highlight': 'The Daily Ledger || Small businesses that post daily see [[three times more leads]] || A new study of 2,000 local companies found that consistent posting matters less than one thing: [[a clear offer in every video]]. Owners who added a call to action saw results within 30 days.',
  };
  Object.assign(DEFAULT_TEXT, {
    'chapter-tracker': 'Mastering the tool || Setup | Model tiers | Custom skills | For YouTube | Live mode | Canvas | In the browser | Workspace || 3',
    'level-meter': 'Your level || Beginner 25 | Intermediate 60 | Advanced 90',
    'icon-stack': 'Claude, ChatGPT, Gemini',
    'brand-background': 'circle lines streak', 'shape-transition': 'bounce',
  });
  const text = opt('text', DEFAULT_TEXT[name] ?? '');
  const DEFAULT_DURATION = { 'search-bar': Math.ceil(text.length * 0.11 + 3), 'glow-pill': 6, counter: 4, 'article-highlight': 7, 'motion-background': 10, 'map-route': 8,
    'chapter-tracker': 4, 'level-meter': 6, 'screen-window': 8, 'icon-stack': 4, 'brand-background': 8, 'shape-transition': 3 };
  const duration = Number(opt('duration', DEFAULT_DURATION[name] ?? 6));

  // Media for screen-window (--screen, --face) and icon-stack (--images a.png,b.png):
  // copied into the project; videos become HyperFrames-owned clips (muted video plus a
  // separate audio element for the face, so its sound is kept).
  const copyIn = (file, base) => {
    const src = path.resolve(file);
    if (!fs.existsSync(src)) { console.error(`No file at ${src}`); process.exit(1); }
    fs.mkdirSync(out, { recursive: true });
    const dest = base + path.extname(src).toLowerCase();
    fs.copyFileSync(src, path.join(out, dest));
    return dest;
  };
  const isVideo = (f) => /\.(mp4|mov|m4v|webm)$/i.test(f);
  // Each media element gets its own track: clips sharing a track may not overlap in time.
  const mediaTag = (file, id, track, withAudio) => {
    if (!file) return '';
    if (!isVideo(file)) return `<img id="${id}" src="${file}" alt="" />`;
    const v = `<video id="${id}" class="clip" src="${file}" data-start="0" data-duration="${duration}" data-track-index="${track}" muted playsinline></video>`;
    return withAudio ? `${v}<audio id="${id}-audio" src="${file}" data-start="0" data-duration="${duration}" data-track-index="${track + 1}"></audio>` : v;
  };
  const screenTag = opt('screen') ? mediaTag(copyIn(opt('screen'), 'screen'), 'screen', 0, false) : '';
  const faceFile = opt('face') ? copyIn(opt('face'), 'face') : null;
  const faceTag = faceFile ? mediaTag(faceFile, 'face', 1, true) : '';
  // Formats that cut between a panel and full frame get a second, silent copy of the face.
  const face2Tag = faceFile && isVideo(faceFile) ? mediaTag(faceFile, 'face-full', 3, false) : '';
  const faceDur = faceFile && isVideo(faceFile) ? Number(spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path.join(out, faceFile)], { encoding: 'utf8' }).stdout) : 0;
  // Beats for full formats (--file beats.json); a sample with our own script otherwise.
  const beats = dirOf(template)?.startsWith(FORMATS) ? (opt('file') ? JSON.parse(fs.readFileSync(path.resolve(opt('file')), 'utf8')) : sampleBeats()) : null;
  if (template === 'screen-window' && !(screenTag && faceTag)) { console.error('screen-window needs --screen <recording> and --face <presenter>'); process.exit(1); }
  // Icons: an explicit --images list wins; otherwise each name is looked up in the logo
  // library (assets/logos/<name>.png, e.g. "Claude" -> claude.png). Unknown names fall
  // back to a letter tile in the template.
  const given = (opt('images') || '').split(',').map((s) => s.trim()).filter(Boolean);
  const icons = template !== 'icon-stack' ? [] : text.split(',').map((s) => s.trim()).filter(Boolean).map((n, i) => {
    if (given[i]) return copyIn(given[i], `icon-${i + 1}`);
    const logo = path.join(ROOT, 'assets', 'logos', n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.png');
    return fs.existsSync(logo) ? copyIn(logo, `icon-${i + 1}`) : null;
  });
  const times = (opt('times') || '').split(',').map(Number).filter((n) => !Number.isNaN(n) && n >= 0);
  // Motion background: copy the picture in, and turn it 90 degrees if it's the wrong way round for the format.
  let image = '', rotate = false;
  if (opt('image')) {
    const src = path.resolve(opt('image'));
    if (!fs.existsSync(src)) { console.error(`No image at ${src}`); process.exit(1); }
    fs.mkdirSync(out, { recursive: true });
    image = 'bg' + path.extname(src).toLowerCase();
    fs.copyFileSync(src, path.join(out, image));
    const [iw, ih] = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', src], { encoding: 'utf8' }).stdout.trim().split(',').map(Number);
    rotate = iw > 0 && (iw > ih) !== (W > H);
  } else if (template === 'motion-background') { console.error('motion-background needs --image <picture>'); process.exit(1); }
  // Captions: word-timed lines from --file (captions.json); a short sample otherwise.
  let captions = null;
  if (template === 'captions') {
    captions = opt('file') ? JSON.parse(fs.readFileSync(path.resolve(opt('file')), 'utf8')) : sampleCaptions();
  }
  const capEnd = captions ? Math.max(...captions.lines.flatMap((l) => l.words.map((w) => w.e))) + 2 : 0;
  const tokens = {
    __W__: W, __H__: H, __DURATION__: opt('duration') ? duration : faceDur ? Math.floor(faceDur * 30) / 30 : (captions ? Math.ceil(capEnd) : duration),
    __CAPTIONS__: JSON.stringify(captions ?? { lines: [] }),
    __FONT_SANS__: brand.fontSans ?? 'Inter', __FONT_SERIF__: brand.fontAccentSerif ?? 'Playfair Display',
    __TEXT__: JSON.stringify(text), __IMAGE__: image, __ROTATE__: rotate,
    __SCREEN__: screenTag, __FACE__: faceTag, __FACE2__: face2Tag, __BEATS__: JSON.stringify(beats ?? { beats: [] }), __IMAGES__: JSON.stringify(icons), __TIMES__: JSON.stringify(times),
    __SIDE__: JSON.stringify(opt('side', 'right') === 'left' ? 'left' : 'right'),
    __ACCENT__: brand.accent, __ACCENT_LIGHT__: brand.accentLight ?? brand.accent, __ACCENT_DEEP__: brand.accentDeep ?? brand.accent,
    __BG__: brand.background, __TEXT_COLOR__: brand.text,
  };
  fs.mkdirSync(out, { recursive: true });
  for (const file of fs.readdirSync(dirOf(template))) {
    const src = path.join(dirOf(template), file);
    if (/\.(html|css|js|json)$/.test(file)) {
      let s = fs.readFileSync(src, 'utf8');
      for (const [k, v] of Object.entries(tokens)) s = s.split(k).join(String(v));
      fs.writeFileSync(path.join(out, file), s);
    } else fs.copyFileSync(src, path.join(out, file));
  }
  // Overlays (transparent background) render to WebM so they can sit on top of footage.
  const overlay = ['icon-stack', 'captions', 'shape-transition'].includes(template);
  const renderCmd = `npx --yes hyperframes@${pin} render --quality high ${overlay ? '--format webm -o out.webm' : '-o out.mp4'}`;
  fs.writeFileSync(path.join(out, 'package.json'), JSON.stringify({ name: `anim-${name}`, private: true, type: 'module',
    scripts: { check: `npx --yes hyperframes@${pin} check`, render: renderCmd } }, null, 2));
  console.log(`Made ${out} (${format}, ${W}x${H}${overlay ? ', transparent overlay' : ''}). Render: cd "${out}" && ${renderCmd}`);
} else if (cmd !== 'sample') {
  console.log('usage: node studio/anim.mjs list | new <name> <9x16|16x9> <outDir> [--text "..."] [--duration 6]');
}

// A demo of every caption mode with even word timings (our own sample lines).
function sampleCaptions() {
  let t = 0.3;
  const line = (mode, text, extra = {}, gap = 0.5) => {
    const words = text.split(' ').map((w) => { const s = t; t += 0.32; return { w, s: +s.toFixed(2), e: +(s + 0.28).toFixed(2) }; });
    t += gap;
    return { mode, words, ...extra };
  };
  return { lines: [
    line('build', 'Most people wait until they feel ready'),
    line('emphasis', 'Ready never comes', {}, 0.2),
    line('karaoke', 'you build it one rep at a time'),
    line('strike-swap', 'Motivation', { swap: 'Momentum' }, 1.6),
    line('blur', 'small wins stack up quietly'),
    line('scattered', 'until they become your identity'),
    line('command', 'Start today', {}, 0.6),
    line('accent', 'Pick one thing and do it right', { accent: ['right'] }),
    line('slide', 'every single word slides up into place', {}, 0.8),
    line('stack', 'this is how you actually grow', { big: 'grow', accent: ['grow'] }, 0.4),
    line('brush', 'Excuses', {}, 1.0),
    line('pointer', 'watch this one', { side: 'left' }, 0.6),
  ] };
}

// Sample beats for a full format, written for this demo (not from any reference video).
function sampleBeats() {
  return {
    beats: [
      { at: 0, kind: 'title', text: 'Posting daily, [[zero]] clients?' },
      { at: 3, kind: 'face' },
      { at: 5, kind: 'steps', title: 'The fix', items: ['Hook', 'Story', 'Offer'], active: 1 },
      { at: 9, kind: 'counter', title: 'New clients this month', value: 12, prefix: '+' },
    ],
    captions: [
      { at: 0.2, end: 2.8, text: 'posting every day', accent: 'every' },
      { at: 3.1, end: 4.9, text: "it's not your content" },
      { at: 5.2, end: 8.8, text: 'it is the system', accent: 'system' },
      { at: 9.1, end: 12, text: 'and the results follow' },
    ],
  };
}
