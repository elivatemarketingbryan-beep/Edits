# Post captions (the text under the reel)

The caption that goes under a reel on Instagram. It shows under every open video in the studio and is what Post to Instagram
sends. Format learned from Joe Aquino (@thejoeaquino), the 9 posts in `engines/content-os/transcripts/url/style-ref_thejoeaquino-*`
(Bryan 2026-11-10: "go through joe aquino's captions to figure out how to format").

## The shape

1. **Line one is the point, sharper than the hook.** One sentence that stands alone in the feed preview. Often the
   video's payoff line, not its first line. ("You can't save your way to more clients.", "Kingdom impact will always
   outweigh any monetary gain.")
2. **Then 1 or 2 short paragraphs**, 1 to 2 sentences each, with a blank line between every paragraph.
3. **Contrast and plain metaphors carry it.** "Attract, don't convince. Serve, don't sell." "Your marketing is the engine."
4. **Some posts are one line and nothing else.** That's fine when the video says it all.
5. **No emojis, no "link in bio".** Plain sentences, normal capitals.
7. **Hashtags last, always the same block, one blank line below the last paragraph** (Bryan 2026-11-10):
   `#contractors #contractormarketing #googlereviews #homeimprovement #leadgeneration #contractorsofinstagram`
6. **Comment-to-get CTA only when there's a real thing to send:** `Comment "ads" and I'll send you the full breakdown.` as the
   first line. No real freebie means no CTA.

## Our rules on top

- Write it from his words in the transcript. Only numbers he says, and no stat that still needs a source.
- "my client", never "your client". Under about 70 words.
- Save it as `caption` in the job's `job.json` (reels: `caption` on each reel in `reels.json`) when the edit goes to review.

## Example (tof-09)

```
Boosting a post isn't running ads.

Likes go up and it feels like it's working. But likes don't book jobs.

A real ad has a goal, a specific audience, and sends people somewhere built to get you a call.

#contractors #contractormarketing #googlereviews #homeimprovement #leadgeneration #contractorsofinstagram
```
