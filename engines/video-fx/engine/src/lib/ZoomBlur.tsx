import React from "react";
import { AbsoluteFill } from "remotion";

/**
 * Radial "zoom" motion blur. Renders the children `samples` times, each scaled a
 * little further toward `scaleTo`, and averages them (layer k gets opacity 1/(k+1)).
 * With amount 0 it renders the children once.
 */
export const ZoomBlur: React.FC<{
  children: React.ReactNode;
  scale: number;
  /** extra scale spread for the blur, e.g. 0.15 smears from scale to scale*1.15 */
  amount: number;
  origin?: string;
  samples?: number;
}> = ({ children, scale, amount, origin = "50% 50%", samples = 7 }) => {
  const n = Math.abs(amount) < 0.004 ? 1 : samples;
  return (
    <AbsoluteFill>
      {Array.from({ length: n }, (_, k) => {
        const s = scale * (1 + (amount * k) / Math.max(1, n - 1));
        return (
          <AbsoluteFill key={k} style={{ transform: `scale(${s})`, transformOrigin: origin, opacity: k === 0 ? 1 : 1 / (k + 1) }}>
            {children}
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};
