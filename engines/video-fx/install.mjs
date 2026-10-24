#!/usr/bin/env node
// Claude Video FX installer.
//
//   node install.mjs              install everything and copy the skills into ~/.claude/skills
//   node install.mjs --skills     only (re)copy the skills (after moving the kit folder)
//   node install.mjs --uninstall  remove the skills and the browser cache (keeps this folder)
//
// Safe to run again: finished steps are skipped.

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const KIT = path.dirname(fileURLToPath(import.meta.url));
const ENGINE = path.join(KIT, "engine");
const SKILLS_SRC = path.join(KIT, "skills");
const SKILLS_DST = path.join(os.homedir(), ".claude", "skills");
const RUNTIME_HOME = path.join(os.homedir(), ".claude-video-fx");
const IS_WIN = process.platform === "win32";
const MODEL_URL = "https://github.com/PeterL1n/RobustVideoMatting/releases/download/v1.0.0/rvm_mobilenetv3_fp32.onnx";
const MODEL = path.join(ENGINE, "models", "rvm_mobilenetv3_fp32.onnx");
const VENV_PY = IS_WIN ? path.join(ENGINE, ".venv", "Scripts", "python.exe") : path.join(ENGINE, ".venv", "bin", "python");
const args = new Set(process.argv.slice(2));

const step = (n, msg) => console.log(`\n[${n}] ${msg}`);
const ok = (msg) => console.log(`    ✔ ${msg}`);
function fail(msg) {
  console.error(`\n✖ ${msg}\n`);
  process.exit(1);
}
function sh(cmd, a, opts = {}) {
  const r = spawnSync(cmd, a, { stdio: "inherit", shell: IS_WIN, ...opts });
  return r.status === 0;
}

function installSkills() {
  fs.mkdirSync(SKILLS_DST, { recursive: true });
  const enginePath = ENGINE.split(path.sep).join("/");
  let n = 0;
  for (const name of fs.readdirSync(SKILLS_SRC)) {
    if (!(name === "video-fx" || name.startsWith("fx-"))) continue;
    const from = path.join(SKILLS_SRC, name, "SKILL.md");
    if (!fs.existsSync(from)) continue;
    const dir = path.join(SKILLS_DST, name);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "SKILL.md"), fs.readFileSync(from, "utf8").replaceAll("{{FX_ENGINE}}", enginePath));
    n++;
  }
  ok(`${n} skills copied to ${SKILLS_DST} (engine: ${enginePath})`);
}

if (args.has("--uninstall")) {
  for (const name of fs.existsSync(SKILLS_DST) ? fs.readdirSync(SKILLS_DST) : []) {
    if (name === "video-fx" || name.startsWith("fx-")) fs.rmSync(path.join(SKILLS_DST, name), { recursive: true, force: true });
  }
  fs.rmSync(RUNTIME_HOME, { recursive: true, force: true });
  console.log("Removed the Claude Video FX skills and ~/.claude-video-fx. Delete this folder to remove the engine.");
  process.exit(0);
}

console.log("Claude Video FX — installer");
const major = Number(process.versions.node.split(".")[0]);
if (major < 20) fail(`Node ${process.versions.node} is too old. Install Node 20 or newer from https://nodejs.org and run this again.`);

if (args.has("--skills")) {
  step(1, "Copying skills");
  installSkills();
  process.exit(0);
}

// 1. Node packages
step(1, "Installing the engine's Node packages (Remotion, ffmpeg)");
if (fs.existsSync(path.join(ENGINE, "node_modules", "remotion")) && fs.existsSync(path.join(ENGINE, "node_modules", "ffmpeg-static"))) ok("already installed");
else if (!sh(IS_WIN ? "npm.cmd" : "npm", ["install", "--no-audit", "--no-fund"], { cwd: ENGINE })) fail("npm install failed. Check your internet connection and run this again.");
else ok("done");

// 2. Python environment
step(2, "Setting up Python (faster-whisper for transcripts, onnxruntime + OpenCV for the cut-out)");
if (!fs.existsSync(VENV_PY)) {
  const candidates = IS_WIN ? [["py", ["-3"]], ["python", []], ["python3", []]] : [["python3", []], ["python", []]];
  let made = false;
  for (const [cmd, pre] of candidates) {
    const v = spawnSync(cmd, [...pre, "-c", "import sys; print('%d.%d' % sys.version_info[:2])"], { encoding: "utf8", shell: IS_WIN });
    if (v.status !== 0) continue;
    const [maj, min] = v.stdout.trim().split(".").map(Number);
    if (maj !== 3 || min < 9) { console.log(`    ${cmd} is Python ${v.stdout.trim()}; need 3.9 or newer`); continue; }
    if (sh(cmd, [...pre, "-m", "venv", path.join(ENGINE, ".venv")])) { made = true; break; }
  }
  if (!made) fail("Couldn't find Python 3.9+ to create the environment. Install Python from https://python.org (Windows: tick \"Add to PATH\") and run this again.");
}
if (!sh(VENV_PY, ["-m", "pip", "install", "--quiet", "--upgrade", "pip"])) fail("pip upgrade failed");
if (!sh(VENV_PY, ["-m", "pip", "install", "--quiet", "-r", path.join(ENGINE, "requirements.txt")])) fail("Installing Python packages failed. See the error above.");
ok("Python packages installed");

// 3. Matting model
step(3, "Downloading the person-matting model (Robust Video Matting, 15 MB)");
if (fs.existsSync(MODEL) && fs.statSync(MODEL).size > 10e6) ok("already downloaded");
else {
  fs.mkdirSync(path.dirname(MODEL), { recursive: true });
  const res = await fetch(MODEL_URL);
  if (!res.ok) fail(`Model download failed (${res.status}). Download ${MODEL_URL} into ${path.dirname(MODEL)} and run this again.`);
  fs.writeFileSync(MODEL, Buffer.from(await res.arrayBuffer()));
  ok("done");
}

// 4. Headless browser
step(4, "Downloading the headless browser Remotion renders with (~170 MB, once)");
if (!sh(process.execPath, [path.join(ENGINE, "fx.mjs"), "browser"])) fail("Browser download failed. Check your connection and run this again.");

// 5. Whisper weights (first transcription would otherwise download them mid-task)
step(5, "Warming up Whisper (downloads the speech model the first time, ~480 MB)");
{
  const ff = path.join(ENGINE, "node_modules", "ffmpeg-static", IS_WIN ? "ffmpeg.exe" : "ffmpeg");
  const wav = path.join(os.tmpdir(), "claude-video-fx-silence.wav");
  const out = path.join(os.tmpdir(), "claude-video-fx-silence.json");
  sh(ff, ["-v", "error", "-y", "-f", "lavfi", "-i", "anullsrc=r=16000:cl=mono", "-t", "1", wav]);
  if (!sh(VENV_PY, [path.join(ENGINE, "scripts", "transcribe.py"), "--input", wav, "--output", out])) fail("Whisper couldn't start. See the error above.");
  ok("Whisper ready");
}

// 6. Skills
step(6, "Installing the skills for Claude Code");
installSkills();

// 7. Check
step(7, "Checking the install");
if (!sh(process.execPath, [path.join(ENGINE, "fx.mjs"), "doctor"])) fail("Something is still missing (see above).");
console.log(`
All set. Restart Claude Code, then ask it things like:
  "Add the cover story effect to the first 6 seconds of ~/Movies/my-reel.mp4"
  "Which video effects do I have?"
`);
