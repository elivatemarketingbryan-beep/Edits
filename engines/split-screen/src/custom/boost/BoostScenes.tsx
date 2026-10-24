import React from 'react';
import {clamp} from '../../motion';
import type {VisualProps} from '../../types';

// Scenes for "boosting isn't Facebook ads" (job video8). Interfaces are generic
// illustrations, not Meta's real UI. Cues are local beat frames from word timings.
const ramp = (frame: number, start: number, length = 14) => clamp((frame - start) / length);
const ease = (v: number) => 1 - Math.pow(1 - v, 3);
const back = (v: number) => { const c = 1.7; return 1 + (c + 1) * Math.pow(v - 1, 3) + c * Math.pow(v - 1, 2); };
const cues = (p: VisualProps, fallback: number[]) => {
  const data = p.beat.visual.type === 'custom' ? p.beat.visual.props?.cues : undefined;
  return Array.isArray(data) && data.every(n => typeof n === 'number') ? data as number[] : fallback;
};
const SANS = 'Inter, Arial, sans-serif';
const SERIF = 'Georgia, "Times New Roman", serif';
const BLUE = '#1877F2';
const draw = (k: number) => ({pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - k});
const Svg: React.FC<{bg: string; children: React.ReactNode}> = ({bg, children}) =>
  <svg viewBox="0 0 1080 960" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
    <rect width="1080" height="960" fill={bg} />{children}
  </svg>;
const Person: React.FC<{x: number; y: number; s?: number; fill: string}> = ({x, y, s = 1, fill}) =>
  <g transform={`translate(${x} ${y}) scale(${s})`}><circle cy="-22" r="16" fill={fill} /><path d="M-26 22Q-26-4 0-4Q26-4 26 22Z" fill={fill} /></g>;
const Heart: React.FC<{x: number; y: number; s?: number; fill: string}> = ({x, y, s = 1, fill}) =>
  <path transform={`translate(${x} ${y}) scale(${s})`} d="M0 10C-18-4-24-12-16-20C-10-26-3-23 0-17C3-23 10-26 16-20C24-12 18-4 0 10Z" fill={fill} />;
const PhoneGlyph: React.FC<{x: number; y: number; s?: number; fill: string}> = ({x, y, s = 1, fill}) =>
  <path transform={`translate(${x} ${y}) scale(${s})`} d="M-12-16Q-14 4 0 14T18 16L18 8L9 5L4 10Q-4 6-6-2L-1-6L-4-16Z" fill={fill} />;
const PostCard: React.FC<{w: number; h: number; photo?: string}> = ({w, h, photo = '#C9D6E8'}) => <g>
  <rect width={w} height={h} rx="18" fill="#FFFFFF" stroke="#DADDE1" strokeWidth="3" />
  <circle cx="44" cy="44" r="22" fill={BLUE} />
  <rect x="80" y="30" width={w * .3} height="13" rx="6" fill="#1C1E21" /><rect x="80" y="52" width={w * .18} height="10" rx="5" fill="#BCC0C4" />
  <rect x="20" y="86" width={w - 40} height={h * .55} rx="8" fill={photo} />
  <path d={`M${w * .25} ${86 + h * .55}V${86 + h * .3}L${w * .5} ${86 + h * .14}L${w * .75} ${86 + h * .3}V${86 + h * .55}Z`} fill="#FFFFFF" opacity=".75" />
