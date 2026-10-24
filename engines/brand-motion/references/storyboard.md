# Storyboard reference

Two JSON files drive a video: `brand.json` (identity) and `story.json` (the timeline). Times are seconds. Canvas is 1080 x 1920; x = 540 is centre. Keep text inside x 70 to 930, y 230 to 1520 (platform UI covers the edges).

## brand.json

```json
{
  "name": "Loopback",
  "logo": "logo",                 // folder written by logo.py
  "hero": 1,                      // part id from logo_parts.png (null = whole mark is the hero)
  "colors": {"bg": "#FF5A36", "primary": "#FFF4E8", "ink": "#1A1A1A", "paper": "#FFF4E8", "accent": "#FFC94A"},
  "fonts": {"display": "bricolage", "text": "inter-medium", "label": "inter"},
  "uppercase": true               // display text in caps (false = as written, for camel-case brands)
}
```
`hero` can also be a list of part ids for a character made of several pieces (`[1, 2, 3]`), or `null`.

Anywhere a colour is accepted you can use a role name (`bg`, `primary`, `ink`, `paper`, `accent`), a hex string, or `"none"` (transparent, for overlays).

### Bundled fonts (all SIL Open Font License)
| name | personality |
|---|---|
| `unbounded` | wide, bold, geometric, playful tech (default display) |
| `unbounded-bold` | same, lighter |
| `bricolage` | warm grotesque with character: food, lifestyle, creators |
| `syne` | stretched, artsy, fashion, agencies |
| `archivo-black` | heavy, compact, sporty, loud |
| `anton` | tall condensed poster type, news, fitness |
| `inter` / `inter-medium` | neutral, clean SaaS, finance |
| `space-grotesk` / `space-grotesk-medium` | techy grotesque, good for labels (default label/text) |
| `instrument-serif` / `instrument-serif-italic` | elegant editorial serif, premium, beauty |

Or a path to the member's own `.ttf`/`.otf` (relative to brand.json).

## story.json

```json
{
  "duration": 30, "bpm": 120, "key": "F", "mood": "bright",
  "brand": "brand.json",
  "fps": 60, "motion_blur": 4,
  "base": {"video": "clip.mp4", "offset": 0, "zooms": [{"at": 1.2, "scale": 1.12, "dur": 0.22, "hold": 1.2}]},
  "audio": {"music": true, "voice": "vo.wav", "voice_offset": 0, "use_video_audio": true, "music_gain": 1, "sfx_gain": 1, "voice_gain": 1},
  "scenes": [ ... ],
  "overlays": [ ... ],
  "plugins": ["custom_scenes.py"]
}
```

