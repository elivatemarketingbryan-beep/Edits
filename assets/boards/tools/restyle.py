"""Restyle the 74 explainer boards from sirioberati/YouTube-AI-Motion-Graphics (MIT, commit dc1ccb1) into the Elivate premium look.
Layouts and motion stay his. Colours, type and the stage become ours. Each colour is mapped by what it is doing (text, fill, line, shadow).
Usage: python restyle.py <his boards folder> <output folder>"""
import glob
import os
import re
import subprocess
import sys

SRC, OUT = sys.argv[1:3]
W70, W60, W45 = 'rgba(255,255,255,.82)', 'rgba(255,255,255,.62)', 'rgba(255,255,255,.45)'
L, M, P = '#C4B5FD', '#EDE9FE', '#8B5CF6'
OK, BAD, BADT = '#22A06B', '#E5484D', '#FF8A8E'
DARK, MID, ROYAL, VIO = '#0E0720', '#1A0B38', '#3B1A75', '#6D28D9'
LINE = 'rgba(196,181,253,.45)'
SOFT = 'rgba(196,181,253,.2)'
GLASS = '#170A32'  # solid, so connector lines stay hidden behind cards
MONEY = ('C239PriceCard', 'P198Odometer', 'P196Kinetic')  # prices and money are gold
GOLDTINT = 'rgba(232,199,122,.22)'
GREENTINT = 'rgba(34,160,107,.24)'
REDTINT = 'rgba(229,72,77,.22)'
WASH = 'rgba(59,26,117,.32)'
INK = ('#1F2937', '#111827', '#1C1F24', '#2C3037', '#151517', '#15171B', '#0E0F12')

TEXT = {**{k: '#FFFFFF' for k in INK}, '#FFFFFF': '#FFFFFF', '#374151': W70, '#4B5563': W70, '#6B7280': W60, '#5B5F68': W60, '#555555': W60, '#9CA3AF': W45, '#8B8F98': W45,
        '#D1D5DB': W45, '#2563EB': L, '#6C79E2': L, '#7C3AED': L, '#93C5FD': L, '#60A5FA': L, '#BFDBFE': L, '#A9B1EF': L, '#D7DBF7': M, '#DBEAFE': M, '#EFF6FF': M, '#D1FAE5': M,
        '#059669': '#4CC38A', '#3BB29F': '#4CC38A', '#3FCBA8': '#4CC38A', '#7EE2C8': '#4CC38A', '#E11D48': BADT, '#EF4444': BADT, '#FF8A80': BADT, '#D97706': '#E8C77A', '#FFB86B': '#E8C77A',
        '#FFF6C2': '#FFF3CF', '#E5E7EB': W60, '#F6F7F9': '#FFFFFF', '#EDEDE8': '#FFFFFF', '#E8E6E1': '#FFFFFF', '#EDE9FE': M, '#0891B2': L, '#3A2E26': W70}
FILL = {**{k: DARK for k in INK}, '#FFFFFF': GLASS, '#F6F7F9': WASH, '#F3F4F6': WASH, '#EDEDE8': WASH, '#E8E6E1': WASH, '#E5E7EB': SOFT, '#D1D5DB': 'rgba(196,181,253,.28)',
        '#9CA3AF': 'rgba(196,181,253,.32)', '#6B7280': ROYAL, '#4B5563': ROYAL, '#374151': MID, '#5B5F68': ROYAL, '#555555': ROYAL, '#8B8F98': ROYAL,
        '#2563EB': P, '#6C79E2': P, '#60A5FA': P, '#7C3AED': VIO, '#0891B2': VIO, '#93C5FD': VIO, '#A9B1EF': L, '#BFDBFE': ROYAL, '#DBEAFE': ROYAL, '#D7DBF7': 'rgba(196,181,253,.24)', '#EFF6FF': MID, '#EDE9FE': ROYAL,
        '#059669': OK, '#3BB29F': OK, '#3FCBA8': OK, '#7EE2C8': OK, '#D1FAE5': GREENTINT, '#A7F3D0': GREENTINT, '#ECFDF5': GREENTINT,
        '#E11D48': BAD, '#EF4444': BAD, '#FF8A80': BAD, '#FFE4E6': REDTINT, '#FFF5F2': REDTINT, '#FECDD3': REDTINT, '#FFF6C2': GOLDTINT, '#D97706': '#B8913F', '#FFB86B': '#E8C77A', '#F6D2B4': GOLDTINT, '#3A2E26': MID}
