#!/usr/bin/env node
// Claude Video FX engine CLI.
//
//   node fx.mjs list                                 all effects
//   node fx.mjs info <effect>                        options + default config for one effect
//   node fx.mjs doctor                               check the install
//   node fx.mjs words <video> [--detail]             timestamped transcript of the whole file (pick moments)
//   node fx.mjs prep <video> [--start s] [--end s]   trim, transcribe and (if needed) cut out the person
//   node fx.mjs render <effect> <video> [options]    render the effect to an MP4
//   node fx.mjs still <effect> <video> --at <sec>    render one PNG frame (fast look)
//   node fx.mjs sheet <video.mp4> [--fps 4]          contact sheet of a render (saved as <name>-sheet.png;
//                                                    --from/--to seconds, --cols, --width, --out)
//   node fx.mjs frame <video.mp4> --at <s>           one full-size frame of a render, for close checks
//   node fx.mjs splice <original> --segments "a.mp4@12.5,b.mp4@31" [--out f.mp4]
//                                                    put rendered effect segments back into the full video
//
// Render / still options:
//   --start <s> --end <s>        part of the source video to use (seconds; default: whole file)
//   --config <file.json | json>  effect options (see `info`); may include "captions": {...} and "window": [a, b]
//   --second <video>             second clip (zoom-through-cut), with --second-start / --second-end
//   --words <file.json>          use this transcript instead of running Whisper
//   --out <file.mp4>             output path (default: engine/out/<video>-<effect>.mp4)
//   --draft                      half resolution, faster (for previews)
//   --no-captions                turn the caption layer off
//   --whisper-model <name>       faster-whisper model (default small; small.en / medium for accuracy)
//   --vocab "Name, Brand"        words Whisper should expect (names, brands); default covers Claude/Skool
// Config may also hold "fixes": {"misheard words": "Correct Words"} to repair the transcript.

import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ROOT = path.dirname(fileURLToPath(import.meta.url));
const JOBS = path.join(ROOT, "jobs");
const OUT = path.join(ROOT, "out");
const CACHE = path.join(ROOT, ".cache");
const IS_WIN = process.platform === "win32";

let FFMPEG, FFPROBE;
try {
  FFMPEG = require("ffmpeg-static");
  FFPROBE = require("ffprobe-static").path;
} catch {
  die("Engine dependencies are missing. Run `npm install` inside the engine folder (or run the kit installer).");
}
const PY_VENV = IS_WIN ? path.join(ROOT, ".venv", "Scripts", "python.exe") : path.join(ROOT, ".venv", "bin", "python");
const PY = fs.existsSync(PY_VENV) ? PY_VENV : IS_WIN ? "python" : "python3";
const RVM = path.join(ROOT, "models", "rvm_mobilenetv3_fp32.onnx");
const W = 1080, H = 1920, FPS = 30;
export const RUNTIME_HOME = path.join(os.homedir(), ".claude-video-fx");

