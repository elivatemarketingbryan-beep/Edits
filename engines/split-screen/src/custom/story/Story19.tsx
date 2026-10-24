import React from 'react';
import {clamp} from '../../motion';
import type {VisualProps} from '../../types';
import {cues} from '../modern/kit';
import {M, kf, EIO, EOUT, inK, World2, speed, Stage2, Hills, Floor, Tree2, House2, Van2, Person2, Glass, Card2, Stars2, ShadowE} from './storyKit2';

// "8 reviews vs 85 reviews" (video19), modern story style: parallax layers, motion blur on fast
// camera moves, gradient-lit characters, glass tags, circular reveals. Spoken numbers only (8, 85).

const backdrop = (seed = 0) => [
  {depth: .25, children: <><Hills y={560} color={M.far} amp={70} seed={seed} /><circle cx={880} cy={170} r={70} fill={M.sun} opacity={.55} /></>},
  {depth: .55, children: <Hills y={650} color={M.mid} amp={50} seed={seed + 2} />},
];
const ground = (y = 760) => ({depth: 1, children: <Floor y={y} />});
const Counter: React.FC<{v: number}> = ({v}) => <>{Math.round(v)}</>;

/* Search-result card */
const Result: React.FC<{x: number; y: number; k: number; name: string; reviews?: number; stars?: number}> = ({x, y, k, name, reviews, stars = 0}) =>
  <Card2 x={x} y={y} w={300} h={130} k={k}>
    <circle cx={-110} cy={44} r={22} fill="url(#g-roof)" />
    <text x={-78} y={52} fontSize={26} fontWeight={800} fill={M.ink} fontFamily="Arial">{name}</text>
    <Stars2 x={-120} y={96} s={.8} filled={stars} />
    {reviews !== undefined && <text x={130} y={102} textAnchor="end" fontSize={24} fontWeight={800} fill={M.mute} fontFamily="Arial">({reviews})</text>}
  </Card2>;

/* 2 · Two contractors on Google: same service, same area, similar prices. */
export const S19Two: React.FC<VisualProps> = (p) => {
  const f = p.frame;
  const [google, service, area, prices] = cues(p, [22, 75, 118, 160]);
  const zoom = kf(f, [[0, .98], [p.beat.durationInFrames, 1.12]], t => t);
  return <Stage2 p={p}>
    <World2 cx={540} cy={560} zoom={zoom} layers={[...backdrop(), ground(), {depth: 1, children: <>
      <Van2 x={300} y={760} s={.8} label="CO. A" /><Van2 x={800} y={760} s={.8} label="CO. B" tint={M.violet} />
      <Person2 x={250} y={770} kind="pro" pose={{mood: 'happy', armR: -30}} /><Person2 x={840} y={770} kind="pro" flip pose={{mood: 'happy', armR: -30}} />
      <Result x={270} y={190} k={inK(f, google)} name="Contractor A" stars={0} /><Result x={810} y={190} k={inK(f, google + 4)} name="Contractor B" stars={0} />
      {f >= area - 4 && <g transform="translate(540 520)" opacity={inK(f, area - 4)}><circle r={60 + 20 * Math.sin(f / 8)} fill="rgba(91,91,240,.12)" /><path d="M0 0C-26 -30 -32 -44 -32 -56A32 32 0 0 1 32 -56C32 -44 26 -30 0 0Z" fill={M.indigo} /><circle cy={-56} r={11} fill="#fff" /></g>}
    </>}]} />
    <Glass x={270} y={390} k={inK(f, service)} tone="glass">Same service</Glass><Glass x={810} y={390} k={inK(f, service + 3)} tone="glass">Same service</Glass>
    <Glass x={540} y={630} k={inK(f, area)} tone="indigo">Same area</Glass>
    <Glass x={540} y={64} k={inK(f, prices)} tone="ink">Prices: $$$ ≈ $$$</Glass>
  </Stage2>;
};

