"""Renders a short preview of a job's footage in each of its 3 suggested formats, so the pick screen shows
the real video in that format (not the format's generic example).

  python studio/format-preview.py <job-id> <spec.json>        builds projects/<id>/previews/<style>/ and renders
                                                                jobs/<id>/previews/<style>.mp4, then sets formats.json preview
  spec.json: {"<style>": {"quote": "words where the clip starts", "dur": 6, ...layout data}}

Layouts: personal-reel, business-reel, explainer-panel, split-reel, glass-explainer, this-vs-that, do-or-dont,
ranking, top-5-ranking, visual-essay. All text comes from the spec (his words); no numbers that he didn't say.
"""
import json, re, subprocess, sys, pathlib, html

ROOT = pathlib.Path(__file__).resolve().parent.parent
HF = 'hyperframes@0.7.68'
esc = html.escape

def norm(w): return re.sub(r"[^a-z0-9'$%]", '', w.lower().replace('’', "'"))

def find(words, quote):
    q = [norm(x) for x in quote.split() if norm(x)]
    t = [norm(w['word']) for w in words]
    for i in range(len(t) - len(q) + 1):
        if t[i:i + len(q)] == q:
            return words[i]['start']
    raise SystemExit(f'quote not found: {quote!r}')

CSS = """
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@500;700;800;900&family=Playfair+Display:ital,wght@1,700&display=swap');
html,body{margin:0;width:1080px;height:1920px;overflow:hidden;background:#050308;font-family:Inter,sans-serif;color:#fff}
#root{position:relative;width:1080px;height:1920px;overflow:hidden}
.vid{position:absolute;inset:0;width:1080px;height:1920px;object-fit:cover}
.top .vid{height:1040px;object-position:50% 28%}
.shade{position:absolute;left:0;right:0;bottom:0;height:820px;background:linear-gradient(transparent,rgba(5,3,8,.85))}
.chip{position:absolute;top:70px;left:50%;transform:translateX(-50%);padding:14px 30px;border-radius:99px;background:rgba(26,11,56,.82);border:2px solid #8B5CF6;font:800 30px Inter;letter-spacing:.08em;text-transform:uppercase;white-space:nowrap;z-index:9}
.chip b{color:#E8C77A}
.cap{position:absolute;left:60px;right:60px;bottom:300px;text-align:center;font:900 76px/1.08 Inter;text-shadow:0 6px 24px rgba(0,0,0,.9);z-index:8}
.top .cap{bottom:auto;top:880px;font-size:58px}
.cap span{position:absolute;left:0;right:0;bottom:0;opacity:0;visibility:hidden}
.cap .g{color:#E8C77A}
.glass{position:absolute;left:70px;right:70px;padding:44px 50px;border-radius:36px;background:linear-gradient(160deg,rgba(76,29,149,.55),rgba(5,3,8,.72));border:2px solid rgba(196,181,253,.55);box-shadow:0 30px 80px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.25);backdrop-filter:blur(18px)}
.kick{font:800 28px Inter;letter-spacing:.14em;text-transform:uppercase;color:#C4B5FD}
.head{font:900 74px/1.04 Inter;margin-top:12px}
.head i{font-family:'Playfair Display';color:#E8C77A}
.sub{font:600 40px/1.25 Inter;color:rgba(255,255,255,.82);margin-top:18px}
.bar{height:6px;width:160px;border-radius:9px;background:#E8C77A;margin-top:26px}
.panel{position:absolute;left:0;right:0;top:1040px;bottom:0;background:radial-gradient(120% 70% at 50% 120%,#3B1A75,#050308 70%);padding:110px 70px}
.ptitle{font:900 76px/1.1 Inter}
.step{display:flex;gap:30px;align-items:center;margin-top:62px;font:800 56px/1.12 Inter;color:rgba(255,255,255,.45)}
.step .n{flex:none;width:96px;height:96px;border-radius:50%;display:grid;place-items:center;font:900 38px Inter;background:#1A0B38;border:3px solid #6D28D9;color:#C4B5FD}
.step.on{color:#fff}.step.on .n{background:#E8C77A;border-color:#E8C77A;color:#050308}
.nodes{position:absolute;left:0;right:0;top:1120px;height:700px}
.node{position:absolute;padding:24px 34px;border-radius:24px;background:#1A0B38;border:3px solid #8B5CF6;font:800 40px Inter;white-space:nowrap;transform:translate(-50%,-50%)}
.node.end{background:#E8C77A;border-color:#E8C77A;color:#050308}
.stat{font:900 230px/1 Inter;color:#E8C77A;text-shadow:0 0 60px rgba(232,199,122,.35)}
.cols{position:absolute;left:50px;right:50px;top:200px;display:grid;grid-template-columns:1fr 1fr;gap:26px}
.col{border-radius:30px;padding:34px 30px;background:rgba(5,3,8,.78);border:2px solid rgba(255,255,255,.18);backdrop-filter:blur(14px)}
.col.win{border-color:#E8C77A;background:linear-gradient(170deg,rgba(76,29,149,.7),rgba(5,3,8,.8))}
.col h3{margin:0 0 18px;font:900 46px/1.05 Inter}.col.win h3{color:#E8C77A}
.col li{list-style:none;font:700 34px/1.2 Inter;margin-top:16px;color:rgba(255,255,255,.88)}
.col ul{margin:0;padding:0}
.dd{position:absolute;left:70px;right:70px;display:flex;gap:30px;align-items:center;padding:36px 40px;border-radius:30px;font:800 50px/1.12 Inter;background:rgba(5,3,8,.8);backdrop-filter:blur(14px)}
.dd .m{flex:none;width:96px;height:96px;border-radius:24px;display:grid;place-items:center;font:900 60px Inter}
.dd.no{top:220px;border:3px solid #E5484D}.dd.no .m{background:#E5484D}
.dd.yes{top:470px;border:3px solid #E8C77A}.dd.yes .m{background:#E8C77A;color:#050308}
.tiers{position:absolute;left:0;right:0;top:0;height:1000px;padding:150px 50px 0;background:linear-gradient(#050308 75%,transparent)}
.tier{display:flex;height:142px;margin-bottom:14px;border-radius:20px;overflow:hidden;background:#120826;border:2px solid #3B1A75}
.tier .l{width:142px;display:grid;place-items:center;font:900 70px Inter;background:#6D28D9}
.tier .it{flex:1;display:flex;align-items:center;padding:0 36px;font:800 44px Inter}
.tier.s .l{background:#E8C77A;color:#050308}.tier.s{border-color:#E8C77A}
.bot .vid{top:1000px;height:920px;object-position:50% 25%}
.bot .cap{bottom:120px;font-size:62px}
.count{position:absolute;left:50px;top:200px;width:620px}
.crow{display:flex;gap:22px;align-items:center;margin-bottom:22px;padding:22px 26px;border-radius:24px;background:rgba(5,3,8,.78);border:2px solid #6D28D9;font:800 38px/1.1 Inter;backdrop-filter:blur(12px)}
.crow .k{flex:none;width:70px;height:70px;border-radius:18px;display:grid;place-items:center;font:900 44px Inter;background:#6D28D9}
.crow.one{border-color:#E8C77A}.crow.one .k{background:#E8C77A;color:#050308}
.essay{background:#0b0614}
.essay .frame{position:absolute;left:120px;top:560px;width:840px;height:1120px;border-radius:36px;overflow:hidden;border:4px solid #C4B5FD;box-shadow:0 40px 120px rgba(139,92,246,.35);transform:rotate(-2deg)}
.essay .frame .vid{width:840px;height:1120px}
.essay .eh{position:absolute;left:80px;right:80px;top:200px;font:700 italic 92px/1.05 'Playfair Display';color:#fff}
.essay .es{position:absolute;left:80px;right:80px;top:420px;font:800 46px Inter;color:#E8C77A}
.essay .cap{bottom:120px}
.board .cap{bottom:70px;font-size:60px}.board .shade{display:none}.board .glass{top:150px!important}
"""

