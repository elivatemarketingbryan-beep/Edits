import React from 'react';
import {clamp} from '../../motion';
import type {VisualProps} from '../../types';
import {RED, INK, PAPER, EO, EIO, k, P, T, Dot, circlePath, Scene} from './Whiteboard26';
import {Board, cue, person, star, cross, rect, house, phone} from './wbKit';

// video37 ("someone searching is already raising their hand"). Output-frame cues; split board.

// A person with one arm raised (the searcher).
const raised = (x: number, y: number, s = 1) => `${circlePath(x, y, 16 * s, 16 * s)} M${x - 24 * s} ${y + 46 * s} Q${x} ${y + 12 * s} ${x + 24 * s} ${y + 46 * s} M${x + 14 * s} ${y + 22 * s} L${x + 34 * s} ${y - 30 * s}`;

export const WB37Hand: React.FC<VisualProps> = ({beat, frame}) => {
  const f = cue(beat, frame);
  const push = EIO(clamp((f - 245) / 45));
  const bx = 480 + 220 * push, by = 700 - (bx - 380) * .769;
  const run = EIO(clamp((f - 676) / 40));
  return <Board h={960} id="rough37" f={f}>
    {/* S1 the random-ad viewer has to be pushed uphill: educate, awareness, explain, convince */}
    <Scene f={f} from={100} to={302}>
      <P f={f} at={102} len={12} d={person(170, 420, 1.8)} c={INK} w={5} />
      <P f={f} at={106} len={10} d={phone(240, 520, .7)} c={INK} w={4} />
      <T f={f} at={112} x={170} y={330} size={60} c={INK}>?</T>
      <P f={f} at={150} len={12} d={`${rect(560, 120, 160, 100, 6)} M580 150 H690 M580 180 H660`} c={INK} w={4} />
      <P f={f} at={180} len={12} d="M760 170 L820 140 V230 L760 200 Z M740 170 V200 H760 M840 160 Q860 185 840 210" c={INK} w={4} />
      <T f={f} at={209} x={940} y={210} size={90}>!</T>
      {/* the hill and the boulder */}
      <P f={f} at={240} len={14} d="M380 700 L900 300 V700 Z" c={INK} w={5} />
      {f >= 244 && <g opacity={k(f, 244, 6)}><circle cx={bx} cy={by - 58} r={52} fill={PAPER} stroke={RED} strokeWidth={7} /></g>}
      {f >= 248 && <path d={person(bx - 92, by - 40, 1.3)} fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" opacity={k(f, 248, 6)} />}
    </Scene>
    {/* S2 the searcher: a search bar and a raised hand; not "do I need this?" but "who should I hire?" */}
    <Scene f={f} from={302} to={622}>
      <P f={f} at={320} len={14} d={rect(170, 150, 740, 100, 50)} c={INK} w={6} />
      <P f={f} at={330} len={10} d={`${circlePath(860, 196, 22, 22)} M876 212 L894 230`} w={5} />
      <P f={f} at={338} len={10} d="M220 200 H560" c={INK} w={4} />
      <P f={f} at={372} len={14} d={raised(540, 450, 2.6)} w={7} />
      <P f={f} at={455} len={10} d="M180 420 Q180 370 250 370 Q320 370 320 420 Q320 465 250 465 L225 495 L232 463 Q180 460 180 420 Z" c={INK} w={4} />
      <T f={f} at={459} x={250} y={438} size={40} c={INK}>?</T>
      <P f={f} at={478} len={8} d={cross(250, 420, 60)} w={7} />
      <P f={f} at={512} len={12} d="M740 420 Q740 360 830 360 Q920 360 920 420 Q920 470 830 470 L860 505 L850 468 Q740 465 740 420 Z" w={5} />
      {[0, 1, 2].map(i => <P key={i} f={f} at={520 + i * 5} len={8} d={person(790 + i * 40, 395, .55)} c={INK} w={3} />)}
      <T f={f} at={538} x={935} y={380} size={56}>?</T>
    </Scene>
    {/* S3 chasing someone down vs meeting someone who is already asking */}
    <Scene f={f} from={622} to={970}>
      <P f={f} at={624} len={14} d="M540 120 V700" c={INK} w={4} dash />
      {f >= 624 && <path d="M540 120 V700" stroke={INK} strokeWidth={4} strokeDasharray="14 12" opacity={.6 * k(f, 624, 8)} />}
      {/* left: chasing */}
      <g transform={`translate(${run * 60} 0)`}>
        <P f={f} at={676} len={10} d={person(140, 430, 1.5)} c={INK} w={5} />
        <P f={f} at={680} len={8} d="M70 440 H100 M60 470 H95 M75 500 H100" c={INK} w={3} />
      </g>
      <P f={f} at={678} len={10} d={person(380, 430, 1.5)} c={INK} w={5} />
      <P f={f} at={751} len={12} d={house(300, 640, 1.2)} c={INK} w={5} />
      <T f={f} at={794} x={300} y={540} size={60}>?</T>
      {/* right: already asking */}
      <P f={f} at={821} len={12} d={raised(800, 400, 1.6)} c={INK} w={5} />
      <P f={f} at={874} len={12} d={house(800, 640, 1.2)} w={6} />
      <T f={f} at={906} x={800} y={540} size={60}>!</T>
      <P f={f} at={917} len={10} d="M880 380 L905 405 L950 350" w={8} />
    </Scene>
  </Board>;
};
