import React from 'react';
import {clamp} from '../../motion';
import type {VisualProps} from '../../types';
import {C, cues, sp, lin, smooth, glass, label, Stage, Rise, Kinetic, Bar, Check, Pill} from './kit';

// Sleek split-screen scenes for "wanting to quit is a feeling" (video13). Warm tints,
// calmer motion. No figures in the source. 1080x900 design canvas.
const Top: React.FC<{p: VisualProps; tint?: [string, string, string]; children: React.ReactNode}> = ({p, tint, children}) =>
  <Stage p={p} ch={900} top={30} tint={tint}>{children}</Stage>;
const card = (left: number, top: number, width: number, height: number, extra: React.CSSProperties = {}): React.CSSProperties =>
  ({...glass, left, top, width, height, boxSizing: 'border-box', ...extra});
const Strike: React.FC<{k: number; color?: string}> = ({k, color = C.bad}) =>
  <div style={{position: 'absolute', left: -8, right: -8, top: '52%', height: 6, borderRadius: 3, background: color, transform: `scaleX(${clamp(k)})`, transformOrigin: 'left'}} />;

/* 2 · A feeling, not a decision: slow month, crew walks off, customer won't pay, all in one week. */
export const M13Week: React.FC<VisualProps> = (p) => {
  const [decision, slow, crew, pay, same, thinking] = cues(p, [16, 77, 146, 212, 247, 335]);
  const alerts = [['Slow month', 'Schedule wide open', slow, '#FBBF24'], ['Crew', 'A guy just walked off', crew, '#FB923C'], ['Invoice overdue', 'Customer won\'t pay', pay, '#FB7185']] as const;
  const bracket = smooth(lin(p, same - 4, 16));
  return <Top p={p} tint={['#B45309', '#BE123C', '#4338CA']}>
    <Rise p={p} at={0} style={{left: 80, top: 20, display: 'flex', alignItems: 'center', gap: 24}}>
      <Pill color="#FDE68A">A feeling</Pill>
      <div style={{fontSize: 44, fontWeight: 800, color: C.mute}}>≠</div>
      <div style={{position: 'relative', opacity: clamp(sp(p, decision - 4) * 1.4)}}><Pill color={C.mute}>A decision</Pill></div>
    </Rise>
    {alerts.map(([title, body, at, c], i) => <Rise key={title} p={p} at={at - 6} style={card(80, 150 + i * 175, 820, 150, {display: 'flex', alignItems: 'center', gap: 28, padding: '0 36px', borderRadius: 34, border: `1.5px solid ${c}66`})}>
      <div style={{width: 76, height: 76, borderRadius: 24, flex: 'none', background: `${c}2E`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, fontWeight: 900, color: c}}>!</div>
      <div><div style={{fontSize: 24, fontWeight: 700, color: c, letterSpacing: 2, textTransform: 'uppercase'}}>{title}</div><div style={{fontSize: 40, fontWeight: 800, marginTop: 4}}>{body}</div></div>
    </Rise>)}
    <div style={{position: 'absolute', left: 930, top: 160, width: 18, height: 470 * bracket, borderRadius: 9, border: '4px solid rgba(253,230,138,.8)', borderLeft: 'none'}} />
    <div style={{position: 'absolute', left: 80, top: 700, fontSize: 40, fontWeight: 800, opacity: lin(p, same, 12)}}>All in the <span style={{color: '#FDE68A'}}>same week.</span></div>
    <Rise p={p} at={thinking - 6} style={{left: 80, top: 790, fontSize: 32, fontWeight: 600, color: C.mute, fontStyle: 'italic'}}>…and you're sitting there thinking.</Rise>
  </Top>;
};

