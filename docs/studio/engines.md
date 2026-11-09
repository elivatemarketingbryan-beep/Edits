<!-- Part of the Video Studio manual. Index: CLAUDE.md -->

## Which engine builds which style

Read the style's `engine` in the catalog:

- **editor** (root pipeline + HyperFrames): rough cut, captions, graphics, export.
  Follow docs/editor-pipeline.md and the skills `intake`, `rough-cut`,
  `graphics-plan`, `second-pass`, `captions`, `embedded-captions`, `music`, `export`.
  Person mattes: `hyperframes remove-background` (see hyperframes-cli / media-use).
- **HyperFrames by default; Remotion only when switched on.** Read
  `styles/engines.json`.
  - `"remotion": false` (default): every style renders with HyperFrames (Apache-2.0,
    free for client work), including the panel and split layouts. `engines/split-screen`
    is then **reference only**: read its `docs/EDITORIAL.md`, `docs/STYLE.md`,
    `research/` and `src/custom/` for ideas, and rebuild what you need as HyperFrames
    compositions. Don't run its scripts or renders. The first time explainer-panel or
    split-reel is built, port that kit's working layout with the
    `remotion-to-hyperframes` skill (it checks the port frame by frame) and save it as
    the style's HyperFrames template.
  - `"remotion": true`: styles in `remotionStyles` may render with `engines/split-screen`
    (it has proven templates for them). Follow its AGENTS.md and docs/, run its commands
    from that folder (`node scripts/editor.mjs ...`; packages are installed), and give
    it the job's existing transcript as timed JSON instead of re-transcribing. Sounds go
    on as a layer with `studio/sfx.mjs place` like every other style (or, inside
    Remotion, `node studio/sfx.mjs remotion jobs/<id>/sfx.json` prints the
    `audio.effects` block; one route per job, not both). Record which engine a job used
    in `job.json` `engine`.
  - Both engines can be installed at once; each job uses exactly one.
- **legacy** (engines/legacy-editor skills): youtube-clips and coaching-call-clips use
  `clipper`. Run it from `engines/legacy-editor` with that folder's own copy (its
  scripts find their helpers by folder position and break if run from anywhere else);
  its work lands in `engines/legacy-editor/projects/<id>/`. Its own transcription
  counts as the job's one transcript: copy it into `jobs/<id>/transcript.json` rather
  than transcribing again. Each clip is then styled per the guide.
- **content-os**: video-to-content (and anything about scripts, hooks, research,
  carousels, descriptions, posting). Its skills run from the Content OS folder (path above).
- **faceless** (`engines/faceless`): the faceless-sprite style. The input is a **voiceover**
  (audio only), not camera footage: an audio file dropped in the studio ranks this style
  first, and a Content OS script with Edit style "Faceless sprite" is read as a voiceover by
  Bryan's ElevenLabs clone. Follow `engines/faceless/CLAUDE.md` "Making a video", running
  every command from `engines/faceless` (`npm --prefix engine run new -- <voiceover>
  --name <job id>`, write `videos/<id>/plan.json`, `npm --prefix engine run make -- <id>`).
  Its `new` step trims pauses before transcribing, so its own transcript is the job's one
  transcript (the trimmed audio no longer matches a WhisperX one); copy
  `videos/<id>/words.json` into the job folder. It places its own sounds and music, so skip
  `studio/sfx.mjs`; review notes are applied by editing `plan.json` and rerunning `make`.
  Copy `videos/<id>/<id>.mp4` to the job's `preview.mp4` / `final.mp4`. Accent, handle and
  CTA keyword live in `engines/faceless/brand.json`. Needs the one-time sprite
  (`engines/faceless/guides/make-your-sprite.md`, then `npm --prefix engine run sprite`).
  Its page library (stat tiles, charts, chats, posts, docs, tables with highlight, ring,
  click, counter and zoom beats) is reusable for B-roll cards in other styles: build a
  card there and render it as an overlay.
- **brand-motion** (`engines/brand-motion`, Python + Skia, skill `brand-motion-studio`): the
  brand-motion style. Logo animation, kinetic type and an original score with sounds synced
  to every hit, in three modes: motion only, voiceover + motion, or a raw clip + motion
  (hook, captions, punch-ins, stickers, branded close). Follow the skill; its "Video Studio"
  block covers the Windows setup, the work folder (`projects/brand-videos/<slug>/`) and
  reusing the job's words for raw-clip mode. It makes its own music and sounds, so skip
  `studio/sfx.mjs`.
- **remotion-skill** (motion-promo): a voiceover turned into a 60 fps motion-graphic promo
  from tested patterns (count-ups, drop flips, checklists, beat cuts, showcases, offer
  cards) with real site captures. Follow the `motion-promo` skill; its project goes in
  `projects/remotion/motion-promo-<id>/`. Like faceless, it trims the voiceover's pauses
  itself, so its transcript is the job's one transcript.
- **video-fx** (`engines/video-fx`, the 17 Video FX styles: paper cut out, magazine cover,
  sofa wall, pixel zoom, sketch boil, graph rise, glass text, orbit spin, pull-out reveal,
  phone frame, dolly zoom, news wall, frame pop, punch-through cut, green screen,
  interface world, tick list). The style's `fx` names its skill (`fx-<fx>`). Picked as a
  style, that effect leads: run it on the 1-3 strongest ranges, then add 1-2 other effects
  from the Video FX table above where they fit, splice into the full video, then sounds.
  Ranking: these suit a 9:16 talking head with a clean matte; their `bestFor` cues
  follow the table above. Its 5 s format preview is a real render on the job's clip, not
  the example.
- **skill** (creator-pack styles, added 2026-10-31): the style's `skill` in the catalog is the
  skill that edits it (`.claude/skills/<skill>/SKILL.md`). Short: nextphase-short
  (`nextphase-short-editing`), film-grade-short (`nextphase-persa-shorts`), floating-window
  (`zak`). Long: nextphase-long (`nextphase-long-editing`), screen-share-demo
  (`nextphase-screenshare`), glow-motion (`motiongraphics`), cobalt-cut-paper (`vibecode`),
  story-montage (`editor-v2`), silhouette (`editor-v3`, Higgsfield credits: show the cost and
  wait for a yes), film-grade (`persa`). Each skill opens with a "Video Studio" block: start
  from the job (never its own intake or "which style?"), the job's one transcript, the brand
  instead of its colours, Bryan's graphics approval before rendering, the studio's sounds,
  Windows paths. Run a skill's own setup/doctor only the first time its style is used.
  The long-form playbook in `nextphase-long-editing` (silence-tightening, cold open, chapters,
  re-hooks, layout rotation, real media on every claim) and the short-form one in
  `nextphase-short-editing` (hook → face → body → CTA, retention-first timing) are worth
  reading for any long or short edit, whatever the style.

`status: "draft"` styles have no template yet: build them from the STYLE-GUIDE section
with the editor engine, and once the user approves a final, save what worked as that
style's template (a preset in `presets/` or a reusable composition) and set its status
to `ready`.

## Scripts that pick their own style

When content-os's `scriptwriter` writes a script, it also picks a style id from the
catalog and stores it in the Notion page's "Edit style" property (add the property if
the database lacks it), with a one-line reason. That style then ranks first when the
filmed video comes in.
