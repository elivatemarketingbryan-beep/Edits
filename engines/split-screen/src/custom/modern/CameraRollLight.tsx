import React from 'react';
import {clamp} from '../../motion';
import type {VisualProps} from '../../types';
import {cues, lin} from './kit';
import {L, R, SH, panel, eyebrow, LStage, LIn, LTitle, LRows, LPill, LToggle, LTrack, LCta, glassChip, LiveDot, LThumb, lIn, lMove, EASE_SPRING} from './kitLight';

// "Your camera roll is your content" (video16) rebuilt in the light Apple Liquid Glass kit.
// Unified white panels with hairline rows, grayscale hierarchy, blue as the single accent,
// heat-orange only for what's missing, glass only on the colored CTA. Spring-curve enters, no overshoot.

const GRAD = [L.gradWarm, L.gradCta, L.gradGreen, 'linear-gradient(135deg,#bf5af2,#5e5ce6)', 'linear-gradient(135deg,#64d2ff,#0a84ff)', 'linear-gradient(135deg,#d1d1d6,#8e8e93)'];
const Strike: React.FC<{k: number}> = ({k}) =>
  <div style={{position: 'absolute', left: -6, right: -6, top: '52%', height: 5, borderRadius: 3, background: L.heat, transform: `scaleX(${clamp(k)})`, transformOrigin: 'left'}} />;

/* 2 · It's sitting in your camera roll: projects, before/afters, crew videos, bathrooms, roofs, transformations. */
export const L16Roll: React.FC<VisualProps> = (p) => {
  const [roll, projects, beforeAfter, videos, bath, roof, homes, transformed] = cues(p, [24, 82, 130, 184, 253, 288, 316, 372]);
  const rows = [['Projects', 'Every job you finished', projects, 0], ['Before & after', 'The transformation', beforeAfter, 1], ['Crew videos', 'Your team at work', videos, 4], ['Bathrooms', 'Finished spaces', bath, 2], ['Roofs', 'New installs', roof, 5], ['Transformations', 'Whole homes', homes, 3]] as const;
  return <LStage p={p}>
    <LIn p={p} at={0} style={{left: 80, top: 20}}><div style={eyebrow}>Already on your phone</div></LIn>
    <LTitle p={p} at={2} text="Your camera roll" size={84} top={60} />
    <LIn p={p} at={roll - 8} style={{...panel, left: 80, top: 190, width: 920, height: 690}}>
      <LRows p={p} rowH={115} rows={rows.map(([t, meta, at, g]) => ({at: at - 6, title: t, meta,
        right: <div style={{display: 'flex', alignItems: 'center', gap: 22}}>
          <div style={{display: 'flex', gap: 8}}>{[0, 1, 2].map(i => <LThumb key={i} grad={GRAD[(g + i) % GRAD.length]} size={64} />)}</div>
          <div style={{width: 40, height: 40, borderRadius: 20, background: p.frame > at + 2 ? L.accent : L.track, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 24, fontWeight: 700}}>{p.frame > at + 2 ? '✓' : ''}</div>
        </div>}))} />
    </LIn>
    <LIn p={p} at={transformed - 4} style={{right: 80, top: 76}}><div style={{boxShadow: SH.card, borderRadius: R.pill}}><LPill tone="accent">That's your content</LPill></div></LIn>
  </LStage>;
};

