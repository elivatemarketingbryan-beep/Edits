#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# check-screenshare.sh — the static render gate for nextphase-screenshare.
#
#   usage:  bash check-screenshare.sh <video-dir>
#
# Five classes of failure:
#   1 · KIT COPY   — placeholder strings from components/ surviving into a segment.
#   2 · BORROWED   — material lifted from a reference video you studied. It
#                    belongs to another creator; list its strings (their name,
#                    product, video id) one per line in <video-dir>/borrowed.txt.
#   3 · STYLE      — the mistakes specific to this style: a drifting canvas, a
#                    hard-cut camera, an overridden ground, an emoji, a hardcoded hex.
#   4 · IMPORTS    — another style's tokens mixed into a screenshare composition.
#   5 · MOTION     — layout properties being animated instead of transforms.
#
# Exit 0 = clean. Exit 1 = do not render.
#
# This gate is STATIC. It cannot see whether the canvas actually holds still,
# or whether a white caption is readable on the plate. Those are
# scripts/check-static.py and scripts/check-contrast.py, on the RENDER.
# Run all three.
# ═══════════════════════════════════════════════════════════════════════════
set -uo pipefail
# \x{...} classes and UTF-8 content need a UTF-8 locale; without this the
# emoji check silently matches nothing.
export LC_ALL="${LC_ALL:-en_US.UTF-8}"
DIR="${1:-.}"
[ -d "$DIR" ] || { echo "check-screenshare: no such directory: $DIR" >&2; exit 2; }

FAIL=0
hit(){ printf '  %-9s %s\n' "$1" "$2"; FAIL=1; }

FILES=$(find "$DIR" -name '*.html' -not -path '*/node_modules/*' 2>/dev/null)
[ -n "$FILES" ] || { echo "check-screenshare: no .html found under $DIR"; exit 0; }

echo "check-screenshare: $DIR"

# 1 · kit placeholder copy ---------------------------------------------------
KIT=("caption goes here" "two to six words" "placeholder label" "node title"
     "node subtitle" "window title placeholder" "source label placeholder"
     "first list row" "second list row" "third list row" "the placeholder word"
     "placeholder" "Lorem" "lorem ipsum" "TODO" "TBD" "XXX")
for s in "${KIT[@]}"; do
  while IFS= read -r f; do [ -n "$f" ] && hit "KIT" "$f  <- \"$s\""
  done < <(grep -rlF "$s" $FILES 2>/dev/null)
done

# 2 · material that belongs to a reference creator ---------------------------
# The technique is the style. Their script, product and branding are not.
if [ -f "$DIR/borrowed.txt" ]; then
  while IFS= read -r s; do
    [ -z "$s" ] && continue; [ "${s:0:1}" = "#" ] && continue
    while IFS= read -r f; do [ -n "$f" ] && hit "BORROWED" "$f  <- \"$s\" belongs to a reference creator"
    done < <(grep -rliF "$s" $FILES 2>/dev/null)
  done < "$DIR/borrowed.txt"
fi

# 3 · screenshare-specific style violations ----------------------------------

# 3a — the canvas must not DRIFT. Things arrive, a played share moves inside its
#      card, a cursor clicks — but the surface and the cards never float.
for sel in ss-canvas ss-safe ss-shot ss-window ss-board ss-list ss-callout; do
  while IFS= read -r f; do [ -n "$f" ] && hit "STYLE" "$f  <- .$sel is being tweened on x/y/scale/rotation by class; the surface never drifts (arrivals are per-id, small travel only)"
  done < <(grep -rlE "(to|from|fromTo)\([^;]*\.${sel}[^;]*(scale[^X]|scaleX|scaleY|rotation|x: *[0-9-]|y: *(-?[2-9][0-9]|1[0-9][0-9]))" $FILES 2>/dev/null)
done

