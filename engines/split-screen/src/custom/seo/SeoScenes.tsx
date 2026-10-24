import React from 'react';
import {clamp} from '../../motion';
import type {VisualProps} from '../../types';

// Scenes for "stop renting shared leads" (job video2). Cues are local frames
// inside each beat, taken from word timings in the plan's props.cues.
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

/* 2 · Price keeps going up while quality keeps going down. */
export const PriceQuality: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [angi, ha, price, quality] = cues(p, [5, 27, 125, 177]);
  const pk = ease(ramp(frame, price - 4, 34));
  const qk = ease(ramp(frame, quality - 4, 34));
  return <svg viewBox="0 0 1080 960" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
    <rect width="1080" height="960" fill="#1A1416" />
    <text x="80" y="130" fontFamily={SANS} fontSize="60" fontWeight="850" letterSpacing="-2" fill="#FFFFFF" opacity={ramp(frame, 0, 10)}>Paying for shared leads on</text>
    {[['Angie\'s', angi, 80], ['HomeAdvisor', ha, 330]].map(([label, at, x]) => <g key={label as string} opacity={ease(ramp(frame, (at as number) - 4, 10))} transform={`translate(${x} 170)`}>
      <rect width={(label as string).length * 27 + 50} height="70" rx="35" fill="#2C2326" stroke="#4A3C40" strokeWidth="2" />
      <text x={((label as string).length * 27 + 50) / 2} y="47" textAnchor="middle" fontFamily={SANS} fontSize="38" fontWeight="800" fill="#FFFFFF">{label as string}</text>
    </g>)}
    <path d="M120 820H960M120 820V320" stroke="#4A3C40" strokeWidth="4" fill="none" />
    <path d="M120 720C300 700 420 640 560 560S820 380 960 330" stroke="#FF6B4A" strokeWidth="10" fill="none" strokeLinecap="round" {...draw(pk)} />
    <path d="M120 420C300 440 420 500 560 580S820 730 960 770" stroke="#8FA3B8" strokeWidth="10" fill="none" strokeLinecap="round" {...draw(qk)} />
    <g opacity={ramp(frame, price + 22, 10)}><text x="955" y="300" textAnchor="end" fontFamily={SANS} fontSize="42" fontWeight="900" fill="#FF6B4A">PRICE ↑</text></g>
    <g opacity={ramp(frame, quality + 22, 10)}><text x="955" y="880" textAnchor="end" fontFamily={SANS} fontSize="42" fontWeight="900" fill="#8FA3B8">QUALITY ↓</text></g>
  </svg>;
};

/* 4 · One of five to ten contractors bidding on the same homeowner. */
export const OneOfTen: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [five, ten, shop, wasted, margins] = cues(p, [41, 57, 194, 238, 282]);
  const cx = 540, cy = 430, r = 215;
  const count = frame < five - 4 ? 0 : frame < ten ? Math.min(5, Math.floor((frame - five + 4) / 3) + 1) : Math.min(10, 5 + Math.floor((frame - ten) / 3) + 1);
  const chips = [['Price shopping', shop], ['Wasted quotes', wasted], ['Thinner margins', margins]] as const;
  return <svg viewBox="0 0 1080 960" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
    <rect width="1080" height="960" fill="#F1E6D4" />
    <text x="540" y="120" textAnchor="middle" fontFamily={SERIF} fontSize="62" fontWeight="700" fill="#2B2118" opacity={ramp(frame, 0, 10)}>One homeowner. <tspan fill="#C4501E">{count > 0 ? (count <= 5 ? '5' : count) : '…'}</tspan>{count > 5 ? '' : count > 0 ? '+' : ''} bidders.</text>
    <circle cx={cx} cy={cy} r={r} fill="none" stroke="#D8C6A8" strokeWidth="3" strokeDasharray="10 12" />
    <g transform={`translate(${cx} ${cy})`}>
      <circle r="92" fill="#FFFFFF" stroke="#2B2118" strokeWidth="5" />
      <path d="M-46 8L0-34L46 8V48H-46Z" fill="#2B2118" />
      <rect x="-12" y="20" width="24" height="28" fill="#FFFFFF" />
    </g>
    {Array.from({length: 10}, (_, i) => {
      const a = -Math.PI / 2 + i * Math.PI * 2 / 10;
      const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
      const on = i < count;
      const s = on ? back(ease(clamp((frame - (i < 5 ? five - 4 + i * 3 : ten + (i - 5) * 3)) / 8))) : 0;
      return <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
        <path d={`M0 0L${(cx - x) * .3} ${(cy - y) * .3}`} stroke="#C4501E" strokeWidth="4" strokeDasharray="6 6" />
        <circle r="44" fill="#C4501E" />
        <path d="M-26 6Q-26-24 0-24Q26-24 26 6Z" fill="#FFD9A0" />
        <rect x="-32" y="4" width="64" height="9" rx="4" fill="#FFD9A0" />
        <text y="38" textAnchor="middle" fontFamily={SANS} fontSize="20" fontWeight="900" fill="#FFFFFF">$</text>
      </g>;
    })}
    {chips.map(([label, at], i) => {
      const k = ease(ramp(frame, at - 6, 12));
      return <g key={label} opacity={k} transform={`translate(${60 + i * 330} ${745 + (1 - k) * 20})`}>
        <rect width="300" height="80" rx="16" fill="#2B2118" />
        <text x="150" y="51" textAnchor="middle" fontFamily={SANS} fontSize="32" fontWeight="800" fill="#FFFFFF">{label}</text>
      </g>;
    })}
  </svg>;
};

