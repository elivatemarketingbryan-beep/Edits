# Video Studio

An AI video editing studio run by Claude Code. Drop in a video (or a voiceover), get the three
formats that fit it best, pick one, leave timestamped notes on the preview, and approve the final.
Content OS, inside this repo, handles the front half: research, hooks, scripts written for a
specific format with cue tags, the Notion pipeline, repurposing and posting.

Built for **Elivate Marketing** (purple on black, `@elivatemarketing.bryan`). Finishing app: CapCut.

## Quick start

1. Double-click **`Start Studio.cmd`**. The studio opens at http://localhost:4747.
2. Drop a video, a voiceover (mp3, wav, m4a) or paste a YouTube link.
3. In Claude Code, opened on this folder, say **`run my studio jobs`**.
4. Pick one of the three formats, review the preview with notes, approve.

Full walkthrough: [START_HERE.md](START_HERE.md). Claude's operating manual: [CLAUDE.md](CLAUDE.md).

## The pipeline

```
Content OS (engines/content-os)                Video Studio (studio/, styles/, engines/)
research → hooks → scriptwriter ──Notion──►  drop clip → match to script → top 3 formats
(picks the format, writes cue tags)           → pick → edit → review notes → final → CapCut
                    ▲                                           │
 repurposing, calendar, captions, auto-poster ◄────────────────┘
```

- **Scripts know their format.** The scriptwriter picks the edit style, writes in that style's
  shape (8 shapes, [styles/SCRIPT-SHAPES.md](styles/SCRIPT-SHAPES.md)) and tags lines with cues
  like `[HOOK]`, `[TIER: S]`, `[BROLL: ...]`. When the filmed clip is dropped in, Video Studio
  finds its Notion script (`studio/script-cues.mjs`), times every tag to the spoken words and
  builds the graphics there. Notion moves Scripting → Filming → Editing → Review → Ready.
- **One transcript per video.** WhisperX large-v3 on the GPU; every add-on reads it through
  `studio/words-convert.mjs` instead of transcribing again.

## What's inside

**35 styles** (28 short-form 9:16, including 3 that need no camera, and 7 long-form 16:9) plus **4
tools**, all in [styles/catalog.json](styles/catalog.json) with their look in
[styles/STYLE-GUIDE.md](styles/STYLE-GUIDE.md). The studio's gallery shows a looping preview of each.

| Engine | Folder | What it makes |
|---|---|---|
| HyperFrames (default) | `studio/`, `assets/animations/`, `assets/formats/` | most styles: talking-head reels, explainers, rankings, long-form, captions, graphics |
| Faceless sprite | `engines/faceless/` | voiceover in, a pixel-art presenter with motion-graphic browser cards out |
| Brand motion | `engines/brand-motion/` | logo animation, kinetic type and an original score synced to every hit (Python + Skia) |
| Motion promo | skill `motion-promo` | voiceover in, 60 fps motion-graphic ad with real site captures (Remotion) |
| Split-screen | `engines/split-screen/` | Remotion kit; off by default, reference for panel layouts |
| Legacy editor | `engines/legacy-editor/` | clipper (long-form to shorts), CapCut, Premiere and Resolve handoffs |
| Content OS | `engines/content-os/` | research, hooks, scripts, voice, Notion, repurposing, calendar, carousels, posting |

**Ready-made effects** usable in any style:
- HyperFrames templates in `assets/animations/` ([styles/ANIMATIONS.md](styles/ANIMATIONS.md)):
  typing search bar, counters, article highlight, map routes, motion backgrounds, glow pill,
  soft-pastel grade.
- Remotion add-ons: `high-quality-captions` (word-by-word, serif + purple-gradient punch words),
  `glow-intro-caption` (two-line hook title with a pull-back camera move), `headline-highlight`
  (an article screenshot with a marker drawn over the key words), `github-callout` (a repo's README
  cut in when it's mentioned).

**Sound:** 74 Motionix sounds with placement rules ([styles/SOUND-RULES.md](styles/SOUND-RULES.md)),
peak-aligned to cuts and graphics by `studio/sfx.mjs`.

**References:** frame-by-frame breakdowns of top creators' edits, captions and motion in
`styles/REFERENCES.md` and `rtf-analyses/`.

## Folder map

| Folder | What's in it |
|---|---|
| `studio/` | the local web app (drop, formats, gallery, review page) and its scripts |
| `styles/` | catalog, style guide, script shapes, sound rules, animations, brand colours |
| `assets/` | animation and format templates, sounds, LUTs, logos |
| `engines/` | the kits each style runs on (table above) |
| `.claude/skills/` | every skill Claude uses, including pointers to Content OS skills |
| `jobs/`, `projects/` | per-video work (not committed) |
| `docs/` | pipeline notes, the formats mockup page, preview videos |

## Requirements

Windows 11 with Git Bash, Node 22+, FFmpeg, `uv` (Python), an NVIDIA GPU for WhisperX (CPU works,
slower), and Claude Code (desktop app or CLI). One-time installs per engine: `npm --prefix
engines/faceless/engine run setup`, the brand-motion Python environment (see its skill), and
Tesseract for headline-highlight. `node studio/check.mjs` checks the whole folder and lists
anything missing.

## Credits and licences

Kits merged in here come from other creators: HyperFrames (HeyGen, Apache-2.0), Remotion (free for
individuals and companies of up to 3 people), the Emil Kowalski and Apple design skills, the
Content Manager plugin (Kyle Herbel), the AI Faceless Content engine, Brand Motion Studio and the
caption, intro, headline, GitHub-callout and motion-promo skills, the Motionix sound pack, and
fonts under the SIL Open Font License. Check each kit's terms before making this repo public.