</g>;
const Rail: React.FC<{step: number; frame: number; dark?: boolean}> = ({step, frame, dark}) => {
  const dim = dark ? '#3A4252' : '#D6D0C4';
  return <g>
    <path d="M140 80H940" stroke={dim} strokeWidth="6" />
    <path d={`M140 80H${140 + (step - 1) * 200 * ease(ramp(frame, 0, 16)) + (step > 1 ? 0 : 0)}`} stroke={BLUE} strokeWidth="6" />
    {[1, 2, 3, 4, 5].map(i => {
      const on = i < step || (i === step && frame > 4);
      const cur = i === step ? back(ease(ramp(frame, 0, 12))) : 1;
      return <g key={i} transform={`translate(${140 + (i - 1) * 200} 80) scale(${i === step ? .8 + .2 * cur : 1})`}>
        <circle r="32" fill={on ? BLUE : dark ? '#1A2130' : '#FFFFFF'} stroke={on ? BLUE : dim} strokeWidth="5" />
        <text y="12" textAnchor="middle" fontFamily={SANS} fontSize="32" fontWeight="900" fill={on ? '#FFFFFF' : dark ? '#7D8799' : '#A39C8E'}>{i}</text>
      </g>;
    })}
  </g>;
};
const Title: React.FC<{text: string; frame: number; at?: number; dark?: boolean; y?: number}> = ({text, frame, at = 0, dark, y = 190}) =>
  <text x="80" y={y} fontFamily={SANS} fontSize="54" fontWeight="900" letterSpacing="-1.5" fill={dark ? '#FFFFFF' : '#1B1B1B'} opacity={ease(ramp(frame, at - 4, 10))}>{text}</text>;

/* 2 · Boost a nice project post, throw $100 at it, get a couple of likes from non-buyers. */
export const BoostPost: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [tells, boost, hundred, likes, never] = cues(p, [93, 114, 169, 229, 264]);
  const pulse = frame > tells - 6 && frame < boost ? 1 + .06 * Math.sin(frame / 2.5) : 1;
  const pressed = ramp(frame, boost - 2, 4);
  const chip = back(ease(ramp(frame, hundred - 6, 12)));
  const likeN = frame < likes - 4 ? 0 : Math.min(2, 1 + Math.floor((frame - likes + 4) / 10));
  const fans = ease(ramp(frame, likes - 4, 12));
  return <Svg bg="#F0F2F5">
    <g transform="translate(140 80)" opacity={ramp(frame, 0, 12)}>
      <PostCard w={800} h={600} />
      <text x="28" y="472" fontFamily={SANS} fontSize="30" fontWeight="700" fill="#65676B">Nice project! ✨</text>
      <g transform="translate(28 512)">
        <Heart x={18} y={18} s={1.1} fill={likeN ? '#F02849' : '#BCC0C4'} />
        <text x="46" y="30" fontFamily={SANS} fontSize="32" fontWeight="800" fill="#65676B">{likeN}</text>
      </g>
      <g transform={`translate(${800 - 260} 500) scale(${pulse})`}>
        <rect width="230" height="70" rx="12" fill={pressed > .5 ? '#0B5BC4' : BLUE} />
        <text x="115" y="46" textAnchor="middle" fontFamily={SANS} fontSize="32" fontWeight="900" fill="#FFFFFF">Boost post</text>
      </g>
    </g>
    <g transform={`translate(860 520) rotate(-8) scale(${chip})`} opacity={clamp(chip)}>
      <rect x="-90" y="-46" width="180" height="92" rx="46" fill="#1F9D55" />
      <text y="18" textAnchor="middle" fontFamily={SANS} fontSize="52" fontWeight="900" fill="#FFFFFF">$100</text>
    </g>
    <g opacity={fans}>
      <Person x={200} y={800} fill={frame > never - 4 ? '#B0B3B8' : '#65676B'} />
      <Person x={270} y={800} fill={frame > never - 4 ? '#B0B3B8' : '#65676B'} />
      <Heart x={234} y={740} s={.9} fill="#F02849" />
      <text x="320" y="815" fontFamily={SANS} fontSize="36" fontWeight="800" fill="#65676B">a couple of likes</text>
    </g>
    <text x="640" y="815" fontFamily={SANS} fontSize="36" fontWeight="900" fill="#C0392B" opacity={ease(ramp(frame, never - 4, 10))}>· not buyers</text>
  </Svg>;
};

