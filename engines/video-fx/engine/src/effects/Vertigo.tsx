import React from "react";
import { AbsoluteFill, Easing, Img, staticFile, useCurrentFrame } from "remotion";
import { interpolate } from "../lib/interp";
import { easeInOut, easeOut, prog } from "../lib/anim";
import { useFx } from "../lib/context";
import { ClipVideo, MatteVideo } from "../lib/media";
import { makeFx } from "../lib/shell";
import { ZoomBlur } from "../lib/ZoomBlur";

/**
 * Dolly zoom ("vertigo"). The speaker is cut out and locked at one size while the room
 * behind them zooms. The room is a clean plate (the background with the person removed),
 * so no second copy of the speaker can ever show. The background never zooms past the
 * speaker's own scale, which keeps the invented (inpainted) part of the plate hidden.
 */
const Vertigo: React.FC = () => {
  const frame = useCurrentFrame();
  const { cfg, subject, width, height, dur, t, fps, clip, offset } = useFx();

  const Z = 1 + Math.max(0.02, Number(cfg.intensity));
  const start = t(cfg.at, 0);
  const end = cfg.duration ? start + Math.round(Number(cfg.duration) * fps) : dur;
  const ease = cfg.easing === "linear" ? Easing.linear : cfg.easing === "out" ? easeOut : easeInOut;
  const p = interpolate(frame, [start, Math.max(start + 1, end)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });

  // entry: punch from the original framing up to the locked size (only when the window starts mid-clip
  // or when asked), so the cut into the effect is seamless
  const punch = cfg.entry === "punch" || (cfg.entry === "auto" && offset > 0);
  const e = punch ? prog(frame, 0, 6, easeOut) : 1;
  // exit: if the effect window ends before the clip, settle back to the original framing
  const endsEarly = offset + dur < clip.durationInFrames;
  const x = endsEarly && cfg.entry !== "cut" ? prog(frame, dur - 7, 6, easeInOut) : 0;
  const fgScale = (1 + (Z - 1) * e) * (1 - x) + x;
  const target = cfg.direction === "pull" ? Z - (Z - 1) * p : 1 + (Z - 1) * p;
  const bgScale = Math.min(fgScale, target);
  const blur = punch && e < 1 ? (Z - 1) * 0.5 * (1 - e) : 0;

  const ax = Array.isArray(cfg.anchor) ? cfg.anchor[0] * width : subject.centerX;
  const ay = Array.isArray(cfg.anchor) ? cfg.anchor[1] * height : subject.headY;
  const origin = `${ax}px ${ay}px`;
  const usePlate = cfg.background !== "video" && !!clip.plate;
  const vignette = Number(cfg.vignette) || 0;

  return (
    <AbsoluteFill>
      <ZoomBlur scale={bgScale} amount={blur} origin={origin} samples={5}>
        {usePlate ? (
          <Img src={staticFile(clip.plate!)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <ClipVideo />
        )}
      </ZoomBlur>
      {vignette > 0 && (
        <AbsoluteFill style={{ background: `radial-gradient(ellipse at ${ax}px ${ay}px, rgba(0,0,0,0) 35%, rgba(0,0,0,${vignette * p}) 100%)` }} />
      )}
      <AbsoluteFill style={{ transform: `scale(${fgScale})`, transformOrigin: origin }}>
        <MatteVideo />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default makeFx(Vertigo);
