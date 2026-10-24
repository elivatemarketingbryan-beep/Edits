#!/usr/bin/env python3
"""
presets/shortform-9x16-build.py — build the locked 9:16 preset.

Keep the values below in sync with shortform-9x16.md by hand (this is a
locked look spec, not a templating engine — a human decides the look,
this script just materializes it). Writes:
  presets/build/shortform-9x16/theme.css
  presets/build/shortform-9x16/safe-zone-overlay.png
"""
from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageDraw

OUT_DIR = Path(__file__).resolve().parent / "build" / "shortform-9x16"

WIDTH, HEIGHT = 1080, 1920
SAFE_TOP, SAFE_BOTTOM = 200, 300  # excluded band heights, px

PALETTE = {
    "--bg": "#0b0b0f",
    "--fg": "#f5f5f2",
    "--accent": "#ff5a36",
    "--muted": "#9a9aa2",
}

MOTION = {
    "--ease-in": "cubic-bezier(.16,1,.3,1)",
    "--ease-out": "cubic-bezier(.7,0,.84,0)",
    "--dur-in": "220ms",
    "--dur-out": "160ms",
}


def write_theme_css() -> None:
    lines = [":root {"]
    for k, v in {**PALETTE, **MOTION}.items():
        lines.append(f"  {k}: {v};")
    lines += [
        f"  --canvas-width: {WIDTH}px;",
        f"  --canvas-height: {HEIGHT}px;",
        f"  --safe-top: {SAFE_TOP}px;",
        f"  --safe-bottom: {SAFE_BOTTOM}px;",
        "  --font-display: 'Inter', sans-serif;",
        "  --weight-display: 800;",
        "  --weight-body: 600;",
        "}",
        "",
    ]
    (OUT_DIR / "theme.css").write_text("\n".join(lines), encoding="utf-8")


def write_safe_zone_overlay() -> None:
    """A transparent PNG with the excluded top/bottom bands tinted red —
    drop it as a top layer while building parts, never ship it."""
    img = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    tint = (255, 0, 64, 70)
    draw.rectangle([0, 0, WIDTH, SAFE_TOP], fill=tint)
    draw.rectangle([0, HEIGHT - SAFE_BOTTOM, WIDTH, HEIGHT], fill=tint)
    line_color = (255, 0, 64, 200)
    draw.line([0, SAFE_TOP, WIDTH, SAFE_TOP], fill=line_color, width=2)
    draw.line([0, HEIGHT - SAFE_BOTTOM, WIDTH, HEIGHT - SAFE_BOTTOM], fill=line_color, width=2)
    img.save(OUT_DIR / "safe-zone-overlay.png")


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    write_theme_css()
    write_safe_zone_overlay()
    print(f"[shortform-9x16-build] wrote {OUT_DIR}/theme.css")
    print(f"[shortform-9x16-build] wrote {OUT_DIR}/safe-zone-overlay.png (QA reference — never ship it)")


if __name__ == "__main__":
    main()
