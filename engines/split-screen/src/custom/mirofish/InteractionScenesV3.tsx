import React from 'react';
import {Img, staticFile} from 'remotion';
import {arrive, clamp} from '../../motion';
import type {VisualProps} from '../../types';

const ease = (f: number, start: number, duration = 18) => 1 - Math.pow(1 - clamp((f - start) / duration), 3);
const inks = ['#172C44', '#4C302E', '#172E31', '#483A56', '#344324', '#5F3429'];
const clothes = ['#EF775A', '#6388E3', '#D8B14A', '#9762B9', '#419D8F', '#CF647C'];
const skins = ['#E9B38E', '#B57955', '#F1C5A4', '#8D543D', '#D99A76', '#CF9478'];

/** Original painted-avatar geometry; each face has its own hair, clothes and silhouette. */
const Portrait: React.FC<{id: string; index: number; size: number; x: number; y: number}> = ({id, index: i, size, x, y}) => <g transform={`translate(${x} ${y}) scale(${size / 200})`}>
  <defs>
    <radialGradient id={`${id}-skin`} cx="35%" cy="25%" r="80%"><stop stopColor={skins[i % 6]}/><stop offset="1" stopColor={skins[(i + 1) % 6]}/></radialGradient>
    <linearGradient id={`${id}-cloth`} x1="0" y1="0" x2="1" y2="1"><stop stopColor={clothes[i % 6]}/><stop offset="1" stopColor={inks[i % 6]}/></linearGradient>
  </defs>
  <ellipse cx="100" cy="209" rx="82" ry="14" fill="#23455F" opacity=".12"/>
  {i % 3 === 1 && <path d="M43 102Q25 30 70 21Q145-2 160 65L168 158H35Z" fill={inks[i % 6]}/>}
  <path d="M12 200Q20 151 76 151H124Q180 154 189 200L179 211H24Z" fill={`url(#${id}-cloth)`}/>
  <path d="M81 130H120L125 163Q100 183 74 161Z" fill={skins[i % 6]}/>
  <ellipse cx="100" cy="87" rx={i % 2 ? 52 : 48} ry="66" fill={`url(#${id}-skin)`}/>
  {i % 3 === 0 ? <path d="M51 72Q26 20 79 13Q134-5 153 44L152 80L139 49Q106 70 59 49Z" fill={inks[i % 6]}/>
    : i % 3 === 1 ? <path d="M46 91Q28 9 102 16Q173 8 154 102L143 65Q109 78 86 47L54 101Z" fill={inks[i % 6]}/>
      : <path d="M50 56Q48 12 106 18Q146 14 153 62Q114 44 50 56Z" fill={inks[i % 6]}/>}
  <path d="M72 83H83M118 83H130" stroke={inks[i % 6]} strokeWidth="4" strokeLinecap="round"/>
  <circle cx="79" cy="94" r="3" fill="#17222A"/><circle cx="124" cy="94" r="3" fill="#17222A"/>
  <path d="M101 97L97 110H104" fill="none" stroke="#895E4B" strokeWidth="2" strokeLinecap="round"/>
  <path d="M83 123Q101 136 119 121" fill="none" stroke="#773E37" strokeWidth="3" strokeLinecap="round"/>
  {i % 2 === 0 && <g fill="none" stroke={inks[i % 6]} strokeWidth="3"><rect x="62" y="84" width="35" height="26" rx="9"/><rect x="107" y="84" width="35" height="26" rx="9"/><path d="M97 94H107M54 91H62M142 91H150"/></g>}
  {i % 3 === 2 && <path d="M62 113Q79 138 100 140Q127 136 143 108L137 137Q101 176 67 139Z" fill={inks[i % 6]} opacity=".68"/>}
  <path d="M40 187Q52 167 64 166M138 169Q156 177 162 193" fill="none" stroke="#FFFFFF" strokeWidth="4" opacity=".17" strokeLinecap="round"/>
</g>;

