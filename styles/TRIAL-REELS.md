# Trial reels: how to write, vary and farm them (Trial Reels page)

How Claude writes and makes the versions for the Trial Reels page (`/trials`). The flow and the file
layout are in `docs/studio/trials.md`. Trained on two videos Bryan picked (2026-11-14):

- **Max Tornow, "The Trial Reels Formula That Actually Works"** (https://www.youtube.com/watch?v=p7BHcPHxtFA):
  versions, the duplicate flag, picking the winner, the farming method.
- **heyDominik, "How to Force the Instagram Algorithm to Push Your Reels (based on data)"**
  (https://www.youtube.com/watch?v=6u4MGM_KZ5I): skip rate, watch time by length, share rate,
  algorithm clarity, trust score.

Their numbers are from their own accounts and clients, not Instagram. Use them as targets, and trust
Bryan's own results over them as his trials pile up.

## Read before writing

1. The trial's idea and notes (`node studio/trials.mjs show <id>`), and its source script or
   transcript if it's cut from long-form.
2. `engines/content-os/voice-dna.md` (how Bryan talks on Instagram, his CTA "Follow for more
   breakdowns like this") and 2 or 3 of his top reels in `engines/content-os/voice-corpus/`.
3. `plans/blueprint.md` for the offer and the audience. Same honesty rules as long-form
   (`styles/LONGFORM-SCRIPT.md` "Honesty"): no invented numbers, results or testimonials.
4. `styles/SCRIPT-SHAPES.md` for the short-form shapes and cue tags.

## How trial reels work (Max Tornow)

- A trial reel is shown only to non-followers, in widening rings: a small group first, then bigger
  groups if they watch and engage. So views stall early when a reel doesn't land with strangers.
- What a trial's views say: **under 100** = weak, or flagged as a duplicate of another version;
  **100 to 1,000** = okay, not landing with new people yet; **1,000 to 10,000** = very good;
  **10,000+** = farm it (it can reach 100K+). The page shows this band under each version's views.
- New people give no benefit of the doubt, so trial views run lower than feed views. That's the point:
  it trains reels that win new people.

## Writing the versions

- **5 to 10 versions** of one reel (the page allows 2 to 10; default 5). One message, one body.
- **The hook is what changes most:** a different verbal hook, a different visual hook (the opening
  shot or text), a longer or a shorter hook, and a different total length. Write each hook from a
  different angle (a callout, a contrarian line, a number, a question, a mistake), using Bryan's
  openers in voice-dna.
- **Win the first 5 to 10 seconds, not just the first 3** (heyDominik): whether a reel holds people
  past 5 to 10 seconds predicts a breakout better than anything else. A great hook with nothing at
  second 4 still dies. So put a **second hook** at about 3 to 5 seconds (a pattern interrupt, a
  number, "but here's the part nobody tells you") and open a loop the body pays off.
- **The topic matters as much as the hook.** A reel people are dying to get the answer to beats a
  perfectly tuned hook on a dull topic. If the idea is weak, say so in the trial notes before writing.
- **Length targets** (heyDominik, average watch time of breakout reels): under 10 s needs almost
  100% watched; about 30 s needs 8 to 11 s; 30 to 60 s needs 13 to 17 s; **60 to 90 s needs about
  18 s (the sweet spot)**; 90 s+ needs about 28 s, and those broke out twice as often. For Bryan's
  teaching reels, aim for 45 to 90 seconds unless the idea is a one-liner.
- **Write for shares** (the strongest lift): something a contractor sends to another contractor, or
  a homeowner sends to their spouse. A share rate of 1 to 2% lifts a reel slightly, 2 to 3% clearly,
  5% sends it.
- **Algorithm clarity:** Instagram reads what is said and what is in the frame to decide who sees it.
  Say who it's for, in plain words, in the first lines: "contractors", "roofers", "remodelers",
  "homeowners". Avoid words that belong to other niches (heyDominik's example: "tapering" got shown to
  people tapering off medication) and brand names tied to another audience (his client's "QuickBooks"
  examples got shown to bookkeepers). Keep the frame on-niche: job sites, trucks, tools, a phone with
  leads; no unrelated hobby objects behind Bryan.
- Each version's `script` is the spoken words with cue tags; `changes` says, in one line, what else
  differs (length, speed, mirror, captions). The CTA is Bryan's: "Follow for more breakdowns like
  this", or a comment keyword only when the trial calls for one.

## Beating the duplicate flag (Max Tornow)

Instagram checks the whole video, not just the hook, for overlap between versions. Too much overlap
and a version gets duplicate-flagged and stalls at 0 to 50 views. So besides a new hook, give every
version at least two of these, and never repeat a combination:

- speed up a section to 1.1x, or slow one to 0.9x;
- mirror the video (horizontal flip), when no text or logo is in the shot;
- cut a different part out of the middle (a different total length);
- different caption font, colors or position (inside the brand: purple structure, gold reward);
- a different first shot, background or b-roll.

Accounts Instagram trusts less get flagged more easily (heyDominik): a new account, a long break, or
a niche pivot. If Bryan's trials keep stalling at 100 to 200 views even with real changes, it's
likely that: tell him to keep posting steadily in his niche for a few weeks, and make the versions
more different. Never post a reel from the feed again as a trial: that's flagged as a duplicate.

## Picking the winner (Max Tornow)

- Wait **16 to 24 hours** after posting, then compare views and engagement. The page marks the
  leader (most views, with shares and saves weighted in); Bryan picks the winner.
- Also check heyDominik's three numbers on each version: skip rate (breakouts are **45% or less**;
  the top 10% are 31% or less; compare with his own average too), average watch time against the
  target for its length, and share rate. The page grades these when he logs them.
- To share the winner with followers, **re-upload it natively to the feed** as a new post. Don't use
  "Share to anyone" on the trial: it adds a few hundred follower views and doesn't restart the reach.

## Farming the winner (Max Tornow)

One reel's views are a vanity number; what matters is total views (and leads) over time. Once a
version wins:

- **Repost it as a trial about every 7 days**, with fresh small changes each time (same list as
  above). Reposting sooner than 7 days did worse in his tests.
- **Repost it on the feed every 1 to 4 weeks**, with other posts in between (the feed doesn't flag
  duplicates).
- **Remake it**: the same script shot in a new location or format (a new hook location, props, a
  walking shot, a different body format).
- When it stops bringing views and followers, rest it for a few weeks, then start again. There's no
  maximum number of reposts.
- A `farm` request asks Claude for the next repost version: new variations, different from every
  earlier upload, saved in the winner's `final/` folder as `repost-<date>.mp4`.

## Animated trials (Bryan's cloned voice)

For trials made as cartoon story reels (format "Animated, my cloned voice"):

- **Write a story, not a lecture:** a contractor (the faceless figure) in one situation the viewer
  knows (the phone ringing on a roof, the estimate that went quiet, the shared lead), what goes
  wrong, the fix, the result. Same rules as above: hook, second hook by 3 to 5 seconds, one idea.
- **Write it to be heard.** Short sentences, every word sayable: money as words is handled by the
  voice tool ($500,000 is read right), but spell out anything odd. No cue tags or stage notes in
  what's voiced; they stay for the edit.
- **Bryan approves every word** with "Approve these words for my voice" before anything is voiced,
  and the approval breaks if a word changes. Never voice a number, result or claim he didn't give.
- **Versions:** each version gets its own voiced hook; the body can be voiced once and shared. Make
  versions differ in what's seen as well as heard (scene colors, scene order, the opening scene,
  caption style, total length), so none gets duplicate-flagged.
- How the voice is made and checked: `docs/studio/voice.md`. How the request is answered:
  `docs/studio/trials.md` "animate".

## Cutting from long-form

A `cut` request turns a finished long-form video into versions: find self-contained moments that
make sense to a stranger with no context (a hook, a payoff, under 90 seconds), one moment or one
hook per version, then cut each to 9:16 with captions. The long-form scripts already mark the strong
lines: `[HOOK]`, `[EMPHASIS: …]`, the verdict lines ("The lead showed up. The phone didn't.").