def chunks(words, t0, dur):
    ws = [w for w in words if t0 - 0.05 <= w['start'] < t0 + dur - 0.2]
    out, cur = [], []
    for w in ws:
        cur.append(w)
        if len(cur) == 3 or w['word'].endswith(('.', ',', '?', '!')):
            out.append(cur); cur = []
    if cur: out.append(cur)
    return out

def caption_html(cs, t0):
    spans = []
    for i, c in enumerate(cs):
        txt = ' '.join(esc(w['word']) for w in c)
        g = ' g' if any(re.search(r'[$%0-9]', w['word']) for w in c) else ''
        b = min(c[-1]['end'] + 0.25, cs[i + 1][0]['start'] - 0.13) if i + 1 < len(cs) else c[-1]['end'] + 0.4
        spans.append(f'<span class="c{g}" data-a="{c[0]["start"] - t0:.2f}" data-b="{b - t0:.2f}">{txt}</span>')
    return '<div class="cap">' + ''.join(spans) + '</div>'

def layout(style, d):
    """Returns (root class, body html, extra timeline js)."""
    if style == 'personal-reel':
        return '', '<div class="shade"></div>', "tl.fromTo('.vid',{scale:1},{scale:1.14,duration:.25,ease:'power3.out'},2.4);tl.to('.vid',{scale:1.04,duration:2.5,ease:'sine.inOut'},2.65);"
    if style == 'business-reel':
        b = f'<div class="shade"></div><div class="glass" style="top:230px"><div class="kick">{esc(d.get("kicker","The point"))}</div><div class="head">{d["head"]}</div><div class="sub">{esc(d["sub"])}</div><div class="bar"></div></div>'
        return '', b, "tl.from('.glass',{y:-60,opacity:0,duration:.6,ease:'power3.out'},.5);tl.from('.bar',{width:0,duration:.6,ease:'power2.out'},1.2);tl.from('.sub',{opacity:0,y:20,duration:.4},1.4);"
    if style == 'glass-explainer':
        b = f'<div class="shade"></div><div class="glass" style="top:260px;text-align:center"><div class="kick">{esc(d["label"])}</div><div class="stat">{esc(d["stat"])}</div><div class="sub">{esc(d["sub"])}</div></div>'
        return '', b, "tl.from('.glass',{scale:.8,opacity:0,duration:.6,ease:'back.out(1.8)'},.4);tl.from('.stat',{scale:1.6,opacity:0,duration:.5,ease:'power4.out'},1.0);tl.from('.sub',{opacity:0,y:20,duration:.4},1.6);"
    if style == 'explainer-panel':
        steps = ''.join(f'<div class="step" id="s{i}"><div class="n">{i+1}</div><div>{esc(s)}</div></div>' for i, s in enumerate(d['steps']))
        b = f'<div class="panel"><div class="ptitle">{d["title"]}</div>{steps}</div>'
        js = "tl.from('.panel',{y:200,opacity:0,duration:.6,ease:'power3.out'},.2);" + ''.join(
            f"tl.from('#s{i}',{{x:-60,opacity:0,duration:.4,ease:'power3.out'}},{0.9 + i * 1.3:.2f});tl.set('#s{i}',{{className:'step on'}},{1.1 + i * 1.3:.2f});" + (f"tl.set('#s{i-1}',{{className:'step'}},{1.1 + i * 1.3:.2f});" if i else '')
            for i in range(len(d['steps'])))
        return 'top', b, js
    if style == 'split-reel':
        n = d['nodes']; pos = [(270, 120), (810, 120), (270, 420), (810, 420)][:len(n) - 1] + [(540, 620)]
        lines = ''.join(f'<line id="l{i}" x1="{pos[i][0]}" y1="{pos[i][1]}" x2="{pos[i+1][0]}" y2="{pos[i+1][1]}" stroke="#8B5CF6" stroke-width="6" stroke-linecap="round"/>' for i in range(len(n) - 1))
        nodes = ''.join(f'<div class="node{" end" if i == len(n) - 1 else ""}" id="n{i}" style="left:{x}px;top:{y}px">{esc(t)}</div>' for i, (t, (x, y)) in enumerate(zip(n, pos)))
        b = f'<div class="panel"></div><div class="nodes"><svg width="1080" height="700" style="position:absolute;inset:0">{lines}</svg>{nodes}</div>'
        js = ''.join(f"tl.from('#n{i}',{{scale:.5,opacity:0,duration:.4,ease:'back.out(2)'}},{0.6 + i * 1.0:.2f});" + (f"tl.fromTo('#l{i-1}',{{strokeDasharray:900,strokeDashoffset:900}},{{strokeDashoffset:0,duration:.6,ease:'power2.inOut'}},{0.3 + i * 1.0:.2f});" if i else '') for i in range(len(n)))
        return 'top', b, js
    if style == 'this-vs-that':
        col = lambda c, win, k: f'<div class="col{" win" if win else ""}" id="{k}"><h3>{esc(c["title"])}</h3><ul>' + ''.join(f'<li>{"✓ " if win else "✕ "}{esc(x)}</li>' for x in c['items']) + '</ul></div>'
        b = '<div class="shade"></div><div class="cols">' + col(d['left'], False, 'cl') + col(d['right'], True, 'cr') + '</div>'
        return '', b, "tl.from('#cl',{x:-80,opacity:0,duration:.5,ease:'power3.out'},.4);tl.from('#cl li',{opacity:0,y:16,duration:.3,stagger:.35},.9);tl.from('#cr',{x:80,opacity:0,duration:.5,ease:'power3.out'},2.4);tl.from('#cr li',{opacity:0,y:16,duration:.3,stagger:.35},2.9);"
    if style == 'do-or-dont':
        b = f'<div class="shade"></div><div class="dd no"><div class="m">✕</div><div>{esc(d["dont"])}</div></div><div class="dd yes"><div class="m">✓</div><div>{esc(d["do"])}</div></div>'
        return '', b, "tl.from('.dd.no',{x:-100,opacity:0,duration:.5,ease:'power3.out'},.4);tl.from('.dd.no .m',{scale:2.4,opacity:0,duration:.35,ease:'back.out(2)'},.8);tl.from('.dd.yes',{x:100,opacity:0,duration:.5,ease:'power3.out'},2.6);tl.from('.dd.yes .m',{scale:2.4,opacity:0,duration:.35,ease:'back.out(2)'},3.0);"
    if style == 'ranking' and d.get('board'):
        return '', '', ''
    if style == 'ranking':
        rows = ''.join(f'<div class="tier{" s" if k == "S" else ""}" id="t{k}"><div class="l">{k}</div><div class="it">{esc(v)}</div></div>' for k, v in d['tiers'])
        js = ''.join(f"tl.from('#t{k} .it',{{x:60,opacity:0,duration:.35,ease:'power3.out'}},{0.6 + i * 0.75:.2f});" for i, (k, _) in enumerate(reversed(d['tiers'])))
        return 'bot', f'<div class="tiers">{rows}</div>', "tl.from('.tier .l',{scale:.4,opacity:0,duration:.3,stagger:.06},.2);" + js
    if style == 'top-5-ranking':
        items = d['items']; n = len(items)
        rows = ''.join(f'<div class="crow{" one" if i == n - 1 else ""}" id="r{i}"><div class="k">{n - i}</div><div>{esc(t)}</div></div>' for i, t in enumerate(items))
        return '', f'<div class="shade"></div><div class="count">{rows}</div>', ''.join(f"tl.from('#r{i}',{{x:-120,opacity:0,duration:.4,ease:'power3.out'}},{0.5 + i * 0.9:.2f});" for i in range(n))
    if style == 'visual-essay':
        return 'essay', f'<div class="eh">{esc(d["head"])}</div><div class="es">{esc(d["sub"])}</div>', "tl.from('.frame',{y:120,opacity:0,rotation:-6,duration:.8,ease:'power3.out'},.1);tl.from('.eh',{opacity:0,y:30,duration:.6},.5);tl.from('.es',{opacity:0,y:20,duration:.5},1.6);"
    raise SystemExit(f'no preview layout for {style}')