/* 3 · One has 8 reviews, the other 85 — with recent reviews from happy customers. */
export const S19Reviews: React.FC<VisualProps> = (p) => {
  const f = p.frame;
  const [eight, other, eightyFive, recent, happy] = cues(p, [19, 54, 67, 108, 206]);
  const keys: Array<[number, number]> = [[0, 300], [other - 6, 300], [other + 14, 800], [recent + 6, 800], [recent + 30, 620]];
  const cx = kf(f, keys), zoom = kf(f, [[0, 1.35], [other - 6, 1.35], [other + 14, 1.3], [recent + 6, 1.3], [recent + 30, 1.0]]);
  const n8 = 8 * EOUT(clamp((f - eight) / 14)), n85 = 85 * EOUT(clamp((f - eightyFive) / 26));
  const bubbles = [[700, 330], [930, 300], [620, 230], [1000, 420], [760, 150], [900, 170]];
  return <Stage2 p={p}>
    <World2 cx={cx} cy={520} zoom={zoom} vx={speed(f, keys)} layers={[...backdrop(1), ground(), {depth: 1, children: <>
      <Person2 x={250} y={770} kind="pro" pose={{mood: f > eightyFive + 20 ? 'worried' : 'happy'}} dim={f > recent ? .4 : 0} />
      <Person2 x={840} y={770} kind="pro" flip pose={{mood: 'happy', armR: f > recent ? -140 : -20}} />
      <Card2 x={250} y={330} w={260} h={170} k={inK(f, eight - 6)}>
        <text x={0} y={92} textAnchor="middle" fontSize={78} fontWeight={900} fill={M.ink} fontFamily="Arial"><Counter v={n8} /></text>
        <text x={0} y={140} textAnchor="middle" fontSize={24} fontWeight={700} fill={M.mute} fontFamily="Arial">reviews</text></Card2>
      <Card2 x={840} y={330} w={260} h={170} k={inK(f, eightyFive - 6)}>
        <text x={0} y={92} textAnchor="middle" fontSize={78} fontWeight={900} fill={M.indigo} fontFamily="Arial"><Counter v={n85} /></text>
        <text x={0} y={140} textAnchor="middle" fontSize={24} fontWeight={700} fill={M.mute} fontFamily="Arial">reviews</text></Card2>
      {bubbles.map(([bx, by], i) => { const k = inK(f, recent + i * 9, 12); return <g key={i} transform={`translate(${bx} ${by - (1 - k) * 30})`} opacity={k}>
        <rect x={-80} y={-34} width={160} height={68} rx={34} fill="#fff" /><circle cx={-48} r={20} fill={['url(#g-home)', 'url(#g-neighbor)', 'url(#g-roof)'][i % 3]} /><Stars2 x={-14} y={2} s={.5} /></g>; })}
    </>}]} />
    <Glass x={540} y={64} k={inK(f, recent)} tone="mint">Recent reviews from happy customers</Glass>
  </Stage2>;
};

/* 4 · Who would the homeowner look into first? Your work might be just as good — but they don't know that yet. */
export const S19Choice: React.FC<VisualProps> = (p) => {
  const f = p.frame;
  const [homeowner, look, work, good, know] = cues(p, [25, 74, 133, 179, 229]);
  const keys: Array<[number, number]> = [[0, 540], [look + 20, 620], [work - 4, 620], [work + 18, 330]];
  const cx = kf(f, keys), zoom = kf(f, [[0, 1.0], [look + 20, 1.05], [work - 4, 1.05], [work + 18, 1.35]]);
  const hw = clamp((f - look) / 40), hx = 540 + 200 * EIO(hw);
  return <Stage2 p={p} origin={[540, 300]}>
    <World2 cx={cx} cy={520} zoom={zoom} vx={speed(f, keys)} layers={[...backdrop(2), ground(), {depth: 1, children: <>
      <g filter={f > work + 6 ? 'url(#blur6)' : undefined} opacity={f > work + 6 ? .75 : 1}>
        <House2 x={260} y={760} s={.8} glow={inK(f, good - 10, 20)} roof="b" /><Person2 x={180} y={770} s={.8} kind="pro" pose={{mood: 'neutral'}} />
      </g>
      <House2 x={830} y={760} s={.8} /><Person2 x={920} y={770} s={.8} kind="pro" flip pose={{mood: 'happy'}} />
      <Card2 x={260} y={170} w={220} h={70} k={1}><Stars2 x={-70} y={36} s={.6} filled={1} /><text x={90} y={45} textAnchor="end" fontSize={22} fontWeight={800} fill={M.mute} fontFamily="Arial">(8)</text></Card2>
      <Card2 x={830} y={170} w={220} h={70} k={1}><Stars2 x={-70} y={36} s={.6} /><text x={90} y={45} textAnchor="end" fontSize={22} fontWeight={800} fill={M.indigo} fontFamily="Arial">(85)</text></Card2>
    </>}, {depth: 1.25, children: <Person2 x={hx} y={900} s={1.15} kind="home" flip={hw > 0 && hw < 1 ? false : f > look} pose={{phone: true, armR: -150, walk: hw > 0 && hw < 1 ? f / 3.2 : undefined, look: f > homeowner && f < look ? 8 * Math.sin(f / 6) : 0, mood: 'neutral'}} />}]} />
    <Glass x={540} y={64} k={inK(f, homeowner) * (1 - inK(f, work - 6, 8))} tone="glass">Who do they look into first?</Glass>
    <Glass x={540} y={64} k={inK(f, good - 4)} tone="indigo">Your work: just as good</Glass>
    <Glass x={540} y={140} k={inK(f, know - 4)} tone="ink">…but they don't know that yet</Glass>
  </Stage2>;
};

