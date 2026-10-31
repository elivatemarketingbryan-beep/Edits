#!/usr/bin/env python3
"""demo.py [outdir]: proves the install with no recording. Renders the hook's real timing with pictures drawn in code, its sound, and the end title.
The pictures are placeholders for this test only. In a real video they are your own face, desk and hands, plus free archive material.
"""
import os, re, subprocess, sys
SK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser('~/editor-v2/_demo')
os.makedirs(OUT, exist_ok=True)
os.environ['EDITOR_PROJECT'] = OUT
sys.path.insert(0, f'{SK}/examples/raw-footage')
from lib import *  # the real looks
from PIL import Image, ImageDraw

rng = np.random.default_rng(7)


def canvas():
    return np.zeros((H, W), np.uint8)


def crowd():
    c = canvas()
    for _ in range(420):
        x, y = int(rng.integers(0, W)), int(rng.integers(300, H))
        s = 12 + (y - 300) // 22
        cv2.circle(c, (x, y), s, 200, -1)
        cv2.ellipse(c, (x, y + s * 3), (int(s * 1.5), s * 2), 0, 0, 360, 170, -1)
    return c


def barcode():
    c = canvas()
    x = 240
    while x < W - 240:
        w = int(rng.integers(4, 26))
        cv2.rectangle(c, (x, 180), (x + w, H - 180), 240, -1)
        x += w + int(rng.integers(6, 24))
    return c


def one_black():
    c = np.full((H, W), 225, np.uint8)
    for k in range(9):
        x = 160 + k * 200
        v = 12 if k == 4 else 250
        cv2.circle(c, (x, 400), 54, v, -1)
        cv2.ellipse(c, (x, 640), (80, 180), 0, 0, 360, v, -1)
    return c


