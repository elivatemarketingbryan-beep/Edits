import React from 'react';
import {clamp} from '../../motion';
import type {VisualProps} from '../../types';

// Scenes for "before you fire your agency" (job video1). Every cue is a local
// frame inside the beat, taken from word timings in the plan's props.cues.
const ramp = (frame: number, start: number, length = 14) => clamp((frame - start) / length);
const ease = (v: number) => 1 - Math.pow(1 - v, 3);
const back = (v: number) => { const c = 1.7; return 1 + (c + 1) * Math.pow(v - 1, 3) + c * Math.pow(v - 1, 2); };
const cues = (p: VisualProps, fallback: number[]) => {
  const data = p.beat.visual.type === 'custom' ? p.beat.visual.props?.cues : undefined;
  return Array.isArray(data) && data.every(n => typeof n === 'number') ? data as number[] : fallback;
};
const SANS = 'Inter, Arial, sans-serif';
const SERIF = 'Georgia, "Times New Roman", serif';

const Check: React.FC<{x: number; y: number; p: number; color: string; size?: number}> = ({x, y, p, color, size = 1}) =>
  <path d="M-14 0L-4 11L16-12" transform={`translate(${x} ${y}) scale(${size})`} stroke={color} strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ease(p)} />;
const Cross: React.FC<{x: number; y: number; p: number; color: string; size?: number}> = ({x, y, p, color, size = 1}) =>
  <g transform={`translate(${x} ${y}) scale(${size})`} stroke={color} strokeWidth={7} strokeLinecap="round">
    <path d="M-12-12L12 12" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ease(clamp(p * 2))} />
    <path d="M12-12L-12 12" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ease(clamp(p * 2 - 1))} />
  </g>;

/* 2 · The three-month cancel cycle: a paper contract fills, gets stamped, gets replaced. */
const Contract: React.FC<{name: string; fill: number; question: number}> = ({name, fill, question}) => <g>
  <rect x="6" y="10" width="620" height="440" rx="10" fill="#C9BBA4" opacity=".5" />
  <rect width="620" height="440" rx="10" fill="#FFFDF7" stroke="#D9CDB8" strokeWidth="2" />
  <text x="44" y="78" fontFamily={SANS} fontSize="26" fontWeight="800" letterSpacing="5" fill="#8A7A62">MARKETING AGREEMENT</text>
  <text x="44" y="146" fontFamily={SERIF} fontSize="60" fontWeight="700" fill="#22201C">{name}</text>
  {[0, 1, 2].map(i => {
    const p = clamp(fill * 3 - i);
    const clipId = `month-fill-${name.replace(/\W/g, '')}-${i}`;
    return <g key={i} transform={`translate(${44 + i * 182} 210)`}>
      <defs><clipPath id={clipId}><rect width={162 * p} height="120" /></clipPath></defs>
      <rect width="162" height="120" rx="8" fill="#F1EADC" stroke="#D9CDB8" strokeWidth="2" />
      <text x="81" y="72" textAnchor="middle" fontFamily={SANS} fontSize="30" fontWeight="800" fill="#8A7A62">MONTH {i + 1}</text>
      <g clipPath={`url(#${clipId})`}>
        <rect width="162" height="120" rx="8" fill="#2E3A4E" />
        <text x="81" y="72" textAnchor="middle" fontFamily={SANS} fontSize="30" fontWeight="800" fill="#FFFDF7">MONTH {i + 1}</text>
      </g>
    </g>;
  })}
  <path d="M44 390H380" stroke="#D9CDB8" strokeWidth="2" />
  <text x="44" y="420" fontFamily={SANS} fontSize="20" fill="#A89A82">RESULTS</text>
  <text x="410" y="422" fontFamily={SERIF} fontSize="84" fontStyle="italic" fontWeight="700" fill="#C2402F" opacity={question} transform={`rotate(${-8 * question} 432 396)`}>?</text>
</g>;

