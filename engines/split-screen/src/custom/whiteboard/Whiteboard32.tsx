import React from 'react';
import {clamp} from '../../motion';
import type {VisualProps} from '../../types';
import {RED, INK, EO, EIO, k, P, T, Dot, circlePath, Scene} from './Whiteboard26';
import {Board, cue, person, star, cross, rect, house} from './wbKit';

// video32 ("they only see a price"). Output-frame cues.

const tag = (x: number, y: number, w = 200, h = 110) => `M${x - w / 2} ${y - h / 2} H${x + w / 2 - 40} L${x + w / 2} ${y} L${x + w / 2 - 40} ${y + h / 2} H${x - w / 2} Z`;
const shield = (x: number, y: number, s = 1) => `M${x} ${y - 90 * s} L${x + 80 * s} ${y - 60 * s} V${y + 5 * s} Q${x + 80 * s} ${y + 70 * s} ${x} ${y + 100 * s} Q${x - 80 * s} ${y + 70 * s} ${x - 80 * s} ${y + 5 * s} V${y - 60 * s} Z`;

/* B2: the homeowner's question changes, from who to trust to who is cheapest. */
export const WB32Ask: React.FC<VisualProps> = ({beat, frame}) => {
  const f = cue(beat, frame);
  const trustOut = k(f, 150, 10);
  return <Board h={1920} id="rough32a" f={f}>
    <P f={f} at={44} len={14} d={person(540, 950, 3.2)} c={INK} w={7} />
    <P f={f} at={50} len={18} d="M300 520 Q260 340 420 300 Q480 200 620 250 Q780 230 800 380 Q880 480 760 580 Q680 680 520 640 Q360 680 300 520 Z M470 760 m-22 0 a22 22 0 1 0 44 0 a22 22 0 1 0 -44 0 M500 840 m-12 0 a12 12 0 1 0 24 0 a12 12 0 1 0 -24 0" c={INK} w={5} />
    <g opacity={1 - trustOut}>
      <P f={f} at={68} len={14} d={shield(540, 450, 1.25)} w={7} />
      <P f={f} at={94} len={10} d="M495 455 L530 495 L595 410" w={8} />
    </g>
    <g opacity={1 - k(f, 212, 10)}><P f={f} at={140} len={10} d={cross(540, 455, 110)} w={10} /></g>
    {f >= 222 && <g opacity={k(f, 222, 8)} transform={`translate(0 ${(1 - EO(clamp((f - 222) / 12))) * -40})`}>
      <path d={tag(530, 450, 280, 140)} fill="rgba(224,36,27,.10)" stroke={RED} strokeWidth={7} strokeLinejoin="round" />
      <circle cx={630} cy={450} r={12} fill="none" stroke={RED} strokeWidth={5} />
      <text x={490} y={482} fontSize={96} fontWeight={900} fill={RED} textAnchor="middle" style={{fontFamily: 'Inter, Arial, sans-serif'}}>$</text>
    </g>}
    <P f={f} at={228} len={10} d="M860 330 V560 M820 520 L860 560 L900 520" w={7} />
  </Board>;
};

