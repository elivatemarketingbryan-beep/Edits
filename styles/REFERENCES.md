# Reference breakdowns

What we learned from studying other creators' videos, written as techniques we can
reuse. Descriptions only; no footage, graphics or words are copied.

---

## Zeven 7: "7 Stupidly Simple CapCut Tricks You NEED to Know"

youtu.be/odxTRtU0HH8 · 5:35 · Sep 2026 · ~35K views at study time (Oct 31 2026). Studied from each
chapter's demo frames and the transcript. Bryan's brief: "our editor needs to have this much control
and must do these things". Became the "Control" table in STYLE-GUIDE.md and the studio/fx.mjs tool.

| # | Trick | How he builds it in CapCut | Ours |
|---|---|---|---|
| 1 | **Shading** | Lower the white (or raise the fade on black), add a split/film-strip mask for a gradient or a circle mask for a vignette, feather it | Feathered gradients in graphics; `fx.mjs shade` on footage |
| 2 | **Bounce motion** | 3-4 keyframes instead of 2: the curve handles overshoot then slightly reverse | `back.out` / explicit keyframes; bouncy caption slide-up by default |
| 3 | **Shiny text** | Duplicate the text, lighten it with curves, a film-strip mask (size 50, rotated 10°, feather 50) sweeping across, plus glow; gold or silver by changing the base colour | Caption look `shine` |
| 4 | **FPS lag** | CapCut's FPS lag effect at 10-20 | `fx.mjs lag` |
| 5 | **Warp screens** | Wide angle (bends from the corners) and fisheye (bulges from the centre) effects | `fx.mjs wide` / `fisheye` |
| 6 | **White flash** | Two text layers 2 frames apart, a white square over each word for one frame, the whole stack nudged earlier | Caption look `flash`; `fx.mjs flash` |
| 7 | **Negative text** | Duplicate the clip, a text mask with the word, curves inverted inside it | Caption look `negative` + `fx.mjs negative` |

---

## Herman Huang: "How to Edit ANY Video Like You've Done it 1,000 Times"

youtu.be/Zm7J3KqqXPk · 8:23 · Aug 2026 · ~531K views at study time (Oct 31 2026). Studied from
its transcript (auto-captions). Not a style: a method for learning any style, which became the
"Learning a new style" rule in CLAUDE.md.

**The five levels**, in his words paraphrased:
1. **Watch a lot (the bar).** Every genre has a structure; watching many videos in it shows the
   patterns everyone uses. That's the minimum the client expects.
2. **Find the best.** Look only at the top performers with the biggest budgets; bookmark the ones that
   make you wish you'd made them. Don't learn from average.
3. **Dissect.** Put the best into the editor and go frame by frame: pacing, framing, camera movement,
   graphics, effects, music, sound effects. Work out why each decision was made, like figuring out how a
   magic trick is done. Repeated tricks across videos are the ones to learn.
4. **Close the skill gap.** Knowing the trick isn't doing it: practise each effect from tutorials, and
   use assets and templates (grain, overlays, textures) to close the gap faster on client work.
5. **Apply your taste.** Emulate the building blocks that matter, then bring in what you already know
   or love from elsewhere (expensive-looking fonts from commercials, cinematic stock, bold anime
   captions) so you aren't a commodity. Progress is measured against your own previous work.

**What it changed here:** our breakdowns so far (Nick Saraev, Sabri Suby, Sanji Nai-Chien, Riley
Brown) studied the picture only. From now on a breakdown also covers the music and sound effects, notes
the genre's bar, and every new technique is built and tested once before it goes into a client edit.

---

## Sanji Nai-Chien: "How I Make $880/Day with AI Motion Design (Claude Motion)"

youtu.be/D5qpBbEWTxo · 19:55 · 16:9 (shot 4K) · Oct 2026 · ~220K views at study time (Oct 31 2026).
Studied from frames every ~40s across all 9 chapters plus every 1.5s of the first 45s.
Picture and structure only; the audio wasn't studied. Became the **keynote-glass** style
(STYLE-GUIDE.md).

**Format:** a documentary challenge ("can I earn $X in a day doing Y?"): find the client,
pitch, build, client feedback, compare with a human pro, profit breakdown. Talking head at a
cosy desk between chapters, screen recordings for the doing, designed glass cards for the
structure. Feels like an Apple keynote crossed with a vlog.

### What he does, and how we'd use it

