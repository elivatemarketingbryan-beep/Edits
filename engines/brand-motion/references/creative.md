# Creative direction

The difference between a template and a piece that feels custom is the concept: one idea, taken from the logo itself, carried through every scene, so the ending feels inevitable. Spend real thought here before touching JSON.

## 1. Find the concept in the mark

Look at `logo_parts.png` and answer three questions:

1. **What is it, literally?** A flask, a cup, a bolt, a leaf, a house, a speech bubble, a letter.
2. **What does that object do?** Flasks brew and react. Cups fill and steam. Bolts charge and strike. Leaves grow. Houses get built. Bubbles pop and multiply.
3. **What is the character?** The hero part (the person in the flask, the heart in the cup, the dot on the i). It is the protagonist: it forms, it is born or freed, it does the thing the offer promises, it comes home.

Then connect it to the offer's promise. The verb of the object becomes the verb of the story:

| Logo | Offer | Concept | Marquee word | Payoff words |
|---|---|---|---|---|
| Flask with a person | Build AI employees | Ingredients go in, an employee is brewed and pops out, then clones into a team | BREWING | HIRE YOUR FIRST AI EMPLOYEE |
| Cup with a heart | Loyalty app for cafes | Each feature is poured in, the heart floats up, regulars multiply | REFILLING | REGULARS THAT RETURN |
| Bolt in a circle | Energy drink / fast service | The circle charges, the bolt strikes out, lightning everywhere | CHARGING | ZERO TO DONE |
| Leaf | Wellness coach | A seed is dropped, the leaf grows, sprouts a garden | GROWING | GROW DAILY |
| House | Real estate agent | Bricks (benefits) stack, the house lights up, a street appears | BUILDING | YOUR KEYS. TODAY |

If the hero is the whole mark (no distinct part), the logo itself is the character: it can be traced, filled, pop, bounce, multiply into a grid.

## 2. The arc

| Beat | Feel | Typical scenes | Share of a 30 s piece |
|---|---|---|---|
| Spark | calm, curious, slow eases, space | `drop_open`, `logo_trace` | 15 to 20% |
| Build | rhythmic, items land on the beat | `tiles`, `headline` | 20 to 25% |
| Tension | accelerating, shaking, rising | `build` | 10 to 15% |
| Payoff | sudden, loud, a release | `pop` (+ words) | 10% |
| Proof | fast, many cuts, colour changes | `multiply`, `stat`, `showcase` | 15 to 20% |
| Resolve | slow again, warm, the logo home | `resolve` (+ `cta`) | 20 to 25% |

Other lengths scale the same shares:
- **15 s:** hook (2) → build (4, tiles or headline) → pop (2) → resolve (4) → cta (3). No multiply.
- **20 s:** hook (2) → spark (2) → build (3) → tension (3) → pop (3) → resolve (4) → cta (3). Multiply only if the story is about scale.
- **30 s:** the full arc above (hook optional in front of the spark).
- **45 to 60 s:** add a second build/proof round or a `showcase` of their website, not slower pacing.

**Contrast in pace is the point.** Slow sections use long ease-outs and let one thing breathe. Fast sections hit every beat and change colour. The silence before the pop (the `build` inhale) is the single most effective moment; keep it.

## 3. Copy

- **Kinetic words:** 1 to 3 words per beat, one beat replacing the next, so the sequence reads as a phrase in time ("HIRE / YOUR / FIRST / AI EMPLOYEE."). Each word must make sense on its own for half a second; put the payoff word last and give it two beats.
- **Hooks (first 1 to 3 s):** under 10 words, a specific claim or tension the viewer feels ("Most coffee shops lose half their regulars"). Mark the one word that carries the weight.
- **Headlines:** a turn of phrase in 2 to 3 lines ("No code. / just / Chemistry."). Put the twist in the accent line.
- **Concrete over abstract:** name the thing, the number, the result. "10 min setup" beats "easy to use". Never "revolutionize", "unlock", "next level", "game-changer".
- **Use their language:** pull phrases from the member's own description and website. Their audience recognises their words.
- **One CTA:** one keyword or one URL, said once on screen, held long enough to read (at least 2 s).
- Spell-check every string. Text in a video cannot be fixed after posting.

## 4. Scripts (voiceover mode)

Write it to be spoken, in the member's voice. Then either they record it on their phone (quiet room, phone 20 cm away, read it twice and send the better take) or it is generated with their ElevenLabs voice. For ElevenLabs, punctuation is direction: commas and full stops make pauses, an ellipsis makes a longer one, and `--style` (0 calm to 1 expressive) sets the energy.
- 30 s ≈ 65 to 75 words for a talky piece; 25 to 40 words if the motion carries more of it.
- Structure: hook (one line) → problem (one or two lines) → the offer as the turn ("Here's the fix.") → two or three concrete benefits → proof or number → CTA.
- Short sentences. One idea per sentence. Write numbers the way they are said ("ten minutes").
- Leave a beat of silence before the payoff line; you will place the `pop` there.

## 5. Raw video (mode C)

The speaker is the star; graphics clarify and add rhythm. From the transcript, mark:
- **The hook** (first sentence): `hook` overlay, mark the key word, punch-in zoom on it.
- **Emphasis words** (numbers, results, contrasts): a `zooms` punch-in (scale 1.08 to 1.15, hold about 1 s) every 3 to 5 s, never back to back.
- **Key claims** (2 to 3): `callout` stickers timed to the words.
- **One or two strong lines** worth a full-screen moment: `kinetic_words` (the turn: "Here's the fix"), `stat` (a number), `showcase` (their site while they mention it). 1 to 2 s each, cut in with `whip` or `circle`, cut back out on the next word.
- **The close:** `cta` while they say the ask, then `resolve` (flash in) as the brand sign-off. If the clip ends abruptly, extend `duration` 2 to 3 s past it; the last video frame holds underneath.
- Captions on (`during: "video"`), logo bug top-left while the speaker is on screen.

## 6. Colour and layout

- **Logos that are a coloured tile or disc** (app icons, badges): the tile is the container, so do not use its colour as the field. Use the website's dark or light colour as `bg`, the tile colour as `accent`/liquid, and `"trace": "all"` on logo_trace/tiles/build/pop so the pen also draws the mark inside the tile (a plain rounded square is a dull trace).

- Live on the brand colour: `bg` should be the colour people associate with them. Use `ink`/`paper` for text; the engine picks the readable one automatically when you do not specify.
- Every frame has one focal point. If two things compete, delay one by a beat.
- The logo is the hero at the end: big (size 600 to 900), centred, with room around it.
- Do not put text where captions sit (around y 1250) while captions show, or near the bottom 400 px.

## 7. Self-review checklist (look at the preview sheet)

- Does the first frame invite attention (not empty, not cluttered)?
- Is the logo correct (shape, colours, hero part right)? Does the hero read as a character?
- Is every word readable at phone size, in the safe zone, spelled right, with contrast?
- Do transitions read as one continuous camera (the flood from the drop, the pop from the build)?
- Is there a slow part, a fast part, and a moment of silence before the payoff?
- Would the member post this without editing it? If not, fix what they would fix.
