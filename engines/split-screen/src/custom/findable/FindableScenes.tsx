import React from 'react';
import {clamp} from '../../motion';
import type {VisualProps} from '../../types';

// Scenes for "easier to find beats better" (job video10). Search results,
// profile and website are generic illustrations, not Google's real interface.
const ramp = (frame: number, start: number, length = 14) => clamp((frame - start) / length);
const ease = (v: number) => 1 - Math.pow(1 - v, 3);
const back = (v: number) => { const c = 1.7; return 1 + (c + 1) * Math.pow(v - 1, 3) + c * Math.pow(v - 1, 2); };
const cues = (p: VisualProps, fallback: number[]) => {
  const data = p.beat.visual.type === 'custom' ? p.beat.visual.props?.cues : undefined;
  return Array.isArray(data) && data.every(n => typeof n === 'number') ? data as number[] : fallback;
};
const SANS = 'Inter, Arial, sans-serif';
const draw = (k: number) => ({pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - k});
const Svg: React.FC<{bg: string; children: React.ReactNode}> = ({bg, children}) =>
  <svg viewBox="0 0 1080 960" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
    <rect width="1080" height="960" fill={bg} />{children}
  </svg>;
const Stars: React.FC<{x: number; y: number; n?: number; s?: number; fill?: string}> = ({x, y, n = 5, s = 1, fill = '#F5B301'}) =>
  <g transform={`translate(${x} ${y}) scale(${s})`}>{Array.from({length: n}, (_, i) => <text key={i} x={i * 26} fontFamily={SANS} fontSize="26" fill={fill}>★</text>)}</g>;
const Check: React.FC<{x: number; y: number; k: number; color: string}> = ({x, y, k, color}) =>
  <path d={`M${x - 16} ${y}l12 12l22-26`} stroke={color} strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round" {...draw(k)} />;
const SearchBar: React.FC<{x: number; y: number; w: number; text: string; chars: number}> = ({x, y, w, text, chars}) =>
  <g transform={`translate(${x} ${y})`}>
    <rect width={w} height="84" rx="42" fill="#FFFFFF" stroke="#DADCE0" strokeWidth="3" />
    <circle cx="48" cy="40" r="15" fill="none" stroke="#5F6368" strokeWidth="5" /><path d="M59 51l12 12" stroke="#5F6368" strokeWidth="5" strokeLinecap="round" />
    <text x="92" y="54" fontFamily={SANS} fontSize="34" fontWeight="600" fill="#202124">{text.slice(0, chars)}{chars < text.length && Math.floor(chars) % 2 === 0 ? '|' : ''}</text>
  </g>;

/* 2 · A homeowner needs a roof, a remodel or paint, and searches for someone in their area. */
export const SearchNeed: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [homeowner, roof, bathroom, paint, google, searching, area] = cues(p, [36, 63, 84, 131, 177, 198, 231]);
  const jobs = [['New roof', roof, 'M-50 20L0-30L50 20Z'], ['Bathroom remodel', bathroom, 'M-46-6H46V10Q46 34 0 34Q-46 34-46 10Z'], ['Paint job', paint, 'M-40-30H30V0H-40ZM20 0V40']] as const;
  const query = 'roofer near me';
  const chars = clamp((frame - searching + 6) / 24) * query.length;
  const pin = back(ease(ramp(frame, area - 6, 12)));
  return <Svg bg="#F1F5FB">
    <text x="80" y="110" fontFamily={SANS} fontSize="50" fontWeight="900" letterSpacing="-1.5" fill="#1A2233" opacity={ease(ramp(frame, homeowner - 8, 10))}>When a homeowner needs…</text>
    {jobs.map(([label, at, d], i) => {
      const k = back(ease(ramp(frame, at - 4, 12)));
      return <g key={label} opacity={clamp(k)} transform={`translate(${200 + i * 340} 290) scale(${k})`}>
        <circle r="92" fill="#FFFFFF" stroke="#C9D6EA" strokeWidth="4" />
        <path d={d} fill="none" stroke="#2F6FED" strokeWidth="9" strokeLinejoin="round" strokeLinecap="round" />
        <text y="150" textAnchor="middle" fontFamily={SANS} fontSize="32" fontWeight="850" fill="#1A2233">{label}</text>
      </g>;
    })}
    <g opacity={ease(ramp(frame, google - 6, 10))}><SearchBar x={120} y={560} w={840} text={query} chars={chars} /></g>
    <g opacity={clamp(pin)} transform={`translate(540 ${800 - 10 * clamp(pin)})`}>
      <path d="M0 0C-26-32-34-46-34-60A34 34 0 0 1 34-60C34-46 26-32 0 0Z" fill="#E5484D" />
      <circle cy="-60" r="12" fill="#FFFFFF" />
      <text x="50" y="-40" fontFamily={SANS} fontSize="34" fontWeight="850" fill="#1A2233">someone in their area</text>
    </g>
  </Svg>;
};

