# ONE PROMPT — music video from code (Claude Code skill)

Make a full music video where every pixel is drawn in code — no AI images, no AI video, no paid APIs — and,
if you want, make the song itself for $0 on your own computer.

- A living-cursor mascot (CURSOR) dances on the beat and lip-syncs the vocal (vowel shapes measured from the song).
- Every shot literally illustrates the lyric being sung, and every shot uses a different technique: 3D type, shaders,
  particles, rigid-body + cloth physics, fluid simulation, reaction-diffusion, Fourier epicycles, voxels, ASCII…
- Sound effects are synthesised from math and layered under the song (optional).
- Renders a frame-exact 1080p30 MP4 with headless Chrome. A 2:45 video renders in ~7 minutes on an M-series Mac.
- Example inside: the real "ONE PROMPT — LOCAL CUT" (88 shots) — `examples/one-prompt/`.

Needs: Claude Code, Node.js 22+, ffmpeg, Google Chrome, Python (Claude installs what's missing, free).
$0 songs need Apple Silicon (16 GB+) or an NVIDIA GPU (6 GB+) and ~15 GB of disk (ACE-Step 1.5, open source).

Install: paste the INSTALL PROMPT into Claude Code. Then just ask: "make a music video for my song ~/Downloads/x.mp3"
or "write me a song about my coffee shop and make the music video, $0".

Folders: `SKILL.md` (what Claude follows) · `engine/` (project template) · `scripts/` (setup, analysis, song, example)
· `references/` (intake, song, storyboard, builder rules, review) · `examples/one-prompt/` (the full example).
