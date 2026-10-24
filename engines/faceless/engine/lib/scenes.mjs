// One HyperFrames sub-composition per scene: background, card(s), headline and
// every beat, as static HTML plus a timeline script that calls the FX runtime.

import { esc } from './markup.mjs';

const CURSOR_SVG = '<path d="M2 2 L2 33 L9.5 25.5 L15 38.5 L20.5 36 L15.2 23.4 L26 23.4 Z" fill="#000" stroke="#fff" stroke-width="2.4" stroke-linejoin="round"/>';

// Card boxes per layout (1080x1920), measured on the reference and scaled x1.5.
export const CARD_BOX = {
  hook: { x: 117, y: 475, w: 846, h: 483 },
  split: { x: 69, y: 240, w: 941, h: 695 },
  proof: { x: 69, y: 240, w: 941, h: 1063 },
  reveal: { x: 117, y: 420, w: 845, h: 678 },
  compareTop: { x: 189, y: 240, w: 701, h: 525 },
  compareBottom: { x: 189, y: 789, w: 701, h: 525 },
};
const CHROME_H = 68;

let renderPage = null;
export async function loadPages(accent) {
  if (renderPage) return renderPage;
  try { const m = await import('./pages.mjs'); renderPage = m.renderPage; m.setHouseAccent?.(accent); } catch (e) {
    if (e.code !== 'ERR_MODULE_NOT_FOUND') throw e;
    renderPage = (spec, ctx) => ({ html: `<div class="pg" style="min-height:${ctx.height}px;padding:40px;font:600 36px/1.4 Inter">${esc(spec.text || spec.kind)}</div>`, keys: [], contentHeight: ctx.height, bgImage: null });
  }
  return renderPage;
}

