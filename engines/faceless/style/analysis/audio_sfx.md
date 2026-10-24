# Reference video: sound design and audio post-production analysis

Source: `Ref Video For Editing Style.mp4`. The audio is HE-AAC (SBR), stereo, 48 kHz, 62 kb/s, 29.93 s long; the video runs 29.90 s (897 frames at 30 fps).
All times are in seconds. `fN` is the 0-based frame index, so t = N/30. "Per-channel" means the level in the L or R channel.
Loudness figures are true ITU BS.1770 / EBU R128 measurements (ffmpeg `ebur128` plus a numpy K-weighting re-implementation), not RMS proxies, unless a figure is labelled RMS.
Work and scripts: `scratchpad/work/audio/`. Synth and validation outputs: `scratchpad/analysis/sfx_proto/`.

---

## 0. Key findings

| | Finding |
|---|---|
| Stems | The voice is **dead-centre mono**: mid/side coherence is 0.00–0.02 in every band, so the side channel holds no voice. The **music bed** is a very wide stereo pad, with mid level ≈ side level. The **SFX** are stereo-wide or polarity-inverted, so the side channel isolates them cleanly. All of the analysis below rests on this M/S split. |
| Music | Yes. A **beatless, wide ambient synth pad** in E minor / G major. Progression **Em – G – C – Em – G – C – Em**, harmonic rhythm 2.2–6.4 s. It runs **-23 to -26 LU under the voice** (constant, **no ducking**), is present from frame 0, and stops at the last sample with no fade. No drums, so there is no tempo to detect. |
| SFX | **17 placements from only 4 samples**, frame-locked to edit events. 0.57 events/s, one every 1.76 s on average, with the longest SFX-free stretch at 4.43 s. Each sample repeats bit-identically: side-channel cross-correlation between instances is r = 0.99–1.00. |
| Family A: reverse riser | 7×. A 0.60 s exponential swell (33 Hz sub, 895 Hz ring, 2–13 kHz air) that **hard-stops 0–3 frames before a section cut**. Placement: start 18–21 frames before the cut. |
| Family B: sub swell | 6×. A 0.9 s 33 Hz "whomp". The **file starts on the cut frame**; the swell becomes audible at +0.12 s, **peaks at +0.34 s (10 frames)** in step with the push-in / whip / scroll, and has decayed by +0.90 s. |
| Family W: whoosh | 3×. A 0.43 s swoosh with a 47–62 Hz body and 5.6–7.4 kHz air, peaking at +0.28 s. It plays on the **first frame of a graphic fly-in** (title card, stat callout) and at t = 0. |
| Family T: double tick | 1×, medium confidence. Two transients 40 ms apart when the CTA keyword "Motion" pops in. |
| Silent events | Caption word pops (~120), cursor clicks, highlight wipes, glitch-text and the number count-up get **no** SFX. |
| Voice | **-14.3 LUFS integrated**, true peak -0.5 dBTP, **LRA 2.4 LU** (heavily compressed and limited). Dry, with no reverb. High-passed around 80 Hz, full low-mids, a slight 5–6 kHz lift. **243 wpm, with every pause trimmed**: the longest silence is 90 ms and no breaths remain. |
| Phone reality | The SFX energy sits mostly below 60 Hz, so on phone speakers only the riser's ring and air and the whoosh's air are audible. The riser was printed **polarity-inverted (L = x, R = -x)**, so it cancels in a mono fold-down. The synths default to a mono-safe version. |

---

## 1. Method and caveats

1. I extracted stereo PCM myself from the mp4. The supplied `audio.wav` is a mono fold-down, which destroys the M/S information.
2. M = (L+R)/2, S = (L-R)/2. Over the long windows 13.0–16.2, 22.0–25.2 and 26.2–29.2 s, M/S magnitude-squared coherence is ≤ 0.02 in every band from 60 Hz to 12 kHz, so **S contains no voice**. S therefore isolates music plus SFX.
3. Detection ran in four ways, all on S:
   - band-energy excursions above a 3 s running median, in the bands 20–50, 50–200, 200–2000, 2000–8000 and 8000–16000 Hz;
   - spectral-flux onsets above the 99th percentile;
   - 1 ms HF transient search on both M and S;
   - energy in voice gaps found by my own VAD (M < -38 dBFS).

   Each candidate was then checked against the frames using montages and the frame-difference curve.
