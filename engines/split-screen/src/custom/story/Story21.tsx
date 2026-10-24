import React from 'react';
import {clamp} from '../../motion';
import type {VisualProps} from '../../types';
import {cues} from '../modern/kit';
import {M, kf, EIO, EOUT, inK, World2, speed, Stage2, Floor, House2, Van2, Person2, Glass, CAST, SKY, backdrop2, ShadowE} from './storyKit2';
import {Markup, Logo, Emoji, Burn} from '../pack/packKit';

// "Don't turn the tap off" (video21): modern story scenes with the user's editing pack
// (hand-drawn markups, real logos, emojis). No figures in the source.

const ink = '-apple-system, "SF Pro Display", "Segoe UI", Arial, sans-serif';
const Panel: React.FC<{x: number; y: number; w: number; k: number; children: React.ReactNode; dark?: boolean}> = ({x, y, w, k, children, dark}) =>
  <div style={{position: 'absolute', left: x, top: y, width: w, padding: '24px 28px', borderRadius: 32, background: dark ? 'rgba(30,33,64,.86)' : 'rgba(255,255,255,.8)', color: dark ? '#fff' : M.ink, backdropFilter: 'blur(18px)', boxShadow: '0 20px 50px rgba(30,33,64,.16)', opacity: k, transform: `translateY(${(1 - k) * 20}px)`, fontFamily: ink}}>{children}</div>;

/* 2 · Bills, materials, a crew depending on you — so you hold on to every dollar. */
export const S21Bills: React.FC<VisualProps> = (p) => {
  const f = p.frame;
  const [bills, pay, materials, crew, hold, dollar] = cues(p, [10, 25, 41, 101, 175, 200]);
  const keys: Array<[number, number]> = [[0, 520], [crew - 6, 560], [crew + 20, 640], [hold, 560]];
  const cx = kf(f, keys), zoom = kf(f, [[0, 1.25], [crew - 6, 1.2], [crew + 20, 1.0], [hold, 1.3]]);
  const pile = Math.min(5, Math.floor(clamp((f - bills) / 30) * 6));
  return <Stage2 p={p} sky={SKY.night}>
    <World2 cx={cx} cy={520} zoom={zoom} vx={speed(f, keys)} layers={[...backdrop2('night', 1), {depth: 1, children: <>
      <Floor y={760} c="#2D3266" />
      <rect x={300} y={630} width={480} height={20} rx={8} fill="#8B6A4E" /><rect x={320} y={650} width={16} height={110} fill="#6E523B" /><rect x={744} y={650} width={16} height={110} fill="#6E523B" />
      <circle cx={540} cy={420} r={160} fill="rgba(255,214,140,.18)" /><path d="M520 300H560L590 360H490Z" fill="#FFD98A" />
      {Array.from({length: pile}, (_, i) => <g key={i} transform={`translate(${430 + i * 22} ${618 - i * 8}) rotate(${-8 + i * 5})`}><rect width={90} height={60} rx={4} fill="#fff" /><rect x={10} y={12} width={50} height={6} rx={3} fill="#C9CED6" /><rect x={10} y={26} width={60} height={6} rx={3} fill="#C9CED6" /><text x={70} y={52} fontSize={16} fontWeight={900} fill="#E5484D" fontFamily="Arial">DUE</text></g>)}
      <Person2 x={250} y={770} kind="pro" ap={CAST.you} pose={{mood: f > hold ? 'worried' : 'neutral', armR: f > hold ? -60 : -20, armL: f > hold ? -60 : 8}} />
      {f > hold && <g transform="translate(330 610)"><rect x={-34} y={-60} width={68} height={72} rx={14} fill="rgba(190,230,255,.65)" stroke="#fff" strokeWidth={3} /><text y={-14} textAnchor="middle" fontSize={34} fontWeight={900} fill="#14532D" fontFamily="Arial">$</text></g>}
      <g opacity={inK(f, crew - 6, 14)}><Person2 x={900} y={770} s={.9} kind="pro" ap={CAST.crew} flip pose={{mood: 'neutral'}} /><Person2 x={1030} y={770} s={.85} kind="neighbor" ap={CAST.kenji} flip pose={{mood: 'neutral'}} /></g>
    </>}]} />
    <Glass x={540} y={64} k={inK(f, bills) * (1 - inK(f, materials - 6, 8))} tone="glass">Bills to pay</Glass>
    <Glass x={540} y={64} k={inK(f, materials) * (1 - inK(f, crew - 6, 8))} tone="glass">Materials to buy</Glass>
    <Glass x={540} y={64} k={inK(f, crew) * (1 - inK(f, hold - 6, 8))} tone="glass">A crew depending on you</Glass>
    <Glass x={540} y={64} k={inK(f, hold)} tone="ink">So you hold on to every dollar</Glass>
    <Markup name="circle---red" at={dollar - 4} x={40} y={440} w={400} />
    <Burn at={0} n={1} opacity={.8} />
    <div style={{position: 'absolute', left: 140, top: 120, width: 120, opacity: inK(f, pay, 10) * (1 - inK(f, crew - 6, 8)), transform: `rotate(-8deg) scale(${.9 + .1 * inK(f, pay, 10)})`}}><Emoji name="calendar" style={{width: 110}} /></div>
    <div style={{position: 'absolute', left: 840, top: 130, width: 120, opacity: inK(f, materials, 10) * (1 - inK(f, crew - 6, 8))}}><Emoji name="building construction" style={{width: 120}} /></div>
  </Stage2>;
};

