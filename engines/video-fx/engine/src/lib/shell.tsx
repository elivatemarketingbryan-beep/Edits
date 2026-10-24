import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { Captions } from "./captions";
import { FxProvider, makeFxValue } from "./context";
import { FontGate } from "./fonts";
import { ClipVideo } from "./media";
import { shiftWords } from "./time";
import type { FxProps } from "./types";

export type EffectOptions = {
  /** the effect places captions itself (e.g. between layers, or in a split layout) */
  ownsCaptions?: boolean;
  /** the effect plays several clips back to back (zoom-through-cut) */
  multiClip?: boolean;
};

/**
 * Wraps an effect into a full composition: source audio, the optional effect window
 * (plain footage before/after it), fonts and the global caption layer.
 */
export function makeFx(Effect: React.FC, opts: EffectOptions = {}): React.FC<FxProps> {
  const Composition: React.FC<FxProps> = (props) => {
    if (!props.clips?.length) {
      return (
        <AbsoluteFill style={{ background: "#111", color: "#fff", justifyContent: "center", alignItems: "center", fontSize: 40, fontFamily: "sans-serif", padding: 80, textAlign: "center" }}>
          Render this effect with: node fx.mjs render {props.effect} your-video.mp4
        </AbsoluteFill>
      );
    }
    const { fps, durationInFrames: total } = props.output;
    let acc = 0;
    const starts = props.clips.map((c) => {
      const s = acc;
      acc += c.durationInFrames;
      return s;
    });
    const audioClips = opts.multiClip ? props.clips : [props.clips[0]];
    const allWords = opts.multiClip ? props.clips.flatMap((c, i) => shiftWords(c.words, -starts[i] / fps)) : props.clips[0].words;

    let ws = 0;
    let we = total;
    if (!opts.multiClip && props.window) {
      ws = Math.max(0, Math.min(total - 1, Math.round(props.window[0] * fps)));
      we = Math.max(ws + 1, Math.min(total, Math.round(props.window[1] * fps)));
    }
    const clip0 = props.clips[0];
    const fx = makeFxValue(props, clip0, ws, we - ws, shiftWords(allWords, ws / fps), we < total);

    return (
      <FontGate>
        <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
          {audioClips.map((c, i) => (
            <Sequence key={`a${i}`} from={starts[i]} durationInFrames={c.durationInFrames} layout="none">
              <Audio src={staticFile(c.src)} />
            </Sequence>
          ))}
          {ws > 0 && (
            <Sequence durationInFrames={ws}>
              <FxProvider value={makeFxValue(props, clip0, 0, ws, allWords)}>
                <ClipVideo />
              </FxProvider>
            </Sequence>
          )}
          <Sequence from={ws} durationInFrames={we - ws}>
            <FxProvider value={fx}>
              <Effect />
            </FxProvider>
          </Sequence>
          {we < total && (
            <Sequence from={we} durationInFrames={total - we}>
              <FxProvider value={makeFxValue(props, clip0, we, total - we, shiftWords(allWords, we / fps))}>
                <ClipVideo />
              </FxProvider>
            </Sequence>
          )}
          {!opts.ownsCaptions && <Captions words={allWords} cfg={props.captions} />}
          {opts.ownsCaptions && ws > 0 && (
            <Sequence durationInFrames={ws}>
              <Captions words={allWords} cfg={props.captions} />
            </Sequence>
          )}
          {opts.ownsCaptions && we < total && (
            <Sequence from={we} durationInFrames={total - we}>
              <Captions words={shiftWords(allWords, we / fps)} cfg={props.captions} />
            </Sequence>
          )}
        </AbsoluteFill>
      </FontGate>
    );
  };
  return Composition;
}
