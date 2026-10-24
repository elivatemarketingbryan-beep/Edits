# The interview

Goal: enough to make a great video in at most two short rounds. The member should feel like they handed it to a designer, not filled out a form.

## Round 1 (always)

If AskUserQuestion is available, ask these together (it allows up to 4 questions; each has an automatic free-text "Other"):

1. **What are we promoting?** options: "My offer / product / app", "My website", "My service / business", "My brand (logo animation)"
2. **What kind of video?** options:
   - "Motion graphics only (logo animation / promo with music)"
   - "Voiceover + motion graphics"
   - "My raw video + motion graphics on top"
3. **How should it end?** options: "Comment a keyword to get something", "Link in bio / visit my site", "Book a call / DM me", "Just the logo, no ask"
4. **Length?** options: "15 seconds", "30 seconds (recommended)", "45-60 seconds", "Match my video"

If they pick voiceover, ask this right away (same round if the tool allows a fifth question, otherwise as the first thing in round 2):
5. **Whose voice?** options: "I'll record it myself (you write the script)", "My ElevenLabs voice (my clone or one from their Voice Library)". There is no robot or computer-voice option: their own voice or ElevenLabs only.

Then in the same turn, in plain text, ask them to send what you need for their answers:
- their logo file (always; SVG or transparent PNG if they have it, any image works)
- one or two sentences: what it is, who it is for, the main promise or result
- the website URL (if they have one)
- for voiceover: their recording (or "write me a script" and they record it), or for ElevenLabs: their API key (elevenlabs.io > Developers > API Keys) and the voice name or ID (a clone of themselves, or a Voice Library voice added to My Voices)
- for raw video: the clip
- for comment CTAs: the keyword and what they send people
- optional: brand colours (hex), brand font file, words or vibes to avoid

Without AskUserQuestion, send one compact message with the four questions as short numbered choices plus the asset list.

## Round 2 (only if needed)

Ask only what blocks you after looking at their files and site:
- No logo at all: offer to build a clean wordmark from their brand name in a bundled font (then the hero is the first letter or a simple shape you design with them).
- Hero part ambiguous (two equally good candidates): show `logo_parts.png` and ask which piece should be the "character". If the member is not around, pick and say which.
- Voiceover script: show the script (8 to 12 seconds of speech per 30 s of motion is too little; aim for 60 to 75 words per 30 s for a talky video, 25 to 40 for a punchy one) and wait for their recording, or for their approval before generating it with their ElevenLabs voice.

## Infer, do not ask

- **Colours:** from the logo and website (capture.py prints them). Only ask if both are missing.
- **Offer details and wording:** from their sentence plus their website's headline, description and sections.
- **Music mood:** bright (default, upbeat, major key), chill (lifestyle, food, wellness, calm brands), dark (premium, tech, finance, night), epic (launches, big claims). Choose from the brand's look and audience.
- **Fonts:** match the logo's personality (see storyboard.md font list).
- **CTA keyword:** if they want a comment CTA but gave no keyword, propose one short all-caps word tied to the thing they send (GUIDE, TEMPLATE, PROMPT, LOYAL) and mention it so they can change it.

## Defaults when the member is vague or absent

Motion graphics only, 30 seconds, bright mood, 120 bpm, CTA = their URL if they have one else just the logo. State the defaults you chose in one line and continue.
