import React from 'react';
import {Easing} from 'remotion';
import {clamp} from '../../motion';
import type {VisualProps} from '../../types';

// Story kit: keyframed camera over an illustrated world, posable flat-vector characters and props,
// and push transitions between scenes. Deterministic; everything is a function of the frame.
// Motion rules (Emil/Apple skills): ease-in-out for camera and on-screen moves, ease-out for enters,
// symmetric exits, no scale from 0, no bounce unless something lands.

export const EIO = Easing.bezier(0.77, 0, 0.175, 1);
export const EOUT = Easing.bezier(0.23, 1, 0.32, 1);
type Key = [number, number];
/* Keyframe interpolation with per-segment easing (default ease-in-out); holds outside the range. */
export const kf = (frame: number, keys: Key[], ease: (t: number) => number = EIO) => {
  if (frame <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [f1, v1] = keys[i], [f0, v0] = keys[i - 1];
    if (frame <= f1) return v0 + (v1 - v0) * ease(clamp((frame - f0) / Math.max(1, f1 - f0)));
  }
  return keys[keys.length - 1][1];
};
export const inOut = (frame: number, at: number, len = 12) => EOUT(clamp((frame - at) / len));

export const SK = {
  sky1: '#CFE3FF', sky2: '#F4F8FF', ground: '#E9E2D6', ground2: '#DCD3C3', ink: '#1F2430', mute: '#6B7280',
  pro: '#1E3A5F', proHat: '#FFC21A', home: '#2BB3A3', homeHair: '#3B2A20', skin: '#F2C7A5', skin2: '#C98E6B',
  accent: '#0071e3', good: '#22C55E', bad: '#F43F5E', warn: '#F59E0B', house: '#FFFFFF', roof: '#E76F51', truck: '#FFFFFF',
};

/* Scene container: sky + ground band, enters with a push from the right, exits pushing left. */
export const StoryStage: React.FC<{p: VisualProps; children: React.ReactNode; groundY?: number; enter?: 'push' | 'none'}> = ({p, children, enter = 'push'}) => {
  const dur = p.beat.durationInFrames;
  const inK = enter === 'push' ? EOUT(clamp(p.frame / 12)) : 1;
  const outK = EIO(clamp((p.frame - (dur - 9)) / 9));
  const scale = Math.min(p.width / 1080, p.height / 960);
  return <div style={{position: 'absolute', inset: 0, overflow: 'hidden', background: `linear-gradient(180deg, ${SK.sky1} 0%, ${SK.sky2} 70%)`, fontFamily: '-apple-system, "SF Pro Display", "Segoe UI", Arial, sans-serif'}}>
    <div style={{position: 'absolute', left: (p.width - 1080 * scale) / 2, top: 0, width: 1080, height: 960, transform: `scale(${scale})`, transformOrigin: '0 0'}}>
      <div style={{position: 'absolute', inset: 0, opacity: inK * (1 - outK), transform: `translateX(${(1 - inK) * 90 - outK * 90}px)`}}>{children}</div>
    </div>
  </div>;
};

/* Camera: renders a world SVG (in world units) through a keyframed viewport. */
export const World: React.FC<{cx: number; cy: number; zoom: number; children: React.ReactNode}> = ({cx, cy, zoom, children}) =>
  <svg viewBox="0 0 1080 960" width="100%" height="100%" style={{position: 'absolute', inset: 0}}>
    <g transform={`translate(540 480) scale(${zoom}) translate(${-cx} ${-cy})`}>{children}</g>
  </svg>;

/* World furniture */
export const Ground: React.FC<{y: number; x0?: number; x1?: number}> = ({y, x0 = -2000, x1 = 6000}) => <g>
  <rect x={x0} y={y} width={x1 - x0} height={2000} fill={SK.ground} />
  <rect x={x0} y={y} width={x1 - x0} height={10} fill={SK.ground2} />
