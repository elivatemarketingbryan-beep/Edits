import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';
import ffmpeg from 'ffmpeg-static';
import {spawnSync} from 'node:child_process';
import {mkdir, mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const temp = await mkdtemp(path.join(tmpdir(), 'split-screen-demo-'));
try {
  await mkdir(path.join(root, 'public/demo'), {recursive: true});
  await mkdir(path.join(root, 'examples/demo'), {recursive: true});
  // The plan is plain data exported in TypeScript; transpile locally using TS.
  const {transpileModule, ModuleKind} = await import('typescript');
  const source = await readFile(path.join(root, 'src/demo.ts'), 'utf8');
  const js = transpileModule(source, {compilerOptions: {module: ModuleKind.ESNext}}).outputText;
  const {demoPlan} = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
  await writeFile(path.join(root, 'examples/demo/plan.json'), JSON.stringify(demoPlan, null, 2) + '\n');
  console.log('Rendering original procedural demo source…');
  const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts'), outDir: path.join(temp, 'bundle'), publicDir: path.join(root, 'public')});
  const composition = await selectComposition({serveUrl, id: 'SourceFixture'});
  await renderMedia({serveUrl, composition, codec: 'h264', outputLocation: path.join(temp, 'silent.mp4'), concurrency: 2, crf: 20});
  const result = spawnSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-i', path.join(temp, 'silent.mp4'), '-f', 'lavfi', '-i', 'sine=frequency=220:sample_rate=48000:duration=14', '-filter:a', 'volume=0.03,afade=t=in:d=0.3,afade=t=out:st=13.7:d=0.3', '-c:v', 'copy', '-c:a', 'aac', '-shortest', '-movflags', '+faststart', path.join(root, 'public/demo/source.mp4')], {stdio: 'inherit'});
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`FFmpeg failed (${result.status}).`);
  console.log('Demo ready. Run npm run demo:render or npm run studio. Source audio is a quiet test tone, not narration.');
} finally { await rm(temp, {recursive: true, force: true}); }
