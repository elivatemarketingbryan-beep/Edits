import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';

/** Original procedural media for integration testing; never a fake presenter. */
export const SourceFixture: React.FC = () => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{background: '#FFFFFF', color: '#111111', fontFamily: 'Inter, Arial, sans-serif', overflow: 'hidden'}}>
    <svg width="1080" height="1080" style={{position: 'absolute'}}>
      <circle cx={930 + Math.sin(f / 85) * 70} cy={210 + Math.cos(f / 95) * 45} r="300" fill="#F0F0F0"/>
      <path d={`M-100 890 Q 330 ${640 + Math.sin(f / 100) * 80} 640 850T1180 810V1100H-100Z`} fill="#E8E8E8"/>
      <g transform={`translate(790 720) rotate(${f / 4})`}><rect x="-90" y="-90" width="180" height="180" rx="40" fill="#111111"/><circle r="32" fill="#FFFFFF"/></g>
      <g transform={`translate(185 ${710 + Math.sin(f / 25) * 18})`}><circle r="75" fill="#FFFFFF" stroke="#111111" strokeWidth="3"/><path d="M-28 0H28M0-28V28" stroke="#111111" strokeWidth="8"/></g>
    </svg>
    <div style={{position: 'absolute', top: 250, left: 88, fontSize: 174, lineHeight: .87, letterSpacing: -10, fontWeight: 900}}>YOUR<br/>STORY.</div>
    <div style={{position: 'absolute', bottom: 56, left: 90, width: 860, height: 5, background: '#11111125'}}><div style={{width: `${f / 419 * 100}%`, height: '100%', background: '#111111'}}/></div>
  </AbsoluteFill>;
};
