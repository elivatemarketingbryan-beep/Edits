#!/usr/bin/env python3
"""
MAKE-GRADE-FILTER — the persa film grade, as an SVG feComponentTransfer.

    python3 scripts/make-grade-filter.py --derive <video>/assets/recording.mp4 --out <video>/grade-persa.svg
    python3 scripts/make-grade-filter.py --out grade-persa.svg              # the stored default
    python3 scripts/make-grade-filter.py --strength 0.6 --derive rec.mp4 --out grade-persa.svg

`type="table"` is a per-channel lookup table — a curve per channel, which is a grade. It runs in
the browser at render time, so nothing is re-encoded and it can be switched off per element.

THE LOOK (measured from 19 face/room frames of the reference reels): warm highlights over cool,
slightly green shadows; blue rolled off ~20% through the mids and highs; a small black LIFT
(the darkest band never reaches 0 — a haze in the blacks).

## Two wrong turns worth not repeating

1 · Histogram matching is not a grade. Matching your CDF to the reference produces a LUT that
crushes mid-grey from 128 to ~70 — it reproduces the reference ROOM'S EXPOSURE, not its grade.

2 · Percentile bins lie. Binning by luma DECILE compares different parts of the curve (your 20th
percentile can sit at luma 80 while the reference's sits at 59) and makes the shadow error worse.

What is correct: compare at MATCHED ABSOLUTE LUMA. For each luma band, measure each channel as a
ratio to that band's luma, in both sources; the correction is reference ÷ yours.

## Therefore: DERIVE IT PER RECORDING
Most of the correction is usually removing YOUR room's lighting cast (a tungsten lamp runs the
low-mids red). That is lighting, not grade, so the correction belongs to the take. Re-derive
whenever the lighting changes. The reference profile below is fixed and never re-measured.

Apply with style="filter:url(#persa-grade)" on PHOTOGRAPHIC surfaces only — the camera, the
cut-out, the card, b-roll. NEVER on a product UI, page shot or captured device: recolouring a
real product's interface fabricates it. Strength defaults to 0.75; full strength can read
sallow on warmer skin.
"""
import argparse
import os
import shutil
import subprocess
import sys
import tempfile

try:
    from PIL import Image
except ImportError:
    sys.exit("needs Pillow:  python3 -m pip install --user pillow")

# the REFERENCE profile: luma band centre -> (R, G, B) as a ratio to that band's own luma
REFERENCE = [
    (10,  0.836, 1.005, 1.403),
    (28,  0.919, 1.046, 0.977),
    (45,  0.906, 1.058, 0.947),
    (68,  0.969, 1.043, 0.861),
    (95,  1.039, 1.017, 0.811),
    (128, 1.067, 1.011, 0.770),
    (162, 1.038, 1.017, 0.815),
    (198, 1.029, 1.011, 0.869),
    (236, 1.007, 1.002, 0.969),
]

# a stored default correction, derived from one indoor take lit by a warm lamp. Use --derive.
DEFAULT_CORRECTION = [
    (10,  0.928, 0.996, 1.157),
    (28,  0.986, 1.036, 0.866),
    (45,  0.833, 1.098, 0.992),
    (68,  0.792, 1.127, 1.080),
    (95,  0.821, 1.111, 1.098),
    (128, 0.910, 1.064, 0.954),
    (162, 1.005, 1.020, 0.877),
    (198, 1.017, 1.007, 0.914),
    (236, 1.006, 0.998, 0.998),
]

EDGES = [0, 20, 35, 55, 80, 110, 145, 180, 215, 256]
BLACK_LIFT = 0.030
N = 33


def profile(paths):
    acc = [[0.0, 0.0, 0.0, 0.0, 0] for _ in range(len(EDGES) - 1)]
    for f in paths:
        for r, g, b in Image.open(f).convert("RGB").getdata():
            L = 0.299 * r + 0.587 * g + 0.114 * b
            for i in range(len(EDGES) - 1):
                if EDGES[i] <= L < EDGES[i + 1]:
                    a = acc[i]
                    a[0] += L; a[1] += r; a[2] += g; a[3] += b; a[4] += 1
                    break
    out = {}
    for i, a in enumerate(acc):
        if a[4] < 500:
            continue
        L = a[0] / a[4]
        out[i] = (L, a[1] / a[4] / L, a[2] / a[4] / L, a[3] / a[4] / L)
    return out