/* 5 · The real opportunity: search engine positioning, SEO. */
export const SeoWord: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [real, search, engine, positioning, seo] = cues(p, [17, 112, 122, 134, 167]);
  const s = back(ease(ramp(frame, seo - 4, 14)));
  return <svg viewBox="0 0 1080 960" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
    <rect width="1080" height="960" fill="#0E0E0E" />
    <text x="80" y="170" fontFamily={SERIF} fontSize="58" fontStyle="italic" fill="#FFFFFF" opacity={ease(ramp(frame, real - 6, 12))}>The real opportunity:</text>
    {[['Search', search, 80], ['engine', engine, 330], ['positioning', positioning, 580]].map(([w, at, x]) =>
      <text key={w as string} x={x as number} y="290" fontFamily={SANS} fontSize="66" fontWeight="800" letterSpacing="-2" fill="#FFFFFF" opacity={ease(ramp(frame, (at as number) - 4, 8)) * (1 - .55 * ease(ramp(frame, seo, 10)))}>{w as string}</text>)}
    <g transform={`translate(540 700) scale(${s})`} opacity={clamp(s)}>
      <text y="0" textAnchor="middle" fontFamily={SANS} fontSize="380" fontWeight="900" letterSpacing="-16" fill="#FFD400">SEO</text>
    </g>
    <rect x="80" y="320" width={920 * ease(ramp(frame, positioning, 24))} height="10" fill="#FFD400" />
  </svg>;
};

