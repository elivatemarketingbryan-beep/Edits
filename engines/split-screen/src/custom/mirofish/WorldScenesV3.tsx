import React from 'react';
import {arrive, clamp} from '../../motion';
import type {VisualProps} from '../../types';

// Two independent visual worlds: a tactile offer/crowd illustration, then an
// expressive typographic takeover. The sequence is driven by source speech.
const ramp = (frame: number, start: number, length = 20) => clamp((frame - start) / length);
const smooth = (value: number) => 1 - Math.pow(1 - value, 3);

const Customer: React.FC<{x: number; y: number; scale: number; shirt: string; skin: string; hair: string; variant: number; opacity?: number}> = ({x, y, scale, shirt, skin, hair, variant, opacity = 1}) => <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={opacity}>
  <ellipse cy="76" rx="48" ry="12" fill="#654F5B" opacity=".14" />
  <path d="M-42 62Q-44 13-20 4L20 4Q45 17 42 62Q3 85-42 62Z" fill={shirt}/>
  <path d="M22 11Q43 21 42 62Q30 69 22 70Z" fill="#22254D" opacity=".13"/>
  <path d="M-25 18Q-35 28-34 49" fill="none" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" opacity=".28"/>
  <rect x="-9" y="-10" width="18" height="26" rx="8" fill={skin}/>
  {variant % 3 === 0 && <path d="M-24-36Q-34-67 0-69Q36-66 29-29L24 7H-26Z" fill={hair}/>}
  <ellipse cy="-36" rx="25" ry="31" fill={skin}/>
  <ellipse cx="24" cy="-31" rx="5" ry="8" fill={skin}/>
  <path d={variant % 3 === 0 ? 'M-25-39Q-30-68 0-69Q23-70 28-48L8-56Q-3-36-25-39Z' : variant % 3 === 1 ? 'M-25-45Q-29-66-12-65Q-3-81 12-68Q33-69 26-39L13-49Q-11-44-25-45Z' : 'M-25-45Q-23-70 3-69Q27-68 27-39L17-51H-18Z'} fill={hair}/>
  <circle cx="-8" cy="-35" r="2" fill="#322F39"/><circle cx="9" cy="-35" r="2" fill="#322F39"/>
  <path d="M-5-21Q1-16 7-22" stroke="#9D5B56" strokeWidth="2" fill="none" strokeLinecap="round"/>
  {variant % 4 === 1 && <g stroke="#3A3452" strokeWidth="2" fill="none"><circle cx="-9" cy="-35" r="8"/><circle cx="10" cy="-35" r="8"/><path d="M-1-35H2"/></g>}
</g>;

const Parcel: React.FC<{x: number; y: number; scale: number; rotation?: number}> = ({x, y, scale, rotation = 0}) => <g transform={`translate(${x} ${y}) rotate(${rotation}) scale(${scale})`}>
  <ellipse cx="15" cy="193" rx="175" ry="35" fill="#8B5D73" opacity=".14"/>
  <path d="M-165-98L52-162L198-73L-27-6Z" fill="#FFE0AE"/>
  <path d="M-165-98L-27-6V203L-165 106Z" fill="#EDA974"/>
  <path d="M-27-6L198-73V135L-27 203Z" fill="#FFC988"/>
  <path d="M-160-91L-31-7V193" fill="none" stroke="#FFFFFF" strokeOpacity=".32" strokeWidth="4"/>
  <path d="M-77-124L-33-137L112-48L68-35Z" fill="#BEAAF1"/>
  <path d="M68-35L112-48V46L68 60Z" fill="#977DCF"/>
  <path d="M6 51L162 4V89L6 136Z" fill="#FFF9E9"/>
  <g transform="translate(86 69) rotate(-17)"><text textAnchor="middle" fontFamily="Inter, Arial, sans-serif" fontSize="35" fontWeight="850" letterSpacing="1.5" fill="#58405C">OFFER</text><path d="M-46 15H46" stroke="#D5BBC2" strokeWidth="3"/></g>
  <path d="M137 121V146M152 116V141M145 113L132 126M145 113L157 119" stroke="#865A69" strokeWidth="3" strokeLinecap="round" fill="none"/>