4. **HE-AAC artefacts.** In speech-only regions the codec zeroes S above about 2 kHz (median S_HF - M_HF = -53 dB). Each **10–30 ms burst** in S at 1–12 kHz sits at the voice's HF level minus 17–28 dB. These coincide with consonants, for example 11.28 /gz/ "exact", 12.70 /s/ "Inside", 13.43 /ts/ "prompts", 18.615 /k/ "copy" and 27.05 /s/ "yourselves". They are **codec spill, not SFX**, and are listed in §4.3 so nobody re-adds them. Above about 14 kHz the reference is SBR-band-limited, so the top octave cannot be verified.
5. **Alignment.** Instances of each family were aligned by cross-correlating the side channel band-passed to 20–120 Hz. Every alignment snapped to an integer frame boundary, which shows the editor placed the clips on the 30 fps grid.

---

## 2. Music bed

| Property | Value (evidence) |
|---|---|
| Presence | Continuous from 0.000 s to 29.93 s. Chord tones are visible in S from the first window. There is **no fade-in and no fade-out**: the final reverse riser masks the last 0.6 s and the track ends with the file. |
| Genre / feel | Beatless ambient / "tech-explainer" synth pad: soft sustained chords, sine-like with weak 2nd/3rd harmonics, plus a faint high melody (A4–B4–C5–D5) at 0.75–2.25 s. Calm and neutral, emotionally "positive-curious". |
| Rhythm | **No percussion.** Side-channel onset autocorrelation in four SFX-free spans gave no stable peak between 0.25 and 1.6 s (best r = 0.18–0.30 at inconsistent lags), so no BPM can be derived. Harmonic rhythm: chord changes at ≈6.6, 9.9, 14.3, 16.5, 19.7 and 26.1 s, giving segments of 3.3, 4.4, 2.2, 3.2 and 6.4 s. These are irregular, which suggests the bed was edited or looped and not cut to the bar. |
| Harmony | Key **E minor / G major**. Em (E2 82 Hz, E3, G3, B3, E4, G4): 0–6.6, 14.3–16.5, 26.1–end. G (G2 98 Hz, G3, B3, D4 294 Hz; A3 added at 9.25–9.75): 6.6–9.9, 16.5–19.7. C (C3 131 Hz, E3, G3, C4 262 Hz, E4): 9.9–14.3, 19.7–26.1. |
| Stereo | Very wide. For clean chord tones mid ≈ side (294 Hz: M -41.7 / S -41.8 dB; 247 Hz: -49.1 / -48.8). The bass is a little more central (98 Hz: M 7 dB above S). |
| Level | S in SFX-free regions: **-46.3 LUFS** (mono measurement). With mid ≈ side to +5 dB, the bed sits at **-40 to -37 LUFS** stereo against the voice's -14.3, i.e. **23–26 LU under the voice**. RMS view: the bed floor in voice gaps is -40 to -47 dBFS against -16.2 dBFS voice-active RMS (10 ms frames above -30 dBFS). |
| Ducking | **None measurable.** The S music level is -45.4 dB in voice gaps (n = 16 frames of 50 ms) against -46.7 dB under speech (n = 218), corr(bed level, voice level) = -0.18. Pauses are ≤ 90 ms, so a ducker would never release anyway: the bed is simply set low and left flat. |

---

## 3. SFX families: what they are

All levels in this section are **band-RMS over 20 ms windows, measured in S** unless noted.
The per-channel level equals the S level for family A (anti-phase). For families B and T it is about S + 3 dB (decorrelated); for W it is about S + 4.5 dB (30 % correlated).

### A. Reverse riser ("reverse boom / suck-in into the cut")

A 0.60 s time-reversed impact. Components:

| Component | Detail | Level change |
|---|---|---|
| Sub | 33.0 Hz sine (C1 + 15 cents) with weak partials at 48, 74, 98 and 131 Hz (-16 to -23 dB re 33 Hz) | -43.5 dB at +0.06 s to -23.2 dB at +0.565 s: a linear-in-dB ramp of about **+40 dB/s**, i.e. exponential amplitude growth, roughly GSAP `expo.in` compressed to a 20 dB range |
| Ring | Constant-pitch 895 Hz tone (A5 + 30 cents) with odd partials 2685 Hz (-24 dB) and 4475 Hz (-5 dB); the partials bloom after +0.30 s | -61 to -42.5 dB (+37 dB/s) |
| Air | Noise | 2–5 kHz appears only after +0.30 s (-72 to -42 dB band total including the 4475 Hz partial). 5–9 kHz appears after +0.42 s. A 9–13 kHz "sizzle" arrives in the last 50 ms and peaks at -45.5 dB at +0.578 s. |

- **End:** a hard stop, -20 dB within 35 ms (+0.565 to +0.600 s) and silent by +0.615 s.
- **Envelope:** attack 565 ms, release about 35 ms.
- **Stereo:** L/R correlation -0.87 to -0.95. The clip was printed with one channel **polarity-inverted**: M is 16 dB below S at 33 Hz.
- **Per-instance peaks (sub / ring / air), dB:**
  - f0, f65, f175, f359, f534: -24.0 / -43.3 / -41.8 (±0.4 dB, identical clip and gain)
  - f762 and f879 (the CTA section): -21.0 / -40.4 / -38.7, i.e. **+3 dB hotter**

