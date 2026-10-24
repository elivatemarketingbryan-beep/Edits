import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { interpolate } from "../lib/interp";
import { clamp, easeInOut, easeOut, prog } from "../lib/anim";
import { useFx } from "../lib/context";
import { fitFontSize } from "../lib/fonts";
import { ClipVideo, MatteVideo } from "../lib/media";
import { makeFx } from "../lib/shell";
import { exitFrame } from "../lib/wallKit";

const FAMILIES: Record<string, { family: string; weight: number; cap: number }> = {
  black: { family: "Archivo Black", weight: 400, cap: 0.72 },
  sans: { family: "Inter", weight: 900, cap: 0.73 },
  serif: { family: "Playfair Display", weight: 800, cap: 0.71 },
  didone: { family: "Bodoni Moda", weight: 700, cap: 0.7 },
};

/**
 * Refraction map for thick glass: the text is drawn, blurred into a height field and
 * turned into a normal map (R = x slope, G = y slope). Fed to feDisplacementMap it bends
 * the room strongly near the rims of each glyph and leaves the middle calm, like a lens.
 */
function normalMap(o: {
  w: number; h: number; text: string; font: string; spacingPx: number; sx: number; baseline: number; blur: number;
}): string {
  const c = document.createElement("canvas");
  c.width = Math.ceil(o.w);
  c.height = Math.ceil(o.h);
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.filter = `blur(${o.blur}px)`;
  ctx.fillStyle = "#fff";
  ctx.font = o.font;
  (ctx as any).letterSpacing = `${o.spacingPx}px`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.setTransform(o.sx, 0, 0, 1, 0, 0);
  ctx.fillText(o.text, o.w / 2 / o.sx + o.spacingPx / 2, o.baseline);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.filter = "none";
  const src = ctx.getImageData(0, 0, c.width, c.height);
  const out = ctx.createImageData(c.width, c.height);
  const W = c.width, H = c.height, d = src.data, n = out.data;
  const hgt = (x: number, y: number) => d[(Math.min(H - 1, Math.max(0, y)) * W + Math.min(W - 1, Math.max(0, x))) * 4] / 255;
  const gain = 5.5;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const gx = (hgt(x + 2, y) - hgt(x - 2, y)) / 4;
      const gy = (hgt(x, y + 2) - hgt(x, y - 2)) / 4;
      const i = (y * W + x) * 4;
      n[i] = clamp(128 + gx * gain * 255, 0, 255);
      n[i + 1] = clamp(128 + gy * gain * 255, 0, 255);
      n[i + 2] = 128;
      n[i + 3] = 255;
    }
  }
  ctx.putImageData(out, 0, 0);
  return c.toDataURL("image/png");
}

/**
 * Giant thick-glass letters stand on the wall behind the speaker in perspective: an
 * extruded body of bright edges, a front face that refracts (bends and magnifies) the room,
 * a glossy highlight band, dark inner edges, specular rims, a wall shadow and a light sweep.
 * The cut-out speaker stays in front.
 */
