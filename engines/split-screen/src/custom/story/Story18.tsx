import React from 'react';
import {clamp} from '../../motion';
import type {VisualProps} from '../../types';
import {cues} from '../modern/kit';
import {L, R, panel, eyebrow, LStage, LIn, LTitle, LRows, LPill, lIn, lMove} from '../modern/kitLight';
import {SK, EIO, EOUT, kf, inOut, StoryStage, World, Ground, Road, Tree, Cloud, House, Truck, Bubble, Icon, Person, Tag} from './storyKit';

// "The estimate doesn't sell itself" (video18) in the story style: characters act it out under a
// keyframed camera; one zoom-through into a light estimate UI. No figures: amounts are $ symbols.

/* A paper estimate in world units, top-left at (x,y). */
const Paper: React.FC<{x: number; y: number; title: string; lines: number; missing?: number; total: string; hl?: number; rot?: number; s?: number}> = ({x, y, title, lines, missing = 0, total, hl = -1, rot = 0, s = 1}) =>
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <rect width={230} height={310} rx={10} fill="#fff" stroke="#E3E7EE" strokeWidth={3} />
    <text x={18} y={36} fontSize={18} fontWeight={800} fill={SK.mute} fontFamily="Arial" letterSpacing={2}>{title}</text>
    {Array.from({length: lines}, (_, i) => { const gone = i >= lines - missing; return <g key={i} opacity={gone ? .9 : 1}>
      {i === hl && <rect x={10} y={58 + i * 34} width={210} height={28} rx={6} fill="rgba(0,113,227,.12)" />}
      <rect x={18} y={66 + i * 34} width={110} height={12} rx={6} fill={gone ? 'none' : '#D7DCE3'} stroke={gone ? '#F43F5E' : 'none'} strokeDasharray={gone ? '6 6' : undefined} strokeWidth={2} />
      <rect x={160} y={66 + i * 34} width={50} height={12} rx={6} fill={gone ? 'none' : '#E9ECF1'} stroke={gone ? '#F43F5E' : 'none'} strokeDasharray={gone ? '6 6' : undefined} strokeWidth={2} />
    </g>; })}
    <path d={`M18 ${70 + lines * 34}H212`} stroke="#E3E7EE" strokeWidth={2} />
    <text x={18} y={104 + lines * 34} fontSize={26} fontWeight={800} fill={SK.ink} fontFamily="Arial">Total</text>
    <text x={212} y={104 + lines * 34} textAnchor="end" fontSize={28} fontWeight={900} fill={SK.ink} fontFamily="Arial">{total}</text>
  </g>;

