# CUTOUT — the matte that lets the head break the card and pass in front of the type

Only if `brand.json "cutout"` is `quick` or `best`. With it `off`, the card is a plain rounded
window and nothing occludes the type — still persa, without the signature move.

---

## What it is for
1. **The card pop-out.** When a UI owns the frame, the raw take is clipped by the card and the
   cut-out is drawn over it UNCLIPPED at the same position — so the head rises above the card's
   top edge, over the app. Same body drawn twice; the positions must match exactly (build.py
   computes both from one geometry).
2. **The occluder.** On face/title/CTA beats with display type, the cut-out is painted at 1:1 over
   the take AFTER the type — the head stands in front of the words.

## Run it
```bash
scripts/py <skill>/scripts/cutout.py <video-folder>                # mode from brand.json
scripts/py <skill>/scripts/cutout.py <video-folder> --mode best
scripts/py <skill>/scripts/contact-sheet.py <video-folder>/assets/person.webm --alpha   # LOOK
```
Writes `assets/person.webm`, `assets/recording-vig.mp4`, `assets/person-vig.webm` and
`geometry.json`.

## The two modes
| | quick (default) | best |
|---|---|---|
| engine | `npx hyperframes remove-background` (built in) | RVM — Robust Video Matting |
| install | none; ~170 MB model on first use | `bash scripts/setup-cutout-best.sh` — ~1 GB Python env |
| speed | ~0.1 s/frame on a recent laptop (a 45s short ≈ 2–3 min) | ~0.25 s/frame on CPU |
| edge | per-frame — very fine hair can shimmer slightly | recurrent — temporally stable, the cleanest |

Start with quick. Switch to best only if the hair edge visibly crawls on the render.

## Rules learned by shipping it wrong
- **One pass for the whole take.** Spans matted separately frame differently and read as broken.
- **Measure, never hardcode.** The head top is a different row in every recording; `cutout.py`
  reads it off the matte's own alpha (15 samples, median) into `geometry.json`.
- **Bake the vignette into BOTH the take and the matte.** If the frame under the type is darkened
  and the head painted on top is not, the head glows. The baked pair matches to the pixel.
- **VP9 alpha needs the libvpx decoder named explicitly** (`-c:v libvpx-vp9` before `-i`);
  ffmpeg's native vp9 decoder silently drops the alpha and every frame looks opaque.
- **RVM `downsample 0.4` is the cleanest.** 0.25 measured ~7x worse (haze above the hair). The
  `--haze-floor` option removes the faint ~0.06 alpha it leaves above the hair.
- **Framing.** The creator off-centre (face x outside ~380–700 of 1080) gets cropped by the card;
  a tight take puts the card edge at the chin. Both are camera fixes — say so, don't fight them.
