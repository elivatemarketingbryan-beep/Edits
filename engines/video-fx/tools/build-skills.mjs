#!/usr/bin/env node
// Builds skills/fx-<id>/SKILL.md for every effect from:
//   engine/effects/<id>.json   (title, options, defaults, caption defaults)
//   skill-src/<id>.md          (description + effect-specific guidance)
// plus the shared engine/workflow/captions sections below. The hub skill
// (skills/video-fx/SKILL.md) is written by hand and only gets its catalog table refreshed.
//
//   node tools/build-skills.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ENGINE = path.join(KIT, "engine");
const SRC = path.join(KIT, "skill-src");
const OUT = path.join(KIT, "skills");
const captionDefaults = JSON.parse(fs.readFileSync(path.join(ENGINE, "effects", "_captions.json"), "utf8"));

const effects = fs
  .readdirSync(path.join(ENGINE, "effects"))
  .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
  .map((f) => JSON.parse(fs.readFileSync(path.join(ENGINE, "effects", f), "utf8")))
  .filter((e) => e.number > 0) // 00 "captions" is a utility, documented in the hub skill
  .filter((e) => !process.argv.includes("--partial") || fs.existsSync(path.join(SRC, `${e.id}.md`)))
  .sort((a, b) => a.number - b.number);

function parseFragment(id) {
  const file = path.join(SRC, `${id}.md`);
  if (!fs.existsSync(file)) throw new Error(`Missing skill fragment ${file}`);
  const text = fs.readFileSync(file, "utf8");
  const m = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error(`${file}: missing frontmatter`);
  const description = m[1].replace(/^description:\s*/, "").replace(/\n\s+/g, " ").trim();
  const sections = {};
  let cur = null;
  for (const line of m[2].split("\n")) {
    const h = line.match(/^## (.+)$/);
    if (h) { cur = h[1].trim(); sections[cur] = []; continue; }
    if (cur) sections[cur].push(line);
  }
  for (const k of Object.keys(sections)) sections[k] = sections[k].join("\n").trim();
  for (const need of ["What it looks like", "When to use it", "Writing the config", "Example", "Getting it right"]) {
    if (!sections[need]) throw new Error(`${file}: missing section "## ${need}"`);
  }
  return { description, sections };
}

const fmt = (v) => {
  if (v === null || v === undefined) return "`null`";
  const s = JSON.stringify(v);
  return "`" + (s.length > 60 ? s.slice(0, 57) + "…" : s) + "`";
};
const cell = (s) => String(s).replace(/\|/g, "\\|").replace(/\n/g, " ");

function optionsTable(e) {
  const keys = Array.from(new Set([...Object.keys(e.options || {}), ...Object.keys(e.defaults || {})]));
  if (!keys.length) return "_This effect has no options beyond captions._";
  const rows = keys.map((k) => `| \`${k}\` | ${fmt(e.defaults?.[k])} | ${cell(e.options?.[k] ?? "")} |`);
  return ["| Option | Default | What it does |", "|---|---|---|", ...rows].join("\n");
}

function needsLine(e) {
  const n = e.needs || {};
  const parts = [];
  if (n.matte) parts.push("cuts the speaker out of the background (person matte, cached after the first run)");
  if (n.contours) parts.push("traces the speaker's outline");
  if (n.secondClip === "required") parts.push("needs a second clip (`--second`)");
  if (n.secondClip === "optional") parts.push("can take a second clip (`--second`)");
  return parts.length ? `This effect ${parts.join(", ")}.` : "This effect works on the footage as-is (no cut-out needed), so it prepares quickly.";
}

function skill(e) {
  const { description, sections } = parseFragment(e.id);
  const cap = { ...captionDefaults, ...(e.captions || {}) };
  const num = String(e.number).padStart(2, "0");
  const second = e.needs?.secondClip ? ` [--second "<other video>" --second-start a --second-end b]` : "";
  return `---
name: fx-${e.id}
description: ${description}
---

# ${e.title} — Claude Video FX ${num}/17

${sections["What it looks like"]}

${needsLine(e)} Output: 1080×1920, 30 fps H.264 MP4 with the original audio.

## When to use it

${sections["When to use it"]}

## The engine

Every Claude Video FX skill renders through one local Remotion engine:

\`\`\`bash
ENGINE="{{FX_ENGINE}}"
\`\`\`

The first time in a session, run \`node "$ENGINE/fx.mjs" doctor\`. If any line shows ✖, stop and follow the setup steps in the \`video-fx\` skill (or tell the user to run the kit installer). Never edit files inside the engine to make a single video work; everything is controlled through the config JSON.

## Workflow

1. **Read the video.** \`node "$ENGINE/fx.mjs" words "<video>"\` prints a timestamped transcript of the whole file (cached); add \`--detail\` for every word's start → end. Pick the 3–12 second stretch the user means, or the one this effect suits best. Snap the range to speech: start ~0.1s before its first word, end ~0.2s after its last word, so nothing is clipped.
2. **Decide the deliverable.**
   - The clip *is* the moment → render that range and deliver the MP4.
   - A moment inside a longer video → render the moment's range, then put it back with \`splice\` (step 7) and deliver the full video (mention the segment file too). If the range ends before the video does, add \`"window": [0, <range length − 0.4>]\`: the effect has fully left by the window end, so keep that after the last word the graphics belong to. Captions must match the rest of the video: either caption everything (render the \`captions\` effect over the whole file with the same \`"captions"\` block as this config and splice into that render) or set \`"captions": {"enabled": false}\` here and splice into the original. The \`video-fx\` skill covers multi-effect videos.
3. **Write the config** as \`<video name> - ${e.id}.json\` next to the video (or in the folder the user names). The engine never modifies the source video; every output is a new file. Repair misheard names with \`"fixes"\` (e.g. \`{"cloud code": "Claude Code"}\`).
4. **Check one frame** before the full render:
   \`node "$ENGINE/fx.mjs" still ${e.id} "<video>" --start <s> --end <s> --config "<config.json>" --at <seconds into the clip> --out "<folder>/check.png"\`
   then look at the PNG. The first still or render of a new range also makes the transcript${e.needs?.matte ? " and the cut-out (about 1s of processing per 9 frames, cached per exact --start/--end, so settle the range first)" : ""}; after that, it's fast. The CLI prints where every \`"@word"\` lands — fix any line marked \`!\` (word not found, default time used).
5. **Render:**
   \`node "$ENGINE/fx.mjs" render ${e.id} "<video>" --start <s> --end <s> --config "<config.json>"${second} --out "<folder>/<video name> - ${e.title}.mp4"\`
6. **Review:** \`node "$ENGINE/fx.mjs" sheet "<output.mp4>" --fps 4\` writes \`<output>-sheet.png\` next to the MP4 (use \`--fps 2\` for clips over 10s, \`--from/--to\` to zoom into a moment). For small text, grab a full-size frame: \`node "$ENGINE/fx.mjs" frame "<output.mp4>" --at <s>\`. Re-render if anything is off.
7. **Splice (moments inside a longer video):** \`node "$ENGINE/fx.mjs" splice "<video>" --segments "<segment.mp4>@<start s>" --out "<folder>/<video name> - edited.mp4"\`. It re-encodes the whole video to high-quality H.264 under the original (first) audio track.
8. Tell the user the output path(s), the time range used and what the effect shows.

\`--start/--end\` cut the source down to that range (times in seconds of the original file); everything in the config is relative to the start of that range. \`"window": [from, to]\` (seconds into the range) runs the effect for only part of it, with untouched footage outside. Add \`--draft\` for a quick half-resolution preview.

## Options

${optionsTable(e)}

Run \`node "$ENGINE/fx.mjs" info ${e.id}\` to print these with the full default config.

## Writing the config

${sections["Writing the config"]}

## Example

${sections["Example"]}

## Captions

Captions are on by default, word by word, timed from the transcript. Put caption settings under \`"captions"\` in the config. This effect's defaults: style \`${cap.style}\`, centred at ${Math.round(cap.y * 100)}% of the frame height.

| Option | Default | What it does |
|---|---|---|
| \`enabled\` | \`${cap.enabled}\` | \`false\` hides captions (or pass \`--no-captions\`) |
| \`style\` | \`"${cap.style}"\` | \`pop\` white bold words with a coloured key word · \`caps\` ALL CAPS · \`twoTier\` small line + one huge key word · \`serif\` small line + big gold italic serif word with sparkles · \`tracked\` small wide-spaced caps · \`box\` words on black chips, key word on a yellow chip |
| \`y\` | \`${cap.y}\` | vertical centre of the caption, 0 = top, 1 = bottom |
| \`emphasis\` | \`${JSON.stringify(cap.emphasis)}\` | \`"auto"\` highlights the strongest word per phrase, \`"none"\`, or a list like \`["course", "editing"]\` |
| \`accent\` | \`"${cap.accent}"\` | colour of highlighted words |
| \`size\` | \`${cap.size}\` | font size in px at 1080 wide |
| \`maxWords\` / \`maxChars\` | \`${cap.maxWords}\` / \`${cap.maxChars}\` | how much text one caption phrase holds |
| \`uppercase\` | \`${cap.uppercase}\` | force capitals |

## Timing references

Any option that takes a time accepts seconds from the start of the range (\`1.5\`), seconds before the end (\`-1\`), or a spoken word: \`"@course"\` (first time it is said in the range), \`"@course#2"\` (second time), \`"@course+0.3"\` / \`"@course-0.2"\` (offset), \`"@course:end"\` (when it finishes), \`"@build_your_own"\` (a phrase; underscores for spaces). Matching ignores case and punctuation, runs after \`fixes\`, and falls back to "starts with" ("@edit" finds "editing"). Words are counted within the rendered range only. A word that isn't found silently uses the effect's default time, so read the timing lines the CLI prints.

## Getting it right

${sections["Getting it right"]}
${e.needs?.matte ? "- The cut-out follows the person. Things in front of them (a mic, a hand passing over the mic) can partly stay or partly vanish for a few frames; pick a range where the hands are clear if it matters.\n" : ""}- If the render fails, read the error: "Video not found" means a bad path; "Matting model missing" or Python errors mean the install is incomplete (run doctor); a timeout usually means the machine is overloaded, so render again with fewer apps open.
`;
}

fs.mkdirSync(OUT, { recursive: true });
let n = 0;
for (const e of effects) {
  const dir = path.join(OUT, `fx-${e.id}`);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "SKILL.md"), skill(e));
  n++;
}

