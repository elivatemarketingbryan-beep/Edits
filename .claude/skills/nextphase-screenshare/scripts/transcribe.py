#!/usr/bin/env python3
"""transcribe.py — word-level transcript of a recording, safe on long files.

    python3 <skill>/scripts/transcribe.py <video-dir>          reads assets/recording.mp4
    python3 <skill>/scripts/transcribe.py <video-dir> --src assets/other.mov
    python3 <skill>/scripts/transcribe.py <video-dir> --language fr

Writes <video-dir>/assets/transcript.json  ([{text,start,end}, ...]).

Why not just `hyperframes transcribe` on the whole file:
  * on files longer than ~90s the Parakeet engine can SILENTLY drop whole
    spans of speech (77s of a 164s take once) — no error, no silence to show
    for it. So anything over 90s is transcribed in 20s windows with 2s overlap
    and merged. Each window owns [offset+1, offset+21); a word straddling that
    line can come out of both windows, so seam duplicates are removed.
  * audio-only inputs can produce no transcript at all, so every window keeps
    a (tiny) video stream.
  * after merging, every stretch of speech-level audio with no words in it is
    reported — check those before you build anything on the timing.

Engine: HyperFrames picks Parakeet when installed (`hf models install parakeet`,
Apple Silicon), else whisper (installed on first use).
"""
import argparse, array, json, os, shutil, subprocess, sys, tempfile

WIN, OVL = 20.0, 2.0


def sh(cmd, **kw):
    return subprocess.run(cmd, check=True, capture_output=True, text=True, **kw)


def duration(path):
    return float(sh(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                     "-of", "default=nw=1:nk=1", path]).stdout.strip())


def hf_cmd():
    v = os.environ.get("HF_VERSION", "0.8.145")
    return ["npx", "-y", "hyperframes@%s" % v]


def transcribe_clip(src, ss, t, lang, tmp):
    proj = tempfile.mkdtemp(dir=tmp)
    os.makedirs(os.path.join(proj, "assets"))
    clip = os.path.join(proj, "assets", "recording.mp4")
    cmd = ["ffmpeg", "-v", "error", "-y"]
    if ss > 0:
        cmd += ["-ss", "%.3f" % ss]
    cmd += ["-i", src]
    if t:
        cmd += ["-t", "%.3f" % t]
    cmd += ["-map", "0:v:0?", "-map", "0:a:0", "-vf", "scale=320:-2,fps=10",
            "-c:v", "libx264", "-preset", "ultrafast", "-crf", "35",
            "-c:a", "aac", "-b:a", "128k", "-ac", "1", "-ar", "16000", clip]
    try:
        sh(cmd)
    except subprocess.CalledProcessError:
        # no video stream at all: synthesise a black one, keep the audio
        sh(["ffmpeg", "-v", "error", "-y"] + (["-ss", "%.3f" % ss] if ss > 0 else []) +
           ["-i", src] + (["-t", "%.3f" % t] if t else []) +
           ["-f", "lavfi", "-i", "color=c=black:s=320x180:r=10", "-shortest",
            "-map", "1:v", "-map", "0:a:0", "-c:v", "libx264", "-preset", "ultrafast",
            "-c:a", "aac", "-ac", "1", "-ar", "16000", clip])
    args = hf_cmd() + ["transcribe", clip, "-d", proj]
    if lang:
        args += ["-l", lang]
    r = subprocess.run(args, capture_output=True, text=True)
    out = os.path.join(proj, "transcript.json")
    if not os.path.exists(out):
        sys.stderr.write(r.stdout[-800:] + r.stderr[-800:])
        raise SystemExit("transcribe: no transcript.json came back for the window at %.1fs. "
                         "Is a speech engine installed? (scripts/doctor.sh)" % ss)
    doc = json.load(open(out))
    words = doc if isinstance(doc, list) else doc.get("words", [])
    res = []
    for w in words:
        txt = str(w.get("text", w.get("word", ""))).strip()
        if txt:
            res.append({"text": txt, "start": round(w["start"] + ss, 3),
                        "end": round(w["end"] + ss, 3)})
    return res


