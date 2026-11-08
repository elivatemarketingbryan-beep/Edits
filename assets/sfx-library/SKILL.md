---
name: sfx-library
description: Add sound effects to short-form video edits (Reels, TikTok, Shorts) from the AI Employee Lab Tech SFX Library (1548 cleaned, indexed, license-cleared sound effects: whooshes, risers, impacts, glitches, UI clicks, typing, notifications, camera, AI-processing beds). Use whenever an edit needs sound design or SFX, whooshes on cuts, pops on text, clicks on screen recordings, risers into reveals, or the user says add sound effects. Never synthesize or download sounds instead.
---

# SFX library

The library root is the folder that holds this file (`<SFX>` below). Version 0.9.0-beta, full edition.

1. Read `<SFX>/AGENT_GUIDE.md` once per session. It holds the placement, level, density and credit rules.
2. For each on-screen moment, run `python3 <SFX>/sfx.py find --moment <moment> --seed <video-name> --history <project>/sfx-history.json`. Add `--length-s` for risers and typing.
3. Run `python3 <SFX>/sfx.py place <ID> --at <event-seconds>`. Use the start time and front trim it prints, set the clip to `clip_gain_db`, and high-pass it at `highpass_hz`.
4. Run `python3 <SFX>/sfx.py record <IDs> --history <project>/sfx-history.json` so later videos avoid repeats.
5. If a moment returns `no_match`, leave it silent. Never synthesize a sound, download one, or use system sounds.
6. Credit-required sounds are skipped unless you pass `--allow-credit`. Only do that when the user has said credits are fine, and then add the output of `sfx.py credits <IDs>` to the post caption.

Moments:

- `cut`: Hard cut, B-roll insert, new section
- `punch_in`: Digital zoom / punch-in or zoom-out
- `whip_pan`: Whip pan or fast swipe transition
- `glitch_transition`: Glitch / screen-tear transition, pattern interrupt
- `text_appear`: Text, caption keyword, sticker or icon appears
- `list_item`: Bullet points or list items stack in
- `stat_land`: A stat or result lands on screen
- `number_count`: Number counting up, % rolling (tick trains allowed)
- `reveal_build`: Build into a reveal (use --length-s for the build length)
- `reveal_hit`: The reveal / payoff lands
- `hook_hit`: Hook first frame, the big statement
- `screen_click`: Cursor click or tap in a screen recording
- `typing`: Typing a prompt, search or code (use --length-s)
- `prompt_submit`: Enter / submit after typing
- `ai_processing`: AI thinking, agent working, progress bar (loopable beds)
- `success`: It worked, task complete, result appears
- `notification`: New DM, email or sale notification pops
- `error`: Error, denied, something broke
- `screenshot`: Screenshot, freeze-frame, snapshot card
- `phone_swipe`: Phone mockup swipe, scroll, unlock
- `slide_in`: Panel, card or window slides in or out
- `money`: Revenue, pricing, money saved
- `logo_cta`: Logo, title card, section header, end-card CTA
- `highlight_sweep`: Highlighter or light sweep across text
- `tension_bed`: Low tension or tech ambience under voice (loopable)
- `power_up`: Power up, unlock, upgrade, transformation
- `power_down`: Power down, ending, wind down