/* 6 · Google shows three results first, and most calls go there. */
export const SearchTop3: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [contractor, roofer, google, three, calls, seventy] = cues(p, [33, 88, 113, 136, 211, 246]);
  const q1 = 'contractor near me', q2 = 'roofer near me';
  const typed = frame < roofer - 10 ? q1.slice(0, Math.max(0, Math.floor((frame - contractor + 8) / 1.3))) : frame < roofer ? q1.slice(0, Math.max(0, q1.length - Math.floor((frame - roofer + 10) * 2))) : q2.slice(0, Math.floor((frame - roofer) / 1.2) + 1);
  const ring = ease(ramp(frame, seventy - 4, 30)) * .7;
  const top = ease(ramp(frame, three - 4, 12));
  const ringR = 135, circ = 2 * Math.PI * ringR;
  return <svg viewBox="0 0 1080 960" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
    <rect width="1080" height="960" fill="#F3F5F8" />
    <g transform="translate(80 90)">
      <rect width="920" height="96" rx="48" fill="#FFFFFF" stroke="#D5DBE4" strokeWidth="3" />
      <circle cx="58" cy="44" r="18" fill="none" stroke="#5B6575" strokeWidth="5" /><path d="M71 58L84 71" stroke="#5B6575" strokeWidth="6" strokeLinecap="round" />
      <text x="110" y="62" fontFamily={SANS} fontSize="42" fontWeight="600" fill="#1E2430">{typed}<tspan fill="#2F6FED" opacity={Math.floor(frame / 8) % 2}>|</tspan></text>
    </g>
    {Array.from({length: 5}, (_, i) => {
      const k = ease(ramp(frame, google - 6 + i * 3, 10));
      const hi = i < 3 ? top : 0;
      const y = 236 + i * 108;
      return <g key={i} opacity={k * (i < 3 ? 1 : 1 - .6 * top)} transform={`translate(80 ${y})`}>
        <rect width="560" height="92" rx="14" fill="#FFFFFF" stroke={hi > .5 ? '#1F9D55' : '#E1E6EE'} strokeWidth={hi > .5 ? 5 : 2} />
        <rect x="90" y="24" width={i % 2 ? 300 : 360} height="18" rx="9" fill={hi > .5 ? '#1E2430' : '#C9D0DB'} />
        <rect x="90" y="54" width={i % 2 ? 220 : 260} height="14" rx="7" fill="#E1E6EE" />
        <circle cx="46" cy="46" r="26" fill={hi > .5 ? '#1F9D55' : '#E1E6EE'} />
        {i < 3 && <text x="46" y="57" textAnchor="middle" fontFamily={SANS} fontSize="30" fontWeight="900" fill="#FFFFFF" opacity={hi}>{i + 1}</text>}
        {i < 3 && [0, 1].map(j => { const c = ease(ramp(frame, calls - 4 + i * 5 + j * 12, 14)); return <g key={j} opacity={c < 1 ? c * 1.4 : 0} transform={`translate(${500 + (1 - c) * 300} 46)`}>
          <circle r="22" fill="#1F9D55" /><path d="M-9-8Q-10 2-2 9T9 9L9 4L3 2L0 5Q-4 3-5-1L-2-3L-4-9Z" fill="#FFFFFF" />
        </g>; })}
      </g>;
    })}
    <g transform="translate(850 470)" opacity={ramp(frame, seventy - 8, 10)}>
      <circle r={ringR} fill="none" stroke="#DCE2EA" strokeWidth="34" />
      <circle r={ringR} fill="none" stroke="#1F9D55" strokeWidth="34" strokeDasharray={`${circ * ring} ${circ}`} transform="rotate(-90)" />
      <text y="22" textAnchor="middle" fontFamily={SANS} fontSize="64" fontWeight="900" fill="#1E2430">~{Math.round(ring * 100)}%</text>
      <text y={ringR + 62} textAnchor="middle" fontFamily={SANS} fontSize="28" fontWeight="700" fill="#5B6575">of search traffic</text>
      <text y={-ringR - 40} textAnchor="middle" fontFamily={SANS} fontSize="26" fontWeight="800" fill="#1F9D55">TOP 3 RESULTS</text>
    </g>
  </svg>;
};

/* 7 · Each service page becomes its own entry point. */
export const ServicePages: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [build, stamped, retaining, kitchen, whatever, entry] = cues(p, [129, 270, 312, 338, 368, 476]);
  const rows = [['stamped concrete', 'Stamped Concrete', stamped], ['retaining walls', 'Retaining Walls', retaining], ['kitchen remodel', 'Kitchen Remodels', kitchen], ['…near me', '+ Every service', whatever]] as const;
  const site = ease(ramp(frame, build - 6, 14));
  const flip = ease(ramp(frame, entry - 8, 12));
  return <svg viewBox="0 0 1080 960" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
    <rect width="1080" height="960" fill="#EAF1EC" />
    <g fontFamily={SANS} fontSize="58" fontWeight="850" letterSpacing="-2" fill="#12312B">
      <text x="60" y="120" opacity={ramp(frame, 0, 10) * (1 - flip)}>Built around real searches</text>
      <text x="60" y="120" opacity={flip}>Every service = a way in</text>
    </g>
    <g opacity={site} transform={`translate(500 ${180 + (1 - site) * 30})`}>
      <rect width="520" height="660" rx="22" fill="#FFFFFF" stroke="#C9D8CF" strokeWidth="3" />
      <rect width="520" height="64" rx="22" fill="#12312B" /><rect y="40" width="520" height="24" fill="#12312B" />
      {[0, 1, 2].map(i => <circle key={i} cx={34 + i * 26} cy="32" r="8" fill="#FFFFFF" opacity=".5" />)}
      <text x="130" y="42" fontFamily={SANS} fontSize="26" fontWeight="700" fill="#FFFFFF">yourcompany.com</text>
    </g>
    {rows.map(([query, page, at], i) => {
      const k = ease(ramp(frame, at - 6, 12));
      const arrow = ease(ramp(frame, entry - 6 + i * 5, 14));
      const y = 290 + i * 135;
      return <g key={page}>
        <g opacity={k} transform={`translate(${530 + (1 - k) * 40} ${y - 50})`}>
          <rect width="460" height="100" rx="16" fill={i === 3 ? '#FFFFFF' : '#E3F2EC'} stroke="#1F8A70" strokeWidth={i === 3 ? 3 : 0} strokeDasharray={i === 3 ? '10 8' : undefined} />
          <rect x="24" y="30" width="40" height="40" rx="8" fill="#1F8A70" />
          <text x="86" y="62" fontFamily={SANS} fontSize="34" fontWeight="800" fill="#12312B">{page}</text>
        </g>
        <g opacity={arrow}>
          <rect x="40" y={y - 34} width="350" height="68" rx="34" fill="#FFFFFF" stroke="#C9D8CF" strokeWidth="2" />
          <circle cx="78" cy={y - 2} r="11" fill="none" stroke="#5B6B64" strokeWidth="4" />
          <text x="102" y={y + 10} fontFamily={SANS} fontSize="28" fontWeight="600" fill="#12312B">{query}</text>
          <path d={`M398 ${y}H516`} stroke="#1F8A70" strokeWidth="6" strokeLinecap="round" {...draw(arrow)} />
          <path d={`M502 ${y - 12}L518 ${y}L502 ${y + 12}`} stroke="#1F8A70" strokeWidth="6" fill="none" strokeLinecap="round" opacity={clamp(arrow * 2 - 1)} />
        </g>
      </g>;
    })}
  </svg>;
};

