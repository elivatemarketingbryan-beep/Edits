import React from 'react';
import {Easing} from 'remotion';
import {clamp} from '../../motion';
import type {VisualProps} from '../../types';
import {Markup, Emoji, Burn} from '../pack/packKit';

// Motion-graphics layer for video24 (questions to ask a marketing agency), presenter full screen.
// One distinct effect per moment, top band (y < 470) or bottom band (y > 1290); no overlay text repeats
// the spoken words (icons and shapes carry them; the captions carry the words).

const EO = Easing.bezier(0.23, 1, 0.32, 1), EIO = Easing.bezier(0.77, 0, 0.175, 1);
const RED = '#EF2B2D', BLUE = '#2563EB', GREEN = '#16A34A', INK = '#111', FONT = 'Inter, "Segoe UI", Arial, sans-serif';
const k = (f: number, a: number, len = 10) => EO(clamp((f - a) / len));
const win = (f: number, a: number, b: number, len = 10) => k(f, a, len) * (1 - EIO(clamp((f - b) / 8)));
const shadow = '0 10px 30px rgba(0,0,0,.35)';
const Pop: React.FC<{f: number; at: number; until: number; x: number; y: number; size: number; children: React.ReactNode; float?: boolean; rot?: number}> = ({f, at, until, x, y, size, children, float, rot = 0}) => {
  const t = clamp((f - at) / 10), s = t < 1 ? .6 + .5 * EO(t) - .1 * Math.sin(t * Math.PI) : 1;
  return <div style={{position: 'absolute', left: x - size / 2, top: y - size / 2 + (float ? 6 * Math.sin(f / 12) : 0), width: size, height: size, transform: `scale(${s}) rotate(${rot}deg)`, opacity: win(f, at, until, 6), filter: 'drop-shadow(0 10px 20px rgba(0,0,0,.35))'}}>{children}</div>;
};
const Doc: React.FC<{w: number; h: number; children?: React.ReactNode}> = ({w, h, children}) =>
  <div style={{width: w, height: h, borderRadius: 14, background: '#fff', boxShadow: shadow, padding: 18, boxSizing: 'border-box', position: 'relative'}}>
    {[0, 1, 2, 3].map(i => <div key={i} style={{height: 12, borderRadius: 6, background: '#E5E7EB', width: `${90 - i * 14}%`, marginTop: i ? 12 : 6}} />)}{children}</div>;

