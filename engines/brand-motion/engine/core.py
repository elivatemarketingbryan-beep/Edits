"""Shared drawing primitives: canvas size, colour, easing, fonts, text, gradients."""
import math, os, skia, numpy as np

W, H = 1080, 1920                     # 9:16 vertical
HERE = os.path.dirname(os.path.abspath(__file__))
FONT_DIR = os.path.join(os.path.dirname(HERE), 'fonts')

# Safe zone for TikTok / Reels / Shorts UI (keep text inside this box)
SAFE = (70, 230, W - 150, H - 400)    # left, top, right, bottom

# ---------------------------------------------------------------- colour
def hex2rgb(h):
    h = h.lstrip('#')
    if len(h) == 3: h = ''.join(ch * 2 for ch in h)
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))

def rgb2hex(c): return '#%02x%02x%02x' % tuple(int(round(v)) for v in c[:3])

def to_rgb(c):
    if c is None: return None
    if isinstance(c, str): return hex2rgb(c)
    return tuple(c[:3])

def col(rgb, a=1.0):
    return skia.Color(int(rgb[0]), int(rgb[1]), int(rgb[2]), int(max(0.0, min(1.0, a)) * 255))

def mix(c1, c2, k):
    k = max(0.0, min(1.0, k)); return tuple(c1[i] + (c2[i] - c1[i]) * k for i in range(3))

def luminance(c):
    def ch(v):
        v /= 255.0; return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4
    r, g, b = c[:3]; return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b)

def contrast(a, b):
    la, lb = luminance(a), luminance(b)
    if la < lb: la, lb = lb, la
    return (la + 0.05) / (lb + 0.05)

def best_on(bg, options):
    return max(options, key=lambda c: contrast(bg, c))

WHITE = (255, 255, 255)
BLACK = (0, 0, 0)

def paint(rgb=WHITE, a=1.0, stroke=None, cap=None, blur=None, shader=None, blend=None):
    p = skia.Paint(AntiAlias=True, Color=col(rgb, a))
    if stroke:
        p.setStyle(skia.Paint.kStroke_Style); p.setStrokeWidth(stroke)
        p.setStrokeCap(cap or skia.Paint.kRound_Cap); p.setStrokeJoin(skia.Paint.kRound_Join)
    if blur: p.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, blur))
    if shader is not None: p.setShader(shader); p.setAlphaf(max(0.0, min(1.0, a)))
    if blend is not None: p.setBlendMode(blend)
    return p

def radial(cx, cy, r, stops):
    return skia.GradientShader.MakeRadial((cx, cy), max(r, 1), [col(c, a) for (_, c, a) in stops], [p for (p, _, _) in stops])

def linear(p0, p1, stops):
    return skia.GradientShader.MakeLinear([p0, p1], [col(c, a) for (_, c, a) in stops], [p for (p, _, _) in stops])

def soft_light(c, x, y, r, rgb=WHITE, a=0.35):
    if a <= 0.002 or r <= 1: return
    c.drawCircle(x, y, r, paint(shader=radial(x, y, r, [(0, rgb, a), (1, rgb, 0)])))

# ---------------------------------------------------------------- timing / easing
def clamp(x, a=0.0, b=1.0): return a if x < a else b if x > b else x
def lerp(a, b, k): return a + (b - a) * k
def prog(t, a, b): return clamp((t - a) / (b - a)) if b != a else float(t >= a)
def smooth(x): x = clamp(x); return x * x * (3 - 2 * x)
def eo_cubic(x): x = clamp(x); return 1 - (1 - x) ** 3
def ei_cubic(x): x = clamp(x); return x ** 3
def eio_cubic(x): x = clamp(x); return 4 * x ** 3 if x < .5 else 1 - (-2 * x + 2) ** 3 / 2
def eo_quint(x): x = clamp(x); return 1 - (1 - x) ** 5
def eio_quint(x): x = clamp(x); return 16 * x ** 5 if x < .5 else 1 - (-2 * x + 2) ** 5 / 2
def eo_expo(x): x = clamp(x); return 1 if x >= 1 else 1 - 2 ** (-10 * x)
def ei_expo(x): x = clamp(x); return 0 if x <= 0 else 2 ** (10 * x - 10)
def eio_expo(x):
    x = clamp(x)
    if x <= 0: return 0
    if x >= 1: return 1
    return 2 ** (20 * x - 10) / 2 if x < .5 else (2 - 2 ** (-20 * x + 10)) / 2
def eo_back(x, s=1.70158): x = clamp(x); return 1 + (s + 1) * (x - 1) ** 3 + s * (x - 1) ** 2
def ei_back(x, s=1.70158): x = clamp(x); return (s + 1) * x ** 3 - s * x ** 2

def spring(x, freq=2.4, damp=6.0):
    """0 -> 1 with a physical overshoot. x is seconds since start."""
    if x <= 0: return 0.0
    return 1 - math.exp(-damp * x) * math.cos(2 * math.pi * freq * x)

