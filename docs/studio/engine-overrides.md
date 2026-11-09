<!-- Part of the Video Studio manual. Index: CLAUDE.md -->

## Rules that override the engines

1. **One instruction file.** This file, then the engine docs. engines/legacy-editor's
   CLAUDE.md is reference only; its pipeline is replaced by the root pipeline.
   Content OS's onboarding gate does not apply inside Video Studio; run its
   `setup.sh` only the first time a content tool is used.
2. **Transcribe once per job**, in `projects/<id>/transcript/words.json` (root
   pipeline rule). Everything reads that: the
   review page reads `jobs/<id>/transcript.json`, content-os reads it instead of
   transcribing again. The rtf skill is only for links and clip-ranking, not a second
   transcript of the same file.
3. **Look:** when a style is chosen, `STYLE-GUIDE.md` + `brand.json` set the palette
   and type. The split-screen docs' rule "vary palettes" is narrowed to: vary the *kind* of
   visual per beat (diagram, demo, chart, type), never the palette.
4. **Where work lives:** the user's dropped file and deliverables in `jobs/<id>/`;
   editing work in `projects/<id>/`. Never edit or move the dropped source.
5. **Default finish:** a chosen style ends in a rendered MP4 via preview → review →
   final. The editing-app handoff (.fcpxml, no render) is the `rough-cut-only` tool,
   not the default.
6. **Brand:** if `brand.json` `set` is false, before the first edit ask the user for
   accent colour, fonts and handle, one question at a time (or read
   brand-kit.md in the Content OS folder if it's filled in), write them, set `set: true`.
7. **Platform:** this is Windows with Git Bash. Python is `python` (not `python3`). The
   root pipeline was written for macOS/WSL2 but built and unit-tested on Windows Git
   Bash; treat the first real job as the integration test and add what you learn to
   the lab notes in docs/editor-pipeline.md.
8. Safe zones and every lab note in docs/editor-pipeline.md still apply.
