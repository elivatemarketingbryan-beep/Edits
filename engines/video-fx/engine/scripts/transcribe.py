#!/usr/bin/env python3
"""Word-level transcript with faster-whisper. Runs locally; no API key.

Writes words.json: {"language": "en", "words": [{"text", "start", "end"}], "text": "..."}
Times are seconds from the start of the (already trimmed) source clip.
"""
import argparse
import json
from pathlib import Path

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--input", required=True)
parser.add_argument("--output", required=True)
parser.add_argument("--model", default="small")
parser.add_argument("--language", default=None)
parser.add_argument(
    "--vocab",
    default="Claude, Claude Code, Anthropic, AI, Skool, course",
    help="names and terms to bias recognition toward (comma separated)",
)
args = parser.parse_args()

from faster_whisper import WhisperModel  # noqa: E402

model = WhisperModel(args.model, device="cpu", compute_type="int8")
segments, info = model.transcribe(
    args.input,
    language=args.language,
    word_timestamps=True,
    vad_filter=True,
    condition_on_previous_text=False,
    initial_prompt=f"Vocabulary: {args.vocab}." if args.vocab else None,
)
words = []
for seg in segments:
    for w in seg.words or []:
        text = w.word.strip()
        if not text or w.end <= w.start:
            continue
        words.append({"text": text, "start": round(w.start, 3), "end": round(w.end, 3)})
Path(args.output).write_text(json.dumps({
    "language": info.language,
    "text": " ".join(w["text"] for w in words),
    "words": words,
}, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
print(f"Transcribed {len(words)} words -> {args.output}")
