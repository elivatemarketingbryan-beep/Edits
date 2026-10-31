"""Procedural sound design for the ONE PROMPT local cut — every effect is synthesised from math (no samples).

  python tools/sfx.py data/cues.json        → data/sfx_bus.wav (effects only) + data/mix.wav (song + effects)

Cue: {t, type, gain}. Types: whoosh swoosh impact boom click type pop glitch riser ding coin shatter rip paper bell
zap firework tick stamp. Everything is deterministic (seeded noise). Uses numpy + scipy (ACE-Step venv).
"""
import json, sys, os
import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
rs = np.random.RandomState(1234)


def t_(d): return np.arange(int(d * SR)) / SR
def noise(d, seed=0): return np.random.RandomState(seed).uniform(-1, 1, int(d * SR))
def env_ad(d, a, curve=4.0):
    n = int(d * SR); x = np.arange(n) / SR
    e = np.where(x < a, x / max(a, 1e-4), np.exp(-curve * (x - a) / max(d - a, 1e-4)))
    return e
def lp(x, f, o=2): return sosfilt(butter(o, min(f, SR / 2 - 100), 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, min(hi, SR / 2 - 100)], 'band', fs=SR, output='sos'), x)
def sweep_bp(x, f0, f1, q=0.35, blocks=64):
    """time-varying band-pass by block processing (log sweep f0→f1)"""
    out = np.zeros_like(x); n = len(x); B = max(1, n // blocks)
    for i in range(0, n, B):
        u = i / max(1, n - 1); f = f0 * (f1 / f0) ** u
        seg = x[max(0, i - 256): i + B]
        y = bp(seg, max(30, f * (1 - q)), f * (1 + q))
        out[i: i + B] = y[-len(x[i: i + B]):]
    return out
def sine_sweep(d, f0, f1, shape='exp'):
    x = t_(d); f = f0 * (f1 / f0) ** (x / d) if shape == 'exp' else f0 + (f1 - f0) * x / d
    return np.sin(2 * np.pi * np.cumsum(f) / SR)
def norm(x, p=1.0): m = np.max(np.abs(x)) + 1e-9; return x / m * p
def stereo(x, pan=0.0):
    l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4)
    return np.stack([x * l * 1.414, x * r * 1.414], 1)
def pan_sweep(x, p0, p1):
    p = np.linspace(p0, p1, len(x)); l = np.cos((p + 1) * np.pi / 4); r = np.sin((p + 1) * np.pi / 4)
    return np.stack([x * l * 1.414, x * r * 1.414], 1)

# ---------------- instruments ----------------
def whoosh(seed=0, d=0.55, up=False):
    n = noise(d, seed); e = np.sin(np.pi * np.clip(t_(d) / d, 0, 1)) ** 2
    y = sweep_bp(n, 300 if up else 4000, 4000 if up else 260, 0.45) * e
    return pan_sweep(norm(y, 0.9), -0.7, 0.7)
def swoosh(seed=0): return whoosh(seed, 0.28, up=True) * 0.8
def impact(seed=0):
    d = 0.6; x = t_(d)
    body = sine_sweep(d, 140, 42) * np.exp(-x * 9)
    crack = hp(noise(d, seed), 1200) * np.exp(-x * 40)
    click = np.zeros_like(x); click[:60] = np.hanning(120)[:60] * np.sign(np.sin(np.arange(60)))
    y = np.tanh(2.2 * (body * 1.0 + crack * 0.5 + click * 0.4))
    return stereo(norm(y, 0.95))
def boom(seed=0):
    d = 1.6; x = t_(d)
    sub = sine_sweep(d, 75, 28) * np.exp(-x * 2.6)
    rumble = lp(noise(d, seed), 180) * np.exp(-x * 3) * 3
    hit = hp(noise(d, seed + 1), 800) * np.exp(-x * 25) * 0.6
    y = np.tanh(1.8 * (sub + rumble + hit))
    return stereo(norm(y, 1.0))
def click(seed=0, f=3500):
    d = 0.05; x = t_(d)
    y = bp(noise(d, seed), f * 0.6, f * 1.5) * np.exp(-x * 160) + np.sin(2 * np.pi * 1800 * x) * np.exp(-x * 220) * 0.5
    return stereo(norm(y, 0.8), (seed % 7 - 3) / 8)
