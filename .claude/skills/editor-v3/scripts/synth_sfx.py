#!/usr/bin/env python3
"""synth_sfx.py [outdir]: makes every sound in the kit from noise and sine waves. No samples and no recordings.

Each sound is shaped to the length, level and frequency balance measured off the reference reels, so it sits in the
mix the same way. To use your own sounds instead, drop a WAV with the same name into sfx/.
"""
import os, sys
import numpy as np
import soundfile as sf

SR = 48000
BANDS = [(20, 120), (120, 500), (500, 2000), (2000, 6000), (6000, 16000)]
CENTRES = np.array([50.0, 245.0, 1000.0, 3460.0, 9800.0])


def band_levels(x):
    p = np.abs(np.fft.rfft(x)) ** 2
    fr = np.fft.rfftfreq(len(x), 1 / SR)
    return np.array([10 * np.log10(p[(fr >= a) & (fr < b)].sum() / len(x) + 1e-12) for a, b in BANDS])


def fit(x, target, peak):
    """Move a sound's frequency balance onto the measured one, then set its peak."""
    # The balance and loudness are what the mix depends on, so only tame a peak well over the measured one
    lim = 10 ** ((peak + 1.5) / 20)
    for _ in range(6):
        have = band_levels(x)
        f = np.fft.rfft(x)
        fr = np.maximum(np.fft.rfftfreq(len(x), 1 / SR), 1.0)
        gain_db = np.interp(np.log10(fr), np.log10(CENTRES), np.array(target) - have)
        x = np.fft.irfft(f * 10 ** (gain_db / 20), len(x))
        if np.abs(x).max() > lim:
            x = np.tanh(x / lim) * lim
    return np.clip(x, -0.98, 0.98)


def fades(x, a=0.004, b=0.012):
    i, j = int(a * SR), int(b * SR)
    x[:i] *= np.linspace(0, 1, i)
    x[-j:] *= np.linspace(1, 0, j)
    return x


def noise(n, rng):
    return rng.standard_normal(n)


def decay(n, tau, start=0):
    t = np.maximum(np.arange(n) - start, 0) / SR
    e = np.exp(-t / tau)
    e[:start] = 0
    return e


def sine_sweep(n, f0, f1, curve=1.0):
    u = np.linspace(0, 1, n) ** curve
    return np.sin(2 * np.pi * np.cumsum(f0 * (f1 / f0) ** u) / SR)


def tick(rng, f=7000, q=0.0016, length=0.02):
    """One sharp transient with a short ring."""
    n = int(length * SR)
    t = np.arange(n) / SR
    return (noise(n, rng) * np.exp(-t / 0.0012) + np.sin(2 * np.pi * f * t) * np.exp(-t / q) * 0.9)


def layer(buf, x, at):
    i = int(at * SR)
    e = min(len(buf), i + len(x))
    if e > i:
        buf[i:e] += x[:e - i]


def shutter(seed, f, low=0.0):
    rng = np.random.default_rng(seed)
    x = np.zeros(int(0.08 * SR))
    layer(x, tick(rng, f), 0.006)
    if low:
        n = int(0.03 * SR)
        layer(x, np.sin(2 * np.pi * 320 * np.arange(n) / SR) * np.exp(-np.arange(n) / SR / 0.006) * low, 0.006)
    return x


def tick_run(dur, gaps, seed, f=(3200, 9000), q=0.0022):
    rng = np.random.default_rng(seed)
    x = np.zeros(int(dur * SR))
    t, i = 0.02, 0
    while t < dur - 0.02:
        layer(x, tick(rng, rng.uniform(*f), q) * rng.uniform(0.55, 1.0), t)
        t += gaps(t / dur) * rng.uniform(0.85, 1.15)
        i += 1
    return x


def hit(dur, f0, f1, tau, seed, click=0.15):
    rng = np.random.default_rng(seed)
    n = int(dur * SR)
    x = sine_sweep(n, f0, f1, 0.35) * decay(n, tau)
    return x + noise(n, rng) * decay(n, 0.006) * click


