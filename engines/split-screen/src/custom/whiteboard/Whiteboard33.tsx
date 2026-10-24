import React from 'react';
import {clamp} from '../../motion';
import type {VisualProps} from '../../types';
import {RED, INK, EO, EIO, k, P, T, Dot, circlePath, Scene} from './Whiteboard26';
import {Board, cue, person, star, cross, rect, browser, phone} from './wbKit';

// video33 ("a website that exists vs one that works"). Output-frame cues; split board 1080 x 960.

export const WB33Website: React.FC<VisualProps> = ({beat, frame}) => {
  const f = cue(beat, frame);
  const hood = EIO(clamp((f - 668) / 14));
  const spin = (f - 760) * 18;
  return <Board h={960} id="rough33" f={f}>
    {/* S1 jobs from the website last month: zero, maybe one */}
    <Scene f={f} from={100} to={247}>
      <P f={f} at={102} len={16} d={browser(540, 380, 620, 440)} c={INK} w={6} />
      <P f={f} at={110} len={12} d="M300 260 H560 M300 300 H460" c={INK} w={4} />
      <T f={f} at={165} x={540} y={545} size={220}>{f >= 199 ? '1' : '0'}</T>
      <P f={f} at={182} len={10} d="M690 560 Q740 520 790 560" w={5} />
      <T f={f} at={184} x={800} y={520} size={60}>?</T>
    </Scene>
    {/* S2 exists vs works */}
    <Scene f={f} from={247} to={502}>
      <P f={f} at={250} len={14} d={browser(290, 330, 380, 300)} c={INK} w={5} />
      <P f={f} at={300} len={14} d={browser(790, 330, 380, 300)} c={INK} w={5} />
      {[0, 1, 2].map(i => <P key={i} f={f} at={423 + i * 4} len={8} d={star(200 + i * 90, 380, 26)} c={INK} w={4} />)}
      <P f={f} at={470} len={12} d="M120 620 H460" w={7} />
      <T f={f} at={476} x={290} y={590} size={50}>0</T>
      {/* the working site: calls coming out of it */}
      {[0, 1, 2].map(i => <g key={i}>
        <P f={f} at={366 + i * 6} len={10} d={`M${700 + i * 90} 520 V${600 + i * 20}`} w={5} />
        <P f={f} at={372 + i * 6} len={10} d={phone(700 + i * 90, 660 + i * 20, .6)} w={5} />
      </g>)}
      <P f={f} at={380} len={12} d="M690 260 L740 320 L870 200" w={8} />
    </Scene>
    {/* S3 a new truck on the driveway with no engine */}
    <Scene f={f} from={502} to={810}>
      <P f={f} at={505} len={14} d="M90 660 H990" c={INK} w={5} />
      <P f={f} at={530} len={20} d="M180 600 V470 H520 L600 380 H760 L840 470 H920 V600 Z M620 400 V470 M540 470 H840" c={INK} w={6} />
      <g transform={`rotate(${spin > 0 ? spin : 0} 320 610)`}><P f={f} at={540} len={10} d={`${circlePath(320, 610, 52, 52)} M290 610 H350 M320 580 V640`} c={INK} w={6} /></g>
      <g transform={`rotate(${spin > 0 ? spin : 0} 780 610)`}><P f={f} at={545} len={10} d={`${circlePath(780, 610, 52, 52)} M750 610 H810 M780 580 V640`} c={INK} w={6} /></g>
      {[0, 1, 2].map(i => <P key={i} f={f} at={560 + i * 3} len={8} d={`M${250 + i * 120} 420 L${280 + i * 120} 380`} c={INK} w={3} />)}
      {/* the hood opens: an empty engine bay */}
      <g transform={`rotate(${-38 * hood} 180 470)`}><path d="M180 470 H300" stroke={INK} strokeWidth={6} strokeLinecap="round" opacity={k(f, 530, 10)} /></g>
      {hood > 0 && <path d="M190 470 H300 V560 H190 Z" fill="rgba(224,36,27,.08)" stroke={RED} strokeWidth={5} strokeDasharray="14 10" opacity={hood} />}
      <T f={f} at={677} x={245} y={545} size={70}>?</T>
      {/* not taking you anywhere */}
      <P f={f} at={760} len={16} d="M620 250 H960 M920 220 L960 250 L920 280" c={INK} w={5} />
      <P f={f} at={770} len={10} d={cross(790, 250, 46)} w={8} />
    </Scene>
    {/* S4 not a business card: a salesperson that works 24/7 */}
    <Scene f={f} from={810} to={960}>
      <P f={f} at={812} len={14} d={rect(160, 220, 380, 230, 12)} c={INK} w={6} />
      <P f={f} at={820} len={10} d="M200 290 H420 M200 330 H360 M200 400 H300" c={INK} w={4} />
      <P f={f} at={880} len={10} d={cross(350, 335, 90)} w={9} />
      <P f={f} at={890} len={12} d="M580 335 H660 M630 305 L660 335 L630 365" w={6} />
      <P f={f} at={895} len={12} d={person(800, 300, 2.4)} c={INK} w={6} />
      <P f={f} at={902} len={10} d="M745 290 Q745 220 800 220 Q855 220 855 290 M855 300 Q860 340 820 350" w={5} />
      <P f={f} at={910} len={12} d={`${circlePath(800, 620, 70, 70)} M800 575 V620 L835 645`} w={6} />
    </Scene>
  </Board>;
};
