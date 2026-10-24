import React from 'react';
import {arrive, clamp} from '../../motion';
import type {VisualProps} from '../../types';

const palette = {background: '#FFFFFF', surface: '#FFFFFF', text: '#111111', accent: '#FFE600', muted: '#686868'};
const progress = (frame: number, start: number, duration: number) => clamp((frame - start) / duration);
const visible = (frame: number, start: number) => progress(frame, start, 10);
const uid = (beat: VisualProps['beat'], name: string) => `miro-${name}-${beat.id.replace(/[^a-zA-Z0-9_-]/g, '')}`;

const Definitions: React.FC<{id: string; color: string}> = ({id, color}) => <defs>
  <filter id={`${id}-shadow`} x="-25%" y="-25%" width="155%" height="160%"><feDropShadow dx="0" dy="11" stdDeviation="12" floodColor={color} floodOpacity=".10"/></filter>
  <marker id={`${id}-arrow`} markerWidth="9" markerHeight="9" refX="7.5" refY="4.5" orient="auto"><path d="M1 1L7 4.5L1 8" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></marker>
</defs>;

/** Four distinct source artifacts become the starting material for a simulation. */
export const MiroInputs: React.FC<VisualProps> = ({beat, frame, fps}) => {
  const b = palette;
  const id = uid(beat, 'inputs');
  const merge = progress(frame, 32, 30);
  const seed = clamp(arrive(frame, fps, 48));
  const cards = [
    {x: 20, y: 104, angle: -7, label: 'Launch page'},
    {x: 227, y: 71, angle: -2, label: 'Ad'},
    {x: 434, y: 71, angle: 2, label: 'Product'},
    {x: 641, y: 104, angle: 7, label: 'Offer'},
  ];
  return <svg viewBox="0 0 900 600" role="img" aria-label="Illustrative launch page, ad, product and offer cards flow into a simulation seed" style={{width: '100%', height: '100%'}}>
    <Definitions id={id} color={b.text}/>
    <ellipse cx="450" cy="363" rx="359" ry="27" fill={b.text} opacity=".05"/>
    <g fill="none" stroke={b.text} strokeWidth="4" strokeLinecap="round" opacity=".8">
      {['M134 325C134 420 368 390 426 449', 'M342 294C342 370 419 392 441 445', 'M549 294C549 370 481 392 460 445', 'M756 325C756 420 530 390 474 449'].map((d, i) => <path key={d} d={d} pathLength="1" strokeDasharray="1" strokeDashoffset={1-clamp(merge*1.4-i*.1)}/>)}
    </g>
    {cards.map((card, i) => {
      const a = clamp(arrive(frame, fps, i * 10));
      return <g key={card.label} transform={`translate(${card.x} ${card.y + (1-a)*35}) rotate(${card.angle*a} 114 108) scale(.8)`} opacity={visible(frame, i*10)}>
        <rect width="285" height="276" rx="29" fill={b.surface} stroke={b.text} strokeOpacity=".2" strokeWidth="2" filter={`url(#${id}-shadow)`}/>
        <rect x="23" y="24" width="239" height="155" rx="20" fill={b.accent}/>
        {i === 0 && <g>
          <rect x="49" y="45" width="94" height="10" rx="5" fill={b.text}/>
          <rect x="49" y="76" width="137" height="19" rx="7" fill={b.text}/>
          <rect x="49" y="103" width="111" height="10" rx="5" fill={b.text} opacity=".35"/>
          <rect x="49" y="132" width="79" height="24" rx="12" fill={b.text}/>
          <path d="M199 88L225 105V135L199 151L173 135V105Z" fill={b.text}/>
          <path d="M173 105L199 121L225 105M199 121V151" stroke={b.accent} strokeWidth="2.5" fill="none"/>
        </g>}
        {i === 1 && <g transform="translate(140 97) rotate(-9)">
          <path d="M-62-22H-24L48-52V46L-24 19H-62Q-72 19-72 9V-12Q-72-22-62-22Z" fill={b.text}/>
          <path d="M-37 19L-22 63H1L-13 23" fill={b.text}/>
          <path d="M69-30L87-40M73-3H96M67 24L86 34" stroke={b.text} strokeWidth="7" strokeLinecap="round"/>
          <path d="M-25-21V18" stroke={b.accent} strokeWidth="4"/>
        </g>}
        {i === 2 && <g transform="translate(142 102)">
          <ellipse cx="0" cy="48" rx="65" ry="12" fill={b.text} opacity=".12"/>
          <path d="M0-56L58-24V38L0 68L-58 38V-24Z" fill={b.text}/>
          <path d="M-58-24L0 9L58-24M0 9V68" fill="none" stroke={b.accent} strokeWidth="3.5"/>
          <path d="M-28-40L30-8V14" fill="none" stroke={b.accent} strokeWidth="13"/>
        </g>}
        {i === 3 && <g transform="translate(140 102) rotate(-12)">
          <path d="M-68-38H29L69 0L29 42H-68Q-78 42-78 32V-28Q-78-38-68-38Z" fill={b.surface} stroke={b.text} strokeWidth="3"/>
          <circle cx="43" cy="1" r="7" fill={b.text}/>
          <path d="M45-1C67-50 110-36 105-14" fill="none" stroke={b.muted} strokeWidth="3"/>
          <path d="M-53 1L-38 15L-12-13" fill="none" stroke={b.text} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/>
        </g>}
        <text x="142" y="225" textAnchor="middle" fontSize="31" fontWeight="800" letterSpacing="-1" fill={b.text}>{card.label}</text>
        <path d="M100 249H184" stroke={b.muted} strokeWidth="4" strokeLinecap="round" opacity=".23"/>
      </g>;
    })}
    <g transform={`translate(450 462) scale(${seed})`}>
      <circle r="51" fill={b.accent}/>
      <circle r="36" fill={b.text}/>
      <g fill={b.accent}><circle cx="-11" cy="-8" r="5"/><circle cx="13" cy="-7" r="5"/><circle cx="0" cy="14" r="5"/></g>
      <path d="M-11-8H13L0 14Z" stroke={b.accent} strokeWidth="2" fill="none"/>
    </g>
    <g opacity={visible(frame, 54)}>
      <text x="450" y="552" textAnchor="middle" fontSize="30" fontWeight="800" fill={b.text}>Simulation seed</text>
    </g>
  </svg>;
};