/* 3 · If you're not showing up, they find your competitors; good work doesn't matter if nobody can find you. */
export const MissingFromResults: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [isnt, competitors, good, nobody, find] = cues(p, [26, 102, 189, 225, 245]);
  const rows = ['Competitor Roofing Co.', 'Another Pro Builders', 'Third Guys Remodeling'];
  const you = ease(ramp(frame, good - 8, 12));
  const sink = ease(ramp(frame, nobody - 4, 20));
  return <Svg bg="#FFFFFF">
    <SearchBar x={80} y={60} w={920} text="roofer near me" chars={14} />
    {rows.map((r, i) => {
      const k = ease(ramp(frame, i * 5, 10));
      const hot = frame > competitors - 4;
      return <g key={r} opacity={k} transform={`translate(80 ${190 + i * 140})`}>
        <rect width="920" height="120" rx="18" fill={hot ? '#FFF4F2' : '#F8F9FA'} stroke={hot ? '#E5484D' : '#E8EAED'} strokeWidth="3" />
        <text x="30" y="52" fontFamily={SANS} fontSize="36" fontWeight="850" fill="#1A0DAB">{r}</text>
        <Stars x={30} y={92} s={.9} />
        <text x="190" y="90" fontFamily={SANS} fontSize="24" fontWeight="600" fill="#5F6368">· Open · Call</text>
        {hot && <text x="890" y="72" textAnchor="end" fontFamily={SANS} fontSize="28" fontWeight="900" fill="#E5484D" opacity={ease(ramp(frame, competitors - 4, 10))}>gets the call</text>}
      </g>;
    })}
    <text x="80" y="650" fontFamily={SANS} fontSize="32" fontWeight="800" fill="#9AA0A6" opacity={ease(ramp(frame, isnt - 4, 10)) * (1 - ease(ramp(frame, find - 8, 8)))}>Your business: not here</text>
    <g opacity={you * (1 - .7 * sink)} transform={`translate(80 ${700 + 140 * sink})`}>
      <rect width="920" height="120" rx="18" fill="#F1F8F3" stroke="#1E7A4F" strokeWidth="4" />
      <text x="30" y="52" fontFamily={SANS} fontSize="36" fontWeight="850" fill="#1E7A4F">Your Business</text>
      <Stars x={30} y={92} s={.9} />
      <text x="890" y="72" textAnchor="end" fontFamily={SANS} fontSize="28" fontWeight="900" fill="#1E7A4F">great work</text>
    </g>
    <text x="80" y="650" fontFamily={SANS} fontSize="36" fontWeight="900" fill="#E5484D" opacity={ease(ramp(frame, find - 4, 10))}>…but nobody can find you</text>
  </Svg>;
};

