#!/usr/bin/env python3
"""
MAKE-PREVIEW — an 8-second 9:16 theme preview from the brand alone. No recording needed.

    scripts/py scripts/make-preview.py                 # build + render + contact sheet
    scripts/py scripts/make-preview.py --open          # ...and open the mp4
    scripts/py scripts/make-preview.py --out ~/Desktop/preview --no-render

It shows every role in the creator's colours and fonts, over a stand-in "photograph" (a
procedural room and a silhouette, because there is no footage yet):

    0.0-2.4  the title stack      pill · designed mark · marker line · payoff word
    2.4-4.4  the outline words    a white word, then the emphasis-accent word, BEHIND the head
    4.4-6.6  a UI owns the frame  the camera card, the head breaking its edge, a claim in the gutter
    6.6-8.0  the CTA              comment + the keyword + a drawn arrow
    always   the caption          one word at a time on the 72.9% line

It is a palette check, not an edit: real footage behaves differently, which is why the first
real render is sampled too.
"""
import argparse
import html
import json
import os
import pathlib
import platform
import shutil
import subprocess
import sys

SKILL = pathlib.Path(__file__).resolve().parent.parent


def esc(s):
    return html.escape(str(s), quote=True)


def silhouette(gid, light):
    a, b = ("#5E5047", "#2C241F") if light else ("#2B221D", "#0F0B09")
    return (f'<svg viewBox="0 0 1080 1920" width="1080" height="1920" aria-hidden="true">'
            f'<defs><linearGradient id="{gid}" x1="0" y1="0" x2="0" y2="1">'
            f'<stop offset="0" stop-color="{a}"/><stop offset="1" stop-color="{b}"/></linearGradient></defs>'
            f'<path fill="url(#{gid})" d="M540 600 C640 600 705 680 705 795 C705 895 668 975 612 1018 '
            f'L612 1092 C790 1125 930 1210 975 1360 L1020 1920 L60 1920 L105 1360 C150 1210 290 1125 468 1092 '
            f'L468 1018 C412 975 375 895 375 795 C375 680 440 600 540 600 Z"/></svg>')


