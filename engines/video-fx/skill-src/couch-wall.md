---
description: Fill the room behind a talking-head speaker with a wall of short-form video thumbnails — portrait tiles with ▷ view counts and headline stickers pop in around them while they stay in front, like a creator's grid of past reels. Renders an MP4 for Reels, TikTok or Shorts with two-tier captions. Use this whenever the user wants a "wall of videos" or "wall of thumbnails" behind them, social proof of their content, a creator-portfolio or "all my reels" moment, a collage behind the person, or the couch wall effect, even if they never mention Remotion.
---
## What it looks like
A masonry wall of 9:16-style thumbnails (rounded tiles, thin gaps) pops in tile by tile outward from the speaker's head in about half a second, covering the room behind them. Most tiles carry a white "▷ 1.07M" view-count badge, a few carry white headline stickers ("6 ways to make money with AI this week"). The speaker is cut out and stays in front; the wall drifts in very slowly while it holds. Captions are two-tier: a small setup line over one huge word ("selling a / COURSE").

## When to use it
- Social proof: "I've posted hundreds of videos", "this got millions of views".
- Talking about content, courses, a channel or a body of work.
- A punchy visual reset in the middle of a one-take talking head.

## Writing the config
- `at`: land the wall on the word that names the content ("@course", "@videos"), or 0.1–0.3s in.
- `media`: if the user has real thumbnails or clips, list their file paths; that's the most convincing look. With nothing given, tiles are stills of the clip itself at different moments, crops and grades — fine for a demo, but say so to the user.
- `labels`: 1–3 short hooks that sound like real video titles from the user's niche (≤ 7 words each). Use `[]` for none.
- `views`: optional; give real numbers if the user has them, otherwise leave `null` for plausible counts.
- `captions.emphasis`: the single word that should go huge in the two-tier caption ("course", "platform"). Two-tier captions read best when the emphasis word ends the phrase.

## Example
Line: "If you wanted to build your own course selling platform, all you have to do is download this GitHub repo."
```json
{
  "at": "@build",
  "labels": ["How I sell my course", "Can you tell??", "My $0 tech stack"],
  "views": ["1.07M", "534K", "133K", "5,488", "15.3K", "2.2M", "847K", "61K"],
  "captions": { "style": "twoTier", "emphasis": ["course", "platform", "GitHub"] }
}
```

## Getting it right
- Only the person is cut out. Props in front of them (a microphone on an arm, a desk lamp) are treated as background and disappear under the tiles; warn the user if their mic sits in front of the wall area.
- If the speaker's head is very high or low in frame, set `wallBottom` (0.45–0.7) so the wall stops around shoulder height.
- `columns: 4` makes smaller, denser tiles for close-up framing; `3` matches the reference.
- Keep the effect window short (2–5 s). Use `"window": [start, end]` or `outAt` so the wall pops away before the clip ends if the video continues.
- Two-tier captions with an emphasis word mid-phrase can read oddly; pick emphasis words that end a phrase, or switch `captions.style` to `"pop"`.
