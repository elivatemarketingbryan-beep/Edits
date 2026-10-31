# screenshare — the look

> **How this file applies to this kit.** It was measured off **REF-A**, a
> screen-share-style explainer on a static white canvas. Everything about the
> **camera travel, the card geometry, the captions, the shadow and the type**
> applies as written. Where it says the canvas is pure white and never moves,
> that describes the `classic` ground. The default for this kit is the
> **played-share variant** in `demo-mix.md`: a live dot ground in your theme
> colours, rebuilt UIs with a scripted cursor, and about 40% of graphics time
> in motion. When the two disagree, `demo-mix.md` wins.

There is almost nothing here, and that is the point. This file exists mostly
to say what *not* to add.

---

## 1 · The canvas

MEASURED: `#FFFFFF`. Sampled at five points across 216 canvas frames — 255,
255, 255, every time.

Not `#FDFDFD`, not a paper warm, not a 2% grey to "soften" it, not a radial
gradient, not a dot grid, not a subtle noise texture. The one time the
reference shows a dotted grid it is **inside** a drawn app window — it is part
of the depicted tool, not the ground.

Everything that makes the canvas read as a *surface* comes from the objects on
it and the shadows they cast. That is a very small amount of visual
information doing a lot of work, which is exactly why adding anything to the
ground breaks it so completely: the moment the background has a treatment, the
cards stop floating on a screen and start sitting on a designed page.

---

## 2 · The shadow

MEASURED, and it is the only "look" token in the style.

Sampled outward from the camera card's right edge on a 65-frame average:

```
edge  224  231  238  245  250  →  253 (ground)
       ↑ falls off over ~20px, never darker than ~12%
```

and the hue: **R 223.7 · G 223.0 · B 221.8** at the edge — neutral to within a
unit. There is no blue in it.

That matters because every design system's default elevation shadow is
blue-tinted, and a blue-tinted shadow on a pure white ground is the single
clearest signal that a frame was made in a design tool rather than captured
off a screen. `--ss-shadow-card` and `--ss-shadow-cam` are both neutral.
Do not substitute a framework's.

Two shadows, and the camera's is slightly heavier — it is the nearest object
to the viewer and the only one that ever moves.

---

## 3 · The footage

MEASURED, loosely, and treat it as a target rather than a curve: the
reference's camera ground is bright, neutral, low-contrast and ungraded —
a white wall, soft daylight, no colour cast to speak of, no vignette, no
grain.

**This style does not grade the footage.** That is a real divergence you have
to hold on to if you have been working in a graded, cinematic style:

| | a film-look style | a punchy vlog style | **screenshare** |
|---|---|---|---|
| grade | warm, desaturated, film | saturated, crushed, cyan | **none** |
| grain | yes | zero | **none** |
| bloom | yes | heavy | **none** |
| vignette | yes | — | **none** |

Reaching for a grade, a LUT or a background-removal matte here is wrong —
nothing is graded or matted in this style. The camera tile is a crop of
the plate, whole.

What the footage **does** need:

1. **A clean, bright, uncluttered background.** The camera tile is 300px
   square; a busy room turns to noise at that size. A plain wall is not a
   limitation here, it is the requirement.
2. **Exposure that holds up under the caption.** White type sits on the
   footage. `check-contrast.py` will tell you when it does not.
3. **Neutral white balance.** Because the tile sits 60px from a pure white
   ground, *any* cast in the footage reads instantly — the ground is a
   reference white sitting right next to it. This is the one place where the
   style is unforgiving about camera work. Balance it in-camera if you can;
   a simple white-balance correction (ffmpeg `colorbalance` or your editor's
   auto white balance) will cancel a source cast if you cannot. Correct, don't grade.

---

## 4 · Colour discipline

Four accents, four jobs (`tokens.css` §2). The discipline is not about which
hues — it is that **colour is never decorative in this style**.

A useful test on any finished frame: point at each coloured thing and say what
it means. "This number is the win." "This is the link." "This is the cost."
If the answer is "it looked flat in black and white", take the colour out.

Measured shares across 216 canvas frames, with the camera masked, after
dropping the content-specific hues (product logos and photographic skin):

```
blue  ~17%   red  ~18%   green ~12%   amber ~14%
```

Roughly even. No single accent dominates — which is what you would expect from
four functional colours and not from a brand palette.

---

## 5 · The things people add that break it

In rough order of how often:

1. **A tint on the ground.** Covered above.
2. **A blue elevation shadow.** Covered above.
3. **A brand colour used for mood.** Your accent (brand.json) takes the
   *live* job — the thing being shown, a link, a defined term. It is never
   splashed on for decoration; that breaks §4.
4. **Rounded everything.** The camera card is the roundest object on screen
   (40 on 300 = 13%). Cards sit at `--ss-card-radius` (20), wells at 12. If a
   card is as round as the camera, the camera stops reading as the human.
5. **An emoji.** Never, and the reference's own use of them is the thing
   the rule was written against. Draw the mark.
6. **A gradient, a glass blur, a glow, an inner highlight.** All of them say
   "designed"; none of them say "shared screen".