/* 5 · Fill out the business profile: photos, honest reviews, accurate info. */
export const ProfileChecklist: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [profile, fully, photos, reviews, info] = cues(p, [39, 76, 149, 248, 336]);
  const items = [['Profile fully filled out', fully], ['Fresh project photos', photos], ['Honest reviews', reviews], ['Accurate business info', info]] as const;
  const done = items.filter(([, at]) => frame > at + 4).length;
  const pct = ease(clamp((frame - fully + 10) / (info - fully + 20)));
  return <Svg bg="#EAF1EC">
    <text x="80" y="110" fontFamily={SANS} fontSize="50" fontWeight="900" letterSpacing="-1.5" fill="#14281D" opacity={ease(ramp(frame, profile - 8, 10))}>Your business profile</text>
    <g transform="translate(80 170)" opacity={ease(ramp(frame, profile - 6, 12))}>
      <rect width="400" height="640" rx="28" fill="#FFFFFF" stroke="#C7DACD" strokeWidth="3" />
      <rect x="20" y="20" width="360" height="200" rx="16" fill="#D7E7DC" />
      {[0, 1, 2].map(i => <rect key={i} x={30 + i * 118} y="30" width="104" height="180" rx="10" fill={['#9CC3A8', '#7FB08E', '#B9D6C2'][i]} opacity={ease(ramp(frame, photos - 4 + i * 5, 8))} />)}
      <text x="30" y="270" fontFamily={SANS} fontSize="36" fontWeight="900" fill="#14281D">Your Business</text>
      <g opacity={ease(ramp(frame, reviews - 4, 10))}><Stars x={30} y={318} /><text x="170" y="318" fontFamily={SANS} fontSize="26" fontWeight="700" fill="#5F6B63">reviews</text></g>
      {['Hours', 'Phone', 'Service area'].map((l, i) => <g key={l} opacity={ease(ramp(frame, info - 4 + i * 4, 8))}>
        <text x="30" y={380 + i * 56} fontFamily={SANS} fontSize="26" fontWeight="800" fill="#5F6B63">{l}</text>
        <rect x="200" y={362 + i * 56} width="160" height="16" rx="8" fill="#C7DACD" />
      </g>)}
      <rect x="30" y="570" width="340" height="20" rx="10" fill="#E3ECE6" />
      <rect x="30" y="570" width={340 * pct} height="20" rx="10" fill="#1E7A4F" />
      <text x="370" y="620" textAnchor="end" fontFamily={SANS} fontSize="26" fontWeight="900" fill="#1E7A4F">{Math.round(pct * 100)}% complete</text>
    </g>
    {items.map(([label, at], i) => {
      const k = ease(ramp(frame, at - 6, 10));
      return <g key={label} opacity={k} transform={`translate(${530 + (1 - k) * 30} ${220 + i * 150})`}>
        <rect width="480" height="120" rx="22" fill="#FFFFFF" stroke={i < done ? '#1E7A4F' : '#C7DACD'} strokeWidth="3" />
        <circle cx="56" cy="60" r="30" fill={i < done ? '#1E7A4F' : '#E3ECE6'} />
        <Check x={56} y={62} k={ease(ramp(frame, at + 2, 8))} color="#FFFFFF" />
        <text x="104" y="72" fontFamily={SANS} fontSize={label.length > 20 ? 28 : 32} fontWeight="850" fill="#14281D">{label}</text>
      </g>;
    })}
  </Svg>;
};

/* 6 · A website that clearly explains what you do and the areas you serve. */
export const WebsiteAreas: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [website, explains, doWhat, areas] = cues(p, [31, 76, 107, 132]);
  const win = ease(ramp(frame, website - 6, 14));
  const services = ['Roofing', 'Remodels', 'Painting'];
  const towns = ['Your town', 'Next town', 'County'];
  return <Svg bg="#1B1730">
    <g opacity={win} transform={`translate(90 ${80 + (1 - win) * 40})`}>
      <rect width="900" height="780" rx="20" fill="#FFFFFF" />
      <rect width="900" height="60" rx="20" fill="#E9E6F2" /><rect y="40" width="900" height="20" fill="#E9E6F2" />
      {[0, 1, 2].map(i => <circle key={i} cx={34 + i * 30} cy="30" r="9" fill={['#FF5F57', '#FEBC2E', '#28C840'][i]} />)}
      <rect x="140" y="16" width="560" height="28" rx="14" fill="#FFFFFF" />
      <text x="50" y="160" fontFamily={SANS} fontSize="54" fontWeight="900" letterSpacing="-1.5" fill="#1B1730" opacity={ease(ramp(frame, explains - 6, 10))}>Your Business</text>
      <text x="50" y="215" fontFamily={SANS} fontSize="30" fontWeight="600" fill="#5B5670" opacity={ease(ramp(frame, explains, 10))}>Clear about what we do and where.</text>
      <text x="50" y="300" fontFamily={SANS} fontSize="26" fontWeight="900" letterSpacing="3" fill="#7C5CFF" opacity={ease(ramp(frame, doWhat - 6, 10))}>WHAT WE DO</text>
      {services.map((s, i) => {
        const k = back(ease(ramp(frame, doWhat - 4 + i * 5, 10)));
        return <g key={s} opacity={clamp(k)} transform={`translate(${50 + i * 280} 330) scale(${k})`}>
          <rect width="250" height="150" rx="18" fill="#F3F0FF" stroke="#7C5CFF" strokeWidth="3" />
          <text x="125" y="88" textAnchor="middle" fontFamily={SANS} fontSize="34" fontWeight="850" fill="#1B1730">{s}</text>
        </g>;
      })}
      <text x="50" y="560" fontFamily={SANS} fontSize="26" fontWeight="900" letterSpacing="3" fill="#7C5CFF" opacity={ease(ramp(frame, areas - 6, 10))}>AREAS WE SERVE</text>
      {towns.map((t, i) => {
        const k = ease(ramp(frame, areas - 2 + i * 5, 10));
        return <g key={t} opacity={k} transform={`translate(${50 + i * 270} 590)`}>
          <rect width="240" height="70" rx="35" fill="#1B1730" />
          <text x="120" y="46" textAnchor="middle" fontFamily={SANS} fontSize="28" fontWeight="850" fill="#FFFFFF">{t}</text>
        </g>;
      })}
    </g>
  </Svg>;
};

