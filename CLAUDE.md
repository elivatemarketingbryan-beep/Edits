# Video Studio

One system that merges five kits: drop a video into the studio page, get the best 3
formats for it, pick one, review a preview with timestamped notes, approve, get the
final. Claude is the editor; the page is the front door.

**This file is the one entry point.** Each engine keeps its own detailed docs (listed
below), but where they disagree with this file, this file wins. The settled conflicts
are under "Rules that override the engines".

## Folder map

```
CLAUDE.md                 this file
START_HERE.md             one-page guide for the user
Start Studio.cmd          double-click: runs the studio page at http://localhost:4747
studio/                   the page (server.mjs, public/) and the job store (jobs.mjs)
jobs/<id>/                one folder per dropped video (the page's state + deliverables)
projects/<id>/            the editing work for that job (root pipeline layout, see docs/editor-pipeline.md)
styles/catalog.json       every style and tool: id, engine, status, ranking cues, recipe
styles/STYLE-GUIDE.md     what every style looks like, studied frame by frame. READ before building a style
styles/brand.json         the user's colours and fonts; every style uses these
styles/sfx.json           named sound effects (cue -> file, peak, volume, when to use)
studio/sfx.mjs            places sound effects on a video, peak-aligned; logs them for review
studio/check.mjs          structure check for everything here (run before jobs)
styles/SCRIPT-SHAPES.md   the 8 script shapes and cue tags: scripts are written in their format's shape so the edit can follow them (catalog `scriptShape`)
studio/script-cues.mjs    matches a clip to its Content OS script (score) and times every tagged line (cues)
styles/CAPTIONS.md        caption modes and rules (from the Dan Martell breakdown); built by the `captions` template
styles/REFERENCES.md      breakdowns of other creators' videos: techniques to reuse (add new ones here)
styles/ANIMATIONS.md      ready-made effects (search bar, counter, article highlight, map route, motion background, glow pill, pastel grade): when to use each
studio/anim.mjs           makes an effect from assets/animations/<name>/ in 9x16 or 16x9 with brand colours
studio/lut.mjs            colour grades (.cube in assets/luts/); apply to footage before graphics
assets/sfx/               the named sound files; assets/sound-effects/ is the full Motionix pack
.claude/skills/           all skills from every kit, merged (see "Where each skill came from")
lib/ presets/ scripts/ workflows/   root editing pipeline (was "Claude Editor")
styles/engines.json       render engines switch: HyperFrames always, Remotion optional (off by default)
engines/split-screen/     Remotion kit (was "Split-Screen-Editor"): runs only if styles/engines.json says so; otherwise reference for editorial rules and graphics ideas
engines/content-os/       Content OS (the one copy; open this folder to work in it directly):
                          research, scripts (written per format, with cue tags), voice, brand, carousels, descriptions, Notion,
                          repurposing (one long-form into a week of clips, reel ideas and captions), content calendar
engines/faceless/         faceless-sprite style: voiceover in, pixel-art Bryan + motion-graphic browser cards out (its own HyperFrames engine;
                          its CLAUDE.md is the flow, engine/docs/pages.md the 14 B-roll page kinds). Sprite in sprite/, renders in videos/
engines/video-fx/         Claude Video FX: 17 Remotion effects for talking heads with a person cut-out (skills video-fx, fx-*)
engines/brand-motion/     brand-motion style: logo animation + kinetic type + original score (Python + Skia; skill brand-motion-studio)
studio/words-convert.mjs  a job's WhisperX words in the shape each add-on kit reads (Remotion captions, segments, brand-motion)
engines/legacy-editor/    older editor; only its clipper, CapCut, Premiere, Resolve, thumbnail and music skills are used
docs/editor-pipeline.md   the root pipeline's full instructions and lab notes (was Claude Editor's CLAUDE.md)
docs/APP-HANDOFF.md       the user's set workflow for cutting onto Premiere / Resolve / Final Cut / CapCut (the rough-cut-only tool)
raw/  transcript/  vendor/  that workflow's raw clip, words.json + cuts.json, and cloned app connectors
scripts/transcribe.sh     WhisperX large-v3 word timings on the GPU (CUDA float16, CPU int8 fallback); never re-transcribes
  (YouTube downloads: use `uvx --from "yt-dlp[default]" yt-dlp`; the winget copy is too old and gets 403s)
```

## Studio jobs: what to do when the user says "run my studio jobs"

0. `node studio/check.mjs` first (a few seconds). It checks the folder structure,
   styles, sounds, skills and tools. Fix any FAIL before editing.
1. `node studio/jobs.mjs pending` lists jobs waiting on Claude. Work them oldest first.
   `node studio/jobs.mjs show <id>` prints one. Each job is `jobs/<id>/job.json` plus
   `formats.json`, `edits.json` and `notes.json` beside it.
2. Do the stage's work (below), write the files, then move the stage with
   `node studio/jobs.mjs stage <id> <next>`. The page polls and updates on its own.
3. Never skip a stage that belongs to the user (`pick`, `review`). Never render the final
   before the user approves.

