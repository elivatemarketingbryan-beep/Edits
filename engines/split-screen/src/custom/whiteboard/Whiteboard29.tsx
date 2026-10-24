import React from 'react';
import {clamp} from '../../motion';
import type {VisualProps} from '../../types';
import {RED, INK, PAPER, EO, EIO, k, P, T, Dot, circlePath, Scene} from './Whiteboard26';

// video29 ("$500K a year"), whiteboard style. This job has cuts, so cues are OUTPUT frames: `offset` is the
// beat start. Full-frame boards (1080 x 1920) keep drawings in y 150-1220 above the ink caption at y ~1382;
// the split board (1080 x 960) keeps drawings in y 60-740 above the caption at y ~826.

const house = (x: number, y: number, s = 1) => `M${x - 50 * s} ${y} V${y - 60 * s} L${x} ${y - 105 * s} L${x + 50 * s} ${y - 60 * s} V${y} Z`;
const person = (x: number, y: number, s = 1) => `${circlePath(x, y, 16 * s, 16 * s)} M${x - 24 * s} ${y + 46 * s} Q${x} ${y + 12 * s} ${x + 24 * s} ${y + 46 * s}`;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const cue = (beat: VisualProps['beat'], frame: number) => frame + ((beat.visual as {props?: {offset?: number}}).props?.offset ?? 0);

const Board: React.FC<{h: number; id: string; f: number; children: React.ReactNode}> = ({h, id, f, children}) => <div style={{position: 'absolute', inset: 0, background: PAPER, overflow: 'hidden'}}>
  <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 35%, rgba(255,255,255,.9), rgba(0,0,0,.05) 100%)'}} />
  <svg viewBox={`0 0 1080 ${h}`} width={1080} height={h} style={{position: 'absolute', inset: 0}}>
    <defs><filter id={id}><feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves={2} seed={Math.floor(f / 4) % 6} /><feDisplacementMap in="SourceGraphic" scale={4} /></filter></defs>
    <g filter={`url(#${id})`}>{children}</g>
  </svg>
</div>;

/* B1: one year bar splits into twelve months; one month lifts out and becomes the number that matters. */
export const WB29Year: React.FC<VisualProps> = ({beat, frame}) => {
  const f = cue(beat, frame);
  const x0 = 120, w = 840, seg = w / 12, barY = 470, barH = 130;
  const lift = EIO(clamp((f - 67) / 22));
  const r = {x: lerp(x0, 340, lift), y: lerp(barY, 790, lift), w: lerp(seg, 400, lift), h: lerp(barH, 330, lift)};
  return <Board h={1920} id="rough29a" f={f}>
    <T f={f} at={-12} x={540} y={400} size={128}>$500K</T>
    <P f={f} at={-6} len={20} d={`M${x0} ${barY} H${x0 + w} V${barY + barH} H${x0} Z`} w={7} />
    {f >= 8 && <rect x={x0} y={barY} width={w} height={barH} fill="rgba(224,36,27,.10)" opacity={k(f, 8, 10) * (1 - .6 * lift)} />}
    {Array.from({length: 11}, (_, i) => <P key={i} f={f} at={35 + i * 2} len={8} d={`M${x0 + seg * (i + 1)} ${barY} V${barY + barH}`} c={INK} w={4} />)}
    {'JFMAMJJASOND'.split('').map((m, i) => <T key={i} f={f} at={44 + i} x={x0 + seg * (i + .5)} y={barY + barH + 52} size={30} c={INK}>{m}</T>)}
    <T f={f} at={52} x={540} y={barY + barH + 150} size={64} c={INK}>÷ 12</T>
    {f >= 67 && <g opacity={k(f, 67, 6)}>
      <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={6 * lift} fill="rgba(224,36,27,.12)" stroke={RED} strokeWidth={7} />
      {lift > .9 && <T f={f} at={92} x={540} y={985} size={80}>$41–42K</T>}
    </g>}
    <P f={f} at={70} len={16} d={`M${x0 + seg / 2} ${barY + barH + 70} Q 200 760 330 840`} c={INK} w={4} dash />
    <T f={f} at={146} x={540} y={1065} size={48} c={INK}>/ MO</T>
  </Board>;
};

