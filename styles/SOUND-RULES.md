# Sound rules: what goes where

Claude follows this when it writes a job's `sfx.json`. Sound names are in
`styles/sfx.json`. "Hit" means the loudest point of the sound; `studio/sfx.mjs` starts
each file early so its hit lands exactly on the `at` time you give it.

## The rulebook

| Moment in the video | Sound | Where it lands (`at`) | Volume |
|---|---|---|---|
| **Transition / layout change** (full face → split → full-screen graphic, scene to scene) | whoosh (rotate: whoosh, whoosh-med, whoosh-high, whoosh-simple) | hits **on the cut frame** | 0.13-0.14 |
| Transition **into or out of the presenter** (graphic → your face) | whoosh-simple | on the cut | 0.08 (soft) |
| Transition into a **serious or heavy** beat (the problem, a warning) | whoosh-low | on the cut | 0.14 |
| Transition into a **chart, data or app screen** | whoosh-data | on the cut | 0.14 |
| Card or element **flying in** fast from off screen | whoosh-high | when it **stops moving** | 0.13 |
| **Suspense / build-up before a reveal** ("and here's what happened…", the result, the answer, the twist) | riser | the riser's **end hits on the reveal frame**, so it builds through the line before it | 0.16 |
| Short lift into a smaller reveal (a number, the next step) | riser-short | ends on the reveal | 0.18 |
| **The reveal itself** (big number, title word, answer slams in) | hit | on the frame it lands | 0.26 |
| Card, chip, image, sticker **appears** | pop | the frame it's fully on screen | 0.26 |
| Notification, toast, phone message **lands** | digital | as it lands | 0.24 |
| Panel, window, document **opens** | open | when it's fully open | 0.20 |
| Screenshot, photo, proof **flashes in** | shutter | the flash frame | 0.28 |
| **List row lights up / grid cell fills / word types / counter steps** | tick (one per item) | each item's frame; in fast runs ~0.1s apart | 0.16 (0.12 in fast runs) |
| Button press, cursor click, selection | click | the press frame | 0.30 |
| Confirm: check mark, step done, search submitted | enter | as the check appears | 0.24 |
| Line, graph, underline **draws**, bar grows | stretch | when the draw **starts** | 0.20 |
| Something **fails / is crossed out / turns red / wrong answer** | glitch | the frame it breaks | 0.26 |
| **Verdict, badge, stamp, tier lock** slams on | stamp | the slam frame | 0.30 |
| Money, price, revenue on screen | money (big) / money2 (light) | as the number lands | 0.20 |
| A system or process **starts running** | gear | as it starts | 0.20 |
| One mechanical step clicks into place | gear-tick | the click | 0.22 |
| Dashboard or data **filling** | data (long) / data-short (blip) | as it starts filling | 0.16-0.18 |
| Time passing, days counting, countdown | stopwatch | over the count (once per video at most) | 0.13 |
| **Flash-cut transition** (white flash, fast swipe between scenes) | whoosh-flash | on the flash frame | 0.14 |
| **High-tension suspense** (dramatic reveal, a shock number, the twist) | riser-metal (instead of riser) | ends on the reveal frame | 0.06 (loud file) |
| **Number counting up/down** to its value | counting, trimmed to the count | starts when the count starts | 0.20 |
| Scrolling a list, carousel or feed; a dial turning | scroll | over the scroll | 1.0 (quiet file) |
| Phone notification / text message pops up | iphone-ding (or digital for a subtler UI blip) | as it lands | 0.22 |
| Typing on screen (search bar, message, prompt) | keyboard | starts when typing starts | 0.16 |
| Cursor clicks a button on a screen recording | mouse-click | the click frame | 0.28 |
| **Punch-in / zoom / focus pull** onto one thing | lens-focus | when the zoom settles | 0.20 |
| Build before a photo or proof flash | flash-charge, then shutter on the flash | charge starts ~0.5s before | 0.18 |
| Something stretches, bends, snaps back | rubber-stretch | the snap | 0.15 |
| Leak, flow, pour, fill (pipe / bucket / funnel visuals) | water-* (soft versions under speech) | with the motion | 0.05-0.10 |

## Spacing and balance

1. **Speech comes first.** Use the default volumes in `styles/sfx.json`; they're already
   matched to each file's loudness (mostly 0.08-0.35; a few quiet or loud files sit
   outside that on purpose). Never put a loud sound on a stressed
   word; nudge it to the gap just before or after (within 0.1s of the motion).
2. **One transition sound per cut.** Don't stack a whoosh and a pop on the same frame;
   if a card appears on the cut, the whoosh carries it.
3. **Risers are rare.** At most 1-2 in a short video, 1 per section in a long one
   (riser and riser-metal count together; use riser-metal only for the single biggest
   moment). A
   riser must end on something worth the build (a result, a number, an answer). Never
   end a riser on nothing, and never start one under a joke.
4. **No sound on plain talking.** If nothing moves, nothing sounds. Silence before a
   reveal makes the reveal land harder.
5. **Vary the whoosh.** Don't use the same whoosh twice in a row.
6. **Density** (your past 37 edits averaged about 40 sounds a minute):
   - Dense styles: every graphic motion gets its sound.
   - Light styles: transitions plus things that appear; no ticks on every word.
   - Minimal styles: a whoosh on big transitions and at most one riser.
   (Which style is which: the Sound section of STYLE-GUIDE.md.)
7. **First 2 seconds:** one strong sound at most (whoosh or hit on the hook). Don't
   open with a riser.
8. **Last frame:** end clean. No whoosh or riser trailing past the final word.

## How Claude times them

- Take `at` from the composition's own animation times (when the element finishes
  moving, when the cut happens), never by guessing from the transcript.
- For risers, `at` = the reveal frame; the tool starts the riser early so it builds
  into it.
- Log a short `note` per sound ("tier card lands", "reveal: 30 days") so the review
  page shows why it's there.
