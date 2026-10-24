import React from 'react';
import {clamp} from '../../motion';
import {C, cues, sp, lin, smooth, glass, label, Stage, Rise, Kinetic, Bar, Ring, Check, Avatar, Pill, Cursor} from './kit';
import type {VisualProps} from '../../types';

// Sleek product-UI treatment for the faceless "stop underpricing" edit (video11).
// Glass cards over a drifting gradient mesh, spring + blur reveals, a scripted cursor.
// Everything is qualitative: the source gives no prices or percentages.

/* 1 · Underpricing out of fear can cost more than losing the job itself. */
export const MHook: React.FC<VisualProps> = (p) => {
  const [afraid, cost, more, job] = cues(p, [68, 116, 130, 160]);
  const fear = smooth(lin(p, more - 2, 26)), lose = smooth(lin(p, job, 16));
  return <Stage p={p} tint={['#BE123C', '#4F46E5', '#7C3AED']}>
    <Kinetic p={p} at={0} text="Underpricing" size={128} top={150} grad="linear-gradient(90deg,#FFFFFF,#FDA4AF)" />
    <Kinetic p={p} at={cost - 6} text="can cost you more than…" size={50} top={320} weight={600} />
    <Rise p={p} at={6} style={{...glass, left: 80, top: 480, width: 920, height: 250, padding: 48, boxSizing: 'border-box'}}>
      <div style={label}>Underpricing out of fear</div>
      <div style={{fontSize: 46, fontWeight: 800, margin: '18px 0 30px'}}>Cost to you</div>
      <Bar v={.12 + .86 * fear} h={26} color="linear-gradient(90deg,#FB7185,#F59E0B)" />
    </Rise>
    <Rise p={p} at={afraid} style={{...glass, left: 80, top: 780, width: 920, height: 250, padding: 48, boxSizing: 'border-box'}}>
      <div style={label}>Losing the job itself</div>
      <div style={{fontSize: 46, fontWeight: 800, margin: '18px 0 30px'}}>Cost to you</div>
      <Bar v={.1 + .3 * lose} h={26} color="linear-gradient(90deg,#94A3B8,#CBD5E1)" />
    </Rise>
    <Rise p={p} at={more + 18} style={{left: 80, top: 1080}}><Pill color={C.bad}>▲ Costs more</Pill></Rise>
  </Stage>;
};

