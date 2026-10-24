# The editable plan

The current TypeScript contract in `src/types.ts` and the CLI validator are authoritative. Start from the template produced by ingest; replace its placeholders using the actual source. Save the working plan as `jobs/<slug>/plan.json`.

## Two timelines

The ingested source is normalized to 30 fps. `edit.cuts` specifies retained source intervals, in output order. `startFrame` is inclusive and `endFrame` is exclusive. Each cut includes a human-readable `reason`. Never express cuts in original variable-frame-rate frame numbers.

The output duration is the sum of retained cut lengths. Beat `from`, beat `durationInFrames`, and all caption frames refer to that assembled output. Source time does not equal output time after a cut. Import the timed source transcript through the captions command after finalizing cuts, and reimport it whenever cuts change.

Example: retaining source frames `[300,600)` and `[900,1200)` creates a 600-frame output. Source frame 930 maps to output frame 330. This is an arithmetic illustration, not a suggested edit.

## Top-level fields

| Field | Meaning |
| --- | --- |
| `version` | Schema version, currently `1`. |
| `title` | Human-readable edit title. |
| `fps`, `width`, `height` | The validator requires 30 fps and a 1080×1920 canvas in this release. |
| `source` | Ingested media path, normalized frame count, dimensions, and actual `hasAudio`. Copy verified metadata from ingest. |
| `brand` | `name`, `accent`, `background`, `surface`, `text`, `muted`; choose per job for contrast and subject. |
| `edit.cuts` | Source intervals `{startFrame,endFrame,reason}` in the order they should play. |
| `beats` | Ordered, gap-free, nonoverlapping scenes from frame 0 through the exact output duration. |
| `captions` | Faithful speech cues on the output timeline. |
| `captionStyle` | Optional. `box` (default: phrase in a dark box, spoken word underlined) or `word` (one large outlined word at a time, on its real word timing; needs word-timed captions). |
| `audio` | Optional local music/effects, described below. Source speech is retained separately by the source cuts. |
| `notes` | Optional human-readable notes; do not substitute notes for required field values. |

## A beat

Each beat has `id`, `from`, `durationInFrames`, `layout`, `headline`, `visual`, and `rationale`. `rationale` explains how the visual helps this particular spoken idea. Optional fields are `kicker`, `splitRatio`, `focalPoint`, `mediaFit`, `colors`, `captionY`, `graphicMode`, and `backdrop`.

`layout` is `split`, `speaker`, or `graphic`. In split layout the graphic is above the presenter; `splitRatio` is the fraction occupied by the **top graphic**, normally `0.5`, with a supported range of `0.3` to `0.7`. Caption placement follows the composition. `focalPoint` uses normalized `{x,y}` coordinates from 0 to 1, with `{x:0.5,y:0.5}` centered. Adjust it after inspecting the actual crop.

`mediaFit` is `cover` (fills the available source area, may crop) or `contain` (shows the full source, may leave margins). Use `contain` when cropping would hide a screen demonstration or other necessary evidence. `colors` overrides selected brand fields for that beat. `captionY` optionally sets the caption's vertical center as a fraction of the full output height, from 0 to 1; inspect it against both the main graphic and the speaker's mouth.

Choose durations from speech and reading needs. Cover the output deliberately. Avoid scene changes in the middle of a visual explanation solely to add motion.

`graphicMode: "canvas"` gives a custom component the full graphic panel, with `width` and `height` equal to that panel's actual size. The framework does not impose a header, padding, brand footer, or background texture. The component owns its typography, visual hierarchy, background, and layout; `headline` remains useful plan metadata. This mode is for scenes whose composition cannot be expressed as the same headline-over-card layout. Keep the caption area clear. Only custom components support canvas mode.

The default `graphicMode: "framed"` retains the standard header/content frame. Its optional `backdrop` is `plain` (default), `grid`, or `soft`. A grid is a scene choice, not a universal style. `colors` can differ by beat; the top-level brand is a fallback, not a restriction on actual images or custom scene palettes.

## Visual payloads

The `visual` object includes `type` and the fields below. Use these as primitives and extend them with original components when needed.

| Type | Payload |
| --- | --- |
| `word` | `word?`, `subtext?` |
| `steps` | `items: (string \| {title,detail?})[]` |
| `comparison` | `left` and `right`, each `{title,items:string[]}` |
| `diagram` | `nodes: {id,label,x?,y?}[]`, `edges: {from,to,label?}[]`; optional node coordinates are normalized from 0 to 1. |
| `bars` | `items: {label,value}[]`, optional `max`, `unit`, `sourceLabel`; use supported real measurements. |
| `checklist` | `items: (string \| {text,checked?})[]` |
| `quote` | `text`, optional `attribution`; verify against source. |
| `image` | `src`, optional `alt`, `caption`; use available authorized assets. |
| `custom` | `component` matching a registry name, optional JSON `props`. |

## Original scenes

Read `src/custom/registry.tsx` for the registration pattern and `VisualProps` in `src/types.ts` for the runtime contract. A component receives the beat, brand, frame, fps, width, and height. Use those dimensions so the composition works in the chosen layout. Author a real explanation or topic-specific hero object, not an unrelated decorative animation.

The bundled original examples are registered as `IdeaLens` (`props.focus`, `props.context`), `GrowthCycle` (`props.label`), and `SignalFocus` (`props.label`). IdeaLens shows attention focusing on a detail; GrowthCycle is an explicitly illustrative botanical stage sequence; SignalFocus shows inputs converging on a useful idea. They demonstrate how to build custom scenes, not a required sequence for every video. Add new registered components for different concepts.

The first real footage test also added seven MiroFish-specific components in `src/custom/mirofish/`: an audience swarm, a forecast diagram, a repository card, simulation inputs, persona cards, a feedback loop, and a comment CTA. These are examples of authoring visuals around the actual spoken subject. Their MiroFish labels and illustrative scenarios should not be reused for unrelated footage without adaptation.

The later `*V3.tsx` examples use full canvas mode to demonstrate different constructions: a dimensional offer/crowd, expressive luminous type, actual product display, paper collage, portrait atlas, conversational replies, a marked-up page becoming a revision, and a typographic invitation. They are topic-specific examples, not an automatic scene rotation. Use the reference variety review and the new recording to author the appropriate visual language.

Animate from the supplied frame using deterministic calculations, Remotion interpolation, or springs. Resolve images and fonts as local project assets. Keep all render-time network fetching, wall-clock timers, and nondeterministic randomness out of the composition. Validate/typecheck and inspect rendered frames after adding a custom scene.

## Captions

Each caption has `{startFrame,endFrame,text}`. Optional `words` contains true timed words with the same fields on the output timeline. Captions must be ordered and nonoverlapping, with words inside their caption interval. Caption `text` must equal its joined word text; correct both when fixing a name or term. The import mapping groups real timed words into short cues, while SRT/VTT phrases retain phrase timing. Do not distribute a phrase duration evenly over words and present that as transcription timing.

Captions are spoken text. Beat headlines are editorial text. A paraphrased headline should never be inserted into captions as if the speaker said it.

## Optional music and effects

`audio.music` accepts `{src,volume}`. `audio.effects` is an array of `{src,atFrame,volume}`. Asset paths are relative to `public/`; effect `atFrame` uses the output timeline. Volume is a linear multiplier between 0 and 1, not decibels. The music layer loops with a short opening/closing fade; the renderer does not automatically detect speech and duck music around it. Choose a quiet level by listening and omit music when it reduces clarity. Use only available assets authorized for the output.
