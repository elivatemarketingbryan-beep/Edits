import React from 'react';
import {Easing} from 'remotion';
import {clamp} from '../../motion';
import type {VisualProps} from '../../types';
import {Markup, Emoji, Burn} from '../pack/packKit';

// Motion-graphics layer for video25 ("booked out? still market"), presenter full screen, captions at 72%.
// Distinct effect per moment, top band (y < 470) or bottom band (y > 1480); no overlay text repeats speech.

const EO = Easing.bezier(0.23, 1, 0.32, 1), EIO = Easing.bezier(0.77, 0, 0.175, 1);
const RED = '#EF2B2D', BLUE = '#2563EB', GREEN = '#16A34A', FONT = 'Inter, "Segoe UI", Arial, sans-serif';
const k = (f: number, a: number, len = 10) => EO(clamp((f - a) / len));
const win = (f: number, a: number, b: number, len = 10) => k(f, a, len) * (1 - EIO(clamp((f - b) / 8)));
const shadow = '0 10px 30px rgba(0,0,0,.35)';
const dark = 'rgba(17,17,17,.82)';
const Pop: React.FC<{f: number; at: number; until: number; x: number; y: number; size: number; children: React.ReactNode; shake?: boolean}> = ({f, at, until, x, y, size, children, shake}) => {
  const t = clamp((f - at) / 10), s = t < 1 ? .6 + .5 * EO(t) - .1 * Math.sin(t * Math.PI) : 1;
  return <div style={{position: 'absolute', left: x - size / 2 + (shake ? 6 * Math.sin(f * 1.7) : 0), top: y - size / 2, width: size, height: size, transform: `scale(${s})`, opacity: win(f, at, until, 6), filter: 'drop-shadow(0 10px 20px rgba(0,0,0,.35))'}}>{children}</div>;
};

