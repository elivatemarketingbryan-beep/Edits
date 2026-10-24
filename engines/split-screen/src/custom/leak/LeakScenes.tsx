import React from 'react';
import {clamp} from '../../motion';
import type {VisualProps} from '../../types';

// Scenes for "fix the leak before you buy more ads" (job video4). One water /
// plumbing metaphor, carried across different materials. Cues are local beat
// frames from word timings in the plan's props.cues.
const ramp = (frame: number, start: number, length = 14) => clamp((frame - start) / length);
const ease = (v: number) => 1 - Math.pow(1 - v, 3);
const back = (v: number) => { const c = 1.7; return 1 + (c + 1) * Math.pow(v - 1, 3) + c * Math.pow(v - 1, 2); };
const cues = (p: VisualProps, fallback: number[]) => {
  const data = p.beat.visual.type === 'custom' ? p.beat.visual.props?.cues : undefined;
  return Array.isArray(data) && data.every(n => typeof n === 'number') ? data as number[] : fallback;
};
const prop = (p: VisualProps, key: string) => p.beat.visual.type === 'custom' ? p.beat.visual.props?.[key] : undefined;
const SANS = 'Inter, Arial, sans-serif';
const SERIF = 'Georgia, "Times New Roman", serif';
const draw = (k: number) => ({pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - k});
const Svg: React.FC<{bg: string; children: React.ReactNode}> = ({bg, children}) =>
  <svg viewBox="0 0 1080 960" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
    <rect width="1080" height="960" fill={bg} />{children}
  </svg>;
const Check: React.FC<{x: number; y: number; r?: number; k: number; fill?: string}> = ({x, y, r = 26, k, fill = '#3DDC97'}) =>
  <g transform={`translate(${x} ${y}) scale(${back(k)})`} opacity={clamp(k * 2)}>
    <circle r={r} fill={fill} />
    <path d={`M${-r * .42} 0L${-r * .1} ${r * .32}L${r * .45} ${-r * .3}`} stroke="#0B1420" strokeWidth={r * .2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </g>;

/* 2 · More ad spend works when the system already converts. */
export const WhenItWorks: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [numbers, work, volume, converting] = cues(p, [29, 55, 88, 164]);
  const flow = ease(ramp(frame, numbers - 10, 40));
  const vol = ease(ramp(frame, volume - 4, 30));
  const level = .12 + .6 * ease(ramp(frame, volume, 110));
  const thick = 26 + 44 * vol;
  const ink = '#CFE3FF', water = '#4FC3F7';
  const chips = [['Numbers already work', work], ['More volume', volume], ['System converting', converting]] as const;
  return <Svg bg="#0E2238">
    {Array.from({length: 22}, (_, i) => <path key={`v${i}`} d={`M${i * 50} 0V960`} stroke="#183252" strokeWidth="2" />)}
    {Array.from({length: 20}, (_, i) => <path key={`h${i}`} d={`M0 ${i * 50}H1080`} stroke="#183252" strokeWidth="2" />)}
    <text x="80" y="130" fontFamily={SANS} fontSize="58" fontWeight="850" letterSpacing="-1.5" fill="#FFFFFF" opacity={ramp(frame, 0, 10)}>When more ad spend <tspan fill="#FFD400">is</tspan> the answer</text>
    <clipPath id="wiw-pipe"><rect x="90" y="362" width="740" height="86" /><rect x="752" y="440" width="76" height="90" /></clipPath>
    <g clipPath="url(#wiw-pipe)">
      <rect x="90" y={405 - thick / 2} width={740 * flow} height={thick} fill={water} />
      <path d={`M90 405H${90 + 740 * flow}`} stroke="#B3E5FC" strokeWidth="6" strokeDasharray="34 40" strokeDashoffset={-frame * (4 + 6 * vol)} />
      <rect x={790 - thick / 2} y="440" width={thick} height={90 * ramp(frame, numbers + 26, 10)} fill={water} />
    </g>
    <path d="M90 360H830V530M90 450H750V530" stroke={ink} strokeWidth="5" fill="none" />
    {[420, 620].map((x, i) => <g key={x}>
      <rect x={x - 16} y="346" width="32" height="118" rx="6" fill="#0E2238" stroke={ink} strokeWidth="5" />
      <Check x={x} y={300} k={ease(ramp(frame, work - 4 + i * 5, 10))} />
    </g>)}
    <g transform="translate(230 405)">
      <circle r="74" fill="#0E2238" stroke="#FFD400" strokeWidth="6" />
      <g transform={`rotate(${vol * 160})`}>
        <path d="M-56 0H56M0-56V56" stroke="#FFD400" strokeWidth="10" strokeLinecap="round" />
        <circle r="16" fill="#FFD400" />
      </g>
    </g>
    <text x="230" y="300" textAnchor="middle" fontFamily={SANS} fontSize="30" fontWeight="900" letterSpacing="2" fill="#FFD400">AD SPEND</text>
    <clipPath id="wiw-tank"><rect x="682" y="532" width="316" height="276" /></clipPath>
    <rect x="682" y={808 - 276 * level} width="316" height={276 * level} fill={water} clipPath="url(#wiw-tank)" opacity={ramp(frame, numbers + 30, 8)} />
    <path d="M680 530V810H1000V530" stroke={ink} strokeWidth="5" fill="none" />
    <text x="840" y="590" textAnchor="middle" fontFamily={SANS} fontSize="30" fontWeight="900" letterSpacing="2" fill="#FFFFFF">BOOKED JOBS</text>
    {chips.map(([label, at], i) => {
      const k = ease(ramp(frame, at - 6, 12));
      return <g key={label} opacity={k} transform={`translate(${90 + (1 - k) * -30} ${540 + i * 100})`}>
        <rect width="540" height="80" rx="40" fill={i === 1 ? '#FFD400' : '#3DDC97'} />
        <text x="44" y="52" fontFamily={SANS} fontSize="36" fontWeight="850" fill="#0B1420">{i === 1 ? '+' : '✓'}  {label}</text>
      </g>;
    })}
  </Svg>;
};

