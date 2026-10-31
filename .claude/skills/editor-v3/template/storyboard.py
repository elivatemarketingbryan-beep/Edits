"""Builds the local review page: every shot, its starting frame, how it is edited, its credits."""
import os, sys, shutil, html, subprocess
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np, cv2
import gfx, comp, shots
from gfx import W, H, to8

os.chdir(os.path.dirname(os.path.abspath(__file__)))
OUT = 'storyboard'
os.makedirs(OUT + '/f', exist_ok=True)
RAW = 'raw'
import glob
PICS = sorted(glob.glob('pictures/*.*'))
BIG = {'red': (1.0, 0.10, 0.08), 'blue': (0.08, 0.24, 1.0), 'teal': (1.0, 1.0, 1.0)}


def load(path):
    im = cv2.cvtColor(cv2.imread(path), cv2.COLOR_BGR2RGB)
    return cv2.resize(im, (W, H), interpolation=cv2.INTER_CUBIC)


plates = {c: load(f'work/gen/still_{c}.png') for c in ('red', 'blue', 'teal')}


def grab(path, t):
    r = subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-ss', str(t), '-i', path, '-frames:v', '1', '-vf', f'scale={W}:{H}', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True)
    return np.frombuffer(r.stdout, np.uint8).reshape(H, W, 3)


def frame(s):
    k = s['kind']
    if k == 'S' or k == 'E':
        p = plates[s['ch']]
        if k == 'E':
            # stand-in for the review only: his teal gradient. The real plate is a Higgsfield still
            v = np.linspace(0, 1, H, dtype=np.float32)[:, None, None]
            top = np.array([0xc2, 0xcd, 0xc5], np.float32) / 255
            bot = np.array([0x61, 0x88, 0x8a], np.float32) / 255
            return np.tile(top * (1 - v ** 1.6) + bot * v ** 1.6, (1, W, 1))
        m = comp.head_matte(p, th=34 if s['ch'] != 'teal' else 60)
        z = s.get('zoom', 1.0)
        rgb = comp.camera(p.astype(np.float32) / 255, z)
        m = comp.camera(m, z)
        if s.get('big'):
            t, x, y, sz = s['big']
            rgb = comp.behind(rgb, m, [(t, W * x, H * y, sz, 1.0)], color=BIG[s['ch']], glow=0.8)
        if s.get('title'):
            rgb = comp.title(rgb, s['title'], 1.0, 0.0, 5.0, smear=0)
        if s.get('cap'):
            rgb = comp.caption(rgb, s['cap'], 0, 9, 1.0)
        return rgb
    if k == 'B':
        name, t, tight = s['broll']
        fr = grab(f'{RAW}/{name}.mov', t).astype(np.float32) / 255
        if tight:
            fr = comp.camera(fr, 1.8, ax=W * 0.42, ay=H * 0.86)
        return comp.caption(fr, s.get('cap', ''), 0, 9, 1.0)
    g = s.get('gfx')
    if g == 'chart1':
        return gfx.chart_frame(2.3, 20000, 18540, 0.45, 1.6)
    if g == 'chart2':
        return gfx.chart_frame(2.0, 70000, 65000, 0.05, 1.6, seed=2, zoom0=1.12, zoom1=1.22, show_button=False)
    if g == 'chart3':
        return gfx.chart_frame(2.9, 132000, 122000, 0.05, 2.0, seed=3, zoom0=1.25, zoom1=2.05, zoom_dur=3.1, show_button=False)
    if g == 'typed1':
        return gfx.typed_frame(['SPENT 1,000 CREDITS', 'ON HIGGSFIELD.'], 2.2, zoom1=1.25, dur=2.8)
    if g == 'typed2':
        return gfx.typed_frame(['OR WERE THOSE VIEWS', 'JUST LUCKY?'], 2.0, zoom0=1.1, zoom1=1.75, dur=2.2)
    if g == 'pics':
        return comp.caption(gfx.led_picture(grab(PICS[0], 0)), s.get('cap', ''), 0, 9, 1.0)
    if g == 'burn':
        o, _ = gfx.film_burn('full', 1)
        return o
    return np.zeros((H, W, 3), np.float32)


