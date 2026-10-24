# Video Studio: how it works

## Every time

1. **Open the studio.** Double-click `Start Studio.cmd`. Your browser opens at
   http://localhost:4747. Keep the black window open while you work.
2. **Drop a video** onto the page, or paste a YouTube link.
3. **Tell Claude.** In Claude Code, opened on this Video Studio folder, say:
   `run my studio jobs`
4. **Pick a format.** The page shows the best 3 formats for that video, each with a
   reason and a 5-second preview. Click one. (Or click "See all styles" and choose any
   of the 31 styles yourself.) Say `run my studio jobs` again.
5. **Review.** Open the review page. Pause anywhere, press **N**, type a note ("cut
   this pause"). You can also leave a note on a specific cut or caption. Then:
   - **Request changes**: Claude works through your notes and replies under each one.
   - **Approve and render final**: Claude renders the finished video.
   After either button, say `run my studio jobs` again.
6. **Done.** The final video and any extra files are on the page and in
   `jobs/<your video>/`.

## The first time

- Claude asks for your brand colours, fonts and handle once, so every style uses your
  look instead of the default orange.
- Claude checks your computer and tells you what's missing (Node, ffmpeg, the
  transcriber, HyperFrames). Most of it is already installed.

## What's in here

- **31 styles**: 14 short-form, 4 long-form from the reference pack, plus the 13 it
  lists as coming soon. Styles marked "New style" haven't been made here yet; the first
  one you approve becomes the template for next time.
- **Sound effects** on every style: whooshes on cuts, pops, ticks, stamps and risers
  timed to the graphics, from your Motionix pack. Each one shows on the review page's
  timeline, so you can say "turn this down" or "no sound here" at the exact second.
- **4 tools**: B-roll library, video to written content (your voice, from content-os),
  find graphic moments (RTF), and rough cut only (hands the cut to your editing app).
- Your old kits are inside `engines/` and still work; `CLAUDE.md` explains how they fit
  together.

## Why you say "run my studio jobs"

The page can't start Claude by itself: Claude Code isn't installed as a command on this
computer, only as the desktop app. If you install the Claude Code command line later,
the studio can be changed to start jobs automatically.