/* 3 · "Just run more ads" vs. the actual problem being elsewhere. */
export const JustRunMoreAds: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [just, more, actual, somewhere] = cues(p, [87, 100, 135, 164]);
  const strike = ease(ramp(frame, actual - 4, 14));
  const fade = 1 - .25 * strike;
  const lines = [['JUST RUN', just, 260], ['MORE ADS', more, 440]] as const;
  return <Svg bg="#0B0B0B">
    <text x="80" y="150" fontFamily={SERIF} fontSize="50" fontStyle="italic" fill="#FFFFFF" opacity={ramp(frame, 0, 12)}>Contractors usually get told:</text>
    {lines.map(([w, at, y]) => {
      const k = back(ease(ramp(frame, at - 4, 12)));
      return <g key={w} opacity={clamp(k) * fade} transform={`translate(80 ${y}) scale(${.9 + .1 * k})`}>
        <rect width="860" height="160" fill="#FFD400" />
        <text x="40" y="128" fontFamily={SANS} fontSize="150" fontWeight="900" letterSpacing="-6" fill="#0B0B0B">{w}</text>
      </g>;
    })}
    <path d="M60 520L980 300" stroke="#FF4A3D" strokeWidth="18" strokeLinecap="round" {...draw(strike)} />
    <g opacity={ease(ramp(frame, somewhere - 6, 12))} transform={`translate(80 ${740 + 20 * (1 - ease(ramp(frame, somewhere - 6, 12)))})`}>
      <text fontFamily={SANS} fontSize="64" fontWeight="850" letterSpacing="-2" fill="#FFFFFF">The real problem is</text>
      <text y="80" fontFamily={SANS} fontSize="64" fontWeight="850" letterSpacing="-2" fill="#FFD400">somewhere else.</text>
    </g>
  </Svg>;
};

