"""Scene library. Every scene: draw(c, t) with global time t, cues() -> sound events, energy -> music intensity.

Times inside specs are absolute seconds on the video timeline unless noted.
"""
import math, skia
from core import *

REGISTRY = {}
def scene(name):
    def deco(cls): REGISTRY[name] = cls; cls.type = name; return cls
    return deco

def cue(t, name, **kw): return (float(t), name, kw)

STAGE_Y, STAGE_SIZE = 1150, 640        # shared logo position for trace -> tiles -> build so nothing jumps

class Scene:
    energy = 1
    layer = 'main'
    hides_captions = False       # scenes that already show the words on screen
    caption_y = 1250             # where captions sit over this scene (None = hide them here)
    def __init__(self, spec, ctx):
        self.s = spec; self.ctx = ctx
        self.start = float(spec['start']); self.end = float(spec['end'])
        self.dur = self.end - self.start
        self.layer = spec.get('layer', self.layer)
        self.energy = spec.get('energy', self.energy)
        self.logo = ctx.logo
        self.B = ctx.brand
        self.setup()
    def setup(self): pass
    def p(self, k, d=None): return self.s.get(k, d)
    def lt(self, t): return t - self.start
    def col(self, k, default):
        return self.ctx.color(self.s.get(k), default)
    def bg_rgb(self, default='bg'):
        v = self.s.get('bg', default)
        if v in ('none', 'transparent', None) or (self.layer == 'overlay' and 'bg' not in self.s): return None
        return self.ctx.color(v)
    def fill_bg(self, c, default='bg', vignette=0.0, glow=0.0):
        b = self.bg_rgb(default)
        if b is None:
            sc = self.s.get('scrim', 0.35 if self.layer == 'overlay' else 0)
            if sc: field(c, BLACK, sc)
            return None
        field(c, b)
        glow = self.s.get('glow', glow)
        if glow > 0: soft_light(c, W / 2, H * 0.48, H * 0.6, WHITE, glow)
        if vignette > 0:
            c.drawRect(skia.Rect.MakeXYWH(-4, -4, W + 8, H + 8), paint(shader=radial(W / 2, H * 0.48, H * 0.78, [(0, BLACK, 0), (0.62, BLACK, 0), (1, BLACK, vignette)])))
        return b
    def U(self, s):
        """apply the brand's letter case (brand.json "uppercase": true by default; scenes can override)."""
        up = self.s.get('uppercase', self.B.get('uppercase', True))
        return s.upper() if up else s
    def readable(self, ref, default, bgc, min_c=1.25):
        """a role colour, swapped for ink/paper if it would vanish on this background."""
        c_ = self.col(ref, default)
        if bgc is None or contrast(c_, bgc) >= min_c: return c_
        return best_on(bgc, [self.ctx.color('paper'), self.ctx.color('ink'), self.ctx.color('accent'), self.ctx.color('primary')])
    def liquid_for(self, bgc):
        """liquid that reads inside the logo AND keeps the hero visible on top of it."""
        if 'liquid' in self.s: return self.col('liquid', 'primary')
        lg = self.logo
        hero = None
        if lg is not None and lg.hero_path is not None:
            hero = lg.hero_color(bgc) if lg.hero['kind'] == 'hole' else to_rgb(lg.hero['color'])
        for role in ('primary', 'accent', 'paper', 'ink', 'bg'):
            c_ = self.ctx.color(role)
            if bgc is not None and contrast(c_, bgc) < 1.25: continue
            if hero is not None and contrast(c_, hero) < 1.3: continue
            return c_
        return self.ctx.color('primary')
    def logo_needs_plate(self, bgc):
        lg = self.logo
        if lg is None or bgc is None: return False
        return contrast(lg.layers[0]['color'], bgc) < 1.25
    def draw_plate(self, c, x, y, size, bgc, a=1.0):
        """a contrasting disc/tile behind the logo when the logo's main colour equals the background."""
        plate = self.s.get('plate', 'auto')
        if plate in (None, False, 'none') or (plate == 'auto' and not self.logo_needs_plate(bgc)): return
        pc = self.ctx.color(self.s.get('plate_color')) if self.s.get('plate_color') else best_on(bgc, [self.ctx.color('paper'), self.ctx.color('ink')])
        lg = self.logo; s = lg.scale(size)
        r = max(lg.w, lg.h) * s * 0.62
        if plate == 'rounded':
            c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x - r, y - r, 2 * r, 2 * r), r * 0.35, r * 0.35), paint(pc, a))
        else:
            c.drawCircle(x, y, r, paint(BLACK, 0.18 * a, blur=r * 0.08)); c.drawCircle(x, y, r, paint(pc, a))
    def times(self, items, lead=0.0, key='at'):
        """absolute times for list items: their own 'at' or spread across the scene on the beat grid."""
        n = len(items); out = []
        span = self.dur - lead
        step = span / max(n, 1)
        if self.ctx.beat and step > self.ctx.beat * 0.75:
            step = max(self.ctx.beat, round(step / self.ctx.beat) * self.ctx.beat)
        for i, it in enumerate(items):
            if isinstance(it, dict) and it.get(key) is not None: out.append(float(it[key]))
            else: out.append(self.start + lead + i * step)
        return out
    def draw(self, c, t): raise NotImplementedError
    def cues(self): return []

# ---------------------------------------------------------------- shared pieces
def blob_path(cx, cy, R, t, amt, seed=0):
    p = skia.Path(); n = 72
    for i in range(n + 1):
        th = 2 * math.pi * i / n
        rr = R * (1 + amt * (0.55 * math.sin(5 * th + t * 9 + seed) + 0.45 * math.sin(3 * th - t * 7 + seed * 2)))
        x, y = cx + rr * math.cos(th), cy + rr * math.sin(th)
        p.moveTo(x, y) if i == 0 else p.lineTo(x, y)
    p.close(); return p

def drop_path(r, L):
    p = skia.Path(); p.moveTo(0, -L)
    p.cubicTo(0.30 * r, -0.62 * L, r, -0.62 * r, r, 0)
    p.cubicTo(r, 0.552 * r, 0.552 * r, r, 0, r)
    p.cubicTo(-0.552 * r, r, -r, 0.552 * r, -r, 0)
    p.cubicTo(-r, -0.62 * r, -0.30 * r, -0.62 * L, 0, -L); p.close(); return p

def rings(c, x, y, t, t0, rgb, specs=((0.0, 600, 14), (0.12, 760, 8), (0.26, 920, 5)), dur=1.2, a=1.0):
    for d, R1, w in specs:
        pp = prog(t, t0 + d, t0 + d + dur)
        if 0 < pp < 1:
            c.drawCircle(x, y, 30 + R1 * eo_cubic(pp), paint(rgb, a * (1 - pp) ** 1.3, stroke=w * (1 - 0.6 * pp) + 1))

def giant_type(c, text, lt, rgb, a, font_name):
    """giant faint letters stacked down the frame behind the logo. lt = seconds since the backdrop first appeared."""
    if a <= 0 or not text: return
    chars = [ch for ch in text.upper() if ch.strip()][:5]
    n = len(chars)
    size = min(760, 1780 / max(n, 1) * 1.02)
    f = font(font_name, size); ch_h = cap_h(f)
    gap = 1780 / max(n, 1)
    drift = 38 * lt
    for i, ch in enumerate(chars):
        w = f.measureText(ch)
        x = 540 + math.sin(lt * 0.6 + i) * 14
        yc = 70 + gap * (i + 0.5) - drift * (0.85 + 0.1 * i) + 40
        c.drawString(ch, x - w / 2, yc + ch_h / 2, f, paint(rgb, a))

def rays(c, cx, cy, ang, a, rgb, n=18):
    if a <= 0: return
    p = skia.Path()
    for i in range(n):
        a0 = math.radians(ang + i * 360 / n); a1 = a0 + math.radians(360 / n / 2)
        p.moveTo(cx, cy); p.lineTo(cx + 2600 * math.cos(a0), cy + 2600 * math.sin(a0))
        p.lineTo(cx + 2600 * math.cos(a1), cy + 2600 * math.sin(a1)); p.close()
    c.drawPath(p, paint(rgb, a))

_MQ = {}
def outline_word(text, font_name, size):
    key = (text, font_name, size)
    if key not in _MQ:
        f = font(font_name, size)
        gl = f.textToGlyphs(text); ws = f.getWidths(gl)
        p = skia.Path(); x = 0.0
        for g, w in zip(gl, ws):
            gp = f.getPath(g)
            if gp is not None:
                q = skia.Path(gp); q.offset(x, 0); p.addPath(q)
            x += w
        p = skia.Simplify(p) or p
        ch = cap_h(f)
        dot = skia.Path(); dot.addCircle(x + size * 0.42, -ch / 2, size * 0.1); p.addPath(dot)
        _MQ[key] = (p, x + size * 0.84, ch)
    return _MQ[key]

def marquee(c, text, font_name, y, offset, rgb, a, size=150, filled=False):
    if a <= 0: return
    p, w, ch = outline_word(text.upper(), font_name, size)
    x = -(offset % w) - w
    pt = paint(rgb, a) if filled else paint(rgb, a, stroke=3.2)
    while x < W + w:
        c.save(); c.translate(x, y + ch / 2); c.drawPath(p, pt); c.restore(); x += w

