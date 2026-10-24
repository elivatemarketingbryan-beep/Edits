#!/usr/bin/env python3
"""
lib/transcript.py — corrections + canonical transcript remap.

LOCKS:
  "Transcribe ONCE per video into transcript/words.json, reuse forever.
   Derive a canonical outputs/.transcript.json by remapping kept words
   through the cut list. Nothing downstream ever re-transcribes."
  "Transcript spelling fixes live upstream in one corrections file
   applied as the canonical transcript is written, single-token
   whole-word swaps only, text never timings. The raw words.json stays
   untouched."

transcript/words.json   — raw WhisperX output. NEVER edited by this module.
transcript/corrections.json — optional, user-maintained:
    {"corrections": [{"from": "teh", "to": "the"}, {"from": "gonna", "to": "going to"}]}
  `from` must be a single word token (whole-word, case-insensitive match).
  `to` is written verbatim in its place. Timings are never touched.

outputs/.transcript.json — canonical, derived, safe for every downstream
  consumer (captions, editing-app handoff review, QA). Positions are on
  the OUTPUT (rendered) timeline, via lib.cutlist.output_offsets.
"""
from __future__ import annotations

import json
import re

import cutlist as cutlist_mod


def load_words(path: str) -> list[dict]:
    with open(path, encoding="utf-8") as f:
        doc = json.load(f)
    return doc["words"]


def load_corrections(path: str) -> list[dict]:
    try:
        with open(path, encoding="utf-8") as f:
            doc = json.load(f)
    except FileNotFoundError:
        return []
    corrections = doc.get("corrections", [])
    for c in corrections:
        if " " in c["from"].strip():
            raise ValueError(f"corrections.json: 'from' must be a single word token, got {c['from']!r}")
    return corrections


def apply_corrections(words: list[dict], corrections: list[dict]) -> list[dict]:
    """Returns a NEW list of word dicts with corrected text. Timings are
    copied through unchanged. The input `words` (and the words.json file
    it came from) is never mutated."""
    table = {c["from"].strip().lower(): c["to"] for c in corrections}
    out = []
    for w in words:
        bare = re.sub(r"^[^\w]+|[^\w]+$", "", w["word"]).lower()
        fixed_word = w["word"]
        if bare in table:
            # preserve any leading/trailing punctuation captured by the ASR
            lead = re.match(r"^[^\w]*", w["word"]).group(0)
            trail = re.search(r"[^\w]*$", w["word"]).group(0)
            fixed_word = f"{lead}{table[bare]}{trail}"
        out.append({**w, "word": fixed_word})
    return out


def remap_to_cutlist(words: list[dict], cl: dict) -> dict:
    """Keep only words that fall inside a kept cutlist segment, and
    rewrite their start/end onto the output timeline."""
    kept = cutlist_mod.kept_segments(cl)
    offsets = cutlist_mod.output_offsets(cl)

    out_words = []
    for seg in kept:
        seg_offset = offsets[seg["index"]]
        for w in words:
            # a word belongs to this segment if its midpoint falls inside it
            mid = (w["start"] + w["end"]) / 2.0
            if seg["start"] <= mid < seg["end"]:
                shift = seg_offset - seg["start"]
                out_words.append({
                    "word": w["word"],
                    "start": round(w["start"] + shift, 4),
                    "end": round(w["end"] + shift, 4),
                })

    out_words.sort(key=lambda w: w["start"])
    return {
        "job": cl["job"],
        "duration": round(cutlist_mod.total_output_duration(cl), 4),
        "words": out_words,
        "text": " ".join(w["word"] for w in out_words),
    }


def write_canonical_transcript(out_path: str, canonical: dict) -> None:
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(canonical, f, indent=2, ensure_ascii=False)
        f.write("\n")