/* 4 · Three places the leads actually leak before the phone. */
export const ThreeLeaks: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [slow, outdated, filtered] = cues(p, [4, 42, 84]);
  const top = 190, bottom = 720, x0 = 210, x1 = 270;
  const cracks = [[300, slow, 'Slow follow-ups'], [450, outdated, 'Outdated websites'], [600, filtered, 'Unfiltered leads']] as const;
  const active = cracks.map(([, at]) => frame >= at - 2);
  const dots = Array.from({length: 14}, (_, k) => {
    const pos = top + ((frame * 4 + k * 40) % (bottom - top + 20));
    const leakAt = k % 6 < 3 ? k % 6 : -1;
    if (leakAt >= 0 && active[leakAt] && pos > cracks[leakAt][0]) {
      const t = (pos - cracks[leakAt][0]) / 140;
      return t > 1.2 ? null : <circle key={k} cx={x0 - 10 - t * 110} cy={cracks[leakAt][0] + t * t * 160} r="10" fill="#3B8BD4" opacity={1 - t * .7} />;
    }
    return <circle key={k} cx={(x0 + x1) / 2} cy={pos} r="12" fill="#3B8BD4" />;
  });
  return <Svg bg="#F1E9DA">
    <text x="340" y="140" fontFamily={SERIF} fontSize="56" fontWeight="700" fill="#2B2118" opacity={ramp(frame, 0, 10)}>Where leads leak out</text>
    <text x={(x0 + x1) / 2} y={top - 30} textAnchor="middle" fontFamily={SANS} fontSize="26" fontWeight="900" letterSpacing="2" fill="#2B2118">LEADS</text>
    <rect x={x0} y={top} width={x1 - x0} height={bottom - top} fill="#FFFFFF" />
    <g clipPath="url(#tl-pipe)">{dots}</g>
    <clipPath id="tl-pipe"><rect x="0" y={top} width="1080" height={bottom - top + 4} /></clipPath>
    <path d={`M${x0} ${top}V${bottom}M${x1} ${top}V${bottom}`} stroke="#B86B3C" strokeWidth="10" />
    {cracks.map(([y, at, label], i) => {
      const k = ease(ramp(frame, at - 4, 10));
      return <g key={label}>
        <path d={`M${x0 - 14} ${y - 24}L${x0 + 8} ${y - 8}L${x0 - 6} ${y + 4}L${x0 + 12} ${y + 22}`} stroke="#C0392B" strokeWidth="7" fill="none" strokeLinejoin="round" {...draw(k)} />
        <g opacity={k} transform={`translate(${340 + (1 - k) * 30} ${y})`}>
          <path d="M0 0H-40" stroke="#C0392B" strokeWidth="4" strokeDasharray="6 6" />
          <circle cx="40" r="34" fill="#2B2118" />
          {i === 0 && <g stroke="#F1E9DA" strokeWidth="5" fill="none" strokeLinecap="round"><circle cx="40" r="20" /><path d="M40-12V0L50 8" /></g>}
          {i === 1 && <g stroke="#F1E9DA" strokeWidth="4" fill="none"><rect x="20" y="-16" width="40" height="32" rx="4" /><path d="M20-6H60" /><path d="M28 6H44" strokeDasharray="4 3" /></g>}
          {i === 2 && <g stroke="#F1E9DA" strokeWidth="5" fill="none" strokeLinejoin="round"><path d="M20-16H60L46 2V16L34 20V2Z" /></g>}
          <text x="96" y="18" fontFamily={SANS} fontSize="52" fontWeight="850" letterSpacing="-1.5" fill="#2B2118">{label}</text>
        </g>
      </g>;
    })}
    <g transform={`translate(${(x0 + x1) / 2} ${bottom + 60})`}>
      <rect x="-42" y="-50" width="84" height="130" rx="16" fill="#2B2118" />
      <rect x="-32" y="-36" width="64" height="88" rx="6" fill="#F1E9DA" />
      <path d="M-12 10Q-14 26-2 34T14 34L14 28L6 25L2 30Q-4 27-5 20L-1 17L-4 8Z" fill="#2B2118" transform="translate(0 -18)" />
    </g>
  </Svg>;
};

