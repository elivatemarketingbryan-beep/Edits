---
description: Make a talking-head shot pull back to reveal it's playing inside an editor app that is rendering it — agent panel ticking through steps, render bar with waveform and frame counter, a big serif % counter rolling to 100% and a green "done" state. Renders an MP4 for Reels, TikTok or Shorts with captions inside the window. Use this whenever the user wants a pull-back or zoom-out reveal, "it was edited by AI the whole time", a behind-the-scenes rendering moment, a progress / percentage counter over their video, or to show their video being processed by a tool, even if they never mention Remotion.
---
## What it looks like
The full-frame footage smoothly shrinks into an editor window on a cream desk (title bar with the file name, the video keeps playing inside with its captions). A white agent panel slides in on the left and ticks through its steps with spinners and green checks; under the video a render bar with a waveform fills while a frame counter climbs. Near the end a big black serif number rolls up to 100 with a blue % badge, then the window border, bar and badge flip to green.

## When to use it
- The reveal that the video itself was made by an AI tool or skill.
- Showing a process completing ("it transcribes, cuts, captions and renders").
- Ending a video on a satisfying "done" beat.

## Writing the config
- `steps`: 3–6 short past-tense steps describing what the tool did (≤ ~24 characters each); `{frames}` inserts the render frame count.
- `filename` and `skill` should name the user's real file and tool/command.
- `pullAt` a beat before the reveal line ("@edited-0.2"); keep at least ~2.5s after it so the steps and counter can play out. `doneAt` defaults to ~0.7s before the end.
- Add `returnAt` (e.g. -0.6) to zoom back to full frame before the clip ends; it also returns automatically when the effect window ends early.

## Example
Line: "The video that you're currently watching was edited completely using Claude Code. I didn't have to hire an expensive editor."
```json
{
  "pullAt": 0.3,
  "filename": "daily-update.mp4",
  "skill": "video-editor",
  "steps": ["Transcribed the take", "Cut the pauses", "Added captions", "Graded the colour", "Rendered {frames} frames"],
  "returnAt": -0.5
}
```

## Getting it right
- Under ~3s of window time the beats feel rushed; give it 4–7s.
- Step labels longer than the panel are truncated with an ellipsis — shorten them.
- Captions render inside the window, scaled down with the video; keep `captions.y` around 0.7 so they stay inside the cropped area.
- `videoAspect` 0.5625 shows the whole 9:16 frame in the window (taller window); the default 0.64 crops a little top and bottom like the reference.
