#!/usr/bin/env python3
"""make-preview.py — a 13-second theme preview, no recording needed.

    python3 <skill>/scripts/make-preview.py                 # -> ~/nextphase-screenshare/previews/...
    python3 <skill>/scripts/make-preview.py --out ~/Desktop/my-preview
    python3 <skill>/scripts/make-preview.py --no-open

It runs the REAL pipeline end to end on a stand-in camera (a drawn silhouette,
since there is no recording yet): new-video.sh -> a played screen share
(demos/make_demos.py) -> build.py -> render -> a contact sheet. So when it
works, the whole toolchain works.

    0.0-2.0    FULL     the camera, full frame, white caption
    2.0-5.0    HALF     camera card + a played screen share opening a site
    5.0-9.5    CORNER   camera parked in the corner, the same share typing about your niche
    9.5-12.0   HALF     the camera swaps sides; a callout in your accent / win colours
    12.0-13.5  FULL     back to the camera

Writes <out>/preview.mp4 and <out>/preview-sheet.jpg and opens both.
"""
import argparse, json, os, re, shutil, subprocess, sys, textwrap

HERE = os.path.dirname(os.path.abspath(__file__))
SK = os.path.normpath(os.path.join(HERE, ".."))


def run(cmd, **kw):
    print("  $ " + (cmd if isinstance(cmd, str) else " ".join(cmd))[:160])
    return subprocess.run(cmd, check=True, **kw)


def hf(*args):
    v = os.environ.get("HF_VERSION", "0.8.145")
    return ["npx", "-y", "hyperframes@%s" % v] + list(args)


def esc(s):
    return (str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))