### B. Sub swell ("whomp" under a push-in)

- **Content:** 33 Hz plus a 35.5 Hz component about -6 dB down. The two beat at about 2.5 Hz, which produces the stepped decay below. There is also a 45–100 Hz "knock" (+ 120–140 Hz) peaking at +0.24 s and a 110–400 Hz body about 17 dB under the sub.
- **No consistent energy above 400 Hz.** HF that appears in three instances is the codec/consonant spill described in §1.4.
- **Timeline after the file starts on the cut frame:**
  - 0–0.10 s: near-silence (≤ -70 dB);
  - 0.13 s: -52 dB;
  - 0.24 s: -28.5 dB;
  - **0.34 s: -22.5 dB peak, per-channel**, i.e. attack about 210 ms;
  - stepped decay at about 40 dB/s (-26 dB at 0.46 s, -31 dB at 0.58 s, -37 dB at 0.64–0.72 s, -43.5 dB at 0.86 s);
  - cut to silence by 0.92 s.
- **Stereo:** decorrelated, L/R correlation +0.05 to +0.14, M ≈ S (-29.4 / -30.0 dB).
- **Instances:** all 6 sit at -25.2 ± 0.3 dB S-sub peak, except f146 at -27.0 dB.
- **Audibility:** essentially inaudible on phone speakers, a "felt" weight on headphones.

### W. Whoosh ("low-body air swoosh")

- **Length:** 0.43 s, swell-shaped. The sound rises for about 0.25 s, the air peaks at +0.27–0.28 s (61 % of the length), then releases within about 0.1 s.
- **Body:** narrow 47–62 Hz noise (spectral peak 53–56 Hz), per-channel peak about -24 dB at +0.21–0.29 s, plus a 100–125 Hz overtone at -16 dB.
- **Air:**
  - 5.6–7.4 kHz: -55 dB at +0.03 s, rising to -38 dB at +0.28 s, back to -55 dB at +0.37 s;
  - 2–5 kHz: a short early flick at +0.08 s (-43.5 dB), then about -48 dB;
  - 9–16 kHz: early flick at +0.08 s (-46 dB), then about -53 dB;
  - 0.5–2 kHz: steady at about -45 dB.
- **Character:** "rise-then-fall" (`power2.out` rise, `power3.in` fall).
- **Spectral motion:** centroid about 2.2 kHz at +0.03 s, about 6.6 kHz at +0.13–0.15 s, then 4–5 kHz, then about 2 kHz at the tail (measured on f254).
- **Stereo:** low end about 30 % correlated; air fully decorrelated.
- **Instances:** f0, f196 and f254 are the same clip at the same gain (S 45–150 Hz peak -28.7 / -29.3 / -29.0; low-band xcorr r = 0.969–0.987).

### T. Double tick (medium confidence)

- **Timing:** two broadband transients at 27.62 and 27.66 s (≈f828–829), each with 1.5 ms attack and about 9 ms decay. Faint ring at about 2.2 and 3.2 kHz.
- **Spectrum:** roughly flat from 0.6 to 8 kHz, -6 to -10 dB at 9–13 kHz. Centroid 3.3 kHz.
- **Level:** S peak -35.8 dB (1–12 kHz), per-channel about -33 dB, i.e. the quietest family.
- **Why medium confidence:** it sits inside the word "comment" (27.54–27.78 s) in a vowel/nasal region. Its 100 ms elevated S_HF (median S-M = -8 dB) is atypical of codec spill, which runs 10–30 ms at -17 to -28 dB. It still cannot be fully separated from a codec artefact.

---

## 4. SFX inventory

### 4.1 Placements

- **Δvoice** is the momentary 400 ms K-weighted loudness of the SFX against the voice's -14.3 LUFS integrated, computed from level-calibrated synths of each family.
- **Peak** is the S-band peak in dB.

