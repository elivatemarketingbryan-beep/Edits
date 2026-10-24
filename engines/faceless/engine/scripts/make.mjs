#!/usr/bin/env node
// Build + render in one step, stopping early with a clear message if the plan has problems.
//
// Usage: npm --prefix engine run make -- <slug> [--draft]

import path from 'node:path';
import { ROOT } from '../lib/tools.mjs';
import { PlanError } from '../lib/plan.mjs';
import { build, resolveVideo } from './build.mjs';
import { render } from './render.mjs';

const dir = resolveVideo(process.argv[2]);
const draft = process.argv.includes('--draft');
try {
  const { lint } = await build(dir);
  const errs = (lint.findings || []).filter(f => f.severity === 'error');
  if (errs.length) { console.error('\nNot rendering: fix the lint errors above first.'); process.exit(2); }
  console.log(`\nRendering${draft ? ' a draft' : ''}...`);
  const r = await render(dir, { draft });
  console.log(`\n✔ ${path.relative(ROOT, r.out)}  (${r.duration.toFixed(1)} s, rendered in ${r.secs} s)`);
  if (r.problems.length) { console.log(`Checks: ${r.problems.join('; ')}`); process.exit(2); }
  console.log(`Checks: passed (length, audio, no blank frames, ${r.loudness.I} LUFS).`);
  console.log(`Contact sheet: ${path.relative(ROOT, r.sheet)}`);
} catch (e) {
  if (e instanceof PlanError) { console.error('Plan problems:\n' + e.message); process.exit(3); }
  console.error(e.message); process.exit(1);
}
