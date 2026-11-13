"""Renders a preview of each combo in combos.json: the whole clip with that combo's effects at their moments,
in the house look. The effects are quick stand-ins that show timing and feel; the real ones are designed after the pick.

  python studio/combo-preview.py <job-id> [c1 c2 ...]
  writes projects/<id>/combo-previews/<combo>/index.html and jobs/<id>/previews/combo-<combo>.mp4, and sets each combo's "preview"
"""
import json, re, subprocess, sys, pathlib, html, importlib.util

ROOT = pathlib.Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('fp', ROOT / 'studio' / 'format-preview.py')
fp = importlib.util.module_from_spec(spec); spec.loader.exec_module(fp)
esc = html.escape

FX_CSS = """
.fx{position:absolute;opacity:0;visibility:hidden;z-index:7}
.gt{left:50px;right:50px;top:150px;text-align:center;font:900 132px/0.95 Inter;letter-spacing:-.02em;text-transform:uppercase;
  background:linear-gradient(180deg,#fff 10%,#C4B5FD 55%,#8B5CF6);-webkit-background-clip:text;background-clip:text;color:transparent;
  filter:drop-shadow(0 10px 30px rgba(139,92,246,.55))}
.gl{left:60px;right:60px;top:1130px;text-align:center;font:900 92px/1.02 Inter;color:#FFF3CF;text-shadow:0 0 30px #E8C77A,0 0 70px rgba(232,199,122,.6)}
.card{left:90px;right:90px;top:1080px;padding:38px 44px;border-radius:34px;background:linear-gradient(160deg,rgba(76,29,149,.78),rgba(5,3,8,.85));
  border:2px solid rgba(196,181,253,.6);box-shadow:0 30px 80px rgba(0,0,0,.6);font:800 50px/1.15 Inter}
.card .k{font:800 26px Inter;letter-spacing:.14em;text-transform:uppercase;color:#C4B5FD;margin-bottom:14px}
.ui .bar{display:flex;gap:12px;margin:-10px 0 24px}.ui .bar i{width:22px;height:22px;border-radius:50%;background:#6D28D9}.ui .bar i:first-child{background:#E8C77A}
.ui .prog{height:16px;border-radius:9px;background:#1A0B38;margin-top:26px;overflow:hidden}.ui .prog b{display:block;height:100%;width:100%;background:linear-gradient(90deg,#8B5CF6,#E8C77A);transform-origin:left}
.phone{left:310px;top:1000px;width:460px;height:600px;border-radius:64px;background:#0b0614;border:10px solid #2a1a4a;box-shadow:0 40px 100px rgba(0,0,0,.7)}
.phone .msg{position:absolute;left:34px;right:34px;top:120px;padding:26px 30px;border-radius:30px 30px 30px 8px;background:#6D28D9;font:700 36px/1.2 Inter}
.phone .notch{position:absolute;left:50%;top:18px;width:150px;height:30px;margin-left:-75px;border-radius:20px;background:#000}
.tick{left:90px;right:90px;top:1060px;padding:34px 40px;border-radius:34px;background:rgba(5,3,8,.82);border:2px solid #6D28D9}
.tick .row{display:flex;gap:24px;align-items:center;font:800 50px/1.1 Inter;margin:14px 0}
.tick .bx{flex:none;width:66px;height:66px;border-radius:18px;display:grid;place-items:center;background:#E8C77A;color:#050308;font:900 44px Inter}
.chart{left:90px;right:90px;top:1060px;height:460px;padding:30px;border-radius:34px;background:rgba(5,3,8,.82);border:2px solid #6D28D9}
.chart .lb{font:800 40px Inter}.chart svg{position:absolute;left:30px;bottom:30px}
.orb{left:240px;top:1020px;width:600px;height:600px}
.orb i{position:absolute;left:50%;top:50%;width:120px;height:120px;margin:-60px;border-radius:50%;background:#6D28D9;border:4px solid #C4B5FD}
.orb b{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font:900 54px Inter;color:#050308;padding:26px 40px;border-radius:30px;background:#E8C77A;opacity:0}
.bubble{left:110px;top:1100px;max-width:760px;padding:30px 40px;border-radius:40px 40px 40px 10px;background:#fff;color:#050308;font:800 48px/1.15 Inter;box-shadow:0 20px 60px rgba(0,0,0,.5)}
.flash{position:absolute;inset:0;background:#fff;opacity:0;z-index:6;pointer-events:none}
.cap{bottom:150px!important}
.board .cap{bottom:60px!important;font-size:60px}.board .shade{display:none}
.board .card,.board .tick,.board .chart,.board .bubble{top:140px}.board .gl{top:170px}.board .phone{top:120px}.board .orb{top:100px}
"""