def stand_in_camera(path, seconds=14):
    """A soft wall with a person-shaped silhouette, 30fps, silent audio track."""
    still = path + ".png"
    # wall: warm grey, brighter on the left (window light); figure: head + shoulders
    geq = ("r='if(lt(hypot(X-1000,Y-430),150)+lt(hypot((X-1000)/1.9,(Y-1160)/1.15),330),58,"
           "150+40*(1-X/W)-18*(Y/H))':"
           "g='if(lt(hypot(X-1000,Y-430),150)+lt(hypot((X-1000)/1.9,(Y-1160)/1.15),330),62,"
           "146+38*(1-X/W)-18*(Y/H))':"
           "b='if(lt(hypot(X-1000,Y-430),150)+lt(hypot((X-1000)/1.9,(Y-1160)/1.15),330),70,"
           "138+30*(1-X/W)-18*(Y/H))'")
    run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", "color=c=black:s=1920x1080:d=1",
         "-vf", "format=rgb24,geq=" + geq + ",gblur=sigma=2", "-frames:v", "1", still])
    run(["ffmpeg", "-v", "error", "-y", "-loop", "1", "-i", still,
         "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo",
         "-t", str(seconds), "-r", "30", "-c:v", "libx264", "-preset", "veryfast",
         "-crf", "20", "-g", "30", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", path])
    os.remove(still)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=None)
    ap.add_argument("--no-open", action="store_true")
    a = ap.parse_args()

    brand = json.load(open(os.path.join(SK, "brand", "brand.json")))
    tag = "%s-%s" % (brand.get("ground", "bright"),
                     re.sub(r"[^a-z0-9]", "", str(brand.get("accent", "blue")).lower()))
    out = os.path.abspath(os.path.expanduser(a.out or os.path.join(
        "~", "nextphase-screenshare", "previews", "theme-" + tag)))
    if os.path.exists(out):
        shutil.rmtree(out)
    parent, name = os.path.dirname(out), os.path.basename(out)
    os.makedirs(parent, exist_ok=True)

    tmpcam = out + "-cam.mp4"
    stand_in_camera(tmpcam)
    run(["bash", os.path.join(SK, "scripts", "new-video.sh"), tmpcam, name, "--dir", parent],
        stdout=subprocess.DEVNULL)
    os.remove(tmpcam)
    shutil.copy(os.path.join(out, "assets", "recording.mp4"), os.path.join(out, "assets", "cam.mp4"))

    niche = (brand.get("niche") or "your niche").strip()
    # a caption is 2-6 words and never shrinks: keep the niche to whole words
    # under ~20 characters, and never end it on a weak word
    short, n = [], 0
    for w in niche.split():
        if n + len(w) > 20 and short:
            break
        short.append(w); n += len(w) + 1
    while len(short) > 1 and short[-1].lower() in ("for", "and", "of", "the", "to", "in", "on", "with", "a"):
        short.pop()
    niche_short = " ".join(short)
    channel = (brand.get("channel") or "your channel").strip()
    handle = (brand.get("handle") or "").strip().lstrip("@")
    site = (re.sub(r"[^a-z0-9]", "", (handle or channel).lower()) or "yourapp")[:18] + ".com"

    # the played screen share: a rebuilt browser types about the niche
    demo_py = os.path.join(out, "demos", "make_demos.py")
    src = open(demo_py).read()
    src = src.replace('if __name__ == "__main__":', textwrap.dedent('''
        OPEN.update({"dur": 7.5, "url": %r, "app": %r, "tab": "New Tab",
                     "prompt": %r, "url_cps": 24, "prompt_cps": 34,
                     "answer": ["1. The hook", "2. The three steps", "3. The proof"]})
        if __name__ == "__main__":''') % (site, channel[:24], ("Plan a video about " + niche)[:52]), 1)
    src = src.replace("    d2_editor()\n", "")
    open(demo_py, "w").write(src)
    run([sys.executable, demo_py])
    run(["bash", os.path.join(SK, "scripts", "render-demos.sh"), out, "d1-open"])

    # the beat list
    spec = textwrap.dedent('''
        from devices import panel, compare
        SEGMENTS = [{"name": "seg-01-preview", "t0": 0.0, "t1": 13.5}]
        HALF = dict(); DEMO = dict(box_w=1480, box_h=740)
        def B(t0, t1, cam, make=None, **kw):
            d = {"t0": t0, "t1": t1, "cam": cam, "make": make}; d.update(kw); return d
        def demo(src, **box):
            return lambda u, c: panel(u, src, None, ctx=c, loop=False, **box)
        BEATS = [
          B(0.0, 2.0, "FULL"),
          B(2.0, 5.0, "HALF", demo("d1-open.mp4", **HALF)),
          B(5.0, 9.5, "CORNER", demo("d1-open.mp4", **DEMO), media_start=3.0),
          B(9.5, 12.0, "HALF", lambda u, c: compare(u, ("16%", "full-frame camera", "live"),
                                                      ("39%", "half screen", "win"), at_right=0.9)),
          B(12.0, 13.5, "FULL"),
        ]
    ''')
    open(os.path.join(out, "spec.py"), "w").write(spec)

    f = lambda t: int(round(t * 30))
    caps = [
        {"text": "This is %s" % esc(channel), "in": f(0.25), "out": f(1.85)},
        {"text": "your <span class=\"live\">%s</span> videos" % esc(niche_short), "in": f(2.6), "out": f(4.8)},
        {"text": "as a screen share", "in": f(5.6), "out": f(7.2)},
        {"text": "<span class=\"win\">real</span> UI on screen", "in": f(7.4), "out": f(9.3)},
        {"text": "the layout keeps moving", "in": f(10.1), "out": f(11.8)},
        {"text": "in your colours", "in": f(12.6), "out": f(13.4)},
    ]
    json.dump(caps, open(os.path.join(out, "assets", "captions.json"), "w"), indent=1)

    run([sys.executable, os.path.join(out, "build.py")], cwd=out)
    run(["bash", os.path.join(SK, "scripts", "check-screenshare.sh"), out])
    run(hf("render", os.path.join(out, "seg-01-preview"), "-o",
           os.path.join(out, "preview.mp4"), "-q", "draft", "--quiet"))

    sheet = os.path.join(out, "preview-sheet.jpg")
    run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(out, "preview.mp4"),
         "-vf", "select='eq(n\\,30)+eq(n\\,105)+eq(n\\,250)+eq(n\\,330)',scale=960:-2,tile=2x2:padding=8:color=black",
         "-frames:v", "1", "-fps_mode", "vfr", sheet])
    print("\npreview: %s\nsheet:   %s" % (os.path.join(out, "preview.mp4"), sheet))
    if not a.no_open:
        opener = "open" if sys.platform == "darwin" else "xdg-open"
        for p in (sheet, os.path.join(out, "preview.mp4")):
            subprocess.run([opener, p], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


if __name__ == "__main__":
    main()