def tile(c, x, y, s, rot, num, sym, label, bgc, fgc, labc, disp, lab_font, a=1.0):
    c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s)
    if a < 1: c.saveLayerAlpha(None, int(a * 255))
    S = 360
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(-S / 2 + 10, -S / 2 + 18, S, S), 48, 48), paint(BLACK, 0.18, blur=20))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(-S / 2, -S / 2, S, S), 48, 48), paint(bgc))
    if num: draw_text(c, num, lab_font, 38, -S / 2 + 36, -S / 2 + 54, fgc, align='l')
    c.drawCircle(S / 2 - 48, -S / 2 + 48, 13, paint(fgc))
    sz = fit_size(sym, disp, S * 0.72, 160)
    draw_text(c, sym, disp, sz, 0, -10, fgc)
    lsz = fit_size(label.upper(), lab_font, S * 0.8, 36, 0.16)
    draw_text(c, label.upper(), lab_font, lsz, 0, S / 2 - 52, labc, track_em=0.16)
    if a < 1: c.restore()
    c.restore()

def hop_offset(t, beats, h=70, dur=0.32):
    dy, sq = 0.0, 0.0
    for b in beats:
        if b <= t < b + dur: dy = -h * math.sin(math.pi * (t - b) / dur)
        sq += wobble(t - (b + dur), 3.5, 7.0) * 0.5
    return dy, sq

# ====================================================================== scenes
@scene('drop_open')
class DropOpen(Scene):
    """A single drop of brand colour forms, falls and splashes on a clean field. Pairs with a 'flood' transition."""
    energy = 0
    caption_y = 1450
    def setup(self):
        self.x = self.p('x', 540); self.y = self.p('y', 1000)
        self.color = self.col('color', 'bg')
        self.k = self.dur / 3.0
        self.t_detach = self.start + 0.55 * self.k
        self.t_hit = self.start + 1.5 * self.k
    def draw(self, c, t):
        bgc = self.fill_bg(c, 'paper')
        if bgc is not None:
            c.drawRect(skia.Rect.MakeXYWH(-4, -4, W + 8, H + 8), paint(shader=radial(W / 2, H / 2, H * 0.8, [(0, WHITE, 0), (1, mix(bgc, BLACK, 0.08), 0.55)])))
        x, y0, k, colr = self.x, self.y, self.k, self.color
        z = 1.0 + 0.05 * smooth(self.lt(t) / self.dur)
        c.save(); c.translate(x, y0); c.scale(z, z); c.translate(-x, -y0)
        g = smooth(prog(t, self.start + 0.3 * k, self.t_hit)) * (1 - 0.6 * prog(t, self.t_hit, self.t_hit + 0.7 * k))
        soft_light(c, x, y0, 280, colr, 0.16 * g)
        if t < self.t_detach:
            p = smooth(prog(t, self.start, self.t_detach))
            cy = lerp(-30, 95, p); r = lerp(26, 44, p)
            neck = skia.Path(); neck.moveTo(x - r * 0.9, -10)
            neck.cubicTo(x - r * 0.5, cy - r * 0.8, x - r, cy - r * 0.4, x - r, cy)
            neck.lineTo(x + r, cy); neck.cubicTo(x + r, cy - r * 0.4, x + r * 0.5, cy - r * 0.8, x + r * 0.9, -10); neck.close()
            c.drawPath(neck, paint(colr)); c.drawCircle(x, cy, r, paint(colr))
            c.drawCircle(x - r * 0.35, cy - r * 0.1, r * 0.2, paint(WHITE, 0.5))
        elif t < self.t_hit:
            p = prog(t, self.t_detach, self.t_hit); yy = lerp(95, y0, p * p); v = 2 * p; r = 44
            L = r * (1.25 + 1.1 * v) + 30 * math.exp(-(t - self.t_detach) * 14)
            c.save(); c.translate(x, yy); c.scale(1 - 0.12 * v + 0.08 * wobble(t - self.t_detach, 6, 8), 1)
            c.drawPath(drop_path(r, L), paint(colr)); c.drawCircle(-r * 0.35, -r * 0.1, r * 0.22, paint(WHITE, 0.5)); c.restore()
            pr = prog(t, self.t_detach, self.t_detach + 0.35 * k)
            if pr < 1: c.drawPath(blob_path(x, -20, 40 * (1 - eo_cubic(pr)), t, 0.05), paint(colr))
        else:
            tt = t - self.t_hit
            rings(c, x, y0, t, self.t_hit, colr, ((0.0, 470, 12), (0.14, 610, 8), (0.3, 760, 5)), 1.35 * k)
            R = rand_table(3, 14)
            for i in range(14):
                r = R[i]; ang = 2 * math.pi * i / 14 + r[0] * 0.4
                pp = prog(tt, 0, 0.55 + r[1] * 0.3)
                if pp < 1:
                    d = 60 + (110 + r[2] * 170) * eo_cubic(pp)
                    c.drawCircle(x + math.cos(ang) * d, y0 + math.sin(ang) * d, (7 + r[3] * 9) * (1 - pp), paint(colr))
            Rr = 92 * spring(tt, 2.6, 5.0) * (1 - 0.28 * eio_cubic(prog(t, self.end - 0.45 * k, self.end))) + 2 * math.sin(t * 6)
            c.drawPath(blob_path(x, y0, Rr, t, 0.09 * math.exp(-tt * 2.5) + 0.015), paint(colr))
            c.drawCircle(x - Rr * 0.3, y0 - Rr * 0.3, Rr * 0.16, paint(WHITE, 0.5))
        c.restore()
    def cues(self):
        k = self.k
        return [cue(self.t_detach, 'plink', note='C6', g=0.12), cue(self.t_hit, 'bloop', f0=420, f1=1500, d=0.07, g=0.5),
                cue(self.t_hit, 'plink', note='F6', g=0.18, d=1.2), cue(self.t_hit, 'boom', g=0.45, f0=90, f1=35, d=1.2),
                cue(self.t_hit + 0.12, 'sparkle', g=0.045), cue(self.end - 0.9 * k, 'whoosh_rev', g=0.35, d=0.9)]

@scene('logo_trace')
class LogoTrace(Scene):
    """A glowing pen draws the logo outline, then liquid rises inside it (and optionally resolves to full colour)."""
    energy = 1
    caption_y = 420
    def setup(self):
        self.size = self.p('size', STAGE_SIZE); self.y = self.p('y', STAGE_Y)
        self.which = self.p('trace', 'outline')
        self.trace_end = self.start + self.dur * self.p('trace_frac', 0.62)
        self.level = self.p('fill_level', 0.18)
        self.resolve = self.p('resolve', False)
    def state(self, t):
        return dict(trace=eio_cubic(prog(t, self.start + 0.1, self.trace_end)),
                    level=self.level * spring(t - self.trace_end + 0.15, 1.3, 4.0) if t > self.trace_end - 0.15 else 0.0)
    def draw(self, c, t):
        bgc = self.fill_bg(c, 'bg', glow=0.18)
        if self.p('backdrop'):
            a = 0.9 * smooth(prog(t, self.start + 0.2, self.start + 1.4))
            giant_type(c, self.p('backdrop'), t - self.ctx.backdrop_t0, mix(bgc or BLACK, BLACK, 0.06), a, self.B.display)
        st = self.state(t)
        if self.logo is None: return
        self.logo.draw_fill(c, 540, self.y, self.size, st['level'], t, self.liquid_for(bgc), bubbles=0.4 * st['level'])
        if self.resolve:
            r = smooth(prog(t, self.end - 0.6, self.end - 0.1))
            if r > 0: self.logo.draw(c, 540, self.y, self.size, a=r, hole_fill=bgc)
        self.logo.draw_trace(c, 540, self.y, self.size, st['trace'] if st['trace'] < 1 else 1.0, self.readable('line', 'primary', bgc), 16, which=self.which)
    def cues(self):
        return [cue(self.start + 0.1, 'pen', d=self.trace_end - self.start - 0.1, g=0.05),
                cue(self.start + 0.15, 'plink_run', n=14, step=0.15, g=0.035),
                cue(self.trace_end, 'bloop', f0=250, f1=700, d=0.18, g=0.35)]

