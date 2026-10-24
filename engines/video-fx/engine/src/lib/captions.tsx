import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp } from "./anim";
import { FONT } from "./fonts";
import { norm } from "./time";
import type { CaptionConfig, Word } from "./types";

const STOP = new Set(
  "the a an and or but to of in on at for with is are was were be been it its it's this that these those you your you're i i'm we our they their my me so just like do does did can could get got have has had not no if then than as from by about what how all really very going gonna into out up there here when who will would should also more most some any one".split(" "),
);

type PWord = Word & { emph: boolean; display: string };
type Phrase = { words: PWord[]; start: number; end: number };

const cleanText = (s: string) => s.replace(/[.,;:]+$/g, "").replace(/^["“]|["”]$/g, "");

export function buildPhrases(words: Word[], cfg: CaptionConfig): Phrase[] {
  const out: Phrase[] = [];
  let cur: Word[] = [];
  const flush = () => {
    if (cur.length) out.push({ words: cur.map((w) => ({ ...w, emph: false, display: cleanText(w.text) })), start: cur[0].start, end: cur[cur.length - 1].end });
    cur = [];
  };
  for (const w of words) {
    if (cur.length) {
      const prev = cur[cur.length - 1];
      const chars = cur.reduce((s, x) => s + x.text.length + 1, 0) + w.text.length;
      if (w.start - prev.end > 0.45 || cur.length >= cfg.maxWords || chars > cfg.maxChars || /[.?!,;:]$/.test(prev.text)) flush();
    }
    cur.push(w);
  }
  flush();

  const list = Array.isArray(cfg.emphasis) ? new Set(cfg.emphasis.flatMap((e) => e.split(/\s+/)).map(norm)) : null;
  for (const p of out) {
    if (list) {
      p.words.forEach((w) => (w.emph = list.has(norm(w.text))));
    } else if (cfg.emphasis === "auto") {
      let best: PWord | null = null;
      for (const w of p.words) {
        const n = norm(w.text);
        if (STOP.has(n) || n.length < 5) continue;
        if (!best || n.length >= norm(best.text).length) best = w;
      }
      if (best && (p.words.length >= 2 || norm(best.text).length >= 6)) best.emph = true;
    }
  }
  // two-line looks put the key word on its own big line, so end the phrase right after it
  if (cfg.style === "twoTier" || cfg.style === "serif") {
    const split: Phrase[] = [];
    for (const p of out) {
      const i = p.words.findIndex((w) => w.emph);
      if (i >= 0 && i < p.words.length - 1) {
        const a = p.words.slice(0, i + 1), b = p.words.slice(i + 1);
        split.push({ words: a, start: a[0].start, end: a[a.length - 1].end }, { words: b, start: b[0].start, end: b[b.length - 1].end });
      } else split.push(p);
    }
    out.splice(0, out.length, ...split);
  }
  // phrase visibility: until the next phrase starts, or shortly after its last word
  out.forEach((p, i) => {
    const next = out[i + 1];
    p.end = Math.min(next ? next.start : Infinity, p.end + 0.5);
  });
  return out;
}

const Sparkle: React.FC<{ x: number; y: number; s: number; phase: number; frame: number; color: string }> = ({ x, y, s, phase, frame, color }) => {
  const tw = 0.55 + 0.45 * Math.sin(frame / 4 + phase);
  return (
    <svg style={{ position: "absolute", left: x - s / 2, top: y - s / 2, width: s, height: s, opacity: tw, transform: `scale(${0.7 + 0.3 * tw}) rotate(${phase * 20}deg)` }} viewBox="-10 -10 20 20">
      <path d="M0,-10 C1,-2 2,-1 10,0 C2,1 1,2 0,10 C-1,2 -2,1 -10,0 C-2,-1 -1,-2 0,-10Z" fill={color} />
    </svg>
  );
};

