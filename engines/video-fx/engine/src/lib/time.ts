import type { Word } from "./types";

/**
 * A moment in the clip. Accepted forms:
 *   2.5                 seconds from the start
 *   -1.0                1 second before the end
 *   "@course"           when the word "course" is first spoken
 *   "@course#2"         the second time it is spoken
 *   "@course+0.3"       0.3s after it starts ("@course-0.2" for before)
 *   "@course:end"       when the word finishes
 *   { word: "course", nth: 1, offset: 0, edge: "start" }
 */
export type TimeRef =
  | number
  | string
  | { word: string; nth?: number; offset?: number; edge?: "start" | "end" };

export const norm = (s: string) =>
  s.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9%$'#]+/g, "");

export function findWord(words: Word[], target: string, nth = 1): Word | null {
  const parts = target.trim().split(/\s+/).map(norm).filter(Boolean);
  if (!parts.length) return null;
  let seen = 0;
  for (let i = 0; i < words.length; i++) {
    let ok = true;
    for (let j = 0; j < parts.length; j++) {
      const w = words[i + j];
      if (!w || norm(w.text) !== parts[j]) { ok = false; break; }
    }
    if (ok) {
      seen++;
      if (seen === nth) {
        const last = words[i + parts.length - 1];
        return { text: target, start: words[i].start, end: last.end };
      }
    }
  }
  // fall back to a prefix match on the first word ("edit" matches "editing")
  seen = 0;
  for (const w of words) {
    if (norm(w.text).startsWith(parts[0])) {
      seen++;
      if (seen === nth) return w;
    }
  }
  return null;
}

/** Resolve a TimeRef to seconds. Unknown words fall back to `fallback` (default 0). */
export function resolveTime(ref: TimeRef | undefined | null, words: Word[], duration: number, fallback = 0): number {
  if (ref === undefined || ref === null || ref === "") return fallback;
  if (typeof ref === "number") return ref < 0 ? Math.max(0, duration + ref) : ref;
  if (typeof ref === "object") {
    const w = findWord(words, ref.word, ref.nth ?? 1);
    if (!w) return fallback;
    return (ref.edge === "end" ? w.end : w.start) + (ref.offset ?? 0);
  }
  const s = ref.trim();
  if (!s.startsWith("@")) {
    const n = Number(s);
    return Number.isFinite(n) ? (n < 0 ? Math.max(0, duration + n) : n) : fallback;
  }
  const m = s.slice(1).match(/^(.+?)(?:#(\d+))?(:end)?([+-]\d*\.?\d+)?$/);
  if (!m) return fallback;
  const w = findWord(words, m[1].replace(/_/g, " "), m[2] ? Number(m[2]) : 1);
  if (!w) return fallback;
  return (m[3] ? w.end : w.start) + (m[4] ? Number(m[4]) : 0);
}

/** Words shifted so that `offsetSec` becomes 0 (used inside effect windows). */
export const shiftWords = (words: Word[], offsetSec: number): Word[] =>
  words.map((w) => ({ ...w, start: w.start - offsetSec, end: w.end - offsetSec }));
