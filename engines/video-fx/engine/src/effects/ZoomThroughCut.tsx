import React, { useMemo } from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { interpolate } from "../lib/interp";
import { clamp } from "../lib/anim";
import { Captions } from "../lib/captions";
import { fallbackSubject, useFx } from "../lib/context";
import { ClipVideo } from "../lib/media";
import { makeFx } from "../lib/shell";
import { shiftWords } from "../lib/time";
import type { CaptionConfig, Clip, Word } from "../lib/types";
import { ZoomBlur } from "../lib/ZoomBlur";

/** Pick a cut point near the middle of a single clip, at the start of a word after a pause. */
function autoCut(words: Word[], durSec: number): number {
  const mid = durSec / 2;
  let best = mid;
  let bestScore = Infinity;
  for (let i = 1; i < words.length; i++) {
    const gap = words[i].start - words[i - 1].end;
    const punct = /[.,!?;:]$/.test(words[i - 1].text);
    if (gap < 0.08 && !punct) continue;
    const score = Math.abs(words[i].start - mid) - (punct ? 0.6 : 0) - Math.min(gap, 0.5);
    if (words[i].start > 0.8 && words[i].start < durSec - 0.8 && score < bestScore) {
      bestScore = score;
      best = words[i].start - 0.03;
    }
  }
  return best;
}

/** Where to zoom: the subject's chest by default, or an explicit [x, y] (0-1). */
function focusOf(clip: Clip, focus: unknown, W: number, H: number): [number, number] {
  if (Array.isArray(focus) && focus.length === 2) return [Number(focus[0]) * 100, Number(focus[1]) * 100];
  const s = clip.subject ?? fallbackSubject(W, H);
  const y = s.headY + (s.box[3] - s.headY) * (focus === "face" ? 0 : 0.3);
  return [(s.centerX / W) * 100, (y / H) * 100];
}

const merge = (base: CaptionConfig, over: unknown): CaptionConfig => ({ ...base, ...((over as Partial<CaptionConfig>) ?? {}) });

/**
 * Transition: shot A rushes in toward the subject with a growing zoom blur and a little
 * spin, hard cut, shot B bursts out from extremely close and settles. Works with two
 * clips (--second) or one clip split at `cutAt`.
 */
const ZoomThroughCut: React.FC = () => {
  const frame = useCurrentFrame();
  const fx = useFx();
  const { cfg, clips, fps, width: W, height: H, dur } = fx;
  const two = clips.length >= 2;
  const A = clips[0];
  const B = two ? clips[1] : clips[0];
  const push = cfg.pushFrames as number;
  const pull = cfg.pullFrames as number;

  const cut = useMemo(() => {
    if (two) return A.durationInFrames;
    const auto = autoCut(fx.words, dur / fps);
    const f = cfg.cutAt === "auto" || cfg.cutAt === undefined || cfg.cutAt === null ? Math.round(auto * fps) : fx.t(cfg.cutAt, auto);
    return clamp(f, push + 2, dur - pull - 2);
  }, [two, A, fx, cfg.cutAt, dur, fps, push, pull]);

  const [ax, ay] = focusOf(A, cfg.focus, W, H);
  const [bx, by] = focusOf(B, cfg.focusB ?? cfg.focus, W, H);
  const rot = cfg.rotate as number;
  const blur = cfg.blur as number;

  // shot A: accelerate in
  const p = interpolate(frame, [cut - push, cut], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ea = Math.pow(p, 2.2);
  const scaleA = 1 + ((cfg.pushScale as number) - 1) * ea;
  const blurA = blur * Math.pow(p, 1.4);
  const rotA = rot * ea;
  // shot B: burst out and decelerate
  const q = interpolate(frame, [cut, cut + pull], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const eb = 1 - Math.pow(1 - q, 3);
  const scaleB = (cfg.pullScale as number) - ((cfg.pullScale as number) - 1) * eb;
  const blurB = blur * 1.15 * Math.pow(1 - eb, 1.2);
  const rotB = -rot * 0.9 * (1 - eb);

  const capA = merge(fx.captions, cfg.captionsA);
  const capB = merge(fx.captions, cfg.captionsB);
  const cutSec = cut / fps;
  const wordsA = fx.words.filter((w) => w.start < cutSec - 0.05);
  const wordsB = shiftWords(fx.words.filter((w) => w.start >= cutSec - 0.05), cutSec);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Sequence durationInFrames={cut}>
        <AbsoluteFill style={{ transform: `rotate(${rotA}deg)`, transformOrigin: `${ax}% ${ay}%`, filter: p > 0 ? `brightness(${1 + 0.12 * ea}) blur(${blurA * 12 * (W / 1080)}px)` : undefined }}>
          <ZoomBlur scale={scaleA} amount={blurA} origin={`${ax}% ${ay}%`} samples={cfg.samples as number}>
            <ClipVideo clip={A} offset={0} />
          </ZoomBlur>
        </AbsoluteFill>
        <AbsoluteFill
          style={{
            opacity: 1 - clamp(p * 1.6),
            filter: p > 0 ? `blur(${p * 14}px)` : undefined,
            transform: `scale(${1 + ea * 0.8})`,
            transformOrigin: `${ax}% ${ay}%`,
          }}
        >
          <Captions words={wordsA} cfg={capA} />
        </AbsoluteFill>
      </Sequence>
      <Sequence from={cut}>
        <AbsoluteFill style={{ transform: `rotate(${rotB}deg)`, transformOrigin: `${bx}% ${by}%`, filter: q < 1 ? `brightness(${0.86 + 0.14 * eb}) blur(${blurB * 12 * (W / 1080)}px)` : undefined }}>
          <ZoomBlur scale={scaleB} amount={blurB} origin={`${bx}% ${by}%`} samples={cfg.samples as number}>
            <ClipVideo clip={B} offset={two ? 0 : cut} />
          </ZoomBlur>
        </AbsoluteFill>
        <AbsoluteFill style={{ opacity: clamp((q - 0.45) * 2.2) }}>
          <Captions words={wordsB} cfg={capB} />
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};

export default makeFx(ZoomThroughCut, { multiClip: true, ownsCaptions: true });
