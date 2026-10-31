# sfx/

Empty on purpose. `bash scripts/doctor.sh --fix` (or `scripts/py scripts/synth-sfx.py`) fills it
with a royalty-free palette synthesised in code: swell, riser, camera-shutter, futuristic-click,
pop, click, whoosh, keyboard, magic-reveal.

To use your own pack instead, name the files the same way (swell.wav, riser.mp3, ...) and
`export SFX_DIR=/path/to/your/pack` — mix-sfx.sh looks there first.