const GlassType: React.FC = () => {
  const frame = useCurrentFrame();
  const fx = useFx();
  const { cfg, width: W, height: H, subject, fps } = fx;
  const k = W / 1080;
  const word = String(cfg.word || "DESIGN").toUpperCase();
  const f = FAMILIES[cfg.font as string] ?? FAMILIES.black;
  const spacing = cfg.letterSpacing as number;
  const sx = clamp(cfg.condense as number, 0.4, 1.2);
  const ry0 = cfg.rotateY as number;

  // size: solve for the text half-width whose *projected* width (after the perspective turn)
  // fills `widthFraction` of the frame, and the shift that re-centres the projected word.
  const P = 1500 * k;
  const r = (Math.abs(ry0) * Math.PI) / 180;
  const proj = (hw: number) => {
    const xL = (-hw * Math.cos(r) * P) / (P - hw * Math.sin(r));
    const xR = (hw * Math.cos(r) * P) / (P + hw * Math.sin(r));
    return { w: xR - xL, c: ((xR + xL) / 2) * Math.sign(ry0 || 1) };
  };
  const { fontSize, textW, shiftX } = useMemo(() => {
    const target = W * (cfg.widthFraction as number) * (cfg.size as number);
    let lo = 10;
    let hi = Math.min(W * 2, P / Math.max(0.05, Math.sin(r)) - 1);
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      if (proj(mid).w < target) lo = mid;
      else hi = mid;
    }
    let tw = lo * 2;
    let fs = fitFontSize(word, `${f.weight} '${f.family}'`, tw / sx, spacing);
    // readability: short words would get so tall that the head hides most of them.
    // Cap the letter height so at least (1 - overlap) of every letter clears the head.
    const near = P / (P - lo * Math.sin(r));
    const maxCap = typeof cfg.y === "number"
      ? 0.26 * H
      : Math.min(0.24 * H, Math.max(0.07 * H, (subject.headTop - 0.03 * H) / (Math.max(0.3, 1 - (cfg.overlap as number)) * near)));
    if (fs * f.cap > maxCap) {
      fs = maxCap / f.cap;
      const c = document.createElement("canvas").getContext("2d")!;
      c.font = `${f.weight} ${fs}px '${f.family}'`;
      tw = (c.measureText(word).width + spacing * fs * (word.length - 1)) * sx;
    }
    return { fontSize: fs, textW: tw, shiftX: -proj(tw / 2).c };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word, f.weight, f.family, W, H, cfg.widthFraction, cfg.size, cfg.y, cfg.overlap, subject.headTop, spacing, sx, ry0, P]);
  const capH = fontSize * f.cap;
  const pad = fontSize * 0.25;
  const boxW = textW + pad * 2;
  const boxH = fontSize * 1.25;
  const baseline = boxH * 0.86;
  const left = W / 2 - boxW / 2 + shiftX + (cfg.x as number) * W;
  let capTop: number;
  if (typeof cfg.y === "number") capTop = cfg.y * H;
  else capTop = clamp(subject.headTop + (cfg.overlap as number) * capH - capH, 0.035 * H, 0.62 * H);
  // the near side of the word is enlarged by perspective; keep its top inside the frame
  const sNear = P / (P - (textW / 2) * Math.sin(r));
  const oy = capTop - (baseline - capH) + boxH * 0.6;
  const projTop = oy - (oy - capTop) * sNear;
  capTop += Math.max(0, 0.03 * H - projTop);
  const top = capTop - (baseline - capH);

  const id = `gt-${fx.offset}`;
  const map = useMemo(
    () =>
      normalMap({
        w: boxW, h: boxH, text: word, font: `${f.weight} ${fontSize}px '${f.family}'`, spacingPx: spacing * fontSize,
        sx, baseline, blur: fontSize * 0.075,
      }),
    [boxW, boxH, word, f.weight, f.family, fontSize, spacing, sx, baseline],
  );

  const start = fx.t(cfg.at, 0.15);
  const inF = Math.round((cfg.fadeDuration as number) * fps);
  const a = prog(frame, start, inF, easeOut);
  const outF = exitFrame(fx, cfg.outAt, 10);
  const out = outF === null ? 0 : prog(frame, outF, 10);
  const vis = a * (1 - out);
  const sweep = prog(frame, start + inF * 0.5, Math.round((cfg.sweepDuration as number) * fps), easeInOut);
  const drift = interpolate(frame, [start, fx.dur], [-1, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ry = ry0 + drift * (cfg.sway as number);
  const rx = cfg.rotateX as number;
  const depth = (cfg.depth as number) * k;
  const layers = Math.max(6, Math.round(depth / (2.4 * k)));
  const tint = cfg.tint as string;
  const refr = cfg.refraction as number;

  // one <text> definition used everywhere (clip, strokes, map all share the same geometry)
  const text = (props: React.SVGProps<SVGTextElement>) => (
    <text
      x={boxW / 2 / sx + (spacing * fontSize) / 2}
      y={baseline}
      textAnchor="middle"
      fontFamily={f.family}
      fontWeight={f.weight}
      fontSize={fontSize}
      letterSpacing={`${spacing * fontSize}px`}
      transform={`scale(${sx}, 1)`}
      {...props}
    >
      {word}
    </text>
  );
  const shifted = (dx: number, dy: number, props: React.SVGProps<SVGTextElement>) => (
    <g transform={`translate(${dx}, ${dy})`}>{text(props)}</g>
  );

  if (vis <= 0.001) {
    return (
      <AbsoluteFill>
        <ClipVideo />
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill>
      <ClipVideo />
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <defs>
          <clipPath id={`${id}-clip`} clipPathUnits="userSpaceOnUse">
            {text({})}
          </clipPath>
          {/* refraction: displace the room copy with the glyph normal map (coords = room copy's own box) */}
          <filter id={`${id}-refract`} filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" x={left} y={top} width={boxW} height={boxH} colorInterpolationFilters="sRGB">
            <feImage href={map} x={left} y={top} width={boxW} height={boxH} preserveAspectRatio="none" result="map" />
            <feDisplacementMap in="SourceGraphic" in2="map" scale={fontSize * refr * 1.4} xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <linearGradient id={`${id}-face`} x1="0" y1="0" x2="0.25" y2="1">
            <stop offset="0%" stopColor={tint} stopOpacity={0.34} />
            <stop offset="40%" stopColor={tint} stopOpacity={0.05} />
            <stop offset="80%" stopColor={tint} stopOpacity={0.0} />
            <stop offset="100%" stopColor={tint} stopOpacity={0.16} />
          </linearGradient>
          <linearGradient id={`${id}-gloss`} gradientUnits="userSpaceOnUse" x1={0} y1={baseline - capH * 1.05} x2={boxW * 0.12} y2={baseline - capH * 0.2}>
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0} />
            <stop offset="18%" stopColor="#FFFFFF" stopOpacity={0.62} />
            <stop offset="42%" stopColor="#FFFFFF" stopOpacity={0.26} />
            <stop offset="46%" stopColor="#FFFFFF" stopOpacity={0} />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
          </linearGradient>
          <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity={1} />
            <stop offset="40%" stopColor="#FFFFFF" stopOpacity={0.55} />
            <stop offset="70%" stopColor="#FFFFFF" stopOpacity={0.95} />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity={0.5} />
          </linearGradient>
          <linearGradient id={`${id}-sweep`} x1="0" y1="0" x2="1" y2="0.35">
            <stop offset={clamp(sweep * 1.5 - 0.4, 0, 1)} stopColor="#FFFFFF" stopOpacity={0} />
            <stop offset={clamp(sweep * 1.5 - 0.25, 0, 1)} stopColor="#FFFFFF" stopOpacity={0.85} />
            <stop offset={clamp(sweep * 1.5 - 0.1, 0, 1)} stopColor="#FFFFFF" stopOpacity={0} />
          </linearGradient>
        </defs>
      </svg>

      {/* shadow cast on the wall (down/right of the letters) */}
      <svg width={boxW} height={boxH} style={{ position: "absolute", left: left + fontSize * 0.07, top: top + fontSize * 0.1, overflow: "visible", opacity: vis * (cfg.shadow as number), filter: `blur(${fontSize * 0.05}px)`, transform: `perspective(${1500 * k}px) rotateX(${rx}deg) rotateY(${ry}deg)`, transformOrigin: "50% 60%" }}>
        {text({ fill: "#0A0A0C" })}
      </svg>

      <div
        style={{
          position: "absolute", left, top, width: boxW, height: boxH,
          opacity: vis, filter: vis < 0.999 ? `blur(${(1 - vis) * 16 * k}px)` : undefined,
          transform: `scale(${0.92 + 0.08 * a})`, transformOrigin: "50% 60%",
        }}
      >
        <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", transform: `perspective(${1500 * k}px) rotateX(${rx}deg) rotateY(${ry}deg)`, transformOrigin: "50% 60%" }}>
          {/* extruded body, back to front */}
          {Array.from({ length: layers }, (_, n) => {
            const i = layers - n;
            const fz = i / layers;
            return (
              <svg key={i} width={boxW} height={boxH} style={{ position: "absolute", inset: 0, overflow: "visible", transform: `translateZ(${-i * (depth / layers)}px)` }}>
                {text({
                  fill: `rgba(235,240,245,${0.006 + 0.008 * (1 - fz)})`,
                  stroke: i === layers ? "rgba(255,255,255,.65)" : `rgba(255,255,255,${0.1 + 0.3 * (1 - fz)})`,
                  strokeWidth: (i === layers ? 2.2 : 1.3) * k,
                })}
              </svg>
            );
          })}
          {/* front face: the room, bent through the glass */}
          <div style={{ position: "absolute", inset: 0, clipPath: `url(#${id}-clip)`, transform: "translateZ(0.5px)" }}>
            <div
              style={{
                position: "absolute", left: -left, top: -top, width: W, height: H,
                transform: `scale(${1 + refr * 0.4})`, transformOrigin: `${left + boxW / 2}px ${top + boxH * 0.55}px`,
                filter: `url(#${id}-refract) brightness(${cfg.brightness}) contrast(1.06) saturate(1.05)`,
              }}
            >
              <ClipVideo />
            </div>
          </div>
          <svg width={boxW} height={boxH} style={{ position: "absolute", inset: 0, overflow: "visible", transform: "translateZ(1px)" }}>
            {/* thin dark outline so the glass separates from the wall */}
            {text({ fill: "none", stroke: "rgba(10,10,14,.45)", strokeWidth: 3.2 * k })}
            {text({ fill: `url(#${id}-face)` })}
            <g clipPath={`url(#${id}-clip)`}>
              {/* thickness: dark inner edge lower-right, bright inner edge upper-left */}
              {shifted(fontSize * 0.022, fontSize * 0.03, { fill: "none", stroke: "rgba(8,10,14,.55)", strokeWidth: fontSize * 0.075, style: { filter: `blur(${fontSize * 0.012}px)` } })}
              {shifted(-fontSize * 0.016, -fontSize * 0.022, { fill: "none", stroke: "rgba(255,255,255,.8)", strokeWidth: fontSize * 0.045, style: { filter: `blur(${fontSize * 0.008}px)` } })}
              {/* glossy highlight band + travelling sweep */}
              <rect x={0} y={0} width={boxW} height={boxH} fill={`url(#${id}-gloss)`} />
              {text({ fill: `url(#${id}-sweep)` })}
            </g>
            {text({ fill: "none", stroke: `url(#${id}-rim)`, strokeWidth: 2.8 * k, style: { filter: `drop-shadow(0 0 ${4 * k}px rgba(255,255,255,.7))` } })}
          </svg>
        </div>
      </div>
      <MatteVideo />
    </AbsoluteFill>
  );
};

export default makeFx(GlassType);
