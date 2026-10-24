import React from 'react';
import {clamp} from '../../motion';
import type {VisualProps} from '../../types';
import {C, cues, sp, lin, smooth, pop, glass, label, Stage, Rise, Kinetic, Check, Avatar, Pill, Cursor} from './kit';

// Faceless full-screen scenes for "how to handle a bad review" (video15).
// 1080x1500 design canvas above the captions. Ratings shown as stars only; review text is skeleton.
const card = (left: number, top: number, width: number, height: number, extra: React.CSSProperties = {}): React.CSSProperties =>
  ({...glass, left, top, width, height, boxSizing: 'border-box', ...extra});
const Stars: React.FC<{n: number; size?: number}> = ({n, size = 40}) =>
  <span style={{fontSize: size, letterSpacing: 4}}><span style={{color: '#FBBF24'}}>{'★'.repeat(n)}</span><span style={{color: 'rgba(255,255,255,.18)'}}>{'★'.repeat(5 - n)}</span></span>;
const Lines: React.FC<{w?: number[]}> = ({w = [90, 70]}) => <div>{w.map((x, i) => <div key={i} style={{width: `${x}%`, height: 16, borderRadius: 8, background: 'rgba(255,255,255,.2)', marginTop: 16}} />)}</div>;
const Review: React.FC<{n?: number; name?: string}> = ({n = 1, name = 'Homeowner'}) =>
  <div style={{display: 'flex', gap: 24}}>
    <Avatar c={n > 3 ? '#34D399' : '#FB7185'} s={78} />
    <div style={{flex: 1}}><div style={{fontSize: 30, fontWeight: 750}}>{name}</div><Stars n={n} /><Lines /></div>
  </div>;
const Steps: React.FC<{p: VisualProps; n: number}> = ({p, n}) =>
  <div style={{position: 'absolute', left: 80, top: 20, right: 80, display: 'flex', gap: 14}}>
    {[1, 2, 3, 4].map(i => { const on = i <= n, cur = i === n, k = cur ? sp(p, 0) : 1; return <div key={i} style={{flex: 1, height: 12, borderRadius: 6, background: on ? 'linear-gradient(90deg,#34D399,#22D3EE)' : 'rgba(255,255,255,.12)', transform: `scaleX(${cur ? clamp(k) : 1})`, transformOrigin: 'left'}} />; })}
  </div>;
const StepTitle: React.FC<{p: VisualProps; n: number; text: string; at?: number}> = ({p, n, text, at = 0}) => <>
  <Steps p={p} n={n} />
  <Rise p={p} at={at} style={{left: 80, top: 80}}><div style={{...label, color: '#6EE7B7'}}>Step {n}</div></Rise>
  <Kinetic p={p} at={at + 4} text={text} size={86} top={126} />
</>;

