import test from 'node:test';
import assert from 'node:assert/strict';
import { bodyTop, obstacleHits, inLane, inDepth, platformSurface } from '../src/game/collision.js';
import { LANES, laneStep } from '../src/game/constants.js';

test('standing body reaches overhead bars', () => {
  const top = bodyTop(0, 0);
  assert.ok(top > 1.5);
  assert.equal(obstacleHits(0, top, 'overhead', 0, 1.02), true);
});

test('a full duck passes under an overhead bar', () => {
  const top = bodyTop(0, 1);
  assert.ok(top < 1.02);
  assert.equal(obstacleHits(0, top, 'overhead', 0, 1.02), false);
});

test('jumping into an overhead bar still hits', () => {
  const top = bodyTop(0.8, 0);
  assert.equal(obstacleHits(0.8, top, 'overhead', 0, 1.02), true);
});

test('feet on the ground trip a low server and a cable', () => {
  assert.equal(obstacleHits(0, 1.68, 'low', 0.82, 0), true);
  assert.equal(obstacleHits(0, 1.68, 'cable', 0.48, 0), true);
});

test('a jump clears low obstacles', () => {
  assert.equal(obstacleHits(1.1, 2.7, 'low', 0.82, 0), false);
  assert.equal(obstacleHits(0.7, 2.3, 'cable', 0.48, 0), false);
});

test('tall racks cannot be jumped', () => {
  assert.equal(obstacleHits(1.4, 3.1, 'tall', 0, 0), true);
  assert.equal(obstacleHits(0, 1.68, 'tall', 0, 0), true);
});

test('right moves toward screen-right, which is -X', () => {
  assert.equal(laneStep(1, 'right'), 0);
  assert.equal(laneStep(1, 'left'), 2);
  assert.equal(LANES[laneStep(1, 'right')], -2.2);
  assert.equal(LANES[laneStep(1, 'left')], 2.2);
  assert.equal(laneStep(0, 'right'), 0);
  assert.equal(laneStep(2, 'left'), 2);
});

test('a ramp is low at the near end and full height on the flat', () => {
  const length = 16;
  const height = 1.85;
  const ramp = 5;
  const front = platformSurface(length / 2, length, height, ramp);
  assert.equal(front, 0);
  const midRamp = platformSurface(length / 2 - ramp / 2, length, height, ramp);
  assert.ok(Math.abs(midRamp - height / 2) < 0.001);
  const deck = platformSurface(0, length, height, ramp);
  assert.equal(deck, height);
  assert.equal(platformSurface(length / 2 + 1, length, height, ramp), null);
});

test('a platform with no ramp is a full-height face', () => {
  assert.equal(platformSurface(3, 8, 1.15, 0), 1.15);
});

test('lane and depth gates', () => {
  assert.equal(inLane(0.2, 0, false, 0.8), true);
  assert.equal(inLane(2.2, 0, false, 0.8), false);
  assert.equal(inLane(9, 0, true, 0.8), true);
  assert.equal(inDepth(0.2, 0.45, 0.32), true);
  assert.equal(inDepth(3, 0.45, 0.32), false);
});
