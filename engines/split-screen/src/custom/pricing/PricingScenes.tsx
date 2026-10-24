import React from 'react';
import {clamp} from '../../motion';
import type {VisualProps} from '../../types';

// Scenes for "stop underpricing out of fear" (job video11). Price, profit and
// budget bars are qualitative; no figures are given in the source.
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
// In a full-screen (taller than wide) panel the 1080x960 core sits high so captions stay clear below it.
const Svg: React.FC<{p: VisualProps; bg: string; children: React.ReactNode}> = ({p, bg, children}) =>
  <svg viewBox={p.height > p.width ? '0 -300 1080 1920' : '0 0 1080 960'} width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
    <rect y="-480" width="1080" height="1920" fill={bg} />{children}
  </svg>;
const Check: React.FC<{x: number; y: number; k: number; color: string}> = ({x, y, k, color}) =>
  <path d={`M${x - 16} ${y}l12 12l22-26`} stroke={color} strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round" {...draw(k)} />;
const Person: React.FC<{x: number; y: number; s?: number; fill: string}> = ({x, y, s = 1, fill}) =>
  <g transform={`translate(${x} ${y}) scale(${s})`}><circle cy="-46" r="26" fill={fill} /><path d="M-44 30Q-44-14 0-14Q44-14 44 30Z" fill={fill} /></g>;

/* 2 · Afraid the customer will pick someone else, contractors lower prices: they win, profit shrinks. */
export const FearDiscount: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [contractors, lower, afraid, someone, win, hurts] = cues(p, [54, 72, 125, 166, 228, 276]);
  const drop = ease(ramp(frame, lower - 4, 40));
  const priceH = 380 * (1 - .45 * drop);
  const ghost = ease(ramp(frame, someone - 6, 12));
  const won = back(ease(ramp(frame, win - 4, 12)));
  const profit = 120 * (1 - .8 * ease(ramp(frame, hurts - 4, 18)));
  return <Svg p={p} bg="#FFF4E8">
    <text x="80" y="110" fontFamily={SANS} fontSize="48" fontWeight="900" letterSpacing="-1.5" fill="#2A1A0E" opacity={ease(ramp(frame, contractors - 8, 10))}>Scared of losing the job…</text>
    <g transform="translate(140 820)" opacity={ease(ramp(frame, contractors - 4, 10))}>
      <rect x="0" y={-priceH} width="220" height={priceH} rx="14" fill="#E07A1F" />
      <rect x="0" y={-priceH} width="220" height={Math.min(profit, priceH)} rx="14" fill="#1E7A4F" />
      <text x="110" y={-priceH + Math.min(profit, priceH) / 2 + 12} textAnchor="middle" fontFamily={SANS} fontSize="30" fontWeight="900" fill="#FFFFFF" opacity={profit > 40 ? 1 : 0}>Profit</text>
      <text x="110" y="50" textAnchor="middle" fontFamily={SANS} fontSize="32" fontWeight="900" fill="#2A1A0E">Your price</text>
      {drop > .05 && drop < .98 && <path d={`M260 ${-priceH - 40}v60m-20-20l20 20l20-20`} stroke="#C0392B" strokeWidth="8" fill="none" strokeLinecap="round" />}
    </g>
    <path d="M140 440H360" stroke="#2A1A0E" strokeWidth="3" strokeDasharray="10 8" opacity={drop} />
    <text x="380" y="450" fontFamily={SANS} fontSize="26" fontWeight="800" fill="#8C6A4E" opacity={drop}>where it was</text>
    <g transform="translate(720 500)">
      <Person x={0} y={0} s={1.6} fill="#5B4632" />
      <g opacity={ease(ramp(frame, afraid - 6, 10))} transform="translate(-10 -210)">
        <ellipse rx="170" ry="70" fill="#FFFFFF" />
        <text y="12" textAnchor="middle" fontFamily={SANS} fontSize="34" fontWeight="850" fill="#2A1A0E">Too expensive?</text>
      </g>
      <g opacity={ghost * (1 - clamp(won))} transform="translate(200 0)"><Person x={0} y={0} s={1.3} fill="#C9B79C" /><text y="90" textAnchor="middle" fontFamily={SANS} fontSize="26" fontWeight="800" fill="#8C6A4E">someone else</text></g>
    </g>
    <g opacity={clamp(won)} transform={`translate(720 700) scale(${won})`}>
      <rect x="-150" y="-44" width="300" height="88" rx="44" fill="#1E7A4F" />
      <text y="16" textAnchor="middle" fontFamily={SANS} fontSize="40" fontWeight="900" fill="#FFFFFF">Job won ✓</text>
    </g>
    <text x="720" y="830" textAnchor="middle" fontFamily={SANS} fontSize="36" fontWeight="900" fill="#C0392B" opacity={ease(ramp(frame, hurts - 4, 10))}>…profit hurt</text>
  </Svg>;
};

