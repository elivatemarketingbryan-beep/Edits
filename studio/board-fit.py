"""Fit a library board to a real moment: real words on it, each part landing on the word that names it, ready for HyperFrames.
  python studio/board-fit.py --list <board>     show the board's animated parts, numbered
  python studio/board-fit.py <plan.json>        write the fitted board
Plan: {"job":"<id>","board":"D48Funnel","name":"funnel-stages","t0":127.6,"dur":6.2,"title":"Every lead has a stage","shift":400,"speaker":"remove",
       "drop":[2,5],"beats":[{"word":"New","parts":[0,1],"text":{"1":"New leads"}}]}
`word` is found in the job's words.json at or after t0, in order. `shift` moves the board's parts sideways, for re-centring once the speaker box is gone."""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BOARDS = os.path.join(ROOT, 'assets', 'boards')
PART = re.compile(r'<(div|svg|span)\b[^>]*style="[^"]*animation-delay:\s*([\d.]+)s[^"]*"[^>]*>')
LEAD = 0.55  # how long before the word a part starts moving, so it is in place as the word lands


def end_of(h, m):
    """Index just past the element that starts at match m, balancing nested tags of the same name."""
    tag = m.group(1)
    tok = re.compile(rf'<{tag}\b|</{tag}>')
    depth, i = 1, m.end()
    while depth:
        t = tok.search(h, i)
        depth += -1 if t.group(0).startswith('</') else 1
        i = t.end()
    return i


def parts(h):
    body = h.find('<div class="ebs"')
    return [m for m in PART.finditer(h, body)]


def label(h, m):
    return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', h[m.end():end_of(h, m)])).strip()[:50]


if sys.argv[1] == '--list':
    h = open(os.path.join(BOARDS, sys.argv[2] + '.html'), encoding='utf8').read()
    for i, m in enumerate(parts(h)):
        print(f'{i:>3}  {m.group(1):4} delay {m.group(2):>5}s  {label(h, m) or "(shape)"}')
    sys.exit(0)

p = json.load(open(sys.argv[1], encoding='utf8'))
h = open(os.path.join(BOARDS, p['board'] + '.html'), encoding='utf8').read()
words = json.load(open(os.path.join(ROOT, 'projects', p['job'], 'transcript', 'words.json'), encoding='utf8'))['words']
t0, dur = p['t0'], p['dur']
clean = lambda w: re.sub(r"[^\w']", '', w).lower()

# find each beat's word, in order
cursor = t0
times = []
for b in p['beats']:
    hit = next((w for w in words if w['s'] >= cursor and clean(w['w']) == clean(b['word'])), None)
    if not hit:
        sys.exit(f'word not found after {cursor:.2f}s: {b["word"]}')
    times.append(hit['s'])
    cursor = hit['s']
    if hit['s'] > t0 + dur:
        sys.exit(f'"{b["word"]}" lands at {hit["s"]:.2f}s, after the board ends')

# collect edits on the numbered parts, applied back to front so offsets stay valid
ms = parts(h)
edits = {}
for b, t in zip(p['beats'], times):
    base = float(ms[b['parts'][0]].group(2))
    for i in b['parts']:
        edits[i] = dict(delay=max(0, t - t0 - LEAD + (float(ms[i].group(2)) - base) * 0.6), text=b.get('text', {}).get(str(i)))
drop = set(p.get('drop', []))
shift = p.get('shift', 0)
for i in range(len(ms) - 1, -1, -1):
    m = ms[i]
    if i in drop:
        h = h[:m.start()] + h[end_of(h, m):]
        continue
    if i not in edits:
        sys.exit(f'part {i} ({label(h, m)}) has no beat and is not dropped')
    e = edits[i]
    end = end_of(h, m)
    if e['text'] is not None:
        h = h[:m.end()] + e['text'] + h[end - len(f'</{m.group(1)}>'):]
    tag = re.sub(r'animation-delay:\s*[\d.]+s', f'animation-delay:{e["delay"]:.3f}s' + (f';translate:{shift}px 0' if shift else ''), m.group(0))
    h = h[:m.start()] + tag + h[m.end():]

# play once, over the board's real length, and hold
h = re.sub(r'animation:\s*(\w+)\s+[\d.]+m?s\s+([^;}]*?)infinite', lambda a: f'animation:{a.group(1)} {dur}s {a.group(2)}1', h)
if p.get('title'):
    h = re.sub(r'<div class="title[^"]*"[^>]*><span>.*?</span></div>', f'<div class="title" style="left:0;top:64px;width:1920px;justify-content:center;font-size:76px"><span>{p["title"]}</span></div>', h, 1, flags=re.S)
h = h.replace('<div class="sample-tag">SAMPLE</div>', '')
h = re.sub(r'<div class="n"[^>]*>\s*example data[^<]*</div>', '', h, flags=re.I)
if p.get('speaker') == 'remove':
    h = re.sub(r'<div class="camera".*?</video></div>', '', h, 1, flags=re.S)
cid = re.sub(r'\W+', '-', p['name'])
h = h.replace('<div class="ebs">', f'<div class="ebs" id="root" data-composition-id="{cid}" data-start="0" data-width="1920" data-height="1080" data-duration="{dur}">', 1)
h = re.sub(r'<script>function f\(\).*?</script>', '', h, 1, flags=re.S)
# HyperFrames waits for a registered timeline; the CSS parts are seeked by its css adapter, so an empty one of the right length is enough
h = h.replace('</body>', f'<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script><script>window.__timelines=window.__timelines||{{}};window.__timelines["{cid}"]=gsap.timeline({{paused:true}}).to({{}},{{duration:{dur}}});</script></body>', 1)
out = os.path.join(ROOT, 'projects', p['job'], 'boards')
os.makedirs(out, exist_ok=True)
f = os.path.join(out, p['name'] + '.html')
open(f, 'w', encoding='utf8').write(h)
print(f'wrote projects/{p["job"]}/boards/{p["name"]}.html')
for b, t in zip(p['beats'], times):
    print(f'  "{b["word"]}" at {t:.2f}s -> lands {t - t0:.2f}s into the board')