def wobble(x, freq=3.0, damp=6.5):
    """impulse response: 0, kick, decays back to 0 (use for squash & stretch)."""
    if x <= 0: return 0.0
    return math.exp(-damp * x) * math.sin(2 * math.pi * freq * x)

def pulse(t, t0, decay=10.0): return 0.0 if t < t0 else math.exp(-(t - t0) * decay)

def noise1(t, seed=0.0):
    return math.sin(t * 13.1 + seed) * .5 + math.sin(t * 29.7 + seed * 2.3) * .3 + math.sin(t * 51.3 + seed * 4.1) * .2

def rand_table(seed, n, k=8): return np.random.RandomState(seed).rand(n, k)

# ---------------------------------------------------------------- fonts & text
FONT_FILES = {
    'unbounded': 'Unbounded-900.ttf', 'unbounded-bold': 'Unbounded-700.ttf',
    'space-grotesk': 'SpaceGrotesk-700.ttf', 'space-grotesk-medium': 'SpaceGrotesk-500.ttf',
    'archivo-black': 'ArchivoBlack-Regular.ttf', 'anton': 'Anton-Regular.ttf',
    'bricolage': 'Bricolage-800.ttf', 'syne': 'Syne-800.ttf',
    'inter': 'Inter-800.ttf', 'inter-medium': 'Inter-500.ttf',
    'instrument-serif': 'InstrumentSerif-Regular.ttf', 'instrument-serif-italic': 'InstrumentSerif-Italic.ttf',
}
_TF = {}
def typeface(name):
    if name not in _TF:
        fn = FONT_FILES.get(name, name)
        path = fn if os.path.isabs(fn) else os.path.join(FONT_DIR, fn)
        if not os.path.exists(path): raise FileNotFoundError(f'font not found: {name} ({path})')
        _TF[name] = skia.Typeface.MakeFromFile(path)
    return _TF[name]

def font(name, size):
    f = skia.Font(typeface(name), size); f.setEdging(skia.Font.Edging.kAntiAlias); f.setSubpixel(True)
    return f

def cap_h(f): return f.getMetrics().fCapHeight

def text_w(s, f, track=0.0):
    return f.measureText(s) + track * max(0, len(s) - 1)

def fit_size(s, name, max_w, max_size, track_em=0.0):
    f = font(name, 100)
    w = f.measureText(s) + track_em * 100 * max(0, len(s) - 1)
    return min(max_size, 100 * max_w / max(w, 1))

def draw_text(c, s, name, size, x, y, rgb, a=1.0, align='c', track_em=0.0):
    """y is the vertical centre of the capitals."""
    f = font(name, size); tr = track_em * size
    w = text_w(s, f, tr)
    x0 = x - w / 2 if align == 'c' else (x - w if align == 'r' else x)
    yb = y + cap_h(f) / 2
    p = paint(rgb, a)
    if tr == 0: c.drawString(s, x0, yb, f, p)
    else:
        for ch in s: c.drawString(ch, x0, yb, f, p); x0 += f.measureText(ch) + tr
    return w

def letters(s, name, size, x, y, align='c', track_em=0.0):
    """per-letter layout: list of (char, x_left, baseline, width), font."""
    f = font(name, size); tr = track_em * size
    w = text_w(s, f, tr)
    x0 = x - w / 2 if align == 'c' else (x - w if align == 'r' else x)
    yb = y + cap_h(f) / 2
    out = []
    for ch in s:
        cw = f.measureText(ch); out.append((ch, x0, yb, cw)); x0 += cw + tr
    return out, f

def wrap_lines(text, name, size, max_w):
    words = text.split(); lines = []; cur = ''
    f = font(name, size)
    for w_ in words:
        t = (cur + ' ' + w_).strip()
        if f.measureText(t) <= max_w or not cur: cur = t
        else: lines.append(cur); cur = w_
    if cur: lines.append(cur)
    return lines

def masked_rise(c, s, name, size, x, y, rgb, p, a=1.0, align='c', track_em=0.0, stagger=0.0, t=None, t0=0.0, dur=0.3, back=1.5):
    """Letters rise from behind an invisible mask line. If t is given, staggered per letter from t0."""
    lt, f = letters(s, name, size, x, y, align, track_em)
    ch_ = cap_h(f)
    c.save(); c.clipRect(skia.Rect.MakeLTRB(-50, y - ch_ * 0.75, W + 50, y + ch_ * 0.75 + size * 0.12))
    pt = paint(rgb, a)
    for i, (chh, lx, yb, cw) in enumerate(lt):
        pp = p if t is None else eo_back(prog(t, t0 + i * stagger, t0 + i * stagger + dur), back)
        c.drawString(chh, lx, yb + (1 - pp) * ch_ * 1.5, f, pt)
    c.restore()

def field(c, rgb, a=1.0):
    """Fill the frame with a colour, respecting the current transform (so whip/zoom transitions move it)."""
    c.drawRect(skia.Rect.MakeXYWH(-4, -4, W + 8, H + 8), paint(rgb, a))
