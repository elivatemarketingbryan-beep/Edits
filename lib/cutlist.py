#!/usr/bin/env python3
"""
lib/cutlist.py — the cut list data model.

A cutlist.json is the single source of truth for where a job's rough cut
draws its boundaries. Everything downstream (audio assembly, canonical
transcript remap, the editing-app handoff, captions) reads this file and
never re-derives cut points on its own.

Schema:
{
  "job": "kebab-case-name",
  "source": "raw/<original file>.mp4",
  "fps": 29.970,
  "crossfade_ms": 80,
  "segments": [
    {"index": 0, "start": 0.0, "end": 12.4, "kept": true,  "reason": "speech"},
    {"index": 1, "start": 12.4, "end": 12.9, "kept": false, "reason": "filler:um"},
    ...
  ]
}
`start`/`end` are always in SOURCE (raw file) time. Only `kept` segments
render. Dropped segments are kept in the list (not deleted) so a human
reviewing the cut list can see exactly what was removed and why.
"""
from __future__ import annotations

import json
from dataclasses import dataclass, asdict

from audio_boundaries import BoundaryMeasurer, snap_to_frame


@dataclass
class Segment:
    index: int
    start: float
    end: float
    kept: bool
    reason: str


def refine_and_snap(
    candidate_spans: list[dict],
    raw_wav_path: str,
    fps: float,
) -> list[Segment]:
    """Take approximate (transcript-timestamp) spans, measure each KEPT
    span's boundaries against the real raw audio, pad outward into
    silence, and snap to the video frame grid. Dropped spans are passed
    through with their approximate timestamps snapped to the frame grid
    too, purely for legibility in the cut list — they never render."""
    bm = BoundaryMeasurer(raw_wav_path)
    segments: list[Segment] = []

    for i, span in enumerate(candidate_spans):
        if span["kept"]:
            # Always measure against the real audio — there is no
            # special case for the first kept span. It is only ever
            # video-absolute-zero by coincidence, never by construction
            # (build_candidate_spans starts the timeline at the first
            # WORD's timestamp, not at t=0).
            real_start = bm.measure_onset(span["start"])
            real_end = bm.measure_offset(span["end"])
            start = snap_to_frame(real_start, fps, "floor")
            end = snap_to_frame(real_end, fps, "ceil")
        else:
            start = snap_to_frame(span["start"], fps, "nearest")
            end = snap_to_frame(span["end"], fps, "nearest")

        if end <= start:
            continue  # measurement collapsed the span to nothing; drop it

        segments.append(Segment(i, start, end, span["kept"], span["reason"]))

    # Re-index and drop degenerate zero-length kept segments after snap.
    return [Segment(i, s.start, s.end, s.kept, s.reason) for i, s in enumerate(segments)]


def write_cutlist(path: str, job: str, source: str, fps: float, crossfade_ms: int, segments: list[Segment]) -> None:
    doc = {
        "job": job,
        "source": source,
        "fps": fps,
        "crossfade_ms": crossfade_ms,
        "segments": [asdict(s) for s in segments],
    }
    with open(path, "w", encoding="utf-8") as f:
        json.dump(doc, f, indent=2)
        f.write("\n")


def load_cutlist(path: str) -> dict:
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def kept_segments(cutlist: dict) -> list[dict]:
    return [s for s in cutlist["segments"] if s["kept"]]


def output_offsets(cutlist: dict) -> dict[int, float]:
    """Map each kept segment's `index` to its start time on the OUTPUT
    (rendered) timeline. Because audio crossfades are built symmetrically
    (half the crossfade duration borrowed from real room tone on each
    side of a joint), the assembled audio timeline length equals the sum
    of kept segment durations exactly — same as the hard-cut video
    timeline. So both video and the canonical transcript can use this
    single cumulative-duration offset map."""
    offsets = {}
    t = 0.0
    for s in kept_segments(cutlist):
        offsets[s["index"]] = t
        t += s["end"] - s["start"]
    return offsets


def total_output_duration(cutlist: dict) -> float:
    return sum(s["end"] - s["start"] for s in kept_segments(cutlist))
