# Make the idea visible

Start with what the speaker means, then decide what the viewer should see. The visual should answer a question the sentence creates: what changes, what causes what, where something belongs, what to do next, or what the viewer should notice. A label decorating the top half is not automatically an explanation.

The verified reference observations live in `research/REFERENCE_RESEARCH.md`, `research/VARIETY_REVIEW.md`, and `corpus/`. They support principles such as a presenter paired with explanatory visuals, short captions near the split, full-height takeovers, and changes in visual medium and material within a reel. Exact ratios, motion speeds, and palettes in our editor are independent design decisions unless an annotation explicitly records them as observations.

## Understand before compressing

Identify the audience, promise, useful claim, evidence, necessary context, and natural endpoint. Choose a hook that is actually supported by the recording. A strong complete thought usually beats an unexplained dramatic fragment. Do not turn a conditional claim into a certainty or splice two statements into a new claim.

For raw recordings, locate retakes, false starts, repeated ideas, transitions, and breaths. Keep the best coherent take. Preserve pauses that carry emotion or allow comprehension. For already-cut recordings, study the existing rhythm before recutting. If the source is a demonstration, the action can carry the story without constant presenter visibility. If there is no speech, do not fabricate captions or narration.

## Choose the visual relationship

| Speech function | Useful visual idea | Avoid |
| --- | --- | --- |
| A mechanism or causal explanation | Objects change state; one event travels to a consequence | Unlabeled arrows that imply unsupported causality |
| A procedure | Steps unfold in the spoken order; current action stays prominent | Showing all steps at once while the speaker explains step one |
| A comparison | Comparable items align on the same dimensions | Invented scores, unequal axes, or implied product claims |
| A spatial or physical process | Original labeled SVG model, route, cutaway, or object arrangement | Generic dashboard imagery for a physical explanation |
| A software demonstration | User-supplied UI, clear crops, focus highlights, an honest schematic | Fabricated screens presented as real results |
| A misconception | An assumption is replaced by the supported explanation | A provocative headline stronger than the source |
| Personal experience or emotion | Presenter-led framing, restraint, a concrete symbolic detail | Busy explanatory machinery over a vulnerable moment |
| Quantitative evidence | Simple chart using real values, units, and context | Decorative bars that look like measured performance |
| Abstract advice | A specific example or relationship, then the concise takeaway | A stream of nouns, icons, and arrows with no explanatory purpose |

These are editorial choices, not a keyword classifier. A cooking clip could show heat moving through a pan; a language lesson could expose the structure of a sentence; a business clip could show where a handoff fails. Create the relevant model instead of changing the labels on one universal diagram.

## Compose for a phone

Use the [visual direction](STYLE.md) to choose a medium and composition for the current idea. A real product crop, photographic detail with an overlay, tactile object, animated mechanism, expressive typographic scene, or gallery can each carry a different explanation. White/black/yellow is one option; no palette or card arrangement is required throughout the edit. Context-specific official logos, real product imagery, and actual interface screenshots can carry the explanation. Record their source URLs in job files instead of adding sourcing subtitles or disclaimer footers to the video.

Use a clear hierarchy: one dominant visual subject, its short label, then optional context. Prefer a few large elements over a dense infographic. Leave enough clearance for captions and platform controls. Check the rendered result at phone size, including the longest label. Do not shrink typography until everything fits; edit the copy or redesign the layout.

Use the split layout when face and explanation strengthen each other. Use speaker layout when expression or trust matters. Use graphic layout when an object, comparison, or interface needs the space. Layout changes should correspond to changes in the idea. Do not cut to a new layout on a fixed timer.

Frame the presenter deliberately: eyes and mouth remain visible, gestures are not cropped carelessly, and the seam does not cut through an important object. A single source can contain screen share, multiple people, or a moving subject; inspect the actual footage rather than assuming a centered talking head.

## Animate meaning

Animate the relevant property: a process progresses, a container fills, a relationship connects, a mistake is corrected, or an object moves to its destination. Reveal at the corresponding spoken moment, allow time to understand, and then transition. A useful scene can hold still. Motion is not a quota.

Keep the narrative, caption system, and transitions coherent while allowing medium, material, line work, typography, and palette to change within a video. A paper object can fold, an interface can zoom, a physical process can trace, and display type can assemble; each moves according to what it is explaining. Do not impose the same corner radius, entry direction, or card shell on every subject. Avoid constant floating, repeated bounce on every word, excessive particle effects, and text movement that competes with captions.

Remotion is the executable renderer in this version. Built-in scene types are compositional primitives. For a distinct concept, author a deterministic React/SVG component in `src/custom/` and add it to `src/custom/registry.tsx`. New components must respect the existing timing and sizing contract, be legible in each used layout, and pass the same render review. Hyperframes or other engines are not bundled integrations; do not claim that they are.

## Captions and sound

Use captions for the actual speech and headlines for editorial emphasis. Keep those roles visually distinct. Prefer short readable phrases; use word emphasis only with genuine word timing. Confirm unusual names and technical terms. Caption timing must follow the edited audio, not the uncut source.

Keep source speech intelligible and synchronized. Listen at every cut for clipped syllables, abrupt background noise, and missing breaths. Music and sound effects are optional, require an available authorized asset, and should not mask speech. Silence can be the right decision.

## Vary with intention

Read recent entries in `corpus/edit-history.jsonl` before choosing a direction. Repeating a successful brand system is fine; repeating the same hook, scene order, and motion regardless of content is not. Change the relationship, visual metaphor, scene density, or narrative approach when the topic calls for it. Record why a choice worked and incorporate explicit user feedback on later edits.

Before coding, write each beat's visual purpose, medium, material, dominant object, layout, and reveal action in the job brief. Review the storyboard with the text mentally removed: if every scene is still the same cards, badges, or arrows, redesign the construction. Changing color or copy alone does not create meaningful variety. Keep a treatment across connected beats when it helps the viewer follow a transformation; change it when a new idea benefits from a different form. Variety is a reasoned choice, not a preset rotation or a quota.

An editor can target clarity, accuracy, and watchability. It cannot promise virality or infer retention improvements from a rendered file alone. Add performance evidence only when the user supplies actual results.
