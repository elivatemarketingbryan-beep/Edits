# -*- coding: utf-8 -*-
"""spec.py — the beat list for THIS video. build.py turns it into segments.

Times are absolute seconds on assets/transcript-tight.json (the ONLY timing
source after the tighten pass). One beat = one layout + what the screen share
plays during it.

Layout targets (measured off the reference demo edit; build.py prints yours):
    FULL 14-18%  ·  HALF 36-42%  ·  CORNER (demo) 32-38%  ·  PAGE + no-cam ~10%
    a layout change every 7-9s · the camera card swaps sides (camera_side "swap")
    about 40% of graphics time something moves: cursor, typing, a menu, a scroll

  cam = "FULL" | "HALF" | "CORNER"   (HALF_L / HALF_R / CORNER_L / CORNER_R force a side)

Start a camera move ~0.3s BEFORE the phrase it belongs to: transcription often
reports 0.000s gaps, and a travel that starts on the onset eats the caption.
"""
from devices import panel

# One composition per chapter. Split on a clean FULL beat (a travel cannot
# cross a segment boundary), on whole frames: t = frame / 30.
SEGMENTS = [
    {"name": "seg-01-intro", "t0": 0.00, "t1": 30.00},
]

HALF = dict()                                    # the 1184 x 740 UI card
DEMO = dict(box_w=1480, box_h=740)               # the corner layout: big UI
PAGE = dict(box_w=1800, box_h=740)               # a full page running under the card


def B(t0, t1, cam, make=None, **kw):
    d = {"t0": t0, "t1": t1, "cam": cam, "make": make}
    d.update(kw)
    return d


def demo(src, label=None, **box):
    """A played screen share (demos/make_demos.py -> assets/broll/<name>.mp4)
    or a real recording / capture, placed as a card."""
    return lambda u, c: panel(u, src, label, ctx=c, loop=False, **box)


# EXAMPLE — replace every beat with this video's own. Each line should say
# which words it covers and what the screen plays.
BEATS = [
 # "Today I'm going to show you..."                      -> breather, face
 B( 0.00,  4.80, "FULL"),
 # "first, open the app and type..."                     -> played share, half
 B( 4.80, 13.50, "HALF",   demo("d1-open.mp4", **HALF)),
 # "and here's what comes back..."                       -> same demo, bigger
 B(13.50, 22.00, "CORNER", demo("d1-open.mp4", **DEMO), media_start=8.70),
 # "so the takeaway is..."                               -> face
 B(22.00, 30.00, "FULL"),
]
