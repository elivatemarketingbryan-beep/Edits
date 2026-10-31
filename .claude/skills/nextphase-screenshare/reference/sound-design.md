# sound design

**brand.json decides:** `sfx` on/off, `music` on/off. With both off the
audio is the voice only — a perfectly good choice for this style.

---

## 1 · What was measured

**No music bed under most of the reference.** Per-tenth noise floor:

```
-23 -27 -28 -27 | -58 -58 -58 -58 -60 -61 dB
```

The first four tenths hold a floor around −27 dB — a quiet bed under roughly
the opening 40%. From there it drops to −58/−61, which is true inter-word
silence. So: **a bed under the opening section only, and nothing after it.**

**No whoosh on most transitions.** High-frequency energy (3–9 kHz) in the
300ms at the cut versus the 350ms before it, across 12 sampled ground changes:

```
ratio  0.34  0.66  9.79  0.40  9.55  0.27  0.19  0.25  0.29  0.93  6.35  0.20
```

Three of twelve show a transient; nine do not, and the three could as easily
be a consonant. **The reference does not systematically sound its transitions.**

---

## 2 · What this kit ships (when sfx is on)

A silent layout change can feel broken on a long-form cut, so with sfx on the
kit sounds **every layout change, quietly, and nothing else**:

| cue | where | file | gain (linear) |
|---|---|---|---|
| `share-on` | first frame of a travel OUT of full frame | soft swell, ~200ms | 0.126 (−18 dB) |
| `share-off` | first frame of a travel BACK to full frame | shorter, ~150ms | 0.10 (−20 dB) |
| `swap` | half ↔ corner, or the card changing sides | airier, quieter | 0.08 (−22 dB) |

`build.py` writes `sfx-cues.txt` for you from the beat list, pre-rolled by each
sound's peak offset (`sfx/peaks.json`). The sounds are synthesised in code by
`scripts/synth-sfx.py` — royalty-free, yours outright.

**That is the entire cue sheet.** Specifically, there is **no**:
- riser into a chapter, or any riser at all
- stab, hit, impact or boom on a callout number
- per-caption tick — captions swap 100+ times
- whoosh on an element arriving on the canvas
- UI "pop" on a card, however tempting
- sub drop, ever

A canvas beat that adds three things gets **zero** sounds. Only the layout
change is sounded. (`mark` and `click` exist in sfx/ for the rare beat that
needs one; add them to sfx-cues.txt by hand.)

## 3 · Why a transient and not a whoosh

A whoosh is directional — it says something flew past. The camera does not fly
anywhere; it collapses into the corner it is already in. The matching sound is
the one a call makes when a share starts: short, soft, non-tonal, resolving
rather than sweeping. If a cue sounds like a transition in a hype edit, it is
wrong for this style. Keep it under 200ms; the move is 367ms.

## 4 · Your own sounds

Drop any `.wav` / `.mp3` into `<skill>/sfx/` named `share-on`, `share-off`,
`swap` (replacing the synthesised ones) or any new name you then use in
sfx-cues.txt. `scripts/mix-sfx.sh` resolves `sfx/<name>.{wav,mp3,aif,aiff}`.
**Call it by its path inside the skill** (finish.sh does) — a copy elsewhere
cannot find the sounds. Re-measure the peak offset of a replaced sound or
every cue lands late:

```bash
<skill>/scripts/py -c "import wave,array,sys; w=wave.open(sys.argv[1]); a=array.array('h',w.readframes(w.getnframes())); i=max(range(len(a)),key=lambda k:abs(a[k])); print(i/w.getnchannels()/w.getframerate())" sfx/share-on.wav
```
then update `sfx/peaks.json`.

Sound packs you bought are licensed to YOU — use them in your own videos, but
do not put them in a kit you pass on.

## 5 · The music bed (when music is on)

Drop one track you have the rights to into `<video>/assets/music/`. finish.sh
lays it with `scripts/mix-bgm.sh`: looped, ducked under the voice by a
sidechain compressor (5–9 dB between speech and gaps), faded in and out.

If you follow the reference, keep it under the cold open only and drop it
before the first chapter (`--drops "<start>:<end>"` silences a span). Pick the
least melodic thing available: anything with a hook competes with the voice.
You should notice the bed LEAVE, not arrive.

## 6 · Three traps

1. **Cue times are file starts, not hit times.** build.py pre-rolls them; if
   you write cues by hand, pre-roll each by its peak offset.
2. **Per-segment audio drifts ~38ms of AAC priming per join.** finish.sh relays
   the source voice onto the joined picture in one piece instead of trusting the
   joined track.
3. **`-shortest` drops the final frame.** mix-bgm.sh uses `-t <duration>`.