STROKE = {**{k: LINE for k in INK}, '#FFFFFF': LINE, '#E5E7EB': SOFT, '#F3F4F6': SOFT, '#D1D5DB': SOFT, '#9CA3AF': LINE, '#6B7280': LINE, '#4B5563': LINE, '#374151': LINE, '#2563EB': P, '#6C79E2': P, '#7C3AED': P, '#60A5FA': P,
          '#93C5FD': L, '#A9B1EF': L, '#BFDBFE': L, '#D7DBF7': SOFT, '#DBEAFE': L, '#EFF6FF': SOFT, '#059669': OK, '#3BB29F': OK, '#3FCBA8': OK, '#7EE2C8': OK, '#D1FAE5': OK, '#E11D48': BAD, '#EF4444': BAD, '#FFE4E6': BAD, '#FFF6C2': '#E8C77A', '#D97706': '#E8C77A'}
SVGFILL = {**FILL, **{k: L for k in INK}, '#FFFFFF': MID}
HEX = re.compile(r'#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b')


def norm(x):
    x = x.upper()
    return '#' + ''.join(c * 2 for c in x[1:]) if len(x) == 4 else x


def rgba(v):
    v = re.sub(r'rgba\(\s*31\s*,\s*41\s*,\s*55\s*,', 'rgba(255,255,255,', v)
    v = re.sub(r'rgba\(\s*37\s*,\s*99\s*,\s*235\s*,', 'rgba(139,92,246,', v)
    v = re.sub(r'rgba\(\s*229\s*,\s*231\s*,\s*235\s*,', 'rgba(196,181,253,', v)
    return re.sub(r'rgba\(\s*255\s*,\s*246\s*,\s*194\s*,', 'rgba(232,199,122,', v)


def swap(v, table, ink_var):
    v = HEX.sub(lambda m: table.get(norm(m.group(0)), m.group(0)), rgba(v))
    return v.replace('var(--ink)', ink_var).replace('var(--chrome)', ink_var)


def decl(m):
    p, v = m.group(1), m.group(2)
    pl = p.lower()
    if p.startswith('--'):
        return m.group(0)
    if pl in ('color', 'caret-color', '-webkit-text-fill-color'):
        return f'{p}:{swap(v, TEXT, "#FFFFFF")}'
    if pl in ('background', 'background-color', 'background-image'):
        return f'{p}:{swap(v, FILL, DARK)}'
    if pl == 'fill':
        return f'{p}:{swap(v, SVGFILL, L)}'
    if pl.startswith('border') or pl.startswith('outline') or pl == 'stroke' or pl == '-webkit-text-stroke':
        return f'{p}:{swap(v, STROKE, LINE)}'
    if pl in ('box-shadow', 'text-shadow', 'filter', '-webkit-filter'):
        v = HEX.sub(lambda c: {'#DBEAFE': 'rgba(139,92,246,.4)', '#FFFFFF': 'rgba(196,181,253,.25)'}.get(norm(c.group(0)), 'rgba(0,0,0,.5)'), v)
        return f'{p}:{rgba(v)}'
    return m.group(0)


def tag(m):
    """Map every fill, stroke and color attribute on one tag."""
    s = m.group(0)
    t = re.match(r'<\s*(\w+)', s).group(1).lower()

    def one(a):
        name, v = a.group(1), a.group(2)
        if name == 'stroke':
            nv = swap(v, STROKE, LINE)
        elif name == 'color':
            nv = swap(v, TEXT, '#FFFFFF')
        else:
            nv = swap(v, TEXT if t in ('text', 'tspan') else SVGFILL, '#FFFFFF' if t in ('text', 'tspan') else L)
        return f' {name}="{nv}"'
    return re.sub(r'\s(fill|stroke|color)="([^"]+)"', one, s)