export const ResetLoop: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [months, results, cancel, swap, hope] = cues(p, [34, 71, 138, 170, 236]);
  const fill = ease(ramp(frame, months - 6, results - months + 6));
  const stamp = ramp(frame, cancel, 7);
  const out = ease(ramp(frame, swap, 18));
  const inn = ease(ramp(frame, swap + 6, 20));
  return <svg viewBox="0 0 1080 960" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
    <rect width="1080" height="960" fill="#F2ECE1" />
    <g opacity=".08" stroke="#5A4A30">{Array.from({length: 24}, (_, i) => <path key={i} d={`M0 ${40 * i + 12}H1080`} />)}</g>
    <text x="540" y="140" textAnchor="middle" fontFamily={SERIF} fontSize="70" fontWeight="700" fill="#22201C" opacity={ramp(frame, 0, 10)}>The 3-month switch</text>
    <g transform={`translate(${140 - out * 1100} ${230 + (1 - ramp(frame, 0, 12)) * 30}) scale(1.29) rotate(${-2 - out * 10} 310 220)`}>
      <Contract name="Agency #1" fill={fill} question={ease(ramp(frame, results, 10))} />
      <g opacity={stamp} transform={`translate(330 230) rotate(-14) scale(${1 + (1 - ease(stamp)) * .7})`}>
        <rect x="-270" y="-62" width="540" height="124" rx="14" fill="#FFFDF7" fillOpacity=".55" stroke="#C2402F" strokeWidth="10" />
        <text y="25" textAnchor="middle" fontFamily={SANS} fontSize="70" fontWeight="900" letterSpacing="4" fill="#C2402F">CANCELLED</text>
      </g>
    </g>
    <g transform={`translate(${140 + (1 - inn) * 1100} 230) scale(1.29) rotate(${2 * (1 - inn)} 310 220)`} opacity={inn > 0 ? 1 : 0}>
      <Contract name="Agency #2" fill={0} question={0} />
    </g>
    <text x="540" y="850" textAnchor="middle" fontFamily={SERIF} fontSize="44" fontStyle="italic" fill="#5A4A30" opacity={ease(ramp(frame, hope - 20, 14))}>…and the clock starts again.</text>
  </svg>;
};

/* 3 · Every switch resets four things, in spoken order. */
const tileIcons: Record<string, React.ReactNode> = {
  track: <g fill="none" stroke="currentColor" strokeWidth="6"><circle r="30" /><circle r="10" /><path d="M0-46V-30M0 30V46M-46 0H-30M30 0H46" /></g>,
  creative: <g fill="none" stroke="currentColor" strokeWidth="6"><rect x="-38" y="-30" width="76" height="60" rx="6" /><path d="M-30 22L-8-4L8 12L18 2L32 22" strokeLinejoin="round" /><circle cx="16" cy="-12" r="6" /></g>,
  learn: <g fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round"><path d="M-40 30H40M-40 30V-34" /><path d="M-32 22Q-12 18 0 0T34-28" /></g>,
  team: <g fill="none" stroke="currentColor" strokeWidth="6"><circle cx="-18" cy="-16" r="14" /><circle cx="20" cy="-16" r="14" /><path d="M-44 32Q-40 6-18 6Q0 6 0 22M0 22Q2 6 20 6Q42 6 46 32" /></g>,
};
export const StartingOver: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [title, , ...tileCues] = cues(p, [86, 109, 141, 162, 197, 226]);
  const tiles = [{icon: 'track', label: 'Tracking'}, {icon: 'creative', label: 'Creatives'}, {icon: 'learn', label: 'Learning phase'}, {icon: 'team', label: 'A team that|knows you'}];
  return <svg viewBox="0 0 1080 960" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
    <rect width="1080" height="960" fill="#15171C" />
    <text x="80" y="150" fontFamily={SANS} fontSize="64" fontWeight="850" letterSpacing="-2" fill="#FFFFFF" opacity={ease(ramp(frame, title - 30, 12))}>Every switch resets</text>
    <rect x="80" y="180" width={300 * ease(ramp(frame, title - 24, 18))} height="8" rx="4" fill="#FF7A1A" />
    {tiles.map((t, i) => {
      const at = tileCues[i] ?? 140 + i * 30;
      const show = ease(ramp(frame, at - 4, 12));
      const drain = ease(ramp(frame, at + 10, 22));
      const x = 80 + (i % 2) * 470, y = 245 + Math.floor(i / 2) * 300;
      return <g key={t.icon} transform={`translate(${x} ${y + (1 - show) * 30})`} opacity={show}>
        <rect width="450" height="270" rx="22" fill="#20232A" stroke={drain > .98 ? '#FF7A1A' : '#2E323B'} strokeWidth="3" />
        <g transform="translate(78 92)" color={drain > .98 ? '#FF7A1A' : '#FFFFFF'}>{tileIcons[t.icon]}</g>
        {t.label.split('|').map((l, j, all) => <text key={j} x="150" y={(all.length > 1 ? 84 : 104) + j * 42} fontFamily={SANS} fontSize={all.length > 1 ? 34 : 38} fontWeight="800" fill="#FFFFFF">{l}</text>)}
        <rect x="40" y="180" width="370" height="22" rx="11" fill="#2E323B" />
        <rect x="40" y="180" width={Math.max(0, 370 * (1 - drain))} height="22" rx="11" fill="#FFFFFF" />
        <text x="410" y="244" textAnchor="end" fontFamily={SANS} fontSize="26" fontWeight="800" letterSpacing="3" fill="#FF7A1A" opacity={ramp(frame, at + 28, 8)}>BACK TO ZERO</text>
      </g>;
    })}
  </svg>;
};

