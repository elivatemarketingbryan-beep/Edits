# Instagram and Sheets

Approved reels (and finished single edits) get a **Post to Instagram** button on the studio page. Posting uploads
the video with its caption through the official Instagram Graph API, then adds a row to a Google Sheet that
tracks **retention by design**: which formats, combos and effects hold people longest, with engagement alongside.
No follower columns (Bryan's call). Every 7 days each row is refreshed and the designs are re-ranked.

| File | Job |
|---|---|
| `studio/instagram.mjs` | Create the Reel container, resumable upload from this computer, wait for processing, publish, read retention |
| `studio/sheets.mjs` | Service-account sign-in (no packages), the Reels and Designs tabs |
| `studio/ig-stats.mjs` | Posting in the background, the design snapshot, retrying rows that missed the sheet, the refresh CLI and ranking |
| `Refresh Instagram Stats.cmd` | What the weekly Windows task runs (`--if-due`) |
| `.env` (git-ignored) | Keys and ids; copy `.env.example` |

## The sheet

**Reels tab** (or `SHEET_TAB`), one row per post:

| Columns | Written | What |
|---|---|---|
| Date posted, Reel, Link, Post ID | at posting | |
| Format, Effects, Hook graphic, Graphics, Length (s) | at posting | The design: the catalog format, the combo (`Combo: name`) and picked effects joined with ` + `, the first graphic's label, how many graphics, the length |
| Views, Avg watch (s), Retention %, Held past 3s % | each refresh | Retention % = average watch time / length (over 100% = rewatches). Held past 3s % = 100 - Instagram's 3-second skip rate |
| Likes, Comments, Shares, Saves, Engagement, Engagement %, Reach, Stats updated | each refresh | Engagement = Instagram's total interactions; Engagement % = engagement / reach |
| Job, Caption | at posting | |

**Designs tab**, rebuilt on every refresh: each Format, Combo and Effect with how many reels used it, average
retention, average held past 3s, average watch time, average engagement %, total views, and its best reel. Sorted best retention first
within each kind; ties go to the stronger hook. Only reels with retention data count.

Stats are matched to rows by Post ID, so rows can be sorted or annotated freely; only columns J-Q are overwritten.
The design is captured when the post goes out (`design` on the reel in `reels.json`, or on `job.json`).

## Metrics used (Instagram Graph API, Reels)

`ig_reels_avg_watch_time` (ms), `reels_skip_rate` (% skipped in the first 3 s; Meta marks it estimated and in
development), `views`, `likes`, `comments`, `shares`, `saved`, `total_interactions`, `reach`. Insights can lag up to 48 hours, so the first refresh after a
post may be partly empty. Metrics Instagram can't compute are left blank.

## One-time setup (Bryan)

1. **Instagram:** a Business or Creator account and a Meta app. With Instagram Login, generate a long-lived
   token with `instagram_business_basic`, `instagram_business_content_publish` and
   `instagram_business_manage_insights`. Put the account id and token in `.env` as `IG_USER_ID` and
   `IG_ACCESS_TOKEN`. (Facebook Login works too: set `IG_GRAPH_HOST=graph.facebook.com` and use the matching
   `instagram_*` scopes.) Long-lived tokens last 60 days; refresh before they lapse or posting fails with an auth error.
2. **Google Sheets:** in Google Cloud, enable the Sheets API, make a service account, download its JSON key
   somewhere private, and set `GOOGLE_SERVICE_ACCOUNT_FILE` to its path. Make the sheet, share it with the key's
   `client_email` as Editor, and set `SHEET_ID` from its URL. The tabs and headers are created on first use.
3. Restart the studio. The page stops showing "Instagram isn't connected".

## Weekly refresh

- Windows task **Video Studio IG stats**, Mondays 09:00, runs `Refresh Instagram Stats.cmd --if-due`.
  Remove it with `schtasks /Delete /TN "Video Studio IG stats" /F`.
- The studio server also refreshes on start and every 6 hours while it runs, whenever the last refresh was 7+ days
  ago (`jobs/.ig-stats.json` holds the time), so a missed Monday is caught up.
- By hand: `node studio/ig-stats.mjs` (refreshes now).

## Notes

- Reels must be 3s-15min, under 300 MB per Meta's limits; captions max 2,200 characters (checked before upload).
- Instagram allows 50 API posts per account per 24 hours.
- Never post for Bryan: the button is his.
