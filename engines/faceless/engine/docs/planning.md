# Planning a video (plan.json)

You read `videos/<slug>/brief.md` (the script, every word with its index and timing) and write `videos/<slug>/plan.json`. The engine does all timing, animation, lip sync, captions layout, poses and sound from it. Your job is the edit: **which scene type plays when, what's on screen, which words get which treatment, and what moves on which word.**

The editing grammar is a measured copy of one reference edit (`style/STYLE_BIBLE.md`; section 6 there is the full rulebook these rules come from). The look is our own: red palette, minimal dot-grid backgrounds (`style/HOUSE_STYLE.md`). The rules below are its grammar, generalised so they work for any topic. Follow them closely and every video will feel like the same editor cut it, while the content, layouts, B-roll and rhythm differ every time.

## 1. The shape of plan.json

```json
{
  "title": "short internal name",
  "scenes": [
    { "at": 0, "layout": "hook", "headline": ["Line One Claim", "Boxed Payoff"], "card": { ...page... } },
    { "at": 14, "layout": "proof", "card": { ... }, "beats": [ { "at": 16, "fx": "highlight", "target": "key" } ] },
    { "at": 31, "layout": "split", "card": { ... }, "beats": [ ... ] },
    { "at": 52, "layout": "face" },
    { "at": 80, "layout": "cta" }
  ],
  "captions": { "accent": [], "glitch": [], "verb": [], "stretch": [], "white": [], "skip": [], "breakBefore": [], "keepCase": [] },
  "cta": { "at": 80, "verb": "comment", "keyword": "GUIDE" },
  "seed": "optional; change it to reshuffle the automatic choices"
}
```

Every `at` is a **word index** from brief.md. A scene starts at its first word: the cut lands on that word's first frame. A beat fires on its word.

Optional per scene: `"bg"` (`light`, `white`, `charcoal`, `graphite`, `wine`, `warm`, `onyx`): the engine picks and rotates dark backgrounds itself, so set it only for a reason. Every background carries the house dot grid.
Optional top level: `"room"` (`sage`, `cream`, `blue`, `mint`, `studio`, `blush`) for the sprite's backdrop, `"accent"` (hex) to recolour the house red, `"poses"` (`[{ "at": 12, "pose": "thinking" }]`) to force a pose (otherwise the engine picks).

## 2. Scene types

| layout | What's on screen | Sprite | Use it for |
|---|---|---|---|
| `hook` | Two-line title (sans line + red gradient box), small browser card, captions, sprite in the bottom panel | panel | **Always scene 1.** The first sentence or claim. |
| `split` | Big browser card on top, captions in the middle, sprite in the bottom panel | panel | The default "talking + showing" scene: claims, numbers, lists, walkthroughs. |
| `proof` | Dark blurred background, tall browser card, white captions; the whole scene lands with a zoom-out | hidden | Evidence and detail: a source, a post, an article, the actual prompt or file, "here's exactly how". |
| `reveal` | White with a faint dot grid, red label box with the lead-in ("It's Called", "Meet", "Introducing"), the product's card, the name as a big caption | hidden | Naming something: "it's called X", "introducing X", "meet X", "this is X". |
| `compare` | Dark, two stacked cards with pills (`before`/`after`, `original`/`remake`, `theirs`/`yours`) | hidden | Before/after, A vs B, "same as", "turns X into Y", "copy of". |
| `face` | Full-screen close-up of the sprite on its room backdrop, white captions on the chest | full | Short direct instructions to the viewer: "Just copy the one you like", "So go try it", "Here's the trick". 0.8 to 2 s. |
| `cta` | Full-screen sprite plus the CTA lockup (*verb* over **"KEYWORD"**) | full | **Always the last scene** when the script ends with "comment X / type X / DM me X". |

Card sizes the page is rendered at: hook 846×415, split 941×627, proof 941×995, reveal 845×610, compare 701×457 (page area under the window bar).

## 3. Cutting rules (scene boundaries)

