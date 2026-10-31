// Boot: fonts → audio data → 3D fonts → scenes init → player UI or capture API (window.OP).
import { loadAudio, A } from './core/audio.js';
import { E, setup, render, sceneAt } from './core/engine.js';
import { loadFonts3d } from './core/three.js';
import { SCENES, DURATION, loadTimeline } from './timeline.js';
import { W, H, FPS } from './core/lib.js';

const q = new URLSearchParams(location.search);
const CAPTURE = q.has('capture');
if (CAPTURE) document.body.classList.add('capture');

const FONTS = [
  ['Anton', 'Anton.woff2', {}], ['Anybody', 'Anybody-Var.woff2', { weight: '100 900', stretch: '50% 150%' }],
  ['JetBrains Mono', 'JetBrainsMono-Var.woff2', { weight: '100 800' }],
  ['Bricolage Grotesque', 'BricolageGrotesque-normal.woff2', { weight: '200 800', stretch: '75% 100%' }],
  ['Instrument Serif', 'InstrumentSerif-normal.woff2', {}], ['Instrument Serif', 'InstrumentSerif-italic.woff2', { style: 'italic' }],
  ['Press Start 2P', 'PressStart2P-normal.woff2', {}], ['Monoton', 'Monoton-normal.woff2', {}],
  ['Rubik Mono One', 'RubikMonoOne-normal.woff2', {}], ['Bungee', 'Bungee-normal.woff2', {}], ['Caveat', 'Caveat-normal.woff2', { weight: '400 700' }],
];

async function boot() {
  await Promise.all(FONTS.map(async ([fam, file, d]) => { const f = new FontFace(fam, `url(fonts/${file})`, d); await f.load(); document.fonts.add(f); }));
  await loadAudio('data/audio.json');
  await loadFonts3d();
  await loadTimeline();
  for (const s of SCENES) if (s.importError) E.errors.push({ id: s.id, msg: 'import: ' + s.importError });
  const out = document.getElementById('out');
  setup(out, SCENES, DURATION);
  for (const s of SCENES) { try { if (s.init) await s.init(E); } catch (e) { console.error('init', s.id, e); E.errors.push({ id: s.id, msg: 'init: ' + e.message }); } }
  window.OP.ready = true;
  if (!CAPTURE) player();
  else render(0);
}

// ---------------- capture API ----------------
window.OP = {
  ready: false, E, A,
  scenes: () => SCENES.map((s, i) => ({ i, id: s.id, start: s.start, end: s.end, tech: s.tech || '', title: s.title || '' })),
  errors: () => E.errors,
  duration: () => DURATION,
  /** every scene's sound-design cues, flattened */
  cues: () => SCENES.flatMap((s) => (s.sfx || []).map((c) => ({ id: s.id, gain: 1, ...c }))).sort((a, b) => a.t - b.t),
  /** render frame i and return a JPEG data URL */
  frame(i, q = 0.92) { render(i / FPS); return E.out.toDataURL('image/jpeg', q); },
  /** render frame i, return ms taken */
  bench(i) { const t0 = performance.now(); render(i / FPS); E.G.gl.finish(); return performance.now() - t0; },
  /** contact sheet: times → one JPEG with labels */
  sheet(times, cols = 4, scale = 0.25, q = 0.85) {
    const w = Math.round(W * scale), h = Math.round(H * scale), rows = Math.ceil(times.length / cols);
    const c = document.createElement('canvas'); c.width = w * cols; c.height = (h + 22) * rows;
    const x = c.getContext('2d'); x.fillStyle = '#111'; x.fillRect(0, 0, c.width, c.height);
    times.forEach((t, k) => {
      render(t);
      const cx = (k % cols) * w, cy = Math.floor(k / cols) * (h + 22);
      x.drawImage(E.out, cx, cy, w, h);
      const s = SCENES[sceneAt(t)];
      x.fillStyle = '#fff'; x.font = '14px monospace'; x.fillText(`${t.toFixed(2)}s  ${s.id}  ${s.tech || ''}`.slice(0, Math.floor(w / 8.5)), cx + 4, cy + h + 16);
    });
    return c.toDataURL('image/jpeg', q);
  },
};

// ---------------- player ----------------
function player() {
  const song = document.getElementById('song'), scrub = document.getElementById('scrub'), info = document.getElementById('info');
  const play = document.getElementById('play'), jump = document.getElementById('jump');
  scrub.max = DURATION;
  SCENES.forEach((s) => { const o = document.createElement('option'); o.value = s.start; o.textContent = `${s.id} ${s.start.toFixed(2)} ${s.title || ''}`; jump.appendChild(o); });
  let t = parseFloat(q.get('t') || '0');
  if (q.get('scene')) { const s = SCENES.find((x) => x.id === q.get('scene')); if (s) t = s.start; }
  let playing = false, last = -1;
  const show = () => {
    const f = Math.round(t * FPS);
    if (f !== last) { render(t); last = f; }
    const s = SCENES[sceneAt(t)];
    scrub.value = t; info.textContent = `${t.toFixed(2)}s · f${f} · ${s.id} ${s.tech || ''}`;
  };
  const loop = () => { if (playing) { t = song.currentTime; show(); requestAnimationFrame(loop); } };
  const toggle = () => { playing = !playing; play.textContent = playing ? '❚❚ pause' : '▶ play'; if (playing) { song.currentTime = t; song.play(); loop(); } else song.pause(); };
  const seek = (v) => { t = Math.max(0, Math.min(DURATION - 1 / FPS, v)); if (playing) song.currentTime = t; show(); };
  play.onclick = toggle; scrub.oninput = () => seek(parseFloat(scrub.value)); jump.onchange = () => seek(parseFloat(jump.value) + 0.001);
  addEventListener('keydown', (e) => {
    if (e.code === 'Space') { e.preventDefault(); toggle(); }
    if (e.code === 'ArrowRight') seek(t + (e.shiftKey ? 1 : 1 / FPS));
    if (e.code === 'ArrowLeft') seek(t - (e.shiftKey ? 1 : 1 / FPS));
    if (e.key === ']') { const i = sceneAt(t); if (SCENES[i + 1]) seek(SCENES[i + 1].start + 0.001); }
    if (e.key === '[') { const i = sceneAt(t); seek(SCENES[Math.max(0, t - SCENES[i].start < 0.3 ? i - 1 : i)].start + 0.001); }
  });
  show();
}

boot().catch((e) => { console.error(e); document.getElementById('info').textContent = 'BOOT ERROR ' + e.message; window.OP.bootError = e.message; });
