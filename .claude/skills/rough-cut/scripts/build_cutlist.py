#!/usr/bin/env python3
"""
scripts/build_cutlist.py — turn transcript/words.json into cutlist.json.

Pipeline: filler/dead-air detection on transcript timestamps (approximate)
-> measure every kept-segment boundary against the raw audio's RMS
envelope (real) -> pad outside the measured edge -> snap to the video
frame grid. See lib/filler_detect.py and lib/audio_boundaries.py for the
two locks this implements.

usage: uv run scripts/build_cutlist.py <job-name> [--crossfade-ms 80]
reads:  projects/<job>/transcript/words.json
        projects/<job>/raw/<file>
writes: projects/<job>/cutlist.json
        projects/<job>/.cache/raw-audio.wav   (reusable mono extraction)
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[4] / "lib"))

import cutlist as cutlist_mod
from filler_detect import build_candidate_spans

REPO_ROOT = Path(__file__).resolve().parents[4]


def extract_mono_wav(raw_file: Path, cache_dir: Path) -> Path:
    """Cache lives in the job folder (never /tmp — macOS clears it), and
    is safe to delete via prune.sh; it's fully regenerable from raw/."""
    cache_dir.mkdir(parents=True, exist_ok=True)
    wav_path = cache_dir / "raw-audio.wav"
    if wav_path.exists():
        return wav_path
    subprocess.run(
        ["ffmpeg", "-y", "-i", str(raw_file), "-ac", "1", "-ar", "48000", str(wav_path)],
        check=True,
    )
    return wav_path


def find_raw_file(job_dir: Path, declared_source: str | None) -> Path:
    if declared_source:
        return job_dir / declared_source
    raw_dir = job_dir / "raw"
    candidates = [p for p in raw_dir.iterdir() if p.is_file() and not p.name.startswith(".")]
    if len(candidates) != 1:
        raise SystemExit(f"expected exactly one file in {raw_dir}, found {len(candidates)}")
    return candidates[0]


def probe_fps(path: Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0",
         "-show_entries", "stream=r_frame_rate",
         "-of", "default=noprint_wrappers=1:nokey=1", str(path)],
        check=True, capture_output=True, text=True,
    ).stdout.strip()
    num, _, den = out.partition("/")
    den = den or "1"
    return float(num) / float(den)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("job")
    ap.add_argument("--crossfade-ms", type=int, default=80)
    args = ap.parse_args()

    job_dir = REPO_ROOT / "projects" / args.job
    words_path = job_dir / "transcript" / "words.json"
    if not words_path.exists():
        raise SystemExit(f"no {words_path} — run scripts/transcribe.py {args.job} first")

    with open(words_path, encoding="utf-8") as f:
        words_doc = json.load(f)
    words = words_doc["words"]

    raw_file = find_raw_file(job_dir, words_doc.get("source"))
    fps = probe_fps(raw_file)
    wav_path = extract_mono_wav(raw_file, job_dir / ".cache")

    candidate_spans = build_candidate_spans(words)
    segments = cutlist_mod.refine_and_snap(candidate_spans, str(wav_path), fps)

    out_path = job_dir / "cutlist.json"
    cutlist_mod.write_cutlist(
        str(out_path), args.job, f"raw/{raw_file.name}", fps, args.crossfade_ms, segments
    )

    kept = [s for s in segments if s.kept]
    dropped = [s for s in segments if not s.kept]
    kept_dur = sum(s.end - s.start for s in kept)
    dropped_dur = sum(s.end - s.start for s in dropped)
    print(f"[build_cutlist] {out_path}")
    print(f"[build_cutlist] kept {len(kept)} segments ({kept_dur:.1f}s), dropped {len(dropped)} ({dropped_dur:.1f}s)")


if __name__ == "__main__":
    main()
