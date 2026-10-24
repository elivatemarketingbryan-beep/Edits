#!/usr/bin/env python3
"""
lib/audio_boundaries.py — measure real cut boundaries from the raw audio.

LOCK: "Measure cut boundaries, do not trust the transcript timestamps."
WhisperX word timestamps can run tens to ~100ms off the real acoustic
edge (alignment models snap to phoneme centers, not onsets/decays).
Every boundary that becomes a cut MUST be re-measured against an RMS
envelope of the raw audio before it is used, then padded just outside
the measured edge (into silence, never into speech) and snapped to the
video frame grid by the caller (lib/cutlist.py).

Algorithm: rather than scanning in one fixed direction from the
transcript timestamp (which degenerates badly when the search window's
own edge happens to land inside a loud region — a real failure mode,
caught by this module's synthetic test), find EVERY rising edge
(silence->speech, for onsets) or falling edge (speech->silence, for
offsets) inside a search window centered on the transcript timestamp,
and take whichever edge is closest to that timestamp. This is robust
regardless of which direction, or how far, the transcript timestamp
happens to be off by, as long as it's within the search window.

Usage (library, imported by lib/cutlist.py):
    from audio_boundaries import BoundaryMeasurer
    bm = BoundaryMeasurer(raw_audio_wav_path)
    t = bm.measure_onset(approx_time_seconds)   # speech starts here
    t = bm.measure_offset(approx_time_seconds)  # speech ends here

Also runnable standalone for debugging:
    uv run lib/audio_boundaries.py <raw.wav> onset 12.34
"""
from __future__ import annotations

import sys
import math
import numpy as np
import soundfile as sf

HOP_MS = 5.0             # RMS envelope hop
WIN_MS = 20.0            # RMS envelope window
SEARCH_WINDOW_MS = 220.0  # look this far on EITHER side of the transcript timestamp
EDGE_PAD_MS = 18.0        # pad placed just outside the measured edge, into silence
NOISE_FLOOR_PERCENTILE = 15  # percentile of local RMS used as "silence" estimate
ATTACK_RATIO = 3.0        # signal must exceed noise_floor * this ratio to count as "speech"


class BoundaryMeasurer:
    def __init__(self, wav_path: str):
        data, sr = sf.read(wav_path, dtype="float32", always_2d=False)
        if data.ndim > 1:
            data = data.mean(axis=1)
        self.sr = sr
        self.samples = data
        self.hop = max(1, int(sr * HOP_MS / 1000.0))
        self.win = max(1, int(sr * WIN_MS / 1000.0))
        self._envelope_cache = None

    def _rms_envelope(self):
        if self._envelope_cache is not None:
            return self._envelope_cache
        n = len(self.samples)
        n_frames = max(1, (n - self.win) // self.hop + 1)
        env = np.empty(n_frames, dtype=np.float64)
        for i in range(n_frames):
            start = i * self.hop
            frame = self.samples[start:start + self.win]
            env[i] = float(np.sqrt(np.mean(np.square(frame)) + 1e-12))
        self._envelope_cache = env
        return env

    def _frame_time(self, frame_idx: int) -> float:
        return (frame_idx * self.hop) / self.sr

    def _time_to_frame(self, t: float) -> int:
        return int(round((t * self.sr) / self.hop))

    def _local_noise_floor(self, lo: int, hi: int) -> float:
        env = self._rms_envelope()
        window = env[max(0, lo):min(len(env), hi)]
        if len(window) == 0:
            return 1e-6
        return float(np.percentile(window, NOISE_FLOOR_PERCENTILE)) + 1e-6

    def _find_edges(self, lo: int, hi: int, threshold: float, rising: bool) -> list[int]:
        env = self._rms_envelope()
        lo = max(0, lo)
        hi = min(len(env) - 1, hi)
        edges = []
        for f in range(lo, hi):
            below, above = env[f] < threshold, env[f + 1] >= threshold
            if rising and below and above:
                edges.append(f + 1)
            elif not rising and not below and env[f + 1] < threshold:
                edges.append(f + 1)
        return edges

    def _closest_edge_time(self, approx_time: float, rising: bool) -> float | None:
        span_frames = int(SEARCH_WINDOW_MS / HOP_MS)
        center = self._time_to_frame(approx_time)
        lo, hi = center - span_frames, center + span_frames
        floor = self._local_noise_floor(lo, hi)
        threshold = floor * ATTACK_RATIO

        edges = self._find_edges(lo, hi, threshold, rising)
        if not edges:
            return None
        edge_times = [self._frame_time(f) for f in edges]
        return min(edge_times, key=lambda t: abs(t - approx_time))

    def measure_onset(self, approx_time: float) -> float:
        """Speech begins near approx_time. Return the real acoustic
        attack (closest rising edge), padded EDGE_PAD_MS earlier."""
        t = self._closest_edge_time(approx_time, rising=True)
        if t is None:
            t = approx_time  # no edge found in window; fall back rather than guess further
        return max(0.0, t - EDGE_PAD_MS / 1000.0)

    def measure_offset(self, approx_time: float) -> float:
        """Speech ends near approx_time. Return the real acoustic decay
        point (closest falling edge), padded EDGE_PAD_MS later."""
        t = self._closest_edge_time(approx_time, rising=False)
        if t is None:
            t = approx_time
        max_t = len(self.samples) / self.sr
        return min(max_t, t + EDGE_PAD_MS / 1000.0)


def snap_to_frame(t: float, fps: float, direction: str) -> float:
    """Snap a time to the video frame grid.
    direction='floor' rounds down, 'ceil' rounds up, otherwise nearest.
    Which one to use is boundary-role-specific and decided by the
    caller (lib/cutlist.py) — 'floor' for a kept segment's start and
    'ceil' for its end keeps the kept window from shrinking below what
    was actually measured."""
    frame_dur = 1.0 / fps
    frame_idx = t / frame_dur
    if direction == "floor":
        snapped = math.floor(frame_idx) * frame_dur
    elif direction == "ceil":
        snapped = math.ceil(frame_idx) * frame_dur
    else:
        snapped = round(frame_idx) * frame_dur
    return snapped


if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("usage: audio_boundaries.py <raw.wav> <onset|offset> <approx_seconds>", file=sys.stderr)
        sys.exit(2)
    wav_path, kind, approx = sys.argv[1], sys.argv[2], float(sys.argv[3])
    bm = BoundaryMeasurer(wav_path)
    fn = bm.measure_onset if kind == "onset" else bm.measure_offset
    print(f"{fn(approx):.4f}")
