#!/usr/bin/env python3
"""
scripts/write_canonical_transcript.py — derive outputs/.transcript.json.

Applies transcript/corrections.json (text-only, whole-word swaps) to a
COPY of transcript/words.json, then remaps the corrected words through
cutlist.json onto the output timeline. The raw words.json is never
touched. This is the ONLY place corrections are applied, and this is
the ONLY transcript downstream steps (captions, editing-app review) are
allowed to read.

usage: uv run scripts/write_canonical_transcript.py <job-name>
reads:  projects/<job>/transcript/words.json
        projects/<job>/transcript/corrections.json  (optional)
        projects/<job>/cutlist.json
writes: projects/<job>/outputs/.transcript.json
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[4] / "lib"))

import cutlist as cutlist_mod
import transcript as transcript_mod

REPO_ROOT = Path(__file__).resolve().parents[4]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("job")
    args = ap.parse_args()

    job_dir = REPO_ROOT / "projects" / args.job
    words_path = job_dir / "transcript" / "words.json"
    corrections_path = job_dir / "transcript" / "corrections.json"
    cutlist_path = job_dir / "cutlist.json"
    out_path = job_dir / "outputs" / ".transcript.json"

    if not words_path.exists():
        raise SystemExit(f"missing {words_path}")
    if not cutlist_path.exists():
        raise SystemExit(f"missing {cutlist_path} — run scripts/build_cutlist.py {args.job} first")

    words = transcript_mod.load_words(str(words_path))
    corrections = transcript_mod.load_corrections(str(corrections_path))
    corrected = transcript_mod.apply_corrections(words, corrections)

    cl = cutlist_mod.load_cutlist(str(cutlist_path))
    canonical = transcript_mod.remap_to_cutlist(corrected, cl)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    transcript_mod.write_canonical_transcript(str(out_path), canonical)

    print(f"[write_canonical_transcript] {out_path} — {len(canonical['words'])} words, "
          f"{len(corrections)} correction(s) applied, duration {canonical['duration']:.2f}s")


if __name__ == "__main__":
    main()
