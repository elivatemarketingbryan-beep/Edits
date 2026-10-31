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

## Premium finish (applies to every video, every style)

Bryan's standing rule (Oct 31 2026): these effects from Patrik Key's caption-styles video
(youtu.be/Q04FF5KZyt4, details in styles/CAPTIONS.md) go on **every** edit, short or long, on top of
whatever the style is. They're what makes an edit read as premium rather than default CapCut.
A style that says otherwise (e.g. floating-window's no-motion rule) keeps its own rule for that item.

1. **Tight type.** Every caption and title font gets letter-spacing -1 to -2 (`-0.01em` to `-0.02em`).
2. **Two or three motions, never one.** Every caption line and title combines at least two (slide up +
   blur-in, pop + baseline rise, drop + bounce); a plain fade or a single default preset is not enough.
3. **Power words.** At least one line in every ~15 s gets a treated power word: `power-split` behind or
   across the head, a `box` around it, or a `gradient` / `premium` look, in brand purple.
4. **Premium look on the key captions.** The hook line, the CTA and every number on screen use the
   `premium` look (crisp white offset copy behind a purple fill) or the `gradient` look.
5. **One shine per video.** The logo, the main title or the CTA gets a single `shine` sweep. Once.
6. **Flicker on the turn.** The big reveal or reframe line enters with `flicker` (6 frames), at most
   once or twice per video.
7. **Defaults are banned.** No CapCut/template default animation used as-is: change its duration,
   easing or masking so it doesn't look like everyone else's.

All of these are in the `captions` template (`node studio/anim.mjs new captions ...`); tracking is
tight there by default. A HyperFrames edit with its own captions applies the same rules inline.

### Control: what every edit can do, frame-exact
From Zeven 7's "7 Stupidly Simple CapCut Tricks" (youtu.be/odxTRtU0HH8, REFERENCES.md). Bryan's rule
(Oct 31 2026): the studio's editor has this level of control and uses these on every video where they fit.

| Trick | Use it for | How here |
|---|---|---|
| **Keyframes with curve handles** | Any motion. Bouncy versions use 3-4 keyframes: fast move, a small reverse, settle | GSAP: `back.out(2-2.5)` or explicit keyframes; the running caption slides up with a bounce by default |
| **Shading** | Depth on any flat background, object or clip: a feathered gradient or vignette instead of a flat fill | Graphics: a feathered radial/linear gradient (mask with feather). Footage: `node studio/fx.mjs shade` |
| **Shine** | Captions, titles, logos, icons on coloured or dark grounds | Caption look `shine` (pair with `premium`) |
| **FPS lag** | Motion-design beats that should feel deliberate and choppy, 10-20 fps | `node studio/fx.mjs lag --from --to --amount 12` on footage; `SteppedEase` / stepped time in HyperFrames graphics |
| **Warp (wide angle, fisheye)** | Depth on a flat 2D graphic or shot, a punchy moment | `node studio/fx.mjs wide` or `fisheye --amount 0.2-0.5`, on a short range |
| **White flash reveal** | Revealing words or a new shot: each word lands under a white box for one frame, words 2 frames apart | Caption look `flash`; on footage `node studio/fx.mjs flash --at` |
| **Negative text** | A caption that is a window of inverted footage (only the letters invert) | Caption look `negative` on its own overlay, then `node studio/fx.mjs negative --overlay` |

Every effect takes an exact range (`--from`/`--to` in seconds, or a word's timing), so any one can be
placed on a single word or beat. As with every graphic, show a still of each before rendering.

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
  this-vs-that, paper-collage, tips-breakdown, educational-youtube, screen-tutorial, youtube-clips,
  paper-cut-out, sofa-wall, graph-rise, orbit-spin, phone-frame, news-wall,
  interface-world, tick-list,
  coaching-call-clips, faceless-sprite (its engine places them itself), brand-motion (its
  own synced score), motion-promo, nextphase-short, nextphase-long, screen-share-demo,
  glow-motion, cobalt-cut-paper.
- **Light** (cuts and the few things that appear): personal-reel, visual-essay,
  broll-stacked-text, image-cluster, cutout-backdrop, cutout-grid, tiktok-style,
  yap-and-show, clone-versus, dual-role-dialogue, split-screen-lesson,
  lesson-document, magazine-cover, pixel-zoom, sketch-boil, glass-text,
  pull-out-reveal, dolly-zoom, frame-pop, punch-through-cut, green-screen, film-grade-short,
  story-montage, silhouette, film-grade, mono-explainer, cinematic-authority (dense in the hook only),
  keynote-glass (dense in the cold open only), screen-side-cam (clicks and whooshes on screen changes).
- **Minimal** (a whoosh or riser at most; let the words carry it): fitted-captions,
  cinematic-type (low whooshes and risers only), natural-story, ear-to-ear-captions,
  vlog (music-led; no UI sounds), floating-window (hard cuts, no UI sounds).

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

### paper-collage: Paper collage
Documentary cut-paper collage (from the "Vox style" pack, Oct 2026), approved on reel 10 of the
reviews job. Template: `presets/paper-collage/index.html`. This style swaps the shared look's black
base for **aged paper**; the accent stays the brand purple (the pack's red), `accentLight` takes the
pack's mustard.

- **Stage:** archival tan paper (`#D9CDB2`), print grain, faint ledger rules, burnt edges. A slow 2%
  camera drift over the whole reel.
- **Speaker:** a **torn archival photo** in the lower half (white keyline, purple offset stroke behind,
  tilted ~1.5°), labelled with a light-purple tag "Fig. 1 — Bryan, Elivate". No matte needed.
- **Graphics in the top half, one per beat**, each a torn paper piece with a purple offset stroke:
  stat hero (old number struck through in purple → arrow drawn → new number on a torn purple tag that
  springs in and counts up), newspaper clippings (mono label + big condensed value), graph paper with
  an ink line drawing on and purple map pins dropping on the named points, a ledger (month cells
  filling), a paper disc flywheel with cut-out chips, rubber stamps (WINS, TRUST, HALF SOLD) slamming on.
- **Type:** headlines and numbers in League Gothic caps, labels in Space Mono, captions in Oswald.
  Every headline's key line gets a hand-drawn purple underline swipe.
- **Alert wash:** once per reel, on the turn ("same 60 reviews"), the whole frame floods purple for
  ~0.4 s with the line in white caps, then the next graphic lands.
- **Captions:** black label tape over the bottom of the photo, white caps, key word light purple,
  purple offset shadow; each line pops on with a little rotation.
- **Motion:** springs with overshoot (`back.out(2.2)`), staggered entrances, ticking counters, stamps
  drop from 2.4× scale in 0.22 s. Red (loss) is not used; strike-throughs are purple.
- **Long form 16:9:** same stage; the photo card sits right of centre (about 55% of the width), the
  graphics stack on the left.
- **AI B-roll (optional):** where a beat needs real depth (a full-screen diorama, a moving map), generate
  a 4-6 s clip with `styles/AI-BROLL.md` and drop it in as a torn photo; everything else stays HyperFrames.

### nextphase-short: NextPhase short
- Built by the `nextphase-short-editing` skill (creator pack, Oct 2026): its SKILL.md and `reference/` are the look, frame by
  frame. Its "Video Studio" block on top overrides it: brand purple instead of its own colours, the studio job
  instead of its intake, graphics approved as stills before rendering, studio sounds.
- Hook, face, body, CTA; real media on every claim, highlighter, dense sound.
- Status draft until Bryan approves a first edit; then record what worked here.

### film-grade-short: Film grade short
- Built by the `nextphase-persa-shorts` skill (creator pack, Oct 2026): its SKILL.md and `reference/` are the look, frame by
  frame. Its "Video Studio" block on top overrides it: brand purple instead of its own colours, the studio job
  instead of its intake, graphics approved as stills before rendering, studio sounds.
- Warm film grade, one-word hard-cut captions, your head over big words.
- Status draft until Bryan approves a first edit; then record what worked here.

### floating-window: Floating window
- Built by the `zak` skill (creator pack, Oct 2026): its SKILL.md and `reference/` are the look, frame by
  frame. Its "Video Studio" block on top overrides it: brand purple instead of its own colours, the studio job
  instead of its intake, graphics approved as stills before rendering, studio sounds.
- A rounded window on black, one serif line above, no motion at all.
- Status draft until Bryan approves a first edit; then record what worked here.

### faceless-sprite: Faceless sprite
- **No camera.** The voice is a voiceover (Bryan's ElevenLabs clone, or a phone recording); the
  on-screen "presenter" is a **pixel-art sprite of Bryan** that lip-syncs and gestures, in a small
  room panel at the bottom or full screen for direct instructions.
- Top of frame: a **browser card** whose page literally shows what's being said (post, article,
  chat, app gallery, list, stat tiles, chart, code/terminal, landing page, search results, pricing
  table, Notion-style doc, or a real capture). Something moves on it every 0.5-1 s: highlight
  sweeps, rings, cursor clicks, counters rolling up, zooms, scrolls, swipes to a new card.
- Scene types alternate light and dark: hook (title + red/accent box) → proof (dark, tall card) →
  reveal (white, "It's called...") → split (card + captions + sprite) → compare (two cards) → face
  (full-screen sprite, 1-2 per 30 s) → CTA lockup (*comment* over **KEYWORD**).
- Captions 1-3 words, lowercased; payoff words in serif italic filled with the accent gradient;
  brand and tool names glitch in; one promise verb stretches.
- Jump-cut voice pacing: pauses trimmed to under ~0.14 s, leveled to -14 LUFS.
- Accent comes from `engines/faceless/brand.json` (purple #8B5CF6); the dot-grid backgrounds and
  every curve and timing are the engine's (`engines/faceless/style/HOUSE_STYLE.md`, `STYLE_BIBLE.md`).
- **The engine places its own sounds** (whooshes, risers, swells, ticks and a music bed timed to
  the plan); don't run `studio/sfx.mjs` on top.

### brand-motion: Brand motion
- **The logo is the character.** One part of the Elivate mark (the hero part) forms, pops out,
  multiplies and comes home; the story is a metaphor found in the mark.
- Arc: hook (claim, 1.5-2.5 s) → spark → build (features land on the beat) → tension → payoff
  (the pop) → proof (stat, tiles, site showcase) → resolve (logo home, wordmark, CTA).
- Kinetic type 1-3 words per beat, uppercase display fonts, every cut and text hit on the beat
  (110-128 bpm) or, with a voice, on the word. Motion blur on everything at 60 fps.
- Purple on black from `styles/brand.json`; text kept inside y 230-1520, x 70-930 (platform UI).
- Raw-clip mode keeps the speaker on screen most of the time: hook overlay, word captions,
  punch-in zooms on emphasis words, sticker callouts, one or two full-screen inserts, branded close.
- **Makes its own original score and syncs every sound to the same timeline**; don't run
  `studio/sfx.mjs` on top.

### motion-promo: Motion promo
- **No presenter.** A tight voiceover (pauses cut, noises dropped, mastered) carries a 60 fps
  motion-graphic ad that feels like a motion designer's portfolio piece.
- One visual beat per phrase, from tested patterns: count-ups (odometer digits), drop-flip
  word swaps, animated checklists, beat-cut kinetic words, a phone or browser showcase of real
  screenshots, and an offer card to close.
- Real assets only: screenshots, logos and colours captured from the actual site.
- Elivate's own promos use the brand purple on black, Inter + Playfair Display; promos for other
  products take that product's captured colours.
- Sounds follow `styles/SOUND-RULES.md`, placed by the skill's `sfx.mjs` from `assets/sfx`.

### video-fx-styles: Video FX styles

Seventeen 9:16 styles, each led by one Video FX effect (`engines/video-fx`); the catalog's
`fx` is the skill (`fx-<fx>`), whose SKILL.md is the look, frame by frame, and
`engines/video-fx/docs/EFFECTS.md` has every effect with its example. Names follow the
"claude can create" reel reference (Oct 2026), which shows all 17 in a phone window over
the speaker. Rules for all of them:

- The leading effect gets 1-3 ranges at the script's strongest beats; 1-2 other effects
  can join it where they fit (2-4 effects per 30-60 s reel in all, or whatever a picked
  combo stacks). Between effects the clip plays clean with the effect's caption look.
- Brand overrides the effects' defaults: captions accent `#C4B5FD`, graphics in the
  brand purples (skill "Video Studio" blocks).

### paper-cut-out: Paper cut out
- Skill `fx-paper-cut`: speaker as a paper sticker over scribbles and ransom-note letters. Needs a person cut-out.
- Best for: growth, numbers or results; a hook that needs to look handmade.

### magazine-cover: Magazine cover
- Skill `fx-cover-story`: giant serif masthead rising behind the head. Needs a person cut-out.
- Best for: naming one big idea or product; a title moment or hook.

### sofa-wall: Sofa wall
- Skill `fx-couch-wall`: wall of reel thumbnails with view counts behind the speaker. Needs a person cut-out.
- Best for: social proof: views, posts, a body of work; talking about content, courses or a channel.

### pixel-zoom: Pixel zoom
- Skill `fx-digital-zoom`: punch-ins with zoom blur on key words.
- Best for: one-take talking head that needs energy; any script; no b-roll needed.

### sketch-boil: Sketch boil
- Skill `fx-doodle-boil`: hand-drawn outline boiling round the speaker, doodles drawing on. Needs a person cut-out.
- Best for: a hook, punchline or turn; playful or personal moments.

### graph-rise: Graph rise
- Skill `fx-chart-grow`: line chart drawing behind the speaker, spiking to a glowing label. Needs a person cut-out.
- Best for: growth, numbers and results; [NUMBER] cues.

### glass-text: Glass text
- Skill `fx-glass-type`: 3D glass word standing on the wall. Needs a person cut-out.
- Best for: naming one big idea; a single key word worth a beat.

### orbit-spin: Orbit spin
- Skill `fx-orbit`: cards orbiting the speaker, passing behind and in front. Needs a person cut-out.
- Best for: social proof: past videos, results, press; listing many things; an eye-catching hook.

### pull-out-reveal: Pull-out reveal
- Skill `fx-pull-back-reveal`: pull back to show the shot inside an editor app with a % counter.
- Best for: behind the scenes, "how I made this"; results and process.

### phone-frame: Phone frame
- Skill `fx-phone-mockup`: floating phone beside the speaker, a chat typing itself out. Needs a person cut-out.
- Best for: showing an app, DM or result; the exact message or prompt.

### dolly-zoom: Dolly zoom
- Skill `fx-vertigo`: room zooms, speaker locked in place. Needs a person cut-out.
- Best for: a hook, realisation or turn; dramatic beats.

### news-wall: News wall
- Skill `fx-headline-wall`: headlines, tweets and search cards pinning to the wall. Needs a person cut-out.
- Best for: news, buzz, "everyone is saying"; citing sources.

### frame-pop: Frame pop
- Skill `fx-frame-break`: video shrinks into a Reels frame, speaker breaks out over the edge. Needs a person cut-out.
- Best for: posting, going viral, "this exact video"; a 3D hook in the first second.

### punch-through-cut: Punch-through cut
- Skill `fx-zoom-through-cut`: zoom-blur rush from one shot into the next.
- Best for: joining two takes or scenes; a hard turn in the script.

### green-screen: Green screen
- Skill `fx-green-screen`: speaker cut out onto a new background (app UI, image, video). Needs a person cut-out.
- Best for: showing an app or result behind you; changing scene without reshooting.

### interface-world: Interface world
- Skill `fx-ui-world`: chat app fills the top, clips drop in, a command types itself. Needs a person cut-out.
- Best for: a workflow that starts in an AI chat; showing the exact command to type.

### tick-list: Tick list
- Skill `fx-checklist`: frosted-glass checklist typing in and ticking as steps are said. Needs a person cut-out.
- Best for: steps or a process; [STEP] cues.

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

### screen-side-cam: Screen + side cam
**A layout, not a look**, taken from Riley Brown's "My AI Setup Feels Like Cheating (Here's All of It)"
(youtu.be/YT0u2eQ-Aj4, Oct 2026), measured off a frame. Use it for the screen-demo parts of a long-form
video; it can sit under any style's graphics (captions, cards, accents follow `brand.json`).

Geometry at 1920x1080:
- **Ground:** white (`#FFFFFF`) with a light grey dot grid (~3px dots, ~48px apart). Dark mode variant:
  `#0D0B14` with faint purple dots.
- **Screen card:** x 26, y 81, 1629x917 (about 85% x 85%), left-aligned, corner radius ~16px, soft shadow,
  no border. The screen recording fills it (scale to fit, crop the menu bar if it's noise).
- **Face-cam card:** x 1668, y 372, 225x336 (portrait 2:3), vertically centred, ~13px right of the screen
  card, corner radius ~6px, face cropped head and shoulders.
- **Progress bar:** full width along the bottom, ~25px tall, brand purple (`#8B5CF6`); it fills left to
  right with the video's runtime (his is orange-red).
- **Between demos:** full-frame talking head with small list cards top-right (pill title + bullet lines),
  as in his intro.
- Motion: the screen card and face card stay put; zoom inside the screen card to the area being used.
- Status draft until Bryan approves a first edit; then save the template in presets/screen-side-cam/.

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

### nextphase-long: NextPhase long-form
- Built by the `nextphase-long-editing` skill (creator pack, Oct 2026): its SKILL.md and `reference/` are the look, frame by
  frame. Its "Video Studio" block on top overrides it: brand purple instead of its own colours, the studio job
  instead of its intake, graphics approved as stills before rendering, studio sounds.
- Cold open, chapters, re-hooks; layout rotation and real media on every claim.
- Status draft until Bryan approves a first edit; then record what worked here.

### screen-share-demo: Screen-share demo
- Built by the `nextphase-screenshare` skill (creator pack, Oct 2026): its SKILL.md and `reference/` are the look, frame by
  frame. Its "Video Studio" block on top overrides it: brand purple instead of its own colours, the studio job
  instead of its intake, graphics approved as stills before rendering, studio sounds.
- Like a live screen-share: your camera travels between full, half and a corner card.
- Status draft until Bryan approves a first edit; then record what worked here.

### glow-motion: Glow motion graphics
- Built by the `motiongraphics` skill (creator pack, Oct 2026): its SKILL.md and `reference/` are the look, frame by
  frame. Its "Video Studio" block on top overrides it: brand purple instead of its own colours, the studio job
  instead of its intake, graphics approved as stills before rendering, studio sounds.
- Violet glow: lit glass tiles, self-building diagrams, slam headlines.
- Status draft until Bryan approves a first edit; then record what worked here.

### cobalt-cut-paper: Cobalt cut-paper
- Built by the `vibecode` skill (creator pack, Oct 2026): its SKILL.md and `reference/` are the look, frame by
  frame. Its "Video Studio" block on top overrides it: brand purple instead of its own colours, the studio job
  instead of its intake, graphics approved as stills before rendering, studio sounds.
- Cut-paper collage on a saturated ground: torn notebook cards, hand-drawn X marks.
- Status draft until Bryan approves a first edit; then record what worked here.

### story-montage: Story montage
- Built by the `editor-v2` skill (creator pack, Oct 2026): its SKILL.md and `reference/` are the look, frame by
  frame. Its "Video Studio" block on top overrides it: brand purple instead of its own colours, the studio job
  instead of its intake, graphics approved as stills before rendering, studio sounds.
- Picture-montage hook, B-roll, huge captions behind you, an end title you stand in front of.
- Status draft until Bryan approves a first edit; then record what worked here.

### silhouette: Silhouette
- Built by the `editor-v3` skill (creator pack, Oct 2026): its SKILL.md and `reference/` are the look, frame by
  frame. Its "Video Studio" block on top overrides it: brand purple instead of its own colours, the studio job
  instead of its intake, graphics approved as stills before rendering, studio sounds.
- Backlit side-profile silhouette on a colour backdrop, words behind the head. Uses Higgsfield credits.
- Status draft until Bryan approves a first edit; then record what worked here.

### film-grade: Film grade
- Built by the `persa` skill (creator pack, Oct 2026): its SKILL.md and `reference/` are the look, frame by
  frame. Its "Video Studio" block on top overrides it: brand purple instead of its own colours, the studio job
  instead of its intake, graphics approved as stills before rendering, studio sounds.
- Warm grain-and-bloom grade, one-word captions, head over the big words and panels.
- Status draft until Bryan approves a first edit; then record what worked here.

### mono-explainer: Monochrome explainer
From Nick Saraev's AI-consultant course (REFERENCES.md, Oct 2026). The graphics are the video; the
speaker is a guide in the corner. This style swaps the shared look's purple-on-black for **greyscale
on charcoal**: brand purple appears at most once per beat, as the one lit thing (the open door, the
active step, the underline under the claim).

- **Layout:** face in a portrait card (~220x300, rounded 14px, soft shadow) pinned right, mid-height,
  ~40px from the edge, on for ~85% of the video. Full-frame face only for the cold open, the big turn
  and the close. Graphics fill the frame behind and to the left of the card.
- **Ground:** charcoal (#141414 to #1B1B1B) with a soft vignette, never flat black.
- **Type:** graphic titles top-left in Playfair Display, regular weight; a small grey Inter label under
  each ("Illustration", "Being automated"); mono for small data labels. No burned-in captions.
- **Graphics, one idea per frame:** thin white-line diagrams that build part by part as each part is
  named (cycles, funnels, line charts with the constraint marked, quadrants, radar, node maps); grey 3D
  clay metaphors with a slow camera move (HyperFrames 3D or rendered stills); real news articles in a
  dark browser card with the claim underlined; greyscale UI rebuilds (search bar, phone call or texts,
  calendar, kanban, spreadsheet, chat); big serif numbers with a small sparkline.
- **Split-flap titles:** chapter and hook titles flip in on an airport departure board, a tick per letter.
- **Pacing:** the cold open changes picture every 1.5-3 s (a run of proof cards); inside chapters one
  diagram holds 10-30 s and keeps building.
- Status draft until Bryan approves a first edit; then save the template in presets/mono-explainer/.

### cinematic-authority: Cinematic authority
From Sabri Suby's "The New Era of Digital Marketing Has Just Begun" (REFERENCES.md, Oct 2026). The
speaker carries the video; graphics are loud, short punctuation. His red-on-black becomes Bryan's
purple-on-black; white stays the type colour.

- **A-roll:** full-frame medium shot is ~80% of the runtime. Warm cinematic grade (`lut.mjs`), slow
  push-ins on key lines, shallow-focus look. Recording tip for Bryan: open space and soft light behind.
- **Hook (first ~40 s), a picture change every 1.5-3 s:** giant proof numbers in heavy condensed caps
  (League Gothic) beside the head, the speaker matted in front of them (a hand passing over the number
  sells it); the background swaps to a wall of real client ads or results behind him; money or coins
  bursting for revenue lines. Numbers only from the backbone proof bank.
- **Takeover slides:** cut to near-black for a beat, 1-2 huge white condensed-caps words with a dark
  edge and faint film-scratch texture, blurring in and out word by word.
- **Curiosity list:** a title with numbered cards whose contents are pixelated, so the viewer sees how
  many things are coming; each card is revealed in its own section.
- **Diagrams on black, glowing:** neon line charts (purple + light purple, pill labels), node maps with
  purple pill nodes, either/or headers with white pills under; platform logos as the cast (logo bars,
  a coin burst behind a logo).
- **Captions:** keyword lower-thirds only, white condensed caps bottom-centre, about one every 10-20 s.
  No word-by-word captions on the talking head.
- **Proof full frame:** real search results, reviews, ads and advertorials for a few seconds each.
- **Pacing after the hook:** long talking stretches with a takeover, diagram or keyword every 30-90 s.
- **From his second video (HsjuAvqs3zU):** two angles (front medium + tight three-quarter close-up, or a
  130-150% offset punch-in); a darker night grade for teaching pieces; hook words huge over the chest
  with the key word in purple; black-and-white "before" B-roll with a purple scribble over the eyes;
  the pixelated numbered grid returns at every chapter as the chapter map, un-blurring the current
  card; a 3D folder spilling numbered sheets as the chapter opener; spaced acronyms ("A I D A") with
  the active letter in purple; either/or words placed left and right of the head.
- Status draft until Bryan approves a first edit; then save the template in presets/cinematic-authority/.

### keynote-glass: Keynote glass
From Sanji Nai-Chien's "How I Make $880/Day with AI Motion Design" (REFERENCES.md, Oct 2026). An
Apple-keynote feel for a story told in chapters. His electric blue becomes a brand-purple gradient
(`#8B5CF6` → `#4C1D95`); his orange light streaks become light purple (`#C4B5FD`).

- **Cold open, no face (~15-20 s):** the claim told in pure motion graphics, a new beat every 1-2 s:
  words resolving from blur, the key number built from glowing particles, a caption in a frosted
  pill over a soft scene, a prompt box typing with a light streak sweeping past, code or a result
  scrolling. First face shot lands after the hook.
- **Talking head:** warm, cosy, lit set; medium shot with gentle punch-ins. Clean white sans words
  (Inter, bold) float in the empty space beside the head, one per side, building as they are said;
  prices and app icons sit beside the head; comparisons go left vs right ("Pro 5 days" / "Us 1 day").
- **Captions:** key lines only, low and centred, each word resolving from blur, then blurring out.
- **Screens:** full-frame screen recordings with a rounded face card bottom-right; zoom to the line.
- **Glass cards (`apple-liquid-glass`) on the purple gradient:** chapter titles ("02 TIMING" pill over a
  glass card), floating glass icon tiles in 3D for a framework, big bold white headings ("PROFIT
  BREAKDOWN"), a glass profile card for a choice. 2-4 s each.
- **Mock-ups:** incoming-call and chat UIs for story beats, results shown inside a device on a soft scene.
- **Pacing:** talking head → screen with face card → glass card, a change roughly every 20-60 s.
- Status draft until Bryan approves a first edit; then save the template in presets/keynote-glass/.

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
