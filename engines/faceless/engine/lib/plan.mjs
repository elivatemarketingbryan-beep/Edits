// Turns plan.json (what Claude decides) plus words.json / mouth.json / sprite.json
// (what the voiceover and sprite give us) into a fully timed, frame-exact edit.
// Every choice Claude leaves out is filled by the reference's editing rules
// (style/STYLE_BIBLE.md), varied per video by a seed so no two videos repeat.

import fs from 'node:fs';
import path from 'node:path';
import { ROOT, readJSON } from './tools.mjs';
import { rng } from './audio.mjs';
import { rigFor } from './layers.mjs';

export const FPS = 30;
export const LAYOUTS = ['hook', 'split', 'proof', 'reveal', 'compare', 'face', 'cta'];
const DARK = new Set(['proof', 'compare']);
const SPRITE_MODE = { hook: 'panel', split: 'panel', face: 'face', cta: 'face', proof: 'hidden', reveal: 'hidden', compare: 'hidden' };
const CAPTION_BASE = { hook: 1078, split: 1071, proof: 1478, reveal: 1239, compare: 1495, face: 1377, cta: 1377 };
const DARK_BGS = ['charcoal', 'graphite', 'wine', 'warm', 'onyx'];
const ROOMS = ['sage', 'cream', 'blue', 'mint', 'studio', 'blush'];
const FILLERS = new Set(['um', 'uh', 'erm', 'hmm']);
const BEATS = ['highlight', 'ring', 'click', 'counter', 'zoom', 'scroll', 'swipe', 'swap', 'type', 'cursor'];

export class PlanError extends Error {}

const frameOf = t => Math.round(t * FPS);

// Clip windows are [start, start + duration). Rounding a start up by even 0.00003 s
// pushes it past its frame, so times are floored onto the frame grid.
const floorT = f => Math.floor((f / FPS) * 1e5) / 1e5;
export function clipAttrs(f0, f1) {
  return `data-start="${floorT(f0).toFixed(5)}" data-duration="${(floorT(f1) - floorT(f0)).toFixed(5)}"`;
}
const skip0 = cap => (cap.skip || []).map(Number).includes(0);

export function loadPlan(videoDir) {
  const words = readJSON(path.join(videoDir, 'words.json'), null);
  const mouth = readJSON(path.join(videoDir, 'mouth.json'), null);
  const plan = readJSON(path.join(videoDir, 'plan.json'), null);
  const sprite = readJSON(path.join(ROOT, 'sprite', 'sprite.json'), null);
  const brand = readJSON(path.join(ROOT, 'brand.json'), {});
  if (!words) throw new PlanError('words.json missing: run the "new" step first.');
  if (!plan) throw new PlanError('plan.json missing: write the plan first (see engine/docs/planning.md).');
  if (!sprite) throw new PlanError('sprite/sprite.json missing: prepare the sprite first.');
  return normalize({ plan, words, mouth, sprite, brand, videoDir });
}