| # | Start (frame / s) | Audible span, s | Peak at | Dur frames / ms | Family | Spectral character | Peak (S) dB | Δvoice LU | Visual event it serves |
|---|---|---|---|---|---|---|---|---|---|
| 1 | f0 / 0.000 | 0.00–0.60 | 0.565 (f17) | 18 / 600 | A riser | 33 Hz + 895 Hz ring + air, exponential swell, hard stop | sub -24.3, ring -43.7, air -41.9 | -17 | Video open. Title "Claude Can Now" plus browser card scale in (f1–f6). Stops as the 2-line title finishes building (≈f17); there is no cut. |
| 2 | f0 / 0.000 | 0.00–0.43 | 0.28 (f8) | 13 / 430 | W whoosh | 47–62 Hz body + 5.6–7.4 kHz air swell | low -28.7, air -43.2 | -13.5 | Same: the card and title fly in. Stacked on #1. |
| 3 | f65 / 2.167 | 2.17–2.77 | 2.73 (f82) | 18 / 600 | A riser | as #1 | -24.0 / -43.1 / -41.6 | -17 | **Cut f86 (2.867)**: A-roll (face + browser) to full-screen tweet card on dark background. Stop lands 3 frames early. |
| 4 | f86 / 2.867 | 2.99–3.77 | 3.21 (f96) | 27 / 900 | B sub swell | 33/35.5 Hz + 45–100 Hz knock, no HF | sub -25.2 | -14 | Push-in / settle of the tweet card after the cut (frame-diff peaks f91–f95, 3.03–3.17). |
| 5 | f146 / 4.867 | 4.99–5.77 | 5.21 (f156) | 27 / 900 | B sub swell | as #4 | sub -27.0 | -16 | No cut. The tweet scroll/zoom motion starts at 5.20 (f156) and peaks at 5.47–6.17. |
| 6 | f175 / 5.833 | 5.83–6.43 | 6.39 (f192) | 18 / 600 | A riser | as #1 | -24.0 / -43.3 / -41.7 | -17 | **Cut f196 (6.533)**: tweet to white title screen. Stop lands 3 frames early. |
| 7 | f196 / 6.533 | 6.55–6.96 | 6.81 (f204) | 13 / 430 | W whoosh | as #2 | low -29.3, air -43.4 | -13.5 | First frame of the white scene. Blue square appears 6.73 (f202) and expands into the "It's Called" label at 6.83; the card fades and slides in. |
| 8 | f254 / 8.467 | 8.47–8.89 | 8.75 (f262) | 13 / 430 | W whoosh | as #2 | low -29.0, air -42.0 | -13.5 | Stat callout: blue pill draws round "230" (f254), then the counter pops in and counts 060 to 230 (8.63–9.03). |
| 9 | f323 / 10.767 | 10.89–11.67 | 11.11 (f333) | 27 / 900 | B sub swell | as #4 | sub -25.8 | -14 | **Cut f323**: face + browser to dark prompt card; card push-in 10.90–11.20. |
| 10 | f359 / 11.967 | 11.97–12.57 | 12.53 (f376) | 18 / 600 | A riser | as #1 | -24.0 / -43.2 / -42.1 | -17 | **Cut f378 (12.6)**: dark prompt card back to face + browser. Stop lands 1 frame early. |
| 11 | f488 / 16.267 | 16.39–17.17 | 16.61 (f498) | 27 / 900 | B sub swell | as #4 | sub -25.2 | -14 | No cut. Motion-blurred whip-pan of the browser filter row at 16.63–16.90 (f499–f507). |
| 12 | f534 / 17.800 | 17.80–18.40 | 18.36 (f551) | 18 / 600 | A riser | as #1 | -24.0 / -43.5 / -41.8 | -17 | **Cut f553 (18.433)**: browser to full-face close-up. Stop lands 1 frame early. |
| 13 | f583 / 19.433 | 19.56–20.33 | 19.77 (f593) | 27 / 900 | B sub swell | as #4 | sub -25.0 | -14 | **Cut f584 (19.467)**, file placed 1 frame early: full face to prompt page, page slides up 19.50–19.80. |
| 14 | f629 / 20.967 | 21.09–21.87 | 21.31 (f639) | 27 / 900 | B sub swell | as #4 | sub -25.1 | -14 | **Cut f629**: browser to dark split-screen demo ("original" vs "Frame by Frame remake"); settle 21.20–21.27. |
| 15 | f762 / 25.400 | 25.40–26.00 | 25.96 (f779) | 18 / 600 | A riser (+3 dB) | as #1 | -21.0 / -40.6 / -38.8 | -14.5 | **Cut f780 (26.0)**: split-screen to full-face close-up (CTA section). Stop lands on the cut frame. |
| 16 | f827 / 27.567 | 27.62–27.74 | 27.66 (f830) | 5 / 170 | T double tick (medium) | 2 × 10 ms broadband ticks 40 ms apart, 0.6–9 kHz | -35.8 (1–12 kHz) | -19 | CTA keyword "Motion" with blue glow pops in under "comment" at 27.60 (f828). |
| 17 | f879 / 29.300 | 29.30–29.90 | 29.82 (f895) | 18 / 600 | A riser (+3 dB) | as #1 | -21.2 / -40.1 / -38.6 | -14.5 | End of video: the stop lands on the last frame (f896) and the file ends. |

