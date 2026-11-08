# Agent guide: using the SFX library

Library version 0.9.0-beta. `index.json` is the source of truth. Each sound in `sounds/` has exactly one entry there, and IDs never change between versions. Files are 48 kHz / 24-bit WAV, trimmed to the first transient, true peak -1 dBTP.

## 1. Find a sound: moment first, then category

Work out what is happening on screen and pick the matching **moment**, then ask the helper:

```bash
python3 sfx.py find --moment <moment> --seed <video-name> --history <project>/sfx-history.json [--n 3] [--tone premium_tech] [--length-s 2]
```

The helper searches the moment's categories in order, prefers core picks, CC0 files, matching use cases and the requested tone, skips duplicates of sounds you used recently, and picks at random (seeded by the video) among the best matches. Different videos therefore get different sounds. If you cannot run it, apply the same rules by hand to `index/by-category/*.json`.

| Moment | On screen | Categories searched, in order |
|---|---|---|
| `cut` | Hard cut, B-roll insert, new section | whooshes, ui-motion, reverses |
| `punch_in` | Digital zoom / punch-in or zoom-out | whooshes, reverses, impacts |
| `whip_pan` | Whip pan or fast swipe transition | whooshes, ui-motion |
| `glitch_transition` | Glitch / screen-tear transition, pattern interrupt | glitches |
| `text_appear` | Text, caption keyword, sticker or icon appears | pops-blips, ui-clicks |
| `list_item` | Bullet points or list items stack in | pops-blips, ui-clicks |
| `stat_land` | A stat or result lands on screen | notifications, impacts, pops-blips |
| `number_count` | Number counting up, % rolling (tick trains allowed) | counters-timers, ui-clicks, data-hud |
| `reveal_build` | Build into a reveal (use --length-s for the build length) | risers, reverses |
| `reveal_hit` | The reveal / payoff lands | impacts, stingers |
| `hook_hit` | Hook first frame, the big statement | impacts, stingers |
| `screen_click` | Cursor click or tap in a screen recording | ui-clicks |
| `typing` | Typing a prompt, search or code (use --length-s) | typing |
| `prompt_submit` | Enter / submit after typing | typing, ui-clicks |
| `ai_processing` | AI thinking, agent working, progress bar (loopable beds) | data-hud |
| `success` | It worked, task complete, result appears | notifications |
| `notification` | New DM, email or sale notification pops | phone-device, notifications |
| `error` | Error, denied, something broke | notifications, glitches |
| `screenshot` | Screenshot, freeze-frame, snapshot card | camera |
| `phone_swipe` | Phone mockup swipe, scroll, unlock | phone-device, ui-motion |
| `slide_in` | Panel, card or window slides in or out | ui-motion |
| `money` | Revenue, pricing, money saved | money, notifications |
| `logo_cta` | Logo, title card, section header, end-card CTA | stingers, impacts, shimmers, notifications |
| `highlight_sweep` | Highlighter or light sweep across text | shimmers, ui-motion |
| `tension_bed` | Low tension or tech ambience under voice (loopable) | drones-beds, data-hud |
| `power_up` | Power up, unlock, upgrade, transformation | scifi-energy, risers |
| `power_down` | Power down, ending, wind down | scifi-energy, reverses |

If the helper returns `no_match`, leave the moment silent. Never synthesize a sound, pull one from the web, or use system sounds.

## 2. Place it on the frame

- `sync_point_ms` is the point inside the file that must land on the event. For clicks, taps, pops, typing, camera and notifications it is the onset (the first transient, usually 0-5 ms). For whooshes, impacts, glitches, risers and textures it is the loudest moment.
- Start time = `event_time - sync_point_ms / 1000`. If that is before 0, start at 0 and trim that much off the front. `python3 sfx.py place <ID> --at <seconds>` does this for you.
- **Risers**: use a cut-ready edit whose length matches the build you want (`--moment reveal_build --length-s 2`). Its end lands on the reveal; follow it with an impact (`reveal_hit`) on the same frame, or a hard cut to silence.
- **Typing**: use a burst that matches how long the text takes to appear (`--moment typing --length-s 1.5`). `event_onsets_ms` lists the keystrokes. Land a single keystroke (`--moment prompt_submit`) on the Enter.
- **Long files**: for camera bursts and other multi-event files, `event_onsets_ms` lists the events; trim at one of them to shorten.
- **Loops** (`loopable: true`): the seams are crossfaded, so you can tile the file back to back for as long as a process runs. Fade in and out over 300-1000 ms and end on a confirm sound.

