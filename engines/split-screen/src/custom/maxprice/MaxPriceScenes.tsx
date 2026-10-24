import React from 'react';
import {clamp} from '../../motion';
import type {VisualProps} from '../../types';

// Scenes for "big jobs don't go to the cheapest bid" (job video9). Cost curves
// and price bars are qualitative. Cues are local beat frames from word timings.
const ramp = (frame: number, start: number, length = 14) => clamp((frame - start) / length);
const ease = (v: number) => 1 - Math.pow(1 - v, 3);
const back = (v: number) => { const c = 1.7; return 1 + (c + 1) * Math.pow(v - 1, 3) + c * Math.pow(v - 1, 2); };
const cues = (p: VisualProps, fallback: number[]) => {
  const data = p.beat.visual.type === 'custom' ? p.beat.visual.props?.cues : undefined;
  return Array.isArray(data) && data.every(n => typeof n === 'number') ? data as number[] : fallback;
};
const SANS = 'Inter, Arial, sans-serif';
const SERIF = 'Georgia, "Times New Roman", serif';
const draw = (k: number) => ({pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - k});
const Svg: React.FC<{bg: string; children: React.ReactNode}> = ({bg, children}) =>
  <svg viewBox="0 0 1080 960" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
    <rect width="1080" height="960" fill={bg} />{children}
  </svg>;
const House: React.FC<{x: number; y: number; s?: number; fill: string; roof?: string}> = ({x, y, s = 1, fill, roof = fill}) =>
  <g transform={`translate(${x} ${y}) scale(${s})`}><path d="M-60 0V-70H60V0Z" fill={fill} /><path d="M-78-66L0-128L78-66Z" fill={roof} /><rect x="-16" y="-44" width="32" height="44" fill="#FFFFFF" opacity=".8" /></g>;
const Person: React.FC<{x: number; y: number; s?: number; fill: string}> = ({x, y, s = 1, fill}) =>
  <g transform={`translate(${x} ${y}) scale(${s})`}><circle cy="-46" r="26" fill={fill} /><path d="M-44 30Q-44-14 0-14Q44-14 44 30Z" fill={fill} /></g>;
const Check: React.FC<{x: number; y: number; k: number; color: string}> = ({x, y, k, color}) =>
  <path d={`M${x - 16} ${y}l12 12l22-26`} stroke={color} strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round" {...draw(k)} />;

/* 2 · Projects that take six months to a year; the homeowner's worry isn't the price. */
export const LongProject: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [projects, six, year, worried, notPrice] = cues(p, [15, 51, 82, 175, 222]);
  const g = ease(ramp(frame, projects - 4, six - projects + 4)) * .5 + .5 * ease(ramp(frame, six + 4, year - six));
  const worry = back(ease(ramp(frame, worried - 6, 12)));
  const tag = ease(ramp(frame, notPrice - 6, 10));
  return <Svg bg="#F4EDE1">
    <text x="80" y="120" fontFamily={SERIF} fontSize="56" fill="#2B2116" opacity={ramp(frame, 0, 10)}>The big projects</text>
    <House x={170} y={420} s={1.2} fill="#C9B79C" roof="#8C6F4E" />
    <rect x="300" y="300" width="680" height="64" rx="32" fill="#E4D8C4" />
    <rect x="300" y="300" width={680 * g} height="64" rx="32" fill="#D9822B" />
    {[['Start', 0], ['6 months', .5], ['1 year', 1]].map(([l, t], i) => {
      const k = i === 0 ? 1 : ease(ramp(frame, (i === 1 ? six : year) - 4, 8));
      return <g key={l as string} opacity={k} transform={`translate(${300 + 680 * (t as number)} 400)`}>
        <path d="M0 -30V0" stroke="#2B2116" strokeWidth="4" />
        <text y="44" textAnchor={i === 0 ? 'start' : i === 2 ? 'end' : 'middle'} fontFamily={SANS} fontSize="34" fontWeight="900" fill="#2B2116">{l}</text>
      </g>;
    })}
    <Person x={300} y={800} s={1.3} fill="#5B4632" />
    <g transform={`translate(520 610) scale(${worry})`} opacity={clamp(worry)}>
      <circle cx="-150" cy="110" r="12" fill="#FFFFFF" /><circle cx="-120" cy="80" r="18" fill="#FFFFFF" />
      <ellipse rx="190" ry="90" fill="#FFFFFF" />
      <text y="22" textAnchor="middle" fontFamily={SANS} fontSize="64" fontWeight="900" fill="#C0392B">?!</text>
    </g>
    <g opacity={tag} transform="translate(800 720) rotate(-10)">
      <path d="M-110-46H70L110 0L70 46H-110Z" fill="#FFFFFF" stroke="#BFB3A0" strokeWidth="4" />
      <circle cx="78" cy="0" r="10" fill="#BFB3A0" />
      <text x="-20" y="18" textAnchor="middle" fontFamily={SANS} fontSize="52" fontWeight="900" fill="#BFB3A0">$</text>
      <path d="M-120 0H120" stroke="#C0392B" strokeWidth="8" strokeLinecap="round" {...draw(ease(ramp(frame, notPrice + 4, 8)))} />
    </g>
    <text x="800" y="830" textAnchor="middle" fontFamily={SANS} fontSize="34" fontWeight="900" fill="#C0392B" opacity={ease(ramp(frame, notPrice + 4, 10))}>not the price</text>
  </Svg>;
};

