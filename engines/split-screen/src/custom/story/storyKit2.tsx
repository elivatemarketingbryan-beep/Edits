import React from 'react';
import {clamp} from '../../motion';
import type {VisualProps} from '../../types';
import {EIO, EOUT, kf} from './storyKit';

// Modern story kit (v2): pastel gradient world, parallax depth layers with a keyframed camera,
// horizontal motion blur from camera speed, soft contact shadows, gradient-lit geometric characters,
// frosted-glass tags, and a circular mask reveal between scenes. Same frame-pure rules as v1.
export {kf, EIO, EOUT};
export const inK = (f: number, at: number, len = 12) => EOUT(clamp((f - at) / len));

export const M = {
  skyTop: '#E9EDFF', skyBot: '#FFF1EA', far: '#D9DEF9', mid: '#C8D0F5', ground: '#F4EEE9', ground2: '#EAE1D9',
  ink: '#1E2140', mute: '#7A7F9A', indigo: '#5B5BF0', violet: '#8B5CF6', peach: '#FF9A7A', mint: '#2CC5A0', sun: '#FFC66B',
  pro: ['#4F55E8', '#3138B8'], home: ['#22C3A6', '#119579'], neighbor: ['#FF8A6B', '#E2604A'], skin: ['#F6CFB2', '#E7AE8C'], skin2: ['#C98E6B', '#A86F50'],
};

