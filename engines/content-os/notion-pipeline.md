# Notion Content Pipeline — Schema Reference

Live schema for YOUR Notion content database. **Pure reference, no execution logic.** Any skill
that reads or writes the pipeline (scriptwriter, yt-description, the status-sync rules in
CLAUDE.md) loads this file for IDs and property shapes.

> Status: **live**

---

## Identity

| Field | Value |
|-------|-------|
| **Database name** | Content Database (TEMPLATE) |
| **Database ID** | `671789bbffea838dae9e019dc55a9f78` |
| **Data source ID** | `b25789bb-ffea-8346-8ef9-87d238345cb6` (differs from the DB ID; the parent for `notion-create-pages`, and the search scope as `data_source_url: collection://b25789bb-ffea-8346-8ef9-87d238345cb6`) |
| **Parent page** | Elivate Marketing Content (`28b789bbffea83a78c1d819cb66c203c`) |
| **URL** | https://app.notion.com/p/671789bbffea838dae9e019dc55a9f78 |

**This is the real, pre-existing database** — it was already sitting under the Elivate Marketing
Content page (built before this session, with a native `status` type, a "Reels" board view, a
"Youtube" board view, a Calendar, and Consistency/Monthly-Post-Volume charts) and is the one to use
going forward. An earlier session mistakenly built a separate "Content Pipeline" database from
scratch (ID `a14dc4010f6c4b0abb73881483eaa43a`) before this template was noticed; all pages were
moved out of it into this one, and that database is now unused — safe to delete once confirmed
empty, or leave it, the creator's call.

### Second pipeline: the personal account

Bryan's personal Instagram (lifestyle of a marketer, audience-building; see `platforms.md`) has its
own database so the two accounts never mix. **Everything for the personal account goes here; the
contractor account stays in the database above.**

| Field | Value |
|-------|-------|
| **Database name** | Personal Content Pipeline |
| **Database ID** | `a5858bbca806476987e2f1070f7094ad` |
| **Data source ID** | `2681fcbe-9a1c-4d38-acb3-3bf490293f67` (parent for `notion-create-pages`; search scope `collection://2681fcbe-9a1c-4d38-acb3-3bf490293f67`) |
| **Parent page** | Elivate Marketing Content (`28b789bbffea83a78c1d819cb66c203c`) |
| **URL** | https://app.notion.com/p/a5858bbca806476987e2f1070f7094ad |
| **Views** | Board (by Status), Calendar (by Post Date), By pillar |

Same Status flow and the same Title / Post Date / Source URL / Raw Footage / Edited Video / Studio job
properties as above. Different:

| Name | Type | Notes |
|------|------|-------|
| **Pillar** | `select` | The topic, required on every idea: `Building from zero` · `Day in the life` · `Faith & purpose` · `Family & roots` · `Lessons from building` · `Milestones & wins` (what each covers: `platforms.md`) |
| **Format** | `select` | `Short clip` (under 20 s, little talking) · `Carousel` · `Talking reel` · `Vlog` |
| **Edit style** | `select` | Only the personal-fit Video Studio formats: Personal reel, Vlog, Natural story, Cinematic type, B-roll and stacked text, Fitted captions, Image cluster, Visual essay, TikTok style, Yap and show |
| **Script shape** | `select` | `Story` · `Relatable thought` · `Caption-led` · `Explainer` · `Proof` |
| **Caption** | `text` | Short clips and carousels carry the story in the caption; write it here |

No `Type` or `Status 1`. Icon on create: 🌱.

### If this database is ever moved/recreated

Re-fetch it with `notion-fetch`, copy the Database ID, Data source ID, and URL into the table above.
Views (Board grouped by Status, Calendar by Post Date) can be added with `notion-create-view`.

---

## Properties

