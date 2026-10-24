# Claude Video FX — Start Here

17 motion-graphics effects for vertical talking-head videos (Reels, TikTok, Shorts) that Claude Code adds for you. You say *"put the cover story effect on the first 6 seconds of my reel"*, and Claude finds the moment in your transcript, writes the graphics, renders the MP4 and checks its own work.

Everything runs on your computer. No API keys, no subscriptions, no uploads.

| | | | |
|---|---|---|---|
| 01 Orbit | 02 Couch Wall | 03 UI World | 04 Frame Break |
| 05 Digital Zoom | 06 Phone Mockup | 07 Checklist | 08 Headline Wall |
| 09 Zoom-Through Cut | 10 Chart Grow | 11 Pull-back Reveal | 12 Green Screen |
| 13 Paper Cut | 14 Doodle Boil | 15 Vertigo | 16 Cover Story |
| 17 Glass Type | | | |

Previews of every effect are in `examples/`. What each one does: `docs/EFFECTS.md`.

---

## 1. What you need

- **Claude Code** (any plan that includes it).
- **Node.js 20 or newer** — the LTS installer from [nodejs.org](https://nodejs.org).
- **Python 3.9 or newer** — macOS usually has it (`python3 --version`); Windows: [python.org](https://python.org), tick **"Add python.exe to PATH"** during install.
- About **3 GB** of free disk space (render engine, speech model, browser).
- A Mac with Apple silicon renders fastest. Intel Macs and Windows PCs work, just slower.

## 2. Install (once, ~5–10 minutes)

1. Unzip the kit and move the **`Claude-Video-FX`** folder somewhere permanent, like your home folder or Documents. (If you move it later, run the installer again.)
2. Run the installer:
   - **Mac:** double-click **`Install (Mac).command`**. If macOS says it can't be opened, right-click it → **Open** → **Open**.
   - **Windows:** double-click **`Install (Windows).bat`**.
   - **Or let Claude do it:** open Claude Code in the kit folder and say: *"Run `node install.mjs` and fix anything that fails."*
3. When it says **All set**, restart Claude Code.

The installer downloads the render engine, a private Python environment, the speech-to-text model, the person cut-out model and a headless browser, then copies the 18 skills into `~/.claude/skills`.

## 3. Use it

Open Claude Code anywhere and ask in plain English. Point it at a vertical video file:

- *"Add the **checklist** effect to `~/Movies/reel.mp4` where I say 'all you need to do is'."*
- *"Make the first 5 seconds of `~/Desktop/hook.mp4` a **cover story** with the word FOCUS."*
- *"Put a **headline wall** behind me when I talk about the news in `talk.mp4`."*
- *"Which effects would work on this video?"* (it reads the transcript and suggests)
- *"Add 3 effects to `reel.mp4` and stitch them into one finished video."*

Claude will show you the transcript moment it picked, check a still frame, render, review a contact sheet of the result and tell you where the MP4 is (next to your video, named like `reel - Cover Story.mp4`).

**Good footage:** vertical (9:16), one person, reasonably lit, talking to camera. Landscape clips get centre-cropped.

**How long it takes:** the first effect on a new clip spends ~1 minute per 10 seconds of footage making the transcript and cutting you out of the background. That's cached, so every effect after that on the same clip renders in about 10–40 seconds.

## 4. If something goes wrong

Ask Claude: *"Run the video-fx doctor and fix what's broken."* Or run it yourself:

```bash
node engine/fx.mjs doctor
```

Every line should show ✔. Common fixes are in `docs/TROUBLESHOOTING.md`.

## Uninstall

```bash
node install.mjs --uninstall
```

Then delete the `Claude-Video-FX` folder.

---

Built with [Remotion](https://remotion.dev) (free for individuals and companies of up to 3 people; larger companies need a [Remotion license](https://remotion.pro)). See `LICENSE-NOTES.md`.
