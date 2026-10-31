#!/usr/bin/env python3
"""
The density gate. A rule you have to remember decays; this one fails the build.

    python3 scripts/check-density.py <video-folder> [<video-folder> ...]
    python3 scripts/check-density.py <video-folder> --strict     # count moving-media holds as gaps

It reads the built index.html and measures the longest stretch where NOTHING new appears.
Measured on real cuts: the ones that feel alive hold their worst gap at ~5-6s; the ones that
feel dead all sit above 10s. Average graphics-per-minute is NOT the signal — one 10s hole
kills a cut that is dense everywhere else.

    warn  > 4.0s with nothing changing
    FAIL  > 6.0s

MOVING MEDIA RESETS THE CLOCK — this is what makes persa's demo spine legal. A gap is only dead
if nothing on screen is MOVING. A real screen recording or b-roll changes every frame, so a long
hold on one is the spine, not a hole, and it is reported separately as a "hold". A STILL does
not count: a static screenshot held 8s is a hole however good it is. The camera never counts —
it is in every frame of every cut, so if it qualified, every gap would be excused.

The gate cannot tell a good beat from a bad one. Passing it with 13 stills is gaming it.
"""
import os
import re
import sys

MAX_GAP, HARD_GAP = 4.0, 6.0
CAMERA_SRC = re.compile(r'src="assets/(?:recording[^"]*|person[^"]*)"')


def analyse(d):
    idx = os.path.join(d, "index.html")
    if not os.path.exists(idx):
        print(f"  skip  {d}: no index.html (run build.py first)")
        return None
    s = open(idx).read()
    m = re.search(r'id="root"[^>]*data-duration="([\d.]+)"', s) or re.search(r'data-duration="([\d.]+)"', s)
    DUR = float(m.group(1))
    moving = []
    for mm in re.finditer(r'<video[^>]*>', s):
        tag = mm.group(0)
        if 'class="clip' not in tag or CAMERA_SRC.search(tag):
            continue
        ms = re.search(r'data-start="([\d.]+)"', tag)
        md = re.search(r'data-duration="([\d.]+)"', tag)
        if ms and md:
            st = float(ms.group(1))
            moving.append((st, st + float(md.group(1))))
    starts = []
    for mm in re.finditer(r'<(?:div|span|video|img)[^>]*class="clip([^"]*)"[^>]*data-start="([\d.]+)"', s):
        cls, st = mm.group(1), float(mm.group(2))
        if re.search(r'\bcap\b', cls):
            continue                         # captions are not "something changing"
        starts.append(st)
    starts = sorted(set(round(x, 2) for x in starts))
    pts = [0.0] + starts + [DUR]
    gaps = [(b - a, a) for a, b in zip(pts, pts[1:])]

    def covered(a, b):
        return any(ms <= a + .05 and me >= b - .05 for ms, me in moving)

    holds = [] if "--strict" in sys.argv else [g for g in gaps if g[0] > MAX_GAP and covered(g[1], g[1] + g[0])]
    gaps = [g for g in gaps if g not in holds]
    worst, at = max(gaps) if gaps else (0.0, 0.0)
    return dict(slug=os.path.basename(os.path.abspath(d)), dur=DUR, n=len(starts), worst=worst,
                at=at, over=[g for g in gaps if g[0] > MAX_GAP], holds=holds)


def report(r):
    flag = "FAIL" if r["worst"] > HARD_GAP else ("warn" if r["worst"] > MAX_GAP else "ok  ")
    line = (f"  {flag}  {r['slug']:18s} {r['dur']:6.1f}s  {r['n']:3d} changes  "
            f"worst gap {r['worst']:5.1f}s @ {r['at']:5.1f}s")
    if r["holds"]:
        line += "  · moving-media hold(s): " + ", ".join(f"{g:.1f}s@{a:.1f}" for g, a in r["holds"])
    print(line)
    for g, a in r["over"]:
        print(f"        {g:4.1f}s with nothing new from {a:.2f}s — add a beat, a real surface, or cut")
    return r["worst"] <= HARD_GAP


if __name__ == "__main__":
    dirs = [a for a in sys.argv[1:] if not a.startswith("--")]
    if not dirs:
        sys.exit(__doc__)
    print(f"density gate — warn > {MAX_GAP}s · fail > {HARD_GAP}s · moving media resets the clock")
    ok = True
    for d in dirs:
        r = analyse(d)
        if r:
            ok &= report(r)
    sys.exit(0 if ok else 1)
