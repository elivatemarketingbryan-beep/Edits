import React, { useMemo } from "react";
import { AbsoluteFill, Easing, useCurrentFrame } from "remotion";
import { interpolate } from "../lib/interp";
import { clamp, prog, springAt } from "../lib/anim";
import { useFx } from "../lib/context";
import { FONT } from "../lib/fonts";
import { ClipVideo, MatteVideo } from "../lib/media";
import { makeFx } from "../lib/shell";
import { exitFrame } from "../lib/wallKit";

type Pt = { x: number; y: number };

/** Points of a polyline up to distance `d` along it. */
function partial(pts: Pt[], cum: number[], d: number): Pt[] {
  if (d <= 0) return [pts[0]];
  const out: Pt[] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    if (cum[i] <= d) {
      out.push(pts[i]);
      continue;
    }
    const seg = cum[i] - cum[i - 1];
    const f = seg > 0 ? (d - cum[i - 1]) / seg : 0;
    out.push({ x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * f, y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * f });
    break;
  }
  return out;
}
const poly = (p: Pt[]) => p.map((q) => `${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(" ");

/**
 * A line chart draws itself across the wall behind the speaker, then spikes up in
 * the accent colour with a glow, a dashed guide and a label pill at the take-off point.
 */
const ChartGrow: React.FC = () => {
  const frame = useCurrentFrame();
  const fx = useFx();
  const { cfg, width: W, height: H, subject, fps } = fx;
  const k = W / 1080;
  const accent = cfg.accent as string;
  const lineColor = cfg.lineColor as string;

  const labels: string[] = Array.isArray(cfg.labels) && cfg.labels.length ? cfg.labels.map(String) : ["M", "T", "W", "T", "F", "S", "S"];
  const values: number[] = useMemo(() => {
    const v: number[] = Array.isArray(cfg.values) && cfg.values.length ? cfg.values.map(Number) : [0.14, 0.17, 0.21, 0.25, 0.33, 0.64, 1];
    // one value per label: resample if the counts differ
    if (v.length === labels.length) return v;
    return labels.map((_, i) => {
      const f = (i / Math.max(1, labels.length - 1)) * (v.length - 1);
      const a = Math.floor(f);
      return v[a] + (v[Math.min(v.length - 1, a + 1)] - v[a]) * (f - a);
    });
  }, [cfg.values, labels]);
  const hf = clamp(Math.round(typeof cfg.highlightFrom === "number" ? cfg.highlightFrom : Math.max(1, labels.length - 3)), 0, labels.length - 1);

  // chart box
  const geo = useMemo(() => {
    if (Array.isArray(cfg.region) && cfg.region.length === 4) {
      const [a, b, c, d] = cfg.region.map(Number);
      return { x0: a * W, x1: c * W, labelsY: b * H, plotTop: b * H + 0.065 * H, plotBottom: d * H };
    }
    const labelsY = clamp(subject.headTop - 0.035 * H, 0.06 * H, 0.2 * H);
    const plotTop = labelsY + 0.065 * H;
    const plotBottom = plotTop + Math.max(0.2 * H, subject.headY - plotTop + 0.05 * H);
    return { x0: 0.085 * W, x1: 0.915 * W, labelsY, plotTop, plotBottom };
  }, [cfg.region, W, H, subject.headTop, subject.headY]);
  const { x0, x1, labelsY, plotTop, plotBottom } = geo;
  const xs = labels.map((_, i) => x0 + ((x1 - x0) * i) / Math.max(1, labels.length - 1));
  const pts: Pt[] = values.map((v, i) => ({ x: xs[i], y: plotBottom - clamp(v, 0, 1.05) * (plotBottom - plotTop) }));
  const cum = pts.reduce<number[]>((acc, p, i) => [...acc, i === 0 ? 0 : acc[i - 1] + Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y)], []);
  const L = cum[cum.length - 1];
  const Lh = cum[hf];

  const start = fx.t(cfg.at, 0.2);
  const drawF = Math.max(6, Math.round((cfg.drawDuration as number) * fps));
  const gridA = prog(frame, start - 4, 12);
  const p = interpolate(frame, [start + 6, start + 6 + drawF], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.45, 0, 0.3, 1) });
  const d = p * L;
  // frame at which the tip reaches the take-off point (for the pill + guide)
  const hitFrame = start + 6 + drawF * (Lh / Math.max(1, L)) * 0.8;
  const outF = exitFrame(fx, cfg.outAt, 9);
  const out = outF === null ? 0 : prog(frame, outF, 9);
  const vis = 1 - out;
  if (vis <= 0.001) {
    return (
      <AbsoluteFill>
        <ClipVideo />
      </AbsoluteFill>
    );
  }

  const drawn = partial(pts, cum, d);
  const white = partial(pts, cum, Math.min(d, Lh));
  const yellow = d > Lh ? partial(pts, cum, d).filter((_, i, arr) => i >= hf || i === arr.length - 1) : [];
  const yellowPts = d > Lh ? [pts[hf], ...yellow.filter((q) => q.x > pts[hf].x)] : [];
  const tip = drawn[drawn.length - 1];
  const sw = (cfg.lineWidth as number) * k;
  const pillSp = springAt(frame, fps, hitFrame + 2, { damping: 11, stiffness: 200, mass: 0.6 });
  const pillA = prog(frame, hitFrame + 2, 4);
  const guide = prog(frame, hitFrame, 8);
  const pillY = labelsY + 0.075 * H;
  const pillX = pts[hf].x;
  const done = p >= 1;
  const pulse = done ? 0.5 + 0.5 * Math.sin((frame - start - drawF) / 5) : 0;

  const pill = cfg.pill ? (
    <div
      style={{
        position: "absolute", left: clamp(pillX, 150 * k, W - 150 * k), top: pillY, transform: `translate(-50%, -50%) scale(${pillSp * vis})`,
        opacity: pillA * vis, background: accent, color: "#0B0B0C", borderRadius: 999, padding: `${10 * k}px ${24 * k}px ${10 * k}px ${26 * k}px`,
        fontFamily: FONT.sans, fontWeight: 900, fontSize: 40 * k, letterSpacing: "-0.01em", display: "flex", alignItems: "center", gap: 10 * k,
        boxShadow: `0 0 ${34 * k}px ${accent}88, 0 6px 18px rgba(0,0,0,.3)`, whiteSpace: "nowrap",
      }}
    >
      {String(cfg.pill).toUpperCase()}
      {cfg.arrow ? (
        <svg width={26 * k} height={26 * k} viewBox="0 0 24 24" fill="none" stroke="#0B0B0C" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 18 L18 6 M8 6 H18 V16" />
        </svg>
      ) : null}
    </div>
  ) : null;

  return (
    <AbsoluteFill>
      <ClipVideo />
      {/* soft darkening so the lines read on bright walls */}
      <AbsoluteFill style={{ opacity: gridA * vis * (cfg.dim as number), background: `linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(0,0,0,.85) ${(plotBottom / H) * 100}%, rgba(0,0,0,0) ${(plotBottom / H) * 100 + 14}%)` }} />
      <AbsoluteFill style={{ opacity: vis, transform: `translateY(${-out * 20 * k}px)` }}>
        {/* day labels */}
        {labels.map((lab, i) => {
          const a = prog(frame, start + i * 1.5, 8);
          return (
            <div key={i} style={{ position: "absolute", left: xs[i], top: labelsY, transform: `translate(-50%, ${(1 - a) * 10 * k}px)`, opacity: a * 0.92, fontFamily: FONT.sans, fontWeight: 600, fontSize: 34 * k, color: i >= hf + 1 && done ? "#FFFFFF" : "#F1F1F1", textShadow: "0 2px 8px rgba(0,0,0,.45)", letterSpacing: "0.04em" }}>
              {lab}
            </div>
          );
        })}
        <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <defs>
            <linearGradient id="cg-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accent} stopOpacity={0.42} />
              <stop offset="100%" stopColor={accent} stopOpacity={0} />
            </linearGradient>
          </defs>
          {/* grid */}
          <g opacity={gridA} stroke="rgba(255,255,255,.17)" strokeWidth={2 * k}>
            {xs.map((x, i) => (
              <line key={i} x1={x} x2={x} y1={labelsY + 0.035 * H} y2={labelsY + 0.035 * H + (plotBottom + 0.03 * H - labelsY - 0.035 * H) * prog(frame, start + i * 1.5, 14)} />
            ))}
            {[0, 1, 2, 3].map((r) => {
              const y = plotTop + ((plotBottom - plotTop) * r) / 3;
              return <line key={`h${r}`} x1={x0} x2={x0 + (x1 - x0) * prog(frame, start + 2 + r * 2, 14)} y1={y} y2={y} stroke="rgba(255,255,255,.1)" />;
            })}
          </g>
          {/* fill under the spike */}
          {yellowPts.length > 1 ? (
            <polygon points={poly([...yellowPts, { x: yellowPts[yellowPts.length - 1].x, y: plotBottom + 0.03 * H }, { x: yellowPts[0].x, y: plotBottom + 0.03 * H }])} fill="url(#cg-fill)" />
          ) : null}
          {/* guide from pill to take-off point */}
          {cfg.pill && guide > 0 ? (
            <line x1={pillX} x2={pillX} y1={pillY + 30 * k} y2={pillY + 30 * k + (pts[hf].y - pillY - 30 * k) * guide} stroke="rgba(255,255,255,.85)" strokeWidth={2.5 * k} strokeDasharray={`${7 * k} ${7 * k}`} />
          ) : null}
          {/* white run */}
          <polyline points={poly(white)} fill="none" stroke={lineColor} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 ${6 * k}px rgba(255,255,255,.55))` }} />
          {/* accent spike */}
          {yellowPts.length > 1 ? (
            <polyline points={poly(yellowPts)} fill="none" stroke={accent} strokeWidth={sw * 1.15} strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 ${8 * k}px ${accent}) drop-shadow(0 0 ${22 * k}px ${accent}99)` }} />
          ) : null}
          {/* vertices reached so far */}
          {pts.map((q, i) => {
            if (cum[i] > d + 0.5) return null;
            const a = prog(frame, start + 6 + drawF * (cum[i] / Math.max(1, L)) * 0.8, 5);
            if (i === hf) {
              return (
                <g key={i} opacity={a}>
                  <circle cx={q.x} cy={q.y} r={15 * k} fill="none" stroke={accent} strokeWidth={3 * k} />
                  <circle cx={q.x} cy={q.y} r={6 * k} fill="#0B0B0C" stroke="#fff" strokeWidth={2.5 * k} />
                </g>
              );
            }
            if (i === pts.length - 1) return null;
            return <circle key={i} cx={q.x} cy={q.y} r={7 * a * k} fill="#0B0B0C" stroke={i > hf ? accent : "#fff"} strokeWidth={3 * k} />;
          })}
          {/* tip */}
          {p > 0 ? (
            <g>
              <circle cx={tip.x} cy={tip.y} r={(18 + pulse * 10) * k} fill={d > Lh ? accent : "#fff"} opacity={0.18 + 0.12 * (1 - pulse)} />
              <circle cx={tip.x} cy={tip.y} r={9 * k} fill={d > Lh ? accent : "#fff"} style={{ filter: `drop-shadow(0 0 ${10 * k}px ${d > Lh ? accent : "#fff"})` }} />
            </g>
          ) : null}
        </svg>
        {!cfg.pillInFront ? pill : null}
      </AbsoluteFill>
      <MatteVideo />
      {cfg.pillInFront ? <AbsoluteFill style={{ opacity: vis }}>{pill}</AbsoluteFill> : null}
    </AbsoluteFill>
  );
};

export default makeFx(ChartGrow);