/* 3 · The cost goes up halfway through, leaving a $40–50K bill they weren't expecting. */
export const SurpriseBill: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [cost, up, halfway, forty, bill, expecting] = cues(p, [15, 34, 42, 120, 164, 197]);
  const X0 = 120, X1 = 960, Y0 = 640, YH = 380;
  const draw1 = ease(ramp(frame, cost - 4, halfway - cost + 4));
  const jump = ease(ramp(frame, up + 2, 14));
  const half = (X0 + X1) / 2;
  const bl = ease(ramp(frame, forty - 8, 10));
  const slam = back(ease(ramp(frame, forty - 8, 12)));
  return <Svg bg="#FBF7F2">
    <text x="80" y="110" fontFamily={SANS} fontSize="50" fontWeight="900" letterSpacing="-1.5" fill="#1D1D1D" opacity={ramp(frame, 0, 10)}>The cost goes up halfway</text>
    <path d={`M${X0} 180V${Y0 + 60}H${X1}`} stroke="#D9D2C7" strokeWidth="5" fill="none" />
    <text x={X0} y={Y0 + 110} fontFamily={SANS} fontSize="26" fontWeight="800" letterSpacing="2" fill="#8E8678">START</text>
    <text x={X1} y={Y0 + 110} textAnchor="end" fontFamily={SANS} fontSize="26" fontWeight="800" letterSpacing="2" fill="#8E8678">FINISH</text>
    <path d={`M${X0} ${Y0}H${X1}`} stroke="#2F6FED" strokeWidth="4" strokeDasharray="12 10" opacity={ease(ramp(frame, cost - 4, 10))} />
    <text x={X1} y={Y0 - 16} textAnchor="end" fontFamily={SANS} fontSize="26" fontWeight="800" fill="#2F6FED" opacity={ease(ramp(frame, cost, 10))}>what they expected</text>
    <g opacity={ease(ramp(frame, halfway - 4, 10))}>
      <path d={`M${half} 200V${Y0 + 60}`} stroke="#1D1D1D" strokeWidth="3" strokeDasharray="6 8" />
      <text x={half} y="190" textAnchor="middle" fontFamily={SANS} fontSize="28" fontWeight="900" fill="#1D1D1D">HALFWAY</text>
    </g>
    <path d={`M${X0} ${Y0}H${X0 + (half - X0) * draw1}`} stroke="#1D1D1D" strokeWidth="10" strokeLinecap="round" />
    {jump > 0 && <path d={`M${half} ${Y0}V${Y0 - (Y0 - YH) * jump}H${half + (X1 - half) * ease(ramp(frame, up + 10, 30))}`} stroke="#E5484D" strokeWidth="10" fill="none" strokeLinecap="round" strokeLinejoin="round" />}
    <g opacity={bl} transform={`translate(330 330) rotate(${-6 + 6 * (1 - slam)}) scale(${slam})`}>
      <rect x="-200" y="-110" width="400" height="230" rx="14" fill="#FFFFFF" stroke="#1D1D1D" strokeWidth="4" />
      <text x="-170" y="-60" fontFamily={SANS} fontSize="28" fontWeight="900" letterSpacing="3" fill="#1D1D1D">EXTRA BILL</text>
      <text x="-170" y="20" fontFamily={SANS} fontSize="60" fontWeight="900" letterSpacing="-2" fill="#E5484D">+$40–50K</text>
      <rect x="-170" y="50" width="220" height="12" rx="6" fill="#E5E0D8" /><rect x="-170" y="76" width="160" height="12" rx="6" fill="#E5E0D8" />
    </g>
    <g opacity={ease(ramp(frame, expecting - 4, 8))} transform={`translate(360 500) rotate(-10) scale(${back(ease(ramp(frame, expecting - 4, 10)))})`}>
      <rect x="-150" y="-36" width="300" height="72" rx="8" fill="none" stroke="#E5484D" strokeWidth="6" />
      <text y="14" textAnchor="middle" fontFamily={SANS} fontSize="38" fontWeight="900" letterSpacing="3" fill="#E5484D">UNEXPECTED</text>
    </g>
    <text x="80" y="830" fontFamily={SERIF} fontSize="34" fontStyle="italic" fill="#8E8678" opacity={ease(ramp(frame, bill - 4, 10))}>…a bill they never planned for</text>
  </Svg>;
};

