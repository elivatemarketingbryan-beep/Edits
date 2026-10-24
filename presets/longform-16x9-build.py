#!/usr/bin/env python3
"""
presets/longform-16x9-build.py — build the locked 16:9 preset.

Keep the values below in sync with longform-16x9.md by hand. Writes:
  presets/build/longform-16x9/theme.css
"""
from __future__ import annotations

from pathlib import Path

OUT_DIR = Path(__file__).resolve().parent / "build" / "longform-16x9"

WIDTH, HEIGHT = 1920, 1080

PALETTE = {
    "--bg": "#101013",
    "--fg": "#f0f0ee",
    "--accent": "#3fa9ff",
    "--muted": "#7d7d86",
}

MOTION = {
    "--ease-in": "cubic-bezier(.16,1,.3,1)",
    "--ease-out": "cubic-bezier(.7,0,.84,0)",
    "--dur-in": "280ms",
    "--dur-out": "200ms",
}


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    lines = [":root {"]
    for k, v in {**PALETTE, **MOTION}.items():
        lines.append(f"  {k}: {v};")
    lines += [
        f"  --canvas-width: {WIDTH}px;",
        f"  --canvas-height: {HEIGHT}px;",
        "  --font-display: 'Inter', sans-serif;",
        "  --weight-display: 700;",
        "  --weight-body: 500;",
        "  --lower-third-min-hold: 2.5s;",
        "}",
        "",
    ]
    (OUT_DIR / "theme.css").write_text("\n".join(lines), encoding="utf-8")
    print(f"[longform-16x9-build] wrote {OUT_DIR}/theme.css")


if __name__ == "__main__":
    main()