export const MiroAudienceAtlasV3: React.FC<VisualProps> = ({frame, fps, height}) => {
  const scale = height / 1920;
  const positions = [
    {x: 97, y: 550, s: 276, r: -9}, {x: 427, y: 462, s: 293, r: 3}, {x: 757, y: 618, s: 230, r: 11},
    {x: 124, y: 1047, s: 265, r: 7}, {x: 431, y: 986, s: 315, r: -4}, {x: 780, y: 1060, s: 231, r: 10},
  ];
  return <svg viewBox={`0 0 1080 ${height}`} style={{width: '100%', height: '100%'}}>
    <defs><radialGradient id="atlas-bg"><stop stopColor="#FFFFFF"/><stop offset="1" stopColor="#DDEAF5"/></radialGradient><filter id="atlas-shadow" x="-30%" y="-30%" width="170%" height="180%"><feDropShadow dx="0" dy="20" stdDeviation="22" floodColor="#30466A" floodOpacity=".16"/></filter></defs>
    <rect width="1080" height={height} fill="url(#atlas-bg)"/>
    <g transform={`scale(1 ${scale})`}>
      <path d="M-65 470Q422 70 1050 700M-30 1510Q390 1260 1140 1490" fill="none" stroke="#BDD0E3" strokeWidth="2"/>
      <g opacity={ease(frame, 0)} transform={`translate(0 ${(1-ease(frame,0))*30})`}>
        <text x="78" y="218" fontSize="91" letterSpacing="-5" fontWeight="850" fill="#15273D">Different people.</text>
        <text x="79" y="320" fontSize="85" letterSpacing="-3" fontStyle="italic" fontFamily="Georgia, serif" fill="#455EA4">Different perspectives.</text>
      </g>
      {positions.map((p, i) => {
        const a = clamp(arrive(frame, fps, 3 + i * 5));
        return <g key={i} transform={`translate(${p.x + p.s/2} ${p.y + p.s/2+(1-a)*120}) rotate(${p.r * a}) scale(${.84+.16*a}) translate(${-p.s/2} ${-p.s/2})`} opacity={ease(frame, 3+i*5, 14)}>
          <rect x="-12" y="-18" width={p.s+24} height={p.s+65} rx={i % 2 ? 150 : 9} fill={['#F9DFD0','#EBE2F4','#F6ECC5','#D6ECE6','#F7DFE6','#D9E3FD'][i]} filter="url(#atlas-shadow)"/>
          <Portrait id={`atlas-face-${i}`} index={i} size={p.s} x={0} y={0}/>
          <path d={`M${p.s*.28} ${p.s+24}H${p.s*.73}`} stroke={clothes[i]} strokeWidth="7" strokeLinecap="round"/>
        </g>;
      })}
      <g opacity={ease(frame, 47)} transform={`translate(${730-(1-ease(frame,47))*150} 851) rotate(-7)`}>
        <path d="M-115-36L109-43L126 40L-128 48Z" fill="#FFDA73"/>
        <text textAnchor="middle" y="13" fontSize="34" fontWeight="850" fill="#2C2B24">THOUSANDS</text>
      </g>
      <path d="M108 891Q245 825 333 911M909 990Q966 945 975 872" fill="none" stroke="#7794BB" strokeWidth="3" strokeDasharray="6 11" opacity=".55"/>
    </g>
  </svg>;
};

