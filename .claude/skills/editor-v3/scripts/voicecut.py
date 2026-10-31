#!/usr/bin/env python3
"""voicecut.py <project>: the clean voice cut, and the master clock of the edit. Reads <project>/cut.json, keeps the
named lines, takes out every pause inside a line, levels the takes. Writes work/timeline.json (lines with their pieces
of source), work/words.json and work/voice.wav. Nothing gets generated until this cut is verified.
cut.json: {"source": "raw/take.mp4", "takes": {"A": [t0, t1], ...},
           "segs": [[id, take, src_in, src_out, gap_after], ...], "inserts": {id: seconds}, "end_hold": s}"""
import json, os, subprocess, sys
import numpy as np
import soundfile as sf

ROOT = sys.argv[1]
os.chdir(ROOT)
SR = 48000
MIN_PAUSE = .15     # any quiet longer than this inside a line comes out
PAD = .08           # kept either side of a removed pause, so soft consonants (h, th, f, s) survive

cfg = json.load(open("cut.json"))
SEGS = cfg["segs"]
inserts = cfg.get("inserts", {})
if not os.path.exists("work/take.wav"):
    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", cfg["source"], "-vn", "-ac", "1", "-ar", str(SR), "work/take.wav"], check=True)
x, _ = sf.read("work/take.wav", dtype="float32")
hop = int(.005 * SR)
env = np.sqrt(np.convolve(x * x, np.ones(hop * 2) / (hop * 2), "same"))[::hop]


def idx(t):
    return min(len(env) - 1, max(0, int(t / .005)))


level = {k: float(np.percentile(env[int(a / .005):int(b / .005)], 80)) for k, (a, b) in cfg["takes"].items()}
ref = np.median(list(level.values()))
gain = {k: ref / v for k, v in level.items()}
print("take gains", {k: round(v, 2) for k, v in gain.items()})


def voiced_pieces(take, a, b):
    """the talking inside [a, b]: pauses of MIN_PAUSE or more are removed, PAD of breath kept"""
    thr = level[take] * .09
    on = np.flatnonzero(env[idx(a):idx(b) + 1] > thr)
    if not len(on):
        return []
    runs, start, prev = [], on[0], on[0]
    for i in on[1:]:
        if (i - prev) * .005 >= MIN_PAUSE:
            runs.append((start, prev))
            start = i
        prev = i
    runs.append((start, prev))
    return [[max(a, a + r0 * .005 - PAD), min(b, a + r1 * .005 + PAD)] for r0, r1 in runs]


lines, pieces, t, removed = [], [], 0.0, 0.0
for n, (sid, take, s0, s1, gap) in enumerate(SEGS):
    if take is None:
        d = inserts[sid]
        lines.append(dict(id=sid, take=None, t0=round(t, 4), t1=round(t + d, 4), pieces=[]))
        pieces.append(np.zeros(int(d * SR), np.float32))
        t += d
        continue
    prev_join = n > 0 and SEGS[n - 1][1] == take and abs(SEGS[n - 1][3] - s0) < 1e-6
    next_join = n + 1 < len(SEGS) and SEGS[n + 1][1] == take and abs(SEGS[n + 1][2] - s1) < 1e-6
    ps = voiced_pieces(take, s0, s1)
    removed += (s1 - s0) - sum(b - a for a, b in ps)
    rec, t0_line = [], t
    for k, (a, b) in enumerate(ps):
        seg = x[int(a * SR):int(b * SR)].copy() * gain[take]
        f = int(.006 * SR)
        # no fade on a cut that simply carries on in the same take
        if not (k == 0 and prev_join and a - s0 < .01):
            seg[:f] *= np.linspace(0, 1, f)
        if not (k == len(ps) - 1 and next_join and s1 - b < .01):
            seg[-f:] *= np.linspace(1, 0, f)
        pieces.append(seg)
        d = len(seg) / SR
        rec.append(dict(s0=round(a, 4), s1=round(b, 4), t0=round(t, 4), t1=round(t + d, 4)))
        t += d
    lines.append(dict(id=sid, take=take, t0=round(t0_line, 4), t1=round(t, 4), pieces=rec))
    if gap:
        pieces.append(np.zeros(int(gap * SR), np.float32))
        t += gap
hold = cfg.get("end_hold", 1.0)
pieces.append(np.zeros(int(hold * SR), np.float32))
total = t + hold
sf.write("work/voice_raw.wav", np.concatenate(pieces), SR)
subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", "work/voice_raw.wav", "-af",
                "highpass=f=75,afftdn=nf=-32,acompressor=threshold=-22dB:ratio=2.4:attack=6:release=120:makeup=3dB,loudnorm=I=-18:TP=-2:LRA=9:linear=true",
                "-ar", str(SR), "-ac", "1", "work/voice.wav"], check=True)
json.dump(dict(lines=lines, total=round(total, 3)), open("work/timeline.json", "w"), indent=1)
print("total %.2f  pauses removed inside lines %.2f s  pieces %d" % (total, removed, sum(len(l["pieces"]) for l in lines)))

# words on the output clock (from the take's transcript, placed through the pieces)
if os.path.exists("work/take_tx.json"):
    r = json.load(open("work/take_tx.json"))
    merged = []
    for w in [w for s in r["segments"] for w in s.get("words", [])]:
        tx = w["word"].strip()
        if tx.startswith("-") and merged:
            merged[-1]["w"] += tx
            merged[-1]["e"] = w["end"]
        else:
            merged.append(dict(w=tx, s=w["start"], e=w["end"]))

    def to_out(line, src):
        ps = line["pieces"]
        for p in ps:
            if src < p["s0"]:
                return p["t0"]
            if src <= p["s1"]:
                return p["t0"] + (src - p["s0"])
        return ps[-1]["t1"]

    words = []
    for ln, q in zip(lines, SEGS):
        if not ln["take"]:
            continue
        for w in merged:
            if q[2] - .04 <= w["s"] < q[3]:
                s = to_out(ln, w["s"])
                e = to_out(ln, min(w["e"], q[3]))
                words.append(dict(w=w["w"], s=round(s, 3), e=round(max(e, s + .05), 3), seg=ln["id"]))
    json.dump(words, open("work/words.json", "w"), indent=0)
    print(" ".join(w["w"] for w in words))
