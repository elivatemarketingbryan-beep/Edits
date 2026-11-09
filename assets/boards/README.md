# Elivate board library

74 animated explainer boards (1920 x 1080 HTML) in the Elivate premium look: Ink stage, Violet floor glow, grain, Inter and
Playfair italic, purple for structure, gold for money and results. Open `index.html` in Chrome to watch them. To pick one
from a spoken line, use `styles/BOARDS.md`.

Layouts and motion come from [sirioberati/YouTube-AI-Motion-Graphics](https://github.com/sirioberati/YouTube-AI-Motion-Graphics)
(commit dc1ccb1, MIT, see `LICENSE`). Colours, type, stage and placeholders were converted by `tools/restyle.py`.

## Using a board in a video

1. `node studio/board-ideas.mjs <job id>` suggests boards from the transcript.
2. `python studio/board-fit.py --list <board>` numbers the parts. Write a plan (`projects/<id>/boards/<name>.plan.json`; format at the top of `studio/board-fit.py`) with the real words and the spoken word each part lands on. Example: `projects/202611082355-untitled-youtube-video/boards/funnel-stages.plan.json`.
3. `python studio/board-fit.py <plan>` writes the board: sample tag gone, speaker box removed if asked, timed to the voice. Copy `assets/boards/assets` beside it if the board uses footage placeholders.
4. Render: `npx --yes hyperframes@0.7.68 render -c <name>.html --format mp4 --quality high --frames-cache-dir off -o <name>.mp4` from that folder.
5. Show the still for approval like any other graphic (`graphics.json`). `studio/preflight.mjs` refuses a board with a SAMPLE tag or "example data" left on it.

## Rebuilding after a look change

`python tools/restyle.py <his boards folder> .` then `python tools/sheets.py . <work folder>` makes contact sheets to check by eye.