@scene('tiles')
class Tiles(Scene):
    """Ingredient tiles slam in on the beat and dive into the logo, which fills a little more each time."""
    energy = 2
    hides_captions = True
    caption_y = None
    def setup(self):
        self.items = self.p('items', [])
        self.T = self.times(self.items, lead=0.0)
        self.size = self.p('size', STAGE_SIZE); self.y = self.p('y', STAGE_Y)
        self.l0 = self.p('start_level', 0.18); self.l1 = self.p('end_level', 0.8)
        self.into = self.p('into_logo', True) and self.logo is not None
        self.styles = self.tile_styles()
    def tile_styles(self):
        """two alternating (body, symbol, label) colour sets whose bodies read on the scene background."""
        if self.p('tile_colors'):
            return [tuple(self.ctx.color(x) for x in st) for st in self.p('tile_colors')]
        C = self.B.colors; bgc = self.bg_rgb('bg') or C['ink']
        out = []
        for body in ('ink', 'paper', 'primary', 'accent', 'bg'):
            b = C[body]
            if contrast(b, bgc) < 1.5 or any(contrast(b, o[0]) < 1.3 for o in out): continue
            sym = best_on(b, [C['bg'], C['accent'], C['primary'], C['ink'], C['paper']]) if contrast(b, C['bg']) < 3 else C['bg']
            if contrast(sym, b) < 2.5: sym = best_on(b, [C['ink'], C['paper']])
            out.append((b, sym, best_on(b, [C['ink'], C['paper']])))
            if len(out) == 2: break
        while len(out) < 2: out.append(out[0] if out else (C['ink'], C['paper'], C['paper']))
        return out
    def plop(self, i): return self.T[i] + 0.78
    def level(self, t):
        n = len(self.items); lv = self.l0
        for i in range(n):
            if t >= self.plop(i): lv += (self.l1 - self.l0) / n * spring(t - self.plop(i), 2.2, 5.0)
        return lv
    def jiggle(self, t):
        w = sum(wobble(t - self.plop(i), 3.2, 5.5) for i in range(len(self.items)))
        return 1 + 0.07 * w, 1 - 0.08 * w
    def tile_state(self, t, i):
        T = self.T[i]; side = -1 if i % 2 == 0 else 1
        hx, hy = 540, self.p('tile_y', 500)
        if t < T - 0.16: return None
        if not self.into:
            cols = 2; gx = 540 + ((i % cols) - 0.5) * 400; gy = 620 + (i // cols) * 400
            p = eo_expo(prog(t, T - 0.16, T + 0.05))
            return lerp(540 + side * 900, gx, p), gy, 0.95 + 0.1 * wobble(t - T, 3.5, 7), side * 30 * (1 - p)
        if t > self.plop(i) + 0.02: return None
        if t < T + 0.5:
            p = eo_expo(prog(t, T - 0.16, T + 0.02))
            return lerp(540 + side * 900, hx, p), hy, 1 + 0.12 * wobble(t - T, 3.5, 7.0), side * 30 * (1 - p) - side * 6 * wobble(t - T, 3, 6)
        p = prog(t, T + 0.5, self.plop(i)); e = ei_cubic(p)
        nx, ny = 540, self.y - self.size / 2 * (self.logo.h / max(self.logo.w, self.logo.h))
        cx, cy = 540 + side * 120, hy - 220
        x = (1 - e) ** 2 * hx + 2 * (1 - e) * e * cx + e * e * nx
        y = (1 - e) ** 2 * hy + 2 * (1 - e) * e * cy + e * e * ny
        return x, y, lerp(1.0, 0.12, e), side * 200 * e
    def draw(self, c, t):
        bgc = self.fill_bg(c, 'bg', glow=0.18)
        if self.p('backdrop'):
            a = 0.9 * (1 - smooth(prog(t, self.end - 0.6, self.end)))
            giant_type(c, self.p('backdrop'), t - self.ctx.backdrop_t0, mix(bgc or BLACK, BLACK, 0.06), a, self.B.display)
        liquid = self.liquid_for(bgc)
        if self.into:
            sx, sy = self.jiggle(t)
            c.save(); c.translate(540, self.y + self.size / 2); c.scale(sx, sy); c.translate(-540, -(self.y + self.size / 2))
            self.logo.draw_fill(c, 540, self.y, self.size, self.level(t), t, liquid,
                                amp=0.02 + 0.03 * sum(pulse(t, self.plop(i), 3) for i in range(len(self.items))), bubbles=0.3 + 0.15 * len([1 for i in range(len(self.items)) if t > self.plop(i)]))
            self.logo.draw_trace(c, 540, self.y, self.size, 1.0, self.readable('line', 'primary', bgc), 16, tips=False, which=self.p('trace', 'outline'))
            c.restore()
            top = self.y - self.size / 2 * (self.logo.h / max(self.logo.w, self.logo.h))
            for i in range(len(self.items)):
                pp = prog(t, self.plop(i), self.plop(i) + 0.5)
                if 0 < pp < 1: c.drawCircle(540, top, 40 + 180 * eo_cubic(pp), paint(WHITE, (1 - pp) * 0.9, stroke=8 * (1 - pp) + 1))
                tt = t - self.plop(i)
                if 0 <= tt < 0.9:
                    R = rand_table(21 + i, 12)
                    for j in range(12):
                        r = R[j]; ang = math.radians(-90 + (r[0] - 0.5) * 110); v = 500 + r[1] * 600
                        x = 540 + math.cos(ang) * v * tt; y = top + math.sin(ang) * v * tt + 1300 * tt * tt
                        rad = (9 + r[2] * 14) * max(0, 1 - tt / (0.55 + r[3] * 0.35))
                        if rad > 0: c.drawCircle(x, y, rad, paint(liquid))
        for i, it in enumerate(self.items):
            st = self.tile_state(t, i)
            if not st: continue
            it = it if isinstance(it, dict) else {'label': str(it)}
            label = it.get('label', '')
            sym = it.get('symbol') or (label[:1].upper() + label[1:2].lower())
            label = self.U(label)
            bgt, fgt, labt = self.styles[i % 2]
            tile(c, st[0], st[1], st[2], st[3], it.get('num', '%02d' % (i + 1)), sym, label, bgt, fgt, labt, self.B.display, self.B.label)
    def cues(self):
        out = []
        notes = ['C5', 'E5', 'G5', 'C6', 'E6', 'G6']
        for i, T in enumerate(self.T):
            out += [cue(T - 0.2, 'whoosh', d=0.22, f0=800, f1=7000, g=0.25, peak=0.85, pan=-0.5 if i % 2 == 0 else 0.5),
                    cue(T, 'tick', g=0.35), cue(T, 'plink', note=notes[i % 6], g=0.16, d=0.9), cue(T, 'boom', g=0.35, f0=120, f1=50, d=0.4), cue(T, 'kick')]
            if self.into:
                out += [cue(T + 0.5, 'whoosh', d=0.3, f0=600, f1=5000, g=0.18, peak=0.6),
                        cue(T + 0.78, 'bloop', f0=300 * 1.15 ** i, f1=1100 * 1.15 ** i, d=0.09, g=0.45), cue(T + 0.78, 'splash', g=0.1)]
        return out

@scene('headline')
class Headline(Scene):
    """Stacked lines that rise letter by letter. Line styles: display | small | accent | serif."""
    hides_captions = True
    energy = 2
    def setup(self):
        self.lines = [l if isinstance(l, dict) else {'text': l} for l in self.p('lines', [])]
        self.T = self.times(self.lines, lead=0.0)
        self.y = self.p('y', 760)
    def layout(self, bgc):
        out = []; y = 0
        for i, l in enumerate(self.lines):
            st = l.get('style', 'display'); txt = l['text']
            if st == 'small':
                name, size, tr = self.B.label, min(76, fit_size(txt.upper(), self.B.label, 900, 76, 0.34)), 0.34; txt = txt.upper()
                rgb = self.ctx.color(l.get('color')) if l.get('color') else self.ctx.on(bgc)
            elif st == 'serif':
                name, size, tr = 'instrument-serif-italic', fit_size(txt, 'instrument-serif-italic', 940, 190), 0
                rgb = self.ctx.color(l.get('color')) if l.get('color') else self.ctx.on(bgc)
            else:
                name, tr = self.B.display, 0; txt = self.U(txt)
                size = fit_size(txt, name, 960, l.get('max_size', 170))
                rgb = self.ctx.color(l.get('color')) if l.get('color') else (self.ctx.on(bgc, 'primary', 1.3) if st == 'accent' else self.ctx.on(bgc))
            ch = cap_h(font(name, size))
            out.append([txt, name, size, tr, rgb, ch])
        gap = 0.62
        total = sum(o[5] for o in out) + sum(max(o[5], 40) * gap for o in out[:-1])
        y = self.y - total / 2
        for o in out:
            o.append(y + o[5] / 2); y += o[5] + max(o[5], 40) * gap
        return out
    def draw(self, c, t):
        bgc = self.fill_bg(c, 'bg')
        out_p = eio_cubic(prog(t, self.end - 0.32, self.end)) if self.p('exit', True) else 0
        for i, (txt, name, size, tr, rgb, ch, yc) in enumerate(self.layout(bgc)):
            if t < self.T[i] - 0.1: continue
            dy = -out_p * (260 + 60 * i)
            c.save(); c.translate(0, dy)
            masked_rise(c, txt, name, size, 540, yc, rgb, 0, a=1 - out_p * 0.3, track_em=tr, stagger=0.018, t=t, t0=self.T[i] - 0.06, dur=0.26, back=1.6)
            c.restore()
    def cues(self):
        chords = [['A4', 'C5', 'E5'], ['A4', 'C5', 'E5'], ['G4', 'C5', 'E5'], ['E4', 'G4', 'C5', 'E5'], ['F4', 'A4', 'C5']]
        return [cue(T, 'stab', notes=chords[i % len(chords)], g=0.22) for i, T in enumerate(self.T)] + \
               ([cue(self.end - 0.32, 'whoosh', d=0.35, f0=1500, f1=8000, g=0.12, peak=0.5)] if self.p('exit', True) else [])

@scene('kinetic_words')
class KineticWords(Scene):
    """One big word (or two-line phrase) per beat. Optional hero character bouncing below the words."""
    hides_captions = True
    energy = 3
    def setup(self):
        self.words = [w if isinstance(w, dict) else {'text': w} for w in self.p('words', [])]
        self.T = self.times(self.words)
        self.hero = self.p('hero', False) and self.logo is not None
        self.y = self.p('y', 700 if self.hero else 900)
        self.land = self.p('land_y', 1480)
        self.max_w = self.p('max_width', 860)
    def draw(self, c, t):
        bgc = self.fill_bg(c, 'bg')
        rgb = self.ctx.color(self.p('color')) if self.p('color') else self.ctx.on(bgc)
        for i, w in enumerate(self.words):
            T = self.T[i]; Tn = self.T[i + 1] if i + 1 < len(self.words) else self.end
            if not (T - 0.05 <= t < Tn): continue
            pin = eo_expo(prog(t, T - 0.05, T + 0.12))
            last = i + 1 == len(self.words)
            pout = ei_cubic(prog(t, Tn - 0.1, Tn)) if (not last or self.p('exit', False)) else 0
            wt = self.U(w['text']); parts = wt.split('\n') if '\n' in wt else ([wt] if len(wt) <= 9 or ' ' not in wt else self._split(wt))
            n = len(parts)
            for li, s in enumerate(parts):
                sz = fit_size(s, self.B.display, self.max_w, self.p('size', 300 if n == 1 else 200))
                f = font(self.B.display, sz); ch = cap_h(f)
                y = self.y + (li - (n - 1) / 2) * ch * 1.35
                c.save(); c.clipRect(skia.Rect.MakeLTRB(0, y - ch * 0.62, W, y + ch * 0.62))
                dy = (1 - pin) * ch * 1.25 - pout * ch * 1.25; sc = 1 + 0.08 * (1 - pin)
                c.translate(540, y + dy); c.scale(sc, sc); c.translate(-540, -y)
                draw_text(c, s, self.B.display, sz, 540, y, self.ctx.color(w['color']) if w.get('color') else rgb)
                c.restore()
        if self.hero:
            dy, sq = hop_offset(t, self.T[1:])
            land = wobble(t - self.start, 3.0, 6.0) if self.p('landing', True) else 0
            sqv = 0.14 * land + 0.08 * sq
            self.logo.draw_hero(c, 540, self.land + dy, 0, self.ctx.on(bgc, 'primary', 1.25), sx=1 + sqv, sy=1 - sqv, anchor='bottom', hero_size=self.p('hero_size', 380))
    @staticmethod
    def _split(s):
        ws = s.split(); h = (len(ws) + 1) // 2; return [' '.join(ws[:h]), ' '.join(ws[h:])]
    def cues(self):
        ch = [['F4', 'A4', 'C5'], ['F4', 'A4', 'C5'], ['G4', 'C5', 'E5'], ['F4', 'A4', 'C5', 'F5']]
        out = []
        for i, T in enumerate(self.T):
            out += [cue(T, 'stab', notes=ch[i % 4], g=0.2, cut=5000), cue(T, 'tick', f=3000, g=0.18)]
        if self.hero and self.p('landing', True): out.append(cue(self.start, 'boom', g=0.55, f0=110, f1=40, d=0.5))
        return out

@scene('build')
class Build(Scene):
    """Tension: rays spin faster, marquees race, the logo shakes and fills, the hero forms inside. Ends on an inhale."""
    energy = 'build'
    caption_y = None
    def setup(self):
        self.y = self.p('y', 1010); self.size = self.p('size', 760)
        self.y0 = self.p('from_y', STAGE_Y); self.size0 = self.p('from_size', STAGE_SIZE)
        self.my = self.p('marquee_y', [300, 1600])
        self.text = self.p('text', 'LOADING')
        self.l0 = self.p('start_level', 0.8)
        self.inhale = self.p('inhale', 0.5)
        self.t_squash = self.end - self.inhale
    def ang(self, t):
        tt = clamp(t, self.start, self.t_squash) - self.start
        return 8 * tt + 9 * tt * tt + 2.6 * tt ** 3
    def off(self, t):
        tt = clamp(t, self.start, self.t_squash) - self.start
        return 60 * tt + 40 * tt * tt + 22 * tt ** 3
    def beat_pulse(self, t):
        if t > self.t_squash: return 0.0
        k = prog(t, self.start, self.t_squash)
        g, amp = (0.25, 0.018) if k < 0.55 else ((0.125, 0.022) if k < 0.85 else (0.0625, 0.026))
        return amp * math.exp(-((t - self.start) % g) * 30)
    def draw(self, c, t):
        bgc = self.fill_bg(c, 'bg')
        ra = smooth(prog(t, self.start + 0.1, self.start + 0.8))
        rays(c, 540, self.y, self.ang(t), 0.75 * ra, self.col('rays', 'accent') if self.p('rays') else mix(bgc or BLACK, BLACK, 0.05))
        soft_light(c, 540, self.y, 820, WHITE, 0.3 * ra + 0.2 * prog(t, self.start + 2, self.t_squash))
        ma = smooth(prog(t, self.start + 0.3, self.start + 0.9))
        mrgb = self.ctx.on(bgc, 'primary', 1.25)
        marquee(c, self.text, self.B.display, self.my[0], self.off(t), mrgb, ma)
        if len(self.my) > 1: marquee(c, self.text, self.B.display, self.my[1], -self.off(t), mrgb, ma)
        if self.logo is None: return
        k = prog(t, self.start, self.t_squash)
        shake = (prog(t, self.start + self.dur * 0.38, self.t_squash) ** 1.6) if t < self.t_squash else 0.25
        jx = noise1(t * 4.0, 2.0) * 12 * shake; jr = noise1(t * 3.3, 7.0) * 2.2 * shake
        ant = eo_cubic(prog(t, self.t_squash, self.t_squash + 0.42))
        sx, sy = 1 + 0.12 * ant, 1 - 0.15 * ant
        mv = eio_cubic(prog(t, self.start, self.start + 0.9))
        y_now = lerp(self.y0, self.y, mv)
        size = lerp(self.size0, self.size, mv) * (1 + self.beat_pulse(t))
        c.save(); c.translate(540 + jx, y_now + size / 2); c.rotate(jr); c.scale(sx, sy); c.translate(-540, -(y_now + size / 2))
        lv = lerp(self.l0, 1.1, eio_cubic(k))
        liquid = self.liquid_for(bgc)
        lg = self.logo
        lg.draw_fill(c, 540, y_now, size, lv, t, liquid, amp=0.01 + 0.025 * shake, bubbles=0.55 + 0.45 * k)
        # the hero materialises inside
        hf = smooth(prog(t, self.start + self.dur * 0.28, self.t_squash - 0.1))
        if hf > 0 and lg.hero_path is not None:
            col_h = lg.hero_color(bgc) if lg.hero['kind'] == 'hole' else lg.hero_color(None)
            c.save(); lg._place(c, 540, y_now, size)
            hx, hy = lg.hero_center
            c.translate(hx + noise1(t * 3, 1) * 10 * shake, hy + noise1(t * 3, 4) * 10 * shake); s_ = 0.94 + 0.06 * hf; c.scale(s_, s_); c.translate(-hx, -hy)
            lg._paint_hero(c, col_h if lg.hero['kind'] == 'hole' else None, bgc, hf); c.restore()
        lg.draw_trace(c, 540, y_now, size, 1.0, self.readable('line', 'primary', bgc), 16, tips=False, which=self.p('trace', 'outline'))
        g = 0.35 * k + 0.3 * self.beat_pulse(t) / 0.02
        if g > 0:
            c.save(); lg._place(c, 540, y_now, size); c.clipPath(lg.outline, skia.ClipOp.kIntersect, True)
            c.drawCircle(lg.w / 2, lg.h, lg.w * 0.6, paint(shader=radial(lg.w / 2, lg.h, lg.w * 0.6, [(0, WHITE, 0.6 * g), (1, WHITE, 0)]))); c.restore()
        c.restore()
    def cues(self):
        out = [cue(self.start, 'riser', d=self.t_squash - self.start, g=0.18), cue(self.t_squash, 'whoosh_rev', d=self.inhale, g=0.3, post=True),
               cue(self.t_squash, 'crash_rev', d=self.inhale, g=0.3, post=True)]
        R = rand_table(5, 40)
        for i in range(40):
            tb = self.start + 0.2 + R[i][0] * (self.t_squash - self.start - 0.3)
            out.append(cue(tb, 'bloop', f0=400 + R[i][1] * 900, f1=1200 + R[i][2] * 1600, d=0.05, g=0.05 + 0.08 * (tb - self.start) / self.dur, pan=R[i][3] * 1.6 - 0.8))
        return out

@scene('pop')
class Pop(Scene):
    """The payoff: the hero bursts out of the logo, flips, lands, and words punch in above it on the beat."""
    hides_captions = True
    energy = 3
    def setup(self):
        self.y = self.p('from_y', 1010); self.size = self.p('size', 760)
        self.land = self.p('land_y', 1560); self.hs = self.p('hero_size', 430)
        self.t_land = self.start + 1.0
        words = [w if isinstance(w, dict) else {'text': w} for w in self.p('words', [])]
        self.kw = None
        if words:
            spec = dict(type='kinetic_words', start=self.t_land, end=self.end, words=words, hero=False, y=self.p('words_y', 560), bg=self.s.get('bg', 'bg'))
            self.kw = KineticWords(spec, self.ctx)
        self.hop_beats = self.kw.T[1:] if self.kw else []
    def draw(self, c, t):
        bgc = self.fill_bg(c, 'bg', glow=0.14)
        lg = self.logo; hero_rgb = self.ctx.on(bgc, 'primary', 1.25)
        lt = self.lt(t)
        if lt < 1.0:
            pan = ei_cubic(prog(lt, 0.0, 0.6)) * 1300
            c.save(); c.translate(0, pan)
            rays(c, 540, self.y, 300 + lt * 260, 0.75 * (1 - prog(lt, 0, 0.5)), mix(bgc or BLACK, BLACK, 0.05))
            if lg and lt < 0.7:
                st = spring(lt, 3.0, 6.0); sx = lerp(1.12, 1.0, st); sy = lerp(0.85, 1.0, st)
                c.save(); c.translate(540, self.y + self.size / 2); c.scale(sx, sy); c.translate(-540, -(self.y + self.size / 2))
                lg.draw_fill(c, 540, self.y, self.size, 1.1 - 0.25 * eo_cubic(prog(lt, 0, 0.3)), t, self.liquid_for(bgc), amp=0.04, bubbles=1.0)
                lg.draw_trace(c, 540, self.y, self.size, 1.0, self.readable('line', 'primary', bgc), 16, tips=False, which=self.p('trace', 'outline'))
                c.restore()
            c.restore()
            top = self.y - self.size / 2 * (lg.h / max(lg.w, lg.h) if lg else 1) + pan
            for d, w in ((0.0, 26), (0.07, 12)):
                pp = prog(lt, d, 0.6 + d)
                if 0 < pp < 1: c.drawCircle(540, top, 30 + 900 * eo_quint(pp), paint(WHITE, 1 - pp, stroke=w * (1 - pp) + 1))
            if lg:
                if lt < 0.55:
                    p = prog(lt, 0, 0.55); yy = lerp(top - 120, 470, eo_cubic(p))
                    rot = -360 * eio_cubic(prog(lt, 0.08, 0.75))
                    sq = 1 - 0.45 * math.exp(-(lt / 0.07) ** 2)
                    lg.draw_hero(c, 540, yy, 0, hero_rgb, rot=rot, sx=sq, sy=1 / math.sqrt(max(sq, .3)), hero_size=self.hs)
                else:
                    p = prog(lt, 0.55, 1.0); rot = -360 * eio_cubic(prog(lt, 0.08, 0.75))
                    yy = lerp(470, self.land - self.hs * 0.5, p * p)
                    lg.draw_hero(c, 540, yy, 0, hero_rgb, rot=rot, sx=1 - 0.08 * p, sy=1 + 0.12 * p, hero_size=self.hs)
            fa = 0.85 * pulse(lt, 0, 9)
            if fa > 0.01: c.drawPaint(paint(WHITE, fa))
            return
        if self.kw: self.kw.draw_words_only(c, t, bgc)
        dy, sq = hop_offset(t, self.hop_beats)
        land = wobble(t - self.t_land, 3.0, 6.0); sqv = 0.14 * land + 0.08 * sq
        if lg: lg.draw_hero(c, 540, self.land + dy, 0, hero_rgb, sx=1 + sqv, sy=1 - sqv, anchor='bottom', hero_size=self.hs)
        pp = prog(t, self.t_land, self.t_land + 0.5)
        if 0 < pp < 1:
            for side in (-1, 1):
                for k in range(4):
                    x = 540 + side * (self.hs * 0.55 + 260 * eo_cubic(pp) * (0.6 + 0.2 * k))
                    c.drawCircle(x, self.land - 10 - 60 * eo_cubic(pp) * (k % 2 + 0.5), (16 - 3 * k) * (1 - pp), paint(hero_rgb))
    def cues(self):
        s = self.start
        out = [cue(s, 'bloop', f0=1400, f1=180, d=0.05, g=0.9), cue(s, 'noise_hit', g=0.6), cue(s, 'boom', g=1.0, f0=75, f1=28, d=1.8),
               cue(s, 'crash', d=2.6, g=0.3), cue(s + 0.02, 'whoosh', d=0.6, f0=500, f1=9000, g=0.3, peak=0.4),
               cue(self.t_land, 'boom', g=0.55, f0=110, f1=40, d=0.5)]
        if self.kw: out += [x for x in self.kw.cues() if x[1] != 'boom']
        return out

def _kw_words_only(self, c, t, bgc):
    hero = self.hero; self.hero = False
    rgb = self.s.get('bg'); self.KW_BG = bgc
    # draw words without filling the background again
    saved = self.fill_bg; self.fill_bg = lambda *a, **k: bgc
    try: self.draw(c, t)
    finally: self.fill_bg = saved; self.hero = hero
KineticWords.draw_words_only = _kw_words_only

@scene('multiply')
class Multiply(Scene):
    """One becomes many: the hero clones into bigger grids each beat, with a colour-wipe per step and a label."""
    hides_captions = True
    energy = 3
    def setup(self):
        self.steps = [s if isinstance(s, dict) else {'label': s} for s in self.p('steps', [])]
        counts = [2, 4, 9, 16, 36, 64]
        for i, st in enumerate(self.steps): st.setdefault('count', counts[min(i, len(counts) - 1)])
        self.T = self.times(self.steps)
        self.schemes = self.ctx.schemes()
        self.grid_c = (540, self.p('grid_y', 1190)); self.side = 980
        self.from_y = self.p('from_y', 1560); self.hs = self.p('hero_size', 430)
    def grid(self, n):
        cols = max(1, int(round(math.sqrt(n)))); rows = int(math.ceil(n / cols))
        if n == 2: cols, rows = 2, 1
        cell = self.side / max(cols, rows); pos = []
        for r in range(rows):
            for q in range(cols):
                if len(pos) < n:
                    pos.append((self.grid_c[0] + (q - (cols - 1) / 2) * cell, self.grid_c[1] + (r - (rows - 1) / 2) * cell))
        return pos, cell * 0.8
    def layout(self, t):
        prev = [(540, self.from_y - self.hs * 0.5)]; prev_s = self.hs; cur = None; li = -1
        for i, st in enumerate(self.steps):
            if t < self.T[i]: break
            li = i; pos, s = self.grid(st['count']); res = []
            for x, y in pos:
                pi = min(range(len(prev)), key=lambda k: (prev[k][0] - x) ** 2 + (prev[k][1] - y) ** 2)
                d = math.hypot(x - self.grid_c[0], y - self.grid_c[1]) / 700
                p = eo_back(prog(t, self.T[i] + d * 0.06, self.T[i] + 0.3 + d * 0.06), 1.5)
                res.append((lerp(prev[pi][0], x, p), lerp(prev[pi][1], y, p), lerp(prev_s, s, p)))
            prev = [(x, y) for x, y, _ in res]; prev_s = s; cur = res
        return cur, li
    def scheme(self, i): return self.schemes[i % len(self.schemes)]
    def draw_step(self, c, t, li):
        bgc, icon, txt = self.scheme(li)
        field(c, bgc)
        icons, _ = self.layout(t)
        T = self.T[li]
        for j, (x, y, s) in enumerate(icons):
            dy = 0.0
            if li == len(self.steps) - 1 and t >= T + 0.4:
                ph = t - T - 0.4 - math.hypot(x - self.grid_c[0], y - self.grid_c[1]) / 1800
                if 0 < ph < 0.35: dy = -28 * math.sin(math.pi * ph / 0.35)
            if self.logo: self.logo.draw_hero(c, x, y + dy, 0, icon, rot=8 * wobble(t - T, 3, 6) * (1 if j % 2 else -1), hero_size=s)
        lab = self.steps[li].get('label', '')
        if lab:
            big = len(self.steps[li].get('label', '')) <= 5 and li == len(self.steps) - 1
            sz = fit_size(self.U(lab), self.B.display, 960, 300 if big else 210)
            pin = eo_expo(prog(t, T - 0.02, T + 0.16)); sc = 1.35 - 0.35 * pin
            c.save(); c.translate(540, 350); c.scale(sc, sc); c.translate(-540, -350)
            draw_text(c, self.U(lab), self.B.display, sz, 540, 350, txt, a=pin); c.restore()
    def draw(self, c, t):
        _, li = self.layout(t)
        if li < 0:
            bgc = self.fill_bg(c, 'bg')
            if self.logo: self.logo.draw_hero(c, 540, self.from_y, 0, self.ctx.on(bgc, 'primary', 1.25), anchor='bottom', hero_size=self.hs)
            return
        T = self.T[li]; wp = eo_expo(prog(t, T, T + 0.2))
        if wp >= 1: return self.draw_step(c, t, li)
        if li > 0: self.draw_step(c, T - 0.001, li - 1)
        else:
            bgc = self.fill_bg(c, 'bg')
            if self.logo: self.logo.draw_hero(c, 540, self.from_y, 0, self.ctx.on(bgc, 'primary', 1.25), anchor='bottom', hero_size=self.hs)
        c.save(); pth = skia.Path(); pth.addCircle(self.grid_c[0], self.grid_c[1] - 100, 2300 * wp)
        c.clipPath(pth, skia.ClipOp.kIntersect, True); self.draw_step(c, t, li); c.restore()
    def cues(self):
        ch = [['F4', 'A4', 'C5'], ['G4', 'Bb4', 'D5'], ['A4', 'C5', 'F5'], ['Bb4', 'D5', 'F5'], ['C5', 'F5', 'A5'], ['D5', 'F5', 'A5']]
        out = []
        for i, T in enumerate(self.T):
            k = min(self.steps[i]['count'], 12)
            out.append(cue(T, 'stab', notes=ch[i % 6], g=0.22, cut=5500)); out.append(cue(T, 'whoosh', d=0.25, f0=900, f1=8000, g=0.12, peak=0.3))
            for j in range(k): out.append(cue(T + j * 0.18 / k, 'bloop', f0=500 * 1.12 ** i * (1 + 0.5 * ((j * 7) % 5) / 5), f1=1300 * 1.12 ** i, d=0.06, g=0.32 / math.sqrt(k), pan=((j * 37) % 17) / 8.5 - 1))
        if self.T: out += [cue(self.T[-1], 'crash', d=1.8, g=0.18), cue(self.T[-1] + 0.45, 'pluck_run', n=10, g=0.07)]
        return out

@scene('stat')
class Stat(Scene):
    """A big number counts up inside a drawing ring, with a label. value: 0-9 digits, prefix/suffix strings."""
    hides_captions = True
    energy = 2
    def setup(self):
        self.v0 = float(self.p('from', 0)); self.v1 = float(self.p('value', 100))
        self.dec = int(self.p('decimals', 0)); self.y = self.p('y', 900)
        if self.p('land_at') is not None:      # the count lands exactly when the number is spoken
            t1 = float(self.p('land_at')); self.t_count = (max(self.start + 0.1, t1 - 1.4), t1)
        else: self.t_count = (self.start + 0.25, self.start + 0.25 + min(1.6, self.dur * 0.55))
    def val(self, t):
        return lerp(self.v0, self.v1, eo_expo(prog(t, *self.t_count)))
    def draw(self, c, t):
        bgc = self.fill_bg(c, 'bg', glow=0.15)
        fg = self.ctx.on(bgc); acc = self.ctx.on(bgc, 'primary', 1.25)
        v = self.val(t)
        s = f"{self.p('prefix', '')}{v:,.{self.dec}f}{self.p('suffix', '')}"
        final = f"{self.p('prefix', '')}{self.v1:,.{self.dec}f}{self.p('suffix', '')}"
        sz = fit_size(final, self.B.display, 600, 300)
        pin = spring(self.lt(t), 2.0, 6.0); hit = 0.08 * wobble(t - self.t_count[1], 3, 6)
        c.save(); c.translate(540, self.y); c.scale(pin * (1 + hit), pin * (1 + hit)); c.translate(-540, -self.y)
        R = 430
        p = eo_expo(prog(t, *self.t_count))
        c.drawCircle(540, self.y, R, paint(mix(bgc or BLACK, fg, 0.12), 1, stroke=26))
        arc = skia.Path(); arc.addArc(skia.Rect.MakeXYWH(540 - R, self.y - R, 2 * R, 2 * R), -90, 359.9 * p)
        c.drawPath(arc, paint(acc, stroke=26))
        draw_text(c, s, self.B.display, sz, 540, self.y, fg)
        c.restore()
        lab = self.p('label')
        if lab:
            lsz = fit_size(self.U(lab), self.B.label, 900, 64, 0.2)
            masked_rise(c, self.U(lab), self.B.label, lsz, 540, self.y + R + 150, fg, 0, track_em=0.2, stagger=0.012, t=t, t0=self.t_count[1] - 0.2)
    def cues(self):
        out = [cue(self.start, 'whoosh', d=0.4, f0=600, f1=6000, g=0.2, peak=0.6)]
        t = self.t_count[0]; i = 0
        while t < self.t_count[1]:
            out.append(cue(t, 'tick', f=1600 + i * 40, g=0.12)); i += 1
            k = prog(t, *self.t_count); t += 0.04 + 0.16 * k * k
        out += [cue(self.t_count[1], 'stab', notes=['C5', 'E5', 'G5', 'C6'], g=0.24), cue(self.t_count[1], 'boom', g=0.5, f0=100, f1=40, d=0.6)]
        return out

@scene('showcase')
class Showcase(Scene):
    """A screenshot (website, app, product) in a phone or browser frame: rises in, scrolls, gets tapped. url pill below."""
    hides_captions = True
    energy = 2
    def setup(self):
        import os
        path = self.p('image')
        path = path if os.path.isabs(path) else os.path.join(self.ctx.story.get('_dir', '.'), path)
        self.img = skia.Image.MakeFromEncoded(skia.Data.MakeFromFileName(path))
        self.frame = self.p('frame', 'phone')
        if self.frame == 'phone': self.fw, self.fh = 600, 1230
        else: self.fw, self.fh = 940, 1080
        self.y = self.p('y', 1030 if self.p('headline') else 960)
    def draw(self, c, t):
        bgc = self.fill_bg(c, 'bg', glow=0.2)
        fg = self.ctx.on(bgc)
        lt = self.lt(t)
        hl = self.p('headline')
        top_y = 260
        if hl:
            sz = fit_size(self.U(hl), self.B.display, 940, 110)
            masked_rise(c, self.U(hl), self.B.display, sz, 540, top_y, fg, 0, stagger=0.02, t=t, t0=self.start + 0.05)
        e = spring(lt - 0.1, 1.8, 5.5)
        y = lerp(H + self.fh / 2 + 100, self.y, e)
        rot = 6 * (1 - e) + 0.6 * math.sin(lt * 1.3)
        c.save(); c.translate(540, y); c.rotate(rot)
        fw, fh = self.fw, self.fh
        r = 76 if self.frame == 'phone' else 34
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(-fw / 2 + 8, -fh / 2 + 30, fw, fh), r, r), paint(BLACK, 0.3, blur=40))
        frame_rgb = self.ctx.color(self.p('frame_color')) if self.p('frame_color') else (self.ctx.color('ink') if bgc is None or contrast(self.ctx.color('ink'), bgc) >= 1.4 else self.ctx.color('paper'))
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(-fw / 2, -fh / 2, fw, fh), r, r), paint(frame_rgb))
        bez = 18 if self.frame == 'phone' else 14
        top_bar = 0 if self.frame == 'phone' else 64
        inner = skia.Rect.MakeXYWH(-fw / 2 + bez, -fh / 2 + bez + top_bar, fw - 2 * bez, fh - 2 * bez - top_bar)
        if self.frame != 'phone':
            for i, cc in enumerate([(255, 95, 86), (255, 189, 46), (39, 201, 63)]):
                c.drawCircle(-fw / 2 + 44 + i * 34, -fh / 2 + 46, 10, paint(cc))
            url = self.p('url', '')
            if url:
                c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(-fw / 2 + 160, -fh / 2 + 24, fw - 200, 44), 22, 22), paint(WHITE, 0.12))
                draw_text(c, url, self.B.text, 26, -fw / 2 + 190, -fh / 2 + 46, WHITE, a=0.8, align='l')
        c.save(); c.clipRRect(skia.RRect.MakeRectXY(inner, r - bez if self.frame == 'phone' else 6, r - bez if self.frame == 'phone' else 6), True)
        iw, ih = self.img.width(), self.img.height()
        sc = inner.width() / iw; dh = ih * sc
        max_scroll = max(0, dh - inner.height())
        sp = eio_cubic(prog(lt, self.dur * 0.32, self.dur * 0.82)) * min(max_scroll, inner.height() * self.p('scroll_screens', 2.2))
        c.drawImageRect(self.img, skia.Rect.MakeXYWH(inner.left(), inner.top() - sp, inner.width(), dh),
                        skia.SamplingOptions(skia.FilterMode.kLinear, skia.MipmapMode.kLinear))
        c.restore()
        if self.frame == 'phone':
            c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(-80, -fh / 2 + 34, 160, 40), 20, 20), paint(frame_rgb))
        tp = prog(lt, self.dur * 0.86, self.dur * 0.86 + 0.5)
        if 0 < tp < 1:
            c.drawCircle(0, fh * 0.12, 40 + 120 * eo_cubic(tp), paint(WHITE, 0.6 * (1 - tp)))
            c.drawCircle(0, fh * 0.12, 34 * (1 - 0.3 * tp), paint(WHITE, 0.85 * (1 - tp)))
        c.restore()
        url = self.p('url')
        if url and self.frame == 'phone':
            pe = eo_back(prog(lt, self.dur * 0.55, self.dur * 0.55 + 0.4), 1.6)
            if pe > 0:
                f = font(self.B.label, 48); w = f.measureText(url) + 90
                py = min(self.y + self.fh / 2 + 10, H - 430)
                c.save(); c.translate(540, py); c.scale(pe, pe)
                c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(-w / 2, -50, w, 100), 50, 50), paint(self.ctx.on(bgc, 'ink') if bgc else self.ctx.color('paper')))
                draw_text(c, url, self.B.label, 48, 0, 0, bgc or self.ctx.color('ink'))
                c.restore()
    def cues(self):
        d = self.dur
        return [cue(self.start + 0.05, 'whoosh', d=0.5, f0=400, f1=7000, g=0.3, peak=0.5), cue(self.start + 0.3, 'boom', g=0.3, f0=110, f1=45, d=0.5),
                cue(self.start + d * 0.32, 'swish', d=d * 0.5, g=0.08), cue(self.start + d * 0.55, 'bloop', f0=300, f1=900, d=0.12, g=0.3),
                cue(self.start + d * 0.86, 'tick', f=2200, g=0.3)]

