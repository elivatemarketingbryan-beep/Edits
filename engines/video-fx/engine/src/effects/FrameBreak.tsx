import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { interpolate } from "../lib/interp";
import { clamp, mix, prog, springAt } from "../lib/anim";
import { useFx } from "../lib/context";
import { ClipVideo, MatteVideo } from "../lib/media";
import { makeFx } from "../lib/shell";
import { FeedUi } from "./frameBreakUi";

/**
 * The shot springs down into a Reels/TikTok phone window on a dark backdrop. The window
 * crops the footage just above the speaker's eyes, but the cut-out speaker is drawn over
 * the window, so their head (and hands) break out past its edges.
 */
const FrameBreak: React.FC = () => {
  const frame = useCurrentFrame();
  const { cfg, subject, width: W, height: H, t, fps, dur, offset, clip, words } = useFx();
  const k = W / 1080;

  const start = t(cfg.at, 0.1);
  const settle = springAt(frame, fps, start, { damping: 17, stiffness: 120, mass: 0.9 });
  const endsEarly = offset + dur < clip.durationInFrames;
  const outF = cfg.outAt !== null && cfg.outAt !== undefined ? t(cfg.outAt) : endsEarly ? dur - 14 : Infinity;
  const back = Number.isFinite(outF) ? springAt(frame, fps, outF, { damping: 18, stiffness: 140 }) : 0;
  const p = clamp(settle - back, -0.05, 1.05);

  // final layout
  const ww = Number(cfg.frameWidth) * W;
  const wh = ww * (16 / 9);
  const wcx = W / 2;
  const wcy = Number(cfg.frameY) * H;
  const wl = wcx - ww / 2;
  const wt = wcy - wh / 2;
  // crop line (in source px): a little above the eyes, so the top of the head breaks out
  const headTop = subject.headTop;
  const cropY = headTop + Number(cfg.breakDepth) * Math.max(40, subject.headY - headTop);
  const Sv = Math.max((ww / W) * Number(cfg.sideBreak), wh / Math.max(200, H - cropY));
  let vx = wcx - Sv * subject.centerX;
  vx = Math.min(wl, Math.max(wl + ww - Sv * W, vx)); // video must cover the window horizontally
  const vy = wt - Sv * cropY;

  // interpolate from the untouched full frame
  const s = mix(1, Sv, p);
  const tx = mix(0, vx, p);
  const ty = mix(0, vy, p);
  const rl = mix(0, wl, p);
  const rt = mix(0, wt, p);
  const rw = mix(W, ww, p);
  const rh = mix(H, wh, p);
  const radius = mix(0, Number(cfg.cornerRadius) * k, clamp(p));
  const videoTransform = `translate(${tx}px, ${ty}px) scale(${s})`;
  const fade = Math.max(0, Number(cfg.sideFade) || 0) * 100;
  const maskCss = fade > 0 ? `linear-gradient(90deg, transparent 0%, #000 ${fade}%, #000 ${100 - fade}%, transparent 100%)` : undefined;
  const sideMask: React.CSSProperties = maskCss ? { maskImage: maskCss, WebkitMaskImage: maskCss } : {};

  const uiA = interpolate(settle - back, [0.82, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const u = rw / 400;
  const firstLine = words.length ? clip.words.slice(0, 9).map((w) => w.text).join(" ") : "";
  const caption = cfg.caption === "auto" ? firstLine : String(cfg.caption ?? "");
  const bg = cfg.backdrop as string;
  const liked = cfg.likeAt !== null && cfg.likeAt !== undefined && frame >= t(cfg.likeAt);

  return (
    <AbsoluteFill>
      {/* backdrop */}
      {bg === "blur" ? (
        <AbsoluteFill style={{ transform: "scale(1.2)", filter: `blur(${42 * k}px) brightness(0.32) saturate(0.85)` }}>
          <ClipVideo />
        </AbsoluteFill>
      ) : (
        <AbsoluteFill style={{ background: bg === "dark" ? "radial-gradient(ellipse at 50% 40%, #2a2d29 0%, #0d0e0d 75%)" : bg }} />
      )}
      {/* the phone window with the footage inside */}
      <div
        style={{
          position: "absolute", left: rl, top: rt, width: rw, height: rh, borderRadius: radius, overflow: "hidden",
          boxShadow: p > 0.02 ? `0 ${40 * k}px ${90 * k}px rgba(0,0,0,${0.55 * clamp(p)}), 0 0 0 ${2 * k}px rgba(255,255,255,${0.14 * clamp(p)})` : undefined,
          background: "#000",
        }}
      >
        <div style={{ position: "absolute", left: -rl, top: -rt, width: W, height: H, transform: videoTransform, transformOrigin: "0 0" }}>
          <ClipVideo />
        </div>
      </div>
      {/* the speaker, breaking out over the window edge (never below its bottom edge) */}
      <AbsoluteFill style={{ clipPath: `inset(0px 0px ${Math.max(0, H - (rt + rh))}px 0px)` }}>
        <AbsoluteFill
          style={{
            transform: videoTransform, transformOrigin: "0 0",
            filter: p > 0.05 && cfg.shadow ? `drop-shadow(0 ${14 * k}px ${22 * k}px rgba(0,0,0,${0.45 * clamp(p)}))` : undefined,
          }}
        >
          {/* soften the footage's own left/right edges, where a person who fills the frame is cut straight */}
          <AbsoluteFill style={sideMask}
        >
          <MatteVideo />
          </AbsoluteFill>
        </AbsoluteFill>
      </AbsoluteFill>
      {/* feed chrome, inside the window, over the speaker */}
      {uiA > 0 && cfg.ui !== false ? (
        <div style={{ position: "absolute", left: rl, top: rt, width: rw, height: rh, borderRadius: radius, overflow: "hidden", opacity: uiA }}>
          <FeedUi
            platform={cfg.platform === "tiktok" ? "tiktok" : "reels"}
            username={String(cfg.username)}
            caption={caption}
            likes={String(cfg.likes ?? "")}
            comments={String(cfg.comments ?? "")}
            progress={clamp((frame + offset) / Math.max(1, clip.durationInFrames))}
            u={u}
            faceX={subject.centerX / W}
            faceY={subject.headY / H}
            liked={liked}
          />
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export default makeFx(FrameBreak);