def typekey(seed=0):
    d = 0.09; x = t_(d)
    down = bp(noise(d, seed), 1500, 6000) * np.exp(-x * 120)
    thock = np.sin(2 * np.pi * (220 + seed % 5 * 18) * x) * np.exp(-x * 60) * 0.7
    up = np.zeros_like(x); k = int(0.045 * SR); up[k:] = bp(noise(d, seed + 9), 2500, 8000)[: len(x) - k] * np.exp(-(x[k:] - x[k]) * 200) * 0.35
    return stereo(norm(down + thock + up, 0.8), ((seed * 37) % 11 - 5) / 12)
def pop(seed=0):
    d = 0.14; x = t_(d)
    y = sine_sweep(d, 380, 1100) * np.exp(-x * 30) + bp(noise(d, seed), 2000, 6000) * np.exp(-x * 90) * 0.3
    return stereo(norm(y, 0.8))
def glitch(seed=0):
    d = 0.32; r = np.random.RandomState(seed); y = np.zeros(int(d * SR)); i = 0
    while i < len(y):
        L = r.randint(300, 2400); f = r.choice([90, 180, 440, 880, 1760, 3520]) * r.uniform(0.9, 1.1)
        seg = np.sign(np.sin(2 * np.pi * f * np.arange(L) / SR)) * r.uniform(0.3, 1)
        if r.rand() < 0.3: seg = r.uniform(-1, 1, L)
        y[i:i + L] = seg[: len(y[i:i + L])]; i += L + r.randint(0, 900)
    y = np.round(y * 6) / 6
    return pan_sweep(norm(y, 0.7) * env_ad(d, 0.005, 2), 0.6, -0.6)
def riser(seed=0, d=1.4):
    x = t_(d); n = noise(d, seed)
    y = sweep_bp(n, 200, 7000, 0.3) * (x / d) ** 2
    saw = ((x * (110 * (8 ** (x / d)))) % 1) * 2 - 1
    y = y + lp(saw, 3000) * 0.25 * (x / d) ** 3
    return pan_sweep(norm(y, 0.8), -0.3, 0.3)
def ding(seed=0, f=1318.5, d=1.6):
    x = t_(d); y = sum(a * np.sin(2 * np.pi * f * m * x) * np.exp(-x * k) for m, a, k in [(1, 1, 2.2), (2.76, 0.45, 4), (5.4, 0.25, 7), (8.9, 0.1, 10)])
    y[:200] *= np.linspace(0, 1, 200)
    return stereo(norm(y, 0.7), 0.15)
def bell(seed=0): return ding(seed, 659.3, 2.2)
def coin(seed=0):
    d = 0.42; x = t_(d); f = np.where(x < 0.07, 987.8, 1318.5)
    y = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * np.exp(-np.maximum(0, x - 0.07) * 9) * 0.6
    return stereo(lp(y, 6000), 0.2)
def shatter(seed=0):
    d = 1.1; x = t_(d); r = np.random.RandomState(seed); y = hp(noise(d, seed), 3000) * np.exp(-x * 8) * 0.6
    for _ in range(70):
        s0 = int(r.exponential(0.18) * SR)
        if s0 >= len(y) - 2000: continue
        L = 1500; f = r.uniform(3000, 9000)
        y[s0:s0 + L] += np.sin(2 * np.pi * f * np.arange(L) / SR) * np.exp(-np.arange(L) / SR * 90) * r.uniform(0.2, 0.8)
    return pan_sweep(norm(y, 0.8), -0.5, 0.5)