@scene('cta')
class CTA(Scene):
    """Call to action. mode 'comment' (comment KEYWORD) or 'link' (url pill + 'link in bio')."""
    hides_captions = True
    energy = 2
    def draw(self, c, t):
        bgc = self.fill_bg(c, 'bg', glow=0.2)
        fg = self.ctx.on(bgc); lt = self.lt(t)
        top = self.p('top', 'COMMENT' if self.p('mode', 'comment') == 'comment' else 'TAP THE LINK')
        key = self.p('keyword') or self.p('url', '')
        sub = self.p('sub', '')
        y0 = self.p('y', 960)                     # centre of the keyword pill; everything stacks around it
        show_logo = self.logo and self.p('show_logo', True)
        if show_logo:
            e = 0.25 + 0.75 * spring(lt, 2.0, 6.5); ls = self.p('logo_size', 340) * e
            self.draw_plate(c, 540, y0 - 470, ls, bgc)
            self.logo.draw(c, 540, y0 - 470, ls, hole_fill=bgc)
        sz = fit_size(self.U(top), self.B.label, 900, 74, 0.3)
        masked_rise(c, self.U(top), self.B.label, sz, 540, y0 - 210, fg, 0, track_em=0.3, stagger=0.015, t=t, t0=self.start + 0.15)
        pe = eo_back(prog(lt, 0.4, 0.85), 1.4)
        if pe > 0 and key:
            disp = key.upper() if self.p('mode', 'comment') == 'comment' else key
            ks = fit_size(disp, self.B.display, 820, 190)
            f = font(self.B.display, ks); w = f.measureText(disp) + 140; h_ = cap_h(f) + 130
            if self.p('pill'): pill_bg = self.ctx.color(self.p('pill'))
            else: pill_bg = max([self.ctx.color('ink'), self.ctx.color('paper'), self.ctx.color('primary')], key=lambda x: contrast(x, bgc or BLACK))
            pill_fg = self.ctx.color(self.p('pill_text')) if self.p('pill_text') else max([self.ctx.color('bg'), self.ctx.color('accent'), self.ctx.color('ink'), self.ctx.color('paper')],
                                                                                        key=lambda x: (contrast(x, pill_bg) >= 4.0, x == self.ctx.color('bg'), contrast(x, pill_bg)))
            k = 1 + 0.04 * math.sin(max(0, lt - 1.2) * 2 * math.pi / (self.ctx.beat * 2))
            c.save(); c.translate(540, y0); c.scale(pe * k, pe * k)
            c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(-w / 2, -h_ / 2 + 14, w, h_), h_ / 2, h_ / 2), paint(BLACK, 0.2, blur=18))
            c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(-w / 2, -h_ / 2, w, h_), h_ / 2, h_ / 2), paint(pill_bg))
            draw_text(c, disp, self.B.display, ks, 0, 0, pill_fg); c.restore()
        y = y0 + 230
        if sub:
            pp = eo_cubic(prog(lt, 0.9, 1.4))
            for i, line in enumerate(wrap_lines(sub, self.B.text, 58, 880)):
                draw_text(c, line, self.B.text, 58, 540, y + i * 80 + 30 * (1 - pp), fg, a=0.92 * pp)
            y += 80 * len(wrap_lines(sub, self.B.text, 58, 880)) + 40
        if self.p('arrow', True):
            ap = prog(lt, 1.2, 1.6)
            if ap > 0:
                ya = min(y + 90, 1440) + 26 * abs(math.sin((lt - 1.2) * math.pi / self.ctx.beat))
                pth = skia.Path(); pth.moveTo(540, ya - 70); pth.lineTo(540, ya + 40); pth.moveTo(490, ya - 10); pth.lineTo(540, ya + 42); pth.lineTo(590, ya - 10)
                c.drawPath(pth, paint(fg, ap, stroke=14))
    def cues(self):
        s = self.start
        return [cue(s + 0.15, 'tick', g=0.2), cue(s + 0.4, 'bloop', f0=200, f1=700, d=0.12, g=0.4), cue(s + 0.4, 'stab', notes=['C5', 'E5', 'G5'], g=0.22),
                cue(s + 1.2, 'plink', note='G6', g=0.06)]

