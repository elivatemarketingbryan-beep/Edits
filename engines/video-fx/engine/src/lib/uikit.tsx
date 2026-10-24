import React from "react";
import { random } from "remotion";
import { clamp } from "./anim";
import { norm } from "./time";
import type { Word } from "./types";

// ---------- typing ----------

/**
 * Frame (float) at which each character of `text` appears when typed from `start`.
 * Speed is `cps` chars/second with a little human jitter: spaces and punctuation
 * take longer, occasional micro-pauses.
 */
export function typeSchedule(text: string, start: number, fps: number, cps: number, seed = "type"): number[] {
  const out: number[] = [];
  let f = start;
  const base = fps / Math.max(1, cps);
  [...text].forEach((ch, i) => {
    out.push(f);
    let d = base * (0.65 + random(`${seed}-${i}`) * 0.7);
    if (ch === " ") d *= 1.35;
    if (/[.,!?/-]/.test(ch)) d *= 1.6;
    if (random(`${seed}-p-${i}`) < 0.06) d += base * 2.5;
    f += d;
  });
  return out;
}

/** How many characters are visible at `frame`, and the frame typing finishes. */
export function typed(text: string, frame: number, start: number, fps: number, cps: number, seed = "type") {
  const sched = typeSchedule(text, start, fps, cps, seed);
  const n = sched.filter((f) => frame >= f).length;
  const end = sched.length ? sched[sched.length - 1] + fps / Math.max(1, cps) : start;
  return { shown: text.slice(0, n), n, end, done: frame >= end };
}

export const Caret: React.FC<{ frame: number; color?: string; height: number; width?: number; solid?: boolean }> = ({ frame, color = "currentColor", height, width = 3, solid }) => {
  const on = solid || Math.floor(frame / 15) % 2 === 0;
  return <span style={{ display: "inline-block", width, height, background: color, opacity: on ? 1 : 0, verticalAlign: "middle", marginLeft: width, borderRadius: width }} />;
};

// ---------- icons ----------

export const CheckGlyph: React.FC<{ size: number; color: string; stroke?: number; progress?: number }> = ({ size, color, stroke = 3.2, progress = 1 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block" }}>
    <path d="M6 12.5 L10.2 16.5 L18 8" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - clamp(progress)} />
  </svg>
);