</g>;

const Bubble: React.FC<{x: number; y: number; text: string; fill: string; delay: number; frame: number; rotate?: number}> = ({x, y, text, fill, delay, frame, rotate = 0}) => {
  const p = smooth(ramp(frame, delay, 14));
  const width = text.length > 4 ? 158 : 114;
  return <g opacity={p} transform={`translate(${x} ${y}) rotate(${rotate}) scale(${.65 + .35 * p})`}>
    <path d={`M${-width / 2} -31Q${-width / 2} -48 ${-width / 2 + 17} -48H${width / 2 - 17}Q${width / 2} -48 ${width / 2} -31V16Q${width / 2} 33 ${width / 2 - 17} 33H7L-11 47L-9 33H${-width / 2 + 17}Q${-width / 2} 33 ${-width / 2} 16Z`} fill="#9E7691" opacity=".14" transform="translate(1 7)"/>
    <path d={`M${-width / 2} -31Q${-width / 2} -48 ${-width / 2 + 17} -48H${width / 2 - 17}Q${width / 2} -48 ${width / 2} -31V16Q${width / 2} 33 ${width / 2 - 17} 33H7L-11 47L-9 33H${-width / 2 + 17}Q${-width / 2} 33 ${-width / 2} 16Z`} fill={fill}/>
    <text textAnchor="middle" y="5" fontFamily="Georgia, serif" fontSize="35" fontStyle="italic" fontWeight="700" fill="#433044">{text}</text>
  </g>;
};