@scene('resolve')
class Resolve(Scene):
    """Logo resolve: the mark springs in, the hero drops home, glow + sweep, then wordmark, tag pill, tagline, CTA."""
    hides_captions = True
    energy = 1
    def setup(self):
        self.y0 = 960; self.size0 = self.p('size', 860)
        self.t_move = self.start + self.p('move_at', 3.0)
        self.yf = self.p('final_y', 700); self.sizef = self.p('final_size', 620)
        self.hero_return = self.p('hero_return', True) and self.logo is not None and self.logo.hero_path is not None
        self.t_hero = self.start + 0.12
    def place(self, t):
        s0 = self.p('start_scale', 0.25)
        s = s0 + (1 - s0) * spring(t - self.start, 2.0, 7.5) + 0.03 * smooth(prog(t, self.start + 1.0, self.t_move))
        y = self.y0 + 6 * math.sin(min(t, self.t_move) * 1.6)
        e = eio_quint(prog(t, self.t_move, self.t_move + 0.9))
        has_words = bool(self.p('wordmark') or self.p('tag') or self.p('tagline'))
        if not has_words: e = 0
        return lerp(y, self.yf, e), lerp(self.size0 * s, self.sizef * (1 + 0.03), e) if e > 0 else self.size0 * s
    def draw(self, c, t):
        bgc = self.fill_bg(c, 'bg')
        lt = self.lt(t)
        light_bg = bgc is not None and luminance(bgc) > 0.55
        fx = mix(bgc, self.ctx.color('primary') if contrast(self.ctx.color('primary'), bgc) > 1.5 else self.ctx.color('ink'), 0.45) if light_bg else WHITE
        soft_light(c, 540, 900, 1000, WHITE if not light_bg else mix(bgc, self.ctx.color('accent'), 0.25), 0.25 * smooth(prog(lt, 0, 1.2)))
        R = rand_table(31, 40); a = smooth(prog(lt, 0.3, 1.5))
        for i in range(40):
            r = R[i]
            x = r[0] * W + math.sin(t * (0.3 + r[1] * 0.4) + r[2] * 6) * 30
            y = (r[3] * (H + 200) - t * (20 + r[4] * 40)) % (H + 200) - 100
            c.drawCircle(x, y, 2 + r[5] * 5, paint(fx, a * (0.25 + 0.45 * r[6])))
        rings(c, 540, self.y0, t, self.start, fx, ((0.0, 900, 22), (0.08, 900, 10)), 0.8, 0.9)
        lg = self.logo
        if lg is None: return self.words(c, t, bgc)
        y, size = self.place(t)
        hero_xf = None
        if self.hero_return:
            ht = t - self.t_hero
            if ht < 0: hero_xf = dict(dy=-4000)
            elif ht < 0.5:
                p = ht / 0.5; dy = lerp(-1.6 * lg.h, 0, p * p)
                k = math.exp(-((dy + 0.42 * lg.h) / (0.19 * lg.h)) ** 2) if lg.hero['kind'] == 'hole' else 0
                hero_xf = dict(dy=dy, sx=1 - 0.5 * k, sy=1 + 0.35 * k)
            else:
                w_ = wobble(ht - 0.5, 3.0, 6.5); hop = 0.0
                hop_t = self.p('hop_at')
                if hop_t is not None and self.start + hop_t <= t < self.start + hop_t + 0.4:
                    hop = -0.07 * lg.h * math.sin(math.pi * (t - self.start - hop_t) / 0.4)
                w_ += 0.8 * wobble(t - self.start - (hop_t or 99) - 0.4, 3.5, 7)
                hero_xf = dict(dy=hop, sx=1 + 0.16 * w_, sy=1 - 0.16 * w_)
                if abs(w_) < 0.002 and hop == 0: hero_xf = None
        glow = smooth(prog(lt, 0.58, 0.85)) * (1 + 0.45 * pulse(lt, 0.7, 3))
        halo = smooth(prog(lt, 0.8, 1.6)) * self.p('halo', 1.0)
        sweep = prog(lt, 1.6, 2.5) if 1.6 <= lt <= 2.5 else -1
        fw = wobble(t - self.t_hero - 0.5, 2.8, 6) * 0.06 if self.hero_return else 0.0
        rast = 0.0
        if lg.raster is not None and self.p('exact_finish', True):
            raster_ok = not lg.raster_opaque
            if raster_ok: rast = smooth(prog(lt, 2.3, 3.0))
        self.draw_plate(c, 540, y, size, bgc)
        light_mark = luminance(lg.layers[0]['color']) > 0.45
        halo_rgb = (WHITE if light_mark or bgc is None else mix(bgc, WHITE, 0.55)) if not light_bg else mix(bgc, fx, 0.6)
        lg.draw(c, 540, y, size, sx=1 + fw, sy=1 - fw, hole_fill=bgc, hero_xf=hero_xf, halo=halo * (1 - rast) * (1.0 if light_mark else 0.6),
                halo_rgb=halo_rgb, glow=(0.8 * glow * (1 - rast)) if light_mark else 0.0, sweep=sweep if light_mark else -1, raster=rast)
        st = self.p('sparkle_at')
        if st is not None:
            bt = lt - st
            top = y - size / 2 * (lg.h / max(lg.w, lg.h))
            if 0 <= bt < 0.62:
                yy = top - 340 * eo_cubic(bt / 0.62); rr = 26 + 22 * min(1, bt * 4)
                c.drawCircle(540 + math.sin(bt * 9) * 8, yy, rr, paint(fx, 0.95, stroke=5))
                c.drawCircle(540 - rr * 0.35, yy - rr * 0.35, rr * 0.18, paint(fx))
            elif 0.62 <= bt < 1.1:
                pp = prog(bt, 0.62, 1.05); yy = top - 340
                for k in range(8):
                    ang = 2 * math.pi * k / 8; d = 20 + 70 * eo_cubic(pp)
                    c.drawCircle(540 + math.cos(ang) * d, yy + math.sin(ang) * d, 6 * (1 - pp), paint(fx))
        self.words(c, t, bgc)
    def words(self, c, t, bgc):
        fg = self.ctx.on(bgc)
        y = self.yf + self.sizef / 2 + 150
        wm = self.p('wordmark')
        tw = self.t_move + 0.45
        if wm:
            sz = fit_size(self.U(wm), self.B.display, 900, 140)
            masked_rise(c, self.U(wm), self.B.display, sz, 540, y, fg, 0, stagger=0.035, t=t, t0=tw, dur=0.42, back=1.3)
            y += cap_h(font(self.B.display, sz)) / 2 + 110
        tag = self.p('tag')
        if tag:
            pw = eo_expo(prog(t, tw + 0.5, tw + 0.95))
            tsz = min(88, fit_size(self.U(tag), self.B.display, 700, 88, 0.22))
            f = font(self.B.display, tsz); w = max(320, text_w(self.U(tag), f, 0.22 * tsz) + 110); ph = 132
            if pw > 0:
                pill = self.ctx.color('ink') if contrast(bgc or BLACK, self.ctx.color('ink')) > 2 else self.ctx.color('paper')
                rw = w * pw
                c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeLTRB(540 - rw / 2, y - ph / 2, 540 + rw / 2, y + ph / 2), ph / 2, ph / 2), paint(pill))
                c.save(); c.clipRect(skia.Rect.MakeLTRB(540 - rw / 2, y - ph / 2, 540 + rw / 2, y + ph / 2))
                masked_rise(c, self.U(tag), self.B.display, tsz, 540, y, self.ctx.on(pill, 'bg'), 0, track_em=0.22, stagger=min(0.06, 0.45 / max(len(tag), 1)), t=t, t0=tw + 0.67, dur=0.36, back=1.8)
                c.restore()
            y += ph / 2 + 90
        tl = self.p('tagline')
        if tl:
            p = eo_cubic(prog(t, tw + 1.3, tw + 1.9))
            if p > 0: draw_text(c, tl, self.B.text, 52, 540, y + 26 * (1 - p), fg, a=0.85 * p)
            y += 90
        cta = self.p('cta')
        if cta:
            p = eo_cubic(prog(t, tw + 1.8, tw + 2.3))
            if p > 0:
                f = font(self.B.label, 42); w = text_w(self.U(cta), f, 0.12 * 42) + 80
                c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(540 - w / 2, y - 40 + 20 * (1 - p), w, 80), 40, 40), paint(fg, 0.9 * p, stroke=3))
                draw_text(c, self.U(cta), self.B.label, 42, 540, y + 20 * (1 - p), fg, a=p, track_em=0.12)
    def cues(self):
        s = self.start; tw = self.t_move + 0.45
        out = [cue(s, 'boom', g=1.0, f0=70, f1=26, d=2.2), cue(s, 'crash', d=3.0, g=0.2), cue(s, 'boing', f=220, d=0.7, g=0.28)]
        if self.hero_return:
            out += [cue(self.t_hero, 'slide_whistle', g=0.08), cue(self.t_hero + 0.24, 'squeeze', g=0.18), cue(self.t_hero + 0.5, 'bloop', f0=300, f1=140, d=0.12, g=0.45)]
        out += [cue(s + 0.6, 'shimmer', g=0.075)]
        if self.p('wordmark') or self.p('tag'):
            out.append(cue(self.t_move - 0.05, 'whoosh', d=0.7, f0=300, f1=4000, g=0.16, peak=0.5))
        if self.p('wordmark'):
            n = len(self.p('wordmark'))
            out += [cue(tw + 0.05 + i * 0.035, 'tick', f=1800 + i * 90, g=0.12, pan=(i - n / 2) / (n / 1.4 + 1)) for i in range(n)]
        if self.p('tag'):
            out += [cue(tw + 0.52, 'bloop', f0=200, f1=600, d=0.1, g=0.35)] + [cue(tw + 0.7 + i * 0.06, 'plink', note=['C6', 'F6', 'A6', 'C7'][i % 4], g=0.07) for i in range(min(4, len(self.p('tag'))))]
        if self.p('tagline'): out.append(cue(tw + 1.35, 'chime', g=0.03))
        if self.p('hop_at') is not None: out += [cue(s + self.p('hop_at'), 'boing', f=330, d=0.4, g=0.2), cue(s + self.p('hop_at') + 0.4, 'tick', f=1400, g=0.15)]
        if self.p('sparkle_at') is not None: out += [cue(s + self.p('sparkle_at'), 'bloop', f0=250, f1=900, d=0.55, g=0.12), cue(s + self.p('sparkle_at') + 0.62, 'pop_sparkle', g=0.4)]
        out.append(cue(s + self.p('move_at', 3.0) + 1.5, 'bloom', g=0.05))
        return out

