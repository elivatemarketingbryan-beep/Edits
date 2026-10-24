import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { interpolate } from "../lib/interp";
import { clamp, easeOut, prog, springAt, stepped } from "../lib/anim";
import { buildPhrases } from "../lib/captions";
import { useFx } from "../lib/context";
import { FONT, measureText } from "../lib/fonts";
import { ClipVideo, MatteVideo } from "../lib/media";
import { makeFx } from "../lib/shell";
import { handEllipse, jitter, linePath, loops, rnd, smoothPath, zigzag, type Pt } from "../lib/sketch";

type Chip = { bg: string; fg: string; font: string; weight: number; italic?: boolean };
const CHIPS: Chip[] = [
  { bg: "#2347C6", fg: "#FFFFFF", font: FONT.black, weight: 400 },
  { bg: "#F7F4ED", fg: "#141414", font: FONT.didone, weight: 700 },
  { bg: "#FFFFFF", fg: "#D3262E", font: FONT.didone, weight: 700 },
  { bg: "#141414", fg: "#F3E35A", font: FONT.typewriter, weight: 700 },
  { bg: "#F3E35A", fg: "#141414", font: FONT.black, weight: 400 },
  { bg: "#DAD5C8", fg: "#141414", font: FONT.typewriter, weight: 700 },
  { bg: "#E9473F", fg: "#FFFFFF", font: FONT.sans, weight: 900 },
  { bg: "#FFFFFF", fg: "#141414", font: FONT.display, weight: 800, italic: true },
];
const familyOf = (f: string) => f.split(",")[0];

type LaidChip = { ch: string; x: number; y: number; w: number; h: number; size: number; style: Chip; rot: number; clip: string };

/** Lay out ransom-note chips for `text` starting at (x, y) (top-left), returns chips + bounding box. */
function layoutChips(text: string, size: number, seed: string, palette: Chip[]): { chips: LaidChip[]; w: number; h: number } {
  const chips: LaidChip[] = [];
  let x = 0;
  let prev = -1;
  const chars = [...text];
  chars.forEach((ch, i) => {
    if (ch === " ") {
      x += size * 0.35;
      return;
    }
    let pick = Math.floor(rnd(`${seed}p${i}`) * palette.length);
    if (pick === prev) pick = (pick + 1) % palette.length;
    prev = pick;
    const style = palette[pick];
    const s = size * rnd(`${seed}s${i}`, 0.9, 1.1);
    const font = `${style.italic ? "italic " : ""}${style.weight} ${s}px ${familyOf(style.font)}`;
    const tw = measureText(ch, font);
    const padX = s * 0.16, padY = s * 0.08;
    const w = tw + padX * 2, h = s * 1.05 + padY;
    const c = (k: string) => `${rnd(`${seed}${k}${i}`, 0, 7).toFixed(1)}%`;
    const clip = `polygon(${c("a")} ${c("b")}, calc(100% - ${c("c")}) 0%, 100% ${c("d")}, calc(100% - ${c("e")}) 100%, ${c("f")} calc(100% - ${c("g")}), 0% ${c("h")})`;
    chips.push({ ch, x, y: rnd(`${seed}y${i}`, -0.07, 0.07) * size, w, h, size: s, style, rot: rnd(`${seed}r${i}`, -7, 7), clip });
    x += w + size * rnd(`${seed}g${i}`, -0.04, 0.05);
  });
  return { chips, w: x, h: size * 1.15 };
}

