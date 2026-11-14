# Checks: what Bryan wants from an edit

Every correction Bryan has made, as a rule to check against. Read this before ideas and combos, before every `edit` and `revise`,
and check every frame and sound against it before showing anything. These rules beat STYLE-GUIDE.md, SOUND-RULES.md, the catalog
recipes and every skill.

When Bryan corrects something, add a line the same turn, in the section it belongs to, and replace any rule it contradicts:
`- DO / DON'T: the rule. (Bryan: "his words"; date; applies to, if not every video)`

Older wording and replaced rules: `docs/history/EDIT-PREFERENCES-2026-11-09.md`.

## Graphics: look

- DO: use purple for structure and gold only for money, results or the one key idea (`styles/PALETTE.md`).
- DO: put the payoff phrase of a title in gold ("Four parts. **One system.**"). (Bryan: "make the word one system gold"; 2026-11-11; 80-20 strategy g3)
- DO: put chapter-card titles in gold ("Targeting.", "Budget."). (Bryan: "title gold"; 2026-11-11; 80-20 strategy g11)
- DON'T: put a centred round glow over a dome of light on a full-screen background. Use a wide flat glow along the bottom, soft corner light, faint texture. (Bryan: "the background looks like the IG default profile picture"; 2026-11-07)
- DO: keep the premium look when borrowing from anyone. Take the layout and the idea, then rebuild it in our style. (Bryan: "i want to keep that premium design we have still", "turn his boards into our style too"; 2026-11-09)
- DO: attach ropes, chains and strings to the thing they hold, and move them with it. (Bryan: "fix the anchor rope"; 2026-11-07)
- DO: put big caption text over his purple-lit set in white. (Bryan: "the purple letters don't show well", "can't see red captions."; 2026-10-29; his purple-lit set)
- DON'T: use the purple gradient or red command styles over his purple wall. (same note)

## Graphics: what goes on screen

- DO: rotate the *kind* of visual every beat: full-screen kinetic type over the blurred speaker (`focus`), split screen with a framed speaker (`split`), objects and UI built straight on the frame, editorial paper or handwriting, diagrams, full-screen stages. (Bryan: "I feel like we're relying on the same style too much now."; 2026-11-07; long-form)
- DON'T: use side glass cards with a checklist twice in a row, or for more than about one graphic in five. (same note)
- DO: invent new effects as much as possible, borrowing ideas from other styles but building them in the current look. (Bryan: "don't do the same effect a lot, try to create new ones as much as you can, use inspo from the other styles but in this format."; 2026-11-07)
- DON'T: use the same effect twice in a row. Every graphic needs a reason in what he is saying. (2026-10-29)
- DO: show the Meta top-5% targeting as Ads Manager > ad set > detailed targeting, then typing "top 5% income" in the search box. No Demographics > Financial menu steps. (Bryan: "its just ads manager ad set and then detailed targeting then u type top 5% income"; 2026-11-12; 80-20 strategy g15)
- DO: show the real thing over an abstract chart: Google profiles, a map with calls coming in, a ranking list moving. Line graphs only when the shape is the point. (Bryan: "a graph isn't the best way to show this"; 2026-10-29)
- DO: give every ranking or tier-list video the default ranking board: the `tier-board` template with its coloured S-F row labels (red, orange, yellow, green, blue, purple, pink), in previews, combos and the edit. Don't restyle it into purple and gold. (Bryan: "ranking videos should always use default ranking board design with colors"; 2026-11-10)
- DO: open layouts centered, then slide aside to make room for text. (Bryan: "I want it centered at the beginning and it slides to the left and makes space for the text to appear"; 2026-11-08; re-edits)
- DO: ask before removing an original animation with real interaction on a re-edit. He may want it rebuilt in the new style. (Bryan: "keep the hexagon animation where mouse clicks at each circle but make it match the newer style"; 2026-11-08)
- DO: alternate pop banners left and right and vary their height. (Bryan: "all the popups keep going on the right, move them around."; 2026-10-29)
- DO: leave an empty 16:9 slot with a highlight around it on the end card for the thumbnail. The name card reads "Bryan Tabora". (2026-10-29)
- DO: say "my client" on screen, never "your client". (2026-10-29)

## Pacing and story