### 4.2 Scene cuts and their sound

| Cut | Gets |
|---|---|
| 2.867 | A before + B after (the signature "suck-in, whomp" pair) |
| 6.533 | A before + W on the cut |
| 7.867 | **nothing** |
| 10.767 | B |
| 12.6 | A |
| 18.433 | A |
| 19.467 | B |
| 20.967 | B |
| 24.133 | **nothing** (in-split-screen content swap) |
| 26.0 | A |

### 4.3 Rejected candidates (not SFX)

| Time | Why rejected |
|---|---|
| 1.085, 3.18, 3.30, 6.08, 11.13, **11.28** (strongest S flux peak, -32.9 dB), 12.70, 13.16, 13.43, 14.99, 16.41, 17.76, **18.615**, 19.59, 23.22, 23.36, 23.61, 26.735, 27.05, 28.31, 28.65 | 10–30 ms side bursts at the voice HF level minus 17–28 dB, each on a consonant. HE-AAC M/S switching (codec noise). None repeats on a visual-event class: the "Prompt" button click at 13.43 is silent, while the click on "Product UI" at 14.10–14.23 has no burst. |
| 4.73–4.96, 9.995–10.27, 20.015–20.33 | Faint 8–16 kHz only, -51 to -52 dB S, no 2–8 kHz component. Probably bed and SBR texture. If they are SFX they are far below audibility next to the voice. |
| 8.85–9.11 | -54 to -61 dB 1–2 kHz residue after whoosh #8: bed or codec, not a separate counter-tick SFX. |

---

## 5. Voice processing

| Aspect | Measurement |
|---|---|
| Loudness | **-14.3 LUFS integrated** (stereo mix; the voice dominates and the mid-only mono measure is -17.3 LUFS, i.e. the same voice at 2 channels → +3 dB). Short-term LRA **2.4 LU** (LRA-low -15.4, LRA-high -13.0). |
| Peaks | Sample peak -0.54 dBFS (L) / -0.60 dBFS (R); **true peak -0.5 dBTP**. Only 12 samples exceed -1 dBFS, but 1037 samples (146 of the 10 ms frames) reach -2 to -1 dBFS. That is a **brick-wall limiter with a ceiling of about -0.5 dBTP**, hit often. |
| Dynamics / compression | Active-speech crest factor (peak against RMS) is 15.6 dB. 100 ms RMS during speech: mean -18.8, σ 4.7 dB, p10 -25.9, p90 -13.5, max -10.5 dBFS. 400 ms RMS σ is 3.3 dB. Combined with the 2.4 LU LRA this is **dense broadcast-style compression** (inferred at about 4:1 plus a limiter; the exact ratio and attack cannot be recovered from the mix). |
| EQ (LTAS, speech frames, mid channel, re 1 kHz) | 50 Hz -11.3, 63 -12.0, **80 -4.0**, 100–160 +2.1–2.2, 200 +5.7, 250 +2.7, 315–630 +5.3–6.6, 800 +3.4, 1k 0, 1.25k +1.6, 1.6k -1.5, 2k -2.7, 2.5k -2.9, 3.15k -3.6, 4k -7.1, **5k -3.6, 6.3k -3.4**, 8k -7.0, 10k -11.7, 12.5k -18.6, 16k -28. Reading: a high-pass at about 75–80 Hz (steep below 80), warm close-mic low-mids, no "radio" presence boost, a mild 5–6 kHz air/sibilance lift. The top octave rolls off, partly the codec. |
| Reverb / room | **Dry.** Level falls more than 10 dB in 20 ms at phrase ends (for example 2.78 to 2.80: -34.6 to -46.3 dBFS) with no tail. The gap floor (-40 to -47 dBFS) is the music bed (S ≈ M in gaps), not room tone. |
| Silence trimming / jump cuts | **120 words in 29.68 s = 4.04 words/s (243 wpm).** VAD (M < -38 dBFS) finds 72 non-speech gaps; only 30 are ≥ 30 ms and the **longest is 90 ms**. No breath noise survives. Every pause and breath has been cut, a tight jump-cut voice track. Words start at 0.00 s (no pre-roll) and the last word ends at 29.68, 0.25 s before the end of the file. |
| Stereo | Perfect centre mono (the voice is absent from S). |

---

## 6. Rules: the sound-design grammar to reproduce for any topic

### 6.1 Which visual event gets which SFX

