# A small, inspectable reference corpus

This corpus begins with **four directly inspected Instagram reels**, recorded on October 7, 2026. It is a visual observation sample: selected muted playback frames, not continuous audiovisual analysis or a downloaded library. The complete research notes are in [REFERENCE_RESEARCH.md](../research/REFERENCE_RESEARCH.md).

`index.json` points to each annotation. Each file records its source, inspection coverage, visible evidence, and the limits of that evidence. The schema distinguishes `observed` annotations from `illustrative` examples. Only observed annotations can support claims about the creator's work. No model was trained or fine-tuned on these materials.

## How the editor uses it

Retrieve examples by the **visual relationship** needed for the current speech: inspection, transformation, sequence, comparison, hierarchy, measurement, or demonstration. Transfer the explanatory principle to an original composition. Do not merely match a topic word, copy the source artwork, or force every video into the same palette and scene order.

The current evidence supports a recent grammar with upper explanatory graphics, a lower presenter, short captions near the seam, and full-height graphic takeovers. It also includes an older format that differs substantially. It does not establish average shot length, complete scripts, exact fonts, animation libraries, soundtrack design, or retention performance.

## Add better coverage

Use `prompts/ANNOTATE_REFERENCE.md`. Inspect a source you can actually access, save a new annotation, and add an entry to the index. Record actual inspected ranges or point observations. Keep unknown publication dates and timing fields `null`; do not infer them from reel IDs. For a richer corpus, review complete clips with sound and record beat boundaries and caption timing separately from screenshot observation points.

Package annotations and source links. Keep any privately supplied reference footage in a local folder excluded from distribution. Do not include third-party reels, extracted graphics, or audio in the member kit without appropriate permission. Access to a source and permission to redistribute it are separate questions.

`edit-history.jsonl` is reserved for the member's own completed edits. It starts empty. See [history format](../docs/HISTORY.md).
