<!-- Part of the Video Studio manual. Index: CLAUDE.md -->

### Ranking the top 3 formats

Score every `kind: "style"` entry in `styles/catalog.json` against the video, using:

- **What is said** (transcript): ranking → ranking / top-5-ranking; steps or a process →
  explainer-panel, glass-explainer, split-reel; numbers and results → glass-explainer,
  depth-ui; do vs don't → this-vs-that; long list → rapid-list; story → personal-reel,
  natural-story; proof and screenshots → yap-and-show, visual-essay; tips →
  tips-breakdown. Each entry's `bestFor` lists its cues.
- **Audio only** (the source is mp3/wav/m4a, or a video with no person on screen): it's a
  voiceover, so faceless-sprite goes first; only styles that need no presenter footage
  (faceless-sprite, fitted-captions, cinematic-type, visual-essay) can rank.
- **What the footage allows:** aspect (9:16 vs 16:9; a long 16:9 source also suits
  youtube-clips and coaching-call-clips), length (over 5 min → clip styles), headroom
  above the head (`needsHeadroom`), a clean-enough edge for a person matte
  (`needsMatte`), two takes (`needsTwoTakes`; skip unless the user supplied them).
- **The script, if there is one:** run "Matching the clip to its Content OS script" (below)
  first. A matched script's Edit style goes first in `formats.json`, with the reason
  "Scripted for this format in Content OS"; if the user already set it, the job can skip
  straight to `edit` with that style.

### Matching the clip to its Content OS script

Content OS (`engines/content-os/`)
writes each script for its format, in that format's shape, with cue tags (styles/SCRIPT-SHAPES.md),
and stores it on a Notion page (schema: that folder's `notion-pipeline.md`; data source
`collection://b25789bb-ffea-8346-8ef9-87d238345cb6`). In the `formats` stage, after transcribing:

1. Query the Notion data source for pages with Status `Scripting` or `Filming` (and an empty
   **Studio job**), and the same in the personal account's pipeline
   (`collection://2681fcbe-9a1c-4d38-acb3-3bf490293f67`, see `engines/content-os/notion-pipeline.md`);
   status flips and `Studio job` go to whichever pipeline the matched page is in. For each, fetch the page and save its body to
   `projects/<id>/scripts/<notion-page-id>.md`. Also export every scripted plan from the Plan
   page into the same folder (`docs/studio/plans.md` "From script to edit") so they are scored too.
2. `node studio/script-cues.mjs score projects/<id>/transcript/words.json projects/<id>/scripts/*.md`.
   The highest score at or above 0.6 is this clip's script. Below 0.6 for all: no script;
   rank formats as usual and say so in one line.
3. On a match: write `job.json` `script` = `{ "notion": "<page id>", "title": "...", "editStyle": "<style id>", "scriptShape": "...", "score": 0.89 }`,
   set the Notion page's **Studio job** to the job id, and save the timed cues:
   `node studio/script-cues.mjs cues projects/<id>/transcript/words.json projects/<id>/scripts/<page>.md jobs/<id>/cues.json`.
4. Notion status follows the job (`notion-update-page`, no need to ask): `edit` starts →
   **Editing**; `review` → **Review**; `done` → **Ready** and **Edited Video** = the final's
   path. Never set **Posted**; that's Content OS's `auto-poster`.

**Building from cues (the `edit` stage).** Every timed cue in `jobs/<id>/cues.json` places a
visual at the moment its line is spoken (`start`..`end`), using the style's own building
blocks: `[TIER]`/`[RANK]` move the card into that row, `[STEP]` lights that step,
`[NUMBER]` → counter or stat card, `[SIDE]` → that column or clone, `[PROOF]`/`[IMAGE]` →
proof or image card (ask the user for the asset if it isn't in the job), `[BROLL]` → B-roll,
`[EMPHASIS]` → the big caption word, `[CHAPTER]` → chapter tracker, `[HOOK]`/`[CTA]` → hook
card / end card. Lines with no time (not said, or cut) are skipped. Write each placed cue
as an `edits.json` entry (`why` = the script line), so it shows on the review page.

Write `formats.json` as `[{ "style": "<id>", "reason": "<one short line about THIS video>", "preview": "previews/<id>.mp4" }]`,
best first, exactly 3. Reasons name what's in the video ("you rank 5 tools"), not
generic praise. A `draft` style can be suggested; say so in the reason if it will
need extra time.

### Claude's ideas (ideas.json)

The pick screen shouts Claude's ideas at the user and lets them tick the ones they want, on
top of one base format. Write `jobs/<id>/ideas.json` in the `formats` stage, 8-14 ideas (enough to fill the combos below):
`[{ "id": "i1", "style": "graph-rise", "start": 12.4, "end": 17.0, "quote": "we went from zero to 10k", "pitch": "You say 10k: a chart rips up the wall behind you.", "fav": true }]`

- Each idea is one moment from the transcript (`start`/`end` in source seconds; leave both
  out for a whole-video idea such as pixel zoom throughout) dressed up with one catalog
  style or effect. The Video FX styles fit most moments; any style's building blocks
  can be pitched (a ranking card, a search bar from ANIMATIONS.md, a glow intro).
- `quote` is the exact words said there. `pitch` is one punchy line in plain words that
  sells what the viewer will see at that moment (under ~90 characters, no jargon).
- Spread the ideas across the video, no two on the same moment, mixed kinds. Mark 1-3
  strongest with `fav: true`. `preview` (optional, job-relative path) overrides the
  style's example clip.
- The choice lands in `job.json`: `style` = base format, `picked` = the ticked idea ids.
  In `edit`, build each picked idea at its moment, log it in `edits.json` with
  `why` = its pitch, and put it in the breakdown sheet. Ideas not picked are not built.

**Combos (combos.json).** The user wants videos that feel heavily edited, so Claude also
stacks its ideas into 2-3 ready-made combos and the pick screen leads with them. Write
`jobs/<id>/combos.json` next to `ideas.json`:
`[{ "id": "c1", "name": "Full send", "base": "personal-reel", "ideas": ["i1", "i2", "i4", "i6", "i9"], "pitch": "Something new every 3 seconds: cover open, chart on the 10k, tick list on the steps.", "fav": true }]`

- A combo is a set of idea ids plus a base format (`base`, optional: one of `formats.json`).
  Mix kinds (a big title moment, a data moment, a list, a wall, a transition) and add one
  whole-video idea (pixel zoom, captions style) so nothing sits still between effects.
- Make them different levels: one **max** combo (an effect or punch-in every 2-4 s, 6-10
  ideas, marked `fav` if the footage can take it), one **punchy** (4-6), one **clean** (2-3
  on the biggest beats). Names are 1-3 words; `pitch` sells the whole edit in one line.
  These levels are for short-form. YouTube / 16:9 follows `styles/EDIT-PREFERENCES.md`
  (no max combo, effects spaced out).
- Picking a combo ticks its ideas; the user can add or drop single ideas after.
  `job.json` gets `combo` (the id they started from) and `picked` (the final idea list,
  which is what gets built). Over 4 Video FX effects in one reel: render each on its own
  range and splice them in order, as for any effect list.
