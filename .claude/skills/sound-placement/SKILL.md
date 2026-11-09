---
name: sound-placement
description: How to choose and time sound effects on a Video Studio edit, learned from Skymography's "How To Sound Design ANYTHING" and Film Editing Pro's "How to SOUND DESIGN a Video", fitted to Bryan's taste. Use whenever sound effects are being chosen, placed, layered, leveled or revised on any edit: writing or changing a job's sfx.json, running studio/sfx.mjs place, adding whooshes, clicks, risers, ambience or UI sounds, fixing notes like "too many sounds", "too loud", "the sound is early", "feels empty", or planning the sound layer for a reel, YouTube video or b-roll run.
---

# Sound placement

The decisions behind a job's `jobs/<id>/sfx.json`. Sources and measurements: `styles/REFERENCES.md`
(Skymography, Film Editing Pro). Read this with:

1. `styles/EDIT-PREFERENCES.md`: Bryan's taste. **It wins over everything here.**
2. `styles/SOUND-RULES.md`: the moment → cue table. Where it still lists `hit` or `glitch`, the
   preferences have replaced them.
3. `CLAUDE.md` "Sound effects": the render order. Picture first, sounds as their own layer.

## Build in this order

1. **Music**, if the job has any. Judge every effect against it, not in silence.
2. **Ambience and literal sounds.** What the viewer sees should be heard.
3. **Creative accents last:** the transitions, builds and feelings.

**First, check the voice is in both ears.** Speech should sound the same left and right; only music
should differ. A two-mic recording can land with one mic per side, or one side empty, and that is
easy to miss on speakers:

```bash
ffmpeg -hide_banner -i <source> -af "astats=measure_overall=none:measure_perchannel=RMS_level" -f null - 2>&1 | grep -E "Channel:|RMS level"
```

If one channel is `-inf` or sounds like a different mic, copy the good one to both on a working
copy, never the dropped source (for the left channel: `-af "pan=stereo|c0=c0|c1=c0"`). Mono sound
effects need no fix: `sfx.mjs` converts them to stereo at the same loudness.

## The method

For every moment that might get a sound, answer these before picking a file.

### 1. What is this sound's rank?

Audio has an order of importance: **speech, then music, then sound effects.** On a talking
stretch, effects are accents. They lift the point and must never pull attention from it. If you
removed the sound and nothing was lost, leave it out.

Viewers have a fixed amount of attention, shared by picture and sound. When the picture is busy
or the line is important, sound does less. Plan an ebb and flow, not an even layer.

### 2. What is it doing?

A sound earns its place with one of these jobs. No job, no sound.

| Job | When | How |
|---|---|---|
| **Make it tactile** | Text, cards, fast cuts | A short click on each one |
| **Carry a transition** | A scene or layout change | A sound whose build runs into the cut |
| **Build then release** | Before a reveal | Rising tension that stops hard on the frame |
| **Sell the action** | Something visibly happens | The literal sound of that thing |
| **Give each shot its own air** | Fast b-roll runs | A different slice of sound per shot |
| **Say what can't be seen** | Stakes, a feeling, a turn in the story | A sound that changes how the moment reads: a weighty hit tells the viewer this matters |

To find moments you might miss, watch for **visual movement and lighting changes**: a fast move,
a flash, a light shift or a burn on b-roll.

### 3. How big does this moment deserve?

Rank the moments first. **If every moment is special, none of them are.** Not every moment gets an
accent, and an accented moment isn't automatically full strength.

Film Editing Pro's overload demo put a bass drop and a hit on a hand pulling back. It was too much
because the move wasn't confined to one frame and wasn't the climax. Removing the hits left a
soft swell, about 14 dB quieter, and that fit.

- A hard sound needs an event on **one frame**. A slow or soft move gets a soft sound or none.
- Save the strongest sound in a section for the climax of that section.

| Size of the moment | Use |
|---|---|
| Passing, soft, or continuous | Nothing, or `SFX-1144` low |
| Small word or chip | `ui-select` |
| A normal graphic | `ui-open` |
| A key line or big word | `ui-expand` |
| The climax of a section | `SFX-1516` to `SFX-1518` stopping dead on it, or the literal sound (`money`, `ui-glass-shatter`, `ui-success`) |

Once the sound style is set, **keep it consistent through the piece**. After sounds go on, any
stretch without them stands out. Bryan's sparse opening is the deliberate exception: it starts
light, then settles into the video's normal density.

### 4. What part of the spectrum is empty?

Think lows, mids, highs. Put the sound where the mix has room, because that is what lets it read
while staying quiet. In Skymography's sky section the music sat in lows and mids with almost
nothing above 3 kHz, so the clicks went up there.

Use contrast between sections: keep one section light and airy, then let the next get fuller.
Filling every range all the time removes the contrast.

### 5. Where does it land?