const PaperCut: React.FC = () => {
  const frame = useCurrentFrame();
  const fx = useFx();
  const { cfg, subject, width: W, height: H, dur, clip } = fx;
  const k = W / 1080;
  const step = stepped(frame, Math.max(1, cfg.boilEvery as number));
  const show = (cfg.elements ?? {}) as Record<string, boolean>;
  const col = cfg.colors as Record<string, string>;

  // ---------- text ----------
  const [headline, subline] = useMemo(() => {
    let head = String(cfg.headline ?? "auto");
    let sub = String(cfg.subline ?? "auto");
    if (head === "auto" || sub === "auto") {
      const num = fx.words.map((w) => w.text.replace(/[.,!?;:]+$/, "")).find((t) => /\d/.test(t) && t.length <= 6);
      // strongest words: long, proper nouns (capitalised mid-sentence) favoured, no contractions / -ly adverbs
      const emph = buildPhrases(fx.words, { ...fx.captions, emphasis: "auto" })
        .flatMap((p) => p.words.filter((w) => w.emph))
        .map((w) => w.display.replace(/[^\p{L}\p{N}%$']/gu, ""))
        .filter((t) => t.length >= 3 && t.length <= 9 && !t.includes("'"))
        .map((t, i) => ({ t: t.toUpperCase(), score: t.length + (/^[A-Z]/.test(t) && i > 0 ? 3 : 0) - (/ly$/i.test(t) ? 4 : 0) }))
        .sort((a, b) => b.score - a.score)
        .map((x) => x.t);
      const autoHead = num ? num.toUpperCase() : emph[0] ?? "WOW";
      if (head === "auto") head = autoHead;
      if (sub === "auto") sub = emph.find((t) => t !== head && t !== autoHead) ?? "";
    }
    return [head, sub];
  }, [cfg.headline, cfg.subline, fx.words, fx.captions]);

  const palette = CHIPS;
  const headMax = W * (cfg.headlineWidth as number);
  const baseSize = useMemo(() => {
    const probe = layoutChips(headline, 100, "probe", palette).w;
    return Math.min((cfg.headlineSize as number) * k, (100 * headMax) / Math.max(1, probe));
  }, [headline, headMax, k, cfg.headlineSize, palette]);
  const head = useMemo(() => layoutChips(headline, baseSize, `h${headline}`, palette), [headline, baseSize, palette]);
  const subSize = baseSize * (cfg.sublineScale as number);
  const sub = useMemo(() => layoutChips(subline, subSize, `s${subline}`, palette), [subline, subSize, palette]);

  const align = cfg.headlineAlign as string;
  const hx = align === "center" ? W / 2 - head.w / 2 : (cfg.headlineX as number) * W;
  const hy = (cfg.headlineY as number) * H - head.h / 2;
  const sx = hx + head.w / 2 - sub.w / 2;
  const sy = hy + head.h + baseSize * (cfg.circle ? 0.34 : 0.12);

  // ---------- timing ----------
  const t0 = fx.t(cfg.headlineAt, 0.35);
  const stagger = cfg.stagger as number;
  const headDone = t0 + head.chips.length * stagger + 4;
  const ringAt = cfg.circle ? headDone + 2 : headDone;
  const ringFrames = 12;
  const subAt = cfg.sublineAt !== null && cfg.sublineAt !== undefined ? fx.t(cfg.sublineAt) : ringAt + (cfg.circle ? ringFrames : 0) + 2;

  // ---------- intro / exit ----------
  const intro = prog(frame, 0, 8, easeOut);
  const endsEarly = fx.offset + dur < clip.durationInFrames - 1;
  const outro = endsEarly ? interpolate(frame, [dur - 8, dur - 1], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1;
  // hard cut in (the pieces animate themselves), quick fade back to the footage at the end
  const collageA = outro;

  // ---------- sticker placement ----------
  const [bx0, , bx1, by1] = subject.box;
  const bottomCut = by1 >= H - 6;
  const scale = cfg.stickerScale === "auto"
    ? clamp(((1 - (cfg.headTopTarget as number)) * H) / Math.max(1, (bottomCut ? H : by1) - subject.headTop), 0.5, 1)
    : (cfg.stickerScale as number);
  const anchorX = (bx0 + bx1) / 2;
  const anchorY = bottomCut ? H : by1;
  const targetX = (cfg.stickerX as number) * W;
  const targetY = bottomCut ? H + 20 * k : H * 0.97;
  const slap = springAt(frame, fx.fps, 2, { damping: 13, stiffness: 190 });
  const stickerScale = scale * (1.12 - 0.12 * slap);
  const stickerRot = (cfg.stickerRotate as number) + (1 - slap) * -4;

  // ---------- scribbles ----------
  const J = (pts: Pt[], amp: number, seed: string) => jitter(pts, amp * k, step, seed);
  const crayonW = 15 * k;
  const blue = useMemo(() => zigzag(0.07 * W, 0.075 * H, 0.82 * W, 0.29 * H, 42, "blue", true, 1.6, 0.11), [W, H]);
  const blue2 = useMemo(() => zigzag(0.1 * W, 0.09 * H, 0.76 * W, 0.26 * H, 34, "blue2", true, -1.2, 0.12), [W, H]);
  const navy = useMemo(() => zigzag(0.6 * W, 0.45 * H, 0.32 * W, 0.17 * H, 24, "navy", true, 1.4, 0.1), [W, H]);
  const pink = useMemo(() => zigzag(0.72 * W, 0.665 * H, 0.2 * W, 0.095 * H, 16, "pink", true, 1.4, 0.1), [W, H]);
  const torn = useMemo(() => {
    // torn yellow paper: jagged top/bottom edges, bleeding off the right side
    const pts: Pt[] = [];
    const x0 = 0.4 * W, x1 = 1.04 * W, y0 = 0.425 * H, y1 = 0.655 * H;
    const n = 22;
    for (let i = 0; i <= n; i++) pts.push([x0 + ((x1 - x0) * i) / n, y0 + rnd(`tt${i}`, -0.012, 0.012) * H + (i % 2 ? 6 : -4) * k]);
    for (let i = 0; i <= 10; i++) pts.push([x1, y0 + ((y1 - y0) * i) / 10]);
    for (let i = n; i >= 0; i--) pts.push([x0 + ((x1 - x0) * i) / n, y1 + rnd(`tb${i}`, -0.014, 0.014) * H + (i % 2 ? -5 : 5) * k]);
    for (let i = 10; i >= 0; i--) pts.push([x0 + rnd(`tl${i}`, -0.02, 0.02) * W, y0 + ((y1 - y0) * i) / 10]);
    return pts;
  }, [W, H]);

  const drawIn = (delay: number, frames = 7) => prog(frame, delay, frames, easeOut);
  const dash = (p: number) => (p < 1 ? { pathLength: 1, strokeDasharray: "1 1", strokeDashoffset: 1 - p } : {});

  const mark = (x: number, y: number, s: number, type: "x" | "*", color: string, seed: string) => {
    const lines: Pt[][] = type === "x"
      ? [[[x - s, y - s], [x + s, y + s]], [[x + s, y - s], [x - s, y + s]]]
      : [[[x - s, y], [x + s, y]], [[x - s * 0.6, y - s * 0.8], [x + s * 0.6, y + s * 0.8]], [[x + s * 0.6, y - s * 0.8], [x - s * 0.6, y + s * 0.8]]];
    return lines.map((l, i) => <path key={`${seed}${i}`} d={linePath(J(l, 2, seed + i))} stroke={color} strokeWidth={6 * k} strokeLinecap="round" fill="none" />);
  };

  // ---------- chips ----------
  const renderChips = (lay: { chips: LaidChip[] }, ox: number, oy: number, at: number, seed: string) =>
    lay.chips.map((c, i) => {
      const start = at + i * stagger;
      if (frame < start) return null;
      const sp = springAt(frame, fx.fps, start, { damping: 11, stiffness: 220, mass: 0.6 });
      const wob = (rnd(`${seed}w${i}${step}`) - 0.5) * 1.4;
      return (
        <div
          key={`${seed}${i}`}
          style={{
            position: "absolute", left: ox + c.x, top: oy + c.y, width: c.w, height: c.h,
            transform: `rotate(${c.rot * (1 + (1 - sp) * 1.5) + wob}deg) scale(${1.45 - 0.45 * sp})`,
            opacity: clamp(sp * 3), filter: "drop-shadow(0 4px 5px rgba(0,0,0,.28))",
          }}
        >
          <div style={{
            width: "100%", height: "100%", background: c.style.bg, clipPath: c.clip, display: "flex", alignItems: "center", justifyContent: "center",
            color: c.style.fg, fontFamily: c.style.font, fontWeight: c.style.weight, fontStyle: c.style.italic ? "italic" : "normal", fontSize: c.size, lineHeight: 1,
          }}>
            <span style={{ transform: `translateY(${c.size * 0.04}px)` }}>{c.ch}</span>
          </div>
        </div>
      );
    });

  const ring = cfg.circle ? handEllipse(hx + head.w / 2, hy + head.h / 2 + baseSize * 0.02, head.w / 2 + baseSize * 0.42, head.h / 2 + baseSize * 0.2, "ring") : null;
  const ringP = prog(frame, ringAt, ringFrames, easeOut);

  return (
    <AbsoluteFill>
      <ClipVideo />
      <AbsoluteFill style={{ opacity: collageA, transform: `scale(${1 + (1 - outro) * 0.04})` }}>
        {/* paper */}
        <AbsoluteFill style={{ background: col.paper }} />
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <filter id="paperGrain">
              <feTurbulence type="fractalNoise" baseFrequency={0.9 / k} numOctaves={3} seed={7} />
              <feColorMatrix type="matrix" values="0 0 0 0 0.35  0 0 0 0 0.32  0 0 0 0 0.28  0 0 0 0.09 0" />
            </filter>
            <filter id="crayon" x="-5%" y="-5%" width="110%" height="110%">
              <feTurbulence type="fractalNoise" baseFrequency={1.1 / k} numOctaves={2} seed={step % 31} result="n" />
              <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -2.4 0 0 0 1.95" result="m" />
              <feComposite in="SourceGraphic" in2="m" operator="in" />
            </filter>
            <filter id="tornShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx={0} dy={5 * k} stdDeviation={6 * k} floodOpacity={0.22} />
            </filter>
            <pattern id="grid" width={38 * k} height={38 * k} patternUnits="userSpaceOnUse">
              <path d={`M ${38 * k} 0 L 0 0 0 ${38 * k}`} fill="none" stroke={col.grid} strokeWidth={1.4 * k} />
            </pattern>
            <linearGradient id="gridFade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fff" stopOpacity="0" />
              <stop offset="0.25" stopColor="#fff" stopOpacity="1" />
            </linearGradient>
            <mask id="gridMask">
              <rect x={0.5 * W} y={0.6 * H} width={0.5 * W} height={0.4 * H} fill="url(#gridFade)" />
            </mask>
          </defs>
          <rect width={W} height={H} filter="url(#paperGrain)" />
          {show.grid !== false && <rect width={W} height={H} fill="url(#grid)" mask="url(#gridMask)" opacity={0.75} />}
          {show.blueScribble !== false && (
            <g filter="url(#crayon)" opacity={0.9}>
              <path d={linePath(J(blue, 5, "b"))} fill="none" stroke={col.blue} strokeWidth={crayonW} strokeLinejoin="round" strokeLinecap="round" {...dash(drawIn(0, 9))} />
              <path d={linePath(J(blue2, 5, "b2"))} fill="none" stroke={col.blueDark} strokeWidth={crayonW * 0.7} strokeLinejoin="round" strokeLinecap="round" opacity={0.7} {...dash(drawIn(3, 9))} />
            </g>
          )}
          {show.tornPaper !== false && (
            <g style={{ transform: `translateX(${(1 - intro) * 60 * k}px)` }}>
              <path d={smoothPath(J(torn, 1.2, "tp"), true)} fill={col.yellow} filter="url(#tornShadow)" />
              <g filter="url(#crayon)">
                <path d={linePath(J(navy, 4, "n"))} fill="none" stroke={col.navy} strokeWidth={crayonW * 1.05} strokeLinejoin="round" strokeLinecap="round" {...dash(drawIn(4, 8))} />
              </g>
              {Array.from({ length: 7 }, (_, i) => {
                const x = 0.71 * W + i * 0.038 * W;
                const y = 0.468 * H;
                return <path key={i} d={linePath(J([[x, y - 14 * k], [x + 9 * k, y + 14 * k]], 2, `t${i}`))} stroke={col.red} strokeWidth={5 * k} strokeLinecap="round" />;
              })}
            </g>
          )}
          {show.pinkScribble !== false && (
            <g filter="url(#crayon)">
              <path d={linePath(J(pink, 4, "p"))} fill="none" stroke={col.pink} strokeWidth={crayonW * 0.95} strokeLinejoin="round" strokeLinecap="round" {...dash(drawIn(6, 7))} />
            </g>
          )}
          {show.marks !== false && (
            <g opacity={drawIn(5, 4)}>
              {mark(0.11 * W, 0.432 * H, 14 * k, "x", col.red, "m1")}
              {mark(0.185 * W, 0.437 * H, 13 * k, "*", "#161616", "m2")}
              {mark(0.84 * W, 0.628 * H, 13 * k, "x", "#161616", "m3")}
              {mark(0.9 * W, 0.618 * H, 13 * k, "x", "#161616", "m4")}
            </g>
          )}
          {show.loops !== false && (
            <path d={smoothPath(J(loops(0.74 * W, 0.795 * H, 0.18 * W, 34 * k, 5), 1.5, "l"), false)} fill="none" stroke="#161616" strokeWidth={4.5 * k} strokeLinecap="round" {...dash(drawIn(7, 8))} />
          )}
        </svg>

        {/* the speaker as a paper sticker */}
        <svg width={0} height={0} style={{ position: "absolute" }}>
          <defs>
            <filter id="sticker" x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
              <feMorphology in="SourceAlpha" operator="dilate" radius={(cfg.borderWidth as number) * k} result="dil" />
              <feTurbulence type="fractalNoise" baseFrequency={0.03 / k} numOctaves={2} seed={step % 13} result="tn" />
              <feDisplacementMap in="dil" in2="tn" scale={(cfg.tornEdge as number) * k} xChannelSelector="R" yChannelSelector="G" result="torn" />
              <feComponentTransfer in="torn" result="hard">
                <feFuncA type="linear" slope={3} intercept={-0.6} />
              </feComponentTransfer>
              <feFlood floodColor={col.border} result="white" />
              <feComposite in="white" in2="hard" operator="in" result="border" />
              <feMerge>
                <feMergeNode in="border" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        </svg>
        <AbsoluteFill
          style={{
            transform: `translate(${targetX - anchorX}px, ${targetY - anchorY}px) rotate(${stickerRot}deg) scale(${stickerScale})`,
            transformOrigin: `${anchorX}px ${anchorY}px`,
            filter: `drop-shadow(0 ${12 * k}px ${16 * k}px rgba(0,0,0,.3))`,
          }}
        >
          <AbsoluteFill style={{ filter: "url(#sticker)" }}>
            <MatteVideo />
          </AbsoluteFill>
        </AbsoluteFill>

        {/* ransom-note headline, ring and subline */}
        <AbsoluteFill>
          {renderChips(head, hx, hy, t0, "h")}
          {ring && ringP > 0 && (
            <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
              <path d={smoothPath(J(ring, 1.5, "ring"), false)} fill="none" stroke={col.ring} strokeWidth={7 * k} strokeLinecap="round" {...dash(ringP)} />
            </svg>
          )}
          {subline ? renderChips(sub, sx, sy, subAt, "s") : null}
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default makeFx(PaperCut);
