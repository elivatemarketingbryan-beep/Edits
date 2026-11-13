# Video Studio

Drop a video into the studio page, get the best 3 formats for it, pick one, review a preview with timestamped notes,
approve, get the final. Claude is the editor; the page is the front door.

**This file is the one entry point.** Each engine keeps its own docs, but where they disagree with this file or
`docs/studio/`, this wins. Where another file says `CLAUDE.md "<section>"`, the section is in the table below.

## Every job, in order

1. `node studio/check.mjs`. Fix any FAIL first.
2. Read `styles/EDIT-PREFERENCES.md`. It is the checklist of Bryan's corrections and beats every other doc.
3. `node studio/jobs.mjs pending`, oldest first. Do the stage's work, then `node studio/jobs.mjs stage <id> <next>`.
4. Before showing anything, run `node studio/preflight.mjs <id>` and check every frame against the checklist.

## Rules that never bend

- **Corrections become checks, the same turn.** When Bryan corrects something, add one `DO` or `DON'T` line to `styles/EDIT-PREFERENCES.md` with his words. Never ask him the same thing twice.
- **His stages are his.** Never skip `pick`, `clips`, `graphics` or `review`, and never render the final before he approves.
- **Graphics before render.** Show stills of the real graphic over the real frame, in batches of about 5, and wait.
- **One look.** Purple is the structure, gold is the reward (`styles/PALETTE.md`, `styles/brand.json`). Borrowed work gets rebuilt in it.
- **Never invent** numbers, results, quotes, logos or footage. No real number means no number on screen.
- **Transcribe once per job**, into `projects/<id>/transcript/words.json`.
- **Sounds are their own layer.** Picture first, then `studio/sfx.mjs place` from `.nosfx.mp4`, never onto a video that already has them.
- **Re-edits:** rebuild the voice from the raw recording before adding sounds, and check `sfx.json` before blaming a cue.
- **Where work lives:** his file and deliverables in `jobs/<id>/`, editing work in `projects/<id>/`. Never edit or move the dropped source.
- **Windows, Git Bash.** Python is `python`. Limit long renders so a hang is seen right away.

## How an edit runs

Motion-graphic edits go through one command, in this order. Everything comes from one library: `styles/LIBRARY.md` (246 items; watch them at `assets/boards/index.html`).

1. **Plan:** `node studio/edit.mjs plan <id>` reads the transcript and picks a graphic for each moment. Trim it to what earns its place, rotating the kind of visual.
2. **Fit:** `node studio/edit.mjs fit <id>`, then write each plan's real words and the word each part lands on. No real number means no number.
3. **Show:** stills to Bryan for approval (`graphics.json`), as always.
4. **Build:** `node studio/edit.mjs build <id>` fits and renders every plan.
5. **Cut:** `node studio/edit.mjs cut <id>` puts them over the footage, then add sounds with `studio/sfx.mjs`.
6. **Check:** `node studio/edit.mjs check <id>` listens to new sounds and runs the gate. Then move the stage.

**Stories and scenarios** get a scene acted out by a faceless figure (`assets/boards/story/`, the Moonshot Motion breakdown in `styles/REFERENCES.md`); plan flags them as "a story or scenario". Write a new scene per story.

After adding a graphic or sound, run `node studio/library.mjs`.

## Hearing sounds and the gate

- **Hear before using:** `~/.cache/earshot-venv/Scripts/python.exe studio/listen.py cues <cue...>` (or `files --role whoosh <path>`). It catches kazoo, bonk, boom and not-a-whoosh; it can't judge taste, so Bryan's ears win (`styles/sfx-approved.json`).
- **The gate:** `node studio/jobs.mjs stage <id> review|final|done` runs `studio/preflight.mjs` and refuses on any failure. `--override` only if Bryan says so.

## Where to find the rest

| You need | Section | File |
|---|---|---|
| What every folder is | Folder map | `docs/studio/folder-map.md` |
| The stage table, what each stage writes | Studio jobs | `docs/studio/jobs.md` |
| `graphics.json` and approval | Graphics approval | `docs/studio/jobs.md` |
| Cutting a long video into reels | Reels mode | `docs/studio/jobs.md` |
| Scoring the top 3 formats | Ranking the top 3 formats | `docs/studio/formats-and-ideas.md` |
| Finding the Notion script for a clip | Matching the clip to its Content OS script | `docs/studio/formats-and-ideas.md` |
| `ideas.json` and combos | Claude's ideas | `docs/studio/formats-and-ideas.md` |
| `edits.json` for the review page | edits.json | `docs/studio/edits-and-sheet.md` |
| `sheet.json`, per-scene renders | Video Breakdown Sheet | `docs/studio/edits-and-sheet.md` |
| Placing and naming sounds | Sound effects | `docs/studio/sound-and-effects.md` |
| Templates, Remotion add-ons, Video FX | Ready-made effects | `docs/studio/sound-and-effects.md` |
| Animation and design skills | Motion and design skills | `docs/studio/sound-and-effects.md` |
| Which engine builds a style | Which engine builds which style | `docs/studio/engines.md` |
| Scriptwriter picking a style | Scripts that pick their own style | `docs/studio/engines.md` |
| Studying a new style | Learning a new style | `docs/studio/learning-styles.md` |
| Settled conflicts between kits | Rules that override the engines | `docs/studio/engine-overrides.md` |
| Where each skill came from | Where each skill came from | `docs/studio/skill-sources.md` |
| This computer's tools and GPU | Setup notes | `docs/studio/setup.md` |
| Writing the post caption under each video | Post captions | `styles/POST-CAPTIONS.md` |
| Posting to Instagram, the retention-by-design sheet | Instagram and Sheets | `docs/studio/instagram-and-sheets.md` |

Taste and look: `styles/EDIT-PREFERENCES.md` (checks), `styles/STYLE-GUIDE.md`, `styles/SOUND-RULES.md`, `styles/REFERENCES.md`.
Before this file was shortened: `docs/history/CLAUDE-2026-11-09.md`.
