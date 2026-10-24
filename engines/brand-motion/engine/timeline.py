"""Storyboard -> timeline: scenes on a main track, transitions between them, overlays, optional base video."""
import json, math, os, skia
from core import *
from brand import Brand, Ctx
from scenes import REGISTRY, cue, rings, blob_path

def load_story(path):
    with open(path) as f: story = json.load(f)
    story['_dir'] = os.path.dirname(os.path.abspath(path))
    return story

def rel(story, p):
    if p is None: return None
    return p if os.path.isabs(p) else os.path.join(story['_dir'], p)

# ---------------------------------------------------------------- transitions
class Transition:
    def __init__(self, spec, scene):
        if isinstance(spec, str): spec = {'type': spec}
        self.type = spec.get('type', 'cut')
        self.dur = float(spec.get('dur', {'flood': 0.75, 'circle': 0.35, 'flash': 0.3, 'whip': 0.35, 'zoom': 0.45, 'cut': 0}.get(self.type, 0.4)))
        self.x = spec.get('x', 540); self.y = spec.get('y', 1000 if self.type == 'flood' else 960)
        self.t0 = scene.start; self.scene = scene
    def active(self, t): return self.type != 'cut' and self.t0 <= t < self.t0 + self.dur
    def draw(self, c, t, draw_prev, draw_new):
        p = prog(t, self.t0, self.t0 + self.dur)
        if self.type in ('flood', 'circle'):
            draw_prev(c)
            R = lerp(60, 2400, eo_expo(p)) if self.type == 'flood' else 2300 * eo_expo(p)
            pth = blob_path(self.x, self.y, R, t, 0.025 * (1 - p)) if self.type == 'flood' else skia.Path.Circle(self.x, self.y, max(R, 0.1))
            c.save(); c.clipPath(pth, skia.ClipOp.kIntersect, True); draw_new(c); c.restore()
        elif self.type == 'flash':
            draw_new(c); c.drawPaint(paint(WHITE, 0.9 * (1 - eo_cubic(p))))
        elif self.type == 'whip':
            e = eio_expo(p)
            c.save(); c.translate(0, -H * e); draw_prev(c); c.restore()
            c.save(); c.translate(0, H * (1 - e)); draw_new(c); c.restore()
        elif self.type == 'zoom':
            e = ei_cubic(p)
            draw_new(c)
            c.saveLayerAlpha(None, int(255 * (1 - smooth(prog(p, 0.4, 1.0)))))
            c.translate(540, 960); c.scale(1 + 3 * e, 1 + 3 * e); c.translate(-540, -960); draw_prev(c); c.restore()
        else: draw_new(c)
    def cues(self):
        t = self.t0
        return {'flood': [cue(t, 'boom', g=0.9, f0=80, f1=30, d=1.8), cue(t, 'whoosh', d=1.2, f0=9000, f1=300, g=0.45, peak=0.15), cue(t, 'crash', d=2.2, g=0.12)],
                'circle': [cue(t - 0.05, 'whoosh', d=0.4, f0=700, f1=7000, g=0.22, peak=0.6)],
                'flash': [cue(t, 'noise_hit', g=0.4), cue(t, 'boom', g=0.6, f0=90, f1=35, d=0.8)],
                'whip': [cue(t - 0.05, 'whoosh', d=0.45, f0=500, f1=9000, g=0.3, peak=0.5)],
                'zoom': [cue(t - 0.15, 'whoosh_rev', d=0.6, g=0.3)]}.get(self.type, [])