/* 5 · Before they let you in or trust you with thousands, they want proof others had a good experience. */
export const S19Proof: React.FC<VisualProps> = (p) => {
  const f = p.frame;
  const [home, trust, thousands, proof, others, experience, withYou] = cues(p, [54, 72, 113, 170, 186, 232, 256]);
  const meter = clamp((f - proof) / (withYou - proof));
  const open = EIO(clamp((f - withYou) / 14));
  const zoom = kf(f, [[0, 1.2], [proof, 1.05], [withYou + 10, 1.25]]);
  const cards = [[300, 260, -6], [320, 160, 5], [300, 60, -3]];
  return <Stage2 p={p}>
    <World2 cx={600} cy={520} zoom={zoom} layers={[...backdrop(3), ground(), {depth: 1, children: <>
      <g transform="translate(700 760)">
        <ShadowE x={0} y={0} w={420} />
        <rect x={-190} y={-420} width={380} height={420} rx={24} fill="url(#g-house)" />
        <rect x={-90} y={-300} width={180} height={300} rx={16} fill="#2A2D4A" />
        <g transform={`translate(-90 -300) scale(${1 - .85 * open} 1)`}><rect width={180} height={300} rx={16} fill="url(#g-roof)" /><circle cx={150} cy={160} r={9} fill={M.sun} /></g>
        <g transform="translate(0 -350)" opacity={1 - open}><rect x={-26} y={-6} width={52} height={40} rx={8} fill={meter >= 1 ? M.mint : M.ink} /><path d={`M-16 -6V-20Q-16 -36 0 -36Q16 -36 16 -20${meter >= 1 ? 'V-30' : 'V-6'}`} fill="none" stroke={meter >= 1 ? M.mint : M.ink} strokeWidth={6} /></g>
      </g>
      <Person2 x={420} y={770} kind="pro" pose={{mood: open > .5 ? 'happy' : 'neutral', walk: open > 0 && open < 1 ? f / 3 : undefined}} />
      <Person2 x={700} y={770} kind="home" flip pose={{mood: open > .5 ? 'happy' : 'neutral'}} dim={1 - open} />
      {cards.map(([x, y, r], i) => <Card2 key={i} x={x} y={y + 140} w={240} h={84} k={inK(f, (i === 0 ? proof : i === 1 ? others : experience) - 4)} tilt={r}>
        <circle cx={-82} cy={42} r={22} fill={['url(#g-home)', 'url(#g-neighbor)', 'url(#g-roof2)'][i]} /><Stars2 x={-46} y={44} s={.55} /></Card2>)}
    </>}]} />
    <Glass x={540} y={64} k={inK(f, home - 4) * (1 - inK(f, thousands - 4, 8))} tone="glass">Let you into their home?</Glass>
    <Glass x={540} y={64} k={inK(f, thousands - 2) * (1 - inK(f, proof - 6, 8))} tone="ink">A project worth thousands</Glass>
    <Glass x={540} y={64} k={inK(f, proof)} tone="mint">They want proof</Glass>
    <div style={{position: 'absolute', left: 120, top: 860, width: 340, height: 16, borderRadius: 8, background: 'rgba(30,33,64,.12)', opacity: inK(f, proof)}}><div style={{width: `${meter * 100}%`, height: '100%', borderRadius: 8, background: `linear-gradient(90deg, ${M.mint}, ${M.indigo})`}} /></div>
  </Stage2>;
};

