import React from 'react';
import {clamp} from '../../motion';
import type {VisualProps} from '../../types';
import {RED, INK, PAPER, EO, EIO, k, P, T, Dot, circlePath, Scene} from './Whiteboard26';
import {Board, cue, house, person, star, cross, rect, browser} from './wbKit';

// video31 ("the best restaurant in town with no sign"). Output-frame cues.

/* B1: a great restaurant, happy people talking, then: no sign, no website, no reviews. */
export const WB31Restaurant: React.FC<VisualProps> = ({beat, frame}) => {
  const f = cue(beat, frame);
  return <Board h={1920} id="rough31a" f={f}>
    {/* storefront */}
    <P f={f} at={-14} len={18} d="M260 1000 V520 H820 V1000 M180 1000 H900" c={INK} w={6} />
    <P f={f} at={21} len={16} d="M240 520 L280 440 H800 L840 520 M300 520 Q330 560 360 520 Q390 560 420 520 Q450 560 480 520 Q510 560 540 520 Q570 560 600 520 Q630 560 660 520 Q690 560 720 520 Q750 560 780 520" w={6} />
    <P f={f} at={30} len={14} d="M330 1000 V760 H470 V1000 M445 880 V895" c={INK} w={5} />
    <P f={f} at={36} len={14} d={rect(560, 640, 200, 180, 8)} c={INK} w={5} />
    {/* incredible food: a plate with steam in the window */}
    <P f={f} at={72} len={12} d="M590 780 Q660 820 730 780 M585 780 H735" w={6} />
    <P f={f} at={83} len={10} d="M630 760 Q620 735 635 715 Q648 695 636 675 M690 760 Q680 735 695 715 Q708 695 696 675" w={4} />
    {/* happy customers outside */}
    {[[140, 113], [940, 120]].map(([x, at], i) => <g key={i}>
      <P f={f} at={at} len={10} d={person(x, 880, 1.4)} c={INK} w={5} />
    </g>)}
    <P f={f} at={141} len={8} d="M128 870 Q140 880 152 870 M928 870 Q940 880 952 870" c={INK} w={3} />
    {/* telling everyone */}
    <P f={f} at={198} len={10} d="M70 700 Q70 640 140 640 Q210 640 210 700 Q210 750 140 750 L110 790 L118 750 Q70 745 70 700 Z" c={INK} w={4} />
    <P f={f} at={204} len={10} d="M870 700 Q870 640 940 640 Q1010 640 1010 700 Q1010 750 940 750 L970 790 L962 750 Q870 745 870 700 Z" c={INK} w={4} />
    <P f={f} at={208} len={8} d={star(140, 697, 26)} w={4} />
    <P f={f} at={212} len={8} d={star(940, 697, 26)} w={4} />
    {/* no sign */}
    <P f={f} at={280} len={14} d={rect(360, 270, 360, 120, 10)} c={INK} w={5} dash />
    {f >= 280 && <path d={rect(360, 270, 360, 120, 10)} fill="none" stroke={INK} strokeWidth={5} strokeDasharray="18 14" opacity={k(f, 280, 8)} />}
    <P f={f} at={289} len={10} d={cross(540, 330, 46)} w={9} />
    {/* no website, no reviews */}
    <P f={f} at={322} len={12} d={browser(300, 1170, 240, 160)} c={INK} w={5} />
    <P f={f} at={332} len={8} d={cross(300, 1180, 50)} w={8} />
    {[0, 1, 2, 3, 4].map(i => <P key={i} f={f} at={364 + i * 2} len={8} d={star(690 + i * 70, 1170, 28)} c={INK} w={4} />)}
    <P f={f} at={372} len={8} d="M660 1120 L1000 1220 M1000 1120 L660 1220" w={8} />
  </Board>;
};

/* B3: a whole town map; pins drop everywhere except where the restaurant actually is. */
export const WB31Hidden: React.FC<VisualProps> = ({beat, frame}) => {
  const f = cue(beat, frame);
  const t = EIO(clamp((f - 571) / 48));
  const mx = 280 + 560 * t, my = 520 + 280 * Math.sin(t * Math.PI * 1.5);
  return <Board h={1920} id="rough31b" f={f}>
    <P f={f} at={516} len={16} d="M120 300 H960 M120 520 H960 M120 740 H960 M120 960 H960 M120 1180 H960 M120 300 V1180 M330 300 V1180 M540 300 V1180 M750 300 V1180 M960 300 V1180" c={INK} w={4} />
    {/* the restaurant, tucked into a block, faint */}
    <g opacity={.35 * k(f, 520, 10)}><path d={house(860, 1120, .9)} fill="none" stroke={INK} strokeWidth={5} /></g>
    {[[225, 420, 532], [645, 630, 545], [435, 860, 558], [855, 420, 566]].map(([x, y, at], i) => <g key={i}>
      <P f={f} at={at} len={8} d={`M${x} ${y} Q${x - 30} ${y - 40} ${x - 30} ${y - 60} A30 30 0 1 1 ${x + 30} ${y - 60} Q${x + 30} ${y - 40} ${x} ${y} Z`} w={5} />
      <T f={f} at={at + 4} x={x} y={y - 42} size={34}>?</T>
    </g>)}
    {f >= 571 && <g opacity={k(f, 571, 6)}>
      <circle cx={mx} cy={my} r={90} fill="rgba(224,36,27,.06)" stroke={RED} strokeWidth={8} />
      <line x1={mx + 64} y1={my + 64} x2={mx + 140} y2={my + 140} stroke={RED} strokeWidth={16} strokeLinecap="round" />
    </g>}
  </Board>;
};

/* B4 (split): the work is great but sits in the dark, until a system switches the light on. */
export const WB31Spotlight: React.FC<VisualProps> = ({beat, frame}) => {
  const f = cue(beat, frame);
  const dark = k(f, 775, 16) * (1 - EO(clamp((f - 828) / 18)));
  const lit = k(f, 828, 14);
  return <Board h={960} id="rough31c" f={f}>
    <P f={f} at={632} len={14} d="M100 660 H980" c={INK} w={5} />
    <P f={f} at={661} len={18} d={house(400, 660, 3.2)} w={8} />
    <P f={f} at={672} len={12} d="M360 660 V560 H440 V660 M300 470 H350 V520 H300 Z M450 470 H500 V520 H450 Z" c={INK} w={5} />
    <P f={f} at={715} len={12} d={person(640, 540, 1.6)} c={INK} w={5} />
    <P f={f} at={722} len={10} d="M672 600 L720 560 M705 548 L738 575" c={INK} w={6} />
    <P f={f} at={754} len={10} d={star(400, 170, 40)} w={6} />
    {/* the dark */}
    {dark > 0 && <path d="M150 120 H700 V655 H150 Z" fill={`rgba(27,27,27,${.82 * dark})`} />}
    {/* the system: a lamp post */}
    <P f={f} at={802} len={18} d="M880 660 V200 Q880 150 830 150 H780 M750 150 H810 L800 185 H760 Z" c={INK} w={6} />
    {lit > 0 && <path d="M760 185 L800 185 L620 655 L160 655 Z" fill={`rgba(224,36,27,${.1 * lit})`} />}
    {[0, 1, 2].map(i => <P key={i} f={f} at={834 + i * 3} len={8} d={`M${700 - i * 60} ${120 + i * 30} L${660 - i * 70} ${80 + i * 20}`} w={4} />)}
  </Board>;
};
