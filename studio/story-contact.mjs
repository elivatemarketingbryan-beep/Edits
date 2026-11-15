// Checks a story scene frame by frame: does any part of the figure go into the ground or through a step?
// `node studio/story-contact.mjs assets/boards/story/S01-climb.html [fps]`  exits 1 if anything goes more than 1.5 px in.
// The scene must expose window.__story = { id, fig, world, floor(x), origin: [x, y] } (see S01-climb.html).
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { createRequire } from 'node:module';

const file = path.resolve(process.argv[2]), fps = Number(process.argv[3] ?? 30);
const npx = path.join(process.env.LOCALAPPDATA ?? path.join(os.homedir(), 'AppData/Local'), 'npm-cache/_npx');
const pkg = fs.readdirSync(npx).map((d) => path.join(npx, d, 'node_modules/puppeteer-core')).find((d) => fs.existsSync(d));
if (!pkg) { console.log('puppeteer-core not found; run any hyperframes render once first'); process.exit(2); }
const puppeteer = createRequire(import.meta.url)(pkg);
const chrome = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find((p) => fs.existsSync(p));
const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ['--allow-file-access-from-files'] });
const page = await browser.newPage();
page.on('pageerror', (e) => console.log('page error:', e.message));
page.on('console', (m) => m.type() === 'error' && console.log('console:', m.text()));
await page.setViewport({ width: 1920, height: 1080 });
await page.goto((await import('node:url')).pathToFileURL(file).href);
for (let i = 0; i < 100; i++) {   // wait for the scene to build its timeline
  if (await page.evaluate(() => !!(window.__story && window.__timelines && window.__timelines[window.__story.id]))) break;
  if (i === 99) { console.log('the scene never registered its timeline (window.__story / __timelines)'); process.exit(2); }
  await new Promise((r) => setTimeout(r, 200));
}
const res = await page.evaluate((fps) => {
  const S = window.__story, tl = window.__timelines[S.id], dur = tl.duration();
  const marks = [...document.querySelectorAll(`${S.fig} .mk`)];
  const out = [];
  for (let f = 0; f <= Math.round(dur * fps); f++) {
    const t = f / fps;
    tl.totalTime(t, true);
    const tx = gsap.getProperty(S.world, 'x'), ty = gsap.getProperty(S.world, 'y'), sc = gsap.getProperty(S.world, 'scale');
    let worst = Infinity, at = null;
    for (const m of marks) {
      const b = m.getBoundingClientRect(), r = Number(m.dataset.r);
      const wx = (b.x - S.origin[0] - tx) / sc + S.origin[0], wy = (b.y - S.origin[1] - ty) / sc + S.origin[1];
      const gap = S.floor(wx) - (wy + r);
      if (gap < worst) { worst = gap; at = [Math.round(wx), Math.round(wy)]; }
    }
    out.push([+t.toFixed(3), +worst.toFixed(1), at]);
  }
  return out;
}, fps);
await browser.close();
const bad = res.filter(([, g]) => g < -1.5);
const touching = res.filter(([, g]) => g >= -1.5 && g <= 1.5).length;
console.log(`${res.length} frames checked. Touching the surface: ${touching}. Into the surface: ${bad.length}.`);
let run = null;
for (const [t, g, p] of bad) {
  if (run && t - run.end < 0.05) { run.end = t; run.min = Math.min(run.min, g); } else { if (run) console.log(`  ${run.start}-${run.end}s  down to ${run.min} px at ${run.p}`); run = { start: t, end: t, min: g, p }; }
}
if (run) console.log(`  ${run.start}-${run.end}s  down to ${run.min} px at ${run.p}`);
process.exit(bad.length ? 1 : 0);
