#!/usr/bin/env python3
"""
CUTOUT — matte the creator ONCE for the whole take, measure the head, bake the vignette.

    python3 scripts/cutout.py <video-folder>                 # mode from brand.json ("quick")
    python3 scripts/cutout.py <video-folder> --mode best     # RVM (needs setup-cutout-best.sh)
    python3 scripts/cutout.py <video-folder> --measure-only  # re-measure an existing matte

Writes, inside the video folder:
    assets/person.webm         the creator with a transparent background (VP9 + alpha)
    assets/recording-vig.mp4   the take with the vignette baked in
    assets/person-vig.webm     the matte with the SAME vignette baked in
    geometry.json              head top / neck / face centre, in source pixels

WHY ONE PASS: matting three spans separately gives three slightly different framings and the
cut reads as broken. Matte the whole take, then every beat uses the same matte.

WHY THE BAKED PAIR: the head is painted back OVER the display type (that occlusion is the
signature move). If the frame under the type is vignetted but the head on top is not, the head
glows. Baking the same gradient into both makes them match to the pixel.

TWO MODES
  quick  `npx hyperframes remove-background` — built in, ~170 MB model downloaded on first use,
         no Python. Per-frame segmentation, so very fine hair can shimmer slightly.
  best   RVM (Robust Video Matting) — a recurrent model, so the edge is temporally stable.
         Needs a ~1 GB Python environment: run scripts/setup-cutout-best.sh once.
"""
import argparse
import json
import os
import pathlib
import re
import shutil
import subprocess
import sys
import tempfile

SKILL = pathlib.Path(__file__).resolve().parent.parent
RVM_PY = pathlib.Path(os.path.expanduser("~/.cache/persa-shorts/rvm_env/bin/python"))


def run(cmd, **kw):
    print("  $", " ".join(str(c) for c in cmd[:6]), "..." if len(cmd) > 6 else "")
    subprocess.run([str(c) for c in cmd], check=True, stdin=subprocess.DEVNULL, **kw)


def duration(p):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                 "-of", "csv=p=0", str(p)], capture_output=True, text=True,
                                stdin=subprocess.DEVNULL).stdout.strip() or 0)


def matte_quick(rec, out):
    print("  $ npx hyperframes remove-background (about 0.1s per frame on a recent laptop) ...")
    r = subprocess.run(["npx", "--yes", "hyperframes", "remove-background", str(rec), "-o", str(out),
                        "--quality", "best", "--json"], capture_output=True, text=True,
                       stdin=subprocess.DEVNULL)
    if r.returncode != 0 or not pathlib.Path(out).exists():
        sys.stderr.write((r.stdout or "")[-1500:] + (r.stderr or "")[-1500:])
        sys.exit("cutout: background removal failed (see above)")