/* 4 · They're not just paying for the work: trust with their money, no financial nightmare. */
export const WhatTheyBuy: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [hires, work, trust, money, nightmare] = cues(p, [41, 146, 196, 221, 293]);
  const lines = [['The work', work], ['Trust with their money', money], ['No financial nightmare', nightmare]] as const;
  const paper = ease(ramp(frame, hires - 10, 16));
  return <Svg bg="#2B3A33">
    <text x="80" y="110" fontFamily={SANS} fontSize="44" fontWeight="900" fill="#F4F1EA" opacity={ramp(frame, 0, 10)}>A year-long project. They're paying for…</text>
    <g transform={`translate(220 ${170 + (1 - paper) * 120})`} opacity={paper}>
      <path d="M0 0H640V660L600 690L560 660L520 690L480 660L440 690L400 660L360 690L320 660L280 690L240 660L200 690L160 660L120 690L80 660L40 690L0 660Z" fill="#FBF8F1" />
      <text x="320" y="70" textAnchor="middle" fontFamily="'Courier New', monospace" fontSize="34" fontWeight="700" fill="#2B2B2B">RECEIPT</text>
      <path d="M40 100H600" stroke="#2B2B2B" strokeWidth="3" strokeDasharray="8 8" />
      {lines.map(([label, at], i) => {
        const k = ease(ramp(frame, at - 6, 10));
        const hot = i === 1 && frame > trust - 6;
        return <g key={label} opacity={k} transform={`translate(40 ${180 + i * 140})`}>
          <text y="0" fontFamily="'Courier New', monospace" fontSize={i ? 36 : 40} fontWeight="700" fill={hot || i === 2 ? '#1E7A4F' : '#2B2B2B'}>{label}</text>
          <Check x={540} y={-14} k={ease(ramp(frame, at + 4, 8))} color="#1E7A4F" />
          <path d="M0 40H560" stroke="#D8D2C4" strokeWidth="2" />
        </g>;
      })}
      <path d="M40 590H600" stroke="#2B2B2B" strokeWidth="3" strokeDasharray="8 8" />
      <text x="40" y="640" fontFamily="'Courier New', monospace" fontSize="30" fontWeight="700" fill="#2B2B2B" opacity={ease(ramp(frame, nightmare + 10, 10))}>PEACE OF MIND</text>
    </g>
  </Svg>;
};

