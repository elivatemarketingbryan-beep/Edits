"""Editor V3 local graphics. Everything drawn per frame at 1920x1080.

The style's screen language at 16:9: LED dot-grid charts, counting numbers, the
Publish button, typed glowing text, film burn, title smear.
"""
import os
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont

W, H, FPS = 1920, 1080, 24
FONT = '/System/Library/Fonts/HelveticaNeue.ttc'
WEIGHT = {'regular': 0, 'bold': 1, 'medium': 10, 'black': 9}
FONT_DIRS = ['/System/Library/Fonts/Supplemental', '/Library/Fonts', os.path.expanduser('~/.fonts'), '/usr/share/fonts/truetype/msttcorefonts',
             '/usr/share/fonts/truetype/liberation', '/usr/share/fonts/truetype/dejavu', 'C:/Windows/Fonts', '/mnt/c/Windows/Fonts']
REGULAR = ['Arial.ttf', 'arial.ttf', 'LiberationSans-Regular.ttf', 'DejaVuSans.ttf']
BOLD = ['Arial Bold.ttf', 'arialbd.ttf', 'LiberationSans-Bold.ttf', 'DejaVuSans-Bold.ttf']
OTHERS = {'regular': REGULAR, 'medium': REGULAR, 'bold': BOLD, 'black': BOLD}
_fonts = {}


def font_file(weight):
    """Helvetica Neue on a Mac, else the closest font the computer has."""
    if os.path.exists(FONT):
        return FONT, WEIGHT[weight]
    for n in OTHERS[weight]:
        for d in FONT_DIRS:
            if os.path.exists(f'{d}/{n}'):
                return f'{d}/{n}', 0
    raise FileNotFoundError('No font found. Install Arial, Liberation Sans or DejaVu Sans.')


def font(size, weight='bold'):
    k = (int(round(size)), weight)
    if k not in _fonts:
        path, index = font_file(weight)
        _fonts[k] = ImageFont.truetype(path, k[0], index=index)
    return _fonts[k]


def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))


def ease_out(x, p=3):
    return 1 - (1 - clamp(x)) ** p


def ease_in(x, p=3):
    return clamp(x) ** p