// ---------- small helpers ----------
function die(msg) { console.error(`\n✖ ${msg}\n`); process.exit(1); }
function log(msg) { console.log(msg); }
function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { stdio: opts.capture ? "pipe" : "inherit", encoding: "utf8", maxBuffer: 1 << 28, ...opts });
  if (r.error) die(`${path.basename(cmd)} failed to start: ${r.error.message}`);
  if (r.status !== 0) die(`${path.basename(cmd)} exited with ${r.status}${opts.capture ? `\n${r.stderr || r.stdout}` : ""}`);
  return r;
}
function parseArgs(argv) {
  const pos = [], flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith("--")) flags[key] = true;
      else { flags[key] = next; i++; }
    } else pos.push(a);
  }
  return { pos, flags };
}
const num = (v, d = null) => (v === undefined || v === true ? d : Number(v));
function slug(s) { return s.toLowerCase().replace(/\.[a-z0-9]+$/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "clip"; }
function isPlainObject(v) { return v && typeof v === "object" && !Array.isArray(v); }
function deepMerge(base, over) {
  if (!isPlainObject(base) || !isPlainObject(over)) return over === undefined ? base : over;
  const out = { ...base };
  for (const [k, v] of Object.entries(over)) out[k] = isPlainObject(v) && isPlainObject(base[k]) ? deepMerge(base[k], v) : v;
  return out;
}
function expandHome(p) { return p.startsWith("~") ? path.join(os.homedir(), p.slice(1)) : p; }

// ---------- effects registry ----------
const EFFECT_DIR = path.join(ROOT, "effects");
function loadEffects() {
  const list = fs.readdirSync(EFFECT_DIR).filter((f) => f.endsWith(".json") && !f.startsWith("_")).map((f) => JSON.parse(fs.readFileSync(path.join(EFFECT_DIR, f), "utf8")));
  return list.sort((a, b) => a.number - b.number);
}
function getEffect(id) {
  const all = loadEffects();
  const e = all.find((x) => x.id === id || String(x.number).padStart(2, "0") === id || String(x.number) === id || x.compositionId.toLowerCase() === String(id).toLowerCase());
  if (!e) die(`Unknown effect "${id}". Run \`node fx.mjs list\`.`);
  return e;
}
const CAPTION_DEFAULTS = JSON.parse(fs.readFileSync(path.join(EFFECT_DIR, "_captions.json"), "utf8"));

// ---------- probing ----------
function probe(file) {
  const r = run(FFPROBE, ["-v", "error", "-show_streams", "-show_format", "-of", "json", file], { capture: true });
  const j = JSON.parse(r.stdout);
  const v = j.streams.find((s) => s.codec_type === "video");
  if (!v) die(`No video stream in ${file}`);
  let w = v.width, h = v.height;
  const rot = Number(v.tags?.rotate ?? v.side_data_list?.find((s) => s.rotation !== undefined)?.rotation ?? 0);
  if (Math.abs(rot) % 180 === 90) [w, h] = [h, w];
  const [fn, fd] = (v.avg_frame_rate || v.r_frame_rate || "30/1").split("/").map(Number);
  const fps = fd ? fn / fd : 30;
  // the video stream's own length (the container can run longer because of AAC padding)
  const vdur = Number(v.nb_frames) > 0 ? Number(v.nb_frames) / fps : Number(v.duration) > 0 ? Number(v.duration) : Number(j.format.duration);
  return { width: w, height: h, fps, duration: Number(j.format.duration), videoDuration: vdur, hasAudio: j.streams.some((s) => s.codec_type === "audio") };
}

// ---------- clip prep (cached per source + range) ----------
function jobIdFor(video, start, end) {
  const st = fs.statSync(video);
  // "v2": bump when the way clips are prepared changes, so stale caches are never reused
  const h = createHash("sha1").update(["v3", path.resolve(video), st.size, st.mtimeMs, start ?? "", end ?? ""].join("|")).digest("hex").slice(0, 8);
  return `${slug(path.basename(video))}-${h}`;
}

export function prepClip(videoArg, { start = null, end = null, matte = false, contours = false, plate = false, words = null, whisperModel = "small", vocab = null, transcribe = true } = {}) {
  const video = path.resolve(expandHome(videoArg));
  if (!fs.existsSync(video)) die(`Video not found: ${video}`);
  const id = jobIdFor(video, start, end);
  const dir = path.join(JOBS, id);
  fs.mkdirSync(dir, { recursive: true });
  const src = path.join(dir, "source.mp4");

  if (!fs.existsSync(src)) {
    const info = probe(video);
    if (info.width > info.height) log(`  ! ${path.basename(video)} is landscape; centre-cropping to 9:16.`);
    log(`• Normalizing ${path.basename(video)}${start !== null || end !== null ? ` [${start ?? 0}s → ${end ?? "end"}]` : ""} to 1080x1920 @ 30fps`);
    const args = ["-v", "error", "-y"];
    if (start !== null) args.push("-ss", String(start));
    args.push("-i", video);
    // output-side duration: an input-side -to can overshoot by several frames on phone footage
    if (end !== null) args.push("-t", String(Math.max(0.1, end - (start ?? 0))));
    const exactFrames = end !== null ? Math.max(1, Math.round((end - (start ?? 0)) * FPS)) : null;
    if (!info.hasAudio) args.push("-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo");
    args.push(
      "-vf", `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},fps=${FPS},setsar=1`,
      ...(exactFrames ? ["-frames:v", String(exactFrames)] : []),
      "-c:v", "libx264", "-preset", "fast", "-crf", "15", "-pix_fmt", "yuv420p", "-g", "15",
      "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
    );
    if (!info.hasAudio) args.push("-map", "0:v:0", "-map", "1:a:0", "-shortest");
    args.push("-movflags", "+faststart", src + ".tmp.mp4");
    run(FFMPEG, args);
    fs.renameSync(src + ".tmp.mp4", src);
  }
  const info = probe(src);
  const frames = Math.max(1, Math.round(info.videoDuration * FPS));

  const wordsFile = path.join(dir, "words.json");
  const full = path.join(JOBS, `${jobIdFor(video, null, null)}-transcript`, "words.json");
  if (words) {
    fs.copyFileSync(path.resolve(expandHome(words)), wordsFile);
  } else if (transcribe && !fs.existsSync(wordsFile) && fs.existsSync(full) && !vocab) {
    // reuse the whole-file transcript from `fx.mjs words`: slice the range and shift it to 0
    const all = JSON.parse(fs.readFileSync(full, "utf8"));
    const s0 = start ?? 0, s1 = end ?? Infinity;
    const sliced = all.words.filter((w) => w.start >= s0 - 0.05 && w.end <= s1 + 0.05)
      .map((w) => ({ text: w.text, start: +(Math.max(0, w.start - s0)).toFixed(3), end: +(w.end - s0).toFixed(3) }));
    fs.writeFileSync(wordsFile, JSON.stringify({ language: all.language, text: sliced.map((w) => w.text).join(" "), words: sliced }, null, 1));
  } else if (transcribe && !fs.existsSync(wordsFile)) {
    log(`• Transcribing (faster-whisper ${whisperModel})`);
    const a = [path.join(ROOT, "scripts", "transcribe.py"), "--input", src, "--output", wordsFile, "--model", whisperModel];
    if (vocab) a.push("--vocab", vocab);
    run(PY, a);
  }

  const matteFile = path.join(dir, "matte.webm");
  const contourFile = path.join(dir, "contours.json");
  if ((matte || contours || plate) && (!fs.existsSync(matteFile) || (contours && !fs.existsSync(contourFile)))) {
    if (!fs.existsSync(RVM)) die(`Matting model missing at ${RVM}. Run the kit installer (it downloads the model).`);
    log(`• Cutting out the person (${frames} frames, about ${Math.ceil(frames / 9)}s on an M-series Mac)`);
    const a = [path.join(ROOT, "scripts", "matte.py"), "--input", src, "--outdir", dir, "--ffmpeg", FFMPEG, "--model", RVM,
      "--width", String(W), "--height", String(H), "--fps", String(FPS)];
    if (contours) a.push("--contours");
    run(PY, a);
  }

  const plateFile = path.join(dir, "plate.png");
  if (plate && !fs.existsSync(plateFile)) {
    log("• Building a clean background plate (the room without the person)");
    run(PY, [path.join(ROOT, "scripts", "plate.py"), "--source", src, "--matte", matteFile, "--outdir", dir, "--ffmpeg", FFMPEG,
      "--width", String(W), "--height", String(H), "--frames", String(frames)]);
  }

  const read = (f) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : null);
  const wordsJson = read(wordsFile);
  if (wordsJson?.words) wordsJson.words = joinFragments(wordsJson.words);
  const subject = read(path.join(dir, "subject.json"));
  const job = { id, dir, source: video, start, end, width: W, height: H, fps: FPS, durationInFrames: frames, duration: frames / FPS };
  fs.writeFileSync(path.join(dir, "job.json"), JSON.stringify(job, null, 2));
  return {
    ...job,
    files: {
      source: src,
      matte: fs.existsSync(matteFile) ? matteFile : null,
      contours: fs.existsSync(contourFile) ? contourFile : null,
      plate: fs.existsSync(plateFile) ? plateFile : null,
      subject: fs.existsSync(path.join(dir, "subject.json")) ? path.join(dir, "subject.json") : null,
    },
    words: wordsJson?.words ?? [],
    subject: subject?.summary ?? null,
  };
}