/* 4 · Never posted, or one picture with "another job completed": missing the chance to show quality and earn trust. */
export const L16Post: React.FC<VisualProps> = (p) => {
  const [never, upload, caption, another, missing, quality, trust] = cues(p, [49, 88, 134, 164, 230, 290, 365]);
  const cap = 'Another job completed.';
  const typed = cap.slice(0, Math.floor(clamp((p.frame - another + 4) / 20) * cap.length));
  return <LStage p={p}>
    <LIn p={p} at={0} style={{left: 80, top: 20}}><div style={eyebrow}>What most contractors post</div></LIn>
    <LIn p={p} at={3} style={{...panel, left: 80, top: 80, width: 560, height: 800}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 18, padding: '30px 34px'}}>
        <div style={{width: 64, height: 64, borderRadius: 32, background: L.track, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, color: L.t2}}>Y</div>
        <div><div style={{fontSize: 32, fontWeight: 600}}>Your Business</div><div style={{fontSize: 24, color: L.t3}}>Just now</div></div>
      </div>
      <div style={{margin: '0 34px', height: 440, borderRadius: R.thumb, background: GRAD[5], opacity: lIn(p, upload - 4)}} />
      <div style={{padding: '28px 34px 0', fontSize: 36, fontWeight: 500, minHeight: 50}}>{typed}{typed.length > 0 && typed.length < cap.length && <span style={{color: L.accent}}>|</span>}</div>
      <div style={{position: 'absolute', left: 34, right: 34, bottom: 30, paddingTop: 22, borderTop: `1.5px solid ${L.hair}`, fontSize: 26, color: L.t3, opacity: lin(p, caption + 40, 10)}}>No likes · No comments</div>
    </LIn>
    <LIn p={p} at={never - 6} style={{...panel, left: 670, top: 80, width: 330, height: 280, padding: 30}}>
      <div style={eyebrow}>Or</div>
      <div style={{fontSize: 40, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.15, marginTop: 8}}>Never posted at all</div>
      <div style={{display: 'flex', gap: 8, marginTop: 22, opacity: .45}}>{[0, 1, 2, 3].map(i => <LThumb key={i} grad={GRAD[i]} size={58} />)}</div>
    </LIn>
    <LIn p={p} at={missing - 6} style={{...panel, left: 670, top: 390, width: 330, height: 490, padding: 30}}>
      <div style={{...eyebrow, color: L.heat}}>Missing</div>
      {[['Quality', quality], ['Trust', trust]].map(([t, at]) => <div key={t as string} style={{marginTop: 34, opacity: lIn(p, (at as number) - 6)}}>
        <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 32, fontWeight: 600}}><span>{t}</span><span style={{color: L.t3, fontWeight: 500}}>shown</span></div>
        <div style={{marginTop: 16}}><LTrack v={.12 * lIn(p, at as number, 16)} color={L.heat} /></div>
      </div>)}
      <div style={{position: 'absolute', left: 30, right: 30, bottom: 30, fontSize: 26, color: L.t2, lineHeight: 1.5, opacity: lin(p, trust + 8, 10)}}>A missed reason to trust you.</div>
    </LIn>
  </LStage>;
};

/* 5 · Turn projects into simple videos: before, the problem, what you did to fix it. */
export const L16Story: React.FC<VisualProps> = (p) => {
  const [turning, videos, before, problem, walk, fix] = cues(p, [10, 73, 110, 197, 247, 311]);
  const steps = [['Before', 'The condition of the space', before, GRAD[5]], ['The problem', 'What the homeowner had', problem, L.gradWarm], ['The fix', 'What you actually did', walk, L.gradGreen]] as const;
  const active = p.frame >= walk - 4 ? 2 : p.frame >= problem - 4 ? 1 : p.frame >= before - 4 ? 0 : -1;
  const seg = (i: number) => clamp((p.frame - steps[i][2] + 4) / ((i < 2 ? steps[i + 1][2] : fix + 30) - steps[i][2]));
  return <LStage p={p}>
    <LIn p={p} at={0} style={{left: 80, top: 20}}><div style={eyebrow}>A simple video</div></LIn>
    <LTitle p={p} at={turning - 6} text="Before. Problem. Fix." size={84} top={60} />
    <LIn p={p} at={turning} style={{left: 80, top: 190, width: 920, height: 420, borderRadius: R.hero, overflow: 'hidden', boxShadow: SH.panel, background: '#1d1d1f'}}>
      {steps.map(([, , , g], i) => <div key={i} style={{position: 'absolute', inset: 0, background: g, opacity: active === i ? 1 : 0}} />)}
      <div style={{position: 'absolute', left: 30, right: 30, top: 26, display: 'flex', gap: 10}}>
        {steps.map((_, i) => <div key={i} style={{flex: 1, height: 8, borderRadius: 4, background: 'rgba(255,255,255,.35)', overflow: 'hidden'}}><div style={{width: `${seg(i) * 100}%`, height: '100%', background: '#fff'}} /></div>)}
      </div>
      {active >= 0 && <div style={{position: 'absolute', left: 30, bottom: 30}}><div style={{...glassChip, fontSize: 34, padding: '16px 34px'}}>{steps[active as 0 | 1 | 2][0]}</div></div>}
    </LIn>
    <LIn p={p} at={videos - 6} style={{...panel, left: 80, top: 640, width: 920, height: 240}}>
      <div style={{display: 'flex', height: '100%'}}>
        {steps.map(([t, d, at], i) => { const on = active === i; return <div key={t} style={{flex: 1, padding: '34px 30px', borderLeft: i ? `1.5px solid ${L.hair}` : 'none', opacity: .35 + .65 * lIn(p, at - 6)}}>
          <div style={{fontSize: 24, fontWeight: 600, color: on ? L.accent : L.t3}}>{`0${i + 1}`}</div>
          <div style={{fontSize: 36, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 8, color: on ? L.text : L.t2}}>{t}</div>
          <div style={{fontSize: 24, color: L.t3, marginTop: 6, lineHeight: 1.4}}>{d}</div></div>; })}
      </div>
    </LIn>
  </LStage>;
};

