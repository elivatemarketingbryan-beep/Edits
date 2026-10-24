# Backdrops

Two layers sit behind the content of every scene:

| Layer | Source | Used by (engine.css) |
|---|---|---|
| Dot grid | pure CSS (`radial-gradient` dots, 36 px pitch) | `.dots` on light and white scenes (black dots at 15 % with an edge fade), `.dots.on-dark` on dark scenes (white dots at 7 %). `FX.drift` creeps it up about one cell per scene. |
| Pixel-art room | `pixelRoom()` from `lib/room.mjs` | inline SVG inside `.panel .room` and `.facebg .room` |

## Pixel-art rooms

```js
import { pixelRoom, ROOM_VARIANTS, roomColor } from '../lib/room.mjs';

pixelRoom({ width: 963, height: 700, variant: 'sage' });   // light-scene panel
pixelRoom({ width: 1080, height: 1920, variant: 'studio' }); // full-bleed close-up
```

`pixelRoom({ width, height, variant = 'sage', eyeLine, seed })` returns an SVG string with an
explicit width, height and viewBox, `shape-rendering="crispEdges"` and
`preserveAspectRatio="xMidYMid slice"`. The room is painted on a **6 px cell grid** in flat colours,
with soft per-object outlines and 2–3 tone shading, the same trainer-sprite language as the
character. Each colour is encoded as one `<path>` of merged rectangles. A wall-colour `<rect>`
underlays everything, so seams never show. The output is deterministic. `seed` only reshuffles
books and leaves.

- **Layout** is chosen by aspect:
  - `height <= 1.2 * width` gives the **panel** layout. Decor sits in the left and right thirds and
    the centre stays calm wall.
  - Taller sizes give the **full** layout. Decor sits at the edges and top around the head, with a
    floor and baseboard at the bottom.
  - Horizontal positions scale with `width / 963` (panel) or `width / 1080` (full).
- **eyeLine** is the y, in px in the SVG's own coordinates, of the sprite's eyes. Every prop keeps
  its real-world height relative to it: door handle, shelves, pictures, lamps. The defaults match
  the engine geometry:
  - Panel: `-26`. The sprite is scaled 1.34 with the head top at frame y 1117 and the panel top at
    1407, so the eyes sit just above the panel.
  - Full: `552`. The sprite is scaled 2.41 with the head top at y 77.
  - General formula: `eyeLine = rigTop + 285 * spriteScale - containerTop`, where 285 is the eye row
    in the 1254 px sprite canvas.
- Panel props stand on the visible bottom edge (eyeLine + 540). That means `height: 513` and
  `height: 700` (the full `.panel` box) give the same picture. The extra 187 px is just more wall.
- Sizes: 8–30 KB for the panel and 24–70 KB for the full layout (studio is the largest). The sizes
  stay well under 150 KB.
- `ROOM_VARIANTS` is the list of names. `roomColor(variant)` returns the flat wall colour. Use it
  as the `.panel` background-color so a blurred room edge fades into the wall instead of into
  transparency.

| Variant | Wall | Panel decor (left / right) | Full-bleed extras |
|---|---|---|---|
| `sage` | #C5CCBB, matches the reference | white shaker door with a lever handle / framed landscape, wood shelf with books, a trailing pothos and a vase | second framed print, monstera in a terracotta pot |
| `cream` | #E7DBC4, wainscoting | walnut bookcase / brass wall sconce (warm glow), gold-framed botanical, snake plant in a basket | taller bookcase, larger sconce |
| `blue` | #B8C7D3 | daylight window with tree line, sheer curtain / sunset print, sideboard with a lit table lamp and a vase | black pendant lamp |
| `studio` | #2E2A36, dark and moody | acoustic foam / pink neon sign, shelf with a cyan LED strip, books and a plant, ring light | cyan LED tube, floor lamp, purple key glow behind the head |
| `mint` | #CBE1D3 | fiddle-leaf fig in a white pot / wall clock, two white floating shelves (books, candle, pots) | taller fig |
| `blush` | #E6CEC4 | arched brass mirror / wave print, white sideboard, pampas in a vase | larger mirror |

### Integration

```html
<div class="panel" style="background:${roomColor(v)}">
  <div class="room" style="filter: blur(2.5px)">${pixelRoom({ width: 963, height: 700, variant: v })}</div>
</div>
<!-- the sprite rig goes after the panel (not inside it) so the head can break out above the panel top -->

<div class="facebg"><div class="room" style="filter: blur(3px)">${pixelRoom({ width: 1080, height: 1920, variant: v })}</div></div>
```

Room cells are 6 px and the sprite's pixels are 12–20 px on screen. Together with a 2–3 px blur
on `.room`, this reads as a background slightly out of focus. Previews and composites come from
the self-test that rendered these assets. It lives in the scratchpad, not the repo.
