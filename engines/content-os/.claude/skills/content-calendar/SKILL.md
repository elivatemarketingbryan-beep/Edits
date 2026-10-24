---
name: content-calendar
description: Shows and plans the content week: what's going out, what's drafted, what's still empty and what's at risk, across videos (Notion pipeline) and text pieces (drafts/). Triggers: /content-calendar, what's going out this week, what do I still owe, plan next week, plan November, fill the calendar, I posted the reel.
---

# Running the calendar

The calendar answers "am I on track?" in five seconds. Two sources, one view:

- **Videos** live in Notion (`notion-pipeline.md`): Status `Idea → Scripting → Filming → Editing →
  Review → Ready → Posted`. Notion is the truth for a video's stage; never copy the stage by hand.
- **The week plan** lives in `calendar.md`: which piece goes out on which day, on which platform,
  linking the Notion page (videos) or the draft file (captions, carousels, posts).

Each `calendar.md` row has one status: `planned` → `drafted` → `approved` → `published`. **Claude
may set `planned` and `drafted`. Only Bryan sets `approved` and `published`** (or `auto-poster`
succeeding, which also flips Notion to `Posted`). A calendar that lies is worse than none.

## Showing the week (no arguments)

1. Read `calendar.md` for this week and next.
2. For every row that links a Notion page, fetch its current Status (one `notion-query-data-sources`
   call for all of them, not one per row).
3. Lead with what's at risk, not a table dump:

> **This week:** 4 of 5 ready. Friday's carousel has nothing against it.
>
> Tuesday's reel is still at Editing in Video Studio. Wednesday's caption has one `[NEED:]`.
>
> **Next week is empty.** Two scripts sit at Filming; film them by Thursday and next week fills.

## Planning ("plan next week", "fill November")

1. **Read the commitments** in `platforms.md` (cadence per platform). That's the floor.
2. **Find open slots** in the next 14 days.
3. **Find material:** Notion pages at `Filming`/`Ready` (videos nearly done), unmined long-forms in
   Video Studio `../../projects/`, research in `knowledge/`.
4. **Check the last 8 weeks** of Notion `Posted` pages and the Published table: don't repeat a topic,
   do repeat a format that performed.
5. **Fill slots with named ideas**, not categories. "Tue: reel — Nobody sees the 5am mornings" is a
   plan; "Tue: educational reel" is not.
6. **One piece per week points at the offer** in `backbone/offer.md`.
7. Plan two weeks out, well, not six weeks thin.

## Recording what happened ("I posted the reel")

Set the row to `published`, move it to the Published table with any numbers he gives, and flip the
Notion page to `Posted` + `Post Date` if it's a video and that isn't done yet.

## Gap detection: say these out loud every time the calendar is touched

- A slot inside 48 hours with nothing ready (no draft file, or the video isn't at `Ready`)
- A cadence in `platforms.md` with no slot this week
- A Notion page at `Ready` with no slot (finished and not scheduled)
- Anything `drafted` for 10+ days and never published (dead, or approval is stuck)
- Four or more pieces in a row with no CTA to the offer

## Running unattended

Never mark anything `approved` or `published`. Write drafts, set `drafted`, and put gaps under
`## Needs You` in the summary. If a slot inside 48 hours has no material, say so instead of writing
something generic to fill it.

Adapted from the content-manager plugin by Kyle Herbel.