/* Gradient defs used by everything in a World2. */
const Defs: React.FC = () => <defs>
  {(['pro', 'home', 'neighbor', 'skin', 'skin2'] as const).map(k => <linearGradient key={k} id={`g-${k}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={M[k][0]} /><stop offset="1" stopColor={M[k][1]} /></linearGradient>)}
  <linearGradient id="g-house" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFFFFF" /><stop offset="1" stopColor="#ECEBFA" /></linearGradient>
  <linearGradient id="g-roof" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#8B7CF6" /><stop offset="1" stopColor="#5B5BF0" /></linearGradient>
  <linearGradient id="g-roof2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFB199" /><stop offset="1" stopColor="#FF7A6B" /></linearGradient>
  <linearGradient id="g-glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#CFE0FF" /><stop offset="1" stopColor="#A9C4FF" /></linearGradient>
  <radialGradient id="g-shadow"><stop offset="0" stopColor="rgba(30,33,64,.28)" /><stop offset="1" stopColor="rgba(30,33,64,0)" /></radialGradient>
</defs>;

export type Layer = {depth: number; blur?: number; children: React.ReactNode};
/* Parallax camera: each layer moves by depth × camera offset. Motion blur from horizontal camera speed. */
// h = canvas height: 960 for a split panel, 1920 for a faceless full-screen panel (then the camera zooms
// in a little and frames the action higher so captions sit over the ground).
export const World2: React.FC<{cx: number; cy: number; zoom: number; vx?: number; layers: Layer[]; h?: number}> = ({cx, cy, zoom: z0, vx = 0, layers, h = 960}) => {
  const mb = Math.min(10, Math.abs(vx) * .35);
  const tall = h > 960, zoom = tall ? z0 * 1.25 : z0, H2 = tall ? h * .55 : 480;
  // Faceless/full-height: a soft blurred foreground strip adds depth to the ground band under the captions.
  const all: Layer[] = tall ? [...layers, {depth: 1.35, blur: 2, children: <g>{Array.from({length: 40}, (_, i) => <ellipse key={i} cx={-1500 + i * 160} cy={930 + 18 * Math.sin(i * 2.1)} rx={110} ry={46} fill={i % 2 ? '#BFE6CF' : '#A9DDBF'} />)}</g>}] : layers;
  return <svg viewBox={`0 0 1080 ${h}`} width="100%" height="100%" style={{position: 'absolute', inset: 0}}>
    <Defs />
    <filter id="mb" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation={`${mb} 0`} /></filter>
    {[2, 6].map(b => <filter key={b} id={`blur${b}`}><feGaussianBlur stdDeviation={b} /></filter>)}
    <g filter={mb > .3 ? 'url(#mb)' : undefined}>
      {all.map((L, i) => <g key={i} filter={L.blur ? `url(#blur${L.blur})` : undefined}
        transform={`translate(540 ${H2}) scale(${1 + (zoom - 1) * L.depth}) translate(${-cx * L.depth - 540 * (1 - L.depth)} ${-cy * L.depth - H2 * (1 - L.depth)})`}>{L.children}</g>)}
    </g>
  </svg>;
};
/* Camera speed helper for motion blur: world units per frame. */
export const speed = (f: number, keys: Array<[number, number]>) => kf(f, keys) - kf(f - 1, keys);

/* Scene container with a circular mask reveal in and a soft scale-fade out. */
export const canvasH = (p: VisualProps) => p.height > p.width * 1.2 ? Math.round(1080 * p.height / p.width) : 960;
export const Stage2: React.FC<{p: VisualProps; origin?: [number, number]; sky?: [string, string]; children: React.ReactNode}> = ({p, origin = [540, 480], sky, children}) => {
  const ch = canvasH(p);
  const dur = p.beat.durationInFrames;
  const r = EOUT(clamp(p.frame / 14)) * 1400;
  const out = EIO(clamp((p.frame - (dur - 9)) / 9));
  const scale = Math.min(p.width / 1080, p.height / ch);
  return <div style={{position: 'absolute', inset: 0, overflow: 'hidden', background: '#0F1230', fontFamily: '-apple-system, "SF Pro Display", "Segoe UI", Arial, sans-serif'}}>
    <div style={{position: 'absolute', left: (p.width - 1080 * scale) / 2, top: 0, width: 1080, height: ch, transform: `scale(${scale})`, transformOrigin: '0 0'}}>
      <div style={{position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${(sky ?? [M.skyTop, M.skyBot])[0]} 0%, ${(sky ?? [M.skyTop, M.skyBot])[1]} 75%)`, clipPath: `circle(${r * ch / 960}px at ${origin[0]}px ${origin[1] * ch / 960}px)`, opacity: 1 - out, transform: `scale(${1 - .03 * out})`}}>
        {children}
      </div>
    </div>
  </div>;
};

/* World pieces */
export const Hills: React.FC<{y: number; color: string; amp?: number; x0?: number; x1?: number; seed?: number}> = ({y, color, amp = 60, x0 = -1500, x1 = 4500, seed = 0}) => {
  const n = 18, w = (x1 - x0) / n;
  let d = `M${x0} ${y + 400}L${x0} ${y}`;
  for (let i = 0; i < n; i++) d += `Q${x0 + i * w + w / 2} ${y - amp * (0.6 + 0.4 * Math.sin(i * 1.7 + seed))} ${x0 + (i + 1) * w} ${y}`;
  return <path d={d + `L${x1} ${y + 400}Z`} fill={color} />;
};
export const Floor: React.FC<{y: number; c?: string}> = ({y, c = M.ground}) => <g><rect x={-2000} y={y} width={7000} height={1200} fill={c} /><rect x={-2000} y={y} width={7000} height={6} fill={M.ground2} opacity={.6} /></g>;
export const ShadowE: React.FC<{x: number; y: number; w?: number}> = ({x, y, w = 120}) => <ellipse cx={x} cy={y + 4} rx={w / 2} ry={w / 9} fill="url(#g-shadow)" />;
export const Tree2: React.FC<{x: number; y: number; s?: number; c?: string}> = ({x, y, s = 1, c = '#7FD6B6'}) => <g transform={`translate(${x} ${y}) scale(${s})`}>
  <ShadowE x={0} y={0} w={130} /><rect x={-7} y={-80} width={14} height={80} rx={7} fill="#B49A87" /><ellipse cy={-140} rx={60} ry={78} fill={c} /><ellipse cx={-14} cy={-160} rx={24} ry={32} fill="rgba(255,255,255,.25)" />
</g>;
export const House2: React.FC<{x: number; y: number; s?: number; roof?: 'a' | 'b'; glow?: number}> = ({x, y, s = 1, roof = 'a', glow = 0}) => <g transform={`translate(${x} ${y}) scale(${s})`}>
  <ShadowE x={0} y={0} w={320} />
  <rect x={-120} y={-170} width={240} height={170} rx={18} fill="url(#g-house)" />
  <path d="M-150 -160Q-150 -175 -136 -184L-10 -262Q0 -268 10 -262L136 -184Q150 -175 150 -160Z" fill={`url(#g-roof${roof === 'b' ? '2' : ''})`} />
  <rect x={-26} y={-92} width={52} height={92} rx={14} fill="#3B3F6B" />
  <rect x={-96} y={-138} width={50} height={44} rx={10} fill="url(#g-glass)" /><rect x={46} y={-138} width={50} height={44} rx={10} fill="url(#g-glass)" />
  {glow > 0 && <circle cy={-120} r={190} fill="rgba(255,198,107,.35)" opacity={glow} style={{mixBlendMode: 'screen'}} />}
</g>;
export const Van2: React.FC<{x: number; y: number; s?: number; label?: string; wheel?: number; tint?: string}> = ({x, y, s = 1, label = 'YOUR CO.', wheel = 0, tint = M.indigo}) => <g transform={`translate(${x} ${y}) scale(${s})`}>
  <ShadowE x={0} y={0} w={380} />
  <path d="M-170 -40V-130Q-170 -150 -150 -150H80Q96 -150 108 -138L170 -80Q180 -70 180 -56V-40Z" fill="#FFFFFF" />
  <path d="M92 -134L150 -78H92Z" fill="url(#g-glass)" />
  <rect x={-150} y={-122} width={210} height={46} rx={12} fill={tint} /><text x={-45} y={-91} textAnchor="middle" fontSize={24} fontWeight={800} fill="#fff" fontFamily="Arial" letterSpacing={1}>{label}</text>
  {[-110, 120].map(cx => <g key={cx} transform={`translate(${cx} -36) rotate(${wheel})`}><circle r={28} fill="#2A2D4A" /><circle r={11} fill="#D5D9F2" /><rect x={-2} y={-24} width={4} height={12} fill="#8C92B5" /></g>)}
</g>;

export type Pose2 = {armL?: number; armR?: number; walk?: number; look?: number; phone?: boolean; bob?: number; mood?: 'happy' | 'neutral' | 'worried'};
export const SKIN = ['#F6CFB2', '#EBB792', '#D19A74', '#B07650', '#8A5638', '#5E3A26'];
export type Ap = {skin?: number; hair?: 'short' | 'long' | 'bun' | 'curly' | 'buzz' | 'cap' | 'hardhat' | 'bald' | 'ponytail'; hairC?: string; shirt?: string; pants?: string; beard?: boolean; glasses?: boolean; w?: number};
/* A varied cast. "you" (the contractor) stays the same in every scene; everyone else varies. */
export const CAST: Record<string, Ap> = {
  you: {skin: 1, hair: 'hardhat', shirt: '#4F55E8', pants: '#2A2D4A'},
  maya: {skin: 4, hair: 'long', hairC: '#1B1412', shirt: '#22C3A6', pants: '#3B3F6B'},
  walt: {skin: 0, hair: 'short', hairC: '#C9CCD6', shirt: '#E8A33D', pants: '#5B5F7A', glasses: true, beard: true, w: 1.12},
  ana: {skin: 2, hair: 'bun', hairC: '#3A2418', shirt: '#FF8A6B', pants: '#2E3150', w: .92},
  deshawn: {skin: 5, hair: 'buzz', hairC: '#120C0A', shirt: '#8B5CF6', pants: '#2A2D4A', beard: true},
  kenji: {skin: 1, hair: 'cap', hairC: '#E5484D', shirt: '#38BDF8', pants: '#334155'},
  rosa: {skin: 3, hair: 'curly', hairC: '#2B1A12', shirt: '#F472B6', pants: '#3B3F6B', glasses: true},
  liam: {skin: 0, hair: 'ponytail', hairC: '#C2833B', shirt: '#84CC16', pants: '#3F3F46', w: .95},
  crew: {skin: 3, hair: 'hardhat', shirt: '#F97316', pants: '#334155', beard: true},
};
const shade = (hex: string, k: number) => { const n = parseInt(hex.slice(1), 16); const f = (c: number) => Math.max(0, Math.min(255, Math.round(c * k))); return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`; };
const Hair: React.FC<{ap: Ap}> = ({ap}) => {
  const c = ap.hairC ?? '#2E2A4F';
  switch (ap.hair) {
    case 'hardhat': return <g><path d="M-46 -262Q-44 -306 0 -306Q44 -306 46 -262Z" fill={M.sun} /><rect x={-52} y={-266} width={104} height={9} rx={4} fill="#E5A93C" /></g>;
    case 'cap': return <g><path d="M-44 -262Q-42 -300 0 -300Q42 -300 44 -262Z" fill={c} /><path d="M10 -268H70Q74 -262 66 -258H10Z" fill={shade(c, .8)} /></g>;
    case 'long': return <path d="M-46 -250Q-50 -306 0 -304Q50 -306 46 -250L50 -186Q40 -176 30 -190L30 -262Q0 -280 -30 -262L-30 -190Q-40 -176 -50 -186Z" fill={c} />;
    case 'bun': return <g><circle cy={-306} r={20} fill={c} /><path d="M-44 -258Q-46 -302 0 -300Q46 -302 44 -258Q28 -282 0 -278Q-28 -282 -44 -258Z" fill={c} /></g>;
    case 'ponytail': return <g><path d="M30 -280Q72 -270 62 -210Q52 -230 34 -250Z" fill={c} /><path d="M-44 -258Q-46 -302 0 -300Q46 -302 44 -258Q28 -282 0 -278Q-28 -282 -44 -258Z" fill={c} /></g>;
    case 'curly': return <g>{[[-36, -276], [-20, -296], [0, -302], [20, -296], [36, -276], [-44, -254], [44, -254]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={17} fill={c} />)}</g>;
    case 'buzz': return <path d="M-42 -262Q-40 -298 0 -298Q40 -298 42 -262Q22 -280 0 -280Q-22 -280 -42 -262Z" fill={c} opacity={.9} />;
    case 'bald': return null;
    default: return <path d="M-42 -262Q-34 -300 4 -300Q42 -296 42 -262Q20 -284 -42 -262Z" fill={c} />;
  }
};
/* Modern geometric character: pill body with gradient, round head, minimal face. Feet at (x,y). */
export const Person2: React.FC<{x: number; y: number; s?: number; kind: 'pro' | 'home' | 'neighbor'; flip?: boolean; pose?: Pose2; dim?: number; ap?: Ap}> = ({x, y, s = 1, kind, flip, pose = {}, dim = 0, ap}) => {
  const body = ap?.shirt ?? `url(#g-${kind})`, skin = ap?.skin !== undefined ? SKIN[ap.skin] : kind === 'neighbor' ? 'url(#g-skin2)' : 'url(#g-skin)';
  const pants = ap?.pants ?? '#2A2D4A', bw = ap?.w ?? 1;
  const armC = (front: boolean) => ap?.shirt ? shade(ap.shirt, front ? 1 : .82) : (kind === 'pro' ? M.pro : kind === 'home' ? M.home : M.neighbor)[front ? 0 : 1];
  const sw = pose.walk !== undefined ? Math.sin(pose.walk) * 26 : 0;
  const bob = (pose.walk !== undefined ? -Math.abs(Math.cos(pose.walk)) * 6 : 0) + (pose.bob ?? 0);
  const aL = pose.armL ?? (pose.walk !== undefined ? -sw : 8), aR = pose.armR ?? (pose.walk !== undefined ? sw : -8);
  const limb = (x0: number, y0: number, a: number, len: number, w: number, c: string) => {
    const r = a * Math.PI / 180; return <path d={`M${x0} ${y0}L${x0 - Math.sin(r) * len} ${y0 + Math.cos(r) * len}`} stroke={c} strokeWidth={w} strokeLinecap="round" />;
  };
  const handR = (() => { const r = aR * Math.PI / 180; return [44 - Math.sin(r) * 92, -190 + Math.cos(r) * 92]; })();
  return <g transform={`translate(${x} ${y + bob})`} opacity={1 - .55 * dim}>
    <ShadowE x={0} y={-bob} w={130 * s} />
    <g transform={`scale(${(flip ? -1 : 1) * s} ${s})`}>
      {limb(-18, -112, sw, 108, 30, pants)}{limb(18, -112, -sw, 108, 30, pants)}
      {limb(-44 * bw, -190, aL, 92, 26, armC(false))}
      <rect x={-52 * bw} y={-214} width={104 * bw} height={118} rx={46} fill={body} />
      <rect x={-34} y={-200} width={20} height={70} rx={10} fill="rgba(255,255,255,.18)" />
      <g transform={`translate(${pose.look ?? 0} 0)`}>
        <circle cy={-256} r={42} fill={skin} />
        {ap ? <Hair ap={ap} /> : kind === 'pro' ? <path d="M-46 -262Q-44 -306 0 -306Q44 -306 46 -262Z" fill={M.sun} /> : kind === 'home'
          ? <path d="M-44 -258Q-46 -304 2 -302Q46 -300 44 -256Q30 -284 0 -280Q-28 -284 -44 -258Z" fill="#2E2A4F" />
          : <path d="M-42 -262Q-34 -300 4 -300Q42 -296 42 -262Q20 -284 -42 -262Z" fill="#2B1F1A" />}
        <circle cx={-14} cy={-254} r={4.5} fill={M.ink} /><circle cx={14} cy={-254} r={4.5} fill={M.ink} />
        {pose.mood === 'happy' && <path d="M-11 -238Q0 -229 11 -238" fill="none" stroke={M.ink} strokeWidth={3.5} strokeLinecap="round" />}
        {pose.mood === 'worried' && <path d="M-9 -233Q0 -239 9 -233" fill="none" stroke={M.ink} strokeWidth={3.5} strokeLinecap="round" />}
        <circle cx={-26} cy={-240} r={7} fill="rgba(255,120,120,.25)" /><circle cx={26} cy={-240} r={7} fill="rgba(255,120,120,.25)" />
        {ap?.beard && <path d="M-34 -244Q-30 -212 0 -208Q30 -212 34 -244Q20 -228 0 -228Q-20 -228 -34 -244Z" fill={ap.hairC ?? '#2B1F1A'} opacity={.9} />}
        {ap?.glasses && <g fill="none" stroke={M.ink} strokeWidth={3}><circle cx={-15} cy={-254} r={11} /><circle cx={15} cy={-254} r={11} /><path d="M-4 -254H4" /></g>}
      </g>
      {limb(44 * bw, -190, aR, 92, 26, armC(true))}
      {pose.phone && <g transform={`translate(${handR[0]} ${handR[1]}) rotate(${-aR * .3})`}><rect x={-16} y={-30} width={32} height={54} rx={8} fill="#1E2140" /><rect x={-12} y={-25} width={24} height={40} rx={4} fill="#9FB4FF" /></g>}
    </g>
  </g>;
};

/* Frosted-glass tag in screen space */
export const Glass: React.FC<{x: number; y: number; k: number; tone?: 'glass' | 'ink' | 'indigo' | 'mint' | 'peach'; children: React.ReactNode; size?: number}> = ({x, y, k, tone = 'glass', children, size = 30}) => {
  const st = {glass: {background: 'rgba(255,255,255,.62)', color: M.ink, border: '1.5px solid rgba(255,255,255,.8)'}, ink: {background: 'rgba(30,33,64,.82)', color: '#fff', border: '1.5px solid rgba(255,255,255,.12)'},
    indigo: {background: M.indigo, color: '#fff', border: 'none'}, mint: {background: M.mint, color: '#fff', border: 'none'}, peach: {background: M.peach, color: '#fff', border: 'none'}}[tone];
  return <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) translateY(${(1 - k) * 16}px) scale(${.94 + .06 * k})`, opacity: k, padding: '14px 30px', borderRadius: 999, fontSize: size, fontWeight: 700, whiteSpace: 'nowrap', backdropFilter: 'blur(18px) saturate(160%)', boxShadow: '0 1px 2px rgba(30,33,64,.06), 0 16px 40px rgba(30,33,64,.14)', filter: k < 1 ? `blur(${(1 - k) * 6}px)` : undefined, ...st}}>{children}</div>;
};

/* A floating glass card in world space (search result / review / message). */
export const Card2: React.FC<{x: number; y: number; w: number; h: number; children?: React.ReactNode; k?: number; tilt?: number}> = ({x, y, w, h, children, k = 1, tilt = 0}) =>
  <g transform={`translate(${x} ${y + (1 - k) * 30}) rotate(${tilt})`} opacity={k}>
    <rect x={-w / 2 + 6} y={14} width={w - 12} height={h} rx={28} fill="rgba(30,33,64,.10)" filter="url(#blur6)" />
    <rect x={-w / 2} y={0} width={w} height={h} rx={28} fill="#fff" />
    {children}
  </g>;
export const Stars2: React.FC<{x: number; y: number; n?: number; s?: number; filled?: number}> = ({x, y, n = 5, s = 1, filled = 5}) =>
  <g transform={`translate(${x} ${y}) scale(${s})`}>{Array.from({length: n}, (_, i) => <path key={i} transform={`translate(${i * 34} 0)`} d="M0 -14L4 -5L14 -4L6 3L9 13L0 7L-9 13L-6 3L-14 -4L-4 -5Z" fill={i < filled ? M.sun : '#E3E5F2'} />)}</g>;

/* Skies by time of day, and scene backdrops (far/mid parallax layers) so scenes don't all look alike. */
export const SKY: Record<string, [string, string]> = {
  morning: ['#DDEBFF', '#FFF4E6'], midday: ['#CFE6FF', '#F1F7FF'], golden: ['#FFD9B0', '#FFF1DE'], dusk: ['#8C83D9', '#FFB7A1'], night: ['#1B2047', '#3B3F7A'], pastel: [M.skyTop, M.skyBot],
};
const Skyline: React.FC<{y: number; c: string; win?: string; seed?: number; tall?: number}> = ({y, c, win, seed = 0, tall = 1}) => <g>
  {Array.from({length: 26}, (_, i) => { const w = 90 + ((i * 37 + seed * 13) % 70), h = (120 + ((i * 53 + seed * 29) % 220)) * tall, x = -1400 + i * 190; return <g key={i}>
    <rect x={x} y={y - h} width={w} height={h + 400} fill={c} />{(i * 7 + seed) % 5 === 0 && <rect x={x + w / 2 - 3} y={y - h - 40} width={6} height={40} fill={c} />}
    {win && Array.from({length: Math.floor(h / 40)}, (_, r) => [0, 1].map(col => (r + col + i) % 3 === 0 ? <rect key={`${r}-${col}`} x={x + 16 + col * (w - 44)} y={y - h + 18 + r * 40} width={12} height={16} rx={2} fill={win} /> : null))}</g>; })}
</g>;
const Crane: React.FC<{x: number; y: number; c: string}> = ({x, y, c}) => <g transform={`translate(${x} ${y})`} fill={c}><rect x={-10} y={-460} width={20} height={460} /><rect x={-60} y={-470} width={420} height={14} /><rect x={-120} y={-470} width={60} height={40} /><rect x={250} y={-456} width={4} height={150} /><rect x={238} y={-306} width={28} height={20} /></g>;
export const backdrop2 = (kind: 'suburb' | 'city' | 'site' | 'water' | 'night' | 'park', seed = 0): Layer[] => {
  switch (kind) {
    case 'city': return [{depth: .2, children: <Skyline y={620} c="#C9D2F0" seed={seed} tall={1.3} />}, {depth: .5, children: <Skyline y={700} c="#B4BFE8" seed={seed + 3} />}];
    case 'night': return [{depth: .1, children: <>{Array.from({length: 40}, (_, i) => <circle key={i} cx={-800 + (i * 97) % 2600} cy={40 + (i * 53) % 360} r={2 + i % 3} fill="#fff" opacity={.6} />)}<circle cx={850} cy={150} r={46} fill="#F4F1E1" /></>}, {depth: .25, children: <Skyline y={640} c="#2A2F63" win="#FFD98A" seed={seed} tall={1.3} />}, {depth: .55, children: <Skyline y={710} c="#232858" win="#FFE7A8" seed={seed + 5} />}];
    case 'site': return [{depth: .25, children: <><Hills y={600} color="#D8DEF0" amp={50} seed={seed} /><Crane x={300} y={620} c="#BEC6E0" /></>}, {depth: .55, children: <><Hills y={680} color="#C9D3EA" amp={30} seed={seed + 1} />{Array.from({length: 30}, (_, i) => <rect key={i} x={-1200 + i * 120} y={640} width={6} height={60} fill="#AEB8D6" />)}<rect x={-1200} y={650} width={3600} height={5} fill="#AEB8D6" /></>}];
    case 'water': return [{depth: .2, children: <Hills y={600} color="#C7D8F2" amp={80} seed={seed} />}, {depth: .45, children: <><Hills y={680} color="#9FD3C3" amp={40} seed={seed + 2} />{Array.from({length: 16}, (_, i) => <ellipse key={i} cx={-900 + i * 200} cy={670} rx={70} ry={50} fill="#86C9AE" />)}</>}];
    case 'park': return [{depth: .25, children: <Hills y={590} color="#CFE7D6" amp={60} seed={seed} />}, {depth: .55, children: <>{Array.from({length: 18}, (_, i) => <g key={i} transform={`translate(${-1000 + i * 180} 700)`}><rect x={-5} y={-60} width={10} height={60} fill="#B49A87" /><circle cy={-90} r={46 + (i % 3) * 8} fill={i % 2 ? '#9AD7B5' : '#7FC8A0'} /></g>)}</>}];
    default: return [{depth: .25, children: <Hills y={560} color={M.far} amp={70} seed={seed} />}, {depth: .55, children: <><Hills y={650} color={M.mid} amp={50} seed={seed + 2} />{Array.from({length: 12}, (_, i) => <g key={i} transform={`translate(${-900 + i * 260} 660) scale(.35)`}><rect x={-120} y={-170} width={240} height={170} fill="#B9C2EE" /><path d="M-145 -165L0 -260L145 -165Z" fill="#A9B3E6" /></g>)}</>}];
  }
};
