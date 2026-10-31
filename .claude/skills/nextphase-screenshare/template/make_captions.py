#!/usr/bin/env python3
"""make_captions.py — the caption plan for THIS video.

    python3 make_captions.py        assets/transcript-tight.json -> assets/captions.json

The quick proposer (the skill's scripts/build-captions.py) holds each chunk
until the NEXT word onset, which on a real take gives a ~45-frame median
against the style's measured 18, and it can break chunks across sentence
boundaries. This builds them the way reference/captions.md describes:

  * never cross a sentence boundary
  * break on commas and on sense, 2-4 words typically, 6 at the most
  * the chunk holds for the span of its own words plus a short tail, it is not
    stretched to the next onset — so the hold tracks how fast the creator talks
  * proper nouns are corrected: speech-to-text is confident and wrong on
    product names, people and jargon — fill WORD_FIX / PHRASE_FIX / FUSE
    from THIS transcript before you trust a single caption

⚠ assets/transcript-tight.json is the only timing source.
"""
import json, re, sys, os

FPS = 30
V = os.path.dirname(os.path.abspath(__file__))
MIN_HOLD = 10          # below this the 2-frame fade reads as a flicker
TAIL = 4               # frames held past the last word's end
MAX_W = 4
# Inter 700 at 80px averages ~0.52em of advance, so --ss-cap-max (1100px)
# is about 26 characters. Past that the style re-chunks; it never shrinks type.
MAX_CHARS = 26

# ── transcription corrections, applied per word before chunking ──────────
# e.g. {"chatgbt": "ChatGPT", "superbase": "Supabase"}  (keys: lowercase, letters only)
WORD_FIX = {}
# phrase-level fixes, matched on the joined text of a chunk (case-insensitive)
# e.g. (r"sitemap XML", "sitemap.xml")
PHRASE_FIX = []
# (start, end) spans in seconds that deliberately run with NO caption — e.g. a
# word you cannot make out. Never put a guessed word in the creator's mouth;
# an uncaptioned beat is allowed by the style (captions.md §3.5).
NO_CAPTION = []

# never END a chunk on one of these — it leaves a dangling article or
# preposition and splits the noun phrase the chunk was supposed to hold.
WEAK_TAIL = {"a", "an", "the", "to", "of", "for", "in", "on", "at", "and",
             "or", "is", "are", "was", "be", "your", "my", "this", "that",
             "with", "from", "it's", "you", "i", "so", "can", "can't",
             "don't", "doesn't", "will", "would", "every", "one"}


def fix_word(w):
    bare = re.sub(r"[^A-Za-z]", "", w).lower()
    if bare in WORD_FIX:
        rep = WORD_FIX[bare]
        trail = re.match(r".*?([^A-Za-z]*)$", w).group(1)
        if rep.endswith(",") and trail == ",":
            trail = ""
        return rep + trail
    return w