/* 5 · Check the budget first: a gauge with the speaker's $60/day line. */
export const BudgetGauge: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [title, less, sixty, notEnough, test, optimize] = cues(p, [101, 134, 147, 195, 279, 302]);
  const cx = 540, cy = 690, r = 330;
  const at = (t: number) => Math.PI * (1 - t);
  const pt = (t: number, rad: number) => [cx + Math.cos(at(t)) * rad, cy - Math.sin(at(t)) * rad];
  const arc = (a: number, b: number, rad: number) => { const [x1, y1] = pt(a, rad); const [x2, y2] = pt(b, rad); return `M${x1} ${y1}A${rad} ${rad} 0 0 1 ${x2} ${y2}`; };
  const threshold = .56;
  const sweep = ease(ramp(frame, less - 10, 26));
  const needle = .05 + sweep * .27 + Math.sin(frame / 7) * .006 * sweep;
  const [nx, ny] = pt(needle, r - 60);
  const [tx, ty] = pt(threshold, r + 33);
  const [tx2, ty2] = pt(threshold, r - 33);
  const [px, py] = pt(threshold, r + 80);
  const lineIn = ease(ramp(frame, sixty - 6, 12));
  return <svg viewBox="0 0 1080 960" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
    <rect width="1080" height="960" fill="#0E1A2B" />
    <text x="540" y="130" textAnchor="middle" fontFamily={SANS} fontSize="62" fontWeight="850" letterSpacing="-2" fill="#FFFFFF" opacity={ease(ramp(frame, title - 40, 12))}>Before you blame the agency…</text>
    <text x="540" y="200" textAnchor="middle" fontFamily={SANS} fontSize="40" fontWeight="700" fill="#FFB547" opacity={ease(ramp(frame, title - 4, 12))}>check the daily budget</text>
    <path d={arc(0, 1, r)} stroke="#1D2C44" strokeWidth="58" fill="none" />
    <path d={arc(0, threshold, r)} stroke="#FF5A4E" strokeWidth="58" fill="none" opacity={.25 + .75 * ease(ramp(frame, notEnough - 8, 14))} />
    <path d={arc(threshold, 1, r)} stroke="#3DDC97" strokeWidth="58" fill="none" opacity={.25 + .75 * ease(ramp(frame, test - 10, 14))} />
    <g opacity={lineIn}>
      <path d={`M${tx2} ${ty2}L${tx} ${ty}`} stroke="#FFFFFF" strokeWidth="8" strokeLinecap="butt" />
      <rect x={px - 104} y={py - 33} width="208" height="66" rx="33" fill="#FFFFFF" />
      <text x={px} y={py + 13} textAnchor="middle" fontFamily={SANS} fontSize="36" fontWeight="900" fill="#0E1A2B">$60/day</text>
    </g>
    <path d={`M${cx} ${cy}L${nx} ${ny}`} stroke="#FFFFFF" strokeWidth="12" strokeLinecap="round" opacity={ramp(frame, less - 14, 8)} />
    <circle cx={cx} cy={cy} r="26" fill="#FFFFFF" opacity={ramp(frame, less - 14, 8)} />
    <text x="250" y="790" textAnchor="middle" fontFamily={SANS} fontSize="34" fontWeight="800" fill="#FF8A80" opacity={ease(ramp(frame, notEnough, 12))}>Too thin to test</text>
    {[['Test', test], ['Optimize', optimize]].map(([label, cue], i) =>
      <g key={label as string} opacity={ease(ramp(frame, (cue as number) - 6, 10))} transform={`translate(${700 + i * 0} ${742 + i * 80})`}>
        <rect width="250" height="62" rx="31" fill="#3DDC97" />
        <text x="125" y="42" textAnchor="middle" fontFamily={SANS} fontSize="32" fontWeight="850" fill="#0E1A2B">{label as string}</text>
      </g>)}
  </svg>;
};