/* 2 · Meet, look at the project, run numbers, send the quote… then wait days. Nothing. "They went with someone else." */
export const S18Waiting: React.FC<VisualProps> = (p) => {
  const f = p.frame;
  const [meet, look, numbers, send, wait, days, nothing, assume, someone] = cues(p, [16, 47, 96, 125, 165, 195, 216, 263, 295]);
  const cx = kf(f, [[0, 640], [meet, 560], [look + 10, 470], [numbers - 6, 560], [numbers + 8, 640], [send, 640], [wait, 1200], [someone + 20, 1240]]);
  const cy = kf(f, [[0, 560], [numbers + 8, 500], [send, 510], [wait, 560]]);
  const zoom = kf(f, [[0, 1.15], [look + 10, 1.25], [numbers + 8, 1.9], [send, 1.6], [wait, 1.1], [someone + 20, 1.0]]);
  const walkIn = clamp(f / meet), proX0 = 900 - 260 * EOUT(walkIn);
  const walkOut = clamp((f - send - 6) / (wait - send - 6));
  const proX = f < send + 6 ? proX0 : 640 + (1180 - 640) * EIO(walkOut);
  const walking = (f < meet) || (walkOut > 0 && walkOut < 1);
  const plane = clamp((f - send) / 30);
  const dayPhase = clamp((f - wait) / (nothing + 30 - wait)) * Math.PI * 4;
  const night = f > wait ? .38 * Math.max(0, -Math.sin(dayPhase)) : 0;
  const clip = f >= numbers - 4 && f < send + 2;
  return <StoryStage p={p}>
    <World cx={cx} cy={cy} zoom={zoom}>
      <Cloud x={300} y={170} /><Cloud x={1100} y={150} s={1.1} />
      <Ground y={760} /><Road y={790} x0={900} />
      <Tree x={90} y={760} /><House x={300} y={760} />
      <Person x={420} y={760} kind="home" pose={{mood: 'happy', armR: f > meet && f < look ? -70 : -6}} />
      <Truck x={1360} y={872} label="YOUR CO." />
      <Person x={proX} y={760} kind="pro" flip={f < send + 6} pose={{walk: walking ? f / 3.2 : undefined, armR: f >= look && f < numbers - 4 ? -110 : clip ? -60 : f > wait ? -150 : undefined, phone: f > wait, mood: f > assume ? 'worried' : f > nothing ? 'neutral' : 'happy'}} />
      {clip && <g transform={`translate(${proX - 62} 540) rotate(-6) scale(.9)`}>
        <rect x={-46} y={-60} width={92} height={120} rx={8} fill="#8B6A4E" /><rect x={-38} y={-50} width={76} height={104} rx={4} fill="#fff" />
        {[0, 1, 2, 3].map(i => <rect key={i} x={-30} y={-38 + i * 18} width={60 * clamp((f - numbers - i * 5) / 8)} height={8} rx={4} fill="#C9CED6" />)}
        <text x={0} y={46} textAnchor="middle" fontSize={20} fontWeight={900} fill={SK.ink} fontFamily="Arial" opacity={inOut(f, numbers + 16, 6)}>$$$</text>
      </g>}
      {f >= send && f < send + 32 && <g transform={`translate(${proX - 100 - 500 * plane} ${520 - 300 * Math.sin(plane * Math.PI * .8)}) rotate(${-20 + 10 * Math.sin(f / 3)})`} opacity={1 - clamp((plane - .8) / .2)}>
        <path d="M-30 0L30 -14L-6 6Z" fill="#fff" stroke="#C9CED6" strokeWidth={2} /><path d="M-6 6L30 -14L4 16Z" fill="#E9ECF1" /></g>}
      <Bubble x={proX + 30} y={430} w={160} h={100} k={inOut(f, nothing - 4, 10) * (1 - inOut(f, assume - 4, 8))}><text y={12} textAnchor="middle" fontSize={34} fontWeight={800} fill={SK.mute} fontFamily="Arial">0 new</text></Bubble>
      <Bubble x={proX + 70} y={420} w={300} h={150} k={inOut(f, assume - 2, 10)}><g transform="translate(0 30) scale(.5)"><Truck x={10} y={0} label="OTHER CO." /></g></Bubble>
    </World>
    <div style={{position: 'absolute', inset: 0, background: '#0B1530', opacity: night, pointerEvents: 'none'}} />
    {f > wait && <div style={{position: 'absolute', left: 540 + 420 * Math.cos(dayPhase + Math.PI), top: 300 - 220 * Math.abs(Math.sin(dayPhase)), width: 70, height: 70, marginLeft: -35, borderRadius: 35, background: Math.sin(dayPhase) >= 0 ? '#FFD166' : '#E5E9F2', boxShadow: '0 0 40px rgba(255,209,102,.6)', opacity: inOut(f, wait, 10) * (1 - inOut(f, assume - 6, 10))}} />}
    {[['Meet the homeowner', meet], ['Look at the project', look], ['Run the numbers', numbers], ['Send the quote', send]].map(([t, at], i, arr) =>
      <Tag key={t as string} x={540} y={64} k={inOut(f, (at as number) - 2, 8) * (1 - inOut(f, ((arr[i + 1]?.[1] as number) ?? wait) - 4, 6))} tone={i === 3 ? 'accent' : 'light'}>{t}</Tag>)}
    <Tag x={540} y={64} k={inOut(f, wait, 8) * (1 - inOut(f, nothing - 4, 6))} tone="light">Wait a few days…</Tag>
    <Tag x={540} y={64} k={inOut(f, nothing, 8) * (1 - inOut(f, assume - 4, 6))} tone="dark">Nothing.</Tag>
    <Tag x={540} y={64} k={inOut(f, assume, 8)} tone="bad">"They went with someone else."</Tag>
  </StoryStage>;
};