/* 1 · Ignore it or fire back: both cost you jobs. */
export const F15Hook: React.FC<VisualProps> = (p) => {
  const [ignore, fire, both, costing] = cues(p, [57, 103, 140, 164]);
  const typed = 'Are you kidding me?! That is NOT what happ'.slice(0, Math.floor(clamp((p.frame - fire) / 30) * 42));
  return <Stage p={p} tint={['#BE123C', '#4F46E5', '#B45309']}>
    <Kinetic p={p} at={0} text="A bad review lands." size={84} top={60} />
    <Rise p={p} at={6} style={card(80, 200, 920, 260, {padding: 40})}><Review n={1} /></Rise>
    <Rise p={p} at={ignore - 6} style={card(80, 520, 440, 380, {padding: 36, display: 'flex', flexDirection: 'column', gap: 20})}>
      <div style={label}>Option A</div><div style={{fontSize: 52, fontWeight: 850}}>Ignore it</div>
      <div style={{fontSize: 30, color: C.mute, fontWeight: 600}}>no reply…</div>
      <div style={{fontSize: 56, fontWeight: 800, opacity: .45, marginTop: 10, letterSpacing: 8}}>z z z</div>
    </Rise>
    <Rise p={p} at={fire - 6} style={card(560, 520, 440, 380, {padding: 36, display: 'flex', flexDirection: 'column', gap: 20, border: '1.5px solid rgba(251,113,133,.5)'})}>
      <div style={label}>Option B</div><div style={{fontSize: 52, fontWeight: 850, color: C.bad}}>Fire back</div>
      <div style={{fontSize: 30, fontWeight: 650, lineHeight: 1.3, minHeight: 120}}>{typed}<span style={{color: C.bad}}>|</span></div>
    </Rise>
    {[80, 560].map((x, i) => <div key={x} style={{position: 'absolute', left: x + 300, top: 540, width: 110, height: 110, borderRadius: 55, background: 'linear-gradient(140deg,#FB7185,#E11D48)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, fontWeight: 900, opacity: clamp(sp(p, both + i * 5) * 1.4), transform: `scale(${pop(sp(p, both + i * 5))})`, boxShadow: '0 0 50px rgba(225,29,72,.6)'}}>✕</div>)}
    <Rise p={p} at={costing - 4} style={{left: 0, right: 0, top: 980, display: 'flex', justifyContent: 'center'}}><Pill color={C.bad} solid>Both cost you jobs</Pill></Rise>
  </Stage>;
};

/* 2 · It isn't about the one person; it's for every homeowner who reads it, and how you responded. */
export const F15Readers: React.FC<VisualProps> = (p) => {
  const [star, one, every, reads, responded] = cues(p, [60, 130, 184, 218, 322]);
  const ring = smooth(lin(p, every - 4, 30));
  const spot = smooth(lin(p, responded - 6, 16));
  const readers = Array.from({length: 10}, (_, i) => { const a = -Math.PI / 2 + i / 10 * Math.PI * 2; return [540 + Math.cos(a) * 430 - 40, 560 + Math.sin(a) * 360 - 40]; });
  return <Stage p={p} tint={['#4F46E5', '#BE123C', '#0E7490']}>
    <div style={{opacity: 1 - lin(p, every - 8, 8)}}><Kinetic p={p} at={star - 10} text="Not about one person…" size={78} top={40} /></div>
    <div style={{opacity: lin(p, every - 8, 8)}}><Kinetic p={p} at={every - 8} text="It's for every homeowner" size={78} top={40} grad="linear-gradient(90deg,#FFFFFF,#A5B4FC)" /></div>
    {readers.map(([x, y], i) => { const k = sp(p, every + i * 3); return <div key={i} style={{position: 'absolute', left: x, top: y, opacity: clamp(k * 1.4) * (1 - .4 * spot), transform: `scale(${pop(k)})`}}>
      <Avatar c={['#818CF8', '#22D3EE', '#F472B6', '#FBBF24', '#34D399'][i % 5]} s={80} />
      <div style={{position: 'absolute', right: -10, bottom: -6, width: 34, height: 34, borderRadius: 17, background: '#0B0D1A', border: '2px solid rgba(255,255,255,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, opacity: lin(p, reads, 10)}}><svg width="22" height="14" viewBox="0 0 22 14"><ellipse cx="11" cy="7" rx="10" ry="6" fill="none" stroke="#FFF" strokeWidth="2" /><circle cx="11" cy="7" r="3" fill="#FFF" /></svg></div>
    </div>; })}
    <Rise p={p} at={star - 6} style={card(230, 400, 620, 230, {padding: 34, transform: `translateY(${-60 * spot}px)`})}>
      <Review n={1} />
      <div style={{position: 'absolute', right: 24, top: 24, opacity: lin(p, one - 4, 10)}}><Pill color={C.mute}>1 reviewer</Pill></div>
    </Rise>
    <Rise p={p} at={responded - 8} style={card(230, 640, 620, 210, {padding: 34, border: `2px solid ${C.good}`, boxShadow: `0 0 ${60 + 30 * spot}px rgba(52,211,153,.4), ${glass.boxShadow}`})}>
      <div style={{...label, color: '#6EE7B7'}}>Your response</div><Lines w={[85, 60]} />
    </Rise>
    <Rise p={p} at={responded + 6} style={{left: 0, right: 0, top: 1000, display: 'flex', justifyContent: 'center'}}><Pill color={C.good}>They're reading how you responded</Pill></Rise>
  </Stage>;
};

/* 3 · Ignore and they think you don't care; argue and they think you'll argue with them too. */
export const F15Reactions: React.FC<VisualProps> = (p) => {
  const [ignore, care, argue, too] = cues(p, [9, 62, 99, 159]);
  const row = (top: number, at: number, thinkAt: number, title: string, reply: React.ReactNode, thought: string, color: string) =>
    <Rise p={p} at={at - 6} style={card(80, top, 920, 560, {padding: 40})}>
      <div style={{...label, color}}>{title}</div>
      <div style={{marginTop: 24, padding: '26px 30px', borderRadius: 26, background: 'rgba(255,255,255,.06)', minHeight: 120}}>{reply}</div>
      <div style={{display: 'flex', alignItems: 'center', gap: 22, marginTop: 34, opacity: clamp(sp(p, thinkAt - 4) * 1.4), transform: `translateY(${(1 - clamp(sp(p, thinkAt - 4))) * 20}px)`}}>
        <Avatar c="#94A3B8" s={84} />
        <div style={{padding: '24px 30px', borderRadius: '30px 30px 30px 8px', background: `${color}22`, border: `1.5px solid ${color}66`, fontSize: 38, fontWeight: 800}}>"{thought}"</div>
      </div>
    </Rise>;
  return <Stage p={p} tint={['#BE123C', '#4F46E5', '#B45309']}>
    {row(40, ignore, care, 'If you ignore it', <div style={{fontSize: 34, color: C.mute, fontStyle: 'italic', fontWeight: 600}}>No response from owner</div>, 'They don\'t care.', '#FBBF24')}
    {row(640, argue, too, 'If you argue', <div style={{fontSize: 32, fontWeight: 650, color: C.bad}}>"That's not what happened and you know it…"</div>, 'They\'ll argue with me too.', C.bad)}
  </Stage>;
};

/* 4 · Step 1: don't respond the same day if you're angry; wait until you can be calm. */
export const F15Step1: React.FC<VisualProps> = (p) => {
  const [handle, first, angry, wait, calm] = cues(p, [21, 46, 112, 121, 167]);
  const mood = smooth(lin(p, wait, calm - wait + 20));
  const moodColor = mood < .5 ? '#FB7185' : '#34D399';
  return <Stage p={p} tint={['#BE123C', '#059669', '#4F46E5']}>
    <div style={{opacity: 1 - lin(p, first - 6, 8)}}><Kinetic p={p} at={handle - 10} text="Here's how to handle it" size={80} top={126} /></div>
    <div style={{opacity: lin(p, first - 6, 8)}}><StepTitle p={p} n={1} text="Not while you're angry" at={first - 6} /></div>
    <Rise p={p} at={first} style={card(80, 330, 920, 420, {padding: 40})}>
      <div style={{display: 'flex', justifyContent: 'space-between', ...label}}><span>Your mood</span><span style={{color: moodColor}}>{mood < .5 ? 'angry' : 'calm'}</span></div>
      <div style={{position: 'relative', height: 30, borderRadius: 15, marginTop: 40, background: 'linear-gradient(90deg,#FB7185,#FBBF24,#34D399)'}}>
        <div style={{position: 'absolute', top: -14, left: `calc(${4 + 88 * mood}% - 29px)`, width: 58, height: 58, borderRadius: 29, background: '#FFF', boxShadow: `0 0 30px ${moodColor}`}} />
      </div>
      <div style={{display: 'flex', gap: 20, marginTop: 70}}>
        {[['Today', false], ['Tomorrow', true]].map(([d, ok]) => <div key={d as string} style={{flex: 1, padding: '28px 30px', borderRadius: 26, background: ok && mood > .5 ? 'rgba(52,211,153,.12)' : 'rgba(255,255,255,.06)', border: `1.5px solid ${ok && mood > .5 ? 'rgba(52,211,153,.5)' : 'rgba(255,255,255,.1)'}`}}>
          <div style={{fontSize: 34, fontWeight: 800}}>{d}</div>
          <div style={{fontSize: 28, fontWeight: 650, marginTop: 8, color: ok ? (mood > .5 ? '#6EE7B7' : C.mute) : C.bad, opacity: ok ? 1 : lin(p, angry - 4, 10)}}>{ok ? (mood > .5 ? '✓ Respond calmly' : 'wait…') : '✕ Don\'t reply angry'}</div>
        </div>)}
      </div>
    </Rise>
    <Rise p={p} at={calm - 4} style={{left: 0, right: 0, top: 820, display: 'flex', justifyContent: 'center'}}><Pill color={C.good}>Wait until you can be calm</Pill></Rise>
  </Stage>;
};

/* 5 · Step 2: keep it short. Thank them, say sorry, invite them to a call to make it right. */
export const F15Step2: React.FC<VisualProps> = (p) => {
  const [short, thank, sorry, invite, right] = cues(p, [20, 57, 87, 187, 271]);
  const parts = [['Thank you for the feedback.', thank], ['I\'m sorry your experience wasn\'t what you expected.', sorry], ['Please give us a call so we can make it right.', invite]] as const;
  const send = right + 6, sent = p.frame >= send;
  return <Stage p={p} tint={['#059669', '#4F46E5', '#0E7490']}>
    <StepTitle p={p} n={2} text="Keep it short" at={short - 14} />
    <Rise p={p} at={short} style={card(80, 330, 920, 720, {padding: 40, border: sent ? `2px solid ${C.good}` : glass.border})}>
      <div style={{display: 'flex', justifyContent: 'space-between', ...label}}><span>Reply as owner</span><span style={{color: '#6EE7B7'}}>short ✓</span></div>
      <div style={{marginTop: 26, padding: '30px 32px', borderRadius: 28, background: 'rgba(255,255,255,.06)', minHeight: 400}}>
        {parts.map(([t, at], i) => { const n = Math.floor(clamp((p.frame - at + 4) / 22) * t.length); return n > 0 ? <div key={i} style={{fontSize: 38, fontWeight: 650, lineHeight: 1.35, marginTop: i ? 18 : 0}}>
          {t.slice(0, n)}{n < t.length && <span style={{color: C.b}}>|</span>}</div> : null; })}
      </div>
      <div style={{display: 'flex', gap: 14, marginTop: 26}}>
        {[['Thank them', thank], ['Say sorry', sorry], ['Invite a call', invite]].map(([t, at]) => <div key={t as string} style={{opacity: clamp(sp(p, (at as number) + 10) * 1.4)}}><Pill color={C.good}>✓ {t}</Pill></div>)}
      </div>
      <div style={{position: 'absolute', right: 40, bottom: 40, width: 220, height: 84, borderRadius: 42, background: sent ? 'linear-gradient(90deg,#34D399,#22D3EE)' : 'rgba(255,255,255,.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 32, fontWeight: 850, color: sent ? '#06120C' : C.ink, opacity: lin(p, invite + 10, 10)}}>
        {sent ? <><Check k={lin(p, send + 2, 10)} size={36} /> Posted</> : 'Post reply'}</div>
    </Rise>
    <Cursor p={p} path={[[send - 22, 600, 1300], [send - 4, 870, 1010], [send + 20, 880, 1020], [send + 34, 1000, 1300]]} clicks={[send]} />
  </Stage>;
};

/* 6 · Step 3: don't go into details publicly. No he-said-she-said. Take it offline. */
export const F15Step3: React.FC<VisualProps> = (p) => {
  const [details, publicly, he, she, offline] = cues(p, [35, 51, 95, 122, 157]);
  const move = smooth(lin(p, offline - 4, 20));
  return <Stage p={p} tint={['#4F46E5', '#BE123C', '#059669']}>
    <StepTitle p={p} n={3} text="No details in public" at={details - 20} />
    <Rise p={p} at={publicly - 8} style={card(80, 330, 920, 420, {padding: 40})}>
      <div style={label}>Public · everyone can see</div>
      {[['He said…', he, 'flex-start'], ['She said…', she, 'flex-end']].map(([t, at, al]) => <div key={t as string} style={{display: 'flex', justifyContent: al as string, marginTop: 30}}>
        <div style={{position: 'relative', padding: '24px 34px', borderRadius: 30, background: 'rgba(251,113,133,.14)', border: '1.5px solid rgba(251,113,133,.4)', fontSize: 40, fontWeight: 750, opacity: clamp(sp(p, (at as number) - 4) * 1.4) * (1 - .6 * move)}}>{t}
          <div style={{position: 'absolute', left: -6, right: -6, top: '50%', height: 5, borderRadius: 3, background: C.bad, transform: `scaleX(${lin(p, (at as number) + 14, 10)})`, transformOrigin: 'left'}} /></div></div>)}
    </Rise>
    <svg width="120" height="140" style={{position: 'absolute', left: 480, top: 760, opacity: lin(p, offline - 6, 10)}}><path d="M60 10V110M20 72L60 116L100 72" stroke="#6EE7B7" strokeWidth="10" fill="none" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - move} /></svg>
    <Rise p={p} at={offline} style={card(180, 930, 720, 200, {display: 'flex', alignItems: 'center', gap: 30, padding: '0 40px', border: `2px solid ${C.good}`})}>
      <div style={{width: 96, height: 96, borderRadius: 30, background: 'linear-gradient(140deg,#34D399,#22D3EE)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <svg width="56" height="56" viewBox="0 0 34 34"><path d="M9 4L14 4L16 11L12 14Q15 21 20 22L23 18L30 20L30 25Q22 31 13 22Q4 13 9 4Z" fill="#06120C" /></svg></div>
      <div><div style={{...label, color: '#6EE7B7'}}>Private</div><div style={{fontSize: 48, fontWeight: 850}}>Take it offline</div></div>
    </Rise>
  </Stage>;
};

/* 7 · Step 4, the real fix: so many good reviews coming in that one bad review doesn't move the needle. */
export const F15Step4: React.FC<VisualProps> = (p) => {
  const [real, many, reviews, oneBad, needle] = cues(p, [34, 72, 89, 142, 192]);
  const flow = p.frame - reviews;
  const wobble = p.frame > oneBad ? Math.sin((p.frame - oneBad) / 3) * 4 * Math.exp(-(p.frame - oneBad) / 20) : 0;
  const ang = -70 + 128 * smooth(lin(p, many - 4, 40)) + wobble;
  return <Stage p={p} tint={['#059669', '#B45309', '#4F46E5']}>
    <StepTitle p={p} n={4} text="The real fix" at={real - 20} />
    <Rise p={p} at={many - 8} style={card(80, 330, 440, 760, {padding: '30px 28px', overflow: 'hidden'})}>
      <div style={label}>New reviews</div>
      <div style={{position: 'absolute', left: 28, right: 28, top: 90, bottom: 0, overflow: 'hidden'}}>
        {flow > 0 && Array.from({length: 7}, (_, i) => { const y = ((flow * 3.2 + i * 120) % 840) - 120; const bad = i === 3 && p.frame > oneBad - 10; return <div key={i} style={{position: 'absolute', left: 0, right: 0, top: y, height: 100, borderRadius: 22, background: bad ? 'rgba(251,113,133,.12)' : 'rgba(52,211,153,.1)', border: `1.5px solid ${bad ? 'rgba(251,113,133,.4)' : 'rgba(52,211,153,.3)'}`, display: 'flex', alignItems: 'center', gap: 16, padding: '0 18px'}}>
          <Avatar c={bad ? '#FB7185' : '#34D399'} s={56} /><Stars n={bad ? 1 : 5} size={28} /></div>; })}
      </div>
    </Rise>
    <Rise p={p} at={oneBad - 20} style={card(560, 330, 440, 760, {display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 30})}>
      <div style={label}>Your rating</div>
      <svg width="360" height="220" viewBox="0 0 360 220">
        <path d="M30 190A150 150 0 0 1 330 190" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="26" strokeLinecap="round" />
        <path d="M30 190A150 150 0 0 1 330 190" fill="none" stroke="url(#f15g)" strokeWidth="26" strokeLinecap="round" />
        <defs><linearGradient id="f15g"><stop offset="0" stopColor="#FB7185" /><stop offset=".5" stopColor="#FBBF24" /><stop offset="1" stopColor="#34D399" /></linearGradient></defs>
        <g transform={`rotate(${ang} 180 190)`}><path d="M180 190V62" stroke="#FFF" strokeWidth="8" strokeLinecap="round" /></g><circle cx="180" cy="190" r="16" fill="#FFF" />
      </svg>
      <Stars n={5} size={52} />
      <div style={{fontSize: 34, fontWeight: 800, textAlign: 'center', opacity: lin(p, needle - 6, 10), padding: '0 30px'}}>One bad review<br /><span style={{color: '#6EE7B7'}}>doesn't move the needle</span></div>
    </Rise>
  </Stage>;
};
