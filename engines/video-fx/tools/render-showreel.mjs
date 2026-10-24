#!/usr/bin/env node
// Renders examples/Showreel.mp4: every effect preview played in a card under a live
// "17 video effects claude can create" list, like the reel the pack was recreated from.
// Uses the full-resolution example renders in engine/out/examples (run render-examples first).
//
//   node tools/render-showreel.mjs [--seconds 2.6]

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ENGINE = path.join(KIT, "engine");
const SRC = path.join(ENGINE, "out", "examples");
const secArg = process.argv.indexOf("--seconds");
const seconds = secArg > 0 ? Number(process.argv[secArg + 1]) : 2.6;

const { getBundle, makeRunDir, RUNTIME_HOME } = await import(path.join(ENGINE, "fx.mjs"));
const plan = JSON.parse(fs.readFileSync(path.join(KIT, "tools", "examples-plan.json"), "utf8"));
const meta = Object.fromEntries(
  fs.readdirSync(path.join(ENGINE, "effects")).filter((f) => f.endsWith(".json") && !f.startsWith("_"))
    .map((f) => JSON.parse(fs.readFileSync(path.join(ENGINE, "effects", f), "utf8"))).map((e) => [e.id, e]),
);

const files = new Map();
const items = Object.values(meta).filter((e) => e.number > 0).sort((a, b) => a.number - b.number).flatMap((e) => {
  const stem = `${String(e.number).padStart(2, "0")}-${e.id}`;
  const file = path.join(SRC, `${stem}.mp4`);
  if (!fs.existsSync(file)) { console.warn(`  ! no example render for ${e.id}, skipping`); return []; }
  files.set(`reel/${stem}.mp4`, file);
  const p = plan.find((x) => x.effect === e.id);
  return [{ src: `reel/${stem}.mp4`, title: e.title, number: e.number, from: p?.showreelFrom ?? 0.3, duration: p?.showreelSeconds ?? seconds }];
});

const bundleDir = await getBundle();
const runDir = makeRunDir(bundleDir, files);
const props = { items, headline: "video effects", accentWord: String(items.length), subline: "claude can create", accent: "#FFE14D" };
fs.mkdirSync(RUNTIME_HOME, { recursive: true });
process.chdir(RUNTIME_HOME);
const { selectComposition, renderMedia } = await import(path.join(ENGINE, "node_modules", "@remotion", "renderer", "dist", "index.js"));
const composition = await selectComposition({ serveUrl: runDir, id: "Showreel", inputProps: props, logLevel: "error" });
const out = path.join(KIT, "examples", "Showreel.mp4");
console.log(`• Rendering showreel (${items.length} effects, ${(composition.durationInFrames / 30).toFixed(1)}s)`);
await renderMedia({
  composition, serveUrl: runDir, inputProps: props, codec: "h264", crf: 20, audioCodec: "aac", outputLocation: out,
  concurrency: Math.max(2, Math.min(8, Math.floor(os.cpus().length * 0.6))), chromiumOptions: { gl: "angle" }, logLevel: "error",
  timeoutInMilliseconds: 180000,
});
console.log(`✔ ${out}`);
