import React from 'react';
import {clamp} from '../../motion';
import type {VisualProps} from '../../types';

// Scenes for "stop looking smaller than you are" (job video5). Cues are local
// beat frames from word timings in the plan's props.cues.
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
const Stamp: React.FC<{x: number; y: number; k: number; color: string; text: string; w?: number; rot?: number}> = ({x, y, k, color, text, w = 300, rot = -10}) => {
  const s = 1.8 - .8 * ease(k);
  return <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={clamp(k * 1.5)}>
    <rect x={-w / 2} y="-56" width={w} height="112" rx="12" fill="none" stroke={color} strokeWidth="10" />
    <text y="26" textAnchor="middle" fontFamily={SANS} fontSize="76" fontWeight="900" letterSpacing="4" fill={color}>{text}</text>
  </g>;
};

/* 2 · Same job: the bigger company charges more, gives less attention, and still wins. */
export const BidLoss: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [bigger, more, less, frustrating] = cues(p, [10, 30, 61, 118]);
  const sheet = (x: number, title: string, sub: string, price: string, attention: string, good: boolean, at: number) => {
    const k = ease(ramp(frame, at, 14));
    return <g opacity={k} transform={`translate(${x} ${180 + (1 - k) * 40}) rotate(${good ? -1.5 : 1.5} 220 280)`}>
      <rect width="450" height="600" rx="8" fill="#000" opacity=".3" transform="translate(8 12)" />
      <rect width="450" height="600" rx="8" fill="#FBF7EE" />
      <rect width="450" height="14" rx="4" fill={good ? '#2E5E8C' : '#7A2E2E'} />
      <text x="36" y="96" fontFamily={SANS} fontSize="44" fontWeight="900" letterSpacing="-1" fill="#1A1A1A">{title}</text>
      <text x="36" y="144" fontFamily={SERIF} fontSize="32" fontStyle="italic" fill="#5A5048">{sub}</text>
      <path d="M36 180H414" stroke="#D9CFBF" strokeWidth="3" />
      <text x="36" y="244" fontFamily={SANS} fontSize="26" fontWeight="800" letterSpacing="2" fill="#8A7F72">PRICE</text>
      <text x="36" y="312" fontFamily={SANS} fontSize="64" fontWeight="900" fill={good ? '#1A1A1A' : '#B23A2E'} opacity={good ? 1 : ramp(frame, more - 4, 8)}>{price}</text>
      <text x="36" y="380" fontFamily={SANS} fontSize="26" fontWeight="800" letterSpacing="2" fill="#8A7F72">ATTENTION</text>
      <text x="36" y="436" fontFamily={SANS} fontSize="44" fontWeight="850" fill={good ? '#1A1A1A' : '#B23A2E'} opacity={good ? 1 : ramp(frame, less - 4, 8)}>{attention}</text>
    </g>;
  };
  return <Svg bg="#2A211B">
    <text x="540" y="120" textAnchor="middle" fontFamily={SERIF} fontSize="58" fill="#F3E9D8" opacity={ramp(frame, 0, 10)}>Same job. Two bids.</text>
    {sheet(60, 'Small crew', 'Excellent work', '$$', 'Personal', true, 0)}
    {sheet(570, 'Bigger company', 'Bigger name', '$$$', 'Less', false, bigger - 6)}
    <Stamp x={795} y={705} k={ramp(frame, frustrating - 30, 8)} color="#2E9E5B" text="WON" w={260} />
    <Stamp x={285} y={705} k={ramp(frame, frustrating - 4, 8)} color="#D0402F" text="LOST" w={280} rot={8} />
  </Svg>;
};

