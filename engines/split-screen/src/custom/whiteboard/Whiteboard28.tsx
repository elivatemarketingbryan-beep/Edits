import React from 'react';
import {clamp} from '../../motion';
import type {VisualProps} from '../../types';
import {RED, INK, PAPER, EO, k, P, T, Dot, circlePath, Scene} from './Whiteboard26';

// video28 ("good at the work, still struggling"), whiteboard style. Cues are source frames (no trim);
// `offset` is the beat start. Diagrams stay in y 60-740; ink captions sit at y ~826.

const house = (x: number, y: number, s = 1) => `M${x - 50 * s} ${y} V${y - 60 * s} L${x} ${y - 105 * s} L${x + 50 * s} ${y - 60 * s} V${y} Z`;
const person = (x: number, y: number, s = 1) => `${circlePath(x, y, 16 * s, 16 * s)} M${x - 24 * s} ${y + 46 * s} Q${x} ${y + 12 * s} ${x + 24 * s} ${y + 46 * s}`;

export const Whiteboard28: React.FC<VisualProps> = ({beat, frame}) => {
  const f = frame + ((beat.visual as {props?: {offset?: number}}).props?.offset ?? 0);
  const seed = Math.floor(f / 4) % 6;
  // S2 the lost dot wanders the maze
  // Cell centres on a 120 px grid; every leg runs down an open corridor (no wall crossings). It wanders, hits a dead end, turns back.
  const path: Array<[number, number]> = [[300, 220], [300, 460], [420, 460], [420, 340], [780, 340], [780, 220], [660, 220], [780, 220], [780, 340], [660, 340]];
  const mt = clamp((f - 500) / 140) * (path.length - 1), mi = Math.min(path.length - 2, Math.floor(mt)), mf = mt - mi;
  const dot = [path[mi][0] + (path[mi + 1][0] - path[mi][0]) * mf, path[mi][1] + (path[mi + 1][1] - path[mi][1]) * mf];
  // S5 calendar: 14 days, only two booked
  const booked = [1, 4, 11];
  const grey = k(f, 1202, 12);
  // S7 scale tilt settles level
  const tilt = 14 * (1 - EO(clamp((f - 1821) / 30)));
  return <div style={{position: 'absolute', inset: 0, background: PAPER, overflow: 'hidden'}}>
    <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 40%, rgba(255,255,255,.9), rgba(0,0,0,.05) 100%)'}} />
    <svg viewBox="0 0 1080 960" width={1080} height={960} style={{position: 'absolute', inset: 0}}>
      <defs><filter id="rough28"><feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves={2} seed={seed} /><feDisplacementMap in="SourceGraphic" scale={4} /></filter></defs>
      <g filter="url(#rough28)">

        {/* S1 years of investment along a timeline */}
        <Scene f={f} from={239} to={445}>
          <P f={f} at={245} len={30} d="M80 470 H1000 M975 450 L1002 470 L975 490" c={INK} w={5} />
          {[180, 300, 420, 540, 660, 780, 900].map((x, i) => <P key={i} f={f} at={250 + i * 3} len={6} d={`M${x} 455 V485`} c={INK} w={4} />)}
          <T f={f} at={264} x={1000} y={540} size={30} c={INK} anchor="end">YEARS →</T>
          {/* book */}
          <P f={f} at={275} d="M140 380 V300 Q180 285 220 300 Q260 285 300 300 V380 Q260 365 220 380 Q180 365 140 380 Z M220 300 V380" w={5} />
          <T f={f} at={280} x={220} y={260} size={38}>TRAINING</T>
          {/* skill climbs */}
          <P f={f} at={329} d="M380 390 L430 340 L460 360 L520 290 M495 290 H520 V315" w={6} />
          <T f={f} at={334} x={450} y={260} size={38}>SKILL ↑</T>
          {/* truck */}
          <P f={f} at={369} d="M590 390 V320 H690 V390 M690 340 H735 L760 370 V390 Z M590 390 H760" w={5} />
          <Dot f={f} at={378} x={620} y={395} r={14} c={INK} />
          <Dot f={f} at={380} x={730} y={395} r={14} c={INK} />
          <T f={f} at={374} x={675} y={260} size={38}>GEAR</T>
          {/* five stars */}
          {[0, 1, 2, 3, 4].map(i => <T key={i} f={f} at={399 + i * 3} x={830 + i * 36} y={370} size={40}>★</T>)}
          <T f={f} at={404} x={900} y={260} size={38}>5-STAR</T>
          <T f={f} at={430} x={540} y={620} size={40} c={INK}>✓ ✓ ✓ ✓</T>
        </Scene>

        {/* S2 getting found: a maze with no map */}
        <Scene f={f} from={445} to={643}>
          <P f={f} at={448} len={30} d="M240 160 H840 V640 H240 Z" c={INK} w={6} />
          <P f={f} at={460} len={30} d="M360 160 V400 M240 520 H480 V400 M600 160 V280 H720 M480 280 V160 M720 400 V640 M600 400 H840 M360 640 V580" c={INK} w={6} />
          <circle cx={dot[0]} cy={dot[1]} r={18} fill={RED} opacity={k(f, 495, 8)} />
          <P f={f} at={590} len={14} d={circlePath(540, 220, 40, 40)} w={5} />
          <T f={f} at={600} x={880} y={420} size={50} anchor="start">NO</T>
          <T f={f} at={604} x={880} y={475} size={50} anchor="start">MAP</T>
        </Scene>

        {/* S3 seen it firsthand: a framed picture of dad's place */}
        <Scene f={f} from={643} to={779}>
          <P f={f} at={668} len={22} d="M330 140 H750 V620 H330 Z M355 165 H725 V595 H355 Z" c={INK} w={5} />
          <P f={f} at={690} d={house(470, 520, 1.1)} w={6} />
          <P f={f} at={700} d={person(620, 430, 1.4)} c={INK} w={5} />
          <P f={f} at={708} d={person(680, 465, 1)} c={INK} w={5} />
          <T f={f} at={756} x={540} y={700} size={44}>DAD'S SHOP</T>
        </Scene>

        {/* S4 craft ≠ business: two circles that don't touch */}
        <Scene f={f} from={779} to={986}>
          <P f={f} at={829} len={20} d={circlePath(270, 400, 190, 190)} c={INK} w={6} />
          <P f={f} at={840} d="M200 470 L300 370 M270 335 L340 405 M255 350 L285 320 L355 390 L325 420" w={8} />
          <P f={f} at={875} len={20} d={circlePath(810, 400, 190, 190)} c={INK} w={6} />
          <P f={f} at={890} d="M700 480 L770 420 L820 450 L910 340 M880 340 H910 V370" w={8} />
          <T f={f} at={933} x={540} y={440} size={150}>≠</T>
        </Scene>

        {/* S5 any trade, empty calendar */}
        <Scene f={f} from={986} to={1329}>
          <g opacity={1 - .75 * grey}>
            {/* roof */}
            <P f={f} at={1047} d="M110 330 L210 230 L310 330 M140 300 V380 H280 V300" w={6} />
            {/* paint roller */}
            <P f={f} at={1066} d="M380 240 H520 V290 H380 Z M520 265 H545 V320 H450 V380" w={6} />
            {/* saw */}
            <P f={f} at={1113} d="M600 330 L760 270 L780 300 L620 360 Z M760 270 L800 240 L820 270 L780 300" w={6} />
            {/* wrench */}
            <P f={f} at={1145} d="M880 380 L960 300 M950 280 Q990 260 990 300 Q970 320 960 300" w={8} />
          </g>
          <P f={f} at={1200} len={10} d="M60 420 H1020" c={INK} w={2} dash />
          {/* calendar */}
          <P f={f} at={1240} len={16} d="M260 460 H820 V740 H260 Z M260 510 H820" c={INK} w={5} />
          {Array.from({length: 14}, (_, i) => { const x = 260 + (i % 7) * 80, y = 510 + Math.floor(i / 7) * 115; const at = 1250 + i * 2;
            return <g key={i} opacity={k(f, at, 6)}>
              <rect x={x + 6} y={y + 8} width={68} height={100} fill={booked.includes(i) ? RED : 'none'} stroke={INK} strokeWidth={2} opacity={booked.includes(i) ? 1 : .35} />
            </g>; })}
        </Scene>

        {/* S6 why: care, and no pressure to spend */}
        <Scene f={f} from={1329} to={1596}>
          <P f={f} at={1362} len={20} d="M300 470 C 160 370, 180 230, 300 290 C 420 230, 440 370, 300 470 Z" w={8} />
          <P f={f} at={1523} len={14} d={circlePath(760, 360, 130, 130)} c={INK} w={6} />
          <T f={f} at={1525} x={760} y={410} size={150} c={INK}>$</T>
          <P f={f} at={1546} len={10} d="M660 260 L860 460" w={12} />
          <T f={f} at={1554} x={760} y={590} size={42}>NO PRESSURE</T>
        </Scene>

        {/* S7 spotlight on the good ones */}
        <Scene f={f} from={1596} to={1745}>
          <P f={f} at={1598} d={house(540, 640, 1.3)} c={INK} w={6} />
          <T f={f} at={1626} x={540} y={600} size={60}>★</T>
          {f >= 1699 && <path d="M500 80 L330 640 H750 L580 80 Z" fill="rgba(224,36,27,.10)" opacity={k(f, 1699, 10)} />}
          <P f={f} at={1699} len={14} d="M500 80 L330 640 M580 80 L750 640" w={5} />
          {[150, 250, 830, 930, 200, 880].map((x, i) => <P key={i} f={f} at={1707 + i * 3} len={8} d={person(x, i > 3 ? 560 : 470, 1.2)} c={INK} w={5} />)}
          <P f={f} at={1600} len={14} d="M120 640 H960" c={INK} w={4} />
        </Scene>

        {/* S7b quality alone shouldn't decide it: the scale levels out */}
        <Scene f={f} from={1745} to={1900}>
          <P f={f} at={1748} len={14} d="M540 700 V260 M470 700 H610" c={INK} w={6} />
          <g transform={`rotate(${-tilt} 540 260)`} opacity={k(f, 1752, 8)}>
            <line x1={260} y1={260} x2={820} y2={260} stroke={INK} strokeWidth={6} strokeLinecap="round" />
            <path d="M260 260 L200 420 H320 Z M820 260 L760 420 H880 Z" fill="none" stroke={INK} strokeWidth={4} />
            <text x={260} y={405} fontSize={60} fill={RED} textAnchor="middle">★</text>
            {f >= 1821 && <g opacity={k(f, 1821, 8)}><path d={`M780 395 Q820 360 860 395 Q820 430 780 395 Z`} fill="none" stroke={RED} strokeWidth={5} /><circle cx={820} cy={395} r={10} fill={RED} /></g>}
          </g>
          <T f={f} at={1830} x={540} y={200} size={46}>BOTH</T>
        </Scene>
      </g>
    </svg>
  </div>;
};
