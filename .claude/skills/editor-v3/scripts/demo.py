#!/usr/bin/env python3
"""demo.py [outdir]: proves the install with no recording and no credits. Renders 16 s of the style with its sound.
The head is a placeholder drawn in code, only for this test. In a real video it comes from Higgsfield, made from your own recording.
"""
import os, re, subprocess, sys
SK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, f'{SK}/template')
import numpy as np, cv2
import gfx, comp
from gfx import W, H, FPS, clamp, ease_in, to8

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser('~/editor-v3/_demo')
os.makedirs(OUT, exist_ok=True)
TOTAL = 16.0
LOOK = {'red': ((0x8c, 0, 0), (0x4a, 0, 0), (6, 11, 14)), 'blue': ((0, 1, 0x74), (0, 0, 0x45), (8, 10, 12)), 'teal': ((0xc2, 0xcd, 0xc5), (0x61, 0x88, 0x8a), (9, 11, 15))}
BIG = {'red': (1.0, 0.10, 0.08), 'blue': (0.08, 0.24, 1.0), 'teal': (1.0, 1.0, 1.0)}
_walls = {}


def wall(ch):
    if ch not in _walls:
        top, bot, _ = LOOK[ch]
        y, x = np.mgrid[0:H, 0:W].astype(np.float32)
        u = (y / H)[..., None] ** 1.5
        g = (np.array(top, np.float32) * (1 - u) + np.array(bot, np.float32) * u) / 255
        r = np.sqrt(((x - W * 0.6) / W) ** 2 + ((y - H * 0.42) / H) ** 2)[..., None]
        _walls[ch] = g * np.clip(1.22 - r * 1.0, 0.3, 1.2)
    return _walls[ch]


def head(v):
    """A side profile facing left, jaw moving as if it talks."""
    j = 0.018 * max(0.0, np.sin(v * 13.0) * np.sin(v * 3.1))
    pts = [(0.60, 0.11), (0.525, 0.14), (0.482, 0.24), (0.478, 0.30), (0.468, 0.33), (0.432, 0.42), (0.462, 0.445), (0.452, 0.475), (0.465, 0.49 + j / 2), (0.455, 0.515 + j),
           (0.468, 0.565 + j), (0.525, 0.60 + j / 2), (0.55, 0.68), (0.525, 0.78), (0.47, 1.01), (1.01, 1.01), (0.88, 0.80), (0.71, 0.67), (0.735, 0.42), (0.71, 0.21), (0.66, 0.12)]
    m = np.zeros((H, W), np.uint8)
    cv2.fillPoly(m, [np.int32([(x * W, y * H) for x, y in pts])], 255)
    m = cv2.GaussianBlur(m, (0, 0), 9).astype(np.float32) / 255
    return np.clip((m - 0.42) / 0.16, 0, 1)


def plate(ch, v):
    m = head(v)[..., None]
    sub = np.array(LOOK[ch][2], np.float32) / 255
    return wall(ch) * (1 - m) + sub * m, m[..., 0]


def talk(ch, v, i, a, zoom=1.0, big=None, title=None, caps=()):
    rgb, m = plate(ch, v)
    dx, dy = comp.drift(v, 3, 5.0)
    z = zoom * (1 + 0.006 * (v - a))
    rgb = comp.camera(rgb, z, dx, dy)
    m = comp.camera(m, z, dx, dy)
    if big and big[4] <= v:
        rgb = comp.behind(rgb, m, [(big[0], W * big[1], H * big[2], big[3], 1.0)], color=BIG[ch], glow=0.85 if ch != 'teal' else 0.55)
    if title:
        rgb = comp.title(rgb, title[0], v, title[1], title[2], smear=0.26, cx=W * 0.585, cy=H * 0.34)
    for txt, ca, cb in caps:
        rgb = comp.caption(rgb, txt, ca, cb, v)
    return comp.grain(rgb, i)


def frame(v, i):
    if v < 2.4:
        rgb = talk('red', v, i, 0, title=('OCTOBER 31ST 2026', 0.14, 2.14), caps=[('This is a placeholder head.', 0.6, 2.1)])
        if v >= 2.16:
            rgb = comp.camera(rgb, 1 + 11 * ease_in((v - 2.16) / 0.24, 3), ax=W * 0.60, ay=H * 0.47)
        return rgb
    if v < 5.4:
        return gfx.chart_frame(v - 2.4, 20000, 18540, 0.45, 1.85, seed=1, zoom0=1.25, zoom1=1.27, zoom_dur=3.0, show_button=True)
    if v < 7.6:
        return talk('red', v, i, 5.4, zoom=1.2, big=('IT WORKS', 0.20, 0.30, 118, 5.56), caps=[('Sound and type are ready.', 5.6, 7.5)])
    if v < 8.85:
        k = int(round((v - 7.6) * FPS))
        if k < 3:
            return comp.burn_seq(np.clip(plate('red', v)[0], 0, 1), k + 1 if k < 2 else 2, 5)
        if k < 19:
            return np.zeros((H, W, 3), np.float32)
        if k == 19:
            return comp.burn_seq(np.zeros((H, W, 3), np.float32), 0, 9)
        if k == 20:
            return gfx.film_burn('edge', 9)[0]
        if k == 21:
            o, m = gfx.film_burn('leak', 9)
            return o * m
        return gfx.film_burn('full', 9)[0]
    if v < 11.0:
        return talk('blue', v, i, 8.85, big=('EVEN BETTER', 0.215, 0.32, 112, 9.3), title=('NOVEMBER 1ST 2026', 8.95, 9.9), caps=[('Backdrop colour is the chapter.', 9.5, 10.9)])
    if v < 13.0:
        return gfx.typed_frame(['NOTHING GENERATED.', 'NO CREDITS USED.'], max(0, v - 11.15), cps=15, zoom0=1.0, zoom1=1.3, dur=2.0)
    if v < 14.8:
        return talk('teal', v, i, 13.0, caps=[('Your real silhouette comes from Higgsfield.', 13.1, 14.7)])
    u = clamp((v - 14.8) / 0.55)
    if u < 1:
        rgb, m = plate('teal', v)
        M = np.float32([[1, 0, -1500 * ease_in(u, 2.2)], [0, 1, 0]])
        m2 = cv2.warpAffine(m, M, (W, H))[..., None]
        return comp.grain(wall('teal') * (1 - m2) + np.array(LOOK['teal'][2], np.float32) / 255 * m2, i)
    return comp.grain(wall('teal'), i)


