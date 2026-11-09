"""Build assets/boards/CATALOG.md and the dark gallery from his catalog and index. Usage: python catalog.py <his repo> <studio root>"""
import re
import sys

R, S = sys.argv[1:3]
cat = open(R + '/skills/explainer-board-system/references/board-catalog.md', encoding='utf8').read().splitlines()
out = ['# Board library: pick a graphic from what is being said', '',
       '74 animated boards in the Elivate premium look, in `assets/boards/`. Open `assets/boards/index.html` to watch them all.',
       'Match the "say it when" words against the transcript, then build from that board. Layouts and motion are from',
       'sirioberati/YouTube-AI-Motion-Graphics (MIT); see `assets/boards/README.md` for how to use one in a video.', '',
       'A board is a starting point, not a template to stamp out: rotate the kind of visual every beat (`styles/EDIT-PREFERENCES.md`).', '']
n = 0
sec = None
for l in cat:
    if l.startswith('## '):
        sec = l[3:]
        if sec.startswith('Two boards'):
            out += ['', '## Two boards, same job', '']
            continue
        out += ['', l, '']
        continue
    m = re.match(r'- `([\w.]+)\.html` · \*\*(.+?)\*\* · (.*)', l)
    if m:
        f, name, rest = m.groups()
        say = re.search(r'say it when:\s*(.*)$', rest)
        first = rest.split('·')[0].strip()
        purpose = first.split('. ')[0].rstrip('.') if first.startswith('For ') else ''
        out.append(f'- `{f}` **{name}**' + (f': {purpose}.' if purpose else '.') + (f' Say it when: {say.group(1).strip()}' if say else ''))
        n += 1
    elif sec and sec.startswith('Two boards') and l.strip():
        out.append(re.sub(r'#[0-9A-Fa-f]{6}', '', l))
open(S + '/assets/boards/CATALOG.md', 'w', encoding='utf8').write('\n'.join(out).rstrip() + '\n')
print('catalog entries', n)

h = open(R + '/boards/index.html', encoding='utf8').read()
h = re.sub(r'https://fonts\.googleapis\.com/css2\?[^"]+', 'https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700;800;900&amp;display=swap', h)
h = h.replace('--ink:#1F2937;--mut:#6B7280;--line:#E5E7EB;--wash:#F6F7F9;--acc:#2563EB', '--ink:#FFFFFF;--mut:rgba(255,255,255,.62);--line:rgba(196,181,253,.22);--wash:#050308;--acc:#8B5CF6')
h = h.replace('background:#fff;border:1.5px', 'background:#170A32;border:1.5px').replace('background:#fff;margin-bottom', 'background:#050308;margin-bottom')
h = h.replace('rgba(17,24,39,.06)', 'rgba(0,0,0,.4)').replace('rgba(17,24,39,.12)', 'rgba(139,92,246,.3)')
h = re.sub(r'<header>.*?</header>', '<header><h1>Elivate board library</h1><p>111 animated graphics in the premium look: the ones you approved, then the 74 boards. Click one to open it live. Under each: when to use it, in the words you\'d say.</p></header>', h, 1, flags=re.S)
h = h.replace('"JetBrains Mono",monospace', 'Inter,sans-serif')
open(S + '/assets/boards/index.html', 'w', encoding='utf8').write(h)
print('gallery cards', h.count('class="c"'), 'tein' in h.lower())