/* 3 · Inside the homeowner's head: a large sum of money, and two fears. */
export const HomeownerFear: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [, money, scared, apart, nobody] = cues(p, [9, 86, 109, 126, 179]);
  const fear = ease(ramp(frame, scared - 4, 10));
  const shake = fear > 0 ? Math.sin(frame * 1.7) * 3 * (1 - ramp(frame, scared + 10, 20)) : 0;
  const head = 'M420 900V770C330 750 270 670 270 545C270 365 400 235 560 235C720 235 820 345 830 475L870 565C878 580 868 590 852 591L835 593V655C835 695 805 717 765 713L700 705V900';
  const m = ease(ramp(frame, money - 6, 12));
  const fears = [['Project falls apart?', apart, 560], ['Nobody accountable?', nobody, 640]] as const;
  return <Svg bg="#1C1418">
    <text x="80" y="120" fontFamily={SANS} fontSize="54" fontWeight="850" letterSpacing="-1.5" fill="#FFFFFF" opacity={ramp(frame, 0, 10)}>Inside the homeowner's head</text>
    <g transform={`translate(${shake} 0)`}>
      <path d={head} fill="#2A1E23" stroke={fear > .5 ? '#FF6B5A' : '#E8DCD0'} strokeWidth="8" strokeLinejoin="round" {...draw(ease(ramp(frame, 0, 24)))} />
      <g opacity={m} transform={`translate(550 ${440 - 40 * ease(ramp(frame, apart - 6, 12))}) scale(${back(m) * (1 - .35 * ease(ramp(frame, apart - 6, 12)))})`}>
        <text textAnchor="middle" fontFamily={SANS} fontSize="120" fontWeight="900" letterSpacing="4" fill="#F4B400">$$$$</text>
        <text y="56" textAnchor="middle" fontFamily={SANS} fontSize="30" fontWeight="800" letterSpacing="3" fill="#F4B400">A LARGE AMOUNT</text>
      </g>
      {fears.map(([label, at, y]) => {
        const k = ease(ramp(frame, at - 4, 10));
        return <text key={label} x="550" y={y + (1 - k) * 20} textAnchor="middle" fontFamily={SANS} fontSize="46" fontWeight="850" fill="#FF8A7A" opacity={k}>{label}</text>;
      })}
    </g>
  </Svg>;
};

/* 4 · A bigger named company feels like insurance against that fear. */
export const NameInsurance: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [bigger, insurance] = cues(p, [7, 57, 96]);
  const open = back(ease(ramp(frame, bigger - 4, 16)));
  const cx = 540, top = 260, r = 330;
  const drops = Array.from({length: 26}, (_, i) => {
    const x = 50 + ((i * 137) % 980);
    const y = ((frame * 14 + i * 97) % 900) - 40;
    const under = Math.abs(x - cx) < r * open - 10;
    const stop = top + 230 - Math.sqrt(Math.max(0, (r * open) ** 2 - (x - cx) ** 2)) * .7;
    if (under && y > stop - 30) return null;
    return <path key={i} d={`M${x} ${y}l-6 30`} stroke="#7FA3C6" strokeWidth="5" strokeLinecap="round" />;
  });
  return <Svg bg="#E6ECF2">
    {drops}
    <text x="80" y="120" fontFamily={SANS} fontSize="54" fontWeight="850" letterSpacing="-1.5" fill="#14202B" opacity={ramp(frame, 0, 10)}>A bigger name feels like</text>
    <text x="80" y="190" fontFamily={SANS} fontSize="54" fontWeight="900" letterSpacing="-1.5" fill="#2E5E8C" opacity={ease(ramp(frame, insurance - 4, 10))}>insurance.</text>
    <g transform={`translate(${cx} ${top + 230}) scale(${open} ${clamp(open)})`}>
      <path d={`M${-r} 0A${r} ${r * .7} 0 0 1 ${r} 0Q${r * .66} -30 ${r * .33} 0Q0 -30 ${-r * .33} 0Q${-r * .66} -30 ${-r} 0Z`} fill="#1F3A5F" />
      <text y="-70" textAnchor="middle" fontFamily={SANS} fontSize="54" fontWeight="900" letterSpacing="4" fill="#FFFFFF">BIG NAME</text>
    </g>
    <path d={`M${cx} ${top + 225}V${top + 520}q0 50 -50 50q-40 0 -40 -40`} stroke="#1F3A5F" strokeWidth="14" fill="none" strokeLinecap="round" opacity={clamp(open)} />
    <g transform={`translate(${cx + 150} ${top + 470})`} opacity={clamp(open)}>
      <path d="M-70 0L0-60L70 0V70H-70Z" fill="#FFFFFF" stroke="#14202B" strokeWidth="6" strokeLinejoin="round" />
      <rect x="-16" y="25" width="32" height="45" fill="#14202B" />
    </g>
  </Svg>;
};

