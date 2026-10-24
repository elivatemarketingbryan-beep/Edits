import React from 'react';
import {clamp} from '../../motion';
import type {VisualProps} from '../../types';
import {RED, INK, PAPER, EO, EIO, k, P, T, Dot, circlePath, Scene} from './Whiteboard26';

// video30 ("built on sand or rock"), whiteboard style. Cues are OUTPUT frames (`offset` = beat start).
// Full board: drawings in y 150-1220 above the ink caption (~1382). Split board: y 60-740 above ~826.

const house = (x: number, y: number, s = 1) => `M${x - 50 * s} ${y} V${y - 60 * s} L${x} ${y - 105 * s} L${x + 50 * s} ${y - 60 * s} V${y} Z`;
const person = (x: number, y: number, s = 1) => `${circlePath(x, y, 16 * s, 16 * s)} M${x - 24 * s} ${y + 46 * s} Q${x} ${y + 12 * s} ${x + 24 * s} ${y + 46 * s}`;
const cue = (beat: VisualProps['beat'], frame: number) => frame + ((beat.visual as {props?: {offset?: number}}).props?.offset ?? 0);

const Board: React.FC<{h: number; id: string; f: number; children: React.ReactNode}> = ({h, id, f, children}) => <div style={{position: 'absolute', inset: 0, background: PAPER, overflow: 'hidden'}}>
  <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 35%, rgba(255,255,255,.9), rgba(0,0,0,.05) 100%)'}} />
  <svg viewBox={`0 0 1080 ${h}`} width={1080} height={h} style={{position: 'absolute', inset: 0}}>
    <defs><filter id={id}><feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves={2} seed={Math.floor(f / 4) % 6} /><feDisplacementMap in="SourceGraphic" scale={4} /></filter></defs>
    <g filter={`url(#${id})`}>{children}</g>
  </svg>
</div>;

/* B1: a business, a relationship and a life share one thing; the red foundation slides in under all three. */
export const WB30Base: React.FC<VisualProps> = ({beat, frame}) => {
  const f = cue(beat, frame);
  const g = 1040;
  const q = k(f, 185, 10) * (1 - k(f, 290, 10));
  return <Board h={1920} id="rough30a" f={f}>
    <g transform="translate(540 1040) scale(1.18) translate(-540 -1040)">
    <P f={f} at={-24} len={16} d={`M110 ${g} H970`} c={INK} w={5} />
    {/* business: a briefcase */}
    <P f={f} at={-18} len={18} d={`M175 ${g} V${g - 150} H365 V${g} Z M235 ${g - 150} V${g - 185} H305 V${g - 150} M175 ${g - 95} H365`} c={INK} w={6} />
    {/* relationship: two linked rings */}
    <P f={f} at={67} len={16} d={circlePath(505, g - 95, 62, 62)} c={INK} w={6} />
    <P f={f} at={73} len={16} d={circlePath(580, g - 95, 62, 62)} c={INK} w={6} />
    {/* a life: a person under a sun */}
    <P f={f} at={124} len={16} d={person(810, g - 150, 2.4)} c={INK} w={6} />
    <P f={f} at={130} len={12} d={`${circlePath(905, g - 245, 26, 26)} M905 ${g - 292} V${g - 310} M950 ${g - 245} H968 M937 ${g - 277} L950 ${g - 290}`} c={INK} w={4} />
    {/* what do they share? */}
    <g opacity={q}><text x={540} y={620} fontSize={260} fontWeight={900} fill={RED} textAnchor="middle" style={{fontFamily: 'Inter, Arial, sans-serif'}}>?</text></g>
    {/* the foundation */}
    <P f={f} at={290} len={16} d={`M120 ${g + 8} H960 V${g + 92} H120 Z`} w={8} />
    {f >= 300 && <rect x={120} y={g + 8} width={840} height={84} fill="rgba(224,36,27,.16)" opacity={k(f, 300, 8)} />}
    {[0, 1, 2, 3, 4, 5].map(i => <P key={i} f={f} at={304 + i * 2} len={6} d={`M${190 + i * 140} ${g + 30} L${150 + i * 140} ${g + 80}`} w={4} />)}
    </g>
    <P f={f} at={300} len={14} d="M540 560 V780 M505 740 L540 780 L575 740" w={7} />
  </Board>;
};

