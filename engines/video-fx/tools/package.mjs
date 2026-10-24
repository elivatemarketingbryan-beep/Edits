#!/usr/bin/env node
// Builds the skills, then zips the kit for sharing (no node_modules, venv, caches,
// renders or downloaded models — the installer fetches those on the member's machine).
//
//   node tools/package.mjs            → dist/Claude-Video-FX-v<version>.zip

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const NAME = path.basename(KIT);
const version = JSON.parse(fs.readFileSync(path.join(KIT, "engine", "package.json"), "utf8")).version;
const dist = path.join(KIT, "dist");
const zip = path.join(dist, `${NAME}-v${version}.zip`);

const build = spawnSync(process.execPath, [path.join(KIT, "tools", "build-skills.mjs")], { stdio: "inherit" });
if (build.status !== 0) process.exit(1);

const include = [
  "START_HERE.md", "README.md", "LICENSE-NOTES.md", "install.mjs", "Install (Mac).command", "Install (Windows).bat",
  "engine", "skills", "examples", "docs", "tools", "skill-src",
];
const exclude = [
  "*/node_modules/*", "*/.venv/*", "*/jobs/*", "*/out/*", "*/.cache/*", "*.onnx", "*.DS_Store", "*/__pycache__/*",
];
for (const f of include) if (!fs.existsSync(path.join(KIT, f))) { console.error(`Missing ${f}`); process.exit(1); }

fs.mkdirSync(dist, { recursive: true });
fs.rmSync(zip, { force: true });
const args = ["-r", "-X", "-q", zip, ...include.map((f) => path.join(NAME, f)), "-x", ...exclude.map((e) => `${NAME}/${e.replace(/^\*\//, "*/")}`), ...exclude];
const r = spawnSync("zip", args, { cwd: path.dirname(KIT), stdio: "inherit" });
if (r.status !== 0) { console.error("zip failed"); process.exit(1); }
const mb = (fs.statSync(zip).size / 1e6).toFixed(1);
console.log(`✔ ${zip} (${mb} MB)`);
spawnSync("unzip", ["-l", zip], { stdio: ["ignore", "pipe", "inherit"] }).stdout
  ?.toString().split("\n").slice(-3).forEach((l) => l.trim() && console.log(`  ${l.trim()}`));