/* 8 · The website stops being a business card and starts generating calls. */
export const CardToCalls: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [ranking, card, generating, calls] = cues(p, [14, 89, 122, 137]);
  const t = ramp(frame, generating - 8, 16);
  const sx = Math.abs(Math.cos(t * Math.PI));
  const showPhone = t > .5;
  const callCount = showPhone ? Math.min(4, Math.floor((frame - calls) / 22) + 1) : 0;
  return <svg viewBox="0 0 1080 960" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
    <rect width="1080" height="960" fill="#10241B" />
    <text x="80" y="130" fontFamily={SANS} fontSize="58" fontWeight="850" letterSpacing="-2" fill="#FFFFFF" opacity={ramp(frame, ranking - 10, 10)}>Once you rank locally…</text>
    <g transform={`translate(540 500) scale(${Math.max(.02, sx)} 1)`}>
      {!showPhone ? <g opacity={ramp(frame, 0, 10)}>
        <rect x="-330" y="-190" width="660" height="380" rx="20" fill="#000000" opacity=".3" transform="translate(10 14)" />
        <rect x="-330" y="-190" width="660" height="380" rx="20" fill="#F7F4EC" />
        <text x="-270" y="-70" fontFamily={SERIF} fontSize="56" fontWeight="700" fill="#10241B">Your Company</text>
        <text x="-270" y="-14" fontFamily={SANS} fontSize="28" fontWeight="600" fill="#5E6B64">Roofing · Concrete · Remodels</text>
        <path d="M-270 50H270" stroke="#D8D2C2" strokeWidth="3" />
        <text x="-270" y="120" fontFamily={SANS} fontSize="30" fontWeight="700" fill="#10241B">yourcompany.com</text>
        <text x="270" y="-110" textAnchor="end" fontFamily={SANS} fontSize="22" fontWeight="800" letterSpacing="3" fill="#A69E8A" opacity={ramp(frame, card - 4, 10)}>BUSINESS CARD</text>
      </g> : <g>
        <rect x="-190" y="-330" width="380" height="660" rx="48" fill="#0A1712" stroke="#4FD69C" strokeWidth="6" />
        <rect x="-60" y="-306" width="120" height="16" rx="8" fill="#1E3A2D" />
        {Array.from({length: callCount}, (_, i) => {
          const k = ease(ramp(frame, calls + i * 22, 10));
          return <g key={i} opacity={k} transform={`translate(0 ${-230 + i * 130 + (1 - k) * -30})`}>
            <rect x="-160" y="-50" width="320" height="104" rx="18" fill="#1E3A2D" />
            <circle cx="-108" cy="2" r="30" fill="#4FD69C" />
            <path d="M-120-10Q-121 2-112 11T-96 12L-96 6L-103 3L-107 7Q-112 4-113-1L-109-4L-112-11Z" fill="#0A1712" />
            <text x="-62" y="-6" fontFamily={SANS} fontSize="26" fontWeight="800" fill="#FFFFFF">Incoming call</text>
            <text x="-62" y="28" fontFamily={SANS} fontSize="20" fontWeight="600" fill="#9CC9B3">from your website</text>
          </g>;
        })}
      </g>}
    </g>
  </svg>;
};

