import React from 'react';
import {Easing} from 'remotion';
import {clamp} from '../../motion';
import type {VisualProps} from '../../types';
import {Markup, Logo, Emoji, Burn} from '../pack/packKit';

// Motion-graphics layer for video26 ("before you write off Facebook ads"). Presenter full screen,
// highlight captions at 72%. Top band y < 470, bottom band y > 1480. No overlay text repeats speech.

const EO = Easing.bezier(0.23, 1, 0.32, 1), EIO = Easing.bezier(0.77, 0, 0.175, 1);
const RED = '#EF2B2D', BLUE = '#2563EB', GREEN = '#16A34A', FONT = 'Inter, "Segoe UI", Arial, sans-serif';
const k = (f: number, a: number, len = 10) => EO(clamp((f - a) / len));
const win = (f: number, a: number, b: number, len = 10) => k(f, a, len) * (1 - EIO(clamp((f - b) / 8)));
const shadow = '0 10px 30px rgba(0,0,0,.35)';
const Pop: React.FC<{f: number; at: number; until: number; x: number; y: number; size: number; children: React.ReactNode}> = ({f, at, until, x, y, size, children}) => {
  const t = clamp((f - at) / 10), s = t < 1 ? .6 + .5 * EO(t) - .1 * Math.sin(t * Math.PI) : 1;
  return <div style={{position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, transform: `scale(${s})`, opacity: win(f, at, until, 6), filter: 'drop-shadow(0 10px 20px rgba(0,0,0,.35))'}}>{children}</div>;
};
const Funnel: React.FC<{c?: string}> = ({c = '#fff'}) => <svg viewBox="0 0 100 100" width="100%" height="100%"><path d="M10 14H90L58 54V86L42 78V54Z" fill={c} /></svg>;