# 3b — no ken-burns / drift / push-in of any kind on the canvas
while IFS= read -r f; do [ -n "$f" ] && hit "STYLE" "$f  <- a drift/push-in/ken-burns on the canvas; measured at zero (motion-grammar.md 4)"
done < <(grep -rliE 'ken-?burns|pushIn|push-in|slowZoom|slow-zoom|driftX|driftY|parallax' $FILES 2>/dev/null)

# 3c — the camera must TRAVEL, not cut. A data-ss-state flip with no tween.
for f in $FILES; do
  if grep -q 'ss-cam' "$f" && \
     ! grep -qE 'applyCam|camShrink|camGrow|ss-shrink-frames' "$f"; then
    hit "STYLE" "$f  <- uses .ss-cam but never calls applyCam/camShrink/camGrow; the camera TRAVELS to the corner over 11 frames, it never cuts"
  fi
done

# 3d — a CSS transition on the camera. HyperFrames seeks a paused timeline;
#      a wall-clock transition renders its end state on every frame.
while IFS= read -r f; do [ -n "$f" ] && hit "STYLE" "$f  <- .ss-cam carries a CSS transition/animation; drive it from the timeline via onUpdate only"
done < <(grep -rlE '\.ss-cam[^{]*\{[^}]*(transition|animation) *:' $FILES 2>/dev/null)

# 3e — the ground comes from assets/tokens.css (--ss-ground). A composition
#      never overrides it: change the theme with scripts/make-theme.py instead.
for f in $FILES; do
  python3 - "$f" <<'PYEOF' || hit "STYLE" "$f  <- .ss-frame / .ss-canvas background overridden in the composition; the ground comes from tokens.css (re-run make-theme.py to change it)"
import re, sys
s = open(sys.argv[1], encoding="utf-8", errors="replace").read()
bad = False
for m in re.finditer(r'\.ss-(?:frame|canvas)[^{]*\{([^}]*)\}', s):
    body = m.group(1)
    for b in re.finditer(r'background[^;:]*:\s*([^;]+)', body):
        v = b.group(1).strip().lower()
        if 'gradient' in v or 'url(' in v:
            bad = True
        for hexv in re.findall(r'#([0-9a-f]{3,8})\b', v):
            if hexv not in ('fff', 'ffffff', 'ffffffff'):
                bad = True
# also catch an inline style on the frame/canvas element
for m in re.finditer(r'class="[^"]*ss-(?:frame|canvas)[^"]*"[^>]*style="([^"]*)"', s):
    v = m.group(1).lower()
    if 'background' in v:
        for hexv in re.findall(r'#([0-9a-f]{3,8})\b', v):
            if hexv not in ('fff', 'ffffff', 'ffffffff'):
                bad = True
        if 'gradient' in v or 'url(' in v:
            bad = True
sys.exit(1 if bad else 0)
PYEOF
done
while IFS= read -r f; do [ -n "$f" ] && hit "STYLE" "$f  <- a grid/dot/noise/vignette texture on the ground; there is none"
done < <(grep -rliE 'repeating-(linear|radial)-gradient|background-image *: *url\([^)]*(grid|dot|noise|paper)' $FILES 2>/dev/null)

# 3f — emojis. House rule, and the reference's own use is what it was written against.
for f in $FILES; do
  python3 - "$f" <<'PYEOF' || hit "STYLE" "$f  <- contains an emoji; build a drawn mark instead (CSS tile / inline SVG)"
import sys
RANGES = ((0x1F000, 0x1FAFF), (0x2600, 0x27BF), (0x2B00, 0x2BFF),
          (0xFE0F, 0xFE0F), (0x2190, 0x21FF), (0x2700, 0x27BF))
s = open(sys.argv[1], encoding="utf-8", errors="replace").read()
hits = sorted({c for c in s if any(lo <= ord(c) <= hi for lo, hi in RANGES)})
if hits:
    print("          found: " + " ".join(f"U+{ord(c):04X}" for c in hits))
sys.exit(1 if hits else 0)
PYEOF
done