/* 10 · What a contractor running this right can see, per the speaker. */
export const OrganicNumbers: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [forty, twenty, without] = cues(p, [67, 158, 269]);
  const row = (at: number, big: string, sub: string, y: number) => {
    const k = back(ease(ramp(frame, at - 4, 14)));
    return <g opacity={clamp(k)} transform={`translate(80 ${y})`}>
      <text fontFamily={SANS} fontSize="190" fontWeight="900" letterSpacing="-8" fill="#C6F432" transform={`scale(${.8 + .2 * k})`}>{big}</text>
      <text x="0" y="62" fontFamily={SANS} fontSize="40" fontWeight="700" fill="#FFFFFF">{sub}</text>
    </g>;
  };
  const strike = ease(ramp(frame, without + 6, 12));
  return <svg viewBox="0 0 1080 960" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
    <rect width="1080" height="960" fill="#0B0B0B" />
    <text x="80" y="110" fontFamily={SANS} fontSize="40" fontWeight="700" fill="#9A9A9A" opacity={ramp(frame, 0, 10)}>Run the right way, a contractor can see</text>
    {row(forty, '40–60', 'organic calls a month', 320)}
    {row(twenty, '20–30', 'website leads a month', 590)}
    <g opacity={ease(ramp(frame, without - 4, 10))} transform="translate(80 730)">
      <rect width="120" height="76" rx="12" fill="none" stroke="#FFFFFF" strokeWidth="5" />
      <text x="60" y="52" textAnchor="middle" fontFamily={SANS} fontSize="38" fontWeight="900" fill="#FFFFFF">AD</text>
      <path d="M-10 86L130-10" stroke="#FF4D4D" strokeWidth="9" strokeLinecap="round" {...draw(strike)} />
      <text x="160" y="52" fontFamily={SANS} fontSize="46" fontWeight="850" fill="#FFFFFF">without running ads</text>
    </g>
  </svg>;
};

/* 11 · A rented lead vs. a lead that found you directly. */
const Node: React.FC<{x: number; y: number; label: string; fill: string; ink: string; k: number}> = ({x, y, label, fill, ink, k}) =>
  <g opacity={k} transform={`translate(${x} ${y}) scale(${.85 + .15 * k})`}>
    <rect x="-170" y="-46" width="340" height="92" rx="46" fill={fill} />
    <text y="14" textAnchor="middle" fontFamily={SANS} fontSize="36" fontWeight="850" fill={ink}>{label}</text>
  </g>;