/* 3 · The homeowner's side: questions about price, why materials cost more, a competitor who left out half the work. No follow-up, never find out. */
export const S18Homeowner: React.FC<VisualProps> = (p) => {
  const f = p.frame;
  const [questions, price, understand, materials, comparing, leftout, half, never, findout] = cues(p, [54, 84, 125, 172, 238, 298, 318, 378, 437]);
  const cx = kf(f, [[0, 560], [understand - 10, 560], [materials, 640], [comparing - 10, 640], [comparing + 20, 760], [never - 10, 760], [never + 20, 620]]);
  const cy = kf(f, [[0, 520], [materials, 560], [comparing + 20, 560], [never + 20, 520]]);
  const zoom = kf(f, [[0, 1.0], [understand - 10, 1.05], [materials, 2.0], [comparing - 10, 2.0], [comparing + 20, 1.6], [never - 10, 1.6], [never + 20, 1.0]]);
  const showB = inOut(f, comparing - 6, 14);
  const lookB = f > comparing && f < never ? 18 : 0;
  return <StoryStage p={p}>
    <World cx={cx} cy={cy} zoom={zoom}>
      <rect x={-500} y={-200} width={2400} height={960} fill="#F6EFE6" />
      <rect x={-500} y={760} width={2400} height={800} fill="#D9C7AE" />
      <rect x={150} y={180} width={240} height={200} rx={10} fill="#CFE3FF" stroke="#fff" strokeWidth={12} /><path d="M270 180V380M150 280H390" stroke="#fff" strokeWidth={8} />
      <Person x={420} y={760} kind="home" pose={{armR: -40, armL: -30, look: lookB, mood: f > half ? 'worried' : 'neutral'}} />
      <rect x={480} y={640} width={560} height={22} rx={8} fill="#A47551" /><rect x={500} y={660} width={18} height={100} fill="#8B6A4E" /><rect x={1002} y={660} width={18} height={100} fill="#8B6A4E" />
      <Paper x={530} y={410} s={.7} title="YOUR ESTIMATE" lines={6} total="$$$$" hl={f >= materials - 4 && f < comparing ? 1 : -1} rot={-4} />
      <g opacity={showB}><Paper x={760} y={418} s={.7} title="OTHER QUOTE" lines={6} missing={f >= leftout ? 3 : 0} total="$$" rot={5} /></g>
      <g transform="translate(940 632)"><rect x={-22} y={-8} width={44} height={14} rx={4} fill="#1F2430" /></g>
      <Bubble x={470} y={390} w={110} h={90} k={inOut(f, questions - 4, 10) * (1 - inOut(f, understand - 6, 8))}><Icon kind="q" c={SK.warn} /></Bubble>
      <Bubble x={600} y={300} w={150} h={90} k={inOut(f, price - 4, 10) * (1 - inOut(f, understand - 6, 8))}><text y={14} textAnchor="middle" fontSize={40} fontWeight={900} fill={SK.ink} fontFamily="Arial">$ ?</text></Bubble>
      {f > findout - 6 && [0, 1, 2].map(i => { const t = clamp((f - findout + 6 - i * 6) / 30); return <g key={i} transform={`translate(${430 + i * 60 + 80 * t} ${380 - 160 * t})`} opacity={1 - t}><Icon kind="q" c={SK.warn} /></g>; })}
    </World>
    <Tag x={540} y={64} k={inOut(f, questions - 2, 8) * (1 - inOut(f, understand - 4, 6))} tone="light">Questions about the price?</Tag>
    <Tag x={540} y={64} k={inOut(f, understand, 8) * (1 - inOut(f, comparing - 6, 6))} tone="light">Why do materials cost more?</Tag>
    <Tag x={540} y={64} k={inOut(f, comparing - 2, 8) * (1 - inOut(f, never - 6, 6))} tone={f >= half ? 'bad' : 'light'}>{f >= half ? 'They left out half the work' : 'Comparing quotes'}</Tag>
    <Tag x={540} y={64} k={inOut(f, never - 2, 8)} tone="dark">No follow-up → you never find out</Tag>
  </StoryStage>;
};