/* 5 · More ads into a broken system: a bigger leak, same share lost. */
export const BiggerLeak: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [broken, bigger, expensive, same] = cues(p, [40, 140, 168, 249]);
  const big = ease(ramp(frame, bigger - 6, 18));
  const gold = ease(ramp(frame, expensive - 4, 12));
  const pies = ease(ramp(frame, same - 6, 18));
  const share = .38;
  const pipe = (y: number, h: number, k: number, label: string, fall: number) => {
    const holeX = 420;
    const sw = h * .45;
    return <g opacity={k}>
      <text x="80" y={y - 22} fontFamily={SANS} fontSize="30" fontWeight="900" letterSpacing="2" fill="#9AA4B5">{label}</text>
      <rect x="80" y={y} width="560" height={h} fill="#4FC3F7" />
      <path d={`M80 ${y + h / 2}H640`} stroke="#B3E5FC" strokeWidth={h * .12} strokeDasharray="30 34" strokeDashoffset={-frame * 6} />
      <path d={`M80 ${y}H640M80 ${y + h}H640`} stroke="#E8EDF4" strokeWidth="6" />
      <path d={`M${holeX} ${y + h}Q${holeX - 10} ${y + h + fall * .5} ${holeX - 50} ${y + h + fall}`} stroke={gold > .5 ? '#F4B400' : '#4FC3F7'} strokeWidth={sw} fill="none" strokeLinecap="round" strokeDasharray={`${sw * .9} ${sw * .6}`} strokeDashoffset={-frame * 5} />
      {gold > 0 && Array.from({length: 3}, (_, i) => {
        const t = ((frame * .02 + i / 3) % 1);
        return <text key={i} x={holeX - 10 - t * 50} y={y + h + 20 + t * fall} textAnchor="middle" fontFamily={SANS} fontSize={h * .55} fontWeight="900" fill="#FFFFFF" opacity={gold * (1 - t)}>$</text>;
      })}
    </g>;
  };
  const pie = (cx: number, cy: number, r: number, k: number) => {
    const a = share * Math.PI * 2 * k;
    return <g opacity={pies}>
      <circle cx={cx} cy={cy} r={r} fill="#3DDC97" />
      <path d={`M${cx} ${cy}L${cx} ${cy - r}A${r} ${r} 0 ${a > Math.PI ? 1 : 0} 1 ${cx + Math.sin(a) * r} ${cy - Math.cos(a) * r}Z`} fill="#FF5A4A" />
    </g>;
  };
  return <Svg bg="#1B2230">
    <text x="80" y="110" fontFamily={SANS} fontSize="54" fontWeight="850" letterSpacing="-1.5" fill="#FFFFFF" opacity={ramp(frame, 0, 10)}>More ads, broken system</text>
    <text x="80" y="170" fontFamily={SANS} fontSize="40" fontWeight="700" fill="#FF8A7A" opacity={ramp(frame, broken + 30, 10)}>Same leak. Bigger bill.</text>
    {pipe(260, 40, 1, 'TODAY', 120)}
    {pipe(470, 120, big, 'MORE ADS', 300)}
    {pie(870, 280, 70, pies)}
    {pie(870, 600, 150, pies)}
    <g opacity={pies}>
      <text x="870" y="820" textAnchor="middle" fontFamily={SANS} fontSize="36" fontWeight="850" fill="#FF8A7A">same share lost</text>
    </g>
  </Svg>;
};

