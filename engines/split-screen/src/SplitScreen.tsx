import React from 'react';
import {AbsoluteFill, Audio, Easing, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import type {Beat, Caption, EditPlan} from './types';
import {Visual} from './Visual';
import {fitType, reveal} from './motion';

const CaptionLine: React.FC<{caption: Caption; frame: number; y: number; accent: string}> = ({caption, frame, y, accent}) =>
  <div style={{position: 'absolute', top: y, left: 75, right: 100, transform: 'translateY(-50%)', display: 'flex', justifyContent: 'center', zIndex: 20}}>
    <div style={{fontSize: fitType(caption.text, 62, 24, 43), lineHeight: 1.18, fontWeight: 850, textAlign: 'center', letterSpacing: -1.5, color: '#fff', padding: '14px 26px 17px', borderRadius: 18, background: '#111111ef', boxShadow: '0 5px 28px #00000022', textShadow: '0 3px 4px #00000066', maxWidth: '100%'}}>
      {caption.words?.length ? caption.words.map((word, i) => <React.Fragment key={i}><span style={{color: '#fff', textDecoration: frame >= word.startFrame && frame < word.endFrame ? 'underline' : 'none', textDecorationColor: accent, textDecorationThickness: 4, textUnderlineOffset: 8}}>{word.text.trim()}</span>{i < caption.words!.length - 1 ? ' ' : ''}</React.Fragment>) : caption.text}
    </div>
  </div>;

// captionStyle "word": one large spoken word at a time, popping in on its real timing.
const WordCaption: React.FC<{caption: Caption; frame: number; y: number}> = ({caption, frame, y}) => {
  const words = caption.words ?? [];
  const current = [...words].reverse().find(word => frame >= word.startFrame);
  const text = (current ? current.text : words.length ? '' : caption.text).trim().toUpperCase();
  if (!text) return null;
  const since = current ? frame - current.startFrame : 99;
  const pop = since < 3 ? .82 + since * .08 : since < 6 ? 1.06 - (since - 3) * .02 : 1;
  return <div style={{position: 'absolute', top: y, left: 40, right: 40, transform: 'translateY(-50%)', display: 'flex', justifyContent: 'center', zIndex: 20}}>
    <div style={{fontSize: fitType(text, 150, 7, 78), lineHeight: 1, fontWeight: 900, letterSpacing: -2, color: '#fff', textAlign: 'center', WebkitTextStroke: '14px #000', paintOrder: 'stroke fill', textShadow: '0 8px 24px #0000008a', transform: `scale(${pop})`, whiteSpace: 'nowrap'}}>{text}</div>
  </div>;
};

// captionStyle "small": one clean all-caps word, white with a soft shadow, below the face.
const SmallCaption: React.FC<{caption: Caption; frame: number; y: number; emphasis?: string[]}> = ({caption, frame, y, emphasis}) => {
  const words = caption.words ?? [];
  const current = [...words].reverse().find(word => frame >= word.startFrame);
  const text = (current ? current.text : words.length ? '' : caption.text).trim().toUpperCase().replace(/[.,!?;:]+$/, '');
  if (!text) return null;
  const since = current ? frame - current.startFrame : 99;
  const k = Math.min(1, since / 3);
  const hot = !!emphasis?.some(e => e.toLowerCase() === text.toLowerCase().replace(/[^a-z0-9-]/g, ''));
  return <div style={{position: 'absolute', top: y, left: 40, right: 40, transform: 'translateY(-50%)', display: 'flex', justifyContent: 'center', zIndex: 20}}>
    <div style={{fontSize: hot ? 72 : 64, lineHeight: 1, fontWeight: 900, letterSpacing: 1, color: hot ? '#FF3B30' : '#fff', textAlign: 'center', textShadow: '0 3px 10px rgba(0,0,0,.55), 0 1px 2px rgba(0,0,0,.6)', transform: `scale(${.92 + .08 * k})`, opacity: .4 + .6 * k, whiteSpace: 'nowrap', fontFamily: 'Inter, "Segoe UI", Arial, sans-serif'}}>{text}</div>
  </div>;
};

const easeOutQ = Easing.bezier(0.23, 1, 0.32, 1);
const clean = (t: string) => t.trim().replace(/[.,!?;:]+$/, '');
const isHot = (w: string, emphasis?: string[]) => !!emphasis?.some(e => e.toLowerCase() === w.toLowerCase().replace(/[^a-z0-9-]/g, ''));
const capFont = 'Inter, "Segoe UI", Arial, sans-serif';

// "highlight": the phrase in white; the word being spoken sits in a red rounded box.
const HighlightCaption: React.FC<{caption: Caption; frame: number; y: number; ink?: boolean}> = ({caption, frame, y, ink}) => {
  const words = caption.words ?? [];
  const cur = [...words].reverse().find(w => frame >= w.startFrame);
  const since = frame - caption.startFrame, k = easeOutQ(Math.min(1, since / 5));
  return <div style={{position: 'absolute', top: y, left: 60, right: 60, transform: `translateY(-50%) translateY(${(1 - k) * 12}px)`, opacity: k, display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '6px 10px', zIndex: 20, fontFamily: capFont}}>
    {words.map((w, i) => { const on = w === cur; return <span key={i} style={{padding: '6px 14px', borderRadius: 14, background: on ? '#EF2B2D' : 'transparent', color: ink && !on ? '#151515' : '#fff', fontSize: ink ? 52 : 60, fontWeight: 900, textTransform: 'uppercase', textShadow: on || ink ? 'none' : '0 0 3px rgba(0,0,0,.95), 0 2px 4px rgba(0,0,0,.9), 0 4px 18px rgba(0,0,0,.7)', opacity: frame >= w.startFrame ? 1 : .75}}>{clean(w.text)}</span>; })}
  </div>;
};
// "stack": big two-line uppercase with a heavy outline; the spoken word turns yellow.
const StackCaption: React.FC<{caption: Caption; frame: number; y: number; emphasis?: string[]}> = ({caption, frame, y, emphasis}) => {
  const words = caption.words ?? [];
  const cur = [...words].reverse().find(w => frame >= w.startFrame);
  return <div style={{position: 'absolute', top: y, left: 50, right: 50, transform: 'translateY(-50%)', display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '0 18px', zIndex: 20, fontFamily: capFont, lineHeight: 1.02}}>
    {words.map((w, i) => { const on = w === cur, seen = frame >= w.startFrame, t = Math.min(1, (frame - w.startFrame) / 3); return <span key={i} style={{fontSize: 84, fontWeight: 900, textTransform: 'uppercase', letterSpacing: -1, color: on ? '#FFD400' : isHot(w.text, emphasis) ? '#FF3B30' : '#fff', WebkitTextStroke: '10px #000', paintOrder: 'stroke fill', opacity: seen ? 1 : 0, transform: `scale(${on ? .9 + .1 * t : 1})`, display: 'inline-block'}}>{clean(w.text)}</span>; })}
  </div>;
};
// "pill": sentence case on a frosted dark pill; words fade in as they're spoken.
const PillCaption: React.FC<{caption: Caption; frame: number; y: number}> = ({caption, frame, y}) => {
  const words = caption.words ?? [];
  const k = easeOutQ(Math.min(1, (frame - caption.startFrame) / 6));
  return <div style={{position: 'absolute', top: y, left: 0, right: 0, transform: 'translateY(-50%)', display: 'flex', justifyContent: 'center', zIndex: 20, fontFamily: capFont}}>
    <div style={{maxWidth: 900, padding: '18px 30px', borderRadius: 28, background: 'rgba(15,15,20,.55)', backdropFilter: 'blur(14px)', border: '1.5px solid rgba(255,255,255,.14)', opacity: k, transform: `scale(${.96 + .04 * k})`, textAlign: 'center'}}>
      {words.map((w, i) => { const t = Math.min(1, Math.max(0, (frame - w.startFrame + 2) / 4)); return <span key={i} style={{fontSize: 50, fontWeight: 700, color: '#fff', opacity: .25 + .75 * t}}>{w.text.trim()}{i < words.length - 1 ? ' ' : ''}</span>; })}
    </div>
  </div>;
};
// "pop": one big word at a time, colours rotating, a small bounce in.
const POP_COLORS = ['#FFFFFF', '#FFD400', '#4ADE80', '#FFFFFF', '#38BDF8'];
const PopCaption: React.FC<{caption: Caption; frame: number; y: number; emphasis?: string[]}> = ({caption, frame, y, emphasis}) => {
  const words = caption.words ?? [];
  const idx = [...words.keys()].reverse().find(i => frame >= words[i].startFrame);
  if (idx === undefined) return null;
  const w = words[idx], since = frame - w.startFrame;
  const s = since < 4 ? .7 + since * .11 : since < 7 ? 1.14 - (since - 4) * .045 : 1;
  const color = isHot(w.text, emphasis) ? '#FF3B30' : POP_COLORS[(w.startFrame >> 2) % POP_COLORS.length];
  return <div style={{position: 'absolute', top: y, left: 40, right: 40, transform: 'translateY(-50%)', display: 'flex', justifyContent: 'center', zIndex: 20}}>
    <div style={{fontSize: 120, fontWeight: 900, fontFamily: capFont, color, textTransform: 'uppercase', letterSpacing: -2, WebkitTextStroke: '12px #000', paintOrder: 'stroke fill', transform: `scale(${s}) rotate(${((w.startFrame % 3) - 1) * 3}deg)`, whiteSpace: 'nowrap'}}>{clean(w.text)}</div>
  </div>;
};
// The FAQ card: blur in the video, card rises in, question types out, then everything clears.
const questionState = (plan: EditPlan, frame: number) => {
  const q = plan.questions?.find(x => frame >= x.from - 8 && frame < x.to + 10);
  if (!q) return {q: undefined, blur: 0, k: 0};
  const inK = easeOutQ(Math.min(1, Math.max(0, (frame - (q.from - 8)) / 10)));
  const outK = easeOutQ(Math.min(1, Math.max(0, (frame - q.to) / 10)));
  return {q, blur: inK * (1 - outK), k: inK * (1 - outK)};
};
const QuestionCard: React.FC<{q: {from: number; to: number; label: string; text: string}; frame: number; k: number; width: number; height: number}> = ({q, frame, k, width, height}) => {
  const typed = q.text.slice(0, Math.floor(Math.max(0, Math.min(1, (frame - q.from) / Math.max(10, Math.min(30, q.text.length * .75)))) * q.text.length));
  return <div style={{position: 'absolute', left: width * .07, right: width * .07, top: height * .44, transform: `translateY(-50%) translateY(${(1 - k) * 40}px) scale(${.96 + .04 * k})`, opacity: k, zIndex: 18, fontFamily: 'Inter, "Segoe UI", Arial, sans-serif'}}>
    <div style={{display: 'flex', justifyContent: 'center', marginBottom: -28, position: 'relative', zIndex: 2}}>
      <div style={{padding: '12px 30px', borderRadius: 14, background: '#EF2B2D', color: '#fff', fontSize: 34, fontWeight: 700, boxShadow: '0 8px 20px rgba(239,43,45,.35)'}}>{q.label}</div>
    </div>
    <div style={{background: '#fff', borderRadius: 34, padding: '58px 44px 44px', boxShadow: '0 20px 60px rgba(0,0,0,.35)', minHeight: 120}}>
      <div style={{fontSize: 50, lineHeight: 1.2, fontWeight: 500, color: '#111', letterSpacing: -.5}}>{typed}<span style={{opacity: typed.length < q.text.length ? 1 : 0, color: '#EF2B2D'}}>|</span></div>
    </div>
  </div>;
};

// Huge words standing behind the presenter; each line pops in at its own frame and the block leaves together.
const BehindWords: React.FC<{bw: NonNullable<EditPlan['behind']>[number]; frame: number}> = ({bw, frame}) => {
  const out = Math.min(1, Math.max(0, (frame - (bw.to - 8)) / 8));
  return <div style={{position: 'absolute', left: 0, right: 0, top: (bw.y ?? .2) * 1920, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 1 - out, fontFamily: capFont, lineHeight: .86}}>
    {bw.lines.map((l, i) => { const t = Math.min(1, Math.max(0, (frame - l.at) / 7)); if (t <= 0) return <div key={i} style={{height: (l.size ?? 250) * .86}} />;
      const s = .82 + .18 * easeOutQ(t) + .05 * Math.sin(t * Math.PI);
      return <div key={i} style={{fontSize: l.size ?? 250, fontWeight: 900, letterSpacing: -6, color: l.color ?? '#fff', textTransform: 'uppercase', transform: `scale(${s})`, opacity: t, textShadow: '0 10px 40px rgba(0,0,0,.35)', whiteSpace: 'nowrap'}}>{l.text}</div>; })}
  </div>;
};

const GraphicPanel: React.FC<{plan: EditPlan; beat: Beat; height: number}> = ({plan, beat, height}) => {
  const frame = useCurrentFrame();
  const {fps} = plan;
  const b = {...plan.brand, ...beat.colors};
  if (beat.graphicMode === 'canvas') return <div style={{height, width: '100%', position: 'absolute', top: 0, background: b.background, overflow: 'hidden'}}>
    <Visual beat={beat} brand={b} frame={frame} fps={fps} width={plan.width} height={height}/>
  </div>;
  const full = beat.layout === 'graphic';
  const showHeadline = !!beat.headline && !(beat.visual.type === 'word' && (!beat.visual.word || beat.visual.word === beat.headline));
  const paddingTop = full ? 175 : 80;
  const titleSize = fitType(beat.headline, full ? 108 : 77, full ? 25 : 26, 49);
  const headerHeight = (beat.kicker ? 55 : 0) + (showHeadline ? (beat.headline.length > 28 ? titleSize * 2.12 : titleSize * 1.12) + 35 : 0);
  const visualHeight = height - paddingTop - headerHeight - (full ? 320 : 90);
  return <div style={{height, width: '100%', position: 'absolute', top: 0, background: b.background, color: b.text, overflow: 'hidden'}}>
    {beat.backdrop === 'grid' && <div style={{position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${b.text}0a 1px, transparent 1px), linear-gradient(90deg, ${b.text}0a 1px, transparent 1px)`, backgroundSize: '54px 54px', maskImage: 'linear-gradient(135deg, #000 0%, #00000025 55%, #000 100%)'}} />}
    {beat.backdrop === 'soft' && <div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 80% 20%, ${b.accent}22 0%, ${b.background}00 65%)`}} />}
    <div style={{position: 'relative', padding: `${paddingTop}px 100px 0 76px`}}>
      {beat.kicker && <div style={{fontSize: 23, lineHeight: 1.3, marginBottom: 25, fontWeight: 750, letterSpacing: 3, textTransform: 'uppercase', color: b.text, ...reveal(frame, fps)}}>{beat.kicker}</div>}
      {showHeadline && <div style={{fontSize: titleSize, lineHeight: 1.04, letterSpacing: -3.2, fontWeight: 830, marginBottom: 35, ...reveal(frame, fps)}}>{beat.headline}</div>}
      <div style={{height: Math.max(visualHeight, 160)}}><Visual beat={beat} brand={b} frame={frame} fps={fps} width={904} height={Math.max(visualHeight, 160)}/></div>
    </div>
    {b.name && <div style={{position: 'absolute', right: 100, bottom: full ? 105 : 33, fontSize: 19, letterSpacing: 2.8, fontWeight: 700, color: b.muted, opacity: .7}}>{b.name.toUpperCase()}</div>}
  </div>;
};