def riser(dur, f0, f1, seed, hiss=0.25):
    rng = np.random.default_rng(seed)
    n = int(dur * SR)
    u = np.linspace(0, 1, n)
    return (sine_sweep(n, f0, f1, 1.6) + noise(n, rng) * hiss) * u ** 2.2


def boom(seed):
    rng = np.random.default_rng(seed)
    n = int(4.0 * SR)
    x = np.zeros(n)
    up = int(0.62 * SR)
    x[:up] += riser(0.62, 300, 5000, seed, 0.5) * 0.28
    d = n - up
    x[up:] += sine_sweep(d, 62, 38, 0.3) * decay(d, 1.15) + noise(d, rng) * decay(d, 0.05) * 0.25
    return x


def melody(dur, seed):
    """An original slow line, for the hook only."""
    rng = np.random.default_rng(seed)
    scale = [196.0, 233.08, 261.63, 293.66, 349.23, 392.0, 466.16, 523.25, 587.33, 698.46]
    n = int(dur * SR)
    x = np.zeros(n)
    t = 0.0
    while t < dur:
        f = float(rng.choice(scale))
        k = int(0.42 * SR)
        s = np.arange(k) / SR
        note = (np.sin(2 * np.pi * f * s) + 0.35 * np.sin(4 * np.pi * f * s)) * np.exp(-s / 0.2) * np.minimum(s / 0.015, 1)
        layer(x, note, t)
        t += 0.25
    return x


def click_times():
    """The roll follows the energy of each section: about 16 a second in the rushes, 8 in the rests, then it slows and lands."""
    ts, t = [], 0.43
    while t < 2.20:
        ts.append(t); t += 0.062
    while t < 3.35:
        ts.append(t); t += 0.105
    while t < 4.55:
        ts.append(t); t += 0.125
    while t < 6.87:
        ts.append(t); t += 0.062
    for gap in (0.245, 0.24, 0.24, 0.28, 0.40, 0.36, 0.24):
        ts.append(t); t += gap
    return ts


def hook_bed(kit):
    dur = 9.25
    n = int(dur * SR)
    rng = np.random.default_rng(40)
    u = np.arange(n) / n
    sub = sine_sweep(n, 52, 44) * 0.30 * np.minimum(1, (1 - u) * 6)
    mel = melody(dur, 41) * 0.14
    # static across the range, gone by about 6.5 s
    st = noise(n, rng) * 0.05 * np.clip((6.5 - u * dur) / 1.5, 0, 1)
    x = sub + mel + st
    layer(x, riser(0.34, 1800, 200, 42, 0.2) * 0.30, 4.28)          # the downward sweep
    layer(x, hit(0.9, 70, 40, 0.28, 43) * 0.65, 5.0)                # the low boom
    layer(x, noise(int(0.43 * SR), rng) * 0.25 * np.linspace(1, 0, int(0.43 * SR)), 0.0)  # the flash in
    for k, t in enumerate(click_times()):
        layer(x, kit['abc'[k % 3]] * 0.55, t)
    x[-int(0.3 * SR):] *= np.linspace(1, 0, int(0.3 * SR))
    return x * 0.89 / np.abs(x).max()


def roll(kit, gap, seed):
    rng = np.random.default_rng(seed)
    x = np.zeros(int(2.0 * SR))
    t, k = 0.0, 0
    while t < 2.0:
        layer(x, kit['abc'[k % 3]] * rng.uniform(0.7, 1.0), t)
        t += gap * rng.uniform(0.92, 1.08)
        k += 1
    return x