1. **Section-boundary hard cut** (the layout or template changes and the old shot is done, such as A-roll to full-screen card, card back to A-roll, or into a full-face close-up): use a **reverse riser that ends on the cut**. Start it 18–21 frames before the cut frame (`cutFrame - 19` is a good default). Its hard stop lands 0–3 frames early, so the cut itself is dry. In the reference this happens at 5 of 10 cuts.
2. **Cut into a B-roll card that pushes in or settles**, and **any big mid-shot camera move** (scroll, whip-pan, zoom): use a **sub swell**. Start the file on the cut frame, or 10 frames before the motion's peak velocity when there is no cut. Its peak lands about 10 frames in, with the motion.
3. **When both apply**, chain them riser → swell across the cut (as at 2.867). This "suck-in → whomp" pair is the signature move.
4. **Graphic element fly-in on a fresh scene** (title label, stat/number callout, and t = 0): use a **whoosh** on the first frame of the entrance. Its air peaks 8 frames (0.28 s) later, when the element settles.
5. **The CTA keyword pop**, once per video: use a **double tick**, quietest of all.
6. **Video open**: riser + whoosh together at frame 0. **Video end**: a riser whose stop lands on the final frame (+3 dB, as is the CTA-section riser before the last cut).
7. **No SFX for**: per-word caption pops (about 4/s), cursor moves and clicks, text-highlight wipes, glitch/RGB-split caption words, number count-ups beyond the initial whoosh, and in-place content swaps (24.133). Cuts in the middle of a phrase into the same layout (7.867) also stay silent.

### 6.2 Density

- 17 placements in 29.9 s: **0.57/s**.
- Inter-onset gaps (s): 0, 2.17, 0.70, 2.00, 0.97, 0.70, 1.93, 2.30, 1.20, 4.30, 1.53, 1.63, 1.53, 4.43, 2.17, 1.73. Median 1.68 s, maximum 4.43 s.
- About 36 % of the runtime has an SFX sounding: 7 × 0.60 + 6 × 0.78 + 3 × 0.43 + 0.17 = 10.3 s.
- At most 2 SFX overlap (only at t = 0); otherwise they are strictly sequential.
- Per 30 s: about 6–7 risers, 5–6 swells, 2–3 whooshes, 1 tick.

### 6.3 Mix

| Element | Level |
|---|---|
| Voice | -14 LUFS integrated, ≤ -0.5 dBTP, LRA about 2–3 LU, dry, mono-centre |
| Bed | 23–26 LU under the voice (≈ -38 to -40 LUFS), constant, no sidechain, very wide |
| SFX | Momentary peaks 13.5–19 LU under the voice: whoosh ≈ swell (-13.5 to -14) > riser (-17; -14.5 for the last two) > tick (-19). Per-channel 20 ms-RMS peaks: swell -19.4, whoosh -20.2, riser -22.4, tick -32 dBFS, against voice 100 ms-RMS peaks of -10.5 dBFS. |
| Audibility on phone speakers | Most of the riser and swell energy is below 60 Hz. On a phone you mainly hear the riser's 895 Hz ring and last-300 ms air (about 27 dB under the voice RMS) and the whoosh's 0.5–9 kHz air. **Keep sound design subtle; it should be felt, not noticed.** |
| Phase | The reference riser is anti-phase L/R and **vanishes in mono**. Use the mono-safe file (L = R) unless you want to copy that flaw deliberately. |

---

## 7. Procedural synthesis recipes (license-free) and validation

- **Script:** `scratchpad/analysis/sfx_proto/synth_sfx.py`, which needs only numpy, scipy and Pillow. It writes 48 kHz / 24-bit stereo WAVs into `sfx_proto/` at the **reference mix level for a voice normalised to -14 LUFS**, so they drop in at 0 dB gain.
- **Envelope convention:** each breakpoint is (time s, per-channel band-RMS dBFS), interpolated **linearly in dB**. A sine of RMS 1 has amplitude √2. Band-noise is white noise, Butterworth band-passed (order 4 unless stated, zero-phase `sosfiltfilt`) and normalised to RMS 1.

### 7.1 `reverse_riser.wav` (mono-safe) and `reverse_riser_faithful_antiphase.wav` (L = x, R = -x, as in the reference)

