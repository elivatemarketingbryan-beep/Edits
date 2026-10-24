import React from "react";
import { AbsoluteFill, Img, OffthreadVideo, staticFile } from "remotion";
import { useFx } from "./context";
import type { Clip } from "./types";

const fill: React.CSSProperties = { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" };

/**
 * The source footage, kept in sync with the effect window.
 * `shift` moves playback by N frames (e.g. to freeze or offset a copy).
 */
export const ClipVideo: React.FC<{ clip?: Clip; shift?: number; style?: React.CSSProperties; offset?: number }> = ({ clip, shift = 0, style, offset }) => {
  const fx = useFx();
  const c = clip ?? fx.clip;
  const trim = Math.max(0, (offset ?? fx.offset) + shift);
  return <OffthreadVideo src={staticFile(c.src)} muted trimBefore={trim || undefined} style={{ ...fill, ...style }} />;
};

/** The person cut out of the footage (transparent everywhere else). Renders nothing when no matte exists. */
export const MatteVideo: React.FC<{ clip?: Clip; shift?: number; style?: React.CSSProperties; offset?: number }> = ({ clip, shift = 0, style, offset }) => {
  const fx = useFx();
  const c = clip ?? fx.clip;
  if (!c.matte) return null;
  const trim = Math.max(0, (offset ?? fx.offset) + shift);
  return <OffthreadVideo src={staticFile(c.matte)} muted transparent trimBefore={trim || undefined} style={{ ...fill, ...style }} />;
};

/** Full-frame layer wrapper with an optional CSS transform. */
export const Layer: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <AbsoluteFill style={style}>{children}</AbsoluteFill>
);

/** An image from config: a bundled asset path ("assets/..") or a URL. */
export const ConfigImg: React.FC<{ src: string; style?: React.CSSProperties }> = ({ src, style }) => (
  <Img src={/^(https?:|data:)/.test(src) ? src : staticFile(src)} style={style} />
);

export const isVideoPath = (s: unknown): s is string => typeof s === "string" && /\.(mp4|mov|webm|m4v)$/i.test(s);
export const isImagePath = (s: unknown): s is string => typeof s === "string" && /\.(png|jpe?g|webp|gif|svg)$/i.test(s);

/** Video or image from config, filling its box. Videos loop from their start and are muted. */
export const ConfigMedia: React.FC<{ src: string; style?: React.CSSProperties }> = ({ src, style }) => {
  if (isVideoPath(src)) return <OffthreadVideo src={/^https?:/.test(src) ? src : staticFile(src)} muted style={{ ...fill, ...style }} />;
  return <ConfigImg src={src} style={{ ...fill, ...style }} />;
};
