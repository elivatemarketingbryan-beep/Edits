# Logo library

Square, trimmed, transparent PNGs. The `icon-stack` effect finds them by name: naming
"Claude" in `--text` uses `claude.png` (lower case, spaces become dashes). Names with no
logo here fall back to a letter tile.

| File | What | Notes |
|---|---|---|
| `meta.png` | Meta infinity mark | |
| `meta-wordmark.png` | Meta mark with the "Meta" wordmark | Dark text: light backgrounds only |
| `claude.png` | Claude spark | |
| `instagram.png` | Instagram app icon | Full-colour square, keeps its own background |

Missing: **Facebook**. The supplied file was a VectorStock preview with a watermark, so
it wasn't used. Meta's brand resource site has the official Facebook logo for free.

## Adding a logo

```
uv run --no-project --with pillow python -I studio/logos.py assets/logos <name>=<file>[:key-white][:top=0.66]
```

`key-white` turns a white background transparent (don't use it on logos with white
inside a coloured shape, like Instagram). `top=0.66` keeps only the top part, for a mark
that sits above its wordmark. Use official logos from each brand's press or brand page,
not watermarked stock previews.