</g>;
export const Road: React.FC<{y: number; x0?: number; x1?: number}> = ({y, x0 = -2000, x1 = 6000}) => <g>
  <rect x={x0} y={y} width={x1 - x0} height={90} fill="#B9B4AB" />
  {Array.from({length: Math.ceil((x1 - x0) / 120)}, (_, i) => <rect key={i} x={x0 + i * 120} y={y + 42} width={60} height={7} rx={3} fill="#F5F1E8" />)}
</g>;
export const Tree: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => <g transform={`translate(${x} ${y}) scale(${s})`}>
  <rect x={-8} y={-70} width={16} height={70} fill="#8B6A4E" /><circle cy={-110} r={56} fill="#7DC28B" /><circle cx={-30} cy={-86} r={38} fill="#6AB57A" /><circle cx={32} cy={-90} r={40} fill="#88CC95" />
</g>;
export const Cloud: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => <g transform={`translate(${x} ${y}) scale(${s})`} opacity={.9}>
  <ellipse rx={70} ry={26} fill="#fff" /><circle cx={-24} cy={-18} r={28} fill="#fff" /><circle cx={18} cy={-24} r={34} fill="#fff" />
</g>;
export const House: React.FC<{x: number; y: number; s?: number; roof?: string; wall?: string; door?: string}> = ({x, y, s = 1, roof = SK.roof, wall = SK.house, door = '#2F4858'}) => <g transform={`translate(${x} ${y}) scale(${s})`}>
  <rect x={-120} y={-170} width={240} height={170} rx={6} fill={wall} stroke="#E5E0D6" strokeWidth={3} />
  <path d="M-145 -165L0 -270L145 -165Z" fill={roof} />
  <rect x={-28} y={-92} width={56} height={92} rx={6} fill={door} /><circle cx={16} cy={-46} r={4} fill="#FFD166" />
  <rect x={-98} y={-140} width={52} height={44} rx={5} fill="#BFE0FF" /><rect x={46} y={-140} width={52} height={44} rx={5} fill="#BFE0FF" />
</g>;

/* Work van with a plain business panel (no real brand). */
export const Truck: React.FC<{x: number; y: number; s?: number; label?: string; wheel?: number}> = ({x, y, s = 1, label = 'YOUR CO.', wheel = 0}) => <g transform={`translate(${x} ${y}) scale(${s})`}>
  <rect x={-170} y={-130} width={250} height={100} rx={14} fill={SK.truck} stroke="#D7DCE3" strokeWidth={3} />
  <path d="M80 -112H140L180 -70V-30H80Z" fill={SK.truck} stroke="#D7DCE3" strokeWidth={3} /><path d="M92 -100H134L162 -70H92Z" fill="#BFE0FF" />
  <rect x={-150} y={-112} width={200} height={50} rx={8} fill={SK.pro} /><text x={-50} y={-78} textAnchor="middle" fontSize={26} fontWeight={800} fill="#FFC21A" fontFamily="Arial">{label}</text>
  {[-110, 120].map(cx => <g key={cx} transform={`translate(${cx} -28) rotate(${wheel})`}><circle r={28} fill="#2B2F38" /><circle r={11} fill="#C9CED6" /><rect x={-2} y={-24} width={4} height={14} fill="#8B93A1" /></g>)}
</g>;

export const Coin: React.FC<{x: number; y: number; s?: number; r?: number}> = ({x, y, s = 1, r = 0}) => <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
  <circle r={22} fill="#FFC21A" stroke="#E0A400" strokeWidth={4} /><text y={9} textAnchor="middle" fontSize={26} fontWeight={900} fill="#B07F00" fontFamily="Arial">$</text>
</g>;
export const Bubble: React.FC<{x: number; y: number; w: number; h?: number; k?: number; children?: React.ReactNode; tail?: 'left' | 'right' | 'down'}> = ({x, y, w, h = 90, k = 1, children, tail = 'down'}) =>
  <g transform={`translate(${x} ${y}) scale(${.9 + .1 * k})`} opacity={k}>
    <rect x={-w / 2} y={-h} width={w} height={h} rx={h / 2.4} fill="#fff" stroke="#E3E7EE" strokeWidth={3} />
    {tail === 'down' && <path d="M-14 -2L0 22L14 -2Z" fill="#fff" />}
    {tail === 'left' && <path d={`M${-w / 2 + 30} -2L${-w / 2 + 10} 22L${-w / 2 + 56} -2Z`} fill="#fff" />}
    {tail === 'right' && <path d={`M${w / 2 - 30} -2L${w / 2 - 10} 22L${w / 2 - 56} -2Z`} fill="#fff" />}
    <g transform={`translate(0 ${-h / 2})`}>{children}</g>
  </g>;

