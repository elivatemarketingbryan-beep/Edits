import React from 'react';
import {clamp} from '../../motion';
import type {VisualProps} from '../../types';
import {RED, INK, PAPER, EO, EIO, k, P, T, Dot, circlePath, Scene} from './Whiteboard26';
import {Board, cue, person, star, cross, rect, house} from './wbKit';

// video36 ("each service page is a fishing line"). Output-frame cues. Drawn in split-board coordinates;
// on the full board the same drawing shifts down 300 px so it sits above the caption.

const lines = [[590, 854, 'roof'], [690, 860, 'kitchen'], [790, 866, 'concrete'], [890, 872, 'paint']] as const;
const job = (kind: string, x: number, y: number) => kind === 'roof' ? house(x, y + 30, .7)
  : kind === 'kitchen' ? `M${x - 34} ${y - 4} H${x + 34} V${y + 22} Q${x + 34} ${y + 36} ${x + 20} ${y + 36} H${x - 20} Q${x - 34} ${y + 36} ${x - 34} ${y + 22} Z M${x - 46} ${y} H${x - 34} M${x + 34} ${y} H${x + 46} M${x - 10} ${y - 18} Q${x - 16} ${y - 30} ${x - 8} ${y - 40}`
  : kind === 'concrete' ? `${rect(x - 40, y - 4, 38, 22)} ${rect(x + 2, y - 4, 38, 22)} ${rect(x - 20, y - 28, 38, 22)}`
  : `${rect(x - 34, y - 30, 56, 26, 6)} M${x + 22} ${y - 17} H${x + 34} V${y} H${x - 6} V${y + 30}`;

export const WB36Fish: React.FC<VisualProps> = ({beat, frame, height}) => {
  const f = cue(beat, frame);
  const dy = height > 1000 ? 300 : 0;
  const zoom = EIO(clamp((f - 313) / 40));
  const mx = 420 + 220 * zoom, my = 260 + 140 * Math.sin(zoom * Math.PI * 2);
  return <Board h={height} id="rough36" f={f}>
    <g transform={`translate(0 ${dy})`}>
      {/* S1 one generic page trying to cover everything */}
      <Scene f={f} from={110} to={450}>
        <P f={f} at={112} len={16} d={rect(330, 110, 360, 520, 10)} c={INK} w={6} />
        <P f={f} at={120} len={10} d="M370 160 H600 M370 195 H520" c={INK} w={4} />
        {['roof', 'kitchen', 'concrete', 'paint'].map((kind, i) => <P key={kind} f={f} at={146 + i * 22} len={10} d={job(kind, 420 + (i % 2) * 150 + (i > 1 ? 25 : 0), 300 + Math.floor(i / 2) * 120 + (i % 2) * 18)} c={INK} w={5} />)}
        <P f={f} at={236} len={10} d="M370 560 H650 M370 590 H600" c={INK} w={4} />
        {/* Google squints at it */}
        {f >= 313 && <g opacity={k(f, 313, 6)}>
          <circle cx={mx} cy={my} r={70} fill="rgba(224,36,27,.06)" stroke={RED} strokeWidth={7} />
          <line x1={mx + 50} y1={my + 50} x2={mx + 110} y2={my + 110} stroke={RED} strokeWidth={13} strokeLinecap="round" />
        </g>}
        <T f={f} at={354} x={850} y={330} size={180}>?</T>
      </Scene>
      {/* S2 fishing: one page is one line in the water; many pages, many lines */}
      <Scene f={f} from={450} to={1100}>
        <P f={f} at={452} len={20} d="M40 430 Q100 415 160 430 T280 430 T400 430 T520 430 T640 430 T760 430 T880 430 T1000 430 T1060 430" c={INK} w={4} />
        <P f={f} at={456} len={12} d="M30 400 H300 M70 400 V470 M260 400 V470" c={INK} w={6} />
        <P f={f} at={460} len={12} d={person(235, 300, 1.6)} c={INK} w={5} />
        {/* the one line */}
        <P f={f} at={518} len={10} d="M262 360 L470 150" c={INK} w={5} />
        <P f={f} at={526} len={14} d="M470 150 Q500 300 510 560 M510 560 Q510 590 490 585" w={4} />
        <Dot f={f} at={664} x={505} y={432} r={12} />
        {/* the one page on the dock */}
        <P f={f} at={591} len={10} d={rect(40, 318, 46, 66, 4)} c={INK} w={4} />
        {/* more pages, more lines */}
        {[0, 1, 2].map(i => <P key={i} f={f} at={735 + i * 10} len={8} d={rect(68 + i * 30, 318 - (i + 1) * 6, 46, 66, 4)} c={INK} w={4} />)}
        {lines.map(([x, at], i) => <g key={i}>
          <P f={f} at={at} len={10} d={`M266 355 L${x - 20} ${150 - i * 14}`} c={INK} w={4} />
          <P f={f} at={at + 6} len={12} d={`M${x - 20} ${150 - i * 14} Q${x} 300 ${x} ${590 + (i % 2) * 70} M${x} ${590 + (i % 2) * 70} Q${x} ${620 + (i % 2) * 70} ${x - 20} ${614 + (i % 2) * 70}`} w={4} />
        </g>)}
        {/* each catches a homeowner already searching for that exact job */}
        {lines.map(([x, , kind], i) => {
          const at = 966 + i * 18, t = EO(clamp((f - at) / 18)), yy = 650 + (i % 2) * 70;
          return t > 0 ? <g key={kind} opacity={t} transform={`translate(${(1 - t) * 120} 0)`}>
            <path d={job(kind, x + 40, yy)} fill="none" stroke={RED} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
          </g> : null;
        })}
        <P f={f} at={1064} len={12} d={circlePath(820, 690, 80, 70)} w={6} />
      </Scene>
    </g>
  </Board>;
};