/* B3 (split): a race to the bottom, price tags shrink down the stairs. */
export const WB32Race: React.FC<VisualProps> = ({beat, frame}) => {
  const f = cue(beat, frame);
  const steps = [[140, 220], [360, 360], [580, 500], [800, 640]];
  const t = EIO(clamp((f - 300) / 60)) * 3, i = Math.min(2, Math.floor(t)), fr = t - i;
  const px = steps[i][0] + 110 + (steps[i + 1][0] - steps[i][0]) * fr, py = steps[i][1] + (steps[i + 1][1] - steps[i][1]) * fr - 60 - Math.sin(fr * Math.PI) * 40;
  return <Board h={960} id="rough32b" f={f}>
    <P f={f} at={253} len={20} d="M120 220 H360 V360 H580 V500 H800 V640 H1000 V740" c={INK} w={6} />
    {['$$$$', '$$$', '$$', '$'].map((s, j) => <T key={j} f={f} at={268 + j * 9} x={steps[j][0] + 110} y={steps[j][1] - 120} size={46}>{s}</T>)}
    {f >= 296 && <g opacity={k(f, 296, 6)}><path d={person(px, py - 20, 1.1)} fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" /></g>}
  </Board>;
};

/* B4/B5: the price is the tip; the value sits under the water where nobody sees it. Same drawing in the
   full board (offset down) and the split board. Then: two tags on a page; attention goes to the cheaper one. */
export const WB32Ice: React.FC<VisualProps> = ({beat, frame, height}) => {
  const f = cue(beat, frame);
  const dy = height > 1000 ? 290 : 0;
  const murk = k(f, 861, 18);
  const icons: Array<[number, string, number, number]> = [
    [500, 'cal', 330, 480], [564, 'star', 470, 480], [663, 'shield', 610, 480], [688, 'tool', 750, 480],
    [720, 'team', 400, 630], [742, 'zoom', 545, 630], [802, 'heart', 690, 630],
  ];
  const icon = (kind: string, x: number, y: number) => kind === 'cal' ? `${rect(x - 36, y - 32, 72, 66, 6)} M${x - 36} ${y - 12} H${x + 36} M${x - 18} ${y - 44} V${y - 22} M${x + 18} ${y - 44} V${y - 22}`
    : kind === 'star' ? star(x, y, 38)
    : kind === 'shield' ? shield(x, y, .42)
    : kind === 'tool' ? `M${x - 34} ${y + 34} L${x + 14} ${y - 14} M${x + 4} ${y - 30} Q${x + 10} ${y - 50} ${x + 32} ${y - 44} L${x + 18} ${y - 26} L${x + 28} ${y - 16} L${x + 46} ${y - 30} Q${x + 50} ${y - 8} ${x + 30} ${y - 4}`
    : kind === 'team' ? `${person(x - 30, y - 18, .85)} ${person(x + 30, y - 18, .85)}`
    : kind === 'zoom' ? `${circlePath(x - 8, y - 8, 28, 28)} M${x + 12} ${y + 12} L${x + 38} ${y + 38}`
    : `M${x} ${y + 34} Q${x - 50} ${y} ${x - 40} ${y - 22} Q${x - 26} ${y - 46} ${x} ${y - 20} Q${x + 26} ${y - 46} ${x + 40} ${y - 22} Q${x + 50} ${y} ${x} ${y + 34} Z`;
  const eyes = EO(clamp((f - 1098) / 14));
  return <Board h={height} id="rough32c" f={f}>
    <g transform={`translate(0 ${dy})`}>
      <Scene f={f} from={364} to={934}>
        {/* waterline */}
        <P f={f} at={362} len={18} d="M60 380 Q120 365 180 380 T300 380 T420 380 T540 380 T660 380 T780 380 T900 380 T1020 380" c={INK} w={4} />
        {/* the tip: the price */}
        <P f={f} at={366} len={12} d="M430 380 L520 210 L560 240 L640 380" w={7} />
        <T f={f} at={372} x={535} y={350} size={72}>$</T>
        {/* the hidden value */}
        <P f={f} at={428} len={24} d="M360 380 L230 560 L330 740 H760 L880 560 L720 380" c={INK} w={5} dash />
        {f >= 428 && <path d="M360 380 L230 560 L330 740 H760 L880 560 L720 380 Z" fill="none" stroke={INK} strokeWidth={5} strokeDasharray="16 12" opacity={k(f, 428, 10)} />}
        {icons.map(([at, kind, x, y], i) => <P key={i} f={f} at={at} len={12} d={icon(kind, x, y)} c={RED} w={5} />)}
        {/* the homeowner only sees the tip */}
        {murk > 0 && <path d="M40 382 H1040 V760 H40 Z" fill={`rgba(70,78,92,${.88 * murk})`} />}
        <P f={f} at={893} len={12} d={circlePath(535, 310, 120, 110)} w={6} />
      </Scene>
      <Scene f={f} from={930} to={1160}>
        {/* the page */}
        <P f={f} at={930} len={16} d={rect(150, 120, 780, 620, 16)} c={INK} w={5} />
        <P f={f} at={936} len={12} d="M210 190 H560 M210 230 H460" c={INK} w={4} />
        {/* you vs the next contractor: just two numbers */}
        <P f={f} at={938} len={14} d={tag(370, 430, 300, 150)} c={INK} w={6} />
        <T f={f} at={946} x={350} y={460} size={80} c={INK}>$$$</T>
        <P f={f} at={1001} len={14} d={tag(720, 430, 300, 150)} w={6} />
        <T f={f} at={1009} x={700} y={462} size={86}>$</T>
        {/* attention piles onto the cheapest */}
        {[[560, 680], [900, 680], [920, 220]].map(([x, y], i) => <g key={i} opacity={eyes}>
          <line x1={x + (720 - x) * .15} y1={y + (430 - y) * .15} x2={x + (720 - x) * (.15 + .45 * eyes)} y2={y + (430 - y) * (.15 + .45 * eyes)} stroke={RED} strokeWidth={6} strokeLinecap="round" />
        </g>)}
        {[[560, 680], [900, 680], [920, 220]].map(([x, y], i) => <g key={`e${i}`} opacity={eyes}><ellipse cx={x} cy={y} rx={30} ry={18} fill="none" stroke={INK} strokeWidth={4} /><circle cx={x} cy={y} r={7} fill={INK} /></g>)}
      </Scene>
    </g>
  </Board>;
};
