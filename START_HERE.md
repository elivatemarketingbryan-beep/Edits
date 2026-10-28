# Video Studio: how it works

## Every time

1. **Open the studio.** Double-click `Start Studio.cmd`. Your browser opens at
   http://localhost:4747. Keep the black window open while you work.
2. **Drop a video** onto the page, or paste a YouTube link. No footage? Drop a voiceover
   (mp3, wav or m4a) and the faceless or motion-promo styles take it from there.
3. **Tell Claude.** In Claude Code, opened on this Video Studio folder, say:
   `run my studio jobs`
4. **Pick a format.** The page shows the best 3 formats for that video, each with a
   reason and a 5-second preview. Click one. (Or scroll to "Every format" and choose any
   of the 52 styles yourself.) Say `run my studio jobs` again. If you scripted the video
   in Content OS, the format you scripted it for is already first.
5. **Review.** Open the review page. Pause anywhere, press **N**, type a note ("cut
   this pause"). You can also leave a note on a specific cut or caption. Then:
   - **Request changes**: Claude works through your notes and replies under each one.
   - **Approve and render final**: Claude renders the finished video.
   After either button, say `run my studio jobs` again.
6. **Done.** The final video and any extra files are on the page and in
   `jobs/<your video>/`.

## The first time

- Your brand is already set: purple on black (`styles/brand.json`), so every style uses
  your look instead of the reference orange.
- Claude checks your computer and tells you what's missing (Node, ffmpeg, the
  transcriber, HyperFrames). Most of it is already installed.
- A few styles need one thing from you once:
  - **Faceless sprite:** a pixel-art you, made in ChatGPT from a photo
    (`engines/faceless/guides/make-your-sprite.md`, about 15 minutes).
  - **Brand motion:** your Elivate logo file (SVG or transparent PNG).
  - **Voiceovers in your voice:** an ElevenLabs voice clone, or record on your phone.
    If you use ElevenLabs, you paste the API key into your own Terminal, never into chat.

## What's in here

- **52 styles**: 45 short-form (17 Video FX styles; three need no camera: faceless sprite, brand
  motion, motion promo) and 7 long-form. Styles marked "New style" haven't been made
  here yet; the first one you approve becomes the template for next time.
- **Effects for any style**: premium word-by-word captions, a glowing two-line intro
  title, article headlines with a marker highlight, GitHub README callouts, plus the
  HyperFrames templates (typing search bar, counters, map routes, glow pill).
- **17 Video FX effects** that cut you out of the background so graphics go behind you:
  magazine cover title, 3D glass word, checklist that ticks as you talk, growth chart,
  headline wall, cards orbiting you, phone mockup, popping out of a Reels frame, dolly zoom
  and more. Ask "which effects would work on this video?" and Claude suggests 2-4.
- **Content OS** (`engines/content-os`): research, hooks, scripts written for the format
  with cue tags, Notion, repurposing one long video into a week of posts, a content
  calendar, carousels and posting.
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
