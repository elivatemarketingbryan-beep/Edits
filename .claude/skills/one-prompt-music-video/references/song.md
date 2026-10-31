# $0 song with ACE-Step 1.5 (local, MIT)

Install once: `bash SKILL/scripts/song/install_acestep.sh` (→ `~/.one-prompt-mv/ACE-Step-1.5`; set `ACE_STEP_DIR`
to reuse an existing checkout). Needs Apple Silicon with 16 GB+ RAM or an NVIDIA GPU with 6 GB+ VRAM. The first song
downloads the models (~10 GB). If the machine can't run it, say so and offer: bring your own song instead.

## 1. Lyrics (write them with the user, show them, get a yes)
Put them in `<project>/song/lyrics.txt`:
- Section tags on their own lines: `[intro] [verse] [pre-chorus] [chorus] [bridge] [outro]`.
- Backing vocals / echoes in parentheses: `(come alive)`.
- No stage directions, no speaker names, no emojis.
- Spell tricky words the way they should be SUNG: `Opus five point five`, `Three A M`, `Chat G P T`. A brand name that
  gets mangled can be spelled phonetically (the ONE PROMPT song used "Clawd" so "Claude" came out right) — keep the
  normal spelling in the lyrics file you give to analyze.py.
- Short, punchy, singable lines (6–12 syllables); a repeated hook; a chorus that appears 2–3 times.
- Write visual lines: every line becomes a shot, so concrete images ("hit enter, let it ride") beat abstractions.
- ~2:30–2:45 ≈ intro + 2 verses + 2 pre-choruses + 3 choruses + bridge + outro.

## 2. Caption (style prompt) — `<project>/song/caption.txt`, MUST be under 512 characters
Lead with the voice so it can't get lost, then genre, tempo, delivery, instruments, structure, mood. Example (ONE PROMPT):
> Solo female vocalist only, a warm smooth confident young woman singing clear English. Melodic pop with melodic rap
> verses, 100 BPM. Verses are sung-rap, rhythmic and on key, never shouted. Soaring catchy emotional sung chorus with
> her own airy harmonies. Warm synth pads, soft plucked guitar, crisp trap hi-hats, deep 808, finger snaps, shimmering
> bells. Soft intro, rising pre-chorus, big anthemic chorus, heartfelt stripped-down bridge, gentle outro. No male vocals.

## 3. Generate 4 takes
```bash
bash SKILL/scripts/song/make_song.sh <project> <bpm> <duration_s> 7 19 31 53
```
Run it in the background (Bash run_in_background) — each take ≈ 2 min on an M-series Mac (plus decode). Only one
generation runs per machine (a lock in `~/.one-prompt-mv/`). Output: `<project>/song/takes/seed<N>.wav`.

## 4. Pick the take
```bash
~/.one-prompt-mv/venv/bin/python SKILL/scripts/song/pick_take.py <project>/song/takes <project>/song/lyrics.txt
```
Ranks takes by how much of the lyrics is intelligible (seeds vary a lot: 25–75%). Tell the user the top two and let
them listen (`open <file>` on macOS) — they choose. Not happy? New seeds, or tweak the caption (clearer diction,
slower BPM, simpler words). Copy the winner to `<project>/song/song.wav` and use it in step 3 of SKILL.md.

The example song: `examples/one-prompt/LYRICS.md` and `examples/one-prompt/gen_song_original.py` (the exact caption
and lyrics of "ONE PROMPT", seed 53, 165 s, 100 BPM).