@scene('blank')
class Blank(Scene):
    """Plain colour field (or nothing over video). Useful as a hold or a breathing beat."""
    energy = 1
    def draw(self, c, t): self.fill_bg(c, 'bg')

@scene('callout')
class Callout(Scene):
    """Sticker-style pills that pop in on the beat (great over raw video). items: [{text, at, x, y, rot, color}]"""
    energy = 2
    layer = 'overlay'
    hides_captions = True
    def setup(self):
        self.items = [i if isinstance(i, dict) else {'text': i} for i in self.p('items', [])]
        self.T = self.times(self.items)
    def draw(self, c, t):
        bgc = self.fill_bg(c, 'none')
        for i, it in enumerate(self.items):
            T = self.T[i]
            if t < T: continue
            e = eo_back(prog(t, T, T + 0.32), 2.0)
            out = ei_back(prog(t, self.end - 0.25, self.end), 1.5) if self.p('exit', True) else 0
            s = e * (1 - out)
            if s <= 0.01: continue
            txt = self.U(it['text'])
            pill = self.ctx.color(it.get('color', 'bg' if i % 2 == 0 else 'paper'))
            fg = self.ctx.on(pill)
            sz = min(it.get('size', 78), fit_size(txt, self.B.display, 820, 96))
            f = font(self.B.display, sz); w = f.measureText(txt) + 90; h_ = cap_h(f) + 80
            x = it.get('x', 540); y = it.get('y', 760 + i * 190); rot = it.get('rot', -4 if i % 2 == 0 else 3)
            c.save(); c.translate(x, y); c.rotate(rot + 10 * wobble(t - T, 3, 6)); c.scale(s, s)
            c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(-w / 2 + 6, -h_ / 2 + 12, w, h_), 26, 26), paint(BLACK, 0.35, blur=14))
            c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(-w / 2, -h_ / 2, w, h_), 26, 26), paint(pill))
            draw_text(c, txt, self.B.display, sz, 0, 0, fg)
            c.restore()
    def cues(self):
        return [x for i, T in enumerate(self.T) for x in (cue(T, 'bloop', f0=260, f1=900, d=0.1, g=0.35), cue(T, 'tick', f=2600, g=0.15))]

