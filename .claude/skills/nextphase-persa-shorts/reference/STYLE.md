# STYLE — what persa is, measured

**The camera is the frame, always.** Nothing sits on a plate. Every graphic is composited INTO
the photograph. The frame barely changes; the GRAPHICS do.

Persa was reverse-engineered frame by frame from two vertical reels (67.7s and 38.8s) that use
the look. Every number below was measured off them, not chosen. Where this kit deviates, it says
why.

---

## 1 · The precondition — check it before you build

**Persa needs a real product, app, website or process worth ~15 seconds of screen time.**

Both reference reels do the same structural thing: put a real UI on screen and leave it there.

| | the demo spine | share of the video | camera cuts inside it |
|---|---|---|---|
| reel A | 14.0 → 32.2s — an app doing the job | **27%** | 0 |
| reel B | 6 → 24s — a plug-in panel being used | **46%** | 1 |

Reel B's whole structure: 0–5s hook · **6–24s the UI owns the frame** · 25–28s face · 28.5–32s
the real repo page · 33–38.8s face, annotation, CTA. Nearly half the video is one product doing
one thing.

That hold is legal because the picture never stops changing — a cursor is dragging, a list is
filling, a chart is drawing. **A live screen recording resets the clock. A screenshot never does.**

If the script has no real 15s+ demo (no app, no site, no screen recording, no process filmed),
**say so in one line before building** and offer the creator two ways out:
1. record a screen capture of the thing (QuickTime / OBS / the phone's screen recorder), or
2. a face-led persa cut — the type roles and the caption still work, but it will feel like a
   talking head with stickers, and they should know that before you spend the render.

`build.py` warns when the longest continuous moving-UI run is under 15s.

---

## 2 · The five treatments

The frame does not have to change every beat. The graphics change over a continuous take.

| treatment | what is on screen |
|---|---|
| **full face** | the raw take, the caption, and at most one display word |
| **UI owns the frame** | the real app/page fills 1080×1920; the creator drops to the camera card, head breaking its top edge |
| **floating real window** | a real app window (~90% width) dropped into the top third over the LIVE take, with a drop shadow |
| **b-roll with one object** | real b-roll of the thing, plus the single real object being talked about composited in, at the wrong scale |
| **handheld device** | a real phone in hand running the real app, filmed as b-roll |

Measured cadence: reel A one change every **4.0s**; reel B every **7.8s** — and reel B's camera
does not cut AT ALL from 20.1s to the end; panels appear and disappear over one continuous take.

`beats.json` kinds map onto these: `face` · `ui` · `window` · `broll` · `title` (the hook stack
over the live take) · `cta`.

---

## 3 · The camera card — and the matte that makes it

When a real UI owns the frame, the camera drops to a rounded card. Measured:

```
left 10.6%   width 79.7%   top 59.5%   radius 3.6% of width
at 1080x1920 →  left 114 · top 1143 · width 861 · height 777 · radius 39
no border · no shadow · no label
```

**The head is MATTED and pops out ABOVE the card's top edge, over the app.** Two layers from one
source: the raw take clipped by the card, and the cut-out drawn over it unclipped at the same
position. Without the matte it renders as a floating rectangle with no connection to the frame.

The camera inside the card must OVERFILL it (this kit scales it to 0.81 → 875×1555 px), or the app
shows through at the card's edges. `build.py` solves the vertical position from the measured head
top so the head breaks the edge by ~120px. See `CUTOUT.md`.

### The production note — read before promising the look
**Persa wants a wider shot than most creators record.** In the reference the head fills ~10% of
frame height; a typical webcam/phone take fills ~25%. In a tight take the card edge lands near the
chin instead of mid-chest and the caption sits on the collar.

**The fix is at the camera, not in the edit: sit further back (head ~15% of the frame height or
less) with room above the head.** Tell the creator this once, at setup or before their first
recording. Until then, accept the higher card edge — and do **not** move the caption line.

---

## 4 · The caption — one line, never moves

```
one word at a time · on its own transcript onset · HARD CUT on and off
top: 1400px of 1920  (72.9%)  — in EVERY treatment, including inside the card
96px · heavy · uppercase · the caption ink token · a soft shadow
no box · no band · no highlight · no colour · no bounce
```

When the camera shrinks to the card, the caption still lands at 72.9% of the FULL frame, which
puts it on the creator's chest inside the card. **One line the eye never has to re-find** — that is
the whole rule. Do not introduce a second position "for this beat".

The caption drops for the CTA (the CTA says it) and on any beat marked `"caps": false` — a beat
where the picture already says the words (someone typing the exact prompt in a real UI).

---

## 5 · What carries the density

**Real product surfaces + a small recurring cast.** In 106 seconds across both reels there is not
one generic animation.

The asset rule — six literal mappings, applied to the noun just spoken, zero taste:

| they say | show |
|---|---|
| a product / app / site name | that product's real mark or real UI, **on the word**, not eight seconds later |
| a person or an agent | one actor, cast once, reused every single time that name is spoken |
| an action inside a product | the real screen recording of THAT exact action, at readable size |
| a place or an object | the real object composited into real b-roll, at the wrong scale |
| a claim (price, number, licence) | the claim typed into the product's own empty space, in the annotation colour |
| anything else | caption only — the face carries it (~40% of both reels) |

`brand/brand.md` carries this table rewritten for the creator's niche.

---

## 6 · The look

- **The ground:** none. The photograph is the ground, full bleed, edge to edge.
- **The vignette:** a soft top-down darkening ON THE MEDIA under any display type
  (`--vig`). Without it the display word measures ~1.2:1 against a lit wall and vanishes. A band
  behind text is banned; darkening the picture is not. When the cut-out is on, the vignette is
  baked into both the take and the matte so the head painted over the type matches exactly.
- **The grade (optional):** a warm film curve on every photographic surface — `GRADE.md`.
- **Three accents, one job each:** display (filled payoff word, hook + CTA only) · emphasis
  (hollow outline, the pain word) · annotation (a claim in a UI's empty space). Plus white.
  Generated from the brand by `scripts/make-tokens.py`; never hardcoded.
- **Motion:** none of its own. Things hard-cut in and out on word onsets. The movement is the
  take, the screen recording and the b-roll. A tweened entrance reads as a different style.

---

## 7 · Signature moves

1. the hollow-outline emphasis word, screened over the photograph
2. the four-layer title stack over the live take, the head passing in front of it
3. the 15–18 second demo spine on a real screen recording
4. a claim typed into the product's own negative space
5. one actor per named person/agent, cast once and reused

---

## 8 · What this kit changed from the reference, and why

- **No emojis, ever** — the reference pairs a reaction word with an emoji; this kit builds a
  designed mark instead.
- **The CTA** is built from the persa roles (marker line + the keyword as the payoff word + a drawn
  arrow) on the live take, rather than any one creator's branded CTA.
- **The palette is yours.** The reference's red/amber/lime is the `red` preset; every other preset
  keeps the three jobs and is contrast-checked against the vignetted frame.
