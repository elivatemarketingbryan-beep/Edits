# Changelog

## 0.9.0-beta (2026-11-04)

First beta.

- 1548 sounds in the full edition: 302 core picks, 1157 extended, 89 cut-ready edits (1/2/4 s risers, short-tail booms, centred whooshes, typing bursts and single keystrokes).
- Sound IDs are permanent from this release on. Later versions only add new IDs; an ID never changes meaning.
- Every file: 48 kHz / 24-bit WAV, trimmed to its first transient, rumble-filtered, true peak -1 dBTP, with a measured sync point and a per-file clip gain.
- Loops are filtered circularly and crossfaded at the seam so they repeat without a click.
- Near-duplicates are linked (`duplicate_of`, `dry_wet_of`) so the editor never rotates onto the same audio.
- Credit lines meet CC BY 4.0 / OGA-BY 4.0 (title, creator, link, license and link, "edited").

Known gaps are listed in README.md.
