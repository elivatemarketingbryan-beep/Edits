---
name: nextphase-persa-shorts
description: >-
  Edit a vertical 9:16 talking-head SHORT (Reels / TikTok / Shorts) in the PERSA style — the camera is
  the frame, one-word captions hard-cut on a single fixed line, big display words with the creator's
  head matted back in front of them, real product UIs and screen recordings owning the frame while the
  creator drops into a rounded camera card with the head breaking its edge, and an optional warm film
  grade. Personalised per creator (colours, look, fonts, niche, research depth, token budget) from
  brand/brand.json. Renders with HyperFrames (free, local, HTML→MP4). Use whenever the user drops a
  recording and asks to edit a short / reel / TikTok in the persa style, or asks to set up, re-theme
  or preview this kit.
---

## Video Studio (read first; overrides the rest of this file)

This skill is installed in Video Studio (`Edits/.claude/skills/`), from the NextPhase / creator packs
Bryan downloaded on 2026-10-31. Video Studio's `CLAUDE.md` wins wherever the two disagree.

- **Start from the studio job, never an intake.** Jobs come from the studio page (`jobs/<id>/job.json`).
  This skill runs when the job's `style` is `film-grade-short`. Never ask "short or long?" or "which style?":
  the page already asked. (`nextphase-studio`'s intake is not used here.)
- **One transcript:** `projects/<id>/transcript/words.json` (WhisperX). Don't run this skill's own transcriber.
- **Brand:** `styles/brand.json` (purple `#8B5CF6` / `#C4B5FD` / `#4C1D95`, Inter + Playfair Display)
  replaces this skill's default colours. Generate its theme/tokens from it.
- **Show the motion graphics before rendering (Bryan's rule):** design first, show stills of each graphic over
  the real frame in batches (the `design` → `graphics` stages, `graphics.json`), wait for approval, then render.
- **Sounds and music:** the studio's library (`styles/sfx.json`, `node studio/sfx.mjs place`) on the locked
  picture; music only from tracks Bryan owns or licensed.
- **Windows Git Bash, not macOS/WSL:** `python` not `python3`; a venv's Python is `Scripts/python.exe`;
  long paths fail, so map a short drive (`cmd //c "subst R: <winpath>"`). Run this skill's setup/doctor script
  only the first time the style is used, and ask before any download over ~500 MB.
- **Where work goes:** editing work in `projects/<id>/`, deliverables in `jobs/<id>/`.
- Its setup asks 9 brand questions: answer them from `styles/brand.json` and Content OS `backbone/offer.md` instead of asking Bryan again (accent purple, dark look, Inter/Playfair feel, research 1, balanced tokens, sounds on, cut-out quick).


# Persa Shorts — the editing skill (9:16)

You are the editor for ONE vertical short at a time. The creator's take is the whole frame; you
composite everything INTO it: one caption line, a few big display words, real product surfaces.
The style is measured (reference/STYLE.md) and the brand is theirs (brand/brand.json).

`<skill>` below means this folder — normally `~/.claude/skills/nextphase-persa-shorts`.
Run Python scripts through `<skill>/scripts/py` (it picks the kit's private env if doctor made one).
Videos live in `videos_dir` from brand.json (default `~/persa-shorts/<slug>/`), one folder each.

---

## STEP 0 · The brand — every session, before anything else

Read `<skill>/brand/brand.json` and `<skill>/brand/brand.md`.

**If `"setup_complete"` is false**, do not edit anything yet. Ask these as ONE short numbered list,
then wait for the answers. Offer a sensible default for each so "defaults" is a valid reply.

1. **Who & what** — your niche, who watches (what they already know, what they want), your
   @handle, and the word people should comment to get your thing (the CTA keyword).
2. **Dark or bright look?** dark = white captions, dark glass labels · bright = dark captions with
   a light halo, light labels. (The footage is the frame either way; pick the one that reads on
   what you usually wear and the room you film in.)
3. **Accent colours** — orange, green, blue, purple, pink, red, yellow — or up to 3 exact hex
   brand colours. Persa uses three accents with one job each: (a) the filled payoff word,
   (b) the hollow "pain" word, (c) a claim typed into an app's empty space.
4. **Font feel** — poster (condensed, the measured default) · clean (modern heavy sans) ·
   editorial (heavy serif) · rounded (friendly geometric).
5. **Film grade?** warm film look · clean natural (no filter at all).
6. **How much research should I do?** 0 = you bring every file · 1 = light: I verify every number
   and claim and capture real screenshots of each site/product you name · 2 = deep: also find real
   examples, docs and clips, and flag any rights issues.
7. **Token budget** — lean (cheapest, fewer previews) · balanced · max (best quality, most tokens).
8. **Sound** — sound effects on/off? music on/off (if on: the path to a track you own/licensed)?
9. **Head-over-words cut-out** — off · quick (built in, ~170 MB model) · best (cleanest hair
   edge, ~1 GB one-time install).

Then:
```bash
<skill>/scripts/py <skill>/scripts/make-tokens.py \
  --set creator.niche="..." --set creator.audience="..." --set creator.handle=@... \
  --set creator.cta_keyword=... --set look=dark --set accent=green \
  --set font_feel=poster --set grade=film --set research=1 --set budget=balanced \
  --set sfx=true --set music=false --set cutout=quick --set setup_complete=true
#   exact brand colours instead of a named accent:  --set brand_colors="#FF5B14,#FFC23D,#7FE3FF"
```
It writes brand.json AND regenerates `assets/tokens.css`, then prints a contrast table. **If it
says ADJUSTED, tell the creator which colour was nudged and why** (an accent that would vanish on
the frame). Rewrite `brand/brand.md` in plain words from the answers, including the "what to SHOW
for what they SAY" table filled with 5–8 examples from THEIR niche. Then render the theme preview,
look at its contact sheet yourself, and open it for them:
```bash
<skill>/scripts/py <skill>/scripts/make-preview.py --open
```
To change anything later (new colour, bright look, research level): `make-tokens.py --set …`,
then `make-preview.py --open` again. Existing video folders keep their copy of tokens.css until
`new-video.py <slug> --force` refreshes them.

---

## The token budget — obey brand.json "budget"

| | **lean** | **balanced** (default) | **max** |
|---|---|---|---|
| read before building | this file + only the reference files a step names | this file + STYLE, TYPE-ROLES, BLACKLIST, HOW-WE-EDIT | every file in reference/ |
| subagents | none | none, unless sourcing 4+ beats | parallel subagents for sourcing and fact-checks |
| beat-map approval | a 1-line-per-beat table in chat | the table, plus PLAN.md | the table + `source-scout` page + frames |
| preview renders | none — one draft, sampled, then the final | one draft, sampled, fix, final | a draft per major change, full contact sheets |
| final render | `-q draft` unless asked | `-q delivery` | `-q delivery` |
| gates | `build.py` warnings + `hyperframes check` | + `check-density.py` + BLACKLIST walk | + measure every sound cue + derive the grade |
| research cap | level 1 max (verify claims, no clip hunting) | as set | as set |
| replies | terse | normal | explain choices |

In every mode: never skip `hyperframes check`, never skip sampling the rendered mp4, never publish.

## Research levels — obey brand.json "research"

- **0 · I bring everything.** No web. Ask the creator for each file the beat map needs (screen
  recordings, logos, pages). Where something is missing, say so and use a face beat — never invent
  or fake a surface. Still flag claims that look wrong.
- **1 · Light.** Verify every number, price, date and claim in the script against a primary source
  (and tell the creator what you checked). Capture real 9:16 page shots of every site/product they
  name (`shoot-page-9x16.py`, repo cards via curl). Ask them for screen recordings of their own
  product — do not hunt clips.
- **2 · Deep.** Level 1, plus: find real examples, docs, posts and clips for the beats
  (reference/SOURCING.md priority order), open them for approval with `source-scout.py`, flag
  rights for every third-party clip, and propose a better beat when you find a stronger receipt.

---

## The order of work — do not reorder

```
0  BRAND         STEP 0 above. Set up? If not, the questions first.
1  PRECONDITION  Is there a real product / app / site / process worth ~15s of screen time?
                 If not, say so in ONE line and offer: record a screen capture, or a face-led cut.
2  INGEST        new-video.py <slug> --recording <file>   (normalises to 1080x1920 30fps)
                 log/HLG footage? camera-decode.py first. Landscape take? it warns — tell them.
3  TRANSCRIBE    transcribe.py <video>   (word onsets + the dropped-speech gap check)
4  FACT-CHECK    to the research level. Before the beat map — the picture can fix a loose claim.
5  SOURCE        find the real media FIRST and get a yes per beat (SOURCING.md)
6  CUTOUT/GRADE  cutout.py <video> (if on) · make-grade-filter.py --derive (if film)
7  BEAT MAP      beats.json from the transcript; show the beat table for approval (budget sets how)
8  BUILD+GATES   python3 build.py · hyperframes check · check-density.py · BLACKLIST walk
9  RENDER+LOOK   hyperframes render → contact-sheet.py at beat middles → READ the image
10 SOUND         sfx-cues.txt on the locked render (if sfx on) — thin, see SOUND.md
11 FINISH        finish.sh <video> → out/<slug>-FINAL.mp4
12 REVIEW        open it for the creator. Report what was checked. PUBLISH NOTHING.
```

### Commands (from the video folder)
```bash
S=~/.claude/skills/nextphase-persa-shorts
$S/scripts/py $S/scripts/new-video.py my-short --recording ~/Desktop/take.mov
cd ~/persa-shorts/my-short
$S/scripts/py $S/scripts/transcribe.py .
$S/scripts/py $S/scripts/cutout.py .                              # if cut-out on
$S/scripts/py $S/scripts/make-grade-filter.py --derive assets/recording.mp4 --out grade-persa.svg   # if film
#   write beats.json  (copy the shape from $S/template/beats.example.json)
python3 build.py && npx --yes hyperframes check .
$S/scripts/py $S/scripts/check-density.py .
npx --yes hyperframes render . -o out/visual.mp4 -q draft
$S/scripts/py $S/scripts/contact-sheet.py out/visual.mp4 --at 1.0,4.2,9.8,20.5,33.0
bash $S/scripts/finish.sh .
```

---

## The rules that actually get cuts rejected

1. **A real UI owns the WHOLE frame** (1080×1920, `cover`) with the creator in the card on top —
   never a screenshot floating in a box over their face.
2. **One caption line at 72.9%, one word, hard cut, every beat.** Never move it.
3. **Real media, not typeset text.** A product is shown as its real UI, on the word that names it.
   A number is an annotation on a picture of the thing, never the whole picture.
4. **No small text, no emojis, no webcam bubbles, no strangers as filler.**
5. **Never call a cut done from a snapshot.** Sample the rendered mp4 and look at the image.

Plus the two that keep a build honest: **never hardcode a colour or font** (tokens.css only, which
make-tokens.py generates), and **nothing publishes** without the creator's explicit go.

Full list: `reference/BLACKLIST.md`.

---

## Files in this skill
```
SKILL.md                this file
brand/brand.json        the creator's answers — the switchboard every script reads
brand/brand.md          the same, in words, plus their niche's "show for say" table
assets/tokens.css       GENERATED from brand.json by make-tokens.py — colours, fonts, the look
components/
  persa-roles.css       every layer and display role, tokens only, with the paint order
  grade-persa.svg       the default film grade (derive a per-take one)
template/
  build.py              the engine: beats.json -> index.html
  beats.example.json    every beat kind and overlay, annotated
  hyperframes.json
reference/
  STYLE.md              what persa is, measured: precondition, treatments, card, caption, look
  TYPE-ROLES.md         the 13 display treatments and how to call each one
  BLACKLIST.md          what never goes in + the test before you render
  HOW-WE-EDIT.md        the build contract, timing, gates, render sampling
  SOURCING.md           finding and judging real media; rights
  SOUND.md              the thin pass, banned cues, measuring levels, the optional bed
  CUTOUT.md             the matte: quick vs best, the card pop-out, the occluder
  GRADE.md              the optional film curve
scripts/
  doctor.sh             check / set up the tools (--fix, --pages)      py   the Python launcher
  make-tokens.py        brand.json -> tokens.css (+ contrast table)    make-preview.py  theme preview
  new-video.py          scaffold + normalise a take                    transcribe.py    words + gap check
  cutout.py             matte, measure, bake vignette                  rvm-matte.py · setup-cutout-best.sh
  make-grade-filter.py  derive the film grade                          camera-decode.py log/HLG -> 709
  source-scout.py       candidates page for approval                   fetch-source.py  clips + contact sheet
  shoot-page-9x16.py    a real page as a 9:16 frame                    find-empty-space.py  where a claim fits
  check-density.py      the gap gate                                   contact-sheet.py LOOK at a render
  synth-sfx.py          the royalty-free sound palette                 mix-sfx.sh · lay-bed.sh · finish.sh
sfx/                    generated by synth-sfx.py (or point SFX_DIR at your own pack)
```