/* B2 (split): two builders, sand vs rock, the storm; then the business version: flow, slow months, bills. */
export const WB30Builders: React.FC<VisualProps> = ({beat, frame}) => {
  const f = cue(beat, frame);
  const gy = 600;
  const sink = EIO(clamp((f - 740) / 20));
  // B2b income line: high and wavy, then the drop and a flat floor
  const pts = Array.from({length: 41}, (_, i) => {
    const x = 140 + i * 20;
    const y = i < 20 ? 250 + Math.sin(i * .9) * 35 : i < 26 ? 250 + (i - 20) * 65 : 640;
    return `${i ? 'L' : 'M'}${x} ${y}`;
  }).join(' ');
  const lineAt = (i: number) => i < 20 ? 853 + i * 5 : i < 26 ? 995 + (i - 20) * 4 : 1019 + (i - 26) * 3;
  const drawn = Array.from({length: 41}, (_, i) => i).filter(i => f >= lineAt(i)).length;
  return <Board h={960} id="rough30b" f={f}>
    <Scene f={f} from={346} to={832}>
      {/* the two builders */}
      <P f={f} at={395} len={12} d={person(440, 510, 1)} c={INK} w={4} />
      <P f={f} at={402} len={12} d={person(920, 510, 1)} c={INK} w={4} />
      {/* sand: loose wavy ground with grains */}
      <P f={f} at={460} len={16} d={`M110 ${gy} Q170 ${gy - 14} 230 ${gy} T350 ${gy} T470 ${gy}`} c={INK} w={4} />
      {[140, 190, 250, 300, 360, 420, 170, 330].map((x, i) => <Dot key={i} f={f} at={464 + i} x={x} y={gy + 22 + (i % 3) * 16} r={4} c={INK} />)}
      {/* rock: a solid block */}
      <P f={f} at={530} len={16} d={`M600 ${gy} H970 L940 ${gy + 110} H630 Z M660 ${gy + 40} L700 ${gy + 70} M860 ${gy + 30} L900 ${gy + 80}`} c={INK} w={5} />
      {f >= 540 && <path d={`M600 ${gy} H970 L940 ${gy + 110} H630 Z`} fill="rgba(27,27,27,.08)" opacity={k(f, 540, 8)} />}
      {/* houses: the sand one sinks and tilts when the storm hits */}
      <g transform={`translate(0 ${sink * 34}) rotate(${-9 * sink} 180 ${gy})`}>
        <P f={f} at={471} len={16} d={house(290, gy, 1.9)} w={7} />
        {sink > .6 && <P f={f} at={752} len={8} d={`M270 ${gy - 150} L300 ${gy - 100} L280 ${gy - 60} L305 ${gy - 10}`} c={INK} w={4} />}
      </g>
      <P f={f} at={540} len={16} d={house(785, gy, 1.9)} w={7} />
      {/* both look fine from the outside */}
      <T f={f} at={605} x={290} y={300} size={70} c={INK}>{f >= 748 ? '' : '✓'}</T>
      <T f={f} at={640} x={785} y={300} size={70} c={INK}>✓</T>
      <T f={f} at={748} x={290} y={300} size={80}>✕</T>
      {/* the storm */}
      <P f={f} at={698} len={14} d="M380 150 Q380 95 440 100 Q470 50 540 70 Q610 45 640 105 Q710 100 705 155 Z" c={INK} w={5} />
      {f >= 706 && Array.from({length: 9}, (_, i) => { const x = 330 + i * 50, ph = ((f - 706) * 9 + i * 37) % 70; return <line key={i} x1={x - 6} y1={175 + ph} x2={x - 14} y2={205 + ph} stroke={INK} strokeWidth={3} strokeLinecap="round" opacity={.55 * k(f, 706, 8)} />; })}
      <P f={f} at={712} len={8} d="M520 160 L495 225 H530 L505 290" w={6} />
      <P f={f} at={764} len={14} d={circlePath(785, gy - 95, 150, 150)} w={5} />
    </Scene>

    <Scene f={f} from={832} to={1180}>
      <P f={f} at={834} len={14} d="M130 180 V660 H960" c={INK} w={5} />
      <path d={pts} fill="none" stroke={RED} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" pathLength={40} strokeDasharray="40 40" strokeDashoffset={40 - Math.max(0, drawn - 1)} />
      <T f={f} at={899} x={520} y={170} size={64}>$ $ $</T>
      {/* calls stop: a phone, crossed out */}
      <P f={f} at={1040} len={12} d="M820 230 H880 Q890 230 890 240 V340 Q890 350 880 350 H820 Q810 350 810 340 V240 Q810 230 820 230 Z" c={INK} w={5} />
      <P f={f} at={1048} len={8} d="M785 215 L915 365 M915 215 L785 365" w={7} />
      {/* expenses keep hitting the floor */}
      {[1132, 1144, 1156].map((at, i) => <g key={i}>
        <P f={f} at={at} len={8} d={`M${600 + i * 110} 420 V600 M${575 + i * 110} 570 L${600 + i * 110} 600 L${625 + i * 110} 570`} w={6} />
        <T f={f} at={at + 2} x={600 + i * 110} y={400} size={40}>−$</T>
      </g>)}
    </Scene>
  </Board>;
};
