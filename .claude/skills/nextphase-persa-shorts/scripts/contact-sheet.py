#!/usr/bin/env python3
"""
CONTACT-SHEET — LOOK at a rendered mp4 (or a matte) before calling anything done.

    python3 scripts/contact-sheet.py out/visual.mp4                 # 12 frames, evenly spaced
    python3 scripts/contact-sheet.py out/visual.mp4 --at 2.5,6.2,14 # exact instants (beat middles)
    python3 scripts/contact-sheet.py assets/person.webm --alpha     # the matte on a checkerboard

Writes <video>.sheet.jpg next to the video and prints its path. Then open/read the image.
The preview path and the render path disagree; a snapshot of the composition is not evidence.
Only the rendered file is.
"""
import argparse
import os
import pathlib
import subprocess
import sys
import tempfile


def dur(p):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                 "-of", "csv=p=0", str(p)], capture_output=True, text=True,
                                stdin=subprocess.DEVNULL).stdout.strip() or 0)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--n", type=int, default=12)
    ap.add_argument("--at", help="comma-separated seconds")
    ap.add_argument("--alpha", action="store_true", help="composite a VP9-alpha webm on a checkerboard")
    ap.add_argument("--cols", type=int, default=6)
    a = ap.parse_args()
    try:
        from PIL import Image, ImageDraw
    except ImportError:
        sys.exit("needs pillow:  python3 -m pip install --user pillow")
    v = pathlib.Path(a.video)
    D = dur(v)
    times = [float(x) for x in a.at.split(",")] if a.at else [D * (k + 0.5) / a.n for k in range(a.n)]
    tmp = pathlib.Path(tempfile.mkdtemp())
    tiles = []
    for i, t in enumerate(times):
        p = tmp / f"{i:03d}.png"
        pre = ["-c:v", "libvpx-vp9"] if a.alpha else []
        subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", *pre, "-ss", f"{t:.3f}", "-i", str(v),
                        "-frames:v", "1", "-vf", "scale=270:-2", str(p)], check=True)
        im = Image.open(p).convert("RGBA")
        if a.alpha:
            bg = Image.new("RGBA", im.size, (200, 200, 200, 255))
            dr = ImageDraw.Draw(bg)
            for y in range(0, im.size[1], 16):
                for x in range(0, im.size[0], 16):
                    if (x // 16 + y // 16) % 2:
                        dr.rectangle([x, y, x + 15, y + 15], fill=(140, 140, 140, 255))
            im = Image.alpha_composite(bg, im)
        dr = ImageDraw.Draw(im)
        dr.rectangle([0, 0, 74, 22], fill=(0, 0, 0, 200))
        dr.text((5, 4), f"{t:6.2f}s", fill=(255, 255, 255, 255))
        tiles.append(im.convert("RGB"))
    w, h = tiles[0].size
    cols = min(a.cols, len(tiles))
    rows = (len(tiles) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * w + (cols + 1) * 6, rows * h + (rows + 1) * 6), (20, 20, 20))
    for i, im in enumerate(tiles):
        sheet.paste(im, (6 + (i % cols) * (w + 6), 6 + (i // cols) * (h + 6)))
    out = v.with_suffix(v.suffix + ".sheet.jpg")
    sheet.save(out, quality=88)
    print(out)


if __name__ == "__main__":
    main()
