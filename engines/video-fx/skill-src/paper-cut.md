---
description: Turn a talking-head shot into a handmade scrapbook collage — the speaker becomes a paper sticker with a torn white border over crayon scribbles, torn yellow paper and X marks, while ransom-note letters thunk in one by one, get circled in red marker and a second word pops in underneath. Renders an MP4 for Reels, TikTok or Shorts. Use this whenever the user wants a paper cut-out, scrapbook, collage, zine, ransom-note or "cut out from a magazine" look, a sticker version of themselves, crafty/handmade text, or a stat like "100%" called out in cut-out letters, even if they never mention Remotion.
---
## What it looks like
The background is swapped for off-white paper with a faint grid, a big blue crayon scribble across the top, a torn yellow strip with navy scribbles and red ticks, pink scribbles, X marks and loop doodles. The speaker, still talking, is cut out as a paper sticker with a thick, slightly ragged white border and a drop shadow, slapping into place. Ransom-note letters on mixed chips (blue, white, black, yellow; serif, slab, typewriter) land one by one, a red marker ring draws itself around them, then a smaller word pops in below. All the scribbles boil on threes like stop-motion.

## When to use it
- Calling out a number or claim: "100%", "3X", "$0", "FREE".
- A playful, creator-diary or "behind the scenes" moment that should feel handmade.
- A 2–5 second beat in the middle of a talk to reset attention (use `window`).

## Writing the config
- `headline`: 1–6 characters reads best (a number, %, or one short word). Take it from what the speaker says ("one hundred percent" → "100%"). Words up to ~8 letters shrink to fit.
- `subline`: one short word that completes the thought ("EDITED", "FREE", "DONE"), or `""` for none.
- `headlineAt`: anchor to the spoken word, e.g. `"@percent"` or `"@course-0.1"`, so the letters land as it is said. The ring and subline follow automatically.
- The collage replaces the whole background, so use it for a beat, not a whole video: pass `"window": [start, end]` (seconds in the clip) for a hard cut in and a quick fade back to the footage.
- Captions are off by default (the letters are the text). Turn them on with `"captions": {"enabled": true}`; the `box` style suits the look.
- Nudge the sticker with `stickerScale` (0.6–0.9), `stickerX` and `headTopTarget` if the head collides with the letters.

## Example
Line: "If you wanted to build your own course selling platform, all you have to do is download this GitHub repo."
```json
{
  "headline": "100%",
  "subline": "FREE",
  "headlineAt": "@course",
  "captions": { "enabled": false }
}
```

## Getting it right
- If the head overlaps the ring, lower the sticker (`"headTopTarget": 0.4`) or move the letters up (`"headlineY": 0.12`).
- Fast hand moves leave soft, semi-transparent edges in the cut-out; that reads fine as paper, but keep the beat short if hands fly around a lot.
- People sitting at a desk get cut where the desk is; the white border makes that edge look like a deliberate scissor cut.
- `"auto"` text picks a number from the transcript, otherwise the strongest word — always replace it with something meaningful when you know the topic.
- Turn collage pieces off with `"elements": {"loops": false, "marks": false}` for a cleaner page; change the palette under `colors` for brand colours.