/* 3 · Already struggling for work — what happens if you stop generating new opportunities? He shuts the valve. */
export const S21Tap: React.FC<VisualProps> = (p) => {
  const f = p.frame;
  const [struggling, work, stop, generate, opportunities] = cues(p, [106, 149, 218, 242, 264]);
  const valve = EIO(clamp((f - stop) / 16));
  const flow = 1 - valve;
  const drops = Array.from({length: 7}, (_, i) => { const t = ((f / 22) + i / 7) % 1; return {t, show: f < stop + 30 * t || flow > .5}; });
  const level = .2 + .5 * clamp((f - 0) / 200) - .4 * clamp((f - stop - 20) / 60);
  return <Stage2 p={p} sky={SKY.midday}>
    <World2 cx={560} cy={520} zoom={kf(f, [[0, 1.0], [stop - 10, 1.0], [stop + 10, 1.25], [opportunities, 1.1]])} layers={[...backdrop2('site', 2), {depth: 1, children: <>
      <Floor y={760} />
      <path d="M-100 300H700V360" fill="none" stroke="#8C92B5" strokeWidth={34} strokeLinejoin="round" />
      <g transform="translate(560 300)"><rect x={-26} y={-60} width={52} height={60} fill="#5B6188" /><g transform={`rotate(${valve * 90})`}><rect x={-60} y={-74} width={120} height={18} rx={9} fill="#E5484D" /></g></g>
      {drops.map((d, i) => d.show && <g key={i} transform={`translate(700 ${370 + d.t * 250})`} opacity={flow > .1 || d.t < .9 ? 1 : 0}><circle r={14} fill={M.indigo} /><path d="M-5 -2L-1 3L6 -5" stroke="#fff" strokeWidth={3} fill="none" /></g>)}
      <g transform="translate(700 760)"><ShadowE x={0} y={0} w={240} /><path d="M-110 -170H110L90 0H-90Z" fill="rgba(255,255,255,.7)" stroke="#D5D9F2" strokeWidth={4} /><path d={`M${-90 - 20 * (1 - clamp(level))} ${-170 * clamp(level)}H${90 + 20 * (1 - clamp(level))}L90 0H-90Z`} fill="rgba(91,91,240,.45)" /></g>
      <Person2 x={440} y={770} kind="pro" ap={CAST.you} pose={{armR: f > stop - 20 && f < stop + 20 ? -160 : -10, mood: f > generate + 20 ? 'worried' : 'neutral'}} />
    </>}]} />
    <Glass x={540} y={64} k={inK(f, 4) * (1 - inK(f, struggling - 6, 8))} tone="glass">New opportunities flowing in</Glass>
    <Glass x={540} y={64} k={inK(f, struggling) * (1 - inK(f, stop - 6, 8))} tone="ink">Already struggling for work…</Glass>
    <Glass x={540} y={64} k={inK(f, stop)} tone="peach">…and you shut it off?</Glass>
    <Markup name="question-mark" at={opportunities - 6} x={600} y={330} w={420} />
  </Stage2>;
};

