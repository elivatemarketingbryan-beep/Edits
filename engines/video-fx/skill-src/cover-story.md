---
description: Turn a talking-head shot into a magazine cover — a giant Vogue-style serif masthead rises in letter by letter behind the speaker's head, with optional issue line and coverlines. Renders an MP4 for Reels, TikTok or Shorts. Use this whenever the user wants a magazine cover look, a masthead or big serif title behind their head, a "cover story" or editorial title card on their own footage, text behind the person, or a fashion/editorial intro for a video, even if they never mention Remotion.
---
## What it looks like
A huge white Didone word (like EDIT) fills the top of the frame and rises in letter by letter with a soft blur. The speaker is cut out and layered on top, so their head covers the bottom of the letters, exactly like a printed magazine cover. Optional small issue line under it and coverlines down the sides.

## When to use it
- Opening a video about a single big idea ("FOCUS", "SCALE", "EDIT").
- Introducing yourself or a topic as if you're the cover story.
- Any "text behind the person" moment where one word should own the screen.

## Writing the config
- `title`: one short word (3–6 letters reads best) that names the topic; take it from the transcript's key noun or the user's brand. Longer words get smaller automatically.
- `at`: start a beat before the word is said ("@scale-0.2") or at 0.1–0.3s.
- `issue` and `coverlines` are optional; only add them if the video has real numbers or phrases to put there (e.g. `{"title": "10x", "sub": "more content"}`).
- `overlap` controls how much of the word the head hides (0.3 = mostly visible, 0.6 = heavily covered).

## Example
Line: "This new Opus model should be capable of doing three absolutely mind-blowing things."
```json
{
  "title": "OPUS",
  "issue": "THE MODEL ISSUE · NO. 01",
  "coverlines": [
    { "title": "3x", "sub": "mind-blowing upgrades" },
    { "title": "Swarms", "sub": "hundreds of agents" }
  ]
}
```

## Getting it right
- The masthead is placed from where the head is. If the speaker's head is very high in frame, set `y` (e.g. 0.05) and lower `overlap`.
- Busy or bright backgrounds make white letters hard to read; try `"color": "#111111"` on light walls.
- Keep captions low (`captions.y` ≥ 0.72) so they don't collide with coverlines.
- The issue line and coverlines sit in front of the speaker (so they stay readable); keep them short so they don't run across the face or hair.
