<!-- Part of the Video Studio manual. Index: CLAUDE.md -->

# Plan page: long-form planning and scripts

`/plan` (link at the top of the studio) is where long-form videos are planned before they are
filmed. Bryan adds a video, then clicks a button; the button queues a **request** on the plan and
`run my studio jobs` answers it, the same way edits work. Everything lives in `plans/`, which is
gitignored (the repo is public; the blueprint and scripts are personal).

```
plans/blueprint.md            the business, offer, story, audience (copied from AmplifyViews; editable on the page)
plans/examples/*.md           Bryan's finished long-form scripts: the model every script matches
plans/<id>/plan.json          title, notes, cta, acts, status (board column), request, job
plans/<id>/outline.md         written by Claude for "Outline & check"
plans/<id>/script.md          written by Claude for "Write script", "Story-lock pass" and "Revise"
plans/youtube.json            cached channel feed (styles/brand.json youtubeChannelId)
```

Board columns: idea → outlined → scripted → filming → editing → ready → posted.

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

After that, `jobs.mjs setStage` keeps the plan's column in step: any stage → Editing, `done` → Ready.
Bryan moves it to Posted himself (or the Instagram/YouTube posting flow does).