/* 6 · Progress shows up before results: a blueprint timeline. */
export const ProgressPath: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [wait, testing, tracking, improving, progress, results] = cues(p, [44, 149, 163, 208, 291, 342]);
  const x0 = 110, x1 = 970, base = 690;
  const flip = ease(ramp(frame, progress - 10, 14));
  const steps = [{label: 'Test', at: testing}, {label: 'Track', at: tracking}, {label: 'Improve', at: improving}];
  const waitLine = ease(ramp(frame, wait - 10, 30));
  return <svg viewBox="0 0 1080 960" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
    <rect width="1080" height="960" fill="#0D3F8F" />
    <g stroke="#FFFFFF" opacity=".09">{Array.from({length: 28}, (_, i) => <path key={`v${i}`} d={`M${i * 40} 0V960`} />)}{Array.from({length: 25}, (_, i) => <path key={`h${i}`} d={`M0 ${i * 40}H1080`} />)}</g>
    <g fontFamily={SANS} fontWeight="850" fontSize="62" letterSpacing="-2" fill="#FFFFFF">
      <text x="80" y="140" opacity={ramp(frame, wait - 30, 10) * (1 - flip)}>Don't just wait it out</text>
      <text x="80" y="140" opacity={flip}>Progress comes first</text>
    </g>
    <path d={`M${x0} ${base}H${x1}`} stroke="#FFFFFF" strokeWidth="4" />
    {[['DAY 1', x0], ['DAY 90', x1]].map(([l, x]) => <g key={l as string}><path d={`M${x} ${base - 14}V${base + 14}`} stroke="#FFFFFF" strokeWidth="4" /><text x={x as number} y={base + 58} textAnchor="middle" fontFamily={SANS} fontSize="28" fontWeight="800" letterSpacing="3" fill="#BFD4FF">{l as string}</text></g>)}
    <path d={`M${x0} ${base - 30}H${x0 + (x1 - x0) * waitLine}`} stroke="#BFD4FF" strokeWidth="4" strokeDasharray="14 14" opacity={1 - ease(ramp(frame, testing - 8, 14)) * .7} />
    <text x={x0} y={base - 50} fontFamily={SANS} fontSize="28" fontWeight="700" fill="#BFD4FF" opacity={waitLine * (1 - ease(ramp(frame, testing - 8, 14)))}>waiting to see what happens…</text>
    {steps.map((s, i) => {
      const k = ease(ramp(frame, s.at - 6, 14));
      const sx = x0 + 40 + i * 200, sy = base - 90 - i * 110;
      const prevY = i === 0 ? base : base - 90 - (i - 1) * 110;
      return <g key={s.label} opacity={k}>
        <path d={`M${sx - 40} ${prevY}V${sy}H${sx + 160}`} stroke="#FFFFFF" strokeWidth="8" fill="none" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - k} />
        <rect x={sx - 6} y={sy - 72} width="170" height="54" rx="10" fill="#FFFFFF" />
        <text x={sx + 79} y={sy - 34} textAnchor="middle" fontFamily={SANS} fontSize="30" fontWeight="850" fill="#0D3F8F">{s.label}</text>
      </g>;
    })}
    <g opacity={ease(ramp(frame, progress - 4, 12))}>
      <path d={`M${x0 + 470} ${base - 80}L${x0 + 400} ${base - 160}`} stroke="#FFD34D" strokeWidth="6" strokeLinecap="round" />
      <text x={x0 + 480} y={base - 50} fontFamily={SANS} fontSize="44" fontWeight="900" fill="#FFD34D">PROGRESS</text>
    </g>
    <g opacity={ease(ramp(frame, results - 8, 14))} transform={`translate(${x1} ${base})`}>
      <path d="M0 0V-190" stroke="#FFFFFF" strokeWidth="6" />
      <path d="M0-190H-150L-120-155L-150-120H0Z" fill="#FFD34D" />
      <text x="-80" y="-220" textAnchor="middle" fontFamily={SANS} fontSize="30" fontWeight="800" fill="#FFFFFF">Results you want</text>
    </g>
  </svg>;
};

