---
name: repurposing
description: Turns one long-form asset (a finished Video Studio long-form, a YouTube URL, a podcast/webinar transcript, or a long post) into a week of distinct pieces across platforms (clips, reel scripts, carousels, captions, YouTube community posts), each a different idea, each citing the exact line it came from. Triggers: repurpose this, chop this up, make content out of this, turn this video into a week of posts, I need this week's posts, /repurposing.
---

> **Video Studio:** this skill lives in `engines/content-os` (Content OS, inside this repo). Before running anything from it, `cd engines/content-os` and use that folder's copy (`.claude/skills/repurposing/`), which has its scripts and reference files. Every path below is relative to that folder. This copy only lets Claude find the skill from the Video Studio folder.

# Repurposing one asset into a week

The mistake is writing the same post five times at five lengths. An audience that follows Bryan in
two places sees it instantly. Real repurposing: **one asset holds six to ten distinct ideas.** Find
them, decide which one belongs on which platform, and write each as if it were the only thing being
written that day.

Read first, every time: `voice-dna.md` (how Bryan talks), `platforms.md` (where he posts and the
rules per platform), `backbone/offer.md` (the one CTA), `calendar.md` (what already ran or is planned).

## Step 1 — Get the asset and its transcript (never re-transcribe)

| Asset | Transcript to use |
|---|---|
| A Video Studio job (long-form he finished) | `../../projects/<id>/transcript/words.json` (word timings). Resolve the job from the Notion page's **Studio job** field, else the newest folder in `../../projects/`. |
| A YouTube / IG URL | `transcribe-url` skill → `transcripts/url/` |
| Pasted text or a doc | Write it to `transcripts/local/YYYY-MM-DD-<topic>.md` first |
| A video file with no transcript | Say so; drop it in Video Studio (it transcribes once with WhisperX) or run `transcribe-url` on its link. Never guess what was said. |

## Step 2 — Mine it

Over ~5,000 words (about 30+ minutes): hand the mining to the `asset-miner` subagent
(`.claude/agents/asset-miner.md`; if it isn't registered in this session, spawn a general-purpose
subagent with that file's instructions as the prompt) so the main context doesn't fill with filler.

Pull out every one of these:

| What to look for | Why it repurposes well |
|---|---|
| A strong opinion stated plainly | A reel or caption on its own |
| A story with a beginning and a turn | Best-performing format everywhere |
| A number with context | Hooks, on-screen text, carousel slide 1 |
| A step-by-step explanation | Carousel or a Tips-breakdown reel |
| A mistake the audience is making | Highest-engagement angle there is |
| A short quotable line (under 15 words) | Caption-led reel, quote carousel, community post |
| A question answered well | A piece that opens with the question verbatim |

Write them to `drafts/YYYY-MM-DD/00-mined.md`, each with its timestamp (from `words.json` or the
transcript) and the verbatim quote. Every piece this week points back to a line in this file.

## Step 3 — Assign ideas to slots

Read `platforms.md` for where Bryan posts and how often, and `calendar.md` for open slots. Match
ideas to platforms instead of spreading one idea everywhere:

- **Moments that already work as video** (self-contained, hook + payoff on camera) → **clips**:
  list them for Video Studio's `clipper` skill ("clip this up") with in/out times. Don't write them.
- **The strongest opinion / the story** → a **reel script**: hand the idea to `scriptwriter` (it
  picks the Video Studio format and writes in his voice with cue tags). Don't write scripts here.
- **The step-by-step / the list** → **carousel**: brief for `carousel-generator`.
- **The number** → hook for a reel or carousel slide 1.
- **The quotable line** → IG caption, YouTube community post, or a quote carousel.

Rule: **no idea appears on two platforms in the same week** unless the framing is genuinely
different. Short on ideas? Make fewer pieces. Four good ones beat seven recycled.

## Step 4 — Write the text pieces

Only captions, community posts, carousel briefs and similar text are written here (scripts go to
`scriptwriter`, clips to `clipper`, YouTube descriptions to `yt-description`). For each: apply
`platform-formats` → write five hook options with `reference/text-hooks.md` → write the body in
Bryan's voice (`voice-dna.md`) → cut 20% → tie to the CTA where `platforms.md` says a CTA belongs.

One piece per file: `drafts/YYYY-MM-DD/<platform>-<slug>.md`, ending with the source line:

```markdown
---
Source: projects/<id>/transcript/words.json — 14:20, "we were busiest the month we almost lost the crew"
```

Anything needed and not found gets an inline `[NEED: ...]` marker. Never fill the gap with a
plausible number, client name or result.

## Step 5 — Calendar and report

Add every piece (text drafts, clips handed to Video Studio, scripts handed to scriptwriter) to
`calendar.md` as `drafted` (or `planned` for the hand-offs) with its file or Notion page. Then report
short, not the full drafts:

> The long-form gave me 8 ideas. 3 clips for Video Studio (02:10, 11:45, 31:02), 1 reel idea to
> scriptwriter (the 5am truck story), 1 carousel brief, 2 captions in `drafts/2026-10-26/`.
> Two `[NEED:]` markers, both want the exact close rate from the Smith job.

## Failure modes

- **The mush draft.** Every piece says "marketing matters." Name the specific idea at the top of
  each draft; if two drafts share an idea line, kill one.
- **Transcript voice.** Spoken words written down read badly. Rewrite the thought; don't transcribe it.
- **Inventing the detail that makes it land.** Mark `[NEED:]` instead.
- **Ignoring what already ran.** Check `calendar.md` (Published) and Notion `Posted` pages first.
- **Over-producing.** Match the cadence in `platforms.md`.

Adapted from the content-manager plugin by Kyle Herbel.
