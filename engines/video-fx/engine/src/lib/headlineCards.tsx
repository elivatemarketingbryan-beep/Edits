// Card designs for the headline-wall effect: paper headlines, quotes, tweets,
// search pills, POV cards, chat bubbles and notifications.
import React from "react";
import { FONT } from "./fonts";

export type CardType = "note" | "quote" | "tweet" | "search" | "pov" | "bubble" | "notify";
export type CardSpec = {
  type: CardType;
  text: string;
  /** small uppercase line above a note ("CREATOR BRIEFING") */
  kicker?: string;
  /** tweet author / notification title / quote byline */
  name?: string;
  handle?: string;
  /** word or phrase to mark with a yellow highlighter */
  highlight?: string;
  /** make this the big card that lands last */
  hero?: boolean;
};

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Text with an animated yellow marker behind `highlight` (progress 0..1). */
export const Marked: React.FC<{ text: string; highlight?: string; progress: number; color: string }> = ({ text, highlight, progress, color }) => {
  if (!highlight) return <>{text}</>;
  const re = new RegExp(`(${esc(highlight)})`, "i");
  const parts = text.split(re);
  return (
    <>
      {parts.map((p, i) =>
        re.test(p) && i % 2 === 1 ? (
          <span
            key={i}
            style={{
              backgroundImage: `linear-gradient(${color}, ${color})`,
              backgroundRepeat: "no-repeat",
              backgroundSize: `${progress * 100}% 78%`,
              backgroundPosition: "0 65%",
              padding: "0 0.06em",
              margin: "0 -0.06em",
              boxDecorationBreak: "clone",
              WebkitBoxDecorationBreak: "clone",
            }}
          >
            {p}
          </span>
        ) : (
          <React.Fragment key={i}>{p}</React.Fragment>
        ),
      )}
    </>
  );
};

/** Font size that keeps a headline of `len` characters inside a card `w` wide. */
const headlineSize = (w: number, len: number, base: number) => Math.max(w * 0.075, Math.min(w * base, (w * base * Math.sqrt(26)) / Math.sqrt(Math.max(8, len))));

const paper: React.CSSProperties = {
  background: "linear-gradient(160deg, #F7F3EA 0%, #EFE9DC 100%)",
  boxShadow: "inset 0 0 0 1px rgba(0,0,0,.05)",
};

