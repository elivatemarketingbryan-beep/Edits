import React from "react";
import { AbsoluteFill } from "remotion";
import { clamp, easeOut, prog } from "../lib/anim";
import { FONT } from "../lib/fonts";

export const Burst: React.FC<{ s: number; color: string }> = ({ s, color }) => (
  <svg width={s} height={s} viewBox="-12 -12 24 24" style={{ display: "inline-block", verticalAlign: "middle" }}>
    {Array.from({ length: 10 }, (_, i) => (
      <rect key={i} x={-1.35} y={-11} width={2.7} height={9.5} rx={1.35} fill={color} transform={`rotate(${i * 36 + (i % 2) * 6})`} />
    ))}
  </svg>
);
const Check: React.FC<{ s: number }> = ({ s }) => (
  <svg width={s} height={s} viewBox="0 0 24 24">
    <path d="M6 12.5l4 4 8-9" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const Lock: React.FC<{ s: number; color: string }> = ({ s, color }) => (
  <svg width={s} height={s} viewBox="0 0 24 24">
    <rect x={5} y={10.5} width={14} height={10} rx={2} fill="none" stroke={color} strokeWidth={2} />
    <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" fill="none" stroke={color} strokeWidth={2} />
  </svg>
);
export const Cursor: React.FC<{ s: number }> = ({ s }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" style={{ filter: "drop-shadow(0 2px 3px rgba(0,0,0,.35))" }}>
    <path d="M5 2.5v17.2l4.6-4.3 3 6.6 3-1.4-3-6.4h6.3z" fill="#111" stroke="#fff" strokeWidth={1.5} strokeLinejoin="round" />
  </svg>
);

export type FocusUiText = {
  app: string;
  timer: string;
  task: string;
  tasks: string[];
  headline: string;
  input: string;
  button: string;
};

/**
 * Animated "focus sprint" productivity app (cream window between a purple band and a
 * blue band). `frame` is relative to the effect start. Vertical positions are px.
 */
export const FocusAppUi: React.FC<{
  frame: number;
  fps: number;
  width: number;
  height: number;
  text: FocusUiText;
  appear: number;
  headlineY: number;
  inputY: number;
  accent: string;
  topColor: [string, string];
  bottomColor: [string, string];
  cursorAt: number;
  showHeadline: boolean;
}> = ({ frame, fps, width: W, height: H, text, appear, headlineY, inputY, accent, topColor, bottomColor, cursorAt, showHeadline }) => {
  const k = W / 1080;
  const winL = 0.045 * W;
  const winW = W - 2 * winL;
  const winTop = 0.075 * H;
  const winBottom = inputY + 150 * k;
  const st = (i: number) => prog(appear * 30, i * 2.2, 10, easeOut); // staggered entrance from `appear`
  const rise = (i: number): React.CSSProperties => ({ opacity: st(i), transform: `translateY(${(1 - st(i)) * 26 * k}px)` });

  // countdown timer
  const [mm, ss] = text.timer.split(":").map((v) => Number(v) || 0);
  const total = Math.max(0, mm * 60 + ss - Math.floor(frame / fps));
  const tm = String(Math.floor(total / 60)).padStart(2, "0");
  const ts = String(total % 60).padStart(2, "0");
  const colonOn = Math.floor(frame / (fps / 2)) % 2 === 0;

  // task 1 tick, cursor path, click and typing
  const tick = prog(frame, Math.round(0.45 * fps), 8, easeOut);
  const cStart = cursorAt;
  const cMove = prog(frame, cStart, Math.round(0.55 * fps), easeOut);
  const clickF = cStart + Math.round(0.6 * fps);
  const press = frame >= clickF && frame < clickF + 4 ? 0.85 : 1;
  const ripple = prog(frame, clickF, 12);
  const typed = frame >= clickF ? Math.min(text.input.length, Math.floor(((frame - clickF) / fps) * 15)) : 0;
  const caretOn = Math.floor(frame / 8) % 2 === 0;
  const cx0 = W * 0.92;
  const cy0 = H * 0.86;
  const cx1 = winL + winW * 0.74;
  const cy1 = inputY + 52 * k;
  const curX = cx0 + (cx1 - cx0) * cMove + Math.sin(cMove * Math.PI) * -40 * k;
  const curY = cy0 + (cy1 - cy0) * cMove;

  const rowH = 84 * k;
  const listTop = winTop + 64 * k + 112 * k + 28 * k;

  return (
    <AbsoluteFill style={{ fontFamily: FONT.sans }}>
      <AbsoluteFill style={{ background: `linear-gradient(180deg, ${topColor[0]} 0%, ${topColor[1]} ${(winTop / H) * 100 + 6}%, ${bottomColor[0]} ${(winBottom / H) * 100}%, ${bottomColor[1]} 100%)` }} />
      {/* soft light in the bottom band */}
      <div style={{ position: "absolute", left: -0.15 * W, top: winBottom + 60 * k, width: 0.6 * W, height: 0.6 * W, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,.35) 0%, rgba(255,255,255,0) 70%)" }} />
      {/* app window */}
      <div style={{ position: "absolute", left: winL, top: winTop, width: winW, height: winBottom - winTop, background: "#F7F3EC", borderRadius: 26 * k, boxShadow: `0 ${24 * k}px ${60 * k}px rgba(20,10,60,.35)`, overflow: "hidden", ...rise(0) }}>
        {/* title bar */}
        <div style={{ height: 64 * k, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", borderBottom: `${1.5 * k}px solid #E7E1D6` }}>
          <div style={{ position: "absolute", left: 26 * k, display: "flex", gap: 10 * k }}>
            {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
              <div key={c} style={{ width: 15 * k, height: 15 * k, borderRadius: "50%", background: c }} />
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 * k, fontSize: 25 * k, color: "#4A4540", fontWeight: 500 }}>
            <Burst s={24 * k} color={accent} />
            {text.app}
          </div>
        </div>
        {/* focus bar */}
        <div style={{ height: 112 * k, background: "#151413", display: "flex", alignItems: "center", padding: `0 ${26 * k}px`, gap: 22 * k, ...rise(1) }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 * k, color: accent, fontSize: 17 * k, fontWeight: 700, letterSpacing: "0.14em" }}>
            <div style={{ width: 9 * k, height: 9 * k, borderRadius: "50%", background: accent, opacity: colonOn ? 1 : 0.35 }} />
            FOCUS
          </div>
          <div style={{ color: "#fff", fontSize: 62 * k, fontWeight: 600, letterSpacing: "-0.01em", fontVariantNumeric: "tabular-nums" }}>
            {tm}
            <span style={{ opacity: colonOn ? 1 : 0.3, color: "#9C968E", margin: `0 ${4 * k}px` }}>:</span>
            {ts}
          </div>
          <div style={{ color: "#fff", fontSize: 27 * k, fontWeight: 500, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{text.task}</div>
          <div style={{ color: "#EDE8E0", fontSize: 21 * k, fontWeight: 600, border: `${1.5 * k}px solid #5A5650`, borderRadius: 10 * k, padding: `${10 * k}px ${16 * k}px` }}>End sprint</div>
        </div>
        {/* task list */}
        {text.tasks.slice(0, 3).map((task, i) => {
          const active = i === 0;
          return (
            <div
              key={i}
              style={{
                position: "absolute", left: 24 * k, right: 24 * k, top: listTop - winTop + i * (rowH + 8 * k), height: rowH,
                display: "flex", alignItems: "center", gap: 18 * k, padding: `0 ${22 * k}px`, borderRadius: 16 * k,
                background: active ? "#FBEEE9" : "transparent", border: active ? `${2.5 * k}px solid ${accent}` : `${2.5 * k}px solid transparent`,
                ...rise(2 + i),
              }}
            >
              <div style={{ width: 34 * k, height: 34 * k, borderRadius: "50%", border: active ? "none" : `${2.5 * k}px solid #CFC9BF`, background: active ? accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transform: active ? `scale(${0.6 + 0.4 * tick + 0.15 * Math.sin(tick * Math.PI)})` : undefined }}>
                {active ? <Check s={26 * k} /> : null}
              </div>
              <div style={{ flex: 1, fontSize: 29 * k, fontWeight: active ? 600 : 500, color: active ? "#2A2622" : "#ABA59B" }}>{task}</div>
              {active ? (
                <div style={{ background: accent, color: "#fff", fontSize: 17 * k, fontWeight: 800, letterSpacing: "0.06em", padding: `${6 * k}px ${12 * k}px`, borderRadius: 8 * k, transform: `scale(${1 + 0.05 * Math.sin(frame / 5)})` }}>NOW</div>
              ) : (
                <Lock s={28 * k} color="#BDB6AB" />
              )}
            </div>
          );
        })}
      </div>
      {/* the big serif line, meant to sit behind the speaker's head */}
      {showHeadline && text.headline ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: headlineY, transform: "translateY(-50%)", display: "flex", justifyContent: "center", alignItems: "center", gap: 18 * k, ...rise(5) }}>
          <Burst s={54 * k} color={accent} />
          <div style={{ fontFamily: FONT.serif, fontSize: 84 * k, color: "#1E1B18", letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>{text.headline}</div>
        </div>
      ) : null}
      {/* input */}
      <div style={{ position: "absolute", left: winL + 26 * k, right: winL + 26 * k, top: inputY, height: 104 * k, background: "#fff", borderRadius: 24 * k, border: `${1.5 * k}px solid #E4DED4`, boxShadow: `0 ${8 * k}px ${24 * k}px rgba(60,40,20,.12)`, display: "flex", alignItems: "center", padding: `0 ${18 * k}px 0 ${30 * k}px`, ...rise(6) }}>
        <div style={{ flex: 1, fontSize: 31 * k, color: typed ? "#2A2622" : "#9E978C", whiteSpace: "nowrap", overflow: "hidden" }}>
          {typed ? text.input.slice(0, typed) : text.input}
          {typed && caretOn ? <span style={{ display: "inline-block", width: 2.5 * k, height: 34 * k, background: "#2A2622", marginLeft: 2 * k, verticalAlign: "middle" }} /> : null}
        </div>
        <div style={{ width: 62 * k, height: 62 * k, borderRadius: "50%", background: accent, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
          <svg width={30 * k} height={30 * k} viewBox="0 0 24 24">
            <path d="M12 19V5M6 11l6-6 6 6" fill="none" stroke="#fff" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
      {/* cursor */}
      {frame >= cStart ? (
        <div style={{ position: "absolute", left: curX, top: curY, transform: `scale(${press})`, transformOrigin: "0 0", opacity: clamp((frame - cStart) / 5) }}>
          {ripple > 0 && ripple < 1 ? (
            <div style={{ position: "absolute", left: -30 * k * ripple, top: -30 * k * ripple, width: 60 * k * ripple, height: 60 * k * ripple, borderRadius: "50%", border: `${3 * k}px solid rgba(0,0,0,${0.35 * (1 - ripple)})` }} />
          ) : null}
          <Cursor s={46 * k} />
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
