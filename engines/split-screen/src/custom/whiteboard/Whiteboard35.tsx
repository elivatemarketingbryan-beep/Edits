import React from 'react';
import {clamp} from '../../motion';
import type {VisualProps} from '../../types';
import {RED, INK, PAPER, EO, EIO, k, P, T, Dot, circlePath, Scene} from './Whiteboard26';
import {Board, cue, person, star, cross, rect, browser, phone} from './wbKit';

// video35 ("the homeowner's journey is a bridge"). Output-frame cues; split board.

const shieldP = (x: number, y: number, s = 1) => `M${x} ${y - 60 * s} L${x + 52 * s} ${y - 40 * s} V${y + 4 * s} Q${x + 52 * s} ${y + 46 * s} ${x} ${y + 66 * s} Q${x - 52 * s} ${y + 46 * s} ${x - 52 * s} ${y + 4 * s} V${y - 40 * s} Z`;

export const WB35Bridge: React.FC<VisualProps> = ({beat, frame}) => {
  const f = cue(beat, frame);
  // S1 the process along a winding path (stations left to right, two rows)
  const stations: Array<[number, number, number, string]> = [
    [127, 170, 210, 'search'], [157, 420, 210, 'compare'], [175, 670, 210, 'site'], [223, 900, 300, 'reviews'],
    [283, 700, 470, 'ask'], [325, 450, 470, 'contact'], [387, 200, 560, 'safe'],
  ];
  const ic = (kind: string, x: number, y: number) => kind === 'search' ? `${circlePath(x - 8, y - 8, 34, 34)} M${x + 16} ${y + 16} L${x + 46} ${y + 46}`
    : kind === 'compare' ? `${rect(x - 70, y - 40, 60, 80, 6)} ${rect(x + 10, y - 40, 60, 80, 6)}`
    : kind === 'site' ? browser(x, y, 130, 96)
    : kind === 'reviews' ? `${star(x - 40, y, 22)} ${star(x, y, 22)} ${star(x + 40, y, 22)}`
    : kind === 'ask' ? `M${x - 60} ${y - 10} Q${x - 60} ${y - 55} ${x} ${y - 55} Q${x + 60} ${y - 55} ${x + 60} ${y - 10} Q${x + 60} ${y + 30} ${x} ${y + 30} L${x - 30} ${y + 60} L${x - 22} ${y + 28} Q${x - 60} ${y + 22} ${x - 60} ${y - 10} Z`
    : kind === 'contact' ? `${phone(x - 50, y, .5)} ${phone(x, y, .5)} ${phone(x + 50, y, .5)}`
    : shieldP(x, y, 1);
  // S2 the bridge: five planks between two cliffs
  const planks = [[300, 'site'], [410, 'reviews'], [520, ''], [630, 'slow'], [740, 'follow']] as const;
  const walk = EIO(clamp((f - 572) / 120));
  const px = 150 + 330 * walk; // walks up to the missing third plank and stops
  const drop = EIO(clamp((f - 676) / 16));
  const bad = (i: number) => [773, 843, 0, 917, 1003][i];
  return <Board h={960} id="rough35" f={f}>
    <Scene f={f} from={100} to={545}>
      <P f={f} at={104} len={30} d="M90 210 H960 Q1010 210 1010 300 Q1010 390 920 390 H200 Q110 390 110 470 Q110 560 200 560 H300" c={INK} w={4} dash />
      {f >= 104 && <path d="M90 210 H960 Q1010 210 1010 300 Q1010 390 920 390 H200 Q110 390 110 470 Q110 560 200 560 H300" fill="none" stroke={INK} strokeWidth={4} strokeDasharray="14 12" opacity={.5 * k(f, 104, 10)} />}
      {stations.map(([at, x, y, kind], i) => <g key={i}>
        <circle cx={x} cy={y} r={68} fill={PAPER} opacity={k(f, at, 6)} />
        <P f={f} at={at} len={12} d={ic(kind, x, y)} c={kind === 'safe' ? RED : INK} w={5} />
      </g>)}
      <P f={f} at={415} len={10} d="M175 560 L195 582 L228 540" w={7} />
      {/* your marketing guides them: a red line runs the whole path */}
      <P f={f} at={497} len={30} d="M90 210 H960 Q1010 210 1010 300 Q1010 390 920 390 H200 Q110 390 110 470 Q110 560 200 560 H300" w={7} />
    </Scene>
    <Scene f={f} from={545} to={1085}><g transform="translate(540 430) scale(1.3) translate(-540 -430)">
      {/* cliffs */}
      <P f={f} at={548} len={14} d="M40 420 H250 V600 M830 420 H1040 M830 420 V600" c={INK} w={6} />
      {/* the planks: the third one is missing */}
      {planks.map(([x, kind], i) => {
        if (i === 2) return <g key={i} opacity={1 - drop} transform={`translate(0 ${drop * 300}) rotate(${drop * 40} ${x} 430)`}>
          <path d={rect(x - 50, 420, 100, 26, 4)} fill={PAPER} stroke={INK} strokeWidth={5} opacity={k(f, 556 + i * 4, 6)} />
        </g>;
        const b = bad(i), weak = f >= b;
        return <g key={i} opacity={k(f, 556 + i * 4, 6)}>
          <path d={rect(x - 50, 420, 100, 26, 4)} fill={PAPER} stroke={weak ? RED : INK} strokeWidth={5} strokeDasharray={weak ? '12 9' : undefined} />
          <P f={f} at={b} len={8} d={`M${x - 30} 422 L${x - 5} 446 L${x + 12} 422 L${x + 34} 446`} w={4} />
        </g>;
      })}
      {/* the icon above each plank */}
      <P f={f} at={754} len={10} d={browser(300, 520, 90, 66)} c={INK} w={4} />
      <P f={f} at={828} len={10} d={star(410, 520, 28)} c={INK} w={4} />
      <P f={f} at={897} len={10} d={`${circlePath(630, 520, 32, 32)} M630 498 V520 L648 532`} c={INK} w={4} />
      <P f={f} at={982} len={10} d={`${rect(705, 495, 70, 50, 4)} M705 497 L740 525 L775 497`} c={INK} w={4} />
      {/* the walker stops at the gap */}
      {f >= 570 && <g transform={`translate(${px} ${Math.sin(walk * Math.PI * 8) * -4})`} opacity={(1 - .7 * k(f, 1024, 12)) * k(f, 570, 6)}>
        <path d={person(0, 330, 1.3)} fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />
      </g>}
      <T f={f} at={707} x={px + 60} y={300} size={70}>!</T>
      <T f={f} at={1026} x={px} y={260} size={60} c={INK}>?</T>
      {/* every missing piece is a gap */}
      <P f={f} at={1058} len={12} d={circlePath(520, 440, 80, 60)} w={6} />
    </g></Scene>
  </Board>;
};
