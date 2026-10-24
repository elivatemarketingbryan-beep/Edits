---
description: Draw an animated growth chart on the wall behind a talking-head speaker — a minimal grid with day or month labels, a white line that draws itself left to right behind their head, then spikes up in glowing yellow with a gradient fill, dashed guide and a "SCALE ↗" pill. Renders an MP4 for Reels, TikTok or Shorts. Use this whenever the user mentions growth, results, revenue, followers, views going up, "it took off", scaling, a before/after jump, wants a graph or stats animation behind them, or the chart grow effect, even if they never mention Remotion.
---
## What it looks like
Faint vertical grid lines and labels (M T W T F S S) fade in across the top of the frame. A white line with small dots draws itself from left to right with a glowing tip, passing behind the speaker's head. At the take-off point it turns into a glowing yellow spike with a soft yellow gradient underneath, a dashed guide drops from a yellow pill (SCALE ↗) that pops in above it, and the end point pulses. The speaker is cut out and stays in front.

## When to use it
- Results and growth: "my views tripled", "revenue took off in week 3".
- Before/after moments where a flat period turns into a jump.
- Any stat the speaker says out loud.

## Writing the config
- `labels`: the time axis the speaker implies — days (`M T W T F S S`), months (`JAN…JUN`), weeks (`W1…W6`) or milestones. 4–8 labels fit.
- `values`: one 0–1 height per label, flat-ish then a jump; the last value 1 for the peak. Match the story (a slow start then a spike).
- `highlightFrom`: the label index where things took off (the spike and pill start there).
- `pill`: the result in 1–2 words or a number ("SCALE", "+312%", "10x"); it is upper-cased. `""` hides it.
- `at`: start on the word that introduces the result ("@grew", "@revenue").

## Example
Line: "This new Opus model should be capable of doing three absolutely mind-blowing things."
```json
{
  "at": "@model",
  "labels": ["JAN", "FEB", "MAR", "APR", "MAY", "JUN"],
  "values": [0.12, 0.15, 0.2, 0.28, 0.55, 1],
  "highlightFrom": 3,
  "pill": "10x",
  "captions": { "emphasis": ["Opus", "capable", "mind-blowing"] }
}
```

## Getting it right
- The chart is fitted above and around the head. If the speaker sits low in frame or you want a bigger chart, set `region` to `[0.08, 0.12, 0.92, 0.45]` (x0, label row, x1, chart bottom).
- The middle of the line hides behind the head by design; put the take-off (`highlightFrom`) on a side the viewer can see (usually the right third).
- On bright walls raise `dim` to 0.3 so the white line reads; on dark walls lower it to 0.1.
- `pillInFront: true` keeps the label readable even when it overlaps hair.
- Keep `drawDuration` around 0.8–1.4 s; slower feels like a slideshow.