| Sound type | Lands | Measured or shown |
|---|---|---|
| Click on a cut or text | **On the frame**, onset on the cut | 0 frames off on 6 of 6 clicks, leaving aside the deliberate one below |
| Fast run of clicks | Even rhythm beats exact sync | One cut came 1 frame short, so that click stayed 1 frame late |
| Whoosh | Build **before** the cut, loudest at or just before it | Started ~0.9 s before, loudest 0.1-0.4 s before, gone by 0.5 s after |
| Riser or reversed swell | Runs up to the cut, then **stops dead** | Mix fell 26 dB within 100 ms of the cut |
| Reverse swell into a hit | The swell's peak on the cut; anything after starts **on** the cut | Timeline shot: reverse cymbal apex and bass drop both on the playhead |
| Impact | On the frame | 0 frames off |
| Bed or ambience | Fade in and out, let the tail run over the next shots | Fades over the next few cuts to tie them together |

In `sfx.json`, `at` is the frame the event happens. `sfx.mjs` already starts the file early by its
peak, so a whoosh's build runs before `at` automatically. Don't subtract the lead yourself. Use
`skip` to shorten a long build while keeping its peak on `at`. Take `at` from the composition's
timings, never from the transcript.

### 6. How loud?

Start too low, then come up only if it disappears. Skymography's most-repeated fix is turning
things down ("definitely too loud", "that hit is a bit too aggressive"). A sound with a clear
spectral slot needs very little level: those clicks raised the high band by about 25 dB but the
whole mix by only about 2 dB.

Film Editing Pro's rough meter guide (peaks, as a starting point):

| Layer | Peak level |
|---|---|
| Anything | Never above 0 dB |
| Speech | About -10 to -12 dB, usually among the loudest things |
| Sound effects | -10 to -30 dB depending on the sound |
| Music | -20 to -30 dB |

Put small UI sounds toward the -30 end, and keep the -10 end for the rare biggest beats.

Check a small sound by comparing the same 0.3 s before and after sounds go on:

```bash
ffmpeg -hide_banner -ss 12.3 -t 0.3 -i jobs/<id>/.nosfx.mp4 -af volumedetect -f null - 2>&1 | grep -E "mean_volume|max_volume"
ffmpeg -hide_banner -ss 12.3 -t 0.3 -i jobs/<id>/preview.mp4 -af volumedetect -f null - 2>&1 | grep -E "mean_volume|max_volume"
```

Small UI sounds under speech should move `mean_volume` by about 3 dB or less. If the source
audio is already mastered, place with `SFX_LIMIT=0.97`, or the default limiter caps the mix at -6 dB.

### 7. Should it be layered?

Layering makes sounds that don't exist yet, and it's what stops a big moment sounding thin. But
a single sound is often plenty, such as one whoosh on a zoom. Stack only when one sound can't
carry the moment. A layer blends in when it is **close in tone and frequency** to the sound
already there.

**In this studio, layers get baked into one cue before placing** (see the conflicts below).
`ui-glass-shatter` is the model: several sounds combined into one file, one cue, one beat.

### 8. Shape it so it fits

Good sound design rarely uses a sound raw. The moves that matter:

- **Muffle it.** A high-cut on nearly every layer stopped it fighting the music and took off the
  sharpness.
- **Trim to the part you need.** Skymography used only the start of a door creak.
- **Speed it up** to tighten a click. **Slow it down with pitch correction off** to make a whoosh
  deeper and longer.
- **Never repeat one file across a run.** Using the same keystroke for every letter was one of
  Film Editing Pro's named faults. Slice different hits from a longer recording, or rotate
  files. Skymography cut one wind into a piece per shot, each from a different spot, pitched by
  ±1 semitone.
- **Pitch a run upward.** Each click one semitone higher (-4, -3, -2 and so on), 3 frames apart,
  turned plain clicks into a riser going into the final moment.
- **Reverse an impact** to get a swell, cut on its last frame.
- **Put real-world sounds in the room.** Dry, studio-clean foley sounds pasted on over live
  footage. One shared reverb across all of it fixes that. UI sounds stay dry.

### 9. Try it, then cut it

Audition several, keep what serves the moment, delete what doesn't. Skymography's conveyor-belt
layer was "just noisy", so it went. Sound design takes more than one pass. Judge sounds against
the full mix, not soloed.

## Studio cues for each technique

All of these load in `studio/sfx.mjs` (checked 2026-11-08). Bryan has only approved the `ui-*`,
`money`, `ui-glass-shatter` and `rubber-stretch` sounds so far; treat the library IDs as things to try.

