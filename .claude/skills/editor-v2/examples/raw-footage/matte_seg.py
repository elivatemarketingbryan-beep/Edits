#!/usr/bin/env python3
"""matte_seg.py <seg>: cuts the person out of a pulled shot, frame by frame (Robust Video Matting). Writes work/seg/<seg>/alpha/<n>.png"""
import glob, os, sys
import cv2, numpy as np, torch
R = os.environ.get("EDITOR_PROJECT") or os.getcwd()
name = sys.argv[1]
files = sorted(glob.glob(f"{R}/work/seg/{name}/*.jpg"))
os.makedirs(f"{R}/work/seg/{name}/alpha", exist_ok=True)
dev = "mps" if torch.backends.mps.is_available() else "cpu"
model = torch.hub.load("PeterL1n/RobustVideoMatting", "mobilenetv3", trust_repo=True, verbose=False).eval().to(dev)
rec = [None] * 4
with torch.no_grad():
    for k, f in enumerate(files):
        x = torch.from_numpy(cv2.imread(f)[..., ::-1].copy()).to(dev).permute(2, 0, 1)[None].float() / 255
        for _ in range(3 if k == 0 else 1):
            _, pha, *rec = model(x, *rec, downsample_ratio=.6)
        cv2.imwrite(f"{R}/work/seg/{name}/alpha/{k:04d}.png", (pha[0, 0].clamp(0, 1).cpu().numpy() * 255 + .5).astype(np.uint8))
print("matted", len(files))