def build(job, style, d, rank, name):
    pdir = ROOT / 'projects' / job
    words = json.loads((pdir / 'transcript' / 'words.json').read_text(encoding='utf-8'))['words']
    dur = float(d.get('dur', 6))
    t0 = max(0, find(words, d['quote']) - 0.15)
    out = pdir / 'previews' / style
    out.mkdir(parents=True, exist_ok=True)
    board = pdir / 'board-over.mp4'   # ranking videos: the default tier board is burned into the footage (EDIT-PREFERENCES)
    src = board if board.exists() else ROOT / 'jobs' / job / 'source.mp4'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{t0:.3f}', '-t', f'{dur + 0.3:.2f}', '-i', str(src),
                    '-vf', 'scale=1080:1920', '-c:v', 'libx264', '-crf', '20', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', '-c:a', 'aac', str(out / 'clip.mp4')], check=True)
    cls, body, js = layout(style, d)
    cap = caption_html(chunks(words, t0, dur), t0)
    video = f'<video class="clip vid" src="clip.mp4" muted playsinline data-start="0" data-duration="{dur}"></video>'
    if cls == 'essay': video = f'<div class="frame">{video}</div>'
    doc = f"""<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=1080, height=1920">
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script><style>{CSS}</style></head><body>
<div id="root" class="{cls}{' board' if board.exists() else ''}" data-composition-id="main" data-start="0" data-duration="{dur}" data-width="1080" data-height="1920">
{video}<audio id="vo" src="clip.mp4" data-start="0" data-duration="{dur}"></audio>
{body}{cap}<div class="chip">Option {rank} · <b>{esc(name)}</b></div>
</div>
<script>
window.__timelines = window.__timelines || {{}};
const tl = gsap.timeline({{ paused: true }});
tl.from('.chip', {{ y: -40, opacity: 0, duration: .5, ease: 'power3.out' }}, .1);
{js}
document.querySelectorAll('.cap span').forEach((s) => {{ const a = +s.dataset.a, b = +s.dataset.b;
  tl.fromTo(s, {{ autoAlpha: 0, scale: .8 }}, {{ autoAlpha: 1, scale: 1, duration: .12 }}, Math.max(0, a));
  tl.set(s, {{ autoAlpha: 0 }}, Math.max(a + .15, b)); }});
tl.set({{}}, {{}}, {dur});
window.__timelines['main'] = tl;
</script></body></html>"""
    (out / 'index.html').write_text(doc, encoding='utf-8')
    dest = ROOT / 'jobs' / job / 'previews'
    dest.mkdir(exist_ok=True)
    r = subprocess.run(f'npx --yes {HF} render --format mp4 --quality draft --frames-cache-dir off -o "{dest / (style + ".mp4")}"',
                       cwd=out, shell=True, capture_output=True, text=True, timeout=400)
    ok = (dest / f'{style}.mp4').exists()
    if not ok: print(r.stdout[-1500:], r.stderr[-1500:])
    return ok

if __name__ == '__main__':
    job, spec = sys.argv[1], json.loads(pathlib.Path(sys.argv[2]).read_text(encoding='utf-8'))
    cat = json.loads((ROOT / 'styles/catalog.json').read_text(encoding='utf-8'))
    styles = cat if isinstance(cat, list) else cat.get('styles', list(cat.values())[0])
    names = {s['id']: s['name'] for s in styles}
    ff = ROOT / 'jobs' / job / 'formats.json'
    formats = json.loads(ff.read_text(encoding='utf-8'))
    only = sys.argv[3:]   # optional: just these styles
    for rank, f in enumerate(formats, 1):
        st = f['style']
        if only and st not in only: continue
        if st not in spec: print(job, st, 'no spec'); continue
        ok = build(job, st, spec[st], rank, names.get(st, st))
        if ok: f['preview'] = f'previews/{st}.mp4'
        print(job, st, 'ok' if ok else 'FAILED', flush=True)
    ff.write_text(json.dumps(formats, indent=1), encoding='utf-8')
