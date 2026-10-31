// Audio data accessors. All functions take TRACK time t (seconds) and return 0..1 unless noted.
// Data comes from tools/analyze_audio.py → data/audio.json (30 fps envelopes, beat grid, drum events, lyrics).

let D = null;
const env = {};
let specMix = null, specVoc = null;

export async function loadAudio(url = 'data/audio.json') {
  D = await (await fetch(url)).json();
  for (const [k, arr] of Object.entries(D.env)) env[k] = Float32Array.from(arr, (v) => v / 255);
  const nb = D.specMix[0].length;
  specMix = new Float32Array(D.nFrames * nb); specVoc = new Float32Array(D.nFrames * nb);
  D.specMix.forEach((row, i) => row.forEach((v, j) => (specMix[i * nb + j] = v / 255)));
  D.specVoc.forEach((row, i) => row.forEach((v, j) => (specVoc[i * nb + j] = v / 255)));
  A.nb = nb; A.data = D; A.lyrics = D.lyrics; A.beats = D.beats; A.downbeats = D.downbeats; A.events = D.events; A.rolls = D.rolls;
  return A;
}

function sampleArr(arr, t) {
  if (!arr) return 0;
  const f = t * 30, i = Math.floor(f), u = f - i, n = arr.length;
  const a = arr[Math.max(0, Math.min(n - 1, i))], b = arr[Math.max(0, Math.min(n - 1, i + 1))];
  return a + (b - a) * u;
}
function lastBefore(list, t) { // binary search: index of last element <= t, or -1
  let lo = 0, hi = list.length - 1, r = -1;
  while (lo <= hi) { const m = (lo + hi) >> 1; if (list[m] <= t) { r = m; lo = m + 1; } else hi = m - 1; }
  return r;
}

export const A = {
  nb: 32,
  /** named envelope: rms, low, mid, high, vocal, kick, snare, hat, perc, open, wide, round, sss */
  env: (name, t) => sampleArr(env[name], t),
  /** mix spectrum band i (0 = 40 Hz … nb-1 = 14 kHz) */
  spec: (t, i) => { const f = Math.max(0, Math.min(D.nFrames - 1, Math.round(t * 30))); return specMix[f * A.nb + i]; },
  /** vocal-stem spectrum band i */
  vspec: (t, i) => { const f = Math.max(0, Math.min(D.nFrames - 1, Math.round(t * 30))); return specVoc[f * A.nb + i]; },
  /** beat info: index, phase 0..1 within the beat, time of last / next beat */
  beat(t) {
    if (!D) return { i: -1, phase: 0, last: 0, next: 0.6, len: 0.6 };
    const b = D.beats, i = lastBefore(b, t);
    if (i < 0) { const p = 0.6; return { i: -1, phase: ((t - b[0]) / p % 1 + 1) % 1, last: b[0] - p, next: b[0], len: p }; }
    const next = b[i + 1] ?? b[i] + 0.6, len = next - b[i];
    return { i, phase: (t - b[i]) / len, last: b[i], next, len };
  },
  /** bar info using downbeats: index, phase 0..1 within the bar */
  bar(t) {
    if (!D) return { i: -1, phase: 0, last: 0, next: 2.4 };
    const b = D.downbeats, i = lastBefore(b, t);
    if (i < 0) return { i: -1, phase: 0, last: b[0] - 2.4, next: b[0] };
    const next = b[i + 1] ?? b[i] + 2.4;
    return { i, phase: (t - b[i]) / (next - b[i]), last: b[i], next };
  },
  /** seconds since the last event of kind ('kick'|'snare'|'hat'|'perc'|'beat'|'down') */
  since(kind, t) {
    if (!D) return 99;
    const list = kind === 'beat' ? D.beats : kind === 'down' ? D.downbeats : D.events[kind];
    const i = lastBefore(list, t); return i < 0 ? 99 : t - list[i];
  },
  /** exponential pulse after the last event of kind: 1 at the hit, decaying with `decay` seconds */
  pulse(kind, t, decay = 0.15) { return Math.exp(-A.since(kind, t) / decay); },
  /** list of events of kind between a and b */
  eventsIn(kind, a, b) { const list = kind === 'beat' ? D.beats : kind === 'down' ? D.downbeats : D.events[kind]; return list.filter((x) => x >= a && x < b); },
  /** mouth shape for lip sync: {open, wide, round, sss} 0..1 */
  mouth(t) { return { open: sampleArr(env.open, t), wide: sampleArr(env.wide, t), round: sampleArr(env.round, t), sss: sampleArr(env.sss, t), vocal: sampleArr(env.vocal, t) }; },
  /** current lyric line (or null) */
  line(t) { if (!D) return null; for (const L of D.lyrics) if (t >= L.start && t < L.end) return L; return null; },
  /** last lyric line that started at or before t */
  lastLine(t) { let r = null; for (const L of D.lyrics) if (L.start <= t) r = L; return r; },
  /** current word of the current line (or null) */
  word(t) { const L = A.line(t); if (!L) return null; let w = null; for (const x of L.words) if (x.t <= t) w = x; return w; },
};
