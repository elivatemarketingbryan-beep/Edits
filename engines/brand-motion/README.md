# Brand Motion Studio (AI Employee)

Your own motion designer and sound designer. Answer a few quick questions, hand over your logo (plus a clip or voiceover if you want), and it delivers a finished 1080x1920 vertical video: custom logo animation, kinetic typography, transitions, captions, and an original music track with sound effects synced to every hit.

Three kinds of video:
- **Motion graphics only:** a logo animation / brand promo for your offer, website or service.
- **Voiceover + motion graphics:** it writes the script, then you either record it on your phone or it generates it with your ElevenLabs voice (your own clone or any voice from their Voice Library), and it animates everything to your words.
- **Your raw video + motion graphics:** drop in a talking-head clip; it adds a hook, word-by-word captions, punch-in zooms, sticker callouts, full-screen inserts and a branded ending.

## Install (Claude Code, once)

1. Unzip this folder into your Claude skills folder so you have:
   `~/.claude/skills/brand-motion-studio/SKILL.md`
   (macOS/Linux: `~/.claude/skills/`, Windows: `C:\Users\<you>\.claude\skills\`)
2. Open Claude Code in any folder and say: **"Make me a brand video"**.
   The first time, it runs a one-time setup (installs ffmpeg if needed and a private Python environment inside this folder, a few minutes).

Requirements: macOS, Linux or Windows with Python 3.10+ (macOS: `brew install python@3.12` if you do not have it). An Apple Silicon Mac renders a 30 s video in about 1 to 2 minutes.

## Use

Say any of:
- "Make me a 30 second promo video for my offer"
- "Animate my logo"
- "Turn this clip into a Reel" (attach or give the path to the video)
- "Make a voiceover video for my website"

It asks a few questions in one go, then does the rest. Your videos and all the working files land in `./brand-videos/<your-brand>/` in the folder you ran it from. Want changes? Just say what ("make the hook bigger", "use the comment keyword GUIDE", "calmer music") and it re-renders.

Voiceovers: your own recording, or ElevenLabs. For ElevenLabs, have your API key ready (elevenlabs.io > Developers > API Keys) and the voice you want in "My Voices" (clone your own voice, or add one from the Voice Library). The first time, Claude saves the key privately inside this skill folder so you only paste it once.

## What is inside

- `SKILL.md`: the instructions Claude follows (interview, concept, storyboard, render, review)
- `references/`: creative direction, the storyboard/scene reference, the interview, custom scene guide
- `engine/`: the renderer (Skia + ffmpeg), logo vectorizer, music and sound design generator, captions, website capture
- `fonts/`: 13 display and text fonts (SIL Open Font License, see `fonts/OFL.txt`)
- `examples/`: two complete storyboards (a 30 s logo animation and a raw-video Reel)