/* 3 · Same work for less money: less room for unexpected costs, paying your crew, and profit. */
export const LessRoom: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [same, work, less, room, unexpected, crew, profit] = cues(p, [72, 95, 110, 169, 184, 239, 299]);
  const shrink = ease(ramp(frame, less - 4, 20));
  const W = 840 * (1 - .4 * shrink);
  const parts = [['Unexpected costs', unexpected, '#E5484D'], ['Crew pay', crew, '#2F6FED'], ['Profit', profit, '#1E7A4F']] as const;
  return <Svg p={p} bg="#F2F4F7">
    <text x="80" y="110" fontFamily={SANS} fontSize="48" fontWeight="900" letterSpacing="-1.5" fill="#101828" opacity={ease(ramp(frame, same - 8, 10))}>Same work. Less money.</text>
    <text x="120" y="210" fontFamily={SANS} fontSize="28" fontWeight="900" letterSpacing="2" fill="#667085" opacity={ease(ramp(frame, work - 4, 10))}>THE WORK</text>
    <rect x="120" y="230" width="840" height="90" rx="14" fill="#475467" opacity={ease(ramp(frame, work - 4, 10))} />
    <text x="120" y="400" fontFamily={SANS} fontSize="28" fontWeight="900" letterSpacing="2" fill="#667085" opacity={ease(ramp(frame, less - 8, 10))}>WHAT YOU GET PAID</text>
    <rect x="120" y="420" width={W} height="90" rx="14" fill="#F5B301" opacity={ease(ramp(frame, less - 8, 10))} />
    {shrink > .1 && <path d={`M${120 + W + 10} 465H960`} stroke="#E5484D" strokeWidth="4" strokeDasharray="10 8" />}
    <text x="120" y="610" fontFamily={SANS} fontSize="28" fontWeight="900" letterSpacing="2" fill="#667085" opacity={ease(ramp(frame, room - 4, 10))}>LEFT ROOM FOR…</text>
    {parts.map(([label, at, color], i) => {
      const k = ease(ramp(frame, at - 6, 10));
      const squeeze = 1 - .45 * ease(ramp(frame, at + 10, 16));
      return <g key={label} opacity={k} transform={`translate(120 ${640 + i * 90})`}>
        <text x="0" y="48" fontFamily={SANS} fontSize="32" fontWeight="850" fill="#101828">{label}</text>
        <rect x="320" y="10" width={520 * squeeze} height="56" rx="12" fill={color} />
        <rect x="320" y="10" width="520" height="56" rx="12" fill="none" stroke={color} strokeWidth="3" strokeDasharray="10 8" opacity=".5" />
      </g>;
    })}
  </Svg>;
};

