// Shared helpers for the "things on the wall behind the speaker" effects
// (couch-wall, headline-wall, chart-grow, glass-type).
import { random } from "remotion";
import type { Fx } from "./context";
import type { Word } from "./types";

/**
 * Frame (inside the effect window) where the effect should start leaving, or null to hold to the end.
 * `outAt` from config wins; otherwise the effect only exits when its window ends before the clip does.
 */
export function exitFrame(fx: Fx, outAt: unknown, outFrames: number): number | null {
  if (outAt !== null && outAt !== undefined && outAt !== "") return fx.t(outAt as any);
  const w = fx.props.window;
  if (w && Math.round(w[1] * fx.fps) < fx.clip.durationInFrames - 1) return Math.max(0, fx.dur - outFrames);
  return null;
}

/** Deterministic 0..1 random from a seed. */
export const rnd = (seed: string | number) => random(`fx-${seed}`);
export const rndRange = (seed: string | number, a: number, b: number) => a + (b - a) * rnd(seed);

const STOP = new Set(
  "the a an and or but to of in on at for with is are was were be been it its it's this that these those you your you're i i'm we our they their my me so just like do does did can could get got have has had not no if then than as from by about what how all really very going gonna into out up there here when who will would should also more most some any one i'll that's don't didn't it's".split(" "),
);
const clean = (s: string) => s.replace(/[^A-Za-z0-9'%$&-]/g, "");

/** The strongest topic word of a transcript: prefers repeated capitalised names, then long repeated words. */
export function topicWord(words: Word[]): string {
  const counts = new Map<string, { n: number; text: string; cap: boolean }>();
  words.forEach((w, i) => {
    const c = clean(w.text);
    const key = c.toLowerCase();
    if (!c || STOP.has(key) || key.length < 4) return;
    const cap = i > 0 && /^[A-Z]/.test(c) && !/[.!?]$/.test(words[i - 1].text);
    const prev = counts.get(key) ?? { n: 0, text: c, cap: false };
    counts.set(key, { n: prev.n + 1, text: cap ? c : prev.text, cap: prev.cap || cap });
  });
  let best = "";
  let bestScore = -1;
  for (const [key, v] of counts) {
    const score = v.n * 2 + (v.cap ? 3 : 0) + key.length * 0.15;
    if (score > bestScore) {
      bestScore = score;
      best = v.cap ? v.text : key;
    }
  }
  return best || "this";
}

/** Short, card-sized phrases from a transcript (split on punctuation, chunked to <= maxWords). */
export function phrasesFrom(words: Word[], maxWords = 7, minWords = 3): string[] {
  const out: string[] = [];
  let cur: string[] = [];
  const flush = () => {
    if (cur.length >= minWords) out.push(cur.join(" ").replace(/[,;:]$/, ""));
    cur = [];
  };
  for (const w of words) {
    cur.push(w.text);
    if (/[.!?,;:]$/.test(w.text) || cur.length >= maxWords) flush();
  }
  flush();
  return out.map((p) => p.replace(/\s+/g, " ").trim()).filter(Boolean);
}

export const capFirst = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);
/** Lower-case the first letter unless the first word is "I", an acronym or a name like GitHub/iPhone. */
export const lowerFirst = (s: string) => {
  const first = s.split(/\s+/)[0] ?? "";
  if (!s || /^I\b/.test(s) || /^[A-Z]{2}/.test(first) || /^.+[A-Z]/.test(first)) return s;
  return s[0].toLowerCase() + s.slice(1);
};
export const stripEnd = (s: string) => s.replace(/[.,;:!?]+$/, "");

/** Plausible social view counts, deterministic per seed. */
export function viewCount(seed: string | number): string {
  const r = rnd(seed);
  const pick = rnd(`${seed}-b`);
  if (r < 0.28) return `${(1 + pick * 2.4).toFixed(pick < 0.5 ? 2 : 1)}M`;
  if (r < 0.75) return `${Math.round(40 + pick * 900)}K`;
  if (r < 0.9) return `${(10 + pick * 40).toFixed(1)}K`;
  return Math.round(1500 + pick * 8000).toLocaleString("en-US");
}