| # | Technique | What it looks like | How Video Studio uses it |
|---|---|---|---|
| 1 | **Pure motion-graphics cold open** | The first ~15s have no face: a line typing in with blurred words resolving ("People are making"), a "$500" built from glowing particles, a caption in a frosted pill over a soft landscape, a chat box typing a prompt with an orange light streak, code scrolling ending on "Claude wrote." | Long-form hook built entirely in HyperFrames from the video's own claim, before the first face shot; brand purple light streaks instead of orange |
| 2 | **Cosy, lit set** | Desk with a laptop, a podcast mic on an arm, framed posters and warm practical lights blurred behind, a cap and an overshirt. Medium shot | Shoot guidance; in the edit, warm grade and gentle punch-ins |
| 3 | **Words in the negative space** | Clean white sans words float beside his head, one per side, building as he says them ("ONE DAY" ... "MANY CLIENTS"); a price ("$791", "$988") next to an app icon; "Pro / 5 DAYS" vs "Claude / 1 DAY" as icon stickers either side | Ear-to-ear text beats, no boxes, no shadows beyond a soft drop; comparisons placed left vs right of the head |
| 4 | **Key-line captions, blur in** | A key question lands low and centred, words resolving from blur one by one ("BUT CAN IT MATCH A PRO?"), then blurs out | Caption mode: key lines only, blur-in per word, white bold sans |
| 5 | **Screen recordings with a face card** | Upwork/Fiverr pages, client messages, Claude, file browser, all full frame with his face in a rounded card bottom-right | Screen beats with the face card (as in screen-tutorial); zoom to the line that matters |
| 6 | **Glass chapter and concept cards** | Saturated electric-blue gradient ground with frosted-glass UI on it: a "02 TIMING" pill over a glass timeline card, floating glass icon tiles in 3D ("THE STORY", "FIRST", "SECOND"), "PROFIT BREAKDOWN & REAL LEARNINGS" in big bold white, "Two Options" with a glass profile card | `apple-liquid-glass` cards on a brand-purple gradient for chapters, frameworks and choices |
| 7 | **UI mock-ups as storytelling** | A FaceTime-style incoming call with his face, a chat prompt on an orange gradient split with B-roll of a real designer at work | Phone and chat mock-ups for "the client called", "I asked Claude"; split-screen with B-roll |
| 8 | **Device mock-up for the deliverable** | The finished launch video shown on a laptop on a sunlit desk, framed by a rounded blue card | Show results inside a device on a soft scene, not as a bare screenshot |

### Pacing notes
- The hook is all graphics and changes every 1-2s; the first face shot lands ~20s in.
- After that it alternates: talking head (with floating words) → screen recording with face
  card → a glass chapter card, roughly every 20-60s.
- Chapter cards are big, clean and brief (2-4s): a heading and one glass object.

### For reels (9:16)
- The particle number and the typing chat box make strong 9:16 hooks; the floating words
  sit above and below the head instead of beside it.

---

## Sabri Suby: "Give Me 27 Minutes and I'll Make You Disgustingly Good at Digital Marketing"

youtu.be/HsjuAvqs3zU · 27:51 · 16:9 (shot 4K) · Jul 2026 · ~388K views at study time (Oct 31 2026).
Studied from one frame in every chapter plus every 1.5s of the first 45s; picture only. The same
house style as his "New Era" video below, so it extends the **cinematic-authority** style rather
than making a new one. 11 chapters, one per lesson.

What it adds:

| # | Technique | What it looks like | How Video Studio uses it |
|---|---|---|---|
| 1 | **Two angles** | A front medium shot and a tight three-quarter close-up, alternating on sentence boundaries | Punch-in to a tight crop (130-150%, offset to the side) if only one camera |
| 2 | **Low-key night set** | Darker than the "New Era" video: warm practical lamps, brick and shelves deep in bokeh, his face lit from the side | Grade darker and warmer for teaching pieces; recording tip |
| 3 | **Hook words over the chest** | One or a few huge condensed caps words low over his chest, the key word in red ("IF I HAD TO START OVER", "NO MONEY", "EXACTLY") | Hook captions in the lower third, key word in brand purple |
| 4 | **Black-and-white "before" B-roll** | The struggling version of the viewer in desaturated footage, red X marks drawn over the eyes; cinematic B-roll of him alone at night with a phone | Story B-roll in grey with a purple scribble mark; pull from the B-roll library |
| 5 | **Chapter grid as the map** | The pixelated numbered card grid from the hook comes back at every chapter: the camera flies across it and the current card un-blurs ("Standing foundation") | The curiosity list doubles as the chapter tracker: reveal one card per chapter |
| 6 | **3D folder opener** | A glossy blue folder labelled "DIGITAL MARKETING" spills paper sheets; one sheet flies to camera with "1", then "CAPTURE ATTENTION" | Chapter openers: folder in brand purple, a numbered sheet per lesson |
| 7 | **Spaced acronym** | "A I D A" in widely spaced white caps, the active letter turning red | Frameworks with letters (purple for the active letter) |
| 8 | **Words either side of the head** | "LEADS" left, "PRODUCTS" right; "3 MONTH" big in red beside his face | Either/or and big-number beats beside the head |
| 9 | **Chapter title takeovers** | "MARKET SOPHISTICATION AND COMPETITION" in condensed caps, the key words in red, blurring in | Chapter title cards on near-black |

