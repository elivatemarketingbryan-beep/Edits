#!/usr/bin/env python3
"""endcard.py: the last shot. The empty room, and EDITOR V2 huge and red on the wall behind everything that stands in the room."""
import functools, glob
import numpy as np, cv2
from lib import *
from PIL import Image, ImageDraw, ImageFont
from hook import L_room

RED = np.array([.84, .03, .05], np.float32)


@functools.lru_cache(maxsize=1)
def plate():
    """the room with nobody in it: the last frame, with the right edge taken from before the speaker got up"""
    fs = sorted(glob.glob(f"{R}/work/seg/getup_c/*.jpg"))
    late = np.median(np.stack([read_img(f) for f in fs[-4:]]), 0).astype(np.float32)
    early = read_img(fs[2])
    x = np.clip((np.arange(W, dtype=np.float32) - W * .76) / (W * .05), 0, 1)[None, :, None]
    return late * (1 - x) + early * x


@functools.lru_cache(maxsize=1)
def text_mask():
    # the heaviest type there is, stretched tall, so it fills the wall from side to side
    f = ImageFont.truetype(font_path("Impact.ttf"), 640)
    t = "EDITOR V2"
    im = Image.new("L", (W * 2, H), 0)
    d = ImageDraw.Draw(im)
    b = d.textbbox((0, 0), t, font=f)
    d.text((40 - b[0], 40 - b[1]), t, fill=255, font=f)
    a = np.array(im.crop((40, 40, 40 + b[2] - b[0], 40 + b[3] - b[1])), np.float32) / 255
    tw2, th2 = int(W * .955), int(H * .585)
    a = cv2.resize(a, (tw2, th2), interpolation=cv2.INTER_AREA)
    out = np.zeros((H, W), np.float32)
    x, y = (W - tw2) // 2, int(H * .04)
    out[y:y + th2, x:x + tw2] = a
    return out


@functools.lru_cache(maxsize=1)
def front():
    """what stands in front of the wall. The type stops above the plant, cup and mic, so only the lamp and its stand cross it"""
    g = lum(cmap_room())
    m = np.zeros((H, W), np.float32)
    # the lamp's pole, cable, phone rig and the monitor: dark against the lit wall, inside this box only
    x0, x1, y0, y1 = 488, 668, 330, 700
    m[y0:y1, x0:x1] = np.clip((.34 - g[y0:y1, x0:x1]) / .05, 0, 1)
    pts = dict(lamp=[(516, 332), (522, 306), (545, 278), (575, 260), (640, 244), (672, 250), (688, 275), (684, 305), (664, 330), (625, 352), (575, 366), (535, 362)],
               phone=[(606, 500), (656, 505), (656, 578), (606, 578)], cable=[(570, 362), (582, 362), (586, 470), (574, 470)], monitor=[(528, 512), (622, 512), (622, 700), (528, 700)])
    im = np.zeros((H, W), np.uint8)
    for k_, p in pts.items():
        if k_ != "lamp":
            cv2.fillPoly(im, [np.array(p, np.int32)], 255)
    # the lamp's head is bright with a dark rim, the wall is the grey between: fill the outline those two make
    guide = np.zeros((H, W), np.uint8)
    cv2.fillPoly(guide, [np.array(pts["lamp"], np.int32)], 255)
    guide = cv2.dilate(guide, np.ones((13, 13), np.uint8))
    head = (((g > .74) | (g < .34)) & (guide > 0)).astype(np.uint8)
    head = cv2.morphologyEx(head, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))
    cs, _ = cv2.findContours(head, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    cv2.drawContours(im, [max(cs, key=cv2.contourArea)], -1, 255, -1)
    m = np.maximum(m, im.astype(np.float32) / 255)
    return np.clip(cv2.GaussianBlur(m, (0, 0), 1.0), 0, 1)


@functools.lru_cache(maxsize=1)
def wall_shade():
    """the type takes the room's light: brighter on the window side, deeper on the wood"""
    g = cv2.GaussianBlur(lum(cmap_room()), (0, 0), 30)
    return (.62 + .42 * g)[..., None]


@functools.lru_cache(maxsize=1)
def cmap_room():
    return L_room(plate(), 0, 0).astype(np.float32)


def compose(scene, person=None):
    t = text_mask()
    a = t * (1 - front())
    if person is not None:
        a = a * (1 - person)
    a = a[..., None]
    return scene * (1 - a) + (RED * wall_shade()) * a


def end_hold(k, n):
    return compose(cmap_room())


_files = None


def _f():
    global _files
    if _files is None:
        _files = sorted(glob.glob(f"{R}/work/seg/getup_c/*.jpg"))
    return _files


def _raw_person(i):
    """the speaker's mask for one frame: the matte, plus everything that differs from the empty room"""
    f = read_img(_f()[i])
    p = plate()
    y = cv2.GaussianBlur(f, (0, 0), 1.5)
    q = cv2.GaussianBlur(p, (0, 0), 1.5)
    # the camera's exposure drifts a little: take that out using the left of the room, where nobody goes
    gain = float(np.median(q[200:800, 60:400]) / (np.median(y[200:800, 60:400]) + 1e-4))
    d = np.abs(y * gain - q).max(2)
    diff = np.clip((d - .06) / .05, 0, 1)
    rvm = cv2.imread(f"{R}/work/seg/getup_c/alpha/{i:04d}.png", 0).astype(np.float32) / 255
    # the room's light shifts as they move, so the difference only counts right next to the body the matte found
    near = cv2.dilate((rvm > .3).astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (37, 37))).astype(np.float32)
    a = np.maximum(np.clip((rvm - .2) / .35, 0, 1), diff * near)
    # nobody is ever left of the mic stand once standing: ignore that side, it only holds reflections and light changes
    a[:, :int(W * .40)] = 0
    # solid body: close the small holes, keep only the big shapes
    m = (a > .5).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (21, 21)))
    n, lab, st, _ = cv2.connectedComponentsWithStats(m, connectivity=8)
    keep = np.zeros_like(m)
    for c in range(1, n):
        if st[c, cv2.CC_STAT_AREA] > 6000:
            keep[lab == c] = 1
    # holes inside the body
    inv = 1 - keep
    n2, lab2, st2, _ = cv2.connectedComponentsWithStats(inv, connectivity=4)
    for c in range(1, n2):
        if st2[c, cv2.CC_STAT_AREA] < 9000:
            keep[lab2 == c] = 1
    return keep.astype(np.float32)