// Output frame -> normalized source frame through the cuts (the matte is rendered from the uncut source).
const sourceFrameAt = (plan: EditPlan, frame: number) => {
  let start = 0;
  for (const c of plan.edit.cuts) { const d = c.endFrame - c.startFrame; if (frame < start + d) return c.startFrame + frame - start; start += d; }
  return frame;
};
const layoutHeight = (plan: EditPlan, b: Beat) => b.layout === 'split' ? Math.round(plan.height * (b.splitRatio ?? .5)) : b.layout === 'graphic' ? plan.height : 0;
const easeMove = Easing.bezier(0.77, 0, 0.175, 1);
// Panel height at this frame. With panelTransition, the panel opens after a boundary (growing into the
// new beat) and closes before a boundary (shrinking with the old beat still visible), never showing an empty panel.
const panelHeightAt = (plan: EditPlan, frame: number, i: number) => {
  const beats = plan.beats, b = beats[i], cur = layoutHeight(plan, b), T = plan.panelTransition ?? 0;
  if (!T) return cur;
  const prev = beats[i - 1], next = beats[i + 1];
  if (prev && layoutHeight(plan, prev) < cur && frame - b.from < T) return layoutHeight(plan, prev) + (cur - layoutHeight(plan, prev)) * easeMove(Math.min(1, (frame - b.from) / T));
  const end = b.from + b.durationInFrames;
  if (next && layoutHeight(plan, next) < cur && end - frame <= T) return cur + (layoutHeight(plan, next) - cur) * easeMove(Math.min(1, (frame - (end - T)) / T));
  return cur;
};