/* 6 · Reach out to past customers: a quick message, thank them, ask for an honest Google review — with a direct link. */
export const S19Ask: React.FC<VisualProps> = (p) => {
  const f = p.frame;
  const [reaching, great, send, thank, ask, easy, link, page] = cues(p, [14, 78, 113, 159, 205, 319, 358, 385]);
  const keys: Array<[number, number]> = [[0, 820], [send - 10, 820], [send + 14, 420], [link, 420], [link + 24, 820]];
  const cx = kf(f, keys), zoom = kf(f, [[0, 1.1], [send - 10, 1.15], [send + 14, 1.3], [link, 1.3], [link + 24, 1.25]]);
  const fly = clamp((f - link) / 24);
  const stars = Math.floor(clamp((f - page + 12) / 14) * 5);
  const msg = [[`Thanks for choosing us!`, thank], [`Would you leave an honest review on Google?`, ask]] as const;
  return <Stage2 p={p}>
    <World2 cx={cx} cy={520} zoom={zoom} vx={speed(f, keys)} layers={[...backdrop(4), ground(), {depth: 1, children: <>
      <House2 x={900} y={760} s={.85} glow={inK(f, great - 10, 20)} roof="b" /><Tree2 x={1110} y={760} />
      <Person2 x={760} y={770} kind="home" flip pose={{mood: 'happy', phone: f > link + 16, armR: f > link + 16 ? -150 : -10}} />
      <Person2 x={330} y={770} kind="pro" pose={{phone: f > send - 8, armR: f > send - 8 ? -150 : -10, mood: 'happy'}} />
      {fly > 0 && fly < 1 && <g transform={`translate(${380 + 380 * EIO(fly)} ${420 - 140 * Math.sin(fly * Math.PI)})`}><rect x={-56} y={-20} width={112} height={40} rx={20} fill={M.indigo} /><text y={8} textAnchor="middle" fontSize={20} fontWeight={800} fill="#fff" fontFamily="Arial">link</text></g>}
    </>}]} />
    <Glass x={540} y={64} k={inK(f, reaching - 4) * (1 - inK(f, send - 6, 8))} tone="glass">Past customers you did great work for</Glass>
    {msg.map(([t, at], i) => <div key={i} style={{position: 'absolute', left: 90, top: 140 + i * 110, maxWidth: 560, padding: '20px 28px', borderRadius: '30px 30px 30px 8px', background: M.indigo, color: '#fff', fontSize: 31, fontWeight: 600, lineHeight: 1.3, opacity: inK(f, at - 4) * (1 - inK(f, link + 20, 10)), transform: `translateY(${(1 - inK(f, at - 4)) * 16}px)`, boxShadow: '0 16px 40px rgba(91,91,240,.3)'}}>{t}</div>)}
    <Glass x={540} y={64} k={inK(f, easy - 4) * (1 - inK(f, page - 6, 8))} tone="ink">Make it easy: send a direct link</Glass>
    <div style={{position: 'absolute', right: 70, top: 120, width: 380, padding: 28, borderRadius: 32, background: 'rgba(255,255,255,.78)', backdropFilter: 'blur(18px)', boxShadow: '0 16px 40px rgba(30,33,64,.14)', opacity: inK(f, link + 8), transform: `translateY(${(1 - inK(f, link + 8)) * 20}px)`}}>
      <div style={{fontSize: 22, fontWeight: 700, color: M.mute, letterSpacing: 2}}>YOUR REVIEW PAGE</div>
      <div style={{display: 'flex', gap: 8, marginTop: 16}}>{[0, 1, 2, 3, 4].map(i => <span key={i} style={{fontSize: 52, color: i < stars ? M.sun : '#E3E5F2', transform: `scale(${i === stars - 1 ? 1.12 : 1})`}}>★</span>)}</div>
    </div>
  </Stage2>;
};