export const MiroOfferWorldV3: React.FC<VisualProps> = ({frame, fps}) => {
  const entry = clamp(arrive(frame + 4, fps, 0));
  const travel = smooth(ramp(frame, 25, 48));
  const number = smooth(ramp(frame, 84, 17));
  const approach = smooth(ramp(frame, 84, 40));
  const people = [
    {x: 275, y: 408, s: .67, shirt: '#7E9DC8', skin: '#DFA17D', hair: '#423D53'},
    {x: 421, y: 376, s: .64, shirt: '#DAAB7E', skin: '#8D5846', hair: '#352C3C'},
    {x: 562, y: 372, s: .69, shirt: '#B2A5D2', skin: '#F2CBA5', hair: '#8D5642'},
    {x: 705, y: 396, s: .73, shirt: '#8DAD8D', skin: '#C17E5E', hair: '#332B3A'},
    {x: 835, y: 442, s: .81, shirt: '#DB917F', skin: '#E6B394', hair: '#5C4150'},
    {x: 914, y: 556, s: .9, shirt: '#7DAFC1', skin: '#855241', hair: '#302C3B'},
    {x: 922, y: 697, s: 1.08, shirt: '#AC98D0', skin: '#ECC59D', hair: '#AB6943'},
    {x: 796, y: 803, s: 1.2, shirt: '#467898', skin: '#BA7653', hair: '#312D39'},
    {x: 633, y: 835, s: 1.18, shirt: '#DEA078', skin: '#F2C7A4', hair: '#403146'},
    {x: 476, y: 839, s: 1.15, shirt: '#859D83', skin: '#A96B54', hair: '#392E37'},
    {x: 285, y: 792, s: 1.2, shirt: '#AA8DCA', skin: '#E7B28D', hair: '#6F4239'},
    {x: 145, y: 690, s: 1.06, shirt: '#E1A45C', skin: '#82523F', hair: '#322C31'},
    {x: 121, y: 544, s: .89, shirt: '#DF8C8C', skin: '#F2CAA3', hair: '#463C53'},
    {x: 173, y: 451, s: .76, shirt: '#94B7A3', skin: '#D2926D', hair: '#3E3035'},
  ];
  const drawCustomer = (i: number) => {
    const a = people[i];
    const p = smooth(ramp(frame, 20 + i * 2.4, 24));
    const shrink = 1 - .06 * approach;
    const x = 540 + (a.x - 540) * shrink;
    return <Customer key={i} x={x} y={a.y + 22 * (1 - p)} scale={a.s * (.85 + .15 * p)} shirt={a.shirt} skin={a.skin} hair={a.hair} variant={i} opacity={p}/>;
  };
  return <svg viewBox="0 0 1080 960" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" role="img" aria-label="A dimensional offer package enters a diverse crowd of customer avatars; some respond yes and others not yet.">
    <defs>
      <linearGradient id="offer-world-sky" x1="0" y1="0" x2=".7" y2="1"><stop stopColor="#FFF2D9"/><stop offset=".55" stopColor="#F5DBD5"/><stop offset="1" stopColor="#E2D5EF"/></linearGradient>
      <radialGradient id="offer-world-floor"><stop stopColor="#FFF3DA"/><stop offset="1" stopColor="#DFC6D9"/></radialGradient>
      <radialGradient id="offer-world-light"><stop stopColor="#FFFFFF" stopOpacity=".8"/><stop offset="1" stopColor="#FFFFFF" stopOpacity="0"/></radialGradient>
    </defs>
    <rect width="1080" height="960" fill="url(#offer-world-sky)"/>
    <ellipse cx="283" cy="213" rx="475" ry="353" fill="url(#offer-world-light)"/>
    <path d="M0 606Q289 469 586 558T1080 562V960H0Z" fill="#EACCDD" opacity=".58"/>
    <ellipse cx="535" cy="687" rx="567" ry="213" fill="url(#offer-world-floor)"/>
    <ellipse cx="535" cy="701" rx="437" ry="168" fill="none" stroke="#C7ADC7" strokeWidth="3" strokeDasharray="5 16" opacity=".55"/>
    <g opacity={1 - number} transform={`translate(0 ${-number * 30})`}>
      <text x="541" y="137" textAnchor="middle" fontFamily="Inter, Arial, sans-serif" fontSize="74" fontWeight="850" letterSpacing="-3" fill="#513A52">Your offer.</text>
      <text x="540" y="213" textAnchor="middle" fontFamily="Georgia, serif" fontSize="62" fontStyle="italic" fill="#8A6178">A whole new audience.</text>
    </g>
    <g opacity={number} transform={`translate(0 ${(1 - number) * 30})`}>
      <text x="537" y="206" textAnchor="middle" fontFamily="Inter, Arial, sans-serif" fontSize="198" fontWeight="850" letterSpacing="-13" fill="#513A52">1,000</text>
      <text x="540" y="280" textAnchor="middle" fontFamily="Georgia, serif" fontSize="55" fontStyle="italic" fill="#8A6178">customer avatars</text>
    </g>
    {[0, 1, 2, 3, 4, 5, 12, 13].map(drawCustomer)}
    <g opacity={entry}>
      <path d="M231 658Q363 703 528 660" fill="none" stroke="#A292C6" strokeWidth="7" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - travel} opacity=".5"/>
      <Parcel x={295 + travel * 208} y={511 - 18 * travel} scale={.83 + .08 * travel} rotation={-13 * (1 - travel)}/>
    </g>
    {[6, 7, 8, 9, 10, 11].map(drawCustomer)}
    <Bubble x={777} y={620} text="Yes!" fill="#D3E2B7" frame={frame} delay={147} rotate={7}/>
    <Bubble x={282} y={607} text="Not yet" fill="#F3C5BF" frame={frame} delay={152} rotate={-8}/>
    <Bubble x={713} y={360} text="Yes!" fill="#D3E2B7" frame={frame} delay={156} rotate={-5}/>
    <g fill="#B896B7" opacity={.5 * entry}><path d="M963 240l6 16 16 6-16 6-6 16-6-16-16-6 16-6Z"/><circle cx="107" cy="297" r="7"/><circle cx="986" cy="391" r="5"/></g>
  </svg>;
};

