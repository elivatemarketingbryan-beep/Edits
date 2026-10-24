# Skool module plan — Claude Video FX

A suggested structure for teaching the kit. Each lesson is short (3–8 minutes) and ends with something the member has rendered themselves.

## Lesson 0 — What you're getting (2 min)
- Play the showreel (`examples/` previews back to back).
- The promise: you describe the edit, Claude does the motion graphics on your own footage, locally, no subscriptions.
- What's in the zip: installer, 18 skills (one hub + 17 effects), the render engine, previews.

## Lesson 1 — Install (5 min)
- Requirements: Claude Code, Node 20+, Python 3.9+, ~3 GB disk.
- Move the folder somewhere permanent → double-click the installer → wait for "All set" → restart Claude Code.
- Show the fallback: open Claude Code in the folder and say *"Run node install.mjs and fix anything that fails."*
- Prove it works: *"Run the video-fx doctor."*

## Lesson 2 — Your first effect (6 min)
- Record or pick a vertical talking-head clip.
- Prompt: *"Add the cover story effect to the first 6 seconds of `<file>` with the word FOCUS."*
- Narrate what Claude does: reads the transcript (`words`), writes a config, checks a still, renders, reviews the contact sheet.
- Explain the one-time wait (transcript + cut-out) vs. fast re-renders.

## Lesson 3 — How the skills think (5 min)
- Every effect = transcript-timed + config-driven. Show a config JSON.
- `"@word"` timing: graphics land on the exact word you say.
- Captions: the six looks (`pop`, `caps`, `twoTier`, `serif`, `tracked`, `box`) and turning them off.
- `fixes` for misheard names ("cloud code" → "Claude Code").

## Lessons 4–8 — The effects, grouped (5–8 min each)
Demo two or three per lesson, with a real prompt each.

| Lesson | Effects | Demo prompt idea |
|---|---|---|
| 4. Text behind you | Cover Story, Glass Type, Headline Wall | "Put my topic word in glass letters on the wall behind me." |
| 5. Proof & numbers | Chart Grow, Pull-back Reveal, Paper Cut | "When I say we scaled, draw a chart spiking behind me." |
| 6. Show the product | Phone Mockup, UI World, Checklist, Green Screen | "When I list the steps, add the checklist and tick each one as I say it." |
| 7. Camera tricks | Digital Zoom, Vertigo, Zoom-Through Cut, Frame Break | "Punch in on every key word." / "Zoom-through cut from my hook into the next clip." |
| 8. Pure style | Orbit, Couch Wall, Doodle Boil | "Make my content orbit around me when I mention my videos." |

## Lesson 9 — A full reel with several effects (8 min)
- Prompt: *"Plan 3–4 effects for `reel.mp4`, render them, add captions to the rest and splice it into one finished video."*
- Show the `splice` step and why the original audio stays seamless.
- Taste rules: one effect per beat, plain footage between effects, 2–4 effects per minute.

## Lesson 10 — Troubleshooting & customising (4 min)
- `doctor`, `--draft` previews, `still` checks.
- Changing colours, fonts and content through config, not code.
- Where files live: outputs next to your video; caches in `engine/jobs` (safe to delete).

## Assets to attach in Skool
- `Claude-Video-FX-v1.0.0.zip` (the kit).
- `docs/EFFECTS.md` as a reference page.
- The example prompts list from `START_HERE.md`.