/* 4 · Homeowners can tell when you're unsure; a confident quote beats a price you keep lowering. */
export const NervousVsConfident: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [unsure, confident, trustworthy, lowering, nervous] = cues(p, [47, 140, 189, 240, 273]);
  const L = ease(ramp(frame, unsure - 6, 10)), R = ease(ramp(frame, confident - 6, 10));
  const cuts = Math.min(3, Math.max(0, Math.floor((frame - lowering + 6) / 8) + 1));
  const shake = frame > nervous - 6 ? Math.sin(frame * 2.2) * 4 : 0;
  return <Svg p={p} bg="#111827">
    <g opacity={L} transform={`translate(${80 + shake} 120)`}>
      <text x="200" y="0" textAnchor="middle" fontFamily={SANS} fontSize="32" fontWeight="900" letterSpacing="2" fill="#9CA3AF">UNSURE</text>
      <rect y="40" width="400" height="520" rx="18" fill="#1F2937" stroke="#374151" strokeWidth="3" />
      <text x="40" y="120" fontFamily={SANS} fontSize="34" fontWeight="900" fill="#E5E7EB">Quote</text>
      {[0, 1, 2, 3].map(i => <g key={i} opacity={i <= cuts ? 1 : 0}>
        <text x="40" y={210 + i * 80} fontFamily={SANS} fontSize="48" fontWeight="900" fill={i === cuts ? '#F87171' : '#4B5563'}>{['$$$$', '$$$', '$$', '$'][i]}</text>
        {i < cuts && <path d={`M34 ${195 + i * 80}H${40 + (4 - i) * 34}`} stroke="#F87171" strokeWidth="6" />}
      </g>)}
      <text x="200" y="620" textAnchor="middle" fontFamily={SERIF} fontSize="34" fontStyle="italic" fill="#F87171" opacity={ease(ramp(frame, nervous - 4, 10))}>“I can go lower…”</text>
    </g>
    <g opacity={R} transform="translate(600 120)">
      <text x="200" y="0" textAnchor="middle" fontFamily={SANS} fontSize="32" fontWeight="900" letterSpacing="2" fill="#FBBF24">CONFIDENT</text>
      <rect y="40" width="400" height="520" rx="18" fill="#FFFBEB" stroke="#FBBF24" strokeWidth="6" />
      <text x="40" y="120" fontFamily={SANS} fontSize="34" fontWeight="900" fill="#111827">Quote</text>
      <text x="40" y="250" fontFamily={SANS} fontSize="72" fontWeight="900" fill="#111827">$$$$</text>
      <g opacity={ease(ramp(frame, trustworthy - 4, 10))} transform={`translate(200 400) rotate(-8) scale(${back(ease(ramp(frame, trustworthy - 4, 12)))})`}>
        <rect x="-150" y="-40" width="300" height="80" rx="10" fill="none" stroke="#15803D" strokeWidth="6" />
        <text y="14" textAnchor="middle" fontFamily={SANS} fontSize="34" fontWeight="900" letterSpacing="2" fill="#15803D">TRUSTWORTHY</text>
      </g>
    </g>
    <text x="540" y="880" textAnchor="middle" fontFamily={SANS} fontSize="38" fontWeight="900" fill="#FFFFFF" opacity={ease(ramp(frame, unsure + 10, 10))}>Homeowners can tell.</text>
  </Svg>;
};

/* 5 · Know what your work is worth, explain the price, and customers have reason to trust you. */
export const ExplainPrice: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [confidentAt, win, worth, explain, customers, trust] = cues(p, [18, 76, 146, 169, 196, 252]);
  const lines = ['Materials', 'Labor', 'Timeline', 'What\'s included'];
  const meter = ease(ramp(frame, customers - 4, trust - customers + 20));
  return <Svg p={p} bg="#F0F7F4">
    <text x="80" y="110" fontFamily={SANS} fontSize="48" fontWeight="900" letterSpacing="-1.5" fill="#0F2A1F" opacity={ease(ramp(frame, confidentAt - 8, 10))}>Confident pricing wins more</text>
    <g transform="translate(80 170)" opacity={ease(ramp(frame, worth - 8, 12))}>
      <rect width="560" height="640" rx="22" fill="#FFFFFF" stroke="#BFD8CB" strokeWidth="3" />
      <text x="36" y="80" fontFamily={SANS} fontSize="38" fontWeight="900" fill="#0F2A1F">Your quote, explained</text>
      {lines.map((l, i) => {
        const k = ease(ramp(frame, explain - 6 + i * 7, 10));
        return <g key={l} opacity={k} transform={`translate(36 ${150 + i * 100})`}>
          <text y="30" fontFamily={SANS} fontSize="32" fontWeight="800" fill="#0F2A1F">{l}</text>
          <rect x="300" y="8" width="190" height="24" rx="12" fill="#D6EBDF" />
          <path d="M0 62H488" stroke="#E6F0EA" strokeWidth="3" />
        </g>;
      })}
      <rect x="36" y="560" width="488" height="56" rx="12" fill="#0F2A1F" opacity={ease(ramp(frame, explain + 30, 10))} />
      <text x="280" y="598" textAnchor="middle" fontFamily={SANS} fontSize="30" fontWeight="900" fill="#FFFFFF" opacity={ease(ramp(frame, explain + 30, 10))}>Price stands</text>
    </g>
    <g transform="translate(830 220)">
      <text y="-20" textAnchor="middle" fontFamily={SANS} fontSize="30" fontWeight="900" letterSpacing="2" fill="#0F2A1F" opacity={ease(ramp(frame, customers - 6, 10))}>TRUST</text>
      <rect x="-50" y="0" width="100" height="400" rx="50" fill="#D6EBDF" opacity={ease(ramp(frame, customers - 6, 10))} />
      <rect x="-50" y={400 - 400 * meter} width="100" height={400 * meter} rx="50" fill="#1E7A4F" />
      <Person x={0} y={520} s={1.3} fill="#0F2A1F" />
    </g>
    <text x="830" y="820" textAnchor="middle" fontFamily={SANS} fontSize="28" fontWeight="900" fill="#1E7A4F" opacity={ease(ramp(frame, win - 6, 10))}>More jobs won</text>
  </Svg>;
};

