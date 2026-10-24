# Script shapes: write the script for the format it will be edited in

Every format needs its script built differently. A ranking video needs items with tiers;
a this-vs-that video needs points that split into two sides; an explainer needs steps and
the numbers to show. When the script is written in the right shape, with cue tags on the
lines, the edit follows it instead of guessing.

There are **8 shapes**. Each format in `styles/catalog.json` uses one (`scriptShape`).
The scriptwriter (Content OS) picks the format first, then writes in that shape, in the
creator's voice (`voice-dna.md`).

## Cue tags

Put cue tags in square brackets at the end of the line they belong to. Video Studio reads
them and turns them into graphics at the moment that line is spoken. Keep them out of the
words you say on camera.

| Tag | Means | Turns into |
|---|---|---|
| `[HOOK]` | the opening line | hook card / emphasis caption |
| `[STEP: 2]` | the second step of a process | step list row lights up |
| `[NUMBER: $60/day]` | a figure worth showing | counter / glass stat card |
| `[TIER: S]` / `[RANK: 3]` | where an item lands in a ranking | card drops into that row |
| `[SIDE: A]` / `[SIDE: B]` | which side of a comparison | item drops into that column / that clone speaks |
| `[PROOF: screenshot of Google reviews]` | something to show as evidence | proof card, article highlight, screenshot |
| `[BROLL: driving to a job site]` | a shot to cut to | B-roll clip (from the B-roll library) |
| `[IMAGE: before and after kitchen]` | a picture to show | image cluster / cut-out backdrop image |
| `[EMPHASIS: trust]` | the word that carries the line | big accent caption on that word |
| `[CHAPTER: SEO]` | a new section (long form) | chapter tracker |
| `[CTA]` | the closing call to action | end card |

## The 8 shapes

### 1. Explainer
Formats: business-reel, explainer-panel, glass-explainer, split-reel, depth-ui, faceless-sprite.
```
Hook: the problem in one line                         [HOOK]
Why it happens (one line)
The fix, in 3 steps                                   [STEP: 1] [STEP: 2] [STEP: 3]
One proof number                                      [NUMBER: ...]
What to do next                                       [CTA]
```
Rules: one idea per video; exactly 3 steps (2 or 4 only if the content truly needs it);
every step names something that can be drawn.

**Faceless sprite** (also takes List and Proof scripts): the script becomes a **voiceover**, not a
filming script. Write it to be read by Bryan's ElevenLabs voice clone: 30-60 s, short sentences,
every claim something a browser card can show (a post, a stat, a chart, a doc, a site), names of
tools and products spelled exactly, and end on "comment KEYWORD" for the CTA lockup. Cue tags work
the same; `[BROLL: ...]` names the card's page ("stat: 47 leads in 30 days", "chat: the prompt").
The Notion page skips Filming: once the voiceover file exists it goes straight to Video Studio.

### 2. List / ranking
Formats: ranking, top-5-ranking, rapid-list, if-then-grid.
```
Hook: what's being ranked and why it matters          [HOOK]
Item, one line on why, then the verdict               [TIER: S] / [RANK: 1] / "if X then Y"
...repeat per item
The one takeaway                                      [CTA]
```
Rules: say the verdict out loud on every item (that's when the card moves); rankings work
best with 5-8 items; save the surprising verdict for the middle, not the end.

### 3. Comparison
Formats: this-vs-that, clone-versus, dual-role-dialogue.
```
Hook: the two sides                                   [HOOK]
Point for side A                                      [SIDE: A]
Point for side B                                      [SIDE: B]
...alternate
Verdict: which side wins and when                     [CTA]
```
Rules: every line belongs to one side; keep the sides balanced in length; clone-versus and
dual-role need two takes filmed (one per side, same framing).

### 4. Story
Formats: personal-reel, natural-story, vlog, cinematic-type.
```
Hook: drop into the moment                            [HOOK]
Setup: where you were / what was going on             [BROLL: ...]
The turn: what happened or what you realised
Payoff: what changed
The lesson in one line                                [EMPHASIS: ...] [CTA]
```
Rules: start in the middle of the moment, not with background; one B-roll or image note
per beat.

### 5. Proof
Formats: visual-essay, yap-and-show, image-cluster, cutout-backdrop, cutout-grid, tiktok-style.
```
Hook: the claim                                       [HOOK]
Claim 1 + what proves it                              [PROOF: ...]
Claim 2 + what proves it                              [PROOF: ...]
What it means for the viewer                          [CTA]
```
Rules: no claim without a proof tag; proof must be real (your screenshots, results,
reviews, photos of your work).

### 6. Caption-led
Formats: fitted-captions, broll-stacked-text.
```
Hook (6-10 words)                                     [HOOK]
3-6 short punchy lines, one thought each              [EMPHASIS: word] on each
Closing line                                          [CTA]
```
Rules: short lines (under ~10 words); mark exactly one emphasis word per line.

### 7. Relatable thought
Formats: personal-reel, natural-story, fitted-captions, tiktok-style, vlog (any talking
head where the goal is trust, not teaching). Pattern from the AESTX "Relatable Content
Ideas" doc, adapted to Elivate Marketing.
```
Hook: an honest, in-the-moment opener                 [HOOK]
What most people think / what you used to think
The honest reality ("but honestly...")
The lesson: "that's why X beats Y long term"          [EMPHASIS: ...]
"Follow for more."                                    [CTA]
```
Topic buckets, with example hooks in that style for contractor marketing:
- **Posting nerves / overthinking**: "I still overthink posting." / "I almost didn't post this."
- **Business growth thoughts**: "Nobody talks about this part." / "This took me a while to realise."
- **Social media relatability**: "Most contractors won't admit this." / "I stopped caring about views."
- **Behind the scenes**: "Nobody sees this part." / "This is what most days actually look like."
- **Client trust**: "One thing homeowners notice fast." / "This builds trust faster than any ad."
- **Confidence / self-improvement**: "Confidence isn't automatic." / "Small reminder."

Example (our own, for this shape): *"Nobody talks about this part. Most contractors think
the job is the hard part. But honestly, calling a lead back within five minutes wins more
work than a lower quote. That's why speed beats price, long term. Follow for more."*

Delivery and filming rules for this shape:
- Natural and conversational; small pauses and imperfections are fine, keep them in the
  cut (the rough cut removes dead air, not character).
- Film while moving or in real places: walking a job site, in the truck, at the desk.
- It should sound like a real thought, never a commercial; no hard sell, no offer.
- Only light graphics: captions and the odd emphasis word. No step lists or stat cards.

### 8. Long form
Formats: educational-youtube, tips-breakdown, screen-tutorial, split-screen-lesson,
lesson-document, coaching-call-clips, ear-to-ear-captions.
```
Cold open: the promise of the video                   [HOOK]
Chapter, with its points and visuals                  [CHAPTER: ...] then [STEP]/[NUMBER]/[PROOF] tags
...repeat per chapter
Recap + call to action                                [CTA]
```
Rules: name every chapter (it becomes the chapter tracker and the YouTube chapters); one
visual tag at least every 30 seconds so the screen keeps changing.

YouTube clips are not scripted: they are cut from a long video that already exists.

## Picking the shape

- Teaching a process → Explainer. Comparing → Comparison. Ranking or listing → List.
- Personal moment → Story. Making a claim you can show → Proof.
- A short punchy point → Caption-led. Building trust, nothing to sell → Relatable thought.
- Longer than ~3 minutes → Long form.
