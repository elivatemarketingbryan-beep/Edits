import React from 'react';
import {clamp} from '../../motion';
import type {VisualProps} from '../../types';
import {C, cues, sp, lin, eOut, eMove, pop, glass, label, Stage, Rise, Kinetic, Check, Pill, Avatar} from './kit';

// Split-screen scenes for "your camera roll is your content" (video16), the first edit built
// with the installed animation skills: ease-out enters, ease-in-out on-screen moves, linear for
// constant motion (playhead, REC pulse), 2–3 frame staggers, nothing scales from 0, and every
// scene shows something within its first 6 frames. 1080x900 canvas.
const Top: React.FC<{p: VisualProps; tint?: [string, string, string]; children: React.ReactNode}> = ({p, tint, children}) =>
  <Stage p={p} ch={900} top={30} tint={tint}>{children}</Stage>;
const card = (left: number, top: number, width: number, height: number, extra: React.CSSProperties = {}): React.CSSProperties =>
  ({...glass, left, top, width, height, boxSizing: 'border-box', ...extra});

type Kind = 'before' | 'after' | 'video' | 'bath' | 'roof' | 'home' | 'plain';
const GRAD: Record<Kind, string> = {
  before: 'linear-gradient(160deg,#57534E,#3F3F46)', after: 'linear-gradient(160deg,#5EEAD4,#3B82F6)', video: 'linear-gradient(160deg,#F59E0B,#B45309)',
  bath: 'linear-gradient(160deg,#BAE6FD,#38BDF8)', roof: 'linear-gradient(160deg,#FCA5A5,#B91C1C)', home: 'linear-gradient(160deg,#A7F3D0,#059669)', plain: 'linear-gradient(160deg,#C4B5FD,#6D28D9)',
};
/* A camera-roll "photo": gradient plus a simple subject glyph. */
const Photo: React.FC<{kind: Kind; size: number; dim?: number}> = ({kind, size, dim = 0}) =>
  <div style={{width: size, height: size, borderRadius: 14, background: GRAD[kind], position: 'relative', overflow: 'hidden', filter: dim ? `saturate(${1 - dim}) brightness(${1 - .4 * dim})` : undefined}}>
    <svg viewBox="0 0 100 100" width={size} height={size} style={{position: 'absolute', inset: 0}}>
      {(kind === 'roof' || kind === 'home' || kind === 'after' || kind === 'before') && <path d="M18 58L50 30L82 58V82H18Z" fill="rgba(255,255,255,.55)" />}
      {kind === 'bath' && <path d="M14 56H86V64Q86 82 50 82Q14 82 14 64ZM22 56V30Q22 22 30 22Q38 22 38 30" fill="rgba(255,255,255,.6)" />}
      {kind === 'video' && <><circle cx="50" cy="50" r="18" fill="rgba(0,0,0,.35)" /><path d="M45 41L60 50L45 59Z" fill="#FFF" /></>}
      {kind === 'plain' && <rect x="24" y="34" width="52" height="34" rx="6" fill="rgba(255,255,255,.45)" />}
    </svg>
  </div>;