/* Simple icons in a 60px box centred at 0,0 */
export const Icon: React.FC<{kind: 'search' | 'like' | 'talk' | 'web' | 'truck' | 'phone' | 'star' | 'q' | 'check' | 'x'; c?: string}> = ({kind, c = SK.ink}) => {
  switch (kind) {
    case 'search': return <g><circle cx={-6} cy={-6} r={16} fill="none" stroke={c} strokeWidth={6} /><path d="M6 6L20 20" stroke={c} strokeWidth={7} strokeLinecap="round" /></g>;
    case 'like': return <path d="M-20 4H-10V24H-20ZM-6 24H14Q22 24 22 16L24 2Q24 -6 16 -6H4L6 -18Q6 -26 -2 -24L-6 4Z" fill={c} />;
    case 'talk': return <g><rect x={-26} y={-22} width={34} height={24} rx={10} fill={c} /><rect x={-6} y={-6} width={34} height={24} rx={10} fill={SK.accent} /></g>;
    case 'web': return <g><rect x={-26} y={-20} width={52} height={40} rx={6} fill="none" stroke={c} strokeWidth={5} /><path d="M-26 -8H26" stroke={c} strokeWidth={5} /></g>;
    case 'truck': return <g><rect x={-26} y={-16} width={32} height={22} rx={3} fill={c} /><path d="M6 -10H18L26 -2V6H6Z" fill={c} /><circle cx={-16} cy={10} r={6} fill={c} /><circle cx={16} cy={10} r={6} fill={c} /></g>;
    case 'phone': return <g><rect x={-14} y={-24} width={28} height={48} rx={6} fill={c} /><rect x={-10} y={-18} width={20} height={32} rx={2} fill="#BFE0FF" /></g>;
    case 'star': return <path d="M0 -24L7 -8L24 -7L11 4L15 22L0 12L-15 22L-11 4L-24 -7L-7 -8Z" fill="#FFC21A" />;
    case 'q': return <text y={14} textAnchor="middle" fontSize={44} fontWeight={900} fill={c} fontFamily="Arial">?</text>;
    case 'check': return <path d="M-16 0L-4 12L18 -12" fill="none" stroke={c} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />;
    case 'x': return <path d="M-14 -14L14 14M14 -14L-14 14" stroke={c} strokeWidth={7} strokeLinecap="round" />;
  }
};

