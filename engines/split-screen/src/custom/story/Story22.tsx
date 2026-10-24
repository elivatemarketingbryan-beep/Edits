import React from 'react';
import {clamp} from '../../motion';
import type {VisualProps} from '../../types';
import {cues} from '../modern/kit';
import {M, kf, EIO, EOUT, inK, World2, speed, Stage2, Floor, House2, Van2, Person2, Glass, CAST, SKY, backdrop2, Tree2} from './storyKit2';
import {Markup, Logo, Emoji, Burn} from '../pack/packKit';

// "Referrals can't be your only source" (video22): modern story scenes with pack logos and markups.

const font = '-apple-system, "SF Pro Display", "Segoe UI", Arial, sans-serif';
const Bubble: React.FC<{x: number; y: number; k: number; children: React.ReactNode; dark?: boolean}> = ({x, y, k, children, dark}) =>
  <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%, -100%) translateY(${(1 - k) * 14}px) scale(${.92 + .08 * k})`, opacity: k, padding: '16px 24px', borderRadius: '26px 26px 26px 8px', background: dark ? 'rgba(30,33,64,.86)' : '#fff', color: dark ? '#fff' : M.ink, fontSize: 28, fontWeight: 700, fontFamily: font, whiteSpace: 'nowrap', boxShadow: '0 14px 34px rgba(30,33,64,.16)'}}>{children}</div>;

/* 2 · People trust you enough to recommend you: one neighbor tells another. */
export const S22Proud: React.FC<VisualProps> = (p) => {
  const f = p.frame;
  const [trust, recommend] = cues(p, [49, 76]);
  return <Stage2 p={p} sky={SKY.morning}>
    <World2 cx={560} cy={520} zoom={kf(f, [[0, 1.0], [recommend, 1.15]])} layers={[...backdrop2('suburb', 1), {depth: 1, children: <>
      <Floor y={760} /><House2 x={180} y={760} s={.7} glow={inK(f, 6, 20) * .7} /><Tree2 x={1060} y={760} />
      <Person2 x={480} y={770} kind="neighbor" ap={CAST.deshawn} pose={{mood: 'happy', armR: -80}} />
      <Person2 x={720} y={770} kind="home" ap={CAST.rosa} flip pose={{mood: f > recommend ? 'happy' : 'neutral'}} />
    </>}]} />
    <Bubble x={430} y={300} k={inK(f, trust - 10)}>You've got to call my contractor!</Bubble>
    <Glass x={540} y={64} k={inK(f, trust - 4)} tone="mint">They trust you enough to recommend you</Glass>
    <div style={{position: 'absolute', left: 580, top: 330, opacity: inK(f, recommend), transform: `scale(${.9 + .1 * inK(f, recommend)})`}}><Emoji name="Thumbs up" style={{width: 110}} /></div>
  </Stage2>;
};

/* 4 · Referrals got you here, not necessarily to tomorrow. You can't control when, how many, or whether they're ready to spend. */
export const S22Control: React.FC<VisualProps> = (p) => {
  const f = p.frame;
  const [referrals, today, tomorrow, control, when, many, ready, spend] = cues(p, [18, 71, 165, 212, 228, 279, 372, 386]);
  const keys: Array<[number, number]> = [[0, 360], [today, 360], [tomorrow, 1100], [control - 6, 1100], [control + 16, 700]];
  const cx = kf(f, keys), zoom = kf(f, [[0, 1.05], [tomorrow, 1.05], [control + 16, .8]]);
  const walk = clamp((f - today) / (tomorrow - today));
  const px = 300 + 520 * EIO(walk);
  const dials = [['When?', when, 'alarm clock'], ['How many?', many, 'Bar Chart'], ['Ready to spend?', ready, 'Money with Wings']] as const;
  return <Stage2 p={p} sky={SKY.midday}>
    <World2 cx={cx} cy={520} zoom={zoom} vx={speed(f, keys)} layers={[...backdrop2('water', 2), {depth: 1, children: <>
      <Floor y={760} />
      {[220, 380, 540, 700].map((x, i) => <g key={x} opacity={inK(f, referrals + i * 6)}><ellipse cx={x} cy={770} rx={60} ry={14} fill="#C7D2FE" /><text x={x} y={720} textAnchor="middle" fontSize={22} fontWeight={800} fill={M.indigo} fontFamily="Arial">referral</text></g>)}
      {[860, 1020, 1180, 1340].map(x => <ellipse key={x} cx={x} cy={770} rx={60} ry={14} fill="none" stroke="#C7D2FE" strokeWidth={4} strokeDasharray="10 10" />)}
      <g transform="translate(1420 760)"><rect x={-8} y={-220} width={16} height={220} fill="#8C92B5" /><rect x={-120} y={-300} width={240} height={90} rx={18} fill="#fff" /><text y={-245} textAnchor="middle" fontSize={34} fontWeight={800} fill={M.ink} fontFamily="Arial">TOMORROW</text></g>
      <g transform="translate(200 760)"><rect x={-8} y={-220} width={16} height={220} fill="#8C92B5" /><rect x={-100} y={-300} width={200} height={90} rx={18} fill="#fff" /><text y={-245} textAnchor="middle" fontSize={34} fontWeight={800} fill={M.ink} fontFamily="Arial">TODAY</text></g>
      <Person2 x={px} y={770} kind="pro" ap={CAST.you} pose={{walk: walk > 0 && walk < 1 ? f / 3.2 : undefined, mood: walk >= 1 ? 'worried' : 'happy'}} />
    </>}]} />
    <Glass x={540} y={64} k={inK(f, referrals) * (1 - inK(f, control - 8, 8))} tone="glass">Referrals got you here…</Glass>
    <Glass x={540} y={64} k={inK(f, control - 2)} tone="ink">You can't control:</Glass>
    {dials.map(([t, at, e], i) => <div key={t} style={{position: 'absolute', left: 90 + i * 315, top: 150, width: 280, padding: '22px 18px', borderRadius: 30, background: 'rgba(255,255,255,.8)', backdropFilter: 'blur(16px)', boxShadow: '0 16px 40px rgba(30,33,64,.14)', textAlign: 'center', fontFamily: font, opacity: inK(f, at - 4), transform: `translateY(${(1 - inK(f, at - 4)) * 18}px)`}}>
      <Emoji name={e} style={{width: 76}} /><div style={{fontSize: 30, fontWeight: 800, color: M.ink, marginTop: 8}}>{t}</div></div>)}
    {dials.map(([, at], i) => <Markup key={i} name="question-mark" at={at + 4} x={150 + i * 315} y={110} w={200} dur={60} />)}
  </Stage2>;
};

/* 5 · When referrals slow down, your schedule slows down with them. */
export const S22Slow: React.FC<VisualProps> = (p) => {
  const f = p.frame;
  const [referrals, slow, schedule, slows] = cues(p, [10, 20, 60, 73]);
  const empty = clamp((f - slows) / 40);
  const needle = -60 + 120 * (1 - EIO(clamp((f - slow) / 50)));
  return <Stage2 p={p} sky={SKY.dusk}>
    <World2 cx={560} cy={520} zoom={1.0} layers={[...backdrop2('suburb', 3), {depth: 1, children: <>
      <Floor y={760} c="#E9DDE8" /><Van2 x={300} y={780} s={.7} />
      <Person2 x={560} y={770} kind="pro" ap={CAST.you} pose={{phone: true, armR: -150, mood: f > slows ? 'worried' : 'neutral'}} />
    </>}]} />
    <div style={{position: 'absolute', left: 90, top: 140, width: 380, padding: 24, borderRadius: 30, background: 'rgba(255,255,255,.82)', boxShadow: '0 16px 40px rgba(30,33,64,.14)', fontFamily: font, opacity: inK(f, referrals - 6)}}>
      <div style={{fontSize: 22, fontWeight: 700, color: M.mute, letterSpacing: 2}}>REFERRALS</div>
      <svg width="330" height="170" viewBox="0 0 330 170"><path d="M30 150A135 135 0 0 1 300 150" fill="none" stroke="#E8E8ED" strokeWidth="22" strokeLinecap="round" /><g transform={`rotate(${needle} 165 150)`}><path d="M165 150V40" stroke={M.ink} strokeWidth="7" strokeLinecap="round" /></g><circle cx="165" cy="150" r="12" fill={M.ink} /></svg>
    </div>
    <div style={{position: 'absolute', left: 520, top: 140, width: 460, padding: 24, borderRadius: 30, background: 'rgba(255,255,255,.82)', boxShadow: '0 16px 40px rgba(30,33,64,.14)', fontFamily: font, opacity: inK(f, schedule - 6)}}>
      <div style={{fontSize: 22, fontWeight: 700, color: M.mute, letterSpacing: 2}}>YOUR SCHEDULE</div>
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginTop: 14}}>{Array.from({length: 15}, (_, i) => <div key={i} style={{height: 40, borderRadius: 8, background: i / 15 < 1 - empty * .85 ? M.indigo : '#EEF0FA'}} />)}</div>
    </div>
    <Glass x={540} y={64} k={inK(f, slow)} tone="peach">Referrals slow → your schedule slows</Glass>
  </Stage2>;
};

/* 6 · Marketing creates opportunities instead of waiting for someone to mention your name; it puts your work in front of people actively looking. */
export const S22Another: React.FC<VisualProps> = (p) => {
  const f = p.frame;
  const [another, opportunities, waiting, name, work, homeowners, actively, services] = cues(p, [24, 54, 134, 183, 222, 244, 277, 317]);
  const keys: Array<[number, number]> = [[0, 360], [waiting + 10, 360], [work, 820]];
  const cx = kf(f, keys);
  const people = [[700, 'maya'], [960, 'walt'], [1180, 'liam']] as const;
  return <Stage2 p={p} sky={SKY.golden}>
    <World2 cx={cx} cy={520} zoom={1.0} vx={speed(f, keys)} layers={[...backdrop2('city', 4), {depth: 1, children: <>
      <Floor y={760} />
      <rect x={180} y={620} width={200} height={16} rx={6} fill="#B49A87" /><rect x={196} y={636} width={12} height={124} fill="#A3896F" /><rect x={352} y={636} width={12} height={124} fill="#A3896F" />
      <g transform="translate(300 600)"><rect x={-22} y={-14} width={44} height={20} rx={4} fill={M.ink} /></g>
      <Person2 x={140} y={770} kind="pro" ap={CAST.you} pose={{mood: f < work ? 'neutral' : 'happy', armR: f > work ? -110 : -20}} />
      {f > waiting && f < work && <g opacity={.6}>{[0, 1, 2].map(i => <path key={i} d={`M${280 + i * 30} 560Q${290 + i * 30} 540 ${300 + i * 30} 560`} stroke="#B8BCCB" strokeWidth={2} fill="none" />)}</g>}
      <g transform="translate(980 760)" opacity={inK(f, work - 6, 14)}><rect x={-8} y={-200} width={16} height={200} fill="#8C92B5" /><rect x={-230} y={-420} width={460} height={230} rx={22} fill="#fff" />
        {[0, 1, 2].map(i => <rect key={i} x={-210 + i * 145} y={-400} width={130} height={150} rx={12} fill={['url(#g-roof)', 'url(#g-home)', 'url(#g-roof2)'][i]} />)}
        <text y={-215} textAnchor="middle" fontSize={26} fontWeight={800} fill={M.ink} fontFamily="Arial">YOUR WORK</text></g>
      {people.map(([x, c], i) => <Person2 key={c} x={x} y={770} s={.85} kind="home" ap={CAST[c]} pose={{phone: true, armR: -150, mood: f > actively + i * 8 ? 'happy' : 'neutral', look: f > actively ? 6 : 0}} />)}
    </>}]} />
    <Glass x={540} y={64} k={inK(f, another - 4) * (1 - inK(f, waiting - 6, 8))} tone="indigo">Another way to create opportunities</Glass>
    <Glass x={540} y={64} k={inK(f, waiting) * (1 - inK(f, work - 6, 8))} tone="ink">…instead of waiting for your name to come up</Glass>
    <Glass x={540} y={64} k={inK(f, work)} tone="mint">In front of homeowners actively looking</Glass>
    <Markup name="x-mark-white" at={name - 6} x={60} y={300} w={460} dur={work - name} />
  </Stage2>;
};

/* 7 · Build your presence on Google, show your projects on social media, use ads to reach your service area. */
export const S22Channels: React.FC<VisualProps> = (p) => {
  const f = p.frame;
  const [google, projects, social, ads, area] = cues(p, [46, 86, 106, 150, 209]);
  const rows: Array<[string[], string, number]> = [[['GOOGLE'], 'Build your presence on Google', google], [['INSTAGRAM', 'facebook'], 'Show off your projects', social], [['GOOGLE ADS'], 'Ads in your service area', ads]];
  const ring = inK(f, area - 6, 16);
  return <Stage2 p={p} sky={SKY.morning}>
    <World2 cx={560} cy={520} zoom={1.0} layers={[...backdrop2('park', 5), {depth: 1, children: <>
      <Floor y={760} c="#EFE9DE" />
      <g transform="translate(860 700)"><ellipse rx={260 * ring} ry={70 * ring} fill="rgba(91,91,240,.12)" stroke={M.indigo} strokeWidth={4} strokeDasharray="14 10" opacity={ring} /></g>
      <House2 x={760} y={760} s={.5} /><House2 x={960} y={760} s={.5} roof="b" />
      <Person2 x={220} y={770} kind="pro" ap={CAST.you} pose={{mood: 'happy', armR: -100}} />
    </>}]} />
    <div style={{position: 'absolute', left: 90, top: 120, width: 640, padding: '20px 28px', borderRadius: 32, background: 'rgba(255,255,255,.84)', boxShadow: '0 18px 44px rgba(30,33,64,.15)', fontFamily: font, opacity: inK(f, google - 10)}}>
      {rows.map(([logos, t, at], i) => <div key={t} style={{display: 'flex', alignItems: 'center', gap: 18, padding: '18px 0', borderTop: i ? '1.5px solid rgba(0,0,0,.07)' : 'none', opacity: inK(f, at - 4)}}>
        <div style={{display: 'flex', gap: 6, width: 130}}>{logos.map(l => <Logo key={l} name={l} style={{width: 58, height: 58}} />)}</div>
        <div style={{fontSize: 32, fontWeight: 700, color: M.ink}}>{t}</div></div>)}
    </div>
    {rows.map(([, , at], i) => <Markup key={i} name="check-mark" at={at + 8} x={660} y={92 + i * 96} w={170} />)}
    <Glass x={860} y={430} k={ring} tone="indigo">Your service area</Glass>
  </Stage2>;
};

/* 9 · A business that grows when people recommend you vs one with a system for finding new customers. */
export const S22System: React.FC<VisualProps> = (p) => {
  const f = p.frame;
  const [grows, recommend, system, finding, customers] = cues(p, [81, 110, 197, 221, 243]);
  const R = inK(f, system - 6, 14);
  const flow = f > finding ? ((f - finding) / 16) : 0;
  return <Stage2 p={p} sky={SKY.midday}>
    <World2 cx={650} cy={520} zoom={1.0} layers={[...backdrop2('site', 6), {depth: 1, children: <>
      <Floor y={760} />
      <path d="M540 260V760" stroke="#D5D9F2" strokeWidth={4} strokeDasharray="12 12" />
      <g transform="translate(270 760)"><rect x={-60} y={-90} width={120} height={90} rx={10} fill="#C8A27C" /><Tree2 x={0} y={-90} s={.4 + .25 * inK(f, recommend, 30) + .05 * Math.sin(f / 30)} /></g>
      {f > recommend && f < system + 20 && <g transform={`translate(${200 + 40 * Math.sin(f / 9)} 420)`} opacity={.8}><rect x={-60} y={-24} width={120} height={48} rx={24} fill="#fff" /><text y={8} textAnchor="middle" fontSize={20} fontWeight={800} fill={M.indigo} fontFamily="Arial">referral</text></g>}
      <g opacity={R}><rect x={680} y={560} width={300} height={140} rx={24} fill="#fff" stroke={M.indigo} strokeWidth={5} />
        {[0, 1, 2].map(i => <g key={i} transform={`translate(${740 + i * 90} 630) rotate(${f * 4 * (i % 2 ? -1 : 1)})`}><circle r={26} fill="none" stroke={M.indigo} strokeWidth={8} strokeDasharray="10 7" /></g>)}
        <text x={830} y={545} textAnchor="middle" fontSize={26} fontWeight={800} fill={M.indigo} fontFamily="Arial">SYSTEM</text>
        {flow > 0 && [0, 1, 2, 3].map(i => { const t = (flow + i / 4) % 1; return <g key={i} transform={`translate(${990 + t * 160} ${700})`} opacity={t < .9 ? 1 : 0}><Person2 x={0} y={70} s={.35} kind="home" ap={[CAST.maya, CAST.walt, CAST.ana, CAST.kenji][i]} pose={{mood: 'happy', walk: f / 3}} /></g>; })}
      </g>
    </>}]} />
    <Glass x={250} y={220} k={inK(f, grows - 4)} tone="glass">Grows when recommended</Glass>
    <Glass x={740} y={140} k={inK(f, system - 4)} tone="indigo">A system for finding customers</Glass>
    <Markup name="circle---red" at={customers - 8} x={430} y={400} w={560} />
    <Burn at={0} n={2} opacity={.75} />
  </Stage2>;
};
