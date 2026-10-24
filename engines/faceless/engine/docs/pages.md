# Page templates (B-roll inside the browser card)

`renderPage(spec, ctx)` in `engine/lib/pages.mjs` turns a page spec into the web content shown in a
card. Pick the `kind` that matches what the voiceover is talking about, fill the fields with real,
specific content (names, numbers, dates), and point beats at the keys listed below.

## Rules that apply to every kind

- **Keys.** Every beat target is a `data-k` key. Each kind has auto keys (listed below). You can add
  your own anywhere in free text with `[[key|words]]`; `**bold**` also works. Keys are
  `[a-zA-Z0-9_-]`, and must not repeat an auto key of the same page.
- **Highlight** works on any key that contains text (it sweeps the words). For an exact phrase,
  wrap it: `"text": "Claude [[built|built a full gallery]] in one prompt"`.
- **Ring, cursor, click and zoom** work on any key. Auto keys usually wrap the whole element
  (a list row, a chip, a bar), which makes the best ring target.
- **Design for the first screen.** Cards show 415 to 995 px of page height, and the top of the page
  is what is on screen first. Put the payoff near the top, or add a `scroll` beat.
- **Optional on every kind:** `accent` (hex colour for buttons, bars and links, e.g. `"#F97316"`).
  `theme: "dark"` gives a dark UI on `post`, `chat`, `code`, `app`, `stat`, `chart` and `hero`.
- **Images** are paths relative to the project (`"assets/img/x.jpg"`). Never use web URLs.
- **Text sizes are fixed for legibility.** Keep strings short: titles under about 60 characters,
  paragraphs under about 220.
- Use the `→` arrow and `✓` check characters sparingly, since the bundled fonts lack them and a
  fallback glyph is used. Emoji are fine in `doc.icon`.

---