# ---------------------------------------------------------------- overlays
class Captions:
    """Word-by-word captions from a transcript (words.json: [{word, start, end}])."""
    def __init__(self, spec, ctx, story):
        self.s = spec; self.ctx = ctx
        with open(rel(story, spec['words'])) as f: words = json.load(f)
        if isinstance(words, dict): words = words.get('words', [])
        self.words = [dict(w) for w in words if w.get('word', '').strip()]
        for i, w in enumerate(self.words):        # transcribers sometimes return zero-length words
            if w['end'] - w['start'] < 0.08:
                nxt = self.words[i + 1]['start'] if i + 1 < len(self.words) else w['start'] + 0.2
                w['end'] = max(w['start'] + 0.08, min(w['start'] + 0.18, nxt))
        self.start = spec.get('start', 0); self.end = spec.get('end', ctx.duration)
        self.y = spec.get('y', 1250)
        self.font = spec.get('font', ctx.brand.label)
        self.size = spec.get('size', 88)
        self.during = spec.get('during', 'video')
        self.upper = spec.get('uppercase', ctx.brand.get('uppercase', True))
        self.hl = ctx.color(spec.get('highlight', 'bg'))
        self.chunks = self._chunk(spec.get('max_words', 3), spec.get('max_chars', 18))
    def _chunk(self, mw, mc):
        out, cur = [], []
        for i, w in enumerate(self.words):
            txt = w['word'].strip()
            gap = (w['start'] - cur[-1]['end']) if cur else 0
            if cur and (len(cur) >= mw or sum(len(x['word']) + 1 for x in cur) + len(txt) > mc or gap > 0.35):
                out.append(cur); cur = []
            cur.append(w)
            if txt[-1:] in '.!?,': out.append(cur); cur = []
        if cur: out.append(cur)
        res = []
        for i, ch in enumerate(out):
            t0 = ch[0]['start'] - 0.05
            t1 = min(ch[-1]['end'] + 0.25, out[i + 1][0]['start'] - 0.05) if i + 1 < len(out) else ch[-1]['end'] + 0.4
            res.append((t0, t1, ch))
        return res
    def draw(self, c, t, main_active, hidden=False):
        if not (self.start <= t < self.end) or hidden: return
        y_slot = self.y
        if main_active is not None and main_active is not False:
            if self.during == 'video': return
            sc = main_active
            y_slot = sc.s.get('caption_y', sc.caption_y) if hasattr(sc, 'caption_y') else self.y
            if y_slot is None or sc.s.get('hide_captions', sc.hides_captions): return
        self_y = self.y; self.y = y_slot
        for t0, t1, ch in self.chunks:
            if not (t0 <= t < t1): continue
            words = [(w['word'].strip().upper() if self.upper else w['word'].strip()) for w in ch]
            words = [w.strip('.,!?') if self.s.get('strip_punct', True) else w for w in words]
            f = font(self.font, self.size); sp = self.size * 0.28
            ws = [f.measureText(w) for w in words]
            lines = [[]]; lw = 0
            for i, w in enumerate(ws):
                if lines[-1] and lw + sp + w > 900: lines.append([]); lw = 0
                lines[-1].append(i); lw += w + (sp if lw else 0)
            pop = eo_back(prog(t, t0, t0 + 0.16), 2.2)
            c.save(); c.translate(540, self.y); c.scale(0.7 + 0.3 * pop, 0.7 + 0.3 * pop); c.translate(-540, -self.y)
            ch_ = cap_h(f); lh = ch_ * 1.9
            for li, idx in enumerate(lines):
                total = sum(ws[i] for i in idx) + sp * (len(idx) - 1)
                x = 540 - total / 2; y = self.y + (li - (len(lines) - 1) / 2) * lh
                for i in idx:
                    w = ch[i]; active = w['start'] - 0.03 <= t < max(w['end'], w['start'] + 0.12)
                    said = t >= w['start'] - 0.03
                    if active:
                        k = eo_back(prog(t, w['start'] - 0.03, w['start'] + 0.1), 2.0)
                        r = skia.Rect.MakeXYWH(x - 18, y - ch_ / 2 - 22, ws[i] + 36, ch_ + 44)
                        c.save(); c.translate(x + ws[i] / 2, y); c.scale(0.85 + 0.15 * k, 0.85 + 0.15 * k); c.rotate(-2 * (1 - k)); c.translate(-(x + ws[i] / 2), -y)
                        c.drawRRect(skia.RRect.MakeRectXY(r, 18, 18), paint(self.hl))
                        c.drawString(words[i], x, y + ch_ / 2, f, paint(self.ctx.on(self.hl)))
                        c.restore()
                    else:
                        c.drawString(words[i], x + 3, y + ch_ / 2 + 5, f, paint(BLACK, 0.45, blur=6))
                        c.drawString(words[i], x, y + ch_ / 2, f, paint(WHITE, 1.0 if said else 0.82))
                    x += ws[i] + sp
            c.restore()
        self.y = self_y

class LogoBug:
    def __init__(self, spec, ctx, story):
        self.s = spec; self.ctx = ctx
        self.start = spec.get('start', 0); self.end = spec.get('end', ctx.duration)
    def draw(self, c, t, main_active, hidden=False):
        lg = self.ctx.logo
        if lg is None or not (self.start <= t < self.end): return
        if main_active and not self.s.get('over_scenes', False): return
        a = smooth(prog(t, self.start, self.start + 0.4)) * (1 - smooth(prog(t, self.end - 0.3, self.end)))
        h_px = self.s.get('size', 90)                      # logo HEIGHT in px (wide wordmarks stay legible)
        size = h_px * max(lg.w, lg.h) / lg.h
        w_px = h_px * lg.w / lg.h
        pad = h_px * 0.32
        corner = self.s.get('corner', 'tl')
        x = SAFE[0] + pad + w_px / 2 if corner == 'tl' else SAFE[2] - pad - w_px / 2
        y = SAFE[1] + pad + h_px / 2
        pop = eo_back(prog(t, self.start, self.start + 0.45), 1.8)
        c.save(); c.translate(x, y); c.scale(0.6 + 0.4 * pop, 0.6 + 0.4 * pop); c.translate(-x, -y)
        plate = self.s.get('plate', True)
        if plate:
            pc = self.ctx.color(self.s.get('plate_color')) if self.s.get('plate_color') else max([self.ctx.color('paper'), self.ctx.color('ink')], key=lambda q: contrast(q, lg.layers[0]['color']))
            r = skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x - w_px / 2 - pad, y - h_px / 2 - pad * 0.8, w_px + 2 * pad, h_px + 1.6 * pad), (h_px + 1.6 * pad) / 2, (h_px + 1.6 * pad) / 2)
            c.drawRRect(r, paint(BLACK, 0.25 * a, blur=10)); c.drawRRect(r, paint(pc, 0.94 * a))
        lg.draw(c, x, y, size, a=a * self.s.get('opacity', 1.0), raster=1.0 if lg.raster is not None and not lg.raster_opaque else 0.0, halo=0.0)
        c.restore()

