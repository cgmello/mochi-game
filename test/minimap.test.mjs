import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GOAL,
  ISLANDS,
  bridgeSolids,
  fightSpots,
  mapForward,
  mapMarkerAngle,
  onIsland,
  whichIsland,
} from '../src/game/phase2layout.js';

test('minimap marker points where Mochi is facing', () => {
  assert.equal(mapMarkerAngle(0), 0);
  const north = mapForward(0);
  assert.ok(north.y < 0);
  assert.ok(Math.abs(north.x) < 1e-6);
  const east = mapForward(Math.PI / 2);
  assert.ok(east.x > 0.9);
  assert.ok(Math.abs(east.y) < 1e-6);
  assert.ok(mapMarkerAngle(Math.PI / 2) > 0);
  const west = mapForward(-Math.PI / 2);
  assert.ok(west.x < -0.9);
});

test('the course is 45 conflicts across three linked islands', () => {
  assert.equal(GOAL, 45);
  assert.equal(ISLANDS.length, 3);
  const spots = fightSpots();
  assert.equal(spots.length, 45);
  for (const isle of ISLANDS) {
    const n = spots.filter((s) => s.island === isle.index).length;
    assert.ok(n >= 10 && n <= 20, `${isle.name} has ${n}`);
  }
  const bridges = bridgeSolids();
  assert.equal(bridges.length, 2);
  const gap = { x: (ISLANDS[0].cx + ISLANDS[1].cx) / 2, z: 0 };
  assert.equal(onIsland(gap.x, gap.z), false);
  assert.equal(whichIsland(gap.x, gap.z), null);
  const deck = bridges[0];
  assert.ok(Math.abs(gap.x - deck.x) <= deck.hw);
  assert.ok(Math.abs(gap.z - deck.z) <= deck.hd);
  assert.equal(ISLANDS[0].name, 'Contract Market');
  assert.equal(ISLANDS[1].name, 'Oracle Port');
  assert.equal(ISLANDS[2].name, 'Rally Square');
});
