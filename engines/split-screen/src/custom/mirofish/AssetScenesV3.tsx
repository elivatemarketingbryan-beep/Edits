import React from 'react';
import {Img, staticFile} from 'remotion';
import {arrive, clamp} from '../../motion';
import type {VisualProps} from '../../types';

const fade = (frame: number, at = 0, duration = 9) => clamp((frame - at) / duration);
const asset = (name: string) => staticFile(`assets/mirofish/${name}`);

// Official local assets and their provenance are recorded in
// public/assets/mirofish/README.md and jobs/mirofish/assets-v2.md.
// These components crop/reframe source images; they do not invent product UI.
export const MiroRepoStudioV3: React.FC<VisualProps> = ({frame, fps}) => {
  const entry = clamp(arrive(frame + 7, fps));
  const display = clamp(arrive(frame, fps, 7));
  const focus = clamp((frame - 35) / 90);
  const download = clamp(arrive(frame, fps, 59));
  return <svg viewBox="0 0 1080 960" style={{display: 'block', width: '100%', height: '100%'}} role="img" aria-label="MiroFish product studio with the official app screenshot and GitHub mark">
    <defs>
      <radialGradient id="v3-studio-glow"><stop offset="0" stopColor="#285FE8" stopOpacity=".52"/><stop offset="1" stopColor="#285FE8" stopOpacity="0"/></radialGradient>
      <filter id="v3-studio-shadow" x="-.2" y="-.2" width="1.4" height="1.6"><feDropShadow dx="0" dy="24" stdDeviation="25" floodColor="#000000" floodOpacity=".6"/></filter>
    </defs>
    <rect width="1080" height="960" fill="#11151D"/>
    <ellipse cx="540" cy="587" rx="770" ry="600" fill="url(#v3-studio-glow)"/>
    <g transform={`translate(0 ${22 * (1 - entry)})`} opacity={entry}>
      <rect x="58" y="74" width="86" height="86" rx="22" fill="#FFFFFF"/>
      <foreignObject x="72" y="88" width="58" height="58"><Img src={asset('github-invertocat-black.svg')} style={{width: '100%', height: '100%', display: 'block', objectFit: 'contain'}}/></foreignObject>
      <text x="178" y="152" fill="#FFFFFF" fontSize="111" fontWeight="850" letterSpacing="-6">MiroFish</text>
      <text x="182" y="202" fill="#B9C8DF" fontSize="31" fontWeight="550" letterSpacing=".3">Open-source simulation</text>
    </g>
    <g transform={`translate(540 517) scale(${.92 + .08 * display}) rotate(${-1.4 * (1 - display)}) translate(-540 -517)`} opacity={fade(frame, 7)}>
      <rect x="44" y="234" width="992" height="564" rx="21" fill="#000000" filter="url(#v3-studio-shadow)"/>
      <foreignObject x="52" y="242" width="976" height="548">
        <div style={{position: 'relative', width: '100%', height: '100%', borderRadius: 13, overflow: 'hidden', background: '#FFFFFF'}}>
          <Img src={asset('mirofish-screenshot-2.png')} style={{display: 'block', width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 20%', transform: `scale(${1 + focus * .10}) translateX(${-focus * 12}px)`, transformOrigin: '29% 46%'}}/>
        </div>
      </foreignObject>
      <rect x="48" y="238" width="984" height="556" rx="18" fill="none" stroke="#8A9EBB" strokeOpacity=".5" strokeWidth="2"/>
    </g>
    <g transform={`translate(0 ${(1 - download) * 35})`} opacity={fade(frame, 59)}>
      <rect x="72" y="831" width="75" height="75" rx="20" fill="#386DFF"/>
      <g transform={`translate(109 866) translate(0 ${-5 * (1 - download)})`} fill="none" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M0-17V11M-11 1L0 13L11 1M-18 19H18"/>
      </g>
      <text x="174" y="889" fill="#FFFFFF" fontSize="58" fontWeight="750" letterSpacing="-2">Free download</text>
    </g>
  </svg>;
};

const PaperObject: React.FC<{frame: number; fps: number; at: number; x: number; y: number; angle: number; children: React.ReactNode}> = ({frame, fps, at, x, y, angle, children}) => {
  const p = clamp(arrive(frame, fps, at));
  return <g transform={`translate(${x - 65 * (1 - p)} ${y - 75 * (1 - p)}) rotate(${angle - 8 * (1 - p)}) scale(${.88 + .12 * p})`} opacity={fade(frame, at, 5)}>{children}</g>;
};

export const MiroInputCollageV3: React.FC<VisualProps> = ({frame, fps}) => {
  const screen = clamp(arrive(frame + 12, fps));
  const path = clamp((frame - 24) / 83);
  return <svg viewBox="0 0 1080 960" style={{display: 'block', width: '100%', height: '100%'}} role="img" aria-label="Launch page, advertisement, product and offer feed the actual MiroFish upload screen">
    <defs>
      <filter id="v3-paper-shadow" x="-.5" y="-.5" width="2" height="2"><feDropShadow dx="3" dy="13" stdDeviation="11" floodColor="#554632" floodOpacity=".22"/></filter>
      <pattern id="v3-paper-grain" width="31" height="29" patternUnits="userSpaceOnUse"><path d="M4 6h2M22 19h1M12 27h2" stroke="#6D5A3C" strokeOpacity=".07" strokeWidth="1"/></pattern>
      <marker id="v3-paper-arrow" viewBox="0 0 20 20" refX="16" refY="10" markerWidth="5" markerHeight="5" orient="auto"><path d="M3 3L17 10L3 17" fill="none" stroke="#263538" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></marker>
    </defs>
    <rect width="1080" height="960" fill="#EDE6D8"/>
    <rect width="1080" height="960" fill="url(#v3-paper-grain)"/>
    <text x="62" y="103" fill="#243135" fontSize="68" fontWeight="800" letterSpacing="-3">Start with your…</text>
    <path d="M214 649C246 849 477 921 703 824" pathLength="1" stroke="#263538" strokeWidth="4" fill="none" strokeDasharray="1" strokeDashoffset={1 - path} markerEnd={path > .95 ? 'url(#v3-paper-arrow)' : undefined}/>

    <g transform={`translate(${12 * (1 - screen)} ${28 * (1 - screen)})`} opacity={screen}>
      <g transform="translate(580 502) rotate(3)">
        <rect x="-14" y="-16" width="455" height="344" rx="5" fill="#FFFFFF" filter="url(#v3-paper-shadow)"/>
        <text x="10" y="34" fill="#243135" fontSize="43" fontWeight="800" letterSpacing="-2">MiroFish</text>
        <foreignObject x="0" y="60" width="430" height="247">
          <div style={{width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: '#FFFFFF'}}>
            <Img src={asset('mirofish-screenshot-1.png')} style={{display: 'block', position: 'absolute', left: -553, top: -445, width: 1230, maxWidth: 'none', height: 'auto'}}/>
          </div>
        </foreignObject>
      </g>
      <path d="M899 493L974 500L971 525L896 518Z" fill="#C4D6CF" opacity=".9"/>
    </g>

    <PaperObject frame={frame} fps={fps} at={0} x={92} y={207} angle={-8}>
      <path d="M0 0H312L323 374L7 383Z" fill="#FFFCF5" stroke="#D1C7B3" strokeWidth="1.5" filter="url(#v3-paper-shadow)"/>
      <path d="M103-12H217V15H103Z" fill="#F9D65A" opacity=".82"/>
      <text x="26" y="65" fill="#243135" fontSize="43" fontWeight="800" letterSpacing="-1.8">Launch page</text>
      <path d="M27 92H291" stroke="#243135" strokeWidth="3"/>
      <rect x="26" y="118" width="269" height="155" rx="2" fill="#C3D7D0"/>
      <circle cx="228" cy="153" r="24" fill="#D49B72"/>
      <path d="M30 268L120 151L193 267M160 268L218 203L292 268" fill="#597B70"/>
      <path d="M26 299H214M26 319H271" stroke="#61726A" strokeWidth="8"/>
      <rect x="26" y="343" width="121" height="15" fill="#243135"/>
    </PaperObject>

    <PaperObject frame={frame} fps={fps} at={45} x={484} y={178} angle={7}>
      <path d="M0 0H270V276L254 282L238 276L222 282L206 276L190 282L174 276L158 282L142 276L126 282L110 276L94 282L78 276L62 282L46 276L30 282L14 276L0 282Z" fill="#356CA3" filter="url(#v3-paper-shadow)"/>
      <text x="26" y="100" fill="#FFFBEA" fontSize="98" fontWeight="850" letterSpacing="-5">Ad</text>
      <path d="M167 119L197 138L232 127L228 162L253 187L220 201L211 235L181 216L146 225L151 190L126 165L159 151Z" fill="#F5CF69"/>
      <path d="M28 153H99M28 175H112M28 197H81" stroke="#DCE8E8" strokeWidth="9"/>
      <path d="M19 253H250" stroke="#F6F1DD" strokeWidth="2"/>
    </PaperObject>

    <PaperObject frame={frame} fps={fps} at={65} x={378} y={527} angle={-7}>
      <path d="M0 35L102 0L225 40L124 80Z" fill="#DBC098" stroke="#7A644E" strokeWidth="1.5"/>
      <path d="M0 35L124 80V219L0 170Z" fill="#BE976C" stroke="#7A644E" strokeWidth="1.5" filter="url(#v3-paper-shadow)"/>
      <path d="M124 80L225 40V180L124 219Z" fill="#A47D58" stroke="#7A644E" strokeWidth="1.5"/>
      <path d="M67 12L99 1L220 42L193 53Z" fill="#EBE0C4"/>
      <path d="M28 94L213 99L207 166L21 162Z" fill="#F8F0DC"/>
      <text x="38" y="143" fill="#243135" fontSize="40" fontWeight="800" letterSpacing="-1.5">Product</text>
    </PaperObject>

    <PaperObject frame={frame} fps={fps} at={90} x={82} y={659} angle={-6}>
      <path d="M0 0H252V16Q229 30 252 45V76Q229 90 252 106V146H0V109Q23 92 0 76V45Q23 28 0 15Z" fill="#F8D65D" filter="url(#v3-paper-shadow)"/>
      <path d="M207 11V134" stroke="#826821" strokeWidth="2" strokeDasharray="5 7"/>
      <text x="25" y="97" fill="#243135" fontSize="66" fontWeight="850" letterSpacing="-3">Offer</text>
    </PaperObject>
  </svg>;
};
