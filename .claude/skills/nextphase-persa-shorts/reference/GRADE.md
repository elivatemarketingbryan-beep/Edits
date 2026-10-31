# GRADE — the warm film curve (optional)

Only if `brand.json "grade"` is `film`. With `natural`, no grade is applied anywhere and the
footage is left exactly as shot — a perfectly good choice; some creators prefer it.

---

## What it is
An SVG `feComponentTransfer` filter — a per-channel lookup table, i.e. a curve per channel, i.e.
a grade. It runs in the browser at render time: nothing is re-encoded, and it applies per element.

The measured look: **warm highlights over cool, slightly green shadows; blue rolled off ~20%
through the mids and highs; a small black lift** (the darkest tones never reach pure black).

## Where it goes
`build.py` puts `class="graded"` (→ `filter:url(#persa-grade)`) on **every photographic surface**:
the camera, the card, the cut-outs, b-roll — so they all sit on one curve. **Never on a product UI,
a page shot or a captured device**: recolouring a real product's interface fabricates it.

## Derive it per recording
Most of the correction is usually removing the ROOM's lighting cast (a warm lamp runs the low-mids
red), and that belongs to the take. So derive it from each take, once:
```bash
scripts/py <skill>/scripts/make-grade-filter.py --derive <video>/assets/recording.mp4 --out <video>/grade-persa.svg
```
`new-video.py` copies a stored default in; replace it with a derived one before the final render.
Re-derive whenever the lighting changes.

**Strength defaults to 0.75.** 1.00 is numerically closest to the reference but can push skin
sallow, because the reference is a different person in a different room. Lower it
(`--strength 0.5`) if skin looks off on the render; never raise it past 1.

## Two wrong turns already made
1. **Histogram matching is not a grade** — it reproduces the reference room's exposure, crushing
   mid-grey from 128 to ~70.
2. **Percentile bins lie** — your 20th percentile and the reference's sit at different luma, so the
   comparison is between different parts of the curve. Bin by ABSOLUTE luma band (the script does).

## Check it
Render a draft and look at skin and a white wall on the contact sheet. If the creator says the
grade "lowers the quality", switch `grade` to `natural` — that preference is common, and the type
roles and the matte work exactly the same without it.
