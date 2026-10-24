import React from 'react';
import {Img, Loop, OffthreadVideo, Sequence, staticFile} from 'remotion';

// Assets from the user's "ULTIMATE Editing Pack" (converted copies in public/assets/pack; see SOURCES.md there).
// Markups are hand-drawn alpha animations (WebM VP9 with alpha, 960x540, about 4.7 s, drawn in the first second).

export type MarkupName = 'arrow' | 'check-mark' | 'circle---red' | 'circle-2---red' | 'circle-gesture---white' | 'computer-click' | 'dollar-sign' | 'question-mark'
  | 'rectangle---red' | 'rectangle-cool---red' | 'rectangle-skinny---red' | 'skinny-circle---red' | 'underline-skinny' | 'underline-thick' | 'x-mark-red' | 'x-mark-white';

/* A hand-drawn markup that starts drawing at `at` (frames, in the parent sequence) over the box (x,y,w,h). */
export const Markup: React.FC<{name: MarkupName; at: number; x: number; y: number; w: number; h?: number; dur?: number; rotate?: number}> = ({name, at, x, y, w, h, dur = 90, rotate = 0}) =>
  <Sequence from={at} durationInFrames={dur} layout="none">
    <div style={{position: 'absolute', left: x, top: y, width: w, height: h ?? w * 9 / 16, transform: rotate ? `rotate(${rotate}deg)` : undefined, pointerEvents: 'none', zIndex: 30}}>
      <OffthreadVideo src={staticFile(`assets/pack/markup/${name}.webm`)} transparent muted style={{width: '100%', height: '100%', objectFit: 'fill'}} />
    </div>
  </Sequence>;

/* Film-burn flash, screen-blended over everything; use at a cut. burn1–3 are hard burns, burn4–5 hard scratch. */
export const Burn: React.FC<{at: number; n?: 1 | 2 | 3 | 4 | 5; opacity?: number}> = ({at, n = 1, opacity = .9}) =>
  <Sequence from={at} durationInFrames={26} layout="none">
    <OffthreadVideo src={staticFile(`assets/pack/burn/burn${n}.mp4`)} muted style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', mixBlendMode: 'screen', opacity, zIndex: 40, pointerEvents: 'none'}} />
  </Sequence>;

/* Looping 35mm grain, overlay-blended. */
export const Grain: React.FC<{opacity?: number}> = ({opacity = .18}) =>
  <Loop durationInFrames={240} layout="none">
    <OffthreadVideo src={staticFile('assets/pack/grain/grain35.mp4')} muted style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', mixBlendMode: 'overlay', opacity, zIndex: 35, pointerEvents: 'none'}} />
  </Loop>;

/* Real logos (Google, GOOGLE ADS, facebook, INSTAGRAM, TIK TOK, YOUTUBE ADS, youtube, IPHONE, MACBOOK, …) and emojis by file name. */
export const Logo: React.FC<{name: string; style?: React.CSSProperties}> = ({name, style}) => <Img src={staticFile(`assets/pack/logos/${name}.png`)} style={{objectFit: 'contain', ...style}} />;
export const Emoji: React.FC<{name: string; style?: React.CSSProperties}> = ({name, style}) => <Img src={staticFile(`assets/pack/emoji/${name}.png`)} style={{objectFit: 'contain', ...style}} />;
