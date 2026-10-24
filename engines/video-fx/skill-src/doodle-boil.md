---
description: Add hand-drawn doodle animation to a talking-head video — a white chalk outline traces the speaker and "boils" like cel animation while doodles (heart, clapperboard, star, crown, frame, arrow, sparkle) draw themselves on next to their head with pink and yellow scribble fills. Renders an MP4 for Reels, TikTok or Shorts. Use this whenever the user wants doodles, scribbles, sketch or chalk outlines, a hand-drawn/animated outline around themselves, "boiling lines", cartoon annotations, or a playful drawn-on look over their footage, even if they never mention Remotion.
---
## What it looks like
The footage plays untouched. A chunky white chalk line traces the speaker's silhouette a few pixels outside the body and re-wobbles every three frames, so it shimmers like hand-drawn animation. Doodles draw themselves on in the space beside and above the head (outline first, then a crayon scribble fill, then little spark lines) and boil along with the outline. A newer doodle in the same spot replaces the old one.

## When to use it
- Light, personal or funny moments where a little cartoon energy helps.
- Pointing at ideas: a heart on "love", a clapperboard on "video", a crown on "the best", a star on "three things".
- Hook or outro beats where you want movement without covering the face.

## Writing the config
- `"doodles": "auto"` drops a doodle on each emphasised word (heart → frame → clapperboard → square → star → sparkle → crown → swirl), at least `minGap` seconds apart. Good default.
- For meaning, list doodles that match the words: `{"type": "clapper", "slot": "left", "at": "@video"}`. Types: heart, clapper, frame, square, star, arrow, sparkle, crown, swirl, circle. Slots: left, right, topLeft, topRight, aboveHead (`crown` belongs `aboveHead`; `arrow` points at the head automatically).
- Use `fill` for the scribble colour (`#F58BB4` pink, `#FFE45C` yellow) or `null` for an empty outline; `accent` colours the spark lines.
- Use 3–5 doodles per 6 seconds; more gets busy. `until` removes one early.
- `outline.drawOn` traces the outline on at the start; set `"outline": {"enabled": false}` for doodles only.

## Example
Line: "This new Opus model should be capable of doing three absolutely mind-blowing things."
```json
{
  "doodles": [
    { "type": "star", "slot": "right", "at": "@three", "fill": "#FFE45C" },
    { "type": "crown", "slot": "aboveHead", "at": "@absolutely", "fill": "#FFE45C" },
    { "type": "arrow", "slot": "left", "at": "@mind" }
  ]
}
```

## Getting it right
- Doodles are placed from the head position; on tight close-ups they sit in the top corners. If one covers something important, give it an explicit `"x"`/`"y"` (0–1 fractions) instead of a slot.
- On bright white walls the chalk line needs its shadow: keep `shadow` around 0.35 (raise to 0.5 if it still disappears).
- The outline follows the cut-out, so desks, mics or chairs the matte includes or excludes change where the line goes; that is expected.
- Slower boil (`"boilEvery": 4`) feels calmer; `2` feels frantic.
- If the effect runs inside a `window`, the outline traces on at the start and everything fades out over the last few frames.