// ---------- config / assets ----------
function readConfig(arg) {
  if (!arg || arg === true) return {};
  const s = String(arg).trim();
  if (s.startsWith("{")) return JSON.parse(s);
  const p = path.resolve(expandHome(s));
  if (!fs.existsSync(p)) die(`Config not found: ${p}`);
  return JSON.parse(fs.readFileSync(p, "utf8"));
}
const MEDIA_EXT = /\.(png|jpe?g|webp|gif|svg|mp4|mov|webm|m4v|mp3|wav|m4a)$/i;
function collectAssets(obj, baseDir, assets) {
  if (Array.isArray(obj)) return obj.map((v) => collectAssets(v, baseDir, assets));
  if (isPlainObject(obj)) return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, collectAssets(v, baseDir, assets)]));
  if (typeof obj === "string" && MEDIA_EXT.test(obj) && !obj.startsWith("http")) {
    const p = path.resolve(baseDir, expandHome(obj));
    if (fs.existsSync(p)) {
      const name = `assets/${String(assets.size).padStart(2, "0")}-${slug(path.basename(p))}${path.extname(p).toLowerCase()}`;
      assets.set(name, p);
      return name;
    }
    if (/[\\/]/.test(obj)) log(`  ! File not found, leaving as-is: ${obj}`);
  }
  return obj;
}