/** Behavioral priorities distinguish synthetic personas without implying demographics. */
export const MiroPersonas: React.FC<VisualProps> = ({beat, frame, fps}) => {
  const b = palette;
  const id = uid(beat, 'personas');
  const test = beat.visual.type === 'custom' && beat.visual.props?.mode === 'test';
  const profiles = [
    {x: 25, behavior: 'Explore', priority: 'Possibilities', response: 'Interest'},
    {x: 324, behavior: 'Compare', priority: 'Value', response: 'Questions'},
    {x: 623, behavior: 'Verify', priority: 'Clarity', response: 'Needs clarity'},
  ];
  return <svg viewBox="0 0 900 600" role="img" aria-label={test ? 'An illustrative offer is sent to simulated profiles, producing different conceptual reactions' : 'Illustrative simulated profiles have different behavioral priorities: explore possibilities, compare value and verify clarity'} style={{width: '100%', height: '100%'}}>
    <Definitions id={id} color={b.text}/>
    <path d="M130 497Q449 561 770 497" stroke={b.text} strokeWidth="2" fill="none" opacity=".12"/>
    {test && <>
      <g opacity={visible(frame,0)} transform={`translate(0 ${(1-clamp(arrive(frame,fps,0)))*-15})`}>
        <rect x="344" y="15" width="212" height="80" rx="24" fill={b.accent}/>
        <path d="M374 43H394L409 55L394 68H374Z" fill={b.text}/>
        <circle cx="395" cy="55" r="3" fill={b.accent}/>
        <text x="464" y="67" textAnchor="middle" fontSize="31" fontWeight="800" fill={b.text}>Offer</text>
      </g>
      <g fill="none" stroke={b.text} strokeWidth="3" opacity=".7">
        {['M450 99C450 135 151 122 151 161','M450 99V162','M450 99C450 135 749 122 749 161'].map(d=><path key={d} d={d} pathLength="1" strokeDasharray="1" strokeDashoffset={1-progress(frame,7,20)}/>) }
      </g>
    </>}
    {profiles.map((profile, i) => {
      const a = clamp(arrive(frame, fps, i*(test?7:13)));
      const detail = visible(frame, 27+i*10);
      return <g key={profile.behavior} transform={`translate(${profile.x} ${(test?162:55)+(1-a)*42})`} opacity={visible(frame, i*(test?7:13))}>
        <rect width="252" height={test?326:426} rx="32" fill={b.surface} stroke={b.muted} strokeOpacity=".18" strokeWidth="2" filter={`url(#${id}-shadow)`}/>
        <path d="M0 110V32Q0 0 32 0H220Q252 0 252 32V110Z" fill={b.accent}/>
        <circle cx="126" cy="123" r="71" fill={b.background}/>
        <circle cx="126" cy="123" r="61" fill={b.accent}/>
        <circle cx="126" cy="103" r="24" fill={b.text}/>
        <path d="M78 158C80 122 171 120 174 158Q126 190 78 158Z" fill={b.text}/>
        <g transform="translate(191 165)">
          <circle r="29" fill={b.text}/>
          {i===0 && <g stroke={b.accent} strokeWidth="2.5" fill="none"><circle r="15"/><path d="M-6 6L-1-6L8-8L3 4Z" fill={b.accent}/></g>}
          {i===1 && <g stroke={b.accent} strokeWidth="3" fill="none" strokeLinecap="round"><path d="M-14-7H13M7-13L14-7L7-1M14 8H-13M-7 2L-14 8L-7 14"/></g>}
          {i===2 && <g stroke={b.accent} strokeWidth="2.5" fill="none"><path d="M0-16L13-11V0Q11 11 0 16Q-11 11-13 0V-11Z"/><path d="M-7-1L-1 5L8-6" strokeWidth="3"/></g>}
        </g>
        <text x="126" y="245" textAnchor="middle" fontSize="35" fontWeight="800" letterSpacing="-1.2" fill={b.text}>{profile.behavior}</text>
        {!test && <g opacity={detail}>
          <path d="M32 278H220" stroke={b.muted} strokeOpacity=".18" strokeWidth="2"/>
          <text x="126" y="326" textAnchor="middle" fontSize="27" fontWeight="750" fill={b.text}>{profile.priority}</text>
          <rect x="96" y="358" width="60" height="5" rx="2.5" fill={b.accent}/>
        </g>}
        {test && <g opacity={visible(frame,34+i*8)}>
          <rect x="17" y="269" width="218" height="42" rx="21" fill={b.accent}/>
          <circle cx="37" cy="290" r="4.5" fill={b.text}/>
          <text x="133" y="298" textAnchor="middle" fontSize="24" fontWeight="750" fill={b.text}>{profile.response}</text>
        </g>}
      </g>;
    })}
  </svg>;
};

