// B-roll page templates: the web content shown inside a scene's browser card.
//
//   renderPage(spec, ctx) -> { html, keys, contentHeight, bgImage }
//   ctx = { id, width, height, dark, root? }   (root: project dir, used only to read image sizes)
//
// html is the inner content of the compiler's <div class="page">. Every visual target carries
// data-k="<key>" (auto keys per template, see engine/docs/pages.md, plus [[key|text]] markup in
// any free-text field). Styles live in engine/runtime/pages.css, scoped under .pg / .pg-<kind>.
// Static output only: no scripts, no animation, no external URLs.

import fs from 'node:fs';
import path from 'node:path';
import { markup, keysIn, esc, slug } from './markup.mjs';

// Default accent for built pages (buttons, chart lines); matches the house red in engine.css.
let HOUSE_ACCENT = '#E5322B';
export function setHouseAccent(hex) { if (/^#[0-9a-f]{6}$/i.test(hex || '')) HOUSE_ACCENT = hex; }

export const PAGE_KINDS = ['image', 'post', 'article', 'chat', 'app', 'list', 'stat', 'chart', 'code', 'hero', 'search', 'table', 'doc', 'html'];

const ALIASES = {
  tweetQuote: 'post', tweet: 'post', social: 'post', screenshot: 'image', photo: 'image', blog: 'article', news: 'article',
  terminal: 'code', editor: 'code', gallery: 'app', dashboard: 'stat', metric: 'stat', stats: 'stat', graph: 'chart',
  line: 'chart', bar: 'chart', landing: 'hero', serp: 'search', pricing: 'table', comparison: 'table', notion: 'doc', note: 'doc', messages: 'chat',
};

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const px = v => `${Math.round(v * 10) / 10}px`;
const pct = v => `${Math.round(v * 10000) / 100}%`;
const arr = v => (Array.isArray(v) ? v : v == null || v === '' ? [] : [v]);
const str = v => (v == null ? '' : String(v));

// ---------------------------------------------------------------- text helpers

// markup() output with every plain word also wrapped in .hlw, so a highlight beat on an
// auto-keyed block (title, text, p1, item2...) sweeps its words like [[key|...]] spans do.
function hlwrap(html) {
  const re = /(<span class="hl" data-k="[^"]*">(?:<span class="hlw">[^<]*<\/span>)*<\/span>|<[^>]+>)/;
  return html.split(re).map((part, i) => {
    if (i % 2 === 1 || !part) return part || '';
    const t = part.split(/(\s+)/);
    let out = '';
    for (let j = 0; j < t.length; j += 2) {
      const w = t[j], sp = t[j + 1] ? ' ' : '';
      if (w || sp) out += `<span class="hlw">${w}${sp}</span>`;
    }
    return out;
  }).join('');
}

const strip = t => str(t).replace(/\[\[[\w-]+\|([\s\S]*?)\]\]/g, '$1').replace(/\*\*/g, '');

// Greedy word-wrap line count; cw = average glyph advance in em.
function nlines(text, fs, width, cw = 0.5) {
  const cpl = Math.max(4, width / (fs * cw));
  let n = 0;
  for (const para of strip(text).split('\n')) {
    let len = 0, ln = 1;
    for (const w of para.split(/\s+/).filter(Boolean)) {
      if (!len) len = w.length;
      else if (len + 1 + w.length <= cpl) len += 1 + w.length;
      else { ln++; len = w.length; }
    }
    n += ln;
  }
  return n;
}
const th = (text, fs, lh, width, cw) => (str(text) ? nlines(text, fs, width, cw) * fs * lh : 0);

function hash(s) { let h = 2166136261; for (const ch of str(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }

function safeColor(c) {
  c = str(c).trim();
  return /^#[0-9a-f]{3,8}$/i.test(c) || /^(rgb|rgba|hsl|hsla)\([\d\s.,%/-]+\)$/i.test(c) ? c : '';
}

function fmtNum(v) {
  if (v == null || v === '') return '';
  if (typeof v !== 'number') return str(v);
  const a = Math.abs(v);
  if (a >= 1e9) return +(v / 1e9).toFixed(a >= 1e10 ? 0 : 1) + 'B';
  if (a >= 1e6) return +(v / 1e6).toFixed(a >= 1e7 ? 0 : 1) + 'M';
  if (a >= 1e4) return +(v / 1e3).toFixed(a >= 1e5 ? 0 : 1) + 'K';
  return v.toLocaleString('en-US');
}

const initialsOf = name => strip(name).replace(/^@/, '').split(/[\s._-]+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('') || '?';
const GRADS = [['#6366F1', '#A855F7'], ['#F59E0B', '#EF4444'], ['#10B981', '#0EA5E9'], ['#EC4899', '#F97316'], ['#0EA5E9', '#6366F1'], ['#14B8A6', '#84CC16'], ['#F43F5E', '#8B5CF6'], ['#3B82F6', '#06B6D4']];
const gradFor = s => GRADS[hash(s) % GRADS.length];

// ---------------------------------------------------------------- image sizes

const sizeCache = new Map();
function imgSize(src, c) {
  if (!src || /^(data:|https?:)/i.test(src)) return null;
  const tries = [src];
  for (const r of [c.root, process.cwd()]) if (r) tries.push(path.resolve(r, src));
  for (const p of tries) {
    if (sizeCache.has(p)) return sizeCache.get(p);
    let b;
    try { b = fs.readFileSync(p); } catch { continue; }
    const s = parseSize(b);
    sizeCache.set(p, s);
    if (s) return s;
  }
  return null;
}
function parseSize(b) {
  try {
    if (b.length > 24 && b.readUInt32BE(0) === 0x89504e47) return [b.readUInt32BE(16), b.readUInt32BE(20)];
    if (b[0] === 0xff && b[1] === 0xd8) {
      let i = 2;
      while (i + 9 < b.length) {
        if (b[i] !== 0xff) { i++; continue; }
        const m = b[i + 1];
        if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
        i += 2 + b.readUInt16BE(i + 2);
      }
      return null;
    }
    if (b.toString('ascii', 0, 3) === 'GIF') return [b.readUInt16LE(6), b.readUInt16LE(8)];
    if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
      const t = b.toString('ascii', 12, 16);
      if (t === 'VP8 ') return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
      if (t === 'VP8L') { const v = b.readUInt32LE(21); return [(v & 0x3fff) + 1, ((v >> 14) & 0x3fff) + 1]; }
      if (t === 'VP8X') return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
    }
    const head = b.toString('utf8', 0, 2048);
    if (/<svg/i.test(head)) {
      const w = /\swidth="([\d.]+)/.exec(head), h = /\sheight="([\d.]+)/.exec(head), vb = /viewBox="[\d.\s-]*?([\d.]+)\s+([\d.]+)"/.exec(head);
      if (w && h) return [+w[1], +h[1]];
      if (vb) return [+vb[1], +vb[2]];
    }
  } catch {}
  return null;
}
// height / width of an image, or fallback
function aspectOf(src, spec, c, fallback) {
  if (Array.isArray(spec?.size) && spec.size[0] > 0) return spec.size[1] / spec.size[0];
  if (spec?.aspect > 0) return 1 / spec.aspect;
  const s = imgSize(src, c);
  return s && s[0] > 0 ? s[1] / s[0] : fallback;
}

// ---------------------------------------------------------------- icons (24x24, stroke)

const P = {
  reply: '<path d="M20.5 11.6a8.4 8.4 0 0 1-12.3 7.4L3.5 20.5l1.5-4.4a8.4 8.4 0 1 1 15.5-4.5z"/>',
  repost: '<path d="M17 2.5l3.5 3.5L17 9.5"/><path d="M3.5 11V9.5A3.5 3.5 0 0 1 7 6h13.5"/><path d="M7 21.5L3.5 18 7 14.5"/><path d="M20.5 13v1.5A3.5 3.5 0 0 1 17 18H3.5"/>',
  heart: '<path d="M20.4 4.9a5.3 5.3 0 0 0-7.6 0L12 5.8l-.8-.9a5.3 5.3 0 0 0-7.6 7.6l.8.8L12 20.9l7.6-7.6.8-.8a5.3 5.3 0 0 0 0-7.6z"/>',
  views: '<path d="M5 20v-7M10.3 20V5M15.6 20v-9M21 20v-5"/>',
  share: '<path d="M12 3v12M7.5 7.5L12 3l4.5 4.5"/><path d="M4.5 13.5v5a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5"/>',
  bookmark: '<path d="M18.5 21L12 16.5 5.5 21V5.2A2.2 2.2 0 0 1 7.7 3h8.6a2.2 2.2 0 0 1 2.2 2.2z"/>',
  more: '<circle cx="5" cy="12" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="19" cy="12" r="1.3" fill="currentColor"/>',
  send: '<path d="M21.5 2.5L10.5 13.5"/><path d="M21.5 2.5l-7 19-4-8-8-4z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20.5 20.5l-4.6-4.6"/>',
  check: '<path d="M20 6.5L9.5 17 4 11.5"/>',
  x: '<path d="M18 6L6 18M6 6l12 12"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  up: '<path d="M12 19.5v-15M5.5 11L12 4.5l6.5 6.5"/>',
  down: '<path d="M12 4.5v15M5.5 13l6.5 6.5 6.5-6.5"/>',
  back: '<path d="M19.5 12h-15M11 5.5L4.5 12l6.5 6.5"/>',
  chevL: '<path d="M15 5l-7 7 7 7"/>',
  chevD: '<path d="M6 9l6 6 6-6"/>',
  chevR: '<path d="M9 5l7 7-7 7"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  thumb: '<path d="M7 10.5v10M14.5 5.9L13.6 10h5.6a2 2 0 0 1 1.9 2.6l-2.2 7.4a2 2 0 0 1-1.9 1.5H4.5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h2.6a2 2 0 0 0 1.8-1.1L12 3a2.9 2.9 0 0 1 2.5 2.9z"/>',
  comment: '<path d="M21 15a2 2 0 0 1-2 2H7.5L3 21V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  bulb: '<path d="M9 18h6M10 21.5h4"/><path d="M12 2.5a6.5 6.5 0 0 0-4 11.6c.7.6 1 1.3 1 2.1V16.5h6v-.3c0-.8.4-1.5 1-2.1a6.5 6.5 0 0 0-4-11.6z"/>',
  file: '<path d="M14 2.5H7a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7.5z"/><path d="M14 2.5v5h5"/>',
  bell: '<path d="M18 8.5a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/>',
  sliders: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
  grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>',
  play: '<path d="M8 5.5v13l11-6.5z" fill="currentColor"/>',
  video: '<rect x="2.5" y="6" width="13" height="12" rx="2.5"/><path d="M15.5 10.5l6-3.5v10l-6-3.5"/>',
  phone: '<path d="M21 16.5v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 1.1 3.7 2 2 0 0 1 3.1 1.5h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L7.1 9.4a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
  edit: '<path d="M12 20.5h8.5"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  clip: '<path d="M21.4 11.1l-9.2 9.2a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5"/>',
  term: '<path d="M4.5 17l6-5-6-5M12.5 19h7"/>',
  doc: '<path d="M14 2.5H7a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7.5z"/><path d="M14 2.5v5h5M9 13h6M9 17h6"/>',
  star: '<path d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3-4.6-4.4 6.3-.9z"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7.5a4 4 0 0 1 8 0V11"/>',
  home: '<path d="M3.5 10.5L12 3.5l8.5 7V20a1 1 0 0 1-1 1h-5v-6h-5v6h-5a1 1 0 0 1-1-1z"/>',
  trend: '<path d="M22 7l-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>',
};
const icon = (n, cls = '') => `<svg class="pg-i${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || ''}</svg>`;
const sparkleSvg = cls => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1.8c.5 4.9 2.6 7.6 9.4 8.6v.6c-6.8 1-8.9 3.7-9.4 8.6h-.6c-.5-4.9-2.6-7.6-9.4-8.6v-.6c6.8-1 8.9-3.7 9.4-8.6z" transform="translate(0 1.5)" fill="currentColor"/></svg>`;

// Scalloped "verified" seal: a 12-point star with round joins plus a check.
const SEAL = (() => {
  const pts = [];
  for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2 - Math.PI / 2, r = i % 2 ? 9.2 : 10.6; pts.push(`${(12 + r * Math.cos(a)).toFixed(2)},${(12 + r * Math.sin(a)).toFixed(2)}`); }
  return pts.join(' ');
})();
const badge = (color = '') => `<svg class="pg-badge" viewBox="0 0 24 24" aria-hidden="true"${color ? ` style="color:${color}"` : ''}><polygon points="${SEAL}" fill="currentColor" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/><path d="M7.6 12.3l3 3 5.8-6.2" fill="none" stroke="#fff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

function avatar(c, { src, name, initials, cls = '', ring = false } = {}) {
  const inner = src
    ? `<img src="${esc(src)}" alt="">`
    : (() => { const [a, b] = gradFor(name || initials); return `<span class="pg-av-in" style="background:linear-gradient(135deg,${a},${b})">${esc(initials || initialsOf(name))}</span>`; })();
  return `<span class="pg-av${cls ? ' ' + cls : ''}${ring ? ' pg-av-ring' : ''}">${inner}</span>`;
}

function logoMark(c, name, color) {
  const [a, b] = color ? [color, color] : gradFor(name);
  const ch = initialsOf(name).slice(0, 1);
  return `<span class="pg-logo" style="background:linear-gradient(135deg,${a},${b})">${esc(ch)}</span>`;
}

// ---------------------------------------------------------------- context + root

function makeCtx(ctx = {}) {
  const W = Math.max(200, +ctx.width || 941), H = Math.max(150, +ctx.height || 627);
  const u = clamp(W / 941, 0.74, 1.15);
  const keys = [];
  let n = 0;
  const c = {
    id: str(ctx.id || 'pg'), W, H, u, dark: !!ctx.dark, root: ctx.root || ctx.projectDir || ctx.dir || null,
    narrow: W < 800, short: H < 480,
    pad: Math.max(40, 52 * u), fsBody: Math.max(30, 34 * u), fsMeta: Math.max(26, 28 * u), fsUi: Math.max(28, 30 * u),
    fsH1: Math.max(44, 58 * u), fsH2: Math.max(36, 44 * u),
    keys,
    k(key) { keys.push(str(key)); return ` data-k="${esc(key)}"`; },
    t(text) { keys.push(...keysIn(text)); return hlwrap(markup(text)); },
    tw(text) { keys.push(...keysIn(text)); return hlwrap(markup(text)); },
    tp(text) { keys.push(...keysIn(text)); return markup(text); }, // plain: not swept by a parent's highlight
    ts(text) { keys.push(...keysIn(text)); return `<span>${hlwrap(markup(text))}</span>`; },
    uid(tag) { return `${c.id}-${tag}${++n}`; },
  };
  c.inner = W - 2 * c.pad;
  return c;
}

function rootDiv(c, kind, spec, inner, cls = [], extra = '') {
  const classes = ['pg', `pg-${kind}`, ...cls.filter(Boolean)];
  if (c.narrow) classes.push('pg-narrow');
  if (c.short) classes.push('pg-short');
  let style = `min-height:${c.H}px;--u:${c.u.toFixed(3)}`;
  const acc = safeColor(spec.accent);
  if (acc) style += `;--acc:${acc}`;
  return `<div class="${classes.join(' ')}" style="${style}${extra}">${inner}</div>`;
}

// Keyed text: inline-block wrapper that hugs the words (good ring/zoom bounds), words wrapped for sweeps.
const hw = s => `<span class="hlw">${esc(s)}</span>`;
const kt = (c, key, text, cls = 'pg-kt') => `<span class="${cls}"${c.k(key)}>${c.tw(text)}</span>`;

// Typeable text: one .tc span per character so FX.typeText can reveal it. Falls back to
// highlightable words when the text contains [[key|...]] markup.
function typeable(c, text) {
  const s = str(text);
  if (keysIn(s).length) return c.tw(s);
  return `<span class="hlw">${[...s].map(ch => `<span class="tc">${ch === ' ' ? ' ' : esc(ch)}</span>`).join('')}</span>`;
}

// ---------------------------------------------------------------- 1. image

function pImage(spec, c) {
  const src = spec.src || spec.image || '';
  const cover = spec.fit === 'cover';
  const center = spec.position === 'center';
  const ar = aspectOf(src, spec, c, 0.625);
  let map = r => r, h;
  if (!cover) h = c.W * ar;
  else {
    h = c.H;
    const dw = c.W * ar >= c.H ? c.W : c.H / ar, dh = dw * ar, ox = (c.W - dw) / 2, oy = center ? (c.H - dh) / 2 : 0;
    map = ([x, y, w, hh]) => [(ox + x * dw) / c.W, (oy + y * dh) / c.H, (w * dw) / c.W, (hh * dh) / c.H];
  }
  let regions = '';
  for (const [key, r] of Object.entries(spec.regions || {})) {
    if (!Array.isArray(r) || r.length < 4) continue;
    const [x, y, w, hh] = map(r.map(Number));
    regions += `<div class="im-region"${c.k(key)} style="left:${pct(x)};top:${pct(y)};width:${pct(w)};height:${pct(hh)}"><span class="hl hl-rect"><span class="hlw"></span></span></div>`;
  }
  const bg = safeColor(spec.bg);
  const imgStyle = cover ? ` style="object-position:50% ${center ? '50%' : '0%'}"` : '';
  const wrapStyle = cover ? ` style="height:${c.H}px"` : '';
  const html = `<div class="im-wrap${cover ? ' im-cover' : ''}"${c.k('image')}${wrapStyle}>${src ? `<img class="im-img" src="${esc(src)}" alt=""${imgStyle}>` : '<div class="im-empty"></div>'}${regions}</div>`;
  return { html: rootDiv(c, 'image', spec, html, [], bg ? `;background:${bg}` : ''), h, bg: src || null };
}

// ---------------------------------------------------------------- 2. post

function media(c, spec, aspectFallback, cls = '') {
  const grid = arr(spec.mediaGrid).slice(0, 4);
  if (grid.length > 1) {
    const n = grid.length;
    return { html: `<div class="po-media po-grid po-g${n}${cls}"${c.k('media')}>${grid.map(s => `<img src="${esc(s)}" alt="">`).join('')}</div>`, ar: 0.5625, src: grid[0] };
  }
  const src = spec.media || grid[0];
  if (!src) return { html: '', ar: 0, src: null };
  const ar = clamp(spec.mediaAspect ? 1 / spec.mediaAspect : aspectOf(src, null, c, aspectFallback), 0.42, 1.25);
  return { html: `<div class="po-media${cls}"${c.k('media')} style="aspect-ratio:${(1 / ar).toFixed(4)}"><img src="${esc(src)}" alt=""></div>`, ar, src };
}

function pPost(spec, c) {
  const pf = ['x', 'threads', 'linkedin', 'instagram'].includes(spec.platform) ? spec.platform : 'x';
  const name = str(spec.name || str(spec.handle || '').replace(/^@/, '') || 'Alex Rivera');
  const rawHandle = str(spec.handle || name.toLowerCase().replace(/[^a-z0-9]+/g, ''));
  const at = '@' + rawHandle.replace(/^@/, '');
  const bare = rawHandle.replace(/^@/, '');
  const st = spec.stats || {};
  const av = (cls, ring) => avatar(c, { src: spec.avatar, name, initials: spec.initials, cls, ring });
  const ver = spec.verified ? badge(pf === 'instagram' ? '#0095F6' : pf === 'linkedin' ? '' : '') : '';
  const text = str(spec.text);
  const time = str(spec.time);
  const cls = [`pf-${pf}`, spec.theme === 'dark' && 'pg-dark'];
  const pad = c.pad;
  let html = '', h = 0;
  const textW = c.inner;

  if (pf === 'x') {
    const m = media(c, spec, 0.5625);
    const metaBits = [];
    if (time) metaBits.push(`<span>${esc(time)}</span>`);
    if (st.views != null) metaBits.push(`<span class="po-v"${c.k('views')}><b>${hw(fmtNum(st.views))}</b>${hw(' Views')}</span>`);
    const act = (k, ic, v) => `<span class="po-act po-${k}"${c.k(k)}>${icon(ic)}${v != null && v !== '' ? `<b>${hw(fmtNum(v))}</b>` : ''}</span>`;
    html = `<div class="po-top">${icon('back')}<span>Post</span></div>
<article class="po">
<header class="po-head">${av()}<div class="po-id"><div class="po-name"><span class="pg-kt"${c.k('name')}>${c.t(name)}</span>${ver}</div><div class="po-handle"><span${c.k('handle')}>${hw(at)}</span></div></div><span class="po-more">${icon('more')}</span></header>
${text ? `<div class="po-text">${kt(c, 'text', text)}</div>` : ''}
${m.html}
${metaBits.length ? `<div class="po-meta">${metaBits.join('<i>·</i>')}</div>` : ''}
<div class="po-acts">${act('replies', 'reply', st.replies)}${act('reposts', 'repost', st.reposts)}${act('likes', 'heart', st.likes)}${act('bookmarks', 'bookmark', st.bookmarks)}<span class="po-act">${icon('share')}</span></div>
</article>`;
    h = (c.short ? 0 : 84 * c.u + 1.5) + 30 * c.u + Math.max(64, 88 * c.u) + (text ? 22 * c.u + th(text, c.fsBody * 1.06, 1.38, textW) : 0) + (m.ar ? 24 * c.u + textW * m.ar + 3 : 0)
      + (metaBits.length ? 48 * c.u + c.fsMeta * 1.42 + 1.5 : 0) + 44 * c.u + 40 + 1.5;
    return { html: rootDiv(c, 'post', spec, html, cls), h, bg: m.src || null };
  }

  if (pf === 'threads') {
    const m = media(c, spec, 0.8);
    const act = (k, ic, v) => `<span class="po-act"${c.k(k)}>${icon(ic)}${v != null && v !== '' ? `<b>${hw(fmtNum(v))}</b>` : ''}</span>`;
    html = `<div class="po-top po-top-c"><span>Thread</span></div>
<article class="po po-th">
<div class="po-rail">${av()}<i class="po-line"></i></div>
<div class="po-body">
<header class="po-head"><div class="po-name"><span class="pg-kt"${c.k('name')}>${c.t(spec.handle ? bare : name)}</span>${ver}${time ? `<span class="po-time">${esc(time)}</span>` : ''}</div><span class="po-more">${icon('more')}</span></header>
${text ? `<div class="po-text">${kt(c, 'text', text)}</div>` : ''}
${m.html}
<div class="po-acts">${act('likes', 'heart', st.likes)}${act('replies', 'reply', st.replies)}${act('reposts', 'repost', st.reposts)}${act('shares', 'send', st.shares)}</div>
</div>
</article>`;
    h = (c.short ? 0 : 84) + 36 + 56 + th(text, c.fsBody, 1.42, textW - 110) + (m.ar ? (textW - 110) * m.ar + 28 : 0) + 100 + 30;
    return { html: rootDiv(c, 'post', spec, html, cls), h, bg: m.src || null };
  }

  if (pf === 'linkedin') {
    const m = media(c, spec, 0.6, ' po-bleed');
    const sub = str(spec.headline || spec.handle || '');
    const counts = [];
    if (st.replies != null) counts.push(`<span${c.k('replies')}>${hw(fmtNum(st.replies) + ' comments')}</span>`);
    if (st.reposts != null) counts.push(`<span${c.k('reposts')}>${hw(fmtNum(st.reposts) + ' reposts')}</span>`);
    html = `<article class="po po-li">
<header class="po-head">${av()}<div class="po-id"><div class="po-name"><span class="pg-kt"${c.k('name')}>${c.t(name)}</span>${ver}<span class="po-deg">· 1st</span></div>${sub ? `<div class="po-sub"><span${c.k('handle')}>${c.t(sub)}</span></div>` : ''}<div class="po-time">${esc(time || '2d')} · ${icon('globe')}</div></div><span class="po-follow">${icon('plus')}Follow</span></header>
${text ? `<div class="po-text">${kt(c, 'text', text)}</div>` : ''}
${m.html}
<div class="po-counts"><span class="po-react"${c.k('likes')}><i class="r1">${icon('thumb')}</i><i class="r2">${icon('heart')}</i><i class="r3">${icon('star')}</i><b>${hw(fmtNum(st.likes ?? 0))}</b></span><span class="po-cr">${counts.join('<i>·</i>')}</span></div>
<div class="po-acts">${[['thumb', 'Like'], ['comment', 'Comment'], ['repost', 'Repost'], ['send', 'Send']].map(([ic, l]) => `<span class="po-act">${icon(ic)}<b>${l}</b></span>`).join('')}</div>
${st.views != null ? `<div class="po-imp">${icon('views')}<span${c.k('views')}><b>${hw(fmtNum(st.views))}</b>${hw(' impressions')}</span></div>` : ''}
</article>`;
    h = 36 + 130 + 20 + th(text, c.fsBody, 1.42, textW) + (m.ar ? c.W * m.ar + 28 : 0) + 76 + 96 + (st.views != null ? 70 : 0) + 20;
    return { html: rootDiv(c, 'post', spec, html, cls), h, bg: m.src || null };
  }

  // instagram (caption post)
  const m = media(c, spec, 1, ' po-bleed');
  const sub = str(spec.location || '');
  html = `<article class="po po-ig">
<header class="po-head">${av('', true)}<div class="po-id"><div class="po-name"><span class="pg-kt"${c.k('handle')}>${c.t(bare)}</span>${ver}<span class="po-dot">·</span><span class="po-fl">Follow</span></div>${sub ? `<div class="po-sub">${c.t(sub)}</div>` : ''}</div><span class="po-more">${icon('more')}</span></header>
${m.html || (() => { const [a, b] = gradFor(bare + text); const col = safeColor(spec.accent); return `<div class="po-media po-bleed po-card"${c.k('media')} style="background:linear-gradient(150deg,${col || a},${col ? col : b})"><div class="po-cardt">${c.tp(spec.cardText || text)}</div><div class="po-cardh">@${esc(bare)}</div></div>`; })()}
<div class="po-acts"><span class="po-act"${c.k('likes')}>${icon('heart')}${st.likes != null ? `<b>${hw(fmtNum(st.likes))}</b>` : ''}</span><span class="po-act"${c.k('replies')}>${icon('reply')}${st.replies != null ? `<b>${hw(fmtNum(st.replies))}</b>` : ''}</span><span class="po-act">${icon('send')}${st.shares != null ? `<b>${esc(fmtNum(st.shares))}</b>` : ''}</span><span class="po-act po-bm">${icon('bookmark')}</span></div>
${text ? `<div class="po-cap"><b>${esc(bare)}</b> ${kt(c, 'text', !m.html && !spec.cardText ? strip(text) : text)}</div>` : ''}
${time ? `<div class="po-time">${esc(time)}</div>` : ''}
</article>`;
  h = 20 + 120 + (m.ar ? c.W * m.ar : c.W) + 100 + th(bare + ' ' + text, c.fsBody, 1.42, textW) + (time ? 56 : 0) + 30;
  return { html: rootDiv(c, 'post', spec, html, cls), h, bg: m.src || null };
}

// ---------------------------------------------------------------- 3. article

function pArticle(spec, c) {
  const site = str(spec.site || 'The Daily Brief');
  const body = arr(spec.body);
  const img = spec.image;
  const ar = img ? clamp(aspectOf(img, null, c, 0.56), 0.4, 0.8) : 0;
  const by = str(spec.byline || '');
  const date = str(spec.date || '');
  const read = spec.readTime ? str(spec.readTime) : body.length ? `${Math.max(2, Math.round(body.join(' ').split(/\s+/).length / 60))} min read` : '';
  const sections = arr(spec.nav).length ? arr(spec.nav) : null;
  let ps = '';
  body.forEach((p, i) => { ps += `<p class="ar-p">${kt(c, `p${i + 1}`, p)}</p>`; });
  const html = `<header class="ar-mast">${icon('menu')}<span class="ar-site">${esc(site)}</span><span class="ar-sub">Subscribe</span></header>
${sections ? `<nav class="ar-nav">${sections.map((s, i) => `<span${i === 0 ? ' class="on"' : ''}>${esc(s)}</span>`).join('')}</nav>` : ''}
<div class="ar-main">
${spec.kicker ? `<div class="ar-kicker"><span${c.k('kicker')}>${c.t(spec.kicker)}</span></div>` : ''}
<h1 class="ar-title">${kt(c, 'title', spec.title || 'Untitled')}</h1>
${spec.dek ? `<p class="ar-dek">${kt(c, 'dek', spec.dek)}</p>` : ''}
${by || date ? `<div class="ar-by">${by ? avatar(c, { name: by, src: spec.avatar }) : ''}<div><div class="ar-name">${by ? `By <b${c.k('byline')}>${c.t(by)}</b>` : ''}</div><div class="ar-date">${[date, read].filter(Boolean).map(esc).join(' · ')}</div></div></div>` : ''}
${img ? `<figure class="ar-fig"${c.k('image')}><img src="${esc(img)}" alt="" style="aspect-ratio:${(1 / ar).toFixed(4)}">${spec.caption ? `<figcaption>${c.t(spec.caption)}</figcaption>` : ''}</figure>` : ''}
${ps}
</div>`;
  const w = c.inner;
  const serif = spec.style === 'serif';
  let h = 96 * c.u + (sections ? 72 * c.u : 0) + 36 * c.u + (spec.kicker ? c.fsMeta * 1.42 + 16 * c.u : 0)
    + (serif ? th(spec.title, c.fsH1 * 1.06, 1.04, w, 0.43) : th(spec.title, c.fsH1 * 0.96, 1.1, w, 0.52));
  if (spec.dek) h += th(spec.dek, c.fsBody * 1.04, 1.4, w) + 18 * c.u;
  if (by || date) h += 72 + 56 * c.u;
  if (img) h += w * ar + 32 * c.u + (spec.caption ? 12 + th(spec.caption, c.fsMeta, 1.35, w) : 0);
  body.forEach(p => { h += th(p, c.fsBody, 1.55, w) + 28 * c.u; });
  return { html: rootDiv(c, 'article', spec, html, [serif && 'ar-serif']), h: h + 40 - 28 * c.u, bg: img || null };
}

// ---------------------------------------------------------------- 4. chat

function richText(c, key, text) {
  // AI message: paragraphs, "- " bullets and "1. " numbered lines
  const lines = str(text).split('\n');
  let out = '', list = null;
  const close = () => { if (list) { out += `</${list}>`; list = null; } };
  for (const ln of lines) {
    const b = /^\s*[-*•]\s+(.*)$/.exec(ln), n = /^\s*(\d+)[.)]\s+(.*)$/.exec(ln);
    if (b) { if (list !== 'ul') { close(); out += '<ul>'; list = 'ul'; } out += `<li>${c.tw(b[1])}</li>`; }
    else if (n) { if (list !== 'ol') { close(); out += '<ol>'; list = 'ol'; } out += `<li>${c.tw(n[2])}</li>`; }
    else { close(); if (ln.trim()) out += `<p>${c.tw(ln)}</p>`; }
  }
  close();
  return `<div class="ch-rich"${c.k(key)}>${out}</div>`;
}

function pChat(spec, c) {
  const app = spec.app === 'messages' ? 'messages' : 'assistant';
  const msgs = arr(spec.messages);
  const isUser = r => ['user', 'me', 'human', 'you'].includes(str(r).toLowerCase());
  const input = spec.input != null ? str(spec.input) : '';
  const caret = spec.typed ? '' : '<i class="ch-caret"></i>';
  let h = 0, html;
  if (app === 'assistant') {
    let thread = '';
    msgs.forEach((m, i) => {
      const key = `m${i + 1}`;
      if (isUser(m.role)) {
        thread += `<div class="ch-row ch-u"><div class="ch-bub"${c.k(key)}>${c.tw(m.text)}</div></div>`;
        h += th(m.text, c.fsBody, 1.42, c.inner * 0.78 - 60) + 44 + 28;
      } else {
        thread += `<div class="ch-row ch-a"><span class="ch-ico">${sparkleSvg('ch-spark')}</span>${richText(c, key, m.text)}</div>`;
        h += str(m.text).split('\n').reduce((s, ln) => s + (ln.trim() ? th(ln, c.fsBody, 1.5, c.inner - 70) + 14 : 0), 0) + 40;
      }
    });
    html = `<header class="ch-bar">${icon('menu')}<div class="ch-title"><span${c.k('title')}>${c.t(spec.title || 'New chat')}</span>${icon('chevD')}</div>${icon('edit')}</header>
<div class="ch-thread"><div class="ch-tin">${thread}</div></div>
<div class="ch-comp"><div class="ch-box"><div class="ch-in${spec.typed ? ' tc-wait' : ''}${input ? '' : ' ch-ph'}"><span class="ch-txt"${c.k('input')}>${input ? typeable(c, input) : esc(spec.placeholder || 'Ask anything')}</span>${input ? caret : ''}</div><div class="ch-tools"><span class="ch-tool">${icon('plus')}</span><span class="ch-tool ch-pill">${icon('sliders')}<b>Tools</b></span><span class="ch-sp"></span><span class="ch-tool">${icon('mic')}</span><span class="ch-send">${icon('up')}</span></div></div></div>`;
    h += 92 + 30 + 190 + 30;
  } else {
    let thread = `<div class="ch-day">${esc(spec.day || 'Today 9:41 AM')}</div>`;
    let lastUser = -1;
    msgs.forEach((m, i) => { if (isUser(m.role)) lastUser = i; });
    msgs.forEach((m, i) => {
      const me = isUser(m.role);
      const next = msgs[i + 1];
      const tail = !next || isUser(next.role) !== me;
      thread += `<div class="ch-row ${me ? 'ch-me' : 'ch-them'}${tail ? ' ch-tail' : ''}"><div class="ch-bub"${c.k(`m${i + 1}`)}>${c.tw(m.text)}</div></div>`;
      if (i === lastUser && spec.delivered !== false) thread += `<div class="ch-dl">${esc(spec.status || 'Delivered')}</div>`;
      h += th(m.text, c.fsBody, 1.36, c.inner * 0.74 - 52) + 34 + (tail ? 22 : 8);
    });
    const title = str(spec.title || 'Sam');
    html = `<header class="ch-bar ch-bar-m"><span class="ch-back">${icon('chevL')}</span><div class="ch-who">${avatar(c, { name: title, src: spec.avatar })}<span class="ch-nm"${c.k('title')}>${c.ts(title)}${icon('chevR')}</span></div><span class="ch-vid">${icon('video')}</span></header>
<div class="ch-thread"><div class="ch-tin">${thread}</div></div>
<div class="ch-comp"><span class="ch-plus">${icon('plus')}</span><div class="ch-field${spec.typed ? ' tc-wait' : ''}${input ? '' : ' ch-ph'}"><span class="ch-txt"${c.k('input')}>${input ? typeable(c, input) : esc(spec.placeholder || 'Message')}</span>${input ? caret : ''}<span class="ch-mic">${input ? `<span class="ch-send">${icon('up')}</span>` : icon('mic')}</span></div></div>`;
    h += 150 + 70 + 120 + 30;
  }
  // Like a real chat app, a long thread is scrolled to its newest message with the composer
  // pinned to the bottom of the viewport (older messages clip at the top).
  // Set pin:false for a plain scrolling page instead.
  const pin = spec.pin !== false;
  if (pin) h = c.H;
  return { html: rootDiv(c, 'chat', spec, html, [`ch-${app}`, pin && 'ch-pin', spec.theme === 'dark' && 'pg-dark'], pin ? `;height:${c.H}px` : ''), h, bg: null };
}

// ---------------------------------------------------------------- 5. app (catalog / gallery)

function pApp(spec, c) {
  const brand = str(spec.brand || spec.title || 'Studio');
  const filters = arr(spec.filters);
  const chips = arr(spec.chips).map(x => (typeof x === 'string' ? { label: x } : x));
  const grid = arr(spec.grid).map(x => (typeof x === 'string' ? { label: x } : x));
  const cols = spec.columns || (c.W >= 820 ? 3 : 2);
  const activeChip = spec.active != null ? spec.active : 0;
  const seen = new Set();
  const keyOnce = k => (seen.has(k) ? '' : (seen.add(k), c.k(k)));
  // chip-<slug> / filter-<slug> sit on the pill, chipN / filterN on its padded content: same box either way
  const filt = filters.map((f, i) => `<span class="ap-f${i === 0 ? ' on' : ''}"${keyOnce(`filter-${slug(strip(f))}`)}><span class="ap-fi"${c.k(`filter${i + 1}`)}>${c.t(f)}</span></span>`).join('');
  const chipH = chips.map((ch, i) => {
    const on = typeof activeChip === 'number' ? i === activeChip : slug(ch.label) === slug(activeChip);
    return `<span class="ap-chip${on ? ' on' : ''}"${keyOnce(`chip-${slug(strip(ch.label))}`)}><span class="ap-ci"${c.k(`chip${i + 1}`)}>${c.ts(ch.label)}${ch.count != null ? `<b>${hw(fmtNum(ch.count))}</b>` : ''}</span></span>`;
  }).join('');
  const thumbs = grid.map((g, i) => {
    const col = safeColor(g.color);
    const [a, b] = col ? [col, col] : gradFor(g.label + i);
    const th = g.image
      ? `<img src="${esc(g.image)}" alt="">`
      : `<span class="ap-ph" style="background:radial-gradient(120% 90% at 20% 10%,${a} 0%,${b} 55%,#0b0d12 100%)"><i>${icon('play')}</i></span>`;
    return `<div class="ap-card"${c.k(`card${i + 1}`)}><div class="ap-th">${th}${g.badge ? `<span class="ap-bd">${esc(g.badge)}</span>` : ''}${g.duration ? `<span class="ap-du">${esc(g.duration)}</span>` : ''}</div><div class="ap-lb">${c.t(g.label || '')}</div>${g.meta ? `<div class="ap-mt">${c.t(g.meta)}</div>` : ''}</div>`;
  }).join('');
  const html = `<header class="ap-nav">${logoMark(c, brand, safeColor(spec.accent))}<span class="ap-brand"${c.k('brand')}>${hw(brand)}</span><div class="ap-search">${icon('search')}<span>${esc(spec.search || 'Search')}</span></div>${c.narrow ? '' : `<span class="ap-btn">${esc(spec.cta || 'Submit')}</span>`}</header>
<div class="ap-main">
${spec.title ? `<h1 class="ap-title">${kt(c, 'title', spec.title)}</h1>` : ''}
${spec.subtitle ? `<p class="ap-sub">${c.t(spec.subtitle)}</p>` : ''}
${filters.length ? `<div class="ap-fs">${filt}</div>` : ''}
${chips.length ? `<div class="ap-chips">${chipH}</div>` : ''}
<div class="ap-grid" style="grid-template-columns:repeat(${cols},minmax(0,1fr))">${thumbs}</div>
</div>`;
  const colW = (c.inner - (cols - 1) * 20 * c.u) / cols;
  const rows = Math.ceil(grid.length / cols);
  let chipRows = 0;
  if (chips.length) { let x = c.inner + 1; for (const ch of chips) { const w = strip(ch.label).length * 29 * 0.53 + 42 + (ch.count != null ? String(fmtNum(ch.count)).length * 26 * 0.6 + 32 : 0); if (x + 12 + w > c.inner) { chipRows++; x = w; } else x += 12 + w; } }
  let h = 100 * c.u + 34 * c.u + 40;
  if (spec.title) h += th(spec.title, Math.max(44, c.fsH1 * 0.88), 1.08, c.inner, 0.53) + 22 * c.u;
  if (spec.subtitle) h += th(spec.subtitle, c.fsBody, 1.4, c.inner) + 12 * c.u;
  if (filters.length) h += c.fsUi * 1.42 + 22 + 26 * c.u;
  if (chipRows) h += chipRows * 60 + (chipRows - 1) * 12 + 28 * c.u;
  const lbl = Math.max(...grid.map(g => nlines(g.label, c.fsUi, colW, 0.55)), 1);
  h += rows * (colW * 0.625 + 14 + Math.min(2, lbl) * c.fsUi * 1.25 + (grid.some(g => g.meta) ? 4 + c.fsMeta * 1.42 : 0)) + (rows - 1) * 26 * c.u;
  const firstImg = grid.find(g => g.image);
  return { html: rootDiv(c, 'app', spec, html, [spec.theme === 'dark' && 'pg-dark']), h, bg: firstImg ? firstImg.image : null };
}

// ---------------------------------------------------------------- 6. list

function pList(spec, c) {
  const style = ['numbered', 'check', 'bullets', 'ranked'].includes(spec.style) ? spec.style : 'numbered';
  const items = arr(spec.items).map(x => (typeof x === 'string' ? { text: x } : x || {}));
  let h = 58 * c.u + 4 + 30 + (spec.eyebrow ? c.fsMeta * 1.42 + 12 : 0) + th(spec.title, c.fsH1, 1.08, c.inner, 0.53) + (spec.sub ? th(spec.sub, c.fsBody, 1.4, c.inner) + 14 : 0);
  const rows = items.map((it, i) => {
    const mark = style === 'check' ? (it.done === false ? '<span class="ls-mk ls-ck0"></span>' : `<span class="ls-mk ls-ck">${icon('check')}</span>`)
      : style === 'bullets' ? '<span class="ls-mk ls-dot"></span>'
        : style === 'ranked' ? `<span class="ls-mk ls-rk r${Math.min(i + 1, 4)}">${i + 1}</span>`
          : `<span class="ls-mk ls-n">${i + 1}</span>`;
    const tw = c.inner - (style === 'bullets' ? 28 : 60) - 26 * c.u - (it.tag ? strip(it.tag).length * c.fsMeta * 0.6 + 40 + 26 * c.u : 0);
    h += Math.max(60, th(it.text, c.fsBody * 1.04, 1.32, tw, 0.5) + (it.note ? th(it.note, c.fsMeta, 1.4, tw) + 6 : 0)) + 44 * c.u + 1.5;
    return `<li class="ls-it"${c.k(`item${i + 1}`)}>${mark}<div class="ls-tx"><div class="ls-t">${c.tw(it.text)}</div>${it.note ? `<div class="ls-nt">${c.tp(it.note)}</div>` : ''}</div>${it.tag ? `<span class="ls-tag">${c.tp(it.tag)}</span>` : ''}</li>`;
  }).join('');
  const html = `<div class="ls-head">${spec.eyebrow ? `<div class="ls-eb">${c.t(spec.eyebrow)}</div>` : ''}<h1 class="ls-title">${kt(c, 'title', spec.title || '')}</h1>${spec.sub ? `<p class="ls-sub">${c.t(spec.sub)}</p>` : ''}</div>
<ol class="ls-items">${rows}</ol>`;
  return { html: rootDiv(c, 'list', spec, html, [`ls-${style}`]), h, bg: null };
}

// ---------------------------------------------------------------- 7. stat

function sparkline(c, data, color) {
  const v = arr(data).map(Number).filter(n => Number.isFinite(n));
  if (v.length < 2) return '';
  const min = Math.min(...v), max = Math.max(...v), span = max - min || 1;
  const pts = v.map((y, i) => [(i / (v.length - 1)) * 100, 4 + (1 - (y - min) / span) * 30]);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(' ');
  const id = c.uid('spk');
  const last = pts[pts.length - 1];
  return `<div class="st-spk"><svg viewBox="0 0 100 36" preserveAspectRatio="none"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".28"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs><path d="${line} L100 36 L0 36 Z" fill="url(#${id})"/><path d="${line}" fill="none" stroke="${color}" stroke-width="2.5" vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke-linecap="round"/></svg><i class="st-end" style="left:${last[0]}%;top:${(last[1] / 36) * 100}%;background:${color}"></i></div>`;
}

function pStat(spec, c) {
  const tiles = arr(spec.stats).length ? arr(spec.stats).slice(0, 4) : [spec];
  const multi = tiles.length > 1;
  const html = tiles.map((t, i) => {
    const sfx = multi ? String(i + 1) : '';
    const d = str(t.delta);
    const down = /^[-−↓]/.test(d.trim()) || t.trend === 'down';
    const good = t.goodDown ? down : !down;
    const col = good ? '#12A150' : '#E5484D';
    return `<div class="st-tile${multi ? '' : ' st-solo'}">
<div class="st-top"><span class="st-label"${c.k(`label${sfx}`)}>${c.t(t.label || '')}</span>${t.period ? `<span class="st-per">${esc(t.period)}</span>` : ''}</div>
<div class="st-val"><span class="st-v"${c.k(`value${sfx}`)}>${t.prefix ? `<small>${hw(t.prefix)}</small>` : ''}${c.t(t.value ?? '')}</span>${t.unit ? `<span class="st-u">${c.t(t.unit)}</span>` : ''}</div>
${d ? `<div class="st-dl"><span class="st-d ${good ? 'good' : 'bad'}"${c.k(`delta${sfx}`)}>${icon(down ? 'down' : 'up')}${hw(d.trim().replace(/^[-+−↑↓]\s*/, ''))}</span>${t.vs ? `<span class="st-vs">${c.t(t.vs)}</span>` : ''}</div>` : ''}
${t.sub ? `<div class="st-sub">${c.t(t.sub)}</div>` : ''}
${sparkline(c, t.spark, good || !d ? 'var(--acc)' : '#E5484D').replace(/var\(--acc\)/g, safeColor(spec.accent) || HOUSE_ACCENT)}
</div>`;
  }).join('');
  const head = `<header class="st-bar">${logoMark(c, spec.brand || spec.title || 'Dashboard', safeColor(spec.accent))}<span class="st-title"${c.k('title')}>${c.t(spec.title || 'Overview')}</span><span class="st-range">${esc(spec.range || 'Last 30 days')}${icon('chevD')}</span></header>`;
  const n = tiles.length;
  const cls = `st-n${n}`;
  const tileH = (ts, solo) => 56 * c.u + 3 + c.fsUi * 1.42 + 8 + (solo ? Math.max(88, 128 * c.u) : Math.max(56, 76 * c.u)) * 1.08
    + (ts.some(t => t.delta) ? 14 + c.fsMeta * 1.42 + 12 : 0) + (ts.some(t => t.sub) ? 10 + c.fsMeta * 1.35 : 0)
    + (ts.some(t => arr(t.spark).length > 1) ? (solo ? 26 + 160 * c.u : 20 + 84) : 0);
  let h = 96 * c.u + 30 * c.u + 30;
  if (!multi) h += tileH(tiles, true);
  else { const rowsT = n === 3 ? [tiles.slice(0, 1), tiles.slice(1)] : [tiles.slice(0, 2), tiles.slice(2, 4)].filter(r => r.length); h += rowsT.reduce((s, r) => s + tileH(r, false), 0) + (rowsT.length - 1) * 22 * c.u; }
  return { html: rootDiv(c, 'stat', spec, head + `<div class="st-grid ${cls}">${html}</div>`, [spec.theme === 'dark' && 'pg-dark']), h, bg: null };
}

// ---------------------------------------------------------------- 8. chart

// Axis max with 3-5 round intervals (e.g. 21.4K -> 0..25K by 5K, 840 -> 0..1K by 250).
function niceAxis(v) {
  if (!(v > 0)) return { max: 1, n: 4 };
  const step = x => { const e = Math.pow(10, Math.floor(Math.log10(x))); for (const m of [1, 2, 2.5, 5, 10]) if (m * e >= x) return m * e; return 10 * e; };
  let best = null;
  for (const n of [4, 5, 3]) { const s = step((v * 1.04) / n), max = s * n; if (!best || max < best.max - 1e-9) best = { max, n }; }
  return best;
}
function fmtAxis(v, unit) {
  const a = Math.abs(v);
  const s = a >= 1e6 ? +(v / 1e6).toFixed(2) + 'M' : a >= 1e3 ? +(v / 1e3).toFixed(2) + 'K' : String(+v.toFixed(2));
  return unit && unit.length <= 2 && /^[$€£]$/.test(unit) ? unit + s : s;
}
function fmtVal(s, unit) {
  if (s.display != null) return str(s.display);
  const v = Number(s.value);
  if (!Number.isFinite(v)) return str(s.value);
  const n = Math.abs(v) >= 1e4 ? fmtAxis(v, '') : v.toLocaleString('en-US');
  if (!unit) return n;
  return /^[$€£]$/.test(unit) ? unit + n : unit === '%' ? n + '%' : n;
}

function pChart(spec, c) {
  const kind = [spec.chart, spec.type, spec.style, spec.kind].includes('line') ? 'line' : 'bar';
  const series = arr(spec.series).map(s => (typeof s === 'number' ? { label: '', value: s } : s || {}));
  const unit = str(spec.unit);
  let hi = spec.highlight;
  if (typeof hi === 'string') hi = series.findIndex((s, i) => slug(s.label) === slug(hi) || `${kind === 'bar' ? 'bar' : 'point'}${i + 1}` === hi);
  if (typeof hi !== 'number' || hi < 0 || hi >= series.length) hi = -1;
  const vals = series.map(s => Number(s.value) || 0);
  const axis = niceAxis(Math.max(...vals, 0)), max = axis.max;
  const yw = Math.round(78 * c.u);
  const headH = 38 * c.u + (spec.title ? th(spec.title, c.fsH2, 1.14, c.inner, 0.53) : 0) + (spec.sub ? c.fsMeta * 1.42 + 8 : 0);
  const xlH = 16 + c.fsMeta * 1.45;
  const plotH = Math.round(clamp(c.H - headH - 34 - xlH - 30 - (kind === 'bar' ? 0 : 10), 180, 720));
  const plotW = c.inner - yw;
  const ticks = Array.from({ length: axis.n + 1 }, (_, i) => i / axis.n);
  const grid = ticks.map(t => `<div class="cht-gl" style="bottom:${px(t * plotH)}"><span>${esc(fmtAxis(t * max, unit))}</span></div>`).join('');
  let plot = '', xl = '';
  const n = Math.max(1, series.length);
  if (kind === 'bar') {
    const slot = plotW / n, bw = clamp(slot * 0.62, 18, 120);
    plot = series.map((s, i) => {
      const bh = Math.max(4, (vals[i] / max) * plotH);
      return `<div class="cb-col" style="width:${px(slot)}"><div class="cb-stk${i === hi ? ' on' : ''}${hi >= 0 && i !== hi ? ' dim' : ''}"${c.k(`bar${i + 1}`)}><span class="cb-val">${hw(fmtVal(s, unit))}</span><div class="cb-bar" style="width:${px(bw)};height:${px(bh)}"></div></div></div>`;
    }).join('');
    xl = series.map((s, i) => `<span style="width:${px(slot)}"${i === hi ? ' class="on"' : ''}>${c.t(s.label)}</span>`).join('');
  } else {
    const inset = 16;
    const pts = series.map((s, i) => [inset + (n === 1 ? (plotW - 2 * inset) / 2 : (i / (n - 1)) * (plotW - 2 * inset)), plotH - (vals[i] / max) * plotH]);
    const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
    const gid = c.uid('cg');
    const col = safeColor(spec.accent) || HOUSE_ACCENT;
    plot = `<svg class="cl-svg" width="${px(plotW)}" height="${plotH}" viewBox="0 0 ${plotW.toFixed(1)} ${plotH}"><defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${col}" stop-opacity=".22"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></linearGradient></defs><path d="${d} L${pts[pts.length - 1][0].toFixed(1)} ${plotH} L${pts[0][0].toFixed(1)} ${plotH} Z" fill="url(#${gid})"/><path d="${d}" fill="none" stroke="${col}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/></svg>` +
      pts.map((p, i) => `<div class="cl-pt${i === hi ? ' on' : ''}"${c.k(`point${i + 1}`)} style="left:${px(p[0])};top:${px(p[1])}">${i === hi || (hi < 0 && i === n - 1) ? `<span class="cl-tip${p[0] > plotW * 0.86 ? ' tip-r' : p[0] < plotW * 0.14 ? ' tip-l' : ''}">${hw(fmtVal(series[i], unit))}</span>` : ''}</div>`).join('');
    const step = n > 8 ? Math.ceil(n / 7) : 1;
    xl = pts.map((p, i) => `<span class="cl-x${i === hi ? ' on' : ''}" style="left:${px(p[0])}">${i % step === 0 || i === hi ? c.ts(series[i].label) : ''}</span>`).join('');
  }
  const html = `<div class="cht-head">${spec.title ? `<h2 class="cht-title">${kt(c, 'title', spec.title)}</h2>` : ''}${spec.sub ? `<div class="cht-sub">${c.t(spec.sub)}</div>` : ''}</div>
<div class="cht-box" style="padding-left:${yw}px"><div class="cht-plot cht-${kind}" style="height:${plotH}px">${grid}<div class="cht-marks">${plot}</div></div><div class="cht-xl cht-xl-${kind}">${xl}</div></div>`;
  return { html: rootDiv(c, 'chart', spec, html, [spec.theme === 'dark' && 'pg-dark']), h: headH + 34 + plotH + xlH + 30, bg: null };
}

// ---------------------------------------------------------------- 9. code

const KW = {
  js: 'const let var function return if else for while do switch case break continue new class extends import from export default async await try catch finally throw typeof instanceof in of this super null undefined true false yield static get set void delete interface type enum implements as readonly public private protected',
  py: 'def return if elif else for while in not and or is import from as class with try except finally raise lambda yield None True False pass break continue global nonlocal async await self',
  sh: 'if then else elif fi for do done while until case esac function in export local return sudo cd echo source alias',
  go: 'func return if else for range switch case break continue package import var const type struct interface map chan go defer select nil true false',
  rs: 'fn let mut return if else for while loop match in impl struct enum trait pub use mod crate self Self as const static where async await move true false Some None Ok Err',
  css: 'important media supports keyframes from to',
  sql: 'select from where and or not insert into values update set delete create table join left right inner outer on group by order having limit as null is in like distinct count sum avg',
};
const LANGS = { md: 'txt', markdown: 'txt', txt: 'txt', text: 'txt', plain: 'txt', prompt: 'txt', javascript: 'js', jsx: 'js', ts: 'js', tsx: 'js', typescript: 'js', mjs: 'js', json: 'js', node: 'js', python: 'py', py: 'py', bash: 'sh', sh: 'sh', zsh: 'sh', shell: 'sh', console: 'sh', go: 'go', golang: 'go', rust: 'rs', rs: 'rs', css: 'css', scss: 'css', sql: 'sql', html: 'html', xml: 'html', vue: 'html', svelte: 'html' };
const LANG_DOT = { js: '#E8B90C', py: '#3B82C4', sh: '#3FB950', go: '#00ADD8', rs: '#DEA584', css: '#A855F7', sql: '#E38C00', html: '#E34C26', txt: '#8B949E' };

function codeLine(src, lang, st) {
  if (lang === 'txt') return esc(src);
  const kw = new Set(str(KW[lang] || KW.js).split(' ').map(w => (lang === 'sql' ? w.toLowerCase() : w)));
  const hashC = lang === 'py' || lang === 'sh';
  let out = '', s = src, i = 0;
  const span = (cls, t) => `<span class="tk-${cls}">${esc(t)}</span>`;
  if (st.block) {
    const e = s.indexOf('*/');
    if (e < 0) return span('c', s);
    out += span('c', s.slice(0, e + 2)); i = e + 2;
  }
  const re = lang === 'html'
    ? /(<!--.*?(?:-->|$))|("[^"]*"?|'[^']*'?)|(<\/?[A-Za-z][\w-]*|\/?>)|([A-Za-z_:-][\w:-]*)(?==)/g
    : new RegExp([
      hashC ? '(#.*$)' : lang === 'sql' ? '(--.*$)' : '(\\/\\/.*$)',
      '(\\/\\*.*?(?:\\*\\/|$))',
      '("(?:[^"\\\\]|\\\\.)*"?|\'(?:[^\'\\\\]|\\\\.)*\'?|`(?:[^`\\\\]|\\\\.)*`?)',
      '(\\b0x[\\da-fA-F]+\\b|\\b\\d[\\d_]*(?:\\.\\d+)?(?:e[+-]?\\d+)?\\b)',
      '([A-Za-z_$][\\w$]*)(?=\\s*\\()',
      '([A-Za-z_$][\\w$-]*)',
      lang === 'sh' ? '(\\$\\{?[\\w@#?*]+\\}?|\\s--?[\\w-]+)' : '(@[\\w.]+)',
    ].join('|'), 'g');
  re.lastIndex = i;
  let m, last = i, first = true;
  while ((m = re.exec(s))) {
    if (m.index > last) out += esc(s.slice(last, m.index));
    const t = m[0];
    if (lang === 'html') {
      out += m[1] ? span('c', t) : m[2] ? span('s', t) : m[3] ? span('tag', t) : span('at', t);
    } else if (m[1]) out += span('c', t);
    else if (m[2]) { out += span('c', t); if (!t.endsWith('*/')) st.block = true; }
    else if (m[3]) out += span('s', t);
    else if (m[4]) out += span('n', t);
    else if (m[5]) out += kw.has(t) ? span('k', t) : (lang === 'sh' && first) ? span('cmd', t) : span('f', t);
    else if (m[6]) {
      const prev = s.slice(0, m.index).trimEnd();
      if (kw.has(lang === 'sql' ? t.toLowerCase() : t)) out += span('k', t);
      else if (lang === 'sh' && first) out += span('cmd', t);
      else if (/^[A-Z][A-Za-z0-9]*$/.test(t) && lang !== 'sh') out += span('ty', t);
      else if (prev.endsWith('.') && lang !== 'sh') out += span('p', t);
      else if (/^\s*:/.test(s.slice(m.index + t.length)) && (lang === 'js' || lang === 'css')) out += span('p', t);
      else out += esc(t);
    } else if (m[7]) out += span(lang === 'sh' ? 'v' : 'dec', t);
    first = false;
    last = m.index + t.length;
    if (t === '') re.lastIndex++;
  }
  if (last < s.length) out += esc(s.slice(last));
  return out;
}

function pCode(spec, c) {
  const raw = str(spec.code).replace(/\t/g, '  ').replace(/\s+$/, '');
  const ext = str(spec.file).split('.').pop().toLowerCase();
  const lang = LANGS[str(spec.lang).toLowerCase()] || LANGS[ext] || (spec.terminal ? 'sh' : 'js');
  const term = !!spec.terminal;
  const dark = spec.theme ? spec.theme === 'dark' : term;
  const lines = raw.split('\n');
  const st = { block: false };
  const fs = Math.max(28, 30 * c.u);
  const cpl = Math.floor((c.W - 2 * Math.max(32, 40 * c.u) - (term ? 0 : 64 * c.u + 20)) / (fs * 0.6));
  let h = 0;
  const hiSet = new Set(arr(spec.highlight).map(Number));
  // [[key|...]] markup inside code: keys become inline spans around the (escaped, uncoloured) text
  const body = lines.map((ln, i) => {
    let html;
    const marks = keysIn(ln);
    if (marks.length) {
      c.keys.push(...marks);
      html = ln.split(/(\[\[[\w-]+\|[\s\S]*?\]\])/).map(seg => {
        const mm = /^\[\[([\w-]+)\|([\s\S]*)\]\]$/.exec(seg);
        return mm ? `<span class="hl" data-k="${esc(mm[1])}"><span class="hlw">${codeLine(mm[2], lang, st)}</span></span>` : codeLine(seg, lang, st);
      }).join('');
    } else if (term) {
      const pm = /^(\s*(?:[\w@.~:\/-]+\s*)?[$%❯])(\s.*)?$/.exec(ln);
      if (pm) html = `<span class="tk-pr">${esc(pm[1])}</span><span class="tk-cmdl">${codeLine(pm[2] || '', 'sh', st)}</span>`;
      else {
        const cls = /^\s*(✓|✔|✅|done|success|ok\b|\+)/i.test(ln) ? 'ok' : /^\s*(✗|✘|error|err!|fail|×)/i.test(ln) ? 'err' : /^\s*(warn|!)/i.test(ln) ? 'warn' : /^\s*(>|→|info)/i.test(ln) ? 'info' : 'out';
        html = `<span class="tk-${cls}">${esc(ln)}</span>`;
      }
    } else html = codeLine(ln, lang, st);
    const rows = Math.max(1, Math.ceil(ln.length / Math.max(10, cpl)));
    h += rows * fs * 1.5;
    // the key sits on the line's text (rings hug the code, not the full-width row)
    return `<div class="cd-ln${hiSet.has(i + 1) ? ' cd-hi' : ''}">${term ? '' : `<span class="cd-no">${i + 1}</span>`}<span class="cd-tx"><span class="hlw"${c.k(`line${i + 1}`)}>${html || ' '}</span></span></div>`;
  }).join('');
  const file = str(spec.file || (term ? 'zsh' : 'index.js'));
  let head;
  if (term) {
    head = `<header class="cd-bar cd-tbar"><span class="cd-tab on">${icon('term')}<b>${esc(spec.title || file)}</b></span><span class="cd-tab">${icon('plus')}</span><span class="cd-sp"></span><span class="cd-path">${esc(spec.cwd || '~/project')}</span></header>`;
  } else {
    const tabs = [file, ...arr(spec.tabs)].map((f, i) => `<span class="cd-tab${i === 0 ? ' on' : ''}"><i class="cd-dot" style="background:${LANG_DOT[LANGS[str(f).split('.').pop().toLowerCase()] || lang] || LANG_DOT.txt}"></i><b>${esc(f)}</b>${i === 0 ? icon('x', 'cd-x') : ''}</span>`).join('');
    head = `<header class="cd-bar">${tabs}</header>${spec.path ? `<div class="cd-crumb">${esc(spec.path)}</div>` : ''}`;
  }
  const html = `${head}<div class="cd-body">${body}</div>`;
  return { html: rootDiv(c, 'code', spec, html, [term ? 'cd-term' : 'cd-editor', dark && 'pg-dark']), h: 86 + (spec.path ? 54 : 0) + 30 + h + 40, bg: null };
}

// ---------------------------------------------------------------- 10. hero

function pHero(spec, c) {
  const brand = str(spec.brand || 'Acme');
  const nav = arr(spec.nav);
  const badges = arr(spec.badges);
  const img = spec.image;
  const ar = img ? clamp(aspectOf(img, null, c, 0.6), 0.35, 1) : 0;
  const ctas = arr(spec.cta);
  const html = `<header class="he-nav">${logoMark(c, brand, safeColor(spec.accent))}<span class="he-brand"${c.k('brand')}>${hw(brand)}</span>${c.narrow || !nav.length ? '' : `<nav>${nav.slice(0, c.W < 900 ? 2 : 4).map(n => `<span>${esc(n)}</span>`).join('')}</nav>`}<span class="he-sp"></span>${c.narrow ? icon('menu') : `<span class="he-sign">${esc(spec.signup || 'Get started')}</span>`}</header>
<section class="he-main">
${badges[0] ? `<span class="he-pill"${c.k('badge1')}><b>New</b>${c.ts(badges[0])}${icon('chevR')}</span>` : ''}
<h1 class="he-h">${kt(c, 'headline', spec.headline || '')}</h1>
${spec.sub ? `<p class="he-sub">${kt(c, 'sub', spec.sub)}</p>` : ''}
${ctas.length ? `<div class="he-ctas"><span class="he-cta"${c.k('cta')}>${c.ts(ctas[0])}</span>${ctas[1] ? `<span class="he-cta2"${c.k('cta2')}>${c.ts(ctas[1])}</span>` : ''}</div>` : ''}
${badges.length > 1 ? `<div class="he-proof">${badges.slice(1).map((b, i) => `<span${c.k(`badge${i + 2}`)}>${icon('check')}${c.ts(b)}</span>`).join('')}</div>` : ''}
</section>
${img ? `<div class="he-shot"${c.k('image')}><img src="${esc(img)}" alt="" style="aspect-ratio:${(1 / ar).toFixed(4)}"></div>` : ''}`;
  const sh = c.short;
  let h = 96 * c.u + (sh ? 22 : 46 * c.u) + (badges[0] ? c.fsMeta * 1.42 + 18 + (sh ? 18 : 26 * c.u) : 0) + th(spec.headline, c.fsH1 * 1.08, 1.05, c.inner, 0.5)
    + (spec.sub ? th(spec.sub, c.fsBody, 1.45, c.inner * 0.92) + (sh ? 14 : 22 * c.u) : 0) + (ctas.length ? Math.max(70, 80 * c.u) + (sh ? 22 : 34 * c.u) : 0) + (badges.length > 1 ? c.fsMeta * 1.42 + 24 * c.u : 0) + 30;
  if (img) h += (c.W - 1.2 * c.pad) * ar + 44 * c.u;
  return { html: rootDiv(c, 'hero', spec, html, [spec.theme === 'dark' && 'pg-dark']), h, bg: img || null };
}

// ---------------------------------------------------------------- 11. search

function pSearch(spec, c) {
  const results = arr(spec.results).map(r => (typeof r === 'string' ? { title: r } : r || {}));
  const q = str(spec.query);
  const tabs = arr(spec.tabs).length ? arr(spec.tabs) : ['All', 'Images', 'Videos', 'News', 'Shopping'];
  let h = 44 * c.u + Math.max(76, 90 * c.u) + c.fsMeta * 1.42 + 36 + (c.short ? 0 : 18 * c.u + 4 + 26 * 1.42);
  const res = results.map((r, i) => {
    const url = str(r.url || 'example.com');
    const host = url.replace(/^https?:\/\//, '').split(/[/?#]/)[0];
    const site = str(r.site || host.replace(/^www\./, '').split('.')[0].replace(/^./, ch => ch.toUpperCase()));
    const crumbs = url.replace(/^https?:\/\//, '').split('/').filter(Boolean);
    const crumb = `https://${crumbs[0] || host}${crumbs.length > 1 ? ' › ' + crumbs.slice(1).join(' › ') : ''}`;
    const [a] = gradFor(host);
    h += 48 * c.u + 1.5 + 66 + 22 + th(r.title, c.fsBody * 1.1, 1.28, c.inner, 0.5) + (r.snippet ? th((r.date ? r.date + ' — ' : '') + str(r.snippet), Math.max(28, c.fsMeta * 1.04), 1.5, c.inner, 0.48) : 0);
    return `<div class="se-r${r.ad ? ' se-ad' : ''}"${c.k(`r${i + 1}`)}><div class="se-src"><span class="se-fav" style="background:${a}">${esc(site.slice(0, 1).toUpperCase())}</span><div class="se-meta"><div class="se-site">${r.ad ? '<b>Sponsored</b>' : ''}${esc(site)}</div><div class="se-url">${esc(crumb)}</div></div>${icon('more')}</div><h3 class="se-t">${kt(c, `r${i + 1}-title`, r.title || '')}</h3>${r.snippet ? `<p class="se-sn">${r.date ? `<span class="se-dt">${esc(r.date)} — </span>` : ''}${c.t(r.snippet)}</p>` : ''}</div>`;
  }).join('');
  const html = `<div class="se-top"><span class="se-logo">${sparkleSvg('se-lg')}</span><div class="se-box${spec.typed ? ' tc-wait' : ''}">${icon('search')}<span class="se-q"${c.k('query')}>${typeable(c, q)}</span><span class="se-sp"></span>${icon('x', 'se-x')}<i class="se-div"></i>${icon('mic', 'se-mic')}</div></div>
<nav class="se-tabs">${tabs.map((t, i) => `<span${i === 0 ? ' class="on"' : ''}>${esc(t)}</span>`).join('')}</nav>
<div class="se-count">${esc(spec.count || 'About 1,240,000 results (0.38 seconds)')}</div>
<div class="se-list">${res}</div>`;
  return { html: rootDiv(c, 'search', spec, html), h, bg: null };
}

// ---------------------------------------------------------------- 12. table

function cell(c, v) {
  if (v === true || /^(yes|true|✓|✔|✅)$/i.test(str(v).trim())) return `<span class="tb-yes">${icon('check')}</span>`;
  if (v === false || /^(no|false|✗|✘|❌|×|-|—)$/i.test(str(v).trim())) return `<span class="tb-no">${icon('x')}</span>`;
  return c.t(v);
}

function pTable(spec, c) {
  const cols = arr(spec.columns);
  const rows = arr(spec.rows).map(arr);
  const pickRow = v => (typeof v === 'number' ? v : typeof v === 'string' ? rows.findIndex(r => slug(strip(r[0])) === slug(v)) : -1);
  const hr = pickRow(spec.highlightRow);
  const hc = typeof spec.highlightCol === 'number' ? spec.highlightCol : typeof spec.highlightCol === 'string' ? cols.findIndex(x => slug(strip(x)) === slug(spec.highlightCol)) : -1;
  const ncol = Math.max(cols.length, ...rows.map(r => r.length), 1);
  const firstW = ncol <= 2 ? 50 : ncol === 3 ? 40 : 34;
  const thead = cols.length ? `<thead><tr>${cols.map((x, j) => `<th${j === hc ? ' class="tb-hc"' : ''}><span${str(x) ? c.k(`col${j + 1}`) : ''}>${c.t(x)}</span>${j === hc && spec.colBadge !== false ? `<em>${esc(spec.colBadge || 'Best')}</em>` : ''}</th>`).join('')}</tr></thead>` : '';
  const tbody = rows.map((r, i) => `<tr class="${i === hr ? 'tb-hi' : ''}"${c.k(`row${i + 1}`)}>${Array.from({ length: ncol }, (_, j) => `<td class="${j === hc ? 'tb-hc' : ''}"><span class="tb-c"${c.k(`cell-${i + 1}-${j + 1}`)}>${cell(c, r[j] ?? '')}</span></td>`).join('')}</tr>`).join('');
  const html = `<div class="tb-head">${spec.title ? `<h2 class="tb-title">${kt(c, 'title', spec.title)}</h2>` : ''}${spec.sub ? `<p class="tb-sub">${c.t(spec.sub)}</p>` : ''}</div>
<div class="tb-wrap"><table class="tb tb-n${ncol}"><colgroup><col style="width:${firstW}%">${Array.from({ length: ncol - 1 }, () => `<col style="width:${((100 - firstW) / Math.max(1, ncol - 1)).toFixed(2)}%">`).join('')}</colgroup>${thead}<tbody>${tbody}</tbody></table></div>
${spec.note ? `<p class="tb-note">${c.t(spec.note)}</p>` : ''}`;
  const firstPx = (c.inner * firstW) / 100 - 40, otherPx = (c.inner * (100 - firstW)) / 100 / Math.max(1, ncol - 1) - 24;
  let h = 40 + (spec.title ? th(spec.title, c.fsH2, 1.15, c.inner, 0.53) + 10 : 0) + (spec.sub ? th(spec.sub, c.fsBody, 1.4, c.inner) + 10 : 0) + 30 + (cols.length ? 84 : 0);
  rows.forEach(r => { h += Math.max(...Array.from({ length: ncol }, (_, j) => th(r[j] === true || r[j] === false ? 'x' : str(r[j]) || 'x', c.fsBody * 0.97, 1.3, j ? otherPx : firstPx)), 40) + 46; });
  return { html: rootDiv(c, 'table', spec, html), h: h + (spec.note ? 60 : 0) + 40, bg: null };
}

// ---------------------------------------------------------------- 13. doc

function pDoc(spec, c) {
  const blocks = arr(spec.blocks).map(b => (typeof b === 'string' ? { type: 'p', text: b } : b || {}));
  const cover = spec.cover;
  const coverCol = safeColor(cover);
  let h = 76 * c.u + (cover ? 120 * c.u + 20 : 40 * c.u) + (spec.icon ? (cover ? 30 : 86) : 0) + th(spec.title, c.fsH1, 1.15, c.inner, 0.53) + 30;
  const w = c.inner;
  const body = blocks.map((b, i) => {
    const key = `b${i + 1}`;
    let text = str(b.text);
    switch (b.type) {
      case 'h': case 'h2': case 'heading':
        h += th(text, c.fsH2 * 0.92, 1.2, w, 0.53) + 46;
        return `<h2 class="dc-h"${c.k(key)}>${c.tw(text)}</h2>`;
      case 'quote':
        h += th(text, c.fsBody * 1.04, 1.5, w - 40) + 36;
        return `<blockquote class="dc-q"${c.k(key)}>${c.tw(text)}</blockquote>`;
      case 'todo': case 'check': {
        let done = !!b.done;
        const mm = /^\s*\[( |x|X)\]\s*/.exec(text);
        if (mm) { done = mm[1] !== ' '; text = text.slice(mm[0].length); }
        h += th(text, c.fsBody, 1.45, w - 70) + 18;
        return `<div class="dc-td${done ? ' done' : ''}"${c.k(key)}><span class="dc-box">${done ? icon('check') : ''}</span><span class="dc-tt">${c.tw(text)}</span></div>`;
      }
      case 'callout':
        h += th(text, c.fsBody, 1.5, w - 120) + 80;
        return `<div class="dc-co"${c.k(key)}><span class="dc-ci">${icon(b.icon === 'star' ? 'star' : 'bulb')}</span><div>${c.tw(text)}</div></div>`;
      case 'bullet': case 'li':
        h += th(text, c.fsBody, 1.5, w - 50) + 10;
        return `<div class="dc-li"${c.k(key)}><i></i><span>${c.tw(text)}</span></div>`;
      case 'divider': case 'hr':
        h += 40;
        return `<hr class="dc-hr"${c.k(key)}>`;
      default:
        h += th(text, c.fsBody, 1.55, w) + 22;
        return `<p class="dc-p"${c.k(key)}>${c.tw(text)}</p>`;
    }
  }).join('');
  const crumb = arr(spec.path).length ? arr(spec.path) : [spec.workspace || 'Workspace'];
  const html = `<header class="dc-top">${icon('doc')}<span class="dc-crumb">${[...crumb, strip(spec.title || 'Untitled')].map(esc).join('<i>/</i>')}</span><span class="dc-sp"></span><span class="dc-share">Share</span>${icon('star')}${icon('more')}</header>
${cover ? `<div class="dc-cover"${coverCol ? ` style="background:${coverCol}"` : ''}>${coverCol ? '' : `<img src="${esc(cover)}" alt="">`}</div>` : ''}
<div class="dc-main${cover ? ' has-cover' : ''}">
${spec.icon ? `<div class="dc-icon">${esc(spec.icon)}</div>` : ''}
<h1 class="dc-title">${kt(c, 'title', spec.title || 'Untitled')}</h1>
${spec.meta ? `<div class="dc-meta">${c.t(spec.meta)}</div>` : ''}
${body}
</div>`;
  return { html: rootDiv(c, 'doc', spec, html), h: h + (spec.meta ? 50 : 0) + 40, bg: cover && !coverCol ? cover : null };
}

// ---------------------------------------------------------------- 14. html passthrough

function scopeCss(css, scope) {
  css = str(css).replace(/\/\*[\s\S]*?\*\//g, '').replace(/@import[^;]*;/gi, '').replace(/@charset[^;]*;/gi, '');
  let out = '', i = 0;
  while (i < css.length) {
    const open = css.indexOf('{', i);
    if (open < 0) break;
    const sel = css.slice(i, open).trim();
    let depth = 1, j = open + 1;
    while (j < css.length && depth) { if (css[j] === '{') depth++; else if (css[j] === '}') depth--; j++; }
    const body = css.slice(open + 1, j - 1);
    if (/^@(media|supports|container|layer)\b/i.test(sel)) out += `${sel}{${scopeCss(body, scope)}}`;
    else if (/^@(-webkit-)?keyframes|^@font-face|^@property/i.test(sel)) { /* dropped: no animation or web fonts */ }
    else if (!sel.startsWith('@')) {
      out += sel.split(',').map(s => {
        s = s.trim();
        if (!s) return '';
        if (/^(:root|html|body)\b/.test(s)) return s.replace(/^(:root|html|body)(\s+(html|body)\b)?/, scope);
        return `${scope} ${s}`;
      }).filter(Boolean).join(',') + `{${body.replace(/url\(\s*['"]?https?:[^)]*\)/gi, 'none')}}`;
    }
    i = j;
  }
  return out;
}

function pHtml(spec, c) {
  const raw = str(spec.html).replace(/<script[\s\S]*?<\/script>/gi, '').replace(/\son\w+="[^"]*"/gi, '');
  const scope = `pgh-${slug(c.id) || 'x'}-${hash(raw + str(spec.css)).toString(36)}`;
  for (const m of raw.matchAll(/data-k="([^"]+)"/g)) c.keys.push(m[1]);
  const css = spec.css ? `<style>${scopeCss(spec.css, '.' + scope)}</style>` : '';
  const html = rootDiv(c, 'html', spec, css + raw, [scope]);
  const imgM = /<img[^>]+src="([^"]+)"/i.exec(raw);
  return { html, h: spec.contentHeight || c.H, bg: imgM ? imgM[1] : null };
}

// ---------------------------------------------------------------- fallback

function pText(spec, c) {
  const html = `<div class="dc-main">${spec.title ? `<h1 class="dc-title">${kt(c, 'title', spec.title)}</h1>` : ''}${arr(spec.text || spec.body).map((t, i) => `<p class="dc-p"${c.k(`p${i + 1}`)}>${c.tw(t)}</p>`).join('')}</div>`;
  return { html: rootDiv(c, 'doc', spec, html), h: c.H, bg: null };
}

// ---------------------------------------------------------------- entry

const RENDER = { image: pImage, post: pPost, article: pArticle, chat: pChat, app: pApp, list: pList, stat: pStat, chart: pChart, code: pCode, hero: pHero, search: pSearch, table: pTable, doc: pDoc, html: pHtml };

export function renderPage(spec = {}, ctx = {}) {
  spec = spec || {};
  let kind = str(spec.kind || spec.type || (spec.src ? 'image' : spec.html ? 'html' : 'doc'));
  if (kind === 'terminal') spec = { ...spec, terminal: true };
  if (kind === 'messages') spec = { app: 'messages', ...spec };
  kind = ALIASES[kind] || kind;
  const c = makeCtx(ctx);
  const fn = RENDER[kind] || pText;
  const r = fn(spec, c);
  const keys = [...new Set(c.keys.filter(Boolean))];
  return { html: r.html, keys, contentHeight: Math.round(Math.max(c.H, r.h || 0)), bgImage: r.bg || null };
}
