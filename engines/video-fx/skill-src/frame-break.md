---
description: Shrink a talking-head shot into a floating Instagram Reels or TikTok phone frame and have the speaker pop out of it. Their head breaks over the top edge and their hands reach past the sides, in 3D, with like / comment / share chrome, username and caption. Renders an MP4 for Reels, TikTok or Shorts. Use this whenever the user wants a pop-out or out-of-frame effect, a "breaking out of the phone" or "3D pop out" look, their video shown as a Reel or TikTok inside the video, a frame break, or a social-feed mockup of their own clip, even if they never mention Remotion.
---
## What it looks like
The full-screen shot springs down into a phone-shaped Reels window floating on a dark, blurred copy of the footage. The window crops the shot just above the speaker's eyes, but the cut-out speaker is layered on top. Their cap and forehead break out over the top edge, and their hands reach past the sides. Once the window settles, the feed chrome fades in: heart, comment, share and more icons with counts, a round avatar, the username, a Follow pill, a one-line caption and a progress bar. Captions sit below the phone.

## When to use it
- Talking about posting, going viral, or "this exact video".
- A hook that makes a plain talking head feel 3D in the first second.
- Showing the clip as it will look in the feed.

## Writing the config
- `username`: the creator's handle without @. Always ask for it or take it from context; never leave "yourhandle" in a final render.
- `caption`: one short line (under ~45 characters), or "auto" to use the first words spoken.
- `platform`: "reels" (default) or "tiktok" if they talk about TikTok.
- `likeAt`: put it on a payoff word ("@viral") to turn the heart red at that moment.
- `at`: when the shrink starts. 0.1s works for an opener; for a mid-video moment use a word anchor.
- `breakDepth` sets how much of the head pops out: 0.3 is a little, 0.7 is the whole face. `sideBreak` 1.0 turns off the side pop-out.

## Example
Line: "But the truth is I don't have to do that anymore thanks to this new Claude Code AI video editor."
```json
{
  "username": "alexbuilds",
  "caption": "Claude edited this whole reel",
  "likes": "12.8K",
  "comments": "342",
  "likeAt": "@anymore",
  "captions": { "emphasis": ["truth", "anymore", "Claude"] }
}
```

## Getting it right
- The pop-out needs headroom. If the speaker's head is cut off by the top of the source frame, there is nothing above the window to break out. Lower `breakDepth` or accept a smaller pop.
- A speaker who fills the frame edge to edge gets a straight cut where the footage ends; `sideFade` (default 0.08) softens it. Raise it to 0.12 if you still see a vertical line beside the window.
- Feed text is drawn small at window scale, so keep `caption` short and the counts realistic ("12.8K", "342").
- With an effect window that ends early, the shot springs back to full screen on its own. Use `outAt` to control when.
- Turn `ui` off for a clean floating window (good for non-social topics).