| Stage | Who | What Claude does | Writes | Next |
|---|---|---|---|---|
| `formats` | Claude | Get the video (`source` in the job folder, or download `url` with yt-dlp into it). Intake into `projects/<id>/` and transcribe once (rough-cut skill). Rank styles (below). Render a ~5s preview of each of the top 3 from the strongest moment. | `formats.json`, `previews/<style>.mp4`, `job.json` `transcript` = `transcript.json` (segments `{start,end,text}`), `duration` | `pick` |
| `edit` | Claude | Build the chosen `style` (or run the chosen tool) per its catalog recipe, STYLE-GUIDE section and brand.json. Render a draft without sounds, then add sounds (see "Sound effects"). | `.nosfx.mp4`, `sfx.json`, `preview.mp4`, `edits.json`, `job.json` `preview` | `review` (tools with no video: put files in `outputs/`, list them in `job.json` `outputs`, go to `done`) |
| `revise` | Claude | For every note with `status: "open"`: change the edit, then set its `reply` (one line: what changed) and `status: "done"`. If a note can't be done, say why in `reply` and leave it open. Re-render the preview. | `notes.json`, `preview.mp4`, `edits.json` | `review` |
| `final` | Claude | Full-quality render of the approved edit. Copy it into the job folder. Run the content step if the user asked for it. | `final.mp4`, `job.json` `final`, `finalDuration` (seconds, for the "ready" screen's runtime stat), `outputs` | `done` |

If the user picks a style during `formats` (the page allows it), the job is already in
`edit`; skip ranking.

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
   **Studio job**). For each, fetch the page and save its body to
   `projects/<id>/scripts/<notion-page-id>.md`.
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

### edits.json (feeds the review page)

Every edit Claude makes gets one entry, output-timeline seconds:
`{ "type": "cut|caption|audio|sfx|graphic|headline|broll", "start": 3.2, "end": 4.0, "what": "Removed 0.8s pause", "why": "Dead air after 'every day'" }`.
Keep `what` under ~60 characters. The review page shows these as chips, timeline
tracks and the Edits tab, so the user can leave a note on a specific edit.

### Sound effects (every style)

Sounds are their own layer, added after the picture is rendered, so a note like "turn
this sound down" never needs a full re-render.

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

2-4 effects per 30-60 s reel; each renders on its own range and `splice`s back into the
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

`status: "draft"` styles have no template yet: build them from the STYLE-GUIDE section
with the editor engine, and once the user approves a final, save what worked as that
style's template (a preset in `presets/` or a reusable composition) and set its status
to `ready`.

## Rules that override the engines

1. **One instruction file.** This file, then the engine docs. engines/legacy-editor's
   CLAUDE.md is reference only; its pipeline is replaced by the root pipeline.
   Content OS's onboarding gate does not apply inside Video Studio; run its
   `setup.sh` only the first time a content tool is used.
2. **Transcribe once per job**, in `projects/<id>/transcript/words.json` (root
   pipeline rule). Everything reads that: the
   review page reads `jobs/<id>/transcript.json`, content-os reads it instead of
   transcribing again. The rtf skill is only for links and clip-ranking, not a second
   transcript of the same file.
3. **Look:** when a style is chosen, `STYLE-GUIDE.md` + `brand.json` set the palette
   and type. The split-screen docs' rule "vary palettes" is narrowed to: vary the *kind* of
   visual per beat (diagram, demo, chart, type), never the palette.
4. **Where work lives:** the user's dropped file and deliverables in `jobs/<id>/`;
   editing work in `projects/<id>/`. Never edit or move the dropped source.
5. **Default finish:** a chosen style ends in a rendered MP4 via preview → review →
   final. The editing-app handoff (.fcpxml, no render) is the `rough-cut-only` tool,
   not the default.
6. **Brand:** if `brand.json` `set` is false, before the first edit ask the user for
   accent colour, fonts and handle, one question at a time (or read
   brand-kit.md in the Content OS folder if it's filled in), write them, set `set: true`.
7. **Platform:** this is Windows with Git Bash. Python is `python` (not `python3`). The
   root pipeline was written for macOS/WSL2 but built and unit-tested on Windows Git
   Bash; treat the first real job as the integration test and add what you learn to
   the lab notes in docs/editor-pipeline.md.
8. Safe zones and every lab note in docs/editor-pipeline.md still apply.

## Where each skill came from

- Root pipeline (Claude Editor): intake, rough-cut, editing-handoff, graphics-plan,
  second-pass, captions, music, export, rtf, and the vendored HyperFrames pack
  (hyperframes*, media-use, embedded-captions, motion-graphics, general-video, ...).
  Never hand-edit the vendored pack; see docs/editor-pipeline.md.
- Split-screen: animate, animation-*, apple-design, apple-liquid-glass,
  emil-design-eng, find-animation-opportunities, improve-animations, review-animations.
- Content-os: scriptwriter, hook-generator, transcribe-url, yt-description,
  carousel-generator, auto-poster, dm-revival, knowledge-compile, voice-corpus-builder,
  ig-/yt- research skills.
- Legacy editor: clipper, capcut, premiere-pro, davinci-resolve, thumbnail-generator,
  background-music. Where both editors had a skill, the newer root version was kept.

## Scripts that pick their own style

When content-os's `scriptwriter` writes a script, it also picks a style id from the
catalog and stores it in the Notion page's "Edit style" property (add the property if
the database lacks it), with a one-line reason. That style then ranks first when the
filmed video comes in.

## Setup notes (this computer)

- Windows 11, Git Bash (MINGW64). Folder writes work (no Controlled Folder Access block).
- ffmpeg/ffprobe 9.0 (winget Gyan.FFmpeg), uv 0.12.5, git 2.55, Node 24, Python 3.11.16 via uv.
- GPU: NVIDIA GeForce RTX 4070, 12 GB, driver 617.42: WhisperX should run CUDA float16.
- The shared WhisperX venv already exists at `~/.cache/video-editor/whisperx-venv`
  (Windows python: `Scripts/python.exe`). Reuse it; never recreate it.
- Brand: purple on black (styles/brand.json).
- Finishes in **CapCut**: the app-handoff path renders ./cut.mp4 (no live app connection).
