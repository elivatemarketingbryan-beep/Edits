#!/usr/bin/env python3
"""lib.py: the Editor V2 looks. Everything is RGB float32 in 0..1 at 1920x1080. Pictures keep their position, only the treatment changes."""
import functools, glob, json, os
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

cv2.setNumThreads(1)

R = os.environ.get("EDITOR_PROJECT") or os.getcwd()
W, H, FPS = 1920, 1080, 25
XR = f"{R}/xray"  # your own X-ray style pictures, if you use them


def lum(a):
    return a[..., 0] * .2126 + a[..., 1] * .7152 + a[..., 2] * .0722


def rgb(g):
    return np.stack([g, g, g], -1)


def scurve(g, k=.75):
    return g * (1 - k) + g * g * (3 - 2 * g) * k


def bw(a, lo=.03, hi=.93, k=.75):
    return rgb(scurve(np.clip((lum(a) - lo) / (hi - lo), 0, 1), k))


def hi(a, t=.5, s=9):
    return rgb(1 / (1 + np.exp(-s * (lum(a) - t))))


def neg(a):
    return 1 - a


def gmap(g, stops):
    xs = [s[0] for s in stops]
    return np.stack([np.interp(g, xs, [s[1][c] for s in stops]) for c in range(3)], -1).astype(np.float32)


BLUE = [(0, (0, 0, .03)), (.22, (.01, .08, .32)), (.5, (.1, .4, .85)), (.78, (.5, .84, 1)), (1, (.95, 1, 1))]
ICE = [(0, (0, .01, .03)), (.4, (.3, .42, .5)), (.8, (.82, .92, .96)), (1, (1, 1, 1))]
COLD = [(0, (0, 0, .02)), (.5, (.24, .29, .38)), (1, (.86, .94, 1))]
CREAM = [(0, (.03, .02, .02)), (.5, (.5, .46, .4)), (1, (.98, .95, .88))]
SEPIA = [(0, (.03, .02, .01)), (.45, (.48, .38, .26)), (1, (.95, .89, .76))]
ORANGE = [(0, (.32, .1, .03)), (.33, (.86, .38, .08)), (.68, (.98, .74, .52)), (1, (1, 1, 1))]
THERMAL = [(0, (0, 0, 0)), (.2, (.45, .05, .02)), (.45, (.95, .4, .02)), (.7, (1, .85, .2)), (1, (1, 1, .95))]
GOLD = [(0, (0, 0, 0)), (.3, (.05, .15, .35)), (.5, (.25, .4, .55)), (.65, (.95, .62, .08)), (.85, (1, .85, .25)), (1, (1, 1, .9))]
ROSE = [(0, (.5, .03, .18)), (.5, (.9, .35, .5)), (1, (1, .96, .96))]
TEAL = [(0, (0, .04, .05)), (.4, (.04, .46, .42)), (.75, (.35, .95, .75)), (1, (.9, 1, .95))]
SOLAR = [(0, (.02, .02, .1)), (.2, (.05, .42, .45)), (.38, (.2, .9, .7)), (.52, (.95, .95, .9)), (.68, (1, .45, .75)), (.84, (.9, .1, .35)), (1, (.18, .02, .2))]
SOLAR2 = [(0, (.05, 0, .2)), (.25, (.8, .1, .35)), (.45, (1, .55, .15)), (.6, (1, .95, .7)), (.78, (.2, .9, .7)), (1, (.02, .3, .4))]


def cmap(a, stops, inv=False):
    g = lum(a)
    return gmap(1 - g if inv else g, stops)


def thr(a, t=.5, noise=.14, seed=1):
    g = lum(a)
    r = np.random.default_rng(seed).random(g.shape, np.float32) * noise - noise / 2
    return rgb((g + r > t).astype(np.float32))


def ghost(a, gain=2.6, dim=.12):
    g = lum(a)
    e = np.abs(g - cv2.GaussianBlur(g, (0, 0), 3))
    return rgb(np.clip(e * gain * 2 + g * dim, 0, 1))


