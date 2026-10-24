import React from "react";
import { AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp, easeOut, prog, springAt } from "../lib/anim";
import { FONT, FontGate } from "../lib/fonts";
import { interpolate } from "../lib/interp";
import { AboutMotion, type AboutMotionProps } from "./AboutMotion";

/**
 * "N video effects claude can create" call-out reel: the speaker plays full frame while a
 * headline, a two-column numbered list (current item lit) and a held "phone card" playing each
 * effect's demo sit on top. After the list, captions take over, and an optional join card
 * comes back for the call to action.
 */
export type CalloutItem = { label: string; start: number; end: number; demo: string; demoFrom: number };
export type CalloutWord = { text: string; start: number; big?: boolean };
export type CalloutPhrase = { start: number; end: number; place: "mid" | "top"; words: CalloutWord[] };
export type JoinCard = { start: number; end: number; linkAt: number; joinAt: number; doneAt: number; name: string; tagline: string; module: string };
/** A real page screenshot (e.g. a Skool About page) with the join button's box in CSS px. */
export type AboutCard = {
  start: number; end: number; src: string; cssWidth: number; cssHeight: number;
  button: { x: number; y: number; w: number; h: number };
  guideAt: number; pushAt: number; tapAt: number;
};
export type CalloutReelProps = {
  main: string;
  durationInFrames: number;
  headline: { count: string; line1: string; line2: string };
  items: CalloutItem[];
  phrases: CalloutPhrase[];
  join: JoinCard | null;
  about?: AboutCard | null;
  /** motion-graphics outro that takes over when the list ends */
  outro?: AboutMotionProps | null;
  /** length of the speaker video in frames (the composition may run longer for the outro) */
  mainFrames?: number;
  accent: string;
  layout: { headlineY: number; panelsY: number; cardX: number; cardY: number; cardW: number; midCaptionY: number; topCaptionY: number };
};

const INK = "#FFFFFF";
const shadow = "0 2px 4px rgba(0,0,0,.35), 0 6px 22px rgba(0,0,0,.35)";

const Headline: React.FC<{ p: CalloutReelProps; frame: number }> = ({ p }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top: p.layout.headlineY * 1920, textAlign: "center", fontFamily: FONT.sans, fontWeight: 900, fontSize: 74, lineHeight: 0.95, letterSpacing: "-0.055em", color: INK, textShadow: shadow }}>
    <div>
      <span style={{ color: p.accent }}>{p.headline.count}</span> {p.headline.line1}
    </div>
    <div>{p.headline.line2}</div>
  </div>
);

const Panel: React.FC<{ items: CalloutItem[]; offset: number; active: number; side: "left" | "right"; top: number; accent: string; frame: number; fps: number }> = ({ items, offset, active, side, top, accent, frame, fps }) => (
  <div
    style={{
      position: "absolute", top: top * 1920, [side]: 30,
      background: "rgba(24,24,26,.58)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
      borderRadius: 20, padding: "14px 20px 14px 16px", boxShadow: "0 8px 30px rgba(0,0,0,.18)",
    }}
  >
    {items.map((it, i) => {
      const n = offset + i;
      const on = n === active;
      const k = on ? prog(frame, Math.round(it.start * fps), 4, easeOut) : 0;
      return (
        <div key={n} style={{ display: "flex", alignItems: "baseline", gap: 12, height: 37, fontFamily: FONT.sans, whiteSpace: "nowrap", transform: `translateX(${k * 6}px)` }}>
          <span style={{ width: 28, fontSize: 19, fontWeight: 600, color: on ? accent : "rgba(255,255,255,.5)", fontVariantNumeric: "tabular-nums" }}>{String(n + 1).padStart(2, "0")}</span>
          <span style={{ fontSize: 28 + k * 2, fontWeight: 800, letterSpacing: "-0.03em", color: on ? accent : "rgba(255,255,255,.86)" }}>{it.label}</span>
        </div>
      );
    })}
  </div>
);

