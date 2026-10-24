#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {validatePlan, publicAssetPath} from '../lib/validate.mjs';
import {normalizeTranscript, parseSubtitles} from '../lib/transcript.mjs';
import {mapTranscriptToCaptions} from '../lib/timeline.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');
const args = process.argv.slice(2);
const command = args.shift();
const flags = new Map();
const positionals = [];
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--')) {
    const key = args[i].slice(2);
    if (['draft', 'overwrite'].includes(key)) flags.set(key, true);
    else if (args[i + 1] && !args[i + 1].startsWith('--')) flags.set(key, args[++i]);
    else throw new Error(`Missing value for --${key}`);
  } else positionals.push(args[i]);
}

function run(executable, argv, {capture = true, includeStderr = false, cwd = ROOT} = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, argv, {cwd, stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit'});
    let stdout = '', stderr = '';
    child.stdout?.on('data', data => { stdout += data; });
    child.stderr?.on('data', data => { stderr = (stderr + data).slice(-14000); });
    child.once('error', reject);
    child.once('close', code => code === 0 ? resolve(includeStderr ? {stdout, stderr} : stdout) : reject(new Error(`${path.basename(executable)} failed (${code}).\n${stderr}`)));
  });
}

async function binaries() {
  const ffmpeg = (await import('ffmpeg-static')).default;
  const ffprobe = (await import('ffprobe-static')).default.path;
  if (!ffmpeg || !ffprobe) throw new Error('FFmpeg binaries are unavailable on this platform. Install dependencies on macOS, Windows or Linux.');
  return {ffmpeg, ffprobe};
}
async function probe(file) {
  const {ffprobe} = await binaries();
  return JSON.parse(await run(ffprobe, ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', file]));
}
const json = async file => JSON.parse(await fs.readFile(file, 'utf8'));
const writeJson = (file, value) => fs.writeFile(file, JSON.stringify(value, null, 2) + '\n');
const localFile = value => {
  if (!value || /^[a-z][a-z\d+.-]*:\/\//i.test(value)) throw new Error('Provide a local file path. Remote URLs are not ingested.');
  return path.resolve(value);
};
function jobDirectory() {
  const slug = flags.get('job');
  if (typeof slug !== 'string' || !/^[a-z0-9][a-z0-9_-]{0,63}$/.test(slug)) throw new Error('Use --job <slug> containing lowercase letters, digits, underscores or hyphens.');
  return {slug, dir: path.join(PUBLIC, 'jobs', slug)};
}
function showValidation(result) {
  for (const warning of result.warnings) console.warn(`Warning: ${warning}`);
  for (const error of result.errors) console.error(`Error: ${error}`);
  if (result.errors.length) throw new Error(`Plan validation failed with ${result.errors.length} error(s).`);
}
async function loadPlan(file) {
  const filename = localFile(file);
  const plan = await json(filename);
  const result = validatePlan(plan, {publicDir: PUBLIC});
  showValidation(result);
  return {filename, plan, validation: result};
}
async function outputDirectory(filename) {
  const selected = flags.get('out');
  const stem = path.basename(filename, path.extname(filename)).replace(/[^a-zA-Z0-9_-]/g, '-');
  const dir = selected ? path.resolve(selected) : path.join(ROOT, 'renders', `${stem}-${new Date().toISOString().replace(/[:.]/g, '-')}`);
  try {
    if ((await fs.readdir(dir)).length) throw new Error(`Output directory is not empty: ${dir}. Choose another --out directory.`);
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  await fs.mkdir(dir, {recursive: true});
  return dir;
}

async function doctor() {
  const {ffmpeg, ffprobe} = await binaries();
  console.log(`Node ${process.version} on ${process.platform}/${process.arch}`);
  if (Number(process.versions.node.split('.')[0]) < 22) throw new Error('Node 22 or newer is required.');
  console.log((await run(ffmpeg, ['-version'])).split('\n')[0]);
  console.log((await run(ffprobe, ['-version'])).split('\n')[0]);
  await import('@remotion/bundler');
  const renderer = await import('@remotion/renderer');
  console.log('Remotion bundler and renderer: available');
  if (flags.get('browser') === 'download') {
    await renderer.ensureBrowser();
    console.log('Chromium: ready');
  } else console.log('First render may download Chromium. Preinstall it with: npm run editor -- doctor --browser download');
  try {
    console.log((await run(flags.get('python') || 'python3', ['--version'])).trim());
    await run(flags.get('python') || 'python3', ['-c', 'import faster_whisper']);
    console.log('Optional local faster-whisper: available');
  } catch { console.log('Optional local transcription is not configured. Timestamped JSON or SRT import works without it.'); }
  console.log('Required dependencies are ready.');
}

async function ingest() {
  const input = localFile(positionals[0]);
  if (!(await fs.stat(input)).isFile()) throw new Error('Input is not a regular file.');
  const {slug, dir} = jobDirectory();
  try { await fs.access(dir); throw new Error(`Job already exists: ${dir}. Choose a new --job name.`); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const original = await probe(input);
  const video = original.streams.find(stream => stream.codec_type === 'video' && !stream.disposition?.attached_pic);
  if (!video) throw new Error('Input has no video stream.');
  const hdr = ['smpte2084', 'arib-std-b67'].includes(video.color_transfer);
  if (hdr) console.warn('Warning: HDR source detected. This initial pipeline does not tone-map HDR to SDR. Convert to an SDR master first if the normalized preview has incorrect colors.');
  await fs.mkdir(dir, {recursive: true});
  const {ffmpeg} = await binaries();
  const target = path.join(dir, 'source.mp4');
  console.log('Normalizing source to 30 fps H.264. Large files can take several minutes.');
  try {
    await run(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-n', '-i', input, '-map', `0:${video.index}`, '-map', '0:a:0?', '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2,fps=30', '-c:v', 'libx264', '-preset', 'fast', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2', '-sn', '-dn', '-movflags', '+faststart', target]);
    const normalized = await probe(target);
    const stream = normalized.streams.find(s => s.codec_type === 'video');
    const hasAudio = normalized.streams.some(s => s.codec_type === 'audio');
    const duration = Number(stream.duration || normalized.format.duration);
    const durationInFrames = Number(stream.nb_frames) || Math.round(duration * 30);
    if (!Number.isFinite(durationInFrames) || durationInFrames < 1) throw new Error('Could not determine source duration.');
    const metadata = {version: 1, job: slug, originalFilename: path.basename(input), createdAt: new Date().toISOString(), source: {path: `jobs/${slug}/source.mp4`, durationInFrames, width: stream.width, height: stream.height, hasAudio}, durationSeconds: durationInFrames / 30, fps: 30, audio: hasAudio ? `jobs/${slug}/audio.wav` : null, originalVideo: {width: video.width, height: video.height, codec: video.codec_name, colorTransfer: video.color_transfer ?? null}, warnings: hdr ? ['HDR source detected. No automatic HDR-to-SDR tone mapping was performed; review normalized colors.'] : [], transcriptStatus: 'not-imported'};
    await writeJson(path.join(dir, 'metadata.json'), metadata);
    if (hasAudio) await run(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-n', '-i', target, '-t', String(durationInFrames / 30), '-vn', '-ac', '1', '-ar', '16000', '-c:a', 'pcm_s16le', path.join(dir, 'audio.wav')]);
    await run(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-n', '-i', target, '-vf', `fps=${12 / duration},scale=240:-2,tile=4x3:padding=8:margin=8:color=0x111319`, '-frames:v', '1', '-q:v', '3', path.join(dir, 'contact-sheet.jpg')]);
    const template = {version: 1, title: slug, fps: 30, width: 1080, height: 1920, source: metadata.source, brand: {name: '', accent: '#4057DB', background: '#FFFFFF', surface: '#FFFFFF', text: '#171B24', muted: '#657080'}, edit: {cuts: [{startFrame: 0, endFrame: durationInFrames, reason: 'Initial complete source; review content before deciding cuts.'}]}, beats: [{id: 'beat-01', from: 0, durationInFrames, layout: 'split', splitRatio: 0.5, focalPoint: {x: 0.5, y: 0.5}, headline: '[WRITE A CONTENT-SPECIFIC HEADLINE]', visual: {type: 'word', word: 'EDIT ME'}, rationale: 'Scaffold only. Replace this beat with a content-specific editorial decision after reviewing the video and transcript.'}], captions: [], notes: ['UNREVIEWED SCAFFOLD. This is not an automatic editorial plan.', 'Review source contact sheet, transcript and speaker framing. Design a varied sequence of meaningful visuals.', 'Colors here are scaffold placeholders, not a house palette. Choose medium, composition, material and colors per beat from meaning and reference evidence.']};
    await writeJson(path.join(dir, 'edit-plan.template.json'), template);
    console.log(`Ingested ${durationInFrames} frames (${(durationInFrames / 30).toFixed(2)}s), ${stream.width}×${stream.height}, ${hasAudio ? 'with audio' : 'silent'}.`);
    console.log(`Job: ${dir}\nReview contact-sheet.jpg. Import a transcript, then author a plan from edit-plan.template.json.`);
  } catch (error) {
    await writeJson(path.join(dir, 'ingest-error.json'), {error: error.message, originalFilename: path.basename(input)}).catch(() => {});
    throw new Error(`${error.message}\nPartial job retained for diagnosis: ${dir}. Choose a new job slug to retry.`);
  }
}

async function importTranscript() {
  const file = localFile(positionals[0]);
  const {dir} = jobDirectory();
  const metadata = await json(path.join(dir, 'metadata.json'));
  const raw = await fs.readFile(file, 'utf8');
  const transcript = /\.(srt|vtt)$/i.test(file) ? parseSubtitles(raw) : normalizeTranscript(JSON.parse(raw));
  if (transcript.segments.at(-1).end > metadata.durationSeconds + 0.25) throw new Error('Transcript extends past the normalized source. Import timestamps for the original full source, not a different cut.');
  const destination = path.join(dir, 'transcript.json');
  if (!flags.get('overwrite')) {
    try { await fs.access(destination); throw new Error('Transcript already exists. Use --overwrite to replace it.'); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  await writeJson(destination, transcript);
  await writeJson(path.join(dir, 'metadata.json'), {...metadata, transcriptStatus: 'imported', transcriptTiming: transcript.timing});
  console.log(`Imported ${transcript.segments.length} ${transcript.timing}-timed segments: ${destination}`);
  if (transcript.timing !== 'word') console.log('Phrase timing will display whole phrases. No word timestamps are fabricated.');
}

async function transcribe() {
  const {dir} = jobDirectory();
  const metadata = await json(path.join(dir, 'metadata.json'));
  if (!metadata.source.hasAudio) throw new Error('This source has no audio to transcribe.');
  const output = path.join(dir, 'transcript.local.json');
  const argv = [path.join(ROOT, 'scripts', 'transcribe.py'), '--audio', path.join(dir, 'audio.wav'), '--output', output, '--model', flags.get('model') || 'small'];
  if (flags.get('language')) argv.push('--language', flags.get('language'));
  if (flags.get('overwrite')) argv.push('--overwrite');
  await run(flags.get('python') || 'python3', argv, {capture: false});
  positionals[0] = output;
  await importTranscript();
}

async function captions() {
  const filename = localFile(positionals[0]);
  const plan = await json(filename);
  // Validate the structural edit before deriving captions; existing captions may be stale after a cut.
  showValidation(validatePlan({...plan, captions: []}, {publicDir: PUBLIC}));
  const transcriptFile = localFile(positionals[1]);
  const content = await fs.readFile(transcriptFile, 'utf8');
  const transcript = /\.(srt|vtt)$/i.test(transcriptFile) ? parseSubtitles(content) : normalizeTranscript(JSON.parse(content));
  const mapped = mapTranscriptToCaptions(transcript, plan.edit.cuts, plan.fps);
  const next = {...plan, captions: mapped.captions, notes: [...(plan.notes ?? []), ...mapped.warnings]};
  showValidation(validatePlan(next, {publicDir: PUBLIC}));
  const destination = flags.get('out') ? path.resolve(flags.get('out')) : filename.replace(/\.json$/i, '') + '.captioned.json';
  if (destination === filename && !flags.get('overwrite')) throw new Error('Use --overwrite when --out is the input plan.');
  if (!flags.get('overwrite')) {
    try { await fs.access(destination); throw new Error(`Output exists: ${destination}. Use --overwrite or another --out.`); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  await writeJson(destination, next);
  console.log(`Mapped ${next.captions.length} captions through ${plan.edit.cuts.length} cut(s): ${destination}`);
}

async function prepareRender(plan) {
  const {bundle} = await import('@remotion/bundler');
  const renderer = await import('@remotion/renderer');
  console.log('Bundling deterministic animation composition…');
  const serveUrl = await bundle({entryPoint: path.join(ROOT, 'src', 'index.ts'), publicDir: PUBLIC});
  const composition = await renderer.selectComposition({serveUrl, id: 'SplitScreen', inputProps: {plan}, timeoutInMilliseconds: 60000});
  return {serveUrl, composition, renderer};
}

const escapeHtml = text => String(text).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
async function createStoryboard(plan, dir, prepared) {
  const stillDir = path.join(dir, 'stills');
  await fs.mkdir(stillDir, {recursive: true});
  const entries = [];
  // Sample all beats; avoid silently omitting content from the editorial review.
  for (let i = 0; i < plan.beats.length; i++) {
    const beat = plan.beats[i];
    const frame = beat.from + Math.min(beat.durationInFrames - 1, Math.max(0, Math.round(beat.durationInFrames * 0.55)));
    const filename = `beat-${String(i + 1).padStart(3, '0')}.png`;
    await prepared.renderer.renderStill({serveUrl: prepared.serveUrl, composition: prepared.composition, inputProps: {plan}, output: path.join(stillDir, filename), frame, scale: 0.5, imageFormat: 'png'});
    entries.push({beat: beat.id, frame, seconds: frame / plan.fps, file: `stills/${filename}`, headline: beat.headline, rationale: beat.rationale});
  }
  const {ffmpeg} = await binaries();
  // Paginate the contact sheets to keep image dimensions practical even for long videos.
  const sheets = [];
  for (let start = 0; start < entries.length; start += 12) {
    const count = Math.min(12, entries.length - start);
    const sheet = start === 0 ? 'contact-sheet.jpg' : `contact-sheet-${Math.floor(start / 12) + 1}.jpg`;
    await run(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-n', '-start_number', String(start + 1), '-i', path.join(stillDir, 'beat-%03d.png'), '-vf', `scale=270:480,tile=${Math.min(4, count)}x${Math.ceil(count / 4)}:nb_frames=${count}:padding=10:margin=10:color=0x111319`, '-frames:v', '1', '-q:v', '3', path.join(dir, sheet)]);
    sheets.push(sheet);
  }
  await writeJson(path.join(dir, 'storyboard.json'), {title: plan.title, sheets, entries});
  await fs.writeFile(path.join(dir, 'storyboard.html'), `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(plan.title)} — storyboard</title><style>body{font:16px system-ui;background:#101318;color:#f6f8fa;margin:32px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:24px}article{max-width:400px}img{width:100%;border-radius:14px}p{color:#a7afbc;line-height:1.5}</style><h1>${escapeHtml(plan.title)}</h1><p>Review crop, captions, factual accuracy, text fit, pacing and visual relevance. Stills do not verify motion or audio.</p><main>${entries.map(entry => `<article><img src="${entry.file}" alt="${escapeHtml(entry.headline)}"><h2>${escapeHtml(entry.beat)} · ${entry.seconds.toFixed(2)}s</h2><p>${escapeHtml(entry.rationale)}</p></article>`).join('')}</main></html>`);
  return entries;
}

async function storyboard() {
  const {filename, plan, validation} = await loadPlan(positionals[0]);
  const dir = await outputDirectory(filename);
  const prepared = await prepareRender(plan);
  const entries = await createStoryboard(plan, dir, prepared);
  await writeJson(path.join(dir, 'qa.json'), {status: 'requires-visual-review', validation, stillCount: entries.length, generatedAt: new Date().toISOString()});
  console.log(`Storyboard: ${path.join(dir, 'storyboard.html')}\nContact sheet: ${path.join(dir, 'contact-sheet.jpg')}`);
}

async function render() {
  const {filename, plan, validation} = await loadPlan(positionals[0]);
  const source = await probe(publicAssetPath(PUBLIC, plan.source.path));
  const video = source.streams.find(s => s.codec_type === 'video');
  const realFrames = Number(video?.nb_frames) || Math.round(Number(video?.duration || source.format.duration) * plan.fps);
  if (!video || Math.abs(realFrames - plan.source.durationInFrames) > 1) throw new Error('Plan source duration does not match the media. Use ingest metadata for source fields.');
  const rateParts = String(video.avg_frame_rate).split('/').map(Number);
  const sourceFps = rateParts.length === 2 ? rateParts[0] / rateParts[1] : rateParts[0];
  const sourceSeconds = Number(video.duration || source.format.duration);
  if (Math.abs(sourceFps - 30) > 0.01 || !Number.isFinite(sourceFps) || Math.abs(sourceSeconds * 30 - realFrames) > 1) throw new Error('Source must be normalized to constant 30 fps. Use the ingest command first.');
  if (video.width !== plan.source.width || video.height !== plan.source.height) throw new Error('Plan source dimensions do not match the media.');
  if (source.streams.some(s => s.codec_type === 'audio') !== plan.source.hasAudio) throw new Error('Plan hasAudio does not match the source media.');
  const dir = await outputDirectory(filename);
  const draft = Boolean(flags.get('draft'));
  const output = path.join(dir, draft ? 'draft.mp4' : 'final.mp4');
  try { await fs.access(output); throw new Error(`Render output exists: ${output}. Choose another --out directory.`); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  await writeJson(path.join(dir, 'edit-plan.json'), plan);
  const prepared = await prepareRender(plan);
  let last = -1;
  await prepared.renderer.renderMedia({serveUrl: prepared.serveUrl, composition: prepared.composition, inputProps: {plan}, codec: 'h264', outputLocation: output, scale: draft ? 0.5 : 1, crf: draft ? 25 : 18, pixelFormat: 'yuv420p', concurrency: Math.max(1, Math.min(4, os.availableParallelism?.() ?? os.cpus().length)), onProgress: ({progress}) => {
    const bucket = Math.floor(progress * 10);
    if (bucket > last) { console.log(`Rendering ${Math.min(100, bucket * 10)}%`); last = bucket; }
  }});
  const exported = await probe(output);
  const stream = exported.streams.find(s => s.codec_type === 'video');
  const expectedDuration = validation.durationInFrames / plan.fps;
  const actualDuration = Number(stream?.duration || exported.format.duration);
  const rate = String(stream?.avg_frame_rate).split('/').map(Number);
  const actualFps = rate.length === 2 ? rate[0] / rate[1] : rate[0];
  const checks = {duration: Math.abs(actualDuration - expectedDuration) < 2 / plan.fps, frameCount: Number(stream?.nb_frames) === validation.durationInFrames, fps: Math.abs(actualFps - 30) < 0.01, dimensions: stream?.width === (draft ? 540 : 1080) && stream?.height === (draft ? 960 : 1920), audioPresent: exported.streams.some(s => s.codec_type === 'audio'), codec: stream?.codec_name};
  const audioExpected = plan.source.hasAudio || Boolean(plan.audio?.music || plan.audio?.effects?.length);
  const technicalPass = checks.duration && checks.frameCount && checks.fps && checks.dimensions && (!audioExpected || checks.audioPresent) && checks.codec === 'h264';
  let audioLevels = null;
  if (checks.audioPresent) {
    const {ffmpeg} = await binaries();
    const analysis = await run(ffmpeg, ['-hide_banner', '-nostats', '-i', output, '-vn', '-af', 'volumedetect', '-f', 'null', '-'], {includeStderr: true});
    const mean = analysis.stderr.match(/mean_volume:\s*([\d.-]+) dB/);
    const peak = analysis.stderr.match(/max_volume:\s*([\d.-]+) dB/);
    audioLevels = {meanDbfs: mean ? Number(mean[1]) : null, peakDbfs: peak ? Number(peak[1]) : null, note: 'Peak and average level measurement only. Review speech clarity and music balance by listening.'};
    if (audioLevels.peakDbfs !== null && audioLevels.peakDbfs >= -0.1) validation.warnings.push('Audio peaks reach full scale. Listen for clipping and lower source/music/effect levels if needed.');
  }
  await writeJson(path.join(dir, 'qa.json'), {status: technicalPass ? 'technical-pass-requires-human-review' : 'technical-failure', checks, audioLevels, expectedDurationSeconds: expectedDuration, actualDurationSeconds: actualDuration, validation, generatedAt: new Date().toISOString(), review: ['Watch the full export with sound. Listen for clipping and check speech/music balance.', 'Verify speaker crop and caption accuracy.', 'Check legibility, timing, visual meaning, factual claims and numbers.']});
  if (!technicalPass) throw new Error(`Export failed technical QA. Review ${path.join(dir, 'qa.json')}`);
  console.log(`Export ready: ${output}\nTechnical QA: ${path.join(dir, 'qa.json')}\nWatch the complete export before publishing.`);
}

const usage = `Split-screen editor\n\n  doctor [--browser download] [--python python3]\n  ingest <local-video> --job <slug>\n  transcript <json|srt|vtt> --job <slug> [--overwrite]\n  transcribe --job <slug> [--model small] [--language en] [--python path] [--overwrite]\n  captions <plan.json> <source-transcript> [--out plan.captioned.json] [--overwrite]\n  validate <plan.json>\n  storyboard <plan.json> [--out directory]\n  render <plan.json> [--draft] [--out directory]\n\nPaths are relative to your current directory. Media paths inside plans are relative to this project's public/.\n`;

try {
  switch (command) {
    case 'doctor': await doctor(); break;
    case 'ingest': await ingest(); break;
    case 'transcript': await importTranscript(); break;
    case 'transcribe': await transcribe(); break;
    case 'captions': await captions(); break;
    case 'validate': {
      const {validation} = await loadPlan(positionals[0]);
      console.log(`Plan valid: ${validation.durationInFrames} frames (${(validation.durationInFrames / 30).toFixed(2)}s).`);
      break;
    }
    case 'storyboard': await storyboard(); break;
    case 'render': await render(); break;
    case undefined: case 'help': case '--help': console.log(usage); break;
    default: throw new Error(`Unknown command: ${command}\n${usage}`);
  }
} catch (error) {
  console.error(`\n${error.message}`);
  process.exitCode = 1;
}