/* B3: a crowd of tiny customers fades; a few big projects carry the month. */
export const WB29Projects: React.FC<VisualProps> = ({beat, frame}) => {
  const f = cue(beat, frame);
  const fade = 1 - .82 * EO(clamp((f - 399) / 12));
  const houses = [[250, 407, 1.5], [540, 416, 1.9], [830, 426, 1.6]] as const;
  return <Board h={1920} id="rough29b" f={f}>
    <g opacity={fade}>
      {Array.from({length: 96}, (_, i) => {
        const x = 100 + (i % 12) * 80, y = 190 + Math.floor(i / 12) * 86, t = clamp((f - 368 - (i % 12 + Math.floor(i / 12)) * .6) / 5);
        return t > 0 ? <g key={i} opacity={t}><circle cx={x} cy={y} r={12} fill="none" stroke={INK} strokeWidth={4} /><path d={`M${x - 19} ${y + 38} Q${x} ${y + 12} ${x + 19} ${y + 38}`} fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" /></g> : null;
      })}
    </g>
    <P f={f} at={398} len={16} d="M110 1100 H970" c={INK} w={5} />
    {houses.map(([x, at, s], i) => <g key={i}>
      <P f={f} at={at} len={14} d={house(x, 1100, s)} w={7} />
      {f >= at + 10 && <path d={house(x, 1100, s)} fill="rgba(224,36,27,.10)" opacity={k(f, at + 10, 8)} />}
      <T f={f} at={at + 12} x={x} y={1100 - 30 * s} size={50 * s}>$</T>
    </g>)}
    <P f={f} at={440} len={16} d="M180 1150 Q180 1180 210 1180 H510 Q540 1180 540 1210 Q540 1180 570 1180 H870 Q900 1180 900 1150" c={INK} w={5} />
    {/* one month on the calendar */}
    <P f={f} at={448} len={14} d="M480 1235 H600 V1330 H480 Z M480 1265 H600 M510 1222 V1248 M570 1222 V1248" c={INK} w={4} />
    <T f={f} at={454} x={540} y={1318} size={46}>1</T>
  </Board>;
};

const Icon: React.FC<{i: number; x: number; y: number}> = ({i, x, y}) => {
  const s = {fill: 'none', stroke: RED, strokeWidth: 5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
  if (i === 0) return <g {...s}><rect x={x - 20} y={y - 34} width={40} height={68} rx={8} /><path d={`M${x - 7} ${y + 22} H${x + 7}`} /></g>; // phone: a lead
  if (i === 1) return <g {...s}><path d={house(x, y + 32, .62)} /><path d={`M${x - 10} ${y + 32} V${y + 10} H${x + 10} V${y + 32}`} /></g>; // a job
  if (i === 2) return <g {...s}><path d={person(x - 26, y - 14, .9)} /><path d={person(x + 26, y - 14, .9)} /></g>; // customers
  return <g {...s}><circle cx={x} cy={y} r={32} /><path d={`M${x} ${y - 18} V${y} L${x + 14} ${y + 10}`} /></g>; // hours
};

/* B4 (split): growth is not just "more"; four blocks stack on nothing, then wobble and crack. */
export const WB29Tower: React.FC<VisualProps> = ({beat, frame}) => {
  const f = cue(beat, frame);
  const ground = 650, bh = 104, bw = 250;
  const drops = [584, 609, 636, 662];
  const wobble = f < 780 ? 0 : Math.sin((f - 780) / 3.2) * 2.6 * clamp((f - 780) / 10);
  const lean = 8 * EO(clamp((f - 806) / 18));
  return <Board h={960} id="rough29c" f={f}>
    {/* misunderstood growth: an arrow with a question beside it */}
    <Scene f={f} from={492} to={582}>
      <P f={f} at={494} len={22} d="M540 690 V190 M490 250 L540 190 L590 250" w={9} />
      <T f={f} at={528} x={720} y={420} size={190}>?</T>
      <P f={f} at={540} len={14} d={circlePath(720, 360, 90, 110)} c={INK} w={4} />
    </Scene>
    <Scene f={f} from={580} to={840}>
      <P f={f} at={580} len={14} d="M140 650 H940" c={INK} w={5} />
      <g transform={`rotate(${wobble + lean} ${540 + bw / 2} ${ground})`}>
        {drops.map((at, i) => {
          const t = EO(clamp((f - at) / 10));
          if (t <= 0) return null;
          const y = ground - bh * (i + 1) - (1 - t) * 260;
          const cracked = f >= 818 + i * 2;
          return <g key={i} opacity={t}>
            <rect x={540 - bw / 2} y={y} width={bw} height={bh} rx={6} fill={PAPER} stroke={INK} strokeWidth={5} />
            <Icon i={i} x={540} y={y + bh / 2} />
            {cracked && <P f={f} at={818 + i * 2} len={8} d={`M${540 - bw / 2 + 30 + i * 40} ${y} L${540 - 20 + i * 10} ${y + bh * .45} L${540 + 10 - i * 8} ${y + bh * .6} L${540 + 40} ${y + bh}`} c={INK} w={4} />}
          </g>;
        })}
      </g>
      {/* the missing foundation */}
      {f >= 716 && <path d={`M${540 - 170} ${ground + 8} H${540 + 170} V${ground + 78} H${540 - 170} Z`} fill="none" stroke={RED} strokeWidth={5} strokeDasharray="18 14" opacity={k(f, 716, 10)} />}
      <T f={f} at={726} x={760} y={ground + 62} size={40} anchor="start">NO BASE</T>
      <P f={f} at={732} len={10} d={`M750 ${ground + 48} H${540 + 182}`} w={4} />
      <Dot f={f} at={736} x={540 + 182} y={ground + 48} r={8} />
    </Scene>
  </Board>;
};
