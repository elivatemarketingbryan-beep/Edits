<!-- Part of the Video Studio manual. Index: CLAUDE.md -->

### Sound effects (every style)

Sounds are their own layer, added after the picture is rendered, so a note like "turn
this sound down" never needs a full re-render. Use skill `sound-placement` to decide which
moments get a sound, what kind, how it's timed, leveled and shaped; Bryan's preferences override it.

1. Render the edit **without** sound effects to `jobs/<id>/.nosfx.mp4`.
2. Write the cue list to `jobs/<id>/sfx.json`: `[{ "cue": "pop", "at": 3.2, "note": "tier card lands" }]`.
   `at` is the output second the sound should hit (the moment the motion lands, from
   the composition's own timings, not guessed). Follow `styles/SOUND-RULES.md` for which
   sound goes on which moment and where it lands (whooshes on transitions, risers ending
   on reveals, etc.), and the Sound section of STYLE-GUIDE.md for each style's density.
3. `node studio/sfx.mjs place jobs/<id>/.nosfx.mp4 jobs/<id>/sfx.json jobs/<id>/preview.mp4 --job <id>`
   mixes them in (peak-aligned, under the speech, AAC 256k) and logs each one as an
   `sfx` edit for the review page.
4. On `revise`, sound notes only change `sfx.json` and re-run step 3 from the same
   `.nosfx.mp4`. Never place sounds onto a video that already has them.

Cue names, files, peaks and volumes: `styles/sfx.json` (`node studio/sfx.mjs list`).
A cue can also be an ID from the SFX Library in `assets/sfx-library/` (`"cue": "SFX-0058"`): 1548 sounds
with sync points and levels, picked by moment with its `sfx.py find` (skill `sfx-library`). Use it to vary the
whooshes, impacts and glitches across a video; credit-required ones need `"allowCredit": true` and a credit line.
The files are named copies in `assets/sfx/` from the full Motionix pack in
`assets/sound-effects/` (74 sounds). To use a pack sound that has no cue yet, copy it
into `assets/sfx/` with a short name, measure it with `node studio/sfx.mjs peak <file>`,
and add it to `styles/sfx.json`.

### Ready-made effects (every style)

Before hand-building a graphic, check `styles/ANIMATIONS.md`: search bar with real
typing, counters, article highlights, map routes, motion backgrounds, the glow pill and
the soft-pastel grade already exist as tested templates for both 9:16 and 16:9
(`node studio/anim.mjs new ...`), and it lists the matching HyperFrames registry blocks.

Four Remotion add-on skills cover moments the templates don't. Each builds a small Remotion
project in `projects/remotion/<skill>-<id>/` and reads the job's words through
`node studio/words-convert.mjs` (never a new transcription); each skill's "Video Studio" block
says what changes here:

| Skill | Use it when | Output |
|---|---|---|
| `high-quality-captions` | 9:16 talking head wants premium word-by-word captions: bold lowercase Inter, serif setup word over a purple-gradient punch word that flickers on | the captioned video |
| `glow-intro-caption` | the first 3-5 s need a two-line hook title (white setup / purple punch, glow) with the 25% punch-in that pulls back | the intro section |
| `headline-highlight` | the script cites a real article, study or document: it blurs in, tilts in 3D and a yellow marker draws behind the key words (needs Tesseract) | a B-roll clip to cut in |
| `github-callout` | the speaker names a GitHub repo: cut to its README in GitHub dark mode with a highlighter sweep | the video with callouts |

They're Remotion, so the HyperFrames-first rule bends here: the skill is the tested look, and
rebuilding it in HyperFrames is only worth it if one becomes an everyday effect.

**Video FX** (`engines/video-fx`, hub skill `video-fx` + 17 `fx-<name>` skills): 17 tested
effects for 9:16 talking heads on one installed Remotion engine, with a person cut-out so
graphics sit behind the speaker. Pick by what's being said:

| The speaker is... | Effects |
|---|---|
| naming one big idea | `fx-cover-story` (magazine masthead behind the head), `fx-glass-type` (3D glass word on the wall), `fx-digital-zoom` (punch-ins) |
| listing steps | `fx-checklist` (glass card that types and ticks, `[STEP]` cues), `fx-ui-world` (chat app with a typed command) |
| on growth, numbers, results | `fx-chart-grow` (line spikes behind them, `[NUMBER]` cues), `fx-pull-back-reveal`, `fx-paper-cut` |
| on news, buzz, "everyone says" | `fx-headline-wall`, `fx-couch-wall` (wall of reel thumbnails) |
| showing an app or result | `fx-phone-mockup`, `fx-frame-break` (pops out of a Reels frame), `fx-green-screen` |
| at a hook, punchline or turn | `fx-vertigo` (dolly zoom), `fx-zoom-through-cut`, `fx-orbit`, `fx-doodle-boil` |

2-4 effects per 30-60 s reel by default, more when the user picks a combo (see "Claude's
ideas"); each renders on its own range and `splice`s back into the
full video. Words come from the job's transcript (`studio/words-convert.mjs video-fx`, passed
with `--words`), captions get the brand purple (`"captions": {"accent": "#C4B5FD"}`); every
skill's "Video Studio" block has the details. Sounds go on after, with `studio/sfx.mjs`.
Works best on raw footage: an already-edited clip keeps its old captions and graphics underneath.

### Motion and design skills (every style)

`emil-design-eng`, `animate`, `animation-vocabulary`, `improve-animations`,
`review-animations`, `animation-performance` (github.com/emilkowalski/skills) and
`apple-design`, `apple-liquid-glass` (github.com/naplesblue/apple-design-skill) came in
with split-screen but apply to every engine. Use them when building any graphic, and
run `review-animations` on each draft before moving the job to `review`.
