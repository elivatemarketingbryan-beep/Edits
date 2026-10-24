# 🎨 Brand Kit — make this content system yours

This is the **one file you fill in.** Everything the system writes for you (scripts, hooks,
carousel copy, captions, DM re-openers, YouTube descriptions) reads your identity, offer, voice,
and competitors from the files this kit populates. Fill in Part A, then tell Claude
**"apply my brand kit"**. Part B (bottom) is the exact map of what that changes, if you'd rather do
it by hand or want to check Claude's work.

**Not optional (unlike a video editor's brand kit).** Without it the writing skills sound like
nobody, the research skills have no competitors to scan, and scriptwriter has no Notion DB to write
into. The transcription + research machinery works before it; the *voice* comes from here.
Leave anything blank you don't know yet; Claude asks for the blanks in one message.

---

# Part A — fill this in

## 1. Identity

- **Name:** Bryan  (first name is what the skills use in prose)
- **Instagram handle:** elivatemarketing.bryan (without the @)
- **YouTube handle:** `<<YOUR_YT_HANDLE>>` (without the @) · **channel ID:** `<<YOUR_YT_CHANNEL_ID>>` (the `UC…` id from YouTube Studio → Settings → Channel → Advanced; used to pull your latest description as the live skeleton) — still needed if you have a public channel beyond a private funnel video
- **TikTok handle:** `<<YOUR_TIKTOK_HANDLE>>` (or "none")
- **Site / email:** `<<YOUR_SITE_OR_EMAIL>>` (optional)
- **Timezone:** America/Los_Angeles

## 2. Niche and voice (one line each; the corpus builder replaces the voice guess with real data)

- **Niche:** Marketing agency for God-driven contractors (websites, Meta ads, SEO, lead tracking)
- **Voice/tone:** `<<YOUR_VOICE_ONE_LINER>>` — e.g. "warm, plain-spoken, a little dry; teaches by showing" or "fast, blunt, slang is fine" (the corpus builder will replace this guess with real data once there are videos to draw from)
- **Backstory (2-4 lines, for content):** 
  ```
  Mission: help God-driven contractors add an extra +$30k in additional monthly revenue.
  Current problem (Bryan's own content struggle, not the ICP's): creating content that
  actually teaches value without it all sounding the same — this is exactly what this
  session's hook/topic research is solving.
  Desired outcome: post more content that actually teaches well.
  ```

## 3. The offer (one offer, one motion)

- **Offer name:** Elivate Marketing
- **URL:** `<<OFFER_URL>>`
- **Price:** Not stated in content — Bryan routes pricing conversations to his sales funnel/video instead. Internal reference only: websites $1,000/$2,000/$3,000, marketing retainers $1,400-$6,000.
- **Positioning (one sentence, outcome-first):** Predictable, high-quality projects every month for contractors — one bundle (website + SEO + Meta ads) centralizing all their leads into one app, instead of juggling scattered tools/agencies.
- **Deliverables (flagship first, 3-6 lines):**
  ```
  Websites ($1,000 / $2,000 / $3,000 tiers)
  Meta ads
  SEO + lead tracking
  Marketing automations
  Consulting
  ```
- **Bonuses / guarantee:** $30,000 in sold jobs within 90 days or you don't pay
- **Comment keyword** for free giveaways ("comment X and I'll send it"): `<<COMMENT_KEYWORD>>`
- **Anything you do NOT sell / never want pitched in content:** `<<RETIRED_OFFERS>>` (or "none")
- **Side doors** (a paid call, a service page) that exist but must never be a content CTA: `<<SIDE_DOORS>>` (or "none")

## 4. Who it's for

- **ICP one-liner:** God-driven contractors who want predictable, high-quality projects every month
- **Segments (2-3):** `<<ICP_SEGMENTS>>`
- **Their problems / desires:** Inconsistent lead flow / scattered marketing tools and agencies; want centralized, predictable lead generation that converts to signed jobs
- **Who you don't serve:** `<<ANTI_ICP>>`

## 5. Proof bank (real numbers only; you'll refresh these in `backbone/messaging.md` later)

- **You:** `<<YOUR_PROOF>>` (followers, revenue, years, notable results)
- **Client / member wins:** `<<CLIENT_WINS>>` (format "Name: before → after in N days"; or "none yet")

## 6. Competitors (the research skills scan these; order = priority, top 5 by default)

**YouTube channels** (handle or URL, one per line, best first):
```
<<YT_COMPETITORS>>
```
**Instagram accounts** (handle, one per line, best first):
```
cesar.sparkmarketing
azaelthemarketer
alex.morales.llc
mandothemarketer
```

## 7. Connections

- **Notion:** the page the content database should be created under: "Elivate Marketing Content" (https://app.notion.com/p/28b789bbffea83a78c1d819cb66c203c)
- **Zernio (posting):** paste your API key into `.claude/skills/auto-poster/.env` (copy `.env.example` first; the key never goes in this file). Platforms you have connected in Zernio: `<<ZERNIO_PLATFORMS>>` (any of instagram, tiktok, youtube, linkedin, facebook, threads)
- **Video editor:** do you also run the Claude Video Editor system? `<<VIDEO_EDITOR: yes at ~/Projects/video-editor / no>>` (yt-description reads finished jobs from it; without it, descriptions read the Notion beat sheet)

## 8. Voice corpus (built by Claude, nothing to type)

The real voice comes from your own top videos: after applying the kit, Claude runs
`voice-corpus-builder` on the handles above (default: top 15 YouTube uploads + top 20 Instagram
reels), transcribes them into `voice-corpus/`, and drafts `voice-dna.md`. If part of your back
catalog is an old niche you don't want imitated, say so here: `<<OLD_ERA_NOTE>>` (or "none").

## 9. Face refs (optional, for AI carousel covers)

Not text: drop 3-4 square photos of your face into `assets/face-refs/` (see its README). Only used
when a carousel manifest sets `face_refs: true`.

---

# Part B — what "apply my brand kit" changes (the exact map)

Claude does all of this from Part A, in this order, telling you what it wrote. Read it only to
verify or do it by hand.

1. **`CLAUDE.md` → Creator Profile + Offer sections.** Every `<<placeholder>>` in CLAUDE.md is
   replaced from sections 1-3 (name, handles, channel ID, niche, voice one-liner, offer name + URL,
   retired offers). Price and proof numbers are NOT written into CLAUDE.md; they live in the backbone.
   The SessionStart hook stops nagging once no `<<` tokens remain in CLAUDE.md.
2. **`backbone/vision.md`, `offer.md`, `icp.md`, `messaging.md`** from sections 2-5, with today's date
   in each "Current as of" header. Blanks stay as `<<placeholders>>` (visible, never silently invented).
3. **`competitor-list.md`** from section 6: one block per channel/handle in the given order, URLs
   normalized (`youtube.com/@handle/videos`, `instagram.com/handle/`), sub counts filled by yt-dlp
   where cheap. The EXAMPLE blocks are removed.
4. **Notion DB** from section 7: `notion-create-database` under the named parent page with the exact
   property schema in `notion-pipeline.md`; then `notion-fetch` it and write the Database ID, Data
   source ID, URL, and name into `notion-pipeline.md`'s Identity table (status line → "live").
5. **`.claude/skills/auto-poster/.env`** from section 7: if the file exists with a `ZERNIO_API_KEY`,
   Claude runs `python3 .claude/skills/auto-poster/scripts/post_to_zernio.py --list-accounts` (prints
   one paste-ready `ZERNIO_ACCOUNT_<PLATFORM>=<id>` line per connected account, never the key) and
   writes those lines + `ZERNIO_TIMEZONE` into the file. If there's no key yet, this step is skipped
   and noted.
6. **`.claude/skills/yt-description/references/links.md`**: the fixed rows (offer URL, Instagram,
   TikTok) from sections 1 and 3; the tools/referral tables stay empty for you to grow.
7. **`yt-description` skeleton pull**: nothing to edit; the skill passes `--channel` from the YouTube
   handle Claude wrote into CLAUDE.md (or `YT_DESC_CHANNEL` if you set it).
8. **Voice corpus** (section 8): run `voice-corpus-builder` on the handles (Apify MCP for IG,
   yt-dlp for YT), tag entries, build `voice-corpus/index.md`, draft `voice-dna.md`. This is the
   longest step (transcription runs a few minutes) and the one that makes scripts sound like you.
9. **Verify:** `python3 .claude/skills/scriptwriter/scripts/find_voice.py --list` shows tags with
   counts; `hook-generator` produces a spread for a test topic in your voice; `grep -cE '<<[A-Z]' CLAUDE.md`
   prints 0 (no ALL-CAPS placeholders left).

Refresh later: edit the backbone files directly (they're the source of truth) or re-run "apply my
brand kit" after changing this file; re-run "build my voice corpus" when new winners land.
