import React from 'react';
import {clamp} from '../../motion';
import type {VisualProps} from '../../types';

// Scenes for "speed-to-lead math" (job video6). All figures are the speaker's
// own hypothetical scenario. Cues are local beat frames from word timings.
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
const Person: React.FC<{color: string}> = ({color}) => <g>
  <circle cy="-14" r="11" fill={color} /><path d="M-17 16Q-17-2 0-2Q17-2 17 16Z" fill={color} />
</g>;

/* 1 · The scenario: 20 leads a month, $10,000 average job. */
export const LeadSetup: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [twenty, , avg, price] = cues(p, [30, 41, 77, 107]);
  const tag = back(ease(ramp(frame, price - 6, 14)));
  return <Svg bg="#13233A">
    <text x="80" y="120" fontFamily={SERIF} fontSize="52" fontStyle="italic" fill="#CFE0F5" opacity={ramp(frame, 0, 10)}>Say you both get…</text>
    {Array.from({length: 20}, (_, i) => {
      const k = back(ease(ramp(frame, twenty - 8 + i * 1.5, 8)));
      const x = 130 + (i % 5) * 110, y = 250 + Math.floor(i / 5) * 110;
      return <g key={i} transform={`translate(${x} ${y}) scale(${k})`} opacity={clamp(k)}>
        <circle r="40" fill="#1F3B5E" stroke="#5FA8FF" strokeWidth="4" /><g transform="translate(0 4) scale(1.2)"><Person color="#CFE0F5" /></g>
      </g>;
    })}
    <text x="350" y="760" textAnchor="middle" fontFamily={SANS} fontSize="58" fontWeight="900" fill="#FFFFFF" opacity={ease(ramp(frame, twenty, 12))}>20 leads <tspan fill="#5FA8FF">/ month</tspan></text>
    <g transform={`translate(800 450) rotate(${-8 + 8 * (1 - clamp(tag))}) scale(${tag})`} opacity={clamp(tag)}>
      <path d="M-130-110H120L190 0L120 110H-130Z" fill="#F4B400" />
      <circle cx="158" cy="0" r="12" fill="#13233A" />
      <text x="-108" y="-40" fontFamily={SANS} fontSize="28" fontWeight="800" letterSpacing="2" fill="#13233A" opacity={ramp(frame, avg - 4, 8)}>AVG JOB</text>
      <text x="-108" y="45" fontFamily={SANS} fontSize="58" fontWeight="900" letterSpacing="-3" fill="#13233A">$10,000</text>
    </g>
  </Svg>;
};

/* 2 · Contractor A replies within 5 minutes; B replies hours later. */
export const ResponseRace: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [a, five, every, b, , few] = cues(p, [5, 53, 70, 116, 148, 216]);
  const lane = (x: number, name: string, at: number, replyAt: number, stamp: string, color: string, slow: boolean) => {
    const k = ease(ramp(frame, at - 4, 12));
    const r = ease(ramp(frame, replyAt - 4, 12));
    return <g opacity={k} transform={`translate(${x} ${160 + (1 - k) * 30})`}>
      <text x="215" y="0" textAnchor="middle" fontFamily={SANS} fontSize="44" fontWeight="900" fill="#14202B">Contractor {name}</text>
      <rect y="30" width="430" height="650" rx="40" fill="#FFFFFF" stroke="#D5DBE4" strokeWidth="4" />
      <g transform="translate(30 90)">
        <rect width="290" height="74" rx="22" fill="#E9EDF2" />
        <text x="22" y="47" fontFamily={SANS} fontSize="28" fontWeight="700" fill="#14202B">New lead: quote?</text>
      </g>
      <text x="40" y="200" fontFamily={SANS} fontSize="24" fontWeight="700" fill="#8A94A6">2:00 PM</text>
      <g opacity={slow ? ease(ramp(frame, replyAt - 50, 10)) * (1 - r) : 0} transform="translate(215 360)">
        {[0, 1, 2].map(i => <circle key={i} cx={(i - 1) * 30} r="10" fill="#B5BDC9" opacity={.4 + .6 * ((Math.floor(frame / 6) + i) % 3 === 0 ? 1 : 0)} />)}
      </g>
      <g opacity={r} transform={`translate(${130 - (1 - r) * 20} ${slow ? 420 : 250})`}>
        <rect width="270" height="74" rx="22" fill={color} />
        <text x="22" y="47" fontFamily={SANS} fontSize="28" fontWeight="800" fill="#FFFFFF">On it, calling now</text>
      </g>
      <g opacity={r} transform={`translate(215 ${slow ? 570 : 400})`}>
        <rect x="-150" y="-42" width="300" height="84" rx="42" fill={slow ? '#FCE8E6' : '#E3F6EA'} />
        <text y="16" textAnchor="middle" fontFamily={SANS} fontSize="40" fontWeight="900" fill={slow ? '#C0392B' : '#1B7F4B'}>{stamp}</text>
      </g>
      {!slow && <text x="215" y="560" textAnchor="middle" fontFamily={SERIF} fontSize="34" fontStyle="italic" fill="#1B7F4B" opacity={ease(ramp(frame, every - 4, 10))}>every single time</text>}
    </g>;
  };
  return <Svg bg="#EEF1F5">
    {lane(80, 'A', a, five, '≤ 5 min', '#1B7F4B', false)}
    {lane(570, 'B', b, few, 'hours later', '#8A94A6', true)}
  </Svg>;
};

