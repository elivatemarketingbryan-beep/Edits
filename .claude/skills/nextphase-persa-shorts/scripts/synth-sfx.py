#!/usr/bin/env python3
"""
SYNTH-SFX — the royalty-free default sound palette, synthesised from scratch in code.

    python3 scripts/synth-sfx.py            # writes sfx/*.wav (skips files that exist)
    python3 scripts/synth-sfx.py --force    # rebuild all

Every sound here is generated from sine waves, filtered noise and envelopes — no samples, no
third-party pack, nothing to license. They are deliberately plain and DIM: in this style sound
punctuates, it never announces. Swap in your own pack any time — mix-sfx.sh looks in the
skill's sfx/ folder, or in $SFX_DIR if you set it, by NAME (swell.wav, riser.mp3, ...).

The persa palette (reference/SOUND.md):
    swell             every layout change — a fast 0.5s rise that lands on the cut
    riser             once, building into the hook payoff (starts ~1.5s BEFORE the word)
    camera-shutter    a product NAME, once per spoken part ("Git" / "Hub")
    futuristic-click  two or three per video, where a real UI does the thing being described
    pop               the CTA
    whoosh            a big element flying in (optional)
    click · keyboard · magic-reveal   available, rarely needed

Every file is peak-normalised to -1 dBFS and starts within 10ms (no leading silence to pre-roll).
"""
import argparse
import math
import pathlib
import random
import struct
import wave

SR = 48000
OUT = pathlib.Path(__file__).resolve().parent.parent / "sfx"


def env_adsr(n, a, d, s_level, r, total):
    out = []
    A, D, R = int(a * SR), int(d * SR), int(r * SR)
    S = max(0, n - A - D - R)
    for i in range(n):
        if i < A:
            v = i / max(1, A)
        elif i < A + D:
            v = 1 - (1 - s_level) * (i - A) / max(1, D)
        elif i < A + D + S:
            v = s_level
        else:
            v = s_level * max(0.0, 1 - (i - A - D - S) / max(1, R))
        out.append(v)
    return out


def noise(n, seed):
    rnd = random.Random(seed)
    return [rnd.uniform(-1, 1) for _ in range(n)]


def onepole_lp(x, cutoff_fn):
    y, prev = [], 0.0
    for i, v in enumerate(x):
        fc = cutoff_fn(i)
        k = 1 - math.exp(-2 * math.pi * fc / SR)
        prev += k * (v - prev)
        y.append(prev)
    return y


def hp(x, fc):
    y, px, py = [], 0.0, 0.0
    rc = 1 / (2 * math.pi * fc)
    al = rc / (rc + 1 / SR)
    for v in x:
        py = al * (py + v - px)
        px = v
        y.append(py)
    return y


def norm(x, peak_db=-1.0):
    m = max(1e-9, max(abs(v) for v in x))
    g = 10 ** (peak_db / 20) / m
    return [v * g for v in x]


