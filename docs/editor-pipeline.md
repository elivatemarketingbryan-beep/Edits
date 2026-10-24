# Claude Editor — content pipeline

This is a content system, not a code repo: raw filmed footage goes in,
a finished exported cut comes out. Claude is the editor. Every step
runs through a skill in `.claude/skills/`.

**Machine:** macOS or WSL2 Ubuntu. Run `./check-setup.sh` first — it's
report-only (never installs anything) and tells you exactly what's
missing and the right fix command for your OS.

**Finish line:** drop a raw clip into intake and say "rough cut this."
That runs transcription (the one slow step), the cut list, the
canonical transcript, and hands off to an editing app as trimmable edit
points — no flattened render, no hand-holding.

## Pipeline

| # | Step | Skill | Produces |
|---|------|-------|----------|
| 1 | Intake | `/intake` | `projects/<job>/raw/<file>` (copied, never moved) |
| 2 | Rough cut | `/rough-cut` | `transcript/words.json`, `cutlist.json`, `outputs/.transcript.json` |
| — | Editing-app handoff (default finish after step 2) | `/editing-handoff` | `outputs/<job>.fcpxml` + cut sheet — trimmable edit points, not a flattened render |
| — | Flattened rough cut (only if headed for a full render) | `/rough-cut`'s `assemble_rough_cut.sh` | `outputs/.roughcut.mp4` |
| 3 | Graphics plan | `/graphics-plan` | `hf-graphics/` beat sheet + composition, `outputs/<job>-graphics.mp4` |
| 4 | Second pass | `/second-pass` | targeted part re-renders, logged in `hf-graphics/PROJECT.md` |
| 5 | Captions (short-form only) | `/captions` | `outputs/<job>-captioned.mp4` |
| 6 | Music (optional) | `/music` | `outputs/<job>-music.mp4` |
| 7 | Export | `/export` | `outputs/<job>.final.mp4` + copy in `~/Downloads` |

Steps 3-7 only run when a job needs a full graphics render. Most jobs
stop at the editing-app handoff — time-to-timeline is the metric.

## Folder map

```
check-setup.sh              report-only dependency check (OS-aware)
skills-lock.json            HyperFrames skill pack provenance + SKILL.md hashes — CLI-managed, never hand-edit
pyproject.toml              uv-managed Python deps (whisperx, numpy, soundfile, pillow)
CLAUDE.md                   this file

lib/                        shared engine code, used by every skill — the non-negotiable locks live here
  common.sh                   OS detection, encoder pick (the ONE platform branch), logging, path helpers
  audio_boundaries.py         RMS-envelope boundary measurement (never trust transcript timestamps)
  filler_detect.py            filler-word + dead-air candidate detection from transcript timestamps
  cutlist.py                  cut list data model, boundary refinement + frame-snap, output-timeline offsets
  transcript.py               corrections + canonical transcript remap
  build_filtergraph.py        one-shot lossless A/V splice with equal-power audio crossfades
  polish_audio.sh             the ONE audio polish pass (+10dB -> -6dBFS limiter -> AAC 256k)
  audio_qa.py                 mandatory post-splice QA (clicks, gaps, limiter pressure)
  templates/                  finalize.sh / prune.sh / PROJECT.md templates, stamped per project

scripts/                    repo-wide utilities (not tied to one pipeline step)
  new-project.sh               scaffold projects/<job>/
  update-hyperframes-skills.sh the ONLY sanctioned way to update .claude/skills' HyperFrames pack

.claude/skills/             every pipeline step, plus the vendored HyperFrames skill pack
  intake/  rough-cut/  editing-handoff/  graphics-plan/  second-pass/  captions/  music/  export/
  hyperframes*, media-use, embedded-captions, ...   (vendored — see skills-lock.json)

workflows/                  format detail sheets (delivery/export mechanics) + utility scripts
presets/                    locked look specs — one markdown + build.py per format (design, not delivery)

projects/<job>/             one folder per video, job names are kebab-case content titles
  raw/                        the copied source file — never edited, never moved out
  audio/  assets/  broll/     supporting material
  transcript/
    words.json                 WhisperX output — written ONCE, never touched again
    corrections.json           spelling fixes (single whole-word swaps, text only)
  cutlist.json                the cut list — source of truth for every downstream step
  hf-graphics/
    PROJECT.md                  resume doc: format, beat sheet, build log, second-pass notes, status
    index.html                  thin shared-timeline orchestrator
    compositions/part-NN.html   one HyperFrames sub-composition per beat
    render-part.sh / render-final.sh   version-pinned render scripts
  captions/                    embedded-captions bridge project (source.mp4 + normalized transcript.json)
  outputs/
    .transcript.json             canonical transcript (hidden — derived, not a deliverable)
    .roughcut.mp4                flattened rough cut (hidden — intermediate)
    <job>-graphics.mp4, <job>-captioned.mp4, <job>-music.mp4   pipeline renders
    <job>.fcpxml, <job>-cutsheet.txt   editing-app handoff
    <job>.final.mp4               the deliverable
  finalize.sh / prune.sh       generated per project from lib/templates/
```