export const Overlay25: React.FC<VisualProps> = ({frame: f}) => {
  // booked 2–3 months: three month grids filling solid
  const fill = clamp((f - 20) / 60);
  // another side: card flips
  const flip = EIO(clamp((f - 600) / 18));
  // job takes longer: bar overruns its marker
  const over = EIO(clamp((f - 885) / 30));
  // opening in the schedule: one block vanishes, gap pulses
  const gone = EIO(clamp((f - 996) / 12));
  // pipeline flow
  const flowT = (f - 1336) / 14;
  // filter: jobs fall, only good ones pass
  const drop = (i: number) => clamp((f - 1560 - i * 8) / 26);
  return <div style={{position: 'absolute', inset: 0, fontFamily: FONT}}>
    {/* booked out for months (top band) */}
    <div style={{position: 'absolute', left: 150, top: 120, display: 'flex', gap: 24, opacity: win(f, 14, 108, 10)}}>
      {[0, 1, 2].map(m => <div key={m} style={{width: 240, padding: 16, borderRadius: 22, background: '#fff', boxShadow: shadow, transform: `translateY(${(1 - k(f, 14 + m * 5, 12)) * -30}px)`}}>
        <div style={{height: 22, borderRadius: 8, background: RED, marginBottom: 10}} />
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 6}}>{Array.from({length: 20}, (_, i) => <div key={i} style={{height: 26, borderRadius: 6, background: (m * 20 + i) / 60 < fill ? BLUE : '#E5E7EB'}} />)}</div>
      </div>)}
    </div>
    {/* booked with profitable jobs: job cards with money tags stacking (bottom band) */}
    {[0, 1, 2, 3].map(i => <div key={i} style={{position: 'absolute', left: 240 + i * 150, top: 1540 - i * 14 + (1 - k(f, 300 + i * 10, 10)) * 60, opacity: win(f, 300 + i * 10, 470, 10), transform: `rotate(${(i - 1.5) * 4}deg)`}}>
      <div style={{width: 200, height: 150, borderRadius: 18, background: '#fff', boxShadow: shadow, padding: 16, boxSizing: 'border-box'}}>
        <Emoji name="house" style={{width: 60}} />
        <div style={{position: 'absolute', right: 14, top: 14, padding: '6px 12px', borderRadius: 999, background: GREEN, color: '#fff', fontWeight: 900, fontSize: 24}}>$</div>
        <div style={{height: 12, borderRadius: 6, background: '#E5E7EB', marginTop: 12, width: '80%'}} />
      </div></div>)}
    {/* the other side of marketing: a card flips from sunny to stormy (top band) */}
    <div style={{position: 'absolute', left: 390, top: 110, width: 300, height: 300, perspective: 900, opacity: win(f, 582, 680, 10)}}>
      <div style={{position: 'absolute', inset: 0, borderRadius: 30, background: '#FEF3C7', boxShadow: shadow, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `rotateY(${flip * 180}deg)`, backfaceVisibility: 'hidden'}}><Emoji name="Sunset" style={{width: 180}} /></div>
      <div style={{position: 'absolute', inset: 0, borderRadius: 30, background: '#1F2937', boxShadow: shadow, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `rotateY(${flip * 180 - 180}deg)`, backfaceVisibility: 'hidden'}}><Emoji name="red flag" style={{width: 170}} /></div>
    </div>
    {/* customer cancels: a booked block gets the red X (bottom band) */}
    <div style={{position: 'absolute', left: 240, top: 1520, width: 600, padding: 22, borderRadius: 26, background: dark, boxShadow: shadow, opacity: win(f, 812, 870, 10)}}>
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10}}>{Array.from({length: 10}, (_, i) => <div key={i} style={{height: 60, borderRadius: 12, background: i === 6 ? (f > 840 ? 'rgba(239,43,45,.25)' : BLUE) : BLUE}} />)}</div>
    </div>
    <Markup name="x-mark-red" at={838} x={430} y={1470} w={380} dur={36} />
    {/* takes longer than expected: bar runs past the marker; hourglass */}
    <Pop f={f} at={876} until={942} x={540} y={240} size={170}><div style={{width: '100%', height: '100%', transform: `rotate(${Math.floor((f - 876) / 24) * 180}deg)`, transition: 'none'}}><Emoji name="Hourglass" style={{width: '100%'}} /></div></Pop>
    <div style={{position: 'absolute', left: 200, top: 1560, width: 680, height: 120, opacity: win(f, 880, 942, 10)}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 46, height: 28, borderRadius: 14, background: 'rgba(255,255,255,.18)'}} />
      <div style={{position: 'absolute', left: 0, top: 46, height: 28, borderRadius: 14, width: `${(55 + 35 * over)}%`, background: over > .4 ? RED : BLUE}} />
      <div style={{position: 'absolute', left: '60%', top: 10, width: 6, height: 100, borderRadius: 3, background: '#fff'}} />
    </div>
    {/* an opening in the schedule: a block vanishes and the gap pulses (bottom band) */}
    <div style={{position: 'absolute', left: 240, top: 1520, width: 600, padding: 22, borderRadius: 26, background: '#fff', boxShadow: shadow, opacity: win(f, 950, 1060, 10)}}>
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10}}>{Array.from({length: 10}, (_, i) => i === 3
        ? <div key={i} style={{height: 60, borderRadius: 12, border: `4px dashed ${RED}`, background: BLUE, opacity: 1 - gone, boxShadow: gone > .5 ? `0 0 ${16 + 10 * Math.sin(f / 4)}px rgba(239,43,45,.7)` : 'none', boxSizing: 'border-box'}} />
        : <div key={i} style={{height: 60, borderRadius: 12, background: BLUE}} />)}</div>
    </div>
    {/* only looking when you need work now: alarm shakes */}
    <Pop f={f} at={1100} until={1180} x={540} y={240} size={180} shake><Emoji name="alarm clock" style={{width: '100%'}} /></Pop>
    {/* reacting vs planning ahead: lightning crossed, compass lifts in */}
    <Pop f={f} at={1200} until={1290} x={360} y={240} size={150}><Emoji name="Lightning" style={{width: '100%'}} /></Pop>
    <Markup name="x-mark-red" at={1214} x={210} y={150} w={300} dur={76} />
    <Pop f={f} at={1258} until={1296} x={720} y={240} size={170}><Emoji name="Compass" style={{width: '100%'}} /></Pop>
    {/* pipeline of future opportunities: steady flow, gauge never at zero (bottom band) */}
    <div style={{position: 'absolute', left: 140, top: 1540, width: 800, height: 170, opacity: win(f, 1330, 1525, 12)}}>
      <div style={{position: 'absolute', left: 0, right: 140, top: 58, height: 54, borderRadius: 27, background: 'rgba(255,255,255,.2)', border: '3px solid rgba(255,255,255,.5)'}} />
      {Array.from({length: 8}, (_, i) => { const t = ((flowT + i / 8) % 1); return <div key={i} style={{position: 'absolute', left: `${t * 78}%`, top: 70, width: 30, height: 30, borderRadius: 15, background: GREEN, boxShadow: '0 0 12px rgba(22,163,74,.8)'}} />; })}
      <svg width="140" height="120" viewBox="0 0 140 120" style={{position: 'absolute', right: 0, top: 20}}><path d="M15 100A55 55 0 0 1 125 100" fill="none" stroke="rgba(255,255,255,.3)" strokeWidth="14" strokeLinecap="round" /><g transform={`rotate(${20 + 8 * Math.sin(f / 10)} 70 100)`}><path d="M70 100V48" stroke="#fff" strokeWidth="7" strokeLinecap="round" /></g><circle cx="70" cy="100" r="9" fill="#fff" /></svg>
    </div>
    {/* control over the types of jobs: a filter lets the right ones through (bottom band) */}
    <div style={{position: 'absolute', left: 290, top: 1500, width: 500, height: 360, opacity: win(f, 1550, 1660, 10)}}>
      <svg width="500" height="360" viewBox="0 0 500 360" style={{position: 'absolute'}}><path d="M40 120H460L300 250V330H200V250Z" fill="rgba(255,255,255,.18)" stroke="#fff" strokeWidth="5" /></svg>
      {[0, 1, 2, 3, 4].map(i => { const t = drop(i), good = i % 2 === 0; const y = good ? 20 + 300 * EIO(t) : 20 + 110 * EIO(Math.min(t * 1.6, 1)); return <div key={i} style={{position: 'absolute', left: good ? 230 : 70 + i * 80, top: y, width: 44, height: 44, borderRadius: 12, background: good ? GREEN : '#9CA3AF', opacity: good ? 1 : 1 - .8 * clamp((t - .6) / .4)}} />; })}
    </div>
    {/* attract projects that fit: magnet pulls three fits (icons only) (top band) */}
    <Pop f={f} at={1738} until={1930} x={220} y={250} size={170}><div style={{width: '100%', height: '100%', transform: 'rotate(-20deg)'}}><Emoji name="Magnet" style={{width: '100%'}} /></div></Pop>
    {[['Money with Wings', 1795], ['building construction', 1830], ['Compass', 1858]].map(([e, at], i) => { const t = EIO(clamp((f - (at as number)) / 18)); return <div key={e as string} style={{position: 'absolute', left: 900 - (540 - i * 120) * t, top: 190 + i * 10, width: 120, opacity: win(f, (at as number) - 4, 1930, 8)}}><Emoji name={e as string} style={{width: '100%'}} /></div>; })}
    {/* visibility + reliable pipeline + better decisions + direction */}
    <Pop f={f} at={2100} until={2190} x={380} y={240} size={150}><svg viewBox="0 0 120 80" width="100%" height="100%"><path d="M6 40Q60 -8 114 40Q60 88 6 40Z" fill="#fff" stroke="#111" strokeWidth="4" /><circle cx="60" cy="40" r="18" fill="#2563EB" /></svg></Pop>
    <Pop f={f} at={2156} until={2190} x={700} y={240} size={150}><Emoji name="Chart Increasing" style={{width: '100%'}} /></Pop>
    <svg width="560" height="300" viewBox="0 0 560 300" style={{position: 'absolute', left: 260, top: 1500, opacity: win(f, 2198, 2300, 10)}}>
      <path d="M280 290V170" stroke="#fff" strokeWidth="14" strokeLinecap="round" />
      <path d="M280 170L120 60" stroke="rgba(255,255,255,.4)" strokeWidth="14" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - EIO(clamp((f - 2205) / 16))} />
      <path d="M280 170L440 60" stroke={GREEN} strokeWidth="14" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - EIO(clamp((f - 2215) / 16))} />
      <circle cx="440" cy="60" r={14 + 4 * Math.sin(f / 5)} fill={GREEN} opacity={k(f, 2230)} />
    </svg>
    <Pop f={f} at={2290} until={2345} x={540} y={240} size={170}><Emoji name="Compass" style={{width: '100%'}} /></Pop>
    <Burn at={2300} n={1} opacity={.4} />
  </div>;
};
