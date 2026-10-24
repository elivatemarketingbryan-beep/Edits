---
description: Add a Hitchcock dolly-zoom ("vertigo" effect) to a talking-head video. The speaker stays locked in place at the same size while the room behind them zooms in or falls away, built from a clean background plate so there is no ghosting. Renders an MP4 for Reels, TikTok or Shorts with bold all-caps captions. Use this whenever the user wants a dolly zoom, vertigo shot, Hitchcock zoom, Jaws zoom, a "background zooms but I don't" moment, a dramatic realisation beat, or a cinematic push on a single line, even if they never mention Remotion.
---
## What it looks like
The speaker is cut out and held perfectly still at one size while the room behind them steadily zooms. With "push" the wall, lights and plants swell toward the camera; with "pull" they fall away. The move is a single eased 1–2.5 second beat, then it holds. Captions are white, bold, all caps, with the key word in yellow, sitting just below the face.

## When to use it
- A realisation or reveal line ("…and then it hit me").
- Emphasising one dramatic sentence in an otherwise static talking head.
- A cinematic opener on a wide shot where the room is visible.

## Writing the config
- `at`: start the zoom just before the key word, e.g. `"@course-0.3"`. `duration` 1.5–2.2s is the sweet spot; null runs it to the end.
- `direction`: "push" (the room approaches, like the reference) or "pull" (the room recedes, more unsettling).
- `intensity` 0.2–0.3. The speaker is shown punched in by this much the whole time. Higher values crop the face on close-ups.
- `easing`: "linear" is the most Hitchcock; "inOut" is smoother for social.
- Put the key word in `captions.emphasis` so the yellow word lands with the move.

## Example
Line: "If you wanted to build your own course selling platform, all you have to do is download this GitHub repo."
```json
{
  "direction": "push",
  "intensity": 0.28,
  "at": "@course-0.3",
  "duration": 1.8,
  "captions": { "emphasis": ["course", "download"] }
}
```

## Getting it right
- The effect is only as visible as the room. On tight close-ups with a plain wall it is subtle; it shines on medium and wide shots with depth (windows, shelves, lamps).
- The background is a still "clean plate" made from the clip, so moving things behind the speaker (screens, people) freeze during the effect. Use `"background": "video"` to keep them live, at the cost of possible faint slivers on big gestures.
- Objects the cut-out leaves out (a microphone in front of the face) move with the room. Keep `intensity` modest if a mic sits in front of the speaker.
- The first prep of a clip builds the plate (a few seconds); later renders reuse it.
- If the effect starts mid-clip it punches in over 6 frames, and if it ends early it eases back to the original framing. Set `entry` to "cut" for hard cuts.
