#!/usr/bin/env python3
"""hook.py: the opening montage, on the reel's own frames. The cut points are the reel's (its 60 fps frame numbers, read off the study),
mapped to 25 fps. The pictures are the speaker's: the speaker's skull, the speaker's desk, the speaker's hands, plus archive material, at 16:9."""
import functools
import numpy as np
from lib import *

_rngs = {}


def n25(f60):
    return int(round(f60 * 25 / 60))


@functools.lru_cache(maxsize=64)
def base_still(key):
    x = lambda n: read_img(f"{XR}/{n}.png")
    if key == "city":
        return cover(still("city7"), .5, .75)
    if key == "backs":
        return cover(still("city11"), .5, .9, 1.25)
    if key == "figure":
        return figure_comp()
    if key == "sheep":
        return cover(still("sheep"), .5, .45, 1.1)
    if key == "skullf":
        return cover(x("sharp"))
    if key == "skullf2":
        return cover(x("this"))
    if key == "mezzo":
        return cover(x("no"), .5, .25, 1.3)
    if key == "anat":
        return cover(still("ves2"), .5, .16, 1.0)
    if key == "spine":
        return contain(still("spine0"), 0, 1.45, .5, .1)
    if key == "skulls":
        return contain(still("skull0"), 0, 1.25, .35, .3)
    if key == "side":
        return cover(x("premiere"), .3, .2, 1.25)
    if key == "hand1":
        return contain(1 - still("hand2"), 0, 1.0)
    if key == "hand2":
        return contain(still("hand10"), 0, 1.0)
    if key == "fprint":
        g = lum(contain(still("fp1"), 0, 1.0))
        g8 = (g * 255).astype(np.uint8)
        t = cv2.adaptiveThreshold(cv2.GaussianBlur(g8, (0, 0), 1.0), 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 25, 2)
        y, x0 = np.mgrid[0:H, 0:W].astype(np.float32)
        m = np.clip(1.25 - np.sqrt(((x0 - W / 2) / 390) ** 2 + ((y - H / 2) / 500) ** 2), 0, 1) * 4
        return rgb(np.clip(t / 255 * np.clip(m, 0, 1), 0, 1).astype(np.float32))
    if key == "finger":
        return cover(still("fp0"), .55, .5, 1.25)
    if key == "text":
        return zoomed(text_head(), 1.45, *FACE)
    raise KeyError(key)


SEGS = dict(crowd="t_mass1", brain="b_white", diagram="b_nerve", lungs="l_fluoro2", eye="e_big", man="lookback_face", shatter="p_reels", circle="t_face2", hands="h_hand2",
            run="l_crowd", colorfig="type_wide", crowd2="t_mass1", lone="type_wide", xhand="x_xhand")


def pic(key, k=0):
    if key in SEGS:
        return seg(SEGS[key]).frame(k)
    return base_still(key)


