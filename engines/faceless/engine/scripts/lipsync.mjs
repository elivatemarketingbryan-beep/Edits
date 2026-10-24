#!/usr/bin/env node
// Builds the sprite's mouth track from the voiceover loudness.
// Output: one mouth state per video frame, 0 closed, 1 small, 2 talk, 3 wide.
//
// Usage: node scripts/lipsync.mjs <voiceover> <out.json> [--fps 30]

import { pathToFileURL } from 'node:url';
import { decodeAudio, writeJSON } from '../lib/tools.mjs';

export function mouthTrack(samples, rate, fps = 30) {
  const frames = Math.ceil((samples.length / rate) * fps);
  const db = new Float32Array(frames);
  for (let f = 0; f < frames; f++) {
    // Animators lead the sound slightly: look 10ms back and 40ms ahead.
    const a = Math.max(0, Math.floor((f / fps - 0.01) * rate));
    const b = Math.min(samples.length, Math.floor((f / fps + 0.04) * rate));
    let s = 0;
    for (let i = a; i < b; i++) s += samples[i] * samples[i];
    db[f] = 10 * Math.log10(s / Math.max(1, b - a) + 1e-10);
  }
  const sorted = Array.from(db).sort((x, y) => x - y);
  const floor = sorted[Math.floor(frames * 0.1)];
  const loud = sorted[Math.floor(frames * 0.97)];
  const v = Array.from(db, d => Math.min(1, Math.max(0, (d - floor) / Math.max(6, loud - floor))));

  // Shapes come from the voiced frames' own spread, so compressed AI voices still
  // get mostly regular "talk" with wide reserved for the loudest fifth.
  const voiced = Array.from(db).filter((d, i) => v[i] >= 0.3).sort((x, y) => x - y);
  const q = p => voiced[Math.min(voiced.length - 1, Math.floor(voiced.length * p))] ?? 0;
  const q25 = q(0.25), q80 = q(0.8);
  const raw = v.map((x, i) => {
    let s = x < 0.3 ? 0 : db[i] < q25 ? 1 : db[i] < q80 ? 2 : 3;
    // Close briefly in the dips between syllables so the mouth flaps instead of hanging open.
    const peakBefore = Math.max(...v.slice(Math.max(0, i - 3), i + 1));
    const peakAfter = Math.max(...v.slice(i, i + 4));
    if (s > 0 && x < 0.72 * Math.min(peakBefore, peakAfter)) s = Math.max(0, s - 2);
    return s;
  });

  // Minimum hold of 2 frames per shape keeps the pixel mouth readable.
  const out = raw.slice();
  for (let i = 1; i < out.length; i++) {
    if (out[i] !== out[i - 1] && i >= 2 && out[i - 1] !== out[i - 2]) out[i] = out[i - 1];
  }
  return out;
}

// Spans of continuous speech; gaps shorter than minGap are bridged.
export function speechSpans(track, fps = 30, minGap = 0.35) {
  const spans = [];
  let start = null, lastOpen = null;
  track.forEach((s, f) => {
    if (s > 0) {
      if (start === null) start = f;
      else if ((f - lastOpen) / fps > minGap) { spans.push([start / fps, (lastOpen + 1) / fps]); start = f; }
      lastOpen = f;
    }
  });
  if (start !== null) spans.push([start / fps, (lastOpen + 1) / fps]);
  return spans;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [input, out] = process.argv.slice(2);
  const fps = Number(process.argv[process.argv.indexOf('--fps') + 1]) || 30;
  if (!input || !out) { console.error('usage: lipsync.mjs <voiceover> <out.json>'); process.exit(1); }
  const rate = 16000;
  const samples = decodeAudio(input, rate);
  const track = mouthTrack(samples, rate, fps);
  const counts = [0, 0, 0, 0];
  track.forEach(s => counts[s]++);
  writeJSON(out, { fps, duration: samples.length / rate, track: track.join(''), spans: speechSpans(track, fps) });
  console.log(`mouth track: ${track.length} frames, closed/small/talk/wide = ${counts.join('/')}`);
}