function urlFor(spec) {
  const u = spec.url || (spec.page && spec.page.url) || '';
  if (!u) return '';
  const clean = String(u).replace(/^https?:\/\//, '');
  const [host, ...rest] = clean.split('/');
  return `<b>${esc(host)}</b>${rest.length ? `<i>/${esc(rest.join('/'))}</i>` : ''}`;
}

// Built posts default to the creator's own name and handle from brand.json.
function withBrand(page, brand) {
  if (!brand || page.kind !== 'post') return page;
  return { ...page, name: page.name || brand.name, handle: page.handle || brand.handle };
}

// A card is { url?, chrome?: false, label?, ...page spec (kind + fields) }.
function cardHTML(id, spec, box, opts, pages) {
  const page = withBrand(spec.page || spec, opts.brand);
  const bareTop = spec.chrome === false && opts.label ? 78 : 0;
  const ctx = { id, width: box.w, height: box.h - (spec.chrome === false ? bareTop : CHROME_H), dark: !!opts.dark, root: opts.root };
  const r = renderPage(page, ctx);
  const bare = spec.chrome === false;
  const cls = ['card', opts.dark ? 'on-dark' : opts.white ? 'on-white' : '', bare ? 'bare' : ''].filter(Boolean).join(' ');
  // A labelled card (before/after) shows its pill in the title bar instead of the address.
  const pill = opts.label ? `<div class="card-label${opts.labelOurs ? ' ours' : ''}${bare ? '' : ' in-bar'}" id="${id}-label">${esc(opts.label)}</div>` : '';
  const chrome = bare ? '' : `<div class="chrome" data-layout-ignore><span class="tl tl1"></span><span class="tl tl2"></span><span class="tl tl3"></span><span class="ic side"></span><span class="chev"></span>
      ${opts.label ? pill : `<div class="url"><span class="lock"></span>${urlFor(spec) || '<b>&nbsp;</b>'}</div>`}<span class="rt r1"></span><span class="rt r2"></span><span class="rt r3"></span></div>`;
  const per = 2 * (box.w + box.h) - (8 - 2 * Math.PI) * 22;
  pages.push({ id, keys: new Set(r.keys || []), contentHeight: r.contentHeight || ctx.height, viewportH: ctx.height, bgImage: r.bgImage });
  return {
    html: `<div class="${cls}" id="${id}" style="left:${box.x}px;top:${box.y}px;width:${box.w}px;height:${box.h}px">
    ${chrome}
    <div class="vp" id="${id}-vp"${bareTop ? ` style="top:${bareTop}px"` : ''}><div class="page" id="${id}-page">${r.html}${opts.extra || ''}</div>${opts.swapPages || ''}</div>
    ${opts.label && bare ? pill : ''}
    ${opts.tint ? `<div class="tint" id="${id}-tint"></div>` : ''}
    <div class="inner-hl"></div>
    ${opts.label ? '' : `<svg class="beam" width="${box.w + 8}" height="${box.h + 8}" viewBox="0 0 ${box.w + 8} ${box.h + 8}"><rect id="${id}-beam" x="2.5" y="2.5" width="${box.w + 3}" height="${box.h + 3}" rx="23" ry="23"/></svg>`}
  </div>`,
    perimeter: per,
    bgImage: r.bgImage,
  };
}

function backgroundHTML(s, bgImage, edit) {
  if (s.bg === 'light' || s.bg === 'white') return `<div class="bg bg-${s.bg}"></div><div class="dots" id="${s.id}-dots"></div>`;
  const photo = bgImage && !s.noPhotoBg ? `<div class="bg bg-photo" style="background-image:url('${esc(bgImage)}')"></div>` : '';
  return `<div class="bg bg-${s.bg}"></div>${photo}<div class="dots on-dark" id="${s.id}-dots"></div><div class="bg-vignette"></div>`;
}

const keyOf = target => (typeof target === 'string' ? target : '');

// Builds one scene file. Returns { html, errors }.
export function sceneHTML(s, edit) {
  const errors = [];
  const pages = [];
  const js = [];
  const T = x => (+x).toFixed(4);
  let body = '';
  let bgImage = null;

  // Which beats need which overlay elements, per card.
  const ringIds = [], popIds = [];
  const overlaysFor = (cardId, beats) => {
    let extra = '';
    if (beats.some(b => b.fx === 'click' || b.fx === 'cursor')) extra += `<svg class="fx-cursor" id="${cardId}-cur" viewBox="0 0 28 41">${CURSOR_SVG}</svg>`;
    beats.forEach((b, n) => {
      if (['ring', 'click', 'counter'].includes(b.fx) && b.target && b.ring !== false) { const id = `${cardId}-ring${n}`; ringIds.push(id); b._ring = id; extra += `<svg class="fx-ring" id="${id}"><rect/></svg>`; }
      if (b.fx === 'counter') {
        const id = `${cardId}-pop${n}`; popIds.push(id); b._pop = id;
        const val = String(b.value ?? '');
        const digits = val.split('');
        const nd = digits.filter(c => /\d/.test(c)).length;
        let di = 0;
        const cols = digits.map(c => {
          if (!/\d/.test(c)) return `<span class="odo-fix">${esc(c)}</span>`;
          const d = Number(c), spins = Math.max(0, nd - 1 - di++);
          return `<div class="odo-col" data-digit="${d}" data-spins="${spins}">${Array.from({ length: spins * 10 + d + 1 }, (_, k) => `<span>${k % 10}</span>`).join('')}</div>`;
        }).join('');
        extra += `<div class="pop" id="${id}"><div class="pop-bg"></div><div class="odo">${cols}</div>${b.label ? `<div class="lab">${esc(b.label)}</div>` : ''}</div>`;
      }
    });
    return extra;
  };

  // Split beats by which card/page they act on (swipes move later beats to the next card).
  const layout = s.layout;
  const swipes = s.beats.filter(b => b.fx === 'swipe');
  const chain = layout === 'compare' || !s.card ? [] : [s.card, ...swipes.map(b => b.card)];
  const beatsByCard = layout === 'compare' ? [s.beats, []] : chain.map(() => []);
  if (layout !== 'compare') {
    let ci = 0;
    for (const b of s.beats) { if (b.fx === 'swipe') { ci++; continue; } beatsByCard[ci].push(b); }
  }

  const box = CARD_BOX[layout] || null;
  const cards = [];
  if (box) {
    chain.forEach((spec, ci) => {
      if (!spec) { errors.push(`${s.id}: swipe beat needs a "card"`); return; }
      const id = ci === 0 ? `${s.id}-card` : `${s.id}-card${ci + 1}`;
      // Swap beats stack an alternate page in the same viewport.
      const swapB = beatsByCard[ci].filter(b => b.fx === 'swap');
      const swapPages = swapB.map((b, n) => {
        const sid = `${id}-alt${n + 1}`;
        const r = renderPage(b.card?.page || b.card || {}, { id: sid, width: box.w, height: box.h - CHROME_H, dark: s.dark, root: edit.videoDir });
        b._from = n === 0 ? `${id}-page` : `${id}-alt${n}-page`; b._to = `${sid}-page`;
        return `<div class="page" id="${sid}-page" style="opacity:0">${r.html}</div>`;
      }).join('');
      const c = cardHTML(id, spec, box, { root: edit.videoDir, brand: edit.brand, dark: s.dark, white: s.bg === 'white', extra: overlaysFor(id, beatsByCard[ci]), swapPages }, pages);
      cards.push({ id, ...c, beats: beatsByCard[ci] });
      if (!bgImage && c.bgImage) bgImage = c.bgImage;
    });
  } else if (layout === 'compare') {
    const [top, bottom] = s.cards;
    [[top, CARD_BOX.compareTop, 'top'], [bottom, CARD_BOX.compareBottom, 'bottom']].forEach(([spec, bx, pos], ci) => {
      const id = `${s.id}-${pos}`;
      const bs = s.beats.filter(b => (b.card === pos) || (!b.card && pos === 'bottom' && b.fx !== 'swap') || (b.fx === 'swap'));
      const swapPages = bs.filter(b => b.fx === 'swap').map((b, n) => {
        const spec2 = (b.cards || [])[ci];
        if (!spec2) return '';
        const sid = `${id}-alt${n + 1}`;
        const r = renderPage(spec2.page || spec2, { id: sid, width: bx.w, height: bx.h - (spec.chrome === false ? 78 : CHROME_H), dark: true, root: edit.videoDir });
        (b._pairs ||= []).push([n === 0 ? `${id}-page` : `${id}-alt${n}-page`, `${sid}-page`]);
        return `<div class="page" id="${sid}-page" style="opacity:0">${r.html}</div>`;
      }).join('');
      const label = spec.label || (pos === 'top' ? 'before' : 'after');
      const c = cardHTML(id, spec, bx, { root: edit.videoDir, brand: edit.brand, dark: true, label, labelOurs: pos === 'bottom', tint: true, extra: overlaysFor(id, bs.filter(b => b.fx !== 'swap')), swapPages }, pages);
      cards.push({ id, ...c, beats: bs.filter(b => b.fx !== 'swap') });
      if (!bgImage && c.bgImage) bgImage = c.bgImage;
    });
  }

  // Validate beat targets against the keys each page exposes.
  for (const c of cards) {
    const keys = pages.find(p => p.id === c.id)?.keys || new Set();
    for (const b of c.beats) {
      const k = keyOf(b.target);
      if (k && keys.size && !keys.has(k)) errors.push(`${s.id}: beat "${b.fx}" targets "${k}", but that card only has keys: ${[...keys].join(', ') || '(none)'}`);
    }
  }

  // ---- headline (hook) / label box (reveal) ----
  let head = '';
  if (layout === 'hook') {
    const [l1, l2] = s.headline;
    const w1 = String(l1).split(/\s+/).map((w, n) => `<span id="${s.id}-h${n}">${esc(w)}</span>`).join('');
    const w2 = String(l2).split(/\s+/).map((w, n) => `<span id="${s.id}-b${n}">${esc(w)}</span>`).join('');
    head = `<div class="headline" style="top:204px"><div class="head1">${w1}</div></div>
    <div class="headline" style="top:309px"><div class="hbox" id="${s.id}-box">${w2}</div></div>`;
  }
  if (layout === 'reveal') {
    const w2 = String(s.label).split(/\s+/).map((w, n) => `<span id="${s.id}-b${n}">${esc(w)}</span>`).join('');
    head = `<div class="headline" style="top:240px"><div class="hbox" id="${s.id}-box">${w2}</div></div>`;
  }

  body += `<div class="fx-stage" id="${s.id}-stage">${backgroundHTML(s, bgImage, edit)}${head}${cards.map(c => c.html).join('\n')}</div>`;

  // ---- timeline ----
  const D = s.dur;
  js.push(`FX.drift(tl, $('#${s.id}-dots'), 0, ${T(D)});`);
  if (s.dark) js.push(`FX.settle(tl, $('#${s.id}-stage'), 0);`);
  if (layout === 'hook') {
    const n1 = String(s.headline[0]).split(/\s+/).length, n2 = String(s.headline[1]).split(/\s+/).length;
    for (let n = 0; n < n1; n++) js.push(`FX.headWord(tl, $('#${s.id}-h${n}'), ${T(1 / 30 + n * 0.078)});`);
    js.push(`FX.boxWipe(tl, $('#${s.id}-box'), [${Array.from({ length: n2 }, (_, n) => `$('#${s.id}-b${n}')`).join(',')}], ${T(4.8 / 30)});`);
    js.push(`FX.cardIn(tl, $('#${s.id}-card'), ${T(1 / 30)});`);
  }
  if (layout === 'reveal') {
    const n2 = String(s.label).split(/\s+/).length;
    js.push(`FX.boxWipe(tl, $('#${s.id}-box'), [${Array.from({ length: n2 }, (_, n) => `$('#${s.id}-b${n}')`).join(',')}], ${T(5 / 30)});`);
    js.push(`FX.cardIn(tl, $('#${s.id}-card'), ${T(6 / 30)});`);
    js.push(`tl.set($('#${s.id}-card'), { opacity: 0 }, 0);`);
  }
  if (layout === 'compare') {
    cards.forEach((c, ci) => {
      js.push(`FX.fadeIn(tl, $('#${c.id}-label'), ${T((7 + ci * 10) / 30)}, 0.12);`);
      js.push(`tl.fromTo($('#${c.id}-tint'), { opacity: 1 }, { opacity: 0, duration: 0.47, ease: 'power1.out' }, ${T(1 / 30)});`);
    });
  }
  // Border beams run on every card except the before/after pair (measured: static there).
  if (layout !== 'compare') cards.forEach((c, ci) => js.push(`FX.beam(tl, $('#${c.id}-beam'), ${c.perimeter.toFixed(1)}, 0, ${T(D)}, ${(0.13 + ci * 0.31).toFixed(2)});`));

  // Beats per card.
  const swipeTimes = swipes.map(b => b.t - 0.17);
  cards.forEach((c, ci) => {
    const page = `$('#${c.id}-page')`;
    const K = k => `K($('#${c.id}-page'), ${JSON.stringify(k)})`;
    let firstCursor = true, scrollY = 0;
    const rings = c.beats.filter(b => b._ring);
    c.beats.forEach((b, n) => {
      const t = b.t;
      const nextRing = rings[rings.indexOf(b) + 1];
      const ringOut = b.hold ? 'null' : nextRing ? T(nextRing.fx === 'click' ? nextRing.t - 0.1 : nextRing.t) : 'null';
      switch (b.fx) {
        case 'highlight': js.push(`FX.highlight(tl, ${K(b.target)}, ${T(Math.max(0.05, t - 0.12))}${b.dur ? ', ' + b.dur : ''});`); break;
        case 'ring': js.push(`FX.ring(tl, $('#${b._ring}'), ${K(b.target)}, ${page}, ${T(t + 1 / 30)}, ${ringOut});`); break;
        case 'cursor':
        case 'click': {
          const travel = firstCursor ? 0.56 : 0.45;
          js.push(`FX.cursorTo(tl, $('#${c.id}-cur'), ${K(b.target)}, ${page}, ${T(Math.max(0.05, t - travel))}, { first: ${firstCursor}, click: ${b.fx === 'click'} });`);
          if (b._ring) js.push(`FX.ring(tl, $('#${b._ring}'), ${K(b.target)}, ${page}, ${T(Math.max(0.05, t - 0.1))}, ${ringOut});`);
          firstCursor = false;
          break;
        }
        case 'counter': {
          const out = b.out != null ? edit.words[b.out].s - s.t0 : Math.min(D - 0.1, t + 1.45);
          if (b._ring) js.push(`FX.ring(tl, $('#${b._ring}'), ${K(b.target)}, ${page}, ${T(t)}, ${T(out)});`);
          js.push(`placePop($('#${b._pop}'), ${b.target ? K(b.target) : 'null'}, ${page});`);
          js.push(`FX.counter(tl, $('#${b._pop}'), ${T(t + 0.1)}, ${T(out)}, popFrom($('#${b._pop}')));`);
          break;
        }
        case 'zoom': js.push(`FX.zoom(tl, ${page}, ${K(b.target)}, $('#${c.id}-vp'), ${T(t)}, ${b.scale || 1.5});`); break;
        case 'scroll': {
          const pg = pages.find(p => p.id === c.id);
          const by = b.by || Math.max(120, Math.min(600, (pg?.contentHeight || 0) - (pg?.viewportH || 0)));
          js.push(`FX.scroll(tl, ${page}, ${T(t)}, ${by}, ${scrollY});`);
          scrollY -= by;
          break;
        }
        case 'swap':
          if (b._from) js.push(`FX.blurSwap(tl, $('#${b._from}'), $('#${b._to}'), ${T(t)});`);
          break;
        case 'type': js.push(`FX.typeText(tl, ${K(b.target)}, ${T(t)}${b.dur ? ', ' + b.dur : ''});`); break;
      }
    });
    if (c.beats.some(b => b.fx === 'click' || b.fx === 'cursor')) {
      const lastT = Math.max(...c.beats.filter(b => b.fx === 'click' || b.fx === 'cursor').map(b => b.t));
      const out = Math.min(D - 0.05, swipeTimes[ci] ?? lastT + 1.2);
      js.push(`FX.cursorOut(tl, $('#${c.id}-cur'), ${T(out)});`);
    }
  });
  if (layout === 'compare') {
    for (const b of s.beats.filter(b => b.fx === 'swap')) (b._pairs || []).forEach(([x, z]) => js.push(`FX.blurSwap(tl, $('#${x}'), $('#${z}'), ${T(b.t)});`));
  }
  swipes.forEach((b, n) => {
    const from = n === 0 ? `${s.id}-card` : `${s.id}-card${n + 1}`, to = `${s.id}-card${n + 2}`;
    js.push(`FX.swipe(tl, $('#${from}'), $('#${to}'), ${T(Math.max(0.05, b.t - 0.17))}, ${box.w});`);
  });
  if (s.exitDrift && cards[0]) js.push(`FX.exitDrift(tl, $('#${cards.at(-1).id}-page'), ${T(D)});`);

  // Text a type beat will type on starts hidden.
  const typeCss = cards.flatMap(c => c.beats.filter(b => b.fx === 'type' && b.target).map(b => ` #${c.id}-page [data-k="${b.target}"] .tc { opacity: 0; }`)).join('');

  const html = `<template>
  <style>#root { position: absolute; inset: 0; }${swipes.map((_, n) => ` #${s.id}-card${n + 2} { opacity: 0; }`).join('')}${typeCss}</style>
  <div id="root" data-composition-id="${s.id}" data-width="1080" data-height="1920">
    <div class="fx-scene" data-layout-allow-overflow data-layout-allow-overlap>
    ${body}
    </div>
  </div>
  <script>
    (function () {
      var $ = FX.$;
      var root = document.querySelector('[data-composition-id="${s.id}"]');
      function K(page, key) { return page.querySelector('[data-k="' + key + '"]') || page; }
      function placePop(pop, target, page) {
        var vw = page.parentNode.offsetWidth, vh = page.parentNode.offsetHeight;
        var w = pop.offsetWidth, h = pop.offsetHeight, top = vh * 0.5 - h * 0.35;
        if (target) { var r = FX.rel(target, page); top = Math.min(vh - h - 24, r.y + r.h + 56); pop._from = { x: r.x + r.w / 2, y: r.y + r.h / 2 }; }
        pop.style.left = ((vw - w) / 2) + 'px'; pop.style.top = Math.max(16, top) + 'px';
      }
      function popFrom(pop) {
        if (!pop._from) return null;
        return { dx: pop._from.x - (pop.offsetLeft + pop.offsetWidth / 2), dy: pop._from.y - (pop.offsetTop + pop.offsetHeight / 2) };
      }
      FX.ready(root, function () {
        var tl = gsap.timeline({ paused: true });
        ${js.join('\n        ')}
        window.__timelines = window.__timelines || {};
        window.__timelines["${s.id}"] = tl;
      });
    })();
  </script>
</template>
`;
  return { html, errors };
}
