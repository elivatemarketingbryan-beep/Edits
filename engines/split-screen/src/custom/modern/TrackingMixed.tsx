import React from 'react';
import {clamp} from '../../motion';
import type {VisualProps} from '../../types';
import {C, cues, sp, lin, eOut, eMove, glass, label, Stage, Rise, Kinetic, Avatar, Pill} from './kit';
import {L, R, SH, panel, eyebrow, LStage, LIn, LTitle, LRows, LPill, LToggle, LTrack, lIn, lMove} from './kitLight';

// "Do you know where your customers come from?" (video17). Mixed styles per scene:
// dark glass for the problem (spending blind), light Apple for the fix (tracking).
// Only figure on screen is the speaker's "last 10 customers". 1080x900 canvas.

const Top: React.FC<{p: VisualProps; tint?: [string, string, string]; children: React.ReactNode}> = ({p, tint, children}) =>
  <Stage p={p} ch={900} top={30} tint={tint}>{children}</Stage>;
const card = (left: number, top: number, width: number, height: number, extra: React.CSSProperties = {}): React.CSSProperties =>
  ({...glass, left, top, width, height, boxSizing: 'border-box', ...extra});
const Q: React.FC<{size?: number; color?: string}> = ({size = 34, color = C.warn}) =>
  <span style={{display: 'inline-flex', width: size * 1.6, height: size * 1.6, borderRadius: size, alignItems: 'center', justifyContent: 'center', fontSize: size, fontWeight: 900, color: '#1A1300', background: color}}>?</span>;

/* DARK · Was it Google, Facebook, a referral, your website, or someone who saw your truck? */
export const D17Sources: React.FC<VisualProps> = (p) => {
  const [google, facebook, referral, website, truck] = cues(p, [8, 29, 53, 85, 155]);
  const src = [['Google', google, '#60A5FA'], ['Facebook', facebook, '#818CF8'], ['Referral', referral, '#34D399'], ['Website', website, '#22D3EE'], ['Your truck', truck, '#FBBF24']] as const;
  const cx = 300, cy = 470, rr = 175;
  return <Top p={p} tint={['#4F46E5', '#0E7490', '#B45309']}>
    <Rise p={p} at={0} style={{left: 80, top: 20}}><div style={label}>Your last 10 customers</div></Rise>
    <Rise p={p} at={0} style={card(80, 80, 440, 780, {borderRadius: 44})}>
      {Array.from({length: 10}, (_, i) => { const a = -Math.PI / 2 + i / 10 * Math.PI * 2; const k = eOut(p, 2 + i * 2, 12); return <div key={i} style={{position: 'absolute', left: cx - 80 + Math.cos(a) * rr - 36, top: cy - 80 + Math.sin(a) * rr - 36, opacity: k, transform: `scale(${.9 + .1 * k})`}}>
        <Avatar c="#64748B" s={72} />
        <div style={{position: 'absolute', right: -8, top: -8, transform: 'scale(.55)', transformOrigin: 'top right'}}><Q size={30} /></div></div>; })}
      <div style={{position: 'absolute', left: 0, right: 0, top: cy - 135, textAlign: 'center', fontSize: 50, fontWeight: 850, letterSpacing: -1.5, lineHeight: 1.05}}>Where<br />from?</div>
    </Rise>
    {src.map(([t, at, c], i) => <Rise key={t} p={p} at={at - 4} dy={24} style={card(560, 80 + i * 158, 440, 132, {display: 'flex', alignItems: 'center', gap: 22, padding: '0 28px', borderRadius: 30, border: `1.5px solid ${c}55`})}>
      <div style={{width: 18, height: 18, borderRadius: 9, background: c, boxShadow: `0 0 18px ${c}`}} />
      <div style={{flex: 1, fontSize: 40, fontWeight: 800}}>{t}</div><Q size={26} />
    </Rise>)}
  </Top>;
};

