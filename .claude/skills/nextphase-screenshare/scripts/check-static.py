#!/usr/bin/env python3
"""check-static.py — the drift gate, for the `classic` (white, static) ground.

⚠ On the default played-share variant (live dot ground, rebuilt UIs moving
  inside their cards) motion is EXPECTED and this gate will report it. Use it
  only when brand.json says ground "classic" and you are building REF-A's
  still canvas, or to hunt a suspected drift on a single beat.

NOTHING on the canvas moves in this style. That is measured, not a
preference: across every canvas frame of the reference, with the camera card
masked out, the mean frame-to-frame difference was

    median 0.158        mean 1.125        p90 2.230

The median is the finding — half of all canvas frames are *identical* to the
frame before them. The mean and the p90 are elements arriving.

A drifting canvas is the single most common way a screenshare comp goes
wrong, usually by carrying a habit in from `motiongraphics`, and it fails
silently: a 2px-per-second push is invisible in a preview and obvious in a
finished cut. Worse, it breaks the premise — a real shared screen does not
drift, so the moment the canvas moves the viewer stops reading it as a screen.

This script measures it on the render.

  usage:  python3 check-static.py out/seg-01.mp4
          python3 check-static.py out/seg-01.mp4 --fps 10
          python3 check-static.py out/seg-01.mp4 --median 0.6 --p90 4.0

Exit 0 = the canvas holds still.  Exit 1 = something is moving; find it.

What it does NOT flag: the camera card (masked), the caption band (masked),
and short bursts of change, which are the arrivals and the shrink. It is
looking for *sustained* motion on the canvas.
"""
import argparse
import subprocess
import sys

import numpy as np

# ⚠ The interframe difference depends on the SAMPLE RATE — consecutive frames
#   0.033s apart differ far less than frames 0.2s apart. So the thresholds are
#   not constants; they are a multiple of what the reference itself scores at
#   the same rate. This table was measured by running THIS script over the
#   reference video at each rate:
#
#       fps=30   median 0.155   mean 1.276   p90 2.666   <- matches the
#       fps=15   median 0.401   mean 1.978   p90 4.105      original 30fps
#       fps=10   median 0.601   mean 2.547   p90 5.019      reading of 0.158
#       fps=5    median 1.063   mean 3.535   p90 7.778
#
#   Default to 30 so the numbers printed are directly comparable to the ones
#   in reference-log.md §3.7. A lower rate is fine for a quick pass; the
#   thresholds move with it.
REF = {30: (0.155, 2.666), 15: (0.401, 4.105),
       10: (0.601, 5.019),  5: (1.063, 7.778)}
MEDIAN_SLACK = 3.9     # a comp under this is indistinguishable from the ref
P90_SLACK    = 1.5


def reference_at(fps):
    """Interpolate the reference's own score at this sample rate."""
    ks = sorted(REF)
    if fps <= ks[0]:
        return REF[ks[0]]
    if fps >= ks[-1]:
        return REF[ks[-1]]
    lo = max(k for k in ks if k <= fps)
    hi = min(k for k in ks if k >= fps)
    if lo == hi:
        return REF[lo]
    t = (fps - lo) / (hi - lo)
    return tuple(REF[lo][i] + (REF[hi][i] - REF[lo][i]) * t for i in (0, 1))

W, H = 480, 270        # analysis resolution; 1 unit = 4 source px
SCALE = 1920 / W       # units -> source pixels

# A sustained translation of the canvas content, in SOURCE px/s, that counts
# as "moving". The reference scores a flat 0.00: its canvas artwork does not
# translate at all. The detector resolves 2 px/s, so any non-zero reading is
# a real drift and this limit just sits under it.
DRIFT_MAX = 1.5
DRIFT_LAG = 2.0        # seconds between the two frames compared
DRIFT_R   = 4          # search radius in units (+-16 source px)

# Masks, as fractions of the frame:
#   the camera card lives bottom-right and legitimately moves
#   the caption band legitimately changes every ~18 frames
CAM_MASK = (0.78, 0.63, 1.00, 1.00)   # x0, y0, x1, y1
CAP_MASK = (0.00, 0.75, 1.00, 0.90)


def probe_fps(path):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0",
         "-show_entries", "stream=r_frame_rate", "-of", "csv=p=0", path],
        capture_output=True, text=True).stdout.strip()
    try:
        n, d = out.split("/")
        return float(n) / float(d)
    except Exception:
        return 30.0


