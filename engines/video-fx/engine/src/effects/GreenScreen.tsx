import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { interpolate } from "../lib/interp";
import { clamp, mix, springAt } from "../lib/anim";
import { Captions } from "../lib/captions";
import { useFx } from "../lib/context";
import { FONT } from "../lib/fonts";
import { ClipVideo, ConfigMedia, MatteVideo } from "../lib/media";
import { makeFx } from "../lib/shell";
import { Burst, FocusAppUi } from "./greenScreenUi";

/**
 * Virtual green screen: the speaker is cut out and set into a new background — by
 * default an animated productivity app whose big serif line sits behind their head.
 * The original room dissolves away while the speaker settles into place.
 */
const GreenScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const fx = useFx();
  const { cfg, subject, width: W, height: H, t, fps, dur, offset, clip, words } = fx;
  const k = W / 1080;

  const start = t(cfg.at, 0);
  const intro = cfg.intro === "cut" ? (frame >= start ? 1 : 0) : springAt(frame, fps, start, { damping: 18, stiffness: 110, mass: 0.9 });
  const endsEarly = offset + dur < clip.durationInFrames;
  const outF = cfg.outAt !== null && cfg.outAt !== undefined ? t(cfg.outAt) : endsEarly ? dur - 14 : Infinity;
  const outro = Number.isFinite(outF) ? (cfg.intro === "cut" ? (frame >= outF ? 1 : 0) : springAt(frame, fps, outF, { damping: 18, stiffness: 140 })) : 0;
  const p = clamp(intro - outro);

  const bg = cfg.background ?? {};
  const type = String(bg.type ?? "ui");

  // where the speaker lands: head at `headY`, scaled so the bottom of the footage stays at the bottom edge
  const sub = cfg.subject ?? {};
  const headTarget = Number(sub.y ?? 0.57) * H;
  const minS = (H - headTarget) / Math.max(200, H - subject.headY);
  const S = Math.max(minS, typeof sub.scale === "number" ? sub.scale : minS * 1.02);
  const targetX = Number(sub.x ?? 0.5) * W;
  const tx = targetX - S * subject.centerX;
  const ty = headTarget - S * subject.headY;
  const s = mix(1, S, p);
  const fgTransform = `translate(${mix(0, tx, p)}px, ${mix(0, ty, p)}px) scale(${s})`;
  const fade = Math.max(0, Number(cfg.sideFade) || 0) * 100 * clamp(p * 1.5);
  // fade the cut-out's lower body (desks cut people diagonally) and the footage's side edges
  const bf = clamp(Number(cfg.bottomFade) || 0, 0, 0.9) * clamp(p * 1.5);
  const fadeFrom = ((subject.headY + (1 - bf) * (H - subject.headY)) / H) * 100;
  const layers: string[] = [];
  if (fade > 0) layers.push(`linear-gradient(90deg, transparent 0%, #000 ${fade}%, #000 ${100 - fade}%, transparent 100%)`);
  if (bf > 0) layers.push(`linear-gradient(180deg, #000 0%, #000 ${fadeFrom}%, transparent 100%)`);
  const maskStyle: React.CSSProperties = layers.length
    ? { maskImage: layers.join(", "), WebkitMaskImage: layers.join(", "), maskComposite: "intersect", WebkitMaskComposite: "source-in" }
    : {};

  const headlineSize = Number(cfg.headlineSize ?? 84) * k;
  // "auto": on the app UI the line sits behind the head (as in the reference); on images,
  // video and gradients it sits just above the head so it stays readable
  const scaledHeadTop = headTarget - S * (subject.headY - subject.headTop);
  const headlineY =
    typeof cfg.headlineOffset === "number"
      ? headTarget - cfg.headlineOffset * H
      : type === "ui"
        ? headTarget - 0.035 * H
        : scaledHeadTop - 0.02 * H - headlineSize * 0.42;
  const inputY = headTarget + 0.035 * H;
  const appear = interpolate(intro, [0.15, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const headline = String(cfg.headline ?? "");
  const accent = String(cfg.accent ?? "#C9472F");

  const capY = cfg.captionPlacement === "keep" ? fx.captions.y : clamp((headlineY - 0.068 * H) / H, 0.1, 0.9);
  return (
    <AbsoluteFill>
      {/* new background */}
      {type === "ui" ? (
        <FocusAppUi
          frame={frame - start}
          fps={fps}
          width={W}
          height={H}
          appear={appear}
          headlineY={headlineY}
          inputY={inputY}
          accent={accent}
          topColor={(bg.topColor as [string, string]) ?? ["#6A3BF2", "#5A35E8"]}
          bottomColor={(bg.bottomColor as [string, string]) ?? ["#3C2FE3", "#2B22C4"]}
          cursorAt={Math.round(t(cfg.cursorAt, 1.1)) - start}
          showHeadline={true}
          text={{
            app: String(cfg.app ?? "Claude"),
            timer: String(cfg.timer ?? "49:57"),
            task: String(cfg.task ?? "Write the sales page"),
            tasks: (cfg.tasks as string[]) ?? ["Write the sales page", "Record 2 reels", "Send the newsletter"],
            headline,
            input: String(cfg.input ?? "What should I work on next?"),
            button: "",
          }}
        />
      ) : (
        <AbsoluteFill style={{ opacity: appear > 0 ? 1 : 0 }}>
          {type === "gradient" ? (
            <AbsoluteFill style={{ background: String(bg.css ?? "linear-gradient(160deg, #1B1F3B 0%, #3B2FE3 55%, #F26B3A 100%)") }} />
          ) : bg.src ? (
            <>
              {bg.fit === "contain" ? (
                // letterbox: a blurred, darkened fill behind the whole image
                <AbsoluteFill style={{ filter: `blur(${40 * k}px) brightness(0.7)`, transform: "scale(1.15)" }}>
                  <ConfigMedia src={String(bg.src)} />
                </AbsoluteFill>
              ) : null}
              <AbsoluteFill style={{ filter: `blur(${Number(bg.blur ?? 0) * k}px) brightness(${Number(bg.brightness ?? 1)})`, transform: bg.blur ? "scale(1.06)" : undefined }}>
                <ConfigMedia src={String(bg.src)} style={{ objectFit: bg.fit === "contain" ? "contain" : "cover", objectPosition: String(bg.position ?? "50% 50%") }} />
              </AbsoluteFill>
            </>
          ) : (
            <AbsoluteFill style={{ background: "#222" }} />
          )}
          {headline ? (
            <div style={{ position: "absolute", left: 0, right: 0, top: headlineY, transform: `translateY(-50%) translateY(${(1 - appear) * 30 * k}px)`, opacity: appear, display: "flex", justifyContent: "center", alignItems: "center", gap: 18 * k }}>
              <Burst s={headlineSize * 0.64} color={accent} />
              <div style={{ fontFamily: FONT.serif, fontSize: headlineSize, color: String(cfg.headlineColor ?? "#FFFFFF"), whiteSpace: "nowrap", textShadow: "0 4px 24px rgba(0,0,0,.35)" }}>{headline}</div>
            </div>
          ) : null}
        </AbsoluteFill>
      )}
      {/* the original room, dissolving away as the speaker moves into place */}
      <AbsoluteFill style={{ opacity: 1 - clamp(p * 1.6), transform: fgTransform, transformOrigin: "0 0" }}>
        <ClipVideo />
      </AbsoluteFill>
      {/* the speaker */}
      <AbsoluteFill
        style={{
          transform: fgTransform, transformOrigin: "0 0",
          filter: p > 0.05 && cfg.shadow ? `drop-shadow(0 ${18 * k}px ${30 * k}px rgba(10,5,40,${0.45 * p}))` : undefined,
        }}
      >
        <AbsoluteFill style={maskStyle}>
          <MatteVideo />
        </AbsoluteFill>
      </AbsoluteFill>
      <Captions words={words} cfg={{ ...fx.captions, y: capY }} />
    </AbsoluteFill>
  );
};

export default makeFx(GreenScreen, { ownsCaptions: true });
