"""Brand + render context shared by every scene."""
import json, os
from core import *
from logo import Logo

ROLE_DEFAULTS = {'bg': '#111111', 'primary': '#FFFFFF', 'ink': '#121212', 'paper': '#FFFFFF', 'accent': '#888888'}

class Brand:
    def __init__(self, path):
        with open(path) as f: self.d = json.load(f)
        self.dir = os.path.dirname(os.path.abspath(path))
        cols = dict(ROLE_DEFAULTS); cols.update(self.d.get('colors', {}))
        self.colors = {k: to_rgb(v) for k, v in cols.items()}
        fonts = self.d.get('fonts', {})
        def fp(v):   # a bundled font name, or a .ttf/.otf the member supplied (path relative to brand.json)
            if v.lower().endswith(('.ttf', '.otf')) and not os.path.isabs(v): return os.path.join(self.dir, v)
            return v
        self.display = fp(fonts.get('display', 'unbounded'))
        self.text = fp(fonts.get('text', 'space-grotesk-medium'))
        self.label = fp(fonts.get('label', 'space-grotesk'))
        lp = self.d.get('logo')
        self.logo = None
        if lp:
            lp = lp if os.path.isabs(lp) else os.path.join(self.dir, lp)
            self.logo = Logo(lp)
            if 'hero' in self.d: self.logo.set_hero(self.d['hero'])
        self.name = self.d.get('name', '')

    def get(self, k, default=None): return self.d.get(k, default)

class Ctx:
    def __init__(self, brand, story):
        self.brand = brand
        self.logo = brand.logo
        self.story = story
        self.bpm = float(story.get('bpm', 120))
        self.beat = 60.0 / self.bpm
        self.duration = float(story['duration'])
        self.has_video = bool(story.get('base', {}).get('video'))
        bd = [float(s['start']) for s in story.get('scenes', []) if s.get('backdrop')]
        self.backdrop_t0 = min(bd) if bd else 0.0
        self._words = None

    def transcript(self):
        """words from the first captions overlay (or story['words']), for syncing text to speech."""
        if self._words is None:
            import json as _j
            path = self.story.get('words') or next((o['words'] for o in self.story.get('overlays', []) if o.get('type') == 'captions'), None)
            self._words = []
            if path:
                path = path if os.path.isabs(path) else os.path.join(self.story.get('_dir', '.'), path)
                d = _j.load(open(path)); self._words = d.get('words', d) if isinstance(d, dict) else d
        return self._words

    def color(self, ref, default='ink'):
        if ref is None: ref = default
        if isinstance(ref, (list, tuple)): return tuple(ref[:3])
        if ref in self.brand.colors: return self.brand.colors[ref]
        if ref in ('none', 'transparent'): return None
        return to_rgb(ref)

    def on(self, bg_rgb, prefer=None, min_contrast=2.2):
        """readable foreground for a background: prefer a role if it has enough contrast, else ink/paper.
        Use a low min_contrast (~1.25) for big graphic shapes, keep 2.2+ for text."""
        if prefer:
            pc = self.color(prefer)
            if bg_rgb is None or contrast(bg_rgb, pc) >= min_contrast: return pc
        if bg_rgb is None: return self.brand.colors['paper']
        return best_on(bg_rgb, [self.brand.colors['ink'], self.brand.colors['paper']])

    def schemes(self):
        """colour schemes for wipes/cycles: (background, icon, text)"""
        C = self.brand.colors
        out = []
        for bg, icon in [('ink', 'bg'), ('paper', 'bg'), ('bg', 'primary'), ('ink', 'accent'), ('accent', 'ink'), ('bg', 'ink')]:
            b, i = C[bg], C[icon]
            if contrast(b, i) < 1.3: continue
            out.append((b, i, self.on(b)))
        return out or [(C['bg'], C['primary'], self.on(C['bg']))]