def sample_frames(video, tmp, n=11):
    dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                "-of", "csv=p=0", video], capture_output=True, text=True,
                               stdin=subprocess.DEVNULL).stdout.strip())
    out = []
    for k in range(n):
        p = os.path.join(tmp, f"{k:03d}.png")
        subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-ss", f"{dur * (k + 0.5) / n:.2f}",
                        "-i", video, "-frames:v", "1", "-vf", "scale=270:-1", p], check=True)
        out.append(p)
    return out


def derive(video):
    tmp = tempfile.mkdtemp()
    try:
        ours = profile(sample_frames(video, tmp))
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    corr = []
    print(f"# derived from {video}", file=sys.stderr)
    print("#      band     ref R/G/B            yours R/G/B          correction", file=sys.stderr)
    for i, (lc, hr, hg, hb) in enumerate(REFERENCE):
        if i not in ours:
            corr.append((lc, 1.0, 1.0, 1.0))
            continue
        _, orr, og, ob = ours[i]
        c = (lc, hr / orr, hg / og, hb / ob)
        corr.append(c)
        print(f"# {EDGES[i]:4d}-{EDGES[i+1]:<5d}  {hr:6.3f} {hg:6.3f} {hb:6.3f}   "
              f"{orr:6.3f} {og:6.3f} {ob:6.3f}    {c[1]:6.3f} {c[2]:6.3f} {c[3]:6.3f}", file=sys.stderr)
    return corr


def lerp(table, v):
    if v <= table[0][0]:
        return table[0][1:]
    if v >= table[-1][0]:
        return table[-1][1:]
    for a, b in zip(table, table[1:]):
        if a[0] <= v <= b[0]:
            f = (v - a[0]) / (b[0] - a[0])
            return tuple(a[k] + (b[k] - a[k]) * f for k in (1, 2, 3))
    return table[-1][1:]


def tables(correction, strength=0.75, lift=BLACK_LIFT, clamp=0.30):
    out = {}
    for ci, c in enumerate("RGB"):
        vals = []
        for k in range(N):
            v = k * 255 / (N - 1)
            r = lerp(correction, v)[ci]
            r = min(1 + clamp, max(1 - clamp, r))       # no channel moves more than ±30%
            r = 1.0 + (r - 1.0) * strength
            y = v * r + 255.0 * lift * strength * (1.0 - v / 255.0) ** 3   # lift at the bottom only
            vals.append(round(min(255.0, max(0.0, y)) / 255, 4))
        for k in range(1, N):
            vals[k] = max(vals[k], vals[k - 1])         # keep it monotonic
        out[c] = vals
    return out


SVG = """<!-- persa grade — scripts/make-grade-filter.py --strength {S}
     Apply with  style="filter:url(#persa-grade)"  on the camera AND on every b-roll clip.
     Never on a product UI or page shot. -->
<svg class="grade-defs" width="0" height="0" aria-hidden="true"
     style="position:absolute;pointer-events:none">
  <filter id="persa-grade" color-interpolation-filters="sRGB">
    <feComponentTransfer>
      <feFuncR type="table" tableValues="{R}"/>
      <feFuncG type="table" tableValues="{G}"/>
      <feFuncB type="table" tableValues="{B}"/>
    </feComponentTransfer>
  </filter>
</svg>"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--derive", metavar="VIDEO", help="re-derive the correction from this take")
    ap.add_argument("--strength", type=float, default=0.75)
    ap.add_argument("--lift", type=float, default=BLACK_LIFT)
    ap.add_argument("--out")
    a = ap.parse_args()
    corr = derive(a.derive) if a.derive else DEFAULT_CORRECTION
    t = tables(corr, a.strength, a.lift)
    svg = SVG.format(S=a.strength, **{c: " ".join(f"{x:.4f}" for x in t[c]) for c in "RGB"})
    if a.out:
        open(a.out, "w").write(svg + "\n")
        print(f"wrote {a.out}  (strength {a.strength}, lift {a.lift})")
    else:
        print(svg)


if __name__ == "__main__":
    main()
