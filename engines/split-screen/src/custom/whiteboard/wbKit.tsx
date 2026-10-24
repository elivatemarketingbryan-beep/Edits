import React from 'react';
import type {VisualProps} from '../../types';
import {PAPER, circlePath} from './Whiteboard26';

// Shared pieces for the video29+ whiteboards (cues are OUTPUT frames; `offset` = beat start).
// Full board 1080 x 1920: drawings in y 150-1240 above the ink caption (~1382). Split board 1080 x 960: y 60-740.

export const cue = (beat: VisualProps['beat'], frame: number) => frame + ((beat.visual as {props?: {offset?: number}}).props?.offset ?? 0);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const house = (x: number, y: number, s = 1) => `M${x - 50 * s} ${y} V${y - 60 * s} L${x} ${y - 105 * s} L${x + 50 * s} ${y - 60 * s} V${y} Z`;
export const person = (x: number, y: number, s = 1) => `${circlePath(x, y, 16 * s, 16 * s)} M${x - 24 * s} ${y + 46 * s} Q${x} ${y + 12 * s} ${x + 24 * s} ${y + 46 * s}`;
export const star = (x: number, y: number, r = 30) => Array.from({length: 10}, (_, i) => {
  const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .45 : r;
  return `${i ? 'L' : 'M'}${(x + Math.cos(a) * rr).toFixed(1)} ${(y + Math.sin(a) * rr).toFixed(1)}`;
}).join(' ') + ' Z';
export const cross = (x: number, y: number, r = 40) => `M${x - r} ${y - r} L${x + r} ${y + r} M${x + r} ${y - r} L${x - r} ${y + r}`;
export const rect = (x: number, y: number, w: number, h: number, r = 0) => r
  ? `M${x + r} ${y} H${x + w - r} Q${x + w} ${y} ${x + w} ${y + r} V${y + h - r} Q${x + w} ${y + h} ${x + w - r} ${y + h} H${x + r} Q${x} ${y + h} ${x} ${y + h - r} V${y + r} Q${x} ${y} ${x + r} ${y} Z`
  : `M${x} ${y} H${x + w} V${y + h} H${x} Z`;
export const phone = (x: number, y: number, s = 1) => `${rect(x - 30 * s, y - 52 * s, 60 * s, 104 * s, 10 * s)} M${x - 10 * s} ${y + 38 * s} H${x + 10 * s}`;
export const browser = (x: number, y: number, w = 220, h = 150) => `${rect(x - w / 2, y - h / 2, w, h, 10)} M${x - w / 2} ${y - h / 2 + 32} H${x + w / 2}`;

export const Board: React.FC<{h: number; id: string; f: number; children: React.ReactNode}> = ({h, id, f, children}) => <div style={{position: 'absolute', inset: 0, background: PAPER, overflow: 'hidden'}}>
  <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 35%, rgba(255,255,255,.9), rgba(0,0,0,.05) 100%)'}} />
  <svg viewBox={`0 0 1080 ${h}`} width={1080} height={h} style={{position: 'absolute', inset: 0}}>
    <defs><filter id={id}><feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves={2} seed={Math.floor(f / 4) % 6} /><feDisplacementMap in="SourceGraphic" scale={4} /></filter></defs>
    <g filter={`url(#${id})`}>{children}</g>
  </svg>
</div>;
