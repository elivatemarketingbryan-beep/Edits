---
description: Float a realistic iPhone next to the speaker in a talking-head video, with an app conversation that plays itself out — message, typing dots, a recommendation card, a finger tap on "Approve" and a reply — or your own screenshot/screen recording on the screen. Renders an MP4 for Reels, TikTok or Shorts with captions. Use this whenever the user wants a phone mockup, an app demo beside them, "show the app on a phone", a floating iPhone, a chat or notification on a phone screen, or to put a screen recording in a phone frame, even if they never mention Remotion.
---
## What it looks like
A titanium iPhone (dynamic island, status bar, home indicator) springs in from the side beside the speaker's head with a slight 3D tilt, soft shadow and gentle float, while the footage pans a little the other way to keep the face clear. On screen, a dark chat-assistant app plays out: header with avatar, a message, typing dots, a recommendation card with stat tiles, then a touch indicator taps the white button, which turns green with a check and a reply bubble pops in.

## When to use it
- Showing what an app, bot or automation does while explaining it.
- "It just sends me a message and I hit approve" moments.
- Putting a real screenshot or screen recording into a phone frame (`screen`).

## Writing the config
- Rewrite the chat for the user's product: `app.name`, `message` (the bot's first line), `card.title` (the key recommendation/result, ≤ ~40 characters), `button` / `approvedLabel`, and `reply`.
- `card.tiles` are 3 mini stats (label + 0–1 bar value); make them match the story or set `[]` to hide them.
- Time it to speech: `cardAt` when the speaker introduces the result, `tapAt` on the action word ("@approve", "@download", "@post"). `"auto"` puts the tap on words like approve/click/tap/done, else ~65% in.
- For a real app, pass `screen` with a screenshot or vertical screen recording path; the chat UI is replaced and the phone frame stays.
- `side` defaults to the side with more room; use `size` 0.3 for tight close-ups, 0.38 for wide shots.

## Example
Line: "If you wanted to build your own course selling platform, all you have to do is download this GitHub repo."
```json
{
  "side": "left",
  "app": { "name": "Repo Scout", "status": "Watching GitHub", "avatarColor": "#8AB4FF" },
  "message": "Found an open-source course platform.",
  "card": {
    "label": "NEW REPO",
    "title": "Gumroad is now fully open source",
    "tiles": [
      { "label": "Stars", "value": 0.95, "color": "#8AB4FF" },
      { "label": "Forks", "value": 0.6, "color": "#8AB4FF" },
      { "label": "Issues", "value": 0.25, "color": "#E5706B" }
    ]
  },
  "button": "Download",
  "secondary": "Later",
  "approvedLabel": "Cloned",
  "reply": "Cloned to ~/course-platform",
  "cardAt": "@course-0.3",
  "tapAt": "@download"
}
```

## Getting it right
- On tight close-ups the phone may touch the cheek; lower `size` to 0.3 or raise `nudge` to 0.12 (pans the footage further away).
- Keep `card.title` to two lines; longer text pushes the buttons down.
- A screen recording in `screen` should be vertical (9:16-ish); landscape media gets cropped to fill.
- Leave at least ~0.8s after `tapAt` so the approved state and reply are seen.