## Graphics engine: HyperFrames

Graphics and captions render through HyperFrames, an npm package, not a
cloned repo. `.claude/skills/` contains the installed HyperFrames skill
pack (copied in via the CLI, not written by hand) plus this repo's own
pipeline skills.

- **Never hand-edit** a vendored HyperFrames skill. Update only via
  `scripts/update-hyperframes-skills.sh <version>` — it reinstalls
  through the CLI, shows a diff, and asks before touching anything.
- **Every job's render script pins the HyperFrames version literally**
  (baked in at scaffold time by `graphics-plan`'s `scaffold-graphics.sh`).
  `npx` without a pin floats to latest — past releases have broken the
  composition contract mid-job (0.7.42 made `data-start`,
  `data-composition-id`, `data-width`, `data-height` mandatory on the
  root comp; 0.7.67 shipped a change reverted in 0.7.68). Move a job's
  pin deliberately: update the repo-wide pack first, re-render and
  review **one part** of **one job** on the new version, then move that
  job's pin. Never bump every job at once.
- Repo-wide pin currently: see `skills-lock.json`'s `hyperframesVersion`.
  Started at 0.7.68 per the original build.
- `check-setup.sh` verifies every vendored `SKILL.md`'s sha256 against
  `skills-lock.json` and flags anything hand-edited or missing.

## Lab Notes

Non-negotiable locks, learned the hard way. One line each. Add to this
list whenever something non-obvious gets learned — don't let it live
only in a commit message or a chat transcript.

- Transcribe ONCE per video into `transcript/words.json`; every downstream consumer reads the derived `outputs/.transcript.json` instead, and nothing ever re-transcribes.
- Audio: cut A/V in one lossless filtergraph (`lib/build_filtergraph.py`), then polish the assembled track exactly once — static +10dB gain, then a -6dBFS limiter, then AAC 256k (`lib/polish_audio.sh`). Never dynamic loudnorm (it pumps), never per-segment audio FX (clicks). Any later re-encode must match or exceed 256k.
- Snap every cut boundary to the video frame grid so per-segment video and audio durations match exactly — otherwise concat pads gaps and the timeline drifts.
- Joints are short equal-power crossfades built from real continuing room tone borrowed from just outside the cut (never a fade to zero, which trades a click for an audible hole); the crossfade math is symmetric (half the crossfade duration from each side) so the audio timeline still totals the same length as the hard-cut video timeline.
- Measure cut boundaries against an RMS envelope of the raw audio — never trust transcript timestamps; word starts commonly run tens of ms late versus the real acoustic attack, and the search must be symmetric (closest edge of the right polarity within the window), not a fixed-direction scan, or it degenerates when the search window's own edge lands inside a loud region.
- Run the mandatory audio QA pass (`lib/audio_qa.py`) after every splice — joint clicks, silence gaps, limiter pressure — and print warnings; never silently pass.
- Transcript spelling fixes live upstream in one corrections file (`transcript/corrections.json`), applied only as the canonical transcript is written — single-token whole-word swaps, text never timings. `words.json` stays untouched forever.
- Nothing lives in `/tmp` — macOS clears it. Every script's working files live under the job folder (`.cache/`) or the repo (`.cache-*`), including this file's own `check-setup.sh` scratch.
- Long graphics render as short seamless parts from one shared timeline (`hf-graphics/index.html` + `compositions/part-NN.html` sub-compositions) so a tweak re-renders one part, not the whole video.
- Short-form safe zones: no key visuals in the top 200px or bottom 300px of 1080x1920. Face, captions, and graphics stay inside y 200–1620 — check the rendered output, not just the composition source, since an animation can drift a graphic into the excluded band.
- On the editing-app path, skip the flattened render entirely — produce the cut list and canonical transcript in seconds and hand off. Time-to-timeline is the metric; transcription is the only slow step allowed in the default path.
- A dead-air gap immediately following a filler word must still be detected — a single cursor-based pass that `continue`s on filler words will silently swallow the following gap into the next kept span (found via the synthetic test in this build; fixed by computing all drop regions independently before inverting into kept spans).
- `audio_qa.py` must decode through ffmpeg before handing samples to `soundfile` — libsndfile cannot read AAC-in-MP4 at all, and the QA pass always runs against the polished `.mp4`/`.mov`, never a raw WAV. Caught by running the real assembly path end-to-end against actual ffmpeg output, not just unit-testing the numpy logic.
- ffmpeg's native `aac` encoder is content-adaptive, not true CBR — `-b:a 256k` is the requested target, but a quiet or low-complexity passage can measure well under it afterward (confirmed directly: a pure test tone measured ~142k despite `-b:a 256k`; `-minrate`/`-maxrate`/`-bufsize` do not fix this for this encoder). Treat a post-encode bitrate check as approximate, not a hard gate — see `workflows/probe-format.sh`.
- Job names are kebab-case titles about the content, never the camera filename.
- This authoring session ran on native Windows (Git Bash/MINGW), not WSL2 or macOS — Python/WhisperX could not be exercised end-to-end here. The core cut-boundary, transcript-remap, and audio-QA logic was validated against synthetic audio via `uv run --with numpy --with soundfile` (bypassing the heavy WhisperX/torch dependency); run the real pipeline once on the target machine and treat the first real job as the actual integration test.
- In a HyperFrames composition, never use `z-index: -1` on a `::before`/`::after` glow/halo meant to sit behind its own element's background — per the CSS stacking spec, an element's own background paints at step 1 of its stacking context, and negative-z-index children paint at step 2 (ON TOP of that background, not under it), so the glow bleeds through no matter how opaque the fill is made. Use an earlier DOM sibling instead (absolutely positioned, no z-index needed) — default paint order already puts it behind. Caught building a glowing-glass-card recreation; verify by screenshotting the settled state, not just eyeballing the composition source.
- Never use GSAP `repeat: -1` (infinite) anywhere in a HyperFrames composition, even nested inside a short, bounded child tween — the render engine's lint explicitly rejects it (`gsap_infinite_repeat`) because infinite repeats break the deterministic frame-seeking the capture engine relies on. This holds even when the parent timeline itself has a fixed, finite duration; nesting doesn't make it safe. For any looping/drift effect, compute a finite `repeat` count from the tween's actual on-screen window duration divided by one cycle's duration (plus a small buffer), e.g. `Math.ceil((windowEnd - windowStart) / cycleDuration) + 2`. Caught re-rendering a floating-card drift animation.