export const SplitScreen: React.FC<{plan: EditPlan}> = ({plan}) => {
  const frame = useCurrentFrame();
  const beatIndex = Math.max(0, plan.beats.findIndex(b => frame >= b.from && frame < b.from + b.durationInFrames));
  const beat = plan.beats[beatIndex] ?? plan.beats[plan.beats.length - 1];
  const graphicHeight = Math.round(panelHeightAt(plan, frame, beatIndex));
  const panelShift = graphicHeight - layoutHeight(plan, beat);
  const videoTop = beat.layout === 'graphic' && panelShift === 0 ? 0 : graphicHeight;
  const focal = beat.focalPoint ?? {x: .5, y: .5};
  let cursor = 0;
  const muted = !!plan.captionMute?.some(m => frame >= m.from && frame < m.to);
  const caption = muted ? undefined : plan.captions.find(c => frame >= c.startFrame && frame < c.endFrame);
  const qs = questionState(plan, frame);
  const punch = (() => {
    const pz = plan.punches?.find(z => frame >= z.from && frame < z.to + 8);
    if (!pz) return {s: 1, y: .4};
    const inK = easeOutQ(Math.min(1, (frame - pz.from) / 5)), outK = easeOutQ(Math.min(1, Math.max(0, (frame - pz.to) / 8)));
    return {s: 1 + (pz.scale - 1) * inK * (1 - outK), y: pz.y ?? .4};
  })();
  return <AbsoluteFill style={{fontFamily: 'Inter, Arial, sans-serif', backgroundColor: plan.brand.background}}>
    <div style={{position: 'absolute', top: videoTop, left: 0, right: 0, height: plan.height - videoTop, overflow: 'hidden', filter: qs.blur > 0 ? `blur(${28 * qs.blur}px) brightness(${1 - .15 * qs.blur})` : undefined, transform: qs.blur > 0 || punch.s !== 1 ? `scale(${(1 + .06 * qs.blur) * punch.s})` : undefined, transformOrigin: `50% ${punch.y * 100}%`}}>
      {plan.edit.cuts.map((cut, i) => {
        const from = cursor; const duration = cut.endFrame - cut.startFrame; cursor += duration;
        return <Sequence key={i} from={from} durationInFrames={duration} name={`Source ${i + 1}`} layout="none">
          <OffthreadVideo src={staticFile(plan.source.path)} trimBefore={cut.startFrame} durationInFrames={duration} muted={!plan.source.hasAudio} style={{width: '100%', height: '100%', objectFit: beat.mediaFit ?? 'cover', objectPosition: `${focal.x * 100}% ${focal.y * 100}%`, filter: plan.grade}} />
        </Sequence>;
      })}
      {plan.behind?.map((bw, i) => <Sequence key={`behind-${i}`} from={bw.from} durationInFrames={bw.to - bw.from} layout="none">
        <BehindWords bw={bw} frame={frame} />
        {(bw.matte ?? plan.matte) && <OffthreadVideo transparent muted src={staticFile((bw.matte ?? plan.matte)!)} trimBefore={Math.max(0, sourceFrameAt(plan, bw.from) - (bw.matte ? bw.matteStart ?? 0 : plan.matteStart ?? 0))} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: beat.mediaFit ?? 'cover', objectPosition: `${focal.x * 100}% ${focal.y * 100}%`, filter: plan.grade}} />}
      </Sequence>)}
      {beat.layout !== 'graphic' && <div style={{position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(0deg, #00000050 0%, transparent 28%, transparent 80%, #00000018 100%)'}} />}
    </div>
    <div style={{position: 'absolute', top: 0, left: 0, right: 0, height: graphicHeight, overflow: 'hidden'}}>
      <div style={{position: 'absolute', top: 0, left: 0, right: 0, transform: panelShift ? `translateY(${panelShift}px)` : undefined}}>
        {plan.beats.filter(b => b.layout !== 'speaker').map(b => <Sequence key={b.id} from={b.from} durationInFrames={b.durationInFrames} name={b.id} layout="none"><GraphicPanel plan={plan} beat={b} height={layoutHeight(plan, b)} /></Sequence>)}
      </div>
    </div>
    {caption && (() => {
      const y = beat.captionY !== undefined ? beat.captionY * plan.height : beat.layout === 'split' ? graphicHeight : plan.height - 360;
      const sy = beat.layout === 'speaker' ? plan.height * (plan.captionAt ?? .62) : y;
      if (plan.captionStyle === 'small') return <SmallCaption caption={caption} frame={frame} y={sy} emphasis={plan.emphasis}/>;
      if (plan.captionStyle === 'highlight') return <HighlightCaption caption={caption} frame={frame} y={sy} ink={beat.captionTheme === 'ink'}/>;
      if (plan.captionStyle === 'stack') return <StackCaption caption={caption} frame={frame} y={sy} emphasis={plan.emphasis}/>;
      if (plan.captionStyle === 'pill') return <PillCaption caption={caption} frame={frame} y={sy}/>;
      if (plan.captionStyle === 'pop') return <PopCaption caption={caption} frame={frame} y={sy} emphasis={plan.emphasis}/>;
      return plan.captionStyle === 'word' ? <WordCaption caption={caption} frame={frame} y={y}/> : <CaptionLine caption={caption} frame={frame} y={y} accent={beat.colors?.accent ?? plan.brand.accent}/>;
    })()}
    {plan.overlay && (() => {
      const total = plan.edit.cuts.reduce((t, c) => t + c.endFrame - c.startFrame, 0);
      const ob: Beat = {id: 'overlay', from: 0, durationInFrames: total, layout: 'graphic', headline: '', rationale: '', visual: {type: 'custom', component: plan.overlay.component, props: plan.overlay.props}};
      return <div style={{position: 'absolute', inset: 0, zIndex: 15, pointerEvents: 'none', opacity: 1 - qs.k}}><Visual beat={ob} brand={plan.brand} frame={frame} fps={plan.fps} width={plan.width} height={plan.height}/></div>;
    })()}
    {qs.q && <QuestionCard q={qs.q} frame={frame} k={qs.k} width={plan.width} height={plan.height}/>}
    {plan.audio?.music && <Audio src={staticFile(plan.audio.music.src)} loopVolumeCurveBehavior="extend" volume={(f) => {
      const total = plan.edit.cuts.reduce((sum, c) => sum + c.endFrame - c.startFrame, 0);
      const fade = Math.min(1, f / 15, (total - 1 - f) / 20);
      return plan.audio!.music!.volume * Math.max(0, fade);
    }} loop/>}
    {plan.audio?.effects?.map((effect, i) => <Sequence key={`sfx-${i}`} from={effect.atFrame} layout="none"><Audio src={staticFile(effect.src)} volume={effect.volume}/></Sequence>)}
  </AbsoluteFill>;
};
