import React from 'react';
import {clamp} from '../../motion';
import type {VisualProps} from '../../types';
import {RED, INK, PAPER, EO, EIO, k, P, T, Dot, circlePath, Scene} from './Whiteboard26';
import {Board, cue, person, star, cross, rect, house, phone, browser} from './wbKit';

// video39 ("better in real life than online"). Output-frame cues; split board.

export const WB39Online: React.FC<VisualProps> = ({beat, frame}) => {
  const f = cue(beat, frame);
  const fadeOnline = k(f, 290, 14);
  return <Board h={960} id="rough39" f={f}>
    {/* S1 the real work vs how it shows up on a phone */}
    <Scene f={f} from={200} to={312}>
      <P f={f} at={202} len={16} d={house(280, 640, 3.4)} w={8} />
      <P f={f} at={210} len={10} d={star(280, 470, 50)} w={6} />
      <P f={f} at={216} len={16} d={rect(650, 160, 280, 500, 30)} c={INK} w={6} />
      <g opacity={1 - .75 * fadeOnline}><P f={f} at={226} len={10} d={house(790, 470, 1.1)} c={INK} w={4} /></g>
      <P f={f} at={299} len={10} d={cross(790, 420, 70)} w={8} />
    </Scene>
    {/* S2 the online presence checklist: photos, projects, reviews, social */}
    <Scene f={f} from={312} to={562}>
      <P f={f} at={314} len={16} d={rect(330, 90, 420, 640, 40)} c={INK} w={6} />
      {/* inconsistent photos: crooked frames */}
      <g transform="rotate(-8 430 220)"><P f={f} at={330} len={8} d={rect(380, 180, 100, 80, 4)} c={INK} w={4} /></g>
      <g transform="rotate(10 560 230)"><P f={f} at={338} len={8} d={rect(510, 190, 100, 80, 4)} c={INK} w={4} /></g>
      <P f={f} at={345} len={8} d={cross(620, 210, 30)} w={5} />
      {/* projects not documented: an empty folder */}
      <P f={f} at={383} len={10} d="M380 360 H450 L470 380 H660 V470 H380 Z" c={INK} w={4} />
      <T f={f} at={406} x={520} y={440} size={40}>0</T>
      {/* scattered reviews */}
      {[[400, 540, -20], [520, 600, 15], [630, 520, -35], [460, 650, 30]].map(([x, y, r], i) => <g key={i} transform={`rotate(${r} ${x} ${y})`}><P f={f} at={445 + i * 4} len={8} d={star(x, y, 24)} c={INK} w={4} /></g>)}
      {/* inactive social: a flat line + zzz */}
      <P f={f} at={491} len={12} d="M790 600 H960" w={6} />
      <T f={f} at={505} x={880} y={560} size={44} c={INK}>z z z</T>
    </Scene>
    {/* S3 the quality is there, but the homeowner can't experience it before reaching out */}
    <Scene f={f} from={562} to={960}>
      <P f={f} at={568} len={14} d={browser(270, 300, 360, 260)} c={INK} w={5} />
      <P f={f} at={576} len={10} d="M140 340 H380 M140 380 H320" c={INK} w={4} />
      <P f={f} at={648} len={12} d="M210 470 Q270 450 330 470" c={INK} w={5} />
      {/* the real quality, behind a wall */}
      <P f={f} at={755} len={14} d={house(760, 600, 2.2)} w={7} />
      <P f={f} at={762} len={10} d={star(760, 470, 34)} w={5} />
      <P f={f} at={790} len={14} d="M560 140 V700" c={INK} w={14} />
      <P f={f} at={800} len={10} d={person(440, 520, 1.6)} c={INK} w={5} />
      <T f={f} at={839} x={440} y={440} size={60}>?</T>
      <P f={f} at={875} len={10} d={phone(330, 580, .6)} c={INK} w={4} />
      <P f={f} at={890} len={8} d="M360 540 Q380 560 360 580 M375 525 Q405 560 375 595" w={4} />
    </Scene>
  </Board>;
};
