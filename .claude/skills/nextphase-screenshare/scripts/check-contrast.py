#!/usr/bin/env python3
"""check-contrast.py — the screenshare caption-legibility gate.

The caption sits in the SAME place on both grounds: cap-top locked at y=848,
centred. On the white canvas that is dark type on white and needs nothing.
On the camera ground it is white type on an uncontrolled plate.

The reference got away with almost no shadow there because that room happened
to be dark behind the words — pixels just outside the glyphs showed at most a
12-unit ramp over 9px. That is a fact about that room, not a property of the
style. A real shoot puts a white shirt, a window or a bright wall behind the
caption sooner or later, and then the caption disappears *silently*: the
render succeeds, the thumbnail looks fine, the words are gone.

So this style ships a shadow (--ss-cap-shadow) AND this gate.

  usage:  python3 check-contrast.py out/seg-01.mp4
          python3 check-contrast.py out/seg-01.mp4 --fps 6 --max 150

Exit 0 = every footage caption readable.  Exit 1 = fix it before you ship.

FIX IT AT THE PLATE, NOT THE TYPE. Reframe onto a darker part of the shot,
re-light it, or move the caption off that beat by going to the canvas.
Thickening the shadow to rescue a blown-out frame is fixing the wrong layer
and it is how a clean style turns into burned-in auto-captions.
"""
import argparse
import subprocess
import sys

import numpy as np

# The caption band, as a fraction of the FRAME. Measured: cap-top y=848,
# descenders to y=917, on a 1080-high frame, padded a little either side.
BAND_LO, BAND_HI = 848 / 1080 - 0.02, 917 / 1080 + 0.02
# Measured widest caption 930px on a 1920 frame, centred; sample that column
# range rather than the full width so the plate either side is not counted.
COL_LO, COL_HI = 0.26, 0.74

BAND_MAX = 150.0        # --ss-cap-band-max

W, H = 240, 135


def frames(path, fps):
    cmd = ["ffmpeg", "-v", "error", "-i", path,
           "-vf", f"fps={fps},scale={W}:{H}:flags=area",
           "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]
    raw = subprocess.run(cmd, capture_output=True).stdout
    n = len(raw) // (W * H * 3)
    if n == 0:
        sys.exit(f"check-contrast: no frames decoded from {path}")
    return np.frombuffer(raw[: n * W * H * 3], dtype=np.uint8) \
             .reshape(n, H, W, 3).astype(np.float32)


def ground_rgb(video, override=None):
    """The theme's ground colour (--ss-ground), so canvas frames can be told
    apart from camera frames on ANY theme: bright paper, dark or white."""
    import os, re
    if override:
        h = override.lstrip("#")
        return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))
    d = os.path.dirname(os.path.abspath(video))
    here = os.path.dirname(os.path.abspath(__file__))
    for c in (os.path.join(d, "..", "assets", "tokens.css"), os.path.join(d, "assets", "tokens.css"),
              os.path.join(here, "..", "assets", "tokens.css")):
        if os.path.exists(c):
            m = re.search(r"--ss-ground:\s*#([0-9A-Fa-f]{6})", open(c).read())
            if m:
                h = m.group(1)
                return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))
    return (255, 255, 255)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--ground", default=None,
                    help="ground colour #hex (default: read --ss-ground from the video's tokens.css)")
    ap.add_argument("video")
    ap.add_argument("--fps", type=float, default=6.0)
    ap.add_argument("--max", type=float, default=BAND_MAX,
                    help="max mean luma behind a footage caption "
                         "(token --ss-cap-band-max)")
    a = ap.parse_args()

    f = frames(a.video, a.fps)
    # Rec.709 luma
    luma = (0.2126 * f[..., 0] + 0.7152 * f[..., 1] + 0.0722 * f[..., 2])

    y0, y1 = int(BAND_LO * H), int(BAND_HI * H)
    x0, x1 = int(COL_LO * W), int(COL_HI * W)
    band = luma[:, y0:y1, x0:x1]

    # Only the CAMERA ground matters — a canvas caption is ink on the ground.
    # A frame is canvas when both top corners show the theme's ground colour
    # (the camera only reaches the corners when it is full frame).
    g = np.array(ground_rgb(a.video, a.ground), dtype=np.float32)
    tl = np.abs(f[:, 1, 1] - g).max(axis=1)
    tr = np.abs(f[:, 1, W - 2] - g).max(axis=1)
    footage = ~((tl < 14) & (tr < 14))

    print(f"check-contrast: {a.video}")
    if footage.sum() == 0:
        print("  no camera-ground frames — nothing to gate "
              "(a canvas-only segment is fine)")
        return 0

    # The glyphs themselves are white and would drag the mean up, so measure
    # the plate: the darker 60% of the band, which is what is behind the type.
    means = []
    for i in np.where(footage)[0]:
        b = np.sort(band[i].ravel())
        means.append(float(b[: max(1, int(len(b) * 0.60))].mean()))
    means = np.array(means)
    idx = np.where(footage)[0]

    bad = means > a.max
    print(f"  camera-ground frames sampled : {footage.sum()} @ {a.fps}fps")
    print(f"  plate luma behind caption    : median {np.median(means):6.1f}   "
          f"max {means.max():6.1f}   limit {a.max:.0f}")

    if not bad.any():
        print("\n  clean — every footage caption is readable.")
        return 0

    # report contiguous failing spans, in seconds
    spans, start = [], None
    for k, is_bad in enumerate(bad):
        if is_bad and start is None:
            start = k
        elif not is_bad and start is not None:
            spans.append((start, k - 1)); start = None
    if start is not None:
        spans.append((start, len(bad) - 1))

    print(f"\n  FAIL  {bad.sum()} of {len(bad)} frames over the limit:")
    for s, e in spans:
        t0, t1 = idx[s] / a.fps, idx[e] / a.fps
        print(f"        {t0:7.2f}s – {t1:7.2f}s   "
              f"peak luma {means[s:e + 1].max():.0f}")
    print("\n  Fix at the PLATE, not the type:")
    print("    · reframe onto a darker part of the shot")
    print("    · re-light or re-expose it")
    print("    · move the caption off that beat — go to the canvas instead")
    print("  Do NOT thicken --ss-cap-shadow to rescue it. captions.md §2.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