def short(s, n=7):
    w = s.split()
    return ' '.join(w[:n]) + ('…' if len(w) > n else '')

def caps_phrase(pitch):
    m = re.findall(r"\b[A-Z0-9$][A-Z0-9$'=≠≠]*(?:\s+[A-Z0-9$=≠'][A-Z0-9$'=≠]*)+\b|\b[A-Z]{3,}\b", pitch)
    return max(m, key=len) if m else None

def items(i):
    q = i.get('quote', '')
    if ',' in q:
        return [x.strip() for x in re.split(r',| and ', q) if x.strip()][:4]
    head = i['pitch'].split(':')[0]
    head = re.sub(r'\s+(tick|stack|crossed|slides).*$', '', head)
    if ',' in head:
        return [x.strip() for x in head.split(',')][:4]
    return [i['pitch'].split(':')[-1].strip() if ':' in i['pitch'] else short(q)]

def fx(i, n, t0, t1):
    """Returns (html, js) for one idea's stand-in effect."""
    st, q, eid = i['style'], i.get('quote', ''), f'f{n}'
    d = max(0.6, t1 - t0)
    show = f"tl.fromTo('#{eid}',{{autoAlpha:0,y:40,scale:.92}},{{autoAlpha:1,y:0,scale:1,duration:.35,ease:'back.out(1.8)'}},{t0:.2f});tl.to('#{eid}',{{autoAlpha:0,duration:.25}},{t1:.2f});"
    if st == 'glass-text':
        txt = caps_phrase(i['pitch']) or q.upper()
        return f'<div class="fx gt" id="{eid}">{esc(txt)}</div>', f"tl.fromTo('#{eid}',{{autoAlpha:0,scale:1.4,filter:'blur(20px)'}},{{autoAlpha:1,scale:1,filter:'blur(0px)',duration:.45,ease:'power4.out'}},{t0:.2f});tl.to('#{eid}',{{autoAlpha:0,duration:.3}},{t1:.2f});"
    if st == 'glow-motion':
        return f'<div class="fx gl" id="{eid}">{esc(short(q, 6))}</div>', show
    if st == 'tick-list':
        its = items(i)
        rows = ''.join(f'<div class="row" id="{eid}r{k}"><span class="bx">✓</span><span>{esc(x)}</span></div>' for k, x in enumerate(its))
        js = f"tl.fromTo('#{eid}',{{autoAlpha:0,y:40}},{{autoAlpha:1,y:0,duration:.3}},{t0:.2f});" + ''.join(
            f"tl.from('#{eid}r{k}',{{opacity:0,x:-50,duration:.25}},{t0 + 0.2 + k * min(0.7, d / max(1, len(its))):.2f});" for k in range(len(its))) + f"tl.to('#{eid}',{{autoAlpha:0,duration:.25}},{t1:.2f});"
        return f'<div class="fx tick" id="{eid}">{rows}</div>', js
    if st == 'phone-frame':
        return f'<div class="fx phone" id="{eid}"><div class="notch"></div><div class="msg">{esc(short(q, 9))}</div></div>', show
    if st == 'interface-world':
        return (f'<div class="fx card ui" id="{eid}"><div class="bar"><i></i><i></i><i></i></div>{esc(short(q, 8))}<div class="prog"><b id="{eid}p"></b></div></div>',
                show + f"tl.from('#{eid}p',{{scaleX:0,duration:{d * 0.8:.2f},ease:'power2.inOut'}},{t0 + 0.2:.2f});")
    if st == 'graph-rise':
        return (f'<div class="fx chart" id="{eid}"><div class="lb">{esc(short(q, 7))}</div><svg width="840" height="300"><path id="{eid}l" d="M0 280 C200 270 300 220 420 180 S640 60 840 20" fill="none" stroke="#E8C77A" stroke-width="10" stroke-linecap="round"/></svg></div>',
                show + f"tl.fromTo('#{eid}l',{{strokeDasharray:1000,strokeDashoffset:1000}},{{strokeDashoffset:0,duration:{min(1.6, d):.2f},ease:'power2.out'}},{t0 + 0.2:.2f});")
    if st == 'orbit-spin':
        dots = ''.join(f'<i id="{eid}d{k}"></i>' for k in range(4))
        js = f"tl.fromTo('#{eid}',{{autoAlpha:0}},{{autoAlpha:1,duration:.2}},{t0:.2f});" + ''.join(
            f"tl.fromTo('#{eid}d{k}',{{x:{220 * (1 if k % 2 else -1) * (k < 2)}, y:{220 * (1 if k % 2 else -1) * (k >= 2)}}},{{x:0,y:0,duration:{min(1.2, d * .6):.2f},ease:'power3.in'}},{t0:.2f});" for k in range(4)
        ) + f"tl.to('#{eid}',{{rotation:180,duration:{min(1.2, d * .6):.2f},ease:'power2.in'}},{t0:.2f});tl.to('#{eid} b',{{opacity:1,rotation:-180,duration:.3}},{t0 + min(1.2, d * .6):.2f});tl.to('#{eid}',{{autoAlpha:0,duration:.25}},{t1:.2f});"
        return f'<div class="fx orb" id="{eid}">{dots}<b>One system</b></div>', js
    if st == 'news-wall':
        return f'<div class="fx bubble" id="{eid}">{esc(short(q, 9))}</div>', show
    if st == 'frame-pop':
        return (f'<div class="fx card" id="{eid}">{esc(short(q, 9))}</div>',
                f"tl.fromTo('#{eid}',{{autoAlpha:0,scale:.3,rotation:-8}},{{autoAlpha:1,scale:1,rotation:-2,duration:.4,ease:'back.out(2.2)'}},{t0:.2f});tl.to('#{eid}',{{autoAlpha:0,duration:.25}},{t1:.2f});")
    if st == 'punch-through-cut':
        return '', f"tl.to('.flash',{{opacity:.85,duration:.04}},{t0:.2f});tl.to('.flash',{{opacity:0,duration:.18}},{t0 + .05:.2f});tl.to('#vwrap',{{scale:1.22,duration:.12,ease:'power4.out'}},{t0:.2f});tl.to('#vwrap',{{scale:1,duration:.3,ease:'power2.inOut'}},{t1:.2f});"
    if st == 'pull-out-reveal':
        return '', f"tl.fromTo('#vwrap',{{scale:1.2}},{{scale:1,duration:{d:.2f},ease:'power2.out'}},{t0:.2f});"
    if st == 'pixel-zoom':
        return '', ''   # handled as whole-video zoom
    return f'<div class="fx card" id="{eid}">{esc(short(q, 9))}</div>', show

