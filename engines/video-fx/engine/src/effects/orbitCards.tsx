import React from "react";
import { AbsoluteFill, Freeze } from "remotion";
import { FONT } from "../lib/fonts";
import { ClipVideo, ConfigMedia } from "../lib/media";

export type OrbitCardData = {
  /** image/video path from config; when missing the card shows a still frame of the clip */
  src?: string;
  /** clip frame to freeze when there is no src */
  frame?: number;
  title?: string;
  views?: string;
  style?: "reel" | "post";
};

const PlayIcon: React.FC<{ s: number }> = ({ s }) => (
  <svg width={s} height={s} viewBox="0 0 10 10" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <path d="M2 1.2 L8.6 5 L2 8.8 Z" fill="none" stroke="#fff" strokeWidth={1.3} strokeLinejoin="round" />
  </svg>
);

const Media: React.FC<{ card: OrbitCardData }> = ({ card }) =>
  card.src ? (
    <ConfigMedia src={card.src} />
  ) : (
    <Freeze frame={card.frame ?? 0}>
      <ClipVideo offset={0} />
    </Freeze>
  );

/** A small social-post card (Reel thumbnail or text post) at base width `w` px. */
export const OrbitCard: React.FC<{ card: OrbitCardData; w: number }> = ({ card, w }) => {
  const h = w * 1.72;
  const u = w / 100; // design unit
  const radius = 7 * u;
  if (card.style === "post") {
    return (
      <div style={{ width: w, height: h, borderRadius: radius, background: "#FBFBF8", overflow: "hidden", boxShadow: `0 ${3 * u}px ${9 * u}px rgba(0,0,0,.35)`, border: `${0.8 * u}px solid rgba(255,255,255,.9)`, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 3 * u, padding: `${5 * u}px ${5 * u}px ${3 * u}px` }}>
          <div style={{ width: 9 * u, height: 9 * u, borderRadius: "50%", overflow: "hidden", position: "relative", flexShrink: 0, background: "#ddd" }}>
            <AbsoluteFill style={{ transform: "scale(3.2)", transformOrigin: "50% 22%" }}>
              <Media card={card} />
            </AbsoluteFill>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ height: 2.2 * u, width: "55%", background: "#1d1d1f", borderRadius: u, opacity: 0.85 }} />
            <div style={{ height: 1.8 * u, width: "35%", background: "#9a9a9a", borderRadius: u, marginTop: 1.5 * u }} />
          </div>
        </div>
        {card.title ? (
          <div style={{ padding: `0 ${5 * u}px ${3.5 * u}px`, fontFamily: FONT.sans, fontWeight: 700, fontSize: 7.4 * u, lineHeight: 1.18, color: "#111", letterSpacing: "-0.01em" }}>{card.title}</div>
        ) : null}
        <div style={{ position: "relative", flex: 1, margin: `0 ${4 * u}px ${4 * u}px`, borderRadius: 4 * u, overflow: "hidden" }}>
          <Media card={card} />
        </div>
      </div>
    );
  }
  return (
    <div style={{ width: w, height: h, borderRadius: radius, overflow: "hidden", position: "relative", boxShadow: `0 ${3 * u}px ${10 * u}px rgba(0,0,0,.38)`, border: `${0.9 * u}px solid rgba(255,255,255,.92)`, background: "#222" }}>
      <AbsoluteFill>
        <Media card={card} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,.18) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 70%, rgba(0,0,0,.45) 100%)" }} />
      {card.title ? (
        <div style={{ position: "absolute", top: 12 * u, left: 7 * u, right: 7 * u, textAlign: "center" }}>
          <span style={{ background: "#fff", color: "#111", fontFamily: FONT.sans, fontWeight: 800, fontSize: 7 * u, lineHeight: 1.32, padding: `${0.8 * u}px ${2.2 * u}px`, boxDecorationBreak: "clone", WebkitBoxDecorationBreak: "clone", borderRadius: 1.5 * u, textTransform: "uppercase", letterSpacing: "-0.01em" }}>
            {card.title}
          </span>
        </div>
      ) : null}
      {card.views ? (
        <div style={{ position: "absolute", left: 5 * u, bottom: 5 * u, color: "#fff", fontFamily: FONT.sans, fontWeight: 700, fontSize: 7.5 * u, display: "flex", alignItems: "center", gap: 1.6 * u, textShadow: "0 1px 4px rgba(0,0,0,.6)" }}>
          <PlayIcon s={7 * u} />
          {card.views}
        </div>
      ) : null}
    </div>
  );
};
