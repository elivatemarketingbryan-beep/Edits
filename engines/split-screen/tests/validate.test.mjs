import test from 'node:test';
import assert from 'node:assert/strict';
import {validatePlan, publicAssetPath} from '../lib/validate.mjs';

function plan() {
  return {version: 1, title: 'A test edit', fps: 30, width: 1080, height: 1920, source: {path: 'jobs/test/source.mp4', durationInFrames: 300, width: 1920, height: 1080, hasAudio: true}, brand: {name: 'Test', accent: '#ffee22', background: '#101010', surface: '#202020', text: '#ffffff', muted: '#bbbbbb'}, edit: {cuts: [{startFrame: 30, endFrame: 90, reason: 'Retain the explanation.'}, {startFrame: 150, endFrame: 210, reason: 'Retain the example.'}]}, beats: [{id: 'a', from: 0, durationInFrames: 60, layout: 'split', headline: 'One idea', visual: {type: 'word', word: 'One'}, rationale: 'Give the idea space.'}, {id: 'b', from: 60, durationInFrames: 60, layout: 'speaker', headline: '', visual: {type: 'word'}, rationale: 'Show the speaker reaction.'}], captions: [{startFrame: 0, endFrame: 20, text: 'Hello world', words: [{startFrame: 0, endFrame: 10, text: 'Hello'}, {startFrame: 10, endFrame: 20, text: 'world'}]}]};
}
const validate = data => validatePlan(data, {requireFiles: false});

test('valid plan accounts for all retained frames and accepts silent media', () => {
  const data = plan();
  assert.deepEqual(validate(data).errors, []);
  assert.equal(validate(data).durationInFrames, 120);
  data.source.hasAudio = false;
  data.captions = [];
  assert.deepEqual(validate(data).errors, []);
  assert.match(validate(data).warnings[0], /silent/);
});

test('invalid gaps, overlaps, source bounds, caption order and coverage fail', () => {
  for (const change of [p => {p.beats[1].from = 61;}, p => {p.beats[1].from = 59;}, p => {p.edit.cuts[1].endFrame = 301;}, p => {p.captions.push({startFrame: 15, endFrame: 25, text: 'overlap'});}, p => {p.beats[1].durationInFrames = 59;}]) {
    const data = plan(); change(data);
    assert.ok(validate(data).errors.length > 0);
  }
});

test('malformed AI JSON returns errors instead of throwing', () => {
  const mutations = [p => {p.captions = 'broken';}, p => {p.beats = [null];}, p => {p.edit.cuts = [null];}, p => {p.beats[0].visual = {type: 'diagram', nodes: {}, edges: [null]};}, p => {p.beats[0].visual = {type: 'bars', items: [null], max: 1};}, p => {p.captions[0].words = [null];}, p => {p.audio = {effects: [null]};}];
  for (const change of mutations) {
    const data = plan(); change(data);
    assert.doesNotThrow(() => validate(data));
    assert.ok(validate(data).errors.length > 0);
  }
});

test('media file paths cannot point outside public or to remote content', () => {
  for (const value of ['../secret.mp4', '/tmp/secret.mp4', 'https://example.com/video.mp4', 'file:///tmp/test.mp4', 'jobs\\test.mp4']) assert.throws(() => publicAssetPath('/tmp/public', value));
});

test('caption text and word text must agree so corrections appear in the render', () => {
  const data = plan();
  data.captions[0].text = 'Hello corrected';
  assert.ok(validate(data).errors.some(error => error.includes('match its joined words')));
});

test('audio soundtrack fields and timing are validated on silent footage', () => {
  const data = plan(); data.source.hasAudio = false;
  data.audio = {music: {src: 'music.wav', volume: 0.12}, effects: [{src: 'tap.wav', atFrame: 20, volume: 0.4}]};
  assert.deepEqual(validate(data).errors, []);
  data.audio.effects[0].atFrame = 120;
  data.audio.music.volume = 2;
  assert.equal(validate(data).errors.length, 2);
});

test('full graphic canvas is reserved for authored custom scenes and backdrop choices are validated', () => {
  const data = plan();
  data.beats[0].graphicMode = 'canvas';
  assert.ok(validate(data).errors.some(error => error.includes('canvas mode requires a custom')));
  data.beats[0].visual = {type: 'custom', component: 'AuthoredScene'};
  data.beats[0].backdrop = 'plain';
  assert.deepEqual(validate(data).errors, []);
  data.beats[0].backdrop = 'unrecognized';
  assert.ok(validate(data).errors.some(error => error.includes('backdrop')));
  data.beats[0].backdrop = 'grid';
  data.beats[0].graphicMode = 'unrecognized';
  assert.ok(validate(data).errors.some(error => error.includes('graphicMode')));
});