OVERLAYS = {'captions': Captions, 'logo_bug': LogoBug}

# ---------------------------------------------------------------- timeline
def load_plugins(story):
    """story['plugins']: list of .py files (relative to the story) that define extra @scene classes."""
    import importlib.util
    for i, p in enumerate(story.get('plugins', [])):
        path = rel(story, p)
        spec = importlib.util.spec_from_file_location(f'bms_plugin_{i}', path)
        mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)

class Timeline:
    def __init__(self, story):
        load_plugins(story)
        self.story = story
        self.brand = Brand(rel(story, story.get('brand', 'brand.json')))
        self.ctx = Ctx(self.brand, story)
        self.main, self.over = [], []
        for spec in story['scenes']:
            cls = REGISTRY.get(spec['type'])
            if cls is None: raise ValueError(f"unknown scene type {spec['type']} (have: {', '.join(sorted(REGISTRY))})")
            sc = cls(spec, self.ctx)
            sc.transition = Transition(spec.get('in', 'cut'), sc)
            (self.over if sc.layer == 'overlay' else self.main).append(sc)
        self.main.sort(key=lambda s: s.start)
        self.overlays = [OVERLAYS[o['type']](o, self.ctx, story) for o in story.get('overlays', [])]
        base = story.get('base', {})
        self.zooms = base.get('zooms', [])

    def main_at(self, t):
        cur = None
        for s in self.main:
            if s.start <= t < s.end: cur = s
        return cur

    def prev_of(self, sc):
        i = self.main.index(sc)
        if i > 0 and abs(self.main[i - 1].end - sc.start) < 0.05: return self.main[i - 1]
        return None

    def video_zoom(self, t):
        z = 1.0
        for zz in self.zooms:
            at, sc, d = zz['at'], zz.get('scale', 1.12), zz.get('dur', 0.22)
            hold = zz.get('hold', 1.2)
            k = eo_cubic(prog(t, at, at + d)) * (1 - eio_cubic(prog(t, at + d + hold, at + d + hold + 0.35)))
            z *= 1 + (sc - 1) * k
        return z

    def draw_video(self, c, t, frame_img):
        if frame_img is None:
            field(c, self.brand.colors['ink']); return
        z = self.video_zoom(t)
        c.save(); c.translate(540, 900); c.scale(z, z); c.translate(-540, -900)
        c.drawImageRect(frame_img, skia.Rect.MakeWH(W, H), skia.SamplingOptions(skia.FilterMode.kLinear, skia.MipmapMode.kNone))
        c.restore()

    def draw(self, c, t, frame_img=None):
        c.clear(col(self.brand.colors['bg']))
        if self.ctx.has_video: self.draw_video(c, t, frame_img)
        sc = self.main_at(t)
        if sc is not None:
            tr = sc.transition
            prev = self.prev_of(sc)
            def draw_prev(cv):
                if prev is not None: prev.draw(cv, min(t, prev.end - 1e-3))
                elif self.ctx.has_video: self.draw_video(cv, t, frame_img)
                else: field(cv, self.brand.colors['bg'])
            def draw_new(cv): sc.draw(cv, t)
            if tr.active(t): tr.draw(c, t, draw_prev, draw_new)
            else: sc.draw(c, t)
        for o in self.over:
            if o.start <= t < o.end:
                if o.transition.active(t) and o.transition.type in ('flash',):
                    o.draw(c, t); c.drawPaint(paint(WHITE, 0.9 * (1 - prog(t, o.start, o.start + 0.3))))
                else:
                    a = smooth(prog(t, o.start, o.start + 0.15)) * (1 - smooth(prog(t, o.end - 0.15, o.end)))
                    c.saveLayerAlpha(None, int(255 * a)); o.draw(c, t); c.restore()
        hide_caps = any(o.start <= t < o.end and o.s.get('hide_captions', o.hides_captions) for o in self.over)
        for ov in self.overlays:
            if isinstance(ov, Captions): ov.draw(c, t, sc if sc is not None else None, hidden=hide_caps)
            else: ov.draw(c, t, sc is not None)

    # ------------------------------------------------------------ audio info
    def cues(self):
        out = []
        for s in self.main + self.over:
            out += s.cues(); out += s.transition.cues()
        return sorted(out, key=lambda x: x[0])

    def sections(self):
        return [(s.start, s.end, s.energy) for s in self.main]
