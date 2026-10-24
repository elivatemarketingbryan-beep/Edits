#!/usr/bin/env python3
"""
lib/filler_detect.py — decide what to cut, from word-aligned transcript
timestamps only. Boundary REFINEMENT against real audio happens later,
in lib/cutlist.py via audio_boundaries.BoundaryMeasurer — this module
never touches raw audio, and never mutates the words it's given.

Input:  a list of word dicts from transcript/words.json:
        {"word": str, "start": float, "end": float, "score": float}
Output: a list of raw candidate spans (approximate — pre-measurement),
        in chronological order, covering [words[0].start, words[-1].end]
        with no gaps and no overlaps:
        {"start": float, "end": float, "kept": bool, "reason": str}

Implementation note: drop regions (fillers, and gaps too long to be a
natural pause) are computed independently first and merged, THEN
inverted into kept spans — not accumulated with a running cursor. A
cursor-based single pass is tempting but has a sharp edge: a filler word
immediately followed by a long pause needs the pause detected against
the PREVIOUS non-filler word's end, not against the filler's own end,
and a single pass that `continue`s on filler words skips that check
entirely, silently folding real dead air into the next kept span.
"""
from __future__ import annotations

FILLER_WORDS = {
    "um", "umm", "uh", "uhh", "uhm", "erm", "hm", "hmm", "mhm",
}

# Dead air: a gap between consecutive words longer than this is trimmed
# down to NATURAL_PAUSE_S (excess removed from the middle), not butted
# together — a hard zero-gap splice reads as robotic.
MAX_PAUSE_S = 0.7
NATURAL_PAUSE_S = 0.2


def _is_filler(word: str) -> bool:
    return word.strip().lower().strip(".,!?").strip() in FILLER_WORDS


def _drop_regions(words: list[dict]) -> list[tuple[float, float, str]]:
    regions: list[tuple[float, float, str]] = []

    for w in words:
        if _is_filler(w["word"]):
            regions.append((w["start"], w["end"], f"filler:{w['word'].strip().lower()}"))

    for a, b in zip(words, words[1:]):
        gap = b["start"] - a["end"]
        if gap > MAX_PAUSE_S:
            regions.append((a["end"] + NATURAL_PAUSE_S / 2, b["start"] - NATURAL_PAUSE_S / 2, "dead-air"))

    regions.sort(key=lambda r: r[0])
    return _merge_regions(regions)


def _merge_regions(regions: list[tuple[float, float, str]]) -> list[tuple[float, float, str]]:
    """Merge overlapping/adjacent drop regions (e.g. a filler word
    immediately followed by a too-long pause). The merged region keeps
    the first region's reason label — good enough for a human skimming
    the cut list; both underlying causes are still visible in the raw
    transcript if someone needs to dig in."""
    if not regions:
        return []
    merged = [regions[0]]
    for start, end, reason in regions[1:]:
        last_start, last_end, last_reason = merged[-1]
        if start <= last_end:
            merged[-1] = (last_start, max(last_end, end), last_reason)
        else:
            merged.append((start, end, reason))
    return merged


def build_candidate_spans(words: list[dict]) -> list[dict]:
    if not words:
        return []

    drops = _drop_regions(words)
    spans: list[dict] = []
    cursor = words[0]["start"]
    timeline_end = words[-1]["end"]

    for start, end, reason in drops:
        start, end = max(start, cursor), min(end, timeline_end)
        if end <= start:
            continue
        if start > cursor:
            spans.append({"start": cursor, "end": start, "kept": True, "reason": "speech"})
        spans.append({"start": start, "end": end, "kept": False, "reason": reason})
        cursor = end

    if timeline_end > cursor:
        spans.append({"start": cursor, "end": timeline_end, "kept": True, "reason": "speech"})

    return spans
