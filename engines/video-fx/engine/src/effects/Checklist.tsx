import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { clamp, easeOut, prog, springAt } from "../lib/anim";
import { Captions } from "../lib/captions";
import { useFx } from "../lib/context";
import { FONT, measureText } from "../lib/fonts";
import { ClipVideo } from "../lib/media";
import { makeFx } from "../lib/shell";
import { findWord, norm, resolveTime, type TimeRef } from "../lib/time";
import { autoItems, Caret, CheckGlyph, typed } from "../lib/uikit";

type ItemCfg = string | { text: string; at?: TimeRef; doneAt?: TimeRef };
type Item = { text: string; start: number; typedEnd: number; done: number };

const SKELETON = [0.56, 0.68, 0.5, 0.62, 0.72, 0.46];
const STOPISH = new Set(["the", "a", "an", "your", "my", "to", "and", "of", "it", "this", "that"]);

/**
 * A frosted dark-glass checklist card. Each item types in when it is said, then its
 * circle fills with a check and a little burst, the counter ticks up and the
 * segmented progress bar fills.
 */
const Checklist: React.FC = () => {
  const frame = useCurrentFrame();
  const fx = useFx();
  const { cfg, fps, width, height, dur, subject, words } = fx;
  const k = width / 1080;
  const durSec = dur / fps;
  const cps = cfg.typeSpeed as number;

  const items: Item[] = useMemo(() => {
    const raw: { text: string; at?: TimeRef; doneAt?: TimeRef }[] = Array.isArray(cfg.items)
      ? (cfg.items as ItemCfg[]).map((it) => (typeof it === "string" ? { text: it } : it))
      : autoItems(words, cfg.count as number, durSec).map((x) => ({ text: x.text, at: x.at }));
    const n = raw.length;
    const even = (i: number) => 0.35 + ((durSec - 1.4) * i) / Math.max(1, n);
    let prevTyped = -1000;
    let prevDone = -1000;
    return raw.map((it, i) => {
      let atSec: number;
      if (it.at !== undefined && it.at !== null && it.at !== "auto") atSec = resolveTime(it.at, words, durSec, even(i));
      else {
        // find the item's first content word in the transcript
        const key = it.text.split(/\s+/).map(norm).find((w) => w.length > 2 && !STOPISH.has(w));
        const hit = key ? findWord(words, key) : null;
        atSec = hit ? Math.max(0, hit.start - 0.1) : even(i);
      }
      // items always type one after another and tick in order
      const start = Math.max(Math.round(atSec * fps), Math.ceil(prevTyped + 3));
      const { end } = typed(it.text, 0, start, fps, cps, `item${i}`);
      const wantDone = it.doneAt !== undefined && it.doneAt !== null ? fx.t(it.doneAt) : Math.round(end + (cfg.checkAfter as number) * fps);
      const done = Math.max(wantDone, Math.ceil(end), prevDone + 4);
      prevTyped = end;
      prevDone = done;
      return { text: it.text, start, typedEnd: end, done };
    });
  }, [cfg, words, durSec, fps, cps, fx]);

  // ---------- layout ----------
  const n = items.length;
  const cardW = width * (cfg.width as number);
  const pad = 40 * k;
  const rowH = 118 * k;
  const rowGap = 14 * k;
  const headerH = 46 * k;
  const cardH = pad * 2 + headerH + 22 * k + 10 * k + 30 * k + n * rowH + (n - 1) * rowGap;
  let top: number;
  let captionY = fx.captions.y;
  if (typeof cfg.position === "number") top = cfg.position * height;
  else {
    const roomAbove = subject.headTop - 30 * k;
    const wantTop = cfg.position === "top" || (cfg.position === "auto" && roomAbove >= cardH + 90 * k);
    if (wantTop) top = Math.max(0.07 * height, subject.headTop - cardH - 50 * k);
    else top = clamp(subject.headY + 0.24 * height, 0.44 * height, height - cardH - 0.08 * height);
  }
  if (cfg.captionsAvoid) {
    const capTop = captionY * height - 60 * k;
    const capBot = captionY * height + 60 * k;
    if (capBot > top - 20 * k && capTop < top + cardH + 20 * k) {
      const below = top + cardH + 110 * k;
      captionY = below < height - 140 * k ? below / height : Math.max(0.08, (top - 110 * k) / height);
    }
  }

  // ---------- timing ----------
  const inF = Math.max(0, Math.min(fx.t(cfg.inAt, 0), (items[0]?.start ?? 10) - 10));
  const enter = springAt(frame, fps, inF, { damping: 16, stiffness: 140, mass: 0.8 });
  const outF = cfg.outAt !== null && cfg.outAt !== undefined ? fx.t(cfg.outAt) : fx.endsEarly ? dur - 12 : dur + 1000;
  const exit = prog(frame, outF, 12, easeOut);
  const vis = clamp(enter * 1.2) * (1 - exit);
  const doneCount = items.filter((it) => frame >= it.done).length;
  const lastDone = items.filter((it) => frame >= it.done).map((it) => it.done).pop() ?? -100;
  const counterPop = 1 + 0.18 * Math.max(0, 1 - (frame - lastDone) / 8) * (frame >= lastDone ? 1 : 0);
  const current = items.reduce((acc, it, i) => (frame >= it.start ? i : acc), -1);

  const tilt = cfg.tilt as number;
  const float = Math.sin(frame / 38) * 4 * k;
  const accent = cfg.accent as string;
  const textMax = cardW - pad * 2 - 64 * k - 28 * k - 30 * k;

  return (
    <AbsoluteFill>
      <ClipVideo />
      <AbsoluteFill style={{ perspective: 1800 * k }}>
        <div
          style={{
            position: "absolute",
            left: (width - cardW) / 2,
            top: top + float,
            width: cardW,
            height: cardH,
            boxSizing: "border-box",
            padding: pad,
            borderRadius: 42 * k,
            background: "linear-gradient(160deg, rgba(48,48,52,0.78), rgba(22,22,24,0.82))",
            backdropFilter: `blur(${26 * k}px) saturate(1.35)`,
            WebkitBackdropFilter: `blur(${26 * k}px) saturate(1.35)`,
            border: `${1.5 * k}px solid rgba(255,255,255,0.10)`,
            boxShadow: `0 ${30 * k}px ${90 * k}px rgba(0,0,0,0.45), inset 0 ${1.5 * k}px 0 rgba(255,255,255,0.08)`,
            opacity: vis,
            transform: `translateY(${(1 - enter) * -40 * k - exit * 30 * k}px) scale(${0.9 + 0.1 * enter}) rotateX(${tilt * 0.7}deg) rotateY(${-tilt}deg) rotateZ(${-tilt * 0.18}deg)`,
            filter: enter < 0.98 || exit > 0 ? `blur(${(1 - enter) * 10 * k + exit * 8 * k}px)` : undefined,
            fontFamily: FONT.sans,
            color: "#fff",
          }}
        >
          {/* header */}
          <div style={{ height: headerH, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 * k, fontSize: 22 * k, fontWeight: 600, letterSpacing: "0.22em", color: "rgba(255,255,255,0.72)", textTransform: "uppercase" }}>
              <span style={{ width: 9 * k, height: 9 * k, borderRadius: 9 * k, background: accent, boxShadow: `0 0 ${10 * k}px ${accent}` }} />
              {cfg.title}
            </div>
            <div style={{ fontSize: 25 * k, fontWeight: 700, padding: `${7 * k}px ${18 * k}px`, borderRadius: 99, background: "rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.92)", transform: `scale(${counterPop})`, fontVariantNumeric: "tabular-nums" }}>
              {doneCount} of {n}
            </div>
          </div>
          {/* progress bar */}
          <div style={{ display: "flex", gap: 8 * k, marginTop: 22 * k, height: 10 * k }}>
            {items.map((it, i) => {
              const typing = clamp((frame - it.start) / Math.max(1, it.typedEnd - it.start));
              const fill = 0.28 * typing + 0.72 * prog(frame, it.done, 12, easeOut);
              return (
                <div key={i} style={{ flex: 1, borderRadius: 10 * k, background: "rgba(255,255,255,0.10)", overflow: "hidden" }}>
                  <div style={{ width: `${fill * 100}%`, height: "100%", borderRadius: 10 * k, background: accent, boxShadow: `0 0 ${12 * k}px ${accent}` }} />
                </div>
              );
            })}
          </div>
          {/* rows */}
          <div style={{ marginTop: 30 * k, display: "flex", flexDirection: "column", gap: rowGap }}>
            {items.map((it, i) => {
              const started = frame >= it.start;
              const tp = typed(it.text, frame, it.start, fps, cps, `item${i}`);
              const isDone = frame >= it.done;
              const fillP = springAt(frame, fps, it.done, { damping: 11, stiffness: 220, mass: 0.6 });
              const burst = clamp((frame - it.done) / 14);
              const skel = 1 - prog(frame, it.start - 2, 6);
              const active = i === current;
              const hl = active ? prog(frame, it.start - 3, 6) * (1 - 0.6 * prog(frame, it.done + 10, 12)) : 0;
              const fsBase = 52 * k;
              const fs = Math.min(fsBase, (fsBase * textMax) / Math.max(1, measureText(it.text, `700 ${fsBase}px Inter`)));
              const textColor = isDone ? (cfg.doneTextColor as string) : "#FFFFFF";
              return (
                <div key={i} style={{ position: "relative", height: rowH, display: "flex", alignItems: "center", gap: 28 * k, padding: `0 ${18 * k}px`, borderRadius: 24 * k, background: `rgba(255,255,255,${0.075 * hl})` }}>
                  {/* checkbox */}
                  <div style={{ position: "relative", width: 52 * k, height: 52 * k, flex: "none" }}>
                    {isDone && burst < 1 ? (
                      <>
                        <div style={{ position: "absolute", inset: -40 * k, borderRadius: "50%", background: `radial-gradient(circle, ${accent}cc 0%, ${accent}33 40%, transparent 70%)`, opacity: 1 - burst, transform: `scale(${0.5 + burst * 1.1})` }} />
                        <svg style={{ position: "absolute", left: -60 * k, top: -60 * k, width: 172 * k, height: 172 * k, opacity: 1 - burst }} viewBox="-50 -50 100 100">
                          {Array.from({ length: 10 }, (_, r) => {
                            const a = (r / 10) * Math.PI * 2;
                            const r1 = 20 + burst * 14, r2 = 26 + burst * 22;
                            return <line key={r} x1={Math.cos(a) * r1} y1={Math.sin(a) * r1} x2={Math.cos(a) * r2} y2={Math.sin(a) * r2} stroke={accent} strokeWidth={3} strokeLinecap="round" />;
                          })}
                        </svg>
                      </>
                    ) : null}
                    <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `${3.5 * k}px solid rgba(255,255,255,${started ? 0.62 : 0.4})`, boxSizing: "border-box" }} />
                    {isDone ? (
                      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: accent, transform: `scale(${fillP})`, boxShadow: `0 0 ${18 * k}px ${accent}88`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <CheckGlyph size={38 * k} color="#1A1A16" stroke={3.4} progress={prog(frame, it.done + 2, 7)} />
                      </div>
                    ) : null}
                  </div>
                  {/* text / skeleton */}
                  <div style={{ position: "relative", flex: 1, height: "100%", display: "flex", alignItems: "center" }}>
                    {skel > 0 ? <div style={{ position: "absolute", left: 0, width: `${SKELETON[i % SKELETON.length] * 100}%`, height: 14 * k, borderRadius: 8 * k, background: "rgba(255,255,255,0.13)", opacity: skel }} /> : null}
                    {started ? (
                      <div style={{ fontSize: fs, fontWeight: 700, letterSpacing: "-0.02em", color: textColor, whiteSpace: "nowrap", textShadow: isDone ? `0 0 ${18 * k}px ${accent}40` : undefined }}>
                        {tp.shown}
                        {!tp.done || (active && !isDone) ? <Caret frame={frame} height={fs * 0.95} width={3.5 * k} color="rgba(255,255,255,0.9)" solid={!tp.done} /> : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </AbsoluteFill>
      <Captions words={fx.words} cfg={{ ...fx.captions, y: captionY }} />
    </AbsoluteFill>
  );
};

export default makeFx(Checklist, { ownsCaptions: true });
