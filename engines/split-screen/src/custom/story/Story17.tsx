import React from 'react';
import {clamp} from '../../motion';
import type {VisualProps} from '../../types';
import {cues} from '../modern/kit';
import {L17Tracker} from '../modern/TrackingMixed';
import {SK, EIO, EOUT, kf, inOut, StoryStage, World, Ground, Road, Tree, Cloud, House, Truck, Coin, Bubble, Icon, Person, Tag} from './storyKit';

// Story version of "where do your customers come from?" (video17): characters act out the
// spoken points while a keyframed camera moves through one illustrated town.

/* 2 · Was it Google, Facebook, a referral, your website, or someone who saw your truck? */
export const S17Sources: React.FC<VisualProps> = (p) => {
  const f = p.frame;
  const [google, facebook, referral, website, truck] = cues(p, [8, 29, 53, 85, 155]);
  const cx = kf(f, [[0, 560], [referral - 6, 600], [referral + 26, 720], [truck - 16, 760], [truck + 30, 840]]);
  const zoom = kf(f, [[0, 1.35], [referral - 6, 1.3], [referral + 26, 1.08], [truck - 16, 1.05], [truck + 30, .9]]);
  const screen = f >= website ? 'web' : f >= facebook ? 'like' : 'search';
  const nWalk = clamp((f - referral + 20) / 30);
  const nx = 1150 - 280 * EOUT(nWalk);
  const tx = kf(f, [[truck - 20, -500], [truck + 40, 1900]], t => t);
  const look = f > truck ? 10 : 0;
  const sources = [['Google', google, 'search'], ['Facebook', facebook, 'like'], ['Referral', referral, 'talk'], ['Website', website, 'web'], ['Your truck', truck, 'truck']] as const;
  return <StoryStage p={p}>
    <World cx={cx} cy={560} zoom={zoom}>
      <Cloud x={200} y={170} /><Cloud x={900} y={130} s={1.2} /><Cloud x={1500} y={190} />
      <Ground y={760} /><Road y={790} />
      <Tree x={60} y={760} /><House x={330} y={760} /><Tree x={1250} y={760} s={1.1} /><House x={1500} y={760} roof="#5E8BC7" />
      <Truck x={tx} y={872} s={1} wheel={f * 14} />
      <Person x={560} y={760} kind="home" pose={{phone: f < truck - 4, armR: f < truck - 4 ? -150 : f > truck + 4 ? -100 : -40, armL: 8, look, mood: f > truck + 10 ? 'happy' : 'neutral'}} flip={f > truck + 2} />
      {f < truck - 4 && <Bubble x={640} y={420} w={130} h={110} k={inOut(f, google - 4, 10)}><g key={screen}><Icon kind={screen as 'search'} c={screen === 'like' ? SK.accent : SK.ink} /></g></Bubble>}
      <Person x={nx} y={760} kind="neighbor" flip pose={{walk: nWalk < 1 ? f / 3.2 : undefined, armR: nWalk >= 1 ? -70 : undefined, mood: 'happy'}} />
      <Bubble x={nx - 20} y={430} w={140} h={100} k={inOut(f, referral + 6, 10) * (1 - inOut(f, website, 8))} tail="left"><Icon kind="talk" /></Bubble>
    </World>
    {sources.map(([t, at], i) => <Tag key={t} x={120 + i * 210} y={64} k={inOut(f, at - 4, 10)} tone={f >= at && f < (sources[i + 1]?.[1] ?? 999) ? 'accent' : 'light'}>{t}<span style={{opacity: .55}}> ?</span></Tag>)}
  </StoryStage>;
};

