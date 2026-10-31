"""Editor V3, a worked example: the timeline T at the bottom is one real 70 s video. Copy it and rewrite T for your voice track.
Renders locally at 1920x1080, 24 fps. Usage: edit.py [start end [out.mp4]]   voice-track seconds, for quick partial previews.

Expects, inside this folder: work/gen/clips/<ID>.mp4 the Higgsfield silhouette clips, raw/<name>.mov your B-roll, pictures/ your stills.
"""
import glob, os, sys, subprocess
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.chdir(os.path.dirname(os.path.abspath(__file__)))
import numpy as np, cv2
import gfx, comp, shots
from gfx import W, H, FPS, clamp, ease_in, ease_out, to8

RAW = 'raw'
TOTAL = 69.60
BIG = {'red': (1.0, 0.10, 0.08), 'blue': (0.08, 0.24, 1.0), 'teal': (1.0, 1.0, 1.0)}
HEAD = (W * 0.565, H * 0.40)  # where a date sits: eye level, in the head

_plates = {}


def plate(k):
    if k not in _plates:
        if len(_plates) >= 2:
            _plates.pop(next(iter(_plates)))
        p = comp.Plate(f'work/gen/clips/{k}.mp4')
        ch, a, b = shots.CLIPS[k]
        p.src_a, p.src_dur = a, b - a
        _plates[k] = p
    return _plates[k]


def side_frame(k, s):
    """Frame of generated clip k at side-take time s. Output length is scaled to the source length."""
    p = plate(k)
    u = np.clip((s - p.src_a) / p.src_dur, 0, 1)
    return p.frames[int(round(u * (p.n - 1)))]


_seg = {}


def video_seg(key, path, t0, dur, vf):
    """Decode a short stretch of real footage at 24 fps."""
    if key not in _seg:
        if len(_seg) > 3:
            _seg.pop(next(iter(_seg)))
        r = subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-ss', str(t0), '-t', str(dur + 0.2), '-i', path, '-vf', vf + ',fps=24', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True)
        a = np.frombuffer(r.stdout, np.uint8)
        _seg[key] = a.reshape(-1, H, W, 3)
    return _seg[key]


def broll_grade(rgb, dark=1.0):
    """His B-roll is natural but moody. Pull the bright wall down, keep skin and curtain."""
    x = np.clip(rgb, 0, 1) ** 1.22
    l = x.mean(axis=2, keepdims=True)
    x = np.clip(l + (x - l) * 1.12, 0, 1)
    return x * 0.93 * dark


def caption_shadow(rgb, txt, a, b, v, **k):
    """Caption on bright footage gets a soft dark bed so it stays small and readable."""
    if v < a or v >= b or not txt:
        return rgb
    c = np.zeros((H, W), np.float32)
    al = gfx.text_alpha(txt, k.get('size', 36), 'medium', tracking=-0.035)
    gfx.paste_alpha(c, al, W * 0.5, H * 0.872, 1.0)
    sh = cv2.GaussianBlur(c, (0, 0), 7)[..., None]
    rgb = rgb * (1 - np.clip(sh * 1.5, 0, 0.72))
    return comp.caption(rgb, txt, a, b, v, **k)


def apply_caps(rgb, caps, v, shadow=False):
    for txt, a, b in caps:
        rgb = (caption_shadow if shadow else comp.caption)(rgb, txt, a, b, v)
    return rgb


def date_title(rgb, txt, v, a, b, fade_out=0.5, smear=0.0):
    if v < a or v >= b:
        return rgb
    fade = clamp((v - a) / 0.10) * (clamp((b - v) / fade_out) if fade_out > 0 else 1)
    s = clamp((v - (b - smear)) / smear) if smear > 0 else 0
    grow = 1 + 0.04 * (v - a) / max(b - a, 1e-3)
    al = gfx.smear_title(txt, 66 * grow, s)
    c = np.zeros((H, W), np.float32)
    gfx.paste_alpha(c, al, HEAD[0], HEAD[1], fade)
    return np.clip(rgb * (1 - c[..., None]) + c[..., None], 0, 1)