def make_all():
    out = {}
    # Shutter clicks: a tick of 5 to 9 ms with a ring near 7 kHz, gone in about 20 ms
    out['shutter_a'] = fit(shutter(1, 6900), [-68, -36, -10, 1, -1], -3.0)
    out['shutter_b'] = fit(shutter(2, 7300), [-54, -28, -8, 3, 0], -3.0)
    out['shutter_c'] = fit(shutter(3, 6500, 0.3), [-45, -10, -8, -1, -1], -3.0)
    # Counting ticks: fast, then slowing as the number settles
    out['ticks_a'] = fit(tick_run(1.80, lambda u: 0.035 + 0.09 * u ** 2, 4), [-43, -26, 8, 12, 8], -14.0)
    out['ticks_b'] = fit(tick_run(2.00, lambda u: 0.04 + 0.10 * u ** 2, 5), [-45, -26, 2, 8, 8], -12.8)
    out['ticks_c'] = fit(tick_run(2.25, lambda u: 0.04 + 0.10 * u ** 2, 6), [-33, -21, 3, 13, 10], -9.6)
    out['typing'] = fit(tick_run(3.12, lambda u: 0.125, 7, (5000, 12000), 0.003), [-62, -35, -23, 6, 11], -14.1)
    out['click'] = fit(hit(0.32, 180, 70, 0.05, 8, 0.5), [17, 8, 9, -4, -24], -11.1)
    out['hit'] = fit(hit(0.32, 110, 48, 0.09, 9, 0.3), [23, 12, -1, -23, -38], -5.5)
    out['cut'] = fit(hit(0.46, 90, 42, 0.14, 10, 0.05), [18, 15, 2, -24, -55], -10.4)
    rng = np.random.default_rng(11)
    n = int(1.65 * SR)
    gate = np.repeat(rng.random(n // 480 + 1) > 0.55, 480)[:n]
    out['glitch'] = fit(noise(n, rng) * gate * rng.uniform(0.5, 1, n), [-28, -13, -2, 7, 9], -13.5)
    out['burn_in'] = fit(hit(0.26, 100, 50, 0.1, 12, 0.3), [24, 17, -8, -15, -27], -2.2)
    n = int(0.41 * SR)
    out['burn_out'] = fit(noise(n, rng) * np.linspace(0.1, 1, n) ** 2, [8, 6, 11, 11, 4], -4.6)
    out['riser'] = fit(riser(1.15, 120, 3200, 13), [15, 12, 8, -7, -19], -10.5)
    n = int(1.72 * SR)
    out['swell'] = fit((sine_sweep(n, 42, 60) + noise(n, rng) * 0.05) * np.linspace(0.05, 1, n) ** 1.6, [25, 15, -18, -42, -57], -2.0)
    out['boom'] = fit(boom(14), [39, 18, 7, 9, 7], -0.3)
    n = int(0.43 * SR)
    out['whoosh'] = fit(noise(n, rng) * np.sin(np.linspace(0, np.pi, n)) ** 2, [1, -18, -20, -33, -42], -31.1)
    k3 = {'a': out['shutter_a'], 'b': out['shutter_b'], 'c': out['shutter_c']}
    out['roll_fast'] = roll(k3, 0.062, 15)
    out['hook_bed'] = hook_bed(k3)
    out['boom_short'] = fit(hit(0.64, 70, 40, 0.2, 17, 0.05), [30, 12, -8, -30, -40], -3.0)
    out['sweep'] = fit(riser(0.34, 1800, 200, 18, 0.2), [-10, 6, 8, -8, -25], -8.0)
    return {k: fades(v.copy()) for k, v in out.items()}


if __name__ == '__main__':
    here = os.path.dirname(os.path.abspath(__file__))
    d = sys.argv[1] if len(sys.argv) > 1 else os.path.join(here, '..', 'sfx')
    os.makedirs(d, exist_ok=True)
    made = 0
    for name, x in make_all().items():
        p = os.path.join(d, name + '.wav')
        if os.path.exists(p) and not os.environ.get('SFX_OVERWRITE'):
            continue  # your own sound with this name stays
        sf.write(p, np.column_stack([x, x]), SR, subtype='PCM_16')
        made += 1
    print(f'{made} sounds written to {os.path.normpath(d)}')
