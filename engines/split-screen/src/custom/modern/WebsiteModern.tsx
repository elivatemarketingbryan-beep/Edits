import React from 'react';
import {clamp} from '../../motion';
import type {VisualProps} from '../../types';
import {C, cues, sp, lin, smooth, glass, label, Stage, Rise, Kinetic, Check, Avatar, Pill, Cursor} from './kit';

// Sleek split-screen scenes for "a pretty website isn't enough" (video14).
// All websites, analytics and phones are generic UI. 1080x900 design canvas.
const Top: React.FC<{p: VisualProps; tint?: [string, string, string]; children: React.ReactNode}> = ({p, tint, children}) =>
  <Stage p={p} ch={900} top={30} tint={tint}>{children}</Stage>;
const card = (left: number, top: number, width: number, height: number, extra: React.CSSProperties = {}): React.CSSProperties =>
  ({...glass, left, top, width, height, boxSizing: 'border-box', ...extra});

const Chrome: React.FC<{url?: string}> = ({url = 'yourbusiness.com'}) =>
  <div style={{height: 60, display: 'flex', alignItems: 'center', gap: 10, padding: '0 24px', borderBottom: '1.5px solid rgba(255,255,255,.1)'}}>
    {['#FF5F57', '#FEBC2E', '#28C840'].map(c => <div key={c} style={{width: 16, height: 16, borderRadius: 8, background: c}} />)}
    <div style={{marginLeft: 18, flex: 1, height: 34, borderRadius: 17, background: 'rgba(255,255,255,.08)', fontSize: 20, color: C.mute, display: 'flex', alignItems: 'center', paddingLeft: 20}}>{url}</div>
  </div>;
const Hero: React.FC<{h?: number}> = ({h = 200}) =>
  <div style={{height: h, margin: 24, borderRadius: 24, background: 'linear-gradient(135deg,#312E81,#0E7490 60%,#7C3AED)', position: 'relative', overflow: 'hidden'}}>
    <div style={{position: 'absolute', left: 30, top: 34, width: 70, height: 70, borderRadius: 20, background: 'rgba(255,255,255,.85)'}} />
    <div style={{position: 'absolute', left: 30, top: 124, width: '55%', height: 22, borderRadius: 11, background: 'rgba(255,255,255,.7)'}} />
    <div style={{position: 'absolute', left: 30, top: 158, width: '35%', height: 16, borderRadius: 8, background: 'rgba(255,255,255,.4)'}} />
  </div>;
const XMark: React.FC<{k: number}> = ({k}) =>
  <svg width="40" height="40" viewBox="0 0 40 40"><path d="M11 11L29 29M29 11L11 29" stroke="#FFF" strokeWidth="5" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - clamp(k)} /></svg>;

