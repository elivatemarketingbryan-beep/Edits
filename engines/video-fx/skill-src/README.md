# skill-src

One file per effect: `<effect-id>.md`. `tools/build-skills.mjs` turns each into
`skills/fx-<effect-id>/SKILL.md` by adding the shared parts (engine path, workflow
commands, the options table generated from `engine/effects/<id>.json`, captions and
time-reference reference). So a fragment holds ONLY what is specific to the effect.

Format (keep the headings exactly):

```
---
description: <the skill's trigger description, 60-110 words: what it makes, then
  "Use this whenever ..." with the phrases a user would actually say, incl. synonyms,
  and "even if they never mention Remotion">
---
## What it looks like
2-4 sentences: the motion, layering and timing, as seen in the reference reel.

## When to use it
1-3 bullets: the moments in a talking-head video this effect suits.

## Writing the config
What Claude must decide from the transcript / user request (content, timing anchors),
with concrete rules. Mention which options matter most.

## Example
A complete, working config JSON for a realistic line of speech, preceded by the
line of speech it was written for.

## Getting it right
3-6 bullets: pitfalls, limits, how to fix common problems seen in review.
```