// refresh the catalog table inside the hub skill
const hub = path.join(OUT, "video-fx", "SKILL.md");
if (fs.existsSync(hub)) {
  const rows = effects.map((e) => `| ${String(e.number).padStart(2, "0")} | ${e.title} | \`fx-${e.id}\` | ${e.summary} | ${e.needs?.matte ? "yes" : "no"} |`);
  const table = ["| # | Effect | Skill | What it does | Cut-out |", "|---|---|---|---|---|", ...rows].join("\n");
  const text = fs.readFileSync(hub, "utf8").replace(/<!-- catalog -->[\s\S]*?<!-- \/catalog -->/, `<!-- catalog -->\n${table}\n<!-- /catalog -->`);
  fs.writeFileSync(hub, text);
}
// docs/EFFECTS.md — the member-facing catalog
const doc = [
  "# The effects",
  "",
  "Every effect below is its own Claude Code skill. Ask for it by name (\"add the checklist effect…\") or describe what you want and Claude picks. Previews are in `examples/`.",
  "",
];
for (const e of effects) {
  const { sections } = parseFragment(e.id);
  const stem = `${String(e.number).padStart(2, "0")}-${e.id}`;
  const hasPoster = fs.existsSync(path.join(KIT, "examples", `${stem}.jpg`));
  doc.push(`## ${String(e.number).padStart(2, "0")} · ${e.title}`, "");
  if (hasPoster) doc.push(`<img src="../examples/${stem}.jpg" width="220" align="right" alt="${e.title}">`, "");
  doc.push(sections["What it looks like"], "", "**Use it when:**", sections["When to use it"], "");
  doc.push(`**Try:** *"Add the ${e.title.toLowerCase()} effect to \`my-video.mp4\` from 0:04 to 0:10."*`, "");
  doc.push(`Preview: \`examples/${stem}.mp4\` · Skill: \`fx-${e.id}\`${e.needs?.matte ? " · cuts you out of the background" : ""}`, "", "---", "");
}
fs.writeFileSync(path.join(KIT, "docs", "EFFECTS.md"), doc.join("\n"));
console.log(`Built ${n} effect skills in ${OUT} and docs/EFFECTS.md`);