/* 7 · Build it into your process: asking becomes a normal part of finishing a job — and it can be automated. */
export const S19Process: React.FC<VisualProps> = (p) => {
  const f = p.frame;
  const [build, process, asking, normal, finishing, automated] = cues(p, [27, 53, 84, 135, 163, 226]);
  const cx = 300 + f * 6; // constant tracking shot down a street (linear: constant motion)
  const houses = Array.from({length: 9}, (_, i) => 300 + i * 420);
  const spin = f * 4;
  return <Stage2 p={p}>
    <World2 cx={cx} cy={520} zoom={1.0} vx={3} layers={[...backdrop(5), ground(), {depth: 1, children: <>
      {houses.map((hx, i) => { const passed = cx - hx; const done = passed > -160, req = passed > -60, star = passed > 60; return <g key={i}>
        <House2 x={hx} y={760} s={.7} roof={i % 2 ? 'b' : 'a'} />
        {done && f > process && <g transform={`translate(${hx} 400)`}><rect x={-60} y={-24} width={120} height={48} rx={24} fill="#fff" /><text y={9} textAnchor="middle" fontSize={22} fontWeight={800} fill={M.mint} fontFamily="Arial">Job done ✓</text></g>}
        {req && f > asking && <g transform={`translate(${hx + 70} 330)`}><circle r={26} fill={M.indigo} /><path d="M-9 -6Q-9 -14 0 -14Q9 -14 9 -6V4L13 9H-13L-9 4Z" fill="#fff" /></g>}
        {star && f > asking && <g transform={`translate(${hx} 290)`}><Stars2 x={-68} y={0} s={.8} /></g>}
      </g>; })}
      <Van2 x={cx - 60} y={790} s={.75} wheel={f * 10} />
    </>}]} />
    <Glass x={540} y={64} k={inK(f, build - 4) * (1 - inK(f, normal - 6, 8))} tone="glass">Build it into your process</Glass>
    <Glass x={540} y={64} k={inK(f, normal - 2)} tone="ink">A normal part of finishing every job</Glass>
    <div style={{position: 'absolute', right: 70, top: 130, display: 'flex', alignItems: 'center', gap: 14, padding: '14px 26px', borderRadius: 999, background: M.mint, color: '#fff', fontSize: 30, fontWeight: 800, opacity: inK(f, automated - 4), transform: `scale(${.94 + .06 * inK(f, automated - 4)})`}}>
      <svg width="36" height="36" viewBox="-18 -18 36 36" style={{transform: `rotate(${spin}deg)`}}>{Array.from({length: 8}, (_, i) => <rect key={i} x={-4} y={-17} width={8} height={9} rx={2} fill="#fff" transform={`rotate(${i * 45})`} />)}<circle r={9} fill="#fff" /><circle r={4} fill={M.mint} /></svg>Automated</div>
  </Stage2>;
};

/* 9 · Every completed project builds trust with the next homeowner who's searching. */
export const S19Next: React.FC<VisualProps> = (p) => {
  const f = p.frame;
  const [completed, opportunity, trust, next, searching] = cues(p, [10, 49, 94, 125, 158]);
  const keys: Array<[number, number]> = [[0, 520], [trust - 6, 520], [next + 10, 760]];
  const cx = kf(f, keys), zoom = kf(f, [[0, .9], [trust - 6, .95], [next + 10, 1.2]]);
  const houses = [150, 400, 650];
  const filled = Math.min(5, Math.floor(clamp((f - trust) / 40) * 6));
  return <Stage2 p={p}>
    <World2 cx={cx} cy={520} zoom={zoom} vx={speed(f, keys)} layers={[...backdrop(6), ground(), {depth: 1, children: <>
      {houses.map((hx, i) => <House2 key={i} x={hx} y={760} s={.6} roof={i % 2 ? 'b' : 'a'} glow={inK(f, completed + i * 8, 14) * .6} />)}
      {houses.map((hx, i) => { const t = clamp((f - trust - i * 8) / 30); return f > completed + i * 8 ? <g key={`s${i}`} transform={`translate(${hx + (980 - hx) * EIO(t)} ${560 - 260 * Math.sin(t * Math.PI) - 160 * (1 - t)})`} opacity={1 - clamp((t - .9) / .1)}><path d="M0 -20L6 -7L20 -6L9 3L13 18L0 10L-13 18L-9 3L-20 -6L-6 -7Z" fill={M.sun} /></g> : null; })}
      <Person2 x={980} y={770} kind="home" flip pose={{phone: true, armR: -150, mood: f > trust + 40 ? 'happy' : 'neutral'}} />
    </>}]} />
    <div style={{position: 'absolute', right: 70, top: 140, width: 330, padding: 24, borderRadius: 30, background: 'rgba(255,255,255,.8)', backdropFilter: 'blur(18px)', boxShadow: '0 16px 40px rgba(30,33,64,.14)', opacity: inK(f, searching - 30)}}>
      <div style={{fontSize: 22, fontWeight: 700, color: M.mute}}>Searching for a contractor</div>
      <div style={{fontSize: 30, fontWeight: 800, color: M.ink, marginTop: 10}}>Your Business</div>
      <div style={{display: 'flex', gap: 4, marginTop: 6}}>{[0, 1, 2, 3, 4].map(i => <span key={i} style={{fontSize: 34, color: i < filled ? M.sun : '#E3E5F2'}}>★</span>)}</div>
    </div>
    <Glass x={540} y={64} k={inK(f, completed) * (1 - inK(f, trust - 6, 8))} tone="glass">Every completed project</Glass>
    <Glass x={540} y={64} k={inK(f, trust - 2)} tone="indigo">More trust for the next homeowner</Glass>
  </Stage2>;
};
