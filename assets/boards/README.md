# Elivate board library

74 animated explainer boards (1920 x 1080 HTML) in the Elivate premium look: Ink stage, Violet floor glow, grain, Inter and
Playfair italic, purple for structure, gold for money and results. Open `index.html` in Chrome to watch them. To pick one
from a spoken line, use `CATALOG.md`, or `styles/LIBRARY.md` for everything.

Layouts and motion come from [sirioberati/YouTube-AI-Motion-Graphics](https://github.com/sirioberati/YouTube-AI-Motion-Graphics)
(commit dc1ccb1, MIT, see `LICENSE`). Colours, type, stage and placeholders were converted by `tools/restyle.py`.

## Using a board in a video

Run the flow in CLAUDE.md "How an edit runs" (`studio/edit.mjs`). A finished plan looks like `projects/202611082355-untitled-youtube-video/boards/funnel-stages.plan.json`; the format is at the top of `studio/board-fit.py`, and `--list <board>` numbers a board's parts.

## Rebuilding after a look change

`python tools/restyle.py <his boards folder> .` then `python tools/sheets.py . <work folder>` makes contact sheets to check by eye.

After a rebuild, run `node studio/library.mjs` so the gallery keeps the approved row. `premium/` holds graphics Bryan approved on real videos, with their real content.