- DO: make YouTube edits motion-graphic heavy, with something moving almost all the time: a big graphic scene about every 30-40 s, punch-ins on talking stretches (wide/close every other sentence), loud kinetic captions on key lines, floating cards between. (Bryan: "I want a lot more motion graphic heavy type of video."; 2026-10-29; 16:9)
- DO: act stories and scenarios out with motion graphics timed to the words, in the Moonshot Motion way: a faceless figure, a few props, one caption line at a time, gold on the payoff, a pull-back at the end. Write a new scene per story with `assets/boards/story/kit.js`. (Bryan: "add motion graphics that paint the scene of what I'm talking about."; 2026-10-29. "whenever I'm telling a story or scenario it can animate it"; 2026-11-09)
- DO: check every short-form script for a scenario (a lead, a client, a timeline like "2 PM form, 7 PM you see it") and act it out with the Moonshot story scenes on any format, not only story styles. (Bryan: "use the animations we worked on", "the animation style we stole from instagram"; 2026-11-10; tof-08 glass-explainer missed it)
- DO: give every b-roll shot, graphic and scene a question to raise or answer. If it does neither, cut it. (Film Editing Pro, approved by Bryan; 2026-11-09)
- DO: tease a number or result before showing it, and open a graphic on one detail before pulling out to the whole. (2026-11-09)
- DON'T: run two shots or graphics in a row that give the same information. A graphic acting out the line he is saying is fine. (2026-11-09)
- DO: pose new questions as old ones close, leave one open at the end, and read `sheet.json` top to bottom before rendering. Each scene's `what` should add something new. (2026-11-09)
- DO: feel free to go heavy on short-form (9:16); combos are welcome there. (2026-10-28)
- DON'T: use the do-or-dont board for "Boosting a post isn't running ads"; any other format. (Bryan: "not this format", "any format but the one u used for tof 9"; 2026-11-10; tof-09)

- DO: keep a story figure's feet, back and hands on the surface it stands, lands or lies on, and never let it pass through a step or object. Build scenes with `assets/boards/story/kit.js` (it solves contact) and run `node studio/story-contact.mjs <scene>` before showing; it must report 0 frames into the surface. (Bryan: "figure out a way where the feet land on the line not go through objects"; 2026-11-09)

- DO: open with something that grabs attention in the first seconds, a pattern break (a full-screen moment, a pile-up, a punch), not just a card sliding in beside him. (Bryan: "i want something more attention grabbing to happen"; 2026-11-11; 80-20 strategy hook)
- DON'T: open on a glass card (box) beside him. Put the opening words big on the wall beside him, tucked behind him (person matte on top), so it's eye-catching. (Bryan: "I don't like the square at the beginning, experiment with placing the words on the left of me behind me, something eye catching"; 2026-11-11)

## Captions

- DO: make the opening's captions fancier than the running ones: big stacked words, the key phrase in the accent serif, icons popping in around them. (Bryan: "more fancier style captions at the beginning, add icons and things around."; 2026-10-29; 16:9)
- DON'T: run captions while a text card (quote, verse) is on screen. (Bryan: "when the card pops up don't do the captions for that sentence."; 2026-10-29)

## Post captions

- DO: write a post caption for every video, formatted like Joe Aquino's (`styles/POST-CAPTIONS.md`): line one is the point, then 1-2 short paragraphs with blank lines, no emojis, and the same hashtag block one blank line below the last paragraph (#contractors #contractormarketing #googlereviews #homeimprovement #leadgeneration #contractorsofinstagram). It shows under the video in the studio. (Bryan: "add a caption under each one", "go through joe aquino's captions to figure out how to format", "add these hashtags at the bottom all the same distance apart from the bottom text"; 2026-11-10)

## Footage and cuts

- DO: level the camera. If the shot is even slightly tilted, rotate and crop in so nobody can tell. (Bryan: "crop it in a way where you can't tell my camera wasn't straight."; 2026-10-29)
- DO: listen for stumbles inside a kept line and cut to the clean take. The automatic cut list only catches pauses and fillers. (2026-10-29)
- DO: put film burns and a film look on b-roll, mixing strength: bold amber burns into a b-roll stretch and on a couple of key cuts, soft edge leaks on the rest. (Bryan: "add film burns and effects to the b roll", "some subtler and some not"; 2026-11-08; live b-roll)
- DON'T: use flat white or blotchy burns, or let graphics and wipes clip the start or end of a live shot. (2026-11-08)
- DO: mute any clap or slate noise before the first word. (Bryan: "remove the clap from the beginning"; 2026-11-07)
- DO: rebuild the voice from the raw recording on a re-edit, so the old edit's baked-in effects are gone. (Bryan: "NO IT WASNT THE MOMNEY SOUND 0;02 0;04 THOSE NOISES"; 2026-11-08)