/* 5 · Not quality: perception. Polished website, consistent branding. */
export const PerceptionType: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [nothing, quality, perception, website, branding] = cues(p, [16, 59, 121, 181, 226]);
  const strike = ease(ramp(frame, quality + 6, 12));
  const big = back(ease(ramp(frame, perception - 4, 14)));
  const w = ease(ramp(frame, website - 6, 14)), b = ease(ramp(frame, branding - 6, 14));
  const brand = '#E4572E';
  return <Svg bg="#F4EFE6">
    <g opacity={ease(ramp(frame, nothing - 4, 12)) * (1 - .55 * strike)}>
      <text x="540" y="190" textAnchor="middle" fontFamily={SERIF} fontSize="80" fontStyle="italic" fill="#1A1A1A">actual quality</text>
    </g>
    <path d="M250 170L830 165" stroke={brand} strokeWidth="12" strokeLinecap="round" {...draw(strike)} />
    <g transform={`translate(540 410) scale(${big})`} opacity={clamp(big)}>
      <text textAnchor="middle" fontFamily={SANS} fontSize="148" fontWeight="900" letterSpacing="-6" fill="#1A1A1A">PERCEPTION</text>
    </g>
    <g opacity={w} transform={`translate(80 ${490 + (1 - w) * 30})`}>
      <rect width="440" height="270" rx="18" fill="#FFFFFF" stroke="#1A1A1A" strokeWidth="5" />
      <path d="M0 50H440" stroke="#1A1A1A" strokeWidth="5" />
      {[30, 60, 90].map(x => <circle key={x} cx={x} cy="25" r="9" fill={x === 30 ? brand : '#C9C2B6'} />)}
      <rect x="30" y="80" width="190" height="150" rx="10" fill="#D9CDB8" />
      <path d="M30 230L95 160L140 200L175 170L220 230Z" fill="#9C8E77" />
      <rect x="245" y="90" width="165" height="22" rx="11" fill="#1A1A1A" />
      <rect x="245" y="128" width="130" height="14" rx="7" fill="#C9C2B6" />
      <rect x="245" y="186" width="120" height="40" rx="20" fill={brand} />
      <text x="220" y="330" textAnchor="middle" fontFamily={SANS} fontSize="40" fontWeight="850" fill="#1A1A1A">Polished website</text>
    </g>
    <g opacity={b} transform={`translate(580 ${490 + (1 - b) * 30})`}>
      <rect x="0" y="80" width="220" height="120" rx="14" fill={brand} />
      <circle cx="50" cy="210" r="26" fill="#1A1A1A" /><circle cx="170" cy="210" r="26" fill="#1A1A1A" />
      <text x="110" y="152" textAnchor="middle" fontFamily={SANS} fontSize="34" fontWeight="900" fill="#FFFFFF">LOGO</text>
      <path d="M260 60L300 40H380L420 60L400 110H380V230H300V110H280Z" fill={brand} />
      <text x="340" y="120" textAnchor="middle" fontFamily={SANS} fontSize="22" fontWeight="900" fill="#FFFFFF">LOGO</text>
      <text x="210" y="330" textAnchor="middle" fontFamily={SANS} fontSize="40" fontWeight="850" fill="#1A1A1A">Consistent branding</text>
    </g>
  </Svg>;
};