/* 5 · A guaranteed maximum price protects the homeowner from unexpected costs. */
export const MaxPriceCeiling: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [guaranteed, price, difference, protect, unexpected] = cues(p, [39, 72, 115, 264, 293]);
  const ceilY = 330, X0 = 120, X1 = 960;
  const ceil = ease(ramp(frame, guaranteed - 6, price - guaranteed + 6));
  const climb = ease(ramp(frame, difference - 10, unexpected - difference + 30));
  // Cost path wanders upward; values above the ceiling are clipped to it.
  const raw = (t: number) => 700 - 420 * t - 60 * Math.sin(t * 14) * t;
  const n = 90, pts: string[] = [];
  for (let i = 0; i <= n * climb; i++) { const t = i / n; pts.push(`${X0 + (X1 - X0) * t},${Math.max(ceilY + 6, raw(t))}`); }
  const hit = climb > .55;
  const shield = back(ease(ramp(frame, protect - 6, 12)));
  return <Svg bg="#0D1B2A">
    <text x="80" y="110" fontFamily={SANS} fontSize="48" fontWeight="900" letterSpacing="-1.5" fill="#FFFFFF" opacity={ramp(frame, 0, 10)}>Guaranteed Maximum Price</text>
    <path d={`M${X0} 180V760H${X1}`} stroke="#22344A" strokeWidth="5" fill="none" />
    <text x={X0} y="805" fontFamily={SANS} fontSize="26" fontWeight="800" letterSpacing="2" fill="#6F86A3">PROJECT TIMELINE →</text>
    <rect x={X0} y={180} width={(X1 - X0) * ceil} height={ceilY - 180} fill="#E5484D" opacity=".12" />
    <path d={`M${X0} ${ceilY}H${X0 + (X1 - X0) * ceil}`} stroke="#F5C451" strokeWidth="8" />
    <text x={X0 + 10} y={ceilY - 20} fontFamily={SANS} fontSize="30" fontWeight="900" letterSpacing="2" fill="#F5C451" opacity={ease(ramp(frame, price - 4, 10))}>THE MOST THEY'LL PAY</text>
    {pts.length > 1 && <polyline points={pts.join(' ')} fill="none" stroke="#7FD1FF" strokeWidth="8" strokeLinejoin="round" strokeLinecap="round" />}
    {hit && Array.from({length: 4}, (_, i) => <path key={i} d={`M${X0 + (X1 - X0) * (.6 + i * .1)} ${ceilY - 10}l-12 -26M${X0 + (X1 - X0) * (.6 + i * .1)} ${ceilY - 10}l12 -26`} stroke="#F5C451" strokeWidth="4" opacity={.4 + .6 * Math.abs(Math.sin(frame / 4 + i))} />)}
    <g transform={`translate(860 520) scale(${shield})`} opacity={clamp(shield)}>
      <path d="M0-90L74-62V0Q74 60 0 96Q-74 60-74 0V-62Z" fill="#1E7A4F" stroke="#F5C451" strokeWidth="5" />
      <path d="M-28 4l20 20l38-44" stroke="#FFFFFF" strokeWidth="10" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>
    <text x="860" y="660" textAnchor="middle" fontFamily={SANS} fontSize="30" fontWeight="900" fill="#FFFFFF" opacity={ease(ramp(frame, unexpected - 4, 10))}>protected from</text>
    <text x="860" y="698" textAnchor="middle" fontFamily={SANS} fontSize="30" fontWeight="900" fill="#FFFFFF" opacity={ease(ramp(frame, unexpected - 4, 10))}>unexpected costs</text>
  </Svg>;
};