/** Word-by-word captions. `words` must be in the same time base as the current frame. */
export const Captions: React.FC<{ words: Word[]; cfg: CaptionConfig; offsetSec?: number }> = ({ words, cfg, offsetSec = 0 }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const phrases = React.useMemo(() => buildPhrases(words, cfg), [words, cfg]);
  if (!cfg.enabled || !words.length) return null;
  const t = frame / fps + offsetSec;
  const p = phrases.find((ph) => t >= ph.start - 0.02 && t < ph.end);
  if (!p) return null;

  const k = width / 1080;
  const size = cfg.size * k;
  const upper = cfg.uppercase || cfg.style === "caps" || cfg.style === "tracked";
  const shadow = "0 3px 14px rgba(0,0,0,.55), 0 1px 3px rgba(0,0,0,.45)";
  const appear = (w: Word, frames = 5) => clamp(((t - w.start) * fps + 1) / frames);
  const visible = p.words.filter((w) => t >= w.start - 0.02);
  const txt = (w: PWord) => (upper ? w.display.toUpperCase() : w.display);

  const wordSpan = (w: PWord, extra: React.CSSProperties = {}, frames = 5, blur = 8) => {
    const a = appear(w, frames);
    return (
      <span key={`${w.start}-${w.text}`} style={{ display: "inline-block", opacity: a, filter: a < 1 ? `blur(${(1 - a) * blur * k}px)` : undefined, transform: `translateY(${(1 - a) * 10 * k}px) scale(${0.94 + 0.06 * a})`, margin: `0 ${0.12 * size}px`, ...extra }}>
        {txt(w)}
      </span>
    );
  };

  const block: React.CSSProperties = {
    position: "absolute", left: "6%", right: "6%", top: cfg.y * height, transform: "translateY(-50%)",
    textAlign: "center", color: cfg.color, fontFamily: FONT.sans, lineHeight: 1.04,
  };

  if (cfg.style === "twoTier" || cfg.style === "serif") {
    const emphIdx = p.words.findIndex((w) => w.emph);
    if (emphIdx >= 0) {
      const before = p.words.slice(0, emphIdx).filter((w) => !w.emph);
      const em = p.words.filter((w) => w.emph);
      const after = p.words.slice(emphIdx + 1).filter((w) => !w.emph);
      const small = (list: PWord[], scale: number, weight: number) =>
        list.length ? <div style={{ fontSize: size * scale, fontWeight: weight, textShadow: shadow, letterSpacing: "-0.02em" }}>{list.filter((w) => t >= w.start - 0.02).map((w) => wordSpan(w))}&nbsp;</div> : null;
      if (cfg.style === "twoTier") {
        return (
          <AbsoluteFill style={{ pointerEvents: "none" }}>
            <div style={block}>
              {small([...before, ...after], 0.72, 700)}
              <div style={{ fontSize: size * 1.85, fontWeight: 900, letterSpacing: "-0.05em", lineHeight: 0.92, textShadow: shadow, marginTop: -size * 0.05 }}>
                {em.filter((w) => t >= w.start - 0.02).map((w) => wordSpan(w, { margin: `0 ${0.05 * size}px` }, 6, 18))}
              </div>
            </div>
          </AbsoluteFill>
        );
      }
      // serif: small setup line, big gold italic serif word with sparkles, small tail line
      const gold = "linear-gradient(180deg, #FFF4C9 0%, #F2D58A 45%, #C99A3E 100%)";
      const emShown = em.filter((w) => t >= w.start - 0.02);
      return (
        <AbsoluteFill style={{ pointerEvents: "none" }}>
          <div style={block}>
            {small(before, 0.6, 600)}
            <div style={{ position: "relative", display: "inline-block", fontFamily: FONT.serif, fontStyle: "italic", fontSize: size * 2, lineHeight: 1, letterSpacing: "-0.01em", padding: `0 ${size * 0.3}px` }}>
              {emShown.map((w) => wordSpan(w, { backgroundImage: gold, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", filter: `drop-shadow(0 2px 10px rgba(0,0,0,.35))`, margin: `0 ${0.08 * size}px` }, 7, 14))}
              {emShown.length > 0 && (
                <>
                  <Sparkle x={-size * 0.05} y={size * 1.1} s={size * 0.38} phase={0} frame={frame} color="#F6DE97" />
                  <Sparkle x={size * 0.15} y={size * 0.35} s={size * 0.22} phase={2} frame={frame} color="#FFF3C4" />
                  <Sparkle x={size * 4.2} y={size * 0.2} s={size * 0.3} phase={4} frame={frame} color="#F6DE97" />
                </>
              )}
            </div>
            {small(after, 0.5, 500)}
          </div>
        </AbsoluteFill>
      );
    }
  }

  if (cfg.style === "tracked") {
    return (
      <AbsoluteFill style={{ pointerEvents: "none" }}>
        <div style={{ ...block, fontSize: size * 0.42, fontWeight: 500, letterSpacing: "0.5em", textShadow: shadow }}>
          {visible.map((w) => wordSpan(w, { margin: `0 ${0.3 * size}px` }, 6, 4))}
        </div>
      </AbsoluteFill>
    );
  }

  if (cfg.style === "box") {
    return (
      <AbsoluteFill style={{ pointerEvents: "none" }}>
        <div style={{ ...block, fontSize: size * 0.82, fontWeight: 800, letterSpacing: "-0.02em" }}>
          {visible.map((w) =>
            wordSpan(w, {
              background: w.emph ? cfg.accent : "#0B0B0C",
              color: w.emph ? "#0B0B0C" : "#FFFFFF",
              padding: `${0.06 * size}px ${0.2 * size}px ${0.1 * size}px`,
              borderRadius: 6 * k,
              margin: `0 ${0.04 * size}px`,
              boxShadow: "0 6px 18px rgba(0,0,0,.25)",
            }, 4, 0),
          )}
        </div>
      </AbsoluteFill>
    );
  }

  // pop / caps
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ ...block, fontSize: cfg.style === "caps" ? size * 0.95 : size, fontWeight: cfg.style === "caps" ? 900 : 800, letterSpacing: cfg.style === "caps" ? "-0.01em" : "-0.025em", textShadow: shadow }}>
        {visible.map((w) => wordSpan(w, w.emph ? { color: cfg.accent } : {}))}
      </div>
    </AbsoluteFill>
  );
};