def build(job, combo, ideas, dur):
    pdir = ROOT / 'projects' / job
    words = json.loads((pdir / 'transcript' / 'words.json').read_text(encoding='utf-8'))['words']
    out = pdir / 'combo-previews' / combo['id']
    out.mkdir(parents=True, exist_ok=True)
    clip = pdir / 'combo-previews' / 'clip.mp4'
    if not clip.exists():
        board = pdir / 'board-over.mp4'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(board if board.exists() else ROOT / 'jobs' / job / 'source.mp4'), '-vf', 'scale=1080:1920', '-c:v', 'libx264', '-crf', '21',
                        '-preset', 'veryfast', '-pix_fmt', 'yuv420p', '-c:a', 'aac', str(clip)], check=True)
    (out / 'clip.mp4').write_bytes(clip.read_bytes()) if not (out / 'clip.mp4').exists() else None
    chosen = [i for i in ideas if i['id'] in combo['ideas']]
    whole = [i for i in chosen if i.get('start') is None]
    timed = sorted([i for i in chosen if i.get('start') is not None], key=lambda i: i['start'])
    parts, js = [], []
    for n, i in enumerate(timed):
        t0 = i['start']; t1 = max(i['end'], t0 + 2.0)
        if n + 1 < len(timed): t1 = min(t1, timed[n + 1]['start'] - 0.05)
        h, j = fx(i, n, t0, max(t1, t0 + 0.6)); parts.append(h); js.append(j)
    zoom = "tl.fromTo('#vzoom',{scale:1},{scale:1.1,duration:%.2f,ease:'none'},0);" % dur if any(i['style'] == 'pixel-zoom' for i in whole) else ''
    cap = fp.caption_html(fp.chunks(words, 0, dur + 1), 0)
    doc = f"""<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=1080, height=1920">
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script><style>{fp.CSS}{FX_CSS}
#vwrap,#vzoom{{position:absolute;inset:0;transform-origin:50% 40%}}</style></head><body>
<div id="root" class="{'board' if (pdir / 'board-over.mp4').exists() else ''}" data-composition-id="main" data-start="0" data-duration="{dur}" data-width="1080" data-height="1920">
<div id="vwrap"><div id="vzoom"><video class="clip vid" src="clip.mp4" muted playsinline data-start="0" data-duration="{dur}"></video></div></div>
<audio id="vo" src="clip.mp4" data-start="0" data-duration="{dur}"></audio>
<div class="shade"></div><div class="flash"></div>
{''.join(parts)}{cap}<div class="chip">{esc(combo['name'])} · <b>{len(chosen)} effects</b></div>
</div>
<script>
window.__timelines = window.__timelines || {{}};
const tl = gsap.timeline({{ paused: true }});
tl.from('.chip', {{ y: -40, opacity: 0, duration: .5 }}, .1);
{zoom}
{''.join(js)}
document.querySelectorAll('.cap span').forEach((s) => {{ const a = +s.dataset.a, b = +s.dataset.b;
  tl.fromTo(s, {{ autoAlpha: 0, scale: .8 }}, {{ autoAlpha: 1, scale: 1, duration: .12 }}, Math.max(0, a));
  tl.set(s, {{ autoAlpha: 0 }}, Math.max(a + .15, b)); }});
tl.set({{}}, {{}}, {dur});
window.__timelines['main'] = tl;
</script></body></html>"""
    (out / 'index.html').write_text(doc, encoding='utf-8')
    dest = ROOT / 'jobs' / job / 'previews' / f"combo-{combo['id']}.mp4"
    dest.parent.mkdir(exist_ok=True)
    r = subprocess.run(f'npx --yes {fp.HF} render --format mp4 --quality draft --frames-cache-dir off -o "{dest}"', cwd=out, shell=True, capture_output=True, text=True, timeout=900)
    if not dest.exists(): print(r.stdout[-1500:], r.stderr[-1500:])
    return dest.exists()

if __name__ == '__main__':
    job, only = sys.argv[1], sys.argv[2:]
    jd = ROOT / 'jobs' / job
    ideas = json.loads((jd / 'ideas.json').read_text(encoding='utf-8'))
    combos = json.loads((jd / 'combos.json').read_text(encoding='utf-8'))
    dur = round(float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(jd / 'source.mp4')], capture_output=True, text=True).stdout) - 0.1, 2)
    for c in combos:
        done = jd / 'previews' / f"combo-{c['id']}.mp4"
        ids = [x for x in only if not x.startswith('--')]
        if (ids and c['id'] not in ids) or ('--missing' in only and done.exists()):
            if done.exists(): c['preview'] = f"previews/combo-{c['id']}.mp4"
            continue
        ok = build(job, c, ideas, dur)
        if ok: c['preview'] = f"previews/combo-{c['id']}.mp4"
        print(job, c['id'], c['name'], 'ok' if ok else 'FAILED', flush=True)
    (jd / 'combos.json').write_text(json.dumps(combos, indent=1), encoding='utf-8')