/* 2 · Looks professional, but: no clear next step, no easy estimate, no proof, nothing that stands out. */
export const M14Pretty: React.FC<VisualProps> = (p) => {
  const [website, professional, lands, nextStep, estimate, proof, separates] = cues(p, [61, 87, 145, 181, 235, 303, 373]);
  const misses = [['No clear next step', nextStep], ['No easy way to request an estimate', estimate], ['No strong proof of the work', proof], ['Looks like every other contractor', separates]] as const;
  return <Top p={p} tint={['#4F46E5', '#0E7490', '#BE123C']}>
    <Rise p={p} at={website - 8} style={card(80, 20, 920, 360, {borderRadius: 32})}>
      <Chrome /><Hero h={250} />
      <div style={{position: 'absolute', right: 40, top: 90, opacity: clamp(sp(p, professional - 4) * 1.4)}}><Pill color={C.good} solid>✓ Looks professional</Pill></div>
    </Rise>
    <Rise p={p} at={lands - 6} style={{left: 80, top: 410, display: 'flex', alignItems: 'center', gap: 16}}>
      <Avatar c="#F59E0B" s={56} /><div style={{fontSize: 34, fontWeight: 750}}>A homeowner lands on it… <span style={{color: C.bad}}>but</span></div>
    </Rise>
    {misses.map(([t, at], i) => <Rise key={t} p={p} at={at - 6} style={card(80 + (i % 2) * 470, 500 + Math.floor(i / 2) * 175, 450, 150, {display: 'flex', alignItems: 'center', gap: 20, padding: '0 26px', borderRadius: 30, border: '1.5px solid rgba(251,113,133,.45)'})}>
      <div style={{width: 60, height: 60, borderRadius: 30, flex: 'none', background: 'linear-gradient(140deg,#FB7185,#E11D48)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><XMark k={lin(p, at, 10)} /></div>
      <div style={{fontSize: 30, fontWeight: 750, lineHeight: 1.18}}>{t}</div>
    </Rise>)}
  </Top>;
};

/* 3 · They click around for a few seconds and leave; you lose customers without knowing they were there. */
export const M14Bounce: React.FC<VisualProps> = (p) => {
  const [clicks, seconds, leave, losing, knowing] = cues(p, [21, 55, 83, 128, 191]);
  const exit = smooth(lin(p, leave - 4, 14));
  const timer = clamp((p.frame - clicks) / (leave - clicks));
  return <Top p={p} tint={['#BE123C', '#4F46E5', '#0E7490']}>
    <Rise p={p} at={0} style={card(80, 20, 600, 520, {borderRadius: 32, opacity: 1 - .4 * exit})}>
      <Chrome /><Hero h={180} />
      <div style={{display: 'flex', gap: 14, margin: '0 24px'}}>{[0, 1, 2].map(i => <div key={i} style={{flex: 1, height: 150, borderRadius: 18, background: 'rgba(255,255,255,.08)'}} />)}</div>
    </Rise>
    <Rise p={p} at={clicks - 6} style={card(720, 20, 280, 520, {display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20})}>
      <div style={label}>Time on site</div>
      <svg width="170" height="170" viewBox="0 0 170 170" style={{transform: 'rotate(-90deg)'}}><circle cx="85" cy="85" r="70" fill="none" stroke={C.faint} strokeWidth="16" />
        <circle cx="85" cy="85" r="70" fill="none" stroke={C.bad} strokeWidth="16" strokeLinecap="round" strokeDasharray={`${440 * timer * .18} 440`} /></svg>
      <div style={{fontSize: 34, fontWeight: 800, color: C.bad, opacity: lin(p, seconds - 4, 10)}}>a few seconds</div>
    </Rise>
    <Rise p={p} at={leave - 4} style={card(80, 580, 600, 120, {display: 'flex', alignItems: 'center', gap: 22, padding: '0 30px', borderRadius: 30})}>
      <div style={{fontSize: 40}}>↩</div><div style={{fontSize: 34, fontWeight: 800}}>Visitor left. <span style={{color: C.mute, fontWeight: 600}}>No inquiry.</span></div>
    </Rise>
    <Rise p={p} at={losing - 6} style={{left: 80, top: 740, display: 'flex', alignItems: 'center', gap: 26}}>
      <div style={{display: 'flex'}}>{[0, 1, 2, 3, 4].map(i => <div key={i} style={{marginLeft: i ? -18 : 0, opacity: (1 - .16 * i) * (1 - .6 * lin(p, knowing, 20))}}><Avatar c="#94A3B8" s={64} /></div>)}</div>
      <div style={{fontSize: 34, fontWeight: 750, color: C.mute}}>customers you <span style={{color: C.bad}}>never knew</span> were there</div>
    </Rise>
    <Cursor p={p} path={[[clicks - 6, 300, 200], [clicks + 14, 420, 330], [clicks + 30, 220, 420], [clicks + 46, 520, 260], [leave, 560, 60], [leave + 14, 700, -120]]} clicks={[clicks + 14, clicks + 46]} />
  </Top>;
};

/* 5 · Show the kind of work you do, the areas you serve, what makes you trustworthy, and the next step. */
export const M14Needs: React.FC<VisualProps> = (p) => {
  const [show, work, areas, trust, next] = cues(p, [15, 37, 67, 133, 201]);
  const sec = (at: number) => ({opacity: clamp(sp(p, at - 4) * 1.4), transform: `translateY(${(1 - clamp(sp(p, at - 4))) * 30}px)`});
  const cta = p.frame > next + 2;
  return <Top p={p} tint={['#059669', '#4F46E5', '#0E7490']}>
    <Rise p={p} at={show - 10} style={card(80, 20, 920, 840, {borderRadius: 34})}>
      <Chrome />
      <div style={{padding: '30px 40px'}}>
        <div style={sec(work)}><div style={label}>Our work</div>
          <div style={{display: 'flex', gap: 14, marginTop: 16}}>{['#6EE7B7,#0EA5E9', '#A78BFA,#F472B6', '#FDE68A,#FB923C'].map(g => <div key={g} style={{flex: 1, height: 160, borderRadius: 20, background: `linear-gradient(160deg,${g})`}} />)}</div></div>
        <div style={{...sec(areas), marginTop: 30}}><div style={label}>Areas we serve</div>
          <div style={{display: 'flex', gap: 14, marginTop: 16}}>{['Your town', 'Next town', 'County'].map(t => <Pill key={t} color={C.b}>● {t}</Pill>)}</div></div>
        <div style={{...sec(trust), marginTop: 30}}><div style={label}>Why trust us</div>
          <div style={{display: 'flex', gap: 14, marginTop: 16}}>{['Licensed & insured', '★★★★★ Reviews', 'Warranty'].map(t => <div key={t} style={{flex: 1, padding: '22px 10px', borderRadius: 20, background: 'rgba(52,211,153,.1)', border: '1.5px solid rgba(52,211,153,.35)', fontSize: 26, fontWeight: 750, textAlign: 'center'}}>{t}</div>)}</div></div>
        <div style={{...sec(next), marginTop: 34, height: 100, borderRadius: 50, background: 'linear-gradient(90deg,#34D399,#22D3EE)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38, fontWeight: 850, color: '#06120C', boxShadow: cta ? `0 0 ${40 + 20 * Math.sin(p.frame / 6)}px rgba(52,211,153,.7)` : 'none'}}>Get a free estimate →</div>
      </div>
    </Rise>
  </Top>;
};

/* 6 · Best projects front and center, real reviews, common questions answered, a very simple estimate request. */
export const M14Build: React.FC<VisualProps> = (p) => {
  const [projects, reviews, questions, simple, send] = cues(p, [19, 79, 130, 187, 237]);
  const sent = p.frame >= send;
  const faqOpen = smooth(lin(p, questions + 6, 14));
  const type = (s: string, at: number) => s.slice(0, Math.floor(clamp((p.frame - at) / 14) * s.length));
  return <Top p={p} tint={['#7C3AED', '#0E7490', '#059669']}>
    <Rise p={p} at={projects - 6} style={card(80, 20, 470, 260, {padding: 26})}>
      <div style={label}>Best projects · front & center</div>
      <div style={{display: 'flex', gap: 12, marginTop: 18}}>{['#6EE7B7,#0EA5E9', '#FDE68A,#FB923C'].map(g => <div key={g} style={{flex: 1, height: 160, borderRadius: 18, background: `linear-gradient(160deg,${g})`}} />)}</div>
    </Rise>
    <Rise p={p} at={reviews - 6} style={card(80, 300, 470, 250, {padding: 26})}>
      <div style={label}>Real customer reviews</div>
      {[0, 1].map(i => <div key={i} style={{display: 'flex', alignItems: 'center', gap: 14, marginTop: 18, opacity: clamp(sp(p, reviews + i * 8) * 1.4)}}>
        <Avatar c={i ? '#F472B6' : '#34D399'} s={52} /><div><div style={{color: '#FBBF24', fontSize: 22}}>★★★★★</div><div style={{width: 260 - i * 50, height: 12, borderRadius: 6, background: 'rgba(255,255,255,.25)', marginTop: 6}} /></div></div>)}
    </Rise>
    <Rise p={p} at={questions - 6} style={card(80, 570, 470, 290, {padding: 26})}>
      <div style={label}>Common questions</div>
      {['How long does it take?', 'Do you offer warranties?'].map((q, i) => <div key={q} style={{marginTop: 16, padding: '16px 18px', borderRadius: 16, background: 'rgba(255,255,255,.06)'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 26, fontWeight: 750}}><span>{q}</span><span style={{color: C.mute}}>{i === 0 && faqOpen > .5 ? '–' : '+'}</span></div>
        {i === 0 && <div style={{height: 40 * faqOpen, overflow: 'hidden'}}><div style={{width: '80%', height: 12, borderRadius: 6, background: 'rgba(255,255,255,.2)', marginTop: 16}} /></div>}
      </div>)}
    </Rise>
    <Rise p={p} at={simple - 8} style={card(580, 20, 420, 840, {padding: '34px 30px', border: sent ? `2px solid ${C.good}` : glass.border})}>
      <div style={label}>Request an estimate</div>
      <div style={{fontSize: 40, fontWeight: 850, marginTop: 10}}>Takes seconds</div>
      {[['Name', 'Sam Homeowner'], ['Phone', '(555) 010-0000'], ['Project', 'Roof repair']].map(([l, v], i) => <div key={l} style={{marginTop: 26}}>
        <div style={{fontSize: 22, fontWeight: 700, color: C.mute, letterSpacing: 2, textTransform: 'uppercase'}}>{l}</div>
        <div style={{marginTop: 10, height: 72, borderRadius: 18, background: 'rgba(255,255,255,.07)', border: '1.5px solid rgba(255,255,255,.14)', display: 'flex', alignItems: 'center', padding: '0 20px', fontSize: 28, fontWeight: 650}}>{type(v, simple + i * 14)}</div>
      </div>)}
      <div style={{marginTop: 36, height: 96, borderRadius: 48, background: sent ? 'linear-gradient(90deg,#34D399,#22D3EE)' : 'rgba(255,255,255,.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontSize: 34, fontWeight: 850, color: sent ? '#06120C' : C.ink, transform: `scale(${p.frame >= send && p.frame < send + 5 ? .95 : 1})`}}>
        {sent ? <><Check k={lin(p, send + 2, 10)} size={40} /> Sent</> : 'Send request'}</div>
    </Rise>
    <Cursor p={p} path={[[send - 24, 700, 900], [send - 4, 790, 735], [send + 20, 800, 745], [send + 34, 1000, 900]]} clicks={[send]} />
  </Top>;
};

/* 7 · Make sure people can easily use your site on their phones; that's where homeowners find you. */
export const M14Mobile: React.FC<VisualProps> = (p) => {
  const [easily, phones, find] = cues(p, [49, 103, 159]);
  const m = smooth(lin(p, phones - 14, 26));
  const w = 760 - (760 - 360) * m, h = 560 + (760 - 560) * m, r = 32 + 30 * m;
  return <Top p={p} tint={['#0E7490', '#7C3AED', '#4F46E5']}>
    <Kinetic p={p} at={easily - 10} text="Easy to use on a phone" size={60} top={20} />
    <div style={{position: 'absolute', left: 540 - w / 2, top: 120, width: w, height: h, borderRadius: r, ...glass, opacity: clamp(sp(p, 0) * 1.4)}}>
      {m < .5 ? <Chrome /> : <div style={{height: 60, display: 'flex', justifyContent: 'center', alignItems: 'center'}}><div style={{width: 110, height: 26, borderRadius: 13, background: 'rgba(0,0,0,.5)'}} /></div>}
      <Hero h={160 + 40 * m} />
      <div style={{display: 'flex', flexDirection: m > .5 ? 'column' : 'row', gap: 14, margin: '0 24px'}}>
        {[0, 1].map(i => <div key={i} style={{flex: 1, height: m > .5 ? 90 : 160, borderRadius: 18, background: 'rgba(255,255,255,.08)'}} />)}
      </div>
      {m > .5 && <div style={{margin: '20px 24px 0', height: 84, borderRadius: 42, background: 'linear-gradient(90deg,#34D399,#22D3EE)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontWeight: 850, color: '#06120C', opacity: lin(p, phones + 14, 10)}}>Tap to call</div>}
    </div>
    <Rise p={p} at={phones + 10} style={{left: 760, top: 300}}><Pill color={C.good}>✓ Mobile-friendly</Pill></Rise>
    <Rise p={p} at={find - 6} style={{left: 760, top: 400, width: 260}}><Pill color={C.b}>Where homeowners find you</Pill></Rise>
  </Top>;
};

/* 8 · Your website should be working for your business even while you're out on a job site. */
export const M14Working: React.FC<VisualProps> = (p) => {
  const [working, evenWhen, jobsite] = cues(p, [41, 76, 132]);
  const toasts = ['New estimate request', 'Form submitted · Roof repair', 'Call request · Kitchen'];
  return <Top p={p} tint={['#B45309', '#059669', '#4F46E5']}>
    <Kinetic p={p} at={working - 12} text="Working while you work" size={64} top={20} grad="linear-gradient(90deg,#FFFFFF,#6EE7B7)" />
    <Rise p={p} at={evenWhen - 8} style={card(80, 130, 380, 700, {display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 30})}>
      <svg width="170" height="130" viewBox="0 0 170 130"><path d="M20 100Q20 30 85 30Q150 30 150 100Z" fill="#FBBF24" /><rect x="8" y="96" width="154" height="20" rx="10" fill="#F59E0B" /><rect x="75" y="18" width="20" height="40" rx="8" fill="#FDE68A" /></svg>
      <div style={{fontSize: 40, fontWeight: 850}}>You</div>
      <Pill color="#FBBF24">On the job site</Pill>
    </Rise>
    <Rise p={p} at={evenWhen} style={card(500, 130, 500, 700, {borderRadius: 60, padding: '80px 28px 28px'})}>
      <div style={{position: 'absolute', left: 195, top: 24, width: 110, height: 26, borderRadius: 13, background: 'rgba(0,0,0,.5)'}} />
      <div style={label}>Your website · live</div>
      {toasts.map((t, i) => { const at = jobsite - 30 + i * 18; const k = sp(p, at); return <div key={t} style={{marginTop: 22, padding: '22px 22px', borderRadius: 24, background: 'rgba(255,255,255,.1)', border: '1.5px solid rgba(52,211,153,.35)', display: 'flex', alignItems: 'center', gap: 16, opacity: clamp(k * 1.4), transform: `translateY(${(1 - k) * -30}px)`}}>
        <div style={{width: 48, height: 48, borderRadius: 14, flex: 'none', background: 'linear-gradient(140deg,#34D399,#22D3EE)'}} />
        <div><div style={{fontSize: 26, fontWeight: 800}}>{t}</div><div style={{fontSize: 20, color: C.mute}}>just now</div></div></div>; })}
    </Rise>
  </Top>;
};