/* 4 · Zoom-through into the laptop: an estimate that explains scope, what they get, why details matter, what's included — so they compare full value, not just the number. */
export const L18Estimate: React.FC<VisualProps> = (p) => {
  const f = p.frame;
  const [send, explain, scope, getting, details, included, comparing, fullValue, number] = cues(p, [27, 54, 83, 154, 195, 284, 326, 345, 428]);
  const Z = 26;
  const ui = EOUT(clamp((f - (Z - 8)) / 10));
  const zoom = kf(f, [[0, 1.0], [6, 1.0], [Z, 6.5]]), zcx = kf(f, [[0, 560], [6, 560], [Z, 660]]), zcy = kf(f, [[0, 560], [6, 560], [Z, 590]]);
  const split = lMove(p, comparing - 4, 14);
  const W = 920 - 450 * split;
  return <div style={{position: 'absolute', inset: 0}}>
    {ui < 1 && <StoryStage p={p}><World cx={zcx} cy={zcy} zoom={zoom}>
      <Ground y={760} />
      <rect x={480} y={640} width={420} height={20} rx={6} fill="#8B6A4E" /><rect x={500} y={660} width={16} height={100} fill="#8B6A4E" /><rect x={864} y={660} width={16} height={100} fill="#8B6A4E" />
      <Person x={500} y={760} kind="pro" pose={{armR: -70, mood: 'neutral'}} />
      <g transform="translate(660 590)"><rect x={-80} y={-56} width={160} height={104} rx={8} fill="#1F2430" /><rect x={-72} y={-48} width={144} height={88} rx={4} fill="#F5F5F7" /><rect x={-96} y={48} width={192} height={10} rx={4} fill="#C9CED6" /></g>
    </World></StoryStage>}
    <div style={{position: 'absolute', inset: 0, opacity: ui, transform: `scale(${.96 + .04 * ui})`}}>
      {f >= Z - 8 && <LStage p={p}>
        <LIn p={p} at={0} style={{left: 80, top: 20}}><div style={eyebrow}>When you send an estimate</div></LIn>
        <LTitle p={p} at={explain - 10} text="Explain it." size={80} top={60} />
        <LIn p={p} at={scope - 10} style={{...panel, left: 80, top: 190, width: W, height: 680}}>
          <div style={{padding: '28px 40px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}><div style={{fontSize: 36, fontWeight: 700, letterSpacing: '-0.02em'}}>Your estimate</div><div style={{fontSize: 30, fontWeight: 700, opacity: 1 - split}}>$$$$</div></div>
          <LRows p={p} rowH={112} rows={[
            {at: scope - 4, title: 'Scope of the work', meta: split < .5 ? 'Every step, start to finish' : undefined},
            {at: getting - 4, title: 'What you\'re getting', meta: split < .5 ? 'Materials, brands, finish' : undefined},
            {at: details - 4, title: 'Why the details matter', meta: split < .5 ? 'Prep, protection, cleanup' : undefined},
            {at: included - 4, title: 'What\'s included', meta: split < .5 ? 'Permits, haul-away, warranty terms' : undefined, right: <LPill tone="live">✓</LPill>},
          ]} />
        </LIn>
        <LIn p={p} at={fullValue - 6} style={{...panel, left: 580, top: 190, width: 420, height: 310, padding: 30}}>
          <div style={{...eyebrow, color: L.accent}}>They compare</div>
          <div style={{fontSize: 46, fontWeight: 700, letterSpacing: '-0.03em', marginTop: 8}}>The full value</div>
          <div style={{fontSize: 26, color: L.t2, marginTop: 14, lineHeight: 1.5}}>Scope · materials · details · what's included</div>
        </LIn>
        <LIn p={p} at={number - 8} style={{...panel, left: 580, top: 530, width: 420, height: 340, padding: 30, background: L.bg, boxShadow: 'none', border: `1.5px dashed ${L.faint}`}}>
          <div style={eyebrow}>Not just</div>
          <div style={{fontSize: 46, fontWeight: 700, letterSpacing: '-0.03em', marginTop: 8, color: L.t3}}>The number</div>
          <div style={{fontSize: 64, fontWeight: 700, color: L.t4, marginTop: 20}}>$$</div>
        </LIn>
      </LStage>}
    </div>
  </div>;
};

/* 5 · Follow up and ask if they have questions. You don't need to chase or beg. */
export const S18FollowUp: React.FC<VisualProps> = (p) => {
  const f = p.frame;
  const [follow, ask, questions, chase, beg] = cues(p, [27, 53, 83, 131, 162]);
  const cx = kf(f, [[0, 540], [chase - 6, 540], [chase + 10, 560]]), zoom = kf(f, [[0, 1.15], [questions, 1.05], [chase + 10, .95]]);
  const fly = clamp((f - ask) / 22);
  const ghost = clamp((f - chase) / 40);
  return <StoryStage p={p}>
    <World cx={cx} cy={540} zoom={zoom}>
      <Cloud x={300} y={170} /><Cloud x={900} y={140} />
      <Ground y={760} /><House x={900} y={760} s={.9} roof="#5E8BC7" />
      <Person x={260} y={760} kind="pro" pose={{phone: true, armR: -150, mood: 'happy'}} />
      <Person x={720} y={760} kind="home" flip pose={{phone: f > ask + 14, armR: f > ask + 14 ? -150 : -6, mood: f > questions ? 'happy' : 'neutral'}} />
      {f >= ask && f < ask + 24 && <g transform={`translate(${300 + 380 * EIO(fly)} ${430 - 120 * Math.sin(fly * Math.PI)})`}><circle r={16} fill={SK.accent} /></g>}
      {ghost > 0 && ghost < 1 && <g opacity={.35 * (1 - ghost)}><Person x={200 + 600 * ghost} y={760} kind="pro" pose={{walk: f / 2, mood: 'worried'}} /></g>}
    </World>
    <div style={{position: 'absolute', left: 80, top: 130, maxWidth: 480, padding: '22px 28px', borderRadius: '30px 30px 30px 8px', background: SK.accent, color: '#fff', fontSize: 34, fontWeight: 600, opacity: inOut(f, follow, 10), transform: `translateY(${(1 - inOut(f, follow, 10)) * 14}px)`}}>Any questions about the estimate?</div>
    <div style={{position: 'absolute', right: 80, top: 290, maxWidth: 420, padding: '22px 28px', borderRadius: '30px 30px 8px 30px', background: '#fff', color: SK.ink, fontSize: 34, fontWeight: 600, boxShadow: '0 12px 32px rgba(0,0,0,.12)', opacity: inOut(f, questions - 4, 10), transform: `translateY(${(1 - inOut(f, questions - 4, 10)) * 14}px)`}}>Yes! What's included?</div>
    <Tag x={540} y={64} k={inOut(f, follow - 4, 8) * (1 - inOut(f, chase - 6, 6))} tone="accent">Follow up</Tag>
    <Tag x={540} y={64} k={inOut(f, chase - 2, 8)} tone="dark">No chasing. {f >= beg ? 'No begging.' : ''}</Tag>
  </StoryStage>;
};

/* 6 · Make sure they have the information they need to make the right decision. */
export const S18Decision: React.FC<VisualProps> = (p) => {
  const f = p.frame;
  const [just, information, right, decision] = cues(p, [14, 73, 140, 146]);
  const cx = kf(f, [[0, 620], [information, 640], [right - 20, 700]]), zoom = kf(f, [[0, 1.2], [information, 1.5], [right - 20, 1.1]]);
  const sign = clamp((f - right + 16) / 18);
  const bulb = inOut(f, information + 10, 12);
  return <StoryStage p={p}>
    <World cx={cx} cy={540} zoom={zoom}>
      <rect x={-500} y={-200} width={2400} height={960} fill="#F6EFE6" /><rect x={-500} y={760} width={2400} height={800} fill="#D9C7AE" />
      <Person x={460} y={760} kind="home" pose={{armR: -50, mood: 'happy'}} />
      <rect x={520} y={640} width={480} height={22} rx={8} fill="#A47551" /><rect x={540} y={660} width={18} height={100} fill="#8B6A4E" /><rect x={962} y={660} width={18} height={100} fill="#8B6A4E" />
      <g transform="translate(610 430) scale(.7)"><rect width={300} height={300} rx={10} fill="#fff" stroke="#E3E7EE" strokeWidth={3} />
        {[0, 1, 2, 3].map(i => <g key={i} opacity={inOut(f, just + i * 8, 10)}><g transform={`translate(30 ${44 + i * 46}) scale(.6)`}><Icon kind="check" c={SK.good} /></g><rect x={56} y={36 + i * 46} width={200} height={14} rx={7} fill="#D7DCE3" /></g>)}
        <path d={`M40 260Q70 ${236} 100 258T160 254T220 250`} stroke={SK.accent} strokeWidth={5} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - sign} /></g>
      <g transform="translate(500 380)" opacity={bulb}><circle r={34} fill="#FFD166" style={{filter: 'drop-shadow(0 0 20px rgba(255,209,102,.9))'}} /><rect x={-14} y={30} width={28} height={18} rx={4} fill="#C9CED6" /></g>
      <Person x={1080} y={760} kind="pro" flip pose={{armR: f > decision ? -80 : -6, mood: 'happy', walk: f > right - 30 && f < right ? f / 3 : undefined}} />
    </World>
    <Tag x={540} y={64} k={inOut(f, information - 4, 8)} tone="light">The information they need</Tag>
    <Tag x={540} y={130} k={inOut(f, right - 2, 8)} tone="good">→ the right decision</Tag>
  </StoryStage>;
};
