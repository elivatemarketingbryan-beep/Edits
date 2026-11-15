"""After sfx.mjs place: adds each approved graphic to jobs/<id>/edits.json (type "graphic", why = the line it's timed to)
and points job.json at preview.mp4.   python studio/finish-edit.py <job-id>"""
import json, sys, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
jd = ROOT / 'jobs' / sys.argv[1]
edits = [e for e in json.loads((jd / 'edits.json').read_text(encoding='utf-8')) if e.get('type') != 'graphic'] if (jd / 'edits.json').exists() else []
g = json.loads((jd / 'graphics.json').read_text(encoding='utf-8'))
for x in g:
    edits.append({'type': 'graphic', 'start': x['t'], 'end': round(x['t'] + 2, 2), 'what': x['label'][:60], 'why': x['line'][:120]})
edits.sort(key=lambda e: e['start'])
(jd / 'edits.json').write_text(json.dumps(edits, indent=1, ensure_ascii=False), encoding='utf-8')
job = json.loads((jd / 'job.json').read_text(encoding='utf-8')); job['preview'] = 'preview.mp4'
(jd / 'job.json').write_text(json.dumps(job, indent=2), encoding='utf-8')
print(sys.argv[1], len(edits), 'edits')
