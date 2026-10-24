import React, { useMemo } from "react";
import { AbsoluteFill, Freeze, useCurrentFrame } from "remotion";
import { interpolate } from "../lib/interp";
import { clamp, easeIn, prog, springAt } from "../lib/anim";
import { useFx } from "../lib/context";
import { FONT } from "../lib/fonts";
import { ClipVideo, ConfigMedia, MatteVideo } from "../lib/media";
import { makeFx } from "../lib/shell";
import { exitFrame, rnd, rndRange, viewCount } from "../lib/wallKit";

type Tile = { x: number; y: number; w: number; h: number; i: number; order: number };

const GRADES = [
  "brightness(0.86)",
  "brightness(0.8) saturate(0.75) contrast(1.08)",
  "brightness(0.88) sepia(0.18) saturate(1.15)",
  "brightness(0.82) contrast(1.12) saturate(0.9) hue-rotate(-8deg)",
  "brightness(0.78) grayscale(0.85) contrast(1.12)",
  "brightness(0.9) saturate(1.2) hue-rotate(6deg)",
];

const PlayIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 10 10" style={{ marginRight: size * 0.35, filter: "drop-shadow(0 1px 2px rgba(0,0,0,.6))" }}>
    <path d="M2 1.2 L8.6 5 L2 8.8 Z" fill="none" stroke="#fff" strokeWidth={1.3} strokeLinejoin="round" />
  </svg>
);

/**
 * A wall of short-form thumbnails (frames of the clip or the user's own media) pops in
 * behind the speaker; the cut-out speaker stays in front.
 */
