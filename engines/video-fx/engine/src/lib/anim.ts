import { Easing, random, spring } from "remotion";
import { interpolate } from "./interp";

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** 0→1 over [start, start+dur] frames with an easing curve. */
export const prog = (frame: number, start: number, dur: number, ease: (t: number) => number = Easing.bezier(0.22, 1, 0.36, 1)) =>
  interpolate(frame, [start, start + Math.max(1, dur)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });

export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
export const easeIn = Easing.bezier(0.55, 0, 1, 0.45);

/** Springy 0→1 that starts at `delay` frames. */
export const springAt = (frame: number, fps: number, delay: number, cfg: { damping?: number; stiffness?: number; mass?: number } = {}) =>
  spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 160, mass: 0.7, ...cfg } });

/** Smooth 1-D value noise in [-1, 1]. */
export function noise1(seed: string | number, t: number): number {
  const i = Math.floor(t);
  const f = t - i;
  const a = random(`${seed}-${i}`) * 2 - 1;
  const b = random(`${seed}-${i + 1}`) * 2 - 1;
  const u = f * f * (3 - 2 * f);
  return a + (b - a) * u;
}

/** Frame number held for `every` frames (hand-drawn "on twos/threes" look). */
export const stepped = (frame: number, every: number) => Math.floor(frame / every);

/** Visibility envelope: fades in over `inDur`, out over `outDur`, inside [start, end] (frames). */
export function envelope(frame: number, start: number, end: number, inDur = 8, outDur = 8) {
  const a = interpolate(frame, [start, start + inDur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const b = interpolate(frame, [end - outDur, end], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return Math.min(a, b);
}
