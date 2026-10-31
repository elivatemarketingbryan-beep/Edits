# AI B-roll: generated clips for beats that have no footage

Adapted from the "Vox style" prompt pack (Oct 2026), rewritten for Video Studio. Use it when a beat
needs real camera depth that a HyperFrames graphic can't fake: a full-screen paper diorama, a camera
flying across a map, a job site that was never filmed. Everything a template can do (stats, cards,
stamps, charts) stays HyperFrames: it is free, exact, and editable. AI clips cost credits and drift.

## Where it fits in a job

1. The beat is already timed to the transcript (`cues.json` or the reel's words). Decide the clip
   length from the words under it: **4 s or 6 s only**.
2. Write the prompt (below). Put the key spoken moment into the shot with its time inside the clip
   when it matters ("at 3 s the pin drops on the city"); skip it for a short clip where nothing has
   to land on a word.
3. Generate: a still first (image model, with `styles/references/paper-collage-sheet.png` style
   reference if present, else the self-describing block), then the clip from that still.
4. Trim the first 0.25 s (models often start on a blend), keep the clip's own sound under the voice
   at a low volume (0.10-0.15), and place it in the HyperFrames composition as a torn photo or a
   full-frame cut. Log it in `edits.json` as `broll` with the prompt in `why`.
5. Show its still at the graphics approval step like any other graphic. Never render the edit
   with an AI clip the user hasn't seen.

## The prompt: four blocks, always in this order

**STYLE** (pasted the same every time for a given look) → **SHOT** (rewritten per clip) →
**AUDIO** → **AVOID**.

### STYLE: paper collage, brand version

> Documentary cut-paper collage. Aged archival paper surface with print grain and halftone texture.
> Black-and-white halftone cut-out figures and objects with rough white keylines and an offset purple
> (#8B5CF6) stroke behind each. Condensed headline caps and giant stat numbers. Palette: archival tan,
> ink black, halftone gray, one hot accent purple (#8B5CF6) for strokes, underlines, arrows and tags,
> light purple (#C4B5FD) used sparingly. Layers sit at distinct depths like a paper diorama with real
> parallax, never glossy 3D. Motion: spring pop-ups with overshoot, staggered entrances, ticking
> counters, underline swipes. One camera move per clip.

Pick the depth per shot:
- **Flat parallax** (a restrained data beat): add "slow, steady camera move; layers slide past each
  other at different speeds."
- **Deep diorama** (a big reveal): add "every cut-out is a physical layer in real space, shallow depth
  of field, foreground pieces pass close to the lens; the camera flies, orbits or dives between
  layers, with one committed move."
- **Alert wash** is a named beat: "the whole frame floods purple in one beat."

### SHOT: two to five sentences, in this order

1. **Background:** what it is, how far away, in or out of focus. Pick a different one per clip: torn
   ledger page, newspaper column wall, blueprint grid, faded street map of the service area,
   topographic map, index-card wall, invoice or estimate sheet, review screenshot wall.
2. **Foreground:** which pieces snap, slide or drop in, and at which depths: torn cards, a giant stat
   number, a halftone cut-out of a house or a crew truck, coin chips, map pins, a phone with stars.
3. **The action that connects them:** an arrow draws, a counter ticks, a pin drops, a stamp lands.
4. **Camera:** the ONE move and how focus racks.
5. **Settle:** where the frame ends (it should hold still for the last ~0.5 s).

Example (6 s): "Background: a faded street map of San Jose, far back and soft. Foreground: a halftone
cut-out of a finished concrete driveway slides in at mid depth; a torn purple tag reading 64 springs up
close to the lens at 2 s. A purple arrow draws from the driveway to the tag as five stars pop in one by
one. Camera pushes in slowly while focus racks from the map to the tag. Settle on the tag, centred."

### AUDIO

"Sound design only: paper pops, whooshes, stamps, ticks. No music. No voice-over." (The voice and
music come from the edit; the clip's own sound sits low under them.)

### AVOID

"No real people's faces or names, no logos or brand marks, no readable small text, no glossy 3D or
plastic look, no more than one camera move, no flat 2D slide."

## Rules

- **No real public figures, ever.** Don't generate real people, and never disguise one (masked eyes,
  distance, a name left out) to get past a model's filters. If a beat needs a real person, use a real
  photo with a caption and a source.
- **No invented proof.** A generated clip can illustrate a number Bryan says; it never shows a fake
  review, a fake client, a fake invoice or a fake result as if it were real.
- Brand colours from `styles/brand.json`, not the pack's red and mustard.

## Setup (only when AI B-roll is first used)

kie.ai hosts the image and video models (GPT Image 2 for stills; Gemini Omni Flash or Seedance 2.0
Fast for clips). Bryan pastes his own key into `Edits/.env` as `KIE_API_KEY=...` (gitignored); never
ask for it in chat. Read the model's page on kie.ai for the current request shape and prices before
the first call, and record what worked in this file.
