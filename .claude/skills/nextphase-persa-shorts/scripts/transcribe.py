#!/usr/bin/env python3
"""
TRANSCRIBE — word-level transcript for a video folder, with the gap check that catches drops.

    python3 scripts/transcribe.py <video-folder>            # -> assets/transcript.json
    python3 scripts/transcribe.py <video-folder> --check    # gap-check an existing transcript

Uses `npx hyperframes transcribe` (Parakeet when installed, otherwise Whisper — both free and
local). Parakeet is faster and more accurate on Apple Silicon:
    npx --yes hyperframes models install parakeet

THE TRAP THIS EXISTS FOR: speech recognisers silently DROP audio — a chunk of speech comes back
with no words at all, and everything timed after it is fine, so nothing errors. On a short you
only notice when a caption is missing on screen. So after transcribing, every gap of >0.7s with
no words is measured: if the audio inside it is NOT silent, the window is re-transcribed on its
own and the words are merged back in. Whatever still looks dropped is reported, loudly.

Word onsets in this file are the ONLY timing source for the edit. Fix caption TEXT in
beats.json "fixes"; never edit times.
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

GAP = 0.7            # seconds with no words that deserve a look
SPEECH_DB = -38.0    # mean volume above this inside a gap = probably speech, not room tone


def sh(cmd, **kw):
    return subprocess.run([str(c) for c in cmd], capture_output=True, text=True,
                          stdin=subprocess.DEVNULL, **kw)


def duration(p):
    return float(sh(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of",
                     "csv=p=0", p]).stdout.strip() or 0)


def mean_db(src, a, b):
    r = sh(["ffmpeg", "-nostdin", "-v", "info", "-ss", f"{a:.3f}", "-t", f"{max(0.05, b - a):.3f}",
            "-i", src, "-vn", "-af", "volumedetect", "-f", "null", "-"])
    m = re.search(r"mean_volume:\s*(-?[\d.]+) dB", r.stderr)
    return float(m.group(1)) if m else -99.0


def hf_transcribe(media, outdir):
    """Run hyperframes transcribe; it writes <outdir>/transcript.json. Keeps a video stream on
    the input, because the CLI expects one."""
    outdir.mkdir(parents=True, exist_ok=True)
    r = sh(["npx", "--yes", "hyperframes", "transcribe", media, "-d", outdir])
    tj = outdir / "transcript.json"
    if r.returncode != 0 or not tj.exists():
        sys.stderr.write(r.stdout[-2000:] + r.stderr[-2000:])
        sys.exit("transcribe: hyperframes transcribe failed (see above)")
    return json.loads(tj.read_text())


def window_clip(src, a, b, dst):
    # a black 640x360 video track + the audio window: small, fast, and has a video stream
    sh(["ffmpeg", "-nostdin", "-v", "error", "-y", "-ss", f"{a:.3f}", "-t", f"{b - a:.3f}", "-i", src,
        "-f", "lavfi", "-i", "color=c=black:s=640x360:r=30", "-map", "1:v", "-map", "0:a",
        "-shortest", "-c:v", "libx264", "-preset", "ultrafast", "-c:a", "aac", dst])


def gaps(words, dur):
    out, prev = [], 0.0
    for w in words:
        if w["start"] - prev > GAP:
            out.append((prev, w["start"]))
        prev = max(prev, w["end"])
    if dur - prev > GAP:
        out.append((prev, dur))
    return out


def renumber(words):
    words.sort(key=lambda w: w["start"])
    for i, w in enumerate(words):
        w["id"] = f"w{i}"
    return words


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video_dir")
    ap.add_argument("--check", action="store_true", help="only gap-check the existing transcript")
    ap.add_argument("--src", default="assets/recording.mp4")
    a = ap.parse_args()

    vd = pathlib.Path(os.path.expanduser(a.video_dir)).resolve()
    src = vd / a.src
    out = vd / "assets/transcript.json"
    if not src.exists():
        sys.exit(f"transcribe: no {src}")
    dur = duration(src)

    if a.check:
        words = json.loads(out.read_text())
    else:
        tmp = pathlib.Path(tempfile.mkdtemp(prefix="tr_"))
        try:
            words = hf_transcribe(src, tmp)
            # re-transcribe any gap that has speech in it, on its own, and merge
            for (g0, g1) in gaps(words, dur):
                if mean_db(src, g0, g1) < SPEECH_DB:
                    continue
                w0, w1 = max(0.0, g0 - 0.4), min(dur, g1 + 0.4)
                clip = tmp / f"gap_{w0:.2f}.mp4"
                window_clip(src, w0, w1, clip)
                sub = hf_transcribe(clip, tmp / f"gap_{w0:.2f}")
                added = [dict(w, start=round(w["start"] + w0, 3), end=round(w["end"] + w0, 3))
                         for w in sub if g0 - 0.05 <= w["start"] + w0 <= g1 + 0.05]
                if added:
                    print(f"transcribe: recovered {len(added)} dropped word(s) at {g0:.2f}-{g1:.2f}s")
                    words.extend(added)
            words = renumber(words)
        finally:
            shutil.rmtree(tmp, ignore_errors=True)
        out.write_text(json.dumps(words, indent=1) + "\n")
        print(f"transcribe: {len(words)} words -> {out}")

    # report: span vs duration, and any gap that still has sound in it
    if not words:
        sys.exit("transcribe: NO WORDS. Is there speech in the take?")
    span = f"{words[0]['start']:.2f}-{words[-1]['end']:.2f}s of {dur:.2f}s"
    loud = [(g0, g1, mean_db(src, g0, g1)) for g0, g1 in gaps(words, dur)]
    loud = [x for x in loud if x[2] >= SPEECH_DB]
    print(f"transcribe: words span {span}")
    for g0, g1, db in loud:
        print(f"  WARN {g0:.2f}-{g1:.2f}s has no words but the audio is at {db:.1f} dB — "
              f"listen to it; the recogniser may have dropped speech there")
    if not loud:
        print("transcribe: gap check clean")


if __name__ == "__main__":
    main()