/* 6 · "Trust me, probably around that" vs "here's the maximum you'll pay, in writing". */
export const TwoQuotes: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [one, trustMe, around, another, maximum, writing, whoTrust, savings] = cues(p, [5, 60, 113, 158, 192, 231, 270, 395]);
  const A = ease(ramp(frame, one - 4, 10)), B = ease(ramp(frame, another - 4, 10));
  const pick = ease(ramp(frame, whoTrust - 4, 14));
  const sign = ease(ramp(frame, writing - 6, 18));
  const wob = Math.sin(frame / 5) * 30;
  return <Svg bg="#EEF0F3">
    <text x="540" y="100" textAnchor="middle" fontFamily={SANS} fontSize="48" fontWeight="900" letterSpacing="-1.5" fill="#15181D" opacity={pick}>Who would you trust?</text>
    <g opacity={A * (1 - .5 * pick)} transform="translate(60 150)">
      <text x="0" y="0" fontFamily={SANS} fontSize="30" fontWeight="900" letterSpacing="2" fill="#6B7280">CONTRACTOR A</text>
      <rect y="30" width="460" height="300" rx="28" fill="#FFFFFF" stroke="#D1D5DB" strokeWidth="3" />
      <path d="M60 330L40 380L120 330Z" fill="#FFFFFF" stroke="#D1D5DB" strokeWidth="3" />
      <text x="36" y="110" fontFamily={SERIF} fontSize="40" fontStyle="italic" fill="#15181D" opacity={ease(ramp(frame, trustMe - 4, 10))}>“Trust me…</text>
      <text x="36" y="168" fontFamily={SERIF} fontSize="40" fontStyle="italic" fill="#15181D" opacity={ease(ramp(frame, around - 30, 10))}>it'll <tspan fill="#B45309">probably</tspan> cost</text>
      <text x="36" y="226" fontFamily={SERIF} fontSize="40" fontStyle="italic" fill="#15181D" opacity={ease(ramp(frame, around - 4, 10))}>around that much.”</text>
      <g opacity={ease(ramp(frame, around, 12))} transform="translate(40 450)">
        <text y="-24" fontFamily={SANS} fontSize="26" fontWeight="800" fill="#6B7280">Final cost</text>
        <rect width="380" height="24" rx="12" fill="#E5E7EB" />
        <rect x={110 + wob} width={180 - wob} height="24" rx="12" fill="#F59E0B" opacity=".55" />
        <text x="190" y="80" textAnchor="middle" fontFamily={SANS} fontSize="52" fontWeight="900" fill="#B45309">???</text>
      </g>
    </g>
    <g opacity={B} transform={`translate(560 150) scale(${1 + .04 * pick})`}>
      <text x="0" y="0" fontFamily={SANS} fontSize="30" fontWeight="900" letterSpacing="2" fill="#1E7A4F">CONTRACTOR B</text>
      <rect y="30" width="460" height="580" rx="10" fill="#FFFFFF" stroke={pick > .5 ? '#1E7A4F' : '#D1D5DB'} strokeWidth={pick > .5 ? 8 : 3} />
      <text x="40" y="110" fontFamily={SERIF} fontSize="36" fontWeight="700" fill="#15181D">Contract</text>
      <rect x="40" y="140" width="380" height="12" rx="6" fill="#E5E7EB" /><rect x="40" y="168" width="320" height="12" rx="6" fill="#E5E7EB" />
      <g opacity={ease(ramp(frame, maximum - 4, 10))}>
        <rect x="40" y="210" width="380" height="120" rx="12" fill="#ECFDF5" stroke="#1E7A4F" strokeWidth="3" />
        <text x="230" y="258" textAnchor="middle" fontFamily={SANS} fontSize="26" fontWeight="900" letterSpacing="2" fill="#1E7A4F">MAXIMUM PRICE</text>
        <text x="230" y="306" textAnchor="middle" fontFamily={SANS} fontSize="40" fontWeight="900" fill="#15181D">$ _ _ _, _ _ _</text>
      </g>
      <rect x="40" y="360" width="380" height="12" rx="6" fill="#E5E7EB" /><rect x="40" y="388" width="280" height="12" rx="6" fill="#E5E7EB" />
      <path d="M40 520H420" stroke="#9CA3AF" strokeWidth="3" />
      <path d="M60 505C90 450 110 530 140 480S190 520 220 470S280 515 320 490" stroke="#1D4ED8" strokeWidth="5" fill="none" strokeLinecap="round" {...draw(sign)} />
      <text x="40" y="560" fontFamily={SANS} fontSize="24" fontWeight="800" fill="#6B7280">IN WRITING</text>
      {pick > .2 && <Check x={400} y={92} k={pick} color="#1E7A4F" />}
    </g>
    <g opacity={ease(ramp(frame, savings - 8, 10))} transform="translate(290 860)">
      <rect x="-200" y="-40" width="400" height="80" rx="40" fill="#15181D" />
      <text y="14" textAnchor="middle" fontFamily={SANS} fontSize="34" fontWeight="900" fill="#FFFFFF">Their life savings</text>
    </g>
  </Svg>;
};

