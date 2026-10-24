import path from 'node:path';
import fs from 'node:fs';
import {outputDuration} from './timeline.mjs';

const integer = value => Number.isSafeInteger(value);
const positive = value => integer(value) && value > 0;
const text = value => typeof value === 'string' && value.trim().length > 0;
const array = value => Array.isArray(value) && value.length > 0;
const unit = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);

export function publicAssetPath(publicDir, assetPath) {
  if (typeof assetPath !== 'string' || !assetPath || /^[a-z][a-z\d+.-]*:/i.test(assetPath) || assetPath.includes('\\') || path.isAbsolute(assetPath) || assetPath.includes('\0')) throw new Error('Asset paths must be local paths relative to public/.');
  const base = path.resolve(publicDir);
  const target = path.resolve(base, assetPath);
  if (target === base || !target.startsWith(base + path.sep)) throw new Error('Asset path escapes public/.');
  if (fs.existsSync(target)) {
    const realBase = fs.realpathSync(base);
    const realTarget = fs.realpathSync(target);
    if (!realTarget.startsWith(realBase + path.sep)) throw new Error('Asset symlink escapes public/.');
    if (!fs.statSync(target).isFile()) throw new Error('Asset path must point to a file.');
  }
  return target;
}

export function validatePlan(plan, {publicDir = path.resolve('public'), requireFiles = true, customComponents} = {}) {
  const errors = [];
  const warnings = [];
  const check = (condition, message) => { if (!condition) errors.push(message); };
  const asset = (value, label) => {
    try {
      const target = publicAssetPath(publicDir, value);
      if (requireFiles && !fs.existsSync(target)) errors.push(`${label} does not exist: ${value}`);
    } catch (error) { errors.push(`${label}: ${error.message}`); }
  };
  if (!object(plan)) return {errors: ['Plan must be an object.'], warnings, durationInFrames: 0};
  check(plan.version === 1, 'version must be 1.');
  check(text(plan.title), 'title must be nonempty.');
  check(plan.fps === 30, 'fps must be 30.');
  check(plan.width === 1080 && plan.height === 1920, 'Canvas must be 1080 × 1920.');
  check(plan.notes === undefined || (Array.isArray(plan.notes) && plan.notes.every(note => typeof note === 'string')), 'notes must be an array of strings when supplied.');
  const source = plan.source ?? {};
  asset(source.path, 'source.path');
  check(positive(source.durationInFrames), 'source.durationInFrames must be a positive integer.');
  check(positive(source.width) && positive(source.height), 'Source dimensions must be positive integers.');
  check(typeof source.hasAudio === 'boolean', 'source.hasAudio must be boolean.');
  if (source.hasAudio === false && !plan.audio?.music && !plan.audio?.effects?.length) warnings.push('Source has no audio and no soundtrack is configured. The export will be silent unless a custom component adds audio.');
  check(typeof plan.brand?.name === 'string', 'brand.name must be a string; use an empty string for no brand label.');
  for (const color of ['accent', 'background', 'surface', 'text', 'muted']) check(/^#[\da-f]{6}$/i.test(plan.brand?.[color] ?? ''), `brand.${color} must be a six-digit hex color.`);
  const cuts = Array.isArray(plan.edit?.cuts) ? plan.edit.cuts : [];
  check(cuts.length > 0, 'edit.cuts needs at least one retained range.');
  for (const [i, cut] of cuts.entries()) {
    if (!object(cut)) { errors.push(`Cut ${i + 1} must be an object.`); continue; }
    check(integer(cut.startFrame) && cut.startFrame >= 0 && positive(cut.endFrame) && cut.endFrame > cut.startFrame, `Cut ${i + 1} has an invalid half-open frame range.`);
    check(cut.endFrame <= source.durationInFrames, `Cut ${i + 1} extends past the source.`);
    check(text(cut.reason), `Cut ${i + 1} needs an editorial reason.`);
  }
  const durationInFrames = outputDuration(cuts.filter(cut => object(cut) && integer(cut.startFrame) && integer(cut.endFrame)));
  const beats = Array.isArray(plan.beats) ? plan.beats : [];
  check(beats.length > 0, 'beats needs at least one beat.');
  let cursor = 0;
  const ids = new Set();
  for (const [i, beat] of beats.entries()) {
    const label = `Beat ${i + 1}`;
    if (!object(beat)) { errors.push(`${label} must be an object.`); continue; }
    check(text(beat.id) && !ids.has(beat.id), `${label} needs a unique nonempty id.`);
    ids.add(beat.id);
    check(integer(beat.from) && beat.from === cursor, `${label} must start at ${cursor}; beats must be ordered and gap-free.`);
    check(positive(beat.durationInFrames), `${label} durationInFrames must be a positive integer.`);
    cursor = beat.from + beat.durationInFrames;
    check(['split', 'speaker', 'graphic'].includes(beat.layout), `${label} has an unknown layout.`);
    check(typeof beat.headline === 'string', `${label} headline must be a string.`);
    check(beat.kicker === undefined || typeof beat.kicker === 'string', `${label} kicker must be a string.`);
    if (beat.layout !== 'speaker') check(text(beat.headline), `${label} needs a headline for this layout.`);
    check(text(beat.rationale), `${label} needs an editorial rationale.`);
    check(beat.splitRatio === undefined || (typeof beat.splitRatio === 'number' && beat.splitRatio >= 0.3 && beat.splitRatio <= 0.7), `${label} splitRatio must be between 0.3 and 0.7.`);
    check(beat.focalPoint === undefined || (unit(beat.focalPoint?.x) && unit(beat.focalPoint?.y)), `${label} focalPoint coordinates must be between 0 and 1.`);
    check(beat.captionY === undefined || unit(beat.captionY), `${label} captionY must be between 0 and 1.`);
    check(beat.mediaFit === undefined || ['cover', 'contain'].includes(beat.mediaFit), `${label} mediaFit must be cover or contain.`);
    check(beat.graphicMode === undefined || ['framed', 'canvas'].includes(beat.graphicMode), `${label} graphicMode must be framed or canvas.`);
    check(beat.graphicMode !== 'canvas' || beat.visual?.type === 'custom', `${label} canvas mode requires a custom component that composes the full panel.`);
    check(beat.backdrop === undefined || ['plain', 'grid', 'soft'].includes(beat.backdrop), `${label} backdrop must be plain, grid, or soft.`);
    if (typeof beat.headline === 'string' && beat.headline.length > 65) warnings.push(`${label} has a long headline. Rewrite or render-check wrapping before final export.`);
    if (beat.layout === 'split' && (beat.splitRatio ?? .5) < .42) warnings.push(`${label} has a small graphic panel. Inspect text size and scene density carefully.`);
    if (beat.captionY !== undefined && (beat.captionY < .08 || beat.captionY > .88)) warnings.push(`${label} places captions close to a platform UI/edge zone. Inspect the exported frame.`);
    if (beat.colors !== undefined) {
      check(object(beat.colors), `${label} colors must be an object.`);
      if (object(beat.colors)) for (const [key, value] of Object.entries(beat.colors)) check(key === 'name' ? text(value) : ['accent', 'background', 'surface', 'text', 'muted'].includes(key) && /^#[\da-f]{6}$/i.test(value), `${label} colors.${key} must be a supported six-digit hex color (or nonempty brand name).`);
    }
    const visual = beat.visual ?? {};
    switch (visual.type) {
      case 'word':
        check(visual.word === undefined || typeof visual.word === 'string', `${label} word must be text.`);
        check(visual.subtext === undefined || typeof visual.subtext === 'string', `${label} subtext must be text.`);
        break;
      case 'steps':
        check(array(visual.items) && visual.items.every(item => text(item) || (text(item?.title) && (item.detail === undefined || typeof item.detail === 'string'))), `${label} steps requires nonempty items with titles and optional text details.`);
        if (visual.items?.length > 5) warnings.push(`${label} has more than five steps; consider two beats for mobile readability.`);
        break;
      case 'comparison':
        for (const side of ['left', 'right']) check(text(visual[side]?.title) && array(visual[side]?.items) && visual[side].items.every(text), `${label} comparison.${side} requires a title and text items.`);
        break;
      case 'diagram': {
        check(array(visual.nodes) && visual.nodes.every(node => object(node) && text(node.id) && text(node.label) && (node.x === undefined || unit(node.x)) && (node.y === undefined || unit(node.y))), `${label} diagram requires labelled nodes with optional normalized positions.`);
        const nodeIds = new Set((Array.isArray(visual.nodes) ? visual.nodes : []).filter(object).map(n => n.id));
        check(nodeIds.size === visual.nodes?.length, `${label} diagram node ids must be unique.`);
        check(Array.isArray(visual.edges) && visual.edges.every(edge => object(edge) && nodeIds.has(edge.from) && nodeIds.has(edge.to) && (edge.label === undefined || typeof edge.label === 'string')), `${label} diagram edges must connect existing node ids and have optional text labels.`);
        break;
      }
      case 'bars':
        check(array(visual.items) && visual.items.every(item => object(item) && text(item.label) && typeof item.value === 'number' && Number.isFinite(item.value) && item.value >= 0), `${label} bars requires labelled nonnegative numeric values.`);
        check(visual.max === undefined || (typeof visual.max === 'number' && Number.isFinite(visual.max) && visual.max > 0 && Array.isArray(visual.items) && visual.items.every(item => object(item) && item.value <= visual.max)), `${label} bars.max must be positive and contain every value.`);
        check(visual.unit === undefined || typeof visual.unit === 'string', `${label} bars.unit must be text.`);
        check(visual.sourceLabel === undefined || typeof visual.sourceLabel === 'string', `${label} bars.sourceLabel must be text.`);
        if (!visual.sourceLabel) warnings.push(`${label} bars has no sourceLabel; verify every number and record its source in the off-screen job notes.`);
        break;
      case 'checklist':
        check(array(visual.items) && visual.items.every(item => text(item) || (text(item?.text) && (item.checked === undefined || typeof item.checked === 'boolean'))), `${label} checklist requires text items.`);
        break;
      case 'quote':
        check(text(visual.text), `${label} quote requires text.`);
        check(visual.attribution === undefined || typeof visual.attribution === 'string', `${label} quote attribution must be text.`);
        break;
      case 'image':
        asset(visual.src, `${label} image.src`);
        check(visual.caption === undefined || typeof visual.caption === 'string', `${label} image caption must be text.`);
        check(visual.alt === undefined || typeof visual.alt === 'string', `${label} image alt must be text.`);
        break;
      case 'custom':
        check(text(visual.component), `${label} custom visual requires a registered component name.`);
        if (customComponents) check(customComponents.includes(visual.component), `${label} custom component is not registered: ${visual.component}`);
        else warnings.push(`${label} uses custom component ${visual.component}; ensure it is registered in src/custom/registry.tsx.`);
        check(visual.props === undefined || (visual.props !== null && typeof visual.props === 'object' && !Array.isArray(visual.props)), `${label} custom props must be an object.`);
        break;
      default: errors.push(`${label} has unknown visual type: ${visual.type}`);
    }
  }
  check(cursor === durationInFrames, `Beats end at ${cursor}, but retained cuts total ${durationInFrames} frames.`);
  check(Array.isArray(plan.captions), 'captions must be an array.');
  let captionEnd = 0;
  for (const [i, caption] of (Array.isArray(plan.captions) ? plan.captions : []).entries()) {
    const label = `Caption ${i + 1}`;
    if (!object(caption)) { errors.push(`${label} must be an object.`); continue; }
    check(integer(caption.startFrame) && positive(caption.endFrame) && caption.startFrame >= captionEnd && caption.endFrame > caption.startFrame && caption.endFrame <= durationInFrames, `${label} must be ordered, nonoverlapping and inside the output timeline.`);
    check(text(caption.text), `${label} text must be nonempty.`);
    captionEnd = caption.endFrame;
    let wordEnd = caption.startFrame;
    if (caption.words !== undefined) {
      check(array(caption.words), `${label} words must be a nonempty array when supplied.`);
      if (Array.isArray(caption.words) && caption.words.every(word => object(word) && text(word.text))) check(caption.words.map(word => word.text.trim()).join(' ').replace(/\s+/g, ' ') === String(caption.text).trim().replace(/\s+/g, ' '), `${label} text must match its joined words. Correct both fields together.`);
      for (const word of Array.isArray(caption.words) ? caption.words : []) {
        if (!object(word)) { errors.push(`${label} word must be an object.`); continue; }
        check(integer(word.startFrame) && positive(word.endFrame) && word.startFrame >= wordEnd && word.endFrame > word.startFrame && word.endFrame <= caption.endFrame && text(word.text), `${label} word timings must be ordered and inside the caption.`);
        wordEnd = word.endFrame;
      }
    }
  }
  if (source.hasAudio && !plan.captions?.length) warnings.push('No captions supplied. Review whether the spoken content needs captions.');
  check(plan.captionStyle === undefined || ['box', 'word', 'small', 'highlight', 'stack', 'pill', 'pop'].includes(plan.captionStyle), 'captionStyle must be box, word, small, highlight, stack, pill or pop.');
  check(plan.questions === undefined || (Array.isArray(plan.questions) && plan.questions.every(q => Number.isFinite(q.from) && Number.isFinite(q.to) && q.to > q.from && typeof q.label === 'string' && typeof q.text === 'string')), 'questions must be {from, to > from, label, text} items.');
  check(plan.emphasis === undefined || (Array.isArray(plan.emphasis) && plan.emphasis.every(w => typeof w === 'string')), 'emphasis must be a list of words.');
  if (plan.captionStyle === 'word' && plan.captions?.some(c => !c.words?.length)) warnings.push('captionStyle word shows whole phrases for captions without word timings.');
  if (plan.audio !== undefined) {
    check(object(plan.audio), 'audio must be an object.');
    if (plan.audio?.music !== undefined) {
      asset(plan.audio.music?.src, 'audio.music.src');
      check(unit(plan.audio.music?.volume), 'audio.music.volume must be between 0 and 1.');
    }
    if (plan.audio?.effects !== undefined) {
      check(Array.isArray(plan.audio.effects), 'audio.effects must be an array.');
      for (const [i, effect] of (Array.isArray(plan.audio.effects) ? plan.audio.effects : []).entries()) {
        asset(effect?.src, `Audio effect ${i + 1} src`);
        check(unit(effect?.volume), `Audio effect ${i + 1} volume must be between 0 and 1.`);
        check(integer(effect?.atFrame) && effect.atFrame >= 0 && effect.atFrame < durationInFrames, `Audio effect ${i + 1} atFrame must be inside the output timeline.`);
      }
    }
  }
  if (beats.some(beat => beat?.headline === '[WRITE A CONTENT-SPECIFIC HEADLINE]')) errors.push('Replace the scaffold headline with an editorial decision before rendering.');
  return {errors, warnings, durationInFrames};
}
