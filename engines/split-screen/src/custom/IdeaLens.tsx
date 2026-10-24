import React from 'react';
import {interpolate} from 'remotion';
import {arrive, clamp, fitType} from '../motion';
import type {VisualProps} from '../types';

/** An original visual analogy: move attention from surrounding detail to the idea. */
export const IdeaLens: React.FC<VisualProps> = ({beat, brand, frame, fps}) => {
  const props = beat.visual.type === 'custom' ? beat.visual.props : undefined;
  const focus = typeof props?.focus === 'string' ? props.focus : 'The useful idea';
  const context = typeof props?.context === 'string' ? props.context : 'Find the part that matters';
  const id = `idea-lens-${beat.id.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const enter = clamp(arrive(frame, fps, 2));
  const focusProgress = clamp(arrive(frame, fps, 18));
  const selected = clamp(interpolate(frame, [20, 37], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  const lensX = 357 + focusProgress * 143;
  const lensY = 189 + focusProgress * 51;
  const lensR = 138;
  const detailOpacity = 1 - selected * .48;

  const paper = (magnified: boolean) => <>
    <rect x="121" y="67" width="580" height="356" rx="32" fill={brand.surface} stroke={brand.text} strokeWidth="2"/>
    <g opacity={magnified ? .2 : detailOpacity}>
      <rect x="161" y="105" width="146" height="15" rx="7.5" fill={brand.muted} opacity=".42"/>
      <rect x="323" y="105" width="48" height="15" rx="7.5" fill={brand.muted} opacity=".2"/>
      <rect x="161" y="144" width="347" height="12" rx="6" fill={brand.muted} opacity=".25"/>
      <rect x="161" y="173" width="207" height="12" rx="6" fill={brand.muted} opacity=".25"/>
      <rect x="161" y="315" width="287" height="12" rx="6" fill={brand.muted} opacity=".25"/>
      <rect x="161" y="344" width="357" height="12" rx="6" fill={brand.muted} opacity=".2"/>
      <rect x="161" y="373" width="214" height="12" rx="6" fill={brand.muted} opacity=".2"/>
    </g>
    <rect x="155" y="214" width="501" height="63" rx="17" fill={brand.accent} opacity={magnified ? 1 : .65 + selected * .25}/>
    <text x="406" y="255" textAnchor="middle" fill={brand.text} opacity={magnified ? 1 : 1 - selected} fontSize={fitType(focus, 33, 18, 20)} fontWeight="800" letterSpacing="-1">{focus}</text>
  </>;

  return <svg viewBox="0 0 900 555" role="img" aria-label={`Visual analogy: ${context}`} style={{width: '100%', height: '100%', overflow: 'visible'}}>
    <defs>
      <filter id={`${id}-shadow`} x="-35%" y="-35%" width="180%" height="180%"><feDropShadow dx="0" dy="16" stdDeviation="16" floodColor={brand.text} floodOpacity=".12"/></filter>
      <clipPath id={`${id}-clip`}><circle cx={lensX} cy={lensY} r={lensR - 10}/></clipPath>
      <linearGradient id={`${id}-glass`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFFFFF" stopOpacity=".31"/><stop offset=".6" stopColor="#FFFFFF" stopOpacity="0"/></linearGradient>
    </defs>
    <ellipse cx="459" cy="451" rx="282" ry="24" fill={brand.text} opacity=".07"/>
    <g opacity={enter} transform={`translate(0 ${(1 - enter) * 35})`}>
      <g transform="rotate(-5 410 245)"><rect x="132" y="73" width="580" height="356" rx="32" fill={brand.accent} stroke={brand.text} strokeWidth="2"/></g>
      <g filter={`url(#${id}-shadow)`}>{paper(false)}</g>
      <g opacity={selected}>
        <path d="M89 238H125M107 220V256" stroke={brand.text} strokeWidth="5" strokeLinecap="round"/>
        <circle cx="732" cy="120" r="8" fill={brand.accent} stroke={brand.text} strokeWidth="2"/>
        <path d="M721 94V82M746 107H758" stroke={brand.text} strokeWidth="4" strokeLinecap="round"/>
      </g>
      <g filter={`url(#${id}-shadow)`}>
        <path d={`M${lensX + 93} ${lensY + 103}L${lensX + 193} ${lensY + 216}`} stroke={brand.text} strokeWidth="47" strokeLinecap="round"/>
        <path d={`M${lensX + 115} ${lensY + 128}L${lensX + 177} ${lensY + 198}`} stroke={brand.accent} strokeWidth="7" strokeLinecap="round" opacity=".8"/>
        <circle cx={lensX} cy={lensY} r={lensR} fill={brand.background}/>
        <g clipPath={`url(#${id}-clip)`}>
          <rect x={lensX - lensR} y={lensY - lensR} width={lensR * 2} height={lensR * 2} fill={brand.surface}/>
          <g transform={`translate(${lensX} ${lensY}) scale(1.08) translate(-406 -244)`}>{paper(true)}</g>
          <circle cx={lensX} cy={lensY} r={lensR - 10} fill={`url(#${id}-glass)`}/>
        </g>
        <circle cx={lensX} cy={lensY} r={lensR - 4} fill="none" stroke={brand.accent} strokeWidth="16"/>
        <circle cx={lensX} cy={lensY} r={lensR + 4} fill="none" stroke={brand.text} strokeWidth="2"/>
        <circle cx={lensX} cy={lensY} r={lensR - 12} fill="none" stroke={brand.text} strokeWidth="2"/>
        <path d={`M${lensX - 92} ${lensY - 64}A112 112 0 0 1 ${lensX - 49} ${lensY - 101}`} fill="none" stroke="#FFFFFF" strokeWidth="7" strokeLinecap="round" opacity=".75"/>
      </g>
    </g>
    <g opacity={clamp((frame - 30) / 12)}>
      <text x="118" y="497" fill={brand.text} fontSize={fitType(context, 29, 34, 22)} fontWeight="750" letterSpacing="-.5">{context}</text>
    </g>
  </svg>;
};