def build(brand, out):
    c = brand.get("creator", {})
    light = brand.get("look") == "bright"
    handle = c.get("handle") or "@yourhandle"
    niche = (c.get("niche") or "your niche").strip()
    kw = (c.get("cta_keyword") or "GUIDE").upper()[:10]
    initial = (c.get("name") or handle.lstrip("@") or "N")[:1].upper()
    line = "for"
    for w in niche.split():
        if len(line) + 1 + len(w) > 22:
            break
        line += " " + w
    words_ = line.split()
    while len(words_) > 2 and words_[-1].lower() in ("in", "for", "of", "the", "and", "to", "a", "an",
                                                     "with", "on", "at"):
        words_.pop()
    line = " ".join(words_)
    grade = brand.get("grade", "film") == "film"
    g = ' class="graded"' if grade else ""
    adv = 0.50
    for ln in (SKILL / "assets/tokens.css").read_text().splitlines():
        if "--display-advance:" in ln:
            adv = float(ln.split(":")[1].split(";")[0])

    def fit(word, cap=290, box=940):
        return max(60, min(cap, int(box / (adv * max(1, len(word))))))

    def clip(cls, s, d, inner="", style="", tr=[20]):
        tr[0] += 1
        st = f' style="{style}"' if style else ""
        return (f'<div class="clip {cls}" data-start="{s:.2f}" data-duration="{d:.2f}" '
                f'data-track-index="{tr[0]}"{st}>{inner}</div>')

    words = ("THIS IS YOUR LOOK ONE WORD AT A TIME ON ONE LINE THAT NEVER MOVES SO THE EYE "
             "NEVER HUNTS FOR IT").split()
    caps, t = [], 0.15
    for i, w in enumerate(words):
        if t > 6.45:
            break
        caps.append(f'<div class="clip cap" data-start="{t:.2f}" data-duration="0.30" '
                    f'data-track-index="{900 + i % 2}" style="top:1400px">{w}</div>')
        t += 0.34

    sil = silhouette("silA", light)
    sil2 = silhouette("silB", light)
    room = f'<div class="room"{g}><i class="win"></i><i class="lamp"></i><i class="shelf"></i></div>'
    card_inner = (f'<div class="cardroom"{g}></div>'
                  f'<div class="cardsil"{g}>{silhouette("silC", light)}</div>')
    ui = ('<div class="app"><div class="side">' + "".join('<i></i>' for _ in range(7)) + '</div>'
          '<div class="top"><b></b><b></b><b></b></div>'
          '<svg class="chart" viewBox="0 0 760 520" preserveAspectRatio="none" aria-hidden="true">'
          '<polyline fill="none" stroke="#6AA7FF" stroke-width="6" points="0,470 90,430 170,445 '
          '260,360 340,380 430,250 520,270 600,150 680,170 760,60"/>'
          '<polyline fill="none" stroke="#3A3F48" stroke-width="2" points="0,519 760,519"/></svg></div>')
    body = "\n".join([
        f'<div class="clip stage" data-start="0" data-duration="8" data-track-index="1">{room}</div>',
        # 0.0-2.4 title stack
        clip("vig", 0, 2.4),
        clip("tstack", 0.15, 2.25,
             f'<div class="tpill">{esc(handle)}</div><div class="mono">{esc(initial)}</div>'
             f'<div class="tline">{esc(line)}</div>'
             f'<div class="tword" style="font-size:{fit(kw, 250)}px">{esc(kw)}</div>'),
        clip("silwrap", 0, 2.4, f'<div{g}>{sil}</div>'),
        # 2.4-4.4 outline words behind the head
        clip("vig", 2.4, 2.0),
        clip("emph e-w", 2.45, 0.95, "EVERY", style=f"top:300px;font-size:{fit('EVERY')}px"),
        clip("emph e-a", 3.40, 1.00, "MANUALLY", style=f"top:300px;font-size:{fit('MANUALLY')}px"),
        clip("silwrap", 2.4, 2.0, f'<div{g}>{sil2}</div>'),
        # 4.4-6.6 a UI owns the frame, camera card, claim in the gutter
        clip("uiwrap", 4.4, 2.2, ui),
        clip("pillrow", 4.5, 2.0, '<span class="tpill">your product, real UI</span>', style="top:70px"),
        clip("annot", 4.75, 1.8, "3 HOURS SAVED\nEVERY WEEK", style="left:300px;top:250px;font-size:54px"),
        clip("cardwrap", 4.4, 2.2, card_inner),
        clip("cardhead", 4.4, 2.2, f'<div{g}>{silhouette("silD", light)}</div>'),
        # 6.6-8.0 CTA
        clip("vig", 6.6, 1.4),
        clip("cta", 6.7, 1.3, f'<div class="ctaline">comment</div>'
                               f'<div class="tword" style="font-size:{fit(kw + "  ", 250)}px">&ldquo;{esc(kw)}&rdquo;</div>'),
        clip("ctaarrow", 6.7, 1.3, "<i></i>", style=f"top:{170 + 82 + 26 + round(fit(kw + '  ', 250) * 0.9) + 30}px"),
        clip("silwrap", 6.6, 1.4, f'<div{g}>{silhouette("silE", light)}</div>'),
        clip("label", 0, 8, esc(f"THEME PREVIEW · {brand.get('look')} · "
                                f"{brand.get('accent') if not brand.get('brand_colors') else 'brand colours'} · "
                                f"{brand.get('font_feel')} · grade {'film' if grade else 'off'}")),
        *caps,
    ])
    grade_svg = (SKILL / "components/grade-persa.svg").read_text() if grade else ""
    doc = f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"/><title>theme-preview</title>