/* 4 · Save money short term, but an empty calendar down the road. */
export const S21Road: React.FC<VisualProps> = (p) => {
  const f = p.frame;
  const [save, money, short, hard, calendar, road] = cues(p, [13, 22, 36, 99, 127, 156]);
  const keys: Array<[number, number]> = [[0, 320], [short + 20, 320], [hard + 6, 1260]];
  const cx = kf(f, keys);
  const coins = Math.min(5, Math.floor(clamp((f - save) / 30) * 6));
  return <Stage2 p={p} sky={SKY.dusk}>
    <World2 cx={cx} cy={520} zoom={1.05} vx={speed(f, keys)} layers={[...backdrop2('suburb', 3), {depth: 1, children: <>
      <Floor y={760} c="#E9DDE8" />
      <path d="M-200 790H2000" stroke="#B9AFC7" strokeWidth={70} /><path d="M-200 790H2000" stroke="#fff" strokeWidth={5} strokeDasharray="40 40" />
      <Person2 x={260} y={770} kind="pro" ap={CAST.you} pose={{mood: f < hard ? 'happy' : 'worried', armR: -60}} />
      <g transform="translate(380 640)">{Array.from({length: coins}, (_, i) => <g key={i} transform={`translate(0 ${-i * 16})`}><ellipse rx={36} ry={12} fill="#FFC21A" stroke="#E0A400" strokeWidth={3} /></g>)}</g>
      {[700, 1000].map(x => <g key={x} transform={`translate(${x} 760)`}><rect x={-6} y={-80} width={12} height={80} fill="#B49A87" /><circle cy={-110} r={44} fill="#C9A9D6" /></g>)}
      <g transform="translate(1260 760)"><rect x={-8} y={-300} width={16} height={300} fill="#8C92B5" />
        <rect x={-160} y={-440} width={320} height={260} rx={22} fill="#fff" /><rect x={-160} y={-440} width={320} height={56} rx={22} fill="#E5484D" /><rect x={-160} y={-404} width={320} height={20} fill="#E5484D" />
        <text y={-402} textAnchor="middle" fontSize={26} fontWeight={800} fill="#fff" fontFamily="Arial">DOWN THE ROAD</text>
        {Array.from({length: 15}, (_, i) => <rect key={i} x={-140 + (i % 5) * 58} y={-370 + Math.floor(i / 5) * 60} width={46} height={46} rx={8} fill="#F1F2F8" />)}</g>
    </>}]} />
    <Glass x={540} y={64} k={inK(f, save) * (1 - inK(f, hard - 6, 8))} tone="mint">Save money short term</Glass>
    <Glass x={540} y={64} k={inK(f, hard)} tone="ink">An empty calendar down the road</Glass>
    <Markup name="x-mark-red" at={calendar - 4} x={300} y={180} w={480} />
  </Stage2>;
};

/* 5 · Don't throw money you can't afford: manage cash flow, protect the operating budget, make sure you can handle it. */
export const S21Budget: React.FC<VisualProps> = (p) => {
  const f = p.frame;
  const [throwIt, money, afford, cash, protect, handle, investment] = cues(p, [50, 57, 101, 153, 179, 270, 284]);
  const rows = [['Cash flow', cash, 'Managed'], ['Operating budget', protect, 'Protected'], ['Can you handle it?', handle, 'Check first']] as const;
  return <Stage2 p={p} sky={SKY.morning}>
    <World2 cx={540} cy={520} zoom={1.0} layers={[...backdrop2('city', 4), {depth: 1, children: <>
      <Floor y={760} />
      <Person2 x={200} y={770} kind="pro" ap={CAST.you} pose={{armR: f < afford ? -110 + 40 * Math.sin(f / 3) : -10, mood: f < afford ? 'neutral' : 'happy'}} />
      {f > throwIt - 6 && f < afford + 10 && Array.from({length: 5}, (_, i) => { const t = ((f - throwIt) / 20 + i / 5) % 1; return <g key={i} transform={`translate(${260 + t * 300} ${430 - Math.sin(t * Math.PI) * 120 + t * 200})`} opacity={1 - t}><rect x={-30} y={-12} width={60} height={24} rx={4} fill="#7FD6B6" /></g>; })}
    </>}]} />
    <Glass x={540} y={64} k={inK(f, throwIt - 6) * (1 - inK(f, cash - 8, 8))} tone="peach">Don't throw money you can't afford</Glass>
    <Markup name="x-mark-red" at={afford - 6} x={160} y={250} w={520} />
    <Panel x={480} y={170} w={540} k={inK(f, cash - 6)}>
      <div style={{fontSize: 22, fontWeight: 700, letterSpacing: 2, color: M.mute}}>BEFORE YOU SPEND</div>
      {rows.map(([t, at, tag], i) => <div key={t} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 0', borderTop: i ? '1.5px solid rgba(0,0,0,.07)' : 'none', opacity: inK(f, at - 4)}}>
        <span style={{fontSize: 34, fontWeight: 700}}>{t}</span><span style={{fontSize: 24, fontWeight: 700, color: '#fff', background: i === 2 ? M.indigo : M.mint, padding: '8px 18px', borderRadius: 999}}>{tag}</span></div>)}
    </Panel>
    <Glass x={750} y={600} k={inK(f, investment)} tone="ink">Then invest</Glass>
  </Stage2>;
};

