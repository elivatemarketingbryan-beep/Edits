import React from 'react';
import {clamp} from '../../motion';
import type {VisualProps} from '../../types';
import {cues} from '../modern/kit';
import {M, kf, EIO, EOUT, inK, World2, speed, Stage2, canvasH, Hills, Floor, Tree2, House2, Van2, Person2, Glass, Card2, CAST, SKY, backdrop2} from './storyKit2';

// "Slow replies waste the leads you paid for" (video20): faceless, full-screen modern story scenes.
// Spoken times only (10 in the morning, 4); no other figures. UI cards live in the sky band above the action.

const back = (seed = 0) => [
  {depth: .25, children: <><Hills y={560} color={M.far} amp={70} seed={seed} /><circle cx={880} cy={160} r={70} fill={M.sun} opacity={.55} /></>},
  {depth: .55, children: <Hills y={650} color={M.mid} amp={50} seed={seed + 2} />},
];
const floor = {depth: 1, children: <Floor y={760} />};

/* Screen-space glass phone card */
const Phone: React.FC<{x: number; y: number; k: number; title: string; children?: React.ReactNode; w?: number}> = ({x, y, k, title, children, w = 520}) =>
  <div style={{position: 'absolute', left: x, top: y, width: w, transform: `translate(-50%, 0) translateY(${(1 - k) * 24}px) scale(${.96 + .04 * k})`, opacity: k, padding: '26px 28px', borderRadius: 40, background: 'rgba(255,255,255,.72)', backdropFilter: 'blur(20px) saturate(160%)', border: '1.5px solid rgba(255,255,255,.85)', boxShadow: '0 2px 6px rgba(30,33,64,.06), 0 30px 70px rgba(30,33,64,.16)', fontFamily: '-apple-system, "SF Pro Display", "Segoe UI", Arial, sans-serif'}}>
    <div style={{fontSize: 22, fontWeight: 700, color: M.mute, letterSpacing: 2, textTransform: 'uppercase'}}>{title}</div>{children}
  </div>;
const Msg: React.FC<{k: number; me?: boolean; children: React.ReactNode; tone?: string}> = ({k, me, children, tone}) =>
  <div style={{display: 'flex', justifyContent: me ? 'flex-end' : 'flex-start', marginTop: 16, opacity: k, transform: `translateY(${(1 - k) * 12}px)`}}>
    <div style={{maxWidth: '82%', padding: '16px 22px', borderRadius: me ? '26px 26px 8px 26px' : '26px 26px 26px 8px', background: me ? (tone ?? M.indigo) : '#EEF0FA', color: me ? '#fff' : M.ink, fontSize: 28, fontWeight: 600, lineHeight: 1.3}}>{children}</div></div>;