/* 7 · Is it getting better? Three qualitative signals, then money into an empty box. */
export const CampaignCheckup: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [title, cpl, targeting, creative, evolving, spending, nothing] = cues(p, [80, 120, 177, 234, 267, 320, 390]);
  const dim = ease(ramp(frame, spending - 6, 14));
  const rows = [cpl, targeting, creative];
  const drop = (d: number) => ease(ramp(frame, spending + d, 16));
  return <svg viewBox="0 0 1080 960" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
    <rect width="1080" height="960" fill="#F6F5F0" />
    <text x="80" y="140" fontFamily={SANS} fontSize="64" fontWeight="850" letterSpacing="-2" fill="#1B1E24" opacity={ease(ramp(frame, title - 40, 12))}>Is it getting better?</text>
    <g opacity={1 - dim * .94}>
      {['Cost per lead', 'Targeting', 'Creative'].map((label, i) => {
        const at = rows[i];
        const k = ease(ramp(frame, at - 6, 12));
        const y = 210 + i * 210;
        const g = ease(ramp(frame, at + 4, 26));
        return <g key={label} opacity={k} transform={`translate(80 ${y + (1 - k) * 24})`}>
          <rect width="920" height="180" rx="20" fill="#FFFFFF" stroke="#E2E0D8" strokeWidth="2" />
          <text x="40" y="78" fontFamily={SANS} fontSize="42" fontWeight="800" fill="#1B1E24">{label}</text>
          <text x="40" y="128" fontFamily={SANS} fontSize="28" fontWeight="600" fill="#6B6F78">{['improving?', 'getting tighter?', 'evolving?'][i]}</text>
          <g transform="translate(470 30)">
            {i === 0 && <path d="M0 30L70 50L140 44L210 82L280 96L330 120" stroke="#1F9D55" strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - g} />}
            {i === 1 && [70, 48, 26].map((rad, j) => <circle key={j} cx="165" cy="60" r={rad} fill="none" stroke="#1F9D55" strokeWidth={5} opacity={clamp(g * 3 - j)} />)}
            {i === 1 && <circle cx="165" cy="60" r="8" fill="#1F9D55" opacity={g} />}
            {i === 2 && [0, 1, 2].map(j => { const v = clamp(ease(ramp(frame, (j === 2 ? evolving : at + 4 + j * 10), 10))); return <g key={j} opacity={v} transform={`translate(${j * 115} ${(1 - v) * 20})`}>
              <rect width="95" height="120" rx="10" fill={j === 2 ? '#1F9D55' : '#E8E6DF'} />
              <text x="47" y="74" textAnchor="middle" fontFamily={SANS} fontSize="32" fontWeight="850" fill={j === 2 ? '#FFFFFF' : '#6B6F78'}>v{j + 1}</text>
            </g>; })}
          </g>
          <Check x={868} y={90} p={ramp(frame, at + 24, 10)} color="#1F9D55" />
        </g>;
      })}
    </g>
    <g opacity={dim}>
      <rect x="0" y="0" width="1080" height="960" fill="#F6F5F0" opacity=".55" />
      <g transform="translate(540 620)">
        <path d="M-210-60H210L180 180H-180Z" fill="#FFFFFF" stroke="#1B1E24" strokeWidth="6" strokeLinejoin="round" />
        <text y="60" textAnchor="middle" fontFamily={SANS} fontSize="38" fontWeight="850" fill="#1B1E24">RESULTS</text>
        <text y="120" textAnchor="middle" fontFamily={SANS} fontSize="30" fontWeight="700" fill="#D64545" opacity={ease(ramp(frame, nothing - 4, 10))}>empty</text>
        {[0, 1, 2].map(j => { const d = drop(j * 18); return <g key={j} opacity={d < 1 ? clamp(d * 4) : 0} transform={`translate(${-60 + j * 60} ${-330 + d * 300})`}>
          <circle r="40" fill="#E9B949" stroke="#B58A1E" strokeWidth="5" />
          <text y="14" textAnchor="middle" fontFamily={SANS} fontSize="40" fontWeight="900" fill="#7A5A0C">$</text>
        </g>; })}
      </g>
      <text x="540" y="320" textAnchor="middle" fontFamily={SANS} fontSize="40" fontWeight="800" fill="#1B1E24">Month after month</text>
    </g>
  </svg>;
};

