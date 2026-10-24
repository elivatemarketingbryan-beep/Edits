import test from 'node:test';
import assert from 'node:assert/strict';
import {locateSourceFrame, mapSourceInterval, mapTranscriptToCaptions, outputDuration} from '../lib/timeline.mjs';
import {normalizeTranscript, parseSubtitles} from '../lib/transcript.mjs';

test('cuts map half-open intervals and preserve reordered or repeated source ranges', () => {
  const cuts = [{startFrame: 90, endFrame: 150}, {startFrame: 0, endFrame: 30}, {startFrame: 90, endFrame: 120}];
  assert.equal(outputDuration(cuts), 120);
  assert.equal(locateSourceFrame(cuts, 59), 149);
  assert.equal(locateSourceFrame(cuts, 60), 0);
  assert.equal(locateSourceFrame(cuts, 120), null);
  assert.deepEqual(mapSourceInterval(100, 130, cuts), [{startFrame: 10, endFrame: 40}, {startFrame: 100, endFrame: 120}]);
});

test('real word timestamps follow removed source sections and output cut order', () => {
  const transcript = normalizeTranscript({segments: [{start: 0, end: 4, text: 'one two three four', words: [{start: 0, end: 0.7, word: 'one'}, {start: 1, end: 1.7, word: 'two'}, {start: 2, end: 2.7, word: 'three'}, {start: 3, end: 3.7, word: 'four'}]}]});
  const {captions, warnings} = mapTranscriptToCaptions(transcript, [{startFrame: 60, endFrame: 120}, {startFrame: 0, endFrame: 30}]);
  assert.deepEqual(captions.map(c => c.text), ['three four', 'one']);
  assert.deepEqual(captions[0].words[0], {startFrame: 0, endFrame: 21, text: 'three'});
  assert.deepEqual(captions[1].words[0], {startFrame: 60, endFrame: 81, text: 'one'});
  assert.equal(warnings.length, 0);
});

test('SRT import preserves phrase timing and flags cuts across phrases', () => {
  const transcript = parseSubtitles('1\n00:00:01,250 --> 00:00:03,000\nHello <i>world</i>.\n');
  assert.equal(transcript.timing, 'phrase');
  assert.equal(transcript.segments[0].start, 1.25);
  const {captions, warnings} = mapTranscriptToCaptions(transcript, [{startFrame: 60, endFrame: 120}]);
  assert.equal(captions[0].text, 'Hello world.');
  assert.equal(captions[0].words, undefined);
  assert.equal(captions[0].startFrame, 0);
  assert.equal(captions[0].endFrame, 30);
  assert.equal(warnings.length, 1);
});

test('top-level words are retained when transcript has segment text too', () => {
  const transcript = normalizeTranscript({segments: [{start: 0, end: 2, text: 'Hello world'}], words: [{start: 0, end: 0.5, word: 'Hello'}, {start: 0.7, end: 1.2, word: 'world'}]});
  assert.equal(transcript.timing, 'word');
  assert.equal(transcript.segments[0].words[1].text, 'world');
});

test('invalid or overlapping transcription timing is rejected', () => {
  assert.throws(() => normalizeTranscript({segments: [{start: 0, end: 2, text: 'one'}, {start: 1, end: 3, text: 'two'}]}), /Overlapping/);
  assert.throws(() => normalizeTranscript({segments: [null]}), /must be an object/);
  assert.throws(() => normalizeTranscript({segments: [{start: 0, end: 1, text: 'one', words: [{start: 0, end: 2, text: 'one'}]}]}), /Invalid word/);
});

test('cuts that slice a word issue an explicit editorial warning', () => {
  const transcript = normalizeTranscript({segments: [{start: 0, end: 1, text: 'Alphabet', words: [{start: 0, end: 1, text: 'Alphabet'}]}]});
  const mapped = mapTranscriptToCaptions(transcript, [{startFrame: 15, endFrame: 30}]);
  assert.match(mapped.warnings[0], /spoken word/);
});