def rip(seed=0):
    d = 0.5; x = t_(d); r = np.random.RandomState(seed)
    am = (r.uniform(0, 1, int(d * 600)) > 0.45).astype(float); am = np.repeat(am, SR // 600 + 1)[: len(x)]
    y = bp(noise(d, seed), 800, 7000) * am * np.sin(np.pi * x / d) ** 0.5
    return pan_sweep(norm(y, 0.75), -0.4, 0.4)
def paper(seed=0):
    d = 0.4; x = t_(d); y = bp(noise(d, seed), 1500, 9000) * (0.5 + 0.5 * np.sin(2 * np.pi * 23 * x)) * np.sin(np.pi * x / d)
    return stereo(norm(y, 0.5))
def zap(seed=0):
    d = 0.3; x = t_(d); y = (((np.cumsum(1400 * (0.08 ** (x / d))) / SR) % 1) * 2 - 1) * np.exp(-x * 9)
    return stereo(norm(lp(y, 7000), 0.7))
def firework(seed=0):
    whistle = np.sin(2 * np.pi * np.cumsum(np.linspace(800, 2600, int(0.7 * SR))) / SR) * np.linspace(0.1, 0.6, int(0.7 * SR))
    b = boom(seed)[:, 0] * 0.8
    r = np.random.RandomState(seed); cr = np.zeros(int(1.2 * SR))
    for _ in range(90):
        s0 = int(r.uniform(0.05, 1.1) * SR); L = 400
        if s0 + L < len(cr): cr[s0:s0 + L] += hp(r.uniform(-1, 1, L), 2000) * r.uniform(0.2, 0.7)
    y = np.concatenate([whistle, np.zeros(len(b))]); y[len(whistle):] += b; y[len(whistle):len(whistle) + len(cr)] += cr
    return stereo(norm(y, 0.9))
def tick(seed=0): return click(seed, 6000) * 0.6
def stamp(seed=0):
    d = 0.35; x = t_(d)
    y = np.tanh(3 * (sine_sweep(d, 120, 60) * np.exp(-x * 18) + lp(noise(d, seed), 2500) * np.exp(-x * 35) * 0.8))
    return stereo(norm(y, 0.9))

BANK = dict(whoosh=whoosh, swoosh=swoosh, impact=impact, boom=boom, click=click, type=typekey, pop=pop, glitch=glitch, riser=riser,
            ding=ding, coin=coin, shatter=shatter, rip=rip, paper=paper, bell=bell, zap=zap, firework=firework, tick=tick, stamp=stamp)
LEVEL = dict(whoosh=0.42, swoosh=0.32, impact=0.55, boom=0.6, click=0.3, type=0.32, pop=0.35, glitch=0.35, riser=0.32, ding=0.3, coin=0.32,
             shatter=0.42, rip=0.4, paper=0.3, bell=0.3, zap=0.3, firework=0.45, tick=0.22, stamp=0.55)
# effects that should END on the cue instead of starting there
PRE = dict(riser=1.4, whoosh=0.2)


def small_room_ir(d=0.9, seed=5):
    x = t_(d); r = np.random.RandomState(seed)
    ir = np.stack([r.uniform(-1, 1, len(x)), r.uniform(-1, 1, len(x))], 1) * np.exp(-x * 6.5)[:, None]
    ir[:, 0] = lp(ir[:, 0], 6000); ir[:, 1] = lp(ir[:, 1], 6000); ir[0] = 1
    return ir / np.sum(np.abs(ir), 0) * 8


def main():
    cues = json.load(open(sys.argv[1] if len(sys.argv) > 1 else f'{ROOT}/data/cues.json'))
    song, sr = sf.read(f'{ROOT}/data/song.wav', always_2d=True)
    if sr != SR:
        from scipy.signal import resample_poly
        song = resample_poly(song, SR, sr, axis=0)
    bus = np.zeros_like(song)
    unknown = set(); last = {}
    for k, c in enumerate(sorted(cues, key=lambda c: c['t'])):
        typ = c['type']
        if typ not in BANK: unknown.add(typ); continue
        # avoid machine-gun stacking of the same effect
        if typ in last and c['t'] - last[typ] < 0.06 and typ not in ('type', 'click', 'tick'): continue
        last[typ] = c['t']
        snd = BANK[typ](k)
        g = LEVEL[typ] * float(c.get('gain', 1))
        start = int((c['t'] - PRE.get(typ, 0)) * SR)
        if start < 0: snd = snd[-start:]; start = 0
        end = min(len(bus), start + len(snd))
        bus[start:end] += snd[: end - start] * g
    wet = np.stack([fftconvolve(bus[:, i], small_room_ir()[:, i])[: len(bus)] for i in range(2)], 1)
    bus = bus * 0.85 + wet * 0.15
    sf.write(f'{ROOT}/data/sfx_bus.wav', np.clip(bus, -1, 1), SR, subtype='PCM_24')
    mix = song * 0.92 + bus * 0.55
    # soft limiter
    a = np.abs(mix); th = 0.92
    mix = np.where(a > th, np.sign(mix) * (th + (1 - th) * np.tanh((a - th) / (1 - th))), mix)
    sf.write(f'{ROOT}/data/mix.wav', mix, SR, subtype='PCM_24')
    print('cues', len(cues), 'unknown types', unknown or '-', 'peak', round(float(np.max(np.abs(mix))), 3))


if __name__ == '__main__':
    main()
