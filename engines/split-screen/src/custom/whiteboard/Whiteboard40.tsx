import React from 'react';
import {clamp} from '../../motion';
import type {VisualProps} from '../../types';
import {RED, INK, PAPER, EO, EIO, k, P, T, Dot, circlePath, Scene} from './Whiteboard26';
import {Board, cue, person, star, cross, rect, phone} from './wbKit';

// video40 ("two contractors, one $20K project: who feels safer?"). Output-frame cues; split board.

const bubble = (x: number, y: number, w = 120, h = 60) => `${rect(x - w / 2, y - h / 2, w, h, 18)} M${x - w / 2 + 20} ${y + h / 2} L${x - w / 2 + 10} ${y + h / 2 + 22} L${x - w / 2 + 40} ${y + h / 2}`;
const shield = (x: number, y: number, s = 1) => `M${x} ${y - 60 * s} L${x + 52 * s} ${y - 40 * s} V${y + 4 * s} Q${x + 52 * s} ${y + 46 * s} ${x} ${y + 66 * s} Q${x - 52 * s} ${y + 46 * s} ${x - 52 * s} ${y + 4 * s} V${y - 40 * s} Z`;

export const WB40Safer: React.FC<VisualProps> = ({beat, frame}) => {
  const f = cue(beat, frame);
  const clock = f >= 176 ? Math.min(1, (f - 176) / 60) : 0;
  return <Board h={960} id="rough40" f={f}>
    <Scene f={f} from={100} to={800}>
      {/* the homeowner and the $20K job, at the right */}
      <P f={f} at={102} len={12} d={person(930, 400, 1.8)} c={INK} w={5} />
      <T f={f} at={110} x={930} y={560} size={44}>$20K</T>
      {/* lane A: the slow contractor */}
      <P f={f} at={125} len={10} d={person(110, 220, 1.4)} c={INK} w={5} />
      <P f={f} at={130} len={12} d="M180 250 H780" c={INK} w={3} dash />
      {f >= 130 && <path d="M180 250 H780" stroke={INK} strokeWidth={3} strokeDasharray="10 12" opacity={.5 * k(f, 130, 8)} />}
      <P f={f} at={176} len={10} d={circlePath(330, 220, 40, 40)} c={INK} w={5} />
      <line x1={330} y1={220} x2={330 + 28 * Math.sin(clock * Math.PI * 6)} y2={220 - 28 * Math.cos(clock * Math.PI * 6)} stroke={INK} strokeWidth={4} strokeLinecap="round" opacity={k(f, 176, 6)} />
      {/* next day: a moon, then the late reply */}
      <P f={f} at={205} len={10} d="M520 190 A40 40 0 1 0 560 250 A30 30 0 1 1 520 190 Z" c={INK} w={4} />
      <P f={f} at={236} len={10} d={bubble(690, 210, 110, 50)} c={INK} w={4} />
      {/* lane B: the fast one */}
      <P f={f} at={262} len={10} d={person(110, 480, 1.4)} w={6} />
      <P f={f} at={268} len={12} d="M180 510 H780" w={4} />
      <P f={f} at={300} len={8} d={bubble(260, 460, 90, 46)} w={4} />
      <T f={f} at={331} x={380} y={478} size={40}>?✓</T>
      <P f={f} at={373} len={10} d={`${rect(450, 435, 80, 60, 6)} M455 485 L480 460 L500 475 L525 450`} w={4} />
      <P f={f} at={405} len={10} d={`${rect(560, 435, 80, 60, 6)} M590 450 L615 465 L590 480 Z`} w={4} />
      <P f={f} at={436} len={12} d="M670 470 H700 M690 455 L705 470 L690 485 M715 470 H745 M735 455 L750 470 L735 485" w={4} />
      <P f={f} at={530} len={10} d="M770 480 L790 500 L830 455" w={7} />
      {/* who feels safer? the shield goes to the fast lane */}
      <T f={f} at={570} x={930} y={300} size={70}>?</T>
      <P f={f} at={626} len={12} d={shield(110, 480, 1.3)} w={6} />
      {/* not the cheapest */}
      <T f={f} at={719} x={110} y={330} size={40} c={INK}>$</T>
      <T f={f} at={724} x={110} y={640} size={40}>$$</T>
    </Scene>
    {/* the homeowner isn't only buying labor, they're buying confidence */}
    <Scene f={f} from={800} to={905}>
      <P f={f} at={802} len={14} d="M200 300 H880 L820 600 H260 Z M300 300 Q300 200 540 200 Q780 200 780 300" c={INK} w={6} />
      <P f={f} at={823} len={10} d="M360 440 L460 340 M440 320 L480 360 L460 380 L420 340 Z" c={INK} w={6} />
      <P f={f} at={861} len={12} d={shield(640, 440, 1.2)} w={7} />
      <P f={f} at={868} len={8} d="M610 445 L632 470 L675 420" w={7} />
    </Scene>
  </Board>;
};
