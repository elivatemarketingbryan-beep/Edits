// Locates the external binaries the engine needs, so scripts work whether the
// user installed FFmpeg system-wide or only has the engine's npm packages.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

export const ENGINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const ROOT = path.resolve(ENGINE, '..');
const require = createRequire(import.meta.url);

function onPath(cmd) {
  const r = spawnSync(process.platform === 'win32' ? 'where' : 'which', [cmd], { encoding: 'utf8' });
  return r.status === 0 ? r.stdout.split(/\r?\n/)[0].trim() : null;
}

function fromPackage(pkg) {
  try { const p = require(pkg); return typeof p === 'string' ? p : p.path; } catch { return null; }
}

// ffmpeg-static (FFmpeg 6) comes before PATH: HyperFrames' audio mix fails on FFmpeg 4.x,
// which is what older system installs and @ffmpeg-installer ship.
export function ffmpegPath() {
  const local = path.join(ENGINE, 'bin', process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');
  const c = [process.env.FFMPEG_PATH, fs.existsSync(local) && local, fromPackage('ffmpeg-static'), onPath('ffmpeg')];
  for (const p of c) if (p && fs.existsSync(p)) return p;
  throw new Error('FFmpeg not found. Run: npm --prefix engine run setup');
}

export function ffprobePath() {
  const local = path.join(ENGINE, 'bin', process.platform === 'win32' ? 'ffprobe.exe' : 'ffprobe');
  const c = [process.env.FFPROBE_PATH, fs.existsSync(local) && local, fromPackage('@ffprobe-installer/ffprobe'), onPath('ffprobe')];
  for (const p of c) if (p && fs.existsSync(p)) return p;
  return null;
}

// Environment for every HyperFrames call: our binaries, no telemetry, no global skill installs.
export function hfEnv() {
  const env = { ...process.env, HYPERFRAMES_SKIP_SKILLS: '1', HYPERFRAMES_NO_TELEMETRY: '1', DO_NOT_TRACK: '1' };
  try { env.HYPERFRAMES_FFMPEG_PATH = ffmpegPath(); } catch {}
  const probe = ffprobePath();
  if (probe) env.HYPERFRAMES_FFPROBE_PATH = probe;
  return env;
}

export function hfBin() {
  return path.join(ENGINE, 'node_modules', 'hyperframes', 'bin', 'hyperframes.mjs');
}

// Runs the HyperFrames CLI. Returns { status, stdout, stderr }; inherit:true streams to the terminal.
export function runHF(args, { cwd = ENGINE, inherit = false, timeout } = {}) {
  const r = spawnSync(process.execPath, [hfBin(), ...args], {
    cwd, env: hfEnv(), encoding: 'utf8', stdio: inherit ? 'inherit' : 'pipe', timeout, maxBuffer: 1 << 28,
  });
  return { status: r.status, stdout: r.stdout || '', stderr: r.stderr || '' };
}

// Paths the user types are relative to where they ran npm, not to engine/.
export function userPath(p) {
  return path.resolve(process.env.INIT_CWD || process.cwd(), p);
}

// Decode any audio/video file to mono float32 PCM.
export function decodeAudio(file, rate = 16000) {
  const buf = execFileSync(ffmpegPath(), ['-v', 'error', '-i', file, '-vn', '-ac', '1', '-ar', String(rate), '-f', 'f32le', 'pipe:1'], { maxBuffer: 1 << 30 });
  return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
}

export function readJSON(p, fallback) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return fallback; }
}

export function writeJSON(p, data) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
}