## 3. Set the level

- Apply `clip_gain_db` to the file as it is. It brings each sound to its category's loudness target, assuming the voice is mixed to about -14 LUFS integrated. If your voice is mixed louder or quieter, shift every sound effect by the same amount.
- High-pass each effect at `suggested_highpass_hz` so it does not muddy the voice on phone speakers.
- Duck music 3-6 dB under transition effects with a fast recovery.
- Deliver at about -14 LUFS integrated with true peak at or below -1 dBTP.

| Category | Sounds | Loudness target (momentary) | High-pass |
|---|---|---|---|
| Whooshes & Swishes (transition movement) | 17 | -24 LUFS | 80 Hz |
| Risers & Build-ups | 20 | -22 LUFS | 40 Hz |
| Impacts, Booms & Sub Drops | 26 | -20 LUFS | 30 Hz |
| Glitches & Digital Distortion | 736 | -24 LUFS | 100 Hz |
| UI Clicks, Taps & Buttons | 216 | -30 LUFS | 120 Hz |
| Notifications, Alerts & Confirmations | 93 | -28 LUFS | 150 Hz |
| UI Motion, Swipes & Slides | 37 | -28 LUFS | 120 Hz |
| Data, HUD & AI Processing | 132 | -34 LUFS | 120 Hz |
| Typing & Keyboard | 93 | -32 LUFS | 120 Hz |
| Pops, Blips & Text Appear | 34 | -26 LUFS | 120 Hz |
| Camera & Photo | 21 | -26 LUFS | 120 Hz |
| Phone & Device | 0 | -26 LUFS | 100 Hz |
| Money & Commerce | 0 | -24 LUFS | 100 Hz |
| Counters, Tickers & Timers | 6 | -30 LUFS | 150 Hz |
| Sci-Fi Energy, Holograms & Power | 38 | -26 LUFS | 60 Hz |
| Shimmers, Sparkles & Light Sweeps | 4 | -28 LUFS | 300 Hz |
| Stingers, Tonal Hits & Logo Stings | 0 | -22 LUFS | 40 Hz |
| Drones, Ambiences & Beds | 42 | -38 LUFS | 40 Hz |
| Reverses, Suck-backs & Downlifters | 3 | -24 LUFS | 60 Hz |
| Tactile Foley: Paper, Pen, Tape & Desk | 5 | -26 LUFS | 100 Hz |
| Electric Zaps & Sparks | 0 | -28 LUFS | 120 Hz |
| Reactions, Crowd & Human | 0 | -26 LUFS | 100 Hz |
| Comedic & Meme Accents | 1 | -24 LUFS | 100 Hz |
| Retro 8-bit & Game | 24 | -26 LUFS | 120 Hz |

## 4. Density, variety and taste

- One sound per edit point is usually enough; two is the ceiling.
- Never put two cues on the same frame. There is one exception: a riser may end on the same frame an impact starts.
- If a transition and a punchline coincide, drop the transition sound.
- Do not reuse the same file within 20 seconds, and do not use one `variant_family` more than 3 times in a 60-second video. Tick trains for number counters and typing are exempt, as is repeating the same click for repeated on-screen clicks.
- Treat `duplicate_of` and `dry_wet_of` partners as the same sound for these rules.
- Record every sound you use (`sfx.py record`) so the next video on the same channel avoids it.
- Default tone for tech, AI and business content is `premium_tech`, then `neutral`. Use `cinematic` for big reveals and `playful` or `retro_game` only for clearly comedic beats.
- Leave a beat of silence before a key reveal once or twice per clip.

## 5. Credits

Sounds with `attribution_required: true` are CC BY 4.0 / OGA-BY 4.0. They are off by default (the helper needs `--allow-credit`). Only allow them when the user has said credits are fine. When you use one, add the output of `python3 sfx.py credits <IDs>` to the post caption or description. Every video using one must carry its credit.

## 6. Never

- Never add operating-system or brand sounds (iPhone tri-tone, Mac startup, app notification sounds) or meme rips.
- Never use a sound from outside this library, and never generate one.
- Never claim authorship of these sounds or register them with Content ID.