/* 3 · Same 20 leads; A closes 6-8, B closes 1-2, and the monthly totals. */
export const ClosedJobs: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [aClose, aTotal, b, bClose, bTotal] = cues(p, [108, 188, 276, 381, 422]);
  const row = (y: number, name: string, closed: number, maybe: number, closeAt: number, total: string, totalAt: number, color: string, show: number) => <g opacity={show} transform={`translate(0 ${y})`}>
    <text x="80" y="0" fontFamily={SANS} fontSize="40" fontWeight="900" fill="#FFFFFF">{name}</text>
    {Array.from({length: 20}, (_, i) => {
      const won = i < closed ? ease(ramp(frame, closeAt - 4 + i * 3, 8)) : i < closed + maybe ? .5 * ease(ramp(frame, closeAt - 4 + i * 3, 8)) : 0;
      return <g key={i} transform={`translate(${100 + (i % 10) * 92} ${60 + Math.floor(i / 10) * 92})`}>
        <circle r="34" fill="#2A3340" />
        <circle r="34" fill={color} opacity={won} />
        {won > .9 && i < closed && <path d="M-13 0L-4 10L14-10" stroke="#0E1116" strokeWidth="7" fill="none" strokeLinecap="round" />}
      </g>;
    })}
    <text x="80" y="250" fontFamily={SANS} fontSize="34" fontWeight="800" fill={color} opacity={ease(ramp(frame, closeAt - 4, 10))}>closes {closed}–{closed + maybe} jobs</text>
    <text x="1000" y="250" textAnchor="end" fontFamily={SANS} fontSize="64" fontWeight="900" letterSpacing="-2" fill="#FFFFFF" opacity={ease(ramp(frame, totalAt - 4, 10))}>{total}<tspan fontSize="34" fill="#8A94A6"> /mo</tspan></text>
  </g>;
  return <Svg bg="#0E1116">
    {row(90, 'A · fast', 6, 2, aClose, '$60–80K', aTotal, '#3DDC97', ramp(frame, 0, 10))}
    {row(520, 'B · slow, same leads', 1, 1, bClose, '$10–20K', bTotal, '#FF8A5B', ease(ramp(frame, b - 6, 12)))}
    <path d="M80 440H1000" stroke="#2A3340" strokeWidth="3" />
  </Svg>;
};