### image: a screenshot or photo
**Use for** real screenshots you were given, product shots and photos. Use `regions` to point at parts of the picture.
**Fields:** `src`; `fit` = `width` (default: full width, scrolls) or `cover` (fills the card);
`position` = `top` or `center` (for cover); `regions` = `{ key: [x, y, w, h] }` as fractions 0..1 of the
image; `size` = `[w, h]` (optional, used when the file can't be read); `bg`.
**Keys:** `image`, plus every region key. A region supports ring, zoom, cursor and highlight (the highlight is a tinted box).
```json
{ "kind": "image", "src": "assets/img/dashboard.png", "regions": { "chart": [0.2, 0.34, 0.77, 0.62], "cta": [0.8, 0.02, 0.17, 0.06] } }
```

### post: a social post (`tweetQuote`, `tweet` are aliases)
**Use for** quotes, takes, viral posts and testimonials.
**Fields:** `platform` = `x` | `threads` | `linkedin` | `instagram`; `name`; `handle`; `avatar` (img) or
`initials`; `verified`; `text`; `media` (img) or `mediaGrid` (2-4 imgs); `time`;
`stats: { replies, reposts, likes, views, bookmarks, shares }` (numbers are compacted, e.g. 12400 becomes 12.4K).
linkedin also takes `headline`, instagram takes `location`, and an instagram post with no media becomes a text card.
**Keys:**
- x: `name handle text media replies reposts likes bookmarks views`
- threads: `name text media likes replies reposts shares`
- linkedin: `name handle text media likes replies reposts views`
- instagram: `handle media likes replies text`

```json
{ "kind": "post", "platform": "x", "name": "Maya Chen", "handle": "mayabuilds", "verified": true,
  "text": "Claude just [[built|built a full motion graphics gallery]] from one prompt.", "media": "assets/img/gallery.png",
  "time": "9:41 AM · Oct 21, 2026", "stats": { "replies": 482, "reposts": 1900, "likes": 12400, "views": 1840000 } }
```

### article: a blog or news article
**Use for** headlines, studies and "according to..." claims.
**Fields:** `site`, `nav` (section labels, optional), `kicker`, `title`, `dek` (subtitle), `byline`, `date`,
`readTime`, `image`, `caption`, `body: [paragraphs]`, `style: "serif"` (italic serif headline).
**Keys:** `kicker title dek byline image p1..pN`
```json
{ "kind": "article", "site": "The Ledger", "kicker": "Personal Finance", "title": "The 50/30/20 rule is broken",
  "byline": "Priya Nair", "date": "Oct 21, 2026", "body": ["With rent at 40% of pay, [[fail|the math stopped working]]."] }
```

### chat: an AI assistant or a text thread
**Use for** prompts and answers ("I asked Claude..."), or DMs and texts.
**Fields:** `app` = `assistant` | `messages`; `title` (chat or contact name); `messages: [{ role: "user"|"ai", text }]`
(in `messages`, "user" is the blue bubble on the right); `input` (text in the composer); `placeholder`; `avatar`; `day`.
In AI messages, lines starting with `- ` or `1. ` render as lists.
`typed: true` hides the input characters so a `type` beat can type them on. `pin: false` turns off the
default layout, where the newest message sits above a composer pinned to the bottom of the card and
older messages clip off the top.
**Keys:** `title m1..mN input`
```json
{ "kind": "chat", "app": "assistant", "title": "Motion gallery",
  "messages": [{ "role": "user", "text": "Build a gallery for 230 clips" }, { "role": "ai", "text": "Done:\n- A [[grid|responsive grid]]\n- Filter chips" }],
  "input": "Make every card loop" }
```

### app: a catalog or gallery web app
**Use for** "this site has 230 examples", template galleries, recipe or course libraries and tool directories.
**Fields:** `brand`, `title`, `subtitle`, `filters: [labels]` (tabs), `chips: [{ label, count }]` (pills, the
first is active, or set `active` to an index or label), `grid: [{ label, image | color, meta, badge, duration }]`,
`search`, `cta`, `columns`.
**Keys:** `brand title`, `filter1..` and `filter-<slug>`, `chip1..` and `chip-<slug>` (e.g. `chip-prompt`), `card1..`
```json
{ "kind": "app", "brand": "Prompt Motion", "title": "Motion graphics made with Claude",
  "chips": [{ "label": "All", "count": 230 }, { "label": "Prompt", "count": 142 }],
  "grid": [{ "label": "Orbit loader", "image": "assets/img/t1.jpg", "duration": "0:06" }, { "label": "Bar race", "color": "#F97316" }] }
```

### list: a numbered, checked, bulleted or ranked list
**Use for** "5 ways to...", steps, checklists, top-N and rankings.
**Fields:** `title`, `eyebrow`, `sub`, `style` = `numbered` | `check` | `bullets` | `ranked`,
`items: [string | { text, note, tag, done }]` (`tag` is a pill on the right, such as a price or score; in `check` style, `done: false` shows an empty circle).
**Keys:** `title item1..N` (each key is the whole row)
```json
{ "kind": "list", "style": "ranked", "title": "Best AI video tools", "items": [{ "text": "Claude + HyperFrames", "note": "Code-driven motion", "tag": "9.6" }, "Runway"] }
```

### stat: metric tiles on a dashboard
**Use for** one big number ("$248,310 net worth") or 2-4 KPIs.
**Fields:** a single tile takes `label value unit prefix delta vs sub spark:[numbers] goodDown`. For 2-4 tiles use
`stats: [{ ...same fields }]`. Header fields are `title`, `range` and `brand`. A `delta` that starts with `-`
points down and is red, unless `goodDown: true`.
**Keys:** `title`, then `label value delta` (single) or `label1 value1 delta1, label2..` (multi)
```json
{ "kind": "stat", "title": "Portfolio", "label": "Net worth", "value": "$248,310", "delta": "+12.4%", "vs": "vs. last quarter", "spark": [180, 195, 214, 248] }
```

### chart: a bar or line chart (static, final state)
**Use for** growth, comparisons and before/after numbers.
**Fields:** `title`, `sub`, `chart` = `bar` | `line` (`type` is also accepted), `unit` (`$`, `€`, `£` or `%`), `series: [{ label, value, display? }]`,
`highlight` (0-based index, or the label), `accent`.
**Keys:** `title`, `bar1..N` (value plus bar) or `point1..N` (the dot)
```json
{ "kind": "chart", "chart": "bar", "title": "Monthly savings", "unit": "$", "highlight": 5,
  "series": [{ "label": "Jan", "value": 310 }, { "label": "Jun", "value": 840 }] }
```

### code: a code editor or terminal
**Use for** code, prompts shown as files (`file: "prompt.md"` shows plain text) and CLI runs.
**Fields:** `file`, `tabs: [more filenames]`, `lang` (js, ts, py, sh, go, rs, css, sql, html, md; otherwise it is
inferred from the file extension), `code` (`\n` separated), `highlight: [line numbers]` (tinted rows), `path`.
`terminal: true` shows a dark terminal (`$ ` lines are commands; output lines starting with ✓/done are green,
error lines red, warn lines amber). Fields for the terminal: `cwd`, `title`. Use `theme: "light"` for a light terminal.
**Keys:** `line1..N` (the line's text), plus `[[key|...]]` inside the code.
```json
{ "kind": "code", "terminal": true, "cwd": "~/app", "code": "$ npm run build\n✓ built in 1.2s" }
```

### hero: a product landing page
**Use for** introducing a product, app or service.
**Fields:** `brand`, `nav: [labels]`, `badges: [first is a "New" pill above the headline, the rest are ✓ proof points]`,
`headline`, `sub`, `cta` (string or `[primary, secondary]`), `image` (product screenshot), `signup`, `accent`.
**Keys:** `brand badge1 headline sub cta cta2 badge2.. image`
```json
{ "kind": "hero", "brand": "Liftlog", "accent": "#F97316", "headline": "Train smarter. Lift [[heavier|heavier]].",
  "sub": "An AI coach that plans every session.", "cta": ["Start free", "See plans"], "image": "assets/img/app.png" }
```

### search: a search results page (unbranded)
**Use for** "everyone is searching for...", showing what comes up for a query.
**Fields:** `query`, `results: [{ title, url, snippet, date, site, ad }]`, `tabs`, `count`, `typed: true` (the query is hidden for a `type` beat).
**Keys:** `query r1..N` (the whole result), `r1-title..`
```json
{ "kind": "search", "query": "easy high protein dinner", "results": [{ "title": "25 High-Protein Dinners", "url": "https://weeknightkitchen.com/recipes", "snippet": "At least [[g|30 g of protein]] each." }] }
```

### table: a pricing or comparison table
**Use for** plan comparisons, X vs Y and feature matrices (2-4 columns read best).
**Fields:** `title`, `sub`, `columns: [...]`, `rows: [[...]]`, where cells can be `true`/`false` (✓/✕ icons) or text,
`highlightRow` and `highlightCol` (0-based index or first-cell/header text), `colBadge` (default "Best"), `note`.
**Keys:** `title col1.. row1..N cell-R-C` (1-based, e.g. `cell-3-2`)
```json
{ "kind": "table", "title": "Which plan?", "columns": ["Feature", "Free", "Pro"], "highlightCol": 2,
  "rows": [["1080p export", true, true], ["Brand kit", false, true], ["Price", "$0", "$19"]] }
```

### doc: a Notion-style document
**Use for** plans, notes, checklists and SOPs.
**Fields:** `title`, `icon` (emoji), `cover` (hex colour or img), `path: [breadcrumb]`, `meta`,
`blocks: [{ type: "h"|"p"|"quote"|"todo"|"callout"|"bullet"|"divider", text, done }]`
(a todo can start with `[x] `; a plain string is a paragraph).
**Keys:** `title b1..N`
```json
{ "kind": "doc", "title": "Q4 money plan", "icon": "💸", "blocks": [{ "type": "callout", "text": "Goal: [[goal|$10,000 fund]]" }, { "type": "todo", "text": "[x] Automate savings" }] }
```

### html: trusted passthrough
**Use for** anything the templates can't show. Fields are `html` and `css`. The CSS is scoped to the page;
scripts, `@import`, `@font-face`, keyframes and remote `url()`s are dropped. Put `data-k="..."` on the targets.
`contentHeight` can be given if the page scrolls.
**Keys:** every `data-k` in `html`
```json
{ "kind": "html", "html": "<div class='box'><h2 data-k='big'>Custom</h2></div>", "css": ".box{padding:48px;font-size:34px}" }
```