/* 2 · Afraid of losing the job, they drag the price down: job won, profit hurt. */
export const MFear: React.FC<VisualProps> = (p) => {
  const [contractors, lower, afraid, someone, win, hurts] = cues(p, [54, 72, 125, 166, 228, 276]);
  const knob = .86 - .42 * smooth(lin(p, lower + 2, 40));
  const profit = clamp((knob - .34) / .52);
  const hurt = lin(p, hurts - 4, 10);
  const trackX = 140, trackW = 800, trackY = 560;
  const kx = trackX + trackW * knob;
  const burst = lin(p, win, 26);
  return <Stage p={p} tint={['#F59E0B', '#4F46E5', '#DB2777']}>
    <Kinetic p={p} at={contractors - 40} text="Scared of losing the job…" size={70} top={130} />
    <Rise p={p} at={contractors - 20} style={{...glass, left: 80, top: 300, width: 920, height: 520}}>
      <div style={{position: 'absolute', left: 60, top: 54, ...label}}>Your quote</div>
      <div style={{position: 'absolute', left: 60, top: 96, fontSize: 52, fontWeight: 800}}>Price</div>
    </Rise>
    <div style={{position: 'absolute', left: trackX, top: trackY, width: trackW, opacity: clamp(sp(p, contractors - 14) * 1.4)}}>
      <Bar v={knob} h={20} color="linear-gradient(90deg,#818CF8,#22D3EE)" />
      <div style={{position: 'absolute', left: trackW * .86 - 2, top: -22, width: 4, height: 64, background: 'rgba(255,255,255,.3)', borderRadius: 2}} />
      <div style={{position: 'absolute', left: trackW * .86 - 70, top: 50, fontSize: 22, fontWeight: 700, color: C.mute, opacity: lin(p, lower + 10, 10)}}>was here</div>
    </div>
    <div style={{position: 'absolute', left: kx - 26, top: trackY - 16, width: 52, height: 52, borderRadius: '50%', background: '#FFFFFF', boxShadow: '0 6px 24px rgba(34,211,238,.6)', opacity: clamp(sp(p, contractors - 14) * 1.4)}} />
    <div style={{position: 'absolute', left: 140, top: 660, width: 800, opacity: clamp(sp(p, contractors - 8) * 1.4)}}>
      <div style={{display: 'flex', justifyContent: 'space-between', ...label, color: hurt > .5 ? C.bad : C.mute}}><span>Profit</span><span>{hurt > .5 ? 'hurt ▼' : ''}</span></div>
      <div style={{height: 14}} />
      <Bar v={.1 + .9 * profit} h={20} color={hurt > .5 ? C.bad : C.good} />
    </div>
    <Rise p={p} at={afraid - 4} dy={0} style={{...glass, left: 380 + 300 * (1 - clamp(sp(p, afraid - 4))), top: 870, width: 620, height: 130, borderRadius: 32, display: 'flex', alignItems: 'center', gap: 24, padding: '0 30px', boxSizing: 'border-box'}}>
      <Avatar c="#F59E0B" /><div><div style={{fontSize: 24, color: C.mute, fontWeight: 600}}>Homeowner · now</div><div style={{fontSize: 34, fontWeight: 750}}>Hmm… isn't that a lot?</div></div>
    </Rise>
    <Rise p={p} at={someone - 4} style={{left: 80, top: 1040, display: 'flex', alignItems: 'center', gap: 18}}>
      <div style={{display: 'flex'}}><Avatar c="#64748B" s={56} /><div style={{marginLeft: -16}}><Avatar c="#94A3B8" s={56} /></div></div>
      <div style={{fontSize: 30, fontWeight: 650, color: C.mute}}>Other contractors are bidding</div>
    </Rise>
    <Rise p={p} at={win - 4} style={{left: 0, right: 0, top: 1170, display: 'flex', justifyContent: 'center'}}><Pill color={C.good} solid>✓ Job won</Pill></Rise>
    {burst > 0 && burst < 1 && Array.from({length: 12}, (_, i) => { const a = i / 12 * Math.PI * 2; return <div key={i} style={{position: 'absolute', left: 540 + Math.cos(a) * 220 * smooth(burst), top: 1210 + Math.sin(a) * 110 * smooth(burst), width: 12, height: 12, borderRadius: 6, background: i % 2 ? C.good : C.b, opacity: 1 - burst}} />; })}
    <Cursor p={p} path={[[lower - 24, 1000, 760], [lower - 4, kx + 4, trackY + 10], [lower + 2, trackX + trackW * .86 + 4, trackY + 10], [lower + 42, trackX + trackW * .44 + 4, trackY + 10], [lower + 60, 980, 900]]} clicks={[lower]} />
  </Stage>;
};

/* 3 · Same work for less money: less room for surprises, crew pay and profit. */
export const MRoom: React.FC<VisualProps> = (p) => {
  const [same, work, less, room, unexpected, crew, profit] = cues(p, [72, 95, 110, 169, 184, 239, 299]);
  const pay = 1 - .38 * smooth(lin(p, less, 26));
  const rows = [['Unexpected costs', unexpected, C.bad], ['Crew pay', crew, C.b], ['Profit', profit, C.good]] as const;
  return <Stage p={p} tint={['#2563EB', '#0EA5E9', '#7C3AED']}>
    <Kinetic p={p} at={same - 8} text="Same work." size={88} top={120} />
    <Kinetic p={p} at={less - 8} text="Less money." size={88} top={220} grad="linear-gradient(90deg,#FDA4AF,#FBBF24)" />
    <Rise p={p} at={work - 6} style={{...glass, left: 80, top: 380, width: 920, height: 170, padding: '40px 48px', boxSizing: 'border-box'}}>
      <div style={label}>The work</div><div style={{height: 26}} />
      <Bar v={smooth(lin(p, work, 20))} h={26} color="linear-gradient(90deg,#818CF8,#A78BFA)" />
    </Rise>
    <Rise p={p} at={less - 10} style={{...glass, left: 80, top: 590, width: 400, height: 520, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 30}}>
      <div style={label}>Your payout</div>
      <Ring v={pay * smooth(lin(p, less - 10, 14))} size={270} stroke={26} from="#FBBF24" to="#FB7185"><div style={{fontSize: 40, fontWeight: 800}}>{pay < .9 ? 'less' : 'full'}</div></Ring>
    </Rise>
    <Rise p={p} at={room - 8} style={{...glass, left: 520, top: 590, width: 480, height: 520, padding: '46px 40px', boxSizing: 'border-box'}}>
      <div style={label}>Room left for</div>
      {rows.map(([t, at, c], i) => {
        const k = sp(p, at - 6), sq = 1 - .5 * smooth(lin(p, at + 10, 18));
        return <div key={t} style={{marginTop: i ? 44 : 38, opacity: clamp(k * 1.4), transform: `translateX(${(1 - k) * 30}px)`}}>
          <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 32, fontWeight: 750, marginBottom: 14}}><span>{t}</span><span style={{fontSize: 24, color: C.bad, opacity: lin(p, at + 16, 10)}}>▼</span></div>
          <Bar v={sq} h={18} color={c} />
        </div>;
      })}
    </Rise>
  </Stage>;
};