/* 6 · The perception gap is fixable, and not by growing the crew. */
export const PerceptionGap: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [gap, fixable, growing] = cues(p, [55, 120, 192]);
  const g = ease(ramp(frame, gap - 6, 12));
  const planks = 7;
  const crewK = ease(ramp(frame, growing - 6, 10));
  return <Svg bg="#0E2A2A">
    <text x="80" y="120" fontFamily={SANS} fontSize="56" fontWeight="850" letterSpacing="-1.5" fill="#FFFFFF" opacity={ramp(frame, 0, 10)}>The good news:</text>
    <text x="80" y="190" fontFamily={SANS} fontSize="56" fontWeight="850" letterSpacing="-1.5" fill="#7FE0B8" opacity={ease(ramp(frame, fixable - 4, 10))}>the gap is fixable.</text>
    <path d="M0 400H390L410 760H0Z" fill="#1E4A44" /><path d="M1080 400H690L670 760H1080Z" fill="#1E4A44" />
    <text x="195" y="470" textAnchor="middle" fontFamily={SANS} fontSize="30" fontWeight="800" letterSpacing="2" fill="#9CC9BE">HOW GOOD</text>
    <text x="195" y="520" textAnchor="middle" fontFamily={SANS} fontSize="46" fontWeight="900" fill="#FFFFFF">you are</text>
    <text x="885" y="470" textAnchor="middle" fontFamily={SANS} fontSize="30" fontWeight="800" letterSpacing="2" fill="#9CC9BE">HOW GOOD</text>
    <text x="885" y="520" textAnchor="middle" fontFamily={SANS} fontSize="46" fontWeight="900" fill="#FFFFFF">you look</text>
    <g opacity={g * (1 - ease(ramp(frame, fixable + 10, 10)))}>
      <path d="M410 340H670M410 320V360M670 320V360" stroke="#FF8A5B" strokeWidth="6" />
      <text x="540" y="310" textAnchor="middle" fontFamily={SANS} fontSize="34" fontWeight="900" letterSpacing="3" fill="#FF8A5B">PERCEPTION GAP</text>
    </g>
    {Array.from({length: planks}, (_, i) => {
      const k = ease(ramp(frame, fixable - 4 + i * 3, 8));
      return <rect key={i} x={392 + i * 42} y={400 - (1 - k) * 80} width="36" height="26" rx="4" fill="#E9C46A" opacity={k} />;
    })}
    <path d="M390 400H690" stroke="#E9C46A" strokeWidth="4" opacity={ramp(frame, fixable + 20, 8)} />
    <g opacity={crewK} transform="translate(540 830)">
      {[-90, 0, 90].map(x => <g key={x} transform={`translate(${x - 180} 0)`}>
        <circle cy="-30" r="18" fill="#9CC9BE" /><path d="M-26 20Q-26-6 0-6Q26-6 26 20Z" fill="#9CC9BE" />
        <path d="M-22-38Q0-62 22-38Z" fill="#E9C46A" />
      </g>)}
      <path d="M-300-40L-60 30" stroke="#FF6B5A" strokeWidth="9" strokeLinecap="round" {...draw(ease(ramp(frame, growing + 8, 10)))} />
      <text x="-20" y="2" fontFamily={SANS} fontSize="42" fontWeight="850" fill="#FFFFFF">No bigger crew needed</text>
    </g>
  </Svg>;
};

/* 7 · Not big vs small: reliable vs risky. Small crews land on "risky" by accident. */
export const ReliableRisky: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [big, , reliable, risky, contractors, accidentally, option] = cues(p, [30, 49, 90, 142, 179, 214, 288]);
  const strike = ease(ramp(frame, reliable - 8, 10));
  const card = ease(ramp(frame, contractors - 4, 18));
  const tilt = 9 * ease(ramp(frame, contractors + 10, 20));
  const glow = ease(ramp(frame, option - 4, 10));
  const pan = (side: -1 | 1, label: string, color: string, at: number) => {
    const ang = tilt * Math.PI / 180;
    const x = 540 + side * 280 * Math.cos(ang), y = 330 - side * 280 * Math.sin(ang) * -1;
    const k = ease(ramp(frame, at - 4, 10));
    return <g transform={`translate(${x} ${y})`}>
      <path d="M0 0L-120 220M0 0L120 220" stroke="#4A4A3A" strokeWidth="4" />
      <path d="M-160 220H160Q140 290 0 290Q-140 290 -160 220Z" fill={color} opacity={.25 + .75 * k} />
      <text y="370" textAnchor="middle" fontFamily={SANS} fontSize="48" fontWeight="900" fill={color} opacity={k}>{label}</text>
    </g>;
  };
  const ang = tilt * Math.PI / 180;
  const rx = 540 + 280 * Math.cos(ang), ry = 330 + 280 * Math.sin(ang);
  return <Svg bg="#EEF1E6">
    <g opacity={ease(ramp(frame, big - 4, 10)) * (1 - .6 * strike)}>
      <text x="80" y="120" fontFamily={SERIF} fontSize="54" fontStyle="italic" fill="#3A3A2E">Big vs. small?</text>
    </g>
    <path d="M70 102H420" stroke="#C0392B" strokeWidth="8" strokeLinecap="round" {...draw(strike)} />
    <text x="470" y="120" fontFamily={SANS} fontSize="58" fontWeight="900" letterSpacing="-1.5" fill="#1A1A1A" opacity={ease(ramp(frame, reliable - 4, 10))}>Reliable vs. risky</text>
    <path d="M540 330V800M440 800H640" stroke="#4A4A3A" strokeWidth="12" strokeLinecap="round" />
    <path d={`M${540 - 280 * Math.cos(ang)} ${330 - 280 * Math.sin(ang)}L${rx} ${ry}`} stroke="#4A4A3A" strokeWidth="12" strokeLinecap="round" />
    <circle cx="540" cy="330" r="18" fill="#4A4A3A" />
    {pan(-1, 'Feels reliable', '#2E8B57', reliable)}
    {pan(1, 'Feels risky', '#C0392B', risky)}
    <g opacity={card} transform={`translate(${rx} ${ry + 200 - (1 - card) * 260})`}>
      {glow > 0 && <rect x="-150" y="-60" width="300" height="100" rx="20" fill="#C0392B" opacity={.25 * glow} transform={`scale(${1 + .15 * glow})`} />}
      <rect x="-130" y="-48" width="260" height="76" rx="12" fill="#FFFFFF" stroke="#1A1A1A" strokeWidth="4" />
      <text y="2" textAnchor="middle" fontFamily={SANS} fontSize="34" fontWeight="900" fill="#1A1A1A">Small crew</text>
    </g>
    <text x="80" y="230" fontFamily={SERIF} fontSize="40" fontStyle="italic" fill="#C0392B" opacity={ease(ramp(frame, accidentally - 4, 10))}>…by accident</text>
  </Svg>;
};

