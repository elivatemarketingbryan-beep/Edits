#!/usr/bin/env python3
"""
scripts/transcribe.py — WhisperX large-v3 transcribe + word alignment.

LOCK: "Transcribe ONCE per video into transcript/words.json, reuse
forever ... Nothing downstream ever re-transcribes."

This script REFUSES to overwrite an existing transcript/words.json.
If you need to fix words, use transcript/corrections.json (see
lib/transcript.py) — that's the only sanctioned path, and it only
touches the canonical derived transcript, never this file.

usage: uv run scripts/transcribe.py <job-name> [--model large-v3] [--language en]
reads:  projects/<job>/raw/<the one file in raw/>
writes: projects/<job>/transcript/words.json
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[4]


def find_raw_file(job_dir: Path) -> Path:
    raw_dir = job_dir / "raw"
    candidates = [p for p in raw_dir.iterdir() if p.is_file() and not p.name.startswith(".")]
    if not candidates:
        raise SystemExit(f"no raw file found in {raw_dir}")
    if len(candidates) > 1:
        raise SystemExit(
            f"multiple files in {raw_dir}: {[c.name for c in candidates]} — "
            "this pipeline is one raw file per job; move extras to broll/ if they're not the primary take"
        )
    return candidates[0]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("job")
    ap.add_argument("--model", default="large-v3")
    ap.add_argument("--language", default=None, help="omit to let whisperx auto-detect")
    args = ap.parse_args()

    job_dir = REPO_ROOT / "projects" / args.job
    if not job_dir.is_dir():
        raise SystemExit(f"no such project: projects/{args.job} — run scripts/new-project.sh {args.job} first")

    transcript_dir = job_dir / "transcript"
    words_path = transcript_dir / "words.json"
    if words_path.exists():
        print(f"[transcribe] {words_path} already exists — refusing to re-transcribe. "
              f"Fix spellings via transcript/corrections.json instead.", file=sys.stderr)
        sys.exit(0)

    transcript_dir.mkdir(parents=True, exist_ok=True)
    raw_file = find_raw_file(job_dir)

    import whisperx  # imported lazily so `--help` works without the heavy deps installed

    device = "cuda" if _cuda_available() else "cpu"
    compute_type = "float16" if device == "cuda" else "int8"

    print(f"[transcribe] loading whisperx {args.model} on {device} ({compute_type})", file=sys.stderr)
    model = whisperx.load_model(args.model, device, compute_type=compute_type, language=args.language)

    audio = whisperx.load_audio(str(raw_file))
    result = model.transcribe(audio, batch_size=16)
    language = result.get("language", args.language or "en")

    print(f"[transcribe] aligning words (language={language})", file=sys.stderr)
    align_model, align_metadata = whisperx.load_align_model(language_code=language, device=device)
    aligned = whisperx.align(result["segments"], align_model, align_metadata, audio, device, return_char_alignments=False)

    words = []
    for seg in aligned["segments"]:
        for w in seg.get("words", []):
            if "start" not in w or "end" not in w:
                continue  # alignment sometimes drops timing for a token; skip rather than guess
            words.append({
                "word": w["word"],
                "start": round(float(w["start"]), 4),
                "end": round(float(w["end"]), 4),
                "score": round(float(w.get("score", 0.0)), 4),
            })

    doc = {
        "source": f"raw/{raw_file.name}",
        "model": args.model,
        "language": language,
        "words": words,
    }
    with open(words_path, "w", encoding="utf-8") as f:
        json.dump(doc, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"[transcribe] wrote {len(words)} words to {words_path}")


def _cuda_available() -> bool:
    try:
        import torch
        return torch.cuda.is_available()
    except Exception:
        return False


if __name__ == "__main__":
    main()
