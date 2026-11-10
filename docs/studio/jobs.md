<!-- Part of the Video Studio manual. Index: CLAUDE.md -->

## Studio jobs: what to do when the user says "run my studio jobs"

0. `node studio/check.mjs` first (a few seconds). It checks the folder structure,
   styles, sounds, skills and tools. Fix any FAIL before editing. Then read
   `styles/EDIT-PREFERENCES.md`; its rules hold for every job.
1. `node studio/jobs.mjs pending` lists jobs waiting on Claude. Work them oldest first.
   `node studio/jobs.mjs show <id>` prints one. Each job is `jobs/<id>/job.json` plus
   `formats.json`, `edits.json` and `notes.json` beside it.
2. Do the stage's work (below), write the files, then move the stage with
   `node studio/jobs.mjs stage <id> <next>`. The page polls and updates on its own.
3. Never skip a stage that belongs to the user (`pick`, `review`). Never render the final
   before the user approves.
4. **Show the motion graphics before rendering (Bryan's rule).** Before rendering any edit,
   design its motion graphics first and show them in batches of about 5: a still of each
   graphic composited over the real frame at its moment (its key pose, not raw footage),
   with the timestamp and the line it's timed to. Wait for the user to approve or change a
   batch before rendering the video. Raw-footage frames alone don't count as the preview.
   The page does this as the `design` → `graphics` stages (see "Graphics approval" below).
5. **Read the job's `mode`.** `video` (default) is one finished edit; `reels` cuts one long
   video into many 9:16 reels (see "Reels mode" below). Each mode has its own stage path.

Stage paths:
- `video`: `formats` → `pick` → `design` → `graphics` → `edit` → `review` ⇄ `revise` → `final` → `done`
- `reels`: `formats` → `clips` → `design` → `graphics` → `final` → `review` ⇄ `revise` → `done`

| Stage | Who | What Claude does | Writes | Next |
|---|---|---|---|---|
| `formats` | Claude | Get the video (`source` in the job folder, or download `url` with yt-dlp into it). Intake into `projects/<id>/` and transcribe once (rough-cut skill). Rank styles (below). Render a ~5s preview of each of the top 3 from the strongest moment. Pitch ideas for its moments (see "Claude's ideas"). Reels mode: find the reels instead (see "Reels mode"). | `formats.json`, `ideas.json`, `previews/<style>.mp4`, `job.json` `transcript` = `transcript.json` (segments `{start,end,text}`), `duration`; reels mode: `clips.json` | `pick` (reels: `clips`) |
| `design` | Claude | Design the motion graphics for the chosen style and picked ideas (reels mode: for every reel in `job.json` `chosen`), take a still of each at its key pose over the real frame, write them to `graphics.json`. On a return from `graphics`, change only the graphics with `status: "changes"`: set `reply` (one line), clear the status to `open`. A tool with no graphics skips straight to `edit`. | `graphics.json`, `graphics/*.jpg` | `graphics` |
| `edit` | Claude | Build the chosen `style` (or run the chosen tool) per its catalog recipe, STYLE-GUIDE section and brand.json, plus every idea in `job.json` `picked` at its moment (unpicked ideas are skipped). Write the breakdown sheet first (see "Video Breakdown Sheet"; long-form renders one file per scene). Render a draft without sounds, then add sounds (see "Sound effects"), then `sheet.mjs thumbs`. | `sheet.json`, `.nosfx.mp4`, `sfx.json`, `preview.mp4`, `edits.json`, `job.json` `preview` | `review` (tools with no video: put files in `outputs/`, list them in `job.json` `outputs`, go to `done`) |
| `revise` | Claude | Run `node studio/sheet.mjs md <id>` to see which scenes have open notes. For every note with `status: "open"`: change that scene only, then set its `reply` (one line: what changed) and `status: "done"`. If a note can't be done, say why in `reply` and leave it open. Long-form: re-render only the noted scenes, `assemble`, re-place sounds, `thumbs`. Short-form: re-render the preview. Notes with `general: true` are about the whole video (typed in the page's notes box, `t` is 0); `kind: "approve"` ones were left while approving, so apply them in `final`. Reels mode: see "Reels mode" step 6. | `notes.json`, `preview.mp4`, `edits.json` | `review` |
| `final` | Claude | Full-quality render of the approved edit. Copy it into the job folder. Run the content step if the user asked for it. | `final.mp4`, `job.json` `final`, `finalDuration` (seconds, for the "ready" screen's runtime stat), `outputs` | `done` |

Motion-graphic edits run the `edit` stage through `studio/edit.mjs` (plan, fit, build, cut, check); see CLAUDE.md "How an edit runs".

If the user picks a style during `formats` (the page allows it), the job is already in
`design`; skip ranking. The user's moves (`pick`, `clips`, `graphics`, `review`) happen on the
page; never move a job out of them yourself.

### Graphics approval (graphics.json, every job)

Before anything renders, the page shows the user a still of every graphic. Write
`jobs/<id>/graphics.json` in `design`, in batches of about 5 per reel or section:
`[{ "id": "g1", "reel": "r2", "batch": 1, "t": 12.4, "label": "Review counter 11 → 64", "line": "we went from 11 reviews to 64", "still": "graphics/g1.jpg", "status": "open", "note": null, "reply": null }]`

- `still` is a job-relative JPG: the graphic composited over the real frame at its key pose
  (HyperFrames `snapshot --at`), never raw footage. `t` is output seconds (reels: seconds in that reel),
  `line` the words it's timed to, `reel` the clips.json id (reels mode only).
- The page sets `status: "approved"`, or `status: "changes"` with the user's `note`. Any change
  sends the job back to `design`; all approved sends it on (`edit`, or `final` in reels mode).
- Keep approved graphics as they are; on a return, rework only the `changes` ones.

### Reels mode (cut one long video into reels)

The drop screen sets `job.json` `mode: "reels"` and `reelOpts: { "count": "auto"|"5"|"10"|"15", "length": "15-30"|"30-60"|"60-90" }`.

1. **`formats`:** get and transcribe the video as usual (no format ranking). Find the reels: self-contained
   moments with a hook and a payoff, inside the length range, `count` of them (auto: every moment
   that stands on its own, usually 6-12 for a 20-minute video). Write `jobs/<id>/clips.json`:
   `[{ "id": "r1", "title": "Every review has a window", "start": 312.4, "end": 356.0, "hook": "Most contractors ask for reviews at the wrong time.", "why": "Clear mistake + fix, ends on a CTA", "fav": true }]`
   (`start`/`end` source seconds; may join ranges, then add `"ranges": [[a,b],[c,d]]`). Mark the 2-4
   strongest `fav` (pre-ticked). Move to `clips`.
2. **`clips` (user):** the page ticks reels and writes `job.json` `chosen` (clip ids), then moves to `design`.
3. **`design` → `graphics`:** as above, one batch per reel, `reel` set on each graphic.
4. **`final`:** render each chosen reel (9:16, captions, the approved graphics, sounds) to
   `jobs/<id>/reels/<n>-<slug>.mp4`, write its Instagram caption following
   `engines/content-os/knowledge/ig-caption-patterns.md` (hashtags from its list), and write
   `jobs/<id>/reels.json`: `[{ "id": "r1", "title": "...", "file": "reels/01-every-review-has-a-window.mp4", "start": 312.4, "end": 356.0, "caption": "..." }]`.
   List the files in `job.json` `outputs`, then move to `review` (not `done`: Bryan reviews every reel).
5. **`review` (user): Reels review.** The page shows each reel with a notes box and Approve / Reject, and writes
   `status: "approved"` or `status: "changes"` plus `note` onto each reel in `reels.json`. Any rejected reel moves
   the job to `revise`; every reel approved moves it to `done`.
6. **`revise` (Claude):** re-cut only the reels with `status: "changes"`, following `note`. Set `reply` (one line:
   what changed) and `status: "open"`, keep approved reels as they are, then `node studio/jobs.mjs stage <id> review`.
7. **Posting:** approved reels get a Post to Instagram button (`studio/instagram.mjs`), which writes `ig`
   (`status`, `id`, `permalink`, `postedAt`, `sheet`) and a `design` snapshot onto the reel and logs a row in the
   retention sheet. Finished single edits (`done`, with `final`) get the same button; theirs lands on `job.json`. Never post
   for Bryan; the button is his. Setup and the weekly stats refresh: `docs/studio/instagram-and-sheets.md`.