def S(clip, knots, zoom=1.0, seed=0, big=None, titles=(), caps=(), ch='red', window=None):
    """A talking silhouette shot. knots map voice time to side-take time."""
    vs, ss = zip(*knots)

    def fn(v, i):
        fr = side_frame(clip, float(np.interp(v, vs, ss)))
        z = zoom * (1 + 0.006 * (v - vs[0]))
        dx, dy = comp.drift(v, seed, 5.0)
        rgb = comp.camera(fr.astype(np.float32) / 255, z, dx, dy)
        need = big or window
        if need:
            m = comp.camera(comp.head_matte(fr, th=(70 if ch == 'teal' else 30)), z, dx, dy)
        if big:
            for item in big:
                txt, x, y, size, a, b = item
                if a <= v < b:
                    rgb = comp.behind(rgb, m, [(txt, W * x, H * y, size, 1.0)], color=BIG[ch], glow=0.85 if ch != 'teal' else 0.55)
        if window:
            wa, wb, get = window
            if v >= wa:
                inside = get(v).astype(np.float32) / 255
                u = clamp((v - wa) / (wb - wa))
                yy = np.arange(H, dtype=np.float32)[:, None, None]
                wm = m[..., None] * np.clip((H * 0.74 - yy) / (H * 0.07), 0, 1)
                rgb = rgb * (1 - wm) + (rgb * (1 - u) + inside * u) * wm
        for t in titles:
            rgb = date_title(rgb, *t[:1], v, *t[1:])
        rgb = apply_caps(rgb, caps, v)
        return comp.grain(rgb, i)

    return fn


def B(key, name, t0, dur, vf, dark=1.0, caps=(), a=0.0):
    def fn(v, i):
        fr = video_seg(key, f'{RAW}/{name}.mov', t0, dur, vf)
        j = min(int((v - a) * FPS), len(fr) - 1)
        rgb = broll_grade(fr[j].astype(np.float32) / 255, dark)
        rgb = apply_caps(rgb, caps, v, shadow=True)
        return comp.grain(rgb, i, 0.016)

    return fn


WIDE = f'scale={W}:{H}'
TIGHT = lambda x, y: f'crop=1920:1080:{x}:{y}'


def chart(a, target, start, click, count, seed, z0, z1, zdur, button):
    def fn(v, i):
        return gfx.chart_frame(v - a, target, start, click, count, seed=seed, zoom0=z0, zoom1=z1, zoom_dur=zdur, show_button=button)

    return fn


def typed(a, lines, cps, z0, z1, dur, start=0.0):
    def fn(v, i):
        return gfx.typed_frame(lines, max(0, v - a - start), cps=cps, zoom0=z0, zoom1=z1, dur=dur)

    return fn


# ---- the LED pictures: your own stills from pictures/, shown through the dot grid
PICS = sorted(glob.glob('pictures/*.*'))
PIC_TIMES = list(range(len(PICS)))
_pic = {}


