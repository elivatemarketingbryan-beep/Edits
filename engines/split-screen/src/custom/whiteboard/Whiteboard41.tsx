import React from 'react';
import {clamp} from '../../motion';
import type {VisualProps} from '../../types';
import {RED, INK, PAPER, EO, EIO, k, P, T, Dot, circlePath, Scene} from './Whiteboard26';
import {Board, cue, person, star, cross, rect} from './wbKit';

// video41 ("hunting every day vs building a farm"). Output-frame cues; split board.

const sun = (x: number, y: number, r = 26) => `${circlePath(x, y, r, r)} ${Array.from({length: 8}, (_, i) => { const a = i * Math.PI / 4; return `M${(x + Math.cos(a) * r * 1.4).toFixed(1)} ${(y + Math.sin(a) * r * 1.4).toFixed(1)} L${(x + Math.cos(a) * r * 1.9).toFixed(1)} ${(y + Math.sin(a) * r * 1.9).toFixed(1)}`; }).join(' ')}`;
const sprout = (x: number, y: number, h: number) => `M${x} ${y} V${y - h} M${x} ${y - h * .55} Q${x - 26} ${y - h * .8} ${x - 34} ${y - h * .6} Q${x - 18} ${y - h * .45} ${x} ${y - h * .55} M${x} ${y - h * .8} Q${x + 26} ${y - h} ${x + 34} ${y - h * .82} Q${x + 18} ${y - h * .68} ${x} ${y - h * .8}`;

export const WB41Farm: React.FC<VisualProps> = ({beat, frame}) => {
  const f = cue(beat, frame);
  const grow = EO(clamp((f - 389) / 57));
  const track = EIO(clamp((f - 140) / 80));
  return <Board h={960} id="rough41" f={f}>
    {/* S1 hunting: every day, out again to find the next meal */}
    <Scene f={f} from={125} to={252}>
      {[0, 1, 2].map(i => <P key={i} f={f} at={127 + i * 8} len={10} d={sun(220 + i * 160, 140, 24)} c={INK} w={4} />)}
      {[0, 1, 2, 3, 4, 5].map(i => <g key={i} opacity={k(f, 150 + i * 6, 6)}><ellipse cx={200 + i * 110} cy={600 - (i % 2) * 30} rx={14} ry={22} fill={INK} opacity={.5} /></g>)}
      <g transform={`translate(${track * 520} 0)`}><P f={f} at={140} len={10} d={person(170, 420, 2)} c={INK} w={6} /><P f={f} at={146} len={10} d="M215 470 L300 330 M285 345 L300 330 L305 350" c={INK} w={5} /></g>
      <P f={f} at={228} len={12} d="M860 470 Q900 430 940 470 Q900 510 860 470 Z M940 470 L970 450 V490 Z" w={6} />
    </Scene>
    {/* S2 farming: plant, water, build the soil, and the field produces */}
    <Scene f={f} from={252} to={485}>
      {[0, 1, 2, 3].map(r => <P key={r} f={f} at={352 + r * 4} len={14} d={`M140 ${520 + r * 50} Q540 ${505 + r * 50} 940 ${520 + r * 50}`} c={INK} w={4} />)}
      {Array.from({length: 6}, (_, i) => <Dot key={i} f={f} at={292 + i * 3} x={220 + i * 130} y={500} r={9} c={INK} />)}
      {/* watering can */}
      <g opacity={1 - k(f, 384, 10)}><P f={f} at={318} len={12} d="M760 260 H880 V340 H760 Z M760 280 L680 230 M880 280 Q930 280 920 320" c={INK} w={5} /></g>
      {f >= 322 && Array.from({length: 5}, (_, i) => { const ph = ((f - 322) * 6 + i * 23) % 90; return <line key={i} x1={660 - i * 14} y1={250 + ph} x2={656 - i * 14} y2={266 + ph} stroke={INK} strokeWidth={3} strokeLinecap="round" opacity={.6 * (1 - k(f, 380, 10))} />; })}
      {Array.from({length: 6}, (_, i) => grow > 0 ? <path key={`s${i}`} d={sprout(220 + i * 130, 500, 40 + 150 * grow)} fill="none" stroke={RED} strokeWidth={6} strokeLinecap="round" /> : null)}
    </Scene>
    {/* S3 stuck hunting vs a system that farms */}
    <Scene f={f} from={485} to={825}>
      <P f={f} at={487} len={12} d="M540 120 V700" c={INK} w={4} />
      <P f={f} at={491} len={10} d={person(270, 380, 1.8)} c={INK} w={5} />
      <P f={f} at={497} len={10} d="M310 430 L380 300 M366 314 L380 300 L384 318" c={INK} w={5} />
      {[0, 1, 2].map(i => <P key={i} f={f} at={532 + i * 4} len={8} d={sun(170 + i * 100, 170, 18)} c={INK} w={3} />)}
      {[0, 1, 2, 3].map(i => <P key={i} f={f} at={598 + i * 6} len={10} d={sprout(640 + i * 90, 560, 150)} w={6} />)}
      <P f={f} at={595} len={14} d="M600 560 H980" c={INK} w={4} />
      {/* operating from a different place: the farmer sits back */}
      <P f={f} at={794} len={12} d={`${person(800, 170, 1.4)} M740 250 H860 M750 250 V300 M850 250 V300`} c={INK} w={5} />
    </Scene>
    {/* S4 what stops: desperate estimates, underpricing out of fear */}
    <Scene f={f} from={825} to={995}>
      <P f={f} at={840} len={14} d={`${rect(170, 180, 300, 400, 12)} M210 250 H420 M210 300 H380 M210 350 H400`} c={INK} w={5} />
      <P f={f} at={862} len={10} d="M330 470 Q320 440 330 420 Q340 440 330 470 Z" c={INK} w={4} />
      <P f={f} at={884} len={12} d={cross(320, 380, 120)} w={9} />
      <P f={f} at={914} len={12} d="M620 300 H820 L880 380 L820 460 H620 Z" c={INK} w={5} />
      <T f={f} at={918} x={720} y={400} size={70} c={INK}>$↓</T>
      <P f={f} at={961} len={12} d={cross(750, 380, 120)} w={9} />
    </Scene>
  </Board>;
};
