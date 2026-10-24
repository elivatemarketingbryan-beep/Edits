import React from 'react';
import {clamp} from '../../motion';
import type {VisualProps} from '../../types';
import {RED, INK, PAPER, EO, EIO, k, P, T, Dot, circlePath, Scene} from './Whiteboard26';
import {Board, cue, person, star, cross, rect} from './wbKit';

// video42 ("Joseph: prepare in the years of abundance"). Output-frame cues; split board.

const sheaf = (x: number, y: number, s = 1) => `M${x} ${y} V${y - 90 * s} M${x - 18 * s} ${y} L${x - 4 * s} ${y - 80 * s} M${x + 18 * s} ${y} L${x + 4 * s} ${y - 80 * s} M${x - 22 * s} ${y - 40 * s} H${x + 22 * s} M${x} ${y - 90 * s} Q${x - 14 * s} ${y - 110 * s} ${x} ${y - 125 * s} Q${x + 14 * s} ${y - 110 * s} ${x} ${y - 90 * s}`;

export const WB42Joseph: React.FC<VisualProps> = ({beat, frame}) => {
  const f = cue(beat, frame);
  const fill = EO(clamp((f - 331) / 34));
  // S2 sales stay high; marketing eases off (wrong) then the red line climbs (right)
  return <Board h={960} id="rough42" f={f}>
    {/* S1 seven years of abundance, stored in a barn, carry Egypt through seven years of famine */}
    <Scene f={f} from={140} to={505}>
      <P f={f} at={142} len={14} d="M60 640 H1020" c={INK} w={4} />
      <P f={f} at={144} len={10} d="M540 600 V680" c={INK} w={4} />
      {Array.from({length: 7}, (_, i) => <P key={i} f={f} at={153 + i * 3} len={8} d={sheaf(100 + i * 62, 630, .9)} w={5} />)}
      {/* the barn */}
      <P f={f} at={300} len={14} d="M420 420 V300 L500 240 L580 300 V420 Z M470 420 V360 H530 V420" c={INK} w={6} />
      {f >= 331 && <path d={`M425 ${415 - 110 * fill} H575 V415 H425 Z`} fill="rgba(224,36,27,.15)" />}
      <P f={f} at={331} len={10} d="M300 520 Q360 420 420 380" w={5} />
      {/* seven lean years: cracked ground, kept alive by the barn */}
      {Array.from({length: 7}, (_, i) => <P key={i} f={f} at={448 + i * 3} len={6} d={`M${600 + i * 62} 640 L${590 + i * 62} 610 L${606 + i * 62} 590`} c={INK} w={3} />)}
      <P f={f} at={403} len={14} d="M580 360 Q760 300 900 500" w={5} />
      <P f={f} at={420} len={8} d="M880 470 L900 500 L920 465" w={5} />
      <T f={f} at={153} x={290} y={720} size={40}>7</T>
      <T f={f} at={448} x={790} y={720} size={40} c={INK}>7</T>
    </Scene>
    {/* S2 when sales are thriving, it is tempting to ease up on marketing; that is when to invest most */}
    <Scene f={f} from={505} to={950}>
      <P f={f} at={507} len={14} d="M130 140 V660 H960" c={INK} w={5} />
      <P f={f} at={681} len={18} d="M140 300 Q300 240 460 260 T780 230 T950 240" c={INK} w={6} />
      <T f={f} at={690} x={950} y={210} size={44} c={INK} anchor="end">$$$</T>
      <P f={f} at={731} len={18} d="M140 420 Q400 430 560 560" c={INK} w={5} dash />
      {f >= 731 && <path d="M140 420 Q400 430 560 560" fill="none" stroke={INK} strokeWidth={5} strokeDasharray="14 10" opacity={.7 * k(f, 731, 10)} />}
      <P f={f} at={876} len={20} d="M560 560 Q720 470 940 300 M900 300 H940 V340" w={8} />
    </Scene>
    {/* S3 brand, reach, a foundation that holds when the market changes */}
    <Scene f={f} from={950} to={1110}>
      <P f={f} at={961} len={12} d={star(220, 330, 70)} w={6} />
      <P f={f} at={1004} len={12} d={`${circlePath(540, 330, 40, 40)} ${circlePath(540, 330, 80, 80)} ${circlePath(540, 330, 120, 120)}`} c={INK} w={4} />
      <Dot f={f} at={1006} x={540} y={330} r={14} />
      <P f={f} at={1046} len={14} d={`${rect(720, 470, 240, 60, 4)} M760 470 V400 L840 340 L920 400 V470`} w={6} />
      <P f={f} at={1061} len={10} d="M720 560 H960" w={5} />
    </Scene>
  </Board>;
};