cards = []
cost = shots.clip_credits()
seen = set()
for s in shots.SHOTS:
    rgb = frame(s)
    fn = f"f/{s['n']:02d}.jpg"
    cv2.imwrite(f'{OUT}/{fn}', cv2.cvtColor(to8(cv2.resize(rgb, (960, 540), interpolation=cv2.INTER_AREA)), cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 88])
    c = s.get('clip')
    if c and c not in seen:
        cr = f'{cost[c]:.1f} credits (clip {c})'
        seen.add(c)
    elif c:
        cr = f'0, shares clip {c}'
    elif s['kind'] == 'E':
        cr = '0.25 credits (one still)'
    else:
        cr = '0, built locally'
    cards.append(f'''<article class="card {s['ch']}">
<img src="{fn}" loading="lazy" alt="Shot {s['n']}">
<div class="meta"><div class="no"><b>{s['n']}</b><span>{s['a']:.1f}&ndash;{s['b']:.1f} s</span></div>
<p class="line">{html.escape(s['line'])}</p>
<p>{html.escape(s['what'])}</p>
<p class="edit">{html.escape(s['edit'])}</p>
<p class="cr">{cr}</p></div></article>''')

total = sum(cost.values()) + 0.25
secs = sum(v[2] - v[1] for v in shots.CLIPS.values())
for c in ('red', 'blue', 'teal'):
    cv2.imwrite(f'{OUT}/look_{c}.jpg', cv2.cvtColor(cv2.resize(plates[c], (960, 540), interpolation=cv2.INTER_AREA), cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 90])

page = f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Editor V3 Storyboard</title><style>
:root{{--bg:#0b0d10;--fg:#eceef0;--dim:#9aa3ad;--line:#23272d}}
*{{box-sizing:border-box}}body{{margin:0;background:var(--bg);color:var(--fg);font:16px/1.5 "Helvetica Neue",Helvetica,Arial,sans-serif}}
main{{max-width:1180px;margin:0 auto;padding:40px 16px 90px}}h1{{font-size:44px;letter-spacing:-.03em;margin:0 0 6px}}h2{{font-size:26px;letter-spacing:-.02em;margin:48px 0 12px}}
.lead{{color:var(--dim);max-width:720px;margin:0 0 22px}}video,img{{display:block;width:100%;border-radius:6px;background:#000}}
.ask{{border:1px solid var(--line);border-radius:8px;padding:18px 20px;margin:26px 0;background:#12151a}}.ask b{{font-size:30px;letter-spacing:-.02em}}
.looks{{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}}.looks p{{margin:6px 0 0;color:var(--dim);font-size:14px}}
.card{{display:grid;grid-template-columns:minmax(0,480px) minmax(0,1fr);gap:20px;padding:16px 0;border-top:1px solid var(--line)}}
.meta p{{margin:0 0 8px}}.no{{display:flex;gap:12px;align-items:baseline;margin-bottom:6px}}.no b{{font-size:28px;letter-spacing:-.02em}}.no span{{color:var(--dim);font-size:14px}}
.line{{font-size:19px;font-weight:600;letter-spacing:-.01em}}.edit{{color:var(--dim)}}.cr{{font-size:14px}}
.red .no b{{color:#ff4a42}}.blue .no b{{color:#5d86ff}}.teal .no b{{color:#a9cfc7}}
@media(max-width:760px){{.card{{grid-template-columns:1fr}}.looks{{grid-template-columns:1fr}}h1{{font-size:34px}}}}
</style></head><body><main>
<h1>Editor V3 storyboard</h1>
<p class="lead">Your voice from the front take, your outline from the side take, his look and pacing. About 70 seconds at 16:9. Nothing below has been generated yet.</p>
<div class="ask"><b>{total:.0f} credits</b> to make every silhouette clip below ({secs:.0f} s on Kling Pro at 2 credits a second).</div>
<h2>The three chapters, made from your real frame</h2>
<div class="looks"><div><img src="look_red.jpg" alt="Red look"><p>Red: the numbers climb</p></div><div><img src="look_blue.jpg" alt="Blue look"><p>Blue: garbage, and doubt</p></div><div><img src="look_teal.jpg" alt="Teal look"><p>Pale teal: the answer</p></div></div>
<h2>All 25 shots</h2>
{''.join(cards)}
</main></body></html>'''
open(OUT + '/index.html', 'w').write(page)
print(OUT + '/index.html', 'total credits', total, 'seconds', secs)
