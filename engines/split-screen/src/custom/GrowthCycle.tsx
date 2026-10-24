import React from 'react';
import {arrive, clamp, fitType} from '../motion';
import type {VisualProps} from '../types';

/** Original botanical teaching diagram; stages communicate a process, not elapsed time. */
export const GrowthCycle: React.FC<VisualProps> = ({beat, brand, frame, fps}) => {
  const props = beat.visual.type === 'custom' ? beat.visual.props : undefined;
  const title = typeof props?.label === 'string' ? props.label : 'Growth starts below the surface';
  const seed = clamp(arrive(frame, fps, 3));
  const roots = clamp((frame - 13) / 26);
  const shoot = clamp((frame - 28) / 30);
  const leaves = clamp(arrive(frame, fps, 45));
  const label = clamp((frame - 50) / 14);
  const id = `growth-${beat.id.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  return <svg viewBox="0 0 900 555" role="img" aria-label="Illustrative plant development: seed, roots, then a shoot and leaves" style={{width: '100%', height: '100%'}}>
    <defs>
      <clipPath id={`${id}-window`}><rect x="170" y="30" width="555" height="439" rx="42"/></clipPath>
      <linearGradient id={`${id}-soil`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={brand.surface}/><stop offset="1" stopColor="#EAEAEA"/></linearGradient>
    </defs>
    <rect x="178" y="43" width="555" height="439" rx="42" fill={brand.text} opacity=".07"/>
    <rect x="170" y="30" width="555" height="439" rx="42" fill={brand.surface} stroke={brand.text} strokeWidth="2"/>
    <g clipPath={`url(#${id}-window)`}>
      <circle cx="630" cy="92" r="38" fill={brand.accent} stroke={brand.text} strokeWidth="2"/>
      <path d="M160 266C235 244 291 279 359 262S485 246 547 263S674 244 745 265V490H160Z" fill={`url(#${id}-soil)`}/>
      <path d="M170 267C235 244 291 279 359 262S485 246 547 263S674 244 725 262" fill="none" stroke={brand.muted} strokeOpacity=".42" strokeWidth="3"/>
      {[[-130,346],[-72,396],[137,327],[192,381],[-180,420],[110,438]].map(([x,y], i) => <ellipse key={i} cx={450+x} cy={y} rx="4" ry="2.5" fill={brand.muted} opacity=".25"/>)}
      <g stroke={brand.text} strokeWidth="5" fill="none" strokeLinecap="round" opacity=".8">
        {['M449 299C445 333 453 361 442 416','M448 333C415 335 407 363 382 376','M450 353C483 353 487 376 510 392','M445 378C421 383 416 406 404 421'].map((d,i) => <path key={d} d={d} pathLength="1" strokeDasharray="1" strokeDashoffset={1-clamp(roots*1.4-i*.13)}/>)}
      </g>
      <g transform={`translate(450 289) scale(${seed}) rotate(-18)`}>
        <ellipse rx="29" ry="22" fill={brand.accent} stroke={brand.text} strokeWidth="2"/>
        <path d="M-9-15C-1-6 2 7 7 15" stroke={brand.text} strokeWidth="2.5" fill="none"/>
      </g>
      <path d="M452 274C430 240 456 216 451 184S459 146 466 132" stroke={brand.text} strokeWidth="12" strokeLinecap="round" fill="none" pathLength="1" strokeDasharray="1" strokeDashoffset={1-shoot}/>
      <g transform={`translate(454 191) scale(${leaves})`}>
        <path d="M0 0C-75-5-104-58-103-90C-51-96-2-53 0 0Z" fill={brand.accent} stroke={brand.text} strokeWidth="3"/>
        <path d="M0-3C-28-31-48-48-78-65" fill="none" stroke={brand.text} strokeWidth="3"/>
        <path d="M6-4C76-9 116-53 119-91C64-101 14-60 6-4Z" fill={brand.accent} stroke={brand.text} strokeWidth="3"/>
        <path d="M10-8C36-36 68-58 92-70" fill="none" stroke={brand.text} strokeWidth="3"/>
      </g>
    </g>
    <g fill={brand.text} fontSize="24" fontWeight="750">
      <g opacity={clamp((frame-8)/10)}><text x="38" y="297">Seed</text><path d="M109 289H163" stroke={brand.muted} strokeWidth="2"/></g>
      <g opacity={clamp((frame-29)/10)}><text x="749" y="393">Roots</text><path d="M733 384H688" stroke={brand.muted} strokeWidth="2"/></g>
      <g opacity={label}><text x="745" y="139">Leaves</text><path d="M735 133H691" stroke={brand.muted} strokeWidth="2"/></g>
    </g>
    <text x="450" y="518" textAnchor="middle" fill={brand.text} fontSize={fitType(title, 30, 37, 21)} fontWeight="750" opacity={label}>{title}</text>
  </svg>;
};