/* 8 · When to question the agency: a clipboard of missing work. */
const Clipboard: React.FC<{items: string[]; marks: number[]; tone: 'red' | 'green'; frame: number}> = ({items, marks, tone, frame}) => {
  const color = tone === 'red' ? '#D64545' : '#1F9D55';
  return <g>
    <rect x="8" y="14" width="600" height="560" rx="26" fill="#000000" opacity=".18" />
    <rect width="600" height="560" rx="26" fill="#B98552" />
    <rect x="34" y="60" width="532" height="476" rx="10" fill="#FFFFFF" />
    <rect x="200" y="-24" width="200" height="70" rx="16" fill="#5B6270" />
    {items.map((t, i) => {
      const k = ease(ramp(frame, marks[i] - 8, 10));
      return <g key={t} transform={`translate(70 ${150 + i * 130})`} opacity={.25 + .75 * k}>
        <rect x="-10" y="-38" width="56" height="56" rx="10" fill="none" stroke="#C9CCD3" strokeWidth="4" />
        {tone === 'red' ? <Cross x={18} y={-10} p={ramp(frame, marks[i], 10)} color={color} /> : <Check x={18} y={-10} p={ramp(frame, marks[i], 10)} color={color} />}
        <text x="76" y="2" fontFamily={SANS} fontSize={t.length > 16 ? 36 : 40} fontWeight="800" fill="#1B1E24">{t}</text>
      </g>;
    })}
  </g>;
};
export const QuestionAgency: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [strategy, testing, improvements, enough, question] = cues(p, [15, 48, 86, 146, 183]);
  const badge = back(ease(ramp(frame, enough - 6, 14)));
  return <svg viewBox="0 0 1080 960" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
    <rect width="1080" height="960" fill="#F7E9E4" />
    <text x="80" y="128" fontFamily={SANS} fontSize="58" fontWeight="850" letterSpacing="-2" fill="#3A1414" opacity={ramp(frame, 0, 10)}>Time to ask questions if…</text>
    <g transform="translate(80 230) scale(.95)"><Clipboard items={['Strategy', 'Meaningful testing', 'Improvements']} marks={[strategy, testing, improvements]} tone="red" frame={frame} /></g>
    <g transform={`translate(860 440) scale(${badge}) rotate(8)`} opacity={clamp(badge)}>
      <rect x="-135" y="-150" width="270" height="290" rx="22" fill="#FFFFFF" stroke="#3A1414" strokeWidth="6" />
      <rect x="-135" y="-150" width="270" height="74" rx="22" fill="#D64545" />
      <rect x="-135" y="-100" width="270" height="24" fill="#D64545" />
      <text y="-100" textAnchor="middle" fontFamily={SANS} fontSize="30" fontWeight="900" letterSpacing="3" fill="#FFFFFF">MONTHS</text>
      <text y="60" textAnchor="middle" fontFamily={SANS} fontSize="150" fontWeight="900" fill="#3A1414">3</text>
      <text y="118" textAnchor="middle" fontFamily={SANS} fontSize="28" fontWeight="800" fill="#D64545">is enough</text>
    </g>
    <text x="860" y="690" textAnchor="middle" fontFamily={SERIF} fontSize="150" fontWeight="700" fontStyle="italic" fill="#D64545" opacity={ease(ramp(frame, question - 4, 10))} transform={`rotate(-8 860 690)`}>?</text>
  </svg>;
};

