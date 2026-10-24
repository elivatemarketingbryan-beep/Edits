# Style guide: what every format looks like

Written from frame-by-frame study of the reference samples at editing.ajenepinnock.com
(October 2026): the 18 in their pack and the 13 they list as coming soon. The 18 pack
samples use the **same 15-second script** ("posting every day but
still no clients → it's your system → hook, story, offer → do that for 30 days and watch
what happens"), so every difference below is pure design. That's the point: one video
can be edited in any style. These are our own descriptions, built with our own engines;
no assets or code from that product are used.

Read the shared look first, then the section for the style being built. `catalog.json`
holds the ids, engines and ranking cues.

---

## Shared look (applies to every style unless the style says otherwise)

- **Palette:** near-black / charcoal base, white type, **one accent colour** (reference uses
  burnt orange). Use the accent from `brand.json` instead: **purple on black**.
  Wherever this guide says "accent" or "orange", use `accent`; use `accentLight` for
  small accent text on black (it reads better), and `accentDeep` for glows and tints. Secondary accent only for
  meaning: green = done/success, red = zero/loss.
- **Accent words:** the key word of a line is set in an **italic serif** in the accent
  colour ("no *clients*", "it's your *system*"). Everything else is a clean bold sans.
  This one move is the signature of the whole pack; never skip it.
- **Hook card (first ~3s):** two-line hook at the top third. Line 1 white bold sans,
  line 2 black text on a white rectangle (or the whole hook in a white rounded box with
  black bold text on cut-out styles).
- **Captions:** short, 1-4 words, lower-case or sentence case, centred on the chest
  (just below the chin) for full-frame shots, between graphic and presenter for split
  shots. Driven by word timestamps.
- **Dark UI cards:** rounded, dark grey, thin light border, small avatar/icon, two text
  lines, optional coloured number on the right. Used for notifications, stats, lists.
- **Glow:** a soft accent-coloured radial glow behind graphics on black. No other effects.
- **Motion:** cards slide/fade up and stack; lists highlight the active row as it's
  said; grids fill cell by cell; numbers count up; line charts draw left to right.
  Everything is timed to the word that names it.
- **Story beats are visualised the same way across styles:** problem (zero counters,
  empty grid), reframe (accent word), steps (numbered list, active row lit), payoff
  (30-day grid fills, counter goes up, line chart rises).

## Sound (applies to every style)

**The full rulebook is `styles/SOUND-RULES.md`** (which sound for which moment, where
it lands, how loud, spacing). Short version: whooshes on transitions, risers building
into reveals, and every graphic that moves gets a sound that follows that motion. Place
them with `node studio/sfx.mjs` (see CLAUDE.md). Your past 37 split-screen edits
averaged **about 40 sounds a minute**: half were ticks and pops.

- **Cuts:** a whoosh that *peaks on the cut frame*. Vary the variant across the video
  (whoosh, whoosh-simple, whoosh-high, whoosh-med, whoosh-low, whoosh-data); use
  whoosh-simple or a softer volume going into or out of the presenter.
- **Things appearing:** pop (cards, chips, stickers, images), digital (notifications,
  toasts), open (panels, windows, documents), shutter (screenshots, proof).
- **Lists, grids, typing, counters:** one tick per row, cell, word or step. Fast runs
  at about 3 frames apart and a little quieter (0.12).
- **Lines and charts drawing:** stretch. Big numbers or title words slamming in: hit.
  Verdicts, tier locks, badges: stamp. Something failing or struck out: glitch.
  Money on screen: money / money2. Systems turning: gear / gear-tick. Data
  filling: data / data-short.
- **Payoffs:** riser or riser-short ending exactly on the reveal. At most one or two
  per short video.
- **Never over speech:** volumes stay 0.08-0.35 and the mix never ducks the voice.
  No sound on the presenter just talking; silence is allowed.
- Every placed sound is logged as an `sfx` edit, so on the review page the user can
  pause on it and say "turn this down" or "no sound here".

Style flavours (on top of the rules above):
- **Dense** (graphics on every beat): business-reel, explainer-panel, glass-explainer,
  split-reel, depth-ui, ranking, top-5-ranking, rapid-list, if-then-grid,
  this-vs-that, tips-breakdown, educational-youtube, screen-tutorial, youtube-clips,
  coaching-call-clips.
- **Light** (cuts and the few things that appear): personal-reel, visual-essay,
  broll-stacked-text, image-cluster, cutout-backdrop, cutout-grid, tiktok-style,
  yap-and-show, clone-versus, dual-role-dialogue, split-screen-lesson,
  lesson-document.
- **Minimal** (a whoosh or riser at most; let the words carry it): fitted-captions,
  cinematic-type (low whooshes and risers only), natural-story, ear-to-ear-captions,
  vlog (music-led; no UI sounds).

## Motion rules (from the Patrik Key breakdown, REFERENCES.md)

- **Nothing moves linearly.** Entrances ease out (start fast, settle slow: quad-out or
  power3-out); exits ease in. The only linear moves are slow background drifts.
- **Stagger by frames, not by feel**: word-by-word entrances 2 frames apart; list items
  3-4 frames apart.
- **Entrance about 0.6s, exit about 0.25s** with a blur-out, so lines leave faster than
  they arrive.
- **Make your own backgrounds** from the brand colours (`brand-background`), not stock
  loops that look like everyone else's.
- **Transitions are motion graphics, not presets**: a shape that grows to cover the
  frame, or a band wipe, timed to land exactly as the text finishes animating
  (`shape-transition`). Avoid stock dissolves and spins.
- **Glow sparingly**: one glowing element at a time, never on body text.

## Motion feel (applies to every style)

Two design skill packs are installed and apply to every style, not only split-screen:
`emil-design-eng`, `animate`, `animation-vocabulary`, `improve-animations`,
`review-animations`, `animation-performance` (from github.com/emilkowalski/skills)
and `apple-design`, `apple-liquid-glass` (from
github.com/naplesblue/apple-design-skill). Use them for easing, timing, spring feel and
glass materials when building any graphic, and run `review-animations` on a draft
before the user sees it. Glass cards in glass-explainer, youtube-clips, coaching-call-clips
and tips-breakdown follow `apple-liquid-glass`.

---

## Short form 9:16

### business-reel: Business reel
- **Layout switches on every cut** between three modes:
  1. Full-frame presenter, graphics *behind the head* (row of video cards) and hook text.
  2. Split: graphic on top half (black + glow), presenter fills bottom half.
  3. Full-screen animation, no presenter (glass pill list Hook / Story / Offer, active
     pill glows accent).
- Captions lower-case white, centred under the graphic; accent word italic serif.
- Proof objects: stacked notification cards, a document card with a highlighter sweep.

### personal-reel: Personal reel
- Presenter **full frame the whole time**; fast cuts.
- **One word on screen at a time**, at chest level; accent words italic serif.
- Small "stickers" pop in at the chest under the word: app icon, notification toast,
  mini diagram (three dots joined), progress grid in green.
- Occasional top-half **light-mode** UI card (white checklist "Your content system" with
  ticks) with the presenter under it.
- Own B-roll shots cut in full frame with the word over them.

### explainer-panel: Explainer panel
- **Black canvas with faint dot grid.** Presenter in a **rounded inset panel at the
  bottom ~25%** with side margins (not edge to edge).
- Top 60%: animated explainer. Title at top: white bold Title Case with the accent word
  in italic serif, underlined.
- Diagram vocabulary: node trees (icon → three boxes → result), numbered step table
  with accent left-bar on the active row, small circle "step" icons joined by lines,
  30-cell grid filling accent, "+0" counter with a rising line.
- Caption line sits between diagram and panel.
- Emphasis beats cut to **full-frame presenter** for 1-2 lines, then back.

### glass-explainer: Glass explainer
- Same layout as Explainer panel (dot-grid black, bottom presenter panel, title with
  italic accent).
- Every graphic is a **glass card**: frosted dark fill, thin bright edge, accent glow
  behind. Stat tiles with big numbers (30 / 0), an arc linking two cards with a label
  pill, step cards with thumbnails and a progress bar under them, a line chart in a
  glass frame with stat tiles beneath it.
- Feels more premium and 3D than Explainer panel; use when there are numbers.

### visual-essay: Visual essay
- Presenter **cut out** (background removed), placed in the **lower half on black** with
  an accent glow rising from the bottom.
- Evidence floats above the head: **white** social post cards, a headline/article card,
  a huge accent number with a small label ("0 new clients"), white before/after stat
  cards (0 → 12 with a rising line).
- Opening title over the chest in large italic serif ("Posting *Daily*") with a small
  sans subtitle.
- Presenter scales up (punch-in) on the reframe line.
- Captions small, white, between evidence and head.

### split-reel: Split reel
- **Presenter top half** (raw footage), **bottom half black** with accent glow.
- Bottom-half graphics are **typographic**: small italic-serif accent kicker ("most
  people", "step one") over **huge bold condensed ALL-CAPS** text with the key word in
  accent ("POST EVERY DAY AND GET **NO CLIENTS**", "**30** DAYS").
- Under the type: day tiles 1-7 with accent badges, step cards with italic serif names
  and accent pill buttons, a 30-cell grid filling accent with a "9/30" counter.
- Transitional lines cut to **full-frame presenter**. No separate captions; the type
  is the caption.

### broll-stacked-text: B-roll and stacked text
- Full-frame presenter, tight cut.
- **Stacked captions** at chest: a small lead-in line above ("and still get") and a big
  line below ("no *clients.*"): big word white bold sans + accent word in italic serif.
  Plain lines stay small.
- B-roll cuts in as a **16:9 clip letterboxed on black**, caption inside the frame.

### fitted-captions: Fitted captions
- Full-frame presenter, **no graphics at all**.
- Captions at chest: small white sans. On key lines, **one huge accent word in italic
  serif** with the small words *fitted around it* (above, beside, below: "and /
  ***watch*** / what happens.").
- The cheapest style to make; a safe default for any talking head.

### image-cluster: Image cluster
- Full-frame presenter. **1-3 photos** appear in the headroom above/left of the head,
  overlapping slightly at different sizes, swapping per idea.
- Captions are **small, quiet, left-aligned, two lines**, placed beside the head at
  shoulder height.
- Needs headroom in the footage.

### youtube-clips: YouTube clips
- Input: a long 16:9 video. Output: ranked 9:16 clips.
- Each clip gets the **Business reel treatment**: hook card on top (white + boxed line),
  reframed full-frame presenter, chest captions with italic accent, split shots with a
  glass card on top, full-screen dark slides with a numbered glass pill list, a big
  accent number above the head ("Day **30**").

### cutout-backdrop: Cut-out backdrop
- Presenter **cut out** over **full-screen images** (colour photos, slight grain) that
  change with every idea.
- Presenter **moves and rescales per idea**: small top-left, big bottom-centre, offset
  right, etc.
- Hook: white rounded box with black bold text, small subtitle under it. Opening frame
  can be a 4-image collage.
- Captions small white, centred mid-frame.

### cutout-grid: Cut-out grid
- Frame filled by a **2x2 image grid**; presenter cut out, **head and shoulders small,
  centred where the four images meet**.
- **All four images swap together** on each new idea.
- Hook white rounded box; captions small white across the chest.

### depth-ui: Depth UI
- Presenter full frame; a **dark app interface sits between background and presenter**
  (behind the head, in front of the wall): profile grid, analytics chart with a rising
  line, workflow checklist with ticks, 30-day calendar filling accent/green. Needs a
  person matte so the head occludes the UI.
- **Toasts in front** at chest level: dark pill with icon, text and a red/green number
  ("New clients 0", "+199%", "+10").
- Captions at chest; accent words italic serif with a soft glow.

### ranking: Ranking
- Presenter full frame. Top label in **accent bold italic caps** (the category, e.g.
  "CONTENT TACTICS").
- A **tier board** over the chest: rows S/A/B/C/D/E/F with coloured row labels (red,
  orange, yellow, green, blue, purple, pink).
- Each item appears as a **big thumbnail-style card** (bold caps title, image) over the
  board, then **shrinks into its tier row** when the tier is said.
- Caption above the board in white italic caps, active word highlighted yellow.

### tiktok-style: TikTok style
- Full-frame presenter, **no dead space at all**.
- Hook: two lines of white text on black highlight boxes at the top, with a tiny subtitle.
- Captions **small, two lines, white with a dark outline**, at chest.
- Pictures cut in as **shadowed image cards**: over the chest, or above the head.

### yap-and-show: Yap and show
- Presenter stays put, full frame. **Proof rotates above the head**: first 3 tall cards
  side by side, later a 3 + 2 grid of 5 cards. Images, video or screen recordings.
- Hook: text box with a strip of proof screenshots above it.
- Small chest captions. Needs headroom.

### clone-versus: Clone versus
- **Two of you side by side**, both visible all the time (two takes, cut out and placed).
- Labels above each: name in accent bold ("Average creator" / "Smart creator") with a
  small grey subtitle.
- Whoever is speaking gets a **white caption label** beside them, and proof cards
  (accent label + image) under their side.

### dual-role-dialogue: Dual-role dialogue
- Two roles (e.g. NOVICE / THE ALGORITHM), shown as two columns; **the active role is
  bright with its label in accent, the other dimmed**. Can also cut full screen
  between them.
- A white pill at the top sets the scene ("POV: you ask the algorithm").
- Captions on the speaker's chest.

### cinematic-type: Cinematic type
- Footage and B-roll **graded black and white** with a slight colour fringe.
- **Huge white italic serif word** centred ("more", "keep"), then a small bold sans line
  under it in accent or white ("reps.", "going.", "already done.").
- Alternates presenter and B-roll (skyline, road) phrase by phrase.

### top-5-ranking: Top 5 ranking
- Board on the top half: title ("Ranking content skills"), rows 1-5 with number boxes;
  #1's box is in accent.
- Each pick **drops into its row when said, in any order**, with a small coloured icon
  tile and a label.
- Presenter below; chest caption ("this one is my number 3").

### vlog: Vlog
- Mostly clips, few talking-head shots. Clips in time order.
- Small **timestamp label top-left** ("DAY 1 · 07:42"), small centred captions.
- Cuts on beats or on voiceover phrases.

### if-then-grid: If/then grid
- Top half black with a **4-column grid**, each column header a different colour
  (pink, blue, yellow, green).
- **Cells fill row by row** as each if-then is said; the active cell is outlined.
- Caption under the grid; presenter in the bottom half.

### this-vs-that: This vs that
- A **T-chart above the head**: two italic serif headers in green and red ("Always" /
  "Never"), a rule under them and a divider down the middle.
- Each thing named **drops into its column** as a small chip.
- Spoken examples appear as an accent quote callout above the head. Chest captions.

### rapid-list: Rapid list
- Accent title pill at the top ("24 viral formats").
- **Two numbered columns flanking the head** (1-12 left, 13-24 right) fill in as each
  item is said.
- The current item pops as a **coloured card with a big number** at the chest.

### natural-story: Natural story
- Real room footage, warm and calm. **Pictures, quote cards and clips appear around and
  partly behind the head** (person matte), a few at a time.
- Small, quiet chest captions.

---

## Long form 16:9

### ear-to-ear-captions: Ear to ear captions
- Centred talking head. **Words sit either side of the head at eye level**, left side
  first then right, each fading from grey to white as it's said.
- Nothing else on screen.

### tips-breakdown: Tips breakdown
- **Chapter marker per tip**: full-screen dark slide, "5 TIPS" title in accent, a row of
  numbered cards with the active one large and in accent, an accent glow arc along the
  bottom.
- Presenter shots with a glass card on one side and italic serif accent text on the
  other; bullet lists beside the presenter with accent dots.
- Title beats: huge bold caps word ("CONFIDENCE") with an italic serif accent line
  under it.
- Full-screen diagram beats (e.g. many grey pills, one accent pill that stands out).

### screen-tutorial: Screen tutorial
From the Iman Gadzhi Gemini tutorial breakdown (styles/REFERENCES.md).
- **Cold open** on the widest, most cinematic angle for 1-2s, then the main medium shot.
- **Angle changes every few lines**: real second/third cameras if filmed, otherwise
  punch-ins (100 / 115 / 130%) on sentence boundaries. Nothing static for more than ~15s.
- **Screen demos keep the face**: the recording sits in a rounded window on a brand
  gradient (purple to deep blue), the presenter in a portrait card on the right.
- **Chapter tracker** at every section break: a dark grid of chapter cards, the current
  one lit in accent, finished ones dimmed; the full grid closes the video.
- **Tool icons** pop in beside the head in a column the moment each tool is named.
- **Side words**: italic serif concept words in the empty space beside the head, with
  a hand-drawn underline on the key line.
- **Proof beats**: full-frame screenshots or stat slides on black; level meters for tiers.

### educational-youtube: Educational YouTube
- Mostly full-frame presenter with **floating dark cards** top-left (habit tracker,
  "Day 8" grid filling to "Day 30" with a green line).
- **Split**: left half graphic on black with accent glow, presenter right.
- **Full-screen animation** beats: numbered step cards 1-2-3, active card tinted accent,
  a chart drawing inside the card.
- Few or no captions.

### split-screen-lesson: Split-screen lesson
- **Left ~third: white teaching document**, right two-thirds: presenter.
- The document **scrolls to the section being talked about**, with a yellow
  highlighter on the current line.
- Document look: serif headline with italic accent word, bullet lists, a flow diagram
  (Hook → Story → Offer boxes, last one filled black), a black callout bar with an
  accent word, small accent label tags, a 30-day grid.
- Some beats cut to full-frame presenter with a floating dark card.

### coaching-call-clips: Coaching call clips
- Input: a full call. Opening card: "Full call in. *Ranked* clips out." over a waveform
  with the chosen segments highlighted in accent.
- Clips stay 16:9. Speaker framed **right**; graphics sit **left beside them**: glass
  card with day tiles and a "0" counter (red), numbered pill list, big accent "30".
- Captions lower-centre-left, white with italic accent.

### lesson-document: Lesson document
- Builds the white document used by Split-screen lesson: serif title ("How to turn
  posting into *clients*"), image placeholders, sections "Part 01: how do you stop the
  scroll?", a dotted timeline, framework pill flow, a curve chart, flow diagrams.
- Output is both the scrolling panel for the video and a standalone document.

---

## Edit review (the preview-and-notes step)

What the reference review screen shows, and what ours must have:

- **Top bar:** job picker, length and edit count, status pill, buttons "Copy notes for
  Claude", "Request changes", "Approve and render final" (the one bright button).
- **Player:** Play, -5s, +5s, time, speed; toggle **Edited / Original footage**;
  "+ Note here (N)" adds a note at the playhead.
- **What's on screen now:** chips for each edit active at the playhead (Cut, Caption,
  Audio, Sound effect, Motion graphic, Headline), each with Claude's one-line reason and
  "Note on this".
- **Timeline:** colour-coded tracks for those edit types plus "My notes", zoomable.
- **Side panel tabs:** Notes / Edits / Transcript. Notes filter Open / Done / All; each
  note shows its timestamp, the note, **Claude's reply under it**, and Reopen / Edit /
  Delete.

This means every edit must write an `edits.json` (type, start, end, what, why) so the
review page can show it.
