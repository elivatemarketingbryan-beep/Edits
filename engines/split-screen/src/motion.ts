import {interpolate, spring} from 'remotion';

// All motion is frame driven, so scrubbing and exported frames match.
export const arrive = (frame: number, fps: number, delay = 0) =>
  spring({frame: Math.max(0, frame - delay), fps, config: {damping: 22, stiffness: 150, mass: 0.85}});
export const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
export const reveal = (frame: number, fps: number, delay = 0) => {
  const p = arrive(frame, fps, delay);
  return {opacity: clamp((frame - delay) / 9), transform: `translateY(${(1 - p) * 32}px)`};
};
export const fitType = (text: string, normal: number, maxChars: number, min = normal * 0.62) =>
  Math.max(min, Math.min(normal, normal * Math.sqrt(maxChars / Math.max(text.length, 1))));
export const range = (f: number, start: number, end: number) => interpolate(f, [start, end], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