- `mood`: `bright` | `chill` | `dark` | `epic` (chord progression and feel). `key`: any note name (C, F#, Bb...).
- `base` only for raw video (mode C). The clip fills the frame (centre-cropped to 9:16); zooms are punch-ins on emphasis words. Main scenes cover the video while they play; overlay scenes draw on top of it.
- `audio.music`: `true` = generated score, `false` = SFX only, or a path to a licensed track the member supplied. A voiceover file goes in `voice`; in mode C the clip's own sound is used automatically (`use_video_audio`).

## Scenes

Every scene has `type`, `start`, `end`, and optionally:
- `in`: transition into it: `"cut"` (default), `"flood"`, `"circle"`, `"flash"`, `"whip"`, `"zoom"`, or an object `{"type": "flood", "x": 540, "y": 1000, "dur": 0.75}`.
- `bg`: background colour (role/hex/`"none"`). `"none"` shows what is underneath (video).
- `layer`: `"main"` (default, full screen, one at a time) or `"overlay"` (drawn on top of the main track or the video; overlays may overlap main scenes).
- `energy`: music intensity for this section: `0` calm pad, `1` light (bass + arp), `2` groove (drums), `3` full, `"build"` riser + snare roll + inhale. Each scene has a sensible default.
- `scrim`: for overlays over video, darkens the video (0 to 1).
- `hide_captions`: hide the captions overlay while this scene shows. Default true for scenes that already show words (hook, headline, kinetic_words, pop, multiply, stat, showcase, cta, resolve) and for tiles/build.
- `caption_y`: where captions sit over this scene (each scene has a sensible default that avoids its graphics; `null` hides them).
- `uppercase`: override the brand's letter case for this scene.
- `glow`: soft light in the middle of the background (0 to 0.4).

Item lists (`items`, `lines`, `words`, `steps`) take an optional `at` per item (absolute time). Without `at`, items are spread over the scene on the beat grid.

### `drop_open`  (energy 0, about 3 s)
A drop of brand colour forms at the top edge, falls, splashes into rings on a clean field. Calm, curious opener.
`color` (default bg), `x` 540, `y` 1000, `bg` (default `paper`). Follow it with a scene whose `in` is `{"type": "flood", "x": <same x>, "y": <same y>}` so the puddle floods the screen.

### `logo_trace`  (energy 1, 2.5 to 4 s)
A glowing pen draws the logo outline from its top in both directions, then liquid starts rising inside it.
`size` 640, `y` 1150 (the shared stage position, also used by tiles and as build's start, so nothing jumps), `trace` `"outline"` | `"all"` (all = also the inner shapes; use it for tile/badge logos), `line`, `liquid` (auto: a brand colour that reads on bg and keeps the hero visible), `trace_frac` 0.62 (share of the scene spent drawing), `fill_level` 0.18, `backdrop` (giant faint letters stacked behind, 2 to 5 characters, e.g. LAB, CAFE; sized automatically), `resolve` (true = fade to the full-colour logo at the end).

### `tiles`  (energy 2, ~1 s per tile)
"Ingredient" tiles (like periodic-table cards) slam in on the beat, then dive into the logo, which fills up more with each one and jiggles. Perfect for features, ingredients, steps, pillars.
`items`: `[{"label": "Context", "symbol": "Cx", "num": "01"}]` (symbol defaults to the first two letters; a number or emoji-free short word works too), `size`, `y` (stage defaults), `tile_y` 500 (where tiles hover before diving), `start_level` (match the previous scene's fill), `end_level` 0.8, `into_logo` true (false = tiles land in a 2-column grid instead), `tile_colors` (two `[body, symbol, label]` colour triples; automatic by default), `backdrop`, `liquid`, `line`, `trace`. Space tiles at least 1 s apart when diving.

### `headline`  (energy 2)
Stacked lines rise letter by letter behind a mask. `lines`: `[{"text": "No code.", "style": "display"}, {"text": "just", "style": "small"}, {"text": "Chemistry.", "style": "accent"}]`. Styles: `display` (big), `small` (tracked caps label), `accent` (big, in the primary colour if it reads), `serif` (italic serif). `y` 760, `exit` true (lines fly up at the end).

### `kinetic_words`  (energy 3)
One big word or short phrase per beat, punching in from below. `words`: list of strings or `{"text", "at", "color"}`; `"\n"` forces two lines; phrases over 9 characters split onto two lines automatically. `hero`: true = the hero character bounces below the words on each beat. `y` (900, or 700 with hero), `land_y` 1480, `hero_size` 380, `size` (max font size, 300 one line / 200 two lines), `max_width` 860, `color`, `exit`.

### `build`  (energy "build", 3 to 4 s)
Tension before a drop. Rays spin faster and faster, outlined marquee text races across top and bottom, the logo shakes and fills to the brim, the hero materialises inside, then everything squashes and goes silent for `inhale` seconds.
`text` (marquee word, e.g. BREWING, LOADING, CHARGING, COOKING), `from_y`/`from_size` (stage 1150/640, it glides from there), `y` 1010, `size` 760, `start_level` (match previous), `inhale` 0.5 (0.25 under speech), `marquee_y` [300, 1600], `rays` (colour role), `liquid`, `line`, `trace`. Always follow it with `pop`.

### `pop`  (energy 3)
The payoff. The hero bursts out of the logo with a flash and shockwave, flips, lands with squash and dust, and `words` punch in above it while it hops on each beat.
`words` (first word about 1 s after start), `from_y` and `size` (match `build`), `land_y` 1560, `hero_size` 430, `words_y` 560.

### `multiply`  (energy 3)
One becomes many: the hero clones into bigger grids on each step, with a circular colour wipe and a big label per step; the last grid does a wave. Great for "one AI employee becomes a team", "one customer becomes a community", scale, reach.
`steps`: `[{"label": "Sales", "count": 2}, ...]` (counts default 2, 4, 9, 16, 36, 64), `grid_y` 1190, `from_y` (match pop's `land_y`), `hero_size`. Colour schemes cycle automatically through readable brand combinations.

### `stat`  (energy 2)
A number counts up inside a drawing ring, lands with a hit, label rises below. `value`, `from` 0, `decimals` 0, `prefix` ("$"), `suffix` ("%", "x", " min"), `label`, `y` 900, `land_at` (absolute time the count lands: set it to when the number is spoken). Only real numbers the member gave you.

### `showcase`  (energy 2)
A screenshot (website, app, product) rises in a phone or browser frame, scrolls, gets tapped; a URL pill pops below. `image` (path), `frame` `phone`|`browser`, `frame_color` (auto: ink, or paper on dark fields), `url`, `headline` (text above the device), `scroll_screens` 2.2, `y`.

### `cta`  (energy 2)
Call to action with a bouncing arrow, stacked around `y` (960, the pill's centre): logo, label, pill, sub line, arrow. `mode` `comment` (big keyword pill) or `link` (url pill); `keyword`, `url`, `top` (label above, default COMMENT / TAP THE LINK), `sub` (line below), `pill` / `pill_text` (colours, automatic by default), `show_logo` true, `logo_size` 340, `plate`, `arrow` true.

### `resolve`  (energy 1, 3 to 8 s)
The logo lands with a spring and a ring, the hero drops back home through the top (squeezes, wobbles), glow and halo bloom, a light sweep crosses it; then (if text is given) the logo glides up and the wordmark rises letter by letter, a tag pill grows, the tagline fades in. Exact original pixels crossfade in at the end for transparent-background logos.
If the logo itself is the brand name (a wordmark), leave out `wordmark` (it would print the name twice) and use `tag` / `tagline`. On a light `bg` the rings, sparkles and halo switch to brand tints automatically.
`size` 860, `start_scale` 0.25, `move_at` 3.0 (seconds after start when the logo moves up for the text), `final_y` 700, `final_size` 620, `wordmark`, `tag` (short word in a pill, auto-fitted), `tagline`, `cta` (outlined pill line, e.g. a URL), `hero_return` true, `hop_at` (s after start: the hero does a little hop), `sparkle_at` (s after start: a bubble rises and pops), `halo` 1.0, `exact_finish` true, `plate` (`"auto"` adds a contrasting disc behind a logo that would vanish on bg; `"circle"`, `"rounded"`, `"none"`), `plate_color`.
Needs about `move_at + 2.5` s when it has text.

### `hook`  (energy 2; overlay over video or main)
Big hook text, words slam in one by one, a highlight bar sweeps behind the `mark` word. Over speech it may paraphrase the spoken line (captions are hidden under it), but keep the same claim; with `sync` use the spoken words exactly. `text`, `mark`, `mark_color`, `size` 128, `y` 760, `color`, `exit`, `sync` (true = each word appears as it is spoken, using the captions transcript), `word_times` (explicit list). Over video: `"layer": "overlay"` (default `bg` is none and words get a soft shadow).

### `callout`  (overlay)
Sticker pills that pop in with a wobble, alternating brand colours (captions hide while they show). `items`: `[{"text", "at", "x", "y", "rot", "color", "size"}]`, `exit`.

### `blank`
A plain colour field (`bg`). A breath, or a hold under a line of voiceover.

## Overlays (`"overlays": [...]`)

- `captions`: `{"type": "captions", "words": "words.json", "y": 1250, "during": "video" | "all", "highlight": "bg", "max_words": 3, "max_chars": 18, "size": 88, "font": "<name>", "uppercase": true, "start": 0, "end": <s>}`. Word-by-word, the spoken word gets a brand-colour highlight. `during: "video"` hides them while full-screen scenes play (mode C). `"all"` (voiceover videos) shows them over scenes without their own words, at each scene's `caption_y`. Words come from `voice.py transcribe` + `voice.py align`. You can add several captions overlays with different `start`/`end`/`y`.
- `logo_bug`: `{"type": "logo_bug", "corner": "tl" | "tr", "size": 90, "start": 0.3, "end": <s>, "plate": true, "plate_color": "paper", "over_scenes": false}`. Small logo on a pill in a corner while video plays (`size` is the logo's height; hidden automatically while full-screen scenes play).

## Continuity rules (what makes it feel like one shot)

- Liquid levels chain: logo_trace `fill_level` = tiles `start_level`; tiles `end_level` = build `start_level`.
- logo_trace, tiles and the start of build share the stage position (y 1150, size 640) by default; keep it that way or change all of them together. `build` and `pop` share `y` and `size` (1010/760 by default); `pop.land_y` = `multiply.from_y`.
- After `drop_open`, use `flood` at the drop's x/y. Into `resolve`, `zoom` (from a busy grid) or `flash` (from video) work best. `whip` (slide up) and `circle` (colour wipe) are the fast cuts between ordinary scenes.
- Scene boundaries on beats. At 120 bpm a beat is 0.5 s; tiles, words and steps on whole beats; the pop on a bar line (multiple of 2 s).
- One idea per scene. If a scene needs a paragraph to explain, split it or cut it.