/* 7 · Not just knowing you exist: showing up when they're actively looking to hire. */
export const ExistsVsHiring: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [know, exists, showUp, looking, hire] = cues(p, [52, 76, 127, 168, 202]);
  const L = ease(ramp(frame, know - 6, 12)), R = ease(ramp(frame, showUp - 6, 12));
  const rise = ease(ramp(frame, looking - 4, 16));
  return <Svg bg="#0F172A">
    <path d="M540 120V860" stroke="#1E293B" strokeWidth="4" />
    <g opacity={L * (1 - .45 * R)}>
      <text x="270" y="140" textAnchor="middle" fontFamily={SANS} fontSize="40" fontWeight="900" fill="#94A3B8">Knowing you exist</text>
      <rect x="90" y="220" width="360" height="200" rx="14" fill="#1E293B" stroke="#334155" strokeWidth="4" />
      <path d="M270 420V560" stroke="#334155" strokeWidth="14" />
      <text x="270" y="335" textAnchor="middle" fontFamily={SANS} fontSize="40" fontWeight="900" fill="#CBD5E1" opacity={ease(ramp(frame, exists - 4, 10))}>Your Business</text>
      {[0, 1, 2].map(i => {
        const x = 120 + ((frame * 2 + i * 120) % 320);
        return <g key={i} transform={`translate(${x} 680)`}><circle cy="-46" r="20" fill="#475569" /><path d="M-30 30Q-30-20 0-20Q30-20 30 30Z" fill="#475569" /></g>;
      })}
      <text x="270" y="790" textAnchor="middle" fontFamily={SANS} fontSize="28" fontWeight="700" fill="#64748B">walking past, not hiring</text>
    </g>
    <g opacity={R}>
      <text x="810" y="140" textAnchor="middle" fontFamily={SANS} fontSize="40" fontWeight="900" fill="#FDE047">Showing up to hire</text>
      <rect x="600" y="220" width="420" height="70" rx="35" fill="#FFFFFF" />
      <text x="640" y="266" fontFamily={SANS} fontSize="28" fontWeight="700" fill="#202124">roofer near me</text>
      {[0, 1, 2].map(i => {
        const isYou = i === 0;
        const yy = isYou ? 330 + 260 * (1 - rise) : 330 + 130 * (i - 1 + rise);
        return <g key={i} transform={`translate(600 ${yy})`} opacity={isYou ? 1 : .55}>
          <rect width="420" height="110" rx="16" fill={isYou ? '#FDE047' : '#1E293B'} />
          <text x="24" y="50" fontFamily={SANS} fontSize="30" fontWeight="900" fill={isYou ? '#0F172A' : '#94A3B8'}>{isYou ? 'Your Business' : 'Competitor'}</text>
          <Stars x={24} y={88} s={.8} fill={isYou ? '#0F172A' : '#F5B301'} />
        </g>;
      })}
      <g opacity={ease(ramp(frame, hire - 4, 10))} transform="translate(810 800)">
        <rect x="-170" y="-40" width="340" height="80" rx="40" fill="#22C55E" />
        <text y="14" textAnchor="middle" fontFamily={SANS} fontSize="36" fontWeight="900" fill="#0F172A">Ready to hire</text>
      </g>
    </g>
  </Svg>;
};