/* DARK · Spending on marketing without knowing: FB leads → estimates?, traffic but nobody requesting a quote. */
export const D17Blind: React.FC<VisualProps> = (p) => {
  const [spending, marketing, facebook, leads, estimates, website, nobody, quote] = cues(p, [55, 87, 165, 236, 262, 320, 408, 452]);
  const spent = eMove(p, spending - 4, 60);
  const step = (t: string, at: number, v: React.ReactNode, hot?: boolean) => <div style={{flex: 1, padding: '18px 20px', borderRadius: 22, background: 'rgba(255,255,255,.06)', border: `1.5px solid ${hot ? 'rgba(251,113,133,.5)' : 'rgba(255,255,255,.1)'}`, opacity: eOut(p, at - 4, 12)}}>
    <div style={{fontSize: 22, fontWeight: 700, color: C.mute, letterSpacing: 2, textTransform: 'uppercase'}}>{t}</div><div style={{fontSize: 46, fontWeight: 850, marginTop: 6}}>{v}</div></div>;
  const arrow = (at: number) => <div style={{fontSize: 36, color: C.mute, opacity: eOut(p, at - 4, 10)}}>→</div>;
  return <Top p={p} tint={['#BE123C', '#4F46E5', '#0E7490']}>
    <Kinetic p={p} at={0} text="Spending blind" size={70} top={20} grad="linear-gradient(90deg,#FFFFFF,#FDA4AF)" />
    <Rise p={p} at={spending - 10} style={card(80, 130, 920, 170, {padding: '30px 40px'})}>
      <div style={{display: 'flex', justifyContent: 'space-between', ...label}}><span>Marketing spend</span><span style={{color: C.bad, opacity: lin(p, marketing, 10)}}>going out</span></div>
      <div style={{position: 'relative', height: 26, borderRadius: 13, background: C.faint, marginTop: 30, overflow: 'hidden'}}><div style={{position: 'absolute', inset: 0, width: `${spent * 100}%`, borderRadius: 13, background: 'linear-gradient(90deg,#FB7185,#F59E0B)'}} /></div>
    </Rise>
    <Rise p={p} at={facebook - 6} style={card(80, 330, 920, 250, {padding: '28px 30px'})}>
      <div style={label}>Facebook ads</div>
      <div style={{display: 'flex', alignItems: 'center', gap: 16, marginTop: 20}}>{step('Clicks', facebook, '↑')}{arrow(leads)}{step('Leads', leads, <Q size={26} />)}{arrow(estimates)}{step('Estimates', estimates, <Q size={26} />, true)}</div>
    </Rise>
    <Rise p={p} at={website - 6} style={card(80, 610, 920, 250, {padding: '28px 30px'})}>
      <div style={label}>Your website</div>
      <div style={{display: 'flex', alignItems: 'center', gap: 16, marginTop: 20}}>{step('Traffic', website, '↑')}{arrow(nobody)}{step('Quote requests', nobody, <span style={{color: C.bad}}>0</span>, true)}</div>
      <div style={{position: 'absolute', right: 30, top: 26, opacity: eOut(p, quote, 10)}}><Pill color={C.bad}>nobody's asking</Pill></div>
    </Rise>
  </Top>;
};

/* DARK · Ignoring Google even though it's bringing your best customers. */
export const D17Google: React.FC<VisualProps> = (p) => {
  const [ignoring, google, best] = cues(p, [23, 35, 111]);
  const reveal = eOut(p, best - 6, 16);
  return <Top p={p} tint={['#1D4ED8', '#059669', '#4F46E5']}>
    <Kinetic p={p} at={0} text="The one you're ignoring" size={66} top={20} />
    <Rise p={p} at={2} style={card(80, 140, 920, 700, {padding: 40})}>
      <div style={label}>Where your best customers came from</div>
      {[['Facebook ads', .45, '#818CF8', false], ['Referral', .55, '#34D399', false], ['Google', .92, '#60A5FA', true]].map(([t, v, c, g], i) => {
        const dim = g ? (1 - .6 * lin(p, ignoring - 4, 10)) * (1 - reveal) + reveal : 1;
        return <div key={t as string} style={{marginTop: 46, opacity: eOut(p, google - 10 + i * 3, 12) * dim}}>
          <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 38, fontWeight: 800}}><span>{t}</span>{g && <span style={{fontSize: 26, color: reveal > .5 ? C.good : C.mute}}>{reveal > .5 ? '★ best customers' : 'ignored'}</span>}</div>
          <div style={{height: 26, borderRadius: 13, background: C.faint, marginTop: 16, overflow: 'hidden'}}><div style={{height: '100%', width: `${(v as number) * (g ? .25 + .75 * reveal : 1) * 100}%`, borderRadius: 13, background: c as string, boxShadow: g && reveal > .5 ? `0 0 30px ${c}` : 'none'}} /></div>
        </div>;
      })}
    </Rise>
  </Top>;
};