const Card: React.FC<{ p: CalloutReelProps; children: React.ReactNode; style?: React.CSSProperties }> = ({ p, children, style }) => {
  const w = p.layout.cardW * 1080;
  const h = w * (16 / 9);
  return (
    <div
      style={{
        position: "absolute", left: p.layout.cardX * 1080 - w / 2, top: p.layout.cardY * 1920, width: w, height: h,
        borderRadius: 38, border: "7px solid #F4EFE4", background: "#F4EFE4", overflow: "hidden",
        boxShadow: "0 30px 70px rgba(0,0,0,.35), 0 4px 12px rgba(0,0,0,.25)", ...style,
      }}
    >
      <div style={{ position: "absolute", inset: 0, borderRadius: 31, overflow: "hidden" }}>{children}</div>
    </div>
  );
};

const Counter: React.FC<{ n: number; total: number }> = ({ n, total }) => (
  <div style={{ position: "absolute", top: 18, left: 18, background: "rgba(22,22,24,.82)", borderRadius: 999, padding: "5px 14px 6px", fontFamily: FONT.sans, fontWeight: 800, fontSize: 25, letterSpacing: "-0.02em", color: "#fff" }}>
    {String(n).padStart(2, "0")}
    <span style={{ color: "rgba(255,255,255,.55)" }}>/{total}</span>
  </div>
);

const Captions: React.FC<{ p: CalloutReelProps; t: number; fps: number }> = ({ p, t, fps }) => {
  const ph = p.phrases.find((x) => t >= x.start - 0.01 && t < x.end);
  if (!ph) return null;
  const shown = ph.words.filter((w) => t >= w.start - 0.01);
  const small = shown.filter((w) => !w.big);
  const big = shown.filter((w) => w.big);
  const y = (ph.place === "top" ? p.layout.topCaptionY : p.layout.midCaptionY) * 1920;
  const pop = (w: CalloutWord) => clamp(((t - w.start) * fps + 1) / 4);
  const bigText = big.map((w) => w.text).join(" ");
  const bigSize = Math.min(170, (1080 * 0.86) / Math.max(1, bigText.length * 0.56));
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: 40, right: 40, top: y, transform: "translateY(-50%)", textAlign: "center", fontFamily: FONT.sans, fontWeight: 900, color: INK, textShadow: shadow }}>
        <div style={{ fontSize: 60, letterSpacing: "-0.045em", lineHeight: 1.02 }}>
          {small.map((w, i) => {
            const a = pop(w);
            return (
              <span key={i} style={{ display: "inline-block", margin: "0 0.12em", opacity: a, transform: `translateY(${(1 - a) * 8}px) scale(${0.92 + 0.08 * a})` }}>
                {w.text}
              </span>
            );
          })}
        </div>
        {big.length > 0 && (
          <div style={{ fontSize: bigSize, letterSpacing: "-0.06em", lineHeight: 0.9, color: p.accent, marginTop: 4, transform: `scale(${0.7 + 0.3 * pop(big[0])})`, opacity: pop(big[0]) }}>{bigText}</div>
        )}
      </div>
    </AbsoluteFill>
  );
};