/* 6 · Free moves first: improve your Google profile, follow up with old leads, get more reviews. */
export const S21Free: React.FC<VisualProps> = (p) => {
  const f = p.frame;
  const [ways, consistently, google, follow, reviews, past] = cues(p, [57, 102, 197, 239, 309, 336]);
  const items: Array<[React.ReactNode, string, number]> = [
    [<Logo key="g" name="GOOGLE" style={{width: 64, height: 64}} />, 'Improve your Google profile', google],
    [<Emoji key="p" name="phone" style={{width: 60}} />, 'Follow up with old leads', follow],
    [<span key="s" style={{fontSize: 52, color: M.sun}}>★</span>, 'Get reviews from past customers', reviews],
  ];
  return <Stage2 p={p} sky={SKY.golden}>
    <World2 cx={560} cy={520} zoom={1.0} layers={[...backdrop2('park', 5), {depth: 1, children: <>
      <Floor y={760} c="#EFE6D6" />
      <House2 x={900} y={760} s={.75} roof="b" glow={inK(f, past, 20)} />
      <Person2 x={180} y={770} kind="pro" ap={CAST.you} pose={{phone: f > follow - 6, armR: f > follow - 6 ? -150 : -10, mood: 'happy'}} />
      <Person2 x={1040} y={770} kind="home" ap={CAST.ana} flip pose={{mood: f > reviews ? 'happy' : 'neutral', phone: f > reviews, armR: f > reviews ? -150 : -10}} />
    </>}]} />
    <Glass x={540} y={64} k={inK(f, ways - 6) * (1 - inK(f, google - 10, 8))} tone="glass">Generate business consistently</Glass>
    <Glass x={540} y={64} k={inK(f, google - 6)} tone="ink">Start with the free moves</Glass>
    <Panel x={250} y={140} w={580} k={inK(f, google - 10)}>
      {items.map(([icon, t, at], i) => <div key={t} style={{position: 'relative', display: 'flex', alignItems: 'center', gap: 22, padding: '18px 0', borderTop: i ? '1.5px solid rgba(0,0,0,.07)' : 'none', opacity: inK(f, at - 4)}}>
        <div style={{width: 70, display: 'flex', justifyContent: 'center'}}>{icon}</div><div style={{fontSize: 32, fontWeight: 700}}>{t}</div></div>)}
    </Panel>
    {items.map(([, , at], i) => <Markup key={i} name="check-mark" at={at + 6} x={740} y={110 + i * 108} w={190} />)}
  </Stage2>;
};