def main():
    words = json.load(open(f"{V}/assets/transcript-tight.json"))
    sp = f"{V}/assets/sentences-tight.json"
    if os.path.exists(sp):
        sents = json.load(open(sp))
    else:                       # derive sentences from terminal punctuation
        sents, cur = [], []
        for w in words:
            cur.append(w)
            if w["text"][-1:] in ".?!":
                sents.append({"start": cur[0]["start"], "end": w["end"]}); cur = []
        if cur:
            sents.append({"start": cur[0]["start"], "end": cur[-1]["end"]})

    for w in words:
        w["text"] = fix_word(w["text"])

    # "Chat GPT" often arrives as two words and must never split across a caption
    fused = []
    for w in words:
        if (fused and re.fullmatch(r"Chat", fused[-1]["text"])
                and re.match(r"GPT", w["text"])):
            fused[-1]["text"] = "ChatGPT" + w["text"][3:]
            fused[-1]["end"] = w["end"]
            continue
        fused.append(w)
    words = fused

    # multi-word terms that must never split across two captions, fused into
    # one token before chunking (matched case-insensitively, punctuation kept
    # from the last word)
    # e.g. (["ten", "thousand", "dollar"], "$10,000"), (["alt", "text"], "alt text")
    FUSE = []
    out_w, i = [], 0
    while i < len(words):
        for seq, rep in FUSE:
            got = [re.sub(r"[^a-z0-9]", "", x["text"].lower())
                   for x in words[i:i + len(seq)]]
            if got == seq:
                trail = re.match(r".*?([^A-Za-z0-9]*)$", words[i + len(seq) - 1]["text"]).group(1)
                w = dict(words[i]); w["text"] = rep + trail
                w["end"] = words[i + len(seq) - 1]["end"]
                out_w.append(w); i += len(seq); break
        else:
            out_w.append(words[i]); i += 1
    words = out_w

    # assign each word to a sentence so chunks never straddle one
    si = 0
    for w in words:
        while si + 1 < len(sents) and w["start"] >= sents[si]["end"] - 1e-6:
            si += 1
        w["sent"] = si

    chunks, cur = [], []

    def flush():
        if cur:
            chunks.append(list(cur))
            cur.clear()

    for i, w in enumerate(words):
        cur.append(w)
        nxt = words[i + 1] if i + 1 < len(words) else None
        text = w["text"]
        hard = bool(re.search(r"[.!?]$", text))
        soft = bool(re.search(r"[,;:]$", text))
        gap = (nxt["start"] - w["end"]) if nxt else 99.0
        newsent = nxt is not None and nxt["sent"] != w["sent"]
        width = len(" ".join(x["text"] for x in cur))
        nxt_width = width + 1 + len(nxt["text"]) if nxt else width
        weak = re.sub(r"[^A-Za-z']", "", text).lower() in WEAK_TAIL
        if (weak and not hard and not newsent and nxt is not None
                and len(cur) < MAX_W + 1 and nxt_width <= MAX_CHARS):
            continue
        if nxt is not None and nxt_width > MAX_CHARS:
            flush(); continue
        if (hard or newsent or nxt is None
                or gap >= 0.28
                or (soft and len(cur) >= 2)
                or len(cur) >= MAX_W
                or (len(cur) >= 3 and gap >= 0.06)
                or (len(cur) >= 2 and gap >= 0.16)):
            flush()
    flush()

    # a 1-word orphan joins its neighbour inside the same sentence
    merged = []
    for c in chunks:
        if (merged and len(c) == 1 and len(merged[-1]) + 1 <= MAX_W
                and merged[-1][-1]["sent"] == c[0]["sent"]):
            merged[-1].extend(c)
        else:
            merged.append(c)

    # push a dangling weak tail into the following chunk
    for i in range(len(merged) - 1):
        a, b = merged[i], merged[i + 1]
        if len(a) < 2 or len(b) >= MAX_W or a[-1]["sent"] != b[0]["sent"]:
            continue
        t = re.sub(r"[^A-Za-z']", "", a[-1]["text"]).lower()
        if (t in WEAK_TAIL and not re.search(r"[.,;:!?]$", a[-1]["text"])
                and len(" ".join(x["text"] for x in b)) + 1 + len(a[-1]["text"]) <= MAX_CHARS):
            b.insert(0, a.pop())

    plan = []
    for i, c in enumerate(merged):
        text = " ".join(x["text"] for x in c).strip()
        for pat, rep in PHRASE_FIX:
            text = re.sub(pat, rep, text, flags=re.I)
        text = re.sub(r"\s+", " ", text)
        text = re.sub(r"[.]$", "", text)            # terminal periods read as clutter
        f_in = round(c[0]["start"] * FPS)
        f_out = round(c[-1]["end"] * FPS) + TAIL
        if f_out - f_in < MIN_HOLD:
            f_out = f_in + MIN_HOLD
        plan.append({"text": text, "in": f_in, "out": f_out,
                     "t_in": round(f_in / FPS, 4)})

    # clip overlaps, then drop the suppressed spans
    for i in range(len(plan) - 1):
        if plan[i]["out"] >= plan[i + 1]["in"]:
            plan[i]["out"] = plan[i + 1]["in"]
    out = []
    for p in plan:
        t = p["in"] / FPS
        if any(a <= t < b for a, b in NO_CAPTION):
            continue
        p["hold"] = p["out"] - p["in"]
        if p["hold"] >= MIN_HOLD - 1 and p["text"]:
            out.append(p)

    holds = sorted(x["out"] - x["in"] for x in out)
    wc = [len(x["text"].split()) for x in out]
    print(f"chunks {len(out)}")
    print(f"hold  median {holds[len(holds)//2]}  min {holds[0]}  max {holds[-1]}"
          f"   [reference median 18]")
    print(f"words median {sorted(wc)[len(wc)//2]}  max {max(wc)}   [style 2-6]")
    print(f"widest {max(len(x['text']) for x in out)} chars  "
          f"[--ss-cap-max is ~{MAX_CHARS}]")
    total = max(w["end"] for w in words)
    print(f"coverage {100*sum(x['out']-x['in'] for x in out)/(total*FPS):.0f}% of runtime")
    json.dump(out, open(f"{V}/assets/captions.json", "w"), indent=1)
    print(f"wrote assets/captions.json")


if __name__ == "__main__":
    main()
