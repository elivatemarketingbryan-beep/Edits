import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { interpolate } from "../lib/interp";
import { clamp, easeInOut, easeOut, mix, prog, springAt } from "../lib/anim";
import { Captions } from "../lib/captions";
import { useFx } from "../lib/context";
import { FONT } from "../lib/fonts";
import { ClipVideo } from "../lib/media";
import { makeFx } from "../lib/shell";
import { CheckGlyph, Spinner, waveform } from "../lib/uikit";

/** Rolling odometer digits for 0-100. */
const Odometer: React.FC<{ value: number; size: number; color: string }> = ({ value, size, color }) => {
  const lh = size * 1.2; // taller cells than the glyphs, so neighbouring digits never peek in
  const places = [2, 1, 0];
  return (
    <div style={{ display: "flex", fontFamily: "'Bodoni Moda', Didot, serif", fontWeight: 700, fontSize: size, color, height: lh, overflow: "hidden", letterSpacing: "-0.03em" }}>
      {places.map((k) => {
        const p = 10 ** k;
        if (value < p && k > 0) {
          // hidden leading digit; fades in as it is about to appear
          const near = clamp((value - (p - 1)) / 1);
          if (near <= 0) return null;
        }
        const vk = value / p;
        const base = Math.floor(vk);
        const lower = value - base * p; // remainder below this place
        const carry = k === 0 ? vk - base : clamp(lower - (p - 1));
        const off = (((base % 10) + carry) % 10 + 10) % 10;
        return (
          <div key={k} style={{ height: lh, overflow: "hidden" }}>
            <div style={{ transform: `translateY(${-off * lh}px)` }}>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d, i) => (
                <div key={i} style={{ height: lh, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>{d}</div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/**
 * The shot pulls back into an editor window on a cream desk: an agent panel ticks
 * through its steps, a render bar with a waveform fills, a big serif % counter
 * rolls to 100 and the window turns green when the render is done.
 */
const PullBackReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const fx = useFx();
  const { cfg, fps, width, height, dur } = fx;
  const k = width / 1080;

  // ---------- timing ----------
  const pullF = fx.t(cfg.pullAt, 0.1);
  const pullDur = Math.max(6, Math.round((cfg.pullDuration as number) * fps));
  const pullEnd = pullF + pullDur;
  const doneF = cfg.doneAt === "auto" ? Math.max(pullEnd + Math.round(1.2 * fps), dur - Math.round(0.7 * fps)) : fx.t(cfg.doneAt);
  const returnF = cfg.returnAt !== null && cfg.returnAt !== undefined ? fx.t(cfg.returnAt) : fx.endsEarly ? dur - 16 : dur + 1000;
  const counterF = cfg.counterAt === "auto" ? Math.max(pullEnd + 4, doneF - Math.round(0.9 * fps)) : fx.t(cfg.counterAt);
  const panelF = pullEnd - 6;

  const p = prog(frame, pullF, pullDur, easeInOut) * (1 - prog(frame, returnF, 16, easeInOut));
  const chrome = clamp((p - 0.55) / 0.45);

  // ---------- layout ----------
  const winX = (cfg.windowX as number) * width;
  const winW = (cfg.windowWidth as number) * width;
  const barTop = 50 * k;
  const barBottom = 124 * k;
  const vidH = winW / (cfg.videoAspect as number);
  const winH = barTop + vidH + barBottom;
  const winY = Math.max(0.1 * height, (height - winH) / 2 - 0.04 * height);
  const boxFinal = { x: winX, y: winY + barTop, w: winW, h: vidH };
  const box = { x: mix(0, boxFinal.x, p), y: mix(0, boxFinal.y, p), w: mix(width, boxFinal.w, p), h: mix(height, boxFinal.h, p) };
  const s = mix(1, boxFinal.w / width, p);

  const totalFrames: number = cfg.frames === "auto" ? Math.max(30, Math.round(dur)) : (cfg.frames as number);
  const steps: string[] = (cfg.steps as string[]).map((t) => t.replace("{frames}", String(totalFrames)));
  const stepDone = (i: number) => Math.round(mix(panelF + 0.25 * fps, doneF - 0.25 * fps, (i + 1) / steps.length));
  const renderP = interpolate(frame, [panelF, doneF], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (t) => 1 - (1 - t) ** 1.6 });
  const done = frame >= doneF;
  const doneP = prog(frame, doneF, 10, easeOut);
  const count = interpolate(frame, [counterF, doneF], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeInOut });
  const counterA = prog(frame, counterF - 4, 10) * (1 - prog(frame, returnF, 8));
  const badge = springAt(frame, fps, doneF, { damping: 9, stiffness: 200, mass: 0.6 });
  const panelP = springAt(frame, fps, panelF, { damping: 16, stiffness: 140, mass: 0.8 }) * (1 - prog(frame, returnF, 10));

  const wave = useMemo(() => waveform(90, "pbr"), []);
  const accent = cfg.accent as string;
  const green = "#3DBE7A";
  const ink = "#1C1B18";

  return (
    <AbsoluteFill style={{ backgroundColor: cfg.background }}>
      {/* soft desk shading */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 60% 40%, rgba(255,255,255,0.55), rgba(0,0,0,0.04) 80%)", opacity: p }} />
      {/* window chrome (behind the video box) */}
      <div
        style={{
          position: "absolute", left: box.x, top: box.y - barTop * chrome, width: box.w, height: box.h + (barTop + barBottom) * chrome,
          borderRadius: 22 * k * p, background: "#FFFFFF", opacity: chrome,
          border: `${(done ? 3 : 1.5) * k}px solid ${done ? green : "#E2DDD2"}`,
          boxShadow: `0 ${30 * k}px ${80 * k}px rgba(40,30,10,0.16), 0 0 ${done ? 30 * k * doneP : 0}px ${green}66`,
          boxSizing: "border-box", fontFamily: FONT.mono,
        }}
      >
        {/* title bar */}
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: barTop, display: "flex", alignItems: "center", padding: `0 ${18 * k}px`, boxSizing: "border-box", fontSize: 20 * k, color: "#4A4740" }}>
          <div style={{ display: "flex", gap: 8 * k }}>
            {[0, 1, 2].map((i) => <span key={i} style={{ width: 13 * k, height: 13 * k, borderRadius: "50%", background: "#D9D5CC" }} />)}
          </div>
          <div style={{ flex: 1, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 * k }}>
            <svg width={18 * k} height={18 * k} viewBox="0 0 16 16"><rect x={1.5} y={2.5} width={13} height={11} rx={2} fill="none" stroke="#6b675e" strokeWidth={1.4} /><path d="M6.5 6 L10 8 L6.5 10Z" fill="#6b675e" /></svg>
            {cfg.filename}
          </div>
          <div style={{ fontFamily: FONT.sans, fontWeight: 700, fontSize: 20 * k, color: ink }}>{cfg.tab}</div>
        </div>
        {/* render bar */}
        <div style={{ position: "absolute", left: 18 * k, right: 18 * k, bottom: 16 * k, height: barBottom - 30 * k }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 19 * k, color: done ? green : "#6E6A61", height: 30 * k, alignItems: "center" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 8 * k }}>
              {done ? <CheckGlyph size={20 * k} color={green} stroke={3} /> : <span style={{ width: 9 * k, height: 9 * k, borderRadius: "50%", background: accent, opacity: 0.5 + 0.5 * Math.sin(frame / 3) }} />}
              {done ? "done" : "rendering"}
            </span>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>{String(Math.round(renderP * totalFrames)).padStart(3, "0")} / {totalFrames}</span>
          </div>
          <div style={{ position: "relative", marginTop: 10 * k, height: 54 * k, borderRadius: 10 * k, overflow: "hidden", background: done ? "#DDF3E5" : "#EFEBE2" }}>
            {/* waveform */}
            <div style={{ position: "absolute", inset: `0 ${8 * k}px`, display: "flex", alignItems: "center", gap: 2 * k }}>
              {wave.map((h, i) => {
                const filled = i / wave.length <= renderP;
                return <div key={i} style={{ flex: 1, height: `${h * 70}%`, borderRadius: 2 * k, background: done ? "#1E9E5A" : filled ? "#FFFFFF" : "#CFC9BC", opacity: filled || done ? 0.95 : 0.8 }} />;
              })}
            </div>
            {/* fill */}
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${renderP * 100}%`, background: done ? "transparent" : accent, mixBlendMode: "multiply", opacity: 0.9 }} />
            {!done ? <div style={{ position: "absolute", top: 0, bottom: 0, left: `calc(${renderP * 100}% - ${1.5 * k}px)`, width: 3 * k, background: "#1F3C88" }} /> : null}
          </div>
        </div>
      </div>
      {/* the footage, shrinking into the window */}
      <div style={{ position: "absolute", left: box.x, top: box.y, width: box.w, height: box.h, overflow: "hidden", borderRadius: 4 * k * p }}>
        <div style={{ position: "absolute", left: (box.w - width * s) / 2, top: (box.h - height * s) / 2, width, height, transform: `scale(${s})`, transformOrigin: "0 0" }}>
          <ClipVideo />
          <Captions words={fx.words} cfg={fx.captions} />
        </div>
      </div>
      {/* agent panel */}
      <div
        style={{
          position: "absolute", left: (cfg.panelX as number) * width, top: boxFinal.y + vidH * 0.22, width: 0.36 * width,
          background: "#FFFFFF", borderRadius: 20 * k, padding: `${22 * k}px ${24 * k}px`, boxSizing: "border-box",
          boxShadow: `0 ${18 * k}px ${50 * k}px rgba(40,30,10,0.18)`, border: `${1.5 * k}px solid #ECE7DC`,
          opacity: clamp(panelP * 1.5), transform: `translateX(${(1 - panelP) * -60 * k}px) scale(${0.96 + 0.04 * panelP})`, fontFamily: FONT.sans,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 * k, fontSize: 21 * k, color: "#55524B" }}>
          <span style={{ width: 9 * k, height: 9 * k, borderRadius: "50%", background: accent }} />
          {cfg.workingLabel}
          <span style={{ fontFamily: FONT.mono, fontSize: 18 * k, color: "#fff", background: accent, borderRadius: 7 * k, padding: `${2 * k}px ${10 * k}px` }}>{cfg.skill}</span>
        </div>
        <div style={{ height: 4 * k, borderRadius: 4 * k, background: "#EEEAE1", marginTop: 14 * k, overflow: "hidden" }}>
          <div style={{ width: `${renderP * 100}%`, height: "100%", background: done ? green : accent }} />
        </div>
        <div style={{ marginTop: 14 * k, display: "flex", flexDirection: "column", gap: 13 * k }}>
          {steps.map((st, i) => {
            const df = stepDone(i);
            const isDone = frame >= df;
            const isActive = !isDone && (i === 0 ? frame >= panelF : frame >= stepDone(i - 1));
            const pop = springAt(frame, fps, df, { damping: 10, stiffness: 220, mass: 0.5 });
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 * k, fontSize: 23 * k, fontWeight: 500, color: isDone ? ink : isActive ? "#55524B" : "#B4AFA4" }}>
                <div style={{ width: 28 * k, height: 28 * k, flex: "none", position: "relative" }}>
                  {isDone ? (
                    <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: green, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${pop})` }}>
                      <CheckGlyph size={20 * k} color="#fff" stroke={3.4} />
                    </div>
                  ) : isActive ? (
                    <Spinner size={28 * k} color="#55524B" frame={frame} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", borderRadius: "50%", border: `${2 * k}px solid #E3DED4`, boxSizing: "border-box" }} />
                  )}
                </div>
                <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{st}</span>
              </div>
            );
          })}
        </div>
      </div>
      {/* big % counter */}
      <div style={{ position: "absolute", left: 46 * k, top: winY - 40 * k, opacity: counterA, transform: `translateY(${(1 - counterA) * 20 * k}px)` }}>
        <div style={{ position: "relative", display: "inline-block" }}>
          <Odometer value={count} size={176 * k} color={ink} />
          <div
            style={{
              position: "absolute", right: -46 * k, top: 40 * k, width: 74 * k, height: 74 * k, borderRadius: "50%", background: done ? green : "#3E6AE1",
              color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT.didone, fontStyle: "italic", fontSize: 42 * k,
              transform: `scale(${done ? 0.85 + 0.15 * badge : 1})`, boxShadow: `0 ${8 * k}px ${20 * k}px rgba(30,60,160,0.3)`,
            }}
          >
            %
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default makeFx(PullBackReveal, { ownsCaptions: true });