/* 3 · No calls, no quote requests, no jobs, so "Facebook ads don't work". */
export const ZeroResults: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [calls, quotes, jobs, thinking] = cues(p, [32, 81, 140, 216]);
  const tiles = [['Calls', calls], ['Quote requests', quotes], ['Jobs', jobs]] as const;
  const q = ease(ramp(frame, thinking - 6, 14));
  return <Svg bg="#111418">
    <text x="80" y="130" fontFamily={SANS} fontSize="40" fontWeight="800" letterSpacing="3" fill="#7D8799" opacity={ramp(frame, 0, 10)}>RESULTS FROM THE BOOST</text>
    {tiles.map(([label, at], i) => {
      const k = back(ease(ramp(frame, at - 6, 12)));
      return <g key={label} transform={`translate(${80 + i * 315} 190)`} opacity={clamp(k)}>
        <rect width="290" height="330" rx="24" fill="#1A1F27" stroke="#2A313C" strokeWidth="3" />
        <text x="145" y="215" textAnchor="middle" fontFamily={SANS} fontSize="180" fontWeight="900" fill="#FF5A4E" transform={`translate(145 150) scale(${k}) translate(-145 -150)`}>0</text>
        <text x="145" y="290" textAnchor="middle" fontFamily={SANS} fontSize="34" fontWeight="800" fill="#FFFFFF">{label}</text>
      </g>;
    })}
    <g opacity={q} transform={`translate(80 ${650 + (1 - q) * 20})`}>
      <text fontFamily={SERIF} fontSize="58" fontStyle="italic" fill="#E8E2D6">“Facebook ads don't</text>
      <text y="74" fontFamily={SERIF} fontSize="58" fontStyle="italic" fill="#E8E2D6">work for my trade.”</text>
    </g>
  </Svg>;
};

/* 4 · Boosting buys attention; a lead campaign gets customers to take action. */
export const BoostVsCampaign: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [boosting, lead, different, attention, campaign, customers, action] = cues(p, [66, 125, 203, 299, 347, 416, 456]);
  const L = ease(ramp(frame, boosting - 4, 10)), R = ease(ramp(frame, lead - 4, 10));
  const neq = back(ease(ramp(frame, different - 4, 12)));
  const chip = (x: number, y: number, label: string, k: number, fill: string, ink: string, icon: React.ReactNode) =>
    <g opacity={k} transform={`translate(${x} ${y + (1 - k) * 20})`}>
      <rect width="380" height="84" rx="42" fill={fill} />
      {icon}
      <text x="90" y="54" fontFamily={SANS} fontSize="36" fontWeight="850" fill={ink}>{label}</text>
    </g>;
  return <Svg bg="#0B0B0B">
    <text x="80" y="150" fontFamily={SANS} fontSize="58" fontWeight="900" letterSpacing="-2" fill="#FFFFFF" opacity={L}>BOOST</text>
    <text x="80" y="200" fontFamily={SERIF} fontSize="34" fontStyle="italic" fill="#9A9A9A" opacity={L}>a post</text>
    <text x="580" y="150" fontFamily={SANS} fontSize="50" fontWeight="900" letterSpacing="-2" fill="#FFD400" opacity={R}>LEAD CAMPAIGN</text>
    <text x="580" y="200" fontFamily={SERIF} fontSize="34" fontStyle="italic" fill="#9A9A9A" opacity={R}>built for leads</text>
    <path d="M540 120V820" stroke="#2A2A2A" strokeWidth="4" />
    <g transform={`translate(540 250) scale(${neq})`} opacity={clamp(neq)}>
      <circle r="46" fill="#0B0B0B" stroke="#FFD400" strokeWidth="5" />
      <text y="24" textAnchor="middle" fontFamily={SANS} fontSize="70" fontWeight="900" fill="#FFD400">≠</text>
    </g>
    <text x="80" y="330" fontFamily={SANS} fontSize="62" fontWeight="900" letterSpacing="-2" fill="#FFFFFF" opacity={ease(ramp(frame, attention - 6, 10))}>Attention</text>
    {chip(80, 400, 'Views', ease(ramp(frame, attention + 4, 10)), '#1F1F1F', '#FFFFFF',
      <g transform="translate(46 42)"><ellipse rx="22" ry="13" fill="none" stroke="#FFFFFF" strokeWidth="4" /><circle r="6" fill="#FFFFFF" /></g>)}
    {chip(80, 510, 'Likes', ease(ramp(frame, attention + 10, 10)), '#1F1F1F', '#FFFFFF', <Heart x={46} y={44} s={1} fill="#F02849" />)}
    <text x="580" y="330" fontFamily={SANS} fontSize="62" fontWeight="900" letterSpacing="-2" fill="#FFD400" opacity={ease(ramp(frame, action - 6, 10))}>Action</text>
    {chip(580, 400, 'Calls', ease(ramp(frame, customers - 4, 10)), '#FFD400', '#0B0B0B', <PhoneGlyph x={46} y={42} s={1.3} fill="#0B0B0B" />)}
    {chip(580, 510, 'Quote forms', ease(ramp(frame, customers + 6, 10)), '#FFD400', '#0B0B0B',
      <g transform="translate(46 42)"><rect x="-14" y="-18" width="28" height="36" rx="4" fill="none" stroke="#0B0B0B" strokeWidth="4" /><path d="M-7-6H7M-7 4H7" stroke="#0B0B0B" strokeWidth="3" /></g>)}
    <text x="580" y="700" fontFamily={SERIF} fontSize="36" fontStyle="italic" fill="#FFD400" opacity={ease(ramp(frame, campaign - 4, 10))}>potential customers</text>
  </Svg>;
};