/* 4 · Same leads, market, price point; the only difference was speed. */
export const OnlySpeed: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [leads, market, price, only, speed] = cues(p, [28, 78, 103, 137, 166]);
  const items = [['Same 20 leads', leads], ['Same market', market], ['Same price point', price]] as const;
  const dim = ease(ramp(frame, only - 4, 12));
  const s = back(ease(ramp(frame, speed - 4, 12)));
  return <Svg bg="#0B0B0B">
    {items.map(([label, at], i) => {
      const k = ease(ramp(frame, at - 4, 10));
      return <g key={label} opacity={k * (1 - .6 * dim)} transform={`translate(${80 + (1 - k) * -30} ${130 + i * 105})`}>
        <text fontFamily={SANS} fontSize="62" fontWeight="850" letterSpacing="-2" fill="#FFFFFF">= {label}</text>
      </g>;
    })}
    <text x="80" y="520" fontFamily={SERIF} fontSize="48" fontStyle="italic" fill="#FFFFFF" opacity={dim}>The only difference:</text>
    <g transform={`translate(80 580) scale(${s})`} opacity={clamp(s)}>
      <rect width="920" height="230" fill="#FFD400" />
      <text x="460" y="185" textAnchor="middle" fontFamily={SANS} fontSize="200" fontWeight="900" letterSpacing="-6" fill="#0B0B0B">SPEED</text>
    </g>
  </Svg>;
};

/* 5 · $480,000 to $720,000 a year left sitting on the table. */
export const MoneyTable: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [worth, low, high, year] = cues(p, [16, 63, 127, 191]);
  const stack = (x: number, n: number, at: number) => Array.from({length: n}, (_, i) => {
    const k = ease(ramp(frame, at + i * 3, 8));
    const y = 700 - i * 22;
    return <g key={i} opacity={k} transform={`translate(${x} ${y - (1 - k) * 60})`}>
      <rect x="-90" y="-20" width="180" height="22" rx="3" fill={i % 2 ? '#5E9C5A' : '#6FAE6A'} stroke="#2F5A2C" strokeWidth="2" />
      <rect x="-24" y="-20" width="48" height="22" fill="#E9E2C8" opacity=".85" />
    </g>;
  });
  return <Svg bg="#2B1D14">
    <path d="M0 560H1080V960H0Z" fill="#7A4E2D" />
    {Array.from({length: 7}, (_, i) => <path key={i} d={`M0 ${590 + i * 50}Q540 ${600 + i * 50} 1080 ${585 + i * 50}`} stroke="#6A4226" strokeWidth="4" fill="none" />)}
    <path d="M0 560H1080" stroke="#A06A40" strokeWidth="10" />
    {stack(220, 8, low - 10)}
    {stack(470, 11, low + 10)}
    {stack(720, 14, high - 6)}
    {stack(920, 6, high + 10)}
    <text x="80" y="120" fontFamily={SERIF} fontSize="48" fontStyle="italic" fill="#E9D8C0" opacity={ease(ramp(frame, worth - 4, 10))}>Worth somewhere between</text>
    <text x="80" y="250" fontFamily={SANS} fontSize="120" fontWeight="900" letterSpacing="-5" fill="#FFFFFF" opacity={ease(ramp(frame, low - 4, 10))}>$480K</text>
    <text x="485" y="250" fontFamily={SANS} fontSize="120" fontWeight="900" letterSpacing="-5" fill="#F4B400" opacity={ease(ramp(frame, high - 4, 10))}>– $720K</text>
    <text x="80" y="330" fontFamily={SANS} fontSize="52" fontWeight="850" fill="#E9D8C0" opacity={ease(ramp(frame, year - 4, 10))}>a year, <tspan fill="#F4B400">left on the table</tspan></text>
  </Svg>;
};