/* 4 · Hard seasons don't mean the wrong path; you're close to the next level, and it's testing whether you'll stay. */
export const M13Level: React.FC<VisualProps> = (p) => {
  const [hard, wrong, close, level, testing, stay] = cues(p, [46, 128, 211, 242, 276, 310]);
  const W = 820, H = 360;
  const draw = smooth(lin(p, hard - 10, close - hard + 10));
  // Climb with a dip (the hard season) just before the next-level line.
  const y = (t: number) => H - 40 - 250 * t + (t > .55 && t < .85 ? 120 * Math.sin((t - .55) / .3 * Math.PI) : 0);
  const pts = Array.from({length: Math.floor(100 * draw) + 1}, (_, i) => `${W * i / 100},${y(i / 100)}`).join(' ');
  const tip = draw > 0 ? [W * draw, y(draw)] : [0, y(0)];
  return <Top p={p} tint={['#4338CA', '#B45309', '#7C3AED']}>
    <div style={{position: 'absolute', left: 80, top: 20, fontSize: 60, fontWeight: 800, letterSpacing: -2, opacity: clamp(sp(p, wrong - 12) * 1.4)}}>
      <span style={{position: 'relative', color: 'rgba(255,255,255,.8)'}}>"Wrong path?"<Strike k={lin(p, wrong + 10, 10)} /></span></div>
    <Rise p={p} at={hard - 8} style={card(80, 130, 920, 560, {padding: '36px 50px'})}>
      <div style={{display: 'flex', justifyContent: 'space-between', ...label}}><span>Your business</span><span style={{color: '#FDE68A', opacity: lin(p, level - 4, 10)}}>next level ↑</span></div>
      <svg width={W} height={H} style={{marginTop: 40, overflow: 'visible'}}>
        <path d={`M0 ${H - 40 - 250 * .95}H${W}`} stroke="#FDE68A" strokeWidth="3" strokeDasharray="10 10" opacity={lin(p, close - 4, 12)} />
        <rect x={W * .55} y="0" width={W * .3} height={H} fill="rgba(251,113,133,.08)" opacity={lin(p, hard, 12)} />
        <text x={W * .7} y={H - 6} textAnchor="middle" fill="#FDA4AF" fontSize="24" fontWeight="700" letterSpacing="3" opacity={lin(p, hard + 4, 12)}>HARD SEASON</text>
        <polyline points={pts} fill="none" stroke="url(#m13g)" strokeWidth="8" strokeLinejoin="round" strokeLinecap="round" />
        <defs><linearGradient id="m13g"><stop offset="0" stopColor="#818CF8" /><stop offset="1" stopColor="#FDE68A" /></linearGradient></defs>
        <circle cx={tip[0]} cy={tip[1]} r="13" fill="#FFF" style={{filter: 'drop-shadow(0 0 12px #FDE68A)'}} />
      </svg>
    </Rise>
    <Rise p={p} at={testing - 4} style={{left: 0, right: 0, top: 750, display: 'flex', justifyContent: 'center', gap: 20}}>
      <Pill color="#FDE68A">It's testing you</Pill>
      <div style={{opacity: clamp(sp(p, stay - 4) * 1.4)}}><Pill color={C.good} solid>Will you stay?</Pill></div>
    </Rise>
  </Top>;
};

