#!/usr/bin/env python3
"""
NEW-VIDEO — scaffold one persa short as its own HyperFrames project.

    python3 scripts/new-video.py <slug> --recording /path/to/take.mov
    python3 scripts/new-video.py <slug>                       # folder only, add the take later

Creates <videos_dir>/<slug>/ (videos_dir from brand.json, default ~/persa-shorts):

    build.py  hyperframes.json  beats.json (a stub)  PLAN.md
    tokens.css  persa-roles.css  grade-persa.svg  brand.json   <- COPIES, so the folder renders alone
    assets/recording.mp4   the take, normalised: 1080x1920, 30fps CFR, h264 + AAC 48k
    assets/{pages,ui,broll,brand}/   out/

Each video folder is its own project root: HyperFrames refuses paths that climb out of it
(../assets), which is why the shared files are copied in rather than linked from the skill.
"""
import argparse
import json
import os
import pathlib
import shutil
import subprocess
import sys

SKILL = pathlib.Path(__file__).resolve().parent.parent


def run(cmd):
    subprocess.run(cmd, check=True, stdin=subprocess.DEVNULL)


def probe(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                          "stream=width,height,r_frame_rate,avg_frame_rate:stream_side_data=rotation"
                          ":stream_tags=rotate:format=duration", "-of", "json", str(path)],
                         capture_output=True, text=True, stdin=subprocess.DEVNULL).stdout
    return json.loads(out or "{}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("slug")
    ap.add_argument("--recording", help="the raw take (any format ffmpeg reads)")
    ap.add_argument("--dir", help="override videos_dir from brand.json")
    ap.add_argument("--force", action="store_true", help="refresh template files in an existing folder")
    a = ap.parse_args()

    brand = json.loads((SKILL / "brand/brand.json").read_text())
    if not brand.get("setup_complete"):
        print("note: brand.json is not set up yet — run the setup questions (SKILL.md step 0) first.")
    root = pathlib.Path(os.path.expanduser(a.dir or brand.get("videos_dir") or "~/persa-shorts"))
    vd = root / a.slug
    vd.mkdir(parents=True, exist_ok=True)
    for sub in ("assets/pages", "assets/ui", "assets/broll", "assets/brand", "out"):
        (vd / sub).mkdir(parents=True, exist_ok=True)

    # shared files — copied, so the project renders on its own
    copies = {
        SKILL / "template/build.py": vd / "build.py",
        SKILL / "template/hyperframes.json": vd / "hyperframes.json",
        SKILL / "assets/tokens.css": vd / "tokens.css",
        SKILL / "components/persa-roles.css": vd / "persa-roles.css",
        SKILL / "components/grade-persa.svg": vd / "grade-persa.svg",
    }
    for src, dst in copies.items():
        if a.force or not dst.exists():
            shutil.copy2(src, dst)
    # brand snapshot, plus the display advance the build uses to fit words
    adv = 0.50
    for line in (SKILL / "assets/tokens.css").read_text().splitlines():
        if "--display-advance:" in line:
            adv = float(line.split(":")[1].split(";")[0])
    snap = dict(brand, display_advance=adv)
    (vd / "brand.json").write_text(json.dumps(snap, indent=2) + "\n")

    if not (vd / "beats.json").exists():
        (vd / "beats.json").write_text(json.dumps({
            "_readme": "Fill this from the transcript. See the skill's template/beats.example.json.",
            "fixes": {}, "beats": []}, indent=2) + "\n")
    if not (vd / "PLAN.md").exists():
        (vd / "PLAN.md").write_text(
            f"# {a.slug}\n\nSTYLE: persa (9:16)\n\n## The demo spine\n(which real product, which "
            f"15s+ of it, and where the recording comes from)\n\n## Beat map\n| t | line | kind | "
            f"what is on screen | real source |\n|---|---|---|---|---|\n\n## Facts to verify\n\n"
            f"## Rights to flag\n")

    if a.recording:
        src = pathlib.Path(os.path.expanduser(a.recording))
        if not src.exists():
            sys.exit(f"new-video: no such file {src}")
        info = probe(src)
        st = (info.get("streams") or [{}])[0]
        w, h = int(st.get("width", 0)), int(st.get("height", 0))
        rot = 0
        for sd in st.get("side_data_list", []) or []:
            if "rotation" in sd:
                rot = abs(int(sd["rotation"]))
        if rot in (90, 270):
            w, h = h, w
        if w > h:
            print(f"WARNING: the take is landscape ({w}x{h}). A short is 9:16 — it will be centre-"
                  f"cropped to vertical, which keeps only the middle {h * 9 // 16}px of width. "
                  f"Re-shoot vertical if the creator is not centred.")
        out = vd / "assets/recording.mp4"
        # scale to COVER 1080x1920, centre-crop, 30fps CFR, even GOP so the renderer can seek
        vf = ("scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,"
              "fps=30,format=yuv420p")
        run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", str(src), "-vf", vf, "-r", "30", "-c:v", "libx264", "-crf", "17", "-preset", "medium", "-g", "30",
             "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
             "-movflags", "+faststart", str(out)])
        dur = float(probe(out).get("format", {}).get("duration", 0))
        print(f"assets/recording.mp4  1080x1920 30fps  {dur:.2f}s")

    print(f"\nvideo folder: {vd}")
    print("next: transcribe.py → (cutout.py) → (make-grade-filter.py --derive) → beats.json → build.py")


if __name__ == "__main__":
    main()
