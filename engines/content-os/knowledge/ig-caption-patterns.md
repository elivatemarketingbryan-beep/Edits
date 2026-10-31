---
status: compiled
last_updated: 2026-10-31
sources:
  - Video Studio projects/_ig-research/dataset.json (Apify scrape, ~2026-10-24, not committed)
  - knowledge/competitor-reel-length.md
---

# Instagram caption patterns (competitor captions, measured 2026-10-31)

What the captions on 59 competitor posts say about writing Bryan's. Read by every skill that writes an
IG caption (`auto-poster`, `repurposing`, `carousel-generator`). `voice-dna.md` and `backbone/offer.md`
still win on wording and the CTA; this page is about shape.

Sample: @mandothemarketer (29 posts, 20 reels) and @sparkmarketingagency.co (30 reels). Likes and
comments only (the scraper returns no play counts). Two accounts is a small sample, and Mando's
audience is far bigger than Spark's, so compare *within* an account, not across them.

## The numbers

| | @mandothemarketer reels | @sparkmarketingagency.co reels |
|---|---|---|
| Caption length, median | 42 words | 98 words |
| Reels with a comment/DM keyword CTA | 8 of 20 | 1 of 30 |
| Avg comments, with keyword CTA | **14.9** | 0 |
| Avg comments, no CTA | 8.6 | 0.2 |
| Hashtags (when used) | median 6, niche trade tags | median 8, generic |
| Avg likes per reel | ~290 | ~3 |

- **A keyword CTA nearly doubles comments** on Mando's reels (14.9 vs 8.6). His best: "Dm me the word
  "Leads"", "comment "system"", "dm me the word "Marketing"".
- **Spark writes mini-essays (~100 words, 4-8 paragraphs) and gets almost no engagement.** The caption
  repeats the video instead of adding to it, and 29 of 30 have no ask.
- **Mando's top business reels lead with a proof number + the trade:** "900 linear feet galvanized fence
  in the works", "1,500 sqf drive way from our ad campaign", "64k in his first week". Result first, how
  it happened second, the ask third.
- **One-line opinion captions work as well as long ones:** "Ads bring leads today. SEO brings them
  forever." (172 likes), "Tracking is everything" (179). Short is not a penalty.
- **Questions to the audience pull comments** ("What's yours guys sales process look like? Drop in the
  comments").
- **Trade hashtags, not marketing hashtags:** Mando tags the homeowner-side trade (#concrete #fencing
  #welder #bluecollar) so the post reaches contractors in that trade, not other marketers.
- His highest-liked posts overall are personal-win photo carousels in Spanish (cars, family, "Gracias a
  Dios"), 1-26 words. Faith and story travel; that's a carousel lane, not a reel caption rule.

## Rules for Bryan's reel captions

1. **Line 1 = the hook, under ~12 words**, so it shows before "more". Lead with the proof number if the
   video has one ("11 reviews to 64 in six months."), else the contrarian line from the video.
2. **Body = 1-3 short lines that add something the video doesn't say out loud**, such as the takeaway
   or the one step to do today. Don't summarize the reel back.
3. **Total 25-60 words** before hashtags. Over 80 is Spark territory.
4. **End with one ask:** the comment keyword from `backbone/offer.md` when the video teaches a system
   Bryan sells ("Comment SYSTEM and I'll send you the setup"), or a question when it's an opinion
   ("What's your follow-up look like? Drop it below"). Otherwise use "Follow for more breakdowns like
   this." Only one ask, never all three.
5. **Hashtags: 5-6, on their own line after a blank line.** Mix niche marketing tags with 1-2 trade
   tags that fit the video (#concrete #roofing #fencing #landscaping). Bryan's base set:
   `#contractors #contractormarketing #googlereviews #homeimprovement #leadgeneration #contractorsofinstagram`.
   Swap #googlereviews for the video's topic (#metaads, #seo, #leadtracking).
6. **Emoji: 0-2**, as markers (📈 next to a number, 🙏 on a faith line), never decoration.
7. Real numbers only, from the video or `backbone/`. A result needs its source line.

## Hashtag list

Pick 5-6 per caption: the base set, swap one tag for the video's topic, add one trade tag if the video
names a trade. Tags marked † were used by competitors (count in brackets).

**Base set (every reel)**
`#contractors` † (4) · `#contractormarketing` † (3) · `#homeimprovement` † (1) · `#leadgeneration` † (3) · `#contractorsofinstagram`

**Topic (swap in for the slot that matches the video)**

| Video is about | Tags |
|---|---|
| Google reviews, reputation | `#googlereviews` `#onlinereviews` `#reputationmanagement` |
| Google Maps, local SEO | `#localseo` `#seo` † (1) `#googlemaps` `#googlebusinessprofile` |
| Meta / Facebook ads | `#metaads` `#facebookads` `#paidads` † (1) `#ads` † (4) |
| Leads, follow-up, CRM | `#leads` † (4) `#crm` `#followup` `#salesprocess` `#sales` † (1) |
| Lead tracking, data | `#leadtracking` `#marketingdata` `#roi` |
| Websites | `#contractorwebsite` `#webdesign` |
| Automation, systems | `#marketingautomation` `#systems` † (1) |
| Growth, business | `#contractorgrowth` † (2) `#businessgrowth` † (1) `#constructionbusiness` † (1) `#smallbusiness` |
| General marketing | `#constructionmarketing` † (2) `#marketingtips` † (1) `#marketingstrategy` † (1) `#digitalmarketing` † (1) |

**Trade (add one when the video names the trade)**

| Trade | Tags |
|---|---|
| Concrete | `#concrete` † (3) `#concretelife` † (2) `#concreteconstruction` † (1) |
| Fencing, welding | `#fencing` † (2) `#welding` † (2) `#welder` † (2) |
| Landscaping, hardscape | `#landscaping` † (1) `#hardscaping` † (1) |
| Pools | `#poolbuilder` † (1) `#poolconstruction` |
| Roofing | `#roofing` `#roofer` |
| Remodeling | `#remodeling` `#kitchenremodel` `#bathroomremodel` |
| HVAC, plumbing, electric | `#hvac` `#plumbing` `#electrician` |
| Painting | `#painting` `#paintingcontractor` |
| General construction | `#construction` † (2) `#bluecollar` † (7) `#contractor` † (8) `#contractorlife` † (2) |

**Faith / story posts (carousels, personal wins)**
`#faithandbusiness` `#christianentrepreneur` `#kingdombusiness` `#godfirst` `#entrepreneurlife`

**Skip:** `#fyp`, `#marketing` and `#business` on their own (too broad, the post gets lost),
`#giveaway` unless it really is one, gear tags (`#dji`, `#osmopocket`), and another agency's brand tag.

## Gaps

- `backbone/offer.md` has no comment keyword yet (`<<COMMENT_KEYWORD>>`). Until Bryan picks one, rule
  4 falls back to a question or "Follow for more breakdowns like this."
- No play counts, so "what performs" means likes and comments. Re-measure after the next
  `ig-competitor-research` run, and add @azaelthemarketer, @alex.morales.llc and @cesar.sparkmarketing.
