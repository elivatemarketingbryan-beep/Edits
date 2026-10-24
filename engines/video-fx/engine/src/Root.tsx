import React from "react";
import { Composition } from "remotion";
import captionDefaults from "../effects/_captions.json";
import { EFFECTS } from "./effects/registry";
import { CalloutReel, type CalloutReelProps } from "./showreel/CalloutReel";
import { Showreel, type ShowreelProps } from "./showreel/Showreel";
import type { CaptionConfig, FxProps } from "./lib/types";

export const Root: React.FC = () => (
  <>
    {EFFECTS.map(({ meta, component }) => (
      <Composition
        key={meta.id}
        id={meta.compositionId}
        component={component}
        width={1080}
        height={1920}
        fps={30}
        durationInFrames={150}
        defaultProps={{
          effect: meta.id,
          clips: [],
          config: meta.defaults,
          captions: { ...(captionDefaults as CaptionConfig), ...meta.captions },
          window: null,
          output: { width: 1080, height: 1920, fps: 30, durationInFrames: 150 },
        } satisfies FxProps}
        calculateMetadata={({ props }) => ({
          durationInFrames: props.output.durationInFrames,
          fps: props.output.fps,
          width: props.output.width,
          height: props.output.height,
        })}
      />
    ))}
    <Composition
      id="Showreel"
      component={Showreel}
      width={1080}
      height={1920}
      fps={30}
      durationInFrames={300}
      defaultProps={{ items: [], headline: "video effects", accentWord: "17", subline: "claude can create", accent: "#FFE14D" } satisfies ShowreelProps}
      calculateMetadata={({ props }) => ({
        durationInFrames: Math.max(30, props.items.reduce((s, it) => s + Math.round(it.duration * 30), 0)),
      })}
    />
    <Composition
      id="CalloutReel"
      component={CalloutReel}
      width={1080}
      height={1920}
      fps={30}
      durationInFrames={300}
      defaultProps={{
        main: "",
        durationInFrames: 300,
        headline: { count: "17", line1: "video effects", line2: "claude can create" },
        items: [],
        phrases: [],
        join: null,
        accent: "#FFE14D",
        layout: { headlineY: 0.03, panelsY: 0.105, cardX: 0.5, cardY: 0.44, cardW: 0.31, midCaptionY: 0.56, topCaptionY: 0.08 },
      } satisfies CalloutReelProps}
      calculateMetadata={({ props }) => ({ durationInFrames: Math.max(30, props.durationInFrames) })}
    />
  </>
);