/* LIGHT · Track every inquiry: where it came from, whether you booked an estimate, won the job, and the revenue. */
export const L17Tracker: React.FC<VisualProps> = (p) => {
  const [tracking, inquiry, source, estimate, won, revenue] = cues(p, [12, 43, 111, 159, 204, 241]);
  const rows = [['Google', 'Roof repair'], ['Referral', 'Kitchen remodel'], ['Facebook', 'Deck'], ['Truck sign', 'Bathroom']] as const;
  const cols = [['Source', source], ['Estimate', estimate], ['Won', won], ['Revenue', revenue]] as const;
  const W = [250, 170, 150, 200];
  return <LStage p={p}>
    <LIn p={p} at={0} style={{left: 80, top: 20}}><div style={eyebrow}>The fix</div></LIn>
    <LTitle p={p} at={tracking - 8} text="Track every inquiry." size={80} top={60} />
    <LIn p={p} at={inquiry - 8} style={{...panel, left: 80, top: 190, width: 920, height: 650}}>
      <div style={{display: 'flex', height: 90, alignItems: 'center', padding: '0 40px', borderBottom: `1.5px solid ${L.hair}`}}>
        <div style={{width: 120, fontSize: 24, fontWeight: 600, color: L.t3}}>Lead</div>
        {cols.map(([t, at], i) => <div key={t} style={{width: W[i], fontSize: 24, fontWeight: 600, color: p.frame >= at - 4 ? L.text : L.t4}}>{t}</div>)}
      </div>
      {rows.map(([s, job], r) => <div key={r} style={{display: 'flex', height: 138, alignItems: 'center', padding: '0 40px', borderTop: r ? `1.5px solid ${L.hair}` : 'none', opacity: lIn(p, inquiry + r * 3)}}>
        <div style={{width: 120}}><div style={{fontSize: 30, fontWeight: 600}}>#{r + 1}</div><div style={{fontSize: 20, color: L.t3}}>{job}</div></div>
        <div style={{width: W[0], fontSize: 32, fontWeight: 600, opacity: lIn(p, source + r * 2)}}>{s}</div>
        <div style={{width: W[1], opacity: lIn(p, estimate + r * 2)}}><LToggle p={p} at={estimate + r * 2 + 4} /></div>
        <div style={{width: W[2], opacity: lIn(p, won + r * 2)}}>{r === 2 ? <LPill>No</LPill> : <LPill tone="live">Won</LPill>}</div>
        <div style={{width: W[3], opacity: lIn(p, revenue + r * 2)}}>{r === 2 ? <span style={{fontSize: 30, color: L.t4}}>—</span> : <div style={{display: 'flex', alignItems: 'center', gap: 10}}><span style={{fontSize: 32, fontWeight: 600}}>$</span><div style={{width: 110, height: 14, borderRadius: 7, background: L.track}} /></div>}</div>
      </div>)}
    </LIn>
  </LStage>;
};

