import React from 'react';
import {Easing} from 'remotion';
import {clamp} from '../../motion';
import type {VisualProps} from '../../types';
import {Markup, Logo, Emoji, Burn} from '../pack/packKit';

// Motion-graphics layer for the FAQ-style video23 (presenter full screen). Each moment gets a different
// effect: kinetic slams, logo springs, emoji bursts, a viewfinder, a before/after wipe, a film strip,
// rising chat bubbles, a clip splitting into posts, a filling calendar, a website rising, reach rings.
// Everything lives in the top band (y < 470) or the bottom band (y > 1290) to keep the face and captions clear.

const EO = Easing.bezier(0.23, 1, 0.32, 1), EIO = Easing.bezier(0.77, 0, 0.175, 1);
const RED = '#EF2B2D', INK = '#111', FONT = 'Inter, "Segoe UI", Arial, sans-serif';
const k = (f: number, a: number, len = 10) => EO(clamp((f - a) / len));
/* visible window with ease-out in and ease-in-out out */
const win = (f: number, a: number, b: number, len = 10) => k(f, a, len) * (1 - EIO(clamp((f - b) / 8)));
const shadow = '0 10px 30px rgba(0,0,0,.35)';

const Pill: React.FC<{children: React.ReactNode; bg?: string; color?: string; size?: number}> = ({children, bg = 'rgba(17,17,17,.82)', color = '#fff', size = 30}) =>
  <div style={{display: 'inline-flex', alignItems: 'center', gap: 10, padding: '10px 22px', borderRadius: 999, background: bg, color, fontSize: size, fontWeight: 800, fontFamily: FONT, boxShadow: shadow, whiteSpace: 'nowrap'}}>{children}</div>;

