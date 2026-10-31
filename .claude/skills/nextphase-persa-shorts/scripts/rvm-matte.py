#!/usr/bin/env python
"""
RVM (Robust Video Matting) person segmentation -> BGRA PNG frames with alpha.
Called by cutout.py --mode best. Runs inside the optional environment made by
scripts/setup-cutout-best.sh (~/.cache/persa-shorts/rvm_env).

Why RVM for the "best" mode: its recurrent state is passed from frame to frame, which is what
kills edge flicker. A per-frame segmenter re-decides every hair on every frame; RVM remembers.

    ~/.cache/persa-shorts/rvm_env/bin/python scripts/rvm-matte.py --src in.mp4 --out frames/ --frames 900

Measured on a real 1080x1920 take: downsample 0.4 is the cleanest. 0.25 is ~7x WORSE (more haze
above the hair), not sharper — do not "upgrade" it without measuring.
"""
import argparse, os, sys, time


def main():
    p = argparse.ArgumentParser(description="RVM matte a clip to BGRA PNG frames")
    p.add_argument("--src", required=True)
    p.add_argument("--out", required=True)
    p.add_argument("--frames", type=int, default=150)
    p.add_argument("--start", type=int, default=0)
    p.add_argument("--downsample", type=float, default=0.4)
    p.add_argument("--warmup", type=int, default=2,
                   help="throwaway passes over frame 0 to prime the recurrent state")
    p.add_argument("--device", default="cpu", choices=["cpu", "mps", "cuda"])
    p.add_argument("--variant", default="mobilenetv3", choices=["mobilenetv3", "resnet50"])
    p.add_argument("--haze-floor", action="store_true",
                   help="floor the ~0.06 alpha haze RVM leaves above the hair, so the plate "
                        "does not show through the curls")
    a = p.parse_args()

    import cv2, torch, numpy as np

    os.makedirs(a.out, exist_ok=True)
    model = torch.hub.load("PeterL1n/RobustVideoMatting", a.variant, trust_repo=True).eval()
    dev = torch.device(a.device)
    model = model.to(dev)

    cap = cv2.VideoCapture(a.src)
    if not cap.isOpened():
        sys.exit(f"rvm-matte: cannot open {a.src}")
    if a.start:
        cap.set(cv2.CAP_PROP_POS_FRAMES, a.start)

    def to_tensor(frame):
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        return torch.from_numpy(rgb).permute(2, 0, 1).float().unsqueeze(0).div(255.0).to(dev)

    ok, first = cap.read()
    if not ok:
        sys.exit("rvm-matte: could not read a first frame")
    rec = [None] * 4
    with torch.no_grad():
        for _ in range(max(0, a.warmup)):
            _, _, *rec = model(to_tensor(first), *rec, downsample_ratio=a.downsample)

    frame, i, t0 = first, 0, time.time()
    with torch.no_grad():
        while i < a.frames:
            fgr, pha, *rec = model(to_tensor(frame), *rec, downsample_ratio=a.downsample)
            al = pha[0, 0].cpu().numpy()
            if a.haze_floor:
                al = np.clip((al - 0.18) / 0.82, 0, 1) ** 0.85
            alpha = (al * 255).clip(0, 255).astype(np.uint8)
            bgra = cv2.cvtColor(frame, cv2.COLOR_BGR2BGRA)
            bgra[:, :, 3] = alpha
            cv2.imwrite(os.path.join(a.out, f"{i:05d}.png"), bgra)
            i += 1
            if i % 60 == 0:
                print(f"  {i}/{a.frames} frames  ({(time.time() - t0) / i:.2f}s/frame)", flush=True)
            ok, frame = cap.read()          # sequential only — RVM depends on frame order
            if not ok:
                break
    cap.release()
    print(f"rvm-matte: wrote {i} frames -> {a.out}  ({time.time() - t0:.0f}s)")


if __name__ == "__main__":
    main()