const Clock: React.FC<{x: number; y: number; hours: number; k: number; label?: string}> = ({x, y, hours, k, label}) =>
  <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) scale(${.94 + .06 * k})`, opacity: k, textAlign: 'center'}}>
    <svg width="220" height="220" viewBox="-110 -110 220 220">
      <circle r="100" fill="rgba(255,255,255,.8)" stroke="#fff" strokeWidth="6" />
      {Array.from({length: 12}, (_, i) => <rect key={i} x={-3} y={-92} width={6} height={i % 3 ? 10 : 18} rx={3} fill={M.mute} transform={`rotate(${i * 30})`} />)}
      <rect x={-5} y={-56} width={10} height={60} rx={5} fill={M.ink} transform={`rotate(${hours * 30})`} />
      <rect x={-3} y={-82} width={6} height={86} rx={3} fill={M.indigo} transform={`rotate(${hours * 360})`} />
      <circle r="9" fill={M.ink} />
    </svg>
    {label && <div style={{fontSize: 34, fontWeight: 800, color: M.ink, marginTop: 6}}>{label}</div>}
  </div>;

/* 1 · Spending thousands on leads, but taking hours to respond: money left on the table. */
export const F20Hook: React.FC<VisualProps> = (p) => {
  const f = p.frame, H = canvasH(p);
  const [spending, leads, hours, respond, money, table] = cues(p, [19, 84, 122, 144, 183, 203]);
  const slide = clamp((f - money) / 30);
  const pings = f > leads ? Math.floor((f - leads) / 12) : 0;
  return <Stage2 p={p} sky={SKY.morning}>
    <World2 h={H} cx={560} cy={540} zoom={kf(f, [[0, 1.05], [money - 10, 1.05], [table, 1.25]])} layers={[...backdrop2('suburb', 0), floor, {depth: 1, children: <>
      <Tree2 x={140} y={760} /><House2 x={900} y={760} s={.75} />
      <Person2 x={330} y={770} kind="pro" ap={CAST.you} pose={{armR: -120 + 40 * Math.sin(f / 4), armL: -40, mood: 'neutral'}} />
      {/* he's busy hammering; phone on the table keeps lighting up */}
      <rect x={480} y={640} width={300} height={18} rx={8} fill="#B49A87" /><rect x={500} y={656} width={14} height={104} fill="#A3896F" /><rect x={746} y={656} width={14} height={104} fill="#A3896F" />
      <g transform="translate(700 626)"><rect x={-22} y={-12} width={44} height={16} rx={4} fill={M.ink} /><rect x={-18} y={-10} width={36} height={10} rx={2} fill={pings % 2 ? '#9FB4FF' : '#5B6188'} /></g>
      {[0, 1, 2].map(i => { const t = clamp((f - money - i * 6) / 26); return <g key={i} transform={`translate(${560 + i * 30 + 260 * t} ${612 + 260 * t * t}) rotate(${t * 300})`} opacity={f > spending ? 1 - clamp((t - .85) / .15) : 0}>
        <rect x={-34} y={-14} width={68} height={28} rx={6} fill="#7FD6B6" /><text y={9} textAnchor="middle" fontSize={20} fontWeight={900} fill="#14532D" fontFamily="Arial">$</text></g>; })}
    </>}]} />
    <Glass x={540} y={80} k={inK(f, spending - 4) * (1 - inK(f, hours - 6, 8))} tone="glass">Thousands spent on leads</Glass>
    <Glass x={540} y={80} k={inK(f, hours - 2) * (1 - inK(f, money - 6, 8))} tone="ink">…then hours to respond</Glass>
    <Glass x={540} y={80} k={inK(f, money - 2)} tone="peach">Money left on the table</Glass>
    <Phone x={540} y={170} k={inK(f, leads - 4) * (1 - inK(f, money - 4, 10))} title="New leads">
      {[0, 1, 2].map(i => <Msg key={i} k={inK(f, leads + i * 12, 8)}>New lead #{i + 1} · <span style={{color: M.peach}}>unread</span></Msg>)}
    </Phone>
    <Clock x={900} y={260} hours={(f - hours) / 40} k={inK(f, hours - 4) * (1 - inK(f, money - 4, 10))} />
  </Stage2>;
};

/* 2 · The homeowner fills out a form, reaches out to a few contractors; whoever replies first gets the conversation. */
export const F20Race: React.FC<VisualProps> = (p) => {
  const f = p.frame, H = canvasH(p);
  const [perspective, form, want, few, whoever, first, conversation, everyone] = cues(p, [26, 76, 115, 220, 258, 292, 351, 391]);
  const keys: Array<[number, number]> = [[0, 420], [few - 10, 420], [few + 20, 640]];
  const cx = kf(f, keys), zoom = kf(f, [[0, 1.2], [few - 10, 1.2], [few + 20, .95]]);
  const sent = clamp((f - few) / 26);
  const vans = [[880, M.indigo, 'YOUR CO.'], [1120, M.violet, 'CO. B'], [1360, '#64748B', 'CO. C']] as const;
  return <Stage2 p={p} sky={SKY.midday}>
    <World2 h={H} cx={cx} cy={540} zoom={zoom} vx={speed(f, keys)} layers={[...backdrop2('city', 1), floor, {depth: 1, children: <>
      <House2 x={260} y={760} s={.8} roof="b" />
      <Person2 x={420} y={770} kind="home" ap={CAST.maya} pose={{phone: true, armR: -150, mood: f > first + 10 ? 'happy' : 'neutral'}} />
      {vans.map(([x, c, l], i) => <Van2 key={l} x={x} y={770} s={.6} label={l} tint={c} />)}
      {sent > 0 && sent < 1 && [0, 1, 2].map(i => <circle key={i} cx={460 + (vans[i][0] - 460) * EIO(sent)} cy={520 - 160 * Math.sin(sent * Math.PI)} r={14} fill={M.indigo} />)}
      {f > first && <g transform="translate(880 560)" opacity={inK(f, first, 10)}><circle r={30} fill={M.mint} /><path d="M-12 0L-3 9L13 -9" stroke="#fff" strokeWidth={6} fill="none" strokeLinecap="round" /></g>}
    </>}]} />
    <Glass x={540} y={80} k={inK(f, perspective - 4) * (1 - inK(f, few - 6, 8))} tone="glass">The homeowner's side</Glass>
    <Glass x={540} y={80} k={inK(f, few - 2) * (1 - inK(f, whoever - 6, 8))} tone="ink">They reach out to a few contractors</Glass>
    <Glass x={540} y={80} k={inK(f, whoever - 2)} tone="mint">Whoever replies first</Glass>
    <Phone x={540} y={170} k={inK(f, form - 6) * (1 - inK(f, few - 6, 10))} title="Request a quote">
      {['Name', 'Phone', 'Project'].map((l, i) => <div key={l} style={{marginTop: 14, padding: '16px 20px', borderRadius: 18, background: '#F3F4FB', fontSize: 26, fontWeight: 600, color: inK(f, form + i * 8) > .5 ? M.ink : M.mute}}>{inK(f, form + i * 8) > .5 ? ['Sam', '(555) 010-0000', 'Kitchen remodel'][i] : l}</div>)}
      <div style={{marginTop: 18, padding: '18px 0', borderRadius: 999, textAlign: 'center', background: M.indigo, color: '#fff', fontSize: 28, fontWeight: 800, opacity: .4 + .6 * inK(f, want, 10)}}>Send</div>
    </Phone>
    <Phone x={540} y={170} k={inK(f, first - 2)} title="Messages">
      <Msg k={inK(f, first)} me tone={M.mint}>Hi Sam! Got your request — when's a good time to come look?</Msg>
      <Msg k={inK(f, conversation)}>Tomorrow morning works!</Msg>
      <div style={{marginTop: 14, fontSize: 24, color: M.mute, fontWeight: 600, opacity: inK(f, everyone)}}>…before everyone else</div>
    </Phone>
  </Stage2>;
};

/* 3 · A lead at 10 in the morning; you're on a job site and reply at 4. They've already booked someone else — a lead you paid for. */
export const F20Ten: React.FC<VisualProps> = (p) => {
  const f = p.frame, H = canvasH(p);
  const [ten, jobsite, until4, scheduled, someone, paid, chance] = cues(p, [64, 111, 174, 243, 283, 352, 443]);
  const hours = kf(f, [[0, 10], [jobsite + 10, 10], [until4, 16]]);
  const keys: Array<[number, number]> = [[0, 760], [jobsite - 4, 760], [jobsite + 16, 380], [scheduled - 8, 380], [scheduled + 12, 820]];
  const cx = kf(f, keys), zoom = kf(f, [[0, 1.1], [jobsite + 16, 1.2], [scheduled + 12, 1.1]]);
  const dusk = clamp((f - jobsite - 10) / (until4 - jobsite - 10));
  return <Stage2 p={p} sky={SKY.golden}>
    <div style={{position: 'absolute', inset: 0, background: `linear-gradient(180deg, rgba(255,170,120,${.25 * dusk}), transparent 60%)`}} />
    <World2 h={H} cx={cx} cy={540} zoom={zoom} vx={speed(f, keys)} layers={[...backdrop2('suburb', 2), floor, {depth: 1, children: <>
      {/* the job site: a roof under construction */}
      <g transform="translate(380 760)"><rect x={-170} y={-200} width={340} height={200} rx={10} fill="#F1EDE8" /><path d="M-200 -190L0 -320L200 -190Z" fill="none" stroke="#B49A87" strokeWidth={14} />
        {[-120, -60, 0, 60, 120].map(x => <path key={x} d={`M${x} -190V${-190 - (120 - Math.abs(x)) * .9}`} stroke="#B49A87" strokeWidth={10} />)}</g>
      <Person2 x={380} y={600} s={.85} kind="pro" ap={CAST.you} pose={{armR: -130 + 30 * Math.sin(f / 4), mood: 'neutral'}} />
      <House2 x={860} y={760} s={.8} roof="b" />
      <Person2 x={1010} y={770} kind="home" ap={CAST.walt} flip pose={{phone: f < scheduled, armR: f < scheduled ? -150 : -10, mood: f > scheduled ? 'happy' : 'neutral'}} />
      <Van2 x={1230} y={780} s={.6} label="CO. B" tint={M.violet} />
    </>}]} />
    <Clock x={540} y={300} hours={hours} k={inK(f, ten - 6) * (1 - inK(f, scheduled - 8, 10))} label={f < until4 - 4 ? (f < jobsite + 10 ? '10 AM' : '…') : '4 PM'} />
    <Glass x={540} y={80} k={inK(f, ten - 4) * (1 - inK(f, jobsite - 6, 8))} tone="glass">A lead comes in at 10 AM</Glass>
    <Glass x={540} y={80} k={inK(f, jobsite - 2) * (1 - inK(f, until4 - 6, 8))} tone="ink">You're on the job site</Glass>
    <Glass x={540} y={80} k={inK(f, until4 - 2) * (1 - inK(f, scheduled - 6, 8))} tone="peach">You reply at 4</Glass>
    <Phone x={540} y={170} k={inK(f, scheduled - 2) * (1 - inK(f, paid - 6, 10))} title="Their calendar">
      <div style={{marginTop: 16, padding: '20px 22px', borderRadius: 20, background: 'rgba(139,92,246,.12)', borderLeft: `6px solid ${M.violet}`, fontSize: 30, fontWeight: 700, color: M.ink}}>Estimate · {f > someone - 4 ? 'someone else' : '…'}</div>
    </Phone>
    <Phone x={540} y={170} k={inK(f, paid - 2)} title="Your lead">
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14}}><span style={{fontSize: 34, fontWeight: 800, color: M.ink}}>Paid for</span><span style={{fontSize: 30, fontWeight: 800, color: M.mint}}>✓</span></div>
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, opacity: inK(f, chance - 8)}}><span style={{fontSize: 34, fontWeight: 800, color: M.ink}}>Chance to close</span><span style={{fontSize: 30, fontWeight: 800, color: M.peach}}>✕</span></div>
    </Phone>
  </Stage2>;
};

/* 4 · Notifications for every message, an automatic reply, and a system that reminds you to follow up. */
export const F20System: React.FC<VisualProps> = (p) => {
  const f = p.frame, H = canvasH(p);
  const [whatIDo, notifications, auto, received, system, reminds, follow] = cues(p, [5, 56, 139, 234, 311, 328, 348]);
  return <Stage2 p={p} sky={SKY.midday}>
    <World2 h={H} cx={560} cy={540} zoom={1.1} layers={[...backdrop2('park', 3), floor, {depth: 1, children: <>
      <g transform="translate(330 760)"><rect x={-150} y={-180} width={300} height={180} rx={10} fill="#F1EDE8" /><path d="M-180 -170L0 -290L180 -170Z" fill="#E3D6C8" /></g>
      <Person2 x={420} y={770} kind="pro" ap={CAST.you} pose={{phone: f > notifications - 4, armR: f > notifications - 4 ? -150 : -110 + 30 * Math.sin(f / 4), mood: 'happy'}} />
      <House2 x={880} y={760} s={.75} roof="b" /><Person2 x={1000} y={770} kind="home" ap={CAST.deshawn} flip pose={{phone: true, armR: -150, mood: f > auto + 10 ? 'happy' : 'neutral'}} />
    </>}]} />
    <Glass x={540} y={80} k={inK(f, whatIDo) * (1 - inK(f, notifications - 6, 8))} tone="glass">Here's what I do</Glass>
    {[['Notifications on every message', notifications, 'indigo'], ['Automatic reply', auto, 'mint'], ['Follow-up reminders', reminds, 'ink']].map(([t, at, tone], i) =>
      <div key={t as string} style={{position: 'absolute', left: 80, top: 60 + i * 76, display: 'flex', alignItems: 'center', gap: 14, opacity: inK(f, (at as number) - 2), transform: `translateX(${(1 - inK(f, (at as number) - 2)) * -20}px)`}}>
        <div style={{width: 46, height: 46, borderRadius: 23, background: tone === 'ink' ? M.ink : M[tone as 'indigo' | 'mint'], color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800}}>{i + 1}</div>
        <div style={{fontSize: 32, fontWeight: 800, color: M.ink}}>{t}</div></div>)}
    <div style={{position: 'absolute', left: 540, top: 300, transform: `translate(-50%, ${(1 - inK(f, notifications)) * -40}px)`, opacity: inK(f, notifications) * (1 - inK(f, auto - 6, 8)), width: 620, padding: '22px 26px', borderRadius: 30, background: 'rgba(30,33,64,.86)', color: '#fff', backdropFilter: 'blur(16px)', boxShadow: '0 20px 50px rgba(30,33,64,.3)'}}>
      <div style={{fontSize: 22, opacity: .7, fontWeight: 700}}>MESSAGES · now</div><div style={{fontSize: 30, fontWeight: 700, marginTop: 6}}>New message from Sam</div></div>
    <Phone x={540} y={300} w={620} k={inK(f, auto - 2) * (1 - inK(f, system - 6, 10))} title="Sam · text">
      <Msg k={inK(f, auto - 2)}>Hi, I need a quote for my kitchen.</Msg>
      <Msg k={inK(f, auto + 10)} me tone={M.mint}>Thanks Sam! We got your message and will get back to you shortly.</Msg>
      <div style={{marginTop: 10, fontSize: 22, fontWeight: 700, color: M.mint, textAlign: 'right', opacity: inK(f, received)}}>auto-reply · sent instantly</div>
    </Phone>
    <div style={{position: 'absolute', left: 540, top: 300, transform: `translate(-50%, ${(1 - inK(f, reminds)) * -40}px)`, opacity: inK(f, reminds), width: 620, padding: '22px 26px', borderRadius: 30, background: 'rgba(255,255,255,.8)', backdropFilter: 'blur(16px)', boxShadow: '0 20px 50px rgba(30,33,64,.18)'}}>
      <div style={{fontSize: 22, color: M.mute, fontWeight: 700}}>REMINDER</div><div style={{fontSize: 30, fontWeight: 800, color: M.ink, marginTop: 6}}>Follow up with Sam — no reply yet</div></div>
  </Stage2>;
};

/* 5 · Too busy to answer every call? Have a process for getting back as quickly as possible. */
export const F20Process: React.FC<VisualProps> = (p) => {
  const f = p.frame, H = canvasH(p);
  const [busy, call, process, quickly] = cues(p, [15, 72, 116, 177]);
  const steps = [['Missed call', call, '#94A3B8'], ['Auto text sent', process + 4, M.mint], ['Call back', process + 30, M.indigo], ['Booked ✓', quickly, M.violet]] as const;
  const ring = f > call && f < process ? Math.sin(f) * 8 : 0;
  return <Stage2 p={p} sky={SKY.morning}>
    <World2 h={H} cx={560} cy={540} zoom={1.1} layers={[...backdrop2('site', 4), floor, {depth: 1, children: <>
      <g transform="translate(560 760)"><rect x={-90} y={-330} width={14} height={330} fill="#B49A87" transform="rotate(8)" /><rect x={60} y={-330} width={14} height={330} fill="#B49A87" transform="rotate(-8)" />
        {[0, 1, 2, 3, 4].map(i => <rect key={i} x={-80 + i * 2} y={-60 - i * 60} width={150 - i * 4} height={10} rx={4} fill="#B49A87" />)}</g>
      <Person2 x={300} y={770} kind="pro" ap={CAST.crew} pose={{armR: -60, mood: 'happy'}} />
      <Person2 x={560} y={520} s={.9} kind="pro" ap={CAST.you} pose={{armR: -150 + 20 * Math.sin(f / 4), armL: -130, mood: 'neutral'}} />
      <g transform={`translate(${700 + ring} 600)`} opacity={inK(f, call - 4)}><rect x={-22} y={-38} width={44} height={76} rx={10} fill={M.ink} /><rect x={-17} y={-31} width={34} height={56} rx={4} fill={f < process ? '#FFB199' : '#9FB4FF'} /></g>
    </>}]} />
    <Glass x={540} y={80} k={inK(f, busy - 4) * (1 - inK(f, process - 6, 8))} tone="glass">Too busy to answer every call?</Glass>
    <Glass x={540} y={80} k={inK(f, process - 2)} tone="indigo">Have a process</Glass>
    <div style={{position: 'absolute', left: 80, right: 80, top: 180, display: 'flex', alignItems: 'center', gap: 10}}>
      {steps.map(([t, at, c], i) => <React.Fragment key={t}>
        <div style={{flex: 1, padding: '20px 10px', borderRadius: 24, textAlign: 'center', background: 'rgba(255,255,255,.75)', backdropFilter: 'blur(14px)', boxShadow: '0 12px 30px rgba(30,33,64,.12)', borderTop: `6px solid ${c}`, fontSize: 25, fontWeight: 800, color: M.ink, opacity: inK(f, at - 2), transform: `translateY(${(1 - inK(f, at - 2)) * 14}px)`}}>{t}</div>
        {i < 3 && <div style={{fontSize: 30, color: M.mute, opacity: inK(f, steps[i + 1][1] - 4)}}>→</div>}
      </React.Fragment>)}
    </div>
    <Glass x={540} y={330} k={inK(f, quickly)} tone="mint">As quickly as possible</Glass>
  </Stage2>;
};

/* 6 · Getting leads is only the first half; a system turns them into paying customers. A half-built bridge gets finished. */
export const F20Half: React.FC<VisualProps> = (p) => {
  const f = p.frame, H = canvasH(p);
  const [leads, half, system, chance, turning, paying] = cues(p, [9, 42, 87, 129, 154, 193]);
  const build = EIO(clamp((f - system) / 50));
  const walk = clamp((f - turning) / 50);
  const keys: Array<[number, number]> = [[0, 400], [half + 10, 420], [system + 30, 660], [paying, 860]];
  const cx = kf(f, keys);
  const hx = 150 + 760 * EIO(walk);
  return <Stage2 p={p} sky={SKY.dusk}>
    <World2 h={H} cx={cx} cy={540} zoom={kf(f, [[0, 1.15], [system + 30, 1.0]])} vx={speed(f, keys)} layers={[...backdrop2('water', 5), {depth: 1, children: <>
      <rect x={-1500} y={760} width={1900} height={1200} fill={M.ground} /><rect x={1040} y={760} width={2000} height={1200} fill={M.ground} />
      <rect x={400} y={800} width={640} height={1200} fill="#BFD3FF" />
      <rect x={400} y={752} width={320} height={22} rx={6} fill="#B49A87" />
      <rect x={720} y={752} width={320 * build} height={22} rx={6} fill={M.indigo} />
      {[460, 560, 660].map(x => <rect key={x} x={x} y={774} width={12} height={80} fill="#A3896F" />)}
      {build > .5 && [780, 880, 980].map(x => <rect key={x} x={x} y={774} width={12} height={80} fill={M.indigo} opacity={build} />)}
      <House2 x={1250} y={760} s={.75} glow={inK(f, paying - 6, 14)} />
      <Person2 x={1120} y={770} kind="pro" ap={CAST.you} flip pose={{mood: 'happy', armR: walk >= 1 ? -80 : -10}} />
      <Person2 x={hx} y={walk > 0 ? 762 : 770} kind="home" ap={CAST.rosa} pose={{walk: walk > 0 && walk < 1 ? f / 3 : undefined, mood: 'happy'}} />
    </>}]} />
    <Glass x={300} y={330} k={inK(f, leads - 4)} tone="glass">Getting leads</Glass>
    <Glass x={760} y={330} k={inK(f, system - 2)} tone="indigo">A system to follow up</Glass>
    <Glass x={540} y={80} k={inK(f, half - 4) * (1 - inK(f, chance - 6, 8))} tone="ink">Only the first half of the job</Glass>
    <Glass x={540} y={80} k={inK(f, paying - 4)} tone="mint">Leads → paying customers</Glass>
  </Stage2>;
};
