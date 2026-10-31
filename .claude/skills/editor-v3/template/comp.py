"""Editor V3 frame helpers: silhouette plates, head matte, type in and behind the head."""
import numpy as np, cv2
import gfx
from gfx import W, H, FPS, clamp, ease_in, ease_out, text_alpha, paste_alpha


class Plate:
    """A generated silhouette clip decoded to 1920x1080, with time warp from voice to clip."""

    def __init__(self, path, knots=None):
        c = cv2.VideoCapture(path)
        self.fps = c.get(cv2.CAP_PROP_FPS) or 24
        fr = []
        while True:
            ok, f = c.read()
            if not ok:
                break
            f = cv2.resize(f, (W, H), interpolation=cv2.INTER_CUBIC)
            fr.append(cv2.cvtColor(f, cv2.COLOR_BGR2RGB))
        c.release()
        self.frames = fr
        self.n = len(fr)
        self.dur = self.n / self.fps
        self.knots = knots  # [(voice_t, clip_t), ...]

    def at(self, t):
        if self.knots:
            ts, cs = zip(*self.knots)
            c = float(np.interp(t, ts, cs))
        else:
            c = t
        i = int(np.clip(round(c * self.fps), 0, self.n - 1))
        return self.frames[i], i


def head_matte(rgb8, th=30):
    """1 where the person is. Largest dark area holding the head, so a dark vignette stays background."""
    s = 3
    small = cv2.resize(rgb8, (W // s, H // s), interpolation=cv2.INTER_AREA)
    mx = small.max(axis=2).astype(np.float32)
    dark = (mx < th).astype(np.uint8)
    dark = cv2.morphologyEx(dark, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    n, lab, stats, _ = cv2.connectedComponentsWithStats(dark, connectivity=4)
    if n <= 1:
        comp = dark
    else:
        # head centre sits right of frame centre, upper half
        hx, hy = int(W * 0.58) // s, int(H * 0.45) // s
        l = lab[hy, hx]
        if l == 0:
            l = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
        comp = (lab == l).astype(np.uint8)
    # fill every hole inside the person, so a glint on the glasses never lets type through
    comp = cv2.morphologyEx(comp, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    cs, _ = cv2.findContours(comp, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    filled = np.zeros_like(comp)
    cv2.drawContours(filled, cs, -1, 1, -1)
    filled = cv2.resize(filled.astype(np.float32), (W, H), interpolation=cv2.INTER_LINEAR)
    return np.clip((cv2.GaussianBlur(filled, (0, 0), 1.6) - 0.35) / 0.3, 0, 1)


def camera(img, zoom=1.0, dx=0.0, dy=0.0, ax=None, ay=None):
    """Scale about the head and offset. dx dy in px."""
    ax = W * 0.6 if ax is None else ax
    ay = H * 0.46 if ay is None else ay
    M = np.float32([[zoom, 0, ax - zoom * ax + dx], [0, zoom, ay - zoom * ay + dy]])
    return cv2.warpAffine(img, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)


def drift(t, seed=0, amp=7.0):
    """Slow handheld drift, as his camera is never locked off."""
    r = np.random.RandomState(seed)
    p = r.uniform(0, 6.28, 4)
    return (amp * np.sin(t * 0.55 + p[0]) + amp * 0.4 * np.sin(t * 1.3 + p[1]),
            amp * 0.6 * np.sin(t * 0.43 + p[2]) + amp * 0.3 * np.sin(t * 1.1 + p[3]))


def grain(rgb, frame, amt=0.012):
    r = np.random.RandomState(frame % 97)
    n = r.normal(0, amt, (H // 2, W // 2, 1)).astype(np.float32)
    n = cv2.resize(n, (W, H), interpolation=cv2.INTER_LINEAR)[..., None]
    return np.clip(rgb + n, 0, 1)


def caption(rgb, txt, t_in, t_out, t, y=0.872, x=0.5, size=36, weight='medium'):
    """Small tight caption. Fades over 2 to 3 frames, as his do."""
    if t < t_in or t >= t_out or not txt:
        return rgb
    v = min(clamp((t - t_in) / 0.10), clamp((t_out - t) / 0.10) if t_out - t < 0.10 else 1.0)
    a = text_alpha(txt, size, weight, tracking=-0.035)
    c = np.zeros((H, W), np.float32)
    paste_alpha(c, a, W * x, H * y, v)
    return np.clip(rgb * (1 - c[..., None]) + c[..., None], 0, 1)


def title(rgb, txt, t, t_in, t_out, smear=0.3, cx=None, cy=None, size=66):
    """Date title inside the head. Grows slowly, then smears sideways on the way out."""
    if t < t_in or t >= t_out:
        return rgb
    cx = W * 0.59 if cx is None else cx
    cy = H * 0.455 if cy is None else cy
    d = t_out - t_in
    grow = 1 + 0.05 * (t - t_in) / max(d, 1e-3)
    fade = clamp((t - t_in) / 0.12)
    s = clamp((t - (t_out - smear)) / smear) if smear > 0 else 0
    a = gfx.smear_title(txt, size * grow, s)
    c = np.zeros((H, W), np.float32)
    paste_alpha(c, a, cx, cy, fade)
    return np.clip(rgb * (1 - c[..., None]) + c[..., None], 0, 1)


def behind(rgb, matte, items, color=(0.10, 0.28, 1.0), glow=0.9):
    """Huge words behind the head. items: list of (text, cx, cy, size, visibility 0..1)."""
    c = np.zeros((H, W), np.float32)
    for txt, cx, cy, size, vis in items:
        if not txt or vis <= 0:
            continue
        a = text_alpha(txt, size, 'bold', tracking=-0.045)
        paste_alpha(c, a, cx, cy, vis)
    if c.max() <= 0:
        return rgb
    color = np.array(color, np.float32)
    small = cv2.resize(c, (W // 3, H // 3), interpolation=cv2.INTER_AREA)
    g = cv2.resize(cv2.GaussianBlur(small, (0, 0), 7), (W, H))
    lay = c[..., None] * color + g[..., None] * color * glow
    bg = (1 - matte)[..., None]
    return np.clip(rgb + lay * bg, 0, 1)


def mix(a, b, m):
    return a * (1 - m) + b * m


def burn_seq(base, f, seed=0):
    """Film burn over a base frame. f is the frame index of the burn. 0 scratch, 1 wash, 2 and 3 full."""
    if f == 0:
        o, _ = gfx.film_burn('scratch', seed)
        return np.clip(base + o, 0, 1)
    if f == 1:
        o, m = gfx.film_burn('wash', seed)
        return mix(base, o, m)
    o, m = gfx.film_burn('full', seed)
    return o
