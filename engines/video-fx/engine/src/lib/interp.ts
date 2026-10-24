import { interpolate as remotionInterpolate } from "remotion";

type Options = Parameters<typeof remotionInterpolate>[3];

/**
 * Remotion's interpolate, but tolerant of keyframes that come out of order when a user
 * squeezes an effect's timing (e.g. a card set to appear before the typing dots end).
 * Later keyframes that would go backwards are pushed just after the previous one, so the
 * animation compresses instead of throwing.
 */
export function interpolate(input: number, inputRange: readonly number[], outputRange: readonly number[], options?: Options): number {
  const r = inputRange.slice();
  for (let i = 1; i < r.length; i++) if (!(r[i] > r[i - 1])) r[i] = r[i - 1] + 1e-3;
  return remotionInterpolate(input, r, outputRange, options);
}