def write(name, x):
    OUT.mkdir(parents=True, exist_ok=True)
    x = norm(x)
    with wave.open(str(OUT / f"{name}.wav"), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        frames = b"".join(struct.pack("<hh", int(v * 32767), int(v * 32767)) for v in x)
        w.writeframes(frames)


def swell():
    n = int(0.55 * SR)
    nz = noise(n, 1)
    body = onepole_lp(nz, lambda i: 300 + 5200 * (i / n) ** 2)
    tone = [0.35 * math.sin(2 * math.pi * (110 + 220 * (i / n) ** 2) * i / SR) for i in range(n)]
    e = [((i / n) ** 2.2) * (1 if i < 0.92 * n else max(0, 1 - (i - 0.92 * n) / (0.08 * n))) for i in range(n)]
    return [(body[i] * 1.6 + tone[i]) * e[i] for i in range(n)]


def riser():
    n = int(3.2 * SR)
    nz = noise(n, 2)
    body = onepole_lp(nz, lambda i: 200 + 7000 * (i / n) ** 2.5)
    out = []
    ph = 0.0
    for i in range(n):
        f = 90 * (2 ** (3.2 * (i / n) ** 1.6))
        ph += 2 * math.pi * f / SR
        tone = 0.25 * math.sin(ph) + 0.12 * math.sin(2 * ph)
        e = (i / n) ** 1.8
        tail = 1 if i < 0.96 * n else max(0, 1 - (i - 0.96 * n) / (0.04 * n))
        out.append((body[i] * 1.3 + tone) * e * tail)
    return out


def shutter():
    n = int(0.16 * SR)
    nz = hp(noise(n, 3), 1800)
    out = []
    for i in range(n):
        t = i / SR
        c1 = math.exp(-t / 0.006)
        c2 = math.exp(-max(0, t - 0.055) / 0.008) if t >= 0.055 else 0
        out.append(nz[i] * (c1 + 0.8 * c2))
    return out


def fclick():
    n = int(0.32 * SR)
    out = []
    for i in range(n):
        t = i / SR
        f = 2400 - 1400 * min(1, t / 0.05)
        e = math.exp(-t / 0.045)
        out.append((math.sin(2 * math.pi * f * t) * 0.6 + math.sin(2 * math.pi * 3 * f * t) * 0.15) * e)
    blip = [0.0] * int(0.06 * SR) + [math.sin(2 * math.pi * 3200 * (j / SR)) * math.exp(-(j / SR) / 0.02) * 0.4
                                     for j in range(n - int(0.06 * SR))]
    return [out[i] + blip[i] for i in range(n)]


def pop():
    n = int(0.14 * SR)
    out = []
    for i in range(n):
        t = i / SR
        f = 900 * math.exp(-t / 0.03) + 280
        out.append(math.sin(2 * math.pi * f * t) * math.exp(-t / 0.035))
    return out


def click():
    n = int(0.06 * SR)
    nz = hp(noise(n, 4), 3000)
    return [nz[i] * math.exp(-(i / SR) / 0.004) for i in range(n)]


def whoosh():
    n = int(0.75 * SR)
    nz = noise(n, 5)
    mid = 0.45 * n
    body = onepole_lp(nz, lambda i: 400 + 3800 * math.exp(-((i - mid) / (0.22 * n)) ** 2))
    e = [math.exp(-((i - mid) / (0.25 * n)) ** 2) for i in range(n)]
    return [body[i] * e[i] for i in range(n)]


def keyboard():
    n = int(1.2 * SR)
    out = [0.0] * n
    rnd = random.Random(6)
    t = 0.02
    while t < 1.1:
        k = click()
        start = int(t * SR)
        g = rnd.uniform(0.5, 1.0)
        for j, v in enumerate(k):
            if start + j < n:
                out[start + j] += v * g
        t += rnd.uniform(0.07, 0.14)
    return out


def magic():
    n = int(1.6 * SR)
    out = [0.0] * n
    notes = [880, 1108.7, 1318.5, 1760, 2217.5]
    for k, f in enumerate(notes):
        st = int(k * 0.09 * SR)
        for i in range(st, n):
            t = (i - st) / SR
            out[i] += math.sin(2 * math.pi * f * t) * math.exp(-t / 0.5) * 0.25
    shimmer = onepole_lp(hp(noise(n, 7), 5000), lambda i: 9000)
    return [out[i] + shimmer[i] * 0.15 * math.exp(-(i / SR) / 0.7) for i in range(n)]


SOUNDS = {"swell": swell, "riser": riser, "camera-shutter": shutter, "futuristic-click": fclick,
          "pop": pop, "click": click, "whoosh": whoosh, "keyboard": keyboard, "magic-reveal": magic}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true")
    a = ap.parse_args()
    for name, fn in SOUNDS.items():
        p = OUT / f"{name}.wav"
        if p.exists() and not a.force:
            continue
        write(name, fn())
        print(f"  sfx/{name}.wav")
    print(f"synth-sfx: palette ready in {OUT}")


if __name__ == "__main__":
    main()
