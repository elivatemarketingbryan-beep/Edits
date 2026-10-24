import React from 'react';
import {clamp} from '../../motion';
import type {VisualProps} from '../../types';
import {C, cues, sp, lin, smooth, glass, label, Stage, Rise, Kinetic, Bar, Check, Avatar, Pill, Cursor} from './kit';

// Sleek split-screen scenes for "big jobs don't go to the cheapest bid" (video9).
// Design canvas is 1080x900 above the presenter. Only the speaker's figures appear.
const Top: React.FC<{p: VisualProps; tint?: [string, string, string]; children: React.ReactNode}> = ({p, tint, children}) =>
  <Stage p={p} ch={900} top={30} tint={tint}>{children}</Stage>;
const card = (left: number, top: number, width: number, height: number, extra: React.CSSProperties = {}): React.CSSProperties =>
  ({...glass, left, top, width, height, boxSizing: 'border-box', ...extra});

/* Toggle switch that flips on at `at`. */
const Toggle: React.FC<{p: VisualProps; at: number}> = ({p, at}) => {
  const k = sp(p, at, 18);
  return <div style={{width: 96, height: 56, borderRadius: 28, background: k > .5 ? 'linear-gradient(90deg,#34D399,#22D3EE)' : 'rgba(255,255,255,.14)', position: 'relative', flex: 'none'}}>
    <div style={{position: 'absolute', top: 6, left: 6 + 40 * clamp(k), width: 44, height: 44, borderRadius: 22, background: '#FFF', boxShadow: '0 4px 12px rgba(0,0,0,.35)'}} />
  </div>;
};

/* 2 · Six-month to one-year projects; the worry isn't the price. */
export const M9Long: React.FC<VisualProps> = (p) => {
  const [projects, six, year, worried, notPrice] = cues(p, [15, 51, 82, 175, 222]);
  const g = .5 * smooth(lin(p, projects, six - projects + 6)) + .5 * smooth(lin(p, six + 6, year - six));
  const strike = smooth(lin(p, notPrice + 4, 10));
  return <Top p={p} tint={['#EA580C', '#4F46E5', '#7C3AED']}>
    <Kinetic p={p} at={0} text="The big projects" size={72} top={20} />
    <Rise p={p} at={projects - 6} style={card(80, 140, 920, 230, {padding: '40px 48px'})}>
      <div style={label}>Project length</div><div style={{height: 34}} />
      <Bar v={g} h={26} color="linear-gradient(90deg,#FB923C,#F472B6)" />
      <div style={{position: 'relative', height: 50, marginTop: 14, fontSize: 30, fontWeight: 750}}>
        <span style={{position: 'absolute', left: 0}}>Start</span>
        <span style={{position: 'absolute', left: '50%', transform: 'translateX(-50%)', opacity: lin(p, six - 2, 8)}}>6 months</span>
        <span style={{position: 'absolute', right: 0, opacity: lin(p, year - 2, 8)}}>1 year</span>
      </div>
    </Rise>
    <Rise p={p} at={worried - 6} style={card(80, 420, 920, 150, {display: 'flex', alignItems: 'center', gap: 28, padding: '0 40px', borderRadius: 34})}>
      <Avatar c="#F59E0B" s={80} />
      <div><div style={{fontSize: 24, color: C.mute, fontWeight: 600}}>Homeowner · thinking</div><div style={{fontSize: 40, fontWeight: 800}}>What are they really worried about?</div></div>
    </Rise>
    <Rise p={p} at={notPrice - 6} style={{left: 80, top: 640, display: 'flex', alignItems: 'center', gap: 26}}>
      <div style={{position: 'relative', fontSize: 56, fontWeight: 800, color: 'rgba(255,255,255,.55)', padding: '10px 34px', borderRadius: 24, border: '1.5px solid rgba(255,255,255,.2)'}}>
        $ Price<div style={{position: 'absolute', left: 16, right: 16, top: '52%', height: 6, borderRadius: 3, background: C.bad, transform: `scaleX(${strike})`, transformOrigin: 'left'}} /></div>
      <div style={{fontSize: 40, fontWeight: 800, color: C.bad, opacity: strike}}>not the price</div>
    </Rise>
  </Top>;
};

