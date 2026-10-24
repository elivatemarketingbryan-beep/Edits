---
description: Put a giant 3D glass word on the wall behind a talking-head speaker at head height — thick clear glass letters in perspective that bend and magnify the room like a lens, with bright rims, a glossy highlight, dark inner edges and a wall shadow, fading in with a light sweep while the speaker stays in front. Renders an MP4 for Reels, TikTok or Shorts. Use this whenever the user wants 3D text, glass or chrome text, a big word on the wall behind them, text behind the person, a premium or Apple-style title in their room, or the glass type effect, even if they never mention Remotion.
---
## What it looks like
One big word made of thick clear glass stands on the wall behind the speaker at head height, turned in perspective so it recedes to one side and spans most of the frame width. The letters are tall and condensed with a visible extruded body of bright edges. Their faces bend and magnify the room behind them like a lens (strongest at the rims), with a glossy highlight band, dark inner edges that give thickness, bright specular rims and a soft shadow on the wall. The word fades in from a blur, a light sweep glides across it, and it sways a few degrees while it holds. The speaker is cut out and covers the lower part of the middle letters.

## When to use it
- Naming the one idea of the video ("DESIGN", "FOCUS", "AI").
- Brand or product reveals in a premium, tech look.
- Any "text behind the person" moment that should feel more 3D than a flat title.

## Writing the config
- `word`: one word, 4–8 letters, upper-cased automatically. Take it from the key noun the speaker stresses.
- `at`: start a beat before the word is spoken ("@design-0.2") or 0.1–0.3 s in.
- Size and placement are automatic: the word is fitted to `widthFraction` of the frame after the perspective turn, set at head height with `overlap` of the letter height behind the head, and shrunk if needed so at least the top half of every letter stays visible. Short words or a head near the top of the frame therefore come out narrower.
- `font`: `black` (heavy grotesk, reference look) suits most words; `serif` or `didone` for fashion/editorial topics. `condense` 0.6–0.75 gives the tall glass-letter look; 1 uses the font's own width.
- `rotateY`: positive recedes to the right (reference), negative to the left. Point it away from the side with more empty wall.
- Glass shows what is behind it: shelves, windows, plants and lights bend visibly through the letters; on a plain wall it reads as clear acrylic with bright edges.

## Example
Line: "But the truth is I don't have to do that anymore thanks to this new Claude Code AI video editor."
```json
{
  "word": "CLAUDE",
  "at": "@truth",
  "captions": { "emphasis": ["truth", "anymore", "Claude"] }
}
```

## Getting it right
- If the word looks too small, the speaker's head is probably high in frame (the readability cap shrinks it). Lower `overlap` (0.35), or set `y` (e.g. 0.06) to place it yourself; with `y` set, `widthFraction` decides the size.
- For wide shots with lots of wall, set `y` (0.15–0.25) and `overlap` 0.2 so the whole word sits on the wall above the head.
- Raise `refraction` (0.3) for a heavier lens; lower `depth` (25) for thinner glass; raise `shadow` (0.7) if the letters don't separate from a pale wall.
- Very dark rooms: set `tint` to a light colour such as `#DDEBFF` so the glass doesn't disappear.
- Only the person is cut out; a microphone in front of the wall area will show the letters over it.
