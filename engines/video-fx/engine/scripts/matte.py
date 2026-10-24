#!/usr/bin/env python3
"""Cut the person out of a video (Robust Video Matting, runs locally on CPU).

Writes, next to each other in the job folder:
  matte.webm     the source video with an alpha channel (person opaque, background clear)
  subject.json   where the person sits in frame (per-frame box + clip-wide summary)
  contours.json  (with --contours) the person's outline as polygons, one list per frame

Decoding and encoding go through the ffmpeg binary passed with --ffmpeg, so this
script never imports a second copy of libav.
"""
import argparse
import json
import subprocess
import sys
import time
from pathlib import Path

import numpy as np

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--input", required=True, help="normalized source.mp4")
parser.add_argument("--outdir", required=True)
parser.add_argument("--ffmpeg", required=True)
parser.add_argument("--model", required=True, help="rvm_mobilenetv3_fp32.onnx")
parser.add_argument("--width", type=int, required=True)
parser.add_argument("--height", type=int, required=True)
parser.add_argument("--fps", type=float, required=True)
parser.add_argument("--downsample", type=float, default=0.3)
parser.add_argument("--contours", action="store_true")
parser.add_argument("--coreml", action="store_true", help="try the CoreML provider (macOS)")
args = parser.parse_args()

import onnxruntime as ort  # noqa: E402

outdir = Path(args.outdir)
outdir.mkdir(parents=True, exist_ok=True)
W, H = args.width, args.height

providers = ["CPUExecutionProvider"]
if args.coreml and "CoreMLExecutionProvider" in ort.get_available_providers():
    providers = ["CoreMLExecutionProvider", "CPUExecutionProvider"]
opts = ort.SessionOptions()
opts.log_severity_level = 3
sess = ort.InferenceSession(args.model, sess_options=opts, providers=providers)

decoder = subprocess.Popen(
    [args.ffmpeg, "-v", "error", "-i", args.input, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
    stdout=subprocess.PIPE,
)
encoder = subprocess.Popen(
    [
        args.ffmpeg, "-v", "error", "-y",
        "-f", "rawvideo", "-pix_fmt", "rgba", "-s", f"{W}x{H}", "-r", str(args.fps), "-i", "-",
        "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "0", "-crf", "18",
        "-deadline", "good", "-cpu-used", "4", "-row-mt", "1", "-auto-alt-ref", "0",
        str(outdir / "matte.webm"),
    ],
    stdin=subprocess.PIPE,
)

cv2 = None
if args.contours:
    import cv2  # noqa: E402  (only needed for outlines)

rec = [np.zeros([1, 1, 1, 1], dtype=np.float32)] * 4
ratio = np.array([args.downsample], dtype=np.float32)
frame_bytes = W * H * 3
boxes, contours = [], []
n = 0
t0 = time.time()
while True:
    buf = decoder.stdout.read(frame_bytes)
    if len(buf) < frame_bytes:
        break
    rgb = np.frombuffer(buf, dtype=np.uint8).reshape(H, W, 3)
    src = (rgb.astype(np.float32) / 255.0).transpose(2, 0, 1)[None]
    fgr, pha, *rec = sess.run(None, {"src": src, "r1i": rec[0], "r2i": rec[1], "r3i": rec[2], "r4i": rec[3], "downsample_ratio": ratio})
    alpha = np.clip(pha[0, 0], 0, 1)
    a8 = (alpha * 255 + 0.5).astype(np.uint8)
    encoder.stdin.write(np.dstack([rgb, a8]).tobytes())

    mask = a8 > 127
    ys = np.where(mask.any(axis=1))[0]
    xs = np.where(mask.any(axis=0))[0]
    if len(ys) and len(xs):
        boxes.append([int(xs[0]), int(ys[0]), int(xs[-1]), int(ys[-1]), round(float(mask.mean()), 4)])
    else:
        boxes.append(None)

    if cv2 is not None:
        m = cv2.GaussianBlur(a8, (0, 0), 2)
        _, m = cv2.threshold(m, 127, 255, cv2.THRESH_BINARY)
        found, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        polys = []
        for c in sorted(found, key=cv2.contourArea, reverse=True)[:4]:
            if cv2.contourArea(c) < 0.004 * W * H:
                continue
            c = cv2.approxPolyDP(c, 2.5, True).reshape(-1, 2)
            polys.append(c.flatten().tolist())
        contours.append(polys)

    n += 1
    if n % 60 == 0:
        print(f"  matted {n} frames ({n / (time.time() - t0):.1f} fps)", flush=True)

decoder.stdout.close()
decoder.wait()
encoder.stdin.close()
if encoder.wait() != 0:
    sys.exit("ffmpeg failed while writing matte.webm")
if n == 0:
    sys.exit("No frames were decoded from the input")


def summary(bs):
    good = [b for b in bs if b]
    if not good:
        return None
    arr = np.array([b[:4] for b in good], dtype=np.float32)
    med = np.median(arr, axis=0)
    top = float(np.percentile(arr[:, 1], 10))  # highest the head gets (small y)
    return {
        "box": [round(float(v)) for v in med],
        "centerX": round(float((med[0] + med[2]) / 2)),
        "headTop": round(top),
        # rough head centre: the head is about the top 1/8 of a seated/standing figure's
        # visible height, capped for close-up talking heads
        "headY": round(top + min((med[3] - top) * 0.18, H * 0.11)),
        "coverage": round(float(np.median([b[4] for b in good])), 4),
    }

(outdir / "subject.json").write_text(json.dumps({
    "width": W, "height": H, "fps": args.fps, "frames": n,
    "summary": summary(boxes),
    "boxes": boxes,
}) + "\n")
if cv2 is not None:
    (outdir / "contours.json").write_text(json.dumps({
        "width": W, "height": H, "fps": args.fps, "frames": contours,
    }) + "\n")
print(f"Matted {n} frames in {time.time() - t0:.1f}s -> {outdir / 'matte.webm'}")
