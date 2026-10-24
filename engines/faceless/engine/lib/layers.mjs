// The two compositions that span the whole video: captions (with the CTA lockup)
// and the sprite (panel / full-screen / hidden, pose + mouth image per frame).

import { esc } from './markup.mjs';
import { clipAttrs } from './plan.mjs';

const T = x => (+x).toFixed(4);
const S = f => T(Math.max(0, (f - 0.5) / 30));
const LINE_TOP = 0.863 * 102; // Inter baseline offset at line-height 1

export function captionsHTML(edit) {
  const sceneById = Object.fromEntries(edit.scenes.map(s => [s.id, s]));
  const byScene = new Map();
  for (const g of edit.groups) { if (!byScene.has(g.scene)) byScene.set(g.scene, []); byScene.get(g.scene).push(g); }
  const js = [];
  let body = '';
  for (const [sid, groups] of byScene) {
    const sc = sceneById[sid];
    const mode = sc.dark ? 'dark' : sc.spriteMode === 'face' ? 'face' : sc.layout === 'reveal' ? 'title' : 'light';
    let inner = '';
    for (const g of groups) {
      const top = Math.round(sc.capBase - LINE_TOP);
      const words = g.items.map((it, n) => {
        const id = `${g.id}-w${n}`;
        const t = esc(it.text);
        const slices = it.kind === 'glitch' ? `<span class="gl-s gl-s1">${t}</span><span class="gl-s gl-s2">${t}</span><span class="gl-s gl-s3">${t}</span>` : '';
        js.push(`FX.word(tl, $('#${id}'), ${T(it.f / 30)}, '${it.kind}');`);
        return `<span class="cw ${it.cls}" id="${id}">${t}${slices}</span>`;
      }).join('');
      inner += `<div class="cg clip ${mode}" id="${g.id}" ${clipAttrs(g.f0, g.f1)} data-track-index="0" style="top:${top}px">${words}</div>\n`;
    }
    body += `<div class="cap-scene" id="cs-${sid}" style="position:absolute;inset:0;transform-origin:540px 960px">${inner}</div>\n`;
    if (sc.dark) js.push(`FX.settle(tl, $('#cs-${sid}'), ${T(sc.t0)});`);
  }
  if (edit.cta) {
    const c = edit.cta;
    const start = c.f / 30, dur = edit.duration - start;
    body += `<div class="cta clip" id="cta" ${clipAttrs(c.f, edit.frames)} data-track-index="1">
      <span class="verb" id="cta-verb">${esc(c.verb)}</span><div class="glow" id="cta-glow"></div><span class="kw" id="cta-kw">“${esc(c.keyword)}”</span></div>\n`;
    js.push(`FX.ctaLockup(tl, $('#cta-verb'), $('#cta-kw'), $('#cta-glow'), ${T(start)});`);
  }
  return `<template>
  <style>#root { position: absolute; inset: 0; }</style>
  <div id="root" data-composition-id="captions" data-width="1080" data-height="1920">
    <div class="fx-scene" data-layout-allow-overflow data-layout-allow-overlap>
${body}    </div>
  </div>
  <script>
    (function () {
      var $ = FX.$;
      var root = document.querySelector('[data-composition-id="captions"]');
      FX.ready(root, function () {
        var tl = gsap.timeline({ paused: true });
        ${js.join('\n        ')}
        window.__timelines = window.__timelines || {};
        window.__timelines["captions"] = tl;
      });
    })();
  </script>
</template>
`;
}

// Rig framing: the 1254 px sprite canvas scaled and placed per mode (head top / centre from sprite.json).
// Panel: head a third of the width so pointing hands stay in frame, head popping
// 290 px above the panel. Full screen: head ~73% of the width, hair at 6% of the height.
export function rigFor(mode, sprite) {
  const fig = sprite.figure || {};
  const headW = fig.headWidth || 300, headTop = fig.headTop ?? 88;
  const headX = fig.headCenterX ?? 590, bodyX = fig.centerX ?? 627;
  if (mode === 'face') { const s = (0.725 * 1080) / headW; return { scale: +s.toFixed(4), x: Math.round(540 - headX * s), y: Math.round(115 - headTop * s) }; }
  const s = (0.334 * 1080) / headW, ax = (headX + bodyX) / 2;
  return { scale: +s.toFixed(4), x: Math.round(540 - ax * s), y: Math.round(1117 - headTop * s) };
}