@functools.lru_cache(maxsize=8)
def person(i):
    """steady from frame to frame, soft at the edge"""
    last = len(_f()) - 1
    a = np.mean([_raw_person(max(0, min(last, i + d))) for d in (-1, 0, 1)], 0)
    a = np.clip((a - .34) / .32, 0, 1)
    return cv2.GaussianBlur(a, (0, 0), 1.3)


def walk(i, title=True):
    """frame i of the walk-out, the title on the wall behind the speaker"""
    sc = L_room(read_img(_f()[i]), 0, 0).astype(np.float32)
    if not title:
        return sc
    return compose(sc, person(i))


EXIT_DX = (10, 25, 50, 90, 150, 230, 330, 450, 600)


def walk_off(k, start):
    """the clip ends with the speaker still at the edge, so the last steps carry them out of the frame, over the empty room and the title"""
    i = min(start + k, len(_f()) - 1)
    bg = compose(cmap_room())
    fg = L_room(read_img(_f()[i]), 0, 0).astype(np.float32)
    a = person(i)
    d0, d1 = (EXIT_DX[k - 1] if k else 0), EXIT_DX[k]
    pre, al = np.zeros_like(fg), np.zeros_like(a)
    for s in np.linspace(d0, d1, 7):
        M = np.float32([[1, 0, s], [0, 1, 0]])
        al += cv2.warpAffine(a, M, (W, H))
        pre += cv2.warpAffine(fg * a[..., None], M, (W, H))
    al /= 7
    pre /= 7
    return bg * (1 - al[..., None]) + pre


IMPACT = "/System/Library/Fonts/Supplemental/Impact.ttf"


@functools.lru_cache(maxsize=16)
def word_mask(text, y0=.035, y1=.5, maxw=.955, min_squeeze=.5, max_stretch=1.6, part=None):
    """a caption in the title's type, as tall as the wall above the speaker's shoulders"""
    f = ImageFont.truetype(IMPACT, 640)
    im = Image.new("L", (W * 3, H), 0)
    d = ImageDraw.Draw(im)
    b = d.textbbox((0, 0), text, font=f)
    d.text((40 - b[0], 40 - b[1]), text, fill=255, font=f)
    a = np.array(im.crop((40, 40, 40 + b[2] - b[0], 40 + b[3] - b[1])), np.float32) / 255
    th = int(H * (y1 - y0))
    natural = a.shape[1] * th / a.shape[0]
    tw = int(min(W * maxw, max(natural * min_squeeze, min(natural * max_stretch, W * maxw))))
    a = cv2.resize(a, (tw, th), interpolation=cv2.INTER_AREA)
    if part:
        # only the first words of the line, in the place they'll keep when the rest arrives
        a = a.copy()
        a[:, int(tw * d.textlength(part + " ", font=f) / d.textlength(text, font=f)):] = 0
    out = np.zeros((H, W), np.float32)
    x, y = (W - tw) // 2, int(H * y0)
    out[y:y + th, x:x + tw] = a
    return out


def behind(scene, text, person_a=None, shade=.96, part=None):
    """the caption on the wall, the speaker in front of it"""
    a = word_mask(text, part=part)
    if person_a is not None:
        # hard enough that the red never shows through the speaker
        a = a * (1 - np.clip((person_a - .12) / .5, 0, 1))
    a = a[..., None]
    return scene * (1 - a) + (RED * shade) * a