| Technique | Use | Notes |
|---|---|---|
| Graphic or card appears | `ui-open` | |
| Small word or chip | `ui-select` | |
| Big word | `ui-expand` | Replaces `hit` |
| List step, or a click run on cuts | `ui-progress-step` | Or rotate `SFX-1114` to `SFX-1118` (soft ticks) |
| Confirm or completed step | `ui-check` | |
| Tap on screen | `ui-press` | |
| Full-screen graphic in / out | `ui-swipe` / `ui-back` | Replaces whooshes on these |
| Short swell into a card or panel | `SFX-1144` or `SFX-1122` | Both build into their end; out: `SFX-1142` |
| Build that stops dead on a reveal | `SFX-1516` to `SFX-1518` | Half-second hiss, cuts off hard. Bryan's stand-in for the reversed bass drop and reverse cymbal |
| Longer build into a reveal | `riser-short` | Rare, must end on something worth it |
| Light cut, no graphic | `whoosh-simple` at about 0.08 | Only if the cut needs help |
| Punch-in | `lens-focus` | Or nothing |
| Fast photo or b-roll run | `SFX-1409` / `SFX-1410`, `shutter-quick` | Mechanical film clicks, Skymography's retro move. Try on one run first |
| Literal: money | `money`, on every price | Both price tags, not just one |
| Literal: rope | `rubber-stretch` | |
| Literal: UI breaks | `ui-glass-shatter` | Never an explosion |
| Literal: leak or fill | `water-*` soft versions | |
| Typing | `keyboard` with `dur` | One real recording, so the keystrokes vary. Starts and stops with the typing exactly |
| Goal reached | `ui-success` | |
| Dead-silent stretch (silent b-roll, a graphic with no room sound) | `SFX-1477` or `SFX-1484`, very low | Office hum beds. Talking footage already has room tone, so leave it |
| Unusual moments | `python assets/sfx-library/sfx.py find --moment <moment> --seed <job id> --history projects/<id>/sfx-history.json` | No match means stay silent. Skill `sfx-library` |

`sfx.mjs` has `at`, `volume`, `skip` and `dur` per cue, but no EQ, reverb, pitch or speed, and `dur`
always adds a 0.15 s fade. To shape a sound, make a copy once and register it:

```bash
# pitch: change 3 to the semitones you want (pitching this way also shortens it)
ffmpeg -i assets/sfx/ui/studio-progress-step.wav -af "asetrate=48000*2^(3/12),aresample=48000" assets/sfx/ui/step-up3.wav
# muffle: lower the number to muffle more
ffmpeg -i assets/sfx/ui/studio-progress-step.wav -af "lowpass=f=4000" assets/sfx/ui/step-soft.wav
node studio/sfx.mjs peak assets/sfx/ui/step-up3.wav
```

Then add the cue to `styles/sfx.json` with that peak, and name it in `sfx.json` like any other.
Use `SFX-####` as a cue only for library sounds that need no credit, unless Bryan has said credits are fine.

Library beds have a sync point deep inside the file, so a bed used by ID would start seconds too
early. Copy the file into `assets/sfx/` and register it with `peak: 0` and a `dur`, the way
`keyboard` works. The beds are only about 10 s long.

## Where Bryan's preferences override the videos

| The videos do | Bryan's rule | So do this |
|---|---|---|
| Bass drops, booms, metal impacts, reverse cymbal into a boom | No booms | Use `ui-expand` or literal sounds. Keep the hard stop, drop the boom |
| Glitchy sounds on frames | No scratchy glitches | `ui-*` only |
| Chimes on a text reveal | No beeps, dings or chimes | `ui-open` or `ui-select` |
| Stacked layers on one moment | Never two sounds on one beat | Bake layers into one cue, or use one sound |
| Clicks on every word and cut in the opening | Sparse opening: about one sound every 5 s at most in the first 30 s | Only the few big beats. The click-run techniques belong later |
| Unrelated sounds for mood (clock clicks on text, bone crunches on a stapler) | Sounds match the screen literally; UI sounds sound like UI | Use non-literal texture only on b-roll, never on graphics |
| Airy whooshes on most transitions and quick moves | He wants wind-like whooshes from real files (2026-11-08) | `wh-*` on transitions, `wht-*` on text; see `styles/EDIT-PREFERENCES.md` |
| Wind, crowd and street ambience | Not covered yet | The library has no outdoor beds. Use `real-sfx` or ask Bryan; never force one |

Both source videos are stylized narrative or music-driven pieces. Bryan's videos are talking heads
selling something. The timing, sizing, spectrum, level and shaping methods carry over directly.
The density and the drama do not.

## Mistakes to catch before placing

- A sound on a beat with no reason (step 2).
- A hard sound on a soft move, or every moment at full strength (step 3).
- Stretches left empty once the rest has sound, apart from the sparse opening.
- Two sounds on one frame.
- Sound on a stressed word: nudge within 0.1 s to the gap beside it.
- A riser that ends on nothing, or a whoosh trailing past the last word.
- The same file repeating across a run.
- Low-quality or noisy files: only the indexed library and named cues.
- Levels set by eye, without a listen in the full mix.
- Any beep, ding, boom or scratch that slipped in via a default from `SOUND-RULES.md`.

## On a revise

Sound notes change only `sfx.json`, then re-run `sfx.mjs place` from the same `.nosfx.mp4`.
Add anything new Bryan says about sound to `styles/EDIT-PREFERENCES.md`.
