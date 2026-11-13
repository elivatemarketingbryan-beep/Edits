"""Writes captions.js for a design comp: chunks of up to 3 words from words.json, added to the comp's `tl` into #cap.
   python studio/design-captions.py <job-id> [design-dir] [words-per-chunk] [gold,words,...]"""
import json, re, sys, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
job = sys.argv[1]; d = pathlib.Path(sys.argv[2]) if len(sys.argv) > 2 else ROOT / 'projects' / job / 'design'
N = int(sys.argv[3]) if len(sys.argv) > 3 else 3
GOLD = set(sys.argv[4].lower().split(',')) if len(sys.argv) > 4 else set()
w = json.loads((ROOT / 'projects' / job / 'transcript' / 'words.json').read_text(encoding='utf-8'))['words']
cs, cur = [], []
for x in w:
    cur.append(x)
    if len(cur) == N or x['word'].endswith(('.', ',', '?', '!')): cs.append(cur); cur = []
if cur: cs.append(cur)
out = []
for i, c in enumerate(cs):
    a = c[0]['start']; b = min(c[-1]['end'] + .25, cs[i + 1][0]['start'] - .05) if i + 1 < len(cs) else c[-1]['end'] + .5
    g = any(re.search(r'[$%0-9]', x['word']) or re.sub(r'[^a-z]', '', x['word'].lower()) in GOLD for x in c)
    out.append([round(a, 2), round(max(b, a + .15), 2), ' '.join(x['word'] for x in c), g])
(d / 'captions.js').write_text('''(() => { const C = %s, box = document.getElementById('cap');
C.forEach(([a, b, t, g], i) => { const s = document.createElement('span'); s.textContent = t; if (g) s.className = 'g'; box.appendChild(s);
  tl.fromTo(s, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: .12 }, a); tl.set(s, { autoAlpha: 0 }, b); }); })();''' % json.dumps(out), encoding='utf-8')
print(len(out), 'caption chunks')
