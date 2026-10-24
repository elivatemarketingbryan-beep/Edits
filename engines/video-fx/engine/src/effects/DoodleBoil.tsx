import React, { useEffect, useMemo, useState } from "react";
import { AbsoluteFill, cancelRender, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import { interpolate } from "../lib/interp";
import { clamp, easeOut, prog, stepped } from "../lib/anim";
import { buildPhrases } from "../lib/captions";
import { useFx } from "../lib/context";
import { ClipVideo } from "../lib/media";
import { makeFx } from "../lib/shell";
import {
  flatToPts, handEllipse, heartPts, jitter, linePath, normals, polyLength, resample, roughRect, smooth, smoothPath, starPts,
  subdivide, wobble, zigzag, type Pt,
} from "../lib/sketch";
import type { TimeRef } from "../lib/time";

type ContourData = { width: number; height: number; fps: number; frames: number[][][] };
type Slot = "left" | "right" | "topLeft" | "topRight" | "aboveHead";
type DoodleType = "heart" | "clapper" | "frame" | "square" | "star" | "arrow" | "sparkle" | "crown" | "swirl" | "circle";
type Doodle = {
  type: DoodleType;
  slot?: Slot;
  x?: number;
  y?: number;
  size?: number;
  rotate?: number;
  color?: string;
  fill?: string | null;
  accent?: string;
  at?: TimeRef;
  until?: TimeRef | null;
};

const AUTO_SEQUENCE: Doodle[] = [
  { type: "heart", slot: "right", fill: "#F58BB4", accent: "#FFE45C" },
  { type: "frame", slot: "left" },
  { type: "clapper", slot: "left", fill: "#F58BB4", accent: "#FFE45C" },
  { type: "square", slot: "right" },
  { type: "star", slot: "right", fill: "#FFE45C" },
  { type: "sparkle", slot: "left", accent: "#FFE45C" },
  { type: "crown", slot: "aboveHead", fill: "#FFE45C" },
  { type: "swirl", slot: "right" },
];

const DEFAULT_SIZE: Partial<Record<DoodleType, number>> = { clapper: 0.21, heart: 0.16, frame: 0.19, square: 0.16, crown: 0.17, sparkle: 0.13, swirl: 0.14 };

function useContours(src: string | null): ContourData | null {
  const [data, setData] = useState<ContourData | null>(null);
  const [handle] = useState(() => (src ? delayRender("Loading outline contours") : null));
  useEffect(() => {
    if (!src || handle === null) return;
    fetch(staticFile(src))
      .then((r) => r.json())
      .then((j: ContourData) => {
        setData(j);
        continueRender(handle);
      })
      .catch((e) => cancelRender(e));
  }, [src, handle]);
  return data;
}

type Stroke = { d: string; w: number; color: string; phase: "outline" | "fill" | "accent"; opacity?: number; clip?: string };

/** Local shape strokes, centred on (0,0), unit half-size s. */
function shapeStrokes(dd: Doodle, s: number, step: number, seed: string, amp: number, id: string, towardHead: number): { strokes: Stroke[]; clipPath?: string } {
  const color = dd.color ?? "#FFFFFF";
  const fill = dd.fill === undefined ? null : dd.fill;
  const accent = dd.accent ?? "#FFE45C";
  const J = (pts: Pt[], k = 1, sd = "") => jitter(pts, amp * k, step, seed + sd);
  const P = (pts: Pt[], closed = false) => smoothPath(pts, closed);
  const W = Math.max(4, s * 0.075);
  const strokes: Stroke[] = [];
  let clipPath: string | undefined;
  // dense crayon hatching: two offset zigzag passes, ~1 stroke per 7% of the shape width
  const scribble = (x: number, y: number, w: number, h: number, _n: number, col: string, vertical = true) => {
    const n = Math.max(8, Math.round((vertical ? w : h) / (s * 0.13)));
    strokes.push({ d: linePath(J(zigzag(x, y, w, h, n, seed + "z", vertical, 0.6), 0.8, "z")), w: W * 0.75, color: col, phase: "fill", clip: `url(#${id}-clip)` });
    strokes.push({ d: linePath(J(zigzag(x + w * 0.03, y, w, h, n - 1, seed + "y", vertical, 0.6), 0.8, "y")), w: W * 0.5, color: col, phase: "fill", clip: `url(#${id}-clip)`, opacity: 0.75 });
  };

  switch (dd.type) {
    case "heart": {
      const h = heartPts(0, s * 0.05, s * 0.95);
      clipPath = P(h, true);
      if (fill) scribble(-s, -s * 0.85, s * 2, s * 1.8, 9, fill);
      strokes.push({ d: P(J(subdivide(h, s * 0.25)), true), w: W, color, phase: "outline" });
      [-62, -30, 2].forEach((a, i) => {
        const r = (a * Math.PI) / 180;
        const p0: Pt = [Math.cos(r) * s * 1.15, Math.sin(r) * s * 1.15 - s * 0.1];
        const p1: Pt = [Math.cos(r) * s * (1.45 + i * 0.05), Math.sin(r) * s * (1.45 + i * 0.05) - s * 0.1];
        strokes.push({ d: P(J([p0, p1], 0.6, `s${i}`)), w: W * 0.8, color: accent, phase: "accent" });
      });
      break;
    }
    case "clapper": {
      const body: Pt[] = [[-s, -s * 0.3], [s, -s * 0.3], [s, s * 0.85], [-s, s * 0.85], [-s, -s * 0.28]];
      clipPath = P(roughRect(-s, -s * 0.78, s * 2, s * 1.63, seed + "c"), true);
      if (fill) scribble(-s * 0.95, -s * 0.75, s * 1.9, s * 1.55, 11, fill);
      strokes.push({ d: P(J(subdivide(body, s * 0.3))), w: W, color, phase: "outline" });
      // hinged clap stick, tilted up
      const a = (-14 * Math.PI) / 180;
      const rot = (p: Pt): Pt => [-s + (p[0] + s) * Math.cos(a) - (p[1] + s * 0.3) * Math.sin(a), -s * 0.3 + (p[0] + s) * Math.sin(a) + (p[1] + s * 0.3) * Math.cos(a)];
      const stick: Pt[] = [[-s, -s * 0.3], [-s, -s * 0.62], [s, -s * 0.62], [s, -s * 0.3]].map((p) => rot(p as Pt));
      strokes.push({ d: P(J(subdivide(stick, s * 0.3), 1, "k")), w: W, color, phase: "outline" });
      for (let i = 0; i < 4; i++) {
        const x0 = -s + s * 0.3 + i * s * 0.45;
        const line = [rot([x0, -s * 0.3]), rot([x0 + s * 0.28, -s * 0.62])];
        strokes.push({ d: P(J(line, 0.7, `st${i}`)), w: W * 0.9, color: accent, phase: "accent" });
      }
      // stripes on the body top
      strokes.push({ d: P(J([[-s, -s * 0.05], [s, -s * 0.05]], 0.7, "bl")), w: W * 0.8, color, phase: "outline" });
      break;
    }
    case "frame":
    case "square": {
      const w = dd.type === "square" ? s * 1.5 : s * 2;
      const h = dd.type === "square" ? s * 1.5 : s * 1.3;
      const r = roughRect(-w / 2, -h / 2, w, h, seed + "r");
      clipPath = P(r, true);
      if (fill) scribble(-w / 2, -h / 2, w, h, 9, fill);
      strokes.push({ d: P(J(subdivide(r, s * 0.35))), w: W, color, phase: "outline" });
      break;
    }
    case "star": {
      const st = starPts(0, 0, s);
      clipPath = P(st, true);
      if (fill) scribble(-s, -s, s * 2, s * 2, 10, fill);
      strokes.push({ d: P(J(subdivide(st, s * 0.3)), true), w: W, color, phase: "outline" });
      break;
    }
    case "crown": {
      const c: Pt[] = [[-s, s * 0.45], [-s, -s * 0.35], [-s * 0.5, s * 0.05], [0, -s * 0.6], [s * 0.5, s * 0.05], [s, -s * 0.35], [s, s * 0.45], [-s, s * 0.45]];
      clipPath = P(c, true);
      if (fill) scribble(-s, -s * 0.6, s * 2, s * 1.1, 10, fill);
      strokes.push({ d: P(J(subdivide(c, s * 0.3)), true), w: W, color, phase: "outline" });
      break;
    }
    case "sparkle": {
      const lines: [Pt, Pt][] = [
        [[0, -s], [0, s]], [[-s, 0], [s, 0]], [[-s * 0.5, -s * 0.5], [s * 0.5, s * 0.5]], [[-s * 0.5, s * 0.5], [s * 0.5, -s * 0.5]],
      ];
      lines.forEach((l, i) => strokes.push({ d: P(J(l, 0.7, `l${i}`)), w: i < 2 ? W : W * 0.75, color: i < 2 ? color : accent, phase: i < 2 ? "outline" : "accent" }));
      break;
    }
    case "swirl": {
      const pts: Pt[] = [];
      for (let i = 0; i <= 60; i++) {
        const t = (i / 60) * Math.PI * 4.2;
        const r = s * (0.15 + (0.85 * i) / 60);
        pts.push([Math.cos(t) * r, Math.sin(t) * r]);
      }
      strokes.push({ d: P(J(pts, 0.6)), w: W, color, phase: "outline" });
      break;
    }
    case "circle": {
      strokes.push({ d: P(J(handEllipse(0, 0, s, s * 0.8, seed + "e"), 0.6)), w: W, color, phase: "outline" });
      break;
    }
    case "arrow": {
      // curved shaft from the outside toward the head, head drawn as two strokes
      const pts: Pt[] = [];
      for (let i = 0; i <= 16; i++) {
        const t = i / 16;
        pts.push([-s + 2 * s * t, Math.sin(t * Math.PI) * -s * 0.35]);
      }
      const rot = (p: Pt): Pt => [p[0] * Math.cos(towardHead) - p[1] * Math.sin(towardHead), p[0] * Math.sin(towardHead) + p[1] * Math.cos(towardHead)];
      const shaft = pts.map(rot);
      const tip = rot([s, 0]);
      const h1 = rot([s - s * 0.38, -s * 0.3]);
      const h2 = rot([s - s * 0.42, s * 0.22]);
      strokes.push({ d: P(J(shaft)), w: W, color, phase: "outline" });
      strokes.push({ d: P(J([h1, tip, h2], 0.7, "h")), w: W, color, phase: "accent" });
      break;
    }
  }
  return { strokes, clipPath };
}

const DoodleBoil: React.FC = () => {
  const frame = useCurrentFrame();
  const fx = useFx();
  const { cfg, subject, width, height, fps, dur, clip } = fx;
  const k = width / 1080;
  const data = useContours(clip.contours);
  const boilEvery = Math.max(1, cfg.boilEvery as number);
  const step = stepped(frame, boilEvery);

  // exit when the effect window ends before the clip does
  const endsEarly = fx.offset + dur < clip.durationInFrames - 1;
  const exitA = endsEarly ? interpolate(frame, [dur - 7, dur - 1], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1;

  // ---------- doodle timeline ----------
  const doodles = useMemo(() => {
    const durSec = dur / fps;
    let list: Doodle[] = Array.isArray(cfg.doodles) ? (cfg.doodles as Doodle[]).map((d) => ({ ...d })) : [];
    if (cfg.doodles === "auto" || cfg.doodles === undefined) {
      const emph = buildPhrases(fx.words, { ...fx.captions, emphasis: "auto" })
        .flatMap((p) => p.words.filter((w) => w.emph))
        .map((w) => w.start)
        .filter((s) => s > 0.05 && s < durSec - 0.6);
      const times: number[] = [];
      for (const s of emph) if (!times.length || s - times[times.length - 1] >= (cfg.minGap as number)) times.push(s);
      const want = Math.max(2, Math.min(AUTO_SEQUENCE.length, Math.floor((durSec - 0.4) / (cfg.minGap as number))));
      if (times.length < want) {
        const extra = Array.from({ length: want }, (_, i) => 0.25 + ((durSec - 1.0) * i) / Math.max(1, want - 1));
        for (const e of extra) if (times.every((s) => Math.abs(s - e) > (cfg.minGap as number) * 0.8)) times.push(e);
        times.sort((a, b) => a - b);
      }
      list = times.slice(0, AUTO_SEQUENCE.length).map((s, i) => ({ ...AUTO_SEQUENCE[i], at: s }));
    }
    const out = list.map((d, i) => ({ d, i, start: fx.t(d.at ?? 0.2 + i * 0.6), end: d.until !== undefined && d.until !== null ? fx.t(d.until) : Infinity }));
    // one doodle per slot: a newer doodle in the same slot replaces the older one
    out.forEach((a) => {
      if (!a.d.slot || (a.d.until !== undefined && a.d.until !== null)) return;
      const next = out.filter((b) => b.d.slot === a.d.slot && b.start > a.start).sort((x, y) => x.start - y.start)[0];
      if (next) a.end = next.start;
    });
    return out;
  }, [cfg, fx, fps, dur]);

  // ---------- head geometry for slots ----------
  const cx = subject.centerX;
  const hy = subject.headY;
  const r = clamp((subject.headY - subject.headTop) * 1.15, 50 * k, 260 * k);
  const place = (d: Doodle, size: number): Pt => {
    if (typeof d.x === "number" && typeof d.y === "number") return [d.x * width, d.y * height];
    const half = size / 2;
    let p: Pt;
    switch (d.slot ?? "right") {
      case "left": p = [cx - Math.max(r * 1.9, half + r * 1.15), hy - r * 0.55]; break;
      case "right": p = [cx + Math.max(r * 1.9, half + r * 1.15), hy - r * 0.55]; break;
      case "topLeft": p = [cx - r * 1.3, subject.headTop - half * 0.9]; break;
      case "topRight": p = [cx + r * 1.3, subject.headTop - half * 0.9]; break;
      case "aboveHead": p = [cx, subject.headTop - half * 0.75]; break;
    }
    const m = half * (d.type === "heart" || d.type === "clapper" ? 1.5 : 1.2) + 24 * k; // room for spark lines
    return [clamp(p[0], m, width - m), clamp(p[1], m + 30 * k, height * 0.62)];
  };

  // ---------- outline ----------
  const o = cfg.outline as { enabled: boolean; color: string; width: number; offset: number; wobble: number; double: boolean; drawOn: boolean; at: TimeRef; drawFrames: number };
  const outlinePaths = useMemo(() => {
    if (!data || !o.enabled) return [] as { d: string; len: number; seed: number }[];
    const cf = Math.min(data.frames.length - 1, Math.max(0, fx.offset + frame));
    const polys = data.frames[cf] ?? [];
    const sx = width / data.width, sy = height / data.height;
    const paths: { d: string; len: number; seed: number }[] = [];
    for (const flat of polys) {
      let pts = flatToPts(flat).map(([x, y]) => [x * sx, y * sy] as Pt);
      if (pts.length < 8) continue;
      pts = smooth(resample(pts, 9 * k, true), 2, true, 2);
      const c: Pt = [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];
      const nrm = normals(pts, true, c);
      const edge = 4 * k;
      const onBorder = pts.map(([x, y]) => x < edge || y < edge || x > width - edge || y > height - edge);
      const passes = o.double ? [0, 1] : [0];
      for (const pass of passes) {
        const w = wobble(pts, nrm, o.offset * k + pass * 2.5 * k, (o.wobble + pass * 1.2) * k, step, 75 * k, pass);
        // split into runs that do not lie on the frame border
        const n = w.length;
        const startIdx = onBorder.indexOf(true);
        if (startIdx === -1) {
          paths.push({ d: smoothPath(w, true), len: polyLength(w, true), seed: pass });
          continue;
        }
        let run: Pt[] = [];
        for (let j = 1; j <= n; j++) {
          const idx = (startIdx + j) % n;
          if (onBorder[idx]) {
            if (run.length > 4) paths.push({ d: smoothPath(run, false), len: polyLength(run, false), seed: pass });
            run = [];
          } else run.push(w[idx]);
        }
        if (run.length > 4) paths.push({ d: smoothPath(run, false), len: polyLength(run, false), seed: pass });
      }
    }
    return paths;
  }, [data, o, frame, fx.offset, width, height, k, step]);

  const drawOnP = o.drawOn ? prog(frame, fx.t(o.at), o.drawFrames, easeOut) : 1;

  return (
    <AbsoluteFill>
      <ClipVideo />
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ position: "absolute", inset: 0, opacity: exitA, overflow: "visible" }}>
        <defs>
          <filter id="chalk" x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency={0.75 / k} numOctaves={2} seed={step % 97} result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale={cfg.chalk ? 3.5 * k : 0} xChannelSelector="R" yChannelSelector="G" result="rough" />
            <feColorMatrix in="noise" type="matrix" values={`0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  ${cfg.chalk ? "-2.6 0 0 0 2.15" : "0 0 0 0 1"}`} result="speck" />
            <feComposite in="rough" in2="speck" operator="in" result="chalky" />
            <feDropShadow dx="0" dy={1.5 * k} stdDeviation={2 * k} floodColor="#000" floodOpacity={cfg.shadow as number} />
          </filter>
          {doodles.map(({ d, i }) => {
            const size = (d.size ?? DEFAULT_SIZE[d.type] ?? 0.17) * width;
            const sh = shapeStrokes(d, size / 2, step, `dd${i}`, 2.2 * k, `dd${i}`, 0);
            return sh.clipPath ? (
              <clipPath id={`dd${i}-clip`} key={i}>
                <path d={sh.clipPath} />
              </clipPath>
            ) : null;
          })}
        </defs>
        <g filter="url(#chalk)">
          {outlinePaths.map((p, i) => (
            <path
              key={i}
              d={p.d}
              fill="none"
              stroke={o.color}
              strokeWidth={(p.seed ? o.width * 0.55 : o.width) * k}
              strokeOpacity={p.seed ? 0.75 : 1}
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              strokeDasharray={drawOnP < 1 ? "1 1" : undefined}
              strokeDashoffset={drawOnP < 1 ? 1 - drawOnP : undefined}
            />
          ))}
          {doodles.map(({ d, i, start, end }) => {
            if (frame < start || frame >= end + 6) return null;
            const size = (d.size ?? DEFAULT_SIZE[d.type] ?? 0.17) * width;
            const [px, py] = place(d, size);
            const toward = Math.atan2(hy - py, cx - px);
            const sh = shapeStrokes(d, size / 2, step, `dd${i}`, 2.2 * k, `dd${i}`, toward);
            const drawF = cfg.drawFrames as number;
            const pOut = prog(frame, start, drawF, easeOut);
            const pAcc = prog(frame, start + drawF * 0.7, drawF * 0.6, easeOut);
            const pFill = prog(frame, start + drawF + (cfg.fillDelay as number), drawF * 1.2, easeOut);
            const gone = end === Infinity ? 1 : interpolate(frame, [end, end + 5], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            const pop = 0.88 + 0.12 * prog(frame, start, 6, easeOut);
            const wob = ((step * 7919) % 5) - 2; // -2..2 degrees, changes on boil steps
            const rot = (d.rotate ?? 0) + wob * 0.6;
            return (
              <g key={i} transform={`translate(${px} ${py}) rotate(${rot}) scale(${pop * (0.9 + 0.1 * gone)})`} opacity={gone}>
                {sh.strokes.map((st, j) => {
                  const p = st.phase === "outline" ? pOut : st.phase === "accent" ? pAcc : pFill;
                  if (p <= 0) return null;
                  return (
                    <path
                      key={j}
                      d={st.d}
                      fill="none"
                      stroke={st.color}
                      strokeOpacity={st.opacity ?? 1}
                      strokeWidth={st.w}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      clipPath={st.clip}
                      pathLength={1}
                      strokeDasharray={p < 1 ? "1 1" : undefined}
                      strokeDashoffset={p < 1 ? 1 - p : undefined}
                    />
                  );
                })}
              </g>
            );
          })}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export default makeFx(DoodleBoil);
