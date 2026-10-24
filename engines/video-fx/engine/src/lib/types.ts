export type Word = { text: string; start: number; end: number };

export type SubjectSummary = {
  /** median person box in pixels: [x0, y0, x1, y1] */
  box: [number, number, number, number];
  centerX: number;
  /** highest point of the head (px from top) */
  headTop: number;
  /** rough centre of the face (px from top) */
  headY: number;
  /** fraction of the frame covered by the person */
  coverage: number;
};

export type Clip = {
  src: string;
  matte: string | null;
  contours: string | null;
  subjectFile: string | null;
  /** clean background plate (the room with the person removed), if the effect asked for one */
  plate?: string | null;
  subject: SubjectSummary | null;
  words: Word[];
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
};

export type CaptionStyle = "pop" | "caps" | "twoTier" | "serif" | "tracked" | "box";

export type CaptionConfig = {
  enabled: boolean;
  style: CaptionStyle;
  /** vertical centre of the caption block, 0 = top, 1 = bottom */
  y: number;
  /** "auto" picks one strong word per phrase, "none" disables, or a list of words */
  emphasis: "auto" | "none" | string[];
  accent: string;
  color: string;
  /** font size in px at 1080 wide */
  size: number;
  maxWords: number;
  maxChars: number;
  uppercase: boolean;
};

export type FxProps = {
  effect: string;
  clips: Clip[];
  config: Record<string, any>;
  captions: CaptionConfig;
  /** seconds [start, end] where the effect runs; null = whole clip */
  window: [number, number] | null;
  output: { width: number; height: number; fps: number; durationInFrames: number };
  draft?: boolean;
};