/* 4 · Homeowners can tell: a quote revised down three times vs one locked, trustworthy price. */
export const MTell: React.FC<VisualProps> = (p) => {
  const [unsure, confident, trustworthy, lowering, nervous] = cues(p, [47, 140, 189, 240, 273]);
  const rev = Math.min(3, Math.max(0, Math.floor((p.frame - lowering + 4) / 9) + 1));
  const prices = ['$$$$', '$$$', '$$', '$'];
  const Phone: React.FC<{x: number; at: number; glow?: string; children: React.ReactNode}> = ({x, at, glow, children}) =>
    <Rise p={p} at={at} style={{...glass, left: x, top: 290, width: 440, height: 800, borderRadius: 64, border: glow ? `2.5px solid ${glow}` : glass.border, boxShadow: glow ? `0 0 80px ${glow}55, ${glass.boxShadow}` : glass.boxShadow}}>
      <div style={{position: 'absolute', left: 170, top: 22, width: 100, height: 28, borderRadius: 14, background: 'rgba(0,0,0,.5)'}} />{children}</Rise>;
  const dots = [0, 1, 2].map(i => .35 + .65 * Math.abs(Math.sin(p.frame / 6 - i * .7)));
  return <Stage p={p} tint={['#E11D48', '#0891B2', '#4F46E5']}>
    <Kinetic p={p} at={unsure - 8} text="Homeowners can tell." size={78} top={130} />
    <Phone x={80} at={unsure}>
      <div style={{position: 'absolute', left: 44, top: 100, ...label}}>Quote · v{rev + 1}</div>
      {prices.slice(0, rev + 1).map((pr, i) => {
        const cur = i === rev, k = sp(p, lowering - 4 + (i - 1) * 9);
        return <div key={i} style={{position: 'absolute', left: 44, top: 160 + i * 96, fontSize: cur ? 84 : 52, fontWeight: 800, color: cur ? C.bad : 'rgba(255,255,255,.28)', textDecoration: cur ? 'none' : 'line-through', opacity: i === 0 ? 1 : clamp(k * 1.4), transform: `translateY(${(1 - (i === 0 ? 1 : k)) * 30}px)`}}>{pr}</div>;
      })}
      {rev > 0 && <div style={{position: 'absolute', left: 44, top: 590}}><Pill color={C.bad}>Revised {rev}×</Pill></div>}
      <Rise p={p} at={nervous - 4} style={{left: 44, top: 690, padding: '20px 28px', borderRadius: 28, background: 'rgba(255,255,255,.1)', display: 'flex', gap: 10, alignItems: 'center', fontSize: 26, fontWeight: 650}}>
        I can go lower {dots.map((o, i) => <span key={i} style={{width: 10, height: 10, borderRadius: 5, background: '#FFF', opacity: o}} />)}
      </Rise>
    </Phone>
    <Phone x={560} at={confident - 4} glow={p.frame > trustworthy - 4 ? C.good : undefined}>
      <div style={{position: 'absolute', left: 44, top: 100, ...label}}>Quote</div>
      <div style={{position: 'absolute', left: 44, top: 160, fontSize: 84, fontWeight: 800}}>$$$$</div>
      <Rise p={p} at={trustworthy - 2} style={{left: 44, top: 300, display: 'flex', alignItems: 'center', gap: 18}}>
        <div style={{width: 64, height: 64, borderRadius: 32, background: C.good, display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Check k={lin(p, trustworthy + 4, 10)} size={40} /></div>
        <div style={{fontSize: 34, fontWeight: 800}}>Trustworthy</div>
      </Rise>
      <Rise p={p} at={trustworthy + 10} style={{left: 44, right: 44, top: 420, padding: '22px 26px', borderRadius: 24, background: 'rgba(52,211,153,.12)', border: '1.5px solid rgba(52,211,153,.35)', fontSize: 28, fontWeight: 700}}>Price locked in</Rise>
    </Phone>
  </Stage>;
};

/* 5 · Confident pricing wins: explain the price line by line, trust fills up. */
export const MExplain: React.FC<VisualProps> = (p) => {
  const [confident, win, worth, explain, customers, trust] = cues(p, [18, 76, 146, 169, 196, 252]);
  const rows = ['Materials', 'Labor', 'Timeline', "What's included"];
  const bx = 120, by = 1150;
  return <Stage p={p} tint={['#059669', '#4F46E5', '#0EA5E9']}>
    <Rise p={p} at={confident - 6} style={{left: 80, top: 120}}><div style={label}>Confident pricing</div></Rise>
    <Kinetic p={p} at={worth - 12} text="Explain the price." size={84} top={170} />
    <Rise p={p} at={win - 4} style={{left: 80, top: 290}}><Pill color={C.good}>▲ More jobs won</Pill></Rise>
    <Rise p={p} at={worth - 8} style={{...glass, left: 80, top: 420, width: 600, height: 700, padding: '44px 40px', boxSizing: 'border-box'}}>
      <div style={{...label, marginBottom: 20}}>Your quote</div>
      {rows.map((r, i) => {
        const open = smooth(lin(p, explain + 6 + i * 8, 14));
        return <div key={r} style={{borderTop: '1.5px solid rgba(255,255,255,.1)', padding: '20px 0'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 34, fontWeight: 750}}><span>{r}</span><span style={{color: C.mute, transform: `rotate(${open * 90}deg)`}}>›</span></div>
          <div style={{height: 52 * open, overflow: 'hidden', opacity: open}}><div style={{height: 14}} /><Bar v={.55 + i * .1} h={12} color="rgba(255,255,255,.22)" track={false} /><div style={{height: 10}} /><Bar v={.35 + i * .08} h={12} color="rgba(255,255,255,.14)" track={false} /></div>
        </div>;
      })}
    </Rise>
    <div style={{position: 'absolute', left: bx, top: by, width: 520, height: 84, borderRadius: 42, background: p.frame > explain ? 'linear-gradient(90deg,#34D399,#22D3EE)' : 'rgba(255,255,255,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 800, color: p.frame > explain ? '#06120C' : C.ink, opacity: clamp(sp(p, worth) * 1.4), transform: `scale(${p.frame >= explain && p.frame < explain + 5 ? .96 : 1})`}}>Explain price</div>
    <Rise p={p} at={customers - 8} style={{...glass, left: 720, top: 420, width: 280, height: 700, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 34}}>
      <div style={label}>Trust</div>
      <Ring v={.08 + .8 * smooth(lin(p, customers, trust - customers + 30))} size={200} stroke={20} from="#34D399" to="#22D3EE"><Avatar c="#34D399" s={86} /></Ring>
      <div style={{fontSize: 26, fontWeight: 650, color: C.mute, textAlign: 'center', padding: '0 20px'}}>customers have a reason</div>
    </Rise>
    <Cursor p={p} path={[[explain - 30, 900, 1300], [explain - 4, bx + 300, by + 40], [explain + 20, bx + 320, by + 50], [explain + 40, 980, 1300]]} clicks={[explain]} />
  </Stage>;
};

/* 6 · A lost bid stings; underpaid jobs are worse: booked nonstop, stress up, money flat. */
export const MWorse: React.FC<VisualProps> = (p) => {
  const [constantly, worse, nonstop, stress, barely] = cues(p, [53, 130, 165, 209, 226]);
  const filled = Math.floor(smooth(lin(p, nonstop - 10, 34)) * 35);
  const needle = -90 + 160 * smooth(lin(p, stress - 4, 22));
  const flat = smooth(lin(p, barely - 4, 30));
  const spark = Array.from({length: 24}, (_, i) => `${i * 16},${70 - (i < 4 ? i * 3 : 9 + Math.sin(i) * 2)}`).join(' ');
  return <Stage p={p} tint={['#DC2626', '#7C3AED', '#EA580C']}>
    <Rise p={p} at={0} style={{...glass, left: 80, top: 120, width: 380, height: 170, padding: '34px 40px', boxSizing: 'border-box'}}>
      <div style={label}>Lost bid</div><div style={{fontSize: 56, fontWeight: 800, color: C.mute, marginTop: 10}}>−1 job</div>
    </Rise>
    <Kinetic p={p} at={constantly - 6} text="Winning underpaid jobs" size={66} top={340} grad="linear-gradient(90deg,#FFFFFF,#FDA4AF)" />
    <Kinetic p={p} at={worse - 6} text="is worse." size={66} top={420} grad="linear-gradient(90deg,#FB7185,#F97316)" />
    <Rise p={p} at={nonstop - 14} style={{...glass, left: 80, top: 540, width: 920, height: 400, padding: '36px 44px', boxSizing: 'border-box'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', ...label}}><span>Your calendar</span><span style={{color: C.bad, opacity: lin(p, nonstop + 20, 10)}}>booked nonstop</span></div>
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 12, marginTop: 26}}>
        {Array.from({length: 35}, (_, i) => <div key={i} style={{height: 46, borderRadius: 12, background: i < filled ? `linear-gradient(140deg, ${['#F97316', '#EF4444', '#E11D48'][i % 3]}, #7C3AED)` : 'rgba(255,255,255,.07)', transform: `scale(${i < filled ? 1 : .9})`, boxShadow: i < filled ? '0 0 18px rgba(239,68,68,.35)' : 'none'}} />)}
      </div>
    </Rise>
    <Rise p={p} at={stress - 8} style={{...glass, left: 80, top: 980, width: 440, height: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
      <div style={label}>Stress</div>
      <svg width="300" height="170" viewBox="0 0 300 170"><path d="M30 150A120 120 0 0 1 270 150" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="22" strokeLinecap="round" />
        <path d="M30 150A120 120 0 0 1 270 150" fill="none" stroke="url(#sg)" strokeWidth="22" strokeLinecap="round" pathLength={1} strokeDasharray={`${(needle + 90) / 180} 1`} />
        <defs><linearGradient id="sg"><stop offset="0" stopColor="#FBBF24" /><stop offset="1" stopColor="#EF4444" /></linearGradient></defs>
        <g transform={`rotate(${needle} 150 150)`}><path d="M150 150V52" stroke="#FFF" strokeWidth="6" strokeLinecap="round" /></g><circle cx="150" cy="150" r="12" fill="#FFF" /></svg>
    </Rise>
    <Rise p={p} at={barely - 8} style={{...glass, left: 560, top: 980, width: 440, height: 300, padding: '36px 40px', boxSizing: 'border-box'}}>
      <div style={label}>Money</div>
      <svg width="370" height="110" viewBox="0 0 370 90" style={{marginTop: 24}}><polyline points={spark} fill="none" stroke={C.good} strokeWidth="5" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - flat} /></svg>
      <div style={{fontSize: 28, fontWeight: 700, color: C.mute, opacity: lin(p, barely + 14, 10)}}>barely moving</div>
    </Rise>
  </Stage>;
};

/* 7 · Set it on what it's worth, stand behind it, explain why. */
export const MSteps: React.FC<VisualProps> = (p) => {
  const at = cues(p, [0, 91, 135]);
  const steps = [['Set it', 'on what the job is actually worth'], ['Stand behind it', 'no fear discounts'], ['Explain why', 'why it costs what it does']] as const;
  const line = smooth(lin(p, at[0] + 10, at[2] - at[0]));
  return <Stage p={p} tint={['#059669', '#0891B2', '#4F46E5']}>
    <Kinetic p={p} at={0} text="Your price:" size={92} top={140} />
    <div style={{position: 'absolute', left: 168, top: 400, width: 4, height: 640 * line, borderRadius: 2, background: 'linear-gradient(#34D399,#22D3EE)'}} />
    {steps.map(([t, s], i) => {
      const done = p.frame > (at[i + 1] ?? at[i] + 40) - 4;
      return <Rise key={t} p={p} at={at[i]} style={{...glass, left: 80, top: 330 + i * 300, width: 920, height: 240, display: 'flex', alignItems: 'center', gap: 40, padding: '0 50px', boxSizing: 'border-box'}}>
        <div style={{width: 96, height: 96, borderRadius: 48, flex: 'none', background: done ? 'linear-gradient(140deg,#34D399,#22D3EE)' : 'rgba(255,255,255,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 46, fontWeight: 800, color: done ? '#06120C' : C.ink}}>
          {done ? <Check k={lin(p, (at[i + 1] ?? at[i] + 40), 10)} size={56} /> : i + 1}</div>
        <div><div style={{fontSize: 58, fontWeight: 800, letterSpacing: -1.5}}>{t}</div><div style={{fontSize: 32, color: C.mute, fontWeight: 600, marginTop: 6}}>{s}</div></div>
      </Rise>;
    })}
  </Stage>;
};

/* 8 · Same kitchen, two quotes: one discounts in fear, the other explains, stands by it, gets accepted. */
export const MKitchen: React.FC<VisualProps> = (p) => {
  const [two, kitchen, one, discount, other, explains, stands, second, confident] = cues(p, [19, 75, 100, 151, 215, 233, 271, 309, 403]);
  const accept = second + 26, ok = p.frame >= accept;
  const dimA = smooth(lin(p, second, 16));
  const wob = Math.sin((p.frame - discount) / 4) * 6 * Math.exp(-Math.max(0, p.frame - discount) / 30);
  const card: React.CSSProperties = {...glass, top: 330, width: 445, height: 760, padding: '44px 38px', boxSizing: 'border-box'};
  return <Stage p={p} tint={['#D97706', '#4F46E5', '#059669']}>
    <Kinetic p={p} at={two - 6} text="Same kitchen remodel." size={70} top={120} />
    <Kinetic p={p} at={kitchen - 6} text="Two quotes." size={70} top={205} grad="linear-gradient(90deg,#A5B4FC,#67E8F9)" />
    <Rise p={p} at={one - 6} style={{...card, left: 80, opacity: 1 - .55 * dimA}}>
      <div style={label}>Contractor 1</div>
      <div style={{fontSize: 80, fontWeight: 800, marginTop: 30}}>$$$</div>
      <Rise p={p} at={discount - 4} style={{left: 38, top: 230, transform: `rotate(${-4 + wob}deg)`}}><Pill color={C.bad} solid>Discount</Pill></Rise>
      <div style={{position: 'absolute', left: 38, top: 340, fontSize: 30, color: C.mute, fontWeight: 600, lineHeight: 1.4, opacity: lin(p, discount + 16, 12)}}>offered right away,<br />afraid to lose it</div>
    </Rise>
    <Rise p={p} at={other - 6} style={{...card, left: 555, border: ok ? `2.5px solid ${C.good}` : glass.border, boxShadow: ok ? `0 0 90px ${C.good}55, ${glass.boxShadow}` : glass.boxShadow}}>
      <div style={label}>Contractor 2</div>
      <div style={{fontSize: 80, fontWeight: 800, marginTop: 30}}>$$$$</div>
      {['Materials', 'Labor', 'Timeline'].map((r, i) => <div key={r} style={{display: 'flex', alignItems: 'center', gap: 16, marginTop: i ? 16 : 30, fontSize: 30, fontWeight: 700, opacity: clamp(sp(p, explains - 4 + i * 6) * 1.4), transform: `translateX(${(1 - clamp(sp(p, explains - 4 + i * 6))) * 24}px)`}}>
        <div style={{width: 12, height: 12, borderRadius: 6, background: C.b}} />{r}</div>)}
      <Rise p={p} at={stands - 4} style={{left: 38, right: 38, top: 470, padding: '18px 22px', borderRadius: 22, background: 'rgba(52,211,153,.12)', border: '1.5px solid rgba(52,211,153,.35)', fontSize: 26, fontWeight: 700}}>Stands by the price</Rise>
      <div style={{position: 'absolute', left: 38, right: 38, top: 600, height: 92, borderRadius: 46, background: ok ? 'linear-gradient(90deg,#34D399,#22D3EE)' : 'rgba(255,255,255,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontSize: 32, fontWeight: 800, color: ok ? '#06120C' : C.ink, opacity: lin(p, stands, 12), transform: `scale(${p.frame >= accept && p.frame < accept + 5 ? .95 : 1})`}}>
        {ok ? <><Check k={lin(p, accept + 2, 10)} size={38} /> Accepted</> : 'Accept quote'}</div>
    </Rise>
    <Rise p={p} at={confident - 4} style={{left: 0, right: 0, top: 1150, display: 'flex', justifyContent: 'center', gap: 22}}><Pill color={C.good}>Confident</Pill><Pill color={C.b}>Trustworthy</Pill></Rise>
    <Cursor p={p} path={[[second - 20, 300, 1300], [accept - 4, 777, 975], [accept + 30, 790, 990], [accept + 50, 1000, 1350]]} clicks={[accept]} />
  </Stage>;
};
