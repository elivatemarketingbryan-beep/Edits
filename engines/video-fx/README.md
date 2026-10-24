# Claude Video FX

17 short-form video effects as Claude Code skills, rendered locally with Remotion.
**New here? Open `START_HERE.md`.**

```
Claude-Video-FX/
├── START_HERE.md            install + first steps
├── Install (Mac).command    double-click installer (macOS)
├── Install (Windows).bat    double-click installer (Windows)
├── install.mjs              the installer itself (node install.mjs)
├── skills/                  18 Claude Code skills (video-fx hub + fx-<effect>), copied to ~/.claude/skills
├── engine/                  the shared render engine
│   ├── fx.mjs               CLI: list · info · doctor · words · render · still · sheet · splice
│   ├── effects/*.json       each effect's options and defaults
│   ├── src/effects/*.tsx    each effect's Remotion component
│   ├── src/lib/             shared layers: captions, cut-out, timing, fonts
│   └── scripts/             transcription (faster-whisper) and person matting (RVM)
├── examples/                a preview render + config for every effect, plus Showreel.mp4
├── docs/                    effect catalog, how it works, troubleshooting, Skool module plan
├── tools/                   (maintainers) build-skills, render-examples, render-showreel, package
└── skill-src/               (maintainers) the effect-specific half of each skill
```

Engine CLI quick reference (from the `engine` folder):

```bash
node fx.mjs list
node fx.mjs words "~/Movies/reel.mp4"
node fx.mjs render cover-story "~/Movies/reel.mp4" --start 0 --end 6 --config my-config.json --out "~/Movies/reel - Cover Story.mp4"
node fx.mjs sheet "~/Movies/reel - Cover Story.mp4"
```