/* 6 · Not better sales skills or work: who picked up first and kept it moving. */
export const PickedUpFirst: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [sales, work, sometimes, often, picked, first, kept] = cues(p, [115, 144, 172, 217, 247, 272, 299]);
  const chipsDim = ease(ramp(frame, often - 4, 12));
  const chips = [['Better sales skills?', sales, 90], ['Better work?', work, 620]] as const;
  const ring = ease(ramp(frame, picked - 4, 10));
  const answered = ease(ramp(frame, first - 4, 10));
  const bubbles = [0, 1, 2, 3].map(i => ease(ramp(frame, kept - 4 + i * 10, 8)));
  return <Svg bg="#ECE8F6">
    <text x="80" y="110" fontFamily={SERIF} fontSize="44" fontStyle="italic" fill="#4A4060" opacity={ramp(frame, 0, 10)}>Most assume the gap comes from…</text>
    {chips.map(([label, at, x]) => {
      const k = ease(ramp(frame, at - 4, 10));
      return <g key={label} opacity={k * (1 - .65 * chipsDim)} transform={`translate(${x} 160)`}>
        <rect width={label.length * 23 + 40} height="80" rx="40" fill="#FFFFFF" stroke="#B9AED6" strokeWidth="3" />
        <text x="24" y="53" fontFamily={SANS} fontSize="38" fontWeight="800" fill="#2C2440">{label}</text>
      </g>;
    })}
    <text x="80" y="310" fontFamily={SANS} fontSize="34" fontWeight="800" fill="#7A6E99" opacity={ease(ramp(frame, sometimes - 4, 10)) * (1 - chipsDim)}>Sometimes, yes…</text>
    <text x="80" y="320" fontFamily={SANS} fontSize="52" fontWeight="900" letterSpacing="-1.5" fill="#2C2440" opacity={chipsDim}>More often: <tspan fill="#6B3FD6">who picked up first</tspan></text>
    <g transform={`translate(250 600) rotate(${ring * (1 - answered) * Math.sin(frame * 1.4) * 8})`} opacity={ring}>
      <rect x="-110" y="-200" width="220" height="400" rx="34" fill="#2C2440" />
      <rect x="-94" y="-176" width="188" height="352" rx="22" fill={answered > .5 ? '#3DDC97' : '#FFFFFF'} />
      <path d="M-26-30Q-30 20 6 46T48 48L48 30L28 22L18 34Q0 24-6 6L6-4L-2-26Z" fill="#2C2440" transform="translate(-10 -20)" />
      <text y="140" textAnchor="middle" fontFamily={SANS} fontSize="30" fontWeight="900" fill="#2C2440">{answered > .5 ? 'Answered' : 'Ringing…'}</text>
    </g>
    {bubbles.map((k, i) => <g key={i} opacity={k} transform={`translate(${i % 2 ? 560 : 440} ${430 + i * 95 + (1 - k) * 20})`}>
      <rect width="420" height="72" rx="36" fill={i % 2 ? '#6B3FD6' : '#FFFFFF'} stroke="#B9AED6" strokeWidth={i % 2 ? 0 : 3} />
      <rect x="32" y="29" width={[300, 240, 330, 200][i]} height="14" rx="7" fill={i % 2 ? '#FFFFFF' : '#C9C0E0'} />
    </g>)}
    <text x="650" y="850" textAnchor="middle" fontFamily={SANS} fontSize="38" fontWeight="850" fill="#6B3FD6" opacity={bubbles[3]}>kept it moving</text>
  </Svg>;
};