def rang(n):
    return float(np.random.default_rng(n * 13 + 5).uniform(-.5, .5)) + (np.pi / 2 if (n // 3) % 2 else 0)


# the looks. Each takes the picture, the frame inside the shot and the output frame
def L_bw(a, k, n):
    return bw(a)


def L_room(a, k, n):
    return bw(a, .1, .78, .85)


def L_hi(a, k, n):
    return hi(a, .48, 8)


def L_hineg(a, k, n):
    return neg(hi(a, .42, 9))


def L_cold(a, k, n):
    return cmap(bw(a), COLD)


def L_cream(a, k, n):
    return cmap(bw(a, .02, .97), CREAM)


def L_sepia(a, k, n):
    return cmap(bw(a, .05, .9), SEPIA)


def L_blue(a, k, n):
    return cmap(bw(a, .05, .95, .4), BLUE)


def L_bone(a, k, n):
    return cmap(bw(a, .05, .95, .4), ICE)


def L_negg(a, k, n):
    return neg(bw(a, .1, .85, .6))


def L_orange(a, k, n):
    return cmap(neg(bw(a, .1, .85, .6)), ORANGE)


def L_thermal(a, k, n):
    return cmap(bw(a, .05, .8, .4), THERMAL)


def L_gold(a, k, n):
    return cmap(bw(a, .05, .85, .4), GOLD)


def L_rose(a, k, n):
    return cmap(neg(bw(a, .03, .95, .5)), ROSE)


def L_teal(a, k, n):
    return cmap(bw(a, .05, .95, .5), TEAL)


def L_solar(a, k, n):
    return cmap(bw(a, .03, .95, .3), SOLAR)


def L_solar2(a, k, n):
    return cmap(bw(a, .03, .95, .3), SOLAR2)


def L_thr(a, k, n):
    return thr(a, .36, .16, n)


def L_thrn(a, k, n):
    return neg(thr(a, .36, .16, n))


def L_lines(a, k, n):
    return ghost(bw(a), 2.8, .1)


def blur(look, L=70, grow=.55, ang=None):
    def f(a, k, n):
        return look(drift(a, L * (1 + grow * k), rang(n) if ang is None else ang), k, n)
    return f


def rad(look, amt=.12, grow=.5):
    def f(a, k, n):
        return look(radial(a, amt * (1 + grow * k)), k, n)
    return f


def up(look, g=.62):
    """lifts the midtones, so more frames read bright"""
    def f(a, k, n):
        return np.power(np.clip(look(a, k, n), 0, 1), g)
    return f


def seq(*looks):
    """a different look on each frame of the shot"""
    def f(a, k, n):
        return looks[min(k, len(looks) - 1)](a, k, n)
    return f


def flash_in(k, n):
    city = base_still("city")
    if k == 0:
        rng = np.random.default_rng(3)
        g = np.clip(.45 + rng.normal(0, .09, (H // 2, W // 2)).astype(np.float32), 0, 1)
        return rgb(cv2.resize(g, (W, H)))
    if k in (1, 2, 4):
        y, x = np.mgrid[0:H, 0:W].astype(np.float32)
        r = np.sqrt(((x - W * .62) / W) ** 2 + ((y - H / 2) / H) ** 2)
        return rgb(np.clip(1.32 - r * {1: 2.2, 2: 1.0, 4: .2}[k], .35, 1))
    if k in (3, 7):
        return rgb(lum(drift(city, 1100, .02, 12, 0)) * (.42 if k == 3 else .28))
    if k in (5, 6, 8):
        return rgb(np.clip(lum(drift(zoomed(city, 1 + .08 * k, .4, .6), 700 + 150 * k, .03 * k, 12, .04)) * {5: 1.3, 6: 1.75, 8: 1.5}[k], 0, 1))
    return np.zeros((H, W, 3), np.float32)


P1 = [(26, "city", L_hineg), (31, "crowd", up(L_hi, .6)), (36, "backs", L_cold), (40, "figure", L_cold), (45, "sheep", up(L_cream)), (50, "brain", up(L_negg, .8)), (55, "diagram", L_lines), (60, "skullf", L_blue), (64, "anat", L_sepia),
      (69, "mezzo", L_thr), (74, "spine", L_negg), (79, "spine", L_orange), (84, "skulls", L_negg), (88, "skulls", L_bone), (93, "side", L_thermal), (98, "lungs", L_blue), (103, "hand1", L_blue), (108, "hand2", L_bone),
      (112, "eye", L_rose), (117, "man", blur(L_bw, 90, 0)), (122, "fprint", L_bw), (127, "finger", up(L_bw, .7))]
P2 = [(132, "shatter", rad(L_hi, .14)), (144, "circle", up(rad(L_cream, .05), .5)), (151, "hands", blur(L_bw, 60)), (158, "city", up(blur(L_hineg, 80), .7)), (165, "crowd", up(blur(L_cream, 70), .5)), (172, "backs", blur(L_cold, 70)),
      (180, "figure", up(blur(L_cold, 90), .7)), (187, "sheep", up(blur(L_cream, 80), .55)), (194, "brain", up(blur(L_negg, 70), .8))]
P3 = [(201, "diagram", L_lines), (208, "skullf2", blur(L_blue, 50, .3, np.pi / 2)), (216, "anat", up(blur(L_sepia, 60), .7)), (223, "mezzo", blur(L_bw, 70)), (230, "spine", blur(L_negg, 60)), (237, "spine", blur(L_orange, 40)),
      (244, "skulls", blur(L_negg, 45, -.4)), (252, "skulls", L_gold), (259, "side", L_thermal), (266, "lungs", L_gold), (273, "hand1", L_solar), (280, "hand2", L_solar2), (288, "eye", L_rose), (295, "man", blur(L_hi, 80)),
      (302, "fprint", blur(L_bw, 40)), (309, "finger", up(blur(L_bw, 60), .6))]
P4 = [(316, "shatter", seq(rad(L_hi, .14), rad(L_hi, .14), rad(L_hineg, .16), rad(L_hineg, .16), rad(L_hi, .2), rad(L_hi, .2))), (331, "circle", seq(rad(L_cream, .04), L_hineg, rad(L_cream, .1))), (338, "hands", blur(L_bw, 50)),
      (346, "mezzo", seq(L_bw, L_thr, L_thrn, L_thr)), (355, "spine", L_negg), (362, "spine", seq(L_negg, L_orange, L_blue, L_orange)),
      (374, "skulls", seq(L_negg, L_bone, L_negg, L_bone, L_orange, L_bone, L_gold, L_negg)), (393, "side", seq(L_thermal, L_blue, L_thermal, L_blue)), (403, "lungs", seq(L_blue, L_cream, L_blue, L_blue)),
      (412, "eye", seq(L_rose, L_rose, L_teal, L_teal, L_teal, L_rose))]
P5 = [(427, "run", up(L_bw, .7)), (441, "fprint", L_bw), (456, "finger", up(L_hi, .7)), (468, "colorfig", seq(L_solar, L_solar, L_solar, L_solar2, L_solar2, L_solar2, L_solar2, L_solar2, L_solar2)), (489, "crowd2", L_solar),
      (492, "crowd2", up(L_hineg, .8)), (511, "text", L_bw), (530, "text", L_negg), (532, "lone", L_room)]
END = 552
ALL = P1 + P2 + P3 + P4 + P5
TOTAL = n25(555)
_cuts = [n25(x[0]) for x in ALL] + [n25(END)]


def hook_frame(n):
    """n is the output frame, 0 based"""
    if n < n25(26):
        return flash_in(n, n)
    if n >= n25(END):
        return np.zeros((H, W, 3), np.float32)
    i = int(np.searchsorted(_cuts, n, "right")) - 1
    start = _cuts[i]
    _, key, look = ALL[i]
    k = n - start
    a = look(pic(key, n), k, n).astype(np.float32)
    if n >= n25(427):
        return zoomed(a, 1 + .004 * k)
    r = np.random.default_rng(n * 7 + 3).uniform(-1, 1, 2)
    if n25(132) <= n < n25(316):
        return zoomed(a, 1.04 + .05 * min(k, 3), .5 + .022 * r[0], .5 + .022 * r[1])
    return zoomed(a, 1.015 + .03 * min(k, 3), .5 + .006 * r[0], .5 + .006 * r[1])


def pic_look(key, look):
    """the same picture and look, for bursts later in the video"""
    def f(k, n):
        return look(pic(key, n), k, n).astype(np.float32)
    return f
