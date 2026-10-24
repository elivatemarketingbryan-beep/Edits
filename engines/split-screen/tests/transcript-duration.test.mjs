import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeTranscript} from '../lib/transcript.mjs';
import {mapTranscriptToCaptions} from '../lib/timeline.mjs';

test('editor duration export derives segment text and preserves absolute word times', () => {
  const source = {language: 'en-us', segments: [{start: 12.033333333333333, duration: 4.633333333333334, words: [
    {start: 12.093333333333334, duration: 0.12, text: 'a', type: 'word'},
    {start: 12.213333333333333, duration: 0.35999999999606325, text: 'completely', type: 'word'},
    {start: 12.573333333329396, duration: 0.24000000000393676, text: 'open', type: 'word'},
    {start: 12.813333333333333, duration: 0.24, text: 'source', type: 'word'},
  ]}]};
  const original = structuredClone(source);
  const normalized = normalizeTranscript(source);
  assert.equal(normalized.timing, 'word');
  assert.equal(normalized.language, 'en-us');
  assert.equal(normalized.segments[0].text, 'a completely open source');
  assert.equal(normalized.segments[0].end, source.segments[0].start + source.segments[0].duration);
  for (const [i, word] of normalized.segments[0].words.entries()) {
    assert.equal(word.start, source.segments[0].words[i].start);
    assert.equal(word.end, source.segments[0].words[i].start + source.segments[0].words[i].duration);
  }
  assert.deepEqual(source, original, 'normalization must not mutate user input');
});

test('duration-timed top-level words attach to duration-timed segments', () => {
  const normalized = normalizeTranscript({segments: [{start: 4, duration: 2}], words: [
    {start: 4.25, duration: 0.3, text: 'Hello'},
    {start: 4.6, duration: 0.4, text: 'world.'},
  ]});
  assert.deepEqual(normalized.segments[0], {start: 4, end: 6, text: 'Hello world.', words: [
    {start: 4.25, end: 4.55, text: 'Hello'}, {start: 4.6, end: 5, text: 'world.'},
  ]});
});

test('word-only duration export maps correctly through a source cut', () => {
  const normalized = normalizeTranscript({words: [
    {start: 2, duration: 0.5, text: 'Keep'}, {start: 2.5, duration: 0.5, text: 'me.'},
  ]});
  const mapped = mapTranscriptToCaptions(normalized, [{startFrame: 60, endFrame: 90}], 30);
  assert.equal(normalized.segments[0].end, 3);
  assert.deepEqual(mapped.captions[0].words, [
    {startFrame: 0, endFrame: 15, text: 'Keep'}, {startFrame: 15, endFrame: 30, text: 'me.'},
  ]);
  assert.deepEqual(mapped.warnings, []);
});

test('duration support retains explicit end and phrase timing without inventing words', () => {
  const normalized = normalizeTranscript([{start: 1, end: 3, duration: 99, text: 'Phrase only.'}]);
  assert.equal(normalized.timing, 'phrase');
  assert.deepEqual(normalized.segments[0], {start: 1, end: 3, text: 'Phrase only.'});
});

test('duration exports still reject missing, zero, negative, and overlapping timing', () => {
  for (const duration of [undefined, 0, -1, '1']) {
    assert.throws(() => normalizeTranscript([{start: 0, duration, text: 'invalid'}]), /valid start\/end/);
    assert.throws(() => normalizeTranscript([{start: 0, duration: 2, words: [{start: 0, duration, text: 'invalid'}]}]), /Invalid word/);
  }
  assert.throws(() => normalizeTranscript([{start: 0, duration: 2, words: [
    {start: 0, duration: 1, text: 'one'}, {start: 0.8, duration: 0.5, text: 'two'},
  ]}]), /Overlapping word/);
  assert.throws(() => normalizeTranscript([{start: 0, duration: 1, words: [
    {start: 0.8, duration: 0.5, text: 'outside'},
  ]}]), /Word timing must fit/);
});