/* 2 · It's sitting in your camera roll: projects, before/afters, crew videos, bathrooms, roofs, transformations. */
export const M16Roll: React.FC<VisualProps> = (p) => {
  const [roll, projects, beforeAfter, videos, bath, roof, homes, transformed] = cues(p, [24, 82, 130, 184, 253, 288, 316, 372]);
  const kinds: Kind[] = ['plain', 'before', 'after', 'video', 'bath', 'roof', 'home', 'video', 'plain', 'bath', 'before', 'after', 'roof', 'home', 'video', 'plain', 'after', 'bath', 'roof', 'home'];
  const hot: Record<Kind, number> = {before: beforeAfter, after: beforeAfter, video: videos, bath, roof, home: homes, plain: projects};
  const chips = [['Projects', projects], ['Before & after', beforeAfter], ['Crew videos', videos], ['Bathrooms', bath], ['Roofs', roof], ['Transformations', homes]] as const;
  const phoneIn = eOut(p, 0, 14);
  return <Top p={p} tint={['#0EA5E9', '#7C3AED', '#059669']}>
    <div style={{...glass, left: 80, top: 20, width: 470, height: 860, borderRadius: 64, opacity: phoneIn, transform: `translateY(${(1 - phoneIn) * 40}px)`}}>
      <div style={{position: 'absolute', left: 185, top: 18, width: 100, height: 26, borderRadius: 13, background: 'rgba(0,0,0,.5)'}} />
      <div style={{position: 'absolute', left: 32, top: 64, fontSize: 40, fontWeight: 850, letterSpacing: -1}}>Camera Roll</div>
      <div style={{position: 'absolute', left: 32, top: 140, display: 'grid', gridTemplateColumns: 'repeat(4, 96px)', gap: 8}}>
        {kinds.map((k, i) => {
          const tagged = p.frame >= hot[k], rowIn = eOut(p, roll - 6 + Math.floor(i / 4) * 2, 12);
          const lift = tagged ? eOut(p, hot[k], 10) : 0;
          return <div key={i} style={{opacity: rowIn * (p.frame > projects ? (tagged ? 1 : .35) : 1), transform: `translateY(${(1 - rowIn) * 16}px) scale(${1 + .04 * lift})`, borderRadius: 14, boxShadow: lift > .5 ? '0 0 0 3px #FDE68A, 0 10px 30px rgba(253,230,138,.35)' : 'none'}}>
            <Photo kind={k} size={96} /></div>;
        })}
      </div>
    </div>
    <Rise p={p} at={roll + 4} style={{left: 590, top: 30}}><div style={{...label, color: '#FDE68A'}}>Already on your phone</div></Rise>
    {chips.map(([t, at], i) => <Rise key={t} p={p} at={at - 4} dy={24} style={{left: 590, top: 90 + i * 112}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 16, padding: '20px 26px', borderRadius: 26, background: 'rgba(255,255,255,.07)', border: '1.5px solid rgba(255,255,255,.14)', width: 410, boxSizing: 'border-box'}}>
        <div style={{width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(140deg,#FDE68A,#F59E0B)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Check k={lin(p, at + 4, 8)} size={30} /></div>
        <div style={{fontSize: 32, fontWeight: 750}}>{t}</div></div>
    </Rise>)}
    <Rise p={p} at={transformed - 4} style={{left: 590, top: 790}}><Pill color={C.good} solid>That's your content</Pill></Rise>
  </Top>;
};

/* 4 · Never posted, or one picture captioned "another job completed": a missed chance to show quality and earn trust. */
export const M16Post: React.FC<VisualProps> = (p) => {
  const [never, upload, caption, another, missing, quality, trust] = cues(p, [49, 88, 134, 164, 230, 290, 365]);
  const capText = 'Another job completed.';
  const typed = capText.slice(0, Math.floor(clamp((p.frame - another + 4) / 20) * capText.length));
  const ghost = eOut(p, quality - 4, 16); // what it could be: a dashed target fades in; the actual level never jumps
  const showMeter = p.frame >= missing - 6;
  return <Top p={p} tint={['#BE123C', '#4F46E5', '#0EA5E9']}>
    <Rise p={p} at={0} style={card(80, 20, 520, 860, {padding: 30})}>
      <div style={{display: 'flex', alignItems: 'center', gap: 16}}><Avatar c="#818CF8" s={60} /><div><div style={{fontSize: 30, fontWeight: 800}}>Your Business</div><div style={{fontSize: 22, color: C.mute}}>just now</div></div></div>
      <div style={{marginTop: 24, position: 'relative', opacity: eOut(p, upload - 4, 12)}}><Photo kind="plain" size={460} /></div>
      <div style={{marginTop: 24, fontSize: 34, fontWeight: 650, minHeight: 50}}>{typed}{p.frame >= another - 4 && typed.length < capText.length && <span style={{color: C.b}}>|</span>}</div>
      <div style={{position: 'absolute', left: 30, bottom: 30, display: 'flex', gap: 30, fontSize: 26, color: C.mute, fontWeight: 650, opacity: lin(p, caption + 40, 10)}}><span>♡ ·</span><span>no comments</span></div>
    </Rise>
    <Rise p={p} at={never - 4} style={card(630, 20, 370, 240, {padding: 28})}>
      <div style={label}>Or…</div>
      <div style={{fontSize: 38, fontWeight: 850, marginTop: 10, lineHeight: 1.15}}>Never posted at all</div>
      <div style={{display: 'flex', gap: 6, marginTop: 16}}>{(['before', 'after', 'video', 'bath'] as Kind[]).map((k, i) => <Photo key={i} kind={k} size={70} dim={.7} />)}</div>
    </Rise>
    {showMeter && <Rise p={p} at={missing - 6} style={card(630, 300, 370, 580, {padding: 28, display: 'flex', flexDirection: 'column', alignItems: 'center'})}>
      <div style={{...label, alignSelf: 'flex-start'}}>Missed</div>
      <div style={{fontSize: 34, fontWeight: 800, alignSelf: 'flex-start', marginTop: 8, lineHeight: 1.2}}>Showing your quality</div>
      <div style={{position: 'relative', width: 80, height: 300, marginTop: 30, borderRadius: 40, background: C.faint, overflow: 'hidden'}}>
        <div style={{position: 'absolute', left: 4, right: 4, bottom: 4, height: '86%', borderRadius: 36, border: '3px dashed rgba(52,211,153,.7)', boxSizing: 'border-box', opacity: ghost}} />
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: `${15 * eOut(p, missing, 14)}%`, borderRadius: 40, background: 'linear-gradient(0deg,#FB7185,#FBBF24)'}} />
      </div>
      <div style={{fontSize: 24, fontWeight: 700, color: '#6EE7B7', marginTop: 14, opacity: ghost}}>what it could be</div>
      <div style={{fontSize: 28, fontWeight: 750, color: C.bad, marginTop: 8, opacity: lin(p, trust - 4, 10)}}>…and their trust</div>
    </Rise>}
  </Top>;
};

