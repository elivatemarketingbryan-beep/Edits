import React from 'react';
import {Easing} from 'remotion';
import {clamp} from '../../motion';
import type {VisualProps} from '../../types';

// Whiteboard style (ref: raoulplickat reel): off-white top panel, thin red lines that draw on as he
// speaks, bold red all-caps labels, timelines read left to right. Labels never repeat the spoken words.
// Panel is 1080 x 960; `offset` converts the beat-local frame to the source frame used for all cues.

export const RED = '#E0241B', INK = '#1B1B1B', PAPER = '#F7F5F0', FONT = 'Inter, "Segoe UI", Arial, sans-serif';
export const EO = Easing.bezier(0.23, 1, 0.32, 1), EIO = Easing.bezier(0.77, 0, 0.175, 1);
export const k = (f: number, at: number, len = 14) => EO(clamp((f - at) / len));
export const dr = (f: number, at: number, len = 18) => EIO(clamp((f - at) / len));

/* A stroke that draws itself on. */
export const P: React.FC<{d: string; f: number; at: number; len?: number; c?: string; w?: number; fill?: string; dash?: boolean}> = ({d, f, at, len = 18, c = RED, w = 6, fill = 'none', dash}) => {
  const p = dr(f, at, len);
  if (p <= 0) return null;
  return <path d={d} pathLength={1} fill={fill} stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round"
    strokeDasharray={dash ? undefined : '1 1'} strokeDashoffset={dash ? undefined : 1 - p} opacity={dash ? p : 1} />;
};
/* Bold caps label that wipes in left to right. */
export const T: React.FC<{f: number; at: number; x: number; y: number; size?: number; c?: string; anchor?: 'start' | 'middle' | 'end'; children: React.ReactNode}> = ({f, at, x, y, size = 46, c = RED, anchor = 'middle', children}) => {
  const p = k(f, at, 12);
  if (p <= 0) return null;
  return <text x={x} y={y + (1 - p) * 10} fontSize={size} fontWeight={900} fill={c} textAnchor={anchor} letterSpacing={1.5} opacity={p} style={{fontFamily: FONT}}>{children}</text>;
};
export const Dot: React.FC<{f: number; at: number; x: number; y: number; r?: number; c?: string}> = ({f, at, x, y, r = 14, c = RED}) => {
  const t = clamp((f - at) / 8), s = t <= 0 ? 0 : .6 + .4 * EO(t) + .12 * Math.sin(t * Math.PI);
  return s ? <circle cx={x} cy={y} r={r * s} fill={c} /> : null;
};
export const circlePath = (cx: number, cy: number, rx: number, ry: number) => `M${cx + rx} ${cy} A${rx} ${ry} 0 1 1 ${cx + rx - .1} ${cy - 6}`;

/* Scene window: fades in, wipes out (8 frames) before the next idea. */
export const Scene: React.FC<{f: number; from: number; to: number; children: React.ReactNode}> = ({f, from, to, children}) => {
  if (f < from - 1 || f > to + 1) return null;
  const out = EIO(clamp((f - (to - 8)) / 8));
  return <g opacity={1 - out} transform={`translate(0 ${-out * 30})`}>{children}</g>;
};