/* Kinetic slam: text lands from 1.35x with a quick settle. */
const Slam: React.FC<{f: number; at: number; until: number; x: number; y: number; size?: number; color?: string; children: React.ReactNode; rot?: number}> = ({f, at, until, x, y, size = 92, color = '#fff', children, rot = 0}) => {
  const t = clamp((f - at) / 7), s = 1.35 - .35 * EO(t), o = win(f, at, until, 4);
  return <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${s})`, opacity: o, fontSize: size, fontWeight: 900, fontFamily: FONT, color, letterSpacing: -2, textShadow: '0 6px 24px rgba(0,0,0,.45)', whiteSpace: 'nowrap'}}>{children}</div>;
};
/* Masked word rise (each word slides up out of a mask). */
const Rise: React.FC<{f: number; words: Array<[string, number, string]>; until: number; x: number; y: number; size?: number}> = ({f, words, until, x, y, size = 96}) =>
  <div style={{position: 'absolute', left: x, top: y, transform: 'translate(-50%, 0)', display: 'flex', gap: 22, opacity: 1 - EIO(clamp((f - until) / 8))}}>
    {words.map(([w, at, c]) => <div key={w} style={{overflow: 'hidden', height: size * 1.1}}><div style={{transform: `translateY(${(1 - k(f, at, 8)) * 110}%)`, fontSize: size, fontWeight: 900, fontFamily: FONT, color: c, letterSpacing: -2, lineHeight: 1.1, textShadow: '0 6px 24px rgba(0,0,0,.4)'}}>{w}</div></div>)}
  </div>;
/* Spring pop for logos / emojis (a small overshoot, since something is landing). */
const Pop: React.FC<{f: number; at: number; until: number; x: number; y: number; size: number; children: React.ReactNode; float?: boolean}> = ({f, at, until, x, y, size, children, float}) => {
  const t = clamp((f - at) / 10), s = t < 1 ? .6 + .5 * EO(t) - .1 * Math.sin(t * Math.PI) : 1;
  return <div style={{position: 'absolute', left: x - size / 2, top: y - size / 2 + (float ? 6 * Math.sin(f / 12) : 0), width: size, height: size, transform: `scale(${s})`, opacity: win(f, at, until, 6), filter: 'drop-shadow(0 10px 20px rgba(0,0,0,.35))'}}>{children}</div>;
};

export const Overlay23: React.FC<VisualProps> = ({frame: f}) => {
  // Viewfinder (documenting)
  const vf = win(f, 914, 1004, 8);
  const recOn = Math.floor(f / 15) % 2 === 0;
  // Phone feed (scrolling)
  const phoneIn = win(f, 712, 850, 12), phoneX = 1080 - 330 * EO(clamp((f - 712) / 14));
  // Before/after wipe
  const wipe = EIO(clamp((f - 1030) / 30));
  // Clip → 4 posts
  const split = EIO(clamp((f - 1396) / 18));
  // Calendar fill
  const cal = clamp((f - 1490) / 70);
  // Reach rings
  const ring = clamp((f - 1969) / 50);
  return <div style={{position: 'absolute', inset: 0, fontFamily: FONT}}>
    {/* 10-hour workday: slam + clock ring draw */}
    <Slam f={f} at={104} until={136} x={470} y={190} size={84}>10-HOUR <span style={{color: RED}}>WORKDAY</span></Slam>
    <div style={{position: 'absolute', left: 820, top: 120, width: 150, height: 150, opacity: win(f, 110, 196)}}>
      <svg width="150" height="150" style={{position: 'absolute', transform: 'rotate(-90deg)'}}><circle cx="75" cy="75" r="66" fill="none" stroke="rgba(255,255,255,.25)" strokeWidth="10" /><circle cx="75" cy="75" r="66" fill="none" stroke={RED} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${415 * EIO(clamp((f - 110) / 50))} 415`} /></svg>
      <Emoji name="alarm clock" style={{position: 'absolute', left: 33, top: 33, width: 84}} />
    </div>
    {/* Instagram: logo spring + question bubble */}
    <Pop f={f} at={204} until={250} x={540} y={210} size={170} float><Logo name="INSTAGRAM" style={{width: '100%', height: '100%'}} /></Pop>
    <div style={{position: 'absolute', left: 640, top: 110, opacity: win(f, 212, 250), transform: `scale(${.9 + .1 * k(f, 212)})`}}><Pill bg="#fff" color={INK}>What do I post?</Pill></div>
    {/* The business load: emoji burst arc */}
    {[['clipboard', 246, 'Projects'], ['Bust in Silhouette', 288, 'Customers'], ['package', 330, 'Materials'], ['building construction', 385, 'The business']].map(([e, at, t], i) => {
      const x = 170 + i * 250, y = 230 - Math.sin((i + .5) / 4 * Math.PI) * 70;
      return <React.Fragment key={t as string}>
        <Pop f={f} at={at as number} until={420} x={x} y={y} size={120}><Emoji name={e as string} style={{width: '100%'}} /></Pop>
        <div style={{position: 'absolute', left: x, top: y + 80, transform: 'translate(-50%,0)', opacity: win(f, (at as number) + 4, 420)}}><Pill size={24}>{t}</Pill></div>
      </React.Fragment>;
    })}
    {/* Every single day: masked word rise (bottom band) */}
    <Rise f={f} until={522} x={540} y={1330} words={[['POST', 474, '#fff'], ['EVERY', 482, '#fff'], ['DAY.', 491, RED]]} />
    {/* Full-time job: tape label + hand-drawn box */}
    <div style={{position: 'absolute', left: 540, top: 200, whiteSpace: 'nowrap', transform: `translate(-50%,-50%) rotate(-4deg) scaleX(${k(f, 580, 8)})`, opacity: win(f, 580, 638, 4), padding: '14px 36px', background: RED, color: '#fff', fontSize: 58, fontWeight: 900, letterSpacing: 1, boxShadow: shadow}}>ANOTHER FULL-TIME JOB</div>
    {/* Scrolling: phone slides in from the right with a moving feed */}
    <div style={{position: 'absolute', left: phoneX, top: 1290, width: 300, height: 560, borderRadius: 44, background: '#111', padding: 12, boxSizing: 'border-box', opacity: phoneIn, boxShadow: shadow}}>
      <div style={{width: '100%', height: '100%', borderRadius: 34, overflow: 'hidden', background: '#fafafa', position: 'relative'}}>
        {Array.from({length: 8}, (_, i) => { const y = ((i * 170) - (f - 712) * 9) % 1360; const yy = y < -170 ? y + 1360 : y; return <div key={i} style={{position: 'absolute', left: 12, right: 12, top: yy, height: 150, borderRadius: 16, background: ['#FDE68A', '#BFDBFE', '#FBCFE8', '#BBF7D0'][i % 4]}} />; })}
      </div>
    </div>
    <Pop f={f} at={818} until={856} x={250} y={1450} size={160}><Emoji name="Selfie" style={{width: '100%'}} /></Pop>
    <div style={{position: 'absolute', left: 250, top: 1560, transform: 'translate(-50%,0)', opacity: win(f, 818, 846)}}><Pill>Influencer?</Pill></div>
    <Markup name="x-mark-red" at={826} x={60} y={1300} w={380} dur={40} />
    {/* Documenting: viewfinder brackets + REC */}
    <div style={{position: 'absolute', inset: 0, opacity: vf}}>
      {[[60, 120, 0], [1020, 120, 90], [1020, 1160, 180], [60, 1160, 270]].map(([x, y, r], i) => <svg key={i} width="90" height="90" style={{position: 'absolute', left: x - (r === 90 || r === 180 ? 90 : 0), top: y - (r === 180 || r === 270 ? 90 : 0), transform: `rotate(${r}deg)`}}><path d="M6 84V6H84" fill="none" stroke="#fff" strokeWidth="8" strokeLinecap="round" /></svg>)}
      <div style={{position: 'absolute', left: 110, top: 150, display: 'flex', alignItems: 'center', gap: 12, color: '#fff', fontSize: 34, fontWeight: 800, textShadow: '0 2px 8px rgba(0,0,0,.6)'}}><span style={{width: 22, height: 22, borderRadius: 11, background: RED, opacity: recOn ? 1 : .25}} />REC</div>
    </div>
    {/* Before / after wipe card (bottom band) */}
    <div style={{position: 'absolute', left: 190, top: 1330, width: 700, height: 360, borderRadius: 30, overflow: 'hidden', boxShadow: shadow, opacity: win(f, 1012, 1112, 12), transform: `translateY(${(1 - k(f, 1012, 12)) * 40}px)`}}>
      <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(135deg,#a8a29e,#57534e)'}} />
      <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(135deg,#7dd3fc,#2563eb)', clipPath: `inset(0 0 0 ${100 - 100 * wipe}%)`}} />
      <svg viewBox="0 0 100 60" style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}><path d="M30 50V30L50 16L70 30V50Z" fill="rgba(255,255,255,.6)" /></svg>
      <div style={{position: 'absolute', top: 0, bottom: 0, left: `${100 - 100 * wipe}%`, width: 6, marginLeft: -3, background: '#fff'}} />
      <div style={{position: 'absolute', left: 20, top: 20}}><Pill size={24}>BEFORE</Pill></div><div style={{position: 'absolute', right: 20, top: 20, opacity: wipe}}><Pill size={24} bg={RED}>AFTER</Pill></div>
    </div>
    {/* Crew clips: film strip marquee (top band) */}
    <div style={{position: 'absolute', left: 0, right: 0, top: 90, height: 230, opacity: win(f, 1118, 1262, 10), overflow: 'hidden'}}>
      <div style={{position: 'absolute', top: 0, left: 60 - (f - 1118) * 3, display: 'flex', gap: 14, padding: '16px 14px', background: '#111', borderRadius: 12}}>
        {Array.from({length: 8}, (_, i) => <div key={i} style={{width: 250, height: 170, borderRadius: 8, background: ['linear-gradient(135deg,#fdba74,#ea580c)', 'linear-gradient(135deg,#86efac,#16a34a)', 'linear-gradient(135deg,#93c5fd,#1d4ed8)'][i % 3], display: 'flex', alignItems: 'flex-end', padding: 12, boxSizing: 'border-box', color: '#fff', fontWeight: 800, fontSize: 24}}></div>)}
      </div>
    </div>
    {/* Questions homeowners ask: chat bubbles rising (bottom band) */}
    {['How long will it take?', 'What affects the price?', 'Do you clean up after?'].map((q, i) => { const at = 1268 + i * 14, t = k(f, at, 12); return <div key={q} style={{position: 'absolute', left: i % 2 ? 420 : 120, top: 1330 + i * 110 + (1 - t) * 60, opacity: win(f, at, 1384, 12)}}>
      <div style={{padding: '18px 28px', borderRadius: '28px 28px 28px 8px', background: i % 2 ? '#fff' : '#2563EB', color: i % 2 ? INK : '#fff', fontSize: 32, fontWeight: 700, boxShadow: shadow}}>{q}</div></div>; })}
    {/* One clip → multiple posts (bottom band) */}
    {[0, 1, 2, 3].map(i => { const tx = (i - 1.5) * 230 * split, w = 380 - 190 * split; return <div key={i} style={{position: 'absolute', left: 540 + tx - w / 2, top: 1340, width: w, height: w * 1.4, borderRadius: 22, background: ['linear-gradient(160deg,#f9a8d4,#db2777)', 'linear-gradient(160deg,#a5b4fc,#4f46e5)', 'linear-gradient(160deg,#fde68a,#f59e0b)', 'linear-gradient(160deg,#99f6e4,#0d9488)'][i], boxShadow: shadow, opacity: win(f, 1390, 1480, 10), display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <svg width="40" height="40" viewBox="0 0 40 40" style={{opacity: .9}}><path d="M14 10L30 20L14 30Z" fill="#fff" /></svg></div>; })}
    <div style={{position: 'absolute', left: 540, top: 1290, transform: 'translate(-50%,-50%)', opacity: win(f, 1396, 1454)}}><Pill bg={RED}>1 clip → multiple posts</Pill></div>
    {/* Schedule ahead: calendar dots filling (bottom band) */}
    <div style={{position: 'absolute', left: 230, top: 1330, width: 620, padding: 26, borderRadius: 30, background: 'rgba(17,17,17,.82)', boxShadow: shadow, opacity: win(f, 1484, 1626, 12), transform: `translateY(${(1 - k(f, 1484, 12)) * 30}px)`}}>
      <div style={{color: '#fff', fontSize: 28, fontWeight: 800, marginBottom: 16}}>Content calendar</div>
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 12}}>{Array.from({length: 14}, (_, i) => <div key={i} style={{height: 56, borderRadius: 12, background: i / 14 < cal ? (i % 3 === 0 ? RED : '#2563EB') : 'rgba(255,255,255,.12)', transform: `scale(${i / 14 < cal ? 1 : .9})`}} />)}</div>
    </div>
    <Markup name="check-mark" at={1560} x={720} y={1250} w={240} dur={66} />
    {/* Google presence + website rising */}
    <Pop f={f} at={1684} until={1858} x={540} y={210} size={200} float><Logo name="GOOGLE" style={{width: '100%', height: '100%'}} /></Pop>
    <div style={{position: 'absolute', left: 240, top: 1310 + (1 - k(f, 1716, 14)) * 120, width: 600, height: 380, borderRadius: 24, background: '#fff', boxShadow: shadow, opacity: win(f, 1716, 1856, 12), overflow: 'hidden'}}>
      <div style={{height: 46, background: '#f1f1f4', display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px'}}>{['#ff5f57', '#febc2e', '#28c840'].map(c => <span key={c} style={{width: 14, height: 14, borderRadius: 7, background: c}} />)}<span style={{marginLeft: 14, fontSize: 20, color: '#888'}}>yourbusiness.com</span></div>
      <div style={{padding: 26}}><div style={{fontSize: 40, fontWeight: 900, color: INK}}>Your Business</div><div style={{fontSize: 24, color: '#666', marginTop: 6}}>Projects · Reviews · Get a quote</div>
        <div style={{display: 'flex', gap: 12, marginTop: 22}}>{[0, 1, 2].map(i => <div key={i} style={{flex: 1, height: 120, borderRadius: 14, background: ['#fdba74', '#93c5fd', '#86efac'][i]}} />)}</div></div>
    </div>
    {/* Ads: logos spring + reach rings beyond followers */}
    <Pop f={f} at={1906} until={2046} x={400} y={210} size={160} float><Logo name="GOOGLE ADS" style={{width: '100%', height: '100%'}} /></Pop>
    <Pop f={f} at={1912} until={2046} x={680} y={210} size={160} float><Logo name="facebook" style={{width: '100%', height: '100%'}} /></Pop>
    <div style={{position: 'absolute', left: 540, top: 1500, opacity: win(f, 1960, 2046, 10)}}>
      {[0, 1, 2].map(i => { const r = 60 + 230 * clamp(ring * 1.4 - i * .25); return <div key={i} style={{position: 'absolute', left: -r, top: -r * .5, width: 2 * r, height: r, borderRadius: '50%', border: `4px solid ${i === 0 ? '#fff' : RED}`, opacity: 1 - i * .25}} />; })}
      <div style={{position: 'absolute', transform: 'translate(-50%,-50%)'}}><Pill bg="#fff" color={INK}>Followers</Pill></div>
      <div style={{position: 'absolute', left: 120, top: 70, opacity: k(f, 1990)}}><Pill bg={RED}>+ beyond</Pill></div>
    </div>
    {/* System: spinning gear + hand-drawn circle */}
    <Pop f={f} at={2080} until={2200} x={540} y={210} size={170}><div style={{width: '100%', height: '100%', transform: `rotate(${f * 3}deg)`}}><Emoji name="Gear" style={{width: '100%'}} /></div></Pop>
    <Markup name="circle---red" at={2096} x={300} y={75} w={480} dur={100} />
    <Slam f={f} at={2078} until={2122} x={540} y={1400} size={84}>A MARKETING <span style={{color: RED}}>SYSTEM</span></Slam>
    {/* Great work: trophy + burn flash; right people: magnifier */}
    <Pop f={f} at={2350} until={2440} x={540} y={210} size={190}><Emoji name="Trophy" style={{width: '100%'}} /></Pop>
    <Burn at={2342} n={2} opacity={.45} />
    <Pop f={f} at={2444} until={2490} x={540} y={210} size={170}><Emoji name="Face with Monacle" style={{width: '100%'}} /></Pop>
    <div style={{position: 'absolute', left: 540, top: 1400, transform: 'translate(-50%,-50%)', opacity: win(f, 2446, 2490)}}><Pill bg={RED} size={40}>The right people</Pill></div>
  </div>;
};