1. **Cut only at the start of a sentence or clause.** Good cut words: the first word after a period, or a clause opener after a comma: "and", "but", "so", "each", "inside", "it's", "just", "here's", "now".
2. **Shot length 1.3 to 4 s**, about 2.5 s on average. Never hold one scene past ~5 s without in-scene beats every second or so. A 30 s script gets 8 to 11 scenes; a 60 s script gets 16 to 22.
3. **Alternate brightness.** Consecutive scenes should differ strongly: light (hook/split/face) → dark (proof/compare) → white (reveal) → light … Never put two dark scenes back to back, and never two `split` scenes back to back unless the second follows a `swipe` beat's logic (a new example) or a `face` insert sits between them.
4. **The face is a spice.** `face` appears 1 to 2 times per 30 s, mostly in the second half, always on an instruction or direct address. `cta` ends the video if there is a CTA.
5. Proof scenes, reveal scenes and compare scenes hide the sprite. The sprite should be visible in roughly half the runtime. The engine shows and hides it automatically.
6. **Typical arc** (vary it, don't copy it): hook (claim) → proof (where it comes from) → reveal (what it's called) → split (the number / the headline benefit) → proof (the detail) → split (the list, with clicks) → face (the instruction) → split (how you'd use it, zoomed) → compare (the result) → cta.

## 4. B-roll: what goes in each card

The card is a browser window. Its content is one **page**. Pick the page that literally shows what the voice is saying at that moment.

- **Real websites** (best when the script names a real product, site or tool): capture it first, look at the PNG, then use it as an image page:
  `npm --prefix engine run capture -- <url> <slug> --name <shot>` then `{ "kind": "image", "src": "assets/shots/<shot>.png", "url": "site.com/path" }`.
  Add `"regions": { "pricing": [x, y, w, h] }` (fractions of the image) to make spots in the screenshot targetable by beats. Skip captures that show logins, cookie walls or errors.
- **User-supplied screenshots or images**: copy them into `videos/<slug>/assets/` and use `kind: "image"`.
- **Built pages** (always available, always crisp): post, article, chat, app, list, stat, chart, code, hero, search, table, doc. See `engine/docs/pages.md` for every kind's fields and keys. Write the content yourself, specific to the script.
- Put `[[key|words]]` around any text a beat should hit: `"text": "I tested [[n|47]] tools and only [[best|three were worth paying for]]"`.
- **Honesty rule:** never invent a post, quote, review or article and attribute it to a real person or real publication. Built posts use the creator's own handle (`brand.json` → `handle`) or clearly illustrative names ("Sam, indie founder"). A real source gets a real capture or the user's screenshot.
- Set the card's `"url"` so the address bar is believable (`yourbrand.com/guide`, `notes.app/plan`), never a real site's URL on content you invented.
- Vary page kinds: no kind twice in a row, and use at least 4 different kinds in a 30 s video.
- **Fill the card.** Proof cards are tall (995 px of page): give them content that fills most of it (a post with `media`, an article with an `image` and two or three paragraphs, a doc with four to six blocks, a full-page capture), or add a `scroll` beat. A short post alone leaves half the card white.

## 5. Beats (what moves inside the card)

Every beat is `{ "at": <word index>, "fx": "<type>", "target": "<key>", ... }`. Aim for **one visual event every 0.5 to 1 s** inside split, proof and compare scenes (captions count as events, so 1 to 3 beats per scene is usual).

| fx | When the voice… | Do |
|---|---|---|
| `highlight` | paraphrases or reads text that is visible in the card | sweep a selection over that text, starting on the first paraphrasing word. Multi-line spans sweep continuously. |
| `ring` | names a specific field, number or label that answers "with what / how much" | draw a red ring around it. |
| `click` | names an item that exists as a button, tab, chip or menu entry | the cursor glides there and clicks, and a ring draws. For lists, click one item per spoken item. |
| `cursor` | points at something without clicking | cursor glides there. |
| `counter` | says a number that matters | ring on the number in the card (if `target`) plus a pop-out counter that rolls up to `value`, with a 1 to 3 word `label` from the noun after the number ("real examples", "followers", "per month"). Optional `"out": <word index>` for when it leaves. |
| `zoom` | is about to talk about one region of a busy page (often right after a `face` insert) | push into the target (`scale` 1.3 to 1.6). Start it on the scene's first word. |
| `scroll` | says "there's more", "a whole library", "dozens of" | scroll the page down (`by` px optional). |
| `swipe` | closes a list: "and much more", "and a lot more", "plus" | the card slides away and a new card (`"card": {...}`) slides in. Beats after a swipe act on the new card. |
| `swap` | (compare scenes) repeats the claim word: "the same", "also", "again" | blur-swap both cards to a second pair: `"cards": [top, bottom]`. |
| `type` | describes typing or asking something | types out the target's text. |

Timing details (the engine handles them): highlights start 4 frames early, cursors leave early enough to arrive on the word, rings land with the cursor, the counter launches from the ring.

## 6. Captions

The engine groups words (1 to 3 per line, never wrapping, breaks at punctuation and pauses), lowercases everything except names, strips punctuation, and times each word to its onset. You only mark emphasis, by word index:

- `accent`: **the payoff of each clause**: the quality, category or result words. Nouns and adjectives, never verbs, pronouns or function words. Examples: *professional*, *motion graphics*, *library*, *best ones*, *animated*, *brand*, *style*, and a list closer's *more*. Mark whole phrases (both words of *sound effects*). About **one accent unit per 4 to 6 spoken words**, at least one per sentence, ≈14 per 30 s. Rendered as serif italic filled with the red gradient (a paler red gradient on dark scenes and over the full-screen character).
- `white`: subset of accent words that sit in a dark scene and form the closing parallel pair ("the same *animations* and the same *sound effects*"). White serif instead of the red gradient.
- `glitch`: **AI, product, brand and tool names** (Claude, ChatGPT, Notion, the product's name), at most one every ~3 s outside lists, and **the head word of each multi-word list item** ("*launch* videos", "*product* videos", "*mobile* app"). Not people's names. The video's first caption word glitches automatically.
- `verb`: the **one** key promise verb of the video (*recreate*, *automate*, *double*): red-gradient sans with a landing stretch, own line.
- `stretch`: **single-word list items** ("demos", "charts"), the clause-final punch word of the hook ("scratch"), and the first word after a `face` insert ("tweak"). Numbers stretch automatically.
- Outside lists, never put two special entrances (glitch/stretch/verb) in consecutive caption lines; at most one every ~2 s. Inside a list, every item gets one.
- `skip`: words not to caption (fillers: "just", "like", "so" as a filler, "you know").
- `breakBefore`: force a new caption line before these words (use when a natural phrase splits badly).
- `keepCase`: keep a word's capitals ("AI", "iPhone", sentence-start brand names).
- `text`: fix what the transcriber misheard, by word index: `{ "39": "ScrapeGraphAI", "40": "", "41": "" }`. A replacement is shown exactly as written; `""` hides a word (use it when one name was split into several words, keeping the first index). **Always check names, products and numbers in brief.md against what the creator meant**: transcribers split and misspell product names ("scrap graph AI"), compound words ("e commerce") and new model names. When unsure what was said, ask the user rather than guess.

## 7. Hook (scene 1)

- `headline[0]`: 2 to 4 words in Title Case that set up the claim: subject + verb ("Claude Can Now Make", "This App Replaces", "Nobody Talks About").
- `headline[1]`: 1 to 3 words, the payoff, shown white serif italic in the red box ("Motion Graphics", "Your Accountant", "Zone 2 Training").
- The headline paraphrases the first sentence. It does not need to match the spoken words.
- The hook card shows the thing itself, ideally moving or striking (a hero page, a chart, a result).
- Pick the payoff accent words from the first sentence (they get the red serif in the captions too).

## 8. CTA (last scene)

- If the script ends with "comment X", "type X", "DM me X" or "search X": add `"cta": { "at": <index of "comment">, "verb": "comment", "keyword": "X" }` and make the last scene `layout: "cta"` starting at or before that word (the sentence start).
- The lockup appears 9 frames before the verb is heard. Captions stop there and the lockup holds to the end.
- No CTA in the script → end on a `face` or `split` scene; the last caption group holds to the end.

## 9. Variety (every video must feel new)

The engine already varies, from the video's seed: the dark background colours, the room backdrop, the music bed's chords, gesture sides and the pose sequence, and which sound-effect takes play. You vary the rest:

- **Read the "Recent videos" section of brief.md.** Don't open with the same hook card kind, don't reuse the same scene-type sequence, and don't use the same page kind for the same job as the last 3 videos.
- Pick B-roll from the topic's world: a finance video shows statements, charts, calculators and tables; a fitness video shows workout logs, stat tiles and form checklists; a cooking video shows recipe docs and timers; an AI video shows apps, chats and code.
- Change the arc: not every video needs a reveal or a compare. Some open on a number (hook card = stat), some on a question (hook headline "Why Does Nobody…").
- Keep the grammar fixed: cuts on clause starts, brightness alternation, the beat density, the emphasis rules. That is what makes it feel like the same channel.

## 10. Checklist before you build

- Scene 1 is `hook` at word 0. Every scene's `at` is a sentence or clause start, and they increase.
- No dark scene follows a dark scene. 1 to 2 `face` scenes per 30 s. `cta` is last if there's a CTA.
- Every card has a page with real, specific content. Every beat `target` is a key that exists in that card (the build lists the available keys if not).
- Accent words ≈ 1 per 5 words. Brand names glitch. One `verb`. Numbers have `counter` beats when they matter.
- Then run `npm --prefix engine run make -- <slug>`.

## 11. A complete example

See `engine/docs/example-plan.json` (a 30 s video about an AI motion-graphics library, with its brief).