/* 7 · The ads worked exactly the same for both: targeting, offer, cost per click. */
export const SameAds: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [neither, ads, targeting, offer, cpc] = cues(p, [5, 96, 182, 207, 230]);
  const card = (x: number, name: string) => {
    const k = ease(ramp(frame, ads - 6, 12));
    return <g opacity={k} transform={`translate(${x} ${220 + (1 - k) * 30})`}>
      <rect width="300" height="380" rx="20" fill="#FFFFFF" stroke="#D5DBE4" strokeWidth="4" />
      <circle cx="44" cy="44" r="22" fill="#1877F2" />
      <rect x="80" y="30" width="150" height="14" rx="7" fill="#1E2430" />
      <rect x="80" y="54" width="90" height="10" rx="5" fill="#C9D0DB" />
      <rect x="20" y="88" width="260" height="170" rx="10" fill="#DCE6F2" />
      <path d="M20 258L100 180L150 220L200 170L280 258Z" fill="#B9C9DD" />
      <rect x="20" y="276" width="200" height="14" rx="7" fill="#1E2430" />
      <rect x="20" y="314" width="260" height="46" rx="10" fill="#1877F2" />
      <text x="150" y="346" textAnchor="middle" fontFamily={SANS} fontSize="24" fontWeight="800" fill="#FFFFFF">Get a quote</text>
      <text x="150" y="-20" textAnchor="middle" fontFamily={SANS} fontSize="34" fontWeight="900" fill="#14202B">Contractor {name}</text>
    </g>;
  };
  const rows = [['Targeting', targeting], ['Offer', offer], ['Cost per click', cpc]] as const;
  return <Svg bg="#F3F5F8">
    <text x="80" y="110" fontFamily={SANS} fontSize="52" fontWeight="900" letterSpacing="-1.5" fill="#14202B" opacity={ramp(frame, neither - 4, 10)}>The marketing was identical</text>
    {card(80, 'A')}
    {card(700, 'B')}
    <text x="540" y="440" textAnchor="middle" fontFamily={SANS} fontSize="140" fontWeight="900" fill="#1877F2" opacity={ease(ramp(frame, ads + 30, 10))}>=</text>
    {rows.map(([label, at], i) => {
      const k = ease(ramp(frame, at - 4, 10));
      return <g key={label} opacity={k} transform={`translate(80 ${670 + i * 64})`}>
        <text x="150" y="0" textAnchor="middle" fontFamily={SANS} fontSize="36" fontWeight="900" fill="#1B7F4B">✓</text>
        <text x="460" y="0" textAnchor="middle" fontFamily={SANS} fontSize="36" fontWeight="800" fill="#14202B">same {label.toLowerCase()}</text>
        <text x="770" y="0" textAnchor="middle" fontFamily={SANS} fontSize="36" fontWeight="900" fill="#1B7F4B">✓</text>
      </g>;
    })}
  </Svg>;
};

/* 8 · Everything that mattered happened after the click. */
export const AfterClick: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [everything, , after] = cues(p, [8, 42, 75]);
  const line = ease(ramp(frame, 0, 30));
  const glow = ease(ramp(frame, after - 6, 14));
  const pulse = .6 + .4 * Math.sin(frame / 5);
  return <Svg bg="#0B1630">
    <text x="80" y="120" fontFamily={SANS} fontSize="54" fontWeight="900" letterSpacing="-1.5" fill="#FFFFFF" opacity={ease(ramp(frame, everything - 4, 10))}>Everything that mattered…</text>
    <path d="M80 480H1000" stroke="#2A3A5C" strokeWidth="8" strokeLinecap="round" {...draw(line)} />
    {[['AD', 160], ['CLICK', 400]].map(([label, x], i) => <g key={label as string} opacity={ease(ramp(frame, 4 + i * 10, 10))} transform={`translate(${x} 480)`}>
      <circle r="44" fill="#13244A" stroke="#7FA3D9" strokeWidth="5" />
      {i === 0 ? <rect x="-20" y="-16" width="40" height="32" rx="5" fill="#7FA3D9" /> : <path d="M-12-20L16 6L4 8L12 24L6 26L-2 10L-12 18Z" fill="#7FA3D9" />}
      <text y="100" textAnchor="middle" fontFamily={SANS} fontSize="32" fontWeight="900" letterSpacing="3" fill="#7FA3D9">{label as string}</text>
    </g>)}
    <g opacity={glow}>
      <rect x="490" y="300" width="520" height="360" rx="30" fill="#FFD400" opacity={.12 * pulse} />
      <rect x="490" y="300" width="520" height="360" rx="30" fill="none" stroke="#FFD400" strokeWidth="6" />
      <text x="750" y="410" textAnchor="middle" fontFamily={SANS} fontSize="34" fontWeight="900" letterSpacing="3" fill="#FFD400">AFTER THE CLICK</text>
      {['Response', 'Follow-up', 'Booked'].map((t, i) => <g key={t} opacity={ease(ramp(frame, after + 6 + i * 6, 8))} transform={`translate(${560 + i * 150} 520)`}>
        <circle r="30" fill="#FFD400" />
        <text y="80" textAnchor="middle" fontFamily={SANS} fontSize="26" fontWeight="800" fill="#FFFFFF">{t}</text>
      </g>)}
    </g>
  </Svg>;
};

