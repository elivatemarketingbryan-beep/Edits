import React from 'react';
import {clamp} from '../../motion';
import type {VisualProps} from '../../types';

// Scenes for "ask for the review at the peak" (job video7). The excitement
// curve is qualitative. Cues are local beat frames from word timings.
const ramp = (frame: number, start: number, length = 14) => clamp((frame - start) / length);
const ease = (v: number) => 1 - Math.pow(1 - v, 3);
const back = (v: number) => { const c = 1.7; return 1 + (c + 1) * Math.pow(v - 1, 3) + c * Math.pow(v - 1, 2); };
const cues = (p: VisualProps, fallback: number[]) => {
  const data = p.beat.visual.type === 'custom' ? p.beat.visual.props?.cues : undefined;
  return Array.isArray(data) && data.every(n => typeof n === 'number') ? data as number[] : fallback;
};
const prop = (p: VisualProps, key: string) => p.beat.visual.type === 'custom' ? p.beat.visual.props?.[key] : undefined;
const SANS = 'Inter, Arial, sans-serif';
const SERIF = 'Georgia, "Times New Roman", serif';
const Svg: React.FC<{bg: string; children: React.ReactNode}> = ({bg, children}) =>
  <svg viewBox="0 0 1080 960" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
    <rect width="1080" height="960" fill={bg} />{children}
  </svg>;
const Star: React.FC<{x: number; y: number; r: number; fill: string; stroke?: string}> = ({x, y, r, fill, stroke = 'none'}) => {
  const pts = Array.from({length: 10}, (_, i) => { const a = -Math.PI / 2 + i * Math.PI / 5; const rr = i % 2 ? r * .45 : r; return `${x + Math.cos(a) * rr},${y + Math.sin(a) * rr}`; }).join(' ');
  return <polygon points={pts} fill={fill} stroke={stroke} strokeWidth="4" strokeLinejoin="round" />;
};

/* 2 · Weeks later, the review ask is buried in a follow-up email nobody reads. */
export const BuriedEmail: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [weeks, , buried, email, nobody] = cues(p, [19, 70, 100, 126, 146]);
  const P = clamp((frame - buried + 6) / 40) * 5;
  const mails = ['Supplier invoice', 'Permit update', 'Promo: 20% off', 'Crew schedule', 'Bank alert'];
  const rowH = 96, top = 250;
  return <Svg bg="#EEF1F5">
    <g opacity={ease(ramp(frame, weeks - 6, 10))} transform="translate(80 70)">
      <rect width="170" height="150" rx="16" fill="#FFFFFF" stroke="#C9D2DE" strokeWidth="4" />
      <rect width="170" height="44" rx="16" fill="#E5484D" /><rect y="28" width="170" height="16" fill="#E5484D" />
      <text x="85" y="118" textAnchor="middle" fontFamily={SANS} fontSize="58" fontWeight="900" fill="#14202B">+3</text>
      <text x="85" y="34" textAnchor="middle" fontFamily={SANS} fontSize="24" fontWeight="900" letterSpacing="2" fill="#FFFFFF">WEEKS</text>
    </g>
    <text x="290" y="135" fontFamily={SANS} fontSize="50" fontWeight="900" letterSpacing="-1.5" fill="#14202B" opacity={ramp(frame, 0, 10)}>Weeks after the job…</text>
    <text x="290" y="195" fontFamily={SERIF} fontSize="36" fontStyle="italic" fill="#5B6575" opacity={ease(ramp(frame, email - 4, 10))}>a follow-up email nobody reads</text>
    <rect x="80" y={top - 14} width="920" height={rowH * 6 + 18} rx="22" fill="#FFFFFF" stroke="#D5DBE4" strokeWidth="3" />
    <clipPath id="be-clip"><rect x="80" y={top - 14} width="920" height={rowH * 6 + 18} rx="22" /></clipPath>
    <g clipPath="url(#be-clip)">
      {mails.map((m, i) => {
        const k = ease(clamp(P - i));
        const y = top + Math.max(0, P - 1 - i) * rowH;
        return <g key={m} opacity={k} transform={`translate(110 ${y - (1 - k) * 40})`}>
          <circle cx="30" cy="40" r="26" fill="#C9D2DE" />
          <text x="80" y="38" fontFamily={SANS} fontSize="30" fontWeight="800" fill="#14202B">{m}</text>
          <rect x="80" y="54" width="380" height="12" rx="6" fill="#E1E6EE" />
          <path d={`M0 ${rowH - 4}H860`} stroke="#EEF1F5" strokeWidth="3" />
        </g>;
      })}
      <g transform={`translate(110 ${top + P * rowH})`} opacity={ease(ramp(frame, 0, 10)) * (1 - .45 * ease(ramp(frame, nobody - 4, 14)))}>
        <circle cx="-14" cy="40" r="8" fill="#2F6FED" />
        <circle cx="30" cy="40" r="26" fill="#F4B400" />
        <text x="30" y="50" textAnchor="middle" fontFamily={SANS} fontSize="26" fontWeight="900" fill="#FFFFFF">★</text>
        <text x="80" y="38" fontFamily={SANS} fontSize="30" fontWeight="900" fill="#14202B">Would you leave us a review?</text>
        <rect x="80" y="54" width="300" height="12" rx="6" fill="#E1E6EE" />
      </g>
    </g>
    <g opacity={ease(ramp(frame, nobody - 2, 10))} transform="translate(800 820)">
      <rect x="-150" y="-36" width="300" height="64" rx="32" fill="#14202B" />
      <text y="8" textAnchor="middle" fontFamily={SANS} fontSize="30" fontWeight="900" fill="#FFFFFF">UNOPENED</text>
    </g>
  </Svg>;
};