export const Overlay24: React.FC<VisualProps> = ({frame: f}) => {
  // 1 · got burned: flame flicker
  const flick = 1 + .06 * Math.sin(f / 2.2);
  // 2 · paid thousands: money flies off to the right; reports drop in
  const fly = clamp((f - 196) / 40);
  // 3 · a dream / sign the contract: signature draws
  const sign = EIO(clamp((f - 556) / 20));
  // 4 · vanity metrics struck (eye + cursor icons, no words)
  const strike = EO(clamp((f - 900) / 10));
  // 5 · which campaigns work → leads become jobs
  const bars = [.45, .85, .3];
  const flow = clamp((f - 1150) / 60);
  // 6 · test & adjust: slider knobs move
  const knob = (i: number) => .25 + .5 * EIO(clamp((f - 1452 - i * 6) / 20)) * (i % 2 ? .6 : 1);
  // 7 · end of month: days flip, report drops
  const day = Math.min(31, 1 + Math.floor(clamp((f - 1530) / 34) * 30));
  // 9 · no guarantee: some leads convert
  const leads = Array.from({length: 10}, (_, i) => ({ok: [1, 4, 7].includes(i), t: clamp((f - 1866 - i * 4) / 30)}));
  // 10 · improve performance: line rising
  const rise = EIO(clamp((f - 2120) / 40));
  return <div style={{position: 'absolute', inset: 0, fontFamily: FONT}}>
    {/* burned */}
    <Pop f={f} at={60} until={170} x={540} y={230} size={190}><div style={{width: '100%', height: '100%', transform: `scale(${flick})`, transformOrigin: '50% 90%'}}><Emoji name="Fire" style={{width: '100%'}} /></div></Pop>
    {/* paid thousands: money flies away; a few reports */}
    <div style={{position: 'absolute', left: 300 + 700 * EIO(fly), top: 230 - 120 * Math.sin(fly * Math.PI), width: 150, opacity: win(f, 190, 240, 6) * (1 - clamp((fly - .8) / .2)), transform: `rotate(${fly * 30}deg)`}}><Emoji name="Money with Wings" style={{width: '100%'}} /></div>
    {[0, 1, 2].map(i => <div key={i} style={{position: 'absolute', left: 270 + i * 190, top: 1510 + (1 - k(f, 240 + i * 5, 12)) * -60, opacity: win(f, 240 + i * 5, 430, 10), transform: `rotate(${(i - 1) * 6}deg)`}}><Doc w={170} h={220} /></div>)}
    <Markup name="computer-click" at={276} x={600} y={1490} w={360} dur={50} />
    <Markup name="x-mark-red" at={364} x={240} y={1440} w={600} dur={70} />
    {/* sell a dream → sign the contract */}
    <Pop f={f} at={526} until={600} x={260} y={230} size={150} float><Emoji name="Star Eyes" style={{width: '100%'}} /></Pop>
    <div style={{position: 'absolute', left: 420, top: 120, opacity: win(f, 540, 604, 10), transform: `translateY(${(1 - k(f, 540, 12)) * -30}px) rotate(3deg)`}}>
      <Doc w={380} h={300}><svg width="300" height="80" viewBox="0 0 300 80" style={{position: 'absolute', left: 30, bottom: 26}}><path d="M10 52C40 10 60 70 90 34S140 64 170 30S220 66 260 40" stroke={BLUE} strokeWidth="5" fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - sign} /><path d="M0 70H300" stroke="#9CA3AF" strokeWidth="2" /></svg></Doc>
    </div>
    {/* advice */}
    <Pop f={f} at={612} until={690} x={540} y={230} size={170}><div style={{width: '100%', height: '100%', filter: `drop-shadow(0 0 ${20 + 14 * Math.sin(f / 5)}px rgba(255,214,102,.9))`}}><Emoji name="Light Bulb" style={{width: '100%'}} /></div></Pop>
    {/* not just views or clicks: icon chips struck through */}
    {[['M0 0', 'eye'], ['M0 0', 'cursor']].map(([, kind], i) => <div key={kind} style={{position: 'absolute', left: 310 + i * 260, top: 1530, width: 200, height: 200, borderRadius: 40, background: 'rgba(17,17,17,.82)', boxShadow: shadow, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: win(f, 822 + i * 30, 930, 10)}}>
      {kind === 'eye' ? <svg width="120" height="80" viewBox="0 0 120 80"><path d="M6 40Q60 -8 114 40Q60 88 6 40Z" fill="none" stroke="#fff" strokeWidth="7" /><circle cx="60" cy="40" r="16" fill="#fff" /></svg>
        : <svg width="90" height="100" viewBox="0 0 27 31"><path d="M2 2l21 14-9.5 2 5 10-4 2-5-10L2 26z" fill="#fff" /></svg>}
      <div style={{position: 'absolute', left: -10, right: -10, top: '50%', height: 10, borderRadius: 5, background: RED, transform: `rotate(-20deg) scaleX(${strike})`}} />
    </div>)}
    {/* which campaigns are working → leads into jobs */}
    <div style={{position: 'absolute', left: 220, top: 1510, width: 640, padding: 26, borderRadius: 30, background: 'rgba(17,17,17,.82)', boxShadow: shadow, opacity: win(f, 1040, 1236, 12)}}>
      {bars.map((v, i) => <div key={i} style={{display: 'flex', alignItems: 'center', gap: 16, marginTop: i ? 16 : 0}}>
        <div style={{width: 44, color: '#fff', fontSize: 30, fontWeight: 900}}>{'ABC'[i]}</div>
        <div style={{flex: 1, height: 30, borderRadius: 15, background: 'rgba(255,255,255,.14)', overflow: 'hidden'}}><div style={{width: `${v * 100 * EO(clamp((f - 1050 - i * 8) / 24))}%`, height: '100%', borderRadius: 15, background: i === 1 ? GREEN : '#9CA3AF'}} /></div>
        <div style={{width: 40, fontSize: 32, color: GREEN, opacity: i === 1 ? k(f, 1080) : 0}}>✓</div></div>)}
      <div style={{position: 'relative', height: 90, marginTop: 18}}>
        {Array.from({length: 6}, (_, i) => { const t = (flow + i / 6) % 1; return f > 1150 ? <div key={i} style={{position: 'absolute', left: `${t * 82}%`, top: 30, width: 26, height: 26, borderRadius: 13, background: BLUE, opacity: t < .95 ? 1 : 0}} /> : null; })}
        <div style={{position: 'absolute', right: 0, top: 0, width: 90, opacity: k(f, 1150)}}><Emoji name="house" style={{width: '100%'}} /></div>
      </div>
    </div>
    {/* test approaches & adjust: mixer sliders */}
    <div style={{position: 'absolute', left: 220, top: 1510, width: 640, padding: '26px 30px', borderRadius: 30, background: '#fff', boxShadow: shadow, opacity: win(f, 1410, 1500, 12)}}>
      <div style={{display: 'flex', gap: 16, marginBottom: 18}}>{['#FDE68A', '#BFDBFE'].map((c, i) => <div key={c} style={{flex: 1, height: 90, borderRadius: 16, background: c, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, fontWeight: 900, color: INK}}>{'AB'[i]}</div>)}</div>
      {[0, 1, 2].map(i => <div key={i} style={{position: 'relative', height: 12, borderRadius: 6, background: '#E5E7EB', margin: '22px 0'}}><div style={{position: 'absolute', left: `${knob(i) * 100}%`, top: -12, width: 36, height: 36, marginLeft: -18, borderRadius: 18, background: BLUE, boxShadow: '0 4px 10px rgba(37,99,235,.4)'}} /></div>)}
    </div>
    {/* let it run → report at the end of the month */}
    <div style={{position: 'absolute', left: 540, top: 250, transform: 'translate(-50%,-50%)', width: 230, borderRadius: 26, overflow: 'hidden', background: '#fff', boxShadow: shadow, opacity: win(f, 1526, 1606, 10), textAlign: 'center'}}>
      <div style={{background: RED, height: 50}} /><div style={{fontSize: 110, fontWeight: 900, color: INK, lineHeight: 1.3}}>{day}</div>
    </div>
    <div style={{position: 'absolute', left: 760, top: 160 + (1 - k(f, 1566, 12)) * -80, opacity: win(f, 1566, 1606, 8)}}><Emoji name="Email" style={{width: 130}} /></div>
    {/* responsibilities both ways */}
    <Pop f={f} at={1700} until={1830} x={250} y={240} size={170}><Emoji name="Man Technologist" style={{width: '100%'}} /></Pop>
    <Pop f={f} at={1756} until={1830} x={830} y={240} size={170}><Emoji name="building construction" style={{width: '100%'}} /></Pop>
    <svg width="440" height="120" viewBox="0 0 440 120" style={{position: 'absolute', left: 320, top: 180, opacity: win(f, 1720, 1830)}}>
      <path d="M10 40H420" stroke="#fff" strokeWidth="8" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - EIO(clamp((f - 1720) / 20))} /><path d="M400 22L424 40L400 58" fill="none" stroke="#fff" strokeWidth="8" strokeLinecap="round" opacity={k(f, 1740)} />
      <path d="M430 84H20" stroke={RED} strokeWidth="8" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - EIO(clamp((f - 1766) / 20))} /><path d="M40 66L16 84L40 102" fill="none" stroke={RED} strokeWidth="8" strokeLinecap="round" opacity={k(f, 1786)} />
    </svg>
    <Pop f={f} at={1800} until={1830} x={540} y={400} size={110}><Emoji name="OK hand" style={{width: '100%'}} /></Pop>
    {/* no guarantee: dots, a few convert */}
    <div style={{position: 'absolute', left: 140, top: 1550, width: 800, height: 260, opacity: win(f, 1860, 1990, 10)}}>
      {leads.map((l, i) => <div key={i} style={{position: 'absolute', left: i * 80 + 10, top: l.ok ? 100 - 60 * EO(l.t) : 100 + 40 * EO(l.t), width: 56, height: 56, borderRadius: 28, background: l.ok && l.t > .5 ? GREEN : '#9CA3AF', opacity: l.ok ? 1 : 1 - .6 * l.t, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 30, fontWeight: 900, boxShadow: shadow}}>{l.ok && l.t > .5 ? '✓' : ''}</div>)}
    </div>
    {/* explain, communicate, show improvement */}
    {[['clipboard', 2016], ['Speech Balloon', 2062], ['Chart Increasing', 2106]].map(([e, at], i) => <Pop key={e as string} f={f} at={at as number} until={2190} x={250 + i * 290} y={240} size={150}><Emoji name={e as string} style={{width: '100%'}} /></Pop>)}
    <svg width="640" height="240" viewBox="0 0 640 240" style={{position: 'absolute', left: 220, top: 1530, opacity: win(f, 2110, 2192)}}>
      <rect width="640" height="240" rx="28" fill="rgba(17,17,17,.82)" />
      <polyline points="40,190 140,170 240,175 340,130 440,110 540,70 600,50" fill="none" stroke={GREEN} strokeWidth="8" strokeLinejoin="round" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - rise} />
    </svg>
    {/* blindly trust with money */}
    <Pop f={f} at={2232} until={2300} x={540} y={240} size={180}><Emoji name="Money with Wings" style={{width: '100%'}} /></Pop>
    <Markup name="x-mark-red" at={2244} x={300} y={100} w={480} dur={56} />
    {/* understand the plan & hold accountable */}
    <div style={{position: 'absolute', left: 300, top: 1520, width: 480, padding: '24px 28px', borderRadius: 30, background: '#fff', boxShadow: shadow, opacity: win(f, 2316, 2444, 12)}}>
      {[0, 1, 2].map(i => <div key={i} style={{display: 'flex', alignItems: 'center', gap: 16, marginTop: i ? 18 : 0}}>
        <div style={{width: 44, height: 44, borderRadius: 12, background: k(f, 2340 + i * 14) > .5 ? GREEN : '#E5E7EB', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 900}}>{k(f, 2340 + i * 14) > .5 ? '✓' : ''}</div>
        <div style={{flex: 1, height: 16, borderRadius: 8, background: '#E5E7EB'}} /></div>)}
    </div>
    <Burn at={2366} n={3} opacity={.4} />
  </div>;
};
