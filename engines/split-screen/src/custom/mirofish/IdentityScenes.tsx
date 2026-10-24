import React from 'react';
import {Img, staticFile} from 'remotion';
import {arrive, clamp} from '../../motion';
import type {VisualProps} from '../../types';

const INK = '#111111';
const YELLOW = '#FFE600';
const fade = (f: number, at: number, len = 12) => clamp((f - at) / len);

export const MiroRepository: React.FC<VisualProps> = ({frame, fps}) => {
  const p = clamp(arrive(frame, fps));
  const screenshot = clamp(arrive(frame, fps, 12));
  const download = clamp(arrive(frame, fps, 59));
  return <svg viewBox="0 0 900 600" style={{width: '100%', height: '100%'}} role="img" aria-label="MiroFish on GitHub, with the project's published app screenshot">
    <g transform={`translate(450 292) scale(${.94 + .06 * p}) translate(-450 -292)`} opacity={p}>
      <rect x="61" y="44" width="792" height="504" rx="24" fill={YELLOW}/>
      <rect x="44" y="26" width="792" height="504" rx="24" fill="#FFFFFF" stroke={INK} strokeWidth="3"/>
      <foreignObject x="77" y="59" width="69" height="69">
        <Img src={staticFile('assets/mirofish/github-invertocat-black.svg')} style={{display: 'block', width: '100%', height: '100%', objectFit: 'contain'}} />
      </foreignObject>
      <text x="170" y="111" fill={INK} fontSize="64" fontWeight="850" letterSpacing="-3">MiroFish</text>
      <rect x="602" y="73" width="204" height="42" rx="9" fill={YELLOW}/>
      <text x="704" y="101" textAnchor="middle" fill={INK} fontSize="23" fontWeight="800" letterSpacing=".4">OPEN SOURCE</text>
      <path d="M74 148H806" stroke={INK} strokeWidth="2"/>
      <foreignObject x="74" y="170" width="732" height="332" opacity={screenshot}>
        <div style={{width: '100%', height: '100%', overflow: 'hidden', borderRadius: 12, background: '#FFFFFF'}}>
          <Img src={staticFile('assets/mirofish/mirofish-screenshot-2.png')} style={{width: '100%', height: '100%', display: 'block', objectFit: 'cover', objectPosition: '50% 0%', transform: `scale(${1.035 - .035 * screenshot})`, transformOrigin: '50% 0%'}} />
        </div>
      </foreignObject>
    </g>
    <g transform={`translate(646 ${522 + (1 - download) * 35})`} opacity={download}>
      <rect x="-174" y="-38" width="349" height="82" rx="18" fill={YELLOW} stroke={INK} strokeWidth="3"/>
      <path d="M-130-17V10M-142-2L-130 11L-118-2M-147 22H-113" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
      <text x="24" y="13" textAnchor="middle" fontSize="32" fontWeight="800" fill={INK}>Free download</text>
    </g>
  </svg>;
};

export const MiroComment: React.FC<VisualProps> = ({frame, fps}) => {
  const p = clamp(arrive(frame + 7, fps));
  const typing = fade(frame, 30, 15);
  const send = clamp(arrive(frame, fps, 80));
  return <svg viewBox="0 0 900 600" style={{width: '100%', height: '100%'}} role="img" aria-label="Comment FISH to get the direct link">
    <g transform={`translate(450 292) scale(${.94 + .06 * p})`} opacity={p}>
      <rect x="-355" y="-191" width="728" height="331" rx="28" fill={YELLOW} transform="rotate(-3)"/>
      <path d="M-349-160Q-349-186-323-186H323Q349-186 349-160V112Q349 138 323 138H-185L-265 196V138H-323Q-349 138-349 112Z" fill="#FFFFFF" stroke={INK} strokeWidth="3"/>
      <text x="-294" y="-124" fill={INK} fontSize="28" letterSpacing="2" fontWeight="750">LEAVE A COMMENT</text>
      <rect x="-294" y="-84" width="582" height="174" rx="16" fill={YELLOW}/>
      <text x="-267" y="46" fill={INK} fontSize="139" fontWeight="900" letterSpacing="-7">{'FISH'.slice(0, Math.max(0, Math.ceil(typing * 4)))}</text>
      {typing < 1 && <rect x={-258 + Math.ceil(typing * 4) * 78} y="-51" width="5" height="105" fill={INK}/>}
      <g transform={`translate(225 3) scale(${.88 + .12 * send})`}>
        <circle r="45" fill={INK}/>
        <path d="M-17 0H17M3-14L17 0L3 14" stroke={YELLOW} fill="none" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </g>
    <g opacity={fade(frame, 89)}>
      <text x="450" y="558" textAnchor="middle" fill={INK} fontSize="38" fontWeight="800">Get the direct link.</text>
    </g>
  </svg>;
};
