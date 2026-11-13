<!-- Part of the Video Studio manual. Index: CLAUDE.md -->

# Plan and Script pages: long-form planning and scripts

Two tabs at the top of the studio, next to Edit: **Plan** (`/plan`: the year, the video cards, titles,
thumbnails, notes, raw footage and finished edits) and **Script** (`/script`: pick a planned video, then
Outline & check, Write script, Story-lock pass, Revise, Copy script, and the blueprint). Both read and
write the same plans; the request flow below is the same whichever page queued it.

`/plan` (link at the top of the studio) is where long-form videos are planned before they are
filmed. Bryan adds a video, then clicks a button; the button queues a **request** on the plan and
`run my studio jobs` answers it, the same way edits work. Everything lives in `plans/`, which is
gitignored (the repo is public; the blueprint and scripts are personal).

```
plans/blueprint.md            the business, offer, story, audience (copied from AmplifyViews; editable on the page)
plans/examples/*.md           Bryan's finished long-form scripts: the model every script matches
plans/<id>/plan.json          title, notes, cta, acts, month (1-12 of the year plan), due, status, request, job,
                              titles (options, one chosen), thumb (chosen thumbnail file), notesLog (production notes),
                              style ("Video type": a long-form style id from styles/catalog.json), example (a reference video link)
plans/<id>/assets/thumbnails/ thumbnail options Bryan uploads
plans/<id>/assets/raw-footage/ what was filmed; "Send to editor" copies a clip into a new studio job
                              (stage formats, `job.plan` set), so the formats stage already knows the plan
plans/<id>/assets/finished/   the final edited video; uploading one moves the plan to Ready
plans/<id>/assets/archive/    raw/ and edited/: storage only, kept "in case it's needed later" (any file type).
                              Never send these to the editor or use them in an edit unless Bryan asks.
plans/<id>/assets/files/      b-roll, screenshots, logos, proof, documents for this video
plans/<id>/outline.md         written by Claude for "Outline & check"
plans/<id>/script.md          written by Claude for "Write script", "Story-lock pass" and "Revise"
plans/youtube.json            cached channel feed (styles/brand.json youtubeChannelId)
```

The page shows a **year plan** (Month 1 to 12, four videos a month) or the same videos **by stage**:
idea → outlined → scripted → filming → editing → ready → posted. Each video has tabs for its script,
outline, titles and thumbnails (pick one of each), production notes, and assets.

When writing a script, read the plan's `notesLog` too: it often holds the angle, shots and thumbnail ideas.
If a title is chosen, write the intro to confirm that title's promise.

## Answering requests

`node studio/jobs.mjs pending` mentions plan requests; list them with `node studio/plans.mjs pending`.
For each, oldest first:

1. `node studio/plans.mjs show <id>`. Read `styles/LONGFORM-SCRIPT.md` first and follow its reading
   list: Bryan's finished scripts in `plans/examples/` (the model to match), the blueprint, voice-dna,
   and Joe Aquino's transcripts for his speaking pattern only.
2. Do the request:
   - **outline**: write `plans/<id>/outline.md` in the outline format.
   - **script**: write `plans/<id>/script.md` in the format of `plans/examples/` with cue tags. If `outline.md`
     exists, follow its points and order and sharpen anything marked COMMON.
   - **lock**: rewrite `script.md` with a story-lock pass (or the outline, if there is no script).
   - **revise**: apply `request.note` to the script (or the outline if there is no script), keeping what works.
3. `node studio/plans.mjs done <id>` clears the request and moves the card (outline → outlined, script → scripted).

Never invent numbers, results or testimonials (Bryan has none); use `[PLACEHOLDER: …]`.

## From script to edit

In the `formats` stage, alongside the Notion lookup in `formats-and-ideas.md` "Matching the clip
to its Content OS script":

1. `node studio/plans.mjs scripts` lists scripted plans with no job yet.
2. For each, `node studio/plans.mjs export <plan> projects/<job>/scripts/plan-<plan>.md`, then score
   them with `studio/script-cues.mjs score` together with the Notion scripts.
3. On a match (≥ 0.6) from a plan: `node studio/plans.mjs link <plan> <job>` (sets `job.plan`; the
   plan moves to Editing), write `job.json` `script` as usual with `"plan": "<plan id>"` instead of
   `notion`, and save the timed cues from the exported file. Long-form scripts use the Long form shape
   (`[CHAPTER]` on each act), so pick a long-form style first.

If the plan has a `style` (its Video type), that style goes first in `formats.json` with the reason
"Planned as <style name> on the Plan page". If it has an `example` link, study it the way
`docs/studio/learning-styles.md` describes before designing graphics.

In the edit, look in `plans/<plan>/assets/files/` for `[PROOF]`, `[IMAGE]` and `[BROLL]` cues before
asking Bryan for anything, and use the chosen title and thumbnail for the end card and the YouTube upload.

After that, `jobs.mjs setStage` keeps the plan's column in step: any stage → Editing, `done` → Ready.
Bryan moves it to Posted himself (or the Instagram/YouTube posting flow does).
