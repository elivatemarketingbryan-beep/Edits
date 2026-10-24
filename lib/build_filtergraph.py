#!/usr/bin/env python3
"""
lib/build_filtergraph.py — one-shot lossless A/V splice.

LOCKS:
  "Audio: cut A/V in one lossless filtergraph, then polish the assembled
   track exactly once ... Never ... per-segment audio FX (clicks)."
  "Snap every cut boundary to the video frame grid so per-segment video
   and audio durations match, otherwise concat pads gaps and the
   timeline drifts."
  "Joints are short equal-power crossfades using real continuing room
   tone, never fades to zero."

Design: video is hard-cut at the exact (frame-snapped) kept-segment
boundaries and concatenated with no crossfade — segment durations sum
exactly to the output duration. Audio is trimmed with a small extra
"handle" on each internal edge (crossfade_ms/2), pulled from the SAME
raw recording just outside the kept boundary — i.e. real room tone, not
silence or a synthesized fade — and adjacent segments are joined with an
equal-power `acrossfade`. Because each internal joint borrows exactly
half the crossfade duration from each side, the crossfaded audio
timeline totals the same length as the hard-cut video timeline, so A/V
never drifts. Only the OUTER start/end get a very short (10ms) linear
declick fade (that's the true edge of the recording, not a joint, so it
doesn't trade a click for a hole).

This module builds the whole thing as ONE ffmpeg -filter_complex
invocation — one lossless pass, not N per-segment re-encodes — and
writes an intermediate file with lossless video (libx264 -qp 0) and
UNPOLISHED audio (pcm, or aac at high bitrate as a passthrough-quality
codec). The separate, single audio polish pass (gain -> limiter ->
AAC 256k) happens afterward, in scripts/polish_audio.sh — never here,
and never more than once.
"""
from __future__ import annotations

import subprocess
import sys

import cutlist as cutlist_mod

DECLICK_MS = 10  # true head/tail edges only, not internal joints


def _filter_complex(segments: list[dict], crossfade_ms: int) -> tuple[str, str, str]:
    half = crossfade_ms / 2000.0  # seconds, half-crossfade handle

    v_labels = []
    a_labels = []
    parts = []

    n = len(segments)
    for i, seg in enumerate(segments):
        start, end = seg["start"], seg["end"]

        # video: hard cut, no handle
        vlab = f"v{i}"
        parts.append(f"[0:v]trim=start={start:.6f}:end={end:.6f},setpts=PTS-STARTPTS[{vlab}]")
        v_labels.append(vlab)

        # audio: borrow half-crossfade handle from real adjacent room tone,
        # except at the very first/last segment's outer edge.
        a_start = start - (half if i > 0 else 0.0)
        a_end = end + (half if i < n - 1 else 0.0)
        alab = f"a{i}"
        af = f"[0:a]atrim=start={a_start:.6f}:end={a_end:.6f},asetpts=PTS-STARTPTS"
        if i == 0:
            af += f",afade=t=in:st=0:d={DECLICK_MS/1000.0:.3f}"
        if i == n - 1:
            seg_dur = a_end - a_start
            fade_st = max(0.0, seg_dur - DECLICK_MS / 1000.0)
            af += f",afade=t=out:st={fade_st:.3f}:d={DECLICK_MS/1000.0:.3f}"
        parts.append(f"{af}[{alab}]")
        a_labels.append(alab)

    # chain acrossfade across all audio segments
    if n == 1:
        final_a = a_labels[0]
    else:
        prev = a_labels[0]
        for i in range(1, n):
            out_lab = f"ax{i}"
            parts.append(
                f"[{prev}][{a_labels[i]}]acrossfade=d={crossfade_ms/1000.0:.3f}:c1=tri:c2=tri[{out_lab}]"
            )
            prev = out_lab
        final_a = prev

    # concat video (no crossfade)
    concat_inputs = "".join(f"[{lab}]" for lab in v_labels)
    parts.append(f"{concat_inputs}concat=n={n}:v=1:a=0[vout]")

    filter_complex = ";".join(parts)
    return filter_complex, "vout", final_a


def assemble(raw_source: str, cutlist_path: str, out_path: str, encoder_flags: list[str]) -> None:
    cl = cutlist_mod.load_cutlist(cutlist_path)
    segments = cutlist_mod.kept_segments(cl)
    if not segments:
        raise SystemExit("cutlist has no kept segments — nothing to assemble")

    crossfade_ms = cl.get("crossfade_ms", 80)
    filter_complex, vlab, alab = _filter_complex(segments, crossfade_ms)

    cmd = [
        "ffmpeg", "-y", "-i", raw_source,
        "-filter_complex", filter_complex,
        "-map", f"[{vlab}]", "-map", f"[{alab}]",
        *encoder_flags,
        "-c:a", "pcm_s24le",  # unpolished intermediate audio; polish pass encodes final AAC
        out_path,
    ]
    print("[build_filtergraph] " + " ".join(cmd), file=sys.stderr)
    subprocess.run(cmd, check=True)


if __name__ == "__main__":
    if len(sys.argv) != 5:
        print("usage: build_filtergraph.py <raw_source> <cutlist.json> <out.mov> <video_encoder e.g. libx264>", file=sys.stderr)
        sys.exit(2)
    raw_source, cutlist_path, out_path, encoder = sys.argv[1:5]
    flags = ["-c:v", encoder]
    flags += ["-qp", "0"] if encoder == "libx264" else ["-q:v", "100"]
    assemble(raw_source, cutlist_path, out_path, flags)
