// Turns the 25 reel-format mockups (docs/reel-formats.html) into short animated HyperFrames
// projects, one per format, so each can be rendered to a playable preview video.
//   node studio/format-previews.mjs <outDir>
// Each project is 1080x1920, 4s: the layout settles in, cards and captions pop in on a
// stagger, the presenter shape breathes. The mockup's own looping CSS animation is dropped
// (not seek-safe) and replaced with one GSAP timeline.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.resolve(process.argv[2] || path.join(ROOT, 'projects', '_format-previews'));
const page = fs.readFileSync(path.join(ROOT, 'docs', 'reel-formats.html'), 'utf8');
const pin = JSON.parse(fs.readFileSync(path.join(ROOT, 'skills-lock.json'), 'utf8')).hyperframesVersion;

// The mockup CSS (minus the page chrome's looping keyframes) and the format list.
const css = page.match(/<style>([\s\S]*?)<\/style>/)[1].replace(/@media \(prefers-reduced-motion[\s\S]*?\n  \}\n/, '')
  .replace(/transform: translateX\(-50%\)/g, 'translate: -50% 0');   // keeps centring when GSAP tweens transforms
const script = page.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/document\.getElementById\('grid'\)[\s\S]*$/, '');
const F = new Function(`${script}; return F;`)();

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
fs.mkdirSync(out, { recursive: true });
F.forEach(([name, desc, ready, html], i) => {
  const dir = path.join(out, `${String(i + 1).padStart(2, '0')}-${slug(name)}`);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=1080, height=1920" />
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
<style>
${css}
html, body { width: 1080px; height: 1920px; margin: 0; overflow: hidden; background: #000; }
#root .ph { position: absolute; inset: 0; width: 1080px; height: 1920px; max-width: none; border: 0; border-radius: 0; box-shadow: none; aspect-ratio: auto; }
.label { position: absolute; left: 50px; bottom: 60px; right: 50px; display: flex; gap: 18px; align-items: center; font: 800 44px "Inter", sans-serif; color: #fff; text-shadow: 0 3px 14px rgba(0,0,0,.8); z-index: 5; }
.label i { font: 700 26px "Inter", sans-serif; font-style: normal; letter-spacing: .06em; text-transform: uppercase; padding: 6px 16px; border-radius: 99px; background: ${ready ? '#123326' : '#8b5cf6'}; color: ${ready ? '#6fd6a4' : '#fff'}; }
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="4" data-width="1080" data-height="1920">
  <div class="ph">${html}</div>
  <div class="label"><span>${String(i + 1).padStart(2, '0')} · ${name}</span><i>${ready ? 'Ready' : 'Designed'}</i></div>
</div>
<script>
  window.__timelines = window.__timelines || {};
  const tl = gsap.timeline({ paused: true });
  // Layout settles: a slow push-in on the whole frame.
  tl.fromTo('.ph', { scale: 1.06 }, { scale: 1, duration: 4, ease: 'power2.out' }, 0);
  // Presenter appears and breathes (finite repeats only: seek-safe).
  tl.from('.p', { opacity: 0, y: 60, duration: 0.6, ease: 'power3.out', stagger: 0.15 }, 0.1);
  tl.to('.p', { y: -10, duration: 0.6, ease: 'sine.inOut', yoyo: true, repeat: 4 }, 0.8);
  // Captions and type, then cards and images, on a stagger.
  tl.from('.ph .t, .ph .pill, .ph .tag', { opacity: 0, y: 40, duration: 0.45, ease: 'power3.out', stagger: 0.18 }, 0.35);
  tl.from('.ph .card, .ph .wcard, .ph .img, .ph .cell, .ph .panel', { opacity: 0, scale: 0.85, duration: 0.4, ease: 'back.out(2)', stagger: 0.07 }, 0.6);
  tl.from('.ph svg path', { strokeDasharray: 300, strokeDashoffset: 300, duration: 1.2, ease: 'power2.inOut' }, 1.1);
  tl.from('.label', { opacity: 0, y: 30, duration: 0.4, ease: 'power3.out' }, 0.2);
  window.__timelines['main'] = tl;
</script>
</body>
</html>
`);
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: `format-${slug(name)}`, private: true, type: 'module',
    scripts: { render: `npx --yes hyperframes@${pin} render --quality draft -o out.mp4` } }, null, 2));
});
console.log(`${F.length} format preview projects in ${path.relative(ROOT, out)}`);