/* 6 · Losing a bid hurts, but winning jobs that don't pay is worse: nonstop work, stress, barely any money. */
export const LoseVsUnderpaid: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [constantly, worse, nonstop, stress, barely] = cues(p, [11, 88, 120, 164, 186]);
  const L = ease(ramp(frame, 0, 10)), R = ease(ramp(frame, constantly - 4, 10));
  const days = Math.floor(clamp((frame - nonstop + 10) / 30) * 28);
  const stressK = ease(ramp(frame, stress - 4, 16));
  return <Svg p={p} bg="#1C1917">
    <g opacity={L} transform="translate(80 140)">
      <text x="0" y="0" fontFamily={SANS} fontSize="36" fontWeight="900" fill="#D6D3D1">Losing a bid</text>
      <rect y="40" width="360" height="200" rx="18" fill="#292524" />
      <text x="180" y="170" textAnchor="middle" fontFamily={SANS} fontSize="90" fontWeight="900" fill="#A8A29E">–1</text>
      <text x="0" y="300" fontFamily={SANS} fontSize="30" fontWeight="800" fill="#A8A29E">hurts a bit</text>
    </g>
    <g opacity={R} transform="translate(500 140)">
      <text x="0" y="0" fontFamily={SANS} fontSize="36" fontWeight="900" fill="#FCA5A5">Winning jobs that don't pay</text>
      <g transform="translate(0 40)">
        {Array.from({length: 28}, (_, i) => <rect key={i} x={(i % 7) * 70} y={Math.floor(i / 7) * 62} width="60" height="52" rx="8" fill={i < days ? '#DC2626' : '#292524'} />)}
      </g>
      <text x="0" y="330" fontFamily={SANS} fontSize="30" fontWeight="800" fill="#FCA5A5" opacity={ease(ramp(frame, nonstop - 4, 10))}>working nonstop</text>
      <g transform="translate(0 380)" opacity={ease(ramp(frame, stress - 6, 10))}>
        <text y="30" fontFamily={SANS} fontSize="28" fontWeight="800" fill="#D6D3D1">Stress</text>
        <rect x="130" y="6" width="330" height="30" rx="15" fill="#292524" />
        <rect x="130" y="6" width={330 * stressK} height="30" rx="15" fill="#F97316" />
      </g>
      <g transform="translate(0 440)" opacity={ease(ramp(frame, barely - 6, 10))}>
        <text y="30" fontFamily={SANS} fontSize="28" fontWeight="800" fill="#D6D3D1">Money</text>
        <rect x="130" y="6" width="330" height="30" rx="15" fill="#292524" />
        <rect x="130" y="6" width={330 * .08 * ease(ramp(frame, barely - 4, 10))} height="30" rx="15" fill="#22C55E" />
      </g>
    </g>
    <text x="540" y="840" textAnchor="middle" fontFamily={SANS} fontSize="48" fontWeight="900" fill="#FFFFFF" opacity={ease(ramp(frame, worse - 6, 10))}>The second one is worse.</text>
  </Svg>;
};