def skull():
    c = canvas()
    cv2.ellipse(c, (W // 2, 430), (270, 320), 0, 0, 360, 225, -1)
    cv2.rectangle(c, (W // 2 - 130, 690), (W // 2 + 130, 880), 205, -1)
    for dx in (-115, 115):
        cv2.ellipse(c, (W // 2 + dx, 470), (82, 72), 0, 0, 360, 10, -1)
    cv2.fillPoly(c, [np.int32([(W // 2, 540), (W // 2 - 45, 650), (W // 2 + 45, 650)])], 10)
    for k in range(-5, 6):
        cv2.line(c, (W // 2 + k * 24, 700), (W // 2 + k * 24, 860), 30, 5)
    return c


def spine():
    c = canvas()
    for k in range(11):
        y = 70 + k * 88
        x = W // 2 + int(60 * np.sin(k / 2))
        cv2.ellipse(c, (x, y), (130 + k * 6, 34), 0, 0, 360, 235, -1)
        cv2.line(c, (x - 240, y), (x + 240, y), 150, 12)
    return c


def fingerprint():
    c = canvas()
    for r in range(30, 460, 22):
        cv2.ellipse(c, (W // 2 + int(r * 0.05), H // 2 + 40), (int(r * 0.72), r), 8, 200, 520, 245, 7)
    return c


def hand():
    c = canvas()
    cv2.ellipse(c, (W // 2, 760), (190, 240), 0, 0, 360, 225, -1)
    for k, a in enumerate((-48, -20, -3, 14, 34)):
        t = np.deg2rad(a)
        e = (int(W // 2 + np.sin(t) * 560), int(790 - np.cos(t) * (640 if k else 420)))
        cv2.line(c, (W // 2, 760), e, 225, 68)
    return c


def eye():
    c = canvas()
    cv2.ellipse(c, (W // 2, H // 2), (620, 300), 0, 0, 360, 225, -1)
    cv2.circle(c, (W // 2, H // 2), 240, 110, -1)
    cv2.circle(c, (W // 2, H // 2), 110, 5, -1)
    return c


def runner():
    c = np.full((H, W), 235, np.uint8)
    for k in range(70):
        x, y = int(rng.integers(0, W // 2)), int(rng.integers(640, 900))
        cv2.circle(c, (x, y), 18, 40, -1)
        cv2.line(c, (x, y), (x, y + 70), 40, 22)
    x, y = 1480, 560
    cv2.circle(c, (x, y), 44, 0, -1)
    for a, b in [((x, y), (x - 60, y + 210)), ((x - 60, y + 210), (x + 80, y + 330)), ((x - 60, y + 210), (x - 210, y + 310)), ((x - 10, y + 70), (x + 130, y + 40)), ((x - 10, y + 70), (x - 140, y + 110))]:
        cv2.line(c, a, b, 0, 40)
    return c


def city():
    c = np.full((H, W), 200, np.uint8)
    x = 0
    while x < W:
        w, h_ = int(rng.integers(70, 190)), int(rng.integers(250, 880))
        cv2.rectangle(c, (x, H - h_), (x + w, H), int(rng.integers(5, 70)), -1)
        x += w + 6
    return c


def rings():
    c = canvas()
    for r in range(40, 800, 46):
        cv2.circle(c, (W // 2, H // 2), r, 235, 16)
    return c


def picture(fn):
    g = cv2.GaussianBlur(fn(), (0, 0), 1.2).astype(np.float32) / 255
    return np.dstack([g, g, g])


PICS = [picture(f) for f in (crowd, barcode, one_black, skull, spine, fingerprint, hand, eye, runner, city, rings)]
SECTIONS = [(0.43, 2.20, 2, 'sharp'), (2.20, 3.35, 3, 'drift'), (3.35, 4.55, 3, 'smear'), (4.55, 6.87, 3, 'colour')]
LAND = [6, 6, 6, 8, 8, 9, 9, 9]


def treat(a, kind, n, f):
    if kind == 'sharp':
        return bw(a)
    if kind == 'drift':
        return drift(bw(a), L=70, ang=0.15 * n)
    if kind == 'smear':
        return cmap(radial(a, amt=.09), BLUE if n % 2 else ICE)
    s = cmap(a, SOLAR if n % 2 else SOLAR2)
    return neg(s) if f % 2 and n % 3 == 0 else s


plan = {}
for a, b, hold, kind in SECTIONS:
    f, n = int(a * FPS), 0
    while f < int(b * FPS):
        for k in range(hold):
            plan[f + k] = (n, kind, k)
        f += hold
        n += 1
f = int(6.87 * FPS)
for n, hold in enumerate(LAND):
    for k in range(hold):
        plan[f + k] = (n, 'land', k)
    f += hold
LAND_END = f
HOOK = int(9.25 * FPS)
TITLE_END = HOOK + int(2.5 * FPS)


def title():
    c = Image.new('L', (W, H), 0)
    d = ImageDraw.Draw(c)
    f_ = ImageFont.truetype(font_path('Impact.ttf'), 360)
    b = d.textbbox((0, 0), 'EDITOR V2', font=f_)
    d.text(((W - b[2] + b[0]) / 2 - b[0], 170 - b[1]), 'EDITOR V2', fill=255, font=f_)
    m = np.asarray(c, np.float32) / 255
    y = np.linspace(.55, .32, H, dtype=np.float32)[:, None, None]
    room = np.tile(y, (1, W, 3))
    red = np.array([.86, .04, .05], np.float32)
    rgb = room * (1 - m[..., None]) + red * m[..., None]
    p = canvas()
    cv2.circle(p, (W // 2, 420), 150, 255, -1)
    cv2.ellipse(p, (W // 2, 1000), (360, 420), 0, 0, 360, 255, -1)
    p = cv2.GaussianBlur(p, (0, 0), 3).astype(np.float32)[..., None] / 255
    return rgb * (1 - p) + np.array([.07, .07, .07], np.float32) * p


TITLE = title()
pic = f'{OUT}/_picture.mp4'
p = subprocess.Popen(['ffmpeg', '-nostdin', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                      '-c:v', 'libx264', '-crf', '20', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', pic], stdin=subprocess.PIPE)
sheet = []
for i in range(TITLE_END):
    if i < int(0.43 * FPS):
        fl = [lambda: np.random.default_rng(i).random((H, W, 3), np.float32), lambda: np.ones((H, W, 3), np.float32), lambda: drift(PICS[0], L=300), lambda: np.ones((H, W, 3), np.float32), lambda: np.random.default_rng(i).random((H, W, 3), np.float32) * .5]
        rgb = fl[i % 5]() if i < int(0.43 * FPS) - 2 else np.zeros((H, W, 3), np.float32)
    elif i in plan:
        n, kind, k = plan[i]
        base = PICS[n % len(PICS)]
        if kind == 'land':
            rgb = zoomed(bw(base), 1 + 0.004 * k)
        else:
            rgb = treat(zoomed(base, 1 + 0.006 * (i % 4)), kind, n, i)
    elif i < HOOK:
        rgb = np.zeros((H, W, 3), np.float32)
    else:
        rgb = TITLE
    rgb = grain(np.clip(rgb, 0, 1), i, .02)
    out = (np.clip(rgb, 0, 1) * 255 + .5).astype(np.uint8)
    p.stdin.write(out.tobytes())
    if i % 24 == 12:
        sheet.append(cv2.resize(out, (480, 270), interpolation=cv2.INTER_AREA))
p.stdin.close()
p.wait()
rows = [np.hstack(sheet[k:k + 4]) for k in range(0, len(sheet) - len(sheet) % 4, 4)]
cv2.imwrite(f'{OUT}/sheet.jpg', cv2.cvtColor(np.vstack(rows), cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 88])

# ---- sound: the hook bed, then the song's drop on the title
SR = 48000
TOTAL = TITLE_END / FPS
N = int(TOTAL * SR)


def load(path, ss=None, to=None):
    cmd = ['ffmpeg', '-nostdin', '-v', 'error'] + (['-ss', str(ss)] if ss is not None else []) + (['-to', str(to)] if to is not None else []) + ['-i', path, '-ar', str(SR), '-ac', '2', '-f', 's16le', '-']
    return (np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, np.int16).astype(np.float32) / 32768).reshape(-1, 2)


mix = np.zeros((N, 2), np.float32)
bed = load(f'{SK}/sfx/hook_bed.wav')
mix[:min(N, len(bed))] += bed[:N] * 0.8
song = load(f'{SK}/music/song.m4a', ss=43.5, to=43.5 + TOTAL - 9.25)
at = int(9.25 * SR)
k = min(N - at, len(song))
s = song[:k].copy() * 0.45
s[-int(.6 * SR):] *= np.linspace(1, 0, int(.6 * SR))[:, None]
mix[at:at + k] += s
b = load(f'{SK}/sfx/boom_short.wav')
mix[at:at + len(b)] += b[:N - at] * .7
raw = f'{OUT}/_mix.wav'
subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-y', '-f', 's16le', '-ar', str(SR), '-ac', '2', '-i', '-', '-af', 'alimiter=limit=0.89:level=disabled', raw],
               input=(np.clip(mix, -1, 1) * 32767).astype(np.int16).tobytes(), check=True)
final = f'{OUT}/demo.mp4'
subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-y', '-i', pic, '-i', raw, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-shortest', '-movflags', '+faststart', final], check=True)
os.remove(pic)
os.remove(raw)

info = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'stream=codec_type,width,height:format=duration', '-of', 'compact', final], capture_output=True, text=True).stdout
e = subprocess.run(['ffmpeg', '-nostdin', '-hide_banner', '-i', final, '-af', 'ebur128=framelog=quiet', '-f', 'null', '-'], capture_output=True, text=True).stderr
lufs = float(re.findall(r'I:\s+(-?[0-9.]+) LUFS', e)[-1])
good = 'codec_type=video' in info and 'codec_type=audio' in info and 'width=1920' in info and -30 < lufs < -6
print(info.strip().replace('\n', ' | '))
print(f'loudness {lufs:.1f} LUFS')
print(('DEMO OK ' if good else 'DEMO FAILED ') + final)
sys.exit(0 if good else 1)
