# Long-form script rules (Plan page)

How Claude writes outlines and scripts for the Plan page (`/plan`). The job flow is in
`docs/studio/plans.md`. Read, in this order, before writing:

1. `plans/blueprint.md`: the business, offer, story, audience, objections (private, not committed).
2. `engines/content-os/voice-dna.md`: how Bryan actually talks. Its openers beat generic ones.
3. This file.
4. `styles/SCRIPT-SHAPES.md` "Long form" and "Cue tags": the tags are what turn the script into graphics.

## The format (Bryan's)

Every script uses these exact markers, one item per line. `#` title, `##` section, `###` beat,
plain lines are spoken. Cue tags go at the end of the spoken line they belong to.

```
# <video title>
## Packaging angles
### How can I make this appeal to someone who hasn't heard about <topic>?
<one line>
### How can I make this appeal to someone who is a beginner?
### How can I make this appeal to someone advanced?
### How can I make this appeal to my mom?
<one line: a simple visual or motion-graphic idea>
## Intro
### Confirm the click (meet, then beat, the title's promise)
<spoken>   [HOOK]
### The common belief
### The contrarian take (the open loop)
### Set the expectation (the plan, style, pacing)
### Singularity + credibility (proof)
## Topic: <the core promise in a few words>
## Act 1: <short act name>
### Open Loop
<spoken>   [CHAPTER: <act name>]   (on the act's first spoken line)
### Payoff 1: <name>
### Open Loop
### Payoff 2: <name>
### Open Loop
### Payoff 3: <name>
... more acts (default 3) ...
### Open Loop   (sets up the recap)
## Recap
### High note
## CTA
### Link → Curiosity gap → CTA/Promise
<spoken>   [CTA]
```

Packaging angles are planning notes, not spoken; `node studio/plans.mjs export` drops them and
every heading, leaving the spoken lines and their tags for `studio/script-cues.mjs`.

## Structure rules (Kallaway's 5-step framework)

- **Intro:** the first line confirms the click by saying what the title promised, then beats it
  with something extra. State the belief most contractors hold, flip it with a contrarian take
  (voice-dna's "Most contractors think X, but it's Y" is his best opener), give the plan for the
  video, and close with proof of why to trust him, from the blueprint, never invented.
- **Order the payoffs by strength:** the second-best point first, the best point second, then the
  rest. Value should feel like it climbs.
- **Every payoff runs a value loop:** what it is (one plain line), how to do it (steps, numbers,
  an example), why it matters to the bigger story (one line that zooms back out).
- **Uniqueness:** every point says something most contractor-marketing videos don't. Prefer a
  specific mechanism over generic advice.
- **Native offer moment (optional, one):** where a payoff naturally creates a need for Elivate's
  offer, mention it once as the solve and move on. Never an ad read.
- **Recap:** two or three lines that list the points and remind them of the problem solved.

## Story locks (Kallaway's 6, used naturally)

- **Term branding:** name one or two frameworks and reuse the name.
- **Embedded truths:** never if, maybe, might, could, probably. Write when, the reason this works, once you do this.
- **Thought narration:** once or twice, say what the viewer is thinking ("You're probably thinking…"), often a blueprint objection, and answer it.
- **Negative frames:** at least one open loop or payoff opener framed as a mistake or warning.
- **Loop openers:** every Open Loop confirms what was covered and teases the next as more important, with a contrast word (but, actually, instead, turns out, except).
- **Contrast:** in the biggest lines, lean one way, then flip with "but" or "actually". Don't overdo it.

## Cue tags for the edit

- `[HOOK]` on the first intro line, `[CHAPTER: <act name>]` on each act's first spoken line, `[CTA]` on the CTA's first line.
- `[NUMBER: …]` on any figure worth showing (only real or napkin-math numbers), `[STEP: n]` for steps
  inside a payoff, `[PROOF: …]` where a screenshot would prove it, `[BROLL: …]` for a shot to cut to,
  `[EMPHASIS: word]` on the word that carries a big line.
- At least one visual tag about every 75 spoken words (~30 seconds), so the screen keeps changing.

## Voice and honesty

- Spoken, first person, short sentences a contractor would say. Plain words, no hype, no emojis.
- Use napkin math for money. Bust at least one piece of common bad advice.
- Keep his faith and values as the blueprint describes them, without preaching.
- **Never invent** client names, results, testimonials or statistics. Bryan has no testimonials:
  never claim any. Missing proof becomes a `[PLACEHOLDER: what real fact goes here]` line note.
- Don't promise viewers specific income. Keep platform claims (Google, Meta, Angi) accurate.

## Outline (the "Outline & check" button)

Write `plans/<id>/outline.md`:

```
# <video title>
## Click promise
<what the viewer expects, and how the intro beats it>
## Common belief → contrarian take
## Point 1 (second-best): <named point>
### What
### How
### Why it matters
... (Point 2 is the BEST; about 3 points per act)
## Uniqueness check
<per point: NEW or COMMON, and for COMMON a sharper angle>
## Native offer moment
<which point sets up the offer, or "none">
```

When a script is requested and an outline exists, follow its points and order and sharpen any COMMON point.