/* 3 · The cost jumps halfway through: a $40–50K bill they weren't expecting. */
export const M9Bill: React.FC<VisualProps> = (p) => {
  const [cost, up, halfway, forty, bill, expecting] = cues(p, [15, 34, 42, 120, 164, 197]);
  const W = 820, H = 300, half = W / 2;
  const d1 = smooth(lin(p, cost, halfway - cost + 6)), jump = smooth(lin(p, up + 4, 16)), d2 = smooth(lin(p, up + 14, 30));
  const yBase = H - 40, yHigh = 70;
  return <Top p={p} tint={['#DC2626', '#4F46E5', '#F59E0B']}>
    <Kinetic p={p} at={0} text="The cost goes up halfway" size={66} top={20} />
    <Rise p={p} at={cost - 10} style={card(80, 130, 920, 420, {padding: '36px 50px'})}>
      <div style={{display: 'flex', justifyContent: 'space-between', ...label}}><span>Project cost</span><span style={{color: '#93C5FD'}}>— — expected</span></div>
      <svg width={W} height={H} style={{marginTop: 20, overflow: 'visible'}}>
        <defs><linearGradient id="m9fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FB7185" stopOpacity=".45" /><stop offset="1" stopColor="#FB7185" stopOpacity="0" /></linearGradient></defs>
        <path d={`M0 ${yBase}H${W}`} stroke="#93C5FD" strokeWidth="4" strokeDasharray="12 10" opacity={lin(p, cost, 10)} />
        <path d={`M${half} 10V${H}`} stroke="rgba(255,255,255,.3)" strokeWidth="2" strokeDasharray="6 8" opacity={lin(p, halfway - 4, 10)} />
        <text x={half} y={4} textAnchor="middle" fill={C.mute} fontSize="22" fontWeight="700" letterSpacing="3" opacity={lin(p, halfway - 4, 10)}>HALFWAY</text>
        {jump > 0 && <path d={`M${half} ${yBase}V${yBase - (yBase - yHigh) * jump}H${half + half * d2}V${yBase}Z`} fill="url(#m9fill)" />}
        <path d={`M0 ${yBase}H${half * d1}`} stroke="#FFF" strokeWidth="8" strokeLinecap="round" />
        {jump > 0 && <path d={`M${half} ${yBase}V${yBase - (yBase - yHigh) * jump}H${half + half * d2}`} stroke={C.bad} strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{filter: 'drop-shadow(0 0 12px rgba(251,113,133,.8))'}} />}
      </svg>
    </Rise>
    <Rise p={p} at={forty - 8} style={card(80, 600, 920, 170, {display: 'flex', alignItems: 'center', gap: 30, padding: '0 44px', borderRadius: 34, border: `2px solid ${C.bad}88`})}>
      <div style={{width: 84, height: 84, borderRadius: 24, background: 'rgba(251,113,133,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 46, fontWeight: 900, color: C.bad}}>!</div>
      <div style={{flex: 1}}><div style={{fontSize: 24, color: C.mute, fontWeight: 600}}>Extra bill · halfway through</div><div style={{fontSize: 62, fontWeight: 850, color: C.bad, letterSpacing: -1.5}}>+$40–50K</div></div>
      <div style={{opacity: lin(p, expecting - 4, 8), transform: `scale(${.8 + .2 * sp(p, expecting - 4)})`}}><Pill color={C.bad} solid>Unexpected</Pill></div>
    </Rise>
    <div style={{position: 'absolute', left: 84, top: 800, fontSize: 30, color: C.mute, fontWeight: 600, opacity: lin(p, bill - 4, 10)}}>a bill they never planned for</div>
  </Top>;
};

/* 4 · They aren't just paying for the work: trust with their money, no financial nightmare. */
export const M9Paying: React.FC<VisualProps> = (p) => {
  const [hires, work, trust, money, nightmare] = cues(p, [41, 146, 196, 221, 293]);
  const rows = [['The work', work], ['Trust with their money', money], ['No financial nightmare', nightmare]] as const;
  return <Top p={p} tint={['#059669', '#4F46E5', '#0891B2']}>
    <Kinetic p={p} at={hires - 30} text="A year-long project." size={60} top={20} weight={700} />
    <Kinetic p={p} at={hires} text="They're paying for…" size={72} top={100} grad="linear-gradient(90deg,#FFFFFF,#6EE7B7)" />
    <Rise p={p} at={work - 14} style={card(80, 240, 920, 600, {padding: '30px 48px'})}>
      {rows.map(([t, at], i) => <div key={t} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '40px 0', borderTop: i ? '1.5px solid rgba(255,255,255,.1)' : 'none', opacity: clamp(sp(p, at - 10) * 1.4)}}>
        <div style={{fontSize: 46, fontWeight: 800, color: i === 1 && p.frame > trust - 4 ? '#6EE7B7' : C.ink}}>{t}</div><Toggle p={p} at={at} />
      </div>)}
    </Rise>
  </Top>;
};