- **Length:** 640 ms. Edge fades: 3 ms in, 10 ms out.
- **Sub:** sine 33.0 Hz. Envelope: (0, -60) (0.06, -43.5) (0.12, -40.5) (0.20, -37) (0.30, -32.5) (0.40, -28.8) (0.46, -25.8) (0.53, -24) (0.565, -23.2) (0.585, -27) (0.600, -38) (0.615, -60).
- **Sub partials** on the same envelope: 48 Hz (-18.5 dB), 74 Hz (-20), 98 Hz (-16.5), 131 Hz (-23), all relative to the sub.
- **Ring:** sine 895 Hz. Envelope: (0, -74) (0.06, -61) (0.14, -55) (0.20, -51.7) (0.30, -49) (0.40, -47) (0.50, -45) (0.565, -42.5) (0.585, -44) (0.600, -52) (0.615, -75).
- **Ring partials:** 2685 Hz (-24 dB) and 4475 Hz (-5 dB), multiplied by a bloom from -40 dB at 0.30 s to 0 dB at 0.45 s.
- **Noise:**
  - 1–2 kHz: (0, -80) (0.38, -67) (0.46, -57) (0.56, -51.5) (0.595, -51) (0.615, -80)
  - 2–5 kHz: (0.28, -83) (0.32, -72) (0.40, -67) (0.44, -63) (0.48, -58) (0.52, -55) (0.56, -52.5) (0.585, -53.5) (0.600, -59) (0.615, -85)
  - 5–9 kHz: (0.40, -82) (0.46, -64) (0.50, -59) (0.54, -54) (0.565, -51.5) (0.590, -53) (0.615, -82)
  - 9–13 kHz: (0.48, -80) (0.53, -62) (0.578, -45.5) (0.595, -51) (0.615, -85)
- **Validation** against the 5-instance median template in S:

  | Measure | Result |
  |---|---|
  | 1/3-octave spectrum RMS error | **2.5 dB** over 18 bands (20–500 Hz 2.0 dB; 0.6–14 kHz 2.8 dB) |
  | Sub envelope | 1.7 dB RMS error; peak -24.0 dB @ 0.56 s (ref) vs -22.7 dB @ 0.52 s (synth) |
  | Ring envelope | 2.3 dB RMS error; peak -43.2 vs -42.9 dB @ 0.56 s |
  | 5–9 kHz envelope | 2.2 dB RMS error |

### 7.2 `sub_swell.wav`

- **Length:** 940 ms. Edge fades: 2 ms in, 12 ms out.
- **Sub:** 33.0 Hz plus 35.5 Hz at -6 dB, normalised together. R is phase-shifted +84° for decorrelation, giving a mono-sum loss of -2.5 dB. Envelope: (0, -90) (0.10, -72) (0.13, -52) (0.16, -41.5) (0.20, -38.5) (0.24, -28.5) (0.30, -26) (0.34, -22.5) (0.40, -25.5) (0.46, -26.5) (0.52, -30) (0.58, -31) (0.64, -37) (0.72, -37.5) (0.76, -42) (0.86, -43.5) (0.89, -52) (0.92, -80).
- **Knock:** independent L/R noise at 45–100 Hz, plus 120–140 Hz at -4 dB. Envelope: (0, -90) (0.10, -70) (0.13, -45) (0.18, -35) (0.24, -30.5) (0.30, -34.5) (0.34, -34) (0.44, -36.5) (0.52, -40) (0.58, -46) (0.70, -50) (0.80, -54) (0.88, -80).
- **Body:** 110–400 Hz noise. Envelope: (0, -95) (0.14, -70) (0.20, -44) (0.30, -41) (0.42, -41) (0.50, -46) (0.60, -54) (0.70, -70).
- **Air:** 400–2600 Hz noise at body -9 dB.
- **Validation** against the 6-instance template:

  | Measure | Result |
  |---|---|
  | 1/3-octave RMS error, 20–500 Hz | **1.9 dB** |
  | 1/3-octave RMS error, 0.6–14 kHz | 8.6 dB, at -70 to -77 dB where the reference is near the bed floor |
  | Sub envelope | 4.1 dB RMS error (the beat phase differs per instance); peak -25.2 vs -24.2 dB, both at 0.34 s |
  | Knock / body envelopes | 4.7 / 2.6 dB RMS error |

### 7.3 `whoosh.wav`

- **Length:** 460 ms. Edge fades: 2 ms in, 10 ms out.
- **Low body:** 47–62 Hz noise, **order-6** band-pass, built as L, R = √0.3 · common + √0.7 · independent. Envelope: (0, -60) (0.01, -38) (0.05, -32.5) (0.09, -30.5) (0.17, -26.5) (0.21, -24) (0.29, -23.8) (0.32, -26.5) (0.35, -31.5) (0.38, -34) (0.40, -38) (0.42, -48) (0.45, -75).
- **Overtone:** 100–125 Hz at the low envelope -16 dB, plus a 33 Hz sine at -30 dB.
- **Independent L/R noise bands:**
  - 150–400 Hz: (0, -80) (0.03, -44.5) (0.20, -39.5) (0.30, -40.5) (0.40, -54.5) (0.44, -80)
  - 0.5–2 kHz: (0, -80) (0.03, -47) (0.12, -47) (0.22, -44) (0.32, -47) (0.40, -57) (0.44, -80)
  - 2–5 kHz: (0, -90) (0.03, -55) (0.08, -43.5) (0.12, -50) (0.24, -47.5) (0.30, -49) (0.34, -60) (0.38, -80)
  - **5.6–7.4 kHz**: (0, -90) (0.03, -55) (0.07, -50) (0.13, -51) (0.17, -46) (0.21, -44.5) (0.25, -41.5) (0.28, -38) (0.31, -41) (0.34, -47) (0.37, -55) (0.40, -70) (0.43, -90)
  - 9–16 kHz: (0, -90) (0.04, -56) (0.08, -46) (0.12, -53) (0.25, -52) (0.33, -54) (0.38, -60) (0.42, -80)