/* 6 · Check that leads are captured, tracked and followed up. */
export const LeadStamps: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [check, captured, tracked, followed] = cues(p, [59, 135, 165, 183]);
  const rows = [['Captured', captured], ['Tracked', tracked], ['Followed up', followed]] as const;
  const card = ease(ramp(frame, 0, 16));
  return <Svg bg="#CDB28A">
    {Array.from({length: 12}, (_, i) => <path key={i} d={`M0 ${40 + i * 80}Q540 ${60 + i * 80} 1080 ${30 + i * 80}`} stroke="#C2A67D" strokeWidth="3" fill="none" />)}
    <text x="540" y="110" textAnchor="middle" fontFamily={SERIF} fontSize="50" fontWeight="700" fill="#2B2118" opacity={ramp(frame, check - 10, 12)}>Before another dollar, check:</text>
    <g transform={`translate(540 ${470 + (1 - card) * 60}) rotate(-2)`} opacity={card}>
      <rect x="-400" y="-300" width="800" height="600" rx="10" fill="#000000" opacity=".18" transform="translate(10 14)" />
      <rect x="-400" y="-300" width="800" height="600" rx="10" fill="#FFFDF7" />
      <path d="M-400-190H400" stroke="#E07A7A" strokeWidth="4" />
      {[-60, 70, 200].map(y => <path key={y} d={`M-360 ${y + 40}H360`} stroke="#B9D3EE" strokeWidth="3" />)}
      <text x="-360" y="-222" fontFamily={SERIF} fontSize="52" fontStyle="italic" fill="#2B2118">Every lead you already have</text>
      {rows.map(([label, at], i) => {
        const y = -60 + i * 130;
        const k = ease(ramp(frame, at - 3, 8));
        const s = 1.7 - .7 * k;
        return <g key={label}>
          <text x="-360" y={y + 26} fontFamily={SANS} fontSize="54" fontWeight="800" fill="#2B2118" opacity={.35 + .65 * ramp(frame, at - 10, 8)}>{label}</text>
          <rect x="190" y={y - 32} width="70" height="70" rx="8" fill="none" stroke="#2B2118" strokeWidth="4" opacity=".5" />
          <g transform={`translate(260 ${y + 2}) rotate(-8) scale(${s})`} opacity={k}>
            <rect x="-100" y="-46" width="200" height="92" rx="10" fill="none" stroke="#C0392B" strokeWidth="8" />
            <path d="M-70 0L-48 22L-14-20" stroke="#C0392B" strokeWidth="10" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <text x="40" y="14" textAnchor="middle" fontFamily={SANS} fontSize="38" fontWeight="900" fill="#C0392B">OK</text>
          </g>
        </g>;
      })}
    </g>
  </Svg>;
};

