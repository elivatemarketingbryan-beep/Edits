// WAV writing and the procedural music bed. The bed copies the reference's:
// a beatless, wide sine pad with slow chord changes, sitting ~24 LU under the voice.
// Each video gets its own key, progression and chord lengths from its seed.

import fs from 'node:fs';

export function writeWav(file, channels, rate) {
  const n = channels[0].length, ch = channels.length;
  const buf = Buffer.alloc(44 + n * ch * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * ch * 2, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(ch, 22);
  buf.writeUInt32LE(rate, 24); buf.writeUInt32LE(rate * ch * 2, 28); buf.writeUInt16LE(ch * 2, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(n * ch * 2, 40);
  let o = 44;
  for (let i = 0; i < n; i++) for (let c = 0; c < ch; c++) {
    const v = Math.max(-1, Math.min(1, channels[c][i]));
    buf.writeInt16LE(Math.round(v * 32767), o); o += 2;
  }
  fs.writeFileSync(file, buf);
}

export function rng(seed) {
  let h = 2166136261 >>> 0;
  for (const ch of String(seed)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
  return () => {
    h = (h + 0x6D2B79F5) >>> 0;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NOTE = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
// Calm, "positive-curious" progressions; the first is the reference's own.
const PROGRESSIONS = [
  ['Em', 'G', 'C', 'Em', 'G', 'C'],
  ['C', 'Am', 'F', 'G'],
  ['Am', 'F', 'C', 'G'],
  ['Dm', 'Bb', 'F', 'C'],
  ['G', 'Em', 'C', 'D'],
  ['F', 'Dm', 'Bb', 'C'],
  ['Bm', 'G', 'D', 'A'],
  ['Cmaj7', 'Am7', 'Fmaj7', 'G'],
];

function chordFreqs(name) {
  const m = name.match(/^([A-G][b#]?)(m?)(maj7|7)?$/);
  const root = NOTE[m[1]], minor = m[2] === 'm', ext = m[3];
  const third = minor ? 3 : 4;
  const tones = [0, third, 7, 12, 12 + third, 19];
  if (ext === 'maj7') tones[3] = 11; else if (ext === '7') tones[3] = 10;
  const bass = 36 + root; // C2 = midi 36
  return tones.map((t, i) => 440 * Math.pow(2, ((i === 0 ? bass : bass + 12) + t - (i === 0 ? 0 : 0) - 69) / 12));
}

export function musicBed(duration, seed, rate = 48000) {
  const r = rng('bed:' + seed);
  const prog = PROGRESSIONS[Math.floor(r() * PROGRESSIONS.length)];
  const n = Math.ceil(duration * rate);
  const L = new Float32Array(n), R = new Float32Array(n);
  // Chord timeline: irregular 2.2-6.4 s segments, like the reference's edited bed.
  const segs = []; let t = 0, k = 0;
  while (t < duration) { const len = 2.2 + r() * 4.2; segs.push({ t0: t, t1: t + len, ch: chordFreqs(prog[k % prog.length]) }); t += len; k++; }
  const xf = 0.6;
  const det = Math.pow(2, 4 / 1200);
  for (let s = 0; s < segs.length; s++) {
    const { t0, t1, ch } = segs[s];
    const a = Math.max(0, Math.floor((t0 - xf / 2) * rate)), b = Math.min(n, Math.ceil((t1 + xf / 2) * rate));
    ch.forEach((f, vi) => {
      const amp = vi === 0 ? 0.8 : 1;
      const ph = r() * Math.PI * 2;
      for (let i = a; i < b; i++) {
        const tt = i / rate;
        const g = Math.min(1, (tt - (t0 - xf / 2)) / xf, ((t1 + xf / 2) - tt) / xf);
        if (g <= 0) continue;
        const wl = 2 * Math.PI * f / det * tt + ph, wr = 2 * Math.PI * f * det * tt + ph;
        L[i] += g * amp * (Math.sin(wl) + 0.18 * Math.sin(2 * wl) + 0.06 * Math.sin(3 * wl));
        R[i] += g * amp * (Math.sin(wr) + 0.18 * Math.sin(2 * wr) + 0.06 * Math.sin(3 * wr));
      }
    });
  }
  // 2nd-order low-pass at 1.8 kHz, then level to -41 dBFS RMS per channel.
  for (const x of [L, R]) {
    const w0 = 2 * Math.PI * 1800 / rate, al = Math.sin(w0) / (2 * Math.SQRT1_2), c = Math.cos(w0);
    const b0 = (1 - c) / 2, b1 = 1 - c, b2 = (1 - c) / 2, a0 = 1 + al, a1 = -2 * c, a2 = 1 - al;
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for (let i = 0; i < n; i++) {
      const y = (b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
      x2 = x1; x1 = x[i]; y2 = y1; y1 = y; x[i] = y;
    }
    let ss = 0; for (let i = 0; i < n; i++) ss += x[i] * x[i];
    const gain = Math.pow(10, -41 / 20) / Math.sqrt(ss / n || 1);
    const fade = Math.floor(0.02 * rate);
    for (let i = 0; i < n; i++) x[i] *= gain * Math.min(1, i / fade);
  }
  return { channels: [L, R], rate, progression: prog };
}
