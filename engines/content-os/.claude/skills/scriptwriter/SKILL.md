---
name: scriptwriter
description: "Turns a pick (from ideation/research) or a raw idea into a filmable beat sheet in Notion, written in the creator's literal voice. The edge: retrieval few-shot from voice-corpus/ — every draft is written next to 2-3 verbatim transcripts of the creator's own top-performing videos in the same format, with voice-dna.md as guardrails and a voice-lint subagent pass before anything lands in Notion. Triggers: write a script, script this, script the pick, beat sheet, turn this into a script, scriptwriter, write the reel, script the video, write a video script."
---

# Scriptwriter — beat sheets that sound like the creator, not AI

The creator brings a pick (a winning competitor video from research/ideation, with URL) or a
raw idea. Claude turns it into a **beat sheet** — hook + numbered beats + CTA — staged
in Notion, ready to film.

The anti-slop mechanism is **imitation, not description**. LLMs write generic when
given style adjectives; they nail a voice when shown verbatim examples and told "write
the next one." So the draft is always written with 2-3 of the creator's own top transcripts
(same format, pulled from `voice-corpus/`) sitting in context, plus `voice-dna.md` as
the explicit rulebook, plus a fresh-context lint pass at the end.

## The Flow

```
1. GATHER  — pick or idea. Decide Short-form vs Long-form.
1b. FORMAT — pick the Video Studio edit style; it fixes the script shape + cue tags.
2. DECOMPOSE — (source video only) subagent transcribes + returns the format skeleton.
3. LOAD VOICE — voice-dna.md + find_voice.py few-shot pulls + knowledge/ context.
4. TWIST   — short conversation: what's the creator's angle on this format?
5. DRAFT   — hook first, then full-sentence beats, in their voice, in the shape, with cue tags.
6. LINT    — fresh-context voice-lint subagent. Fix what it flags.
7. DELIVER — show in chat, iterate, then create the Notion page (with Edit style + Script shape).
```

**Video Studio** (the editor) is the repo this folder sits in, two levels up
(`../..` from the Content OS folder). Two files there drive scripting:
`styles/catalog.json` (every edit style: id, name, aspect, `scriptShape`, `bestFor`) and
`styles/SCRIPT-SHAPES.md` (the 8 shapes, their beat structure and the cue tags). Read both
before Step 1b; never copy them into Content OS.

## Step 1 — Gather

Take what the creator gives:
- **A pick** from a research report or chat ideation: source URL + concept line. The
  source is the format model to twist.
- **Raw idea** — no source video; skip Step 2.

Decide **Short-form** (IG reel / Shorts) or **Long-form** (YouTube). This drives the
hook artifact: **short-form hook = the first 3-5 seconds the creator speaks on camera;
long-form hook = the video title.** Never substitute a caption or text overlay.

## Step 1b — Pick the format (edit style)

The script is written FOR the edit it will get, so the format comes before the draft.

1. Read Video Studio's `styles/catalog.json` and `styles/SCRIPT-SHAPES.md`.
2. Match the idea to the shape first ("Picking the shape" at the end of SCRIPT-SHAPES.md):
   teaching a process → Explainer, ranking/listing → List / ranking, comparing →
   Comparison, a personal moment → Story, a claim you can show → Proof, one punchy point →
   Caption-led, building trust with nothing to sell → Relatable thought, longer than ~3 min
   → Long form.
3. Within that shape, recommend ONE edit style (plus a one-line alternate) using each
   style's `bestFor` and `aspect`. Prefer `status: "ready"` styles when two fit equally.
   Respect what the creator films: clone-versus and dual-role-dialogue need two takes;
   cut-out styles need a clean background; depth-ui and yap-and-show need real screens or proof.
4. If the creator already named a format, use it. Say the pick in one line with why, e.g.
   "Ranking (List / ranking shape): you're scoring 6 lead sources, so each gets a tier card."

Short-form vs Long-form follows from the style's aspect (9:16 → Short-form, 16:9 → Long-form).

## Step 2 — Decompose the source (subagent — only when there's a source URL)

Transcription happens HERE, in the subagent. Spawn one subagent (Sonnet) that:

