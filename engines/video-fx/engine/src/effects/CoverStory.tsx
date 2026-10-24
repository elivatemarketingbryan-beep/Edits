import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { interpolate } from "../lib/interp";
import { easeOut, prog } from "../lib/anim";
import { useFx } from "../lib/context";
import { FONT, fitFontSize } from "../lib/fonts";
import { ClipVideo, MatteVideo } from "../lib/media";
import { makeFx } from "../lib/shell";

/**
 * Magazine cover: a giant Didone masthead rises in letter by letter behind the
 * speaker's head (the cut-out sits on top of it), with optional issue line and coverlines.
 */
const CoverStory: React.FC = () => {
  const frame = useCurrentFrame();
  const { cfg, subject, width, height, t, dur, endsEarly } = useFx();
  const k = width / 1080;
  const title = String(cfg.title || "EDIT").toUpperCase();
  const letters = [...title];
  const spacing = cfg.letterSpacing as number;
  const fontSize = useMemo(
    () => fitFontSize(title, `${cfg.weight} 'Bodoni Moda'`, width * (cfg.widthFraction as number), spacing),
    [title, cfg.weight, cfg.widthFraction, width, spacing],
  );
  const capH = fontSize * 0.7;
  // baseline so that the head covers the lower `overlap` of the letters
  let top: number;
  if (typeof cfg.y === "number") top = cfg.y * height;
  else top = subject.headTop + (cfg.overlap as number) * capH - capH;
  top = Math.max(60 * k, top);

  const start = t(cfg.at, 0.15);
  const stagger = cfg.stagger as number;
  const outF = cfg.outAt !== null && cfg.outAt !== undefined ? t(cfg.outAt) : endsEarly ? dur - 9 : dur + 100;
  const out = interpolate(frame, [outF, outF + 8], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const lineDelay = start + letters.length * stagger + 8;
  const smallA = prog(frame, lineDelay, 14);
  const smallStyle: React.CSSProperties = {
    fontFamily: FONT.sans, fontWeight: 600, fontSize: 24 * k, letterSpacing: "0.32em", color: cfg.color,
    textShadow: "0 2px 10px rgba(0,0,0,.35)", textTransform: "uppercase",
  };

  return (
    <AbsoluteFill>
      <ClipVideo />
      {/* masthead, behind the person */}
      <AbsoluteFill style={{ opacity: out }}>
        <div style={{ position: "absolute", left: 0, right: 0, top, display: "flex", justifyContent: "center", height: fontSize * 0.86, overflow: "hidden" }}>
          {letters.map((ch, i) => {
            const p = prog(frame, start + i * stagger, cfg.letterFrames as number, easeOut);
            return (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  fontFamily: FONT.didone,
                  fontWeight: cfg.weight,
                  fontSize,
                  lineHeight: 0.86,
                  letterSpacing: `${spacing}em`,
                  color: cfg.color,
                  transform: `translateY(${(1 - p) * 70}%)`,
                  opacity: Math.min(1, p * 1.6),
                  filter: p < 1 ? `blur(${(1 - p) * 14 * k}px)` : undefined,
                  textShadow: "0 6px 30px rgba(0,0,0,.18)",
                  whiteSpace: "pre",
                }}
              >
                {ch}
              </span>
            );
          })}
        </div>
      </AbsoluteFill>
      <MatteVideo />
      {cfg.issue ? (
        <div style={{ ...smallStyle, position: "absolute", top: top + fontSize * 0.9, left: width * (1 - (cfg.widthFraction as number)) / 2 + 6 * k, opacity: smallA * out, transform: `translateY(${(1 - smallA) * 10}px)` }}>
          {cfg.issue}
        </div>
      ) : null}
      {/* coverlines, in front of the person */}
      <AbsoluteFill style={{ opacity: out }}>
        {(cfg.coverlines as { title: string; sub?: string }[]).map((c, i) => {
          const a = prog(frame, lineDelay + 6 + i * 6, 14);
          const right = i % 2 === 1;
          return (
            <div
              key={i}
              style={{
                position: "absolute", [right ? "right" : "left"]: 56 * k, top: height * (cfg.coverlinesY as number) + i * 150 * k,
                width: width * 0.36, textAlign: right ? "right" : "left", opacity: a, transform: `translateX(${(1 - a) * (right ? 20 : -20)}px)`,
                color: cfg.color, textShadow: "0 2px 12px rgba(0,0,0,.45)",
              }}
            >
              <div style={{ fontFamily: FONT.didone, fontWeight: 700, fontSize: 54 * k, lineHeight: 0.95, letterSpacing: "-0.01em" }}>{c.title}</div>
              {c.sub ? <div style={{ ...smallStyle, fontSize: 19 * k, letterSpacing: "0.18em", marginTop: 10 * k }}>{c.sub}</div> : null}
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default makeFx(CoverStory);
