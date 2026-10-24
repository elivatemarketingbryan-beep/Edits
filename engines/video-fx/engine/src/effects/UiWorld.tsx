import React, { useMemo } from "react";
import { AbsoluteFill, Freeze, random, useCurrentFrame } from "remotion";
import { interpolate } from "../lib/interp";
import { clamp, easeInOut, easeOut, mix, prog, springAt } from "../lib/anim";
import { useFx } from "../lib/context";
import { FONT } from "../lib/fonts";
import { ClipVideo, ConfigMedia, MatteVideo } from "../lib/media";
import { makeFx } from "../lib/shell";
import { ArrowUpGlyph, Caret, keywordTime, PlayGlyph, Starburst, typed, UploadGlyph } from "../lib/uikit";

/**
 * "UI World": the top of the frame becomes a chat app. Clips fly into its drop zone,
 * a tape label sticks on and a slash command types itself out, while the speaker
 * sits in the bottom panel and breaks out of it over the app background.
 */
const UiWorld: React.FC = () => {
  const frame = useCurrentFrame();
  const fx = useFx();
  const { cfg, fps, width, height, dur, subject, words, hasMatte } = fx;
  const k = width / 1080;

  // ---------- layout ----------
  const bg = cfg.background as string;
  const splitY = (cfg.split as number) * height;
  const boxX = 57 * k;
  const boxW = width - boxX * 2;
  const boxY = 0.217 * height;
  const boxH = 0.221 * height;
  const titleY = 0.145 * height;
  const thumbW = 118 * k;
  const thumbH = 207 * k;
  const pad = 30 * k;
  const gap = 22 * k;
  const nThumbs = Math.max(1, Math.min(6, cfg.clips as number));
  // move the footage down so the head sits just under the composer
  const targetHead = boxY + boxH + 46 * k;
  const dy = typeof cfg.shift === "number" ? cfg.shift * height : Math.max(0, targetHead - subject.headTop);

  // ---------- timing ----------
  const inF = fx.t(cfg.inAt, 0);
  let dropSec: number;
  if (cfg.dropAt === "auto") dropSec = keywordTime(words, ["drop", "upload", "clip", "file", "raw", "footage", "video"]) ?? 0.25;
  else dropSec = fx.t(cfg.dropAt) / fps;
  const dropF = Math.max(inF + 8, Math.round(dropSec * fps));
  const stagger = 4;
  const flyDur = 16;
  const landed = (i: number) => dropF + i * stagger + flyDur;
  const allLanded = landed(nThumbs - 1);
  const labelF = cfg.labelAt === "auto" ? allLanded + 6 : fx.t(cfg.labelAt);
  let typeF: number;
  if (cfg.typeAt === "auto") {
    const kw = keywordTime(words.filter((w) => w.start * fps > labelF + 4), ["trigger", "type", "run", "skill", "command", "slash", "prompt", "claude", "editor", "ask"]);
    typeF = kw !== null ? Math.round(kw * fps) : Math.max(labelF + Math.round(0.6 * fps), Math.round(0.5 * dur));
  } else typeF = fx.t(cfg.typeAt);
  typeF = Math.max(typeF, allLanded + 4);
  const command = String(cfg.command);
  const tp = typed(command, frame, typeF, fps, cfg.typeSpeed as number, "cmd");
  const sendF = cfg.sendAt === "auto" ? Math.round(tp.end + 0.35 * fps) : fx.t(cfg.sendAt);
  const outF = cfg.outAt !== null && cfg.outAt !== undefined ? fx.t(cfg.outAt) : fx.endsEarly ? dur - 14 : dur + 1000;

  const intro = cfg.intro === "cut" ? 1 : prog(frame, inF, 12, easeInOut);
  const exit = prog(frame, outF, 14, easeInOut);
  const world = intro * (1 - exit);
  const vidDy = dy * world;

  // ---------- thumbnails ----------
  const thumbs = useMemo(() => {
    const list: (string | number)[] = Array.isArray(cfg.thumbs) && cfg.thumbs.length ? (cfg.thumbs as string[]) : [];
    return Array.from({ length: nThumbs }, (_, i) => (list.length ? list[i % list.length] : Math.round(((i + 0.5) / nThumbs) * (dur - 1))));
  }, [cfg.thumbs, nThumbs, dur]);

  const morph = prog(frame, dropF + flyDur - 2, 10, easeOut); // drop zone → composer
  const labelP = springAt(frame, fps, labelF, { damping: 10, stiffness: 180, mass: 0.6 });
  const hasText = tp.n > 0;
  const sendPress = interpolate(frame, [sendF - 2, sendF + 1, sendF + 6], [1, 0.84, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const sendRipple = clamp((frame - sendF) / 12);
  const accent = cfg.accent as string;


  const uiOpacity = world;
  return (
    <AbsoluteFill style={{ backgroundColor: bg }}>
      {/* footage, shifted down */}
      <AbsoluteFill style={{ transform: `translateY(${vidDy}px)` }}>
        <ClipVideo />
      </AbsoluteFill>
      {/* app background over the top of the frame */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: splitY, background: bg, transform: `translateY(${-(1 - world) * splitY}px)` }}>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 2 * k, background: "rgba(0,0,0,0.06)" }} />
      </div>
      {/* the speaker breaks out over the app background */}
      {hasMatte ? (
        <AbsoluteFill style={{ transform: `translateY(${vidDy}px)`, opacity: clamp(world * 3) }}>
          <MatteVideo />
        </AbsoluteFill>
      ) : null}
      {/* app UI */}
      <AbsoluteFill style={{ opacity: uiOpacity, transform: `translateY(${-(1 - world) * 80 * k}px)`, fontFamily: FONT.sans }}>
        {/* title */}
        <div style={{ position: "absolute", left: 0, right: 0, top: titleY - 40 * k, height: 80 * k, display: "flex", alignItems: "center", justifyContent: "center", gap: 16 * k }}>
          <Starburst size={50 * k} color={accent} rotate={frame * 0.6} />
          <span style={{ fontFamily: FONT.serif, fontSize: 66 * k, color: "#22201C", letterSpacing: "-0.01em" }}>{cfg.appName}</span>
        </div>
        {/* drop zone / composer */}
        <div
          style={{
            position: "absolute", left: boxX, top: boxY, width: boxW, height: boxH, boxSizing: "border-box", borderRadius: 30 * k,
            background: `rgba(255,255,255,${mix(0.35, 1, morph)})`,
            border: `${3 * k}px ${morph < 0.5 ? "dashed" : "solid"} rgba(${morph < 0.5 ? "190,160,135" : "226,220,208"},${mix(0.9, 1, morph)})`,
            boxShadow: `0 ${14 * k}px ${40 * k}px rgba(60,40,20,${0.1 * morph}), 0 ${2 * k}px ${4 * k}px rgba(60,40,20,${0.05 * morph})`,
          }}
        >
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 12 * k, fontSize: 34 * k, fontWeight: 500, color: "#A9775E", opacity: 1 - morph }}>
            <UploadGlyph size={34 * k} color="#A9775E" />
            Drop files here
          </div>
          {/* composer text */}
          <div style={{ position: "absolute", left: pad + 4 * k, right: pad, top: pad + thumbH + 26 * k, fontSize: 34 * k, opacity: morph, display: "flex", alignItems: "center", whiteSpace: "nowrap" }}>
            {hasText ? (
              <span style={{ color: "#1E1D1A" }}>
                {tp.shown}
                <Caret frame={frame} height={40 * k} width={3 * k} color="#1E1D1A" solid={!tp.done} />
              </span>
            ) : (
              <span style={{ color: "#A3A09A" }}>
                <Caret frame={frame} height={40 * k} width={3 * k} color="#1E1D1A" />
                {cfg.placeholder}
              </span>
            )}
          </div>
          {/* toolbar */}
          <div style={{ position: "absolute", left: pad, right: pad, bottom: 22 * k, height: 60 * k, display: "flex", alignItems: "center", justifyContent: "space-between", opacity: morph }}>
            <div style={{ display: "flex", gap: 30 * k, color: "#8B877F", fontSize: 40 * k, fontWeight: 300, alignItems: "center" }}>
              <span>+</span>
              <svg width={34 * k} height={34 * k} viewBox="0 0 24 24"><path d="M4 7 H14 M18 7 H20 M4 17 H8 M12 17 H20" stroke="#8B877F" strokeWidth={2} strokeLinecap="round" /><circle cx={16} cy={7} r={2.2} fill="none" stroke="#8B877F" strokeWidth={2} /><circle cx={10} cy={17} r={2.2} fill="none" stroke="#8B877F" strokeWidth={2} /></svg>
            </div>
            <div style={{ position: "relative" }}>
              <div style={{ width: 58 * k, height: 58 * k, borderRadius: 16 * k, background: hasText ? accent : "#F2C9B6", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${sendPress})` }}>
                <ArrowUpGlyph size={32 * k} color="#fff" />
              </div>
              {frame >= sendF && sendRipple < 1 ? <div style={{ position: "absolute", inset: 0, borderRadius: 16 * k, border: `${3 * k}px solid ${accent}`, opacity: 1 - sendRipple, transform: `scale(${1 + sendRipple * 0.9})` }} /> : null}
            </div>
          </div>
          {/* tape label */}
          {frame >= labelF - 1 ? (
            <div
              style={{
                position: "absolute", left: pad + nThumbs * (thumbW + gap) + 10 * k, top: pad + thumbH * 0.32,
                padding: `${10 * k}px ${20 * k}px`, background: "linear-gradient(180deg,#FBEA6E,#F2D94A)", color: "#3A3410",
                fontWeight: 800, fontSize: 30 * k, letterSpacing: "0.02em", whiteSpace: "nowrap",
                transform: `rotate(${mix(-14, -3, labelP)}deg) scale(${mix(1.5, 1, labelP)})`, opacity: clamp(labelP * 2),
                boxShadow: `0 ${4 * k}px ${10 * k}px rgba(120,100,0,0.18)`, clipPath: "polygon(2% 6%, 98% 0%, 100% 92%, 1% 100%)",
              }}
            >
              {cfg.label}
            </div>
          ) : null}
        </div>
        {/* flying thumbnails */}
        {thumbs.map((src, i) => {
          const s0 = dropF + i * stagger;
          const p = clamp((frame - s0) / flyDur);
          if (frame < s0) return null;
          const e = easeInOut(p);
          const settle = springAt(frame, fps, s0 + flyDur - 2, { damping: 9, stiffness: 220, mass: 0.5 });
          const tx = boxX + pad + i * (thumbW + gap);
          const ty = boxY + pad;
          const sx = width * (0.62 + random(`tx${i}`) * 0.32);
          const sy = -thumbH * 1.3 - random(`ty${i}`) * 140 * k;
          const cx = mix(sx, tx, 0.45) + (random(`cx${i}`) - 0.5) * 200 * k;
          const cy = Math.min(sy, ty) - 120 * k;
          const x = (1 - e) * (1 - e) * sx + 2 * (1 - e) * e * cx + e * e * tx;
          const y = (1 - e) * (1 - e) * sy + 2 * (1 - e) * e * cy + e * e * ty;
          const rot = mix((random(`r${i}`) - 0.5) * 50, 0, e);
          const sc = p < 1 ? mix(1.15, 1.04, e) : mix(1.06, 1, settle);
          return (
            <div key={i} style={{ position: "absolute", left: x, top: y, width: thumbW, height: thumbH, transform: `rotate(${rot}deg) scale(${sc})`, borderRadius: 16 * k, overflow: "hidden", boxShadow: `0 ${(p < 1 ? 26 : 8) * k}px ${(p < 1 ? 40 : 16) * k}px rgba(30,20,10,${p < 1 ? 0.35 : 0.22})`, border: `${3 * k}px solid rgba(255,255,255,0.9)`, background: "#222" }}>
              {typeof src === "number" ? (
                <Freeze frame={src}>
                  <ClipVideo />
                </Freeze>
              ) : (
                <ConfigMedia src={src} />
              )}
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <PlayGlyph size={34 * k} />
              </div>
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default makeFx(UiWorld);