## Sound

- DO: use the real files, and vary them: whooshes from `assets/sound-effects/Whooshes` and the SFX Library, shuffled, no sound twice in a row, no one sound more than a few times. (Bryan: "how come u dont use the files of sfx we made its always the same sound", "this video has the same sfx too many times"; 2026-11-08)
- DON'T: build a whole layer from a few generated sounds or stretched synth swishes. They sounded like a kazoo. (Bryan: "supposed to sound like wind blowing woosh"; 2026-11-08)
- DO: put wind-like whooshes on transitions (`wh-*`) and lighter ones when text pops up (`wht-*`), leaving about half the text pop-ups silent. Keep them light, never deep or harsh. (Bryan: "should be airy wooshes"; 2026-11-08)
- DO: put a short UI tick on every bullet and list item: `lst-12` (SFX-1118 Soft Scroll Tick 05), which he picked, and lists may repeat it. (Bryan: "for the ui listed noises" use the one on the phone number; 2026-11-09)
- DO: use `lst-stage` (Ui Click Digital 04, a little louder) as a process lights up stage by stage. (2026-11-09)
- DO: use a wrong-answer buzz (`wrong-buzz`, SFX-1069) when an X or a failure appears. (Bryan: "do more of a wrong buzz noise"; 2026-11-09)
- DON'T: use low, pitched thuds or UI taps (SFX-0814/0802/0912, SFX-1389 "mellow pluck"). (Bryan: "like an annoying bonk i want something more premium"; 2026-11-08)
- DON'T: use eerie, booming or heavy whooshes. (Bryan: "transition at 1:10 isnt good noise"; 2026-11-08)
- DO: use a money sound on every price, both tags and not just one. Use literal sounds where the picture asks: `rubber-stretch` for a rope, `ui-glass-shatter` for a UI breaking. (Bryan: "cha-ching noise", "don't make explosion noise, just UI glass shatter noise"; 2026-11-07)
- DON'T: use booms, impacts, sub drops, braams, rumble risers, the `hit` cue, or loud scratchy glitches. (Bryan: "remove the random booms", "remove the loud random scratching noise"; 2026-11-07)
- DON'T: use beeps, dings, chimes or high-pitched UI blips. (Bryan: "I don't like the random beeps and high-pitch UI sounds, I want this to feel professional"; 2026-11-07)
- DON'T: put two sounds on one beat. (2026-11-07)
- DO: go light in the opening: about one sound every 5 s at most in the first 30 s. Key-line captions don't always need a hit. (Bryan: "too many random noises at the beginning", "no audio with waste of time"; 2026-11-07)
- DO: start typing sounds exactly when the text starts typing and stop when it stops. (Bryan: "the typing noise came too early"; 2026-11-07)

## How we work

- DO: when Bryan sends a screen recording of a tool, rebuild those screens in our look from it: the same buttons, labels, menu order and results, the cursor following his clicks. Never invent a UI or show the raw recording. Leave out account names, spend and audience sizes. (Bryan: "should I drop a screen recording and you re-render it in our animation style following the UI"; 2026-11-12)
- DO: change only the part of a graphic his note is about. Keep everything else exactly as it was. (Bryan: "everything past the beginning should've stayed how it was before"; 2026-11-11; 80-20 strategy hook)

- DO: listen to any new sound with `studio/listen.py` before using it, and run `studio/preflight.mjs` before showing work. (Bryan: "fix this use github to hear if needed"; 2026-11-09)
- DO: when he says to go ahead without approving graphics batches, build them all, check each still yourself, and go straight to the review render. (2026-11-07)
- DO: check whether a sound was actually placed (`sfx.json`) before changing one he complains about. If there is no cue at that moment, the noise is baked in. (2026-11-08)
