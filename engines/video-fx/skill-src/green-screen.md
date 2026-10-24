---
description: Put a talking-head speaker on a new background without a green screen. The person is cut out and set into an animated app UI (focus timer, task list, chat input with a typing cursor, a big serif line behind their head), or onto any image, video or gradient. Renders an MP4 for Reels, TikTok or Shorts with boxed word captions. Use this whenever the user wants to replace or remove their background, a virtual or fake green screen, to stand in front of an app, website, product or screenshot, a "me in front of the UI" shot, or background removal on video, even if they never mention Remotion.
---
## What it looks like
The room dissolves away while the speaker glides down into the lower centre of the frame. They are cut out and stay there at a smaller size. By default they stand in front of an animated productivity app with a purple band on top. The cream app window holds a black FOCUS bar with a ticking countdown, and a task list whose first task ticks off with a red NOW pill. A big serif line ("Everything else waits.") sits behind their head. A chat input below gets clicked by a cursor and typed into, over a blue band. Captions are word chips: white on black, with the key word on yellow.

## When to use it
- Talking about an app, tool, workflow or product: put the speaker in front of it.
- Replacing a messy or boring room with a branded image or gradient.
- A "focus / productivity / do this one thing" message (the default UI says exactly that).

## Writing the config
- Default UI: rewrite `task`, `tasks` (3 rows, first is active), `timer`, `input` (what gets typed) and `headline` to match what the speaker says. Keep `app` as the tool being discussed.
- `headline` on the default app UI sits behind the head (like the reference) — 18–26 characters, and expect the middle to be covered. On image, video and gradient backgrounds it is placed just above the head and stays readable; up to ~24 characters, or lower `headlineSize` for longer lines.
- Own media: `"background": {"type": "image", "src": "path.png"}` or `{"type": "video", "src": "path.mp4"}` (add `"blur": 12, "brightness": 0.7` to push it back). `"fit": "cover"` (default) fills the frame and crops — a landscape 16:9 image keeps only its middle third, so pick the part with `"position": "30% 50%"`; `"fit": "contain"` shows the whole image over a blurred fill. Set `headlineColor` for contrast on light images.
- "Replace my room" requests: use `"intro": "cut"`, otherwise the real room shows for the first few frames while it dissolves.
- `subject`: `y` moves the face height (0.5 = higher, 0.62 = lower). `scale: "auto"` keeps the bottom of the shot on the bottom edge (about 0.5–0.7 of the original size). **Seated at a desk** (the usual talking-head setup): use `{"y": 0.56, "scale": 0.8}` so the desk edge and the arm cut by the frame edge drop out of view; auto scale leaves them visible.
- `cursorAt`: anchor the cursor click to the word where the speaker says what to do.

## Example
Line: "The video that you're currently watching was edited completely using Claude Code."
```json
{
  "headline": "Editing handles itself.",
  "timer": "24:59",
  "task": "Edit today's reel",
  "tasks": ["Edit today's reel", "Write the caption", "Schedule the post"],
  "input": "Cut the pauses and add captions",
  "cursorAt": "@edited",
  "captions": { "emphasis": ["currently", "Claude"] }
}
```

## Getting it right
- Desks cut people diagonally. The reliable fix is a numeric `subject.scale` (~0.8) that pushes the desk below the frame; `bottomFade` (default 0.5) then softens what's left. On light backgrounds keep `bottomFade` ≤ 0.55 or the torso turns to fog.
- Speakers who fill the frame edge to edge get straight side edges once scaled down. `sideFade` softens them.
- The cut-out is only as good as the matte. Busy backgrounds and motion-blurred hands can leave soft edges; that reads fine at this scale.
- White headlines vanish on light images. Set `headlineColor` (e.g. "#111111").
- A numeric `headlineOffset` is measured from the face, so re-tune it whenever you change `subject.scale`; leave it on "auto" unless you need a specific spot.
- If the effect window ends early, the room dissolves back in. Use `"intro": "cut"` for an instant switch both ways.
