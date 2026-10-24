---
description: Make social-post cards orbit the speaker in 3D on a talking-head video. Thumbnails and posts circle their torso, slide behind their body and pass in front of it. Renders an MP4 for Reels, TikTok or Shorts with gold serif captions. Use this whenever the user wants cards, screenshots, thumbnails, testimonials or posts floating or circling around them, a 3D orbit or carousel around a person, social proof flying around the speaker, or "the orbit effect", even if they never mention Remotion.
---
## What it looks like
Six small portrait cards circle the speaker's chest on a tilted ring: Reel thumbnails with a white title chip and a ▷ view count, plus white text posts. The speaker is cut out of the shot, so cards on the far side slide behind their body while near cards pass in front, bigger and brighter. Far cards are smaller, darker and slightly soft. The cards whip in at the start and settle into a slow spin. Captions show a small white setup line with the key word in gold italic serif with sparkles.

## When to use it
- Social proof: past videos, results, testimonials, press mentions.
- Listing many things ("all these tools", "every platform") while the speaker talks.
- An eye-catching hook in the first two seconds.

## Writing the config
- Best: real media. Put the user's screenshots, thumbnails or short clips in `cards` as file paths, e.g. `[{"src": "~/Desktop/thumb1.png", "title": "1M views", "views": "1.2M"}]`. Use 4–8 cards. Every field is optional.
- Without media, the auto cards show stills of the clip itself. Give them `titles` that say something (results, topics, hooks from the transcript), 2–5 words each.
- `speed` 0.1–0.2 turns per second. Slower reads better when the cards carry text.
- `height` moves the ring on the body: 0.3 is the shoulders, 0.6 is the waist. On a wide shot of a seated person, 0.5 matches the reference reel.
- Set `captions.emphasis` to the word that should turn gold. Only one gold word per phrase shows.

## Example
Line: "The video that you're currently watching was edited completely using Claude Code."
```json
{
  "count": 6,
  "titles": ["Edited with Claude Code", "No editor needed", "Raw clip to finished reel", "Auto captions", "Motion graphics", "Ready to post"],
  "speed": 0.14,
  "captions": { "emphasis": ["watching", "Claude"] }
}
```

## Getting it right
- In close-up framing, the back half of the ring hides behind the body. That's correct. For the classic look, use a wider shot where the person is smaller in frame.
- Cards briefly cross-fade at the sides of the ring, where they switch from behind to in front. A low `speed` makes that read as a smooth pass.
- Card text is small, so keep titles under about 25 characters.
- Captions place themselves above the head on wide shots and below the ring on close-ups. Set `"captionPlacement": "keep"` plus `captions.y` to force a position.
- If the effect window ends before the clip, the cards fly away on their own. Use `outAt` to send them off earlier.