# 3g — hardcoded colour instead of a token.
# demos/ is exempt: those are REBUILT UIs (played screen shares, see
# reference/demo-mix.md §6b) rendered to mp4 and used as media. A rebuilt app
# has to carry that app's colours, the way a screenshot does. They are still
# checked for emojis and placeholder copy.
while IFS= read -r f; do [ -n "$f" ] && hit "STYLE" "$f  <- hardcoded hex; import assets/tokens.css and use --ss-*"
done < <(grep -rlE '#[0-9a-fA-F]{6}\b' $FILES 2>/dev/null | grep -v tokens.css | grep -v screenshare-system.html | grep -v '/demos/')

# 3h — the frame root must carry .ss-frame or every cqh token collapses
for f in $FILES; do
  if grep -qE 'ss-(cap|callout|shot|window|board|list|cam)\b' "$f" && ! grep -q 'ss-frame' "$f"; then
    hit "STYLE" "$f  <- uses screenshare classes but no .ss-frame root; all cqh type will render tiny"
  fi
done

# 3i — a caption that hard-cuts. Measured: it cross-fades over ~2 frames.
while IFS= read -r f; do [ -n "$f" ] && hit "STYLE" "$f  <- .ss-cap is being hard-cut (duration 0); it swaps on a ~2-frame fade (captions.md 1)"
done < <(grep -rlE '(to|set|fromTo)\([^;]*\.ss-cap[^;]*duration: *0\b' $FILES 2>/dev/null)

# 3j — a grade/matte/grain pass. This style does not grade the footage.
while IFS= read -r f; do [ -n "$f" ] && hit "STYLE" "$f  <- a grade/grain/bloom/vignette on the footage; screenshare does not grade (look.md 3)"
done < <(grep -rliE '[a-z]-grade\.sh|rvm-matte|grain\.png|filter: *(sepia|saturate|contrast)\(' $FILES 2>/dev/null)

# 3k — the bottom-right keep-out. Content parked under the camera card.
while IFS= read -r f; do [ -n "$f" ] && hit "STYLE" "$f  <- content positioned inside the camera keep-out; keep the bottom-right 380x380 clear when the camera is parked (use .ss-safe, or .ss-bleed deliberately)"
done < <(grep -rlE 'class="[^"]*ss-(shot|window|callout|board|list)[^"]*"[^>]*style="[^"]*(right: *([0-9]|[1-9][0-9]|[12][0-9][0-9]|3[0-7][0-9])px[^0-9])' $FILES 2>/dev/null)

# 4 · another style's tokens mixed in ----------------------------------------
for pre in pa- mg- np- vc- zk- vos-; do
  while IFS= read -r f; do [ -n "$f" ] && hit "IMPORTS" "$f  <- uses --${pre}* tokens; never mix two style token sets"
  done < <(grep -rlE -- "--${pre}[a-z]" $FILES 2>/dev/null)
done

# 5 · animating layout properties instead of transforms ----------------------
# clip-path is the ONE documented exception, and only on .ss-cam.
while IFS= read -r f; do [ -n "$f" ] && hit "MOTION" "$f  <- animate transforms only, never top/left/width/height"
done < <(grep -rlE '(transition|animation)[^;]*:[^;]*\b(width|height|top|left)\b' $FILES 2>/dev/null)
while IFS= read -r f; do [ -n "$f" ] && hit "MOTION" "$f  <- clip-path is animated outside .ss-cam; it is allowed for the camera travel and nothing else (motion-grammar.md 1.3)"
done < <(grep -lE '(to|fromTo)\([^;]*clipPath' $FILES 2>/dev/null | xargs grep -L 'ss-cam' 2>/dev/null)

echo
if [ "$FAIL" -eq 0 ]; then
  echo "clean — ok to render."
  echo "then, on the render:"
  echo "  <skill>/scripts/py <skill>/scripts/check-contrast.py out/seg-NN.mp4"
  exit 0
fi
echo "check-screenshare FAILED. Fix the above before rendering."; exit 1