1. Transcribes the source with the sibling `transcribe-url` skill's script, from the
   repo root, with an explicit output dir (the script's default is cwd-relative):
   `bash .claude/skills/transcribe-url/scripts/transcribe-url.sh <url> transcripts/url`.
   Then reads the markdown it wrote (path is printed at the end of the run). That
   script owns the engine (YouTube captions when they exist, otherwise the shared
   faster-whisper venv it bootstraps itself). One path, no fallbacks: if it fails
   twice, stop and tell the creator.
2. Returns a **format skeleton**: beat-by-beat structure (what each beat does, not
   what it says), hook mechanic, pacing notes, CTA mechanic, runtime.
   - **Short-form source:** also return the full transcript (it's under a minute).
   - **Long-form source:** return the skeleton ONLY — never load a full long-form
     transcript into the orchestrator. Include the spoken intro (first ~150 words)
     as the sole verbatim excerpt.

## Step 3 — Load the voice

In this order (compiled layer before raw sources):

1. `voice-dna.md` — the rulebook: openers, fillers, closers, energy markers, anti-patterns.
2. `knowledge/creator-ai-positioning.md` (the positioning page, fixed filename),
   `knowledge/winning-hooks.md`, `knowledge/reusable-script-formats.md` — positioning
   + proven shapes. When present: `knowledge/` starts empty until `knowledge-compile`
   runs, so skip these on a fresh install and lean on `backbone/` + the corpus.
3. **Few-shot pulls** — query the corpus, never read it wholesale. Commands run from
   the repo root (`python` on Windows):

```bash
python3 .claude/skills/scriptwriter/scripts/find_voice.py --list                              # see available tags
python3 .claude/skills/scriptwriter/scripts/find_voice.py --format giveaway --top 3 --full    # short-form examples
python3 .claude/skills/scriptwriter/scripts/find_voice.py --platform youtube --top 3 --excerpt 400   # long-form intros
python3 .claude/skills/scriptwriter/scripts/find_voice.py --keyword "workflow" --era <current-era-tag> --top 5
```

Pull **2-3 entries matching the target format** and keep them in context while
drafting. Short-form: `--full` (they're 150-400 words). Long-form: `--excerpt 400`
(the voice register lives in the intro; full YT transcripts blow up context).
Prefer the current-era tag (see `--list` output; e.g. in one corpus the current era is
tagged `current` and the older one `previous`): same voice, current niche.
Reach into the older era only when the format has no current-era example.

## Step 4 — The twist conversation

The twist lives here. Propose **one recommended angle** (plus a one-line alternate if
there's a genuinely different read): how the creator's proof, offer, and niche (per the
CLAUDE.md Creator Profile and `backbone/`) pour into the source format. Real receipts
only, pulled from `backbone/messaging.md`'s proof bank: real numbers, client/member
results, things the creator actually runs. Nothing invented, nothing borrowed.

Keep it short — propose, let them redirect. Don't interrogate. (Say "pick 2" / "row 2"
in chat, never bare "#2" — the renderer linkifies it.)

## Step 5 — Draft the beat sheet

Write the script as numbered beats. Rules:

- **Every bullet is a complete sentence, ~15-25 words, that reads like real script
  direction.** The creator scans this on their phone between takes — fragments are too
  cryptic. Example: "Open on the finished result already on screen, say the hook over
  it, then cut to your face for the promise." Not "result → hook → face."
- **Spoken lines are written out verbatim, in their voice** — drafted against the
  few-shot transcripts. If a line wouldn't survive being read aloud next to them,
  rewrite it before moving on.
- **Hook first.** Short-form: the exact spoken line (3-5s). Long-form: the title.
  Pull shapes from `knowledge/winning-hooks.md`; for a full proven-hook spread, run
  the `hook-generator` skill instead of improvising new structures.
- **One CTA.** Comment-keyword giveaway ("Comment X and I'll send it", keyword per
  `backbone/offer.md`) or a direct mention of the offer (name/price per
  `backbone/offer.md`). **Never** anything on `backbone/offer.md`'s "What is NOT sold"
  list.
- Structure: **Hook → Beats → CTA → Delivery notes** (energy, demo moments, b-roll
  flags). Short-form ≈ 6-12 beats. Long-form: intro beats verbatim, body as sectioned
  beats.
- **Follow the shape from Step 1b.** The beats follow that shape's structure in
  SCRIPT-SHAPES.md (e.g. Ranking: every item says its verdict out loud; Comparison: every
  line belongs to side A or B; Relatable thought: honest hook → what most people think →
  the honest reality → "that's why X beats Y long term" → "Follow for more", no hard sell).
- **Cue tags on spoken lines.** End each spoken line that needs a visual with its cue tag
  from SCRIPT-SHAPES.md: `[HOOK]`, `[STEP: 2]`, `[NUMBER: $60/day]`, `[TIER: S]`,
  `[RANK: 3]`, `[SIDE: A]`, `[PROOF: ...]`, `[BROLL: ...]`, `[IMAGE: ...]`,
  `[EMPHASIS: word]`, `[CHAPTER: ...]`, `[CTA]`. Tags are never spoken; the creator reads
  past them. Video Studio matches each tagged line to the moment it's said in the footage
  and builds that visual there, so a tag must sit on the exact line that triggers it.
- Write the spoken lines as a separate **Script** block: one spoken line per line, tags at
  the end, nothing else in it (no beat numbers, no direction). Direction stays in the beats
  and Delivery notes. This block is what Video Studio reads.

## Step 6 — Voice lint (subagent)

Spawn ONE fresh-context subagent with: the draft, `voice-dna.md`, and the same 2-3
few-shot transcripts. Its only job is to attack the draft line by line:

- Flag anything the creator wouldn't say: corporate phrasing, buzzwords, hedging,
  soft-sells, LinkedIn cadence, AI-isms ("delve", "game-changer", "in today's world",
  "let's dive in").
- Flag rhythm misses: lines too long to say in one breath, missing their tics where
  they'd land naturally, openers/closers that aren't theirs.
- Flag CTA violations (anything that isn't the comment keyword or the offer in
  `backbone/offer.md`; anything on its "What is NOT sold" list).
- For every flag: quote the line, say why, propose the rewrite in their register.

Apply the fixes you agree with. If the lint pass guts more than half the draft, the
few-shot selection was wrong — go back to Step 3 and pull better-matched examples.

## Step 7 — Deliver

Show the final beat sheet in chat. Iterate until the creator's happy. Then create the
Notion page (`notion-pipeline.md` has the live schema — load it for IDs and shapes):

- Write with the Notion MCP `notion-create-pages` tool. Parent = the **Data source ID**
  from `notion-pipeline.md` (not the Database ID). Set the page icon per the convention
  in `notion-pipeline.md` on every create.
- **Title** = working title (long-form: the title IS the hook). **Status** = `Scripting`.
  **Format** = `Short-form` / `Long-form`. **Source URL** = source video on twist picks.
- **Edit style** = the style's catalog `name` (exactly as in the Notion options, e.g.
  `Ranking`, `Explainer panel`). **Script shape** = `Explainer` / `List / ranking` /
  `Comparison` / `Story` / `Proof` / `Caption-led` / `Relatable thought` / `Long form`.
- **Never set Type** — leave the multi-select blank; the creator tags funnel placement themselves.
- Body = the beat sheet: Hook, Beats, CTA, Delivery notes, then a final `## Script` heading
  followed by ONE fenced code block (```text) holding the tagged spoken lines. Video Studio
  reads that block; keep it last and keep its heading exactly `## Script`.
- When the creator says it's filmed, flip **Status** to `Filming`. Video Studio takes it
  from there (Editing → Review → Ready) and writes **Studio job**.

## Rules

- **Imitation over instruction.** No draft is written without few-shot corpus pulls
  in context. If `voice-corpus/` is missing or untagged, stop and say so (build it
  with the `voice-corpus-builder` skill first).
- **One hardened path.** No fallback chains in transcription or Notion writes — if
  the primary path fails twice, stop and tell the creator.
- **Long-form sources stay in the subagent.** The orchestrator only ever sees the
  skeleton + intro excerpt.
- **Don't improvise hook structures.** Shapes come from `knowledge/winning-hooks.md`,
  the corpus, or the `hook-generator` skill.
- **Document, don't manufacture.** Twists are built on things the creator actually does and
  results that actually happened (the `backbone/messaging.md` proof bank).
- **Format first, then script.** Every script has an Edit style and a Script shape before
  drafting starts; a script that doesn't follow its shape gets redrafted, not tagged after.
- **The voice lint ignores cue tags** (they're never spoken) but flags a missing tag where
  the shape needs one (a ranking item with no `[TIER]`, a comparison line with no `[SIDE]`).
- **The script must survive the read-aloud test.** If a line sounds like a post, not
  like the creator talking to a friend, it doesn't ship.

## Files

| Path | What it is |
|------|------------|
| `.claude/skills/scriptwriter/scripts/find_voice.py` (run from repo root) | Slices `voice-corpus/` by format / era / keyword / platform; returns ranked entries with transcripts. Query, don't read raw. |
| `../transcribe-url/scripts/transcribe-url.sh` | Sibling-skill dependency: the one transcription path for Step 2 (bootstraps its own whisper venv). Ships alongside this skill. |
| `../../../voice-corpus/` | the creator's own top performers, verbatim, tagged. The few-shot source of truth (built by the `voice-corpus-builder` skill). |
| `../../../voice-dna.md` | The explicit voice rulebook — guardrails on top of the examples. |
| `../../../notion-pipeline.md` | Live Notion schema — load before any Notion write. |
| `../../../backbone/offer.md`, `../../../backbone/messaging.md` | The offer (CTA name/price, comment keyword, "What is NOT sold" list) and the proof bank for the twist. Never hardcode either. |