/** A conceptual feedback loop; no model output, quoted reviews or measured uplift. */
export const MiroFeedback: React.FC<VisualProps> = ({beat, frame, fps}) => {
  const b = palette;
  const id = uid(beat, 'feedback');
  const review = clamp(arrive(frame, fps, 30));
  const revision = clamp(arrive(frame, fps, 68));
  const arrowOne = progress(frame, 20, 20);
  const arrowTwo = progress(frame, 58, 20);
  return <svg viewBox="0 0 900 600" role="img" aria-label="Conceptual feedback process: find friction, review recommendations, revise the offer, then test again" style={{width: '100%', height: '100%'}}>
    <Definitions id={id} color={b.text}/>
    <g stroke={b.text} fill="none" strokeWidth="4" strokeLinecap="round">
      <path d="M266 243H313" pathLength="1" strokeDasharray="1" strokeDashoffset={1-arrowOne} markerEnd={arrowOne>.95?`url(#${id}-arrow)`:undefined}/>
      <path d="M582 243H629" pathLength="1" strokeDasharray="1" strokeDashoffset={1-arrowTwo} markerEnd={arrowTwo>.95?`url(#${id}-arrow)`:undefined}/>
    </g>
    <g transform={`translate(18 ${92+(1-clamp(arrive(frame,fps,0)))*25})`} opacity={visible(frame,0)}>
      <rect width="245" height="316" rx="28" fill={b.surface} stroke={b.text} strokeOpacity=".22" strokeWidth="2.5" filter={`url(#${id}-shadow)`}/>
      <rect x="25" y="29" width="195" height="147" rx="19" fill="#F1F1F1"/>
      <g fill="none" stroke={b.text} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M51 100C91 54 147 144 176 83C188 57 156 55 120 100S67 143 64 118C60 90 169 69 193 115"/>
      </g>
      <circle cx="186" cy="162" r="26" fill={b.accent}/>
      <path d="M186 148V161" stroke={b.text} strokeWidth="5" strokeLinecap="round"/><circle cx="186" cy="171" r="3" fill={b.text}/>
      <text x="123" y="231" textAnchor="middle" fontSize="29" fontWeight="800" fill={b.text}>Find friction</text>
    </g>
    <g transform={`translate(328 ${65+(1-review)*28})`} opacity={visible(frame,30)}>
      <rect width="246" height="361" rx="28" fill={b.surface} stroke={b.muted} strokeOpacity=".25" strokeWidth="2" filter={`url(#${id}-shadow)`}/>
      <g transform="translate(119 104) rotate(-28)">
        <rect x="-17" y="-65" width="35" height="107" rx="8" fill={b.accent} stroke={b.text} strokeWidth="2"/>
        <path d="M-17 32L0 65L18 32Z" fill={b.surface} stroke={b.text} strokeWidth="2"/>
        <path d="M-6 53L0 65L7 53Z" fill={b.text}/>
        <path d="M-7-46V20" stroke={b.text} strokeWidth="4"/>
      </g>
      <g opacity={visible(frame,44)}>
        <path d="M46 201L54 209L68 193" stroke={b.text} strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="84" y="198" width="105" height="9" rx="4.5" fill={b.muted} opacity=".38"/>
        <path d="M46 234L54 242L68 226" stroke={b.text} strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="84" y="231" width="80" height="9" rx="4.5" fill={b.muted} opacity=".27"/>
      </g>
      <text x="123" y="292" textAnchor="middle" fontSize="29" fontWeight="800" fill={b.text}>Review fixes</text>
    </g>
    <g transform={`translate(636 ${92+(1-revision)*25})`} opacity={visible(frame,68)}>
      <rect width="246" height="316" rx="28" fill={b.surface} stroke={b.text} strokeWidth="2.5" filter={`url(#${id}-shadow)`}/>
      <rect x="25" y="29" width="196" height="147" rx="19" fill={b.accent}/>
      <g opacity={visible(frame,75)}>
        <rect x="49" y="54" width="149" height="19" rx="7" fill={b.text}/>
        <rect x="49" y="92" width="122" height="9" rx="4.5" fill={b.text} opacity=".5"/>
        <rect x="49" y="113" width="145" height="9" rx="4.5" fill={b.text} opacity=".35"/>
        <rect x="49" y="140" width="81" height="17" rx="8.5" fill={b.text}/>
      </g>
      <text x="123" y="231" textAnchor="middle" fontSize="28" fontWeight="800" fill={b.text}>Revised offer</text>
    </g>
    <g opacity={visible(frame,94)}>
      <path d="M758 434C758 507 149 507 149 434" stroke={b.text} strokeWidth="3" fill="none" strokeDasharray="8 9" markerEnd={`url(#${id}-arrow)`}/>
      <rect x="330" y="467" width="240" height="52" rx="26" fill={b.accent}/>
      <text x="450" y="503" textAnchor="middle" fontSize="29" fontWeight="800" fill={b.text}>Test again</text>
    </g>
  </svg>;
};