def matte_best(rec, out):
    if not RVM_PY.exists():
        sys.exit("cutout: RVM environment missing — run  bash scripts/setup-cutout-best.sh  first, "
                 "or use --mode quick")
    frames = int(round(duration(rec) * 30)) + 2
    tmp = pathlib.Path(tempfile.mkdtemp(prefix="rvm_"))
    try:
        run([RVM_PY, SKILL / "scripts/rvm-matte.py", "--src", rec, "--out", tmp,
             "--frames", frames, "--haze-floor"])
        run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-framerate", "30", "-i", tmp / "%05d.png",
             "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-auto-alt-ref", "0", "-b:v", "0",
             "-crf", "24", "-row-mt", "1", "-an", out])
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def measure(webm, n=15):
    """Head top, neck and face centre from the matte's own alpha. Never hardcode these."""
    try:
        import numpy as np
        from PIL import Image
    except ImportError:
        sys.exit("cutout: needs numpy + pillow  (python3 -m pip install --user numpy pillow)")
    dur = duration(webm)
    tmp = pathlib.Path(tempfile.mkdtemp(prefix="alpha_"))
    tops, necks, cxs = [], [], []
    try:
        for k in range(n):
            ts = dur * (k + 0.5) / n
            p = tmp / f"{k:03d}.png"
            # libvpx-vp9 must be named as the DECODER, or ffmpeg's native vp9 drops the alpha
            subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-c:v", "libvpx-vp9",
                            "-ss", f"{ts:.2f}", "-i", str(webm), "-frames:v", "1",
                            "-vf", "alphaextract", str(p)], check=True)
            a = np.asarray(Image.open(p).convert("L"))
            widths = (a > 128).sum(axis=1)
            solid = np.flatnonzero(widths > 8)
            if solid.size == 0:
                continue
            top = int(solid[0])
            tops.append(top)
            band = widths[top: top + max(1, (len(widths) - top) // 3)]
            band = band[band > 0]
            if band.size:
                head_w = float(np.median(band))
                below = np.flatnonzero(widths[top:] > head_w * 1.6)
                if below.size:
                    necks.append(int(top + below[0]))
            rows = a[top: top + 200] > 128
            xs = np.flatnonzero(rows.any(axis=0))
            if xs.size:
                cxs.append(float(xs.mean()))
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    if not tops:
        sys.exit("cutout: the matte is empty — is the creator in frame?")
    tops.sort(); necks.sort(); cxs.sort()
    head_top = tops[len(tops) // 2]
    neck = necks[len(necks) // 2] if necks else head_top + 450
    return {"head_top": head_top, "neck": neck, "mid_head": (head_top + neck) // 2,
            "face_cx": round(cxs[len(cxs) // 2]) if cxs else 540, "samples": len(tops)}


def vignette_png(vd, path):
    """The same gradient as tokens.css --vig, as a 1080x1920 RGBA image."""
    from PIL import Image
    css = (vd / "tokens.css").read_text()
    a0 = float(re.search(r"--vig-a0:([\d.]+)", css).group(1))
    a1 = float(re.search(r"--vig-a1:([\d.]+)", css).group(1))
    m = re.search(r"--vig:linear-gradient\(180deg,rgba\((\d+),(\d+),(\d+)", css)
    rgb = tuple(int(x) for x in m.groups()) if m else (12, 9, 8)
    col = Image.new("RGBA", (1, 1920), rgb + (0,))
    px = col.load()
    for y in range(1080):
        f = y / 1080
        a = a0 + (a1 - a0) * (f / 0.46) if f <= 0.46 else a1 * (1 - (f - 0.46) / 0.54)
        px[0, y] = rgb + (int(round(255 * max(0.0, a))),)
    col.resize((1080, 1920), Image.NEAREST).save(path)


def bake(vd):
    rec, person = vd / "assets/recording.mp4", vd / "assets/person.webm"
    grad = vd / "assets/.vignette.png"
    vignette_png(vd, grad)
    run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", rec, "-i", grad, "-filter_complex",
         "[0:v][1:v]overlay=0:0:format=auto,format=yuv420p", "-c:v", "libx264", "-crf", "17",
         "-g", "30", "-an", vd / "assets/recording-vig.mp4"])
    run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-c:v", "libvpx-vp9", "-i", person, "-i", grad,
         "-filter_complex",
         "[0:v]format=yuva420p,split[c][a];[a]alphaextract[al];[c]format=yuv420p[rgb];"
         "[rgb][1:v]overlay=0:0:format=auto[ov];[ov][al]alphamerge,format=yuva420p",
         "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-auto-alt-ref", "0", "-b:v", "0",
         "-crf", "24", "-row-mt", "1", "-an", vd / "assets/person-vig.webm"])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video_dir")
    ap.add_argument("--mode", choices=["quick", "best"])
    ap.add_argument("--measure-only", action="store_true")
    ap.add_argument("--no-bake", action="store_true")
    a = ap.parse_args()

    vd = pathlib.Path(os.path.expanduser(a.video_dir)).resolve()
    brand = json.loads((vd / "brand.json").read_text()) if (vd / "brand.json").exists() else {}
    mode = a.mode or brand.get("cutout", "quick")
    if mode == "off":
        sys.exit("cutout: brand.json has the cut-out OFF. Pass --mode quick|best to run it anyway.")
    rec, person = vd / "assets/recording.mp4", vd / "assets/person.webm"
    if not rec.exists():
        sys.exit(f"cutout: no {rec} — run new-video.py with --recording first")

    if not a.measure_only:
        print(f"cutout: matting the whole take ({mode}) — {duration(rec):.1f}s")
        (matte_quick if mode == "quick" else matte_best)(rec, person)
    geo = measure(person)
    (vd / "geometry.json").write_text(json.dumps(geo, indent=2) + "\n")
    print(f"cutout: head top y={geo['head_top']}  mid-head y={geo['mid_head']}  neck y={geo['neck']}  "
          f"face x={geo['face_cx']}  ({geo['samples']} samples)")
    if geo["face_cx"] < 380 or geo["face_cx"] > 700:
        print("cutout: WARNING the creator sits well off-centre; the camera card will crop them. "
              "Re-frame centred for this style if you can.")
    if not a.no_bake:
        bake(vd)
        print("cutout: baked the vignette into recording-vig.mp4 + person-vig.webm")
    print("cutout: done. LOOK at a frame before building:  python3 <skill>/scripts/contact-sheet.py "
          f"{person} --alpha")


if __name__ == "__main__":
    main()
