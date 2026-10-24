---
description: Turn the top of a talking-head video into a living chat-app UI — clip thumbnails fly into a "Drop files here" zone, a RAW CLIPS tape label sticks on and a slash command types itself out — while the speaker sits in the bottom panel and breaks out over the app. Renders an MP4 for Reels, TikTok or Shorts with bold captions. Use this whenever the user wants to show a prompt or command being typed, an AI chat interface, "drop your clips into Claude", an app UI above them, a split screen with software, or a UI-world / interface intro, even if they never mention Remotion.
---
## What it looks like
A cream chat app slides in over the top ~60% of the frame: orange starburst logo and app name, and a dashed "Drop files here" box. Video thumbnails (frames of your clip) fly in on arcs, drop into the box and it becomes a message composer; a yellow tape label sticks on, then a slash command types in with a caret and the orange send button gets pressed. The footage slides down into the bottom panel and the speaker is cut out so their head pokes up over the app background. Captions are white bold caps low on the speaker.

## When to use it
- Explaining a workflow that starts in an AI chat ("drop your clips in, trigger the skill").
- Showing the exact prompt or command to type.
- Any "here's the tool" moment where the software should feel like the set.

## Writing the config
- `command`: what gets typed — the real command or prompt (keep it under ~28 characters so it fits on one line).
- `label`: 1–2 words describing what was dropped ("RAW CLIPS", "PDF NOTES", "SCREENSHOTS").
- `dropAt` on the word that describes adding files ("@drop"), `typeAt` on the action word ("@trigger", "@type", "@run"). `"auto"` looks for those words and otherwise spreads the beats across the clip.
- `appName` / `accent` can rebrand the app; default is a Claude-style look.
- `thumbs` takes your own images/clips for the flying thumbnails; by default they're frames from the clip.
- Use a `window` (e.g. `[0.4, 5.6]`) to run it in the middle of a longer clip — the app slides in and out.

## Example
Line: "If you wanted to build your own course selling platform, all you have to do is download this GitHub repo."
```json
{
  "command": "/clone-repo gumroad",
  "label": "COURSE PLATFORM",
  "clips": 4,
  "dropAt": "@build",
  "typeAt": "@download",
  "window": [0.4, 5.6]
}
```

## Getting it right
- Leave ~1s after `typeAt` for the command to finish typing before the window or clip ends (typing runs at `typeSpeed`, 20 chars/s by default).
- The footage moves down so the head sits under the composer; on very wide shots set `shift` to 0 to keep it in place.
- Captions default to `y` 0.83 so they sit on the chest under the face; move them with `captions.y`.
- Needs the cut-out pass for the head breakout; it runs automatically the first time (about 4 seconds per second of video).