/* 9 · When switching wastes progress: checks build a wall; switching knocks it down. */
export const KeepProgress: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [data, improving, direction, switching, throwing, startOver] = cues(p, [60, 102, 146, 168, 222, 271]);
  const marks = [data, improving, direction];
  const fall = (i: number) => ease(ramp(frame, throwing + (i % 5) * 3, 24));
  const bricks = Array.from({length: 12}, (_, i) => ({col: i % 4, row: Math.floor(i / 4)}));
  return <svg viewBox="0 0 1080 960" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
    <rect width="1080" height="960" fill="#10291F" />
    <text x="80" y="128" fontFamily={SANS} fontSize="58" fontWeight="850" letterSpacing="-2" fill="#FFFFFF" opacity={ramp(frame, 0, 10)}>But if it's working…</text>
    {['Useful data', 'Improving', 'Right direction'].map((t, i) => {
      const k = ease(ramp(frame, marks[i] - 8, 10));
      return <g key={t} transform={`translate(80 ${230 + i * 100})`} opacity={.25 + .75 * k}>
        <circle cx="26" cy="-12" r="30" fill="#7CF0B4" opacity={k} />
        <Check x={26} y={-12} p={ramp(frame, marks[i], 10)} color="#10291F" size={.9} />
        <text x="80" y="2" fontFamily={SANS} fontSize="42" fontWeight="800" fill="#FFFFFF">{t}</text>
      </g>;
    })}
    <g transform="translate(560 720)">
      <path d="M-20 0H460" stroke="#7CF0B4" strokeWidth="4" opacity=".5" />
      {bricks.map((b, i) => {
        const built = ease(ramp(frame, marks[Math.floor(i / 4)] + (i % 4) * 4, 10));
        const f = fall(i);
        const x = b.col * 112 + (b.row % 2) * 30, y = -70 - b.row * 72;
        return <rect key={i} x={x + f * (b.col - 1.5) * 50} y={y + (1 - built) * -60 + f * (b.row * 72 + 20)} width="104" height="64" rx="6" fill={['#C8613E', '#B5553A', '#D27050'][(i + b.row) % 3]} stroke="#7A3520" strokeWidth="3"
          opacity={built * (1 - clamp(f * 1.4 - .4))} transform={`rotate(${f * (i % 2 ? 24 : -18)} ${x + 52} ${y + 32})`} />;
      })}
      <text x="220" y="70" textAnchor="middle" fontFamily={SANS} fontSize="30" fontWeight="800" letterSpacing="3" fill="#7CF0B4" opacity={ease(ramp(frame, switching - 4, 10)) * (1 - ease(ramp(frame, startOver - 6, 10)))}>PROGRESS SO FAR</text>
    </g>
    <g opacity={ease(ramp(frame, startOver - 4, 12))} transform="translate(780 520) rotate(-6)">
      <rect x="-195" y="-50" width="390" height="100" rx="14" fill="#FFFFFF" />
      <text y="18" textAnchor="middle" fontFamily={SANS} fontSize="46" fontWeight="900" fill="#10291F">Back to Day 1</text>
    </g>
  </svg>;
};

