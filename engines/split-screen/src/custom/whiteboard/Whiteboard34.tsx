import React from 'react';
import {clamp} from '../../motion';
import type {VisualProps} from '../../types';
import {RED, INK, EO, EIO, k, P, T, Dot, circlePath, Scene} from './Whiteboard26';
import {Board, cue, person, star, cross, rect, phone, house} from './wbKit';

// video34 ("my dad's business: the best contractor doesn't always win"). Output-frame cues; split board.

const check = (x: number, y: number, s = 1) => `M${x - 28 * s} ${y} L${x - 6 * s} ${y + 24 * s} L${x + 34 * s} ${y - 26 * s}`;
const heart = (x: number, y: number, s = 1) => `M${x} ${y + 34 * s} Q${x - 50 * s} ${y} ${x - 40 * s} ${y - 22 * s} Q${x - 26 * s} ${y - 46 * s} ${x} ${y - 20 * s} Q${x + 26 * s} ${y - 46 * s} ${x + 40 * s} ${y - 22 * s} Q${x + 50 * s} ${y} ${x} ${y + 34 * s} Z`;

export const WB34Dad: React.FC<VisualProps> = ({beat, frame}) => {
  const f = cue(beat, frame);
  // S3: the medal leaves the "best" contractor and swings to the one with a system
  const swing = EIO(clamp((f - 803) / 24));
  const mx = 300 + 480 * swing, my = 240 - Math.sin(swing * Math.PI) * 90;
  return <Board h={960} id="rough34" f={f}>
    {/* S1 never the problem: work, skill, reliability + integrity */}
    <Scene f={f} from={120} to={445}>
      <P f={f} at={124} len={14} d="M180 130 V700" c={INK} w={4} />
      {[190, 380, 590].map((y, i) => <P key={i} f={f} at={128 + i * 6} len={12} d={rect(700, y - 60, 120, 120, 14)} c={INK} w={5} />)}
      {/* work: a wrench */}
      <P f={f} at={186} len={12} d="M260 230 L380 150 M360 120 Q360 95 390 98 L375 120 L388 135 L410 120 Q414 150 385 158" c={INK} w={6} />
      <P f={f} at={220} len={10} d={check(760, 190, 1.4)} w={9} />
      {/* skill: a star */}
      <P f={f} at={253} len={12} d={star(320, 380, 56)} c={INK} w={6} />
      <P f={f} at={285} len={10} d={check(760, 380, 1.4)} w={9} />
      {/* reliability + integrity: a handshake-ish clasp inside a shield */}
      <P f={f} at={321} len={14} d="M320 500 L400 530 V600 Q400 660 320 690 Q240 660 240 600 V530 Z" c={INK} w={6} />
      <P f={f} at={358} len={10} d="M280 600 L310 625 L360 570" c={INK} w={6} />
      <P f={f} at={420} len={10} d={check(760, 590, 1.4)} w={9} />
      <P f={f} at={428} len={14} d="M560 120 V700" w={4} dash />
    </Scene>
    {/* S2 he cared, showed up, did it right; then: so many contractors are the same */}
    <Scene f={f} from={445} to={705}>
      <P f={f} at={452} len={12} d={heart(250, 250, 1.6)} w={7} />
      <P f={f} at={482} len={14} d={`${circlePath(540, 250, 70, 70)} M540 205 V250 L575 275`} c={INK} w={6} />
      <P f={f} at={528} len={12} d={check(830, 250, 2)} w={10} />
      {Array.from({length: 12}, (_, i) => <P key={i} f={f} at={585 + i * 5} len={8} d={person(150 + (i % 6) * 156, 470 + Math.floor(i / 6) * 160, 1.2)} c={i % 6 === 2 ? RED : INK} w={4} />)}
    </Scene>
    {/* S3 the best doesn't always win: the medal swings to the contractor with a system */}
    <Scene f={f} from={705} to={1070}>
      <P f={f} at={706} len={14} d="M120 700 H960" c={INK} w={5} />
      <P f={f} at={708} len={12} d={person(300, 470, 2.4)} c={INK} w={6} />
      <P f={f} at={712} len={10} d={star(300, 370, 34)} c={INK} w={4} />
      <P f={f} at={716} len={12} d={person(780, 470, 2.4)} c={INK} w={6} />
      {f >= 720 && <g opacity={k(f, 720, 8)} transform={`translate(${mx} ${my})`}>
        <line x1={-20} y1={-60} x2={0} y2={-14} stroke={RED} strokeWidth={5} /><line x1={20} y1={-60} x2={0} y2={-14} stroke={RED} strokeWidth={5} />
        <circle cx={0} cy={14} r={30} fill="rgba(224,36,27,.15)" stroke={RED} strokeWidth={6} />
        <text x={0} y={27} fontSize={34} fontWeight={900} fill={RED} textAnchor="middle" style={{fontFamily: 'Inter, Arial, sans-serif'}}>1</text>
      </g>}
      {/* why he wins: found, trusted, answers first, a system */}
      <P f={f} at={884} len={10} d="M880 300 Q850 260 850 240 A30 30 0 1 1 910 240 Q910 260 880 300 Z" w={5} />
      <P f={f} at={932} len={10} d="M900 380 L960 400 V440 Q960 480 900 500 Q840 480 840 440 V400 Z" w={5} />
      <P f={f} at={1000} len={10} d={phone(640, 300, .7)} w={5} />
      <P f={f} at={1006} len={8} d="M680 250 Q700 270 680 290 M695 235 Q725 270 695 305" w={4} />
      <P f={f} at={1046} len={12} d={`${circlePath(650, 450, 34, 34)} M650 400 V412 M650 488 V500 M600 450 H612 M688 450 H700 M615 415 L623 423 M677 477 L685 485 M685 415 L677 423 M623 477 L615 485`} w={5} />
      {/* the best one, still waiting */}
      <T f={f} at={830} x={300} y={300} size={60} c={INK}>?</T>
    </Scene>
  </Board>;
};