/* 3 · Standing in the finished space, imagining friends coming over. */
export const FinishedSpace: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [, , finishes, standing, imagining, friends, thrilled] = cues(p, [3, 73, 117, 201, 231, 259, 329]);
  const piece = (i: number) => ease(ramp(frame, finishes - 30 + i * 6, 12));
  const person = ease(ramp(frame, standing - 6, 12));
  const bubble = back(ease(ramp(frame, imagining - 4, 14)));
  const joy = ease(ramp(frame, thrilled - 4, 12));
  return <Svg bg="#F3E7D3">
    <text x="80" y="120" fontFamily={SERIF} fontSize="54" fill="#3A2A1C" opacity={ramp(frame, 0, 10)}>The day the job is done</text>
    <path d="M0 640H1080V960H0Z" fill="#C89B6D" opacity={piece(0)} />
    {Array.from({length: 6}, (_, i) => <path key={i} d={`M${i * 190} 640L${i * 190 - 80} 960`} stroke="#B5875A" strokeWidth="4" opacity={piece(0)} />)}
    <g opacity={piece(1)} transform={`translate(0 ${(1 - piece(1)) * 30})`}>
      <rect x="620" y="230" width="300" height="220" rx="8" fill="#DCEBF5" stroke="#FFFFFF" strokeWidth="14" />
      <path d="M770 230V450M620 340H920" stroke="#FFFFFF" strokeWidth="10" />
    </g>
    <g opacity={piece(2)} transform={`translate(0 ${(1 - piece(2)) * 30})`}>
      <rect x="560" y="560" width="420" height="140" rx="10" fill="#FFFFFF" stroke="#3A2A1C" strokeWidth="5" />
      <rect x="540" y="540" width="460" height="30" rx="8" fill="#3A2A1C" />
      {[620, 760, 900].map(x => <rect key={x} x={x - 30} y="600" width="60" height="8" rx="4" fill="#C89B6D" />)}
    </g>
    <g opacity={piece(3)}>
      {[680, 860].map(x => <g key={x}><path d={`M${x} 160V250`} stroke="#3A2A1C" strokeWidth="4" /><path d={`M${x - 40} 290Q${x} 230 ${x + 40} 290Z`} fill="#E3A93B" />
        <circle cx={x} cy="300" r="40" fill="#FFE3A3" opacity={.35 + .25 * Math.sin(frame / 9)} /></g>)}
    </g>
    <g opacity={person} transform={`translate(330 ${640 + (1 - person) * 30})`}>
      <circle cy="-250" r="44" fill="#3A2A1C" />
      <path d="M-70 -10Q-70 -190 0 -190Q70 -190 70 -10Z" fill="#7A4E2D" />
      <rect x="-50" y="-20" width="40" height="150" rx="16" fill="#3A2A1C" /><rect x="10" y="-20" width="40" height="150" rx="16" fill="#3A2A1C" />
    </g>
    <g transform={`translate(240 330) scale(${bubble})`} opacity={clamp(bubble)}>
      {[[-20, 110, 12], [-40, 70, 18]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill="#FFFFFF" />)}
      <ellipse cx="-30" cy="-50" rx="190" ry="105" fill="#FFFFFF" />
      {[-130, -30, 70].map((x, i) => {
        const k = ease(ramp(frame, friends - 4 + i * 6, 10));
        return <g key={x} transform={`translate(${x} -40) scale(${k})`} opacity={k}>
          <circle cy="-24" r="22" fill={['#E5484D', '#2F6FED', '#1F9D55'][i]} />
          <path d="M-34 34Q-34 0 0 0Q34 0 34 34Z" fill={['#E5484D', '#2F6FED', '#1F9D55'][i]} />
        </g>;
      })}
    </g>
    {Array.from({length: 6}, (_, i) => {
      const a = i * Math.PI / 3 + frame / 30;
      const x = 330 + Math.cos(a) * 150, y = 470 + Math.sin(a) * 120;
      return <g key={i} opacity={joy * (.6 + .4 * Math.sin(frame / 5 + i))}><Star x={x} y={y} r={16} fill="#F4B400" /></g>;
    })}
    <text x="80" y="200" fontFamily={SANS} fontSize="40" fontWeight="900" fill="#C0392B" opacity={joy}>Genuinely thrilled.</text>
  </Svg>;
};

