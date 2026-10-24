import React from "react";
import { FONT } from "./fonts";

/**
 * A modern iPhone drawn in CSS: titanium frame, black bezel, dynamic island,
 * status bar and home indicator. `children` fill the screen (below the status bar
 * when `statusBar` is on, otherwise edge to edge with the bar drawn on top).
 */
export const IPhone: React.FC<{
  width: number;
  aspect?: number;
  children: React.ReactNode;
  dark?: boolean;
  time?: string;
  screenBg?: string;
}> = ({ width, aspect = 2.07, children, dark = true, time = "9:41", screenBg = "#0D0E10" }) => {
  const h = width * aspect;
  const frame = width * 0.03;
  const bezel = width * 0.026;
  const outerR = width * 0.165;
  const screenR = outerR - frame - bezel * 0.6;
  const fg = dark ? "#FFFFFF" : "#0B0B0C";
  const u = width / 100;
  return (
    <div style={{ position: "relative", width, height: h }}>
      {/* side buttons */}
      {[
        { side: "left", top: 0.2, len: 0.045 },
        { side: "left", top: 0.27, len: 0.08 },
        { side: "left", top: 0.37, len: 0.08 },
        { side: "right", top: 0.3, len: 0.12 },
      ].map((b, i) => (
        <div key={i} style={{ position: "absolute", [b.side]: -u * 0.9, top: h * b.top, width: u * 1.4, height: h * b.len, borderRadius: u, background: "linear-gradient(90deg,#55565a,#2b2c2f)" }} />
      ))}
      {/* titanium frame */}
      <div
        style={{
          position: "absolute", inset: 0, borderRadius: outerR,
          background: "linear-gradient(135deg,#6b6c70 0%,#2a2b2e 22%,#4a4b4f 50%,#232427 78%,#5d5e62 100%)",
          boxShadow: `inset 0 0 ${u * 0.6}px rgba(255,255,255,.35), 0 ${u * 0.5}px ${u}px rgba(0,0,0,.4)`,
        }}
      />
      {/* black bezel */}
      <div style={{ position: "absolute", inset: frame, borderRadius: outerR - frame, background: "#050506" }} />
      {/* screen */}
      <div style={{ position: "absolute", inset: frame + bezel, borderRadius: screenR, overflow: "hidden", background: screenBg }}>
        {children}
        {/* status bar */}
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: u * 11, display: "flex", alignItems: "center", justifyContent: "space-between", padding: `0 ${u * 8}px`, boxSizing: "border-box", fontFamily: FONT.sans, fontWeight: 600, fontSize: u * 4, color: fg, pointerEvents: "none" }}>
          <span style={{ letterSpacing: "-0.01em" }}>{time}</span>
          <span style={{ display: "flex", alignItems: "center", gap: u * 1.2 }}>
            <svg width={u * 4.6} height={u * 3} viewBox="0 0 18 12">
              {[0, 1, 2, 3].map((i) => (
                <rect key={i} x={i * 4.6} y={9 - i * 2.8} width={3.2} height={3 + i * 2.8} rx={0.8} fill={fg} />
              ))}
            </svg>
            <svg width={u * 4.2} height={u * 3} viewBox="0 0 16 12">
              <path d="M8 11.2 L5.6 8.6 A3.4 3.4 0 0 1 10.4 8.6 Z M3.2 6.2 A6.8 6.8 0 0 1 12.8 6.2 L11.4 7.6 A4.8 4.8 0 0 0 4.6 7.6 Z M0.8 3.8 A10.2 10.2 0 0 1 15.2 3.8 L13.8 5.2 A8.2 8.2 0 0 0 2.2 5.2 Z" fill={fg} />
            </svg>
            <svg width={u * 6.4} height={u * 3} viewBox="0 0 26 12">
              <rect x={0.6} y={0.6} width={22} height={10.8} rx={3} fill="none" stroke={fg} strokeOpacity={0.45} strokeWidth={1.2} />
              <rect x={2.4} y={2.4} width={18.4} height={7.2} rx={1.8} fill={fg} />
              <rect x={23.6} y={4} width={1.8} height={4} rx={0.9} fill={fg} fillOpacity={0.45} />
            </svg>
          </span>
        </div>
        {/* dynamic island */}
        <div style={{ position: "absolute", left: "50%", top: u * 2.6, width: u * 29, height: u * 8.4, marginLeft: -u * 14.5, borderRadius: u * 5, background: "#000" }} />
        {/* home indicator */}
        <div style={{ position: "absolute", left: "50%", bottom: u * 2.2, width: u * 36, height: u * 1.3, marginLeft: -u * 18, borderRadius: u, background: fg, opacity: 0.55 }} />
        {/* glass sheen */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(115deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0) 38%, rgba(255,255,255,0) 70%, rgba(255,255,255,0.04) 100%)", pointerEvents: "none" }} />
      </div>
    </div>
  );
};
