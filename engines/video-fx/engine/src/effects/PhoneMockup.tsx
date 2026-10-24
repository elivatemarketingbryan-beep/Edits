import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { interpolate } from "../lib/interp";
import { clamp, easeInOut, easeOut, prog, springAt } from "../lib/anim";
import { useFx } from "../lib/context";
import { FONT } from "../lib/fonts";
import { ClipVideo, ConfigMedia } from "../lib/media";
import { IPhone } from "../lib/phone";
import { makeFx } from "../lib/shell";
import { ArrowUpGlyph, CheckGlyph, keywordTime } from "../lib/uikit";

type Tile = { label: string; value: number; color?: string };

/**
 * A floating iPhone beside the speaker's head. The app inside behaves like a chat
 * assistant: a message, a typing indicator, a recommendation card, then a tap on
 * the primary button that flips it to an approved state with a reply.
 */
const PhoneMockup: React.FC = () => {
  const frame = useCurrentFrame();
  const fx = useFx();
  const { cfg, fps, width, height, dur, subject, words } = fx;
  const k = width / 1080;
  const durSec = dur / fps;

  // ---------- layout ----------
  const pw = width * (cfg.size as number);
  const aspect = 2.07;
  const ph = pw * aspect;
  const side: "left" | "right" = cfg.side === "left" || cfg.side === "right" ? cfg.side : subject.centerX > width * 0.56 ? "left" : "right";
  const dir = side === "right" ? 1 : -1;
  const margin = width * 0.05;
  const left = side === "right" ? width - pw - margin : margin;
  let top: number;
  if (typeof cfg.y === "number") top = cfg.y * height;
  else top = clamp(subject.headY - ph * 0.42, height * 0.085, height * 0.62 - ph * 0.5);
  // pan the footage away from the phone so the face isn't covered
  let shift: number;
  if (typeof cfg.nudge === "number") shift = cfg.nudge * width;
  else {
    const faceEdge = side === "right" ? subject.centerX + width * 0.2 : width - (subject.centerX - width * 0.2);
    const phoneEdge = side === "right" ? left : width - (left + pw);
    shift = clamp((faceEdge - (phoneEdge - width * 0.015)) / 0.6, 0, width * 0.12);
  }

  // ---------- timing ----------
  const inF = fx.t(cfg.inAt, 0.05);
  const msgF = cfg.messageAt === "auto" ? inF + Math.round(0.35 * fps) : fx.t(cfg.messageAt);
  const cardF = cfg.cardAt === "auto" ? Math.max(msgF + Math.round(0.7 * fps), Math.round(0.28 * dur)) : fx.t(cfg.cardAt);
  let tapF: number;
  if (cfg.tapAt === "auto") {
    const kw = keywordTime(words.filter((w) => w.start * fps > cardF + fps * 0.6), ["approve", "click", "tap", "press", "done", "yes", "boom"]);
    tapF = kw !== null ? Math.round(kw * fps) : Math.round(Math.max(cardF + fps * 1.1, dur * 0.64));
    tapF = Math.min(tapF, dur - Math.round(fps * 0.9));
  } else tapF = fx.t(cfg.tapAt);
  const approvedF = tapF + 5;
  const replyF = approvedF + 12;
  const outF = cfg.outAt !== null && cfg.outAt !== undefined ? fx.t(cfg.outAt) : fx.endsEarly ? dur - 14 : dur + 1000;

  const enter = springAt(frame, fps, inF, { damping: 15, stiffness: 120, mass: 0.9 });
  const exit = prog(frame, outF, 14, easeInOut);
  const pan = interpolate(frame, [inF, inF + 18, outF, outF + 14], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeInOut });
  const s = 1 + (2 * shift * pan) / width;

  const tilt = cfg.tilt as number;
  const floatY = Math.sin(frame / 34) * 8 * k;
  const floatR = Math.sin(frame / 47) * 1.5;
  const offDist = side === "right" ? width - left + 40 * k : left + pw + 40 * k;
  const tx = dir * (1 - enter + exit) * offDist;

  // ---------- screen ----------
  const sw = pw - 2 * (pw * 0.03 + pw * 0.026);
  const u = sw / 100;
  const app = cfg.app as { name: string; status: string; avatarColor: string };
  const card = cfg.card as { label: string; title: string; tiles: Tile[] };
  const msgA = prog(frame, msgF, 10);
  const dotsA = interpolate(frame, [msgF + 8, msgF + 14, cardF - 4, cardF], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cardA = springAt(frame, fps, cardF, { damping: 14, stiffness: 150, mass: 0.7 });
  const approved = frame >= approvedF;
  const press = interpolate(frame, [tapF - 3, tapF, tapF + 5], [1, 0.9, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const replyA = prog(frame, replyF, 10);
  const touchA = interpolate(frame, [tapF - 14, tapF - 8, tapF + 6, tapF + 14], [0, 0.85, 0.85, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const touchMove = prog(frame, tapF - 14, 12, easeOut);
  const ripple = clamp((frame - tapF) / 12);

  const chatUI = (
    <div style={{ position: "absolute", inset: 0, fontFamily: FONT.sans, color: "#fff" }}>
      {/* header */}
      <div style={{ position: "absolute", top: u * 13, left: u * 5, right: u * 5, display: "flex", alignItems: "center", gap: u * 3 }}>
        <svg width={u * 3} height={u * 5} viewBox="0 0 6 10"><path d="M5 1 L1 5 L5 9" fill="none" stroke="#9a9aa2" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" /></svg>
        <div style={{ width: u * 9.5, height: u * 9.5, borderRadius: "50%", background: app.avatarColor, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width={u * 5} height={u * 5} viewBox="-10 -10 20 20"><path d="M0,-9 C1,-2 2,-1 9,0 C2,1 1,2 0,9 C-1,2 -2,1 -9,0 C-2,-1 -1,-2 0,-9Z" fill="#141414" /></svg>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: u * 0.6 }}>
          <div style={{ fontSize: u * 4.3, fontWeight: 600, letterSpacing: "-0.01em" }}>{app.name}</div>
          <div style={{ fontSize: u * 2.9, color: "#8e8e96", display: "flex", alignItems: "center", gap: u }}>
            <span style={{ width: u * 1.6, height: u * 1.6, borderRadius: "50%", background: "#32D74B" }} />
            {app.status}
          </div>
        </div>
      </div>
      <div style={{ position: "absolute", top: u * 26.5, left: 0, right: 0, height: 1, background: "rgba(255,255,255,0.08)" }} />
      {/* messages */}
      <div style={{ position: "absolute", top: u * 31, left: u * 5, right: u * 5, display: "flex", flexDirection: "column", gap: u * 3.5 }}>
        <div style={{ fontSize: u * 4.1, lineHeight: 1.35, color: "#E9E9EE", opacity: msgA, transform: `translateY(${(1 - msgA) * u * 3}px)` }}>{cfg.message}</div>
        <div style={{ position: "relative" }}>
          {dotsA > 0 ? (
            <div style={{ position: "absolute", top: 0, left: 0, padding: `${u * 2.2}px ${u * 3.5}px`, borderRadius: u * 5, background: "#1C1D21", display: "flex", gap: u * 1.3, opacity: dotsA }}>
              {[0, 1, 2].map((d) => (
                <span key={d} style={{ width: u * 1.7, height: u * 1.7, borderRadius: "50%", background: "#a3a3ab", opacity: 0.35 + 0.65 * Math.max(0, Math.sin((frame - d * 4) / 4)) }} />
              ))}
            </div>
          ) : null}
          {/* recommendation card */}
          <div
            style={{
              opacity: clamp(cardA * 1.4), transform: `translateY(${(1 - cardA) * u * 6}px) scale(${0.94 + 0.06 * cardA})`, transformOrigin: "50% 0%",
              background: "linear-gradient(180deg,#1E1F24,#18191D)", borderRadius: u * 5, border: "1px solid rgba(255,255,255,0.07)", padding: u * 4.5, boxShadow: `0 ${u * 2}px ${u * 6}px rgba(0,0,0,.35)`,
            }}
          >
            <div style={{ fontSize: u * 2.6, letterSpacing: "0.16em", color: "#9a9aa3", fontWeight: 600, display: "flex", alignItems: "center", gap: u * 1.2 }}>
              <span style={{ color: app.avatarColor }}>✦</span>
              {card.label}
            </div>
            <div style={{ marginTop: u * 2.2, fontSize: u * 5.4, lineHeight: 1.16, fontWeight: 700, letterSpacing: "-0.015em" }}>{card.title}</div>
            {card.tiles?.length ? (
              <div style={{ display: "flex", gap: u * 2.4, marginTop: u * 4 }}>
                {card.tiles.slice(0, 3).map((t, i) => {
                  const ta = prog(frame, cardF + 6 + i * 3, 10);
                  return (
                    <div key={i} style={{ flex: 1, opacity: ta, transform: `translateY(${(1 - ta) * u * 2}px)` }}>
                      <div style={{ height: u * 12, borderRadius: u * 2.4, background: "linear-gradient(180deg,#2a2b31,#222328)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width={u * 5} height={u * 4} viewBox="0 0 20 16"><rect x={1} y={1} width={18} height={14} rx={3} fill="none" stroke="#5c5d66" strokeWidth={1.5} /><circle cx={6.5} cy={6} r={1.8} fill="#5c5d66" /><path d="M2 14 L8 9 L12 12 L15 9.5 L19 13" fill="none" stroke="#5c5d66" strokeWidth={1.5} strokeLinejoin="round" /></svg>
                      </div>
                      <div style={{ fontSize: u * 2.6, color: "#8d8d95", marginTop: u * 1.4, fontWeight: 600 }}>{t.label}</div>
                      <div style={{ height: u * 1, borderRadius: u, background: "rgba(255,255,255,0.08)", marginTop: u * 1, overflow: "hidden" }}>
                        <div style={{ width: `${clamp(t.value) * 100 * prog(frame, cardF + 10 + i * 3, 16)}%`, height: "100%", borderRadius: u, background: t.color || ["#6FD38A", "#C8C8CF", "#E5706B"][i % 3] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
            <div style={{ display: "flex", alignItems: "center", gap: u * 5, marginTop: u * 4.5 }}>
              <div style={{ position: "relative", transform: `scale(${press})` }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: u * 1.2, padding: `${u * 2.2}px ${u * 6.5}px`, borderRadius: 999,
                  background: approved ? "#30D158" : "#F5F5F7", color: approved ? "#fff" : "#0B0B0C", fontSize: u * 3.8, fontWeight: 700, whiteSpace: "nowrap",
                }}>
                  {approved ? <CheckGlyph size={u * 4.2} color="#fff" stroke={3.4} progress={prog(frame, approvedF, 8)} /> : null}
                  {approved ? cfg.approvedLabel : cfg.button}
                </div>
                {/* touch indicator + ripple */}
                {touchA > 0 ? (
                  <div style={{
                    position: "absolute", left: "50%", top: "50%", width: u * 9, height: u * 9, marginLeft: -u * 4.5, marginTop: -u * 4.5, borderRadius: "50%",
                    background: "rgba(200,200,205,0.55)", border: `${u * 0.5}px solid rgba(255,255,255,0.7)`, opacity: touchA,
                    transform: `translate(${(1 - touchMove) * u * 14}px, ${(1 - touchMove) * u * 16}px) scale(${frame >= tapF - 2 && frame <= tapF + 4 ? 0.82 : 1})`,
                  }} />
                ) : null}
                {frame >= tapF && ripple < 1 ? (
                  <div style={{ position: "absolute", left: "50%", top: "50%", width: u * 9, height: u * 9, marginLeft: -u * 4.5, marginTop: -u * 4.5, borderRadius: "50%", border: `${u * 0.6}px solid rgba(255,255,255,${0.8 * (1 - ripple)})`, transform: `scale(${1 + ripple * 2.4})` }} />
                ) : null}
              </div>
              <div style={{ fontSize: u * 3.4, color: "#8e8e96", fontWeight: 600, opacity: approved ? 0.4 : 1 }}>{cfg.secondary}</div>
            </div>
          </div>
          {/* reply */}
          {cfg.reply ? (
            <div style={{ marginTop: u * 3.5, display: "flex", justifyContent: "flex-end", opacity: replyA, transform: `translateY(${(1 - replyA) * u * 3}px)` }}>
              <div style={{ maxWidth: "80%", padding: `${u * 2.4}px ${u * 3.6}px`, borderRadius: u * 4.5, background: app.avatarColor, color: "#141414", fontSize: u * 3.6, fontWeight: 600, lineHeight: 1.3 }}>{cfg.reply}</div>
            </div>
          ) : null}
        </div>
      </div>
      {/* composer */}
      <div style={{ position: "absolute", left: u * 4.5, right: u * 4.5, bottom: u * 8, display: "flex", alignItems: "center", gap: u * 2.4 }}>
        <div style={{ flex: 1, height: u * 9, borderRadius: 999, background: "#1A1B1F", border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", padding: `0 ${u * 4}px`, fontSize: u * 3.5, color: "#6f6f78" }}>Message</div>
        <div style={{ width: u * 9, height: u * 9, borderRadius: "50%", background: "#2B2C32", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ArrowUpGlyph size={u * 4.6} color="#c9c9d0" />
        </div>
      </div>
    </div>
  );

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: `translateX(${-dir * shift * pan}px) scale(${s})`, transformOrigin: `50% ${(subject.headY / height) * 100}%` }}>
        <ClipVideo />
      </AbsoluteFill>
      <AbsoluteFill style={{ perspective: 2200 * k }}>
        <div
          style={{
            position: "absolute", left, top: top + floatY, width: pw, height: ph,
            transform: `translateX(${tx}px) rotateY(${-dir * tilt + floatR}deg) rotateX(${tilt * 0.25}deg) rotateZ(${dir * (1 - enter) * 10 + dir * 1.2}deg)`,
            transformStyle: "preserve-3d",
            opacity: clamp(enter * 2) * (1 - exit),
          }}
        >
          <div style={{ position: "absolute", left: "8%", right: "8%", bottom: -ph * 0.03, height: ph * 0.08, borderRadius: "50%", background: "rgba(0,0,0,0.55)", filter: `blur(${30 * k}px)` }} />
          <div style={{ filter: `drop-shadow(0 ${26 * k}px ${40 * k}px rgba(0,0,0,0.45))` }}>
            <IPhone width={pw} aspect={aspect}>
              {cfg.screen ? <ConfigMedia src={cfg.screen} /> : chatUI}
            </IPhone>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default makeFx(PhoneMockup);