/* 5 · On that day don't make a big decision: answer the next lead, finish the next job, send the next follow-up. Repeat tomorrow. */
export const M13Next: React.FC<VisualProps> = (p) => {
  const [dont, decision, nextThing, lead, job, follow, tomorrow, again] = cues(p, [49, 75, 121, 186, 229, 273, 304, 332]);
  const reset = p.frame >= tomorrow + 6;
  const tasks = [['Answer the next lead', lead], ['Finish the next job', job], ['Send the next follow-up', follow]] as const;
  const dayLabel = reset ? 'Tomorrow' : 'Today';
  const flip = smooth(lin(p, tomorrow, 12));
  return <Top p={p} tint={['#059669', '#B45309', '#4338CA']}>
    <Rise p={p} at={dont - 8} style={card(80, 20, 920, 120, {display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', borderRadius: 30, opacity: 1 - .6 * lin(p, decision + 6, 10)})}>
      <div style={{position: 'relative', fontSize: 40, fontWeight: 800}}>Make a big decision<Strike k={lin(p, decision, 10)} /></div>
      <Pill color={C.bad}>Not today</Pill>
    </Rise>
    <Kinetic p={p} at={nextThing - 10} text="Just do the next right thing" size={58} top={175} grad="linear-gradient(90deg,#FFFFFF,#6EE7B7)" />
    <Rise p={p} at={nextThing} style={card(80, 280, 920, 560, {padding: '34px 40px'})}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div style={{...label, transform: `rotateX(${(flip > 0 && flip < 1 ? Math.sin(flip * Math.PI) * 80 : 0)}deg)`}}>{dayLabel}</div>
        {reset && <div style={{opacity: lin(p, again - 4, 10)}}><Pill color={C.good}>↻ Do it again</Pill></div>}
      </div>
      {tasks.map(([t, at], i) => {
        const done = reset ? lin(p, again + 4 + i * 10, 10) : lin(p, at + 8, 10);
        const k = sp(p, at - 8);
        return <div key={t} style={{display: 'flex', alignItems: 'center', gap: 24, marginTop: i ? 22 : 36, padding: '28px 28px', borderRadius: 28, background: done > .5 ? 'rgba(52,211,153,.1)' : 'rgba(255,255,255,.06)', border: `1.5px solid ${done > .5 ? 'rgba(52,211,153,.45)' : 'rgba(255,255,255,.1)'}`, opacity: clamp(k * 1.4), transform: `translateX(${(1 - k) * 30}px)`}}>
          <div style={{width: 58, height: 58, borderRadius: 18, flex: 'none', background: done > .5 ? 'linear-gradient(140deg,#34D399,#22D3EE)' : 'transparent', border: done > .5 ? 'none' : '3px solid rgba(255,255,255,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Check k={done} size={38} /></div>
          <div style={{fontSize: 38, fontWeight: 750}}>{t}</div>
        </div>;
      })}
    </Rise>
  </Top>;
};

/* 6 · Not one big moment: a lot of small days where you just didn't quit. */
export const M13Streak: React.FC<VisualProps> = (p) => {
  const [one, big, lot, small, quit] = cues(p, [24, 40, 73, 90, 137]);
  const cols = 14, rows = 5, total = cols * rows;
  const filled = Math.floor(smooth(lin(p, lot - 4, quit - lot + 20)) * total);
  return <Top p={p} tint={['#059669', '#4338CA', '#B45309']}>
    <Rise p={p} at={one - 8} style={{left: 80, top: 20}}>
      <div style={{position: 'relative', display: 'inline-block', fontSize: 52, fontWeight: 800, color: 'rgba(255,255,255,.75)'}}>One big moment<Strike k={lin(p, big + 10, 10)} /></div>
    </Rise>
    <Kinetic p={p} at={lot - 8} text="A lot of small days" size={66} top={110} grad="linear-gradient(90deg,#FFFFFF,#6EE7B7)" />
    <Rise p={p} at={small - 12} style={card(80, 240, 920, 470, {padding: '34px 40px'})}>
      <div style={{display: 'flex', justifyContent: 'space-between', ...label}}><span>Days you didn't quit</span><span style={{color: '#6EE7B7', opacity: lin(p, quit, 10)}}>keep the streak</span></div>
      <div style={{display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 10, marginTop: 34}}>
        {Array.from({length: total}, (_, i) => {
          const on = i < filled, fresh = on && i > filled - 6;
          return <div key={i} style={{height: 52, borderRadius: 12, background: on ? `rgba(52,211,153,${.45 + .55 * ((i * 37) % 10) / 10})` : 'rgba(255,255,255,.07)', boxShadow: fresh ? '0 0 22px rgba(52,211,153,.8)' : 'none', transform: `scale(${fresh ? 1.08 : 1})`}} />;
        })}
      </div>
      <div style={{marginTop: 34}}><Bar v={filled / total} h={14} color="linear-gradient(90deg,#34D399,#22D3EE)" /></div>
    </Rise>
    <Rise p={p} at={quit} style={{left: 0, right: 0, top: 770, display: 'flex', justifyContent: 'center'}}><Pill color={C.good} solid>You just didn't quit</Pill></Rise>
  </Top>;
};
