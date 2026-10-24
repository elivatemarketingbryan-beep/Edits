import React from 'react';
import {Easing} from 'remotion';
import {clamp} from '../../motion';
import type {VisualProps} from '../../types';
import {lin} from './kit';

// Light "Apple Liquid Glass" kit (from .claude/skills/apple-liquid-glass): cool grey-white ground,
// unified white panels with hairline dividers, grayscale hierarchy, one blue accent, glass only where
// layers overlap (CTA chips, overlays). Motion: --ease-spring for enters (~400ms = 12 frames), no
// overshoot, exits on the same path (~270ms = 8 frames). Sizes are the web spec scaled ~2x for a
// 1080-wide video canvas.

export const L = {
  bg: '#f5f5f7', surface: '#ffffff', text: '#1d1d1f', body: '#424245', t2: '#6e6e73', t3: '#86868b', t4: '#aeaeb2', faint: '#d2d2d7',
  hair: 'rgba(0,0,0,0.07)', track: '#e8e8ed', accent: '#0071e3', indigo: '#5e5ce6', heat: '#ff6b00', live: '#30d158', bad: '#ff3b30',
  gradCta: 'linear-gradient(135deg, #0071e3 0%, #5e5ce6 100%)', gradWarm: 'linear-gradient(135deg, #ff9f0a 0%, #ff375f 100%)', gradGreen: 'linear-gradient(135deg, #30d158 0%, #0a84ff 100%)',
};
export const LFONT = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI Variable Display", "Segoe UI", "Helvetica Neue", Arial, sans-serif';
export const EASE_SPRING = Easing.bezier(0.32, 0.72, 0, 1);
export const EASE_QUART = Easing.bezier(0.25, 1, 0.5, 1);
export const lIn = (p: VisualProps, at: number, len = 12) => EASE_SPRING(lin(p, at, len));
export const lMove = (p: VisualProps, at: number, len = 8) => EASE_QUART(lin(p, at, len));

export const SH = {
  card: '0 1px 2px rgba(0,0,0,0.04), 0 16px 48px rgba(0,0,0,0.05)',
  panel: '0 2px 6px rgba(0,0,0,0.05), 0 28px 80px rgba(0,0,0,0.06)',
  cta: '0 40px 108px rgba(0,113,227,0.24)',
  overlay: '0 4px 16px rgba(0,0,0,0.10), 0 60px 160px rgba(0,0,0,0.24)',
};
export const R = {pill: 999, thumb: 24, sheet: 32, card: 36, panel: 44, hero: 52};
export const panel: React.CSSProperties = {position: 'absolute', background: L.surface, borderRadius: R.panel, boxShadow: SH.panel, overflow: 'hidden', boxSizing: 'border-box'};
export const eyebrow: React.CSSProperties = {fontSize: 24, fontWeight: 600, letterSpacing: 4, textTransform: 'uppercase', color: L.t3};

const EXIT = 8;
/* Light stage: flat cool-grey ground (no moving wash), design canvas scaled like the dark kit. */
export const LStage: React.FC<{p: VisualProps; ch?: number; top?: number; children: React.ReactNode}> = ({p, ch = 900, top = 30, children}) => {
  const scale = Math.min(p.width / 1080, p.height / (ch + top * 2));
  const out = EASE_SPRING(clamp((p.frame - (p.beat.durationInFrames - EXIT)) / EXIT));
  return <div style={{position: 'absolute', inset: 0, background: L.bg, overflow: 'hidden', fontFamily: LFONT, color: L.text, WebkitFontSmoothing: 'antialiased'}}>
    <div style={{position: 'absolute', left: (p.width - 1080 * scale) / 2, top: top * scale, width: 1080, height: ch, transform: `scale(${scale})`, transformOrigin: '0 0', opacity: 1 - out}}>
      <div style={{position: 'absolute', inset: 0, transform: `translateY(${12 * out}px)`}}>{children}</div>
    </div>
  </div>;
};

/* Enter: fade + 24px rise on the spring curve, no blur, no overshoot. */
export const LIn: React.FC<{p: VisualProps; at: number; style?: React.CSSProperties; dy?: number; children?: React.ReactNode}> = ({p, at, style, dy = 24, children}) => {
  const k = lIn(p, at);
  const o = typeof style?.opacity === 'number' ? style.opacity : 1;
  return <div style={{position: 'absolute', ...style, opacity: k * o, transform: `translateY(${(1 - k) * dy}px)${style?.transform ? ' ' + style.transform : ''}`}}>{children}</div>;
};

/* Title with Apple tracking: bigger = more negative. */
export const LTitle: React.FC<{p: VisualProps; at: number; text: string; size?: number; top: number; left?: number; color?: string; weight?: number}> = ({p, at, text, size = 84, top, left = 80, color = L.text, weight = 700}) =>
  <LIn p={p} at={at} style={{top, left, right: 60}}>
    <div style={{fontSize: size, fontWeight: weight, letterSpacing: `${-0.03 * (size / 46)}em`, lineHeight: 1.08, color}}>{text}</div>
  </LIn>;

/* Unified panel list: one white surface, hairline-divided rows that appear on their cue. */
export const LRows: React.FC<{p: VisualProps; rows: Array<{at: number; title: React.ReactNode; meta?: React.ReactNode; right?: React.ReactNode}>; rowH?: number}> = ({p, rows, rowH = 130}) =>
  <>{rows.map((r, i) => { const k = lIn(p, r.at); return <div key={i} style={{display: 'flex', alignItems: 'center', gap: 28, height: rowH, padding: '0 44px', borderTop: i ? `1.5px solid ${L.hair}` : 'none', opacity: k, transform: `translateY(${(1 - k) * 16}px)`}}>
    <div style={{flex: 1, minWidth: 0}}><div style={{fontSize: 38, fontWeight: 600, letterSpacing: '-0.01em'}}>{r.title}</div>{r.meta && <div style={{fontSize: 27, color: L.t2, marginTop: 6}}>{r.meta}</div>}</div>
    {r.right}</div>; })}</>;

