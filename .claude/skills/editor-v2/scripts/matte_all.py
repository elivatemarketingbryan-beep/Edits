#!/usr/bin/env python3
"""matte_all.py <project>: cuts the person out of every source frame the voice cut uses (Robust Video Matting, local). Writes
work/matte/<source_frame>.png at 1280x720. This is what lets a hold sit on white, on black or on a glow with no generation."""
import json, os, subprocess, sys
import cv2
import numpy as np
import torch

ROOT = sys.argv[1]
os.chdir(ROOT)
FPS, W, H = 30, 1920, 1080
cfg = json.load(open("cut.json"))
tl = json.load(open("work/timeline.json"))
os.makedirs("work/matte", exist_ok=True)
dev = "mps" if torch.backends.mps.is_available() else "cpu"
model = torch.hub.load("PeterL1n/RobustVideoMatting", "mobilenetv3", trust_repo=True, verbose=False).eval().to(dev)
done = 0
for ln in tl["lines"]:
    for p in ln["pieces"]:
        a, b = p["s0"], p["s1"] + .7
        dec = subprocess.Popen(["ffmpeg", "-nostdin", "-v", "error", "-ss", f"{a:.4f}", "-i", cfg["source"], "-t", f"{b - a:.3f}", "-r", str(FPS), "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
        rec, k = [None] * 4, 0
        with torch.no_grad():
            while True:
                buf = dec.stdout.read(W * H * 3)
                if len(buf) < W * H * 3:
                    break
                x = torch.from_numpy(np.frombuffer(buf, np.uint8).reshape(H, W, 3).copy()).to(dev).permute(2, 0, 1)[None].float() / 255
                for _ in range(3 if k == 0 else 1):
                    _, pha, *rec = model(x, *rec, downsample_ratio=.3)
                fi = int(round(a * FPS)) + k
                f = f"work/matte/{fi}.png"
                if not os.path.exists(f):
                    al = pha[0, 0].clamp(0, 1).cpu().numpy()
                    cv2.imwrite(f, cv2.resize((al * 255 + .5).astype(np.uint8), (1280, 720), interpolation=cv2.INTER_AREA))
                    done += 1
                k += 1
        dec.wait()
print("matted", done, "frames on", dev)
