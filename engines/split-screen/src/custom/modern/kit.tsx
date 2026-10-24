import React from 'react';
import {spring, interpolate, Easing} from 'remotion';
import {clamp} from '../../motion';
import type {VisualProps} from '../../types';

// Shared sleek product-UI kit: glass cards over a drifting gradient mesh,
// spring + blur reveals, kinetic headlines, a scripted cursor. Deterministic.

export const SANS = 'Inter, "Segoe UI", Arial, sans-serif';
const CW = 1080;
export const C = {ink: '#F5F7FF', mute: 'rgba(235,240,255,.58)', faint: 'rgba(235,240,255,.12)', good: '#34D399', bad: '#FB7185', warn: '#FBBF24', a: '#818CF8', b: '#22D3EE'};

export const cues = (p: VisualProps, fallback: number[]) => {
  const d = p.beat.visual.type === 'custom' ? p.beat.visual.props?.cues : undefined;
  return Array.isArray(d) && d.every(n => typeof n === 'number') ? d as number[] : fallback;
};
export const sp = (p: VisualProps, at: number, damping = 15) => spring({frame: p.frame - at, fps: p.fps, config: {damping, mass: .7, stiffness: 120}});
export const lin = (p: VisualProps, at: number, len: number) => clamp((p.frame - at) / len);
export const smooth = (v: number) => v * v * (3 - 2 * v);
// Motion tokens (Emil Kowalski / review-animations standards): strong ease-out for things
// entering or leaving, strong ease-in-out for things moving on screen. Never ease-in.
export const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
export const EASE_IN_OUT = Easing.bezier(0.77, 0, 0.175, 1);
export const eOut = (p: VisualProps, at: number, len: number) => EASE_OUT(lin(p, at, len));
export const eMove = (p: VisualProps, at: number, len: number) => EASE_IN_OUT(lin(p, at, len));
// Pop-in scale that never starts from 0 (nothing appears from nothing): 0.9 → 1.
export const pop = (k: number) => .9 + .1 * clamp(k);
const EXIT = 8; // frames: scenes leave the way they arrived (blur + fade + slight scale)

export const glass: React.CSSProperties = {
  position: 'absolute', background: 'linear-gradient(160deg, rgba(255,255,255,.11), rgba(255,255,255,.04))',
  border: '1.5px solid rgba(255,255,255,.16)', borderRadius: 40, backdropFilter: 'blur(28px)',
  boxShadow: '0 40px 90px rgba(3,4,20,.55), inset 0 1.5px 0 rgba(255,255,255,.14)', overflow: 'hidden',
};
export const label: React.CSSProperties = {fontSize: 24, fontWeight: 700, letterSpacing: 3.5, textTransform: 'uppercase', color: C.mute};