export const LPill: React.FC<{tone?: 'accent' | 'dark' | 'quiet' | 'heat' | 'live'; children: React.ReactNode}> = ({tone = 'quiet', children}) => {
  const st = {accent: {background: L.accent, color: '#fff'}, dark: {background: L.text, color: '#fff'}, quiet: {background: L.track, color: L.text}, heat: {background: 'rgba(255,107,0,0.1)', color: L.heat}, live: {background: 'rgba(48,209,88,0.12)', color: '#1e9e44'}}[tone];
  return <div style={{display: 'inline-flex', alignItems: 'center', gap: 12, padding: '16px 34px', borderRadius: R.pill, fontSize: 30, fontWeight: 600, ...st}}>{children}</div>;
};

export const LToggle: React.FC<{p: VisualProps; at: number}> = ({p, at}) => {
  const k = lMove(p, at, 8);
  return <div style={{width: 102, height: 62, borderRadius: 31, background: k > .5 ? L.live : L.track, position: 'relative', flex: 'none'}}>
    <div style={{position: 'absolute', top: 4, left: 4 + 40 * k, width: 54, height: 54, borderRadius: 27, background: '#fff', boxShadow: '0 3px 8px rgba(0,0,0,.15), 0 1px 1px rgba(0,0,0,.06)'}} /></div>;
};

export const LTrack: React.FC<{v: number; h?: number; color?: string}> = ({v, h = 16, color = L.accent}) =>
  <div style={{height: h, borderRadius: h, background: L.track, overflow: 'hidden'}}><div style={{width: `${clamp(v) * 100}%`, height: '100%', borderRadius: h, background: color}} /></div>;

/* Colored CTA block with blurred light orbs behind glass chips (the one sanctioned glass spot). */
export const LCta: React.FC<{p: VisualProps; style: React.CSSProperties; grad?: string; children: React.ReactNode}> = ({p, style, grad = L.gradCta, children}) => {
  const t = p.frame / 30;
  return <div style={{position: 'absolute', borderRadius: R.hero, background: grad, boxShadow: SH.cta, overflow: 'hidden', color: '#fff', boxSizing: 'border-box', ...style}}>
    <div style={{position: 'absolute', width: 360, height: 360, borderRadius: '50%', background: 'rgba(255,255,255,.35)', filter: 'blur(90px)', left: `${60 + 8 * Math.sin(t * .5)}%`, top: '-30%'}} />
    <div style={{position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'rgba(94,92,230,.6)', filter: 'blur(90px)', left: '-10%', top: '50%'}} />
    <div style={{position: 'relative', height: '100%'}}>{children}</div>
  </div>;
};
export const glassChip: React.CSSProperties = {background: 'rgba(255,255,255,0.16)', border: '1.5px solid rgba(255,255,255,0.22)', backdropFilter: 'blur(16px)', borderRadius: R.pill, padding: '14px 30px', fontSize: 28, fontWeight: 600, color: '#fff', display: 'inline-flex', alignItems: 'center', gap: 12};

export const LiveDot: React.FC<{p: VisualProps}> = ({p}) => {
  const k = (p.frame % 45) / 45;
  return <span style={{display: 'inline-block', width: 18, height: 18, borderRadius: 9, background: L.live, boxShadow: `0 0 0 ${14 * k}px rgba(48,209,88,${.5 * (1 - k)})`}} />;
};

/* Thumbnail with Apple's gradient placeholder art. */
export const LThumb: React.FC<{grad: string; size: number}> = ({grad, size}) =>
  <div style={{width: size, height: size, borderRadius: R.thumb, background: grad, flex: 'none'}} />;

/* Style sample (not used in an edit): the "another job completed" idea in the light kit. */
export const LSample: React.FC<VisualProps> = (p) =>
  <LStage p={p}>
    <LIn p={p} at={0} style={{left: 80, top: 30}}><div style={eyebrow}>Your camera roll</div></LIn>
    <LTitle p={p} at={3} text="Content you never posted." size={76} top={74} />
    <LIn p={p} at={8} style={{...panel, left: 80, top: 220, width: 560, height: 520}}>
      <LRows p={p} rowH={128} rows={[
        {at: 10, title: 'Kitchen remodel', meta: 'Before & after · 24 photos', right: <LThumb grad={L.gradWarm} size={84} />},
        {at: 13, title: 'Roof replacement', meta: 'Crew video · 3 clips', right: <LThumb grad={L.gradCta} size={84} />},
        {at: 16, title: 'Bathroom refresh', meta: 'Finished photos', right: <LThumb grad={L.gradGreen} size={84} />},
        {at: 19, title: 'Deck rebuild', meta: 'Not posted', right: <LPill tone="heat">Draft</LPill>},
      ]} />
    </LIn>
    <LCta p={p} style={{left: 670, top: 220, width: 330, height: 520, padding: 36}}>
      <div style={{fontSize: 26, fontWeight: 600, opacity: .85, letterSpacing: 3, textTransform: 'uppercase'}}>Post it</div>
      <div style={{fontSize: 52, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.1, marginTop: 14}}>Before → problem → fix</div>
      <div style={{position: 'absolute', bottom: 0, left: 0}}><div style={glassChip}><LiveDot p={p} /> Ready</div></div>
    </LCta>
    <LIn p={p} at={22} style={{left: 80, top: 790, display: 'flex', gap: 16}}><LPill tone="dark">Show the work</LPill><LPill>Earn trust</LPill></LIn>
  </LStage>;
