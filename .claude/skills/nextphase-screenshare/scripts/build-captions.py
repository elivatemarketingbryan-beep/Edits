#!/usr/bin/env python3
"""build-captions.py — transcript → screenshare caption plan.

Turns `assets/transcript-tight.json` into frame-accurate caption chunks that
obey the measured rhythm of the style:

    2–6 words        median hold 18 frames (0.6s)        ~2-frame cross-fade

  usage:
    python3 build-captions.py assets/transcript-tight.json
    python3 build-captions.py assets/transcript-tight.json --out assets/captions.json
    python3 build-captions.py assets/transcript-tight.json --from 42.0 --to 98.5
    python3 build-captions.py assets/transcript-tight.json --html      # paste-ready

⚠ `assets/transcript-tight.json` is the ONLY timing source. The tighten pass
  moves every word onset; building against the original transcript shows up
  as "the graphics are all slightly early", never as an error.

⚠ The chunks this emits are a PROPOSAL. Read them. It breaks on pauses and
  word counts, which gets the rhythm right and the sense wrong maybe one time
  in ten — usually by splitting a noun phrase. Fix those by hand.

The accent markup is NOT inferred. One word in a caption may take an accent,
and only when it is doing one of the four jobs (live / win / cost). That is a
judgement about meaning, so it is left to you: wrap the word in
<span class="live|win|cost"> after the fact.
"""
import argparse
import json
import re
import sys

FPS = 30
MIN_WORDS, MAX_WORDS = 2, 6
TARGET_HOLD = 18          # frames — the measured median
MIN_HOLD = 9              # below this the 2-frame fade is a flicker
FADE = 2                  # frames
GAP_SPLIT = 0.32          # a pause longer than this ends a chunk


def load_words(path):
    """Accept the shapes the studio's transcripts come in."""
    with open(path) as fh:
        data = json.load(fh)
    if isinstance(data, dict):
        for k in ("words", "word_segments", "segments", "result"):
            if k in data:
                data = data[k]
                break
    out = []
    for w in data:
        if not isinstance(w, dict):
            continue
        text = w.get("word", w.get("text", w.get("w", "")))
        start = w.get("start", w.get("s", w.get("from")))
        end = w.get("end", w.get("e", w.get("to")))
        if text is None or start is None:
            continue
        text = str(text).strip()
        if not text:
            continue
        out.append({"w": text, "s": float(start),
                    "e": float(end if end is not None else start)})
    if not out:
        sys.exit(f"build-captions: no word-level timings found in {path}\n"
                 "  (hyperframes transcribe -d gives the word JSON; -o is an "
                 "SRT sidecar)")
    return out


def chunk(words):
    """Break into 2–6 word phrases on pauses, then on length."""
    chunks, cur = [], []
    for i, w in enumerate(words):
        cur.append(w)
        nxt = words[i + 1] if i + 1 < len(words) else None
        gap = (nxt["s"] - w["e"]) if nxt else 99.0
        ends_clause = bool(re.search(r"[.,;:!?]$", w["w"]))
        if (len(cur) >= MAX_WORDS
                or gap >= GAP_SPLIT
                or (ends_clause and len(cur) >= MIN_WORDS)
                or nxt is None):
            chunks.append(cur)
            cur = []
    if cur:
        chunks.append(cur)

    # merge anything left below the minimum into its neighbour
    merged = []
    for c in chunks:
        if merged and len(c) < MIN_WORDS and len(merged[-1]) + len(c) <= MAX_WORDS:
            merged[-1].extend(c)
        else:
            merged.append(c)
    return merged


def to_plan(chunks):
    plan = []
    for i, c in enumerate(chunks):
        f_in = round(c[0]["s"] * FPS)
        f_out = round(c[-1]["e"] * FPS)
        # never end before the next chunk starts; hold to the next onset
        if i + 1 < len(chunks):
            f_out = max(f_out, round(chunks[i + 1][0]["s"] * FPS) - 1)
        if f_out - f_in < MIN_HOLD:
            f_out = f_in + MIN_HOLD
        plan.append({
            "text": " ".join(w["w"] for w in c).strip(),
            "in": f_in, "out": f_out,
            "hold": f_out - f_in,
            "fade": FADE,
            "t_in": round(f_in / FPS, 3), "t_out": round(f_out / FPS, 3),
        })
    # clip overlaps created by the minimum hold
    for i in range(len(plan) - 1):
        if plan[i]["out"] >= plan[i + 1]["in"]:
            plan[i]["out"] = plan[i + 1]["in"] - 1
            plan[i]["hold"] = plan[i]["out"] - plan[i]["in"]
    return plan


def report(plan):
    holds = [p["hold"] for p in plan]
    wc = [len(p["text"].split()) for p in plan]
    holds_sorted = sorted(holds)
    med = holds_sorted[len(holds_sorted) // 2]
    print(f"  chunks        : {len(plan)}", file=sys.stderr)
    print(f"  hold (frames) : median {med}  min {min(holds)}  max {max(holds)}"
          f"   [reference median 18]", file=sys.stderr)
    print(f"  words / chunk : min {min(wc)}  max {max(wc)}"
          f"   [style 2–6]", file=sys.stderr)
    long_ = [p for p in plan if len(p["text"].split()) > MAX_WORDS]
    if long_:
        print(f"  ⚠ {len(long_)} chunk(s) over {MAX_WORDS} words — "
              f"re-chunk by hand, never shrink the type", file=sys.stderr)
    short = [p for p in plan if p["hold"] < MIN_HOLD]
    if short:
        print(f"  ⚠ {len(short)} chunk(s) under {MIN_HOLD}f — they will "
              f"flicker against the 2f fade", file=sys.stderr)


def as_html(plan):
    lines = ['<!-- captions — screenshare. Positions come from .ss-cap; do not',
             '     add per-caption styling. One word MAY take an accent when it',
             '     is doing one of the four jobs: class="live|win|cost". -->']
    for p in plan:
        lines.append(
            f'<div class="clip ss-cap" data-start="{p["in"]}" '
            f'data-end="{p["out"]}">{p["text"]}</div>')
    return "\n".join(lines)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("transcript")
    ap.add_argument("--out", default=None, help="write the plan as JSON")
    ap.add_argument("--html", action="store_true", help="emit paste-ready markup")
    ap.add_argument("--from", dest="t0", type=float, default=None)
    ap.add_argument("--to", dest="t1", type=float, default=None)
    a = ap.parse_args()

    words = load_words(a.transcript)
    if a.t0 is not None:
        words = [w for w in words if w["e"] >= a.t0]
    if a.t1 is not None:
        words = [w for w in words if w["s"] <= a.t1]
    if not words:
        sys.exit("build-captions: no words in that range")

    plan = to_plan(chunk(words))
    print(f"build-captions: {a.transcript}", file=sys.stderr)
    report(plan)

    if a.out:
        with open(a.out, "w") as fh:
            json.dump(plan, fh, indent=2)
        print(f"  wrote {a.out}", file=sys.stderr)
    if a.html or not a.out:
        print(as_html(plan))
    return 0


if __name__ == "__main__":
    sys.exit(main())