export function spriteHTML(edit, roomPanel, roomFace) {
  const frames = edit.frames, D = edit.duration;
  const used = [...new Set(edit.spriteFrames.filter(Boolean))];
  const imgs = used.map(k => `<img class="clip" id="sp-${k}" src="assets/sprite/${k}.png" alt="" data-start="0" data-duration="${T(D)}" data-track-index="0"${edit.spriteFrames[0] === k ? ' style="opacity:1"' : ''}>`).join('\n        ');
  const js = [];
  // Image swaps only where the frame's image changes.
  let prev = edit.spriteFrames[0];
  for (let f = 1; f < frames; f++) {
    const cur = edit.spriteFrames[f];
    if (cur === prev) continue;
    if (prev) js.push(`tl.set('#sp-${prev}', { opacity: 0 }, ${S(f)});`);
    if (cur) js.push(`tl.set('#sp-${cur}', { opacity: 1 }, ${S(f)});`);
    prev = cur;
  }
  // Mode per scene: panel, full-screen or hidden.
  const first = edit.scenes[0];
  const r0 = rigFor(first.spriteMode, edit.sprite);
  js.unshift(`tl.set('#sp-rig', { x: ${r0.x}, y: ${r0.y}, scale: ${r0.scale}, transformOrigin: '0px 0px' }, 0);`);
  for (const s of edit.scenes) {
    const r = rigFor(s.spriteMode, edit.sprite);
    const at = s.k === 0 ? 0 : S(s.f0);
    if (s.k === 0) continue;
    js.push(`tl.set('#sp-panel', { opacity: ${s.spriteMode === 'panel' ? 1 : 0} }, ${at});`);
    js.push(`tl.set('#sp-face', { opacity: ${s.spriteMode === 'face' ? 1 : 0} }, ${at});`);
    js.push(`tl.set('#sp-rig', { x: ${r.x}, y: ${r.y}, scale: ${r.scale} }, ${at});`);
  }
  // Idle life: a one-art-pixel stepped breath every 0.8 s, like a handheld game sprite.
  const reps = Math.max(0, Math.floor(D / 0.8) - 1);
  js.push(`tl.fromTo('#sp-wrap', { y: 0 }, { y: -12, duration: 0.8, ease: 'steps(1)', yoyo: true, repeat: ${reps} }, 0.4);`);

  return `<template>
  <style>
    #root { position: absolute; inset: 0; }
    #sp-panel { opacity: ${first.spriteMode === 'panel' ? 1 : 0}; }
    #sp-face { opacity: ${first.spriteMode === 'face' ? 1 : 0}; }
    .room svg { width: 100%; height: 100%; display: block; filter: blur(2.5px); }
  </style>
  <div id="root" data-composition-id="sprite" data-width="1080" data-height="1920">
    <div class="fx-scene" data-layout-allow-overflow data-layout-allow-overlap>
      <div class="facebg" id="sp-face" style="background:${roomFace.color}"><div class="room">${roomFace.svg}</div></div>
      <div class="panel" id="sp-panel" style="background:${roomPanel.color}"><div class="room">${roomPanel.svg}</div></div>
      <div id="sp-wrap" style="position:absolute;inset:0">
        <div class="rig" id="sp-rig">
        ${imgs}
        </div>
      </div>
    </div>
  </div>
  <script>
    (function () {
      var tl = gsap.timeline({ paused: true });
      ${js.join('\n      ')}
      window.__timelines = window.__timelines || {};
      window.__timelines["sprite"] = tl;
    })();
  </script>
</template>
`;
}