/* 8 · Two contractors quote the same kitchen: one discounts out of fear, the other explains and stands by it. */
export const KitchenQuotes: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [two, kitchen, one, discount, other, explains, stands, second, confident] = cues(p, [19, 75, 100, 151, 215, 233, 271, 309, 403]);
  const A = ease(ramp(frame, one - 6, 10)), B = ease(ramp(frame, other - 6, 10));
  const pick = ease(ramp(frame, second - 4, 14));
  const tag = back(ease(ramp(frame, discount - 4, 12)));
  return <Svg p={p} bg="#FAF6F0">
    <text x="80" y="100" fontFamily={SERIF} fontSize="48" fill="#2A2018" opacity={ease(ramp(frame, two - 6, 10))}>Same kitchen remodel, two quotes</text>
    <g opacity={ease(ramp(frame, kitchen - 6, 12))} transform="translate(380 140)">
      <rect width="320" height="150" rx="10" fill="#E8DCCB" />
      <rect x="20" y="80" width="280" height="60" fill="#B98A5E" /><rect x="20" y="70" width="280" height="14" fill="#5B4632" />
      <rect x="40" y="16" width="100" height="44" rx="4" fill="#FFFFFF" /><rect x="180" y="16" width="100" height="44" rx="4" fill="#FFFFFF" />
    </g>
    <g opacity={A * (1 - .5 * pick)} transform="translate(80 340)">
      <rect width="420" height="470" rx="18" fill="#FFFFFF" stroke="#E2D6C6" strokeWidth="3" />
      <text x="30" y="60" fontFamily={SANS} fontSize="30" fontWeight="900" letterSpacing="2" fill="#8C7A66">CONTRACTOR 1</text>
      <text x="30" y="180" fontFamily={SANS} fontSize="72" fontWeight="900" fill="#2A2018">$$$</text>
      <g opacity={clamp(tag)} transform={`translate(300 150) rotate(12) scale(${tag})`}>
        <rect x="-110" y="-40" width="220" height="80" rx="12" fill="#DC2626" />
        <text y="14" textAnchor="middle" fontFamily={SANS} fontSize="36" fontWeight="900" fill="#FFFFFF">DISCOUNT</text>
      </g>
      <text x="30" y="300" fontFamily={SERIF} fontSize="32" fontStyle="italic" fill="#8C7A66" opacity={ease(ramp(frame, discount + 20, 10))}>right away,</text>
      <text x="30" y="345" fontFamily={SERIF} fontSize="32" fontStyle="italic" fill="#8C7A66" opacity={ease(ramp(frame, discount + 30, 10))}>afraid to lose it</text>
    </g>
    <g opacity={B} transform={`translate(580 340) scale(${1 + .04 * pick})`}>
      <rect width="420" height="470" rx="18" fill="#FFFFFF" stroke={pick > .5 ? '#1E7A4F' : '#E2D6C6'} strokeWidth={pick > .5 ? 8 : 3} />
      <text x="30" y="60" fontFamily={SANS} fontSize="30" fontWeight="900" letterSpacing="2" fill="#1E7A4F">CONTRACTOR 2</text>
      <text x="30" y="180" fontFamily={SANS} fontSize="72" fontWeight="900" fill="#2A2018">$$$$</text>
      {['Materials', 'Labor', 'Timeline'].map((l, i) => <g key={l} opacity={ease(ramp(frame, explains - 4 + i * 6, 10))}>
        <text x="30" y={250 + i * 52} fontFamily={SANS} fontSize="28" fontWeight="800" fill="#2A2018">{l}</text>
        <rect x="220" y={232 + i * 52} width="160" height="20" rx="10" fill="#E7F2EB" />
      </g>)}
      <g opacity={ease(ramp(frame, stands - 4, 10))}><rect x="30" y="400" width="360" height="50" rx="25" fill="#1E7A4F" /><text x="210" y="434" textAnchor="middle" fontFamily={SANS} fontSize="26" fontWeight="900" fill="#FFFFFF">Stands by the price</text></g>
    </g>
    <g opacity={ease(ramp(frame, confident - 6, 10))} transform="translate(790 860)">
      <text textAnchor="middle" fontFamily={SANS} fontSize="34" fontWeight="900" fill="#1E7A4F">Confident ✓ Trustworthy ✓</text>
    </g>
  </Svg>;
};

