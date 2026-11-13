# Bryan's cloned voice (VoiceStudio)

For a line Bryan didn't record, or a recording that cuts off, generate it in his own voice. First used on the 80/20
strategy video (2026-11-12): the take stopped on "make sure", and the cloned voice finished the call to action
pointing to his $500K video.

Bryan asked for this and chose to keep his voice files in this repo (`assets/voice/`) knowing it is public
(2026-11-13). Never use his voice for anything he didn't ask for, and never make it say a number, result or claim he
didn't give (CLAUDE.md "Never invent").

## The two uses Bryan approved (2026-11-13)

1. **Fixing his edits:** a word or line that got cut off, or that he said wrong, in footage he recorded. Splice it in
   as in "Making a line" below, covered by a graphic.
2. **Animated story reels:** the voiceover for a cartoon story reel, acted out by the faceless figure
   (`assets/boards/story/`, CLAUDE.md "Stories and scenarios"). Write the story in his voice
   (`engines/content-os/voice-dna.md`), get his OK on every word, generate it in short pieces (a sentence or two each,
   checked like any take), join them, then drop the joined voiceover into the studio: an audio-only drop ranks the
   faceless styles first.

Nothing else: no full talking-head videos voiced without him, and no lines he hasn't approved word for word.

## What's here

| File | What |
|---|---|
| `studio/voice.mjs` | `status`, `clone`, `speak` (several takes per line) |
| `assets/voice/bryan-ref.wav` + `.txt` | 9.75 s clean reference from the 80/20 recording, and its exact words |
| `assets/voice/cta-500k-video.wav` + `.words.json` | The CTA used on the 80/20 video, with word times |

## Setup (once per computer)

1. Install the Windows release from github.com/debpalash/VoiceStudio/releases (check it against `SHA256SUMS.txt`), per
   user: `VoiceStudio-<version>-win-x64.exe /S`. Needs ~10 GB on C: plus the model.
2. **Start it through Explorer, never from a Claude shell.** Programs started from the Claude desktop app run inside its
   Windows sandbox, which redirects AppData; VoiceStudio's `uv` then fails with "Missing expected target directory for
   Python minor version link". `node studio/voice.mjs status` prints the command.
3. Bryan answers the first-run screen (including the analytics question; that's his to answer).
4. Install the model and engine (both ask before downloading):
   `voicestudio --url http://127.0.0.1:3900 models install openbmb/VoxCPM2 --accept-license` (4.6 GB) and
   `voicestudio --url http://127.0.0.1:3900 engines install --type tts voxcpm2` (needs 15 GB free while installing).
5. `node studio/voice.mjs clone assets/voice/bryan-ref.wav --text "$(cat assets/voice/bryan-ref.txt)"`

**Model: VoxCPM2 (Apache-2.0).** Not OmniVoice, VoiceStudio's default: its weights are CC-BY-NC (non-commercial) and
Bryan's videos are marketing for his business. GPT-SoVITS (MIT) is the fallback.

## Making a line

1. Write the line in Bryan's words, and get his OK on the exact wording before generating.
2. `node studio/voice.mjs speak "<line>" -o projects/<id>/voice/line.wav --takes 3` (the first call after loading can
   fail while the engine warms up; the tool retries once).
3. **Checking a take** (Claude can't hear it, so check by numbers, then Bryan listens):
   - transcribe it (whisperx venv, as in the rough cut) and confirm every word;
   - compare median pitch to the reference with librosa `pyin` (`UV_LINK_MODE=copy uv run --no-project --with librosa`):
     his reference is 135 Hz (range 112-175), pace 2.67 words/s. Pick the closest take (the 80/20 CTA: 132 Hz, 111-186).
4. Splice: cut his real audio in a natural pause (40 ms fade), match loudness to his voice just before
   (`ebur128`; the 80/20 CTA needed -1.2 dB to land at -18.9 LUFS), and lay a loop of his room tone from that pause
   under the cloned line so it doesn't sound too clean.
5. Cover the cloned part with a full-frame graphic (the end card): there's no picture of him saying it, so no lip sync.
   Time its animation to the take's word times.

## The 80/20 CTA, for reference

Real audio cut at 9:26.62, after "referrals,". Cloned line: "Make sure you watch this video next, where I break down how
to grow your contracting business to $500,000 a year." (seed 42). The end card brings the Watch next slot to the centre,
drops in a frame of the $500K video, and animates its real title in with $500,000/Year in gold
(`projects/202611110508-80-20-strategy/hf-graphics/batch8.py`, v45).
