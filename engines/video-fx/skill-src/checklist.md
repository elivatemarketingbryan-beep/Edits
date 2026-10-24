---
description: Add an animated checklist overlay to a talking-head video — a frosted dark-glass card ("ALL YOU NEED TO DO", "0 of 3" — the counter follows however many steps you give it) whose steps type in as they are said and tick off with a yellow check, counter and progress bar. Renders an MP4 for Reels, TikTok or Shorts with word-by-word captions. Use this whenever the user wants a checklist, to-do list, step-by-step list, "3 steps", "all you need to do is", a numbered how-to or a tick-off list on screen while they talk, even if they never mention Remotion.
---
## What it looks like
A dark frosted-glass card with a slight 3D tilt springs in above the speaker's head (or over the chest on close-ups). The header reads ALL YOU NEED TO DO with a "0 of N" counter (N = number of steps) and a segmented yellow progress bar; the rows start as grey skeleton bars. When a step is spoken its text types in with a caret, then its circle fills yellow with a check and a little burst, the counter ticks up and that bar segment fills.

## When to use it
- "All you need to do is…", "three steps", "here's the process" moments.
- Listing requirements, features or a recipe while talking to camera.
- Recapping what was just covered at the end of a video.

## Writing the config
- `items`: 2–5 short steps, 2–4 words each, written as commands ("Drop your clips", "Trigger the skill"). Take them from what the speaker actually says, tightened. Leave `"auto"` only as a fallback (it pulls rough phrases from the transcript).
- Give each item an `at` on the word where that step is said ("@drop"); items always type one after another, so close timings are safe. Use `doneAt` only if the tick must land on a specific word.
- `title` is the small header; keep it under ~22 characters, uppercase reads best.
- `position` is automatic: above the head when there's room (wide shots), over the chest on close-ups, and captions move out of the way. Force `"top"` / `"bottom"` only if it covers something important.
- Set `outAt` if the list should leave before the clip ends (it also leaves automatically when the effect window ends early).

## Example
Line: "This new Opus model should be capable of doing three absolutely mind-blowing things."
```json
{
  "title": "WHAT OPUS CAN DO",
  "items": [
    { "text": "Run an agent swarm", "at": "@three" },
    { "text": "Rebuild any website", "at": "@absolutely" },
    { "text": "Generate images", "at": "@mind" }
  ],
  "outAt": -0.4
}
```

## Getting it right
- Long step text shrinks to fit the row; past ~24 characters it gets small, so shorten the wording instead.
- If two steps are said within a second, the second waits for the first to finish typing; raise `typeSpeed` (e.g. 45) for rapid-fire lists.
- On very busy backgrounds raise contrast by darkening the footage a touch elsewhere, or keep the card over a plain wall with `position: "top"`.
- The card needs the cut-out pass only to find the head; if the speaker is off-centre and the card lands on the face, set `position` to a number (0–1 of the height).