// Whisper sometimes splits a word into "mind" + "-blowing"; glue such pieces back on.
function joinFragments(words) {
  const out = [];
  for (const w of words) {
    const prev = out[out.length - 1];
    if (prev && /^[-–'’]/.test(w.text) && w.start - prev.end < 0.25) { prev.text += w.text; prev.end = w.end; }
    else out.push({ ...w });
  }
  return out;
}

// "fixes": {"quad code": "Claude Code", "court": "course"} — correct misheard words.
// A multi-word "from" collapses into one caption word spanning the same time.
function applyFixes(words, fixes) {
  if (!isPlainObject(fixes)) return words;
  const n = (s) => s.toLowerCase().replace(/[^a-z0-9%$']+/g, "");
  let out = words.map((w) => ({ ...w }));
  for (const [from, to] of Object.entries(fixes)) {
    const parts = from.replace(/\s+(?=[-–'’])/g, "").split(/\s+/).map(n).filter(Boolean);
    if (!parts.length) continue;
    const next = [];
    for (let i = 0; i < out.length; i++) {
      const hit = parts.every((p, j) => out[i + j] && n(out[i + j].text) === p);
      if (hit) {
        const last = out[i + parts.length - 1];
        const trail = (last.text.match(/[.,!?;:]+$/) || [""])[0];
        next.push({ text: String(to) + trail, start: out[i].start, end: last.end });
        i += parts.length - 1;
      } else next.push(out[i]);
    }
    out = next;
  }
  return out;
}

// Mirror of src/lib/time.ts, so the CLI can show where every "@word" lands before rendering.
const normWord = (t) => t.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9%$'#]+/g, "");
function findWordTime(words, target, nth) {
  const parts = target.trim().split(/\s+/).map(normWord).filter(Boolean);
  if (!parts.length) return null;
  let seen = 0;
  for (let i = 0; i < words.length; i++) {
    if (parts.every((p, j) => words[i + j] && normWord(words[i + j].text) === p) && ++seen === nth)
      return { start: words[i].start, end: words[i + parts.length - 1].end, exact: true };
  }
  seen = 0;
  for (const w of words) if (normWord(w.text).startsWith(parts[0]) && ++seen === nth) return { start: w.start, end: w.end, exact: false };
  return null;
}
// "at", "inAt", "doneAt", "until", "punches[0].at", "window[1]"... (not "handle": "@someone")
const isTimeKey = (keyPath) => /(^|\.)(at|until|[a-z]+At)(\[\d+\])?$/.test(keyPath) || /^window\[\d\]$/.test(keyPath);
function reportTimeRefs(config, words, durSec) {
  const refs = [];
  const walk = (v, keyPath) => {
    if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${keyPath}[${i}]`));
    else if (isPlainObject(v)) {
      if (typeof v.word === "string" && Object.keys(v).every((k) => ["word", "nth", "offset", "edge"].includes(k))) refs.push([keyPath, v]);
      else for (const [k, x] of Object.entries(v)) walk(x, keyPath ? `${keyPath}.${k}` : k);
    } else if (typeof v === "string" && /^@\S/.test(v) && isTimeKey(keyPath)) refs.push([keyPath, v]);
  };
  walk(config, "");
  if (!refs.length) return;
  log("• Timing (seconds into the range):");
  for (const [key, ref] of refs) {
    let word, nth = 1, edge = "start", off = 0;
    if (typeof ref === "string") {
      const m = ref.slice(1).match(/^(.+?)(?:#(\d+))?(:end)?([+-]\d*\.?\d+)?$/);
      if (!m) { log(`  ! ${key}: can't read "${ref}"`); continue; }
      word = m[1].replace(/_/g, " "); nth = m[2] ? Number(m[2]) : 1; edge = m[3] ? "end" : "start"; off = m[4] ? Number(m[4]) : 0;
    } else { word = ref.word; nth = ref.nth ?? 1; edge = ref.edge ?? "start"; off = ref.offset ?? 0; }
    const hit = findWordTime(words, word, nth);
    const label = typeof ref === "string" ? ref : JSON.stringify(ref);
    if (!hit) log(`  ! ${key} = ${label}: "${word}"${nth > 1 ? ` #${nth}` : ""} is not spoken in this range, so the effect's default time is used. Check the spelling with \`words --detail\`.`);
    else {
      const t = Math.max(0, Math.min(durSec, (edge === "end" ? hit.end : hit.start) + off));
      log(`  ${key} = ${label} → ${t.toFixed(2)}s${hit.exact ? "" : ` (matched "${word}" as the start of a longer word)`}`);
    }
  }
}

// ---------- remotion bundle (cached) ----------
function hashTree(dirs) {
  const h = createHash("sha1");
  const walk = (d) => {
    for (const f of fs.readdirSync(d).sort()) {
      const p = path.join(d, f);
      const st = fs.statSync(p);
      if (st.isDirectory()) walk(p);
      else h.update(`${p}:${st.size}:${st.mtimeMs}`);
    }
  };
  dirs.forEach(walk);
  return h.digest("hex").slice(0, 12);
}
export async function getBundle() {
  const { bundle } = await import("@remotion/bundler");
  const key = hashTree([path.join(ROOT, "src"), EFFECT_DIR]);
  const dir = path.join(CACHE, `bundle-${key}`);
  if (fs.existsSync(path.join(dir, "index.html"))) return dir;
  log("• Bundling the Remotion project (first run after a code change, ~20s)");
  fs.mkdirSync(CACHE, { recursive: true });
  // drop bundles nobody has used for an hour (never the ones a parallel render may be copying)
  for (const old of fs.readdirSync(CACHE)) {
    const p = path.join(CACHE, old);
    if (old.startsWith("bundle-") && Date.now() - fs.statSync(p).mtimeMs > 3600e3) fs.rmSync(p, { recursive: true, force: true });
  }
  const emptyPublic = path.join(CACHE, "empty-public");
  fs.mkdirSync(emptyPublic, { recursive: true });
  const tmp = `${dir}.tmp-${process.pid}`;
  await bundle({ entryPoint: path.join(ROOT, "src", "index.ts"), outDir: tmp, publicDir: emptyPublic, enableCaching: true });
  try { fs.renameSync(tmp, dir); } catch { fs.rmSync(tmp, { recursive: true, force: true }); }
  return dir;
}
function linkOrCopy(from, to) {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  try { fs.rmSync(to, { force: true }); } catch {}
  // Hard links (not symlinks: Remotion's file server refuses to follow those); copy across drives.
  try { fs.linkSync(from, to); } catch { fs.copyFileSync(from, to); }
}
export function makeRunDir(bundleDir, files) {
  const runDir = path.join(JOBS, "_runs", `${Date.now().toString(36)}-${process.pid}`);
  fs.mkdirSync(runDir, { recursive: true });
  for (const f of fs.readdirSync(bundleDir)) {
    if (f === "public") continue;
    fs.cpSync(path.join(bundleDir, f), path.join(runDir, f), { recursive: true });
  }
  for (const [rel, abs] of files) linkOrCopy(abs, path.join(runDir, "public", rel));
  return runDir;
}
function cleanupRuns() {
  const d = path.join(JOBS, "_runs");
  if (!fs.existsSync(d)) return;
  const cutoff = Date.now() - 6 * 3600 * 1000;
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    try { if (fs.statSync(p).mtimeMs < cutoff) fs.rmSync(p, { recursive: true, force: true }); } catch {}
  }
}

// ---------- build props for an effect ----------
function buildProps(effect, flags) {
  const userCfg = readConfig(flags.config);
  const cfgBase = typeof flags.config === "string" && !flags.config.trim().startsWith("{") ? path.dirname(path.resolve(expandHome(flags.config))) : process.cwd();
  const { captions: userCaptions, window: userWindow, fixes: userFixes, ...userEffectCfg } = userCfg;
  const start = num(flags.start), end = num(flags.end);
  const needs = effect.needs || {};
  const prepOpts = { matte: !!needs.matte, contours: !!needs.contours, plate: !!needs.plate, whisperModel: flags["whisper-model"] || "small", vocab: typeof flags.vocab === "string" ? flags.vocab : null, words: typeof flags.words === "string" ? flags.words : null };

  const clips = [prepClip(flags._video, { start, end, ...prepOpts })];
  if (flags.second) clips.push(prepClip(flags.second, { start: num(flags["second-start"]), end: num(flags["second-end"]), ...prepOpts, words: null }));
  if (needs.secondClip === "required" && clips.length < 2) die(`${effect.id} needs a second clip: add --second <video>.`);

  const files = new Map();
  const propsClips = clips.map((c, i) => {
    const pre = `c${i}`;
    files.set(`${pre}/source.mp4`, c.files.source);
    if (c.files.matte) files.set(`${pre}/matte.webm`, c.files.matte);
    if (c.files.contours) files.set(`${pre}/contours.json`, c.files.contours);
    if (c.files.subject) files.set(`${pre}/subject.json`, c.files.subject);
    if (c.files.plate) files.set(`${pre}/plate.png`, c.files.plate);
    return {
      src: `${pre}/source.mp4`,
      matte: c.files.matte ? `${pre}/matte.webm` : null,
      contours: c.files.contours ? `${pre}/contours.json` : null,
      subjectFile: c.files.subject ? `${pre}/subject.json` : null,
      plate: c.files.plate ? `${pre}/plate.png` : null,
      subject: c.subject,
      words: applyFixes(c.words, userFixes),
      width: c.width, height: c.height, fps: c.fps, durationInFrames: c.durationInFrames,
    };
  });

  const assets = new Map();
  const config = collectAssets(deepMerge(effect.defaults || {}, userEffectCfg), cfgBase, assets);
  for (const [rel, abs] of assets) files.set(rel, abs);

  reportTimeRefs(userEffectCfg, propsClips.length > 1 && effect.needs?.secondClip ? propsClips.flatMap((c, i) => i === 0 ? c.words : c.words.map((w) => ({ ...w, start: w.start + propsClips[0].durationInFrames / FPS, end: w.end + propsClips[0].durationInFrames / FPS }))) : propsClips[0].words, propsClips.reduce((a, c) => a + c.durationInFrames, 0) / FPS);
  let captions = deepMerge(deepMerge(CAPTION_DEFAULTS, effect.captions || {}), userCaptions || {});
  if (flags["no-captions"]) captions = { ...captions, enabled: false };

  const total = effect.needs?.secondClip ? propsClips.reduce((s, c) => s + c.durationInFrames, 0) : propsClips[0].durationInFrames;
  let windowSec = null;
  if (Array.isArray(userWindow) && userWindow.length === 2) windowSec = [Number(userWindow[0]), Number(userWindow[1])];
  return {
    files,
    props: {
      effect: effect.id,
      clips: propsClips,
      config,
      captions,
      window: windowSec,
      output: { width: W, height: H, fps: FPS, durationInFrames: total },
      draft: !!flags.draft,
    },
  };
}

async function renderCmd(kind, effectId, video, flags) {
  const effect = getEffect(effectId);
  if (!video) die(`Usage: node fx.mjs ${kind} <effect> <video> [options]`);
  flags._video = video;
  const { files, props } = buildProps(effect, flags);
  const serveDirBundle = await getBundle();
  cleanupRuns();
  const runDir = makeRunDir(serveDirBundle, files);
  fs.writeFileSync(path.join(runDir, "props.json"), JSON.stringify(props, null, 1));
  // Headless Chrome hangs ("Waiting for root component") when its binary lives under a
  // protected folder such as ~/Desktop, and Remotion downloads it next to the working directory.
  // So the browser lives in ~/.claude-video-fx and we render from there; all paths are absolute.
  const outBase = flags.out ? path.resolve(expandHome(String(flags.out))) : null;
  fs.mkdirSync(RUNTIME_HOME, { recursive: true });
  process.chdir(RUNTIME_HOME);
  const { selectComposition, renderMedia, renderStill } = await import("@remotion/renderer");
  const composition = await selectComposition({ serveUrl: runDir, id: effect.compositionId, inputProps: props, logLevel: "error" });
  fs.mkdirSync(OUT, { recursive: true });
  const base = `${slug(path.basename(video))}${flags.start ? `-${flags.start}s` : ""}-${effect.id}`;
  const common = {
    composition, serveUrl: runDir, inputProps: props, logLevel: "error",
    timeoutInMilliseconds: 180000,
    chromiumOptions: { gl: "angle" },
    scale: flags.draft ? 0.5 : 1,
  };
  if (kind === "still") {
    const at = num(flags.at, null);
    const frame = flags.frame !== undefined ? Number(flags.frame) : Math.min(composition.durationInFrames - 1, Math.round((at ?? composition.durationInFrames / FPS / 2) * FPS));
    const out = outBase || path.join(OUT, `${base}-f${frame}.png`);
    await renderStill({ ...common, output: out, frame, imageFormat: "png" });
    log(`✔ Still (frame ${frame}) → ${out}`);
    return out;
  }
  const out = outBase || path.join(OUT, `${base}${flags.draft ? "-draft" : ""}.mp4`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  log(`• Rendering ${effect.title} → ${out}`);
  let last = -1;
  const t0 = Date.now();
  await renderMedia({
    ...common,
    codec: "h264",
    crf: flags.draft ? 23 : 17,
    pixelFormat: "yuv420p",
    audioCodec: "aac",
    audioBitrate: "192k",
    outputLocation: out,
    concurrency: Math.max(2, Math.min(8, Math.floor(os.cpus().length * 0.6))),
    onProgress: ({ progress }) => {
      if (process.stdout.isTTY) {
        const p = Math.floor(progress * 20);
        if (p !== last) { last = p; process.stdout.write(`\r  ${"█".repeat(p)}${"░".repeat(20 - p)} ${Math.round(progress * 100)}%`); }
      } else {
        const p = Math.floor(progress * 4); // logs and agents: one line per 25%
        if (p !== last) { last = p; log(`  ${p * 25}%`); }
      }
    },
  });
  if (process.stdout.isTTY) process.stdout.write("\n");
  log(`✔ Done in ${((Date.now() - t0) / 1000).toFixed(0)}s → ${out}`);
  return out;
}

// ---------- commands ----------
function listCmd() {
  const all = loadEffects();
  log("\nClaude Video FX — effects\n");
  for (const e of all) {
    const needs = [e.needs?.matte && "cut-out", e.needs?.contours && "outline", e.needs?.plate && "clean plate", e.needs?.secondClip && "2 clips"].filter(Boolean).join(", ");
    log(`  ${String(e.number).padStart(2, "0")}  ${e.id.padEnd(18)} ${e.title.padEnd(18)} ${e.summary}${needs ? `  [${needs}]` : ""}`);
  }
  log("\n  node fx.mjs info <effect>   for options\n");
}
function infoCmd(id) {
  const e = getEffect(id);
  log(`\n${String(e.number).padStart(2, "0")} ${e.title} (${e.id})\n\n${e.summary}\n`);
  if (e.description) log(`${e.description}\n`);
  if (e.options && Object.keys(e.options).length) {
    log("Options:");
    for (const [k, v] of Object.entries(e.options)) log(`  ${k.padEnd(20)} ${v}`);
    log("");
  }
  if (!e.options || !Object.keys(e.options).length) log("No options of its own: only \"captions\", \"window\" and \"fixes\".\n");
  log("Default config:");
  log(JSON.stringify({ ...e.defaults, captions: deepMerge(CAPTION_DEFAULTS, e.captions || {}) }, null, 2));
  log("");
}
// Put rendered effect segments back into the full video at their start times.
// The original (normalized) footage fills the gaps and its audio runs under everything.
function spliceCmd(videoArg, flags) {
  if (!videoArg || typeof flags.segments !== "string") die('Usage: node fx.mjs splice <original> --segments "a.mp4@12.5,b.mp4@31" [--out final.mp4]');
  const base = prepClip(videoArg, { transcribe: false });
  const total = base.durationInFrames;
  const segs = flags.segments.split(",").map((s) => s.trim()).filter(Boolean).map((s) => {
    const at = s.lastIndexOf("@");
    if (at < 1) die(`Segment "${s}" needs @<start seconds>`);
    const file = path.resolve(expandHome(s.slice(0, at)));
    if (!fs.existsSync(file)) die(`Segment not found: ${file}`);
    const start = Math.round(Number(s.slice(at + 1)) * FPS);
    if (!Number.isFinite(start)) die(`Bad start time in "${s}"`);
    return { file, start, frames: Math.round(probe(file).videoDuration * FPS) };
  }).sort((a, b) => a.start - b.start);
  const inputs = ["-i", base.files.source];
  const parts = [];
  let cur = 0, k = 0;
  segs.forEach((sg, i) => {
    if (sg.start < cur) die(`Segment ${path.basename(sg.file)} at ${sg.start / FPS}s overlaps the previous one (ends ${(cur / FPS).toFixed(2)}s)`);
    if (sg.start > cur) parts.push(`[0:v]trim=start_frame=${cur}:end_frame=${sg.start},setpts=PTS-STARTPTS[p${k++}]`);
    inputs.push("-i", sg.file);
    const len = Math.min(sg.frames, total - sg.start);
    parts.push(`[${i + 1}:v]fps=${FPS},scale=${W}:${H},setsar=1,trim=end_frame=${len},setpts=PTS-STARTPTS[p${k++}]`);
    cur = sg.start + len;
  });
  if (cur < total) parts.push(`[0:v]trim=start_frame=${cur},setpts=PTS-STARTPTS[p${k++}]`);
  const graph = `${parts.join(";")};${Array.from({ length: k }, (_, i) => `[p${i}]`).join("")}concat=n=${k}:v=1:a=0[v]`;
  const out = flags.out ? path.resolve(expandHome(String(flags.out))) : path.join(OUT, `${slug(path.basename(videoArg))}-spliced.mp4`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  log(`• Splicing ${segs.length} segment(s) into ${path.basename(videoArg)}`);
  run(FFMPEG, ["-v", "error", "-y", ...inputs, "-filter_complex", graph, "-map", "[v]", "-map", "0:a:0",
    "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", out]);
  log(`✔ ${out}`);
}

function wordsCmd(videoArg, flags) {
  if (!videoArg) die("Usage: node fx.mjs words <video> [--detail] [--vocab \"Names\"]");
  const video = path.resolve(expandHome(videoArg));
  if (!fs.existsSync(video)) die(`Video not found: ${video}`);
  const dir = path.join(JOBS, `${jobIdFor(video, null, null)}-transcript`);
  const file = path.join(dir, "words.json");
  if (!fs.existsSync(file) || flags.vocab) {
    fs.mkdirSync(dir, { recursive: true });
    log(`• Transcribing ${path.basename(video)} (faster-whisper ${flags["whisper-model"] || "small"})`);
    const a = [path.join(ROOT, "scripts", "transcribe.py"), "--input", video, "--output", file, "--model", flags["whisper-model"] || "small"];
    if (typeof flags.vocab === "string") a.push("--vocab", flags.vocab);
    run(PY, a);
    // ranges prepared earlier would keep the old transcript: drop their words so they re-slice this one
    let n = 0;
    for (const d of fs.readdirSync(JOBS)) {
      const jf = path.join(JOBS, d, "job.json");
      try {
        if (fs.existsSync(jf) && JSON.parse(fs.readFileSync(jf, "utf8")).source === video) { fs.rmSync(path.join(JOBS, d, "words.json"), { force: true }); n++; }
      } catch {}
    }
    if (n) log(`  (updated the transcript for ${n} range(s) prepared earlier)`);
  }
  const words = joinFragments(JSON.parse(fs.readFileSync(file, "utf8")).words);
  const dur = probe(video).duration;
  log(`\n${path.basename(video)} — ${dur.toFixed(1)}s, ${words.length} words. Times are seconds from the start of the file.`);
  log(`Tip: start a range ~0.1s before its first word and end it ~0.2s after its last word, so no word is clipped.\n`);
  if (flags.detail) {
    log(words.map((w) => `${w.start.toFixed(2).padStart(7)} → ${w.end.toFixed(2).padStart(6)}  ${w.text}`).join("\n"));
    return;
  }
  let line = [];
  const flush = () => {
    if (!line.length) return;
    log(`[${line[0].start.toFixed(2).padStart(6)} → ${line[line.length - 1].end.toFixed(2).padStart(6)}]  ${line.map((w) => w.text).join(" ")}`);
    line = [];
  };
  for (const w of words) {
    const prev = line[line.length - 1];
    if (prev && (w.start - prev.end > 0.6 || /[.?!]$/.test(prev.text) || line.length >= 18)) flush();
    line.push(w);
  }
  flush();
  log("");
}

function frameCmd(video, flags) {
  if (!video || flags.at === undefined) die("Usage: node fx.mjs frame <video.mp4> --at <seconds> [--out file.png]");
  const v = path.resolve(expandHome(video));
  const out = flags.out ? path.resolve(expandHome(String(flags.out))) : v.replace(/\.[a-z0-9]+$/i, "") + `-${Number(flags.at).toFixed(2)}s.png`;
  run(FFMPEG, ["-v", "error", "-y", "-ss", String(flags.at), "-i", v, "-frames:v", "1", out]);
  log(`✔ Full-size frame at ${flags.at}s → ${out}`);
}

function sheetCmd(video, flags) {
  if (!video) die("Usage: node fx.mjs sheet <video.mp4> [--fps 4] [--cols 6] [--width 270] [--from s] [--to s] [--out file.png]");
  const v = path.resolve(expandHome(video));
  const info = probe(v);
  const fps = num(flags.fps, 4), cols = num(flags.cols, 6), w = num(flags.width, 270);
  const from = num(flags.from, 0), to = num(flags.to, info.duration);
  const n = Math.max(1, Math.ceil((to - from) * fps));
  const rows = Math.ceil(n / cols);
  const out = flags.out ? path.resolve(expandHome(String(flags.out))) : v.replace(/\.[a-z0-9]+$/i, "") + "-sheet.png";
  run(FFMPEG, ["-v", "error", "-y", "-ss", String(from), "-to", String(to), "-i", v, "-vf", `fps=${fps},scale=${w}:-2,tile=${cols}x${rows}:padding=4:color=black`, "-frames:v", "1", out]);
  log(`✔ ${n} frames (${fps}/s from ${from}s, left→right, top→bottom) → ${out}`);
}

async function browserCmd() {
  fs.mkdirSync(RUNTIME_HOME, { recursive: true });
  process.chdir(RUNTIME_HOME);
  const { ensureBrowser } = await import("@remotion/renderer");
  log("• Making sure the headless browser is downloaded (~170 MB, once)");
  await ensureBrowser({ logLevel: "info" });
  log(`✔ Browser ready in ${path.join(RUNTIME_HOME, ".remotion")}`);
}

function doctorCmd() {
  const ok = (b, msg, fix) => { log(`${b ? "✔" : "✖"} ${msg}${!b && fix ? `\n    → ${fix}` : ""}`); return b; };
  let good = true;
  const major = Number(process.versions.node.split(".")[0]);
  good &= ok(major >= 20, `Node ${process.versions.node}`, "Install Node 20 or newer from nodejs.org");
  good &= ok(fs.existsSync(FFMPEG), `ffmpeg ${FFMPEG}`, "Run npm install in the engine folder");
  good &= ok(fs.existsSync(PY_VENV), `Python venv ${PY_VENV}`, "Run the kit installer (creates engine/.venv)");
  const py = spawnSync(PY, ["-c", "import faster_whisper, onnxruntime, numpy; print('ok')"], { encoding: "utf8" });
  good &= ok(py.stdout?.trim() === "ok", "Python packages (faster-whisper, onnxruntime, numpy)", `${PY} -m pip install -r requirements.txt`);
  const cv = spawnSync(PY, ["-c", "import cv2; print('ok')"], { encoding: "utf8" });
  good &= ok(cv.stdout?.trim() === "ok", "Python package opencv-python-headless", `${PY} -m pip install -r requirements.txt`);
  good &= ok(fs.existsSync(RVM), "Matting model (rvm_mobilenetv3_fp32.onnx)", "Run the kit installer, or download it into engine/models/");
  good &= ok(fs.existsSync(path.join(RUNTIME_HOME, ".remotion", "chrome-headless-shell")), `Headless browser in ${path.join(RUNTIME_HOME, ".remotion")}`, "node fx.mjs browser");
  const fxCount = loadEffects().filter((e) => e.number > 0).length;
  good &= ok(fxCount === 17, `${fxCount} effects registered`);
  log(good ? "\nAll good.\n" : "\nFix the items above, then run doctor again.\n");
  process.exit(good ? 0 : 1);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const [cmd, ...rest] = process.argv.slice(2);
  const { pos, flags } = parseArgs(rest);
  try {
    if (!cmd || cmd === "help" || cmd === "--help") { const lines = fs.readFileSync(fileURLToPath(import.meta.url), "utf8").split("\n").slice(1);
      log(lines.slice(0, lines.findIndex((l) => !l.startsWith("//"))).map((l) => l.replace(/^\/\/ ?/, "")).join("\n")); }
    else if (cmd === "list") listCmd();
    else if (cmd === "info") infoCmd(pos[0]);
    else if (cmd === "doctor") doctorCmd();
    else if (cmd === "sheet") sheetCmd(pos[0], flags);
    else if (cmd === "frame") frameCmd(pos[0], flags);
    else if (cmd === "words") wordsCmd(pos[0], flags);
    else if (cmd === "splice") spliceCmd(pos[0], flags);
    else if (cmd === "browser") await browserCmd();
    else if (cmd === "prep") {
      if (!pos[0]) die("Usage: node fx.mjs prep <video> [--start s] [--end s] [--matte] [--contours]");
      const c = prepClip(pos[0], { start: num(flags.start), end: num(flags.end), matte: !!flags.matte, contours: !!flags.contours, whisperModel: flags["whisper-model"] || "small" });
      log(`✔ Prepared ${c.id} (${c.duration.toFixed(2)}s) in ${c.dir}`);
      log(`  transcript: ${c.words.map((w) => w.text).join(" ").slice(0, 400)}`);
    } else if (cmd === "render" || cmd === "still") await renderCmd(cmd, pos[0], pos[1], flags);
    else die(`Unknown command "${cmd}". Try: list, info, doctor, words, prep, render, still, sheet, frame, splice`);
  } catch (err) {
    die(err?.stack || String(err));
  }
}
