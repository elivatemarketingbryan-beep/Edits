# Reference breakdowns

What we learned from studying other creators' videos, written as techniques we can
reuse. Descriptions only; no footage, graphics or words are copied.

---

## Iman Gadzhi: "You're Not Late (Yet): Learn 98% of Gemini in Under 26 Minutes"

youtu.be/_FGrUBi7Zno · 23:45 · 16:9 · Aug 2026 · ~417K views at study time (Oct 2026).
Studied from frames across the whole video (YouTube's preview thumbnails every 10s,
plus dense frames through the first 90s). The transcript couldn't be downloaded
(YouTube rate limit), so this is about the picture and structure, not the script.

**Format:** a long-form tutorial ("learn the whole tool in one sitting") with 12 chapters
in the description, one per feature. Mostly a seated talking head, broken up every few
seconds by one of the devices below.

### What he does, and how we'd use it

| # | Technique | What it looks like | How Video Studio uses it |
|---|---|---|---|
| 1 | **Cinematic cold open** | First shot is a wide, golden-hour establishing shot of him at a table by the window, then a cut to the medium shot as he starts talking | Long form: open on the widest or prettiest angle for 1-2s before the first line. One camera: start on a slow push-in from wide |
| 2 | **Three camera angles** | Front medium (main), side angle with the window and city behind him, wide. The angle changes every few lines | One camera: fake it with punch-ins (100% / 115% / 130% crops) on sentence boundaries; never the same framing for more than ~15s |
| 3 | **Tool icons pop in beside him** | Glossy 3D app icons (the AI tools he names) appear next to his head the moment he says them, stacking in a column | `pop` sound per icon; logos via media-use; works in reels too |
| 4 | **Mascot segments** | A 3D cartoon version of himself in front of a city skyline, with a bullet list ticking in beside it ("More money / More efficient / Less boring") | A personal mascot for intros and promise lists. Needs a mascot image of the user; then it's a `motion-background` + list beat |
| 5 | **Proof screenshots** | A real stock-price screen (the company's market cap) shown full frame; a bold stat slide on black ("80 years of content") | `article-highlight` or a full-screen screenshot with a highlighted number; `counter` for the stat |
| 6 | **Level meters** | Three glass vials (Beginner / Intermediate / Advanced) filling green, blue, purple; later a single big battery-style meter "Beginner 25%" | New template: **level-meter** (vials or bars filling to a %), used for tiers, progress, "how far you are" |
| 7 | **Chapter tracker** | A dark grid of chapter cards ("Mastering Gemini") that comes back between sections and lights up the current chapter; the full grid closes the video | New template: **chapter-tracker**. The single best retention device in the video: viewers see where they are and what's left |
| 8 | **Screen demos with his face kept on** | The screen recording sits in a rounded white window on a purple-blue gradient, with him in a small portrait card on the right | New style: **screen-tutorial** (below) |
| 9 | **Side words** | Italic serif words appear in the empty space beside his head as he names them ("Memory", "Chat history"), sometimes with a hand-drawn underline or scribble; a key line ("This all comes down to context") gets a purple underline | Already close to ear-to-ear-captions and the italic-accent rule; use for named concepts in long form |
| 10 | **Tips in negative space** | Short bullet tips appear on the window side of the frame while he talks | Bullet list beside the presenter (as in tips-breakdown) |
| 11 | **Search bar moments** | A clean "What can I help with?" chat bar appears when he talks about prompting | Our `search-bar` template |
| 12 | **Brand mark reveal** | The tool's logo alone on black, as a chapter-opening sting | A 1s logo sting before a big section |
| 13 | **Own-product plug mid-video** | The mascot introduces his own consulting offer, with a price card | A branded CTA segment around the middle, built from the mascot + `counter` |

### Pacing notes
- Something changes on screen every ~5-10s: angle, icon, text, screen, or slide. Pure
  talking-head stretches without any change are rare and short.
- Screen recordings never take over the frame without his face; the PiP card keeps the
  personal connection during demos.
- The chapter tracker returns at each section break, so a 24-minute video feels like
  12 short ones.

### For reels (9:16)
- **Chapter tracker as a "part X of Y" bar** at the top of multi-part series.
- **Level meter** for "beginner vs advanced" hooks.
- **Icon pop-ins** above the head when naming tools (works with image-cluster and depth-ui).
- **Screen demo split**: screen recording in the top half, face in the bottom (the
  split-reel layout with a real screen instead of a diagram).
- **Mascot** for a recurring series intro.

---

## Dan Martell: "Give me 54 Seconds and I'll Make you Dangerously Motivated"

youtu.be/r6zFZQm0hcc · 0:54 · 16:9 · ~7.2M views (Oct 2026). Studied frame by frame for
captions; the full caption system is written up in `styles/CAPTIONS.md` and built as the
`captions` template.

- One quiet running caption (white bold rounded sans, lower third, building word by
  word) carries the whole video; a different loud treatment hits only the key lines.
- Loud treatments: purple gradient italic serif across the top (behind the head),
  huge white caps word letter by letter (behind the head), red strike-through then a
  purple replacement word, scattered italic serif over black-and-white B-roll, red
  italic caps for the one direct command.
- Captions also visualise the words: the speaker cut out over an abstract purple and
  teal background while glowing circles grow one by one for "progress over time".
- B-roll every few lines (black-and-white portraits, wide cinematic shots, a supercar
  on a road), each with its own smaller caption treatment (typewriter, blur-in).
- A short colour shift (teal grade) marks the turn from problem to answer.

---

## Aeovisuals: "How To Make VIRAL Captions in CapCut"

youtu.be/oUU1Lj7hcNU · 12:48 · 16:9 tutorial · ~203K views (Oct 2026). Studied the
finished examples in the intro and the preview window through the tutorial.

- The "viral text style" is a **stacked block**: one huge word with small words tucked
  above, beside or below it, tight leading, one word in a colour. Built as caption mode
  `stack`.
- **Hand-drawn white arrows** curving toward the speaker next to small notes. Built as
  `pointer`.
- **Red paint-brush strokes** (transparent PNGs from a pack) slashed across a huge white
  word. Built as `brush`, drawn instead of using a pack.
- Captions are keyframed into position above the head with **eased curves** (ease in
  and out, not linear): our templates already ease every move.
- Other finished-look devices in the intro: a big number with a small lead-in word
  ("3 million" style), one coloured keyword over a dark cinematic shot, single small
  words over wide B-roll, a social stats card (views / likes), a dashed-circle wipe
  transition, and three phone mockups showing example edits side by side.
- He works in CapCut: everything here can also be rebuilt by hand in CapCut, but our
  `captions` template renders the same looks as a transparent overlay to drop on a
  track above the cut.

---

## Patrik Key: "Make Your CapCut Edits Look Like After Effects"

youtu.be/Uwu9_aGpDJ4 · 16:02 · 4K · ~221K views (Oct 2026). Audio transcribed locally
with WhisperX (16 minutes in 40s on the RTX 4070) and read for techniques; the
transcript itself isn't kept here.

What he teaches, and where it went in Video Studio:
- **Slide-up / slide-down captions**: every word split onto its own layer, each 2 frames
  after the previous, sliding into place; exit with a blur-out; animation speed about
  0.6s. Built as caption mode `slide`.
- **Custom backgrounds**: two colour layers, a feathered mask (circle, reversed circle,
  diagonal split) between them, then a texture (TV lines at low range, or a light asset
  frozen and blended with Screen at low opacity), then temperature, exposure and curves.
  Built as the `brand-background` template.
- **Shapes and colour morphs**: a solid shape keyframed from one colour to another, a
  circle keyframed into a rounded rectangle (corner radius 100 to 15), with "quad out" /
  auto-curve easing so it starts fast and settles; a stroke made from a scaled, brightened
  duplicate; Glow 2 for a glow. Used in `shape-transition`; easing is now a written rule.
- **Motion-graphic transitions**: a film-strip (band) mask wipe timed to land exactly
  as the text finishes animating; a bouncing ball that grows to become the next scene's
  background. Built as `shape-transition` (`bounce` / `band`).
- **Deep Glow look** (CapCut's Glow 2 on a compound clip): don't overuse it.
- CapCut note for doing these by hand: he uses CapCut 6.4.0; most of these need a
  compound clip first.