/* 10 · Any source, same rule: the minutes right after the lead arrives. */
export const SourceMinutes: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [ads, referrals, website, never, always, minutes, , arrives] = cues(p, [82, 103, 134, 164, 225, 299, 311, 344]);
  const sources = [['Ads', ads, 160], ['Referrals', referrals, 300], ['Website', website, 440]] as const;
  const merge = ease(ramp(frame, never - 4, 16));
  const clockK = ease(ramp(frame, always - 6, 14));
  const wedge = ease(ramp(frame, minutes - 4, 30));
  const cx = 800, cy = 470, r = 170;
  const a = wedge * Math.PI * 2 * (5 / 60);
  return <Svg bg="#F5EFE4">
    <text x="80" y="100" fontFamily={SANS} fontSize="48" fontWeight="900" letterSpacing="-1.5" fill="#1E1A14" opacity={ramp(frame, 0, 10)}>Any lead source</text>
    {sources.map(([label, at, y]) => {
      const k = ease(ramp(frame, at - 4, 10));
      return <g key={label} opacity={k * (1 - .5 * merge)}>
        <rect x="80" y={y - 45} width="260" height="90" rx="45" fill="#FFFFFF" stroke="#1E1A14" strokeWidth="4" />
        <text x="210" y={y + 14} textAnchor="middle" fontFamily={SANS} fontSize="38" fontWeight="850" fill="#1E1A14">{label}</text>
        <path d={`M345 ${y}C450 ${y} 450 300 ${560} 300`} stroke="#1E1A14" strokeWidth="4" fill="none" strokeDasharray="10 8" {...{}} opacity={k} />
      </g>;
    })}
    <g opacity={ease(ramp(frame, website + 10, 10))}>
      <circle cx="560" cy="300" r="18" fill="#E4572E" />
    </g>
    <text x="80" y="640" fontFamily={SANS} fontSize="46" fontWeight="900" fill="#1E1A14" opacity={merge}>It's never the source.</text>
    <text x="80" y="720" fontFamily={SANS} fontSize="46" fontWeight="900" fill="#E4572E" opacity={clockK}>It's the first minutes</text>
    <text x="80" y="790" fontFamily={SANS} fontSize="46" fontWeight="900" fill="#E4572E" opacity={ease(ramp(frame, arrives - 4, 10))}>after it arrives.</text>
    <g opacity={clockK}>
      <circle cx={cx} cy={cy} r={r} fill="#FFFFFF" stroke="#1E1A14" strokeWidth="8" />
      {Array.from({length: 12}, (_, i) => { const t = i * Math.PI / 6; return <path key={i} d={`M${cx + Math.sin(t) * (r - 14)} ${cy - Math.cos(t) * (r - 14)}L${cx + Math.sin(t) * (r - 34)} ${cy - Math.cos(t) * (r - 34)}`} stroke="#1E1A14" strokeWidth="6" />; })}
      <path d={`M${cx} ${cy}L${cx} ${cy - r + 8}A${r - 8} ${r - 8} 0 0 1 ${cx + Math.sin(a) * (r - 8)} ${cy - Math.cos(a) * (r - 8)}Z`} fill="#E4572E" />
      <path d={`M${cx} ${cy}L${cx + Math.sin(a) * (r - 30)} ${cy - Math.cos(a) * (r - 30)}`} stroke="#1E1A14" strokeWidth="8" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="12" fill="#1E1A14" />
      <text x={cx} y={cy + r + 60} textAnchor="middle" fontFamily={SANS} fontSize="32" fontWeight="900" letterSpacing="3" fill="#1E1A14">LEAD ARRIVES</text>
    </g>
  </Svg>;
};