/* 6 · Step 1: set the campaign objective to leads; find people likely to contact you. */
export const StepObjective: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [first, leads, , contact, pictures] = cues(p, [5, 60, 107, 174, 216]);
  const rows = ['Awareness', 'Traffic', 'Leads'];
  const sel = ease(ramp(frame, leads - 4, 10));
  return <Svg bg="#F6F1E7">
    <Rail step={1} frame={frame} />
    <Title text="Set the goal to Leads" frame={frame} at={first} />
    <g transform="translate(140 240)">
      <rect width="800" height="330" rx="20" fill="#FFFFFF" stroke="#E2DACB" strokeWidth="3" />
      {rows.map((r, i) => {
        const on = i === 2 ? sel : 0;
        return <g key={r} transform={`translate(0 ${20 + i * 100})`}>
          {i === 2 && <rect x="14" y="0" width="772" height="90" rx="14" fill={BLUE} opacity={.1 * on} />}
          <circle cx="60" cy="45" r="20" fill="none" stroke={on > .5 ? BLUE : '#BDB5A6'} strokeWidth="5" />
          <circle cx="60" cy="45" r={11 * on} fill={BLUE} />
          <text x="104" y="58" fontFamily={SANS} fontSize="40" fontWeight={on > .5 ? 900 : 700} fill={on > .5 ? BLUE : '#6E675B'}>{r}</text>
        </g>;
      })}
    </g>
    <g opacity={ease(ramp(frame, pictures - 6, 10))} transform="translate(140 640)">
      {[0, 1, 2].map(i => <Person key={i} x={30 + i * 56} y={50} s={.9} fill="#BDB5A6" />)}
      <text x="0" y="140" fontFamily={SANS} fontSize="34" fontWeight="800" fill="#8E8678">Just like pictures</text>
      <path d="M-10 128H290" stroke="#C0392B" strokeWidth="6" {...draw(ease(ramp(frame, pictures + 14, 8)))} />
    </g>
    <g opacity={ease(ramp(frame, contact - 6, 10))} transform="translate(580 640)">
      {[0, 1, 2].map(i => <g key={i}><Person x={30 + i * 56} y={50} s={.9} fill={BLUE} /><PhoneGlyph x={52 + i * 56} y={8} s={.8} fill="#1F9D55" /></g>)}
      <text x="0" y="140" fontFamily={SANS} fontSize="34" fontWeight="900" fill={BLUE}>Likely to contact you</text>
    </g>
  </Svg>;
};

