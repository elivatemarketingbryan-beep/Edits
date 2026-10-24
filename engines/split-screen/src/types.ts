export type Brand = {name: string; accent: string; background: string; surface: string; text: string; muted: string};
export type Visual =
  | {type: 'word'; word?: string; subtext?: string}
  | {type: 'steps'; items: Array<string | {title: string; detail?: string}>}
  | {type: 'comparison'; left: {title: string; items: string[]}; right: {title: string; items: string[]}}
  | {type: 'diagram'; nodes: Array<{id: string; label: string; x?: number; y?: number}>; edges: Array<{from: string; to: string; label?: string}>}
  | {type: 'bars'; items: Array<{label: string; value: number}>; max?: number; unit?: string; sourceLabel?: string}
  | {type: 'checklist'; items: Array<string | {text: string; checked?: boolean}>}
  | {type: 'quote'; text: string; attribution?: string}
  | {type: 'image'; src: string; alt?: string; caption?: string}
  | {type: 'custom'; component: string; props?: Record<string, unknown>};
export type Beat = {
  id: string; from: number; durationInFrames: number;
  layout: 'split' | 'speaker' | 'graphic'; splitRatio?: number;
  focalPoint?: {x: number; y: number};
  mediaFit?: 'cover' | 'contain'; colors?: Partial<Omit<Brand, 'name'>>; captionY?: number; captionTheme?: 'ink';
  graphicMode?: 'framed' | 'canvas'; backdrop?: 'plain' | 'grid' | 'soft';
  headline: string; kicker?: string; visual: Visual; rationale: string;
};
export type Caption = {startFrame: number; endFrame: number; text: string; words?: Array<{startFrame: number; endFrame: number; text: string}>};
export type EditPlan = {
  version: 1; title: string; fps: number; width: number; height: number;
  source: {path: string; durationInFrames: number; width: number; height: number; hasAudio: boolean};
  brand: Brand; edit: {cuts: Array<{startFrame: number; endFrame: number; reason: string}>};
  beats: Beat[]; captions: Caption[]; captionStyle?: 'box' | 'word' | 'small' | 'highlight' | 'stack' | 'pill' | 'pop'; notes?: string[];
  // FAQ-style section cards: the video blurs and a white card with a red label types out the question.
  questions?: Array<{from: number; to: number; label: string; text: string}>;
  // Words drawn in the accent red inside small captions (case-insensitive, punctuation ignored).
  emphasis?: string[];
  // A custom component drawn over the whole frame for the full video (above the footage, below captions
  // and question cards). It receives the global frame.
  overlay?: {component: string; props?: Record<string, unknown>};
  // Punch-in zooms on the footage: scale up over a few frames, hold, ease back out.
  punches?: Array<{from: number; to: number; scale: number; y?: number}>;
  // Frames where on-screen kinetic text already shows the spoken words, so captions are hidden (no doubling).
  captionMute?: Array<{from: number; to: number}>;
  // Caption line for full-screen speaker beats, as a fraction of frame height (default .62).
  captionAt?: number;
  // CSS filter applied to the source video only (cinematic grade).
  grade?: string;
  // Alpha cut-out of the presenter (transparent WebM, same timing as the source) for words placed behind them.
  matte?: string;
  // Source frame where the matte file starts (0 = matte covers the whole source). Lets a short matte cover only the behind-word spans.
  matteStart?: number;
  // Big words placed between the background and the presenter (needs matte). Lines reveal at their own frame.
  behind?: Array<{from: number; to: number; y?: number; matte?: string; matteStart?: number; lines: Array<{text: string; at: number; size?: number; color?: string}>}>;
  // Frames over which the graphic panel slides open/closed when the layout height changes (0 = hard switch).
  panelTransition?: number;
  audio?: {music?: {src: string; volume: number}; effects?: Array<{src: string; atFrame: number; volume: number}>};
};
export type VisualProps = {beat: Beat; brand: Brand; frame: number; fps: number; width: number; height: number};