/* Puzzle piece (a square with a nub) */
const Piece: React.FC<{c: string; children: React.ReactNode}> = ({c, children}) =>
  <div style={{position: 'relative', width: 170, height: 170, borderRadius: 26, background: c, boxShadow: shadow, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
    <div style={{position: 'absolute', right: -22, top: 60, width: 44, height: 50, borderRadius: 22, background: c}} />{children}</div>;

export const Overlay26: React.FC<VisualProps> = ({frame: f}) => {
  // diagnostic icons, each lights up on its question
  const diag = [['camera with flash', 506], ['Bullseye', 655], ['funnel', 721], ['Megaphone', 778], ['alarm clock', 847]] as const;
  const active = diag.reduce((a, [, at], i) => (f >= at - 4 ? i : a), -1);
  // throw money into the void
  const toss = clamp((f - 236) / 30);
  // puzzle pieces snap together
  const pieces = [['Speech Balloon', 1121, '#FDE68A'], ['Bust in Silhouette', 1155, '#BFDBFE'], ['Present Gift', 1190, '#FBCFE8'], ['Gear', 1225, '#BBF7D0']] as const;
  // interest → estimate → job morph along a track
  const conv = clamp((f - 1262) / 120);
  // tuning knobs
  const knob = (at: number) => -120 + 200 * EIO(clamp((f - at) / 18));
  return <div style={{position: 'absolute', inset: 0, fontFamily: FONT}}>
    {/* tried Facebook ads, no jobs */}
    <Pop f={f} at={22} until={140} x={420} y={230} size={170}><Logo name="facebook" style={{width: '100%', height: '100%'}} /></Pop>
    <Pop f={f} at={74} until={140} x={680} y={230} size={160}><Emoji name="open box" style={{width: '100%'}} /></Pop>
    {/* throw money at something, nothing to show for it */}
    <div style={{position: 'absolute', left: 820, top: 150, width: 200, height: 200, marginLeft: -100, marginTop: -100, borderRadius: '50%', background: 'radial-gradient(circle, #0B0B12 35%, rgba(0,0,0,0) 70%)', opacity: win(f, 228, 330, 10), transform: `rotate(${f * 4}deg) scale(${.9 + .1 * k(f, 228)})`}} />
    {[0, 1, 2].map(i => { const t = clamp(toss * 1.2 - i * .15); return <div key={i} style={{position: 'absolute', left: 120 + 640 * EIO(t) + i * 30, top: 110 + 10 * EIO(t), width: 110 * (1 - .8 * EIO(t)), opacity: win(f, 236, 330, 6) * (1 - clamp((t - .85) / .15)), transform: `rotate(${t * 360}deg)`}}><Emoji name="Money with Wings" style={{width: '100%'}} /></div>; })}
    {/* five diagnostic questions as icons that light up in turn (top band) */}
    <div style={{position: 'absolute', left: 90, top: 150, display: 'flex', gap: 22, opacity: win(f, 500, 970, 12)}}>
      {diag.map(([e, at], i) => { const on = i === active, done = i < active; return <div key={e} style={{position: 'relative', width: 160, height: 160, borderRadius: 34, background: on ? '#fff' : 'rgba(17,17,17,.7)', boxShadow: on ? `0 0 40px rgba(239,43,45,.7), ${shadow}` : shadow, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${on ? 1.12 : done ? .92 : 1})`, opacity: f >= at - 10 ? 1 : .35}}>
        <div style={{width: 100, height: 100}}>{e === 'funnel' ? <Funnel c={on ? '#111' : '#fff'} /> : <Emoji name={e} style={{width: '100%'}} />}</div>
        <div style={{position: 'absolute', right: -10, top: -10, width: 44, height: 44, borderRadius: 22, background: RED, color: '#fff', fontWeight: 900, fontSize: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: f >= at ? 1 : 0}}>?</div>
      </div>; })}
    </div>
    {/* more than putting money behind a post: a boosted post gets the red X (bottom band) */}
    <div style={{position: 'absolute', left: 340, top: 1500, width: 400, height: 330, borderRadius: 26, background: '#fff', boxShadow: shadow, padding: 18, boxSizing: 'border-box', opacity: win(f, 1040, 1100, 10)}}>
      <div style={{height: 210, borderRadius: 16, background: 'linear-gradient(135deg,#93c5fd,#2563eb)'}} />
      <div style={{marginTop: 18, height: 54, borderRadius: 14, background: BLUE, color: '#fff', fontWeight: 900, fontSize: 26, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>▲</div>
    </div>
    <Markup name="x-mark-red" at={1076} x={340} y={1460} w={400} dur={28} />
    {/* message + audience + offer + process: puzzle pieces snap together (bottom band) */}
    <div style={{position: 'absolute', left: 120, top: 1520, display: 'flex', gap: 30 - 30 * EIO(clamp((f - 1240) / 14)), opacity: win(f, 1112, 1256, 10)}}>
      {pieces.map(([e, at, c]) => { const t = EO(clamp((f - (at as number) + 4) / 12)); return <div key={e as string} style={{opacity: t, transform: `translateY(${(1 - t) * -80}px) rotate(${(1 - t) * 20}deg)`}}><Piece c={c as string}><Emoji name={e as string} style={{width: 90}} /></Piece></div>; })}
    </div>
    {/* interest → estimate → paying job: one shape travels and transforms (top band) */}
    <div style={{position: 'absolute', left: 120, top: 180, width: 840, height: 200, opacity: win(f, 1258, 1400, 10)}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 96, height: 8, borderRadius: 4, background: 'rgba(255,255,255,.35)'}} />
      {[0, .5, 1].map((p, i) => <div key={i} style={{position: 'absolute', left: `${p * 92}%`, top: 84, width: 32, height: 32, borderRadius: 16, background: conv >= p ? GREEN : 'rgba(255,255,255,.4)'}} />)}
      <div style={{position: 'absolute', left: `${EIO(conv) * 88}%`, top: 10, width: 120, height: 120}}>
        {conv < .4 ? <div style={{width: 120, height: 120, borderRadius: 60, background: BLUE, boxShadow: '0 0 30px rgba(37,99,235,.8)'}} />
          : conv < .8 ? <div style={{width: 100, height: 120, margin: '0 10px', borderRadius: 12, background: '#fff', boxShadow: shadow, padding: 12, boxSizing: 'border-box'}}>{[0, 1, 2].map(i => <div key={i} style={{height: 10, borderRadius: 5, background: '#D1D5DB', marginTop: i ? 10 : 0}} />)}</div>
          : <div style={{position: 'relative'}}><Emoji name="house" style={{width: 120}} /><div style={{position: 'absolute', right: -6, top: -6, padding: '4px 10px', borderRadius: 999, background: GREEN, color: '#fff', fontWeight: 900, fontSize: 24}}>$</div></div>}
      </div>
    </div>
    {/* is your sales process converting them: a machine turns grey dots into green (bottom band) */}
    <div style={{position: 'absolute', left: 140, top: 1540, width: 800, height: 220, opacity: win(f, 1590, 1666, 10)}}>
      <div style={{position: 'absolute', left: 300, top: 30, width: 200, height: 160, borderRadius: 26, background: 'rgba(17,17,17,.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: shadow}}><div style={{width: 90, transform: `rotate(${f * 4}deg)`}}><Emoji name="Gear" style={{width: '100%'}} /></div></div>
      {Array.from({length: 6}, (_, i) => { const t = (((f - 1590) / 40) + i / 6) % 1; const x = t * 760, out = x > 500; return <div key={i} style={{position: 'absolute', left: x, top: 92, width: 34, height: 34, borderRadius: 17, background: out ? GREEN : '#9CA3AF', opacity: x > 300 && x < 500 ? 0 : 1}} />; })}
    </div>
    {/* not every campaign works: creative, offer, targeting get tuned (bottom band knobs) */}
    <div style={{position: 'absolute', left: 170, top: 1520, display: 'flex', gap: 60, opacity: win(f, 1770, 1930, 10)}}>
      {[['clipboard', 1784], ['Present Gift', 1841], ['Bullseye', 1887]].map(([e, at]) => <div key={e as string} style={{opacity: k(f, (at as number) - 6), textAlign: 'center'}}>
        <div style={{position: 'relative', width: 180, height: 180, borderRadius: 90, background: '#fff', boxShadow: shadow}}>
          <div style={{position: 'absolute', inset: 22, borderRadius: '50%', border: '8px solid #E5E7EB'}} />
          <div style={{position: 'absolute', left: 86, top: 18, width: 8, height: 72, borderRadius: 4, background: RED, transformOrigin: '4px 72px', transform: `rotate(${knob(at as number)}deg)`}} />
          <div style={{position: 'absolute', left: 60, top: 60, width: 60}}><Emoji name={e as string} style={{width: '100%'}} /></div>
        </div></div>)}
    </div>
    <Pop f={f} at={1767} until={1930} x={540} y={240} size={160}><Emoji name="nut and bolt" style={{width: '100%'}} /></Pop>
    {/* the goal isn't spending more: money stack crossed; profitable: chart + green glow */}
    <Pop f={f} at={2170} until={2230} x={540} y={240} size={170}><Emoji name="Money with Wings" style={{width: '100%'}} /></Pop>
    <Markup name="x-mark-red" at={2186} x={330} y={110} w={420} dur={44} />
    <Pop f={f} at={2240} until={2333} x={540} y={240} size={190}><div style={{width: '100%', height: '100%', filter: `drop-shadow(0 0 ${18 + 12 * Math.sin(f / 5)}px rgba(22,163,74,.9))`}}><Emoji name="Chart Increasing" style={{width: '100%'}} /></div></Pop>
    <Burn at={2296} n={2} opacity={.4} />
  </div>;
};