/* 7 & 8 · A bucket with a hole, then a sealed bucket that holds every dollar. */
export const Bucket: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const solid = prop(p, 'mode') === 'solid';
  const c = cues(p, solid ? [72, 124, 164, 240] : [58, 94, 111]);
  const pour = solid ? 1 : ease(ramp(frame, c[0] - 10, 12));
  const patch = solid ? back(ease(ramp(frame, c[0] - 6, 12))) : 0;
  const level = solid ? .16 + .7 * ease(ramp(frame, c[0], c[3] - c[0] + 20)) : .16 * ease(ramp(frame, c[0], 30));
  const yTop = 330, yBot = 790, wTop = 460, wBot = 320;
  const yl = yBot - level * (yBot - yTop);
  const bucket = `M${540 - wTop / 2} ${yTop}L${540 - wBot / 2} ${yBot}H${540 + wBot / 2}L${540 + wTop / 2} ${yTop}`;
  const holeX = 420, holeY = 740;
  const leakK = solid ? clamp(1 - ramp(frame, c[0] - 6, 6)) : ease(ramp(frame, c[0] + 8, 10));
  const hole = !solid ? ease(ramp(frame, c[2] - 4, 10)) : 0;
  const title = solid ? (frame < c[1] - 6 ? 'Fix the system first' : 'Now every dollar stays') : 'Ads in. Leads out the bottom.';
  return <Svg bg={solid ? '#EAF5EE' : '#EAF2F7'}>
    <text x="80" y="120" fontFamily={SANS} fontSize="58" fontWeight="850" letterSpacing="-1.5" fill="#14202B" opacity={ramp(frame, 0, 10)}>{title}</text>
    <rect x="0" y="200" width="470" height="54" fill="#3A4756" />
    <rect x="420" y="200" width="54" height="80" fill="#3A4756" />
    <text x="60" y="238" fontFamily={SANS} fontSize="28" fontWeight="900" letterSpacing="2" fill="#FFFFFF">MORE ADS</text>
    <path d={`M447 280V${yl}`} stroke="#4FC3F7" strokeWidth="26" strokeDasharray="40 14" strokeDashoffset={-frame * 8} {...{}} opacity={pour} />
    <clipPath id={`bk-${solid}`}><path d={`${bucket}Z`} /></clipPath>
    <rect x="300" y={yl} width="480" height={yBot - yl + 4} fill="#4FC3F7" clipPath={`url(#bk-${solid})`} />
    <path d={`M300 ${yl}H780`} stroke="#B3E5FC" strokeWidth="6" clipPath={`url(#bk-${solid})`} />
    <path d={bucket} stroke="#5E6B78" strokeWidth="12" fill="none" strokeLinejoin="round" />
    <path d={`M${540 - wTop / 2 - 10} ${yTop}Q540 ${yTop - 150} ${540 + wTop / 2 + 10} ${yTop}`} stroke="#5E6B78" strokeWidth="6" fill="none" />
    <g opacity={leakK}>
      <path d={`M${holeX} ${holeY}Q${holeX - 90} ${holeY + 10} ${holeX - 140} 960`} stroke="#4FC3F7" strokeWidth="18" fill="none" strokeDasharray="30 12" strokeDashoffset={-frame * 7} strokeLinecap="round" />
      {Array.from({length: 4}, (_, i) => { const t = (frame * .03 + i / 4) % 1; return <circle key={i} cx={holeX - 80 - t * 120} cy={holeY + 40 + t * 200} r="9" fill="#4FC3F7" opacity={1 - t} />; })}
    </g>
    {!solid && <g opacity={hole} transform={`translate(${holeX} ${holeY})`}>
      <circle r={30 + 8 * Math.sin(frame / 4)} fill="none" stroke="#E53935" strokeWidth="6" />
      <path d="M-40 0H-180" stroke="#E53935" strokeWidth="5" />
      <text x="-190" y="14" textAnchor="end" fontFamily={SANS} fontSize="40" fontWeight="900" fill="#E53935">HOLE</text>
    </g>}
    {solid && <g transform={`translate(${holeX + 10} ${holeY}) scale(${patch}) rotate(-12)`} opacity={clamp(patch)}>
      <rect x="-52" y="-30" width="104" height="60" rx="10" fill="#2E7D4F" />
      {[-34, 34].map(x => <circle key={x} cx={x} r="7" fill="#C8E6C9" />)}
      <text y="10" textAnchor="middle" fontFamily={SANS} fontSize="24" fontWeight="900" fill="#FFFFFF">FIXED</text>
    </g>}
    {solid && Array.from({length: 7}, (_, i) => {
      const start = c[2] - 4 + i * 10;
      const t = clamp((frame - start) / 22);
      if (t <= 0) return null;
      const y = 180 + t * (yl - 180 + 10);
      return <g key={i} transform={`translate(${470 + (i % 3) * 60 + (i % 2) * 20} ${y})`} opacity={t < 1 ? 1 : 0}>
        <ellipse rx="34" ry="34" fill="#F4B400" stroke="#B8860B" strokeWidth="4" />
        <text y="13" textAnchor="middle" fontFamily={SANS} fontSize="36" fontWeight="900" fill="#7A5600">$</text>
      </g>;
    })}
  </Svg>;
};