/* 7 · Step 2: a lead form or landing page where they enter name, phone, project type. */
export const StepLeadForm: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [form, website, , name, phone, project] = cues(p, [26, 59, 115, 232, 250, 292]);
  const fields = [['Name', name], ['Phone number', phone], ['Project type', project]] as const;
  const card = ease(ramp(frame, form - 6, 14));
  return <Svg bg="#F6F1E7">
    <Rail step={2} frame={frame} />
    <Title text="Give them somewhere to go" frame={frame} at={form} />
    <g opacity={card} transform={`translate(220 ${240 + (1 - card) * 30})`}>
      <rect width="640" height="600" rx="24" fill="#FFFFFF" stroke="#E2DACB" strokeWidth="3" />
      <rect x="30" y="26" width="200" height="56" rx="28" fill={BLUE} />
      <text x="130" y="64" textAnchor="middle" fontFamily={SANS} fontSize="26" fontWeight="900" fill="#FFFFFF">Lead form</text>
      <g opacity={ease(ramp(frame, website - 4, 10))}>
        <rect x="246" y="26" width="230" height="56" rx="28" fill="none" stroke="#BDB5A6" strokeWidth="3" />
        <text x="361" y="64" textAnchor="middle" fontFamily={SANS} fontSize="26" fontWeight="800" fill="#6E675B">Landing page</text>
      </g>
      <text x="30" y="140" fontFamily={SANS} fontSize="38" fontWeight="900" fill="#1B1B1B">Get a free quote</text>
      {fields.map(([label, at], i) => {
        const k = ease(ramp(frame, at - 4, 12));
        return <g key={label} transform={`translate(30 ${180 + i * 110})`}>
          <text y="0" fontFamily={SANS} fontSize="24" fontWeight="800" letterSpacing="1" fill="#8E8678">{label.toUpperCase()}</text>
          <rect y="14" width="580" height="64" rx="12" fill="#FAF8F3" stroke={k > .5 ? BLUE : '#E2DACB'} strokeWidth="3" />
          <rect x="20" y="38" width={(i === 1 ? 260 : i === 2 ? 320 : 200) * k} height="16" rx="8" fill="#1B1B1B" />
          {k > .9 && <path d="M540 46l10 10l18-20" stroke="#1F9D55" strokeWidth="6" fill="none" strokeLinecap="round" />}
        </g>;
      })}
      <rect x="30" y="510" width="580" height="66" rx="16" fill={BLUE} opacity={.4 + .6 * ease(ramp(frame, project + 10, 10))} />
      <text x="320" y="554" textAnchor="middle" fontFamily={SANS} fontSize="32" fontWeight="900" fill="#FFFFFF">Submit</text>
    </g>
  </Svg>;
};