/* 7 · With budget for paid ads, approach it with a plan instead of desperation. */
export const S21Plan: React.FC<VisualProps> = (p) => {
  const f = p.frame;
  const [budget, paid, advertising, plan, desperation] = cues(p, [30, 61, 69, 136, 167]);
  const ghost = inK(f, desperation - 6, 10);
  return <Stage2 p={p} sky={SKY.midday}>
    <World2 cx={560} cy={520} zoom={kf(f, [[0, 1.0], [plan, 1.1]])} layers={[...backdrop2('city', 6), {depth: 1, children: <>
      <Floor y={760} />
      <Person2 x={330} y={770} kind="pro" ap={CAST.you} pose={{armR: -70, armL: -40, mood: 'happy'}} />
      <g transform="translate(470 560) rotate(-4)" opacity={inK(f, plan - 8, 12)}><rect x={-90} y={-70} width={180} height={140} rx={10} fill="#DBEAFE" stroke="#93C5FD" strokeWidth={4} />{[0, 1, 2].map(i => <g key={i}><circle cx={-60} cy={-34 + i * 36} r={8} fill={M.indigo} /><rect x={-40} y={-40 + i * 36} width={110} height={12} rx={6} fill="#93C5FD" /></g>)}</g>
      <g opacity={.35 * ghost}><Person2 x={820} y={770} kind="pro" ap={CAST.you} flip pose={{walk: f / 2, armR: -150, armL: -150, mood: 'worried'}} /></g>
    </>}]} />
    <div style={{position: 'absolute', left: 120, top: 150, display: 'flex', gap: 22, opacity: inK(f, paid - 4), transform: `translateY(${(1 - inK(f, paid - 4)) * 16}px)`}}>
      {['GOOGLE ADS', 'facebook', 'INSTAGRAM'].map((n, i) => <div key={n} style={{width: 120, height: 120, borderRadius: 30, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 30px rgba(30,33,64,.14)', opacity: inK(f, paid - 4 + i * 3)}}><Logo name={n} style={{width: 80, height: 80}} /></div>)}
    </div>
    <Glass x={540} y={64} k={inK(f, budget - 4) * (1 - inK(f, plan - 8, 8))} tone="glass">When you have the budget for paid ads</Glass>
    <Glass x={540} y={64} k={inK(f, plan - 4)} tone="indigo">Go in with a plan</Glass>
    <Glass x={820} y={330} k={ghost} tone="peach">not desperation</Glass>
    <Markup name="circle---red" at={plan - 2} x={250} y={380} w={440} />
  </Stage2>;
};

/* 9 · Stop treating marketing like an expense with no purpose — look at what it's producing. */
export const S21Produce: React.FC<VisualProps> = (p) => {
  const f = p.frame;
  const [treating, expense, purpose, looking, producing] = cues(p, [62, 98, 127, 166, 210]);
  const flip = inK(f, looking - 4, 14);
  const stages = ['Leads', 'Estimates', 'Jobs', 'Revenue'];
  return <Stage2 p={p} sky={SKY.morning}>
    <World2 cx={560} cy={520} zoom={1.0} layers={[...backdrop2('suburb', 7), {depth: 1, children: <>
      <Floor y={760} />
      <Person2 x={180} y={770} kind="pro" ap={CAST.you} pose={{mood: flip > .5 ? 'happy' : 'neutral', armR: flip > .5 ? -100 : -10}} />
      <Van2 x={1000} y={780} s={.6} />
    </>}]} />
    <Panel x={300} y={150} w={460} k={inK(f, treating - 6) * (1 - flip)}>
      <div style={{fontSize: 22, fontWeight: 700, letterSpacing: 2, color: M.mute}}>RECEIPT</div>
      <div style={{fontSize: 40, fontWeight: 800, marginTop: 8}}>Marketing</div>
      <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 30, fontWeight: 600}}><span>Expense</span><span>$$$</span></div>
      <div style={{fontSize: 26, color: M.mute, marginTop: 6, opacity: inK(f, purpose - 4)}}>Purpose: ?</div>
    </Panel>
    <Markup name="x-mark-red" at={purpose} x={260} y={120} w={540} dur={looking - purpose} />
    <Panel x={260} y={130} w={560} k={flip}>
      <div style={{fontSize: 22, fontWeight: 700, letterSpacing: 2, color: M.mute}}>WHAT IT'S PRODUCING</div>
      {stages.map((s, i) => <div key={s} style={{display: 'flex', alignItems: 'center', gap: 16, marginTop: 14, opacity: inK(f, looking + i * 6)}}>
        <div style={{width: 160, fontSize: 30, fontWeight: 700}}>{s}</div>
        <div style={{flex: 1, height: 22, borderRadius: 11, background: '#E8E8ED', overflow: 'hidden'}}><div style={{width: `${(1 - i * .2) * 100 * EOUT(clamp((f - looking - i * 6) / 16))}%`, height: '100%', borderRadius: 11, background: i === 3 ? M.mint : M.indigo}} /></div>
      </div>)}
    </Panel>
    <Markup name="rectangle---red" at={producing - 4} x={230} y={175} w={620} />
    <Burn at={0} n={3} opacity={.8} />
  </Stage2>;
};
