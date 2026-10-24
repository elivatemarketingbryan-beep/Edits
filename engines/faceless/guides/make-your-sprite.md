# Make your sprite (one time only, about 15 minutes)

Your videos star a pixel-art version of you. You make it once, and every video after that reuses it.

You need one clear photo of your face, front-facing, good light, nothing covering it. A selfie is fine.

## Where to make it

Any image tool that accepts a photo and can edit its own results works. In order of preference:

1. **ChatGPT** (Plus or higher): upload the photo, paste the prompts below one at a time in the same chat.
2. **Higgsfield**: if your Higgsfield account is connected to Claude, just tell Claude "make my sprite with Higgsfield" and it runs these prompts for you.
3. **Anything else** (Gemini, Midjourney with character reference, Leonardo, etc.): use the same prompts. Keep every edit in one conversation or reference the first result, so the character stays the same person.

Save every image you get. File names do not matter much, but naming them the way shown below helps Claude sort them instantly.

## The prompts

### 1. The master image (most important)

Upload your photo, then paste:

> Turn the person in this photo into a full-body, front-facing pixel-art character sprite in the style of a retro trainer sprite from a classic handheld RPG. Hard square pixel clusters, a clean dark outline, economical warm skin shading, limited palette. Keep their real likeness: face shape, hairstyle and hair colour, skin tone, glasses or facial hair if they have them. Dress them in their everyday style. They stand straight and relaxed facing the viewer, arms hanging naturally at their sides, feet slightly apart, mouth closed with a calm friendly expression. One single character, centered, the whole body visible from hair to shoes with generous empty space around it. Square image. Solid flat pure green background (#00FF00) with no shadow, no floor, no text, no props.

If you are wearing green, swap `pure green background (#00FF00)` for `pure magenta background (#FF00FF)`.

Regenerate until you love it. Everything else is built from this image, so take your time here.

**Save as:** `idle-neutral.png`

### 2. The talking mouth

> Edit the image you just made. Change ONLY the mouth: open it naturally as if mid-word, a small dark opening with a hint of teeth. Every other pixel stays exactly the same: same pose, same size, same position, same background.

**Save as:** `idle-talk.png`

### 3. Gestures

Run each of these on the **master image** (step 1), not on the previous gesture. After each prompt, add this line:

> Change ONLY the arms. Keep the head, face, closed mouth, hair, clothes, legs, shoes, size, position, pixel style and green background exactly the same.

| Save as | Prompt |
|---|---|
| `present-right-neutral.png` | Edit the master image: the arm on the viewer's RIGHT side bends at the elbow and lifts the open palm up and outward at waist height, presenting something beside them. The other arm stays down. |
| `present-left-neutral.png` | Edit the master image: the arm on the viewer's LEFT side bends at the elbow and lifts the open palm up and outward at waist height, presenting something beside them. The other arm stays down. |
| `point-right-neutral.png` | Edit the master image: the arm on the viewer's RIGHT side extends sideways at chest height with the index finger pointing to the viewer's right. The other arm stays down. |
| `point-left-neutral.png` | Edit the master image: the arm on the viewer's LEFT side extends sideways at chest height with the index finger pointing to the viewer's left. The other arm stays down. |
| `wave-neutral.png` | Edit the master image: the arm on the viewer's right bends upward into a small friendly wave, open palm beside the shoulder. The other arm stays down. |
| `thinking-neutral.png` | Edit the master image: one hand rests on the chin in a thinking pose, the other arm folds across the body to support that elbow. |
| `arms-crossed-neutral.png` | Edit the master image: arms relaxed and crossed just below the chest, one forearm in front of the other, slim and natural, hands tucked. Confident stance. |

You do **not** need talking versions of the gestures. Claude copies your talking mouth onto each one automatically.

### 4. Optional expressions (nice to have)

Run on the master image, with: `Change ONLY the mouth. Every other pixel stays exactly the same.`

| Save as | Prompt |
|---|---|
| `idle-smile.png` | A warm closed-mouth smile. |
| `idle-surprised.png` | A small round surprised "oh" mouth. |
| `idle-talk-wide.png` | Mouth open wide mid-word, as if saying something with energy. |
| `idle-talk-small.png` | Mouth barely open, as if saying a soft "mm" or "n". |

## Hand them to Claude

Put every image in the `sprite/raw` folder of this project (or just attach them in the chat) and say **"my sprite is ready"**.

Claude removes the green background, lines up every pose so the character never jumps between gestures, fills in the talking mouths and shows you a preview sheet. If something looks off, it tells you which prompt to rerun.

## Minimum to get started

Only `idle-neutral.png` and `idle-talk.png` are required. With just those two, videos still work: the character talks and reacts, it just won't point or gesture. You can add gestures any time and rerun the setup.