export type Pose = {armL?: number; armR?: number; walk?: number; look?: number; mood?: 'happy' | 'worried' | 'neutral'; phone?: boolean; bob?: number};
/* Flat character, feet at (x,y). armL/armR in degrees (0 = down, 90 = forward/out). walk = phase in radians (undefined = standing). */
export const Person: React.FC<{x: number; y: number; s?: number; kind: 'pro' | 'home' | 'neighbor'; flip?: boolean; pose?: Pose}> = ({x, y, s = 1, kind, flip, pose = {}}) => {
  const shirt = kind === 'pro' ? SK.pro : kind === 'home' ? SK.home : '#8B5CF6';
  const pants = kind === 'pro' ? '#2B2F38' : '#3D4A5C';
  const skin = kind === 'neighbor' ? SK.skin2 : SK.skin;
  const sw = pose.walk !== undefined ? Math.sin(pose.walk) * 24 : 0;
  const bob = (pose.walk !== undefined ? Math.abs(Math.cos(pose.walk)) * -6 : 0) + (pose.bob ?? 0);
  const armL = pose.armL ?? (pose.walk !== undefined ? -sw : 6), armR = pose.armR ?? (pose.walk !== undefined ? sw : -6);
  const mood = pose.mood ?? 'neutral';
  const leg = (dx: number, a: number) => <g transform={`translate(${dx} -112) rotate(${a})`}><rect x={-13} y={0} width={26} height={110} rx={12} fill={pants} /><rect x={-15} y={98} width={36} height={16} rx={8} fill="#2B2F38" /></g>;
  const arm = (dx: number, a: number, hold?: boolean) => <g transform={`translate(${dx} -192) rotate(${a})`}><rect x={-11} y={0} width={22} height={92} rx={11} fill={shirt} /><circle cy={96} r={13} fill={skin} />
    {hold && <g transform="translate(0 104)"><rect x={-14} y={-6} width={28} height={46} rx={6} fill="#1F2430" /><rect x={-10} y={-1} width={20} height={32} rx={2} fill="#BFE0FF" /></g>}</g>;
  return <g transform={`translate(${x} ${y + bob}) scale(${(flip ? -1 : 1) * s} ${s})`}>
    {leg(-20, sw)}{leg(20, -sw)}
    {arm(-50, armL)}
    <rect x={-50} y={-210} width={100} height={110} rx={30} fill={shirt} />
    {kind === 'pro' && <rect x={-50} y={-122} width={100} height={14} fill="#8B6A4E" />}
    <g transform={`translate(${pose.look ?? 0} 0)`}>
      <circle cy={-252} r={40} fill={skin} />
      {kind === 'pro' ? <g><path d="M-44 -262Q-40 -304 0 -304Q40 -304 44 -262Z" fill={SK.proHat} /><rect x={-52} y={-266} width={104} height={10} rx={5} fill="#E5AC00" /></g>
        : <path d={kind === 'home' ? 'M-42 -256Q-44 -300 0 -298Q44 -300 42 -256Q30 -280 0 -276Q-26 -280 -42 -256Z' : 'M-40 -262Q-30 -298 4 -296Q40 -292 40 -258Q20 -276 -40 -262Z'} fill={kind === 'home' ? SK.homeHair : '#1F1A17'} />}
      <circle cx={-14} cy={-252} r={4.5} fill={SK.ink} /><circle cx={14} cy={-252} r={4.5} fill={SK.ink} />
      {mood === 'happy' && <path d="M-14 -234Q0 -222 14 -234" fill="none" stroke={SK.ink} strokeWidth={4} strokeLinecap="round" />}
      {mood === 'worried' && <><path d="M-12 -228Q0 -236 12 -228" fill="none" stroke={SK.ink} strokeWidth={4} strokeLinecap="round" /><path d="M-22 -268L-8 -264M22 -268L8 -264" stroke={SK.ink} strokeWidth={3.5} strokeLinecap="round" /></>}
      {mood === 'neutral' && <path d="M-10 -232H10" stroke={SK.ink} strokeWidth={4} strokeLinecap="round" />}
    </g>
    {arm(50, armR, pose.phone)}
  </g>;
};

/* HTML label pill in screen space (light-kit look) */
export const Tag: React.FC<{x: number; y: number; k: number; tone?: 'dark' | 'light' | 'accent' | 'bad' | 'good'; children: React.ReactNode; anchor?: 'center' | 'left'}> = ({x, y, k, tone = 'dark', children, anchor = 'center'}) => {
  const st = {dark: {background: '#1F2430', color: '#fff'}, light: {background: '#fff', color: SK.ink}, accent: {background: SK.accent, color: '#fff'}, bad: {background: SK.bad, color: '#fff'}, good: {background: SK.good, color: '#fff'}}[tone];
  return <div style={{position: 'absolute', left: x, top: y, transform: `translate(${anchor === 'center' ? '-50%' : '0'}, -50%) translateY(${(1 - k) * 14}px) scale(${.92 + .08 * k})`, opacity: k, padding: '14px 28px', borderRadius: 999, fontSize: 30, fontWeight: 700, whiteSpace: 'nowrap', boxShadow: '0 1px 2px rgba(0,0,0,.06), 0 12px 32px rgba(0,0,0,.12)', ...st}}>{children}</div>;
};
