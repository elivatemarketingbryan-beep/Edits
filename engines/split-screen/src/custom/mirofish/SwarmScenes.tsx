import React from 'react';
import {arrive, clamp} from '../../motion';
import type {VisualProps} from '../../types';

// Original illustrative drawings, not a recreation of the MiroFish interface.
// Every state is derived from the composition frame.
const progress = (f: number, start: number, length = 16) => clamp((f - start) / length);
const ease = (v: number) => 1 - Math.pow(1 - v, 3);

const Person: React.FC<{x: number; y: number; size: number; color: string; variant?: number}> = ({x, y, size, color, variant = 0}) => <g transform={`translate(${x} ${y}) scale(${size / 60})`} fill={color}>
  <circle cy={-12} r={11 + variant % 3} />
  {variant % 3 === 0
    ? <path d="M-24 24C-24 4-12 2 0 2S24 4 24 24Z" />
    : variant % 3 === 1
      ? <path d="M-23 24L-17 10Q0-4 17 10L23 24Z" />
      : <path d="M-21 24V12Q0-7 21 12V24Z" />}
</g>;

const OfferMark: React.FC<{x: number; y: number; size: number; color: string; paper: string}> = ({x, y, size, color, paper}) => <g transform={`translate(${x} ${y}) scale(${size / 100})`}>
  <path d="M-39-24L0-44L39-24V22L0 44L-39 22Z" fill={color} />
  <path d="M-39-24L0-2L39-24M0-2V44M-19-34L20-12V6" stroke={paper} strokeWidth="4" fill="none" strokeLinejoin="round" />
  <path d="M-25 7L-12 14" stroke={paper} strokeWidth="4" strokeLinecap="round" />
</g>;

const palette = {ink: '#111111', yellow: '#FFE600', paper: '#FFFFFF', neutral: '#F0F0F0'};

export const MiroSwarm: React.FC<VisualProps> = ({frame, fps}) => {
  const offerP = clamp(arrive(frame + 6, fps));
  const numbers = ease(progress(frame, 84, 17));
  const respond = ease(progress(frame, 147, 15));
  const flow = ease(progress(frame, 44, 35));
  const avatarFade = ease(progress(frame, 52, 31));
  return <svg viewBox="0 0 900 600" style={{width: '100%', height: '100%', overflow: 'visible'}} role="img" aria-label="An offer is explored by a simulated crowd of customer avatars with different reactions.">
    <g opacity={.32 + .68 * avatarFade}>
      {Array.from({length: 5}, (_, row) => <path key={row} d={`M290 308H333Q355 308 355 ${169 + row * 65}H412`} pathLength="1" stroke={palette.ink} strokeWidth="2.5" fill="none" strokeDasharray="1" strokeDashoffset={1 - flow}/>) }
      {Array.from({length: 40}, (_, i) => {
        const col = i % 8;
        const row = Math.floor(i / 8);
        const x = 420 + col * 60;
        const y = 178 + row * 66;
        const a = ease(progress(frame, 55 + col * 3 + row * 2, 20));
        const interested = [0, 2, 3, 7, 8, 12, 13, 16, 18, 21, 22, 25, 28, 29, 32, 35, 37, 38].includes(i);
        return <g key={i} opacity={.17 + .83 * a} transform={`translate(0 ${(1 - a) * 12})`}>
          <circle cx={x} cy={y} r="25" fill={palette.paper} stroke={palette.ink} strokeWidth="1.5"/>
          <circle cx={x} cy={y} r="24" fill={interested ? palette.yellow : palette.neutral} opacity={respond}/>
          <Person x={x} y={y} size={36} color={palette.ink} variant={i}/>
          {respond > 0 && <g opacity={respond}><circle cx={x + 18} cy={y - 19} r="9" fill={interested ? palette.ink : palette.paper} stroke={palette.ink} strokeWidth="1.5"/>{interested
            ? <path d={`M${x + 14} ${y - 19}l3 3 5-6`} stroke={palette.paper} strokeWidth="2" fill="none" />
            : <path d={`M${x + 15} ${y - 19}h6`} stroke={palette.ink} strokeWidth="2" />}</g>}
        </g>;
      })}
    </g>
    <g transform={`translate(${(1 - offerP) * -35} 0)`} opacity={offerP}>
      <rect x="26" y="170" width="275" height="302" rx="32" fill={palette.ink} />
      <rect x="18" y="160" width="275" height="302" rx="32" fill={palette.yellow} stroke={palette.ink} strokeWidth="2.5" />
      <rect x="43" y="184" width="69" height="8" rx="4" fill={palette.ink} />
      <OfferMark x={155} y={294} size={137} color={palette.ink} paper={palette.yellow} />
      <text x="155" y="415" textAnchor="middle" fontSize="40" fontWeight="800" fill={palette.ink}>Your offer</text>
    </g>
    <g opacity={numbers} transform={`translate(0 ${(1 - numbers) * 17})`}>
      <rect x="454" y="19" width="301" height="96" rx="17" fill={palette.yellow}/>
      <text x="603" y="96" textAnchor="middle" fontSize="88" letterSpacing="-5" fontWeight="850" fill={palette.ink}>1,000</text>
      <text x="604" y="140" textAnchor="middle" fontSize="29" fontWeight="680" fill={palette.ink}>customer avatars</text>
    </g>
    <g opacity={respond} transform={`translate(0 ${(1 - respond) * 14})`}>
      <rect x="374" y="497" width="210" height="56" rx="28" fill={palette.yellow}/>
      <text x="479" y="534" textAnchor="middle" fontSize="29" fontWeight="750" fill={palette.ink}>Interest</text>
      <rect x="600" y="497" width="269" height="56" rx="28" fill={palette.paper} stroke={palette.ink} strokeWidth="2"/>
      <text x="734" y="534" textAnchor="middle" fontSize="29" fontWeight="750" fill={palette.ink}>Hesitation</text>
    </g>
  </svg>;
};

