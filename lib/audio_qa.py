#!/usr/bin/env python3
"""
lib/audio_qa.py — mandatory QA pass after every splice.

LOCK: "Run an audio QA pass after every splice: joint clicks, silence
gaps, limiter pressure. Print warnings, do not silently pass."

Checks:
  1. Joint clicks   — a sample-to-sample discontinuity at/near each
     cutlist joint timestamp (on the OUTPUT timeline) bigger than would
     occur in ordinary continuous audio.
  2. Silence gaps   — any unbroken digital-silence run longer than
     SILENCE_GAP_S, other than a brief window at the very start/end.
  3. Limiter pressure — how much of the track is sitting within a hair
     of the -6dBFS ceiling, which signals the limiter is doing heavy
     lifting (source gain-staging is off) even though it isn't clipping.

Exit code: 0 if clean, 0 with WARN lines for soft issues (limiter
pressure), 1 if any FAIL (click or gap) is found. The caller (rough-cut
skill) must not treat exit 0 as "no output" — always read stdout.
"""
from __future__ import annotations

import os
import subprocess
import sys
import json
import numpy as np
import soundfile as sf

SILENCE_DBFS = -50.0
SILENCE_GAP_S = 0.35
EDGE_GRACE_S = 0.15          # ignore silence right at the very head/tail
CLICK_WINDOW_MS = 25.0        # how close to a joint we scan for discontinuity
CLICK_DERIVATIVE_SIGMA = 8.0  # click = derivative this many std-devs above local norm
LIMITER_CEILING_DBFS = -6.0
LIMITER_PRESSURE_BAND_DB = 0.5
LIMITER_PRESSURE_WARN_PCT = 8.0


def _dbfs(x: np.ndarray) -> np.ndarray:
    return 20.0 * np.log10(np.maximum(np.abs(x), 1e-9))


def check_silence_gaps(samples: np.ndarray, sr: int, duration: float) -> list[str]:
    warnings = []
    db = _dbfs(samples)
    is_silent = db < SILENCE_DBFS
    gap_start = None
    for i, silent in enumerate(is_silent):
        t = i / sr
        if silent and gap_start is None:
            gap_start = t
        elif not silent and gap_start is not None:
            gap_len = t - gap_start
            if gap_len > SILENCE_GAP_S and gap_start > EDGE_GRACE_S and t < duration - EDGE_GRACE_S:
                warnings.append(f"FAIL silence-gap: {gap_len:.2f}s of silence at {gap_start:.2f}s-{t:.2f}s")
            gap_start = None
    return warnings


def check_joint_clicks(samples: np.ndarray, sr: int, joint_times: list[float]) -> list[str]:
    warnings = []
    deriv = np.abs(np.diff(samples))
    global_sigma = float(np.std(deriv)) + 1e-9
    win = int(sr * CLICK_WINDOW_MS / 1000.0)
    for jt in joint_times:
        center = int(jt * sr)
        lo, hi = max(0, center - win), min(len(deriv), center + win)
        if hi <= lo:
            continue
        local_max = float(np.max(deriv[lo:hi]))
        if local_max > CLICK_DERIVATIVE_SIGMA * global_sigma:
            warnings.append(f"FAIL joint-click: discontinuity near joint at {jt:.2f}s ({local_max:.4f} vs baseline {global_sigma:.4f})")
    return warnings


def check_limiter_pressure(samples: np.ndarray) -> list[str]:
    db = _dbfs(samples)
    near_ceiling = np.abs(db - LIMITER_CEILING_DBFS) < LIMITER_PRESSURE_BAND_DB
    pct = 100.0 * float(np.mean(near_ceiling))
    if pct > LIMITER_PRESSURE_WARN_PCT:
        return [f"WARN limiter-pressure: {pct:.1f}% of the track sits within {LIMITER_PRESSURE_BAND_DB}dB of the -6dBFS ceiling — source gain-staging may be hot"]
    return []


def _load_samples(audio_path: str) -> tuple[np.ndarray, int]:
    """libsndfile (soundfile's backend) reads WAV/FLAC/OGG but NOT
    AAC-in-MP4 — and this pass always runs against the polished
    .mp4/.mov output of the pipeline, never a raw WAV. Try soundfile
    directly first (cheap, and correct for a WAV input); on any
    failure, decode through ffmpeg into a sibling temp WAV first. That
    temp file lives next to the input (never /tmp) and is removed
    after reading."""
    try:
        samples, sr = sf.read(audio_path, dtype="float32", always_2d=False)
        return samples, sr
    except Exception:
        pass

    decoded = f"{audio_path}.qa-decode.wav"
    try:
        subprocess.run(
            ["ffmpeg", "-y", "-v", "error", "-i", audio_path, "-vn", "-ac", "1", decoded],
            check=True,
        )
        return sf.read(decoded, dtype="float32", always_2d=False)
    finally:
        if os.path.exists(decoded):
            os.remove(decoded)


def run_qa(audio_path: str, joint_times: list[float]) -> tuple[int, list[str]]:
    samples, sr = _load_samples(audio_path)
    if samples.ndim > 1:
        samples = samples.mean(axis=1)
    duration = len(samples) / sr

    findings = []
    findings += check_joint_clicks(samples, sr, joint_times)
    findings += check_silence_gaps(samples, sr, duration)
    findings += check_limiter_pressure(samples)

    exit_code = 1 if any(f.startswith("FAIL") for f in findings) else 0
    return exit_code, findings


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("usage: audio_qa.py <final_audio_or_mux.mp4> [cutlist.json]", file=sys.stderr)
        sys.exit(2)
    audio_path = sys.argv[1]
    joint_times: list[float] = []
    if len(sys.argv) > 2:
        with open(sys.argv[2], encoding="utf-8") as f:
            cl = json.load(f)
        t = 0.0
        for seg in [s for s in cl["segments"] if s["kept"]]:
            t += seg["end"] - seg["start"]
            joint_times.append(t)
        joint_times = joint_times[:-1]  # last one is the end of the track, not a joint

    code, findings = run_qa(audio_path, joint_times)
    if not findings:
        print("[audio-qa] clean: no clicks, no gaps, limiter pressure normal")
    else:
        for f in findings:
            print(f"[audio-qa] {f}")
    sys.exit(code)