<link rel="stylesheet" href="tokens.css"/>
<link rel="stylesheet" href="persa-roles.css"/>
<style>
  .graded{{filter:url(#persa-grade)}}
  .stage{{position:absolute;left:0;top:0;width:1080px;height:1920px;z-index:1}}
  .room{{position:absolute;inset:0;background:
     radial-gradient(60% 40% at 78% 22%, color-mix(in srgb, var(--ground-2) 70%, #ffffff) 0%, transparent 70%),
     radial-gradient(90% 60% at 20% 80%, var(--ground-2) 0%, transparent 75%),
     linear-gradient(180deg, var(--ground) 0%, var(--ground-2) 100%)}}
  .room .win{{position:absolute;left:640px;top:180px;width:330px;height:520px;border-radius:14px;
     background:linear-gradient(180deg,rgba(255,240,215,.55),rgba(255,240,215,.18));filter:blur(18px)}}
  .room .lamp{{position:absolute;left:90px;top:520px;width:220px;height:220px;border-radius:50%;
     background:radial-gradient(circle,rgba(255,196,120,.75) 0%,rgba(255,196,120,0) 70%);filter:blur(6px)}}
  .room .shelf{{position:absolute;left:0;top:980px;width:1080px;height:60px;background:rgba(0,0,0,.18);filter:blur(10px)}}
  .silwrap,.cardhead{{position:absolute;left:0;top:0;width:1080px;height:1920px;z-index:7}}
  .cardhead{{z-index:4}}
  .cardhead>div{{position:absolute;left:107px;top:{1143 - 120 - round(600 * 0.81)}px;width:875px;height:1555px}}
  .cardhead svg,.cardsil svg{{width:100%;height:100%}}
  .uiwrap{{position:absolute;left:0;top:0;width:1080px;height:1920px;z-index:2}}
  .app{{position:absolute;inset:0;background:#0F1012}}
  .app .side{{position:absolute;left:0;top:0;width:210px;height:1920px;background:#16171A;padding-top:150px}}
  .app .side i{{display:block;margin:26px 30px;height:26px;border-radius:8px;background:#26282D}}
  .app .top{{position:absolute;left:210px;top:0;right:0;height:120px;background:#131417;border-bottom:2px solid #24262B}}
  .app .top b{{display:inline-block;margin:44px 0 0 40px;width:150px;height:30px;border-radius:8px;background:#2A2D33}}
  .app .chart{{position:absolute;left:270px;top:430px;width:760px;height:520px}}
  .cardwrap{{position:absolute;left:114px;top:1143px;width:861px;height:777px;overflow:hidden;
     border-radius:var(--r-card);z-index:3}}
  .cardroom{{position:absolute;inset:0;background:linear-gradient(180deg,var(--ground-2),var(--ground))}}
  .cardsil{{position:absolute;left:-7px;top:{(1143 - 120 - round(600 * 0.81)) - 1143}px;width:875px;height:1555px}}
  .mono{{width:196px;height:196px;border-radius:44px;background:var(--display);color:#FFFFFF;
     display:flex;align-items:center;justify-content:center;font:var(--display-weight) 130px var(--font-display);
     filter:drop-shadow(0 10px 26px rgba(0,0,0,.5))}}
  .label{{position:absolute;left:0;top:1846px;width:1080px;text-align:center;z-index:9;
     font:600 24px var(--font-ui);letter-spacing:.08em;color:rgba(255,255,255,.82);
     filter:drop-shadow(0 2px 6px rgba(0,0,0,.9))}}
</style></head>
<body>
{grade_svg}
<div id="root" data-composition-id="main" data-no-timeline data-start="0" data-duration="8"
     data-width="1080" data-height="1920" data-fps="30">
{body}
</div>
</body></html>
"""
    out.mkdir(parents=True, exist_ok=True)
    shutil.copy2(SKILL / "assets/tokens.css", out / "tokens.css")
    shutil.copy2(SKILL / "components/persa-roles.css", out / "persa-roles.css")
    shutil.copy2(SKILL / "template/hyperframes.json", out / "hyperframes.json")
    (out / "index.html").write_text(doc)
    return out / "index.html"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", help="folder for the preview project (default <videos_dir>/_theme-preview)")
    ap.add_argument("--no-render", action="store_true")
    ap.add_argument("--open", action="store_true")
    a = ap.parse_args()
    brand = json.loads((SKILL / "brand/brand.json").read_text())
    out = pathlib.Path(os.path.expanduser(a.out or os.path.join(brand.get("videos_dir") or "~/persa-shorts",
                                                                "_theme-preview")))
    idx = build(brand, out)
    print(f"preview project: {idx}")
    if a.no_render:
        return
    mp4 = out / "theme-preview.mp4"
    r = subprocess.run(["npx", "--yes", "hyperframes", "render", str(out), "-o", str(mp4), "-q", "draft",
                        "--quiet"], stdin=subprocess.DEVNULL)
    if r.returncode != 0 or not mp4.exists():
        sys.exit("make-preview: render failed — run `npx --yes hyperframes check " + str(out) + "` to see why")
    print(f"rendered: {mp4}")
    sheet = subprocess.run([sys.executable, str(SKILL / "scripts/contact-sheet.py"), str(mp4),
                            "--at", "1.3,2.9,3.9,5.6,7.4", "--cols", "5"], capture_output=True, text=True)
    if sheet.returncode == 0:
        print(f"contact sheet: {sheet.stdout.strip()}   <- LOOK at this before showing the user")
    if a.open:
        opener = {"Darwin": ["open"], "Windows": ["cmd", "/c", "start", ""]}.get(platform.system(), ["xdg-open"])
        subprocess.run(opener + [str(mp4)])


if __name__ == "__main__":
    main()
