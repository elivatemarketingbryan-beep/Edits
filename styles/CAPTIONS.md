# Caption styles

Caption looks that work on top of any edit style, 9:16 or 16:9. Studied from Dan
Martell's "Give me 54 Seconds and I'll Make you Dangerously Motivated"
(youtu.be/r6zFZQm0hcc, 54s, 16:9, 7.2M views, studied Oct 2026; see
styles/REFERENCES.md). Descriptions only; nothing from the video is copied.

**What makes his captions work:** one quiet running caption carries the whole video,
and a *different* loud treatment hits only the 6-8 lines that matter. The loud ones
never repeat the same look twice in a row. Purple is his emphasis colour, which matches
your brand.

Built as the `captions` template: `node studio/anim.mjs new captions <9x16|16x9> <dir> --file captions.json`
renders a transparent overlay (WebM) from word timings. Each line picks one mode below.

## The modes

| Mode | What it looks like | Use it for | Sound |
|---|---|---|---|
| `build` | **The default running caption.** White, bold rounded sans, one or two lines in the lower third; words appear one at a time as they're said, the line building up. Soft dark shadow, no box | Everything that isn't an emphasis moment | none |
| `karaoke` | The whole line appears at once in dim grey; each word turns white as it's spoken | Slower, deliberate lines; lists; when the viewer should read ahead | none |
| `blur` | Words arrive blurred and ghosted, then sharpen into place one by one; smaller, two lines | Over B-roll and cinematic shots, calm lines | none |
| `accent` | A `build` line where the key word turns the brand purple and a purple underline sweeps under it | The single most important word of a line; the closing line | `stretch` on the underline |
| `emphasis` | A huge italic serif phrase in a purple gradient across the upper third, words wiping in left to right. In the original it sits **behind the speaker's head** | The 3-5 biggest ideas in the video. One per 10-15 seconds at most | `whoosh-simple` in, or `riser-short` into it |
| `statement` | Huge bold white ALL-CAPS word across the frame, letters fading in one by one, heavy shadow (also behind the head in the original) | The concept being named or challenged | `hit` |
| `strike-swap` | A `statement` word gets a hand-drawn red strike-through, then a purple italic serif replacement word wipes in under it ("not X, but Y") | Reframes: myth vs truth, old way vs new way | `glitch` on the strike, `stretch` on the new word |
| `scattered` | Elegant white italic serif words placed across the frame on different heights and sizes, appearing one by one | Reflective lines over black-and-white or wide B-roll | none (or a soft `riser`) |
| `command` | Big italic serif caps in **red** with a dark shadow, low in frame, overlapping the running caption | Direct orders to the viewer ("stop…", "start…"); once per video | `hit` |

From Aeovisuals' "How To Make VIRAL Captions in CapCut" (youtu.be/oUU1Lj7hcNU):

| Mode | What it looks like | Use it for | Sound |
|---|---|---|---|
| `stack` | **The "viral text" block.** One big heavy word with the small words tucked tight above and below it (tight leading, slight negative tracking); the small words pop in with an overshoot, the big word punches in from 135%. Optional `big` (which word) and `accent` (purple) | Short punchy lines in reels; a step up from `build` for hooks and key lines | none, or `pop` on the big word |
| `brush` | Huge heavy white caps word, then a thick red paint-brush stroke slashes across it bottom-left to top-right, with rough painted edges | Rejecting something ("excuses", "luck", "shortcuts"); a harder version of `strike-swap` without a replacement | `hit` on the word, `whoosh-high` on the stroke |
| `pointer` | A small stacked note beside the head (last word big and heavy) with a hand-drawn curved arrow drawing toward the speaker. `side`: left or right | Pointing at what the speaker is doing or holding; "watch this", "this is me" | `pop` |

From Patrik Key's "Make Your CapCut Edits Look Like After Effects" (youtu.be/Uwu9_aGpDJ4):

| Mode | What it looks like | Use it for | Sound |
|---|---|---|---|
| `slide` | The whole line arrives together: each word slides up out of the line's own edge, 2 frames after the previous one (0.6s ease-out), then the words blur out on exit. `dir: "down"` slides down from the top instead | A premium alternative to `build` for whole phrases; titles and lower-thirds | none |

Behind-the-head versions (`emphasis`, `statement`) need a person matte: render the
caption layer, then put the matted speaker on top (`hyperframes remove-background`, or
CapCut's own Remove background on a duplicate of the clip). Without a matte, they sit
in front of the head; place them above the head so they don't cover the face.

## Rules
1. One running mode (`build`) for the whole video; switch to `karaoke` or `blur` only for
   a stretch with a reason (B-roll, a list).
2. Loud modes (`emphasis`, `statement`, `strike-swap`, `scattered`, `command`, `brush`, `pointer`) on the lines
   that matter, never two of the same loud mode in a row, never more than one every
   ~8 seconds.
3. During a loud mode the running caption can keep going underneath (as in the
   original), but never more than two caption layers at once.
4. Accent colour is the brand purple (`styles/brand.json`), red only for `command` and
   strike lines.
5. Words come from the real word timings (words.json), never guessed.
6. Safe zones (docs/editor-pipeline.md) still apply: keep captions out of the top 200px
   and bottom 300px of a 1080x1920 frame.

## captions.json

```json
{ "lines": [
  { "mode": "build", "words": [ { "w": "Just", "s": 0.20, "e": 0.42 }, { "w": "give", "s": 0.42, "e": 0.60 } ] },
  { "mode": "accent", "accent": ["right"], "words": [ ... ] },
  { "mode": "strike-swap", "swap": "Discipline", "words": [ { "w": "MOTIVATION", "s": 27.1, "e": 27.9 } ] }
] }
```

`s`/`e` are seconds on the output timeline (after the cut). A line shows from its first
word to its next line's start (or 0.6s after its last word, whichever is sooner).
