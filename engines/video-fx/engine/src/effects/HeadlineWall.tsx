import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { clamp, easeIn, prog, springAt } from "../lib/anim";
import { useFx } from "../lib/context";
import { Card, type CardSpec } from "../lib/headlineCards";
import { ClipVideo, MatteVideo } from "../lib/media";
import { makeFx } from "../lib/shell";
import type { Word } from "../lib/types";
import { capFirst, exitFrame, lowerFirst, rnd, rndRange, stripEnd, topicWord } from "../lib/wallKit";

const BREAK = new Set("and but so because which then if when while or where".split(" "));
const LEAD = /^(and|but|so|because|which|then|meaning|or|like|um|uh)\s+/i;

/** Transcript → sentence pieces of 3..9 words, split at natural joints. */
function pieces(words: Word[]): string[] {
  const sentences: string[][] = [];
  let cur: string[] = [];
  for (const w of words) {
    cur.push(w.text);
    if (/[.!?;:,]$/.test(w.text)) {
      sentences.push(cur);
      cur = [];
    }
  }
  if (cur.length) sentences.push(cur);
  const out: string[][] = [];
  const split = (s: string[]) => {
    if (s.length <= 10) {
      if (s.length >= 3) out.push(s);
      return;
    }
    let best = Math.floor(s.length / 2);
    let bestD = Infinity;
    for (let i = 3; i <= s.length - 3; i++) {
      const lw = s[i].toLowerCase().replace(/[^a-z']/g, "");
      if (BREAK.has(lw) && Math.abs(i - s.length / 2) < bestD) {
        best = i;
        bestD = Math.abs(i - s.length / 2);
      }
    }
    split(s.slice(0, best));
    split(s.slice(best));
  };
  sentences.forEach(split);
  return out.map((p) => capFirst(stripEnd(p.join(" ").replace(LEAD, "").replace(LEAD, "")))).filter((p) => p.split(" ").length >= 3);
}

/** Zero-config wall content written from the clip's own transcript. */
function autoCards(words: Word[], count: number): CardSpec[] {
  const topic = topicWord(words);
  const tl = topic.toLowerCase();
  const T = capFirst(topic);
  const seen = new Set<string>();
  const ps = pieces(words).filter((p) => {
    const key = p.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const withTopic = ps.find((p) => p.toLowerCase().includes(tl));
  // transcript pieces first, then topic headlines, so nothing repeats on short clips
  const pool = [
    ...ps.filter((p) => p !== withTopic),
    `${T} just changed the game`,
    `Nobody is talking about this`,
    `I tried ${T} for 7 days`,
    `Is ${T} worth the hype?`,
    `${T} vs. doing it the old way`,
    `How I use ${T} every single day`,
    `This is the future of content`,
    `Everyone will be doing this soon`,
    `${T} did this in minutes`,
  ];
  let n = 0;
  const next = () => pool[n++ % pool.length];
  const pov = (p: string) => (p.toLowerCase().startsWith(tl) ? p : lowerFirst(p));
  const query = (withTopic ?? `is ${tl} worth it`).toLowerCase().split(" ").slice(0, 6).join(" ");
  const cards: CardSpec[] = [
    { type: "note", kicker: "Creator briefing", text: capFirst(next()) },
    { type: "search", text: query },
    { type: "tweet", name: "Agency owner", handle: "@agencyowner", text: `${capFirst(next())}.` },
    { type: "pov", text: pov(next()) },
    { type: "quote", text: `${capFirst(next())}.`, name: "@founder" },
    { type: "bubble", text: `wait, ${tl}??` },
    { type: "notify", name: "Trending", text: capFirst(next()) },
    { type: "note", kicker: "Weekly digest", text: capFirst(next()) },
    { type: "tweet", name: "Solo creator", handle: "@makesreels", text: `${capFirst(next())} 🤯` },
    { type: "quote", text: `${capFirst(next())}.`, name: "@editor" },
    { type: "pov", text: pov(next()) },
    { type: "note", kicker: "Breaking", text: capFirst(next()) },
  ];
  const hero: CardSpec = {
    type: "note",
    kicker: "Tech newsletter",
    text: withTopic && withTopic.split(" ").length >= 3 ? capFirst(withTopic) : `${T} changes everything`,
    highlight: topic,
    hero: true,
  };
  return [...cards.slice(0, Math.max(1, count - 1)), hero];
}

type Slot = { cx: number; cy: number; w: number; rot: number; score: number; i: number };

/**
 * Headlines, tweets, search pills and POV cards slap onto the wall behind the speaker
 * one after another; the hero card lands last, bigger, with a highlighter swipe.
 */
const HeadlineWall: React.FC = () => {
  const frame = useCurrentFrame();
  const fx = useFx();
  const { cfg, width: W, height: H, subject, fps } = fx;
  const k = W / 1080;

  const cards: CardSpec[] = useMemo(() => {
    const list = Array.isArray(cfg.cards) && cfg.cards.length ? (cfg.cards as CardSpec[]) : autoCards(fx.words, cfg.count as number);
    // exactly one hero: an explicit hero, else the first card with a highlight
    let heroIdx = list.findIndex((c) => c.hero);
    if (heroIdx < 0) heroIdx = list.findIndex((c) => c.highlight);
    return list.map((c, i) => ({ ...c, type: c.type || "note", text: String(c.text ?? ""), hero: i === heroIdx }));
  }, [cfg.cards, cfg.count, fx.words]);

  const bottom = typeof cfg.wallBottom === "number" ? cfg.wallBottom : clamp(subject.headY / H + 0.17, 0.3, 0.56);
  const cols = Math.max(2, Math.round(cfg.columns as number));

  const placed = useMemo(() => {
    const cellW = (W * 1.04) / cols;
    const rowH = cellW * 0.6;
    const y0 = 0.02 * H;
    const rows = Math.max(2, Math.ceil((bottom * H - y0) / rowH));
    const headR = subject.headY - subject.headTop;
    const ex = subject.centerX;
    const ey = subject.headY - headR * 0.15;
    const rx = Math.max(0.2 * W, headR * 1.0);
    const ry = headR * 1.35;
    const slots: Slot[] = [];
    let i = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const w = cellW * rndRange(`sw${i}`, 0.84, 0.97) * (cfg.cardScale as number);
        let cx = -0.02 * W + (c + 0.5) * cellW + (r % 2 ? 0.14 : -0.08) * cellW + rndRange(`sx${i}`, -0.1, 0.1) * cellW;
        cx = clamp(cx, w / 2 + 0.02 * W, W - w / 2 - 0.02 * W);
        const cy = y0 + (r + 0.5) * rowH + rndRange(`sy${i}`, -0.14, 0.14) * rowH;
        const d = ((cx - ex) / rx) ** 2 + ((cy - ey) / ry) ** 2;
        slots.push({ cx, cy, w, rot: rndRange(`sr${i}`, -4, 4), score: d + rnd(`ss${i}`) * 0.3, i });
        i++;
      }
    }
    const pool = [...slots];
    const take = (pick: (s: Slot) => number) => {
      let bi = 0;
      pool.forEach((s, n) => (pick(s) > pick(pool[bi]) ? (bi = n) : null));
      return pool.splice(bi, 1)[0];
    };
    const result: { card: CardSpec; slot: Slot; order: number }[] = [];
    const hero = cards.find((c) => c.hero);
    // hero: the most visible slot in the upper part of the wall
    const heroSlot = hero ? take((s) => Math.min(s.score, 2.5) * (1.15 - s.cy / H) * (s.cy < subject.headY ? 1 : 0.4)) : null;
    const rest = cards.filter((c) => !c.hero);
    rest.forEach((card, n) => {
      if (!pool.length) return;
      result.push({ card, slot: take((s) => s.score), order: n });
    });
    if (hero && heroSlot) {
      const hw = heroSlot.w * 1.28;
      result.push({ card: hero, slot: { ...heroSlot, w: hw, cx: clamp(heroSlot.cx, hw / 2 + 0.03 * W, W - hw / 2 - 0.03 * W), cy: Math.max(heroSlot.cy, 0.08 * H), rot: heroSlot.rot * 0.5 }, order: rest.length });
    }
    return result;
  }, [W, H, cols, bottom, cards, subject.centerX, subject.headY, subject.headTop, cfg.cardScale]);

  const start = fx.t(cfg.at, 0.1);
  const stagger = cfg.stagger as number;
  const heroDelay = cfg.heroDelay as number;
  const outF = exitFrame(fx, cfg.outAt, 10);
  const n = placed.length;

  return (
    <AbsoluteFill>
      <ClipVideo />
      {(cfg.dim as number) > 0 ? (
        <AbsoluteFill style={{ background: `linear-gradient(180deg, rgba(0,0,0,${cfg.dim}) 0%, rgba(0,0,0,${(cfg.dim as number) * 0.6}) ${bottom * 100}%, rgba(0,0,0,0) ${bottom * 100 + 12}%)`, opacity: prog(frame, start, 8) }} />
      ) : null}
      <AbsoluteFill>
        {placed.map(({ card, slot, order }) => {
          const s0 = start + order * stagger + (card.hero ? heroDelay : 0);
          const sp = springAt(frame, fps, s0, { damping: 11, stiffness: 230, mass: 0.55 });
          const a = prog(frame, s0, 3);
          let out = 0;
          if (outF !== null) out = prog(frame, outF + (n - 1 - order) * (5 / n), 7, easeIn);
          if (a * (1 - out) <= 0.001) return null;
          const lift = 1 - sp;
          const dir = rnd(`dir${slot.i}`) < 0.5 ? -1 : 1;
          const scale = (1.28 - 0.28 * sp) * (1 - 0.4 * out);
          return (
            <div
              key={`${order}-${slot.i}`}
              style={{
                position: "absolute", left: slot.cx - slot.w / 2, top: slot.cy, width: slot.w,
                transform: `translateY(-50%) translateY(${-lift * 26 * k}px) rotate(${slot.rot + dir * lift * 7}deg) scale(${scale})`,
                opacity: a * (1 - out),
                filter: `drop-shadow(0 ${(5 + lift * 18) * k}px ${(9 + lift * 22) * k}px rgba(0,0,0,${0.32 + lift * 0.1}))`,
              }}
            >
              <Card spec={card} w={slot.w} markProgress={prog(frame, s0 + 7, 10)} accent={cfg.accent} caret={Math.floor(frame / 14) % 2 === 0} />
            </div>
          );
        })}
      </AbsoluteFill>
      <MatteVideo />
    </AbsoluteFill>
  );
};

export default makeFx(HeadlineWall);
