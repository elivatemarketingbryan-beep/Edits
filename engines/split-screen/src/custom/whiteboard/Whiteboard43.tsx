import React from 'react';
import {clamp} from '../../motion';
import type {VisualProps} from '../../types';
import {RED, INK, PAPER, EO, EIO, k, P, T, Dot, circlePath, Scene} from './Whiteboard26';
import {Board, cue, person, star, cross, rect, browser, house} from './wbKit';

// video43 ("every trade, no blueprint"). Output-frame cues; split board.

export const WB43Blueprint: React.FC<VisualProps> = ({beat, frame}) => {
  const f = cue(beat, frame);
  const wob = f >= 510 ? Math.sin((f - 510) / 3) * 4 * clamp((f - 510) / 10) : 0;
  const fall = EIO(clamp((f - 548) / 26));
  // S2 the marketing pieces start scattered and snap together on "the system together"
  const snap = EIO(clamp((f - 781) / 20));
  const pieces = [
    {d: browser(0, 0, 150, 110), from: [200, 260], to: [440, 360]},
    {d: `M-60 -30 H40 L70 -50 V50 L40 30 H-60 Z`, from: [860, 230], to: [640, 360]},
    {d: `${circlePath(-10, -10, 38, 38)} M18 18 L50 50`, from: [230, 560], to: [440, 520]},
    {d: `${rect(-60, -45, 120, 90, 8)} M-20 -20 L25 0 L-20 20 Z`, from: [850, 560], to: [640, 520]},
  ];
  return <Board h={960} id="rough43" f={f}>
    {/* S1 every trade hired, no blueprint: the pieces never come together */}
    <Scene f={f} from={190} to={592}>
      <P f={f} at={192} len={14} d="M100 680 H980" c={INK} w={4} />
      {f >= 200 && <path d={house(540, 680, 4.4)} fill="none" stroke={INK} strokeWidth={4} strokeDasharray="16 14" opacity={.35 * k(f, 200, 12) * (1 - fall)} />}
      {/* each trade builds their own piece, scattered */}
      <g transform={`translate(0 ${fall * 70}) rotate(${wob + fall * -8} 220 640)`}>
        <P f={f} at={263} len={10} d="M200 360 L170 440 H215 L190 520" w={6} />
        <P f={f} at={266} len={10} d={person(110, 560, 1.2)} c={INK} w={4} />
      </g>
      <g transform={`translate(0 ${fall * 50}) rotate(${-wob + fall * 10} 420 640)`}>
        <P f={f} at={289} len={10} d="M360 500 H440 V420 H500 M440 500 V560" w={6} />
        <P f={f} at={292} len={10} d={person(330, 590, 1.2)} c={INK} w={4} />
      </g>
      <g transform={`translate(0 ${fall * 80}) rotate(${wob + fall * 12} 660 640)`}>
        <P f={f} at={305} len={10} d="M580 330 L680 260 L780 330" w={6} />
        <P f={f} at={308} len={10} d={person(700, 590, 1.2)} c={INK} w={4} />
      </g>
      <g transform={`translate(0 ${fall * 60}) rotate(${-wob - fall * 9} 880 640)`}>
        <P f={f} at={320} len={10} d="M840 640 V420 H940 V640 M840 530 H940" w={6} />
        <P f={f} at={323} len={10} d={person(980, 590, 1)} c={INK} w={4} />
      </g>
      {/* the blueprint nobody has */}
      <P f={f} at={396} len={12} d="M420 120 H660 V230 H420 Z M440 150 H520 V200 H440 Z M560 150 H640 M560 180 H620" c={INK} w={4} />
      <P f={f} at={433} len={10} d={cross(540, 175, 80)} w={8} />
      <T f={f} at={544} x={540} y={300} size={70}>?</T>
    </Scene>
    {/* S2 marketing works the same way: website, ads, SEO, content, scattered until they work as one */}
    <Scene f={f} from={592} to={860}>
      {pieces.map((p, i) => {
        const x = p.from[0] + (p.to[0] - p.from[0]) * snap, y = p.from[1] + (p.to[1] - p.from[1]) * snap;
        return <g key={i} transform={`translate(${x} ${y}) rotate(${(1 - snap) * (i % 2 ? 12 : -10)})`} opacity={k(f, 603 + i * 14, 8)}>
          <path d={p.d} fill="none" stroke={snap > .95 ? RED : INK} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
        </g>;
      })}
      <P f={f} at={730} len={14} d="M120 720 H420" c={INK} w={4} />
      <P f={f} at={801} len={16} d={rect(340, 260, 400, 360, 20)} w={7} />
      <P f={f} at={806} len={14} d="M780 600 Q860 520 920 340 M890 360 L920 340 L940 372" w={7} />
    </Scene>
  </Board>;
};
