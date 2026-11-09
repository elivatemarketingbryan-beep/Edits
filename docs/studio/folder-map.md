<!-- Part of the Video Studio manual. Index: CLAUDE.md -->

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
styles/EDIT-PREFERENCES.md  Bryan's editing taste (e.g. YouTube: don't overdo effects). READ before ideas, edits and revisions; it wins over the guide. Add what he tells you
styles/brand.json         the user's colours and fonts; every style uses these
styles/PALETTE.md         the Elivate Marketing colour palette: names, hex and rules for captions, reels and graphics (picture: styles/brand-palette.png)
styles/sfx.json           named sound effects (cue -> file, peak, volume, when to use)
studio/sfx.mjs            places sound effects on a video, peak-aligned; logs them for review
studio/check.mjs          structure check for everything here (run before jobs)
styles/SCRIPT-SHAPES.md   the 8 script shapes and cue tags: scripts are written in their format's shape so the edit can follow them (catalog `scriptShape`)
studio/script-cues.mjs    matches a clip to its Content OS script (score) and times every tagged line (cues)
styles/CAPTIONS.md        caption modes and rules (from the Dan Martell breakdown); built by the `captions` template
styles/REFERENCES.md      breakdowns of other creators' videos: techniques to reuse (add new ones here)
styles/AI-BROLL.md        generated B-roll clips (kie.ai): when to use them, the 4-block prompt, rules (no real people)
styles/ANIMATIONS.md      ready-made effects (search bar, counter, article highlight, map route, motion background, glow pill, pastel grade): when to use each
studio/anim.mjs           makes an effect from assets/animations/<name>/ in 9x16 or 16x9 with brand colours
studio/fx.mjs             footage effects on any time range: lag (FPS lag), wide, fisheye, shade, flash, negative text
studio/lut.mjs            colour grades (.cube in assets/luts/); apply to footage before graphics
assets/sfx/               the named sound files; assets/sound-effects/ is the full Motionix pack
assets/sfx-library/       SFX Library v0.9.0-beta: 1548 cleaned, indexed sounds (1435 CC0); use by ID as a cue (skill sfx-library)
.claude/skills/           all skills from every kit, merged (see "Where each skill came from")
lib/ presets/ scripts/ workflows/   root editing pipeline (was "Claude Editor")
styles/engines.json       render engines switch: HyperFrames always, Remotion optional (off by default)
engines/split-screen/     Remotion kit (was "Split-Screen-Editor"): runs only if styles/engines.json says so; otherwise reference for editorial rules and graphics ideas
engines/content-os/       Content OS (the one copy; open this folder to work in it directly):
                          research, scripts (written per format, with cue tags), voice, brand, carousels, descriptions, Notion,
                          repurposing (one long-form into a week of clips, reel ideas and captions), content calendar
engines/faceless/         faceless-sprite style: voiceover in, pixel-art Bryan + motion-graphic browser cards out (its own HyperFrames engine;
                          its CLAUDE.md is the flow, engine/docs/pages.md the 14 B-roll page kinds). Sprite in sprite/, renders in videos/
engines/earshot/          earshot (MIT): 252 sound effects made in code, rendered to an exact length / apex / pitch
                          (via `node studio/sfx.mjs gen`); its listening tools are an opt-in install
engines/video-fx/         Claude Video FX: 17 Remotion effects for talking heads with a person cut-out (skills video-fx, fx-*)
engines/brand-motion/     brand-motion style: logo animation + kinetic type + original score (Python + Skia; skill brand-motion-studio)
studio/words-convert.mjs  a job's WhisperX words in the shape each add-on kit reads (Remotion captions, segments, brand-motion)
studio/sheet.mjs          Video Breakdown Sheet: check a job's scene list, scene thumbnails, join per-scene renders, print it for Claude
engines/legacy-editor/    older editor; only its clipper, CapCut, Premiere, Resolve, thumbnail and music skills are used
docs/editor-pipeline.md   the root pipeline's full instructions and lab notes (was Claude Editor's CLAUDE.md)
docs/APP-HANDOFF.md       the user's set workflow for cutting onto Premiere / Resolve / Final Cut / CapCut (the rough-cut-only tool)
raw/  transcript/  vendor/  that workflow's raw clip, words.json + cuts.json, and cloned app connectors
scripts/transcribe.sh     WhisperX large-v3 word timings on the GPU (CUDA float16, CPU int8 fallback); never re-transcribes
  (YouTube downloads: use `uvx --from "yt-dlp[default]" yt-dlp`; the winget copy is too old and gets 403s)
```