export const MiroForecast: React.FC<VisualProps> = ({frame, fps}) => {
  const rise = clamp(arrive(frame + 6, fps));
  const gate = ease(progress(frame, 99, 21));
  const options = [
    {x: 156, label: 'Interested', fill: palette.yellow, delay: 19, variant: 1},
    {x: 450, label: 'Has questions', fill: palette.paper, delay: 32, variant: 0},
    {x: 744, label: 'Not for me', fill: palette.neutral, delay: 45, variant: 2},
  ];
  return <svg viewBox="0 0 900 850" style={{width: '100%', height: '100%', overflow: 'visible'}} role="img" aria-label="A simulation explores possible customer reactions before a real market launch. These are illustrative, not measured outcomes.">
    <g opacity={rise} transform={`translate(0 ${(1 - rise) * 25})`}>
      <rect x="277" y="37" width="362" height="160" rx="34" fill={palette.ink} />
      <rect x="269" y="28" width="362" height="160" rx="34" fill={palette.yellow} stroke={palette.ink} strokeWidth="2.5" />
      <OfferMark x={348} y={106} size={100} color={palette.ink} paper={palette.yellow} />
      <text x="420" y="121" fontSize="37" fontWeight="800" fill={palette.ink}>Your offer</text>
    </g>
    <g opacity={ease(progress(frame, 8, 18))}>
      <path d="M450 188V232" stroke={palette.ink} strokeWidth="4" />
      <rect x="281" y="232" width="338" height="62" rx="31" fill={palette.ink} />
      <text x="450" y="273" textAnchor="middle" fontSize="30" fontWeight="740" fill={palette.paper}>TEST REACTIONS</text>
    </g>
    {options.map((item, i) => {
      const p = ease(progress(frame, item.delay, 19));
      const connector = ease(progress(frame, item.delay - 7, 18));
      const pulse = ease(progress(frame, item.delay + 13, 15));
      return <g key={item.label}>
        <path d={`M450 294V317Q450 332 ${item.x} 332V394`} pathLength="1" stroke={palette.ink} strokeWidth="3" fill="none" strokeDasharray="1" strokeDashoffset={1 - connector} />
        <g transform={`translate(${item.x} ${394 + (1 - p) * 22})`} opacity={p}>
          <rect x="-132" y="0" width="264" height="195" rx="29" fill={item.fill} stroke={palette.ink} strokeWidth="2.5" />
          <circle cy="59" r="41" fill={palette.paper} stroke={palette.ink} strokeWidth="1.5" />
          <Person x={0} y={59} size={62} color={palette.ink} variant={item.variant} />
          <text y="148" textAnchor="middle" fontSize={i === 1 ? '31' : '33'} fontWeight="760" fill={palette.ink}>{item.label}</text>
          <g opacity={pulse} transform={`translate(75 34) scale(${.65 + .35 * pulse})`}>
            <circle r="18" fill={palette.ink}/>
            {i === 0 ? <path d="M-8 0l5 5 11-11" stroke={palette.paper} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              : i === 1 ? <text x="0" y="9" textAnchor="middle" fontSize="26" fontWeight="800" fill={palette.paper}>?</text>
                : <path d="M-7 0H7" stroke={palette.paper} strokeWidth="3.4" strokeLinecap="round"/>}
          </g>
        </g>
        <path d={`M${item.x} 589V664`} pathLength="1" stroke={palette.ink} strokeWidth="3" fill="none" strokeDasharray="1" strokeDashoffset={1 - gate} />
      </g>;
    })}
    <g opacity={gate} transform={`translate(0 ${(1 - gate) * 18})`}>
      <path d="M65 664H835" stroke={palette.ink} strokeWidth="4" strokeDasharray="10 12" />
      <rect x="256" y="638" width="388" height="62" rx="31" fill={palette.yellow} stroke={palette.ink} strokeWidth="2.5"/>
      <text x="450" y="679" textAnchor="middle" fill={palette.ink} fontSize="31" fontWeight="760">Before you launch</text>
      <text x="450" y="765" textAnchor="middle" fill={palette.ink} fontSize="37" fontWeight="680">Real market</text>
    </g>
  </svg>;
};