- **Validation** against the f196 + f254 template:

  | Measure | Result |
  |---|---|
  | 1/3-octave RMS error | **3.5 dB** over 26 bands (0.6–14 kHz **1.8 dB**; < 500 Hz 4.9 dB) |
  | Low envelope | 3.2 dB RMS error; peak -29.4 dB @ 0.28 s (ref) vs -29.0 dB @ 0.24 s (synth) |
  | 5.6–7.4 kHz envelope | 2.5 dB RMS error; peak -43.1 @ 0.28 vs -42.1 @ 0.26 |
  | 9–16 kHz envelope | 1.5 dB RMS error |

### 7.4 `double_tick.wav`

- **Length:** 200 ms.
- **Hits:** at 55 ms and 95 ms; the second is +1.5 dB.
- **Each hit:** an envelope (1 - e^(-t/1.5 ms)) · e^(-t/9 ms) applied to noise shaped as 0.6–2 kHz -5 dB, 2–5 kHz -2.5, 5–9 kHz -6, 9–13 kHz -10, all scaled to -36 dB × 3.2.
- **Ring:** decaying sines at 2217 Hz (-16 dB) and 3160 Hz (-15 dB), τ = 18 ms. Independent L/R noise; R's ring is detuned 0.3 %.
- **Validation:** 1/3-octave RMS error 0.6–14 kHz is **2.1 dB**. Below 500 Hz the single reference instance contains only bed and voice-codec residue, so the overall figure of 11.7 dB is not meaningful.

### 7.5 `music_bed_reference_timeline.wav` (optional, not an SFX; chord and level matched, not spectrally validated)

- **Voices:** six per chord, each sine + 0.18 × 2nd harmonic + 0.06 × 3rd harmonic; the root voice is at 0.8.
  - Em: 82.41, 164.81, 196.00, 246.94, 329.63, 392.00 Hz
  - G: 98.00, 196.00, 246.94, 293.66, 392.00, 493.88 Hz
  - C: 130.81, 164.81, 196.00, 261.63, 329.63, 392.00 Hz
- **Width:** L detuned -4 cents, R +4 cents.
- **Changes:** 0.6 s linear crossfades at the reference chord-change times.
- **Filter and level:** 2nd-order low-pass at 1.8 kHz; -41 dBFS RMS per channel, which gives -38.5 LUFS momentary, about 24 LU under a -14 LUFS voice.

### 7.6 Calibrated file levels (from the script)

| File | Duration | Sample peak | 20 ms RMS peak per channel | Momentary max (400 / 100 ms) | Mono-fold loss |
|---|---|---|---|---|---|
| `reverse_riser.wav` | 640 ms | -18.8 dBFS | -22.4 | -31.4 / -28.0 LUFS | 0 dB |
| `reverse_riser_faithful_antiphase.wav` | 640 ms | -18.8 dBFS | -22.4 | -31.4 / -28.0 LUFS | **cancels completely** |
| `sub_swell.wav` | 940 ms | -15.6 dBFS | -19.4 | -28.1 / -25.7 LUFS | -2.5 dB |
| `whoosh.wav` | 460 ms | -14.8 dBFS | -20.2 | -27.8 / -24.6 LUFS | -2.0 dB |
| `double_tick.wav` | 200 ms | -17.6 dBFS | -32.0 | -33.0 / -30.0 LUFS | -3.1 dB |
| `music_bed_reference_timeline.wav` | — | -29.8 dBFS | -39.4 | -38.5 LUFS | — |

To reproduce the final two risers' +3 dB, apply +3 dB gain to the riser placed before the last cut and to the end riser.

### 7.7 Supporting files

| File(s) | Contents |
|---|---|
| `sfx_proto/validation.json` | Per-band and 1/3-octave numbers |
| `sfx_proto/cmp_<family>_{ref,syn}.png` and `cmp_all.png` | Side-channel spectrograms of reference against synth |
| `work/audio/measure_events.py` | Per-event measurement script |
| `work/audio/events.json` | Per-event measurement output |
