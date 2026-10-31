# TYPE ROLES — the display type

These are **display type**, not captions. There is exactly ONE caption (STYLE.md §4) and it keeps
running underneath everything here. Nothing in this file replaces it.

All CSS lives in `components/persa-roles.css`; all colours and fonts come from `tokens.css`.
`build.py` emits every role from `beats.json` — you set the word and the onset, it sets the rest.

---

## The one precondition

**Every display role needs a photographic ground, and a dark one.** The outline word is screened
(`mix-blend-mode: screen`), which only ever lightens: over a lit wall it collapses into faint
outlined type with a halo. So display type always rides on the vignette (`--vig`), and roles 2–3
belong on `face`, `title`, `cta` and `broll` beats. The annotation (role 9) belongs where a real UI
owns the frame — in its DARK empty space.

The vignette was found by rendering, not by reasoning: the first build without it lost the payoff
word entirely.

---

## The thirteen treatments

| # | treatment | beats.json | when |
|---|---|---|---|
| 1 | word caption | automatic | always on |
| 2 | emphasis outline — white | `"emph": {"word","at","tone":"white"}` | the neutral word that carries a beat |
| 3 | emphasis outline — accent | `"emph": {..., "tone":"accent"}` | **the pain word** ("manually", "every hour") |
| 4 | name tag | `"name": {"word","at"}` on a `ui` beat | an actor's name over the UI it operates, ~40% size |
| 5 | payoff word — filled | `"payoff": {"word","at"}` | hook and CTA only |
| 6 | title stack | `"kind":"title"` with `pill`,`mark`,`line`,`word` | the hook |
| 7 | marker line | `"mline": {"text","at"}` | one handwritten line, all caps, **must never wrap** |
| 8 | pill label | `"pill": {"text","at"}` | the real product name + version over a real panel |
| 9 | annotation — a claim | `"annot": {"text","x","y","size"}` on a `ui` beat | price / licence / number claims, in the UI's empty space |
| 10 | annotation — reaction | `"react": {"word","at"}` | one word (no emoji) |
| 11 | pixel speech bubble | `"bubble": {"word","at","x","y"}` | a word spoken BY an actor |
| 12 | stacked repetition | `"rep": {"word","at"}` | only when the line IS repetition ("again and again") |
| 13 | arced sentence | `"arc": {"text","at"}` | a whole line bent into the room, sentence case |

Plus `"mark": {"src","at","box"}` — a big real logo floating over the live take on the word that
names it, and `"obj"` on a `broll` beat — the real object at the wrong scale.

**Cadence:** one display word every 3–5s at most, only on the noun that carries the beat. Most
lines get the caption alone.

---

## ROLE 6 · TITLE STACK — the hook

Four layers over the **live take**. Never on a plate, never a typeset title card.

```
pill     the real product name (+ version), translucent capsule, ~38px UI face
mark     the product's SQUARE app mark/icon, ~196px — NOT its wordmark
line     one handwritten line, ~60px, white, ALL CAPS, must not wrap (≤ ~22 chars)
word     the payoff word, FILLED in --display, 200-290px display face
```

The mark is the **square app mark**, not the wordmark: a wordmark is type, and stacking type on
type is exactly what this role exists to avoid. If the product has no square mark, drop the mark.

The stack runs ~150 → 660px and will often overlap the top of the head. **That is correct** — with
the cut-out on, the head is painted back in front of it, which is the signature move. Do not shrink
the stack to avoid the head.

## ROLES 2–3 · EMPHASIS OUTLINE — the "gradient" word

It is not a gradient. The word is **hollow** — a whisper of fill (`--emph-fill`, never zero alpha:
the checker fails an unpainted word), a 4px stroke, and a wide soft bloom in the stroke's own hue,
screened. The room's light comes through the counters, so the letters take the scene's colours.
That is the whole trick, and why it never looks pasted on.

| | |
|---|---|
| tones | **white** (neutral) and **accent** (the pain word). The display colour is NEVER an outline — it reads as weak mush |
| size | ~11% of frame height → up to 290px, stamped per word by `build.py` so it never wraps |
| position | `top: 300px` — above the head. Override with `"top"` only when the take demands it |
| entrance | a hard cut on the word onset |

## ROLE 5 · PAYOFF WORD — filled

The one place a flat-colour word is allowed. Hook and CTA only, on the vignette, never on a band.

## ROLE 9 · ANNOTATION — a claim, typed into the UI

Pixel type with a soft glow, placed in the **product's own empty space** — the dark gutter of a
chart, the dead area of a panel — aligned to that UI's grid. No box, no card, no callout line. It
reads as a note written on the thing itself. It is the only new text allowed to sit on media.

**Measure the space, never guess it:**
```bash
scripts/py scripts/find-empty-space.py <video>/assets/ui/shot.png --max-y 1143
```
`--max-y 1143` keeps it above the camera card. If the largest empty box is narrow, or the UI is
light-themed, **that shot is wrong for an annotation** — move the claim to a face beat as an accent
outline word instead. (Annotation colour on a white app measures ~1.5:1; `hyperframes check` flags
it, and it is right to.)

## ROLE 12 · STACKED REPETITION
The same word cascading down and right, outline first then solid copies, running off the frame.
The one treatment that is a *picture* rather than type — thumb over the words and it still means
"over and over". Use it only when the line is literally repetition.

## ROLE 13 · ARCED SENTENCE
Built as ONE SVG `<textPath>`, never per-character spans: the glyphs rotate smoothly, and it stays
one text node so the layout checker does not read every letter as an overlapping block.

## ROLE 11 · PIXEL SPEECH BUBBLE
Drawn at the actor's resolution — `shape-rendering="crispEdges"`, stepped edges. A smooth vector
bubble next to a pixel character looks broken.

---

## Build traps found by rendering

1. **`font-size:%d px` (a space before px) is invalid CSS** — the declaration is dropped and the
   word silently never paints, while the composition still passes the checker. `build.py` stamps
   sizes with no space.
2. **Per-character arced text fails the layout gate** (every rotated glyph reads as an overlap).
   `<textPath>` is both the better build and the one that passes.
3. **A marker line that wraps** runs off the frame. Keep it ≤ ~22 characters.
4. **The display face changes the fit.** Condensed faces (the `poster` feel) fit ~2x more letters
   than wide ones; `tokens.css --display-advance` carries the measured width and `build.py` uses
   it. Still check long words on the render.
