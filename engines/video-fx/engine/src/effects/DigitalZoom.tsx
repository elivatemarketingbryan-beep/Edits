import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { interpolate } from "../lib/interp";
import { easeOut } from "../lib/anim";
import { buildPhrases } from "../lib/captions";
import { useFx } from "../lib/context";
import { ClipVideo } from "../lib/media";
import { makeFx } from "../lib/shell";
import type { TimeRef } from "../lib/time";
import { ZoomBlur } from "../lib/ZoomBlur";

type Punch = { at: TimeRef; scale: number };

/**
 * Punch-in zooms on key words. Each punch snaps to its scale over a few frames
 * with a radial zoom blur, then holds until the next punch.
 */
const DigitalZoom: React.FC = () => {
  const frame = useCurrentFrame();
  const fx = useFx();
  const { cfg, fps, subject, width, height } = fx;

  const punches = useMemo(() => {
    let list: { f: number; scale: number }[];
    if (Array.isArray(cfg.punches)) {
      list = (cfg.punches as Punch[]).map((p) => ({ f: fx.t(p.at), scale: p.scale ?? cfg.scale }));
    } else {
      // auto: one punch per emphasised word, alternating in / out, at least minGap apart
      const capCfg = { ...fx.captions, emphasis: fx.captions.emphasis === "none" ? ("auto" as const) : fx.captions.emphasis };
      const emph = buildPhrases(fx.words, capCfg).flatMap((p) => p.words.filter((w) => w.emph));
      list = [];
      let lastT = -Infinity;
      let zoomedIn = false;
      for (const w of emph) {
        if (w.start - lastT < cfg.minGap) continue;
        zoomedIn = !zoomedIn;
        list.push({ f: Math.round(w.start * fps), scale: zoomedIn ? cfg.scale : cfg.rest });
        lastT = w.start;
      }
    }
    return list.sort((a, b) => a.f - b.f);
  }, [cfg, fx, fps]);

  // current scale: ease from the previous level to the active punch level
  let scale = cfg.rest as number;
  let blur = 0;
  const tf = cfg.transitionFrames as number;
  for (let i = 0; i < punches.length; i++) {
    const p = punches[i];
    if (frame < p.f) break;
    const prev = i === 0 ? (cfg.rest as number) : punches[i - 1].scale;
    const k = interpolate(frame, [p.f, p.f + tf], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeOut });
    scale = prev + (p.scale - prev) * k;
    if (cfg.blur && k < 1) blur = (p.scale - prev) * 0.55 * (1 - k);
  }

  const fxs = Array.isArray(cfg.focus) ? cfg.focus : null;
  const ox = fxs ? fxs[0] * 100 : (subject.centerX / width) * 100;
  const oy = fxs ? fxs[1] * 100 : (subject.headY / height) * 100;
  return (
    <AbsoluteFill>
      <ZoomBlur scale={scale} amount={blur} origin={`${ox}% ${oy}%`}>
        <ClipVideo />
      </ZoomBlur>
    </AbsoluteFill>
  );
};

export default makeFx(DigitalZoom);