const CouchWall: React.FC = () => {
  const frame = useCurrentFrame();
  const fx = useFx();
  const { cfg, width: W, height: H, subject, fps, clip, offset } = fx;
  const k = W / 1080;

  const bottom = typeof cfg.wallBottom === "number" ? cfg.wallBottom : clamp(subject.headY / H + 0.3, 0.42, 0.72);
  const cols = Math.max(2, Math.round(cfg.columns as number));
  const gap = (cfg.gap as number) * k;

  const tiles = useMemo(() => {
    const bleed = 18 * k;
    const colW = (W + bleed * 2 - gap * (cols - 1)) / cols;
    const list: Tile[] = [];
    let i = 0;
    for (let c = 0; c < cols; c++) {
      let y = -rndRange(`c${c}-start`, 0.05, 0.55) * colW;
      while (y < bottom * H - colW * 0.35) {
        const h = colW * rndRange(`t${i}-h`, 1.0, 1.42);
        list.push({ x: -bleed + c * (colW + gap), y, w: colW, h, i, order: 0 });
        y += h + gap;
        i++;
      }
    }
    // pop order: outward from the speaker's head, with a little randomness
    const cx = subject.centerX;
    const cy = subject.headY;
    const keyed = list.map((t) => ({ t, d: Math.hypot(t.x + t.w / 2 - cx, t.y + t.h / 2 - cy) + rnd(`o${t.i}`) * 260 * k }));
    keyed.sort((a, b) => a.d - b.d).forEach((e, n) => (e.t.order = n));
    return list;
  }, [W, H, k, cols, gap, bottom, subject.centerX, subject.headY]);

  const start = fx.t(cfg.at, 0.1);
  const fillFrames = Math.max(4, Math.round((cfg.fillDuration as number) * fps));
  const step = fillFrames / Math.max(1, tiles.length - 1);
  const outF = exitFrame(fx, cfg.outAt, 10);
  const media: string[] = Array.isArray(cfg.media) ? cfg.media.filter((m: unknown) => typeof m === "string") : [];
  const labels: string[] = Array.isArray(cfg.labels) ? cfg.labels : [];
  const views: string[] | null = Array.isArray(cfg.views) ? cfg.views.map(String) : null;
  const total = clip.durationInFrames;

  // which tiles carry a headline sticker: spread out, prefer tiles away from the head
  const labelTiles = useMemo(() => {
    const score = (t: Tile) => Math.abs(t.x + t.w / 2 - subject.centerX) - Math.max(0, -t.y) * 1.5 - Math.max(0, t.y + t.h - bottom * H);
    const byVis = [...tiles].sort((a, b) => score(b) - score(a));
    return byVis.filter((_, n) => n % 2 === 0).slice(0, labels.length).map((t) => t.i);
  }, [tiles, labels.length, subject.centerX]);

  const drift = interpolate(frame, [start, fx.dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const focusY = subject.headY / H;
  const focusX = subject.centerX / W;

  return (
    <AbsoluteFill>
      <ClipVideo />
      <AbsoluteFill style={{ transform: `translateY(${-drift * 14 * k}px) scale(${1 + drift * (cfg.drift as number)})`, transformOrigin: "50% 0%" }}>
        {tiles.map((t) => {
          const s0 = start + t.order * step;
          const sp = springAt(frame, fps, s0, { damping: 13, stiffness: 190, mass: 0.6 });
          const a = prog(frame, s0, 4);
          let out = 0;
          if (outF !== null) out = prog(frame, outF + (tiles.length - 1 - t.order) * (6 / tiles.length), 7, easeIn);
          const scale = (0.55 + 0.45 * sp) * (1 - 0.35 * out);
          const opacity = a * (1 - out);
          if (opacity <= 0.001) return null;
          const blur = (1 - a) * 10 * k + out * 8 * k;
          const label = labelTiles.indexOf(t.i);
          // which source frame (or media item) this tile shows
          const m = media.length ? media[t.i % media.length] : null;
          const atFrame = Math.floor((((t.i * 0.6180339) % 1) * 0.9 + 0.05) * (total - 1));
          const zoom = rndRange(`z${t.i}`, 1.05, 1.75);
          const vidH = t.w * (16 / 9);
          const mirror = rnd(`m${t.i}`) < 0.3 ? -1 : 1;
          const showViews = cfg.showViews && rnd(`v${t.i}`) < 0.8;
          return (
            <div
              key={t.i}
              style={{
                position: "absolute", left: t.x, top: t.y, width: t.w, height: t.h, overflow: "hidden",
                borderRadius: (cfg.radius as number) * k, opacity, transform: `scale(${scale})`,
                filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
                boxShadow: "0 8px 22px rgba(0,0,0,.35)", background: "#1b1b1d",
              }}
            >
              {m ? (
                <ConfigMedia src={m} style={{ filter: "brightness(0.9)" }} />
              ) : (
                <div
                  style={{
                    position: "absolute", left: 0, width: t.w, height: vidH,
                    top: clamp(t.h / 2 - focusY * vidH, t.h - vidH, 0),
                    transform: `scale(${zoom * mirror}, ${zoom})`, transformOrigin: `${focusX * 100}% ${focusY * 100}%`,
                    filter: GRADES[t.i % GRADES.length],
                  }}
                >
                  <Freeze frame={0}>
                    <ClipVideo shift={atFrame - offset} />
                  </Freeze>
                </div>
              )}
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,.18) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 62%, rgba(0,0,0,.42) 100%)" }} />
              {showViews ? (
                <div style={{ position: "absolute", left: Math.max(14 * k, -t.x + 16 * k), bottom: Math.max(12 * k, t.y + t.h - H + 16 * k), display: "flex", alignItems: "center", color: "#fff", fontFamily: FONT.sans, fontWeight: 600, fontSize: 25 * k, letterSpacing: "-0.01em", textShadow: "0 1px 4px rgba(0,0,0,.7)" }}>
                  <PlayIcon size={20 * k} />
                  {views ? views[t.i % views.length] : viewCount(`views-${t.i}`)}
                </div>
              ) : null}
              {label >= 0 ? (
                <div
                  style={{
                    position: "absolute", left: t.w / 2 + Math.max(0, -t.x) / 2 - Math.max(0, t.x + t.w - W) / 2, top: Math.max(t.h * 0.18, -t.y + 40 * k), transform: "translateX(-50%)", width: t.w * 0.8,
                    background: "#fff", color: "#111", borderRadius: 9 * k, padding: `${7 * k}px ${10 * k}px`,
                    fontFamily: FONT.sans, fontWeight: 800, fontSize: 22 * k, lineHeight: 1.12, textAlign: "center",
                    letterSpacing: "-0.01em", boxShadow: "0 3px 10px rgba(0,0,0,.3)",
                  }}
                >
                  {labels[label]}
                </div>
              ) : null}
            </div>
          );
        })}
      </AbsoluteFill>
      <MatteVideo />
    </AbsoluteFill>
  );
};

export default makeFx(CouchWall);