export const RentVsOwn: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [renting, platform, owns, found, directly, trusting, first] = cues(p, [30, 52, 76, 165, 180, 222, 266]);
  const L = 270, R = 810;
  const right = ease(ramp(frame, found - 8, 12));
  const trust = ease(ramp(frame, trusting - 4, 30));
  return <svg viewBox="0 0 1080 960" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
    <rect width="540" height="960" fill="#EFEAF8" />
    <rect x="540" width="540" height="960" fill="#E2F5EE" />
    <text x={L} y="120" textAnchor="middle" fontFamily={SANS} fontSize="50" fontWeight="900" fill="#3D2F6B" opacity={ease(ramp(frame, renting - 8, 10))}>Rented</text>
    <text x={R} y="120" textAnchor="middle" fontFamily={SANS} fontSize="50" fontWeight="900" fill="#0F5C46" opacity={right}>Found you</text>
    <Node x={L} y={260} label="Homeowner" fill="#FFFFFF" ink="#3D2F6B" k={ease(ramp(frame, renting - 4, 10))} />
    <path d={`M${L} 306V444`} stroke="#3D2F6B" strokeWidth="6" {...draw(ease(ramp(frame, platform - 6, 12)))} />
    <Node x={L} y={490} label="Platform" fill="#3D2F6B" ink="#FFFFFF" k={ease(ramp(frame, platform - 4, 10))} />
    <g opacity={ease(ramp(frame, owns - 4, 10))} transform={`translate(${L + 150} 450)`}>
      <rect x="-22" y="-6" width="44" height="36" rx="6" fill="#FF7A59" /><path d="M-13-6V-16Q0-32 13-16V-6" stroke="#FF7A59" strokeWidth="6" fill="none" />
    </g>
    <path d={`M${L} 536V674`} stroke="#3D2F6B" strokeWidth="6" strokeDasharray="12 10" opacity={ease(ramp(frame, platform + 8, 12))} />
    <Node x={L} y={720} label="You + 9 others" fill="#FFFFFF" ink="#3D2F6B" k={ease(ramp(frame, platform + 10, 10))} />
    <g opacity={right}>
      <Node x={R} y={260} label="Homeowner" fill="#FFFFFF" ink="#0F5C46" k={1} />
      <path d={`M${R} 306V674`} stroke="#0F5C46" strokeWidth="10" strokeLinecap="round" {...draw(ease(ramp(frame, directly - 6, 18)))} />
      <Node x={R} y={720} label="You" fill="#0F5C46" ink="#FFFFFF" k={ease(ramp(frame, directly + 6, 10))} />
      <g transform={`translate(${R + 60} 400)`} opacity={ramp(frame, trusting - 8, 8)}>
        <text x="0" y="-10" fontFamily={SANS} fontSize="24" fontWeight="800" letterSpacing="2" fill="#0F5C46">TRUST</text>
        <rect y="10" width="150" height="20" rx="10" fill="#BFE6D7" />
        <rect y="10" width={150 * trust} height="20" rx="10" fill="#0F5C46" />
      </g>
      <g opacity={ease(ramp(frame, first - 6, 10))} transform={`translate(${R - 150} 540) rotate(-6)`}>
        <rect x="-70" y="-34" width="140" height="68" rx="12" fill="#FFD400" />
        <text y="12" textAnchor="middle" fontFamily={SANS} fontSize="30" fontWeight="900" fill="#111111">#1 spot</text>
      </g>
    </g>
  </svg>;
};

/* 13 · It compounds instead of resetting to zero every month. */
export const CompoundVsReset: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [different, compounds, resetting, playbook] = cues(p, [7, 65, 101, 166]);
  const x0 = 110, x1 = 970, base = 780, months = 8, w = (x1 - x0) / months;
  const saw = Array.from({length: months}, (_, i) => `M${x0 + i * w} ${base}L${x0 + (i + 1) * w - 6} ${base - 150}L${x0 + (i + 1) * w - 6} ${base}`).join('');
  const curve = `M${x0} ${base}` + Array.from({length: 40}, (_, i) => { const t = (i + 1) / 40; return `L${x0 + t * (x1 - x0)} ${base - 450 * Math.pow(t, 1.8)}`; }).join('');
  return <svg viewBox="0 0 1080 960" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
    <rect width="1080" height="960" fill="#0F1626" />
    <text x="80" y="125" fontFamily={SANS} fontSize="60" fontWeight="850" letterSpacing="-2" fill="#FFFFFF" opacity={ease(ramp(frame, different - 6, 10))}>A different system</text>
    <path d={`M${x0} ${base}H${x1}`} stroke="#33405A" strokeWidth="4" />
    {Array.from({length: months}, (_, i) => <text key={i} x={x0 + (i + .5) * w} y={base + 44} textAnchor="middle" fontFamily={SANS} fontSize="22" fontWeight="700" fill="#6F7E99">M{i + 1}</text>)}
    <path d={curve} stroke="#3DDC97" strokeWidth="10" fill="none" strokeLinecap="round" {...draw(ease(ramp(frame, compounds - 6, 36)))} />
    <path d={saw} stroke="#FF5A4E" strokeWidth="6" fill="none" strokeLinejoin="round" {...draw(ease(ramp(frame, resetting - 6, 36)))} />
    <text x={x1} y={base - 480} textAnchor="end" fontFamily={SANS} fontSize="40" fontWeight="900" fill="#3DDC97" opacity={ramp(frame, compounds + 16, 10)}>SEO compounds</text>
    <text x={x0 + 10} y={base - 180} fontFamily={SANS} fontSize="34" fontWeight="900" fill="#FF8A80" opacity={ramp(frame, resetting + 16, 10)}>Shared leads reset to zero</text>
    <g opacity={ease(ramp(frame, playbook - 6, 12))} transform="translate(80 210)">
      <rect width="300" height="64" rx="32" fill="#3DDC97" />
      <text x="150" y="43" textAnchor="middle" fontFamily={SANS} fontSize="30" fontWeight="900" fill="#0F1626">The playbook</text>
    </g>
  </svg>;
};
