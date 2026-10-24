import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp, easeInOut, easeOut, mix, prog, springAt } from "../lib/anim";
import { FONT } from "../lib/fonts";
import { interpolate } from "../lib/interp";

/**
 * Motion-graphics outro for a call-out reel: library wall → the real About page assembling
 * from its own pieces → "To join" steps → the kit reveal. All timing comes from `cue` (seconds,
 * absolute in the composition), so it lands on the speaker's words.
 */
export type Rect = { x: number; y: number; w: number; h: number };
export type AboutMotionProps = {
  cue: Record<string, number>;
  page: { src: string; cssW: number; cssH: number; parts: Record<string, Rect>; lines: Rect[] };
  posters: string[];
  names: string[];
  kit: { title: string; subtitle: string; file: string; size: string };
  link: string;
  accent: string;
};

const W = 1080, H = 1920;
const BG = "#0B0B0E";

/** A rectangle cut out of the page screenshot, drawn at `s` px per CSS px. */
const Slice: React.FC<{ src: string; cssW: number; cssH: number; r: Rect; s: number; style?: React.CSSProperties; radius?: number }> = ({ src, cssW, cssH, r, s, style, radius = 0 }) => (
  <div style={{ position: "absolute", left: r.x * s, top: r.y * s, width: r.w * s, height: r.h * s, overflow: "hidden", borderRadius: radius, ...style }}>
    <Img src={staticFile(src)} style={{ position: "absolute", left: -r.x * s, top: -r.y * s, width: cssW * s, height: cssH * s, maxWidth: "none" }} />
  </div>
);

const Hand: React.FC<{ size: number; pressed: number }> = ({ size, pressed }) => (
  <svg width={size} height={size * 1.15} viewBox="0 0 100 115" style={{ overflow: "visible", filter: "drop-shadow(0 10px 16px rgba(0,0,0,.5))", transform: `scale(${1 - pressed * 0.12})`, transformOrigin: "30% 6%" }}>
    <path d="M30 6c6 0 10 4 10 10v38l4-1V40c0-5 4-9 9-9s9 4 9 9v14l3-1v-7c0-5 4-9 9-9s9 4 9 9v10l2-.5c0-4.5 3.8-8 8-8s8 3.5 8 8v24c0 20-14 36-34 36H52c-12 0-20-5-27-14L8 76c-3-4-2-10 2-13s10-2 13 2l7 8V16c0-6 4-10 10-10z" fill="#fff" stroke="#111" strokeWidth="5" strokeLinejoin="round" />
  </svg>
);

/** Words that pop in as they are spoken. */
const Kinetic: React.FC<{ words: { text: string; at: number; color?: string }[]; frame: number; fps: number; size: number; weight?: number; style?: React.CSSProperties }> = ({ words, frame, fps, size, weight = 900, style }) => (
  <div style={{ fontFamily: FONT.sans, fontWeight: weight, fontSize: size, letterSpacing: "-0.055em", lineHeight: 0.95, color: "#fff", textAlign: "center", ...style }}>
    {words.map((w, i) => {
      const a = springAt(frame, fps, Math.round(w.at * fps), { damping: 13, stiffness: 220, mass: 0.6 });
      return (
        <span key={i} style={{ display: "inline-block", margin: "0 0.12em", color: w.color ?? "#fff", opacity: clamp(a * 1.4), transform: `translateY(${(1 - a) * 0.5 * size}px) scale(${0.7 + 0.3 * a})`, filter: a < 0.9 ? `blur(${(1 - a) * 10}px)` : undefined }}>
          {w.text}
        </span>
      );
    })}
  </div>
);

const Backdrop: React.FC<{ frame: number; accent: string }> = ({ frame, accent }) => {
  const gx = 50 + 18 * Math.sin(frame / 70);
  const gy = 40 + 12 * Math.cos(frame / 90);
  return (
    <AbsoluteFill style={{ background: BG }}>
      <AbsoluteFill style={{ background: `radial-gradient(60% 40% at ${gx}% ${gy}%, ${accent}22, transparent 70%)` }} />
      <AbsoluteFill style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px)", backgroundSize: "90px 90px", backgroundPosition: `0 ${(frame * 0.6) % 90}px`, maskImage: "radial-gradient(70% 60% at 50% 45%, #000, transparent)" }} />
      <AbsoluteFill style={{ background: "radial-gradient(120% 90% at 50% 50%, transparent 55%, rgba(0,0,0,.55))" }} />
    </AbsoluteFill>
  );
};

