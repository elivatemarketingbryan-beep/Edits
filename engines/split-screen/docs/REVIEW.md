# Review the video, not only the code

Automated validation checks structure and technical output. Render QA checks dimensions, frame count, fps, duration, codec, and required audio presence; when audio exists, it also reports peak and mean levels. These checks cannot prove that captions match speech, the edit preserves meaning, music is balanced, or the graphics are pleasant to watch. Record the checks actually performed in `jobs/<slug>/review.md`.

## Before the draft

Check selected source spans against the transcript. Check that charts, quotes, and diagrams have factual support. Inspect storyboard frames at the start, every scene change, peak animation, longest label, and ending. Look for missing assets, clipped text, awkward crops, and caption collisions. A contact sheet samples moments; it does not prove motion continuity.

## Watch and listen

Play the draft from beginning to end when a playback surface is available. Then inspect the parts most likely to fail:

- First two seconds: is the promise understandable without a long setup?
- Every source cut: are speech and lips aligned, and are consonants or breaths clipped?
- Every caption change: is the wording faithful and displayed when spoken?
- Every explanation: does the graphic make the particular idea clearer?
- Every layout change: does it support the story and keep the presenter framed well?
- Longest labels and densest frames: can a phone viewer read them comfortably?
- Ending: does the thought finish, and is the last frame intentional?

If the environment cannot play audio or video, inspect available rendered frames and technical data, state the exact review limitation, and provide the draft for human playback. Never describe a storyboard inspection as a full audiovisual review.

## Fix and deliver

Treat incorrect claims, missing source audio, bad caption timing, unreadable text, and broken assets as blockers for an unqualified final. Fix those before polishing cosmetic details. After changes, rerender and recheck affected spans; changing cuts also requires remapping captions and reviewing downstream timing.

A finished delivery includes the real MP4 path, plan path, the generated technical QA report, and brief editorial review notes. Keep any remaining limitations explicit. Append actual decisions and feedback to local history. Do not report performance predictions as measured results.

## Review note template

```text
Job:
Source and transcript:
Draft reviewed:
Checks completed: [technical validation / storyboard / picture playback / audio playback]
Meaning and factual support:
Caption accuracy and timing:
Framing, readability, motion:
Issues found and corrections:
Final output:
Remaining limitations:
```
