# Visual direction

Choose the visual treatment from the idea, the subject's real assets, and the user's current brief. The latest feedback calls for a broad range of media, materials, and formats, including changes within one video. White, black, and yellow are one available treatment, not a compulsory palette or the default for every scene. Do not replace that constraint with a fixed pastel palette.

The observed reference range is recorded in [the initial research](../research/REFERENCE_RESEARCH.md) and [the variety review](../research/VARIETY_REVIEW.md). Those records distinguish observed frames from our design interpretations. They are a small sample, not a complete analysis of the creator's work.

## Design the scene before choosing its colors

For every beat, decide what the viewer needs to see, then select a medium, dominant object, composition, material, typography, and reveal action. Do not begin with the same card shell and replace its labels. Use the subject's physical or logical relationships: a lens inspects words; an asset moves into a workflow; a crowd reacts; a marked-up page becomes a revision; a gallery shows a body of work.

| When the idea benefits from it | Possible construction | What makes it distinct |
| --- | --- | --- |
| Showing a real product or result | Official screenshot, local screen recording, or product photograph with a focused crop | The authentic asset is the subject, with framing and highlights guiding attention |
| Explaining something physical or tactile | Original paper, cutout, object, model, or textured diagram | Depth, occlusion, scale, and the object's own movement communicate the action |
| Connecting a real action to an abstract concept | Relevant footage or photography with programmed vectors, paths, or annotations | The graphic interacts with what is visible in the image |
| Making one concept or contrast memorable | Large typographic composition, possibly contrasting type styles or expressive light/material | Type becomes the scene; it is not a small headline above another card row |
| Showing variety, selection, or a portfolio | Asset gallery, contact sheet, collage, filmstrip, or one featured object emerging from many | The arrangement and selection communicate a relationship |
| Showing a mechanism, sequence, or transformation | Topic-specific diagram or evolving object state | The action explains cause, order, inspection, or change |
| Delivering emotion, trust, or a direct invitation | Deliberate presenter framing with restrained emphasis | The human performance carries the moment |

These are options, not a checklist or fixed rotation. Retain a treatment across connected beats when it helps the viewer follow a transformation. Change the construction when a different idea needs another form. Recoloring the same cards, icons, or avatar rows is not meaningful variety.

## Continuity and phone readability

- Keep captions, narrative progression, and transitions easy to follow while allowing imagery, material, color, and display type to change. Consistency does not require identical surfaces, grids, corner radii, or line work across the video.
- Use the graphic-above/presenter-below split when both contribute. Give a detailed demonstration, object, or typographic scene the full frame when it needs space. Use speaker-led framing when the performance is the focus.
- Give each scene one dominant subject or related group. Make it large enough to recognize on a phone. Check longest labels, captions, platform safe areas, and the speaker's face in rendered frames.
- Use a strong type hierarchy. Display typography may vary with the scene; speech captions stay faithful, brief, and readable. Avoid repeated tiny eyebrow labels, gray explanatory subtitles, and redundant footer sentences.
- Choose contrast for the actual surface. For a white/black/yellow scene, use black type on yellow; avoid white type on yellow and small yellow type on white. Apply equivalent contrast checks to every other treatment.
- Keep real photographs, logos, and screenshots in their original colors. Surrounding design can respond to that material without forcing it into a universal palette.
- Review the storyboard with the words mentally removed. If successive beats still look like the same composition, change the visual construction where the meaning supports it. Do not add decorative variety that obscures the explanation.

## No on-screen provenance boilerplate

Do not add “illustrative model,” “illustrative inputs,” “possible reactions · illustrative simulation,” source URL footers, license labels, sourcing subtitles, or small text explaining whether something is real. Source verification and asset provenance belong in job notes and an asset manifest. This does not authorize fabricated measurements, invented quotes, or edited screenshots that imply a result the source does not show. Explain concepts using qualitative visuals when measurements are unavailable.

## Real assets from the topic

When the speaker names a product, company, repository, or platform, actively look for relevant official assets. A GitHub segment can use the genuine GitHub mark and a real repo or app screenshot. A product segment can use an actual product image. Choose material that makes the spoken idea easier to understand; do not add unrelated logos as decoration.

1. Prefer the official site, repository README, documentation, or brand asset kit. Confirm the asset belongs to the correct entity.
2. Download useful images to `public/assets/<topic>/`; renders must not depend on remote fetching.
3. Inspect every downloaded image. Crop for phone readability without altering what the screen claims. Animate focus, framing, scale, and relevant highlights around the asset.
4. Record original URLs, the page that identifies the asset, retrieval date, and any relevant usage terms in `jobs/<slug>/assets.md` or equivalent off-screen notes. Keep license notices in the project when distributing third-party assets.
5. If no useful real screenshot can be obtained, create a clearly designed explanatory graphic. Do not fabricate a realistic product screen or pretend a schematic was captured from the product.

Motion stays programmatic and deterministic: React, SVG, local images, and frame-based timing. No AI video generation. Author original scenes; do not copy the reference creator's designs or redistribute their media.
