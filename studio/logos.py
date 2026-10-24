# Cleans logos into square, trimmed, transparent PNGs for assets/logos/<name>.png, which
# the icon-stack effect picks up by name.
#
#   uv run --no-project --with pillow python -I studio/logos.py assets/logos \
#       claude=path/to/claude.png:key-white  meta=path/to/meta.jpg:key-white:top=0.66
#
# Options after the file, separated by ":":
#   key-white   make a near-white background transparent (skip for logos that contain
#               white inside a coloured shape, like Instagram's)
#   top=0.66    keep only the top part, e.g. a mark that sits above its wordmark
import sys
from PIL import Image

out = sys.argv[1]
for arg in sys.argv[2:]:
    name, spec = arg.split("=", 1)
    path, *opts = spec.split(":")
    if len(path) == 1 and opts:  # a Windows drive letter ("C:/...") was split off
        path, opts = path + ":" + opts[0], opts[1:]
    im = Image.open(path).convert("RGBA")
    for o in opts:
        if o.startswith("top="):
            im = im.crop((0, 0, im.width, int(im.height * float(o[4:]))))
    if "key-white" in opts:
        px = im.load()
        for y in range(im.height):
            for x in range(im.width):
                r, g, b, a = px[x, y]
                m = min(r, g, b)
                if m > 235:
                    px[x, y] = (r, g, b, 0)
                elif m > 200:  # soft edge so anti-aliased outlines don't leave a white fringe
                    px[x, y] = (r, g, b, int(a * (235 - m) / 35))
    box = im.getbbox()
    if box:
        im = im.crop(box)
    side = int(max(im.size) * 1.06)
    sq = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    sq.paste(im, ((side - im.width) // 2, (side - im.height) // 2), im)
    if side > 512:
        sq = sq.resize((512, 512), Image.LANCZOS)
    sq.save(f"{out}/{name}.png")
    print(f"{name}.png {sq.size[0]}x{sq.size[1]}")