/* 9 · The fix: real website and proof, a visible process, organized communication. */
export const FixList: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [website, proof, process, clearly, comms, organized, reactive] = cues(p, [45, 66, 112, 153, 181, 218, 258]);
  const row = (y: number, at: number, title: string, children: React.ReactNode) => {
    const k = ease(ramp(frame, at - 6, 12));
    return <g opacity={k} transform={`translate(${(1 - k) * -40} ${y})`}>
      {children}
      <text x="620" y="125" fontFamily={SANS} fontSize="46" fontWeight="900" letterSpacing="-1" fill="#14202B">{title}</text>
    </g>;
  };
  const steps = 4;
  return <Svg bg="#F2F5F9">
    <text x="80" y="110" fontFamily={SANS} fontSize="56" fontWeight="900" letterSpacing="-1.5" fill="#14202B" opacity={ramp(frame, 0, 10)}>Look as solid as you are</text>
    {row(160, website, 'Real website', <>
      <rect x="80" width="500" height="220" rx="16" fill="#FFFFFF" stroke="#C9D2DE" strokeWidth="4" />
      <path d="M80 40H580" stroke="#C9D2DE" strokeWidth="4" />
      {Array.from({length: 4}, (_, i) => {
        const k = ease(ramp(frame, proof - 4 + i * 4, 8));
        return <g key={i} opacity={k} transform={`translate(${104 + i * 117} 62)`}>
          <rect width="104" height="132" rx="8" fill={['#B9C7A5', '#C8B39A', '#A9BCCB', '#C2A5A5'][i]} />
          <path d="M0 132L35 80L60 108L80 90L104 132Z" fill="#00000030" />
        </g>;
      })}
    </>)}
    {row(160, proof, '', <text x="620" y="180" fontFamily={SANS} fontSize="40" fontWeight="800" fill="#2F6FED">+ real proof</text>)}
    {row(420, process, 'Clear process', <>
      <path d="M130 110H530" stroke="#C9D2DE" strokeWidth="6" />
      <path d="M130 110H530" stroke="#2F6FED" strokeWidth="6" {...draw(ease(ramp(frame, clearly - 10, 30)))} />
      {Array.from({length: steps}, (_, i) => {
        const on = ramp(frame, clearly - 10 + i * 8, 6);
        return <g key={i} transform={`translate(${130 + i * 133} 110)`}>
          <circle r="38" fill={on > .5 ? '#2F6FED' : '#FFFFFF'} stroke="#2F6FED" strokeWidth="5" />
          <text y="13" textAnchor="middle" fontFamily={SANS} fontSize="36" fontWeight="900" fill={on > .5 ? '#FFFFFF' : '#2F6FED'}>{i + 1}</text>
        </g>;
      })}
    </>)}
    {row(640, comms, 'Organized', <>
      {[0, 1, 2].map(i => {
        const k = ease(ramp(frame, organized - 6 + i * 6, 8));
        return <g key={i} opacity={k} transform={`translate(${i % 2 ? 220 : 90} ${i * 70})`}>
          <rect width="330" height="56" rx="28" fill={i % 2 ? '#2F6FED' : '#FFFFFF'} stroke="#C9D2DE" strokeWidth={i % 2 ? 0 : 3} />
          <rect x="28" y="22" width={i === 1 ? 200 : 240} height="12" rx="6" fill={i % 2 ? '#FFFFFF' : '#C9D2DE'} />
          <path d="M290 28l8 8l14-16" stroke={i % 2 ? '#FFFFFF' : '#1F9D55'} strokeWidth="5" fill="none" strokeLinecap="round" />
        </g>;
      })}
      <g opacity={ease(ramp(frame, reactive - 4, 10))}>
        <text x="620" y="185" fontFamily={SANS} fontSize="38" fontWeight="800" fill="#8A94A6">not reactive</text>
        <path d="M615 172H845" stroke="#C0392B" strokeWidth="6" strokeLinecap="round" {...draw(ease(ramp(frame, reactive + 6, 8)))} />
      </g>
    </>)}
  </Svg>;
};