/** A rotating partial ring. */
export const Spinner: React.FC<{ size: number; color: string; frame: number; stroke?: number }> = ({ size, color, frame, stroke = 2.6 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block", transform: `rotate(${frame * 18}deg)` }}>
    <circle cx="12" cy="12" r="9" fill="none" stroke={color} strokeOpacity={0.18} strokeWidth={stroke} />
    <path d="M12 3 A9 9 0 0 1 21 12" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" />
  </svg>
);

/** Orange asterisk-style starburst logo (generic "AI app" mark). */
export const Starburst: React.FC<{ size: number; color: string; rays?: number; rotate?: number }> = ({ size, color, rays = 11, rotate = 0 }) => {
  const paths = Array.from({ length: rays }, (_, i) => {
    const a = (i / rays) * Math.PI * 2;
    const len = 9.2 + (i % 3 === 0 ? 1.4 : i % 2 === 0 ? 0.2 : -0.6);
    const w = 1.45;
    const x1 = Math.cos(a) * 1.6, y1 = Math.sin(a) * 1.6;
    const x2 = Math.cos(a) * len, y2 = Math.sin(a) * len;
    return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={w * 1.55} strokeLinecap="round" />;
  });
  return (
    <svg width={size} height={size} viewBox="-12 -12 24 24" style={{ display: "block", transform: `rotate(${rotate}deg)` }}>
      {paths}
    </svg>
  );
};

export const PlayGlyph: React.FC<{ size: number }> = ({ size }) => (
  <div style={{ width: size, height: size, borderRadius: size, background: "rgba(255,255,255,.88)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,.25)" }}>
    <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 10 10">
      <path d="M3 2 L8 5 L3 8 Z" fill="#1b1b1b" />
    </svg>
  </div>
);

export const UploadGlyph: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <path d="M12 15 V4 M7.5 8.5 L12 4 L16.5 8.5 M5 14 V19 H19 V14" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ArrowUpGlyph: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block" }}>
    <path d="M12 19 V5 M6 11 L12 5 L18 11" fill="none" stroke={color} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Deterministic waveform bar heights (0..1) that look like speech. */
export function waveform(n: number, seed = "wave"): number[] {
  return Array.from({ length: n }, (_, i) => {
    const env = 0.45 + 0.55 * Math.abs(Math.sin(i / 7.3 + random(`${seed}-e`) * 3)) * (0.6 + 0.4 * Math.sin(i / 2.1));
    const gap = random(`${seed}-g-${Math.floor(i / 11)}`) < 0.12 ? 0.15 : 1;
    return clamp((0.18 + random(`${seed}-${i}`) * 0.82) * env * gap, 0.06, 1);
  });
}

// ---------- transcript helpers ----------

const STOP = new Set(
  "the a an and or but to of in on at for with is are was were be been it its it's this that these those you your you're i i'm we our they their my me so just like do does did can could get got have has had not no if then than as from by about what how all really very going gonna into out up there here when who will would should also more most some any one which meaning basically actually literally using used make made want wanted need take put way thing things lot stuff currently".split(" "),
);

/** First time any of `keys` (word prefixes) is spoken, in seconds, else null. */
export function keywordTime(words: Word[], keys: string[]): number | null {
  for (const w of words) {
    const n = norm(w.text);
    if (keys.some((k) => n.startsWith(k))) return w.start;
  }
  return null;
}

const tidy = (s: string) => s.replace(/[.,;:!?"“”]+/g, "").trim();
const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

/**
 * Split the transcript into `count` equal time slices and pull a short (2-4 word)
 * label out of each, starting and ending on a content word. Used when the user
 * gave no item texts. Returns label + the time its first word is spoken.
 */
export function autoItems(words: Word[], count: number, durSec: number, maxChars = 26): { text: string; at: number }[] {
  if (!words.length) {
    return Array.from({ length: count }, (_, i) => ({ text: ["Drop your clips", "Trigger the skill", "Post the video"][i % 3], at: durSec * (0.12 + (0.7 * i) / Math.max(1, count - 1 || 1)) }));
  }
  const t0 = words[0].start;
  const t1 = words[words.length - 1].end;
  const out: { text: string; at: number }[] = [];
  for (let g = 0; g < count; g++) {
    const a = t0 + ((t1 - t0) * g) / count;
    const b = t0 + ((t1 - t0) * (g + 1)) / count;
    const ws = words.filter((w) => w.start >= a - 0.01 && w.start < b);
    let best: { text: string; at: number; score: number } | null = null;
    for (let i = 0; i < ws.length; i++) {
      for (let len = 2; len <= 4; len++) {
        const seq = ws.slice(i, i + len);
        if (seq.length < len) break;
        const first = norm(seq[0].text), last = norm(seq[seq.length - 1].text);
        if (STOP.has(first) || STOP.has(last)) continue;
        const text = tidy(seq.map((w) => w.text).join(" "));
        if (text.length > maxChars) continue;
        const lastW = seq[seq.length - 1];
        const nextW = ws[i + len] ?? words[words.indexOf(lastW) + 1];
        const prevW = words[words.indexOf(seq[0]) - 1];
        // chunks that end (or start) on a pause / punctuation read like real steps
        const endsClean = /[.,;:!?]$/.test(lastW.text) || !nextW || nextW.start - lastW.end > 0.25;
        const startsClean = !prevW || /[.,;:!?]$/.test(prevW.text) || seq[0].start - prevW.end > 0.25;
        const score = seq.reduce((s, w) => s + (STOP.has(norm(w.text)) ? -1.5 : norm(w.text).length), 0) + len * 0.5 + (endsClean ? 5 : 0) + (startsClean ? 2 : 0);
        if (!best || score > best.score) best = { text, at: seq[0].start, score };
      }
    }
    if (!best && ws.length) {
      const content = ws.filter((w) => !STOP.has(norm(w.text)));
      const pick = (content.length ? content : ws).slice(0, 3);
      best = { text: tidy(pick.map((w) => w.text).join(" ")), at: pick[0].start, score: 0 };
    }
    out.push(best ? { text: cap(best.text), at: best.at } : { text: `Step ${g + 1}`, at: a });
  }
  return out;
}