/* 8 · Account for risk upfront, instead of paying unexpected costs out of your own pocket. */
export const RiskUpfront: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [accounting, risk, upfront, instead, unexpected, pocket] = cues(p, [11, 37, 47, 63, 102, 138]);
  const W = 860, X = 110;
  const seg = (x: number, w: number, y: number, fill: string, label: string, k: number, ink = '#FFFFFF') =>
    <g opacity={k}><rect x={x} y={y} width={w * k} height="110" fill={fill} />
      <text x={x + w / 2} y={y + 66} textAnchor="middle" fontFamily={SANS} fontSize="32" fontWeight="900" fill={ink}>{label}</text></g>;
  const over = ease(ramp(frame, unexpected - 4, 14));
  const spill = ease(ramp(frame, pocket - 8, 14));
  const top = 250, bot = 600;
  return <Svg bg="#F3F5F0">
    <text x="80" y="110" fontFamily={SANS} fontSize="50" fontWeight="900" letterSpacing="-1.5" fill="#18211A" opacity={ramp(frame, 0, 10)}>Price the risk upfront</text>
    <text x={X} y={top - 24} fontFamily={SANS} fontSize="30" fontWeight="900" fill="#1E7A4F" opacity={ease(ramp(frame, accounting - 4, 10))}>WITH A RISK BUFFER</text>
    {seg(X, W * .55, top, '#3F5A4A', 'Cost', ease(ramp(frame, accounting - 4, 10)))}
    {seg(X + W * .55, W * .2, top, '#F5C451', 'Risk', ease(ramp(frame, risk - 4, 10)), '#18211A')}
    {seg(X + W * .75, W * .25, top, '#1E7A4F', 'Profit', ease(ramp(frame, upfront - 4, 10)))}
    {over > 0 && <rect x={X + W * .55} y={top + 110} width={W * .14 * over} height="16" fill="#E5484D" />}
    <text x={X + W * .55} y={top + 160} fontFamily={SANS} fontSize="26" fontWeight="800" fill="#1E7A4F" opacity={over}>surprise absorbed ✓</text>
    <text x={X} y={bot - 24} fontFamily={SANS} fontSize="30" fontWeight="900" fill="#B42318" opacity={ease(ramp(frame, instead - 4, 10))}>WITHOUT ONE</text>
    {seg(X, W * .55, bot, '#3F5A4A', 'Cost', ease(ramp(frame, instead - 4, 10)))}
    {seg(X + W * .55, W * .25, bot, '#1E7A4F', 'Profit', ease(ramp(frame, instead + 2, 10)) * (1 - .7 * over))}
    {over > 0 && <g>
      <rect x={X + W * .55} y={bot} width={(W * .25 + W * .2 * spill) * over} height="110" fill="#E5484D" />
      <text x={X + W * .55 + 20} y={bot + 66} fontFamily={SANS} fontSize="32" fontWeight="900" fill="#FFFFFF">Unexpected cost</text>
    </g>}
    <g opacity={spill} transform={`translate(${X + W * .82} ${bot + 200})`}>
      <path d="M-30-70V-20" stroke="#B42318" strokeWidth="6" />
      <text textAnchor="middle" fontFamily={SANS} fontSize="34" fontWeight="900" fill="#B42318">out of your pocket</text>
    </g>
  </Svg>;
};

/* 9 · Marketing too: people want more than promises — a plan, a process, proof. */
export const MoreThanPromises: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [same, marketing, promises, plan, process, backup] = cues(p, [15, 56, 182, 227, 257, 334]);
  const items = [['A clear plan', plan], ['A process they can trust', process], ['Proof to back it up', backup]] as const;
  const bub = ease(ramp(frame, marketing - 4, 12));
  const strike = ease(ramp(frame, promises + 8, 10));
  return <Svg bg="#16121F">
    <text x="80" y="110" fontFamily={SANS} fontSize="46" fontWeight="900" letterSpacing="-1.5" fill="#FFFFFF" opacity={ease(ramp(frame, same - 6, 10))}>Same idea in marketing</text>
    <g opacity={bub * (1 - .5 * strike)} transform="translate(80 170)">
      <rect width="560" height="150" rx="40" fill="#2A2238" />
      <path d="M80 150L60 200L140 150Z" fill="#2A2238" />
      <text x="40" y="95" fontFamily={SERIF} fontSize="50" fontStyle="italic" fill="#CFC6E6">“Trust us, we promise…”</text>
      <path d="M20 75H540" stroke="#FF6B6B" strokeWidth="8" strokeLinecap="round" {...draw(strike)} />
    </g>
    <text x="700" y="270" fontFamily={SANS} fontSize="36" fontWeight="900" fill="#FF6B6B" opacity={strike}>not enough</text>
    {items.map(([label, at], i) => {
      const k = ease(ramp(frame, at - 6, 12));
      return <g key={label} opacity={k} transform={`translate(${80 + (1 - k) * 40} ${400 + i * 150})`}>
        <rect width="920" height="120" rx="24" fill="#2A2238" stroke="#B794F6" strokeWidth="3" />
        <circle cx="70" cy="60" r="34" fill="#B794F6" />
        <Check x={70} y={62} k={ease(ramp(frame, at + 2, 8))} color="#16121F" />
        <text x="130" y="76" fontFamily={SANS} fontSize="44" fontWeight="850" fill="#FFFFFF">{label}</text>
      </g>;
    })}
  </Svg>;
};