---

## Sabri Suby: "The New Era of Digital Marketing Has Just Begun"

youtu.be/xsdoHywBD0I · 21:59 · 16:9 (shot 4K) · Oct 2026 · ~29K views at study time (Oct 31 2026).
Studied from frames every ~40s across the whole video plus every 1.5s of the first 45s.
Picture and structure only; the audio wasn't studied. Same niche as Bryan (digital
marketing for business owners). Became the **cinematic-authority** style (STYLE-GUIDE.md).

**Format:** a single-speaker authority talk, no chapters. The opposite balance to the
Nick Saraev course: here the **cinematic talking head is ~80% of the runtime** and the
graphics are short, loud punctuation.

### What he does, and how we'd use it

| # | Technique | What it looks like | How Video Studio uses it |
|---|---|---|---|
| 1 | **Cinematic A-roll** | Seated in an armchair, medium shot, shallow depth of field, a warm-lit open office blurred into bokeh behind him, black tee. The frame itself says "premium" | Shoot guidance for Bryan (open background, light behind, shallow focus); in the edit, a gentle warm grade (`lut.mjs`) and slow push-ins |
| 2 | **Proof-number hook with the speaker in front** | First seconds: a giant number per line ("$4.6", "$10.2 BILLION", "683", "1,184") in heavy condensed caps beside his head, his hand passing in front of it; money raining around him; then the background swaps to a wall of real client ad screenshots behind him | Needs a matte: number layer between background and person, real proof screenshots as the backdrop. Every number from the script (backbone proof bank only) |
| 3 | **Black takeover slides with heavy caps** | Cut to black for a beat: one or two words in huge white condensed caps with a dark edge and film-scratch texture ("COMPLETELY CHANGED", "IN THIS NEW"), blurring in and out word by word | Kinetic type takeover on the turn of a sentence; brand purple replaces his red |
| 4 | **Blurred numbered list = curiosity tease** | "MASTER DIGITAL MARKETING" with 7 numbered cards whose contents are pixelated, so the viewer sees there are 7 things but not what they are | Hook device for list videos: show the count, hide the items, reveal each one in its section |
| 5 | **Platform logos as the cast** | "THE RULES" over Meta, Google, YouTube and Instagram logos; later a bar chart where each bar wears a platform logo; the Google G with coins bursting out | Real logos (media-use), one platform per bar; a coin/money burst behind a logo for "where the money goes" |
| 6 | **Neon line charts** | Glowing red line rising on black with a "CPM" pill, then a blue "CPC" line racing it | `graph-rise` or a HyperFrames chart, brand purple + light purple lines, pill labels |
| 7 | **Red-node mind maps** | "POOLS OF INTEREST": a centre node with red pill nodes around it; "DEMAND CAPTURE vs DEMAND GENERATION" as two red headers with white pills under | Thin-glow node diagram on black, purple pills; good for frameworks and either/or |
| 8 | **Keyword lower-thirds, not full captions** | Most of the talking head has no captions; a key phrase lands as a big condensed caption low in the frame ("YOUR UNIQUE VANTAGE POINT", "+ THEIR SUGGESTED VIDEOS") | Caption mode: keywords only, 1 per 10-20s, white condensed caps bottom-centre |
| 9 | **Real screens full frame** | Google search typing, an AI answer, a Google reviews list, a newspaper-style advertorial | Proof beats full frame for a few seconds; `search-bar`, real screenshots |

### Pacing notes
- The hook changes picture every 1.5-3s for ~40s; after that, long talking-head stretches
  (often 60s+) with a takeover or keyword caption every 30-90s.