export const MiroReactionChatsV3: React.FC<VisualProps> = ({frame, fps, height}) => {
  const t = clamp(frame/88);
  const replies = [
    {x: 58, y: 360, w: 469, h: 175, text: 'Interested.', fill: '#4AC8A4', ink: '#103D35', at: 15, tilt: -7},
    {x: 455, y: 562, w: 517, h: 164, text: 'Questions?', fill: '#AEC7FF', ink: '#203560', at: 29, tilt: 5},
    {x: 147, y: 740, w: 420, h: 122, text: 'Not yet.', fill: '#FFA58E', ink: '#73372D', at: 45, tilt: -3},
  ];
  return <svg viewBox="0 0 1080 960" preserveAspectRatio="xMidYMid slice" style={{width: '100%', height: '100%'}}>
    <defs><linearGradient id="chats-bg" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#FFFDF9"/><stop offset="1" stopColor="#EEE9E3"/></linearGradient><filter id="chats-shadow"><feDropShadow dx="0" dy="9" stdDeviation="8" floodColor="#302522" floodOpacity=".1"/></filter></defs>
    <rect width="1080" height="960" fill="url(#chats-bg)"/>
    <text x="73" y="151" fontSize="95" fontWeight="850" letterSpacing="-5" fill="#282521">See who bites.</text>
    <path d="M86 282Q341 124 654 280T1034 326" fill="none" stroke="#B5B0A8" strokeWidth="3" strokeDasharray="7 13"/>
    <g transform={`translate(${155+730*ease(frame,0,30)} ${268-105*Math.sin(t*Math.PI)}) rotate(-13)`} opacity={1-ease(frame,30,13)}>
      <path d="M-80 16L63-37L27 65L-1 30L-45 59L-33 18Z" fill="#E7BD49"/><path d="M-33 18L63-37L-1 30L-45 59" fill="none" stroke="#866821" strokeWidth="3"/>
    </g>
    {replies.map((r, i) => {
      const p=clamp(arrive(frame,fps,r.at));
      return <g key={r.text} opacity={ease(frame,r.at,8)} transform={`translate(${r.x+r.w/2} ${r.y+r.h/2+(1-p)*45}) rotate(${r.tilt*p}) scale(${.65+.35*p}) translate(${-r.w/2} ${-r.h/2})`}>
        <path d={`M28 0H${r.w-28}Q${r.w} 0 ${r.w} 28V${r.h-28}Q${r.w} ${r.h} ${r.w-28} ${r.h}H90L53 ${r.h+36}L58 ${r.h}H28Q0 ${r.h} 0 ${r.h-28}V28Q0 0 28 0Z`} fill={r.fill} filter="url(#chats-shadow)"/>
        <text x={r.w/2} y={r.h/2+20} textAnchor="middle" fontSize={i===2?58:67} fontWeight="800" letterSpacing="-2.4" fill={r.ink}>{r.text}</text>
      </g>;
    })}
    <g transform="translate(885 819) rotate(9)" opacity={ease(frame,58,15)}><circle r="53" fill="#FFFFFF"/><path d="M-20 1L-4 18L26-20" stroke="#379C80" strokeWidth="9" fill="none" strokeLinecap="round" strokeLinejoin="round"/></g>
  </svg>;
};