/* 8 · Step 3: target your service area; don't pay for people outside it. */
export const StepArea: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [third, target, area, outside, never] = cues(p, [4, 44, 64, 159, 232]);
  const ring = ease(ramp(frame, area - 6, 16));
  const out = ease(ramp(frame, outside - 4, 12));
  const cx = 540, cy = 560, R = 230;
  const pins = [[470, 480], [620, 520], [560, 650], [430, 600], [660, 640], [520, 430], [150, 330], [950, 360], [180, 820], [930, 800], [880, 560], [140, 560]];
  return <Svg bg="#E6EEE3">
    <rect y="230" width="1080" height="730" fill="#DCE8D7" />
    {[300, 420, 540, 660, 780].map(y => <path key={y} d={`M0 ${y}H1080`} stroke="#FFFFFF" strokeWidth={y === 540 ? 14 : 6} opacity=".9" />)}
    {[180, 360, 540, 720, 900].map(x => <path key={x} d={`M${x} 230V960`} stroke="#FFFFFF" strokeWidth={x === 540 ? 14 : 6} opacity=".9" />)}
    <path d="M0 860Q300 780 520 880T1080 820" stroke="#A8CBE0" strokeWidth="26" fill="none" />
    <rect width="1080" height="230" fill="#F6F1E7" />
    <Rail step={3} frame={frame} />
    <Title text="Target your service area" frame={frame} at={third + 10} />
    <circle cx={cx} cy={cy} r={R * ring} fill={BLUE} opacity=".12" />
    <circle cx={cx} cy={cy} r={R * ring} fill="none" stroke={BLUE} strokeWidth="6" strokeDasharray="16 10" />
    {pins.map(([x, y], i) => {
      const inside = Math.hypot(x - cx, y - cy) < R;
      const k = ease(ramp(frame, target - 6 + i * 2, 8));
      const dim = inside ? 0 : out;
      return <g key={i} opacity={k * (1 - .6 * dim)} transform={`translate(${x} ${y})`}>
        <path d="M0 0C-16-20-20-28-20-36A20 20 0 0 1 20-36C20-28 16-20 0 0Z" fill={inside ? BLUE : dim > .5 ? '#9AA29A' : '#E5484D'} />
        <circle cy="-36" r="7" fill="#FFFFFF" />
        {!inside && dim > .5 && <path d="M-14-50L14-22M14-50L-14-22" stroke="#C0392B" strokeWidth="5" strokeLinecap="round" />}
      </g>;
    })}
    <g transform={`translate(${cx} ${cy})`} opacity={ramp(frame, target - 6, 10)}>
      <rect x="-24" y="-24" width="48" height="48" rx="10" fill="#1B1B1B" />
      <path d="M-14 6L0-8L14 6V16H-14Z" fill="#FFFFFF" />
    </g>
    <g opacity={ease(ramp(frame, never - 4, 10))} transform="translate(740 290)">
      <rect width="290" height="64" rx="32" fill="#FFFFFF" stroke="#C0392B" strokeWidth="3" />
      <text x="145" y="43" textAnchor="middle" fontFamily={SANS} fontSize="28" fontWeight="900" fill="#C0392B">Outside your area</text>
    </g>
  </Svg>;
};

/* 9 · Step 4: track results. Leads? Cost per lead? Which became paying customers? */
export const StepTrack: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [fourth, track, leads, cost, customers] = cues(p, [2, 31, 85, 173, 260]);
  const tiles = [['Leads', '?', leads], ['Cost per lead', '$?', cost], ['Paying customers', '?', customers]] as const;
  return <Svg bg="#0F1420">
    <Rail step={4} frame={frame} dark />
    <Title text="Track your results" frame={frame} at={Math.max(fourth, track - 20)} dark />
    {tiles.map(([label, val, at], i) => {
      const k = back(ease(ramp(frame, at - 6, 12)));
      return <g key={label} transform={`translate(${80 + i * 315} 260)`} opacity={clamp(k)}>
        <rect width="290" height="420" rx="24" fill="#161D2C" stroke="#2A3448" strokeWidth="3" />
        <text x="145" y="230" textAnchor="middle" fontFamily={SANS} fontSize="150" fontWeight="900" fill="#FFD400" transform={`translate(145 170) scale(${k}) translate(-145 -170)`}>{val}</text>
        <path d="M40 300H250" stroke="#2A3448" strokeWidth="3" />
        {label.split(' ').length > 1
          ? <text x="145" y="350" textAnchor="middle" fontFamily={SANS} fontSize="32" fontWeight="800" fill="#FFFFFF">{label.split(' ').slice(0, -1).join(' ')}<tspan x="145" dy="40">{label.split(' ').slice(-1)}</tspan></text>
          : <text x="145" y="362" textAnchor="middle" fontFamily={SANS} fontSize="34" fontWeight="800" fill="#FFFFFF">{label}</text>}
      </g>;
    })}
    <text x="540" y="780" textAnchor="middle" fontFamily={SERIF} fontSize="40" fontStyle="italic" fill="#9AA6BD" opacity={ease(ramp(frame, customers + 20, 12))}>Do you actually know these?</text>
  </Svg>;
};

