import test from 'node:test';
import assert from 'node:assert/strict';
import {
  initialState,
  transition,
  offsetForPart,
} from '../lib/exploration.mjs';

test('explosion is reversible and does not mutate source coordinates', () => {
  const part = { id: 'cad-000', index: 0, centroid: [-8, -78, 13] };
  assert.deepEqual(offsetForPart(part, 0), [0, 0, 0]);
  const exploded = offsetForPart(part, 1);
  assert.ok(Math.hypot(...exploded) > 40);
  assert.deepEqual(offsetForPart(part, 0), [0, 0, 0]);
  assert.deepEqual(part.centroid, [-8, -78, 13]);
});
test('switching stages clamps to the guide and stops playback', () => {
  const state = transition(
    { ...initialState, playing: true, isolated: true, selected: 'cad-001' },
    { type: 'stage', value: 99 },
  );
  assert.equal(state.stage, 8);
  assert.equal(state.playing, false);
  assert.equal(state.isolated, false);
  assert.equal(transition(state, { type: 'stage', value: -3 }).stage, 0);
});
test('manual slider clamps the range and stops playback', () => {
  assert.equal(
    transition({ ...initialState, playing: true }, { type: 'amount', value: 5 })
      .amount,
    1,
  );
  assert.equal(
    transition(
      { ...initialState, playing: true },
      { type: 'amount', value: -2 },
    ).amount,
    0,
  );
  assert.equal(
    transition(
      { ...initialState, playing: true },
      { type: 'amount', value: 0.4 },
    ).playing,
    false,
  );
});
test('selection remains unique when an isolated part is changed', () => {
  const s = transition(
    { ...initialState, selected: 'cad-000', isolated: true },
    { type: 'select', id: 'cad-028' },
  );
  assert.equal(s.selected, 'cad-028');
  assert.equal(s.isolated, true);
  const clear = transition(s, { type: 'select', id: null });
  assert.equal(clear.isolated, false);
});
test('reset clears selection, isolation, playback and exploration history', () => {
  const s = transition(
    {
      ...initialState,
      selected: 'cad-028',
      isolated: true,
      stage: 7,
      amount: 1,
      playing: true,
      completed: [1, 2],
    },
    { type: 'reset' },
  );
  assert.equal(s.amount, 0);
  assert.equal(s.stage, 0);
  assert.equal(s.isolated, false);
  assert.equal(s.selected, null);
  assert.equal(s.playing, false);
  assert.deepEqual(s.completed, []);
  assert.equal(s.cameraRevision, 1);
});
test('playback finishes exactly at each end and reverses correctly', () => {
  const forward = transition(
    { ...initialState, amount: 0.99, playing: true, direction: 1 },
    { type: 'tick', delta: 0.05 },
  );
  assert.equal(forward.amount, 1);
  assert.equal(forward.playing, false);
  const reverse = transition(
    { ...forward, playing: true, direction: -1, amount: 0.01 },
    { type: 'tick', delta: 0.05 },
  );
  assert.equal(reverse.amount, 0);
  assert.equal(reverse.playing, false);
});
test('all battery meshes move together without opening the battery pack', () => {
  const offsets = [2, 3, 4, 5, 6, 7].map((index) =>
    offsetForPart({ index }, 1),
  );
  offsets.forEach((v) => assert.deepEqual(v, offsets[0]));
  assert.ok(offsets[0][1] < -40);
});
test('all nine repeated screw instances remain individually addressable', () => {
  const targets = new Set(
    [25, 26, 27, 28, 29, 30, 31, 32, 33].map((index) =>
      JSON.stringify(offsetForPart({ index }, 1)),
    ),
  );
  assert.equal(targets.size, 9);
});
test('navigating to another stage restores a useful camera after focusing a tiny part', () => {
  const state = transition(
    { ...initialState, cameraRevision: 3, selected: 'cad-029' },
    { type: 'stage', value: 5 },
  );
  assert.equal(state.cameraRevision, 4);
});
test('a global explosion jump exits isolation in reduced-motion mode', () => {
  for (const value of [0, 1]) {
    const result = transition(
      { ...initialState, amount: 0.5, isolated: true, selected: 'cad-029' },
      { type: 'amount', value },
    );
    assert.equal(result.isolated, false);
    assert.equal(result.amount, value);
    assert.equal(result.playing, false);
  }
});
