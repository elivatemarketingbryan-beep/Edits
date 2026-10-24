#!/usr/bin/env node
// Renders the preview for every effect listed in tools/examples-plan.json into examples/:
//   examples/<NN>-<id>.mp4          720x1280 preview (small enough to ship in the zip)
//   examples/<NN>-<id>.json         the exact config used
//   examples/<NN>-<id>.jpg          poster frame
//
//   node tools/render-examples.mjs [effect-id ...]

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ENGINE = path.join(KIT, "engine");
const EX = path.join(KIT, "examples");
const require = createRequire(path.join(ENGINE, "package.json"));
const FFMPEG = require("ffmpeg-static");
const plan = JSON.parse(fs.readFileSync(path.join(KIT, "tools", "examples-plan.json"), "utf8"));
const only = new Set(process.argv.slice(2));
const meta = Object.fromEntries(
  fs.readdirSync(path.join(ENGINE, "effects")).filter((f) => f.endsWith(".json") && !f.startsWith("_"))
    .map((f) => JSON.parse(fs.readFileSync(path.join(ENGINE, "effects", f), "utf8"))).map((e) => [e.id, e]),
);

fs.mkdirSync(EX, { recursive: true });
const tmp = path.join(ENGINE, "out", "examples");
fs.mkdirSync(tmp, { recursive: true });
for (const item of plan) {
  if (only.size && !only.has(item.effect)) continue;
  const e = meta[item.effect];
  const stem = `${String(e.number).padStart(2, "0")}-${e.id}`;
  const cfgFile = path.join(EX, `${stem}.json`);
  fs.writeFileSync(cfgFile, JSON.stringify(item.config ?? {}, null, 2) + "\n");
  const full = path.join(tmp, `${stem}.mp4`);
  const args = [path.join(ENGINE, "fx.mjs"), "render", e.id, item.video, "--config", cfgFile, "--out", full];
  if (item.start !== undefined) args.push("--start", String(item.start));
  if (item.end !== undefined) args.push("--end", String(item.end));
  if (item.second) args.push("--second", item.second.video, "--second-start", String(item.second.start), "--second-end", String(item.second.end));
  console.log(`\n=== ${stem}`);
  const r = spawnSync(process.execPath, args, { stdio: "inherit" });
  if (r.status !== 0) { console.error(`✖ ${stem} failed`); process.exitCode = 1; continue; }
  spawnSync(FFMPEG, ["-v", "error", "-y", "-i", full, "-vf", "scale=720:1280", "-c:v", "libx264", "-preset", "slow", "-crf", "24", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", path.join(EX, `${stem}.mp4`)], { stdio: "inherit" });
  spawnSync(FFMPEG, ["-v", "error", "-y", "-ss", String(item.poster ?? 1.5), "-i", full, "-frames:v", "1", "-vf", "scale=540:960", "-q:v", "3", path.join(EX, `${stem}.jpg`)], { stdio: "inherit" });
  console.log(`✔ examples/${stem}.mp4`);
}
