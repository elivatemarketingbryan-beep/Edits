# SOURCING — finding the real media

How much of this you do is set by the creator's **research level** in `brand/brand.json`
(SKILL.md "Research levels"). The rules for judging media apply at every level — even level 0,
where the creator hands you the files.

---

## 0 · The one hard rule
**It must look like the creator recorded it.** No webcam bubble in the corner, no other
presenter's face, no YouTube UI, no channel watermark, no other creator's captions, no
cursor-trail effects. A clip with a talking head in the corner is unusable — not croppable.
The exception: the person **is** the subject of the line.

## 0a · Source FIRST — approved before a beat is built
Read the script → decide what real media each beat needs and WHERE it lands → find it → open it for
the creator → they say yes or no per beat → then build. Never cut in media they have not seen.

```bash
scripts/py <skill>/scripts/source-scout.py <video>/scout.json        # writes + opens SOURCING.html
scripts/py <skill>/scripts/source-scout.py <video>/scout.json --only b2   # re-scout a rejection
```
**Show it early and rough.** One real option per beat on a page beats a polished set built on the
wrong premise. Rejected → find another; do not argue it.

## 1 · Priority order — best first

| | source | why | how |
|---|---|---|---|
| 1 | **real footage / screen recording of the exact thing** | nothing beats the actual feature moving | the creator records it, or `fetch-source.py video` |
| 2 | **the product's own UI, live** | the demo spine | screen-record it; or a 9:16 page shot of the real page |
| 3 | **a Reddit thread / an X post** | real people, receipts, the founder saying it | the creator's own logged-in browser (see below) |
| 4 | **a repo / release / listing page** | concrete, dated, verifiable | `curl -o repo.png https://opengraph.githubassets.com/1/<owner>/<repo>` |
| 5 | **the official docs/pricing page** | authoritative, visually dead — only for a claim | `shoot-page-9x16.py` |
| — | a blog post | boring. Rarely the fifth choice | |

**A real thing beats a designed thing; a designed thing beats a bad source.**

## 2 · Judge every clip before you commit
`fetch-source.py` writes a contact sheet beside every clip. Look at it. Reject:
a webcam bubble · burned-in captions · a cursor trail · YouTube chrome · a 16:9 clip with tiny UI
(unreadable at 9:16) · a slideshow of stock footage.

**Every sourced clip is normalised to 30fps CFR** (`fetch-source.py` does it). yt-dlp returns
24/25/50/60fps or variable frame rate, and dropped into a 30fps composition it judders or drifts.

**Every page is shot 9:16 at a narrow viewport** (`shoot-page-9x16.py`, ~560 CSS px): a desktop
page squeezed into 1080 wide scales type to 0.7x and is unreadable; the narrow shot scales it UP.
**Look at every PNG.** Login walls, cookie banners and JS-heavy pages come back as perfect-looking
pictures of nothing.

## Reddit and X
Both serve a bot wall to headless browsers with HTTP 200 — a valid screenshot of "you've been
blocked". `shoot-page-9x16.py` refuses to save a shot that reads as a wall. The route that works:
the creator's own logged-in browser (a browser-automation tool, or they screenshot it and drag the
file to the Desktop). Official embeds are the second option. **Never fake a post in your own
styling** — it is a fabricated record.

## 3 · Rights — flag before it reaches a render
- quoting a public post as a screenshot is normal editorial practice; **lifting someone's video**
  is not. Prefer the post over the video.
- a short excerpt (~4–6s) used to comment on the thing is one thing; a long lift is another.
- anything with a person in it needs a reason to be there.
- **if rights are unclear, say so before it is cut in.** Never quietly ship it.

## 4 · Recipes
```bash
# a real clip — probe four points before committing to one
scripts/py <skill>/scripts/fetch-source.py video "<url>" <video>/assets/broll/thing.mp4 --probe
scripts/py <skill>/scripts/fetch-source.py video "<url>" <video>/assets/broll/thing.mp4 --at 3:12 --dur 5

# a real page as a true 9:16 frame (needs Playwright: doctor.sh --fix --pages)
scripts/py <skill>/scripts/shoot-page-9x16.py "<url>" <video>/assets/pages/pricing.png

# a repo card
curl -o <video>/assets/pages/repo.png "https://opengraph.githubassets.com/1/<owner>/<repo>"

# a landscape screen recording -> the 9:16 region that matters, 30fps
ffmpeg -i rec.mov -vf "crop=W:H:X:Y,scale=1080:1920,fps=30" -an -c:v libx264 -crf 18 -g 30 <video>/assets/ui/demo.mp4
```
A user-dropped Mac screenshot arrives via a temporary path that deletes itself in seconds — ask
them to drag it to the Desktop first, and copy it with a glob (the filename has a narrow no-break
space before AM/PM).

## 5 · Verify facts while sourcing
Caption live numbers, not stale ones. Flag debunked stats, dead or renamed products, and claims
that are only true on one page (then show THAT page). Do it before the beat map.