/* 6 · Also: common questions, what affects cost, details that separate quality from rushed work. */
export const L16Ideas: React.FC<VisualProps> = (p) => {
  const [questions, cost, details, rushed] = cues(p, [24, 75, 171, 240]);
  const cmp = lMove(p, rushed - 6, 20);
  return <LStage p={p}>
    <LIn p={p} at={0} style={{left: 80, top: 20}}><div style={eyebrow}>More to post</div></LIn>
    <LTitle p={p} at={3} text="Answer. Explain. Show." size={84} top={60} />
    <LIn p={p} at={questions - 8} style={{...panel, left: 80, top: 190, width: 920, height: 380}}>
      <LRows p={p} rowH={126} rows={[
        {at: questions - 4, title: 'Common questions', meta: 'How long will it take? Do I need a permit?', right: <LPill>FAQ</LPill>},
        {at: cost - 4, title: 'What affects the cost', meta: 'Materials · size of the job · hidden damage', right: <LPill tone="accent">Explain</LPill>},
        {at: details - 4, title: 'Quality vs rushed', meta: 'The details most people never see', right: <LPill tone="dark">Show</LPill>},
      ]} />
    </LIn>
    <LIn p={p} at={details} style={{left: 80, top: 600, width: 920, height: 280, borderRadius: R.hero, overflow: 'hidden', boxShadow: SH.panel}}>
      <div style={{position: 'absolute', inset: 0, background: 'repeating-linear-gradient(100deg,#c7c7cc 0 40px,#aeaeb2 40px 46px)'}} />
      <div style={{position: 'absolute', inset: 0, background: 'repeating-linear-gradient(90deg,#e5f1ff 0 60px,#cfe4ff 60px 62px)', clipPath: `inset(0 0 0 ${100 - 52 * cmp}%)`}} />
      <div style={{position: 'absolute', top: 0, bottom: 0, left: `${100 - 52 * cmp}%`, width: 4, marginLeft: -2, background: '#fff', opacity: cmp > 0 ? 1 : 0}} />
      <div style={{position: 'absolute', left: 24, bottom: 24}}><div style={{...glassChip, background: 'rgba(0,0,0,.28)'}}>Rushed</div></div>
      <div style={{position: 'absolute', right: 24, bottom: 24, opacity: cmp}}><div style={{...glassChip, background: 'rgba(0,113,227,.55)'}}>Quality</div></div>
    </LIn>
  </LStage>;
};