| Name | Type | Notes |
|------|------|-------|
| **Title** | `title` | Page title (the working title of the video) |
| **Status** | `status` (native) | Pipeline stage, see flow below. Options: Idea, Scripting, Filming, Editing, Review, Ready, Posted, Archived |
| **Format** | `select` | `Short-form` · `Long-form` |
| **Edit style** | `select` | The exact Video Studio format (all 32 catalog names, e.g. `Ranking`, `Explainer panel`, `Tips breakdown`). Set by the scriptwriter in Step 1b. |
| **Script shape** | `select` | `Explainer` · `List / ranking` · `Comparison` · `Story` · `Proof` · `Caption-led` · `Relatable thought` · `Long form` (Video Studio `styles/SCRIPT-SHAPES.md`). Set by the scriptwriter. |
| **Studio job** | `text` | Video Studio job id (`jobs/<id>`), written by Video Studio when the filmed clip is matched to this script. |
| **Status 1** | `select` | Leftover from the template; not used by any skill. |
| **Type** | `multi_select` | Funnel placement, tagged by the creator by hand: `TOF` · `MOF` · `BOF` · `Brainrot` · `Viral` · `Conversion` (skills never set this) |
| **Post Date** | `date` | YYYY-MM-DD, set when status flips to Posted |
| **Source URL** | `url` | The source video being recreated/twisted (the format model). Set on twist picks at scripting time. |
| **Raw Footage** | `url` | Link to the raw clips (Drive, Frame.io, etc). Filled after filming, not on script creation. |
| **Edited Video** | `url` | Link to the final edit |
| **Created time / Created by** | `created_time` / `created_by` | Auto |
| **Page last edited time / by** | `last_edited_time` / `last_edited_by` | Auto; use for staleness checks |

---

## Status flow

```
Idea → Scripting → Filming → Editing → Review → Ready → Posted → Archived
```

Note: this template uses **Filming** where the general CLAUDE.md pipeline doc describes "To Edit" —
follow this database's actual options, they're the source of truth.

| Group | Statuses |
|-------|----------|
| **To-do** | Idea |
| **In progress** | Scripting, Filming, Editing, Review, Ready |
| **Complete** | Posted, Archived |

`Ready` is the handoff stage: the edit is done and approved, waiting to publish. Posting goes
through the `auto-poster` skill (Zernio), which takes a video path/URL directly and does **not**
read Notion itself; the session that ran it flips `Ready → Posted` and sets `Post Date` right after
a successful post (standing rule in CLAUDE.md, "Videos live in Notion"). There is intentionally no
"Scheduled" status.

### Who moves the status (with Video Studio connected)

| Status | Set by |
|---|---|
| Idea | research / ideation skills, or the creator |
| Scripting | `scriptwriter` (with Edit style + Script shape) |
| Filming | the creator (or scriptwriter when told "it's filmed") |
| Editing | Video Studio, when the clip is matched to its script and the edit starts |
| Review | Video Studio, when the preview is ready |
| Ready | Video Studio, when the final is rendered (also sets **Edited Video**) |
| Posted | the session that ran `auto-poster` |

Views: the default boards plus **By script shape** (board grouped by Script shape, then status).

---

## Property write shapes

The MCP `notion-create-pages` / `notion-update-page` tools take a flat property map keyed by the
property NAME (`{"Title": "...", "Status": "Scripting", "Format": "Short-form", "Source URL": "https://..."}`),
plus markdown `content` for the page body. Set an emoji icon on every create (📦 for videos).
Leave `Type` blank; the creator tags funnel placement by hand.

---

## Reading and writing (Notion MCP only, no CLI, no token)

- **Resolve a video by name → `notion-search`** with one distinctive keyword from the title and
  `data_source_url` = `collection://<Data source ID>` (the data source, not the database), then `notion-fetch` the hit for its status
  and body. Title matching is fuzzy: users won't type exact titles; if several pages plausibly match,
  list them and ask.
- **Create → `notion-create-pages`** with the Data source ID as the parent (NOT the Database ID).
- **Update status / dates → `notion-update-page`.**
- **Pagination:** any list path caps at 100 results; check `has_more` and continue until exhausted.

---

## When to update this file

Re-fetch and rewrite whenever a property is added/renamed or its options change, a status is added,
or the database is moved/recreated. Quick re-verify: "Re-fetch the content DB with `notion-fetch`
(the Database ID above) and diff against `notion-pipeline.md`."
