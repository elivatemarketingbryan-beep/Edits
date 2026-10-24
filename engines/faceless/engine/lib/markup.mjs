// Inline markup for any text Claude writes into a card:
//   [[key|some words]]  -> a target that beats (highlight, ring, zoom, click) can point at;
//                          its words are wrapped so the selection sweep runs in reading order
//   **bold**            -> <strong>
// Everything else is HTML-escaped.

export function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function words(text) {
  const parts = String(text).split(/(\s+)/);
  const out = [];
  for (let i = 0; i < parts.length; i += 2) out.push(`<span class="hlw">${esc(parts[i])}${parts[i + 1] ? ' ' : ''}</span>`);
  return out.join('');
}

export function markup(text) {
  const src = String(text ?? '');
  let html = '';
  let last = 0;
  const re = /\[\[([a-zA-Z0-9_-]+)\|([\s\S]*?)\]\]/g;
  let m;
  while ((m = re.exec(src))) {
    html += plain(src.slice(last, m.index));
    html += `<span class="hl" data-k="${esc(m[1])}">${words(m[2])}</span>`;
    last = m.index + m[0].length;
  }
  return html + plain(src.slice(last));
}

function plain(s) {
  return esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
}

// Keys defined by [[key|...]] markup inside a string.
export function keysIn(text) {
  return [...String(text ?? '').matchAll(/\[\[([a-zA-Z0-9_-]+)\|/g)].map(m => m[1]);
}

export const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
