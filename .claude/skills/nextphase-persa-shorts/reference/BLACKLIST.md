# BLACKLIST — what never goes in a persa short

Every entry here came from a real cut being rejected. It is a hard list: if a beat needs one of
these, the beat is wrong, not the rule. Walk it **before** rendering.

---

## 1 · Small text — in any form
No screenshot of a docs page, article, table, changelog or README whose body type is small. No
cropped headline card. No table of body text. No small labels baked inside a screenshot.
Test: could you read it at one third of 1080 wide, on a phone, in a second? If not, the point
belongs in the voice and the caption, not on screen.
The one exception is the **pill label** — it is a label ON something, not content.

## 2 · Typeset text cards as support
A card you set in type is not media. Every supporting beat is a real resource — a real UI, a
real page, real footage, a real object. The caption, the display roles and the CTA are the only text.

## 3 · Captions with their own background band
No scrim, no strip, no plate behind the words. If a caption is not legible, change the look
(dark/bright caption ink) or darken the **media** — never add a band.

## 3b · Browser chrome on a page shot
No URL bar, no traffic lights, no sticky nav in a page shot. The frame is the content.
`scripts/shoot-page-9x16.py` strips fixed/sticky elements at capture.

## 3c · More than one highlight at a time
One mark on screen. The unit is a sentence, never two separate marks.

## 4 · Emojis — anywhere on screen
Build a designed mark instead: a monogram in a circle, a CSS check, arrow or cross.

## 4b · A webcam bubble, or anyone else's screen recording
A clip with a presenter's face in the corner is **unusable**, not croppable. Also out: another
creator's burned-in captions, YouTube chrome or end cards, channel watermarks, cursor-trail effects.
It has to look like the creator recorded it.

## 5 · People who aren't the subject
No stock footage, no podcast cutaways, no "generic person at a laptop". Cut to a person only when
that person **is** the subject of the line.

## 6 · A still of something that moves
If the real thing animates (an app, a dashboard, a site with motion), show it moving — a screen
recording, not a screenshot. A still held over 4s is a hole; the density gate fails it.

## 7 · A screenshot dropped into a box instead of owning the frame
**When a real UI is the beat, it owns the WHOLE FRAME — 1080×1920, corner to corner — and the
creator goes on top in the camera card.** Never the media floating over the face in a partial box
with a hard edge across it.
The mechanical cause is always the same two things: the wrong box (a full-frame shot squeezed into
a shorter element) and `object-fit: contain` (which shrinks it to a strip with dead space either
side). `.uifull` is `cover` at 1080×1920 for exactly this reason.

## 7b · An annotation typed at a guessed position
Once the UI owns the frame, a claim typed at a guessed `top:` lands on the UI's own headline or
buttons. Measure the empty space (`scripts/find-empty-space.py --max-y 1143`). No dark empty space
→ wrong shot for an annotation.

## 8 · A silent layout change
Every change of treatment carries a sound (`swell`) when sound is on. No silent cuts.

## 9 · Moving the caption line
One line at 72.9%, every treatment, the whole video. A "better spot for this beat" is the bug.

## 10 · A coral/display-colour OUTLINE
The display colour is only ever FILLED (hook + CTA). Outlines are white or the emphasis accent.

## 11 · A number that is the whole picture
A figure that counts up is a caption in a different font. **Thumb over the digits: does the frame
still mean anything?** If not, show the thing the number counts — the real pricing page, the real
dashboard, the real stack of items — and let the figure ride on it as an annotation.

## 12 · Grading a product's interface
The film grade goes on photographic surfaces only (camera, cut-out, b-roll). Recolouring a real
product's UI or a page shot fabricates it.

## 13 · Four sounds: ping · swoosh · confirm · beep
Banned in this style. The answer to a banned cue is no cue. `mix-sfx.sh` refuses them.

## 14 · A colour sampled somewhere else, used here unchecked
Check every accent against the ground it actually sits on, not the swatch it looked good in.
`make-tokens.py` does this for the brand; `hyperframes check` does it on the composition.

## 15 · Publishing anything
Nothing is posted, uploaded or scheduled without the creator's explicit approval. Every edit ends
at "rendered, sampled, opened for review."

---

## The test before you render
1. Is there a real 15s+ moving UI (the spine)? If not, did you tell the creator?
2. Is any text on screen that is not the caption, a display role, a pill or the CTA?
3. Could you read every surface at a third of 1080 wide?
4. Is every real-UI beat FULL FRAME with the creator in the card — no box, no `contain`?
5. Does every treatment change have a sound (if sound is on)?
6. Thumb over every number — does the frame still mean anything?
7. Does the caption sit at 1400 on every beat?
8. Any emoji, webcam bubble, watermark, or stranger anywhere?
9. Was every fact on screen checked (to the research level the creator chose)?