/* 5 · A guaranteed maximum price caps the cost and protects the homeowner. */
export const M9Ceiling: React.FC<VisualProps> = (p) => {
  const [guaranteed, price, difference, protect, unexpected] = cues(p, [39, 72, 115, 264, 293]);
  const W = 820, H = 420, ceil = 110;
  const climb = smooth(lin(p, difference - 10, unexpected - difference + 30));
  const raw = (t: number) => H - 30 - 340 * t - 50 * Math.sin(t * 13) * t;
  const pts: string[] = [];
  for (let i = 0; i <= 90 * climb; i++) { const t = i / 90; pts.push(`${W * t},${Math.max(ceil + 8, raw(t))}`); }
  const line = smooth(lin(p, guaranteed - 4, price - guaranteed + 8));
  return <Top p={p} tint={['#CA8A04', '#1D4ED8', '#7C3AED']}>
    <Kinetic p={p} at={guaranteed - 30} text="Guaranteed Maximum Price" size={64} top={20} grad="linear-gradient(90deg,#FDE68A,#FBBF24)" />
    <Rise p={p} at={guaranteed - 16} style={card(80, 130, 920, 560, {padding: '40px 50px'})}>
      <div style={label}>Cost over the project</div>
      <svg width={W} height={H} style={{marginTop: 30, overflow: 'visible'}}>
        <rect x="0" y="0" width={W * line} height={ceil} fill="rgba(251,191,36,.08)" />
        <path d={`M0 ${ceil}H${W * line}`} stroke="#FBBF24" strokeWidth="6" style={{filter: 'drop-shadow(0 0 14px rgba(251,191,36,.9))'}} />
        <text x="0" y={ceil - 18} fill="#FDE68A" fontSize="26" fontWeight="800" letterSpacing="3" opacity={lin(p, price - 4, 10)}>THE MOST THEY'LL PAY</text>
        {pts.length > 1 && <polyline points={pts.join(' ')} fill="none" stroke="#67E8F9" strokeWidth="7" strokeLinejoin="round" strokeLinecap="round" />}
      </svg>
    </Rise>
    <Rise p={p} at={protect - 6} style={{left: 790, top: 360, width: 170, height: 190, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <svg width="150" height="170" viewBox="-80 -95 160 195"><path d="M0-90L74-62V0Q74 60 0 96Q-74 60-74 0V-62Z" fill="rgba(52,211,153,.2)" stroke={C.good} strokeWidth="5" />
        <path d="M-28 4l20 20l38-44" stroke={C.good} strokeWidth="10" fill="none" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - lin(p, protect + 4, 10)} /></svg>
    </Rise>
    <Rise p={p} at={unexpected - 6} style={{left: 0, right: 0, top: 740, display: 'flex', justifyContent: 'center'}}><Pill color={C.good}>Protected from unexpected costs</Pill></Rise>
  </Top>;
};

/* 6 · "Trust me, probably around that" vs "here's the maximum, in writing". */
export const M9Quotes: React.FC<VisualProps> = (p) => {
  const [one, trustMe, around, another, maximum, writing, whoTrust, savings] = cues(p, [5, 60, 113, 158, 192, 231, 270, 395]);
  const sign = smooth(lin(p, writing - 6, 22)), pick = smooth(lin(p, whoTrust, 16));
  const typed = (s: string, at: number) => s.slice(0, Math.floor(clamp((p.frame - at) / 22) * s.length));
  const shimmer = 30 * Math.sin(p.frame / 5);
  return <Top p={p} tint={['#F59E0B', '#4F46E5', '#059669']}>
    <div style={{opacity: 1 - pick}}><Kinetic p={p} at={0} text="Two contractors" size={66} top={20} /></div>
    <div style={{opacity: pick}}><Kinetic p={p} at={whoTrust} text="Who would you trust?" size={66} top={20} grad="linear-gradient(90deg,#FFFFFF,#6EE7B7)" /></div>
    <Rise p={p} at={one} style={card(70, 130, 455, 600, {padding: '36px 34px', opacity: 1 - .5 * pick})}>
      <div style={label}>Contractor A</div>
      <div style={{marginTop: 26, padding: '26px 28px', borderRadius: '28px 28px 28px 6px', background: 'rgba(255,255,255,.1)', fontSize: 34, fontWeight: 650, lineHeight: 1.3, minHeight: 190}}>
        {typed('"Trust me… it\'ll probably cost around that much."', trustMe - 4)}</div>
      <div style={{marginTop: 50, ...label, opacity: lin(p, around, 10)}}>Final cost</div>
      <div style={{position: 'relative', height: 22, borderRadius: 11, background: C.faint, marginTop: 18, opacity: lin(p, around, 10)}}>
        <div style={{position: 'absolute', left: 110 + shimmer, width: 160 - shimmer, top: 0, bottom: 0, borderRadius: 11, background: 'linear-gradient(90deg,transparent,#FBBF24,transparent)'}} /></div>
      <div style={{fontSize: 60, fontWeight: 850, color: C.warn, marginTop: 20, opacity: lin(p, around + 6, 10)}}>???</div>
    </Rise>
    <Rise p={p} at={another - 4} style={card(555, 130, 455, 600, {padding: '36px 34px', border: pick > .5 ? `2.5px solid ${C.good}` : glass.border, boxShadow: pick > .5 ? `0 0 80px ${C.good}55, ${glass.boxShadow}` : glass.boxShadow, transform: `scale(${1 + .03 * pick})`})}>
      <div style={{...label, color: '#6EE7B7'}}>Contractor B · Contract</div>
      <Rise p={p} at={maximum - 4} style={{left: 34, right: 34, top: 90, padding: '26px 28px', borderRadius: 24, background: 'rgba(52,211,153,.1)', border: '1.5px solid rgba(52,211,153,.35)'}}>
        <div style={{...label, color: '#6EE7B7'}}>Maximum price</div><div style={{fontSize: 52, fontWeight: 850, marginTop: 10, letterSpacing: 4}}>$ ___,___</div>
      </Rise>
      <div style={{position: 'absolute', left: 34, top: 330, ...label}}>Signed, in writing</div>
      <svg width="380" height="120" viewBox="0 0 380 120" style={{position: 'absolute', left: 34, top: 360}}>
        <path d="M10 80C40 20 60 110 95 55S150 95 185 45S250 95 290 60S340 70 365 50" stroke="#A5B4FC" strokeWidth="5" fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - sign} />
        <path d="M0 108H380" stroke="rgba(255,255,255,.2)" strokeWidth="2" /></svg>
      <div style={{position: 'absolute', left: 34, top: 500, opacity: lin(p, writing + 16, 8)}}><Pill color={C.good} solid>✓ In writing</Pill></div>
    </Rise>
    <Rise p={p} at={savings - 8} style={{left: 0, right: 0, top: 780, display: 'flex', justifyContent: 'center'}}><Pill color={C.warn}>A year-long project · their life savings</Pill></Rise>
  </Top>;
};

