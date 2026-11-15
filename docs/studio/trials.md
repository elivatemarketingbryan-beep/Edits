<!-- Part of the Video Studio manual. Index: CLAUDE.md -->

# Trial Reels page: test versions of a reel, keep the winner

`/trials` (the **Trial Reels** tab next to Plan and Script). Instagram trial reels go to
non-followers only, so Bryan can test versions of a reel without his followers seeing every one.
A **trial** is one idea with 2 to 10 **versions** (5 to 10 is the target): a different hook on each,
plus small changes in the body so Instagram doesn't flag them as duplicates. He posts every version
as a trial reel, logs the views after 16 to 24 hours, picks the winner, re-uploads it to his feed,
then **farms** it (reposts with variations about every 7 days, remakes). How to write and vary the
versions: `styles/TRIAL-REELS.md`.

```
plans/trials/<id>/trial.json     idea, notes, source (a finished long-form video, optional), request,
                                 format: filmed | animated (cartoon story reel in Bryan's cloned voice),
                                 variants [{ id: v1, label: A, hook, script, changes, approved: { text, at },
                                   posted, results, job }],
                                 winner, farm [{ date, kind: trial|feed|remake, views, note }]
plans/trials/<id>/<vid>/raw/     that version's footage ("Send to editor" copies a clip into a new job)
plans/trials/<id>/<vid>/final/   the finished reel (uploaded, or copied back when its edit is done)
plans/trials/<id>/<vid>/voice/   animated trials: the joined cloned-voice voiceover (the page plays it)
```

`plans/` is gitignored. The trial's stage is worked out from its versions, never stored: Idea →
Scripted (a hook written) → Filming (footage or a job) → Ready to post (a finished reel) → Testing
(one posted) → Farming the winner. `results` holds views, nonFollowerPct, likes, comments, shares,
saves, follows. "Leading" = most views, with shares + saves weighted in; Bryan picks the winner
himself. The page shows total views across every version and repost, and when the next trial repost
is due (7 days after the last one).

## Answering requests

`node studio/jobs.mjs pending` mentions trial requests; list them with `node studio/trials.mjs pending`.
For each, oldest first:

1. `node studio/trials.mjs show <id>`. Read `styles/TRIAL-REELS.md` and do what its reading list says.
2. Do the request, writing straight into `plans/trials/<id>/trial.json` (keep every version's `id`,
   `label`, `results`, `posted` and `job` as they are):
   - **hooks**: write every version's `hook`, `script` and `changes` (what else differs) from the idea and notes.
   - **animate** (trials with `format: "animated"`): a cartoon story reel acted out by the faceless
     figure, voiced by Bryan's cloned voice (`docs/studio/voice.md`, use 2). The page only lets this be
     queued once every written version has `approved` words, and `approved.text` must equal the
     version's `hook` + "\n" + `script` right now (`wordsApproved` in `show`). Voice only those
     exact words, cue tags and stage notes removed; never add, cut or change a word. If a version's
     words aren't approved, skip it and say so.
     1. Make the voiceover with `node studio/voice.mjs speak` a sentence or two at a time, 3 takes
        each; check every take by transcript and pitch (voice.md "Checking a take") and keep the best.
        The body is the same on every version, so voice it once and reuse it; voice each hook
        separately. Join hook + body into `plans/trials/<id>/<vid>/voice/<vid>.wav` (the page plays it).
     2. Build the animation as a studio job: `writeJob` in `studio/jobs.mjs` with the joined voiceover
        as `source`, `mode: "video"`, `trial: { id, variant }`, and a faceless style first in formats
        (an audio-only source ranks them first). The story scenes come from `assets/boards/story/`
        (CLAUDE.md "Stories and scenarios"). Bryan's stages apply: he approves the graphics stills and
        reviews the first one. When that job reaches `done`, the reel lands in the version's `final/`.
     3. Make the other versions the same look as the approved one, each with its own hook voiceover
        and its `changes` (different colors, scene order, b-roll, caption style, length), so none is a
        near-duplicate.
   - **variations**: one version has a finished reel. Render every other version from it into its
     `<vid>/final/`: re-record or re-cut the hook (the cloned voice only for a fix, `docs/studio/voice.md`;
     otherwise ask Bryan to film the hook lines), then apply that version's `changes` to the body so
     no two files are near-duplicates (`styles/TRIAL-REELS.md` "Beating the duplicate flag").
   - **cut**: the trial has a `source` (a done studio job, or a plan with a finished edit). Find
     self-contained moments in its transcript (`projects/<job>/transcript/words.json`, else the plan's
     `script.md`), one per version, each with its own hook. Write `hook`, `script` (the spoken words) and
     `start`/`end` (source seconds) on each version. Then cut each one as a 9:16 reel with captions
     (the clipper skill's engine, reels-mode rules in `docs/studio/jobs.md`) into `<vid>/final/`.
     Bryan's stages still apply: show the stills of any graphics before rendering.
   - **farm**: the trial has a `winner`. Make one new varied file of it for the next repost into
     `<winner>/final/` (name it `repost-<date>.mp4`), different enough from every earlier upload, and
     say in one line what changed. Don't log it in `farm`: Bryan logs a repost when it goes up.
   - **revise**: apply `request.note` to the versions it names (all of them if it names none).
3. `node studio/trials.mjs done <id>` clears the request.

## From a version to an edit

"Send to editor" makes a normal video job (`mode: video`) with `trial: { id, variant }` and the
version's hook and script in `jobs/<job>/trial-script.md`. In `formats`, use that file as the clip's
script (instead of the Notion lookup) and rank 9:16 styles only. Every stage works as usual. When the
job reaches `done`, `jobs.mjs setStage` copies `final.mp4` into the version's `final/` folder, so the
finished reel shows up on the trial.

Edit one version fully (Bryan approves it as usual), then make the rest with the `variations`
request instead of sending every version through the editor. The versions share the style and the
message; the hook and the small `changes` are what differ, which is what the test measures.
