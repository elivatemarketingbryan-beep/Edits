import React from 'react';
import {clamp} from '../../motion';
import type {VisualProps} from '../../types';
import {C, cues, sp, lin, smooth, glass, label, Stage, Rise, Kinetic, Ring, Check, Pill, Cursor} from './kit';

// Sleek split-screen scenes for "easier to find beats better" (video10).
// Search, profile and website are generic UI, not Google's real interface.
const Top: React.FC<{p: VisualProps; tint?: [string, string, string]; children: React.ReactNode}> = ({p, tint, children}) =>
  <Stage p={p} ch={900} top={30} tint={tint}>{children}</Stage>;
const card = (left: number, top: number, width: number, height: number, extra: React.CSSProperties = {}): React.CSSProperties =>
  ({...glass, left, top, width, height, boxSizing: 'border-box', ...extra});

const Search: React.FC<{p: VisualProps; text: string; at: number; typeLen?: number; style?: React.CSSProperties}> = ({p, text, at, typeLen = 24, style}) => {
  const n = Math.floor(clamp((p.frame - at) / typeLen) * text.length);
  const caret = n < text.length || Math.floor(p.frame / 15) % 2 === 0;
  return <div style={{...glass, position: 'absolute', height: 100, borderRadius: 50, display: 'flex', alignItems: 'center', gap: 22, padding: '0 36px', boxSizing: 'border-box', ...style}}>
    <svg width="38" height="38" viewBox="0 0 38 38"><circle cx="16" cy="16" r="11" fill="none" stroke={C.mute} strokeWidth="4" /><path d="M24 24l9 9" stroke={C.mute} strokeWidth="4" strokeLinecap="round" /></svg>
    <div style={{fontSize: 40, fontWeight: 650}}>{text.slice(0, n)}<span style={{opacity: caret ? 1 : 0, color: C.b}}>|</span></div>
  </div>;
};
const Stars: React.FC<{n?: number; size?: number}> = ({n = 5, size = 24}) => <span style={{color: '#FBBF24', fontSize: size, letterSpacing: 2}}>{'★'.repeat(n)}</span>;
const Listing: React.FC<{name: string; you?: boolean; hot?: boolean; extra?: React.ReactNode}> = ({name, you, hot, extra}) =>
  <div style={{height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 36px'}}>
    <div><div style={{fontSize: 38, fontWeight: 800, color: you ? '#6EE7B7' : C.ink}}>{name}</div><div style={{marginTop: 6, fontSize: 24, color: C.mute}}><Stars /> · Open now</div></div>
    {extra ?? <div style={{padding: '14px 28px', borderRadius: 30, fontSize: 26, fontWeight: 800, background: hot ? 'linear-gradient(90deg,#818CF8,#22D3EE)' : 'rgba(255,255,255,.12)', color: hot ? '#06120C' : C.ink}}>Call</div>}
  </div>;

/* 2 · A homeowner needs a roof, a remodel or paint and searches for someone nearby. */
export const M10Need: React.FC<VisualProps> = (p) => {
  const [homeowner, roof, bathroom, paint, google, searching, area] = cues(p, [36, 63, 84, 131, 177, 198, 231]);
  const jobs = [['New roof', roof, 'M8 30L32 10L56 30M14 26V54H50V26'], ['Bathroom remodel', bathroom, 'M8 30H56V38Q56 54 32 54Q8 54 8 38ZM14 30V12Q14 6 20 6Q26 6 26 12'], ['Paint job', paint, 'M10 10H46V26H10ZM46 18H54V34H30V54']] as const;
  return <Top p={p} tint={['#2563EB', '#0EA5E9', '#7C3AED']}>
    <Kinetic p={p} at={homeowner - 10} text="When a homeowner needs…" size={66} top={20} />
    {jobs.map(([t, at, d], i) => <Rise key={t} p={p} at={at - 6} style={card(80 + i * 315, 140, 290, 290, {display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24})}>
      <div style={{width: 110, height: 110, borderRadius: 32, background: 'linear-gradient(140deg,rgba(129,140,248,.35),rgba(34,211,238,.25))', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <svg width="64" height="64" viewBox="0 0 64 64"><path d={d} fill="none" stroke="#FFF" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
      <div style={{fontSize: 32, fontWeight: 750, textAlign: 'center'}}>{t}</div>
    </Rise>)}
    <Rise p={p} at={google - 8} style={{left: 80, top: 490, width: 920}}><Search p={p} text="roofer near me" at={searching - 4} style={{left: 0, top: 0, width: 920}} /></Rise>
    <Rise p={p} at={area - 6} style={{left: 80, top: 640, display: 'flex', gap: 18}}><Pill color={C.bad}>● Near me</Pill><Pill color={C.b}>Someone in their area</Pill></Rise>
  </Top>;
};

/* 3 · Not showing up: competitors get the calls; good work doesn't matter if nobody finds you. */
export const M10Missing: React.FC<VisualProps> = (p) => {
  const [isnt, competitors, good, nobody, find] = cues(p, [26, 102, 189, 225, 245]);
  const names = ['Competitor Roofing Co.', 'Another Pro Builders', 'Third Guys Remodeling'];
  const sink = smooth(lin(p, nobody - 2, 22)), hot = p.frame > competitors - 4;
  return <Top p={p} tint={['#E11D48', '#4F46E5', '#0891B2']}>
    <Search p={p} text="roofer near me" at={-30} style={{left: 80, top: 20, width: 920}} />
    {names.map((n, i) => <Rise key={n} p={p} at={i * 5} style={card(80, 150 + i * 150, 920, 130, {borderRadius: 30, border: hot ? '1.5px solid rgba(129,140,248,.6)' : glass.border})}>
      <Listing name={n} hot={hot} />
    </Rise>)}
    <div style={{position: 'absolute', left: 84, top: 620, fontSize: 32, fontWeight: 700, color: C.mute, opacity: lin(p, isnt - 4, 10) * (1 - lin(p, find - 8, 8))}}>Your business: not on the list</div>
    <div style={{position: 'absolute', left: 84, top: 620, fontSize: 36, fontWeight: 800, color: C.bad, opacity: lin(p, find - 4, 10)}}>…but nobody can find you</div>
    <Rise p={p} at={good - 8} style={card(80, 690 + 160 * sink, 920, 130, {borderRadius: 30, border: '2px solid rgba(52,211,153,.5)', opacity: 1 - .85 * sink, filter: `blur(${sink * 8}px)`})}>
      <Listing name="Your Business" you extra={<Pill color={C.good}>Great work</Pill>} />
    </Rise>
  </Top>;
};

/* 5 · Fill out the profile: photos, honest reviews, accurate info. */
export const M10Profile: React.FC<VisualProps> = (p) => {
  const [profile, fully, photos, reviews, info] = cues(p, [39, 76, 149, 248, 303]);
  const items = [['Profile fully filled out', fully], ['Fresh project photos', photos], ['Honest reviews', reviews], ['Accurate business info', info]] as const;
  const pct = smooth(clamp((p.frame - fully + 10) / (info - fully + 30)));
  return <Top p={p} tint={['#059669', '#0EA5E9', '#4F46E5']}>
    <Kinetic p={p} at={profile - 12} text="Your business profile" size={66} top={20} />
    <Rise p={p} at={profile - 6} style={card(80, 130, 400, 700, {padding: 26})}>
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, height: 200}}>
        {[0, 1, 2].map(i => { const k = sp(p, photos - 4 + i * 5); return <div key={i} style={{borderRadius: 16, background: ['linear-gradient(160deg,#6EE7B7,#0EA5E9)', 'linear-gradient(160deg,#A78BFA,#F472B6)', 'linear-gradient(160deg,#FDE68A,#FB923C)'][i], opacity: clamp(k * 1.4), transform: `scale(${.8 + .2 * clamp(k)})`}} />; })}
      </div>
      <div style={{fontSize: 38, fontWeight: 800, marginTop: 26}}>Your Business</div>
      <div style={{marginTop: 8, opacity: lin(p, reviews - 2, 10), fontSize: 26, color: C.mute}}><Stars size={28} /> reviews</div>
      {['Hours', 'Phone', 'Service area'].map((l, i) => <div key={l} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, fontSize: 26, fontWeight: 650, color: C.mute, opacity: lin(p, info - 4 + i * 5, 8)}}>
        {l}<div style={{width: 150, height: 14, borderRadius: 7, background: 'rgba(255,255,255,.2)'}} /></div>)}
      <div style={{position: 'absolute', left: 26, right: 26, bottom: 26, display: 'flex', alignItems: 'center', gap: 18}}>
        <Ring v={pct} size={90} stroke={12} from="#34D399" to="#22D3EE"><div style={{fontSize: 22, fontWeight: 800}}>{Math.round(pct * 100)}%</div></Ring>
        <div style={{fontSize: 26, fontWeight: 700, color: C.mute}}>complete</div></div>
    </Rise>
    {items.map(([t, at], i) => <Rise key={t} p={p} at={at - 8} style={card(520, 130 + i * 178, 480, 150, {display: 'flex', alignItems: 'center', gap: 24, padding: '0 30px', borderRadius: 30, border: p.frame > at + 4 ? '1.5px solid rgba(52,211,153,.55)' : glass.border})}>
      <div style={{width: 64, height: 64, borderRadius: 32, flex: 'none', background: p.frame > at ? 'linear-gradient(140deg,#34D399,#22D3EE)' : 'rgba(255,255,255,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Check k={lin(p, at + 2, 10)} size={40} /></div>
      <div style={{fontSize: 32, fontWeight: 750, lineHeight: 1.15}}>{t}</div>
    </Rise>)}
  </Top>;
};

/* 6 · A website that clearly explains what you do and which areas you serve. */
export const M10Website: React.FC<VisualProps> = (p) => {
  const [website, explains, doWhat, areas] = cues(p, [31, 76, 107, 132]);
  const scroll = 40 * smooth(lin(p, areas - 10, 20));
  return <Top p={p} tint={['#7C3AED', '#2563EB', '#DB2777']}>
    <Rise p={p} at={website - 8} style={card(70, 20, 940, 840, {borderRadius: 34})}>
      <div style={{height: 70, display: 'flex', alignItems: 'center', gap: 12, padding: '0 28px', borderBottom: '1.5px solid rgba(255,255,255,.1)'}}>
        {['#FF5F57', '#FEBC2E', '#28C840'].map(c => <div key={c} style={{width: 18, height: 18, borderRadius: 9, background: c}} />)}
        <div style={{marginLeft: 20, flex: 1, height: 38, borderRadius: 19, background: 'rgba(255,255,255,.08)', fontSize: 22, color: C.mute, display: 'flex', alignItems: 'center', paddingLeft: 22}}>yourbusiness.com</div>
      </div>
      <div style={{padding: '40px 50px', transform: `translateY(${-scroll}px)`}}>
        <div style={{fontSize: 70, fontWeight: 850, letterSpacing: -2, opacity: clamp(sp(p, explains - 6) * 1.4)}}>Your Business</div>
        <div style={{fontSize: 32, color: C.mute, fontWeight: 600, marginTop: 8, opacity: lin(p, explains, 10)}}>Clear about what we do — and where.</div>
        <div style={{...label, marginTop: 50, opacity: lin(p, doWhat - 6, 10)}}>What we do</div>
        <div style={{display: 'flex', gap: 20, marginTop: 20}}>
          {['Roofing', 'Remodels', 'Painting'].map((s, i) => { const k = sp(p, doWhat - 2 + i * 5); return <div key={s} style={{flex: 1, height: 150, borderRadius: 26, background: 'linear-gradient(160deg,rgba(167,139,250,.3),rgba(34,211,238,.15))', border: '1.5px solid rgba(255,255,255,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, fontWeight: 800, opacity: clamp(k * 1.4), transform: `translateY(${(1 - k) * 30}px)`}}>{s}</div>; })}
        </div>
        <div style={{...label, marginTop: 50, opacity: lin(p, areas - 6, 10)}}>Areas we serve</div>
        <div style={{display: 'flex', gap: 16, marginTop: 20}}>
          {['Your town', 'Next town', 'County'].map((t, i) => <div key={t} style={{opacity: clamp(sp(p, areas + i * 5) * 1.4)}}><Pill color={C.b}>● {t}</Pill></div>)}
        </div>
      </div>
    </Rise>
  </Top>;
};

/* 7 · Not just knowing you exist: showing up first when they're ready to hire. */
export const M10Hire: React.FC<VisualProps> = (p) => {
  const [know, exists, showUp, looking, hire] = cues(p, [52, 76, 127, 168, 202]);
  const rise = smooth(lin(p, looking - 4, 20)), R = sp(p, showUp - 6);
  const slot = (i: number) => 130 + i * 140;
  const call = hire + 10;
  return <Top p={p} tint={['#CA8A04', '#4F46E5', '#059669']}>
    <Rise p={p} at={know - 8} style={card(70, 20, 330, 820, {padding: '34px 30px', opacity: 1 - .5 * clamp(R)})}>
      <div style={label}>Knowing you exist</div>
      <div style={{marginTop: 40, height: 220, borderRadius: 22, border: '1.5px solid rgba(255,255,255,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, fontWeight: 800, textAlign: 'center', opacity: lin(p, exists - 4, 10)}}>Your<br />Business</div>
      <div style={{width: 10, height: 120, background: 'rgba(255,255,255,.18)', margin: '0 auto'}} />
      <div style={{fontSize: 26, color: C.mute, fontWeight: 600, textAlign: 'center', marginTop: 30}}>people walk past.<br />not hiring.</div>
    </Rise>
    <Rise p={p} at={showUp - 6} style={card(430, 20, 580, 820, {padding: 0})}>
      <div style={{position: 'absolute', left: 30, top: 34, ...label, color: '#FDE68A'}}>Showing up to hire</div>
      <div style={{position: 'absolute', left: 30, right: 30, top: 74, height: 4, borderRadius: 2, background: 'rgba(255,255,255,.08)'}} />
      {[0, 1, 2].map(i => {
        const you = i === 0, y = you ? slot(2) + (slot(0) - slot(2)) * rise : slot(i - 1) + 140 * rise;
        return <div key={i} style={{position: 'absolute', left: 30, right: 30, top: y, height: 120, borderRadius: 28, background: you ? 'linear-gradient(120deg,rgba(253,224,71,.28),rgba(251,191,36,.12))' : 'rgba(255,255,255,.06)', border: you ? '2px solid rgba(253,224,71,.7)' : '1.5px solid rgba(255,255,255,.1)', boxShadow: you ? '0 0 50px rgba(253,224,71,.3)' : 'none', zIndex: you ? 2 : 1}}>
          <div style={{height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px'}}>
            <div><div style={{fontSize: 32, fontWeight: 800, color: you ? '#FDE68A' : C.mute}}>{you ? 'Your Business' : 'Competitor'}</div><div style={{fontSize: 22, color: C.mute}}><Stars size={20} /></div></div>
            {you && <div style={{fontSize: 28, fontWeight: 900, color: '#FDE68A'}}>#{rise > .5 ? 1 : 3}</div>}
          </div></div>;
      })}
      <Rise p={p} at={hire - 6} style={{left: 30, right: 30, top: 600, height: 110, borderRadius: 55, background: p.frame >= call ? 'linear-gradient(90deg,#34D399,#22D3EE)' : 'rgba(255,255,255,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, fontSize: 36, fontWeight: 850, color: p.frame >= call ? '#06120C' : C.ink}}>
        {p.frame >= call ? 'Calling you…' : 'Ready to hire · Call'}</Rise>
    </Rise>
    <Cursor p={p} path={[[hire - 10, 1000, 880], [call - 4, 720, 680], [call + 20, 730, 690], [call + 34, 1000, 880]]} clicks={[call]} />
  </Top>;
};