/* 4 & 5 · The excitement curve: it peaks at the finished product (the window),
   then fades. In "late" mode the ask lands 3 weeks later, outside the window. */
const E = (t: number) => t < .3 ? .25 + .75 * Math.sin(t / .3 * Math.PI / 2) : .12 + .88 * Math.exp(-(t - .3) * 5);
const CX = (t: number) => 120 + 840 * t;
const CY = (t: number) => 780 - 500 * E(t);
const curvePath = (t1: number, t0 = 0) => {
  const n = Math.max(2, Math.ceil((t1 - t0) * 120));
  return Array.from({length: n + 1}, (_, i) => { const t = t0 + (t1 - t0) * i / n; return `${i ? 'L' : 'M'}${CX(t).toFixed(1)} ${CY(t).toFixed(1)}`; }).join('');
};
export const ExcitementCurve: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const late = prop(p, 'mode') === 'late';
  const c = cues(p, late ? [17, 57, 102, 168, 205, 232, 264] : [36, 87, 123, 172, 282, 336, 368, 415]);
  const peakX = CX(.3), peakY = CY(.3);
  // Peak mode timings
  const rise = late ? 1 : ease(ramp(frame, c[0] - 6, c[2] - c[0] + 6));
  const fall = late ? 1 : ease(ramp(frame, c[2] + 6, 40));
  const drawn = rise < 1 ? .3 * rise : .3 + .7 * fall;
  const band = late ? 1 : ease(ramp(frame, c[3] - 4, 14));
  const stars = late ? 0 : ease(ramp(frame, c[4] - 6, 12));
  // Late mode timings
  const cursor = late ? ease(ramp(frame, c[0] - 8, 26)) : 0;
  const tCur = .3 + .5 * cursor;
  const mail = late ? back(ease(ramp(frame, c[1] - 6, 12))) : 0;
  const missed = late ? ease(ramp(frame, c[2] - 4, 10)) : 0;
  const fades = late ? ease(ramp(frame, c[4] - 6, 20)) : 0;
  const card = late ? ease(ramp(frame, c[5] - 6, 12)) * (1 - ease(ramp(frame, c[6] + 20, 30))) : 0;
  const chips = [['Happy', 5], ['Trusts you', 6], ['Work is fresh', 7]] as const;
  return <Svg bg="#0E1B33">
    <text x="80" y="100" fontFamily={SANS} fontSize="50" fontWeight="900" letterSpacing="-1.5" fill="#FFFFFF" opacity={ramp(frame, 0, 10)}>{late ? 'Wait 3 weeks to ask…' : 'Homeowner excitement'}</text>
    <path d="M120 200V780H980" stroke="#2C3E60" strokeWidth="5" fill="none" />
    <text x="130" y="830" fontFamily={SANS} fontSize="26" fontWeight="800" letterSpacing="2" fill="#7F93B8">JOB DONE</text>
    <text x="975" y="830" textAnchor="end" fontFamily={SANS} fontSize="26" fontWeight="800" letterSpacing="2" fill="#7F93B8">TIME →</text>
    <g opacity={band * (late ? .55 : 1)}>
      <rect x={CX(.21)} y="190" width={CX(.42) - CX(.21)} height="590" fill="#F4B400" opacity=".14" />
      <path d={`M${CX(.21)} 190V730M${CX(.42)} 190V730`} stroke="#F4B400" strokeWidth="3" strokeDasharray="10 8" />
      <text x={peakX + 10} y="765" textAnchor="middle" fontFamily={SANS} fontSize="30" fontWeight="900" letterSpacing="3" fill="#F4B400">THE WINDOW</text>
    </g>
    <path d={curvePath(Math.min(drawn, .3))} stroke="#FFD86B" strokeWidth="10" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    {drawn > .3 && <path d={curvePath(drawn, .3)} stroke={fades > .5 ? '#5C6E90' : '#FFD86B'} strokeWidth="10" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={1 - .4 * fades} />}
    <g opacity={late ? 1 : ease(ramp(frame, c[1] - 4, 10))}>
      <circle cx={peakX} cy={peakY} r={18 + (late ? 0 : 6 * Math.sin(frame / 6))} fill="#FFD86B" />
      <circle cx={peakX} cy={peakY} r="36" fill="none" stroke="#FFD86B" strokeWidth="3" opacity=".5" />
    </g>
    <text x={peakX + 40} y={peakY + 8} fontFamily={SANS} fontSize="28" fontWeight="800" fill="#FFFFFF" opacity={late ? 0 : ease(ramp(frame, c[2] - 4, 10))}>sees the finished work</text>
    <g opacity={stars}>{Array.from({length: 5}, (_, i) => <Star key={i} x={peakX - 100 + i * 50} y={peakY - 62} r={22 * back(clamp((frame - c[4] + 6 - i * 3) / 8))} fill="#F4B400" />)}</g>
    {!late && chips.map(([label, ci], i) => {
      const k = ease(ramp(frame, c[ci] - 4, 10));
      return <g key={label} opacity={k} transform={`translate(${600 + (1 - k) * 30} ${300 + i * 90})`}>
        <rect width={label.length * 21 + 70} height="66" rx="33" fill="#1C2D4F" stroke="#F4B400" strokeWidth="3" />
        <text x="30" y="44" fontFamily={SANS} fontSize="32" fontWeight="800" fill="#FFFFFF">✓ {label}</text>
      </g>;
    })}
    {late && <g>
      <path d={`M${CX(tCur)} 200V780`} stroke="#FFFFFF" strokeWidth="3" strokeDasharray="8 8" opacity={ramp(frame, c[0] - 10, 8)} />
      <text x={CX(tCur)} y="765" textAnchor="middle" fontFamily={SANS} fontSize="30" fontWeight="900" fill="#FFFFFF" opacity={ramp(frame, c[0] - 10, 8)}>{cursor > .9 ? '3 weeks later' : ''}</text>
      <g transform={`translate(${CX(.8)} ${CY(.8) - 60}) scale(${mail})`} opacity={clamp(mail)}>
        <rect x="-50" y="-34" width="100" height="68" rx="8" fill="#FFFFFF" />
        <path d="M-50-34L0 6L50-34" stroke="#0E1B33" strokeWidth="5" fill="none" />
      </g>
      <g opacity={missed} transform={`translate(${CX(.8)} ${CY(.8) - 60})`}>
        <path d="M-60-60L60 60M60-60L-60 60" stroke="#FF5A4E" strokeWidth="12" strokeLinecap="round" />
        <text y="-80" textAnchor="middle" fontFamily={SANS} fontSize="34" fontWeight="900" fill="#FF8A80">window missed</text>
      </g>
      <g opacity={card} transform="translate(540 290)">
        <rect width="400" height="150" rx="18" fill="#1C2D4F" stroke="#5C6E90" strokeWidth="3" />
        {Array.from({length: 5}, (_, i) => <Star key={i} x={60 + i * 70} y={60} r={24} fill="none" stroke="#5C6E90" />)}
        <rect x="30" y="104" width="250" height="14" rx="7" fill="#2C3E60" />
        <text x="200" y="-20" textAnchor="middle" fontFamily={SANS} fontSize="30" fontWeight="900" fill="#8FA3C8">review never written</text>
      </g>
    </g>}
  </Svg>;
};