@scene('hook')
class Hook(Scene):
    hides_captions = True
    """Big 1-3 line hook text for the first seconds of a video. Works over video (scrim) or on a colour field.
    Words slam in one at a time on the beat; a highlight bar sweeps behind the 'mark' word."""
    energy = 2
    def setup(self):
        self.text = self.p('text', '')
        self.mark = self.U(self.p('mark') or '')
        self.y = self.p('y', 760)
        n = len(self.text.split())
        self.wt = self.p('word_times')
        if not self.wt and self.p('sync'):
            words = self.ctx.transcript()
            after = [w for w in words if w['start'] >= self.start - 0.15]
            if len(after) >= n: self.wt = [w['start'] for w in after[:n]]
        if not self.wt:
            step = min(self.ctx.beat / 2, (self.dur * 0.45) / max(n, 1))
            self.wt = [self.start + 0.05 + k * step for k in range(n)]
    def draw(self, c, t):
        bgc = self.fill_bg(c, 'bg')
        fg = self.ctx.color(self.p('color')) if self.p('color') else (self.ctx.on(bgc) if bgc else WHITE)
        words = self.U(self.text).split()
        size = self.p('size', 128)
        lines = wrap_lines(' '.join(words), self.B.display, size, 920)
        while len(lines) > 4 and size > 70:
            size -= 8; lines = wrap_lines(' '.join(words), self.B.display, size, 920)
        f = font(self.B.display, size); ch = cap_h(f); lh = ch * 1.55
        k = 0
        out = eio_cubic(prog(t, self.end - 0.25, self.end)) if self.p('exit', True) else 0
        y0 = self.y - (len(lines) - 1) * lh / 2
        for li, line in enumerate(lines):
            ws = line.split(); sp = size * 0.26
            widths = [f.measureText(w) for w in ws]; total = sum(widths) + sp * (len(ws) - 1)
            x = 540 - total / 2; y = y0 + li * lh
            for wi, w in enumerate(ws):
                T = self.wt[min(k, len(self.wt) - 1)] - 0.03; k += 1
                p = eo_back(prog(t, T, T + 0.2), 2.2)
                if p <= 0: x += widths[wi] + sp; continue
                c.save(); c.translate(x + widths[wi] / 2, y - out * 60); c.scale(p * (1 - out * 0.2), p * (1 - out * 0.2)); c.translate(-(x + widths[wi] / 2), -y)
                is_mark = self.mark and w.strip('.,!?') == self.mark.strip('.,!?')
                if is_mark:
                    hb = eo_expo(prog(t, T + 0.1, T + 0.35))
                    hl = self.ctx.color(self.p('mark_color', 'bg' if bgc is None else 'paper'))
                    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x - 16, y - ch / 2 - 20, (widths[wi] + 32) * hb, ch + 40), 14, 14), paint(hl))
                    col_ = self.ctx.on(hl) if hb > 0.5 else fg
                else: col_ = fg
                if bgc is None: c.drawString(w, x + 4, y + ch / 2 + 6, f, paint(BLACK, 0.5 * (1 - out), blur=8))
                c.drawString(w, x, y + ch / 2, f, paint(col_, 1 - out))
                c.restore()
                x += widths[wi] + sp
    def cues(self):
        out = [cue(T - 0.03, 'tick', f=2000 + 120 * k, g=0.16) for k, T in enumerate(self.wt)]
        out.append(cue(self.wt[0] if self.wt else self.start, 'boom', g=0.35, f0=100, f1=40, d=0.5))
        return out
