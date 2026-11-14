"""Turns a list of timed moments into jobs/<id>/sfx.json, following styles/EDIT-PREFERENCES.md "Sound":
approved cues only, varied, no sound twice in a row, none more than 6 times (list ticks excepted), half the text pops silent,
never two sounds on one beat, and a light opening (the gate: sounds at least 3 s apart in the first 30 s).

  python studio/sfx-plan.py <job-id> <events.json>
  events.json: {"T": [transitions], "P": [text pops], "L": [list items], "S": [stages], "X": [X / failure], "M": [prices], "O": [card / object pops]}
"""
import json, sys, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
CUES = {'T': ['wh-01', 'wh-03', 'wh-05', 'wh-02', 'wh-04', 'wh-06', 'wh-07', 'wh-08', 'wh-09', 'wh-11'],
        'P': ['wht-01', 'wht-03', 'wht-05', 'wht-02', 'wht-04', 'wht-06', 'wht-07'],
        'L': ['lst-12'], 'S': ['lst-stage'], 'X': ['wrong-buzz'], 'M': ['mon-01', 'mon-02', 'mon-04'],
        'O': ['prm-01', 'prm-02', 'prm-05', 'prm-09']}
PRIORITY = {'X': 0, 'M': 1, 'S': 2, 'L': 3, 'T': 4, 'O': 5, 'P': 6}
NOTE = {'T': 'transition', 'P': 'text pops in', 'L': 'list item', 'S': 'stage lights up', 'X': 'X / failure', 'M': 'price', 'O': 'card pops in'}

job, events = sys.argv[1], json.loads(pathlib.Path(sys.argv[2]).read_text())
dur = float(json.loads((ROOT / 'jobs' / job / 'job.json').read_text())['duration'])
ev = sorted([(float(t), k) for k, ts in events.items() for t in ts], key=lambda e: (e[0], PRIORITY[e[1]]))
# half the text pops stay silent
pops = [e for e in ev if e[1] == 'P']; silent = set(pops[1::2]); ev = [e for e in ev if e not in silent]
# keep the most important when two land close together
keep = []
for t, k in sorted(ev, key=lambda e: PRIORITY[e[1]]):
    # the gate (studio/preflight.mjs): in the first 30 s, consecutive sounds at least 3 s apart; after that, 0.4 s
    ok = all(abs(t - u) >= (3.1 if min(t, u) < 30 or max(t, u) < 30 else 0.4) for u, kk in keep)
    if ok: keep.append((t, k))
keep.sort()
out, uses, last = [], {}, None
for t, k in keep:
    pool = [c for c in CUES[k] if c != last and (k in 'LS' or uses.get(c, 0) < 6)]
    if not pool:   # the only cue for this kind just played (e.g. two X's in a row): use a light pop instead
        k = 'O'; pool = [c for c in CUES['O'] if c != last]
    c = min(pool, key=lambda c: (uses.get(c, 0), CUES[k].index(c)))
    uses[c] = uses.get(c, 0) + 1; last = c
    out.append({'cue': c, 'at': round(t, 2), 'note': NOTE[k]})
(ROOT / 'jobs' / job / 'sfx.json').write_text(json.dumps(out, indent=1))
print(job, len(out), 'sounds from', sum(len(v) for v in events.values()), 'moments')