/* 8 · Account for risk upfront instead of paying surprises out of your own pocket. */
export const M9Risk: React.FC<VisualProps> = (p) => {
  const [accounting, risk, upfront, instead, unexpected, pocket] = cues(p, [11, 37, 47, 63, 102, 138]);
  const seg = (w: number, color: string, text: string, k: number, ink = '#06120C') =>
    <div style={{width: `${w * 100 * clamp(k)}%`, height: '100%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontWeight: 800, color: ink, overflow: 'hidden', whiteSpace: 'nowrap'}}>{k > .6 ? text : ''}</div>;
  const hit = smooth(lin(p, unexpected - 4, 18)), spill = smooth(lin(p, pocket - 8, 16));
  return <Top p={p} tint={['#059669', '#DC2626', '#4F46E5']}>
    <Kinetic p={p} at={0} text="Price the risk upfront" size={70} top={20} />
    <Rise p={p} at={accounting - 6} style={card(80, 140, 920, 300, {padding: '36px 44px'})}>
      <div style={{display: 'flex', justifyContent: 'space-between', ...label}}><span style={{color: '#6EE7B7'}}>With a risk buffer</span><span style={{color: '#6EE7B7', opacity: hit}}>surprise absorbed ✓</span></div>
      <div style={{display: 'flex', height: 110, borderRadius: 22, overflow: 'hidden', marginTop: 34, background: C.faint}}>
        {seg(.55, 'rgba(255,255,255,.85)', 'Cost', sp(p, accounting - 2))}{seg(.2, 'linear-gradient(90deg,#FDE68A,#FBBF24)', 'Risk', sp(p, risk - 2))}{seg(.25, C.good, 'Profit', sp(p, upfront - 2))}
      </div>
    </Rise>
    <Rise p={p} at={instead - 6} style={card(80, 480, 920, 300, {padding: '36px 44px'})}>
      <div style={{display: 'flex', justifyContent: 'space-between', ...label}}><span style={{color: '#FDA4AF'}}>Without one</span><span style={{color: C.bad, opacity: spill}}>out of your pocket</span></div>
      <div style={{position: 'relative', display: 'flex', height: 110, borderRadius: 22, overflow: 'visible', marginTop: 34, background: C.faint}}>
        {seg(.55, 'rgba(255,255,255,.85)', 'Cost', sp(p, instead))}{seg(.25 * (1 - hit), C.good, 'Profit', sp(p, instead + 4))}
        {hit > 0 && <div style={{height: '100%', width: `${(25 + 30 * spill) * hit}%`, background: 'linear-gradient(90deg,#FB7185,#E11D48)', borderRadius: '0 22px 22px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, boxShadow: '0 0 40px rgba(225,29,72,.6)', whiteSpace: 'nowrap', overflow: 'hidden'}}>Unexpected</div>}
      </div>
    </Rise>
  </Top>;
};

/* 9 · Marketing too: more than promises — a clear plan, a process, proof. */
export const M9Promises: React.FC<VisualProps> = (p) => {
  const [same, marketing, promises, plan, process, backup] = cues(p, [15, 56, 182, 227, 257, 334]);
  const strike = smooth(lin(p, promises + 6, 12));
  const rows = [['A clear plan', plan], ['A process they can trust', process], ['Proof to back it up', backup]] as const;
  return <Top p={p} tint={['#7C3AED', '#DB2777', '#4F46E5']}>
    <Kinetic p={p} at={same - 8} text="Same idea in marketing" size={66} top={20} />
    <Rise p={p} at={marketing - 4} style={{left: 80, top: 130, padding: '30px 40px', borderRadius: '34px 34px 34px 8px', background: 'rgba(255,255,255,.1)', border: '1.5px solid rgba(255,255,255,.16)', opacity: 1 - .55 * strike}}>
      <div style={{position: 'relative', fontSize: 44, fontWeight: 700}}>"Trust us, we promise…"
        <div style={{position: 'absolute', left: -6, right: -6, top: '52%', height: 6, borderRadius: 3, background: C.bad, transform: `scaleX(${strike})`, transformOrigin: 'left'}} /></div>
    </Rise>
    <div style={{position: 'absolute', left: 780, top: 165, fontSize: 34, fontWeight: 800, color: C.bad, opacity: strike}}>not enough</div>
    {rows.map(([t, at], i) => <Rise key={t} p={p} at={at - 6} style={card(80, 300 + i * 175, 920, 145, {display: 'flex', alignItems: 'center', gap: 34, padding: '0 44px', borderRadius: 34})}>
      <div style={{width: 76, height: 76, borderRadius: 38, background: 'linear-gradient(140deg,#A78BFA,#F472B6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none'}}><Check k={lin(p, at + 2, 10)} size={46} /></div>
      <div style={{fontSize: 46, fontWeight: 800}}>{t}</div>
    </Rise>)}
  </Top>;
};

/* 10 · The biggest jobs don't go to the cheapest; they go to the one they trust. */
export const M9Wins: React.FC<VisualProps> = (p) => {
  const [biggest, always, cheapest, actually, contractor] = cues(p, [33, 84, 116, 168, 200]);
  const bids = [['$', 'Cheapest bid'], ['$$', 'Mid bid'], ['$$$', 'Max price, in writing']] as const;
  const dim = smooth(lin(p, always, 14)), award = actually + 14, won = p.frame >= award;
  const lift = sp(p, award, 14);
  return <Top p={p} tint={['#CA8A04', '#4F46E5', '#059669']}>
    <Kinetic p={p} at={biggest - 12} text="Who gets the big job?" size={70} top={20} />
    {bids.map(([pr, t], i) => {
      const win = i === 2;
      return <Rise key={t} p={p} at={biggest + i * 5} style={card(70 + i * 320, 170, 300, 520, {padding: '34px 30px', opacity: win ? 1 : 1 - .55 * dim, transform: win ? `translateY(${-24 * lift}px)` : undefined,
        border: win && won ? `2.5px solid ${C.good}` : glass.border, boxShadow: win && won ? `0 0 90px ${C.good}55, ${glass.boxShadow}` : glass.boxShadow})}>
        {i === 0 && <div style={{opacity: lin(p, cheapest - 4, 8), position: 'absolute', right: 24, top: 24}}><Pill color={C.mute}>Lowest</Pill></div>}
        <div style={{fontSize: 92, fontWeight: 850, marginTop: 90, color: win ? C.ink : 'rgba(255,255,255,.75)'}}>{pr}</div>
        <div style={{fontSize: 30, fontWeight: 750, color: win ? '#6EE7B7' : C.mute, marginTop: 16, lineHeight: 1.25}}>{t}</div>
        {win && <div style={{position: 'absolute', left: 30, right: 30, bottom: 30, height: 80, borderRadius: 40, background: won ? 'linear-gradient(90deg,#34D399,#22D3EE)' : 'rgba(255,255,255,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 30, fontWeight: 800, color: won ? '#06120C' : C.ink}}>
          {won ? <><Check k={lin(p, award + 2, 10)} size={34} /> Awarded</> : 'Award job'}</div>}
      </Rise>;
    })}
    <Rise p={p} at={contractor} style={{left: 0, right: 0, top: 770, display: 'flex', justifyContent: 'center'}}><Pill color={C.good}>The one they feel confident in</Pill></Rise>
    <Cursor p={p} path={[[actually - 16, 500, 880], [award - 4, 860, 640], [award + 24, 870, 650], [award + 40, 1000, 880]]} clicks={[award]} />
  </Top>;
};
