<!-- Part of the Video Studio manual. Index: CLAUDE.md -->

### edits.json (feeds the review page)

Every edit Claude makes gets one entry, output-timeline seconds:
`{ "type": "cut|caption|audio|sfx|graphic|headline|broll", "start": 3.2, "end": 4.0, "what": "Removed 0.8s pause", "why": "Dead air after 'every day'" }`.
Keep `what` under ~60 characters. The review page shows these as chips, timeline
tracks and the Edits tab, so the user can leave a note on a specific edit.

### Video Breakdown Sheet (every job; required for long-form)

The user reviews a long edit as a sheet, not by scrubbing: one row per scene and animation,
timestamped, with a thumbnail and a box to say exactly what to change. Notes then point at
one scene, so Claude changes and re-renders that scene instead of the whole video.

1. Before rendering, write `jobs/<id>/sheet.json`: every scene back to back, output seconds,
   covering the whole video. A scene is one visual idea: a chapter card, a graphic, a B-roll
   run, a talking stretch with its captions. A long-form scene is usually 5-40 s.
   `[{ "id": "s01", "chapter": "Hook", "start": 0, "end": 6.4, "title": "Pilot logo sting", "kind": "graphic", "what": "Glowing Pilot wordmark scales in over the open; tagline types on", "file": "projects/<id>/compositions/hook.html", "render": "scenes/s01.mp4" }]`
   `chapter` groups rows (use the video's real chapters), `what` is what the viewer sees
   (under ~120 characters), `file` is the source that builds it, `render` its rendered clip.
   `node studio/sheet.mjs check <id>` must pass.
2. **Long-form (over 3 min, or any 16:9 edit):** render each scene on its own to
   `jobs/<id>/scenes/<scene>.mp4` with identical encoding (same codec, size, fps, audio rate),
   then `node studio/sheet.mjs assemble <id>` joins them into `.nosfx.mp4` without
   re-encoding. Short-form can render in one pass; the sheet is still written.
3. After sounds are placed: `node studio/sheet.mjs thumbs <id>` (a frame per scene from the
   preview; `thumbAt` on a scene overrides the moment).
4. The sheet lives at `/sheet?job=<id>` (linked from the review page). Notes from it carry
   `scene`; review-page notes are matched to scenes by time. On `revise`, re-render only the
   scenes with open notes, then assemble, re-place sounds from `sfx.json`, and refresh thumbs.
   If a change moves a scene's length, shift the later scenes' `start`/`end` and `sfx.json`
   times by the same amount; never re-render scenes nobody commented on.
