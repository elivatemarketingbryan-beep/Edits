import React, { useMemo } from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { clamp, easeIn, easeOut, prog } from "../lib/anim";
import { Captions } from "../lib/captions";
import { useFx } from "../lib/context";
import { ClipVideo, MatteVideo } from "../lib/media";
import { makeFx } from "../lib/shell";
import { OrbitCard, type OrbitCardData } from "./orbitCards";

const VIEWS = ["1.07M", "534K", "133K", "2.4M", "88.2K", "412K", "5,488", "760K"];

/** Split the transcript into short hooky phrases for auto card titles. */
function phrasesFrom(text: string, n: number): string[] {
  const words = text.replace(/[.,!?;:"“”]/g, "").split(/\s+/).filter(Boolean);
  const size = Math.max(3, Math.min(5, Math.floor(words.length / n)));
  const out: string[] = [];
  for (let i = 0; i + 2 <= words.length && out.length < n; i += size) out.push(words.slice(i, i + size).join(" "));
  return out;
}

/**
 * Social-post cards orbit the speaker on a tilted ellipse. Cards on the far half of the
 * orbit are drawn under the cut-out (the speaker hides them), the near half over it, with a
 * short cross-fade where they change sides so nothing pops.
 */
const Orbit: React.FC = () => {
  const frame = useCurrentFrame();
  const fx = useFx();
  const { cfg, subject, width, height, fps, dur, clip, offset, words } = fx;
  const k = width / 1080;

  const cards: OrbitCardData[] = useMemo(() => {
    if (Array.isArray(cfg.cards) && cfg.cards.length) {
      return (cfg.cards as OrbitCardData[]).map((c, i) => ({
        style: i % 3 === 1 ? "post" : "reel",
        frame: Math.round(((i + 0.5) / cfg.cards.length) * (clip.durationInFrames - 1)),
        ...c,
      }));
    }
    const n = Math.max(3, Math.min(9, Number(cfg.count) || 6));
    const titles: string[] = Array.isArray(cfg.titles) ? cfg.titles : cfg.titles === "none" ? [] : phrasesFrom(clip.words.map((w) => w.text).join(" "), n);
    return Array.from({ length: n }, (_, i) => ({
      style: i % 3 === 1 ? ("post" as const) : ("reel" as const),
      frame: Math.round(((i + 0.5) / n) * (clip.durationInFrames - 1)),
      // spread the titles around the ring; cards beyond the available phrases stay title-free
      title: titles[i] ?? undefined,
      views: cfg.views === false ? undefined : VIEWS[i % VIEWS.length],
    }));
  }, [cfg.cards, cfg.count, cfg.titles, cfg.views, clip]);

  const n = cards.length;
  const start = fx.t(cfg.at, 0);
  const endsEarly = offset + dur < clip.durationInFrames;
  const outStart = cfg.outAt !== null && cfg.outAt !== undefined ? fx.t(cfg.outAt) : endsEarly ? dur - 12 : Infinity;
  const enter = prog(frame, start, 22, easeOut);
  const exit = Number.isFinite(outStart) ? prog(frame, outStart, 12, easeIn) : 0;

  const cx = Array.isArray(cfg.center) ? cfg.center[0] * width : subject.centerX;
  const bottom = subject.box[3];
  const cy = Array.isArray(cfg.center) ? cfg.center[1] * height : subject.headY + (Number(cfg.height) || 0.42) * (bottom - subject.headY);
  const rx = Number(cfg.radius) * width * (0.55 + 0.45 * enter) * (1 + 0.25 * exit);
  const ry = Number(cfg.tilt) * height * (0.55 + 0.45 * enter);
  // cards scale with the speaker: close-ups get bigger cards, wide shots smaller ones
  const headH = Math.max(1, (subject.headY - subject.headTop) * 2);
  const base = Number(cfg.cardSize) * width * Math.min(1.45, Math.max(0.85, (headH * 0.62) / (Number(cfg.cardSize) * width)));
  const dir = Number(cfg.direction) < 0 ? -1 : 1;
  const time = (frame - start) / fps;
  // extra whip on entry that settles into the steady spin
  const spinBoost = (1 - enter) * 1.4;
  const theta0 = dir * (time * Number(cfg.speed) * Math.PI * 2 + spinBoost) + Number(cfg.phase || 0);

  const placed = cards.map((card, i) => {
    const th = theta0 + (i / n) * Math.PI * 2;
    const depth = Math.sin(th); // +1 nearest the camera
    const x = cx + rx * Math.cos(th);
    const bob = Math.sin(time * 1.6 + i * 1.7) * 8 * k;
    const y = cy + ry * depth + bob;
    const s = (0.6 + 0.4 * (depth + 1) / 2) * clamp(prog(frame, start + i * 2, 16, easeOut) * 1.0) * (1 - exit);
    const rotY = -Math.cos(th) * 28 * dir;
    const rotZ = (random(`orbit-rz-${i}`) - 0.5) * 10 + Math.sin(time + i) * 2;
    const shade = 0.68 + 0.32 * (depth + 1) / 2;
    const blur = Math.max(0, -depth) * Number(cfg.depthBlur) * k;
    return { card, i, depth, x, y, s, rotY, rotZ, shade, blur };
  });

  const drawCard = (p: (typeof placed)[number], layer: "back" | "front") => {
    // cross-fade between layers around the sides of the orbit
    const a = layer === "front" ? clamp((p.depth + 0.09) / 0.18) : clamp((0.09 - p.depth) / 0.18);
    if (a <= 0 || p.s <= 0.001) return null;
    return (
      <div
        key={`${layer}-${p.i}`}
        style={{
          position: "absolute",
          left: p.x,
          top: p.y,
          transform: `translate(-50%, -50%) perspective(${900 * k}px) rotateY(${p.rotY}deg) rotateZ(${p.rotZ}deg) scale(${p.s})`,
          opacity: a,
          filter: `brightness(${p.shade})${p.blur > 0.15 ? ` blur(${p.blur}px)` : ""}`,
        }}
      >
        <OrbitCard card={p.card} w={base} />
      </div>
    );
  };
  const sorted = [...placed].sort((a, b) => a.depth - b.depth);

  // captions: above the head when there is room, otherwise below the orbit
  const capY =
    cfg.captionPlacement === "keep"
      ? fx.captions.y
      : subject.headTop > height * 0.3
        ? Math.max(0.12, subject.headTop / height - 0.08)
        : Math.min(0.86, (cy + ry + base * 0.9) / height + 0.05);

  return (
    <AbsoluteFill>
      <ClipVideo />
      <AbsoluteFill>{sorted.map((p) => drawCard(p, "back"))}</AbsoluteFill>
      <MatteVideo />
      <AbsoluteFill>{sorted.map((p) => drawCard(p, "front"))}</AbsoluteFill>
      <Captions words={words} cfg={{ ...fx.captions, y: capY }} />
    </AbsoluteFill>
  );
};

export default makeFx(Orbit, { ownsCaptions: true });
