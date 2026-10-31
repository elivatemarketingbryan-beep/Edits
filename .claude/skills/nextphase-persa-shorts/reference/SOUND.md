# SOUND — a thin pass, placed on the locked render

Only if `brand.json` has `"sfx": true`. Music only if `"music": true` and a `music_file` is set.

---

## The palette
`scripts/synth-sfx.py` synthesises a royalty-free palette into the skill's `sfx/` folder (doctor
`--fix` runs it). Want your own pack? Drop files named `swell`, `riser`, `camera-shutter`, … into a
folder and `export SFX_DIR=/that/folder` — `mix-sfx.sh` looks there first.

## ⛔ Persa is THIN, and four sounds are banned
A busier pass was rejected on exactly this style: *too many sound effects*. One cut went from 41 cues
to **17 in 40 seconds** and was approved.

**Banned outright: `ping` · `swoosh` · `confirm` · `beep`.** Not "sparingly" — out. The beat that
used to get a ping (the outline word landing) is now **silent** and lands on the type alone. The
answer to a banned cue is no cue. `mix-sfx.sh` refuses them.

What earns a cue:

| cue | when |
|---|---|
| `swell` | **every** change of treatment (face → UI → window …) and frame 0 |
| `riser` | **once**, into the hook payoff — starts ~1.5s BEFORE the word so it crests on it |
| `camera-shutter` | a product NAME, once per spoken part ("Git" · "Hub"), at the one place it is stamped |
| `futuristic-click` | **two or three in the whole video**, where a real UI does the thing being described |
| `pop` | the CTA |

Everything else is decoration. Do not "fix" a persa pass back up to 25+ cues.

## Order of operations
1. Lock the visual render. 2. Watch it; note every treatment change and named product with its
real timecode (read beat starts from `beats.json`, word onsets from the transcript). 3. Write
`sfx-cues.txt`. 4. `finish.sh` mixes it. 5. Measure.

```
# sfx-cues.txt — <seconds> <sound> [gain]
0.00  swell           0.30
2.30  swell           0.30
7.66  riser           0.22
9.44  swell           0.30
27.68 camera-shutter  0.25
```

## Levels — present, not loud, and MEASURED
Sound sits **under** the voice: you hear it on a normal watch, it never masks a word. If you can
hear a cue as a separate event rather than as emphasis on the word, it is too loud.
Measure each cue as a delta against the voice-only file:
```bash
ffmpeg -ss <cue> -t 0.45 -i out/<slug>-voice.mp4 -af volumedetect -f null - 2>&1 | grep -E "mean|max"
ffmpeg -ss <cue> -t 0.45 -i out/<slug>-sfx.mp4   -af volumedetect -f null - 2>&1 | grep -E "mean|max"
```
- target **+1 to +3 dB** for anything that fires 3+ times (swell); +2 to +5 dB for one-offs
- **peak delta saturates under speech**: a cue on a loud word reads "thin" on `max_volume` however
  loud it really is — check `mean_volume` too, and trust the ear over the number
- gain is per SOUND, not per cue type — sources differ by up to 12 dB

## The bed (optional, bring your own)
No music ships with this kit. `lay-bed.sh` loops your track, fades it in, and sets it **14 LU under
the mix by integrated loudness** — never by peak (a "-38 dB peak" bed lands near -50 LUFS and is
inaudible). Use a track you own or that is licensed for your videos.