export const AboutMotion: React.FC<AboutMotionProps & { cardFrom: Rect }> = (p) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = (sec: number) => Math.round(sec * fps);
  const c = p.cue;
  const A = p.accent;

  // ---------- intro: the demo card grows into the canvas ----------
  const grow = prog(frame, f(c.start), 9, easeInOut);
  const box = {
    x: mix(p.cardFrom.x, 0, grow), y: mix(p.cardFrom.y, 0, grow),
    w: mix(p.cardFrom.w, W, grow), h: mix(p.cardFrom.h, H, grow),
  };

  // ---------- scene 1: the library wall ----------
  const s1Out = prog(frame, f(c.inside) - 9, 14, easeInOut); // fly-through
  const wallScale = interpolate(frame, [f(c.start), f(c.massive), f(c.massive) + 16, f(c.inside) - 9], [1.25, 1.12, 0.9, 0.86], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeOut }) * (1 + s1Out * 3.2);
  const pan = (frame - f(c.start)) * 2.2;
  const COLS = 5, ROWS = 7, TW = 300, TH = 533, GAP = 30;
  const tiles: React.ReactNode[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let col = 0; col < COLS; col++) {
      const i = r * COLS + col;
      const dx = col - (COLS - 1) / 2, dy = r - (ROWS - 1) / 2;
      const d = Math.sqrt(dx * dx + dy * dy);
      const a = springAt(frame, fps, f(c.start) + 3 + Math.round(d * 2.2), { damping: 15, stiffness: 160, mass: 0.7 });
      tiles.push(
        <div key={i} style={{ position: "absolute", left: col * (TW + GAP) + (r % 2 ? TW / 2 : 0), top: r * (TH + GAP), width: TW, height: TH, borderRadius: 26, overflow: "hidden", opacity: clamp(a * 1.3), transform: `scale(${0.6 + 0.4 * a})`, boxShadow: "0 20px 50px rgba(0,0,0,.5)", border: "3px solid rgba(255,255,255,.14)" }}>
          <Img src={staticFile(p.posters[i % p.posters.length])} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>,
      );
    }
  }
  const s1Visible = frame < f(c.inside) + 6;
  const textOut = prog(frame, f(c.inside) - 12, 8, easeInOut);

  // ---------- scene 2 & 3: the About page ----------
  const s = 2.0; // px per CSS px
  const pw = p.page.cssW * s;
  const ph = 590 * s; // visible window of the page
  const pageIn = springAt(frame, fps, f(c.inside) - 4, { damping: 17, stiffness: 120, mass: 0.9 });
  const tilt = 1 - prog(frame, f(c.inside), f(c.lab) - f(c.inside) + 10, easeInOut);
  const scroll = prog(frame, f(c.download) - 4, 16, easeInOut) * 500; // CSS px
  const joinFocus = interpolate(frame, [f(c.join1) - 2, f(c.join1) + 6, f(c.download), f(c.download) + 8], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pageOut = prog(frame, f(c.cta2) - 2, 9, easeInOut);
  const pageVisible = frame >= f(c.inside) - 6 && frame < f(c.cta2) + 9;
  const P = p.page.parts;
  const popAt = (sec: number, k = 0) => springAt(frame, fps, f(sec) + k, { damping: 14, stiffness: 190, mass: 0.6 });
  const layer = (key: string, at: number, kind: "rise" | "pop" | "drop" | "slide" | "wipe", extra: React.CSSProperties = {}, k = 0) => {
    const a = popAt(at, k);
    const r = P[key];
    if (!r) return null;
    const t: Record<string, string> = {
      rise: `translateY(${(1 - a) * 60}px) scale(${0.94 + 0.06 * a})`,
      pop: `scale(${0.6 + 0.4 * a})`,
      drop: `translateY(${(1 - a) * -50}px)`,
      slide: `translateX(${(1 - a) * 220}px)`,
      wipe: "none",
    };
    return (
      <Slice key={key} src={p.page.src} cssW={p.page.cssW} cssH={p.page.cssH} r={r} s={s} radius={key === "hero" ? 18 : key === "join" ? 16 : 0}
        style={{ opacity: kind === "wipe" ? 1 : clamp(a * 1.5), transform: t[kind], transformOrigin: "left center", clipPath: kind === "wipe" ? `inset(0 ${(1 - clamp(a)) * 100}% 0 0)` : undefined, ...extra }} />
    );
  };
  const join = P.join;
  const joinGlow = frame >= f(c.join1) - 2 ? 0.5 + 0.5 * Math.sin((frame - f(c.join1)) / 4) : 0;

  // ---------- scene 4: To join + kit ----------
  const s4 = frame >= f(c.cta2) - 2;
  const titleA = springAt(frame, fps, f(c.cta2) + 2, { damping: 12, stiffness: 200, mass: 0.7 });
  const bar = prog(frame, f(c.cta2) + 8, 12, easeOut);
  const step1 = springAt(frame, fps, f(c.click1) - 4, { damping: 15, stiffness: 180, mass: 0.7 });
  const step2 = springAt(frame, fps, f(c.click2) - 4, { damping: 15, stiffness: 180, mass: 0.7 });
  const linkPress = interpolate(frame, [f(c.link) - 2, f(c.link) + 1, f(c.link) + 6], [1, 0.93, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const linkDone = frame >= f(c.link) + 1;
  const btnPress = interpolate(frame, [f(c.button) - 2, f(c.button) + 1, f(c.button) + 6], [1, 0.9, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const burst = prog(frame, f(c.button), 18, easeOut);
  const steps2Up = prog(frame, f(c.wait) - 2, 12, easeInOut);
  const getA = springAt(frame, fps, f(c.wait) + 2, { damping: 14, stiffness: 170, mass: 0.7 });
  const kitA = springAt(frame, fps, f(c.wait) + 6, { damping: 13, stiffness: 150, mass: 0.8 });
  const fan = springAt(frame, fps, f(c.see) - 2, { damping: 12, stiffness: 120, mass: 0.8 });
  const insidePulse = springAt(frame, fps, f(c.inside2), { damping: 10, stiffness: 200, mass: 0.5 });

  // cursor path in scene 4: from lower right → link pill → join button
  const pillY = 560, btnY = 760;
  const handX = interpolate(frame, [f(c.click1) - 6, f(c.link) - 1, f(c.click2) - 2, f(c.button) - 1, f(c.button) + 14], [1000, 760, 760, 640, 700], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeInOut });
  const handY = interpolate(frame, [f(c.click1) - 6, f(c.link) - 1, f(c.click2) - 2, f(c.button) - 1, f(c.button) + 14], [1500, pillY + 30, pillY + 30, btnY + 34, btnY + 120], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeInOut });
  const handA = interpolate(frame, [f(c.click1) - 6, f(c.click1), f(c.button) + 10, f(c.button) + 18], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const handPress = interpolate(frame, [f(c.link) - 2, f(c.link), f(c.link) + 4, f(c.button) - 2, f(c.button), f(c.button) + 4], [0, 1, 0, 0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const js = 2.0; // join button scale in scene 4 (CSS px → output px)
  const marquee = (frame - f(c.wait)) * 3;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* growing card → full-frame canvas */}
      <div style={{ position: "absolute", left: box.x, top: box.y, width: box.w, height: box.h, borderRadius: 38 * (1 - grow), overflow: "hidden", border: grow < 1 ? `7px solid rgba(244,239,228,${1 - grow})` : undefined }}>
        <div style={{ position: "absolute", left: -box.x, top: -box.y, width: W, height: H }}>
          <Backdrop frame={frame} accent={A} />

          {/* ---- scene 1 ---- */}
          {s1Visible && (
            <AbsoluteFill style={{ perspective: 1600, opacity: 1 - s1Out }}>
              <div style={{ position: "absolute", left: W / 2, top: H / 2, width: 0, height: 0, transform: `scale(${wallScale}) rotateX(24deg) rotateZ(-11deg)`, transformStyle: "preserve-3d", filter: s1Out > 0.05 ? `blur(${s1Out * 14}px)` : undefined }}>
                <div style={{ position: "absolute", left: -(COLS * (TW + GAP)) / 2 - 80, top: -(ROWS * (TH + GAP)) / 2 - (pan % (TH + GAP)) + 200 }}>{tiles}</div>
              </div>
              <AbsoluteFill style={{ background: "radial-gradient(70% 45% at 50% 50%, rgba(11,11,14,.78), rgba(11,11,14,.15) 70%)" }} />
              <div style={{ position: "absolute", left: 0, right: 0, top: 300, opacity: 1 - textOut, transform: `translateY(${-textOut * 80}px)` }}>
                <Kinetic frame={frame} fps={fps} size={66} weight={800} words={[{ text: "these", at: c.start + 0.02 }, { text: "are", at: c.are }, { text: "just", at: c.just }, { text: "a", at: c.few - 0.1 }, { text: "few", at: c.few }]} style={{ opacity: frame < f(c.claude) ? 1 : 0.0 }} />
              </div>
              <div style={{ position: "absolute", left: 0, right: 0, top: 760, opacity: (frame < f(c.claude) - 2 ? 1 : 0) * (1 - textOut) }}>
                <Kinetic frame={frame} fps={fps} size={196} words={[{ text: "massive", at: c.massive, color: A }]} />
                <Kinetic frame={frame} fps={fps} size={196} words={[{ text: "library", at: c.library }]} />
              </div>
              <div style={{ position: "absolute", left: 0, right: 0, top: 720, opacity: (frame >= f(c.claude) - 2 ? 1 : 0) * (1 - textOut), transform: `translateY(${-textOut * 120}px)` }}>
                <Kinetic frame={frame} fps={fps} size={150} words={[{ text: "Claude", at: c.claude }, { text: "Code", at: c.code }]} />
                <div style={{ position: "relative", display: "flex", justifyContent: "center", marginTop: 16 }}>
                  <div style={{ position: "absolute", top: 8, height: 150, left: "50%", width: 860, transform: `translateX(-50%) scaleX(${prog(frame, f(c.editing), 9, easeOut)})`, transformOrigin: "left center", background: A, borderRadius: 14 }} />
                  <Kinetic frame={frame} fps={fps} size={132} words={[{ text: "editing", at: c.editing, color: "#111" }, { text: "effects", at: c.effects, color: "#111" }]} style={{ position: "relative" }} />
                </div>
              </div>
            </AbsoluteFill>
          )}

          {/* ---- scenes 2 & 3: the real About page, rebuilt from its pieces ---- */}
          {pageVisible && (
            <AbsoluteFill style={{ perspective: 2200 }}>
              <div style={{ position: "absolute", left: 0, right: 0, top: 150, opacity: clamp(pageIn) * (1 - pageOut) }}>
                <div style={{ fontFamily: FONT.mono, fontWeight: 700, fontSize: 30, letterSpacing: "0.32em", color: A, textAlign: "center" }}>
                  {"INSIDE THE LAB".slice(0, Math.max(0, Math.round((frame - f(c.inside)) * 0.8)))}
                </div>
              </div>
              <div
                style={{
                  position: "absolute", left: (W - pw) / 2, top: 250, width: pw, height: ph, borderRadius: 40, overflow: "hidden", background: "#fff",
                  boxShadow: `0 60px 140px rgba(0,0,0,.6), 0 0 0 2px rgba(255,255,255,.08), 0 0 120px ${A}22`,
                  transform: `translateY(${(1 - pageIn) * 500 - pageOut * 1400}px) rotateX(${tilt * 22 + pageOut * 30}deg) rotateY(${-tilt * 16}deg) scale(${0.85 + 0.15 * pageIn})`,
                  filter: pageOut > 0.05 ? `blur(${pageOut * 12}px)` : undefined, transformStyle: "preserve-3d",
                }}
              >
                <div style={{ position: "absolute", left: 0, top: -scroll * s, width: pw, height: p.page.cssH * s }}>
                  {layer("header", c.inside - 0.12, "drop")}
                  {layer("hero", c.inside + 0.06, "rise")}
                  {layer("title", c.of, "pop")}
                  {P.title && <div style={{ position: "absolute", left: P.title.x * s, top: (P.title.y + P.title.h + 1) * s, height: 5 * s, width: P.title.w * s * prog(frame, f(c.employee), 10, easeOut), background: A, borderRadius: 4 }} />}
                  {layer("rating", c.ai, "wipe")}
                  {layer("thumbs", c.employee, "slide")}
                  {layer("private", c.lab, "pop", {}, 0)}
                  {layer("members", c.lab, "pop", {}, 3)}
                  {layer("price", c.lab, "pop", {}, 6)}
                  {layer("by", c.lab, "pop", {}, 9)}
                  {join && (
                    <>
                      <div style={{ position: "absolute", left: (join.x - 6) * s, top: (join.y - 6) * s, width: (join.w + 12) * s, height: (join.h + 12) * s, borderRadius: 20, boxShadow: joinGlow ? `0 0 ${40 + 40 * joinGlow}px ${8 + 10 * joinGlow}px ${A}AA` : undefined, opacity: clamp(popAt(c.that2) * 1.5) }} />
                      {layer("join", c.that2, "rise", { transform: `scale(${(0.9 + 0.1 * popAt(c.that2)) * (1 + joinFocus * 0.06)})`, transformOrigin: "center" })}
                    </>
                  )}
                  {p.page.lines.map((r, i) => {
                    const a = springAt(frame, fps, f(c.download) + 4 + i * 2, { damping: 15, stiffness: 190, mass: 0.6 });
                    const tick = prog(frame, f(c.start2) + i * 2, 8, easeOut);
                    return (
                      <React.Fragment key={i}>
                        <Slice src={p.page.src} cssW={p.page.cssW} cssH={p.page.cssH} r={r} s={s} style={{ opacity: clamp(a * 1.4), transform: `translateX(${(1 - a) * 160}px)` }} />
                        <div style={{ position: "absolute", left: (r.x + 2) * s, top: (r.y + 1) * s, width: (r.w - 4) * s * tick, height: (r.h - 2) * s, background: A, borderRadius: 6, mixBlendMode: "multiply", opacity: 0.85 }} />
                      </React.Fragment>
                    );
                  })}
                </div>
                <AbsoluteFill style={{ background: `rgba(10,10,12,${joinFocus * 0.35})` }} />
              </div>
              <div style={{ position: "absolute", left: 0, right: 0, top: 1560, opacity: clamp(popAt(c.join1)) * (1 - pageOut) }}>
                <div style={{ display: "flex", justifyContent: "center", gap: 26, fontFamily: FONT.sans, fontWeight: 900, fontSize: 64, letterSpacing: "-0.05em" }}>
                  {[["join", c.join1], ["download", c.download], ["start using", c.start2]].map(([word, at], i) => {
                    const on = frame >= f(at as number) - 1;
                    const a = springAt(frame, fps, f(at as number) - 1, { damping: 12, stiffness: 220, mass: 0.5 });
                    return (
                      <React.Fragment key={i}>
                        {i > 0 && <span style={{ color: "rgba(255,255,255,.3)", opacity: on ? 1 : 0.4 }}>→</span>}
                        <span style={{ color: on ? A : "rgba(255,255,255,.35)", transform: `scale(${on ? 0.9 + 0.1 * a : 0.9})`, display: "inline-block" }}>{word as string}</span>
                      </React.Fragment>
                    );
                  })}
                </div>
                <div style={{ textAlign: "center", marginTop: 14, fontFamily: FONT.mono, fontWeight: 700, fontSize: 28, letterSpacing: "0.3em", color: "rgba(255,255,255,.7)", opacity: clamp(prog(frame, f(c.immediately), 8, easeOut)) }}>IMMEDIATELY</div>
              </div>
            </AbsoluteFill>
          )}

          {/* ---- scene 4: To join → the kit ---- */}
          {s4 && (
            <AbsoluteFill>
              <div style={{ position: "absolute", left: 0, right: 0, top: 170, textAlign: "center", transform: `translateY(${-steps2Up * 60}px) scale(${0.7 + 0.3 * titleA - steps2Up * 0.15})`, opacity: clamp(titleA * 1.4) }}>
                <div style={{ fontFamily: FONT.sans, fontWeight: 900, fontSize: 170, letterSpacing: "-0.06em", color: "#fff", lineHeight: 1 }}>To join</div>
                <div style={{ margin: "14px auto 0", width: 420 * bar, height: 14, borderRadius: 9, background: A }} />
              </div>
              {/* step 1: the link */}
              <div style={{ position: "absolute", left: 70, top: pillY - 55, width: 940, height: 110, display: "flex", alignItems: "center", gap: 26, opacity: clamp(step1 * 1.4) * (1 - steps2Up * 0.25), transform: `translateX(${(1 - step1) * 300}px) translateY(${-steps2Up * 110}px) scale(${1 - steps2Up * 0.12})` }}>
                <div style={{ flex: "none", width: 96, height: 96, borderRadius: 99, background: A, color: "#111", fontFamily: FONT.sans, fontWeight: 900, fontSize: 56, display: "flex", alignItems: "center", justifyContent: "center" }}>1</div>
                <div style={{ flex: 1, height: 104, borderRadius: 99, background: "#fff", display: "flex", alignItems: "center", gap: 20, padding: "0 34px", transform: `scale(${linkPress})`, boxShadow: linkDone ? `0 0 0 5px ${A}, 0 18px 40px rgba(0,0,0,.4)` : "0 18px 40px rgba(0,0,0,.4)" }}>
                  <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.4" strokeLinecap="round"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" /><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" /></svg>
                  <span style={{ fontFamily: FONT.sans, fontWeight: 800, fontSize: 44, letterSpacing: "-0.03em", color: "#111" }}>{p.link}</span>
                </div>
              </div>
              {/* step 2: the real join button */}
              <div style={{ position: "absolute", left: 70, top: btnY - 55, width: 940, height: 110, display: "flex", alignItems: "center", gap: 26, opacity: clamp(step2 * 1.4) * (1 - steps2Up * 0.25), transform: `translateX(${(1 - step2) * 300}px) translateY(${-steps2Up * 200}px) scale(${1 - steps2Up * 0.12})` }}>
                <div style={{ flex: "none", width: 96, height: 96, borderRadius: 99, background: A, color: "#111", fontFamily: FONT.sans, fontWeight: 900, fontSize: 56, display: "flex", alignItems: "center", justifyContent: "center" }}>2</div>
                {join && (
                  <div style={{ position: "relative", flex: 1, height: 104, transform: `scale(${btnPress})`, borderRadius: 22, overflow: "hidden", boxShadow: frame >= f(c.button) ? `0 0 70px 16px ${A}AA` : "0 18px 40px rgba(0,0,0,.4)" }}>
                    <div style={{ position: "absolute", inset: 0, background: frame >= f(c.button) + 2 ? "#2FB463" : "#F8D481", boxShadow: "inset 0 -6px 0 rgba(0,0,0,.08)" }} />
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT.sans, fontWeight: 800, fontSize: 44, letterSpacing: "0.01em", color: frame >= f(c.button) + 2 ? "#fff" : "#1A1A1A" }}>
                      {frame >= f(c.button) + 2 ? "✓  JOINED" : "JOIN $9/month"}
                    </div>
                  </div>
                )}
                {Array.from({ length: 14 }, (_, k) => {
                  const ang = (k / 14) * Math.PI * 2;
                  const d = 260 * burst;
                  return frame >= f(c.button) ? <div key={k} style={{ position: "absolute", left: 540 + Math.cos(ang) * d * 1.3, top: 55 + Math.sin(ang) * d * 0.45, width: 16, height: 16, borderRadius: 4, background: k % 3 ? A : "#fff", opacity: 1 - burst, transform: `rotate(${k * 40 + burst * 120}deg)` }} /> : null;
                })}
              </div>
              {/* the kit */}
              <div style={{ position: "absolute", left: 0, right: 0, top: 820, textAlign: "center", opacity: clamp(getA * 1.5), transform: `translateY(${(1 - getA) * 40}px)` }}>
                <span style={{ fontFamily: FONT.mono, fontWeight: 700, fontSize: 34, letterSpacing: "0.34em", color: A }}>YOU GET</span>
              </div>
              <div style={{ position: "absolute", left: 90, top: 900, width: 900, height: 840, opacity: clamp(kitA * 1.3), transform: `translateY(${(1 - kitA) * 400}px) scale(${(0.86 + 0.14 * kitA) * (1 + 0.03 * Math.sin(insidePulse * Math.PI))})` }}>
                {/* poster fan */}
                {p.posters.slice(0, 7).map((src, i) => {
                  const k = i - 3;
                  return (
                    <div key={i} style={{ position: "absolute", left: 450 - 95, top: 30, width: 190, height: 338, borderRadius: 18, overflow: "hidden", border: "4px solid #F4EFE4", boxShadow: "0 18px 40px rgba(0,0,0,.55)", transform: `translateX(${k * 112 * fan}px) translateY(${Math.abs(k) * 22 * fan}px) rotate(${k * 8 * fan}deg)`, transformOrigin: "50% 120%", zIndex: 10 - Math.abs(k) }}>
                      <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  );
                })}
                <div style={{ position: "absolute", left: 0, right: 0, top: 300, height: 520, borderRadius: 44, background: "linear-gradient(160deg,#1C1C22,#121216)", border: `2px solid ${A}66`, boxShadow: `0 40px 100px rgba(0,0,0,.6), 0 0 90px ${A}33`, overflow: "hidden", zIndex: 20 }}>
                  <div style={{ position: "absolute", left: 50, top: 56, display: "flex", alignItems: "center", gap: 30 }}>
                    <svg width="150" height="124" viewBox="0 0 150 124">
                      <path d="M8 22a12 12 0 0 1 12-12h38l14 14h58a12 12 0 0 1 12 12v68a12 12 0 0 1-12 12H20A12 12 0 0 1 8 104z" fill={A} />
                      <path d="M8 40h134v64a12 12 0 0 1-12 12H20A12 12 0 0 1 8 104z" fill="#FFD21F" />
                      <text x="75" y="96" textAnchor="middle" fontFamily="Inter" fontWeight="900" fontSize="46" fill="#111">17</text>
                    </svg>
                    <div>
                      <div style={{ fontFamily: FONT.sans, fontWeight: 900, fontSize: 74, letterSpacing: "-0.05em", color: "#fff", lineHeight: 0.95 }}>{p.kit.title}</div>
                      <div style={{ fontFamily: FONT.sans, fontWeight: 600, fontSize: 34, color: "rgba(255,255,255,.65)", marginTop: 10 }}>{p.kit.subtitle}</div>
                    </div>
                  </div>
                  <div style={{ position: "absolute", left: 50, right: 50, top: 230, height: 70, borderRadius: 18, background: "rgba(255,255,255,.06)", display: "flex", alignItems: "center", gap: 16, padding: "0 24px", fontFamily: FONT.mono, fontWeight: 700, fontSize: 28, color: "rgba(255,255,255,.85)" }}>
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={A} strokeWidth="2.6" strokeLinecap="round"><path d="M12 3v12m0 0-5-5m5 5 5-5M4 20h16" /></svg>
                    {p.kit.file}
                    <span style={{ marginLeft: "auto", color: "rgba(255,255,255,.5)" }}>{p.kit.size}</span>
                  </div>
                  <div style={{ position: "absolute", left: 0, right: 0, top: 340, height: 130, overflow: "hidden", maskImage: "linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent)" }}>
                    {[0, 1].map((row) => (
                      <div key={row} style={{ position: "absolute", top: row * 66, whiteSpace: "nowrap", transform: `translateX(${-(marquee * (row ? 0.8 : 1) + row * 300) % 2400}px)`, display: "flex", gap: 14 }}>
                        {[...p.names, ...p.names, ...p.names].map((n, i) => (
                          <span key={i} style={{ padding: "8px 20px", borderRadius: 99, background: (i + row) % 4 === 0 ? `${A}` : "rgba(255,255,255,.1)", color: (i + row) % 4 === 0 ? "#111" : "#fff", fontFamily: FONT.sans, fontWeight: 800, fontSize: 28 }}>{n}</span>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* cursor */}
              <div style={{ position: "absolute", left: handX, top: handY, opacity: handA, transform: "translate(-30%, -6%)" }}>
                <Hand size={110} pressed={handPress} />
              </div>
            </AbsoluteFill>
          )}
        </div>
      </div>
      {/* flashes on the big beats */}
      {[c.inside, c.cta2].map((t0, i) => {
        const fl = interpolate(frame, [f(t0) - 1, f(t0) + 1, f(t0) + 6], [0, 0.35, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return fl > 0 ? <AbsoluteFill key={i} style={{ background: "#fff", opacity: fl }} /> : null;
      })}
    </AbsoluteFill>
  );
};
