#!/usr/bin/env python3
"""study_reel.py <video> <outdir>: learn a reference frame by frame. Writes labelled contact sheets of every unique frame, a
spectrogram with the cuts marked, and prints the timeline fps, picture changes and sound hits per second, and how often hits land on cuts."""
import json, os, subprocess, sys
import numpy as np
import soundfile as sf
from PIL import Image, ImageDraw

src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
S = 300
info = json.loads(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "json", src], capture_output=True, text=True).stdout)["streams"][0]
H = S * info["height"] // info["width"]
raw = subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-i", src, "-vf", f"scale={S}:{H}", "-vsync", "0", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, H, S, 3)
pts = [float(p.strip(",")) for p in subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "frame=pts_time", "-of", "csv=p=0", src], capture_output=True, text=True).stdout.split() if p.strip(",")]
g = fr.astype(np.float32) @ np.array([.2126, .7152, .0722])
d = np.concatenate([[0], np.abs(np.diff(g, axis=0)).mean((1, 2))])
sat = ((fr.max(3).astype(np.float32) - fr.min(3)) / (fr.max(3) + 1e-3)).mean((1, 2))
dur = len(fr) * (pts[1] - pts[0])
uniq = [i for i in range(len(d)) if i == 0 or d[i] > .3]
runs = np.diff(uniq + [len(d)])
print(f"{len(fr)} frames, {len(uniq)} unique, {dur:.2f} s. Runs of identical frames: {dict(zip(*[x.tolist() for x in np.unique(runs, return_counts=True)]))}")
print(f"colour: {(sat < .1).mean() * 100:.0f}% of frames near black and white, {(sat > .45).mean() * 100:.0f}% strong colour")
cols, rows = 10, 8
for s in range(0, len(uniq), cols * rows):
    sheet = Image.new("RGB", (cols * (S + 4), rows * (H + 22)), (40, 40, 40))
    dr = ImageDraw.Draw(sheet)
    for k, i in enumerate(uniq[s:s + cols * rows]):
        x, y = (k % cols) * (S + 4), (k // cols) * (H + 22)
        sheet.paste(Image.fromarray(fr[i]), (x, y + 20))
        dr.text((x + 3, y + 3), f"f{i} {pts[i]:.3f}s x{runs[s + k]}", fill=(255, 230, 0))
    sheet.save(os.path.join(out, f"sheet_{s // (cols * rows):02d}.png"))

wav = os.path.join(out, "audio.wav")
subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", src, "-vn", "-ac", "1", "-c:a", "pcm_s24le", "-ar", "44100", wav], check=True)
m, sr = sf.read(wav, dtype="float64")
X = np.fft.rfft(m)
hi = np.fft.irfft(X * (np.fft.rfftfreq(len(m), 1 / sr) >= 3000), len(m))
# a hit is a jump over its own last 15 ms, so hits in a noisy passage count the same as hits in a quiet one
hop = int(.001 * sr)
e = np.sqrt(np.convolve(hi * hi, np.ones(hop * 2) / (hop * 2), "same"))[::hop]
on, i = [], 20
while i < len(e) - 5:
    prev = np.median(e[i - 15:i - 2]) + 1e-5
    if e[i:i + 4].max() > prev * 3 and e[i:i + 4].max() > .012:
        j = i + int(np.argmax(e[i:i + 12]))
        on.append(j)
        i = j + 25
    else:
        i += 1
ht = np.array([j * hop / sr for j in on])
cuts = np.array([pts[i] for i in range(1, len(d)) if d[i] > 24])
print(f"{len(cuts)} hard cuts = {len(cuts) / dur:.1f}/s; {len(ht)} sound hits = {len(ht) / dur:.1f}/s")
print("per second, cuts:", [int(((cuts >= s) & (cuts < s + 1)).sum()) for s in range(int(dur) + 1)])
print("per second, hits:", [int(((ht >= s) & (ht < s + 1)).sum()) for s in range(int(dur) + 1)])
print("hit gaps ms:", " ".join("%.0f" % v for v in np.diff(ht) * 1000))
share = lambda lag: np.mean([np.min(np.abs(cuts - (v + lag))) < .02 for v in ht])
print("hits within 20 ms of a cut: %.0f%%, at random offsets %.0f%%" % (share(0) * 100, np.mean([share(l) for l in np.arange(-.25, .25, .01)]) * 100))

n, step = 2048, 128
win = np.hanning(n)
Sx = np.array([np.abs(np.fft.rfft(m[i:i + n] * win)) for i in range(0, len(m) - n, step)]).T
db = 20 * np.log10(Sx + 1e-6)
db = np.clip((db - db.max() + 80) / 80, 0, 1)
ys = np.geomspace(30, 22000, 600)
img = Image.fromarray((db[np.searchsorted(np.fft.rfftfreq(n, 1 / sr), ys).clip(0, n // 2)][::-1] * 255).astype(np.uint8)).resize((3000, 600)).convert("RGB")
dr = ImageDraw.Draw(img)
for c in cuts:
    dr.line([(c / (len(m) / sr) * 3000, 0), (c / (len(m) / sr) * 3000, 8)], fill=(255, 200, 0))
for s in np.arange(0, len(m) / sr, .5):
    dr.line([(s / (len(m) / sr) * 3000, 0), (s / (len(m) / sr) * 3000, 600)], fill=(90, 90, 200))
    dr.text((s / (len(m) / sr) * 3000 + 2, 10), f"{s:.1f}", fill=(255, 255, 255))
img.save(os.path.join(out, "spectrogram.png"))
