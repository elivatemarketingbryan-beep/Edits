#!/usr/bin/env python3
"""
.claude/skills/captions/scripts/prepare_captions_project.py

Bridges this pipeline's canonical transcript into the embedded-captions
vendor skill's expected project shape, WITHOUT letting it re-transcribe.

LOCK: "Captions short-form only, built from the canonical transcript,
never re-transcribed."

embedded-captions' transcribe.cjs only re-runs Whisper if it can't find
an already-normalized transcript.json at
`{"words": [{"text","start","end","type":"word"}], "language_code": "..."}`.
This script writes exactly that file, sourced from
outputs/.transcript.json (the cut-remapped, corrections-applied
canonical transcript) — never from transcript/words.json.

usage: uv run .claude/skills/captions/scripts/prepare_captions_project.py <job-name> [--language en]
reads:  projects/<job>/outputs/.transcript.json
        projects/<job>/outputs/<job>-graphics.mp4 (falls back to .roughcut.mp4)
writes: projects/<job>/captions/source.mp4   (copy)
        projects/<job>/captions/transcript.json  (normalized, embedded-captions schema)
"""
from __future__ import annotations

import argparse
import json
import shutil
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[4]


def find_source_video(job_dir: Path) -> Path:
    for name in (f"{job_dir.name}-graphics.mp4", ".roughcut.mp4"):
        candidate = job_dir / "outputs" / name
        if candidate.exists():
            return candidate
    raise SystemExit(
        f"no rendered video found in {job_dir/'outputs'} — run graphics-plan "
        f"(or at least rough-cut's assemble_rough_cut.sh) before captions"
    )


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("job")
    ap.add_argument("--language", default="en")
    args = ap.parse_args()

    job_dir = REPO_ROOT / "projects" / args.job
    canonical_path = job_dir / "outputs" / ".transcript.json"
    if not canonical_path.exists():
        raise SystemExit(f"missing {canonical_path} — run /rough-cut through write_canonical_transcript.py first")

    with open(canonical_path, encoding="utf-8") as f:
        canonical = json.load(f)

    source_video = find_source_video(job_dir)

    captions_dir = job_dir / "captions"
    captions_dir.mkdir(parents=True, exist_ok=True)

    dest_video = captions_dir / "source.mp4"
    if not dest_video.exists() or dest_video.stat().st_mtime < source_video.stat().st_mtime:
        shutil.copyfile(source_video, dest_video)

    normalized = {
        "words": [
            {"text": w["word"], "start": w["start"], "end": w["end"], "type": "word"}
            for w in canonical["words"]
        ],
        "language_code": args.language,
    }
    with open(captions_dir / "transcript.json", "w", encoding="utf-8") as f:
        json.dump(normalized, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"[prepare_captions_project] {captions_dir}/source.mp4  <- {source_video.relative_to(job_dir)}")
    print(f"[prepare_captions_project] {captions_dir}/transcript.json  ({len(normalized['words'])} words, "
          f"language_code={args.language}) — sourced from outputs/.transcript.json, NOT words.json")
    print("[prepare_captions_project] verify embedded-captions' prepare.sh logs 'transcript.json found' "
          "(skip) and not a Whisper invocation, before trusting this run")


if __name__ == "__main__":
    main()
