"""Hear a sound with earshot (CLAP + AudioSet, on this computer) and say whether it fits its job.
  python studio/listen.py cues [cue ...]     hear named cues from styles/sfx.json (default: every cue a job can use) and cache the result
  python studio/listen.py files <path> ...   [--role whoosh|click|other] hear any files and print what they sound like
Run with the earshot venv: ~/.cache/earshot-venv/Scripts/python.exe. Results are cached in styles/sfx-heard.json.
A verdict comes from what Bryan rejected: kazoo/squeaky, bonk/thud, booms, scratchy glitches, beeps. It can catch those; it can't judge taste."""
import json
import os
import re
import sys

os.environ.setdefault('EARSHOT_HOME', os.path.expanduser('~/.cache/earshot-home'))
os.environ.setdefault('EARSHOT_OFFLINE', '1')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'engines', 'earshot'))
from earshot.describe import describe  # noqa: E402

WHOOSH = r'whoosh|swoosh|swish|swipe|air|wind|gust'
BONK = r'thud|thump|bonk|wooden block|kick drum'
BOOM = r'boom|explosion|sub drop|braam|rumble'
NO_BONK_CHECK = ('wrong-buzz', 'money', 'mon-', 'stamp', 'ui-glass-shatter', 'rubber-stretch')


def role_of(name):
    return 'whoosh' if name.startswith(('wh-', 'wht-')) or 'whoosh' in name else 'other' if name.startswith(NO_BONK_CHECK) else 'click'


def hear(path):
    d = describe(path, top=6)
    tags = [(t.get('tag') or t.get('label') or t.get('name') or t.get('text') or t.get('phrase') or t.get('desc') or next(v for v in t.values() if isinstance(v, str)), round(float(t.get('z', 0)), 1)) for t in d['top_tags']]
    return tags, d.get('summary', '')[:160]


def verdict(name, tags, role=None):
    """Judged by the sound's job, because very short clicks confuse the model: it hears whooshes well, tiny ticks poorly."""
    role = role or role_of(name)
    top = tags[0][0] if tags else ''
    if any(re.search(BOOM, t, re.I) and z >= 2.5 for t, z in tags[:2]):
        return f'a boom (Bryan: "remove the random booms"): heard "{top}"'
    if role == 'whoosh':
        if re.search(r'squeak|kazoo', ' '.join(t for t, z in tags[:2] if z >= 2), re.I):
            return f'squeaky or kazoo-like (Bryan: "sounds like a kazoo"): heard "{top}"'
        if not re.search(WHOOSH, top, re.I):
            return f'not a whoosh (Bryan: "supposed to sound like wind blowing woosh"): heard "{top}"'
    elif role == 'click':
        for t, z in tags:
            if z >= 1.8 and re.search(BONK, t, re.I):
                return f'a bonk or thud (Bryan: "an annoying bonk"): heard "{t}" (z {z})'
    return None


def main():
    mode, args = sys.argv[1], sys.argv[2:]
    if mode == 'files':
        role = None
        if args and args[0] == '--role':
            role, args = args[1], args[2:]
        for f in args:
            tags, _ = hear(f)
            v = verdict(os.path.basename(f), tags, role)
            print(os.path.basename(f), 'REJECT: ' + v if v else 'ok', tags[:3])
        return
    lib = json.load(open(os.path.join(ROOT, 'styles/sfx.json'), encoding='utf-8'))['cues']
    p = os.path.join(ROOT, 'styles/sfx-heard.json')
    cache = json.load(open(p, encoding='utf-8')) if os.path.exists(p) else {}
    names = args or [k for k in lib if re.match(r'wh-|wht-|lst-|prm-|mon-|money|stamp|wrong-buzz|ui-', k)]
    for n in names:
        f = os.path.join(ROOT, 'assets/sfx', lib[n]['file'])
        m = int(os.path.getmtime(f))
        if cache.get(n, {}).get('mtime') == m:
            continue
        tags, summary = hear(f)
        cache[n] = dict(mtime=m, tags=tags, reject=verdict(n, tags), summary=summary)
        print(n.ljust(18), 'REJECT' if cache[n]['reject'] else 'ok    ', tags[:3], flush=True)
        open(p, 'w', encoding='utf-8').write(json.dumps(cache, indent=1, ensure_ascii=False))
    print(len(cache), 'cues heard;', sum(1 for v in cache.values() if v.get('reject')), 'rejected')


if __name__ == '__main__':
    main()
