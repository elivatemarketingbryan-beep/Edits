#!/usr/bin/env python3
"""Build a clean background plate: the room with the person removed.

Averages every pixel over the frames where the person (from matte.webm) is NOT
covering it, then fills the area the person covers in every frame by inpainting.
Writes plate.png (and plate-hole.png, white where the plate had to be invented).
Used by effects that move the background separately from the speaker (vertigo).
"""
import argparse
import subprocess
import sys
from pathlib import Path

import numpy as np
import cv2

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--source", required=True)
parser.add_argument("--matte", required=True)
parser.add_argument("--outdir", required=True)
parser.add_argument("--ffmpeg", required=True)
parser.add_argument("--width", type=int, required=True)
parser.add_argument("--height", type=int, required=True)
parser.add_argument("--frames", type=int, default=0, help="frame count of the clip (to sample evenly)")
parser.add_argument("--max-frames", type=int, default=150)
args = parser.parse_args()

W, H = args.width, args.height
out = Path(args.outdir)


def reader(cmd, frame_bytes):
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE)
    while True:
        b = p.stdout.read(frame_bytes)
        if len(b) < frame_bytes:
            break
        yield b
    p.stdout.close()
    p.wait()


# sample at most max-frames frames, spread evenly over the clip
step = max(1, -(-args.frames // args.max_frames)) if args.frames else 1
pick = ["-vf", f"select=not(mod(n\\,{step}))", "-fps_mode", "passthrough"]
src = reader([args.ffmpeg, "-v", "error", "-i", args.source, *pick, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], W * H * 3)
mat = reader([args.ffmpeg, "-v", "error", "-c:v", "libvpx-vp9", "-i", args.matte, *pick, "-f", "rawvideo", "-pix_fmt", "rgba", "-"], W * H * 4)

acc = np.zeros((H, W, 3), np.float64)
cnt = np.zeros((H, W), np.float64)
kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (31, 31))
n = 0
for i, (a, b) in enumerate(zip(src, mat)):
    rgb = np.frombuffer(a, np.uint8).reshape(H, W, 3)
    alpha = np.frombuffer(b, np.uint8).reshape(H, W, 4)[:, :, 3]
    person = cv2.dilate((alpha > 10).astype(np.uint8), kernel)  # keep hair/motion-blur halos out
    bg = (person == 0).astype(np.float64)
    acc += rgb * bg[:, :, None]
    cnt += bg
    n += 1
if n == 0:
    sys.exit("plate: no frames decoded")

plate = np.zeros((H, W, 3), np.uint8)
seen = cnt > 0
plate[seen] = np.clip(acc[seen] / cnt[seen][:, None], 0, 255).astype(np.uint8)
hole = (~seen).astype(np.uint8)

if hole.any():
    # inpaint at quarter resolution (large holes fill more naturally and much faster), then paste back
    s = 4
    small = cv2.resize(plate, (W // s, H // s), interpolation=cv2.INTER_AREA)
    small_hole = cv2.resize(hole, (W // s, H // s), interpolation=cv2.INTER_NEAREST)
    small_hole = cv2.dilate(small_hole, np.ones((3, 3), np.uint8))
    filled = cv2.inpaint(small, small_hole * 255, 6, cv2.INPAINT_TELEA)
    filled = cv2.GaussianBlur(filled, (0, 0), 1.2)
    big = cv2.resize(filled, (W, H), interpolation=cv2.INTER_CUBIC)
    m = cv2.GaussianBlur(hole.astype(np.float32), (0, 0), 6)[:, :, None]
    m = np.maximum(m, hole[:, :, None].astype(np.float32))
    plate = (plate * (1 - m) + big * m).astype(np.uint8)

cv2.imwrite(str(out / "plate.png"), cv2.cvtColor(plate, cv2.COLOR_RGB2BGR))
cv2.imwrite(str(out / "plate-hole.png"), hole * 255)
print(f"Plate from {n} frames, {hole.mean() * 100:.1f}% inpainted -> {out / 'plate.png'}")
