# Local creative history

Append one JSON object per completed edit to `corpus/edit-history.jsonl`. The agent maintains this file; rendering alone does not demonstrate that feedback or audience performance exists. Use `null` for unknowns. Avoid including private transcript text unnecessarily.

```json
{"job":"example-only","completedAt":"2026-10-07T12:00:00Z","topic":"example topic","audience":"beginners","promise":"the useful idea","durationSeconds":35,"opening":"concrete problem","visualConcepts":["state change","aligned comparison"],"layouts":["speaker","split","graphic"],"palette":["#101820","#DDF25C"],"customComponents":["ExampleComponent"],"review":{"technical":true,"storyboard":true,"videoPlayback":false,"audioPlayback":false},"feedback":null,"performance":null,"nextTime":"leave the final comparison visible longer"}
```

This entry is illustrative; do not append it as a completed job. Read the last few real entries to avoid accidental repetition. User feedback is evidence of a preference. An editor's own judgment should be labeled as such. Views, retention, and conversion belong in `performance` only when supplied or verified; record their date, platform, and source.

Each member's history belongs with their working copy. Do not distribute personal history with the reusable community kit.