function normalize({ plan, words: W, mouth, sprite, brand, videoDir }) {
  const errors = [];
  const words = W.words.map(w => ({ ...w, f: frameOf(w.s), fe: frameOf(w.e) }));
  const N = words.length;
  const duration = Math.max(W.duration, (words.at(-1)?.e ?? 0) + 0.4);
  const frames = Math.round(duration * FPS);
  const seed = String(plan.seed ?? words.map(w => w.w).join(' ').slice(0, 200));
  const R = rng(seed);
  const pick = (arr, avoid) => { const opts = arr.filter(x => x !== avoid); return opts[Math.floor(R() * opts.length)]; };
  const wordAt = i => {
    if (!Number.isInteger(i) || i < 0 || i >= N) { errors.push(`word index ${i} is out of range 0-${N - 1}`); return words[Math.max(0, Math.min(N - 1, i | 0))]; }
    return words[i];
  };

  // ---------- scenes ----------
  const rawScenes = Array.isArray(plan.scenes) ? plan.scenes : [];
  if (!rawScenes.length) errors.push('plan.scenes is empty');
  rawScenes.forEach((s, k) => {
    if (!LAYOUTS.includes(s.layout)) errors.push(`scene ${k + 1}: layout "${s.layout}" must be one of ${LAYOUTS.join(', ')}`);
    if (typeof s.at !== 'number') errors.push(`scene ${k + 1}: "at" (index of its first word) is required`);
    if (k === 0 && s.at !== 0) errors.push('scene 1 must start at word 0');
    if (k > 0 && s.at <= rawScenes[k - 1].at) errors.push(`scene ${k + 1}: "at" must be after the previous scene's`);
    if (['hook', 'split', 'proof', 'reveal'].includes(s.layout) && !s.card) errors.push(`scene ${k + 1} (${s.layout}) needs a "card"`);
    if (s.layout === 'compare' && (!Array.isArray(s.cards) || s.cards.length !== 2)) errors.push(`scene ${k + 1} (compare) needs "cards": [top, bottom]`);
    if (s.layout === 'hook' && !(Array.isArray(s.headline) && s.headline.length === 2)) errors.push(`scene ${k + 1} (hook) needs "headline": ["line one", "boxed payoff"]`);
    if (s.layout === 'reveal' && !s.label) errors.push(`scene ${k + 1} (reveal) needs a "label" like "It's Called"`);
    for (const b of s.beats || []) {
      if (!BEATS.includes(b.fx)) errors.push(`scene ${k + 1}: beat fx "${b.fx}" must be one of ${BEATS.join(', ')}`);
      if (typeof b.at !== 'number') errors.push(`scene ${k + 1}: every beat needs "at" (word index)`);
    }
  });
  if (errors.length) throw new PlanError(errors.join('\n'));

  let lastDark = brand.darkBg, lastLight = null;
  const scenes = rawScenes.map((s, k) => {
    const first = wordAt(s.at);
    // Cuts land on the first word's onset (0-1 frame early), like the reference.
    const f0 = k === 0 ? 0 : Math.max(1, first.f - 1);
    const dark = DARK.has(s.layout);
    let bg = s.bg;
    if (!bg) bg = dark ? (lastDark = pick(DARK_BGS, lastDark)) : s.layout === 'reveal' ? 'white' : 'light';
    return { ...s, k, id: `s${k + 1}`, f0, dark, bg, spriteMode: SPRITE_MODE[s.layout], capBase: CAPTION_BASE[s.layout], beats: [] , rawBeats: s.beats || [] };
  });
  scenes.forEach((s, k) => {
    s.f1 = k < scenes.length - 1 ? scenes[k + 1].f0 : frames; s.t0 = s.f0 / FPS; s.t1 = s.f1 / FPS; s.dur = (s.f1 - s.f0) / FPS;
    // B-roll accelerates up and blurs out before a cut to the full-screen character.
    s.exitDrift = k < scenes.length - 1 && scenes[k + 1].spriteMode === 'face' && s.layout !== 'face' && s.layout !== 'compare';
  });
  const sceneOfFrame = f => scenes.findLast(s => s.f0 <= f) || scenes[0];
  const sceneOfWord = i => scenes.findLast(s => s.at <= i) || scenes[0];

  // ---------- beats -> scene-local times ----------
  for (const s of scenes) {
    for (const b of s.rawBeats) {
      const w = wordAt(b.at);
      const local = w.s - s.t0;
      s.beats.push({ ...b, word: w, t: Math.max(0.05, local) });
    }
    s.beats.sort((a, b) => a.t - b.t);
  }

  // ---------- captions ----------
  const cap = plan.captions || {};
  const asSet = a => new Set((a || []).map(Number));
  const accent = asSet(cap.accent), verb = asSet(cap.verb), glitch = asSet(cap.glitch), stretch = asSet(cap.stretch);
  // The video's first caption word always glitches in (unless it's accented).
  if (cap.firstGlitch !== false && !accent.has(0) && !skip0(cap)) glitch.add(0);
  const skip = asSet(cap.skip), breakBefore = asSet(cap.breakBefore), keepCase = asSet(cap.keepCase);
  const cta = plan.cta ? { ...plan.cta } : null;
  if (cta) {
    if (typeof cta.at !== 'number') throw new PlanError('cta.at (word index of the CTA verb, e.g. "comment") is required');
    cta.keyword = String(cta.keyword || '').trim();
    cta.verb = String(cta.verb || words[cta.at].w).toLowerCase();
    if (!cta.keyword) throw new PlanError('cta.keyword is required, e.g. "Claude"');
  }
  const sentenceStart = new Set([0]);
  words.forEach((w, i) => { if ('.!?'.includes(w.p) && w.p && i + 1 < N) sentenceStart.add(i + 1); });

  // captions.text fixes what the transcriber misheard: { "39": "ScrapeGraphAI", "40": "" }.
  // A replacement is shown exactly as written; "" hides that word (for split-up names).
  const fix = cap.text || {};
  for (const [k, v] of Object.entries(fix)) {
    const i = Number(k);
    if (!Number.isInteger(i) || i < 0 || i >= N) throw new PlanError(`captions.text: word index ${k} is out of range 0-${N - 1}`);
    if (String(v).trim() === '') skip.add(i);
  }
  const display = words.map((w, i) => {
    if (fix[i] != null && String(fix[i]).trim() !== '') return String(fix[i]).trim();
    let t = w.w.replace(/[“”"]/g, '');
    const proper = /^[A-Z]/.test(t) && !sentenceStart.has(i) && t !== 'I';
    if (!(keepCase.has(i) || glitch.has(i) || proper || /^I('|$)/.test(t) || /^[A-Z0-9]{2,}$/.test(t))) t = t.toLowerCase();
    return t;
  });
  const isNum = i => /\d/.test(words[i].w);

  const styleOf = (i, layout) => {
    if (glitch.has(i)) return { kind: 'glitch', cls: '' };
    if (verb.has(i)) return { kind: 'stretch', cls: 'verb' };
    if (isNum(i)) return { kind: 'stretch', cls: 'num' };
    if (accent.has(i)) return { kind: 'accent', cls: 'serif' + (cap.white?.includes?.(i) ? ' white' : '') };
    if (stretch.has(i)) return { kind: 'stretch', cls: '' };
    if (layout === 'face' || layout === 'cta') return { kind: 'ghost', cls: '' };
    if (layout === 'reveal') return { kind: 'title', cls: '' };
    return { kind: 'std', cls: '' };
  };

  const MAXW = 720;
  const widthOf = (i, cls) => display[i].length * (cls.includes('serif') ? 41 : 52) + 4;
  const groups = [];
  let g = null;
  const close = () => { if (g && g.words.length) groups.push(g); g = null; };
  const ctaStart = cta ? cta.at : Infinity;
  for (let i = 0; i < Math.min(N, ctaStart); i++) {
    if (skip.has(i) || FILLERS.has(words[i].w.toLowerCase())) continue;
    const sc = sceneOfWord(i);
    const st = styleOf(i, sc.layout);
    const w = widthOf(i, st.cls);
    const prev = g && g.words.at(-1);
    const emphatic = st.kind === 'glitch' || st.cls.includes('verb');
    const long = display[i].length >= 9 && !st.cls.includes('serif');
    const prevPunct = prev != null && /[,.!?;:]/.test(words[prev].p);
    const gap = prev != null ? words[i].s - words[prev].e : 0;
    const prevStyle = prev != null ? styleOf(prev, sc.layout) : null;
    const prevWasEmph = prevStyle && (prevStyle.kind === 'glitch' || prevStyle.cls.includes('verb') || (prevStyle.cls.includes('serif') && !st.cls.includes('serif')));
    const newGroup = !g || g.scene !== sc.id || prevPunct || gap > 0.28 || breakBefore.has(i) || emphatic || g.emph ||
      long || g.long || g.words.length >= 3 || g.width + 27 + w > MAXW || (prevWasEmph && sc.layout !== 'reveal');
    if (newGroup) { close(); g = { scene: sc.id, words: [], width: -27, layout: sc.layout }; }
    g.words.push(i); g.width += 27 + w;
    if (emphatic) g.emph = true;
    if (long && g.words.length === 1) g.long = true;
  }
  close();
  // A word is fully visible from its onset frame (its entrance starts one frame earlier).
  // In the CTA scene everything is front-loaded by 8 frames so it's read before it's heard.
  groups.forEach((gr, k) => {
    gr.id = `g${k + 1}`;
    const sc = sceneOfWord(gr.words[0]);
    const lead = sc.layout === 'cta' ? 8 : 0;
    const on = i => Math.max(sc.f0 + 1, words[i].f - lead);
    gr.f0 = Math.max(sc.f0, on(gr.words[0]) - 1);
    gr.items = gr.words.map(i => ({ i, text: display[i], ...styleOf(i, gr.layout), f: on(i) }));
  });
  groups.forEach((gr, k) => {
    const sc = scenes.find(s => s.id === gr.scene);
    const next = groups[k + 1];
    let end = next && next.scene === gr.scene ? next.f0 : sc.f1;
    if (cta && sc.layout === 'cta' && (!next || next.scene !== gr.scene)) end = Math.min(end, Math.max(gr.f0 + 6, frameOf(words[cta.at].s) - 9));
    // One blank frame before a group that starts a new sentence or follows a pause,
    // except when it enters with a glitch or stretch (those replace directly).
    if (next && next.scene === gr.scene) {
      const gap = words[next.words[0]].s - words[gr.words.at(-1)].e;
      const special = ['glitch', 'stretch'].includes(next.items[0].kind);
      if (!special && (gap >= 0.04 || sentenceStart.has(next.words[0]))) end -= 1;
    }
    gr.f1 = Math.max(gr.f0 + 3, end);
  });

  if (cta) {
    const vw = words[cta.at];
    cta.f = Math.max(sceneOfWord(cta.at).f0 + 1, vw.f - 9); // front-loaded so the instruction is read before it is heard
    const ctaScene = sceneOfWord(cta.at);
    if (ctaScene.layout !== 'cta') throw new PlanError(`cta.at falls in a "${ctaScene.layout}" scene; the CTA must sit in the last scene with layout "cta"`);
  }

  // ---------- sprite poses ----------
  const spriteFrames = buildPoses({ scenes, words, groups, mouth, sprite, plan, cta, frames, R, sceneOfFrame, wordAt });

  // ---------- sound design ----------
  const sfx = buildSfx({ scenes, frames, cta, R });

  const room = plan.room || brand.room || ROOMS[Math.floor(R() * ROOMS.length)];
  const accentColor = plan.accent || brand.accent || null;

  return { brand, seed, fps: FPS, frames, duration: frames / FPS, voiceDuration: W.duration, words, display, scenes, groups, cta, sprite, mouth, spriteFrames, sfx, room, accentColor, videoDir, title: plan.title || '' };
}

// Pose per frame, then the exact image (pose + mouth shape) per frame.
function buildPoses({ scenes, words, groups, mouth, sprite, plan, cta, frames, R, sceneOfFrame, wordAt }) {
  const has = (p, s) => !!sprite.poses?.[p]?.[s];
  const talking = new Set(sprite.talking || ['idle']);
  const pose = new Array(frames).fill('idle');
  const surprised = [];
  const hold = new Array(frames).fill(false);
  const set = (f0, f1, p, lock) => { if (!talking.has(p) && !has(p, 'neutral')) return; for (let f = Math.max(0, f0); f < Math.min(frames, f1); f++) if (!hold[f] || lock) { pose[f] = p; if (lock) hold[f] = true; } };
  let side = R() < 0.5 ? 'left' : 'right';
  const flip = () => (side = side === 'left' ? 'right' : 'left');

  // Manual overrides first (they win).
  const manual = (plan.poses || []).map(p => ({ f: wordAt(p.at).f - 1, pose: p.pose })).sort((a, b) => a.f - b.f);
  manual.forEach((m, k) => set(m.f, k + 1 < manual.length ? manual[k + 1].f : m.f + 45, m.pose, true));

  // Gesture requests, then a greedy pass: higher priority wins, and every gesture is
  // followed by at least 8 frames of plain talking so the character never looks frozen
  // in a pose (the reference gestures on beats and returns to idle).
  const req = [];
  const ask = (f0, len, p, pri) => req.push({ f0: Math.max(0, f0), f1: Math.min(frames, f0 + len), p, pri });
  for (const s of scenes) {
    if (s.spriteMode === 'hidden') continue;
    if (s.k === 0) ask(1, 9, 'wave', 3);
    for (const b of s.beats) {
      const f = b.word.f - 2;
      if (['highlight', 'ring', 'click', 'zoom', 'cursor'].includes(b.fx)) ask(f, 24, 'point-*', 2);
      else if (b.fx === 'counter') { ask(f, 14, 'present-*', 2); surprised.push([f + 14, f + 22]); }
      else if (['swipe', 'swap', 'scroll'].includes(b.fx)) ask(f, 20, 'present-*', 2);
    }
  }
  for (const gr of groups) {
    const sc = scenes.find(s => s.id === gr.scene);
    if (sc.spriteMode === 'hidden') continue;
    const head = gr.items[0];
    const r = R();
    const len = Math.min(30, Math.max(14, gr.f1 - head.f));
    if (gr.words.some(i => words[i].p === '?' || /^(how|why|what|tweak|imagine)$/i.test(words[i].w))) ask(head.f, len, 'thinking', 1);
    else if (gr.items.some(it => it.cls.includes('serif')) && r < 0.55) ask(head.f, len, 'present-*', 1);
    else if (gr.items.some(it => it.kind === 'glitch') && r < 0.5) ask(head.f, 18, 'point-*', 1);
    else if ('.!'.includes(words[gr.words.at(-1)].p || 'x') && r < 0.18) ask(head.f, len, 'arms-crossed', 0);
  }
  if (cta) ask(cta.f + 9, 45, `point-${R() < 0.5 ? 'left' : 'right'}`, 3);
  req.sort((a, b) => b.pri - a.pri || a.f0 - b.f0);
  const busy = new Uint8Array(frames);
  for (const q of req) {
    let clash = false;
    for (let f = Math.max(0, q.f0 - 8); f < Math.min(frames, q.f1 + 8); f++) if (busy[f]) { clash = true; break; }
    if (clash) continue;
    for (let f = q.f0; f < q.f1; f++) busy[f] = 1;
    q.placed = true;
  }
  // Sides alternate in time order among the gestures that were actually placed.
  for (const q of req.filter(q => q.placed).sort((a, b) => a.f0 - b.f0)) set(q.f0, q.f1, q.p.replace('*', flip()));


  // In the panel framing a gesture whose hand would leave the frame falls back to one that fits.
  const panel = rigFor('panel', sprite);
  const fits = p => { const r = sprite.reach?.[`${p}-neutral`]; if (!r) return true; return panel.x + r[0] * panel.scale > -30 && panel.x + r[1] * panel.scale < 1110; };
  const fallback = p => fits(p) ? p : p.startsWith('point-') && fits(p.replace('point', 'present')) ? p.replace('point', 'present') : 'idle';

  // Shapes: idle has small/talk/wide; gestures have neutral/talk.
  const track = mouth?.track || '';
  const out = new Array(frames);
  for (let f = 0; f < frames; f++) {
    const sc = sceneOfFrame(f);
    if (sc.spriteMode === 'hidden') { out[f] = null; continue; }
    let p = pose[f];
    if (!has(p, 'neutral')) p = 'idle';
    if (sc.spriteMode === 'panel') p = fallback(p);
    const m = Number(track[f] || 0);
    let state;
    if (p === 'idle') state = m === 0 ? 'neutral' : m === 1 ? (has('idle', 'talk-small') ? 'talk-small' : 'talk') : m === 3 ? (has('idle', 'talk-wide') ? 'talk-wide' : 'talk') : 'talk';
    else state = m === 0 || !has(p, 'talk') ? 'neutral' : 'talk';
    out[f] = `${p}-${state}`;
  }
  // Reaction face as a number lands, and the hook opens on a smile at frame 0.
  if (has('idle', 'surprised')) for (const [a, b] of surprised) for (let f = a; f < Math.min(b, frames); f++) if (out[f]?.startsWith('idle-')) out[f] = 'idle-surprised';
  if (has('idle', 'smile') && out[0]) out[0] = 'idle-smile';
  // Closed-mouth smiles in real pauses (not the 1-2 frame gaps between syllables).
  if (has('idle', 'smile')) {
    let run = 0;
    for (let f = 0; f <= frames; f++) {
      const closed = f < frames && out[f] === 'idle-neutral';
      if (closed) { run++; continue; }
      if (run >= 9) for (let k = f - run + 3; k < f - 1; k++) out[k] = 'idle-smile';
      run = 0;
    }
  }
  return out;
}

// Sound placement, following the reference's rules (STYLE_BIBLE section 8).
function buildSfx({ scenes, frames, cta, R }) {
  const out = [];
  const take = name => `${name}-${1 + Math.floor(R() * (name === 'tick' ? 2 : 3))}`;
  const add = (name, f, gain = 1) => out.push({ file: `${take(name)}.wav`, f: Math.max(0, Math.round(f)), gain });
  const RISER = 19; // a riser starts 19 frames before the cut and stops dead on it
  add('riser', 0); add('whoosh', 0);
  scenes.forEach((s, k) => {
    if (k === 0) return;
    const prev = scenes[k - 1];
    const toDark = s.dark, toWhite = s.layout === 'reveal', toFace = s.spriteMode === 'face';
    if (prev.layout !== s.layout || toDark) {
      if (!(s.layout === 'split' && prev.layout === 'reveal')) add('riser', s.f0 - RISER, toFace && k === scenes.length - 1 ? 1.41 : 1);
    }
    if (toDark) add('swell', s.f0);
    if (toWhite) add('whoosh', s.f0 + 4);
    for (const b of s.beats) {
      const f = s.f0 + Math.round(b.t * 30);
      if (['zoom', 'scroll', 'swipe'].includes(b.fx)) add('swell', f - 4);
      if (b.fx === 'counter') add('whoosh', f);
    }
  });
  if (cta) add('tick', cta.f + 10);
  add('riser', frames - RISER - 1, 1.41);
  // Keep them sparse: drop anything starting within 0.5 s of an earlier effect (except the opening pair).
  out.sort((a, b) => a.f - b.f);
  const kept = [];
  for (const e of out) {
    const lastSame = kept.findLast(k => k.file.split('-')[0] === e.file.split('-')[0]);
    if (e.f > 0 && lastSame && e.f - lastSame.f < 15) continue;
    if (e.f >= frames) continue;
    kept.push(e);
  }
  return kept;
}

export function describe(edit) {
  const lines = [`${edit.duration.toFixed(2)} s, ${edit.scenes.length} scenes, ${edit.groups.length} caption groups, ${edit.sfx.length} sound effects, room "${edit.room}"`];
  for (const s of edit.scenes) lines.push(`  ${s.id} ${s.layout.padEnd(7)} ${s.t0.toFixed(2)}-${s.t1.toFixed(2)}s bg=${s.bg} beats=${s.beats.map(b => b.fx).join(',') || '-'}`);
  return lines.join('\n');
}