def frames(path, fps):
    """Yield the render as an (n, H, W, 3) float array at `fps`."""
    cmd = ["ffmpeg", "-v", "error", "-i", path,
           "-vf", f"fps={fps},scale={W}:{H}:flags=area",
           "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]
    raw = subprocess.run(cmd, capture_output=True).stdout
    n = len(raw) // (W * H * 3)
    if n == 0:
        sys.exit(f"check-static: no frames decoded from {path}")
    return np.frombuffer(raw[: n * W * H * 3], dtype=np.uint8) \
             .reshape(n, H, W, 3).astype(np.float32)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--fps", type=float, default=30.0,
                    help="sampling rate (default 30 — the rate the reference "
                         "numbers were measured at)")
    ap.add_argument("--median", type=float, default=None,
                    help="override; default is 3.9x the reference at this fps")
    ap.add_argument("--p90", type=float, default=None,
                    help="override; default is 1.5x the reference at this fps")
    ap.add_argument("--no-mask-caption", action="store_true",
                    help="also measure the caption band (it will fail)")
    a = ap.parse_args()

    ref_med, ref_p90 = reference_at(a.fps)
    if a.median is None:
        a.median = round(ref_med * MEDIAN_SLACK, 3)
    if a.p90 is None:
        a.p90 = round(ref_p90 * P90_SLACK, 3)

    a_frames = frames(a.video, a.fps)
    g = a_frames.mean(axis=3)

    mask = np.ones((H, W), bool)
    for (x0, y0, x1, y1), on in ((CAM_MASK, True),
                                 (CAP_MASK, not a.no_mask_caption)):
        if on:
            mask[int(y0 * H):int(y1 * H), int(x0 * W):int(x1 * W)] = False

    # canvas frames only: near-white top-left AND top-right corners
    tl = a_frames[:, 1, 1].min(axis=1)
    tr = a_frames[:, 1, W - 2].min(axis=1)
    canvas = (tl > 246) & (tr > 246)

    pair = canvas[1:] & canvas[:-1]
    if pair.sum() < 4:
        print(f"check-static: {a.video}")
        print("  no canvas frames found — nothing to measure "
              "(a camera-only segment is fine)")
        return 0

    d = np.array([np.abs(g[i] - g[i - 1])[mask].mean()
                  for i in range(1, len(g))])
    d = d[pair]

    # ── the drift test ───────────────────────────────────────────────────
    # ⚠ Two obvious metrics DO NOT work here, both tested against the
    #   reference and against synthetic drifts:
    #
    #   · mean interframe difference (the energy test above) barely moves —
    #     a textured card drifting 6 px/s scored 0.411 against 0.402 static.
    #   · the centroid of the canvas content reads the reference as drifting
    #     ~6 px/s, because a layout with live video ON the canvas moves the
    #     centroid without anything translating. A mean cannot tell those apart.
    #
    # What works is a best-shift search: for two frames DRIFT_LAG apart, find
    # the integer (dx,dy) that best aligns them. It is a MAJORITY estimator,
    # so a live-video region cannot outvote the static artwork, and the median
    # across samples rejects the one-off jump of an element arriving.
    lag = int(round(a.fps * DRIFT_LAG))
    R = DRIFT_R
    keep = mask[R:H - R, R:W - R]
    shifts = []
    for i in range(0, len(g) - lag, max(1, int(round(a.fps * 2)))):
        if not (canvas[i] and canvas[i + lag]):
            continue
        A = g[i][R:H - R, R:W - R]
        best = None
        for dy in range(-R, R + 1):
            for dx in range(-R, R + 1):
                B = g[i + lag][R + dy:H - R + dy, R + dx:W - R + dx]
                v = float(np.abs(A - B)[keep].mean())
                if best is None or v < best[0]:
                    best = (v, dx, dy)
        shifts.append((best[1], best[2]))

    if shifts:
        sx = float(np.median([s_[0] for s_ in shifts]))
        sy = float(np.median([s_[1] for s_ in shifts]))
        worst = float(np.hypot(sx, sy)) * SCALE / DRIFT_LAG
        moved = float(np.mean([(s_[0] or s_[1]) != 0 for s_ in shifts]))
    else:
        worst, moved = 0.0, 0.0


    med = float(np.median(d))
    p90 = float(np.percentile(d, 90))
    mean = float(d.mean())

    print(f"check-static: {a.video}")
    print(f"  canvas frame pairs sampled : {pair.sum()} @ {a.fps}fps")
    print(f"  interframe difference      : median {med:.3f}   "
          f"mean {mean:.3f}   p90 {p90:.3f}")
    print(f"  reference @ {a.fps:g}fps           : median {ref_med:.3f}"
          f"                p90 {ref_p90:.3f}")
    print(f"  limits                     : median {a.median:.3f}"
          f"                p90 {a.p90:.3f}")
    print(f"  sustained canvas drift     : {worst:.2f} px/s"
          f"   (limit {DRIFT_MAX:.1f}, reference 0.00)")
    if shifts:
        print(f"  samples showing any shift  : {moved * 100:.0f}% of "
              f"{len(shifts)}   (content changing is normal; a DRIFT is a "
              f"consistent direction)")

    ok = True
    if worst > DRIFT_MAX:
        ok = False
        print(f"\n  FAIL  the canvas is TRANSLATING at {worst:.2f} px/s")
        print(f"        Median best-fit shift over a {DRIFT_LAG:.0f}s lag: "
              f"({sx:+.0f}, {sy:+.0f}) units = "
              f"({sx * SCALE:+.0f}, {sy * SCALE:+.0f}) source px.")
        print("        Nothing on the canvas moves. Find the drift/push-in/")
        print("        parallax and delete it. motion-grammar.md §4.")
    if med > a.median:
        ok = False
        print(f"\n  FAIL  median {med:.3f} > {a.median:.3f}")
        print("        The canvas is moving continuously. Look for a drift, a")
        print("        push-in, a ken-burns on a screenshot, a parallax, or a")
        print("        looping pulse/shimmer. motion-grammar.md §4.")
    if p90 > a.p90:
        ok = False
        print(f"\n  FAIL  p90 {p90:.3f} > {a.p90:.3f}")
        print("        Too much change even allowing for arrivals. Either an")
        print("        element is animating longer than 6 frames, or several")
        print("        are staggered past the 5-item limit, or something is")
        print("        looping. motion-grammar.md §2.")

    if ok:
        # locate the noisiest sustained window, as a courtesy
        if len(d) > 20:
            k = 10
            run = np.convolve(d, np.ones(k) / k, mode="valid")
            i = int(np.argmax(run))
            print(f"\n  clean — the canvas holds still.")
            print(f"  (busiest 1s window starts around "
                  f"{i / a.fps:.1f}s at {run[i]:.3f}; that is the arrivals)")
        else:
            print("\n  clean — the canvas holds still.")
        return 0

    print("\ncheck-static FAILED.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
