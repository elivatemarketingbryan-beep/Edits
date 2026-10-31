# The reel Editor V2 is learned from

https://www.instagram.com/p/DZH3rByhSpJ/ posted by vxwx8, watermark @just.virals. Nothing of it is in this kit, only measurements and written descriptions. Watch it to see the timing. Never reuse its pictures or audio.

9.25 s, 1080x1080, 60 fps file. Studied frame by frame. Rerun with `scripts/study_reel.py`.

## How it is built

- **Cut on a 25 fps timeline.** Image lengths at 60 fps read 5,5,5,5,4, which is exactly 2 frames at 25 fps. So every length below is a whole number of 25 fps frames.
- **About 30 different pictures, about 75 placements.** The same pictures come round in the same order, changed each time. There is no footage, no text and no caption anywhere.
- **It tells one idea with pictures.** A crowd, everyone barcoded, one black figure among white ones, inside the head (brain, skull, spine), what's unique to you (fingerprint, fingers), breaking away, and last a lone man running ahead of a crowd.

## The picture, section by section

| Time | What happens | Each image stays | Hard cuts/s | Sound hits/s |
|---|---|---|---|---|
| 0.00 to 0.43 | Flash in: gray noise, white, streak blur, then 83 ms of black | 1 to 2 frames | 18.6 | 4.7 |
| 0.43 to 2.20 | First pass, all sharp: 22 pictures | 2 frames (80 ms) | 16.4 | 16.4 |
| 2.20 to 3.35 | Second pass: 3 new pictures, then the first ones return drifting in motion blur | 3 frames (120 ms) | 16.5 | 9.6 |
| 3.35 to 4.55 | Third pass: the X-rays return smeared, then start to solarize | 3 frames (120 ms) | 10.8 | 7.5 |
| 4.55 to 6.87 | Colour pass: solarized colour, and white/black polarity flicker on the skulls every 1 to 2 frames | 3 frames, flicker inside | 19.0 | 15.1 |
| 6.87 to 9.25 | Slows down and lands: heart, runners, fingerprint, fingers, colour figures, crowd, text head, lone runner, black | 6, then 8 to 9 frames (240 to 350 ms) | 7.6 | 4.2 |

Second by second, hard cuts: 19, 16, 17, 12, 12, 18, 20, 8, 8, 1. Sound hits: 10, 18, 12, 7, 12, 11, 18, 5, 2, 2.

- **Colour:** 40% of frames are near black and white, 11% strong colour. Base is black and white with cold blue X-rays. Orange, thermal, pink and teal come through solarizing, mostly from the middle on.
- **Brightness:** 6.4 hard white/black flips a second.
- **Blur is the variation:** the second time you see a picture it's drifting and smeared, so repeats feel new.

## The sound

Layers, from the spectrogram:

1. Sub rumble, 30 to 100 Hz, under everything.
2. Slow melody, 150 to 800 Hz, notes changing about every 0.25 s.
3. Static hiss across the whole range, fading away by about 6.5 s.
4. The shutter click roll on top.
5. One downward sweep at about 4.35 s and a low boom at about 5.1 s.

**The clicks are their own layer, not one per cut.** 64% of hits fall within 20 ms of a cut, and 59% do at a random offset, so that's chance. The click roll follows the section's energy instead: about 16 clicks a second in the rushes (gaps near 62 ms), about 8 in the rests, then it slows down with the picture: 245, 240, 240, 280, 400, 360, 240 ms.

**The click** is one sharp transient of about 5 to 9 ms with a short ring near 7 kHz, gone in about 20 ms. So it's a quick tick, not a long mechanical "ka-chunk". Almost all of it is above 2 kHz, a little at 500 Hz to 2 kHz, and nothing measurable under 500 Hz. There are at least three variants of it. `scripts/synth_sfx.py` makes three clicks to these measurements.
