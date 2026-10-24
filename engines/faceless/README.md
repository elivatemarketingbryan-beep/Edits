# AI Faceless Content

Turn a voiceover into a fully edited vertical video starring a pixel-art version of you. Captions, motion graphics, sound effects and a talking character are all done for you, in one consistent, snappy editing style.

## How to use it

1. Open this folder in **Claude Code** (desktop app or terminal).
2. Type **go**.
3. Claude walks you through the rest.

That's it. Claude checks what's already set up and only asks for what's missing.

## What happens the first time

**Setup (automatic, about 3 minutes).** Claude installs the video engine. You just approve the commands.

**Your sprite (one time, about 15 minutes).** You upload a photo of your face to ChatGPT (or Higgsfield, or any image tool) and paste a few prompts Claude gives you. You get a set of pixel-art images of yourself: standing, talking, pointing, waving, thinking. Drop them in `sprite/raw` and Claude cleans and lines them up. Already have sprite images? Drop them in and skip ahead.

**Your voice.** Strongly recommended: clone your voice once in [ElevenLabs](https://elevenlabs.io) and generate every voiceover with **Eleven v4** using that clone. You write the script, ElevenLabs reads it in your voice, and you never have to record again. You can also record yourself on your phone; any clean MP3, WAV or M4A works.

## Making a video

Attach your voiceover in the chat (or drop it in `voiceovers/`) and say **"make the video"**.

Claude transcribes it, plans every beat, builds the motion graphics, animates your character to your voice, adds sound effects and renders the MP4 into `videos/`. A 30 to 60 second video usually takes 5 to 15 minutes.

Want changes? Just say so: "make the hook punchier", "use a dark background for the middle", "swap the chart for a list".

## Folders

| Folder | What's in it |
|---|---|
| `sprite/` | Your character. `raw/` is what you made, `poses/` is the cleaned set the editor uses. |
| `voiceovers/` | Drop voiceovers here if you'd rather not attach them in chat. |
| `videos/` | One folder per video, with the finished MP4 inside. |
| `guides/` | The sprite prompts, if you want to read them yourself. |
| `style/` | The editing style the videos follow. |
| `engine/` | The video engine. You never need to open it. |

## Requirements

- Claude Code
- A Mac or Windows computer with Node.js 22 or newer (Claude helps you install it if it's missing)
- About 2 GB of free disk space for the engine, browser and speech model
