---
description: Slap a collage of headlines, tweets, search bars and POV cards onto the wall behind a talking-head speaker — press-style paper headlines in bold serif, italic quotes, tweet cards, Google-style search pills and black POV cards pin up one after another, then a big hero headline lands with a yellow highlighter swipe. Renders an MP4 for Reels, TikTok or Shorts. Use this whenever the user wants headlines or news behind them, "everyone is talking about this", press/hype/social-proof moments, tweets or screenshots on the wall, a buzz or trend montage behind the person, or the headline wall effect, even if they never mention Remotion.
---
## What it looks like
Cream paper headline notes (bold black serif, tiny uppercase kicker), italic quote cards, white tweet cards with avatar and action icons, a search pill with a blinking caret, black "POV:" cards, chat bubbles and a notification pop onto the wall behind the speaker, every 2–3 frames, each with a quick overshoot, slight tilt and a soft shadow. A larger hero card lands last and a yellow highlighter swipes across its key word. The speaker is cut out and stays in front of the whole collage.

## When to use it
- "Everyone is talking about X" / "X just changed everything" moments.
- Hype, news or trend videos: a new tool, launch, controversy.
- Social proof without real screenshots.

## Writing the config
- Write `cards` yourself from the video's topic — 8 to 12 cards, short and punchy (headlines ≤ 7 words, tweets ≤ 12 words, search pills ≤ 6 words, lowercase like real queries). Mix types: 3–4 `note`, 2 `tweet`, 1–2 `pov`, 1–2 `quote`, 1 `search`, 1 `bubble` or `notify`.
- The first cards in the list get the most visible spots (beside and above the head); cards placed behind the head are mostly hidden, so put the strongest lines first.
- Exactly one card should be the hero: add `"hero": true` and `"highlight": "<word>"` (the topic word, e.g. the product name). It lands last, bigger, with the yellow marker.
- `at`: start on the word that introduces the hype ("@everyone", "@watching").
- Leave `cards: "auto"` only for a quick demo; auto text is cut from the transcript and reads generic.

## Example
Line: "The video that you're currently watching was edited completely using Claude Code. I didn't have to hire an expensive editor."
```json
{
  "at": "@watching",
  "cards": [
    { "type": "note", "kicker": "Creator briefing", "text": "Claude edits everyone's videos now" },
    { "type": "search", "text": "can claude edit videos" },
    { "type": "tweet", "name": "Agency owner", "handle": "@agencyowner", "text": "Dropped my clips in. Claude did the edit." },
    { "type": "pov", "text": "Claude edits your reel" },
    { "type": "quote", "text": "Claude cut my whole reel.", "name": "@founder" },
    { "type": "bubble", "text": "wait, Claude edits videos??" },
    { "type": "note", "kicker": "Weekly digest", "text": "Editors are worried about Claude" },
    { "type": "notify", "name": "Claude", "text": "Your video is ready to post" },
    { "type": "pov", "text": "you never hire an editor again" },
    { "type": "quote", "text": "Your next video editor is Claude.", "name": "@makesreels" },
    { "type": "note", "kicker": "Tech newsletter", "text": "Claude can edit your videos now", "highlight": "Claude", "hero": true }
  ],
  "captions": { "emphasis": ["Claude", "editor"] }
}
```

## Getting it right
- Close-up framing leaves little wall: cards fill the top band and the sides of the head. Use `columns: 4` and `cardScale: 0.9` for tight shots, or `wallBottom` to let cards reach lower.
- Only the person is cut out; a microphone or lamp in front of the wall goes behind the cards.
- `stagger` 2–3 = rapid-fire flurry (reference); 5–6 if the user wants each card to be readable.
- If the room is bright and cards wash out, raise `dim` to 0.2–0.3.
- Don't invent real people's names or real publications on cards; use roles ("Agency owner") and generic kickers.