/* Faceless opener · Underpricing out of fear can cost more than losing the job. */
export const HookScale: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [afraid, cost, more, job] = cues(p, [68, 116, 130, 160]);
  const tilt = 14 * ease(ramp(frame, more - 4, 20));
  const L = ease(ramp(frame, afraid - 6, 12)), R = ease(ramp(frame, 0, 12));
  return <Svg p={p} bg="#FFF4E8">
    <text x="540" y="-130" textAnchor="middle" fontFamily={SANS} fontSize="76" fontWeight="900" letterSpacing="-2" fill="#2A1A0E" opacity={ramp(frame, 0, 10)}>Underpricing</text>
    <text x="540" y="-50" textAnchor="middle" fontFamily={SERIF} fontSize="46" fontStyle="italic" fill="#8C6A4E" opacity={ease(ramp(frame, cost - 6, 10))}>can cost you more than…</text>
    <path d="M540 820V250" stroke="#2A1A0E" strokeWidth="14" /><path d="M420 830H660" stroke="#2A1A0E" strokeWidth="18" strokeLinecap="round" />
    <g transform={`rotate(${-tilt} 540 250)`}>
      <path d="M160 250H920" stroke="#2A1A0E" strokeWidth="12" strokeLinecap="round" />
      <g transform={`translate(240 250) rotate(${tilt})`}>
        <path d="M0 0L-110 220M0 0L110 220" stroke="#8C6A4E" strokeWidth="4" />
        <path d="M-140 220H140Q140 290 0 290Q-140 290-140 220Z" fill="#E7D3BD" />
        <g opacity={L}><rect x="-120" y="100" width="240" height="110" rx="14" fill="#9CA3AF" />
        <text y="168" textAnchor="middle" fontFamily={SANS} fontSize="32" fontWeight="900" fill="#FFFFFF">Losing a job</text></g>
      </g>
      <g transform={`translate(840 250) rotate(${tilt})`}>
        <path d="M0 0L-110 220M0 0L110 220" stroke="#8C6A4E" strokeWidth="4" />
        <path d="M-140 220H140Q140 290 0 290Q-140 290-140 220Z" fill="#E7D3BD" />
        <g opacity={R}><rect x="-130" y="40" width="260" height="170" rx="14" fill="#C0392B" />
        <text y="120" textAnchor="middle" fontFamily={SANS} fontSize="32" fontWeight="900" fill="#FFFFFF">Underpricing</text>
        <text y="164" textAnchor="middle" fontFamily={SANS} fontSize="28" fontWeight="800" fill="#FFD9D2">out of fear</text></g>
      </g>
    </g>
    <text x="540" y="960" textAnchor="middle" fontFamily={SANS} fontSize="54" fontWeight="900" fill="#C0392B" opacity={ease(ramp(frame, job - 4, 10))}>…losing the job itself.</text>
  </Svg>;
};

/* Faceless step card · Set your price on what it's worth, stand behind it, explain why. */
export const SetStandExplain: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const steps = [['Set it', 'on what the job is actually worth'], ['Stand behind it', 'no fear discounts'], ['Explain why', 'why it costs what it does']] as const;
  const at = cues(p, [0, 91, 135]);
  return <Svg p={p} bg="#0F2A1F">
    <text x="80" y="-110" fontFamily={SANS} fontSize="72" fontWeight="900" letterSpacing="-2" fill="#FFFFFF" opacity={ramp(frame, 0, 10)}>Your price:</text>
    {steps.map(([t, sub], i) => {
      const k = ease(ramp(frame, at[i] - 4, 12));
      return <g key={t} opacity={k} transform={`translate(${80 + (1 - k) * 40} ${20 + i * 300})`}>
        <rect width="920" height="240" rx="30" fill="#163A2B" stroke="#3DDC97" strokeWidth="4" />
        <circle cx="110" cy="120" r="62" fill="#3DDC97" />
        <text x="110" y="146" textAnchor="middle" fontFamily={SANS} fontSize="72" fontWeight="900" fill="#0F2A1F">{i + 1}</text>
        <text x="210" y="112" fontFamily={SANS} fontSize="58" fontWeight="900" fill="#FFFFFF">{t}</text>
        <text x="210" y="170" fontFamily={SANS} fontSize="32" fontWeight="700" fill="#9CC9B4">{sub}</text>
      </g>;
    })}
  </Svg>;
};
