---
description: Join two talking-head shots with a whip "zoom-through" transition — the first shot rushes in toward the speaker with a radial zoom blur and a little spin, hard-cuts at the peak, and the second shot bursts out from extremely close and settles, each with its own caption style. Works with two clips or by splitting one clip. Renders an MP4 for Reels, TikTok or Shorts. Use this whenever the user wants a zoom transition, whip zoom, punch-through, "zoom into the next clip", a smooth transition between two takes or locations, or to hide a jump cut, even if they never mention Remotion.
---
## What it looks like
Over the last ~9 frames of shot A the frame accelerates toward the speaker's chest, smearing into a radial zoom blur with a slight clockwise spin, and A's caption blurs away with it. Hard cut. Shot B starts about 3.4× zoomed in, blurred and tilted, then decelerates out to normal framing over ~12 frames, and its caption fades in. By default A's captions use the gold serif style and B's use wide-tracked small caps, like the reference.

## When to use it
- Moving between two takes, outfits or locations ("…or you can get the…").
- Hiding a jump cut inside one long take (single-clip mode with `cutAt`).
- A "but wait" or contrast beat where the second shot should feel like a reveal.

## Writing the config
- Two clips: render with `--second "<clip B>" --second-start s --second-end s`; the cut is where clip A ends, so trim clip A to end right after a phrase.
- One clip: `cutAt` picks the cut, e.g. `"@absolutely"` (the cut lands as that word starts). `"auto"` picks a word boundary near the middle.
- `captionsA` / `captionsB` override the caption look per shot, e.g. `{"emphasis": ["Claude"]}` for the gold word in shot A, or `{"style": "pop"}` in shot B.
- Faster and harder: `pushFrames` 7, `pullFrames` 10, `blur` 0.65. Calmer: `rotate` 0 and `blur` 0.35.
- `focus` sets where the zoom goes (`"chest"`, `"face"` or `[x, y]`); use `"face"` for tight close-ups.

## Example
Shot A line: "…edited completely using Claude code." Shot B line: "Meaning that if you wanted to build your own course selling platform…"
```json
{
  "captionsA": { "emphasis": ["Claude"] }
}
```
Rendered with `--start 0 --end 5.6 --second "<shot B>.mp4" --second-start 21 --second-end 27`.

## Getting it right
- End shot A on a finished phrase; the push eats the last ~0.3s, so a word that runs into the cut gets blurred away.
- The blur is built from stacked copies of the frame; at the peak you may see faint rings in a paused frame, which read as motion blur at full speed. Raise `samples` (12–16) for cleaner stills, at some render cost.
- Two very different exposures cut harder; that is often the point, but match brightness if you want it seamless.
- Without a cut-out the zoom aims at the centre-chest of a typical framing; if the speaker sits off-centre, set `focus` to `[x, y]`.
