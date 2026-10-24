# Release verification

Validated locally on October 7, 2026, using macOS Apple Silicon, Node 24.20.0, Remotion 4.0.534, and the pinned dependency lockfile.

## Executed checks

- TypeScript check passed.
- Eighteen Node tests passed: half-open cut boundaries, reordering/repetition, transcript remapping, real word timing, phrase-only subtitles, duration-based transcript exports, malformed data, missing/outside media paths, silent sources, optional soundtrack timing, and custom-canvas/backdrop validation.
- Doctor successfully executed the supplied FFmpeg/FFprobe binaries and found the renderer and local faster-whisper installation.
- The original 14-second demo rendered at 1080×1920, 30 fps, H.264, with exactly 420 frames and an audio track. Its quiet tone is deliberate test audio, not speech or a music bed.
- Source ingest and local Whisper transcription were tested using a known synthesized three-sentence voice fixture over original procedural footage. The normalized source was 241 frames.
- An integration edit kept source frames `[0,69)` and `[160,241)`, dropping the middle sentence. Captions mapped to the new five-second timeline. The 150-frame draft rendered at 540×960, 30 fps with audio.
- Re-transcribing that export recovered the expected first and final sentences and omitted the removed middle sentence. Export peak was −5.7 dBFS. This verifies the exercised cut/audio/caption pipeline; it is not a universal speech-recognition accuracy guarantee.
- Rendered contact sheets were visually inspected, including half-second samples through the demo animations and captioned integration export. A magnifier text-overlap issue was corrected before the packaged preview.
- The member ZIP was extracted into a new directory. A fresh `npm ci`, doctor, TypeScript check, all twelve tests, and demo-plan validation passed from that extracted copy. The archive integrity and all corpus index paths were checked; member uploads, jobs, render folders, dependencies, and edit history were absent.
- A nine-beat smoke storyboard exercised every built-in graphic type, including a four-node diagram, image asset, and full-screen source layout. All scenes rendered without runtime errors. Its artificial data was explicitly labeled illustrative. The source-only cover crop demonstrates why real footage needs a reviewed focal point or `contain` fit.

## What has not been established

This release has not been validated on Windows/Linux, every codec, HDR delivery, long raw sessions, multilingual speech, moving-speaker tracking, or a representative set of community members' videos. It does not perform automatic face tracking or automatic speech ducking. The transcription model's predictions still require source review.

The reference corpus contains five reels inspected through sampled muted playback frames, with a focused revisit of visual variety in `research/VARIETY_REVIEW.md`. It is not a complete audiovisual corpus or evidence of the creator's original tools. A supplied 38.37-second talking-head clip has since completed the real editing workflow with all 1,151 source frames retained, 158 captioned words, eight custom motion beats, and an exported MP4. Its decoded audio was checked against the source in four windows with zero measured lag. Private footage and job files are excluded from the community kit. This one edit does not establish quality across every topic or source format.

The latest direction in `STYLE.md` supersedes the intermediate fixed white/black/yellow treatment: scene meaning drives varied medium, material, composition, typography, and color. Custom canvas mode removes the inherited title/card/grid shell. The bundled original demo was regenerated with tactile paper, luminous technical, editorial steps, and botanical treatments: 14 seconds, 420 frames, 540×960 preview, and passing technical QA. Its four-beat contact sheet was inspected. The MiroFish scenes' official mark, two actual app screenshots, and product logo are bundled locally with source/license records; render-time image fetching is unnecessary.

The intermediate 65-file package was extracted into a fresh temporary directory. All manifest hashes and sizes matched; `npm ci`, all 17 tests then present, TypeScript, and the 420-frame demo plan validation passed. Required editorial assets, the MiroFish license, and style instructions were present. Jobs, private footage/transcripts, and renders were absent; distributed edit history was empty. This is a historical check of that package; later changes are verified separately.

The current 72-file package was independently extracted into another fresh directory. All manifest hashes and sizes matched; all required V3 source modules, four official visual assets, source/license records, and the varied-style guidance were present. Private footage/jobs/renders/transcripts were excluded and history was empty. Fresh `npm ci`, all 18 tests, TypeScript, and demo validation passed. A `MiroInputCollageV3` storyboard rendered from the extracted package with its own demo footage and locally bundled image assets; its actual upload-screen crop and paper objects were visually inspected. The previously downloaded browser was reused; no fresh browser download was needed. Only documentation changed after this executable-copy test.

Automated QA checks duration, dimensions, frame count, frame rate, codec, audio presence, and measured levels. It does not declare editorial quality or full audiovisual review. A member's final edit still requires the review described in REVIEW.md.