/* 10 · Looking at one number instead of the whole picture. */
export const OneNumber: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [one, whole] = cues(p, [83, 130]);
  const spot = ease(ramp(frame, one - 6, 10));
  const all = ease(ramp(frame, whole - 4, 16));
  const tiles = ['Ad spend', 'Leads', 'Response time', 'Website', 'Follow-up', 'Booked estimates'];
  const pick = 1;
  return <Svg bg="#0D0F14">
    <text x="80" y="130" fontFamily={SANS} fontSize="62" fontWeight="850" letterSpacing="-2" fill="#FFFFFF" opacity={spot}>One number</text>
    <text x="470" y="130" fontFamily={SANS} fontSize="62" fontWeight="850" letterSpacing="-2" fill="#FFD400" opacity={all}>≠ the whole picture</text>
    <defs><radialGradient id="on-spot"><stop offset="0" stopColor="#FFF4C2" stopOpacity=".35" /><stop offset="1" stopColor="#FFF4C2" stopOpacity="0" /></radialGradient></defs>
    {tiles.map((label, i) => {
      const col = i % 3, row = Math.floor(i / 3);
      const x = 80 + col * 315, y = 240 + row * 290;
      const lit = i === pick ? Math.max(spot, all) : all;
      return <g key={label} transform={`translate(${x} ${y})`}>
        {i === pick && <ellipse cx="145" cy="125" rx={260 * (1 - all * .3)} ry={220 * (1 - all * .3)} fill="url(#on-spot)" opacity={spot} />}
        <rect width="290" height="250" rx="22" fill={lit > .5 ? '#1E2430' : '#14171D'} stroke={i === pick && spot > .5 && all < .5 ? '#FFD400' : '#2A303B'} strokeWidth="5" opacity={.3 + .7 * lit} />
        <text x="145" y={label.includes(' ') ? 116 : 138} textAnchor="middle" fontFamily={SANS} fontSize="40" fontWeight="800" fill="#FFFFFF" opacity={.2 + .8 * lit}>{label.split(' ').map((w, j) => <tspan key={w} x="145" dy={j ? 48 : 0}>{w}</tspan>)}</text>
      </g>;
    })}
  </Svg>;
};

/* 11 & 12 · Your numbers as a funnel, then the verdict. */
const STAGES = ['Leads last month', 'Responded < 5 min', 'Booked estimates'];
const stageShape = (i: number) => {
  const y = 285 + i * 158, h = 135, wt = 900 - i * 120, wb = wt - 100;
  return {y, h, d: `M${540 - wt / 2} ${y}H${540 + wt / 2}L${540 + wb / 2} ${y + h}H${540 - wb / 2}Z`, right: 540 + (wt + wb) / 4};
};
const Paper: React.FC<{children: React.ReactNode}> = ({children}) => <Svg bg="#FBF8F0">
  {Array.from({length: 18}, (_, i) => <path key={i} d={`M0 ${60 + i * 56}H1080`} stroke="#DCE6F2" strokeWidth="2" />)}
  <path d="M60 0V960" stroke="#E8A0A0" strokeWidth="3" />
  {children}
</Svg>;

export const YourNumbers: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [pull, leads, responded, booked] = cues(p, [64, 121, 183, 283]);
  return <Paper>
    <text x="100" y="110" fontFamily={SERIF} fontSize="40" fontStyle="italic" fill="#5B6575" opacity={ramp(frame, 0, 10)}>Before another dollar,</text>
    <text x="100" y="195" fontFamily={SANS} fontSize="68" fontWeight="900" letterSpacing="-2.5" fill="#14202B" opacity={ease(ramp(frame, pull - 4, 10))}>pull up your numbers</text>
    {[leads, responded, booked].map((at, i) => {
      const s = stageShape(i);
      const k = ease(ramp(frame, at - 6, 12));
      return <g key={i} opacity={k} transform={`translate(0 ${(1 - k) * -30})`}>
        <path d={s.d} fill="#1D3557" />
        <text x="540" y={s.y + 84} textAnchor="middle" fontFamily={SANS} fontSize="48" fontWeight="850" fill="#FFFFFF">{STAGES[i]}</text>
        <text x={s.right - 46} y={s.y + 92} textAnchor="end" fontFamily={SERIF} fontSize="56" fontStyle="italic" fill="#FFD400" opacity={ramp(frame, at + 10, 10)}>?</text>
      </g>;
    })}
  </Paper>;
};