/* 10 · Neither extreme is the goal: full-frame type with two rules struck out. */
export const NotTheGoal: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [wait, rush, slow] = cues(p, [65, 104, 172]);
  const strike = (at: number) => ease(ramp(frame, at, 12));
  const line = (y: number, text: string[], at: number) => <g transform={`translate(80 ${y})`} opacity={ease(ramp(frame, at - 24, 12))}>
    {text.map((t, i) => <g key={i}>
      <text y={i * 112} fontFamily={SANS} fontSize="100" fontWeight="900" letterSpacing="-4" fill="#111111">{t}</text>
      <rect x="-12" y={i * 112 - 44} width={(t.length * 54 + 24) * ease(clamp(strike(at) * 2 - i))} height="20" rx="4" fill="#D7261E" />
    </g>)}
  </g>;
  return <svg viewBox="0 0 1080 1920" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
    <rect width="1080" height="1920" fill="#FFD400" />
    <text x="80" y="330" fontFamily={SANS} fontSize="54" fontWeight="800" letterSpacing="8" fill="#111111" opacity={ramp(frame, 0, 10)}>THE GOAL ISN'T TO</text>
    {line(520, ['Give every', 'agency 3 months'], wait)}
    <text x="80" y="850" fontFamily={SERIF} fontSize="64" fontStyle="italic" fill="#111111" opacity={ease(ramp(frame, rush - 30, 10))}>or</text>
    {line(1000, ['Switch the second', 'results are slow'], slow - 40)}
  </svg>;
};

/* 11 · The two questions to actually ask. */
export const TwoQuestions: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [budget, fair, agency, progress] = cues(p, [44, 98, 146, 190]);
  const q = [{n: '1', lines: ['Does the budget give it', 'a fair chance?'], at: budget, done: fair}, {n: '2', lines: ['Is the agency actually', 'making progress?'], at: agency, done: progress}];
  return <svg viewBox="0 0 1080 960" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
    <rect width="1080" height="960" fill="#101828" />
    <text x="80" y="140" fontFamily={SANS} fontSize="62" fontWeight="850" letterSpacing="-2" fill="#FFFFFF" opacity={ramp(frame, 0, 10)}>Ask these instead</text>
    <rect x="80" y="170" width={260 * ease(ramp(frame, 4, 18))} height="8" rx="4" fill="#FF7A1A" />
    {q.map((item, i) => {
      const k = ease(ramp(frame, item.at - 16, 12));
      const d = ramp(frame, item.done + 6, 12);
      return <g key={item.n} transform={`translate(80 ${250 + i * 300 + (1 - k) * 30})`} opacity={k}>
        <rect width="920" height="250" rx="24" fill="#1A2436" stroke={d > .9 ? '#FF7A1A' : '#26324A'} strokeWidth="3" />
        <circle cx="90" cy="125" r="50" fill={d > .5 ? '#FF7A1A' : '#26324A'} />
        {d > .3 ? <Check x={90} y={125} p={d} color="#101828" size={1.3} /> : <text x="90" y="145" textAnchor="middle" fontFamily={SANS} fontSize="56" fontWeight="900" fill="#FFFFFF">{item.n}</text>}
        {item.lines.map((l, j) => <text key={j} x="180" y={112 + j * 58} fontFamily={SANS} fontSize="46" fontWeight={j ? 850 : 700} fill={j ? '#FFFFFF' : '#C7D0E0'}>{l}</text>)}
      </g>;
    })}
  </svg>;
};