/* 10 · The biggest projects don't always go to the cheapest; they go to the confident one. */
export const ConfidentWins: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [biggest, always, cheapest, actually, contractor] = cues(p, [33, 84, 116, 168, 200]);
  const bids = [['Cheapest bid', '#9CA3AF'], ['Mid bid', '#9CA3AF'], ['Max price, in writing', '#1E7A4F']] as const;
  const dim = ease(ramp(frame, always - 4, 12));
  const win = back(ease(ramp(frame, actually - 4, 16)));
  return <Svg bg="#FFF8EC">
    <text x="80" y="110" fontFamily={SERIF} fontSize="54" fill="#2B2116" opacity={ease(ramp(frame, biggest - 8, 10))}>Who gets the big job?</text>
    {bids.map(([label, color], i) => {
      const k = ease(ramp(frame, biggest + i * 6, 10));
      const isWin = i === 2;
      const s = isWin ? 1 + .1 * clamp(win) : 1;
      const o = i === 0 ? 1 - .55 * dim : isWin ? 1 : 1 - .4 * dim;
      return <g key={label} opacity={k * o} transform={`translate(${80 + i * 320} ${260 - (isWin ? 40 * clamp(win) : 0)}) scale(${s})`}>
        <rect width="280" height="380" rx="20" fill="#FFFFFF" stroke={isWin && win > .3 ? color : '#E3D9C6'} strokeWidth={isWin && win > .3 ? 7 : 3} />
        <rect x="30" y="40" width="220" height="14" rx="7" fill="#EDE6D8" /><rect x="30" y="70" width="160" height="14" rx="7" fill="#EDE6D8" />
        <text x="140" y="200" textAnchor="middle" fontFamily={SANS} fontSize="74" fontWeight="900" fill={i === 0 ? '#2B2116' : '#6B5E4B'}>{['$', '$$', '$$$'][i]}</text>
        <text x="140" y="290" textAnchor="middle" fontFamily={SANS} fontSize={isWin ? 24 : 28} fontWeight="900" fill={isWin ? color : '#6B5E4B'}>{label}</text>
        {i === 0 && <g opacity={ease(ramp(frame, cheapest - 2, 10))}><rect x="40" y="-30" width="200" height="50" rx="25" fill="#2B2116" /><text x="140" y="4" textAnchor="middle" fontFamily={SANS} fontSize="24" fontWeight="900" fill="#FFFFFF">LOWEST</text></g>}
      </g>;
    })}
    <g opacity={clamp(win)} transform={`translate(860 ${200 - 40 * clamp(win)})`}>
      <path d="M-40-40H40V0Q40 40 0 40Q-40 40-40 0Z" fill="#F5B301" />
      <path d="M-40-30Q-70-30-66 0Q-62 20-36 18M40-30Q70-30 66 0Q62 20 36 18" stroke="#F5B301" strokeWidth="8" fill="none" />
      <rect x="-12" y="40" width="24" height="24" fill="#F5B301" /><rect x="-36" y="62" width="72" height="16" rx="4" fill="#C98F00" />
    </g>
    <text x="540" y="760" textAnchor="middle" fontFamily={SANS} fontSize="42" fontWeight="900" fill="#1E7A4F" opacity={ease(ramp(frame, contractor, 12))}>The one they feel confident in</text>
  </Svg>;
};
