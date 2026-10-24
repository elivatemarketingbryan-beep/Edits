# Writing a custom scene

When the concept needs a motion the library does not have (a seed sprouting, a key turning, a chat bubble typing, a product spinning), write a scene. It is a small class; the engine handles timing, transitions, motion blur, and turns your cues into sound.

## Skeleton

```python
# custom_scenes.py (next to story.json), and add "plugins": ["custom_scenes.py"] to story.json
import math, os, sys, skia
from core import *                      # W, H, easing, paint, font, text helpers (engine/core.py)
from scenes import Scene, scene, cue, rings, blob_path, hop_offset, marquee

@scene('sprout')
class Sprout(Scene):
    """A seed drops into soil, a stem grows, the logo blooms at the top."""
    energy = 2                                   # music intensity for this section

    def setup(self):                             # read params once
        self.y = self.p('y', 1300)
        self.grow_end = self.start + self.dur * 0.6

    def draw(self, c, t):                        # t = absolute time; draw the WHOLE frame
        bgc = self.fill_bg(c, 'bg')              # fills the background (or nothing over video)
        k = eo_cubic(prog(t, self.start, self.grow_end))
        c.drawLine(540, self.y, 540, self.y - 600 * k, paint(self.col('line', 'primary'), stroke=18))
        if self.logo and k > 0.95:
            s = spring(t - self.grow_end, 2.2, 6.0)  # overshoot pop
            self.logo.draw(c, 540, self.y - 700, 400 * s, hole_fill=bgc)
        draw_text(c, 'GROW DAILY', self.B.display, 120, 540, 500, self.ctx.on(bgc))

    def cues(self):                              # sounds, locked to the same times
        return [cue(self.start, 'whoosh', d=0.5, f0=500, f1=6000, g=0.25),
                cue(self.grow_end, 'boing', f=260, g=0.25),
                cue(self.grow_end, 'plink', note='C6', g=0.15)]
```

## What you have

- `self.start`, `self.end`, `self.dur`, `self.p(key, default)` (scene params), `self.col(key, default_role)`, `self.ctx.color(role_or_hex)`, `self.ctx.on(bg_rgb, prefer_role=None)` (readable colour), `self.ctx.beat`, `self.B.display / .text / .label` (font names), `self.times(items)` (spread items on the beat grid).
- **Logo** (`self.logo`, may be None): `draw(c, cx, cy, size, a, rot, sx, sy, mono, raster, hide_hero, hero_xf, hole_fill, halo, glow, sweep)`, `draw_hero(c, x, y, size, color, rot, sx, sy, anchor='center'|'bottom', hero_size=px)`, `draw_trace(c, cx, cy, size, p, rgb, stroke_px)`, `draw_fill(c, cx, cy, size, level, t, rgb, bubbles)`, `draw_silhouette(...)`; `hero_path`, `outline`, `silhouette` (skia Paths in logo units), `w`, `h`.
- **Easing** (core.py): `prog(t, a, b)` 0..1, `smooth`, `eo_cubic`, `eio_cubic`, `eo_expo`, `eio_expo`, `eo_back(x, s)` (overshoot), `spring(seconds, freq, damp)`, `wobble(seconds)` (squash and stretch impulse), `pulse(t, t0, decay)`, `noise1(t, seed)`.
- **Drawing** (core.py): `paint(rgb, a, stroke, blur, shader)`, `radial(...)`, `linear(...)`, `soft_light(c, x, y, r, rgb, a)`, `draw_text(c, s, font, size, x, y_center, rgb, a, align, track_em)`, `masked_rise(...)` (letters rise behind a mask), `fit_size(s, font, max_w, max_size)`, `wrap_lines(...)`, `letters(...)`.
- **Sound cue names:** `plink(note)`, `bloop(f0,f1,d)`, `boom(f0,f1,d)`, `whoosh(d,f0,f1,peak)`, `whoosh_rev(d)`, `riser(d)`, `crash(d)`, `crash_rev(d)`, `tick(f)`, `noise_hit`, `kick`, `splash`, `boing(f,d)`, `stab(notes, d, cut)`, `pen(d)`, `swish(d)`, `plink_run(n, step)`, `sparkle`, `pluck_run(n)`, `slide_whistle`, `squeeze`, `shimmer`, `chime`, `pop_sparkle`, `bloom`. Every cue takes `g` (gain, 0.05 to 1), `pan` (-1..1); `post=True` makes it play through the silence of a build's inhale. Notes are written in F and transposed to the story's key automatically.

## Rules that keep quality high

- Draw the full frame every time from `t` only (no state between frames): frames render in parallel and with motion-blur sub-samples.
- Animate with springs and eases, never linear moves. Give everything an anticipation (small squash before it moves) and a follow-through (overshoot, wobble).
- Put every visual hit on a beat or a spoken word, and give every hit a cue.
- Test it with `render.py --stills` at several times inside the scene before the full render.
