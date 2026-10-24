# Called by scripts/transcribe.sh. Writes {"language", "segments": [...], "words": [{"w","s","e"}]}.
import json
import sys

import whisperx

wav, out = sys.argv[1], sys.argv[2]


def run(device, compute):
    model = whisperx.load_model("large-v3", device, compute_type=compute)
    audio = whisperx.load_audio(wav)
    result = model.transcribe(audio, batch_size=16 if device == "cuda" else 4)
    align, meta = whisperx.load_align_model(language_code=result["language"], device=device)
    aligned = whisperx.align(result["segments"], align, meta, audio, device)
    return result["language"], aligned


try:
    import torch
    if not torch.cuda.is_available():
        raise RuntimeError("no CUDA")
    lang, aligned = run("cuda", "float16")
    used = "cuda float16"
except Exception as e:  # any CUDA problem: CPU int8 keeps the job moving
    print(f"GPU path failed ({e}); using CPU int8", file=sys.stderr)
    lang, aligned = run("cpu", "int8")
    used = "cpu int8"

words = []
for seg in aligned["segments"]:
    for w in seg.get("words", []):
        if "start" in w and "end" in w:
            words.append({"w": w["word"].strip(), "s": round(w["start"], 3), "e": round(w["end"], 3)})
segments = [{"start": round(s["start"], 3), "end": round(s["end"], 3), "text": s["text"].strip()} for s in aligned["segments"]]
with open(out, "w", encoding="utf-8") as f:
    json.dump({"language": lang, "engine": used, "segments": segments, "words": words}, f, ensure_ascii=False, indent=1)
print(f"{len(words)} words, {len(segments)} segments, {used} -> {out}")