def rms_per_100ms(src):
    """Speech-level detector: RMS in 100ms frames, pure Python, 8kHz mono."""
    p = subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-map", "0:a:0", "-ac", "1",
                        "-ar", "8000", "-f", "s16le", "-"], capture_output=True, check=True)
    a = array.array("h"); a.frombytes(p.stdout)
    n = 800
    out = []
    for i in range(0, len(a) - n + 1, n):
        seg = a[i:i + n]
        s = sum(x * x for x in seg) / n
        out.append(10 * __import__("math").log10(max(s, 1) / (32768.0 ** 2)))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video_dir")
    ap.add_argument("--src", default="assets/recording.mp4")
    ap.add_argument("--language", default=None)
    a = ap.parse_args()
    vd = os.path.abspath(a.video_dir)
    src = os.path.join(vd, a.src)
    if not os.path.exists(src):
        raise SystemExit("transcribe: no such file %s" % src)
    dur = duration(src)
    tmp = tempfile.mkdtemp(prefix="ss-tx-")
    try:
        if dur <= 90:
            print("transcribe: %.1fs — one pass" % dur)
            words = transcribe_clip(src, 0, None, a.language, tmp)
        else:
            n = int((dur - 1e-6) // WIN) + 1
            print("transcribe: %.1fs — %d windows of %ds (long files drop speech in one pass)"
                  % (dur, n, WIN))
            words = []
            for i in range(n):
                off = i * WIN
                ss = max(0.0, off - OVL / 2)
                own_lo = 0.0 if i == 0 else off
                own_hi = dur + 1 if i == n - 1 else off + WIN
                ws = transcribe_clip(src, ss, WIN + OVL, a.language, tmp)
                kept = [w for w in ws if own_lo <= w["start"] < own_hi]
                words += kept
                print("  window %2d  %6.1f-%6.1fs  %3d words" % (i + 1, own_lo, min(own_hi, dur), len(kept)))
            # seam duplicates: a word or phrase straddling a window's ownership
            # line can come out of BOTH windows ("the viewer the viewer"). At
            # each seam, drop an n-gram that repeats the n-gram just before it.
            words.sort(key=lambda x: x["start"])
            norm = lambda x: x["text"].lower().strip(".,!?;:")
            for sm in [i * WIN for i in range(1, n)]:
                i = next((k for k, w in enumerate(words) if w["start"] >= sm), None)
                if i is None:
                    continue
                for g in (4, 3, 2, 1):
                    for j in range(i - 2, i + 3):     # the doubled phrase may sit either side
                        if j - g < 0 or j + g > len(words):
                            continue
                        before, after = words[j - g:j], words[j:j + g]
                        if ([norm(x) for x in before] == [norm(x) for x in after]
                                and after[0]["start"] - before[0]["start"] < 0.45 * g + 0.6):
                            print("  seam %.0fs: dropped a doubled \"%s\""
                                  % (sm, " ".join(x["text"] for x in after)))
                            del words[j:j + g]
                            break
                    else:
                        continue
                    break
    finally:
        shutil.rmtree(tmp, ignore_errors=True)

    out = os.path.join(vd, "assets", "transcript.json")
    json.dump(words, open(out, "w"), indent=1)
    print("wrote assets/transcript.json  %d words, %.1f-%.1fs of a %.1fs file"
          % (len(words), words[0]["start"] if words else 0, words[-1]["end"] if words else 0, dur))

    # gap check against the audio itself, never against silencedetect
    try:
        env = rms_per_100ms(src)
    except Exception:
        env = []
    if env and words:
        speech = sorted(env)[int(len(env) * 0.7)] - 12      # speech-level floor
        covered = [False] * len(env)
        for w in words:
            for k in range(int(w["start"] * 10), min(len(env), int(w["end"] * 10) + 1)):
                covered[k] = True
        holes, run = [], None
        for k, v in enumerate(env):
            hole = v > speech and not covered[k]
            if hole and run is None:
                run = k
            if not hole and run is not None:
                if k - run >= 25:
                    holes.append((run / 10, k / 10))
                run = None
        if holes:
            print("  ! %d stretch(es) of speech-level audio with NO words — check these:" % len(holes))
            for s0, s1 in holes:
                print("      %7.1f-%7.1fs" % (s0, s1))
            print("    (another language, music, or a dropped span — re-run just that span)")
        else:
            print("  gap check: every stretch of speech has words")


if __name__ == "__main__":
    main()