export const Whiteboard26: React.FC<VisualProps> = ({beat, frame}) => {
  const f = frame + ((beat.visual as {props?: {offset?: number}}).props?.offset ?? 0);
  const seed = Math.floor(f / 4) % 6; // line "boil" so strokes feel hand drawn
  // S3: diagnostic ticks
  const ticks = [[150, 506, 'JUST A BOOST?'], [345, 655, 'RIGHT HOMES?'], [540, 721, 'FILTERED?'], [735, 778, 'A REASON?'], [930, 847, 'FAST REPLY?']] as const;
  const reached = ticks.reduce((a, [x, at]) => (f >= at ? x : a), 90);
  // S7: dots dropping through the funnel
  const drops = Array.from({length: 14}, (_, i) => i);
  // S8: faders
  const fader = (at: number, up: number) => 640 - up * dr(f, at, 22) + 40 * Math.sin(Math.min(1, clamp((f - at) / 22)) * Math.PI);
  return <div style={{position: 'absolute', inset: 0, background: PAPER, overflow: 'hidden'}}>
    <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 40%, rgba(255,255,255,.9), rgba(0,0,0,.05) 100%)'}} />
    <svg viewBox="0 0 1080 960" width={1080} height={960} style={{position: 'absolute', inset: 0}}>
      <defs><filter id="rough"><feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves={2} seed={seed} /><feDisplacementMap in="SourceGraphic" scale={4} /></filter></defs>
      <g filter="url(#rough)">

        {/* S1 spend climbs, jobs stay flat */}
        <Scene f={f} from={212} to={328}>
          <P f={f} at={214} d="M160 160 V800 H960" c={INK} w={5} />
          <P f={f} at={234} len={26} d="M170 790 C 360 700, 520 520, 900 250" w={7} />
          <T f={f} at={252} x={900} y={220}>SPEND ↑</T>
          <P f={f} at={268} len={22} d="M170 780 H 900" c={INK} w={5} />
          <T f={f} at={284} x={900} y={750} c={INK}>JOBS: 0</T>
        </Scene>

        {/* S2 put the ad under the magnifier */}
        <Scene f={f} from={328} to={500}>
          <P f={f} at={330} len={22} d="M360 170 H720 Q740 170 740 190 V770 Q740 790 720 790 H360 Q340 790 340 770 V190 Q340 170 360 170 Z" c={INK} w={5} />
          <P f={f} at={346} d="M380 520 V320 L540 230 L700 320 V520 Z" c={INK} w={4} />
          <P f={f} at={352} d="M500 520 V430 H580 V520" c={INK} w={4} />
          <P f={f} at={360} d="M380 580 H700 M380 625 H620" c={INK} w={4} />
          <P f={f} at={366} d="M380 690 H700 V745 H380 Z" w={5} />
          {(() => { const t = EIO(clamp((f - 392) / 70)), x = 300 + 480 * t, y = 330 + 160 * Math.sin(t * Math.PI); return f >= 386 ? <g opacity={k(f, 386, 8)}>
            <circle cx={x} cy={y} r={105} fill="rgba(224,36,27,.06)" stroke={RED} strokeWidth={8} />
            <line x1={x + 74} y1={y + 74} x2={x + 160} y2={y + 160} stroke={RED} strokeWidth={16} strokeLinecap="round" />
          </g> : null; })()}
          <T f={f} at={430} x={540} y={120} size={60}>AUDIT IT</T>
        </Scene>

        {/* S3 five checks along a left-to-right line */}
        <Scene f={f} from={500} to={973}>
          <T f={f} at={502} x={90} y={150} size={34} c={INK} anchor="start">5 CHECKS</T>
          <P f={f} at={502} len={20} d="M90 480 H990" c={INK} w={5} />
          {f >= 506 && <line x1={90} y1={480} x2={90 + (reached - 90) * 1} y2={480} stroke={RED} strokeWidth={9} strokeLinecap="round" />}
          {ticks.map(([x, at, lab], i) => <g key={i}>
            <P f={f} at={504 + i * 3} len={8} d={`M${x} 455 V505`} c={INK} w={5} />
            <Dot f={f} at={at} x={x} y={480} r={16} />
            <T f={f} at={at} x={x} y={i % 2 ? 590 : 400} size={36}>{lab}</T>
            <T f={f} at={504 + i * 3} x={x} y={i % 2 ? 420 : 560} size={28} c={INK}>{`${i + 1}`}</T>
          </g>)}
        </Scene>

        {/* S4 the boost is the tip, the rest is under water */}
        <Scene f={f} from={973} to={1103}>
          <P f={f} at={975} len={20} d="M60 380 Q 150 360 240 380 T 420 380 T 600 380 T 780 380 T 960 380 T 1040 380" c={INK} w={5} />
          <P f={f} at={985} len={16} d="M470 380 L540 250 L610 380" w={7} />
          <P f={f} at={1000} len={28} d="M470 380 L300 600 L380 860 L700 880 L820 620 L610 380" c={INK} w={5} dash />
          <T f={f} at={990} x={540} y={220} size={44}>BOOST</T>
          <T f={f} at={1011} x={560} y={660} size={46} c={INK}>EVERYTHING</T>
          <T f={f} at={1016} x={560} y={715} size={46} c={INK}>ELSE</T>
        </Scene>

        {/* S5 four pieces add up */}
        <Scene f={f} from={1103} to={1258}>
          {/* message: speech bubble */}
          <P f={f} at={1115} d="M100 360 H240 Q260 360 260 380 V460 Q260 480 240 480 H160 L120 520 V480 H100 Q80 480 80 460 V380 Q80 360 100 360 Z" w={6} />
          <P f={f} at={1120} len={10} d="M120 405 H220 M120 440 H190" c={INK} w={4} />
          <T f={f} at={1112} x={293} y={445} size={60} c={INK}>+</T>
          {/* audience: person */}
          <P f={f} at={1149} d={circlePath(417, 380, 36, 36)} w={6} />
          <P f={f} at={1153} d="M352 510 Q352 430 417 430 Q482 430 482 510" w={6} />
          <T f={f} at={1146} x={540} y={445} size={60} c={INK}>+</T>
          {/* offer: tag */}
          <P f={f} at={1183} d="M600 370 H700 L740 430 L700 490 H600 Z" w={6} />
          <P f={f} at={1187} len={8} d={circlePath(700, 430, 9, 9)} c={INK} w={4} />
          <T f={f} at={1180} x={787} y={445} size={60} c={INK}>+</T>
          {/* process: gear */}
          <P f={f} at={1221} d={circlePath(910, 430, 50, 50)} w={6} />
          <P f={f} at={1225} len={10} d={Array.from({length: 8}, (_, i) => { const a = i * Math.PI / 4; return `M${910 + 50 * Math.cos(a)} ${430 + 50 * Math.sin(a)} L${910 + 72 * Math.cos(a)} ${430 + 72 * Math.sin(a)}`; }).join(' ')} w={7} />
          <P f={f} at={1232} len={18} d="M90 600 Q90 640 140 640 H500 Q540 640 540 690 Q540 640 580 640 H940 Q990 640 990 600" c={INK} w={5} />
          <T f={f} at={1240} x={540} y={770} size={52}>ALL FOUR</T>
        </Scene>

        {/* S6 lead → quote → paid, along a timeline */}
        <Scene f={f} from={1258} to={1413}>
          <P f={f} at={1258} len={30} d="M80 460 H1000" c={INK} w={4} />
          {[130, 260, 390, 520, 650, 780, 910].map((x, i) => <P key={i} f={f} at={1260 + i * 3} len={6} d={`M${x} 448 V472`} c={INK} w={3} />)}
          <P f={f} at={1262} d={circlePath(180, 460, 55, 55)} w={6} fill={PAPER} />
          <Dot f={f} at={1268} x={180} y={460} r={16} />
          <P f={f} at={1290} len={20} d="M250 460 H440 M420 440 L445 460 L420 480" w={7} />
          <P f={f} at={1315} d="M490 395 H570 L600 425 V525 H490 Z" w={6} fill={PAPER} />
          <P f={f} at={1322} len={10} d="M510 445 H575 M510 475 H575 M510 505 H555" c={INK} w={4} />
          <P f={f} at={1336} len={20} d="M640 460 H820 M800 440 L825 460 L800 480" w={7} />
          <P f={f} at={1359} d="M850 520 V445 L900 400 L950 445 V520 Z" w={6} fill={PAPER} />
          <T f={f} at={1365} x={900} y={505} size={44}>$</T>
          <T f={f} at={1268} x={180} y={600} size={40}>LEAD</T>
          <T f={f} at={1320} x={545} y={600} size={40}>QUOTE</T>
          <T f={f} at={1366} x={900} y={600} size={40}>PAID</T>
        </Scene>

        {/* S7 a funnel: plenty in the top, few out the bottom */}
        <Scene f={f} from={1413} to={1663}>
          <P f={f} at={1415} len={24} d="M220 220 H860 L600 560 V780 H480 V560 Z" c={INK} w={6} />
          {drops.map(i => { const at = 1460 + i * 6, t = clamp((f - at) / 34); if (t <= 0 || t >= 1) return null;
            const bad = f >= 1532 && i % 3 !== 0, x0 = 280 + (i * 97) % 520, y = 160 + 420 * EIO(t), x = x0 + (540 - x0) * EIO(clamp((t - .3) / .7));
            return <circle key={i} cx={x} cy={y} r={14} fill={bad ? '#BDBDBD' : INK} opacity={bad && t > .7 ? 1 - (t - .7) / .3 : 1} />; })}
          {[0, 1, 2].map(i => { const t = clamp((f - 1590 - i * 16) / 26); return t > 0 ? <circle key={i} cx={540} cy={790 + 120 * EO(t)} r={16} fill={RED} opacity={1 - clamp((t - .85) / .15)} /> : null; })}
          <P f={f} at={1601} len={18} d={circlePath(540, 610, 150, 110)} w={7} />
          <T f={f} at={1612} x={800} y={640} size={48} anchor="start">LEAK?</T>
        </Scene>

        {/* S8 three faders get tuned */}
        <Scene f={f} from={1663} to={1947}>
          <T f={f} at={1700} x={540} y={130} size={56}>TUNE IT</T>
          {[[270, 1767, 260], [540, 1834, 180], [810, 1887, 300]].map(([x, at, up], i) => <g key={i}>
            <P f={f} at={1666 + i * 5} len={16} d={`M${x} 300 V760`} c={INK} w={5} />
            {[340, 430, 520, 610, 700].map((y, j) => <P key={j} f={f} at={1672 + i * 5} len={6} d={`M${x - 26} ${y} H${x - 12}`} c={INK} w={3} />)}
            {f >= 1680 + i * 5 && <rect x={x - 46} y={fader(at, up) - 20} width={92} height={40} rx={10} fill={f >= at ? RED : INK} opacity={k(f, 1680 + i * 5, 8)} />}
          </g>)}
          {/* icons: picture, tag, crosshair */}
          <P f={f} at={1767} d="M220 820 H320 V900 H220 Z M228 892 L262 852 L290 880 L304 866 L318 892" w={5} />
          <P f={f} at={1834} d="M500 820 H560 L590 860 L560 900 H500 Z" w={5} />
          <P f={f} at={1887} d={`${circlePath(810, 860, 38, 38)} M810 806 V836 M810 884 V914 M756 860 H786 M834 860 H864`} w={5} />
        </Scene>

        {/* S9 the process line, broken in one place */}
        <Scene f={f} from={1947} to={2130}>
          <P f={f} at={1950} len={14} d="M100 470 H330" c={INK} w={6} />
          <P f={f} at={1962} len={14} d="M330 470 H520 L540 445" c={INK} w={6} />
          <P f={f} at={1976} len={14} d="M600 495 L620 470 H760" c={INK} w={6} />
          <P f={f} at={1988} len={14} d="M760 470 H990" c={INK} w={6} />
          {[[100, 1950, 'AD'], [330, 1962, 'LEAD'], [760, 1976, 'CALL'], [990, 1988, 'JOB']].map(([x, at, lab]) => <g key={lab as string}>
            <Dot f={f} at={at as number} x={x as number} y={470} r={15} c={INK} />
            <T f={f} at={(at as number) + 4} x={Math.min(950, Math.max(130, x as number))} y={560} size={36} c={INK}>{lab}</T>
          </g>)}
          <P f={f} at={2096} len={16} d={circlePath(570, 470, 110, 90)} w={8} />
          <P f={f} at={2104} len={12} d="M570 250 V350 M545 325 L570 352 L595 325" w={7} />
          <T f={f} at={2104} x={570} y={230} size={56}>HERE</T>
        </Scene>

        {/* S10 spending more is not the goal */}
        <Scene f={f} from={2130} to={2229}>
          <P f={f} at={2132} d="M200 800 H880" c={INK} w={5} />
          {[[280, 2140, 200], [460, 2150, 320], [640, 2160, 440], [820, 2170, 560]].map(([x, at, h], i) => { const t = k(f, at, 16); return t > 0 ? <g key={i}>
            <rect x={x - 60} y={800 - h * t} width={120} height={h * t} fill="none" stroke={INK} strokeWidth={5} />
            <text x={x} y={780 - h * t} fontSize={44} fontWeight={900} fill={INK} textAnchor="middle" style={{fontFamily: FONT}}>$</text>
          </g> : null; })}
          <P f={f} at={2190} len={10} d="M180 200 L900 820" w={14} />
          <P f={f} at={2198} len={10} d="M900 200 L180 820" w={14} />
        </Scene>
      </g>
    </svg>
  </div>;
};