def remove_div(h, cls):
    """Remove every <div class="cls"...>…</div>, balancing nested divs."""
    pat = re.compile(r'<div class="' + cls + r'"[^>]*>')
    while True:
        m = pat.search(h)
        if not m:
            return h
        depth, i = 1, m.end()
        tok = re.compile(r'<div\b|</div>')
        while depth:
            t = tok.search(h, i)
            depth += 1 if t.group(0) != '</div>' else -1
            i = t.end()
        h = h[:m.start()] + h[i:]


THEME = """
<style>
/* Elivate premium look. Purple is the structure, gold is the reward. */
.ebs{--ink:#fff;--paper:#050308;--dot:transparent;--chrome:#fff;--g1:rgba(255,255,255,.82);--g2:rgba(255,255,255,.62);--g3:rgba(255,255,255,.45);
 --line:rgba(196,181,253,.22);--line2:rgba(196,181,253,.12);--chip:rgba(196,181,253,.2);--wash:rgba(59,26,117,.32);--pending:rgba(59,26,117,.32);
 --hi:rgba(139,92,246,.4);--sticker:rgba(232,199,122,.24);--indigo:#8B5CF6;--indigo-l:#1A0B38;--mint:#22A06B;--mint-l:rgba(34,160,107,.24);--violet:#6D28D9;--violet-l:#3B1A75;
 --coral:#E5484D;--coral-l:rgba(229,72,77,.22);--yellow-l:rgba(232,199,122,.22);--teal:#8B5CF6;--red:#E5484D;--amber:#E8C77A;--lime:rgba(34,160,107,.2);--code:#EDE9FE;--green-l:rgba(34,160,107,.3);
 --p-head:#C4B5FD;--p-asset:#E8C77A;--p-dialogue:#EDE9FE;--p-sound:#FF8A8E;--p-text:rgba(255,255,255,.82);
 --space:'Inter',system-ui,sans-serif;--mono:MONOFONT;--hand:'Playfair Display',serif;
 --sh-soft:0 18px 50px rgba(0,0,0,.45);--sh-film:0 18px 40px -14px rgba(0,0,0,.7);--sh-hard:0 22px 60px rgba(0,0,0,.5);--sh-hard-l:0 22px 60px rgba(0,0,0,.5);--sh-prompt:0 22px 60px rgba(0,0,0,.5);
 --sh-sticker:0 8px 24px rgba(0,0,0,.45);--ring-hi:0 0 0 6px rgba(139,92,246,.45),0 24px 44px -14px rgba(0,0,0,.6);
 background:#050308!important;color:#fff!important;font-weight:700}
html,body{background:#050308!important}
.ebs .halo{position:absolute;inset:0;background:radial-gradient(900px 600px at 0% 0%,rgba(139,92,246,.15),transparent 70%),radial-gradient(800px 560px at 100% 6%,rgba(196,181,253,.08),transparent 70%)}
.ebs .grid{position:absolute;inset:0;opacity:.6;background:linear-gradient(rgba(255,255,255,.028) 1px,transparent 1px) 0 0/100% 72px,linear-gradient(90deg,rgba(255,255,255,.028) 1px,transparent 1px) 0 0/72px 100%;-webkit-mask-image:radial-gradient(120% 90% at 50% 40%,#000 30%,transparent 85%)}
.ebs .floor{position:absolute;left:0;right:0;bottom:0;height:460px;background:radial-gradient(160% 100% at 50% 100%,rgba(139,92,246,.42),rgba(109,40,217,.18) 40%,rgba(76,29,149,.05) 70%,transparent 100%)}
.ebs .vig{position:absolute;inset:0;background:radial-gradient(130% 110% at 50% 45%,transparent 55%,rgba(0,0,0,.55) 100%);pointer-events:none;z-index:60}
.ebs .grain{position:absolute;inset:-50%;opacity:.07;pointer-events:none;mix-blend-mode:overlay;z-index:61;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")}
.ebs .title{font-weight:900;letter-spacing:-.04em}
.ebs .title span{background:none!important;padding:0}
.ebs .card{border-radius:18px}
.ebs .camera{border-radius:18px;border:1.5px solid rgba(196,181,253,.35);background:#0E0720;box-shadow:0 24px 60px rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center}
.ebs .camera video{display:none}
.ebs .camera::after{content:"Speaker";font:700 22px/1 'Inter',sans-serif;letter-spacing:.32em;text-transform:uppercase;color:rgba(196,181,253,.55)}
.ebs .sample-tag{position:absolute;right:60px;top:40px;z-index:62;font:700 16px/1 'Inter',sans-serif;letter-spacing:.28em;color:#E8C77A;border:1px solid rgba(232,199,122,.5);border-radius:99px;padding:9px 16px 9px 18px}
</style>
"""
CODE = ('C243CodeFocus', 'D54Terminal', 'A136FileAnatomy', 'A137FolderTree', 'A138Diff', 'A139ErrorFix', 'C251FolderTree')
FONTS = 'https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700;800;900&amp;family=Playfair+Display:ital,wght@1,600;1,700;1,800&amp;family=JetBrains+Mono:wght@500&amp;display=swap'
os.makedirs(OUT, exist_ok=True)
fs = sorted(f for f in glob.glob(SRC + '/*.html') if not f.endswith('index.html'))
for f in fs:
    h = open(f, encoding='utf8').read()
    n = os.path.basename(f)[:-5]
    h = re.sub(r'https://fonts\.googleapis\.com/css2\?[^"\')]+', FONTS, h)
    h = re.sub(r"Instrument Serif'?,\s*serif", "Playfair Display',serif", h).replace("'Instrument Serif'", "'Playfair Display'")
    for c in ('kicker', 'spec'):
        h = remove_div(h, c)
    # outside <script>: map declarations and svg attributes by role
    parts = re.split(r'(<script\b.*?</script>)', h, flags=re.S)
    for i, p in enumerate(parts):
        if p.startswith('<script'):
            parts[i] = HEX.sub(lambda m: {**FILL, **{k: '#FFFFFF' for k in INK}, '#FFFFFF': '#FFFFFF'}.get(norm(m.group(0)), m.group(0)), rgba(p))
            continue
        p = re.sub(r'(?<![\w-])(--[\w-]+|[a-zA-Z-]+)\s*:\s*([^;{}"<>]*(?:#[0-9a-fA-F]{3,6}|var\(--(?:ink|chrome)\)|rgba\([^;{}"<>]*)[^;{}"<>]*)', decl, p)
        p = re.sub(r'<\w+\b[^<>]*>', tag, p)
        if n in MONEY:
            p = p.replace('#4CC38A', '#E8C77A')
        parts[i] = p
    h = ''.join(parts)
    # stage under, grain over, a sample chip so unfinished boards can't slip through
    m = re.search(r'<div class="ebs"[^>]*>', h)
    h = h[:m.start()] + THEME.replace('MONOFONT', "'JetBrains Mono',monospace" if n in CODE else "'Inter',system-ui,sans-serif") + '<div class="ebs"><div class="halo"></div><div class="grid"></div><div class="floor"></div><div class="sample-tag">SAMPLE</div>' + h[m.end():]
    j = h.rfind('</div>', 0, h.rfind('</body>'))
    h = h[:j] + '<div class="vig"></div><div class="grain"></div>' + h[j:]
    open(os.path.join(OUT, n + '.html'), 'w', encoding='utf8').write(h)
if os.path.isdir(SRC + '/assets'):
    # his pale grey footage placeholders, turned dark purple so they sit in the look
    os.makedirs(OUT + '/assets', exist_ok=True)
    VF = 'negate,colorlevels=romin=.09:romax=.72:gomin=.04:gomax=.62:bomin=.2:bomax=.96'
    for f in sorted(glob.glob(SRC + '/assets/*')):
        o = os.path.join(OUT, 'assets', os.path.basename(f))
        extra = ['-q:v', '3'] if f.endswith('.jpg') else ['-c:v', 'libx264', '-crf', '26', '-pix_fmt', 'yuv420p', '-an']
        subprocess.run(['ffmpeg', '-nostdin', '-hide_banner', '-loglevel', 'error', '-y', '-i', f, '-vf', VF, *extra, o], check=True, stdin=subprocess.DEVNULL)
print('restyled', len(fs))