export const Verdict: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [strong, volume, rightCall, weak, anywhere, leak, fixFirst] = cues(p, [45, 112, 177, 220, 229, 292, 308]);
  const phaseB = ease(ramp(frame, weak - 8, 10));
  const green = ease(ramp(frame, strong - 4, 12)) * (1 - phaseB);
  const red = ease(ramp(frame, anywhere - 2, 10));
  const inflow = ease(ramp(frame, volume + 10, 14)) * (1 - phaseB);
  const stampA = back(ease(ramp(frame, rightCall - 4, 10))) * (1 - phaseB);
  const stampB = back(ease(ramp(frame, fixFirst - 4, 10)));
  const bad = 1;
  const s1 = stageShape(bad);
  return <Paper>
    <text x="100" y="110" fontFamily={SANS} fontSize="62" fontWeight="900" letterSpacing="-2" fill="#1B7F4B" opacity={ramp(frame, 0, 10) * (1 - phaseB)}>Numbers strong?</text>
    <text x="100" y="110" fontFamily={SANS} fontSize="62" fontWeight="900" letterSpacing="-2" fill="#C0392B" opacity={phaseB}>Weak anywhere?</text>
    <g opacity={inflow}>
      <rect x="380" y="150" width="320" height="70" rx="35" fill="#FFD400" />
      <text x="540" y="198" textAnchor="middle" fontFamily={SANS} fontSize="34" fontWeight="900" fill="#14202B">+ AD SPEND</text>
      <path d="M540 226V288M524 272L540 290L556 272" stroke="#14202B" strokeWidth="6" fill="none" strokeLinecap="round" />
    </g>
    {STAGES.map((label, i) => {
      const s = stageShape(i);
      const fill = i === bad && red > 0 ? '#C0392B' : green > .5 ? '#1B7F4B' : '#1D3557';
      return <g key={label}>
        <path d={s.d} fill={fill} opacity={i !== bad && phaseB > .5 ? .35 + .65 * (1 - red) : 1} />
        <text x="540" y={s.y + 84} textAnchor="middle" fontFamily={SANS} fontSize="48" fontWeight="850" fill="#FFFFFF" opacity={i !== bad && phaseB > .5 ? .5 + .5 * (1 - red) : 1}>{label}</text>
        <Check x={s.right + 50} y={s.y + 70} r={30} k={ease(ramp(frame, strong - 2 + i * 5, 10)) * (1 - phaseB)} fill="#1B7F4B" />
      </g>;
    })}
    <g opacity={red}>
      {Array.from({length: 4}, (_, i) => { const t = (frame * .035 + i / 4) % 1; return <path key={i} d="M0-14Q10 0 0 10Q-10 0 0-14Z" transform={`translate(${s1.right + 30 + t * 40} ${s1.y + 110 + t * 220}) scale(1.6)`} fill="#3B8BD4" opacity={1 - t} />; })}
      <text x={s1.right + 20} y={s1.y + 40} fontFamily={SANS} fontSize="36" fontWeight="900" fill="#C0392B" opacity={ramp(frame, leak - 4, 8)}>LEAK</text>
    </g>
    <g transform={`translate(540 812) rotate(-3) scale(${stampA})`} opacity={clamp(stampA)}>
      <rect x="-330" y="-56" width="660" height="96" rx="14" fill="#FBF8F0" stroke="#1B7F4B" strokeWidth="9" />
      <text y="16" textAnchor="middle" fontFamily={SANS} fontSize="50" fontWeight="900" fill="#1B7F4B">MORE ADS: RIGHT CALL</text>
    </g>
    <g transform={`translate(540 812) rotate(-3) scale(${stampB})`} opacity={clamp(stampB)}>
      <rect x="-300" y="-56" width="600" height="96" rx="14" fill="#FBF8F0" stroke="#C0392B" strokeWidth="9" />
      <text y="16" textAnchor="middle" fontFamily={SANS} fontSize="50" fontWeight="900" fill="#C0392B">FIX THE LEAK FIRST</text>
    </g>
  </Paper>;
};
