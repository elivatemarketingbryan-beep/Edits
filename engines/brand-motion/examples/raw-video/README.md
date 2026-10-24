# Raw video example (mode C)

A 13 s talking-head clip for a cafe loyalty app ("Loopback"), with a hook overlay, word-by-word captions,
punch-in zooms, sticker callouts, two full-screen inserts (kinetic words, a stat), a comment CTA and a logo resolve.

Files: `brand.json`, `story.json`, `words.json` (transcript with word timings from `voice.py transcribe`, two misheard words corrected),
`logo.svg` (run `logo.py logo.svg logo` first). The clip itself (`raw_talking.mp4`) is not included: point `base.video` at any vertical clip
and re-time the scenes to its transcript.