/* 10 · Step 5: the system responds right away and follows up automatically, within 5 minutes. */
export const StepFollowUp: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [fifth, lead, responds, follows, five] = cues(p, [4, 111, 155, 197, 409]);
  const nodes = [['Lead comes in', lead, '#1B1B1B'], ['Instant reply', responds, BLUE], ['Follow-up', follows, BLUE], ['Follow-up', follows + 20, BLUE]] as const;
  const title = frame < responds - 6 ? 'Where most drop the ball' : 'Respond automatically';
  const bubbles = [[lead, false, 220], [responds, true, 260], [follows, true, 200], [follows + 20, true, 240]] as const;
  return <Svg bg="#EAF4EF">
    <Rail step={5} frame={frame} />
    <Title text={title} frame={frame} at={fifth} />
    <g transform="translate(100 240)">
      <rect width="360" height="610" rx="44" fill="#111" />
      <rect x="16" y="16" width="328" height="578" rx="32" fill="#FFFFFF" />
      {bubbles.map(([at, out, w], i) => {
        const k = ease(ramp(frame, at - 4, 10));
        return <g key={i} opacity={k} transform={`translate(${out ? 324 - w : 36} ${60 + i * 120 + (1 - k) * 16})`}>
          <rect width={w} height="84" rx="24" fill={out ? BLUE : '#E9ECEF'} />
          <rect x="22" y="26" width={w - 60} height="12" rx="6" fill={out ? '#FFFFFF' : '#9AA2AA'} opacity=".8" />
          <rect x="22" y="48" width={w - 100} height="12" rx="6" fill={out ? '#FFFFFF' : '#9AA2AA'} opacity=".6" />
        </g>;
      })}
    </g>
    <path d="M560 300V660" stroke="#C9DCD2" strokeWidth="6" />
    <path d="M560 300V660" stroke={BLUE} strokeWidth="6" {...draw(ease(ramp(frame, lead, follows + 30 - lead)))} />
    {nodes.map(([label, at, color], i) => {
      const k = back(ease(ramp(frame, at - 4, 10)));
      return <g key={i} transform={`translate(560 ${300 + i * 120})`} opacity={clamp(k)}>
        <circle r={22 * k} fill={color} />
        <text x="50" y="12" fontFamily={SANS} fontSize="38" fontWeight="850" fill="#1B1B1B">{label}</text>
        {i > 0 && <text x="50" y="50" fontFamily={SANS} fontSize="26" fontWeight="700" fill="#5B6B63">{i === 1 ? 'right away' : 'automatically'}</text>}
      </g>;
    })}
    <g opacity={ease(ramp(frame, five - 6, 10))} transform={`translate(780 800) scale(${back(ease(ramp(frame, five - 6, 12)))})`}>
      <rect x="-210" y="-46" width="420" height="92" rx="46" fill="#1F9D55" />
      <text y="16" textAnchor="middle" fontFamily={SANS} fontSize="42" fontWeight="900" fill="#FFFFFF">within 5 minutes</text>
    </g>
  </Svg>;
};

/* 11 · Same budget, same photos: one gets likes, the other brings leads, follow-up, jobs. */
export const SameBudget: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [budget, photos, likes, other, leads, follow, jobs] = cues(p, [40, 70, 133, 158, 194, 210, 289]);
  const thumb = (x: number, k: number, label: string, color: string) => <g opacity={k} transform={`translate(${x} 200)`}>
    <g transform="scale(.42)"><PostCard w={800} h={420} /></g>
    <text x="168" y="236" textAnchor="middle" fontFamily={SANS} fontSize="30" fontWeight="900" fill={color}>{label}</text>
  </g>;
  const box = (x: number, y: number, label: string, k: number, fill: string, ink: string) => <g opacity={k} transform={`translate(${x} ${y + (1 - k) * 20})`}>
    <path d={`M168 ${-34}V-4`} stroke="#3A4C6E" strokeWidth="4" />
    <rect width="336" height="76" rx="38" fill={fill} />
    <text x="168" y="50" textAnchor="middle" fontFamily={SANS} fontSize="34" fontWeight="900" fill={ink}>{label}</text>
  </g>;
  return <Svg bg="#0E1B33">
    <text x="80" y="110" fontFamily={SANS} fontSize="50" fontWeight="900" letterSpacing="-1.5" fill="#FFFFFF" opacity={ease(ramp(frame, budget - 6, 10))}>Same budget. <tspan opacity={ease(ramp(frame, photos - 6, 10))}>Same photos.</tspan></text>
    {thumb(100, ease(ramp(frame, photos - 4, 12)), 'Boost', '#9AA6BD')}
    {thumb(640, ease(ramp(frame, photos + 2, 12)), 'Campaign + system', '#FFD400')}
    {box(100, 500, '♥ Likes', ease(ramp(frame, likes - 4, 10)), '#22314F', '#FFFFFF')}
    {box(640, 500, 'Leads', ease(ramp(frame, leads - 4, 10)), '#FFD400', '#0E1B33')}
    {box(640, 620, 'Follow-up', ease(ramp(frame, follow - 4, 10)), '#FFD400', '#0E1B33')}
    {box(640, 740, 'Jobs ✓', ease(ramp(frame, jobs - 4, 10)), '#3DDC97', '#0E1B33')}
    <text x="268" y="640" textAnchor="middle" fontFamily={SERIF} fontSize="34" fontStyle="italic" fill="#9AA6BD" opacity={ease(ramp(frame, other - 4, 10))}>…and that's it</text>
  </Svg>;
};

