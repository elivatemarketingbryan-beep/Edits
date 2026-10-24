import React from "react";
import { AbsoluteFill, Audio, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { interpolate } from "../lib/interp";
import { easeOut, prog, springAt } from "../lib/anim";
import { FONT, FontGate } from "../lib/fonts";

export type ShowreelItem = { src: string; title: string; number: number; from: number; duration: number };
export type ShowreelProps = {
  items: ShowreelItem[];
  headline: string;
  accentWord: string;
  subline: string;
  accent: string;
};

const LIST_GAP = 36;

/** "17 video effects Claude can create" — every example plays in a card under a live effect list. */
export const Showreel: React.FC<ShowreelProps> = ({ items, headline, accentWord, subline, accent }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  let acc = 0;
  const starts = items.map((it) => {
    const s = acc;
    acc += Math.round(it.duration * fps);
    return s;
  });
  let activeIdx = 0;
  starts.forEach((s, i) => {
    if (frame >= s) activeIdx = i;
  });
  const half = Math.ceil(items.length / 2);
  const cols = [items.slice(0, half), items.slice(half)];
  const intro = springAt(frame, fps, 0, { damping: 18 });

  const cardW = width * 0.54;
  const cardH = cardW * (16 / 9);
  const cardTop = height - cardH - height * 0.04;

  return (
    <FontGate>
      <AbsoluteFill style={{ backgroundColor: "#0c0c0d" }}>
        {/* blurred backdrop of the current clip */}
        {items.map((it, i) => (
          <Sequence key={`bg${i}`} from={starts[i]} durationInFrames={Math.round(it.duration * fps)}>
            <AbsoluteFill style={{ filter: "blur(40px) brightness(0.45) saturate(1.2)", transform: "scale(1.2)" }}>
              <OffthreadVideo src={staticFile(it.src)} muted trimBefore={Math.round(it.from * fps) || undefined} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </AbsoluteFill>
            <Audio src={staticFile(it.src)} trimBefore={Math.round(it.from * fps) || undefined}
              volume={(f) => interpolate(f, [0, 4, it.duration * fps - 5, it.duration * fps], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
          </Sequence>
        ))}

        {/* headline */}
        <div style={{ position: "absolute", top: height * 0.045, left: 0, right: 0, textAlign: "center", fontFamily: FONT.sans, fontWeight: 900, color: "#fff", fontSize: 92, lineHeight: 0.98, letterSpacing: "-0.055em", textShadow: "0 6px 30px rgba(0,0,0,.45)", opacity: intro, transform: `translateY(${(1 - intro) * 30}px)` }}>
          <span style={{ color: accent }}>{accentWord}</span> {headline}
          <br />
          {subline}
        </div>

        {/* effect list, two columns */}
        <div style={{ position: "absolute", top: height * 0.155, left: 40, right: 40, display: "flex", justifyContent: "space-between", gap: LIST_GAP, opacity: intro }}>
          {cols.map((col, c) => (
            <div key={c} style={{ background: "rgba(20,20,22,.55)", backdropFilter: "blur(14px)", borderRadius: 26, padding: "16px 24px", minWidth: (width - 80 - LIST_GAP) / 2 - 20 }}>
              {col.map((it) => {
                const idx = items.indexOf(it);
                const on = idx === activeIdx;
                const k = on ? prog(frame, starts[idx], 6, easeOut) : 0;
                return (
                  <div key={it.number} style={{ display: "flex", alignItems: "baseline", gap: 14, fontFamily: FONT.sans, fontSize: 31, lineHeight: 1.24, fontWeight: 800, letterSpacing: "-0.03em", color: on ? accent : idx < activeIdx ? "rgba(255,255,255,.55)" : "rgba(255,255,255,.85)", transform: `translateX(${k * 6}px)` }}>
                    <span style={{ fontFamily: FONT.mono, fontSize: 22, fontWeight: 500, opacity: 0.6, width: 30 }}>{String(it.number).padStart(2, "0")}</span>
                    {it.title.toLowerCase()}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* the demo card */}
        <div style={{ position: "absolute", left: (width - cardW) / 2, top: cardTop, width: cardW, height: cardH, borderRadius: 46, overflow: "hidden", border: "6px solid rgba(245,240,230,.95)", boxShadow: "0 40px 90px rgba(0,0,0,.55)" }}>
          {items.map((it, i) => (
            <Sequence key={`fg${i}`} from={starts[i]} durationInFrames={Math.round(it.duration * fps)}>
              <OffthreadVideo src={staticFile(it.src)} muted trimBefore={Math.round(it.from * fps) || undefined} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </Sequence>
          ))}
          <div style={{ position: "absolute", top: 26, left: 26, background: "rgba(25,25,27,.78)", color: "#fff", borderRadius: 999, padding: "8px 18px", fontFamily: FONT.sans, fontWeight: 800, fontSize: 30, letterSpacing: "-0.02em" }}>
            {String(items[activeIdx]?.number ?? 1).padStart(2, "0")}
            <span style={{ opacity: 0.55 }}>/{String(items.length).padStart(2, "0")}</span>
          </div>
        </div>
      </AbsoluteFill>
    </FontGate>
  );
};