/* Stage: deep background, three slow gradient blobs, a faint masked grid, scaled design canvas. */
// ch is the design canvas height: 1500 for a full-screen panel, 900 for a split (top-half) panel.
export const Stage: React.FC<{p: VisualProps; tint?: [string, string, string]; ch?: number; top?: number; children: React.ReactNode}> = ({p, tint = ['#4F46E5', '#06B6D4', '#9333EA'], ch = 1500, top = 60, children}) => {
  const t = p.frame / 30;
  const scale = Math.min(p.width / CW, p.height / (ch + top * 2));
  const out = EASE_OUT(clamp((p.frame - (p.beat.durationInFrames - EXIT)) / EXIT));
  const blobs = [[.15 + .08 * Math.sin(t * .4), .2 + .06 * Math.cos(t * .3), tint[0]], [.85 + .07 * Math.cos(t * .35), .45 + .08 * Math.sin(t * .27), tint[1]], [.4 + .1 * Math.sin(t * .22 + 1), .85 + .05 * Math.cos(t * .4), tint[2]]] as const;
  return <div style={{position: 'absolute', inset: 0, background: '#070814', overflow: 'hidden', fontFamily: SANS, color: C.ink}}>
    {blobs.map(([x, y, c], i) => <div key={i} style={{position: 'absolute', left: `${x * 100}%`, top: `${y * 100}%`, width: 1100, height: 1100, marginLeft: -550, marginTop: -550, borderRadius: '50%', background: `radial-gradient(circle, ${c} 0%, transparent 62%)`, opacity: .42, filter: 'blur(30px)'}} />)}
    <div style={{position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px)', backgroundSize: '72px 72px', backgroundPosition: `0 ${-(p.frame * .6) % 72}px`, WebkitMaskImage: 'radial-gradient(ellipse at 50% 40%, #000 20%, transparent 75%)'}} />
    <div style={{position: 'absolute', left: (p.width - CW * scale) / 2, top: top * scale, width: CW, height: ch, transform: `scale(${scale * (1 - .03 * out)})`, transformOrigin: '50% 40%', opacity: 1 - out, filter: out > 0 ? `blur(${10 * out}px)` : undefined}}>{children}</div>
  </div>;
};

/* Spring + blur reveal for any block. */
export const Rise: React.FC<{p: VisualProps; at: number; style?: React.CSSProperties; dy?: number; children?: React.ReactNode}> = ({p, at, style, dy = 50, children}) => {
  const k = sp(p, at);
  return <div style={{position: 'absolute', ...style, opacity: clamp(k * 1.5) * (typeof style?.opacity === 'number' ? style.opacity : 1), transform: `translateY(${(1 - k) * dy}px) scale(${.94 + .06 * k})${style?.transform ? ' ' + style.transform : ''}`, filter: `blur(${Math.max(0, 1 - k) * 16}px)`}}>{children}</div>;
};

/* Word-by-word headline with staggered spring and blur. */
export const Kinetic: React.FC<{p: VisualProps; at: number; text: string; size?: number; top: number; left?: number; grad?: string; weight?: number}> = ({p, at, text, size = 76, top, left = 80, grad, weight = 800}) =>
  <div style={{position: 'absolute', top, left, right: 60, fontSize: size, fontWeight: weight, letterSpacing: -size * .035, lineHeight: 1.04}}>
    {text.split(' ').map((w, i) => {
      const k = sp(p, at + i * 2, 16); // ~67ms stagger
      return <span key={i} style={{display: 'inline-block', marginRight: size * .24, opacity: clamp(k * 1.4), transform: `translateY(${(1 - k) * size * .5}px)`, filter: `blur(${Math.max(0, 1 - k) * 12}px)`,
        ...(grad ? {backgroundImage: grad, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'} : {})}}>{w}</span>;
    })}
  </div>;

export const Bar: React.FC<{v: number; color: string; h?: number; track?: boolean}> = ({v, color, h = 18, track = true}) =>
  <div style={{position: 'relative', height: h, borderRadius: h, background: track ? C.faint : 'transparent', overflow: 'hidden'}}>
    <div style={{position: 'absolute', inset: 0, width: `${clamp(v) * 100}%`, borderRadius: h, background: color, boxShadow: `0 0 24px ${color.includes('gradient') ? 'rgba(129,140,248,.5)' : color}`}} />
  </div>;

export const Ring: React.FC<{v: number; size: number; stroke?: number; from?: string; to?: string; children?: React.ReactNode}> = ({v, size, stroke = 22, from = C.a, to = C.b, children}) => {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, id = `g${from.slice(1)}${to.slice(1)}`;
  return <div style={{position: 'relative', width: size, height: size}}>
    <svg width={size} height={size} style={{transform: 'rotate(-90deg)'}}>
      <defs><linearGradient id={id}><stop offset="0" stopColor={from} /><stop offset="1" stopColor={to} /></linearGradient></defs>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.faint} strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`url(#${id})`} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${c * clamp(v)} ${c}`} />
    </svg>
    <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column'}}>{children}</div>
  </div>;
};

export const Check: React.FC<{k: number; size?: number; color?: string}> = ({k, size = 34, color = '#06120C'}) =>
  <svg width={size} height={size} viewBox="0 0 34 34"><path d="M8 18l6 6 12-14" fill="none" stroke={color} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - clamp(k)} /></svg>;

export const Avatar: React.FC<{c: string; s?: number}> = ({c, s = 64}) =>
  <div style={{width: s, height: s, borderRadius: '50%', background: `linear-gradient(140deg, ${c}, rgba(255,255,255,.25))`, boxShadow: `0 0 0 3px rgba(7,8,20,.9)`, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', overflow: 'hidden'}}>
    <div style={{width: s * .5, height: s * .5, borderRadius: '50%', background: 'rgba(255,255,255,.55)', marginBottom: -s * .14}} /></div>;

export const Pill: React.FC<{color: string; children: React.ReactNode; solid?: boolean}> = ({color, children, solid}) =>
  <div style={{display: 'inline-flex', alignItems: 'center', gap: 12, padding: '16px 30px', borderRadius: 999, fontSize: 30, fontWeight: 750, color: solid ? '#06120C' : color, background: solid ? color : `${color}22`, border: `1.5px solid ${color}66`, boxShadow: `0 0 40px ${color}44`}}>{children}</div>;

/* Cursor along keyframes [frame, x, y]; ripple on clicks. */
export const Cursor: React.FC<{p: VisualProps; path: Array<[number, number, number]>; clicks?: number[]}> = ({p, path, clicks = []}) => {
  const fs = path.map(q => q[0]);
  const opt = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const, easing: EASE_IN_OUT};
  const x = interpolate(p.frame, fs, path.map(q => q[1]), opt), y = interpolate(p.frame, fs, path.map(q => q[2]), opt);
  const vis = clamp((p.frame - fs[0] + 1) / 6) * (1 - clamp((p.frame - fs[fs.length - 1] - 10) / 8));
  const press = clicks.some(c => p.frame >= c && p.frame < c + 5);
  return <div style={{position: 'absolute', left: x, top: y, opacity: vis, zIndex: 50}}>
    {clicks.map(c => { const k = clamp((p.frame - c) / 18); return k > 0 && k < 1 ? <div key={c} style={{position: 'absolute', left: -50 * k, top: -50 * k, width: 100 * k, height: 100 * k, borderRadius: '50%', border: `3px solid rgba(255,255,255,${.7 * (1 - k)})`}} /> : null; })}
    <svg width="54" height="62" viewBox="0 0 27 31" style={{transform: `scale(${press ? .86 : 1})`, filter: 'drop-shadow(0 8px 14px rgba(0,0,0,.5))'}}><path d="M2 2l21 14-9.5 2 5 10-4 2-5-10L2 26z" fill="#FFFFFF" stroke="#0B0D1A" strokeWidth="1.6" strokeLinejoin="round" /></svg>
  </div>;
};