/* 7 · Ask at the one moment where saying yes takes 10 seconds, not a chore. */
export const TenSeconds: React.FC<VisualProps> = (p) => {
  const {frame} = p;
  const [ask, moment, yes, ten, chore] = cues(p, [23, 49, 84, 128, 188]);
  const phone = ease(ramp(frame, ask - 8, 12));
  const ring = ease(ramp(frame, ten - 6, 24));
  const done = ease(ramp(frame, yes + 24, 10));
  return <Svg bg="#0F2A1F">
    <text x="80" y="110" fontFamily={SANS} fontSize="52" fontWeight="900" letterSpacing="-1.5" fill="#FFFFFF" opacity={ease(ramp(frame, moment - 4, 10))}>Ask at the peak</text>
    <g opacity={phone} transform={`translate(110 ${170 + (1 - phone) * 40})`}>
      <rect width="400" height="680" rx="54" fill="#000" stroke="#2E5A45" strokeWidth="6" />
      <rect x="20" y="20" width="360" height="640" rx="38" fill="#F6FBF8" />
      <text x="200" y="170" textAnchor="middle" fontFamily={SANS} fontSize="36" fontWeight="900" fill="#0F2A1F">How did we do?</text>
      {Array.from({length: 5}, (_, i) => {
        const k = ease(ramp(frame, yes - 4 + i * 4, 6));
        return <g key={i} transform={`translate(${64 + i * 68} 270) scale(${1 + .25 * k * (1 - k) * 4})`}><Star x={0} y={0} r={28} fill={k > .5 ? '#F4B400' : '#E3EAE6'} /></g>;
      })}
      <rect x="50" y="350" width="300" height="16" rx="8" fill="#E3EAE6" /><rect x="50" y="384" width="220" height="16" rx="8" fill="#E3EAE6" />
      <rect x="60" y="480" width="280" height="80" rx="40" fill={done > .5 ? '#1F9D55' : '#0F2A1F'} />
      <text x="200" y="532" textAnchor="middle" fontFamily={SANS} fontSize="32" fontWeight="900" fill="#FFFFFF">{done > .5 ? 'Posted ✓' : 'Submit'}</text>
    </g>
    <g opacity={ease(ramp(frame, ten - 8, 10))} transform="translate(790 420)">
      <circle r="130" fill="none" stroke="#1E4434" strokeWidth="26" />
      <circle r="130" fill="none" stroke="#F4B400" strokeWidth="26" strokeDasharray={`${2 * Math.PI * 130 * ring} 1000`} transform="rotate(-90)" strokeLinecap="round" />
      <text y="10" textAnchor="middle" fontFamily={SANS} fontSize="84" fontWeight="900" fill="#FFFFFF">10</text>
      <text y="60" textAnchor="middle" fontFamily={SANS} fontSize="30" fontWeight="800" letterSpacing="3" fill="#9CC9B4">SECONDS</text>
    </g>
    <g opacity={ease(ramp(frame, chore - 6, 10))} transform="translate(790 700)">
      <rect x="-150" y="-42" width="300" height="84" rx="42" fill="none" stroke="#9CC9B4" strokeWidth="4" />
      <text y="14" textAnchor="middle" fontFamily={SANS} fontSize="40" fontWeight="850" fill="#9CC9B4">a chore</text>
      <path d="M-160 4H160" stroke="#FF5A4E" strokeWidth="9" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - ease(ramp(frame, chore + 4, 8))} />
    </g>
  </Svg>;
};
