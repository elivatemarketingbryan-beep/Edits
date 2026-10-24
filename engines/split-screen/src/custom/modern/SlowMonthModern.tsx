import React from 'react';
import {clamp} from '../../motion';
import type {VisualProps} from '../../types';
import {C, cues, sp, lin, smooth, glass, label, Stage, Rise, Kinetic, Bar, Check, Pill, Cursor} from './kit';

// Sleek split-screen scenes for "use the slow month" (video12). No figures in the
// source: counters, meters and bars are qualitative. 1080x900 design canvas.
const Top: React.FC<{p: VisualProps; tint?: [string, string, string]; children: React.ReactNode}> = ({p, tint, children}) =>
  <Stage p={p} ch={900} top={30} tint={tint}>{children}</Stage>;
const card = (left: number, top: number, width: number, height: number, extra: React.CSSProperties = {}): React.CSSProperties =>
  ({...glass, left, top, width, height, boxSizing: 'border-box', ...extra});
const Strike: React.FC<{k: number; color?: string}> = ({k, color = C.bad}) =>
  <div style={{position: 'absolute', left: -8, right: -8, top: '52%', height: 6, borderRadius: 3, background: color, transform: `scaleX(${clamp(k)})`, transformOrigin: 'left'}} />;

/* 2 · The slow-month spiral: phone stops, schedule opens, stress, lower prices, unwanted jobs, worry. */
export const M12Spiral: React.FC<VisualProps> = (p) => {
  const [phone, schedule, stress, lowering, taking, worrying] = cues(p, [65, 107, 145, 191, 240, 283]);
  const rows = [['Phone stops ringing', phone, '↓'], ['Schedule opens up', schedule, '○'], ['Stress kicks in', stress, '!'], ['You start lowering prices', lowering, '↓'], ['Taking jobs you don\'t want', taking, '✕'], ['Worrying how to keep going', worrying, '…']] as const;
  const ring = 1 - smooth(lin(p, phone, 20));
  const n = rows.filter(([, at]) => p.frame > at - 6).length;
  return <Top p={p} tint={['#DC2626', '#4F46E5', '#EA580C']}>
    <Rise p={p} at={0} style={{left: 80, top: 20}}><div style={label}>The slow-month spiral</div></Rise>
    <Rise p={p} at={4} style={card(80, 80, 340, 760, {borderRadius: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 120})}>
      <div style={{position: 'absolute', top: 24, width: 100, height: 26, borderRadius: 13, background: 'rgba(0,0,0,.5)'}} />
      <div style={{position: 'relative', width: 150, height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        {[0, 1, 2].map(i => { const t = ((p.frame / 30 + i / 3) % 1); return <div key={i} style={{position: 'absolute', width: 150 * (0.6 + t), height: 150 * (0.6 + t), borderRadius: '50%', border: `3px solid rgba(52,211,153,${(1 - t) * .7 * ring})`}} />; })}
        <svg width="80" height="80" viewBox="0 0 34 34"><path d="M9 4L14 4L16 11L12 14Q15 21 20 22L23 18L30 20L30 25Q22 31 13 22Q4 13 9 4Z" fill={ring > .5 ? C.good : 'rgba(255,255,255,.35)'} /></svg>
      </div>
      <div style={{...label, marginTop: 60}}>New calls today</div>
      <div style={{fontSize: 140, fontWeight: 850, letterSpacing: -4, color: ring > .5 ? C.ink : C.bad, marginTop: 10}}>{ring > .5 ? '·' : '0'}</div>
      <div style={{fontSize: 26, color: C.mute, fontWeight: 600, opacity: 1 - ring}}>quiet…</div>
    </Rise>
    <div style={{position: 'absolute', left: 498, top: 140, width: 4, height: Math.max(0, n - 1) * 125, borderRadius: 2, background: 'linear-gradient(#FBBF24,#E11D48)'}} />
    {rows.map(([t, at, icon], i) => <Rise key={t} p={p} at={at - 6} style={card(460, 80 + i * 125, 540, 105, {borderRadius: 28, display: 'flex', alignItems: 'center', gap: 20, padding: '0 24px'})}>
      <div style={{width: 64, height: 64, borderRadius: 20, flex: 'none', background: `rgba(251,113,133,${.12 + i * .05})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, fontWeight: 900, color: C.bad}}>{icon}</div>
      <div style={{fontSize: 31, fontWeight: 750, lineHeight: 1.15}}>{t}</div>
    </Rise>)}
  </Top>;
};

/* 4 · Instead of panicking, diagnose: enough leads? reaching out but not booking? online presence working? */
export const M12Diagnose: React.FC<VisualProps> = (p) => {
  const [panicking, useTime, figure, leads, booking, presence] = cues(p, [17, 31, 71, 155, 219, 265]);
  const run = figure + 8, scanning = p.frame >= run;
  const checks = [['Getting enough leads?', leads], ['Reaching out, but not booking?', booking], ['Is your online presence bringing business?', presence]] as const;
  const sweep = scanning ? ((p.frame - run) % 40) / 40 : 0;
  return <Top p={p} tint={['#0891B2', '#4F46E5', '#059669']}>
    <div style={{position: 'absolute', left: 80, top: 20, fontSize: 64, fontWeight: 800, letterSpacing: -2, opacity: clamp(sp(p, panicking - 10) * 1.4) * (1 - lin(p, figure - 6, 8))}}>
      <span style={{position: 'relative', display: 'inline-block', color: C.bad}}>Don't panic.<Strike k={lin(p, panicking + 8, 10)} color="#FFFFFF" /></span></div>
    <div style={{opacity: lin(p, figure - 6, 8)}}><Kinetic p={p} at={figure - 6} text="Find what's actually wrong" size={64} top={20} grad="linear-gradient(90deg,#FFFFFF,#67E8F9)" /></div>
    <Rise p={p} at={useTime - 6} style={card(80, 130, 920, 720, {padding: '36px 44px'})}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div style={label}>Business diagnostic</div>
        <div style={{padding: '16px 30px', borderRadius: 30, fontSize: 28, fontWeight: 800, background: scanning ? 'linear-gradient(90deg,#22D3EE,#818CF8)' : 'rgba(255,255,255,.12)', color: scanning ? '#06101A' : C.ink, transform: `scale(${p.frame >= run && p.frame < run + 5 ? .95 : 1})`}}>{scanning ? 'Scanning…' : 'Run diagnosis'}</div>
      </div>
      {scanning && <div style={{position: 'absolute', left: 0, right: 0, top: 120 + 560 * sweep, height: 3, background: 'linear-gradient(90deg,transparent,#22D3EE,transparent)', boxShadow: '0 0 30px #22D3EE', opacity: .7}} />}
      {checks.map(([t, at], i) => {
        const k = sp(p, at - 8), found = p.frame > at + 14;
        return <div key={t} style={{display: 'flex', alignItems: 'center', gap: 26, marginTop: i ? 26 : 50, padding: '30px 30px', borderRadius: 28, background: 'rgba(255,255,255,.06)', border: `1.5px solid ${found ? 'rgba(251,191,36,.55)' : 'rgba(255,255,255,.1)'}`, opacity: clamp(k * 1.4), transform: `translateY(${(1 - k) * 30}px)`}}>
          <div style={{width: 70, height: 70, borderRadius: 35, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, fontWeight: 900, color: '#1A1300', background: found ? C.warn : 'transparent', border: found ? 'none' : '5px solid rgba(255,255,255,.2)', borderTopColor: found ? undefined : C.b, transform: found ? 'none' : `rotate(${p.frame * 14}deg)`}}>{found ? '?' : ''}</div>
          <div style={{fontSize: 36, fontWeight: 750, lineHeight: 1.2}}>{t}</div>
        </div>;
      })}
    </Rise>
    <Cursor p={p} path={[[figure - 20, 700, 880], [run - 4, 860, 190], [run + 20, 870, 200], [run + 36, 1000, 880]]} clicks={[run]} />
  </Top>;
};

/* 5 · Use the time to fix it: website, Google profile, old customers, a system that keeps leads coming. */
export const M12FixList: React.FC<VisualProps> = (p) => {
  const [fix, website, google, follow, system, leadsAt, referrals] = cues(p, [54, 139, 172, 213, 294, 322, 388]);
  const tasks = [['Work on your website', website], ['Get your Google profile in order', google], ['Follow up with old customers', follow], ['Build a lead system', system]] as const;
  const flow = p.frame - leadsAt;
  return <Top p={p} tint={['#059669', '#4F46E5', '#0EA5E9']}>
    <Kinetic p={p} at={fix - 10} text="Now fix what's holding you back" size={60} top={20} />
    <Rise p={p} at={fix} style={card(80, 130, 580, 720, {padding: '36px 36px'})}>
      <div style={label}>This month's to-do</div>
      {tasks.map(([t, at], i) => {
        const k = sp(p, at - 8), done = lin(p, at + 10, 10);
        return <div key={t} style={{display: 'flex', alignItems: 'center', gap: 22, marginTop: i ? 22 : 34, padding: '26px 24px', borderRadius: 26, background: done > .5 ? 'rgba(52,211,153,.1)' : 'rgba(255,255,255,.06)', border: `1.5px solid ${done > .5 ? 'rgba(52,211,153,.45)' : 'rgba(255,255,255,.1)'}`, opacity: clamp(k * 1.4), transform: `translateX(${(1 - k) * 30}px)`}}>
          <div style={{width: 54, height: 54, borderRadius: 16, flex: 'none', background: done > .5 ? 'linear-gradient(140deg,#34D399,#22D3EE)' : 'transparent', border: done > .5 ? 'none' : '3px solid rgba(255,255,255,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Check k={done} size={36} /></div>
          <div style={{fontSize: 32, fontWeight: 750, lineHeight: 1.15}}>{t}</div>
        </div>;
      })}
    </Rise>
    <Rise p={p} at={system - 6} style={card(690, 130, 310, 720, {padding: '36px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center'})}>
      <div style={label}>Lead flow</div>
      <div style={{position: 'relative', width: 120, height: 400, marginTop: 30, borderRadius: 60, background: 'rgba(255,255,255,.05)', overflow: 'hidden'}}>
        {flow > 0 && Array.from({length: 8}, (_, i) => { const y = ((flow * 4 + i * 55) % 440) - 40; return <div key={i} style={{position: 'absolute', left: 35 + (i % 2) * 20, top: y, width: 30, height: 30, borderRadius: 15, background: 'linear-gradient(140deg,#34D399,#22D3EE)', boxShadow: '0 0 20px rgba(52,211,153,.7)'}} />; })}
      </div>
      <div style={{fontSize: 28, fontWeight: 800, marginTop: 24, opacity: lin(p, leadsAt, 10), color: '#6EE7B7', textAlign: 'center'}}>keeps coming in</div>
      <div style={{position: 'relative', marginTop: 30, fontSize: 24, fontWeight: 700, color: C.mute, opacity: lin(p, referrals - 10, 10), textAlign: 'center'}}>waiting on referrals<Strike k={lin(p, referrals, 10)} /></div>
    </Rise>
  </Top>;
};

/* 6 · And take care of yourself; spend time with your family. */
export const M12Family: React.FC<VisualProps> = (p) => {
  const [forget, yourself, family] = cues(p, [30, 65, 110]);
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const block = (day: number, at: number, text: string, grad: string) => {
    const k = sp(p, at, 13);
    return <div style={{position: 'absolute', left: 30 + day * 122, top: 120 + 330 * (1 - clamp(k)) * 0 + 40, width: 108, height: 300, borderRadius: 22, background: grad, opacity: clamp(k * 1.4), transform: `translateY(${(1 - k) * -60}px) scale(${.9 + .1 * k})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 50px rgba(0,0,0,.4)'}}>
      <div style={{writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: 34, fontWeight: 850, color: '#140816'}}>{text}</div></div>;
  };
  return <Top p={p} tint={['#DB2777', '#7C3AED', '#F59E0B']}>
    <Kinetic p={p} at={forget - 10} text="And don't forget…" size={68} top={20} />
    <Rise p={p} at={forget - 4} style={card(80, 140, 920, 520, {padding: 0})}>
      <div style={{display: 'flex', padding: '30px 30px 0'}}>{days.map(d => <div key={d} style={{width: 122, fontSize: 24, fontWeight: 700, color: C.mute, letterSpacing: 2}}>{d.toUpperCase()}</div>)}</div>
      {days.slice(0, 5).map((d, i) => <div key={d} style={{position: 'absolute', left: 30 + i * 122, top: 160, width: 108, height: 300, borderRadius: 22, background: 'rgba(255,255,255,.08)', border: '1.5px solid rgba(255,255,255,.1)'}}>
        {[0, 1, 2].map(j => <div key={j} style={{margin: '18px 14px 0', height: 70, borderRadius: 14, background: 'rgba(129,140,248,.22)'}} />)}</div>)}
      {block(5, yourself, 'You time', 'linear-gradient(160deg,#6EE7B7,#22D3EE)')}
      {block(6, family, 'Family ♥', 'linear-gradient(160deg,#F9A8D4,#FB7185)')}
    </Rise>
    <Rise p={p} at={family + 6} style={{left: 0, right: 0, top: 720, display: 'flex', justifyContent: 'center', gap: 20}}><Pill color={C.good}>Take care of yourself</Pill><Pill color="#F9A8D4">Time with family</Pill></Rise>
  </Top>;
};

/* 7 · Don't accept slow months as normal: figure out why and be prepared for every season. */
export const M12Seasons: React.FC<VisualProps> = (p) => {
  const [accept, normal, figure, why, build, prepared] = cues(p, [43, 77, 108, 121, 163, 207]);
  const level = smooth(lin(p, prepared - 10, 26));
  const seasons = [['Spring', .75, '#6EE7B7'], ['Summer', .95, '#FBBF24'], ['Fall', .6, '#FB923C'], ['Winter', .25, '#67E8F9']] as const;
  return <Top p={p} tint={['#0EA5E9', '#7C3AED', '#059669']}>
    <Rise p={p} at={accept - 8} style={{left: 80, top: 20}}>
      <div style={{position: 'relative', display: 'inline-block', fontSize: 52, fontWeight: 800, color: 'rgba(255,255,255,.8)'}}>"Slow months are just normal"<Strike k={lin(p, normal, 10)} /></div>
    </Rise>
    <Rise p={p} at={figure - 4} style={{left: 80, top: 110, display: 'flex', gap: 18}}><Pill color={C.b}>Figure out why</Pill>{p.frame > build - 6 && <Pill color={C.good}>Build for it</Pill>}</Rise>
    <Rise p={p} at={why} style={card(80, 230, 920, 560, {padding: '36px 44px'})}>
      <div style={{display: 'flex', justifyContent: 'space-between', ...label}}><span>Your year</span><span style={{color: '#6EE7B7', opacity: level}}>prepared</span></div>
      <div style={{display: 'flex', gap: 26, alignItems: 'flex-end', height: 360, marginTop: 30}}>
        {seasons.map(([s, h, c], i) => { const k = sp(p, why + i * 5); const v = h + (.9 - h) * level; return <div key={s} style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16}}>
          <div style={{width: '100%', height: 300 * v * clamp(k), borderRadius: 22, background: `linear-gradient(180deg, ${c}, rgba(255,255,255,.06))`, boxShadow: level > .5 ? `0 0 40px ${c}66` : 'none'}} />
          <div style={{fontSize: 28, fontWeight: 750}}>{s}</div></div>; })}
      </div>
    </Rise>
    <Rise p={p} at={prepared} style={{left: 0, right: 0, top: 820, display: 'flex', justifyContent: 'center'}}><Pill color={C.good} solid>Ready for every season</Pill></Rise>
  </Top>;
};