/* 10 · Homeowners judge in seconds, before calling, from searching your name. */
export const SecondsSearch: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [seconds, before, phone, searching, online] = cues(p, [59, 94, 134, 207, 232]);
  const q = 'your company name';
  const typed = q.slice(0, Math.max(0, Math.floor((frame - searching + 6) / 1.4)));
  const sw = ease(ramp(frame, seconds - 6, 10));
  const elapsed = clamp((frame - seconds) / 150) * 5;
  const callK = ease(ramp(frame, before - 4, 10));
  const res = (i: number) => ease(ramp(frame, online - 6 + i * 6, 10));
  return <Svg bg="#101418">
    <text x="80" y="110" fontFamily={SANS} fontSize="56" fontWeight="900" letterSpacing="-1.5" fill="#FFFFFF" opacity={ramp(frame, 0, 10)}>Judged in <tspan fill="#FFD400">seconds</tspan></text>
    <g transform="translate(330 160)">
      <rect width="420" height="700" rx="56" fill="#000000" stroke="#3A4250" strokeWidth="6" />
      <rect x="22" y="22" width="376" height="656" rx="40" fill="#F5F7FA" />
      <rect x="44" y="60" width="332" height="64" rx="32" fill="#FFFFFF" stroke="#D5DBE4" strokeWidth="3" opacity={ramp(frame, searching - 30, 10)} />
      <text x="76" y="102" fontFamily={SANS} fontSize="27" fontWeight="600" fill="#1E2430" opacity={ramp(frame, searching - 30, 10)}>{typed}<tspan fill="#2F6FED" opacity={Math.floor(frame / 8) % 2}>|</tspan></text>
      {[['Website', '#2F6FED'], ['Reviews ★★★★★', '#F4B400'], ['Photos of past work', '#1F9D55']].map(([label, c], i) =>
        <g key={label} opacity={res(i)} transform={`translate(44 ${160 + i * 120 + (1 - res(i)) * 20})`}>
          <rect width="332" height="100" rx="14" fill="#FFFFFF" stroke="#E1E6EE" strokeWidth="2" />
          <rect x="18" y="22" width="56" height="56" rx="10" fill={c} />
          <text x="92" y="60" fontFamily={SANS} fontSize="26" fontWeight="800" fill="#1E2430">{label}</text>
        </g>)}
      <g opacity={callK} transform="translate(210 600)">
        <rect x="-150" y="-36" width="300" height="72" rx="36" fill="#1F9D55" opacity={.35} />
        <text y="12" textAnchor="middle" fontFamily={SANS} fontSize="32" fontWeight="900" fill="#FFFFFF" opacity=".7">Call</text>
      </g>
      <text x="210" y="540" textAnchor="middle" fontFamily={SANS} fontSize="26" fontWeight="800" fill="#8A94A6" opacity={ease(ramp(frame, phone - 4, 10)) * (1 - res(0))}>before they call</text>
    </g>
    <g transform="translate(900 320)" opacity={sw}>
      <circle r="100" fill="none" stroke="#2A303B" strokeWidth="18" />
      <circle r="100" fill="none" stroke="#FFD400" strokeWidth="18" strokeDasharray={`${2 * Math.PI * 100 * (elapsed / 5)} 1000`} transform="rotate(-90)" />
      <rect x="-18" y="-140" width="36" height="22" rx="6" fill="#FFD400" />
      <text y="22" textAnchor="middle" fontFamily={SANS} fontSize="64" fontWeight="900" fill="#FFFFFF">{Math.min(5, Math.floor(elapsed) + 1)}s</text>
    </g>
  </Svg>;
};