const Tap: React.FC<{ frame: number; at: number; x: number; y: number }> = ({ frame, at, x, y }) => {
  const a = interpolate(frame, [at - 8, at - 3, at + 4, at + 12], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ring = prog(frame, at, 12, easeOut);
  if (a <= 0) return null;
  return (
    <>
      <div style={{ position: "absolute", left: x - 26, top: y - 26, width: 52, height: 52, borderRadius: 99, background: "rgba(255,255,255,.55)", border: "2px solid rgba(0,0,0,.15)", opacity: a, boxShadow: "0 4px 14px rgba(0,0,0,.25)" }} />
      <div style={{ position: "absolute", left: x - 26 - ring * 26, top: y - 26 - ring * 26, width: 52 + ring * 52, height: 52 + ring * 52, borderRadius: 999, border: "3px solid rgba(255,255,255,.9)", opacity: (1 - ring) * a }} />
    </>
  );
};

/** A simple community page (not any real product's UI): banner, name, join button, a module. */
const JoinPage: React.FC<{ j: JoinCard; frame: number; fps: number; w: number; accent: string }> = ({ j, frame, fps, w, accent }) => {
  const lf = Math.round(j.linkAt * fps), jf = Math.round(j.joinAt * fps), df = Math.round(j.doneAt * fps);
  const s = w / 336;
  const press = interpolate(frame, [jf - 2, jf + 1, jf + 6], [1, 0.94, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const joined = frame >= jf + 2;
  const toast = springAt(frame, fps, df, { damping: 16, stiffness: 170 });
  const urlFlash = interpolate(frame, [lf - 2, lf + 2, lf + 14], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: "#FBFAF6", fontFamily: FONT.sans, color: "#121212" }}>
      {/* address bar */}
      <div style={{ position: "absolute", top: 16 * s, left: 14 * s, right: 14 * s, height: 30 * s, borderRadius: 99, background: `rgba(18,18,18,${0.06 + urlFlash * 0.1})`, display: "flex", alignItems: "center", gap: 6 * s, padding: `0 ${12 * s}px`, fontSize: 12 * s, fontWeight: 600, color: "#555" }}>
        <svg width={10 * s} height={12 * s} viewBox="0 0 10 12"><rect x="1" y="5" width="8" height="6.5" rx="1.5" fill="#777" /><path d="M3 5V3.6a2 2 0 0 1 4 0V5" stroke="#777" strokeWidth="1.4" fill="none" /></svg>
        {j.name}
      </div>
      {/* banner */}
      <div style={{ position: "absolute", top: 58 * s, left: 14 * s, right: 14 * s, height: 150 * s, borderRadius: 16 * s, background: "linear-gradient(135deg,#15161A 0%,#2B2C33 60%,#3A3320 100%)", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -30 * s, top: -40 * s, width: 160 * s, height: 160 * s, borderRadius: 999, background: accent, opacity: 0.22, filter: `blur(${18 * s}px)` }} />
        <div style={{ position: "absolute", left: 16 * s, bottom: 16 * s, right: 16 * s, color: "#fff" }}>
          <div style={{ fontWeight: 900, fontSize: 25 * s, letterSpacing: "-0.04em", lineHeight: 0.95 }}>{j.name}</div>
          <div style={{ fontWeight: 600, fontSize: 11.5 * s, opacity: 0.75, marginTop: 6 * s }}>{j.tagline}</div>
        </div>
      </div>
      {/* join button */}
      <div style={{ position: "absolute", top: 222 * s, left: 14 * s, right: 14 * s, height: 46 * s, borderRadius: 12 * s, background: joined ? "#1F9D55" : accent, color: joined ? "#fff" : "#121212", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 16 * s, letterSpacing: "0.04em", transform: `scale(${press})`, boxShadow: "0 6px 16px rgba(0,0,0,.12)" }}>
        {joined ? "✓  JOINED" : "JOIN GROUP"}
      </div>
      {/* tabs + module */}
      <div style={{ position: "absolute", top: 284 * s, left: 18 * s, display: "flex", gap: 16 * s, fontSize: 12.5 * s, fontWeight: 700, color: "#8a8a8a" }}>
        <span style={{ color: "#121212", borderBottom: `2px solid #121212`, paddingBottom: 4 * s }}>Classroom</span>
        <span>Community</span>
        <span>Calendar</span>
      </div>
      <div style={{ position: "absolute", top: 320 * s, left: 14 * s, right: 14 * s, borderRadius: 14 * s, background: "#fff", boxShadow: "0 2px 10px rgba(0,0,0,.08)", padding: 12 * s }}>
        <div style={{ height: 82 * s, borderRadius: 10 * s, background: "linear-gradient(135deg,#FFE7A1,#FFC94D)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 22 * s, letterSpacing: "-0.04em" }}>{j.module.split("·")[0].trim()}</div>
        <div style={{ fontWeight: 800, fontSize: 13.5 * s, marginTop: 9 * s }}>{j.module}</div>
        <div style={{ height: 6 * s, borderRadius: 9, background: "#ECEAE4", marginTop: 8 * s, overflow: "hidden" }}>
          <div style={{ width: `${joined ? 100 * clamp((frame - jf) / 20) : 0}%`, height: "100%", background: accent }} />
        </div>
      </div>
      <div style={{ position: "absolute", top: 470 * s, left: 14 * s, right: 14 * s, borderRadius: 14 * s, background: "#fff", boxShadow: "0 2px 10px rgba(0,0,0,.08)", height: 70 * s, opacity: 0.8 }} />
      {/* toast */}
      <div style={{ position: "absolute", left: 14 * s, right: 14 * s, bottom: 18 * s, height: 50 * s, borderRadius: 14 * s, background: "#121212", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14.5 * s, transform: `translateY(${(1 - toast) * 90 * s}px)`, opacity: toast }}>
        You're in. Welcome to the lab.
      </div>
      <Tap frame={frame} at={lf} x={168 * s} y={31 * s} />
      <Tap frame={frame} at={jf} x={168 * s} y={245 * s} />
    </AbsoluteFill>
  );
};

const HandCursor: React.FC<{ size: number; pressed: number }> = ({ size, pressed }) => (
  <svg width={size} height={size * 1.15} viewBox="0 0 100 115" style={{ overflow: "visible", filter: "drop-shadow(0 6px 10px rgba(0,0,0,.35))", transform: `scale(${1 - pressed * 0.12})`, transformOrigin: "30% 6%" }}>
    <path
      d="M30 6c6 0 10 4 10 10v38l4-1V40c0-5 4-9 9-9s9 4 9 9v14l3-1v-7c0-5 4-9 9-9s9 4 9 9v10l2-.5c0-4.5 3.8-8 8-8s8 3.5 8 8v24c0 20-14 36-34 36H52c-12 0-20-5-27-14L8 76c-3-4-2-10 2-13s10-2 13 2l7 8V16c0-6 4-10 10-10z"
      fill="#fff" stroke="#111" strokeWidth="5" strokeLinejoin="round"
    />
  </svg>
);

/** Real About page in the card with an eye-guiding sequence on the join button. */
const AboutPage: React.FC<{ a: AboutCard; frame: number; fps: number; w: number; h: number; accent: string }> = ({ a, frame, fps, w, h, accent }) => {
  const s = w / a.cssWidth;
  const b = { x: a.button.x * s, y: a.button.y * s, w: a.button.w * s, h: a.button.h * s };
  const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
  const gf = Math.round(a.guideAt * fps), pf = Math.round(a.pushAt * fps), tf = Math.round(a.tapAt * fps);
  // camera: gentle drift, then push in on the button
  const push = prog(frame, pf, Math.round(0.55 * fps), easeOut);
  const zoom = 1 + 0.07 * push;
  // spotlight: dim the page around the button
  const dim = interpolate(frame, [gf, gf + 10, tf + 18, tf + 40], [0, 0.78, 0.78, 0.66], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // hand: enters from the lower right, lands on the button at the tap
  const travel = prog(frame, gf + 4, Math.max(8, tf - gf - 6), easeOut);
  const handIn = interpolate(frame, [gf, gf + 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const handOut = interpolate(frame, [tf + 14, tf + 24], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pressed = interpolate(frame, [tf - 3, tf, tf + 5], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const hx = interpolate(travel, [0, 1], [w * 0.98, cx + b.w * 0.12]);
  const hy = interpolate(travel, [0, 1], [h * 1.02, cy - 4 * s]);
  // button press + glow
  // the button lifts forward as the camera pushes, presses on the tap, then stays proud
  const lift = 1 + 0.06 * push;
  const press = lift * interpolate(frame, [tf - 2, tf + 1, tf + 7], [1, 0.9, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const glow = frame >= gf ? 0.55 + 0.45 * Math.sin(((frame - gf) / fps) * Math.PI * 2 * 1.6) : 0;
  const ripple = prog(frame, tf, 16, easeOut);
  const burst = prog(frame, tf, 18, easeOut);
  const shinePeriod = Math.round(0.9 * fps);
  const shine = frame >= gf ? ((frame - gf) % shinePeriod) / shinePeriod : -1;
  const rings = [0, 1, 2].map((k) => {
    const start = gf + k * Math.round(0.45 * fps);
    if (frame < start) return null;
    const ph = ((frame - start) % Math.round(1.35 * fps)) / Math.round(1.35 * fps);
    return { sc: 1 + ph * 0.28, op: (1 - ph) * 0.9 };
  });
  const r = 12 * s;
  return (
    <AbsoluteFill style={{ background: "#fff", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${zoom})`, transformOrigin: `${cx}px ${cy}px` }}>
        <Img src={staticFile(a.src)} style={{ position: "absolute", left: 0, top: 0, width: w, height: a.cssHeight * s }} />
        {/* spotlight: a soft-edged hole around the button */}
        <div style={{ position: "absolute", left: b.x - 6 * s, top: b.y - 6 * s, width: b.w + 12 * s, height: b.h + 12 * s, borderRadius: r + 6 * s, boxShadow: `0 0 ${26 * s}px ${3000}px rgba(10,10,12,${dim})` }} />
        {/* pulsing rings */}
        {rings.map((g, k) =>
          g ? <div key={k} style={{ position: "absolute", left: cx - (b.w / 2) * g.sc, top: cy - (b.h / 2) * g.sc - (g.sc - 1) * 10 * s, width: b.w * g.sc, height: b.h * g.sc + (g.sc - 1) * 20 * s, borderRadius: r * 1.5, border: `${3 * s}px solid ${accent}`, opacity: g.op }} /> : null,
        )}
        {/* the button itself, lifted out of the screenshot so it can glow, shine and press */}
        <div
          style={{
            position: "absolute", left: b.x, top: b.y, width: b.w, height: b.h, borderRadius: r, overflow: "hidden",
            transform: `scale(${press})`, boxShadow: glow ? `0 0 ${(18 + 22 * glow) * s}px ${(3 + 4 * glow) * s}px rgba(255,214,70,${0.55 + 0.35 * glow})` : undefined,
          }}
        >
          <Img src={staticFile(a.src)} style={{ position: "absolute", left: -b.x, top: -b.y, width: w, height: a.cssHeight * s }} />
          {shine >= 0 && <div style={{ position: "absolute", top: -10, bottom: -10, width: b.w * 0.22, left: -b.w * 0.3 + shine * b.w * 1.6, background: "linear-gradient(100deg, transparent, rgba(255,255,255,.75), transparent)", transform: "skewX(-18deg)" }} />}
        </div>
        {/* tap ripple + sparks */}
        {frame >= tf && (
          <>
            <div style={{ position: "absolute", left: cx + b.w * 0.12 - 60 * s * ripple, top: cy - 4 * s - 60 * s * ripple, width: 120 * s * ripple, height: 120 * s * ripple, borderRadius: 999, border: `${3 * s}px solid #fff`, opacity: 1 - ripple }} />
            {Array.from({ length: 12 }, (_, k) => {
              const ang = (k / 12) * Math.PI * 2 + 0.3;
              const dist = (b.w * 0.42 + 40 * s) * burst;
              return (
                <div key={k} style={{ position: "absolute", left: cx + Math.cos(ang) * dist * 1.1 - 5 * s, top: cy + Math.sin(ang) * dist * 0.55 - 5 * s, width: 10 * s, height: 10 * s, borderRadius: 3 * s, background: k % 3 === 0 ? "#fff" : accent, opacity: 1 - burst, transform: `rotate(${k * 30 + burst * 90}deg) scale(${1 - burst * 0.4})` }} />
              );
            })}
          </>
        )}
      </AbsoluteFill>
      {frame >= gf && (
        <div style={{ position: "absolute", left: hx, top: hy, opacity: handIn * handOut, transform: `translate(-30%, -6%)` }}>
          <HandCursor size={58 * s} pressed={pressed} />
        </div>
      )}
    </AbsoluteFill>
  );
};

export const CalloutReel: React.FC<CalloutReelProps> = (p) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const listEnd = p.items.length ? p.items[p.items.length - 1].end : 0;
  const inList = t < listEnd;
  let active = 0;
  p.items.forEach((it, i) => {
    if (t >= it.start - 1e-6) active = i;
  });
  const half = Math.ceil(p.items.length / 2) - (p.items.length % 2 ? 1 : 0); // 17 → 8 left, 9 right (as in the reference)
  const cardW = p.layout.cardW * 1080;
  const j = p.join;
  const jIn = j ? springAt(frame, fps, Math.round(j.start * fps), { damping: 15, stiffness: 140, mass: 0.8 }) : 0;
  const jOut = j ? interpolate(frame, [Math.round(j.end * fps) - 6, Math.round(j.end * fps)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
  return (
    <FontGate>
      <AbsoluteFill style={{ background: "#000" }}>
        <Sequence durationInFrames={p.mainFrames ?? p.durationInFrames} layout="none">
          <OffthreadVideo src={staticFile(p.main)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </Sequence>
        {p.outro && !inList && t < listEnd + 0.35 && (() => {
          // headline + panels fly out while the card grows into the canvas
          const k = prog(frame, Math.round(listEnd * fps), 8, easeOut);
          return (
            <AbsoluteFill style={{ opacity: 1 - k, transform: `translateY(${-k * 120}px)`, filter: `blur(${k * 8}px)` }}>
              <Headline p={p} frame={frame} />
              <Panel items={p.items.slice(0, half)} offset={0} active={p.items.length - 1} side="left" top={p.layout.panelsY} accent={p.accent} frame={frame} fps={fps} />
              <Panel items={p.items.slice(half)} offset={half} active={p.items.length - 1} side="right" top={p.layout.panelsY} accent={p.accent} frame={frame} fps={fps} />
            </AbsoluteFill>
          );
        })()}
        {p.outro && !inList && (
          <AboutMotion {...p.outro} cardFrom={{ x: p.layout.cardX * 1080 - cardW / 2, y: p.layout.cardY * 1920, w: cardW, h: cardW * (16 / 9) }} />
        )}
        {inList && (
          <>
            <Headline p={p} frame={frame} />
            <Panel items={p.items.slice(0, half)} offset={0} active={active} side="left" top={p.layout.panelsY} accent={p.accent} frame={frame} fps={fps} />
            <Panel items={p.items.slice(half)} offset={half} active={active} side="right" top={p.layout.panelsY} accent={p.accent} frame={frame} fps={fps} />
            <Card p={p}>
              {p.items.map((it, i) => (
                <Sequence key={i} from={Math.round(it.start * fps)} durationInFrames={Math.max(1, Math.round((it.end - it.start) * fps))}>
                  <OffthreadVideo src={staticFile(it.demo)} muted trimBefore={Math.round(it.demoFrom * fps) || undefined} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </Sequence>
              ))}
              <Counter n={active + 1} total={p.items.length} />
            </Card>
          </>
        )}
        {!p.outro && p.about && t >= p.about.start && t < p.about.end && (() => {
          const a = p.about!;
          const aIn = springAt(frame, fps, Math.round(a.start * fps), { damping: 15, stiffness: 140, mass: 0.8 });
          return (
            <Card p={p} style={{ transform: `translateY(${(1 - aIn) * 700}px) rotate(${(1 - aIn) * 4}deg)` }}>
              <AboutPage a={a} frame={frame} fps={fps} w={cardW - 14} h={cardW * (16 / 9) - 14} accent={p.accent} />
            </Card>
          );
        })()}
        {j && t >= j.start && t < j.end && (
          <Card p={p} style={{ transform: `translateY(${(1 - jIn) * 700 + jOut * 700}px) rotate(${(1 - jIn) * 4}deg)` }}>
            <JoinPage j={j} frame={frame} fps={fps} w={cardW - 14} accent={p.accent} />
          </Card>
        )}
        {!inList && !p.outro && <Captions p={p} t={t} fps={fps} />}
      </AbsoluteFill>
    </FontGate>
  );
};
