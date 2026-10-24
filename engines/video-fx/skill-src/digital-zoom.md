---
description: Add punch-in "digital zoom" cuts with a radial zoom blur to a talking-head video, timed to the key words, the way short-form editors fake a second camera angle. Renders an MP4 for Reels, TikTok or Shorts with word-by-word captions. Use this whenever the user asks for punch-ins, zoom cuts, jump zooms, "digital zoom", zoom on emphasis, a more dynamic or more edited talking head, or wants a static clip to feel less flat, even if they never mention Remotion.
---
## What it looks like
The frame snaps 25–35% closer on an emphasised word, with a 4–6 frame radial zoom blur that sells the move, then holds. On the next emphasised word it snaps back out (or further in). Captions pop on word by word in white bold, with the key word in yellow.

## When to use it
- A one-take talking head that needs energy without b-roll.
- Landing a punchline or the key noun of a sentence ("video *editing*").
- Faking a second camera angle between sentences.

## Writing the config
- `punches: "auto"` punches on the words the captions highlight (the strongest noun per phrase), alternating in and out, never closer than `minGap` seconds. Good default.
- For control, list punches: `[{"at": "@editing", "scale": 1.3}, {"at": "@thousands", "scale": 1.0}]`. Use the word the speaker stresses, not filler.
- Keep `scale` between 1.15 and 1.4; above 1.4 footage goes soft. Keep at least ~1s between punches.
- Set `captions.emphasis` to the same words you punch on so the yellow word and the zoom land together.

## Example
Line: "I didn't have to spend thousands of dollars on video editing courses."
```json
{
  "punches": [
    { "at": "@thousands", "scale": 1.28 },
    { "at": "@editing", "scale": 1.0 }
  ],
  "captions": { "emphasis": ["thousands", "editing"] }
}
```

## Getting it right
- Punch on the stressed syllable's word start ("@word"), not on a pause, or it reads as a glitch.
- If the face drifts out of frame at high zoom, lower `scale` or set `focus` to `[0.5, 0.3]` (x, y fractions).
- Turn `blur` off for a cleaner, more corporate cut.
- Footage below 1080p will look soft when punched; keep scale ≤1.2 there.