const Spark: React.FC<{x: number; y: number; size: number; opacity?: number}> = ({x, y, size, opacity = 1}) => <path transform={`translate(${x} ${y}) scale(${size})`} d="M0-18C3-4 4-3 18 0C4 3 3 4 0 18C-3 4-4 3-18 0C-4-3-3-4 0-18Z" fill="#FFF8ED" opacity={opacity}/>;

export const MiroReactionWorldV3: React.FC<VisualProps> = ({frame}) => {
  const bloom = smooth(ramp(frame, 0, 50));
  const expansion = smooth(ramp(frame, 16, 58));
  const question = 1 - smooth(ramp(frame, 70, 12));
  const future = smooth(ramp(frame, 86, 16));
  const orbitTurn = smooth(ramp(frame, 28, 88));
  const rings = smooth(ramp(frame, 8, 45));
  const tokenData = [
    {x: 226, y: 465, r: 97, fill: '#FAD2E9', label: 'I’m in', angle: -9, delay: 20},
    {x: 847, y: 646, r: 103, fill: '#D3D1FF', label: 'Why?', angle: 8, delay: 34},
    {x: 204, y: 1195, r: 112, fill: '#FFD6B0', label: 'Not for me', angle: -7, delay: 47},
    {x: 787, y: 1314, r: 129, fill: '#F5D3FF', label: 'Tell me more', angle: 7, delay: 59},
  ];
  return <svg viewBox="0 0 1080 1920" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Possible customer reactions orbit a luminous field before a product launch.">
    <defs>
      <linearGradient id="reaction-field-base" x1="0" y1="0" x2=".6" y2="1"><stop stopColor="#D968A4"/><stop offset=".43" stopColor="#EA928A"/><stop offset=".69" stopColor="#C369BF"/><stop offset="1" stopColor="#343AAE"/></linearGradient>
      <radialGradient id="reaction-field-light" cx=".49" cy=".43" r=".54"><stop stopColor="#FFF8D6"/><stop offset=".21" stopColor="#FFE7B3"/><stop offset=".53" stopColor="#F9A780" stopOpacity=".82"/><stop offset="1" stopColor="#F091C3" stopOpacity="0"/></radialGradient>
      <radialGradient id="reaction-field-blue" cx="1" cy=".8" r=".66"><stop stopColor="#6058D9" stopOpacity=".9"/><stop offset="1" stopColor="#6864DB" stopOpacity="0"/></radialGradient>
      <linearGradient id="reaction-orb" x1=".25" y1="0" x2=".6" y2="1"><stop stopColor="#FFFAE8"/><stop offset=".36" stopColor="#FFE8B2"/><stop offset=".73" stopColor="#F7B2B2"/><stop offset="1" stopColor="#AD80DB"/></linearGradient>
      <radialGradient id="reaction-token-gloss" cx=".25" cy=".1" r="1"><stop stopColor="#FFFFFF" stopOpacity=".9"/><stop offset=".65" stopColor="#FFFFFF" stopOpacity="0"/></radialGradient>
    </defs>
    <rect width="1080" height="1920" fill="url(#reaction-field-base)"/>
    <rect width="1080" height="1920" fill="url(#reaction-field-blue)"/>
    <rect x={-60 * bloom} y={-75 * bloom} width={1080 + 120 * bloom} height={1920 + 150 * bloom} fill="url(#reaction-field-light)"/>
    <g opacity={rings} fill="none" stroke="#FFF8DF" strokeWidth="2">
      <ellipse cx="538" cy="904" rx={447 + 15 * future} ry="521" transform={`rotate(${-32 + 9 * orbitTurn} 538 904)`} opacity=".47"/>
      <ellipse cx="538" cy="904" rx="454" ry="346" transform={`rotate(${31 - 7 * orbitTurn} 538 904)`} opacity=".34"/>
      <ellipse cx="538" cy="904" rx="301" ry="651" transform={`rotate(${33 - 12 * orbitTurn} 538 904)`} opacity=".22"/>
    </g>
    <g opacity={smooth(ramp(frame, 4, 21))}>
      <text x="540" y="240" textAnchor="middle" fontFamily="Inter, Arial, sans-serif" fontSize="31" fontWeight="750" letterSpacing="7" fill="#FFF8E8">READ THE REACTION</text>
      <path d="M511 277H569" stroke="#FFF8E8" strokeWidth="2" opacity=".7"/>
    </g>
    <g opacity={question} transform={`translate(0 ${-(1 - question) * 40 + 33 * (1 - bloom)})`} fill="#472347">
      <text x="541" y="792" textAnchor="middle" fontFamily="Inter, Arial, sans-serif" fontSize="106" fontWeight="850" letterSpacing="-6">How will they</text>
      <text x="527" y="1016" textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif" fontSize="246" fontStyle="italic" letterSpacing="-13">react?</text>
    </g>
    <g opacity={future} transform={`translate(0 ${(1 - future) * 82})`} fill="#472347">
      <text x="521" y="816" textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif" fontSize="209" fontStyle="italic" letterSpacing="-12">Before</text>
      <text x="540" y="993" textAnchor="middle" fontFamily="Inter, Arial, sans-serif" fontSize="137" fontWeight="870" letterSpacing="-7">you launch.</text>
    </g>
    {tokenData.map((token, i) => {
      const p = smooth(ramp(frame, token.delay, 26));
      const x = 540 + (token.x - 540) * expansion;
      const y = 922 + (token.y - 922) * expansion;
      const angle = token.angle * p + (i % 2 ? 5 : -5) * orbitTurn;
      return <g key={token.label} transform={`translate(${x} ${y}) rotate(${angle}) scale(${.64 + .36 * p})`} opacity={p}>
        <ellipse cy={token.r * .84} rx={token.r * .79} ry="17" fill="#733968" opacity=".14"/>
        <circle r={token.r} fill={token.fill} fillOpacity=".79" stroke="#FFF5E4" strokeWidth="2" strokeOpacity=".72"/>
        <circle r={token.r} fill="url(#reaction-token-gloss)"/>
        {i === 0 ? <path d="M-26-23L-8-5 30-44" fill="none" stroke="#744C80" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
          : i === 1 ? <text y="-16" textAnchor="middle" fontFamily="Georgia, serif" fontSize="65" fontStyle="italic" fill="#744C80">?</text>
          : i === 2 ? <path d="M-20-28H20" stroke="#744C80" strokeWidth="7" strokeLinecap="round"/>
          : <path d="M-27-31H27M-27-17H13" stroke="#744C80" strokeWidth="5" strokeLinecap="round"/>}
        <text y="38" textAnchor="middle" fontFamily="Inter, Arial, sans-serif" fontSize={i > 1 ? 27 : 32} fontWeight="650" letterSpacing="-.5" fill="#553557">{token.label}</text>
      </g>;
    })}
    <g opacity={bloom} transform={`translate(538 1190) scale(${.65 + .35 * bloom})`}>
      <ellipse cy="56" rx="70" ry="18" fill="#BC668F" opacity=".15"/>
      <circle r="63" fill="url(#reaction-orb)" stroke="#FFE8CF" strokeWidth="1.8"/>
      <ellipse cy="1" rx="84" ry="19" fill="none" stroke="#FFF3DA" strokeWidth="3" transform={`rotate(${-29 + 8 * future})`}/>
      <circle cx="-19" cy="-23" r="13" fill="#FFFFFF" opacity=".3"/>
    </g>
    <Spark x={860} y={313} size={1.1} opacity={.9 * bloom}/>
    <Spark x={118} y={860} size={.65} opacity={.8 * bloom}/>
    <Spark x={936} y={1082} size={1.3} opacity={.85 * bloom}/>
    <Spark x={401} y={1378} size={.65} opacity={.8 * bloom}/>
    <g opacity={.6 * bloom} fill="#FFF8DF"><circle cx="901" cy="398" r="3"/><circle cx="158" cy="1312" r="4"/><circle cx="322" cy="326" r="4"/><circle cx="967" cy="1451" r="3"/></g>
  </svg>;
};
