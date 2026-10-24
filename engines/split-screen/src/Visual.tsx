import React from 'react';
import {Img, staticFile} from 'remotion';
import {arrive, clamp, fitType, reveal} from './motion';
import type {VisualProps} from './types';
import {CustomVisual} from './custom/registry';

const itemTitle = (item: string | {title: string}) => typeof item === 'string' ? item : item.title;
const inkOn = (hex: string) => {
  const channels = [1, 3, 5].map(offset => parseInt(hex.slice(offset, offset + 2), 16) / 255)
    .map(value => value <= .04045 ? value / 12.92 : Math.pow((value + .055) / 1.055, 2.4));
  return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722 > .18 ? '#111111' : '#FFFFFF';
};

export const Visual: React.FC<VisualProps> = (p) => {
  const {beat, brand: b, frame, fps, height} = p;
  const v = beat.visual;
  const border = `1px solid ${b.muted}45`;
  const card: React.CSSProperties = {background: b.surface, border, borderRadius: 24, padding: '28px 30px'};
  if (v.type === 'custom') return <CustomVisual {...p} />;
  if (v.type === 'word') {
    const word = v.word || beat.headline;
    const progress = arrive(frame, fps, 5);
    return <div style={{height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 28}}>
      <div style={{fontSize: fitType(word, 136, 12, 66), lineHeight: 0.98, fontWeight: 850, letterSpacing: -6, color: b.text, ...reveal(frame, fps, 4)}}>{word}</div>
      <div style={{width: `${progress * 65}%`, height: 9, background: b.accent, borderRadius: 8}} />
      {v.subtext && <div style={{fontSize: 32, lineHeight: 1.35, color: b.muted, maxWidth: 760, ...reveal(frame, fps, 12)}}>{v.subtext}</div>}
    </div>;
  }
  if (v.type === 'steps') return <div style={{display: 'flex', flexDirection: 'column', gap: 18, justifyContent: 'center', height: '100%'}}>
    {v.items.map((item, i) => <div key={i} style={{...card, display: 'flex', gap: 24, alignItems: 'center', ...reveal(frame, fps, i * 7)}}>
      <div style={{width: 54, height: 54, flexShrink: 0, borderRadius: 16, background: b.accent, color: inkOn(b.accent), display: 'grid', placeItems: 'center', fontSize: 28, fontWeight: 850}}>{i + 1}</div>
      <div><div style={{fontSize: fitType(itemTitle(item), 38, 26), fontWeight: 700, letterSpacing: -1}}>{itemTitle(item)}</div>
      {typeof item !== 'string' && item.detail && <div style={{fontSize: 26, color: b.muted, marginTop: 7}}>{item.detail}</div>}</div>
    </div>)}
  </div>;
  if (v.type === 'comparison') return <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignContent: 'center', height: '100%'}}>
    {[v.left, v.right].map((side, i) => <div key={i} style={{...card, minHeight: 280, borderTop: `5px solid ${i ? b.accent : b.muted}`, ...reveal(frame, fps, i * 9)}}>
      <div style={{fontSize: fitType(side.title, 42, 14), letterSpacing: -1, fontWeight: 800, marginBottom: 34}}>{side.title}</div>
      {side.items.map((text, j) => <div key={j} style={{fontSize: fitType(text, 29, 24), lineHeight: 1.3, marginTop: 26, display: 'flex', gap: 14, ...reveal(frame, fps, 10 + j * 8 + i * 5)}}><span style={{color: b.text}}> {i ? '↗' : '—'} </span><span>{text}</span></div>)}
    </div>)}
  </div>;
  if (v.type === 'diagram') {
    const nodes = v.nodes.map((node, i) => ({...node, x: node.x ?? (v.nodes.length === 1 ? .5 : v.nodes.length <= 3 ? .17 + i * .66 / (v.nodes.length - 1) : .25 + (i % 2) * .5), y: node.y ?? (v.nodes.length <= 3 ? .5 : .18 + Math.floor(i / 2) * .64 / Math.max(1, Math.ceil(v.nodes.length / 2) - 1))}));
    return <svg viewBox="0 0 900 500" style={{width: '100%', height: '100%', overflow: 'visible'}}>
      <defs><marker id={`arrow-${beat.id}`} markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto"><path d="M0 0L10 5L0 10" fill="none" stroke={b.accent} strokeWidth="1.8" /></marker></defs>
      {v.edges.map((edge, i) => {const a = nodes.find(n => n.id === edge.from)!; const z = nodes.find(n => n.id === edge.to)!; const progress = clamp(arrive(frame, fps, 12 + i * 6));
        const dx = (z.x - a.x) * 900, dy = (z.y - a.y) * 500, dist = Math.hypot(dx, dy) || 1;
        const ax = a.x * 900 + dx / dist * 112, ay = a.y * 500 + dy / dist * 60;
        const zx = z.x * 900 - dx / dist * 112, zy = z.y * 500 - dy / dist * 60;
        return <g key={i} opacity={clamp((frame - 10 - i * 6) / 8)}><line x1={ax} y1={ay} x2={ax + (zx - ax) * progress} y2={ay + (zy - ay) * progress} stroke={b.accent} strokeWidth="4" markerEnd={`url(#arrow-${beat.id})`} />{edge.label && <text x={(ax + zx) / 2} y={(ay + zy) / 2 - 24} fill={b.muted} textAnchor="middle" fontSize="21">{edge.label}</text>}</g>;
      })}
      {nodes.map((n, i) => <g key={n.id} transform={`translate(${n.x * 900} ${n.y * 500 + (1 - arrive(frame, fps, i * 5)) * 28})`} opacity={clamp((frame - i * 5) / 8)}>
        <rect x="-105" y="-58" width="210" height="116" rx="22" fill={b.surface} stroke={i === nodes.length - 1 ? b.accent : b.muted} strokeOpacity=".7" />
        <foreignObject x="-91" y="-46" width="182" height="92"><div style={{height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontSize: fitType(n.label, 30, 15, 21), fontWeight: 750, color: b.text, lineHeight: 1.15}}>{n.label}</div></foreignObject>
      </g>)}
    </svg>;
  }
  if (v.type === 'bars') {
    const max = v.max ?? Math.max(...v.items.map(i => i.value), 1);
    return <div style={{height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 28}}>{v.items.map((item, i) => <div key={i} style={reveal(frame, fps, i * 7)}>
      <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 29, marginBottom: 12}}><span>{item.label}</span><strong>{item.value}{v.unit || ''}</strong></div>
      <div style={{height: 38, background: b.surface, borderRadius: 9, overflow: 'hidden'}}><div style={{height: '100%', width: `${(item.value / max) * 100 * clamp(arrive(frame, fps, 8 + i * 7))}%`, borderRadius: 9, background: b.accent}} /></div>
    </div>)}{v.sourceLabel && <div style={{fontSize: 22, color: b.muted}}>{v.sourceLabel}</div>}</div>;
  }
  if (v.type === 'checklist') return <div style={{height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 18}}>{v.items.map((item, i) => {
    const text = typeof item === 'string' ? item : item.text;
    const checked = typeof item === 'string' || item.checked !== false;
    return <div key={i} style={{...card, display: 'flex', gap: 24, alignItems: 'center', ...reveal(frame, fps, i * 8)}}>
      <div style={{height: 42, width: 42, flexShrink: 0, borderRadius: 12, border: `2px solid ${b.accent}`, background: b.accent, color: inkOn(b.accent), fontSize: 31, display: 'grid', placeItems: 'center'}}>{checked && frame > 12 + i * 8 ? '✓' : ''}</div>
      <span style={{fontSize: fitType(text, 37, 30)}}>{text}</span>
    </div>;
  })}</div>;
  if (v.type === 'quote') return <div style={{height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', ...reveal(frame, fps)}}><div style={{fontFamily: 'Georgia, serif', fontSize: 120, color: b.accent, lineHeight: .8}}>“</div><div style={{fontSize: fitType(v.text, 65, 50, 38), lineHeight: 1.16, letterSpacing: -2, fontWeight: 650}}>{v.text}</div>{v.attribution && <div style={{fontSize: 26, color: b.muted, marginTop: 30}}>— {v.attribution}</div>}</div>;
  if (v.type === 'image') return <div style={{height: '100%', display: 'flex', flexDirection: 'column', gap: 18, ...reveal(frame, fps)}}><Img src={staticFile(v.src)} alt={v.alt || ''} style={{width: '100%', flex: 1, minHeight: 0, maxHeight: height, objectFit: 'contain', borderRadius: 20}} />{v.caption && <div style={{fontSize: 24, color: b.muted}}>{v.caption}</div>}</div>;
  return null;
};
