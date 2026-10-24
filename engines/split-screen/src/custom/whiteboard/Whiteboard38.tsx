import React from 'react';
import {clamp} from '../../motion';
import type {VisualProps} from '../../types';
import {RED, INK, PAPER, EO, EIO, k, P, T, Dot, circlePath, Scene} from './Whiteboard26';
import {Board, cue, person, star, cross, rect} from './wbKit';

// video38 ("ads are fuel, not the engine"). Output-frame cues.

const gear = (x: number, y: number, r = 50) => `${circlePath(x, y, r * .62, r * .62)} ${Array.from({length: 8}, (_, i) => { const a = i * Math.PI / 4; return `M${(x + Math.cos(a) * r * .7).toFixed(1)} ${(y + Math.sin(a) * r * .7).toFixed(1)} L${(x + Math.cos(a) * r).toFixed(1)} ${(y + Math.sin(a) * r).toFixed(1)}`; }).join(' ')}`;

/* B2 (split): a fuel can, an engine that has to be built right; money buys attention; opportunities pour into a broken box. */
export const WB38Fuel: React.FC<VisualProps> = ({beat, frame}) => {
  const f = cue(beat, frame);
  const spin = f >= 268 ? (f - 268) * 4 : 0;
  return <Board h={960} id="rough38a" f={f}>
    <Scene f={f} from={150} to={380}>
      {/* fuel can */}
      <P f={f} at={152} len={14} d="M140 640 V360 L200 300 H380 V640 Z M240 300 V260 H300 V300 M200 300 L380 470" w={7} />
      <P f={f} at={166} len={10} d="M260 560 Q260 500 290 460 Q320 500 320 560 Q320 590 290 590 Q260 590 260 560 Z" w={6} />
      {/* pour arrow into the engine */}
      <P f={f} at={197} len={12} d="M420 450 H560 M520 410 L560 450 L520 490" c={INK} w={6} />
      {/* the engine block */}
      <P f={f} at={250} len={16} d={`${rect(600, 300, 360, 300, 14)} M640 300 V250 H720 V300 M840 300 V250 H920 V300`} c={INK} w={6} />
      <g transform={`rotate(${spin} 720 450)`}><P f={f} at={262} len={12} d={gear(720, 450, 70)} c={INK} w={6} /></g>
      <g transform={`rotate(${-spin} 860 480)`}><P f={f} at={266} len={12} d={gear(860, 480, 50)} c={INK} w={5} /></g>
      <P f={f} at={272} len={10} d="M880 220 L905 245 L955 190" w={9} />
    </Scene>
    <Scene f={f} from={380} to={585}>
      {/* money buys attention (eyes), but behind it the box is broken */}
      {[0, 1, 2].map(i => <T key={i} f={f} at={382 + i * 4} x={170 + i * 90} y={260} size={70}>$</T>)}
      {[0, 1, 2].map(i => <g key={`e${i}`} opacity={k(f, 384 + i * 4, 8)}><ellipse cx={620 + i * 110} cy={240} rx={40} ry={24} fill="none" stroke={INK} strokeWidth={5} /><circle cx={620 + i * 110} cy={240} r={9} fill={INK} /></g>)}
      <P f={f} at={397} len={14} d="M140 400 H940" c={INK} w={4} dash />
      {/* opportunities pour into a broken process */}
      <P f={f} at={470} len={14} d="M380 560 L420 720 H660 L700 560 Z" c={INK} w={6} />
      <P f={f} at={556} len={10} d="M520 560 L500 620 L540 650 L515 720" w={6} />
      {Array.from({length: 7}, (_, i) => {
        const t = clamp((f - 486 - i * 8) / 30), leak = f >= 560 && i % 2 === 0;
        const x = 540 + (i % 3 - 1) * 40 + (leak ? (t - .6) * 260 * (i % 4 ? 1 : -1) : 0), y = 420 + t * (leak ? 360 : 200);
        return t > 0 && t < 1 ? <circle key={i} cx={x} cy={y} r={14} fill={RED} opacity={1 - Math.max(0, t - .8) * 5} /> : null;
      })}
    </Scene>
  </Board>;
};

/* B3 (full): most contractors lose money with advertising: cash leaks out of the bottom of a bucket. */
export const WB38Leak: React.FC<VisualProps> = ({beat, frame}) => {
  const f = cue(beat, frame);
  return <Board h={1920} id="rough38b" f={f}>
    <P f={f} at={578} len={16} d="M300 420 H780 L700 1040 H380 Z" c={INK} w={7} />
    <P f={f} at={584} len={10} d="M300 420 Q540 470 780 420" c={INK} w={5} />
    {[0, 1, 2].map(i => <P key={i} f={f} at={610 + i * 6} len={10} d={`M${470 + i * 70} 1040 L${455 + i * 70} 1090 L${485 + i * 70} 1120`} w={5} />)}
    {Array.from({length: 9}, (_, i) => {
      const t = ((f - 620 - i * 7) / 40);
      if (t <= 0) return null;
      const tt = t % 1, x = 470 + (i % 3) * 70 + Math.sin(i) * 20, y = 1060 + tt * 200;
      return <text key={i} x={x} y={y} fontSize={54} fontWeight={900} fill={RED} textAnchor="middle" opacity={1 - tt} style={{fontFamily: 'Inter, Arial, sans-serif'}}>$</text>;
    })}
    <T f={f} at={586} x={540} y={700} size={130}>$$$</T>
    <P f={f} at={644} len={12} d="M840 520 V880 M800 840 L840 880 L880 840" w={7} />
  </Board>;
};

/* B5 (full): not more leads, more qualified opportunities: a crowd goes in, a few stars come out. */
export const WB38Qualified: React.FC<VisualProps> = ({beat, frame}) => {
  const f = cue(beat, frame);
  return <Board h={1920} id="rough38c" f={f}>
    {Array.from({length: 24}, (_, i) => <g key={i} opacity={k(f, 842 + (i % 8) * 1.5, 6) * (1 - .7 * k(f, 920, 14))}>
      <circle cx={180 + (i % 8) * 103} cy={260 + Math.floor(i / 8) * 80} r={20} fill="none" stroke={INK} strokeWidth={4} />
    </g>)}
    <P f={f} at={850} len={18} d="M140 500 H940 L640 820 V1000 H440 V820 Z" c={INK} w={7} />
    <P f={f} at={878} len={10} d="M380 600 H700" w={6} dash />
    {[0, 1, 2].map(i => {
      const t = EO(clamp((f - 924 - i * 10) / 18));
      return t > 0 ? <path key={i} d={star(440 + i * 100, 1060 + t * 120, 42)} fill="rgba(224,36,27,.14)" stroke={RED} strokeWidth={6} strokeLinejoin="round" opacity={t} /> : null;
    })}
  </Board>;
};
