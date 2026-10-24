# Animation library (reels and long form)

Ready-made HyperFrames effects that drop into any style, 9:16 or 16:9. They come from
the effects in Matt Loui's "Claude Prompts for Remotion" (rebuilt for HyperFrames, in
your brand colours), plus the matching blocks already in the HyperFrames registry.

Make one with:

```
node studio/anim.mjs new <name> <9x16|16x9> projects/<id>/anim-<name> --text "..."
```

then render it (`npx --yes hyperframes@<pin> render --quality high -o out.mp4` in that
folder) or mount it as a sub-composition inside the job's graphics. Every template is
seek-safe (no timers, seeded randomness), reads `styles/brand.json`, and sizes itself
for the format.

| Name | What it does | `--text` | Use it when | Sounds (SOUND-RULES.md) |
|---|---|---|---|---|
| `search-bar` | Glass search bar, two glows orbiting its edge on opposite sides; a query types in like a real person (uneven speed, typos backspaced and fixed) | the query | Opening a topic with the question people search; "you've probably Googled…"; AI/prompt moments | `keyboard` from typing start; `whoosh-flash` or `pop` as the bar appears |
| `glow-pill` | The same bar with nothing typed: a premium UI pill with orbiting glows | (none) | Behind a title, a button, a stat label; a clean hold between beats | `open` as it appears |
| `counter` | Big number counts to its value, lands with a pulse and glow; prefix/suffix stay put | `"$535"`, `"12,400 views"`, `"87%"` | Any money, result or stat the speaker says | `counting` over the count, `money` or `hit` on the landing |
| `article-highlight` | Article on a white page blurs in over 1s, slowly pushes in and turns about 15° in 3D; a hand-drawn highlighter sweeps behind the key phrases | `"Source \|\| Headline \|\| body with [[phrases]]"` | Citing news, a study, a quote, a review; proof moments | `stretch` per sweep, `shutter` as it appears |
| `map-route` | Starts close on a city, eases out, draws a glowing route to the second city with the camera following, settles on arrival | `"Los Angeles > New York"` (or `"lon,lat:Name"`) | Travel, expansion, "from X to Y" stories, client locations | `whoosh-low` on the zoom-out, `stretch` as the line starts, `pop` on arrival |
| `motion-background` | Turns one still image into a premium moving background: slow push and drift, film grain; colours untouched; rotates the picture if it's the wrong way round | (none) + `--image pic.jpg` | Behind chapter cards, titles, cut-out presenters, lesson documents | none (or a soft `riser` into the title) |
| `chapter-tracker` | Dark grid of chapter cards; finished chapters dim with a tick, the current one lights up in the accent with a progress bar. 2 columns in 9:16 | `"Title \|\| Ch one \| Ch two \| ... \|\| 3"` (0 = none lit, for the closing overview) | Every section break in long form; a series overview in reels; the closing shot | `whoosh-data` in, `tick` as the current card lights |
| `level-meter` | Glass vials fill one after another to their %, each tier its own colour, % counts up; one tier = one big meter | `"Title \|\| Beginner 25 \| Intermediate 60 \| Advanced 90"` | Tiers, skill levels, progress, "where are you on this scale" hooks | `riser-short` while filling, `enter` as each lands (`window.__fills`) |
| `screen-window` | Screen recording in a rounded app window on a brand gradient, presenter in a card beside it (16:9) or below it (9:16); the face video's sound is kept | (none) + `--screen rec.mp4 --face me.mp4` | Any screen demo, so the face never leaves the frame | `whoosh-data` as the window flies in, `open` for the face card |
| `icon-stack` | Glossy app icons pop in a column beside the head as each is named. **Transparent**: renders to WebM to sit over footage | `"Claude, ChatGPT, Gemini"` + `--images` (real logos, same order), `--times 0.4,1.2,2.0` (from the transcript), `--side left\|right` | Naming tools, platforms, brands, clients | `pop` per icon (`window.__pops`) |
| `captions` | Word-timed caption overlay with nine modes (running build/karaoke/blur/accent, loud emphasis/statement/strike-swap/scattered/command). **Transparent** WebM. Full rules in `styles/CAPTIONS.md` | `--file captions.json` (built from words.json) | Every edit that has speech | its cues are exposed as `window.__sfx` |
| `brand-background` | Custom moving background from the brand colours: two tones blended through a soft feathered mask (circle, split or corner), optional scan lines, grain or a light streak, slow drift | `"circle lines streak"`, `"split grain"`, `"corner"` | Behind titles, chapter cards, counters, cut-out presenters; instead of stock backgrounds | none |
| `shape-transition` | A brand ball drops in and bounces, morphs to a rounded square while changing colour, grows to cover the frame, then a diagonal band wipes it away. `"band"` = the band wipe only. **Transparent** WebM; `window.__cover` is where the cut goes | `"bounce"` or `"band"` | Between scenes or sections instead of a hard cut or a stock transition; time the wipe to land as the text finishes | `pop` per bounce (`window.__pops`), `whoosh` as it grows, `whoosh-flash` on the wipe |
| colour grade `soft-pastel` | Clean, soft pastel studio look: lifted blacks, gentle contrast, softer colour, cool shadows, warm highlights | `node studio/lut.mjs apply in.mp4 out.mp4 soft-pastel [--strength 0.8]` | Talking-head footage in any style. Apply to the footage only, before graphics, so brand colours stay exact | none |

Each template's sound times are exposed on the page (`window.__typingEnd`,
`__countEnd`, `__sweeps`, `__cues`) so `sfx.json` lands on the real motion.

The last four came from the Iman Gadzhi breakdown in `styles/REFERENCES.md`. When a
reference shows a new effect worth keeping, build it here the same way (both formats,
brand colours, seek-safe), test-render it, and add it to this table.

## More from the HyperFrames registry

Before hand-building anything, check the registry
(`npx hyperframes@<pin> catalog`, then `add <name>`). Useful matches:

- Counters: `count-up`, `apple-money-count`, `number-wheel`, `mk-progress-stat`
- Glowing borders: `lt-neon-border`, `tracing-beam`, `shimmer-sweep`
- Typing: `typed-prompt`, `notes-typing`, `claude-exchange`, `chatgpt-exchange`, `yt-comment-card`
- Highlights and annotation: `marker-highlight`, `inline-highlight`, `vox-annotate`, `cursor-annotate`, `yt-circle-pointer`, `yt-feather-highlight`
- Maps: `us-map-flow`, `us-map-bubble`, `us-map`, `world-map`, `nyc-paris-flight` (a fixed NYC to Paris picture; use `map-route` for any other route)
- Texture and grade: `grain-overlay`, `grain-field`, `grade-split-reveal`, `organic-light-leak-overlay`

## Where each one fits

| Style | Effects that suit it |
|---|---|
| educational-youtube, tips-breakdown | all of them; `counter` and `article-highlight` as full-screen beats, `map-route` for "where", `motion-background` behind chapter markers |
| split-screen-lesson, lesson-document | `article-highlight` inside the document panel, `counter`, `motion-background` behind the document |
| coaching-call-clips, youtube-clips | `counter`, `article-highlight`, `search-bar` as the opening hook |
| business-reel, explainer-panel, glass-explainer, split-reel | `search-bar` and `counter` in the graphic half; `glow-pill` as a UI element |
| visual-essay, yap-and-show | `article-highlight` as the evidence card above the head |
| depth-ui | `search-bar` and `glow-pill` as the interface behind the head |
| cutout-backdrop, cutout-grid, natural-story | `motion-background` from each idea's image |
| any style | `soft-pastel` grade on the footage when the user wants the clean studio look |
