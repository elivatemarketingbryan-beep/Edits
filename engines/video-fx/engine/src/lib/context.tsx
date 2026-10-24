import React, { createContext, useContext } from "react";
import type { CaptionConfig, Clip, FxProps, SubjectSummary, Word } from "./types";
import { resolveTime, type TimeRef } from "./time";

export type Fx = {
  props: FxProps;
  cfg: Record<string, any>;
  captions: CaptionConfig;
  clip: Clip;
  clips: Clip[];
  /** clip frame where this effect window starts (keeps video layers in sync) */
  offset: number;
  /** length of the effect window in frames */
  dur: number;
  fps: number;
  width: number;
  height: number;
  /** transcript, with times relative to the effect window */
  words: Word[];
  /** resolve a TimeRef (seconds / "@word") to a frame inside the window */
  t: (ref: TimeRef | undefined | null, fallbackSec?: number) => number;
  subject: SubjectSummary;
  hasMatte: boolean;
  /** true when the effect window stops before the clip ends (effects should exit gracefully) */
  endsEarly: boolean;
};

const Ctx = createContext<Fx | null>(null);
export const FxProvider: React.FC<{ value: Fx; children: React.ReactNode }> = ({ value, children }) => (
  <Ctx.Provider value={value}>{children}</Ctx.Provider>
);
export const useFx = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useFx() used outside an effect");
  return v;
};

export function fallbackSubject(width: number, height: number): SubjectSummary {
  return {
    box: [Math.round(width * 0.18), Math.round(height * 0.16), Math.round(width * 0.82), height],
    centerX: Math.round(width / 2),
    headTop: Math.round(height * 0.16),
    headY: Math.round(height * 0.27),
    coverage: 0.45,
  };
}

export function makeFxValue(props: FxProps, clip: Clip, offset: number, dur: number, words: Word[], endsEarly = false): Fx {
  const { fps, width, height } = props.output;
  const durSec = dur / fps;
  return {
    props,
    cfg: props.config,
    captions: props.captions,
    clip,
    clips: props.clips,
    offset,
    dur,
    fps,
    width,
    height,
    words,
    t: (ref, fallbackSec = 0) => Math.round(resolveTime(ref, words, durSec, fallbackSec) * fps),
    subject: clip.subject ?? fallbackSubject(width, height),
    hasMatte: !!clip.matte,
    endsEarly,
  };
}
