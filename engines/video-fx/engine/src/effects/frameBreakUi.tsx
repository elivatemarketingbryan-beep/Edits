import React from "react";
import { AbsoluteFill } from "remotion";
import { FONT } from "../lib/fonts";
import { ClipVideo } from "../lib/media";

const stroke = { fill: "none", stroke: "#fff", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

const Heart: React.FC<{ s: number; filled?: boolean }> = ({ s, filled }) => (
  <svg width={s} height={s} viewBox="0 0 24 24">
    <path d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 8 3.6 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.4 0 5.6 3.5 4.3 6.8-1.8 4.6-9.3 9.2-9.3 9.2z" {...stroke} fill={filled ? "#FF3040" : "none"} stroke={filled ? "#FF3040" : "#fff"} />
  </svg>
);
const Bubble: React.FC<{ s: number }> = ({ s }) => (
  <svg width={s} height={s} viewBox="0 0 24 24">
    <path d="M20.5 12a8.5 8.5 0 1 1-3.2-6.6A8.5 8.5 0 0 1 20.5 12zM20.5 12l1 7.5-5-2.4" {...stroke} />
  </svg>
);
const Plane: React.FC<{ s: number }> = ({ s }) => (
  <svg width={s} height={s} viewBox="0 0 24 24">
    <path d="M21.5 3 9.6 10.7M21.5 3l-7.3 18.3-4.6-10.6L2.5 7.2z" {...stroke} />
  </svg>
);
const Bookmark: React.FC<{ s: number }> = ({ s }) => (
  <svg width={s} height={s} viewBox="0 0 24 24">
    <path d="M6 3.5h12v17.5l-6-4.5-6 4.5z" {...stroke} fill="#fff" />
  </svg>
);
const Dots: React.FC<{ s: number }> = ({ s }) => (
  <svg width={s} height={s} viewBox="0 0 24 24">
    {[5, 12, 19].map((x) => (
      <circle key={x} cx={x} cy={12} r={1.8} fill="#fff" />
    ))}
  </svg>
);

/** Round avatar showing the speaker's face from the clip. */
const FaceAvatar: React.FC<{ d: number; fx: number; fy: number; ring?: string }> = ({ d, fx, fy, ring }) => (
  <div style={{ width: d, height: d, borderRadius: "50%", overflow: "hidden", position: "relative", flexShrink: 0, boxShadow: ring ? `0 0 0 ${d * 0.06}px ${ring}` : undefined, background: "#333" }}>
    {/* the full frame, sized so ~36% of its width spans the circle, face centred */}
    <div style={{ position: "absolute", width: d / 0.36, height: (d / 0.36) * (16 / 9), left: d / 2 - fx * (d / 0.36), top: d / 2 - fy * (d / 0.36) * (16 / 9) }}>
      <ClipVideo />
    </div>
  </div>
);

export type FeedUiProps = {
  platform: "reels" | "tiktok";
  username: string;
  caption: string;
  likes: string;
  comments: string;
  progress: number;
  /** px per design unit (window width / 400) */
  u: number;
  faceX: number;
  faceY: number;
  liked: boolean;
};

/** Reels / TikTok overlay chrome, laid out inside a phone window of width 400u. */
export const FeedUi: React.FC<FeedUiProps> = ({ platform, username, caption, likes, comments, progress, u, faceX, faceY, liked }) => {
  const text: React.CSSProperties = { color: "#fff", fontFamily: FONT.sans, textShadow: "0 1px 3px rgba(0,0,0,.45)" };
  const iconS = 27 * u;
  const count = (v: string) => (v ? <div style={{ ...text, fontSize: 11.5 * u, fontWeight: 600, marginTop: 3 * u }}>{v}</div> : null);
  const tiktok = platform === "tiktok";
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 58%, rgba(0,0,0,.55) 100%)" }} />
      {/* right rail */}
      <div style={{ position: "absolute", right: 11 * u, bottom: (tiktok ? 92 : 78) * u, display: "flex", flexDirection: "column", alignItems: "center", gap: 15 * u }}>
        {tiktok ? (
          <div style={{ position: "relative", marginBottom: 6 * u }}>
            <FaceAvatar d={40 * u} fx={faceX} fy={faceY} ring="#fff" />
            <div style={{ position: "absolute", left: "50%", bottom: -8 * u, transform: "translateX(-50%)", width: 17 * u, height: 17 * u, borderRadius: "50%", background: "#FE2C55", color: "#fff", fontSize: 14 * u, lineHeight: `${16 * u}px`, textAlign: "center", fontFamily: FONT.sans, fontWeight: 700 }}>+</div>
          </div>
        ) : null}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Heart s={iconS} filled={liked} />
          {count(likes)}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Bubble s={iconS} />
          {count(comments)}
        </div>
        {tiktok ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <Bookmark s={iconS * 0.92} />
          </div>
        ) : null}
        <Plane s={iconS * 0.95} />
        {tiktok ? null : <Dots s={iconS * 0.8} />}
      </div>
      {/* bottom-left meta */}
      <div style={{ position: "absolute", left: 13 * u, right: 64 * u, bottom: 22 * u }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 * u }}>
          {tiktok ? null : <FaceAvatar d={28 * u} fx={faceX} fy={faceY} />}
          <div style={{ ...text, fontWeight: 700, fontSize: 13.5 * u }}>{tiktok ? `@${username}` : username}</div>
          {tiktok ? null : (
            <div style={{ ...text, fontWeight: 600, fontSize: 11.5 * u, border: `${1.2 * u}px solid rgba(255,255,255,.85)`, borderRadius: 7 * u, padding: `${2.5 * u}px ${8 * u}px`, textShadow: "none" }}>Follow</div>
          )}
        </div>
        <div style={{ ...text, fontSize: 12.5 * u, fontWeight: 500, marginTop: 7 * u, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{caption}</div>
        {tiktok ? <div style={{ ...text, fontSize: 11.5 * u, marginTop: 6 * u, opacity: 0.9 }}>♫ original sound · {username}</div> : null}
      </div>
      {/* progress bar */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 3 * u, background: "rgba(255,255,255,.28)" }}>
        <div style={{ width: `${progress * 100}%`, height: "100%", background: "#fff" }} />
      </div>
    </AbsoluteFill>
  );
};