/* 4 · Money goes into marketing; Facebook ads → leads? → estimates?; website traffic walks past, nobody asks for a quote. */
export const S17Blind: React.FC<VisualProps> = (p) => {
  const f = p.frame;
  const [spending, marketing, facebook, leads, estimates, website, nobody, quote] = cues(p, [55, 87, 165, 236, 262, 320, 408, 452]);
  const cx = kf(f, [[0, 470], [spending, 470], [facebook - 10, 640], [estimates + 20, 760], [website - 6, 760], [website + 30, 1660]]);
  const zoom = kf(f, [[0, 1.25], [spending, 1.25], [facebook - 10, 1.0], [estimates + 20, 1.05], [website - 6, 1.05], [website + 30, 1.0]]);
  const coins = f >= spending && f < website + 20 ? [0, 1, 2, 3].map(i => {
    const t = (((f - spending) + i * 9) % 36) / 36;
    const x = 380 + (700 - 380) * t, y = 560 - 220 * Math.sin(t * Math.PI) + 40 * t;
    return <Coin key={i} x={x} y={y} r={t * 540} s={.9} />;
  }) : null;
  const waves = f > facebook ? [0, 1, 2].map(i => { const t = ((f / 18) + i / 3) % 1; return <path key={i} d={`M${880 + t * 140} ${470 - 40 - t * 40}Q${910 + t * 160} ${470} ${880 + t * 140} ${510 + t * 40}`} stroke={SK.accent} strokeWidth={6} fill="none" opacity={1 - t} strokeLinecap="round" />; }) : null;
  const passers = f > website - 10 ? [0, 1, 2, 3].map(i => {
    const t = (((f - website) * 2.4 + i * 260) % 1100);
    const x = 2200 - t, ph = (f + i * 7) / 3.4;
    return <Person key={i} x={x} y={760} s={.75} kind={i % 2 ? 'home' : 'neighbor'} flip pose={{walk: ph, phone: i === 1}} />;
  }) : null;
  return <StoryStage p={p}>
    <World cx={cx} cy={560} zoom={zoom}>
      <Cloud x={300} y={160} /><Cloud x={1300} y={140} s={1.1} /><Cloud x={2000} y={200} />
      <Ground y={760} />
      <Person x={330} y={760} kind="pro" pose={{armR: f >= spending ? -120 + 30 * Math.sin(f / 4) : -10, mood: f > estimates ? 'worried' : 'neutral'}} />
      {/* the marketing megaphone */}
      <g transform="translate(760 560)" opacity={EOUT(clamp((f - spending + 10) / 12))}>
        <rect x={-30} y={60} width={60} height={140} fill="#C9CED6" />
        <path d="M-80 -30L60 -100V120L-80 50Z" fill={SK.accent} /><rect x={-120} y={-30} width={46} height={80} rx={10} fill="#1F2430" />
        <text x={0} y={22} textAnchor="middle" fontSize={34} fontWeight={900} fill="#fff" fontFamily="Arial" opacity={inOut(f, facebook - 4, 10)}>ADS</text>
      </g>
      {waves}
      {coins}
      {/* leads in the fog */}
      <g opacity={inOut(f, leads - 6, 14)}>
        <ellipse cx={1160} cy={500} rx={170} ry={110} fill="#E6EAF0" /><ellipse cx={1080} cy={470} rx={100} ry={80} fill="#EEF1F5" /><ellipse cx={1250} cy={460} rx={110} ry={86} fill="#EEF1F5" />
        {[1090, 1170, 1250].map((x, i) => <g key={x} opacity={.55}><circle cx={x} cy={470} r={18} fill="#9AA3B2" /><rect x={x - 20} y={492} width={40} height={40} rx={14} fill="#9AA3B2" /></g>)}
        <g transform="translate(1170 400)" opacity={inOut(f, estimates - 4, 10)}><Icon kind="q" c={SK.warn} /></g>
      </g>
      {/* the website storefront */}
      <g transform="translate(1660 760)">
        <rect x={-260} y={-380} width={520} height={380} rx={10} fill="#fff" stroke="#E3E7EE" strokeWidth={4} />
        <rect x={-260} y={-380} width={520} height={70} rx={10} fill="#1F2430" /><text y={-334} textAnchor="middle" fontSize={34} fontWeight={800} fill="#fff" fontFamily="Arial">yourbusiness.com</text>
        <rect x={-70} y={-200} width={140} height={200} rx={8} fill="#BFE0FF" /><rect x={-60} y={-250} width={120} height={36} rx={8} fill={SK.accent} />
        <text y={-224} textAnchor="middle" fontSize={20} fontWeight={800} fill="#fff" fontFamily="Arial">GET A QUOTE</text>
        <rect x={-220} y={-280} width={110} height={90} rx={6} fill="#EEF1F5" /><rect x={110} y={-280} width={110} height={90} rx={6} fill="#EEF1F5" />
      </g>
      <Ground y={760} x0={1200} x1={2600} />
      <g transform="translate(1660 760)"><rect x={-70} y={-200} width={140} height={200} rx={8} fill="#BFE0FF" /></g>
      {passers}
    </World>
    <Tag x={540} y={64} k={inOut(f, marketing - 4, 10) * (1 - inOut(f, facebook - 6, 8))} tone="dark">Money into marketing…</Tag>
    <div style={{position: 'absolute', left: 0, right: 0, top: 64, opacity: inOut(f, facebook - 4, 10) * (1 - inOut(f, website - 8, 8))}}>
      <Tag x={220} y={0} k={inOut(f, facebook - 4, 10)} tone="accent">Facebook ads</Tag>
      <Tag x={540} y={0} k={inOut(f, leads - 4, 10)} tone="light">Leads ?</Tag>
      <Tag x={840} y={0} k={inOut(f, estimates - 4, 10)} tone="light">Estimates ?</Tag>
    </div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 64, opacity: inOut(f, website, 10)}}>
      <Tag x={300} y={0} k={inOut(f, website, 10)} tone="light">Website traffic ↑</Tag>
      <Tag x={760} y={0} k={inOut(f, nobody - 4, 10)} tone="bad">Quote requests: 0</Tag>
    </div>
    <Tag x={540} y={880} k={inOut(f, quote - 4, 10)} tone="dark">They walk right past</Tag>
  </StoryStage>;
};