/* LIGHT · No complicated spreadsheet: just get it organized and review it consistently. */
export const L17Simple: React.FC<VisualProps> = (p) => {
  const [spreadsheet, organized, review] = cues(p, [42, 116, 154]);
  const strike = lMove(p, spreadsheet + 10, 10);
  const weeks = ['Mon', 'Mon', 'Mon', 'Mon'];
  return <LStage p={p}>
    <LIn p={p} at={0} style={{left: 80, top: 20}}><div style={eyebrow}>Keep it simple</div></LIn>
    <LIn p={p} at={spreadsheet - 14} style={{...panel, left: 80, top: 80, width: 920, height: 260, padding: 26, opacity: 1 - .55 * strike}}>
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 4}}>{Array.from({length: 48}, (_, i) => <div key={i} style={{height: 34, borderRadius: 4, background: i % 13 === 0 ? '#dbe9ff' : L.bg}} />)}</div>
      <div style={{position: 'absolute', left: 40, right: 40, top: '50%', height: 6, borderRadius: 3, background: L.heat, transform: `scaleX(${strike})`, transformOrigin: 'left'}} />
      <div style={{position: 'absolute', right: 30, bottom: 22, fontSize: 26, fontWeight: 600, color: L.heat, opacity: strike}}>Not needed</div>
    </LIn>
    <LIn p={p} at={organized - 6} style={{...panel, left: 80, top: 380, width: 520, height: 500}}>
      <div style={{padding: '30px 40px 10px', fontSize: 40, fontWeight: 700, letterSpacing: '-0.02em'}}>Inquiry log</div>
      <LRows p={p} rowH={100} rows={['Source', 'Estimate booked?', 'Job won?', 'Revenue'].map((t, i) => ({at: organized + i * 3, title: t, right: <div style={{width: 120, height: 14, borderRadius: 7, background: L.track}} />}))} />
    </LIn>
    <LIn p={p} at={review - 6} style={{...panel, left: 630, top: 380, width: 370, height: 500, padding: 34}}>
      <div style={eyebrow}>Review</div>
      <div style={{fontSize: 40, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 8}}>Every week</div>
      {weeks.map((w, i) => <div key={i} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 28, opacity: lIn(p, review + 4 + i * 6)}}>
        <span style={{fontSize: 30, fontWeight: 600, color: L.t2}}>{w}</span>
        <span style={{width: 40, height: 40, borderRadius: 20, background: L.accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700}}>✓</span></div>)}
    </LIn>
  </LStage>;
};

/* LIGHT · Once you know what's working, decide where your time and money go. */
export const L17Decide: React.FC<VisualProps> = (p) => {
  const [working, decisions, spend, money] = cues(p, [49, 97, 144, 172]);
  const shift = lMove(p, spend, 30);
  const src = [['Google', .9, .9 + .1 * shift], ['Referral', .7, .7], ['Facebook ads', .25, .25 - .1 * shift]] as const;
  return <LStage p={p}>
    <LIn p={p} at={0} style={{left: 80, top: 20}}><div style={eyebrow}>Once you know</div></LIn>
    <LTitle p={p} at={working - 10} text="Spend on what works." size={80} top={60} />
    <LIn p={p} at={working - 4} style={{...panel, left: 80, top: 190, width: 920, height: 420, padding: '30px 44px'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 26, fontWeight: 600, color: L.t3}}><span>Source</span><span>Turns into jobs</span></div>
      {src.map(([t, v], i) => <div key={t} style={{marginTop: 38, opacity: lIn(p, working + i * 3)}}>
        <div style={{fontSize: 36, fontWeight: 600, marginBottom: 14}}>{t}</div>
        <LTrack v={(v as number) * lIn(p, working + 4 + i * 3, 18)} h={18} color={i === 0 ? L.accent : L.t4} /></div>)}
    </LIn>
    <LIn p={p} at={decisions - 6} style={{...panel, left: 80, top: 640, width: 920, height: 220, padding: '30px 44px'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}><div style={{fontSize: 34, fontWeight: 700}}>Your time & money</div><div style={{fontSize: 24, color: L.t3, opacity: lin(p, money, 10)}}>moved to what works</div></div>
      <div style={{display: 'flex', height: 64, borderRadius: R.pill, overflow: 'hidden', marginTop: 30, background: L.track}}>
        <div style={{width: `${(45 + 30 * shift)}%`, background: L.accent, display: 'flex', alignItems: 'center', paddingLeft: 24, color: '#fff', fontSize: 26, fontWeight: 600}}>Google</div>
        <div style={{width: `${35}%`, background: '#5e5ce6', display: 'flex', alignItems: 'center', paddingLeft: 24, color: '#fff', fontSize: 26, fontWeight: 600}}>Referral</div>
        <div style={{flex: 1, display: 'flex', alignItems: 'center', paddingLeft: 18, color: L.t3, fontSize: 24, fontWeight: 600, overflow: 'hidden', whiteSpace: 'nowrap'}}>Ads</div>
      </div>
    </LIn>
  </LStage>;
};