def text_alpha(txt, size, weight='bold', tracking=-0.045, ss=2):
    """Tight-tracked text as a float alpha array, drawn per glyph. Returns array."""
    f = font(size * ss, weight)
    tr = tracking * size * ss
    x = 0.0
    pos = []
    for i, ch in enumerate(txt):
        pos.append(x)
        nxt = txt[i + 1] if i + 1 < len(txt) else ''
        adv = f.getlength(ch + nxt) - f.getlength(nxt) if nxt else f.getlength(ch)
        x += adv + tr
    asc, desc = f.getmetrics()
    w = int(x + size * ss) + 4
    h = asc + desc + 4
    im = Image.new('L', (w, h), 0)
    d = ImageDraw.Draw(im)
    for ch, px in zip(txt, pos):
        d.text((px + 2, 2), ch, font=f, fill=255)
    a = np.asarray(im, dtype=np.float32) / 255
    ys, xs = np.where(a > 0.01)
    if len(ys) == 0:
        return np.zeros((2, 2), np.float32)
    a = a[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    if ss > 1:
        a = cv2.resize(a, (max(1, a.shape[1] // ss), max(1, a.shape[0] // ss)), interpolation=cv2.INTER_AREA)
    return a


def paste_alpha(canvas, a, cx, cy, value=1.0):
    """Add alpha array a onto single-channel canvas, centred at cx, cy."""
    h, w = a.shape
    x0 = int(round(cx - w / 2))
    y0 = int(round(cy - h / 2))
    sx0, sy0 = max(0, -x0), max(0, -y0)
    ex0, ey0 = max(0, x0), max(0, y0)
    ex1, ey1 = min(canvas.shape[1], x0 + w), min(canvas.shape[0], y0 + h)
    if ex1 <= ex0 or ey1 <= ey0:
        return
    sub = a[sy0:sy0 + (ey1 - ey0), sx0:sx0 + (ex1 - ex0)]
    canvas[ey0:ey1, ex0:ex1] = np.maximum(canvas[ey0:ey1, ex0:ex1], sub * value)


def led_mask(pitch=10.0, duty=0.72, cx=W / 2, cy=H / 2):
    """Screen-door grid. pitch in px, centred so it scales about the frame centre."""
    xs = (np.arange(W) - cx) / pitch
    ys = (np.arange(H) - cy) / pitch
    fx = np.abs((xs % 1) - 0.5) * 2
    fy = np.abs((ys % 1) - 0.5) * 2
    soft = 0.22
    gx = np.clip((duty - (1 - fx)) / soft + 0.5, 0, 1)
    gy = np.clip((duty - (1 - fy)) / soft + 0.5, 0, 1)
    gx = 1 - np.clip(((1 - fx) - duty) / soft + 0.5, 0, 1)
    gy = 1 - np.clip(((1 - fy) - duty) / soft + 0.5, 0, 1)
    return np.outer(gy, gx).astype(np.float32)


def through_led(rgb, pitch=10.0, floor=0.10, bloom=0.5):
    """rgb float 0..1. View the layer through the LED grid with a soft glow."""
    m = led_mask(pitch)[..., None]
    small = cv2.resize(rgb, (W // 4, H // 4), interpolation=cv2.INTER_AREA)
    glow = cv2.resize(cv2.GaussianBlur(small, (0, 0), 7), (W, H), interpolation=cv2.INTER_LINEAR)
    soft = cv2.GaussianBlur(rgb, (0, 0), 0.8)
    out = soft * (floor + (1 - floor) * m) + glow * bloom
    # faint panel grid always visible, as his dark screens are never pure black
    panel = np.array([0.012, 0.014, 0.020], np.float32)
    return np.clip(out + panel * m, 0, 1)


def rounded_rect(a, x0, y0, x1, y1, r):
    im = Image.fromarray((a * 255).astype(np.uint8))
    ImageDraw.Draw(im).rounded_rectangle([x0, y0, x1, y1], radius=r, fill=255)
    return np.asarray(im, dtype=np.float32) / 255


def curve(u, seed):
    """Smooth climbing line for the chart, u in 0..1, result 0..1."""
    r = np.random.RandomState(seed)
    ph = r.uniform(0, 6.28, 3)
    return np.clip(0.34 + 0.46 * u ** 2.4 + 0.075 * np.sin(u * 7.5 + ph[0]) * (1 - u * 0.4)
                   + 0.03 * np.sin(u * 17 + ph[1]) * (1 - u * 0.6), 0, 1)


def chart_frame(t, target, start_value, click_t, count_dur, seed=1, zoom0=1.0, zoom1=1.0,
                zoom_dur=3.0, show_button=True, color=(1.0, 0.03, 0.05), button_in=0.0):
    """One frame of the Publish then chart then count sequence.

    t is seconds since the scene began. click_t is when the button is pressed.
    """
    z = zoom0 + (zoom1 - zoom0) * ease_in(clamp(t / max(zoom_dur, 1e-3)), 2)
    cx, cy = W / 2, H / 2
    color = np.array(color, np.float32)

    def X(v):
        return cx + (v - cx) * z

    def Y(v):
        return cy + (v - cy) * z

    rgb = np.zeros((H, W, 3), np.float32)
    white = np.zeros((H, W), np.float32)

    p = t - click_t  # time since the click
    # Chart plate, in unzoomed layout coordinates
    cl, cr, ct, cb = 640, 1280, 110, 520
    if p > 0:
        # axes draw from the corner over 6 frames
        ax = ease_out(p / 0.28)
        lw = max(1, int(round(2 * z)))
        im = Image.fromarray((white * 255).astype(np.uint8))
        d = ImageDraw.Draw(im)
        d.line([X(cl), Y(cb), X(cl), Y(cb - (cb - ct) * ax)], fill=235, width=lw)
        d.line([X(cl), Y(cb), X(cl + (cr - cl) * ax), Y(cb)], fill=235, width=lw)
        white = np.asarray(im, dtype=np.float32) / 255
        # red area rises from the left after 0.5 s
        grow = ease_out((p - 0.45) / max(count_dur - 0.2, 0.2), 2)
        if grow > 0:
            xs = np.arange(W, dtype=np.float32)
            u = np.clip((xs - X(cl)) / max(X(cr) - X(cl), 1), 0, 1)
            top = Y(cb) - (Y(cb) - Y(ct)) * curve(u, seed) * grow
            yy = np.arange(H, dtype=np.float32)[:, None]
            inside = (yy >= top[None, :]) & (yy <= Y(cb)) & (xs[None, :] >= X(cl)) & (xs[None, :] <= X(cl) + (X(cr) - X(cl)) * clamp(grow * 1.15))
            depth = np.clip((yy - top[None, :]) / max(Y(cb) - Y(ct), 1), 0, 1)
            shade = np.where(inside, 0.62 - 0.50 * depth ** 0.7, 0).astype(np.float32)
            rgb += shade[..., None] * color
            # bright top of the area reads pale, as his does
            hot = np.where(inside, np.clip(1 - depth * 5.0, 0, 1), 0).astype(np.float32)
            rgb += hot[..., None] * np.array([0.55, 0.50, 0.50], np.float32) * 0.62

    # The number
    if p > 0.12:
        c = ease_out((p - 0.12) / count_dur, 4)
        val = int(round(start_value + (target - start_value) * c))
        txt = f'{val:,}'
        a = text_alpha(txt, 150 * z, 'bold', tracking=-0.05)
        fade = clamp((p - 0.12) / 0.2)
        # smear on the digits while they are still running fast
        speed = 1 - clamp((p - 0.12) / count_dur)
        if speed > 0.25:
            k = int(3 + 8 * speed)
            a = cv2.GaussianBlur(a, (1, k | 1), 0)
        paste_alpha(white, a, X(cx), Y(668), fade * 0.80)

    # The button
    if show_button:
        vis = clamp((t - button_in) / 0.25)
        drop = ease_out(p / 0.42, 4) * 150 if p > 0 else 0
        by = 540 + drop if p <= 0.42 else 690 + 0
        by = 540 + drop if p > 0 else 540
        if p > 0.05:
            by = 540 + 305 * ease_out(p / 0.42, 4)
        bw, bh = 118, 40
        btn = np.zeros((H, W), np.float32)
        btn = rounded_rect(btn, X(cx - bw), Y(by - bh), X(cx + bw), Y(by + bh), max(6, 12 * z))
        if p > 0 and p < 0.35:
            btn = cv2.GaussianBlur(btn, (1, 31), 0)
        dim = 0.95 if p <= 0 else 0.62
        rgb += btn[..., None] * color * np.array([0.72, 1, 1], np.float32) * vis * dim
        lab = text_alpha('Publish', 46 * z, 'bold', tracking=-0.03)
        lab_canvas = np.zeros((H, W), np.float32)
        paste_alpha(lab_canvas, lab, X(cx), Y(by), 1.0)
        if p > 0 and p < 0.35:
            lab_canvas = cv2.GaussianBlur(lab_canvas, (1, 31), 0)
        white = np.maximum(white, lab_canvas * 0.74 * vis * (0.95 if p <= 0 else 0.7))

    rgb = rgb + white[..., None]
    return through_led(rgb, pitch=10.0 * z)


def typed_frame(lines, t, cps=11.0, color=(0.05, 0.10, 1.0), size=92, zoom0=1.0, zoom1=1.45,
                dur=3.0, cursor='<', y0=None, line_gap=1.28, fade_in=0.0):
    """Typed glowing text on black, in chapter colour, slowly pushing in."""
    n_total = sum(len(l) for l in lines)
    shown = int(t * cps)
    z = zoom0 + (zoom1 - zoom0) * clamp(t / max(dur, 1e-3)) ** 1.4
    s = size * z
    lh = s * line_gap
    y = (H / 2 - lh * (len(lines) - 1) / 2) if y0 is None else y0
    canvas = np.zeros((H, W), np.float32)
    remaining = shown
    for i, l in enumerate(lines):
        part = l[:max(0, remaining)]
        remaining -= len(l)
        typing = 0 <= (shown - sum(len(x) for x in lines[:i])) < len(l)
        last_line = i == len(lines) - 1
        txt = part + (cursor if (typing or (last_line and remaining >= 0)) and part != '' or (shown == 0 and i == 0) else '')
        if txt:
            a = text_alpha(txt, s, 'bold', tracking=-0.05)
            full = text_alpha(l, s, 'bold', tracking=-0.05)
            # hold each line in place as it types, left aligned to where it ends up
            cx = W / 2 - full.shape[1] / 2 + a.shape[1] / 2
            paste_alpha(canvas, a, cx, y, 1.0)
        y += lh
    color = np.array(color, np.float32)
    rgb = canvas[..., None] * color
    return np.clip(through_led(rgb, pitch=8.0 * z, floor=0.18, bloom=0.95) * 1.05, 0, 1)


def smear_title(txt, size, s=0.0, value=1.0, weight='bold', tracking=-0.05):
    """Return (alpha, scale-adjusted) for the title stretch. s runs 0 to 1.

    His: grows, smears sideways over 6 frames, then one frame of radial pixel smear.
    """
    scale = 1.0 + 0.55 * s ** 2
    a = text_alpha(txt, size * scale, weight, tracking)
    if s > 0.15:
        k = int(1 + 90 * s ** 2) | 1
        blur = cv2.blur(a, (k, 1))
        a = a * (1 - s * 0.7) + blur * (s * 0.7 + 0.25)
    if s > 0.9:
        h, w = a.shape
        h2 = int(h * 4.2)
        pad = np.zeros((h2, w), np.float32)
        y0 = (h2 - h) // 2
        pad[y0:y0 + h] = a
        a = cv2.blur(pad, (9, 91))
        a = a / max(a.max(), 1e-3)
    return np.clip(a, 0, 1) * value


def film_burn(phase, seed=0):
    """phase: 'scratch', 'wash', 'full', 'edge', 'leak'. Returns (rgb_overlay, mix)."""
    r = np.random.RandomState(seed + 7)
    cyan = np.array([0.90, 0.90, 0.71], np.float32)[::-1] * 0 + np.array([0.71, 0.90, 0.90], np.float32)
    xs = np.linspace(0, 1, W, dtype=np.float32)
    if phase == 'scratch':
        lay = np.zeros((H, W), np.float32)
        x = int(W * r.uniform(0.12, 0.26))
        lay[:, x:x + 2] = 0.8
        lay = cv2.GaussianBlur(lay, (3, 1), 0)
        for _ in range(3):
            sx, sy = int(r.uniform(0, W)), int(r.uniform(0, H))
            cv2.circle(lay, (sx, sy), 1, 0.7, -1)
        return lay[..., None] * cyan, None
    band = 0.95 + 0.05 * np.sin(xs * 5 + r.uniform(0, 6))
    grad = np.tile(band, (H, 1))
    v = np.linspace(0, 1, H, dtype=np.float32)[:, None]
    edge = 1 - 0.18 * np.abs(v * 2 - 1) ** 3
    colour = (grad * edge)[..., None] * cyan
    if phase == 'wash':
        return colour, 0.55
    if phase == 'full':
        return np.clip(colour * 1.08 + 0.02, 0, 1), 1.0
    if phase == 'edge':
        m = np.clip(1 - xs * 9, 0, 1) ** 2
        return np.tile(m, (H, 1))[..., None] * cyan * 0.55, None
    if phase == 'leak':
        m = np.clip(1.25 - xs * 1.1, 0, 1)
        col = np.tile(m, (H, 1))[..., None] * np.array([0.42, 0.78, 0.68], np.float32)
        return col, 0.92
    raise ValueError(phase)


def led_picture(rgb8, color=(0.07, 0.10, 1.0), gain=1.25, pitch=8.0, invert=False):
    """A real frame as his blue monochrome LED picture."""
    im = cv2.resize(rgb8, (W, H), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
    lum = im @ np.array([0.3, 0.59, 0.11], np.float32)
    lum = np.clip((lum - 0.05) * gain, 0, 1) ** 1.15
    if invert:
        lum = 1 - lum
    lay = lum[..., None] * np.array(color, np.float32)
    return through_led(lay, pitch=pitch, floor=0.42, bloom=0.30)


def to8(rgb):
    return (np.clip(rgb, 0, 1) * 255 + 0.5).astype(np.uint8)
