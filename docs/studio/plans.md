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
plans/<id>/research.md        written by Claude for "Research videos talking about this" (Bryan can edit it in the Research box)
plans/<id>/outline.md         written by Claude for "Outline & check"
plans/<id>/gate.json          the pre-write gate check: Claude's checks and proof options, Bryan's picks
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
   - **research**: research what others in the niche say about this video's topic and outline, and write
     `plans/<id>/research.md` (it shows in the Research box under the angle on the Plan page). See
     "Research requests" below. It doesn't move the card.
   - **outline**: write `plans/<id>/outline.md` in the outline format.
   - **gate**: the pre-write gate check ("Generate script" on the Plan page queues this too). Read `research.md` first if it exists. Write `plans/<id>/gate.json` (checks, then proof options per
     section) as `styles/LONGFORM-SCRIPT.md` "Pre-write gate check" describes. Bryan picks on the Script
     page; confirming queues the script.
   - **script**: write `plans/<id>/script.md` in the format of `plans/examples/` with cue tags. If `outline.md`
     exists, follow its points and order and sharpen anything marked COMMON. If `gate.json` is confirmed,
     use its title, outline and the picked proof per section (Bryan's typed facts word for word; a pick
     that needs his data but has none becomes a `[PLACEHOLDER]`).
   - **lock**: rewrite `script.md` with a story-lock pass (or the outline, if there is no script).
   - **revise**: apply `request.note` to the script (or the outline if there is no script), keeping what works.
3. `node studio/plans.mjs done <id>` clears the request and moves the card (outline → outlined, script → scripted).

Never invent numbers, results or testimonials (Bryan has none); use `[PLACEHOLDER: …]`.

## Research requests

The "Research videos talking about this" button (under Add video, and in the open video's Research box)
queues `research`. Search the web (several searches in one go) for who else covers the topic (YouTube,
podcasts, trade magazines, Jobber/ServiceTitan/Hook Agency and the like), the real studies and numbers,
and the myths. Check every claim in the outline (`notes`) against what you find. Write `research.md` in
this order, plain and short:

```
# Niche Research: <topic>
*Researched <date>. <one line on how much of the content is vendor marketing>*
## Who's already covering this        (named videos/episodes/articles, what they say, the closest competitor)
## Where your outline matches (keep it)
## Numbers you can actually use       (each with its named source; say what's correlation or a vendor claim)
## Fix before filming                 (claims with no source, wrong facts, [CLIENT] lines, a borrowed last line)
## What others mention that your outline doesn't
## How to stand out
## Sources                            (markdown links)
```

**Then fill the outline.** Right after `research.md`, fill Bryan's outline template in the video's
`notes` (the "Angle, stories and real proof" box), exactly in the shape of `styles/OUTLINE-TEMPLATE.md`:
every slot filled from the research, his own typed lines kept in their slots. Write it to a file and run
`node studio/plans.mjs notes <id> <file>`. The script is generated from this outline afterwards
("Generate script" queues the gate).

Bryan's rules apply here too (`styles/EDIT-PREFERENCES.md`, `styles/LONGFORM-SCRIPT.md`): he has no clients,
so flag every `[CLIENT]` line and suggest real proof instead; the company is Elivate Marketing; never pass a
stat on without its source. When the gate or the script is written later, read `research.md` first and use
its numbers and fixes.

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

**One stage per video.** `plan.status` is the single stage every view shows (Year plan pill, By stage
column, Script list). Moving a video to Ready or Posted (by hand, a finished-edit upload, or the job
finishing) drops any waiting outline/script request; past Scripted, a missing script is shown as
"no script saved here", never as work still to do.

After that, `jobs.mjs setStage` keeps the plan's column in step: any stage → Editing, `done` → Ready.
Bryan moves it to Posted himself (or the Instagram/YouTube posting flow does).