/* 5 · Turn projects into simple videos: the space before, the problem, what you did to fix it. */
export const M16Story: React.FC<VisualProps> = (p) => {
  const [turning, videos, before, problem, walk, fix] = cues(p, [10, 73, 110, 197, 247, 311]);
  const clips = [['Before', 'condition of the space', before, '#57534E'], ['The problem', 'what the homeowner had', problem, '#F59E0B'], ['The fix', 'what you actually did', walk, '#34D399']] as const;
  const T0 = before - 6, T1 = fix + 30;
  const play = clamp((p.frame - T0) / (T1 - T0)); // linear: constant motion
  const active: number = p.frame >= walk - 4 ? 2 : p.frame >= problem - 4 ? 1 : p.frame >= before - 4 ? 0 : -1;
  const cur = active >= 0 ? clips[active as 0 | 1 | 2] : undefined;
  return <Top p={p} tint={['#F59E0B', '#4F46E5', '#059669']}>
    <Kinetic p={p} at={turning - 8} text="Turn projects into simple videos" size={56} top={20} />
    <Rise p={p} at={turning} style={card(80, 110, 920, 470, {padding: 0})}>
      <div style={{position: 'absolute', inset: 30, borderRadius: 26, overflow: 'hidden', background: '#0B0D1A'}}>
        {clips.map(([t, , , c], i) => <div key={t} style={{position: 'absolute', inset: 0, background: `radial-gradient(circle at 40% 40%, ${c}, #0B0D1A 75%)`, opacity: active === i ? 1 : 0}} />)}
        {cur && <div style={{position: 'absolute', left: 30, bottom: 30, padding: '14px 24px', borderRadius: 18, background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(12px)'}}>
          <div style={{fontSize: 40, fontWeight: 850}}>{cur[0]}</div><div style={{fontSize: 24, color: C.mute}}>{cur[1]}</div></div>}
        {active < 0 && <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}><div style={{width: 110, height: 110, borderRadius: 55, background: 'rgba(255,255,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><svg width="40" height="40" viewBox="0 0 40 40"><path d="M12 6L34 20L12 34Z" fill="#FFF" /></svg></div></div>}
      </div>
    </Rise>
    <Rise p={p} at={videos - 6} style={card(80, 610, 920, 270, {padding: '28px 30px'})}>
      <div style={label}>Timeline</div>
      <div style={{position: 'relative', display: 'flex', gap: 12, marginTop: 22}}>
        {clips.map(([t, , at, c], i) => { const k = eOut(p, at - 6, 12); return <div key={t} style={{flex: 1, height: 120, borderRadius: 20, background: `linear-gradient(160deg, ${c}, rgba(255,255,255,.06))`, opacity: k, transform: `translateY(${(1 - k) * 20}px)`, border: active === i ? '2.5px solid #FFF' : '1.5px solid rgba(255,255,255,.15)', display: 'flex', alignItems: 'flex-end', padding: 16, boxSizing: 'border-box', fontSize: 28, fontWeight: 800}}>{t}</div>; })}
        {p.frame >= T0 && <div style={{position: 'absolute', top: -14, bottom: -14, left: `${play * 100}%`, width: 4, borderRadius: 2, background: '#FFF', boxShadow: '0 0 16px #FFF'}} />}
      </div>
    </Rise>
  </Top>;
};

/* 6 · Also: answer common questions, explain what affects the cost, show details that separate quality from rushed. */
export const M16Ideas: React.FC<VisualProps> = (p) => {
  const [questions, cost, details, rushed] = cues(p, [24, 75, 171, 240]);
  const cmp = eMove(p, rushed - 6, 24); // comparison slider moves on screen
  return <Top p={p} tint={['#7C3AED', '#0EA5E9', '#059669']}>
    <Rise p={p} at={0} style={{left: 80, top: 20}}><div style={{...label, color: '#A5B4FC'}}>More video ideas</div></Rise>
    <Rise p={p} at={questions - 6} style={card(80, 80, 440, 380, {padding: 30})}>
      <div style={label}>Common questions</div>
      {['How long will it take?', 'Do I need a permit?'].map((q, i) => <div key={q} style={{marginTop: 18, padding: '18px 22px', borderRadius: '24px 24px 24px 6px', background: 'rgba(255,255,255,.08)', fontSize: 28, fontWeight: 700, opacity: eOut(p, questions + i * 3, 10)}}>{q}</div>)}
    </Rise>
    <Rise p={p} at={cost - 6} style={card(560, 80, 440, 380, {padding: 30})}>
      <div style={label}>What affects cost</div>
      {['Materials', 'Size of the job', 'Hidden damage'].map((t, i) => <div key={t} style={{display: 'flex', alignItems: 'center', gap: 14, marginTop: 20, opacity: eOut(p, cost + i * 3, 10)}}>
        <div style={{width: 12, height: 12, borderRadius: 6, background: C.warn}} /><div style={{fontSize: 30, fontWeight: 700}}>{t}</div></div>)}
    </Rise>
    <Rise p={p} at={details - 6} style={card(80, 490, 920, 390, {padding: 30})}>
      <div style={{display: 'flex', justifyContent: 'space-between', ...label}}><span style={{color: C.bad}}>Rushed</span><span>The details</span><span style={{color: C.good}}>Quality</span></div>
      <div style={{position: 'relative', height: 260, marginTop: 20, borderRadius: 22, overflow: 'hidden'}}>
        <div style={{position: 'absolute', inset: 0, background: 'repeating-linear-gradient(100deg,#57534E 0 40px,#44403C 40px 46px)'}} />
        <div style={{position: 'absolute', inset: 0, background: 'repeating-linear-gradient(90deg,#5EEAD4 0 60px,#2DD4BF 60px 62px)', clipPath: `inset(0 0 0 ${100 - 50 * cmp - 50 * (1 - cmp) * 0}%)`}} />
        <div style={{position: 'absolute', top: 0, bottom: 0, left: `${100 - 50 * cmp}%`, width: 6, marginLeft: -3, background: '#FFF', boxShadow: '0 0 20px rgba(255,255,255,.8)', opacity: cmp > 0 ? 1 : 0}} />
      </div>
    </Rise>
  </Top>;
};

/* 7 · You don't need a professional film crew; your phone and your projects are enough. */
export const M16Phone: React.FC<VisualProps> = (p) => {
  const [professional, crew, phone, enough] = cues(p, [32, 62, 100, 184]);
  const strike = eOut(p, crew + 6, 10);
  const rec = .5 + .5 * Math.sin(p.frame / 6); // constant pulse
  return <Top p={p} tint={['#BE123C', '#059669', '#4F46E5']}>
    <Rise p={p} at={0} style={card(80, 20, 920, 250, {display: 'flex', alignItems: 'center', gap: 36, padding: '0 44px', opacity: 1 - .5 * lin(p, phone, 12)})}>
      <svg width="170" height="130" viewBox="0 0 170 130" style={{flex: 'none', opacity: eOut(p, professional - 8, 12)}}><rect x="10" y="30" width="100" height="64" rx="10" fill="rgba(255,255,255,.3)" /><path d="M110 50L160 30V94L110 74Z" fill="rgba(255,255,255,.3)" /><circle cx="40" cy="18" r="16" fill="rgba(255,255,255,.25)" /><circle cx="80" cy="18" r="16" fill="rgba(255,255,255,.25)" /><path d="M40 94L20 128M80 94L100 128M60 94V128" stroke="rgba(255,255,255,.3)" strokeWidth="5" /></svg>
      <div style={{position: 'relative', fontSize: 46, fontWeight: 850, lineHeight: 1.15}}>A professional film crew
        <div style={{position: 'absolute', left: -6, right: -6, top: '50%', height: 6, borderRadius: 3, background: C.bad, transform: `scaleX(${strike})`, transformOrigin: 'left'}} /></div>
    </Rise>
    <Rise p={p} at={phone - 6} style={card(330, 300, 420, 580, {borderRadius: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 60})}>
      <div style={{position: 'absolute', left: 160, top: 18, width: 100, height: 26, borderRadius: 13, background: 'rgba(0,0,0,.5)'}} />
      <div style={{position: 'relative'}}><Photo kind="after" size={340} />
        <div style={{position: 'absolute', left: 16, top: 16, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 12, background: 'rgba(0,0,0,.55)', fontSize: 22, fontWeight: 800}}>
          <div style={{width: 14, height: 14, borderRadius: 7, background: '#EF4444', opacity: rec}} />REC</div></div>
      <div style={{marginTop: 34, width: 96, height: 96, borderRadius: 48, border: '6px solid #FFF', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><div style={{width: 64, height: 64, borderRadius: 32, background: '#EF4444', transform: `scale(${pop(.6 + .4 * rec)})`}} /></div>
    </Rise>
    <Rise p={p} at={enough - 4} style={{left: 785, top: 540}}><Pill color={C.good} solid>It's enough</Pill></Rise>
  </Top>;
};