/* 12 · The difference isn't just the ad; it's the system behind it. */
const gearPath = (r: number, teeth: number) => {
  const pts: string[] = [];
  for (let i = 0; i < teeth * 2; i++) { const a = i * Math.PI / teeth; const rr = i % 2 ? r : r * 1.18; pts.push(`${Math.cos(a) * rr},${Math.sin(a) * rr}`); }
  return `M${pts.join('L')}Z`;
};
export const SystemBehind: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [difference, ad, system] = cues(p, [16, 56, 79]);
  const slide = ease(ramp(frame, system - 8, 18));
  const parts = [['Targeting', 230, 380], ['Lead form', 850, 380], ['Tracking', 230, 720], ['Follow-up', 850, 720]] as const;
  return <Svg bg="#121212">
    <text x="80" y="110" fontFamily={SANS} fontSize="54" fontWeight="900" letterSpacing="-1.5" fill="#FFFFFF" opacity={ease(ramp(frame, difference - 6, 10)) * (1 - slide)}>It's not just the ad…</text>
    <text x="80" y="110" fontFamily={SANS} fontSize="54" fontWeight="900" letterSpacing="-1.5" fill="#FFD400" opacity={slide}>It's the system behind it.</text>
    <g opacity={slide}>
      {[[540, 550, 120, 12, 1], [400, 470, 70, 9, -1.6], [690, 680, 80, 10, -1.4]].map(([x, y, r, t, dir], i) =>
        <g key={i} transform={`translate(${x} ${y}) rotate(${frame * 1.5 * dir})`}>
          <path d={gearPath(r, t)} fill={i ? '#2A2A2A' : '#3A3A3A'} stroke="#FFD400" strokeWidth="4" />
          <circle r={r * .35} fill="#121212" stroke="#FFD400" strokeWidth="4" />
        </g>)}
      {parts.map(([label, x, y], i) => <g key={label} opacity={ease(ramp(frame, system + i * 5, 10))} transform={`translate(${x} ${y})`}>
        <rect x="-130" y="-36" width="260" height="72" rx="36" fill="#FFD400" />
        <text y="12" textAnchor="middle" fontFamily={SANS} fontSize="32" fontWeight="900" fill="#121212">{label}</text>
      </g>)}
    </g>
    <g transform={`translate(${340 - slide * 520} ${230 + slide * 120}) scale(${.5 - .2 * slide}) rotate(${-8 * slide})`} opacity={ease(ramp(frame, ad - 30, 12)) * (1 - slide)}>
      <PostCard w={800} h={1000} />
      <rect x="20" y="900" width="760" height="70" rx="12" fill={BLUE} />
      <text x="400" y="948" textAnchor="middle" fontFamily={SANS} fontSize="36" fontWeight="900" fill="#FFFFFF">Learn more</text>
    </g>
  </Svg>;
};