const Icon: React.FC<{ d: string; s: number; color?: string }> = ({ d, s, color = "#9AA0A6" }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

export const Card: React.FC<{ spec: CardSpec; w: number; markProgress: number; accent: string; caret: boolean }> = ({ spec, w, markProgress, accent, caret }) => {
  const u = w / 300; // design unit: card designed at 300px wide
  const text = spec.text;
  const mark = (t: string) => <Marked text={t} highlight={spec.highlight} progress={markProgress} color={accent} />;

  switch (spec.type) {
    case "note":
      return (
        <div style={{ ...paper, width: w, padding: `${18 * u}px ${20 * u}px ${20 * u}px`, borderRadius: 3 * u }}>
          {spec.kicker ? (
            <div style={{ fontFamily: FONT.sans, fontWeight: 700, fontSize: 10.5 * u, letterSpacing: "0.16em", color: "#8C8577", textTransform: "uppercase", marginBottom: 10 * u, display: "flex", alignItems: "center", gap: 6 * u }}>
              <span style={{ width: 7 * u, height: 7 * u, borderRadius: 99, background: "#C9C2B4" }} />
              {spec.kicker}
            </div>
          ) : null}
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: headlineSize(w, text.length, 0.118), lineHeight: 1.04, color: "#15130F", letterSpacing: "-0.012em" }}>{mark(text)}</div>
        </div>
      );
    case "quote":
      return (
        <div style={{ ...paper, width: w, padding: `${20 * u}px ${22 * u}px`, borderRadius: 3 * u }}>
          <div style={{ fontFamily: FONT.display, fontStyle: "italic", fontWeight: 400, fontSize: headlineSize(w, text.length, 0.13), lineHeight: 1.06, color: "#15130F", letterSpacing: "-0.01em" }}>{mark(text)}</div>
          <div style={{ marginTop: 12 * u, fontFamily: FONT.sans, fontWeight: 600, fontSize: 11 * u, color: "#8C8577", display: "flex", alignItems: "center", gap: 6 * u }}>
            <span style={{ width: 16 * u, height: 16 * u, borderRadius: 99, background: "linear-gradient(135deg,#D9D2C3,#B8AF9C)" }} />
            {spec.name || "@founder"}
          </div>
        </div>
      );
    case "tweet":
      return (
        <div style={{ width: w, background: "#FFFFFF", borderRadius: 16 * u, padding: `${16 * u}px ${18 * u}px ${14 * u}px`, fontFamily: FONT.sans }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 * u, marginBottom: 9 * u }}>
            <div style={{ width: 30 * u, height: 30 * u, borderRadius: 99, background: "linear-gradient(135deg,#C7CBD1,#8E959E)" }} />
            <div style={{ lineHeight: 1.15 }}>
              <div style={{ fontWeight: 700, fontSize: 13.5 * u, color: "#0F1419" }}>{spec.name || "Creator"}</div>
              <div style={{ fontWeight: 500, fontSize: 11.5 * u, color: "#71767B" }}>{spec.handle || "@creator"}</div>
            </div>
          </div>
          <div style={{ fontWeight: 500, fontSize: Math.max(13 * u, Math.min(19 * u, (19 * u * Math.sqrt(40)) / Math.sqrt(Math.max(20, text.length)))), lineHeight: 1.25, color: "#0F1419", letterSpacing: "-0.005em" }}>{mark(text)}</div>
          <div style={{ display: "flex", gap: 30 * u, marginTop: 12 * u }}>
            <Icon s={14 * u} d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
            <Icon s={14 * u} d="M17 2l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3" />
            <Icon s={14 * u} d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21.2l8.8-8.8a5.5 5.5 0 0 0 0-7.8z" />
            <Icon s={14 * u} d="M4 12v8h16v-8M12 3v13M7 8l5-5 5 5" />
          </div>
        </div>
      );
    case "search":
      return (
        <div style={{ width: w, background: "#FFFFFF", borderRadius: 999, padding: `${12 * u}px ${18 * u}px`, display: "flex", alignItems: "center", gap: 10 * u, fontFamily: FONT.sans }}>
          <Icon s={17 * u} color="#5F6368" d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3" />
          <div style={{ fontWeight: 500, fontSize: Math.min(17 * u, (17 * u * 26) / Math.max(26, text.length)), color: "#202124", whiteSpace: "nowrap", overflow: "hidden" }}>
            {text}
            <span style={{ display: "inline-block", width: 1.6 * u, height: 17 * u, background: "#1A73E8", marginLeft: 2 * u, verticalAlign: "-3px", opacity: caret ? 1 : 0 }} />
          </div>
        </div>
      );
    case "pov":
      return (
        <div style={{ width: w, background: "#0E0E10", borderRadius: 12 * u, padding: `${18 * u}px ${20 * u}px`, fontFamily: FONT.sans, color: "#FFFFFF" }}>
          <div style={{ fontWeight: 800, fontSize: headlineSize(w, text.length + 5, 0.1), lineHeight: 1.12, letterSpacing: "-0.015em" }}>
            <span style={{ color: "#FFFFFF" }}>POV: </span>
            <span style={{ color: "#E8E8EA" }}>{mark(text)}</span>
          </div>
        </div>
      );
    case "bubble":
      return (
        <div style={{ position: "relative", width: w }}>
          <div style={{ background: "#FFFFFF", borderRadius: 20 * u, padding: `${12 * u}px ${16 * u}px`, fontFamily: FONT.sans, fontWeight: 500, fontSize: Math.min(17 * u, (17 * u * 28) / Math.max(28, text.length)), lineHeight: 1.25, color: "#111" }}>{mark(text)}</div>
          <svg width={18 * u} height={14 * u} viewBox="0 0 18 14" style={{ position: "absolute", left: 10 * u, bottom: -9 * u }}>
            <path d="M0 0 H14 C12 6 8 11 1 14 C4 9 3 4 0 0Z" fill="#FFFFFF" />
          </svg>
        </div>
      );
    case "notify":
    default:
      return (
        <div style={{ width: w, background: "rgba(246,246,248,.96)", borderRadius: 18 * u, padding: `${12 * u}px ${14 * u}px`, display: "flex", gap: 11 * u, alignItems: "flex-start", fontFamily: FONT.sans }}>
          <div style={{ width: 34 * u, height: 34 * u, borderRadius: 9 * u, flexShrink: 0, background: `linear-gradient(135deg, ${accent}, #F59E0B)` }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5 * u, color: "#6B6B70", fontWeight: 600 }}>
              <span style={{ color: "#111", fontWeight: 700 }}>{spec.name || "News"}</span>
              <span>now</span>
            </div>
            <div style={{ fontWeight: 500, fontSize: 14 * u, lineHeight: 1.25, color: "#1C1C1E", marginTop: 2 * u }}>{mark(text)}</div>
          </div>
        </div>
      );
  }
};