export const MiroFeedbackDeskV3: React.FC<VisualProps> = ({frame, fps}) => {
  const fix=ease(frame,64,24);
  const mark=ease(frame,22,30);
  const turn=clamp(arrive(frame,fps,68));
  return <svg viewBox="0 0 1080 960" style={{width:'100%',height:'100%'}}>
    <defs><pattern id="desk-grid" width="42" height="42" patternUnits="userSpaceOnUse"><path d="M42 0H0V42" stroke="#9BBDB0" strokeWidth="1" fill="none" opacity=".2"/></pattern><filter id="desk-shadow" x="-35%" y="-30%" width="180%" height="180%"><feDropShadow dx="5" dy="19" stdDeviation="18" floodColor="#365C4F" floodOpacity=".2"/></filter></defs>
    <rect width="1080" height="960" fill="#DEEEE5"/><rect width="1080" height="960" fill="url(#desk-grid)"/>
    <text x="80" y="142" fontSize="85" fontWeight="850" letterSpacing="-4.3" fill="#223D33">Find it. Fix it.</text>
    <g transform="translate(533 520) rotate(-5)">
      <path d="M-326-245H326V286L307 278L288 288L269 281L248 288L228 280L209 288L188 280L169 288L148 280L129 288L108 280L89 288L68 280L49 288L28 280L9 288L-12 280L-31 288L-52 280L-71 288L-92 280L-111 288L-132 280L-151 288L-172 280L-191 288L-212 280L-231 288L-252 280L-271 288L-292 280L-326 286Z" fill="#FFFDF6" filter="url(#desk-shadow)"/>
      <text x="-258" y="-151" fontFamily="Georgia, serif" fontSize="61" fontWeight="700" fill="#302D28">Your offer</text>
      {[0,1,2,3].map(i=><g key={i}><rect x="-255" y={-81+i*61} width={[426,339,466,288][i]} height="14" rx="7" fill="#A7A398" opacity=".38"/></g>)}
      <path d="M-267-38Q-130-71 189-35M-264 78Q-36 33 209 79" pathLength="1" stroke="#E36551" strokeWidth="9" fill="none" strokeDasharray="1" strokeDashoffset={1-mark} strokeLinecap="round"/>
      <g opacity={ease(frame,38)} transform="translate(169 197) rotate(-10)"><rect x="-104" y="-35" width="208" height="65" rx="4" stroke="#CA5645" fill="none" strokeWidth="4"/><text textAnchor="middle" y="10" fontSize="33" fontWeight="800" letterSpacing="2" fill="#CA5645">REWORK</text></g>
    </g>
    <g transform={`translate(${542+(1-turn)*970} ${491+(1-turn)*95}) rotate(${7-(turn*4)})`} opacity={fix}>
      <rect x="-318" y="-214" width="636" height="487" fill="#FFFFFF" filter="url(#desk-shadow)"/>
      <rect x="-269" y="-159" width="438" height="75" fill="#F8D478"/>
      <text x="-253" y="-103" fontFamily="Georgia, serif" fontStyle="italic" fontSize="51" fill="#273D33">A clearer offer.</text>
      {[0,1,2].map(i=><g key={i} opacity={ease(frame,85+i*9)}><path d={`M-255 ${-20+i*65}l12 14 28-31`} stroke="#419176" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none"/><rect x="-193" y={-33+i*65} width={[349,287,380][i]} height="18" rx="9" fill="#45564E"/></g>)}
      <text x="-256" y="218" fontSize="33" fontWeight="750" fill="#419176" opacity={ease(frame,120)}>Test again ↗</text>
    </g>
    <g transform={`translate(${835-fix*60} ${328+Math.sin(mark*Math.PI)*190}) rotate(${33+fix*22})`}>
      <rect x="-19" y="-128" width="38" height="229" rx="9" fill="#EFBB39"/><rect x="-19" y="-128" width="38" height="36" rx="8" fill="#E68984"/><path d="M-19 99L0 147L19 99Z" fill="#D8B586"/><path d="M-6 133L0 147L6 133Z" fill="#373B34"/><path d="M-7-82V83" stroke="#FFF0B5" strokeWidth="5" opacity=".75"/>
    </g>
  </svg>;
};

export const MiroCommentPosterV3: React.FC<VisualProps> = ({frame}) => {
  const typed='FISH'.slice(0,Math.max(0,Math.ceil(clamp((frame-30)/15)*4)));
  const line=ease(frame,89);
  return <div style={{height:'100%',width:'100%',position:'relative',background:'#FCFBF7',overflow:'hidden',color:'#161616'}}>
    <svg viewBox="0 0 1080 960" style={{position:'absolute',inset:0,width:'100%',height:'100%'}}>
      <path d="M72 326L935 285L978 601L81 633Z" fill="#FFE253" transform={`translate(${(1-ease(frame,7))*1080} 0)`}/>
      <path d="M849 170L855 203M882 178L868 207M898 214L873 218" stroke="#3F71A0" strokeWidth="6" strokeLinecap="round" opacity={ease(frame,10)}/>
      <path d="M765 648Q893 676 892 781L922 755M892 781L861 757" stroke="#202020" strokeWidth="5" fill="none" strokeLinecap="round" opacity={line}/>
    </svg>
    <div style={{position:'absolute',left:83,top:100,fontSize:80,letterSpacing:-4,fontWeight:800,opacity:ease(frame,0)}}>Comment</div>
    <div style={{position:'absolute',left:72,top:286,fontSize:251,letterSpacing:-14,fontWeight:900,lineHeight:1.12}}>{typed}{typed.length<4&&<span style={{fontWeight:400,fontSize:200}}>|</span>}</div>
    <div style={{position:'absolute',left:85,top:704,fontSize:48,fontFamily:'Georgia, serif',fontStyle:'italic',opacity:line}}>I'll send the link.</div>
    <div style={{position:'absolute',left:720,top:88,width:214,height:169,overflow:'hidden',transform:'rotate(7deg)',opacity:ease(frame,6),borderRadius:9}}>
      <Img src={staticFile('assets/mirofish/mirofish-logo.jpeg')} style={{position:'absolute',height:169,width:'auto',maxWidth:'none',left:0,top:0}}/>
    </div>
  </div>;
};