def pic(t):
    if t not in _pic:
        _pic[t] = cv2.cvtColor(cv2.resize(cv2.imread(PICS[t]), (W, H), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2RGB)
    return _pic[t]


def blue_pics(a, caps):
    def fn(v, i):
        k = int((v - a) * FPS)
        n = k // 4
        t = PIC_TIMES[n % len(PIC_TIMES)]
        im = pic(t)
        z = 1.0 + 0.55 * (n % 3 == 1) + 0.25 * (n % 3 == 2)
        im = comp.camera(im.astype(np.float32) / 255, z, ax=W * 0.5, ay=H * 0.5)
        flick = 1.5 if k % 7 == 3 else (0.72 if k % 11 == 5 else 1.0)
        rgb = gfx.led_picture((im * 255).astype(np.uint8), gain=1.25 * flick, invert=(n % 5 == 3))
        return apply_caps(rgb, caps, v)

    return fn


def blue_desk(a):
    """Dark blue desk shot covering the words the side take doesn't have."""
    def fn(v, i):
        fr = video_seg('bluedesk', f'{RAW}/broll_d.mov', 62, 1.8, TIGHT(1500, 620))
        j = min(int((v - a) * FPS), len(fr) - 1)
        x = fr[j].astype(np.float32) / 255
        l = (x @ np.array([0.3, 0.59, 0.11], np.float32)) ** 1.5
        rgb = l[..., None] * np.array([0.05, 0.12, 0.85], np.float32) * 1.05
        return comp.grain(rgb, i, 0.016)

    return fn


# ---- Editor V2 burst, real desk frames in black and white with blur
BURST = [('broll_b', 40.0), ('broll_a', 30.0), ('broll_c', 20.0), ('broll_d', 30.0), ('broll_b', 90.0), ('broll_a', 55.0), ('broll_c', 90.0), ('broll_d', 80.0),
         ('broll_b', 130.0), ('broll_c', 45.0), ('broll_a', 12.0), ('broll_d', 100.0), ('broll_b', 150.0), ('broll_c', 110.0)]
_b = {}


def burst(a):
    def fn(v, i):
        k = min(int((v - a) * 12.5), len(BURST) - 1)
        if k not in _b:
            name, t = BURST[k]
            r = subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-ss', str(t), '-i', f'{RAW}/{name}.mov', '-frames:v', '1', '-vf', f'scale={W}:{H}', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True)
            _b[k] = np.frombuffer(r.stdout, np.uint8).reshape(H, W, 3)
        x = _b[k].astype(np.float32) / 255
        l = np.clip((x @ np.array([0.3, 0.59, 0.11], np.float32) - 0.08) * 1.35, 0, 1)
        if k % 2:
            l = cv2.GaussianBlur(l, (0, 0), 14)  # the same picture coming back blurred, as in V2
        z = 1.0 + 0.5 * (k % 3 == 1) + 0.2 * (k % 3 == 2)
        rgb = comp.camera(np.dstack([l, l, l]), z, ax=W * 0.62, ay=H * 0.5)
        return comp.grain(rgb, i, 0.02)

    return fn


# ---- the film burn, frame for frame from his 22.1 to 23.25 s
def burn(a):
    title = gfx.text_alpha('OCTOBER 30TH 2026', 66, 'bold', tracking=-0.05)

    def fn(v, i):
        k = int(round((v - a) * FPS))
        if k < 3:
            fr = side_frame('R6', 32.7)
            base = fr.astype(np.float32) / 255
            if k == 0:
                return comp.burn_seq(base, 1, 5)
            return comp.burn_seq(base, 2, 5)
        if k < 19:
            return np.zeros((H, W, 3), np.float32)
        if k == 19:
            return comp.burn_seq(np.zeros((H, W, 3), np.float32), 0, 9)
        if k == 20:
            o, _ = gfx.film_burn('edge', 9)
            return o
        if k == 21:
            o, m = gfx.film_burn('leak', 9)
            return o * m
        o, _ = gfx.film_burn('full', 9)
        c = np.zeros((H, W), np.float32)
        gfx.paste_alpha(c, title, HEAD[0], HEAD[1], 0.8)
        return np.clip(o * (1 - c[..., None]) + c[..., None], 0, 1)

    return fn


def black(v, i):
    return np.zeros((H, W, 3), np.float32)


# ---- head push into the first chart, his 1.25 to 1.46 s
def with_push(fn, a, b):
    def out(v, i):
        rgb = fn(v, i)
        if v < a:
            return rgb
        u = clamp((v - a) / (b - a))
        z = 1 + 11 * ease_in(u, 3)
        return comp.camera(rgb, z, ax=W * 0.60, ay=H * 0.47)

    return out


# ---- the ending: the camera pans and the head leaves frame left
_empty = None


def empty_plate():
    """The wall from the last clip with the person filled in, so nothing jumps when he leaves."""
    global _empty
    if _empty is None:
        fr = side_frame('T3', 57.2)
        m = (comp.head_matte(fr, th=70) > 0.02).astype(np.uint8)
        m = cv2.dilate(m, np.ones((151, 151), np.uint8))
        q = 6
        small = cv2.resize(fr, (W // q, H // q), interpolation=cv2.INTER_AREA)
        ms = cv2.resize(m, (W // q, H // q), interpolation=cv2.INTER_NEAREST)
        fill = cv2.inpaint(small, ms, 9, cv2.INPAINT_TELEA)
        fill = cv2.GaussianBlur(fill.astype(np.float32), (0, 0), 22)
        big = cv2.resize(fill, (W, H), interpolation=cv2.INTER_CUBIC) / 255
        # keep the real wall exactly where there's no person
        mb = np.clip(cv2.GaussianBlur(cv2.dilate(comp.head_matte(fr, th=70), np.ones((151, 151), np.uint8)), (0, 0), 48) * 1.35, 0, 1)[..., None]
        _empty = fr.astype(np.float32) / 255 * (1 - mb) + big * mb
    return _empty


def pan_off(fnS, side_s, a, b):
    def fn(v, i):
        fr = side_frame('T3', side_s)
        sub = fr.astype(np.float32) / 255
        m = comp.head_matte(fr, th=70)
        u = clamp((v - a) / (b - a))
        dx = -1500 * ease_in(u, 2.2)
        speed = 1500 * 2.2 * u ** 1.2 / ((b - a) * FPS)
        M = np.float32([[1, 0, dx], [0, 1, 0]])
        s2 = cv2.warpAffine(sub, M, (W, H), borderMode=cv2.BORDER_REPLICATE)
        m2 = cv2.warpAffine(m, M, (W, H))
        k = int(max(1, speed)) | 1
        if k > 1:
            s2 = cv2.blur(s2, (k, 1))
            m2 = cv2.blur(m2, (k, 1))
        bg = empty_plate()
        return comp.grain(bg * (1 - m2[..., None]) + s2 * m2[..., None], i)

    return fn


def empty_hold(v, i):
    return comp.grain(comp.camera(empty_plate(), 1.0 + 0.002 * (v - 66.8), *comp.drift(v, 8, 2.0)), i)


# ---- window into the desk footage inside the head, his 36.62 to 37.29 s
def desk_window(v):
    fr = video_seg('d_win', f'{RAW}/broll_d.mov', 56.8, 1.0, WIDE)
    j = min(int((v - 13.62) * FPS), len(fr) - 1)
    return (broll_grade(fr[j].astype(np.float32) / 255) * 255).astype(np.uint8)


def typed_x(t, full='EDITOR V3', cx=0.165, size=100):
    """Centre for a part-typed word, so it types out from a fixed left edge."""
    wf = gfx.text_alpha(full, size, 'bold', tracking=-0.045).shape[1]
    w = gfx.text_alpha(t, size, 'bold', tracking=-0.045).shape[1]
    return (W * cx - wf / 2 + w / 2) / W


T = [
    # RED
    (0.00, 4.40, with_push(S('R1', [(0, 0.09), (2.30, 2.41), (3.11, 3.17), (4.78, 4.56)], seed=1, ch='red',
                             titles=[('OCTOBER 18TH 2026', 0.14, 2.34, 0.0, 0.26)],
                             caps=[('I show you how', 2.36, 3.08), ('Claude edits my videos', 3.08, 4.30)]), 4.16, 4.40)),
    (4.40, 7.05, chart(4.40, 20000, 18540, 0.45, 1.85, 1, 1.25, 1.27, 2.6, True)),
    (7.05, 7.95, S('R2', [(7.05, 7.18), (7.14, 7.28), (7.78, 8.20), (7.95, 8.30)], seed=2, ch='red', caps=[('Not bad.', 7.12, 7.93)])),
    (7.95, 8.60, B('b1', 'broll_a', 50.0, 0.7, WIDE, caps=[('So I try it again.', 8.08, 9.40)], a=7.95)),
    (8.60, 9.45, B('b2', 'broll_a', 52.0, 0.9, TIGHT(620, 1060), caps=[('So I try it again.', 8.08, 9.40)], a=8.60)),
    (9.45, 14.30, S('R3', [(9.45, 9.67), (9.57, 9.79), (10.44, 11.20), (10.47, 11.38), (11.92, 12.42), (12.38, 12.56), (14.06, 14.02), (14.30, 14.26)], seed=3, ch='red',
                    titles=[('OCTOBER 21ST 2026', 9.55, 10.95, 0.5)], big=[('EDITOR V1', 0.195, 0.335, 118, 10.50, 14.3)],
                    caps=[('Editor V1.', 10.47, 11.98), ('Claude edits the whole video', 12.36, 14.10)],
                    window=(13.62, 14.30, desk_window))),
    (14.30, 16.15, B('b3', 'broll_d', 57.5, 1.9, WIDE, caps=[("and I don't touch", 14.36, 15.08), ('a single frame of it.', 15.08, 16.10)], a=14.30)),
    (16.15, 18.30, chart(16.15, 70000, 65000, 0.04, 1.65, 2, 1.38, 1.52, 2.15, False)),
    (18.30, 20.85, S('R4', [(18.30, 18.31), (18.45, 18.46), (18.75, 18.99), (19.15, 19.22), (20.78, 20.87), (20.85, 20.94)], zoom=1.35, seed=4, ch='red',
                     caps=[('Hey,', 18.42, 18.90), ('people actually want this.', 19.12, 20.82)])),
    (20.85, 21.50, B('b4', 'broll_c', 100.0, 0.7, TIGHT(1400, 660), dark=0.58, caps=[('So I try it again.', 20.92, 22.20)], a=20.85)),
    (21.50, 22.25, B('b5', 'broll_c', 40.0, 0.8, TIGHT(560, 1050), dark=0.58, caps=[('So I try it again.', 20.92, 22.20)], a=21.50)),
    (22.25, 27.95, S('R5', [(22.25, 22.26), (22.36, 22.37), (23.65, 23.69), (23.90, 24.01), (26.33, 26.97), (26.56, 27.17), (27.87, 28.42), (27.95, 28.55)], seed=5, ch='red',
                     titles=[('OCTOBER 25TH 2026', 22.36, 23.85, 0.5)], big=[('$0', 0.20, 0.30, 300, 26.94, 27.95)],
                     caps=[('this time a free AI model', 23.88, 25.42), ('edits it', 25.42, 26.40), ('with zero dollars.', 26.52, 27.90)])),
    (27.95, 31.10, chart(27.95, 132000, 122000, 0.05, 2.65, 3, 1.5, 2.45, 3.15, False)),
    (31.10, 32.75, S('R6', [(31.10, 31.14), (31.28, 31.32), (31.54, 31.71), (32.04, 31.94), (32.72, 32.70), (32.81, 32.78)], seed=6, ch='red',
                     caps=[('Wait,', 31.25, 31.98), ("what's happening?", 31.98, 32.74)])),
    (32.75, 34.01, burn(32.75)),
    # BLUE
    (34.01, 37.60, S('B1', [(34.01, 32.92), (34.09, 32.96), (35.16, 34.00), (35.55, 34.22), (37.40, 35.82), (37.60, 35.98)], seed=7, ch='blue',
                     titles=[('OCTOBER 30TH 2026', 34.01, 35.35, 0.5)], big=[('EVEN BETTER', 0.215, 0.32, 112, 36.42, 37.60)],
                     caps=[('I tried to make it', 35.50, 36.42), ('even better.', 36.42, 37.46)])),
    (37.60, 40.45, typed(37.60, ['SPENT 1,000 CREDITS', 'ON HIGGSFIELD.'], 13.5, 1.0, 1.24, 2.85, start=0.20)),
    (40.45, 42.00, blue_pics(40.45, [('It looks like garbage.', 40.58, 41.97)])),
    (42.00, 43.90, S('B2', [(42.00, 39.72), (42.14, 39.82), (43.74, 41.57), (43.90, 41.68)], zoom=1.35, seed=8, ch='blue', caps=[('Genuinely really bad.', 42.10, 43.84)])),
    (43.90, 44.72, S('B3', [(43.90, 41.72), (44.11, 41.77), (44.72, 42.61)], seed=9, ch='blue')),
    (44.72, 46.30, B('b6', 'broll_d', 62, 1.8, WIDE, a=44.72)),
    (46.30, 48.85, S('B3', [(46.30, 42.66), (46.46, 42.77), (48.65, 44.78), (48.85, 44.84)], zoom=1.12, seed=10, ch='blue')),
    (48.85, 51.04, typed(48.85, ['OR WERE THOSE VIEWS', 'JUST LUCKY?'], 15.5, 1.08, 1.8, 2.19, start=0.16)),
    (51.04, 53.24, black),
    # TEAL
    (53.24, 56.30, S('T1', [(53.24, 44.87), (53.32, 44.94), (53.65, 45.43), (54.12, 45.58), (56.13, 47.15), (56.30, 47.30)], seed=11, ch='teal',
                     caps=[('No.', 53.30, 53.96), ('I just kept working on it.', 54.08, 56.22)])),
    (56.30, 57.85, S('T2', [(56.30, 47.42), (56.45, 47.51), (57.85, 48.45)], seed=12, ch='teal', titles=[('OCTOBER 31ST 2026', 56.45, 57.85, 0.3)])),
    (57.85, 58.98, burst(57.85)),
    (58.98, 60.40, S('T2', [(58.98, 49.50), (60.29, 50.60), (60.40, 50.68)], seed=13, ch='teal', caps=[('and October 31st,', 58.99, 60.26)])),
    (60.40, 62.85, S('T2', [(60.40, 50.56), (60.46, 50.63), (61.46, 51.84), (61.73, 52.09), (62.74, 53.21), (62.85, 53.28)], zoom=1.14, seed=14, ch='teal',
                     big=[(t, typed_x(t), 0.31, 100, a, b) for t, a, b in [('E|', 60.48, 60.54), ('ED|', 60.54, 60.60), ('EDI|', 60.60, 60.66), ('EDIT|', 60.66, 60.72), ('EDITO|', 60.72, 60.80), ('EDITOR|', 60.80, 60.88), ('EDITOR V|', 60.88, 60.98), ('EDITOR V3|', 60.98, 61.2), ('EDITOR V3', 61.2, 62.85)]],
                     caps=[('in the same video.', 61.68, 62.80)])),
    (62.85, 66.25, S('T3', [(62.85, 54.48), (63.03, 54.65), (64.05, 55.45), (64.09, 55.47), (66.20, 57.22), (66.25, 57.25)], seed=15, ch='teal',
                     caps=[('And like other of my videos,', 63.00, 64.06), ('this one is also free.', 64.06, 66.18)])),
    (66.25, 66.80, pan_off(None, 57.2, 66.25, 66.80)),
    (66.80, TOTAL, empty_hold),
]


def render(start, end, out):
    p = subprocess.Popen(['ffmpeg', '-nostdin', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                          '-c:v', 'libx264', '-crf', '14', '-preset', 'medium', '-pix_fmt', 'yuv420p', out], stdin=subprocess.PIPE)
    f0, f1 = int(start * FPS), int(end * FPS)
    for i in range(f0, f1):
        v = i / FPS
        for a, b, fn in T:
            if a <= v < b:
                rgb = fn(v, i)
                break
        else:
            rgb = np.zeros((H, W, 3), np.float32)
        p.stdin.write(to8(rgb).tobytes())
        if (i - f0) % 48 == 0:
            print(f'{v:.1f}s', flush=True)
    p.stdin.close()
    p.wait()


if __name__ == '__main__':
    os.makedirs('work/out', exist_ok=True)
    a = float(sys.argv[1]) if len(sys.argv) > 1 else 0.0
    b = float(sys.argv[2]) if len(sys.argv) > 2 else TOTAL
    out = sys.argv[3] if len(sys.argv) > 3 else 'work/out/picture.mp4'
    render(a, b, out)
    print('done', out)