# ---- picture
pic = f'{OUT}/_picture.mp4'
p = subprocess.Popen(['ffmpeg', '-nostdin', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                      '-c:v', 'libx264', '-crf', '20', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', pic], stdin=subprocess.PIPE)
sheet = []
for i in range(int(TOTAL * FPS)):
    v = i / FPS
    rgb = np.clip(frame(v, i), 0, 1)
    out = to8(rgb)
    p.stdin.write(out.tobytes())
    if i % 48 == 12:
        sheet.append(cv2.resize(out, (480, 270), interpolation=cv2.INTER_AREA))
p.stdin.close()
p.wait()
rows = [np.hstack(sheet[k:k + 4]) for k in range(0, len(sheet) - len(sheet) % 4, 4)]
cv2.imwrite(f'{OUT}/sheet.jpg', cv2.cvtColor(np.vstack(rows), cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 88])

# ---- sound: the kit's effects and the kit's song
SR = 48000
N = int(TOTAL * SR)


def load(path, ss=None, to=None):
    cmd = ['ffmpeg', '-nostdin', '-v', 'error'] + (['-ss', str(ss)] if ss is not None else []) + (['-to', str(to)] if to is not None else []) + ['-i', path, '-ar', str(SR), '-ac', '2', '-f', 's16le', '-']
    return (np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, np.int16).astype(np.float32) / 32768).reshape(-1, 2)


fx = np.zeros((N, 2), np.float32)


def put(name, t, gain=0.0, trim=None):
    x = load(f'{SK}/sfx/{name}.wav')
    if trim:
        x = x[:int(trim * SR)]
    i = int(t * SR)
    e = min(N, i + len(x))
    fx[i:e] += x[:e - i] * 10 ** (gain / 20)


put('cut', 0.0, -3)
put('riser', 1.25, 2)
put('click', 2.85, 4)
put('shutter_a', 2.90, -4)
put('ticks_a', 3.02, 4)
put('hit', 5.56, -2)
put('swell', 6.0, -3)
put('burn_in', 7.58, 4)
put('burn_out', 8.45, 4)
put('hit', 9.3, -5)
put('typing', 11.15, 4, trim=1.8)
put('whoosh', 14.8, 8)
fx[int(7.86 * SR):int(8.45 * SR)] = 0   # total silence on the black of the burn

t0 = 43.5 + 58.0 - 8.85                 # the song's drop lands where the blue chapter starts
music = load(f'{SK}/music/song.m4a', ss=t0, to=t0 + TOTAL)
music = np.pad(music, ((0, max(0, N - len(music))), (0, 0)))[:N]
env = np.ones(N, np.float32)
env[int(5.9 * SR):int(8.85 * SR)] = 0
env[int(15.0 * SR):] = np.linspace(1, 0, N - int(15.0 * SR))
music = music * env[:, None] * 0.38
mix = fx + music
raw = f'{OUT}/_mix.wav'
subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-y', '-f', 's16le', '-ar', str(SR), '-ac', '2', '-i', '-', '-af', 'alimiter=limit=0.89:level=disabled', raw],
               input=(np.clip(mix, -1, 1) * 32767).astype(np.int16).tobytes(), check=True)
final = f'{OUT}/demo.mp4'
subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-y', '-i', pic, '-i', raw, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-shortest', '-movflags', '+faststart', final], check=True)
os.remove(pic)
os.remove(raw)

# ---- the proof
info = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'stream=codec_type,width,height:format=duration', '-of', 'compact', final], capture_output=True, text=True).stdout
e = subprocess.run(['ffmpeg', '-nostdin', '-hide_banner', '-i', final, '-af', 'ebur128=framelog=quiet', '-f', 'null', '-'], capture_output=True, text=True).stderr
lufs = float(re.findall(r'I:\s+(-?[0-9.]+) LUFS', e)[-1])
good = 'codec_type=video' in info and 'codec_type=audio' in info and 'width=1920' in info and -30 < lufs < -6
print(info.strip().replace('\n', ' | '))
print(f'loudness {lufs:.1f} LUFS')
print(('DEMO OK ' if good else 'DEMO FAILED ') + final)
sys.exit(0 if good else 1)