def drift(a, L=60, ang=0.0, n=9, keep=.14):
    """the reel's smear: long exposure along one line, a trace of the sharp picture left inside"""
    s = cv2.resize(a, (W // 2, H // 2), interpolation=cv2.INTER_AREA)
    out = np.zeros_like(s)
    dx, dy = np.cos(ang) * L / 2, np.sin(ang) * L / 2
    for i in range(n):
        f = i / (n - 1) - .5
        M = np.float32([[1, 0, dx * f], [0, 1, dy * f]])
        out += cv2.warpAffine(s, M, (W // 2, H // 2), borderMode=cv2.BORDER_REPLICATE)
    out = cv2.resize(out / n, (W, H), interpolation=cv2.INTER_LINEAR)
    return out * (1 - keep) + a * keep


def radial(a, amt=.1, n=9, keep=.12, cx=.5, cy=.5):
    s = cv2.resize(a, (W // 2, H // 2), interpolation=cv2.INTER_AREA)
    out = np.zeros_like(s)
    c = (W / 2 * cx, H / 2 * cy)
    for i in range(n):
        M = cv2.getRotationMatrix2D(c, 0, 1 + amt * i / (n - 1))
        out += cv2.warpAffine(s, M, (W // 2, H // 2), borderMode=cv2.BORDER_REPLICATE)
    out = cv2.resize(out / n, (W, H), interpolation=cv2.INTER_LINEAR)
    return out * (1 - keep) + a * keep


def zoomed(a, s, cx=.5, cy=.5):
    if abs(s - 1) < 1e-3 and cx == .5 and cy == .5:
        return a
    x, y = cx * W, cy * H
    M = np.float32([[s, 0, W / 2 - s * x], [0, s, H / 2 - s * y]])
    return cv2.warpAffine(a, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)


@functools.lru_cache(maxsize=64)
def read_img(path):
    im = cv2.imread(path, cv2.IMREAD_COLOR)
    if im is None:
        im = np.array(Image.open(path).convert("RGB"))[..., ::-1]
    return im[..., ::-1].astype(np.float32) / 255


def cover(a, fx=.5, fy=.5, zoom=1.0):
    h, w = a.shape[:2]
    s = max(W / w, H / h) * zoom
    r = cv2.resize(a, (int(round(w * s)), int(round(h * s))), interpolation=cv2.INTER_AREA if s < 1 else cv2.INTER_CUBIC)
    x = int((r.shape[1] - W) * fx)
    y = int((r.shape[0] - H) * fy)
    return r[y:y + H, x:x + W]


def contain(a, bg=0.0, zoom=1.0, fx=.5, fy=.5):
    h, w = a.shape[:2]
    s = min(W / w, H / h) * zoom
    r = cv2.resize(a, (int(round(w * s)), int(round(h * s))), interpolation=cv2.INTER_AREA if s < 1 else cv2.INTER_CUBIC)
    out = np.full((H, W, 3), bg, np.float32)
    rh, rw = r.shape[:2]
    if rh > H:
        y = int((rh - H) * fy)
        r = r[y:y + H]
        rh = H
    if rw > W:
        x = int((rw - W) * fx)
        r = r[:, x:x + W]
        rw = W
    y, x = (H - rh) // 2, (W - rw) // 2
    out[y:y + rh, x:x + rw] = r
    return out


def still(name):
    return read_img(sorted(glob.glob(f"{R}/online/img/{name}.*"))[0])


class Seg:
    """a pulled shot. The window may cross a cut in the film, so only the clean run around its middle is used"""
    cache = {}

    def __init__(self, name):
        self.files = sorted(glob.glob(f"{R}/work/seg/{name}/*.jpg"))
        runs = f"{R}/work/seg/{name}/run.json"
        if os.path.exists(runs):
            self.a, self.b = json.load(open(runs))
            return
        small = [cv2.resize(cv2.imread(f, 0), (96, 54)).astype(np.float32) for f in self.files[::1]]
        d = [0] + [float(np.abs(a - b).mean()) for a, b in zip(small, small[1:])]
        mid = len(self.files) // 2
        a, b = mid, mid
        while a > 0 and d[a] < 22:
            a -= 1
        while b < len(self.files) - 1 and d[b + 1] < 22:
            b += 1
        self.a, self.b = a, b
        json.dump([a, b], open(runs, "w"))

    def frame(self, k):
        n = self.b - self.a + 1
        # bounce rather than jump when a hold outlasts the clean run
        p = k % (2 * n - 2) if n > 1 else 0
        p = p if p < n else 2 * n - 2 - p
        return read_img(self.files[self.a + p])

    def __len__(self):
        return self.b - self.a + 1


def seg(name):
    if name not in Seg.cache:
        Seg.cache[name] = Seg(name)
    return Seg.cache[name]


# the voice cut's clock
TL = json.load(open(f"{R}/work/timeline.json")) if os.path.exists(f"{R}/work/timeline.json") else {"lines": []}
PIECES = [p for l in TL["lines"] for p in l["pieces"]]


def src_time(tv):
    for p in PIECES:
        if tv < p["t0"]:
            return p["s0"]
        if tv <= p["t1"]:
            return p["s0"] + tv - p["t0"]
    return PIECES[-1]["s1"]


@functools.lru_cache(maxsize=1)
def _take_last():
    return len(glob.glob(f"{R}/work/take/*.jpg")) - 1


def take_rgb(fi):
    return read_img(f"{R}/work/take/{min(_take_last(), max(0, fi)):05d}.jpg")


@functools.lru_cache(maxsize=32)
def _matte(fi):
    for d in (0, 1, -1, 2, -2, 3, -3, 5, -5, 8, -8, 12, -12, 20, -20, 30, -30):
        f = f"{R}/work/matte/{fi + d}.png"
        if os.path.exists(f):
            return cv2.resize(cv2.imread(f, 0), (W, H), interpolation=cv2.INTER_LINEAR).astype(np.float32) / 255
    return np.ones((H, W), np.float32)


def matte(fi):
    return _matte(fi)


def take_bw(tv, s=1.0, cx=.5, cy=.5, room=.34, fi=None):
    """the person lit, the room pulled down, so the talking shots sit with the reel's blacks"""
    fi = int(src_time(tv) * 30) if fi is None else fi
    a = take_rgb(fi)
    al = matte(fi)
    g = lum(a)
    g = np.clip((g - .03) / .9, 0, 1)
    fg = scurve(g, .8)
    bg = scurve(g, .9) * room
    out = rgb(fg * al + bg * (1 - al))
    return zoomed(out, s, cx, cy)


FACE = (.492, .30)
_grain = None


def grain(a, n, amt=.03):
    global _grain
    if _grain is None:
        rng = np.random.default_rng(7)
        _grain = [cv2.resize(rng.normal(0, 1, (H // 2, W // 2)).astype(np.float32), (W, H), interpolation=cv2.INTER_LINEAR) for _ in range(6)]
    return np.clip(a + (_grain[n % 6] * amt)[..., None], 0, 1)


_vig = None


def vignette(a, amt=.32):
    global _vig
    if _vig is None:
        y, x = np.mgrid[0:H, 0:W].astype(np.float32)
        r = np.sqrt(((x - W / 2) / (W / 2)) ** 2 + ((y - H / 2) / (H / 2)) ** 2)
        _vig = np.clip(r - .35, 0, 1)[..., None]
    return a * (1 - _vig * amt)


FONT_DIRS = ["/System/Library/Fonts/Supplemental", "/System/Library/Fonts", "/Library/Fonts", os.path.expanduser("~/Library/Fonts"), os.path.expanduser("~/.fonts"),
             "/usr/share/fonts/truetype/msttcorefonts", "/usr/share/fonts/truetype/liberation", "/usr/share/fonts/truetype/dejavu", "C:/Windows/Fonts", "/mnt/c/Windows/Fonts"]
FONT_CHOICES = {
    "DIN Condensed Bold.ttf": ["DIN Condensed Bold.ttf", "Impact.ttf", "impact.ttf", "Arial Bold.ttf", "arialbd.ttf", "LiberationSansNarrow-Bold.ttf", "LiberationSans-Bold.ttf", "DejaVuSansCondensed-Bold.ttf", "DejaVuSans-Bold.ttf"],
    "Impact.ttf": ["Impact.ttf", "impact.ttf", "Arial Black.ttf", "ariblk.ttf", "Arial Bold.ttf", "arialbd.ttf", "LiberationSans-Bold.ttf", "DejaVuSans-Bold.ttf"],
    "Menlo.ttc": ["Menlo.ttc", "Courier New.ttf", "cour.ttf", "LiberationMono-Regular.ttf", "DejaVuSansMono.ttf"],
}


def font_path(name):
    """The same look on any computer: the first of these fonts that exists."""
    for n in FONT_CHOICES.get(name, [name]):
        for d in FONT_DIRS:
            if os.path.exists(f"{d}/{n}"):
                return f"{d}/{n}"
    raise FileNotFoundError(f"No font found for {name}. Install Impact or DejaVu Sans.")


def font(size, name="DIN Condensed Bold.ttf"):
    return ImageFont.truetype(font_path(name), size)


def text_frame(lines, size=340, fg=1.0, bg=0.0):
    im = Image.new("L", (W, H), int(bg * 255))
    d = ImageDraw.Draw(im)
    f = font(size)
    tot = sum(d.textbbox((0, 0), t, font=f)[3] for t in lines)
    y = (H - tot) / 2 - size * .08
    for t in lines:
        b = d.textbbox((0, 0), t, font=f)
        d.text(((W - (b[2] - b[0])) / 2 - b[0], y), t, fill=int(fg * 255), font=f)
        y += b[3]
    return rgb(np.array(im, np.float32) / 255)


SCRIPT = ("THIS IS MY RAW FOOTAGE AND THIS IS THE EXACT SAME FOOTAGE EDITED FULLY BY MY AI. I DIDN'T TOUCH THE CLIP. I DIDN'T LOOK AT THE CLIP. "
          "I DON'T EVEN KNOW HOW TO USE PREMIERE PRO. EVERYTHING THAT YOU SEE RIGHT NOW WAS MADE BY THIS SKILL THAT I'VE BUILT AND I CALLED IT EDITOR V2. ")


@functools.lru_cache(maxsize=2)
def text_head(fi=250):
    """the speaker's face made of the speaker's own script"""
    a = take_rgb(fi)
    al = matte(fi)
    g = lum(a)
    im = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(im)
    f = ImageFont.truetype(font_path("Menlo.ttc"), 17)
    line = SCRIPT * 3
    for row, y in enumerate(range(0, H, 19)):
        d.text((-(row * 37) % 400 - 400, y), line, fill=255, font=f)
    t = np.array(im, np.float32) / 255
    bright = np.clip((g - .1) * 1.8, 0, 1)
    face = t * (.35 + bright * 1.4) * al + (cv2.GaussianBlur(g, (0, 0), 2) * .3 * al)
    return rgb(np.clip(face, 0, 1))


@functools.lru_cache(maxsize=2)
def figure_comp(fi=250):
    """the person, black, in a white crowd"""
    crowd = cover(seg("t_mass1").frame(4))
    g = np.clip(lum(crowd) * 1.3, 0, 1)
    g = np.clip(.45 + (1 - g) * .75, 0, 1)
    # smaller than life, so the crowd reads around them
    al = cv2.GaussianBlur(zoomed(matte(fi), .72, .49, .36), (0, 0), 1.2)[..., None]
    return rgb(g) * (1 - al) + .015 * al
