import React from 'react';
import {clamp} from '../../motion';
import type {VisualProps} from '../../types';
import {RED, INK, PAPER, EO, k, P, T, Dot, circlePath, Scene} from './Whiteboard26';

// video27 ("why I started Elevate Marketing"), whiteboard style. Diagrams live in y 60-740 of the
// 1080 x 960 panel; ink captions sit at y ~826 below them. Labels avoid the words being spoken.

const house = (x: number, y: number, s = 1) => `M${x - 50 * s} ${y} V${y - 60 * s} L${x} ${y - 105 * s} L${x + 50 * s} ${y - 60 * s} V${y} Z`;

export const Whiteboard27: React.FC<VisualProps> = ({beat, frame}) => {
  const f = frame + ((beat.visual as {props?: {offset?: number}}).props?.offset ?? 0);
  const seed = Math.floor(f / 4) % 6;
  // S1 feast/famine line
  const jag = 'M90 430 L190 300 L270 560 L370 250 L450 600 L560 330 L640 590 L740 380';
  // S4 people the contractor reaches
  const crowd = Array.from({length: 9}, (_, i) => { const a = -Math.PI / 2.6 + (i / 8) * (Math.PI / 1.3); return {x: 330 + 520 * Math.cos(a) * (i % 2 ? .78 : 1), y: 420 + 300 * Math.sin(a) * (i % 2 ? .78 : 1), at: 1290 + i * 4}; });
  return <div style={{position: 'absolute', inset: 0, background: PAPER, overflow: 'hidden'}}>
    <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 40%, rgba(255,255,255,.9), rgba(0,0,0,.05) 100%)'}} />
    <svg viewBox="0 0 1080 960" width={1080} height={960} style={{position: 'absolute', inset: 0}}>
      <defs><filter id="rough27"><feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves={2} seed={seed} /><feDisplacementMap in="SourceGraphic" scale={4} /></filter></defs>
      <g filter="url(#rough27)">

        {/* S1 dad's shop: busy, slow, busy, slow… then where's the next one */}
        <Scene f={f} from={118} to={422}>
          <P f={f} at={134} d={house(150, 200, .8)} c={INK} w={5} />
          <P f={f} at={142} len={10} d="M135 200 V160 H165 V200" c={INK} w={4} />
          <T f={f} at={146} x={230} y={160} size={40} c={INK} anchor="start">DAD'S SHOP</T>
          <P f={f} at={175} len={70} d={jag} w={7} />
          <T f={f} at={196} x={370} y={225} size={36}>BUSY</T>
          <T f={f} at={226} x={450} y={660} size={36} c={INK}>SLOW</T>
          <P f={f} at={300} len={20} d="M760 400 H900" c={INK} w={5} dash />
          <T f={f} at={366} x={960} y={450} size={190}>?</T>
        </Scene>

        {/* S2 skill ✓ quality ✓ care ✓ … found? ✗ */}
        <Scene f={f} from={422} to={681}>
          {/* hammer */}
          <P f={f} at={440} d="M140 330 L250 220 M215 185 L285 255 M200 200 L230 170 L300 240 L270 270" c={INK} w={7} />
          <P f={f} at={452} len={10} d="M150 400 L185 435 L245 365" w={9} />
          {/* star */}
          <P f={f} at={502} d="M540 160 L568 230 L640 232 L583 276 L604 346 L540 304 L476 346 L497 276 L440 232 L512 230 Z" c={INK} w={6} />
          <P f={f} at={514} len={10} d="M480 400 L515 435 L575 365" w={9} />
          {/* heart */}
          <P f={f} at={555} d="M860 340 C 760 270, 780 180, 860 220 C 940 180, 960 270, 860 340 Z" c={INK} w={6} />
          <P f={f} at={567} len={10} d="M800 400 L835 435 L895 365" w={9} />
          <P f={f} at={604} len={14} d="M100 500 H980" c={INK} w={3} dash />
          {/* magnifier, nobody in it */}
          <P f={f} at={632} d={circlePath(470, 630, 70, 70)} c={INK} w={7} />
          <P f={f} at={640} len={8} d="M520 680 L570 730" c={INK} w={12} />
          <P f={f} at={657} len={8} d="M640 580 L720 680 M720 580 L640 680" w={11} />
          <T f={f} at={664} x={760} y={655} size={52} anchor="start">FOUND?</T>
        </Scene>

        {/* S3 a whole street of contractors; craft is full, getting seen is empty */}
        <Scene f={f} from={681} to={787}>
          {[150, 280, 410, 540, 670, 800, 930].map((x, i) => <P key={i} f={f} at={703 + i * 4} len={12} d={house(x, 520, .9)} c={i === 3 ? RED : INK} w={5} />)}
          <P f={f} at={705} len={22} d="M70 520 H1010" c={INK} w={4} />
        </Scene>
        <Scene f={f} from={787} to={1073}>
          <T f={f} at={792} x={90} y={150} size={38} c={INK} anchor="start">THE CRAFT</T>
          <P f={f} at={792} len={10} d="M90 180 H990 V250 H90 Z" c={INK} w={4} />
          {f >= 803 && <rect x={96} y={186} width={888 * EO(clamp((f - 803) / 24))} height={58} fill={INK} />}
          <T f={f} at={850} x={90} y={340} size={38} c={INK} anchor="start">GETTING SEEN</T>
          <P f={f} at={850} len={10} d="M90 370 H990 V440 H90 Z" c={INK} w={4} />
          {f >= 870 && <rect x={96} y={376} width={70 * EO(clamp((f - 870) / 14))} height={58} fill={RED} />}
          <T f={f} at={901} x={260} y={428} size={48}>?</T>
          {/* steady flow of leads */}
          <P f={f} at={958} len={20} d="M90 640 H470" c={INK} w={4} />
          {[120, 200, 280, 360, 440].map((x, i) => <Dot key={i} f={f} at={962 + i * 4} x={x} y={640} r={14} />)}
          <T f={f} at={977} x={280} y={720} size={36}>STEADY</T>
          {/* system gear */}
          <P f={f} at={1000} d={circlePath(780, 630, 55, 55)} c={INK} w={6} />
          <P f={f} at={1004} len={10} d={Array.from({length: 8}, (_, i) => { const a = i * Math.PI / 4 + f / 20; return `M${780 + 55 * Math.cos(a)} ${630 + 55 * Math.sin(a)} L${780 + 78 * Math.cos(a)} ${630 + 78 * Math.sin(a)}`; }).join(' ')} c={INK} w={8} />
          <T f={f} at={1014} x={780} y={740} size={36}>AUTOPILOT</T>
        </Scene>

        {/* S4 learn it, then put contractors in front of people */}
        <Scene f={f} from={1073} to={1244}>
          <P f={f} at={1150} len={22} d="M480 330 C 400 300, 400 160, 540 150 C 680 160, 680 300, 600 330 V380 H480 Z" c={INK} w={6} />
          <P f={f} at={1160} len={10} d="M490 410 H590 M505 440 H575" c={INK} w={5} />
          {[[-1, -1], [0, -1.3], [1, -1], [-1.3, 0], [1.3, 0]].map(([dx, dy], i) => <P key={i} f={f} at={1204 + i * 2} len={8} d={`M${540 + dx * 130} ${240 + dy * 70} L${540 + dx * 165} ${240 + dy * 95}`} w={6} />)}
        </Scene>
        <Scene f={f} from={1240} to={1372}>
          <P f={f} at={1244} d={house(170, 470, 1)} w={6} fill={PAPER} />
          {crowd.map((p, i) => <g key={i}>
            <P f={f} at={p.at - 6} len={12} d={`M230 420 L${p.x - 30} ${p.y}`} c={INK} w={3} dash />
            <Dot f={f} at={p.at} x={p.x} y={p.y - 18} r={16} c={INK} />
            <P f={f} at={p.at + 2} len={8} d={`M${p.x - 22} ${p.y + 22} Q${p.x} ${p.y - 6} ${p.x + 22} ${p.y + 22}`} c={INK} w={5} />
          </g>)}
          <T f={f} at={1300} x={170} y={560} size={44}>REACH</T>
        </Scene>

        {/* S5 not overnight: the spike gets crossed, the stairs get drawn */}
        <Scene f={f} from={1372} to={1545}>
          <P f={f} at={1380} len={18} d="M120 120 V720 H980" c={INK} w={5} />
          <P f={f} at={1483} len={10} d="M140 700 H300 L320 140" c={INK} w={6} />
          <P f={f} at={1518} len={8} d="M230 200 L420 420 M420 200 L230 420" w={11} />
          <P f={f} at={1525} len={18} d="M500 700 H580 V600 H660 V500 H740 V400 H820 V300 H900 V200" w={8} />
          <T f={f} at={1530} x={700} y={160} size={46}>STEP BY STEP</T>
        </Scene>

        {/* S6 good work on one side, customers on the other; a bridge closes the gap */}
        <Scene f={f} from={1545} to={1910}>
          <P f={f} at={1550} len={16} d="M60 460 H360 V740" c={INK} w={6} />
          <P f={f} at={1556} len={16} d="M1020 460 H720 V740" c={INK} w={6} />
          {[0, 1, 2, 3, 4, 5].map(i => { const at = 1580 + i * 7, x = 110 + (i % 3) * 80, y = 440 - Math.floor(i / 3) * 56; return f >= at ? <rect key={i} x={x} y={y - 50 + (1 - EO(clamp((f - at) / 8))) * -40} width={72} height={48} fill="none" stroke={INK} strokeWidth={5} opacity={k(f, at, 6)} /> : null; })}
          <T f={f} at={1717} x={210} y={300} size={40} c={INK}>GOOD WORK</T>
          {[780, 860, 940].map((x, i) => <g key={i}>
            <Dot f={f} at={1640 + i * 5} x={x} y={400} r={18} c={INK} />
            <P f={f} at={1644 + i * 5} len={8} d={`M${x - 26} ${458} Q${x} ${420} ${x + 26} ${458}`} c={INK} w={5} />
          </g>)}
          <T f={f} at={1659} x={860} y={300} size={40} c={INK}>CUSTOMERS</T>
          <g opacity={1 - k(f, 1866, 8)}><P f={f} at={1776} len={16} d="M440 400 Q 540 470 560 640 M535 610 L560 645 L585 610" c={INK} w={5} /></g>
          <P f={f} at={1874} len={16} d="M360 460 Q 540 380 720 460 M360 460 H720 M420 445 V460 M480 425 V460 M540 418 V460 M600 425 V460 M660 445 V460" w={8} />
          <T f={f} at={1880} x={540} y={340} size={44}>VISIBILITY</T>
        </Scene>
      </g>
    </svg>
  </div>;
};
