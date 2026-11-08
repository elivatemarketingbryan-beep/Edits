# Install

The zip unpacks to one folder, `sfx-library`. Python 3 is all the helper needs; it ships with macOS.

## Option A: Claude Code (easiest)

Unzip the folder into your skills folder so its path is `~/.claude/skills/sfx-library/`. That's it: the folder contains a `SKILL.md`, so Claude Code loads it whenever an edit needs sound effects.

```bash
unzip SFX-Library-*.zip -d ~/.claude/skills/
python3 ~/.claude/skills/sfx-library/sfx.py find --moment cut --n 3
```

## Option B: any other AI video editor

Unzip it anywhere permanent, for example `~/AI-Employees/sfx-library`. Call that path `<SFX>`. Paste this into the editor's instructions (its `CLAUDE.md`, `AGENTS.md`, project instructions or system prompt), with `<SFX>` replaced by the real path:

```markdown
## Sound effects
- Use only the SFX library at <SFX>. Read <SFX>/AGENT_GUIDE.md once before adding sound effects.
- Find sounds with `python3 <SFX>/sfx.py find --moment <moment> --seed <video-name> --history <project>/sfx-history.json`. Run `python3 <SFX>/sfx.py moments` to list the moments.
- Place each sound with `python3 <SFX>/sfx.py place <ID> --at <seconds>` and apply the start time, clip gain and high-pass it prints. Record what you used with `python3 <SFX>/sfx.py record <ID> ... --history <project>/sfx-history.json`.
- Never synthesize sound effects or download them from the web. If a moment has no match, leave it silent.
- Credit-required sounds are off by default. Only pass --allow-credit if I have said credits are fine; then put the output of `python3 <SFX>/sfx.py credits <IDs>` in the post caption.
```

## Placing files on the timeline

`sfx.py place` gives the start time in seconds, how much to trim from the front if the start would fall before 0, the clip gain in dB, and a high-pass frequency.
- **Remotion**: `<Sequence from={Math.round(start * fps)}><Audio src={staticFile(path)} startFrom={Math.round(trim * fps)} volume={Math.pow(10, gainDb / 20)} /></Sequence>`. Copy the WAVs you use into the project's `public/` folder.
- **ffmpeg**: `-i sound.wav` with `atrim=start=<trim>,adelay=<start_ms>|<start_ms>,volume=<gain>dB,highpass=f=<hpf>` and then `amix` with the voice and music.
- **Premiere, DaVinci Resolve, CapCut**: drag the WAV to the timeline at the start time and set the clip gain. Use `audition.html` to browse by ear.

## Listen

Open `audition.html` in Chrome or Safari to browse and play everything. Flag sounds you dislike and press "Copy flagged IDs" to report them.

## Updates

Replace the whole folder with a new version. IDs never change between versions, so saved projects keep working. See `CHANGELOG.md`.