/* 5 · Ignoring Google even though it's bringing your best customers. */
export const S17Google: React.FC<VisualProps> = (p) => {
  const f = p.frame;
  const [ignoring, google, best] = cues(p, [23, 35, 111]);
  const cx = kf(f, [[0, 560], [best - 14, 560], [best + 12, 330]]);
  const zoom = kf(f, [[0, 1.0], [best - 14, 1.05], [best + 12, 1.25]]);
  const walk = clamp((f - best) / 40);
  const hx = 150 + 180 * EOUT(walk);
  const glow = .5 + .5 * Math.sin(f / 6);
  return <StoryStage p={p}>
    <World cx={cx} cy={560} zoom={zoom}>
      <Cloud x={500} y={160} /><Ground y={760} />
      {/* the search sign behind him, glowing */}
      <g transform="translate(150 760)">
        <rect x={-10} y={-260} width={20} height={260} fill="#C9CED6" />
        <rect x={-130} y={-430} width={260} height={180} rx={24} fill="#fff" stroke={SK.accent} strokeWidth={6} style={{filter: `drop-shadow(0 0 ${18 + 16 * glow}px rgba(0,113,227,.5))`}} />
        <g transform="translate(-70 -340)"><Icon kind="search" c={SK.accent} /></g>
        <text x={-30} y={-330} fontSize={32} fontWeight={800} fill={SK.ink} fontFamily="Arial">Google</text>
        <g transform="translate(0 -285)" opacity={inOut(f, best, 10)}>{[-48, -24, 0, 24, 48].map(x => <g key={x} transform={`translate(${x} 0) scale(.7)`}><Icon kind="star" /></g>)}</g>
      </g>
      {/* contractor busy with the ad megaphone, back to Google */}
      <Person x={560} y={760} kind="pro" pose={{armR: -100, armL: -60, mood: f > best + 10 ? 'happy' : 'neutral', look: f > best + 6 ? -10 : 8}} flip={f > best + 6} />
      <g transform="translate(800 560)"><path d="M-60 -20L60 -80V100L-60 40Z" fill="#9AA3B2" /><rect x={-96} y={-20} width={40} height={64} rx={8} fill="#6B7280" /></g>
      <Person x={hx} y={760} s={.95} kind="home" pose={{walk: walk > 0 && walk < 1 ? f / 3 : undefined, mood: 'happy', armR: walk >= 1 ? -80 : undefined}} />
    </World>
    <Tag x={540} y={64} k={inOut(f, ignoring - 4, 10) * (1 - inOut(f, best - 6, 8))} tone="light">Ignoring Google?</Tag>
    <Tag x={540} y={64} k={inOut(f, best, 10)} tone="accent">★ Your best customers</Tag>
  </StoryStage>;
};

/* 6 · Zoom-through: the camera pushes into the contractor's tablet, which becomes the tracker UI. */
export const S17Tracker: React.FC<VisualProps> = (p) => {
  const f = p.frame;
  const Z = 30;
  const zoom = kf(f, [[0, 1.0], [6, 1.0], [Z, 7.2]]);
  const cx = kf(f, [[0, 560], [6, 560], [Z, 640]]), cy = kf(f, [[0, 560], [6, 560], [Z, 588]]);
  const ui = EOUT(clamp((f - (Z - 10)) / 10));
  return <div style={{position: 'absolute', inset: 0}}>
    {ui < 1 && <StoryStage p={p}>
      <World cx={cx} cy={cy} zoom={zoom}>
        <Ground y={760} />
        <rect x={420} y={620} width={400} height={20} rx={6} fill="#8B6A4E" /><rect x={440} y={640} width={16} height={120} fill="#8B6A4E" /><rect x={784} y={640} width={16} height={120} fill="#8B6A4E" />
        <Person x={470} y={760} kind="pro" pose={{armR: -60, mood: 'neutral'}} />
        <g transform="translate(640 588) rotate(-8)"><rect x={-70} y={-50} width={140} height={100} rx={12} fill="#1F2430" /><rect x={-62} y={-42} width={124} height={84} rx={6} fill="#F5F5F7" />
          {[0, 1, 2].map(i => <rect key={i} x={-52} y={-30 + i * 24} width={104} height={12} rx={4} fill="#E3E7EE" />)}</g>
      </World>
    </StoryStage>}
    <div style={{position: 'absolute', inset: 0, opacity: ui, transform: `scale(${.96 + .04 * ui})`}}>
      {f >= Z - 10 && <L17Tracker {...p} />}
    </div>
  </div>;
};
