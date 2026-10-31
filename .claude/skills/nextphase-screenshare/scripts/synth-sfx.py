#!/usr/bin/env python3
"""synth-sfx.py — generate the style's sound palette in code. $0, no licence.

    python3 scripts/synth-sfx.py            writes sfx/*.wav + sfx/peaks.json

The style sounds ONE thing: a layout change. One short, quiet, non-tonal
transient on every travel, and nothing else (reference/sound-design.md).
These are synthesised from filtered noise and a soft low thump, so they are
yours outright — no sample pack, no licence question.

    share-on    ~180ms soft swell that resolves — the camera leaving full frame
    share-off   shorter, reversed feel — the camera coming back
    swap        quieter, airier — the card moving between two non-full layouts
    mark        a dry ~40ms tick — a highlighter / circle drawing on (optional)
    click       a crisp UI tap — only if a played share needs an audible click

Want your own sounds instead? Drop any .wav/.mp3 into sfx/ with one of these
names (or a new name) — scripts/mix-sfx.sh resolves sfx/<name>.{wav,mp3,...}.
peaks.json stores each file's peak offset: a cue time is a FILE START, so
build.py pre-rolls every cue by it to land the peak on the frame.
"""
import json, math, os, random, struct, wave

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, "..", "sfx"))
SR = 48000


def lowpass(xs, cutoff):
    a = math.exp(-2 * math.pi * cutoff / SR)
    y, out = 0.0, []
    for x in xs:
        y = (1 - a) * x + a * y
        out.append(y)
    return out


def highpass(xs, cutoff):
    lp = lowpass(xs, cutoff)
    return [x - l for x, l in zip(xs, lp)]


def env(n, attack, decay_tau):
    out = []
    for i in range(n):
        t = i / SR
        a = min(1.0, t / attack) if attack > 0 else 1.0
        a = a * a * (3 - 2 * a)                       # smoothstep attack
        d = math.exp(-max(0.0, t - attack) / decay_tau)
        out.append(a * d)
    return out


def noise(n, seed):
    r = random.Random(seed)
    return [r.uniform(-1, 1) for _ in range(n)]


def norm(xs, peak_db):
    m = max(abs(x) for x in xs) or 1.0
    g = (10 ** (peak_db / 20)) / m
    return [x * g for x in xs]


def write(name, xs):
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, name + ".wav")
    with wave.open(path, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        frames = bytearray()
        for x in xs:
            v = int(max(-1.0, min(1.0, x)) * 32767)
            frames += struct.pack("<hh", v, v)
        w.writeframes(bytes(frames))
    pk = max(range(len(xs)), key=lambda i: abs(xs[i])) / SR
    return round(pk, 4)


def share_on():
    n = int(0.20 * SR)
    body = highpass(lowpass(noise(n, 7), 2600), 180)
    e = env(n, 0.045, 0.045)
    thump = [math.sin(2 * math.pi * (150 - 60 * i / n) * i / SR) * math.exp(-i / SR / 0.05)
             for i in range(n)]
    xs = [b * a * 0.9 + 0.35 * t * min(1, i / (0.01 * SR)) for i, (b, a, t) in enumerate(zip(body, e, thump))]
    fade = int(0.02 * SR)
    for i in range(fade):
        xs[-1 - i] *= i / fade
    return norm(xs, -6)


def share_off():
    n = int(0.15 * SR)
    body = highpass(lowpass(noise(n, 11), 3200), 220)
    e = env(n, 0.012, 0.04)
    thump = [math.sin(2 * math.pi * (120 + 50 * i / n) * i / SR) * math.exp(-i / SR / 0.035)
             for i in range(n)]
    xs = [b * a * 0.9 + 0.3 * t * min(1, i / (0.006 * SR)) for i, (b, a, t) in enumerate(zip(body, e, thump))]
    fade = int(0.015 * SR)
    for i in range(fade):
        xs[-1 - i] *= i / fade
    return norm(xs, -7)


def swap():
    n = int(0.16 * SR)
    body = highpass(lowpass(noise(n, 23), 4200), 400)
    e = env(n, 0.03, 0.035)
    xs = [b * a for b, a in zip(body, e)]
    fade = int(0.015 * SR)
    for i in range(fade):
        xs[-1 - i] *= i / fade
    return norm(xs, -9)


def mark():
    n = int(0.05 * SR)
    body = highpass(noise(n, 31), 1800)
    e = env(n, 0.001, 0.008)
    return norm([b * a for b, a in zip(body, e)], -10)


def click():
    n = int(0.04 * SR)
    body = highpass(noise(n, 41), 2500)
    e = env(n, 0.0005, 0.004)
    tone = [math.sin(2 * math.pi * 1800 * i / SR) * math.exp(-i / SR / 0.006) for i in range(n)]
    return norm([b * a + 0.4 * t for b, a, t in zip(body, e, tone)], -8)


if __name__ == "__main__":
    peaks = {}
    for name, fn in (("share-on", share_on), ("share-off", share_off), ("swap", swap),
                     ("mark", mark), ("click", click)):
        peaks[name] = write(name, fn())
        print("  sfx/%-10s peak at %.3fs" % (name + ".wav", peaks[name]))
    json.dump(peaks, open(os.path.join(OUT, "peaks.json"), "w"), indent=1)
    print("wrote sfx/peaks.json")