- Graphics are loud and short: they punch a point and get out, the speaker carries the rest.
- Proof is real and specific (his clients' actual ads and numbers), never stock.

### For reels (9:16)
- The proof-number hook (number beside the head, hand in front) and the blurred numbered
  list both work as 9:16 openers.

---

## Nick Saraev: "How I'd Make $12,373/Mo as an AI Consultant in 2027 (Course)"

youtu.be/25KVZUg56_s · 28:24 · 16:9 · Oct 2026 · ~90K views at study time (Oct 31 2026).
Studied from frames across the whole video (one every ~40s, every chapter) plus every 1.5s
of the first 36s. Picture and structure only; the audio wasn't studied. Became the
**mono-explainer** style (STYLE-GUIDE.md).

**Format:** a 28-minute course with 14 chapters in the description (Intro, What an AI
Consultant Does, The Six-Step Method, then one chapter per step, Three Common Mistakes,
Final Thoughts). Shot as one seated talking head, but **the graphics are the video**: his
face is full frame only at the open, a chapter break or two and the close. Everywhere else
he's a small card while a designed illustration owns the frame.

### What he does, and how we'd use it

| # | Technique | What it looks like | How Video Studio uses it |
|---|---|---|---|
| 1 | **Face as a small card, graphics full frame** | A portrait face-cam card (about 3:4, rounded corners, soft shadow) pinned to the right edge at mid height, overlapping whatever is behind it. On for ~85% of the runtime | The style's default layout. Card ~220×300 at 1080p, right inset ~40px; full-frame face only for the cold open, the big turn and the close |
| 2 | **Monochrome everything** | Charcoal ground (soft vignette, never flat black), white/grey type, grey clay objects. No accent colour at all; light (a glowing doorway, a white highlight) does the emphasising | Greyscale with **one** brand-purple accent per beat at most (the lit door, the active node); the rest stays grey |
| 3 | **Editorial serif titles + "Illustration" sub-label** | Each graphic has a title in a condensed editorial serif at top left ("The job with the most long-term value"), a small grey sans label under it, sometimes "Illustration" | Title in Playfair Display (brand serif), small Inter label in grey under it; top-left anchored |
| 4 | **Grey 3D clay metaphors** | Rendered grey objects that carry the idea: three doors with the middle one opening onto light, an iceberg (what people see / the actual work), a Rubik's cube, a sailboat, an arch, Newton's cradle, a wireframe globe, a 3D road with trucks, a 3D spiral | HyperFrames 3D (Three.js) or pre-rendered clay stills with a slow camera move; one metaphor per chapter idea, never decoration |
| 5 | **Real news articles as browser cards** | Headline screenshots (CNBC, etc.) in a dark browser frame with the URL bar; several in a row for "everyone is doing X", a headline underline drawing on | Proof beats: real article in a browser card, underline the claim. `headline-highlight` / `article-highlight` |
| 6 | **Thin-line diagrams and charts** | White 1-2px strokes on charcoal: a cycle of six steps around a circle, a line chart dipping at "the constraint", a funnel of bars, a quadrant, a radar chart, a 0-10 scale, a node map with one broken link | Every framework he names becomes a thin-line diagram that builds as he says each part |
| 7 | **Split-flap board titles** | Airport departure-board letters flipping into a phrase ("AUTOMATING JOBS", "AI CONSULTING IN 2027") | Chapter and hook titles; new template **split-flap** (letters flip through random characters, then settle), with a tick per letter |
| 8 | **Rebuilt UIs in greyscale** | A search bar typing a query, a phone with an incoming call / a text thread, a calendar week, a kanban board, a spreadsheet, a tools-connector list, a chat window, a terminal | `search-bar`, phone mockups and UI rebuilds, all recoloured to the grey palette so they sit in the same world |
| 9 | **Big numbers as type** | A clock "6:45" with a small rising chart, "12/min 4/min", "20%", "1 of 5" set large in serif beside a diagram | `counter` in the serif, grey, with one small sparkline |
| 10 | **Fast proof run in the cold open** | First 36s: face full frame for one line, then a new card every ~1.5-3s (headlines, doors, iceberg, his site, "Exactly how", split-flap, search) | Long-form hook: a rapid run of proof cards over the voice before the first chapter |

### Pacing notes
- In the cold open the picture changes every 1.5-3s; inside chapters a diagram holds
  10-30s and builds piece by piece while he explains it.
- The face card never leaves during graphics, so it always feels like he's walking you
  through it; full-frame face is rare enough that it signals "this matters".
- One idea per frame, a lot of empty charcoal around it. Nothing competes for attention.

### For reels (9:16)
- The split-flap title and the opening door work as 9:16 hooks; the face card moves to the
  bottom third.

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

## Kallaway: "Give Me 24 Minutes, I'll Give You 10,000 Hours of Content Strategy"

youtu.be/w-RgtfUnYVo · 24:18 · 16:9 · Oct 22 2026 · ~50K views at study time (Nov 7 2026).
Studied from frames every 6s across the whole video, every 1s through the first 45s, and a
WhisperX transcript. Bryan sent it as a long-form style reference. **The closest match to
Bryan's brand we've studied:** purple glow on near-black, white type with purple accent words,
glass cards, a dark set with one neon strip. Most of it can be built almost as-is.

**Format:** an 8-tip listicle with a chapter per tip (in the description). One seated camera
angle at a podcast mic; the framing barely changes, and the graphics do all the work. He talks
fast (~225 words a minute). Every tip runs the same loop: **the popular advice → "the actual
truth" → why (an analogy) → proof (his own numbers or a student) → a one-line takeaway**.

### What he does, and how we'd use it

| # | Technique | What it looks like | How Video Studio uses it |
|---|---|---|---|
| 1 | **3D tip carousel (chapter tracker)** | Frosted-glass cards, one per tip (outline icon, "TIP #7:", bold title), arranged in a ring around a phone that shows an Instagram post ("8 TIPS for growing faster on social media" glowing above it, likes and comments below). It spins through all 8 in the hook, then comes back at every chapter, turning to the current tip, with the post's caption under it holding the tip in one sentence | New template: **tip-carousel**. A 3D version of Iman's chapter tracker in our exact palette. Bryan's handle and avatar on the post |
| 2 | **Frame word slam** | "all of these are very / **UNPOPULAR**" in big purple-gradient caps over the blurred cards | Kinetic title over the blurred chapter graphic; one per video, in the hook |
| 3 | **Credibility badges** | Glass pills with his avatar and name next to his head, the number counting up as he says it (2M+ followers, 537M+ views, 18+...) | `counter` in a glass pill, popping in on the word; alternate sides |
| 4 | **"The Popular Advice" post card** | Each tip opens with the myth as a fake social post in the top-left corner (avatar, "The Popular Advice", the advice typing in, an engagement row); then "the actual truth" appears in purple lower down | New template: **myth-card**. Recurring device that gives every chapter the same opening; pairs with Bryan's "do / don't" scripts |
| 5 | **Side cards for the key phrase** | Glass card beside his head: the big line in bold white ("the opposite"), the rest small under it ("of what everyone else is saying to do") | Our side-words / floating cards; big + small two-line layout |
| 6 | **Emphasis captions only** | No running captions. Only key lines get words, low and centred, white with the contrast word in purple ("AI is the input" / "not the output") | Matches Bryan's "loud kinetic captions on the key lines". On his purple wall the accent word needs a white outline or glow (see EDIT-PREFERENCES) |
| 7 | **Bullet list beside him, frame dimmed** | His side of the frame blurs and darkens; three ▶ bullets on the other side, bold lead with purple keywords, italic grey detail under each | Bullet list in negative space with a blur/dim on the footage half |
| 8 | **Pyramid that builds over time** | 10 purple levels; a dashed "AVERAGE CONTENT QUALITY" line climbs as he walks through 12 months → now; one level turns red ("you, where you were") and the top one green. It stays on screen ~40s and changes with each sentence | New template: **level-pyramid**. A diagram that changes with the story instead of one static chart; great for "the bar has gone up" |
| 9 | **Act out the story** | When he says clients "come on calls", he cuts to himself inside a Zoom-style grid with lettered tiles. "Someone selling the same offer" vs "YOU": two dark silhouettes with the shared things listed between them | Exactly Bryan's "paint the scene" rule. Zoom-grid and silhouette-versus as reusable scenes |
| 10 | **Real proof on phones** | His own Instagram profile, reels grid and posts in phone mockups; an envelope icon with a DM count climbing (34K → 211K → 388K → 566K) over a reel | Show-the-real-thing rule: Bryan's client GBP profiles and lead counts in a phone frame with a climbing `counter` |
| 11 | **Pop-culture B-roll in a frame** | Friends and Survivor clips in rounded windows on the purple-glow floor, small show label top-left | Rounded-window B-roll on the brand floor. Use media he has rights to, or a stand-in |
| 12 | **Screen recordings on the glow floor** | A white browser or Claude window, rounded, floating on black with the purple glow under it | Same template for any screen demo |
| 13 | **Student case study** | His academy logo, then the student's profile card with three bullets, then the student's reels with view counts and the DM counter | "My client" case-study block: logo → client card + bullets → results |
| 14 | **Hand-swipe transition** | His hand sweeps across the lens and the motion blur hides the cut into the next graphic | Cut into a graphic on a big hand move; add a whoosh |
| 15 | **Plug and CTA beats** | His paid program pitched at 3:00, right after tip 1; a "CTA as a net-give" card; an IG caption with the comment keyword highlighted purple; a name lower-third ("Kallaway", avatar, purple box) near the end, closing on the program's roadmap page | Bryan's offer plug after the first payoff, not at the end; comment-keyword highlight for lead magnets |

### Pacing notes
- Hook (0:00-0:45): one line to camera, then the carousel previews all 8 tips, the
  "UNPOPULAR" slam, the frame line ("do the opposite of what everyone else is saying"), then
  credibility badges. All 8 promises before the first tip.
- A graphic beat about every 10s in the first chapters, easing to every 15-25s later; the long
  graphics (pyramid, case study) hold for 30-40s and change with each sentence instead of cutting away.
- The carousel at every tip break turns 24 minutes into 8 short episodes.
- No true silence in the first minute, so a quiet music bed most likely runs underneath.

### For reels (9:16)
- **Myth card → "the actual truth"** as a reel hook.
- **Tip carousel** turned flat as a "tip 3 of 8" header on a series.
- **Credibility badge counting up** in the first 3s.
- **DM counter over a reel** for proof reels.

---

## Skymography: "How To Sound Design ANYTHING"

youtu.be/c0YINYT4Ozw · 26:39 · 16:9 · ~447K views at study time (Nov 8 2026). Studied from a WhisperX
transcript, timeline frames, and cut and sound-onset measurements on the finished sequence (360p
YouTube mix at 25 fps, so levels are approximate). Became the skill `sound-placement`.

| Technique | What the edit does | Measured or shown | Why it works | Ours |
|---|---|---|---|---|
| **Priority order** | Speech, then music, then effects on a talking scene | Stated | Effects that pull focus lose the message | Effects stay accents |
| **Attention box** | Picture and sound share one fixed amount of attention | Stated | Forces an ebb and flow | Sparse where the picture is busy |
| **Spectrum gaps** | Places sounds where the mix is empty, keeps early sections mid/high, adds bass later | Clicks lifted highs ~25 dB, whole mix only ~2 dB | Reads clearly without being loud | Choose by what's empty, not by default |
| **Clicks on cuts** | Sped-up, muffled mechanical shutters on each fast cut | 0 frames off the cut | Makes cuts feel tactile | `ui-progress-step`; film clicks on b-roll |
| **Rhythm over sync** | One cut was a frame short, so that click stayed on the even beat | Click 1 frame after the cut | The ear catches uneven spacing, the eye doesn't | Keep run spacing even |
| **Whoosh leads the cut** | The build runs through the end of the outgoing shot | Starts ~0.9 s before, loudest 0.1-0.4 s before, gone 0.5 s after | Links the two shots | `sfx.mjs` aligns the peak; `ui-swipe` |
| **Hard-cut build** | Reversed bass drop cut on the last frame before the scene | Mix fell 26 dB within 100 ms | The sudden stop is the impact | `SFX-1516` to `SFX-1518`; no boom |
| **Riser into whoosh** | A riser builds tension, a whoosh releases it | Shown | Tension needs a release | One soft build, then `ui-swipe` |
| **Ascending clicks** | Clicks pitched up a semitone each | -4, -3, -2…, 3 frames apart | A riser made from clicks | Pitched `ui-progress-step` copies |
| **Per-shot variation** | One wind cut per shot, different spot, ±1 semitone | Shown | Each shot feels distinct | Vary across a run |
| **Sound bites** | A few frames of water, bike or train under each matching Paris shot | Shown | Adds up to the feeling of a city | Literal sounds on live b-roll |
| **Layering** | Stacks winds, whooshes and impacts for sounds that don't exist | Shown | One sound can't carry a whole world | Bake layers into one cue, as `ui-glass-shatter` |
| **Shape every sound** | High-cut EQ, trimming, speed and pitch changes | Shown | Sits it into the mix | Prepare copies; `sfx.mjs` has no EQ or pitch |
| **Non-literal sounds** | Rain jacket for luggage, clock clicks for text | Shown | Viewers hear a result, not a source | B-roll only; Bryan wants literal on graphics |
| **Mix low first** | Turns nearly every sound down right after placing | Repeated throughout | Loud effects ruin a video | Start low, then compare before and after |
| **Try and delete** | Dropped a conveyor-belt layer as noise | Shown | Not every idea works | Listen in the full mix |

---

## Film Editing Pro: "How to SOUND DESIGN a Video | Step-By-Step Tutorial"

youtu.be/Wcxw3BPSt3A · 17:06 · 16:9 · ~1.1M views at study time (Nov 8 2026). A first pass of a dark-comedy
short is critiqued, then rebuilt. Studied from a WhisperX transcript, timeline frames and level measurements
(360p YouTube mix at 24 fps; narration overlaps some demos, so levels are approximate). Added to the skill
`sound-placement`.

| Technique | What the edit does | Measured or shown | Why it works | Ours |
|---|---|---|---|---|
| **Build order** | Score, then ambience and foley, then creative design | Stated | Effects get judged in context | Music first when there is any |
| **Cut the music to the edit** | Slices a cue so its hits and dips land on moments | Shown on the staple pull | A cue played straight won't line up | Worth doing when a job has scored music |
| **Nothing is silent** | Air-conditioner hum in the office, wind on the one exterior | Shown | Dead air sounds wrong | `SFX-1477`, only on silent stretches |
| **No repeated samples** | Same keystroke every time was a named fault; slices a 10 s typing clip and uses each hit once | Shown | Repeats sound fake | `keyboard`; rotate ticks |
| **Line up the apex** | Waveforms visible, markers on the peak | Shown | The peak is what the ear syncs to | `sfx.mjs` aligns the peak |
| **Reverb on one bus** | All foley through one submix with room reverb | Before and after played | Studio-clean sounds feel pasted on | Live b-roll only; UI stays dry |
| **Sound for what can't be seen** | Hit on a box drop to signal consequences | Shown | Tells the viewer how to feel | Sparingly; Bryan wants literal on graphics |
| **Find the hidden moments** | Visual movement and lighting changes flag them | Sundown example | Otherwise they're missed | Watch burns and light shifts |
| **Swell peak on the cut** | Reverse cymbal apex on the cut, bass drop starting on it | Timeline shot | Tension resolves on one frame | One soft build; no boom |
| **Size the moment** | Bass drop and hit on a soft move were too much; the soft swell alone fit | About 14 dB quieter once the hits came off | If every moment is special, none are | Sizing ladder in the skill |
| **Layer by similar tone** | Crunches under a staple remover and shredder | Shown | Close frequencies blend | Bake into one cue |
| **Stay consistent** | Once a style is set, it runs through the piece | Stated | Gaps become obvious | Same density after the opening |
| **Meter guide** | Nothing over 0; speech about -10 to -12; effects -10 to -30; music -20 to -30 | Chart on screen | Keeps the order of importance | Listed in the skill |

---

## Film Editing Pro: "How Professional Editors Build Suspense" (What Drives the Cut, part 4)

youtu.be/zUwdvfoRmc8 · 7:26 · 16:9 · ~28K views at study time (Nov 8 2026). Studied from a WhisperX
transcript only. About why to cut, with nothing on sound, so it is not part of the skill `sound-placement`.
Bryan made it a rule for every video (EDIT-PREFERENCES.md, 2026-11-09).

| Technique | The idea | Why it works | Ours |
|---|---|---|---|
| **Questions and answers** | Each shot poses a question, answers one, or both | Questions keep people watching; answers make them enjoy it | Check each b-roll or graphic: what does it ask or answer? |
| **Withhold, then reveal** | A question comes from what's left out of the frame; an answer from what's in it | The viewer wants the missing piece | Tease the number or result before showing it |
| **Less to more** | Start close, widen as the scene goes on | Each step adds information | Open a graphic on one detail, then pull out to the whole |
| **Shot sizes carry different information** | Close-ups: who. Extreme close-ups: feeling. Mediums: doing. Wides: where | Picks the shot by what it needs to tell | Choose b-roll by the information the line needs |
| **No redundant shots** | Two shots saying the same thing are like repeating a sentence | Repetition bores | No two shots or graphics in a row giving the same information |
| **One sentence per cut** | Write what each shot adds, one sentence each; a boring list means a boring edit | A quick test of the structure | Use it on `sheet.json`: each scene's `what` should say something new |
| **Spread and keep open** | More questions early, more answers late, new questions as old ones close, one left open at the end | Keeps tension running into what comes next | Re-hooks mid-video; end on a reason to watch the next one |
| **Moves can do a cut's job** | A camera move can reveal information the way a cut does | The promise of a reveal builds anticipation | Slow push or slide that uncovers the proof |

---

## Film Editing Pro: "The Editor's Guide to Mono vs Stereo Audio"

youtu.be/4r_oeWymn7k · 25:30 · ~27K views at study time (Nov 8 2026). Studied from a WhisperX transcript. Mostly
Premiere steps; what carries over is below. The channel check is in the skill `sound-placement`.

- Speech should be heard evenly in both ears; music is meant to differ left and right.
- A recorder can put a lav on one side and a boom on the other. Split them so a bump on one mic can
  be faded out, and raise the other mic to cover the gap.
- Fade a mic out and back in rather than switching it off sharply.
- Mismatched mono and stereo can change the level on export in Premiere. `sfx.mjs` isn't affected (tested).

---

## Film Editing Pro: "How Pro Colorists Use SCOPES For Better Color Correction"

youtu.be/CMWRjrSnfFQ · 12:31 · ~21K views at study time (Nov 8 2026). Studied from a WhisperX transcript only,
so the on-screen scope demos were not reviewed. Nothing on sound. Useful when grading with `studio/lut.mjs`.

- Monitors lie: a bright screen leads to grading too dark, and a dim one too bright. Measure instead.
- A waveform shows brightness by position across the frame. Most shots want a little shadow, a little
  highlight and spread mid-tones, but a bright or dark room should read that way.
- Don't push whites past the top or blacks past zero: clipped or crushed areas lose all detail.
- A vectorscope shows hue by direction and saturation by distance from the centre. A trace leaning one
  way means a colour cast.
- Scopes need context: read them against what the shot is meant to look like.

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

---

## Christian D Moreno (@christiandavidm_): contractor numbers tier list

instagram.com/p/DfAxsuskU5C · 0:39 · 9:16 reel · Oct 2026. Same niche as Bryan (contractors).
Studied frame by frame for the `ranking` style's item pop-up; it's that style's reference.

- **Layout:** one static talking-head shot, no cuts or zooms. A dark tier board (S/A/B/C/D/E/F,
  pastel row labels red, orange, yellow, green, blue, purple, pink) fills the top ~40% over the
  wall, above his head. A fixed two-line title in a white box sits at chest ("Ranking numbers
  CONTRACTORS use to track performance"), with small 2-3 word captions just above it.
- **The pop-up (the move to copy):** when he names an item, a big card **hard-cuts in** over
  the middle of the board (no scale or fade), ~0.1-0.15 s *before* the name is said.
  It's a 16:9 stock-style photo of the thing (a hand on a phone in a truck for "bank balance",
  a man at a laptop for "net profit") with a two-line caption: first word(s) in **yellow**
  heavy condensed caps at the top, the rest in **white** caps at the bottom, both with a dark
  outline. Card ≈ 58% of the board's width, a little right of centre.
- **The drop:** it holds while he reads the name, then on the tier letter ("C tier") it
  **shrinks and flies into that row** in ~0.5 s (ease-in-out), landing as a small thumbnail at
  the left of the row, after any cards already there. Measured: "bank" 4.58 s → card in 4.47 s;
  "C" 5.82 s → shrink starts ~5.8 s, lands ~6.4 s. "company" 13.45 s → card in ~13.3 s;
  "A" 14.53 s → lands ~15.0 s.
- **Rhythm:** a new item every ~6-8 s (name → tier → one-line reason), 5 items in 39 s. The
  board fills up over the video, so the last frame is the full verdict: a natural screenshot
  and a reason to watch to the end. Caption: "Be honest, which one do you use?" (comment bait).
- **Why it works:** the card tells you what's being ranked before your ear catches it, and the
  shrink-into-row is a tiny payoff every few seconds. The verdicts are contrarian (bookings = F,
  profit by job = S), so the board itself argues the point.
- **Built as** the `tier-board` template (styles/ANIMATIONS.md).
- **For Bryan:** build it in `ranking` with brand purple on the board frame and the yellow title
  word swapped for the brand accent; cards from real contractor screenshots (his clients' job
  costing, invoices) beat stock photos. Add a pop SFX on the card cut-in and a soft whoosh into
  a thud/stamp when it lands in its row (SOUND-RULES); the reference may have none (not checked
  by ear).

---

## Christian D Moreno (@christiandavidm_): contractor finances do / don't

instagram.com/p/De-M8V1DkBt · 0:31 · 9:16 reel · Oct 2026. Same creator and card look as the
tier list above, sorted into two sides instead of tiers. Built as the `do-or-dont` style.

- **Layout:** one static seated shot, no cuts. Fixed title pill above the head ("Contractor
  finances 101" + a worker emoji). A green "DO IT" and a red "DON'T DO IT" label at chest
  height either side of his body. Small white 2-3 word captions just above the labels.
- **The card:** tall (≈30% of the width, ~1:1.8), over his lap, a stock-style photo of a
  contractor in a truck with the claim in two parts: yellow condensed caps on top ("SPENDING
  FULL CREDIT LIMIT"), white caps at the bottom ("JUST BECAUSE YOU GOT APPROVED"). It
  hard-cuts in as he starts the tip (0.03 s here).
- **The sort:** on the verdict ("Don't." at 2.19 s) the card glides toward its side while
  shrinking, landing ~0.9 s later as a small thumbnail under the label. Each side fills 2
  across from the outer edge inwards, then a second row. 5 tips in 31 s, one every ~6 s:
  claim, one-word verdict, one-line reason. Later verdicts are implied ("Dude, put the end
  date on your calendar") and the card still flies to "do".
- **Why it works:** the viewer guesses the verdict before he says it (the comment bait is
  "Did I get any wrong?"), and every few seconds a card lands somewhere. The finished board
  is a cheat sheet worth screenshotting.
- **For Bryan:** `do-dont-board` in brand: accent top words, real client screenshots or the
  auto icon, `enter` for do and `glitch` for don't as they land. Script it in the comparison
  shape with `[SIDE]` on each verdict so the cards time themselves.