/* 7 · You don't need a professional film crew; your phone and projects are enough. */
export const L16Phone: React.FC<VisualProps> = (p) => {
  const [professional, crew, phone, enough] = cues(p, [32, 62, 100, 184]);
  const rec = (p.frame % 40) / 40;
  return <LStage p={p}>
    <LIn p={p} at={0} style={{left: 80, top: 20}}><div style={eyebrow}>What you need to start</div></LIn>
    <LIn p={p} at={2} style={{...panel, left: 80, top: 80, width: 920, height: 300}}>
      <LRows p={p} rowH={150} rows={[
        {at: professional - 8, title: <span style={{position: 'relative', color: L.t3}}>A professional film crew<Strike k={EASE_SPRING(lin(p, crew + 4, 10))} /></span>, meta: 'Not required', right: <LToggle p={p} at={1e9} />},
        {at: phone - 6, title: 'Your phone', meta: 'And the projects you\'re already doing', right: <LToggle p={p} at={phone + 6} />},
      ]} />
    </LIn>
    <LIn p={p} at={phone} style={{left: 360, top: 410, width: 360, height: 470, borderRadius: 60, background: '#1d1d1f', boxShadow: SH.overlay, padding: 14, boxSizing: 'border-box'}}>
      <div style={{position: 'relative', width: '100%', height: '100%', borderRadius: 48, overflow: 'hidden', background: L.gradGreen}}>
        <div style={{position: 'absolute', left: 18, top: 18}}><div style={{...glassChip, background: 'rgba(0,0,0,.3)', padding: '10px 20px', fontSize: 22}}><span style={{width: 14, height: 14, borderRadius: 7, background: L.bad, boxShadow: `0 0 0 ${10 * rec}px rgba(255,59,48,${.5 * (1 - rec)})`}} />REC</div></div>
        <div style={{position: 'absolute', left: '50%', bottom: 26, marginLeft: -40, width: 80, height: 80, borderRadius: 40, border: '5px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><div style={{width: 56, height: 56, borderRadius: 28, background: L.bad}} /></div>
      </div>
    </LIn>
    <LIn p={p} at={enough - 4} style={{left: 760, top: 600}}><div style={{boxShadow: SH.card, borderRadius: R.pill}}><LPill tone="accent">That's enough</LPill></div></LIn>
  </LStage>;
};

/* 2 (phone version) · The camera roll as an iPhone Photos grid; photos get selected as each kind is named. */
type Kind = 'before' | 'after' | 'video' | 'bath' | 'roof' | 'home' | 'plain';
const KG: Record<Kind, string> = {before: 'linear-gradient(160deg,#d1d1d6,#8e8e93)', after: L.gradCta, video: L.gradWarm, bath: 'linear-gradient(160deg,#64d2ff,#0a84ff)', roof: 'linear-gradient(160deg,#ff9f0a,#ff453a)', home: L.gradGreen, plain: 'linear-gradient(160deg,#bf5af2,#5e5ce6)'};
const PhotoTile: React.FC<{kind: Kind; size: number}> = ({kind, size}) =>
  <div style={{width: size, height: size, background: KG[kind], position: 'relative', overflow: 'hidden'}}>
    <svg viewBox="0 0 100 100" width={size} height={size} style={{position: 'absolute', inset: 0}}>
      {(kind === 'roof' || kind === 'home' || kind === 'after' || kind === 'before') && <path d="M18 60L50 32L82 60V84H18Z" fill="rgba(255,255,255,.6)" />}
      {kind === 'bath' && <path d="M14 56H86V64Q86 82 50 82Q14 82 14 64ZM22 56V30Q22 22 30 22Q38 22 38 30" fill="rgba(255,255,255,.65)" />}
      {kind === 'video' && <><circle cx="50" cy="50" r="17" fill="rgba(0,0,0,.25)" /><path d="M45 41L60 50L45 59Z" fill="#FFF" /></>}
      {kind === 'plain' && <rect x="24" y="34" width="52" height="34" rx="6" fill="rgba(255,255,255,.5)" />}
    </svg>
  </div>;
export const L16RollPhone: React.FC<VisualProps> = (p) => {
  const [roll, projects, beforeAfter, videos, bath, roof, homes, transformed] = cues(p, [24, 82, 130, 184, 253, 288, 316, 372]);
  const kinds: Kind[] = ['plain', 'before', 'after', 'video', 'bath', 'roof', 'home', 'video', 'plain', 'bath', 'before', 'after', 'roof', 'home', 'video', 'plain', 'after', 'bath', 'roof', 'home', 'before', 'plain', 'video', 'bath'];
  const sel: Record<Kind, number> = {before: beforeAfter, after: beforeAfter, video: videos, bath, roof, home: homes, plain: projects};
  const rows = [['Projects', projects], ['Before & after', beforeAfter], ['Crew videos', videos], ['Bathrooms', bath], ['Roofs', roof], ['Transformations', homes]] as const;
  const count = kinds.filter(k => p.frame >= sel[k]).length;
  const T = 106;
  return <LStage p={p}>
    <LIn p={p} at={0} style={{left: 80, top: 10, width: 470, height: 880, borderRadius: 72, background: '#1d1d1f', boxShadow: SH.overlay, padding: 14, boxSizing: 'border-box'}}>
      <div style={{position: 'relative', width: '100%', height: '100%', borderRadius: 60, overflow: 'hidden', background: '#fff'}}>
        <div style={{position: 'absolute', left: '50%', top: 14, marginLeft: -60, width: 120, height: 34, borderRadius: 17, background: '#1d1d1f'}} />
        <div style={{position: 'absolute', left: 26, top: 70, right: 26, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
          <div style={{fontSize: 42, fontWeight: 700, letterSpacing: '-0.03em'}}>Recents</div>
          <div style={{fontSize: 24, fontWeight: 600, color: L.accent, opacity: lin(p, projects - 6, 8)}}>{count ? `${count} Selected` : 'Select'}</div>
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 140, display: 'grid', gridTemplateColumns: `repeat(4, ${T}px)`, gap: 3, justifyContent: 'center'}}>
          {kinds.map((k, i) => {
            const rowIn = lIn(p, roll - 8 + Math.floor(i / 4) * 2, 12), on = p.frame >= sel[k], s = on ? lMove(p, sel[k], 8) : 0;
            return <div key={i} style={{position: 'relative', opacity: rowIn, transform: `translateY(${(1 - rowIn) * 14}px)`}}>
              <div style={{transform: `scale(${1 - .06 * s})`, filter: p.frame > projects && !on ? 'saturate(.5) brightness(1.08)' : undefined}}><PhotoTile kind={k} size={T} /></div>
              {on && <div style={{position: 'absolute', right: 6, bottom: 6, width: 30, height: 30, borderRadius: 15, background: L.accent, border: '2.5px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 17, fontWeight: 800, opacity: s, transform: `scale(${.9 + .1 * s})`}}>✓</div>}
            </div>;
          })}
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 86, background: 'rgba(245,245,247,0.72)', backdropFilter: 'saturate(180%) blur(20px)', borderTop: `1.5px solid ${L.hair}`, display: 'flex', justifyContent: 'space-around', alignItems: 'center', fontSize: 20, fontWeight: 600, color: L.t3}}>
          <span style={{color: L.accent}}>Library</span><span>For You</span><span>Albums</span></div>
      </div>
    </LIn>
    <LIn p={p} at={roll} style={{left: 590, top: 20}}><div style={eyebrow}>Already on your phone</div></LIn>
    <LIn p={p} at={projects - 10} style={{...panel, left: 590, top: 70, width: 410, height: 690}}>
      <LRows p={p} rowH={115} rows={rows.map(([t, at]) => ({at: at - 6, title: t, right:
        <div style={{width: 40, height: 40, borderRadius: 20, background: p.frame > at + 2 ? L.accent : L.track, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 22, fontWeight: 700}}>{p.frame > at + 2 ? '✓' : ''}</div>}))} />
    </LIn>
    <LIn p={p} at={transformed - 4} style={{left: 590, top: 790}}><div style={{boxShadow: SH.card, borderRadius: R.pill}}><LPill tone="accent">That&apos;s your content</LPill></div></LIn>
  </LStage>;
};
